// Snímky krokov 5 (nášivky) a 6 (tapacír dverí) kamiónov 640 v novom vzhľade (?novy=1) pre ľudskú kontrolu — návrh C
// (Michal 18. 10. 2026). Živá stránka s LOKÁLNYM buildom (esbuild assets/js/main.js + vloz-lcd-css.py --vystup, ako
// tools/test-konfigurator-1v.mjs): bundle, CSS a assets/img/1v/* sa podvrhnú z repa. Nič neodosiela: do košíka sa
// neklikne a každý POST na /action/ (okrem odmietnutia cookies) sa zruší; merače sú zablokované.
//   node tools/snimky-kamion-kroky.mjs <priečinok> [--sirka 390,1280] [--predpona c-]
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv.slice(2);
const kam = arg[0];
if (!kam) throw new Error("použitie: node tools/snimky-kamion-kroky.mjs <priečinok> [--sirka 390,1280] [--predpona c-]");
const hodnota = (meno, pred) => { const i = arg.indexOf(meno); return i > -1 ? arg[i + 1] : pred; };
const sirky = hodnota("--sirka", "390,1280").split(",").map(Number);
const PRED = hodnota("--predpona", "c-");
mkdirSync(kam, { recursive: true });
const URL_640 = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/?novy=1";
const MERACE = ["*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*", "*google.com/pagead*",
  "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*", "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*"];
const TYP = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };

// ------------------------------------------------------------------ lokálny build (rovnaké prepínače ako production.yml)
const tmp = mkdtempSync(join(tmpdir(), "lcd-kamion-snimky-"));
const spusti = (cmd, args, popis) => {
  const r = spawnSync(cmd, args, { cwd: KOREN, encoding: "utf8" });
  if (r.status !== 0) throw new Error(popis + " zlyhal: " + (r.stderr || r.stdout || r.error));
};
spusti(process.execPath, [join(KOREN, "node_modules/esbuild/bin/esbuild"), "assets/js/main.js", "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"),
  "--format=iife", "--loader:.jsx=jsx", "--minify", "--drop:console", "--legal-comments=none", "--log-level=warning"], "esbuild");
