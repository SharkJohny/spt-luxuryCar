#!/usr/bin/env node
// Rozpoznanie kamiónu / dodávky v košíku, objednávke a na ďakovnej stránke (functions/kamionPolozka.js, 13. 11. 2026):
// stránky dodávok majú adresu /autokoberce-do-dodavky-<model>/ a názov „Autokoberce do dodávky …“ — bez slova „kamión“.
// Test dokazuje, že (1) každý detektor dodávku spozná rovnako ako kamión, (2) pre osobné autá, rohož, box, vzorkovník,
// poukážku a triedu V sa nič nezmenilo (tie isté odpovede ako pred zmenou), (3) existujúce stránky kamiónov ostali kamióny.
//   node tools/test-kamion-detekcia.mjs
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html lang="sk"><body></body></html>', { url: "https://www.luxurycardesign.sk/kosik/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.location = dom.window.location;
globalThis.sessionStorage = dom.window.sessionStorage;
const $ = (await import("jquery")).default;
globalThis.$ = globalThis.jQuery = dom.window.$ = dom.window.jQuery = $;

const KP = await import("../assets/js/functions/kamionPolozka.js");
const AP = await import("../assets/js/functions/autoPamat.js");
const PO = await import("../assets/js/functions/poznamkaObjednavky.js");
const K = await import("../assets/js/opc/kamionKarta.js");
const V = await import("../assets/js/opc/vzhlad.js");
const DK = await import("../assets/js/opc/dakujeme.js");
const D = await import("../assets/js/lcdKosikDoplnok.js");
const OS = await import("../assets/js/truck-konfigurator/order-summary.mjs");
const ST = await import("../assets/js/components/konfigurator1v/kamion/stranky.js");
const PR = await import("../assets/js/components/konfigurator1v/produkty.js");
const { changeDescription, pridajPoliaObjednavky } = await import("../assets/js/components/cart.js");

let ok = 0, zle = 0;
function t(nazov, fn) {
  try { fn(); ok++; console.log("OK   " + nazov); } catch (e) { zle++; console.log("FAIL " + nazov + " — " + ((e && e.message) || e)); }
}
const J = (x) => JSON.stringify(x);
function eq(a, b, msg) { if (J(a) !== J(b)) throw new Error((msg ? msg + ": " : "") + J(a) + " ≠ " + J(b)); }
function pravda(v, msg) { if (!v) throw new Error(msg || "nepravda"); }

// ------------------------------------------------------------------ položky (názov, adresa, kód ako v admine)
const DODAVKA = { sku: "TRUCK-FIAT-DUCATO", href: "/autokoberce-do-dodavky-fiat-ducato/", text: "Autokoberce do dodávky Fiat Ducato" };
const DODAVKA_CZ = { sku: "TRUCK-MERCEDES-SPRINTER", href: "/autokoberce-do-dodavky-mercedes-sprinter/", text: "Autokoberce do dodávky Mercedes-Benz Sprinter se zadním pohonem" };
const KAMIONY = [
  { sku: "TEST-TRUCK", href: "/luxusne-autokoberce-kamiony/", text: "luxusné autokoberce do kamionov" },
  { sku: "TRUCK", href: "/luxusni-autokoberce-kamiony/", text: "luxusní autokoberce do kamionů" },
  { sku: "TRUCK-LOGA", href: "/luxusne-autokoberce-kamiony-1/", text: "luxusné autokoberce do kamionov s logami" },
  { sku: "TRUCK-SCANIA-R", href: "/autokoberce-do-kamionu-scania-r/", text: "Autokoberce do kamiónu Scania R" },
  { sku: "TRUCK-FORD-F-MAX", href: "/autokoberce-do-kamionu-ford-f-max/", text: "Autokoberce do kamionu Ford F-MAX" },
];
// osobné autá a ostatný tovar: adresy z registra produktov (produkty.js) + doplnky; nič z toho nesmie byť kamión
const AUTA = [];
for (const proj of Object.keys(PR.PRODUKTY_1V)) for (const [id, z] of Object.entries(PR.PRODUKTY_1V[proj])) {
  if (z.typ === "kamion") continue;
  AUTA.push({ sku: id + "/DIA3", href: z.url, text: "luxusné autokoberce " + ((z.auto && z.auto.nazov) || z.typ) });
}
AUTA.push(
  { sku: "598/DIA3", href: "/luxusne-autokoberce-dragonskin-diamond-line/", text: "luxusné autokoberce Dragonskin Basic DIAMOND LINE Auto: Fiat Ducato 2020 dodávka" },
  { sku: "VCLASS", href: "/autokoberce-mercedes-v-class/", text: "Autokoberce Mercedes triedy V" },
  { sku: "610/CLA", href: "/luxusny-koberced-do-kufra-dragonskin-klasik/", text: "Koberec na dno kufra Classic" },
  { sku: "616/BOX", href: "/luxusny-boxi-do-kufra/", text: "Box do kufra" },
  { sku: "VZORKY", href: "/vzorkovnik-dragonskin---objednavka-vzoriek/", text: "Vzorkovník Dragonskin – objednávka vzoriek" },
  { sku: "POUKAZ-100", href: "/darcekova-poukazka/", text: "Darčeková poukážka" },
  { sku: "", href: "/blog/termin-dodavky-autokobercov/", text: "Termín dodávky tovaru do 29 dní, autokoberce do auta" },
);

