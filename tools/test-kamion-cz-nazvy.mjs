#!/usr/bin/env node
// CZ objednávka kamiónov ako SK (C21 + I2, kniha napady/2026-11-11-kamiony-vsetky-ulohy.md § 2.2): príplatky produktu
// CZ 2452 sa v admine premenujú (Název k zobrazení) na české názvy zhodné so SK a zoradia ako SK 640. Test dokazuje, že web
// funguje PRED premenovaním, PO ňom aj v KAŽDOM medzikroku (po jednom premenovaní), teda bez výpadku:
//   - nový konfigurátor (kamion/shoptet.js): chybajuce() = [], citajCeny, povoleneMotivy (boky, stred, dvere) a
//     syncToShoptet + upratTapacir vyberú tie isté možnosti (ID hodnôt sa premenovaním nemenia),
//   - React poistka (konfigurator.jsx aj konfigurator.phone.jsx, NEMENÍ sa): resolveValue pozná každý nový názov
//     (rovnaká hodnota ako pri dnešnom), syncToShoptet a readShoptetPrices dajú to isté,
//   - pricing.js jeParamDruhuNasivky zaradí nový názov na to isté miesto (boky / stred / dvere) ako dnešný,
//   - košík a pokladňa (opc/kamionZobrazenie.js, opc/kamionKarta.js, components/cart.js): hodnoty príplatkov, rozpis,
//     ponuka čalounění a súhrn v košíku sú rovnaké so starými aj novými názvami,
//   - poradie: príplatky idú do košíka (POST) v poradí selectov na stránke = poradie v admine; nový CZ = SK 640.
// Stránka 2452 je syntetická z čítania živej stránky 11. 11. 2026 (GET; ID, názvy, povinnosť a texty možností; farby skrátené)
// + 2 motívy navyše (H5 boky, H7 dvere), aby bolo vidno, že motívy sa čítajú zo selectov, nie zo zálohy NASIVKY_ZALOHA.
//   node tools/test-kamion-cz-nazvy.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { KOREN, FIXTURE, nacitajGen } from "./test-1v/kamion-spolocne.mjs";

const kosikDom = new JSDOM('<!doctype html><html lang="cs"><body></body></html>', { url: "https://www.luxurycardesign.cz/kosik/" });
globalThis.window = kosikDom.window;
globalThis.document = kosikDom.window.document;
globalThis.DOMParser = kosikDom.window.DOMParser;
globalThis.location = kosikDom.window.location;
globalThis.sessionStorage = kosikDom.window.sessionStorage;
const $ = (await import("jquery")).default;
globalThis.$ = globalThis.jQuery = kosikDom.window.$ = kosikDom.window.jQuery = $;

const SH = await import("../assets/js/components/konfigurator1v/kamion/shoptet.js");
const Z = await import("../assets/js/opc/kamionZobrazenie.js");
const K = await import("../assets/js/opc/kamionKarta.js");
const D = await import("../assets/js/lcdKosikDoplnok.js");
const { sTextamiPriplatkov } = await import("../assets/js/truck-konfigurator/farby-nazvy.mjs");
const { buildTruckOrderSummary } = await import("../assets/js/truck-konfigurator/order-summary.mjs");
const { changeDescription } = await import("../assets/js/components/cart.js");

let ok = 0, zle = 0;
function test(nazov, fn) {
  try { fn(); ok++; console.log("OK   " + nazov); } catch (e) { zle++; console.log("FAIL " + nazov + " — " + ((e && e.message) || e)); }
}
const J = (x) => JSON.stringify(x);
/** Objekt s kľúčmi zoradenými (hodnotyPriplatkov skladá kľúče v poradí textu košíka — poradie tu nie je predmetom porovnania). */
const zoradene = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
function rovne(a, b, msg) { if (J(a) !== J(b)) throw new Error((msg ? msg + ": " : "") + J(a) + " ≠ " + J(b)); }
function pravda(v, msg) { if (!v) throw new Error(msg || "nepravda"); }

