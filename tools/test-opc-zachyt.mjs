#!/usr/bin/env node
// Zachytenie fixtures pre test one page checkoutu (tools/test-opc.mjs) zo ŽIVÉHO webu — režim live-read
// (kniha OPC § 7.1, § 7.3; 28. 10. 2026). Anonymná session bez prehliadača (fetch + vlastné cookies), nič sa neodosiela.
//
//   node tools/test-opc-zachyt.mjs --web sk                 # vzorkovník: košík, krok 1, krok 2, dobierka, súhrny platieb
//   node tools/test-opc-zachyt.mjs --web cz
//   node tools/test-opc-zachyt.mjs --web sk --kosik set --telo <súbor s telom addCartItem>     # -> fixtures/sk-set/
//   node tools/test-opc-zachyt.mjs --web sk --kosik kamion --telo <súbor>                      # -> fixtures/sk-kamion/
//   (--vystup <priečinok> namiesto tools/test-opc/fixtures/<web>[-<kosik>]/; --porovnaj = len vypíše rozdiel štruktúry
//    oproti uloženým fixtures a nič neprepíše — denná kontrola, či Shoptet nezmenil kroky)
//
// BEZPEČNOSŤ (záväzné):
//   - povolené sú len GET, POST /action/Cart/(addCartItem|deleteCartItem)/ a POST /action/orderingProcess/Step1Validate/;
//     všetko ostatné (Step2Validate, step2CustomerAjax, prihlásenie, …) skript odmietne PRED odoslaním a skončí chybou,
//   - formulár údajov (krok 2) sa nevypĺňa a neodosiela, objednávka nevznikne,
//   - na konci sa košík vyprázdni (deleteCartItem) a overí: košík „prázdny“ a /objednavka/krok-1/ -> 302 /kosik/,
//   - vo fixtures sa začierni CSRF token, id košíka a každá hodnota cookie session; cookies sa neukladajú.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEBY = {
  sk: { base: "https://www.luxurycardesign.sk", vzorkovnik: "/vzorkovnik-dragonskin---objednavka-vzoriek/" },
  cz: { base: "https://www.luxurycardesign.cz", vzorkovnik: "/vzorkovnik-dragonskin---objednavka-vzorku/" },
};
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const XHR = { "X-Requested-With": "XMLHttpRequest", Accept: "application/json, text/javascript, */*; q=0.01" };
const FORM = { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" };
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ poistka
const POVOLENY_POST = /^\/action\/(Cart\/(addCartItem|deleteCartItem)|orderingProcess\/Step1Validate)\/?$/i;
const ZAKAZ = /Step2Validate|step2CustomerAjax|finish|krok-3|dokoncen|Login|Register|Customer\//i;
class Odmietnute extends Error {}
function strazca(metoda, url) {
  const u = new URL(url);
  if (!/^www\.luxurycardesign\.(sk|cz)$/.test(u.hostname)) throw new Odmietnute("mimo luxurycardesign: " + url);
  if (ZAKAZ.test(u.pathname)) throw new Odmietnute("zakázaná adresa: " + metoda + " " + u.pathname);
  if (metoda === "GET") return;
  if (metoda === "POST" && POVOLENY_POST.test(u.pathname)) return;
  throw new Odmietnute("nepovolená požiadavka: " + metoda + " " + u.pathname);
}

// ------------------------------------------------------------------ session (cookies len v pamäti)
function vytvorSession(base) {
  const cookies = new Map();
  const log = [];
  async function poziadavka(metoda, cesta, { telo = null, hlavicky = {} } = {}) {
    const url = new URL(cesta, base).href;
    strazca(metoda, url);
    const h = { "User-Agent": UA, "Accept-Language": "sk,cs;q=0.9", Accept: "text/html,application/xhtml+xml,*/*;q=0.8", ...hlavicky };
    if (cookies.size) h.Cookie = [...cookies].map(([k, v]) => k + "=" + v).join("; ");
    const t0 = Date.now();
    const r = await fetch(url, { method: metoda, headers: h, body: telo, redirect: "manual" });
    for (const c of r.headers.getSetCookie ? r.headers.getSetCookie() : []) {
      const [par] = c.split(";");
      const i = par.indexOf("=");
      if (i > 0) {
        const k = par.slice(0, i).trim(), v = par.slice(i + 1).trim();
        if (!v || /expires=Thu, 01 Jan 1970/i.test(c) || v === "deleted") cookies.delete(k); else cookies.set(k, v);
      }
    }
    const text = await r.text();
    const zaznam = { metoda, cesta: new URL(url).pathname + new URL(url).search, status: r.status, location: r.headers.get("location") || undefined, ms: Date.now() - t0, bajtov: text.length };
    log.push(zaznam);
    console.log(`  ${metoda.padEnd(4)} ${String(r.status).padEnd(3)} ${zaznam.cesta}${zaznam.location ? " -> " + zaznam.location : ""} (${zaznam.ms} ms, ${(text.length / 1024).toFixed(0)} kB)`);
    await pauza(250); // šetrne k Shoptetu (VOP čl. 11.4)
    return { status: r.status, location: zaznam.location, text, typ: r.headers.get("content-type") || "" };
  }
  return { cookies, log, poziadavka };
}

// ------------------------------------------------------------------ začiernenie
function zacierni(text, cookies) {
  let t = String(text);
  t = t.replace(/(shoptet\.csrf\.token\s*=\s*')[^']*(')/g, "$1REDACTED$2");
  t = t.replace(/(name="__csrf__"[^>]*value=")[^"]*(")/g, "$1REDACTED$2");
  t = t.replace(/("cartInfo"\s*:\s*\{\s*"id"\s*:\s*")[0-9a-z]{8,64}(")/gi, "$100000000000000000000000000000000$2");
  for (const v of cookies.values()) if (v && v.length >= 8) t = t.split(v).join("REDACTED");
  return t;
}
function overZacierne(text, cookies, meno) {
  for (const [k, v] of cookies) if (v && v.length >= 8 && text.includes(v)) throw new Error(meno + ": ostala hodnota cookie " + k);
  const m = /shoptet\.csrf\.token\s*=\s*'([^']*)'/.exec(text);
  if (m && m[1] && m[1] !== "REDACTED") throw new Error(meno + ": ostal CSRF token");
}

// ------------------------------------------------------------------ rozbor
const dom = (html, url) => new JSDOM(html, { url }).window.document;

/** Telo formulára produktu tak, ako by ho poslal prehliadač (hidden + vybrané možnosti selectov) + amount. */
function teloProduktu(doc, { vzorka = false } = {}) {
  const f = doc.getElementById("product-detail-form");
  if (!f) throw new Error("formulár produktu #product-detail-form nenájdený");
  const p = new URLSearchParams();
  f.querySelectorAll("input[type=hidden][name]").forEach((i) => p.append(i.name, i.value));
  let prvaVzorka = vzorka;
  f.querySelectorAll("select[name]").forEach((s) => {
    let v = s.value || "";
    // vzorkovník: 1 vzorka (prvý select s možnosťou „Áno“), ostatné prázdne
    if (prvaVzorka && /^surchargeParameterValueId\[/.test(s.name)) {
      const ano = [...s.options].find((o) => o.value && /^(Áno|Ano)\b/i.test(o.textContent.trim()));
      if (ano) { v = ano.value; prvaVzorka = false; }
    }
    p.append(s.name, v);
  });
  if (!p.has("amount")) p.append("amount", "1");
  return p;
}

/** Krok 1: formulár Step1Validate, zaškrtnutá doprava a platba, všetky platby (id, typ, podmetóda, názov). */
function rozoberKrok1(html, url) {
  const doc = dom(html, url);
  const f = [...doc.querySelectorAll("form")].find((x) => /Step1Validate/i.test(x.getAttribute("action") || ""));
  if (!f) throw new Error("krok 1: formulár Step1Validate nenájdený");
  const pole = [];
  f.querySelectorAll("input[name], select[name], textarea[name]").forEach((e) => {
    if (e.disabled) return;
    if ((e.type === "radio" || e.type === "checkbox") && !e.checked) return;
    pole.push([e.name, e.value]);
  });
  const doprava = f.querySelector('input[name="shippingId"]:checked');
  const platba = f.querySelector('input[name="billingId"]:checked');
  const platby = [...f.querySelectorAll('input[name="billingId"]')].map((i) => {
    const w = i.closest(".radio-wrapper");
    const n = doc.querySelector('label[for="' + i.id + '"] .shipping-billing-name');
    return { id: i.value, typ: i.getAttribute("data-payment-type") || "", podmetoda: (w && w.getAttribute("data-submethod")) || "", nazov: n ? n.textContent.trim() : "" };
  });
  return { pole, doprava: doprava && doprava.value, relacie: doprava && doprava.getAttribute("data-relations"), platba: platba && platba.value, platby };
}

function suhrn(html, url) {
  const doc = dom(html, url);
  const box = doc.getElementById("summary-box");
  if (!box) throw new Error("súhrn #summary-box nenájdený");
  return box.innerHTML;
}

/** Štruktúra kroku na porovnanie (--porovnaj): formuláre, mená polí, platby, kotvy, ktoré používa náš kód. */
function struktura(html, url) {
  const doc = dom(html, url);
  const formy = [...doc.querySelectorAll("form[action]")].map((f) => f.id + " " + f.getAttribute("action") + " [" + [...new Set([...f.querySelectorAll("[name]")].map((e) => e.getAttribute("name")))].sort().join(",") + "]");
  const kotvy = ["#order-form", "#remark", "#checkoutSidebar", "#summary-box", "#submit-order", ".co-billing-address", "#continue-order-button", "ol.cart-header", "#order-shipping-methods", "#order-billing-methods"]
    .map((s) => s + "=" + doc.querySelectorAll(s).length);
  const platby = [...doc.querySelectorAll('input[name="billingId"]')].map((i) => i.value + ":" + (i.getAttribute("data-payment-type") || ""));
  return { telo: doc.body ? doc.body.className : "", formy, kotvy, platby };
}

// ------------------------------------------------------------------ beh
function argumenty(argv) {
  const a = { web: "sk", kosik: "vzorkovnik", telo: null, vystup: null, porovnaj: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => argv[++i];
    if (x === "--web") a.web = dalsi();
    else if (x === "--kosik") a.kosik = dalsi();
    else if (x === "--telo") a.telo = resolve(dalsi());
    else if (x === "--vystup") a.vystup = resolve(dalsi());
    else if (x === "--porovnaj") a.porovnaj = true;
    else if (x === "--help" || x === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 17).join("\n")); process.exit(0); }
    else throw new Error("neznámy prepínač " + x);
  }
  if (!WEBY[a.web]) throw new Error("--web sk alebo cz");
  if (!/^(vzorkovnik|set|kamion)$/.test(a.kosik)) throw new Error("--kosik vzorkovnik | set | kamion");
  if (a.kosik !== "vzorkovnik" && !a.telo) throw new Error("--kosik " + a.kosik + " potrebuje --telo <súbor s telom addCartItem> (napr. z tools/test-konfigurator-1v.mjs --vypis)");
  a.vystup = a.vystup || join(KOREN, "tools/test-opc/fixtures", a.web + (a.kosik === "vzorkovnik" ? "" : "-" + a.kosik));
  return a;
}

async function main() {
  const a = argumenty(process.argv.slice(2));
  const W = WEBY[a.web];
  const S = vytvorSession(W.base);
  const subory = {};
  const meta = { cas: new Date().toISOString(), web: a.web, kosik: a.kosik, base: W.base, kroky: {} };
  const uloz = (meno, text) => { subory[meno] = text; };
  let polozky = [];
  console.log(`Zachytenie OPC fixtures ${a.web.toUpperCase()} (${a.kosik}) -> ${a.porovnaj ? "len porovnanie" : a.vystup}`);
  try {
    // 1) do košíka
    let telo;
    if (a.kosik === "vzorkovnik") {
      const p = await S.poziadavka("GET", W.vzorkovnik);
      if (p.status !== 200) throw new Error("vzorkovník " + p.status);
      telo = teloProduktu(dom(p.text, W.base + W.vzorkovnik), { vzorka: true });
    } else {
      telo = new URLSearchParams(readFileSync(a.telo, "utf8").trim());
      const pid = telo.get("productId");
      if (!pid) throw new Error("--telo bez productId");
    }
    const add = await S.poziadavka("POST", "/action/Cart/addCartItem/", { telo: telo.toString(), hlavicky: { ...XHR, ...FORM } });
    let addJ = null;
    try { addJ = JSON.parse(add.text); } catch {}
    meta.kroky.addCartItem = { status: add.status, code: addJ && addJ.code, sprava: addJ && addJ.message, pocet: addJ && addJ.payload && addJ.payload.count };
    if (add.status !== 200 || !addJ || (addJ.code && addJ.code !== 200)) throw new Error("addCartItem zlyhal: " + add.status + " " + add.text.slice(0, 200));

    // 2) košík
    const kosik = await S.poziadavka("GET", "/kosik/");
    if (kosik.status !== 200 || /cart-empty/.test(kosik.text)) throw new Error("košík po pridaní prázdny / " + kosik.status);
    uloz("kosik.html", kosik.text);
    const dl = /"cartItems"\s*:\s*(\[[\s\S]*?\])\s*,\s*"taxMode"/.exec(kosik.text);
    polozky = dl ? JSON.parse(dl[1]).map((x) => ({ itemId: x.itemId, priceId: x.priceId, name: x.name, priceWithVat: x.priceWithVat })) : [];
    meta.polozky = polozky.map(({ itemId, ...x }) => x);
    if (!polozky.length) throw new Error("košík: položky (dataLayer cartItems) nenájdené");

    // 3) krok 2 bez Step1Validate -> 302 na krok 1 (skutočné správanie, kniha § 4.5)
    const bez = await S.poziadavka("GET", "/objednavka/krok-2/");
    meta.kroky.krok2BezStep1 = { status: bez.status, location: bez.location && new URL(bez.location, W.base).pathname };

    // 4) krok 1 (predvolené voľby)
    const k1 = await S.poziadavka("GET", "/objednavka/krok-1/");
    if (k1.status !== 200) throw new Error("krok-1 " + k1.status);
    uloz("krok1.html", k1.text);
    const m1 = rozoberKrok1(k1.text, W.base + "/objednavka/krok-1/");
    meta.krok1 = { doprava: m1.doprava, relacie: m1.relacie, platba: m1.platba, platby: m1.platby, pole: m1.pole.map(([k]) => k) };

    if (a.kosik === "vzorkovnik" && !a.porovnaj) {
      // Shoptet Pay na kroku 1 (GET, checkout-3g.js): stav brány a zoznam bánk — telá pre podvrh
      for (const [meno, cesta] of [["shoptetpay-status.json", "/action/ShoptetPayPaymentData/getShoptetPayStatus/"], ["shoptetpay-banky.json", "/action/ShoptetPayPaymentData/getBankProviderData/"]]) {
        const r = await S.poziadavka("GET", cesta, { hlavicky: XHR });
        if (r.status === 200) uloz(meno, r.text);
        meta.kroky[meno] = { status: r.status, typ: r.typ };
      }
    }

    // 5) Step1Validate (XHR) s predvolenou voľbou -> 303 + krok 2
    const step1 = async (billingId) => {
      const p = new URLSearchParams();
      m1.pole.forEach(([k, v]) => p.append(k, k === "billingId" && billingId ? billingId : v));
      const r = await S.poziadavka("POST", "/action/orderingProcess/Step1Validate/", { telo: p.toString(), hlavicky: { ...XHR, ...FORM } });
      let j = null;
      try { j = JSON.parse(r.text); } catch {}
      return { status: r.status, code: j && j.code, returnUrl: j && j.payload && j.payload.returnUrl ? new URL(j.payload.returnUrl, W.base).pathname : null, telo: p.toString(), json: j };
    };
    const s0 = await step1(null);
    meta.kroky.step1Predvolene = { status: s0.status, code: s0.code, returnUrl: s0.returnUrl, telo: s0.telo };
    if (s0.code !== 303) throw new Error("Step1Validate nevrátil 303: " + JSON.stringify(s0.json).slice(0, 200));
    uloz("step1-303.json", JSON.stringify(s0.json));
    const k2 = await S.poziadavka("GET", "/objednavka/krok-2/");
    if (k2.status !== 200) throw new Error("krok-2 po Step1Validate " + k2.status);
    uloz("krok2.html", k2.text);
    uloz("suhrn-" + m1.platba + ".html", suhrn(k2.text, W.base + "/objednavka/krok-2/"));

    // 6) ostatné platby povolené pri doprave: súhrn (a pri dobierke aj celý krok 1 a 2)
    if (a.kosik === "vzorkovnik" && !a.porovnaj) {
      const povolene = String(m1.relacie || "").split(",").filter(Boolean);
      meta.platbyZachytene = {};
      for (const pl of m1.platby) {
        if (pl.id === m1.platba) continue;
        if (!povolene.includes(pl.id)) { meta.platbyZachytene[pl.id] = "nepovolená pri doprave " + m1.doprava; continue; }
        if (pl.podmetoda === "pis") { meta.platbyZachytene[pl.id] = "vynechaná (rýchla platba potrebuje výber banky, kniha § 8 otázka 6)"; continue; }
        const s = await step1(pl.id);
        meta.platbyZachytene[pl.id] = { nazov: pl.nazov, typ: pl.typ, podmetoda: pl.podmetoda, status: s.status, code: s.code, returnUrl: s.returnUrl };
        if (s.code !== 303) continue;
        const k2p = await S.poziadavka("GET", "/objednavka/krok-2/");
        if (k2p.status !== 200) continue;
        uloz("suhrn-" + pl.id + ".html", suhrn(k2p.text, W.base + "/objednavka/krok-2/"));
        // krok 2 s inou platbou sa líši len súhrnom (#summary-box) a meračmi -> podvrh ho skladá z krok2.html + suhrn-<id>.html
        if (pl.typ === "cashOnDelivery") {
          const k1d = await S.poziadavka("GET", "/objednavka/krok-1/");
          if (k1d.status === 200) uloz("krok1-dobierka.html", k1d.text);
        }
      }
      // späť na predvolenú platbu (session ostane ako na začiatku)
      await step1(m1.platba);
    }
  } finally {
    // 7) upratanie: vyprázdniť košík a overiť
    const upratanie = { zmazane: [] };
    try {
      const k = await S.poziadavka("GET", "/kosik/");
      const dl = /"cartItems"\s*:\s*(\[[\s\S]*?\])\s*,\s*"taxMode"/.exec(k.text);
      const ids = dl ? JSON.parse(dl[1]).map((x) => x.itemId) : polozky.map((x) => x.itemId);
      for (const id of ids) {
        const r = await S.poziadavka("POST", "/action/Cart/deleteCartItem/", { telo: new URLSearchParams({ itemId: id }).toString(), hlavicky: { ...XHR, ...FORM } });
        upratanie.zmazane.push(r.status);
      }
      const po = await S.poziadavka("GET", "/kosik/");
      upratanie.prazdny = /cart-empty/.test(po.text) && !/"cartItems"\s*:\s*\[\s*\{/.test(po.text);
      const k1 = await S.poziadavka("GET", "/objednavka/krok-1/");
      upratanie.krok1 = k1.status + (k1.location ? " -> " + new URL(k1.location, W.base).pathname : "");
    } catch (e) { upratanie.chyba = e.message; }
    meta.upratanie = upratanie;
    console.log("  upratanie: " + JSON.stringify(upratanie));
    if (!upratanie.prazdny) console.error("POZOR: košík sa nepodarilo overiť ako prázdny — skontroluj ručne (" + W.base + "/kosik/)");
  }

  meta.poziadavky = S.log;
  if (a.porovnaj) {
    const stare = join(a.vystup, "krok1.html"), stare2 = join(a.vystup, "krok2.html");
    const rozdiel = [];
    for (const [meno, cesta] of [["krok1.html", stare], ["krok2.html", stare2]]) {
      if (!existsSync(cesta) || !subory[meno]) continue;
      const x = struktura(readFileSync(cesta, "utf8"), W.base + "/"), y = struktura(subory[meno], W.base + "/");
      const sx = JSON.stringify(x, null, 1), sy = JSON.stringify(y, null, 1);
      if (sx !== sy) rozdiel.push(meno + ":\n  uložené: " + sx + "\n  živé:    " + sy);
    }
    console.log(rozdiel.length ? "ZMENA štruktúry krokov Shoptetu:\n" + rozdiel.join("\n") : "Štruktúra krokov bez zmeny.");
    process.exit(rozdiel.length ? 1 : 0);
  }
  mkdirSync(a.vystup, { recursive: true });
  for (const [meno, text] of Object.entries(subory)) {
    const t = zacierni(text, S.cookies);
    overZacierne(t, S.cookies, meno);
    writeFileSync(join(a.vystup, meno), t);
  }
  const metaText = zacierni(JSON.stringify(meta, null, 1), S.cookies);
  overZacierne(metaText, S.cookies, "zachyt.json");
  writeFileSync(join(a.vystup, "zachyt.json"), metaText + "\n");
  console.log(`Uložené: ${Object.keys(subory).join(", ")}, zachyt.json -> ${a.vystup}`);
  if (!meta.upratanie.prazdny) process.exit(1);
}

main().catch((e) => { console.error("CHYBA:", e instanceof Odmietnute ? "POISTKA — " + e.message : e && e.stack ? e.stack : e); process.exit(2); });
