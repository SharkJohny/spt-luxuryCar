#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * build-truck-images.mjs — vytiahne base64 obrázky z truck konfigurátorov
 *
 * PROBLÉM: konfigurator.jsx + konfigurator.phone.jsx majú ~9 MB base64 obrázkov
 * KAŽDÝ → bundle luxuryCar.js narástol na ~20 MB (a načítava sa na CELOM webe).
 *
 * RIEŠENIE (vzor: vzorky): base64 von z bundla na Shoptet upload.
 *   1) Zdrojové *.jsx ostávajú s base64 (kvôli čistému 3-way merge pri re-syncu
 *      z klientskeho repa luxusnerohoze-dev/konfigurator).
 *   2) Tento build vytiahne KAŽDÝ unikátny base64 obrázok (dedup podľa SHA-1)
 *      do  assets/img/truck/t<hash>.<ext>  a vygeneruje *.gen.jsx, kde je base64
 *      nahradený absolútnou URL na Shoptet upload (IMG_BASE).
 *   3) index.jsx importuje *.gen.jsx → esbuild bundluje ľahké verzie.
 *
 * Obrázky z  assets/img/truck/  treba NAHRAŤ do Shoptet správcu súborov (.cz)
 * pod cestu  assets/config/  (priamo, bez podpriečinka). /assets/ NIE je na webe
 * dostupné (overené: 404), preto Shoptet upload (/user/documents/upload/...).
 *
 * Spustenie:  node truck/build-truck-images.mjs   (alebo yarn truck:images)
 * Beží automaticky v `yarn build:once` / `yarn build` pred esbuildom.
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));            // truck/
const REPO = join(ROOT, "..");
const TK = join(REPO, "assets", "js", "truck-konfigurator");
const OUT_IMG = join(REPO, "assets", "img", "truck");

// Súbory sú nahraté vo file manageri .CZ shopu (manager nie je zdieľaný
// medzi .sk/.cz). Servírujeme ich cez cdn.myshoptet.com, ktorá posiela
// `access-control-allow-origin: *` — obrázky sa zobrazia na .sk aj .cz
// A canvas tinting nášiviek (crossOrigin="anonymous") neprejde na CORS.
// Priama www.luxurycardesign.cz URL ACAO hlavičku NEposiela — nepoužívať.
const IMG_BASE = "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/documents/upload/assets/config/";

const { MENSIE, MENSIE_ZAKLAD } = await import(pathToFileURL(join(REPO, "assets/js/components/konfigurator1v/kamion/obrazky.js")).href);

const SOURCES = [
  { in: join(TK, "konfigurator.jsx"),       out: join(TK, "konfigurator.gen.jsx") },
  { in: join(TK, "konfigurator.phone.jsx"), out: join(TK, "konfigurator.phone.gen.jsx") },
];

const EXT = { jpeg: "jpg", jpg: "jpg", png: "png", webp: "webp", gif: "gif", "svg+xml": "svg" };
// len base64 data URI (inline svg+xml;utf8 necháme tak)
const DATA_RE = /data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})/g;

mkdirSync(OUT_IMG, { recursive: true });

const seen = new Map();   // sha1 -> filename
let totalRefs = 0;
let bytesDecoded = 0;
let bytesBase64 = 0;

for (const src of SOURCES) {
  let text = readFileSync(src.in, "utf8");
  text = text.replace(DATA_RE, (full, mime, b64) => {
    totalRefs++;
    bytesBase64 += full.length;
    const hash = createHash("sha1").update(b64).digest("hex").slice(0, 16);
    let name = seen.get(hash);
    if (!name) {
      const ext = EXT[mime.toLowerCase()] || "bin";
      name = `t${hash}.${ext}`;
      const file = join(OUT_IMG, name);
      if (!existsSync(file)) {
        const buf = Buffer.from(b64, "base64");
        writeFileSync(file, buf);
        bytesDecoded += buf.length;
      }
      seen.set(hash, name);
    }
    return IMG_BASE + name;
  });
  // zrýchlenie 25. 10. 2026: nepriehľadné PNG, ktoré už majú menší JPEG v repe (tools/kamion-obrazky.mjs ->
  // kamion/obrazky.js, tie isté súbory ako nový konfigurátor 1V), sa berú odtiaľ; CDN repa posiela tiež ACAO *
  text = text.split(IMG_BASE).map((kus, i) => {
    if (!i) return kus;
    const m = /^(t[0-9a-f]{16}\.png)/.exec(kus);
    return m && MENSIE[m[1]] ? MENSIE_ZAKLAD + MENSIE[m[1]] + kus.slice(m[1].length) : IMG_BASE + kus;
  }).join("");
  writeFileSync(src.out, text, "utf8");
  console.log(`[truck-img] ${src.in.replace(REPO + "/", "")} -> ${src.out.replace(REPO + "/", "")} (${(text.length / 1024).toFixed(0)} KB)`);
}

const onDisk = readdirSync(OUT_IMG).filter((f) => f.startsWith("t")).length;
console.log(
  `[truck-img] ${totalRefs} referencií, ${seen.size} unikátnych obrázkov (${onDisk} na disku v assets/img/truck/), ` +
  `~${(bytesBase64 / 1048576).toFixed(1)} MB base64 von z bundla, ${(bytesDecoded / 1048576).toFixed(1)} MB dekódovaných.`,
);
console.log("[truck-img] HOTOVO. Obrázky sa servírujú z cdn.myshoptet.com (upload .cz, CORS OK).");
