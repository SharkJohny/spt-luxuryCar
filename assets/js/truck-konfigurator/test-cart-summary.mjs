import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { buildTruckOrderSummary } from "./order-summary.mjs";

const dom = new JSDOM(`
  <body>
    <table><tbody><tr class="removeable">
      <td><a class="main-link">luxusné autokoberce TRUCK</a></td>
      <td><span class="main-link-surcharges">Príplatky: Vozidlo: Vyberie sa v konfigurátore, Prevodovka: Automatická, Farba: Vyberie sa v konfigurátore</span></td>
    </tr></tbody></table>
  </body>
`, { url: "https://www.luxurycardesign.sk/kosik/" });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
globalThis.sessionStorage = dom.window.sessionStorage;

const jqueryModule = await import("jquery");
const $ = jqueryModule.default;
globalThis.$ = $;
globalThis.jQuery = $;
dom.window.$ = $;
dom.window.jQuery = $;

sessionStorage.setItem("truckOrderSummary", buildTruckOrderSummary({
  znacka: "DAF (TIR)",
  model: "XF 2022-2025",
  extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná",
  selectedColor: { code: "K2" },
  selectedLemovanie: { name: "Červené lemovanie" },
  nasivkyPlacement: "boky+stred",
  selectedNasivka: { code: "H1" },
  selectedNitColor: { code: "2901", name: "Strieborná" },
  selectedStredNasivka: { code: "H4" },
  selectedStredNitColor: { code: "3504", name: "Tmavohnedá" },
  doorPanelChoice: "ano",
  doorMaterial: "Prémiová syntetická koža – prešívaná",
  doorColor: { code: "K2" },
  doorLemovanie: { name: "Červené lemovanie" },
  doorWantsNasivka: false,
  doorSameAsCarpet: { material: true, lemovanie: true },
}));

const { initCart } = await import("../components/cart.js");
initCart({});

const groups = [...document.querySelectorAll(".lcd-truck-cart-summary__group")];
assert.equal(groups.length, 3);
assert.deepEqual(groups.map((group) => group.querySelector("h4")?.textContent), [
  "ŠPECIFIKÁCIA VOZIDLA",
  "KOBERČEKY POD SEDAČKY",
  "TAPACÍR DVERÍ",
]);
assert.match(document.body.textContent, /Typ a farba materiálu/);
assert.match(document.body.textContent, /Rovnaký ako koberčeky/);
assert.match(document.body.textContent, /Nášivky na tapacír\s*Nechcem/);
assert.match(document.body.textContent, /Strieborná – 2901/); // čísla na koniec (25. 10. 2026)
assert.match(document.body.textContent, /Tmavohnedá – 3504/);
assert.doesNotMatch(document.body.textContent, /Vyberie sa v konfigurátore/);

console.log("✓ košík vykresľuje truck konfiguráciu v prehľadných skupinách");
