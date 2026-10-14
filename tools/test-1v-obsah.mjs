#!/usr/bin/env node
// E2E test OBSAHU pod konfigurátorom 1V na ŽIVEJ SK Diamond Line 598 s lokálnym buildom (13. 10. 2026, docs/1v-obsah.md).
//
//   node tools/test-1v-obsah.mjs                          # bez flagu 1280+390, ?novy=1 na 360/390/768/1280, snímky vs návrh
//   node tools/test-1v-obsah.mjs --skupina b --sirka 390  # len kontroly skupiny B, ?novy=1 len 390
//   node tools/test-1v-obsah.mjs --miesto popis           # SPUSTENIE: obsah v Popise produktu namiesto banneru v pätičke
//   node tools/test-1v-obsah.mjs --miesto zive            # nič nevkladá: obsah, ktorý už je v admine (+ porovná data-lcd-v s buildom)
//   node tools/test-1v-obsah.mjs --snimky C:/tmp/obsah --snimky-sirky 390,1280 | --bez-snimok | --navrh <url>
//   ďalšie: --len bez|novy · --sirka-bez 1280,390 · --bez-zakladu · --paralelne 3 · --okno · --bez-drop · --vypis
//
// Čo robí: postaví admin HTML (tools/build-admin-html.mjs --vystup), JS a CSS (ako CI) do dočasného priečinka, otvorí živú
// 598 a do dokumentu vloží dist/p1v-598-*.sk.html (tools/test-1v/obsah-spolocne.mjs: pätička = test fáza, popis =
// spustenie) + sondu (img lazy 1×1). Kontroluje:
//   bez flagu: korene sú display:none, ich stĺpce pätičky skryté, ŽIADNY obrázok/video obsahu ani sonda sa nestiahli,
//              pätička a výška stránky ako bez obsahu, žiadne nové chyby v konzole, žiadny vodorovný posun;
//   ?novy=1:   body.lcd-1v + .lcd-1v-obsah, korene v .p1v-miesto pred záložkami v poradí, viditeľné, starý popis skrytý,
//              štýly titulky platia aj na koreni (--gold), sonda sa po posune stiahne, žiadne chyby (konzola, __lcd1v.chyby),
//              žiadny vodorovný posun ani prvok za okrajom okna (360/390/768/1280), kontroly skupín tools/test-1v/obsah-<a-d>.mjs;
//   snímky:    každá neprázdna sekcia na webe + tá istá časť návrhu v26 + obe vedľa seba:
//              <snimky>/<sekcia>/{web,navrh,porovnanie}-<šírka>.png (prázdna sekcia = stub, len návrh).
// Bezpečnosť: POST /action/Cart/addCartItem sa ZRUŠÍ, iný POST na /action/ tiež; merače zablokované; cookies odmietnuté;
// žiadna objednávka, žiadny admin, žiadne prihlásenie.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spustiChrome } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { priprav, novaStranka, otvor598, adresyMedii, SONDA, MERACE, pauza } from "./test-1v/obsah-spolocne.mjs";
import * as skA from "./test-1v/obsah-a.mjs";
import * as skB from "./test-1v/obsah-b.mjs";
import * as skC from "./test-1v/obsah-c.mjs";
import * as skD from "./test-1v/obsah-d.mjs";

const SKUPINY = { a: skA, b: skB, c: skC, d: skD };
const NAVRH = "http://127.0.0.1:8952/jednovrstvove.html";
const SUM_ZDROJE = /twitter|rostiapp|luxia|recaptcha|facebook|google|gstatic|youtube|hotjar|tiktok|smartsupp|ecomail|heureka|seznam|bing|clarity|trustindex/i;
const normChyba = (c) => (c.druh + ": " + c.text).replace(/\d+/g, "#").replace(/\s+/g, " ").slice(0, 200);
const naseChyby = (chyby) => chyby.filter((c) => !SUM_ZDROJE.test(c.zdroj || "") && !SUM_ZDROJE.test(c.text || ""));
const cisla = (s) => s.split(",").map((x) => Number(x.trim())).filter(Boolean);

