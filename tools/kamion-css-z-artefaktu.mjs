#!/usr/bin/env node
// Jednorazový prevod CSS schváleného artefaktu kamiony-app do assets/css/_lcd1v-kamiony.scss (docs/kamiony-1v-plan.md §3.4).
//
//   node tools/kamion-css-z-artefaktu.mjs --styl <kamiony-app>/data/styl-1v.css --extra <kamiony-app>/work/app-extra.css \
//        [--vystup assets/css/_lcd1v-kamiony.scss]
//
// Čo robí:
//   - @container k (…) -> @media (…), cqi -> vw (artefakt meral šírku stránky; na webe je to šírka okna),
//   - :root (tokeny --k-*) -> body.lcd-1v[data-lcd1v-typ="kamion"], .k-stranka / .k-info -> koreň #lcd1v-kamion,
//     každý ďalší selektor dostane predponu body.lcd-1v[data-lcd1v-typ="kamion"] #lcd1v-kamion (id: prebije Shoptet
//     aj spoločné 1V pravidlá s #product-detail-form),
//   - zahodí @import, html/body/[hidden] bez triedy, pás ukážky (.uk-*), poznámky (.pn*), simulovanú hlavičku
//     (.web-*), galériu artefaktu (.k-galeria*, .k-nahlad / .k-nahlady, .k-gal-*), ukážku košíka (.dk*), obsah pod
//     konfigurátorom (.k-obsah, .k-kap*, .k-end*, …), lištu artefaktu (.k-lista* — na webe je #lcd1v-lista z 1V) a
//     každý selektor s triedou, ktorú konfigurator1v/kamion/*.js nevyrába,
//   - @keyframes nechá len tie, ktoré niečo používa.
// Výstup sa commitne a ďalej sa upravuje ručne (blok „RUČNE“ na konci súboru sa pri novom prevode zachová).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TYP = 'body.lcd-1v[data-lcd1v-typ="kamion"]';
const KOR = TYP + " #lcd1v-kamion";
const ZNACKA_RUCNE = "/* ===== RUČNE (zachová sa pri novom prevode) ===== */";

function arg(meno, predvolene) {
  const i = process.argv.indexOf(meno);
  return i > -1 ? process.argv[i + 1] : predvolene;
}

// ------------------------------------------------------------------ triedy, ktoré vyrába JS konfigurátora
function triedyJs() {
  const dir = join(KOREN, "assets", "js", "components", "konfigurator1v", "kamion");
  const t = ["ui.js", "index.js"].map((f) => readFileSync(join(dir, f), "utf8")).join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1");
  const set = new Set();
  // všetky slová s pomlčkami / dvojitým podčiarknikom v kóde (triedy aj stavy " is-on"; radšej viac než menej)
  (t.match(/[a-z][a-z0-9]*(?:(?:--|-|__)[a-z0-9]+)*/gi) || []).forEach((x) => set.add(x));
  return set;
}

const ZAHOD = [/^uk-/, /^pn/, /^web-/, /^k-galeria/, /^k-nahlad$/, /^k-nahlady$/, /^k-gal-/, /^dk/, /^k-obsah$/, /^k-kap/, /^k-end/, /^k-lista/, /^nahlad/, /^je-tel$/, /^bez-pozn$/, /^seo/, /^k-produkt$/];

// ------------------------------------------------------------------ jednoduchý CSS parser (komentáre, reťazce, bloky)
function koniecKomentara(s, i) { const k = s.indexOf("*/", i + 2); return k < 0 ? s.length : k + 2; }
function blok(s, i) { // s[i] === "{" -> index za zodpovedajúcou "}"
  let h = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "/" && s[j + 1] === "*") { j = koniecKomentara(s, j) - 1; continue; }
    if (c === '"' || c === "'") { const k = s.indexOf(c, j + 1); j = k < 0 ? s.length : k; continue; }
    if (c === "{") h++;
    else if (c === "}") { h--; if (!h) return j + 1; }
  }
  return s.length;
}
/** Index „;“ mimo reťazcov a zátvoriek (@import url("…;…");) alebo -1. */
function bodkociarka(s, i) {
  let h = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '"' || c === "'") { const k = s.indexOf(c, j + 1); j = k < 0 ? s.length : k; continue; }
    if (c === "(") h++;
    else if (c === ")") h--;
    else if (c === "{" && !h) return -1;
    else if (c === ";" && !h) return j;
  }
  return -1;
}
/** [{ typ: "komentar"|"pravidlo"|"at", prelud, telo }] */
function rozober(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    if (s[i] === "/" && s[i + 1] === "*") { const k = koniecKomentara(s, i); out.push({ typ: "komentar", text: s.slice(i, k) }); i = k; continue; }
    const z = s.indexOf("{", i), b = s[i] === "@" ? bodkociarka(s, i) : -1;
    if (b > -1 && (z < 0 || b < z)) { out.push({ typ: "at;", text: s.slice(i, b + 1) }); i = b + 1; continue; }
    if (z < 0) break;
    const k = blok(s, z);
    const prelud = s.slice(i, z).trim(), telo = s.slice(z + 1, k - 1);
    out.push({ typ: prelud[0] === "@" ? "at" : "pravidlo", prelud, telo });
    i = k;
  }
  return out;
}
function rozdelSelektory(p) {
  const out = []; let h = 0, z = 0;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "(" || c === "[") h++;
    else if (c === ")" || c === "]") h--;
    else if (c === "," && !h) { out.push(p.slice(z, i).trim()); z = i + 1; }
  }
  out.push(p.slice(z).trim());
  return out.filter(Boolean);
}

