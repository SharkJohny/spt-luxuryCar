#!/usr/bin/env node
// Test cookie lišty v štýle C „Prémiová karta“ + okna nastavení + odkazu „Nastavenia cookies“ v päte (Michal 15. 10. 2026)
// na ŽIVOM webe s LOKÁLNYM buildom. PRE VŠETKÝCH: vzhľad je z CSS v <head> (selektory pod html:root) od prvého vykreslenia,
// s flagom 1V aj bez neho, na každej stránke (docs/1v-kontrakt.md §14).
//
//   node tools/test-cookies-1v.mjs                         # SK titulka + produkt 598 (+ CZ titulka), 1280 aj 390
//   node tools/test-cookies-1v.mjs --sirka 390 --snimky C:/tmp/cookies --vypis
//   (--okno = Chrome s oknom, --bez-cz = bez CZ titulky, --bez-drop = build bez --drop:console)
//
// Prvý snímok: skript pred načítaním stránky (Page.addScriptToEvaluateOnNewDocument) v každom requestAnimationFrame
// (tesne pred vykreslením) zapíše štýl lišty v PRVOM snímku, v ktorom je na obrazovke — ten musí byť už karta C
// (inak sa mihne stará modrá lišta). Rovnako každý snímok otvárania okna nastavení (žiadny snímok starého okna).
//
// Scenáre (pre každú šírku):
//   bez-js <stránka>     bundle luxuryCar.js ZABLOKOVANÝ (len lokálne CSS): prvý snímok aj hotová lišta = karta C, trieda
//                        lcd1v-cookies nikdy nenaskočí (štýl nezávisí od JS); okno nastavení v štýle C v každom snímku
//   karta <stránka>      bez flagu (bežný návštevník): prvý snímok = karta C, karta C (pozadie, rádius, nadpis, rovnaké
//                        Odmietnuť = Súhlasím, kontrast, podiel výšky na telefóne, poloha na PC, rezerva 96 px preč),
//                        bublina Luxie nezakrýva tlačidlá; titulka a 598 navyše okno nastavení skutočným klikom (každý snímok
//                        otvárania v štýle C, v okne, tlačidlá viditeľné a nezakryté, Všetko vypnuté = Povoliť všetko,
//                        prepínače, kontrast, chat ustúpi) a odkaz v päte (text, otvorí okno aj pod lištou); CZ len lišta
//                        a text odkazu „Nastavení cookies“
//   flag 598             s ?novy=1: karta C a bublina Luxie rovnako (flag na lištu nemá vplyv)
//   suhlas               „Súhlasím“ skutočným klikom: POST súhlasu sa ZRUŠÍ (nikdy neodíde)
//   odmietnutie          „Odmietnuť“ skutočným klikom: POST consent=none je povolený, lišta zmizne, bublina Luxie späť dole;
//                        potom odkaz „Nastavenia cookies“ v päte skutočným klikom otvorí okno (súhlas sa dá zmeniť aj bez lišty)
//
// Bezpečnosť: Chrome bez okna s dočasným profilom, pred každou stránkou zmazané cookies (čistý návštevník). Merače
// (GA, GTM, FB, TikTok…) zablokované. POST /action/CustomerCookieConsent/ prejde LEN ako odmietnutie (consent=none);
// súhlas so štatistikou/marketingom a každý iný POST na /action/ sa zruší. Žiadny admin, prihlásenie ani objednávka.
// Exit: 0 OK, 1 aspoň jedna kontrola zlyhala, 2 chyba použitia / buildu / Chrome.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { PRODUKTY, SK } from "./test-1v/produkty.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CZ = "https://www.luxurycardesign.cz";
const MERACE = [
  "*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*",
  "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*",
];
const STRANKY = [
  { meno: "titulka", url: SK + "/", nadpis: "Cookies a súkromie", odkaz: "Nastavenia cookies", nastavenia: true },
  { meno: "598", url: PRODUKTY[598].url, nadpis: "Cookies a súkromie", odkaz: "Nastavenia cookies", nastavenia: true },
  { meno: "cz-titulka", url: CZ + "/", nadpis: "Cookies a soukromí", odkaz: "Nastavení cookies", nastavenia: false, cz: true },
];
const TELEFON_MAX = 0.225; // karta na telefóne najviac ~22 % výšky okna (návrh C: 187 px z 844 = 22,2 %)

class ChybaPouzitia extends Error {}
class Zlyhanie extends Error {}
const over = (podm, sprava) => { if (!podm) throw new Zlyhanie(sprava); };

function argumenty(argv) {
  const a = { sirky: [1280, 390], snimky: null, okno: false, vypis: false, bezCz: false, bezDrop: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new ChybaPouzitia(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--sirka") a.sirky = dalsi().split(",").map((s) => Number(s.trim())).filter(Boolean);
    else if (x === "--snimky") a.snimky = resolve(dalsi());
    else if (x === "--okno") a.okno = true;
    else if (x === "--vypis") a.vypis = true;
    else if (x === "--bez-cz") a.bezCz = true;
    else if (x === "--bez-drop") a.bezDrop = true;
    else if (x === "--help" || x === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 32).join("\n")); process.exit(0); }
    else throw new ChybaPouzitia("neznámy prepínač " + x);
  }
  return a;
}