// ------------------------------------------------------------------ názvy: kľúč SELECTY, ID na CZ 2452, dnes, nový (= kniha § 2.2)
// Poradie riadkov = cieľové poradie = živé poradie SK 640 (Object.keys(SELECTY)).
const NAZVY_CZ = [
  ["material", "91", "Materiál", "Typ materiálu"],
  ["farba", "319", "Barva", "Barva materiálu"],
  ["lemovanie", "322", "Lemování", "Barva lemování"],
  ["nasivky", "298", "Nášivky", "Rozložení nášivek"],
  ["bokyTyp", "343", "Nášivka boky", "Typ nášivek na boky"],
  ["bokyNit", "346", "Niť boky", "Barva nášivek na boky"],
  ["stredTyp", "349", "Nášivka stred", "Typ nášivky na střed"],
  ["stredNit", "352", "Niť stred", "Barva nášivky na střed"],
  ["tapacir", "301", "Čalounění", "Čalounění"],
  ["tapMaterial", "328", "Materiál dveře", "Typ materiálu tapacíru"],
  ["tapFarba", "331", "Barva dveře", "Barva materiálu tapacíru"],
  ["tapLem", "334", "Lemování dveře", "Barva lemování tapacíru"],
  ["tapNasivka", "304", "Nášivka dveře", "Nášivky na tapacír"],
  ["tapNasTyp", "337", "Nášivka dveře druh", "Typ nášivky na tapacír"],
  ["tapNasNit", "340", "Niť dveře", "Barva nášivek na tapacíru"],
];
const SK_640 = ["Typ materiálu", "Farba materiálu", "Farba lemovania", "Rozloženie nášiviek", "Typ nášiviek na boky", "Farba nášiviek na boky",
  "Typ nášivky na stred", "Farba nášivky na stred", "Tapacír", "Typ materiálu tapacíru", "Farba materiálu tapacíru", "Farba lemovania tapacíru",
  "Nášivky na tapacír", "Typ nášivky na tapacír", "Farba nášiviek na tapacíre"];

