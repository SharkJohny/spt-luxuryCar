// Náhľad skrytého konfigurátora kamiónov s logami značiek (kniha Brain napady/2026-11-11-kamiony-vsetky-ulohy.md §2.1) pre
// Michala: krok 5 „Nášivky“ s mriežkou všetkých motívov (logá DAF, Ford, Iveco, MAN, Mercedes, Renault, Scania, Volvo +
// Kamión a Trucker). Živá stránka 640 s LOKÁLNYM buildom (ako tools/snimky-kamion-kroky.mjs): pred štartom nášho kódu sa do
// troch selectov druhu nášivky doplnia možnosti „Nášivka H1 … N33“ (napodobní kópiu, v ktorej sú v admine zapnuté logá).
// Nič neodosiela: do košíka sa neklikne a každý POST na /action/ (okrem odmietnutia cookies) sa zruší; merače sú zablokované.
// Pri každej snímke overí, že názov motívu má najviac 2 riadky a v rade sú najviac 4 dlaždice.
//   node tools/snimky-kamion-loga.mjs [priečinok = C:/Users/M/Desktop/kamiony/plan-2026-11-11/a2] [--sirka 390,1280]
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv.slice(2);
const kam = arg[0] && !arg[0].startsWith("--") ? arg[0] : "C:/Users/M/Desktop/kamiony/plan-2026-11-11/a2";
const hodnota = (meno, pred) => { const i = arg.indexOf(meno); return i > -1 ? arg[i + 1] : pred; };
const sirky = hodnota("--sirka", "390,1280").split(",").map(Number);
mkdirSync(kam, { recursive: true });
const URL_640 = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/";
const MERACE = ["*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*", "*google.com/pagead*",
  "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*", "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*"];
const TYP = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
/** Kódy log značiek, ktoré má Shoptet pri 640 ako (vypnuté) hodnoty druhu nášivky (MCP product_detail 640, 11. 11. 2026). */
const LOGA = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12", "H15", "H16", "H17", "H18", "H23", "H24", "H25", "H26", "N1", "N2", "N33"];

// ------------------------------------------------------------------ lokálny build (rovnaké prepínače ako production.yml)
const tmp = mkdtempSync(join(tmpdir(), "lcd-kamion-loga-"));
const spusti = (cmd, args, popis) => {
  const r = spawnSync(cmd, args, { cwd: KOREN, encoding: "utf8" });
  if (r.status !== 0) throw new Error(popis + " zlyhal: " + (r.stderr || r.stdout || r.error));
};
spusti(process.execPath, [join(KOREN, "node_modules/esbuild/bin/esbuild"), "assets/js/main.js", "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"),
  "--format=iife", "--loader:.jsx=jsx", "--minify", "--drop:console", "--legal-comments=none", "--log-level=warning"], "esbuild");
