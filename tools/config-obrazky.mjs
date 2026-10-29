#!/usr/bin/env node
/* config-obrazky.mjs — obrázky z úložísk webov (Shoptet admin) bajt po bajte v repe (29. 10. 2026).

   Prečo: kód webu čítal fotky farieb, vzorky, ikony hlavičky a obrázky ponúk priamo z úložiska obchodu
   (/user/documents/upload/assets/…): relatívne (úložisko webu, na ktorom stránka beží) aj natvrdo zo SK alebo CZ
   úložiska (jeden súbor pre oba weby). Zmazanie alebo premenovanie súboru v admine by rozbilo SK aj CZ. Teraz je
   každý súbor skopírovaný bajt po bajte (nič sa neprekóduje) v assets/img/ulozisko/ a CI ho nahrá na CDN s celým
   assets/ (production.yml; assets/img je spoločné pre všetky verzie webu — existujúci súbor sa NIKDY neprepisuje).

   Rozloženie (cesta = časť adresy za /user/documents/upload/assets/):
     assets/img/ulozisko/<web>/<cesta>     súbory, ktoré kód bral RELATÍVNE (fotky volieb creatButtons.js, farby Lux
                                            a farby boxov v košíku lcdKosikDoplnok.js, vzory a strana volantu
                                            productPage.js) — každý web má vlastné (SK a CZ fotky sa líšia bajtmi aj menami);
                                            <web> = location.hostname, nový trh = nový priečinok, kód sa nemení
     assets/img/ulozisko/spolocne/<cesta>  súbory, ktoré kód bral NATVRDO z jedného úložiska pre všetky weby (vzorky,
                                            ikony hlavičky, obrázky ponúk kufra a boxov, šípka titulky)
   Kód: functions/ulozisko.js (obrazokUloziska / obrazokSpolocny), zoznam súborov webov functions/ulozisko-data.js
   (GENEROVANÝ týmto skriptom). Súbor, ktorý v zozname nie je (nová farba v admine), ide ako doteraz z úložiska webu.

   Použitie:
     node tools/config-obrazky.mjs                stiahne chýbajúce súbory (nikdy neprepíše existujúci), zapíše ulozisko-data.js
     node tools/config-obrazky.mjs --check        (1) ulozisko-data.js = súbory na disku, (2) žiadny zdroj webu neodkazuje
                                                  na úložisko (okrem VYNIMKY), (3) každý odkaz na img/ulozisko/ v zdrojoch
                                                  má súbor, (4) súbory v repe = úložisko bajt po bajte (sieť, GET)
     node tools/config-obrazky.mjs --check --bez-siete   len (1)–(3)
     node tools/config-obrazky.mjs --check --zivy        aj: fotky volieb na živých produktoch (register testov) a obrázky
                                                  ponúk z data.json, ktoré na úložisku sú, sú v repe (nová farba v admine?)
     node tools/config-obrazky.mjs --inventar [--vystup subor.json]   všetky odkazy na úložiská v zdrojoch, kategórie, HTTP stav

   Fotka zmenená v admine pod tým istým menom: --check (4) hlási rozdiel; spustenie skriptu uloží novú verziu ako
   <meno>~<odtlačok>.<prípona> (starý súbor ostáva, CDN drží súbory rok) a zoznam webu ju priradí k pôvodnej ceste.
   Na web sa dostane až s novou verziou bundla (push -> prepnutie v admine), nie hneď ako predtým.
   Stránky produktov a weby = register testov tools/test-1v/produkty.mjs (SK, CZ, PRODUKTY, PRODUKTY_CZ). */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CIEL = join(KOREN, "assets/img/ulozisko");
const MANIFEST = join(KOREN, "assets/js/functions/ulozisko-data.js");
const SPOLOCNE = "spolocne";
const CESTA_ULOZISKA = "/user/documents/upload/assets/";
const arg = (m) => process.argv.includes(m);
const hodnota = (m) => { const i = process.argv.indexOf(m); return i > 0 ? process.argv[i + 1] : null; };

