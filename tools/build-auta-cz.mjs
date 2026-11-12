#!/usr/bin/env node
// CZ Popisy stránok áut (Michal 12. 11. 2026: „oba weby majú byť úplne totožne rovnaké“).
//   node tools/build-auta-cz.mjs            -> admin-html/auto/p1v-<slug>-1.cz.html zo SK p1v-<slug>-1.sk.html
//   node tools/build-auta-cz.mjs --check    len overí, že CZ súbory sedia so SK (exit 1 = treba znova postaviť)
//
// CZ stránka = CZ kus 1 základného produktu (build-admin-html.mjs --bez-webp: 598 -> CZ data-lcd-v kusu p1v-598-1.cz,
// dvoj -> p1v-dvoj-1.cz; obsah-webp-mapa.js ich fotky obalí do WebP rovnako ako na CZ 2403 / 2406) v poradí sekcií
// SK stránky auta + galéria auta a karty videí auta zo SK stránky, preložené do češtiny. Fotky a videá sú tie isté.
// Zmena SK stránky (iné fotky, nové video) = spustiť znova. Nová popiska fotky, iný úvodný odsek alebo nové video na SK
// = build zastaví („nepreložené“) — doplniť preklad sem (POPISKY / AUTA) a spustiť znova. Nové auto = riadok do AUTA.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUTO = path.join(REPO, "admin-html", "auto");
const CHECK = process.argv.includes("--check");
const lf = (s) => s.replace(/\r\n/g, "\n");

/** Popisky fotiek SK -> CZ (figcaption, alt za „·“, sr-only za „Pozrieť:“ / „Zobrazit:“). */
const POPISKY = [
  ["Miesto šoféra s pätnou podložkou", "Místo řidiče s patní podložkou"],
  ["Rohož do kufra a boxy do kufra", "Rohož do kufru a boxy do kufru"],
  ["Kufor pri sklopenom 3. rade", "Kufr se sklopenou 3. řadou"],
  ["Pedále a pätná podložka", "Pedály a patní podložka"],
  ["2. rad · stred s logom", "2. řada · střed s logem"],
  ["2. rad za spolujazdcom", "2. řada za spolujezdcem"],
  ["2. rad · kovové logo", "2. řada · kovové logo"],
  ["2. rad pri dverách", "2. řada u dveří"],
  ["2. rad za šoférom", "2. řada za řidičem"],
  ["Rohož do kufra Premium", "Rohož do kufru Premium"],
  ["Rohož do kufra Classic", "Rohož do kufru Classic"],
  ["Rohož a box do kufra", "Rohož a box do kufru"],
  ["Miesto spolujazdca", "Místo spolujezdce"],
  ["Prešívanie Diamond", "Prošívání Diamond"],
  ["Prešívanie Stripe", "Prošívání Stripe"],
  ["Druhá vrstva zblízka", "Druhá vrstva zblízka"],
  ["2. rad sedadiel", "2. řada sedadel"],
  ["3. rad sedadiel", "3. řada sedadel"],
  ["Pri prahu dverí", "U prahu dveří"],
  ["2. rad zblízka", "2. řada zblízka"],
  ["Rohož do kufra", "Rohož do kufru"],
  ["Miesto šoféra", "Místo řidiče"],
  ["2. rad · stred", "2. řada · střed"],
  ["Celý interiér", "Celý interiér"],
  ["Kufor a 3. rad", "Kufr a 3. řada"],
  ["Kovové logo", "Kovové logo"],
  ["Kufor zboku", "Kufr z boku"],
  ["Predný rad", "Přední řada"],
];

/**
 * Autá: zaklad = kus 1 základného produktu (598 = jednovrstvové 2403/2418, dvoj = dvojvrstvové 2406),
 * h = nadpis galérie SK -> CZ, sk/cz = úvodný odsek galérie (veta s ročníkmi „Pasují do ročníků … i …“, skill seo-stranka-auta 5a),
 * videa = popisy kariet videí auta SK -> CZ.
 */
