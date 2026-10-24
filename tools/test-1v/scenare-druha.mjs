// Scenáre ponuky druhej vrstvy (jedno 598 / 610 / 613 -> dvoj 601 / 604 / 607) a prenosu výberu (Michal 14. 10. 2026).
// JADRO (vydanie): assets/js/components/konfigurator1v/druha-vrstva.js + prenos.js + assets/css/_lcd1v-druha.scss.
// Tvar a parametre scenára: tools/test-1v/scenare-jedno.mjs. Všetko s ?novy=1 (bez flagu sa scenár preskočí; časť
// „bez flagu“ si scenár druha-nie overí sám na začiatku). Každý POST košíka je zachytený a zrušený (jadro testu).
//
//   druha-nie       bez flagu žiadna karta ani kľúč; s flagom karta skrytá do výberu farby, potom viditeľná BEZ čísla
//                   (postup „Váš set v 6 krokoch“, kroky „N z 6“); „Pokračujte ďalej“ vo Farbe otvorí kartu (nie Rozloženie),
//                   príplatok „+ N €“ = živý rozdiel; dlaždica podľa návrhu A (Michal 19. 10. 2026, „Video A“): nadpis
//                   „Druhá vrstva“, štítok „Na celú sadu autokobercov“, riadky cien ako rohož do kufra (.lcd1v-kb__ucet/__r,
//                   písmo a farby = riadky karty kufra na tej istej stránke): „Odporúčaná cena“, „Ušetríte −“ (zelené),
//                   „Príplatok od + N €“ (výber neúplný), Odporúčaná − Ušetríte = Príplatok, čísla spočítané zo stránky
//                   (rámik: cena a odporúčaná; vzorec webu × 1,6 nahor na desiatky pre cenu + príplatok); 613 bez bežnej
//                   ceny = len riadok Príplatok; žiadna prečiarknutá cena, pilulka, „Vzor, auto aj farba…“ ani veta pod Nie;
//                   dlaždica na telefóne nie je privysoká;
//                   návrh 1b (Michal 24. 10. 2026): nadpis „Prajete si aj druhú odnímateľnú vrstvu?“, namiesto podnadpisu
//                   blok „8 z 10 … s druhou vrstvou“ + „Nie je to koberec na koberci.“ + vrstvy 1 a 2 (tučné časti, pevné
//                   medzery za jednopísmenovými slovami, písmo ≥ 15 px, štítky ≥ 11 px), pás „★ Najčastejšia voľba“;
//                   otvorená karta s cenami sa na telefóne zmestí do okna pod hlavičku webu (snímka celej karty: --snimky);
//                   Áno aj Nie sú skutočné tlačidlá (<button type=button>, fokus klávesnicou),
//                   zelené „Áno, chcem druhú vrstvu“ v dlaždici (div) nad zlatým „Nie, ďakujem“ (Michal 15. 10., farby prehodené 16. 10. 2026);
//                   „Nie, ďakujem“ zbalí kartu („Bez druhej vrstvy“) a otvorí Rozloženie;
//                   POST = baseline jednovrstvového produktu (1v-baseline.json, scenár platne);
//                   video v dlaždici (Michal 16. 10. 2026): pred otvorením karty žiadna požiadavka na druha-video-* (ani poster),
//                   po otvorení hrá č. 1 vapka (WebM, muted, playsinline, bez ovládania, rámik 4:5), č. 2 sa ešte nesťahuje;
//                   koniec č. 1 -> č. 2 príbeh -> koniec -> znova č. 1; po „Nie“ video stojí
//   druha-ano       prefers-reduced-motion: video len poster, bez src, nič sa nestiahne; hlavička karty -> tlačidlo „Áno, chcem druhú vrstvu“ (myš): správa v karte, tlačidlá zablokované, prechod na dvojvrstvový produkt
//                   toho istého vzoru; tam vzor, auto, farba prenesené, otvorený krok „Farba 2. vrstvy“ bez predvoľby, žiadna
//                   veta navyše; príplatok z karty = živý rozdiel cien (dvoj − jedno, Shoptet); odporúčaná v karte = rozdiel
//                   odporúčaných cien z rámikov OBOCH stránok, „Ušetríte“ = odporúčaná − príplatok; úplný výber -> POST = baseline
//                   dvojvrstvového produktu; tlačidlo Späť -> jednovrstvový produkt s autom a farbou, karta nezodpovedaná
//   druha-vsetko    rozloženie 3 rady (7 miest), rohož Classic a 2 boxy vybraté pred „Áno“ (390 px: ťuk na video dlaždice —
//                   dlaždica je klikateľná celá; 1280 px: Enter na tlačidle Áno — klávesnica) -> na dvojvrstvovom všetko
//                   rovnaké (miesta, rozloženie, kufor, farba a veľkosti boxov, okno boxov zatvorené), POST platný; riadky
//                   cien pri úplnom výbere „Príplatok“ (bez „od“) a čísla = rámiky oboch stránok (s rohožou a boxmi)
//   prenos-neplatny (dvoj) kľúč starší ako 10 min / pre iný produkt / s farbou, ktorú produkt nemá -> nič sa neprenesie,
//                   bez chyby; pri chýbajúcej farbe sa otvorí krok Farba
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUKTY } from "./produkty.mjs";
import { F, cislo } from "./stary-ui.mjs";
import { stary as staryKroky } from "./ovladac-kroky.mjs";

const KARTA = `${F} .lcd1v-druha`;
const KLUC = "lcd1vPrenos:v1";
const NBSP = " ";

/** POST starého vzhľadu (CDN, 14. 10. 2026, 1v-baseline.json scenár platne: farba index 2, 1. a 2. rad, Audi A6 2015 Combi). */
export const BASELINE = {
  598: "productId=598&priceId=63493&language=sk&parameterValueId[78]=549&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  610: "productId=610&priceId=59803&language=sk&parameterValueId[78]=673&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  613: "productId=613&priceId=66872&language=sk&parameterValueId[78]=679&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  601: "productId=601&priceId=66989&language=sk&parameterValueId[78]=549&parameterValueId[71]=540&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  604: "productId=604&priceId=67856&language=sk&parameterValueId[78]=673&parameterValueId[71]=540&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  607: "productId=607&priceId=68003&language=sk&parameterValueId[78]=679&parameterValueId[71]=540&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
};
/** jednovrstvový -> dvojvrstvový toho istého vzoru (nezávisle od kódu webu: podľa profilov testu) */
const cielDvoj = (P) => Number(Object.keys(PRODUKTY).find((id) => PRODUKTY[id].typ === "dvoj" && PRODUKTY[id].vzor === P.vzor));
const cesta = (id) => new URL(PRODUKTY[id].url).pathname;
const preskocBez = (a) => (a.novy ? null : { preskoc: "len nový vzhľad (?novy=1)" });

/** POST sa rovná baseline (rádio rozloženia parameter-<id> ide len po skutočnom kliku na rádio — voliteľné). */
function rovnakyAkoBaseline(j, post, id) {
  const ocak = Object.fromEntries(new URLSearchParams(BASELINE[id]));
  const je = post.pole;
  const volitelne = (k) => /^parameter-\d+$/.test(k);
  const rozdiel = [];
  Object.keys(ocak).forEach((k) => { if (volitelne(k) && !(k in je)) return; if (je[k] !== ocak[k]) rozdiel.push(k + ": " + je[k] + " ≠ " + ocak[k]); });
  Object.keys(je).forEach((k) => { if (!(k in ocak)) rozdiel.push(k + " navyše (" + je[k] + ")"); });
  j.over(!rozdiel.length, `POST ${id} sa nerovná baseline starého vzhľadu (1v-baseline.json platne): ${rozdiel.join("; ")}`);
}

