import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { sTextamiPriplatkov } from "./farby-nazvy.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));

const SELECTS_SK = `
  <select data-parameter-id="346" data-parameter-name="Typ materiálu">
    <option value=""></option><option value="premium">Prémiová syntetická koža – prešívaná +€10</option>
  </select>
  <select data-parameter-id="376" data-parameter-name="Farba materiálu">
    <option value=""></option><option value="custom">Vyberie sa v konfigurátore +€0</option>
  </select>
  <select data-parameter-id="379" data-parameter-name="Farba lemovania">
    <option value=""></option><option value="custom">Vyberie sa v konfigurátore +€0</option>
  </select>
  <select data-parameter-id="349" data-parameter-name="Rozloženie nášiviek">
    <option value=""></option><option value="bundle">Šofér + spolujazdec + stred (BALÍK) +€95</option>
  </select>
  <select data-parameter-id="403" data-parameter-name="Typ nášiviek na boky">
    <option value=""></option><option value="no">Bez nášivky +€0</option><option value="h2">Nášivka H2 +€0</option>
  </select>
  <select data-parameter-id="409" data-parameter-name="Typ nášivky na stred">
    <option value=""></option><option value="no">Bez nášivky +€0</option><option value="h3">Nášivka H3 +€0</option>
  </select>
  <select data-parameter-id="406" data-parameter-name="Farba nášiviek na boky">
    <option value=""></option><option value="no">Bez nite +€0</option><option value="2901">2901 – Strieborná +€0</option>
  </select>
  <select data-parameter-id="412" data-parameter-name="Farba nášivky na stred">
    <option value=""></option><option value="no">Bez nite +€0</option><option value="2824">2824 – Červená +€0</option>
  </select>
  <select data-parameter-id="355" data-parameter-name="Nášivky na tapacír">
    <option value=""></option><option value="no">Nie nechcem nášivku na dverách +€0</option><option value="yes">Áno chcem nášivku na dverách +€49</option>
  </select>
  <select data-parameter-id="388" data-parameter-name="Typ materiálu tapacíru">
    <option value=""></option><option value="same">Rovnaký ako koberec +€0</option><option value="custom">Vyberie sa v konfigurátore +€0</option>
  </select>
  <select data-parameter-id="391" data-parameter-name="Farba materiálu tapacíru">
    <option value=""></option><option value="same">Rovnaká ako koberec +€0</option><option value="custom">Vyberie sa v konfigurátore +€0</option>
  </select>
  <select data-parameter-id="394" data-parameter-name="Farba lemovania tapacíru">
    <option value=""></option><option value="same">Rovnaké ako koberec +€0</option><option value="custom">Vyberie sa v konfigurátore +€0</option>
  </select>
  <select data-parameter-id="397" data-parameter-name="Typ nášivky na tapacír">
    <option value=""></option><option value="same">Rovnaká ako koberec +€0</option><option value="no">Bez nášivky +€0</option><option value="h4">Nášivka H4 +€0</option>
  </select>
  <select data-parameter-id="400" data-parameter-name="Farba nášiviek na tapacíre">
    <option value=""></option><option value="same">Rovnaká ako koberec +€0</option><option value="no">Bez nite +€0</option><option value="3842">3842 – Modrá +€0</option>
  </select>
`;

