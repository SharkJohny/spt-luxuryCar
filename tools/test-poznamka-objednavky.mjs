// Testy functions/poznamkaObjednavky.js: čo ide do poznámky objednávky podľa riadkov objednávky (kniha OPC § 10.44).
//   node tools/test-poznamka-objednavky.mjs
import { JSDOM } from "jsdom";
import { buildTruckOrderSummary } from "../assets/js/truck-konfigurator/order-summary.mjs";
import { zlozPoznamku, riadkyPoznamky, jeKamionRiadok, patriAutu } from "../assets/js/functions/poznamkaObjednavky.js";

let ok = 0, zle = 0;
const t = (n, f) => { try { f(); ok++; console.log("OK   " + n); } catch (e) { zle++; console.log("FAIL " + n + " — " + e.message); } };
const eq = (a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(JSON.stringify(a) + " ≠ " + JSON.stringify(b)); };

const KAMION = { sku: "TEST-TRUCK", href: "/luxusne-autokoberce-kamiony/", text: "luxusné autokoberce do kamionov" };
const KAMION_CZ = { sku: "TRUCK", href: "/luxusni-autokoberce-kamiony/", text: "luxusní autokoberce do kamionů" };
const SET = { sku: "598/DIA3", href: "/luxusne-autokoberce-dragonskin-diamond-line/", text: "luxusné autokoberce Dragonskin" };
const ROHOZ = { sku: "3033/DIA", href: "/koberce-do-kufra-premium/", text: "Koberec do kufra" };
const BOX = { sku: "616/DIA", href: "/luxusny-boxi-do-kufra/", text: "Box do kufra" };
const VZORKY = { sku: "VZORKY-DRAGONSKIN", href: "/vzorkovnik-dragonskin/", text: "Vzorkovník" };
const POUKAZ = { sku: "POUKAZKA-100", href: "/poukaz/", text: "Darčeková poukážka" };

const STAV = {
  znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "04" },
  nasivkyPlacement: "nechcem", doorPanelChoice: "nie",
};
const SK = buildTruckOrderSummary(STAV, "sk");
const CZ = buildTruckOrderSummary(STAV, "cs");
const BLOK_SK = "[KONFIGURÁCIA KAMIÓNA]\n" + SK + "\n[/KONFIGURÁCIA KAMIÓNA]";
const BLOK_CZ = "[KONFIGURACE KAMIONU]\n" + CZ + "\n[/KONFIGURACE KAMIONU]";
const AUTO = "Skoda Octavia 2021 Combi";
const MODEL = "model: " + AUTO;
const poc = (s, x) => String(s).split(x).length - 1;

