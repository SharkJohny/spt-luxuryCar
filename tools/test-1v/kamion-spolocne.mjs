// Spoločné pomôcky testov kamion:test (tools/test-kamion-*.mjs): načítanie ES modulov repa cez esbuild (bez varovaní
// o type modulu, cesty na Windows cez file://) a stránka 640 z fixture v jsdom.
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";

export const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FIXTURE = join(KOREN, "tools", "test-1v", "kamion-640.fixture.html");
const TMP = mkdtempSync(join(tmpdir(), "kamion-test-"));
let n = 0;

/** ES modul repa (cesta od koreňa) zbalený esbuildom -> import(). Node knižnice ostávajú externé. */
export async function nacitajModul(rel) {
  const vystup = join(TMP, "m" + ++n + ".mjs");
  await esbuild.build({ entryPoints: [join(KOREN, rel)], bundle: true, format: "esm", platform: "node", outfile: vystup, loader: { ".jsx": "jsx" }, logLevel: "silent" });
  return import(pathToFileURL(vystup).href);
}

/** IIFE bundle prehliadača (vstup = zdrojový text, cesty relatívne ku koreňu repa) -> text. */
export async function bundlePrehliadaca(zdroj, { define } = {}) {
  const r = await esbuild.build({
    stdin: { contents: zdroj, resolveDir: KOREN, loader: "js" },
    bundle: true, format: "iife", write: false, loader: { ".jsx": "jsx" }, logLevel: "silent",
    define: Object.assign({ "process.env.NODE_ENV": '"production"' }, define || {}),
  });
  return r.outputFiles[0].text;
}

/**
 * Stránka 640 z fixture v jsdom (scripts: "outside-only" — skripty vkladá test). Vráti { dom, window, document, chyby }.
 * chyby = console.error stránky (test ich berie ako zlyhanie). url = adresa (napr. s ?novy=vyvoj).
 */
export function stranka({ url = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/", html, uprav } = {}) {
  const chyby = [];
  const vc = new VirtualConsole();
  vc.on("error", (...a) => chyby.push(a.map((x) => (x && x.stack) || String(x)).join(" ")));
  vc.on("jsdomError", (e) => { if (!/Could not parse CSS|Not implemented: HTMLCanvasElement|Not implemented: window.scrollTo|Not implemented: navigation/.test(String(e && e.message))) chyby.push("jsdom: " + ((e && e.message) || e)); });
  let h = html || readFileSync(FIXTURE, "utf8");
  if (uprav) h = uprav(h);
  const dom = new JSDOM(h, { url, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  // prehliadačové API, ktoré jsdom nemá (rovnaké náhrady ako test-truck-mount.mjs)
  w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.scrollTo = function () {};
  w.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  w.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} };
  w.fetch = () => Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve(""), json: () => Promise.resolve({}) });
  return { dom, window: w, document: w.document, chyby };
}

/** Počká n ms (časovače stránky). */
export const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

/** Text zvolenej možnosti selectu podľa data-parameter-id ("" = nič). */
export function zvolene(document, id) {
  const s = document.querySelector('select[data-parameter-id="' + id + '"]');
  if (!s || !s.value) return "";
  return s.options[s.selectedIndex].textContent.trim().replace(/\s*\+\s*€\s*\d+\s*$/, "");
}

/** jQuery zo zložky node_modules (bundle main.js a productPage.js ho čakajú na window.$). */
export function jquery() {
  return readFileSync(join(KOREN, "node_modules", "jquery", "dist", "jquery.js"), "utf8");
}

export { writeFileSync };

/**
 * Cenová a sync logika Reactu vyrezaná zo ŽIVÉHO konfigurator.gen.jsx / .phone.gen.jsx (hranice ako artefakt
 * kontrola-cien.mjs: FIELD_META … FIELD_ORDER + isCzechTruckConfigurator … function Configurator()), spustená
 * nad oknom w (jsdom). Vráti { readShoptetPrices, FALLBACK_PRICES, calculatePrice, syncToShoptet, _parseOptionPrice }.
 */
export function nacitajGen(subor, w) {
  const src = readFileSync(join(KOREN, "assets", "js", "truck-konfigurator", subor), "utf8");
  const i1 = src.indexOf("const FIELD_META"), j1 = src.indexOf("\n", src.indexOf("const FIELD_ORDER"));
  const i2 = src.indexOf("function isCzechTruckConfigurator"), j2 = src.indexOf("function Configurator()");
  if ([i1, j1, i2, j2].some((x) => x < 0)) throw new Error(subor + ": nenašiel som hranice cenovej logiky");
  const kod = src.slice(i1, j1) + "\n" + src.slice(i2, j2);
  for (const f of ["function calculatePrice(state, PRICES)", "function readShoptetPrices", "function syncToShoptet", "function _parseOptionPrice"])
    if (!kod.includes(f)) throw new Error(subor + ": chýba " + f);
  return new Function("window", "document", "Event", "sessionStorage",
    kod + "\nreturn { readShoptetPrices, FALLBACK_PRICES, calculatePrice, syncToShoptet, _parseOptionPrice };")(w, w.document, w.Event, w.sessionStorage);
}