/** Spoločné súbory: odkiaľ sa berú (úložisko webu, z ktorého ich kód bral natvrdo). Cesta za /user/documents/upload/assets/. */
const ZDROJ_SPOLOCNYCH = [
  // vzorky (vzorky-konfigurator/swatch-data.js, header.js) a ikony hlavičky (_header.scss): SK úložisko
  { web: "www.luxurycardesign.sk", re: /^(config\/(D|S|H|LUX)-\d+\.jpg|image\/(menu|cart)\.svg|(user|cart|searsh)\.svg)$/ },
  // obrázky ponúk kufra a boxov starého vzhľadu (productPage.js, mená z data.json) a šípka titulky (_index.scss): CZ úložisko
  { web: "www.luxurycardesign.cz", re: /^new\/[A-Za-z0-9._-]+$/ },
];
const zdrojSpolocneho = (cesta) => (ZDROJ_SPOLOCNYCH.find((z) => z.re.test(cesta)) || {}).web || null;

/** Zdroje webu, ktoré smú obsahovať adresu úložiska (súbor, presný text, dôvod). Všetko ostatné = chyba --check. */
const VYNIMKY = [
  { subor: "assets/js/functions/ulozisko.js", text: "/user/documents/upload/assets/",
    dovod: "záloha: súbor, ktorý v repe ešte nie je (nová farba v admine), ide z úložiska webu ako predtým" },
  { subor: "assets/js/option.js", text: "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json?",
    dovod: "(c) dynamické dáta konfigurátora (data.json) — nemení sa" },
  { subor: "assets/js/components/konfigurator1v/kamion/data.js", text: "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/documents/upload/assets/config/",
    dovod: "session kamióny: IMG_BASE = zdroj tools/kamion-obrazky.mjs a záloha pre obrázok mimo obrazky.js (web berie všetky z repa)" },
  { subor: "truck/build-truck-images.mjs", text: "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/documents/upload/assets/config/",
    dovod: "session kamióny: starý React kamiónov (lcd-truck.js, ?novy=0) — nemení sa v tejto úlohe" },
  { subor: "assets/css/_header.scss", text: "https://www.nasesojka.czhttps://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/assets/img/search.svg",
    dovod: "(e) mŕtvy odkaz: chybná adresa a súbor 404 — prehliadač ho nikdy nenačíta, nemení sa (vzhľad ostáva)" },
  { subor: "assets/css/luxuryCar.css", text: "https://www.nasesojka.czhttps://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/assets/img/search.svg",
    dovod: "(e) to isté v luxuryCar.css" },
  // (e) mŕtve odkazy na iné Shoptet projekty (404 už dnes, obrázok sa nikdy nezobrazil) — nemenia sa, vzhľad ostáva
  ...[["assets/css/_responsive.scss", "https://677818.myshoptet.com/user/documents/upload/assets/car.png"],
    ["assets/css/_responsive.scss", "https://677818.myshoptet.com/user/documents/upload/assets/note.png"],
    ["assets/css/_productPage.scss", "https://677818.myshoptet.com/user/documents/upload/assets/plus.png"],
    ["assets/css/_index.scss", "https://689946.myshoptet.com/user/documents/upload/assets/image/playButton.png"],
    ["assets/css/_UpsalePopup.scss", "https://704436.myshoptet.com/user/documents/upload/assets/img/popupBack.jpg"]].flatMap(([subor, text]) => [
    { subor, text, dovod: "(e) mŕtvy odkaz (404) na iný Shoptet projekt — nemení sa" },
    { subor: "assets/css/luxuryCar.css", text, dovod: "(e) mŕtvy odkaz (404) na iný Shoptet projekt — nemení sa" }]),
  ...["admin-html/src/p1v-598/41-d-faq", "admin-html/src/p1v-boxy/41-d-faq", "admin-html/src/p1v-classic/41-d-faq",
    "admin-html/src/p1v-dvoj/41-d-faq", "admin-html/src/p1v-premium/41-d-faq", "admin-html/src/p1v-vzorky/40-d-faq"].flatMap((s) =>
    ["sk", "cz"].flatMap((j) => ["lazers.jpg", "videos/porovnani.mp4"].map((f) => ({
      subor: s + "." + j + ".html", text: "https://cdn.myshoptet.com/usr/www.luxurycardesign." + j + "/user/documents/upload/assets/" + f,
      dovod: "(d) obsah FAQ: médium vlastného úložiska toho istého webu (nie kód; admin HTML sa radšej nemení)" })))),
];