t("len osobné auto: riadok model, žiadny blok", () => {
  eq(zlozPoznamku("", { truckSummary: "", savedModel: AUTO, riadky: [SET] }), MODEL);
});
t("len kamión: blok presne vo formáte exportu", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: "", riadky: [KAMION] }), BLOK_SK);
});
t("len kamión a v karte je cudzie auto: blok bez riadku model", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION] }), BLOK_SK);
});
t("len kamión bez súhrnu a v karte je cudzie auto: žiadny cudzí model", () => {
  eq(zlozPoznamku("", { truckSummary: "", savedModel: AUTO, riadky: [KAMION] }), "");
});
t("kamión aj osobné auto: najprv model, potom blok (CRM reže poznámku na 300 znakov, model tak ostane)", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, SET] }), MODEL + "\n\n" + BLOK_SK);
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [SET, KAMION] }), MODEL + "\n\n" + BLOK_SK);
});
t("kamión aj osobné auto na CZ", () => {
  eq(zlozPoznamku("", { truckSummary: CZ, savedModel: AUTO, riadky: [KAMION_CZ, SET] }), MODEL + "\n\n" + BLOK_CZ);
});
t("kamión s rohožou alebo boxom: model ide, rohož aj box sú pre auto", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, ROHOZ] }), MODEL + "\n\n" + BLOK_SK);
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, BOX] }), MODEL + "\n\n" + BLOK_SK);
});
t("kamión so vzorkovníkom alebo poukážkou: bez cudzieho modelu", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, VZORKY] }), BLOK_SK);
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, POUKAZ] }), BLOK_SK);
});
t("ručný text zákazníka ostáva navrchu, opakované odoslanie nič nezdvojí", () => {
  const raz = zlozPoznamku("Volať pred doručením.", { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, SET] });
  eq(raz, "Volať pred doručením.\n\n" + MODEL + "\n\n" + BLOK_SK);
  eq(zlozPoznamku(raz, { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, SET] }), raz);
});
t("kamión odobratý: starý súhrn v karte do objednávky nejde, auto áno", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [SET] }), MODEL);
});
t("kamión odobratý po neúspešnom odoslaní: starý blok z poznámky zmizne, ručný text ostane (SK aj CZ)", () => {
  eq(zlozPoznamku("Ručná\n\n" + BLOK_SK, { truckSummary: SK, savedModel: AUTO, riadky: [SET] }), "Ručná\n\n" + MODEL);
  eq(zlozPoznamku("Ručná\n\n" + BLOK_CZ, { truckSummary: "", savedModel: AUTO, riadky: [SET] }), "Ručná\n\n" + MODEL);
});
t("kamión v objednávke bez súhrnu v karte: blok z predošlého pokusu sa nemaže", () => {
  eq(zlozPoznamku(BLOK_SK, { truckSummary: "", savedModel: "", riadky: [KAMION] }), BLOK_SK);
});
t("riadky sa nedajú prečítať: presne staré správanie (blok má prednosť, inak model)", () => {
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: null }), BLOK_SK);
  eq(zlozPoznamku("", { truckSummary: SK, savedModel: AUTO, riadky: [] }), BLOK_SK);
  eq(zlozPoznamku("", { truckSummary: "", savedModel: AUTO, riadky: null }), MODEL);
  eq(zlozPoznamku("Ručná", { truckSummary: "", savedModel: "", riadky: null }), "Ručná");
});
t("košík bez kamióna ostáva ako doteraz, aj vzorkovník s autom v karte", () => {
  eq(zlozPoznamku("", { truckSummary: "", savedModel: AUTO, riadky: [VZORKY] }), MODEL);
});
t("nepoužiteľný model (stránka bez konfigurátora) do poznámky nejde", () => {
  ["undefined undefined undefined undefined", "null", "undefined", " ", "BMW null 2021 SUV"].forEach((m) => {
    eq(zlozPoznamku("Ručná", { truckSummary: "", savedModel: m, riadky: [SET] }), "Ručná");
  });
});
t("rozpoznanie kamióna: kód alebo adresa, text len keď nie je ani jedno", () => {
  eq([KAMION, KAMION_CZ].map(jeKamionRiadok), [true, true]);
  eq([SET, ROHOZ, BOX, VZORKY, POUKAZ].map(jeKamionRiadok), [false, false, false, false, false]);
  eq(jeKamionRiadok({ sku: "598/DIA3", href: "/luxusne-autokoberce/", text: "Auto: Hummer Truck 2020" }), false);
  eq(jeKamionRiadok({ sku: "", href: "", text: "luxusné autokoberce do kamionov" }), true);
  eq(jeKamionRiadok({ sku: "", href: "", text: "Set do auta" }), false);
  // stránky dodávok (13. 11. 2026): adresa /autokoberce-do-dodavky-…/ bez „kamion“, kód TRUCK-…, názov „Autokoberce do dodávky …“
  eq([{ sku: "TRUCK-FIAT-DUCATO", href: "/autokoberce-do-dodavky-fiat-ducato/", text: "" }, { sku: "", href: "/autokoberce-do-dodavky-fiat-ducato/", text: "" },
    { sku: "TRUCK-FIAT-DUCATO", href: "", text: "" }, { sku: "", href: "", text: "Autokoberce do dodávky Fiat Ducato" }].map(jeKamionRiadok), [true, true, true, true]);
});
t("patriAutu: autokoberce, rohož, box áno; kamión, vzorkovník, poukážka, iné nie", () => {
  eq([SET, ROHOZ, BOX].map((r) => patriAutu(r.href)), [true, true, true]);
  eq([KAMION, KAMION_CZ, VZORKY, POUKAZ].map((r) => patriAutu(r.href)), [false, false, false, false]);
  eq(patriAutu(""), false);
  // dodávka má v adrese „autokoberce“, ale auto k nej nepatrí (odrážka „Auto: …“, riadok „model: …“ v poznámke)
  eq(["/autokoberce-do-dodavky-fiat-ducato/", "/autokoberce-do-dodavky-mercedes-sprinter/"].map(patriAutu), [false, false]);
  eq(["/autokoberce-skoda-kodiaq-ii/", "/autokoberce-mercedes-v-class/"].map(patriAutu), [true, true]);
});
t("riadky z rekapitulácie objednávky (rovnaké značky ako živý krok 2)", () => {
  const h = (sku, href) => `<div class="cart-item" data-micro="cartItem" data-micro-sku="${sku}"><a href="${href}" class="main-link">názov</a></div>`;
  const d = new JSDOM(`<body class="id--17 ordering-process"><div id="summary-box"><div class="cart-items">${h("TEST-TRUCK", KAMION.href)}${h("598/DIA3", SET.href)}</div></div></body>`).window.document;
  const r = riadkyPoznamky(d);
  eq(r.map((x) => [x.sku, x.href]), [["TEST-TRUCK", KAMION.href], ["598/DIA3", SET.href]]);
  eq(r.map(jeKamionRiadok), [true, false]);
});
t("bez riadkov alebo mimo objednávky -> null (staré správanie)", () => {
  eq(riadkyPoznamky(new JSDOM(`<body class="ordering-process"></body>`).window.document), null);
  eq(riadkyPoznamky(new JSDOM(`<body><div class="cart-items"><div class="cart-item"></div></div></body>`).window.document), null);
  eq(riadkyPoznamky(null), null);
});
t("blok sa v zmiešanej objednávke nedotkne riadku model ani naopak (po jednom výskyte)", () => {
  const n = zlozPoznamku(MODEL, { truckSummary: SK, savedModel: AUTO, riadky: [KAMION, SET] });
  eq([poc(n, MODEL), poc(n, "[KONFIGURÁCIA KAMIÓNA]"), poc(n, "[/KONFIGURÁCIA KAMIÓNA]")], [1, 1, 1]);
  eq(n.indexOf(MODEL) < n.indexOf("[KONFIGURÁCIA KAMIÓNA]"), true);
});

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
