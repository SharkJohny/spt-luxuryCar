#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * build-product-xml.mjs — Shoptet produkt "Vzorkovník"
 *
 * KAŽDÁ VZORKA = JEDEN samostatný príplatkový parameter (yes/no).
 *
 * Prečo: Shoptet príplatkový parameter s viacerými HODNOTAMI je single-select
 * (dropdown) — zákazník si z neho vyberie len JEDNU možnosť. Keď chceme, aby
 * si zákazník mohol objednať VIAC vzoriek naraz, musí byť každá vzorka vlastný
 * parameter s dvomi hodnotami:
 *   - "Nechcem"                → 0 €
 *   - "Chcem (vratná záloha)"  → +5 €
 *
 * Tým je každá vzorka nezávisle zaškrtnuteľná → ľubovoľná kombinácia vzoriek.
 *
 * Poradie vrstiev (zhodne s konfigurátorom):
 *   1) Stripe Line   (S)   — 1. vrstva
 *   2) Hexa Line     (H)   — 1. vrstva
 *   3) Diamond Line  (D)   — 1. vrstva
 *   4) 2. vrstva     (LUX) — 2. vrstva
 *
 * Dáta sa čítajú z konfigurátora (vzorky/src/konfigurator.jsx) — "aktuálne
 * vzorky" z klientskeho repa. Produkt a konfigurátor tak ostávajú konzistentné.
 *
 * Spustenie:  node vzorky/build-product-xml.mjs   (alebo yarn vzorky:product)
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src", "konfigurator.jsx");
const OUT = join(ROOT, "dist", "vzorky-product.xml");

const DEPOSIT = 5; // €/vzorka

// --- 1. Vyparsuj dátové polia z konfigurátora ------------------------------
const jsxSrc = readFileSync(SRC, "utf8");
function extractArray(name) {
  const m = jsxSrc.match(new RegExp("const " + name + "\\s*=\\s*(\\[[\\s\\S]*?\\]);"));
  if (!m) throw new Error("Pole " + name + " sa v zdroji nenašlo.");
  return m[1];
}
const data = new Function(
  "IMG",
  "IMG_PATH",
  `return {
     DIAMOND: ${extractArray("DIAMOND")},
     STRIPE:  ${extractArray("STRIPE")},
     HEXA:    ${extractArray("HEXA")},
     SECOND:  ${extractArray("SECOND")},
   };`,
)(() => "", () => "");

// Poradie podľa zadania: S = 1, H = 2, D = 3, 2. vrstva = 4.
const LINES = [
  { line: "Stripe", layer: "1. vrstva", items: data.STRIPE },
  { line: "Hexa", layer: "1. vrstva", items: data.HEXA },
  { line: "Diamond", layer: "1. vrstva", items: data.DIAMOND },
  {
    line: "2. vrstva",
    layer: "2. vrstva",
    // Ako VZORKY sú objednávateľné všetky Lux Color (v konfigurátore boli
    // ostatné len náhľad). Zoradíme vzostupne podľa čísla (LUX-01 … LUX-16).
    items: [...data.SECOND].sort(
      (a, b) => parseInt(a.id.replace(/\D/g, ""), 10) - parseInt(b.id.replace(/\D/g, ""), 10),
    ),
  },
];

// Sploštíme na jednu vzorku = jeden parameter, s metadátami o vrstve.
// LEN OBJEDNÁVATEĽNÉ vzorky sa stanú parametrom: 1. vrstva celá, 2. vrstva iba
// Lux Color 10 (orderable:true). Ostatné Lux Color sú v konfigurátore len
// vizuálne náhľady (orderable:false) — nemajú parameter, teda sa nedajú objednať.
const SAMPLES = LINES.flatMap((L) =>
  L.items
    .filter((it) => L.layer === "1. vrstva" || it.orderable === true)
    .map((it) => ({ id: it.id, label: it.label, line: L.line, layer: L.layer })),
);

// Čistý názov vzorky pre názov parametra.
function cleanLabel(label) {
  return label.replace(/^(Lux Color)\s+(\d+)\s*[—–-]\s*/, "$1 $2 – ").trim();
}

