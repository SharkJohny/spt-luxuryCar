/* test-kosik-pripravene.mjs — košík: „Pripravené pre: <auto> ✓“ pri položke aj v súhrne nad „Pokračovať“ a hodnotenie
 * z Google pod „Pokračovať“ (Michal 29. 10. 2026; assets/js/components/cart.js + functions/kosikPripravene.js).
 *
 * Skutočný cart.js (initCart) v jsdom s jQuery na košíku podľa živého HTML Shoptetu (tr.removeable, súhrn .summary-wrapper):
 *   - set s autom: riadok pod názvom (SK „Pripravené pre:“, CZ „Připraveno pro:“), v rozpise už nie „Auto: …“, v súhrne
 *     nad „Celkom za tovar“ to isté auto; bez auta nič; vzorkovník nikdy (ani keď karta auto má);
 *   - LEN auto, ktoré ide do poznámky objednávky (main.js toNote: sessionStorage „model“, pri kamióne truckOrderSummary):
 *     záznam z pridania s iným autom = nič (karta medzitým prezrela iné auto), dve autá = auto len pri riadku karty;
 *   - kamión: „DAF XF 2022–2025“ zo súhrnu konfigurácie (truckOrderSummary), nie z truckVehicle (mení sa pri prezeraní);
 *   - rekapitulácia v krokoch objednávky (bez košíka): „Auto: …“ v rozpise ako doteraz, žiadny nový riadok;
 *   - hodnotenie: presné čísla z window.LCD_REVIEWS.place (5,0 · 89 recenzií), tvary slov, bez dát skryté;
 *     reviews-data.js sa na košíku nesťahuje pred načítaním stránky.
 * Spustenie: node tools/test-kosik-pripravene.mjs
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
const KP = await import(pathToFileURL(join(ROOT, "assets/js/functions/kosikPripravene.js")).href);

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
const pre = (d) => [...d.querySelectorAll("tr .lcd-pre, .cart-item .lcd-pre")].map(txt);
const suhrn = (d) => txt(d.querySelector(".summary-wrapper .lcd-pre"));
const autoRozpis = (d) => [...d.querySelectorAll("ul.lcd-rozpis > li")].map(txt).filter((t) => /^Auto:/.test(t));
const R = { "lcdAutoPolozky:v1": JSON.stringify([{ p: "63493", a: { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi" }, t: Date.now() - 60000 }, { p: "63487", a: { Brand: "Volkswagen", Model: "Passat", Year: "2019", carType: "Combi" }, t: Date.now() }]) };

// ---------------------------------------------------------------- auto pri položke
let d = stranka(KOSIK(SET()), { ss: OCT });
over(JSON.stringify(pre(d)) === JSON.stringify(["Pripravené pre: Skoda Octavia 2021 Combi ✓"]), "SK set s autom: riadok pri položke", pre(d));
const p1 = d.querySelector("tr .lcd-pre");
over(p1 && p1.previousElementSibling && p1.previousElementSibling.matches("a.main-link") && p1.nextElementSibling && p1.nextElementSibling.matches("ul.lcd-rozpis"), "riadok hneď pod názvom, nad rozpisom");
over(autoRozpis(d).length === 0, "v rozpise košíka už nie „Auto: …“ (je v riadku)", autoRozpis(d));
over(suhrn(d) === "Pripravené pre: Skoda Octavia 2021 Combi ✓", "súhrn: auto nad „Celkom za tovar“", suhrn(d));
const sp = d.querySelector(".summary-wrapper .lcd-pre");
over(sp && sp.nextElementSibling && sp.nextElementSibling.matches(".price-wrapper"), "súhrn: riadok pred cenou");
over(d.querySelector(".lcd-pre__ok") && d.querySelector(".lcd-pre__ok").getAttribute("aria-hidden") === "true", "fajka len vizuálna (čítačka: text)");

d = stranka(KOSIK(SET()));
over(pre(d).length === 0 && !d.querySelector(".lcd-pre"), "bez auta: žiadny riadok ani v súhrne", pre(d));

d = stranka(KOSIK(VZORKY), { ss: OCT });
over(!d.querySelector(".lcd-pre") && autoRozpis(d).length === 0, "len vzorky: nič (ani „Auto:“ v rozpise), hoci karta auto má", [pre(d), autoRozpis(d)]);

d = stranka(KOSIK(SET({ sur: "Príplatky: rozloženie kobercov - prvý a druhý rad, TYP - Sedan" })), { ss: OCT });
over(!d.querySelector(".lcd-pre"), "TYP riadku (Sedan) nesedí s autom karty (Combi): radšej nič");

d = stranka(KOSIK(SET() + SET({ itemId: "it2", priceId: "63487", variant: "farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Červená" })), { ss: PAS, ls: R });
const r2 = [...d.querySelectorAll("tr.removeable")].map((tr) => txt(tr.querySelector(".lcd-pre")));
over(JSON.stringify(r2) === JSON.stringify([null, "Pripravené pre: Volkswagen Passat 2019 Combi ✓"]), "dve autá: auto karty (= poznámka) len pri riadku pridanom s ním, Octavia nič", r2);
over(suhrn(d) === "Pripravené pre: Volkswagen Passat 2019 Combi ✓", "dve autá: v súhrne len auto z poznámky", suhrn(d));

// nález kontroly 29. 10.: set pridaný pre Octaviu, potom v tej istej karte prezrel BMW -> poznámka „model: BMW…“
const BMW = { Brand: "BMW", Model: "3", Year: "2020", carType: "Combi", model: "BMW 3 2020 Combi" };
const R_OCT = { "lcdAutoPolozky:v1": JSON.stringify([{ p: "63493", a: { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi" }, t: Date.now() - 600000 }]) };
d = stranka(KOSIK(SET()), { ss: BMW, ls: R_OCT });
over(!d.querySelector(".lcd-pre"), "pridal pre Octaviu, karta teraz BMW: žiadne „Pripravené pre“ (ani Octavia, ani BMW)", [pre(d), suhrn(d)]);
d = stranka(KOSIK(SET() + SET({ itemId: "it2", sur: "Príplatky: rozloženie kobercov - prvý rad, TYP - Combi" })), { ss: PAS, ls: { "lcdAutoPolozky:v1": JSON.stringify([
  { p: "63493", a: { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi" }, t: Date.now() - 60000 },
  { p: "63493", a: { Brand: "Volkswagen", Model: "Passat", Year: "2019", carType: "Combi" }, t: Date.now() }]) } });
over(!d.querySelector(".lcd-pre"), "ten istý set (priceId) pre dve autá s rovnakým TYP: nevieme, ktorý riadok je ktorý -> nič", pre(d));

d = stranka(KOSIK(SET() + SET({ itemId: "it2" })), { ss: OCT });
over(pre(d).length === 2 && suhrn(d) === "Pripravené pre: Skoda Octavia 2021 Combi ✓", "dva rovnaké sety: v súhrne auto raz", suhrn(d));

d = stranka(KOSIK(SET_CZ, "cs"), { ss: OCT, host: "www.luxurycardesign.cz" });
over(JSON.stringify(pre(d)) === JSON.stringify(["Připraveno pro: Skoda Octavia 2021 Combi ✓"]) && suhrn(d) === "Připraveno pro: Skoda Octavia 2021 Combi ✓", "CZ: „Připraveno pro:“", [pre(d), suhrn(d)]);

const SUHRN_DAF = buildTruckOrderSummary({ znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "K2" }, selectedLemovanie: { name: "Červené lemovanie" } }, "sk");
d = stranka(KOSIK(KAMION), { ss: { truckOrderSummary: SUHRN_DAF, truckVehicle: "DAF (TIR) XF 2022-2025" } });
over(JSON.stringify(pre(d)) === JSON.stringify(["Pripravené pre: DAF XF 2022–2025 ✓"]), "kamión: vozidlo zo súhrnu konfigurácie", pre(d));
over(suhrn(d) === "Pripravené pre: DAF XF 2022–2025 ✓", "kamión: aj v súhrne", suhrn(d));
// nález kontroly 29. 10.: po pridaní DAF prezrel Volvo (truckVehicle sa prepíše, súhrn a poznámka ostávajú DAF)
d = stranka(KOSIK(KAMION), { ss: { truckOrderSummary: SUHRN_DAF, truckVehicle: "VOLVO FH 2021-2025" } });
const spec = [...d.querySelectorAll(".lcd-truck-cart-summary dd")].map(txt)[0];
over(JSON.stringify(pre(d)) === JSON.stringify(["Pripravené pre: DAF XF 2022–2025 ✓"]) && suhrn(d) === "Pripravené pre: DAF XF 2022–2025 ✓" && spec === "DAF (TIR) XF 2022-2025",
  "kamión: prezeral Volvo po pridaní DAF -> „Pripravené pre“ = DAF ako blok špecifikácie a poznámka", [pre(d), suhrn(d), spec]);
d = stranka(KOSIK(KAMION), { ss: { truckVehicle: "VOLVO FH 2021-2025" } });
over(!d.querySelector(".lcd-pre"), "kamión bez súhrnu (pridaný v inej karte): truckVehicle nie je v objednávke -> nič", pre(d));
d = stranka(KOSIK(KAMION + KAMION.replace(/it7/g, "it8").replace("68383", "68384")), { ss: { truckOrderSummary: SUHRN_DAF } });
over(!d.querySelector(".lcd-pre"), "dva kamióny, jeden súhrn: nevieme, ku ktorému patrí -> nič", pre(d));
d = stranka(KOSIK(SET()), { ss: Object.assign({ truckOrderSummary: SUHRN_DAF }, OCT) });
over(!d.querySelector(".lcd-pre"), "set, ale v karte súhrn kamióna: poznámka nesie len kamión (toNote) -> pri sete nič", pre(d));

d = stranka(REKAP(`<div class="cart-item"><div class="cart-item-name"><a href="/luxusne-autokoberce-dragonskin-diamond-line/" class="main-link">luxusné autokoberce
  <span class="main-link-variant">farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Čierna</span>
  <span class="main-link-surcharges">Príplatky: rozloženie kobercov - prvý a druhý rad, TYP - Combi</span></a></div></div>`), { ss: OCT });
over(!d.querySelector(".lcd-pre") && JSON.stringify(autoRozpis(d)) === JSON.stringify(["Auto: Skoda Octavia 2021 Combi"]), "rekapitulácia v krokoch: „Auto: …“ v rozpise ako doteraz", [pre(d), autoRozpis(d)]);

// ---------------------------------------------------------------- telefón: súhrn rastie až spolu s ponukou k setu (CLS)
// Ponuka sa vkladá NAD súhrn (na telefóne ho odsunie z obrazovky); vyšší súhrn = väčší posun (meranie 29. 10.: CLS prvej
// návštevy 0,138 -> 0,212). Kým ponuka beží (html[data-lcd-doplnok-caka]), riadok v súhrne a hodnotenie čakajú a vložia sa
// v tej istej úlohe ako ponuka (MutationObserver = pred ďalším vykreslením). PC (súhrn v pravom stĺpci) hneď.
const telefon = (w) => { w.matchMedia = (q) => ({ matches: /max-width:\s*991px/.test(q), media: q, addEventListener() {}, removeEventListener() {} }); };
d = stranka(KOSIK(SET()), { ss: OCT, recenzie: { place: { rating: 5, totalReviews: 89 }, reviews: [{}] }, pred: (w) => { telefon(w); w.document.documentElement.setAttribute("data-lcd-doplnok-caka", ""); } });
over(!d.querySelector(".summary-wrapper .lcd-pre") && !d.querySelector(".lcd-hodn-kosik") && pre(d).length === 1, "telefón, ponuka beží: súhrn zatiaľ bez riadku a hodnotenia (položka áno)", [suhrn(d), pre(d)]);
d.documentElement.setAttribute("data-lcd-doplnok", "1");
await new Promise((r) => setTimeout(r, 0));
over(suhrn(d) === "Pripravené pre: Skoda Octavia 2021 Combi ✓" && txt(d.querySelector(".lcd-hodn-kosik")) === "5,0 ★★★★★ · 89 recenzií na Google", "ponuka hotová: súhrn doplnený", suhrn(d));
d = stranka(KOSIK(SET()), { ss: OCT, pred: (w) => { w.document.documentElement.setAttribute("data-lcd-doplnok-caka", ""); } });
over(suhrn(d) === "Pripravené pre: Skoda Octavia 2021 Combi ✓", "PC (bez telefónnej šírky): súhrn hneď, aj keď ponuka beží", suhrn(d));
d = stranka(KOSIK(SET()), { ss: OCT, pred: telefon });
over(suhrn(d) === "Pripravené pre: Skoda Octavia 2021 Combi ✓", "telefón bez ponuky (vypnutá): súhrn hneď", suhrn(d));

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
over(d.querySelector(".lcd-hodn-kosik") && !d.querySelector(".lcd-pre"), "hodnotenie aj pri košíku len so vzorkami (bez auta)");

d = stranka(REKAP(""), { recenzie: DATA });
over(!d.querySelector(".lcd-hodn-kosik"), "v krokoch objednávky nie (len košík)");

console.log(zlyhania ? `\n${zlyhania} zlyhaní` : "\nVšetko OK");
process.exit(zlyhania ? 1 : 0);
