#!/usr/bin/env node
// Test presmerovania Mercedes triedy V W447 (od 2014) na stránku triedy V (SK 646, Michal 8. 11. 2026):
// konfigurator1v/vclass-presmerovanie.js (nový vzhľad 1V), main.js saveModel (titulka), vclass/app.js (?rok, ?velkost).
// Ktoré modely: assets/js/functions/vclassPresmerovanie.js.
// Navyše (revízia 8. 11. 2026): stála oblasť aria-live, ?rok/?velkost len pri príchode (po zmene výberu, F5 a Späť platí
// uložený výber), titulka zapíše príznak presmerovania, roky po aktuálny rok.
// Michal 8. 11. 2026 (večer): triedu V v obyčajnom konfigurátore nakonfigurovať nejde. Okno „Máte Mercedes triedy V?“ so
// „Zostať tu“ je preč (JS aj CSS); test overuje, že na stránke nie je ani jeho prvok, ani viditeľný dialóg:
//   - výber triedy V myšou/prstom = vždy nápis „Presmerúvame Vás…“ a po 1,5 s stránka triedy V, aj keď tam zákazník už bol
//     (sessionStorage lcdVclassPresmer alebo lcdVclass); iné auto počas čakania presmerovanie zruší,
//   - zmena z klávesnice (kláves na tom istom poli ≤ 600 ms pred change) = nápis s odkazom bez odpočtu; kým fokus ostáva
//     v poliach auta (značka, model, rok) alebo v nápise, nič sa nepresmeruje; odchod z polí auta (Tab na typ karosérie)
//     s triedou V = „Presmerúvame Vás…“ a po 1,5 s preč,
//   - pri nápise v oboch podobách (aj počas odpočtu „Presmerúvame Vás…“) Enter v poli auta a „Pokračujte ďalej“ karty auta
//     presmerujú hneď (< 1,2 s, nečaká sa na koniec odpočtu) a živá validácia kroku kartu auta neorámuje načerveno,
//   - načítanie (F5, Späť) s uloženou triedou V u zákazníka, ktorý už na stránke triedy V bol: výber auta sa VYNULUJE
//     (značka, model, rok aj typ karosérie na „Vyberte…“, sessionStorage Brand, Model, Year, carType a model zmazané),
//     žiadny nápis, okno ani odrazenie späť (stránka ostane ≥ 2,5 s); kto tam ešte nebol, ide na triedu V,
//   - iné auto (Vito, Viano, EQV, VLE, staršia „V Class“, Audi…) = nič, ani pri načítaní u zákazníka, ktorý už na triede V bol.
// Dĺžky M/L/XL (len W447, Michal 8. 11. 2026): presmerujú pri AKOMKOĽVEK roku aj bez roku — rok do adresy len 2014 až
// aktuálny, inak ?velkost= bez roku (rok si zákazník vyberie na stránke triedy V); obyčajné „V Class“ len 2014 až aktuálny.
// Titulka pri triede V (Michal 8. 11. 2026, bez zmeny): pole „Typ karosérie“ (aj štítok) skryté, tlačidlo „Prejsť na triedu V“
// (CZ „Přejít na třídu V“), polia sa nepohnú (PC aj telefón), iné auto = všetko ako predtým; uložená trieda V hneď pri načítaní.
//   --snimky <priečinok>: výrezy nápisu, vynulovaného výberu auta a príchodu na triedu V, náhľady titulky titulka-vclass-*.png
//   (celá obrazovka so zeleným štítkom „NÁHĽAD“).
// CZ web (Michal 8. 11. 2026: presná kópia SK, české texty, rovnaká adresa /autokoberce-mercedes-v-class/): beží len
// s prepínačom CZ_SPUSTENE = true vo functions/vclassPresmerovanie.js. Test sa riadi tým prepínačom:
//   - CZ_SPUSTENE = false (bez --cz-spustene): scenár „CZ … bez presmerovania“ (CZ produkt aj titulka ostávajú bez zmeny),
//   - CZ_SPUSTENE = true alebo --cz-spustene (build s podvrhnutým CZ_SPUSTENE = true, zdroj ostane nezmenený): scenáre
//     „CZ …“ = české oznámenie, presmerovanie na CZ adresu, vynulovanie výberu po návrate, klávesnica, titulka. Ak je CZ
//     produkt skrytý, CZ stránka triedy V vráti hosťovi 404 — overuje sa len adresa (rok, dĺžka), nie obsah stránky.
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
// CZ (spisovná čeština, vykanie s veľkým V; Michal 8. 11. 2026)
const NADPIS_CZ = "Pro Mercedes třídy V máme samostatnou stránku s cenou celé sady.";
/** Texty nápisu a oblasti aria-live (rovnaké ako TEXTY_SK / TEXTY_CZ vo vclass-presmerovanie.js). */
const T_SK = { nadpis: NADPIS, ide: "Presmerúvame Vás…", hned: "Prejsť hneď", hlasIde: NADPIS + " Presmerúvame Vás na ňu.", klavesnica: "Prejdete na ňu klávesom Enter alebo tlačidlom Pokračujte ďalej.", odkaz: "Prejsť na stránku triedy V" };
const T_CZ = { nadpis: NADPIS_CZ, ide: "Přesměrováváme Vás…", hned: "Přejít hned", hlasIde: NADPIS_CZ + " Přesměrováváme Vás na ni.", klavesnica: "Přejdete na ni klávesou Enter nebo tlačítkem Pokračujte dále.", odkaz: "Přejít na stránku třídy V" };
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
  if (podm) { ok++; if (b) b.ok++; } else { zle++; if (b) b.zle++; console.log("    ✗ " + (b ? b.sirka + " " : "") + text); }
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
  const podoba = ["ide", "klavesnica"].find((x) => b.classList.contains("lcd1v-vclass--" + x)) || "";
  return { podoba, ide: podoba === "ide", text: b.textContent.replace(/\s+/g, " ").trim(), href: a && a.getAttribute("href"), odkaz: a && a.textContent.trim(), vKarte: !!b.closest(".lcd1v-k-auto"), viditelne: r.height > 20 && getComputedStyle(b).display !== "none", vyska: Math.round(r.height) };
});