const SELECTS_CZ = `
  <select data-parameter-id="material" data-parameter-name="Materiál">
    <option value=""></option>
    <option value="plain">Prémiová syntetická kůže – jednobarevná +0 Kč</option>
    <option value="stitched">Prémiová syntetická kůže – prošívaná +199 Kč</option>
    <option value="tinted">Prémiová syntetická kůže – tónovaná +990 Kč</option>
    <option value="micro-one">Mikrosemiš – jednobarevný +990 Kč</option>
    <option value="micro-two">Mikrosemiš – dvoubarevný +1 199 Kč</option>
  </select>
  <select data-parameter-id="embroidery" data-parameter-name="Nášivky">
    <option value=""></option>
    <option value="none">Bez nášivek +0 Kč</option>
    <option value="center">Jen střed +1 399 Kč</option>
    <option value="sides">Řidič + spolujezdec +1 399 Kč</option>
    <option value="all">Řidič + spolujezdec + střed (BALÍČEK) +2 299 Kč</option>
  </select>
  <select data-parameter-id="343" data-parameter-name="Nášivka boky">
    <option value=""></option><option value="no">Bez nášivky +0 Kč</option><option value="h2">Nášivka H2 +0 Kč</option>
  </select>
  <select data-parameter-id="349" data-parameter-name="Nášivka stred">
    <option value=""></option><option value="no">Bez nášivky +0 Kč</option><option value="h3">Nášivka H3 +0 Kč</option>
  </select>
  <select data-parameter-id="346" data-parameter-name="Niť boky">
    <option value=""></option><option value="no">Bez nitě +0 Kč</option><option value="2901">2901 – Stříbrná +0 Kč</option>
  </select>
  <select data-parameter-id="352" data-parameter-name="Niť stred">
    <option value=""></option><option value="no">Bez nitě +0 Kč</option><option value="2824">2824 – Červená +0 Kč</option>
  </select>
  <select data-parameter-id="337" data-parameter-name="Nášivka dveře druh">
    <option value=""></option><option value="same">Stejná jako koberec +0 Kč</option><option value="no">Bez nášivky +0 Kč</option><option value="h4">Nášivka H4 +0 Kč</option>
  </select>
  <select data-parameter-id="340" data-parameter-name="Niť dveře">
    <option value=""></option><option value="same">Stejná jako koberec +0 Kč</option><option value="no">Bez nitě +0 Kč</option><option value="3842">3842 – Modrá +0 Kč</option>
  </select>
  <select data-parameter-id="301" data-parameter-name="Čalounění">
    <option value=""></option><option value="no">Ne, nechci čalounění dveří +0 Kč</option><option value="yes">Ano, chci (v konfigurátoru – balíček) +2890 Kč</option>
  </select>
  <select data-parameter-id="door-embroidery" data-parameter-name="Nášivka dveře">
    <option value=""></option><option value="no">Ne, nechci nášivku na dveřích +0 Kč</option><option value="yes">Ano, chci nášivku na dveřích +1190 Kč</option>
  </select>
  <select data-parameter-id="door-material" data-parameter-name="Materiál dveře">
    <option value=""></option><option value="same">Stejný jako koberec +0 Kč</option><option value="custom">Vybere se v konfigurátoru +0 Kč</option>
  </select>
  <select data-parameter-id="door-color" data-parameter-name="Barva dveře">
    <option value=""></option><option value="same">Stejná jako koberec +0 Kč</option><option value="custom">Vybere se v konfigurátoru +0 Kč</option>
  </select>
  <select data-parameter-id="door-trim" data-parameter-name="Lemování dveře">
    <option value=""></option><option value="same">Stejné jako koberec +0 Kč</option><option value="custom">Vybere se v konfigurátoru +0 Kč</option>
  </select>
`;

const SELECTS_CZ_RENAMED = [
  ["Nášivka dveře druh", "Typ nášivky na tapacír"],
  ["Nášivka dveře", "Nášivky na tapacír"],
  ["Materiál dveře", "Typ materiálu tapacíru"],
  ["Barva dveře", "Barva materiálu tapacíru"],
  ["Lemování dveře", "Barva lemování tapacíru"],
  ["Niť dveře", "Barva nášivek na tapacíru"],
  ["Nášivka boky", "Typ nášivek na boky"],
  ["Niť boky", "Barva nášivek na boky"],
  ["Nášivka stred", "Typ nášivky na střed"],
  ["Niť stred", "Barva nášivky na střed"],
].reduce((html, [oldName, newName]) => html.replaceAll(oldName, newName), SELECTS_CZ);

function loadSync(sourceName) {
  const source = readFileSync(join(ROOT, sourceName), "utf8");
  const start = source.indexOf("function normalizeOptionText");
  const end = source.indexOf("function Configurator()");
  if (start < 0 || end < 0) {
    throw new Error(`${sourceName}: sync helpery sa nepodarilo nájsť`);
  }
  return source.slice(start, end);
}

