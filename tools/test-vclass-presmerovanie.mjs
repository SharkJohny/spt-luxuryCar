#!/usr/bin/env node
// Test presmerovania Mercedes triedy V W447 (od 2014) na stránku triedy V (SK 646, Michal 8. 11. 2026):
// konfigurator1v/vclass-presmerovanie.js (nový vzhľad 1V), main.js saveModel (titulka), vclass/app.js (?rok, ?velkost).
// Ktoré modely: assets/js/functions/vclassPresmerovanie.js.
// Navyše (revízia 8. 11. 2026): zmena z klávesnice nepresmeruje sama (Enter / „Pokračujte ďalej“ áno), stála oblasť
// aria-live, ?rok/?velkost len pri príchode (po zmene výberu, F5 a Späť platí uložený výber), titulka zapíše príznak
// presmerovania, roky po aktuálny rok.
// Okno „Máte Mercedes triedy V?“ (Michal 8. 11. 2026, namiesto samostatného nápisu pod výberom auta): zákazník, ktorý už
// bol na stránke triedy V, pri výbere triedy V myšou/prstom dostane okno (Prejsť / Zostať tu; Esc, ×, klik mimo = Zostať
// tu; fokus dnu a späť na pole auta, Tab ostáva v okne); pri načítaní s uloženou triedou V najviac raz za session na
// produkte; po „Zostať tu“ ho ďalšia zmena roka v triede V nevnucuje; z klávesnice ostáva nápis s odkazom.
// Dĺžky M/L/XL (len W447, Michal 8. 11. 2026): presmerujú pri AKOMKOĽVEK roku aj bez roku — rok do adresy len 2014 až
// aktuálny, inak ?velkost= bez roku (rok si zákazník vyberie na stránke triedy V); obyčajné „V Class“ len 2014 až aktuálny.
// Titulka pri triede V (Michal 8. 11. 2026): pole „Typ karosérie“ (aj štítok) skryté, tlačidlo „Prejsť na triedu V“
// (CZ „Přejít na třídu V“), polia sa nepohnú (PC aj telefón), iné auto = všetko ako predtým; uložená trieda V hneď pri načítaní.
//   --snimky: aj náhľady titulky titulka-vclass-*.png (štítok „NÁHĽAD“).
//   --snimky <priečinok>: okrem výrezov aj náhľady okna celej obrazovky so zeleným štítkom „NÁHĽAD“ (okno-*.png).
// CZ web (Michal 8. 11. 2026: presná kópia SK, české texty, rovnaká adresa /autokoberce-mercedes-v-class/): beží len
// s prepínačom CZ_SPUSTENE = true vo functions/vclassPresmerovanie.js. Test sa riadi tým prepínačom:
//   - CZ_SPUSTENE = false (bez --cz-spustene): scenár „CZ … bez presmerovania“ (CZ produkt aj titulka ostávajú bez zmeny),
//   - CZ_SPUSTENE = true alebo --cz-spustene (build s podvrhnutým CZ_SPUSTENE = true, zdroj ostane nezmenený): scenáre
//     „CZ …“ = české oznámenie, presmerovanie na CZ adresu, okno „Máte Mercedes třídy V?“, titulka. Kým je CZ produkt skrytý,
//     CZ stránka triedy V vráti hosťovi 404 — overuje sa len adresa (rok, dĺžka), nie obsah stránky.
//
//   node tools/test-vclass-presmerovanie.mjs [--pw <file:///…/playwright/index.mjs>] [--dist <priečinok s luxuryCar.js,
//        lcd-vclass.js (a luxuryCar.css)>] [--sirka 1366,390] [--snimky <priečinok>] [--len <časť mena scenára>]
//        [--cz-spustene]
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
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (m, z) => { const i = process.argv.indexOf("--" + m); return i > -1 ? process.argv[i + 1] : z; };
const pw = await import(arg("pw", "file:///C:/Users/M/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"));
const snimky = arg("snimky");
if (snimky) mkdirSync(snimky, { recursive: true });
const SIRKY = String(arg("sirka", "1366,390")).split(",").map(Number);
const LEN = arg("len");
/** --cz-spustene: build s CZ_SPUSTENE = true (podvrh pri zostavení, zdroj sa nemení) */
const CZ_PREPINAC = process.argv.includes("--cz-spustene");
const ZDROJ_PRESMER = join(KOREN, "assets/js/functions/vclassPresmerovanie.js");
const zdrojCz = (readFileSync(ZDROJ_PRESMER, "utf8").match(/^export const CZ_SPUSTENE = (true|false);/m) || [])[1];
/** CZ presmerovanie v testovanom builde zapnuté? */
const CZ_ZAP = CZ_PREPINAC || zdrojCz === "true";

const SK = "https://www.luxurycardesign.sk";
const CZ = "https://www.luxurycardesign.cz";
const VCLASS = "/autokoberce-mercedes-v-class/";
const ADRESA = {
  598: SK + "/luxusne-autokoberce-dragonskin-diamond-line/",
  601: SK + "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
  619: SK + "/luxusny-koberced-do-kufra-dragonskin-klasik/",
  cz2403: CZ + "/luxusne-autokoberce-dragonskin-diamond-line/",
  cz2406: CZ + "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
  cz2424: CZ + "/luxusny-koberced-do-kufra-dragonskin-klasik/",
};
const MERACE = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|googleadservices\.com|google\.com\/(ccm|pagead)|facebook\.net|facebook\.com\/tr|connect\.facebook|tiktok|hotjar|clarity\.ms|bat\.bing\.com|heureka\.|c\.seznam\.cz|sklik|ecomail\.cz\/.*track|luxia-.*rostiapp\.cz/i;
const UA_TEL = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const NADPIS = "Pre Mercedes triedy V máme samostatnú stránku s cenou celého setu.";
const OKNO = {
  nadpis: "Máte Mercedes triedy V?",
  text: "Pre Mercedes triedy V (W447, od roku 2014) máme samostatný konfigurátor s cenou celého setu a šablónami pre dĺžky M, L aj XL.",
  ide: "Prejsť na konfigurátor triedy V",
  zostat: "Zostať tu",
};
// CZ (spisovná čeština, vykanie s veľkým V; Michal 8. 11. 2026)
const NADPIS_CZ = "Pro Mercedes třídy V máme samostatnou stránku s cenou celé sady.";
const OKNO_CZ = {
  nadpis: "Máte Mercedes třídy V?",
  text: "Pro Mercedes třídy V (W447, od roku 2014) máme samostatný konfigurátor s cenou celé sady a šablonami pro délky M, L i XL.",
  ide: "Přejít na konfigurátor třídy\u00a0V", // pevná medzera: na telefóne „TŘÍDY V“ spolu na druhom riadku
  zostat: "Zůstat zde",
  zavriet: "Zavřít, zůstat zde",
};
const j = (x) => JSON.stringify(x);

