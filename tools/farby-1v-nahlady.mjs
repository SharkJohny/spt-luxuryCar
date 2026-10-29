#!/usr/bin/env node
// Zmenšené náhľady fotiek farieb pre dlaždice konfigurátora 1V (Michal 25. 10. 2026: „stránky sa majú rýchlo načítať
// aj na pomalých telefónoch“). Dlaždica farby má 42–126 px (krok Farba, druhá vrstva Lux, okno boxov, box 616), ale
// sťahovala plnú fotku zo Shoptetu (/user/documents/upload/assets/config/<slug>.jpg, 400 × 400, 17–70 kB; 601 = 43 fotiek
// spolu ~1,4 MB). Skript stiahne tie fotky zo živého webu a vyrobí k nim WebP + JPG (záloha pre Safari 13) v šírkach
// SIRKY do assets/img/1v/farby/ (CI ich nahrá na CDN s celým assets/) a manifest pre bundle
// (assets/js/components/konfigurator1v/farby-nahlady-data.js). Bundle (konfigurator1v/farby-nahlady.js) dá náhľady
// len dlaždiciam pod 1V a len farbám z manifestu; src ostáva plná fotka (veľké náhľady ju čítajú ako doteraz).
//
//   node tools/farby-1v-nahlady.mjs                 # stiahne zdroje, vyrobí chýbajúce súbory, prepíše manifest
//   node tools/farby-1v-nahlady.mjs --check         # bez siete: manifest = ZDROJE a každý záznam má všetky súbory
//   node tools/farby-1v-nahlady.mjs --check --zivy  # aj odtlačok fotky na živom webe = manifest (fotku v admine niekto vymenil?)
//   node tools/farby-1v-nahlady.mjs --vypis         # veľkosti: zdroj vs náhľady
//
// Pravidlá:
//  - meno: <slug>-<odtlačok>-w<šírka>.webp|.jpg; odtlačok = prvých 8 znakov sha256 zdrojovej fotky. Nová fotka v admine
//    s rovnakým menom = nový odtlačok = nové súbory (existujúci súbor sa NIKDY neprepisuje — assets/img je spoločné pre
//    všetky verzie webu, production.yml). Pri zmene fotky: spustiť skript, commitnúť nové súbory aj manifest.
//  - šírky 96 / 144 / 192 / 240 px (sizes v bundli, farby-nahlady.js: dlaždica kroku do 480 px 20vw − 20 px, okno boxov
//    20vw − 14 px a do 767 px až 18vw -> telefón 3× dostane 192, okno boxov na 412 px 240, PC 1× 96), nikdy väčšie ako
//    zdroj; pomer strán sa zachová (dlaždica reže object-fit: cover ako doteraz).
//  - WebP kvalita 75 (effort 6), JPG kvalita 85 (mozjpeg): pri textúre kože WebP drží kvalitu (PSNR voči zmenšenému
//    zdroju 30–33 dB) s menšími bajtmi; JPG pri q80 rozmazával Lux (22–24 dB), preto 85.
//  - nová farba v Shoptete (iný slug) náhľad nemá, kým sa nedoplní do ZDROJE -> dlaždica ukáže plnú fotku ako predtým.
//  - CZ (Michal 29. 10. 2026): slug je z českého textu voľby (diamond-barva-kuze-…), fotka je vlastná nahrávka CZ obchodu
//    (www.luxurycardesign.cz/user/documents/upload/assets/config/). Bez náhľadu CZ sťahovala plné fotky (2403: +545 kB).
//    ALIASY_CZ = CZ slug -> SK slug tej istej fotky: CZ dlaždica dostane rovnaké malé náhľady ako SK (žiadne nové súbory).
//    Skript overí, že CZ fotka je tá istá ako SK (zhodný odtlačok, alebo pri 96 px priemerná odchýlka RGB ≤ PRAH_ALIASU —
//    CZ nahrávky sú tie isté fotky s inou JPEG kompresiou, SSIM pri 96–192 px 0,97–0,99) a zapíše ALIASY_FARIEB do manifestu.
//    Pozor: CZ okno boxov „černá, nit bílá“ má bajt po bajte fotku SK „…-sitia-seda“ a „nit šedá“ fotku SK „…-sitia-biela“
//    (alias podľa odtlačku, CZ vzhľad sa nemení).
//  - sharp sa berie z node_modules (devDependencies; v CI sa skript nespúšťa, súbory sú v repe).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ZLOZKA = join(KOREN, "assets/img/1v/farby");
const MANIFEST = join(KOREN, "assets/js/components/konfigurator1v/farby-nahlady-data.js");
const ZDROJ_URL = "https://www.luxurycardesign.sk/user/documents/upload/assets/config/";
export const SIRKY = [96, 144, 192, 240];
const KVALITA_WEBP = 75;
const KVALITA_JPG = 85;