// ------------------------------------------------------------------ živá CZ 2452 (GET 11. 11. 2026): [id, meno dnes, povinný, možnosti]
// Poradie = dnešné poradie na stránke (admin: priorita prázdna -> abecedne podľa interného názvu „Barva dveří“, „Barva materiálu“ …).
const ZIVA_CZ = [
  ["331", "Barva dveře", false, [["1858","Stejná jako koberec +0 Kč",0],["1861","Vybere se v konfigurátoru +0 Kč",0],["2617","světle béžová – 1G +0 Kč",0],["2620","karamelová – 2G +0 Kč",0],["2623","hnědá – 3G +0 Kč",0],["2626","tmavě hnědá – 4G +0 Kč",0],["2644","černá – 10G +0 Kč",0],["2662","hnědá, hnědé prošití – 3 +0 Kč",0],["2668","černá, červené prošití – 5 +0 Kč",0],["2686","černá, černé prošití – 11 +0 Kč",0]]],
  ["319", "Barva", true, [["1840","Vybere se v konfigurátoru +0 Kč",0],["2416","světle béžová – 1G +0 Kč",0],["2419","karamelová – 2G +0 Kč",0],["2422","hnědá – 3G +0 Kč",0],["2425","tmavě hnědá – 4G +0 Kč",0],["2428","světle šedá – 5G +0 Kč",0],["2443","černá – 10G +0 Kč",0],["2461","hnědá, hnědé prošití – 3 +0 Kč",0],["2467","černá, červené prošití – 5 +0 Kč",0],["2485","černá, černé prošití – 11 +0 Kč",0]]],
  ["346", "Niť boky", false, [["1963","Vybere se v konfigurátoru +0 Kč",0],["1966","Bez nitě +0 Kč",0],["1969","Černá – 2999 +0 Kč",0],["1972","Stříbrná – 2901 +0 Kč",0],["1975","Světle šedá – 3738 +0 Kč",0],["1978","Béžová – 3546 +0 Kč",0],["1981","Světle hnědá – 3617 +0 Kč",0],["1984","Tmavě hnědá – 3504 +0 Kč",0],["1987","Hořčicová – 3501 +0 Kč",0],["1990","Červená – 2824 +0 Kč",0],["1993","Fialová – 2866 +0 Kč",0],["1996","Modrá – 3842 +0 Kč",0],["1999","Zelená – 2840 +0 Kč",0]]],
  ["340", "Niť dveře", false, [["1876","Stejná jako koberec +0 Kč",0],["1879","Vybere se v konfigurátoru +0 Kč",0],["2200","Bez nitě +0 Kč",0],["2203","Černá – 2999 +0 Kč",0],["2206","Stříbrná – 2901 +0 Kč",0],["2209","Světle šedá – 3738 +0 Kč",0],["2212","Béžová – 3546 +0 Kč",0],["2215","Světle hnědá – 3617 +0 Kč",0],["2218","Tmavě hnědá – 3504 +0 Kč",0],["2221","Hořčicová – 3501 +0 Kč",0],["2224","Červená – 2824 +0 Kč",0],["2227","Fialová – 2866 +0 Kč",0],["2230","Modrá – 3842 +0 Kč",0],["2233","Zelená – 2840 +0 Kč",0]]],
  ["352", "Niť stred", false, [["2083","Vybere se v konfigurátoru +0 Kč",0],["2086","Bez nitě +0 Kč",0],["2089","Černá – 2999 +0 Kč",0],["2092","Stříbrná – 2901 +0 Kč",0],["2095","Světle šedá – 3738 +0 Kč",0],["2098","Béžová – 3546 +0 Kč",0],["2101","Světle hnědá – 3617 +0 Kč",0],["2104","Tmavě hnědá – 3504 +0 Kč",0],["2107","Hořčicová – 3501 +0 Kč",0],["2110","Červená – 2824 +0 Kč",0],["2113","Fialová – 2866 +0 Kč",0],["2116","Modrá – 3842 +0 Kč",0],["2119","Zelená – 2840 +0 Kč",0]]],
  ["301", "Čalounění", true, [["1801","Ne, nechci čalounění dveří +0 Kč",0],["1804","Ano, chci (v konfigurátoru – balíček) +2 980 Kč",2980]]],
  ["343", "Nášivka boky", false, [["1882","Vybere se v konfigurátoru +0 Kč",0],["1885","Bez nášivky +0 Kč",0],["1936","Nášivka H19 +0 Kč",0],["1939","Nášivka H21 +0 Kč",0],["9001","Nášivka H5 +0 Kč",0]]],
  ["349", "Nášivka stred", false, [["2002","Vybere se v konfigurátoru +0 Kč",0],["2005","Bez nášivky +0 Kč",0],["2056","Nášivka H19 +0 Kč",0],["2059","Nášivka H21 +0 Kč",0]]],
  ["322", "Lemování", true, [["1843","Vybere se v konfigurátoru +0 Kč",0],["2560","černý základ, béžové proužky – 01 +0 Kč",0],["2563","černý základ, šedé proužky – 02 +0 Kč",0],["2566","černý základ, grafitové proužky – 03 +0 Kč",0],["2569","černý základ, červené proužky – 04 +0 Kč",0],["2572","černý základ, vínové proužky – 05 +0 Kč",0],["2575","černý základ, modré proužky – 06 +0 Kč",0],["2578","černý základ, zelené proužky – 07 +0 Kč",0],["2581","černý základ, hnědé proužky – 08 +0 Kč",0],["2584","černý základ, černé proužky – 09 +0 Kč",0],["2587","béžový základ, modré proužky – 10 +0 Kč",0],["2590","béžový základ, hnědé proužky – 11 +0 Kč",0],["2593","béžový základ, červené proužky – 12 +0 Kč",0],["2596","hnědý základ, béžové proužky – 13 +0 Kč",0]]],
  ["334", "Lemování dveře", false, [["1864","Stejné jako koberec +0 Kč",0],["1867","Vybere se v konfigurátoru +0 Kč",0],["2761","černý základ, béžové proužky – 01 +0 Kč",0],["2764","černý základ, šedé proužky – 02 +0 Kč",0],["2767","černý základ, grafitové proužky – 03 +0 Kč",0],["2770","černý základ, červené proužky – 04 +0 Kč",0],["2773","černý základ, vínové proužky – 05 +0 Kč",0],["2776","černý základ, modré proužky – 06 +0 Kč",0],["2779","černý základ, zelené proužky – 07 +0 Kč",0],["2782","černý základ, hnědé proužky – 08 +0 Kč",0],["2785","černý základ, černé proužky – 09 +0 Kč",0],["2788","béžový základ, modré proužky – 10 +0 Kč",0],["2791","béžový základ, hnědé proužky – 11 +0 Kč",0],["2794","béžový základ, červené proužky – 12 +0 Kč",0],["2797","hnědý základ, béžové proužky – 13 +0 Kč",0]]],
  ["91", "Materiál", true, [["1774","Prémiová syntetická kůže – jednobarevná +0 Kč",0],["1777","Prémiová syntetická kůže – prošívaná +250 Kč",250],["1780","Prémiová syntetická kůže – tónovaná +1 000 Kč",1000],["1783","Mikrosemiš – jednobarevný +1 000 Kč",1000],["1786","Mikrosemiš – dvoubarevný +1 250 Kč",1250],["2413","Vzorovaný velur +1 500 Kč",1500]]],
  ["328", "Materiál dveře", false, [["1852","Stejný jako koberec +0 Kč",0],["1855","Vybere se v konfigurátoru +0 Kč",0],["2599","Prémiová syntetická kůže – jednobarevná +0 Kč",0],["2602","Prémiová syntetická kůže – prošívaná +0 Kč",0],["2605","Prémiová syntetická kůže – tónovaná +0 Kč",0],["2608","Mikrosemiš – jednobarevný +0 Kč",0],["2611","Mikrosemiš – dvoubarevný +0 Kč",0],["2614","Vzorovaný velur +0 Kč",0]]],
  ["337", "Nášivka dveře druh", false, [["1870","Stejná jako koberec +0 Kč",0],["1873","Vybere se v konfigurátoru +0 Kč",0],["2122","Bez nášivky +0 Kč",0],["2173","Nášivka H19 +0 Kč",0],["2176","Nášivka H21 +0 Kč",0],["9002","Nášivka H7 +0 Kč",0]]],
  ["304", "Nášivka dveře", false, [["1807","Ne, nechci nášivku na dveřích +0 Kč",0],["1810","Ano, chci nášivku na dveřích +1 230 Kč",1230]]],
  ["298", "Nášivky", true, [["1789","Bez nášivek +0 Kč",0],["1792","Jen střed +1 480 Kč",1480],["1795","Řidič + spolujezdec +2 230 Kč",2230],["1798","Řidič + spolujezdec + střed (BALÍČEK) +3 480 Kč",3480]]],
];
const PODLA_ID = Object.fromEntries(ZIVA_CZ.map((r) => [r[0], r]));
const NOVE = Object.fromEntries(NAZVY_CZ.map((r) => [r[1], r[3]]));
const STARE = Object.fromEntries(NAZVY_CZ.map((r) => [r[1], r[2]]));
const ID_ZIVE = ZIVA_CZ.map((r) => r[0]);
const ID_CIEL = NAZVY_CZ.map((r) => r[1]);

