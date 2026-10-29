/* test-kosik-auto-hodnotenie.mjs — košík: auto položky ako odrážka „Auto: …“ v rozpise a hodnotenie z Google pod
 * „Pokračovať“ (Michal 29. 10. 2026; assets/js/components/cart.js + functions/kosikHodnotenie.js).
 *
 * Skutočný cart.js (initCart) v jsdom s jQuery na košíku podľa živého HTML Shoptetu (tr.removeable, súhrn .summary-wrapper):
 *   - žiadne „Pripravené pre: … ✓“ / „Připraveno pro“ (Michal 29. 10. po snímkach: „prvoplánové“, zbytočné) — ani pri
 *     položke, ani v súhrne, ani pri kamióne; auto je vecne odrážka „Auto: …“ v rozpise položky (košík aj kroky objednávky);
 *   - LEN auto, ktoré ide do poznámky objednávky (main.js toNote: sessionStorage „model“, pri kamióne truckOrderSummary):
 *     záznam z pridania s iným autom = nič (karta medzitým prezrela iné auto), dve autá = auto len pri riadku karty;
 *     vzorkovník nikdy (ani keď karta auto má); kamión ostáva po starom (vozidlo v bloku špecifikácie);
 *   - hodnotenie: presné čísla z window.LCD_REVIEWS.place (5,0 · 89 recenzií), tvary slov, bez dát skryté;
 *     reviews-data.js sa na košíku nesťahuje pred načítaním stránky.
 * Spustenie: node tools/test-kosik-auto-hodnotenie.mjs
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(join(ROOT, "package.json"));
const { JSDOM } = req("jsdom");
const { jQueryFactory: jqFactory } = req("jquery/factory"); // jQuery 4: továreň pre vlastné okno jsdom

let zlyhania = 0;
const over = (podm, m, detail) => { if (podm) console.log("✓ " + m); else { zlyhania++; console.error("✗ " + m + (detail !== undefined ? " — " + JSON.stringify(detail) : "")); } };
const txt = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : null);

const RIADOK = (o) => `<tr class="removeable" data-micro="cartItem" data-micro-sku="${o.sku || "598/DIA3"}">
  <td class="p-name"><a href="${o.href}" class="main-link">  ${o.nazov}  ${o.variant ? `<span class="main-link-variant">${o.variant}</span>` : ""}
  ${o.sur ? `<span class="main-link-surcharges">${o.sur}</span>` : ""}</a></td>
  <td class="p-quantity"><form><input type="hidden" value="${o.itemId}" name="itemId" /><input type="hidden" value="${o.priceId}" name="priceId" /></form></td>
  <td class="p-total"><strong class="price-final">€269</strong></td></tr>`;
const SET = (o = {}) => RIADOK(Object.assign({ href: "/luxusne-autokoberce-dragonskin-diamond-line/", nazov: "luxusné autokoberce Dragonskin Basic DIAMOND LINE",
  variant: "farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Čierna", sur: "Príplatky: rozloženie kobercov - prvý a druhý rad, TYP - Combi", itemId: "it1", priceId: "63493" }, o));
const SET_CZ = SET({ nazov: "luxusní autokoberce Dragonskin Basic DIAMOND LINE", variant: "Barva 1.vrstvy: Diamond Barva kůže: Černá / Barva šití: Černá",
  sur: "Příplatky: rozložení koberců - první a druhá řada, TYP - Combi", priceId: "43611" });
const VZORKY = RIADOK({ href: "/vzorkovnik-dragonskin---objednavka-vzoriek/", nazov: "Vzorkovník Dragonskin – objednávka vzoriek", sur: "Príplatky: Vzorka 2. vrstva – Lux Color 10 – Čierna (LUX-10) - Áno", itemId: "it9", priceId: "46000", sku: "VZORKY-DRAGONSKIN" });
const KAMION = RIADOK({ href: "/luxusne-autokoberce-kamiony/", nazov: "luxusné autokoberce do kamiónov", sur: "Príplatky: Vozidlo - Vyberie sa v konfigurátore, Typ prevodovky - Automatická prevodovka", itemId: "it7", priceId: "68383", sku: "640" });
const SUHRN = `<div class="cart-content summary-wrapper"><div class="box"><div class="price-wrapper"><span class="price-label">Celkom za tovar:</span>
  <strong class="price" data-testid="recapFullPrice">€269</strong></div>
  <div class="next-step next-step--cart"><a href="/" class="btn next-step-back"><span class="continue-shopping">Späť do obchodu</span></a>
  <a href="/objednavka/krok-1/" class="btn next-step-forward" id="continue-order-button"><span class="order-button-text">Pokračovať</span></a></div></div></div>`;
const KOSIK = (riadky, lang = "sk") => `<!doctype html><html lang="${lang}"><head></head><body class="desktop id--9 in-kosik ordering-process">
  <div id="cart-wrapper"><div class="col-md-8"><table class="cart-table"><tbody>${riadky}</tbody></table></div>${SUHRN}</div></body></html>`;
const REKAP = (polozky) => `<!doctype html><html lang="sk"><head></head><body class="desktop id--17 in-krok-2 ordering-process"><div id="summary-box"><div class="cart-items">${polozky}</div></div></body></html>`;

const OCT = { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi", model: "Skoda Octavia 2021 Combi" };
const PAS = { Brand: "Volkswagen", Model: "Passat", Year: "2019", carType: "Combi", model: "Volkswagen Passat 2019 Combi" };

const { buildTruckOrderSummary } = await import(pathToFileURL(join(ROOT, "assets/js/truck-konfigurator/order-summary.mjs")).href);
const { initCart } = await import(pathToFileURL(join(ROOT, "assets/js/components/cart.js")).href);
const KP = await import(pathToFileURL(join(ROOT, "assets/js/functions/kosikHodnotenie.js")).href);

/** Stránka v jsdom ako globálne prostredie cart.js (jQuery, sessionStorage, localStorage, dataLayer) a initCart. */
function stranka(html, { ss = {}, ls = {}, recenzie = null, host = "www.luxurycardesign.sk", pred = null } = {}) {
  const dom = new JSDOM(html, { url: "https://" + host + "/kosik/", pretendToBeVisual: true });
  const w = dom.window;
  Object.assign(globalThis, { window: w, document: w.document, location: w.location, sessionStorage: w.sessionStorage, localStorage: w.localStorage,
    MutationObserver: w.MutationObserver, HTMLElement: w.HTMLElement, Node: w.Node });
  globalThis.addEventListener = w.addEventListener.bind(w);
  globalThis.dataLayer = w.dataLayer = [{ shoptet: { projectId: host.endsWith(".cz") ? 581408 : 562035, language: host.endsWith(".cz") ? "cs" : "sk", cart: [{ itemId: "it1" }] } }];
  const $ = jqFactory(w);
  globalThis.$ = globalThis.jQuery = w.$ = w.jQuery = $;
  Object.keys(ss).forEach((k) => w.sessionStorage.setItem(k, ss[k]));
  Object.keys(ls).forEach((k) => w.localStorage.setItem(k, ls[k]));
  if (recenzie) w.LCD_REVIEWS = recenzie;
  window.__lcdCartReloadBound = true; // reload po ShoptetCartUpdated netreba
  if (pred) pred(w);
  initCart({});
  return w.document;
}
const autoRozpis = (d) => [...d.querySelectorAll("ul.lcd-rozpis > li")].map(txt).filter((t) => /^Auto:/.test(t));
/** „Auto: …“ po riadkoch košíka (null = riadok bez auta) */
const autoRiadky = (d) => [...d.querySelectorAll("tr.removeable")].map((tr) => [...tr.querySelectorAll("ul.lcd-rozpis > li")].map(txt).find((t) => /^Auto:/.test(t)) || null);
/** nič z „Pripravené pre“: trieda, text SK/CZ, fajka */
const bezPripravene = (d) => !d.querySelector(".lcd-pre, [class*='lcd-pre_']") && !/Pripraven|Připraven|✓/.test(d.body.textContent);
const R = { "lcdAutoPolozky:v1": JSON.stringify([{ p: "63493", a: { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi" }, t: Date.now() - 60000 }, { p: "63487", a: { Brand: "Volkswagen", Model: "Passat", Year: "2019", carType: "Combi" }, t: Date.now() }]) };

// ---------------------------------------------------------------- auto pri položke = odrážka „Auto: …“ (nie „Pripravené pre“)
let d = stranka(KOSIK(SET()), { ss: OCT });
over(JSON.stringify(autoRiadky(d)) === JSON.stringify(["Auto: Skoda Octavia 2021 Combi"]), "SK set s autom: odrážka „Auto: …“ v rozpise položky", autoRiadky(d));
const ul1 = d.querySelector("tr ul.lcd-rozpis");
over(ul1 && ul1.previousElementSibling && ul1.previousElementSibling.matches("a.main-link") && txt(ul1.firstElementChild) === "Auto: Skoda Octavia 2021 Combi",
  "rozpis hneď pod názvom, auto prvá odrážka (ako pred zmenou 29. 10.)");
over(bezPripravene(d), "žiadne „Pripravené pre“ ani fajka (pri položke ani v súhrne)");
const box = d.querySelector(".summary-wrapper .box");
over(box && box.firstElementChild && box.firstElementChild.matches(".price-wrapper"), "súhrn začína cenou („Celkom za tovar“), bez riadku auta");

d = stranka(KOSIK(SET()));
over(autoRozpis(d).length === 0 && bezPripravene(d), "bez auta: žiadna odrážka", autoRozpis(d));

d = stranka(KOSIK(VZORKY), { ss: OCT });
over(autoRozpis(d).length === 0 && bezPripravene(d), "len vzorky: žiadne „Auto:“, hoci karta auto má", autoRozpis(d));

d = stranka(KOSIK(SET({ sur: "Príplatky: rozloženie kobercov - prvý a druhý rad, TYP - Sedan" })), { ss: OCT });
over(autoRozpis(d).length === 0, "TYP riadku (Sedan) nesedí s autom karty (Combi): radšej nič", autoRozpis(d));

d = stranka(KOSIK(SET() + SET({ itemId: "it2", priceId: "63487", variant: "farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Červená" })), { ss: PAS, ls: R });
over(JSON.stringify(autoRiadky(d)) === JSON.stringify([null, "Auto: Volkswagen Passat 2019 Combi"]), "dve autá: auto karty (= poznámka) len pri riadku pridanom s ním, Octavia nič", autoRiadky(d));
over(bezPripravene(d), "dve autá: v súhrne nič");

// nález kontroly 29. 10.: set pridaný pre Octaviu, potom v tej istej karte prezrel BMW -> poznámka „model: BMW…“
const BMW = { Brand: "BMW", Model: "3", Year: "2020", carType: "Combi", model: "BMW 3 2020 Combi" };
const R_OCT = { "lcdAutoPolozky:v1": JSON.stringify([{ p: "63493", a: { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi" }, t: Date.now() - 600000 }]) };
d = stranka(KOSIK(SET()), { ss: BMW, ls: R_OCT });
over(autoRozpis(d).length === 0, "pridal pre Octaviu, karta teraz BMW: žiadne „Auto:“ (ani Octavia, ani BMW)", autoRozpis(d));
d = stranka(KOSIK(SET() + SET({ itemId: "it2", sur: "Príplatky: rozloženie kobercov - prvý rad, TYP - Combi" })), { ss: PAS, ls: { "lcdAutoPolozky:v1": JSON.stringify([
  { p: "63493", a: { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi" }, t: Date.now() - 60000 },
  { p: "63493", a: { Brand: "Volkswagen", Model: "Passat", Year: "2019", carType: "Combi" }, t: Date.now() }]) } });
over(autoRozpis(d).length === 0, "ten istý set (priceId) pre dve autá s rovnakým TYP: nevieme, ktorý riadok je ktorý -> nič", autoRozpis(d));

d = stranka(KOSIK(SET() + SET({ itemId: "it2" })), { ss: OCT });
over(JSON.stringify(autoRiadky(d)) === JSON.stringify(["Auto: Skoda Octavia 2021 Combi", "Auto: Skoda Octavia 2021 Combi"]) && bezPripravene(d), "dva rovnaké sety: auto pri oboch, súhrn bez auta", autoRiadky(d));

d = stranka(KOSIK(SET_CZ, "cs"), { ss: OCT, host: "www.luxurycardesign.cz" });
over(JSON.stringify(autoRiadky(d)) === JSON.stringify(["Auto: Skoda Octavia 2021 Combi"]) && bezPripravene(d), "CZ: „Auto: …“, žiadne „Připraveno pro“", autoRiadky(d));

const SUHRN_DAF = buildTruckOrderSummary({ znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "K2" }, selectedLemovanie: { name: "Červené lemovanie" } }, "sk");
d = stranka(KOSIK(KAMION), { ss: { truckOrderSummary: SUHRN_DAF, truckVehicle: "VOLVO FH 2021-2025" } });
const dd = [...d.querySelectorAll(".lcd-truck-cart-summary dd")].map(txt);
const spec = [...d.querySelectorAll(".lcd-truck-cart-summary dt")].map(txt).map((dt, i) => dt + ": " + dd[i]);
over(spec[0] === "Vozidlo: DAF (TIR) XF 2022-2025" && bezPripravene(d), "kamión so súhrnom: „Vozidlo“ v bloku špecifikácie ako doteraz (aj po prezretí Volva), bez „Pripravené pre“", spec);
const ks = d.querySelector(".lcd-truck-cart-summary");
over(ks && ks.parentNode.matches("span.main-link-surcharges") && !ks.previousElementSibling, "kamión: nad blokom špecifikácie nič navyše");
d = stranka(KOSIK(KAMION), { ss: { truckVehicle: "VOLVO FH 2021-2025" } });
const model = [...d.querySelectorAll(".info-wrap ul.model li")].map(txt);
over(model[0] === "Vozidlo: VOLVO FH 2021-2025" && bezPripravene(d), "kamión bez súhrnu: „Vozidlo: …“ ako pred zmenou, bez „Pripravené pre“", model);
d = stranka(KOSIK(SET()), { ss: Object.assign({ truckOrderSummary: SUHRN_DAF }, OCT) });
over(autoRozpis(d).length === 0, "set, ale v karte súhrn kamióna: poznámka nesie len kamión (toNote) -> pri sete nič", autoRozpis(d));

d = stranka(REKAP(`<div class="cart-item"><div class="cart-item-name"><a href="/luxusne-autokoberce-dragonskin-diamond-line/" class="main-link">luxusné autokoberce
  <span class="main-link-variant">farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Čierna</span>
  <span class="main-link-surcharges">Príplatky: rozloženie kobercov - prvý a druhý rad, TYP - Combi</span></a></div></div>`), { ss: OCT });
over(bezPripravene(d) && JSON.stringify(autoRozpis(d)) === JSON.stringify(["Auto: Skoda Octavia 2021 Combi"]), "rekapitulácia v krokoch: „Auto: …“ v rozpise ako doteraz", autoRozpis(d));

// ---------------------------------------------------------------- telefón: hodnotenie až spolu s ponukou k setu (CLS)
// Ponuka sa vkladá NAD súhrn (na telefóne ho odsunie z obrazovky); vyšší súhrn = väčší posun. Kým ponuka beží
// (html[data-lcd-doplnok-caka]), hodnotenie čaká a vloží sa v tej istej úlohe ako ponuka (MutationObserver = pred ďalším
// vykreslením). PC (súhrn v pravom stĺpci) hneď.
const telefon = (w) => { w.matchMedia = (q) => ({ matches: /max-width:\s*991px/.test(q), media: q, addEventListener() {}, removeEventListener() {} }); };
const REC = { place: { rating: 5, totalReviews: 89 }, reviews: [{}] };
d = stranka(KOSIK(SET()), { ss: OCT, recenzie: REC, pred: (w) => { telefon(w); w.document.documentElement.setAttribute("data-lcd-doplnok-caka", ""); } });
over(!d.querySelector(".lcd-hodn-kosik") && autoRozpis(d).length === 1, "telefón, ponuka beží: súhrn zatiaľ bez hodnotenia (položka s „Auto:“ áno)", autoRozpis(d));
d.documentElement.setAttribute("data-lcd-doplnok", "1");
await new Promise((r) => setTimeout(r, 0));
over(txt(d.querySelector(".lcd-hodn-kosik")) === "5,0 ★★★★★ · 89 recenzií na Google", "ponuka hotová: hodnotenie doplnené", txt(d.querySelector(".lcd-hodn-kosik")));
d = stranka(KOSIK(SET()), { ss: OCT, recenzie: REC, pred: (w) => { w.document.documentElement.setAttribute("data-lcd-doplnok-caka", ""); } });
over(!!d.querySelector(".lcd-hodn-kosik"), "PC (bez telefónnej šírky): hodnotenie hneď, aj keď ponuka beží");
d = stranka(KOSIK(SET()), { ss: OCT, recenzie: REC, pred: telefon });
over(!!d.querySelector(".lcd-hodn-kosik"), "telefón bez ponuky (vypnutá): hodnotenie hneď");

// ---------------------------------------------------------------- hodnotenie z Google pod „Pokračovať“
over(JSON.stringify(KP.hodnotenie({ rating: 5, totalReviews: 89 }, "sk")) === JSON.stringify({ cislo: "5,0", hviezdy: 5, text: "89 recenzií na Google", aria: "Hodnotenie 5,0 z 5 – 89 recenzií na Google" }), "SK 5,0 · 89 recenzií", KP.hodnotenie({ rating: 5, totalReviews: 89 }, "sk"));
over(KP.hodnotenie({ rating: 4.87, totalReviews: 3 }, "cz").text === "3 recenze na Google" && KP.hodnotenie({ rating: 4.87, totalReviews: 3 }, "cz").cislo === "4,9", "CZ 4,9 (ako Google) · 3 recenze");
over([4.87, 4.5, 4.94, 4.96, 5].map((r) => KP.hodnotenie({ rating: r, totalReviews: 9 }, "sk").hviezdy).join() === "4,4,4,5,5", "hviezdičky nadol podľa zobrazeného čísla (4,9 = 4, 4,5 = 4; nikdy viac, než je)",
  [4.87, 4.5, 4.94, 4.96, 5].map((r) => KP.hodnotenie({ rating: r, totalReviews: 9 }, "sk").hviezdy));
over(KP.hodnotenie({ rating: 4.4, totalReviews: 1 }, "sk").text === "1 recenzia na Google" && KP.hodnotenie({ rating: 4.4, totalReviews: 1 }, "sk").hviezdy === 4, "1 recenzia, 4 hviezdy");
over(KP.hodnotenie({ rating: 5, totalReviews: 120 }, "cz").text === "120 recenzí na Google", "CZ 120 recenzí");
over([KP.hodnotenie(null, "sk"), KP.hodnotenie({ rating: 0, totalReviews: 10 }, "sk"), KP.hodnotenie({ rating: 5, totalReviews: 0 }, "sk"), KP.hodnotenie({ rating: "x" }, "sk")].every((x) => x === null), "bez dát / nuly -> nič");

const DATA = { place: { rating: 5, totalReviews: 89, fetchedAt: "2026-05-23T19:01:48.358Z" }, reviews: [{ id: "g-1", rating: 5 }] };
d = stranka(KOSIK(SET()), { ss: OCT, recenzie: DATA });
const h = d.querySelector(".summary-wrapper .lcd-hodn-kosik");
over(h && !h.hidden && !h.hasAttribute("data-lcd-caka") && txt(h) === "5,0 ★★★★★ · 89 recenzií na Google", "dáta sú: riadok s presnými číslami", txt(h));
over(h && h.getAttribute("aria-label") === "Hodnotenie 5,0 z 5 – 89 recenzií na Google" && h.tagName !== "A", "čítačka: celé hodnotenie; nie odkaz preč z košíka");
const ns = d.querySelector(".next-step");
over(h && h.parentNode === ns && h.nextElementSibling && h.nextElementSibling.id === "continue-order-button", "v .next-step tesne pri „Pokračovať“ (PC: column-reverse -> pod ním)");

d = stranka(KOSIK(SET()), { recenzie: null });
const h2 = d.querySelector(".lcd-hodn-kosik");
over(h2 && h2.hasAttribute("data-lcd-caka") && !/\d/.test(txt(h2) || ""), "dáta ešte nie sú: miesto rezervované, bez čísel", txt(h2));
over(![...d.querySelectorAll("script")].some((s) => /reviews-data/.test(s.src || "")), "reviews-data.js sa nesťahuje pred načítaním stránky (readyState)");
over(KP.ZDROJ_RECENZII.indexOf("js/reviews-data.js?v=" + KP.RECENZIE_WV) > -1, "rovnaká adresa ako widget recenzií (vyrovnávacia pamäť z produktu)", KP.ZDROJ_RECENZII);

d = stranka(KOSIK(VZORKY), { recenzie: DATA });
over(d.querySelector(".lcd-hodn-kosik") && autoRozpis(d).length === 0, "hodnotenie aj pri košíku len so vzorkami (bez auta)");

d = stranka(REKAP(""), { recenzie: DATA });
over(!d.querySelector(".lcd-hodn-kosik"), "v krokoch objednávky nie (len košík)");

console.log(zlyhania ? `\n${zlyhania} zlyhaní` : "\nVšetko OK");
process.exit(zlyhania ? 1 : 0);