// ------------------------------------------------------------------ pomocné
const sha = (b) => createHash("sha256").update(b).digest("hex");
const posix = (p) => p.split(sep).join("/");
function vsetkySubory(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...vsetkySubory(p)); else out.push(p);
  }
  return out;
}
async function stiahni(url) {
  for (let pokus = 0; pokus < 3; pokus++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (LCD config-obrazky)" } });
      if (r.status === 404) return { status: 404 };
      if (!r.ok) throw new Error("HTTP " + r.status);
      return { status: 200, buf: Buffer.from(await r.arrayBuffer()), typ: r.headers.get("content-type") };
    } catch (e) { if (pokus === 2) return { status: 0, chyba: e.message }; await new Promise((r) => setTimeout(r, 800)); }
  }
}
async function paralelne(polozky, n, fn) {
  let i = 0;
  const out = new Array(polozky.length);
  await Promise.all(Array.from({ length: n }, async () => { while (i < polozky.length) { const k = i++; out[k] = await fn(polozky[k], k); } }));
  return out;
}
const createSlug = (text) => String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"); // = components/creatButtons.js

// ------------------------------------------------------------------ zoznam súborov (repo)
/** Súbory na disku: { web: { cesta: súbor } } (súbor ~odtlačok = novšia verzia tej istej cesty), spoločné zvlášť. */
function naDisku() {
  const weby = {}, spolocne = {};
  for (const abs of vsetkySubory(CIEL)) {
    const rel = posix(relative(CIEL, abs));
    const i = rel.indexOf("/");
    const web = rel.slice(0, i), subor = rel.slice(i + 1);
    const cesta = subor.replace(/~[0-9a-f]{8}(\.[a-z0-9]+)$/i, "$1");
    const ciel = web === SPOLOCNE ? spolocne : (weby[web] = weby[web] || {});
    // novšia verzia (~odtlačok) vyhráva nad pôvodným menom; viac verzií = posledná podľa mena súboru je chyba, hlási --check
    if (!ciel[cesta] || subor !== cesta) ciel[cesta] = subor;
  }
  return { weby, spolocne };
}
function textManifestu(weby) {
  const riadky = Object.keys(weby).sort().map((web) => {
    const z = Object.keys(weby[web]).sort().map((c) => (weby[web][c] === c ? c : c + ">" + weby[web][c]));
    return "  " + JSON.stringify(web) + ": [\n" + z.map((x) => "    " + JSON.stringify(x)).join(",\n") + "\n  ]";
  });
  return "// GENEROVANÉ: node tools/config-obrazky.mjs — ručne neupravovať.\n" +
    "// Súbory úložísk webov skopírované bajt po bajte do assets/img/ulozisko/<web>/<cesta> (cesta za /user/documents/upload/assets/).\n" +
    "// \"cesta>súbor\" = fotka zmenená v admine po prvom stiahnutí, uložená pod novým menom. Používa functions/ulozisko.js.\n" +
    "export const ULOZISKO_WEBY = {\n" + riadky.join(",\n") + "\n};\n";
}

// ------------------------------------------------------------------ kandidáti (živé weby)
async function produktyPodlaWebu() {
  const P = await import(pathToFileURL(join(KOREN, "tools/test-1v/produkty.mjs")).href);
  const weby = {};
  for (const p of [...Object.values(P.PRODUKTY), ...Object.values(P.PRODUKTY_CZ)]) {
    const u = new URL(p.url);
    (weby[u.hostname] = weby[u.hostname] || new Set()).add(p.url);
  }
  return Object.fromEntries(Object.entries(weby).map(([w, s]) => [w, [...s]]));
}
/** Cesty, ktoré kód webu číta relatívne: fotky volieb (creatButtons.js: všetky <option> selectov produktu, .png pri
 *  „rad“/„řada“, bez „cm“), farby Lux 01–16 a farby boxov (lcdKosikDoplnok.js), vzory a volant (productPage.js). */