/** Stála oblasť aria-live: { pocet, text, vRegione: role/aria-live, skryta: 1 px } */
const oblastHlasu = (page) => page.evaluate(() => {
  const h = document.querySelectorAll(".lcd1v-vclass-hlas");
  const x = h[0];
  const r = x && x.getBoundingClientRect();
  return { pocet: h.length, text: x ? x.textContent : null, vRegione: !!x && x.getAttribute("aria-live") === "polite" && x.getAttribute("role") === "status", skryta: !!r && r.width <= 1 && r.height <= 1, boxBezLive: !document.querySelector(".lcd1v-vclass[aria-live], .lcd1v-vclass[role]") };
});

/**
 * Okno „Máte Mercedes triedy V?“ je zrušené (Michal 8. 11. 2026): "" = na stránke nie je jeho prvok, pozadie, trieda na
 * body ani žiadny viditeľný dialóg (skryté dialógy Shoptetu — prihlásenie, košík — sa nerátajú), inak popis nálezu.
 */
const okno = (page) => page.evaluate(() => {
  const n = [];
  document.querySelectorAll("[class*='lcd1v-vclass-okno'], .lcd1v-vclass-pozadie").forEach((e) => n.push("prvok ." + String(e.className).trim().split(/\s+/).join(".")));
  if (document.body.classList.contains("lcd1v-vclass-okno-otvorene")) n.push("body.lcd1v-vclass-okno-otvorene");
  document.querySelectorAll("[role=dialog], [role=alertdialog], [aria-modal=true], dialog[open]").forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden") n.push("dialóg " + e.tagName + "." + e.className + " „" + e.textContent.replace(/\s+/g, " ").trim().slice(0, 60) + "“");
  });
  return n.join("; ");
});
/** Kde je fokus: "brands" | "models" | "years" | "type-selector" (pole v karte auta), "odkaz" (v nápise), "body", inak tag.trieda. */
const fokus = (page) => page.evaluate((sel) => {
  const a = document.activeElement;
  if (!a || a === document.body) return "body";
  const sl = a.closest(sel + " .surcharge-list");
  if (sl) return ["brands", "models", "years", "type-selector"].find((k) => sl.classList.contains(k)) || sl.className;
  if (a.closest(".lcd1v-vclass")) return "odkaz";
  return a.tagName + "." + a.className;
}, AUTO_1V);
/** Karta „Vaše auto“: značka, model, rok, typ karosérie — text vybranej možnosti a či je to placeholder (option.notselect). */
const autoKarta = (page) => page.evaluate((sel) => ["brands", "models", "years", "type-selector"].map((k) => {
  const s = document.querySelector(sel + " .modl-selector-wrap .surcharge-list." + k + " select");
  const o = s && s.selectedIndex > -1 ? s.options[s.selectedIndex] : null;
  return { k, text: o ? o.text.trim() : null, ph: !!o && o.classList.contains("notselect") };
}), AUTO_1V);
/** Hodnoty výberu auta (značka, model, rok) v karte „Vaše auto“. */
const vybraneAuto = async (page) => (await autoKarta(page)).slice(0, 3).map((x) => x.text || "");
/** sessionStorage: uložené auto (main.js saveModel) a príznaky „už bol na triede V“. */
const ulozene = (page) => page.evaluate(() => {
  const o = {};
  ["Brand", "Model", "Year", "carType", "model", "lcdVclassPresmer", "lcdVclass"].forEach((k) => { try { o[k] = sessionStorage.getItem(k); } catch (e) { o[k] = "?"; } });
  return o;
});
/** Karta auta označená živou validáciou kroku ako nevyplnená (červený rámik). */
const autoCervene = (page) => page.evaluate((sel) => { const k = document.querySelector(sel); return !!k && /\b(lcd-needs-fill|selection-required|lcd1v-chyba)\b/.test(k.className); }, AUTO_1V);

/** Nápis „ide“: „Presmerúvame Vás…“ + odkaz „Prejsť hneď“ na href (T = T_SK | T_CZ). */
function overIde(o, href, kde, T = T_SK) {
  over(!!o && o.podoba === "ide" && o.viditelne && o.text === T.nadpis + T.ide + T.hned && o.odkaz === T.hned && o.href === href, kde + ": nápis „" + T.ide + "“ s odkazom „" + T.hned + "“ na " + href + " " + j(o));
}
/** Nápis „klavesnica“: bez odpočtu, Enter / Pokračujte ďalej, odkaz „Prejsť na stránku triedy V“ na href. */
function overKlavesnica(o, href, kde, T = T_SK) {
  over(!!o && o.podoba === "klavesnica" && o.viditelne && o.text === T.nadpis + T.klavesnica + T.odkaz && o.odkaz === T.odkaz && o.href === href, kde + ": nápis bez odpočtu s odkazom na " + href + " " + j(o));
}
/**
 * Rok šípkou z klávesnice (Windows: šípka v zatvorenom selecte zmení hodnotu a pošle change — čítačka pri prechádzaní rokov).
 * Platforma, kde šípka hodnotu nemení: kláves + change napodobnené ako na Windows. Fokus ostane v poli roku. Vráti rok.
 */
