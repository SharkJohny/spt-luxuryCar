#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * build-swatch-assets.mjs — swatch obrázky + manifest pre vzorkovník (JS výnimka)
 *
 * Z klientskeho zdroja (vzorky/src/konfigurator.jsx) vezme farby 4 sérií
 * (Stripe / Hexa / Diamond / 2. vrstva) a:
 *   1) každý referencovaný obrázok zoptimalizuje (sharp, ~360 px, JPEG q80)
 *      do  assets/img/vzorky/<ID>.jpg  (lokálne, ako zdroj na nahratie do Shoptetu).
 *      Manifest ale ukazuje na Shoptet upload (IMG_BASE) — ŽIADNY base64 bloat.
 *   2) vygeneruje malý manifest  assets/js/vzorky-konfigurator/swatch-data.js
 *      (ID -> { label, img }) + poradie sérií. Manifest je ~3 KB, inlinuje sa
 *      do bundla bez problému.
 *
 * Spustenie:  yarn vzorky:swatches   (alebo: node vzorky/build-swatch-assets.mjs)
 *
 * Wiring na produkt: každá Shoptet surcharge VALUE končí "… – <ID> (vratná
 * záloha 5 €)". JS výnimka (index.js) z option textu vyparsuje <ID> a podľa
 * tohto manifestu priradí obrázok + label. Manifest a XML musia teda zdieľať
 * tie isté ID (S-1…S-8, H-1…H-3, D-1…D-18, LUX-01…LUX-16).
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url)); // vzorky/
const REPO = join(ROOT, "..");
const SRC = join(ROOT, "src", "konfigurator.jsx");
const IMAGES_WEB = join(ROOT, "images", "web");
const OUT_IMG = join(REPO, "assets", "img", "vzorky");
const OUT_MANIFEST = join(REPO, "assets", "js", "vzorky-konfigurator", "swatch-data.js");

const EDGE = 360; // swatch sa zobrazuje ~120-160 px; 360 = 2× retina rezerva
const QUALITY = 80;
// Obrázky vzoriek sú nahrané v Shoptet upload priečinku SK (/user/documents/upload/assets/config/<ID>.jpg); web ich od
// 29. 10. 2026 berie z kópie bajt po bajte v CDN repa (assets/img/ulozisko/spolocne/config/, tools/config-obrazky.mjs) —
// zmazanie súboru v admine nerozbije vzorkovník. Nová vzorka: nahrať do adminu, spustiť node tools/config-obrazky.mjs.
const IMG_BASE = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/ulozisko/spolocne/config/";

const log = (...a) => console.log("[swatch]", ...a);

// --- 1. Vytiahni 4 polia farieb zo zdroja -----------------------------------
const jsx = readFileSync(SRC, "utf8");
// IMG() v zdroji vracia "./images/web/" + cesta; pre lokálny lookup nám stačí
// holá relatívna cesta, takže IMG = identita.
const IMG = (p) => p;

function extractArray(name) {
  const m = jsx.match(new RegExp("const " + name + " = (\\[[\\s\\S]*?\\n\\]);"));
  if (!m) throw new Error(`Pole ${name} sa v konfigurator.jsx nenašlo.`);
  // eslint-disable-next-line no-new-func
  return new Function("IMG", "return " + m[1] + ";")(IMG);
}

const SERIES = [
  { key: "diamond", title: "Diamond Line",           param: "Vzorka Diamond Line", items: extractArray("DIAMOND") },
  { key: "stripe",  title: "Stripe Line",            param: "Vzorka Stripe Line",  items: extractArray("STRIPE") },
  { key: "hexa",    title: "Hexa Line",              param: "Vzorka Hexa Line",    items: extractArray("HEXA") },
  { key: "second",  title: "2. vrstva (Lux Color)",  param: "Vzorka 2. vrstva",    items: extractArray("SECOND") },
];

// --- 2. Optimalizuj obrázky -> assets/img/vzorky/<ID>.jpg (zdroj na upload) ---
if (existsSync(OUT_IMG)) rmSync(OUT_IMG, { recursive: true, force: true });
mkdirSync(OUT_IMG, { recursive: true });

const manifest = {}; // ID -> { label, img, series }
const missing = [];
let written = 0;
let bytes = 0;

for (const series of SERIES) {
  for (const it of series.items) {
    // Objednávateľnosť (zhodné pravidlo ako build-product-xml.mjs): 1. vrstva
    // (Stripe/Hexa/Diamond) celá, 2. vrstva iba položky s orderable:true (LUX-10).
    // Runtime (index.js) sa riadi TÝMTO flagom, nie prítomnosťou <select> v DOM-e,
    // takže náhľady sa nedajú vybrať, ani keby pre ne Shoptet vystavil parameter.
    const orderable = series.key !== "second" || it.orderable === true;
    const abs = join(IMAGES_WEB, it.img);
    const url = IMG_BASE + it.id + ".jpg";
    const raw = existsSync(abs) ? readFileSync(abs) : null;
    if (raw && raw.length > 0) {
      const buf = await sharp(raw)
        .rotate()
        .resize({ width: EDGE, height: EDGE, fit: "cover", position: "centre" })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();
      writeFileSync(join(OUT_IMG, it.id + ".jpg"), buf);
      written += 1;
      bytes += buf.length;
      manifest[it.id] = { label: it.label, img: url, series: series.key, orderable };
    } else {
      // Chýbajúci obrázok (napr. LUX-14/15/16): bez fotky, len label.
      manifest[it.id] = { label: it.label, img: null, series: series.key, orderable };
      missing.push(it.id);
    }
  }
}

log(`obrázky: ${written} zapísaných (${(bytes / 1048576).toFixed(2)} MB) -> ${OUT_IMG}`);
if (missing.length) log(`bez fotky (placeholder dlaždica): ${missing.join(", ")}`);

// --- 3. Vygeneruj manifest modul --------------------------------------------
const seriesMeta = SERIES.map((s) => ({
  key: s.key,
  title: s.title,
  param: s.param,
  ids: s.items.map((i) => i.id),
}));

mkdirSync(dirname(OUT_MANIFEST), { recursive: true });
const out =
  "/* AUTO-GENEROVANÉ build-swatch-assets.mjs — needituj ručne. */\n" +
  "/* Zdroj farieb: vzorky/src/konfigurator.jsx. Regeneruj: yarn vzorky:swatches */\n\n" +
  "export const VZORKY_SERIES = " + JSON.stringify(seriesMeta, null, 2) + ";\n\n" +
  "export const VZORKY_ITEMS = " + JSON.stringify(manifest, null, 2) + ";\n";
writeFileSync(OUT_MANIFEST, out, "utf8");

log(`manifest -> ${OUT_MANIFEST} (${Object.keys(manifest).length} položiek)`);
log("HOTOVO.");
