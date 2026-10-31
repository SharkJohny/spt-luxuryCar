// Podvrh siete pre offline test one page checkoutu (kniha OPC § 7.4). Karta Chromu (tools/test-1v/cdp.mjs) zachytáva
// KAŽDÚ požiadavku (Fetch.requestPaused, vzor "*") a odpovedá zo súborov — do Shoptetu ani tretím stranám neodíde nič.
//
//   www.luxurycardesign.*  GET /kosik/, /objednavka/krok-1/, /objednavka/krok-2/ -> fixtures podľa stavu košíka a platby
//                          GET /objednavka/krok-2/ bez predchádzajúceho Step1Validate -> 302 /objednavka/krok-1/ (skutočné)
//                          POST Step1Validate: XHR -> {"code":303,…} (step1-303.json), formulár -> 302 /objednavka/krok-2/;
//                            zapíše telo a uloží voľbu (doprava, platba) do stavu; scenár: "500" | "limit" | "pomaly" |
//                            "chyby" / neplatná kombinácia (živý tvar: 303 + messages.errors + returnUrl krok 1, session
//                            zruší krok 1) | "chyby-krok2" (umelý: 303 + errors + returnUrl krok 2, session bez zmeny)
//                          GET /objednavka/krok-1/ po Step1Validate: zaškrtnutá platba zo session a „Celkom k úhrade“ v súhrne
//                            kroku 1 = suma súhrnu kroku 2 (✅ krok1-dobierka.html: €13 / 300 Kč ako suhrn-3 / suhrn-87;
//                            krok1.html je zachytený pred Step1Validate a má len tovar)
//                          POST step2CustomerAjax -> {"code":200,"message":null,"messages":[],"payload":[]} (živý tvar 29. 10.,
//                            žiadne HTML — Shoptet súhrn neprekreslí); chýbajúci suhrn-<platba>.html (set, kamión, SK 112) sa poskladá
//                            zo súhrnu predvolenej platby: riadok platby a „Celkom k úhrade“ podľa ceny z kroku 1 (🟡 syntetický)
//                          GET ShoptetValidatePhone -> {"payload":{"isValidForRegion":true,…}} (🟡 tvar z main-3g.js);
//                            scenár telefon: "pomaly" (1,5 s), "pomaly-neplatny", "neplatny", "visi" (T3-L7)
//                          GET ShoptetPayPaymentData/* -> zachytené JSON (scenár banky "500": zoznam bánk 500); POST CustomerCookieConsent -> 200
//                          (rýchla platba cez banku: shoptetPayPisCode z tela = banka v session, s.p.stav.banka; scenár
//                            banka: "<kód>" = session už má banku z klasického kroku 1)
//                          GET /objednavka/dekujeme/ (aj /dakujeme/) -> REKONŠTRUKCIA ďakovnej stránky (scenár dakujeme: kľúč
//                            variantu z dakujeme-fixtures.mjs, obal = fixtures/<web>/krok2.html); bez scenára nečakaná (404)
//                          POST Step2Validate -> ZACHYTIŤ, zapísať celé telo (aj platbu a banku zo session), fiktívna stránka „Objednávka prijatá (TEST)“;
//                            scenár step2 "chyba-raz": prvý raz 302 späť na krok 2 s vyplnenými údajmi (❓ odhad, ako Shoptet
//                            vracia chybu zo servera — overí F4), až druhý raz fiktívna stránka
//                          stav za behu: s.p.stav.platba (iná karta prepla platbu, T5), s.p.stav.priplatok (iné okno zmenilo
//                            košík: tovar aj suma v súhrne kroku 1 a 2 vyššie, T6; p.celkomServera() = suma servera)
//                          scenár: zaciatok "krok2" (session už po Step1Validate), step1 "pomaly" (odpoveď po 1,5 s) alebo
//                            funkcia (poradie, telo) -> "500" | "ok", csrf: true (shoptet.csrf.enabled = true v stránke),
//                            krok1 "visi" (fetch kroku 1 nikdy neodpovie), suhrn "500" (fetch kroku 1 aj 2 na pozadí vrátia
//                            500 = potvrdenie zo servera zlyhá; scenár ho smie meniť za behu cez s.p.scenar.suhrn), platba
//                            "112" (session ju má), dataJsonMs / krok1Ms (data.json / fetch kroku 1 na pozadí odpovie
//                            o toľko ms neskôr — pomalá sieť pri meraní CLS, S44)
//                          statické /user/…, /cms/… -> kópia vo fixtures/cdn (inak 404 + upozornenie)
//                          ČOKOĽVEK INÉ -> 404 a zápis do `necakane` (test zlyhá)
//   cdn.myshoptet.com      náš bundle a CSS (…/eshopy/luxuryCar/assets/[v/<sha>/]js/luxuryCar.js, css/luxuryCar.css,
//                          js/lcd-*.js) -> lokálny build; ostatné …/eshopy/luxuryCar/assets/* -> súbor z repa;
//                          data.json -> fixtures/data.json (+ scenár.dataJson); statické súbory Shoptetu -> fixtures/cdn
//                          (--doplnit-cdn ich raz stiahne GET-om, aj knižnicu slick); doplnky iných autorov (jkbase,
//                          ProductNote, sipky, product-interconnection) -> zablokované
//   ostatné hosty          zablokované (GTM, GA4, FB, Ecomail, Luxia, Heureka, Twitter, Apple Pay SDK, flagcdn, …)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { JSDOM } from "jsdom";
import { KOREN } from "./build.mjs";
import { FIXTURES } from "./zachytene.mjs";
import { stranka as strankaDakujeme, VARIANTY as VARIANTY_DAKUJEME } from "./dakujeme-fixtures.mjs";

