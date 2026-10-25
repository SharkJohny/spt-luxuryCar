#!/usr/bin/env node
/* kamion-obrazky.mjs — menšie obrázky konfigurátora kamiónov 1V (zrýchlenie 25. 10. 2026).

   Obrázky materiálov, lemovaní a nášiviek (kamion/data.js) ležia na Shoptet uploade (IMG_BASE) ako PNG 500×76 / 300×300
   po 60–110 kB, hoci sú nepriehľadné. Tento skript ich stiahne, nepriehľadné PNG prevedie na progresívny JPEG q85
   (vizuálne zhodné, ~6× menšie; JPEG zobrazí každé zariadenie, aj staré iPhony bez WebP) a uloží do
   assets/img/1v/kamion/<meno>.jpg. Rozmery sa NEMENIA (tie isté obrázky slúžia aj na zväčšený náhľad).
   Obrázok s priehľadnosťou alebo bez úspory aspoň 30 % ostáva pôvodný. Existujúci súbor sa nikdy neprepíše
   (assets/img je spoločné pre všetky verzie). Zoznam prevedených -> kamion/obrazky.js (data.js podľa neho mení adresu).

   Použitie:  node tools/kamion-obrazky.mjs          stiahne, prevedie, zapíše obrazky.js
              node tools/kamion-obrazky.mjs --check  nič nezapíše; exit 1, ak obrazky.js nesedí so súbormi na disku */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CIEL = join(KOREN, "assets/img/1v/kamion");
const MANIFEST = join(KOREN, "assets/js/components/konfigurator1v/kamion/obrazky.js");
const CHECK = process.argv.includes("--check");

const D = await import(pathToFileURL(join(KOREN, "assets/js/components/konfigurator1v/kamion/data.js")).href);
const subory = new Set(D.ZDROJ_OBRAZKOV); // data.js img() zapisuje každý pôvodný názov z IMG_BASE
const zoznam = [...subory].filter((f) => f && !/^https?:\/\//.test(f) && /\.png$/i.test(f)).sort();

const mapa = {};
let pred = 0, po = 0, nove = 0;
mkdirSync(CIEL, { recursive: true });
for (const f of zoznam) {
  const meno = f.replace(/\.png$/i, ".jpg"), cesta = join(CIEL, meno);
  if (existsSync(cesta)) { mapa[f] = "kamion/" + meno; continue; }
  if (CHECK) continue;
  const r = await fetch(D.IMG_BASE + f);
  if (!r.ok) { console.log("  CHYBA " + f + " -> " + r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  const st = await sharp(buf).stats();
  if (!st.isOpaque) { console.log("  priehľadný, ostáva PNG: " + f); continue; }
  const jpg = await sharp(buf).flatten({ background: "#ffffff" }).jpeg({ quality: 85, progressive: true, mozjpeg: true }).toBuffer();
  if (jpg.length > buf.length * 0.7) { console.log("  bez úspory, ostáva PNG: " + f); continue; }
  writeFileSync(cesta, jpg);
  mapa[f] = "kamion/" + meno; pred += buf.length; po += jpg.length; nove++;
}
const obsah = "// VYGENEROVANÉ: node tools/kamion-obrazky.mjs (needituj ručne). Nepriehľadné PNG z IMG_BASE -> JPEG q85 v assets/img/1v/\n" +
  "// (rovnaké rozmery). data.js: obrázok zo zoznamu sa berie z MENSIE_ZAKLAD + hodnota, ostatné ako doteraz z IMG_BASE.\n" +
  "/** = OBRAZKY_1V z ../ctx.js (spoločné obrázky repa assets/img/1v/, nie priečinok verzie) */\n" +
  'export const MENSIE_ZAKLAD = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";\n' +
  "export const MENSIE = " + JSON.stringify(mapa, null, 0).replace(/","/g, '",\n  "').replace(/^\{/, "{\n  ").replace(/\}$/, "\n}") + ";\n";
if (CHECK) {
  const ok = existsSync(MANIFEST) && readFileSync(MANIFEST, "utf8").replace(/\r\n/g, "\n") === obsah; // git na Windows môže dať CRLF
  console.log(ok ? "OK: obrazky.js sedí so súbormi" : "NESEDÍ: spusti node tools/kamion-obrazky.mjs");
  process.exit(ok ? 0 : 1);
}
writeFileSync(MANIFEST, obsah);
console.log(`PNG ${zoznam.length}, prevedené nové ${nove} (${Math.round(pred / 1024)} kB -> ${Math.round(po / 1024)} kB), v zozname ${Object.keys(mapa).length}`);
