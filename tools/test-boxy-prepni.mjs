#!/usr/bin/env node
// E2E test: prepínanie počtu boxov v STAROM (živom) konfigurátore — návštevník BEZ ?novy=1, SK Diamond 598 aj CZ 2403.
// Chyba 13. 10. 2026: 1 box (samostatný, „Velikost Box solo“) -> 2 boxy: samostatný box ostal vo formulári,
// POST niesol [104]=734 navyše a košík ukázal 551 € namiesto 442 €.
//
//   node tools/test-boxy-prepni.mjs                       # lokálny build, SK + CZ, všetky scenáre, 1280 px
//   node tools/test-boxy-prepni.mjs --zdroj cdn           # presne živý web (reprodukcia chyby)
//   node tools/test-boxy-prepni.mjs --web cz --scenar 1-2 --sirka 390 --vypis
//
// Scenáre: 1-2 (1 box -> 2 boxy), 2-1 (2 boxy -> 1 box), 1-0 (1 box -> nechcem), 2-0 (2 boxy -> nechcem).
// Každý: auto + farba + rozloženie, výber boxov (karta, farba, veľkosť, „potvrdiť“), zmena, „Pridať do košíka“ ->
// kontrola tela POST (len parametre zvolené NAPOSLEDY, ostatné prázdne / „nie“) a zobrazenej ceny (= variant + príplatky
// očakávaných volieb). ID parametrov nikdy natvrdo: mapa podľa data-parameter-name (tools/test-1v/pomocnik.mjs).
//
// Pomocníci prebraté z tools/test-konfigurator-1v.mjs (zmrazený spúšťač sa nemení): build ako production.yml, podvrhnutie
// luxuryCar.js/css, zachytenie a ZRUŠENIE POST /action/Cart/addCartItem, blokovanie meračov, odmietnutie cookies.
// Žiadna objednávka, žiadny admin, žiadne prihlásenie.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { F, hodnota, otvorKrok as otvorKrokRaz, cislo } from "./test-1v/stary-ui.mjs";
import { stary as cena } from "./test-1v/ovladac-cena.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEBY = {
  sk: { url: "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/", produkt: "598" },
  cz: { url: "https://www.luxurycardesign.cz/luxusne-autokoberce-dragonskin-diamond-line/", produkt: "2403" },
};
const AUTO = { znacka: "Audi", model: "A6", rok: "2015", typ: /^(Combi|Kombi)\b/i };
const MERACE = [
  "*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*",
  "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*",
];

// prvý výber -> druhý výber (pocet 0 = karta „nechcem“); veľkosti S/M/L/XL podľa textu možnosti „M : 40x32x30 cm“
const SCENARE = {
  "1-2": [{ pocet: 1, farba: 2, velkost: "M" }, { pocet: 2, farba: 2, velkost: "M", velkost2: "S" }],
  "2-1": [{ pocet: 2, farba: 1, velkost: "L", velkost2: "S" }, { pocet: 1, farba: 1, velkost: "M" }],
  "1-0": [{ pocet: 1, farba: 2, velkost: "L" }, { pocet: 0 }],
  "2-0": [{ pocet: 2, farba: 0, velkost: "M", velkost2: "S" }, { pocet: 0 }],
};

function argumenty(argv) {
  const a = { zdroj: "lokal", weby: ["sk", "cz"], scenare: Object.keys(SCENARE), sirka: 1280, paralelne: 2, vypis: false, json: null, okno: false, snimky: null };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new Error(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--zdroj") a.zdroj = dalsi();
    else if (x === "--web") a.weby = dalsi().split(",").map((s) => s.trim()).filter(Boolean);
    else if (x === "--scenar") a.scenare = dalsi().split(",").map((s) => s.trim()).filter(Boolean);
    else if (x === "--sirka") a.sirka = Number(dalsi());
    else if (x === "--paralelne") a.paralelne = Math.max(1, Number(dalsi()) || 1);
    else if (x === "--vypis") a.vypis = true;
    else if (x === "--json") a.json = resolve(dalsi());
    else if (x === "--okno") a.okno = true;
    else if (x === "--snimky") a.snimky = resolve(dalsi());
    else if (x === "--help" || x === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 9).join("\n")); process.exit(0); }
    else throw new Error("neznámy prepínač " + x);
  }
  for (const w of a.weby) if (!WEBY[w]) throw new Error("--web sk | cz");
  for (const s of a.scenare) if (!SCENARE[s]) throw new Error("neznámy scenár " + s + " (" + Object.keys(SCENARE).join(", ") + ")");
  return a;
}

