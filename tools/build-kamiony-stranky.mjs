#!/usr/bin/env node
// Stránky kamiónov pre Google (Michal 12. 11. 2026, kniha Brain napady/2026-11-12-kamiony-stranky-fotky-seo-exp.md §2.4
// body 4–6): Popis produktu každej stránky, Popis kategórie „Autokoberce do kamiónu“ a návrh odkazu v pätičke.
//
//   node tools/build-kamiony-stranky.mjs           -> admin-html/kamiony/*.html + manifest.json
//   node tools/build-kamiony-stranky.mjs --check   nič nezapíše; exit 1, keď niečo nesedí (nižšie)
//
// Číta LEN admin-html/kamiony/stranky.json (z a3/export-stranky-json.mjs v zložke kamiony/plan-2026-11-11) a
// admin-html/dist/p1v-kamiony-1|2.<jazyk>.html (obsah 640 / 2452). Január: posun roka = úprava stranky.json (roky.do,
// popisUvod) + nové spustenie. Zmena obsahu 640 (build-admin-html.mjs) = nové spustenie, inak --check zlyhá.
//
// Výstupy (zápis do adminu: a3/SPRAVA.md, oddiel „Popoludnie 12. 11.“):
//   <slug>.sk.html / <slug>.cz.html   Popis produktu stránky kamióna = kus 1 + kus 2 popisu 640 / 2452 BEZ ZMENY (obaly
//                                     #p1v-kamiony-1/-2 so všetkými atribútmi), vymenená je len sekcia
//                                     data-lcd-sekcia="kamiony-galeria": <h2> = popisNadpis, lede = popisUvod (veta so
//                                     všetkými ročníkmi), fotky stránky (značky ako src/p1v-kamiony/10-kamiony-galeria.*).
//                                     Na stránke kamióna obsah naštartuje rovnako ako na 640: produkty.js zaznamKopie ->
//                                     obsah "kamiony" -> obsah.js nájde korene [data-lcd-cast="p1v-kamiony-1|2"] v Popise.
//   kategoria-autokoberce-do-kamionu.<jazyk>.html   Popis kategórie: úvod, značky abecedne (len text, bez loga), pod
//                                     každou odkazy „<model> (<od>–<do>)“ s fotkou ťahača výrobcu 480/960 (stránka bez
//                                     ťahača = textová dlaždica), na konci „Nenašli ste svoj kamión?“ -> 640 / 2452.
//                                     Štýly v jednom <style> v úryvku, všetko pod .lcd-kam-zoznam (SCSS sa nemení).
//   paticka-kamiony.<jazyk>.html      návrh stĺpca pätičky (admin sa nemení): odkaz na kategóriu, značky (kotvy
//                                     v kategórii), „Nájsť môj kamión“ -> 640 / 2452.
//   manifest.json                     odtlačky dist kusov a stranky.json, z ktorých súbory vznikli.
//
// --check: všetky výstupy = to, čo by build zapísal (bajt po bajte); 40 Popisov, každý ≤ 45 000 znakov; sekcie mimo
// galérie, obaly aj celý kus 2 bajt po bajte rovnaké s dist; dist od posledného buildu nezmenený (manifest); každý
// obrázok z kamion-stranky/ existuje v assets/img/1v/kamion-stranky/; bez <h1>, <script>, on…=, logo značky, počtu modelov.
// Čakajúca stránka (stranky.json "caka": dôvod, 12. 11. večer – napr. DAF XG bez fotky celej sady): Popis sa nestavia,
// v kategórii ani v pätičke nie je (prvá várka vytvárania v admine ju vynechá); jej starý Popis v admin-html/kamiony/
// nesmie ostať (--check zlyhá).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "..");
const VYSTUP = join(KOREN, "admin-html", "kamiony");
const DIST = join(KOREN, "admin-html", "dist");
const IMG = join(KOREN, "assets", "img", "1v", "kamion-stranky");
const LIMIT = 45000;
const CHECK = process.argv.includes("--check");
const JAZYKY = ["sk", "cz"];
const ZNACKY = ["DAF", "MAN", "Mercedes-Benz", "Renault", "Scania", "Volvo"]; // abecedne (kniha 2.4 bod 6)

