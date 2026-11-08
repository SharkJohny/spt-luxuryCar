// Test prebliknutia obsahu pod konfigurátorom triedy V (SK 646, Michal 8. 11. 2026: pri načítaní a F5 sa na pol sekundy
// ukáže holý obsah — nadpis „V CLASS OD PEDÁLOV AŽ PO KUFOR“, odrážky, fotka „Miesto šoféra“ cez celú šírku, hore prázdne
// miesto). Korene obsahu p1v-vclass-1/2 (Popis produktu) ukáže obsah.js z hlavného balíka hneď po postavení konfigurátora,
// ich štýly (#lcd-vclass-css) a body.lcd-vclass však prídu až so samostatnou časťou js/lcd-vclass.js. Živá stránka
// (dočasný prehliadač Playwright, anonymne, trackery zablokované, nič sa neobjednáva) s lokálnym buildom namiesto
// assets/v/<sha>/; časť lcd-vclass.js test zámerne oneskorí, aby medzera medzi obsahom a jeho štýlom bola vždy merateľná.
//   1) načítanie navrchu (časť +2,5 s): obsah ani raz viditeľný bez štýlu (každý snímok rAF), medzera naozaj nastala;
//      po štýle oba korene v .p1v-miesto, viditeľné, v štýlovanej výške; reveal .rv obsahu pod oknom ostáva nastavený;
//   2) F5 zo stredu obsahu (časť +1,5 s): obsah ani raz bez štýlu a okno skončí pri tom istom mieste obsahu (PC; telefón
//      len výpis, pozri nižšie);
//   3) časť sa nenačíta (404, aj opakovania): obsah ani raz bez štýlu, nový vzhľad sa zloží a natívny formulár sa ukáže;
//   4) časť príde o 11 s (len prvá šírka): obsah sa po 8 s poistky ukáže aj bez nej (dá sa čítať), potom so štýlom;
//   5) pomalý telefón navrchu (Slow 4G + CPU 4×, 3 behy, len šírka pod 768): okno ostane navrchu aj keď sa nad obsahom
//      ukáže konfigurátor — ručné ukotvenie obsah.js (kotva) neukotvuje obsah, ktorý zákazník ešte nevidí (pred opravou
//      okno skočilo o +1 822 px na obsah, súbeh oživenia sekcie s príchodom časti).
//
//   node tools/test-vclass-fouc.mjs --pw <file:///…/playwright/index.mjs> [--dist <priečinok s luxuryCar.js, luxuryCar.css,
//        lcd-vclass.js>] [--zivy] [--sirky 1366,390] [--bez-poistky] [--len 1,2,3,4,5]
//   Bez --dist sa postaví lokálne ako CI (esbuild main.js a casti/vclass.js, CSS minify) do dočasného priečinka.
//   --zivy = bez podvrhu, skúša sa verzia, ktorá je naživo (kontrola „pred“).
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const ma = (n) => process.argv.includes("--" + n);
const ADRESA = "https://www.luxurycardesign.sk/autokoberce-mercedes-v-class/";
const BLOK = /googletagmanager|google-analytics|doubleclick|facebook|connect\.facebook|tiktok|hotjar|clarity\.ms|ecomail|smartsupp|bing\.com|sklik|seznam|luxia|heureka|pinterest|googleadservices|metricool/i;
/** Výška koreňa 1 so štýlom je ~8 000 px (1366 aj 390), bez štýlu 23 000–58 000 px. */
const MAX_VYSKA_SO_STYLOM = 15000;

let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ZLE  " + t); } };

const pwUrl = arg("pw");
if (!pwUrl) { console.error("chýba --pw"); process.exit(2); }
const pw = await import(pathToFileURL(pwUrl.replace(/^file:\/+/, "")).href);
const zivy = ma("zivy");
let dist = arg("dist"), tmp = null;
if (!dist && !zivy) {
  tmp = dist = mkdtempSync(join(tmpdir(), "lcd-vclass-fouc-"));
  const eb = (vstup, vystup, extra) => spawnSync(process.execPath, ["node_modules/esbuild/bin/esbuild", vstup, "--outfile=" + join(dist, vystup)].concat(extra), { stdio: "inherit" }).status;
  const js = ["--bundle", "--format=iife", "--minify", "--drop:console", "--legal-comments=none", "--log-level=error"];
  if (eb("assets/js/main.js", "luxuryCar.js", js.concat("--loader:.jsx=jsx")) || eb("assets/js/casti/vclass.js", "lcd-vclass.js", js)
    || eb("assets/css/luxuryCar.css", "luxuryCar.css", ["--minify", "--target=chrome80,firefox78,safari13", "--log-level=error"])) process.exit(2);
}
const SUB = zivy ? null : { js: readFileSync(join(dist, "luxuryCar.js")), css: readFileSync(join(dist, "luxuryCar.css")), vclass: readFileSync(join(dist, "lcd-vclass.js")) };
const sirky = String(arg("sirky", "1366,390")).split(",").map(Number);
const len = arg("len") ? String(arg("len")).split(",") : null;
const beh = (n) => !len || len.indexOf(String(n)) > -1;