function readCzechPrices(sourceName, selects) {
  const source = readFileSync(join(ROOT, sourceName), "utf8");
  const pricingStart = Math.max(
    source.indexOf("function detectLang()"),
    source.indexOf("function detectCurrencySymbol()"),
  );
  const pricingEnd = source.indexOf("function calculatePrice(state, PRICES)");
  const normalizeStart = source.indexOf("function normalizeOptionText");
  const normalizeEnd = source.indexOf("function findMatchingOption", normalizeStart);
  if (pricingStart < 0 || pricingEnd < 0 || normalizeStart < 0 || normalizeEnd < 0) {
    throw new Error(`${sourceName}: cenové helpery sa nepodarilo nájsť`);
  }
  const dom = new JSDOM(
    `<head><meta itemprop="price" content="5807"></head><body>${selects}</body>`,
    { url: "https://www.luxurycardesign.cz/luxusni-autokoberce-truck/" },
  );
  const helpers = new Function(
    "window",
    "document",
    `${source.slice(pricingStart, pricingEnd)}\n${source.slice(normalizeStart, normalizeEnd)}\nreturn { readShoptetPrices, FALLBACK_PRICES };`,
  )(dom.window, dom.window.document);
  return {
    live: helpers.readShoptetPrices(helpers.FALLBACK_PRICES),
    fallback: helpers.FALLBACK_PRICES,
  };
}

function expectPrice(actual, expected, label, sourceName) {
  if (actual !== expected) {
    throw new Error(`${sourceName}: ${label} = ${actual}, očakávané ${expected}`);
  }
}

function syncValues(helperSource, state, selects = SELECTS_SK, url = "https://www.luxurycardesign.sk/luxusne-autokoberce-truck/") {
  const dom = new JSDOM(`<body>${selects}</body>`, {
    url,
  });
  const sync = new Function(
    "document",
    "Event",
    "sessionStorage",
    `${helperSource}; return syncToShoptet;`,
  )(dom.window.document, dom.window.Event, dom.window.sessionStorage);

  sync(state);
  return Object.fromEntries(
    Array.from(dom.window.document.querySelectorAll("select")).map((select) => [
      select.dataset.parameterName,
      select.selectedOptions[0]?.textContent.trim() || "",
    ]),
  );
}

function expectStartsWith(values, name, prefix, sourceName) {
  if (!values[name]?.startsWith(prefix)) {
    throw new Error(`${sourceName}: ${name} = "${values[name]}", očakávané "${prefix}…"`);
  }
}

const manualState = {
  znacka: "Scania (TIR)",
  model: "R 2016-2023",
  extras: {},
  selectedMaterial: "Prémiová syntetická koža – prešívaná",
  selectedColor: { code: "K2" },
  selectedLemovanie: { code: "L-1" },
  nasivkyPlacement: "boky+stred",
  selectedNasivka: { code: "H2" },
  selectedNitColor: { code: "2901" },
  selectedStredNasivka: { code: "H3" },
  selectedStredNitColor: { code: "2824" },
  doorPanelChoice: "ano",
  doorWantsNasivka: true,
  doorNasivka: { code: "H4" },
  doorNitColor: { code: "3842" },
  doorSameNasivkaAsCarpet: false,
  doorSameNitAsCarpet: false,
  doorSameAsCarpet: { material: false, lemovanie: false },
  doorMaterial: "Kůže",
  doorColor: { code: "D-17" },
  doorLemovanie: { code: "L-1" },
};

// SK 640 po pridaní hodnôt farieb a lemovaní do príplatkov (výrez – pár hodnôt z 48 farieb / 13 lemovaní / 6 materiálov)
const SELECTS_SK_FARBY = SELECTS_SK
  .replace('<option value="custom">Vyberie sa v konfigurátore +€0</option>\n  </select>\n  <select data-parameter-id="379"',
    '<option value="custom">Vyberie sa v konfigurátore +€0</option><option value="f11">čierna, čierne šitie – 11 +€0</option><option value="f3">hnedá, hnedé šitie – 3 +€0</option><option value="f1g">svetlobéžová – 1G +€0</option><option value="f2n">sivý – 2N +€0</option>\n  </select>\n  <select data-parameter-id="379"')
  .replace('<option value="custom">Vyberie sa v konfigurátore +€0</option>\n  </select>\n  <select data-parameter-id="349"',
    '<option value="custom">Vyberie sa v konfigurátore +€0</option><option value="l03">čierny základ, grafitové pásiky – 03 +€0</option><option value="l08">čierny základ, hnedé pásiky – 08 +€0</option><option value="l13">hnedý základ, béžové pásiky – 13 +€0</option>\n  </select>\n  <select data-parameter-id="349"')
  .replace('<option value="custom">Vyberie sa v konfigurátore +€0</option>\n  </select>\n  <select data-parameter-id="391"',
    '<option value="custom">Vyberie sa v konfigurátore +€0</option><option value="m2">Prémiová syntetická koža – prešívaná +€0</option><option value="m5">Mikrosemiš – dvojfarebný +€0</option>\n  </select>\n  <select data-parameter-id="391"')
  .replace('<option value="custom">Vyberie sa v konfigurátore +€0</option>\n  </select>\n  <select data-parameter-id="394"',
    '<option value="custom">Vyberie sa v konfigurátore +€0</option><option value="d11">čierna, čierne šitie – 11 +€0</option><option value="d2n">sivý – 2N +€0</option>\n  </select>\n  <select data-parameter-id="394"')
  .replace('<option value="custom">Vyberie sa v konfigurátore +€0</option>\n  </select>\n  <select data-parameter-id="397"',
    '<option value="custom">Vyberie sa v konfigurátore +€0</option><option value="dl03">čierny základ, grafitové pásiky – 03 +€0</option><option value="dl08">čierny základ, hnedé pásiky – 08 +€0</option>\n  </select>\n  <select data-parameter-id="397"');
