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