const AUTA = {
  "649": {
    zaklad: "598",
    h: ["Škoda Kodiaq II s našimi autokobercami", "Škoda Kodiaq II s našimi autokoberci"],
    sk: "Pre Kodiaq druhej generácie (od roku 2024) máme hotovú šablónu, takže autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je Kodiaq nášho zákazníka so vzorom Stripe a rohožou do kufra. Sedia do ročníkov 2024, 2025 aj 2026.",
    cz: "Pro Kodiaq druhé generace (od roku 2024) máme hotovou šablonu, takže autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je Kodiaq našeho zákazníka se vzorem Stripe a rohoží do kufru. Pasují do ročníků 2024, 2025 i 2026.",
  },
  "667": {
    zaklad: "598",
    h: ["Škoda Kodiaq I s našimi autokobercami", "Škoda Kodiaq I s našimi autokoberci"],
    sk: "Pre Kodiaq prvej generácie (2016–2024) máme hotovú šablónu na 5 aj 7-miestnu verziu, Scout, Sportline aj RS, pred modernizáciou v roku 2021 aj po nej. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách sú autokoberce vo vzore Diamond v čiernej farbe s béžovým prešitím, rohož do kufra a dva boxy do kufra. Sedia do ročníkov 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023 aj 2024.",
    cz: "Pro Kodiaq první generace (2016–2024) máme hotovou šablonu pro 5místnou i 7místnou verzi, Scout, Sportline i RS, před modernizací v roce 2021 i po ní. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách jsou autokoberce se vzorem Diamond v černé barvě s béžovým prošitím, rohož do kufru a dva boxy do kufru. Pasují do ročníků 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023 i 2024.",
  },
  "audi-a6-c7": {
    zaklad: "598",
    h: ["Audi A6 C7 s našimi autokobercami", "Audi A6 C7 s našimi autokoberci"],
    sk: "Pre A6 generácie C7 (2011–2018) máme hotovú šablónu na Limuzínu, Avant, allroad quattro, S6 aj RS6 Avant, aj po modernizácii. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je A6 Avant so vzorom Diamond a rohožou do kufra. Sedia do ročníkov 2011, 2012, 2013, 2014, 2015, 2016, 2017 aj 2018.",
    cz: "Pro A6 generace C7 (2011–2018) máme hotovou šablonu pro Limuzínu, Avant, allroad quattro, S6 i RS6 Avant, i po modernizaci. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je A6 Avant se vzorem Diamond a rohoží do kufru. Pasují do ročníků 2011, 2012, 2013, 2014, 2015, 2016, 2017 i 2018.",
    videa: [["Naše autokoberce v Audi A6 C7", "Naše autokoberce v Audi A6 C7"], ["Naše koberce v Audi A6 C7", "Naše koberce v Audi A6 C7"]],
  },
  "mercedes-gle-v167": {
    zaklad: "598",
    h: ["Mercedes GLE s našimi autokobercami", "Mercedes GLE s našimi autokoberci"],
    sk: "Pre GLE od roku 2019 máme hotovú šablónu na SUV V167 (5 aj 7 miest) aj GLE Coupé C167, vrátane hybridov a AMG. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je GLE Coupé so vzorom Diamond v béžovej farbe a rohožou do kufra. Sedia do ročníkov 2019, 2020, 2021, 2022, 2023, 2024, 2025 aj 2026.",
    cz: "Pro GLE od roku 2019 máme hotovou šablonu pro SUV V167 (5 i 7 míst) i GLE Coupé C167, včetně hybridů a AMG. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je GLE Coupé se vzorem Diamond v béžové barvě a rohoží do kufru. Pasují do ročníků 2019, 2020, 2021, 2022, 2023, 2024, 2025 i 2026.",
    videa: [["Naše autokoberce v Mercedes GLE Coupé", "Naše autokoberce v Mercedesu GLE Coupé"], ["Naše koberce v Mercedes GLE", "Naše koberce v Mercedesu GLE"]],
  },
  "bmw-3-g20": {
    zaklad: "dvoj",
    h: ["BMW 3 G20/G21 s našimi autokobercami", "BMW 3 G20/G21 s našimi autokoberci"],
    sk: "Pre BMW radu 3 G20 a Touring G21 (od roku 2019) máme hotovú šablónu, aj po modernizácii a pre 330e či xDrive. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je sedan G20 nášho zákazníka s prvou prešívanou vrstvou Diamond a druhou vrstvou s pruhmi. Sedia do ročníkov 2019, 2020, 2021, 2022, 2023, 2024, 2025 aj 2026.",
    cz: "Pro BMW řady 3 G20 a Touring G21 (od roku 2019) máme hotovou šablonu, i po modernizaci a pro 330e či xDrive. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je sedan G20 našeho zákazníka s první prošívanou vrstvou Diamond a druhou vrstvou s pruhy. Pasují do ročníků 2019, 2020, 2021, 2022, 2023, 2024, 2025 i 2026.",
    videa: [["Naše autokoberce v BMW 3 G20", "Naše autokoberce v BMW 3 G20"], ["Autokoberce v BMW 3 G20 zblízka", "Autokoberce v BMW 3 G20 zblízka"], ["Naše koberce v BMW 3 G20", "Naše koberce v BMW 3 G20"], ["Koberce v BMW 3 zblízka", "Koberce v BMW 3 zblízka"]],
  },
  "bmw-5-g30": {
    zaklad: "dvoj",
    h: ["BMW 5 G30/G31 s našimi autokobercami", "BMW 5 G30/G31 s našimi autokoberci"],
    sk: "Pre BMW radu 5 G30 a Touring G31 (2017–2023) máme hotovú šablónu, aj po modernizácii a pre xDrive či plug-in hybrid. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je sedan G30 nášho zákazníka s prvou prešívanou vrstvou Diamond, druhou vrstvou s pruhmi, rohožou a boxom do kufra. Sedia do ročníkov 2017, 2018, 2019, 2020, 2021, 2022 aj 2023.",
    cz: "Pro BMW řady 5 G30 a Touring G31 (2017–2023) máme hotovou šablonu, i po modernizaci a pro xDrive či plug-in hybrid. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je sedan G30 našeho zákazníka s první prošívanou vrstvou Diamond, druhou vrstvou s pruhy, rohoží a boxem do kufru. Pasují do ročníků 2017, 2018, 2019, 2020, 2021, 2022 i 2023.",
    videa: [["Naše autokoberce v BMW 5 G30", "Naše autokoberce v BMW 5 G30"], ["Rohož a box do kufra v BMW 5 G30", "Rohož a box do kufru v BMW 5 G30"], ["Naše koberce v BMW 5 G30", "Naše koberce v BMW 5 G30"], ["Rohož a box do kufra v BMW 5", "Rohož a box do kufru v BMW 5"]],
  },
  "bmw-x7-g07": {
    zaklad: "dvoj",
    h: ["BMW X7 G07 s našimi autokobercami", "BMW X7 G07 s našimi autokoberci"],
    sk: "Pre BMW X7 G07 (od roku 2019) máme hotovú šablónu pre 6 aj 7 miest, aj po modernizácii 2022. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je X7 nášho zákazníka po modernizácii s prvou prešívanou vrstvou Diamond, druhou vrstvou s pruhmi a rohožou do kufra. Sedia do ročníkov 2019, 2020, 2021, 2022, 2023, 2024, 2025 aj 2026.",
    cz: "Pro BMW X7 G07 (od roku 2019) máme hotovou šablonu pro 6 i 7 míst, i po modernizaci 2022. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je X7 našeho zákazníka po modernizaci s první prošívanou vrstvou Diamond, druhou vrstvou s pruhy a rohoží do kufru. Pasují do ročníků 2019, 2020, 2021, 2022, 2023, 2024, 2025 i 2026.",
    videa: [["Naše autokoberce v BMW X7 G07", "Naše autokoberce v BMW X7 G07"], ["Naše koberce v BMW X7", "Naše koberce v BMW X7"]],
  },
  "mercedes-g-class-w463": {
    zaklad: "dvoj",
    h: ["Mercedes G-Class s našimi autokobercami", "Mercedes G-Class s našimi autokoberci"],
    sk: "Pre Mercedes G-Class W463 (2018–2024) máme hotovú šablónu pre všetky verzie vrátane AMG G 63. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je G-Class nášho zákazníka s prvou prešívanou vrstvou Diamond v čiernej farbe s červeným prešitím a čiernou druhou vrstvou. Sedia do ročníkov 2018, 2019, 2020, 2021, 2022, 2023 aj 2024.",
    cz: "Pro Mercedes G-Class W463 (2018–2024) máme hotovou šablonu pro všechny verze včetně AMG G 63. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je G-Class našeho zákazníka s první prošívanou vrstvou Diamond v černé barvě s červeným prošitím a černou druhou vrstvou. Pasují do ročníků 2018, 2019, 2020, 2021, 2022, 2023 i 2024.",
  },
  "mercedes-gls-x167": {
    zaklad: "dvoj",
    h: ["Mercedes GLS s našimi autokobercami", "Mercedes GLS s našimi autokoberci"],
    sk: "Pre Mercedes GLS X167 (od roku 2019) máme hotovú šablónu pre 6 aj 7 miest, pred modernizáciou aj po nej. Autokoberce sedia na celej podlahe – vpredu, v druhom aj treťom rade a v kufri. Na fotkách je 7-miestny GLS nášho zákazníka s prvou prešívanou vrstvou Diamond v tmavohnedej farbe s béžovým prešitím a tmavohnedou druhou vrstvou. Sedia do ročníkov 2019, 2020, 2021, 2022, 2023, 2024, 2025 aj 2026.",
    cz: "Pro Mercedes GLS X167 (od roku 2019) máme hotovou šablonu pro 6 i 7 míst, před modernizací i po ní. Autokoberce kryjí celou podlahu – vpředu, ve druhé i třetí řadě a v kufru. Na fotkách je 7místný GLS našeho zákazníka s první prošívanou vrstvou Diamond v tmavě hnědé barvě s béžovým prošitím a tmavě hnědou druhou vrstvou. Pasují do ročníků 2019, 2020, 2021, 2022, 2023, 2024, 2025 i 2026.",
    videa: [["Naše autokoberce v Mercedes GLS", "Naše autokoberce v Mercedesu GLS"], ["Naše koberce v Mercedes GLS", "Naše koberce v Mercedesu GLS"]],
  },
  "mercedes-eqe": {
    zaklad: "dvoj",
    h: ["Mercedes EQE SUV s našimi autokobercami", "Mercedes EQE SUV s našimi autokoberci"],
    sk: "Pre Mercedes EQE SUV X294 (od roku 2022) máme hotovú šablónu pre všetky verzie vrátane AMG. Autokoberce sedia na celej podlahe – vpredu, v druhom rade aj v kufri. Na fotkách je EQE SUV nášho zákazníka s prvou prešívanou vrstvou Diamond v tmavohnedej farbe s béžovým prešitím, tmavohnedou druhou vrstvou, rohožou do kufra a boxmi do kufra. Sedia do ročníkov 2022, 2023, 2024, 2025 aj 2026.",
    cz: "Pro Mercedes EQE SUV X294 (od roku 2022) máme hotovou šablonu pro všechny verze včetně AMG. Autokoberce kryjí celou podlahu – vpředu, ve druhé řadě i v kufru. Na fotkách je EQE SUV našeho zákazníka s první prošívanou vrstvou Diamond v tmavě hnědé barvě s béžovým prošitím, tmavě hnědou druhou vrstvou, rohoží do kufru a boxy do kufru. Pasují do ročníků 2022, 2023, 2024, 2025 i 2026.",
    videa: [["Naše autokoberce v Mercedes EQE SUV", "Naše autokoberce v Mercedesu EQE SUV"], ["Naše koberce v Mercedes EQE SUV", "Naše koberce v Mercedesu EQE SUV"]],
  },
};