/** Stav karty ponuky, ako ju vidí zákazník. */
function stavKarty(t) {
  return t.ev(`(function () {
    var k = document.querySelector(${JSON.stringify(KARTA)});
    if (!k) return { je: false };
    function tx(q) { var e = k.querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
    function vid(e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return !e.hidden && r.width > 0 && r.height > 0 && c.display !== "none" && c.visibility !== "hidden"; }
    var dl = k.querySelector(".lcd1v-druha__dlazdica"), ano = k.querySelector(".lcd1v-druha__ano"), nie = k.querySelector(".lcd1v-druha__nie"), vd = dl && dl.querySelector("video"), ram = dl && dl.querySelector(".lcd1v-druha__ram");
    var suma = k.querySelector(".lcd1v-druha__suma");
    function tl(b) { return b ? { tag: b.tagName, typ: b.type, text: b.textContent.replace(/\\s+/g, " ").trim(), tab: b.tabIndex, pozadie: getComputedStyle(b).backgroundImage } : null; }
    return {
      je: true, vidno: vid(k), otvorena: k.classList.contains("active"), hotova: k.classList.contains("lcd1v-hotovy"),
      ey: tx(".lcd1v-hd .lcd1v-ey"), nm: tx(".lcd1v-hd .lcd1v-nm"), ti: tx(".lcd1v-hd .lcd1v-ti"), vy: tx(".lcd1v-hd .lcd1v-vy"),
      cislo: tx(".lcd1v-hd .lcd1v-no"), cisloVidno: vid(k.querySelector(".lcd1v-hd .lcd1v-no")),
      pod: tx(":scope > .lcd1v-pod"), anoText: dl ? dl.textContent.replace(/\\s+/g, " ").trim() : null, anoVidno: vid(ano),
      anoTl: tl(ano), nieTl: tl(nie), dlTag: dl ? dl.tagName : null, dlTlacidiel: dl ? dl.querySelectorAll("button").length : 0,
      anoVDlazdici: !!(dl && ano && dl.contains(ano)), anoNadNie: !!(ano && nie && ano.getBoundingClientRect().bottom <= nie.getBoundingClientRect().top),
      nieText: nie ? nie.textContent.trim() : null, nieVidno: vid(nie), pozn: tx(":scope > .lcd1v-pozn"),
      priplatok: suma && vid(suma) ? suma.textContent : null, priplatokCislo: ano ? Number(ano.getAttribute("data-lcd1v-priplatok")) || null : null,
      foto: dl ? dl.querySelectorAll("img").length : null,
      video: vd ? (function () { var r = ram.getBoundingClientRect(), c = getComputedStyle(ram);
        return { src: vd.currentSrc || vd.getAttribute("src") || "", srcAttr: vd.getAttribute("src"), poster: vd.getAttribute("poster") || "", muted: vd.muted && vd.hasAttribute("muted"),
          playsinline: vd.playsInline && vd.hasAttribute("playsinline"), controls: vd.controls, autoplay: vd.autoplay, loop: vd.loop, preload: vd.getAttribute("preload"),
          paused: vd.paused, ready: vd.readyState, cas: vd.currentTime, dlzka: vd.duration, aria: vd.getAttribute("aria-label"), vidno: vid(vd),
          pomer: r.height ? Math.round(r.width / r.height * 100) / 100 : 0, sirka: Math.round(r.width), vyska: Math.round(r.height),
          linka: c.borderTopWidth + " " + c.borderTopColor, radius: c.borderTopLeftRadius, vlastnyRam: getComputedStyle(vd).borderTopWidth }; })() : null,
      anoZablok: !!(ano && ano.disabled), nieZablok: !!(nie && nie.disabled),
      prenos: vid(k.querySelector(".lcd1v-druha__prenos")) ? tx(".lcd1v-druha__prenos") : null,
      maName: !!k.querySelector("[name]"),
      dlVyska: dl ? Math.round(dl.getBoundingClientRect().height) : 0,
      // riadky cien (Michal 19. 10. 2026, návrh A): .lcd1v-kb__ucet > .lcd1v-kb__r (.lcd1v-kb__rn + .lcd1v-kb__rh) ako karty
      // rohože do kufra; vzhľad každého riadku sa porovná s rovnakým riadkom karty kufra na tej istej stránke
      cb: (function () {
        var b = dl && dl.querySelector(".lcd1v-kb__tx > .lcd1v-kb__ucet");
        if (!b || !vid(b)) return null;
        function t2(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
        function styl(e) { if (!e) return null; var c = getComputedStyle(e); return c.fontSize + " " + c.fontWeight + " " + c.color + " " + c.textTransform; }
        var kuf = document.querySelector("${F} .lcd1v-kb[data-lcd1v-kb] .lcd1v-kb__karta .lcd1v-kb__ucet");
        function vzor(r) {
          if (!kuf) return null;
          var q = r.classList.contains("lcd1v-kb__r--sum") ? ".lcd1v-kb__r--sum" : r.classList.contains("lcd1v-kb__r--zl") ? ".lcd1v-kb__r--zl" : ".lcd1v-kb__r--samo";
          var x = kuf.querySelector(q);
          return x ? { n: styl(x.querySelector(".lcd1v-kb__rn")), h: styl(x.querySelector(".lcd1v-kb__rh")) } : null;
        }
        var stl = b.parentNode, tl = dl.querySelector(".lcd1v-kb__po");
        var riadky = Array.prototype.filter.call(b.children, vid).map(function (r) {
          var n = r.querySelector(":scope > .lcd1v-kb__rn"), h = r.querySelector(":scope > .lcd1v-kb__rh");
          var rn = n.getBoundingClientRect(), rh = h.getBoundingClientRect();
          return { n: t2(n), h: t2(h), trieda: r.className, zl: r.classList.contains("lcd1v-kb__r--zl"), sum: r.classList.contains("lcd1v-kb__r--sum"),
            jedenRiadok: Math.abs(rn.top - rh.top) < 6 || Math.abs(rn.bottom - rh.bottom) < 6, prekryv: rn.right > rh.left + 0.5,
            styl: { n: styl(n), h: styl(h) }, vzor: vzor(r), farbaH: getComputedStyle(h).color, mimo: rh.right > stl.getBoundingClientRect().right + 0.5 };
        });
        return { riadky: riadky, nm: t2(dl.querySelector(".lcd1v-kb__tx > .lcd1v-kb__nm")), stitok: t2(tl), stitokStyl: tl ? styl(tl) : null,
          kufor: !!kuf, pretek: stl.scrollWidth > stl.clientWidth + 1 || b.scrollWidth > b.clientWidth + 1,
          stare: dl.querySelectorAll("s, .lcd1v-druha__cb, .lcd1v-kb__ben").length,
          attrOdp: ano && ano.getAttribute("data-lcd1v-odporucana") ? Number(ano.getAttribute("data-lcd1v-odporucana")) : null };
      })(),
      zaFarbou: !!(k.previousElementSibling && k.previousElementSibling.classList.contains("lcd1v-k-farba")),
      // blok pod hlavičkou (Michal 24. 10. 2026, návrh 1b): zlatý box „8 z 10“, „Nie je to koberec na koberci.“, dve vrstvy;
      // surovy = textContent bez úprav (pevné medzery \\u00a0 ostanú — kontrola jednopísmenových predložiek na konci riadka)
      info: (function () {
        var b = k.querySelector(":scope > .lcd1v-druha__info");
        if (!b) return null;
        function t2(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
        function tucne(e) { return e ? Array.prototype.map.call(e.querySelectorAll("b"), t2) : []; }
        function px(e) { return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }
        var pt = b.querySelector(".lcd1v-druha__pocet-t"), nd = b.querySelector(".lcd1v-druha__vrstvy-nd"), poc = b.querySelector(".lcd1v-druha__pocet");
        var li = Array.prototype.slice.call(b.querySelectorAll(".lcd1v-druha__vrstvy > .lcd1v-druha__vrstva"));
        return {
          vidno: vid(b), cislo: t2(b.querySelector(".lcd1v-druha__pocet-c")), text: t2(pt), textB: tucne(pt), nadpis: t2(nd), nadpisB: tucne(nd),
          riadky: li.map(function (x) { return { c: t2(x.querySelector(".lcd1v-druha__vrstva-c")), t: t2(x.querySelector(".lcd1v-druha__vrstva-t")), b: tucne(x) }; }),
          surovy: b.textContent, pozadie: poc ? getComputedStyle(poc).backgroundColor : "",
          pismo: Math.min(px(pt), px(nd), li.length ? Math.min.apply(null, li.map(px)) : 0),
          nadHlavickou: !!(b.previousElementSibling && b.previousElementSibling.classList.contains("lcd1v-hd")),
          predDlazdicou: !!(dl && (b.compareDocumentPosition(dl) & 4)),
        };
      })(),
      // drobné štítky (pás nad dlaždicou, „Na celú sadu…“, „Príplatok od“) — Michal: malé texty sa nečítajú
      stitkyPx: Array.prototype.map.call(k.querySelectorAll(".lcd1v-kb__top, .lcd1v-kb__po, .lcd1v-kb__r--sum .lcd1v-kb__rn"), function (e) { return parseFloat(getComputedStyle(e).fontSize); }),
      surovyTi: (k.querySelector(".lcd1v-hd .lcd1v-ti") || {}).textContent || "", surovyDl: dl ? dl.textContent : "",
      vyskaKarty: Math.round(k.getBoundingClientRect().height),
    };
  })()`);
}