/** HTML stránky 2452: poradie = zoznam ID, meno(id) = názov selectu (data-parameter-name). */
function htmlStranky(poradie, meno) {
  const sel = poradie.map((id) => {
    const [, , povinny, mozn] = PODLA_ID[id];
    const opt = mozn.map(([v, t, c]) => `<option value="${v}" data-surcharge-final-price="${c}" data-surcharge-additional-price="${c}">${t}</option>`).join("");
    return `<tr><th>${meno(id)}</th><td><select name="surchargeParameterValueId[${id}]" id="surcharge-parameter-id-${id}" class="parameter-id-${id} surcharge-parameter form-control" data-parameter-id="${id}" data-parameter-name="${meno(id)}"${povinny ? ' required="required"' : ""}><option value="" data-choose="true" data-index="0">Vyberte příplatek</option>${opt}</select></td></tr>`;
  }).join("\n");
  return `<!doctype html><html lang="cs"><head></head><body><div class="p-info-wrapper">
<form id="product-detail-form" action="/action/Cart/addCartItem/" method="post">
<input type="hidden" name="productId" value="2452"><input type="hidden" name="priceId" value="46279"><input type="hidden" name="language" value="cs">
<meta itemprop="price" content="4980.00">
<table class="detail-parameters"><tbody>
${sel}
</tbody></table>
<div class="add-to-cart"><button type="submit" class="btn add-to-cart-button">Do košíku</button></div>
</form></div></body></html>`;
}
const stranka = (poradie, meno) => new JSDOM(htmlStranky(poradie, meno), { url: "https://www.luxurycardesign.cz/luxusni-autokoberce-kamiony/" }).window;

// Varianty stránky: dnes, cieľ, len poradie, len názvy, zmiešané a každý medzikrok postupu (po jednom premenovaní).
const VARIANTY = [
  ["dnes (staré názvy, živé poradie)", ID_ZIVE, (id) => STARE[id]],
  ["cieľ (nové názvy, poradie SK)", ID_CIEL, (id) => NOVE[id]],
  ["len nové poradie, staré názvy", ID_CIEL, (id) => STARE[id]],
  ["len nové názvy, staré poradie", ID_ZIVE, (id) => NOVE[id]],
  ["zmiešané (každý druhý premenovaný)", ID_ZIVE, (id) => (ID_CIEL.indexOf(id) % 2 ? NOVE[id] : STARE[id])],
];
for (let k = 1; k < NAZVY_CZ.length; k++) {
  const hotove = new Set(ID_CIEL.slice(0, k));
  VARIANTY.push(["postup: premenovaných " + k + " z 15", ID_CIEL, (id) => (hotove.has(id) ? NOVE[id] : STARE[id])]);
}

// ------------------------------------------------------------------ React (NEMENÍ sa): resolveValue vyrezaný doslovne, sync + ceny cez nacitajGen
function reactResolve(subor) {
  const src = readFileSync(join(KOREN, "assets", "js", "truck-konfigurator", subor), "utf8");
  const i = src.indexOf("function resolveValue("), j = src.indexOf("\nfunction syncToShoptet(");
  if (i < 0 || j < i) throw new Error(subor + ": nenašiel som resolveValue");
  return new Function(src.slice(i, j) + "\nreturn resolveValue;")();
}
const REACT = { "konfigurator.jsx (PC)": reactResolve("konfigurator.jsx"), "konfigurator.phone.jsx (telefón)": reactResolve("konfigurator.phone.jsx") };
const REACT_SUBORY = ["konfigurator.jsx", "konfigurator.phone.jsx"];
const jeParamDruhuNasivky = (function () {
  const src = readFileSync(join(KOREN, "assets", "js", "truck-konfigurator", "pricing.js"), "utf8");
  const i = src.indexOf("function bezDiakritiky("), j = src.indexOf("function jeParamDruhuNasivky(");
  if (i < 0 || j < 0) throw new Error("pricing.js: nenašiel som jeParamDruhuNasivky");
  const koniec = (od) => { const m = /\r?\n\}\r?\n/.exec(src.slice(od)); if (!m) throw new Error("pricing.js: koniec funkcie"); return od + m.index + m[0].length; };
  return new Function(src.slice(i, koniec(i)) + src.slice(j, koniec(j)) + "\nreturn jeParamDruhuNasivky;")();
})();

