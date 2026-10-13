#!/usr/bin/env node
// E2E test konfigurátora jednovrstvových autokobercov na ŽIVEJ stránke SK Diamond Line (produkt 598)
// s LOKÁLNYM buildom (13. 10. 2026). SPOLOČNÝ SÚBOR — po základe sa nemení (scenáre aj spúšťač).
// Ovládače krokov sú v tools/test-1v/ovladac-<krok>.mjs (každý patrí jednému workerovi), kontrakt docs/1v-kontrakt.md.
//
//   node tools/test-konfigurator-1v.mjs                      # všetky scenáre, 1280 aj 390, flag vypnutý
//   node tools/test-konfigurator-1v.mjs --novy               # to isté s ?novy=1 (nový vzhľad, ovládače `novy`)
//   node tools/test-konfigurator-1v.mjs --sirka 390 --krok platne,box-2 --snimky C:/tmp/snimky --vypis
//   node tools/test-konfigurator-1v.mjs --zdroj cdn          # bez lokálneho buildu = presne živý web
//   node tools/test-konfigurator-1v.mjs --zdroj 5db0f33      # verzia nahratá na CDN (assets/v/<sha>/)
//
// Ako: Chrome bez okna (surový CDP, žiadne npm balíky). Požiadavky na bundle a CSS živého webu
// (…/eshopy/luxuryCar/assets/v/<sha>/js/luxuryCar.js, …/css/luxuryCar.css) dostanú odpoveď z čerstvého lokálneho
// buildu: esbuild assets/js/main.js s rovnakými prepínačmi ako .github/workflows/production.yml + CSS z
// tools/vloz-lcd-css.py --vystup (aktuálne partialy, repo ostane nezmenené) — oboje do vlastného dočasného
// priečinka každého behu. …/assets/img/1v/* -> lokálne assets/img/1v/*.
// Bezpečnosť: každý POST /action/Cart/addCartItem sa zachytí a ZRUŠÍ (test kontroluje jeho telo), iný POST na /action/
// sa zruší a test zlyhá; merače (GA, GTM, FB, TikTok, Hotjar…) sú zablokované; cookie lišta sa odmietne;
// žiadna objednávka, žiadne prihlásenie.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { cislo } from "./test-1v/stary-ui.mjs";
import * as ovlKroky from "./test-1v/ovladac-kroky.mjs";
import * as ovlRozlozenie from "./test-1v/ovladac-rozlozenie.mjs";
import * as ovlKuforBoxy from "./test-1v/ovladac-kufor-boxy.mjs";
import * as ovlCena from "./test-1v/ovladac-cena.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/";
const URL_598 = "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/";
const URL_INY = "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-hexa-line/"; // 610: nie je v zozname 1V
const AUTO = { znacka: "Audi", model: "A6", rok: "2015", typ: "Combi" }; // Combi = TYP s príplatkom
const MERACE = [
  "*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*",
  "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*",
];

