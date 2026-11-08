#!/usr/bin/env node
// Test presmerovania Mercedes triedy V W447 (od 2014) na stránku triedy V (SK 646, Michal 8. 11. 2026):
// konfigurator1v/vclass-presmerovanie.js (nový vzhľad 1V), main.js saveModel (titulka), vclass/app.js (?rok, ?velkost).
// Ktoré modely: assets/js/functions/vclassPresmerovanie.js.
// Navyše (revízia 8. 11. 2026): zmena z klávesnice nepresmeruje sama (Enter / „Pokračujte ďalej“ áno), stála oblasť
// aria-live, ?rok/?velkost len pri príchode (po zmene výberu, F5 a Späť platí uložený výber), titulka zapíše príznak
// presmerovania, roky po aktuálny rok.
//
//   node tools/test-vclass-presmerovanie.mjs [--pw <file:///…/playwright/index.mjs>] [--dist <priečinok s luxuryCar.js,
//        lcd-vclass.js (a luxuryCar.css)>] [--sirka 1366,390] [--snimky <priečinok>] [--len <časť mena scenára>]
//
// Bez --dist si zostaví lokálny build ako .github/workflows/production.yml (esbuild main.js -> luxuryCar.js, casti/vclass.js
// -> lcd-vclass.js) a CSS cez tools/vloz-lcd-css.py --vystup, všetko do dočasného priečinka (repo ostane nezmenené).
// Živé stránky SK/CZ dostanú namiesto …/eshopy/luxuryCar/assets/(v/<sha>/)js/luxuryCar.js, js/lcd-vclass.js a css/luxuryCar.css
// lokálny build (ako tools/test-konfigurator-1v.mjs). Cookies sa odmietnu tlačidlom „Odmietnuť“ / „Odmítnout“. Merače sú
// zablokované, každý POST na /action/ (okrem súhlasu s cookies) sa zruší a test zlyhá; do košíka sa nič nevkladá.
import { AsyncLocalStorage } from "node:async_hooks";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (m, z) => { const i = process.argv.indexOf("--" + m); return i > -1 ? process.argv[i + 1] : z; };
const pw = await import(arg("pw", "file:///C:/Users/M/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"));
const snimky = arg("snimky");
if (snimky) mkdirSync(snimky, { recursive: true });
const SIRKY = String(arg("sirka", "1366,390")).split(",").map(Number);
const LEN = arg("len");

const SK = "https://www.luxurycardesign.sk";
const CZ = "https://www.luxurycardesign.cz";
const VCLASS = "/autokoberce-mercedes-v-class/";
const ADRESA = {
  598: SK + "/luxusne-autokoberce-dragonskin-diamond-line/",
  601: SK + "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
  619: SK + "/luxusny-koberced-do-kufra-dragonskin-klasik/",
  cz2403: CZ + "/luxusne-autokoberce-dragonskin-diamond-line/",
};
const MERACE = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|googleadservices\.com|google\.com\/(ccm|pagead)|facebook\.net|facebook\.com\/tr|connect\.facebook|tiktok|hotjar|clarity\.ms|bat\.bing\.com|heureka\.|c\.seznam\.cz|sklik|ecomail\.cz\/.*track|luxia-.*rostiapp\.cz/i;
const UA_TEL = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const NADPIS = "Pre Mercedes triedy V máme samostatnú stránku s cenou celého setu.";