/** Jednopísmenová predložka/spojka (s, z, v, a, k, o, u, i) s obyčajnou medzerou za sebou = môže ostať na konci riadka. */
const RE_SIROTA = /(^|[\s(„])[szvakouiSZVAKOUI] /;
/**
 * Strop výšky otvorenej karty na telefóne (návrh 1b, Michal 24. 10. 2026: „na jednom mieste“). Predloha N1b = karta 643 px
 * pri 390 px s menšou hlavičkou (bez eyebrow a zlatej linky); hlavička ako pri ostatných krokoch (eyebrow, linka, 20 px pod
 * ňou) pridá ~75 px -> 718 px (598/610; 613 bez riadkov Odporúčaná/Ušetríte ~716 px). iPhone 390 × 844 v Safari ukáže
 * ~750 px so zbalenou lištou (odhad). 720 = súčasná výška + malá rezerva: stráži, aby karta nenarástla (nový riadok textu
 * ≥ 19 px, väčšie video). Do okna Safari s rozbalenou lištou (~664 px, odhad) sa karta s touto hlavičkou nezmestí.
 */
const KARTA_TELEFON_MAX = 720;
/** Výška lepivej hlavičky webu nad kartou (rovnaké selektory ako posun.js) — na telefóne zakrýva hornú časť okna. */
const vyskaHlavickyWebu = (t) => t.ev(`(function () {
  var s = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (var i = 0; i < s.length; i++) { var e = document.querySelector(s[i]); if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight; }
  return 0; })()`);

/**
 * Snímka CELEJ otvorenej karty (len s --snimky; návrh 1b, 24. 10. 2026): karta pod hlavičkou webu, výrez podľa jej obdĺžnika
 * (+ 12 px okolo) -> <produkt>-<meno>-<šírka>.png.
 */
async function snimkaKarty(s, a, meno) {
  if (!a.snimky) return;
  const r = await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify(KARTA)}); if (!e) return null;
    e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90);
    var b = e.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height, sirka: document.documentElement.clientWidth }; })()`);
  if (!r) return;
  // plávajúce prvky webu (bublina a tlačidlo chatu, lepivá lišta) by kartu na snímke prekryli -> na chvíľu skryť
  await s.t.ev(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)});
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (e) {
      if (e.contains(k) || k.contains(e) || !/fixed|sticky/.test(getComputedStyle(e).position)) return;
      e.setAttribute("data-lcd1v-snimka-skryte", e.style.visibility || ""); e.style.visibility = "hidden"; }); })()`);
  await s.t.pauza(600);
  const x = Math.max(0, Math.floor(r.x - 12)), y = Math.max(0, Math.floor(r.y - 12));
  const clip = { x, y, width: Math.min(r.sirka - x, Math.ceil(r.w + 24)), height: Math.ceil(r.h + 24), scale: 1 };
  const p = await s.k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip }).catch(() => null);
  await s.t.ev(`Array.prototype.forEach.call(document.querySelectorAll("[data-lcd1v-snimka-skryte]"), function (e) {
    e.style.visibility = e.getAttribute("data-lcd1v-snimka-skryte"); e.removeAttribute("data-lcd1v-snimka-skryte"); })`);
  if (p && p.data) writeFileSync(join(a.snimky, `${a.produkt.id}-${meno}-${s.t.sirka}.png`), Buffer.from(p.data, "base64"));
}

/** Text viditeľných kariet (eyebrow) a postupu — počty krokov sa ponukou nemenia. */
function cislaKrokov(t) {
  return t.ev(`(function () {
    function tx(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; }
    return { postup: tx(document.querySelector(".lcd1v-postup-t")), st: tx(document.querySelector(".lcd1v-postup-st")),
      ey: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-krok:not(.lcd1v-druha) > .lcd1v-hd .lcd1v-ey"), tx),
      dlazdice: document.querySelectorAll(".lcd1v-postup-dl > i").length };
  })()`);
}

/** Snímka pre ľudskú kontrolu (len s --snimky): prvok `sel` zarovnaný nahor pod hlavičku webu. */
async function snimka(s, a, meno, sel) {
  if (!a.snimky) return;
  await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`);
  await s.t.pauza(500);
  await s.k.snimka(join(a.snimky, `${a.produkt.id}-${meno}-${s.t.sirka}.png`)).catch(() => {});
}

const ctxCena = (t) => t.ev(`window.__lcd1v ? window.__lcd1v.cena().spolu : null`);

// ------------------------------------------------------------------ video v dlaždici (Michal 16. 10. 2026: č. 5 vapka + č. 1 príbeh)
const VIDEO = `${KARTA} .lcd1v-druha__video`;
const RE_V1 = /druha-video-vapka\.(webm|mp4)$/, RE_V2 = /druha-video-pribeh\.(webm|mp4)$/;
/** Sieť meria harness (s.obrazky1v = požiadavky na …/assets/img/1v/, lokálny build) — inak sa jeho zoznam nekontroluje. */
const meriaSiet = (s) => Array.isArray(s.obrazky1v) && !!(s.build && s.build.tmp);
/** Čo sa zo súborov videa druhej vrstvy stiahlo: harness (img/1v) + Resource Timing stránky (…/img/1v/druha-video-*).
 * Iné videá stránky (starý popis Shoptetu …/upload/assets/videos/PC.MP4, mobil.mp4 — sú v HTML stránky aj bez flagu) sem nepatria. */
async function sietVidea(s) {
  const zHarnessu = (s.obrazky1v || []).map((x) => x.subor).filter((x) => /^druha-video-/.test(x));
  const zoStranky = await s.t.ev(`performance.getEntriesByType("resource").map(function (e) { return e.name; })
    .filter(function (u) { return /\\/img\\/1v\\/druha-video-/.test(u); }).map(function (u) { return u.split("?")[0].split("/").pop(); })`).catch(() => []);
  const vsetko = zHarnessu.concat(zoStranky || []);
  return { vsetko, videa: vsetko.filter((x) => /\.(mp4|webm)$/i.test(x)), v1: vsetko.filter((x) => RE_V1.test(x)), v2: vsetko.filter((x) => RE_V2.test(x)) };
}
/** Čaká, kým video karty hrá súbor `re` (src nastavené, readyState ≥ 2, čas beží) -> stav videa zo stavKarty. */
async function cakajVideo(t, re, popis) {
  await t.cakaj(`(function () { var v = document.querySelector(${JSON.stringify(VIDEO)});
    return !!(v && ${re}.test(v.currentSrc || v.getAttribute("src") || "") && !v.paused && v.readyState >= 2 && v.currentTime > 0.2); })()`, { ms: 20000, popis });
  return (await stavKarty(t)).video;
}
/** Skok na koniec práve hrajúceho videa (posledných 0,4 s dobehne samo -> skutočná udalosť „ended“). */
const naKoniec = (t) => t.ev(`(function () { var v = document.querySelector(${JSON.stringify(VIDEO)}); v.currentTime = Math.max(0, v.duration - 0.4); return v.duration; })()`);
const kluc = (t) => t.ev(`(function () { try { return JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC)}) || "null"); } catch (e) { return "chyba"; } })()`);

/** Polia formulára pre overPost na inej stránke tej istej karty (rovnaké ako j.otvor; dvoj nemá nepovinné selecty). */
async function nastavFormKluce(s) {
  s.formKluce = await s.t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    var k = ["productId", "priceId", "language", "amount"], volitelne = [];
    Array.prototype.forEach.call(f.querySelectorAll("select[name]"), function (s) { k.push(s.name); });
    Array.prototype.forEach.call(f.querySelectorAll(".content-wrap input[type=radio][name^='parameter-']"), function (r) { if (volitelne.indexOf(r.name) < 0) volitelne.push(r.name); });
    return { povinne: k.sort(), volitelne: volitelne, priceIdZaklad: (f.querySelector("input[name=priceId]") || {}).value || "" };
  })()`);
}

