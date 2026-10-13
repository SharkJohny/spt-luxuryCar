#!/usr/bin/env node
// E2E test konfigurátora 1V na ŽIVÝCH stránkach SK produktov s LOKÁLNYM buildom (13. 10. 2026; T0.2 14. 10. 2026:
// --produkt pre 13 SK produktov + vzorkovník 637). JADRO — mení len vydanie (scenáre typov sú v scenare-<typ>.mjs).
// Ovládače krokov sú v tools/test-1v/ovladac-<krok>.mjs (každý patrí jednému workerovi), kontrakt docs/1v-kontrakt.md,
// profily produktov (URL, typ, očakávané priceId a ceny z plan.md §4) v tools/test-1v/produkty.mjs.
//
//   node tools/test-konfigurator-1v.mjs                      # 598, sada scenárov z profilu, 1280 aj 390, flag vypnutý
//   node tools/test-konfigurator-1v.mjs --novy               # to isté s ?novy=1 (nový vzhľad, ovládače `novy`)
//   node tools/test-konfigurator-1v.mjs --vyvoj --produkt 601 # ?novy=vyvoj: aj nevydané typy (rozpracovaný nový vzhľad)
//   node tools/test-konfigurator-1v.mjs --produkt 598,610 | all | typ:dvoj | typ:kufor | jedno-hexa | boxy | vzorky
//   node tools/test-konfigurator-1v.mjs --sirka 390 --krok platne,box-2 --snimky C:/tmp/snimky --vypis
//   node tools/test-konfigurator-1v.mjs --zdroj cdn --produkt all --sirka 1280 --paralelne 2 --json %TEMP%/1v-baseline.json
//   node tools/test-konfigurator-1v.mjs --zdroj 5db0f33      # verzia nahratá na CDN (assets/v/<sha>/)
//   (--krok bez --produkt spustí scenáre na 598; scenár iného typu sa na produkte nespustí a len sa spočíta;
//    --limit 180 = s na scenár, --opakuj 1 = zlyhaný scenár sa raz zopakuje, vo výpise „OK*“ + prvé zlyhanie)
//
// Ako: Chrome bez okna (surový CDP, žiadne npm balíky). Požiadavky na bundle a CSS živého webu
// (…/eshopy/luxuryCar/assets/v/<sha>/js/luxuryCar.js, …/css/luxuryCar.css) dostanú odpoveď z čerstvého lokálneho
// buildu: esbuild assets/js/main.js s rovnakými prepínačmi ako .github/workflows/production.yml + CSS z
// tools/vloz-lcd-css.py --vystup (aktuálne partialy, repo ostane nezmenené) — oboje do vlastného dočasného
// priečinka každého behu. …/assets/img/1v/* -> lokálne assets/img/1v/*.
// Bezpečnosť: každý POST /action/Cart/addCartItem sa zachytí a ZRUŠÍ (test kontroluje jeho telo), iný POST na /action/
// sa zruší a test zlyhá; merače (GA, GTM, FB, TikTok, Hotjar…) sú zablokované; cookie lišta sa odmietne;
// žiadna objednávka, žiadne prihlásenie, žiadny admin. Živý web šetri: --paralelne 2.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { cislo } from "./test-1v/stary-ui.mjs";
import { PRODUKTY, PORADIE, INY, TYPY_TEST, VSETKY_TYPY, vyberProdukty, produktPodlaUrl } from "./test-1v/produkty.mjs";
import * as ovlKroky from "./test-1v/ovladac-kroky.mjs";
import * as ovlRozlozenie from "./test-1v/ovladac-rozlozenie.mjs";
import * as ovlKuforBoxy from "./test-1v/ovladac-kufor-boxy.mjs";
import * as ovlCena from "./test-1v/ovladac-cena.mjs";
import * as ovlFarba2 from "./test-1v/ovladac-farba2.mjs";
import * as ovlBoxy from "./test-1v/ovladac-boxy-produkt.mjs";
import * as ovlVzorky from "./test-1v/ovladac-vzorky.mjs";
import * as scJedno from "./test-1v/scenare-jedno.mjs";
import * as scDvoj from "./test-1v/scenare-dvoj.mjs";
import * as scKufor from "./test-1v/scenare-kufor.mjs";
import * as scBoxy from "./test-1v/scenare-boxy.mjs";
import * as scVzorky from "./test-1v/scenare-vzorky.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/";
const AUTO = { znacka: "Audi", model: "A6", rok: "2015", typ: "Combi" }; // Combi = TYP s príplatkom
const MERACE = [
  "*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*",
  "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*",
];

// ------------------------------------------------------------------ prepínače
function argumenty(argv) {
  const a = { novy: false, flag: null, sirky: [1280, 390], kroky: null, snimky: null, zdroj: "lokal", url: null, produkt: null, zapnute: null, paralelne: 3, okno: false, vypis: false, json: null, bezDrop: false, limit: 180, opakuj: 1 };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new Error(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--novy") { a.novy = true; a.flag = "1"; }
    else if (x === "--vyvoj") { a.novy = true; a.flag = "vyvoj"; }
    else if (x === "--produkt") a.produkt = dalsi();
    else if (x === "--zapnute") a.zapnute = dalsi().split(",").map((s) => s.trim()).filter(Boolean);
    else if (x === "--sirka") a.sirky = dalsi().split(",").map((s) => Number(s.trim())).filter(Boolean);
    else if (x === "--krok") a.kroky = dalsi().split(",").map((s) => s.trim()).filter(Boolean);
    else if (x === "--snimky") a.snimky = resolve(dalsi());
    else if (x === "--zdroj") a.zdroj = dalsi();
    else if (x === "--url") a.url = dalsi();
    else if (x === "--paralelne") a.paralelne = Math.max(1, Number(dalsi()) || 1);
    else if (x === "--okno") a.okno = true;
    else if (x === "--vypis") a.vypis = true;
    else if (x === "--json") a.json = resolve(dalsi());
    else if (x === "--bez-drop") a.bezDrop = true;
    else if (x === "--limit") a.limit = Math.max(30, Number(dalsi()) || 180); // s na jeden scenár
    else if (x === "--opakuj") a.opakuj = Math.max(0, Number(dalsi()) || 0); // zlyhaný scenár zopakovať N-krát (OK* vo výpise)
    else if (x === "--help" || x === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 15).join("\n")); process.exit(0); }
    else throw new Error("neznámy prepínač " + x);
  }
  if (argv.includes("--novy") && argv.includes("--vyvoj")) throw new Error("--novy a --vyvoj naraz nejde");
  return a;
}

/**
 * Ktoré produkty má nový vzhľad zapnuté pre ?novy=1 a ?novy=vyvoj — z lokálneho zdroja brány
 * (assets/js/components/konfigurator1v/produkty.js: PRODUKTY_1V + ZAPNUTE_TYPY; pred T0.1 index.js ZOZNAM_1V).
 * --zapnute <typ,…> prepíše ZAPNUTE_TYPY (napr. pri --zdroj <sha> so starším stromom). -> { "1": Set, vyvoj: Set, popis }
 */
