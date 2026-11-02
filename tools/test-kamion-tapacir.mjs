// Testy kamióna v karte „Váš košík“ pokladne (assets/js/opc/kamionKarta.js, Michal 2. 11. 2026): rozpis z príplatkov
// riadku košíka / súhrnu konfigurátora, ponuka „Tapacír dverí“ (hodnoty ako konfigurátor „Rovnaké ako koberce“) a súhrn
// do poznámky objednávky po pridaní tapacíru (rovnaký formát ako z konfigurátora).
//   node tools/test-kamion-tapacir.mjs        (npm run kamion:test)
// SK: stránka produktu 640 z podvrhu pokladne (tools/test-opc/podvrh.mjs KAMION_PRODUKT, id a texty zo zachyteného POST
// 18. 10. 2026). CZ 2452: 🟡 syntetická stránka s menami príplatkov a hodnotami z tools/test-1v/scenare-kamion.mjs.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://www.luxurycardesign.sk/kosik/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.location = dom.window.location;
globalThis.sessionStorage = dom.window.sessionStorage;

const K = await import("../assets/js/opc/kamionKarta.js");
const D = await import("../assets/js/lcdKosikDoplnok.js");
const { buildTruckOrderSummary, addSameDoorPanelsToSummary } = await import("../assets/js/truck-konfigurator/order-summary.mjs");
const { strankaProduktuPonuky, KAMION_PRODUKT, KAMION_S_TAPACIROM, KAMION_BEZ_TAPACIRU } = await import("./test-opc/podvrh.mjs");

let ok = 0, zle = 0;
function test(nazov, fn) {
  try { fn(); ok++; console.log("OK   " + nazov); } catch (e) { zle++; console.log("FAIL " + nazov + " — " + (e && e.message)); }
}
function rovne(a, b, msg) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja !== jb) throw new Error((msg ? msg + ": " : "") + ja + " ≠ " + jb);
}
function pravda(v, msg) { if (!v) throw new Error(msg || "nepravda"); }
const mapa = (html) => D.mapaZFormulara(new DOMParser().parseFromString(html, "text/html"));
const ulozisko = (d) => ({ getItem: (k) => (k in d ? d[k] : null) , setItem: (k, v) => { d[k] = String(v); } });

// ------------------------------------------------------------------ SK 640
const SUR_S = "Príplatky: Typ materiálu - Prémiová syntetická koža – prešívaná, Farba materiálu - čierna, čierne šitie – 11, Farba lemovania - čierny základ, červené pásiky – 04, Rozloženie nášiviek - Šofér + spolujazdec + stred (BALÍK), Typ nášiviek na boky - Nášivka H19, Farba nášiviek na boky - Čierna – 2999, Typ nášivky na stred - Nášivka H19, Farba nášivky na stred - Čierna – 2999, " + KAMION_S_TAPACIROM + "Nášivky na tapacír - Nie nechcem nášivku na dverách, Typ nášivky na tapacír - Bez nášivky, Farba nášiviek na tapacíre - Bez nite";
const SUR_BEZ = SUR_S.split(KAMION_S_TAPACIROM).join(KAMION_BEZ_TAPACIRU);
const riadok = (sur) => ({ itemId: "i1", priceId: "68383", q: 1, sur, href: "/luxusne-autokoberce-kamiony/", text: "Luxusné autokoberce do kamionov", sku: "640" });
const MAPA_SK = mapa(strankaProduktuPonuky(KAMION_PRODUKT, KAMION_PRODUKT.cena));
const STAV = {
  znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "04" },
  nasivkyPlacement: "boky+stred", selectedNasivka: { code: "H19" }, selectedNitColor: { code: "2999" },
  selectedStredNasivka: { code: "H19" }, selectedStredNitColor: { code: "2999" },
};
const S_TAP = Object.assign({}, STAV, { doorPanelChoice: "ano", doorSameAsCarpet: { material: true, lemovanie: true }, doorWantsNasivka: false });
const S_BEZ = Object.assign({}, STAV, { doorPanelChoice: "nie" });

test("je kamión: názov / adresa produktu; set autokobercov nie", () => {
  pravda(K.jeKamion(riadok(SUR_S)));
  pravda(K.jeKamion({ text: "", href: "/luxusne-autokoberce-kamiony/" }));
  pravda(!K.jeKamion({ text: "Luxusné autokoberce Dragonskin Diamond Line", href: "/luxusne-autokoberce-dragonskin-diamond-line/" }));
});