// ------------------------------------------------------------------ build
function spusti(cmd, args, popis) {
  const r = spawnSync(cmd, args, { cwd: KOREN, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(popis + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
}
function build() {
  const dist = arg("dist");
  const tmp = dist || mkdtempSync(join(tmpdir(), "lcd-vclass-pres-"));
  if (!dist) {
    const plat = process.platform + "-" + process.arch;
    const bin = process.env.ESBUILD_BINARY_PATH || join(KOREN, "node_modules", "@esbuild", plat, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
    if (!existsSync(bin)) throw new Error("esbuild nenájdený (" + bin + "), použi --dist alebo ESBUILD_BINARY_PATH");
    // rovnaké prepínače ako .github/workflows/production.yml
    spusti(bin, ["assets/js/main.js", "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--drop:console", "--legal-comments=none", "--log-level=warning"], "esbuild luxuryCar.js");
    spusti(bin, ["assets/js/casti/vclass.js", "--bundle", "--outfile=" + join(tmp, "lcd-vclass.js"), "--format=iife", "--minify", "--drop:console", "--legal-comments=none", "--log-level=warning"], "esbuild lcd-vclass.js");
  }
  if (!existsSync(join(tmp, "luxuryCar.css"))) spusti(process.env.LCD_PYTHON || "python", ["tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], "vloz-lcd-css.py --vystup");
  return { tmp, js: readFileSync(join(tmp, "luxuryCar.js")), vclass: readFileSync(join(tmp, "lcd-vclass.js")), css: readFileSync(join(tmp, "luxuryCar.css")) };
}

// ------------------------------------------------------------------ vyhodnotenie
let ok = 0, zle = 0;
const vysledky = [];
const behScenara = new AsyncLocalStorage(); // šírky bežia súbežne: zlyhania sa počítajú pre každý scenár zvlášť
function over(podm, text) {
  const b = behScenara.getStore();
  if (podm) ok++; else { zle++; if (b) b.zle++; console.log("    ✗ " + (b ? b.sirka + " " : "") + text); }
  vysledky.push((podm ? "OK  " : "ZLE ") + text);
  return !!podm;
}

// ------------------------------------------------------------------ prehliadač
async function novyKontext(prehliadac, B, sirka, { ulozene } = {}) {
  const mobil = sirka < 768;
  const ctx = await prehliadac.newContext({
    viewport: { width: sirka, height: mobil ? 844 : 900 }, isMobile: mobil, hasTouch: mobil, deviceScaleFactor: mobil ? 2 : 1,
    locale: "sk-SK", ...(mobil ? { userAgent: UA_TEL } : {}),
  });
  const stav = { podvrhnute: 0, posty: [], chyby: [] };
  const hlavicky = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };
  await ctx.route(MERACE, (r) => r.abort());
  await ctx.route(/\/eshopy\/luxuryCar\/assets\//, (r) => {
    const u = r.request().url();
    if (/\/js\/luxuryCar\.js(\?|$)/.test(u)) { stav.podvrhnute++; return r.fulfill({ body: B.js, contentType: "application/javascript; charset=utf-8", headers: hlavicky }); }
    if (/\/js\/lcd-vclass\.js(\?|$)/.test(u)) { stav.podvrhnute++; return r.fulfill({ body: B.vclass, contentType: "application/javascript; charset=utf-8", headers: hlavicky }); }
    if (/\/css\/luxuryCar\.css(\?|$)/.test(u)) { stav.podvrhnute++; return r.fulfill({ body: B.css, contentType: "text/css; charset=utf-8", headers: hlavicky }); }
    return r.continue();
  });
  await ctx.route(/\/action\//, (r) => {
    const q = r.request();
    if (/CustomerCookieConsent/i.test(q.url()) || q.method() === "GET") return r.continue();
    stav.posty.push(q.method() + " " + q.url());
    return r.abort();
  });
  // stránka triedy V odpovie o 1,2 s neskôr: oznámenie ostane na obrazovke aj počas odchodu (snímka, meranie)
  await ctx.route((u) => u.pathname === VCLASS, async (r) => {
    if (r.request().isNavigationRequest()) await new Promise((z) => setTimeout(z, 1200));
    return r.continue();
  });
  // auto z predošlej stránky: zapíše sa raz, pri prvom dokumente karty (ďalšie navigácie ho už neprepíšu)
  if (ulozene) await ctx.addInitScript((d) => {
    try {
      if (sessionStorage.getItem("__testUlozene")) return;
      sessionStorage.setItem("__testUlozene", "1");
      Object.keys(d).forEach((k) => sessionStorage.setItem(k, d[k]));
    } catch (e) { /* nič */ }
  }, ulozene);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => stav.chyby.push(String(e && e.message || e).slice(0, 160)));
  stav.navigacie = [];
  page.on("request", (q) => { if (q.isNavigationRequest() && q.frame() === page.mainFrame()) stav.navigacie.push({ cas: Date.now(), url: q.url() }); });
  return { ctx, page, stav, mobil };
}

async function odmietniCookies(page) {
  for (let i = 0; i < 30; i++) {
    const r = await page.evaluate(() => {
      const b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a, button, a"), (e) => e.offsetParent && /^\s*(Odmietnu|Odmítnou)/i.test(e.textContent || ""));
      if (b) { b.click(); return "odmietnuté"; }
      return document.querySelector(".siteCookies") && document.querySelector(".siteCookies").offsetHeight ? "" : "bez lišty";
    }).catch(() => "");
    if (r) return r;
    await page.waitForTimeout(250);
  }
  return "";
}

async function otvor(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await odmietniCookies(page);
}

const AUTO_1V = "#product-detail-form .lcd1v-krok.lcd1v-k-auto";
async function cakaj1v(page) {
  await page.waitForFunction((sel) => {
    const s = document.querySelector(sel + " .modl-selector-wrap .brands select");
    return document.body.classList.contains("lcd-1v") && s && s.options.length > 5 && document.querySelector("#product-detail-form .content-wrap .next-step-button");
  }, AUTO_1V, { timeout: 40000 });
  await page.waitForTimeout(800);
}
async function cakajStary(page) {
  await page.waitForFunction(() => {
    const s = document.querySelector("#product-detail-form .modl-selector-wrap .brands select");
    return s && s.options.length > 5 && document.querySelector("#product-detail-form .content-wrap .next-step-button");
  }, null, { timeout: 40000 });
  await page.waitForTimeout(800);
}
/** Karta „Vaše auto“ otvorená klikom na hlavičku (živý .order je cez ňu natiahnutý priehľadne). */
async function otvorKartuAuta(page) {
  if (await page.$(AUTO_1V + ".active")) return;
  const hd = await page.$(AUTO_1V + " > .lcd1v-hd");
  await hd.scrollIntoViewIfNeeded();
  const b = await hd.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + Math.min(30, b.height / 2));
  await page.waitForSelector(AUTO_1V + ".active", { timeout: 8000 });
  await page.waitForTimeout(350);
}
/** Výber auta v natívnych selectoch (ako zákazník: change). poradie: "zmr" (značka, model, rok) | "zrm". */
async function vyberAuto(page, koren, a, poradie = "zmr") {
  const w = koren + " .modl-selector-wrap";
  const krok = {
    z: async () => {
      await page.selectOption(w + " .brands select", { label: a.znacka }, { force: true });
      await page.waitForFunction((s) => document.querySelector(s).options.length > 1, w + " .models select");
    },
    m: () => page.selectOption(w + " .models select", { label: a.model }, { force: true }),
    r: () => page.selectOption(w + " .years select", { label: a.rok }, { force: true }),
  };
  for (const c of poradie) await krok[c]();
}

const oznamenie = (page) => page.evaluate(() => {
  const b = document.querySelector(".lcd1v-vclass");
  if (!b) return null;
  const a = b.querySelector("a");
  const r = b.getBoundingClientRect();
  const podoba = ["ide", "klavesnica", "odkaz"].find((x) => b.classList.contains("lcd1v-vclass--" + x)) || "";
  return { podoba, ide: podoba === "ide", text: b.textContent.replace(/\s+/g, " ").trim(), href: a && a.getAttribute("href"), odkaz: a && a.textContent.trim(), vKarte: !!b.closest(".lcd1v-k-auto"), viditelne: r.height > 20 && getComputedStyle(b).display !== "none", vyska: Math.round(r.height) };
});

/** Stála oblasť aria-live: { pocet, text, vRegione: role/aria-live, skryta: 1 px } */
const oblastHlasu = (page) => page.evaluate(() => {
  const h = document.querySelectorAll(".lcd1v-vclass-hlas");
  const x = h[0];
  const r = x && x.getBoundingClientRect();
  return { pocet: h.length, text: x ? x.textContent : null, vRegione: !!x && x.getAttribute("aria-live") === "polite" && x.getAttribute("role") === "status", skryta: !!r && r.width <= 1 && r.height <= 1, boxBezLive: !document.querySelector(".lcd1v-vclass[aria-live], .lcd1v-vclass[role]") };
});

async function snimka(page, meno, sel, okraj = 24) {
  if (!snimky) return;
  const e = await page.$(sel);
  if (!e) return;
  await e.evaluate((x) => x.scrollIntoView({ block: "center", behavior: "instant" })).catch(() => {});
  await page.waitForTimeout(300);
  const b = await e.boundingBox();
  if (!b) return;
  const vp = page.viewportSize();
  const x = Math.max(0, b.x - okraj), y = Math.max(0, b.y - okraj);
  await page.screenshot({ path: join(snimky, meno + ".png"), clip: { x, y, width: Math.min(vp.width - x, b.width + 2 * okraj), height: Math.min(vp.height - y, b.height + 2 * okraj) } }).catch((e) => console.log("    (snímka " + meno + ": " + e.message.split("\n")[0] + ")"));
}

/** Nový vzhľad bez chýb modulov. */
async function overBezChyb(page, kde) {
  const ch = await page.evaluate(() => (window.__lcd1v && window.__lcd1v.chyby) || []).catch(() => ["evaluate zlyhal"]);
  over(ch.length === 0, kde + ": moduly 1V bez chýb " + JSON.stringify(ch));
}

/** Čaká na presmerovanie na triedu V; vráti { cas od t0 (ms), url } alebo null. */
async function cakajNaVclass(page, stav, t0, ms = 9000) {
  const koniec = Date.now() + ms;
  while (Date.now() < koniec) {
    const n = stav.navigacie.find((x) => x.cas >= t0 && new URL(x.url).pathname === VCLASS);
    if (n) return { cas: n.cas - t0, url: n.url };
    await page.waitForTimeout(100);
  }
  return null;
}
async function overPrichod(page, ocak, kde) {
  await page.waitForURL((u) => u.pathname === VCLASS, { timeout: 30000 });
  await page.waitForFunction(() => window.__lcdVclass && document.querySelector("#lv-rok"), null, { timeout: 40000 }).catch(() => {});
  const s = await page.evaluate(() => ({ rok: window.__lcdVclass ? window.__lcdVclass.S.rok : null, velkost: window.__lcdVclass ? window.__lcdVclass.S.velkost : null, selRok: (document.querySelector("#lv-rok") || {}).value, selVel: (document.querySelector("#lv-velkost") || {}).value }));
  over(s.rok === ocak.rok && s.selRok === ocak.rok, kde + ": rok na stránke triedy V predvyplnený " + ocak.rok + " " + JSON.stringify(s));
  over(s.velkost === ocak.velkost && (s.selVel || "") === ocak.velkost, kde + ": dĺžka na stránke triedy V „" + ocak.velkost + "“ " + JSON.stringify(s));
  const q = new URL(page.url()).searchParams;
  over(!q.has("rok") && !q.has("velkost"), kde + ": ?rok/?velkost po príchode z adresy zmizli (" + page.url() + ")");
  const u0 = page.url();
  await page.waitForTimeout(3000);
  over(page.url() === u0 && new URL(page.url()).pathname === VCLASS, kde + ": stránka triedy V ďalej nepresmerúva");
}
/** Výber na stránke triedy V: rozbaľovacie menu roka a dĺžky (ako zákazník: change). */
async function zmenVclass(page, rok, velkost) {
  await page.selectOption("#lv-velkost", velkost);
  await page.selectOption("#lv-rok", rok);
  await page.waitForTimeout(300);
}
const stavVclass = (page) => page.evaluate(() => ({ rok: window.__lcdVclass && window.__lcdVclass.S.rok, velkost: window.__lcdVclass && window.__lcdVclass.S.velkost, selRok: (document.querySelector("#lv-rok") || {}).value, selVel: (document.querySelector("#lv-velkost") || {}).value, search: location.search }));
async function cakajVclass(page) {
  await page.waitForFunction(() => window.__lcdVclass && document.querySelector("#lv-rok"), null, { timeout: 40000 });
  await page.waitForTimeout(300);
}

// ------------------------------------------------------------------ scenáre
const SCENARE = [
  {
    meno: "598 výber V Class 2020 -> trieda V ?rok=2020; Späť -> len odkaz (bez slučky)",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      const h0 = await oblastHlasu(page);
      over(h0.pocet === 1 && h0.text === "" && h0.vRegione && h0.skryta, "598: stála oblasť aria-live je na stránke pred výberom (prázdna, skrytá) " + JSON.stringify(h0));
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      const o = await oznamenie(page);
      await page.waitForTimeout(250);
      const h1 = await oblastHlasu(page);
      over(h1.pocet === 1 && /^Pre Mercedes triedy V máme samostatnú stránku s cenou celého setu\. Presmerúvame Vás na ňu\.$/.test(h1.text) && h1.boxBezLive, "598: oblasť aria-live ohlási presmerovanie " + JSON.stringify(h1));
      over(o && o.ide && o.vKarte && o.viditelne, "598: oznámenie s presmerovaním v karte auta " + JSON.stringify(o));
      over(o && o.text.indexOf(NADPIS) === 0 && /Presmerúvame Vás…/.test(o.text) && o.odkaz === "Prejsť hneď", "598: text oznámenia „" + (o && o.text) + "“");
      over(o && o.href === VCLASS + "?rok=2020", "598: odkaz " + (o && o.href));
      await snimka(page, "1-presmerovanie-598-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "598");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "598: presmerovanie po ~1,5 s (" + (n ? n.cas + " ms" : "nebolo") + ")");
      over(n && new URL(n.url).search === "?rok=2020", "598: adresa " + (n && n.url));
      await overPrichod(page, { rok: "2020", velkost: "" }, "598");
      await snimka(page, "3-prichod-vclass-598-" + s, "#lcd-vclass .lv-2m", 40);
      // Späť: produkt sa načíta znova s uloženou triedou V -> len oznámenie s odkazom, žiadne ďalšie presmerovanie
      const t1 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      const o2 = await oznamenie(page);
      over(o2 && !o2.ide && o2.viditelne && o2.odkaz === "Prejsť na stránku triedy V" && o2.href === VCLASS + "?rok=2020", "598 po Späť: len oznámenie s odkazom " + JSON.stringify(o2));
      await snimka(page, "2-odkaz-598-spat-" + s, ".lcd1v-vclass", 40);
      await page.waitForTimeout(3500);
      over(!stav.navigacie.some((x) => x.cas > t1 + 500 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "598 po Späť: bez presmerovania (žiadna slučka)");
      // zákazník môže pokračovať: karta auta sa dá otvoriť, iné auto oznámenie zruší
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Audi", model: "A6", rok: "2015" }, "zrm");
      await page.waitForTimeout(400);
      over(!(await oznamenie(page)), "598 po Späť: iné auto oznámenie zruší");
      // už bol presmerovaný: ani nová voľba triedy V myšou ho znova nepošle, len odkaz
      const t2 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2022" }, "zrm");
      const o3 = await oznamenie(page);
      over(o3 && o3.podoba === "odkaz" && o3.href === VCLASS + "?rok=2022", "598 po Späť: nová voľba triedy V = len odkaz " + JSON.stringify(o3));
      await page.waitForTimeout(2800);
      over(!stav.navigacie.some((x) => x.cas > t2 && new URL(x.url).pathname === VCLASS), "598 po Späť: nová voľba triedy V nepresmerovala");
      await overBezChyb(page, "598 po Späť");
    },
  },
  {
    meno: "601 výber V Class L 2018 -> ?rok=2018&velkost=L",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[601]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class L (long 5140 mm)", rok: "2018" });
      const o = await oznamenie(page);
      over(o && o.ide && o.vKarte && o.href === VCLASS + "?rok=2018&velkost=L", "601: oznámenie a odkaz " + JSON.stringify(o));
      await snimka(page, "1-presmerovanie-601-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "601");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000 && new URL(n.url).search === "?rok=2018&velkost=L", "601: presmerovanie " + JSON.stringify(n));
      await overPrichod(page, { rok: "2018", velkost: "L" }, "601");
      await snimka(page, "3-prichod-vclass-601-" + s, "#lcd-vclass .lv-2m", 40);
      // zákazník zmení dĺžku a rok, obnoví stránku (F5): platí jeho výber, nie L/2018 z adresy
      await zmenVclass(page, "2021", "XL");
      await page.reload({ waitUntil: "domcontentloaded" });
      await cakajVclass(page);
      const f5 = await stavVclass(page);
      over(f5.rok === "2021" && f5.velkost === "XL" && f5.selRok === "2021" && f5.selVel === "XL" && f5.search === "", "601: po F5 platí neskorší výber XL/2021 " + JSON.stringify(f5));
      // odíde (napr. do košíka) a vráti sa Späť
      await otvor(page, SK + "/kosik/");
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakajVclass(page);
      const spat = await stavVclass(page);
      over(spat.rok === "2021" && spat.velkost === "XL" && spat.search === "", "601: po Späť z košíka platí XL/2021 " + JSON.stringify(spat));
    },
  },
  {
    meno: "619 rohož výber V Class XL 2023 -> ?rok=2023&velkost=XL",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[619]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class XL (Extra Long 5370 mm)", rok: "2023" });
      const o = await oznamenie(page);
      over(o && o.ide && o.vKarte && o.href === VCLASS + "?rok=2023&velkost=XL", "619: oznámenie a odkaz " + JSON.stringify(o));
      await snimka(page, "1-presmerovanie-619-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "619");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000 && new URL(n.url).search === "?rok=2023&velkost=XL", "619: presmerovanie " + JSON.stringify(n));
      await overPrichod(page, { rok: "2023", velkost: "XL" }, "619");
    },
  },
  {
    meno: "598 klávesnica: šípky v roku nepresmerujú, Enter áno",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      await page.focus(rok);
      const t0 = Date.now();
      // Windows: šípka v zatvorenom selecte zmení hodnotu a pošle change (čítačka pri prechádzaní rokov)
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(300);
      let r = await page.evaluate((x) => document.querySelector(x).value, rok);
      if (!/^\d{4}$/.test(r)) {
        // platforma, kde šípka hodnotu nemení: kláves + zmena tak, ako to robí Windows
        console.log("    (" + s + ": šípka hodnotu nezmenila, kláves + change napodobnené)");
        await page.evaluate((x) => { const e = document.querySelector(x); e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); e.selectedIndex = 1; e.dispatchEvent(new Event("change", { bubbles: true })); }, rok);
        await page.waitForTimeout(300);
        r = await page.evaluate((x) => document.querySelector(x).value, rok);
      }
      const o = await oznamenie(page);
      over(o && o.podoba === "klavesnica" && /Enter/.test(o.text) && /Pokračujte ďalej/.test(o.text) && o.href === VCLASS + "?rok=" + r, "598 klávesnica: oznámenie bez odpočtu (" + r + ") " + JSON.stringify(o));
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && /klávesom Enter/.test(h.text), "598 klávesnica: oblasť aria-live " + JSON.stringify(h));
      await snimka(page, "4-klavesnica-598-" + s, ".lcd1v-vclass", 150);
      // ďalšia šípka (iný rok triedy V): stále len oznámenie
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(2600);
      over(!stav.navigacie.some((x) => x.cas > t0 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "598 klávesnica: šípky v roku nepresmerovali");
      const r2 = await page.evaluate((x) => document.querySelector(x).value, rok);
      const t1 = Date.now();
      await page.keyboard.press("Enter");
      const n = await cakajNaVclass(page, stav, t1, 5000);
      over(n && n.cas < 1000 && new URL(n.url).search === "?rok=" + r2, "598 klávesnica: Enter v poli roku presmeruje hneď " + JSON.stringify(n));
      await overPrichod(page, { rok: r2, velkost: "" }, "598 klávesnica");
    },
  },
  {
    meno: "601 klávesnica: rok napísaný v poli, potom Pokračujte ďalej -> trieda V",
    async beh({ page, stav }) {
      await otvor(page, ADRESA[601]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class L (long 5140 mm)" }, "zm");
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      await page.focus(rok);
      const t0 = Date.now();
      await page.keyboard.type("2018", { delay: 60 }); // písanie v zatvorenom selecte vyberie rok
      await page.waitForTimeout(400);
      const r = await page.evaluate((x) => document.querySelector(x).value, rok);
      const o = await oznamenie(page);
      over(r === "2018" && o && o.podoba === "klavesnica" && o.href === VCLASS + "?rok=2018&velkost=L", "601 klávesnica: písaný rok 2018 = oznámenie bez odpočtu " + r + " " + JSON.stringify(o));
      await page.waitForTimeout(2200);
      over(!stav.navigacie.some((x) => x.cas > t0 && new URL(x.url).pathname === VCLASS), "601 klávesnica: bez samočinného presmerovania");
      const t1 = Date.now();
      await page.click(AUTO_1V + " > .next-step-button");
      const n = await cakajNaVclass(page, stav, t1, 5000);
      over(n && n.cas < 1000 && new URL(n.url).search === "?rok=2018&velkost=L", "601 klávesnica: Pokračujte ďalej v karte auta presmeruje " + JSON.stringify(n));
      await overPrichod(page, { rok: "2018", velkost: "L" }, "601 klávesnica");
    },
  },
  {
    meno: "598 zavretá karta auta (zmena auta mimo karty): oznámenie nad krokmi",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      // karta auta je pri načítaní otvorená: zákazník ju zavrie klikom na hlavičku a auto zmení až potom
      if (await page.$(AUTO_1V + ".active")) {
        const hd = await page.$(AUTO_1V + " > .lcd1v-hd");
        await hd.evaluate((x) => x.scrollIntoView({ block: "center", behavior: "instant" }));
        await page.waitForTimeout(300);
        const b = await hd.boundingBox();
        await page.mouse.click(b.x + b.width / 2, b.y + Math.min(30, b.height / 2));
        await page.waitForFunction((sel) => !document.querySelector(sel + ".active"), AUTO_1V, { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
      over(!(await page.$(AUTO_1V + ".active")), "598: karta auta zavretá");
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class M (compact 4895 mm)", rok: "2017" });
      const o = await oznamenie(page);
      over(o && o.ide && !o.vKarte && o.viditelne && o.href === VCLASS + "?rok=2017&velkost=M", "598: oznámenie nad krokmi " + JSON.stringify(o));
      await snimka(page, "1-presmerovanie-nad-krokmi-598-" + s, ".lcd1v-vclass", 150);
      const n = await cakajNaVclass(page, stav, t0);
      over(n && new URL(n.url).search === "?rok=2017&velkost=M", "598: presmerovanie " + JSON.stringify(n));
    },
  },
  {
    meno: "598 bez presmerovania: Vito, Viano, EQV, VLE, V Class 2000 a 2013, Audi; zmena auta počas čakania",
    async beh({ page, stav }) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      const auta = [
        { znacka: "Mercedes-Benz", model: "Vito", rok: "2020" },
        { znacka: "Mercedes-Benz", model: "Viano", rok: "2010" },
        { znacka: "Mercedes-Benz", model: "EQV", rok: "2022" },
        { znacka: "Mercedes-Benz", model: "VLE", rok: "2026" },
        { znacka: "Mercedes-Benz", model: "V Class", rok: "2000" }, // W638 1996–2003
        { znacka: "Mercedes-Benz", model: "V Class", rok: "2003" },
        { znacka: "Mercedes-Benz", model: "V Class", rok: "2013" },
        { znacka: "Audi", model: "A6", rok: "2015" },
      ];
      for (const a of auta) {
        await vyberAuto(page, AUTO_1V, a, "zrm"); // rok pred modelom: cestou nevznikne trieda V od 2014
        await page.waitForTimeout(600);
        over(!(await oznamenie(page)), "598: " + a.model + " " + a.rok + " bez oznámenia");
      }
      await page.waitForTimeout(2000);
      over(!stav.navigacie.some((x) => x.cas > t0 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "598: žiadne z týchto áut nepresmerovalo");
      // trieda V vybraná a hneď zmenená na starší rok: čakanie sa zruší, oznámenie zmizne
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class M (compact 4895 mm)", rok: "2016" }, "zrm");
      const o = await oznamenie(page);
      over(o && o.ide && o.href === VCLASS + "?rok=2016&velkost=M", "598: V Class M 2016 oznámenie " + JSON.stringify(o));
      const t1 = Date.now();
      await page.selectOption(AUTO_1V + " .modl-selector-wrap .years select", { label: "2012" }, { force: true });
      await page.waitForTimeout(300);
      over(!(await oznamenie(page)), "598: zmena roku na 2012 oznámenie zruší");
      await page.waitForTimeout(2600);
      over(!stav.navigacie.some((x) => x.cas > t1 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "598: zrušené čakanie nepresmerovalo");
      await overBezChyb(page, "598 bez presmerovania");
    },
  },
  {
    meno: "601 s uloženou triedou V z inej stránky: raz presmeruje, po Späť len odkaz",
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class L (long 5140 mm)", Year: "2019" },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA[601]);
      await cakaj1v(page).catch(() => {});
      const n = await cakajNaVclass(page, stav, t0, 15000);
      over(n && new URL(n.url).search === "?rok=2019&velkost=L", "601 uložené: presmerovanie pri načítaní " + JSON.stringify(n));
      await overPrichod(page, { rok: "2019", velkost: "L" }, "601 uložené");
      const t1 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      const o = await oznamenie(page);
      over(o && !o.ide && o.viditelne && o.href === VCLASS + "?rok=2019&velkost=L", "601 uložené po Späť: len odkaz " + JSON.stringify(o));
      await snimka(page, "2-odkaz-601-ulozene-" + s, ".lcd1v-vclass", 40);
      await page.waitForTimeout(3500);
      over(!stav.navigacie.some((x) => x.cas > t1 + 500 && new URL(x.url).pathname === VCLASS), "601 uložené po Späť: bez slučky");
      await overBezChyb(page, "601 uložené");
    },
  },
  {
    meno: "598 s uloženou triedou V, zákazník už bol na stránke triedy V: len odkaz",
    // celé auto aj s typom: karta auta je pri načítaní vyplnená a zavretá -> oznámenie nad krokmi
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class", Year: "2021", carType: "Long", model: "Mercedes-Benz V Class 2021 Long", lcdVclass: '{"rok":"2021"}' },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      const o = await oznamenie(page);
      over(o && !o.ide && o.viditelne && o.href === VCLASS + "?rok=2021", "598 (bol na triede V): len odkaz " + JSON.stringify(o));
      await snimka(page, "2-odkaz-598-bol-na-vclass-" + s, ".lcd1v-vclass", 120);
      await page.waitForTimeout(3000);
      over(!stav.navigacie.some((x) => x.cas > t0 && new URL(x.url).pathname === VCLASS), "598 (bol na triede V): nepresmeruje");
      // odkaz funguje
      await page.click(".lcd1v-vclass a");
      await overPrichod(page, { rok: "2021", velkost: "" }, "598 odkaz");
    },
  },
  {
    meno: "stránka triedy V s uloženou triedou V nikdy nepresmeruje",
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class", Year: "2020" },
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, SK + VCLASS);
      await page.waitForFunction(() => window.__lcdVclass, null, { timeout: 40000 }).catch(() => {});
      await page.waitForTimeout(3500);
      over(new URL(page.url()).pathname === VCLASS && stav.navigacie.filter((x) => x.cas >= t0).length === 1, "trieda V: jediná navigácia, ostáva na stránke " + stav.navigacie.filter((x) => x.cas >= t0).length);
      over(!(await page.$(".lcd1v-vclass")), "trieda V: žiadne oznámenie presmerovania");
      over(await page.evaluate(() => !!window.__lcdVclass), "trieda V: konfigurátor triedy V beží");
    },
  },
  {
    meno: "titulka: V Class XL 2021 -> trieda V (bez typu karosérie); Audi a Vito -> rozcestník",
    async beh({ page, stav }) {
      const W = "#konfSlot .model-selector";
      const titulka = async () => {
        await otvor(page, SK + "/");
        await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W, { timeout: 40000 });
        await page.waitForTimeout(500);
      };
      await titulka();
      await vyberAuto(page, W, { znacka: "Mercedes-Benz", model: "V Class XL (Extra Long 5370 mm)", rok: "2021" });
      const t0 = Date.now();
      await page.locator(W + " .btn.choice-Model:visible").first().click();
      const n = await cakajNaVclass(page, stav, t0);
      over(n && new URL(n.url).search === "?rok=2021&velkost=XL", "titulka: adresa " + (n && n.url));
      await overPrichod(page, { rok: "2021", velkost: "XL" }, "titulka");
      // titulka -> trieda V -> Basic s tým istým autom: neodrazí späť, len odkaz
      const t1 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      const o = await oznamenie(page);
      over(o && o.podoba === "odkaz" && o.href === VCLASS + "?rok=2021&velkost=XL", "titulka -> trieda V -> 598: len odkaz " + JSON.stringify(o));
      await page.waitForTimeout(3000);
      over(!stav.navigacie.some((x) => x.cas > t1 && new URL(x.url).pathname === VCLASS), "titulka -> trieda V -> 598: neodrazí späť");
      for (const a of [{ znacka: "Audi", model: "A6", rok: "2015", typ: "Combi" }, { znacka: "Mercedes-Benz", model: "Vito", rok: "2020", typ: "Combi" }]) {
        await titulka();
        await vyberAuto(page, W, a);
        await page.selectOption(W + " .type-selector select", { label: a.typ }, { force: true });
        await page.locator(W + " .btn.choice-Model:visible").first().click();
        await page.waitForURL((u) => u.pathname === "/rozcestnik/", { timeout: 20000 }).catch(() => {});
        over(new URL(page.url()).pathname === "/rozcestnik/", "titulka: " + a.znacka + " " + a.model + " -> rozcestník (" + page.url() + ")");
      }
    },
  },
  {
    meno: "CZ: produkt aj titulka bez presmerovania",
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, ADRESA.cz2403);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      await page.waitForTimeout(3000);
      over(!(await oznamenie(page)), "CZ 2403: V Class 2020 bez oznámenia");
      over(new URL(page.url()).hostname === "www.luxurycardesign.cz" && !stav.navigacie.some((x) => x.cas > t0 + 100 && /v-class/.test(x.url)), "CZ 2403: bez presmerovania (" + page.url() + ")");
      await overBezChyb(page, "CZ 2403");
      const W = "#konfSlot .model-selector";
      await otvor(page, CZ + "/");
      await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W, { timeout: 40000 });
      await vyberAuto(page, W, { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      await page.selectOption(W + " .type-selector select", { index: 1 }, { force: true });
      await page.locator(W + " .btn.choice-Model:visible").first().click();
      await page.waitForURL((u) => u.pathname === "/rozcestnik/", { timeout: 20000 }).catch(() => {});
      over(new URL(page.url()).pathname === "/rozcestnik/" && /luxurycardesign\.cz/.test(page.url()), "CZ titulka: V Class -> rozcestník (" + page.url() + ")");
    },
  },
  {
    meno: "598 ?novy=0 (starý vzhľad) bez zmeny",
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, ADRESA[598] + "?novy=0");
      await cakajStary(page);
      over(!(await page.evaluate(() => document.body.classList.contains("lcd-1v"))), "?novy=0: starý vzhľad (bez body.lcd-1v)");
      await vyberAuto(page, "#product-detail-form", { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      await page.waitForTimeout(3000);
      over(!(await page.$(".lcd1v-vclass")), "?novy=0: bez oznámenia");
      over(!stav.navigacie.some((x) => x.cas > t0 + 100 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "?novy=0: bez presmerovania");
      await page.evaluate(() => { try { sessionStorage.removeItem("lcd1v"); } catch (e) { /* nič */ } });
    },
  },
];