spusti("python", ["tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], "vloz-lcd-css.py --vystup");
const JS = readFileSync(join(tmp, "luxuryCar.js")), CSS = readFileSync(join(tmp, "luxuryCar.css"));
console.log("lokálny build: " + (JS.length / 1024).toFixed(0) + " kB JS, " + (CSS.length / 1024).toFixed(0) + " kB CSS");

async function pripravKartu(ch, sirka) {
  const k = await ch.novaKarta({ sirka, vyska: sirka < 768 ? 844 : 900 });
  const zrusene = [];
  await k.posli("Network.setBlockedURLs", { urls: MERACE });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  const odpovedz = (p, body, typ) => k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, body: body.toString("base64"),
    responseHeaders: [{ name: "Content-Type", value: typ }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }] });
  k.na("Fetch.requestPaused", async (p) => {
    const u = p.request.url;
    try {
      if (/\/action\//i.test(u) && p.request.method !== "GET" && !/\/action\/CustomerCookieConsent\//i.test(u)) {
        zrusene.push(p.request.method + " " + u); // košík ani nič iné sa neodošle
        return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
      }
      if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) return await odpovedz(p, JS, "application/javascript; charset=utf-8");
      if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) return await odpovedz(p, CSS, "text/css; charset=utf-8");
      const m = /\/eshopy\/luxuryCar\/assets\/img\/1v\/([^?#]+)/.exec(u);
      const subor = m && join(KOREN, "assets/img/1v", decodeURIComponent(m[1]));
      if (subor && existsSync(subor)) return await odpovedz(p, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch (e) { /* karta sa zatvára */ }
  });
  await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" }, { urlPattern: "*/action/*", requestStage: "Request" }] });
  return { k, zrusene };
}

/** Klik v koreni (ako zákazník; selektor v #lcd1v-kamion), voľba v selecte, „Pokračujte“. */
async function klik(k, sel) {
  const r = await k.ev(`(function () { var e = document.querySelector("#lcd1v-kamion " + ${JSON.stringify(sel)}); if (!e) return "neexistuje " + ${JSON.stringify(sel)}; e.click(); return ""; })()`);
  if (r) throw new Error(r);
  await pauza(250);
}
async function vyber(k, pole, v) {
  const r = await k.ev(`(function () { var s = document.querySelector('#lcd1v-kamion select[data-p="${pole}"]'); if (!s) return "pole " + ${JSON.stringify(pole)}; s.value = ${JSON.stringify(v)}; s.dispatchEvent(new Event("change", { bubbles: true })); return s.value === ${JSON.stringify(v)} ? "" : "hodnota " + ${JSON.stringify(v)}; })()`);
  if (r) throw new Error(r);
  await pauza(250);
}
const a = (akcia, v, m) => '[data-a="' + akcia + '"]' + (m ? '[data-m="' + m + '"]' : "") + (v != null ? '[data-v="' + v + '"]' : "");
const dalej = (k, id) => klik(k, '[data-a="dalej"][data-v="' + id + '"]');

/** Snímka prvku celého (aj pod okrajom okna): najprv ním prejde (lenivé fotky), počká na fotky a plátna, bez fokusu. */
async function snimkaPrvku(k, sel, subor) {
  const vys = await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); return e ? e.getBoundingClientRect().height : 0; })()`);
  if (!vys) throw new Error("prvok chýba: " + sel);
  for (let y = 0; y < vys; y += 600) {
    await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 20 + ${y}); })()`);
    await pauza(250);
  }
  for (let i = 0; i < 30; i++) {
    const ok = await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)});
      return Array.prototype.every.call(e.querySelectorAll("img"), function (i) { return i.complete && i.naturalWidth > 0; }); })()`);
    if (ok) break;
    await pauza(300);
  }
  await pauza(600); // plátna náhľadu sa dokreslia
  // plávajúce prvky mimo konfigurátora (okno a bublina Luxie, lišta, lepivá hlavička) by na snímke prekrývali obsah
  await k.ev(`(function () { if (!document.getElementById("snimky-skry")) { var st = document.createElement("style"); st.id = "snimky-skry";
    st.textContent = "body iframe, #lcd1v-lista { visibility: hidden !important; }"; document.head.appendChild(st); } })()`); // okno Luxie = iframe
  await k.ev(`Array.prototype.forEach.call(document.querySelectorAll("body *"), function (e) {
    if (e.closest("#lcd1v-kamion") || e.querySelector("#lcd1v-kamion")) return;
    var p = getComputedStyle(e).position; if (p === "fixed" || p === "sticky") e.style.setProperty("display", "none", "important"); })`);
  const r = await k.ev(`(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    var e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: "start", behavior: "instant" }); var b = e.getBoundingClientRect();
    return { x: Math.max(0, b.left - 12), y: b.top + scrollY - 12, w: Math.min(innerWidth, b.width + 24), h: b.height + 24 }; })()`);
  const s = await k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: Math.min(r.h, 15000), scale: 1 } });
  writeFileSync(join(kam, subor), Buffer.from(s.data, "base64"));
  console.log("  " + subor + "  " + Math.round(r.w) + " × " + Math.round(r.h));
}

const ch = await spustiChrome();
try {
  for (const sirka of sirky) {
    const { k, zrusene } = await pripravKartu(ch, sirka);
    await k.chod(URL_640);
    for (let i = 0; i < 30; i++) { // cookie lišta: Odmietnuť (len nevyhnutné)
      const r = await k.ev(`(function () { var b = Array.prototype.find.call(document.querySelectorAll("button, a"), function (e) { return e.offsetParent && /^\\s*Odmietnu/i.test(e.textContent || ""); });
        if (b) { b.click(); return "ok"; } return document.querySelector(".siteCookies") && document.querySelector(".siteCookies").offsetHeight ? "" : "bez"; })()`).catch(() => "");
      if (r) break;
      await pauza(250);
    }
    for (let i = 0; i < 40 && !(await k.ev(`!!document.querySelector("#lcd1v-kamion .k-krok")`)); i++) await pauza(500);
    await vyber(k, "znacka", "DAF (TIR)");
    await vyber(k, "model", "XF106 2017-2021");
    await dalej(k, "vozidlo");
    await klik(k, a("mat", "Prémiová syntetická koža – prešívaná")); await dalej(k, "material");
    await klik(k, a("farba", "10")); await dalej(k, "farba");
    await klik(k, a("lem", "08")); await dalej(k, "lemovanie");
    const K5 = '#lcd1v-kamion [data-krok="nasivky"]', K6 = '#lcd1v-kamion [data-krok="tapacir"]';
    await snimkaPrvku(k, K5, `${PRED}krok5-1-vyber-${sirka}.png`);
    await klik(k, a("nas", "boky+stred"));
    await klik(k, a("motiv", "H21", "boky"));
    await klik(k, a("viac", null, "boky"));
    await klik(k, a("nit", "2824", "boky"));
    await snimkaPrvku(k, K5, `${PRED}krok5-2-vsetky-tri-${sirka}.png`);
    await klik(k, a("nas", "stred")); // odškrtne stredový koberec -> len pred sedadlá (Vaša voľba s tipom na balík)
    await snimkaPrvku(k, '#lcd1v-kamion [data-krok="nasivky"] [data-pole="nas"]', `${PRED}krok5-3-pred-sedadla-${sirka}.png`);
    await klik(k, a("nas", "stred"));
    await klik(k, a("stredRovnaky", "0"));
    await snimkaPrvku(k, '#lcd1v-kamion [data-krok="nasivky"] .tp-oddiel:last-of-type', `${PRED}krok5-4-stred-inak-${sirka}.png`);
    await klik(k, a("stredRovnaky", "1"));
    await dalej(k, "nasivky");
    await snimkaPrvku(k, K6, `${PRED}krok6-1-ponuka-${sirka}.png`);
    await klik(k, a("tap", "ano"));
    await klik(k, a("tapNas", "ano"));
    await snimkaPrvku(k, K6, `${PRED}krok6-2-ano-${sirka}.png`);
    await klik(k, a("tapZmenit"));
    await snimkaPrvku(k, K6, `${PRED}krok6-3-vybrat-inak-${sirka}.png`);
    await klik(k, a("tapRovnake"));
    await klik(k, a("tapNasRovnaka", "0"));
    await klik(k, a("motiv", "H19", "dvere"));
    await klik(k, a("nit", "3546", "dvere"));
    await snimkaPrvku(k, '#lcd1v-kamion [data-krok="tapacir"] .tp-oddiel:last-of-type', `${PRED}krok6-4-nasivka-ina-${sirka}.png`);
    const info = await k.ev(`(function () { var k = window.__lcd1vKamion; return { nas: k && k.ui.S.nas, tap: k && k.ui.S.tap, spolu: k && k.ui.cena().spolu, pretek: document.documentElement.scrollWidth > innerWidth + 1 }; })()`);
    console.log(sirka + " px: " + JSON.stringify(info) + (zrusene.length ? " · zrušené POST: " + zrusene.length : "") + (k.chyby.length ? " · chyby: " + JSON.stringify(k.chyby.slice(0, 3)) : ""));
    await k.zavri();
  }
} finally {
  await ch.zavri();
}