/** V stránke: každý snímok (rAF) stav obsahu triedy V. Viditeľný = koreň má rozmer a jeho text nie je visibility: hidden. */
function sledovanie() {
  const s = (window.__vf = { snimky: 0, medzera: 0, bezStylu: 0, prvyBezStylu: null, zobrazeny: null, css: null, vyska: 0 });
  const viditelny = () => Array.prototype.some.call(document.querySelectorAll('[data-lcd-cast^="p1v-vclass"]'), (k) => {
    if (!k.getClientRects().length || !k.offsetHeight) return false;
    const t = k.querySelector("h2, h3, p, img") || k;
    return getComputedStyle(t).visibility === "visible";
  });
  const krok = () => {
    const b = document.body, css = !!document.getElementById("lcd-vclass-css"), t = Math.round(performance.now());
    const k = document.querySelector('.p1v-miesto > [data-lcd-cast="p1v-vclass-1"]');
    s.snimky++;
    if (k && s.zobrazeny == null && k.offsetHeight) s.zobrazeny = t; // koreň je na mieste a má rozmer (aj keď skrytý)
    if (b && b.classList.contains("lcd-1v") && !css) s.medzera++;
    if (!css && viditelny()) { s.bezStylu++; if (s.prvyBezStylu == null) s.prvyBezStylu = t; s.vyska = Math.max(s.vyska, k ? k.offsetHeight : 0); }
    if (css && s.css == null) s.css = t;
    requestAnimationFrame(krok);
  };
  requestAnimationFrame(krok);
}

/** Stav po načítaní: korene, výška, reveal. */
const stavObsahu = () => {
  const k = Array.prototype.slice.call(document.querySelectorAll('[data-lcd-cast^="p1v-vclass"]'));
  const vh = window.innerHeight;
  const rv = k.reduce((a, x) => a.concat(Array.prototype.slice.call(x.querySelectorAll(".rv"))), []);
  return {
    korene: k.map((x) => x.getAttribute("data-lcd-cast") + (x.parentElement && x.parentElement.classList.contains("p1v-miesto") ? "@miesto" : "")),
    viditelne: k.every((x) => x.offsetHeight > 0 && getComputedStyle(x.querySelector("h2, h3, p") || x).visibility === "visible"),
    vyska1: k[0] ? k[0].offsetHeight : 0,
    hero: !!document.getElementById("lcd-vclass-hero"),
    vclass: document.body.classList.contains("lcd-vclass"),
    l1: document.body.classList.contains("lcd-1v"),
    rvPodOknomCaka: rv.filter((x) => x.getBoundingClientRect().top > vh && !x.classList.contains("on")).length,
    rvPodOknom: rv.filter((x) => x.getBoundingClientRect().top > vh).length,
  };
};

const b = await pw.chromium.launch();
async function kontext(sirka, casti) {
  const mobil = sirka < 500;
  const c = await b.newContext({ viewport: { width: sirka, height: mobil ? 844 : 768 }, locale: "sk-SK", ...(mobil ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  await c.addInitScript(sledovanie);
  await c.route("**/*", async (r) => {
    const u = r.request().url();
    if (BLOK.test(u)) return r.abort();
    if (r.request().method() === "POST" && /\/action\//.test(u)) return r.abort(); // nič sa neodosiela (ani košík)
    if (SUB && /\/assets\/v\/[^/]+\/js\/luxuryCar\.js/.test(u)) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUB.js });
    if (SUB && /\/assets\/v\/[^/]+\/css\/luxuryCar\.css/.test(u)) return r.fulfill({ status: 200, contentType: "text/css", body: SUB.css });
    if (/\/assets\/v\/[^/]+\/js\/lcd-vclass\.js/.test(u)) {
      if (casti.chyba) return r.fulfill({ status: 404, contentType: "text/plain", body: "" });
      if (casti.oneskor) await new Promise((x) => setTimeout(x, casti.oneskor));
      if (SUB) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUB.vclass });
    }
    return r.continue();
  });
  return c;
}
const vf = (p) => p.evaluate(() => window.__vf);