// ------------------------------------------------------------------ zhoda modelov a roky (bez prehliadača)
{
  const { vclassAuto, adresaVclass, VCLASS_MODELY } = await import("../assets/js/functions/vclassPresmerovanie.js");
  const { ROKY } = await import("../assets/js/components/konfigurator1v/vclass/data.js");
  const teraz = new Date().getFullYear();
  const j = (x) => JSON.stringify(x);
  over(j(VCLASS_MODELY) === j(["V Class", "V Class M (compact 4895 mm)", "V Class L (long 5140 mm)", "V Class XL (Extra Long 5370 mm)"]), "zhoda: zoznam modelov " + j(VCLASS_MODELY));
  over(j(vclassAuto("Mercedes-Benz", "V Class", "2014")) === j({ rok: "2014", velkost: "" }), "zhoda: V Class 2014");
  over(j(vclassAuto(" mercedes-benz ", "v class l (long 5140 mm)", "2019")) === j({ rok: "2019", velkost: "L" }), "zhoda: bez ohľadu na veľké písmená a medzery");
  over(j(vclassAuto("Mercedes-Benz", "V Class XL (Extra Long 5370 mm)", String(teraz))) === j({ rok: String(teraz), velkost: "XL" }), "zhoda: aktuálny rok " + teraz);
  over(vclassAuto("Mercedes-Benz", "V Class", String(teraz + 1)) === null, "zhoda: budúci rok nie");
  for (const [m, r] of [["V Class", "2013"], ["V Class", "2000"], ["Vito", "2020"], ["Viano", "2010"], ["EQV", "2022"], ["VLE", "2026"], ["Metris", "2020"], ["V Class", "Iné, prosím napíšte do poznámky"]]) {
    over(vclassAuto("Mercedes-Benz", m, r) === null, "zhoda: " + m + " " + r + " nie");
  }
  over(vclassAuto("Mercedes-Maybach", "V Class", "2020") === null && vclassAuto("Audi", "A6", "2020") === null, "zhoda: iná značka nie");
  over(adresaVclass({ rok: "2020", velkost: "" }) === VCLASS + "?rok=2020" && adresaVclass({ rok: "2019", velkost: "L" }) === VCLASS + "?rok=2019&velkost=L", "zhoda: adresa");
  over(ROKY[0] === String(teraz) && ROKY[ROKY.length - 1] === "2014" && ROKY.length === teraz - 2013, "vclass/data.js ROKY " + ROKY[0] + "…" + ROKY[ROKY.length - 1]);
  console.log((zle ? "ZLE  " : "OK   ") + "zhoda modelov a roky (bez prehliadača)");
}

