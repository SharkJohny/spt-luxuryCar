// CZ košík (klasický /kosik/ aj súhrn v pokladni): súhrn CZ konfigurátora má slovenské hodnoty („Prémiová syntetická koža –
// prešívaná“, „Automatická prevodovka“, „Sedadlo spolujazdca odpružené“) -> zákazník ich vidí po česky (materiál z príplatku
// Shoptetu, výbava ako CZ konfigurátor). Súhrn v sessionStorage (poznámka objednávky, Jánov export) sa nemení.
// Živá kontrola vlákna nášiviek 2. 11. 2026 (8681b1e). Príplatky riadku = živý CZ košík 2452.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { buildTruckOrderSummary } from "./order-summary.mjs";

const SUR = "Příplatky: Barva - černá, černé prošití – 11, Niť boky - Bez nitě, Niť dveře - Bez nitě, Niť stred - Bez nitě, Čalounění - Ne, nechci čalounění dveří, Nášivka boky - Bez nášivky, Nášivka stred - Bez nášivky, Lemování - černý základ, černé proužky – 09, Materiál - Prémiová syntetická kůže – prošívaná, Nášivka dveře druh - Bez nášivky, Nášivka dveře - Ne, nechci nášivku na dveřích, Nášivky - Bez nášivek";
const dom = new JSDOM(`<html lang="cs"><body>
    <table><tbody><tr class="removeable">
      <td><a class="main-link">Luxusní autokoberce do kamionů</a></td>
      <td><span class="main-link-surcharges">${SUR}</span></td>
    </tr></tbody></table>
  </body></html>`, { url: "https://www.luxurycardesign.cz/kosik/" });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
globalThis.sessionStorage = dom.window.sessionStorage;
const $ = (await import("jquery")).default;
globalThis.$ = $;
globalThis.jQuery = $;
dom.window.$ = $;
dom.window.jQuery = $;

const suhrn = buildTruckOrderSummary({
  znacka: "DAF (TIR)", model: "XF 2022-2025", extras: { prevodovka: "Automatická prevodovka", sedadlo: "Sedadlo spolujazdca odpružené" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "09" },
  nasivkyPlacement: "none", doorPanelChoice: "nie",
}, "cs");
sessionStorage.setItem("truckOrderSummary", suhrn);

const { initCart } = await import("../components/cart.js");
initCart({});

const t = document.querySelector(".lcd-truck-cart-summary")?.textContent || "";
assert.match(t, /Prémiová syntetická kůže – prošívaná – černá, černé prošití – 11/, t);
assert.match(t, /Typ převodovky\s*Automatická(?!\s*prevodovka)/, t);
assert.match(t, /Typ sedadla spolujezdce\s*Odpružené/, t);
assert.match(t, /DAF XF 2022–2025/, t);
assert.doesNotMatch(t, /koža|prešívan|prevodovka|spolujazdca|\(TIR\)/, t);
assert.equal(sessionStorage.getItem("truckOrderSummary"), suhrn, "súhrn pre poznámku objednávky sa nesmie zmeniť");
console.log("✓ CZ košík: kamión po česky (materiál zo Shoptetu, výbava ako konfigurátor), súhrn objednávky bez zmeny");