t("register produktov: v teste je " + AUTA.length + " položiek osobných áut a ostatného tovaru", () => { pravda(AUTA.length > 30, String(AUTA.length)); });

// ------------------------------------------------------------------ 1) spoločné pravidlo
t("kamionPolozka: dodávka podľa kódu, adresy aj názvu (každý znak samostatne)", () => {
  for (const d of [DODAVKA, DODAVKA_CZ]) {
    eq([KP.jeKamionKod(d.sku), KP.jeKamionAdresa(d.href), KP.jeKamionNazov(d.text), KP.jeKamionText(d.text), KP.jeKamionPolozka(d)], [true, true, true, true, true], d.href);
    eq([KP.jeKamionPolozka({ sku: d.sku }), KP.jeKamionPolozka({ href: d.href }), KP.jeKamionPolozka({ text: d.text })], [true, true, true], d.href);
  }
  eq(KP.jeKamionNazov("autokoberce do dodavky fiat ducato"), true, "názov bez diakritiky (ďakovná stránka)");
  eq(KP.jeKamionAdresa("https://www.luxurycardesign.cz/autokoberce-do-dodavky-peugeot-boxer-2006/?utm=x"), true);
});
t("kamionPolozka: existujúce produkty kamiónov ostávajú kamióny (kód, adresa, názov)", () => {
  for (const k of KAMIONY) eq([KP.jeKamionKod(k.sku), KP.jeKamionAdresa(k.href), KP.jeKamionText(k.text)], [true, true, true], k.href);
});
t("kamionPolozka: všetky stránky KAMION_STRANKY (SK aj CZ) spozná podľa adresy", () => {
  for (const proj of Object.keys(ST.KAMION_STRANKY)) for (const c of Object.keys(ST.KAMION_STRANKY[proj])) pravda(KP.jeKamionAdresa(c), proj + " " + c);
});
t("kamionPolozka: osobné autá, rohož, box, vzorkovník, poukážka, trieda V nie sú kamión (žiadny znak)", () => {
  for (const a of AUTA) eq([KP.jeKamionKod(a.sku), KP.jeKamionAdresa(a.href), KP.jeKamionNazov(a.text), KP.jeKamionText(a.text), KP.jeKamionPolozka(a)], [false, false, false, false, false], a.href + " | " + a.text);
  eq([null, undefined, "", 0].map(KP.jeKamionText), [false, false, false, false]);
  eq([null, undefined, {}].map(KP.jeKamionPolozka), [false, false, false]);
});
t("kamionPolozka = staré výrazy pre všetko okrem dodávok (kód \\btruck\\b, adresa kamion, text truck|kamión)", () => {
  const vsetko = KAMIONY.concat(AUTA, [{ sku: "truck", href: "/KAMION/", text: "Kamiónový koberec TRUCK" }, { sku: "trucker", href: "/x/", text: "struck" }]);
  for (const p of vsetko) {
    eq(KP.jeKamionKod(p.sku), /\btruck\b/i.test(p.sku), "kód " + p.sku);
    eq(KP.jeKamionAdresa(p.href), /kamion/i.test(p.href), "adresa " + p.href);
    eq(KP.jeKamionText(p.text), /\btruck\b|kami[oó]n/i.test(p.text), "text " + p.text);
  }
});

