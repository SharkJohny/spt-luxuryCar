// CI krok (production.yml, len vetva main): dáta recenzií aj na SPOLOČNÚ adresu assets/data/reviews-data.js,
// ktorú číta main.js (googleReviews, ?h= po 6 h) — nové recenzie sa tak dostanú na web bez prepínania verzie v admine.
// Kopíruje LEN keď je assets/js/reviews-data.js novší (place.fetchedAt) než súbor, ktorý už je na CDN:
// starší commit / iná vetva nesmie prepísať novšie dáta (pozri reference_lcd_cdn_prepis_z_inej_vetvy).
// Nikdy nezhodí build (exit 0 vždy); pri pochybnosti nekopíruje.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const ZDROJ = "assets/js/reviews-data.js", CIEL_DIR = "assets/data", CIEL = CIEL_DIR + "/reviews-data.js";
const ZIVE = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/data/reviews-data.js";

const fetchedAt = (txt) => { const m = /"fetchedAt"\s*:\s*"([^"]+)"/.exec(txt || ""); return m ? Date.parse(m[1]) : NaN; };
const pocet = (txt) => { const m = /"totalReviews"\s*:\s*(\d+)/.exec(txt || ""); return m ? Number(m[1]) : NaN; };

try {
  const lokal = await readFile(ZDROJ, "utf8");
  const tLok = fetchedAt(lokal);
  if (!(tLok > 0) || !(pocet(lokal) > 0)) { console.log("recenzie: lokálne dáta bez fetchedAt/totalReviews — nekopírujem"); process.exit(0); }
  let tZive = NaN, stav = "";
  try {
    const res = await fetch(ZIVE + "?t=" + Date.now(), { signal: AbortSignal.timeout(15000) }); // ?t= obíde kešu CDN
    stav = String(res.status);
    if (res.ok) tZive = fetchedAt(await res.text());
    else if (res.status !== 404) { console.log("recenzie: CDN vrátil " + res.status + " — nekopírujem"); process.exit(0); }
  } catch (e) { console.log("recenzie: CDN nedostupný (" + e.message + ") — nekopírujem"); process.exit(0); }
  if (tZive > 0 && tZive >= tLok) { console.log(`recenzie: na CDN sú rovnaké/novšie dáta (${new Date(tZive).toISOString()}) — bez zmeny`); process.exit(0); }
  await mkdir(CIEL_DIR, { recursive: true });
  await writeFile(CIEL, lokal, "utf8");
  console.log(`recenzie: ${CIEL} <- ${ZDROJ} (fetchedAt ${new Date(tLok).toISOString()}, ${pocet(lokal)} recenzií; CDN ${stav}${tZive > 0 ? " " + new Date(tZive).toISOString() : ""})`);
} catch (e) {
  console.log("recenzie: chyba " + e.message + " — nekopírujem");
}
process.exit(0);