// ------------------------------------------------------------------ build
function spusti(cmd, args, popis) {
  const r = spawnSync(cmd, args, { cwd: KOREN, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(popis + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
}
/** esbuild plugin: functions/vclassPresmerovanie.js s CZ_SPUSTENE = true (len v builde testu). */
const podvrhCz = {
  name: "cz-spustene",
  setup(b) {
    b.onLoad({ filter: /[\\/]functions[\\/]vclassPresmerovanie\.js$/ }, (a) => {
      const t = readFileSync(a.path, "utf8");
      const n = t.replace(/^export const CZ_SPUSTENE = false;/m, "export const CZ_SPUSTENE = true;");
      return { contents: n, loader: "js" };
    });
  },
};
async function build() {
  const dist = arg("dist");
  if (dist && CZ_PREPINAC && zdrojCz !== "true") throw new Error("--cz-spustene nejde s --dist (build musí podvrhnúť CZ_SPUSTENE)");
  const tmp = dist || mkdtempSync(join(tmpdir(), "lcd-vclass-pres-"));
  if (!dist && CZ_PREPINAC && zdrojCz !== "true") {
    // rovnaké prepínače ako .github/workflows/production.yml, navyše podvrh CZ_SPUSTENE = true
    over(zdrojCz === "false", "--cz-spustene: zdroj má prepínač „export const CZ_SPUSTENE = false;“ (" + zdrojCz + ")");
    const esbuild = createRequire(join(KOREN, "package.json"))("esbuild");
    const spolu = { bundle: true, format: "iife", minify: true, drop: ["console"], legalComments: "none", logLevel: "warning", absWorkingDir: KOREN, plugins: [podvrhCz], nodePaths: String(process.env.NODE_PATH || "").split(delimiter).filter(Boolean) }; // NODE_PATH ako esbuild CLI
    await esbuild.build({ ...spolu, entryPoints: ["assets/js/main.js"], outfile: join(tmp, "luxuryCar.js"), loader: { ".jsx": "jsx" } });
    await esbuild.build({ ...spolu, entryPoints: ["assets/js/casti/vclass.js"], outfile: join(tmp, "lcd-vclass.js") });
  } else if (!dist) {
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
  stav.odpovede = [];
  page.on("request", (q) => { if (q.isNavigationRequest() && q.frame() === page.mainFrame()) stav.navigacie.push({ cas: Date.now(), url: q.url() }); });
  page.on("response", (r) => { const q = r.request(); if (q.isNavigationRequest() && q.frame() === page.mainFrame()) stav.odpovede.push({ url: r.url(), status: r.status() }); });
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

/**
 * Mercedes-Benz myšou, model z klávesnice (kláves na poli modelu a hneď zmena, ako písanie názvu v zatvorenom selecte):
 * dĺžky M/L/XL reagujú už pri modeli, myšou by po 1,5 s presmerovali skôr, než test vyberie rok klávesnicou.
 */
async function modelKlavesnicou(page, koren, model) {
  const w = koren + " .modl-selector-wrap";
  await page.selectOption(w + " .brands select", { label: "Mercedes-Benz" }, { force: true });
  await page.waitForFunction((x) => document.querySelector(x).options.length > 1, w + " .models select");
  await page.focus(w + " .models select");
  await page.keyboard.press("Shift");
  await page.selectOption(w + " .models select", { label: model }, { force: true });
  await page.waitForTimeout(300);
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

/** Okno „Máte Mercedes triedy V?“ (null = nie je v stránke). */
const okno = (page) => page.evaluate(() => {
  const d = document.querySelector(".lcd1v-vclass-okno");
  if (!d) return null;
  const r = d.getBoundingClientRect();
  const cs = getComputedStyle(d);
  const ide = d.querySelector(".lcd1v-vclass-okno__ide");
  const zostat = d.querySelector(".lcd1v-vclass-okno__zostat");
  const x = d.querySelector(".lcd1v-vclass-okno__x");
  const n = document.getElementById(d.getAttribute("aria-labelledby") || "-");
  const t = document.getElementById(d.getAttribute("aria-describedby") || "-");
  const poz = document.querySelector(".lcd1v-vclass-pozadie");
  const a = document.activeElement;
  const ram = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return { x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), h: Math.round(q.height) }; };
  const px = (e) => (e ? parseFloat(getComputedStyle(e).fontSize) : 0);
  return {
    viditelne: cs.visibility === "visible" && Number(cs.opacity) > 0.9 && r.width > 200 && r.height > 100,
    role: d.getAttribute("role"), modal: d.getAttribute("aria-modal"),
    nadpis: n && d.contains(n) ? n.textContent.trim() : null,
    text: t && d.contains(t) ? t.textContent.replace(/\s+/g, " ").trim() : null,
    ide: ide ? ide.textContent.trim() : null, href: ide ? ide.getAttribute("href") : null,
    zostat: zostat ? zostat.textContent.trim() : null, x: !!x && !!x.getAttribute("aria-label"), xPopis: x ? x.getAttribute("aria-label") : null,
    fokus: a && d.contains(a) ? (a === ide ? "ide" : a === zostat ? "zostat" : a === x ? "x" : "iny") : (a ? a.tagName + "." + a.className : null),
    pozadie: !!poz && getComputedStyle(poz).visibility === "visible" && Number(getComputedStyle(poz).opacity) > 0.9,
    vObrazovke: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5,
    navrchu: (() => { const e = document.elementFromPoint(r.left + r.width / 2, r.top + 12); return !!e && d.contains(e); })(),
    pismo: { nadpis: px(n), text: px(t), ide: px(ide), zostat: px(zostat) },
    ram: ram(d), tlacidlo: ram(ide), zostatR: ram(zostat),
    zelene: ide ? /31, 122, 82|29, 107, 74|1f7a52/i.test(getComputedStyle(ide).backgroundImage + getComputedStyle(ide).backgroundColor) : false,
    body: document.body.classList.contains("lcd1v-vclass-okno-otvorene"),
  };
});
/** Okno zavreté a upratané (žiadne okno, pozadie ani trieda na body). */
const oknoZavrete = (page) => page.evaluate(() => !document.querySelector(".lcd1v-vclass-okno") && !document.querySelector(".lcd1v-vclass-pozadie") && !document.body.classList.contains("lcd1v-vclass-okno-otvorene"));
/** Fokus je na poli auta (select alebo hlavička karty „Vaše auto“). */
const fokusNaPoliAuta = (page) => page.evaluate((sel) => { const a = document.activeElement; return !!a && a !== document.body && !!a.closest(sel) ? (a.tagName + "." + (a.closest(".surcharge-list") ? a.closest(".surcharge-list").className.split(" ").pop() : a.className)) : ""; }, AUTO_1V);
/** Hodnoty výberu auta (značka, model, rok) v karte „Vaše auto“. */
const vybraneAuto = (page) => page.evaluate((sel) => ["brands", "models", "years"].map((k) => { const s = document.querySelector(sel + " .modl-selector-wrap .surcharge-list." + k + " select"); return s && s.selectedIndex > -1 ? s.options[s.selectedIndex].text.trim() : ""; }), AUTO_1V);
/** Kontrola otvoreného okna: texty, tlačidlá, adresa, prístupnosť, fokus, mierka písma, poloha. */
function overOkno(o, href, kde, { fokus = "ide", T = OKNO } = {}) {
  if (!over(!!o, kde + ": okno „Máte Mercedes triedy V?“ je otvorené")) return;
  over(o.viditelne && o.pozadie && o.body && o.vObrazovke && o.navrchu, kde + ": okno viditeľné celé v obrazovke, navrchu, so stmaveným pozadím " + j({ v: o.viditelne, p: o.pozadie, b: o.body, vo: o.vObrazovke, n: o.navrchu, ram: o.ram }));
  over(o.nadpis === T.nadpis && o.text === T.text, kde + ": nadpis a text okna " + j({ n: o.nadpis, t: o.text }));
  over(o.ide === T.ide && o.zostat === T.zostat && o.x && (!T.zavriet || o.xPopis === T.zavriet), kde + ": tlačidlá „" + o.ide + "“ / „" + o.zostat + "“ / × s popisom");
  over(o.href === href, kde + ": „Prejsť“ vedie na " + href + " (" + o.href + ")");
  over(o.role === "dialog" && o.modal === "true", kde + ": role=dialog, aria-modal=true, aria-labelledby/-describedby v okne");
  if (fokus) over(o.fokus === fokus, kde + ": fokus v okne na „" + fokus + "“ (" + o.fokus + ")");
  over(o.zelene && o.tlacidlo && o.tlacidlo.h >= 48 && o.zostatR && o.zostatR.h >= 44, kde + ": zelené „Prejsť“ ≥ 48 px, „Zostať tu“ ≥ 44 px " + j({ ide: o.tlacidlo, zostat: o.zostatR }));
  const pc = o.ram && o.ram.w > 440;
  over(o.pismo.text === (pc ? 17 : 16) && o.pismo.zostat >= 16 && o.pismo.ide >= 12 && o.pismo.nadpis >= 16, kde + ": písmo podľa mierky (text " + (pc ? 17 : 16) + ") " + j(o.pismo));
}
/** Náhľad okna (celá obrazovka) so zeleným štítkom „NÁHĽAD“ pre Michala. */
async function nahlad(page, meno) {
  if (!snimky) return;
  await page.waitForTimeout(400); // dobeh animácie otvorenia
  await page.evaluate(() => {
    const s = document.createElement("div");
    s.id = "__lcdNahlad";
    s.textContent = "NÁHĽAD";
    s.style.cssText = "position:fixed;top:12px;left:12px;z-index:2147483647;padding:7px 14px;border-radius:8px;background:#1f7a52;color:#fff;font:800 14px/1.2 Arial,sans-serif;letter-spacing:.16em;box-shadow:0 2px 10px rgba(0,0,0,.35);pointer-events:none";
    document.body.appendChild(s);
  });
  await page.screenshot({ path: join(snimky, meno + ".png") }).catch((e) => console.log("    (náhľad " + meno + ": " + e.message.split("\n")[0] + ")"));
  await page.evaluate(() => { const s = document.getElementById("__lcdNahlad"); if (s) s.remove(); });
}
/** Výber auta na titulke. */
const W_TIT = "#konfSlot .model-selector";
async function otvorTitulku(page, web) {
  await otvor(page, web + "/");
  await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W_TIT, { timeout: 40000 });
}
/** Titulka: typ karosérie (viditeľný aj so štítkom?), text tlačidla, polohy polí a tlačidla v dokumente. */
const titulka = (page) => page.evaluate((W) => {
  const w = document.querySelector(W + " .modl-selector-wrap");
  const typ = w.querySelector(".surcharge-list.type-selector");
  const btn = w.querySelector(".btn.choice-Model");
  const poz = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left + scrollX), Math.round(r.top + scrollY)]; };
  const cs = getComputedStyle(typ);
  const r = typ.getBoundingClientRect();
  const sel = typ.querySelector("select");
  return {
    typ: cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.5 && r.height > 20,
    vyska: Math.round(r.height),
    stitok: cs.display !== "none" && cs.visibility !== "hidden" && getComputedStyle(typ, "::before").content !== "none",
    fokus: (() => { sel.focus(); const f = document.activeElement === sel; sel.blur(); return f; })(),
    tlacidlo: btn.textContent.trim(),
    polia: ["brands", "models", "years"].map((k) => poz(w.querySelector(".surcharge-list." + k + " select"))),
    tlacidloPoz: poz(btn),
    slot: (() => { const k = document.getElementById("konfSlot"); return k ? Math.round((k.getBoundingClientRect().bottom + scrollY) * 100) / 100 : null; })(),
    slotMin: (() => { const k = document.getElementById("konfSlot"); return k ? getComputedStyle(k).minHeight + " / " + Math.round(k.getBoundingClientRect().height * 100) / 100 : null; })(),
    chyba: !!w.querySelector(".errorToCart"),
  };
}, W_TIT);
/** Náhľad titulky: výber auta v strede obrazovky. */
async function nahladTitulky(page, meno) {
  if (!snimky) return;
  await page.evaluate((w) => document.querySelector(w).scrollIntoView({ block: "center", behavior: "instant" }), W_TIT);
  await page.waitForTimeout(500);
  await nahlad(page, meno);
}
/**
 * Titulka s triedou V: typ karosérie skrytý, tlačidlo hovorí, kam zákazník pôjde; polia sa nepohnú; iné auto vráti všetko.
 * T = { web, povodne, vclass, kde }.
 */
