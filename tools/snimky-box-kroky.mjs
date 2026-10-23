// Snímky jednej karty „Vaše boxy do kufra“ boxu 616 v novom vzhľade (?novy=1, Michal 23. 10. 2026) pre ľudskú kontrolu,
// naživo (to, čo je v SK admine), pri 390 a 1280 px, 4 stavy:
//   1 štart (1 box, nič nevybrané)
//   2 farba + 2 boxy + len S a klik na košík (červený rám, veta pri 2. boxe) — POST košíka je ZABLOKOVANÝ (nič sa neobjedná)
//   3 úplný výber 3 boxy S + S + XL
//   4 1 box M a „Pokračujte k súhrnu“ -> otvorená ponuka setu pod kartou
// Pri každom stave vypíše, či stránka vodorovne preteká (scrollWidth > innerWidth).
// Pred nasadením (lokálny build) rovnaké snímky robí test: node tools/test-konfigurator-1v.mjs --novy --produkt 616
//   --krok box-start,box-2-neuplne,box-jedna-karta,box-komplet-ano --snimky <priečinok> (616-karta-*.png).
//   node tools/snimky-box-kroky.mjs <priečinok> [--sirka 390,1280]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";

const arg = process.argv.slice(2);
const kam = arg[0];
if (!kam) throw new Error("použitie: node tools/snimky-box-kroky.mjs <priečinok> [--sirka 390,1280]");
const iS = arg.indexOf("--sirka");
const sirky = (iS > -1 ? arg[iS + 1] : "390,1280").split(",").map(Number);
mkdirSync(kam, { recursive: true });
const URL_BOX = "https://www.luxurycardesign.sk/luxusny-boxi-do-kufra/?novy=1";
const F = "#product-detail-form";
const K = F + " .lcd1v-krok.lcd1v-k-farba";
// cookie lišta a chat (bublina aj okno Luxie) len pre snímku
const SKRY = `(function () { var s = document.createElement("style"); s.textContent = "body > [class*='cookie'],body > [id*='cookie'],body > [class*='luxia'],body > [id*='luxia'],body > [class*='Luxia'],iframe[src*='luxia'],iframe[src*='rostiapp']{display:none!important}"; document.head.appendChild(s);
  setInterval(function () { Array.prototype.forEach.call(document.querySelectorAll("body *"), function (e) { if (!e.closest("#product-detail-form") && /Začať konverzáciu|Sme práve online/.test(e.textContent || "") && getComputedStyle(e).position === "fixed") e.style.display = "none"; }); }, 500); })()`;

const klik = (k, sel, i = 0) => k.ev(`(function () { var e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (e) e.click(); return !!e; })()`);
async function cakaj(k, expr, ms = 15000) {
  for (let i = 0; i < ms / 250; i++) { if (await k.ev(expr)) return true; await pauza(250); }
  return false;
}
/** Hodnota veľkosti boxu i (1–3) podľa písmena zo živého selectu (bez ID natvrdo). */
const velkost = (k, i, v) => k.ev(`(function () {
  var s = Array.prototype.find.call(document.querySelectorAll("${F} select[data-parameter-name]"), function (x) { return new RegExp("\\\\b${i}\\\\.\\\\s*box", "i").test(x.getAttribute("data-parameter-name")); });
  var o = s && Array.prototype.find.call(s.options, function (o) { return new RegExp("^${v}\\\\s*:", "i").test(o.text.trim()); });
  return o ? o.value : null;
})()`);
async function vyberVelkost(k, i, v) {
  const val = await velkost(k, i, v);
  await klik(k, `${K} .lcd1v-bxp-vgrp[data-box="${i}"] .lcd1v-bxp-vk[data-hodnota="${val}"]`);
  await pauza(500);
}
/** Snímka výrezu: od zbalenej/otvorenej karty boxov po spodok `doSel` (predvolene karta boxov), aj mimo okna. */
async function snimka(k, meno, sirka, doSel = K) {
  const r = await k.ev(`(function () {
    var a = document.querySelector(${JSON.stringify(K)}), b = document.querySelector(${JSON.stringify(doSel)});
    if (!a || !b) return null;
    var y0 = a.getBoundingClientRect().top + scrollY - 40, y1 = b.getBoundingClientRect().bottom + scrollY + 40;
    return { y: Math.max(0, Math.round(y0)), h: Math.round(y1 - y0), pretek: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0 };
  })()`);
  if (!r) { console.log(sirka, meno, "karta nenájdená"); return; }
  await pauza(600);
  const o = await k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: r.y, width: sirka, height: Math.min(r.h, 6000), scale: 1 } });
  const cesta = join(kam, `karta-${meno}-${sirka}.png`);
  writeFileSync(cesta, Buffer.from(o.data, "base64"));
  console.log(sirka, meno, r.pretek ? "PRETEKÁ do " + r.pretek + " px" : "bez pretekania", cesta);
}

const ch = await spustiChrome();
try {
  for (const sirka of sirky) {
    const k = await ch.novaKarta({ sirka, vyska: sirka < 768 ? 844 : 900 });
    // košík zablokovaný: neúplný výber zastaví nový vzhľad, ale ani chyba nesmie nič vložiť do košíka
    await k.posli("Network.setBlockedURLs", { urls: ["*/action/Cart/*"] });
    await k.chod(URL_BOX);
    await k.ev(SKRY);
    if (!(await cakaj(k, `document.body.classList.contains("lcd-1v") && !!document.querySelector("${F} .lcd1v-bxp-ks")`, 20000))) throw new Error("nový vzhľad boxu sa nepostavil (" + sirka + ")");
    await pauza(2500);
    // 1 štart
    await snimka(k, "1-start", sirka);
    // 2 farba + 2 boxy + len S + košík -> červený rám
    await klik(k, `${K} > .options-wrap > .option-button`, 2);
    await pauza(800);
    await klik(k, `${K} .lcd1v-bxp-ks[data-ks="2"]`);
    await pauza(800);
    await vyberVelkost(k, 1, "S");
    await klik(k, `${F} .add-to-cart button.add-to-cart-button`);
    await cakaj(k, `document.querySelector(${JSON.stringify(K)}).getAttribute("data-lcd1v-chyba-cast") === "velkost"`, 5000);
    await pauza(1200);
    await snimka(k, "2-dva-boxy-neuplne", sirka);
    // 3 úplný výber 3 boxy S + S + XL
    await klik(k, `${K} .lcd1v-bxp-ks[data-ks="3"]`);
    await pauza(800);
    await vyberVelkost(k, 1, "S");
    await vyberVelkost(k, 2, "S");
    await vyberVelkost(k, 3, "XL");
    await pauza(800);
    await snimka(k, "3-tri-boxy", sirka);
    // 4 1 box M + „Pokračujte k súhrnu“ -> ponuka setu otvorená
    await klik(k, `${K} .lcd1v-bxp-ks[data-ks="1"]`);
    await pauza(800);
    await vyberVelkost(k, 1, "M");
    await cakaj(k, `(function () { var c = document.querySelector("${F} .lcd1v-komplet"); return !!(c && !c.hidden); })()`, 20000);
    await klik(k, `${K} > .next-step-button`);
    const otv = await cakaj(k, `!!document.querySelector("${F} .lcd1v-komplet.active")`, 8000);
    await pauza(1500);
    await snimka(k, "4-ponuka-setu", sirka, otv ? `${F} .lcd1v-komplet` : K);
    if (!otv) console.log(sirka, "ponuka setu sa po „Pokračujte k súhrnu“ neotvorila");
    await k.zavri();
  }
} finally {
  await ch.zavri();
}