/** Kus rozdelený na sekcie podľa riadkov začínajúcich prvkom s data-lcd-sekcia (prvá = „_hlava“, koreň kusu). */
function sekcie(html) {
  const out = [];
  let cur = { meno: "_hlava", riadky: [] };
  for (const l of lf(html).split("\n")) {
    const m = /^<(?:section|div)[^>]*data-lcd-sekcia="([^"]+)"/.exec(l);
    if (m) { out.push(cur); cur = { meno: m[1], riadky: [] }; }
    cur.riadky.push(l);
  }
  out.push(cur);
  return out.map((s) => ({ meno: s.meno, text: s.riadky.join("\n") }));
}

const chyby = [];
const nahrad = (s, a, b, kde) => {
  if (!s.includes(a)) { chyby.push(`${kde}: nenájdené „${a.slice(0, 100)}“`); return s; }
  return s.split(a).join(b);
};

function prelozGaleriu(t, slug, auto, czZaklad) {
  t = nahrad(t, `<h2 class="lx-h">${auto.h[0]}</h2>`, `<h2 class="lx-h">${auto.h[1]}</h2>`, slug + " nadpis galérie");
  t = nahrad(t, `<p class="lx-p">${auto.sk}</p>`, `<p class="lx-p">${auto.cz}</p>`, slug + " úvod galérie (SK text sa zmenil — upraviť AUTA)");
  for (const [sk, cz] of POPISKY) {
    t = t.split(` · ${sk}"`).join(` · ${cz}"`).split(`Pozrieť: ${sk}<`).join(`Zobrazit: ${cz}<`).split(`<figcaption>${sk}</figcaption>`).join(`<figcaption>${cz}</figcaption>`);
  }
  const cz = new Set(POPISKY.map((p) => p[1]));
  for (const m of t.matchAll(/<figcaption>([^<]*)<\/figcaption>/g)) if (!cz.has(m[1])) chyby.push(`${slug}: nepreložená popiska fotky „${m[1]}“ (doplniť POPISKY)`);
  if (/Pozrieť:/.test(t)) chyby.push(`${slug}: nepreložené „Pozrieť:“ v galérii`);
  // pätka galérie (Rolujte…, Sestavte si set) presne ako v CZ základe
  const dole = /<div class="lx-gal-dole">[\s\S]*?<\/div><\/div>\n/;
  return t.replace(dole, () => dole.exec(czZaklad)[0]);
}