const bezKom = (t) => t.replace(/\/\*[\s\S]*?\*\//g, " ");

function prepisSelektor(sel, triedy) {
  const s = sel.replace(/\s+/g, " ").trim();
  if (/^:root\b/.test(s)) return TYP + s.slice(5);
  if (/^\.k-stranka\b/.test(s)) {
    const ine = (s.slice(10).match(/\.([a-zA-Z][\w-]*)/g) || []).map((x) => x.slice(1));
    return ine.some((t) => !triedy.has(t) || ZAHOD.some((r) => r.test(t))) ? null : KOR + s.slice(10);
  }
  const tr = (s.match(/\.([a-zA-Z][\w-]*)/g) || []).map((x) => x.slice(1));
  if (!tr.length) return null; // html, body, [hidden] … bez triedy
  if (tr.some((t) => ZAHOD.some((r) => r.test(t)))) return null;
  if (tr.some((t) => !triedy.has(t))) return null;
  if (/^\.k-info\b/.test(s)) return KOR + ".k-info" + s.slice(7);
  return KOR + " " + s;
}

function preved(uzly, triedy, stat) {
  const out = [];
  uzly.forEach((u) => {
    if (u.typ === "komentar") return; // komentáre artefaktu nie (veľkosť luxuryCar.css; zdroj je v artefakte)
    if (u.typ === "at;") { stat.zahodene++; return; } // @import
    if (u.typ === "at") {
      let p = u.prelud;
      if (/^@keyframes/.test(p)) { out.push({ kf: p.replace(/^@keyframes\s+/, "").trim(), text: p + " {" + bezKom(u.telo).replace(/\s+/g, " ") + "}" }); return; }
      if (/^@font-face/.test(p)) { stat.zahodene++; return; }
      p = p.replace(/^@container\s+k\s+/, "@media ").replace(/(\d*\.?\d+)cqi\b/g, "$1vw");
      const vnutro = preved(rozober(u.telo), triedy, stat).filter((x) => typeof x === "string" && !/^\/\*/.test(x));
      if (vnutro.length) out.push(p + " {\n" + vnutro.map((x) => "  " + x.replace(/\n/g, "\n  ")).join("\n") + "\n}");
      return;
    }
    const sel = rozdelSelektory(u.prelud).map((x) => prepisSelektor(x, triedy)).filter(Boolean);
    if (!sel.length) { stat.zahodene++; return; }
    stat.pravidla++;
    const telo = bezKom(u.telo).trim().replace(/(\d*\.?\d+)cqi\b/g, "$1vw");
    out.push(sel.join(",\n") + " { " + telo.replace(/\s+/g, " ") + " }");
  });
  return out;
}

function main() {
  const styl = arg("--styl"), extra = arg("--extra");
  if (!styl || !extra) { console.error("použitie: --styl <styl-1v.css> --extra <app-extra.css> [--vystup <subor>]"); process.exit(2); }
  const vystup = resolve(KOREN, arg("--vystup", "assets/css/_lcd1v-kamiony.scss"));
  const triedy = triedyJs();
  const stat = { pravidla: 0, zahodene: 0 };
  const css = readFileSync(styl, "utf8") + "\n" + readFileSync(extra, "utf8");
  const uzly = preved(rozober(css), triedy, stat);
  // @keyframes len použité
  const pravidlaTxt = uzly.filter((x) => typeof x === "string").join("\n");
  const casti = uzly.map((x) => (typeof x === "string" ? x : new RegExp("\\b" + x.kf + "\\b").test(pravidlaTxt) ? x.text : null)).filter(Boolean)
    // komentáre bez pravidla za nimi (zahodené sekcie) preč
    .filter((x, i, a) => !/^\/\*/.test(x) || (a[i + 1] && !/^\/\*/.test(a[i + 1])));
  const rucne = existsSync(vystup) && readFileSync(vystup, "utf8").includes(ZNACKA_RUCNE) ? readFileSync(vystup, "utf8").split(ZNACKA_RUCNE)[1] : "\n";
  const hlavicka = `/* LCD-1V-KAMIONY — konfigurátor kamiónov a dodávok SK 640 (modul konfigurator1v/kamion/, docs/kamiony-1v-plan.md §3.4).
   Čisté CSS (nekompiluje sa Sassom; tools/vloz-lcd-css.py ho vkladá do luxuryCar.css bajt po bajte).
   KAŽDÝ selektor začína ${TYP} (flag vypnutý = nulová zmena); tokeny --k-* sú na tomto selektore.
   Časť nad „RUČNE“ je VYGENEROVANÁ: node tools/kamion-css-z-artefaktu.mjs --styl <kamiony-app>/data/styl-1v.css
   --extra <kamiony-app>/work/app-extra.css (schválený artefakt; @container k -> @media, cqi -> vw, len triedy z kamion/*.js).
   Lepivá lišta je #lcd1v-lista z 1V (_lcd1v-cena.scss); tu len doplnky v časti RUČNE. */
`;
  writeFileSync(vystup, hlavicka + "\n" + casti.join("\n") + "\n\n" + ZNACKA_RUCNE + rucne.replace(/^\n?/, "\n"));
  const n = readFileSync(vystup, "utf8").length;
  console.log("zapísané " + vystup + ": " + stat.pravidla + " pravidiel, zahodených " + stat.zahodene + ", " + n + " znakov");
}
main();