// ------------------------------------------------------------------ stavy konfigurátora (tvar React finalConfiguration)
const ZAKLAD = {
  znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "04" },
};
const STAVY = {
  "balík nášiviek, bez čalounění": Object.assign({}, ZAKLAD, {
    nasivkyPlacement: "boky+stred", selectedNasivka: { code: "H19" }, selectedNitColor: { code: "2999" },
    selectedStredNasivka: { code: "H21" }, selectedStredNitColor: { code: "2840" }, doorPanelChoice: "nie",
  }),
  "len stred, čalounění ako koberce bez nášivky": Object.assign({}, ZAKLAD, {
    nasivkyPlacement: "stred", selectedStredNasivka: { code: "H19" }, selectedStredNitColor: { code: "3842" },
    doorPanelChoice: "ano", doorSameAsCarpet: { material: true, lemovanie: true }, doorWantsNasivka: false,
  }),
  "boky H5, vlastné čalounění s nášivkou H7": Object.assign({}, ZAKLAD, {
    selectedMaterial: "Mikrosemiš – jednofarebný", selectedColor: { code: "10G" }, selectedLemovanie: { code: "09" },
    nasivkyPlacement: "boky", selectedNasivka: { code: "H5" }, selectedNitColor: { code: "2901" },
    doorPanelChoice: "ano", doorSameAsCarpet: { material: false, lemovanie: false }, doorMaterial: "Prémiová syntetická koža – jednofarebná",
    doorColor: { code: "10G" }, doorLemovanie: { code: "09" }, doorWantsNasivka: true, doorSameNasivkaAsCarpet: false,
    doorNasivka: { code: "H7" }, doorSameNitAsCarpet: false, doorNitColor: { code: "2824" },
  }),
  "bez nášiviek, čalounění s rovnakou nášivkou": Object.assign({}, ZAKLAD, {
    nasivkyPlacement: "nechcem", doorPanelChoice: "ano", doorSameAsCarpet: { material: true, lemovanie: false },
    doorLemovanie: { code: "01" }, doorWantsNasivka: true, doorSameNasivkaAsCarpet: true, doorNasivka: { code: "H19" },
    doorSameNitAsCarpet: true, doorNitColor: { code: "2999" },
  }),
  // farba, ktorú admin (fixture) ešte nemá -> „Vybere se v konfigurátoru“ (záložný zoznam v košíku ju má skryť)
  "farba mimo adminu (zástupná hodnota)": Object.assign({}, ZAKLAD, { selectedColor: { code: "7G" }, nasivkyPlacement: "nechcem", doorPanelChoice: "nie" }),
};
const SPLNY = "boky H5, vlastné čalounění s nášivkou H7";
const BEZ_TAP = "balík nášiviek, bez čalounění";
const ZASTUPNA = "farba mimo adminu (zástupná hodnota)";

/** Spustí fn s globálnym document/Event/sessionStorage okna w (syncToShoptet číta globálny document). */
function vOkne(w, fn) {
  const p = [globalThis.document, globalThis.Event, globalThis.sessionStorage];
  globalThis.document = w.document; globalThis.Event = w.Event; globalThis.sessionStorage = w.sessionStorage;
  try { return fn(); } finally { [globalThis.document, globalThis.Event, globalThis.sessionStorage] = p; }
}
const vybrate = (doc) => Object.fromEntries(Array.from(doc.querySelectorAll("select[data-parameter-id]")).map((s) => [s.getAttribute("data-parameter-id"), s.value]));
const bezCeny = (t) => String(t).replace(/\s*\+\s*\d[\d\s ]*(?:[.,]\d+)?\s*(?:Kč|€)\s*$/, "").trim();
/** Text príplatkov riadku košíka ako Shoptet: „Příplatky: Meno - hodnota, …“ v poradí selectov (= poradie v admine). */
function textKosika(doc) {
  const casti = Array.from(doc.querySelectorAll("#product-detail-form select.surcharge-parameter")).filter((s) => s.value)
    .map((s) => s.getAttribute("data-parameter-name") + " - " + bezCeny(s.options[s.selectedIndex].textContent));
  return "Příplatky: " + casti.join(", ");
}
const klucPodlaMena = (meno) => Object.keys(SH.SELECTY).find((k) => SH.SELECTY[k].some((m) => m.toLowerCase() === String(meno).trim().toLowerCase())) || "?" + meno;
const poradieKlucov = (doc) => Array.from(doc.querySelectorAll("select[data-parameter-id][data-parameter-name]")).map((s) => klucPodlaMena(s.getAttribute("data-parameter-name")));
const synchronizuj = (poradie, meno, stav0) => {
  const w = stranka(poradie, meno);
  vOkne(w, () => SH.syncToShoptet(sTextamiPriplatkov(stav0, "cs")));
  return w.document;
};