async function overTitulkuVclass(page, stav, s, T, cele) {
  const sel = (k) => W_TIT + " .modl-selector-wrap ." + k + " select";
  const pc = page.viewportSize().width > 1000;
  await otvorTitulku(page, T.web);
  const a0 = await titulka(page);
  over(a0.typ && a0.stitok && a0.tlacidlo === T.povodne, T.kde + ": na začiatku typ karosérie so štítkom a „" + T.povodne + "“ " + j(a0));
  await vyberAuto(page, W_TIT, { znacka: "Mercedes-Benz", model: "Vito", rok: "2020" });
  await page.waitForTimeout(450);
  const a = await titulka(page);
  over(a.typ && a.tlacidlo === T.povodne, T.kde + ": Vito 2020 = typ karosérie aj „" + T.povodne + "“ " + j(a));
  await page.selectOption(sel("models"), { label: "V Class" }, { force: true });
  await page.waitForTimeout(450);
  const b = await titulka(page);
  over(!b.typ && !b.stitok && !b.fokus, T.kde + ": V Class 2020 = pole „Typ karosérie“ aj so štítkom skryté, nedá sa naň prejsť " + j({ typ: b.typ, stitok: b.stitok, fokus: b.fokus, vyska: b.vyska }));
  over(b.tlacidlo === T.vclass, T.kde + ": tlačidlo „" + b.tlacidlo + "“ (čaká sa „" + T.vclass + "“)");
  over(j(b.polia) === j(a.polia), T.kde + ": značka, model a rok sa nepohli " + j({ pred: a.polia, po: b.polia }));
  // do 1 px = zaokrúhlenie zlomku pixela (výška obsahu tesne nad rezervou min-height), nie posun rozloženia
  over(a.slot != null && Math.abs(b.slot - a.slot) < 1, T.kde + ": obsah pod výberom auta sa nepohol (spodok #konfSlot " + a.slot + " -> " + b.slot + "; min-height / výška " + a.slotMin + " -> " + b.slotMin + ")");
  if (pc) over(j(b.tlacidloPoz) === j(a.tlacidloPoz), T.kde + ": na PC sa nepohlo ani tlačidlo " + j({ pred: a.tlacidloPoz, po: b.tlacidloPoz }));
  else over(b.vyska <= 1, T.kde + ": na telefóne pole po zbalení nezaberá miesto (" + b.vyska + " px)");
  await nahladTitulky(page, "titulka-vclass-" + (T.web === CZ ? "cz-" : "") + s);
  await page.selectOption(sel("models"), { label: "Vito" }, { force: true });
  await page.waitForTimeout(450);
  const c = await titulka(page);
  over(c.typ && c.stitok && c.tlacidlo === T.povodne && j(c.polia) === j(a.polia), T.kde + ": späť na Vito = typ karosérie, „" + T.povodne + "“, polia na mieste " + j(c));
  if (cele) {
    // dĺžky M/L/XL pri akomkoľvek roku; obyčajné V Class pred 2014 nie; iná značka nie
    await page.selectOption(sel("models"), { label: "V Class L (long 5140 mm)" }, { force: true });
    await page.selectOption(sel("years"), { label: "2010" }, { force: true });
    await page.waitForTimeout(450);
    const d = await titulka(page);
    over(!d.typ && d.tlacidlo === T.vclass, T.kde + ": V Class L 2010 = trieda V (dĺžka pri akomkoľvek roku) " + j({ typ: d.typ, t: d.tlacidlo }));
    await page.selectOption(sel("models"), { label: "V Class" }, { force: true });
    await page.waitForTimeout(450);
    const e = await titulka(page);
    over(e.typ && e.tlacidlo === T.povodne, T.kde + ": V Class 2010 (staršia generácia) = typ karosérie aj „" + T.povodne + "“ " + j({ typ: e.typ, t: e.tlacidlo }));
    await vyberAuto(page, W_TIT, { znacka: "Audi", model: "A6", rok: "2015" });
    await page.waitForTimeout(450);
    const f = await titulka(page);
    over(f.typ && f.tlacidlo === T.povodne, T.kde + ": Audi A6 = typ karosérie aj „" + T.povodne + "“");
  }
  // uložená trieda V: po načítaní hneď skrytý typ aj nový text (bez prebliknutia: v tom istom kroku ako vykreslenie výberu)
  await vyberAuto(page, W_TIT, { znacka: "Mercedes-Benz", model: "V Class XL (Extra Long 5370 mm)", rok: "2021" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await odmietniCookies(page);
  await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W_TIT, { timeout: 40000 });
  const g = await titulka(page);
  over(!g.typ && g.tlacidlo === T.vclass, T.kde + ": po načítaní s uloženým V Class XL 2021 hneď skrytý typ a „" + T.vclass + "“ " + j({ typ: g.typ, t: g.tlacidlo }));
  const t0 = Date.now();
  await page.locator(W_TIT + " .btn.choice-Model:visible").first().click();
  const n = await cakajNaVclass(page, stav, t0);
  over(n && n.url === T.web + VCLASS + "?rok=2021&velkost=XL", T.kde + ": klik presmeruje bez typu karosérie (" + (n && n.url) + ")");
  over(!g.chyba, T.kde + ": bez červeného rámika chýbajúceho poľa");
}
/** Navigácie na stránku triedy V od času t. */
const preslo = (stav, t) => stav.navigacie.some((x) => x.cas > t && new URL(x.url).pathname === VCLASS);

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
/**
 * Príchod na CZ stránku triedy V: adresa na CZ webe s rokom (a dĺžkou). Kým je CZ produkt skrytý, stránka vráti hosťovi 404
 * (to je v poriadku, overuje sa len adresa); po zverejnení sa ?rok/?velkost predvyplnia (vclass/app.js).
 */
async function prichodCz(page, stav, n, search, kde) {
  over(!!n && n.url === CZ + VCLASS + search, kde + ": presmerovanie na CZ adresu " + CZ + VCLASS + search + " (" + (n && n.url) + ")");
  await page.waitForURL((u) => u.pathname === VCLASS, { timeout: 30000 }).catch(() => {});
  const u = new URL(page.url());
  over(u.host === "www.luxurycardesign.cz" && u.pathname === VCLASS, kde + ": prehliadač je na CZ stránke triedy V (" + page.url() + ")");
  const odp = stav.odpovede.filter((x) => new URL(x.url).pathname === VCLASS).pop();
  if (odp) console.log("    (" + kde + ": CZ stránka triedy V HTTP " + odp.status + (odp.status === 404 ? " — CZ produkt je zatiaľ skrytý, adresa sedí" : "") + ")");
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
    meno: "598 výber V Class 2020 -> trieda V ?rok=2020; Späť -> okno (bez slučky), Esc, Zostať tu, F5",
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
      over(await oknoZavrete(page), "598: pri prvom výbere (ešte nebol na triede V) bez okna, presmeruje sám");
      await snimka(page, "1-presmerovanie-598-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "598");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "598: presmerovanie po ~1,5 s (" + (n ? n.cas + " ms" : "nebolo") + ")");
      over(n && new URL(n.url).search === "?rok=2020", "598: adresa " + (n && n.url));
      await overPrichod(page, { rok: "2020", velkost: "" }, "598");
      await snimka(page, "3-prichod-vclass-598-" + s, "#lcd-vclass .lv-2m", 40);
      // Späť: produkt sa načíta znova s uloženou triedou V -> okno „Máte Mercedes triedy V?“, žiadne ďalšie presmerovanie
      const t1 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2020", "598 po Späť");
      over(!(await oznamenie(page)), "598 po Späť: bez samostatného nápisu pod výberom auta");
      const h2 = await oblastHlasu(page);
      over(h2.pocet === 1 && h2.text === "", "598 po Späť: jedna oblasť aria-live, okno ohlási čítačka cez dialóg (nie dvakrát) " + JSON.stringify(h2));
      await nahlad(page, "okno-po-spat-598-" + s);
      await page.waitForTimeout(3000);
      over(!preslo(stav, t1 + 500) && new URL(page.url()).pathname !== VCLASS, "598 po Späť: bez presmerovania (žiadna slučka)");
      // Tab ostáva v okne (aria-modal)
      const fokusy = [];
      for (const k of ["Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
        await page.keyboard.press(k);
        fokusy.push((await okno(page) || {}).fokus);
      }
      over(fokusy.every((f) => f === "ide" || f === "zostat" || f === "x") && new Set(fokusy).size === 3, "598 po Späť: Tab a Shift+Tab ostávajú v okne " + fokusy.join(","));
      // Esc = Zostať tu: okno preč, fokus späť na pole auta, voľby bez zmeny, žiadny nápis
      const a0 = await vybraneAuto(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(700);
      over(await oknoZavrete(page), "598 po Späť: Esc okno zavrie (aj pozadie)");
      const f1 = await fokusNaPoliAuta(page);
      over(!!f1, "598 po Späť: po Esc fokus späť na pole auta (" + f1 + ")");
      over(j(await vybraneAuto(page)) === j(a0), "598 po Späť: po Esc voľby auta bez zmeny " + j(a0));
      over(!(await oznamenie(page)), "598 po Späť: po Esc bez nápisu");
      await page.waitForTimeout(2000);
      over(!preslo(stav, t1 + 500), "598 po Späť: Esc nepresmeroval");
      // zákazník môže pokračovať: karta auta sa dá otvoriť, iné auto = nič
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Audi", model: "A6", rok: "2015" }, "zrm");
      await page.waitForTimeout(400);
      over(!(await oznamenie(page)) && (await oknoZavrete(page)), "598 po Späť: iné auto bez okna aj nápisu");
      // už bol na triede V: nová voľba triedy V myšou = okno (nie samostatný nápis, nie presmerovanie)
      const t2 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2022" }, "zrm");
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2022", "598 nová voľba triedy V");
      over(!(await oznamenie(page)), "598 nová voľba triedy V: bez samostatného nápisu");
      await nahlad(page, "okno-vyber-598-" + s);
      // „Zostať tu“: okno preč, fokus na pole auta, voľby ostanú
      await page.click(".lcd1v-vclass-okno__zostat");
      await page.waitForTimeout(700);
      over(await oknoZavrete(page), "598 Zostať tu: okno zavreté");
      const f2 = await fokusNaPoliAuta(page);
      over(!!f2, "598 Zostať tu: fokus späť na pole auta (" + f2 + ")");
      over(j(await vybraneAuto(page)) === j(["Mercedes-Benz", "V Class", "2022"]), "598 Zostať tu: voľby auta ostali " + j(await vybraneAuto(page)));
      // ďalšia zmena roka v triede V po „Zostať tu“: okno sa znova nevnucuje
      await page.selectOption(AUTO_1V + " .modl-selector-wrap .years select", { label: "2021" }, { force: true });
      await page.waitForTimeout(600);
      over((await oknoZavrete(page)) && !(await oznamenie(page)), "598 Zostať tu: zmena roka v triede V okno ani nápis nevnúti");
      await page.waitForTimeout(2200);
      over(!preslo(stav, t2), "598 po Späť: nová voľba triedy V nepresmerovala");
      await overBezChyb(page, "598 po Späť");
      // F5 s uloženou triedou V: okno na tomto produkte už bolo -> nevnucuje sa (najviac raz za session), ani nápis
      const t3 = Date.now();
      await page.reload({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await page.waitForTimeout(1500);
      const a3 = await vybraneAuto(page);
      over((await oknoZavrete(page)) && !(await oznamenie(page)), "598 F5 (" + j(a3) + "): okno sa druhý raz nevnucuje, ani nápis");
      over(!preslo(stav, t3), "598 F5: bez presmerovania");
      await overBezChyb(page, "598 F5");
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
      const t0 = Date.now();
      await modelKlavesnicou(page, AUTO_1V, "V Class L (long 5140 mm)");
      const o0 = await oznamenie(page);
      over(o0 && o0.podoba === "klavesnica" && o0.href === VCLASS + "?velkost=L", "601 klávesnica: model V Class L ešte bez roku = nápis bez odpočtu ?velkost=L " + j(o0));
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      await page.focus(rok);
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
        over(!(await oznamenie(page)) && (await oknoZavrete(page)), "598: " + a.model + " " + a.rok + " bez oznámenia aj okna");
      }
      await page.waitForTimeout(2000);
      over(!stav.navigacie.some((x) => x.cas > t0 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "598: žiadne z týchto áut nepresmerovalo");
      // „V Class“ (bez dĺžky) vybraná a hneď zmenená na starší rok: čakanie sa zruší, oznámenie zmizne
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2016" }, "zrm");
      const o = await oznamenie(page);
      over(o && o.ide && o.href === VCLASS + "?rok=2016", "598: V Class 2016 oznámenie " + JSON.stringify(o));
      const t1 = Date.now();
      await page.selectOption(AUTO_1V + " .modl-selector-wrap .years select", { label: "2012" }, { force: true });
      await page.waitForTimeout(300);
      over(!(await oznamenie(page)), "598: V Class, zmena roku na 2012 oznámenie zruší");
      await page.waitForTimeout(2600);
      over(!stav.navigacie.some((x) => x.cas > t1 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "598: zrušené čakanie nepresmerovalo");
      // dĺžka M vybraná a hneď zmenená na Vito: čakanie sa zruší
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class M (compact 4895 mm)", rok: "2016" }, "zrm");
      const o2 = await oznamenie(page);
      over(o2 && o2.ide && o2.href === VCLASS + "?rok=2016&velkost=M", "598: V Class M 2016 oznámenie " + JSON.stringify(o2));
      const t2 = Date.now();
      await page.selectOption(AUTO_1V + " .modl-selector-wrap .models select", { label: "Vito" }, { force: true });
      await page.waitForTimeout(300);
      over(!(await oznamenie(page)), "598: V Class M -> Vito oznámenie zruší");
      await page.waitForTimeout(2600);
      over(!preslo(stav, t2) && new URL(page.url()).pathname !== VCLASS, "598: V Class M -> Vito nepresmerovalo");
      await overBezChyb(page, "598 bez presmerovania");
    },
  },
  {
    meno: "601 s uloženou triedou V z inej stránky: raz presmeruje, po Späť okno, × = Zostať tu",
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
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2019&velkost=L", "601 uložené po Späť");
      over(!(await oznamenie(page)), "601 uložené po Späť: bez samostatného nápisu");
      await page.waitForTimeout(3500);
      over(!stav.navigacie.some((x) => x.cas > t1 + 500 && new URL(x.url).pathname === VCLASS), "601 uložené po Späť: bez slučky");
      // × = Zostať tu
      await page.click(".lcd1v-vclass-okno__x");
      await page.waitForTimeout(700);
      over(await oknoZavrete(page), "601 uložené: × okno zavrie");
      const f = await fokusNaPoliAuta(page);
      over(!!f, "601 uložené: po × fokus späť na pole auta (" + f + ")");
      over(j(await vybraneAuto(page)) === j(["Mercedes-Benz", "V Class L (long 5140 mm)", "2019"]) && !(await oznamenie(page)), "601 uložené: po × voľby bez zmeny, bez nápisu " + j(await vybraneAuto(page)));
      await page.waitForTimeout(1500);
      over(!preslo(stav, t1 + 500), "601 uložené: × nepresmeroval");
      await overBezChyb(page, "601 uložené");
    },
  },
  {
    meno: "598 s uloženou triedou V, zákazník už bol na stránke triedy V: okno pri načítaní, klik mimo, klávesnica = nápis, výber myšou = okno -> Prejsť",
    // celé auto aj s typom: karta auta je pri načítaní vyplnená a zavretá
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class", Year: "2021", carType: "Long", model: "Mercedes-Benz V Class 2021 Long", lcdVclass: '{"rok":"2021"}' },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2021", "598 (bol na triede V) pri načítaní");
      over(!(await oznamenie(page)), "598 (bol na triede V): bez samostatného nápisu");
      await nahlad(page, "okno-nacitanie-598-" + s);
      await page.waitForTimeout(2500);
      over(!preslo(stav, t0), "598 (bol na triede V): nepresmeruje");
      // klik mimo okna = Zostať tu
      await page.mouse.click(4, Math.round(page.viewportSize().height / 2));
      await page.waitForTimeout(700);
      over((await oknoZavrete(page)) && !(await oznamenie(page)), "598 (bol na triede V): klik mimo okna ho zavrie, bez nápisu");
      over(!preslo(stav, t0), "598 (bol na triede V): klik mimo nepresmeruje");
      // klávesnica (už bol na triede V): nápis s odkazom ako doteraz, okno nie (fokus ostáva v poli roku)
      await otvorKartuAuta(page);
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      await page.focus(rok);
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(300);
      let r = await page.evaluate((x) => document.querySelector(x).value, rok);
      if (r === "2021" || !/^\d{4}$/.test(r)) {
        console.log("    (" + s + ": šípka hodnotu nezmenila, kláves + change napodobnené)");
        await page.evaluate((x) => { const e = document.querySelector(x); e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })); e.selectedIndex = 1; e.dispatchEvent(new Event("change", { bubbles: true })); }, rok);
        await page.waitForTimeout(300);
        r = await page.evaluate((x) => document.querySelector(x).value, rok);
      }
      const o = await oznamenie(page);
      over(o && o.podoba === "odkaz" && o.href === VCLASS + "?rok=" + r && (await oknoZavrete(page)), "598 klávesnica (bol na triede V): nápis s odkazom, bez okna (" + r + ") " + j(o));
      // iné auto, potom trieda V myšou: okno -> „Prejsť na konfigurátor triedy V“
      await vyberAuto(page, AUTO_1V, { znacka: "Audi", model: "A6", rok: "2015" }, "zrm");
      await page.waitForTimeout(400);
      over(!(await oznamenie(page)) && (await oknoZavrete(page)), "598 (bol na triede V): Audi bez nápisu aj okna");
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2021" }, "zrm");
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2021", "598 (bol na triede V) výber myšou");
      await page.click(".lcd1v-vclass-okno__ide");
      await overPrichod(page, { rok: "2021", velkost: "" }, "598 okno Prejsť");
    },
  },
  {
    meno: "601 V Class L 2010 (rok pred 2014 pri dĺžke = omyl) -> trieda V ?velkost=L bez roku",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[601]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class L (long 5140 mm)", rok: "2010" });
      const o = await oznamenie(page);
      over(o && o.ide && o.vKarte && o.text.indexOf(NADPIS) === 0 && o.href === VCLASS + "?velkost=L", "601 L 2010: oznámenie a odkaz bez roku " + j(o));
      await snimka(page, "1-presmerovanie-L2010-601-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "601 L 2010");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000 && new URL(n.url).search === "?velkost=L", "601 L 2010: presmerovanie ?velkost=L " + j(n));
      await overPrichod(page, { rok: "", velkost: "L" }, "601 L 2010");
    },
  },
  {
    meno: "598 V Class XL, rok ešte nevybraný (značka a model) -> trieda V ?velkost=XL",
    async beh({ page, stav }) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class XL (Extra Long 5370 mm)" }, "zm");
      const o = await oznamenie(page);
      over(o && o.ide && o.href === VCLASS + "?velkost=XL", "598 XL bez roku: oznámenie hneď po výbere modelu " + j(o));
      const a0 = await vybraneAuto(page);
      over(a0[0] === "Mercedes-Benz" && a0[1] === "V Class XL (Extra Long 5370 mm)" && !/^\d{4}$/.test(a0[2]), "598 XL bez roku: rok naozaj nevybraný (placeholder) " + j(a0));
      await overBezChyb(page, "598 XL bez roku");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && new URL(n.url).search === "?velkost=XL", "598 XL bez roku: presmerovanie ?velkost=XL " + j(n));
      await overPrichod(page, { rok: "", velkost: "XL" }, "598 XL bez roku");
    },
  },
  {
    meno: "619 s uloženým V Class M 2012 z inej stránky: pri načítaní -> ?velkost=M",
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class M (compact 4895 mm)", Year: "2012" },
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, ADRESA[619]);
      await cakaj1v(page).catch(() => {});
      const n = await cakajNaVclass(page, stav, t0, 15000);
      over(n && new URL(n.url).search === "?velkost=M", "619 uložené M 2012: presmerovanie pri načítaní ?velkost=M " + j(n));
      await overPrichod(page, { rok: "", velkost: "M" }, "619 uložené M 2012");
    },
  },
  {
    meno: "stránka triedy V priamo s ?velkost=L bez roku",
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, SK + VCLASS + "?velkost=L");
      await cakajVclass(page);
      const v = await stavVclass(page);
      over(v.velkost === "L" && v.selVel === "L" && (v.rok || "") === "" && (v.selRok || "") === "", "trieda V ?velkost=L: dĺžka L predvyplnená, rok prázdny " + j(v));
      over(v.search === "", "trieda V ?velkost=L: parameter z adresy zmizol (" + v.search + ")");
      await page.waitForTimeout(2500);
      over(new URL(page.url()).pathname === VCLASS && stav.navigacie.filter((x) => x.cas >= t0).length === 1, "trieda V ?velkost=L: ostáva na stránke, nepresmerúva");
      over(stav.chyby.length === 0, "trieda V ?velkost=L: bez chýb stránky " + j(stav.chyby));
      await page.selectOption("#lv-rok", "2019");
      await page.waitForTimeout(300);
      const v2 = await stavVclass(page);
      over(v2.rok === "2019" && v2.velkost === "L", "trieda V ?velkost=L: rok sa dá vybrať, dĺžka ostáva " + j(v2));
    },
  },
  {
    meno: "titulka: V Class L 2010 -> trieda V ?velkost=L bez roku",
    async beh({ page, stav }) {
      const W = "#konfSlot .model-selector";
      await otvor(page, SK + "/");
      await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W, { timeout: 40000 });
      await page.waitForTimeout(500);
      await vyberAuto(page, W, { znacka: "Mercedes-Benz", model: "V Class L (long 5140 mm)", rok: "2010" });
      const t0 = Date.now();
      await page.locator(W + " .btn.choice-Model:visible").first().click();
      const n = await cakajNaVclass(page, stav, t0);
      over(n && new URL(n.url).search === "?velkost=L", "titulka L 2010: adresa " + (n && n.url));
      await overPrichod(page, { rok: "", velkost: "L" }, "titulka L 2010");
    },
  },
  {
    meno: "titulka trieda V: typ karosérie skrytý, tlačidlo „Prejsť na triedu V“, iné auto = ako predtým",
    async beh({ page, stav }, s) {
      await overTitulkuVclass(page, stav, s, { web: SK, povodne: "Zvoliť model", vclass: "Prejsť na triedu V", kde: "titulka SK" }, true);
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
      over(!(await page.$(".lcd1v-vclass")) && (await oknoZavrete(page)), "trieda V: žiadne oznámenie presmerovania ani okno");
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
      // titulka -> trieda V -> Basic s tým istým autom: neodrazí späť, okno -> Prejsť
      const t1 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2021&velkost=XL", "titulka -> trieda V -> 598");
      over(!(await oznamenie(page)), "titulka -> trieda V -> 598: bez samostatného nápisu");
      await page.waitForTimeout(3000);
      over(!stav.navigacie.some((x) => x.cas > t1 && new URL(x.url).pathname === VCLASS), "titulka -> trieda V -> 598: neodrazí späť");
      await page.click(".lcd1v-vclass-okno__ide");
      await overPrichod(page, { rok: "2021", velkost: "XL" }, "titulka -> 598 okno Prejsť");
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
    cz: "vyp", // CZ_SPUSTENE = false: CZ web bez zmeny
    meno: "CZ: produkt aj titulka bez presmerovania",
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, ADRESA.cz2403);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      await page.waitForTimeout(3000);
      over(!(await oznamenie(page)) && (await oknoZavrete(page)), "CZ 2403: V Class 2020 bez oznámenia aj okna");
      over(new URL(page.url()).hostname === "www.luxurycardesign.cz" && !stav.navigacie.some((x) => x.cas > t0 + 100 && /v-class/.test(x.url)), "CZ 2403: bez presmerovania (" + page.url() + ")");
      await overBezChyb(page, "CZ 2403");
      const W = "#konfSlot .model-selector";
      await otvor(page, CZ + "/");
      await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W, { timeout: 40000 });
      await vyberAuto(page, W, { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      await page.waitForTimeout(450);
      const tc = await titulka(page);
      over(tc.typ && tc.tlacidlo === "Zvolit model", "CZ titulka (CZ_SPUSTENE = false): V Class 2020 = typ karoserie aj „Zvolit model“ bez zmeny " + j({ typ: tc.typ, t: tc.tlacidlo }));
      await page.selectOption(W + " .type-selector select", { index: 1 }, { force: true });
      await page.locator(W + " .btn.choice-Model:visible").first().click();
      await page.waitForURL((u) => u.pathname === "/rozcestnik/", { timeout: 20000 }).catch(() => {});
      over(new URL(page.url()).pathname === "/rozcestnik/" && /luxurycardesign\.cz/.test(page.url()), "CZ titulka: V Class -> rozcestník (" + page.url() + ")");
    },
  },
  // ---------------------------------------------------------------- CZ (len s CZ_SPUSTENE = true / --cz-spustene)
  {
    cz: "zap",
    meno: "CZ 2403 výber V Class 2020 -> CZ trieda V ?rok=2020; Späť -> okno po česky, Zůstat zde",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA.cz2403);
      await cakaj1v(page);
      const h0 = await oblastHlasu(page);
      over(h0.pocet === 1 && h0.text === "" && h0.vRegione && h0.skryta, "CZ 2403: stála oblasť aria-live je na stránke pred výberom " + j(h0));
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      const o = await oznamenie(page);
      await page.waitForTimeout(250);
      const h1 = await oblastHlasu(page);
      over(h1.pocet === 1 && h1.text === NADPIS_CZ + " Přesměrováváme Vás na ni." && h1.boxBezLive, "CZ 2403: oblasť aria-live po česky " + j(h1));
      over(o && o.ide && o.vKarte && o.viditelne, "CZ 2403: oznámenie s presmerovaním v karte auta " + j(o));
      over(o && o.text.indexOf(NADPIS_CZ) === 0 && /Přesměrováváme Vás…/.test(o.text) && o.odkaz === "Přejít hned", "CZ 2403: text oznámenia po česky „" + (o && o.text) + "“");
      over(o && o.href === VCLASS + "?rok=2020", "CZ 2403: odkaz " + (o && o.href));
      over(await oknoZavrete(page), "CZ 2403: pri prvom výbere bez okna, presmeruje sám");
      await snimka(page, "cz-1-presmerovanie-2403-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "CZ 2403");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "CZ 2403: presmerovanie po ~1,5 s (" + (n ? n.cas + " ms" : "nebolo") + ")");
      await prichodCz(page, stav, n, "?rok=2020", "CZ 2403");
      // Späť: produkt s uloženou triedou V -> okno „Máte Mercedes třídy V?“, žiadne ďalšie presmerovanie
      const t1 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2020", "CZ 2403 po Späť", { T: OKNO_CZ });
      over(!(await oznamenie(page)), "CZ 2403 po Späť: bez samostatného nápisu pod výberom auta");
      await nahlad(page, "okno-cz-po-spat-2403-" + s);
      await page.waitForTimeout(2500);
      over(!preslo(stav, t1 + 500) && new URL(page.url()).pathname !== VCLASS, "CZ 2403 po Späť: bez presmerovania (žiadna slučka)");
      // „Zůstat zde“: okno preč, fokus na pole auta, voľby ostanú
      await page.click(".lcd1v-vclass-okno__zostat");
      await page.waitForTimeout(700);
      over(await oknoZavrete(page), "CZ 2403 Zůstat zde: okno zavreté");
      const f = await fokusNaPoliAuta(page);
      over(!!f, "CZ 2403 Zůstat zde: fokus späť na pole auta (" + f + ")");
      over(j(await vybraneAuto(page)) === j(["Mercedes-Benz", "V Class", "2020"]) && !(await oznamenie(page)), "CZ 2403 Zůstat zde: voľby auta ostali, bez nápisu " + j(await vybraneAuto(page)));
      await page.waitForTimeout(1500);
      over(!preslo(stav, t1 + 500), "CZ 2403 Zůstat zde: bez presmerovania");
      await overBezChyb(page, "CZ 2403 po Späť");
    },
  },
  {
    cz: "zap",
    meno: "CZ 2406 výber V Class L 2018 -> CZ ?rok=2018&velkost=L",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA.cz2406);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class L (long 5140 mm)", rok: "2018" });
      const o = await oznamenie(page);
      over(o && o.ide && o.vKarte && o.text.indexOf(NADPIS_CZ) === 0 && o.href === VCLASS + "?rok=2018&velkost=L", "CZ 2406: oznámenie a odkaz " + j(o));
      await overBezChyb(page, "CZ 2406");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "CZ 2406: presmerovanie po ~1,5 s " + j(n));
      await prichodCz(page, stav, n, "?rok=2018&velkost=L", "CZ 2406");
    },
  },
  {
    cz: "zap",
    meno: "CZ 2406 V Class L 2010 (rok pred 2014 pri dĺžke) -> CZ ?velkost=L bez roku",
    async beh({ page, stav }) {
      await otvor(page, ADRESA.cz2406);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class L (long 5140 mm)", rok: "2010" });
      const o = await oznamenie(page);
      over(o && o.ide && o.text.indexOf(NADPIS_CZ) === 0 && o.href === VCLASS + "?velkost=L", "CZ 2406 L 2010: oznámenie po česky bez roku " + j(o));
      await overBezChyb(page, "CZ 2406 L 2010");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "CZ 2406 L 2010: presmerovanie po ~1,5 s " + j(n));
      await prichodCz(page, stav, n, "?velkost=L", "CZ 2406 L 2010");
    },
  },
  {
    cz: "zap",
    meno: "CZ 2424 rohož klávesnica: oznámenie po česky bez odpočtu, Enter -> CZ trieda V XL",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA.cz2424);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      const t0 = Date.now();
      await modelKlavesnicou(page, AUTO_1V, "V Class XL (Extra Long 5370 mm)");
      const o0 = await oznamenie(page);
      over(o0 && o0.podoba === "klavesnica" && o0.href === VCLASS + "?velkost=XL" && o0.text.indexOf(NADPIS_CZ) === 0, "CZ 2424 klávesnica: model XL ešte bez roku = nápis po česky ?velkost=XL " + j(o0));
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      await page.focus(rok);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(300);
      let r = await page.evaluate((x) => document.querySelector(x).value, rok);
      if (!/^\d{4}$/.test(r)) {
        console.log("    (" + s + ": šípka hodnotu nezmenila, kláves + change napodobnené)");
        await page.evaluate((x) => { const e = document.querySelector(x); e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); e.selectedIndex = 1; e.dispatchEvent(new Event("change", { bubbles: true })); }, rok);
        await page.waitForTimeout(300);
        r = await page.evaluate((x) => document.querySelector(x).value, rok);
      }
      const o = await oznamenie(page);
      over(o && o.podoba === "klavesnica" && o.text === NADPIS_CZ + "Přejdete na ni klávesou Enter nebo tlačítkem Pokračujte dále." + "Přejít na stránku třídy V" && o.odkaz === "Přejít na stránku třídy V" && o.href === VCLASS + "?rok=" + r + "&velkost=XL", "CZ 2424 klávesnica: oznámenie po česky bez odpočtu (" + r + ") " + j(o));
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && h.text === NADPIS_CZ + " Přejdete na ni klávesou Enter nebo tlačítkem Pokračujte dále.", "CZ 2424 klávesnica: oblasť aria-live po česky " + j(h));
      await snimka(page, "cz-4-klavesnica-2424-" + s, ".lcd1v-vclass", 150);
      await page.waitForTimeout(2200);
      over(!preslo(stav, t0) && new URL(page.url()).pathname !== VCLASS, "CZ 2424 klávesnica: šípka v roku nepresmerovala");
      const t1 = Date.now();
      await page.keyboard.press("Enter");
      const n = await cakajNaVclass(page, stav, t1, 5000);
      over(n && n.cas < 1000, "CZ 2424 klávesnica: Enter v poli roku presmeruje hneď " + j(n));
      await prichodCz(page, stav, n, "?rok=" + r + "&velkost=XL", "CZ 2424 klávesnica");
    },
  },
  {
    cz: "zap",
    meno: "CZ 2403 s uloženou triedou V, zákazník už bol na stránke triedy V: okno pri načítaní po česky -> Přejít",
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class", Year: "2021", lcdVclass: '{"rok":"2021"}' },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA.cz2403);
      await cakaj1v(page);
      await page.waitForTimeout(400);
      overOkno(await okno(page), VCLASS + "?rok=2021", "CZ 2403 (bol na triede V) pri načítaní", { T: OKNO_CZ });
      over(!(await oznamenie(page)), "CZ 2403 (bol na triede V): bez samostatného nápisu");
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && h.text === "", "CZ 2403 (bol na triede V): okno ohlási čítačka cez dialóg, oblasť prázdna " + j(h));
      await nahlad(page, "okno-cz-nacitanie-2403-" + s);
      await page.waitForTimeout(2500);
      over(!preslo(stav, t0), "CZ 2403 (bol na triede V): nepresmeruje sám");
      const t1 = Date.now();
      await page.click(".lcd1v-vclass-okno__ide");
      const n = await cakajNaVclass(page, stav, t1, 8000);
      await prichodCz(page, stav, n, "?rok=2021", "CZ 2403 okno Přejít");
    },
  },
  {
    cz: "zap",
    meno: "CZ titulka: V Class XL 2021 -> CZ trieda V (bez typu karosérie); Audi -> rozcestník",
    async beh({ page, stav }) {
      const W = "#konfSlot .model-selector";
      const titulka = async () => {
        await otvor(page, CZ + "/");
        await page.waitForFunction((w) => { const s = document.querySelector(w + " .modl-selector-wrap .brands select"); return s && s.options.length > 5; }, W, { timeout: 40000 });
        await page.waitForTimeout(500);
      };
      await titulka();
      await vyberAuto(page, W, { znacka: "Mercedes-Benz", model: "V Class XL (Extra Long 5370 mm)", rok: "2021" });
      const t0 = Date.now();
      await page.locator(W + " .btn.choice-Model:visible").first().click();
      const n = await cakajNaVclass(page, stav, t0);
      await prichodCz(page, stav, n, "?rok=2021&velkost=XL", "CZ titulka");
      over(await page.evaluate(() => sessionStorage.getItem("lcdVclassPresmer") === "1"), "CZ titulka: príznak presmerovania zapísaný");
      await titulka();
      await vyberAuto(page, W, { znacka: "Audi", model: "A6", rok: "2015" });
      await page.selectOption(W + " .type-selector select", { index: 1 }, { force: true });
      await page.locator(W + " .btn.choice-Model:visible").first().click();
      await page.waitForURL((u) => u.pathname === "/rozcestnik/", { timeout: 20000 }).catch(() => {});
      over(new URL(page.url()).pathname === "/rozcestnik/" && /luxurycardesign\.cz/.test(page.url()), "CZ titulka: Audi A6 -> rozcestník (" + page.url() + ")");
    },
  },
  {
    cz: "zap",
    meno: "CZ titulka trieda V: typ karoserie skrytý, tlačidlo „Přejít na třídu V“",
    async beh({ page, stav }, s) {
      await overTitulkuVclass(page, stav, s, { web: CZ, povodne: "Zvolit model", vclass: "Přejít na třídu V", kde: "CZ titulka" }, false);
    },
  },
  {
    cz: "zap",
    meno: "CZ 2403 ?novy=0 (starý vzhľad) bez zmeny",
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, ADRESA.cz2403 + "?novy=0");
      await cakajStary(page);
      over(!(await page.evaluate(() => document.body.classList.contains("lcd-1v"))), "CZ ?novy=0: starý vzhľad (bez body.lcd-1v)");
      await vyberAuto(page, "#product-detail-form", { znacka: "Mercedes-Benz", model: "V Class", rok: "2020" });
      await page.waitForTimeout(3000);
      over(!(await page.$(".lcd1v-vclass")) && (await oknoZavrete(page)), "CZ ?novy=0: bez oznámenia aj okna");
      over(!preslo(stav, t0 + 100) && new URL(page.url()).pathname !== VCLASS, "CZ ?novy=0: bez presmerovania");
      await page.evaluate(() => { try { sessionStorage.removeItem("lcd1v"); } catch (e) { /* nič */ } });
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
      over(!(await page.$(".lcd1v-vclass")) && (await oknoZavrete(page)), "?novy=0: bez oznámenia aj okna");
      over(!stav.navigacie.some((x) => x.cas > t0 + 100 && new URL(x.url).pathname === VCLASS) && new URL(page.url()).pathname !== VCLASS, "?novy=0: bez presmerovania");
      await page.evaluate(() => { try { sessionStorage.removeItem("lcd1v"); } catch (e) { /* nič */ } });
    },
  },
];