// ------------------------------------------------------------------ prepínače
function argumenty(argv) {
  const a = { novy: false, sirky: [1280, 390], kroky: null, snimky: null, zdroj: "lokal", url: URL_598, paralelne: 3, okno: false, vypis: false, json: null, bezDrop: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new Error(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--novy") a.novy = true;
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
    else if (x === "--help" || x === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 9).join("\n")); process.exit(0); }
    else throw new Error("neznámy prepínač " + x);
  }
  return a;
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
async function novaStranka(ch, sirka, build, a, log) {
  const k = await ch.novaKarta({ sirka });
  const s = { k, posty: [], inePosty: [], podvrhnute: [], build };
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

/** Otvorí produkt, odmietne cookies, počká na postavený konfigurátor. */
async function otvor(s, url, { novy = false, kontrola1v = novy } = {}) {
  const ciel = novy ? url + (url.includes("?") ? "&" : "?") + "novy=1" : url;
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
  await t.cakaj(`!!(function () {
    var f = document.getElementById("product-detail-form"); if (!f) return false;
    var z = f.querySelector(".modl-selector-wrap .brands select");
    return f.querySelector(".content-wrap .wheel-Position") && f.querySelector(".upsale-buttons.trunk") && z && z.options.length > 5 && f.querySelector(".content-wrap .next-step-button");
  })()`, { ms: 30000, popis: "postavený konfigurátor" });
  await pauza(1500); // configurator-enhance (600 ms interval), tlačidlá krokov, prvé prekreslenie
  if (kontrola1v) {
    const st = await t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), chyby: window.__lcd1v ? window.__lcd1v.chyby : null })`);
    over(st.trieda, "?novy=1, ale body.lcd-1v chýba" + (st.chyby && st.chyby.length ? " — init modulu zlyhal: " + st.chyby.join("; ") : " (brána / build?)"));
  }
  s.formKluce = await t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    var k = ["productId", "priceId", "language", "amount"], volitelne = [];
    Array.prototype.forEach.call(f.querySelectorAll("select[name]"), function (s) { k.push(s.name); });
    // rádiá rozloženia (creatButtons.js: name="parameter-<id>"): po skutočnom kliku sú zaškrtnuté a idú do POST navyše
    Array.prototype.forEach.call(f.querySelectorAll(".content-wrap input[type=radio][name^='parameter-']"), function (r) { if (volitelne.indexOf(r.name) < 0) volitelne.push(r.name); });
    return { povinne: k.sort(), volitelne: volitelne };
  })()`);
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
 * Kontrola tela POST: ocak = { farba, rozlozenie, kufor?, farbaBoxov?, box1?, box2?, boxSolo? } (chýba = „nevybrané“).
 * Vráti očakávanú cenu.
 */