/** Fotky farieb v dlaždiciach 1V (živý web 25. 10. 2026, 13 SK produktov: kroky Farba a Farba 2. vrstvy, okno boxov, box 616).
 *  Slug = createSlug(text možnosti) v components/creatButtons.js. */
export const ZDROJE = [
  // Diamond Line: krok Farba 598/601/619/628/616 (koža + šitie, jednofarebné)
  ...["cierna-farba-sitia-cervena", "cierna-farba-sitia-modra", "cierna-farba-sitia-cierna", "cierna-farba-sitia-bezova",
    "cierna-farba-sitia-siva", "cierna-farba-sitia-bielou", "cierna-farba-sitia-zltou", "cierna-farba-sitia-zelena",
    "cierna-farba-sitia-bronzova", "bezova", "hneda-kava", "hneda", "vinovo-cervena", "cervena", "seda", "oranzova",
    "modra", "fialova"].map((s) => "diamond-farba-koze-" + s),
  // Stripe Line: 613/607/625/634
  ...["cierna-farba-sitia-cervena", "cierna-farba-sitia-cierna", "cierna-farba-sitia-bezova", "bezova", "hneda-kava",
    "hneda", "vinovo-cervena", "cervena"].map((s) => "stripe-farba-koze-" + s),
  // Hexa Line: 610/604/622/631
  ...["cierna-farba-sitia-cervena", "cierna-farba-sitia-cierna", "cierna-farba-sitia-modra"].map((s) => "hexa-farba-koze-" + s),
  // okno boxov (parameter 91 v .box-config) na autokobercoch
  ...["cierna-farba-sitia-cervena", "cierna-farba-sitia-modra", "cierna-farba-sitia-cierna", "cierna-farba-sitia-bezova",
    "cierna-farba-sitia-biela", "cierna-farba-sitia-seda", "hneda-kava", "vinovo-cervena", "bezova"].map((s) => "farba-koze-" + s),
  // druhá vrstva Lux 01–16 (601/604/607, farba2.js)
  ...Array.from({ length: 16 }, (_, i) => "lux-color-" + String(i + 1).padStart(2, "0")),
];