/** Všetko, čo web zo stránky prečíta / do nej zapíše, pre jeden variant stránky. */
function vysledok(poradie, meno) {
  const out = { sync: {}, react: {}, kosik: {}, hodnoty: {} };
  const w0 = stranka(poradie, meno);
  out.chybajuce = SH.chybajuce(w0.document);
  out.ceny = SH.citajCeny(w0.document);
  out.motivy = SH.povoleneMotivy(w0.document);
  out.reactCeny = Object.fromEntries(REACT_SUBORY.map((subor) => [subor, nacitajGen(subor, stranka(poradie, meno)).readShoptetPrices({})]));
  const m0 = D.mapaZFormulara(w0.document);
  out.mapaId = Object.fromEntries(Object.keys(SH.SELECTY).map((k) => [k, K.idParametra(m0, k)]));
  for (const [nazov, stav0] of Object.entries(STAVY)) {
    const stav = sTextamiPriplatkov(stav0, "cs");
    const w = stranka(poradie, meno);
    vOkne(w, () => { SH.syncToShoptet(stav); SH.upratTapacir(stav, w.document); });
    out.sync[nazov] = vybrate(w.document);
    out.kosik[nazov] = textKosika(w.document);
    out.hodnoty[nazov] = zoradene(Z.hodnotyPriplatkov(out.kosik[nazov]));
    for (const subor of REACT_SUBORY) {
      const wr = stranka(poradie, meno);
      nacitajGen(subor, wr).syncToShoptet(stav);
      out.react[subor + " / " + nazov] = vybrate(wr.document);
    }
  }
  const p = K.ponukaTapaciru({ itemId: "c1", priceId: "46279", q: 1, sur: out.kosik[BEZ_TAP], href: "/luxusni-autokoberce-kamiony/", text: "luxusní autokoberce do kamionů" }, m0);
  out.ponuka = p && { zmena: p.zmena, rozdiel: p.rozdiel.s };
  out.skupiny = K.skupinyZPriplatkov(out.kosik[SPLNY], "cs", "DAF XF 2022-2025");
  return out;
}

// ------------------------------------------------------------------ 1. názvy: SELECTY, React, jeParamDruhuNasivky
test("každý nový CZ názov aj dnešný CZ názov je v SELECTY pri správnom kľúči (15 + 15)", () => {
  rovne(Object.keys(SH.SELECTY), NAZVY_CZ.map((r) => r[0]), "poradie kľúčov SELECTY = poradie SK");
  NAZVY_CZ.forEach(([k, , stary, novy]) => {
    const mena = SH.SELECTY[k].map((x) => x.toLowerCase());
    pravda(mena.includes(stary.toLowerCase()), k + ": SELECTY nepozná dnešný „" + stary + "“");
    pravda(mena.includes(novy.toLowerCase()), k + ": SELECTY nepozná nový „" + novy + "“");
    rovne(klucPodlaMena(novy), k, "nový názov patrí inému kľúču");
    rovne(klucPodlaMena(stary), k, "dnešný názov patrí inému kľúču");
  });
});

// Pozn.: fixture 640 (tools/test-1v/kamion-640.fixture.html) má ešte poradie spred 25. 10. 2026 — živé SK poradie je SK_640 (GET 11. 11.).
test("SK 640 bez zmeny: prvý názov v SELECTY = živý SK názov v živom poradí, fixture 640 má všetkých 15 selectov", () => {
  rovne(Object.keys(SH.SELECTY).map((k) => SH.SELECTY[k][0]), SK_640);
  const w = new JSDOM(readFileSync(FIXTURE, "utf8"), { url: "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/" }).window;
  rovne(SH.chybajuce(w.document), []);
  rovne(poradieKlucov(w.document).slice().sort(), Object.keys(SH.SELECTY).slice().sort(), "selecty SK 640");
});