async function overPost(s, post, ocak) {
  const p = post.pole, t = s.t;
  const kluce = Object.keys(p).sort();
  const povinne = kluce.filter((k) => !s.formKluce.volitelne.includes(k));
  over(JSON.stringify(povinne) === JSON.stringify(s.formKluce.povinne), "kľúče POST " + kluce.join(",") + " ≠ polia formulára " + s.formKluce.povinne.join(",") + " (+ voliteľné " + s.formKluce.volitelne.join(",") + ")");
  const ctx = await t.ev(`(function () { var d = (window.dataLayer || []).find(function (x) { return x && x.shoptet; }); d = d && d.shoptet; return { pid: String(d.product.id), jazyk: d.language }; })()`);
  over(p.productId === ctx.pid, "productId " + p.productId + " ≠ " + ctx.pid);
  over(p.language === ctx.jazyk, "language " + p.language);
  over(p.amount === "1", "amount " + p.amount);
  const idF = await t.idParametra("farba");
  over(p["parameterValueId[" + idF + "]"] === ocak.farba, "farba v POST " + p["parameterValueId[" + idF + "]"] + " ≠ " + ocak.farba);
  const priceId = await t.ev(`(function () { var n = shoptet.variantsSplit.necessaryVariantData["${idF}-${ocak.farba}"]; return n ? String(n.id) : null; })()`);
  over(priceId && p.priceId === priceId, "priceId " + p.priceId + " ≠ variant farby " + priceId);
  const sp = async (kluc) => p["surchargeParameterValueId[" + (await t.idParametra(kluc)) + "]"];
  over((await sp("rozlozenie")) === ocak.rozlozenie, "rozloženie v POST " + (await sp("rozlozenie")) + " ≠ " + ocak.rozlozenie);
  const radio = "parameter-" + (await t.idParametra("rozlozenie"));
  if (radio in p) over(p[radio] === ocak.rozlozenie, "rádio " + radio + "=" + p[radio] + " ≠ rozloženie " + ocak.rozlozenie);
  const typ = await t.moznost("typ", new RegExp("^" + AUTO.typ + "\\b", "i"));
  over((await sp("typ")) === typ, "TYP v POST " + (await sp("typ")) + " ≠ " + typ + " (" + AUTO.typ + ")");
  for (const kluc of ["kufor", "farbaBoxov", "box1", "box2", "boxSolo"]) {
    const v = await sp(kluc);
    if (ocak[kluc]) over(v === ocak[kluc], kluc + " v POST " + v + " ≠ " + ocak[kluc]);
    else {
      const n = await nieHodnoty(s, kluc);
      over(n.hodnoty.includes(v), kluc + " nevybrané, ale v POST je " + v + " (povolené: " + n.hodnoty.join("|") + ")");
    }
  }
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

/** Spoločný začiatok: auto + farba + rozloženie -> { model, farba, rozlozenie } */
async function zaklad(s, ovl, { farba = 2, rozlozenie = 1 } = {}) {
  const t = s.t;
  const model = await ovl.kroky.vyberAuto(t, AUTO);
  over(model === [AUTO.znacka, AUTO.model, AUTO.rok, AUTO.typ].join(" "), "auto pre poznámku objednávky (#remark): sessionStorage.model = " + model);
  const f = await ovl.kroky.vyberFarbu(t, { index: farba });
  const r = await ovl.rozlozenie.vyberRozlozenie(t, { index: rozlozenie });
  return { model, farba: f, rozlozenie: r };
}

// ------------------------------------------------------------------ scenáre
const SCENARE = {
  /** Brána: bez flagu nič, ?novy=1 zapne (len SK 598), ?novy=0 vypne. */
  async brana(s, a) {
    const t = s.t;
    const stav = () => t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), flag: (function () { try { return sessionStorage.getItem("lcd1v"); } catch (e) { return "x"; } })(), ctx: !!window.__lcd1v })`);
    await otvor(s, a.url);
    let st = await stav();
    over(!st.trieda && !st.flag && !st.ctx, "bez ?novy=1 nesmie byť nič zapnuté: " + JSON.stringify(st));
    if (!a.novy) return { info: "flag vypnutý: bez zmeny" };
    await otvor(s, a.url, { novy: true });
    st = await stav();
    over(st.trieda && st.flag === "1" && st.ctx, "?novy=1 má zapnúť body.lcd-1v + sessionStorage lcd1v=1: " + JSON.stringify(st));
    await otvor(s, a.url);
    st = await stav();
    over(st.trieda, "flag má platiť aj po prechode bez parametra (sessionStorage karty): " + JSON.stringify(st));
    await otvor(s, URL_INY, { novy: true, kontrola1v: false });
    st = await stav();
    over(!st.trieda && !st.ctx, "iný produkt (610) nesmie dostať nový vzhľad: " + JSON.stringify(st));
    await otvor(s, a.url + "?novy=0");
    st = await stav();
    over(!st.trieda && !st.flag && !st.ctx, "?novy=0 má vypnúť: " + JSON.stringify(st));
    return { info: "?novy=1 zapne, platí v karte, 610 nie, ?novy=0 vypne" };
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
        znacky: f.querySelector(".modl-selector-wrap .brands select").options.length,
        cena: (document.querySelector(".p-final-price-wrapper") || {}).textContent.replace(/\\s+/g, " ").trim(),
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
      await otvor(n, a.url, { novy: true });
      const C = await n.t.ev(USTALENE).then(() => n.t.ev(PODPIS));
      await n.k.zavri();
      const rn = rozdiel(A, C);
      info += "; s ?novy=1 oproti CDN: " + (rn.length ? rn.join(" ; ") : "bez rozdielu");
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

  /** Neúplný výber: bez farby a bez rozloženia sa nedá pridať, červený rám na chýbajúcom kroku. */
  async neuplne(s, a, pom, ovl) {
    const t = s.t;
    await otvor(s, a.url, { novy: a.novy });
    await ovl.kroky.vyberAuto(t, AUTO);
    await ovl.cena.pridajDoKosika(t);
    let c = await ovl.kroky.cervenyKrok(t);
    over(c === "farba", "bez farby: červený rám má byť na farbe, je na: " + c);
    await pauza(3200);
    await ovl.kroky.vyberFarbu(t, { index: 3 });
    await ovl.cena.pridajDoKosika(t);
    c = await ovl.kroky.cervenyKrok(t);
    over(c === "rozlozenie", "bez rozloženia: červený rám má byť na rozložení, je na: " + c);
    await pauza(1200);
    over(s.posty.length === 0, "neúplný výber odišiel do košíka: " + (s.posty[0] && s.posty[0].body));
    return { info: "farba -> červený rám, rozloženie -> červený rám, POST 0" };
  },

  /** Auto + farba + rozloženie: platný POST, kufor a boxy „nevybrané“, cena = Shoptet. */
  async platne(s, a, pom, ovl) {
    await otvor(s, a.url, { novy: a.novy });
    const st = await overKuforSkryty(s, ovl);
    const z = await zaklad(s, ovl);
    await ovl.cena.pridajDoKosika(s.t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie });
    const c = await overCenu(s, ovl, cena);
    return { info: `cena ${c.videne} (odporúčaná ${c.odporucana.cena}, −${c.odporucana.zlava} %), kufor/boxy na začiatku ${JSON.stringify(st)}`, post: post.body };
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
    const cena = await overPost(s, post, { farba: farba.h, rozlozenie: rozl.h, kufor: kufor.h, farbaBoxov: fb.h, box1: b1.h, box2: b2.h });
    over(stav.cena.spolu === cena.spolu, "ctx.cena().spolu " + stav.cena.spolu + " ≠ Shoptet " + cena.spolu);
    over(stav.cena.odporucana === Math.ceil((cena.spolu * 1.6) / 10) * 10, "ctx.cena().odporucana " + stav.cena.odporucana);
    await overCenu(s, ovl, cena);
    return { info: `zapis() ${[farba, rozl, kufor, fb, b1, b2].map((r) => r.cesta).join("/")}, ctx.cena ${stav.cena.spolu} = Shoptet, doKosika -> POST OK`, post: post.body };
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
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie });
    const c = await overCenu(s, ovl, cena);
    return { info: `Classic -> Nechcem: kufor ${JSON.stringify(v)}, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body };
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
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie });
    const c = await overCenu(s, ovl, cena);
    return { info: `1 box -> Nechcem: ${JSON.stringify(b)}, cena ${c.videne}`, post: post.body };
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
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie });
    const c = await overCenu(s, ovl, cena);
    return { info: `krížik: ${JSON.stringify(b.hodnoty)}, cena ${c.videne}`, post: post.body };
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
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie, farbaBoxov: b.farbaBoxov, box1: b.box1, box2: b.box2 });
    const c = await overCenu(s, ovl, cena);
    return { info: `1 box M -> 2 boxy L+S: cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body };
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
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie });
    const c = await overCenu(s, ovl, cena);
    return { info: `${miesta ? "miesta " + miesta + ", " : ""}cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body };
  },

  /** Nový vzhľad: krok 6 „Pokračujte k súhrnu“ nič nevkladá do košíka — zatvorí krok a posunie na súhrn (Spolu +
   *  tlačidlo košíka); potom „Vložte do košíka“ pošle platný POST. */
  async "k-suhrnu"(s, a, pom, ovl) {
    if (ovl.zdroj.kroky !== "novy") return { preskoc: "len nový vzhľad (naživo krok 6 „Prejsť do košíka“ rovno vkladá)" };
    const t = s.t;
    await otvor(s, a.url, { novy: true });
    const z = await zaklad(s, ovl, { rozlozenie: 1 });
    const { otvorKartu } = await import("./test-1v/ovladac-kroky.mjs");
    const sel = await otvorKartu(t, "boxy");
    const text = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(sel + " > .next-step-button")}); return b ? b.getAttribute("data-lcd1v-text") : null; })()`);
    over(text === "Pokračujte k súhrnu", "text tlačidla kroku 6: " + text);
    await t.klikni(`${sel} > .next-step-button`, { popis: "Pokračujte k súhrnu" });
    await pauza(1500);
    over(s.posty.length === 0, "„Pokračujte k súhrnu“ poslal POST do košíka: " + (s.posty[0] && s.posty[0].body));
    const st = await t.ev(`(function () { var k = document.querySelector(${JSON.stringify(sel)}); var e = document.querySelector(".lcd1v-suhrn"); var r = e && e.getBoundingClientRect();
      return { otvoreny: k.classList.contains("active"), vidno: !!(r && r.top >= 0 && r.bottom <= innerHeight), aktivne: document.querySelectorAll("#product-detail-form .lcd1v-krok.active").length }; })()`);
    over(!st.otvoreny && st.aktivne === 0, "po „Pokračujte k súhrnu“ majú byť kroky zatvorené: " + JSON.stringify(st));
    over(st.vidno, "súhrn (Spolu) má byť po „Pokračujte k súhrnu“ na obrazovke: " + JSON.stringify(st));
    await ovl.cena.pridajDoKosika(t);
    const post = await cakajNaPost(s);
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: z.rozlozenie });
    const c = await overCenu(s, ovl, cena);
    return { info: `krok 6 -> súhrn bez POST, kroky zatvorené, Spolu na obrazovke; potom košík: cena ${c.videne}`, post: post.body };
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
    const cena = await overPost(s, post, { farba: z.farba, rozlozenie: dva });
    const c = await overCenu(s, ovl, cena);
    return { info: `7 miest + 3 rady -> 5 miest: rozloženie ${dva}, krok 4 ostal otvorený, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body };
  },
};