spusti("python", ["tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], "vloz-lcd-css.py --vystup");
// predohra pred bundlom: skript je na konci <body>, selecty už existujú — doplní logá ako zapnuté hodnoty kópie
const PREDOHRA = "(function(){var L=" + JSON.stringify(LOGA) + ",n=990000;" +
  "Array.prototype.forEach.call(document.querySelectorAll('select[data-parameter-name]'),function(s){" +
  "var m=(s.getAttribute('data-parameter-name')||'').toLowerCase();if(!/^typ n[aá][sš]iv/.test(m))return;" +
  "L.forEach(function(k){var o=document.createElement('option');o.value=String(++n);o.setAttribute('data-surcharge-final-price','0');" +
  "o.setAttribute('data-surcharge-additional-price','0');o.textContent='Nášivka '+k+' +€0';s.appendChild(o);});});})();\n";
const JS = Buffer.concat([Buffer.from(PREDOHRA, "utf8"), readFileSync(join(tmp, "luxuryCar.js"))]), CSS = readFileSync(join(tmp, "luxuryCar.css"));
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
        zrusene.push(p.request.method + " " + u);
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

/** Kontrola mriežky motívov: počet dlaždíc, najviac 4 v rade, názov (bez kódu) najviac na 2 riadky, nič nepreteká. */
async function kontrolaMriezky(k) {
  return k.ev(`(function () {
    var g = document.querySelector('#lcd1v-kamion .k-dlazdice--motiv'); if (!g) return { chyba: "mriežka chýba" };
    var dl = Array.prototype.slice.call(g.querySelectorAll('.k-dlazdica'));
    var riadky = {}; dl.forEach(function (x) { var t = Math.round(x.getBoundingClientRect().top); riadky[t] = (riadky[t] || 0) + 1; });
    var vRade = Math.max.apply(null, Object.keys(riadky).map(function (t) { return riadky[t]; }));
    var zle = [], mena = [];
    dl.forEach(function (x) {
      var nm = x.querySelector('.k-dlazdica__nm'), sm = nm && nm.querySelector('small'); if (!nm || !sm) return;
      var t = { textContent: nm.textContent.slice(0, nm.textContent.length - sm.textContent.length) };
      var r = document.createRange(); r.setStart(nm, 0); r.setEndBefore(sm);
      var tops = {}; Array.prototype.forEach.call(r.getClientRects(), function (q) { if (q.width > 0) tops[Math.round(q.top)] = 1; });
      var n = Object.keys(tops).length; mena.push(t.textContent + " (" + n + ")");
      if (n > 2 || nm.scrollWidth > nm.clientWidth + 1) zle.push(t.textContent + ": " + n + " riadky");
    });
    return { pocet: dl.length, vRade: vRade, zle: zle, mena: mena, kram: dl.some(function (x) { return /kram/i.test(x.textContent); }) };
  })()`);
}

/** Snímka prvku celého (PNG) so štítkom NÁHĽAD; plávajúce prvky mimo konfigurátora skryté. */
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
  await pauza(600);
  await k.ev(`(function () { if (!document.getElementById("snimky-skry")) { var st = document.createElement("style"); st.id = "snimky-skry";
    st.textContent = "body iframe, #lcd1v-lista { visibility: hidden !important; }"; document.head.appendChild(st); } })()`);
  await k.ev(`Array.prototype.forEach.call(document.querySelectorAll("body *"), function (e) {
    if (e.closest("#lcd1v-kamion") || e.querySelector("#lcd1v-kamion")) return;
    var p = getComputedStyle(e).position; if (p === "fixed" || p === "sticky") e.style.setProperty("display", "none", "important"); })`);
  // štítok NÁHĽAD (Michal: náhľad grafiky so štítkom) — vnútri snímaného prvku, vpravo hore
  await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e.querySelector(".snimka-stitok")) return;
    var s = document.createElement("div"); s.className = "snimka-stitok"; s.textContent = "NÁHĽAD – skrytý konfigurátor s logami";
    s.style.cssText = "position:absolute;top:8px;right:8px;z-index:50;padding:6px 10px;border-radius:8px;background:#c0392b;color:#fff;font:700 13px/1.2 Arial,sans-serif;letter-spacing:.04em";
    if (getComputedStyle(e).position === "static") e.style.position = "relative"; e.appendChild(s); })()`);
  const r = await k.ev(`(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    var e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: "start", behavior: "instant" }); var b = e.getBoundingClientRect();
    return { x: Math.max(0, b.left - 12), y: b.top + scrollY - 12, w: Math.min(innerWidth, b.width + 24), h: b.height + 24 }; })()`);
  const s = await k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: Math.min(r.h, 15000), scale: 1 } });
  writeFileSync(join(kam, subor), Buffer.from(s.data, "base64"));
  console.log("  " + join(kam, subor) + "  " + Math.round(r.w) + " × " + Math.round(r.h) + "  " + Math.round(Buffer.from(s.data, "base64").length / 1024) + " kB");
}

let chyba = false;
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
    await vyber(k, "znacka", "Scania (TIR)");
    await vyber(k, "model", "R 2014-2016");
    const pole = await k.ev(`Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion [data-krok="vozidlo"] select[data-p]'), function (s) { return s.getAttribute("data-p"); })`);
    for (const p of pole.filter((x) => x !== "znacka" && x !== "model")) {
      const v = await k.ev(`(function () { var s = document.querySelector('#lcd1v-kamion select[data-p="${p}"]'); return s && s.options[1] ? s.options[1].value : ""; })()`);
      if (v) await vyber(k, p, v);
    }
    await dalej(k, "vozidlo");
    await klik(k, a("mat", "Prémiová syntetická koža – prešívaná"));
    await dalej(k, "material");
    await klik(k, a("farba", "10"));
    await dalej(k, "farba");
    await klik(k, a("lem", "08"));
    await dalej(k, "lemovanie");
    await klik(k, a("nas", "boky+stred"));
    await klik(k, a("motiv", "H1", "boky")); // vybratý motív = logo Scania (náhľad pod mriežkou)
    const kontrola = await kontrolaMriezky(k);
    const vRadeMax = 4;
    const zleTu = kontrola.chyba || kontrola.pocet !== LOGA.length + 2 || kontrola.vRade > vRadeMax || kontrola.zle.length || kontrola.kram;
    if (zleTu) chyba = true;
    console.log(sirka + " px: " + kontrola.pocet + " motívov, v rade " + kontrola.vRade + (kontrola.zle.length ? " · ZLE: " + kontrola.zle.join(", ") : " · názvy najviac na 2 riadky") +
      (kontrola.kram ? " · KRAM-TRUCK v mriežke!" : "") + (kontrola.chyba ? " · " + kontrola.chyba : ""));
    console.log("    " + (kontrola.mena || []).join(" | "));
    await snimkaPrvku(k, '#lcd1v-kamion [data-krok="nasivky"]', "nahlad-nasivky-" + sirka + ".png");
    console.log("    zrušené POST: " + zrusene.length + (k.chyby.length ? " · chyby stránky: " + JSON.stringify(k.chyby.slice(0, 3)) : ""));
    await k.zavri();
  }
} finally {
  await ch.zavri();
}
process.exit(chyba ? 1 : 0);
