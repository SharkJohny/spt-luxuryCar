// Scenáre kamiónov SK 640 (typ „kamion“) pre tools/test-konfigurator-1v.mjs — živá stránka s lokálnym buildom,
// POST do košíka sa zachytí a zruší. Plán: docs/kamiony-1v-plan.md §5 (c), (e). Tvar: scenare-vzorky.mjs.
// Nový vzhľad (--vyvoj, po vydaní --novy) sa ovláda klikmi na prvky [data-a] v #lcd1v-kamion (ako zákazník);
// starý vzhľad (React) tieto scenáre preskočí — React pokrýva npm run truck:test a brana / nulova-zmena.
//   kamion-platne   DAF XF106 2017–2021, prešívaná 12, lem 04, balík H19/2999, tapacír ako koberce -> 423 €, POST
//                   (kroky 5–6 otázky po jednej, Michal 18. 10. 2026 večer: kam -> motív + niť -> Pokračovať -> stred rovnaký)
//   kamion-dodavka  Fiat Ducato, jednofarebná 10G, lem 09, len stred H21/3546 -> 258 €, bez kroku tapacíru, POST
//   kamion-neuplne  nič nevybraté -> „Pridať do košíka“ aj lišta: žiadny POST, krok 1 červený
// Automatický posun (Michal 18. 10. 2026): po poslednej otázke kroku 5 / 6 sa krok sám zavrie a otvorí ďalší (súhrn).
// Mierka písma (Michal 18. 10. 2026): v každom stave kroku getComputedStyle všetkých textov konfigurátora a lišty
// (tools/test-1v/pismo-kamion.mjs) — na 390 aj 1280 px (revízia: aj --sirka 360,1024), slová sa nelámu uprostred, nepretečú
// a neoreže ich okraj fotky / dlaždice.
// Telo POST do košíka sa porovná bajt po bajte s docs/kamiony-snimky/post-porovnanie.json (platne = react.body, dodávka =
// revizia_2026_10_18.posty) — košík a ceny sa nesmú zmeniť.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pismoVyraz, vypisNalezy, ROLY_KONFIGURATOR } from "./pismo-kamion.mjs";

const POROVNANIE = join(dirname(fileURLToPath(import.meta.url)), "../../docs/kamiony-snimky/post-porovnanie.json");
/** Očakávané telo POST (zachytené z Reactu 18. 10. 2026 a po revízii; pre všetky šírky rovnaké). */
function vzorPost(meno) {
  const p = JSON.parse(readFileSync(POROVNANIE, "utf8"));
  return meno === "kamion-platne" ? p.react.body : p.revizia_2026_10_18.posty["1280 " + meno];
}