async function kuforBoxy(s, a, ovl, { kufor, boxy }) {
  await otvor(s, a.url, { novy: a.novy });
  const z = await zaklad(s, ovl, { rozlozenie: 0 });
  const ocak = { farba: z.farba, rozlozenie: z.rozlozenie };
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
  return { info: `cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body };
}

// ------------------------------------------------------------------ konzola
const SUM_ZDROJE = /twitter|rostiapp|luxia|recaptcha|facebook|google|gstatic|youtube|hotjar|tiktok|smartsupp|ecomail|heureka|seznam|bing|clarity/i;
const normChyba = (c) => (c.druh + ": " + c.text).replace(/\d+/g, "#").replace(/\s+/g, " ").slice(0, 200);
const naseChyby = (chyby) => chyby.filter((c) => !SUM_ZDROJE.test(c.zdroj || "") && !SUM_ZDROJE.test(c.text || ""));

// ------------------------------------------------------------------ beh
async function main() {
  const a = argumenty(process.argv.slice(2));
  const mena = a.kroky || Object.keys(SCENARE);
  mena.forEach((m) => { if (!SCENARE[m]) throw new Error("neznámy scenár " + m + " (sú: " + Object.keys(SCENARE).join(", ") + ")"); });
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
  const ovl = {
    kroky: a.novy && ovlKroky.novy ? ovlKroky.novy : ovlKroky.stary,
    rozlozenie: a.novy && ovlRozlozenie.novy ? ovlRozlozenie.novy : ovlRozlozenie.stary,
    kuforBoxy: a.novy && ovlKuforBoxy.novy ? ovlKuforBoxy.novy : ovlKuforBoxy.stary,
    cena: a.novy && ovlCena.novy ? ovlCena.novy : ovlCena.stary,
  };
  ovl.zdroj = Object.fromEntries(Object.entries(ovl).map(([k, v]) => [k, v === ovlKroky.novy || v === ovlRozlozenie.novy || v === ovlKuforBoxy.novy || v === ovlCena.novy ? "novy" : "stary"]));
  console.log(`Konfigurátor 1V — ${a.url}${a.novy ? " ?novy=1" : " (flag vypnutý)"}\n  zdroj: ${build.popis}\n  ovládače: ${Object.entries(ovl.zdroj).map(([k, v]) => k + "=" + v).join(", ")}\n  šírky: ${a.sirky.join(", ")}  scenáre: ${mena.join(", ")}`);

  // základ konzoly pre každú šírku: živý CDN, načítanie stránky
  const zakladKonzoly = {};
  for (const sirka of a.sirky) {
    zakladKonzoly[sirka] = (async () => {
      const ch = await spustiChrome({ okno: a.okno });
      try {
        const s = await novaStranka(ch, sirka, { js: null, css: null }, a, () => {});
        await otvor(s, a.url);
        await pauza(1500);
        return new Set(naseChyby(s.k.chyby).map(normChyba));
      } finally { await ch.zavri(); }
    })();
  }

  const ulohy = [];
  for (const sirka of a.sirky) for (const m of mena) ulohy.push({ sirka, m });
  const vysledky = [];
  let dalsia = 0;
  async function pracovnik() {
    while (dalsia < ulohy.length) {
      const u = ulohy[dalsia++];
      const t0 = Date.now();
      const logy = [];
      const log = (x) => logy.push(x);
      const ch = await spustiChrome({ okno: a.okno });
      let s;
      const v = { sirka: u.sirka, scenar: u.m, stav: "OK", sprava: "", info: "", post: null, chyby: [] };
      try {
        s = await novaStranka(ch, u.sirka, build, a, log);
        const pom = { novaStranka: (b) => novaStranka(ch, u.sirka, b, a, log) };
        // --snimky: aj snímka tesne pred každým „Pridať do košíka“ (po ňom Shoptet stmaví stránku, POST je zrušený)
        let nKosik = 0;
        const ovlUloha = !a.snimky ? ovl : { ...ovl, cena: { ...ovl.cena, pridajDoKosika: async (t) => {
          await s.k.snimka(join(a.snimky, `${u.m}-${u.sirka}${a.novy ? "-novy" : ""}-pred-kosikom${++nKosik > 1 ? "-" + nKosik : ""}.png`)).catch(() => {});
          return ovl.cena.pridajDoKosika(t);
        } } };
        const r = (await SCENARE[u.m](s, a, pom, ovlUloha)) || {};
        if (r.preskoc) { v.stav = "PRESKOČENÉ"; v.sprava = r.preskoc; }
        v.info = r.info || ""; v.post = r.post || null;
        over(s.inePosty.length === 0, "nečakaný zápis na server (zrušený): " + s.inePosty.join(", "));
        if (s.build && (s.build.js || s.build.css)) over(s.podvrhnute.length > 0 || v.stav !== "OK", "lokálny build sa nepodvrhol — stránka nenačítala luxuryCar.js/css z assets/v/<sha>/?");
        const zakl = await zakladKonzoly[u.sirka];
        const nove = naseChyby(s.k.chyby).filter((c) => !zakl.has(normChyba(c)));
        v.chyby = nove.map((c) => c.druh + ": " + c.text + (c.zdroj ? " @" + c.zdroj.slice(-60) : ""));
        over(nove.length === 0, "nové chyby v konzole:\n      " + v.chyby.join("\n      "));
      } catch (e) {
        v.stav = "ZLYHAL";
        v.sprava = e instanceof Zlyhanie ? e.message : (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n      ") : String(e));
      }
      try {
        if (a.snimky && s) {
          await s.k.ev(`(function () { var e = document.querySelector("#product-detail-form .content-wrap"); if (e) e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`).catch(() => {});
          await pauza(300);
          v.snimka = await s.k.snimka(join(a.snimky, `${u.m}-${u.sirka}${a.novy ? "-novy" : ""}${v.stav === "ZLYHAL" ? "-CHYBA" : ""}.png`));
        }
      } catch {}
      if (s && a.vypis) v.posty = s.posty.map((p) => p.body);
      await ch.zavri();
      v.s = ((Date.now() - t0) / 1000).toFixed(1);
      vysledky.push(v);
      const znak = v.stav === "OK" ? "OK      " : v.stav === "ZLYHAL" ? "ZLYHAL  " : "PRESKOČ ";
      console.log(`${znak}${String(u.sirka).padEnd(5)} ${u.m.padEnd(14)} ${v.s.padStart(5)} s  ${v.stav === "OK" ? v.info : v.sprava}`);
      if (a.vypis && v.posty && v.posty.length) v.posty.forEach((b) => console.log("        POST " + b));
      if (a.vypis && logy.length) logy.forEach((l) => console.log("        log " + l));
    }
  }
  await Promise.all(Array.from({ length: Math.min(a.paralelne, ulohy.length) }, pracovnik));
  if (build.tmp) try { rmSync(build.tmp, { recursive: true, force: true }); } catch {}
  const zle = vysledky.filter((v) => v.stav === "ZLYHAL").length, ok = vysledky.filter((v) => v.stav === "OK").length;
  console.log(`\nSpolu: ${ok} OK, ${zle} zlyhalo, ${vysledky.length - ok - zle} preskočené (${a.novy ? "--novy" : "flag vypnutý"}, ${build.popis.split(" (")[0]})`);
  if (a.json) writeFileSync(a.json, JSON.stringify({ argumenty: a, zdroj: build.popis, ovladace: ovl.zdroj, vysledky }, null, 1));
  process.exit(zle ? 1 : 0);
}

main().catch((e) => { console.error("CHYBA:", e && e.stack ? e.stack : e); process.exit(2); });