// ------------------------------------------------------------------ 2) detektory
t("autoPamat.jeKamionDL: dodávka podľa kódu alebo názvu; autá nie", () => {
  eq([{ code: DODAVKA.sku, name: DODAVKA.text }, { code: "", name: DODAVKA.text }, { code: DODAVKA.sku, name: "" }].map(AP.jeKamionDL), [true, true, true]);
  eq(KAMIONY.map((k) => AP.jeKamionDL({ code: k.sku, name: k.text })), KAMIONY.map(() => true));
  eq(AUTA.map((a) => AP.jeKamionDL({ code: a.sku, name: a.text })), AUTA.map(() => false));
  eq(AP.jeKamionDL({ code: "598/DIA3", name: "Autokoberce Hummer Truck" }), false, "slovo truck v názve auta nie je znak (ako doteraz)");
});
t("autoPamat.obnovKamion: s dodávkou v košíku súhrn ostáva, bez nej sa v objednávke maže", () => {
  const pamat = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const ss = pamat(), ls = pamat();
  ss.setItem("truckOrderSummary", "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: Fiat (dodávka) Ducato 2006-2026"); ss.setItem("truckVehicle", "Fiat (dodávka) Ducato 2006-2026");
  AP.obnovKamion(ss, ls, [{ code: DODAVKA.sku, name: DODAVKA.text }], true);
  pravda(ss.getItem("truckOrderSummary") && ss.getItem("truckVehicle"), "súhrn dodávky zmizol");
  eq(AP.obnovKamion(ss, ls, [{ code: "598/DIA3", name: "luxusné autokoberce" }], true), "zmazane");
  eq(ss.getItem("truckOrderSummary"), null);
});
t("poznamkaObjednavky.jeKamionRiadok: dodávka podľa kódu alebo adresy, text len ako záloha", () => {
  eq([DODAVKA, DODAVKA_CZ, { sku: "", href: DODAVKA.href, text: "" }, { sku: DODAVKA.sku, href: "", text: "" }, { sku: "", href: "", text: DODAVKA.text }].map(PO.jeKamionRiadok), [true, true, true, true, true]);
  eq(KAMIONY.map(PO.jeKamionRiadok), KAMIONY.map(() => true));
  eq(AUTA.map(PO.jeKamionRiadok), AUTA.map(() => false));
  eq(PO.jeKamionRiadok({ sku: "598/DIA3", href: "/luxusne-autokoberce/", text: "Autokoberce do dodávky – poznámka zákazníka" }), false, "kód a adresa majú prednosť pred textom");
});
t("poznamkaObjednavky.patriAutu: dodávka nie (adresa má „autokoberce“), autá ako doteraz", () => {
  eq([DODAVKA.href, DODAVKA_CZ.href, "/autokoberce-do-dodavky-citroen-jumper-2006/"].map(PO.patriAutu), [false, false, false]);
  eq(KAMIONY.map((k) => PO.patriAutu(k.href)), KAMIONY.map(() => false));
  for (const a of AUTA) eq(PO.patriAutu(a.href), !/vzorkovnik|poukaz|kamion/i.test(a.href) && /autokoberce|koberced?-do-kufr|boxi?-do-kufr/i.test(a.href), a.href);
  eq(["/luxusne-autokoberce-dragonskin-diamond-line/", "/autokoberce-skoda-kodiaq-ii/", "/autokoberce-mercedes-v-class/", "/luxusny-koberced-do-kufra-dragonskin-klasik/", "/luxusny-boxi-do-kufra/"].map(PO.patriAutu), [true, true, true, true, true]);
});
t("poznamkaObjednavky.zlozPoznamku: len dodávka = blok konfigurácie bez „model: …“; dodávka + auto = oboje", () => {
  const suhrn = "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: Fiat (dodávka) Ducato 2006-2026";
  const blok = OS.mergeTruckOrderSummaryIntoNote("", suhrn);
  const AUTO = "Škoda Kodiaq II 2024 SUV";
  eq(PO.zlozPoznamku("", { truckSummary: suhrn, savedModel: AUTO, riadky: [DODAVKA] }), blok);
  eq(PO.zlozPoznamku("", { truckSummary: suhrn, savedModel: AUTO, riadky: [DODAVKA, AUTA[0]] }), "model: " + AUTO + "\n\n" + blok);
  eq(PO.zlozPoznamku("", { truckSummary: suhrn, savedModel: AUTO, riadky: [AUTA[0]] }), "model: " + AUTO, "bez dodávky starý súhrn do objednávky nejde");
});
t("opc/kamionKarta.jeKamion (aj karta košíka pokladne): dodávka podľa textu, adresy aj kódu; autá nie", () => {
  eq([DODAVKA, DODAVKA_CZ, { text: DODAVKA.text }, { text: "", href: DODAVKA.href }, { text: "", href: "", sku: DODAVKA.sku }].map(K.jeKamion), [true, true, true, true, true]);
  eq(KAMIONY.map(K.jeKamion), KAMIONY.map(() => true));
  eq(AUTA.map(K.jeKamion), AUTA.map(() => false));
  eq([null, undefined, {}].map(K.jeKamion), [false, false, false]);
});
t("opc/vzhlad: dodávka = druh „kamion“ (doručenie 14–18 dní), tovar na mieru; autá ako doteraz", () => {
  eq(V.druhKosika([DODAVKA.text]), "kamion");
  eq(V.terminDorucenia(V.druhKosika([DODAVKA_CZ.text])), { od: 14, po: 18 });
  eq(V.druhKosika([DODAVKA.text, "Vzorkovník Dragonskin – objednávka vzoriek"]), "kamion");
  eq(V.druhKosika([DODAVKA.text, "luxusné autokoberce Dragonskin Basic DIAMOND LINE"]), "koberce");
  eq(V.naMieru([DODAVKA.text]), true);
  eq(["luxusné autokoberce Dragonskin Basic DIAMOND LINE", "Autokoberce Mercedes triedy V", "Koberec na dno kufra Classic", "Box do kufra"].map((n) => V.druhKosika([n])), ["koberce", "koberce", "koberce", "koberce"]);
  eq(V.druhKosika(["Vzorkovník Dragonskin – objednávka vzoriek"]), "vzorky");
  eq(V.terminDorucenia("koberce"), { od: 21, po: 29 });
});
t("opc/dakujeme.druhObjednavky: dodávka = „kamion“; auto a vzorky ako doteraz", () => {
  eq(DK.druhObjednavky([{ nazov: DODAVKA.text }]), "kamion");
  eq(DK.druhObjednavky([{ nazov: DODAVKA_CZ.text }]), "kamion");
  eq(DK.druhObjednavky([{ nazov: "Luxusné autokoberce Dragonskin Basic DIAMOND LINE" }]), "auto");
  eq(DK.druhObjednavky([{ nazov: "Vzorkovník Dragonskin – objednávka vzoriek" }]), "vzorky");
  eq(DK.druhObjednavky([{ nazov: "luxusné autokoberce do kamionov" }]), "kamion");
});

