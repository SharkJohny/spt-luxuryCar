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
//                   návrh 1b (Michal 24. 10. 2026): nadpis „Prajete si aj druhú odnímateľnú vrstvu?“, pás „★ Najčastejšia
//                   voľba“; variant B (Michal 25. 10. 2026): namiesto podnadpisu blok „8 z 10 | zákazníkov si vybralo
//                   autokoberce s druhou vrstvou“ v jednom nízkom riadku + vrstvy heslovite (zlatý štítok veľkými, riadky
//                   s farebnou ikonou 22 px: zlatý diamant, tmavý štít, modrá kvapka, zelená iskra), žiadne „Nie je to koberec
//                   na koberci“ ani znevažovanie jednovrstvových („jar až leto“, „celý rok“…), pevné medzery za
//                   jednopísmenovými slovami, písmo ≥ 15 px, štítky ≥ 12 px; „ⓘ Zistiť viac“ = <button> vpravo na riadku
//                   „2 · Druhá vrstva“ (aria-haspopup dialog, podčiarknutý len text, ťukacia výška ≥ 44 px) -> okienko
//                   „Čo je druhá vrstva?“ postavené až pri prvom kliku: dialóg (role, aria-modal, aria-labelledby), texty,
//                   fokus dnu a späť, Tab ostáva vnútri, Esc / × / pozadie zavrú, stránka pod ním sa kolieskom nepohne,
//                   telefón panel zdola, PC v strede ≤ 480 px (snímka: --snimky -> <id>-druha-okno-<šírka>.png);
//                   otvorená karta s cenami sa na telefóne zmestí do okna pod hlavičku webu (snímka celej karty: --snimky);
//                   Áno aj Nie sú skutočné tlačidlá (<button type=button>, fokus klávesnicou),
//                   zelené „Áno, chcem druhú vrstvu“ v dlaždici (div) nad zlatým „Nie, ďakujem“ (Michal 15. 10., farby prehodené 16. 10. 2026);
//                   „Nie, ďakujem“ zbalí kartu („Bez druhej vrstvy“) a otvorí Rozloženie;
//                   POST = baseline jednovrstvového produktu (1v-baseline.json, scenár platne);
//                   video v dlaždici (Michal 16. 10. 2026): pred otvorením karty žiadna požiadavka na druha-video-* (ani poster),
//                   po otvorení hrá č. 1 vapka (WebM, muted, playsinline, bez ovládania, rámik 4:5), č. 2 sa ešte nesťahuje;
//                   koniec č. 1 -> č. 2 príbeh -> koniec -> znova č. 1; po „Nie“ video stojí
//   druha-ano       prefers-reduced-motion: video len poster, bez src, nič sa nestiahne; hlavička karty -> „Áno, chcem druhú vrstvu“
//                   (390 px: zelené Áno v okienku „Čo je druhá vrstva?“ po „Zistiť viac“ — okienko sa zavrie; 1280 px: tlačidlo
//                   v dlaždici myšou): správa v karte, tlačidlá zablokované (aj „Zistiť viac“), prechod na dvojvrstvový produkt
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
      // blok pod hlavičkou (Michal 25. 10. 2026, variant B): zlatý box „8 z 10“ v jednom riadku, dve vrstvy heslovite (zlatý
      // štítok + riadky s farebnou ikonou), „Zistiť viac“ pri druhej vrstve; surovy = textContent bez úprav (pevné medzery
      // \\u00a0 ostanú — kontrola jednopísmenových predložiek na konci riadka)
      info: (function () {
        var b = k.querySelector(":scope > .lcd1v-druha__info");
        if (!b) return null;
        function t2(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
        function tucne(e) { return e ? Array.prototype.map.call(e.querySelectorAll("b"), t2) : []; }
        function px(e) { return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }
        function stred(r) { return (r.top + r.bottom) / 2; }
        var pt = b.querySelector(".lcd1v-druha__pocet-t"), pc = b.querySelector(".lcd1v-druha__pocet-c"), poc = b.querySelector(".lcd1v-druha__pocet");
        var vrstvy = Array.prototype.slice.call(b.querySelectorAll(".lcd1v-druha__vrstvy > .lcd1v-druha__vrstva"));
        var body = Array.prototype.slice.call(b.querySelectorAll(".lcd1v-druha__bod"));
        var rp = poc && poc.getBoundingClientRect(), rc = pc && pc.getBoundingClientRect(), rt = pt && pt.getBoundingClientRect();
        var viac = b.querySelector(".lcd1v-druha__viac");
        return {
          vidno: vid(b), cislo: t2(pc), text: t2(pt), textB: tucne(pt), cisloPx: px(pc),
          pocetVyska: rp ? Math.round(rp.height) : 0,
          // jeden riadok: veľké číslo vľavo, text vedľa neho (nie pod ním), zvisle na stred
          pocetRiadok: !!(rc && rt && rt.left >= rc.right - 0.5 && Math.abs(stred(rc) - stred(rt)) < 6),
          vrstvy: vrstvy.map(function (v) {
            var st = v.querySelector(".lcd1v-druha__vrstva-hd > .lcd1v-druha__stitok"), cs = st ? getComputedStyle(st) : null;
            return {
              stitok: t2(st), velke: cs ? cs.textTransform : "", farba: cs ? cs.color : "", px: px(st), viac: !!v.querySelector(".lcd1v-druha__viac"),
              body: Array.prototype.map.call(v.querySelectorAll(".lcd1v-druha__body > .lcd1v-druha__bod"), function (li) {
                var svg = li.querySelector("svg.lcd1v-druha__ikona"), c = svg && svg.querySelector("circle"), r = svg && svg.getBoundingClientRect();
                return { t: t2(li.querySelector(".lcd1v-druha__bod-t")), px: px(li),
                  ikona: svg ? { farba: c ? c.getAttribute("fill") : "", skryta: svg.getAttribute("aria-hidden"), w: Math.round(r.width), h: Math.round(r.height) } : null };
              }),
            };
          }),
          viac: viac ? (function () {
            var r = viac.getBoundingClientRect(), hd = viac.parentNode, st = hd.querySelector(".lcd1v-druha__stitok"), rs = st.getBoundingClientRect(), rh = hd.getBoundingClientRect();
            var i = viac.querySelector(".lcd1v-druha__viac-i"), tx = viac.querySelector(".lcd1v-druha__viac-t");
            return { tag: viac.tagName, typ: viac.type, popup: viac.getAttribute("aria-haspopup"), aria: viac.getAttribute("aria-label"), tab: viac.tabIndex,
              text: t2(tx), i: t2(i), iSkryte: i ? i.getAttribute("aria-hidden") : null, px: px(viac),
              podciarkTx: tx ? getComputedStyle(tx).textDecorationLine : "", podciarkI: i ? getComputedStyle(i).textDecorationLine : "", podciarkTl: getComputedStyle(viac).textDecorationLine,
              vyska: Math.round(r.height), sirka: Math.round(r.width),
              rovnakyRiadok: Math.abs(stred(r) - stred(rs)) < 4, vpravo: Math.abs(r.right - rh.right) < 6 && r.left > rs.right };
          })() : null,
          surovy: b.textContent, pozadie: poc ? getComputedStyle(poc).backgroundColor : "",
          pismo: Math.min(px(pt), body.length ? Math.min.apply(null, body.map(px)) : 0),
          nadHlavickou: !!(b.previousElementSibling && b.previousElementSibling.classList.contains("lcd1v-hd")),
          predDlazdicou: !!(dl && (b.compareDocumentPosition(dl) & 4)),
        };
      })(),
      kartaText: k.textContent.replace(/\\s+/g, " ").trim(),
      viacZablok: !!(k.querySelector(".lcd1v-druha__viac") && k.querySelector(".lcd1v-druha__viac").disabled),
      oknoOtvorene: (function () { var o = document.querySelector(".lcd1v-druha-okno"); return !!(o && !o.hidden); })(),
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
 * Variant B (Michal 25. 10. 2026, predloha F1-ikony = 708 px): strop ostáva 720 px (zadanie „max ~720 px“) od 375 px
 * (iPhone SE / mini) vyššie. Pod 375 px (Android 360 px) má nadpis kroku 3 riadky (písmo hlavičky ako ostatné kroky, nezmenšuje
 * sa) a riadok „jednoduchšia údržba – vyberiete a opláchnete“ 2 riadky (text 15 px, mierka Michal 18. 10.) -> +49 px:
 * zmerané 25. 10. 2026 pri 360 px ~763 px; strop KARTA_UZKY_MAX stráži, aby ďalej nerástla.
 */
const KARTA_TELEFON_MAX = 720;
const KARTA_UZKY_MAX = 770;
/** Nikde neznevažovať jednovrstvové (Michal 25. 10. 2026) + veta návrhu 1b preč — ani v karte, ani v okienku. */
const NEZNEVAZOVAT = /koberec na koberci|jar až leto|celý rok|celoročn|chráni prvú|ostane čistá/i;
const OKNO = ".lcd1v-druha-okno";

/** Okienko „Čo je druhá vrstva?“ (Michal 25. 10. 2026, variant B; predloha C4-okienko) ako ho vidí zákazník. */
function stavOkna(t) {
  return t.ev(`(function () {
    var o = document.querySelector(${JSON.stringify(OKNO)});
    if (!o) return { je: false };
    var p = o.querySelector(".lcd1v-druha-okno__panel"), pz = o.querySelector(".lcd1v-druha-okno__pozadie");
    function t2(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
    function px(e) { return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }
    var r = p.getBoundingClientRect(), cs = getComputedStyle(p), lb = document.getElementById(p.getAttribute("aria-labelledby") || "");
    var ae = document.activeElement, viac = document.querySelector(${JSON.stringify(KARTA + " .lcd1v-druha__viac")});
    var x = o.querySelector(".lcd1v-druha-okno__x"), ano = o.querySelector(".lcd1v-druha-okno__ano"), rx = x ? x.getBoundingClientRect() : null;
    return {
      je: true, vidno: !o.hidden && getComputedStyle(o).display !== "none" && r.height > 0, vBody: o.parentNode === document.body,
      role: p.getAttribute("role"), modal: p.getAttribute("aria-modal"), nadpis: t2(lb), nadpisTag: lb ? lb.tagName : null,
      casti: Array.prototype.map.call(o.querySelectorAll(".lcd1v-druha-okno__cast"), function (c) {
        var n = c.querySelector(".lcd1v-druha-okno__stitok"), tx = c.querySelector(".lcd1v-druha-okno__text");
        return { nm: t2(n), text: t2(tx), pxNm: px(n), pxText: px(tx), velke: n ? getComputedStyle(n).textTransform : "" }; }),
      pocet: t2(o.querySelector(".lcd1v-druha-okno__pocet-c")) + " | " + t2(o.querySelector(".lcd1v-druha-okno__pocet-t")),
      ano: ano ? { tag: ano.tagName, typ: ano.type, text: t2(ano), pozadie: getComputedStyle(ano).backgroundImage } : null,
      x: x ? { tag: x.tagName, typ: x.type, aria: x.getAttribute("aria-label"), w: Math.round(rx.width), h: Math.round(rx.height) } : null,
      fokusVnutri: !!(ae && p.contains(ae)), fokusNaViac: !!(viac && ae === viac), fokus: ae ? (ae.className || ae.tagName) : null,
      expanded: viac ? viac.getAttribute("aria-expanded") : null,
      rect: { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) },
      // plocha okienka = prekrytie position: fixed (web má na <html> scrollbar-gutter: stable -> na PC o pásik posuvníka
      // užšie než okno prehliadača) — stred a šírka sa merajú voči nemu
      okno: (function () { var k = o.getBoundingClientRect(); return { l: Math.round(k.left), w: Math.round(k.width), h: Math.round(k.height) }; })(),
      rohy: { hore: parseFloat(cs.borderTopLeftRadius), dole: parseFloat(cs.borderBottomLeftRadius) },
      pozadie: pz ? getComputedStyle(pz).backgroundColor : "",
      zamknute: document.body.classList.contains("lcd1v-druha-okno-otvorene") && getComputedStyle(document.body).overflow === "hidden",
      lenisPrevent: p.hasAttribute("data-lenis-prevent"), roluje: /auto|scroll/.test(cs.overflowY),
      surovy: o.textContent, text: t2(o),
    };
  })()`);
}
const oknoOtvorene = `(function () { var o = document.querySelector(${JSON.stringify(OKNO)}); return !!(o && !o.hidden); })()`;
const oknoZatvorene = `(function () { var o = document.querySelector(${JSON.stringify(OKNO)}); return !!(o && o.hidden); })()`;
/** Kláves cez CDP (Tab / Shift+Tab / Escape) — skutočná klávesnica, nie syntetická udalosť. */
async function klaves(s, key, kod, shift) {
  const kl = { key, code: key, windowsVirtualKeyCode: kod, nativeVirtualKeyCode: kod, modifiers: shift ? 8 : 0 };
  await s.k.posli("Input.dispatchKeyEvent", { type: "rawKeyDown", ...kl });
  await s.k.posli("Input.dispatchKeyEvent", { type: "keyUp", ...kl });
  await pauzaKratka();
}
const pauzaKratka = () => new Promise((r) => setTimeout(r, 120));
/** Koliesko myši na bode (x, y) -> o koľko sa posunula stránka (má byť 0, kým je okienko otvorené). */
async function koliesko(s, x, y) {
  const y0 = await s.t.ev("scrollY");
  await s.k.posli("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY: 500 });
  await new Promise((r) => setTimeout(r, 500));
  return (await s.t.ev("scrollY")) - y0;
}

/**
 * Okienko „Čo je druhá vrstva?“ (Michal 25. 10. 2026, variant B): postaví sa až pri prvom kliku na „Zistiť viac“; dialóg
 * (role, aria-modal, aria-labelledby = nadpis), texty presne podľa zadania, fokus dnu a späť na „Zistiť viac“, Tab
 * ostáva vnútri, Esc / × / klik na pozadie zavrú, stránka pod ním sa kolieskom nepohne, telefón = panel zdola, PC = v strede
 * (najviac 480 px). Snímka otvoreného okienka: --snimky -> <produkt>-druha-okno-<šírka>.png. Okienko na konci zatvorené.
 */
async function overOkno(s, a, j) {
  const t = s.t;
  const pred = await stavOkna(t);
  j.over(!pred.je, "okienko „Čo je druhá vrstva?“ je v stránke ešte pred klikom na „Zistiť viac“ (má sa postaviť až pri prvom kliku)");
  // 1) otvorenie klikom
  await t.klikni(`${KARTA} .lcd1v-druha__viac`, { popis: "Zistiť viac" });
  await t.cakaj(oknoOtvorene, { ms: 5000, popis: "otvorené okienko po „Zistiť viac“" });
  await j.pauza(400); // nábeh panela (animácia 0,2 s)
  const o = await stavOkna(t);
  j.over(o.vidno && o.vBody && o.role === "dialog" && o.modal === "true" && o.nadpis === "Čo je druhá vrstva?" && o.nadpisTag === "H3",
    `okienko: viditeľné ${o.vidno}, v <body> ${o.vBody}, role ${o.role}, aria-modal ${o.modal}, nadpis (aria-labelledby) „${o.nadpis}“ ${o.nadpisTag}`);
  j.over(o.fokusVnutri && o.expanded === "true", `po otvorení: fokus v okienku ${o.fokusVnutri} (${o.fokus}), aria-expanded „${o.expanded}“`);
  const CASTI = [
    { nm: "Čo to je", text: "Odnímateľná vrstva z hustého krátkeho vlasu, ktorá leží na prvej prešívanej vrstve. Farbu si vyberiete v ďalšom kroku – odporúčame ju v tóne prvej vrstvy." },
    { nm: "Čo Vám pridá", text: "Zachytí vodu, sneh, blato aj soľ z topánok. Fľaky na nej takmer nevidieť." },
    { nm: "Jednoduchšia údržba", text: "Vyberiete ju, vytrasiete a opláchnete – aj vapkou. Potom ju vrátite späť." },
  ];
  j.over(o.casti.length === 3 && CASTI.every((c, i) => o.casti[i].nm === c.nm && o.casti[i].text === c.text && o.casti[i].velke === "uppercase"), `časti okienka: ${JSON.stringify(o.casti)}`);
  j.over(o.pocet === "8 z 10 | zákazníkov si ju za posledný rok vybralo", `box v okienku: „${o.pocet}“`);
  j.over(o.ano && o.ano.tag === "BUTTON" && o.ano.typ === "button" && o.ano.text === "Áno, chcem druhú vrstvu" && /47, 156, 104|29, 107, 74/.test(o.ano.pozadie), `Áno v okienku: ${JSON.stringify(o.ano)}`);
  j.over(o.x && o.x.tag === "BUTTON" && o.x.typ === "button" && o.x.aria === "Zavrieť" && o.x.w >= 36 && o.x.h >= 36, `× v okienku: ${JSON.stringify(o.x)}`);
  j.over(!RE_SIROTA.test(o.surovy || ""), `okienko: jednopísmenové slovo s obyčajnou medzerou za sebou: „${(RE_SIROTA.exec(o.surovy || "") || [""])[0]}“`);
  j.over(o.casti.every((c) => c.pxText >= 15 && c.pxNm >= 12), `písmo okienka (text ≥ 15 px, štítky ≥ 12 px): ${o.casti.map((c) => c.pxNm + "/" + c.pxText).join(", ")}`);
  j.over(!NEZNEVAZOVAT.test(o.text || ""), `okienko znevažuje jednovrstvové / ostala stará veta: „${(NEZNEVAZOVAT.exec(o.text || "") || [""])[0]}“`);
  j.over(/20, 17, 12/.test(o.pozadie) && o.zamknute && o.lenisPrevent && o.roluje, `pozadie ${o.pozadie}, stránka zamknutá ${o.zamknute}, data-lenis-prevent ${o.lenisPrevent}, obsah sa roluje ${o.roluje}`);
  if (t.mobil) j.over(o.rect.l === o.okno.l && o.rect.r === o.okno.l + o.okno.w && Math.abs(o.rect.b - o.okno.h) <= 1 && o.rect.t >= 0 && o.rohy.hore >= 16 && o.rohy.dole === 0,
    `telefón: okienko má byť panel zdola cez celú šírku so zaoblenými hornými rohmi: ${JSON.stringify({ rect: o.rect, okno: o.okno, rohy: o.rohy })}`);
  else j.over(o.rect.w <= 480 && Math.abs((o.rect.l + o.rect.r) / 2 - (o.okno.l + o.okno.w / 2)) <= 2 && Math.abs((o.rect.t + o.rect.b) / 2 - o.okno.h / 2) <= 2 && o.rohy.hore >= 16 && o.rohy.dole >= 16,
    `PC: okienko má byť v strede, najviac 480 px, zaoblené: ${JSON.stringify({ rect: o.rect, okno: o.okno, rohy: o.rohy })}`);
  if (a.snimky) await s.k.snimka(join(a.snimky, `${a.produkt.id}-druha-okno-${t.sirka}.png`)).catch(() => {});
  // 2) stránka pod okienkom sa nepohne (koliesko nad pozadím aj nad panelom; na PC beží Lenis)
  const posunPozadie = await koliesko(s, 12, 12);
  const posunPanel = await koliesko(s, Math.round((o.rect.l + o.rect.r) / 2), Math.round((o.rect.t + o.rect.b) / 2));
  j.over(posunPozadie === 0 && posunPanel === 0, `stránka pod okienkom sa kolieskom posunula: nad pozadím ${posunPozadie} px, nad panelom ${posunPanel} px`);
  // 2b) PC: zmena šírky okna cez hranicu Lenisu (lcdHome.js, 1025 px) počas otvoreného okienka — lcdHome.js starý Lenis
  //     zruší a vytvorí nový; aj ten musí stáť (koliesko nad pozadím stránku nepohne). Kontrola 25. 10. 2026 (predtým
  //     nový Lenis bežal a koliesko posunulo stránku o 497 px).
  const lenis = () => t.ev(`(function () { var l = typeof window.__lcdhLenis === "function" ? window.__lcdhLenis() : null; return l ? (l.isStopped ? "stojí" : "beží") : "žiadny"; })()`);
  const lenisNaZaciatku = await lenis();
  let lenisPriebeh = "";
  if (!t.mobil) {
    const metriky = (w) => s.k.posli("Emulation.setDeviceMetricsOverride", { width: w, height: s.k.vyska, deviceScaleFactor: 1, mobile: false });
    let uzky = "", spat = "", posunPoZmene = null;
    try {
      await metriky(1000);
      await j.pauza(500);
      uzky = await lenis();
      await metriky(s.k.sirka);
      await j.pauza(500);
      spat = await lenis();
      posunPoZmene = await koliesko(s, 12, 12);
    } finally {
      await metriky(s.k.sirka);
    }
    j.over(lenisNaZaciatku !== "beží" && uzky === "žiadny" && spat !== "beží" && posunPoZmene === 0 && (await t.ev(oknoOtvorene)),
      `zmena šírky 1280 -> 1000 -> 1280 px s otvoreným okienkom: Lenis ${lenisNaZaciatku} -> ${uzky} -> ${spat}, koliesko nad pozadím posunulo stránku o ${posunPoZmene} px`);
    lenisPriebeh = `${lenisNaZaciatku} -> ${uzky} -> ${spat}`;
  }
  // 3) Tab / Shift+Tab ostáva v okienku (× -> Áno -> × …)
  const fokusy = [];
  const kde = () => t.ev(`(function () { var a = document.activeElement, p = document.querySelector(".lcd1v-druha-okno__panel"); return { vnutri: !!(a && p.contains(a)), c: a ? String(a.className || a.tagName) : "" }; })()`);
  for (let i = 0; i < 4; i++) { await klaves(s, "Tab", 9, false); fokusy.push(await kde()); }
  for (let i = 0; i < 3; i++) { await klaves(s, "Tab", 9, true); fokusy.push(await kde()); }
  j.over(fokusy.every((f) => f.vnutri) && fokusy.some((f) => /okno__x/.test(f.c)) && fokusy.some((f) => /okno__ano/.test(f.c)), `Tab / Shift+Tab odišiel z okienka: ${fokusy.map((f) => f.c).join(" > ")}`);
  // 4) Esc zavrie, fokus späť na „Zistiť viac“, stránka odomknutá
  await klaves(s, "Escape", 27, false);
  await t.cakaj(oknoZatvorene, { ms: 3000, popis: "okienko zatvorené po Esc" });
  const poEsc = await stavOkna(t);
  j.over(poEsc.fokusNaViac && poEsc.expanded === "false" && !poEsc.zamknute, `po Esc: fokus na „Zistiť viac“ ${poEsc.fokusNaViac} (${poEsc.fokus}), aria-expanded „${poEsc.expanded}“, stránka zamknutá ${poEsc.zamknute}`);
  // Lenis (PC) po zatvorení znova beží — aj ten, ktorý vznikol pri zmene šírky počas otvoreného okienka
  const lenisPoEsc = await lenis();
  j.over(lenisPoEsc === (lenisNaZaciatku === "žiadny" ? "žiadny" : "beží"), `po Esc má Lenis znova bežať: ${lenisPoEsc} (pri otvorení ${lenisNaZaciatku})`);
  // 5) × zavrie (znova otvorené kliknutím — okienko sa už nestavia nanovo)
  await t.klikni(`${KARTA} .lcd1v-druha__viac`, { popis: "Zistiť viac (2.)" });
  await t.cakaj(oknoOtvorene, { ms: 5000, popis: "okienko znova otvorené" });
  await j.pauza(300);
  const pocet = await t.ev(`document.querySelectorAll(${JSON.stringify(OKNO)}).length`);
  await t.klikni(".lcd1v-druha-okno__x", { popis: "× v okienku" });
  await t.cakaj(oknoZatvorene, { ms: 3000, popis: "okienko zatvorené po ×" });
  const poX = await stavOkna(t);
  j.over(pocet === 1 && poX.fokusNaViac && !poX.zamknute, `po ×: okienok v stránke ${pocet}, fokus na „Zistiť viac“ ${poX.fokusNaViac} (${poX.fokus}), stránka zamknutá ${poX.zamknute}`);
  // 6) klik na tmavé pozadie zavrie
  await t.klikni(`${KARTA} .lcd1v-druha__viac`, { popis: "Zistiť viac (3.)" });
  await t.cakaj(oknoOtvorene, { ms: 5000, popis: "okienko otvorené tretí raz" });
  await j.pauza(300);
  const naPozadi = await t.ev(`(function () { var e = document.elementFromPoint(12, 12); return !!(e && e.classList.contains("lcd1v-druha-okno__pozadie")); })()`);
  j.over(naPozadi, "bod (12, 12) nie je tmavé pozadie okienka (niečo leží nad ním)");
  await s.k.klik(12, 12);
  await t.cakaj(oknoZatvorene, { ms: 3000, popis: "okienko zatvorené po kliku na pozadie" });
  const poPozadi = await stavOkna(t);
  j.over(poPozadi.fokusNaViac && !poPozadi.zamknute, `po kliku na pozadie: fokus na „Zistiť viac“ ${poPozadi.fokusNaViac}, stránka zamknutá ${poPozadi.zamknute}`);
  return { rect: o.rect, lenis: lenisPriebeh ? `${lenisPriebeh}, po Esc ${lenisPoEsc}` : "" };
}
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
      const bez = await t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), karta: !!document.querySelector(".lcd1v-druha"), okno: !!document.querySelector(${JSON.stringify(OKNO)}), ctx: !!window.__lcd1v, kluc: sessionStorage.getItem(${JSON.stringify(KLUC)}) })`);
      j.over(!bez.trieda && !bez.karta && !bez.okno && !bez.ctx && bez.kluc === null, `bez flagu sa niečo zmenilo: ${JSON.stringify(bez)}`);
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
      // variant B (Michal 25. 10. 2026; predloha F1-ikony „Farby A“): podnadpis nahradil blok pod hlavičkou — zlatý box „8 z 10“
      // v JEDNOM nízkom riadku, vrstvy heslovite (zlatý štítok veľkými + riadky s farebnou ikonou v krúžku), pri druhej vrstve
      // „ⓘ Zistiť viac“; veta návrhu 1b „Nie je to koberec na koberci.“ preč (vrstvy vždy „prvá prešívaná“ / „druhá“, 15. 10. 2026)
      j.over(otv.pod === null, `starý podnadpis ostal: „${otv.pod}“`);
      const inf = otv.info || {};
      j.over(inf.vidno && inf.nadHlavickou && inf.predDlazdicou, `blok „8 z 10“: viditeľný ${inf.vidno}, hneď pod hlavičkou ${inf.nadHlavickou}, nad dlaždicou ${inf.predDlazdicou}`);
      j.over(inf.cislo === "8 z 10" && inf.text === "zákazníkov si vybralo autokoberce s druhou vrstvou" && JSON.stringify(inf.textB) === JSON.stringify(["s druhou vrstvou"]),
        `zlatý box: „${inf.cislo}“ | „${inf.text}“ tučné ${JSON.stringify(inf.textB)}`);
      j.over(inf.pocetRiadok && inf.pocetVyska > 0 && inf.pocetVyska <= 64 && inf.cisloPx >= 30, `„8 z 10“ má byť v jednom nízkom riadku (veľké číslo vľavo, text vedľa): v riadku ${inf.pocetRiadok}, výška boxu ${inf.pocetVyska} px (najviac 64), číslo ${inf.cisloPx} px`);
      j.over(/247, 241, 223/.test(inf.pozadie || ""), `zlatý box nemá krémové pozadie: ${inf.pozadie}`);
      j.over(!NEZNEVAZOVAT.test(otv.kartaText || ""), `karta znevažuje jednovrstvové / ostala veta návrhu 1b: „${(NEZNEVAZOVAT.exec(otv.kartaText || "") || [""])[0]}“`);
      const VRSTVY = [
        { stitok: "1 · Prvá prešívaná vrstva", viac: false, body: [["luxusný vzhľad", "#c49b31"], ["kompletná ochrana podlahy aj bokov", "#3d3728"]] },
        { stitok: "2 · Druhá vrstva", viac: true, body: [["zachytí vodu, sneh aj blato", "#2f6db0"], ["jednoduchšia údržba – vyberiete a opláchnete", "#1f7a52"]] },
      ];
      const vr = inf.vrstvy || [];
      j.over(vr.length === 2 && VRSTVY.every((v, i) => { const x = vr[i]; return x.stitok === v.stitok && x.viac === v.viac && x.velke === "uppercase" && x.body.length === v.body.length &&
        v.body.every(([tx, f], n) => { const b = x.body[n]; return b.t === tx && b.ikona && b.ikona.farba === f && b.ikona.skryta === "true" && b.ikona.w === 22 && b.ikona.h === 22; }); }),
        `vrstvy v karte (štítok veľkými, riadky s farebnou ikonou 22 px, aria-hidden): ${JSON.stringify(vr)}`);
      j.over(vr.every((x) => /124, 95, 22/.test(x.farba) && x.px >= 12), `štítky vrstiev: ${vr.map((x) => x.farba + " " + x.px + " px").join(" | ")} (zlaté #7c5f16, najmenej 12 px)`);
      // „ⓘ Zistiť viac“: skutočné tlačidlo vpravo na riadku „2 · Druhá vrstva“, otvára dialóg, podčiarknutý len text, „i“ len ozdoba
      const vc = inf.viac || {};
      j.over(vc.tag === "BUTTON" && vc.typ === "button" && vc.popup === "dialog" && vc.tab >= 0 && vc.text === "Zistiť viac" && vc.i === "i" && vc.iSkryte === "true" && /^Zistiť viac/.test(vc.aria || "") && vc.px >= 12,
        `tlačidlo „Zistiť viac“: ${JSON.stringify(vc)}`);
      j.over(/underline/.test(vc.podciarkTx || "") && !/underline/.test(vc.podciarkI || "") && !/underline/.test(vc.podciarkTl || ""), `podčiarknutý má byť len text „Zistiť viac“: text ${vc.podciarkTx}, „i“ ${vc.podciarkI}, tlačidlo ${vc.podciarkTl}`);
      j.over(vc.rovnakyRiadok && vc.vpravo && vc.vyska >= 44, `„Zistiť viac“ vpravo na riadku štítku ${vc.rovnakyRiadok && vc.vpravo}, ťukacia plocha ${vc.sirka} × ${vc.vyska} px (výška najmenej 44)`);
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
      const infoText = inf.text + " " + vr.map((x) => x.stitok + " " + x.body.map((b) => b.t).join(" ")).join(" ");
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
      const stropTel = t.sirka < 375 ? KARTA_UZKY_MAX : KARTA_TELEFON_MAX;
      const strop = Math.min(stropTel, okno - hlav);
      if (t.mobil) j.over(stC.vyskaKarty > 0 && stC.vyskaKarty <= strop, `otvorená karta na telefóne ${stC.vyskaKarty} px, smie mať najviac ${strop} px (strop ${stropTel} pri ${t.sirka} px, okno ${okno}, hlavička webu ${hlav})`);
      await snimka(s, a, "druha-cena", `${KARTA} .lcd1v-druha__dlazdica`);
      await snimkaKarty(s, a, "druha-karta");
      // 4c) okienko „Čo je druhá vrstva?“ (variant B, Michal 25. 10. 2026): otvorenie, prístupnosť, Esc / × / pozadie
      const ok = await overOkno(s, a, j);
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
      return { info: `bez flagu nič; karta bez čísla až po farbe (6 krokov), video až s kartou (${v1.src.split("/").pop()} -> príbeh -> vapka), Pokračujte -> karta, príplatok za celú sadu od + ${n} €${cv.odp ? ` (odporúčaná ${cv.odp} €, ušetríte ${cv.usp} €)` : " (bez odporúčanej — produkt nemá bežnú cenu)"}, otvorená karta ${stC.vyskaKarty} px (okno ${okno}, hlavička webu ${hlav}), dlaždica ${stC.dlVyska} px, okienko ${ok.rect.w} × ${ok.rect.h} px (Esc, ×, pozadie, Tab vnútri${ok.lenis ? `; Lenis pri zmene šírky ${ok.lenis}` : ""}), Nie -> Rozloženie (video stojí); POST = baseline ${P.id}`, post: post.body, spolu: cena.spolu };
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
      // Áno: telefón = zelené „Áno, chcem druhú vrstvu“ v okienku „Čo je druhá vrstva?“ (variant B, Michal 25. 10. 2026 —
      // presne tá istá akcia ako Áno v dlaždici; okienko sa zavrie), PC = tlačidlo v dlaždici (myš). Správa v karte,
      // tlačidlá zablokované (stránka sa vymení o ~0,5 s)
      if (t.mobil) {
        await t.klikni(`${KARTA} .lcd1v-druha__viac`, { popis: "Zistiť viac" });
        await t.cakaj(oknoOtvorene, { ms: 5000, popis: "otvorené okienko „Čo je druhá vrstva?“" });
        await j.pauza(400);
        await t.klikni(".lcd1v-druha-okno__ano", { popis: "Áno, chcem druhú vrstvu (okienko)" });
      } else {
        await t.klikni(`${KARTA} .lcd1v-druha__ano`, { popis: "tlačidlo Áno, chcem druhú vrstvu" });
      }
      const hned = await stavKarty(t).catch(() => null);
      if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-druha-prenos-${t.sirka}.png`)).catch(() => {});
      if (hned && hned.je) {
        j.over(hned.prenos && hned.prenos.startsWith("Prenášame Váš výber na dvojvrstvové autokoberce…"), `správa po Áno: „${hned.prenos}“`);
        j.over(hned.anoZablok && hned.nieZablok && hned.viacZablok, `po Áno nie sú tlačidlá zablokované (Áno ${hned.anoZablok}, Nie ${hned.nieZablok}, Zistiť viac ${hned.viacZablok})`);
        j.over(!hned.oknoOtvorene, "po Áno v okienku ostalo okienko otvorené");
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
        j.over(spat.vidno && !spat.hotova && spat.vy === "Áno alebo nie" && !spat.anoZablok && !spat.nieZablok && !spat.viacZablok && !spat.prenos && !spat.oknoOtvorene, `karta po Späť má byť nezodpovedaná a odblokovaná: ${JSON.stringify(spat)}`);
        j.over(!auto.chyby.length, "chyby 1V po Späť: " + auto.chyby.join("; "));
        j.over((await kluc(t)) === null, "kľúč prenosu po Späť nezmazaný");
        return { info: `${P.id} -> ${cielId} (${t.mobil ? "Áno v okienku" : "Áno v dlaždici"}): vzor, auto, farba ${farba} prenesené, otvorený krok 4 bez predvoľby; príplatok + ${n} € = ${cenaDvoj} − ${cenaJedno}; odporúčaná ${cv.odp ? cv.odp + " € = " + odpDvoj + " − " + odpJedno : "neukázaná (" + P.id + " bez bežnej ceny, rámik " + odpJedno + ")"}; POST = baseline ${cielId} (${cena.spolu} €); Späť vráti auto aj farbu`, post: post.body };
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