/** CZ obchod: fotky farieb (slug z českého textu voľby) -> SK slug s tou istou fotkou (náhľady SK, pozri hlavičku). */
const ZDROJ_URL_CZ = "https://www.luxurycardesign.cz/user/documents/upload/assets/config/";
const PRAH_ALIASU = 6; // priemerná odchýlka RGB (0–255) pri 96 × 96 px; tie isté fotky 1–4, iná fotka (posunutý vzor) > 10
export const ALIASY_CZ = {
  // okno boxov (parameter v .box-config) — nit bílá/šedá podľa odtlačku (zhodné bajty), ostatné podľa farby
  "barva-kuze-bezova": "farba-koze-bezova",
  "barva-kuze-cerna-barva-siti-bezova": "farba-koze-cierna-farba-sitia-bezova",
  "barva-kuze-cerna-barva-siti-bila": "farba-koze-cierna-farba-sitia-seda",
  "barva-kuze-cerna-barva-siti-cerna": "farba-koze-cierna-farba-sitia-cierna",
  "barva-kuze-cerna-barva-siti-cervena": "farba-koze-cierna-farba-sitia-cervena",
  "barva-kuze-cerna-barva-siti-modra": "farba-koze-cierna-farba-sitia-modra",
  "barva-kuze-cerna-barva-siti-seda": "farba-koze-cierna-farba-sitia-biela",
  "barva-kuze-hneda-kava": "farba-koze-hneda-kava",
  "barva-kuze-vynove-cervena": "farba-koze-vinovo-cervena",
  // Diamond Line: krok Barva 2403/2406/2424/2421/2427
  "diamond-barva-kuze-bezova": "diamond-farba-koze-bezova",
  "diamond-barva-kuze-cerna-barva-siti-bezova": "diamond-farba-koze-cierna-farba-sitia-bezova",
  "diamond-barva-kuze-cerna-barva-siti-bila": "diamond-farba-koze-cierna-farba-sitia-bielou",
  "diamond-barva-kuze-cerna-barva-siti-bronzova": "diamond-farba-koze-cierna-farba-sitia-bronzova",
  "diamond-barva-kuze-cerna-barva-siti-cerna": "diamond-farba-koze-cierna-farba-sitia-cierna",
  "diamond-barva-kuze-cerna-barva-siti-cervena": "diamond-farba-koze-cierna-farba-sitia-cervena",
  "diamond-barva-kuze-cerna-barva-siti-modra": "diamond-farba-koze-cierna-farba-sitia-modra",
  "diamond-barva-kuze-cerna-barva-siti-seda": "diamond-farba-koze-cierna-farba-sitia-siva",
  "diamond-barva-kuze-cerna-barva-siti-zelena": "diamond-farba-koze-cierna-farba-sitia-zelena",
  "diamond-barva-kuze-cerna-barva-siti-zluta": "diamond-farba-koze-cierna-farba-sitia-zltou",
  "diamond-barva-kuze-cervena": "diamond-farba-koze-cervena",
  "diamond-barva-kuze-fialova": "diamond-farba-koze-fialova",
  "diamond-barva-kuze-hneda": "diamond-farba-koze-hneda",
  "diamond-barva-kuze-kavove-hneda": "diamond-farba-koze-hneda-kava",
  "diamond-barva-kuze-modra": "diamond-farba-koze-modra",
  "diamond-barva-kuze-oranzova": "diamond-farba-koze-oranzova",
  "diamond-barva-kuze-seda": "diamond-farba-koze-seda",
  "diamond-barva-kuze-vinove-cervena": "diamond-farba-koze-vinovo-cervena",
  // Hexa Line: 2415/2409/2430/2436
  "hexa-barva-kuze-cerna-barva-siti-cerna": "hexa-farba-koze-cierna-farba-sitia-cierna",
  "hexa-barva-kuze-cerna-barva-siti-cervena": "hexa-farba-koze-cierna-farba-sitia-cervena",
  "hexa-barva-kuze-cerna-barva-siti-modra": "hexa-farba-koze-cierna-farba-sitia-modra",
  // Stripe Line: 2418/2412/2433/2439
  "stripe-barva-kuze-bezova": "stripe-farba-koze-bezova",
  "stripe-barva-kuze-cerna-barva-siti-bezova": "stripe-farba-koze-cierna-farba-sitia-bezova",
  "stripe-barva-kuze-cerna-barva-siti-cerna": "stripe-farba-koze-cierna-farba-sitia-cierna",
  "stripe-barva-kuze-cerna-barva-siti-cervena": "stripe-farba-koze-cierna-farba-sitia-cervena",
  "stripe-barva-kuze-cervena": "stripe-farba-koze-cervena",
  "stripe-barva-kuze-hneda": "stripe-farba-koze-hneda",
  "stripe-barva-kuze-kavove-hneda": "stripe-farba-koze-hneda-kava",
  "stripe-barva-kuze-vinove-cervena": "stripe-farba-koze-vinovo-cervena",
  // druhá vrstva Lux 01–16: CZ slug = SK slug (lux-color-NN, tie isté bajty) -> netreba alias
};

const subor = (slug, odtlacok, w, pripona) => `${slug}-${odtlacok}-w${w}.${pripona}`;

function citajObjekt(text, meno) {
  const m = new RegExp(meno + "\\s*=\\s*(\\{[\\s\\S]*?\\});").exec(text);
  return m ? JSON.parse(m[1]) : {};
}
function citajManifest() {
  if (!existsSync(MANIFEST)) return {};
  return citajObjekt(readFileSync(MANIFEST, "utf8"), "NAHLADY_FARIEB");
}
function citajAliasy() {
  if (!existsSync(MANIFEST)) return { aliasy: {}, odtlacky: {} };
  const t = readFileSync(MANIFEST, "utf8");
  return { aliasy: citajObjekt(t, "ALIASY_FARIEB"), odtlacky: citajObjekt(t, "ODTLACKY_ALIASOV") };
}

const objektJs = (o) => "{\n" + Object.keys(o).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(o[k])},`).join("\n").replace(/,$/, "") + "\n}";

function zapisManifest(zaznamy, aliasy, odtlacky) {
  const text = `// GENEROVANÉ: node tools/farby-1v-nahlady.mjs — ručne neupravovať (pri zmene fotky v admine spustiť skript znova).