/** --snimky: snímka s menom podľa šírky okna (640-<meno>-<šírka>.png). */
async function snimka(s, a, meno) {
  if (!a.snimky) return;
  const w = await s.t.ev("window.innerWidth").catch(() => "");
  await s.k.snimka(join(a.snimky, "640-" + meno + "-" + w + ".png")).catch(() => {});
}
/** --snimky: prvok #lcd1v-kamion <sel> hore v okne (pod hlavičkou webu), potom snímka okna. */
async function snimkaPrvku(s, a, j, sel, meno) {
  if (!a.snimky) return;
  await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify("#lcd1v-kamion " + sel)}); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 70, behavior: "instant" }); })()`);
  await j.pauza(700);
  await snimka(s, a, meno);
}
/** Mierka písma v aktuálnom stave konfigurátora (a lišty na telefóne): minimá podľa roly textu, riadkovanie, zlomy slov. */
async function overPismo(s, j, meno) {
  const r = await s.t.ev(pismoVyraz(["#lcd1v-kamion", "#lcd1v-lista"], ROLY_KONFIGURATOR));
  const f = vypisNalezy(r), w = r.pc ? "PC" : "telefón";
  j.over(r.n > 20 && !r.zle.length, `písmo ${meno} (${w}): ${r.zle.length} z ${r.n} textov pod mierkou: ` + f(r.zle));
  j.over(!r.riadky.length, `písmo ${meno} (${w}): riadkovanie súvislého textu < 1,5: ` + f(r.riadky));
  j.over(!r.zlom.length && !r.pretek.length, `písmo ${meno} (${w}): slovo zalomené uprostred / pretečie z rámika: ` + f(r.zlom.concat(r.pretek)));
  j.over(!r.orez.length, `písmo ${meno} (${w}): slovo čiastočne oreže okraj fotky / dlaždice (overflow hidden): ` + f(r.orez));
  j.over(!r.strana, `${meno} (${w}): stránka má vodorovný posuvník`);
}
/** Otvorený krok a „Pokračujte“ krokov 5 / 6 (automatický posun) + poloha novo otvoreného kroku v okne. */
const OTVORENY = `(function () {
  var k = window.__lcd1vKamion, o = k ? k.ui.U.otvoreny : "?", q = function (s) { return document.querySelector("#lcd1v-kamion " + s); };
  var el = o ? q('[data-krok="' + o + '"]') : null, r = el ? el.getBoundingClientRect() : null;
  return { otvoreny: o, hotovy5: !!q('[data-krok="nasivky"].is-done'), hotovy6: !!q('[data-krok="tapacir"].is-done'),
    dalej5: !!q('[data-a="dalej"][data-v="nasivky"]'), dalej6: !!q('[data-a="dalej"][data-v="tapacir"]'), top: r ? Math.round(r.top) : null, vh: innerHeight,
    rootBottom: Math.round(document.getElementById("lcd1v-kamion").getBoundingClientRect().bottom) };
})()`;

/** ?novy=1 pred vydaním (kamion nie je v ZAPNUTE_TYPY) = React: scenár sa preskočí, nie zlyhá (body.lcd-1v sa nečaká). */
const zapnuty = (a) => (a.zapnuteSet ? a.zapnuteSet.has(640) : !!a.novy);
const jeNovy = (s) => s.t.ev(`!!document.getElementById("lcd1v-kamion")`);

/** Postupnosť krokov v stránke: ["klik", selektor v #lcd1v-kamion] | ["vyber", pole, hodnota] | ["dalej", krok]. */
async function rob(s, j, kroky) {
  for (const k of kroky) {
    const r = await s.t.ev(`(function (k) {
      var root = document.getElementById("lcd1v-kamion"); if (!root) return "koreň chýba";
      var sel = k[0] === "dalej" ? '[data-a="dalej"][data-v="' + k[1] + '"]' : k[0] === "klik" ? k[1] : null;
      if (sel) { var el = root.querySelector(sel); if (!el) return "neexistuje " + sel; el.click(); return ""; }
      var s = root.querySelector('select[data-p="' + k[1] + '"]'); if (!s) return "neexistuje pole " + k[1];
      s.value = k[2]; if (s.value !== k[2]) return "pole " + k[1] + " nemá " + k[2];
      s.dispatchEvent(new Event("change", { bubbles: true })); return "";
    })(${JSON.stringify(k)})`);
    j.over(!r, "krok " + JSON.stringify(k) + ": " + r);
    await j.pauza(120);
  }
}
const a_ = (akcia, v, m) => '[data-a="' + akcia + '"]' + (m ? '[data-m="' + m + '"]' : "") + (v != null ? '[data-v="' + v + '"]' : "");

/** Stav po výbere: texty zvolených možností 15 selectov, súčet UI, poznámka objednávky. */
const STAV = `(function () {
  var sel = {}, ine = {};
  Array.prototype.forEach.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), function (s) {
    var o = s.options[s.selectedIndex];
    sel[s.getAttribute("data-parameter-id")] = s.value && o ? o.textContent.trim().replace(/\\s*\\+\\s*€\\s*\\d+\\s*$/, "") : "";
    if (s.value) ine[s.getAttribute("data-parameter-id")] = s.value;
  });
  var k = window.__lcd1vKamion, suma = document.querySelector("#lcd1v-kamion .k-suhrn__suma");
  return { sel: sel, ine: ine, spolu: k ? k.ui.cena().spolu : null, suma: suma ? suma.textContent : null,
    poznamka: sessionStorage.getItem("truckOrderSummary"), vozidlo: sessionStorage.getItem("truckVehicle"),
    krokov: document.querySelectorAll("#lcd1v-kamion .k-krok").length };
})()`;

/** R1: náhľad nášivky (canvas) nie je „tainted“ a motív je v farbe nite (počet pixelov blízkych farbe rgb). */
const NAHLAD = (rgb) => `(function (c) {
  var cv = document.querySelector("#lcd1v-kamion canvas[data-motiv]"); if (!cv) return { chyba: "canvas náhľadu chýba" };
  var d; try { d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return { chyba: "canvas tainted: " + e.message }; }
  var n = 0; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - c[0]) < 40 && Math.abs(d[i + 1] - c[1]) < 40 && Math.abs(d[i + 2] - c[2]) < 40) n++;
  return { n: n };
})(${JSON.stringify(rgb)})`;
async function overNahlad(s, j, rgb, meno) {
  let r = null;
  for (let i = 0; i < 20; i++) { r = await s.t.ev(NAHLAD(rgb)); if (r && !r.chyba && r.n > 50) break; await j.pauza(250); }
  j.over(r && !r.chyba && r.n > 50, "náhľad nášivky " + meno + ": " + JSON.stringify(r));
}
/** R2: pravidlá s BEM modifikátorom „--“ sú v CSS (computed style); „zvolené = zelené“ a otázky po jednej (Michal 18. 10. 2026). */
const STYLY = `(function () {
  function cs(sel, p, ps) { var el = document.querySelector("#lcd1v-kamion " + sel); return el ? getComputedStyle(el, ps || null)[p] : null; }
  var zm = document.querySelector("#lcd1v-kamion .kn-hot__zm");
  return { ano: cs(".an__b--ano", "backgroundImage"), nie: cs(".an__b--nie", "backgroundImage"), ponuka: cs(".kn-ponuka", "borderTopColor"),
    pas: cs(".kn-dv__b--bal .kn-dv__top", "backgroundImage"), dlZvol: cs(".kn-dv__b.is-on", "borderTopColor"), rad: cs(".kn-dv__b.is-on .kn-rad", "backgroundImage"),
    dlRamy: Array.prototype.map.call(document.querySelectorAll("#lcd1v-kamion .kn-dv__b"), function (e) { return getComputedStyle(e).borderTopColor; }),
    // ceny v riadkoch ako rohož a box do kufra (Michal 18. 10. 2026 v noci): Výhoda zelená tučná, „V SETE“ 12 px verzálkami, cena 800 20 px Exo 2
    vyhoda: cs(".kn-dv__b .k-ucet__r--zl .k-ucet__rh", "color"), vyhodaW: cs(".kn-dv__b .k-ucet__r--zl .k-ucet__rh", "fontWeight"),
    sumL: cs(".kn-dv__b .k-ucet__r--sum .k-ucet__rn", "fontSize"), sumLT: cs(".kn-dv__b .k-ucet__r--sum .k-ucet__rn", "textTransform"),
    sumC: cs(".kn-dv__b .k-ucet__r--sum .k-ucet__rh", "fontSize"), sumCW: cs(".kn-dv__b .k-ucet__r--sum .k-ucet__rh", "fontWeight"), sumCF: cs(".kn-dv__b .k-ucet__r--sum .k-ucet__rh", "fontFamily"),
    stara: document.querySelectorAll("#lcd1v-kamion .k-cenovka, #lcd1v-kamion .kn-dv s").length,
    ot: cs(".kn-ot", "fontSize"), hotIc: cs(".kn-hot__ic", "backgroundImage"), zmenitH: zm ? zm.getBoundingClientRect().height : 0,
    motiv: cs(".k-dlazdice--motiv .k-dlazdica__img", "backgroundColor"), motivFit: cs(".k-dlazdice--motiv .k-dlazdica__img", "objectFit"), motivZvol: cs(".k-dlazdice--motiv .k-dlazdica.is-on", "borderTopColor"),
    motivFajka: cs(".k-dlazdice--motiv .k-dlazdica.is-on", "backgroundImage", "::after"),
    // farby nite (3B, Michal 22. 10. 2026): paleta 4 v rade, krúžok 46 px, zvolená = zelený prstenec + zelená ✓ na krúžku
    nitZvol: (cs(".nt__b.is-on i", "boxShadow") || "").indexOf("rgb(31, 122, 82)") >= 0 ? "rgb(31, 122, 82)" : cs(".nt__b.is-on i", "boxShadow"),
    ntStlpce: (cs(".nt", "gridTemplateColumns") || "").split(" ").length, ntKruh: cs(".nt__b i", "width"), ntFajka: cs(".nt__b.is-on i", "backgroundImage", "::after"),
    ntMeno: cs(".nt__b.is-on .nt__nm", "color"), ntKod: cs(".nt__kod", "fontSize"),
    ntRiadky: (function () { var b = document.querySelectorAll('#lcd1v-kamion [data-krok="nasivky"] .nt__b'), t = {}; Array.prototype.forEach.call(b, function (x) { var r = Math.round(x.getBoundingClientRect().top); t[r] = (t[r] || 0) + 1; }); return Object.keys(t).sort(function (a, c) { return a - c; }).map(function (k) { return t[k]; }); })(),
    ntMin: Math.min.apply(null, Array.prototype.map.call(document.querySelectorAll("#lcd1v-kamion .nt__b"), function (x) { var r = x.getBoundingClientRect(); return Math.min(r.width, r.height); }).concat([999])) };
})()`;
/** 1B hlavička: cenový box s dvomi vetami „V cene …“ (✓ 18 px zelená), bez úvodnej vety a čipov. */
const HLAVICKA = `(function () {
  var q = function (s) { return document.querySelector("#lcd1v-kamion " + s); };
  var v = Array.prototype.map.call(document.querySelectorAll("#lcd1v-kamion .k-cena .k-cena__vr"), function (x) { return { t: x.textContent, w: getComputedStyle(x, "::before").width, bg: getComputedStyle(x, "::before").backgroundImage, vid: x.getClientRects().length > 0 }; });
  return { perex: !!q(".k-perex"), vc: !!q(".vc"), riadky: v, ciara: (q(".k-cena__vc") && getComputedStyle(q(".k-cena__vc")).borderTopStyle) || "" };
})()`;
const ZELENA = "rgb(31, 122, 82)", ZLATA = "rgb(196, 155, 49)";
/** Riadky cien (Samostatne / Výhoda v sete / V sete): každý na jednom riadku — štítok a suma vedľa seba, nič zalomené
 *  (Michal 18. 10. 2026 v noci, telefón 360–480 px ako karty rohože a boxov). Blok cien ide cez celú šírku obsahu rámika
 *  (ponuka tapacíru, nášivka na dvere) aj textu dlaždice 5.1 ako .lcd1v-kb__ucet na karte rohože: pravý okraj bloku = pravý
 *  okraj obsahu rodiča ± 1 px (revízia 19. 10. 2026: max-width 340 px nechal sumy v polovici rámika na tablete a PC). */
const RIADKY_CIEN = `(function () {
  var r = document.querySelectorAll("#lcd1v-kamion .k-ucet__r"), zle = [], okraj = [];
  Array.prototype.forEach.call(r, function (x) {
    var n = x.querySelector(".k-ucet__rn"), h = x.querySelector(".k-ucet__rh"); if (!n || !h || !x.getClientRects().length) return;
    var a = n.getBoundingClientRect(), b = h.getBoundingClientRect();
    if (n.getClientRects().length > 1 || h.getClientRects().length > 1 || Math.abs(a.bottom - b.bottom) > 6 || b.left < a.right) zle.push(n.textContent + " | " + h.textContent);
  });
  Array.prototype.forEach.call(document.querySelectorAll("#lcd1v-kamion .k-ucet"), function (u) {
    if (!u.getClientRects().length) return;
    var p = u.parentElement, pr = p.getBoundingClientRect(), pc = getComputedStyle(p), ur = u.getBoundingClientRect();
    var prav = pr.right - parseFloat(pc.borderRightWidth) - parseFloat(pc.paddingRight);
    if (Math.abs(ur.right - prav) > 1) okraj.push(p.className + ": blok " + Math.round(ur.right) + " ≠ obsah " + Math.round(prav));
  });
  return { n: r.length, zle: zle, okraj: okraj };
})()`;
/** Prepínač-pilulka Kamión / Dodávka: zvolená ZLATÁ s tmavým písmom (Michal 18. 10. 2026 v noci, ako volant / miesta / dvere). */
const SEGMENT = `(function () {
  var b = document.querySelector("#lcd1v-kamion .k-segment > button.is-on"); if (!b) return null;
  var c = getComputedStyle(b); return { bg: c.backgroundImage, farba: c.color, text: b.textContent };
})()`;
/** Krok 5.1: otázka s 3 fotkovými dlaždicami (načítaná fotka kabíny, ceny v riadkoch) + „Nie, ďakujem“, bez zeleného tlačidla v dlaždiciach. */
const KROK5 = `(function () {
  var q = function (s) { return document.querySelectorAll("#lcd1v-kamion " + s); };
  return { dlazdic: q(".kn-dv > .kn-dv__b").length, nie: !!document.querySelector('#lcd1v-kamion [data-a="nas"][data-v="nechcem"]'),
    foto: Array.prototype.map.call(q(".kn-dv__b .kn-scena > img"), function (i) { return i.complete ? i.naturalWidth : 0; }),
    cenovky: q(".kn-dv__b .k-ucet").length, zelene: q(".kn-dv .k-btn-zelene").length, dalej: q('[data-a="dalej"][data-v="nasivky"]').length,
    otazka: (document.querySelector("#lcd1v-kamion .kn-ot") || {}).textContent || "",
    // revízia 18. 10. 2026 večer: výrez fotky pokrýva celé okno fotky a v rozložení fotka | text (zoznam ≥ 600 px — tablet,
    // široký PC) fotka vyplní výšku dlaždice (bez bielych pásov); užší stĺpec (PC 992–1919 px, telefón) = fotka nad textom
    fotky: Array.prototype.map.call(q(".kn-dv > .kn-dv__b"), function (b) {
      var f = b.querySelector(".kn-foto"), sc = b.querySelector(".kn-scena"), top = b.querySelector(".kn-dv__top");
      var fr = f.getBoundingClientRect(), sr = sc.getBoundingClientRect(), br = b.getBoundingClientRect();
      var kryje = sr.left <= fr.left + 1 && sr.right >= fr.right - 1 && sr.top <= fr.top + 1 && sr.bottom >= fr.bottom - 1;
      var vnutro = br.height - 4 - (top ? top.getBoundingClientRect().height : 0);
      var vedla = getComputedStyle(b).display === "grid", zoznam = b.parentElement.getBoundingClientRect().width;
      return { kryje: kryje, plna: vedla ? fr.height >= vnutro - 2 : Math.abs(fr.width - (br.width - 4)) <= 1, vedla: vedla, ocakVedla: zoznam >= 600,
        h: Math.round(fr.height), dl: Math.round(vnutro) };
    }) };
})()`;
/** Farby tapacíru v karte („Vybrať inak“): žiadny názov farby sa nesmie zalomiť uprostred slova (revízia 18. 10. 2026 večer). */
const ZLOM_FARIEB = `(function () {
  var nm = document.querySelectorAll('#lcd1v-kamion [data-krok="tapacir"] .kn-karta .fb__kod'), zlomene = [];
  Array.prototype.forEach.call(nm, function (el) {
    var tn = el.firstChild; if (!tn || tn.nodeType !== 3) return;
    var re = /\\S+/g, m, t = tn.textContent;
    while ((m = re.exec(t))) {
      var r = document.createRange(); r.setStart(tn, m.index); r.setEnd(tn, m.index + m[0].length);
      var tops = {}; Array.prototype.forEach.call(r.getClientRects(), function (x) { if (x.width > 0) tops[Math.round(x.top)] = 1; });
      if (Object.keys(tops).length > 1) zlomene.push(m[0]);
    }
  });
  var g = document.querySelector('#lcd1v-kamion [data-krok="tapacir"] .kn-karta .fb');
  return { n: nm.length, zlomene: zlomene, stlpce: g ? getComputedStyle(g).gridTemplateColumns.split(" ").length : 0 };
})()`;
/** Karta podotázky kroku 5: otvorené bloky, veľký náhľad cez celú šírku karty v ≥ 2× rozlíšení. */
const KARTA5 = `(function () {
  var cv = document.querySelector('#lcd1v-kamion [data-krok="nasivky"] .kn-karta .kn-nh__cv'), k = cv && cv.closest(".kn-karta"), cs = k ? getComputedStyle(k) : null;
  return { otvorene: Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion [data-krok="nasivky"] [data-blok]'), function (e) { return e.getAttribute("data-blok"); }),
    vnutro: k ? k.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) : 0, cvCss: cv ? cv.clientWidth : 0, cvW: cv ? cv.width : 0, cvH: cv ? cv.height : 0 };
})()`;
/** Po „Pokračovať“ je novo otvorená karta plynulo posunutá hore do okna (pod hlavičku webu). */
const POSUN = (blok) => `(function () { var e = document.querySelector('#lcd1v-kamion [data-blok="${blok}"]'); if (!e) return null; var r = e.getBoundingClientRect();
  return { top: Math.round(r.top), vh: innerHeight, rootBottom: Math.round(document.getElementById("lcd1v-kamion").getBoundingClientRect().bottom) }; })()`;
/** Krok 6: celá fotka dverí v ponuke (pomer vykreslenia = pomer súboru, bez orezania), dve zjavné voľby „Rovnaké ako koberce /
 *  Vlastná kombinácia“ (karty .kn-tv__b, aj po zatvorení ponuky). */
const KROK6 = `(function () {
  var rv = Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion [data-krok="tapacir"] .kn-tv__b'), function (x) { return x.getAttribute("data-a") + ":" + x.getAttribute("aria-pressed"); });
  var i = document.querySelector('#lcd1v-kamion [data-krok="tapacir"] .kn-dvere:not(.kn-dvere--vyrez) > img') || document.querySelector('#lcd1v-kamion [data-krok="tapacir"] .kn-dvere--gal > .kn-gal__s.is-on > img'); if (!i) return { chyba: "fotka dverí chýba", rv: rv };
  var b = i.getBoundingClientRect(), r = i.parentElement.getBoundingClientRect();
  return { nw: i.complete ? i.naturalWidth : 0, nh: i.naturalHeight, w: b.width, h: b.height, ram: r.width, fit: getComputedStyle(i).objectFit, rv: rv };
})()`;
/** Krok 6, materiál tapacíru (Michal 22. 10. 2026): čiernobiela fotka výplne dverí 815:500, karty ≥ 44 px s krúžkom 28 px,
 *  fotka materiálu a pás lemovania sa NEPREKRÝVAJÚ (karta „Rovnaké ako koberce“ aj tmavý box „Vybraté pre tapacír“). */
const TAP_MAT = `(function () {
  var k = document.querySelector('#lcd1v-kamion [data-krok="tapacir"]'); if (!k) return null;
  function rc(e) { if (!e) return null; var r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }
  function prekryv(a, b) { return !!(a && b && a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5); }
  var f = k.querySelector(".kn-tvfoto"), fi = f && f.querySelector("img"), fr = rc(f);
  var karty = Array.prototype.map.call(k.querySelectorAll(".kn-tv__b"), function (b) { var r = b.querySelector(".kn-tv__r"); return { h: Math.round(b.getBoundingClientRect().height), r: r ? Math.round(r.getBoundingClientRect().width) : 0 }; });
  var mA = rc(k.querySelector(".kn-tv__d .kn-tv__foto")), pA = rc(k.querySelector(".kn-tv__pas")), lA = rc(k.querySelector(".kn-tv__pas > img"));
  var mV = rc(k.querySelector(".kn-vz__mat")), lV = rc(k.querySelector(".kn-vz__lem"));
  return { foto: !!fi, filter: fi ? getComputedStyle(fi).filter : "", pomer: fr && fr.h ? Math.round(fr.w / fr.h * 1000) / 1000 : 0, nw: fi && fi.complete ? fi.naturalWidth : 0,
    karty: karty, a: { prekryv: prekryv(mA, pA), vyska: mA ? Math.round(mA.h) : 0, rovnako: mA && pA ? Math.abs(mA.h - pA.h) <= 3 : null, pasH: lA ? Math.round(lA.h) : 0, pasW: lA && pA ? Math.abs(lA.w - (pA.w - 2)) <= 1 : null,
      naj: (function () { var p = k.querySelector(".kn-tv__b--naj > .kn-tv__top"); return p ? { tx: p.textContent, bg: getComputedStyle(p).backgroundImage.indexOf("gradient") >= 0 } : null; })() },
    vz: mV || lV ? { prekryv: prekryv(mV, lV) } : null };
})()`;
/** Po poslednej odpovedi (Michal 24. 10. 2026, predtým „zoskrolovalo do tramtárie“): v okne je celý prehľad objednávky —
 *  „Váš set v N krokoch“ nezakrytý hlavičkou webu, riadky krokov, Spolu a „Pridať do košíka“. Keď sa celý nevojde
 *  (nízke okno), tlačidlo košíka je celé vidno pri spodnom okraji. */
const PREHLAD = `(function () {
  var p = document.querySelector('#lcd1v-kamion [data-k="postup"]'), b = document.querySelector('#lcd1v-kamion [data-k="suhrn"] .k-kosik');
  if (!p || !b) return null;
  var rp = p.getBoundingClientRect(), rb = b.getBoundingClientRect(), x = rp.left + 8, el = rp.top >= 0 && rp.top < innerHeight ? document.elementFromPoint(x, rp.top + 6) : null;
  var l = document.getElementById("lcd1v-lista");
  return { hore: Math.round(rp.top), dole: Math.round(rb.bottom), vh: innerHeight, sirka: innerWidth, volne: !!(el && p.contains(el)),
    lista: l && l.classList.contains("on") && getComputedStyle(l).visibility !== "hidden" ? l.innerText : "",
    rootBottom: Math.round(document.getElementById("lcd1v-kamion").getBoundingClientRect().bottom) };
})()`;
/** 25. 10. 2026 večer (Michal, PC 2000×1000: „čím ďalej v konfigurátore, tým nižšie … už vidno aj popisky pod ním“):
 *  posun nikdy nejde pod spodok konfigurátora — ten ostane SPODOK px nad spodkom okna, galéria pod ním je mimo okna.
 *  Keď sa zvyšok konfigurátora od kroku nadol vojde do okna, krok nie je hore, ale celý v okne a nad ním hotové kroky. */
const SPODOK = 16;
const bezPopisov = (r) => !!r && r.rootBottom != null && r.rootBottom >= r.vh - SPODOK - 4;
const priSpodku = (r) => Math.abs(r.rootBottom - (r.vh - SPODOK)) <= 4;
/** 25. 10. 2026 (Michal: „vždy na začiatok ďalšieho kroku“): nadpis prehľadu hore (≤ 40 px, nezakrytý) alebo konfigurátor
 *  pri spodku okna; „Pridať do košíka“ celé v okne — na telefóne môže byť pod oknom, vtedy ho ponúka spodná lišta. */
const prehladOk = (r) => !!r && r.hore >= 0 && (r.hore <= 40 || priSpodku(r)) && r.volne && bezPopisov(r) && (r.dole <= r.vh || (r.sirka < 768 && /košík/i.test(r.lista)));
/** Po „Pokračovať“ / automatickom posune: začiatok novo otvoreného kroku 0–40 px od vrchu okna (Michal 25. 10. 2026),
 *  alebo nižšie, keď by inak bolo vidno popisy pod konfigurátorom (spodok konfigurátora pri spodku okna). */
const zaciatokOk = (r) => !!r && r.top != null && r.top >= 0 && (r.top <= 40 || priSpodku(r)) && bezPopisov(r);
async function overZaciatok(s, j, krok) {
  const r = await cakaj(s, j, OTVORENY, (x) => x.otvoreny === krok && zaciatokOk(x));
  j.over(r && r.otvoreny === krok && zaciatokOk(r), "po „Pokračovať“ nie je začiatok kroku „" + krok + "“ hore v okne (0–40 px): " + JSON.stringify(r));
}
/** Opakuje vyhodnotenie (lenivé načítanie fotiek, kreslenie plátna), kým podmienka neplatí, najviac ~6 s. */
async function cakaj(s, j, vyraz, ok) {
  let r = null;
  for (let i = 0; i < 24; i++) { r = await s.t.ev(vyraz); if (r && ok(r)) break; await j.pauza(250); }
  return r;
}

async function doKosika(s, a, j, meno) {
  await snimkaPrvku(s, a, j, '[data-k="suhrn"]', meno + "-pred-kosikom");
  await rob(s, j, [["klik", a_("kosik")]]);
  const post = await j.cakajNaPost(s);
  const st = await s.t.ev(STAV);
  // „Rozloženie nášiviek“ (349) jadro testu berie ako krok rozloženia autokobercov (PARAMETRE.rozlozenie) -> ocak.rozlozenie
  const idR = await s.t.maParameter("rozlozenie");
  const ine = Object.assign({}, st.ine);
  if (idR) delete ine[idR];
  const cena = await j.overPost(s, post, { ine, rozlozenie: idR ? st.ine[idR] : undefined });
  j.over(cena.spolu === st.spolu, "cena v košíku Shoptetu " + cena.spolu + " € (" + cena.rozpis + ") ≠ konfigurátor " + st.spolu + " €");
  j.over(st.suma === j.eur(st.spolu), "súhrn „" + st.suma + "“ ≠ " + j.eur(st.spolu));
  j.over(/^ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: /.test(st.poznamka || ""), "poznámka objednávky chýba: " + st.poznamka);
  return { post, st, cena };
}

export const SCENARE = {
  "kamion-platne": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await snimka(s, a, "kamion-start");
      await overPismo(s, j, "krok 1 + hlavička");
      const hl = await s.t.ev(HLAVICKA);
      j.over(!hl.perex && !hl.vc && hl.ciara === "dashed" && hl.riadky.length === 2 && hl.riadky.every((x) => x.vid && x.w === "18px" && /rgb\(29, 107, 74\)/.test(x.bg)) &&
        hl.riadky[0].t === "V cene: šofér, spolujazdec aj stred" && hl.riadky[1].t === "Farba a lemovanie bez príplatku", "hlavička 1B (cenový box s dvomi vetami ✓, bez úvodnej vety a čipov): " + JSON.stringify(hl));
      const seg = await s.t.ev(SEGMENT);
      j.over(seg && /rgb\(143, 112, 32\)|rgb\(230, 200, 119\)/.test(seg.bg || "") && seg.farba === "rgb(23, 19, 10)", "prepínač Kamión / Dodávka: zvolená pilulka nie je zlatá s tmavým písmom: " + JSON.stringify(seg));
      await rob(s, j, [["vyber", "znacka", "DAF (TIR)"], ["vyber", "model", "XF106 2017-2021"]]);
      await overPismo(s, j, "krok 1 vybrané vozidlo");
      await rob(s, j, [["dalej", "vozidlo"]]);
      await overZaciatok(s, j, "material");
      await rob(s, j, [["klik", a_("mat", "Prémiová syntetická koža – prešívaná")]]);
      await overPismo(s, j, "krok 2 materiál");
      await rob(s, j, [["dalej", "material"]]);
      await overZaciatok(s, j, "farba");
      await rob(s, j, [["klik", a_("farba", "11")]]);
      await overPismo(s, j, "krok 3 farba");
      await rob(s, j, [["dalej", "farba"]]);
      await overZaciatok(s, j, "lemovanie");
      await rob(s, j, [["klik", a_("lem", "04")]]);
      await overPismo(s, j, "krok 4 lemovanie");
      await rob(s, j, [["dalej", "lemovanie"]]);
      await overZaciatok(s, j, "nasivky");
      // 5.1 — veľká otázka, 4 výlučné voľby s cenami v riadkoch, žiadne zelené tlačidlo v dlaždiciach ani „Pokračujte ďalej“
      await s.t.ev(`document.querySelector('#lcd1v-kamion .kn-dv').scrollIntoView({ block: "start" })`);
      const k5 = await cakaj(s, j, KROK5, (r) => r.foto.length === 3 && r.foto.every((x) => x > 0));
      j.over(k5.dlazdic === 3 && k5.nie && k5.cenovky === 3 && !k5.zelene && !k5.dalej && k5.otazka === "Prosím, vyberte si, kam chcete nášivky", "krok 5.1: 3 fotkové dlaždice s cenami v riadkoch + „Nie, ďakujem“, bez zeleného tlačidla: " + JSON.stringify(k5));
      j.over(k5.foto.length === 3 && k5.foto.every((x) => x > 0), "fotka kabíny sa nenačítala: " + JSON.stringify(k5.foto));
      j.over(k5.fotky.length === 3 && k5.fotky.every((x) => x.kryje && x.plna), "fotka v dlaždici 5.1 nevyplní okno / výšku dlaždice (biele pásy): " + JSON.stringify(k5.fotky));
      j.over(k5.fotky.every((x) => x.vedla === x.ocakVedla), "krok 5.1: rozloženie fotka | text len pri zozname ≥ 600 px (inak fotka nad textom): " + JSON.stringify(k5.fotky));
      const st5a = await s.t.ev(STYLY);
      j.over(/rgb\(143, 112, 32\)|rgb\(230, 200, 119\)/.test(st5a.pas || ""), "pás „★ Najobľúbenejšie ★“ nie je zlatý: " + st5a.pas);
      j.over(st5a.vyhoda === "rgb(31, 122, 82)" && Number(st5a.vyhodaW) >= 700 && parseFloat(st5a.sumL) >= 12 && st5a.sumLT === "uppercase" && parseFloat(st5a.sumC) >= 18 &&
        Number(st5a.sumCW) >= 800 && /Exo 2/.test(st5a.sumCF || "") && !st5a.stara,
        "ceny nie sú v riadkoch ako rohož a box (Výhoda zelená tučná, V SETE verzálkami, cena 800 Exo 2, bez cenovky a prečiarknutej): " +
        JSON.stringify([st5a.vyhoda, st5a.vyhodaW, st5a.sumL, st5a.sumLT, st5a.sumC, st5a.sumCW, st5a.sumCF, st5a.stara]));
      const rc5 = await s.t.ev(RIADKY_CIEN);
      j.over(rc5.n === 9 && !rc5.zle.length && !rc5.okraj.length, "krok 5.1: riadky cien (3 × 3) zalomené, chýbajú alebo nesiahajú po pravý okraj textu: " + JSON.stringify(rc5));
      j.over(parseFloat(st5a.ot) >= 20, "otázka „Prosím, vyberte si …“ nie je veľká (≥ 20 px, výrazne nad názvami dlaždíc 17 px): " + st5a.ot);
      j.over(st5a.dlRamy.every((x) => x !== ZELENA), "pred výberom je niektorá dlaždica zelená: " + JSON.stringify(st5a.dlRamy));
      await overPismo(s, j, "krok 5.1 kam");
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-kam");
      await rob(s, j, [["klik", a_("nas", "boky+stred")], ["klik", a_("motiv", "H19", "boky")], ["klik", a_("nit", "2824", "boky")]]);
      const st5 = await s.t.ev(STYLY);
      j.over(st5.motivZvol === ZELENA && st5.nitZvol === ZELENA, "zvolené nie je zelené (motív " + st5.motivZvol + ", niť " + st5.nitZvol + ")");
      j.over(st5.ntStlpce === 4 && JSON.stringify(st5.ntRiadky) === "[4,4,3]" && st5.ntKruh === "46px" && /rgb\(29, 107, 74\)/.test(st5.ntFajka || "") && st5.ntMeno === ZELENA && st5.ntKod === "12px" && st5.ntMin >= 44,
        "farby nite: paleta 4 v rade (11 = 4 + 4 + 3), krúžok 46 px, zelená ✓ a meno, kód 12 px, ťuk-plocha ≥ 44 px: " + JSON.stringify([st5.ntStlpce, st5.ntRiadky, st5.ntKruh, st5.ntFajka, st5.ntMeno, st5.ntKod, st5.ntMin]));
      j.over(/rgb\(29, 107, 74\)/.test(st5.motivFajka || "") && /rgb\(29, 107, 74\)/.test(st5.hotIc || ""), "fajka zvolenej voľby nie je zelená: " + st5.motivFajka + " | " + st5.hotIc);
      j.over(st5.zmenitH >= 44, "„Zmeniť“ má ťuk-plochu " + st5.zmenitH + " px (< 44)");
      // revízia 18. 10. 2026 (ako návrh C): motív cez celú dlaždicu (cover) na béžovom podklade PNG motívu #f0edda
      j.over(st5.motiv === "rgb(240, 237, 218)" && st5.motivFit === "cover", "dlaždica motívu nie je ako návrh C (béžový podklad, cover): " + st5.motiv + " | " + st5.motivFit);
      const kk = await cakaj(s, j, KARTA5, (r) => r.cvW > 0);
      j.over(JSON.stringify(kk.otvorene) === JSON.stringify(["boky"]), "po výbere všetkých troch má byť otvorená LEN karta „pod sedadlami“: " + JSON.stringify(kk.otvorene));
      j.over(kk.cvCss >= kk.vnutro - 2 && kk.cvW >= 2 * kk.cvCss - 1 && Math.abs(kk.cvW * 2 - kk.cvH * 3) <= 3, "veľký náhľad: plátno " + kk.cvW + "×" + kk.cvH + " px, CSS " + kk.cvCss + " px, karta " + kk.vnutro + " px");
      await overNahlad(s, j, [200, 30, 40], "v nití 2824 (červená)");
      await overPismo(s, j, "krok 5 karta pod sedadlá");
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-nasivky");
      await snimkaPrvku(s, a, j, ".k-dlazdice--motiv", "kamion-krok5-nahlad");
      await rob(s, j, [["klik", a_("nit", "2999", "boky")], ["klik", a_("potvrd", "boky")]]);
      await j.pauza(900);
      const ps = await cakaj(s, j, POSUN("stred"), zaciatokOk);
      j.over(zaciatokOk(ps), "po „Pokračovať“ nie je začiatok karty stredu hore v okne (0–40 px) / vidno popisy pod konfigurátorom: " + JSON.stringify(ps));
      await overPismo(s, j, "krok 5 stred");
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-stred");
      // automatický posun: „Rovnaká ako pod sedadlami“ = posledná otázka -> krok 5 sa sám zavrie, otvorí sa krok 6 (posunutý do okna)
      await rob(s, j, [["klik", a_("stredRovnaky", "1")]]);
      await j.pauza(900);
      const po5 = await cakaj(s, j, OTVORENY, (x) => x.otvoreny === "tapacir" && zaciatokOk(x));
      j.over(po5.otvoreny === "tapacir" && po5.hotovy5 && !po5.dalej5, "po „Rovnaká ako pod sedadlami“ sa krok 5 nezavrel sám / neotvoril sa krok 6: " + JSON.stringify(po5));
      j.over(zaciatokOk(po5), "krok 6 po automatickom posune nezačína hore v okne (0–40 px): " + JSON.stringify(po5));
      await overPismo(s, j, "krok 5 zavretý, krok 6 ponuka");
      await rob(s, j, [["klik", '[data-a="krok"][data-v="nasivky"]'], ["klik", a_("zmenit", "kam")]]);
      const st5z = await s.t.ev(STYLY);
      j.over(st5z.dlRamy.filter((x) => x === ZELENA).length === 1 && st5z.dlZvol === ZELENA && /rgb\(29, 107, 74\)/.test(st5z.rad || ""), "zvolená má byť zelená LEN jedna dlaždica: " + JSON.stringify(st5z.dlRamy) + " | " + st5z.rad);
      // otázka znova otvorená cez „Zmeniť“ a tá istá odpoveď = hotovo -> krok 5 sa znova sám zavrie
      await rob(s, j, [["klik", a_("nas", "boky+stred")]]);
      const po5b = await s.t.ev(OTVORENY);
      j.over(po5b.otvoreny === "tapacir" && !po5b.dalej5, "Zmeniť kam + tá istá voľba: krok 5 sa nezavrel sám " + JSON.stringify(po5b));
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-hotove");
      j.over((await s.t.ev(STYLY)).ponuka === ZLATA, "ponuka tapacíru (kn-ponuka) bez zlatého rámu");
      await s.t.ev(`document.querySelector('#lcd1v-kamion [data-krok="tapacir"]').scrollIntoView({ block: "start" })`);
      const k6 = await cakaj(s, j, KROK6, (r) => r.nw > 0);
      j.over(k6.nw > 0 && Math.abs(k6.w / k6.h - k6.nw / k6.nh) < 0.02 && Math.abs(k6.w - k6.ram) <= 2, "fotka dverí nie je celá (bez orezania) cez šírku karty: " + JSON.stringify(k6));
      const rc6 = await s.t.ev(RIADKY_CIEN);
      j.over(rc6.n === 3 && !rc6.zle.length && !rc6.okraj.length, "ponuka tapacíru: riadky cien zalomené, chýbajú alebo nesiahajú po pravý okraj rámika: " + JSON.stringify(rc6));
      await snimkaPrvku(s, a, j, '[data-krok="tapacir"]', "kamion-krok6-ponuka");
      await rob(s, j, [["klik", a_("tap", "ano")]]);
      const k6a = await s.t.ev(KROK6);
      j.over(JSON.stringify(k6a.rv) === JSON.stringify(["tapRovnake:false", "tapZmenit:false"]), "tapacír: chýba otázka „Rovnaké ako koberce / Vlastná kombinácia“ bez predvoľby: " + JSON.stringify(k6a.rv));
      const tm = await cakaj(s, j, TAP_MAT, (x) => x && x.nw > 0);
      j.over(tm && tm.foto && /grayscale\(1\)/.test(tm.filter) && Math.abs(tm.pomer - 815 / 500) < 0.02, "tapacír: fotka výplne dverí nie je čiernobiela 815:500: " + JSON.stringify(tm));
      j.over(tm && tm.karty.length === 2 && tm.karty.every((x) => x.h >= 44 && x.r === 28), "tapacír: karty volieb < 44 px alebo krúžok ≠ 28 px: " + JSON.stringify(tm && tm.karty));
      // 25. 10. 2026 (Michal): fotky v „Rovnaké ako koberce“ nižšie (92 px, nie štvorce), karta ako odporúčaný kufor Classic (zlatý pás)
      j.over(tm && tm.a.prekryv === false && tm.a.vyska >= 80 && tm.a.vyska <= 100 && tm.a.rovnako === true && tm.a.pasH === 46 && tm.a.pasW === true &&
        tm.a.naj && tm.a.naj.bg && tm.a.naj.tx.indexOf("★ Odporúčame ★") === 0, "tapacír: materiál a lemovanie v karte sa prekrývajú / nie sú nízke a rovnako vysoké / pás ≠ 46 px / chýba zlatý pás Odporúčame: " + JSON.stringify(tm && tm.a));
      await overPismo(s, j, "krok 6 materiál tapacíru");
      await snimkaPrvku(s, a, j, '[data-krok="tapacir"]', "kamion-krok6-ano");
      // „Vybrať inak“ (S.tapRovnaky potom znova true -> tapacír ako koberce, POST bez zmeny): názvy farieb v karte celé
      await rob(s, j, [["klik", a_("tapZmenit")]]);
      const zl = await cakaj(s, j, ZLOM_FARIEB, (r) => r.n > 0);
      j.over(zl && zl.n > 0 && !zl.zlomene.length, "farby tapacíru v karte: názov zalomený uprostred slova " + JSON.stringify(zl));
      const tmv = await s.t.ev(TAP_MAT);
      j.over(tmv && tmv.vz && tmv.vz.prekryv === false, "„Vybraté pre tapacír“: fotka materiálu a lemovania sa prekrývajú: " + JSON.stringify(tmv && tmv.vz));
      await overPismo(s, j, "krok 6 vybrať inak (materiál, farba, lemovanie)");
      await snimkaPrvku(s, a, j, '[data-krok="tapacir"]', "kamion-krok6-zmenit");
      await rob(s, j, [["klik", a_("zmenit", "mat")]]);
      await rob(s, j, [["klik", a_("tapRovnake")]]);
      const rcd = await s.t.ev(RIADKY_CIEN);
      j.over(rcd.n === 3 && !rcd.zle.length && !rcd.okraj.length, "nášivka na dvere: riadky cien zalomené, chýbajú alebo nesiahajú po pravý okraj rámika: " + JSON.stringify(rcd));
      await snimkaPrvku(s, a, j, ".an", "kamion-krok6-nasivka-dvere");
      const st6 = await s.t.ev(STYLY);
      j.over(/rgb\(29, 107, 74\)/.test(st6.ano || "") && /rgb\(226, 190, 92\)/.test(st6.nie || ""), "nášivka na tapacír: Áno nie je zelené / Nie zlaté: " + st6.ano + " | " + st6.nie);
      await overPismo(s, j, "krok 6 nášivka na dvere");
      // posledná odpoveď kroku 6 -> krok sa sám zavrie, ďalej súhrn (bez „Pokračujte k súhrnu“)
      await rob(s, j, [["klik", a_("tapNas", "nie")]]);
      await j.pauza(700);
      const po6 = await s.t.ev(OTVORENY);
      j.over(po6.otvoreny === null && po6.hotovy6 && !po6.dalej6, "po „Nie“ pri nášivke na dvere sa krok 6 nezavrel sám: " + JSON.stringify(po6));
      const pr6 = await cakaj(s, j, PREHLAD, prehladOk);
      j.over(prehladOk(pr6), "po poslednej odpovedi nie je v okne celý prehľad (Váš set v 6 krokoch … Pridať do košíka): " + JSON.stringify(pr6));
      await snimka(s, a, "kamion-prehlad-po-poslednom");
      await overPismo(s, j, "súhrn objednávky");
      const { post, st, cena } = await doKosika(s, a, j, "kamion-platne");
      const ocak = { 346: "Prémiová syntetická koža – prešívaná", 349: "Šofér + spolujazdec + stred (BALÍK)", 403: "Nášivka H19", 406: "Čierna – 2999", 409: "Nášivka H19", 412: "Čierna – 2999", 352: "Áno chcem (v konfigurátore – balík)", 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" };
      Object.entries(ocak).forEach(([id, t]) => j.over(st.sel[id] === t, id + " „" + st.sel[id] + "“ ≠ „" + t + "“"));
      j.over(st.vozidlo === "DAF (TIR) XF106 2017-2021", "truckVehicle " + st.vozidlo);
      // telo POST bajt po bajte = docs/kamiony-snimky/post-porovnanie.json (= React); aj do výsledku (--json)
      j.over(post && post.body === vzorPost("kamion-platne"), "telo POST ≠ post-porovnanie.json react.body: " + (post ? post.body.slice(0, 160) : "žiadny POST"));
      return { info: "423 € = " + cena.zaklad + " + " + cena.rozpis + " · POST = vzor", post: post ? post.body : null, spolu: cena.spolu };
    },
  },
  // 25. 10. 2026 (Michal: „nie vždy to vyskroluje tam, kde má“): posun na začiatok ďalšieho kroku musí prežiť ďalšie
  // ťuknutie hneď po „Pokračovať“ (render() vymení prvky), udalosť kolieska hneď po kliku (dobeh touchpadu) a posun
  // zastavený / prerušený skôr (iPhone) — po ustálení musí stránka stáť na začiatku kroku.
  "kamion-posun": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await rob(s, j, [["vyber", "znacka", "DAF (TIR)"], ["vyber", "model", "XF106 2017-2021"], ["dalej", "vozidlo"]]);
      await overZaciatok(s, j, "material");
      // koliesko 100 ms po kliku (dobeh touchpadu) posun nezruší
      await rob(s, j, [["klik", a_("mat", "Prémiová syntetická koža – prešívaná")], ["dalej", "material"]]);
      await s.t.ev(`new Promise(function (r) { setTimeout(function () { window.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, bubbles: true })); r(1); }, 100); })`);
      await overZaciatok(s, j, "farba");
      // ďalšie ťuknutie 30 ms po „Pokračovať“ (prekreslenie) posun nezruší
      await rob(s, j, [["klik", a_("farba", "11")], ["dalej", "farba"]]);
      await s.t.ev(`new Promise(function (r) { setTimeout(function () { var b = document.querySelector('#lcd1v-kamion [data-a="lem"][data-v="04"]'); if (b) b.click(); r(1); }, 30); })`);
      await overZaciatok(s, j, "lemovanie");
      // posun prerušený skokom 300 px späť (ako zastavený plynulý posun na iPhone) -> dorovná sa
      await rob(s, j, [["dalej", "lemovanie"]]);
      await s.t.ev(`new Promise(function (r) { setTimeout(function () { window.scrollBy({ top: -300, behavior: "instant" }); r(1); }, 250); })`);
      await overZaciatok(s, j, "nasivky");
      // „Nie, ďakujem“ (nášivky) -> tapacír začiatok hore; „Nie“ tapacír -> prehľad od nadpisu
      await rob(s, j, [["klik", a_("nas", "nechcem")]]);
      await overZaciatok(s, j, "tapacir");
      await rob(s, j, [["klik", a_("tap", "nie")]]);
      const pr = await cakaj(s, j, PREHLAD, prehladOk);
      j.over(prehladOk(pr), "po poslednom kroku nie je prehľad od nadpisu hore: " + JSON.stringify(pr));
      return { info: "začiatok kroku hore aj po koliesku, ďalšom ťuknutí a prerušenom posune" };
    },
  },
  // 25. 10. 2026 večer (Michal, PC okno ~2000×1000): „čím ďalej v konfigurátore, tým nižšie ho to po potvrdení zroluje …
  // po poslednom kroku vidno aj popisky pod konfigurátorom (Galéria)“. Jeho cesta: IVECO Stralis Hi-Way obytná kabína,
  // nášivky boky + stred, karta Stred, tapacír ako koberce s nášivkou. Po každom posune spodok konfigurátora pri spodku
  // okna alebo nižšie (galéria mimo okna), otvorený krok / karta celý v okne.
  "kamion-posun-vysoke": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      if (s.k.sirka < 768) return { preskoc: "len PC (vysoké okno)" };
      await s.k.posli("Emulation.setDeviceMetricsOverride", { width: 1984, height: 1000, deviceScaleFactor: 1, mobile: false });
      try {
        await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
        if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
        const modely = await s.t.ev(`Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion select[data-p="model"] option'), function (o) { return o.value; })`);
        await rob(s, j, [["vyber", "znacka", "IVECO (TIR)"]]);
        const model = (await s.t.ev(`Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion select[data-p="model"] option'), function (o) { return o.value; })`)).find((m) => /Stralis Hi-Way 2011-2019 – obytná kabína/.test(m));
        j.over(!!model, "model IVECO Stralis Hi-Way obytná kabína chýba: " + JSON.stringify(modely));
        await rob(s, j, [["vyber", "model", model], ["dalej", "vozidlo"]]);
        await overZaciatok(s, j, "material");
        await rob(s, j, [["klik", a_("mat", "Prémiová syntetická koža – prešívaná")], ["dalej", "material"]]);
        await overZaciatok(s, j, "farba");
        await rob(s, j, [["klik", a_("farba", "9")], ["dalej", "farba"]]);
        await overZaciatok(s, j, "lemovanie");
        await rob(s, j, [["klik", a_("lem", "05")], ["dalej", "lemovanie"]]);
        await overZaciatok(s, j, "nasivky");
        await rob(s, j, [["klik", a_("nas", "boky+stred")], ["klik", a_("motiv", "H21", "boky")], ["klik", a_("nit", "3504", "boky")], ["klik", a_("potvrd", "boky")]]);
        const ps = await cakaj(s, j, POSUN("stred"), zaciatokOk);
        j.over(zaciatokOk(ps), "karta Stred: začiatok nie je v okne / vidno popisy pod konfigurátorom: " + JSON.stringify(ps));
        await rob(s, j, [["klik", a_("stredRovnaky", "1")]]);
        await overZaciatok(s, j, "tapacir");
        // tapacír ako koberce + nášivka na dvere: posuny v rámci kroku 6 — galéria nikdy v okne
        for (const [k, popis] of [[["klik", a_("tap", "ano")], "tapacír áno"], [["klik", a_("tapRovnake")], "rovnaké ako koberce"], [["klik", a_("tapNas", "ano")], "nášivka na dvere áno"]]) {
          await rob(s, j, [k]);
          await j.pauza(1800);
          const r = await s.t.ev(OTVORENY);
          j.over(bezPopisov(r), "po „" + popis + "“ vidno popisy pod konfigurátorom (spodok konfigurátora " + r.rootBottom + " px, okno " + r.vh + " px)");
        }
        await rob(s, j, [["klik", a_("tapNasRovnaka", "1")]]);
        const pr = await cakaj(s, j, PREHLAD, prehladOk);
        j.over(prehladOk(pr), "po poslednom kroku nie je v okne celý prehľad bez galérie pod ním: " + JSON.stringify(pr));
        return { info: "1984×1000: spodok konfigurátora nikdy nad spodkom okna, krok / karta / prehľad celé v okne" };
      } finally {
        await s.k.posli("Emulation.setDeviceMetricsOverride", { width: s.k.sirka, height: s.k.vyska, deviceScaleFactor: 1, mobile: !!s.k.mobil });
      }
    },
  },
  "kamion-dodavka": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await rob(s, j, [
        ["klik", a_("typ", "dodavka")], ["vyber", "znacka", "Fiat (dodávka)"], ["vyber", "model", "Ducato 2007-2025"], ["dalej", "vozidlo"],
        ["klik", a_("mat", "Prémiová syntetická koža – jednofarebná")], ["dalej", "material"],
        ["klik", a_("farba", "10G")], ["dalej", "farba"],
        ["klik", a_("lem", "09")], ["dalej", "lemovanie"],
        ["klik", a_("nas", "stred")], ["klik", a_("motiv", "H21", "stred")], ["klik", a_("nit", "3546", "stred")],
      ]);
      await overNahlad(s, j, [220, 200, 168], "v nití 3546 (béžová)");
      await rob(s, j, [["klik", a_("potvrd", "stred")]]);
      const po5 = await s.t.ev(OTVORENY);
      j.over(po5.otvoreny === null && po5.hotovy5 && !po5.dalej5, "dodávka: Pokračovať v poslednej karte kroku 5 krok nezavrel (súhrn): " + JSON.stringify(po5));
      const pr5 = await cakaj(s, j, PREHLAD, prehladOk);
      j.over(prehladOk(pr5), "dodávka: po poslednom „Pokračovať“ nie je v okne celý prehľad (Váš set v 5 krokoch … Pridať do košíka): " + JSON.stringify(pr5));
      await overPismo(s, j, "dodávka súhrn");
      const pred = await s.t.ev(STAV);
      j.over(pred.krokov === 5, "dodávka má mať 5 krokov (bez tapacíru), je " + pred.krokov);
      const { post, st, cena } = await doKosika(s, a, j, "kamion-dodavka");
      j.over(st.sel[352] === "Nie nechcem tapacír dverí" && st.sel[355] === "Nie nechcem nášivku na dverách", "tapacír v selectoch: " + st.sel[352] + " / " + st.sel[355]);
      j.over(st.spolu === 258, "spolu " + st.spolu + " ≠ 258 €");
      j.over(post && post.body === vzorPost("kamion-dodavka"), "telo POST ≠ post-porovnanie.json revizia_2026_10_18: " + (post ? post.body.slice(0, 160) : "žiadny POST"));
      return { info: "258 € = " + cena.zaklad + " + " + cena.rozpis + " · POST = vzor", post: post ? post.body : null, spolu: cena.spolu };
    },
  },
  "kamion-neuplne": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await rob(s, j, [["klik", a_("kosik")]]);
      await s.t.ev(`(function () { var b = document.querySelector('#lcd1v-lista [data-a="lista"]'); if (b) b.click(); })()`);
      await j.pauza(2500);
      j.over(!s.posty.length, "nič nevybraté, ale odišiel POST do košíka");
      const r = await s.t.ev(`!!document.querySelector('#lcd1v-kamion [data-krok="vozidlo"].is-open.is-error')`);
      j.over(r, "krok 1 nie je otvorený s červeným rámom");
      return { info: "bez POST, krok 1 červený" };
    },
  },
};