/** Auto + farba (index 2 = farba baseline) -> { model, farba }; karta je pred farbou skrytá. */
async function autoAFarba(s, ovl, j) {
  const t = s.t;
  const pred = await stavKarty(t);
  j.over(pred.je && !pred.vidno, `karta druhej vrstvy má byť pred výberom farby skrytá: ${JSON.stringify(pred)}`);
  const model = await ovl.kroky.vyberAuto(t, j.AUTO);
  const poAute = await stavKarty(t);
  j.over(!poAute.vidno, "karta druhej vrstvy je viditeľná po výbere auta, ešte pred farbou");
  const farba = await ovl.kroky.vyberFarbu(t, { index: 2 });
  await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); return !!(k && !k.hidden && k.offsetHeight > 30); })()`, { ms: 10000, popis: "karta druhej vrstvy po výbere farby" });
  return { model, farba };
}

/** Čaká na príplatok „+ N €“ v karte -> N (číslo). */
async function cakajPriplatok(t, j) {
  await t.cakaj(`(function () { var a = document.querySelector("${KARTA} .lcd1v-druha__ano"); var s = document.querySelector("${KARTA} .lcd1v-druha__suma");
    return !!(a && a.getAttribute("data-lcd1v-priplatok") && s && s.getBoundingClientRect().height > 0); })()`, { ms: 30000, popis: "príplatok „+ N €“ na dlaždici Áno (stránka dvojvrstvového produktu)" });
  const st = await stavKarty(t);
  const n = st.priplatokCislo;
  j.over(n > 0 && st.priplatok === "+" + NBSP + String(n).replace(".", ",") + NBSP + "€", `príplatok v karte „${st.priplatok}“ (atribút ${n}) — tvar „+ N €“`);
  return n;
}

/**
 * Odporúčaná cena v rámiku nad krokmi, ako ju vidí zákazník (číslo; null = rámik ju neukazuje — produkt bez bežnej ceny
 * v admine, 613). Rámik sa po zmene ceny prepisuje s oneskorením (productPage.js setTimeout) -> čaká, kým sa ustáli.
 */
async function odporucanaRamika(t, ovl) {
  let r = null;
  const koniec = Date.now() + 8000;
  for (;;) {
    r = await ovl.cena.odporucana(t);
    const ma = await t.ev(`window.__lcd1v ? window.__lcd1v.cena().odporucana : null`);
    if ((r ? r.cena : 0) === (ma || 0) || Date.now() > koniec) break;
    await t.pauza(250);
  }
  return r && r.cena > 0 ? r.cena : null;
}

/** Suma ako ju píše web (ctx.formatCena, medzery normalizované): 210 -> „210 €“, 132.5 -> „132,50 €“. */
const eur = (x) => {
  const r = Math.round(Math.abs(x) * 100) / 100;
  return (Math.abs(r - Math.round(r)) < 0.005 ? String(Math.round(r)) : r.toFixed(2).replace(".", ",")).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
};

/**
 * Riadky cien v dlaždici (Michal 19. 10. 2026, návrh A — štýl rohože do kufra) proti číslam zo stránky: n = príplatok
 * (overený cakajPriplatok), odpTu = odporúčaná v rámiku tejto stránky, odpTam = odporúčaná dvojvrstvového pri tých istých
 * voľbách (rámik jeho stránky alebo vzorec webu pre cenu + n); obe známe -> „Odporúčaná cena odpTam − odpTu“,
 * „Ušetríte − (odporúčaná − n)“ (zelené), „Príplatok (od) + n“ a Odporúčaná − Ušetríte = Príplatok; inak (613 bez bežnej
 * ceny) len riadok Príplatok. Každý riadok na jednom riadku a s rovnakým písmom/farbou ako ten istý riadok karty kufra.
 */
function overCenovku(j, cb, { n, odpTu, odpTam, uplny, kde }) {
  j.over(!!cb, `${kde}: riadky cien v dlaždici nie sú viditeľné`);
  if (!cb) return null;
  const R = cb.riadky || [];
  j.over(cb.nm === "Druhá vrstva", `${kde}: nadpis dlaždice „${cb.nm}“, má byť „Druhá vrstva“`);
  j.over(cb.stitok === "Na celú sadu autokobercov" && /uppercase/.test(cb.stitokStyl || ""), `${kde}: štítok „${cb.stitok}“ (${cb.stitokStyl}) — má byť zlatý štítok veľkými „Na celú sadu autokobercov“ (Michal: príplatok je za celú sadu, nie za 1 kus)`);
  j.over(!cb.stare, `${kde}: v dlaždici ostala stará cenovka (prečiarknutá cena, pilulka alebo veta): ${cb.stare}`);
  j.over(!cb.pretek && R.every((r) => !r.mimo), `${kde}: riadky cien pretŕčajú zo stĺpca dlaždice`);
  R.forEach((r) => j.over(r.jedenRiadok && !r.prekryv, `${kde}: riadok „${r.n} | ${r.h}“ je zalomený alebo sa prekrýva`));
  // jeden štýl s rohožou do kufra: písmo a farba riadkov = ten istý riadok karty kufra na tej istej stránke
  j.over(cb.kufor, `${kde}: karta rohože do kufra na stránke nie je (porovnanie štýlu riadkov)`);
  R.forEach((r) => j.over(!r.vzor || (r.styl.n === r.vzor.n && r.styl.h === r.vzor.h), `${kde}: riadok „${r.n}“ má iný vzhľad ako rohož do kufra: ${JSON.stringify(r.styl)} ≠ ${JSON.stringify(r.vzor)}`));
  const sum = R[R.length - 1];
  const nazovSum = uplny ? "Príplatok" : "Príplatok od";
  j.over(sum && sum.sum && sum.n.toLowerCase() === nazovSum.toLowerCase(), `${kde}: posledný riadok „${sum && sum.n}“ (${sum && sum.trieda}), má byť --sum „${nazovSum}“ (${uplny ? "úplný" : "neúplný"} výber)`);
  j.over(sum && sum.h === "+ " + eur(n), `${kde}: príplatok „${sum && sum.h}“ ≠ + ${eur(n)}`);
  const zakazane = /na milimeter|vyr[áa]bame|zadarmo|comfort|dragon|elite|basic|z[áa]ruk|vrstiev|fixa[čc]n|s dph/i;
  j.over(!zakazane.test(R.map((r) => r.n + " " + r.h).join(" ") + " " + cb.stitok), `${kde}: zakázané slovo v riadkoch cien`);
  if (odpTu > 0 && odpTam > 0) {
    const odp = odpTam - odpTu, usp = Math.round((odp - n) * 100) / 100;
    j.over(R.length === 3, `${kde}: riadkov cien ${R.length} (${R.map((r) => r.n).join(" / ")}), majú byť 3: Odporúčaná cena / Ušetríte / ${nazovSum}`);
    const [o, u] = R;
    j.over(o && o.n === "Odporúčaná cena" && !o.zl && !o.sum && o.h === eur(odp) && cb.attrOdp === odp,
      `${kde}: „${o && o.n} | ${o && o.h}“ (atribút ${cb.attrOdp}) ≠ Odporúčaná cena ${odpTam} − ${odpTu} = ${eur(odp)} (rámiky stránok)`);
    j.over(u && u.n === "Ušetríte" && u.zl && u.h === "− " + eur(usp), `${kde}: „${u && u.n} | ${u && u.h}“ (${u && u.trieda}) ≠ Ušetríte − ${eur(usp)} (--zl)`);
    const zelena = /rgb\((\d+), (\d+), (\d+)\)/.exec((u && u.farbaH) || "");
    j.over(zelena && +zelena[2] > +zelena[1] + 40 && +zelena[2] > +zelena[3], `${kde}: Ušetríte nie je zelené: ${u && u.farbaH}`);
    const num = (x) => Number(String(x || "").replace(/[^\d,]/g, "").replace(",", "."));
    j.over(o && u && Math.round((num(o.h) - num(u.h)) * 100) / 100 === n, `${kde}: Odporúčaná ${o && o.h} − Ušetríte ${u && u.h} ≠ Príplatok ${eur(n)}`);
    return { odp, usp };
  }
  j.over(R.length === 1 && cb.attrOdp == null, `${kde}: odporúčaná cena nie je na oboch stránkach (tu ${odpTu}, dvojvrstvový ${odpTam}) — karta smie ukázať len riadok Príplatok: ${JSON.stringify(R.map((r) => r.n + " | " + r.h))}`);
  return { odp: null, usp: null };
}

/** Na dvojvrstvovom po prenose: prijatý kľúč, otvorený krok Farba 2. vrstvy, nič predvolené. */
async function poPrenose(s, j, { P, cielId, farba }) {
  const t = s.t;
  await t.cakaj(`location.pathname === ${JSON.stringify(cesta(cielId))}`, { ms: 40000, popis: "prechod na dvojvrstvový produkt " + cielId });
  t.zabudni();
  await t.cakaj(j.TYPY_TEST.dvoj.pripravene, { ms: 40000, popis: "postavený konfigurátor " + cielId });
  await t.cakaj(`document.body.classList.contains("lcd-1v") && document.body.getAttribute("data-lcd1v-typ") === "dvoj" && !!window.__lcd1v`, { ms: 30000, popis: "nový vzhľad na " + cielId });
  const idF2 = await t.idParametra("farba2");
  await t.cakaj(`(function () { var k = document.querySelector("${F} .content-wrap > .parameter-wrap.parameter-${idF2}"); return !!(k && k.classList.contains("active") && k.classList.contains("lcd1v-k-farba2")); })()`, { ms: 20000, popis: "otvorený krok „Farba 2. vrstvy“ po prenose" });
  // krok má byť po ustálení stránky na obrazovke (prenos.js dorovnáva do 2 s; z CDN sa karta farby zbalí neskôr)
  await t.cakaj(`(function () { var k = document.querySelector(".lcd1v-k-farba2"); var r = k && k.getBoundingClientRect(); return !!r && r.top >= -2 && r.top < innerHeight - 80; })()`, { ms: 3500, popis: "otvorený krok „Farba 2. vrstvy“ na obrazovke" }).catch(() => {});
  await j.pauza(2300); // po poslednom dorovnaní (2 s) sa už nesmie pohnúť
  const idF = await t.idParametra("farba");
  const st = await t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    function tx(q) { var e = f.querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; }
    var f2 = f.querySelector(".lcd1v-k-farba2"), r = f2.getBoundingClientRect();
    return {
      vzor: document.body.getAttribute("data-lcd1v-vzor"), model: sessionStorage.getItem("model"), autoVy: tx(".lcd1v-k-auto > .lcd1v-hd .lcd1v-vy"),
      farbaTl: (f.querySelector('.content-wrap .option-button.active[data-variant="${idF}"]') || { getAttribute: function () { return ""; } }).getAttribute("data-value"),
      farbaSel: (f.querySelector('select[data-parameter-id="${idF}"]') || {}).value || "",
      f2Aktivne: f2.querySelectorAll(".option-button.active").length, f2Sel: (f.querySelector('select[data-parameter-id="${idF2}"]') || {}).value || "",
      otvorene: Array.prototype.map.call(f.querySelectorAll(".lcd1v-krok.active"), function (e) { return e.className.replace(/.*lcd1v-k-(\\w+).*/, "$1"); }),
      vOkne: r.top >= -2 && r.top < innerHeight - 80,
      veta: /preniesli|prenesen/i.test(f.innerText || ""), karta: !!f.querySelector(".lcd1v-druha"),
      chyby: window.__lcd1v.chyby.slice(), ey: tx(".lcd1v-k-farba2 > .lcd1v-hd .lcd1v-ey"),
      kluc: (function () { try { return JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC)}) || "null"); } catch (e) { return null; } })(),
    };
  })()`);
  j.over(st.vzor === P.vzor, `vzor na ${cielId}: ${st.vzor}, má ${P.vzor}`);
  j.over(st.model === [j.AUTO.znacka, j.AUTO.model, j.AUTO.rok, j.AUTO.typ].join(" ") && st.autoVy === "Audi A6, 2015, Combi", `auto sa nepreniesla: model „${st.model}“, krok 2 „${st.autoVy}“`);
  j.over(st.farbaTl === farba && st.farbaSel === farba, `farba 1. vrstvy na ${cielId}: tlačidlo ${st.farbaTl}, select ${st.farbaSel}, má ${farba}`);
  j.over(st.f2Aktivne === 0 && st.f2Sel === "", `farba 2. vrstvy je predvolená (aktívnych ${st.f2Aktivne}, select „${st.f2Sel}“) — nič sa nemá predvoliť`);
  j.over(st.otvorene.length === 1 && st.otvorene[0] === "farba2", `otvorené karty na ${cielId}: ${st.otvorene.join(", ")} (má byť len farba2)`);
  j.over(/^Krok 4 z 7$/.test(st.ey), `krok Farba 2. vrstvy: „${st.ey}“`);
  j.over(st.vOkne, "otvorený krok „Farba 2. vrstvy“ nie je na obrazovke");
  j.over(!st.veta, "na dvojvrstvovom je veta o prenose — Michal: len otvorený krok, žiadna veta navyše");
  j.over(!st.karta, "karta ponuky druhej vrstvy je aj na dvojvrstvovom produkte");
  j.over(!st.chyby.length, `chyby 1V na ${cielId}: ${st.chyby.join("; ")}`);
  j.over(st.kluc && st.kluc.na === cielId && st.kluc.prijate > 0, `kľúč prenosu po príchode: ${JSON.stringify(st.kluc)}`);
  return st;
}