if ((SELECTS_SK_FARBY.match(/value="(f3|l08|m5|d2n|dl03)"/g) || []).length !== 5) throw new Error("SELECTS_SK_FARBY: výrez sa nepodaril");

const stavFarby = {
  ...manualState,
  selectedColor: { code: "3" },
  selectedLemovanie: { code: "08", name: "Čierna + Hnedá" },
  doorMaterial: "Mikrosemiš – dvojfarebný",
  doorColor: { code: "2N" },
  doorLemovanie: { code: "03", name: "Čierna + Grafitová" },
};

for (const sourceName of ["konfigurator.jsx", "konfigurator.phone.jsx"]) {
  const helperSource = loadSync(sourceName);
  const manual = syncValues(helperSource, manualState);

  expectStartsWith(manual, "Typ materiálu", "Prémiová syntetická koža", sourceName);
  expectStartsWith(manual, "Farba materiálu", "Vyberie sa", sourceName);
  expectStartsWith(manual, "Farba lemovania", "Vyberie sa", sourceName);
  expectStartsWith(manual, "Rozloženie nášiviek", "Šofér + spolujazdec + stred", sourceName);
  expectStartsWith(manual, "Typ nášiviek na boky", "Nášivka H2", sourceName);
  expectStartsWith(manual, "Farba nášiviek na boky", "2901", sourceName);
  expectStartsWith(manual, "Typ nášivky na stred", "Nášivka H3", sourceName);
  expectStartsWith(manual, "Farba nášivky na stred", "2824", sourceName);
  expectStartsWith(manual, "Nášivky na tapacír", "Áno chcem", sourceName);
  expectStartsWith(manual, "Typ materiálu tapacíru", "Vyberie sa", sourceName);
  expectStartsWith(manual, "Farba materiálu tapacíru", "Vyberie sa", sourceName);
  expectStartsWith(manual, "Farba lemovania tapacíru", "Vyberie sa", sourceName);
  expectStartsWith(manual, "Typ nášivky na tapacír", "Nášivka H4", sourceName);
  expectStartsWith(manual, "Farba nášiviek na tapacíre", "3842", sourceName);

  // Michal 25. 10. 2026: skutočná farba a lemovanie priamo v položke objednávky (hodnoty príplatkov v admine SK 640)
  const farby = syncValues(helperSource, sTextamiPriplatkov(stavFarby), SELECTS_SK_FARBY);
  expectStartsWith(farby, "Farba materiálu", "hnedá, hnedé šitie – 3", sourceName);
  expectStartsWith(farby, "Farba lemovania", "čierny základ, hnedé pásiky – 08", sourceName);
  expectStartsWith(farby, "Typ materiálu tapacíru", "Mikrosemiš – dvojfarebný", sourceName);
  expectStartsWith(farby, "Farba materiálu tapacíru", "sivý – 2N", sourceName);
  expectStartsWith(farby, "Farba lemovania tapacíru", "čierny základ, grafitové pásiky – 03", sourceName);
  // admin hodnotu ešte nemá (starý stav adminu / neznámy kód) -> „Vyberie sa v konfigurátore“, povinný príplatok nikdy prázdny
  const farbyStaryAdmin = syncValues(helperSource, sTextamiPriplatkov(stavFarby), SELECTS_SK);
  for (const name of ["Farba materiálu", "Farba lemovania", "Typ materiálu tapacíru", "Farba materiálu tapacíru", "Farba lemovania tapacíru"]) {
    expectStartsWith(farbyStaryAdmin, name, "Vyberie sa", sourceName);
  }
  const neznamy = syncValues(helperSource, sTextamiPriplatkov({ ...stavFarby, selectedColor: { code: "K9" }, doorColor: { code: "K9" } }), SELECTS_SK_FARBY);
  expectStartsWith(neznamy, "Farba materiálu", "Vyberie sa", sourceName);
  expectStartsWith(neznamy, "Farba materiálu tapacíru", "Vyberie sa", sourceName);
  const rovnake = syncValues(helperSource, sTextamiPriplatkov({ ...stavFarby, doorSameAsCarpet: { material: true, lemovanie: true } }), SELECTS_SK_FARBY);
  expectStartsWith(rovnake, "Typ materiálu tapacíru", "Rovnaký ako koberec", sourceName);
  expectStartsWith(rovnake, "Farba materiálu tapacíru", "Rovnaká ako koberec", sourceName);
  expectStartsWith(rovnake, "Farba lemovania tapacíru", "Rovnaké ako koberec", sourceName);

  const none = syncValues(helperSource, {
    ...manualState,
    nasivkyPlacement: "nechcem",
    selectedNasivka: null,
    selectedNitColor: null,
    selectedStredNasivka: null,
    selectedStredNitColor: null,
    doorPanelChoice: "nie",
    doorWantsNasivka: null,
    doorNasivka: null,
    doorNitColor: null,
  });

  for (const name of ["Typ nášiviek na boky", "Typ nášivky na stred", "Typ nášivky na tapacír"]) {
    expectStartsWith(none, name, "Bez nášivky", sourceName);
  }
  for (const name of ["Farba nášiviek na boky", "Farba nášivky na stred", "Farba nášiviek na tapacíre"]) {
    expectStartsWith(none, name, "Bez nite", sourceName);
  }

  const manualCz = syncValues(
    helperSource,
    manualState,
    SELECTS_CZ,
    "https://www.luxurycardesign.cz/luxusni-autokoberce-truck/",
  );
  expectStartsWith(manualCz, "Nášivka boky", "Nášivka H2", sourceName);
  expectStartsWith(manualCz, "Niť boky", "2901", sourceName);
  expectStartsWith(manualCz, "Nášivka stred", "Nášivka H3", sourceName);
  expectStartsWith(manualCz, "Niť stred", "2824", sourceName);
  expectStartsWith(manualCz, "Čalounění", "Ano, chci", sourceName);
  expectStartsWith(manualCz, "Nášivka dveře", "Ano, chci", sourceName);
  expectStartsWith(manualCz, "Materiál dveře", "Vybere se", sourceName);
  expectStartsWith(manualCz, "Barva dveře", "Vybere se", sourceName);
  expectStartsWith(manualCz, "Lemování dveře", "Vybere se", sourceName);
  expectStartsWith(manualCz, "Nášivka dveře druh", "Nášivka H4", sourceName);
  expectStartsWith(manualCz, "Niť dveře", "3842", sourceName);

  const renamedCz = syncValues(
    helperSource,
    manualState,
    SELECTS_CZ_RENAMED,
    "https://www.luxurycardesign.cz/luxusni-autokoberce-truck/",
  );
  expectStartsWith(renamedCz, "Typ nášivek na boky", "Nášivka H2", sourceName);
  expectStartsWith(renamedCz, "Barva nášivek na boky", "2901", sourceName);
  expectStartsWith(renamedCz, "Typ nášivky na střed", "Nášivka H3", sourceName);
  expectStartsWith(renamedCz, "Barva nášivky na střed", "2824", sourceName);
  expectStartsWith(renamedCz, "Nášivky na tapacír", "Ano, chci", sourceName);
  expectStartsWith(renamedCz, "Typ materiálu tapacíru", "Vybere se", sourceName);
  expectStartsWith(renamedCz, "Barva materiálu tapacíru", "Vybere se", sourceName);
  expectStartsWith(renamedCz, "Barva lemování tapacíru", "Vybere se", sourceName);
  expectStartsWith(renamedCz, "Typ nášivky na tapacír", "Nášivka H4", sourceName);
  expectStartsWith(renamedCz, "Barva nášivek na tapacíru", "3842", sourceName);

  const sameCz = syncValues(
    helperSource,
    {
      ...manualState,
      doorSameAsCarpet: { material: true, lemovanie: true },
      doorSameNasivkaAsCarpet: true,
      doorSameNitAsCarpet: true,
    },
    SELECTS_CZ,
    "https://www.luxurycardesign.cz/luxusni-autokoberce-truck/",
  );
  expectStartsWith(sameCz, "Materiál dveře", "Stejný jako koberec", sourceName);
  expectStartsWith(sameCz, "Barva dveře", "Stejná jako koberec", sourceName);
  expectStartsWith(sameCz, "Lemování dveře", "Stejné jako koberec", sourceName);
  expectStartsWith(sameCz, "Nášivka dveře druh", "Stejná jako koberec", sourceName);
  expectStartsWith(sameCz, "Niť dveře", "Stejná jako koberec", sourceName);

  const czechPrices = readCzechPrices(sourceName, SELECTS_CZ);
  expectPrice(czechPrices.live.MATERIAL["Prémiová syntetická koža – prešívaná"], 199, "CZ prošívaný materiál z DOMu", sourceName);
  expectPrice(czechPrices.live.MATERIAL["Mikrosemiš – jednofarebný"], 990, "CZ mikrosemiš z DOMu", sourceName);
  expectPrice(czechPrices.live.NASIVKY["boky+stred"], 2299, "CZ nášivky z DOMu", sourceName);
  expectPrice(czechPrices.live.TAPACIR_BUNDLE, 2890, "CZ čalounění z DOMu", sourceName);
  expectPrice(czechPrices.live.NASIVKA_DVERE, 1190, "CZ nášivka dveří z DOMu", sourceName);
  expectPrice(czechPrices.fallback.BASE, 4799, "CZ fallback základ", sourceName);
  expectPrice(czechPrices.fallback.NASIVKY["boky+stred"], 2299, "CZ fallback nášivky", sourceName);

  console.log(`✓ ${sourceName}: slovenské i české příplatkové parametry a ceny se synchronizují`);
}