const T = {
  sk: {
    zvacsit: null, // berie sa z dist (sr-only prvej fotky)
    uvod: "Vyberte značku a model svojho kamiónu. Na stránke modelu nájdete fotky kobercov a konfigurátor, v ktorom hneď uvidíte cenu.",
    znackyAria: "Značky kamiónov",
    nenasli: "Nenašli ste svoj kamión?",
    nevadi: "Nevadí, nájdete ho tu.",
    najst: "Nájsť môj kamión",
    pata: "Do kamiónu",
  },
  cz: {
    zvacsit: null,
    uvod: "Vyberte značku a model svého kamionu. Na stránce modelu najdete fotky koberců a konfigurátor, ve kterém hned uvidíte cenu.",
    znackyAria: "Značky kamionů",
    nenasli: "Nenašli jste svůj kamion?",
    nevadi: "Nevadí, najdete ho tady.",
    najst: "Najít můj kamion",
    pata: "Do kamionu",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const kotva = (znacka) => "kamiony-" + znacka.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const chyby = [];
const chyba = (subor, s) => chyby.push(subor + ": " + s);

/** Sekcie kusu v poradí: [{ meno, text, od, do }] (sekcie nie sú vnorené). */
function sekcie(html) {
  return [...html.matchAll(/<section\b[^>]*\bdata-lcd-sekcia="([^"]+)"[^>]*>[\s\S]*?<\/section>/g)].map((m) => ({ meno: m[1], text: m[0], od: m.index, do: m.index + m[0].length }));
}
/** Otvárací tag koreňa kusu. */
const obal = (html) => (html.match(/^<div id="p1v-kamiony-[12]"[^>]*>/) || [""])[0];

// ---------------------------------------------------------------------------------------------------------------
const data = JSON.parse(readFileSync(join(VYSTUP, "stranky.json"), "utf8"));
const dist = {};
for (const j of JAZYKY) for (const n of [1, 2]) {
  const f = join(DIST, "p1v-kamiony-" + n + "." + j + ".html");
  dist[j + n] = readFileSync(f, "utf8");
}
const CDN = data.cdn;
const slugy = Object.keys(data.stranky).sort();
const cakajuce = slugy.filter((s) => JAZYKY.some((j) => data.stranky[s][j].caka));
const hotove = slugy.filter((s) => !cakajuce.includes(s));

/** Sekcia galérie stránky z galérie 640 / 2452: nadpis, úvod, fotky; nadpis sekcie (eyebrow) a tlačidlo ostávajú. */
function galeria(distSek, s, slug) {
  const zv = (distSek.match(/<span class="sr-only">([^<:]+: )/) || [])[1];
  if (!zv) throw new Error("dist galéria: nenašiel som text „Zväčšiť fotku: “");
  const fotky = s.fotky.map((f) => {
    const zaklad = CDN + slug + "/autokoberce-do-kamionu-" + slug + "-galeria-" + f.n;
    return '<figure class="kg-k"><button type="button" class="kg-f" data-p1v-lb-foto="' + zaklad + '.jpg" data-p1v-lb-sada="kamiony-' + slug + '"><img src="' + zaklad + '-m.jpg" alt="' + esc(f.alt) + '" loading="lazy" width="800" height="800"><span class="sr-only">' + zv + esc(f.popis) + "</span></button><figcaption>" + esc(f.popis) + "</figcaption></figure>";
  });
  let n = 0;
  const out = distSek
    .replace(/(<h2 class="rv">)[^<]*(<\/h2>)/, (m, a, b) => (n++, a + esc(s.popisNadpis) + b))
    .replace(/(<p class="lede rv">)[^<]*(<\/p>)/, (m, a, b) => (n++, a + esc(s.popisUvod) + b))
    .replace(/(<div class="kg rv">\n)[\s\S]*?(<\/div>\n<div class="k-cta)/, (m, a, b) => (n++, a + fotky.join("\n") + "\n" + b));
  if (n !== 3) throw new Error("dist galéria: nadpis, úvod alebo mriežka fotiek sa nenašli (" + n + "/3)");
  return out;
}

/** Popis produktu stránky = kus 1 (galéria vymenená) + kus 2 bez zmeny. */
function popisStranky(slug, j) {
  const s = data.stranky[slug][j];
  if (!s.fotky.length) throw new Error(slug + "." + j + ": stránka nemá fotky (čaká) — Popis sa nestavia");
  const k1 = dist[j + 1];
  const g = sekcie(k1).find((x) => x.meno === "kamiony-galeria");
  if (!g) throw new Error("dist p1v-kamiony-1." + j + ": chýba sekcia kamiony-galeria");
  const novy = k1.slice(0, g.od) + galeria(g.text, s, slug) + k1.slice(g.do);
  return novy.replace(/\s*$/, "\n") + dist[j + 2].replace(/\s*$/, "\n");
}

// ---------------------------------------------------------------------------------------------------------------
const STYL_KAT = [
  ".lcd-kam-zoznam--kat{--kz-ink:#14110c;--kz-siva:#6b6457;--kz-linka:#e4ddcd;--kz-zlata:#c49b31;--kz-zelena:#1f7a52;--kz-piesok:#f6f4ef;margin:6px 0 30px;color:var(--kz-ink);font-size:16px;line-height:1.5}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__uvod{margin:0 0 14px;max-width:64ch;font-size:17px;color:var(--kz-siva)}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__znacky{display:flex;flex-wrap:wrap;gap:8px;margin:0}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__znacky a{display:inline-block;padding:7px 15px;border:1px solid var(--kz-linka);border-radius:999px;background:#fff;color:var(--kz-ink);font-size:15px;font-weight:700;text-decoration:none}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__znacky a:hover{border-color:var(--kz-zlata)}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__znacka{margin:28px 0 0;scroll-margin-top:96px}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__znacka h2{margin:0 0 12px;padding:0 0 8px;border-bottom:2px solid var(--kz-zlata);color:var(--kz-ink);font-size:22px;line-height:1.2}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__modely{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none}",
  "@media(min-width:640px){.lcd-kam-zoznam--kat .lcd-kam-zoznam__modely{grid-template-columns:repeat(3,minmax(0,1fr))}}",
  "@media(min-width:1000px){.lcd-kam-zoznam--kat .lcd-kam-zoznam__modely{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__modely li{margin:0;padding:0;list-style:none}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__modely li::before{content:none;display:none}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__k{display:flex;flex-direction:column;height:100%;padding:10px 10px 12px;border:1px solid var(--kz-linka);border-radius:12px;background:#fff;color:var(--kz-ink);text-decoration:none;transition:border-color .2s,box-shadow .2s}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__k:hover{border-color:var(--kz-zlata);box-shadow:0 8px 20px -14px rgba(20,15,5,.45)}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__k:focus-visible{outline:2px solid var(--kz-zlata);outline-offset:2px}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__foto{display:flex;align-items:flex-end;justify-content:center;aspect-ratio:5/4;margin:0 0 8px;overflow:hidden;border-radius:8px;background:var(--kz-piesok)}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__foto picture{display:contents}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__foto img{display:block;width:100%;height:100%;object-fit:contain}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__foto--bez{align-items:center;color:#b3a78c}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__foto--bez svg{width:46%;height:auto}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__k b{font-size:16px;line-height:1.3}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__roky{color:var(--kz-siva);font-size:15px}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__nenasli{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:32px 0 0;padding:18px 20px;border:2px solid var(--kz-zlata);border-radius:14px;background:#fffdf7}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__nenasli p{margin:0;font-size:17px}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__tl{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--kz-zelena);color:#fff;font-size:16px;font-weight:700;text-decoration:none}",
  ".lcd-kam-zoznam--kat .lcd-kam-zoznam__tl:hover{color:#fff;filter:brightness(1.08)}",
].join("\n");

// jednoduchý obrys ťahača (žiadna značka) pre stránky bez fotky ťahača výrobcu
const IKONA = '<svg viewBox="0 0 64 40" width="64" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h22v24H6z"/><path d="M28 14h14l9 9v7H28z"/><path d="M33 17h7l6 6H33z"/><circle cx="15" cy="32" r="4" fill="#fff"/><circle cx="43" cy="32" r="4" fill="#fff"/></svg>';

function dlazdica(slug, s) {
  const roky = s.roky.od + "–" + s.roky.do;
  let foto;
  if (s.tahac) {
    const z = CDN + "tahace/" + s.tahac.kluc;
    foto = '<span class="lcd-kam-zoznam__foto"><picture><source type="image/webp" srcset="' + z + "-480.webp 480w, " + z + '-960.webp 960w" sizes="(min-width: 1000px) 230px, (min-width: 640px) 30vw, 45vw"><img src="' + z + '-480.png" alt="" width="' + s.tahac.w + '" height="' + s.tahac.h + '" loading="lazy" decoding="async"></picture></span>';
  } else foto = '<span class="lcd-kam-zoznam__foto lcd-kam-zoznam__foto--bez">' + IKONA + "</span>";
  return '<li><a class="lcd-kam-zoznam__k" href="' + s.url + '">' + foto + "<b>" + esc(s.model) + '</b> <span class="lcd-kam-zoznam__roky">(' + roky + ")</span></a></li>";
}

function kategoria(j) {
  const t = T[j];
  const podla = (z) => hotove.filter((s) => data.stranky[s][j].znacka === z)
    .sort((a, b) => data.stranky[b][j].roky.od - data.stranky[a][j].roky.od || data.stranky[a][j].model.localeCompare(data.stranky[b][j].model, "sk"));
  const znacky = ZNACKY.filter((z) => podla(z).length);
  const out = [
    "<style>\n" + STYL_KAT + "\n</style>",
    '<div class="lcd-kam-zoznam lcd-kam-zoznam--kat" data-lcd-cast="kamiony-zoznam">',
    '<p class="lcd-kam-zoznam__uvod">' + esc(t.uvod) + "</p>",
    '<nav class="lcd-kam-zoznam__znacky" aria-label="' + t.znackyAria + '">' + znacky.map((z) => '<a href="#' + kotva(z) + '">' + esc(z) + "</a>").join("") + "</nav>",
  ];
  for (const z of znacky) {
    out.push('<section class="lcd-kam-zoznam__znacka" id="' + kotva(z) + '"><h2>' + esc(z) + "</h2>");
    out.push('<ul class="lcd-kam-zoznam__modely">');
    for (const s of podla(z)) out.push(dlazdica(s, data.stranky[s][j]));
    out.push("</ul></section>");
  }
  out.push('<div class="lcd-kam-zoznam__nenasli"><p><b>' + esc(t.nenasli) + "</b> " + esc(t.nevadi) + '</p><a class="lcd-kam-zoznam__tl" href="' + data.web[j].konfigurator + '">' + esc(t.najst) + "</a></div>");
  out.push("</div>");
  return out.join("\n") + "\n";
}

const STYL_PATA = [
  ".lcd-kam-zoznam--pata ul{margin:0;padding:0;list-style:none}",
  ".lcd-kam-zoznam--pata li{margin:0 0 6px;padding:0;list-style:none}",
  ".lcd-kam-zoznam--pata li::before{content:none;display:none}",
  ".lcd-kam-zoznam--pata .lcd-kam-zoznam__hladaj{font-weight:700}",
].join("\n");

function paticka(j) {
  const t = T[j];
  const kat = data.web[j].kategoria;
  const znacky = ZNACKY.filter((z) => hotove.some((s) => data.stranky[s][j].znacka === z));
  return [
    "<style>\n" + STYL_PATA + "\n</style>",
    '<div class="lcd-kam-zoznam lcd-kam-zoznam--pata">',
    '<h4 style="margin-top:22px"><a href="' + kat + '" style="color:inherit;text-decoration:none">' + esc(t.pata) + "</a></h4>",
    '<ul class="lcd-kam-zoznam__pata">',
    ...znacky.map((z) => '<li><a href="' + kat + "#" + kotva(z) + '">' + esc(z) + "</a></li>"),
    '<li><a class="lcd-kam-zoznam__hladaj" href="' + data.web[j].konfigurator + '">' + esc(t.najst) + "</a></li>",
    "</ul>",
    "</div>",
  ].join("\n") + "\n";
}

// ---------------------------------------------------------------------------------------------------------------
const subory = new Map(); // meno -> obsah
for (const slug of hotove) for (const j of JAZYKY) {
  try { subory.set(slug + "." + j + ".html", popisStranky(slug, j)); } catch (e) { chyba(slug + "." + j, e.message); }
}
for (const j of JAZYKY) {
  subory.set("kategoria-autokoberce-do-kamionu." + j + ".html", kategoria(j));
  subory.set("paticka-kamiony." + j + ".html", paticka(j));
}
const manifest = {
  popis: "Odtlačky vstupov tools/build-kamiony-stranky.mjs (--check porovná s aktuálnymi). Nemeniť ručne.",
  dist: Object.fromEntries(JAZYKY.flatMap((j) => [1, 2].map((n) => ["p1v-kamiony-" + n + "." + j + ".html", hash(dist[j + n])]))),
  stranky_json: hash(readFileSync(join(VYSTUP, "stranky.json"), "utf8")),
  subory: Object.fromEntries([...subory].map(([m, t]) => [m, { znaky: t.length, sha: hash(t) }])),
};
subory.set("manifest.json", JSON.stringify(manifest, null, 2) + "\n");

// ---- kontroly (build aj --check) ----
const obrazky = new Set();
const popisov = [...subory.keys()].filter((m) => /^[a-z0-9-]+\.(sk|cz)\.html$/.test(m) && !/^(kategoria|paticka)-/.test(m));
if (popisov.length !== hotove.length * 2) chyba("admin-html/kamiony", "Popisov " + popisov.length + " (má byť " + hotove.length * 2 + ")");
for (const slug of cakajuce) for (const j of JAZYKY) {
  if (existsSync(join(VYSTUP, slug + "." + j + ".html"))) chyba(slug + "." + j + ".html", "stránka čaká (" + data.stranky[slug][j].caka + "), starý Popis treba odložiť mimo admin-html/kamiony/");
  if (JAZYKY.some((x) => data.stranky[slug][x].fotky.length)) chyba(slug, "čakajúca stránka má fotky");
}
if (slugy.length !== 20) chyba("stranky.json", "stránok " + slugy.length + " (má byť 20)");
for (const m of popisov) {
  const t = subory.get(m);
  const [slug, j] = m.replace(/\.html$/, "").split(/\.(?=sk$|cz$)/);
  const s = data.stranky[slug][j];
  if (t.length > LIMIT) chyba(m, t.length + " znakov (limit " + LIMIT + ")");
  // kus 1 a kus 2 oddelené podľa obalov
  const i2 = t.indexOf('<div id="p1v-kamiony-2"');
  const k1 = t.slice(0, i2), k2 = t.slice(i2);
  if (k2 !== dist[j + 2].replace(/\s*$/, "\n")) chyba(m, "kus 2 ≠ dist p1v-kamiony-2." + j);
  if (obal(k1) !== obal(dist[j + 1])) chyba(m, "obal kusu 1 ≠ dist");
  const sn = sekcie(k1), sd = sekcie(dist[j + 1]);
  if (sn.map((x) => x.meno).join(",") !== sd.map((x) => x.meno).join(",")) chyba(m, "poradie sekcií ≠ dist");
  sn.forEach((x, i) => { if (x.meno !== "kamiony-galeria" && sd[i] && x.text !== sd[i].text) chyba(m, "sekcia " + x.meno + " ≠ dist"); });
  // text mimo sekcií (obal, medzery) rovnaký
  const mimo = (h) => sekcie(h).reduceRight((a, x) => a.slice(0, x.od) + "§" + a.slice(x.do), h);
  if (mimo(k1) !== mimo(dist[j + 1].replace(/\s*$/, "\n"))) chyba(m, "text mimo sekcií kusu 1 ≠ dist");
  // galéria
  const g = sn.find((x) => x.meno === "kamiony-galeria");
  const fig = g ? [...g.text.matchAll(/<figure class="kg-k">[\s\S]*?<\/figure>/g)].map((x) => x[0]) : [];
  if (fig.length !== s.fotky.length) chyba(m, "galéria má " + fig.length + " fotiek, stránka " + s.fotky.length);
  fig.forEach((f, i) => {
    const alt = (f.match(/ alt="([^"]*)"/) || [])[1];
    if (alt !== esc(s.fotky[i].alt)) chyba(m, "fotka " + (i + 1) + ": alt ≠ stranky.json");
    if (!f.includes('data-p1v-lb-sada="kamiony-' + slug + '"')) chyba(m, "fotka " + (i + 1) + ": sada okna");
  });
  if (!g || !g.text.includes('<h2 class="rv">' + esc(s.popisNadpis) + "</h2>")) chyba(m, "galéria: nadpis ≠ popisNadpis");
  if (!g || !g.text.includes('<p class="lede rv">' + esc(s.popisUvod) + "</p>")) chyba(m, "galéria: úvod ≠ popisUvod");
  if (!/(Sedia do ročníkov|Pasují do ročníků) [\d, ]+ (aj|i) \d{4}\.<\/p>/.test(g ? g.text : "")) chyba(m, "galéria: úvod bez vety s ročníkmi");
}
for (const [m, t] of subory) {
  if (!m.endsWith(".html")) continue;
  if (/<h1\b|<script\b|\son[a-z]+=|javascript:/i.test(t)) chyba(m, "zakázané: <h1>, <script>, on…= alebo javascript:");
  for (const img of t.match(/<img\b[^>]*>/g) || []) {
    if (!/\sloading="(lazy|eager)"/.test(img) || !/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) chyba(m, "<img> bez loading/width/height: " + img.slice(0, 120));
  }
  const ids = [...t.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
  if (new Set(ids).size !== ids.length) chyba(m, "duplicitné id");
  for (const u of t.match(/https:\/\/cdn\.myshoptet\.com\/[^"\s,]+/g) || []) if (u.startsWith(CDN)) obrazky.add(u.slice(CDN.length));
  if (/^(kategoria|paticka)-/.test(m)) {
    if (/\/znacky\/|logo/i.test(t)) chyba(m, "logo značky");
    if (/\d+\s*(model|kamió|kamio|typ|značk|znač)/i.test(t.replace(/<style>[\s\S]*?<\/style>/, ""))) chyba(m, "počet modelov v texte");
    if (/kamiony-1\//.test(t)) chyba(m, "odkaz na skrytý konfigurátor");
    const j = m.match(/\.(sk|cz)\.html$/)[1];
    if (!t.includes('href="' + data.web[j].konfigurator + '"')) chyba(m, "bez odkazu na hlavný konfigurátor " + data.web[j].konfigurator);
    if ((t.match(/<style>/g) || []).length !== 1) chyba(m, "má mať presne jeden <style>");
    const css = (t.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
    for (const pr of css.split("\n").filter((r) => r.trim())) {
      const sel = pr.replace(/^@media[^{]*\{/, "").split("{")[0];
      if (!sel.split(",").every((x) => x.trim().startsWith(".lcd-kam-zoznam"))) chyba(m, "štýl mimo .lcd-kam-zoznam: " + sel);
    }
    if (m.startsWith("kategoria-")) {
      for (const s of hotove) if (!t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "chýba odkaz na " + data.stranky[s][j].url);
      for (const s of cakajuce) if (t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "odkaz na čakajúcu stránku " + data.stranky[s][j].url);
      if (!t.includes(T[j].nenasli) || !t.includes(T[j].nevadi)) chyba(m, "chýba „" + T[j].nenasli + " " + T[j].nevadi + "“");
    } else if (!t.includes('href="' + data.web[j].kategoria + '"')) chyba(m, "pätička bez odkazu na kategóriu");
  }
}
const chybajuce = [...obrazky].filter((r) => !existsSync(join(IMG, r)));
const infoObr = "obrázky kamion-stranky/: " + obrazky.size + " v HTML, chýba v assets/img/1v/kamion-stranky/ " + chybajuce.length;

// ---- zápis alebo porovnanie ----
const ine = [];
for (const [m, t] of subory) {
  const f = join(VYSTUP, m);
  const stary = existsSync(f) ? readFileSync(f, "utf8") : null;
  if (stary !== t) ine.push(m);
  if (!CHECK && stary !== t) { mkdirSync(VYSTUP, { recursive: true }); writeFileSync(f, t); }
}
if (CHECK) {
  // dist od posledného buildu nezmenený (manifest na disku)
  const mf = join(VYSTUP, "manifest.json");
  const stary = existsSync(mf) ? JSON.parse(readFileSync(mf, "utf8")) : null;
  if (!stary) chyba("manifest.json", "chýba (spusti node tools/build-kamiony-stranky.mjs)");
  else for (const [k, v] of Object.entries(manifest.dist)) if (stary.dist[k] !== v) chyba("dist/" + k, "zmenil sa od posledného buildu (spusti build a znova vlož Popisy)");
  if (ine.length) chyba("admin-html/kamiony", "zastarané (spusti node tools/build-kamiony-stranky.mjs): " + ine.join(", "));
  if (chybajuce.length) chyba("assets/img/1v/kamion-stranky", "chýba " + chybajuce.length + " obrázkov, napr. " + chybajuce.slice(0, 5).join(", "));
}

const dlzky = popisov.map((m) => subory.get(m).length);
if (cakajuce.length) console.log("čakajú (bez Popisu, mimo kategórie a pätičky): " + cakajuce.join(", "));
console.log("Popisy: " + popisov.length + " súborov, " + Math.min(...dlzky) + "–" + Math.max(...dlzky) + " znakov (limit " + LIMIT + "); kategória " + JAZYKY.map((j) => subory.get("kategoria-autokoberce-do-kamionu." + j + ".html").length).join(" / ") + " zn., pätička " + JAZYKY.map((j) => subory.get("paticka-kamiony." + j + ".html").length).join(" / ") + " zn.");
console.log(infoObr + (chybajuce.length && !CHECK ? " (pridá úloha štvorcov, --check ich vyžaduje)" : ""));
if (chyby.length) { console.log("CHYBY (" + chyby.length + "):\n" + chyby.join("\n")); process.exit(1); }
if (CHECK) console.log("OK: " + popisov.length + " Popisov ≤ " + LIMIT + " znakov, sekcie mimo galérie = dist, dist nezmenený, kategória a pätička SK aj CZ, obrázky existujú");
else console.log((ine.length ? "zapísané: " + ine.join(", ") : "bez zmeny") + "; OK");