// ------------------------------------------------------------------ build (rovnako ako tools/test-konfigurator-1v.mjs priprav)
function spusti(cmd, args, { shell = false, popis, cwd = KOREN, env } = {}) {
  const moznosti = { cwd, env: env || process.env, encoding: "utf8", shell, maxBuffer: 64 * 1024 * 1024 };
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), moznosti)
    : spawnSync(cmd, args, moznosti);
  if (r.status !== 0) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
  return r;
}
function esbuild() {
  if (process.env.ESBUILD_BINARY_PATH && existsSync(process.env.ESBUILD_BINARY_PATH)) return { cmd: process.env.ESBUILD_BINARY_PATH, pred: [], shell: false };
  const bin = join(KOREN, "node_modules", "@esbuild", process.platform + "-" + process.arch, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
  if (existsSync(bin)) return { cmd: bin, pred: [], shell: false };
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  return { cmd: process.platform === "win32" ? "npx.cmd" : "npx", pred: ["--yes", "esbuild@" + ver], shell: process.platform === "win32", mimoRepa: true };
}
function verziaZLocku(meno) {
  try {
    const lock = readFileSync(join(KOREN, "yarn.lock"), "utf8");
    const m = new RegExp('^"?' + meno.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "@[^\\n]*:\\r?\\n\\s+version \"([^\"]+)\"", "m").exec(lock);
    return m ? m[1] : null;
  } catch { return null; }
}
function chybajuceBalicky() {
  const pkg = JSON.parse(readFileSync(join(KOREN, "package.json"), "utf8"));
  const chyba = Object.keys(pkg.dependencies || {}).filter((n) => !existsSync(join(KOREN, "node_modules", n, "package.json")));
  if (!chyba.length) return null;
  const spec = chyba.map((n) => n + "@" + (verziaZLocku(n) || pkg.dependencies[n]));
  const kluc = spec.join(",").replace(/[^a-z0-9.,@-]/gi, "_").slice(0, 80);
  const dir = join(process.env.LOCALAPPDATA || tmpdir(), "lcd-1v-test", "balicky-" + kluc);
  if (!chyba.every((n) => existsSync(join(dir, "node_modules", n, "package.json")))) {
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), '{ "private": true }\n');
    spusti(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...spec], { shell: process.platform === "win32", popis: "npm install (cache testu)", cwd: dir });
  }
  return join(dir, "node_modules");
}
function python() {
  for (const k of [process.env.LCD_PYTHON && [process.env.LCD_PYTHON], ["python"], ["python3"], ["py", "-3"]].filter(Boolean)) {
    if (spawnSync(k[0], [...k.slice(1), "--version"], { encoding: "utf8" }).status === 0) return k;
  }
  throw new Error("python nenájdený (nastav LCD_PYTHON)");
}
function priprav(a) {
  const tmp = mkdtempSync(join(tmpdir(), "lcd-1v-build-"));
  const t0 = Date.now();
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  if (["konfigurator.gen.jsx", "konfigurator.phone.gen.jsx"].some((f) => !existsSync(join(tk, f)))) spusti(process.execPath, ["truck/build-truck-images.mjs"], { popis: "truck/build-truck-images.mjs" });
  const nodePath = chybajuceBalicky();
  const e = esbuild();
  const prep = [join(KOREN, "assets/js/main.js"), "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--legal-comments=none", "--log-level=warning"];
  if (!a.bezDrop) prep.push("--drop:console");
  const env = nodePath ? { ...process.env, NODE_PATH: [nodePath, process.env.NODE_PATH].filter(Boolean).join(delimiter) } : process.env;
  spusti(e.cmd, [...e.pred, ...prep], { shell: e.shell, popis: "esbuild", cwd: e.mimoRepa ? tmp : KOREN, env });
  const py = python();
  spusti(py[0], [...py.slice(1), "tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  const js = readFileSync(join(tmp, "luxuryCar.js")), css = readFileSync(join(tmp, "luxuryCar.css"));
  return { popis: `lokálny build (${(js.length / 1024).toFixed(0)} kB JS, ${(css.length / 1024).toFixed(0)} kB CSS, ${((Date.now() - t0) / 1000).toFixed(1)} s)`, js, css };
}

// ------------------------------------------------------------------ stránka
const rozober = (body) => { const o = []; for (const [k, v] of new URLSearchParams(body || "")) o.push([k, v]); return o; };
/** POST súhlasu: consent=none (odmietnutie / Všetko vypnuté) je povolený, čokoľvek iné (analytics, personalisation, all) nie. */
const jeOdmietnutie = (body) => { const c = rozober(body).filter(([k]) => k === "consent").map(([, v]) => v); return c.length > 0 && c.every((v) => v === "none"); };

/** Snímač snímok: beží pred skriptami stránky, v každom requestAnimationFrame (tesne pred vykreslením snímku). */
const SNIMAC = `(function () {
  if (window.__lcdCk) return;
  var S = window.__lcdCk = { prvy: null, okno: [], sleduj: false };
  function r4(e) { var r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }
  function krok() {
    try {
      var f = document.querySelector(".js-siteCookies .siteCookies__form");
      if (f && !S.prvy && f.getBoundingClientRect().height > 0) {
        var c = getComputedStyle(f), t = f.querySelector(".siteCookies__text");
        var o = f.querySelector(".siteCookies__button[value=reject]"), a = f.querySelector(".siteCookies__button[value=all]");
        S.prvy = { t: Math.round(performance.now()), bg: c.backgroundImage, radius: c.borderTopLeftRadius,
          nadpis: t ? getComputedStyle(t, "::before").content : null, form: r4(f),
          tlacidla: o && a ? r4(o).slice(2).concat(r4(a).slice(2)) : null, zlate: o ? getComputedStyle(o).backgroundImage.slice(0, 30) : null,
          trieda: document.documentElement.classList.contains("lcd1v-cookies"), bundle: !!document.querySelector("script#JKscript") };
      }
      if (S.sleduj) {
        var obs = document.getElementById("cboxContent"), cb = document.getElementById("colorbox");
        if (obs && cb && obs.querySelector(".cookiesSetting__form") && getComputedStyle(cb).display !== "none" && getComputedStyle(cb).visibility !== "hidden") {
          var co = getComputedStyle(obs);
          S.okno.push({ t: Math.round(performance.now()), trieda: obs.classList.contains("cookiesDialog"), bg: co.backgroundImage.slice(0, 40), rect: r4(obs) });
        }
      }
    } catch (e) {}
    requestAnimationFrame(krok);
  }
  requestAnimationFrame(krok);
})();`;

async function novaStranka(ch, sirka, build, { bezJs = false } = {}) {
  const k = await ch.novaKarta({ sirka });
  const s = { k, build, posty: [], podvrhnute: 0, zablokovane: 0 };
  await k.posli("Network.clearBrowserCookies"); // čistý návštevník: lišta sa ukáže (súhlas iných kariet zabudnutý)
  await k.posli("Network.setBlockedURLs", { urls: MERACE });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  await k.posli("Page.addScriptToEvaluateOnNewDocument", { source: SNIMAC });
  k.na("Page.javascriptDialogOpening", () => k.posli("Page.handleJavaScriptDialog", { accept: false }).catch(() => {}));
  const odpovedz = (p, body, typ) => k.posli("Fetch.fulfillRequest", {
    requestId: p.requestId, responseCode: 200, body: body.toString("base64"),
    responseHeaders: [{ name: "Content-Type", value: typ }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }],
  });
  k.na("Fetch.requestPaused", async (p) => {
    const u = p.request.url;
    try {
      if (/\/action\//i.test(u) && p.request.method !== "GET") {
        const body = p.request.postData || "";
        const suhlas = /\/action\/CustomerCookieConsent\//i.test(u);
        const povol = suhlas && jeOdmietnutie(body);
        s.posty.push({ url: u, body, suhlas, akcia: povol ? "povolené" : "zrušené" });
        if (povol) return await k.posli("Fetch.continueRequest", { requestId: p.requestId });
        return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
      }
      // bez-js: bundle sa vôbec nenačíta (štýl lišty musí byť len z CSS v <head>)
      if (bezJs && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) { s.zablokovane++; return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "BlockedByClient" }); }
      if (s.build && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) { s.podvrhnute++; return await odpovedz(p, s.build.js, "application/javascript; charset=utf-8"); }
      if (s.build && /\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) { s.podvrhnute++; return await odpovedz(p, s.build.css, "text/css; charset=utf-8"); }
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch { /* karta sa zatvára */ }
  });
  await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" }, { urlPattern: "*/action/*", requestStage: "Request" }] });
  s.t = vytvorT(k, { novy: false });
  return s;
}

async function otvor(s, url) {
  await s.k.posli("Page.bringToFront").catch(() => {});
  await s.k.chod(url);
  await s.t.cakaj(`document.readyState === "complete"`, { ms: 30000, popis: "načítaná stránka" });
  await s.t.ev(`document.fonts ? document.fonts.ready.then(function () { return 1; }) : 1`);
  await pauza(1200);
}

// ------------------------------------------------------------------ merania v stránke
const POMOC = `
  function rgb(t) { var m = /rgba?\\(([^)]+)\\)/.exec(t || ""); if (!m) return null; var p = m[1].split(",").map(function (x) { return parseFloat(x); }); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { return [c.r, c.g, c.b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function kontrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function farbyPozadia(cs) { var z = (cs.backgroundImage || "").match(/rgba?\\([^)]+\\)/g) || []; var f = z.map(rgb); var bc = rgb(cs.backgroundColor); if (!f.length && bc && bc.a > 0) f.push(bc); return f; }
  function minKontrast(text, pozadia) { var t = rgb(text); if (!t || !pozadia.length) return null; return Math.min.apply(null, pozadia.map(function (p) { return kontrast(t, p); })); }
  function rect(e) { if (!e) return null; var r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; }
  function vid(e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none"; }
  function popis(e) { if (!e) return "nič"; return e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\\s+/).slice(0, 3).join(".") : "") + (e.title ? "[" + e.title + "]" : ""); }
  function zakryte(e) { var r = e.getBoundingClientRect(); var x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); var h = document.elementFromPoint(x, y); return (h === e || e.contains(h)) ? null : popis(h) + " v bode " + x + "," + y; }
  function luxia() { return document.querySelector('iframe[title="Luxia chat"]'); }
`;

/** Karta C (s flagom aj bez): vráti merania. sTriedou = bundle bežal (značka html.lcd1v-cookies z cookies.js). */
const KARTA = `(function (nadpis, maxPodiel, sTriedou) {${POMOC}
  var H = document.documentElement, z = [];
  var bar = document.querySelector(".js-siteCookies"), form = bar && bar.querySelector(".siteCookies__form");
  if (!form || !vid(form)) return { chyba: "lišta cookies nie je viditeľná (čistý návštevník)" };
  var cf = getComputedStyle(form), rf = rect(form), vw = innerWidth, vh = innerHeight;
  if (sTriedou && !H.classList.contains("lcd1v-cookies")) z.push("html.lcd1v-cookies chýba (cookies.js nebežal pre bežného návštevníka?)");
  if (!sTriedou && H.classList.contains("lcd1v-cookies")) z.push("html.lcd1v-cookies je tu, hoci bundle je zablokovaný");
  if (!/linear-gradient/.test(cf.backgroundImage)) z.push("pozadie karty nie je čierny gradient C: " + cf.backgroundImage.slice(0, 60));
  var bg = farbyPozadia(cf); if (bg.some(function (c) { return lum(c) > 0.03; })) z.push("karta nie je tmavá: " + cf.backgroundImage.slice(0, 80));
  if (cf.borderTopLeftRadius !== "16px") z.push("rádius karty " + cf.borderTopLeftRadius + " ≠ 16px");
  var pr = parseFloat(cf.paddingRight); if (pr > 24) z.push("vpravo ostala rezerva " + cf.paddingRight + " (96 px pre bublinu má byť preč)");
  var t = form.querySelector(".siteCookies__text"), tb = getComputedStyle(t, "::before");
  if (tb.content !== JSON.stringify(nadpis)) z.push("nadpis karty " + tb.content + " ≠ " + nadpis);
  var kn = minKontrast(tb.color, bg); if (!(kn >= 4.5)) z.push("kontrast nadpisu " + kn);
  var kt = minKontrast(getComputedStyle(t).color, bg); if (!(kt >= 4.5)) z.push("kontrast textu " + kt);
  var a = t.querySelector("a"); if (!a || !vid(a)) z.push("odkaz na ochranu údajov nie je viditeľný"); else { var ka = minKontrast(getComputedStyle(a).color, bg); if (!(ka >= 4.5)) z.push("kontrast odkazu " + ka); }
  var n = form.querySelector(".siteCookies__link"), cn = n && getComputedStyle(n);
  if (!n || !vid(n)) z.push("„Nastavenie“ nie je viditeľné"); else { if (parseFloat(cn.fontSize) < 13) z.push("„Nastavenie“ malé písmo " + cn.fontSize); var kz = minKontrast(cn.color, bg); if (!(kz >= 4.5)) z.push("kontrast „Nastavenie“ " + kz); }
  var o = form.querySelector(".siteCookies__button[value=reject]"), s = form.querySelector(".siteCookies__button[value=all]");
  var ro = rect(o), rs = rect(s), co = getComputedStyle(o), cs = getComputedStyle(s);
  if (Math.abs(ro.w - rs.w) > 1 || Math.abs(ro.h - rs.h) > 1) z.push("Odmietnuť " + ro.w + "×" + ro.h + " ≠ Súhlasím " + rs.w + "×" + rs.h);
  ["backgroundImage", "backgroundColor", "color", "fontSize", "fontWeight", "fontFamily", "letterSpacing", "textTransform", "boxShadow", "borderTopLeftRadius"].forEach(function (p) { if (co[p] !== cs[p]) z.push("Odmietnuť/Súhlasím sa líšia v " + p + ": " + co[p] + " | " + cs[p]); });
  if (ro.h < 44) z.push("tlačidlá nižšie ako 44 px: " + ro.h);
  if (!/linear-gradient/.test(co.backgroundImage)) z.push("tlačidlá nie sú zlaté: " + co.backgroundImage.slice(0, 60));
  var kb = minKontrast(co.color, farbyPozadia(co)); if (!(kb >= 4.5)) z.push("kontrast textu tlačidla " + kb);
  var podiel = rf.h / vh; // výška karty / výška okna (návrh C: 187 z 844 px = 22 %)
  if (vw < 768 && podiel > maxPodiel) z.push("telefón: karta zaberá " + Math.round(podiel * 1000) / 10 + " % výšky (max " + maxPodiel * 100 + " %)");
  if (vw >= 1024) {
    if (rf.w > 962) z.push("PC: karta širšia ako 960 px: " + rf.w);
    // v strede obsahu stránky (rovnako ako lišta Shoptetu): left = right (posuvník / šírka body neovplyvní)
    var cb = getComputedStyle(bar);
    if (Math.abs(parseFloat(cb.left) - parseFloat(cb.right)) > 2) z.push("PC: karta nie je v strede (left " + cb.left + " | right " + cb.right + ")");
    if (Math.abs(vh - rf.b - 20) > 2) z.push("PC: karta nie je 20 px nad spodkom (" + (vh - rf.b) + ")");
  }
  return { chyby: z, karta: rf, podiel: Math.round(podiel * 1000) / 10, vyska: rf.h, tlacidla: [ro.w, ro.h, rs.w, rs.h], kontrastTlacidla: Math.round(kb * 10) / 10, nadpis: tb.content, premenna: H.style.getPropertyValue("--lcd1v-cookies-vyska") };
})`;

/** Bublina Luxie vs. karta: zbalený chat nesmie ležať na tlačidlách (ani priehľadná časť iframu), klik ich musí trafiť. */
const LUXIA_KARTA = `(function () {${POMOC}
  var f = luxia(), form = document.querySelector(".js-siteCookies .siteCookies__form");
  if (!form || !vid(form)) return { chyba: "karta nie je viditeľná" };
  var z = [], prvky = form.querySelectorAll(".siteCookies__button, .siteCookies__link, .siteCookies__text a");
  Array.prototype.forEach.call(prvky, function (e) { var h = zakryte(e); if (h) z.push(popis(e) + " zakryté: " + h); });
  var stav = "bez chatu";
  if (f && vid(f)) {
    var rl = f.getBoundingClientRect(), rk = form.getBoundingClientRect();
    var zbaleny = document.documentElement.classList.contains("lcd1v-cookies-bublina");
    stav = (zbaleny ? "zbalený " : "otvorený ") + Math.round(rl.width) + "×" + Math.round(rl.height) + " spodok " + getComputedStyle(f).bottom;
    if (zbaleny) Array.prototype.forEach.call(prvky, function (e) { var r = e.getBoundingClientRect(); if (rl.left < r.right && rl.right > r.left && rl.top < r.bottom && rl.bottom > r.top) z.push("iframe Luxie (" + stav + ") leží na " + popis(e)); });
    if (zbaleny && rl.bottom > rk.top + 1) z.push("zbalený chat nie je nad kartou: spodok iframu " + Math.round(rl.bottom) + " > horný okraj karty " + Math.round(rk.top));
  }
  return { chyby: z, luxia: stav };
})()`;

/** Okno nastavení (otvorené): poloha, tlačidlá, prepínače, kontrast, chat. */
const OKNO = `(function () {${POMOC}
  var z = [], vh = innerHeight, vw = innerWidth;
  var obs = document.querySelector("#cboxContent.cookiesDialog");
  if (!obs || !vid(obs)) return { chyba: "okno nastavení (#cboxContent.cookiesDialog) nie je otvorené" };
  var ro = rect(obs), co = getComputedStyle(obs), bg = farbyPozadia(co);
  if (ro.y < -1 || ro.b > vh + 1 || ro.x < -1 || ro.r > vw + 1) z.push("okno presahuje obrazovku: " + JSON.stringify(ro) + " (okno " + vw + "×" + vh + ")");
  if (!bg.length || bg.some(function (c) { return lum(c) > 0.03; })) z.push("okno nie je tmavé (štýl C): " + co.backgroundImage.slice(0, 80) + " " + co.backgroundColor);
  if (vw < 768 && Math.abs(ro.b - vh) > 1) z.push("telefón: okno nie je spodný panel (spodok " + ro.b + " ≠ " + vh + ")");
  var spodok = obs.querySelector(".cookiesSetting__bottom"), sbg = farbyPozadia(getComputedStyle(spodok));
  var T = { vypnut: "[data-testid=buttonCookiesTurnOff]", potvrdit: "[data-testid=cookiesConfirmSelection]", povolit: "[data-testid=buttonCookiesEnableAll]" }, R = {};
  Object.keys(T).forEach(function (k) {
    var e = obs.querySelector(T[k]); if (!e || !vid(e)) { z.push(k + ": tlačidlo nie je viditeľné"); return; }
    var r = rect(e); R[k] = r;
    if (r.y < 0 || r.b > vh || r.x < 0 || r.r > vw) z.push(k + ": tlačidlo mimo obrazovky " + JSON.stringify(r) + " (okno " + vw + "×" + vh + ")");
    else { var h = zakryte(e); if (h) z.push(k + " zakryté: " + h); }
    var c = getComputedStyle(e), pf = farbyPozadia(c); var k2 = minKontrast(c.color, pf.length ? pf : sbg); if (!(k2 >= 4.5)) z.push(k + ": kontrast textu " + k2);
    if (r.h < 44) z.push(k + ": nižšie ako 44 px (" + r.h + ")");
  });
  var v = obs.querySelector(T.vypnut), p = obs.querySelector(T.povolit);
  if (v && p) {
    var cv = getComputedStyle(v), cp = getComputedStyle(p);
    if (Math.abs(R.vypnut.w - R.povolit.w) > 1 || Math.abs(R.vypnut.h - R.povolit.h) > 1) z.push("Všetko vypnuté " + R.vypnut.w + "×" + R.vypnut.h + " ≠ Povoliť všetko " + R.povolit.w + "×" + R.povolit.h);
    ["backgroundImage", "backgroundColor", "color", "fontSize", "fontWeight", "letterSpacing", "textTransform", "boxShadow"].forEach(function (q) { if (cv[q] !== cp[q]) z.push("Všetko vypnuté/Povoliť všetko sa líšia v " + q + ": " + cv[q] + " | " + cp[q]); });
  }
  var ti = obs.querySelector(".cookiesSetting__title"), kt = minKontrast(getComputedStyle(ti).color, bg); if (!(kt >= 4.5)) z.push("kontrast nadpisu " + kt);
  Array.prototype.forEach.call(obs.querySelectorAll(".cookiesSetting__perex, .cookiesSetting__item__name strong, .cookiesSetting__item__text"), function (e) { var kk = minKontrast(getComputedStyle(e).color, bg); if (!(kk >= 4.5)) z.push("kontrast " + popis(e) + " " + kk); });
  var prep = Array.prototype.map.call(obs.querySelectorAll(".cookiesSetting__item__checkbox"), function (ch) {
    var l = ch.parentNode.querySelector(".cookiesSetting__item__state"), d = getComputedStyle(l, "::before"), g = getComputedStyle(l, "::after");
    var dr = farbyPozadia(d), gc = rgb(g.backgroundColor);
    return { id: ch.id, zapnute: ch.checked, draha: [d.width, d.height], gombik: [g.width, g.height], posun: g.transform, drahaPozadie: d.backgroundImage !== "none" ? "gradient" : d.backgroundColor, kontrastGombika: dr.length && gc ? Math.round(Math.min.apply(null, dr.map(function (c) { return kontrast(gc, c); })) * 10) / 10 : null, vidno: vid(l.parentNode) };
  });
  prep.forEach(function (q) {
    if (q.zapnute) z.push(q.id + " je pri otvorení zapnutý (predzaškrtnuté)");
    if (q.draha[0] !== "46px" || q.draha[1] !== "26px") z.push(q.id + ": dráha prepínača " + q.draha.join("×"));
    if (!q.vidno) z.push(q.id + ": prepínač nie je viditeľný");
    if (!(q.kontrastGombika >= 3)) z.push(q.id + ": gombík vs dráha kontrast " + q.kontrastGombika + " (min 3)");
  });
  var f = luxia(); if (f && getComputedStyle(f).visibility !== "hidden") z.push("chat Luxia je nad otvoreným oknom (má ustúpiť)");
  var nl = document.querySelector("#cboxLoadedContent");
  return { chyby: z, okno: ro, tlacidla: R, prepinace: prep, posun: nl ? [nl.scrollHeight, nl.clientHeight] : null };
})()`;

const STAV_PREPINACA = (id) => `(function () {${POMOC}
  var ch = document.getElementById(${JSON.stringify(id)}), l = ch.parentNode.querySelector(".cookiesSetting__item__state");
  var d = getComputedStyle(l, "::before"), g = getComputedStyle(l, "::after"), dr = farbyPozadia(d), gc = rgb(g.backgroundColor);
  return { zapnute: ch.checked, posun: g.transform, draha: d.backgroundImage !== "none" ? "gradient" : d.backgroundColor, kontrast: dr.length && gc ? Math.round(Math.min.apply(null, dr.map(function (c) { return kontrast(gc, c); })) * 10) / 10 : null };
})()`;

// ------------------------------------------------------------------ scenáre
const sFlagom = (S, novy) => (novy ? S.url + (S.url.includes("?") ? "&" : "?") + "novy=1" : S.url);
const ZACNI_OKNO = `(function () { window.__lcdCk.okno = []; window.__lcdCk.sleduj = true; return 1; })()`;
const KONIEC_OKNA = `(function () { window.__lcdCk.sleduj = false; return 1; })()`;
const OTVORENE = `!!document.querySelector("#cboxContent.cookiesDialog .cookiesSetting__bottom")`;
const ZATVORENE = `!document.querySelector("#cboxContent.cookiesDialog") && !document.querySelector("#cboxContent .cookiesSetting__form")`;
const LUXIA_VIDNO = `(function () { var f = document.querySelector('iframe[title="Luxia chat"]'); return !f || getComputedStyle(f).visibility !== "hidden"; })()`;
const LISTA_VIDNO = `(function () { var f = document.querySelector(".js-siteCookies .siteCookies__form"); return !!f && f.getBoundingClientRect().height > 0; })()`;

/** Prvý snímok, v ktorom je lišta na obrazovke: musí byť už karta C (inak sa mihne stará lišta Shoptetu). */
async function overPrvySnimok(s, S) {
  const p = await s.t.ev("window.__lcdCk && window.__lcdCk.prvy");
  over(p, "snímač nezachytil lištu v žiadnom snímku (čistý návštevník?)");
  const z = [];
  if (!/linear-gradient/.test(p.bg || "")) z.push("pozadie " + String(p.bg).slice(0, 60));
  if (p.radius !== "16px") z.push("rádius " + p.radius);
  if (p.nadpis !== JSON.stringify(S.nadpis)) z.push("nadpis " + p.nadpis);
  if (!/linear-gradient/.test(p.zlate || "")) z.push("tlačidlá nie sú zlaté: " + p.zlate);
  if (!p.tlacidla || Math.abs(p.tlacidla[0] - p.tlacidla[2]) > 1 || Math.abs(p.tlacidla[1] - p.tlacidla[3]) > 1) z.push("Odmietnuť ≠ Súhlasím " + JSON.stringify(p.tlacidla));
  over(!z.length, "PRVÝ SNÍMOK lišty (" + p.t + " ms) nie je karta C — mihla by sa stará lišta: " + z.join("; "));
  return p;
}

/** Snímky otvárania okna nastavení (od kliku po ustálenie): každý v štýle C a už na mieste (žiadne staré okno, žiadna animácia). */
async function overSnimkyOkna(s) {
  const o = await s.t.ev("window.__lcdCk.okno");
  over(o && o.length, "snímač nezachytil okno nastavení");
  const fin = o[o.length - 1].rect;
  const zle = o.filter((x) => !/linear-gradient/.test(x.bg) || x.rect.some((v, i) => Math.abs(v - fin[i]) > 2));
  over(!zle.length, zle.length + " z " + o.length + " snímok otvárania okna nie je okno C na mieste: " + JSON.stringify(zle.slice(0, 3)) + " (konečné " + JSON.stringify(fin) + ")");
  const bezTriedy = o.filter((x) => !x.trieda).length;
  return o.length + " snímok C" + (bezTriedy ? ", z toho " + bezTriedy + " pred triedou cookiesDialog" : "");
}

/** Otvorí okno nastavení (klik = async funkcia), overí snímky otvárania aj hotové okno. */
async function otvorOkno(s, klik, kde) {
  await s.t.ev(ZACNI_OKNO);
  await klik();
  await s.t.cakaj(OTVORENE, { ms: 15000, popis: "okno nastavení (" + kde + ")" });
  await pauza(1200); // ustálenie (Shoptet dá triedu cookiesDialog až v onComplete)
  await s.t.ev(KONIEC_OKNA);
  const sn = await overSnimkyOkna(s);
  // myš preč z okna: klik v päte (spodok stránky) necháva kurzor nad „Potvrdiť moje voľby“ a meral by sa stav :hover
  // (priesvitné pozadie .08 sa pri výpočte kontrastu berie ako plné) — meria sa pokojový stav okna
  await s.k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  await pauza(250);
  const o = await s.t.ev(OKNO);
  over(!o.chyba, o.chyba);
  over(!o.chyby.length, "okno nastavení (" + kde + "): " + o.chyby.join("; "));
  return { o, sn };
}

/** Zavrie okno skutočným klikom na krížik; chat Luxia späť. */
async function zavriOkno(s) {
  await s.t.klikni("#cboxClose", { popis: "zavrieť okno" });
  await s.t.cakaj(ZATVORENE, { ms: 8000, popis: "zavreté okno" });
  await pauza(300);
  over(await s.t.ev(LUXIA_VIDNO), "po zavretí okna ostal chat Luxia skrytý");
}

/** Odkaz „Nastavenia cookies“ v päte: text, trieda Shoptetu, tlačidlo, nenápadný ale čitateľný. */
const ODKAZ = `(function (text) {${POMOC}
  var b = document.querySelector("#footer .footer-bottom .lcd-cookies-odkaz");
  if (!b) return { chyba: "odkaz „" + text + "“ v päte (#footer .footer-bottom) chýba" };
  var z = [], c = getComputedStyle(b), pata = getComputedStyle(document.querySelector("#footer .footer-bottom"));
  if (b.textContent.trim() !== text) z.push("text " + JSON.stringify(b.textContent) + " ≠ " + text);
  if (!b.classList.contains("js-cookies-settings")) z.push("chýba trieda js-cookies-settings (Shoptet ho neobslúži)");
  if (b.tagName !== "BUTTON" || b.type !== "button") z.push("nie je <button type=button>");
  if (document.querySelectorAll(".lcd-cookies-odkaz").length !== 1) z.push("odkaz je na stránke " + document.querySelectorAll(".lcd-cookies-odkaz").length + "×");
  if (!vid(b)) z.push("nie je viditeľný");
  if (c.textDecorationLine.indexOf("underline") < 0) z.push("nie je podčiarknutý");
  var k = minKontrast(c.color, farbyPozadia(pata)); if (!(k >= 4.5)) z.push("kontrast " + k);
  if (parseFloat(c.fontSize) < 13) z.push("malé písmo " + c.fontSize);
  var r = rect(b); if (innerWidth < 768 && r.h < 24) z.push("telefón: dotyková plocha " + r.h + " px < 24");
  return { chyby: z, rect: r, farba: c.color, pismo: c.fontSize };
})`;
async function overOdkaz(s, S) {
  const od = await s.t.ev(ODKAZ + "(" + JSON.stringify(S.odkaz) + ")");
  over(!od.chyba, od.chyba);
  over(!od.chyby.length, "odkaz v päte: " + od.chyby.join("; "));
  return od;
}
async function snimkaPaty(s, cesta) {
  const k = `(function () { var b = document.querySelector("#footer .lcd-cookies-odkaz"); if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); return 1; })()`;
  await s.t.ev(k); await pauza(900); await s.t.ev(k); await pauza(400); // lenivé obrázky nad pätou posunú stránku
  await s.k.snimka(cesta);
}

/** bez-js: bundle zablokovaný — lišta aj okno nastavení sú karta C len z CSS v <head>, od prvého snímku. */
async function bezJs(ch, sirka, build, S, a) {
  const s = await novaStranka(ch, sirka, build, { bezJs: true });
  const info = [];
  try {
    await otvor(s, S.url);
    over(s.zablokovane >= 1, "bundle luxuryCar.js sa nezablokoval (" + s.zablokovane + " požiadaviek)");
    over(s.podvrhnute >= 1, "lokálne CSS sa nepodvrhlo");
    const p = await overPrvySnimok(s, S);
    info.push("prvý snímok " + p.t + " ms = karta C " + p.form[2] + "×" + p.form[3]);
    const k = await s.t.ev(KARTA + "(" + JSON.stringify(S.nadpis) + "," + TELEFON_MAX + ",false)");
    over(!k.chyba, k.chyba);
    over(!k.chyby.length, "karta C bez JS: " + k.chyby.join("; "));
    info.push(`hotová ${k.karta.w}×${k.karta.h}, tlačidlá ${k.tlacidla[0]}×${k.tlacidla[1]} = ${k.tlacidla[2]}×${k.tlacidla[3]}`);
    over(!(await s.t.ev(`!!document.querySelector(".lcd-cookies-odkaz")`)), "odkaz v päte je tu bez bundla (pridáva ho cookies.js)");
    if (a.snimky) await s.k.snimka(join(a.snimky, `bez-js-${S.meno}-${sirka}.png`));
    if (S.nastavenia) {
      // klik cez DOM: bez JS sa bublina Luxie nezdvihne nad kartu — tu sa overuje len CSS okna
      const { o, sn } = await otvorOkno(s, () => s.t.ev(`document.querySelector(".js-siteCookies .siteCookies__link").click()`), "bez JS");
      info.push(`okno ${o.okno.w}×${o.okno.h} (${sn})`);
    }
    over(!(await s.t.ev(`document.documentElement.classList.contains("lcd1v-cookies")`)), "trieda lcd1v-cookies naskočila bez bundla");
    over(!s.posty.length, "odišiel POST: " + JSON.stringify(s.posty));
    return { info: info.join("; ") };
  } finally { await s.k.zavri(); }
}

/** karta (bežný návštevník bez flagu; novy = s ?novy=1): prvý snímok, karta C, Luxia, odkaz v päte, okno nastavení. */
async function karta(ch, sirka, build, S, a, { novy = false } = {}) {
  const s = await novaStranka(ch, sirka, build);
  const info = [];
  try {
    await otvor(s, sFlagom(S, novy));
    over(s.podvrhnute >= 2, "lokálny build sa nepodvrhol");
    const p = await overPrvySnimok(s, S);
    info.push(`prvý snímok ${p.t} ms = karta C (bundle ${p.bundle ? "už v DOM" : "ešte nenačítaný"})`);
    const k = await s.t.ev(KARTA + "(" + JSON.stringify(S.nadpis) + "," + TELEFON_MAX + ",true)");
    over(!k.chyba, k.chyba);
    over(!k.chyby.length, "karta C: " + k.chyby.join("; "));
    info.push(`karta ${k.karta.w}×${k.karta.h} (${k.podiel} % výšky), tlačidlá ${k.tlacidla[0]}×${k.tlacidla[1]} = ${k.tlacidla[2]}×${k.tlacidla[3]}, kontrast ${k.kontrastTlacidla}`);
    // chat Luxia: počkaj na iframe a (PC) na uvítanie — kontrola počas ~8 s (s flagom ~4 s), nech chytí bublinu aj uvítanie
    await s.t.cakaj(`!!document.querySelector('iframe[title="Luxia chat"]')`, { ms: 15000, popis: "chat Luxia" }).catch(() => {});
    let L;
    for (let i = 0; i < (novy ? 4 : 8); i++) {
      L = await s.t.ev(LUXIA_KARTA);
      over(!L.chyba, L.chyba);
      over(!L.chyby.length, "bublina Luxie vs. karta: " + L.chyby.join("; "));
      await pauza(1000);
    }
    info.push("Luxia " + L.luxia);
    if (a.snimky && !novy) await s.k.snimka(join(a.snimky, `lista-${S.meno}-${sirka}.png`));
    const od = await overOdkaz(s, S);
    info.push(`päta „${S.odkaz}“ ${od.rect.w}×${od.rect.h}`);
    if (novy || !S.nastavenia) return { info: info.join("; ") };
    // okno nastavení: skutočný klik na „Nastavenie“ (nič ho nesmie zakrývať)
    const { o, sn } = await otvorOkno(s, () => s.t.klikni(".js-siteCookies .siteCookies__link", { popis: "Nastavenie" }), "Nastavenie na lište");
    info.push(`okno ${o.okno.w}×${o.okno.h} na y ${o.okno.y} (${sn}), Všetko vypnuté ${o.tlacidla.vypnut.w}×${o.tlacidla.vypnut.h} = Povoliť všetko ${o.tlacidla.povolit.w}×${o.tlacidla.povolit.h}, Potvrdiť ${o.tlacidla.potvrdit.w}×${o.tlacidla.potvrdit.h}`);
    if (a.snimky) await s.k.snimka(join(a.snimky, `nastavenia-${S.meno}-${sirka}.png`));
    // prepínače: skutočný klik zapne (zlatá dráha, gombík vpravo), druhý klik vypne; nič sa neodosiela
    const postyPred = s.posty.length;
    for (const id of ["cookiesAnalytics", "cookiesPersonalisation"]) {
      const v0 = await s.t.ev(STAV_PREPINACA(id));
      await s.t.klikni(`label.cookiesSetting__item__status[for=${id}]`, { popis: "prepínač " + id });
      await pauza(350);
      const v1 = await s.t.ev(STAV_PREPINACA(id));
      over(!v0.zapnute && v1.zapnute, id + ": klik na prepínač ho nezapol " + JSON.stringify([v0, v1]));
      over(v1.draha === "gradient" && v1.posun !== v0.posun && v1.kontrast >= 3, id + ": zapnutý prepínač nevyzerá zapnuto " + JSON.stringify([v0, v1]));
      if (id === "cookiesAnalytics" && a.snimky) await s.k.snimka(join(a.snimky, `nastavenia-${S.meno}-${sirka}-zapnute.png`));
      await s.t.klikni(`label.cookiesSetting__item__status[for=${id}]`, { popis: "prepínač " + id + " späť" });
      await pauza(350);
      const v2 = await s.t.ev(STAV_PREPINACA(id));
      over(!v2.zapnute && v2.posun === v0.posun, id + ": druhý klik prepínač nevypol " + JSON.stringify(v2));
    }
    over(s.posty.length === postyPred, "prepínanie odoslalo POST: " + JSON.stringify(s.posty.slice(postyPred)));
    info.push("prepínače vyp -> zap -> vyp");
    // zavrieť: skutočný klik na krížik -> karta späť, chat späť a nezakrýva ju
    await zavriOkno(s);
    over(await s.t.ev(LISTA_VIDNO), "po zavretí okna nie je lišta späť");
    const L2 = await s.t.ev(LUXIA_KARTA);
    over(!L2.chyba, "po zavretí okna: " + L2.chyba);
    over(!L2.chyby.length, "po zavretí okna: " + L2.chyby.join("; "));
    // odkaz v päte, kým je lišta ešte na obrazovke (päta leží pod ňou -> klik cez DOM): to isté okno Shoptetu
    const z = await otvorOkno(s, () => s.t.ev(`document.querySelector("#footer .lcd-cookies-odkaz").click()`), "odkaz v päte pred súhlasom");
    await zavriOkno(s);
    over(await s.t.ev(LISTA_VIDNO), "po zavretí okna z päty zmizla lišta (súhlas nebol daný)");
    over(!s.posty.length, "odišiel POST: " + JSON.stringify(s.posty));
    info.push("zavretie OK; päta -> okno (" + z.sn + ")");
    return { info: info.join("; ") };
  } finally {
    if (a.vypis && s.posty.length) console.log("      POST: " + JSON.stringify(s.posty));
    await s.k.zavri();
  }
}

async function suhlas(ch, sirka, build, S, a) {
  const s = await novaStranka(ch, sirka, build);
  try {
    await otvor(s, S.url);
    await s.t.cakaj(`document.documentElement.classList.contains("lcd1v-cookies") && !!document.querySelector(".js-siteCookies .siteCookies__form")`, { ms: 8000, popis: "karta C" });
    await s.t.klikni(".js-siteCookies .siteCookies__button[value=all]", { popis: "Súhlasím" });
    const koniec = Date.now() + 6000;
    while (Date.now() < koniec && !s.posty.some((p) => p.suhlas)) await pauza(150);
    const p = s.posty.filter((x) => x.suhlas);
    over(p.length, "klik na Súhlasím neodoslal POST súhlasu (tlačidlo nefunguje?)");
    over(p.every((x) => x.akcia === "zrušené" && !jeOdmietnutie(x.body)), "POST súhlasu nebol zrušený: " + JSON.stringify(p));
    over(!s.posty.some((x) => x.akcia === "povolené"), "odišiel povolený POST: " + JSON.stringify(s.posty));
    return { info: "Súhlasím -> POST " + p.map((x) => x.body.replace(/cookieId=[^&]+/, "cookieId=…")).join(" | ") + " ZRUŠENÝ" };
  } finally { await s.k.zavri(); }
}

async function odmietnutie(ch, sirka, build, S, a) {
  const s = await novaStranka(ch, sirka, build);
  try {
    await otvor(s, S.url);
    await s.t.cakaj(`document.documentElement.classList.contains("lcd1v-cookies") && !!document.querySelector(".js-siteCookies .siteCookies__form")`, { ms: 8000, popis: "karta C" });
    await s.t.cakaj(`!!document.querySelector('iframe[title="Luxia chat"]')`, { ms: 15000, popis: "chat Luxia" }).catch(() => {});
    await pauza(1500);
    const pred = await s.t.ev(`(function () { var f = document.querySelector('iframe[title="Luxia chat"]'); return f ? { bottom: getComputedStyle(f).bottom, inline: f.style.bottom } : null; })()`);
    await s.t.klikni(".js-siteCookies .siteCookies__button[value=reject]", { popis: "Odmietnuť" });
    await s.t.cakaj(`!document.querySelector(".js-siteCookies") || !(document.querySelector(".js-siteCookies").getBoundingClientRect().height > 0)`, { ms: 8000, popis: "lišta zmizla po Odmietnuť" });
    await pauza(800);
    const p = s.posty.filter((x) => x.suhlas);
    over(p.length === 1 && p[0].akcia === "povolené" && jeOdmietnutie(p[0].body), "POST odmietnutia: " + JSON.stringify(s.posty));
    const po = await s.t.ev(`(function () { var f = document.querySelector('iframe[title="Luxia chat"]'); return f ? { bottom: getComputedStyle(f).bottom, inline: f.style.bottom } : null; })()`);
    if (po) over(po.bottom === po.inline, "po odmietnutí ostal chat Luxia zdvihnutý: " + JSON.stringify({ pred, po }));
    const cookie = await s.t.ev(`/(^|;\\s*)CookiesConsent=/.test(document.cookie)`);
    over(cookie, "po odmietnutí chýba cookie CookiesConsent");
    const info = ["Odmietnuť -> POST " + p[0].body.replace(/cookieId=[^&]+/, "cookieId=…") + " povolený, lišta preč, Luxia " + (pred ? pred.bottom + " -> " + po.bottom : "nenačítaná")];
    // súhlas sa dá zmeniť aj bez lišty: odkaz v päte skutočným klikom otvorí okno s uloženou voľbou (všetko vypnuté)
    const od = await overOdkaz(s, S);
    if (a.snimky) await snimkaPaty(s, join(a.snimky, `pata-${S.meno}-${sirka}.png`));
    const { o, sn } = await otvorOkno(s, () => s.t.klikni("#footer .footer-bottom .lcd-cookies-odkaz", { popis: S.odkaz + " v päte" }), "odkaz v päte po odmietnutí");
    if (a.snimky) await s.k.snimka(join(a.snimky, `pata-nastavenia-${S.meno}-${sirka}.png`));
    await zavriOkno(s);
    over(!(await s.t.ev(`(function () { var f = document.querySelector(".js-siteCookies"); return !!f && f.getBoundingClientRect().height > 0; })()`)), "po zavretí okna z päty sa lišta vrátila");
    over(s.posty.length === 1, "okno z päty odoslalo POST: " + JSON.stringify(s.posty.slice(1)));
    info.push(`päta „${S.odkaz}“ ${od.rect.w}×${od.rect.h} klik -> okno ${o.okno.w}×${o.okno.h} (${sn}), prepínače vypnuté podľa uloženého súhlasu, zavreté`);
    return { info: info.join("; ") };
  } finally { await s.k.zavri(); }
}

// ------------------------------------------------------------------ beh
async function main() {
  const a = argumenty(process.argv.slice(2));
  if (a.snimky) mkdirSync(a.snimky, { recursive: true });
  const build = priprav(a);
  const stranky = STRANKY.filter((S) => !(a.bezCz && S.cz));
  console.log(`Cookie lišta C pre všetkých — ${build.popis}\n  stránky: ${stranky.map((S) => S.meno).join(", ")}  šírky: ${a.sirky.join(", ")}`);
  const ulohy = [];
  const P598 = stranky.find((x) => x.meno === "598");
  for (const sirka of a.sirky) {
    for (const S of stranky.filter((x) => !x.cz)) ulohy.push({ m: "bez-js " + S.meno, sirka, fn: bezJs, S });
    for (const S of stranky) ulohy.push({ m: "karta " + S.meno, sirka, fn: karta, S });
    if (P598) ulohy.push({ m: "flag 598", sirka, fn: (c, w, b, S, x) => karta(c, w, b, S, x, { novy: true }), S: P598 });
    ulohy.push({ m: "suhlas", sirka, fn: suhlas, S: stranky[0] });
    ulohy.push({ m: "odmietnutie", sirka, fn: odmietnutie, S: stranky[0] });
  }
  const ch = await spustiChrome({ okno: a.okno });
  let zle = 0;
  try {
    for (const u of ulohy) {
      const t0 = Date.now();
      try {
        const r = await u.fn(ch, u.sirka, build, u.S, a);
        console.log(`  OK      ${String(u.sirka).padEnd(5)}${u.m.padEnd(22)}${((Date.now() - t0) / 1000).toFixed(0).padStart(3)} s  ${r.info}`);
      } catch (e) {
        zle++;
        console.log(`  ZLYHAL  ${String(u.sirka).padEnd(5)}${u.m.padEnd(22)}${((Date.now() - t0) / 1000).toFixed(0).padStart(3)} s  ${e instanceof Zlyhanie ? e.message : (e.stack || e.message)}`);
      }
    }
  } finally { await ch.zavri(); }
  console.log(`\n${ulohy.length - zle}/${ulohy.length} OK${a.snimky ? "  snímky: " + a.snimky : ""}`);
  return zle ? 1 : 0;
}

main().then((k) => process.exit(k), (e) => { console.error(e instanceof ChybaPouzitia ? "CHYBA: " + e.message : e); process.exit(2); });