// Jedna stránka (opc/kosikKarta.js): ponuka k setu potrebuje stránky produktov (mapa príplatkov, varianty druhej vrstvy,
// ceny samostatných produktov). Fixtúry testu ponuky v košíku (tools/test-kosik-*.fixture.json, živé formuláre 7. a 10. 10.
// 2026, žiadny kód Shoptetu) -> stránka s formulárom a necessaryVariantData ako tools/test-kosik-doplnok.mjs.
const FIX_DOPLNOK = JSON.parse(readFileSync(join(KOREN, "tools/test-kosik-doplnok.fixture.json"), "utf8"));
const FIX_VRSTVA = JSON.parse(readFileSync(join(KOREN, "tools/test-kosik-vrstva.fixture.json"), "utf8"));
export function strankaProduktuPonuky(p, cena) {
  const dph = p.lang === "cs" || p.lang === "cz" ? 1.21 : 1.23;
  const sur = (o) => `<option value="${o[0]}" data-surcharge-final-price="${o[2]}" data-surcharge-additional-price="${o[3] != null ? o[3] : Math.round((o[2] / dph) * 100) / 100}">${o[1]}</option>`;
  const kom = p.kom ? JSON.stringify(p.kom).replace(/\//g, "\\/") : null;
  return `<!doctype html><html lang="${p.lang}"><head><meta charset="utf-8"><title>produkt (TEST)</title></head><body>` +
    (cena ? `<meta itemprop="price" content="${cena}">` : "") +
    `<form id="product-detail-form"><input type="hidden" name="productId" value="${p.pid}"><input type="hidden" name="priceId" value="${p.priceId}"><input type="hidden" name="language" value="${p.lang}">` +
    (p.vsels || []).map((s) => `<select name="parameterValueId[${s.id}]" class="hidden-split-parameter" data-parameter-id="${s.id}" data-parameter-name="${s.n}"><option value="">Zvoľte variant</option>${s.o.map((o) => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`).join("") +
    (p.sels || []).map((s) => `<select name="surchargeParameterValueId[${s.id}]" data-parameter-id="${s.id}" data-parameter-name="${s.n}"><option value="">Vyberte príplatok</option>${s.o.map(sur).join("")}</select>`).join("") +
    `</form>` + (kom ? `<script>\n    shoptet.variantsSplit = shoptet.variantsSplit || {};\n    shoptet.variantsSplit.necessaryVariantData = ${kom};\n</script>` : "") + `</body></html>`;
}
const PRODUKTY_PONUKY = {
  sk: {
    "/luxusne-autokoberce-dragonskin-diamond-line/": () => strankaProduktuPonuky(FIX_VRSTVA["sk/basic-diamond"], 219),
    "/luxusne-autokoberce-dragonskin-elite-diamond-line/": () => strankaProduktuPonuky(FIX_VRSTVA["sk/elite-diamond"], 351),
    "/luxusne-autokoberce-dragonskin-stripe-line/": () => strankaProduktuPonuky(FIX_VRSTVA["sk/basic-stripe"], 219),
    "/luxusne-autokoberce-dragonskin-elite-stripe-line/": () => strankaProduktuPonuky(FIX_VRSTVA["sk/elite-stripe"], 351),
    "/luxusny-boxi-do-kufra/": () => strankaProduktuPonuky(FIX_DOPLNOK["sk/luxusny-boxi-do-kufra/"], 197),
    "/luxusny-koberced-do-kufra-dragonskin-klasik/": () => strankaProduktuPonuky({ pid: "1", priceId: "1", lang: "sk" }, 230),
  },
  cz: {
    "/luxusne-autokoberce-dragonskin-diamond-line/": () => strankaProduktuPonuky(FIX_VRSTVA["cz/basic-diamond"], 5664),
    "/luxusne-autokoberce-dragonskin-elite-diamond-line/": () => strankaProduktuPonuky(FIX_VRSTVA["cz/elite-diamond"], 8799),
    "/luxusny-boxi-do-kufra/": () => strankaProduktuPonuky({ pid: "1", priceId: "1", lang: "cs" }, 4990),
    "/luxusny-koberced-do-kufra-dragonskin-klasik/": () => strankaProduktuPonuky({ pid: "1", priceId: "1", lang: "cs" }, 5990),
  },
};
/** Stránka produktu pre ponuku k setu (HTML) alebo null. */
export function produktPonuky(web, cesta) {
  const f = PRODUKTY_PONUKY[web] && PRODUKTY_PONUKY[web][cesta.replace(/\/?$/, "/")];
  return f ? f() : null;
}
/** Tabuľka riadkov košíka (ako payload.content GetCartContent) z HTML stránky košíka. */
const tabulky = new Map();
export function tabulkaKosika(html) {
  if (!html) return "";
  if (!tabulky.has(html)) {
    const t = new JSDOM(html).window.document.querySelector("table.cart-table");
    tabulky.set(html, t ? t.outerHTML : "");
  }
  return tabulky.get(html);
}

export { FIXTURES }; // tools/test-opc/fixtures/ (nie je v gite, FIXTURES.md) alebo LCD_OPC_FIXTURES
const CDN_DIR = join(FIXTURES, "cdn");
const CDN_MANIFEST = join(CDN_DIR, "manifest.json");
const MAX_CDN = 600 * 1024; // väčšie súbory sa do kópie neukladajú (fotky produktov v plnej veľkosti)

export const WEBY = {
  sk: { base: "https://www.luxurycardesign.sk", host: "www.luxurycardesign.sk", jazyk: "sk" },
  cz: { base: "https://www.luxurycardesign.cz", host: "www.luxurycardesign.cz", jazyk: "cs" },
};

const TYP = {
  ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm",
};

export const STRANKA_OBJEDNAVKA_TEST = (jazyk) => `<!doctype html><html lang="${jazyk}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Objednávka prijatá (TEST)</title></head>
<body class="lcd-opc-test-objednavka" style="font:18px/1.5 sans-serif;padding:24px"><h1>Objednávka prijatá (TEST)</h1>
<p>Fiktívna stránka offline testu tools/test-opc.mjs. Požiadavka Step2Validate bola zachytená a do Shoptetu neodišla.</p></body></html>`;

// ------------------------------------------------------------------ kópia statických súborov (fixtures/cdn)
let manifest = null;
function nacitajManifest() {
  if (!manifest) manifest = existsSync(CDN_MANIFEST) ? JSON.parse(readFileSync(CDN_MANIFEST, "utf8")) : {};
  return manifest;
}
const klucCdn = (u) => u.host + u.pathname; // bez query (Shoptet má hash v názve, ?v= / ?t= sa mení)
export function cdnSubor(u) {
  const m = nacitajManifest()[klucCdn(u)];
  if (!m) return null;
  const cesta = join(CDN_DIR, m.subor);
  return existsSync(cesta) ? { telo: readFileSync(cesta), typ: m.typ } : null;
}
async function cdnDoplnit(u) {
  const r = await fetch(u.href, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0 Safari/537.36" } });
  if (!r.ok) return { status: r.status };
  const telo = Buffer.from(await r.arrayBuffer());
  const typ = (r.headers.get("content-type") || TYP[extname(u.pathname).toLowerCase()] || "application/octet-stream").split(";")[0].trim();
  if (telo.length <= MAX_CDN) {
    mkdirSync(CDN_DIR, { recursive: true });
    const ext = extname(u.pathname).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 6) || "";
    const subor = createHash("sha1").update(klucCdn(u)).digest("hex").slice(0, 16) + ext;
    writeFileSync(join(CDN_DIR, subor), telo);
    const m = nacitajManifest();
    m[klucCdn(u)] = { subor, typ, bajtov: telo.length };
    writeFileSync(CDN_MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(m).sort()), null, 1) + "\n");
  }
  return { status: 200, telo, typ };
}