function prelozVideo(r, slug, auto) {
  r = r.split("Prehrať video: ").join("Přehrát video: ").split(">Ukážka<").join(">Ukázka<");
  for (const [sk, cz] of auto.videa || []) {
    r = r.split(`data-p1v-lb-popis="${sk}"`).join(`data-p1v-lb-popis="${cz}"`).split(`video: ${sk}"`).join(`video: ${cz}"`).split(`</i>${sk}</span>`).join(`</i>${cz}</span>`);
  }
  const cz = new Set((auto.videa || []).map((v) => v[1]));
  const popis = /data-p1v-lb-popis="([^"]*)"/.exec(r), cap = /<\/i>([^<]*)<\/span><\/button>/.exec(r);
  if (!popis || !cz.has(popis[1]) || !cap || !cz.has(cap[1])) chyby.push(`${slug}: nepreložené video „${popis ? popis[1] : "?"}“ (doplniť AUTA.${slug}.videa)`);
  return r;
}

// CZ (aj SK pre kontrolu) kus 1 bez obalov WebP — presne to, čo ide do Popisu
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lcd-auta-cz-"));
execFileSync(process.execPath, [path.join(REPO, "tools", "build-admin-html.mjs"), "--vystup", tmp, "--bez-webp"], { stdio: "pipe" });
const kus = (zaklad, web) => sekcie(fs.readFileSync(path.join(tmp, `p1v-${zaklad}-1.${web}.html`), "utf8"));