function argumenty(argv) {
  const a = { sirkyNovy: [360, 390, 768, 1280], sirkyBez: [1280, 390], snimkySirky: [390, 1280], skupiny: Object.keys(SKUPINY), miesto: "paticka",
    snimky: join(tmpdir(), "lcd-1v-obsah-snimky"), bezSnimok: false, navrh: NAVRH, len: null, zaklad: true, paralelne: 3, okno: false, bezDrop: false, vypis: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new Error(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--sirka") a.sirkyNovy = cisla(dalsi());
    else if (x === "--sirka-bez") a.sirkyBez = cisla(dalsi());
    else if (x === "--snimky-sirky") a.snimkySirky = cisla(dalsi());
    else if (x === "--skupina") a.skupiny = dalsi().split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    else if (x === "--miesto") a.miesto = dalsi();
    else if (x === "--snimky") a.snimky = resolve(dalsi());
    else if (x === "--bez-snimok") a.bezSnimok = true;
    else if (x === "--navrh") a.navrh = dalsi();
    else if (x === "--len") a.len = dalsi();
    else if (x === "--bez-zakladu") a.zaklad = false;
    else if (x === "--paralelne") a.paralelne = Math.max(1, Number(dalsi()) || 1);
    else if (x === "--okno") a.okno = true;
    else if (x === "--bez-drop") a.bezDrop = true;
    else if (x === "--vypis") a.vypis = true;
    else if (x === "--help" || x === "-h") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 8).join("\n")); process.exit(0); }
    else throw new Error("neznámy prepínač " + x);
  }
  if (!["paticka", "popis", "zive"].includes(a.miesto)) throw new Error("--miesto je paticka | popis | zive");
  a.skupiny.forEach((g) => { if (!SKUPINY[g]) throw new Error("neznáma skupina " + g + " (a, b, c, d)"); });
  if (a.len === "bez") a.sirkyNovy = [];
  if (a.len === "novy") a.sirkyBez = [];
  return a;
}

// ------------------------------------------------------------------ v stránke
const STAV = `(function () {
  function disp(e) { return e ? getComputedStyle(e).display : null; }
  var korene = [].slice.call(document.querySelectorAll('[data-lcd-cast^="p1v-598-"]'));
  var m = document.querySelector(".p1v-miesto");
  var f = document.querySelector(".custom-footer");
  var cw = document.documentElement.clientWidth;
  var presahy = [];
  if (m) {
    var vsetky = m.querySelectorAll("*");
    for (var i = 0; i < vsetky.length && presahy.length < 6; i++) {
      var e = vsetky[i], r = e.getBoundingClientRect();
      if (!r.width || !r.height || (r.right <= cw + 1 && r.left >= -1)) continue;
      var a = e.parentElement, orez = false;
      while (a && !a.hasAttribute("data-lcd-cast")) { if (getComputedStyle(a).overflowX !== "visible") { orez = true; break; } a = a.parentElement; }
      if (!orez) presahy.push((e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\\s+/).slice(0, 3).join(".") : "")) + " " + Math.round(r.left) + "–" + Math.round(r.right) + " px");
    }
  }
  var bd = document.querySelector(".basic-description");
  return {
    lcd1v: document.body.classList.contains("lcd-1v"), obsah: document.body.classList.contains("lcd-1v-obsah"),
    chyby1v: window.__lcd1v ? window.__lcd1v.chyby.slice() : null,
    korene: korene.map(function (k) { var st = k.closest(".custom-footer > div"); var r = k.getBoundingClientRect();
      return { cast: k.getAttribute("data-lcd-cast"), v: k.getAttribute("data-lcd-v"), display: disp(k), h: Math.round(r.height), vMieste: !!(m && k.parentNode === m), stlpec: st ? disp(st) : null, gold: getComputedStyle(k).getPropertyValue("--gold").trim() }; }),
    miesto: m ? { deti: [].map.call(m.children, function (c) { return c.getAttribute("data-lcd-cast") || c.className; }), za: m.nextElementSibling ? String(m.nextElementSibling.className) : null } : null,
    zalozky: disp(document.querySelector(".p-detail > .shp-tabs-wrapper")),
    staryPopisViditelny: !!(bd && bd.getClientRects().length && bd.getBoundingClientRect().height > 0),
    prazdneStlpce: [].map.call(document.querySelectorAll(".custom-footer > div[data-p1v-prazdny]"), disp),
    paticka: f ? { h: Math.round(f.getBoundingClientRect().height), stlpce: [].filter.call(f.children, function (c) { return getComputedStyle(c).display !== "none"; }).length } : null,
    docH: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: cw, presahy: presahy
  };
})()`;