async function rokSipkou(page, s, kluc = "ArrowDown") {
  const rok = AUTO_1V + " .modl-selector-wrap .years select";
  await page.focus(rok);
  const r0 = await page.evaluate((x) => document.querySelector(x).value, rok);
  await page.keyboard.press(kluc);
  await page.waitForTimeout(300);
  let r = await page.evaluate((x) => document.querySelector(x).value, rok);
  if (!/^\d{4}$/.test(r) || r === r0) {
    console.log("    (" + s + ": šípka hodnotu nezmenila, kláves + change napodobnené)");
    await page.evaluate(([x, k]) => { const e = document.querySelector(x); e.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })); e.selectedIndex = 1; e.dispatchEvent(new Event("change", { bubbles: true })); }, [rok, kluc]);
    await page.waitForTimeout(300);
    r = await page.evaluate((x) => document.querySelector(x).value, rok);
  }
  return r;
}

/**
 * Návrat s uloženou triedou V u zákazníka, ktorý už na stránke triedy V bol: výber auta vynulovaný (značka, model, rok aj typ
 * karosérie na placeholdri), uložené auto v sessionStorage zmazané (príznak ostáva), žiadny nápis, okno ani dialóg a stránka
 * ostane — ≥ 2,5 s bez navigácie a od času t (pred načítaním) žiadne presmerovanie na triedu V.
 */
