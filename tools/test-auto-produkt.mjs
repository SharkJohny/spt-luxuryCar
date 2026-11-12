#!/usr/bin/env node
// Test stránky auta (auto-produkt.js, Michal 9. 11. 2026): SK 649 „Autokoberce Škoda Kodiaq II“ = kópia 613 Basic Stripe
// s pevným autom. Kým je 649 skrytý (hosť 404), stránka sa podvrhne: HTML živej 613 pod adresou 649 s product.id 649
// (dataLayer aj skryté pole productId). Bundly luxuryCar.js / lcd-vclass.js / luxuryCar.css z --dist. Do košíka sa nič
// nevkladá: každý POST na /action/ sa zruší.
//
//   node tools/test-auto-produkt.mjs --pw <file:///…/playwright/index.mjs> --dist <priečinok> [--sirka 390,1366]
//        [--chromium <cesta k chrome.exe>]
//
// Overuje (každá šírka):
//  1. bez uloženého auta: značka Skoda + model Kodiaq II predvyplnené, uložené v sessionStorage, nápis „Predvyplnené pre
//     Škoda Kodiaq II“ pod výberom auta, stránka ostáva.
//  2. s uloženým iným autom (BMW Rad 3 2003): po načítaní Skoda / Kodiaq II, rok na placeholderi.
//  3. zmena typu karosérie: stránka ostáva.
//  4. zmena modelu myšou (Kodiaq) po výbere farby Béžová: prechod VŽDY na Diamond 598 (Michal 9. 11. 2026), kľúč
//     prenosu z 649 na 598; na 598 auto Skoda / Kodiaq a farba Béžová (iné ID farby -> párovanie podľa názvu).
//  5. zmena značky myšou (BMW): prechod na 598.
//  6. zmena značky z klávesnice: kým je fokus v poliach auta, ostáva; Tab preč -> 598.
//  7. hlavná 613: výber Skoda / Kodiaq II nikam nepresmeruje (2,5 s), krok vzoru tam pri načítaní otvorený nie je.
//  8. krok „Vzor prešívania“ je pri načítaní 649 otvorený, auto zatvorené; Stripe označený.
//  9. dlaždica Hexa: kľúč prenosu z 649 na 610 a prechod na Hexa s autom Skoda / Kodiaq II.
// 10. druhá vrstva „Áno“: prechod na Elite Diamond 601 s prenosom a farbou Béžová.
//
// Stránka auta na DVOJVRSTVOVOM produkte (Michal 12. 11. 2026, BMW 5 G30/G31 = kópia 601). ID produktu ešte nie je,
// riadok registra je v produkty.js zakomentovaný („NOVE-bmw-5-g30“): test ho prečíta, dá mu skúšobné číslo DVOJ_ID
// a vloží ho do registra v podávanom luxuryCar.js (len v teste, repo ani dist sa nemenia). Stránka = HTML živej 601
// pod adresou /autokoberce-bmw-5-g30/ s product.id DVOJ_ID.
// 11. načítanie: BMW / Rad 5 predvyplnené, nápis „Predvyplnené pre BMW 5 G30/G31“, karta „Farba 2. vrstvy“ je (7 kariet
//     ako 601), krok vzoru otvorený a Diamond označený, stránka ostáva, bez chýb JS.
// 12. zmena modelu myšou (Rad 3): prechod na Elite Diamond 601 (nie 598), prenos z DVOJ_ID na 601, na 601 BMW / Rad 3.
// 13. zmena značky myšou (Audi): prechod na 601.
// 14. dlaždica Hexa: prechod na Elite Hexa 604 s prenosom a autom BMW / Rad 5.
// 15. hlavná 601: výber BMW / Rad 5 nikam nepresmeruje, nápis stránky auta tam nie je.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const arg = (m, z) => { const i = process.argv.indexOf("--" + m); return i > -1 ? process.argv[i + 1] : z; };
const PW = arg("pw", pathToFileURL("C:/Users/M/Desktop/claud/perplexity-mcp/node_modules/playwright/index.mjs").href);
const DIST = arg("dist");
const SIRKY = String(arg("sirka", "390,1366")).split(",").map(Number);
const CHROME = arg("chromium", "C:/Users/M/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe");
if (!DIST) { console.error("chýba --dist"); process.exit(2); }
const { chromium } = await import(PW);