// ------------------------------------------------------------------ zhoda modelov a roky (bez prehliadača)
{
  const { vclassAuto, adresaVclass, VCLASS_MODELY, oknoBoloNa, oznacOkno, KLUC_OKNO } = await import("../assets/js/functions/vclassPresmerovanie.js");
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
  // dĺžky M/L/XL (len W447): akýkoľvek rok aj bez roku; rok do adresy len 2014 – aktuálny
  for (const [m, v] of [["V Class M (compact 4895 mm)", "M"], ["V Class L (long 5140 mm)", "L"], ["V Class XL (Extra Long 5370 mm)", "XL"]]) {
    for (const r of ["2010", "2013", "1996", "", null, undefined, "Iné, prosím napíšte do poznámky", "Jiné, prosím napište do poznámky", String(teraz + 1)]) {
      over(j(vclassAuto("Mercedes-Benz", m, r)) === j({ rok: "", velkost: v }), "zhoda dĺžky: " + m + " rok " + j(r) + " -> bez roku, velkost " + v + " " + j(vclassAuto("Mercedes-Benz", m, r)));
    }
    over(j(vclassAuto("Mercedes-Benz", m, "2014")) === j({ rok: "2014", velkost: v }) && j(vclassAuto("Mercedes-Benz", m, " " + teraz + " ")) === j({ rok: String(teraz), velkost: v }), "zhoda dĺžky: " + m + " 2014 a aktuálny rok s rokom");
  }
  over(vclassAuto("Mercedes-Benz", "V Class", "") === null && vclassAuto("Mercedes-Benz", "V Class", null) === null, "zhoda: V Class bez roku nie");
  for (const m of ["Vito", "Viano", "EQV", "VLE", "Metris"]) over(vclassAuto("Mercedes-Benz", m, "") === null && vclassAuto("Mercedes-Benz", m, "2010") === null, "zhoda: " + m + " nikdy (ani bez roku)");
  over(vclassAuto("Audi", "V Class L (long 5140 mm)", "2010") === null && vclassAuto("", "V Class L (long 5140 mm)", "") === null, "zhoda: dĺžka L pri inej / žiadnej značke nie");
  over(adresaVclass({ rok: "", velkost: "L" }) === VCLASS + "?velkost=L" && adresaVclass({ rok: "", velkost: "XL" }) === VCLASS + "?velkost=XL", "zhoda: adresa bez roku = len ?velkost=");
  over(ROKY[0] === String(teraz) && ROKY[ROKY.length - 1] === "2014" && ROKY.length === teraz - 2013, "vclass/data.js ROKY " + ROKY[0] + "…" + ROKY[ROKY.length - 1]);
  // okno „Máte Mercedes triedy V?“ najviac raz za session na produkte (sessionStorage, zoznam id produktov)
  const pamat = new Map();
  const povodne = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (k) => (pamat.has(k) ? pamat.get(k) : null), setItem: (k, v) => pamat.set(k, String(v)), removeItem: (k) => pamat.delete(k) } });
  over(typeof oknoBoloNa === "function" && typeof oznacOkno === "function" && KLUC_OKNO === "lcdVclassOkno", "okno: funkcie oknoBoloNa/oznacOkno, kľúč lcdVclassOkno");
  if (typeof oknoBoloNa === "function" && typeof oznacOkno === "function") {
    over(!oknoBoloNa(598), "okno: na 598 ešte nebolo");
    oznacOkno(598);
    over(oknoBoloNa(598) && oknoBoloNa("598") && !oknoBoloNa(601), "okno: po označení 598 áno, 601 nie " + pamat.get("lcdVclassOkno"));
    oznacOkno(601); oznacOkno(598);
    over(oknoBoloNa(601) && j(JSON.parse(pamat.get("lcdVclassOkno"))) === j(["598", "601"]), "okno: 598 aj 601, bez duplicít " + pamat.get("lcdVclassOkno"));
    pamat.set("lcdVclassOkno", "{pokazené");
    over(!oknoBoloNa(598), "okno: pokazená hodnota = ešte nebolo");
    oznacOkno(619);
    over(oknoBoloNa(619), "okno: pokazená hodnota sa prepíše");
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new Error("súkromný režim"); } });
    let bezChyby = true;
    try { oznacOkno(598); over(!oknoBoloNa(598), "okno: bez sessionStorage = ešte nebolo"); } catch (e) { bezChyby = false; }
    over(bezChyby, "okno: bez sessionStorage bez výnimky");
  }
  if (povodne) Object.defineProperty(globalThis, "sessionStorage", povodne); else delete globalThis.sessionStorage;
  console.log((zle ? "ZLE  " : "OK   ") + "zhoda modelov a roky (bez prehliadača)");
}

