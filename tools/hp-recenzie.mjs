#!/usr/bin/env node
// tools/hp-recenzie.mjs — sekcia „06 — Čo hovoria naši zákazníci“ na titulke SK aj CZ (admin-html/src/hp-telo-1.<sk|cz>.html,
// banner hp-telo-1) z aktuálnych dát recenzií assets/js/reviews-data.js. Michal 29. 10. 2026: číslo a karty z aktuálnych dát
// namiesto natvrdo „89 recenzií“ a relatívnych „Pred 8 týždňami“; CZ titulka má recenzie v PÔVODNOM jazyku ako na Googli.
//
//   node tools/hp-recenzie.mjs            prepíše blok recenzií v src SK aj CZ; potom node tools/build-admin-html.mjs (dist)
//   node tools/hp-recenzie.mjs --check    len porovná src s dátami (exit 1 = treba pregenerovať) — lokálne, NIE v CI
//                                          (dáta sa menia automatikou, admin HTML sa mení len ručným zápisom)
//
// Web bez prekrývania: admin HTML nesie aktuálny stav, functions/lcdHpRecenzie.js ho na webe len OŽIVÍ (počet z dát,
// recenzie novšie než HTML na začiatok pásu). Preto generátor značí:
//   section[data-lcd-rec]     data-lcd-rec-max  = najvyššie číslo id (g-N) v dátach — novšie recenzie majú vyššie id
//                             data-lcd-rec-prvy = id prvej karty (pred ňu JS vkladá novšie)
//                             data-lcd-rec-stav = deň stiahnutia dát (place.fetchedAt) — FUNKČNÝ, nemazať: lcdHpRecenzie.js podľa neho
//                             ignoruje staršie dáta (napr. zálohu 89 z bundla), inak by prepísali počet na titulke
//   article.rev[data-lcd-rec-id]
// Karty: 3 najnovšie s textom ≥ 40 znakov + Michalov výber (data-p1v-vyber zo sekcie 1V 598, tá istá dvanástka), spolu 12;
// výber, skrátenie textu a dátum „mesiac rok“ = functions/lcdRecenzie.js (to isté ako 1V produkty a oživenie titulky).
// Mení len obsah medzi značkami <!-- ===… RECENZIE …=== --> a <!-- ===… DO KUFRA …=== -->: hlavička (nadpis, tlačidlá,
// šípky) ostáva, prepíše sa len skóre, riadok počtu, atribúty data-lcd-rec* a karty v #revs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R = await import(pathToFileURL(path.join(REPO, "assets/js/functions/lcdRecenzie.js")).href);
const DATA = path.join(REPO, "assets/js/reviews-data.js");
const VYBER_ZDROJ = path.join(REPO, "admin-html/src/p1v-598/10-a-recenzie.sk.html");
const NAHLADY = path.join(REPO, "assets/img/reviews/m");
const NA_TITULKE = 12;
const kontrola = process.argv.includes("--check");

const chyba = (m) => { console.error("✗ hp-recenzie: " + m); process.exit(1); };

// ------------------------------------------------------------------ dáta
const raw = fs.readFileSync(DATA, "utf8");
const m = raw.slice(raw.indexOf("window.LCD_REVIEWS")).match(/window\.LCD_REVIEWS\s*=\s*([\s\S]*?);\s*$/);
if (!m) chyba("nemôžem parsovať " + path.relative(REPO, DATA));
const data = JSON.parse(m[1]);
const P = data.place || {};
if (!(Number(P.rating) > 0) || !(Number(P.totalReviews) > 0) || !Array.isArray(data.reviews) || !data.reviews.length) chyba("dáta bez hodnotenia/počtu/recenzií");
const vyberM = /data-p1v-vyber="([^"]*)"/.exec(fs.readFileSync(VYBER_ZDROJ, "utf8"));
if (!vyberM) chyba("chýba data-p1v-vyber v " + path.relative(REPO, VYBER_ZDROJ));
const vyber = R.menaVyberu(vyberM[1]);
const chybajuVyber = vyber.filter((meno) => !R.dobraRecenzia(data.reviews.find((r) => r.author === meno)));
const karty = R.zoradRecenzie(data.reviews, vyber, { fetchedAt: P.fetchedAt }).slice(0, NA_TITULKE);
if (karty.length < 6) chyba("málo kariet (" + karty.length + ")");
const maxId = Math.max(0, ...data.reviews.map(R.cisloId));
const stav = String(P.fetchedAt || "").slice(0, 10);