const SK = "https://www.luxurycardesign.sk";
const URL_613 = SK + "/luxusne-autokoberce-dragonskin-stripe-line/";
const URL_649 = SK + "/autokoberce-skoda-kodiaq-ii/";
const CESTA_598 = "/luxusne-autokoberce-dragonskin-diamond-line/";
const CESTA_610 = "/luxusne-autokoberce-dragonskin-hexa-line/";
const CESTA_601 = "/luxusne-autokoberce-dragonskin-elite-diamond-line/";
const CESTA_604 = "/luxusne-autokoberce-dragonskin-elite-hexa-line/";
const URL_601 = SK + CESTA_601;
const BUNDLY = { "luxuryCar.js": "application/javascript", "lcd-vclass.js": "application/javascript", "luxuryCar.css": "text/css" };

// dvojvrstvová stránka auta: riadok registra z produkty.js (zakomentovaný, kým nie je ID) pod skúšobným číslom
const DVOJ_ID = 99001;
const DVOJ_KLUC = "NOVE-bmw-5-g30";
const zdrojProdukty = readFileSync(fileURLToPath(new URL("../assets/js/components/konfigurator1v/produkty.js", import.meta.url)), "utf8");
const mDvoj = new RegExp('^\\s*(?:\\/\\/\\s*)?"?' + DVOJ_KLUC + '"?\\s*:\\s*(\\{.*\\}),?\\s*$', "m").exec(zdrojProdukty);
if (!mDvoj) { console.error("produkty.js: riadok " + DVOJ_KLUC + " nenájdený"); process.exit(2); }
const DVOJ_ZAZNAM = mDvoj[1];
const DVOJ = { url: SK + (/url:\s*"([^"]+)"/.exec(DVOJ_ZAZNAM) || [])[1], cesta: (/url:\s*"([^"]+)"/.exec(DVOJ_ZAZNAM) || [])[1],
  znacka: (/znacka:\s*"([^"]+)"/.exec(DVOJ_ZAZNAM) || [])[1], model: (/model:\s*"([^"]+)"/.exec(DVOJ_ZAZNAM) || [])[1], nazov: (/nazov:\s*"([^"]+)"/.exec(DVOJ_ZAZNAM) || [])[1] };
