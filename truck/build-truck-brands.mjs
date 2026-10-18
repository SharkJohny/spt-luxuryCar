#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * build-truck-brands.mjs — vytiahne vozidlá a ich voľby z konfigurátora
 *
 * Zdroj pravdy je `assets/js/truck-konfigurator/konfigurator.jsx` (CONFIG),
 * ktorý sa re-syncuje z klientskeho repa luxusnerohoze-dev/konfigurator.
 * Hlavný prepínač na homepage (main.js → initModelSelect) potrebuje rovnaké
 * údaje z kroku 1 ako samotný konfigurátor: značku, model aj podmienené voľby
 * (prevodovka, sedadlo, zásuvky, brzda, podlaha). CONFIG neobsahuje obrázky,
 * preto ho môžeme bezpečne zdieľať v malom dátovom module:
 *
 *     assets/js/truck-konfigurator/truck-brands.js   (auto-generovaný)
 *
 * Spustenie:  node truck/build-truck-brands.mjs   (beží v `yarn build*`)
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TK = join(ROOT, "..", "assets", "js", "truck-konfigurator");
const SRC = join(TK, "konfigurator.jsx");
const OUT = join(TK, "truck-brands.js");

const src = readFileSync(SRC, "utf8");

const start = src.indexOf("const CONFIG = {");
if (start < 0) {
  console.error("[truck-brands] CHYBA: `const CONFIG = {` nenájdený v konfigurator.jsx");
  process.exit(1);
}

// Nájdi koniec CONFIG objektu spárovaním zátvoriek (reťazce/komentáre preskoč).
const objStart = src.indexOf("{", start);
let depth = 0, i = objStart, inStr = null, inLineComment = false, inBlockComment = false;
for (; i < src.length; i++) {
  const ch = src[i], next = src[i + 1];
  if (inLineComment) { if (ch === "\n") inLineComment = false; continue; }
  if (inBlockComment) { if (ch === "*" && next === "/") { inBlockComment = false; i++; } continue; }
  if (inStr) {
    if (ch === "\\") { i++; continue; }
    if (ch === inStr) inStr = null;
    continue;
  }
  if (ch === "/" && next === "/") { inLineComment = true; i++; continue; }
  if (ch === "/" && next === "*") { inBlockComment = true; i++; continue; }
  if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
  if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (depth === 0) break; }
}
const configSrc = src.slice(objStart, i + 1);

// Vyhodnoť literál v izolovanom scope — CONFIG je čistý objekt bez referencií.
let CONFIG;
try {
  // eslint-disable-next-line no-new-func
  CONFIG = new Function(`"use strict"; return (${configSrc});`)();
} catch (err) {
  console.error("[truck-brands] CHYBA: CONFIG sa nepodarilo vyhodnotiť:", err.message);
  process.exit(1);
}

const brands = Object.keys(CONFIG);
if (!brands.length) {
  console.error("[truck-brands] CHYBA: CONFIG je prázdny");
  process.exit(1);
}

let modelCount = 0;
for (const brand of brands) {
  const models = Object.keys(CONFIG[brand] || {});
  modelCount += models.length;
}

const out =
  "/* AUTO-GENEROVANÉ truck/build-truck-brands.mjs — needituj ručne.\n" +
  " * Zdroj: assets/js/truck-konfigurator/konfigurator.jsx (CONFIG).\n" +
  " * Regeneruj: node truck/build-truck-brands.mjs (beží v yarn build). */\n\n" +
  "export const TRUCK_VEHICLES = " + JSON.stringify(CONFIG, null, 2) + ";\n\n" +
  "export const TRUCK_FIELD_ORDER = [\"prevodovka\", \"sedadlo\", \"zasuvky\", \"brzda\", \"podlaha\"];\n\n" +
  "export const TRUCK_BRANDS = Object.fromEntries(\n" +
  "  Object.entries(TRUCK_VEHICLES).map(([brand, models]) => [brand, Object.keys(models)]),\n" +
  ");\n\n" +
  "/** Produktová stránka truck konfigurátora (cieľ hlavného prepínača).\n" +
  " *  Ostré produkty overené zo sitemap 31.7.2026 (SK aj CZ vracajú 200). */\n" +
  'export const TRUCK_PRODUCT_URLS = {\n' +
  '  sk: "/luxusne-autokoberce-kamiony/",\n' +
  '  cs: "/luxusni-autokoberce-kamiony/",\n' +
  '};\n' +
  'export const TRUCK_PRODUCT_URL = TRUCK_PRODUCT_URLS.sk;\n';

writeFileSync(OUT, out, "utf8");
console.log(
  `[truck-brands] ${brands.length} značiek, ${modelCount} modelov -> ` +
  OUT.replace(join(ROOT, ".."), "").replace(/^\//, ""),
);