// ------------------------------------------------------------------ build (ako tools/test-konfigurator-1v.mjs / production.yml)
function spusti(cmd, args, { shell = false, popis, cwd = KOREN, env } = {}) {
  const moznosti = { cwd, env: env || process.env, encoding: "utf8", shell, maxBuffer: 64 * 1024 * 1024 };
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), moznosti)
    : spawnSync(cmd, args, moznosti);
  if (r.status !== 0) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
  return r;
}
function esbuild() {
  if (process.env.ESBUILD_BINARY_PATH && existsSync(process.env.ESBUILD_BINARY_PATH)) return { cmd: process.env.ESBUILD_BINARY_PATH, pred: [], shell: false };
  const plat = process.platform + "-" + process.arch;
  const bin = join(KOREN, "node_modules", "@esbuild", plat, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
  if (existsSync(bin)) return { cmd: bin, pred: [], shell: false };
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  return { cmd: process.platform === "win32" ? "npx.cmd" : "npx", pred: ["--yes", "esbuild@" + ver], shell: process.platform === "win32", mimoRepa: true };
}
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
    spusti(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...spec], { shell: process.platform === "win32", popis: "npm install (cache testu)", cwd: dir });
  }
  return join(dir, "node_modules");
}
function python() {
  for (const k of [process.env.LCD_PYTHON && [process.env.LCD_PYTHON], ["python"], ["python3"], ["py", "-3"]].filter(Boolean)) {
    if (spawnSync(k[0], [...k.slice(1), "--version"], { encoding: "utf8" }).status === 0) return k;
  }
  throw new Error("python nenájdený (nastav LCD_PYTHON)");
}
async function priprav(a) {
  if (a.zdroj === "cdn") return { popis: "živý CDN bez zmeny", js: null, css: null };
  if (a.zdroj !== "lokal") throw new Error("--zdroj je lokal | cdn");
  const tmp = mkdtempSync(join(tmpdir(), "lcd-boxy-build-"));
  const t0 = Date.now();
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
  if (["konfigurator", "konfigurator.phone"].some((f) => mtime(join(tk, f + ".gen.jsx")) < mtime(join(tk, f + ".jsx")))) spusti(process.execPath, ["truck/build-truck-images.mjs"], { popis: "truck/build-truck-images.mjs" });
  const nodePath = chybajuceBalicky();
  const e = esbuild();
  const prep = [join(KOREN, "assets/js/main.js"), "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--legal-comments=none", "--log-level=warning", "--drop:console"];
  const env = nodePath ? { ...process.env, NODE_PATH: [nodePath, process.env.NODE_PATH].filter(Boolean).join(delimiter) } : process.env;
  spusti(e.cmd, [...e.pred, ...prep], { shell: e.shell, popis: "esbuild", cwd: e.mimoRepa ? tmp : KOREN, env });
  const py = python();
  spusti(py[0], [...py.slice(1), "tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  const js = readFileSync(join(tmp, "luxuryCar.js")), css = readFileSync(join(tmp, "luxuryCar.css"));
  return { popis: `lokálny build (${(js.length / 1024).toFixed(0)} kB JS, ${((Date.now() - t0) / 1000).toFixed(1)} s)`, js, css };
}

// ------------------------------------------------------------------ stránka
function rozober(body) {
  const o = {};
  for (const [k, v] of new URLSearchParams(body || "")) o[k] = v;
  return o;
}

async function novaStranka(ch, a, build, log) {
  const k = await ch.novaKarta({ sirka: a.sirka });
  const s = { k, posty: [], inePosty: [], podvrhnute: [] };
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
          s.posty.push({ url: u, body: p.request.postData || "", pole: rozober(p.request.postData) });
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
        if (p.request.method !== "GET" && !/\/action\/CustomerCookieConsent\//i.test(u)) {
          s.inePosty.push(p.request.method + " " + u);
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
      } else if (build.js && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) {
        s.podvrhnute.push(u);
        return await odpovedz(p, build.js, "application/javascript; charset=utf-8");
      } else if (build.css && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) {
        s.podvrhnute.push(u);
        return await odpovedz(p, build.css, "text/css; charset=utf-8");
      }
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch (e) { log("fetch " + u.slice(0, 80) + ": " + e.message); }
  });
  await k.posli("Fetch.enable", { patterns: [
    { urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" },
    { urlPattern: "*/action/*", requestStage: "Request" },
  ] });
  s.t = vytvorT(k, { novy: false, log });
  return s;
}

/** Otvorí produkt BEZ ?novy=1 (starý vzhľad), odmietne cookies, počká na postavený konfigurátor. */
async function otvor(s, url) {
  await s.k.posli("Page.bringToFront").catch(() => {});
  await s.k.chod(url);
  const t = s.t;
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
    return f.querySelector(".content-wrap .wheel-Position") && f.querySelector(".upsale-buttons.boxs") && f.querySelector(".box-config") && z && z.options.length > 5 && f.querySelector(".content-wrap .next-step-button");
  })()`, { ms: 30000, popis: "postavený konfigurátor" });
  await pauza(1500);
  over(!(await t.ev(`document.body.classList.contains("lcd-1v")`)), "body.lcd-1v bez ?novy=1 — test má bežať na starom vzhľade");
}

class Zlyhanie extends Error {}
const over = (podm, sprava) => { if (!podm) throw new Zlyhanie(sprava); };

async function cakajNaPost(s, ms = 6000) {
  const koniec = Date.now() + ms;
  while (Date.now() < koniec) { if (s.posty.length) return s.posty[s.posty.length - 1]; await pauza(100); }
  throw new Zlyhanie("POST do košíka neodišiel do " + ms / 1000 + " s");
}

/** Hodnoty „nevybrané“ parametra: prázdne alebo možnosť nie / ŽIADNY. */
async function nieHodnoty(t, kluc) {
  const id = await t.idParametra(kluc);
  const nie = await t.ev(`Array.prototype.filter.call((document.querySelector('${F} select[data-parameter-id="${id}"]') || { options: [] }).options, function (o) { return o.value && /^(nie|ne|nechcem|žiadny|zadny|žádný)\\b/i.test(o.text.trim()); }).map(function (o) { return o.value; })`);
  return ["", ...nie];
}

/** Otvorí krok akordeónu (stary-ui.mjs) s opakovaním: pri záťaži sa prvý klik na hlavičku niekedy nechytí. */
async function otvorKrok(t, meno) {
  let chyba;
  for (let pokus = 0; pokus < 3; pokus++) {
    await t.k.posli("Page.bringToFront").catch(() => {});
    try { return await otvorKrokRaz(t, meno); } catch (e) { chyba = e; await pauza(600); }
  }
  throw chyba;
}

/** Klik ako zákazník (t.klikni: skutočná myš, kontrola zakrytia) s opakovaním: pri záťaži (2 Chromy naraz) sa krok
 *  ešte rozbaľuje / okno boxov ešte nabieha a prvok je na chvíľu mimo okna. Zakrytý prvok aj po 4 pokusoch = chyba. */
async function klikni(t, sel, opt = {}) {
  let chyba;
  for (let pokus = 0; pokus < 4; pokus++) {
    // pri viacerých kartách naraz kreslí (a posúva prechody, napr. okno boxov left:1500px -> 0 za 1 s) len karta v popredí
    await t.k.posli("Page.bringToFront").catch(() => {});
    try { return await t.klikni(sel, opt); } catch (e) { chyba = e; await pauza(700); }
  }
  throw chyba;
}

/** Klikne a počká na výsledok; keď sa klik nechytil (prvok sa pod myšou ešte hýbal), klikne znova (najviac 3×). */
async function klikniKym(t, sel, hotovo, { opt = {}, ms = 3500, popis } = {}) {
  for (let pokus = 0; pokus < 3; pokus++) {
    await klikni(t, sel, opt);
    const ok = await t.cakaj(hotovo, { ms, popis }).catch(() => false);
    if (ok) return ok;
  }
  return t.cakaj(hotovo, { ms: 500, popis });
}

/** Farba 1. vrstvy (index voľby) -> value vo variant selecte; ako ovladac-kroky.mjs `stary`, len s opakovaním kliku. */
async function vyberFarbu(t, { index = 0 } = {}) {
  const sel = await otvorKrok(t, "farba");
  const id = await t.idParametra("farba");
  return klikniKym(t, `${sel} .option-button`, `(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { opt: { index, popis: "farba " + index }, popis: "farba vo formulári" });
}

