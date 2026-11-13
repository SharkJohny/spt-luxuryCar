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
// Vlna 4 a 5 (13. 11. 2026) — všetko riadi stranky.json, v kóde nie je zoznam stránok ani ich počet (výnimka: poistka PRVA_VARKA = mená 20 stránok vĺn 1–3):
//   kľúč stránky = slug bez predpony; "url" = /autokoberce-do-kamionu-<slug>/ (kamión) alebo /autokoberce-do-dodavky-<slug>/
//   (dodávka). Typ stránky sa berie z adresy. Fotky galérie: <cdn><slug>/<adresa bez lomiek>-galeria-NN.jpg a -m.jpg
//   (kamióny ako doteraz autokoberce-do-kamionu-<slug>-galeria-NN, dodávky autokoberce-do-dodavky-<slug>-galeria-NN).
//   Iné meno súborov fotiek (napr. dodávka nafotená ešte s predponou kamiónu): voliteľné pole stránky "fotkyMeno"
//   = meno bez „-galeria-NN“, napr. "autokoberce-do-kamionu-fiat-ducato" (SK aj CZ rovnaké).
//   Stránka, ktorá v stranky.json nie je (alebo má "caka"), sa negeneruje a nikde sa na ňu neodkazuje.
//   Nová značka kamiónov (Ford, IVECO) = podkategória /autokoberce-do-kamionu-<znacka>/ ako pri ostatných, hneď ako má
//   aspoň jednu hotovú stránku; logo assets/img/znacky/<meno>.svg — kým v repe nie je, dlaždica značky má obrys ťahača
//   a H1 je bez loga (build to vypíše).
//   Dodávky = JEDNA kategória /autokoberce-do-dodavky/ (kategoria-autokoberce-do-dodavky.<jazyk>.html) s dlaždicami
//   všetkých hotových dodávok, dlaždica „Dodávky“ v prehľade kamiónov, odkaz v pätičke a riadok v kategorie-znaciek.json
//   (typ "dodavky"). Kým nie je hotová žiadna dodávka, nič z toho nevznikne a výstupy sú bajt po bajte ako predtým.
//   Dlaždica bez fotky vozidla ("tahac": null) = obrys ťahača / dodávky v tom istom rámiku (mriežka ostáva rovnaká).
//
// --check: všetky výstupy = to, čo by build zapísal (bajt po bajte); Popis každej hotovej stránky, každý ≤ 45 000 znakov; sekcie mimo
// galérie, obaly aj celý kus 2 bajt po bajte rovnaké s dist; dist od posledného buildu nezmenený (manifest); každý
// obrázok z kamion-stranky/ existuje v assets/img/1v/kamion-stranky/; bez <h1>, <script>, on…=, logo značky, počtu modelov.
// Čakajúca stránka (stranky.json "caka": dôvod, 12. 11. večer – napr. DAF XG bez fotky celej sady): Popis sa nestavia,
// v kategórii ani v pätičke nie je (prvá várka vytvárania v admine ju vynechá); jej starý Popis v admin-html/kamiony/
// nesmie ostať (--check zlyhá).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "..");
// --priecinok <cesta>: stranky.json sa číta z tohto priečinka a výstupy idú doň (skúška na kópii mimo repa,
// tools/test-kamion-stranky-build.mjs); dist a obrázky sa vždy berú z repa
const iPriecinok = process.argv.indexOf("--priecinok");
const VYSTUP = iPriecinok > -1 && process.argv[iPriecinok + 1] ? resolve(process.argv[iPriecinok + 1]) : join(KOREN, "admin-html", "kamiony");
const DIST = join(KOREN, "admin-html", "dist");
const IMG = join(KOREN, "assets", "img", "1v", "kamion-stranky");
const LIMIT = 45000;
const CHECK = process.argv.includes("--check");
const JAZYKY = ["sk", "cz"];
const ZNACKY = ["DAF", "Ford", "IVECO", "MAN", "Mercedes-Benz", "Renault", "Scania", "Volvo"]; // abecedne (kniha 2.4 bod 6); značka bez hotovej stránky sa nezobrazí
const ZNACKY_SUBORY = join(KOREN, "assets", "img", "znacky"); // logá značiek v repe (CDN = ten istý priečinok)
// Poistka proti poškodenému stranky.json: 20 stránok prvej várky (vlny 1–3, naživo v admine SK aj CZ od 12.–13. 11. 2026)
// musí byť v JSON každá menom a hotová (nie "caka"). Predtým len počet „aspoň 20“ – s 32 stránkami (vlna 4 a 5) by už
// nezachytil chýbajúcu starú stránku. Ostatné stránky (vlna 4 a 5 a ďalšie) sa riadia len dátami, ako doteraz.
const PRVA_VARKA = ["daf-xf105", "daf-xf106", "daf-xf106-2013", "daf-xg", "man-tgx", "man-tgx-2007", "man-tgx-2018",
  "mercedes-actros", "mercedes-actros-2003", "mercedes-actros-f", "mercedes-actros-solostar", "renault-t", "renault-t-s-tunelom",
  "scania-r", "scania-r-2004", "scania-r-2009", "scania-r-2014", "scania-s", "volvo-fh13", "volvo-fh4"];

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
/** Rozdelí zoznam selektorov podľa čiarok mimo zátvoriek (:is(a,b) ostane celé). */
const splitHore = (s) => { const out = []; let h = 0, z = 0; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === "(") h++; else if (c === ")") h--; else if (c === "," && !h) { out.push(s.slice(z, i)); z = i + 1; } } out.push(s.slice(z)); return out; };
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