// prvky návrhu / webu pre snímku: spoločný obdĺžnik (súradnice stránky) po prejdení prvku (lazy obrázky) + skrytie fixných prvkov
const PRIPRAV_SNIMKU = `(async function (kusy) {
  function najdi(k) {
    var all = [].slice.call(document.querySelectorAll(k.sel));
    if (k.text) all = all.filter(function (e) { return (e.textContent || "").indexOf(k.text) >= 0; });
    if (k.za) { var z = document.querySelector(k.za); all = all.filter(function (e) { return z && (z.compareDocumentPosition(e) & 4); }); return all[0]; }
    if (k.pred) { var p = document.querySelector(k.pred); all = all.filter(function (e) { return p && (p.compareDocumentPosition(e) & 2); }); return all[all.length - 1]; }
    return all[0];
  }
  var el = kusy.map(najdi).filter(function (e) { return e && e.getClientRects().length && e.getBoundingClientRect().height > 0; });
  if (!el.length) return null;
  var spat = function () { var t = Infinity, b = -Infinity; el.forEach(function (e) { var r = e.getBoundingClientRect(); t = Math.min(t, r.top + scrollY); b = Math.max(b, r.bottom + scrollY); }); return { y: t, h: b - t }; };
  var o = spat();
  for (var y = o.y - innerHeight; y < o.y + o.h; y += Math.round(innerHeight * 0.8)) { scrollTo({ top: Math.max(0, y), behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 160); }); }
  var obr = [].concat.apply([], el.map(function (e) { return [].slice.call(e.querySelectorAll("img")); }));
  await Promise.race([Promise.all(obr.map(function (i) { return i.complete ? 0 : new Promise(function (r) { i.addEventListener("load", r); i.addEventListener("error", r); }); })), new Promise(function (r) { setTimeout(r, 4000); })]);
  scrollTo({ top: Math.max(0, spat().y - 10), behavior: "instant" });
  await new Promise(function (r) { setTimeout(r, 400); });
  if (!document.getElementById("p1v-skry-styl")) { var s = document.createElement("style"); s.id = "p1v-skry-styl"; s.textContent = "[data-p1v-skry]{visibility:hidden !important}"; document.head.appendChild(s); }
  [].forEach.call(document.querySelectorAll("body *"), function (x) {
    var poz = getComputedStyle(x).position;
    if (poz !== "fixed" && poz !== "sticky") return; // hlavička, lišta, chat, linka čítania by prekryli sekciu
    if (el.some(function (e) { return e.contains(x) || x.contains(e); })) return;
    x.setAttribute("data-p1v-skry", "");
  });
  var r = spat();
  return { x: 0, y: Math.round(r.y), w: document.documentElement.clientWidth, h: Math.round(Math.min(r.h, 7000)) };
})`;

async function snimkaOblasti(k, kusy, cesta) {
  const o = await k.ev(`${PRIPRAV_SNIMKU}(${JSON.stringify(kusy)})`);
  if (!o || o.h < 2) return null;
  const r = await k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: o.x, y: o.y, width: o.w, height: o.h, scale: 1 } });
  writeFileSync(cesta, Buffer.from(r.data, "base64"));
  await k.ev(`[].forEach.call(document.querySelectorAll("[data-p1v-skry]"), function (x) { x.removeAttribute("data-p1v-skry"); })`).catch(() => {});
  return o;
}