// Názov vzorky do objednávky: "koža čierna, prešitie červené" namiesto
// "Čierna prešívaná červenou", aby bolo v objednávke jasné čo sa balí.
function sampleLabel(s) {
  const label = cleanLabel(s.label);
  if (s.layer !== "1. vrstva" || /^Štandard/.test(label)) return label;
  const m = label.match(/^Čierna prešívaná (\S+)ou$/);
  if (m) return `koža čierna, prešitie ${m[1]}${/(iel|iern)$/.test(m[1]) ? "e" : "é"}`;
  return `koža ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

// --- 2. XML helpers --------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Jedna vzorka → jeden SURCHARGE_PARAMETER (yes/no), aby šlo vybrať viac naraz.
function surchargeParam(s) {
  const name = `Vzorka ${s.line} – ${cleanLabel(s.label)} (${s.id})`;
  const desc = `Pridať vzorku ${s.line} (${s.layer}) – ${cleanLabel(s.label)} [${s.id}] do objednávky. Vratná záloha ${DEPOSIT} € (vrátime po obdržaní vzoriek späť).`;
  const values = [
    "        <VALUE><NAME>Nechcem</NAME><PRICE>0</PRICE></VALUE>",
    `        <VALUE><NAME>Áno</NAME><PRICE>${DEPOSIT}</PRICE></VALUE>`,
  ].join("\n");
  return [
    "    <SURCHARGE_PARAMETER>",
    `      <NAME>${esc(name)}</NAME>`,
    `      <DESCRIPTION>${esc(desc)}</DESCRIPTION>`,
    // SHORT_NAME je to, čo Shoptet ukáže zákazníkovi v riadku parametra AJ
    // v objednávke — samotné "D-10" mu nič nehovorí, musí tam byť farba kože
    // aj farba šitia. Kód necháme v zátvorke kvôli baleniu vzoriek.
    `      <SHORT_NAME>${esc(`${s.line} – ${sampleLabel(s)} (${s.id})`)}</SHORT_NAME>`,
    "      <CURRENCY>EUR</CURRENCY>",
    "      <INCLUDING_VAT>1</INCLUDING_VAT>",
    "      <REQUIRED_VALUE>0</REQUIRED_VALUE>",
    "      <VALUES>",
    values,
    "      </VALUES>",
    "    </SURCHARGE_PARAMETER>",
  ].join("\n");
}

// --- 3. Poskladaj SHOPITEM -------------------------------------------------
const paramsXml = SAMPLES.map(surchargeParam).join("\n");
const GUID = randomUUID();

const shortDesc =
  "<![CDATA[<p>Objednávka materiálových vzoriek Dragonskin (autokoberce do osobných áut). " +
  "Každú vzorku, ktorú chceš dostať, samostatne zaškrtni (Chcem). " +
  "Môžeš si tak objednať ľubovoľný počet vzoriek naraz. " +
  "Každá vzorka = vratná záloha 5 €, ktorú vrátime po obdržaní vzoriek späť.</p>]]>";
const desc =
  "<![CDATA[<p>Vzorkovník: tri série 1. vrstvy – <strong>Stripe Line</strong>, " +
  "<strong>Hexa Line</strong>, <strong>Diamond Line</strong> – a <strong>2. vrstva</strong> (Lux Color). " +
  "Každá vzorka má vlastné políčko – zaškrtni „Chcem“ pri každej vzorke, ktorú chceš dostať. " +
  "Cena 5 € je vratná záloha za vzorku. " +
  "Vzorky sú určené pre autokoberce do osobných automobilov (nie kamióny).</p>]]>";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SHOP>
  <SHOPITEM id="3100">
    <NAME>Vzorkovník Dragonskin – objednávka vzoriek</NAME>
    <GUID>${GUID}</GUID>
    <SHORT_DESCRIPTION>${shortDesc}</SHORT_DESCRIPTION>
    <DESCRIPTION>${desc}</DESCRIPTION>
    <MANUFACTURER>Luxury Car Design</MANUFACTURER>
    <ADULT>0</ADULT>
    <ITEM_TYPE>product</ITEM_TYPE>
    <CATEGORIES>
      <CATEGORY id="500">Naše produkty</CATEGORY>
      <DEFAULT_CATEGORY id="500">Naše produkty</DEFAULT_CATEGORY>
    </CATEGORIES>
    <SURCHARGE_PARAMETERS>
${paramsXml}
    </SURCHARGE_PARAMETERS>
    <FLAGS>
      <FLAG><CODE>new</CODE><ACTIVE>1</ACTIVE></FLAG>
    </FLAGS>
    <VISIBILITY>visible</VISIBILITY>
    <META_DESCRIPTION>Objednávka vzoriek Dragonskin – Stripe, Hexa, Diamond, 2. vrstva. Každá vzorka samostatne, vratná záloha 5 € za vzorku.</META_DESCRIPTION>
    <UNIT>ks</UNIT>
    <CODE>VZORKY-DRAGONSKIN</CODE>
    <CURRENCY>EUR</CURRENCY>
    <PRICE>0</PRICE>
    <VAT>23</VAT>
    <STANDARD_PRICE>0</STANDARD_PRICE>
    <STOCK>
      <AMOUNT>999</AMOUNT>
    </STOCK>
    <VISIBLE>1</VISIBLE>
    <AVAILABILITY_IN_STOCK>Skladem</AVAILABILITY_IN_STOCK>
  </SHOPITEM>
</SHOP>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, xml, "utf8");
const byLine = LINES.map(
  (L) => `${L.line} ${SAMPLES.filter((s) => s.line === L.line).length}/${L.items.length}`,
).join(", ");
console.log("[vzorky-xml] KAŽDÁ OBJEDNÁVATEĽNÁ VZORKA = samostatný parameter (yes/no).");
console.log(`[vzorky-xml] vrstvy (objednávateľné/spolu): ${byLine}`);
console.log(`[vzorky-xml] spolu parametrov (objednávateľných vzoriek): ${SAMPLES.length}`);
console.log(`[vzorky-xml] HOTOVO → ${OUT}`);