// ------------------------------------------------------------------ HTML
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const upozornenia = [];
function fotka(plna) {
  const nahlad = R.nahladRecenzie(plna);
  if (nahlad !== plna && fs.existsSync(path.join(NAHLADY, nahlad.split("/").pop()))) return nahlad;
  if (nahlad !== plna) upozornenia.push("chýba náhľad " + nahlad.split("/").pop() + " (python tools/recenzie-nahlady.py) — plná fotka");
  return plna;
}
function kartaHtml(r, g, web) {
  const hv = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
  const foto = R.fotkyKarty(r);
  const datum = R.datumRecenzie(r, P.fetchedAt, web) || (web === "cz" ? "Ověřený zákazník" : "Overený zákazník");
  return [
    `        <article class="rev" data-lcd-rec-id="${esc(r.id)}">`,
    `          <span class="qm" aria-hidden="true">“</span>`,
    `          <div class="st">${"★".repeat(hv)}</div>`,
    `          <p>${esc(R.textRecenzie(r.text))}</p>`,
    ...(foto.length ? [`          <div class="shots">${foto.map((u) => `<img decoding="async" src="${esc(fotka(u))}" alt="" loading="lazy" width="168" height="168">`).join("")}</div>`] : []),
    `          <div class="foot"><span class="av" aria-hidden="true">${esc(R.iniciala(r.author))}</span><span class="meta"><b>${esc(String(r.author || "").trim())}</b><i>${esc(datum)}</i></span>${g}</div>`,
    `        </article>`,
  ].join("\n");
}

const ZAC = /<!-- =+ RECENZIE =+ -->/, KON = /<!-- =+ DO KUFRA =+ -->/;
function prestav(html, web) {
  const z = ZAC.exec(html), k = KON.exec(html);
  if (!z || !k || k.index < z.index) chyba(`hp-telo-1.${web}.html: chýbajú značky RECENZIE / DO KUFRA`);
  let blok = html.slice(z.index, k.index);
  // section: zachovať triedu a štýl, data-lcd-rec* nanovo
  blok = blok.replace(/<section\b([^>]*)>/, (_, attr) => {
    const zvysok = attr.replace(/\s+data-lcd-rec(?:-[a-z]+)?="[^"]*"/g, "");
    return `<section${zvysok} data-lcd-rec="hp" data-lcd-rec-max="${maxId}" data-lcd-rec-prvy="${esc(karty[0].id)}" data-lcd-rec-stav="${stav}">`;
  });
  const g = (/<svg class="gmark"([\s\S]*?<\/svg>)/.exec(blok) || [])[1];
  if (!g) chyba(`hp-telo-1.${web}.html: chýba ikona .gmark v hlavičke recenzií`);
  const ikona = "<svg" + g;
  let n = 0;
  blok = blok.replace(/(<span class="score">)[^<]*(<\/span>)/, (_, a, b) => { n++; return a + R.cislo1(P.rating) + b; });
  blok = blok.replace(/(<span class="sub">)[^<]*(<\/span>)/, (_, a, b) => { n++; return a + esc(R.riadokPoctu(Math.round(Number(P.totalReviews)), P.rating, web)) + b; });
  blok = blok.replace(/(<div class="revs" id="revs">)[\s\S]*?(\n\s*<\/div>\s*<div class="revnav">)/, (_, a, b) => { n++; return a + "\n" + karty.map((r) => kartaHtml(r, ikona, web)).join("\n") + b; });
  if (n !== 3) chyba(`hp-telo-1.${web}.html: nenašiel som .score / .sub / #revs (${n}/3)`);
  return html.slice(0, z.index) + blok + html.slice(k.index);
}

let zle = 0;
for (const web of ["sk", "cz"]) {
  const subor = path.join(REPO, "admin-html/src/hp-telo-1." + web + ".html");
  const stare = fs.readFileSync(subor, "utf8").replace(/\r\n/g, "\n");
  const nove = prestav(stare, web);
  const meno = path.relative(REPO, subor).replace(/\\/g, "/");
  if (kontrola) {
    if (nove !== stare) { zle++; console.log(`✗ ${meno}: nesedí s dátami (${P.totalReviews} recenzií, ${stav}) — spusti node tools/hp-recenzie.mjs`); }
    else console.log(`✓ ${meno}: sedí s dátami`);
  } else if (nove !== stare) {
    fs.writeFileSync(subor, nove, "utf8");
    console.log(`zapísané ${meno}`);
  } else console.log(`${meno}: bez zmeny`);
}
console.log(`dáta ${stav}: ${P.totalReviews} recenzií, hodnotenie ${R.cislo1(P.rating)}, max id g-${maxId}; karty: ` +
  karty.map((r, i) => `${i + 1}. ${r.author} (${R.datumRecenzie(r, P.fetchedAt, "sk") || "?"})`).join(", "));
if (chybajuVyber.length) console.log("! z výberu chýba (nie je v dátach alebo text < 40 znakov): " + chybajuVyber.join(", "));
[...new Set(upozornenia)].forEach((u) => console.log("! " + u));
if (!kontrola) console.log("ďalej: node tools/build-admin-html.mjs (dist pre admin)");
process.exit(zle ? 1 : 0);
