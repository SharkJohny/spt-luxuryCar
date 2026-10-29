// Zlúči čerstvý scrape Googlu (tools/google-reviews-fresh.json zo scrape-google-reviews.mjs) do dát webu
// assets/js/reviews-data.js a fotky NOVÝCH recenzií uloží na CDN cestu assets/img/reviews/rg-<n>-<i>.jpg.
//
//   node tools/reviews-update.mjs            # zapíše reviews-data.js (+ nové fotky), vypíše súhrn
//   node tools/reviews-update.mjs --skus     # len súhrn, nič nezapíše
//   potom: python tools/recenzie-nahlady.py  # náhľady 168 px pre nové fotky (existujúce nikdy neprepíše)
//
// Pravidlá (29. 10. 2026):
//  - Známa recenzia (rovnaký autor) si nechá id g-N aj self-hostované fotky (rg-N-I.jpg sa nikdy neprepisujú) —
//    výber recenzií v admine (data-p1v-vyber) ide podľa mena autora, preto meno ostáva aj tvar id.
//  - Dátum: Google ukazuje len „pred X“. Každá recenzia dostane raz ukotvený približný dátum dateApprox
//    (poradie: už uložený > dátum na začiatku textu „12. 5. 2023“ > staré „Pred N týždňami“ k starému fetchedAt >
//    čerstvé „pred X“ k dnešku). relativeDate sa potom prepočíta na „Pred N týždňami“ k novému fetchedAt — presne tvar,
//    z ktorého obsah-a.js aj lcd-reviews.js robia „mesiac rok“ (bez zmeny ich kódu). date ostáva null (nie je presný deň).
//  - Recenzia, ktorá na Googli už nie je, z dát vypadne — len ak je scrape úplný (≥ 95 % počtu profilu)
//    a nie je nastavené LCD_REVIEWS_NEVYHADZUJ=1 (automatika vyhodí recenziu až po potvrdení ďalší deň).
//  - Poistky: neúplný alebo podozrivý scrape -> exit 2, reviews-data.js sa nezmení (web ukazuje posledné dobré dáta).
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";

const DATA = "assets/js/reviews-data.js", FRESH = "tools/google-reviews-fresh.json", IMG = "assets/img/reviews";
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/reviews/";
const skus = process.argv.includes("--skus");
const DEN = 864e5, TYZDEN = 7 * DEN;
const koniec = (msg) => { console.error("!! " + msg + " — reviews-data.js NEZMENENÝ"); process.exit(2); };

// ---------------------------------------------------------------- vstupy
const raw = await readFile(DATA, "utf8");
const idx = raw.indexOf("window.LCD_REVIEWS");
const m = raw.slice(idx).match(/window\.LCD_REVIEWS\s*=\s*([\s\S]*?);\s*$/);
if (!m) koniec("nemôžem parsovať " + DATA);
const stare = JSON.parse(m[1]);
let fresh;
try { fresh = JSON.parse(await readFile(FRESH, "utf8")); } catch (e) { koniec("chýba " + FRESH + " (najprv node tools/scrape-google-reviews.mjs)"); }
if (Array.isArray(fresh)) koniec(FRESH + " je starý formát (len fotky) — spusti nový scrape-google-reviews.mjs");
const P = fresh.place || {};
if (!(P.rating >= 1 && P.rating <= 5) || !(P.totalReviews > 0) || !Array.isArray(fresh.reviews) || !fresh.reviews.length) koniec("scrape bez hodnotenia/počtu/recenzií");
if (fresh.reviews.length < P.totalReviews * 0.9) koniec(`scrape neúplný: ${fresh.reviews.length} z ${P.totalReviews}`);
if (P.totalReviews < stare.place.totalReviews * 0.9) koniec(`počet recenzií klesol ${stare.place.totalReviews} -> ${P.totalReviews} (> 10 %), over ručne`);
const teraz = Date.parse(P.fetchedAt) || Date.now();
const stareFetched = Date.parse(stare.place.fetchedAt);