// ------------------------------------------------------------------ stránka 640 s ozajstnou cestou productPage.js + 1V
/** Vstup bundle: presne poradie main.js (initProduct … initKonfigurator1v); nič iné z main.js (sieť, data.json). */
// React kamiónov je naživo samostatná časť lcd-truck.js (functions/lcdCasti.js); v jsdom sa zbalí priamo sem a zapíše
// do window.__lcdCasti.truck skôr, než ju mount.js pýta (jsdom vonkajšie skripty nesťahuje).
const VSTUP_STRANKY = `
import "./assets/js/truck-konfigurator/cast.jsx";
import { initProduct } from "./assets/js/components/productPage.js";
import { initKonfigurator1v } from "./assets/js/components/konfigurator1v/index.js";
window.__spusti = function () { initProduct({}, {}); return initKonfigurator1v({}, {}); };
`;
const bundleStranky = new Map();
/** navyse = kód pred vstupom (napr. import dát modulu a ich úprava pre test) — vlastný bundle, rovnaká inštancia modulov. */
async function bundle(navyse = "") {
  if (!bundleStranky.has(navyse)) bundleStranky.set(navyse, await bundlePrehliadaca(navyse + VSTUP_STRANKY));
  return bundleStranky.get(navyse);
}

/**
 * Otvorí fixture 640 v jsdom, vloží jQuery a bundle a spustí initProduct + initKonfigurator1v (ako main.js).
 * o.url (napr. ?novy=vyvoj), o.uprav(html), o.session { kľúč: hodnota } pred štartom, o.pred(window) pred spustením,
 * o.vstup = kód pred vstupom bundle (napr. 'import { FOTKY_DVERI } from "./assets/…/kamion/data.js"; FOTKY_DVERI.push(…);').
 * Natívne tlačidlo košíka dostane počítadlo klikov a FormData formulára v okamihu kliku (odoslanie sa zruší).
 * Vráti { window, document, chyby, kliky: [{ data: [[k, v]] }], ctx, kamion }.
 */
export async function spustiStranku(o = {}) {
  const s = stranka({ url: o.url, uprav: o.uprav });
  const w = s.window;
  Object.entries(o.session || {}).forEach(([k, v]) => w.sessionStorage.setItem(k, v));
  // inline skripty fixture (dataLayer s projectId / product.id) — jsdom ich pri runScripts "outside-only" nespúšťa
  Array.prototype.forEach.call(w.document.querySelectorAll("script:not([src])"), (x) => w.eval(x.textContent));
  w.eval(jquery());
  const kliky = [];
  const tl = w.document.querySelector("#product-detail-form .add-to-cart button.add-to-cart-button");
  const form = w.document.getElementById("product-detail-form");
  if (form) form.addEventListener("submit", (e) => { e.preventDefault(); });
  if (tl) tl.addEventListener("click", (e) => {
    e.preventDefault();
    kliky.push({ data: Array.from(new w.FormData(form).entries()) });
  });
  if (o.pred) o.pred(w);
  w.eval(await bundle(o.vstup || ""));
  let ctx = null;
  try { ctx = w.__spusti(); } catch (e) { s.chyby.push("__spusti: " + ((e && e.stack) || e)); }
  await pauza(o.cakaj == null ? 150 : o.cakaj);
  return { window: w, document: w.document, chyby: s.chyby, kliky, ctx, kamion: w.__lcd1vKamion || null };
}

/** Klik na prvok nového UI podľa selektora (chyba, ak neexistuje). */
export function klik(document, sel) {
  const el = document.querySelector(sel);
  if (!el) throw new Error("neexistuje " + sel);
  el.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
  return el;
}
/** Výber v select-e nového UI (data-p = pole) a udalosť change. */
export function vyber(document, pole, hodnota) {
  const s = document.querySelector('#lcd1v-kamion select[data-p="' + pole + '"]');
  if (!s) throw new Error("neexistuje pole " + pole);
  s.value = hodnota;
  if (s.value !== hodnota) throw new Error("pole " + pole + " nemá možnosť " + hodnota);
  s.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
}
/** Zaškrtávacie pole nového UI (data-a). */
export function zaskrtni(document, akcia, hodnota) {
  const c = document.querySelector('#lcd1v-kamion input[data-a="' + akcia + '"]');
  if (!c) throw new Error("neexistuje " + akcia);
  c.checked = hodnota;
  c.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
}