// Nový konfigurátor 1V (kamion/shoptet.js) – rovnaký výber skutočnej farby a záloha „Vyberie sa v konfigurátore“
{
  const syncNovy = async (state, selects) => {
    const dom = new JSDOM(`<body>${selects}</body>`, { url: "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/" });
    globalThis.document = dom.window.document;
    globalThis.Event = dom.window.Event;
    globalThis.sessionStorage = dom.window.sessionStorage;
    const { syncToShoptet } = await import("../components/konfigurator1v/kamion/shoptet.js");
    syncToShoptet(state);
    return Object.fromEntries(Array.from(dom.window.document.querySelectorAll("select")).map((s) => [s.dataset.parameterName, s.selectedOptions[0]?.textContent.trim() || ""]));
  };
  const n1 = await syncNovy(sTextamiPriplatkov(stavFarby), SELECTS_SK_FARBY);
  expectStartsWith(n1, "Farba materiálu", "hnedá, hnedé šitie – 3", "1V shoptet.js");
  expectStartsWith(n1, "Farba lemovania", "čierny základ, hnedé pásiky – 08", "1V shoptet.js");
  expectStartsWith(n1, "Typ materiálu tapacíru", "Mikrosemiš – dvojfarebný", "1V shoptet.js");
  expectStartsWith(n1, "Farba materiálu tapacíru", "sivý – 2N", "1V shoptet.js");
  expectStartsWith(n1, "Farba lemovania tapacíru", "čierny základ, grafitové pásiky – 03", "1V shoptet.js");
  const n2 = await syncNovy(sTextamiPriplatkov(stavFarby), SELECTS_SK);
  for (const name of ["Farba materiálu", "Farba lemovania", "Typ materiálu tapacíru", "Farba materiálu tapacíru", "Farba lemovania tapacíru"]) {
    expectStartsWith(n2, name, "Vyberie sa", "1V shoptet.js");
  }
  delete globalThis.document; delete globalThis.Event; delete globalThis.sessionStorage;
  console.log("✓ 1V shoptet.js: skutočná farba a lemovanie do príplatkov, bez hodnoty v admine „Vyberie sa v konfigurátore“");
}
