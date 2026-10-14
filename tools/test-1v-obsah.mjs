#!/usr/bin/env node
// E2E test OBSAHU pod konfigurátorom 1V na ŽIVÝCH SK stránkach s lokálnym buildom (docs/1v-obsah.md). JADRO (T0.3,
// 14. 10. 2026: všetky produkty z registra, obsah z CDN verzie podľa D1 = b, sonda čísel) — mení len vydanie.
//
//   node tools/test-1v-obsah.mjs                          # 598: bez flagu 1280+390, ?novy=1 na 360/390/768/1280, snímky vs návrh
//   node tools/test-1v-obsah.mjs --produkt 598,610,613    # viac produktov (id | all | typ:dvoj | alias ako test konfigurátora)
//   node tools/test-1v-obsah.mjs --vyvoj --produkt 601    # ?novy=vyvoj: aj typ, ktorý ešte nie je zapnutý (ZAPNUTE_TYPY)
//   node tools/test-1v-obsah.mjs --len bez --produkt 598,610,601,619,616   # bez flagu: 0 požiadaviek na obsah
//   node tools/test-1v-obsah.mjs --sonda-cisla --vyvoj --produkt 604 --len novy --sirka 1280 --bez-snimok   # čísla a odkazy
//   node tools/test-1v-obsah.mjs --miesto cdn|paticka|popis|zive   # cdn = skúška D1 = b (predvolené), popis = spustenie
//   ďalšie: --skupina b · --sirka 390 · --sirka-bez 1280,390 · --snimky C:/tmp/obsah · --snimky-sirky 390,1280 · --bez-snimok
//           --navrh <url> · --bez-zakladu · --paralelne 3 · --okno · --bez-drop · --vypis
//
// Čo robí: postaví HTML obsahu (tools/build-admin-html.mjs --vystup), JS a CSS (ako CI) do dočasného priečinka a otvorí
// živé stránky produktov. Obsah dostane stránka podľa --miesto (tools/test-1v/obsah-spolocne.mjs):
//   cdn      obsah.js si pod bránou stiahne …/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html — test ich obslúži z lokálneho
//            dist (ako production.yml), do stránky nič nevkladá; bez flagu sa NESMIE stiahnuť nič;
//   paticka  kusy ako bannery pätičky (starý test D1 = a); popis = kusy v Popise produktu (spustenie); zive = nič.
// Kontroly:
//   bez flagu: žiadne body.lcd-1v ani .p1v-miesto, ŽIADNA požiadavka na kus obsahu, obrázok/video obsahu ani sondu
//              (paticka/popis: korene display:none, stĺpce pätičky skryté, pätička a výška ako bez obsahu),
//              žiadne nové chyby v konzole, žiadny vodorovný posun;
//   s flagom:  body.lcd-1v + .lcd-1v-obsah, korene v .p1v-miesto pred záložkami v poradí, viditeľné, starý popis skrytý,
//              štýly titulky na koreni (--gold), každá sekcia viditeľná a odhalená, čísla dosadené (data-p1v-cislo) a
//              odkazy v tom istom vzore (data-p1v-odkaz), sonda sa po posune stiahne, žiadne chyby (konzola,
//              __lcd1v.chyby), žiadny vodorovný posun; kľúč len so stubmi = nič sa neukáže a starý popis ostane;
//              kontroly skupín: kľúč 598 -> tools/test-1v/obsah-a…d.mjs, iný kľúč -> obsah-<kľúč>.mjs (+ jeho zdielane);
//   --sonda-cisla: do 1. kusu sa pridá sekcia so všetkými kľúčmi čísel a typmi odkazov; očakávané hodnoty test zistí
//              sám (GET živých stránok + register zo zdroja), nie z kódu webu;
//   snímky:    každá neprázdna sekcia na webe + tá istá časť návrhu (server návrhov) + obe vedľa seba.
// Bezpečnosť: POST /action/Cart/addCartItem sa ZRUŠÍ, iný POST na /action/ tiež; merače zablokované; cookies odmietnuté;
// žiadna objednávka, žiadny admin, žiadne prihlásenie.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spustiChrome } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { vyberProdukty, TYPY_TEST, ChybaPouzitia } from "./test-1v/produkty.mjs";
import {
  priprav, novaStranka, otvorProdukt, adresyMedii, register, sestra, ocakavaneCisla, sekciaSondyCisel, doKorena,
  prazdnyKus, SONDA, MERACE, NAVRHY, pauza,
} from "./test-1v/obsah-spolocne.mjs";
import * as skA from "./test-1v/obsah-a.mjs";
import * as skB from "./test-1v/obsah-b.mjs";
import * as skC from "./test-1v/obsah-c.mjs";
import * as skD from "./test-1v/obsah-d.mjs";
import * as skDvoj from "./test-1v/obsah-dvoj.mjs";
import * as skClassic from "./test-1v/obsah-classic.mjs";
import * as skPremium from "./test-1v/obsah-premium.mjs";
import * as skBoxy from "./test-1v/obsah-boxy.mjs";
import * as skVzorky from "./test-1v/obsah-vzorky.mjs";