if (!/typ:\s*"dvoj"/.test(DVOJ_ZAZNAM) || !DVOJ.cesta || !DVOJ.model) { console.error("produkty.js: " + DVOJ_KLUC + " nie je dvojvrstvová stránka auta " + DVOJ_ZAZNAM); process.exit(2); }
let bundleDvoj = null;
function luxuryCarDvoj() {
  if (bundleDvoj) return bundleDvoj;
  const t = readFileSync(join(DIST, "luxuryCar.js"), "utf8");
  const r = /(var PRODUKTY_1V = \{\s*562035: \{)/;
  if (!r.test(t)) throw new Error("bundle: register PRODUKTY_1V 562035 nenájdený");
  bundleDvoj = t.replace(r, "$1\n      " + DVOJ_ID + ": " + DVOJ_ZAZNAM + ",");
  return bundleDvoj;
}

let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ✗ " + t); } };

let html613 = null;
async function podvrh649() {
  if (html613) return html613;
  const r = await fetch(URL_613 + "?t=" + Date.now(), { headers: { "user-agent": "Mozilla/5.0" } });
  const h = await r.text();
  html613 = h.replace(/("product":\s*\{\s*"id":\s*)613\b/, "$1649").replace(/(name="productId" value=")613"/, '$1649"');
  if (html613 === h) throw new Error("podvrh: product.id 613 sa v HTML nenašiel");
  return html613;
}

let html601 = null;
async function podvrhDvoj() {
  if (html601) return html601;
  const r = await fetch(URL_601 + "?t=" + Date.now(), { headers: { "user-agent": "Mozilla/5.0" } });
  const h = await r.text();
  html601 = h.replace(/("product":\s*\{\s*"id":\s*)601\b/, "$1" + DVOJ_ID).replace(/(name="productId" value=")601"/, "$1" + DVOJ_ID + '"');
  if (html601 === h) throw new Error("podvrh: product.id 601 sa v HTML nenašiel");
  return html601;
}

async function kontext(b, sirka, ulozene, dvoj) {
  const mobil = sirka < 768;
  const ctx = await b.newContext({ viewport: { width: sirka, height: mobil ? 844 : 900 }, isMobile: mobil, hasTouch: mobil });
  await ctx.route(/\/action\//, (r) => (r.request().method() === "POST" ? r.abort() : r.continue()));
  await ctx.route(/\/assets\/(v\/[^/]+\/)?(js\/(luxuryCar|lcd-vclass)\.js|css\/luxuryCar\.css)/, (r) => {
    const f = r.request().url().match(/(luxuryCar\.js|lcd-vclass\.js|luxuryCar\.css)/)[0];
    r.fulfill({ status: 200, contentType: BUNDLY[f], body: dvoj && f === "luxuryCar.js" ? luxuryCarDvoj() : readFileSync(join(DIST, f)) });
  });
  await ctx.route((u) => u.href.startsWith(URL_649), async (r) => {
    if (r.request().resourceType() !== "document") return r.continue();
    r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: await podvrh649() });
  });
  if (dvoj) await ctx.route((u) => u.href.startsWith(DVOJ.url), async (r) => {
    if (r.request().resourceType() !== "document") return r.continue();
    r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: await podvrhDvoj() });
  });
  if (ulozene) await ctx.addInitScript((u) => { if (!sessionStorage.getItem("__init")) { Object.keys(u).forEach((k) => sessionStorage.setItem(k, u[k])); sessionStorage.setItem("__init", "1"); } }, ulozene);
  return ctx;
}
const stav = (p) => p.evaluate(() => {
  const sel = (k) => document.querySelector(".modl-selector-wrap .surcharge-list." + k + " select");
  const t = (x) => (x ? ((x.options[x.selectedIndex] || {}).text || "").trim() : null);
  const box = document.querySelector(".lcd1v-auto-pevne");
  return { cesta: location.pathname, znacka: t(sel("brands")), model: t(sel("models")), rok: t(sel("years")), typ: t(document.querySelector(".modl-selector-wrap .surcharge-list.type-selector select")),
    nadpis: box ? box.innerText.replace(/\s+/g, " ").trim() : null, viditelny: !!box && box.getClientRects().length > 0,
    brand: sessionStorage.getItem("Brand"), model2: sessionStorage.getItem("Model"), prenos: sessionStorage.getItem("lcd1vPrenos:v1"),
    farba: (function () { const x = document.querySelector(".content-wrap .parameter-wrap .options-wrap > .option-button.active[data-variant]"); return x ? (x.getAttribute("data-lcd1v-nazov") || x.textContent.replace(/\s+/g, " ").trim()) : ""; })(),
    vzorOtvoreny: !!document.querySelector(".lcd1v-k-vzor.active"), autoOtvorene: !!document.querySelector(".lcd1v-k-auto.active") };
});
async function otvor(p, url) {
  await p.goto(url + "?t=" + Date.now(), { waitUntil: "load", timeout: 60000 });
  await p.waitForFunction(() => !!document.querySelector(".modl-selector-wrap .surcharge-list.models select"), null, { timeout: 30000 });
  await p.waitForTimeout(2500);
}
/** Zmena selectu „myšou“ (change bez klávesu) cez jQuery ako živý kód. */
const zmen = (p, k, text) => p.evaluate(([k, text]) => {
  const x = document.querySelector(".modl-selector-wrap .surcharge-list." + k + " select");
  const o = [...x.options].find((o) => o.text.trim() === text);
  if (!o) return false;
  o.selected = true; window.jQuery(x).trigger("change"); return true;
}, [k, text]);
const j = (o) => JSON.stringify(o);
/** Farba 1. vrstvy klikom na dlaždicu (programový klik = bez presmerovania na auto). */
const farba = (p, nazov) => p.evaluate((n) => {
  const b = [...document.querySelectorAll(".content-wrap .parameter-wrap .options-wrap > .option-button[data-variant]")].find((x) => (x.getAttribute("data-lcd1v-nazov") || x.textContent.replace(/\s+/g, " ").trim()).startsWith(n));
  if (!b) return false; b.click(); return true;
}, nazov);
const prenos = (s) => { try { return JSON.parse(s.prenos || "null"); } catch (e) { return null; } };

const b = await chromium.launch({ executablePath: CHROME });
for (const sirka of SIRKY) {
  console.log("== " + sirka);
  // 1
  { const c = await kontext(b, sirka); const p = await c.newPage(); const err = []; p.on("pageerror", (e) => err.push(e.message));
    await otvor(p, URL_649); const s = await stav(p);
    over(s.znacka === "Skoda" && s.model === "Kodiaq II", "1: predvyplnené Skoda / Kodiaq II " + j(s));
    over(s.brand === "Skoda" && s.model2 === "Kodiaq II", "1: auto uložené v sessionStorage " + j(s));
    over(s.nadpis && /Predvyplnené pre Škoda Kodiaq II/.test(s.nadpis) && /iné auto/i.test(s.nadpis), "1: nápis pod výberom auta " + j(s.nadpis));
    over(s.cesta === "/autokoberce-skoda-kodiaq-ii/", "1: stránka ostáva " + s.cesta);
    over(!err.length, "1: bez chýb JS " + err.join(" | "));
    await c.close(); }
  // 2
  { const c = await kontext(b, sirka, { Brand: "BMW", Model: "Rad 3", Year: "2003", model: "BMW Rad 3 2003 Sedan" }); const p = await c.newPage();
    await otvor(p, URL_649); const s = await stav(p);
    over(s.znacka === "Skoda" && s.model === "Kodiaq II", "2: uložené BMW prepísané na Skoda / Kodiaq II " + j(s));
    over(!/^\d{4}$/.test(String(s.rok)), "2: rok BMW vynulovaný " + j(s.rok));
    over(s.cesta === "/autokoberce-skoda-kodiaq-ii/", "2: stránka ostáva " + s.cesta);
    // 3 typ karosérie
    const typy = await p.evaluate(() => [...document.querySelectorAll(".modl-selector-wrap .surcharge-list.type-selector select option:not(.notselect)")].map((o) => o.text.trim()).slice(0, 3));
    if (typy[0]) { await p.evaluate((t) => { const x = document.querySelector(".modl-selector-wrap .surcharge-list.type-selector select"); [...x.options].find((o) => o.text.trim() === t).selected = true; window.jQuery(x).trigger("change"); }, typy[0]); await p.waitForTimeout(1500); }
    over((await stav(p)).cesta === "/autokoberce-skoda-kodiaq-ii/", "3: zmena typu karosérie nepresúva (" + typy[0] + ")");
    await c.close(); }
  // 4 model
  { const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_649);
    over(await farba(p, "Béžová"), "4: farba Béžová na 649"); await p.waitForTimeout(600);
    const t0 = Date.now(); over(await zmen(p, "models", "Kodiaq"), "4: model Kodiaq je v zozname");
    await p.waitForURL((u) => u.pathname === CESTA_598, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(4500); const s = await stav(p);
    over(s.cesta === CESTA_598, "4: zmena modelu -> Diamond 598 (" + (Date.now() - t0) + " ms) " + s.cesta);
    over(s.znacka === "Skoda" && s.model === "Kodiaq", "4: na 598 auto Skoda / Kodiaq " + j(s));
    const pr = prenos(s);
    over(pr && pr.z === 649 && pr.na === 598 && /B[eé]žov/i.test((pr.vyber && pr.vyber.farbaNazov) || ""), "4: prenos výberu z 649 na 598 s názvom farby " + s.prenos);
    over(/^Béžová/.test(s.farba), "4: na 598 farba Béžová (podľa názvu) " + j(s.farba));
    await c.close(); }
  // 5 značka
  { const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_649);
    over(await zmen(p, "brands", "BMW"), "5: BMW je v zozname značiek");
    await p.waitForURL((u) => u.pathname === CESTA_598, { timeout: 8000 }).catch(() => {});
    over((await stav(p)).cesta === CESTA_598, "5: zmena značky -> 598");
    await c.close(); }
  // 6 klávesnica
  if (sirka >= 768) {
    const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_649);
    await p.evaluate(() => { const x = document.querySelector(".modl-selector-wrap .surcharge-list.brands select"); x.closest(".lcd1v-krok") && x.closest(".lcd1v-krok").classList.add("active"); });
    await p.focus(".modl-selector-wrap .surcharge-list.brands select");
    await p.evaluate(() => { const x = document.querySelector(".modl-selector-wrap .surcharge-list.brands select"); x.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); const o = [...x.options].find((o) => o.text.trim() === "BMW"); o.selected = true; window.jQuery(x).trigger("change"); });
    await p.waitForTimeout(2000);
    over((await stav(p)).cesta === "/autokoberce-skoda-kodiaq-ii/", "6: zmena z klávesnice, fokus v poli -> ostáva");
    await p.evaluate(() => { const b = document.createElement("button"); b.id = "test-von"; document.body.appendChild(b); b.focus(); });
    await p.waitForURL((u) => u.pathname === CESTA_598, { timeout: 8000 }).catch(() => {});
    over((await stav(p)).cesta === CESTA_598, "6: odchod z polí auta -> 598");
    await c.close();
  }
  // 7 hlavná 613 nepresmeruje
  { const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_613);
    await zmen(p, "brands", "Skoda"); await p.waitForTimeout(300); await zmen(p, "models", "Kodiaq II"); await p.waitForTimeout(2500);
    const s = await stav(p);
    over(s.cesta === "/luxusne-autokoberce-dragonskin-stripe-line/" && s.model === "Kodiaq II", "7: 613 s Kodiaq II ostáva " + j(s));
    over(!s.nadpis, "7: na 613 nápis stránky auta nie je");
    over(!s.vzorOtvoreny, "7: na 613 krok vzoru pri načítaní zatvorený " + j(s));
    await c.close(); }
  // 8 vzor otvorený
  { const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_649); await p.waitForTimeout(1500);
    const s = await stav(p);
    over(s.vzorOtvoreny && !s.autoOtvorene, "8: na 649 krok vzoru otvorený, auto zatvorené " + j({ v: s.vzorOtvoreny, a: s.autoOtvorene }));
    over(await p.evaluate(() => !!document.querySelector(".lcd1v-k-vzor .patterns-wrap > .option-button.active.lcd1v-vzor-stripe")), "8: Stripe označený");
    await c.close(); }
  // 9 dlaždica Hexa
  { const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_649); await p.waitForTimeout(1000);
    await p.click(".lcd1v-k-vzor .patterns-wrap > .option-button.lcd1v-vzor-hexa");
    await p.waitForURL((u) => u.pathname === CESTA_610, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(3000); const s = await stav(p); const pr = prenos(s);
    over(s.cesta === CESTA_610, "9: dlaždica Hexa -> 610 " + s.cesta);
    over(pr && pr.z === 649 && pr.na === 610, "9: prenos z 649 na 610 " + s.prenos);
    over(s.znacka === "Skoda" && s.model === "Kodiaq II", "9: na 610 auto Skoda / Kodiaq II " + j(s));
    await c.close(); }
  // 10 druhá vrstva -> Elite Diamond
  { const c = await kontext(b, sirka); const p = await c.newPage(); await otvor(p, URL_649);
    over(await farba(p, "Béžová"), "10: farba Béžová");
    await p.waitForFunction(() => !!document.querySelector(".lcd1v-druha__dlazdica"), null, { timeout: 8000 }).catch(() => {});
    const ma = await p.evaluate(() => { const d = document.querySelector(".lcd1v-druha__dlazdica"); if (!d) return false; d.click(); return true; });
    over(ma, "10: karta druhej vrstvy");
    await p.waitForURL((u) => u.pathname === CESTA_601, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(4500); const s = await stav(p); const pr = prenos(s);
    over(s.cesta === CESTA_601, "10: druhá vrstva -> Elite Diamond 601 " + s.cesta);
    over(pr && pr.z === 649 && pr.na === 601, "10: prenos z 649 na 601 " + s.prenos);
    over(/^Béžová/.test(s.farba), "10: na 601 farba Béžová " + j(s.farba));
    await c.close(); }
  // 11 dvojvrstvová stránka auta: načítanie
  { const c = await kontext(b, sirka, null, true); const p = await c.newPage(); const err = []; p.on("pageerror", (e) => err.push(e.message));
    await otvor(p, DVOJ.url); await p.waitForTimeout(1500); const s = await stav(p);
    over(s.znacka === DVOJ.znacka && s.model === DVOJ.model, "11: predvyplnené " + DVOJ.znacka + " / " + DVOJ.model + " " + j(s));
    over(s.brand === DVOJ.znacka && s.model2 === DVOJ.model, "11: auto uložené v sessionStorage " + j(s));
    over(s.nadpis && s.nadpis.indexOf("Predvyplnené pre " + DVOJ.nazov) > -1, "11: nápis pod výberom auta " + j(s.nadpis));
    over(s.cesta === DVOJ.cesta, "11: stránka ostáva " + s.cesta);
    const karty = await p.evaluate(() => ({ farba2: !!document.querySelector(".lcd1v-k-farba2"), pocet: document.querySelectorAll(".lcd1v-krok").length,
      diamond: !!document.querySelector(".lcd1v-k-vzor .patterns-wrap > .option-button.active.lcd1v-vzor-diamond") }));
    over(karty.farba2 && karty.pocet === 7, "11: dvojvrstvový konfigurátor (karta Farba 2. vrstvy, 7 kariet) " + j(karty));
    over(s.vzorOtvoreny && !s.autoOtvorene && karty.diamond, "11: krok vzoru otvorený, Diamond označený " + j({ v: s.vzorOtvoreny, a: s.autoOtvorene, d: karty.diamond }));
    over(!err.length, "11: bez chýb JS " + err.join(" | "));
    await c.close(); }
  // 12 dvoj: zmena modelu -> 601
  { const c = await kontext(b, sirka, null, true); const p = await c.newPage(); await otvor(p, DVOJ.url);
    over(await zmen(p, "models", "Rad 3"), "12: model Rad 3 je v zozname");
    await p.waitForURL((u) => u.pathname === CESTA_601, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(3500); const s = await stav(p); const pr = prenos(s);
    over(s.cesta === CESTA_601, "12: zmena modelu -> Elite Diamond 601 (nie 598) " + s.cesta);
    over(pr && pr.z === DVOJ_ID && pr.na === 601, "12: prenos z " + DVOJ_ID + " na 601 " + s.prenos);
    over(s.znacka === "BMW" && s.model === "Rad 3", "12: na 601 auto BMW / Rad 3 " + j(s));
    await c.close(); }
  // 13 dvoj: zmena značky -> 601
  { const c = await kontext(b, sirka, null, true); const p = await c.newPage(); await otvor(p, DVOJ.url);
    over(await zmen(p, "brands", "Audi"), "13: Audi je v zozname značiek");
    await p.waitForURL((u) => u.pathname === CESTA_601, { timeout: 8000 }).catch(() => {});
    over((await stav(p)).cesta === CESTA_601, "13: zmena značky -> 601");
    await c.close(); }
  // 14 dvoj: dlaždica Hexa -> 604
  { const c = await kontext(b, sirka, null, true); const p = await c.newPage(); await otvor(p, DVOJ.url); await p.waitForTimeout(1000);
    await p.click(".lcd1v-k-vzor .patterns-wrap > .option-button.lcd1v-vzor-hexa");
    await p.waitForURL((u) => u.pathname === CESTA_604, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(3000); const s = await stav(p); const pr = prenos(s);
    over(s.cesta === CESTA_604, "14: dlaždica Hexa -> Elite Hexa 604 " + s.cesta);
    over(pr && pr.z === DVOJ_ID && pr.na === 604, "14: prenos z " + DVOJ_ID + " na 604 " + s.prenos);
    over(s.znacka === DVOJ.znacka && s.model === DVOJ.model, "14: na 604 auto " + DVOJ.znacka + " / " + DVOJ.model + " " + j(s));
    await c.close(); }
  // 15 hlavná 601 so skúšobným registrom: auto stránky nikam nepresmeruje
  { const c = await kontext(b, sirka, null, true); const p = await c.newPage(); await otvor(p, URL_601);
    await zmen(p, "brands", DVOJ.znacka); await p.waitForTimeout(300); await zmen(p, "models", DVOJ.model); await p.waitForTimeout(2500);
    const s = await stav(p);
    over(s.cesta === CESTA_601 && s.model === DVOJ.model, "15: 601 s " + DVOJ.model + " ostáva " + j(s));
    over(!s.nadpis, "15: na 601 nápis stránky auta nie je");
    await c.close(); }
}
await b.close();
console.log("OK " + ok + ", zle " + zle);
process.exit(zle ? 1 : 0);