test("hodnoty príplatkov: 15 parametrov podľa mien (čiarky v hodnotách nevadia)", () => {
  const h = K.hodnotyPriplatkov(SUR_S);
  rovne(h.farba, "čierna, čierne šitie – 11");
  rovne(h.lemovanie, "čierny základ, červené pásiky – 04");
  rovne(h.tapacir, "Áno chcem (v konfigurátore – balík)");
  rovne(h.tapNasNit, "Bez nite");
  rovne(K.hodnotyPriplatkov(SUR_BEZ).tapacir, "Nie nechcem tapacír dverí");
});

test("rozpis bez súhrnu: z príplatkov, materiál navrchu, tapacír jedným riadkom", () => {
  const u = K.udajeKamiona(riadok(SUR_S), { ss: ulozisko({}), jazyk: "sk", jediny: true });
  const r = K.riadkyRozpisu(u.skupiny, "sk", "sk");
  rovne(r[0], { n: "Typ a farba materiálu", h: "Prémiová syntetická koža – prešívaná – čierna, čierne šitie – 11" });
  rovne(r[r.length - 1], { n: "Tapacír dverí", h: "rovnaký ako koberčeky" });
  pravda(!r.some((x) => /Bez nášivky/.test(x.h)), "„Bez nášivky“ v rozpise: " + JSON.stringify(r));
});