// ---------------------------------------------------------------- dátumy
const iso = (t) => new Date(t).toISOString().slice(0, 10);
function zTextu(text) { // „12. 5. 2023 …“ (prilepené zo zobrazenia majiteľa)
  const d = /^\s*(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})/.exec(String(text || ""));
  return d ? Date.UTC(+d[3], +d[2] - 1, +d[1]) : NaN;
}
function zTyzdnov(rel, zaklad) { // „Pred 8 týždňami“
  const d = /(\d+)\s*týž/i.exec(String(rel || ""));
  return d && zaklad > 0 ? zaklad - Number(d[1]) * TYZDEN : NaN;
}
/** „pred 3 mesiacmi“, „před rokem“, „a week ago“, „Upravené: pred 2 týždňami“ … -> čas (stred intervalu); inak NaN */
function zGooglu(rel, zaklad) {
  const s = String(rel || "").toLowerCase().trim();
  if (!s) return NaN;
  if (/(dnes|today|hodin|minút|minut|hour|minute)/.test(s)) return zaklad;
  if (/včera|yesterday/.test(s)) return zaklad - DEN;
  const n = (() => { const c = /(\d+)/.exec(s); return c ? Number(c[1]) : 1; })(); // „pred mesiacom“ = 1
  if (/d[nň]|den|day/.test(s) && !/týž|týd|week/.test(s)) return zaklad - n * DEN;
  if (/týž|týd|week/.test(s)) return zaklad - n * TYZDEN;
  if (/mesia|měsí|month/.test(s)) return zaklad - n * 30.44 * DEN;
  if (/rok|let|year/.test(s)) return zaklad - n * 365.25 * DEN;
  return NaN;
}
const pred = (t) => `Pred ${Math.max(0, Math.round((teraz - t) / TYZDEN))} týždňami`;
// starý text zo zobrazenia majiteľa: „14. 8. 2023 … Luxury Car Design Vlastník 23. 8. 2023 Ďakujeme … Upraviť Odstrániť“
const cistyText = (t) => String(t || "").replace(/\s*Luxury Car Design\s+Vlastník\b[\s\S]*$/i, "").replace(/^\s*\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\s*/, "").trim();

// ---------------------------------------------------------------- párovanie
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const freshPodlaAutora = new Map();
for (const f of fresh.reviews) { const k = norm(f.author); if (k && !freshPodlaAutora.has(k)) freshPodlaAutora.set(k, f); }
const pouzite = new Set();
const jazyk = (t) => (/[řěů]/i.test(t || "") ? "cz" : "sk");
// LCD_REVIEWS_NEVYHADZUJ=1: nikoho nevyhadzovať (automatika recenzie-auto/beh.mjs, kým výpadok nepotvrdí aj ďalší deň)
const uplny = process.env.LCD_REVIEWS_NEVYHADZUJ !== "1" && fresh.reviews.length >= P.totalReviews * 0.95;

const vysledok = [], vypadli = [], nove = [];
for (const r of stare.reviews) {
  const f = (r.googleId && fresh.reviews.find((x) => x.googleId === r.googleId)) || freshPodlaAutora.get(norm(r.author));
  if (!f) { if (uplny) { vypadli.push(r.author); continue; } vysledok.push(r); continue; }
  pouzite.add(f);
  let t = Date.parse(r.dateApprox);
  if (!(t > 0)) t = zTextu(r.text);
  if (!(t > 0)) t = zTyzdnov(r.relativeDate, stareFetched);
  if (!(t > 0)) t = zGooglu(f.relativeDate, teraz);
  vysledok.push({
    ...r,
    googleId: f.googleId || r.googleId || null,
    rating: f.rating || r.rating,
    // čerstvý text je bez „Vlastník … Upraviť Odstrániť“; prázdny alebo skrátený čerstvý (len hviezdy / „…“) nechá pôvodný
    text: f.text && !f.textSkrateny ? f.text : cistyText(r.text),
    ownerResponse: f.ownerResponse || r.ownerResponse || null,
    dateApprox: t > 0 ? iso(t) : null,
    _foto: !(r.photos && r.photos.length) && f.photos && f.photos.length ? f.photos : null, // fotky pribudli neskôr
  });
}
let maxId = Math.max(0, ...stare.reviews.map((r) => Number(String(r.id).replace(/^g-/, "")) || 0));
for (const f of fresh.reviews.slice().reverse()) { // od najstaršej, nech novšia = vyššie id
  if (pouzite.has(f)) continue;
  const t = zGooglu(f.relativeDate, teraz);
  const r = {
    id: "g-" + ++maxId, author: f.author, authorPhoto: null, rating: f.rating, date: null, relativeDate: "",
    text: f.text || "", photos: [], url: stare.reviews[0] ? stare.reviews[0].url : "", language: jazyk(f.text),
    ownerResponse: f.ownerResponse || null, googleId: f.googleId || null, dateApprox: t > 0 ? iso(t) : null, _foto: f.photos && f.photos.length ? f.photos : null,
  };
  vysledok.push(r); nove.push(r);
}