/** Rozloženie (index voľby) -> value v selecte; ako ovladac-rozlozenie.mjs `stary`, len s opakovaním kliku. */
async function vyberRozlozenie(t, { index = 0 } = {}) {
  const sel = await otvorKrok(t, "rozlozenie");
  const id = await t.idParametra("rozlozenie");
  const v = await klikniKym(t, `${sel} .option-button`, `(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { opt: { index, popis: "rozloženie " + index }, popis: "rozloženie vo formulári" });
  await pauza(t.mobil ? 1200 : 300); // mobil: živý kód po 350 ms sám zbalí rozloženie a otvorí kufor
  return v;
}

/** Auto zákazníka (typ podľa regexu: SK „Combi“, CZ môže mať iný text). */
async function vyberAuto(t) {
  await otvorKrok(t, "auto");
  const w = `${F} .modl-selector-wrap`;
  await t.nastavSelect(`${w} .brands select`, AUTO.znacka);
  await t.cakaj(`document.querySelector("${w} .models select").options.length > 1`, { popis: "zoznam modelov" });
  await t.nastavSelect(`${w} .models select`, AUTO.model);
  await t.nastavSelect(`${w} .years select`, AUTO.rok);
  const typ = await t.ev(`(function () { var o = Array.prototype.find.call(document.querySelector("${w} .type-selector select").options, function (o) { return ${AUTO.typ}.test(o.text.trim()); }); return o ? o.text.trim() : null; })()`);
  over(typ, "typ karosérie Combi/Kombi v zozname nie je");
  await t.nastavSelect(`${w} .type-selector select`, typ);
  return t.ev(`sessionStorage.getItem("model")`);
}

/**
 * Výber boxov ako zákazník v starom vzhľade: karta počtu (conf1 / conf2 / nechcem) -> okno: farba, veľkosť(i) ->
 * „potvrdiť“. Vráti hodnoty selectov boxov po výbere.
 */
async function vyberBoxy(t, { pocet, farba = 0, velkost = "S", velkost2 } = {}) {
  if (!(await t.ev(`(document.querySelector("${F} .upsale-buttons.boxs") || {}).offsetHeight > 0`))) {
    await otvorKrok(t, "kufor");
    await klikniKym(t, `${F} .upsale-buttons.trunk > .next-step-button`, `(document.querySelector("${F} .upsale-buttons.boxs") || {}).offsetHeight > 0`, { opt: { popis: "ďalší krok z kufra" }, popis: "krok boxov" });
  }
  await otvorKrok(t, "boxy");
  const karta = pocet === 2 ? "conf2" : pocet === 1 ? "conf1" : "0";
  const selKarty = `${F} .upsale-buttons.boxs > .parameter-cars > .upsale-button[value="${karta}"]`;
  // karta je prepínač (klik na aktívnu ju odznačí) -> znova klikať len kým okno nie je otvorené / karta nie je aktívna
  const vybrata = pocet
    ? `document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`
    : `(function () { var k = document.querySelector(${JSON.stringify(selKarty)}); return !!(k && k.classList.contains("active")) && !document.querySelector("${F} .upsale-Banner").classList.contains("showConf"); })()`;
  // Zbalený krok boxov (.minimalize) prvý klik len rozbalí a o 200 ms okno zatvorí (productPage.js updateUpsale) —
  // zákazník klikne znova. Preto: klik -> 0,6 s -> okno stále otvorené a dobehnuté (inak klik znova, najviac 4×).
  // okno prichádza sprava (.box-config left: 1500px -> 0, transition 1 s): hotové, keď je vypočítaný left 0 (koniec prechodu)
  const okno = `(function () {
      var b = document.querySelector("${F} .upsale-Banner.showConf .box-config");
      return !!b && b.getBoundingClientRect().width > 0 && Math.abs(parseFloat(getComputedStyle(b).left) || 0) < 1;
    })()`;
  for (let pokus = 0; ; pokus++) {
    // otvorené okno zakrýva karty -> klikať len keď okno nie je otvorené
    if (!pocet || !(await t.ev(`!!document.querySelector("${F} .upsale-Banner.showConf")`)))
      await klikniKym(t, selKarty, vybrata, { opt: { popis: "karta boxov " + karta }, popis: pocet ? "okno farby a veľkosti boxov" : "karta nechcem" });
    if (!pocet) break;
    // prechod beží len v karte v popredí (pri --paralelne si ho karty berú navzájom) -> pred každým čakaním do popredia
    await t.k.posli("Page.bringToFront").catch(() => {});
    await pauza(600);
    if (await t.cakaj(okno, { ms: 3500, popis: "okno boxov na mieste" }).catch(() => false)) break;
    if (pokus >= 3) {
      const st = await t.ev(`(function () { var b = document.querySelector("${F} .box-config"); var r = b && b.getBoundingClientRect(); return { showConf: !!document.querySelector("${F} .upsale-Banner.showConf"), left: b && getComputedStyle(b).left, rect: r && [Math.round(r.left), Math.round(r.width)], vw: innerWidth }; })()`);
      throw new Zlyhanie("okno boxov po " + (pokus + 1) + " pokusoch nie je na mieste: " + JSON.stringify(st));
    }
  }
  if (pocet) {
    await pauza(300);
    const idF = await t.idParametra("farbaBoxov");
    await klikniKym(t, `${F} .box-config .parameter-wrap.parameter-${idF} .option-button`, `!!(document.querySelector('${F} select[data-parameter-id="${idF}"]') || {}).value`, { opt: { index: farba, popis: "farba boxov" }, popis: "farba boxov vo formulári" });
    const velkosti = pocet === 2 ? [["box1", velkost], ["box2", velkost2 || velkost]] : [["boxSolo", velkost]];
    for (const [kluc, v] of velkosti) {
      const id = await t.idParametra(kluc);
      const val = await t.moznost(kluc, new RegExp("^" + v + "\\s*:", "i"));
      await klikniKym(t, `${F} .box-config .option-button[data-variant="${id}"][data-value="${val}"]`, `(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { opt: { popis: kluc + " " + v }, popis: kluc + " vo formulári" });
    }
    await klikniKym(t, `${F} .box-config .close-btn.return`, `!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { opt: { popis: "potvrdiť boxy" }, popis: "zatvorené okno boxov" });
  }
  await pauza(700);
  return { farbaBoxov: await hodnota(t, "farbaBoxov"), box1: await hodnota(t, "box1"), box2: await hodnota(t, "box2"), boxSolo: await hodnota(t, "boxSolo") };
}

/** Očakávané hodnoty selectov boxov po výbere v (veľkosti podľa textu, farba = to, čo vybral zákazník). */
async function ocakavaneBoxy(t, v, farbaBoxov) {
  if (!v.pocet) return {};
  const o = { farbaBoxov };
  if (v.pocet === 2) {
    o.box1 = await t.moznost("box1", new RegExp("^" + v.velkost + "\\s*:", "i"));
    o.box2 = await t.moznost("box2", new RegExp("^" + (v.velkost2 || v.velkost) + "\\s*:", "i"));
  } else {
    o.boxSolo = await t.moznost("boxSolo", new RegExp("^" + v.velkost + "\\s*:", "i"));
  }
  return o;
}

/** Cena podľa Shoptetu: cena variantu (necessaryVariantData podľa priceId) + príplatky zadaných hodnôt { idParametra: value }. */
async function cenaPre(t, priceId, hodnoty) {
  return t.ev(`(function (priceId, h) {
    var nvd = (window.shoptet && shoptet.variantsSplit && shoptet.variantsSplit.necessaryVariantData) || {};
    var zaklad = null;
    Object.keys(nvd).forEach(function (k) { if (String(nvd[k].id) === String(priceId)) zaklad = Number(nvd[k].priceUnformatted); });
    var sum = 0, rozpis = [];
    Object.keys(h).forEach(function (id) {
      if (!h[id]) return;
      var o = document.querySelector('#product-detail-form select[data-parameter-id="' + id + '"] option[value="' + h[id] + '"]');
      if (!o) { rozpis.push(id + "=?"); return; }
      var c = Number(o.getAttribute("data-surcharge-final-price"));
      if (!(c > 0)) c = Number(o.getAttribute("data-surcharge-additional-price")) || 0;
      sum += c; rozpis.push(id + "=" + c);
    });
    return { zaklad: zaklad, spolu: zaklad == null ? null : zaklad + sum, rozpis: rozpis.join(" ") };
  })(${JSON.stringify(priceId)}, ${JSON.stringify(hodnoty)})`);
}

async function scenar(s, web, meno, log) {
  const t = s.t;
  const [prvy, druhy] = SCENARE[meno];
  await otvor(s, WEBY[web].url);
  const model = await vyberAuto(t);
  over(/Audi A6 2015/.test(model || ""), "auto pre poznámku objednávky: " + model);
  const farba = await vyberFarbu(t, { index: 2 });
  const rozl = await vyberRozlozenie(t, { index: 0 });
  const po1 = await vyberBoxy(t, prvy);
  log(`  [${web} ${meno}] po 1. výbere ${JSON.stringify(po1)}`);
  const po2 = await vyberBoxy(t, druhy);
  log(`  [${web} ${meno}] po 2. výbere ${JSON.stringify(po2)}`);
  const ocak = await ocakavaneBoxy(t, druhy, po2.farbaBoxov);
  await cena.pridajDoKosika(t);
  const post = await cakajNaPost(s);
  const p = post.pole;
  over(s.inePosty.length === 0, "iný POST na /action/: " + s.inePosty.join(", "));
  over(p.productId === WEBY[web].produkt, "productId " + p.productId);
  const idFarby = await t.idParametra("farba");
  over(p["parameterValueId[" + idFarby + "]"] === farba, "farba v POST " + p["parameterValueId[" + idFarby + "]"] + " ≠ " + farba);
  const sp = async (kluc) => p["surchargeParameterValueId[" + (await t.idParametra(kluc)) + "]"];
  over((await sp("rozlozenie")) === rozl, "rozloženie v POST " + (await sp("rozlozenie")) + " ≠ " + rozl);
  const typ = await t.moznost("typ", AUTO.typ);
  over((await sp("typ")) === typ, "TYP v POST " + (await sp("typ")) + " ≠ " + typ);
  over((await sp("kufor")) === "" || (await nieHodnoty(t, "kufor")).includes(await sp("kufor")), "kufor nevybraný, v POST " + (await sp("kufor")));
  const chyby = [];
  for (const kluc of ["farbaBoxov", "box1", "box2", "boxSolo"]) {
    const v = await sp(kluc);
    if (ocak[kluc]) { if (v !== ocak[kluc]) chyby.push(`${kluc}[${await t.idParametra(kluc)}]=${v} ≠ ${ocak[kluc]}`); }
    else if (!(await nieHodnoty(t, kluc)).includes(v)) chyby.push(`${kluc}[${await t.idParametra(kluc)}]=${v} navyše (má byť prázdne / nie)`);
  }
  // očakávaná cena = variant + rozloženie + TYP + boxy podľa POSLEDNÉHO výberu (nie podľa POST)
  const hodnoty = { [await t.idParametra("rozlozenie")]: rozl, [await t.idParametra("typ")]: typ };
  for (const kluc of ["farbaBoxov", "box1", "box2", "boxSolo"]) if (ocak[kluc]) hodnoty[await t.idParametra(kluc)] = ocak[kluc];
  const c = await cenaPre(t, p.priceId, hodnoty);
  over(c.spolu != null, "cena variantu " + p.priceId + " nie je v necessaryVariantData");
  let videne;
  const koniec = Date.now() + 4000;
  do { videne = await cena.zobrazenaCena(t); if (videne === c.spolu) break; await pauza(200); } while (Date.now() < koniec);
  if (videne !== c.spolu) chyby.push(`zobrazená cena ${videne} ≠ ${c.spolu} (variant ${c.zaklad} + ${c.rozpis})`);
  const postBoxy = post.body.split("&").filter((x) => /surchargeParameterValueId%5B|surchargeParameterValueId\[/.test(x)).join("&");
  over(!chyby.length, chyby.join("; ") + "\n      POST: " + post.body);
  return { info: `cena ${videne} = ${c.zaklad} + ${c.rozpis}`, post: post.body, postBoxy };
}

// ------------------------------------------------------------------ beh
async function main() {
  const a = argumenty(process.argv.slice(2));
  const log = (...x) => { if (a.vypis) console.log(...x); };
  console.log(`test-boxy-prepni: ${a.weby.join("+")} × ${a.scenare.join(",")} @ ${a.sirka} px, zdroj ${a.zdroj}`);
  const build = await priprav(a);
  console.log("  " + build.popis);
  const ch = await spustiChrome({ okno: a.okno });
  const ulohy = [];
  for (const web of a.weby) for (const sc of a.scenare) ulohy.push({ web, sc });
  const vysledky = [];
  let i = 0;
  async function pracovnik() {
    while (i < ulohy.length) {
      const u = ulohy[i++];
      const t0 = Date.now();
      let s;
      const r = { web: u.web, scenar: u.sc };
      try {
        s = await novaStranka(ch, a, build, log);
        Object.assign(r, await scenar(s, u.web, u.sc, log), { ok: true });
        if (build.js) over(s.podvrhnute.length >= 1, "lokálny build sa nepodvrhol");
      } catch (e) {
        r.ok = false;
        r.chyba = e instanceof Zlyhanie ? e.message : "CHYBA TESTU: " + (e.stack || e.message);
        if (s && s.posty.length) r.post = s.posty[s.posty.length - 1].body;
        if (s && a.snimky) { mkdirSync(a.snimky, { recursive: true }); await s.k.snimka(join(a.snimky, `zle-${u.web}-${u.sc}.png`)).catch(() => {}); }
      }
      r.s = ((Date.now() - t0) / 1000).toFixed(1);
      if (s) await s.k.zavri();
      vysledky.push(r);
      console.log(`  ${r.ok ? "OK  " : "ZLE "} ${u.web} ${u.sc} (${r.s} s) ${r.ok ? r.info : r.chyba}`);
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(a.paralelne, ulohy.length) }, pracovnik));
  } finally {
    await ch.zavri();
  }
  if (a.json) writeFileSync(a.json, JSON.stringify(vysledky, null, 2));
  const zle = vysledky.filter((r) => !r.ok);
  console.log(`výsledok: ${vysledky.length - zle.length}/${vysledky.length} OK`);
  process.exit(zle.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