// ------------------------------------------------------------------ fixtures
const cache = new Map();
function citaj(cesta) {
  if (!cache.has(cesta)) cache.set(cesta, existsSync(cesta) ? readFileSync(cesta, "utf8") : null);
  return cache.get(cesta);
}
/** Zaškrtnuté id rádia (shippingId / billingId) vo formulári kroku 1. */
export function zaskrtnute(html, meno) {
  for (const m of String(html).matchAll(/<input\b[^>]*>/g)) {
    const t = m[0];
    if (!new RegExp('name="' + meno + '"').test(t)) continue;
    if (/\schecked\b/.test(t)) { const v = /value="([^"]*)"/.exec(t); return v ? v[1] : null; }
  }
  return null;
}
/** data-relations dopravy (povolené platby) z kroku 1 -> ["5", "3", …]; neznáma doprava -> []. */
export function relacieDopravy(html, shippingId) {
  for (const m of String(html).matchAll(/<input\b[^>]*>/g)) {
    const t = m[0];
    if (!/name="shippingId"/.test(t)) continue;
    const v = /value="([^"]*)"/.exec(t);
    if (!v || v[1] !== String(shippingId)) continue;
    const r = /data-relations="([^"]*)"/.exec(t);
    return r ? r[1].split(",").map((x) => x.trim()).filter(Boolean) : [];
  }
  return [];
}
/** Krok 1 s inou zaškrtnutou platbou (presunie atribút checked). */
function krok1SPlatbou(html, platba) {
  return String(html).replace(/<input\b[^>]*>/g, (t) => {
    if (!/name="billingId"/.test(t)) return t;
    let x = t.replace(/\s+checked(="checked")?/g, "");
    if (new RegExp('value="' + platba + '"').test(x)) x = x.replace(/\s*\/?>$/, ' checked="checked" />');
    return x;
  });
}
/** Krok 2 s iným súhrnom (#summary-box z suhrn-<platba>.html); stránka sa inak s platbou nemení (overené 28. 10. 2026). */
function krok2SoSuhrnom(html, suhrn) {
  const dom = new JSDOM(html);
  const box = dom.window.document.getElementById("summary-box");
  if (!box) throw new Error("fixture krok2: #summary-box chýba");
  box.innerHTML = suhrn;
  return "<!doctype html>\n" + dom.window.document.documentElement.outerHTML;
}

/** Krok 2 po chybe zo servera (scenár step2 "chyba-raz"): formulár s hodnotami z odoslaného tela. ❓ odhad správania Shoptetu. */
function krok2SUdajmi(html, pole) {
  const dom = new JSDOM(html);
  const d = dom.window.document;
  const f = d.getElementById("order-form");
  if (!f) return html;
  const hodnoty = new Map();
  for (const [k, v] of pole) { if (!hodnoty.has(k)) hodnoty.set(k, []); hodnoty.get(k).push(v); }
  f.querySelectorAll("input[name], textarea[name]").forEach((e) => {
    const h = hodnoty.get(e.getAttribute("name"));
    const typ = (e.getAttribute("type") || "").toLowerCase();
    if (typ === "hidden") return;
    if (typ === "checkbox" || typ === "radio") { if (h && h.includes(e.getAttribute("value") || "on")) e.setAttribute("checked", "checked"); else e.removeAttribute("checked"); return; }
    if (!h) return;
    if (e.tagName === "TEXTAREA") e.textContent = h[0]; else e.setAttribute("value", h[0]);
  });
  if ((hodnoty.get("remark") || [""])[0]) {
    const note = d.getElementById("note"), c = d.getElementById("add-note");
    if (note) note.classList.remove("js-hidden");
    if (c) c.setAttribute("checked", "checked");
  }
  return "<!doctype html>\n" + d.documentElement.outerHTML;
}

/** Text ceny v tvare webu (SK „€3“, CZ „50 Kč“). */
function cenaWebu(web, n) {
  const s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return web === "cz" ? s + " Kč" : "€" + s;
}
/**
 * Košík „dve“ (S42, zobáčik pri každej položke): set autokobercov (fixtures/sk-set) + 2. položka „koberec do kufra“
 * poskladaná z 1. položky (iné data-micro-identifier, názov, variant, príplatky, cena 129, fotka rohože z nášho CDN).
 * Sumy „Celkom“ (košík, krok 1, krok 2) +129. 🟡 syntetické, nezachytené zo Shoptetu — len pre vzhľad súhrnu s 2 položkami.
 */