// Náhľady fotiek farieb pre dlaždice 1V: slug fotky (/user/documents/upload/assets/config/<slug>.jpg) -> odtlačok zdroja.
// Súbory: assets/img/1v/farby/<slug>-<odtlačok>-w<šírka>.webp|.jpg (šírky SIRKY_NAHLADOV). Používa farby-nahlady.js.
export const SIRKY_NAHLADOV = ${JSON.stringify(SIRKY)};
export const NAHLADY_FARIEB = ${objektJs(zaznamy)};
// CZ obchod: slug CZ fotky -> SK slug tej istej fotky (dlaždica použije náhľady SK; tools/farby-1v-nahlady.mjs ALIASY_CZ).
export const ALIASY_FARIEB = ${objektJs(aliasy)};
// odtlačok CZ fotky pri vytvorení aliasu (len pre --check --zivy; bundle ho nepoužíva)
export const ODTLACKY_ALIASOV = ${objektJs(odtlacky)};
`;
  const tmp = MANIFEST + ".tmp";
  writeFileSync(tmp, text);
  renameSync(tmp, MANIFEST);
}

async function stiahni(slug, zaklad = ZDROJ_URL) {
  const r = await fetch(zaklad + slug + ".jpg", { headers: { "user-agent": "lcd-farby-1v-nahlady" } });
  if (!r.ok) throw new Error(slug + ".jpg -> HTTP " + r.status);
  return Buffer.from(await r.arrayBuffer());
}

const odtlacok = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 8);

function chybajuce(slug, h) {
  return SIRKY.flatMap((w) => ["webp", "jpg"].map((p) => subor(slug, h, w, p))).filter((f) => !existsSync(join(ZLOZKA, f)));
}

async function vyrob() {
  let sharp;
  try { sharp = (await import("sharp")).default; } catch (e) {
    console.error("sharp nie je v node_modules (devDependencies). Napr. junction na iný worktree: cmd /c mklink /J node_modules\\sharp <iný>\\node_modules\\sharp");
    process.exit(2);
  }
  mkdirSync(ZLOZKA, { recursive: true });
  const zaznamy = {};
  const zdrojSk = {}; // slug -> fotka (pre porovnanie CZ aliasov)
  let nove = 0, bajtyZdroj = 0;
  for (const slug of ZDROJE) {
    const buf = await stiahni(slug);
    bajtyZdroj += buf.length;
    const h = odtlacok(buf);
    zaznamy[slug] = h;
    zdrojSk[slug] = buf;
    const meta = await sharp(buf).metadata();
    for (const w of SIRKY) {
      if (w > meta.width) throw new Error(`${slug}: zdroj má ${meta.width} px, menej ako šírka ${w} — uprav SIRKY alebo vynechaj farbu`);
      const zmensena = sharp(buf).resize({ width: w, kernel: "lanczos3" });
      const ciele = [
        ["webp", () => zmensena.clone().webp({ quality: KVALITA_WEBP, effort: 6 }).toBuffer()],
        ["jpg", () => zmensena.clone().jpeg({ quality: KVALITA_JPG, mozjpeg: true }).toBuffer()],
      ];
      for (const [p, fn] of ciele) {
        const ciel = join(ZLOZKA, subor(slug, h, w, p));
        if (existsSync(ciel)) continue; // existujúci súbor sa nikdy neprepisuje
        const data = await fn();
        writeFileSync(ciel + ".tmp", data);
        renameSync(ciel + ".tmp", ciel);
        nove++;
      }
    }
  }
  // CZ aliasy: CZ fotka musí byť tá istá ako SK (zhodný odtlačok, alebo pri 96 px odchýlka ≤ PRAH_ALIASU)
  const aliasy = {}, odtlacky = {};
  const male = async (buf) => sharp(buf).resize(96, 96, { fit: "fill", kernel: "lanczos3" }).removeAlpha().raw().toBuffer();
  for (const [cz, sk] of Object.entries(ALIASY_CZ)) {
    if (!zaznamy[sk]) throw new Error(`alias ${cz} -> ${sk}: SK slug nie je v ZDROJE`);
    const buf = await stiahni(cz, ZDROJ_URL_CZ);
    const h = odtlacok(buf);
    let odch = 0;
    if (h !== zaznamy[sk]) {
      const [a, b] = await Promise.all([male(buf), male(zdrojSk[sk])]);
      for (let i = 0; i < a.length; i++) odch += Math.abs(a[i] - b[i]);
      odch /= a.length;
      if (odch > PRAH_ALIASU) throw new Error(`alias ${cz} -> ${sk}: iná fotka (odchýlka ${odch.toFixed(1)} > ${PRAH_ALIASU}) — oprav ALIASY_CZ`);
    }
    aliasy[cz] = sk;
    odtlacky[cz] = h;
    console.log(`  CZ ${cz.padEnd(46)} -> ${sk.padEnd(46)} ${h === zaznamy[sk] ? "zhodné bajty" : "odchýlka " + odch.toFixed(2)}`);
  }
  zapisManifest(zaznamy, aliasy, odtlacky);
  console.log(`farby-1v-nahlady: ${ZDROJE.length} fotiek (${Math.round(bajtyZdroj / 1024)} kB), nových súborov ${nove}, CZ aliasov ${Object.keys(aliasy).length}, manifest ${MANIFEST.slice(KOREN.length + 1)}`);
}

async function over({ zivy }) {
  const man = citajManifest();
  const chyby = [];
  for (const slug of ZDROJE) if (!man[slug]) chyby.push(`${slug}: chýba v manifeste`);
  for (const slug of Object.keys(man)) {
    if (!ZDROJE.includes(slug)) chyby.push(`${slug}: v manifeste, ale nie v ZDROJE`);
    const ch = chybajuce(slug, man[slug]);
    if (ch.length) chyby.push(`${slug}: chýbajú súbory ${ch.join(", ")}`);
  }
  const { aliasy, odtlacky } = citajAliasy();
  for (const [cz, sk] of Object.entries(ALIASY_CZ)) if (aliasy[cz] !== sk) chyby.push(`CZ ${cz}: alias v manifeste ${aliasy[cz] || "chýba"}, v ALIASY_CZ ${sk}`);
  for (const [cz, sk] of Object.entries(aliasy)) {
    if (!ALIASY_CZ[cz]) chyby.push(`CZ ${cz}: alias v manifeste, ale nie v ALIASY_CZ`);
    if (!man[sk]) chyby.push(`CZ ${cz}: alias na ${sk}, ktorý nemá náhľady`);
    if (!odtlacky[cz]) chyby.push(`CZ ${cz}: chýba odtlačok CZ fotky`);
  }
  if (zivy) {
    for (const slug of ZDROJE) {
      try {
        const h = odtlacok(await stiahni(slug));
        if (man[slug] && man[slug] !== h) chyby.push(`${slug}: fotka na webe sa zmenila (${man[slug]} -> ${h}) — spusti skript bez --check`);
      } catch (e) { chyby.push(e.message); }
    }
    for (const cz of Object.keys(aliasy)) {
      try {
        const h = odtlacok(await stiahni(cz, ZDROJ_URL_CZ));
        if (odtlacky[cz] !== h) chyby.push(`CZ ${cz}: fotka na CZ webe sa zmenila (${odtlacky[cz]} -> ${h}) — spusti skript bez --check`);
      } catch (e) { chyby.push("CZ " + e.message); }
    }
  }
  if (chyby.length) {
    console.error("farby-1v-nahlady --check: " + chyby.length + " problémov\n  " + chyby.join("\n  "));
    process.exit(1);
  }
  console.log(`farby-1v-nahlady --check: OK (${Object.keys(man).length} farieb × ${SIRKY.length} šírok × WebP+JPG, CZ aliasov ${Object.keys(aliasy).length}${zivy ? ", odtlačky = živý web SK aj CZ" : ""})`);
}

function vypis() {
  const man = citajManifest();
  const spolu = { webp: {}, jpg: {} };
  for (const slug of Object.keys(man)) {
    const r = [slug.padEnd(46)];
    for (const w of SIRKY) {
      for (const p of ["webp", "jpg"]) {
        const f = join(ZLOZKA, subor(slug, man[slug], w, p));
        const b = existsSync(f) ? statSync(f).size : 0;
        spolu[p][w] = (spolu[p][w] || 0) + b;
        r.push(`${p}${w} ${String(Math.round(b / 102.4) / 10).padStart(5)}`);
      }
    }
    console.log(r.join("  "));
  }
  for (const p of ["webp", "jpg"]) console.log(p + " spolu: " + SIRKY.map((w) => `${w}: ${Math.round(spolu[p][w] / 1024)} kB`).join(", "));
  const vZlozke = existsSync(ZLOZKA) ? readdirSync(ZLOZKA).length : 0;
  console.log(`súborov v assets/img/1v/farby: ${vZlozke}`);
}

const arg = process.argv.slice(2);
if (arg.includes("--check")) await over({ zivy: arg.includes("--zivy") });
else if (arg.includes("--vypis")) vypis();
else await vyrob();