const SKUPINY = { a: skA, b: skB, c: skC, d: skD, dvoj: skDvoj, classic: skClassic, premium: skPremium, boxy: skBoxy, vzorky: skVzorky };
/** Kontroly skupín podľa kľúča obsahu: 598 = A–D (návrh v26); iný kľúč = vlastný plugin + skupiny, ktoré si vyžiada (zdielane). */
const PLUGINY = { 598: ["a", "b", "c", "d"], dvoj: ["dvoj"], classic: ["classic"], premium: ["premium"], boxy: ["boxy"], vzorky: ["vzorky"] };
const SERVER_NAVRHOV = "http://127.0.0.1:8952/";
/** Tvrdý časový limit jednej úlohy (bežne do 200 s aj so snímkami). */
const LIMIT_ULOHY = 480000;
const SUM_ZDROJE = /twitter|rostiapp|luxia|recaptcha|facebook|google|gstatic|youtube|hotjar|tiktok|smartsupp|ecomail|heureka|seznam|bing|clarity|trustindex/i;
const normChyba = (c) => (c.druh + ": " + c.text).replace(/\d+/g, "#").replace(/\s+/g, " ").slice(0, 200);
const naseChyby = (chyby) => chyby.filter((c) => !SUM_ZDROJE.test(c.zdroj || "") && !SUM_ZDROJE.test(c.text || ""));
const cisla = (s) => s.split(",").map((x) => Number(x.trim())).filter(Boolean);
const nbsp = (s) => String(s == null ? "" : s).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();

function argumenty(argv) {
  const a = { produkt: "598", vyvoj: false, sondaCisel: false, sirkyNovy: [360, 390, 768, 1280], sirkyBez: [1280, 390], snimkySirky: [390, 1280], skupiny: null, miesto: "cdn",
    snimky: join(tmpdir(), "lcd-1v-obsah-snimky"), bezSnimok: false, navrh: null, len: null, zaklad: true, paralelne: 3, okno: false, bezDrop: false, vypis: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new ChybaPouzitia(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--produkt") a.produkt = dalsi();
    else if (x === "--vyvoj") a.vyvoj = true;
    else if (x === "--sonda-cisla") a.sondaCisel = true;
    else if (x === "--sirka") a.sirkyNovy = cisla(dalsi());
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
    else if (x === "--help" || x === "-h") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 13).join("\n")); process.exit(0); }
    else throw new ChybaPouzitia("neznámy prepínač " + x);
  }
  if (!["cdn", "paticka", "popis", "zive"].includes(a.miesto)) throw new ChybaPouzitia("--miesto je cdn | paticka | popis | zive");
  if (a.sondaCisel && a.miesto !== "cdn") throw new ChybaPouzitia("--sonda-cisla len s --miesto cdn (sonda je v kuse z CDN)");
  (a.skupiny || []).forEach((g) => { if (!SKUPINY[g]) throw new ChybaPouzitia("neznáma skupina " + g + " (" + Object.keys(SKUPINY).join(", ") + ")"); });
  if (a.len === "bez") a.sirkyNovy = [];
  if (a.len === "novy") a.sirkyBez = [];
  return a;
}

// ------------------------------------------------------------------ v stránke
const STAV = (kluc) => `(function () {
  function disp(e) { return e ? getComputedStyle(e).display : null; }
  var korene = [].slice.call(document.querySelectorAll('[data-lcd-cast^="p1v-${kluc}-"]'));
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
  var o = window.__lcd1v && window.__lcd1v.obsah;
  var sekcie = m ? [].map.call(m.querySelectorAll("[data-lcd-sekcia]"), function (s) { return { meno: s.getAttribute("data-lcd-sekcia"), h: Math.round(s.getBoundingClientRect().height), rv: s.classList.contains("p1v-rv") }; }) : [];
  // VLASTNÁ viditeľnosť čísla: inline hidden (obsah-cisla.js, kým čaká) alebo hidden, ktoré nededí od rodiča. Číslo v zbalenej
  // odpovedi FAQ dedí visibility:hidden od .p1v-faq-a — to nie je „nedosadené“ (jadroChyby T1.3, T2.3, T2.4, T3.3, 14. 10. 2026).
  function vlastna(x) { var r = x.parentElement;
    return x.style.visibility === "hidden" || (getComputedStyle(x).visibility === "hidden" && !(r && getComputedStyle(r).visibility === "hidden")) ? "hidden" : "visible"; }
  var cisla = m ? [].map.call(m.querySelectorAll("[data-p1v-cislo]"), function (x) { return { kluc: x.getAttribute("data-p1v-cislo"), stav: x.getAttribute("data-p1v-stav"), text: (x.textContent || "").replace(/\\s+/g, " ").trim(), vis: vlastna(x) }; }) : [];
  var odkazy = m ? [].map.call(m.querySelectorAll("a[data-p1v-odkaz]"), function (x) { return { typ: x.getAttribute("data-p1v-odkaz"), href: x.getAttribute("href") }; }) : [];
  return {
    lcd1v: document.body.classList.contains("lcd-1v"), obsah: document.body.classList.contains("lcd-1v-obsah"),
    chyby1v: window.__lcd1v ? window.__lcd1v.chyby.slice() : null,
    obsahStav: o ? { kluc: o.kluc, zdroj: o.zdroj, stav: o.stav, kusy: o.kusy } : null,
    korene: korene.map(function (k) { var st = k.closest(".custom-footer > div"); var r = k.getBoundingClientRect();
      return { cast: k.getAttribute("data-lcd-cast"), v: k.getAttribute("data-lcd-v"), display: disp(k), h: Math.round(r.height), vMieste: !!(m && k.parentNode === m), stlpec: st ? disp(st) : null, gold: getComputedStyle(k).getPropertyValue("--gold").trim() }; }),
    miesto: m ? { deti: [].map.call(m.children, function (c) { return c.getAttribute("data-lcd-cast") || c.className; }), za: m.nextElementSibling ? String(m.nextElementSibling.className) : null } : null,
    zalozky: disp(document.querySelector(".p-detail > .shp-tabs-wrapper")),
    staryPopisViditelny: !!(bd && bd.getClientRects().length && bd.getBoundingClientRect().height > 0),
    prazdneStlpce: [].map.call(document.querySelectorAll(".custom-footer > div[data-p1v-prazdny]"), disp),
    paticka: f ? { h: Math.round(f.getBoundingClientRect().height), stlpce: [].filter.call(f.children, function (c) { return getComputedStyle(c).display !== "none"; }).length } : null,
    docH: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: cw, presahy: presahy,
    sekcie: sekcie, cisla: cisla, odkazy: odkazy
  };
})()`;