const vysledok = [], zapis = [];
let zastarane = 0;
for (const [slug, auto] of Object.entries(AUTA)) {
  const skSubor = path.join(AUTO, `p1v-${slug}-1.sk.html`);
  if (!fs.existsSync(skSubor)) { chyby.push(`${slug}: chýba ${skSubor}`); continue; }
  const skText = fs.readFileSync(skSubor, "utf8");
  const skAuto = sekcie(skText), skZ = kus(auto.zaklad, "sk"), czZ = kus(auto.zaklad, "cz");
  const daj = (pole, meno) => (pole.find((x) => x.meno === meno) || {}).text;
  if (daj(skAuto, "_hlava") !== daj(skZ, "_hlava")) { chyby.push(`${slug}: koreň SK stránky auta nesedí so SK kusom ${auto.zaklad} (iné data-lcd-v — najprv obnoviť SK stránku)`); continue; }
  const html = skAuto.map(({ meno, text }) => {
    if (meno === "a-galeria") return prelozGaleriu(text, slug, auto, daj(czZ, "a-galeria"));
    if (meno === "a-referencie") {
      const skR = text.split("\n").filter((r) => r.trim()), skZR = daj(skZ, meno).split("\n"), out = daj(czZ, meno).split("\n");
      skR.forEach((r, i) => { if (!skZR.includes(r)) out.splice(i, 0, prelozVideo(r, slug, auto)); });
      return out.join("\n");
    }
    const t = daj(czZ, meno);
    if (t == null) chyby.push(`${slug}: CZ kus ${auto.zaklad} nemá sekciu ${meno}`);
    return t;
  }).join("\n") + (lf(skText).endsWith("\n") ? "\n" : "");
  const ciel = path.join(AUTO, `p1v-${slug}-1.cz.html`);
  const stare = fs.existsSync(ciel) ? lf(fs.readFileSync(ciel, "utf8")) : null;
  if (stare !== html) zastarane++;
  if (!CHECK && !chyby.length) fs.writeFileSync(ciel, html.replace(/\n/g, "\r\n"));
  vysledok.push(`${stare === html ? "ok   " : CHECK ? "ZMENA" : "nové "} ${path.relative(REPO, ciel)}  ${html.length} zn. (kus ${auto.zaklad}.cz)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(vysledok.join("\n"));
if (chyby.length) { console.log("\nCHYBY (nič sa nezapísalo):\n  " + chyby.join("\n  ")); process.exit(1); }
if (CHECK && zastarane) { console.log(`\n${zastarane} CZ súborov nesedí so SK — spusti node tools/build-auta-cz.mjs`); process.exit(1); }