// ------------------------------------------------------------------ 3) ponuka k setu (lcdKosikDoplnok.js) dodávku neberie
const priplatky = "Príplatky: Typ materiálu - Prémiová syntetická koža – jednofarebná, Farba materiálu - čierna – 10G, Farba lemovania - čierna – 09, Rozloženie nášiviek - Bez nášiviek, Tapacír - Nie nechcem tapacír dverí";
const riadokKosika = (p, o = {}) => Object.assign({ itemId: "i1", priceId: "70001", q: 1, maPriplatky: true, sur: priplatky, sku: p.sku, href: p.href, text: p.text }, o);
const vysledky = [];
for (const r of [riadokKosika(DODAVKA), riadokKosika(DODAVKA_CZ), riadokKosika(DODAVKA, { sku: "", text: "názov bez znaku" }), riadokKosika(DODAVKA, { href: "/x/", text: "názov bez znaku" }), riadokKosika(DODAVKA, { sku: "", href: "/x/" }), riadokKosika(KAMIONY[0]), riadokKosika(KAMIONY[3])]) {
  vysledky.push(await D.pripravKontexty([r], { trh: "sk" }, {}));
}
t("lcdKosikDoplnok.pripravKontexty: dodávka (podľa adresy, kódu alebo názvu) ani kamión nie sú kandidát na rohož / box / druhú vrstvu", () => {
  eq(vysledky.map((v) => [v.kandidati, v.ctxs.length, v.ponuky.length]), vysledky.map(() => [0, 0, 0]));
});

