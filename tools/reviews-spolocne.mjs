// CI krok (production.yml, len vetva main): dáta recenzií aj na SPOLOČNÚ adresu assets/data/reviews-data.js,
// ktorú číta web (functions/lcdRecenzieData.js, ?h= po 6 h) — nové recenzie sa tak dostanú na web bez prepínania verzie v admine.
// Kopíruje LEN keď je assets/js/reviews-data.js novší (place.fetchedAt) než súbor, ktorý už je na CDN,
// alebo má rovnaký fetchedAt, ale iný obsah (oprava dát, napr. reviews-update znova po neúspešnom stiahnutí fotiek).
// Starší commit / iná vetva nesmie prepísať novšie dáta (pozri reference_lcd_cdn_prepis_z_inej_vetvy).
// Nikdy nezhodí build (exit 0 vždy); pri pochybnosti nekopíruje.
//   test: node tools/test-reviews-spolocne.mjs   (falošný CDN na 127.0.0.1, LCD_REVIEWS_ZIVE)
import { readFile, writeFile, mkdir } from "node:fs/promises";

const ZDROJ = "assets/js/reviews-data.js", CIEL_DIR = "assets/data", CIEL = CIEL_DIR + "/reviews-data.js";
const ZIVE = process.env.LCD_REVIEWS_ZIVE ||
  "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/data/reviews-data.js";

const fetchedAt = (txt) => { const m = /"fetchedAt"\s*:\s*"([^"]+)"/.exec(txt || ""); return m ? Date.parse(m[1]) : NaN; };
const pocet = (txt) => { const m = /"totalReviews"\s*:\s*(\d+)/.exec(txt || ""); return m ? Number(m[1]) : NaN; };
const obsah = (txt) => String(txt || "").replace(/\r\n/g, "\n").trim();

try {
  const lokal = await readFile(ZDROJ, "utf8");
  const tLok = fetchedAt(lokal);
  if (!(tLok > 0) || !(pocet(lokal) > 0)) { console.log("recenzie: lokálne dáta bez fetchedAt/totalReviews — nekopírujem"); process.exit(0); }
  let tZive = NaN, stav = "", zive = "";
  try {
    const res = await fetch(ZIVE + "?t=" + Date.now(), { signal: AbortSignal.timeout(15000) }); // ?t= obíde kešu CDN
    stav = String(res.status);
    if (res.ok) { zive = await res.text(); tZive = fetchedAt(zive); }
    else if (res.status !== 404) { console.log("recenzie: CDN vrátil " + res.status + " — nekopírujem"); process.exit(0); }
  } catch (e) { console.log("recenzie: CDN nedostupný (" + e.message + ") — nekopírujem"); process.exit(0); }
  if (tZive > tLok) { console.log(`recenzie: na CDN sú novšie dáta (${new Date(tZive).toISOString()}) — bez zmeny`); process.exit(0); }
  if (tZive === tLok && obsah(zive) === obsah(lokal)) { console.log(`recenzie: na CDN sú rovnaké dáta (${new Date(tZive).toISOString()}) — bez zmeny`); process.exit(0); }
  const preco = tZive === tLok ? "rovnaký fetchedAt, iný obsah (oprava dát)" : "novšie dáta";
  await mkdir(CIEL_DIR, { recursive: true });
  await writeFile(CIEL, lokal, "utf8");
  console.log(`recenzie: ${CIEL} <- ${ZDROJ} — ${preco} (fetchedAt ${new Date(tLok).toISOString()}, ${pocet(lokal)} recenzií; CDN ${stav}${tZive > 0 ? " " + new Date(tZive).toISOString() : ""})`);
} catch (e) {
  console.log("recenzie: chyba " + e.message + " — nekopírujem");
}
process.exit(0);