for (const [subor, rv] of Object.entries(Object.assign({ "kamion/shoptet.js (kópia)": SH.resolveValue }, REACT))) {
  test("resolveValue " + subor + ": nový názov = rovnaká hodnota ako dnešný (5 stavov), v plnom stave nikdy null", () => {
    for (const [nazov, stav0] of Object.entries(STAVY)) {
      const stav = sTextamiPriplatkov(stav0, "cs");
      NAZVY_CZ.forEach(([k, , stary, novy]) => {
        rovne(rv(novy, stav), rv(stary, stav), nazov + " / " + k + " „" + novy + "“");
        if (nazov === SPLNY) pravda(rv(novy, stav) !== null, k + ": „" + novy + "“ vráti null");
        rovne(rv(" " + novy.toUpperCase() + " ", stav), rv(novy, stav), "veľkosť písmen a medzery");
      });
    }
  });
}

test("pricing.js jeParamDruhuNasivky: nový názov na tom istom mieste ako dnešný (boky / stred / dvere)", () => {
  NAZVY_CZ.forEach(([k, , stary, novy]) => {
    ["boky", "stred", "dvere"].forEach((kde) => rovne(jeParamDruhuNasivky(novy, kde), jeParamDruhuNasivky(stary, kde), k + " " + kde + " „" + novy + "“"));
  });
  rovne(["boky", "stred", "dvere"].map((kde) => NAZVY_CZ.filter(([, , , n]) => jeParamDruhuNasivky(n, kde)).map((r) => r[0])),
    [["bokyTyp"], ["stredTyp"], ["tapNasivka", "tapNasTyp"]], "druh nášivky");
});

// ------------------------------------------------------------------ 2. stránka: dnes vs. cieľ vs. každý medzikrok
const DNES = vysledok(ID_ZIVE, (id) => STARE[id]);

test("dnes: konfigurátor sa postaví, ceny zo Shoptetu, motívy zo selectov (nie záloha), React = nový konfigurátor", () => {
  rovne(DNES.chybajuce, []);
  rovne(DNES.ceny.zaklad_eur, 4980);
  rovne(DNES.ceny.priplatky.nasivky_rozlozenie, { nechcem: 0, stred: 1480, boky: 2230, "boky+stred": 3480 });
  rovne([DNES.ceny.priplatky.tapacir_balik, DNES.ceny.priplatky.nasivka_na_dverach], [2980, 1230]);
  rovne(DNES.ceny.nezhody, []);
  rovne(DNES.motivy, { boky: ["H19", "H21", "H5"], stred: ["H19", "H21"], dvere: ["H19", "H21", "H7"] });
  rovne(Object.values(DNES.mapaId).filter(Boolean).length, 15, "idParametra pozná všetkých 15");
  pravda(DNES.ponuka && DNES.ponuka.rozdiel === 2980, "ponuka čalounění: " + J(DNES.ponuka));
  Object.entries(DNES.react).forEach(([k, v]) => rovne(v, DNES.sync[k.split(" / ")[1]], "React = nový konfigurátor: " + k));
  rovne(DNES.sync[SPLNY], { 331: "2644", 319: "2443", 346: "1972", 340: "2224", 352: "2086", 301: "1804", 343: "9001", 349: "2005", 322: "2584",
    334: "2785", 91: "1783", 328: "2599", 337: "9002", 304: "1810", 298: "1795" }, "plný stav: konkrétne možnosti");
});

for (const [nazov, poradie, meno] of VARIANTY.slice(1)) {
  test("stránka „" + nazov + "“ = dnes: chybajuce, ceny, motívy, sync, React, košík, ponuka čalounění", () => {
    const v = vysledok(poradie, meno);
    rovne(v.chybajuce, [], "chybajuce");
    rovne(v.ceny, DNES.ceny, "citajCeny");
    rovne(v.motivy, DNES.motivy, "povoleneMotivy");
    rovne(v.reactCeny, DNES.reactCeny, "React readShoptetPrices");
    rovne(v.mapaId, DNES.mapaId, "idParametra");
    rovne(v.sync, DNES.sync, "syncToShoptet + upratTapacir");
    rovne(v.react, DNES.react, "React syncToShoptet (PC + telefón)");
    rovne(v.hodnoty, DNES.hodnoty, "hodnotyPriplatkov košíka");
    rovne(v.skupiny, DNES.skupiny, "rozpis z príplatkov (pokladňa)");
    rovne(v.ponuka, DNES.ponuka, "ponuka čalounění v pokladni");
  });
}