// ---------------------------------------------------------------- fotky nových recenzií (self-host, nikdy neprepisuj)
const existuje = (p) => access(p).then(() => true, () => false);
let ok = 0, zle = 0;
if (!skus) await mkdir(IMG, { recursive: true });
for (const r of vysledok) {
  if (!r._foto) continue;
  const urls = [];
  for (let i = 0; i < r._foto.length; i++) {
    const meno = `r${r.id}-${i}.jpg`, ciel = path.join(IMG, meno);
    if (skus) { urls.push(CDN + meno); continue; }
    try {
      if (!(await existuje(ciel))) {
        const res = await fetch(r._foto[i], { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (!/image\//.test(res.headers.get("content-type") || "")) throw new Error("nie obrázok");
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 500) throw new Error("malý súbor");
        await writeFile(ciel, buf);
      }
      urls.push(CDN + meno); ok++;
    } catch (e) { zle++; console.log(`  fotka ${r.author} #${i}: ${e.message}`); }
  }
  r.photos = urls;
}
for (const r of vysledok) delete r._foto;

// ---------------------------------------------------------------- relatívny dátum k novému fetchedAt + poradie
for (const r of vysledok) r.relativeDate = r.dateApprox ? pred(Date.parse(r.dateApprox)) : (r.relativeDate && !/týž/i.test(r.relativeDate) ? r.relativeDate : "");
vysledok.sort((a, b) => (Date.parse(b.dateApprox) || 0) - (Date.parse(a.dateApprox) || 0));

const data = {
  place: { ...stare.place, rating: P.rating, totalReviews: P.totalReviews, fetchedAt: new Date(teraz).toISOString() },
  reviews: vysledok,
};
const mesiac = (r) => (r.dateApprox || "?").slice(0, 7);
console.log(`profil: ${stare.place.totalReviews} -> ${P.totalReviews} recenzií, hodnotenie ${stare.place.rating} -> ${P.rating}`);
console.log(`v dátach: ${stare.reviews.length} -> ${vysledok.length} | nové: ${nove.length} | vypadli z Googlu: ${vypadli.length}${vypadli.length ? " (" + vypadli.join(", ") + ")" : ""}`);
nove.forEach((r) => console.log(`  + ${r.id} ${r.author} | ${r.rating}★ | ~${mesiac(r)} | ${r.language} | fotky ${r.photos.length} | ${(r.text || "(bez textu)").slice(0, 70)}`));
console.log(`fotky nových: ok ${ok}, chyba ${zle} | najnovšia: ~${mesiac(vysledok[0])} ${vysledok[0] && vysledok[0].author}`);
if (skus) { console.log("--skus: nič nezapísané"); process.exit(0); }

const hlavicka = `/* ============================================================
   LCD Reviews — DÁTA (reálne Google recenzie)
   ------------------------------------------------------------
   Stiahnuté z Google profilu Luxury Car Design: ${iso(teraz)}
   ${P.totalReviews} recenzií na profile, hodnotenie ${String(P.rating).replace(".", ",")}; v súbore ${vysledok.length}.
   Generuje tools/reviews-update.mjs (zo scrape-google-reviews.mjs) — ručne needitovať.
   dateApprox = približný dátum (Google ukazuje len „pred X“), relativeDate je k place.fetchedAt.
   ============================================================ */
`;
await writeFile(DATA, hlavicka + "window.LCD_REVIEWS = " + JSON.stringify(data, null, 2) + ";\n", "utf8");
console.log("zapísané " + DATA);
