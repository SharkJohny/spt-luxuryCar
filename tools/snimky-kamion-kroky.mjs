// Snímky kamiónov 640 v novom vzhľade (?novy=1) pre ľudskú kontrolu (JPEG kvôli veľkosti repa): krok 1 s hlavičkou, kroky 5
// (nášivky) a 6 (tapacír dverí) — otázky po jednej, po poslednej otázke sa krok sám zavrie (Michal 18. 10. 2026) —, súhrn
// objednávky a obsah pod konfigurátorom. Pri každej snímke vypíše kontrolu mierky písma (tools/test-1v/pismo-kamion.mjs;
// ostrá kontrola je v scenári kamion-platne). Živá stránka s LOKÁLNYM buildom (esbuild assets/js/main.js +
// vloz-lcd-css.py --vystup, ako tools/test-konfigurator-1v.mjs): bundle, CSS a assets/img/1v/* sa podvrhnú z repa. Nič
// neodosiela: do košíka sa neklikne a každý POST na /action/ (okrem odmietnutia cookies) sa zruší; merače sú zablokované.
//   node tools/snimky-kamion-kroky.mjs [priečinok = docs/kamiony-snimky] [--sirka 390,1280] [--predpona e-] [--kvalita 82]
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { pismoVyraz, vypisNalezy, ROLY_KONFIGURATOR, ROLY_OBSAH, ROLY_SPOLOCNE } from "./test-1v/pismo-kamion.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv.slice(2);
const kam = arg[0] && !arg[0].startsWith("--") ? arg[0] : join(KOREN, "docs/kamiony-snimky");
const hodnota = (meno, pred) => { const i = arg.indexOf(meno); return i > -1 ? arg[i + 1] : pred; };
const sirky = hodnota("--sirka", "390,1280").split(",").map(Number);
const PRED = hodnota("--predpona", "e-");
const KVALITA = Number(hodnota("--kvalita", "82"));
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
async function snimkaPrvku(k, sel, subor, selDo) {
  const vys = await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); return e ? e.getBoundingClientRect().height : 0; })()`);
  if (!vys) throw new Error("prvok chýba: " + sel);
  const vysDo = selDo ? await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}), d = document.querySelector(${JSON.stringify(selDo)});
    return d ? d.getBoundingClientRect().bottom - e.getBoundingClientRect().top : 0; })()`) : 0;
  for (let y = 0; y < Math.max(vys, vysDo); y += 600) {
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
    var d = ${JSON.stringify(selDo || "")} && document.querySelector(${JSON.stringify(selDo || "")}); var dole = d ? Math.max(b.bottom, d.getBoundingClientRect().bottom) : b.bottom;
    return { x: Math.max(0, b.left - 12), y: b.top + scrollY - 12, w: Math.min(innerWidth, b.width + 24), h: dole - b.top + 24 }; })()`);
  const s = await k.posli("Page.captureScreenshot", { format: "jpeg", quality: KVALITA, captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: Math.min(r.h, 15000), scale: 1 } });
  writeFileSync(join(kam, subor), Buffer.from(s.data, "base64"));
  console.log("  " + subor + "  " + Math.round(r.w) + " × " + Math.round(r.h) + "  " + Math.round(Buffer.from(s.data, "base64").length / 1024) + " kB");
}

/** Kontrola mierky písma (výpis, nie pád): konfigurátor a lišta ostro, obsah pod ním vlastné triedy ostro a spoločné ako „!“. */
const nalezy = [];
async function pismo(k, meno, korene, roly, spolocne = []) {
  const r = await k.ev(pismoVyraz(korene, roly, spolocne));
  const f = vypisNalezy(r), ostre = (x) => !x.z;
  const zle = r.zle.filter(ostre), riadky = r.riadky.filter(ostre), zlom = r.zlom.filter(ostre), pretek = r.pretek.filter(ostre), orez = r.orez.filter(ostre);
  const spol = r.zle.concat(r.riadky, r.orez).filter((x) => x.z);
  const chyba = zle.length || riadky.length || zlom.length || pretek.length || orez.length || r.strana;
  if (chyba) nalezy.push(meno + "-" + (r.pc ? "pc" : "tel"));
  console.log("    písmo " + meno + ": " + r.n + " textov" + (chyba ? "" : " OK") + (zle.length ? " · MALÉ: " + f(zle) : "") + (riadky.length ? " · RIADKOVANIE: " + f(riadky) : "") +
    (zlom.length ? " · ZLOM SLOVA: " + f(zlom) : "") + (pretek.length ? " · PRETEČIE: " + f(pretek) : "") + (orez.length ? " · OREZANÉ: " + f(orez) : "") + (r.strana ? " · VODOROVNÝ POSUVNÍK" : "") +
    (spol.length ? " · ! spoločné časti (iná session): " + f(spol) : ""));
}
const KONF = ["#lcd1v-kamion"];

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
    const K1 = '#lcd1v-kamion [data-krok="vozidlo"]', K5 = '#lcd1v-kamion [data-krok="nasivky"]', K6 = '#lcd1v-kamion [data-krok="tapacir"]';
    const SUHRN = '#lcd1v-kamion [data-k="suhrn"]';
    const sn = async (sel, meno, selDo) => { await snimkaPrvku(k, sel, `${PRED}${meno}-${sirka}.jpg`, selDo); await pismo(k, meno, KONF, ROLY_KONFIGURATOR); };
    // lišta na telefóne (spoločná 1V, _lcd1v-cena.scss; tu len „Spolu“) — pred snímkami, tie ju skryjú
    if (sirka < 768) await pismo(k, "lista", ["#lcd1v-lista"], ROLY_KONFIGURATOR);
    // krok 1: hlavička produktu (H1, úvod, cena, v cene) + vozidlo
    await sn("#lcd1v-kamion", "krok1-vozidlo", K1);
    await vyber(k, "znacka", "DAF (TIR)");
    await vyber(k, "model", "XF106 2017-2021");
    await sn(K1, "krok1-vybrate");
    await dalej(k, "vozidlo");
    await klik(k, a("mat", "Prémiová syntetická koža – prešívaná"));
    await sn('#lcd1v-kamion [data-krok="material"]', "krok2-material");
    await dalej(k, "material");
    await klik(k, a("farba", "10"));
    await sn('#lcd1v-kamion [data-krok="farba"]', "krok3-farba");
    await dalej(k, "farba");
    await klik(k, a("lem", "08"));
    await sn('#lcd1v-kamion [data-krok="lemovanie"]', "krok4-lemovanie");
    await dalej(k, "lemovanie");
    // krok 5: 5.1 kam (4 výlučné voľby) -> 5.2 motív + niť pod sedadlami -> 5.3 stred -> sám sa zavrie
    await sn(K5, "krok5-1-bez-vyberu");
    await klik(k, a("nas", "boky+stred"));
    await klik(k, a("zmenit", "kam")); // 5.1 znova otvorená: zvolená LEN dlaždica všetkých troch
    await sn(K5, "krok5-2-vybrate-3");
    await klik(k, a("nas", "boky+stred"));
    await klik(k, a("motiv", "H21", "boky"));
    await klik(k, a("nit", "2824", "boky"));
    await sn(K5, "krok5-3-motiv-nit-nahlad");
    await klik(k, a("potvrd", "boky"));
    await sn(K5, "krok5-4-stred-otazka");
    await klik(k, a("stredRovnaky", "0"));
    await klik(k, a("motiv", "H19", "stred"));
    await klik(k, a("nit", "2999", "stred"));
    await sn(K5, "krok5-5-stred-ina");
    await klik(k, a("zmenit", "stred"));
    await klik(k, a("stredRovnaky", "1")); // posledná otázka -> krok 5 sa sám zavrie, otvorí sa krok 6
    const po5 = await k.ev(`window.__lcd1vKamion.ui.U.otvoreny`);
    if (po5 !== "tapacir") throw new Error("krok 5 sa po poslednej otázke nezavrel sám (otvorený " + po5 + ")");
    await sn(K5, "krok5-6-sam-zavrety-krok6", K6);
    // krok 6: ponuka -> materiál, farba a lemovanie -> nášivka na dvere -> motív a niť -> sám sa zavrie (súhrn)
    await sn(K6, "krok6-1-ponuka");
    await klik(k, a("tap", "ano"));
    await sn(K6, "krok6-2-material");
    await klik(k, a("tapZmenit"));
    await sn(K6, "krok6-3-vybrat-inak");
    await klik(k, a("zmenit", "mat"));
    await sn(K6, "krok6-3b-zmenit-zvolena-vlastna"); // otázka znova otvorená: zelená LEN karta „Vlastná kombinácia“
    await klik(k, a("tapRovnake"));
    await sn(K6, "krok6-4-nasivka-dvere");
    await klik(k, a("tapNas", "ano"));
    await klik(k, a("tapNasRovnaka", "0"));
    await klik(k, a("motiv", "H19", "dvere"));
    await klik(k, a("nit", "3546", "dvere"));
    await sn(K6, "krok6-5-dvere-ina");
    await klik(k, a("potvrd", "dvere")); // posledné potvrdenie -> krok 6 sa sám zavrie, ďalej súhrn
    const po6 = await k.ev(`window.__lcd1vKamion.ui.U.otvoreny`);
    if (po6 !== null) throw new Error("krok 6 sa po poslednom potvrdení nezavrel sám (otvorený " + po6 + ")");
    await sn('#lcd1v-kamion [data-k="kroky"]', "krok6-6-sam-zavrety-kroky");
    await sn(SUHRN, "suhrn");
    // obsah pod konfigurátorom (kus 1: galéria … dopravcovia, kus 2: recenzie, FAQ, záver)
    for (const [id, meno] of [["#p1v-kamiony-1", "obsah-1"], ["#p1v-kamiony-2", "obsah-2"]]) {
      if (!(await k.ev(`!!document.querySelector(${JSON.stringify(id)})`))) { console.log("  " + id + " na stránke nie je"); continue; }
      await snimkaPrvku(k, id, `${PRED}${meno}-${sirka}.jpg`);
      await pismo(k, meno, [id], ROLY_OBSAH, ROLY_SPOLOCNE);
    }
    const info = await k.ev(`(function () { var k = window.__lcd1vKamion; return { nas: k && k.ui.S.nas, tap: k && k.ui.S.tap, spolu: k && k.ui.cena().spolu, pretek: document.documentElement.scrollWidth > innerWidth + 1 }; })()`);
    console.log(sirka + " px: " + JSON.stringify(info) + (zrusene.length ? " · zrušené POST: " + zrusene.length : "") + (k.chyby.length ? " · chyby: " + JSON.stringify(k.chyby.slice(0, 3)) : ""));
    await k.zavri();
  }
} finally {
  await ch.zavri();
}
console.log(nalezy.length ? "\nPísmo: nálezy v " + nalezy.join(", ") : "\nPísmo: všetky snímky OK");