// ------------------------------------------------------------------ 4) košík a rekapitulácia (components/cart.js)
const SUHRN = OS.buildTruckOrderSummary({
  znacka: "Fiat (dodávka)", model: "Ducato 2006-2026", extras: {},
  selectedMaterial: "Prémiová syntetická koža – jednofarebná", selectedColor: { code: "10G" }, selectedLemovanie: { code: "09" },
  nasivkyPlacement: "nechcem", doorPanelChoice: "nie",
}, "sk");
function kosik(riadky, suhrn) {
  document.body.className = "in-kosik";
  document.body.innerHTML = "<table><tbody>" + riadky.map((r) => `<tr class="removeable" data-micro="cartItem" data-micro-sku="${r.sku}"><td><a class="main-link" href="${r.href}">${r.text}</a></td><td><span class="main-link-surcharges">${r.sur || priplatky}</span></td></tr>`).join("") + "</tbody></table>";
  sessionStorage.clear();
  if (suhrn) sessionStorage.setItem("truckOrderSummary", suhrn);
  changeDescription();
  return document.body;
}
t("fixture: súhrn dodávky z konfigurátora má vozidlo", () => { pravda(/Fiat \(dodávka\) Ducato 2006-2026/.test(SUHRN), SUHRN); });
const SUR_AUTO = "Príplatky: Počet radov - prvý a druhý rad, Farba lemovania - čierna";
for (const [meno, riadok] of [
  ["názov, adresa aj kód", DODAVKA],
  ["len názov „Autokoberce do dodávky …“", { sku: "", href: "/x/", text: DODAVKA.text }],
  ["len adresa /autokoberce-do-dodavky-…/", { sku: "", href: DODAVKA.href, text: "Koberce Fiat Ducato" }],
  ["len kód so slovom TRUCK", { sku: DODAVKA.sku, href: "/x/", text: "Koberce Fiat Ducato" }],
  ["kamión Scania R (existujúca stránka)", KAMIONY[3]],
  ["640 (existujúci produkt)", KAMIONY[0]],
]) {
  t("košík, " + meno + ": riadok ide cestou kamióna (karty súhrnu konfigurátora, žiadne „Auto:“)", () => {
    const b = kosik([riadok], SUHRN);
    pravda(b.querySelector(".lcd-truck-cart-summary"), "chýba súhrn kamióna: " + b.innerHTML.slice(0, 300));
    pravda(/Fiat \(dodávka\) Ducato 2006-2026|Ducato/.test(b.querySelector(".lcd-truck-cart-summary").textContent), b.querySelector(".lcd-truck-cart-summary").textContent.slice(0, 200));
    pravda(!b.querySelector("ul.lcd-rozpis"), "rozpis osobného auta pri dodávke");
  });
}
t("košík, osobné auto: bežný rozpis (ul.lcd-rozpis), nikdy súhrn kamióna — aj keď v karte ostal starý súhrn", () => {
  for (const a of [{ sku: "598/DIA3", href: "/luxusne-autokoberce-dragonskin-diamond-line/", text: "luxusné autokoberce Dragonskin Basic DIAMOND LINE", sur: SUR_AUTO }, { sku: "649/STR", href: "/autokoberce-skoda-kodiaq-ii/", text: "Autokoberce Škoda Kodiaq II", sur: SUR_AUTO }]) {
    const b = kosik([a], SUHRN);
    pravda(!b.querySelector(".lcd-truck-cart-summary") && !b.querySelector(".setup"), "auto išlo cestou kamióna: " + a.href);
    pravda(b.querySelector("ul.lcd-rozpis"), "chýba rozpis auta: " + b.innerHTML.slice(0, 300));
  }
});
t("košík, dodávka + auto: dodávka súhrn kamióna, auto bežný rozpis", () => {
  const b = kosik([DODAVKA, { sku: "598/DIA3", href: "/luxusne-autokoberce-dragonskin-diamond-line/", text: "luxusné autokoberce Dragonskin Basic DIAMOND LINE", sur: SUR_AUTO }], SUHRN);
  const tr = b.querySelectorAll("tr");
  pravda(tr[0].querySelector(".lcd-truck-cart-summary") && !tr[0].querySelector("ul.lcd-rozpis"), "dodávka");
  pravda(tr[1].querySelector("ul.lcd-rozpis") && !tr[1].querySelector(".lcd-truck-cart-summary"), "auto");
});
function objednavka(polozky) {
  document.body.className = "ordering-process";
  document.body.innerHTML = '<div class="co-billing-address"></div><div class="cart-items">' + polozky.map((r) => `<div class="cart-item" data-micro="cartItem" data-micro-sku="${r.sku}"><a class="main-link" href="${r.href}">${r.text}</a></div>`).join("") + "</div>";
  pridajPoliaObjednavky();
  return !!document.getElementById("varchar1");
}
t("objednávka len s dodávkou / kamiónom: polia volantu, miest a dverí osobného auta sa nepridajú; s autom áno", () => {
  eq(objednavka([DODAVKA]), false, "len dodávka");
  eq(objednavka([{ sku: DODAVKA.sku, href: "/x/", text: "Koberce Fiat Ducato" }]), false, "dodávka len podľa kódu");
  eq(objednavka([DODAVKA, KAMIONY[3]]), false, "dodávka + kamión");
  eq(objednavka([KAMIONY[0]]), false, "640");
  eq(objednavka([DODAVKA, AUTA[0]]), true, "dodávka + auto");
  eq(objednavka([AUTA[0]]), true, "len auto");
});

console.log(`\nSpolu: ${ok} OK, ${zle} zlyhalo`);
process.exit(zle ? 1 : 0);