function zapnuteProdukty(a) {
  const sk = PORADIE.map(Number);
  const cesta = join(KOREN, "assets/js/components/konfigurator1v/produkty.js");
  if (!existsSync(cesta)) {
    const src = readFileSync(join(KOREN, "assets/js/components/konfigurator1v/index.js"), "utf8");
    const z = /ZOZNAM_1V\s*=\s*\{\s*562035\s*:\s*\[([^\]]*)\]/.exec(src);
    const ids = z ? z[1].split(",").map((x) => Number(x.trim())).filter(Boolean) : [];
    return { 1: new Set(ids), vyvoj: new Set(), popis: "konfigurator1v/index.js ZOZNAM_1V 562035 = " + JSON.stringify(ids) + " (pred T0.1, ?novy=vyvoj nepozná)" };
  }
  const src = readFileSync(cesta, "utf8");
  const registr = [];
  for (const m of src.matchAll(/\b(\d{3,4})\s*:\s*\{\s*typ\s*:\s*["']([a-z-]+)["']/g)) if (sk.includes(Number(m[1])) && !registr.includes(Number(m[1]))) registr.push(Number(m[1]));
  const z = /ZAPNUTE_TYPY\s*=\s*\[([^\]]*)\]/.exec(src);
  if (!z && !a.zapnute) throw new Error("ZAPNUTE_TYPY v " + cesta + " nenájdené (test číta bránu zo zdroja; alebo --zapnute <typy>)");
  const typy = a.zapnute || [...z[1].matchAll(/["']([a-z-]+)["']/g)].map((x) => x[1]);
  return {
    1: new Set(registr.filter((id) => typy.includes(PRODUKTY[id].typ))), vyvoj: new Set(registr),
    popis: "konfigurator1v/produkty.js: ZAPNUTE_TYPY " + JSON.stringify(typy) + (a.zapnute ? " (--zapnute)" : "") + ", register " + registr.length + " SK produktov",
  };
}

// ------------------------------------------------------------------ build
function esbuild() {
  if (process.env.ESBUILD_BINARY_PATH && existsSync(process.env.ESBUILD_BINARY_PATH)) return { cmd: process.env.ESBUILD_BINARY_PATH, pred: [], shell: false };
  const plat = process.platform + "-" + process.arch;
  const bin = join(KOREN, "node_modules", "@esbuild", plat, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
  if (existsSync(bin)) return { cmd: bin, pred: [], shell: false };
  // node_modules v gite má len binárku pre Mac -> rovnaká verzia z cache npx (mimo repa, nič sa neinštaluje do projektu).
  // npx beží MIMO repa (cwd = dočasný priečinok), inak by siahol na node_modules/.bin/esbuild repa (Mac, na Windows nejde).
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  return { cmd: process.platform === "win32" ? "npx.cmd" : "npx", pred: ["--yes", "esbuild@" + ver], shell: process.platform === "win32", mimoRepa: true };
}

// Balíky z package.json "dependencies", ktoré v node_modules repa nie sú (node_modules je v gite len čiastočne: gsap,
// lenis chýbajú; CI si ich doinštaluje cez yarn install). Test ich NEinštaluje do repa — stiahne presné verzie z yarn.lock
// do cache mimo repa (%LOCALAPPDATA%/lcd-1v-test/balicky-*) a esbuild ich nájde cez NODE_PATH.
function verziaZLocku(meno) {
  try {
    const lock = readFileSync(join(KOREN, "yarn.lock"), "utf8");
    const m = new RegExp('^"?' + meno.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "@[^\\n]*:\\r?\\n\\s+version \"([^\"]+)\"", "m").exec(lock);
    return m ? m[1] : null;
  } catch { return null; }
}
function chybajuceBalicky() {
  const pkg = JSON.parse(readFileSync(join(KOREN, "package.json"), "utf8"));
  const chyba = Object.keys(pkg.dependencies || {}).filter((n) => !existsSync(join(KOREN, "node_modules", n, "package.json")));
  if (!chyba.length) return null;
  const spec = chyba.map((n) => n + "@" + (verziaZLocku(n) || pkg.dependencies[n]));
  const kluc = spec.join(",").replace(/[^a-z0-9.,@-]/gi, "_").slice(0, 80);
  const dir = join(process.env.LOCALAPPDATA || tmpdir(), "lcd-1v-test", "balicky-" + kluc);
  if (!chyba.every((n) => existsSync(join(dir, "node_modules", n, "package.json")))) {
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), '{ "private": true }\n');
    console.log("  balíky mimo repa (chýbajú v node_modules repa): " + spec.join(" ") + " -> " + dir);
    spusti(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...spec], { shell: process.platform === "win32", popis: "npm install (cache testu)", cwd: dir });
  }
  return join(dir, "node_modules");
}

function python() {
  const kandidati = [process.env.LCD_PYTHON && [process.env.LCD_PYTHON], ["python"], ["python3"], ["py", "-3"]].filter(Boolean);
  for (const k of kandidati) {
    const r = spawnSync(k[0], [...k.slice(1), "--version"], { encoding: "utf8" });
    if (r.status === 0) return k;
  }
  throw new Error("python nenájdený (nastav LCD_PYTHON)");
}

function spusti(cmd, args, { shell = false, popis, cwd = KOREN, env } = {}) {
  const moznosti = { cwd, env: env || process.env, encoding: "utf8", shell, maxBuffer: 64 * 1024 * 1024 };
  // s shell (npx.cmd / npm.cmd na Windows) jeden riadok príkazu s úvodzovkami (pole argumentov + shell Node odmieta)
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), moznosti)
    : spawnSync(cmd, args, moznosti);
  if (r.status !== 0) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
  return r;
}

async function priprav(a) {
  if (a.zdroj === "cdn") return { popis: "živý CDN bez zmeny", js: null, css: null };
  if (/^[0-9a-f]{7,40}$/i.test(a.zdroj) && a.zdroj !== "lokal") {
    const st = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + " -> " + r.status); return Buffer.from(await r.arrayBuffer()); };
    return { popis: "CDN verzia " + a.zdroj, js: await st(CDN + "v/" + a.zdroj + "/js/luxuryCar.js?v=" + a.zdroj), css: await st(CDN + "v/" + a.zdroj + "/css/luxuryCar.css?v=" + a.zdroj) };
  }
  if (a.zdroj !== "lokal") throw new Error("--zdroj je lokal | cdn | <sha>");
  const tmp = mkdtempSync(join(tmpdir(), "lcd-1v-build-"));
  const t0 = Date.now();
  // kroky CI pred esbuildom (production.yml): truck/build-truck-images.mjs (generuje *.gen.jsx — v .gitignore; obrázky
  // assets/img/truck/ len dopĺňa, existujúce neprepisuje) a tools/perf-markup.mjs (tu len --check, repo sa nemení)
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  const gen = ["konfigurator.gen.jsx", "konfigurator.phone.gen.jsx"].map((f) => join(tk, f));
  const zdroje = ["konfigurator.jsx", "konfigurator.phone.jsx"].map((f) => join(tk, f));
  const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
  if (gen.some((g, i) => mtime(g) < mtime(zdroje[i]))) spusti(process.execPath, ["truck/build-truck-images.mjs"], { popis: "truck/build-truck-images.mjs" });
  const pm = spawnSync(process.execPath, ["tools/perf-markup.mjs", "--check", "--quiet"], { cwd: KOREN, encoding: "utf8" });
  if (pm.status !== 0) console.log("  POZOR: tools/perf-markup.mjs --check hlási zmenu — CI by bundle zostavilo z upraveného markupu");
  const nodePath = chybajuceBalicky();
  const e = esbuild();
  // rovnaké prepínače ako .github/workflows/production.yml (riadok s yarn esbuild)
  const prep = [join(KOREN, "assets/js/main.js"), "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--legal-comments=none", "--log-level=warning"];
  if (!a.bezDrop) prep.push("--drop:console");
  const env = nodePath ? { ...process.env, NODE_PATH: [nodePath, process.env.NODE_PATH].filter(Boolean).join(delimiter) } : process.env;
  spusti(e.cmd, [...e.pred, ...prep], { shell: e.shell, popis: "esbuild", cwd: e.mimoRepa ? tmp : KOREN, env });
  const py = python();
  spusti(py[0], [...py.slice(1), "tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  const js = readFileSync(join(tmp, "luxuryCar.js")), css = readFileSync(join(tmp, "luxuryCar.css"));
  return { popis: `lokálny build (${(js.length / 1024).toFixed(0)} kB JS, ${(css.length / 1024).toFixed(0)} kB CSS, ${((Date.now() - t0) / 1000).toFixed(1)} s) v ${tmp}`, js, css, tmp };
}

// ------------------------------------------------------------------ stránka
const TYP = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".gif": "image/gif", ".mp4": "video/mp4", ".woff2": "font/woff2", ".json": "application/json" };

function rozober(body) {
  const o = {};
  for (const [k, v] of new URLSearchParams(body || "")) o[k] = v;
  return o;
}

/** Nová karta s presmerovaním bundlu/CSS na build, zachytávaním košíka a blokovaním meračov. */
async function novaStranka(ch, sirka, build, a, log, produkt) {
  const k = await ch.novaKarta({ sirka });
  const s = { k, posty: [], inePosty: [], podvrhnute: [], build, produkt, flagHodnota: a.flag || "1", upozornenia: [] };
  // alert/confirm by zablokoval Runtime.evaluate (test by visel) -> zavrieť a zapísať ako upozornenie
  k.na("Page.javascriptDialogOpening", (p) => {
    s.upozornenia.push("dialóg na stránke (" + p.type + "): " + String(p.message || "").slice(0, 120));
    k.posli("Page.handleJavaScriptDialog", { accept: p.type === "beforeunload" }).catch(() => {});
  });
  await k.posli("Network.setBlockedURLs", { urls: MERACE });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  const odpovedz = (p, body, typ) => k.posli("Fetch.fulfillRequest", {
    requestId: p.requestId, responseCode: 200, body: body.toString("base64"),
    responseHeaders: [{ name: "Content-Type", value: typ }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }],
  });
  k.na("Fetch.requestPaused", async (p) => {
    const u = p.request.url;
    try {
      if (/\/action\//i.test(u)) {
        if (/\/action\/Cart\/addCartItem/i.test(u)) {
          s.posty.push({ cas: Date.now(), url: u, body: p.request.postData || "", pole: rozober(p.request.postData) });
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
        // odmietnutie cookies (Shoptet si uloží len súhlas „nevyhnutné“) je povolené
        if (p.request.method !== "GET" && !/\/action\/CustomerCookieConsent\//i.test(u)) {
          s.inePosty.push(p.request.method + " " + u);
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
      } else if (s.build && s.build.js && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) {
        s.podvrhnute.push(u);
        return await odpovedz(p, s.build.js, "application/javascript; charset=utf-8");
      } else if (s.build && s.build.css && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) {
        s.podvrhnute.push(u);
        return await odpovedz(p, s.build.css, "text/css; charset=utf-8");
      } else if (s.build && s.build.tmp) {
        const m = /\/eshopy\/luxuryCar\/assets\/img\/1v\/([^?#]+)/.exec(u);
        const subor = m && join(KOREN, "assets/img/1v", decodeURIComponent(m[1]));
        if (subor && existsSync(subor)) return await odpovedz(p, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
      }
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch (e) { log("fetch " + u.slice(0, 80) + ": " + e.message); }
  });
  await k.posli("Fetch.enable", { patterns: [
    { urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" },
    { urlPattern: "*/action/*", requestStage: "Request" },
  ] });
  s.t = vytvorT(k, { novy: a.novy, log });
  return s;
}

/** Otvorí produkt, odmietne cookies, počká na postavený konfigurátor (podľa typu produktu). */
async function otvor(s, url, { novy = false, kontrola1v = novy, produkt = s.produkt } = {}) {
  const ciel = novy ? url + (url.includes("?") ? "&" : "?") + "novy=" + s.flagHodnota : url;
  await s.k.posli("Page.bringToFront").catch(() => {}); // karta v popredí (časovače, requestAnimationFrame)
  await s.k.chod(ciel);
  const t = s.t;
  // cookie lišta: „Odmietnuť“ (len nevyhnutné)
  for (let i = 0; i < 30; i++) {
    const r = await t.ev(`(function () {
      var b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a, button, a"), function (e) { return e.offsetParent && /^\\s*(Odmietnu|Odmítnou)/i.test(e.textContent || ""); });
      if (b) { b.click(); return "odmietnuté"; }
      return document.querySelector(".siteCookies") && document.querySelector(".siteCookies").offsetHeight ? "" : "bez lišty";
    })()`).catch(() => "");
    if (r) break;
    await pauza(250);
  }
  t.zabudni(); // ID parametrov podľa produktu (CZ má iné)
  await t.cakaj(TYPY_TEST[produkt.typ].pripravene, { ms: 30000, popis: "postavený konfigurátor (" + produkt.id + ", " + produkt.typ + ")" });
  await pauza(1500); // configurator-enhance (600 ms interval), tlačidlá krokov, prvé prekreslenie
  if (kontrola1v) {
    const st = await t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), chyby: window.__lcd1v ? window.__lcd1v.chyby : null })`);
    over(st.trieda, "?novy=" + s.flagHodnota + ", ale body.lcd-1v chýba" + (st.chyby && st.chyby.length ? " — init modulu zlyhal: " + st.chyby.join("; ") : " (brána / build? typ " + produkt.typ + " zapnutý? rozpracovaný typ = --vyvoj)"));
  }
  // parametre, ktorých select môže v POST chýbať (box 616: nepoužitý box má selectedIndex -1)
  const nepovinne = [];
  for (const kluc of TYPY_TEST[produkt.typ].nepovinne) { const id = await t.maParameter(kluc); if (id) nepovinne.push(id); }
  s.formKluce = await t.ev(`(function (nepovinne) {
    var f = document.getElementById("product-detail-form");
    var k = ["productId", "priceId", "language", "amount"], volitelne = [];
    Array.prototype.forEach.call(f.querySelectorAll("select[name]"), function (s) { k.push(s.name); if (nepovinne.indexOf(s.getAttribute("data-parameter-id")) > -1) volitelne.push(s.name); });
    // rádiá rozloženia (creatButtons.js: name="parameter-<id>"): po skutočnom kliku sú zaškrtnuté a idú do POST navyše
    Array.prototype.forEach.call(f.querySelectorAll(".content-wrap input[type=radio][name^='parameter-']"), function (r) { if (volitelne.indexOf(r.name) < 0) volitelne.push(r.name); });
    return { povinne: k.sort(), volitelne: volitelne, priceIdZaklad: (f.querySelector("input[name=priceId]") || {}).value || "" };
  })(${JSON.stringify(nepovinne)})`);
}

// ------------------------------------------------------------------ kontroly
class Zlyhanie extends Error {}
const over = (podm, sprava) => { if (!podm) throw new Zlyhanie(sprava); };

async function cakajNaPost(s, ms = 6000) {
  const koniec = Date.now() + ms;
  while (Date.now() < koniec) { if (s.posty.length) return s.posty[s.posty.length - 1]; await pauza(100); }
  throw new Zlyhanie("POST do košíka neodišiel do " + ms / 1000 + " s");
}

/** Očakávaná cena podľa Shoptetu: cena variantu (necessaryVariantData podľa priceId) + príplatky odoslaných volieb. */
async function ocakavanaCena(s, post) {
  return s.t.ev(`(function (p) {
    var nvd = (window.shoptet && shoptet.variantsSplit && shoptet.variantsSplit.necessaryVariantData) || {};
    var zaklad = null;
    Object.keys(nvd).forEach(function (k) { if (String(nvd[k].id) === String(p.priceId)) zaklad = Number(nvd[k].priceUnformatted); });
    if (zaklad == null && !Object.keys(nvd).length) {
      // produkt bez variantov (vzorkovník 637): cena produktu z dataLayer Shoptetu
      var d = (window.dataLayer || []).find(function (x) { return x && x.shoptet && x.shoptet.product; });
      if (d && d.shoptet.product.hasVariants === false) zaklad = Number(d.shoptet.product.priceWithVat) || 0;
    }
    var sum = 0, rozpis = [];
    Object.keys(p).forEach(function (k) {
      var m = /^surchargeParameterValueId\\[(\\d+)\\]$/.exec(k);
      if (!m || !p[k]) return;
      var o = document.querySelector('#product-detail-form select[data-parameter-id="' + m[1] + '"] option[value="' + p[k] + '"]');
      if (!o) { rozpis.push(m[1] + "=?"); return; }
      var c = Number(o.getAttribute("data-surcharge-final-price"));
      if (!(c > 0)) c = Number(o.getAttribute("data-surcharge-additional-price")) || 0;
      sum += c; rozpis.push(m[1] + "=" + c);
    });
    return { zaklad: zaklad, priplatky: sum, spolu: zaklad == null ? null : zaklad + sum, rozpis: rozpis.join(" ") };
  })(${JSON.stringify(post.pole)})`);
}

/** Hodnoty „nevybrané“ parametra: prázdne alebo možnosť nie / ŽIADNY. */
async function nieHodnoty(s, kluc) {
  const id = await s.t.idParametra(kluc);
  const nie = await s.t.ev(`Array.prototype.filter.call((document.querySelector('#product-detail-form select[data-parameter-id="${id}"]') || { options: [] }).options, function (o) { return o.value && /^(nie|ne|nechcem|žiadny|zadny|žádný)\\b/i.test(o.text.trim()); }).map(function (o) { return o.value; })`);
  return { id, hodnoty: ["", ...nie] };
}

/**
 * Kontrola tela POST: ocak = { farba?, farba2?, rozlozenie?, kufor?, farbaBoxov?, box1?, box2?, box3?, boxSolo?,
 * ine?: { <id príplatku>: value } } (chýba = „nevybrané“). Parametre, ktoré formulár nemá (rohož: len farba),
 * sa neoverujú. Vráti očakávanú cenu.
 */
async function overPost(s, post, ocak) {
  const p = post.pole, t = s.t, fk = s.formKluce;
  // 1) množina kľúčov = productId, priceId, language, amount + name všetkých selectov formulára (+ voliteľné:
  //    rádio rozloženia po kliku, select nepoužitého boxu 616 s selectedIndex -1)
  const kluce = Object.keys(p).sort();
  const chybaju = fk.povinne.filter((k) => !(k in p) && !fk.volitelne.includes(k));
  const navyse = kluce.filter((k) => !fk.povinne.includes(k) && !fk.volitelne.includes(k));
  over(!chybaju.length && !navyse.length, "kľúče POST " + kluce.join(",") + " ≠ polia formulára " + fk.povinne.join(",") + " (+ voliteľné " + fk.volitelne.join(",") + ")" +
    (chybaju.length ? "; chýba " + chybaju.join(",") : "") + (navyse.length ? "; navyše " + navyse.join(",") : ""));
  const ctx = await t.ev(`(function () { var d = (window.dataLayer || []).find(function (x) { return x && x.shoptet; }); d = d && d.shoptet; return { pid: String(d.product.id), jazyk: d.language }; })()`);
  over(p.productId === ctx.pid, "productId " + p.productId + " ≠ " + ctx.pid);
  over(p.language === ctx.jazyk, "language " + p.language);
  over(p.amount === "1", "amount " + p.amount);
  // 2) varianty (farba, farba 2. vrstvy) a priceId = necessaryVariantData[kľúč zo VŠETKÝCH variantných selectov podľa ID]
  for (const kluc of ["farba", "farba2"]) {
    if (ocak[kluc] === undefined) continue;
    const id = await t.idParametra(kluc);
    over(p["parameterValueId[" + id + "]"] === ocak[kluc], kluc + " v POST " + p["parameterValueId[" + id + "]"] + " ≠ " + ocak[kluc]);
  }
  const varianty = await t.ev(`Array.prototype.map.call(document.querySelectorAll('#product-detail-form select[name^="parameterValueId["]'), function (s) { return { id: Number(s.getAttribute("data-parameter-id")), name: s.name }; })`);
  if (varianty.length) {
    const kluc = varianty.sort((x, y) => x.id - y.id).map((v) => v.id + "-" + p[v.name]).join("-");
    const priceId = await t.ev(`(function () { var n = shoptet.variantsSplit.necessaryVariantData[${JSON.stringify(kluc)}]; return n ? String(n.id) : null; })()`);
    over(priceId && p.priceId === priceId, "priceId " + p.priceId + " ≠ variant " + kluc + " (" + priceId + ")");
  } else over(p.priceId === fk.priceIdZaklad, "priceId " + p.priceId + " ≠ priceId produktu bez variantov " + fk.priceIdZaklad);
  // 3) príplatky, ktoré formulár má
  const sp = (id) => p["surchargeParameterValueId[" + id + "]"];
  const zname = [];
  const idR = await t.maParameter("rozlozenie");
  if (idR) {
    zname.push(idR);
    over(sp(idR) === ocak.rozlozenie, "rozloženie v POST " + sp(idR) + " ≠ " + ocak.rozlozenie);
    const radio = "parameter-" + idR;
    if (radio in p) over(p[radio] === ocak.rozlozenie, "rádio " + radio + "=" + p[radio] + " ≠ rozloženie " + ocak.rozlozenie);
  }
  const idT = await t.maParameter("typ");
  if (idT) {
    zname.push(idT);
    const typ = await t.moznost("typ", new RegExp("^" + AUTO.typ + "\\b", "i"));
    over(sp(idT) === typ, "TYP v POST " + sp(idT) + " ≠ " + typ + " (" + AUTO.typ + ")");
  }
  for (const kluc of ["kufor", "farbaBoxov", "box1", "box2", "box3", "boxSolo"]) {
    const id = await t.maParameter(kluc);
    if (!id) continue;
    zname.push(id);
    const v = sp(id);
    if (ocak[kluc]) { over(v === ocak[kluc], kluc + " v POST " + v + " ≠ " + ocak[kluc]); continue; }
    const vynechany = v === undefined && fk.volitelne.includes("surchargeParameterValueId[" + id + "]");
    const n = await nieHodnoty(s, kluc);
    over(vynechany || n.hodnoty.includes(v), kluc + " nevybrané, ale v POST je " + v + " (povolené: " + n.hodnoty.join("|") + (fk.volitelne.includes("surchargeParameterValueId[" + id + "]") ? "|bez kľúča" : "") + ")");
    if (v) {
      // „nie“ s cenou > 0 (610: „autokoberce do kufru: nie +€5“) — chyba v admine, D2: hlásiť, nezlyhať
      const c = await t.ev(`(function () { var o = document.querySelector('#product-detail-form select[data-parameter-id="${id}"] option[value="${v}"]'); return o ? Number(o.getAttribute("data-surcharge-final-price")) || 0 : 0; })()`);
      if (c > 0) (s.upozornenia || []).push(`${kluc} „nevybrané“ = voľba ${v} „nie“ s príplatkom +${c} € (chyba v admine, ${s.produkt ? s.produkt.id : ""})`);
    }
  }
  // 4) ostatné príplatky (vzorkovník: 1 vzorka = 1 parameter): ocak.ine[id] = value, inak nevybrané (prázdne / Nechcem)
  const ine = await t.ev(`(function (zname) {
    var re = /^(nie|ne|nechcem|nechci|žiadny|zadny|žádný)\\b/i;
    return Array.prototype.filter.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter[name]"), function (s) { return zname.indexOf(s.getAttribute("data-parameter-id")) < 0; })
      .map(function (s) { return { id: s.getAttribute("data-parameter-id"), meno: s.getAttribute("data-parameter-name"), name: s.name,
        nie: Array.prototype.filter.call(s.options, function (o) { return o.value && re.test(o.text.trim()); }).map(function (o) { return o.value; }) }; });
  })(${JSON.stringify(zname)})`);
  const ocakIne = ocak.ine || {};
  for (const x of ine) {
    const v = p[x.name];
    if (ocakIne[x.id] !== undefined) over(v === ocakIne[x.id], x.meno + " (" + x.id + ") v POST " + v + " ≠ " + ocakIne[x.id]);
    else over(v === "" || x.nie.includes(v) || (v === undefined && fk.volitelne.includes(x.name)), x.meno + " (" + x.id + ") nevybrané, ale v POST je " + v);
  }
  Object.keys(ocakIne).forEach((id) => over(ine.some((x) => x.id === id), "očakávaný príplatok " + id + " vo formulári nie je"));
  const c = await ocakavanaCena(s, post);
  over(c.spolu != null, "cena variantu " + p.priceId + " nie je v necessaryVariantData");
  return c;
}

async function overCenu(s, ovl, cena) {
  let videne;
  const koniec = Date.now() + 4000;
  do { videne = await ovl.cena.zobrazenaCena(s.t); if (videne === cena.spolu) break; await pauza(200); } while (Date.now() < koniec);
  over(videne === cena.spolu, "zobrazená cena " + videne + " ≠ " + cena.spolu + " (variant " + cena.zaklad + " + príplatky " + cena.rozpis + ")");
  const odp = await ovl.cena.odporucana(s.t);
  const ocakOdp = Math.ceil((cena.spolu * 1.6) / 10) * 10;
  if (s.produkt && s.produkt.odporucana === false) {
    // v admine chýba bežná cena (613, 625, 616, 637): odporúčaná sa nemá ukázať (plan §2.5)
    if (odp && odp.cena) {
      over(odp.cena === ocakOdp, "odporúčaná cena " + odp.cena + " ≠ " + ocakOdp + " (profil: bez bežnej ceny)");
      s.upozornenia.push("odporúčaná cena " + odp.cena + " sa ukazuje, profil hovorí „bez bežnej ceny“ — admin doplnený? uprav tools/test-1v/produkty.mjs");
    }
    return { videne, odporucana: odp && odp.cena ? odp : null };
  }
  over(odp && odp.cena === ocakOdp, "odporúčaná cena " + (odp && odp.cena) + " ≠ " + ocakOdp + " (spolu × 1,6 nahor na desiatky)");
  over(odp.zlava === Math.round(((ocakOdp - cena.spolu) / ocakOdp) * 100), "zľava " + odp.zlava + " %");
  if (s.t.novy && ovl.zdroj.cena === "novy") over(/^Odporúčaná cena/.test(odp.stitok), "štítok „" + odp.stitok + "“ ≠ Odporúčaná cena");
  return { videne, odporucana: odp };
}

async function overKuforSkryty(s, ovl) {
  const st = await ovl.kuforBoxy.stav(s.t);
  if (ovl.kuforBoxy.skryteNaZaciatku) over(!st.kufor && !st.boxy, "kufor/boxy majú byť pred výberom rozloženia skryté (starý vzhľad), stav " + JSON.stringify(st));
  else over(st.kufor && st.boxy, "kufor/boxy majú byť viditeľné kroky (nový vzhľad), stav " + JSON.stringify(st));
  return st;
}

/**
 * Spoločný začiatok podľa typu produktu -> { ocak (pre overPost), model?, farba, farba2?, rozlozenie?, pocet?, box1–3? }
 *   jedno: auto + farba + rozloženie · dvoj: + farba 2. vrstvy · rohož: auto + farba · box: farba + počet + veľkosti
 */
async function zaklad(s, ovl, { farba = 2, rozlozenie = 1, farba2 = 0, pocet = 1, velkosti = ["M"] } = {}) {
  const t = s.t, typ = s.produkt.typ, T = TYPY_TEST[typ];
  if (typ === "vzorky") throw new Error("zaklad() pre vzorkovník nie je — scenáre vzorkovníka (scenare-vzorky.mjs) vyberajú vzorky samy");
  const z = { ocak: {} };
  if (typ === "boxy") {
    z.farba = await ovl.boxy.vyberFarbu(t, { index: farba });
    z.pocet = await ovl.boxy.vyberPocet(t, pocet);
    Object.assign(z, await ovl.boxy.vyberVelkosti(t, velkosti.slice(0, pocet)));
    z.ocak = { farba: z.farba, box1: z.box1, box2: z.box2, box3: z.box3 };
    return z;
  }
  if (T.auto) {
    z.model = await ovl.kroky.vyberAuto(t, AUTO);
    over(z.model === [AUTO.znacka, AUTO.model, AUTO.rok, AUTO.typ].join(" "), "auto pre poznámku objednávky (#remark): sessionStorage.model = " + z.model);
  }
  z.farba = z.ocak.farba = await ovl.kroky.vyberFarbu(t, { index: farba });
  if (typ === "dvoj") z.farba2 = z.ocak.farba2 = await ovl.farba2.vyberFarbu2(t, { index: farba2 });
  if (T.set) z.rozlozenie = z.ocak.rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: rozlozenie });
  return z;
}

// ------------------------------------------------------------------ scenáre
const SCENARE = {
  /**
   * Brána: bez flagu nič. S flagom (?novy=1 alebo ?novy=vyvoj) zapne nový vzhľad LEN na produktoch, ktorých typ je
   * zapnutý (ZAPNUTE_TYPY; vyvoj = celý register), platí v karte, iný projekt (CZ 2403) nikdy, nezapnutý typ
   * nie (pri ?novy=1), ?novy=0 vypne.
   */
  async brana(s, a) {
    const t = s.t, P = a.produkt;
    const stav = () => t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), flag: (function () { try { return sessionStorage.getItem("lcd1v"); } catch (e) { return "x"; } })(), ctx: !!window.__lcd1v })`);
    await otvor(s, a.url);
    let st = await stav();
    over(!st.trieda && !st.flag && !st.ctx, "bez ?novy= nesmie byť nič zapnuté: " + JSON.stringify(st));
    if (!a.novy) return { info: "flag vypnutý: bez zmeny" };
    const zap = a.zapnuteSet.has(P.id);
    const info = [];
    await otvor(s, a.url, { novy: true, kontrola1v: false });
    st = await stav();
    if (zap) {
      over(st.trieda && st.flag === a.flag && st.ctx, "?novy=" + a.flag + " má na " + P.id + " (" + P.typ + ") zapnúť body.lcd-1v + sessionStorage lcd1v=" + a.flag + ": " + JSON.stringify(st));
      await otvor(s, a.url);
      st = await stav();
      over(st.trieda, "flag má platiť aj po prechode bez parametra (sessionStorage karty): " + JSON.stringify(st));
      info.push("?novy=" + a.flag + " zapne, platí v karte");
    } else {
      over(!st.trieda && !st.ctx, "typ " + P.typ + " nie je pre ?novy=" + a.flag + " zapnutý, ale " + P.id + " dostal nový vzhľad: " + JSON.stringify(st));
      info.push(P.id + " (" + P.typ + ") ostáva starý — typ nie je zapnutý");
    }
    // iný projekt: CZ Diamond 2403 (projectId 581408)
    await otvor(s, INY.url, { novy: true, kontrola1v: false, produkt: INY });
    st = await stav();
    over(!st.trieda && !st.ctx, "iný projekt (CZ " + INY.id + ") nesmie dostať nový vzhľad: " + JSON.stringify(st));
    info.push("CZ " + INY.id + " nie");
    // nezapnutý typ (len ?novy=1; vyvoj zapína celý register)
    if (a.flag === "1") {
      const id = PORADIE.find((x) => !a.zapnuteSet.has(x) && PRODUKTY[x].typ !== P.typ) || PORADIE.find((x) => !a.zapnuteSet.has(x) && x !== P.id);
      if (id) {
        const Q = { id, ...PRODUKTY[id] };
        await otvor(s, Q.url, { novy: true, kontrola1v: false, produkt: Q });
        st = await stav();
        over(!st.trieda && !st.ctx, "nezapnutý typ " + Q.typ + " (" + id + ") nesmie dostať nový vzhľad: " + JSON.stringify(st));
        info.push("nezapnutý " + id + " (" + Q.typ + ") nie");
      }
    }
    await otvor(s, a.url + "?novy=0");
    st = await stav();
    over(!st.trieda && !st.flag && !st.ctx, "?novy=0 má vypnúť: " + JSON.stringify(st));
    info.push("?novy=0 vypne");
    return { info: info.join(", ") };
  },

  /** Flag vypnutý = NULOVÁ zmena: živý CDN vs lokálny build (DOM konfigurátora, ceny, štýly, počty). */
  async "nulova-zmena"(s, a, pom) {
    if (!s.build || !s.build.js) return { preskoc: "porovnáva lokálny build s CDN, pri --zdroj cdn nemá zmysel" };
    // pred meraním: písma a obrázky v konfigurátore načítané. Otvorený krok (auto) má max-height podľa výšky nameranej
    // počas načítania (živý akordeón), a tá kolíše medzi načítaniami (508 / 517 px) -> pri krokoch sa porovnáva výška
    // obsahu (scrollHeight), pri obaloch s otvoreným krokom (obsah, auto) sa výška neporovnáva.
    const USTALENE = `(document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { return Promise.race([Promise.all(Array.prototype.map.call(document.querySelectorAll("#product-detail-form .content-wrap img"), function (i) { return i.complete ? 0 : new Promise(function (r) { i.addEventListener("load", r); i.addEventListener("error", r); }); })), new Promise(function (r) { setTimeout(r, 6000); })]); }).then(function () { return new Promise(function (r) { setTimeout(r, 800); }); })`;
    const PODPIS = `(function () {
      var f = document.getElementById("product-detail-form");
      function st(sel) { var e = document.querySelector(sel); if (!e) return null; var c = getComputedStyle(e); return [c.display, c.position, c.backgroundColor, c.color, c.fontSize, c.fontFamily.slice(0, 30), c.borderRadius, c.padding].join("|"); }
      function rm(sel, bezVysky) { var e = document.querySelector(sel); if (!e) return null; var r = e.getBoundingClientRect(); return bezVysky ? [Math.round(r.width)] : [Math.round(r.width), Math.round(r.height)]; }
      var kroky = f.querySelectorAll(".content-wrap > *, .upsale-buttons.trunk, .upsale-buttons.boxs");
      return {
        body: Array.prototype.slice.call(document.body.classList).sort().join(" "),
        kroky: Array.prototype.map.call(kroky, function (e) { return e.className.trim().replace(/\\s+/g, " ") + " #" + e.querySelectorAll(".option-button, .upsale-button").length; }),
        vysky: Array.prototype.map.call(kroky, function (e) { return e.scrollHeight; }),
        selecty: document.querySelectorAll("select").length,
        znacky: (f.querySelector(".modl-selector-wrap .brands select") || { options: [] }).options.length,
        cena: ((document.querySelector(".p-final-price-wrapper") || {}).textContent || "").replace(/\\s+/g, " ").trim(),
        vzorkovnik: [document.querySelectorAll(".lcd-vz-acc").length, document.querySelectorAll(".lcd-vz-swatch").length, document.querySelectorAll(".lcd-vz-swatch--preview").length],
        styly: { obsah: st("#product-detail-form .content-wrap"), krok: st("#product-detail-form .content-wrap > .parameter-wrap"), hlavicka: st("#product-detail-form .content-wrap > .parameter-wrap > .order"), auto: st("#product-detail-form .content-wrap > .position-wrap.active"), tlacidlo: st("#product-detail-form .add-to-cart button.add-to-cart-button"), cena: st(".p-final-price-wrapper"), h1: st("h1") },
        rozmery: { obsah: rm("#product-detail-form .content-wrap", true), krok: rm("#product-detail-form .content-wrap > .parameter-wrap"), hlavicka: rm("#product-detail-form .content-wrap > .parameter-wrap > .order"), auto: rm("#product-detail-form .content-wrap > .position-wrap.active", true), tlacidlo: rm("#product-detail-form .add-to-cart button.add-to-cart-button"), cena: rm(".p-final-price-wrapper"), h1: rm("h1") },
        lcd1v: document.querySelectorAll(".lcd-1v, [class*='lcd1v'], [id*='lcd1v'], [class*='lcd-1v-']").length
      };
    })()`;
    const cdn = await pom.novaStranka({ js: null, css: null });
    await otvor(cdn, a.url);
    const A = await cdn.t.ev(USTALENE).then(() => cdn.t.ev(PODPIS));
    await cdn.k.zavri();
    await otvor(s, a.url);
    const B = await s.t.ev(USTALENE).then(() => s.t.ev(PODPIS));
    over(s.podvrhnute.length >= 1, "lokálny build sa nepodvrhol (žiadna požiadavka na luxuryCar.js/css)");
    const rozdiel = (x, y, cesta = "") => {
      const out = [];
      if (cesta === "/body" && typeof x === "string" && typeof y === "string") {
        const X = x.split(" "), Y = y.split(" ");
        const zmena = [...Y.filter((c) => !X.includes(c)).map((c) => "+" + c), ...X.filter((c) => !Y.includes(c)).map((c) => "−" + c)];
        if (zmena.length) out.push("body triedy " + zmena.join(" "));
        return out;
      }
      if (typeof x !== "object" || x === null || typeof y !== "object" || y === null) {
        // rozmery (px) sa medzi dvoma načítaniami líšia o pár px podľa toho, kedy dobehol akordeón / písmo -> tolerancia 6 px;
        // všetko ostatné (triedy, počty, štýly, ceny) sa porovnáva presne
        const px = /^\/(vysky|rozmery)\//.test(cesta) && typeof x === "number" && typeof y === "number";
        const rovnake = px ? Math.abs(x - y) <= 6 : JSON.stringify(x) === JSON.stringify(y);
        if (!rovnake) out.push(cesta + ": CDN " + JSON.stringify(x) + " | lokál " + JSON.stringify(y));
        return out;
      }
      new Set([...Object.keys(x), ...Object.keys(y)]).forEach((k) => out.push(...rozdiel(x[k], y[k], cesta + "/" + k)));
      return out;
    };
    const r = rozdiel(A, B);
    over(r.length === 0, "flag vypnutý, ale stránka sa líši:\n      " + r.join("\n      "));
    let info = "DOM, ceny, štýly a počty zhodné s CDN (" + A.znacky + " značiek, " + A.selecty + " selectov)";
    if (a.novy && s.build.js) {
      // len informácia: čo zmení ?novy=1 oproti živému webu (so stubmi má byť len trieda body.lcd-1v)
      const n = await pom.novaStranka(s.build);
      await otvor(n, a.url, { novy: true, kontrola1v: a.zapnuteSet.has(a.produkt.id) });
      const C = await n.t.ev(USTALENE).then(() => n.t.ev(PODPIS));
      await n.k.zavri();
      const rn = rozdiel(A, C);
      info += "; s ?novy=" + a.flag + " oproti CDN: " + (rn.length ? rn.join(" ; ") : "bez rozdielu");
    }
    return { info };
  },

  /** Bez auta: výzva na auto, do košíka nič, červený rám na kroku auta. */
  async "bez-auta"(s, a, pom, ovl) {
    const t = s.t;
    await otvor(s, a.url, { novy: a.novy });
    const r = await ovl.kroky.skusBezAuta(t);
    over(r.vyzva, "bez auta sa neukázala výzva na výber auta");
    await ovl.kroky.zavriVyzvu(t);
    await pauza(3200); // červený rám z predošlých krokov zmizne po 3 s
    await ovl.cena.pridajDoKosika(t);
    const cerveny = await ovl.kroky.cervenyKrok(t);
    await pauza(1200);
    over(s.posty.length === 0, "bez auta odišiel POST do košíka: " + (s.posty[0] && s.posty[0].body));
    over(cerveny === "auto", "červený rám má byť na kroku auta, je na: " + cerveny);
    return { info: "výzva na auto + červený rám na aute, POST 0" };
  },

  /**
   * Neúplný výber: po aute (ak ho typ má) postupne každý ďalší povinný krok — „Pridať do košíka“ = červený rám na ňom,
   * potom sa vyplní (posledný nie); POST 0. jedno: farba, rozloženie · dvoj: farba, farba2, rozloženie ·
   * rohož: farba · box: farba, veľkosť.
   */
  async neuplne(s, a, pom, ovl) {
    const t = s.t, T = TYPY_TEST[a.produkt.typ];
    await otvor(s, a.url, { novy: a.novy });
    if (T.povinne[0] === "auto") await ovl.kroky.vyberAuto(t, AUTO);
    const kroky = T.povinne.filter((k) => k !== "auto");
    const MENO = { rozlozenie: "rozloženie", farba2: "farba 2. vrstvy", velkost: "veľkosť" };
    for (let i = 0; i < kroky.length; i++) {
      if (i) await pauza(3200); // červený rám z predošlého kroku zmizne po 3 s
      await ovl.cena.pridajDoKosika(t);
      const c = await ovl.kroky.cervenyKrok(t);
      over(c === kroky[i], "bez " + (MENO[kroky[i]] || kroky[i]) + ": červený rám má byť na " + kroky[i] + ", je na: " + c);
      if (i === kroky.length - 1) break;
      if (kroky[i] === "farba") {
        // 4. farba (ako doteraz na 598), pri Hexa (3 farby) posledná
        const idF = await t.idParametra("farba");
        const pocet = await t.ev(`Array.prototype.filter.call((document.querySelector('#product-detail-form select[data-parameter-id="${idF}"]') || { options: [] }).options, function (o) { return !!o.value; }).length`);
        const index = Math.max(0, Math.min(3, pocet - 1));
        await (a.produkt.typ === "boxy" ? ovl.boxy.vyberFarbu(t, { index }) : ovl.kroky.vyberFarbu(t, { index }));
      }
      else if (kroky[i] === "farba2") await ovl.farba2.vyberFarbu2(t, { index: 0 });
      else throw new Error("neuplne: neviem vyplniť krok " + kroky[i]);
    }
    await pauza(1200);
    over(s.posty.length === 0, "neúplný výber odišiel do košíka: " + (s.posty[0] && s.posty[0].body));
    return { info: kroky.map((k) => (MENO[k] || k) + " -> červený rám").join(", ") + ", POST 0" };
  },

  /** Auto + farba + rozloženie: platný POST, kufor a boxy „nevybrané“, cena = Shoptet. */
  async platne(s, a, pom, ovl) {
    const P = a.produkt;
    await otvor(s, a.url, { novy: a.novy });
    const st = TYPY_TEST[P.typ].set ? await overKuforSkryty(s, ovl) : null;
    const z = await zaklad(s, ovl);
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    if (P.platne) {
      over(post.pole.priceId === P.platne.priceId, "priceId " + post.pole.priceId + " ≠ plan.md §4 / produkty.mjs " + P.platne.priceId);
      if (P.platne.odporucana) over(c.odporucana && c.odporucana.cena === P.platne.odporucana, "odporúčaná " + (c.odporucana && c.odporucana.cena) + " ≠ plan.md §4 " + P.platne.odporucana);
    }
    const odp = c.odporucana ? `odporúčaná ${c.odporucana.cena}, −${c.odporucana.zlava} %` : "bez odporúčanej";
    return { info: `priceId ${post.pole.priceId}, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis || "0"} (${odp})${st ? ", kufor/boxy na začiatku " + JSON.stringify(st) : ""}`, post: post.body, spolu: cena.spolu };
  },

  /** Schválená cesta zápisu (window.__lcd1v = ctx z konfigurator1v/ctx.js): zapis() všetkých volieb -> doKosika() -> platný POST. */
  async "ctx-zapis"(s, a, pom, ovl) {
    if (!a.novy) return { preskoc: "ctx (window.__lcd1v) existuje len s ?novy=1" };
    const t = s.t;
    await otvor(s, a.url, { novy: true });
    await ovl.kroky.vyberAuto(t, AUTO); // auto nie je parameter Shoptetu — ide cez ovládač krokov
    const zapis = async (kluc, vyraz) => {
      const r = await t.ev(`(function () { var c = window.__lcd1v; var h = (${vyraz}); return { h: h, cesta: c.zapis(${JSON.stringify(kluc)}, h) }; })()`);
      await pauza(700);
      over(r.cesta, "ctx.zapis(" + kluc + ", " + r.h + ") nenašiel parameter ani ovládač");
      return r;
    };
    const vyber = (kluc, re) => `(function () { var o = window.__lcd1v.moznosti(${JSON.stringify(kluc)}).find(function (x) { return ${re}.test(x.text); }); return o ? o.hodnota : null; })()`;
    const farba = await zapis("farba", `window.__lcd1v.moznosti("farba")[4].hodnota`);
    over((await zapis("farba", JSON.stringify(farba.h))).cesta === "uz", "opakovaný zápis tej istej farby má vrátiť „uz“");
    const farba2 = (await t.maParameter("farba2")) ? await zapis("farba2", `window.__lcd1v.moznosti("farba2")[0].hodnota`) : null;
    const rozl = await zapis("rozlozenie", `window.__lcd1v.moznosti("rozlozenie")[1].hodnota`);
    await zapis("kufor", vyber("kufor", "/bok/i"));
    const zrus = await zapis("kufor", `""`);
    over((await t.ev(`window.__lcd1v.precitaj("kufor")`)) === "", "zapis(kufor, \"\") má voľbu zrušiť (cesta " + zrus.cesta + ")");
    const kufor = await zapis("kufor", vyber("kufor", "/^(?!.*bok).*dno/i"));
    await zapis("pocetBoxov", "2");
    const fb = await zapis("farbaBoxov", `window.__lcd1v.moznosti("farbaBoxov")[2].hodnota`);
    const b1 = await zapis("box1", vyber("box1", "/^L\\s*:/i"));
    const b2 = await zapis("box2", vyber("box2", "/^S\\s*:/i"));
    const stav = await t.ev(`(function () { var c = window.__lcd1v; var n = c.prvyNevyplneny(); return { chyba: n ? c.menoKroku(n) || n.className : null, cena: c.cena() }; })()`);
    over(!stav.chyba, "po zápise všetkých volieb ctx.prvyNevyplneny() hlási krok " + stav.chyba);
    over(await t.ev(`window.__lcd1v.doKosika()`), "ctx.doKosika() nenašiel tlačidlo");
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, { farba: farba.h, ...(farba2 ? { farba2: farba2.h } : {}), rozlozenie: rozl.h, kufor: kufor.h, farbaBoxov: fb.h, box1: b1.h, box2: b2.h });
    over(stav.cena.spolu === cena.spolu, "ctx.cena().spolu " + stav.cena.spolu + " ≠ Shoptet " + cena.spolu);
    if (a.produkt.odporucana !== false) over(stav.cena.odporucana === Math.ceil((cena.spolu * 1.6) / 10) * 10, "ctx.cena().odporucana " + stav.cena.odporucana);
    await overCenu(s, ovl, cena);
    return { info: `zapis() ${[farba, farba2, rozl, kufor, fb, b1, b2].filter(Boolean).map((r) => r.cesta).join("/")}, ctx.cena ${stav.cena.spolu} = Shoptet, doKosika -> POST OK`, post: post.body, spolu: cena.spolu };
  },

  async "kufor-classic"(s, a, pom, ovl) { return kuforBoxy(s, a, ovl, { kufor: "classic" }); },
  async "kufor-premium"(s, a, pom, ovl) { return kuforBoxy(s, a, ovl, { kufor: "premium" }); },
  async "box-1"(s, a, pom, ovl) { return kuforBoxy(s, a, ovl, { boxy: { pocet: 1, farba: 1, velkost: "M" } }); },
  async "box-2"(s, a, pom, ovl) { return kuforBoxy(s, a, ovl, { kufor: "classic", boxy: { pocet: 2, farba: 0, velkost: "M", velkost2: "S" } }); },
  /** Kufor Classic -> Nechcem: POST bez príplatku kufra (prázdne alebo „nie“), cena bez kufra. */
  async "kufor-nie"(s, a, pom, ovl) {
    await otvor(s, a.url, { novy: a.novy });
    const z = await zaklad(s, ovl, { rozlozenie: 0 });
    await ovl.kuforBoxy.vyberKufor(s.t, "classic");
    const v = await ovl.kuforBoxy.vyberKufor(s.t, "nie");
    const n = await nieHodnoty(s, "kufor");
    over(n.hodnoty.includes(v), "Nechcem: kufor vo formulári " + v + " (povolené " + n.hodnoty.join("|") + ")");
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    return { info: `Classic -> Nechcem: kufor ${JSON.stringify(v)}, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
  },

  /** 1 box -> Nechcem: POST bez boxov (prázdne alebo ŽIADNY), cena bez boxov. */
  async "box-nie"(s, a, pom, ovl) {
    await otvor(s, a.url, { novy: a.novy });
    const z = await zaklad(s, ovl, { rozlozenie: 0 });
    await ovl.kuforBoxy.vyberBoxy(s.t, { pocet: 1, farba: 2, velkost: "L" });
    const b = await ovl.kuforBoxy.vyberBoxy(s.t, { pocet: 0 });
    for (const k of ["farbaBoxov", "box1", "box2", "boxSolo"]) {
      const n = await nieHodnoty(s, k);
      over(n.hodnoty.includes(b[k]), "Nechcem boxy: " + k + " = " + b[k]);
    }
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    return { info: `1 box -> Nechcem: ${JSON.stringify(b)}, cena ${c.videne}`, post: post.body, spolu: cena.spolu };
  },

  /** G10b (len nový vzhľad): nový výber boxov zavretý krížikom bez potvrdenia = žiadny box (POST, cena aj karta Nechcem). */
  async "box-krizik"(s, a, pom, ovl) {
    if (!ovl.kuforBoxy.zavriVyberKrizikom) return { preskoc: "len nový vzhľad (ovládač kufor-boxy novy)" };
    await otvor(s, a.url, { novy: a.novy });
    const z = await zaklad(s, ovl, { rozlozenie: 0 });
    const b = await ovl.kuforBoxy.zavriVyberKrizikom(s.t, { pocet: 2, farba: 1, velkost: "M" });
    for (const k of ["farbaBoxov", "box1", "box2", "boxSolo"]) {
      const n = await nieHodnoty(s, k);
      over(n.hodnoty.includes(b.hodnoty[k]), "po krížiku: " + k + " = " + b.hodnoty[k]);
    }
    over(!b.oznacena, "po krížiku ostala označená karta boxov: " + b.oznacena);
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    return { info: `krížik: ${JSON.stringify(b.hodnoty)}, cena ${c.videne}`, post: post.body, spolu: cena.spolu };
  },

  /** 1 box -> 2 boxy: v POST len 1. + 2. box, bez samostatného boxu z predošlej voľby (len nový vzhľad — starý túto
   *  chybu naživo má: 13. 10. 2026 POST [104]=734 navyše, cena 551 namiesto 442). */
  async "box-prepni"(s, a, pom, ovl) {
    if (!ovl.kuforBoxy.zavriVyberKrizikom) return { preskoc: "len nový vzhľad (starý web: známa chyba, samostatný box ostane)" };
    await otvor(s, a.url, { novy: a.novy });
    const z = await zaklad(s, ovl, { rozlozenie: 0 });
    await ovl.kuforBoxy.vyberBoxy(s.t, { pocet: 1, farba: 2, velkost: "M" });
    const b = await ovl.kuforBoxy.vyberBoxy(s.t, { pocet: 2, farba: 2, velkost: "L", velkost2: "S" });
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, { ...z.ocak, farbaBoxov: b.farbaBoxov, box1: b.box1, box2: b.box2 });
    const c = await overCenu(s, ovl, cena);
    return { info: `1 box M -> 2 boxy L+S: cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
  },

  /** 7 miest + všetky tri rady: POST rozloženie = voľba s 3. radom, cena s príplatkom 3. radu (nový vzhľad: 7 miest
   *  dlaždicou v kroku 4 = aj živá dlaždica v kroku 2 a sessionStorage seatPosition). */
  async "rady-3"(s, a, pom, ovl) {
    await otvor(s, a.url, { novy: a.novy });
    const z = await zaklad(s, ovl, { rozlozenie: 2 });
    const tri = await s.t.moznost("rozlozenie", /tret|třet/i);
    over(z.rozlozenie === tri, "všetky tri rady: rozloženie " + z.rozlozenie + " ≠ voľba s 3. radom " + tri);
    let miesta = "";
    if (ovl.zdroj.rozlozenie === "novy") {
      miesta = await s.t.ev(`(function () { var a = document.querySelector("#product-detail-form .sit-Position .option-button.active"); var ss = ""; try { ss = sessionStorage.getItem("seatPosition") || ""; } catch (e) {} return (a ? a.getAttribute("data-value") : "") + "|" + ss; })()`);
      over(miesta === "pass-7|pass-7", "7 miest: krok 2 / sessionStorage seatPosition = " + miesta);
    }
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    return { info: `${miesta ? "miesta " + miesta + ", " : ""}cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
  },

  /** Nový vzhľad: posledný krok typu (set: krok 6 boxy, rohož: farba, box: veľkosť) „Pokračujte k súhrnu“ nič nevkladá
   *  do košíka — zatvorí krok a posunie na súhrn (Spolu + tlačidlo košíka); potom „Vložte do košíka“ pošle platný POST. */
  async "k-suhrnu"(s, a, pom, ovl) {
    const posledny = TYPY_TEST[a.produkt.typ].posledny;
    if (ovl.zdroj.kroky !== "novy") return { preskoc: TYPY_TEST[a.produkt.typ].set ? "len nový vzhľad (naživo krok 6 „Prejsť do košíka“ rovno vkladá)" : "len nový vzhľad (naživo posledný krok rovno vkladá — scenár dokoncit)" };
    const t = s.t;
    await otvor(s, a.url, { novy: true });
    const z = await zaklad(s, ovl, { rozlozenie: 1 });
    const { otvorKartu } = await import("./test-1v/ovladac-kroky.mjs");
    const sel = await otvorKartu(t, posledny);
    const text = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(sel + " > .next-step-button")}); return b ? b.getAttribute("data-lcd1v-text") : null; })()`);
    over(text === "Pokračujte k súhrnu", "text tlačidla posledného kroku (" + posledny + "): " + text);
    await t.klikni(`${sel} > .next-step-button`, { popis: "Pokračujte k súhrnu" });
    await pauza(1500);
    over(s.posty.length === 0, "„Pokračujte k súhrnu“ poslal POST do košíka: " + (s.posty[0] && s.posty[0].body));
    const st = await t.ev(`(function () { var k = document.querySelector(${JSON.stringify(sel)}); var e = document.querySelector(".lcd1v-suhrn"); var r = e && e.getBoundingClientRect();
      return { otvoreny: k.classList.contains("active"), vidno: !!(r && r.top >= 0 && r.bottom <= innerHeight), aktivne: document.querySelectorAll("#product-detail-form .lcd1v-krok.active").length }; })()`);
    over(!st.otvoreny && st.aktivne === 0, "po „Pokračujte k súhrnu“ majú byť kroky zatvorené: " + JSON.stringify(st));
    over(st.vidno, "súhrn (Spolu) má byť po „Pokračujte k súhrnu“ na obrazovke: " + JSON.stringify(st));
    await ovl.cena.pridajDoKosika(t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    return { info: `posledný krok (${posledny}) -> súhrn bez POST, kroky zatvorené, Spolu na obrazovke; potom košík: cena ${c.videne}`, post: post.body, spolu: cena.spolu };
  },

  /** Nový vzhľad: 7 miest + 3 rady, potom 5 miest -> karta „Všetky tri rady“ zmizne, rozloženie sa samo prepne na
   *  1.+2. rad (návrh v26), stránka sa sama nepresunie na kufor (ani na telefóne), POST a cena bez 3. radu. */
  async "miesta-5"(s, a, pom, ovl) {
    if (ovl.zdroj.rozlozenie !== "novy") return { preskoc: "len nový vzhľad (starý web počet miest s rozložením neviaže)" };
    const t = s.t;
    await otvor(s, a.url, { novy: true });
    const z = await zaklad(s, ovl, { rozlozenie: 2 });
    const dva = await t.moznost("rozlozenie", /druh/i);
    await ovlRozlozenie.otvorKrok4(t);
    await t.klikni(`#product-detail-form .lcd1v-rz .rz-dlazdice button[data-v="5"]`, { popis: "5 miest (krok 4)" });
    const id = await t.idParametra("rozlozenie");
    await t.cakaj(`(document.querySelector('#product-detail-form select[data-parameter-id="${id}"]') || {}).value === "${dva}"`, { ms: 4000, popis: "rozloženie prepnuté na 1.+2. rad" });
    await pauza(1200); // telefón: živý K3 auto-postup by po 350 ms krok 4 zbalil a otvoril kufor — pod 1V nesmie
    const st = await t.ev(`(function () {
      var k4 = document.querySelector('#product-detail-form .content-wrap > .parameter-wrap.parameter-${id}');
      var tri = document.querySelector("#product-detail-form .lcd1v-rz .rz-karta[data-rady='3']");
      var a = document.querySelector("#product-detail-form .sit-Position .option-button.active");
      return { k4: !!(k4 && k4.classList.contains("active")), tri: !!(tri && tri.offsetHeight > 0), miesta: a ? a.getAttribute("data-value") : "",
        kufor: document.querySelector("#product-detail-form .upsale-buttons.trunk").classList.contains("active") };
    })()`);
    over(st.miesta === "pass-5", "5 miest v kroku 2: " + st.miesta);
    over(!st.tri, "karta „Všetky tri rady“ má pri 5 miestach zmiznúť");
    over(st.k4 && !st.kufor, "po zmene miest má ostať otvorený krok 4 (nie skok na kufor): " + JSON.stringify(st));
    await ovl.cena.pridajDoKosika(t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, { ...z.ocak, rozlozenie: dva });
    const c = await overCenu(s, ovl, cena);
    return { info: `7 miest + 3 rady -> 5 miest: rozloženie ${dva}, krok 4 ostal otvorený, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
  },

  /**
   * Rohož a box, starý web: tlačidlo posledného kroku („Dokončiť konfiguráciu“ / box „Prejsť k ďalšiemu kroku“) po
   * úplnom výbere rovno vkladá do košíka — živý POST sa zachytí a zruší, overí sa ako `platne`. Nový vzhľad posledný
   * krok zachytí a pošle na súhrn (scenár k-suhrnu).
   */
  async dokoncit(s, a, pom, ovl) {
    if (ovl.zdroj.kroky === "novy") return { preskoc: "nový vzhľad: posledný krok nevkladá do košíka (scenár k-suhrnu)" };
    const posledny = TYPY_TEST[a.produkt.typ].posledny;
    await otvor(s, a.url, { novy: a.novy });
    const z = await zaklad(s, ovl);
    const text = await ovl.kroky.dokonci(s.t, posledny);
    const post = await cakajNaPost(s);
    await pauza(1500); // druhý POST (telefón) prichádza tesne po prvom
    if (s.posty.length > 1) {
      // živý web na telefóne (14. 10. 2026, 598 krok 6 aj rohož/box): configuratorEngine.js klikne PRVÉ viditeľné
      // button.add-to-cart-button = „Do košíka“ v lepivej hlavičke (plugin-fixed-header__basket, mimo formulára) -> 2× POST.
      // D2: starý web neopravujeme, hlásime; nový vzhľad posledný krok zachytí (k-suhrnu).
      over(s.posty.every((p) => p.body === s.posty[0].body), "tlačidlo posledného kroku poslalo " + s.posty.length + " rôzne POST");
      s.upozornenia.push(`živý web: „${text}“ ${s.t.mobil ? "na telefóne" : "na PC"} poslal ${s.posty.length}× ten istý POST do košíka (configuratorEngine.js klikne prvé viditeľné tlačidlo košíka = lepivá hlavička mimo formulára)`);
    }
    const cena = await overPost(s, post, z.ocak);
    const c = await overCenu(s, ovl, cena);
    return { info: `„${text}“ (${posledny}) -> živý POST zachytený a zrušený, priceId ${post.pole.priceId}, cena ${c.videne}`, post: post.body, spolu: cena.spolu };
  },
};

// Typy produktov, na ktorých scenár jadra beží (ostatné sa na produkte nespustia, len spočítajú).
const SET = ["jedno", "dvoj"], ROHOZ = ["kufor-classic", "kufor-premium"];
const TYPY_JADRA = {
  brana: VSETKY_TYPY, "nulova-zmena": VSETKY_TYPY,
  "bez-auta": [...SET, ...ROHOZ], neuplne: [...SET, ...ROHOZ, "boxy"], platne: [...SET, ...ROHOZ, "boxy"],
  "ctx-zapis": SET, "kufor-classic": SET, "kufor-premium": SET, "box-1": SET, "box-2": SET, "kufor-nie": SET, "box-nie": SET,
  "box-krizik": SET, "box-prepni": SET, "rady-3": SET, "miesta-5": SET,
  "k-suhrnu": [...SET, ...ROHOZ, "boxy"], dokoncit: [...ROHOZ, "boxy"],
};

/** Register scenárov: meno -> [{ typy, fn, zdroj }] (jadro + tools/test-1v/scenare-<typ>.mjs). */
const REGISTER = {};
for (const [meno, fn] of Object.entries(SCENARE)) {
  if (!TYPY_JADRA[meno]) throw new Error("scenár jadra " + meno + " nemá typy (TYPY_JADRA)");
  REGISTER[meno] = [{ typy: TYPY_JADRA[meno], fn, zdroj: "jadro" }];
}
for (const [zdroj, mod] of Object.entries({ "scenare-jedno": scJedno, "scenare-dvoj": scDvoj, "scenare-kufor": scKufor, "scenare-boxy": scBoxy, "scenare-vzorky": scVzorky })) {
  for (const [meno, sc] of Object.entries(mod.SCENARE || {})) {
    if (!sc || typeof sc.fn !== "function" || !Array.isArray(sc.typy)) throw new Error(zdroj + ": scenár " + meno + " musí byť { typy: [...], fn }");
    const kolizia = (REGISTER[meno] || []).find((x) => x.typy.some((ty) => sc.typy.includes(ty)));
    if (kolizia) throw new Error(zdroj + ": scenár " + meno + " pre typ " + sc.typy.join(",") + " už je v " + kolizia.zdroj);
    (REGISTER[meno] = REGISTER[meno] || []).push({ typy: sc.typy, fn: sc.fn, zdroj });
  }
}
const scenarPreTyp = (meno, typ) => (REGISTER[meno] || []).find((x) => x.typy.includes(typ)) || null;

async function kuforBoxy(s, a, ovl, { kufor, boxy }) {
  await otvor(s, a.url, { novy: a.novy });
  const z = await zaklad(s, ovl, { rozlozenie: 0 });
  const ocak = { ...z.ocak };
  if (kufor) ocak.kufor = await ovl.kuforBoxy.vyberKufor(s.t, kufor);
  if (boxy) {
    const b = await ovl.kuforBoxy.vyberBoxy(s.t, boxy);
    over(b.farbaBoxov, "farba boxov sa nezapísala");
    ocak.farbaBoxov = b.farbaBoxov;
    if (boxy.pocet === 2) {
      over(b.box1 && b.box2, "2 boxy: veľkosti sa nezapísali " + JSON.stringify(b));
      ocak.box1 = b.box1; ocak.box2 = b.box2;
    } else {
      over(b.boxSolo, "1 box: veľkosť sa nezapísala " + JSON.stringify(b));
      ocak.boxSolo = b.boxSolo;
    }
  }
  await ovl.cena.pridajDoKosika(s.t);
  const post = await cakajNaPost(s);
  const cena = await overPost(s, post, ocak);
  const c = await overCenu(s, ovl, cena);
  return { info: `cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
}

// ------------------------------------------------------------------ konzola
const SUM_ZDROJE = /twitter|rostiapp|luxia|recaptcha|facebook|google|gstatic|youtube|hotjar|tiktok|smartsupp|ecomail|heureka|seznam|bing|clarity/i;
const normChyba = (c) => (c.druh + ": " + c.text).replace(/\d+/g, "#").replace(/\s+/g, " ").slice(0, 200);
const naseChyby = (chyby) => chyby.filter((c) => !SUM_ZDROJE.test(c.zdroj || "") && !SUM_ZDROJE.test(c.text || ""));

// ------------------------------------------------------------------ beh
/** Jadro pre scenáre v tools/test-1v/scenare-<typ>.mjs (piaty parameter scenára). */
const J = { otvor, zaklad, overPost, overCenu, cakajNaPost, nieHodnoty, over, pauza, AUTO, TYPY_TEST };

async function main() {
  const a = argumenty(process.argv.slice(2));
  const produkty = a.produkt ? vyberProdukty(a.produkt) : [a.url ? produktPodlaUrl(a.url) : vyberProdukty("598")[0]];
  if (a.url && a.produkt) { if (produkty.length !== 1) throw new Error("--url ide len s jedným --produkt"); produkty[0] = { ...produkty[0], url: a.url }; }
  if (a.kroky) a.kroky.forEach((m) => { if (!REGISTER[m]) throw new Error("neznámy scenár " + m + " (sú: " + Object.keys(REGISTER).join(", ") + ")"); });
  const zapnute = zapnuteProdukty(a);
  a.zapnuteSet = a.flag ? zapnute[a.flag] : new Set();
  if (a.snimky) mkdirSync(a.snimky, { recursive: true });
  // staré dočasné priečinky po prerušených behoch (> 3 h; bežiace paralelné behy sú mladšie)
  try {
    for (const m of readdirSync(tmpdir())) {
      if (!/^lcd-1v-(chrome|build)-/.test(m)) continue;
      const cesta = join(tmpdir(), m);
      if (Date.now() - statSync(cesta).mtimeMs > 3 * 3600 * 1000) rmSync(cesta, { recursive: true, force: true });
    }
  } catch {}
  const build = await priprav(a);
  const vyber = (mod) => (a.novy && mod.novy ? mod.novy : mod.stary);
  const MODULY = { kroky: ovlKroky, rozlozenie: ovlRozlozenie, kuforBoxy: ovlKuforBoxy, cena: ovlCena, farba2: ovlFarba2, boxy: ovlBoxy, vzorky: ovlVzorky };
  const ovl = Object.fromEntries(Object.entries(MODULY).map(([k, mod]) => [k, vyber(mod)]));
  ovl.zdroj = Object.fromEntries(Object.entries(MODULY).map(([k, mod]) => [k, mod.novy && ovl[k] === mod.novy ? "novy" : "stary"]));

  // úlohy: produkt × šírka × scenár (bez --krok sada z profilu); scenár iného typu sa nespustí, len spočíta
  const ulohy = [], ineTypy = [];
  for (const P of produkty) for (const sirka of a.sirky) for (const m of a.kroky || P.scenare) {
    const sc = scenarPreTyp(m, P.typ);
    if (sc) ulohy.push({ P, sirka, m, fn: sc.fn });
    else if (sirka === a.sirky[0]) ineTypy.push(P.id + ":" + m);
  }
  const flagText = a.flag ? " ?novy=" + a.flag : " (flag vypnutý)";
  console.log(`Konfigurátor 1V — ${produkty.length === 1 ? produkty[0].id + " " + produkty[0].url : produkty.length + (produkty.length < 5 ? " produkty: " : " produktov: ") + produkty.map((P) => P.id).join(", ")}${flagText}
  zdroj: ${build.popis}
  brána: ${zapnute.popis}${a.flag ? "; zapnuté pre ?novy=" + a.flag + ": " + ([...a.zapnuteSet].join(", ") || "nič") : ""}
  ovládače: ${Object.entries(ovl.zdroj).map(([k, v]) => k + "=" + v).join(", ")}
  šírky: ${a.sirky.join(", ")}  úloh: ${ulohy.length}  paralelne: ${a.paralelne}${a.kroky ? "  scenáre: " + a.kroky.join(", ") : ""}`);

  // základ konzoly pre produkt × šírku: živý CDN, načítanie stránky (lenivo, v slote pracovníka -> max. --paralelne Chromov)
  const zakladKonzoly = new Map();
  const konzola = (P, sirka) => {
    const kluc = P.id + "|" + sirka;
    if (!zakladKonzoly.has(kluc)) zakladKonzoly.set(kluc, (async () => {
      const ch = await spustiChrome({ okno: a.okno });
      try {
        const s = await novaStranka(ch, sirka, { js: null, css: null }, a, () => {}, P);
        await otvor(s, P.url);
        await pauza(1500);
        return new Set(naseChyby(s.k.chyby).map(normChyba));
      } finally { await ch.zavri(); }
    })());
    return zakladKonzoly.get(kluc);
  };

  const vysledky = [];
  let dalsia = 0;
  /** Časový limit: Chrome môže na živom webe spadnúť a cdp.mjs potom nikdy neodpovie (beh by visel navždy). */
  const limit = (ms, popis) => {
    let tm;
    const p = new Promise((_, rej) => { tm = setTimeout(() => rej(new Zlyhanie(`časový limit ${Math.round(ms / 1000)} s: ${popis} (Chrome spadol / stránka neodpovedá)`)), ms); });
    p.zrus = () => clearTimeout(tm);
    return p;
  };
  const sLimitom = async (prom, ms, popis) => {
    prom.catch(() => {}); // po vypršaní limitu dobehne (alebo nie) mimo behu — bez unhandled rejection
    const l = limit(ms, popis);
    try { return await Promise.race([prom, l]); } finally { l.zrus(); }
  };

  /** Jeden pokus úlohy -> výsledok v. */
  async function pokus(u) {
    const t0 = Date.now();
    const logy = [];
    const log = (x) => logy.push(x);
    const v = { produkt: u.P.id, typ: u.P.typ, sirka: u.sirka, scenar: u.m, stav: "OK", sprava: "", info: "", post: null, spolu: null, upozornenia: [], chyby: [], logy };
    let s, ch;
    try {
      const zakl = await sLimitom(konzola(u.P, u.sirka), a.limit * 1000, "základ konzoly " + u.P.id).catch((e) => { zakladKonzoly.delete(u.P.id + "|" + u.sirka); throw new Zlyhanie("základ konzoly (CDN " + u.P.id + "): " + e.message); });
      ch = await sLimitom(spustiChrome({ okno: a.okno }), 60000, "spustenie Chrome");
      s = await novaStranka(ch, u.sirka, build, a, log, u.P);
      const pom = { novaStranka: (b) => novaStranka(ch, u.sirka, b, a, log, u.P) };
      const aU = { ...a, url: u.P.url, produkt: u.P };
      // --snimky: aj snímka tesne pred každým „Pridať do košíka“ (po ňom Shoptet stmaví stránku, POST je zrušený)
      let nKosik = 0;
      const meno = `${u.P.id}-${u.m}-${u.sirka}${a.flag ? "-novy" + (a.flag === "vyvoj" ? "-vyvoj" : "") : ""}`;
      const ovlUloha = !a.snimky ? ovl : { ...ovl, cena: { ...ovl.cena, pridajDoKosika: async (t) => {
        await s.k.snimka(join(a.snimky, `${meno}-pred-kosikom${++nKosik > 1 ? "-" + nKosik : ""}.png`)).catch(() => {});
        return ovl.cena.pridajDoKosika(t);
      } } };
      const r = (await sLimitom(Promise.resolve().then(() => u.fn(s, aU, pom, ovlUloha, J)), a.limit * 1000, "scenár " + u.m)) || {};
      if (r.preskoc) { v.stav = "PRESKOČENÉ"; v.sprava = r.preskoc; }
      v.info = r.info || ""; v.post = r.post || null; v.spolu = r.spolu == null ? null : r.spolu;
      // suma podľa profilu (plan.md §4 / produkty.mjs ceny)
      const ocakSpolu = u.P.ceny && u.P.ceny[u.m];
      if (v.stav === "OK" && ocakSpolu != null) over(v.spolu === ocakSpolu, `suma ${v.spolu} ≠ očakávaná ${ocakSpolu} (plan.md §4 / tools/test-1v/produkty.mjs ceny["${u.m}"])`);
      over(s.inePosty.length === 0, "nečakaný zápis na server (zrušený): " + s.inePosty.join(", "));
      if (s.build && (s.build.js || s.build.css)) over(s.podvrhnute.length > 0 || v.stav !== "OK", "lokálny build sa nepodvrhol — stránka nenačítala luxuryCar.js/css z assets/v/<sha>/?");
      const nove = naseChyby(s.k.chyby).filter((c) => !zakl.has(normChyba(c)));
      const zname = (u.P.znameChyby || []);
      const znamaChyba = (c) => zname.some((re) => re.test(c.text || ""));
      const popisChyby = (c) => c.druh + ": " + c.text + (c.zdroj ? " @" + c.zdroj.slice(-60) : "");
      [...new Set(nove.filter(znamaChyba).map((c) => "známa chyba živého webu: " + popisChyby(c)))].forEach((x) => s.upozornenia.push(x));
      v.chyby = nove.filter((c) => !znamaChyba(c)).map(popisChyby);
      over(v.chyby.length === 0, "nové chyby v konzole:\n      " + v.chyby.join("\n      "));
    } catch (e) {
      v.stav = "ZLYHAL";
      v.sprava = e instanceof Zlyhanie ? e.message : (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n      ") : String(e));
    }
    if (s) v.upozornenia = [...new Set(s.upozornenia)];
    try {
      if (a.snimky && s) {
        await sLimitom((async () => {
          await s.k.ev(`(function () { var e = document.querySelector("#product-detail-form .content-wrap") || document.querySelector("#product-detail-form"); if (e) e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`).catch(() => {});
          await pauza(300);
          v.snimka = await s.k.snimka(join(a.snimky, `${u.P.id}-${u.m}-${u.sirka}${a.flag ? "-novy" + (a.flag === "vyvoj" ? "-vyvoj" : "") : ""}${v.stav === "ZLYHAL" ? "-CHYBA" : ""}.png`));
        })(), 20000, "snímka");
      }
    } catch {}
    if (s) v.posty = s.posty.map((p) => p.body);
    if (ch) await ch.zavri();
    v.s = ((Date.now() - t0) / 1000).toFixed(1);
    return v;
  }

  async function pracovnik() {
    while (dalsia < ulohy.length) {
      const u = ulohy[dalsia++];
      let v = await pokus(u);
      // --opakuj: živý web občas nestihne (pomalá noc, iné behy) — zlyhaný scenár sa zopakuje, prvé zlyhanie ostane vo výpise
      const predosle = [];
      for (let i = 0; v.stav === "ZLYHAL" && i < a.opakuj; i++) {
        predosle.push(v.sprava.split("\n")[0]);
        v = await pokus(u);
      }
      if (predosle.length) v.predosle = predosle;
      vysledky.push(v);
      const znak = v.stav === "OK" ? (predosle.length ? "OK*     " : "OK      ") : v.stav === "ZLYHAL" ? "ZLYHAL  " : "PRESKOČ ";
      console.log(`${znak}${String(u.sirka).padEnd(5)} ${String(u.P.id).padEnd(4)} ${u.m.padEnd(14)} ${v.s.padStart(5)} s  ${v.stav === "OK" ? v.info : v.sprava}`);
      predosle.forEach((x, i) => console.log(`        * ${i + 1}. pokus zlyhal: ${x}`));
      v.upozornenia.forEach((x) => console.log("        ! " + x));
      if (a.vypis && v.posty && v.posty.length) v.posty.forEach((b) => console.log("        POST " + b));
      if (a.vypis && v.logy.length) v.logy.forEach((l) => console.log("        log " + l));
    }
  }
  await Promise.all(Array.from({ length: Math.min(a.paralelne, ulohy.length) }, pracovnik));
  if (build.tmp) try { rmSync(build.tmp, { recursive: true, force: true }); } catch {}
  const zle = vysledky.filter((v) => v.stav === "ZLYHAL").length, ok = vysledky.filter((v) => v.stav === "OK").length;
  const upoz = vysledky.reduce((n, v) => n + v.upozornenia.length, 0);
  const opak = vysledky.filter((v) => v.stav === "OK" && v.predosle).length;
  console.log(`\nSpolu: ${ok} OK${opak ? " (z toho " + opak + " až na opakovaný pokus, OK*)" : ""}, ${zle} zlyhalo, ${vysledky.length - ok - zle} preskočené${upoz ? ", " + upoz + " upozornení" : ""} (${a.flag ? "?novy=" + a.flag : "flag vypnutý"}, ${build.popis.split(" (")[0]}, ${produkty.length} ${produkty.length === 1 ? "produkt" : produkty.length < 5 ? "produkty" : "produktov"})`);
  if (ineTypy.length) console.log(`Scenáre iného typu (na produkte nespustené): ${ineTypy.length} — ${ineTypy.join(" ")}`);
  if (a.json) {
    // súhrn podľa produktu: živý POST scenára `platne` (prvá šírka) vs plan.md §4
    const suhrn = {};
    for (const P of produkty) {
      const pl = vysledky.find((v) => v.produkt === P.id && v.scenar === "platne" && v.post);
      const pole = pl ? Object.fromEntries(new URLSearchParams(pl.post)) : null;
      suhrn[P.id] = {
        nazov: P.nazov, url: P.url, typ: P.typ, vzor: P.vzor, ocakavane: P.platne || null, ceny: P.ceny || {}, postKluce: P.postKluce || null,
        platne: pl ? { stav: pl.stav, post: pl.post, priceId: pole.priceId, spolu: pl.spolu, kluce: Object.keys(pole), info: pl.info,
          sedi: !!(P.platne && pole.priceId === P.platne.priceId && pl.spolu === P.platne.spolu && pl.stav === "OK") } : null,
        scenare: Object.fromEntries(vysledky.filter((v) => v.produkt === P.id && v.sirka === a.sirky[0]).map((v) => [v.scenar, { stav: v.stav, spolu: v.spolu, post: v.post, upozornenia: v.upozornenia }])),
        upozornenia: [...new Set(vysledky.filter((v) => v.produkt === P.id).flatMap((v) => v.upozornenia))],
      };
    }
    const { zapnuteSet, ...arg } = a;
    writeFileSync(a.json, JSON.stringify({ cas: new Date().toISOString(), argumenty: arg, zdroj: build.popis, brana: zapnute.popis, ovladace: ovl.zdroj,
      spolu: { ok, okOpakovane: opak, zlyhalo: zle, preskocene: vysledky.length - ok - zle, upozornenia: upoz, ineTypy }, suhrn, vysledky: vysledky.map(({ logy, ...v }) => v) }, null, 1));
  }
  process.exit(zle ? 1 : 0);
}

main().catch((e) => { console.error("CHYBA:", e && e.stack ? e.stack : e); process.exit(2); });