// ------------------------------------------------------------------ beh
const B = build();
console.log("build: " + B.tmp + " (" + (B.js.length / 1024).toFixed(0) + " kB luxuryCar.js, " + (B.vclass.length / 1024).toFixed(0) + " kB lcd-vclass.js)");
const prehliadac = await pw.chromium.launch({ headless: true });
async function behSirky(sirka) {
  for (const sc of SCENARE) {
    if (LEN && sc.meno.indexOf(LEN) < 0) continue;
    const k = await novyKontext(prehliadac, B, sirka, { ulozene: sc.ulozene });
    const b = { sirka, zle: 0 };
    await behScenara.run(b, async () => {
      try {
        await sc.beh(k, String(sirka));
        over(k.stav.podvrhnute > 0, sc.meno + ": lokálny build podvrhnutý");
        over(k.stav.posty.length === 0, sc.meno + ": žiadny POST na /action/ " + JSON.stringify(k.stav.posty));
      } catch (e) {
        over(false, sc.meno + ": výnimka " + String(e && e.message || e).split("\n")[0]);
      }
    });
    console.log((b.zle === 0 ? "OK   " : "ZLE  ") + sirka + "  " + sc.meno + (k.stav.chyby.length ? "  (chyby stránky: " + k.stav.chyby.length + " — " + k.stav.chyby.slice(0, 2).join(" | ") + ")" : ""));
    await k.ctx.close();
  }
}
await Promise.all(SIRKY.map(behSirky));
await prehliadac.close();
console.log("\nkontroly: " + ok + " OK, " + zle + " zlé" + (snimky ? "; snímky v " + snimky : ""));
process.exit(zle ? 1 : 0);