for (const sirka of sirky) {
  // ---- 1) načítanie navrchu
  if (beh(1)) {
    const c = await kontext(sirka, { oneskor: 2500 });
    const p = await c.newPage();
    await p.goto(ADRESA, { waitUntil: "load", timeout: 90000 });
    await p.waitForFunction(() => !!document.getElementById("lcd-vclass-css"), null, { timeout: 60000 });
    await p.waitForTimeout(1500);
    const v = await vf(p), s = await p.evaluate(stavObsahu);
    const t = sirka + " navrchu";
    console.log(`  ${t}: medzera ${v.medzera} snímok, bez štýlu ${v.bezStylu} snímok (od ${v.prvyBezStylu} ms, výška ${v.vyska} px), štýl ${v.css} ms, výška ${s.vyska1} px, reveal pod oknom ${s.rvPodOknomCaka}/${s.rvPodOknom}`);
    over(v.medzera > 0, t + ": medzera medzi spustením 1V a časťou triedy V nastala (test meria naozaj)");
    over(v.bezStylu === 0, t + ": obsah triedy V ani raz viditeľný bez štýlu (" + v.bezStylu + " snímok od " + v.prvyBezStylu + " ms, výška " + v.vyska + " px, štýl " + v.css + " ms)");
    over(s.korene.join() === "p1v-vclass-1@miesto,p1v-vclass-2@miesto", t + ": oba korene v .p1v-miesto " + s.korene.join());
    over(s.viditelne && s.hero && s.vclass && s.l1, t + ": po štýle obsah viditeľný, úvod triedy V na mieste " + JSON.stringify(s));
    over(s.vyska1 > 2000 && s.vyska1 < MAX_VYSKA_SO_STYLOM, t + ": obsah v štýlovanej výške " + s.vyska1 + " px");
    over(s.rvPodOknomCaka > 0, t + ": reveal .rv pod oknom ostáva nastavený (" + s.rvPodOknomCaka + "/" + s.rvPodOknom + ")");
    await c.close();
  }
  // ---- 2) F5 zo stredu obsahu
  if (beh(2)) {
    const c = await kontext(sirka, { oneskor: 0 });
    const p = await c.newPage();
    await p.goto(ADRESA, { waitUntil: "load", timeout: 90000 });
    await p.waitForFunction(() => !!document.getElementById("lcd-vclass-css"), null, { timeout: 60000 });
    await p.waitForTimeout(2000);
    const SEK = '[data-lcd-sekcia="vclass-verzie"]';
    await p.evaluate((q) => { const e = document.querySelector(q); window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 80); }, SEK);
    await p.waitForTimeout(1000);
    const pred = await p.evaluate((q) => Math.round(document.querySelector(q).getBoundingClientRect().top), SEK);
    // F5: časť sa oneskorí (novší route má prednosť pred route z kontext())
    await c.route(/\/assets\/v\/[^/]+\/js\/lcd-vclass\.js/, async (r) => {
      await new Promise((x) => setTimeout(x, 1500));
      if (SUB) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUB.vclass });
      return r.continue();
    });
    await p.reload({ waitUntil: "load", timeout: 90000 });
    await p.waitForFunction(() => !!document.getElementById("lcd-vclass-css"), null, { timeout: 60000 });
    await p.waitForTimeout(3000);
    const v = await vf(p);
    const po = await p.evaluate((q) => Math.round(document.querySelector(q).getBoundingClientRect().top), SEK);
    const t = sirka + " F5";
    console.log(`  ${t}: bez štýlu ${v.bezStylu} snímok (od ${v.prvyBezStylu} ms), štýl ${v.css} ms, sekcia pred ${pred} px, po ${po} px`);
    over(v.medzera > 0, t + ": medzera nastala");
    over(v.bezStylu === 0, t + ": obsah ani raz viditeľný bez štýlu (" + v.bezStylu + " snímok od " + v.prvyBezStylu + " ms, výška " + v.vyska + " px)");
    // Telefón: keď časť príde až po obnove polohy, scroll anchoring Chromu posunie okno o rast konfigurátora nad obsahom
    // (namerané −2 687 px pred opravou aj po nej, bez oneskorenia časti 11–60 px) — samostatná vec, tu len výpis.
    if (sirka >= 768) over(Math.abs(po - pred) <= 120, t + ": okno po F5 pri tom istom mieste obsahu (" + pred + " -> " + po + " px)");
    else if (Math.abs(po - pred) > 120) console.log("  INFO " + t + ": okno po F5 inde (" + pred + " -> " + po + " px), aj pred opravou");
    await c.close();
  }
  // ---- 3) časť sa nenačíta
  if (beh(3)) {
    const c = await kontext(sirka, { chyba: true });
    const p = await c.newPage();
    await p.goto(ADRESA, { waitUntil: "load", timeout: 90000 });
    await p.waitForFunction(() => !!window.__vf && window.__vf.medzera > 0, null, { timeout: 60000 });
    await p.waitForFunction(() => !document.body.classList.contains("lcd-1v"), null, { timeout: 30000 }); // index.js zložil nový vzhľad
    await p.waitForTimeout(9000); // poistka pásu triedy V (8 s) ukáže natívny formulár
    const v = await vf(p);
    const s = await p.evaluate(() => {
      const f = document.getElementById("product-detail-form"), r = f && f.getBoundingClientRect();
      const k = document.querySelector('[data-lcd-cast="p1v-vclass-1"]');
      return { form: !!r && r.height > 0 && getComputedStyle(f).visibility === "visible", obsah: !!k && k.offsetHeight > 0, css: !!document.getElementById("lcd-vclass-css") };
    });
    const t = sirka + " výpadok časti";
    console.log(`  ${t}: bez štýlu ${v.bezStylu} snímok, ${JSON.stringify(s)}`);
    over(v.bezStylu === 0, t + ": obsah ani raz viditeľný bez štýlu (" + v.bezStylu + " snímok od " + v.prvyBezStylu + " ms)");
    over(s.form && !s.css && !s.obsah, t + ": natívny formulár viditeľný, obsah skrytý ako doteraz " + JSON.stringify(s));
    await c.close();
  }
  // ---- 4) časť príde až po poistke (len prvá šírka)
  if (beh(4) && sirka === sirky[0] && !ma("bez-poistky")) {
    const c = await kontext(sirka, { oneskor: 11000 });
    const p = await c.newPage();
    await p.goto(ADRESA, { waitUntil: "load", timeout: 90000 });
    await p.waitForFunction(() => !!document.getElementById("lcd-vclass-css"), null, { timeout: 60000 });
    await p.waitForTimeout(1000);
    const v = await vf(p), s = await p.evaluate(stavObsahu);
    const t = sirka + " pomalá časť";
    console.log(`  ${t}: zobrazený ${v.zobrazeny} ms, bez štýlu od ${v.prvyBezStylu} ms, štýl ${v.css} ms`);
    over(v.prvyBezStylu != null && v.prvyBezStylu - v.zobrazeny >= 7500 && v.prvyBezStylu - v.zobrazeny <= 9500, t + ": obsah sa bez časti ukáže až po poistke 8 s (" + (v.prvyBezStylu - v.zobrazeny) + " ms)");
    over(s.viditelne && s.vclass && s.vyska1 < MAX_VYSKA_SO_STYLOM, t + ": po príchode časti obsah so štýlom " + JSON.stringify(s));
    await c.close();
  }
  // ---- 5) pomalý telefón navrchu (Slow 4G + CPU 4×, 3 behy): okno ostane navrchu, keď sa ukáže konfigurátor
  if (beh(5) && sirka < 768) {
    for (let n = 1; n <= 3; n++) {
      const c = await kontext(sirka, {});
      const p = await c.newPage();
      const cdp = await c.newCDPSession(p);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await p.goto(ADRESA, { waitUntil: "load", timeout: 120000 });
      await p.waitForFunction(() => !!document.getElementById("lcd-vclass-css"), null, { timeout: 90000 });
      await p.waitForTimeout(2500);
      const v = await vf(p);
      const s = await p.evaluate(() => ({ sy: Math.round(window.scrollY), vyr: window.__lcd1v && window.__lcd1v.obsah ? window.__lcd1v.obsah.vyrovnane : null }));
      const t = sirka + " pomalý telefón " + n;
      console.log(`  ${t}: bez štýlu ${v.bezStylu} snímok, štýl ${v.css} ms, okno ${s.sy} px, vyrovnania ${JSON.stringify(s.vyr)}`);
      over(v.bezStylu === 0, t + ": obsah ani raz viditeľný bez štýlu (" + v.bezStylu + " snímok od " + v.prvyBezStylu + " ms)");
      over(s.sy === 0, t + ": okno ostalo navrchu (" + s.sy + " px, vyrovnania " + JSON.stringify(s.vyr) + ")");
      await c.close();
    }
  }
}
await b.close();
if (tmp) rmSync(tmp, { recursive: true, force: true });
console.log(`${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