test("rozpis zo súhrnu konfigurátora (jediný kamión): vozidlo navrchu, prevodovka", () => {
  const ss = ulozisko({ truckOrderSummary: buildTruckOrderSummary(S_TAP, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" });
  const u = K.udajeKamiona(riadok(SUR_S), { ss, jazyk: "sk", jediny: true });
  pravda(u.zoSuhrnu, "nepoužil súhrn");
  const r = K.riadkyRozpisu(u.skupiny, "sk", "sk");
  rovne(r[0], { n: "Vozidlo", h: "DAF XF 2022–2025" }, "vozidlo ako v konfigurátore (bez „(TIR)“, pomlčka)");
  rovne(r[1], { n: "Typ prevodovky", h: "Automatická prevodovka" });
  rovne(r[r.length - 1], { n: "Tapacír dverí", h: "rovnaký ako koberčeky" });
});

test("súhrn iného kamióna (nesedí s príplatkami) sa nepoužije, ani pri 2 kamiónoch", () => {
  const iny = Object.assign({}, S_TAP, { selectedColor: { code: "12" } });
  const ss = ulozisko({ truckOrderSummary: buildTruckOrderSummary(iny, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" });
  pravda(!K.udajeKamiona(riadok(SUR_S), { ss, jazyk: "sk", jediny: true }).zoSuhrnu, "súhrn s farbou 12 pri riadku s farbou 11");
  const ss2 = ulozisko({ truckOrderSummary: buildTruckOrderSummary(S_TAP, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" });
  pravda(!K.udajeKamiona(riadok(SUR_S), { ss: ss2, jazyk: "sk", jediny: false }).zoSuhrnu, "súhrn pri 2 kamiónoch");
});

test("ponuka tapacíru: kamión bez tapacíru -> 7 hodnôt ako konfigurátor, +119 €", () => {
  const p = K.ponukaTapaciru(riadok(SUR_BEZ), MAPA_SK);
  pravda(p, "žiadna ponuka");
  rovne(p.zmena, { 352: "1468", 388: "1435", 391: "1441", 394: "1447", 355: "1390", 397: "1711", 400: "1789" });
  rovne(p.rozdiel.s, 119);
  rovne(p.volby[346], "1360", "materiál ostáva");
  rovne(p.volby[376], "91501", "farba ostáva");
});

test("ponuka tapacíru: kamión s tapacírom / príplatky nesedia s mapou -> nič", () => {
  rovne(K.ponukaTapaciru(riadok(SUR_S), MAPA_SK), null);
  rovne(K.ponukaTapaciru(riadok(SUR_BEZ.replace("čierna, čierne šitie – 11", "biela – 99")), MAPA_SK), null);
  rovne(K.ponukaTapaciru(riadok(SUR_BEZ), { params: {} }), null);
});

test("súhrn po pridaní tapacíru = súhrn z konfigurátora s „Rovnaké ako koberce“ (SK aj CZ)", () => {
  rovne(addSameDoorPanelsToSummary(buildTruckOrderSummary(S_BEZ, "sk")), buildTruckOrderSummary(S_TAP, "sk"));
  rovne(addSameDoorPanelsToSummary(buildTruckOrderSummary(S_BEZ, "cs")), buildTruckOrderSummary(S_TAP, "cs"));
  // už má dvere -> bez zmeny
  rovne(addSameDoorPanelsToSummary(buildTruckOrderSummary(S_TAP, "sk")), buildTruckOrderSummary(S_TAP, "sk"));
});

test("riadok s tapacírom a súhrn bez neho (po výmene) -> súhrn doplnený v sessionStorage", () => {
  const d = { truckOrderSummary: buildTruckOrderSummary(S_BEZ, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" };
  const u = K.udajeKamiona(riadok(SUR_S), { ss: ulozisko(d), jazyk: "sk", jediny: true });
  pravda(u.zoSuhrnu, "nepoužil súhrn");
  rovne(d.truckOrderSummary, buildTruckOrderSummary(S_TAP, "sk"));
});

test("karta ponuky: texty SK, cena a úspora (179 € samostatne)", () => {
  const p = K.ponukaTapaciru(riadok(SUR_BEZ), MAPA_SK);
  const k = K.kartaTapaciru(document, { riadok: riadok(SUR_BEZ), mapa: MAPA_SK, volby: p.volby, zmena: p.zmena, rozdiel: p.rozdiel }, { R: { trh: "sk", mena: "EUR" }, forma: "f" });
  const t = k.textContent.replace(/\s+/g, " ");
  pravda(/Doplňte svoj kamión/.test(t) && /Tapacír dverí/.test(t) && /\+119 €/.test(t) && /ušetríte 60 €/.test(t), t);
  pravda(k.querySelector(".lcd-vyb__btn[data-lcd-vyb=tapacir]"), "chýba tlačidlo");
});

// ------------------------------------------------------------------ CZ 2452 (mená príplatkov ako tools/test-1v/scenare-kamion.mjs)
const KAMION_CZ = {
  pid: "2452", priceId: "99452", lang: "cs",
  sels: [
    { id: "1", n: "Materiál", o: [["11", "Prémiová syntetická kůže – prošívaná +250 Kč", "250"]] },
    { id: "2", n: "Barva", o: [["21", "černá, černé šití – 11 +0 Kč", "0"], ["22", "Vybere se v konfigurátoru +0 Kč", "0"]] },
    { id: "3", n: "Lemování", o: [["31", "černý základ, červené proužky – 04 +0 Kč", "0"], ["32", "Vybere se v konfigurátoru +0 Kč", "0"]] },
    { id: "4", n: "Nášivky", o: [["41", "Řidič + spolujezdec + střed (BALÍČEK) +2380 Kč", "2380"], ["42", "Bez nášivek +0 Kč", "0"]] },
    { id: "9", n: "Čalounění", o: [["91", "Ano, chci (v konfigurátoru – balíček) +2980 Kč", "2980"], ["92", "Ne, nechci čalounění dveří +0 Kč", "0"]] },
    { id: "10", n: "Materiál dveře", o: [["101", "Stejný jako koberec +0 Kč", "0"]] },
    { id: "11", n: "Barva dveře", o: [["111", "Stejná jako koberec +0 Kč", "0"], ["112", "Vybere se v konfigurátoru +0 Kč", "0"]] },
    { id: "12", n: "Lemování dveře", o: [["121", "Stejné jako koberec +0 Kč", "0"], ["122", "Vybere se v konfigurátoru +0 Kč", "0"]] },
    { id: "13", n: "Nášivka dveře", o: [["131", "Ne, nechci nášivku na dveřích +0 Kč", "0"], ["132", "Ano, chci nášivku na dveřích +0 Kč", "0"]] },
    { id: "14", n: "Nášivka dveře druh", o: [["141", "Bez nášivky +0 Kč", "0"], ["142", "Stejná jako koberec +0 Kč", "0"]] },
    { id: "15", n: "Niť dveře", o: [["151", "Bez nitě +0 Kč", "0"], ["152", "Stejná jako koberec +0 Kč", "0"]] },
  ],
};
const SUR_CZ = "Příplatky: Materiál - Prémiová syntetická kůže – prošívaná, Barva - černá, černé šití – 11, Lemování - černý základ, červené proužky – 04, Nášivky - Řidič + spolujezdec + střed (BALÍČEK), Čalounění - Ne, nechci čalounění dveří, Nášivka dveře - Ne, nechci nášivku na dveřích, Nášivka dveře druh - Bez nášivky, Niť dveře - Bez nitě";

test("CZ: ponuka čalounění s českými hodnotami, +2 980 Kč", () => {
  const m = mapa(strankaProduktuPonuky(KAMION_CZ, 4980));
  const p = K.ponukaTapaciru({ itemId: "c1", priceId: "99452", q: 1, sur: SUR_CZ, href: "/luxusni-autokoberce-kamiony/", text: "Luxusní autokoberce do kamionů" }, m);
  pravda(p, "žiadna ponuka");
  rovne(p.zmena, { 9: "91", 10: "101", 11: "111", 12: "121", 13: "131", 14: "141", 15: "151" });
  rovne(p.rozdiel.s, 2980);
  const k = K.kartaTapaciru(document, { riadok: { itemId: "c1", sku: "2452" }, mapa: m, volby: p.volby, zmena: p.zmena, rozdiel: p.rozdiel }, { R: { trh: "cz", mena: "CZK" }, forma: "f" });
  const t = k.textContent.replace(/\s+/g, " ");
  pravda(/Doplňte svůj kamion/.test(t) && /Čalounění dveří/.test(t) && /2\s980 Kč/.test(t) && /ušetříte 1\s500 Kč/.test(t), t);
});

test("CZ: rozpis z príplatkov po česky, čalounění jedným riadkom", () => {
  const sur = SUR_CZ.replace("Čalounění - Ne, nechci čalounění dveří", "Čalounění - Ano, chci (v konfigurátoru – balíček), Materiál dveře - Stejný jako koberec, Barva dveře - Stejná jako koberec, Lemování dveře - Stejné jako koberec");
  const u = K.udajeKamiona({ itemId: "c1", sur, text: "Luxusní autokoberce do kamionů" }, { ss: ulozisko({}), jazyk: "cs", jediny: true });
  const r = K.riadkyRozpisu(u.skupiny, "cs", "cz");
  rovne(r[0].n, "Typ a barva materiálu");
  rovne(r[r.length - 1], { n: "Čalounění dveří", h: "stejné jako koberečky" });
});

// živá kontrola 2. 11. 2026 (153f0ec): CZ súhrn konfigurátora má slovenské hodnoty („koža – prešívaná“, „Automatická
// prevodovka“), príplatky Shoptetu české („kůže – prošívaná“) -> súhrn sa zahodil, chýbalo Vozidlo aj ponuka čalounění.
const SUR_CZ_ZIVY = "Příplatky: Barva - černá, černé prošití – 11, Niť boky - Bez nitě, Niť dveře - Bez nitě, Niť stred - Bez nitě, Čalounění - Ne, nechci čalounění dveří, Nášivka boky - Bez nášivky, Nášivka stred - Bez nášivky, Lemování - černý základ, černé proužky – 09, Materiál - Prémiová syntetická kůže – prošívaná, Nášivka dveře druh - Bez nášivky, Nášivka dveře - Ne, nechci nášivku na dveřích, Nášivky - Bez nášivek";
const S_CZ_ZIVY = { znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka", sedadlo: "Sedadlo spolujazdca odpružené" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "09" }, nasivkyPlacement: "none", doorPanelChoice: "nie" };

test("CZ živý: súhrn so slovenskými hodnotami sedí s českými príplatkami -> Vozidlo, TIR bez čalounění", () => {
  const ss = ulozisko({ truckOrderSummary: buildTruckOrderSummary(S_CZ_ZIVY, "cs"), truckVehicle: "DAF (TIR) XF 2022-2025" });
  const p = { itemId: "c1", priceId: "99452", q: 1, sur: SUR_CZ_ZIVY, href: "/luxusni-autokoberce-kamiony/", text: "Luxusní autokoberce do kamionů" };
  const u = K.udajeKamiona(p, { ss, jazyk: "cs", jediny: true });
  pravda(u.zoSuhrnu, "súhrn sa nepoužil");
  rovne(u.vozidlo, "DAF (TIR) XF 2022-2025");
  const r = K.riadkyRozpisu(u.skupiny, "cs", "cz", SUR_CZ_ZIVY);
  rovne(r[0], { n: "Vozidlo", h: "DAF XF 2022–2025" });
  pravda(!r.some((x) => /Bez nášivky|Bez nit/.test(x.h)), JSON.stringify(r));
  // živá kontrola a97c0f5: súhrn má slovenské hodnoty -> v karte po česky (materiál zo Shoptetu, prevodovka a sedadlo ako CZ konfigurátor)
  rovne(r[1], { n: "Typ převodovky", h: "Automatická" });
  rovne(r[2], { n: "Typ sedadla spolujezdce", h: "Odpružené" });
  rovne(r[3], { n: "Typ a barva materiálu", h: "Prémiová syntetická kůže – prošívaná – černá, černé prošití – 11" });
  pravda(!/koža|prešívan|prevodovka|spolujazdca/.test(JSON.stringify(r)), "slovenské slovo v CZ karte: " + JSON.stringify(r));
  pravda(/Prémiová syntetická koža – prešívaná/.test(ss.getItem("truckOrderSummary")), "súhrn (poznámka objednávky) sa nemení");
  // súhrn inej farby (12) sa ani na CZ nepoužije
  const iny = Object.assign({}, S_CZ_ZIVY, { selectedColor: { code: "12" } });
  pravda(!K.udajeKamiona(p, { ss: ulozisko({ truckOrderSummary: buildTruckOrderSummary(iny, "cs") }), jazyk: "cs", jediny: true }).zoSuhrnu, "súhrn s farbou 12");
});

test("CZ: vlastný materiál tapacíru zo súhrnu po česky, výbava ako CZ konfigurátor", () => {
  const st = Object.assign({}, S_CZ_ZIVY, { extras: { prevodovka: "Manuálna prevodovka", zasuvky: "2 zásuvky (šuplíky)" }, doorPanelChoice: "ano",
    doorSameAsCarpet: { material: false, lemovanie: true }, doorMaterial: "Prémiová syntetická koža – prešívaná", doorColor: { code: "11" }, doorWantsNasivka: false });
  const sur = SUR_CZ_ZIVY.replace("Čalounění - Ne, nechci čalounění dveří", "Čalounění - Ano, chci (v konfigurátoru – balíček), Materiál dveře - Prémiová syntetická kůže – prošívaná, Barva dveře - černá, černé prošití – 11, Lemování dveře - Stejné jako koberec");
  const r = K.riadkyRozpisu(K.udajeKamiona({ itemId: "c1", sur, text: "Luxusní autokoberce do kamionů" }, { ss: ulozisko({ truckOrderSummary: buildTruckOrderSummary(st, "cs") }), jazyk: "cs", jediny: true }).skupiny, "cs", "cz", sur);
  pravda(r.some((x) => x.h === "Manuální") && r.some((x) => x.h === "2 zásuvky"), JSON.stringify(r));
  pravda(r.some((x) => /^Čalounění – materiál|materiál/i.test(x.n) && x.h === "Prémiová syntetická kůže – prošívaná – černá, černé prošití – 11"), JSON.stringify(r));
  pravda(!/koža|prešívan|prevodovka/.test(JSON.stringify(r)), JSON.stringify(r));
});

test("rozpis z príplatkov: „Bez nite / Bez nitě“ sa nezobrazí (nášivka tam nie je)", () => {
  const sk = "Príplatky: Typ materiálu - Prémiová syntetická koža – jednofarebná, Farba materiálu - hnedá – 3G, Farba lemovania - hnedý základ, béžové pásiky – 13, Rozloženie nášiviek - Len stred, Typ nášiviek na boky - Bez nášivky, Farba nášiviek na boky - Bez nite, Typ nášivky na stred - Nášivka H21, Farba nášivky na stred - Modrá – 3842";
  const r = K.riadkyRozpisu(K.udajeKamiona(riadok(sk), { ss: ulozisko({}), jazyk: "sk", jediny: true }).skupiny, "sk", "sk");
  pravda(!r.some((x) => /Bez nit/.test(x.h)), JSON.stringify(r));
  pravda(r.some((x) => x.h === "Modrá – 3842"), "chýba farba nášivky na stred");
  const r2 = K.riadkyRozpisu(K.udajeKamiona({ itemId: "c1", sur: SUR_CZ_ZIVY, text: "Luxusní autokoberce do kamionů" }, { ss: ulozisko({}), jazyk: "cs", jediny: true }).skupiny, "cs", "cz");
  pravda(!r2.some((x) => /Bez nit/.test(x.h)), JSON.stringify(r2));
});

console.log(`\nSpolu: ${ok} OK, ${zle} zlyhalo`);
if (zle) process.exit(1);