async function kandidatiWebu(web, adresy, log) {
  const { JSDOM } = await import("jsdom");
  const cesty = new Set();
  for (const url of adresy) {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (LCD config-obrazky)" } });
    if (!r.ok) { log("  POZOR " + url + " -> " + r.status); continue; }
    const doc = new JSDOM(await r.text()).window.document;
    for (const o of doc.querySelectorAll("select option")) {
      if (!o.getAttribute("value")) continue;
      const t = o.textContent;
      if (t.includes("cm")) continue;
      const slug = createSlug(t.split("+")[0]);
      if (slug) cesty.add("config/" + slug + (t.includes("rad") || t.includes("řada") ? ".png" : ".jpg"));
    }
  }
  for (let n = 1; n <= 16; n++) cesty.add("config/lux-color-" + String(n).padStart(2, "0") + ".jpg");
  for (const f of ["banners/diamont.jpg", "banners/hesaline.jpg", "banners/stripe-line.jpg", "image/Layer_left.png", "image/Layer_right.png"]) cesty.add(f);
  return [...cesty].sort();
}
/** Spoločné: vzorky (swatch-data.js VZORKY_ITEMS), ikony hlavičky, obrázky ponúk (data.json settings, 3 predpony vzoru), šípka. */
async function kandidatiSpolocni() {
  const sw = readFileSync(join(KOREN, "assets/js/vzorky-konfigurator/swatch-data.js"), "utf8");
  const vzorky = [...new Set([...sw.matchAll(/"(?:D|S|H|LUX)-\d+"(?=\s*:\s*\{)/g)].map((m) => m[0].slice(1, -1)))];
  const dj = await (await fetch("https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json")).json();
  const mena = [...new Set([dj.settings.carpetsImage, dj.settings.boxsImage].join(",").split(",").map((s) => s.trim()).filter(Boolean))];
  return [
    ...vzorky.map((id) => "config/" + id + ".jpg"),
    "image/menu.svg", "image/cart.svg", "user.svg", "cart.svg", "searsh.svg",
    ...["", "hexa-", "stripe-"].flatMap((p) => mena.map((m) => "new/" + p + m)),
    "new/arrow-pijl.gif",
  ].sort();
}

// ------------------------------------------------------------------ zdroje webu
/** Súbory repa (sledované aj nové, bez ignorovaných), ktoré idú na web (zdroje bundla, CSS, admin HTML, dáta, generátory dát bundla). */
function zdrojeWebu() {
  const vsetky = execSync("git ls-files --cached --others --exclude-standard", { cwd: KOREN, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\n").filter(Boolean);
  return vsetky.filter((f) =>
    (/^assets\/js\/.+\.(js|jsx|mjs)$/.test(f) && !/^assets\/js\/(luxuryCar|luxuryCarOld|lcd-truck|lcd-gsap|lcd-reels|lcd-hp)\.js$/.test(f) &&
      !/\.gen\.jsx$/.test(f) && !/\/test-[^/]+\.mjs$/.test(f)) ||
    (/^assets\/css\/.+\.(scss|css)$/.test(f) && !/luxuryCarOld\.css$|\.min\.css$/.test(f)) ||
    /^admin-html\/src\/.+\.html$/.test(f) ||
    /^assets\/.+\.json$/.test(f) ||
    /^assets\/poukazka\/.+\.js$/.test(f) ||
    /^(truck|vzorky)\/[^/]+\.mjs$/.test(f));
}
let esb = null;
async function bezKomentarov(f, text) {
  if (/\.html$/.test(f)) return text.replace(/<!--[\s\S]*?-->/g, "");
  if (/\.json$/.test(f)) return text;
  if (/\.scss$/.test(f)) return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/([;{}])[ \t]*\/\/.*$/gm, "$1");
  if (esb === null) { try { esb = await import("esbuild"); } catch { esb = false; } }
  if (esb) {
    try {
      const loader = /\.css$/.test(f) ? "css" : /\.jsx$/.test(f) ? "jsx" : "js";
      return esb.transformSync(text, { loader, minifyWhitespace: true, legalComments: "none", logLevel: "silent" }).code;
    } catch { /* nepodarený rozbor -> hrubé odstránenie komentárov */ }
  }
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
// adresa úložiska obchodu: doména webu, Shoptet CDN webu alebo projektu (číslo.myshoptet.com), relatívna v úvodzovkách/url(
const RE_ULOZISKO = /(?:https?:)?\/\/(?:www\.)?luxurycardesign\.[a-z]{2,}\/user\/documents\/[^"'`)\s]*|(?:https?:)?\/\/cdn\.myshoptet\.com\/usr\/(?!shoptet\.jankucera\.work\/)[a-z0-9.-]+\/user\/documents\/[^"'`)\s]*|(?:https?:)?\/\/[0-9]+\.myshoptet\.com\/user\/documents\/[^"'`)\s]*|(?<=["'`(])\/user\/documents\/upload\/[^"'`)\s]*/g;
const RE_REPO = /img\/ulozisko\/((?:[a-z0-9.-]+)\/[A-Za-z0-9._\/~-]+\.[A-Za-z0-9]+)/g;

async function skontrolujZdroje() {
  const chyby = [], vynimky = [], odkazyRepo = [];
  for (const f of zdrojeWebu()) {
    const surovy = readFileSync(join(KOREN, f), "utf8");
    if (!/user\/documents|img\/ulozisko\//.test(surovy)) continue;
    const t = await bezKomentarov(f, surovy);
    for (const m of t.matchAll(RE_ULOZISKO)) {
      const v = VYNIMKY.find((x) => x.subor === f && (m[0] === x.text || x.text.startsWith(m[0]) || m[0].startsWith(x.text) || x.text.endsWith(m[0])));
      if (v) vynimky.push(f + ": " + m[0] + " — " + v.dovod);
      else chyby.push(f + ": " + m[0]);
    }
    for (const m of t.matchAll(RE_REPO)) odkazyRepo.push({ f, cesta: m[1] });
  }
  return { chyby, vynimky, odkazyRepo };
}

// ------------------------------------------------------------------ režimy
async function rezimStiahni() {
  const log = console.log;
  const { weby: disk, spolocne: diskSp } = naDisku();
  const produkty = await produktyPodlaWebu();
  const ulohy = [];
  for (const [web, adresy] of Object.entries(produkty)) {
    const cesty = await kandidatiWebu(web, adresy, log);
    log(web + ": " + adresy.length + " produktov, " + cesty.length + " kandidátov");
    for (const c of cesty) ulohy.push({ web, cesta: c, priecinok: web, url: "https://" + web + CESTA_ULOZISKA + c, mam: disk[web] && disk[web][c] });
  }
  for (const c of await kandidatiSpolocni()) {
    const web = zdrojSpolocneho(c);
    if (!web) throw new Error("spoločný súbor bez zdroja (ZDROJ_SPOLOCNYCH): " + c);
    ulohy.push({ web, cesta: c, priecinok: SPOLOCNE, url: "https://" + web + CESTA_ULOZISKA + c, mam: diskSp[c] });
  }
  let nove = 0, zmenene = 0, rovnake = 0, chyba = 0, bajty = 0;
  const neexistuje = [];
  await paralelne(ulohy, 4, async (u) => {
    const r = await stiahni(u.url);
    if (r.status === 404) { neexistuje.push(u.priecinok + "/" + u.cesta); return; }
    if (r.status !== 200) { chyba++; log("  CHYBA " + u.url + " -> " + (r.chyba || r.status)); return; }
    const cielovy = (s) => join(CIEL, u.priecinok, ...s.split("/"));
    if (u.mam) {
      if (sha(readFileSync(cielovy(u.mam))) === sha(r.buf)) { rovnake++; return; }
      if (u.priecinok === SPOLOCNE) { chyba++; log("  ZMENENÝ spoločný súbor (rieš ručne, odkaz je natvrdo v kóde/CSS): " + u.cesta); return; }
      const nove_meno = u.cesta.replace(/(\.[a-z0-9]+)$/i, "~" + sha(r.buf).slice(0, 8) + "$1");
      if (!existsSync(cielovy(nove_meno))) { mkdirSync(dirname(cielovy(nove_meno)), { recursive: true }); writeFileSync(cielovy(nove_meno), r.buf); }
      zmenene++; bajty += r.buf.length; log("  zmenená v admine: " + u.priecinok + "/" + u.cesta + " -> " + nove_meno);
      return;
    }
    mkdirSync(dirname(cielovy(u.cesta)), { recursive: true });
    writeFileSync(cielovy(u.cesta), r.buf);
    nove++; bajty += r.buf.length;
  });
  writeFileSync(MANIFEST, textManifestu(naDisku().weby));
  log(`nové ${nove}, zmenené ${zmenene}, bez zmeny ${rovnake}, na úložisku nie sú (404, kód ich nepoužije) ${neexistuje.length}, chyby ${chyba}; ` +
    `zapísané ${(bajty / 1048576).toFixed(2)} MB -> assets/img/ulozisko/, zoznam -> assets/js/functions/ulozisko-data.js`);
  if (arg("--vypis-404")) log(neexistuje.sort().join("\n"));
  process.exit(chyba ? 1 : 0);
}

async function rezimCheck() {
  let zle = 0;
  const { weby, spolocne } = naDisku();
  // (1) zoznam = disk
  const ok1 = existsSync(MANIFEST) && readFileSync(MANIFEST, "utf8").replace(/\r\n/g, "\n") === textManifestu(weby);
  console.log((ok1 ? "OK " : "CHYBA ") + "(1) functions/ulozisko-data.js " + (ok1 ? "sedí so súbormi" : "nesedí so súbormi v assets/img/ulozisko/ (spusti node tools/config-obrazky.mjs)") +
    ` — ${Object.entries(weby).map(([w, o]) => w + " " + Object.keys(o).length).join(", ")}, spoločné ${Object.keys(spolocne).length}`);
  if (!ok1) zle++;
  // (2) zdroje bez úložiska, (3) odkazy na repo majú súbor
  const z = await skontrolujZdroje();
  if (z.chyby.length) { zle++; console.log("CHYBA (2) zdroje webu odkazujú na úložisko (" + z.chyby.length + "):\n  " + z.chyby.join("\n  ")); }
  else console.log("OK (2) žiadny zdroj webu neodkazuje na úložisko (povolené výnimky: " + z.vynimky.length + ")");
  if (arg("--vypis")) console.log("  " + z.vynimky.join("\n  "));
  const chybajuce = z.odkazyRepo.filter((o) => !existsSync(join(CIEL, ...o.cesta.split("/"))));
  if (chybajuce.length) { zle++; console.log("CHYBA (3) odkaz na img/ulozisko/ bez súboru v repe:\n  " + chybajuce.map((o) => o.f + ": " + o.cesta).join("\n  ")); }
  else console.log("OK (3) " + z.odkazyRepo.length + " odkazov na img/ulozisko/ v zdrojoch, všetky súbory sú v repe");
  // spoločné: každý má zdroj
  const bezZdroja = Object.keys(spolocne).filter((c) => !zdrojSpolocneho(c));
  if (bezZdroja.length) { zle++; console.log("CHYBA spoločné súbory bez zdroja v ZDROJ_SPOLOCNYCH: " + bezZdroja.join(", ")); }
  // (4) bajt po bajte s úložiskom
  if (!arg("--bez-siete")) {
    const ulohy = [];
    for (const [web, o] of Object.entries(weby)) for (const [c, s] of Object.entries(o)) ulohy.push({ url: "https://" + web + CESTA_ULOZISKA + c, subor: join(CIEL, web, ...s.split("/")), meno: web + "/" + s });
    for (const [c, s] of Object.entries(spolocne)) if (zdrojSpolocneho(c)) ulohy.push({ url: "https://" + zdrojSpolocneho(c) + CESTA_ULOZISKA + c, subor: join(CIEL, SPOLOCNE, ...s.split("/")), meno: SPOLOCNE + "/" + s });
    const zlo = [];
    await paralelne(ulohy, 4, async (u) => {
      const r = await stiahni(u.url);
      if (r.status !== 200) zlo.push(u.meno + ": úložisko " + (r.chyba || r.status) + " (súbor v admine zmazaný/premenovaný? web ide z repa, nič sa nerozbije)");
      else if (sha(r.buf) !== sha(readFileSync(u.subor))) zlo.push(u.meno + ": iné bajty ako " + u.url + " (fotka v admine vymenená -> spusti node tools/config-obrazky.mjs)");
    });
    if (zlo.length) { zle++; console.log("CHYBA (4) repo ≠ úložisko (" + zlo.length + " z " + ulohy.length + "):\n  " + zlo.sort().join("\n  ")); }
    else console.log("OK (4) " + ulohy.length + " súborov v repe = úložisko bajt po bajte");
  }
  // --zivy: nová fotka na živom webe, ktorá v repe nie je
  if (arg("--zivy")) {
    const chyba = [];
    const produkty = await produktyPodlaWebu();
    for (const [web, adresy] of Object.entries(produkty)) {
      const cesty = (await kandidatiWebu(web, adresy, console.log)).filter((c) => !(weby[web] && weby[web][c]));
      await paralelne(cesty, 4, async (c) => { const r = await stiahni("https://" + web + CESTA_ULOZISKA + c); if (r.status === 200) chyba.push(web + "/" + c); });
    }
    for (const c of await kandidatiSpolocni()) if (!spolocne[c]) { const r = await stiahni("https://" + zdrojSpolocneho(c) + CESTA_ULOZISKA + c); if (r.status === 200) chyba.push(SPOLOCNE + "/" + c); }
    if (chyba.length) { zle++; console.log("CHYBA --zivy: na úložisku sú súbory, ktoré kód číta, ale v repe nie sú (spusti node tools/config-obrazky.mjs):\n  " + chyba.join("\n  ")); }
    else console.log("OK --zivy: všetky fotky volieb živých produktov a obrázky ponúk sú v repe");
  }
  console.log(zle ? "NESEDÍ (" + zle + ")" : "OK: všetko sedí");
  process.exit(zle ? 1 : 0);
}

/** Inventár: všetky odkazy na úložiská (aj /user/shop/, logá) v zdrojoch webu + kategória + HTTP stav. */
async function rezimInventar() {
  const RE_VSETKO = /(?:(?:https?:)?\/\/(?:www\.)?luxurycardesign\.[a-z]{2,}|(?:https?:)?\/\/cdn\.myshoptet\.com\/usr\/(?!shoptet\.jankucera\.work\/)[a-z0-9.-]+|(?:https?:)?\/\/[0-9]+\.myshoptet\.com)?\/user\/(?:documents|shop|logos|front_images)\/[^"'`)\s<>]*/g;
  const odkazy = [];
  for (const f of zdrojeWebu()) {
    const t = await bezKomentarov(f, readFileSync(join(KOREN, f), "utf8"));
    for (const m of t.matchAll(RE_VSETKO)) {
      if (m.index > 0 && /[a-z0-9.-]$/i.test(t[m.index - 1]) && !/^(https?:)?\/\//.test(m[0])) continue; // časť inej adresy
      odkazy.push({ subor: f, odkaz: m[0] });
    }
  }
  const kat = (o) => {
    const u = o.odkaz;
    if (/\/user\/(shop|logos|front_images)\//.test(u)) return "b";
    if (/data\.json/.test(u)) return "c";
    if (/^admin-html\//.test(o.subor) && /(lazers\.jpg|porovnani\.mp4)/.test(u)) return "d";
    if (/nasesojka|\/\/(689946|677818|704436)\.myshoptet\.com/.test(u) || /assets\/img\/search\.svg|assets\/boxy\.jpg/.test(u)) return "e";
    if (/kamion\/data\.js$|^truck\//.test(o.subor)) return "kamiony";
    return "a";
  };
  const unik = new Map();
  for (const o of odkazy) { o.kat = kat(o); const k = o.odkaz.replace(/^\/\//, "https://"); if (!unik.has(k)) unik.set(k, { odkaz: k, kat: o.kat, subory: new Set() }); unik.get(k).subory.add(o.subor); }
  const zoznam = [...unik.values()];
  await paralelne(zoznam, 4, async (z) => {
    if (!/^https?:\/\//.test(z.odkaz) || /[`$]|\/$|\?$/.test(z.odkaz)) { z.http = "relatívne/šablóna"; return; }
    try { const r = await fetch(z.odkaz.replace(/[?&]$/, ""), { method: "GET" }); z.http = r.status; } catch (e) { z.http = "chyba " + e.message; }
  });
  const sumar = {};
  for (const o of odkazy) { sumar[o.kat] = sumar[o.kat] || { vyskytov: 0, unikatnych: 0 }; sumar[o.kat].vyskytov++; }
  for (const z of zoznam) sumar[z.kat].unikatnych++;
  const vystup = { sumar, odkazy: zoznam.map((z) => ({ ...z, subory: [...z.subory] })).sort((a, b) => a.kat.localeCompare(b.kat) || a.odkaz.localeCompare(b.odkaz)) };
  if (hodnota("--vystup")) writeFileSync(hodnota("--vystup"), JSON.stringify(vystup, null, 1));
  console.log(JSON.stringify(sumar));
  for (const z of vystup.odkazy) console.log(z.kat + "  " + z.http + "  " + z.odkaz + "  <- " + z.subory.join(", "));
}

if (arg("--check")) await rezimCheck();
else if (arg("--inventar")) await rezimInventar();
else await rezimStiahni();