// CDN drží obrázky rok (Cache-Control max-age=31536000): keď sa galéria stránky prečísluje (rovnaké meno -galeria-NN,
// iný obsah), zvýš verziu slugu – odkazy dostanú ?v=N a CDN aj prehliadač stiahnu nový obrázok.
// 13. 11. 2026: DAF XF105 +2 celé sety, DAF XF106 2013 +1 celý set (Codex, foto/davka6-daf.csv).
const VERZIA_GALERIE = { "daf-xf105": 2, "daf-xf106-2013": 2 };
// Zmena LEN okna jednej fotky (iný výrez veľkej fotky, štvorec -m.jpg rovnaký): pole fotky "oknoVerzia": N v stranky.json
// (a3/web/skripty/orezy.json "galeria_verzia") -> data-p1v-lb-foto = …-galeria-NN-vN.jpg, nový súbor s novým menom.
// Pôvodný …-galeria-NN.jpg v repe ostáva (staré adresy). 13. 11. 2026 večer: 6 fotiek, kde orez štvorca schováva neporiadok.

/** Sekcia galérie stránky z galérie 640 / 2452: nadpis, úvod, fotky; nadpis sekcie (eyebrow) a tlačidlo ostávajú. */
function galeria(distSek, s, slug) {
  const zv = (distSek.match(/<span class="sr-only">([^<:]+: )/) || [])[1];
  if (!zv) throw new Error("dist galéria: nenašiel som text „Zväčšiť fotku: “");
  const v = VERZIA_GALERIE[slug] ? "?v=" + VERZIA_GALERIE[slug] : "";
  const fotky = s.fotky.map((f) => {
    // meno súboru = adresa stránky (kamión: autokoberce-do-kamionu-<slug>-…, dodávka: autokoberce-do-dodavky-<slug>-…) alebo "fotkyMeno"
    const zaklad = CDN + slug + "/" + (s.fotkyMeno || s.url.replace(/^\/|\/$/g, "")) + "-galeria-" + f.n;
    // okno galérie s novým výrezom (stranky.json "oknoVerzia", 13. 11. 2026 večer) = nové meno …-galeria-NN-vN.jpg, -m.jpg ostáva
    const okno = zaklad + (f.oknoVerzia ? "-v" + f.oknoVerzia : "") + ".jpg";
    return '<figure class="kg-k"><button type="button" class="kg-f" data-p1v-lb-foto="' + okno + v + '" data-p1v-lb-sada="kamiony-' + slug + '"><img src="' + zaklad + "-m.jpg" + v + '" alt="' + esc(f.alt) + '" loading="lazy" width="800" height="800"><span class="sr-only">' + zv + esc(f.popis) + "</span></button><figcaption>" + esc(f.popis) + "</figcaption></figure>";
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
// Kategória ako pri osobných autách (Michal 13. 11. 2026: „keď kliknem na zobraziť všetky… zobrazia sa jednotlivé značky,
// do nich budem vedieť klikať a zobrazia sa dané kamióny“ + predvolený výpis produktov Shoptetu preč):
//   /autokoberce-do-kamionu/           = dlaždice značiek s logom (ako /autokoberce-podla-auta/) + „Nenašli ste…?“
//   /autokoberce-do-kamionu-<znacka>/  = podkategória značky: dlaždice modelov (ťahač, roky, cena) ako /autokoberce-<znacka>/
// Vzhľad = triedy .lcd-pa z luxuryCar.css (_lcdPodlaAuta.scss, naživo SK aj CZ). <style> v Popise platí len pre stránku
// (body.in-<slug>): piesok, skrytý výpis Shoptetu, H1, logo pri H1 — bez prepnutia verzie.
const ZNACKY_CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/znacky/";
const ZNACKA_LOGO = { DAF: "daf", Ford: "ford", IVECO: "iveco", MAN: "man", "Mercedes-Benz": "mercedes", Renault: "renault", Scania: "scania", Volvo: "volvo" };
const logo = (z) => ZNACKY_CDN + ZNACKA_LOGO[z] + ".svg";
/** Logo značky je v repe (assets/img/znacky/)? Bez neho dlaždica značky dostane obrys ťahača a H1 ostane bez loga. */
const maLogo = (z) => existsSync(join(ZNACKY_SUBORY, ZNACKA_LOGO[z] + ".svg"));
// dodávky: jedna kategória pre všetky značky (13. 11. 2026); typ stránky = predpona adresy
const DODAVKY_SLUG = "autokoberce-do-dodavky";
const dodavkyUrl = (j) => (data.web[j] && data.web[j].dodavky) || "/" + DODAVKY_SLUG + "/";
const jeDodavka = (s) => s.url.indexOf("/" + DODAVKY_SLUG + "-") === 0;
const znackaSlug = (z) => "autokoberce-do-kamionu-" + z.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const znackaUrl = (z) => "/" + znackaSlug(z) + "/";
// cena = 640 / 2452 (všetky stránky sú ich kópie, 13. 11. 2026 SK 199.00, CZ 4980.00); pri zmene ceny upraviť
const CENA = { sk: "od 199 €", cz: "od 4&nbsp;980 Kč" };
const TK = {
  sk: {
    prehlad: "Vyberte značku kamiónu. Pri každom modeli nájdete fotky kobercov a konfigurátor s cenou.",
    znacka: "Vyberte model. Na stránke modelu nájdete fotky kobercov a konfigurátor s cenou.",
    ctaNadpis: "Nenašli ste svoj kamión / dodávku?",
    ctaTl: "Vyhľadať",
    inyModel: "Iný model?",
    vsetky: "Všetky značky kamiónov",
    nazov: (z) => "Autokoberce do kamiónu " + z,
    meta: (z, m) => "Autokoberce do kamiónu " + z + " na mieru: " + m + ". Fotky kobercov a konfigurátor s cenou. Od 199 €.",
    dodavky: "Dodávky",
    dodavkyUvod: "Vyberte model dodávky. Na stránke modelu nájdete fotky kobercov a konfigurátor s cenou.",
    dodavkyNazov: "Autokoberce do dodávky",
    dodavkyMeta: (m) => "Autokoberce do dodávky na mieru: " + m + ". Fotky kobercov a konfigurátor s cenou. Od 199 €.",
  },
  cz: {
    prehlad: "Vyberte značku kamionu. U každého modelu najdete fotky koberců a konfigurátor s cenou.",
    znacka: "Vyberte model. Na stránce modelu najdete fotky koberců a konfigurátor s cenou.",
    ctaNadpis: "Nenašli jste svůj kamion / dodávku?",
    ctaTl: "Vyhledat",
    inyModel: "Jiný model?",
    vsetky: "Všechny značky kamionů",
    nazov: (z) => "Autokoberce do kamionu " + z,
    meta: (z, m) => "Autokoberce do kamionu " + z + " na míru: " + m + ". Fotky koberců a konfigurátor s cenou. Od 4 980 Kč.",
    dodavky: "Dodávky",
    dodavkyUvod: "Vyberte model dodávky. Na stránce modelu najdete fotky koberců a konfigurátor s cenou.",
    dodavkyNazov: "Autokoberce do dodávky",
    dodavkyMeta: (m) => "Autokoberce do dodávky na míru: " + m + ". Fotky koberců a konfigurátor s cenou. Od 4 980 Kč.",
  },
};

/** CSS len pre jednu stránku kategórie (body.in-<slug>), rovnaké pravidlá ako _lcdPodlaAuta.scss body 1–3. */
function stylStranky(slug, z, ikonaVDlazdici) {
  const b = "body.in-" + slug;
  const r = [
    b + "{background:#f6f4ef}",
    b + " :is(.content-wrapper-in,#content){background:transparent}",
    b + " #content-wrapper{background:#f6f4ef}",
    b + " :is(.category-top .subcategories,.category-top .products-top-wrapper,#category-header,#filters-wrapper,#productsListHeading,#products,.listingControls,.pagination-wrapper,.category-perex.empty-content > :not(.lcd-pa)){display:none !important}",
    b + " .category-perex{margin:0;padding:0;border:0;background:transparent;max-width:none}",
    b + " .category-top{padding-top:28px}",
    b + ' h1.category-title{display:flex;align-items:center;gap:16px;margin:0 0 10px;color:#14110c;font:800 34px/1.15 "Exo 2","Segoe UI",Arial,sans-serif;text-transform:uppercase;letter-spacing:.01em;text-wrap:balance}',
  ];
  if (z) r.push(b + ' h1.category-title::before{content:"";flex:none;width:54px;height:54px;border-radius:50%;background:#fff url("' + logo(z) + '") no-repeat center/32px 32px;border:1px solid #e4ddcd}');
  r.push(b + " .lcd-pa--kamiony .lcd-pa__foto{aspect-ratio:5/4}");
  // celý ťahač aj s kolesami (Michal 13. 11. 2026: „chýba kus kolesa“): <picture> vyplní rámik, obrázok sa zmestí celý
  r.push(b + " .lcd-pa--kamiony .lcd-pa__foto picture{display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:0;overflow:hidden}");
  r.push(b + " .lcd-pa--kamiony .lcd-pa__foto img{width:auto;height:auto;max-width:92%;max-height:92%;object-fit:contain}");
  // dlaždica v rade značiek bez loga (Dodávky, značka bez loga v repe): obrys vozidla v rozmere loga (46 px)
  if (ikonaVDlazdici) {
    r.push(b + " .lcd-pa--kamiony .lcd-pa__znacka-ik{display:block;width:46px;height:46px;line-height:0;color:#14110c}");
    r.push(b + " .lcd-pa--kamiony .lcd-pa__znacka-ik svg{display:block;width:46px;height:46px}");
  }
  // „Nenašli ste…“ = návrh B (Michal 13. 11. 2026 večer, rovnako ako pri autách): štýl .lcd-pa__iny* je v _lcdPodlaAuta.scss
  // (main 239cc4bb, naživo od b522069), tu len kamión v ikone. Návrh A (.lcd-kam-cta) sa už nepoužíva.
  r.push("@media (max-width: 900px){" + b + " h1.category-title{font-size:26px;gap:12px}" + (z ? b + " h1.category-title::before{width:46px;height:46px;background-size:28px 28px}" : "") + "}");
  return "<style>\n" + r.join("\n") + "\n</style>";
}

// jednoduchý obrys ťahača (žiadna značka) pre stránky bez fotky ťahača výrobcu
const IKONA = '<svg viewBox="0 0 64 40" width="64" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h22v24H6z"/><path d="M28 14h14l9 9v7H28z"/><path d="M33 17h7l6 6H33z"/><circle cx="15" cy="32" r="4" fill="#fff"/><circle cx="43" cy="32" r="4" fill="#fff"/></svg>';

// to isté pre dodávku (stránka dodávky bez fotky vozidla)
const IKONA_DODAVKA_FOTO = '<svg viewBox="0 0 64 40" width="64" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M5 9h34l10 11h10v10H5z"/><path d="M39 9v11h10"/><path d="M23 9v21"/><circle cx="17" cy="32" r="4" fill="#fff"/><circle cx="48" cy="32" r="4" fill="#fff"/></svg>';

const IKONA_KAMION = '<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 7h30v23H3z"/><path d="M33 14h14l10 10v6H33z"/><path d="M38 17h7l6 6H38z"/><circle cx="13" cy="32" r="4.2" fill="currentColor" stroke="none"/><circle cx="46" cy="32" r="4.2" fill="currentColor" stroke="none"/></svg>';
const IKONA_DODAVKA = '<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M4 9h36l10 11h10v10H4z"/><path d="M40 9v11h10"/><path d="M24 9v21"/><circle cx="16" cy="32" r="4.2" fill="currentColor" stroke="none"/><circle cx="49" cy="32" r="4.2" fill="currentColor" stroke="none"/></svg>';

/** „Nenašli ste…“ — návrh B: dlaždica „Iný model?“ v mriežke, alebo široký pás (siroka) -> konfigurátor 640 / 2452.
 *  Markup = iny() v tools/build-podla-auta.mjs (main 239cc4bb), ikona kamióna namiesto auta. */
function iny(j, nadpis, siroka, ikona) {
  return '<a class="lcd-pa__iny' + (siroka ? " lcd-pa__iny--siroka" : "") + '" href="' + data.web[j].konfigurator + '"><span class="lcd-pa__iny-ik">' + (ikona || IKONA_KAMION) +
    "<i>+</i></span><b>" + esc(nadpis) + '</b><span class="lcd-pa__iny-tl">' + esc(TK[j].ctaTl) + "</span></a>";
}

function dlazdica(slug, s, j) {
  let foto;
  if (s.tahac) {
    // ťahač predkom doľava pod novým menom <kluc>-vlavo (pole subor), staré <kluc>-480… predkom doprava sa nepoužívajú
    const z = CDN + "tahace/" + (s.tahac.subor || s.tahac.kluc);
    foto = '<span class="lcd-pa__foto"><picture><source type="image/webp" srcset="' + z + "-480.webp 480w, " + z + '-960.webp 960w" sizes="(max-width: 900px) 45vw, 220px"><img src="' + z + '-480.png" alt="" width="' + s.tahac.w + '" height="' + s.tahac.h + '" loading="lazy" decoding="async"></picture></span>';
  } else foto = '<span class="lcd-pa__foto">' + (jeDodavka(s) ? IKONA_DODAVKA_FOTO : IKONA) + "</span>";
  return '  <li><a class="lcd-pa__auto" href="' + s.url + '">' + foto + "<b>" + esc(s.model) + "</b><span>" + s.roky.od + "–" + s.roky.do + "</span><i>" + CENA[j] + "</i></a></li>";
}

// podkategória značky = len kamióny (Mercedes-Benz Sprinter patrí do dodávok, nie k Actrosom)
const modelyZnacky = (z, j) => hotove.filter((s) => data.stranky[s][j].znacka === z && !jeDodavka(data.stranky[s][j]))
  .sort((a, b) => data.stranky[b][j].roky.od - data.stranky[a][j].roky.od || data.stranky[a][j].model.localeCompare(data.stranky[b][j].model, "sk"));
const znackyJazyka = (j) => ZNACKY.filter((z) => modelyZnacky(z, j).length);
/** Hotové stránky dodávok: značka abecedne, v značke novšia generácia prvá. */
const modelyDodavok = (j) => hotove.filter((s) => jeDodavka(data.stranky[s][j]))
  .sort((a, b) => data.stranky[a][j].znacka.localeCompare(data.stranky[b][j].znacka, "sk") || data.stranky[b][j].roky.od - data.stranky[a][j].roky.od || data.stranky[a][j].model.localeCompare(data.stranky[b][j].model, "sk"));
/** Dlaždica značky v prehľade: logo z repa, bez neho obrys ťahača. */
const dlazdicaZnacky = (z) => '  <li><a class="lcd-pa__znacka" href="' + znackaUrl(z) + '">' +
  (maLogo(z) ? '<img src="' + logo(z) + '" alt="" width="46" height="46" loading="lazy" decoding="async">' : '<span class="lcd-pa__znacka-ik">' + IKONA_KAMION + "</span>") + "<b>" + esc(z) + "</b></a></li>";

/** /autokoberce-do-kamionu/: dlaždice značiek s logom + široký rámik „Nenašli ste svoj kamión?“. */
function kategoria(j) {
  const t = T[j], k = TK[j];
  const dod = modelyDodavok(j).length > 0;
  return [
    stylStranky("autokoberce-do-kamionu", null, dod || znackyJazyka(j).some((z) => !maLogo(z))),
    '<div class="lcd-pa lcd-pa--prehlad lcd-pa--kamiony" data-lcd-cast="kamiony-zoznam">',
    '<p class="lcd-pa__uvod">' + esc(k.prehlad) + "</p>",
    '<ul class="lcd-pa__znacky">',
    ...znackyJazyka(j).map(dlazdicaZnacky),
    // dodávky: jedna dlaždica za značkami -> /autokoberce-do-dodavky/ (len keď je hotová aspoň jedna stránka dodávky)
    ...(dod ? ['  <li><a class="lcd-pa__znacka" href="' + dodavkyUrl(j) + '"><span class="lcd-pa__znacka-ik">' + IKONA_DODAVKA + "</span><b>" + esc(k.dodavky) + "</b></a></li>"] : []),
    "</ul>",
    iny(j, k.ctaNadpis, true),
    "</div>",
  ].join("\n") + "\n";
}

/** /autokoberce-do-kamionu-<znacka>/: dlaždice modelov + rámik „Nenašli ste svoj kamión <značka>?“ + Všetky značky. */
function kategoriaZnacky(j, z) {
  const t = T[j], k = TK[j];
  return [
    stylStranky(znackaSlug(z), maLogo(z) ? z : null),
    '<div class="lcd-pa lcd-pa--znacka lcd-pa--kamiony" data-lcd-cast="kamiony-' + ZNACKA_LOGO[z] + '">',
    '<p class="lcd-pa__uvod">' + esc(k.znacka) + "</p>",
    '<ul class="lcd-pa__auta">',
    ...modelyZnacky(z, j).map((s) => dlazdica(s, data.stranky[s][j], j)),
    "  <li>" + iny(j, k.inyModel, false) + "</li>",
    "</ul>",
    '<a class="lcd-pa__spat" href="' + data.web[j].kategoria + '">' + esc(k.vsetky) + "</a>",
    "</div>",
  ].join("\n") + "\n";
}

/** /autokoberce-do-dodavky/: dlaždice všetkých hotových dodávok + „Iný model?“ + späť na prehľad kamiónov. */
function kategoriaDodavok(j) {
  const k = TK[j];
  return [
    stylStranky(DODAVKY_SLUG, null),
    '<div class="lcd-pa lcd-pa--znacka lcd-pa--kamiony" data-lcd-cast="kamiony-dodavky">',
    '<p class="lcd-pa__uvod">' + esc(k.dodavkyUvod) + "</p>",
    '<ul class="lcd-pa__auta">',
    ...modelyDodavok(j).map((s) => dlazdica(s, data.stranky[s][j], j)),
    "  <li>" + iny(j, k.inyModel, false, IKONA_DODAVKA) + "</li>",
    "</ul>",
    '<a class="lcd-pa__spat" href="' + data.web[j].kategoria + '">' + esc(k.vsetky) + "</a>",
    "</div>",
  ].join("\n") + "\n";
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
  const znacky = znackyJazyka(j);
  return [
    "<style>\n" + STYL_PATA + "\n</style>",
    '<div class="lcd-kam-zoznam lcd-kam-zoznam--pata">',
    '<h4 style="margin-top:22px"><a href="' + kat + '" style="color:inherit;text-decoration:none">' + esc(t.pata) + "</a></h4>",
    '<ul class="lcd-kam-zoznam__pata">',
    ...znacky.map((z) => '<li><a href="' + znackaUrl(z) + '">' + esc(z) + "</a></li>"),
    ...(modelyDodavok(j).length ? ['<li><a href="' + dodavkyUrl(j) + '">' + esc(TK[j].dodavky) + "</a></li>"] : []),
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
  for (const z of znackyJazyka(j)) subory.set("kategoria-" + znackaSlug(z) + "." + j + ".html", kategoriaZnacky(j, z));
  if (modelyDodavok(j).length) subory.set("kategoria-" + DODAVKY_SLUG + "." + j + ".html", kategoriaDodavok(j));
  subory.set("paticka-kamiony." + j + ".html", paticka(j));
}
const modelSRokmi = (j) => (s) => data.stranky[s][j].model + " (" + data.stranky[s][j].roky.od + "–" + data.stranky[s][j].roky.do + ")";
// podklad pre admin (MCP category_create / category_update): názov, adresa, meta a súbor Popisu každej podkategórie
// kategória dodávok (len keď existuje): posledný riadok s typ "dodavky"; riadky značiek ostávajú bez zmeny
subory.set("kategorie-znaciek.json", JSON.stringify(Object.fromEntries(JAZYKY.map((j) => [j, znackyJazyka(j).map((z) => ({
  znacka: z, nazov: TK[j].nazov(z), indexName: znackaSlug(z), url: znackaUrl(z),
  metaTagDescription: TK[j].meta(z, modelyZnacky(z, j).map(modelSRokmi(j)).join(", ")),
  popis: "kategoria-" + znackaSlug(z) + "." + j + ".html",
})).concat(modelyDodavok(j).length ? [{
  znacka: TK[j].dodavky, typ: "dodavky", nazov: TK[j].dodavkyNazov, indexName: DODAVKY_SLUG, url: dodavkyUrl(j),
  metaTagDescription: TK[j].dodavkyMeta(modelyDodavok(j).map(modelSRokmi(j)).join(", ")),
  popis: "kategoria-" + DODAVKY_SLUG + "." + j + ".html",
}] : [])])), null, 2) + "\n");
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
for (const s of PRVA_VARKA) {
  if (!slugy.includes(s)) chyba("stranky.json", "chýba stránka prvej várky: " + s + " (stránok " + slugy.length + ", prvá várka " + PRVA_VARKA.length + ")");
  else if (cakajuce.includes(s)) chyba("stranky.json", "stránka prvej várky čaká (je naživo v admine): " + s);
}
// adresa stránky = /autokoberce-do-kamionu-<slug>/ alebo /autokoberce-do-dodavky-<slug>/, SK aj CZ rovnaká (typ, galéria, hreflang)
for (const slug of slugy) {
  const u = JAZYKY.map((j) => data.stranky[slug][j].url);
  if (!u.every((x) => x === "/autokoberce-do-kamionu-" + slug + "/" || x === "/" + DODAVKY_SLUG + "-" + slug + "/")) chyba(slug, "adresa nesedí so slugom: " + u.join(" | "));
  else if (new Set(u).size !== 1) chyba(slug, "adresa SK ≠ CZ: " + u.join(" | "));
  for (const j of JAZYKY) if (!jeDodavka(data.stranky[slug][j]) && !ZNACKY.includes(data.stranky[slug][j].znacka)) chyba(slug + "." + j, "značka kamiónu mimo zoznamu ZNACKY: " + data.stranky[slug][j].znacka);
  // názov produktu rozhoduje v pokladni a na ďakovnej stránke o lehote a poliach (kamionPolozka.js číta názov) — kontrola 13. 11. 2026
  for (const j of JAZYKY) {
    const nz = String(data.stranky[slug][j].nazov || "");
    if (nz && !(jeDodavka(data.stranky[slug][j]) ? /^Autokoberce do dodávky /.test(nz) : /^Autokoberce do kami[oó]nu /.test(nz))) chyba(slug + "." + j, "názov produktu nezačína „Autokoberce do " + (jeDodavka(data.stranky[slug][j]) ? "dodávky" : "kamiónu / kamionu") + " “: " + nz);
  }
  const fm = JAZYKY.map((j) => data.stranky[slug][j].fotkyMeno || "");
  if (fm.some((x) => x && !/^[a-z0-9-]+$/.test(x)) || new Set(fm).size !== 1) chyba(slug, "fotkyMeno: len malé písmená, číslice a spojovník, SK = CZ: " + fm.join(" | "));
}
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
    const ov = s.fotky[i].oknoVerzia;
    if (ov !== undefined && !(Number.isInteger(ov) && ov >= 2)) chyba(m, "fotka " + (i + 1) + ": oknoVerzia musí byť celé číslo ≥ 2: " + ov);
    const lb = (f.match(/ data-p1v-lb-foto="([^"?]+)/) || [])[1] || "";
    if (!lb.endsWith("-galeria-" + s.fotky[i].n + (ov ? "-v" + ov : "") + ".jpg")) chyba(m, "fotka " + (i + 1) + ": okno " + lb.slice(CDN.length) + " nesedí s oknoVerzia");
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
  for (const u of t.match(/https:\/\/cdn\.myshoptet\.com\/[^"\s,]+/g) || []) if (u.startsWith(CDN)) obrazky.add(u.slice(CDN.length).replace(/\?.*$/, ""));
  if (/^(kategoria|paticka)-/.test(m)) {
    if (m.startsWith("paticka-") && /\/znacky\/|logo/i.test(t)) chyba(m, "logo značky v návrhu pätičky");
    if (/\d+\s*(model|kamió|kamio|typ|značk|znač)/i.test(t.replace(/<style>[\s\S]*?<\/style>/, ""))) chyba(m, "počet modelov v texte");
    if (/kamiony-1\//.test(t)) chyba(m, "odkaz na skrytý konfigurátor");
    const j = m.match(/\.(sk|cz)\.html$/)[1];
    if (!t.includes('href="' + data.web[j].konfigurator + '"')) chyba(m, "bez odkazu na hlavný konfigurátor " + data.web[j].konfigurator);
    if ((t.match(/<style>/g) || []).length !== 1) chyba(m, "má mať presne jeden <style>");
    const css = (t.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
    for (const pr of css.split("\n").filter((r) => r.trim())) {
      const sel = pr.replace(/^@media[^{]*\{/, "").split("{")[0];
      const telo = m.startsWith("kategoria-") ? "body.in-" + m.replace(/^kategoria-/, "").replace(/\.(sk|cz)\.html$/, "") : null;
      const ok = (x) => x.trim().startsWith(".lcd-kam-zoznam") || (telo && x.trim().startsWith(telo) && /^(\s|$)/.test(x.trim().slice(telo.length)));
      if (!splitHore(sel).every(ok)) chyba(m, "štýl mimo .lcd-kam-zoznam / " + (telo || "") + ": " + sel);
    }
    if (m === "kategoria-autokoberce-do-kamionu." + j + ".html") {
      for (const z of znackyJazyka(j)) if (!t.includes('href="' + znackaUrl(z) + '"')) chyba(m, "chýba odkaz na značku " + znackaUrl(z));
      if (!t.includes('class="lcd-pa__iny lcd-pa__iny--siroka"') || !t.includes(esc(TK[j].ctaNadpis))) chyba(m, "chýba široký pás „" + TK[j].ctaNadpis + "“ (návrh B)");
      if (t.includes('href="' + dodavkyUrl(j) + '"') !== modelyDodavok(j).length > 0) chyba(m, "odkaz na kategóriu dodávok nesedí s počtom hotových dodávok (" + modelyDodavok(j).length + ")");
      for (const s of hotove) if (t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "prehľad odkazuje priamo na stránku " + data.stranky[s][j].url);
    } else if (m === "kategoria-" + DODAVKY_SLUG + "." + j + ".html") {
      const dod = modelyDodavok(j);
      for (const s of dod) if (!t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "chýba odkaz na " + data.stranky[s][j].url);
      for (const s of slugy.filter((x) => !dod.includes(x))) if (t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "odkaz na stránku mimo hotových dodávok " + data.stranky[s][j].url);
      if ((t.match(/<a class="lcd-pa__auto" /g) || []).length !== dod.length) chyba(m, "počet dlaždíc ≠ počet hotových dodávok (" + dod.length + ")");
      if (!t.includes('href="' + data.web[j].kategoria + '"')) chyba(m, "bez odkazu Všetky značky");
      if (!t.includes('<li><a class="lcd-pa__iny" href="' + data.web[j].konfigurator + '"') || !t.includes(esc(TK[j].inyModel))) chyba(m, "chýba dlaždica „" + TK[j].inyModel + "“ (návrh B)");
    } else if (m.startsWith("kategoria-")) {
      const z = znackyJazyka(j).find((x) => m === "kategoria-" + znackaSlug(x) + "." + j + ".html");
      if (!z) { chyba(m, "neznáma značka"); continue; }
      for (const s of modelyZnacky(z, j)) if (!t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "chýba odkaz na " + data.stranky[s][j].url);
      for (const s of hotove.filter((x) => !modelyZnacky(z, j).includes(x))) if (t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "odkaz na inú značku " + data.stranky[s][j].url);
      if (!t.includes('href="' + data.web[j].kategoria + '"')) chyba(m, "bez odkazu Všetky značky");
      for (const s of cakajuce) if (t.includes('href="' + data.stranky[s][j].url + '"')) chyba(m, "odkaz na čakajúcu stránku " + data.stranky[s][j].url);
      if (!t.includes('<li><a class="lcd-pa__iny" href="' + data.web[j].konfigurator + '"') || !t.includes(esc(TK[j].inyModel))) chyba(m, "chýba dlaždica „" + TK[j].inyModel + "“ (návrh B)");
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
const bezLoga = ZNACKY.filter((z) => JAZYKY.some((j) => znackyJazyka(j).includes(z)) && !maLogo(z));
if (bezLoga.length) console.log("značky bez loga v assets/img/znacky/ (dlaždica s obrysom ťahača, H1 bez loga): " + bezLoga.map((z) => z + " -> " + ZNACKA_LOGO[z] + ".svg").join(", "));
const pocetDodavok = modelyDodavok("sk").length;
if (pocetDodavok) console.log("dodávky: " + pocetDodavok + " hotových stránok -> kategoria-" + DODAVKY_SLUG + ".<jazyk>.html, dlaždica v prehľade, odkaz v pätičke");
console.log("Popisy: " + popisov.length + " súborov, " + Math.min(...dlzky) + "–" + Math.max(...dlzky) + " znakov (limit " + LIMIT + "); kategória " + JAZYKY.map((j) => subory.get("kategoria-autokoberce-do-kamionu." + j + ".html").length).join(" / ") + " zn., pätička " + JAZYKY.map((j) => subory.get("paticka-kamiony." + j + ".html").length).join(" / ") + " zn.");
console.log(infoObr + (chybajuce.length && !CHECK ? " (pridá úloha štvorcov, --check ich vyžaduje)" : ""));
if (chyby.length) { console.log("CHYBY (" + chyby.length + "):\n" + chyby.join("\n")); process.exit(1); }
if (CHECK) console.log("OK: " + popisov.length + " Popisov ≤ " + LIMIT + " znakov, sekcie mimo galérie = dist, dist nezmenený, kategória a pätička SK aj CZ, obrázky existujú");
else console.log((ine.length ? "zapísané: " + ine.join(", ") : "bez zmeny") + "; OK");