async function overVynulovane(page, stav, t, kde, s) {
  const u0 = page.url();
  const nav0 = stav.navigacie.length;
  const t0 = Date.now();
  await page.waitForTimeout(300);
  const a = await autoKarta(page);
  over(a.length === 4 && a.every((x) => x.ph), kde + ": výber auta vynulovaný — značka, model, rok aj typ karosérie na „Vyberte…“ " + j(a.map((x) => x.text)));
  const u = await ulozene(page);
  over(["Brand", "Model", "Year", "carType", "model"].every((k) => u[k] == null), kde + ": uložené auto v sessionStorage zmazané (Brand, Model, Year, carType, model) " + j(u));
  over(!!(u.lcdVclassPresmer || u.lcdVclass), kde + ": príznak „už bol na triede V“ ostal " + j({ lcdVclassPresmer: u.lcdVclassPresmer, lcdVclass: u.lcdVclass }));
  const o = await oznamenie(page);
  over(!o, kde + ": bez nápisu " + j(o));
  const ok = await okno(page);
  over(!ok, kde + ": bez okna „Máte Mercedes triedy V?“ aj iného dialógu " + ok);
  const h = await oblastHlasu(page);
  over(h.pocet === 1 && h.text === "", kde + ": oblasť aria-live prázdna " + j(h));
  if (s) await snimka(page, "2-vynulovane-" + kde.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "") + "-" + s, AUTO_1V, 20);
  await page.waitForTimeout(Math.max(0, 2600 - (Date.now() - t0)));
  over(page.url() === u0 && stav.navigacie.length === nav0 && !preslo(stav, t), kde + ": stránka ostala ≥ 2,5 s, žiadne odrazenie na triedu V (" + page.url() + ", ďalšie navigácie: " + (stav.navigacie.length - nav0) + ")");
  const o2 = await oznamenie(page);
  const ok2 = await okno(page);
  over(!o2 && !ok2, kde + ": ani po 2,5 s nápis či okno " + j({ o2, ok2 }));
  await overBezChyb(page, kde);
}
/** Náhľad celej obrazovky so zeleným štítkom „NÁHĽAD“ pre Michala. */
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
    meno: "598 výber V Class 2020 myšou -> trieda V ?rok=2020; Späť -> výber auta vynulovaný (bez slučky); Audi, F5; trieda V myšou znova -> ?rok=2022",
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
      over(h1.pocet === 1 && h1.text === T_SK.hlasIde && h1.boxBezLive, "598: oblasť aria-live ohlási presmerovanie " + JSON.stringify(h1));
      over(o && o.ide && o.vKarte && o.viditelne, "598: oznámenie s presmerovaním v karte auta " + JSON.stringify(o));
      overIde(o, VCLASS + "?rok=2020", "598");
      const ok0 = await okno(page);
      over(!ok0, "598: pri prvom výbere bez okna a dialógu, presmeruje sám " + ok0);
      await snimka(page, "1-presmerovanie-598-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "598");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "598: presmerovanie po ~1,5 s (" + (n ? n.cas + " ms" : "nebolo") + ")");
      over(n && new URL(n.url).search === "?rok=2020", "598: adresa " + (n && n.url));
      await overPrichod(page, { rok: "2020", velkost: "" }, "598");
      await snimka(page, "3-prichod-vclass-598-" + s, "#lcd-vclass .lv-2m", 40);
      // Späť: produkt sa načíta znova s uloženou triedou V, zákazník na triede V už bol -> výber auta vynulovaný, žiadna slučka
      const t1 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await overVynulovane(page, stav, t1, "598 po Späť", s);
      // zákazník pokračuje s iným autom: nič
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Audi", model: "A6", rok: "2015" });
      await page.waitForTimeout(400);
      over(!(await oznamenie(page)) && !(await okno(page)), "598 po Späť: Audi A6 2015 bez nápisu aj okna");
      // F5 s Audi: nič
      const t2 = Date.now();
      await page.reload({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await page.waitForTimeout(1500);
      const a2 = await vybraneAuto(page);
      over(!(await oznamenie(page)) && !(await okno(page)) && !preslo(stav, t2), "598 F5 s Audi (" + j(a2) + "): bez nápisu, okna aj presmerovania");
      await overBezChyb(page, "598 F5");
      // už bol na triede V: nový výber triedy V myšou = znova „Presmerúvame Vás…“ a stránka triedy V (okno nie)
      await otvorKartuAuta(page);
      const t3 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2022" }, "zrm");
      overIde(await oznamenie(page), VCLASS + "?rok=2022", "598 (už bol na triede V) výber myšou");
      const ok3 = await okno(page);
      over(!ok3, "598 (už bol na triede V) výber myšou: bez okna a dialógu " + ok3);
      const n3 = await cakajNaVclass(page, stav, t3);
      over(n3 && n3.cas >= 1300 && n3.cas <= 4000 && new URL(n3.url).search === "?rok=2022", "598 (už bol na triede V) výber myšou: presmerovanie po ~1,5 s na ?rok=2022 " + j(n3));
      await overPrichod(page, { rok: "2022", velkost: "" }, "598 (už bol na triede V)");
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
    meno: "598 klávesnica: šípky v roku a presun medzi poľami auta nepresmerujú, Enter áno",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      const t0 = Date.now();
      const r = await rokSipkou(page, s);
      overKlavesnica(await oznamenie(page), VCLASS + "?rok=" + r, "598 klávesnica (" + r + ")");
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && h.text === NADPIS + " " + T_SK.klavesnica, "598 klávesnica: oblasť aria-live " + JSON.stringify(h));
      const ok = await okno(page);
      over(!ok, "598 klávesnica: bez okna a dialógu " + ok);
      await snimka(page, "4-klavesnica-598-" + s, ".lcd1v-vclass", 150);
      // ďalšia šípka (iný rok triedy V): stále len nápis
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(2600);
      over(!preslo(stav, t0) && new URL(page.url()).pathname !== VCLASS, "598 klávesnica: šípky v roku nepresmerovali");
      // Shift+Tab na model a Tab späť na rok: fokus ostáva v poliach auta -> stále bez odpočtu
      await page.keyboard.press("Shift+Tab");
      await page.waitForTimeout(300);
      const f1 = await fokus(page);
      const o1 = await oznamenie(page);
      over(f1 === "models" && !!o1 && o1.podoba === "klavesnica", "598 klávesnica: Shift+Tab na model = stále nápis bez odpočtu " + j({ fokus: f1, podoba: o1 && o1.podoba }));
      await page.keyboard.press("Tab");
      await page.waitForTimeout(2300);
      const f2 = await fokus(page);
      const o2 = await oznamenie(page);
      over(f2 === "years" && !!o2 && o2.podoba === "klavesnica" && !preslo(stav, t0) && new URL(page.url()).pathname !== VCLASS, "598 klávesnica: Tab späť na rok, ani po 2,5 s bez presmerovania " + j({ fokus: f2, podoba: o2 && o2.podoba }));
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
      // „Pokračujte ďalej“ karty auta: hneď na triedu V, skôr než živá validácia kroku (bez červeného rámika na karte auta)
      const t1 = Date.now();
      await page.click(AUTO_1V + " > .next-step-button");
      await page.waitForTimeout(150);
      const po = await oznamenie(page).catch(() => null);
      const cervene = await autoCervene(page).catch(() => false);
      const n = await cakajNaVclass(page, stav, t1, 5000);
      over(n && n.cas < 1000 && new URL(n.url).search === "?rok=2018&velkost=L", "601 klávesnica: Pokračujte ďalej v karte auta presmeruje hneď " + JSON.stringify(n) + " (nápis po kliku: " + (po && po.podoba) + ")");
      over(!cervene, "601 klávesnica: Pokračujte ďalej bez červeného rámika živej validácie na karte auta");
      await overPrichod(page, { rok: "2018", velkost: "L" }, "601 klávesnica");
    },
  },
  {
    meno: "598 počas odpočtu „Presmerúvame Vás…“ (výber myšou): Pokračujte ďalej aj Enter v poli auta presmerujú hneď",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const t0 = Date.now();
      await page.selectOption(AUTO_1V + " .modl-selector-wrap .years select", { label: "2020" }, { force: true });
      overIde(await oznamenie(page), VCLASS + "?rok=2020", "598 odpočet");
      const t1 = Date.now();
      await page.click(AUTO_1V + " > .next-step-button");
      await page.waitForTimeout(150);
      const cervene = await autoCervene(page).catch(() => false);
      const n = await cakajNaVclass(page, stav, t0, 5000);
      over(n && n.cas - (t1 - t0) < 700 && n.cas < 1200 && new URL(n.url).search === "?rok=2020", "598 odpočet: Pokračujte ďalej presmeruje hneď, nečaká na koniec 1,5 s " + j(n && { odKliku: n.cas - (t1 - t0), odVyberu: n.cas, url: n.url }));
      over(!cervene, "598 odpočet: Pokračujte ďalej bez červeného rámika živej validácie na karte auta");
      await overPrichod(page, { rok: "2020", velkost: "" }, "598 odpočet Pokračujte");
      // Späť (už bol na triede V -> vynulované), znova výber myšou a počas odpočtu Enter v poli roku
      const t2 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await overVynulovane(page, stav, t2, "598 odpočet po Späť", null);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const rok = AUTO_1V + " .modl-selector-wrap .years select";
      await page.focus(rok); // fokus v poli roku bez klávesu: výber myšou = „ide“ s odpočtom
      await page.waitForTimeout(300);
      const t3 = Date.now();
      await page.selectOption(rok, { label: "2021" }, { force: true });
      overIde(await oznamenie(page), VCLASS + "?rok=2021", "598 odpočet (Enter)");
      const t4 = Date.now();
      await page.keyboard.press("Enter");
      const n2 = await cakajNaVclass(page, stav, t3, 5000);
      over(n2 && n2.cas - (t4 - t3) < 700 && n2.cas < 1200 && new URL(n2.url).search === "?rok=2021", "598 odpočet: Enter v poli roku presmeruje hneď, nečaká na koniec 1,5 s " + j(n2 && { odEnter: n2.cas - (t4 - t3), odVyberu: n2.cas, url: n2.url }));
      await overPrichod(page, { rok: "2021", velkost: "" }, "598 odpočet Enter");
    },
  },
  {
    meno: "598 klávesnica: fokus na odkaz v nápise nie, odchod z polí auta (Tab na typ karosérie) -> „Presmerúvame Vás…“ a po 1,5 s trieda V",
    async beh({ page, stav }, s) {
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const t0 = Date.now();
      const r = await rokSipkou(page, s);
      overKlavesnica(await oznamenie(page), VCLASS + "?rok=" + r, "598 Tab (" + r + ")");
      // fokus na odkaz v nápise (napr. čítačka): stále bez odpočtu
      await page.focus(".lcd1v-vclass .lcd1v-vclass__a");
      await page.waitForTimeout(2300);
      const f0 = await fokus(page);
      const o0 = await oznamenie(page);
      over(f0 === "odkaz" && !!o0 && o0.podoba === "klavesnica" && !preslo(stav, t0), "598 Tab: fokus na odkaz v nápise = stále bez odpočtu, 2,5 s bez presmerovania " + j({ fokus: f0, podoba: o0 && o0.podoba }));
      // späť do poľa roku a Tab preč z polí auta (na typ karosérie): trieda V ostala vybraná -> „Presmerúvame Vás…“
      await page.focus(AUTO_1V + " .modl-selector-wrap .years select");
      await page.waitForTimeout(200);
      const t1 = Date.now();
      await page.keyboard.press("Tab");
      // prepnutie na „ide“ až o ODCHOD_MS = 300 ms (klik na „Pokračujte“ dobehne) + 100 ms zápis do oblasti aria-live
      await page.waitForTimeout(600);
      const f1 = await fokus(page);
      over(["brands", "models", "years", "odkaz"].indexOf(f1) < 0, "598 Tab: fokus odišiel z polí auta (" + f1 + ")");
      overIde(await oznamenie(page), VCLASS + "?rok=" + r, "598 Tab z polí auta");
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && h.text === T_SK.hlasIde, "598 Tab: oblasť aria-live ohlási presmerovanie " + j(h));
      const ok = await okno(page);
      over(!ok, "598 Tab: bez okna a dialógu " + ok);
      await snimka(page, "5-tab-ide-598-" + s, ".lcd1v-vclass", 150);
      const n = await cakajNaVclass(page, stav, t1);
      over(n && n.cas >= 1300 && n.cas <= 4000 && new URL(n.url).search === "?rok=" + r, "598 Tab: presmerovanie po ~1,5 s na ?rok=" + r + " " + j(n));
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
    meno: "598 bez presmerovania: Vito, Viano, EQV, VLE, V Class 2000, 2003, 2010 a 2013, Audi; zmena auta počas čakania",
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
        { znacka: "Mercedes-Benz", model: "V Class", rok: "2010" }, // W639 (Viano), obyčajné „V Class“ pred 2014
        { znacka: "Mercedes-Benz", model: "V Class", rok: "2013" },
        { znacka: "Audi", model: "A6", rok: "2015" },
      ];
      for (const a of auta) {
        await vyberAuto(page, AUTO_1V, a, "zrm"); // rok pred modelom: cestou nevznikne trieda V od 2014
        await page.waitForTimeout(600);
        const ok = await okno(page);
        over(!(await oznamenie(page)) && !ok, "598: " + a.model + " " + a.rok + " bez oznámenia aj okna " + ok);
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
    meno: "601 s uloženou triedou V z inej stránky (na triede V ešte nebol): pri načítaní presmeruje; po Späť výber auta vynulovaný (bez slučky)",
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
      await overVynulovane(page, stav, t1, "601 uložené po Späť", s);
    },
  },
  {
    meno: "598 s uloženou triedou V, zákazník už bol na stránke triedy V (lcdVclass): pri načítaní výber auta vynulovaný; klávesnica = nápis; myšou -> trieda V; Späť -> znova vynulovaný",
    // celé auto aj s typom: karta auta je pri načítaní vyplnená a zavretá
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class", Year: "2021", carType: "Long", model: "Mercedes-Benz V Class 2021 Long", lcdVclass: '{"rok":"2021"}' },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await overVynulovane(page, stav, t0, "598 (bol na triede V) pri načítaní", s);
      // klávesnica (už bol na triede V): nápis s odkazom bez odpočtu ako u každého, okno nie
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const t1 = Date.now();
      const r = await rokSipkou(page, s, "ArrowDown");
      overKlavesnica(await oznamenie(page), VCLASS + "?rok=" + r, "598 (bol na triede V) klávesnica (" + r + ")");
      const ok1 = await okno(page);
      over(!ok1, "598 (bol na triede V) klávesnica: bez okna a dialógu " + ok1);
      await page.waitForTimeout(2300);
      over(!preslo(stav, t1) && new URL(page.url()).pathname !== VCLASS, "598 (bol na triede V) klávesnica: fokus v poli roku, 2,5 s bez presmerovania");
      // výber myšou (iný rok triedy V): „Presmerúvame Vás…“ a stránka triedy V
      const rokMysou = r === "2021" ? "2022" : "2021";
      const t2 = Date.now();
      await page.selectOption(AUTO_1V + " .modl-selector-wrap .years select", { label: rokMysou }, { force: true });
      overIde(await oznamenie(page), VCLASS + "?rok=" + rokMysou, "598 (bol na triede V) výber myšou");
      const ok2 = await okno(page);
      over(!ok2, "598 (bol na triede V) výber myšou: bez okna a dialógu " + ok2);
      const n = await cakajNaVclass(page, stav, t2);
      over(n && n.cas >= 1300 && n.cas <= 4000 && new URL(n.url).search === "?rok=" + rokMysou, "598 (bol na triede V) výber myšou: presmerovanie po ~1,5 s " + j(n));
      await overPrichod(page, { rok: rokMysou, velkost: "" }, "598 (bol na triede V) výber myšou");
      // Späť: znova vynulované, žiadna slučka
      const t3 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await overVynulovane(page, stav, t3, "598 (bol na triede V) po Späť", null);
    },
  },
  {
    meno: "601 s uloženou V Class L 2020 a príznakom presmerovania (lcdVclassPresmer): pri načítaní výber auta vynulovaný, nič sa nepresmeruje; F5 prázdne",
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class L (long 5140 mm)", Year: "2020", carType: "Long", model: "Mercedes-Benz V Class L (long 5140 mm) 2020 Long", lcdVclassPresmer: "1" },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA[601]);
      await cakaj1v(page);
      await overVynulovane(page, stav, t0, "601 (príznak presmerovania) pri načítaní", s);
      const t1 = Date.now();
      await page.reload({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await page.waitForTimeout(1500);
      const a = await autoKarta(page);
      const ok = await okno(page);
      over(a.every((x) => x.ph) && !(await oznamenie(page)) && !ok && !preslo(stav, t1) && new URL(page.url()).pathname !== VCLASS, "601 F5 po vynulovaní: výber prázdny, bez nápisu, okna aj presmerovania " + j(a.map((x) => x.text)) + " " + ok);
      await overBezChyb(page, "601 F5 po vynulovaní");
    },
  },
  {
    meno: "598 s uloženým Vito 2020, zákazník už bol na triede V: výber auta ostane, nič sa nedeje",
    ulozene: { Brand: "Mercedes-Benz", Model: "Vito", Year: "2020", carType: "Long", model: "Mercedes-Benz Vito 2020 Long", lcdVclassPresmer: "1" },
    async beh({ page, stav }) {
      const t0 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await page.waitForTimeout(2000);
      const a = await autoKarta(page);
      over(j(a.map((x) => x.text)) === j(["Mercedes-Benz", "Vito", "2020", "Long"]), "598 uložené Vito 2020: výber auta ostal (nevynuluje sa) " + j(a.map((x) => x.text)));
      const u = await ulozene(page);
      over(u.Brand === "Mercedes-Benz" && u.Model === "Vito" && u.Year === "2020" && u.carType === "Long", "598 uložené Vito 2020: uložené auto v sessionStorage ostalo " + j(u));
      const ok = await okno(page);
      over(!(await oznamenie(page)) && !ok, "598 uložené Vito 2020: bez nápisu aj okna " + ok);
      over(!preslo(stav, t0) && new URL(page.url()).pathname !== VCLASS, "598 uložené Vito 2020: bez presmerovania");
      await overBezChyb(page, "598 uložené Vito 2020");
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
      const ok = await okno(page);
      over(!(await page.$(".lcd1v-vclass")) && !ok, "trieda V: žiadne oznámenie presmerovania ani okno " + ok);
      over(await page.evaluate(() => !!window.__lcdVclass), "trieda V: konfigurátor triedy V beží");
    },
  },
  {
    meno: "titulka: V Class XL 2021 -> trieda V (bez typu karosérie); potom 598 s tým istým autom = výber vynulovaný; Audi a Vito -> rozcestník",
    async beh({ page, stav }, s) {
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
      // titulka -> trieda V -> Basic s tým istým autom: výber auta sa vynuluje, neodrazí späť
      const t1 = Date.now();
      await otvor(page, ADRESA[598]);
      await cakaj1v(page);
      await overVynulovane(page, stav, t1, "titulka -> trieda V -> 598", s);
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
      const ok = await okno(page);
      over(!(await oznamenie(page)) && !ok, "CZ 2403: V Class 2020 bez oznámenia aj okna " + ok);
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
    meno: "CZ 2403 výber V Class 2020 myšou -> CZ trieda V ?rok=2020; Späť -> výber auta vynulovaný; trieda V myšou znova -> CZ ?rok=2022",
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
      over(h1.pocet === 1 && h1.text === T_CZ.hlasIde && h1.boxBezLive, "CZ 2403: oblasť aria-live po česky " + j(h1));
      over(o && o.ide && o.vKarte && o.viditelne, "CZ 2403: oznámenie s presmerovaním v karte auta " + j(o));
      overIde(o, VCLASS + "?rok=2020", "CZ 2403", T_CZ);
      const ok0 = await okno(page);
      over(!ok0, "CZ 2403: pri prvom výbere bez okna a dialógu, presmeruje sám " + ok0);
      await snimka(page, "cz-1-presmerovanie-2403-" + s, ".lcd1v-vclass", 150);
      await overBezChyb(page, "CZ 2403");
      const n = await cakajNaVclass(page, stav, t0);
      over(n && n.cas >= 1300 && n.cas <= 4000, "CZ 2403: presmerovanie po ~1,5 s (" + (n ? n.cas + " ms" : "nebolo") + ")");
      await prichodCz(page, stav, n, "?rok=2020", "CZ 2403");
      // Späť: produkt s uloženou triedou V, zákazník na triede V už bol -> výber auta vynulovaný, žiadna slučka
      const t1 = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await cakaj1v(page);
      await overVynulovane(page, stav, t1, "CZ 2403 po Späť", s);
      // už bol na triede V: výber triedy V myšou = znova „Přesměrováváme Vás…“ a CZ stránka triedy V
      await otvorKartuAuta(page);
      const t2 = Date.now();
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class", rok: "2022" });
      overIde(await oznamenie(page), VCLASS + "?rok=2022", "CZ 2403 (už bol na triede V) výber myšou", T_CZ);
      const ok2 = await okno(page);
      over(!ok2, "CZ 2403 (už bol na triede V) výber myšou: bez okna a dialógu " + ok2);
      const n2 = await cakajNaVclass(page, stav, t2);
      over(n2 && n2.cas >= 1300 && n2.cas <= 4000, "CZ 2403 (už bol na triede V) výber myšou: presmerovanie po ~1,5 s " + j(n2));
      await prichodCz(page, stav, n2, "?rok=2022", "CZ 2403 (už bol na triede V)");
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
    meno: "CZ 2406 počas odpočtu „Přesměrováváme Vás…“: Pokračujte dále presmeruje hneď",
    async beh({ page, stav }) {
      await otvor(page, ADRESA.cz2406);
      await cakaj1v(page);
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class XL (Extra Long 5370 mm)" }, "zm");
      const t0 = Date.now();
      overIde(await oznamenie(page), VCLASS + "?velkost=XL", "CZ 2406 odpočet", T_CZ);
      const t1 = Date.now();
      await page.click(AUTO_1V + " > .next-step-button");
      await page.waitForTimeout(150);
      const cervene = await autoCervene(page).catch(() => false);
      const n = await cakajNaVclass(page, stav, t0, 5000);
      over(n && n.cas - (t1 - t0) < 700 && n.cas < 1200, "CZ 2406 odpočet: Pokračujte dále presmeruje hneď, nečaká na koniec 1,5 s " + j(n && { odKliku: n.cas - (t1 - t0), url: n.url }));
      over(!cervene, "CZ 2406 odpočet: Pokračujte dále bez červeného rámika živej validácie na karte auta");
      await prichodCz(page, stav, n, "?velkost=XL", "CZ 2406 odpočet");
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
      const r = await rokSipkou(page, s);
      overKlavesnica(await oznamenie(page), VCLASS + "?rok=" + r + "&velkost=XL", "CZ 2424 klávesnica: oznámenie po česky bez odpočtu (" + r + ")", T_CZ);
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && h.text === NADPIS_CZ + " " + T_CZ.klavesnica, "CZ 2424 klávesnica: oblasť aria-live po česky " + j(h));
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
    meno: "CZ 2403 s uloženou triedou V, zákazník už bol na stránke triedy V: pri načítaní vynulované; klávesnica = nápis po česky; Tab preč -> CZ trieda V",
    ulozene: { Brand: "Mercedes-Benz", Model: "V Class", Year: "2021", lcdVclass: '{"rok":"2021"}' },
    async beh({ page, stav }, s) {
      const t0 = Date.now();
      await otvor(page, ADRESA.cz2403);
      await cakaj1v(page);
      await overVynulovane(page, stav, t0, "CZ 2403 (bol na triede V) pri načítaní", s);
      // klávesnica: nápis po česky bez odpočtu, kým je fokus v poli roku nič
      await otvorKartuAuta(page);
      await vyberAuto(page, AUTO_1V, { znacka: "Mercedes-Benz", model: "V Class" }, "zm");
      const t1 = Date.now();
      const r = await rokSipkou(page, s);
      overKlavesnica(await oznamenie(page), VCLASS + "?rok=" + r, "CZ 2403 (bol na triede V) klávesnica (" + r + ")", T_CZ);
      const ok1 = await okno(page);
      over(!ok1, "CZ 2403 (bol na triede V) klávesnica: bez okna a dialógu " + ok1);
      await page.waitForTimeout(2300);
      over(!preslo(stav, t1) && new URL(page.url()).pathname !== VCLASS, "CZ 2403 (bol na triede V) klávesnica: fokus v poli roku, 2,5 s bez presmerovania");
      // Tab preč z polí auta: „Přesměrováváme Vás…“ a po 1,5 s CZ stránka triedy V
      const t2 = Date.now();
      await page.keyboard.press("Tab");
      // prepnutie na „ide“ až o ODCHOD_MS = 300 ms (klik na „Pokračujte“ dobehne) + 100 ms zápis do oblasti aria-live
      await page.waitForTimeout(600);
      const f = await fokus(page);
      overIde(await oznamenie(page), VCLASS + "?rok=" + r, "CZ 2403 Tab z polí auta (fokus " + f + ")", T_CZ);
      const h = await oblastHlasu(page);
      over(h.pocet === 1 && h.text === T_CZ.hlasIde, "CZ 2403 Tab: oblasť aria-live po česky " + j(h));
      const n = await cakajNaVclass(page, stav, t2);
      over(n && n.cas >= 1300 && n.cas <= 4000, "CZ 2403 Tab: presmerovanie po ~1,5 s " + j(n));
      await prichodCz(page, stav, n, "?rok=" + r, "CZ 2403 Tab");
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
      const ok = await okno(page);
      over(!(await page.$(".lcd1v-vclass")) && !ok, "CZ ?novy=0: bez oznámenia aj okna " + ok);
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
      const ok = await okno(page);
      over(!(await page.$(".lcd1v-vclass")) && !ok, "?novy=0: bez oznámenia aj okna " + ok);
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
  // príznak „už bol na triede V“ (sessionStorage lcdVclassPresmer alebo lcdVclass): podľa neho konfigurátor po návrate
  // s uloženou triedou V výber auta vynuluje (namiesto okna „Máte Mercedes triedy V?“, zrušeného 8. 11. 2026)
  const pv = await import("../assets/js/functions/vclassPresmerovanie.js");
  const pamat = new Map();
  const povodne = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (k) => (pamat.has(k) ? pamat.get(k) : null), setItem: (k, v) => pamat.set(k, String(v)), removeItem: (k) => pamat.delete(k) } });
  over(typeof pv.uzBolNaVclass === "function" && typeof pv.oznacPresmerovane === "function" && pv.KLUC_PRESMEROVANE === "lcdVclassPresmer" && pv.KLUC_VCLASS === "lcdVclass", "už bol: funkcie uzBolNaVclass/oznacPresmerovane, kľúče lcdVclassPresmer a lcdVclass");
  if (typeof pv.uzBolNaVclass === "function" && typeof pv.oznacPresmerovane === "function") {
    over(!pv.uzBolNaVclass(), "už bol: na začiatku nie");
    pv.oznacPresmerovane();
    over(pv.uzBolNaVclass() && pamat.get("lcdVclassPresmer") === "1", "už bol: po presmerovaní áno (lcdVclassPresmer = 1) " + pamat.get("lcdVclassPresmer"));
    pamat.clear();
    pamat.set("lcdVclass", '{"rok":"2021"}');
    over(pv.uzBolNaVclass(), "už bol: rozrobený výber na stránke triedy V (lcdVclass) = áno");
    pamat.clear();
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new Error("súkromný režim"); } });
    let bezChyby = true;
    try { pv.oznacPresmerovane(); over(!pv.uzBolNaVclass(), "už bol: bez sessionStorage = nie"); } catch (e) { bezChyby = false; }
    over(bezChyby, "už bol: bez sessionStorage bez výnimky");
  }
  if (povodne) Object.defineProperty(globalThis, "sessionStorage", povodne); else delete globalThis.sessionStorage;
  // okno zrušené: functions/vclassPresmerovanie.js nemá funkcie ani kľúč okna, texty nápisu nemajú text okna
  over(!("oknoBoloNa" in pv) && !("oznacOkno" in pv) && !("KLUC_OKNO" in pv), "okno zrušené: vclassPresmerovanie.js neexportuje oknoBoloNa, oznacOkno ani KLUC_OKNO " + j(Object.keys(pv)));
  const vp = await import("../assets/js/components/konfigurator1v/vclass-presmerovanie.js");
  for (const [meno, T, TEST] of [["TEXTY_SK", vp.TEXTY_SK, T_SK], ["TEXTY_CZ", vp.TEXTY_CZ, T_CZ]]) {
    over(!!T && j(Object.keys(T).sort()) === j(["hlasIde", "hned", "ide", "klavesnica", "nadpis", "odkaz"]), "okno zrušené: " + meno + " len nápis (bez okno, hlasOdkaz) " + j(T && Object.keys(T)));
    over(!!T && ["nadpis", "ide", "hned", "klavesnica", "odkaz"].every((k) => T[k] === TEST[k]) && T.nadpis + " " + T.hlasIde === TEST.hlasIde, "texty: " + meno + " = texty, ktoré test čaká na stránke");
  }
  over(vp.CAKANIE === 1500 && vp.KLAVESNICA_MS === 600, "časy: presmerovanie po 1,5 s, klávesnica 600 ms (" + vp.CAKANIE + ", " + vp.KLAVESNICA_MS + ")");
  const scss = readFileSync(join(KOREN, "assets/css/_lcd1v-kroky.scss"), "utf8") + readFileSync(join(KOREN, "assets/css/luxuryCar.css"), "utf8");
  over(!/lcd1v-vclass-okno|lcd1v-vclass-pozadie/.test(scss), "okno zrušené: _lcd1v-kroky.scss ani luxuryCar.css nemajú štýly okna (.lcd1v-vclass-okno, .lcd1v-vclass-pozadie)");
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
// okno zrušené aj v testovanom builde (JS ani CSS ho nemajú)
over(!/lcd1v-vclass-okno|lcd1v-vclass-pozadie/.test(B.css.toString()) && !/lcd1v-vclass-okno|lcd1v-vclass-pozadie|Zostať tu|Zůstat zde/.test(B.js.toString()), "okno zrušené: build " + B.tmp + " (luxuryCar.js, luxuryCar.css) bez okna „Máte Mercedes triedy V?“");
console.log("CZ presmerovanie: " + (CZ_ZAP ? "ZAPNUTÉ" + (CZ_PREPINAC && zdrojCz !== "true" ? " (--cz-spustene, podvrh v builde)" : " (CZ_SPUSTENE = true v zdroji)") : "vypnuté (CZ_SPUSTENE = " + zdrojCz + ")"));
console.log("build: " + B.tmp + " (" + (B.js.length / 1024).toFixed(0) + " kB luxuryCar.js, " + (B.vclass.length / 1024).toFixed(0) + " kB lcd-vclass.js)");
const prehliadac = await pw.chromium.launch({ headless: true });
/** „1366 SK“ -> { ok, zle, scenare, scenareZle } */
const suhrn = {};
const bezPrehliadaca = { ok, zle };
async function behSirky(sirka) {
  for (const sc of SCENARE) {
    if (LEN && sc.meno.indexOf(LEN) < 0) continue;
    if ((sc.cz === "zap" && !CZ_ZAP) || (sc.cz === "vyp" && CZ_ZAP)) continue; // CZ podľa prepínača CZ_SPUSTENE
    const k = await novyKontext(prehliadac, B, sirka, { ulozene: sc.ulozene });
    const b = { sirka, ok: 0, zle: 0 };
    await behScenara.run(b, async () => {
      try {
        await sc.beh(k, String(sirka));
        over(k.stav.podvrhnute > 0, sc.meno + ": lokálny build podvrhnutý");
        over(k.stav.posty.length === 0, sc.meno + ": žiadny POST na /action/ " + JSON.stringify(k.stav.posty));
      } catch (e) {
        over(false, sc.meno + ": výnimka " + String(e && e.message || e).split("\n")[0]);
      }
    });
    const sk = sirka + " " + (sc.cz ? "CZ" : "SK"); // súhrn po šírke a webe (titulka a stránka triedy V bez cz = SK)
    const sh = suhrn[sk] || (suhrn[sk] = { ok: 0, zle: 0, scenare: 0, scenareZle: 0 });
    sh.ok += b.ok; sh.zle += b.zle; sh.scenare++; if (b.zle) sh.scenareZle++;
    console.log((b.zle === 0 ? "OK   " : "ZLE  ") + sirka + "  " + sc.meno + (k.stav.chyby.length ? "  (chyby stránky: " + k.stav.chyby.length + " — " + k.stav.chyby.slice(0, 2).join(" | ") + ")" : ""));
    await k.ctx.close();
  }
}
await Promise.all(SIRKY.map(behSirky));
await prehliadac.close();
console.log("\nbez prehliadača: " + bezPrehliadaca.ok + " OK, " + bezPrehliadaca.zle + " zlé");
for (const k of Object.keys(suhrn).sort()) console.log(k + ": scenáre " + (suhrn[k].scenare - suhrn[k].scenareZle) + "/" + suhrn[k].scenare + " OK, kontroly " + suhrn[k].ok + " OK, " + suhrn[k].zle + " zlé");
console.log("kontroly: " + ok + " OK, " + zle + " zlé" + (snimky ? "; snímky v " + snimky : ""));
process.exit(zle ? 1 : 0);