export const DRUHA_POLOZKA = {
  id: "00000000-test-4dve-8000-rohozclassic", sku: "TEST/KUFOR", priceId: "99901", itemId: "test-druha-polozka", cena: 129,
  href: "/luxusny-koberced-do-kufra-dragonskin-klasik/", nazov: "luxusný koberec do kufra Dragonskin Klasik",
  variant: "farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Čierna", priplatky: "Príplatky: TYP - Combi",
  foto: "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/kosik/rohoz-classic.jpg",
};
export function sDvomaPolozkami(html) {
  const dom = new JSDOM(html);
  const d = dom.window.document;
  const prva = d.querySelector('[data-micro="cartItem"]');
  if (!prva) return html;
  const D = DRUHA_POLOZKA;
  const k = prva.cloneNode(true);
  const stareId = prva.getAttribute("data-micro-identifier") || "";
  k.setAttribute("data-micro-identifier", D.id);
  k.setAttribute("data-micro-sku", D.sku);
  if (k.hasAttribute("data-testid")) k.setAttribute("data-testid", k.getAttribute("data-testid").replace(stareId, D.id));
  k.querySelectorAll("a[href]").forEach((a) => { if (/autokoberce/.test(a.getAttribute("href"))) a.setAttribute("href", D.href); });
  const meno = k.querySelector("a.main-link");
  if (meno) {
    const t = Array.prototype.find.call(meno.childNodes, (n) => n.nodeType === 3 && n.textContent.trim());
    if (t) t.textContent = "  " + D.nazov + "        ";
  }
  k.querySelectorAll(".main-link-variant").forEach((e) => { e.textContent = D.variant; });
  k.querySelectorAll(".main-link-surcharges").forEach((e) => { e.textContent = D.priplatky; });
  k.querySelectorAll('[data-testid="cartItemPrice"], [data-testid="recapItemPrice"]').forEach((e) => { e.textContent = "€" + D.cena; });
  k.querySelectorAll(".cart-item-price").forEach((e) => { e.textContent = "€" + D.cena; });
  // súčet riadku košíka (td.p-total) = cena 2. položky; „+129“ nižšie len pre sumy celého košíka mimo položiek
  k.querySelectorAll('[data-testid="cartPrice"]').forEach((e) => { e.textContent = "€" + D.cena; });
  k.querySelectorAll("img").forEach((i) => { i.setAttribute("data-src", D.foto); i.setAttribute("alt", "Koberec do kufra"); });
  k.querySelectorAll('input[name="priceId"]').forEach((i) => i.setAttribute("value", D.priceId));
  k.querySelectorAll('input[name="itemId"]').forEach((i) => i.setAttribute("value", D.itemId));
  prva.after(k);
  ['[data-testid="cartPrice"]', '[data-testid="recapItemTotalPrice"]', '[data-testid="recapFullPrice"]'].forEach((sel) => {
    d.querySelectorAll(sel).forEach((e) => {
      if (e.closest('[data-micro="cartItem"]')) return; // súčet riadku položky nie je suma košíka
      const n = Number(e.textContent.replace(/[^\d]/g, ""));
      if (n) e.textContent = e.textContent.replace(/\d[\d\s]*/, String(n + D.cena));
    });
  });
  return /^\s*<!doctype/i.test(html) ? dom.serialize() : d.body.innerHTML;
}

/**
 * Košík „vzorky3“ (S42, revízia A1 N3 — pilulka „Zobrazit více“ aj na CZ v prehliadači): vzorkovník webu (fixtures/<web>, 1 vzorka)
 * s 3 vzorkami. K príplatku vzorky („Vzorek 2. vrstva – Lux Color 01 (LUX-01) - Ano“) pribudnú v tom istom texte ďalšie dve
 * v tom istom tvare (iné číslo farby), ceny a sumy sa nemenia. Rozpis z nich vyrobí skutočný cart.js (lcdRozpis), A1 ukáže
 * prvé 2 a tretiu po pilulke. 🟡 syntetické, nezachytené zo Shoptetu — len pre pilulku a kópiu navrchu na CZ.
 */
export function sTromiVzorkami(html) {
  return String(html).replace(/(data-testid="cartWidgetSurchargeName"[^>]*>\s*P[rř][ií]platky:\s*)([^<]+?)(\s*<)/g, (cele, a, vzorka, b) => {
    const m = /Lux Color (\d+).*?\(LUX-\d+\)/.exec(vzorka);
    if (!m) return cele;
    const dalsie = ["10", "13", "16"].filter((n) => Number(n) !== Number(m[1])).slice(0, 2)
      .map((n) => vzorka.replace(m[0], "Lux Color " + n + " (LUX-" + n + ")"));
    return a + [vzorka.trim()].concat(dalsie).join(", ") + b;
  });
}

/**
 * Súhrn pre platbu, ktorú sme nezachytili (set, kamión): zo súhrnu predvolenej platby vymení riadok platby a celkovú sumu
 * podľa kroku 1 (názov a data-billing-price-wv). 🟡 syntetický, štruktúra ako zachytené súhrny SK/CZ.
 */
function suhrnSynteticky(web, zaklad, krok1, platba) {
  const d = new JSDOM("<div id=x>" + zaklad + "</div>").window.document;
  const k = new JSDOM(krok1).window.document;
  const i = k.querySelector('input[name="billingId"][value="' + platba + '"]');
  const l = i && k.querySelector('label[for="' + i.id + '"]');
  if (!l) return null;
  const nazov = l.querySelector(".shipping-billing-name").textContent.trim();
  const cenaEl = l.querySelector("[data-billing-price-wv]");
  const cena = Number(cenaEl ? cenaEl.getAttribute("data-billing-price-wv") : 0) || 0;
  const riadok = d.querySelector('[data-testid="recapPaymentMethod"]');
  const celkom = d.querySelector('[data-testid="recapFullPrice"]');
  if (!riadok || !celkom) return null;
  const staraCena = Number(riadok.querySelector('[data-testid="recapItemPrice"]').textContent.replace(/[^\d]/g, "")) || 0;
  const staraSuma = Number(celkom.textContent.replace(/[^\d]/g, "")) || 0;
  riadok.innerHTML = '<span data-testid="recapItemPrice">' + cenaWebu(web, cena) + "</span> " + nazov;
  celkom.textContent = cenaWebu(web, staraSuma - staraCena + cena);
  return d.getElementById("x").innerHTML;
}

/**
 * Podvrh pre jednu kartu. moznosti: { web: "sk"|"cz", build, kosik: "vzorkovnik"|"vzorky3"|"set"|"kamion"|"dve", mobil, doplnitCdn, scenar }
 * scenar: { step1: "303"|"500"|"limit"|"neplatne", krok1: "ok"|"500"|"zmenene", dataJson: {…}, csrf: false, dataJsonMs: 0, krok1Ms: 0 }
 */