// ------------------------------------------------------------------ beh
async function main() {
  const a = argumenty(process.argv.slice(2));
  console.log("Test obsahu 1V — miesto: " + { popis: "Popis produktu (spustenie, vložené testom)", paticka: "banner v pätičke (test fáza, vložené testom)", zive: "živý admin (nič sa nevkladá)" }[a.miesto]);
  const build = priprav({ bezDrop: a.bezDrop });
  console.log("  " + build.popis);
  const media = [...new Set(build.admin.casti.flatMap((c) => adresyMedii(c.html)))];
  const sekcie = build.admin.casti.flatMap((c) => c.sekcie.map((s) => ({ ...s, cast: c.cast })));
  const plne = sekcie.filter((s) => s.znaky > 0).map((s) => s.sekcia);
  console.log(`  sekcie: ${sekcie.length} (${plne.length} s obsahom, ${sekcie.length - plne.length} stub), médiá v HTML: ${media.length}`);
  const mapa = a.skupiny.flatMap((g) => SKUPINY[g].sekcie.map((s) => ({ ...s, skupina: g })));
  for (const s of sekcie) if (!Object.values(SKUPINY).some((g) => g.sekcie.some((x) => x.meno === s.sekcia))) console.log(`  POZOR: sekcia ${s.sekcia} nemá mapu v tools/test-1v/obsah-*.mjs (snímka návrhu chýba)`);

  // navrh dostupný?
  let navrhOk = !a.bezSnimok;
  if (navrhOk) try { const r = await fetch(a.navrh, { method: "HEAD" }); navrhOk = r.ok; } catch { navrhOk = false; }
  if (!a.bezSnimok && !navrhOk) console.log(`  POZOR: návrh ${a.navrh} nie je dostupný — snímky len z webu (spusti server návrhu alebo --navrh <url>)`);
  if (!a.bezSnimok) mkdirSync(a.snimky, { recursive: true });

  const ulohy = [];
  const zaklady = new Map(); // "bez|novy-<sirka>" -> Promise({ chyby:Set, stav })
  const zakladSirka = (novy, sirka) => (novy ? (sirka < 768 ? 390 : 1280) : sirka);
  if (a.zaklad) {
    for (const sirka of new Set(a.sirkyBez)) ulohy.push({ druh: "zaklad", novy: false, sirka });
    for (const sirka of new Set(a.sirkyNovy.map((w) => zakladSirka(true, w)))) ulohy.push({ druh: "zaklad", novy: true, sirka });
  }
  for (const sirka of a.sirkyBez) ulohy.push({ druh: "bez", sirka });
  for (const sirka of a.sirkyNovy) ulohy.push({ druh: "novy", sirka });
  if (navrhOk) for (const sirka of a.snimkySirky) ulohy.push({ druh: "navrh", sirka });
  const cakaj = new Map();
  for (const u of ulohy) if (u.druh === "zaklad") { let r; const p = new Promise((x) => { r = x; }); cakaj.set((u.novy ? "novy-" : "bez-") + u.sirka, { p, r }); zaklady.set((u.novy ? "novy-" : "bez-") + u.sirka, p); }

  const vysledky = [];
  let dalsia = 0;
  async function pracovnik() {
    while (dalsia < ulohy.length) {
      const u = ulohy[dalsia++];
      const t0 = Date.now();
      const logy = [];
      const log = (x) => logy.push(x);
      const ch = await spustiChrome({ okno: a.okno });
      const v = { uloha: u.druh + " " + u.sirka, chyby: [], info: [] };
      const zle = (podm, sprava) => { if (!podm) v.chyby.push(sprava); };
      try {
        if (u.druh === "navrh") {
          const k = await ch.novaKarta({ sirka: u.sirka });
          await k.posli("Network.setBlockedURLs", { urls: MERACE });
          await k.chod(a.navrh);
          await k.ev(`document.fonts ? document.fonts.ready.then(function () { return 1; }) : 1`).catch(() => {});
          await pauza(1500);
          let n = 0;
          for (const s of mapa) {
            if (!s.navrh || !s.navrh.length) continue;
            mkdirSync(join(a.snimky, s.meno), { recursive: true });
            const o = await snimkaOblasti(k, s.navrh, join(a.snimky, s.meno, `navrh-${u.sirka}.png`)).catch((e) => { log(s.meno + ": " + e.message); return null; });
            if (o) n++; else v.info.push("návrh: " + s.meno + " nenájdené");
          }
          v.info.unshift(`${n} snímok návrhu`);
        } else {
          const novy = u.druh === "novy" || (u.druh === "zaklad" && u.novy);
          const s = await novaStranka(ch, u.sirka, build, { vlozit: u.druh !== "zaklad" && a.miesto !== "zive", miesto: a.miesto, log });
          await otvor598(s, { novy });
          const st = await s.k.ev(STAV);
          if (u.druh === "zaklad") {
            cakaj.get((u.novy ? "novy-" : "bez-") + u.sirka).r({ chyby: new Set(naseChyby(s.k.chyby).map(normChyba)), st });
            v.info.push(`základ ${novy ? "?novy=1" : "bez flagu"} (bez obsahu): výška ${st.docH} px, pätička ${st.paticka ? st.paticka.h + " px / " + st.paticka.stlpce + " stĺpcov" : "?"}`);
          } else {
            if (a.miesto !== "zive") zle(s.vlozene && s.vlozene.ok, "obsah sa nevložil do stránky: " + (s.vlozene ? s.vlozene.popis : "dokument 598 sa nezachytil"));
            zle(st.korene.length === build.admin.casti.length, `korene obsahu na stránke: ${st.korene.length}, čakám ${build.admin.casti.length}`);
            if (a.miesto === "zive") for (const c of build.admin.casti) {
              const k = st.korene.find((x) => x.cast === c.cast);
              zle(k && k.v === c.hash, `${c.cast}: v admine je data-lcd-v ${k ? k.v : "—"}, build ${c.hash} (admin nie je aktuálny alebo ho niekto ručne zmenil)`);
            }
            zle(st.sw <= st.cw, `vodorovný posun stránky: scrollWidth ${st.sw} > ${st.cw}`);
            zle(s.inePosty.length === 0, "nečakaný zápis na server (zrušený): " + s.inePosty.join(", "));
            zle(s.posty.length === 0, "nečakané vloženie do košíka (zrušené)");
            if (u.druh === "bez") {
              zle(!st.lcd1v && !st.miesto, "bez flagu je body.lcd-1v alebo .p1v-miesto");
              for (const k of st.korene) {
                zle(k.display === "none", `${k.cast}: bez flagu display ${k.display} (má byť none)`);
                if (k.stlpec !== null) zle(k.stlpec === "none", `${k.cast}: stĺpec pätičky bez flagu display ${k.stlpec} (má byť none)`);
              }
              const stiahnute = s.poziadavky.filter((x) => x.indexOf(SONDA) === 0 || media.some((m) => x.split("?")[0] === m.split("?")[0]));
              zle(stiahnute.length === 0, "bez flagu sa stiahli médiá obsahu: " + stiahnute.slice(0, 5).join(", "));
              const z = await zaklady.get("bez-" + u.sirka);
              if (z) {
                const nove = naseChyby(s.k.chyby).filter((c) => !z.chyby.has(normChyba(c)));
                zle(!nove.length, "nové chyby v konzole: " + nove.map((c) => c.druh + ": " + c.text).join(" | "));
                if (z.st.paticka && st.paticka) zle(z.st.paticka.stlpce === st.paticka.stlpce && Math.abs(z.st.paticka.h - st.paticka.h) <= 2,
                  `pätička sa zmenila: ${z.st.paticka.h} px / ${z.st.paticka.stlpce} stĺpcov -> ${st.paticka.h} px / ${st.paticka.stlpce}`);
                const dH = st.docH - z.st.docH;
                if (a.miesto === "paticka") zle(Math.abs(dH) <= 40, `výška stránky sa zmenila o ${dH} px (bez obsahu ${z.st.docH}; ±10 px kolíše aj samo — konfigurátor)`);
                v.info.push(`výška ${dH >= 0 ? "+" : ""}${dH} px oproti stránke bez obsahu`);
              }
              v.info.push(`${st.korene.length} korene skryté, 0 z ${media.length} médií + sondy stiahnuté`);
            } else {
              zle(st.lcd1v, "?novy=1, ale body.lcd-1v chýba" + (st.chyby1v && st.chyby1v.length ? " — " + st.chyby1v.join("; ") : ""));
              zle(st.obsah, "body.lcd-1v-obsah chýba (obsah.js nenašiel korene?)");
              zle(!st.chyby1v || !st.chyby1v.length, "window.__lcd1v.chyby: " + (st.chyby1v || []).join("; "));
              zle(st.miesto && /shp-tabs-wrapper/.test(st.miesto.za || ""), ".p1v-miesto nie je hneď pred záložkami produktu (za ním: " + (st.miesto && st.miesto.za) + ")");
              const poradie = st.miesto ? st.miesto.deti.join(",") : "";
              zle(poradie === build.admin.casti.map((c) => c.cast).join(","), "poradie v .p1v-miesto: " + poradie);
              for (const k of st.korene) {
                zle(k.vMieste && k.display === "block", `${k.cast}: display ${k.display}, v .p1v-miesto ${k.vMieste}`);
                zle(k.gold === "#c49b31", `${k.cast}: štýly titulky (LCD-HOME) na koreni neplatia (--gold „${k.gold}“)`);
              }
              zle(st.zalozky === "none" && !st.staryPopisViditelny, `starý popis je viditeľný (záložky ${st.zalozky})`);
              if (a.miesto === "paticka") zle(st.prazdneStlpce.length === build.admin.casti.length && st.prazdneStlpce.every((d) => d === "none"), "prázdne stĺpce pätičky: " + JSON.stringify(st.prazdneStlpce));
              else zle(st.prazdneStlpce.every((d) => d === "none"), "prázdne stĺpce pätičky viditeľné: " + JSON.stringify(st.prazdneStlpce));
              zle(!st.presahy.length, "prvky obsahu za okrajom okna (" + st.cw + " px): " + st.presahy.join(", "));
              // sonda: po posune k nej sa stiahne (meranie požiadaviek funguje, brána sa otvorila)
              const sondy = await s.k.ev(`[].map.call(document.querySelectorAll(".p1v-miesto img.p1v-sonda"), function (i) { return i.getAttribute("src"); })`);
              for (const src of sondy) {
                await s.k.ev(`(function () { var i = document.querySelector('.p1v-miesto img.p1v-sonda[src="${src}"]'); if (i) i.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
                await pauza(900);
                zle(s.poziadavky.some((x) => x === src), "sonda sa s flagom nestiahla: " + src);
              }
              // kontroly skupín
              const t = vytvorT(s.k, { novy: true, log });
              t.sekcia = (meno) => `[data-lcd-sekcia="${meno}"]`;
              t.je = (meno) => s.k.ev(`!!document.querySelector('.p1v-miesto [data-lcd-sekcia="${meno}"]')`);
              for (const g of a.skupiny) {
                try {
                  const r = (await SKUPINY[g].kontroly(t)) || [];
                  for (const x of r) zle(x.ok, `skupina ${g.toUpperCase()}: ${x.popis}`);
                  if (r.length) v.info.push(`skupina ${g.toUpperCase()}: ${r.filter((x) => x.ok).length}/${r.length} kontrol OK`);
                } catch (e) { v.chyby.push(`skupina ${g.toUpperCase()}: výnimka ${e && e.message ? e.message : e}`); }
              }
              const z = await zaklady.get("novy-" + zakladSirka(true, u.sirka));
              if (z) {
                const nove = naseChyby(s.k.chyby).filter((c) => !z.chyby.has(normChyba(c)));
                zle(!nove.length, "nové chyby v konzole: " + nove.map((c) => c.druh + ": " + c.text).join(" | "));
              }
              // snímky sekcií webu
              if (!a.bezSnimok && a.snimkySirky.includes(u.sirka)) {
                let n = 0;
                for (const meno of plne.filter((m) => a.skupiny.includes(m[0]))) {
                  mkdirSync(join(a.snimky, meno), { recursive: true });
                  const o = await snimkaOblasti(s.k, [{ sel: `.p1v-miesto [data-lcd-sekcia="${meno}"]` }], join(a.snimky, meno, `web-${u.sirka}.png`)).catch((e) => { log(meno + ": " + e.message); return null; });
                  if (o) n++; else v.info.push("web: " + meno + " bez snímky (výška 0?)");
                }
                v.info.push(`${n} snímok sekcií`);
              }
              v.info.push(`${st.korene.length} korene na mieste, výška stránky ${st.docH} px`);
            }
          }
        }
      } catch (e) {
        v.chyby.push("výnimka: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : String(e)));
        if (u.druh === "zaklad") { const c = cakaj.get((u.novy ? "novy-" : "bez-") + u.sirka); if (c) c.r(null); }
      }
      await ch.zavri();
      v.s = ((Date.now() - t0) / 1000).toFixed(1);
      v.stav = v.chyby.length ? "ZLYHAL" : "OK";
      vysledky.push(v);
      const meno = u.druh === "zaklad" ? `základ ${u.novy ? "novy" : "bez"}` : u.druh === "bez" ? "bez flagu" : u.druh === "novy" ? "?novy=1" : "návrh v26";
      console.log(`${v.stav === "OK" ? "OK      " : "ZLYHAL  "}${String(u.sirka).padEnd(5)} ${meno.padEnd(12)} ${v.s.padStart(5)} s  ${v.info.join(" · ")}`);
      v.chyby.forEach((x) => console.log("        ✗ " + x));
      if (a.vypis) logy.forEach((l) => console.log("        log " + l));
    }
  }
  await Promise.all(Array.from({ length: Math.min(a.paralelne, ulohy.length) }, pracovnik));

  // porovnanie vedľa seba: web | návrh (jedna karta Chromu, obrázky ako data: URL)
  if (!a.bezSnimok) {
    const ch = await spustiChrome({ okno: false });
    try {
      let n = 0;
      for (const sirka of a.snimkySirky) {
        const k = await ch.novaKarta({ sirka: Math.min(2 * sirka + 60, 2700), vyska: 900, mobil: false });
        for (const meno of [...new Set([...mapa.map((x) => x.meno), ...plne.filter((m) => a.skupiny.includes(m[0]))])]) {
          const sek = { meno };
          const dir = join(a.snimky, sek.meno);
          const obr = (f) => { try { return "data:image/png;base64," + readFileSync(join(dir, f)).toString("base64"); } catch { return null; } };
          const web = obr(`web-${sirka}.png`), navrh = obr(`navrh-${sirka}.png`);
          if (!web && !navrh) continue;
          const stlpec = (src, nadpis) => `<div class="s"><p>${nadpis}</p>${src ? `<img src="${src}">` : `<div class="x">sekcia je zatiaľ stub (admin-html/src/p1v-598) — chýba</div>`}</div>`;
          const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#888;font:14px system-ui}.r{display:flex;gap:20px;padding:10px;align-items:flex-start}.s{width:${sirka}px}.s p{margin:0 0 6px;color:#fff;font-weight:700}.s img{display:block;width:${sirka}px}.x{background:#fff;padding:40px 16px;color:#900}</style><div class="r">${stlpec(web, `WEB (lokálny build) · ${sek.meno} · ${sirka} px`)}${stlpec(navrh, `NÁVRH v26 · ${sirka} px`)}</div>`;
          const { frameTree } = await k.posli("Page.getFrameTree");
          await k.posli("Page.setDocumentContent", { frameId: frameTree.frame.id, html });
          await k.ev(`Promise.all([].map.call(document.images, function (i) { return i.complete ? 0 : new Promise(function (r) { i.onload = i.onerror = r; }); }))`);
          await k.snimka(join(dir, `porovnanie-${sirka}.png`), { celaStrana: true });
          n++;
        }
        await k.zavri();
      }
      console.log(`  porovnania vedľa seba: ${n} -> ${a.snimky}`);
    } finally { await ch.zavri(); }
  }
  try { rmSync(build.tmp, { recursive: true, force: true }); } catch {}
  const zle = vysledky.filter((v) => v.stav !== "OK").length;
  console.log(`\nSpolu: ${vysledky.length - zle} OK, ${zle} zlyhalo (miesto ${a.miesto}, ${plne.length}/${sekcie.length} sekcií s obsahom)`);
  process.exit(zle ? 1 : 0);
}

main().catch((e) => { console.error("CHYBA:", e && e.stack ? e.stack : e); process.exit(2); });