// ------------------------------------------------------------------ 3. poradie: POST a popis položky idú v poradí selectov
test("poradie: dnes CZ ≠ SK; po zoradení v admine CZ = SK 640 (selecty, POST aj text košíka)", () => {
  const dnes = stranka(ID_ZIVE, (id) => STARE[id]).document, ciel = stranka(ID_CIEL, (id) => NOVE[id]).document;
  pravda(J(poradieKlucov(dnes)) !== J(Object.keys(SH.SELECTY)), "dnešné CZ poradie by malo byť iné ako SK");
  rovne(poradieKlucov(ciel), Object.keys(SH.SELECTY));
  for (const d of [dnes, ciel]) {
    // náš kód poradie nemení: POST (FormData formulára) ide v poradí selectov na stránke
    const post = Array.from(new d.defaultView.FormData(d.getElementById("product-detail-form")).keys()).filter((k) => /^surcharge/.test(k)).map((k) => /\[(\d+)\]/.exec(k)[1]);
    rovne(post, Array.from(d.querySelectorAll("select[data-parameter-id]")).map((s) => s.getAttribute("data-parameter-id")), "POST = poradie selectov");
  }
  const t = textKosika(synchronizuj(ID_CIEL, (id) => NOVE[id], STAVY[SPLNY]));
  rovne(t.replace(/^Příplatky: /, "").split(/, (?=[^,]+ - )/).map((c) => c.split(" - ")[0]), NAZVY_CZ.map((r) => r[3]), "popis položky = 15 nových názvov v poradí SK");
});

// ------------------------------------------------------------------ 4. košík (components/cart.js): súhrn aj záložný zoznam
function kosik(riadky, suhrn) {
  document.body.innerHTML = "<table><tbody>" + riadky.map((sur) => `<tr class="removeable"><td><a class="main-link" href="/luxusni-autokoberce-kamiony/">luxusní autokoberce do kamionů</a></td><td><span class="main-link-surcharges">${sur}</span></td></tr>`).join("") + "</tbody></table>";
  sessionStorage.clear();
  if (suhrn) sessionStorage.setItem("truckOrderSummary", suhrn);
  changeDescription();
  return document.body;
}
const SUHRN_CS = buildTruckOrderSummary(sTextamiPriplatkov(STAVY[SPLNY], "cs"), "cs");
const SUR_NOVY = textKosika(synchronizuj(ID_CIEL, (id) => NOVE[id], STAVY[SPLNY]));

test("košík: súhrn kamióna je rovnaký so starými aj novými názvami; súhrn pre poznámku objednávky sa nemení", () => {
  const a = kosik([DNES.kosik[SPLNY]], SUHRN_CS).querySelector(".lcd-truck-cart-summary");
  pravda(a, "chýba súhrn (staré názvy)");
  const ta = a.textContent;
  rovne(sessionStorage.getItem("truckOrderSummary"), SUHRN_CS, "súhrn v sessionStorage");
  const b = kosik([SUR_NOVY], SUHRN_CS).querySelector(".lcd-truck-cart-summary");
  pravda(b, "chýba súhrn (nové názvy)");
  rovne(b.textContent, ta, "súhrn v košíku");
  rovne(sessionStorage.getItem("truckOrderSummary"), SUHRN_CS, "súhrn v sessionStorage");
  pravda(/Mikrosemiš – jednobarevný/.test(ta) && /Prémiová syntetická kůže – jednobarevná/.test(ta), ta);
});

test("košík, 2 kamióny (záložný zoznam z príplatkov): poradie ako v admine, bez „Vybere se v konfigurátoru“", () => {
  const sur = textKosika(synchronizuj(ID_CIEL, (id) => NOVE[id], STAVY[ZASTUPNA]));
  pravda(/Barva materiálu - Vybere se v konfigurátoru/.test(sur), "fixture: čakám zástupnú hodnotu farby — " + sur);
  const li = Array.from(kosik([sur, sur], SUHRN_CS).querySelectorAll(".setup li")).map((x) => x.textContent);
  pravda(li.length > 0 && li.length % 2 === 0, J(li));
  pravda(!li.some((x) => /Vybere se v konfigurátoru|Vyberie sa v konfigurátore/.test(x)), J(li));
  const mena = li.slice(0, li.length / 2).map((x) => x.split(" - ")[0]);
  rovne(mena, NAZVY_CZ.map((r) => r[3]).filter((n) => mena.includes(n)), "poradie odrážok");
});

test("prechod: košík so starými názvami, stránka už premenovaná -> ponuka čalounění sa neukáže, rozpis ide ďalej", () => {
  const m = D.mapaZFormulara(stranka(ID_CIEL, (id) => NOVE[id]).document);
  const p = K.ponukaTapaciru({ itemId: "c1", priceId: "46279", q: 1, sur: DNES.kosik[BEZ_TAP], href: "/luxusni-autokoberce-kamiony/", text: "luxusní autokoberce do kamionů" }, m);
  rovne(p, null);
  rovne(K.skupinyZPriplatkov(DNES.kosik[SPLNY], "cs", "DAF XF 2022-2025"), DNES.skupiny, "rozpis zo starých názvov");
});

console.log(`\nSpolu: ${ok} OK, ${zle} zlyhalo`);
if (zle) process.exit(1);