// sonda čísel: texty a stav prvkov sekcie x-sonda-cisla
const SONDA_CISEL = `(function () {
  var s = document.querySelector('.p1v-miesto [data-lcd-sekcia="x-sonda-cisla"]');
  if (!s) return null;
  return {
    cisla: [].map.call(s.querySelectorAll("[data-p1v-sonda]"), function (li) { var x = li.querySelector("[data-p1v-cislo]"), cs = getComputedStyle(x);
      return { kluc: li.getAttribute("data-p1v-sonda"), text: (x.textContent || "").replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(), stav: x.getAttribute("data-p1v-stav"), display: cs.display, vis: cs.visibility }; }),
    odkazy: [].map.call(s.querySelectorAll("a[data-p1v-odkaz]"), function (a) { return { typ: a.getAttribute("data-p1v-odkaz"), href: a.getAttribute("href"), stav: a.getAttribute("data-p1v-stav") }; })
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
  // prechody lepených scén (deväť vecí, pred a po: 0,6 s) musia doznieť, inak sa na snímke prekrývajú kroky (jadroChyby T2.3, T3.3)
  await new Promise(function (r) { setTimeout(r, 1400); });
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
  const reg = register();
  const flag = a.vyvoj ? "vyvoj" : "1";
  const produkty = vyberProdukty(a.produkt).map((p) => {
    const r = reg.produkty[p.id];
    if (!r) throw new ChybaPouzitia("produkt " + p.id + " nie je v registri konfigurator1v/produkty.js");
    return { ...p, url: r.url, cesta: r.cesta, typ: r.typ, vzor: r.vzor, kluc: r.obsah, zapnuty: reg.zapnute.includes(r.typ) };
  });
  if (a.sirkyNovy.length && !a.vyvoj && a.miesto !== "zive") {
    const vypnute = produkty.filter((p) => !p.zapnuty);
    if (vypnute.length) throw new ChybaPouzitia("?novy=1 na produktoch nezapnutého typu (" + vypnute.map((p) => p.id + " " + p.typ).join(", ") + ") nič nezapne — pridaj --vyvoj (ZAPNUTE_TYPY " + JSON.stringify(reg.zapnute) + ")");
  }
  console.log(`Test obsahu 1V — miesto: ${{ cdn: "CDN verzie (D1 = b, test obslúži lokálny dist)", popis: "Popis produktu (spustenie, vložené testom)", paticka: "banner v pätičke (starý test, vložené testom)", zive: "živé (nič sa nevkladá ani neobsluhuje)" }[a.miesto]}, flag ?novy=${flag}, produkty ${produkty.map((p) => p.id + " (" + p.kluc + ")").join(", ")}`);
  const build = priprav({ bezDrop: a.bezDrop });
  console.log("  " + build.popis);

  // podľa produktu: kusy, médiá, sekcie, pluginy, sonda čísel
  for (const p of produkty) {
    p.kusy = build.admin.casti(p.kluc);
    if (!p.kusy.length) throw new ChybaPouzitia(`kľúč obsahu „${p.kluc}“ (produkt ${p.id}) nemá časti v admin-html/ciele.json`);
    p.media = [...new Set(p.kusy.flatMap((c) => adresyMedii(c.html)))];
    p.sekcie = p.kusy.flatMap((c) => c.sekcie.map((s) => ({ ...s, cast: c.cast })));
    p.plne = p.sekcie.filter((s) => s.znaky > 0).map((s) => s.sekcia);
    const mena = (a.skupiny || PLUGINY[p.kluc] || []).filter((g) => (PLUGINY[p.kluc] || []).includes(g) || (a.skupiny && SKUPINY[g]));
    p.pluginy = [...new Set(mena.flatMap((g) => [g, ...((SKUPINY[g] && SKUPINY[g].zdielane) || [])]))].filter((g) => SKUPINY[g]);
    p.navrh = a.navrh || SERVER_NAVRHOV + (NAVRHY[p.kluc] || NAVRHY[598]);
    if (a.sondaCisel) {
      p.sonda = await ocakavaneCisla(reg, p);
      const k1 = p.kusy[0];
      p.cdnKusy = { [k1.cast]: doKorena(k1.html, sekciaSondyCisel(p.sonda)) };
      p.plne = p.plne.concat("x-sonda-cisla");
    }
    console.log(`  ${p.id} ${p.nazov || ""} (${p.typ}/${p.vzor || "-"}): obsah ${p.kluc} — ${p.kusy.map((c) => c.cast).join(" + ")}, sekcie ${p.sekcie.length} (${p.sekcie.filter((s) => s.znaky > 0).length} s obsahom), médiá ${p.media.length}, kontroly ${p.pluginy.join(",") || "len základ"}${p.sonda ? ", sonda čísel " + p.sonda.cisla.length + " + odkazy " + p.sonda.odkazy.length : ""}`);
    for (const s of p.sekcie) if (s.znaky > 0 && !/-pomocne$/.test(s.sekcia) && !p.pluginy.some((g) => SKUPINY[g].sekcie.some((x) => x.meno === s.sekcia))) console.log(`  POZOR: ${p.id} sekcia ${s.sekcia} nemá mapu v tools/test-1v/obsah-*.mjs (snímka návrhu chýba)`);
  }

  // návrh dostupný?
  let navrhOk = !a.bezSnimok;
  const navrhy = [...new Set(produkty.map((p) => p.navrh))];
  if (navrhOk) for (const n of navrhy) { try { const r = await fetch(n, { method: "HEAD" }); navrhOk = navrhOk && r.ok; } catch { navrhOk = false; } }
  if (!a.bezSnimok && !navrhOk) console.log(`  POZOR: návrh ${navrhy.join(", ")} nie je dostupný — snímky len z webu (spusti server návrhov alebo --navrh <url>)`);
  if (!a.bezSnimok) mkdirSync(a.snimky, { recursive: true });

  const ulohy = [];
  const zaklady = new Map(); // "<id>|bez|novy-<sirka>" -> Promise({ chyby:Set, st })
  const zakladSirka = (novy, sirka) => (novy ? (sirka < 768 ? 390 : 1280) : sirka);
  const kz = (p, novy, sirka) => p.id + "|" + (novy ? "novy-" : "bez-") + sirka;
  for (const p of produkty) {
    if (a.zaklad) {
      for (const sirka of new Set(a.sirkyBez)) ulohy.push({ p, druh: "zaklad", novy: false, sirka });
      for (const sirka of new Set(a.sirkyNovy.map((w) => zakladSirka(true, w)))) ulohy.push({ p, druh: "zaklad", novy: true, sirka });
    }
    for (const sirka of a.sirkyBez) ulohy.push({ p, druh: "bez", sirka });
    for (const sirka of a.sirkyNovy) ulohy.push({ p, druh: "novy", sirka });
  }
  // snímky návrhu: raz na návrh a šírku (sekcie z pluginov produktov s tým návrhom)
  const navrhUlohy = new Map();
  if (navrhOk && a.sirkyNovy.length) for (const p of produkty) for (const sirka of a.snimkySirky) {
    const k = p.navrh + "|" + sirka;
    if (!navrhUlohy.has(k)) navrhUlohy.set(k, { p, druh: "navrh", sirka, mapa: [] });
    const u = navrhUlohy.get(k);
    p.pluginy.flatMap((g) => SKUPINY[g].sekcie.map((s) => ({ ...s, skupina: g }))).forEach((s) => { if (!u.mapa.some((x) => x.meno === s.meno)) u.mapa.push(s); });
  }
  ulohy.push(...navrhUlohy.values());
  const cakaj = new Map();
  for (const u of ulohy) if (u.druh === "zaklad") { let r; const p = new Promise((x) => { r = x; }); cakaj.set(kz(u.p, u.novy, u.sirka), { p, r }); zaklady.set(kz(u.p, u.novy, u.sirka), p); }

  const vysledky = [];
  let dalsia = 0;
  async function pracovnik() {
    while (dalsia < ulohy.length) {
      const u = ulohy[dalsia++];
      const p = u.p;
      const t0 = Date.now();
      const logy = [];
      const log = (x) => logy.push(x);
      const ch = await spustiChrome({ okno: a.okno });
      const v = { uloha: p.id + " " + u.druh + " " + u.sirka, chyby: [], info: [], pozor: [] };
      const zle = (podm, sprava) => { if (!podm) v.chyby.push(sprava); };
      // tvrdá poistka (kontrola T0.3 14. 10. 2026: jedna úloha visela 20+ min na zahltenom stroji): po LIMIT_ULOHY sa
      // Chrome úlohy zavrie, čakajúce volania CDP zlyhajú a úloha skončí ako ZLYHAL (beh sa nikdy nezasekne)
      // Integrácia 14. 10. 2026: navyše Promise.race — pracovník ide na ďalšiu úlohu aj keď úloha visí mimo CDP (čakanie
      // na základ, pauza v slučke); čakajúci na základ tejto úlohy dostanú null (nečakajú navždy).
      let strazca;
      const limit = new Promise((_, zamietni) => {
        strazca = setTimeout(() => {
          ch.zavri().catch(() => {});
          zamietni(new Error(`časový limit ${LIMIT_ULOHY / 1000} s: Chrome neodpovedá, úloha zrušená`));
        }, LIMIT_ULOHY);
      });
      try {
        await Promise.race([limit, (async () => {
        if (u.druh === "navrh") {
          const k = await ch.novaKarta({ sirka: u.sirka });
          await k.posli("Network.setBlockedURLs", { urls: MERACE });
          await k.chod(p.navrh);
          await k.ev(`document.fonts ? document.fonts.ready.then(function () { return 1; }) : 1`).catch(() => {});
          await pauza(1500);
          let n = 0;
          for (const s of u.mapa) {
            if (!s.navrh || !s.navrh.length) continue;
            mkdirSync(join(a.snimky, p.kluc, s.meno), { recursive: true });
            const o = await snimkaOblasti(k, s.navrh, join(a.snimky, p.kluc, s.meno, `navrh-${u.sirka}.png`)).catch((e) => { log(s.meno + ": " + e.message); return null; });
            if (o) n++; else v.info.push("návrh: " + s.meno + " nenájdené");
          }
          v.info.unshift(`${n} snímok návrhu ${p.navrh.split("/").pop()}`);
        } else {
          const novy = u.druh === "novy" || (u.druh === "zaklad" && u.novy);
          // základ = stránka bez obsahu: nič sa nevkladá, z CDN prídu prázdne korene
          const zaklad = u.druh === "zaklad";
          const cdnKusy = zaklad ? Object.fromEntries(p.kusy.map((c) => [c.cast, prazdnyKus(c)])) : p.cdnKusy || null;
          const s = await novaStranka(ch, u.sirka, build, { vlozit: !zaklad && a.miesto !== "zive", miesto: zaklad && a.miesto !== "zive" ? "cdn" : a.miesto, log, produkt: p, kusy: p.kusy, cdnKusy });
          await otvorProdukt(s, { url: p.url, flag: novy ? flag : null, pripravene: (TYPY_TEST[p.typ] || {}).pripravene });
          const st = await s.k.ev(STAV(p.kluc));
          const plne = p.plne.length > 0;
          if (zaklad) {
            // výška živej stránky kolíše sama (konfigurátor, widgety recenzií/videí, pod záťažou aj +167 px): základ bez flagu
            // sa meria DVAKRÁT (nové načítanie) — rozsah dvoch meraní je vlastné kolísanie stránky (integrácia 14. 10. 2026)
            const vysky = [st.docH];
            if (!novy) {
              await otvorProdukt(s, { url: p.url, flag: null, pripravene: (TYPY_TEST[p.typ] || {}).pripravene });
              vysky.push((await s.k.ev(STAV(p.kluc))).docH);
            }
            cakaj.get(kz(p, u.novy, u.sirka)).r({ chyby: new Set(naseChyby(s.k.chyby).map(normChyba)), st, vysky });
            v.info.push(`základ ${novy ? "?novy=" + flag : "bez flagu"} (bez obsahu): výška ${vysky.join(" / ")} px, pätička ${st.paticka ? st.paticka.h + " px / " + st.paticka.stlpce + " stĺpcov" : "?"}`);
          } else {
            const vlozene = a.miesto === "paticka" || a.miesto === "popis";
            if (vlozene) zle(s.vlozene && s.vlozene.ok, "obsah sa nevložil do stránky: " + (s.vlozene ? s.vlozene.popis : "dokument produktu sa nezachytil"));
            zle(st.sw <= st.cw, `vodorovný posun stránky: scrollWidth ${st.sw} > ${st.cw}`);
            zle(s.inePosty.length === 0, "nečakaný zápis na server (zrušený): " + s.inePosty.join(", "));
            zle(s.posty.length === 0, "nečakané vloženie do košíka (zrušené)");
            if (u.druh === "bez") {
              zle(!st.lcd1v && !st.miesto, "bez flagu je body.lcd-1v alebo .p1v-miesto");
              if (vlozene) for (const k of st.korene) {
                zle(k.display === "none", `${k.cast}: bez flagu display ${k.display} (má byť none)`);
                if (k.stlpec !== null) zle(k.stlpec === "none", `${k.cast}: stĺpec pätičky bez flagu display ${k.stlpec} (má byť none)`);
              }
              if (a.miesto === "cdn") zle(st.korene.length === 0, `bez flagu sú na stránke korene obsahu (${st.korene.length}) — HTML stránky sa nemá meniť`);
              const kusyObsahu = s.poziadavky.filter((x) => /\/html\/p1v-[^/]*\.html/.test(x));
              zle(kusyObsahu.length === 0 && s.html.length === 0, "bez flagu sa sťahoval obsah 1V: " + kusyObsahu.concat(s.html).slice(0, 4).join(", "));
              const stiahnute = s.poziadavky.filter((x) => x.indexOf(SONDA) === 0 || /\/img\/1v\/obsah\//.test(x) || p.media.some((m) => x.split("?")[0] === m.split("?")[0]));
              zle(stiahnute.length === 0, "bez flagu sa stiahli médiá obsahu: " + stiahnute.slice(0, 5).join(", "));
              const z = await zaklady.get(kz(p, false, u.sirka));
              if (z) {
                const nove = naseChyby(s.k.chyby).filter((c) => !z.chyby.has(normChyba(c)));
                zle(!nove.length, "nové chyby v konzole: " + nove.map((c) => c.druh + ": " + c.text).join(" | "));
                if (z.st.paticka && st.paticka) zle(z.st.paticka.stlpce === st.paticka.stlpce && Math.abs(z.st.paticka.h - st.paticka.h) <= 2,
                  `pätička sa zmenila: ${z.st.paticka.h} px / ${z.st.paticka.stlpce} stĺpcov -> ${st.paticka.h} px / ${st.paticka.stlpce}`);
                // Výška bez flagu = výška základu (stránka bez obsahu), s toleranciou 40 px + 2 × vlastné kolísanie stránky
                // (rozsah dvoch meraní základu). Mimo nej sa stránka načíta a zmeria ešte raz (náhodný výkyv živej stránky
                // vs. trvalá zmena) a platí bližšie meranie. Platí pre paticka (obsah skrytý v HTML) aj cdn (HTML sa nemení).
                const vz = z.vysky && z.vysky.length ? z.vysky : [z.st.docH];
                const lo = Math.min(...vz), hi = Math.max(...vz), tol = 40 + 2 * (hi - lo);
                const odchylka = (h) => (h < lo ? h - lo : h > hi ? h - hi : 0);
                let h = st.docH;
                if (Math.abs(odchylka(h)) > tol) {
                  await otvorProdukt(s, { url: p.url, flag: null, pripravene: (TYPY_TEST[p.typ] || {}).pripravene });
                  const h2 = (await s.k.ev(STAV(p.kluc))).docH;
                  v.info.push(`výška mimo tolerancie (${h} px), zmeraná znova: ${h2} px`);
                  if (Math.abs(odchylka(h2)) < Math.abs(odchylka(h))) h = h2;
                }
                const dH = odchylka(h);
                zle(Math.abs(dH) <= tol, `výška stránky bez flagu ${h} px je o ${dH >= 0 ? "+" : ""}${dH} px mimo základu ${lo}–${hi} px (tolerancia ${tol} px = 40 + 2 × kolísanie základu)`);
                v.info.push(`výška ${h} px, základ ${lo === hi ? lo : lo + "–" + hi} px, odchýlka ${dH >= 0 ? "+" : ""}${dH} px (tolerancia ${tol})`);
              }
              v.info.push(`${st.korene.length} korene${vlozene ? " skryté" : ""}, 0 požiadaviek na kusy obsahu, 0 z ${p.media.length} médií + sondy stiahnuté`);
            } else {
              zle(st.lcd1v, `?novy=${flag}, ale body.lcd-1v chýba` + (st.chyby1v && st.chyby1v.length ? " — " + st.chyby1v.join("; ") : ""));
              zle(!st.chyby1v || !st.chyby1v.length, "window.__lcd1v.chyby: " + (st.chyby1v || []).join("; "));
              const zdroj = a.miesto === "cdn" ? "cdn" : a.miesto === "zive" ? null : "dom"; // zive: Popis (dom) alebo CDN
              if (a.miesto === "cdn") {
                const cakam = p.kusy.map((c) => c.cast);
                zle(cakam.every((c) => s.html.includes(c)), `obsah.js nestiahol kusy z CDN verzie (stiahnuté: ${s.html.join(", ") || "nič"}, čakám ${cakam.join(", ")})`);
              }
              if (!plne) {
                // kľúč len so stubmi: nič sa neukáže, starý popis ostane
                zle(st.obsahStav && st.obsahStav.stav === "nic", "obsah len so stubmi: čakám __lcd1v.obsah.stav „nic“, je " + JSON.stringify(st.obsahStav));
                zle(!st.obsah && !st.miesto, "obsah len so stubmi, ale stránka má .lcd-1v-obsah / .p1v-miesto");
                zle(st.zalozky !== "none", `obsah len so stubmi skryl starý popis (záložky ${st.zalozky})`);
                v.info.push(`obsah ${p.kluc} len stuby: nič sa neukázalo, starý popis ostal (stav ${st.obsahStav && st.obsahStav.stav})`);
              } else {
                zle(st.obsahStav && st.obsahStav.stav === "hotovo" && (!zdroj || st.obsahStav.zdroj === zdroj) && st.obsahStav.kluc === p.kluc,
                  "__lcd1v.obsah: " + JSON.stringify(st.obsahStav) + ` (čakám stav hotovo, zdroj ${zdroj || "dom/cdn"}, kľúč ${p.kluc})`);
                zle(st.korene.length === p.kusy.length, `korene obsahu na stránke: ${st.korene.length}, čakám ${p.kusy.length}`);
                if (a.miesto === "zive") for (const c of p.kusy) {
                  const k = st.korene.find((x) => x.cast === c.cast);
                  zle(k && k.v === c.hash, `${c.cast}: na stránke je data-lcd-v ${k ? k.v : "—"}, build ${c.hash} (admin/CDN nie je aktuálny alebo ho niekto zmenil)`);
                }
                zle(st.obsah, "body.lcd-1v-obsah chýba (obsah.js nenašiel/nestiahol korene?)");
                zle(st.miesto && /shp-tabs-wrapper/.test(st.miesto.za || ""), ".p1v-miesto nie je hneď pred záložkami produktu (za ním: " + (st.miesto && st.miesto.za) + ")");
                const poradie = st.miesto ? st.miesto.deti.join(",") : "";
                zle(poradie === p.kusy.map((c) => c.cast).join(","), "poradie v .p1v-miesto: " + poradie);
                for (const k of st.korene) {
                  zle(k.vMieste && k.display === "block", `${k.cast}: display ${k.display}, v .p1v-miesto ${k.vMieste}`);
                  zle(k.gold === "#c49b31", `${k.cast}: štýly titulky (LCD-HOME) na koreni neplatia (--gold „${k.gold}“)`);
                }
                zle(st.zalozky === "none" && !st.staryPopisViditelny, `starý popis je viditeľný (záložky ${st.zalozky})`);
                if (a.miesto === "paticka") zle(st.prazdneStlpce.length === p.kusy.length && st.prazdneStlpce.every((d) => d === "none"), "prázdne stĺpce pätičky: " + JSON.stringify(st.prazdneStlpce));
                else zle(st.prazdneStlpce.every((d) => d === "none"), "prázdne stĺpce pätičky viditeľné: " + JSON.stringify(st.prazdneStlpce));
                zle(!st.presahy.length, "prvky obsahu za okrajom okna (" + st.cw + " px): " + st.presahy.join(", "));
                // každá sekcia: má výšku a reveal ju prevzal (pomocné sekcie — okno, linka čítania v <body> — výšku nemajú)
                const zleSekcie = st.sekcie.filter((x) => !((x.h > 0 || /-pomocne$/.test(x.meno)) && x.rv));
                zle(!zleSekcie.length, "sekcie bez výšky alebo bez .p1v-rv: " + zleSekcie.map((x) => x.meno + " " + x.h + " px").join(", "));
                // čísla a odkazy (obsah-cisla.js): všetky vybavené, nič neostalo neviditeľné, odkazy v tom istom vzore
                const nevybavene = st.cisla.filter((x) => !x.stav || x.stav === "caka" || (x.stav !== "skryte" && x.vis === "hidden"));
                zle(!nevybavene.length, "čísla data-p1v-cislo nedosadené: " + nevybavene.map((x) => x.kluc + " „" + x.text + "“").join(", "));
                const zleOdkazy = st.odkazy.filter((o) => {
                  const typ = { classic: "kufor-classic", premium: "kufor-premium" }[o.typ] || o.typ;
                  const ses = sestra(reg, typ, p.vzor);
                  return !ses || String(o.href || "").split("#")[0] !== ses.cesta;
                });
                zle(!zleOdkazy.length, "odkazy data-p1v-odkaz mimo vzoru " + p.vzor + ": " + zleOdkazy.map((o) => o.typ + " " + o.href).join(", "));
                if (st.cisla.length || st.odkazy.length) v.info.push(`čísla ${st.cisla.filter((x) => x.stav === "ok").length}/${st.cisla.length} dosadené, odkazy ${st.odkazy.length}`);
                // sonda: po posune k nej sa stiahne (meranie požiadaviek funguje, brána sa otvorila)
                const sondy = await s.k.ev(`[].map.call(document.querySelectorAll(".p1v-miesto img.p1v-sonda"), function (i) { return i.getAttribute("src"); })`);
                for (const src of sondy) {
                  await s.k.ev(`(function () { var i = document.querySelector('.p1v-miesto img.p1v-sonda[src="${src}"]'); if (i) i.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
                  await pauza(900);
                  zle(s.poziadavky.some((x) => x === src), "sonda sa s flagom nestiahla: " + src);
                }
                // sonda čísel (--sonda-cisla): každý kľúč a každý typ odkazu proti nezávislým očakávaniam
                if (p.sonda) {
                  const r = await s.k.ev(SONDA_CISEL);
                  zle(r, "sekcia sondy čísel x-sonda-cisla nie je na stránke");
                  if (r) {
                    for (const c of p.sonda.cisla) {
                      const x = r.cisla.find((y) => y.kluc === c.kluc);
                      if (!x) { zle(false, `sonda ${c.kluc}: prvok chýba`); continue; }
                      if (c.text == null) zle(x.stav === "skryte" && x.display === "none", `sonda ${c.kluc}: čakám skrytý prvok, je ${x.stav} „${x.text}“ (${x.display})`);
                      else zle(nbsp(x.text) === nbsp(c.text) && x.vis !== "hidden" && x.display !== "none", `sonda ${c.kluc}: „${x.text}“ (${x.stav}), čakám „${c.text}“`);
                    }
                    for (const o of p.sonda.odkazy) {
                      const x = r.odkazy.find((y) => y.typ === o.typ);
                      zle(x && x.href === o.href && x.stav === "ok", `sonda odkaz ${o.typ}: ${x ? x.href + " (" + x.stav + ")" : "chýba"}, čakám ${o.href}`);
                    }
                    v.info.push(`sonda čísel: ${r.cisla.map((x) => x.kluc + "=" + (x.stav === "skryte" ? "skryté" : "„" + x.text + "“")).join(", ")}; odkazy ${r.odkazy.map((x) => x.typ + "→" + x.href).join(", ")}`);
                  }
                }
                // kontroly skupín
                const t = vytvorT(s.k, { novy: true, log });
                t.sekcia = (meno) => `[data-lcd-sekcia="${meno}"]`;
                t.je = (meno) => s.k.ev(`!!document.querySelector('.p1v-miesto [data-lcd-sekcia="${meno}"]')`);
                t.produkt = { id: p.id, typ: p.typ, vzor: p.vzor, kluc: p.kluc, url: p.url, cesta: p.cesta };
                t.sestra = (typ) => { const x = sestra(reg, typ, p.vzor); return x ? x.cesta : null; };
                for (const g of p.pluginy) {
                  try {
                    const r = (await SKUPINY[g].kontroly(t)) || [];
                    for (const x of r) { if (x.ok) continue; if (x.pozor) v.pozor.push(`skupina ${g.toUpperCase()}: ${x.popis}`); else v.chyby.push(`skupina ${g.toUpperCase()}: ${x.popis}`); }
                    if (r.length) v.info.push(`skupina ${g.toUpperCase()}: ${r.filter((x) => x.ok).length}/${r.length} kontrol OK${r.some((x) => !x.ok && x.pozor) ? " (" + r.filter((x) => !x.ok && x.pozor).length + " upozornenie)" : ""}`);
                  } catch (e) { v.chyby.push(`skupina ${g.toUpperCase()}: výnimka ${e && e.message ? e.message : e}`); }
                }
                // snímky sekcií webu
                if (!a.bezSnimok && a.snimkySirky.includes(u.sirka)) {
                  let n = 0;
                  for (const meno of p.plne.filter((m) => m !== "x-sonda-cisla")) {
                    mkdirSync(join(a.snimky, p.kluc, meno), { recursive: true });
                    const o = await snimkaOblasti(s.k, [{ sel: `.p1v-miesto [data-lcd-sekcia="${meno}"]` }], join(a.snimky, p.kluc, meno, `web-${p.id}-${u.sirka}.png`)).catch((e) => { log(meno + ": " + e.message); return null; });
                    if (o) n++; else v.info.push("web: " + meno + " bez snímky (výška 0?)");
                  }
                  v.info.push(`${n} snímok sekcií`);
                }
                v.info.push(`${st.korene.length} korene na mieste (${st.obsahStav ? st.obsahStav.zdroj : "?"}), ${st.sekcie.length} sekcií, výška stránky ${st.docH} px`);
              }
              const z = await zaklady.get(kz(p, true, zakladSirka(true, u.sirka)));
              if (z) {
                const nove = naseChyby(s.k.chyby).filter((c) => !z.chyby.has(normChyba(c)));
                zle(!nove.length, "nové chyby v konzole: " + nove.map((c) => c.druh + ": " + c.text).join(" | "));
              }
            }
          }
        }
        })()]);
      } catch (e) {
        v.chyby.push(/^časový limit/.test(e && e.message) ? e.message : "výnimka: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : String(e)));
        if (u.druh === "zaklad") { const c = cakaj.get(kz(p, u.novy, u.sirka)); if (c) c.r(null); }
      }
      clearTimeout(strazca);
      await Promise.race([ch.zavri().catch(() => {}), pauza(15000)]);
      v.s = ((Date.now() - t0) / 1000).toFixed(1);
      v.stav = v.chyby.length ? "ZLYHAL" : "OK";
      vysledky.push(v);
      const meno = u.druh === "zaklad" ? `základ ${u.novy ? "novy" : "bez"}` : u.druh === "bez" ? "bez flagu" : u.druh === "novy" ? "?novy=" + flag : "návrh";
      console.log(`${v.stav === "OK" ? "OK      " : "ZLYHAL  "}${String(p.id).padEnd(4)} ${String(u.sirka).padEnd(5)} ${meno.padEnd(12)} ${v.s.padStart(5)} s  ${v.info.join(" · ")}`);
      v.chyby.forEach((x) => console.log("        ✗ " + x));
      v.pozor.forEach((x) => console.log("        ! " + x));
      if (a.vypis) logy.forEach((l) => console.log("        log " + l));
    }
  }
  await Promise.all(Array.from({ length: Math.min(a.paralelne, ulohy.length) }, pracovnik));

  // porovnanie vedľa seba: web | návrh (jedna karta Chromu, obrázky ako data: URL)
  if (!a.bezSnimok && a.sirkyNovy.length) {
    const ch = await spustiChrome({ okno: false });
    try {
      let n = 0;
      for (const sirka of a.snimkySirky) {
        const k = await ch.novaKarta({ sirka: Math.min(2 * sirka + 60, 2700), vyska: 900, mobil: false });
        for (const p of produkty) {
          const mapa = p.pluginy.flatMap((g) => SKUPINY[g].sekcie.map((s) => s.meno));
          for (const meno of [...new Set([...mapa, ...p.plne])].filter((m) => m !== "x-sonda-cisla")) {
            const dir = join(a.snimky, p.kluc, meno);
            const obr = (f) => { try { return "data:image/png;base64," + readFileSync(join(dir, f)).toString("base64"); } catch { return null; } };
            const web = obr(`web-${p.id}-${sirka}.png`), navrh = obr(`navrh-${sirka}.png`);
            if (!web && !navrh) continue;
            const stlpec = (src, nadpis) => `<div class="s"><p>${nadpis}</p>${src ? `<img src="${src}">` : `<div class="x">sekcia je zatiaľ stub (admin-html/src/p1v-${p.kluc}) — chýba</div>`}</div>`;
            const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#888;font:14px system-ui}.r{display:flex;gap:20px;padding:10px;align-items:flex-start}.s{width:${sirka}px}.s p{margin:0 0 6px;color:#fff;font-weight:700}.s img{display:block;width:${sirka}px}.x{background:#fff;padding:40px 16px;color:#900}</style><div class="r">${stlpec(web, `WEB ${p.id} (lokálny build) · ${meno} · ${sirka} px`)}${stlpec(navrh, `NÁVRH ${p.navrh.split("/").pop()} · ${sirka} px`)}</div>`;
            const { frameTree } = await k.posli("Page.getFrameTree");
            await k.posli("Page.setDocumentContent", { frameId: frameTree.frame.id, html });
            await k.ev(`Promise.all([].map.call(document.images, function (i) { return i.complete ? 0 : new Promise(function (r) { i.onload = i.onerror = r; }); }))`);
            await k.snimka(join(dir, `porovnanie-${p.id}-${sirka}.png`), { celaStrana: true });
            n++;
          }
        }
        await k.zavri();
      }
      console.log(`  porovnania vedľa seba: ${n} -> ${a.snimky}`);
    } finally { await ch.zavri(); }
  }
  try { rmSync(build.tmp, { recursive: true, force: true }); } catch {}
  const zle = vysledky.filter((v) => v.stav !== "OK").length;
  const pozor = vysledky.reduce((s, v) => s + v.pozor.length, 0);
  console.log(`\nSpolu: ${vysledky.length - zle} OK, ${zle} zlyhalo${pozor ? ", " + pozor + " upozornení" : ""} (miesto ${a.miesto}, ?novy=${flag}, ${produkty.map((p) => p.id + ": " + p.plne.length + "/" + p.sekcie.length + " sekcií s obsahom").join(", ")})`);
  process.exit(zle ? 1 : 0);
}

main().catch((e) => {
  if (e instanceof ChybaPouzitia) { console.error("CHYBA POUŽITIA: " + e.message); process.exit(2); }
  console.error("CHYBA:", e && e.stack ? e.stack : e);
  process.exit(2);
});