// ------------------------------------------------------------------ CZ web a prepínač CZ_SPUSTENE (bez prehliadača)
{
  const m = await import("../assets/js/functions/vclassPresmerovanie.js");
  over(typeof m.CZ_SPUSTENE === "boolean" && String(m.CZ_SPUSTENE) === zdrojCz, "CZ: prepínač „export const CZ_SPUSTENE = …;“ vo functions/vclassPresmerovanie.js (" + m.CZ_SPUSTENE + ")");
  const fn = typeof m.webPresmerovania === "function" && typeof m.jeCzWeb === "function" && typeof m.jeSkWeb === "function";
  over(fn, "CZ: funkcie webPresmerovania, jeCzWeb, jeSkWeb");
  if (fn) {
    const pw0 = Object.getOwnPropertyDescriptor(globalThis, "window"), pd0 = Object.getOwnPropertyDescriptor(globalThis, "document");
    /** stránka s projektom Shoptetu a jazykom html (projekt null = bez dataLayer) */
    const na = (projekt, lang, f) => {
      Object.defineProperty(globalThis, "window", { configurable: true, value: projekt == null ? {} : { dataLayer: [{ shoptet: { projectId: projekt } }] } });
      Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: { lang } } });
      try { return f(); } finally {
        if (pw0) Object.defineProperty(globalThis, "window", pw0); else delete globalThis.window;
        if (pd0) Object.defineProperty(globalThis, "document", pd0); else delete globalThis.document;
      }
    };
    const vsetko = (projekt, lang) => na(projekt, lang, () => j([m.webPresmerovania(false), m.webPresmerovania(true), m.webPresmerovania(), m.jeSkWeb(), m.jeCzWeb()]));
    over(vsetko(562035, "sk") === j(["sk", "sk", "sk", true, false]), "CZ: SK web (562035, sk) = sk vždy " + vsetko(562035, "sk"));
    over(vsetko("562035", "sk-SK") === j(["sk", "sk", "sk", true, false]), "CZ: SK web s projektom ako text a jazykom sk-SK");
    over(vsetko(581408, "cs") === j([null, "cz", m.CZ_SPUSTENE ? "cz" : null, false, true]), "CZ: CZ web (581408, cs) = cz len so spustene, bez parametra podľa CZ_SPUSTENE " + vsetko(581408, "cs"));
    over(vsetko(581408, "sk") === j([null, null, null, false, false]) && vsetko(562035, "cs") === j([null, null, null, false, false]), "CZ: projekt a jazyk sa nezhodujú = nič");
    over(vsetko(704436, "cs") === j([null, null, null, false, false]) && vsetko(null, "cs") === j([null, null, null, false, false]), "CZ: iný projekt alebo bez dataLayer = nič");
  }
  console.log((zle ? "ZLE  " : "OK   ") + "CZ web a prepínač (bez prehliadača)");
}

// ------------------------------------------------------------------ beh
const B = await build();
console.log("CZ presmerovanie: " + (CZ_ZAP ? "ZAPNUTÉ" + (CZ_PREPINAC && zdrojCz !== "true" ? " (--cz-spustene, podvrh v builde)" : " (CZ_SPUSTENE = true v zdroji)") : "vypnuté (CZ_SPUSTENE = " + zdrojCz + ")"));
console.log("build: " + B.tmp + " (" + (B.js.length / 1024).toFixed(0) + " kB luxuryCar.js, " + (B.vclass.length / 1024).toFixed(0) + " kB lcd-vclass.js)");
const prehliadac = await pw.chromium.launch({ headless: true });
async function behSirky(sirka) {
  for (const sc of SCENARE) {
    if (LEN && sc.meno.indexOf(LEN) < 0) continue;
    if ((sc.cz === "zap" && !CZ_ZAP) || (sc.cz === "vyp" && CZ_ZAP)) continue; // CZ podľa prepínača CZ_SPUSTENE
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