export async function zapniPodvrh(k, moznosti) {
  const W = WEBY[moznosti.web];
  const p = {
    web: moznosti.web, W, build: moznosti.build, scenar: { step1: "303", krok1: "ok", dataJson: null, ...(moznosti.scenar || {}) },
    stav: { kosik: moznosti.kosik || "vzorkovnik", step1: false, doprava: null, platba: null, banka: null, step2: 0, udaje: null },
    zaznam: null,
  };
  p.reset = () => {
    p.zaznam = { www: [], step1: [], step2: [], ajax: [], necakane: [], chybaCdn: [], blokovane: [], podvrhnute: [], dataJson: 0, doplnene: [], kosikAkcie: [] };
  };
  p.reset();
  // košík „dve“ = set + 2. položka (sDvomaPolozkami), HTML sa skladá z fixtures/sk-set; „vzorky3“ = vzorkovník webu
  // s 3 vzorkami (sTromiVzorkami)
  const zlozene = new Map();
  const ZLOZ = { dve: ["-set", sDvomaPolozkami], vzorky3: ["", sTromiVzorkami] };
  p.adresar = () => join(FIXTURES, p.web + (p.stav.kosik === "vzorkovnik" ? "" : ZLOZ[p.stav.kosik] ? ZLOZ[p.stav.kosik][0] : "-" + p.stav.kosik));
  p.subor = (meno) => {
    const h = citaj(join(p.adresar(), meno));
    const z = ZLOZ[p.stav.kosik];
    if (!z || !h || !/\.html$/.test(meno)) return h;
    const kluc = p.stav.kosik + "|" + meno;
    if (!zlozene.has(kluc)) zlozene.set(kluc, z[1](h));
    return zlozene.get(kluc);
  };
  p.predvolene = () => {
    const k1 = p.subor("krok1.html");
    return { doprava: zaskrtnute(k1, "shippingId"), platba: zaskrtnute(k1, "billingId") };
  };
  const syntet = new Map();
  // nezachytený súhrn (set, kamión; SK vzorkovník rýchla platba 112) sa poskladá zo súhrnu predvolenej platby. Pri 112
  // zodpovedá živému T11 (29. 10. 2026: súhrn kroku 2 „Rýchla platba cez banku“, celkom €10 = €5 tovar + €5 doprava + €0)
  const suhrnPre = (platba) => {
    const s = p.subor("suhrn-" + platba + ".html");
    if (s) return s;
    const kluc = p.adresar() + "|" + p.stav.kosik + "|" + platba;
    if (!syntet.has(kluc)) syntet.set(kluc, suhrnSynteticky(p.web, p.subor("suhrn-" + p.predvolene().platba + ".html") || "", p.subor("krok1.html"), platba));
    return syntet.get(kluc);
  };
  // scenár zaciatok "krok2": session už má Step1Validate (rovno /objednavka/krok-2/?opc=KÓD)
  if (p.scenar.zaciatok === "krok2") p.stav.step1 = true;
  // scenár platba: session už má túto platbu (napr. "112" rýchla platba zvolená skôr na klasickom kroku 1)
  if (p.scenar.platba) p.stav.platba = String(p.scenar.platba);
  if (p.scenar.banka) p.stav.banka = String(p.scenar.banka);
  // CSRF zapnuté (S15): Shoptet dáva token a prepínač do konfigurácie stránky
  const sCsrf = (h) => {
    const x = String(h);
    if (!p.scenar.csrf) return x;
    return x.replace(/shoptet\.csrf\.enabled = false;/g, "shoptet.csrf.enabled = true;").replace(/shoptet\.csrf\.token = '[^']*'/g, "shoptet.csrf.token = 'TEST-CSRF'");
  };

  function htmlKrok1Session() {
    const pred = p.predvolene();
    const pl = p.stav.platba;
    if (!pl || pl === pred.platba) return p.subor("krok1.html");
    const dob = p.subor("krok1-dobierka.html");
    if (dob && zaskrtnute(dob, "billingId") === pl) return dob;
    return krok1SPlatbou(p.subor("krok1.html"), pl);
  }
  /** Krok 1 podľa session: po Step1Validate má súhrn kroku 1 „Celkom k úhrade“ so zvolenou dopravou a platbou. */
  function htmlKrok1() {
    const h = htmlKrok1Session();
    if (!p.stav.step1) return h;
    const s2 = suhrnPre(p.stav.platba || p.predvolene().platba);
    const m = s2 && /data-testid="recapFullPrice">([^<]*)</.exec(s2);
    if (!m) return h;
    return h.replace(/(data-testid="recapFullPrice">)[^<]*(<)/, (x, a, b) => a + m[1].trim() + b);
  }
  /**
   * Košík zmenený v inom okne (T6, scenár za behu: s.p.stav.priplatok = suma): „Celkom za tovar“ aj „Celkom k úhrade“
   * v súhrne kroku 1 aj 2 sú vyššie o priplatok (🟡 syntetické, položky sa nemenia).
   */
  const sPriplatkom = (html) => {
    const n = Number(p.stav.priplatok) || 0;
    if (!n || html == null) return html;
    const pridaj = (x, a, t, b) => a + cenaWebu(p.web, (Number(String(t).replace(/[^0-9]/g, "")) || 0) + n) + b;
    return String(html).replace(/(data-testid="recapItemTotalPrice">)([^<]*)(<)/g, pridaj).replace(/(data-testid="recapFullPrice">)([^<]*)(<)/g, pridaj);
  };
  /** „Celkom k úhrade“, ktoré má server teraz (krok 1 podľa session, s priplatkom) — pre kontroly scenárov. */
  p.celkomServera = () => {
    const m = /data-testid="recapFullPrice">([^<]*)</.exec(sPriplatkom(htmlKrok1()) || "");
    return m ? m[1].replace(/\s+/g, " ").trim() : null;
  };
  const krok2Cache = new Map();
  function htmlKrok2() {
    const pred = p.predvolene();
    const pl = p.stav.platba;
    if (!pl || pl === pred.platba) return p.subor("krok2.html");
    const kluc = p.adresar() + "|" + pl;
    if (!krok2Cache.has(kluc)) {
      const s = suhrnPre(pl);
      krok2Cache.set(kluc, s ? krok2SoSuhrnom(p.subor("krok2.html"), s) : p.subor("krok2.html"));
    }
    return krok2Cache.get(kluc);
  }

  // CORS pre písma a skripty z cdn.myshoptet.com (stránka je na www.luxurycardesign.*)
  const hlavicky = (typ, ine = []) => [{ name: "Content-Type", value: typ }, { name: "Cache-Control", value: "no-store" }, { name: "Access-Control-Allow-Origin", value: "*" }, ...ine];
  const odpovedz = (rq, status, telo, typ, ine) => k.posli("Fetch.fulfillRequest", {
    requestId: rq.requestId, responseCode: status, responseHeaders: hlavicky(typ, ine),
    body: Buffer.from(telo == null ? "" : telo).toString("base64"),
  });
  // Shoptet dáva podľa User-Agenta len triedu tela desktop/mobile (overené 28. 10. 2026 na prázdnom košíku SK, inak zhodné
  // HTML) -> fixtures sú zachytené s UA počítača, na telefóne (šírka < 768) sa trieda prepíše
  const stranka = (rq, html) => odpovedz(rq, 200, moznosti.mobil ? sCsrf(html).replace(/<body class="desktop /, '<body class="mobile ') : sCsrf(html), TYP[".html"]);
  const presmeruj = (rq, cesta) => k.posli("Fetch.fulfillRequest", {
    requestId: rq.requestId, responseCode: 302, responseHeaders: [{ name: "Location", value: W.base + cesta }, { name: "Cache-Control", value: "no-store" }], body: "",
  });
  const zablokuj = (rq, u) => { p.zaznam.blokovane.push(u.host + u.pathname); return k.posli("Fetch.failRequest", { requestId: rq.requestId, errorReason: "BlockedByClient" }); };
  const json = (o) => JSON.stringify(o);
  /** Oneskorenie „pomaly“ (Step1Validate aj overenie telefónu): 1,5 s, snímky dávajú dlhšie (scenár pomalyMs). */
  const pomalyMs = () => Number(p.scenar.pomalyMs) || 1500;
  /** Step1Validate odmietnutý (živý tvar 29. 10. 2026): code 303, messages.errors, returnUrl na krok 1 (alebo umelo krok 2). */
  const chybaStep1 = (krok) => json({ code: 303, message: null, messages: { errors: ["TEST: Prosím, vyberte si spôsob platby.", "TEST: Fakturačné alebo doručovacie údaje sú neplatné"] },
    payload: { returnUrl: W.base + "/objednavka/" + krok + "/" } });

  async function obsluzWww(rq, u) {
    const r = rq.request;
    const metoda = r.method;
    const cesta = u.pathname;
    const xhr = Object.keys(r.headers || {}).some((h) => h.toLowerCase() === "x-requested-with");
    const z = { cas: Date.now(), metoda, cesta, query: u.search, typ: rq.resourceType, xhr };
    p.zaznam.www.push(z);
    const telo = r.postData || "";
    const pole = () => Object.fromEntries(new URLSearchParams(telo));

    // statické súbory na www (obrázky a písma z HTML kódov adminu, /cms/libs/…)
    if (metoda === "GET" && /^\/(user|cms)\//.test(cesta)) {
      z.odpoved = "staticke";
      return obsluzStaticke(rq, u);
    }
    if (metoda === "GET" && /^\/kosik\/?$/.test(cesta)) {
      z.odpoved = "kosik";
      return stranka(rq, p.subor("kosik.html"));
    }
    if (metoda === "GET" && /^\/objednavka\/krok-1\/?$/.test(cesta)) {
      if (p.scenar.krok1 === "500") { z.odpoved = "500"; return odpovedz(rq, 500, "TEST: chyba servera", "text/plain"); }
      // zaseknutá sieť (revízia R5/R6): fetch na pozadí nikdy neodpovie, stránka (navigácia) áno
      if (p.scenar.krok1 === "visi" && rq.resourceType !== "Document") { z.odpoved = "visi"; return; }
      // pomalá sieť (S44): fetch kroku 1 na pozadí odpovie neskôr, stránka (navigácia) hneď
      if (Number(p.scenar.krok1Ms) > 0 && rq.resourceType !== "Document") await new Promise((r) => setTimeout(r, Number(p.scenar.krok1Ms)));
      // potvrdenie zo servera zlyhá (revízia R2): fetch kroku 1 na pozadí 500, stránka (navigácia) áno
      if (p.scenar.suhrn === "500" && rq.resourceType !== "Document") { z.odpoved = "500"; return odpovedz(rq, 500, "TEST: chyba servera", "text/plain"); }
      let h = sPriplatkom(htmlKrok1());
      if (p.scenar.krok1 === "zmenene") h = h.replace(/Step1Validate/g, "Step1ValidateZmenene"); // zmenené HTML Shoptetu
      z.odpoved = "krok1" + (p.stav.platba ? "-" + p.stav.platba : "");
      return stranka(rq, h);
    }
    // ďakovná stránka (rekonštrukcia, scenár dakujeme = kľúč variantu); bez scenára ide ďalej -> nečakaná
    if (metoda === "GET" && /^\/objednavka\/d[ae]kujeme\/?$/.test(cesta) && p.scenar.dakujeme) {
      const v = VARIANTY_DAKUJEME[p.scenar.dakujeme];
      if (!v || v.web !== p.web) throw new Error("scenár dakujeme " + p.scenar.dakujeme + " nie je pre web " + p.web);
      z.odpoved = "dakujeme-" + p.scenar.dakujeme;
      return stranka(rq, strankaDakujeme(p.scenar.dakujeme, citaj(join(FIXTURES, p.web, "krok2.html"))));
    }
    if (metoda === "GET" && /^\/objednavka\/krok-2\/?$/.test(cesta)) {
      if (!p.stav.step1) { z.odpoved = "302-krok1"; return presmeruj(rq, "/objednavka/krok-1/"); }
      // potvrdenie súhrnu zo servera zlyhá (revízia R2): fetch kroku 2 na pozadí 500, stránka (navigácia) áno
      if (p.scenar.suhrn === "500" && rq.resourceType !== "Document") { z.odpoved = "500"; return odpovedz(rq, 500, "TEST: chyba servera", "text/plain"); }
      z.odpoved = "krok2" + (p.stav.platba ? "-" + p.stav.platba : "") + (p.stav.udaje ? "-udaje" : "");
      return stranka(rq, sPriplatkom(p.stav.udaje ? krok2SUdajmi(htmlKrok2(), p.stav.udaje) : htmlKrok2()));
    }
    if (metoda === "POST" && /^\/action\/orderingProcess\/Step1Validate\/?$/i.test(cesta)) {
      const o = pole();
      p.zaznam.step1.push({ cas: z.cas, xhr, typ: rq.resourceType, telo, pole: o });
      const relacie = relacieDopravy(p.subor("krok1.html"), o.shippingId);
      const platne = !!(o.shippingId && o.billingId && relacie.includes(String(o.billingId)) && o.language === W.jazyk);
      // scenár: text alebo funkcia (poradie, telo) -> "500" | "limit" | "chyby" | "chyby-krok2" | "neplatne" | "ok" | "pomaly"
      const volba = typeof p.scenar.step1 === "function" ? p.scenar.step1(p.zaznam.step1.length, o) : p.scenar.step1;
      if (volba === "500") { z.odpoved = "500"; return odpovedz(rq, 500, "TEST: chyba servera", "text/plain"); }
      if (volba === "limit") { z.odpoved = "limit"; return; } // bez odpovede (časový limit klienta)
      if (volba === "chyby-krok2") {
        // umelý prípad: 303 a returnUrl krok 2, ale messages.errors neprázdne -> prísne kritérium = neúspech; session sa nemení
        z.odpoved = "303-chyby-krok2";
        p.zaznam.step1[p.zaznam.step1.length - 1].neplatne = true;
        return xhr ? odpovedz(rq, 200, chybaStep1("krok-2"), TYP[".json"]) : presmeruj(rq, "/objednavka/krok-1/");
      }
      if (!platne || volba === "neplatne" || volba === "chyby") {
        // živý tvar (dôkaz 29. 10. 2026): 303 + messages.errors + returnUrl krok 1 a session ZRUŠÍ krok 1 (krok 2 -> 302 krok 1)
        z.odpoved = "303-chyby";
        p.zaznam.step1[p.zaznam.step1.length - 1].neplatne = true;
        p.stav.step1 = false;
        return xhr ? odpovedz(rq, 200, chybaStep1("krok-1"), TYP[".json"]) : presmeruj(rq, "/objednavka/krok-1/");
      }
      const zapis = p.zaznam.step1[p.zaznam.step1.length - 1];
      const odpoved = () => {
        p.stav.step1 = true;
        p.stav.doprava = String(o.shippingId);
        p.stav.platba = String(o.billingId);
        // rýchla platba cez banku: banka v session = shoptetPayPisCode posledného Step1Validate (🟡 tak to robí formulár
        // kroku 1; bez kódu podvrh banku nepozná — test to musí výslovne čakať)
        p.stav.banka = o.shoptetPayPisCode || null;
        zapis.odpovedCas = Date.now();
        if (xhr) return odpovedz(rq, 200, p.subor("step1-303.json") || citaj(join(FIXTURES, p.web, "step1-303.json")), TYP[".json"]);
        return presmeruj(rq, "/objednavka/krok-2/");
      };
      z.odpoved = "303";
      // pomalý server (S6): odpoveď aj uloženie voľby až po 1,5 s
      if (volba === "pomaly" && xhr) { z.odpoved = "303-pomaly"; return new Promise((r) => setTimeout(r, pomalyMs())).then(odpoved); }
      return odpoved();
    }
    if (metoda === "POST" && /^\/action\/OrderingProcess\/step2CustomerAjax\/?$/i.test(cesta)) {
      const o = pole();
      p.zaznam.ajax.push({ cas: z.cas, cesta: cesta + u.search, pole: Object.keys(o) });
      if (p.scenar.suhrn === "500") { z.odpoved = "500"; return odpovedz(rq, 500, "TEST: chyba servera", "text/plain"); }
      // živý tvar (dôkaz 29. 10. 2026): žiadne HTML súhrnu, Shoptet súhrn neprekreslí
      z.odpoved = "ajax-prazdny";
      return odpovedz(rq, 200, json({ code: 200, message: null, messages: [], payload: [] }), TYP[".json"]);
    }
    if (metoda === "GET" && /^\/action\/ShoptetPayPaymentData\/getShoptetPayStatus\/?$/i.test(cesta)) {
      z.odpoved = "shoptetpay";
      return odpovedz(rq, 200, citaj(join(FIXTURES, p.web, "shoptetpay-status.json")) || '{"isHealthy":true}', TYP[".json"]);
    }
    if (metoda === "GET" && /^\/action\/ShoptetPayPaymentData\/getBankProviderData\/?$/i.test(cesta)) {
      // scenár banky "500" = zoznam bánk nejde (OPC: rýchla platba ostane riadkom s odkazom na klasický krok 1)
      if (p.scenar.banky === "500") { z.odpoved = "500"; return odpovedz(rq, 500, "TEST: chyba servera", "text/plain"); }
      z.odpoved = "shoptetpay";
      return odpovedz(rq, 200, citaj(join(FIXTURES, p.web, "shoptetpay-banky.json")) || "{}", TYP[".json"]);
    }
    if (metoda === "GET" && /^\/action\/ShoptetValidatePhone\/index\/?$/i.test(cesta)) {
      // 🟡 tvar odpovede z main-3g.js (validateNumber: payload.isValidForRegion, nationalNumber); scenár telefon (T3-L7,
      // smie sa meniť za behu): "pomaly" = platné po 1,5 s, "pomaly-neplatny" = neplatné po 1,5 s, "neplatny", "visi"
      const cislo = new URLSearchParams(u.search).get("number") || "";
      const t = p.scenar.telefon || "";
      z.odpoved = "telefon" + (t ? "-" + t : "");
      if (t === "visi") return;
      const platne = !/neplatny/.test(t);
      const telo = json({ code: 200, message: null, messages: [], payload: platne ? { isValidForRegion: true, nationalNumber: cislo.replace(/(\d{3})(?=\d)/g, "$1 ") } : { isValidForRegion: false, suggestedRegions: [] } });
      const posli = () => { z.odpovedCas = Date.now(); return odpovedz(rq, 200, telo, TYP[".json"]); };
      return /^pomaly/.test(t) ? new Promise((r) => setTimeout(r, pomalyMs())).then(posli) : posli();
    }
    if (metoda === "POST" && /^\/action\/CustomerCookieConsent\/?$/i.test(cesta)) {
      z.odpoved = "cookies";
      return odpovedz(rq, 200, json({ code: 200, message: null, messages: [], payload: [] }), TYP[".json"]);
    }
    if (/^\/action\/orderingProcess\/Step2Validate\/?$/i.test(cesta)) {
      const pole2 = [...new URLSearchParams(telo)];
      // platba = čo má session Shoptetu (posledný úspešný Step1Validate) — Shoptet ju pri objednávke berie odtiaľ
      p.zaznam.step2.push({ cas: z.cas, metoda, typ: rq.resourceType, xhr, telo, pole: pole2, platba: p.stav.platba || p.predvolene().platba, banka: p.stav.banka || null });
      p.stav.step2++;
      if (p.scenar.step2 === "chyba-raz" && p.stav.step2 === 1) {
        p.stav.udaje = pole2;
        z.odpoved = "302-krok2-chyba";
        return presmeruj(rq, "/objednavka/krok-2/");
      }
      z.odpoved = "TEST-objednavka";
      return odpovedz(rq, 200, STRANKA_OBJEDNAVKA_TEST(W.jazyk), TYP[".html"]);
    }
    // jedna stránka (opc/kosikKarta.js): obsah košíka (tabuľka riadkov z kosik.html; scenár obsahKosika(html) ho smie
    // zmeniť), úpravy košíka (zapíšu sa do zaznam.kosikAkcie, odpoveď 200) a stránky produktov pre ponuku k setu
    if (metoda === "GET" && /^\/action\/Cart\/GetCartContent\/?$/i.test(cesta)) {
      z.odpoved = "obsah-kosika";
      let t = tabulkaKosika(p.subor("kosik.html"));
      if (typeof p.scenar.obsahKosika === "function") t = p.scenar.obsahKosika(t);
      return odpovedz(rq, 200, json({ code: 200, message: null, messages: [], payload: { content: t } }), TYP[".json"]);
    }
    if (metoda === "POST" && /^\/action\/Cart\/(addCartItem|deleteCartItem|setCartItemAmount)\/?$/i.test(cesta)) {
      p.zaznam.kosikAkcie.push({ cas: z.cas, akcia: cesta.split("/")[3], pole: pole() });
      z.odpoved = "kosik-akcia";
      return odpovedz(rq, 200, json({ code: 200, message: null, messages: [], payload: { cartItems: [] } }), TYP[".json"]);
    }
    const produkt = metoda === "GET" ? produktPonuky(p.web, cesta) : null;
    if (produkt) { z.odpoved = "produkt-ponuky"; return stranka(rq, produkt); }
    z.odpoved = "404-necakane";
    p.zaznam.necakane.push(metoda + " " + cesta + u.search + " (" + rq.resourceType + ")");
    return odpovedz(rq, 404, "TEST: nečakaná požiadavka", "text/plain");
  }

  async function obsluzStaticke(rq, u) {
    const kopia = cdnSubor(u);
    if (kopia) return odpovedz(rq, 200, kopia.telo, kopia.typ);
    if (moznosti.doplnitCdn && rq.request.method === "GET") {
      try {
        const d = await cdnDoplnit(u);
        if (d.status === 200) { p.zaznam.doplnene.push(u.host + u.pathname); return odpovedz(rq, 200, d.telo, d.typ); }
      } catch (e) { /* sieť zlyhala -> ako chýbajúci */ }
    }
    p.zaznam.chybaCdn.push(u.host + u.pathname);
    return odpovedz(rq, 404, "", "text/plain");
  }

  k.na("Fetch.requestPaused", async (rq) => {
    let u;
    try { u = new URL(rq.request.url); } catch { return k.posli("Fetch.failRequest", { requestId: rq.requestId, errorReason: "BlockedByClient" }).catch(() => {}); }
    try {
      if (/^www\.luxurycardesign\.(sk|cz)$/.test(u.hostname)) {
        if (u.hostname !== W.host) { p.zaznam.necakane.push("iný web: " + u.href); return await zablokuj(rq, u); }
        return await obsluzWww(rq, u);
      }
      if (u.hostname === "cdn.myshoptet.com") {
        const b = p.build;
        const nas = /\/usr\/shoptet\.jankucera\.work\/user\/documents\/eshopy\/luxuryCar\/assets\/(?:v\/[^/]+\/)?(.+)$/.exec(u.pathname);
        if (nas) {
          const rel = nas[1];
          if (rel === "js/luxuryCar.js") { p.zaznam.podvrhnute.push(u.pathname); return await odpovedz(rq, 200, b.js, TYP[".js"]); }
          if (rel === "css/luxuryCar.css") { p.zaznam.podvrhnute.push(u.pathname); return await odpovedz(rq, 200, b.css, TYP[".css"]); }
          const cast = /^js\/(lcd-[a-z0-9-]+\.js)$/.exec(rel);
          if (cast && b.casti[cast[1]]) { p.zaznam.podvrhnute.push(u.pathname); return await odpovedz(rq, 200, b.casti[cast[1]], TYP[".js"]); }
          const subor = join(KOREN, "assets", decodeURIComponent(rel));
          if (existsSync(subor)) return await odpovedz(rq, 200, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
          p.zaznam.chybaCdn.push(u.host + u.pathname);
          return await odpovedz(rq, 404, "", "text/plain");
        }
        if (/\/user\/documents\/upload\/data\.json$/.test(u.pathname)) {
          p.zaznam.dataJson++;
          if (Number(p.scenar.dataJsonMs) > 0) await new Promise((r) => setTimeout(r, Number(p.scenar.dataJsonMs))); // pomalá sieť (S44)
          const d = JSON.parse(citaj(join(FIXTURES, "data.json")));
          // jedna stránka (košík preskočený, košík navrchu pokladne) len v scenároch s jedna: true — ostatné testujú
          // košík -> pokladňu (ten istý kód, vypínač data.json "opc_jedna": false)
          const telo = { ...d, ...(p.scenar.jedna ? {} : { opc_jedna: false }), ...(p.scenar.dataJson || {}) };
          return await odpovedz(rq, 200, JSON.stringify(telo), TYP[".json"]);
        }
        // doplnky iných autorov na CDN Shoptetu (API doplnky Jána Kučeru jkbase.js a ProductNote.js, webotvurci, sipky) —
        // tretie strany, v teste blokované (kniha § 7.3). Knižnice z toho istého priestoru (slick) idú z kópie.
        if (/^\/usr\/(shoptet\.jankucera\.work\/user\/documents\/api\/|webotvurci\.myshoptet\.com\/|apollo\.jakubtursky\.sk\/)/.test(u.pathname)) return await zablokuj(rq, u);
        return await obsluzStaticke(rq, u);
      }
      return await zablokuj(rq, u);
    } catch (e) {
      k.posli("Fetch.failRequest", { requestId: rq.requestId, errorReason: "Failed" }).catch(() => {});
    }
  });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  return p;
}