export const SCENARE = {
  "druha-nie": {
    typy: ["jedno"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      // 1) bez flagu: starý vzhľad, žiadna karta ani kľúč (aj po výbere auta a farby)
      await j.otvor(s, a.url, { novy: false });
      await staryKroky.vyberAuto(t, j.AUTO);
      await staryKroky.vyberFarbu(t, { index: 2 });
      await j.pauza(800);
      const bez = await t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), karta: !!document.querySelector(".lcd1v-druha"), ctx: !!window.__lcd1v, kluc: sessionStorage.getItem(${JSON.stringify(KLUC)}) })`);
      j.over(!bez.trieda && !bez.karta && !bez.ctx && bez.kluc === null, `bez flagu sa niečo zmenilo: ${JSON.stringify(bez)}`);
      // 2) s flagom
      await j.otvor(s, a.url, { novy: true });
      const pred = await cislaKrokov(t);
      const { farba } = await autoAFarba(s, ovl, j);
      const st = await stavKarty(t);
      j.over(st.zaFarbou && !st.otvorena && !st.maName, `karta: za krokom Farba ${st.zaFarbou}, otvorená ${st.otvorena}, prvok s name ${st.maName}`);
      j.over(!st.cisloVidno && !st.cislo, `karta má číslo kroku „${st.cislo}“ (Michal: skrytý krok bez čísla)`);
      j.over(st.nm === "Druhá vrstva" && st.vy === "Áno alebo nie", `zbalená karta: „${st.nm}“ / „${st.vy}“`);
      const po = await cislaKrokov(t);
      j.over(/6 krokoch/.test(po.postup) && po.dlazdice === 6 && /z 6$/.test(po.st) && JSON.stringify(po.ey) === JSON.stringify(pred.ey), `počty krokov sa zmenili: pred ${JSON.stringify(pred)}, po ${JSON.stringify(po)}`);
      j.over(po.ey.every((x) => /^Krok \d z 6$/.test(x)), `kroky: ${po.ey.join(" | ")}`);
      // video: kým karta nie je otvorená, nič sa nesťahuje (ani poster); <video> bez src, preload none
      j.over(st.video && !st.video.srcAttr && !st.video.poster && st.video.preload === "none" && st.video.paused, `video pred otvorením karty: ${JSON.stringify(st.video)} (bez src a posteru, preload none)`);
      const sietPred = await sietVidea(s);
      j.over(!sietPred.vsetko.length, `pred otvorením karty sa stiahlo: ${sietPred.vsetko.join(", ")} (video aj poster majú prísť až s kartou)`);
      // 3) „Pokračujte ďalej“ vo Farbe otvorí kartu (nie Rozloženie)
      const idR = await t.idParametra("rozlozenie");
      await t.klikni(`${F} .lcd1v-k-farba > .next-step-button`, { popis: "Pokračujte ďalej (Farba)" });
      await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); return !!(k && k.classList.contains("active") && k.getBoundingClientRect().height > 200); })()`, { popis: "otvorená karta druhej vrstvy po „Pokračujte ďalej“" });
      await j.pauza(500);
      const otv = await stavKarty(t);
      const rozlOtv = await t.ev(`document.querySelector("${F} .content-wrap > .parameter-wrap.parameter-${idR}").classList.contains("active")`);
      j.over(!rozlOtv, "po „Pokračujte ďalej“ vo Farbe sa otvorilo Rozloženie, má sa otvoriť karta druhej vrstvy");
      // Michal 24. 10. 2026 (návrh 1b): nadpis „Prajete si aj druhú odnímateľnú vrstvu?“ (hlavička ako ostatné kroky)
      j.over(otv.ey === "Druhá vrstva" && otv.ti === "Prajete si aj druhú odnímateľnú vrstvu?", `otvorená karta: „${otv.ey}“ / „${otv.ti}“`);
      // návrh 1b: podnadpis („Vodu, sneh, blato aj soľ…“) nahradil blok pod hlavičkou — zlatý box „8 z 10“, tučné „Nie je to
      // koberec na koberci.“ a dve číslované vrstvy (vrstvy vždy pomenované „prvá prešívaná“ / „druhá“, Michal 15. 10. 2026)
      j.over(otv.pod === null, `starý podnadpis ostal: „${otv.pod}“`);
      const inf = otv.info || {};
      j.over(inf.vidno && inf.nadHlavickou && inf.predDlazdicou, `blok „8 z 10“: viditeľný ${inf.vidno}, hneď pod hlavičkou ${inf.nadHlavickou}, nad dlaždicou ${inf.predDlazdicou}`);
      j.over(inf.cislo === "8 z 10" && inf.text === "zákazníkov si za posledný rok vybralo autokoberce s druhou vrstvou" && JSON.stringify(inf.textB) === JSON.stringify(["s druhou vrstvou"]),
        `zlatý box: „${inf.cislo}“ | „${inf.text}“ tučné ${JSON.stringify(inf.textB)}`);
      j.over(/247, 241, 223/.test(inf.pozadie || ""), `zlatý box nemá krémové pozadie: ${inf.pozadie}`);
      j.over(inf.nadpis === "Nie je to koberec na koberci." && JSON.stringify(inf.nadpisB) === JSON.stringify(["Nie je to koberec na koberci."]), `veta „${inf.nadpis}“ (tučné ${JSON.stringify(inf.nadpisB)})`);
      const VRSTVY = [
        { c: "1", b: "Prvá prešívaná vrstva", t: "Prvá prešívaná vrstva – luxusný vzhľad a vodotesná ochrana celej podlahy." },
        { c: "2", b: "Druhá vrstva", t: "Druhá vrstva – zachytí sneh, vodu aj blato, preto môžete autokoberce používať celý rok. Vyberiete ju a opláchnete." },
      ];
      j.over((inf.riadky || []).length === 2 && VRSTVY.every((v, i) => { const r = inf.riadky[i]; return r.c === v.c && r.t === v.t && JSON.stringify(r.b) === JSON.stringify([v.b]); }),
        `vrstvy v karte: ${JSON.stringify(inf.riadky)}`);
      // jednopísmenová predložka/spojka nesmie ostať na konci riadka (pevná medzera za ňou)
      [["blok", inf.surovy], ["nadpis", otv.surovyTi], ["dlaždica", otv.surovyDl]].forEach(([kde, x]) => j.over(!RE_SIROTA.test(x || ""), `${kde}: jednopísmenové slovo s obyčajnou medzerou za sebou: „${(RE_SIROTA.exec(x || "") || [""])[0]}“`));
      // písmo nie pod mierku (Michal 18. 10. 2026): text bloku ≥ 15 px, štítky ≥ 11 px
      j.over(inf.pismo >= 15, `písmo bloku „8 z 10“ ${inf.pismo} px (najmenej 15)`);
      j.over(otv.stitkyPx.length >= 3 && otv.stitkyPx.every((x) => x >= 11), `štítky karty: ${otv.stitkyPx.join(", ")} px (najmenej 11)`);
      // Michal 19. 10. 2026 (návrh A, „Video A“) + 24. 10. 2026 (návrh 1b): pás „★ Najčastejšia voľba“, nadpis „Druhá vrstva“,
      // štítok „Na celú sadu autokobercov“, riadky cien ako rohož do kufra; preč „Vzor, auto aj farba Vám ostanú.“, „Prvá
      // prešívaná + druhá vrstva“, „S autokobercami od“, prečiarknutá cena, pilulka „Ušetríte“ aj veta pod „Nie“
      j.over(/^★ Najčastejšia voľba\s*Druhá vrstva\s*Na celú sadu autokobercov/.test(otv.anoText) && /Áno, chcem druhú vrstvu$/.test(otv.anoText), `dlaždica Áno: „${otv.anoText}“`);
      j.over(!/Vzor, auto aj farba|Prvá prešívaná \+ druhá vrstva|Dvojvrstvové autokoberce|S autokobercami|celú sadu druhej vrstvy/.test(otv.anoText), `v dlaždici ostal starý text: „${otv.anoText}“`);
      j.over(otv.nieText === "Nie, ďakujem" && otv.nieVidno && otv.pozn === null, `Nie: „${otv.nieText}“, veta pod ním „${otv.pozn}“ (má byť bez vety)`);
      // Michal 15. 10. 2026 („ani neviem, že na to môžem kliknúť“): skutočné tlačidlá Áno (zelené od 16. 10., v dlaždici, hore) a Nie (zlaté)
      j.over(otv.anoVidno && otv.anoTl && otv.anoTl.tag === "BUTTON" && otv.anoTl.typ === "button" && otv.anoTl.text === "Áno, chcem druhú vrstvu" && otv.anoTl.tab >= 0 && otv.anoVDlazdici,
        `tlačidlo Áno: ${JSON.stringify(otv.anoTl)}, viditeľné ${otv.anoVidno}, v dlaždici ${otv.anoVDlazdici}`);
      j.over(otv.nieTl && otv.nieTl.tag === "BUTTON" && otv.nieTl.typ === "button" && otv.nieTl.tab >= 0, `tlačidlo Nie: ${JSON.stringify(otv.nieTl)}`);
      j.over(otv.dlTag === "DIV" && otv.dlTlacidiel === 1, `dlaždica má byť div s jedným tlačidlom (žiadne tlačidlo v tlačidle): ${otv.dlTag}, tlačidiel ${otv.dlTlacidiel}`);
      j.over(otv.anoNadNie, "tlačidlo Áno má byť nad tlačidlom Nie");
      j.over(/47, 156, 104|29, 107, 74/.test(otv.anoTl.pozadie) && /196, 155, 49|177, 136, 34|226, 190, 92/.test(otv.nieTl.pozadie), `farby: Áno zelené (${otv.anoTl.pozadie}), Nie zlaté (${otv.nieTl.pozadie})`);
      // klávesnica: obe tlačidlá dostanú fokus (Enter na Áno overí druha-vsetko pri 1280 px)
      const fokus = await t.ev(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}), r = {};
        ["ano", "nie"].forEach(function (m) { var b = k.querySelector(".lcd1v-druha__" + m); b.focus({ preventScroll: true }); r[m] = document.activeElement === b; b.blur(); });
        return r; })()`);
      j.over(fokus.ano && fokus.nie, `fokus klávesnicou: Áno ${fokus.ano}, Nie ${fokus.nie}`);
      // video namiesto fotky (Michal 16. 10. 2026): po zobrazení karty hrá č. 1 (vapka), bez zvuku, v stránke, bez ovládania;
      // rámik 4:5 ako nové fotky produktu (1 px rgba(196,155,49,.6), zaoblenie 14 px); druhé video sa ešte nesťahuje
      j.over(otv.foto === 0, `v dlaždici ostala fotka (<img>: ${otv.foto})`);
      const v1 = await cakajVideo(t, RE_V1, "video č. 1 (vapka) hrá po otvorení karty");
      j.over(v1.muted && v1.playsinline && !v1.controls && !v1.loop && v1.preload === "none", `video: muted ${v1.muted}, playsinline ${v1.playsinline}, controls ${v1.controls}, loop ${v1.loop}, preload ${v1.preload}`);
      j.over(v1.poster.endsWith("/img/1v/druha-video-vapka-poster.jpg"), `poster videa č. 1: ${v1.poster}`);
      j.over(/\.webm$/.test(v1.src), `Chrome má dostať WebM (menší súbor): ${v1.src}`);
      j.over(v1.vidno && v1.pomer >= 0.78 && v1.pomer <= 0.82 && v1.linka === "1px rgba(196, 155, 49, 0.6)" && v1.radius === "14px" && v1.vlastnyRam === "0px",
        `rámik videa: pomer ${v1.pomer} (${v1.sirka} × ${v1.vyska}), linka „${v1.linka}“, zaoblenie ${v1.radius}, rám samotného <video> ${v1.vlastnyRam} (starý globálny 5px zlatý)`);
      j.over(/druhá vrstva zachytí vodu/.test(v1.aria || ""), `aria-label videa: „${v1.aria}“`);
      const sietV1 = await sietVidea(s);
      if (meriaSiet(s)) j.over(sietV1.v1.length && !sietV1.v2.length && !sietV1.vsetko.some((x) => /pribeh-poster/.test(x)), `pri otvorení karty sa stiahlo: ${sietV1.vsetko.join(", ")} (má byť len video č. 1 + jeho poster)`);
      await j.pauza(1200); // snímka s rozbehnutým videom
      await snimka(s, a, "druha-video", KARTA);
      // koniec č. 1 -> č. 2 (až teraz sa stiahne) -> koniec č. 2 -> znova č. 1
      await naKoniec(t);
      const v2 = await cakajVideo(t, RE_V2, "po skončení videa č. 1 hrá video č. 2 (príbeh)");
      j.over(v2.poster.endsWith("/img/1v/druha-video-pribeh-poster.jpg") && v2.muted && !v2.controls, `video č. 2: ${JSON.stringify(v2)}`);
      const sietV2 = await sietVidea(s);
      if (meriaSiet(s)) j.over(sietV2.v2.length > 0, `video č. 2 sa po skončení č. 1 nestiahlo: ${sietV2.vsetko.join(", ")}`);
      if (a.snimky) { await j.pauza(1500); await snimka(s, a, "druha-video-2", KARTA); }
      await naKoniec(t);
      await cakajVideo(t, RE_V1, "po skončení videa č. 2 znova video č. 1 (dookola)");
      const zakazane = /na milimeter|vyr[áa]bame|zadarmo|comfort|dragon|elite|basic|z[áa]ruk|vrstiev|fixa[čc]n|s dph/i;
      const infoText = inf.text + " " + inf.nadpis + " " + (inf.riadky || []).map((r) => r.t).join(" ");
      j.over(!zakazane.test(otv.anoText + " " + infoText + " " + otv.nieText + " " + otv.ti), "zakázané slovo v texte karty");
      j.over(!/ekoko[žz]|s dph|bez dph|vyr[áa]b/i.test(infoText + " " + otv.ti), "v bloku karty je „ekokoža“, „DPH“ alebo „vyrábame“");
      j.over(!/prešívan\S*\s+vrstv/i.test((otv.anoText + " " + infoText).replace(/prv\S*\s+prešívan\S*/gi, "")), "„prešívaná vrstva“ bez „prvá“ v texte karty");
      await snimka(s, a, "druha-otazka", KARTA);
      // 4) príplatok = živý rozdiel (cena dvojvrstvového pri tých istých voľbách − táto); overí scenár druha-ano na dvoj stránke
      const n = await cakajPriplatok(t, j);
      // 4b) riadky cien (návrh A, 19. 10. 2026): odporúčaná druhej vrstvy, „Ušetríte“, „Príplatok od“; test čísla spočíta zo stránky:
      //     rámik nad krokmi (cena, odporúčaná) a vzorec webu (productPage.js: × 1,6 nahor na desiatky) pre cenu + príplatok
      const odpTu = await odporucanaRamika(t, ovl);
      const cenaTu = await ovl.cena.zobrazenaCena(t);
      j.over(typeof cenaTu === "number" && cenaTu > 0, `cena v rámiku nad krokmi: ${cenaTu}`);
      const stC = await stavKarty(t);
      const cv = overCenovku(j, stC.cb, { n, odpTu, odpTam: odpTu ? Math.ceil(((cenaTu + n) * 1.6) / 10) * 10 : null, uplny: false, kde: "karta po farbe" }) || {};
      // telefón: dlaždica s riadkami cien ostane rozumne vysoká (video 4:5 v stĺpci fotky, text vedľa neho)
      if (t.mobil) j.over(stC.dlVyska > 0 && stC.dlVyska <= 480, `dlaždica na telefóne je vysoká ${stC.dlVyska} px (najviac 480)`);
      // návrh 1b (Michal 24. 10. 2026): celá otvorená karta (s cenami) na telefóne na jednej obrazovke — pod lepivou hlavičkou webu
      // a najviac KARTA_TELEFON_MAX (okno emulácie 844 px je celá obrazovka telefónu bez líšt prehliadača, preto pevný strop)
      const hlav = await vyskaHlavickyWebu(t);
      const okno = await t.ev("innerHeight");
      const strop = Math.min(KARTA_TELEFON_MAX, okno - hlav);
      if (t.mobil) j.over(stC.vyskaKarty > 0 && stC.vyskaKarty <= strop, `otvorená karta na telefóne ${stC.vyskaKarty} px, smie mať najviac ${strop} px (strop ${KARTA_TELEFON_MAX}, okno ${okno}, hlavička webu ${hlav})`);
      await snimka(s, a, "druha-cena", `${KARTA} .lcd1v-druha__dlazdica`);
      await snimkaKarty(s, a, "druha-karta");
      // 5) Nie -> karta zbalená ako hotová, otvorí sa Rozloženie; POST = baseline
      await t.klikni(`${KARTA} .lcd1v-druha__nie`, { popis: "Nie, ďakujem" });
      await t.cakaj(`document.querySelector("${F} .content-wrap > .parameter-wrap.parameter-${idR}").classList.contains("active")`, { ms: 8000, popis: "otvorené Rozloženie po „Nie, ďakujem“" });
      await t.cakaj(`document.querySelector(${JSON.stringify(VIDEO)}).paused`, { ms: 5000, popis: "video po „Nie, ďakujem“ (zbalená karta) zastavené" });
      const poNie = await stavKarty(t);
      await snimka(s, a, "druha-po-nie", KARTA);
      j.over(!poNie.otvorena && poNie.hotova && poNie.vy === "Bez druhej vrstvy" && poNie.cisloVidno, `karta po Nie: ${JSON.stringify({ o: poNie.otvorena, h: poNie.hotova, vy: poNie.vy, fajka: poNie.cisloVidno })}`);
      const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba, rozlozenie });
      await j.overCenu(s, ovl, cena);
      rovnakyAkoBaseline(j, post, P.id);
      j.over(cena.spolu === P.platne.spolu, `suma ${cena.spolu} ≠ ${P.platne.spolu}`);
      j.over((await kluc(t)) === null, "po „Nie“ ostal kľúč prenosu v sessionStorage");
      return { info: `bez flagu nič; karta bez čísla až po farbe (6 krokov), video až s kartou (${v1.src.split("/").pop()} -> príbeh -> vapka), Pokračujte -> karta, príplatok za celú sadu od + ${n} €${cv.odp ? ` (odporúčaná ${cv.odp} €, ušetríte ${cv.usp} €)` : " (bez odporúčanej — produkt nemá bežnú cenu)"}, otvorená karta ${stC.vyskaKarty} px (okno ${okno}, hlavička webu ${hlav}), dlaždica ${stC.dlVyska} px, Nie -> Rozloženie (video stojí); POST = baseline ${P.id}`, post: post.body, spolu: cena.spolu };
    },
  },

  "druha-ano": {
    typy: ["jedno"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t, cielId = cielDvoj(P), Pc = { id: cielId, ...PRODUKTY[cielId] };
      j.over(cielId, "dvojvrstvový produkt vzoru " + P.vzor + " nie je v profiloch");
      // prefers-reduced-motion: video sa neprehráva ani nesťahuje, ostane poster (vypne sa pred „Áno“)
      await s.k.posli("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await j.otvor(s, a.url, { novy: true });
      const { farba } = await autoAFarba(s, ovl, j);
      // kartu otvorí aj hlavička (bez „Pokračujte ďalej“)
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty druhej vrstvy" });
      await t.cakaj(`document.querySelector(${JSON.stringify(KARTA)}).classList.contains("active")`, { popis: "otvorená karta" });
      await t.ev(`document.querySelector(${JSON.stringify(VIDEO)}).scrollIntoView({ block: "center", behavior: "instant" })`);
      await t.cakaj(`!!document.querySelector(${JSON.stringify(VIDEO)}).getAttribute("poster")`, { ms: 5000, popis: "poster videa pri prefers-reduced-motion" });
      await j.pauza(1200);
      const pokoj = (await stavKarty(t)).video;
      const sietPokoj = await sietVidea(s);
      await s.k.posli("Emulation.setEmulatedMedia", { features: [] });
      j.over(pokoj.vidno && pokoj.poster.endsWith("/img/1v/druha-video-vapka-poster.jpg") && !pokoj.srcAttr && pokoj.paused, `prefers-reduced-motion: ${JSON.stringify(pokoj)} (len poster, bez src, nehrá)`);
      j.over(!sietPokoj.videa.length, `prefers-reduced-motion: stiahlo sa video ${sietPokoj.videa.join(", ")}`);
      const n = await cakajPriplatok(t, j);
      const cenaJedno = await ctxCena(t);
      const cbJedno = (await stavKarty(t)).cb;
      const odpJedno = await odporucanaRamika(t, ovl);
      // Áno: správa v karte, tlačidlá zablokované (stránka sa vymení o ~0,5 s)
      await t.klikni(`${KARTA} .lcd1v-druha__ano`, { popis: "tlačidlo Áno, chcem druhú vrstvu" });
      const hned = await stavKarty(t).catch(() => null);
      if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-druha-prenos-${t.sirka}.png`)).catch(() => {});
      if (hned && hned.je) {
        j.over(hned.prenos && hned.prenos.startsWith("Prenášame Váš výber na dvojvrstvové autokoberce…"), `správa po Áno: „${hned.prenos}“`);
        j.over(hned.anoZablok && hned.nieZablok, "po Áno nie sú tlačidlá zablokované");
      }
      s.produkt = Pc;
      try {
        await poPrenose(s, j, { P, cielId, farba });
        if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-druha-prichod-${cielId}-${t.sirka}.png`)).catch(() => {});
        await nastavFormKluce(s);
        // príplatok = živý rozdiel: cena dvojvrstvového pri tých istých voľbách (farba 2. vrstvy cenu nemení) − jednovrstvového
        const farba2 = await ovl.farba2.vyberFarbu2(t, { index: 0 });
        const cenaDvoj = await ctxCena(t);
        j.over(Math.round((cenaDvoj - cenaJedno) * 100) / 100 === n, `príplatok v karte + ${n} € ≠ živý rozdiel ${cenaDvoj} − ${cenaJedno} = ${cenaDvoj - cenaJedno} €`);
        // odporúčaná v karte = rozdiel odporúčaných cien, ktoré zákazník vidí v rámikoch oboch stránok pri tých istých voľbách
        const odpDvoj = await odporucanaRamika(t, ovl);
        const cv = overCenovku(j, cbJedno, { n, odpTu: odpJedno, odpTam: odpDvoj, uplny: false, kde: `karta ${P.id} proti rámikom ${P.id} a ${cielId}` }) || {};
        const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
        await ovl.cena.pridajDoKosika(t);
        const post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { farba, farba2, rozlozenie });
        await j.overCenu(s, ovl, cena);
        rovnakyAkoBaseline(j, post, cielId);
        j.over(cena.spolu === Pc.platne.spolu && post.pole.priceId === Pc.platne.priceId, `dvoj: suma ${cena.spolu} / priceId ${post.pole.priceId}, profil ${Pc.platne.spolu} / ${Pc.platne.priceId}`);
        // Späť: jednovrstvový s autom a farbou, karta nezodpovedaná, tlačidlá odblokované, kľúč zmazaný
        await t.ev(`history.back()`);
        await t.cakaj(`location.pathname === ${JSON.stringify(new URL(P.url).pathname)}`, { ms: 40000, popis: "Späť na " + P.id });
        t.zabudni();
        s.produkt = P;
        await t.cakaj(j.TYPY_TEST.jedno.pripravene, { ms: 40000, popis: "postavený konfigurátor " + P.id + " po Späť" });
        await t.cakaj(`document.body.classList.contains("lcd-1v") && !!document.querySelector(${JSON.stringify(KARTA)})`, { ms: 30000, popis: "nový vzhľad po Späť" });
        const idF = await t.idParametra("farba");
        await t.cakaj(`!!document.querySelector('${F} .content-wrap .option-button.active[data-variant="${idF}"][data-value="${farba}"]')`, { ms: 20000, popis: "farba " + farba + " vrátená po Späť" });
        await j.pauza(600);
        const spat = await stavKarty(t);
        const nav = await t.ev(`(performance.getEntriesByType("navigation")[0] || {}).type`);
        const auto = await t.ev(`({ model: sessionStorage.getItem("model"), vy: ((document.querySelector("${F} .lcd1v-k-auto > .lcd1v-hd .lcd1v-vy") || {}).textContent || "").trim(), chyby: window.__lcd1v.chyby.slice() })`);
        j.over(nav === "back_forward", "návrat nebol back_forward: " + nav);
        j.over(auto.model === "Audi A6 2015 Combi" && auto.vy === "Audi A6, 2015, Combi", `auto po Späť: ${JSON.stringify(auto)}`);
        j.over(spat.vidno && !spat.hotova && spat.vy === "Áno alebo nie" && !spat.anoZablok && !spat.nieZablok && !spat.prenos, `karta po Späť má byť nezodpovedaná a odblokovaná: ${JSON.stringify(spat)}`);
        j.over(!auto.chyby.length, "chyby 1V po Späť: " + auto.chyby.join("; "));
        j.over((await kluc(t)) === null, "kľúč prenosu po Späť nezmazaný");
        return { info: `${P.id} -> ${cielId}: vzor, auto, farba ${farba} prenesené, otvorený krok 4 bez predvoľby; príplatok + ${n} € = ${cenaDvoj} − ${cenaJedno}; odporúčaná ${cv.odp ? cv.odp + " € = " + odpDvoj + " − " + odpJedno : "neukázaná (" + P.id + " bez bežnej ceny, rámik " + odpJedno + ")"}; POST = baseline ${cielId} (${cena.spolu} €); Späť vráti auto aj farbu`, post: post.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "druha-vsetko": {
    typy: ["jedno"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t, cielId = cielDvoj(P), Pc = { id: cielId, ...PRODUKTY[cielId] };
      await j.otvor(s, a.url, { novy: true });
      const { farba } = await autoAFarba(s, ovl, j);
      const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 2 }); // všetky 3 rady -> 7 miest v kroku 2
      const kufor = await ovl.kuforBoxy.vyberKufor(t, "classic");
      const b = await ovl.kuforBoxy.vyberBoxy(t, { pocet: 2, farba: 0, velkost: "M", velkost2: "S" });
      j.over(b.farbaBoxov && b.box1 && b.box2, "boxy sa nevybrali: " + JSON.stringify(b));
      const miesta = await t.ev(`(document.querySelector("${F} .sit-Position .option-button.active") || { getAttribute: function () { return ""; } }).getAttribute("data-value")`);
      j.over(miesta === "pass-7", "po všetkých troch radoch nie je 7 miest: " + miesta);
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty druhej vrstvy" });
      await t.cakaj(`document.querySelector(${JSON.stringify(KARTA)}).classList.contains("active")`, { popis: "otvorená karta" });
      const n = await cakajPriplatok(t, j);
      const cbJedno = (await stavKarty(t)).cb;
      const odpJedno = await odporucanaRamika(t, ovl);
      if (t.mobil) {
        // telefón: ťuk na video dlaždice (klikateľná je celá dlaždica, nielen tlačidlo)
        await t.klikni(`${KARTA} .lcd1v-druha__dlazdica .lcd1v-druha__fot`, { popis: "video dlaždice druhej vrstvy" });
      } else {
        // PC: klávesnica — fokus na tlačidlo Áno a Enter
        const f = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(KARTA + " .lcd1v-druha__ano")}); b.scrollIntoView({ block: "center", behavior: "instant" }); b.focus(); return document.activeElement === b; })()`);
        j.over(f, "tlačidlo Áno nedostalo fokus");
        const kl = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
        await s.k.posli("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", unmodifiedText: "\r", ...kl });
        await s.k.posli("Input.dispatchKeyEvent", { type: "keyUp", ...kl });
      }
      s.produkt = Pc;
      try {
        await poPrenose(s, j, { P, cielId, farba });
        await nastavFormKluce(s);
        const ids = {};
        for (const k of ["rozlozenie", "kufor", "farbaBoxov", "box1", "box2"]) ids[k] = await t.idParametra(k);
        const st = await t.ev(`(function (ids) {
          var f = document.getElementById("product-detail-form");
          function v(k) { var s = f.querySelector('select[data-parameter-id="' + ids[k] + '"]'); return s ? s.value : null; }
          var rozl = f.querySelector('.content-wrap .option-button.active[data-variant="' + ids.rozlozenie + '"]');
          return { rozlozenie: v("rozlozenie"), rozlTl: rozl ? rozl.getAttribute("data-value") : "", kufor: v("kufor"), farbaBoxov: v("farbaBoxov"), box1: v("box1"), box2: v("box2"),
            kuforKarta: !!f.querySelector(".upsale-buttons.trunk > .parameter-cars > .upsale-button.active"), boxKarta: (f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active") || { getAttribute: function () { return ""; } }).getAttribute("value"),
            okno: f.querySelector(".upsale-Banner").classList.contains("showConf"), miesta: (f.querySelector(".sit-Position .option-button.active") || { getAttribute: function () { return ""; } }).getAttribute("data-value"),
            kuforPress: (f.querySelector('.upsale-buttons.trunk .lcd1v-kb__karta[aria-pressed="true"]') || { getAttribute: function () { return ""; } }).getAttribute("data-kufor") };
        })(${JSON.stringify(ids)})`);
        j.over(st.miesta === "pass-7", "miesta na dvojvrstvovom: " + st.miesta);
        j.over(st.rozlozenie === rozlozenie && st.rozlTl === rozlozenie, `rozloženie na ${cielId}: select ${st.rozlozenie}, tlačidlo ${st.rozlTl}, má ${rozlozenie}`);
        j.over(st.kufor === kufor && st.kuforKarta && st.kuforPress === "classic", `kufor na ${cielId}: ${st.kufor} (karta ${st.kuforKarta}, nový vzhľad ${st.kuforPress}), má ${kufor}`);
        j.over(st.boxKarta === "conf2" && st.farbaBoxov === b.farbaBoxov && st.box1 === b.box1 && st.box2 === b.box2 && !st.okno, `boxy na ${cielId}: ${JSON.stringify(st)}, majú byť ${JSON.stringify(b)} a okno zatvorené`);
        const farba2 = await ovl.farba2.vyberFarbu2(t, { index: 0 });
        const odpDvoj = await odporucanaRamika(t, ovl);
        const cv = overCenovku(j, cbJedno, { n, odpTu: odpJedno, odpTam: odpDvoj, uplny: true, kde: `karta ${P.id} (3 rady, rohož, 2 boxy) proti rámikom ${P.id} a ${cielId}` }) || {};
        await ovl.cena.pridajDoKosika(t);
        const post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { farba, farba2, rozlozenie, kufor, farbaBoxov: b.farbaBoxov, box1: b.box1, box2: b.box2 });
        const c = await j.overCenu(s, ovl, cena);
        return { info: `${P.id} -> ${cielId}: 7 miest, 3 rady, rohož Classic, 2 boxy (${b.box1}+${b.box2}) prenesené, okno boxov zatvorené; karta „Príplatok + ${n} €“${cv.odp ? `, odporúčaná ${cv.odp} € (${odpDvoj} − ${odpJedno})` : ""}; POST platný, ${c.videne} € = Shoptet`, post: post.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "prenos-neplatny": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      await j.otvor(s, a.url, { novy: true });
      await ovl.kroky.vyberAuto(t, j.AUTO);
      const idF = await t.idParametra("farba");
      const farby = await t.ev(`Array.prototype.map.call(document.querySelectorAll('${F} .content-wrap .option-button[data-variant="${idF}"]'), function (b) { return b.getAttribute("data-value"); })`);
      const zdroj = Number(Object.keys(PRODUKTY).find((id) => PRODUKTY[id].typ === "jedno" && PRODUKTY[id].vzor === P.vzor));
      const pokus = async (popis, zaznam, { ostane }) => {
        await t.ev(`sessionStorage.setItem(${JSON.stringify(KLUC)}, ${JSON.stringify(JSON.stringify(zaznam))})`);
        await j.otvor(s, a.url, { novy: true });
        await j.pauza(1500);
        const st = await t.ev(`({ farba: !!document.querySelector('${F} .content-wrap .option-button.active[data-variant="${idF}"]'), kluc: sessionStorage.getItem(${JSON.stringify(KLUC)}), chyby: window.__lcd1v.chyby.slice(),
          otvorene: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-krok.active"), function (e) { return e.className.replace(/.*lcd1v-k-(\\w+).*/, "$1"); }) })`);
        j.over(!st.farba, `${popis}: farba sa zapísala`);
        j.over(!st.chyby.length, `${popis}: chyby 1V ${st.chyby.join("; ")}`);
        j.over(ostane ? st.kluc !== null : !(st.kluc && JSON.parse(st.kluc).prijate === 0), `${popis}: kľúč ${st.kluc}`);
        return st;
      };
      await pokus("kľúč starší ako 10 min", { v: 1, t: Date.now() - 11 * 60 * 1000, z: zdroj, na: P.id, vyber: { farba: farby[0] }, prijate: 0 }, { ostane: false });
      await pokus("kľúč pre iný produkt", { v: 1, t: Date.now(), z: zdroj, na: 99999, vyber: { farba: farby[0] }, prijate: 0 }, { ostane: true });
      const st = await pokus("farba, ktorú produkt nemá", { v: 1, t: Date.now(), z: zdroj, na: P.id, vyber: { farba: "999999" }, prijate: 0 }, { ostane: true });
      j.over(st.otvorene.length === 1 && st.otvorene[0] === "farba", `chýbajúca farba: otvorené ${st.otvorene.join(", ")}, má sa otvoriť krok Farba`);
      await t.ev(`sessionStorage.removeItem(${JSON.stringify(KLUC)})`);
      return { info: `starý kľúč, iný produkt, chýbajúca farba: nič sa neprenieslo, bez chyby; pri chýbajúcej farbe otvorený krok Farba` };
    },
  },
};
