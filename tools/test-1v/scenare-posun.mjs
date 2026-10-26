// Scenáre posunu stránky po dokončení kroku — Michal 24. 10. 2026: „vždy keď nejaký krok skončím … aby ten daný krok,
// ktorý sa otvorí, vyroloval nastred“. Kód: assets/js/components/konfigurator1v/posun.js (posunNaStred) + volania
// v kroky.js, druha-vrstva.js, komplet-ponuka.js, vzorky-produkt.js. Tvar scenára: tools/test-1v/scenare-jedno.mjs.
//
//   posun-nastred       po „Pokračujte ďalej“, po odpovedi, ktorá kartu zatvorí a otvorí ďalšiu („Nie, ďakujem“
//                       v ponuke druhej vrstvy / setu), a po „Pokračujte k súhrnu“: počká, kým posun dobehne (poloha
//                       stránky aj prvku stojí ~0,8 s), a overí, že stred novo otvoreného kroku (súhrnu) je v strede
//                       viditeľnej plochy ± 40 px. Viditeľná plocha = okno mínus pevná / lepivá hlavička webu — test ju
//                       meria SÁM (prvky position fixed/sticky pri vrchu okna cez celú šírku), nie kódom webu. Krok vyšší
//                       ako plocha (auto na telefóne): vrch kroku 0–30 px pod hlavičkou (nadpis vidieť). Stránka na
//                       začiatku / konci (posun ďalej nejde) je v poriadku len vtedy, keď by krok potreboval ísť ďalej
//                       tým smerom. Posun dlhší ako 150 px musí byť plynulý (aspoň 4 rôzne polohy stránky po kliku).
//                       jedno: vzor -> auto -> farba -> karta druhej vrstvy -> Nie -> rozloženie -> kufor; boxy
//                         (hlavičkou) -> súhrn · dvoj: … farba -> farba 2. vrstvy -> rozloženie … · rohož: vzor -> auto
//                         -> ponuka setu (ak je) -> Nie -> farba -> súhrn · box: karta boxov -> ponuka setu (ak je) -> Nie
//                         -> súhrn · vzorky: krok 1 -> 2 -> 3 -> 4 -> súhrn. Bez košíka: POST 0.
//   posun-bez-animacie  to isté s prefers-reduced-motion: reduce (CDP Emulation.setEmulatedMedia): poloha rovnaká, ale
//                       skokom — po kliku najviac 2 rôzne polohy stránky (skok + prípadné dorovnanie), žiadna animácia.
//   posun-po-chybe      „Pokračujte ďalej“ do 3 s po neúspešnom pokuse: živá validácia nechá kroku .lcd-needs-fill 3 s
//                       aj po doplnení — úspešný druhý klik sa aj tak musí posunúť (nález recenzie 24. 10. 2026: stránka
//                       stála, nadpis nového kroku nad oknom). Auto bez Typu karosérie -> neprejde (rám, otvorené len
//                       auto) -> Typ -> znova (~1,6–2,5 s po chybe; trieda pri kliku ešte musí byť) -> Farba (rohož:
//                       ponuka setu alebo Farba) v strede. jedno / dvoj aj Farba bez vzorky -> vzorka -> znova -> karta
//                       druhej vrstvy / Farba 2. vrstvy v strede. Bez košíka: POST 0.
//   posun-dvojklik      dvojklik (telefón: dvojité ťuknutie, CDP dotyk) na „Pokračujte ďalej“ — druhé stlačenie ~120 ms
//                       po prvom na tom istom mieste nesmie posun zrušiť (nález recenzie 24. 10. 2026: posun čakal na
//                       ustálené rozloženie, druhý mousedown / touchstart ho zabil, stránka stála a nadpis nového kroku
//                       bol nad oknom). Druhé stlačenie často trafí hlavičku / „Pokračujte“ nižšieho kroku, ktorú
//                       zbalený krok vytiahol pod kurzor — nesmie iný krok otvoriť (posun.js ten klik zahodí; v info
//                       [detail] kliku: 2 = prehliadač ho označil za dvojklik). Tlačidlo vo Vzore
//                       pri vrchu okna (20 % výšky) -> Auto v strede (telefón: vrch pod hlavičkou); jedno / dvoj aj
//                       Auto -> Farba (tlačidlo v strede okna). Vzorky: krok 1 (pri vrchu) -> 2, krok 2 (v strede) -> 3.
//                       Odstup stlačení test meria v stránke (≥ 450 ms = pomalý beh, nie dvojklik -> zlyhá s touto
//                       hláškou); v info aj čo ktoré stlačenie trafilo. Rohože bez druhého prechodu: druhé stlačenie by
//                       mohlo trafiť „Áno“ v ponuke setu (prechod na iný produkt) — to overuje posun-dvojtuk-prechod.
//                       Bez košíka: POST 0.
//   posun-dvojtuk-prechod  dvojité ťuknutie ako iPhone (prvé dotyk / klik, druhé dôveryhodný klik s detail 1 na tom
//                       istom mieste — iPhone ho za dvojklik neoznačí, CDP dotyk áno) na „Pokračujte“, ktoré otvorí kartu
//                       s plochou „Áno“ = prechod na iný produkt: jedno Farba -> druhá vrstva (celá dlaždica), rohož Auto
//                       -> ponuka setu, box karta boxov -> ponuka setu (celý banner). Posun ťahá kartu popod prst
//                       (tlačidlo v 60 % výšky okna) — nález recenzie 24. 10. 2026: stráž chránila len tlačidlá Áno,
//                       ťuknutie na text dlaždice / banneru odviedlo 619 na set a 598 na 601. Odstupy 120 / 200 / 260 /
//                       320 ms: bez prechodu, karta otvorená, nezodpovedaná, v strede (± 40 px, vysoká vrchom 0–30 px pod
//                       hlavičkou); posledný 400 ms: len bez prechodu (po 350 ms smie prejsť „Nie“ / hlavička). Odstup
//                       ≥ 480 ms = pomalý beh (stráž platí 500 ms) -> zlyhá s touto hláškou. Okno chatu (Luxia) skryté.
//                       Bez košíka: POST 0.
//   Odolnosť posunu (25. 10. 2026, Michal pri kamiónoch: „nie vždy zafunguje“; tri príčiny zrušenia v posun.js) — jeden
//   prechod typu (jedno / dvoj / rohože: vzor -> auto; box: karta boxov -> ponuka setu alebo súhrn; vzorky: krok 1 -> 2),
//   tlačidlo pri vrchu okna (20 % výšky -> dlhý posun), poloha ako posun-nastred. So starým posun.js zlyhajú (overené
//   cez --zdroj 7a2cbc5 / 4849e58; posun-prst-svih prejde aj so starým — stráži, že švihnutie posun ruší), s novým
//   prejdú. Test sleduje život posun.js (jeho poslucháč kolieska od zavolania po koniec). Pomalý beh = porucha nenastala
//   tak, ako má (vstup spracovaný až po konci posunu, prekreslenie / prerušenie neskoro): nový pokus s upozornením,
//   najviac 3, potom zlyhá s hláškou „neoveril“ — skutočná chyba posunu (porucha nastala, posun aj tak zlyhal) hneď:
//   posun-prekreslenie  cieľ (novo otvorený krok / karta / súhrn) sa počas čakania na ustálené rozloženie prekreslí
//                       (klon namiesto uzla 30 ms po kliku — ako render po ďalšom ťuknutí) a pri druhom stlačení
//                       (~120 ms, dvojklik) znova: posun prvok nájde znova a dobehne (predtým isConnected -> koniec).
//   posun-koliesko-dobeh  po kliku 8 udalostí kolieska do 400 ms (deltaY 16 -> 2, čas vstupu podľa plánu) — dobeh
//                       touchpadu / zotrvačnosť: posun nezruší, prerušený posun sa dorovná (predtým wheel = koniec).
//                       Overené, len keď aspoň jedno koliesko spracovala stránka POČAS posunu. Posun skončil na svojom
//                       cieli a stránku potom odsunulo koliesko spracované až PO konci posunu (Chrome pod záťažou ho
//                       doručí o sekundy neskôr) = artefakt testu -> pomalý beh, nový pokus; posun skončil mimo cieľa
//                       = skutočná chyba. Stránka počas scenára stále kreslí snímky (requestAnimationFrame) — koliesko
//                       a ťah prsta Chrome doručuje so snímkou a tichá stránka bez okna ich inak drží sekundy.
//   posun-prerusenie    plynulý posun posun.js sa preruší (skok „instant“ o 2 px späť — ako iný posun / ukotvenie), keď
//                       do jeho cieľa ostáva aspoň 60 px (viac než tolerancia): stránka stojí mimo cieľa bez vstupu
//                       zákazníka -> dorovnať (predtým „posunul niekto iný“ -> nechať).
//   posun-prerusenie-klik  to isté a 200 ms po kliku ešte klik (detail 1, ako druhé ťuknutie na iPhone) na obyčajný
//                       obsah pri okraji okna: stráž ho pustí, dorovnanie aj tak musí prebehnúť (nález recenzie 25. 10.:
//                       každý pustený klik vypol dorovnanie; teraz len klik na ovládač / odkaz / tlačidlo / pole).
//   posun-prst-chvenie  telefón: ťuknutie na „Pokračujte“ a o 60 ms druhý dotyk, ktorý sa pohne o 24 px (chvenie, viac
//                       než 10 px, menej než 40 px; potom pokoj, bez švihu) ešte pred plynulým posunom: posun nezruší
//                       (predtým ťah > 10 px = koniec; chvenie až počas plynulého posunu by prehliadač dobehol aj tak).
//   posun-prst-svih     telefón: ťuknutie a o 100 ms švihnutie prstom o 90 px: posun sa zruší — posun.js skončí do 0,4 s
//                       po ťahu > 40 px a potom už plynulo neposúva (poloha stránky je vec zákazníka, neoveruje sa).
//                       Stráži druhú stranu pravidla TAH (aj starý posun.js prejde). PC: preskočené (dotyk len na telefóne).
// Hlavička kroku (ručné otvorenie) drží kliknutú hlavičku na mieste — tu sa neoveruje (posun len po dokončení kroku).
import { F } from "./stary-ui.mjs";

/** Tolerancia stredu (px) a pásmo vrchu vysokého kroku pod hlavičkou (px). */
const TOL = 40, HORE_MAX = 30, MEDZERA = 12;

// v stránke: n-tý prvok podľa selektora -> poloha voči oknu + hlavička webu (nezávisle od kódu webu) + poloha stránky
// + polohy stránky od posledného stlačenia myši (záznam ZAZNAM: plynulý posun = veľa polôh, skok = jedna)
const MER = `(function (sel, index) {
  var e = document.querySelectorAll(sel)[index || 0];
  if (!e || !e.getClientRects().length) return null;
  var hH = 0;
  [8, Math.round(innerWidth / 2), innerWidth - 8].forEach(function (x) {
    (document.elementsFromPoint(x, 1) || []).forEach(function (p) {
      for (var q = p; q && q !== document.body && q !== document.documentElement; q = q.parentElement) {
        var c = getComputedStyle(q);
        if (c.position !== "fixed" && c.position !== "sticky") continue;
        var r = q.getBoundingClientRect();
        if (r.top <= 1 && r.bottom > 0 && r.height < innerHeight / 2 && r.width >= innerWidth * 0.6) hH = Math.max(hH, r.bottom);
      }
    });
  });
  var b = e.getBoundingClientRect(), se = document.scrollingElement || document.documentElement, z = window.__lcdPosunTest;
  var polohy = z ? z.y.filter(function (x) { return x[0] > z.t0; }).map(function (x) { return x[1]; }) : [];
  return { top: Math.round(b.top), h: Math.round(b.height), hH: Math.round(hH), vh: innerHeight, y: Math.round(scrollY), max: Math.max(0, se.scrollHeight - innerHeight),
    y0: z ? z.y0 : null, polohy: polohy.filter(function (y, i) { return i === 0 || y !== polohy[i - 1]; }).length };
})`;
/** Záznam polôh stránky (scroll), čas posledného stlačenia myši a či vtedy na stránke bola .lcd-needs-fill (živá
 *  validácia) — inštaluje sa po načítaní stránky. */
const ZAZNAM = `(function () {
  if (window.__lcdPosunTest) return true;
  var z = window.__lcdPosunTest = { t0: 0, y0: 0, y: [], chyba: false };
  window.addEventListener("mousedown", function () { z.t0 = performance.now(); z.y0 = Math.round(scrollY); z.y = []; z.chyba = !!document.querySelector(".lcd-needs-fill"); }, true);
  window.addEventListener("scroll", function () { z.y.push([performance.now(), Math.round(scrollY)]); }, { passive: true });
  return true;
})()`;

/** Počká, kým posun dobehne: poloha stránky aj prvku 8 meraní po sebe (~0,8 s) rovnaká, najviac 7 s. */
async function ustalene(t, sel, index = 0) {
  const koniec = Date.now() + 7000;
  let pred = null, n = 0, m = null;
  while (Date.now() < koniec) {
    m = await t.ev(MER + "(" + JSON.stringify(sel) + "," + index + ")");
    const k = m ? [m.y, m.top, m.h, m.hH].join(":") : null;
    n = k && k === pred ? n + 1 : 0;
    pred = k;
    if (n >= 8) return m;
    await t.pauza(100);
  }
  return m;
}

/** Vyhodnotenie polohy -> { ok, text }. */
function vyhodnot(m) {
  if (!m) return { ok: false, text: "prvok nie je na stránke / je skrytý" };
  const plocha = m.vh - m.hH;
  const hore = m.y <= 1, dole = m.y >= m.max - 1;
  if (m.h + 2 * MEDZERA > plocha) {
    const od = m.top - m.hH;
    const ok = (od >= 0 && od <= HORE_MAX) || (dole && od > HORE_MAX) || (hore && od < 0);
    return { ok, text: `vysoký (${m.h} px > plocha ${plocha} px): vrch ${od} px pod hlavičkou (${m.hH} px)` + (hore ? ", stránka hore" : dole ? ", stránka dole" : "") };
  }
  const d = Math.round(m.top + m.h / 2 - (m.hH + plocha / 2));
  const ok = Math.abs(d) <= TOL || (dole && d > TOL) || (hore && d < -TOL);
  return { ok, text: `stred ${d >= 0 ? "+" : ""}${d} px od stredu plochy (výška ${m.h}, plocha ${plocha}, hlavička ${m.hH})` + (hore ? ", stránka hore" : dole ? ", stránka dole" : "") };
}

/** Kontrola jedného prechodu (poloha + plynulosť / skok) a zoznam výsledkov. */
function kontrola(t, j, { bezAnimacie }) {
  const vysl = [];
  return {
    vysl,
    async over(popis, sel, index = 0) {
      const m = await ustalene(t, sel, index);
      const v = vyhodnot(m);
      j.over(v.ok, `${popis}: krok nie je v strede viditeľnej plochy — ${v.text} ${JSON.stringify(m)}`);
      const dlzka = m && m.y0 != null ? Math.abs(m.y - m.y0) : 0;
      if (bezAnimacie) j.over(m.polohy <= 2, `${popis}: prefers-reduced-motion: reduce, ale posun o ${dlzka} px bol animovaný (${m.polohy} polôh stránky)`);
      else if (dlzka > 150) j.over(m.polohy >= 4, `${popis}: posun o ${dlzka} px nebol plynulý (${m.polohy} polôh stránky)`);
      vysl.push(popis + " " + v.text.replace(/ \(.*?\)/, "") + (dlzka ? ` (posun ${dlzka} px, ${m.polohy} polôh)` : ""));
    },
    /** Súhrn od vrchu (Michal 26. 10. 2026): prvá viditeľná karta 0–30 px pod hlavičkou (alebo stránka na konci). */
    async overSuhrn(popis) {
      const sel = `${F} .lcd1v-krok`;
      const i = await t.ev(`Array.prototype.findIndex.call(document.querySelectorAll(${JSON.stringify(sel)}), function (e) { return e.offsetHeight > 0; })`);
      const m = await ustalene(t, sel, Math.max(0, i));
      const od = m ? m.top - m.hH : null, dole = m && m.y >= m.max - 1;
      const ok = !!m && ((od >= 0 && od <= HORE_MAX) || (dole && od > HORE_MAX));
      j.over(ok, `${popis}: prvá karta súhrnu nie je hore pod hlavičkou — vrch ${od} px pod hlavičkou ${JSON.stringify(m)}`);
      vysl.push(popis + ` vrch ${od} px pod hlavičkou` + (dole ? ", stránka dole" : ""));
    },
  };
}

const krok = (m) => `${F} .lcd1v-krok.lcd1v-k-${m}`;
const otvoreny = (m) => `!!document.querySelector(${JSON.stringify(krok(m) + ".active")})`;
const ZIADNY_OTVORENY = `!document.querySelector("${F} .lcd1v-krok.active")`;

/** Klik na „Pokračujte ďalej“ / „Pokračujte k súhrnu“ karty `m` (karta musí byť otvorená). */
async function dalej(t, m, popis) {
  await t.klikni(`${krok(m)} > .next-step-button`, { popis: popis || "Pokračujte ďalej (" + m + ")" });
}

/** Karta ponuky setu (komplet-ponuka.js) pripravená: viditeľná, banner s cenou (GET jednovrstvových) -> true / false. */
async function ponukaPripravena(t) {
  return t.cakaj(`(function () { var k = document.querySelector("${F} .lcd1v-komplet"); var c = k && k.querySelector(".lcd1v-bs__c");
    return !!(k && !k.hidden && k.offsetHeight > 30 && c && c.textContent.trim()); })()`, { ms: 30000, popis: "karta ponuky setu" }).then(() => true, () => false);
}

/** Všetky prechody typu (popis hore) s kontrolou polohy po každom. */
async function prechody(s, a, ovl, j, { bezAnimacie = false } = {}) {
  if (!a.novy) return { preskoc: "len nový vzhľad (?novy=1)" };
  const t = s.t, typ = a.produkt.typ;
  const { otvorKartu } = await import("./ovladac-kroky.mjs");
  const k = kontrola(t, j, { bezAnimacie });
  if (bezAnimacie) await s.k.posli("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await j.otvor(s, a.url, { novy: true });
  if (bezAnimacie) j.over(await t.ev(`matchMedia("(prefers-reduced-motion: reduce)").matches`), "emulácia prefers-reduced-motion: reduce nezabrala");
  await t.ev(ZAZNAM);

  if (typ === "vzorky") {
    const KROK = `${F} .lcd1v-vz-kroky > .lcd1v-vz-krok`;
    const n = await t.ev(`document.querySelectorAll(${JSON.stringify(KROK)}).length`);
    j.over(n >= 2, "vzorkovník: kroky " + n);
    for (let i = 0; i < n; i++) {
      await t.cakaj(`document.querySelectorAll(${JSON.stringify(KROK)})[${i}].classList.contains("active")`, { ms: 8000, popis: "otvorený krok " + (i + 1) });
      await t.klikni(`${KROK}.active .lcd1v-vz-dalej`, { popis: i < n - 1 ? "Pokračujte ďalej (krok " + (i + 1) + ")" : "Pokračujte k súhrnu" });
      if (i < n - 1) {
        await t.cakaj(`document.querySelectorAll(${JSON.stringify(KROK)})[${i + 1}].classList.contains("active")`, { ms: 8000, popis: "otvorený krok " + (i + 2) });
        await k.over("krok " + (i + 2), KROK, i + 1);
      } else {
        await t.cakaj(`!document.querySelector(${JSON.stringify(KROK + ".active")})`, { ms: 8000, popis: "kroky zatvorené po „Pokračujte k súhrnu“" });
        await k.over("súhrn", `${F} .lcd1v-vz-suhrn`);
      }
    }
  } else if (typ === "boxy") {
    await j.zaklad(s, ovl, {}); // farba + 1 box M
    const ponuka = await ponukaPripravena(t);
    if (!ponuka) s.upozornenia.push("karta ponuky setu sa do 30 s neukázala — overený len prechod na súhrn");
    await dalej(t, "farba", "Pokračujte k súhrnu (karta boxov)");
    await t.cakaj(`!!document.querySelector("${F} .lcd1v-komplet.active") || ${ZIADNY_OTVORENY}`, { ms: 8000, popis: "ponuka setu alebo súhrn" });
    if (await t.ev(`!!document.querySelector("${F} .lcd1v-komplet.active")`)) {
      await k.over("ponuka setu", `${F} .lcd1v-komplet.active`);
      await t.klikni(`${F} .lcd1v-komplet.active .lcd1v-komplet__nie`, { popis: "Nie, ďakujem (ponuka setu)" });
      await t.cakaj(`!document.querySelector("${F} .lcd1v-komplet.active")`, { ms: 8000, popis: "ponuka zbalená" });
    }
    await k.overSuhrn("súhrn");
  } else {
    // karty s autom: vzor -> auto (na telefóne vyšší ako plocha -> vrch pod hlavičku)
    await otvorKartu(t, "vzor");
    await dalej(t, "vzor");
    await t.cakaj(otvoreny("auto"), { ms: 8000, popis: "otvorená karta auta" });
    await k.over("auto", krok("auto"));
    await ovl.kroky.vyberAuto(t, j.AUTO);
    if (/^kufor-/.test(typ)) {
      // rohož: „Pokračujte ďalej“ v Aute otvorí ponuku setu (ak je pripravená), „Nie, ďakujem“ -> Farba
      const ponuka = await ponukaPripravena(t);
      if (!ponuka) s.upozornenia.push("karta ponuky setu sa do 30 s neukázala — overený len prechod auto -> farba");
      await dalej(t, "auto");
      await t.cakaj(`!!document.querySelector("${F} .lcd1v-komplet.active") || ${otvoreny("farba")}`, { ms: 8000, popis: "ponuka setu alebo farba" });
      if (await t.ev(`!!document.querySelector("${F} .lcd1v-komplet.active")`)) {
        await k.over("ponuka setu", `${F} .lcd1v-komplet.active`);
        await t.klikni(`${F} .lcd1v-komplet.active .lcd1v-komplet__nie`, { popis: "Nie, ďakujem (ponuka setu)" });
        await t.cakaj(otvoreny("farba"), { ms: 8000, popis: "otvorená Farba po „Nie, ďakujem“" });
      }
      await k.over("farba", krok("farba"));
      await ovl.kroky.vyberFarbu(t, { index: 1 });
      await dalej(t, "farba", "Pokračujte k súhrnu (farba)");
    } else {
      await dalej(t, "auto");
      await t.cakaj(otvoreny("farba"), { ms: 8000, popis: "otvorená karta farby" });
      await k.over("farba", krok("farba"));
      await ovl.kroky.vyberFarbu(t, { index: 1 });
      await dalej(t, "farba");
      if (typ === "jedno") {
        // ponuka druhej vrstvy (druha-vrstva.js) -> „Nie, ďakujem“ zatvorí kartu a otvorí Rozloženie
        await t.cakaj(`!!document.querySelector("${F} .lcd1v-druha.active")`, { ms: 8000, popis: "otvorená karta druhej vrstvy" });
        await k.over("druhá vrstva", `${F} .lcd1v-druha.active`);
        await t.klikni(`${F} .lcd1v-druha.active .lcd1v-druha__nie`, { popis: "Nie, ďakujem (druhá vrstva)" });
      } else {
        await t.cakaj(otvoreny("farba2"), { ms: 8000, popis: "otvorená karta farby 2. vrstvy" });
        await k.over("farba 2. vrstvy", krok("farba2"));
        await ovl.farba2.vyberFarbu2(t, { index: 0 });
        await dalej(t, "farba2");
      }
      await t.cakaj(otvoreny("rozlozenie"), { ms: 8000, popis: "otvorená karta rozloženia" });
      await k.over("rozloženie", krok("rozlozenie"));
      await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
      await dalej(t, "rozlozenie");
      await t.cakaj(otvoreny("kufor"), { ms: 8000, popis: "otvorená karta kufra" });
      await k.over("kufor", krok("kufor"));
      await otvorKartu(t, "boxy"); // ručne hlavičkou (to sa neoveruje)
      await dalej(t, "boxy", "Pokračujte k súhrnu (boxy)");
    }
    await t.cakaj(ZIADNY_OTVORENY, { ms: 8000, popis: "kroky zatvorené po „Pokračujte k súhrnu“" });
    await k.overSuhrn("súhrn");
  }
  j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
  return { info: (bezAnimacie ? "bez animácie: " : "") + k.vysl.join("; ") };
}

/** Neúspešné „Pokračujte ďalej“ karty `m` (živá validácia: .lcd-needs-fill na karte) -> čas kliku v stránke (ms). */
async function neprejde(t, m, popis) {
  await dalej(t, m, popis);
  await t.cakaj(`!!document.querySelector(${JSON.stringify(krok(m) + ".lcd-needs-fill")})`, { ms: 2500, popis: "červený rám karty " + m + " (.lcd-needs-fill)" });
  return t.ev(`window.__lcdPosunTest.t0`);
}

/** „Pokračujte ďalej“ karty `m` po doplnení: až po overovacom posune enginu (configuratorEngine.js lcdScrollToStep, so
 *  slučkou a korekciou do ~1,5 s po chybe), ale kým .lcd-needs-fill ešte drží (3 s) — inak by test opravu neoveril. */
async function prejdePoChybe(t, j, m, tChyba, popis) {
  const cakat = await t.ev(`Math.max(0, ${tChyba} + 1600 - performance.now())`);
  if (cakat > 0) await t.pauza(Math.ceil(cakat));
  await dalej(t, m, popis);
  const z = await t.ev(`(function () { var z = window.__lcdPosunTest; return { chyba: z.chyba, ms: Math.round(z.t0 - ${tChyba}) }; })()`);
  j.over(z.chyba, `${popis}: pri kliku už .lcd-needs-fill nebola (${z.ms} ms po chybe) — scenár opravu neoveril (pomalý beh?)`);
  return z.ms;
}

/** posun-po-chybe (popis hore). */
async function poChybe(s, a, ovl, j) {
  if (!a.novy) return { preskoc: "len nový vzhľad (?novy=1)" };
  const t = s.t, typ = a.produkt.typ, A = j.AUTO;
  const { otvorKartu } = await import("./ovladac-kroky.mjs");
  const k = kontrola(t, j, { bezAnimacie: false });
  const ms = [];
  await j.otvor(s, a.url, { novy: true });
  await t.ev(ZAZNAM);
  await otvorKartu(t, "vzor");
  await dalej(t, "vzor");
  await t.cakaj(otvoreny("auto"), { ms: 8000, popis: "otvorená karta auta" });

  // auto bez Typu karosérie -> neprejde; Typ doplniť a znova, kým trieda drží
  const w = `${krok("auto")} .modl-selector-wrap`;
  await t.cakaj(`(function () { var s = document.querySelector("${w} .lcd1v-pole.brands select"); return !!(s && s.getBoundingClientRect().height > 30); })()`, { popis: "viditeľné pole Značka" });
  await t.nastavSelect(`${w} .brands select`, A.znacka);
  await t.cakaj(`document.querySelector("${w} .models select").options.length > 1`, { popis: "zoznam modelov" });
  await t.nastavSelect(`${w} .models select`, A.model);
  await t.nastavSelect(`${w} .years select`, A.rok);
  await t.cakaj(`Array.prototype.some.call(document.querySelector("${w} .type-selector select").options, function (o) { return o.text.trim() === ${JSON.stringify(A.typ)}; })`, { ms: 15000, popis: "Typ karosérie v zozname" });
  const tAuto = await neprejde(t, "auto", "Pokračujte ďalej bez Typu karosérie");
  j.over(await t.ev(`${otvoreny("auto")} && !${otvoreny("farba")}`), "neúspešné „Pokračujte ďalej“ v aute: otvorená má ostať len karta auta");
  await t.nastavSelect(`${w} .type-selector select`, A.typ);
  ms.push(await prejdePoChybe(t, j, "auto", tAuto, "Pokračujte ďalej po doplnení Typu"));

  if (/^kufor-/.test(typ)) {
    // rohož: ponuka setu (komplet-ponuka.js, ak je pripravená) alebo Farba (kroky.js — opravená cesta)
    await t.cakaj(`!!document.querySelector("${F} .lcd1v-komplet.active") || ${otvoreny("farba")}`, { ms: 8000, popis: "ponuka setu alebo farba" });
    if (await t.ev(`!!document.querySelector("${F} .lcd1v-komplet.active")`)) await k.over("ponuka setu po chybe", `${F} .lcd1v-komplet.active`);
    else await k.over("farba po chybe", krok("farba"));
  } else {
    await t.cakaj(otvoreny("farba"), { ms: 8000, popis: "otvorená karta farby" });
    await k.over("farba po chybe", krok("farba"));
    // Farba bez vzorky -> neprejde (chybný je sám otvorený krok); vzorka a znova, kým trieda drží
    const tFarba = await neprejde(t, "farba", "Pokračujte ďalej bez farby");
    await t.klikni(`${krok("farba")} > .options-wrap > .option-button`, { index: 1, popis: "vzorka farby 1" });
    ms.push(await prejdePoChybe(t, j, "farba", tFarba, "Pokračujte ďalej po výbere farby"));
    if (typ === "jedno") {
      await t.cakaj(`!!document.querySelector("${F} .lcd1v-druha.active")`, { ms: 8000, popis: "otvorená karta druhej vrstvy" });
      await k.over("druhá vrstva po chybe", `${F} .lcd1v-druha.active`);
    } else {
      await t.cakaj(otvoreny("farba2"), { ms: 8000, popis: "otvorená karta farby 2. vrstvy" });
      await k.over("farba 2. vrstvy po chybe", krok("farba2"));
    }
  }
  j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
  return { info: k.vysl.join("; ") + " (druhý klik " + ms.join(" / ") + " ms po chybe)" };
}

// v stránke: prvok podľa selektora posunúť stredom do výšky `cast` okna (0,2 = pri vrchu), počkať 400 ms -> bod kliku;
// mimo okna / zakrytý = chyba (ako t.klikni)
const BOD = `(async function (sel, cast) {
  var el = document.querySelector(sel);
  if (!el || !el.getClientRects().length) return { chyba: "prvok nenájdený / skrytý: " + sel };
  var r = el.getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, window.pageYOffset + r.top + r.height / 2 - innerHeight * cast), behavior: "instant" });
  await new Promise(function (z) { setTimeout(z, 400); });
  r = el.getBoundingClientRect();
  var x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
  if (r.width < 2 || r.height < 2 || y < 0 || y > innerHeight) return { chyba: "prvok mimo okna" };
  var h = document.elementFromPoint(x, y);
  if (!h || !(h === el || el.contains(h))) {
    var hr = h && h.getBoundingClientRect();
    return { chyba: "zakryté: " + (h ? h.tagName.toLowerCase() + (typeof h.className === "string" ? "." + h.className.split(" ")[0] : "")
      + (h.tagName === "IFRAME" ? " " + String(h.src || h.id || "").slice(0, 70) + " " + [hr.left, hr.top, hr.width, hr.height].map(Math.round).join("/") : "") : "nič") + " v bode " + x + "," + y };
  }
  return { x: x, y: y };
})`;
/** Záznam časov stlačení (mousedown na PC, touchstart na telefóne) — odstup dvojkliku meraný v stránke — a čo ktorý
 *  klik trafil (karta + hlavička / ďalej / obsah). */
const STLACENIA = (u) => `(function () {
  if (!window.__lcdDvoj) {
    var z = window.__lcdDvoj = { t: [], ciele: [] };
    window.addEventListener(${JSON.stringify(u)}, function () { z.t.push(performance.now()); }, true);
    window.addEventListener("click", function (e) {
      var c = e.target, k = c && c.closest && c.closest(".lcd1v-krok");
      var m = k && (k.className.match(/lcd1v-k-[a-z0-9-]+|lcd1v-vz-krok|lcd1v-komplet|lcd1v-druha/) || ["krok"])[0];
      if (m === "lcd1v-vz-krok") m = "krok " + (Array.prototype.indexOf.call(k.parentNode.querySelectorAll(":scope > .lcd1v-vz-krok"), k) + 1);
      z.ciele.push((k ? m.replace("lcd1v-k-", "") + (c.closest(".lcd1v-krok > .order, .lcd1v-krok > .lcd1v-hd") ? " hlavička" : c.closest(".next-step-button, .lcd1v-vz-dalej") ? " ďalej" : " obsah") : (c && c.tagName || "?").toLowerCase()) + " [" + e.detail + "]");
    }, true);
  }
  window.__lcdDvoj.t.length = 0;
  window.__lcdDvoj.ciele.length = 0;
  return true;
})()`;
/** Dvojklik / dvojité ťuknutie ako zákazník (popis hore) -> odstup stlačení v stránke (ms). */
async function dvojklik(s, j, sel, { cast = 0.5, medzera = 120, popis } = {}) {
  const t = s.t, k = s.k;
  let b = null;
  for (let pokus = 0; pokus < 3; pokus++) {
    if (pokus) await t.pauza(400); // krok sa ešte rozbaľuje / prvok sa ešte kreslí
    b = await t.ev(BOD + "(" + JSON.stringify(sel) + "," + cast + ")");
    if (!b.chyba) break;
  }
  if (b.chyba) throw new Error(popis + ": " + b.chyba);
  await t.ev(STLACENIA(t.mobil ? "touchstart" : "mousedown"));
  const { x, y } = b;
  // príkazy CDP bez čakania na odpoveď medzi stlačeniami (odpoveď prichádza až po spracovaní v stránke — pod záťažou
  // by odstup narástol nad dvojklik); prehliadač ich spracuje v poradí
  const posli = [];
  if (t.mobil) {
    const tp = [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    for (let i = 0; i < 2; i++) {
      if (i) await t.pauza(medzera);
      posli.push(k.posli("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp }));
      await t.pauza(30);
      posli.push(k.posli("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }));
    }
  } else {
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }));
    for (let i = 1; i <= 2; i++) {
      if (i > 1) await t.pauza(medzera);
      posli.push(k.posli("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: i }));
      posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: i }));
    }
  }
  await Promise.all(posli);
  const z = await t.ev(`(function () { var d = window.__lcdDvoj; return { ms: d.t.length >= 2 ? Math.round(d.t[1] - d.t[0]) : -1, ciele: d.ciele.slice() }; })()`);
  j.over(z.ms >= 0 && z.ms < 450, `${popis}: odstup stlačení ${z.ms} ms — nie je to dvojklik (pomalý beh?), scenár opravu neoveril`);
  return z.ms + " ms (" + z.ciele.join(" + ") + ")";
}

/** posun-dvojklik (popis hore). Po dvojkliku čaká na otvorenú kartu; ak sa neotvorí, hláška povie, čo kliky trafili. */
async function dvojkliky(s, a, ovl, j) {
  if (!a.novy) return { preskoc: "len nový vzhľad (?novy=1)" };
  const t = s.t, typ = a.produkt.typ;
  const k = kontrola(t, j, { bezAnimacie: false });
  const ms = [];
  async function prechod(sel, cast, popis, otvorena, meno, overSel, index = 0) {
    const r = await dvojklik(s, j, sel, { cast, popis: "dvojklik " + popis });
    ms.push(r);
    await t.cakaj(otvorena, { ms: 8000, popis: "otvorená " + meno + " po dvojkliku " + r });
    await k.over(meno + " po dvojkliku", overSel, index);
  }
  await j.otvor(s, a.url, { novy: true });
  await t.ev(ZAZNAM);
  if (typ === "vzorky") {
    const KROK = `${F} .lcd1v-vz-kroky > .lcd1v-vz-krok`;
    const aktivny = (i) => `(function () { var e = document.querySelectorAll(${JSON.stringify(KROK)})[${i}]; return !!(e && e.classList.contains("active")); })()`;
    await t.cakaj(aktivny(0), { ms: 8000, popis: "otvorený krok 1" });
    await prechod(`${KROK}.active .lcd1v-vz-dalej`, 0.2, "Pokračujte ďalej (krok 1)", aktivny(1), "krok 2", KROK, 1);
    await prechod(`${KROK}.active .lcd1v-vz-dalej`, 0.5, "Pokračujte ďalej (krok 2)", aktivny(2), "krok 3", KROK, 2);
  } else {
    const { otvorKartu } = await import("./ovladac-kroky.mjs");
    await otvorKartu(t, "vzor");
    await prechod(`${krok("vzor")} > .next-step-button`, 0.2, "Pokračujte ďalej (vzor)", otvoreny("auto"), "auto", krok("auto"));
    if (typ === "jedno" || typ === "dvoj") {
      await ovl.kroky.vyberAuto(t, j.AUTO);
      await prechod(`${krok("auto")} > .next-step-button`, 0.5, "Pokračujte ďalej (auto)", otvoreny("farba"), "farba", krok("farba"));
    }
  }
  j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
  return { info: k.vysl.join("; ") + " (druhé stlačenie po prvom: " + ms.join(" / ") + ")" };
}

// v stránke: záznam dvojťuknutia — pointerup (čas, čo stlačenie trafilo: plocha prechodu na iný produkt = dlaždica druhej
// vrstvy / banner setu), mouseup (detail = počet klikov, ako ho určil prehliadač) a click (zahodený = defaultPrevented po
// dispatchi; info). Prvý klik môže zastaviť skorší poslucháč (komplet-ponuka.js na window) -> čas podľa pointerup. Čas =
// Event.timeStamp (čas vstupu — ten meria aj stráž posun.js), h = kedy ho stránka spracovala (info pri zaneprázdnenom vlákne).
const TUKY = `(function () {
  if (!window.__lcdTuk) {
    var z = window.__lcdTuk = { p: [], d: [], k: [] };
    var ciel = function (c) {
      c = c && c.closest ? c : null;
      return !c ? "?" : c.closest(".lcd1v-druha__ano, .lcd1v-komplet__ano") ? "tlačidlo Áno"
        : c.closest(".lcd1v-druha__dlazdica") ? "dlaždica mimo tlačidla" : c.closest(".lcd1v-komplet__bs") ? "banner mimo tlačidla"
        : c.closest(".lcd1v-druha__nie") ? "Nie" : c.closest(".lcd1v-krok > .order, .lcd1v-krok > .lcd1v-hd") ? "hlavička"
        : c.closest(".next-step-button") ? "Pokračujte" : c.closest(".lcd1v-krok") ? "obsah karty" : c.tagName.toLowerCase();
    };
    window.addEventListener("pointerup", function (e) { z.p.push({ t: e.timeStamp, h: performance.now(), ciel: ciel(e.target) }); }, true);
    window.addEventListener("mouseup", function (e) { z.d.push(e.detail); }, true);
    window.addEventListener("click", function (e) {
      var r = { t: e.timeStamp, zahodeny: null };
      z.k.push(r);
      setTimeout(function () { r.zahodeny = e.defaultPrevented; }, 0);
    }, true);
  }
  var z0 = window.__lcdTuk;
  z0.p.length = 0; z0.d.length = 0; z0.k.length = 0;
  return true;
})()`;
/** Prechod na iný produkt sa začal (Áno v karte druhej vrstvy / ponuky setu: správa o prenose, odchod o 450 ms). */
const PRENOS = `!!document.querySelector("${F} .lcd1v-druha--prenos, ${F} .lcd1v-komplet__prenos:not([hidden])")`;

/** Dvojité ťuknutie ako iPhone: prvé ťuknutie (telefón dotyk, PC klik), druhé o `ms` neskôr na tom istom mieste ako
 *  dôveryhodný klik s detail 1 (iPhone ho za dvojklik neoznačí) -> { ms: odstup klikov v stránke, ciel, zahodeny }. */
async function dvojtuk(s, sel, ms, popis) {
  const t = s.t, k = s.k;
  let b = null;
  for (let pokus = 0; pokus < 3; pokus++) {
    if (pokus) await t.pauza(400);
    b = await t.ev(BOD + "(" + JSON.stringify(sel) + ",0.6)"); // tlačidlo v 60 % výšky okna (posun ťahá obsah nahor popod prst)
    if (!b.chyba) break;
  }
  if (b.chyba) throw new Error(popis + ": " + b.chyba);
  await t.ev(TUKY);
  const { x, y } = b;
  const posli = [];
  // čas vstupu (CDP timestamp, s od 1970) = ako zákazník naozaj ťukol: CDP pošle ďalšiu udalosť až po potvrdení
  // predošlej stránkou, pri zaneprázdnenom vlákne by druhé ťuknutie inak vzniklo neskôr, než ho test chce (telefón
  // čas ťuknutia zapíše hneď a spracuje ho neskôr — to modeluje tento čas)
  const T = Date.now() / 1000 + 0.03, pri = (dms) => ({ timestamp: T + dms / 1000 });
  if (t.mobil) {
    posli.push(k.posli("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }], ...pri(-30) }));
    await t.pauza(30);
    posli.push(k.posli("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], ...pri(0) }));
  } else {
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }));
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1, ...pri(-30) }));
    await t.pauza(30);
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1, ...pri(0) }));
  }
  await t.pauza(ms);
  posli.push(k.posli("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1, ...pri(ms - 30) }));
  posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1, ...pri(ms) }));
  await Promise.all(posli);
  await t.pauza(50);
  const z = await t.ev(`(function () { var z = window.__lcdTuk, p = z.p, k = z.k.filter(function (x) { return p[1] && x.t >= p[1].t; })[0];
    return p.length >= 2 ? { ms: Math.round(p[1].t - p[0].t), neskor: Math.round(p[1].h - p[0].h - (p[1].t - p[0].t)), ciel: p[1].ciel, d: z.d[z.d.length - 1], zahodeny: k ? k.zahodeny : null }
      : { ms: -1, ciel: p.map(function (x) { return x.ciel; }).join(" + ") }; })()`);
  if (z.ms < 0) throw new Error(popis + ": stránka nezaznamenala dve stlačenia (" + z.ciel + ")");
  return z;
}

/** posun-dvojtuk-prechod: dvojité ťuknutie (iPhone: druhé ťuknutie = klik s detail 1) na „Pokračujte ďalej“ / „k súhrnu“,
 *  ktoré otvorí kartu s plochou prechodu na iný produkt (dlaždica druhej vrstvy, banner setu). Posun ťahá kartu popod
 *  prst — druhé ťuknutie do 500 ms nesmie odviesť na iný produkt (nález recenzie 24. 10. 2026: 619 → set, 598 → 601).
 *  Odstupy 120 / 200 / 260 / 320 ms: karta ostane otvorená, nezodpovedaná, v strede; posledný 400 ms: len bez prechodu
 *  (po 350 ms smie prejsť klik na iný ovládač, napr. „Nie“). Bez košíka: POST 0. */
async function dvojtukPrechod(s, a, ovl, j) {
  if (!a.novy) return { preskoc: "len nový vzhľad (?novy=1)" };
  const t = s.t, typ = a.produkt.typ;
  const { otvorKartu } = await import("./ovladac-kroky.mjs");
  const k = kontrola(t, j, { bezAnimacie: false });
  await j.otvor(s, a.url, { novy: true });
  await t.ev(ZAZNAM);
  // samo otvorené okno chatu (Luxia, 360 × 348 px dole) by po ~30 s zakrylo tlačidlo v 60 % výšky -> v scenári skryté
  await t.ev(`(function () { var st = document.createElement("style"); st.textContent = 'iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"] { visibility: hidden !important; pointer-events: none !important; }'; document.head.appendChild(st); return true; })()`);
  const url = await t.ev("location.href");
  let zdroj, karta, meno;
  if (typ === "boxy") {
    await j.zaklad(s, ovl, {}); // farba + 1 box M
    if (!(await ponukaPripravena(t))) return { preskoc: "karta ponuky setu sa do 30 s neukázala" };
    zdroj = "farba"; karta = `${F} .lcd1v-komplet`; meno = "ponuka setu";
  } else {
    await otvorKartu(t, "vzor");
    await dalej(t, "vzor");
    await t.cakaj(otvoreny("auto"), { ms: 8000, popis: "otvorená karta auta" });
    await ovl.kroky.vyberAuto(t, j.AUTO);
    if (/^kufor-/.test(typ)) {
      if (!(await ponukaPripravena(t))) return { preskoc: "karta ponuky setu sa do 30 s neukázala" };
      zdroj = "auto"; karta = `${F} .lcd1v-komplet`; meno = "ponuka setu";
    } else {
      await dalej(t, "auto");
      await t.cakaj(otvoreny("farba"), { ms: 8000, popis: "otvorená karta farby" });
      await ovl.kroky.vyberFarbu(t, { index: 1 });
      await t.cakaj(`(function () { var k = document.querySelector("${F} .lcd1v-druha"); return !!(k && !k.hidden && k.offsetHeight > 30); })()`, { ms: 10000, popis: "karta druhej vrstvy po výbere farby" });
      await t.cakaj(`!!document.querySelector("${F} .lcd1v-druha .lcd1v-druha__ano[data-lcd1v-priplatok]")`, { ms: 30000, popis: "príplatok na dlaždici druhej vrstvy" })
        .catch(() => s.upozornenia.push("príplatok druhej vrstvy sa do 30 s neukázal — dlaždica bez cien"));
      zdroj = "farba"; karta = `${F} .lcd1v-druha`; meno = "druhá vrstva";
    }
  }
  const otvorena = `(function () { var k = document.querySelector(${JSON.stringify(karta)}); return !!(k && k.classList.contains("active") && !k.classList.contains("lcd1v-hotovy")); })()`;
  const info = [];
  for (const ms of [120, 200, 260, 320, 400]) {
    await otvorKartu(t, zdroj); // ručne hlavičkou (karta sa zbalí); 500 ms ochrany predošlého posunu už uplynulo
    const z = await dvojtuk(s, `${krok(zdroj)} > .next-step-button`, ms, `dvojťuknutie ${ms} ms`);
    const popis = `${z.ms} ms: ${z.ciel}${z.d !== 1 ? " [detail " + z.d + "]" : ""}${z.zahodeny ? " (zahodený)" : ""}${Math.abs(z.neskor) > 50 ? " [spracované o " + z.neskor + " ms neskôr]" : ""}`;
    info.push(popis);
    j.over(z.d === 1, `dvojťuknutie ${ms} ms: druhý klik má detail ${z.d}, nie 1 — scenár iPhone neoveril`);
    j.over(z.ms < 480, `dvojťuknutie ${ms} ms: odstup ťuknutí ${z.ms} ms (${z.ciel}) — pomalý beh, stráž posun.js platí 500 ms, scenár neoveril`);
    j.over(!(await t.ev(PRENOS)), `dvojťuknutie (${popis}): druhé ťuknutie spustilo prechod na iný produkt`);
    await t.pauza(600); // Áno odchádza o 450 ms
    const tu = await t.ev("location.href").catch(() => "(stránka odišla)");
    j.over(tu === url, `dvojťuknutie (${popis}): stránka odišla na ${tu}`);
    if (z.ms >= 340) break; // po 350 ms smie prejsť klik na iný ovládač („Nie“, hlavička) — overený len neprechod
    await t.cakaj(otvorena, { ms: 8000, popis: `otvorená nezodpovedaná ${meno} po dvojťuknutí (${popis})` });
    await k.over(`${meno} po dvojťuknutí ${z.ms} ms`, karta);
  }
  j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
  return { info: k.vysl.join("; ") + " (druhé ťuknutie: " + info.join(" / ") + ")" };
}

// ------------------------------------------------------------------ odolnosť posunu (25. 10. 2026, popis hore)
/** posun.js: ochrana (ms od zavolania) a prahy prsta (px) — do OCHRANA ruší len ťah > TAH, potom ťah > PRST. */
const OCHRANA = 500, PRST = 10, TAH = 40;
/** Prerušenie plynulého posunu len ďaleko od jeho cieľa (px) — viac než tolerancia kontroly (stred ± 40 px, vrch
 *  vysokého kroku 0–30 px): posun.js bez dorovnania tak musí zlyhať. */
const ZOSTATOK = 60;
/** Pokusy, keď porucha nenastala tak, ako má (pomalý beh) — až potom scenár zlyhá s hláškou „neoveril“. */
const POKUSY = 3;
/** Ťahy prsta pri druhom dotyku [ms po kliku, px od dotyku]: chvenie medzi PRST a TAH ešte pred začiatkom plynulého
 *  posunu (posun.js čaká na ustálené rozloženie aspoň 100 ms — zrušený počas plynulého posunu by prehliadač aj tak
 *  dobehol a starý posun.js by prešiel) a potom 60 ms pokoj (bez švihu — rýchlosť pri pustení 0); švihnutie cez TAH. */
const CHVENIE = [[70, 6], [82, 12], [94, 18], [106, 24]], CHVENIE_DOTYK = 60, CHVENIE_KONIEC = 166;
const SVIH = [[120, 15], [140, 35], [160, 60], [180, 90]], SVIH_DOTYK = 100, SVIH_KONIEC = 200;
/** Kolieska „dobehu“ po kliku: (ms po kliku, deltaY) — zotrvačnosť touchpadu / kolieska, všetky do 400 ms. */
const DOBEH = [[40, 16], [90, 14], [140, 12], [190, 10], [240, 8], [290, 6], [340, 4], [390, 2]];
/** Klik, ktorého kód môže stránkou pohnúť — rovnaký zoznam ako AKTIVNY v posun.js (po ňom sa nedorovnáva). */
const AKTIVNY = ".lcd1v-krok > .order, .lcd1v-krok > .lcd1v-hd, .lcd1v-krok > .next-step-button, .lcd1v-vz-dalej, .lcd1v-druha__nie, "
  + ".lcd1v-druha__dlazdica, .lcd1v-komplet__bs, button.add-to-cart-button, a[href], button, input, select, textarea, label, summary, "
  + "[role='button'], [role='link'], [contenteditable='true'], [contenteditable='']";
/** Klik na obyčajný obsah (posun-prerusenie-klik) ms po kliku na „Pokračujte“ — druhé ťuknutie toho istého gesta. */
const KLIK_OBSAH = 200;
// v stránke: bod na obyčajnom obsahu (nie AKTIVNY, nie dlaždica / iframe) pri ľavom / pravom okraji, 35–90 % výšky okna
const BOD_OBSAH = `(function (aktivny) {
  var xs = [3, 6, 10, innerWidth - 4];
  for (var yy = Math.round(innerHeight * 0.35); yy < innerHeight * 0.9; yy += 13)
    for (var i = 0; i < xs.length; i++) {
      var e = document.elementFromPoint(xs[i], yy);
      if (!e || e === document.documentElement || e.closest(aktivny) || e.closest("iframe, video, .option-button, .options-wrap, [onclick]")) continue;
      return { x: xs[i], y: yy, ciel: e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\\s+/)[0] : "") };
    }
  return { chyba: "pri okraji okna nie je obyčajný obsah" };
})`;

// v stránke: porucha počas posunu po kliku na `tlacidlo` (prvý dôveryhodný mouseup — aj z ťuknutia) a život posun.js
// (jeho poslucháč kolieska — capture + passive — od zavolania posunNaStred po koniec(): „pred“ / „počas“ / „po“):
//   prekreslenie  klon namiesto cieľa 30 ms po kliku a znova pri druhom stlačení;
//   koliesko      záznam koliesok [vstup, spracované ms od kliku, život] (poslucháč passive — blokujúci by Chrome
//                 pri tichej stránke držal aj s odpoveďou CDP, raz 120 s); poloha stránky pri konci posunu z.yKoniec;
//   prerusenie    prvá udalosť scroll po prvom window.scrollTo „smooth“ po kliku, keď sa stránka pohla aspoň o 12 px
//                 a do cieľa toho posunu ostáva aspoň ZOSTATOK: skok „instant“ o 2 px späť — prehliadač tým plynulý
//                 posun zastaví (ako iný posun / ukotvenie / dobeh kolieska); bližšie pri cieli sa neprerušuje;
//   prerusenie-klik  to isté + záznam ďalších dôveryhodných klikov (čas, detail, AKTIVNY?, cieľ, život, zahodený);
//   chvenie, svih  záznam ťahov prsta [vstup, spracované ms od kliku, px od dotyku, život, pred plynulým posunom].
// Každé window.scrollTo po kliku -> z.posuny [ms od kliku, cieľ, behavior].
const PORUCHA = (druh, tlacidlo, ciele) => `(function () {
  var z = window.__lcdPorucha = { druh: ${JSON.stringify(druh)}, klik: null, druhe: false, nahradene: [], predPosunom: false, kolieska: [], prsty: [], kliky: [],
    posuny: [], posun: null, plynuly: null, prerusene: null, blizko: null, ruka: null, start: null, koniec: null, yKoniec: null };
  var ciele = ${JSON.stringify(ciele)};
  function ms() { return Math.round(performance.now() - z.klik); }
  function zivot() { return z.ruka == null ? "pred" : z.koniec == null ? "počas" : "po"; }
  function ciel() {
    for (var i = 0; i < ciele.length; i++) { var e = document.querySelectorAll(ciele[i][0])[ciele[i][1] || 0]; if (e) return e; }
    return null;
  }
  function prekresli(kedy) {
    var e = ciel();
    if (!e || !e.parentNode) { z.nahradene.push(kedy + ": cieľ nenájdený"); return; }
    e.parentNode.replaceChild(e.cloneNode(true), e);
    var f = zivot();
    z.nahradene.push(kedy + " " + ms() + " ms" + (f === "pred" ? " (posun.js ešte nebežal)" : f === "po" ? " (posun.js už skončil)" : "")
      + (z.posun ? " (po začiatku posunu " + z.posun.ms + " ms)" : ""));
    // overené len prekreslenie počas čakania posun.js na ustálené rozloženie (zavolaný, ešte bez scrollTo) — prekreslenie
    // pred zavolaním posunNaStred mu dá už nový prvok (598: kroky.js ho pod záťažou zavolá až ~110 ms po kliku)
    if (f === "počas" && !z.posun) z.predPosunom = true;
  }
  var pridaj = window.addEventListener, odober = window.removeEventListener;
  // život posun.js: RUKA poslucháči sú capture + passive (prenos.js má navyše once); nový posunNaStred = nový život
  window.addEventListener = function (typ, fn, o) {
    if (typ === "wheel" && z.klik != null && o && typeof o === "object" && o.capture && o.passive && !o.once) { z.ruka = fn; z.start = ms(); z.koniec = null; }
    return pridaj.apply(this == null ? window : this, arguments);
  };
  window.removeEventListener = function (typ, fn) {
    if (typ === "wheel" && fn && fn === z.ruka && z.koniec == null) { z.koniec = ms(); z.yKoniec = Math.round(scrollY); }
    return odober.apply(this == null ? window : this, arguments);
  };
  // klik podľa mouseup (komplet-ponuka.js klik na „Pokračujte“ zastaví na window skôr, než ho uvidí tento poslucháč)
  pridaj.call(window, "mouseup", function (e) {
    if (z.klik != null || !e.isTrusted || !(e.target && e.target.closest && e.target.closest(${JSON.stringify(tlacidlo)}))) return;
    z.klik = e.timeStamp;
    if (z.druh === "prekreslenie") setTimeout(function () { prekresli("po kliku"); }, 30);
  }, true);
  pridaj.call(window, "mousedown", function () {
    if (z.druh !== "prekreslenie" || z.klik == null || z.druhe) return;
    z.druhe = true;
    prekresli("druhé stlačenie");
  }, true);
  pridaj.call(window, "wheel", function (e) {
    if (z.klik == null) return;
    z.kolieska.push([Math.round(e.timeStamp - z.klik), ms(), zivot()]);
  }, { capture: true, passive: true });
  // snímky stále (popis hore): vstup kolieska / prsta Chrome doručí stránke so snímkou
  (function snimka() { requestAnimationFrame(snimka); })();
  pridaj.call(window, "click", function (e) {
    if (z.klik == null || !e.isTrusted || e.timeStamp - z.klik < 30) return;
    var c = e.target && e.target.closest ? e.target : null;
    var r = { t: Math.round(e.timeStamp - z.klik), h: ms(), d: e.detail, aktivny: !!(c && c.closest(${JSON.stringify(AKTIVNY)})),
      ciel: c ? c.tagName.toLowerCase() + (typeof c.className === "string" && c.className.trim() ? "." + c.className.trim().split(/\\s+/)[0] : "") : "?", f: zivot(), zahodeny: null };
    z.kliky.push(r);
    setTimeout(function () { r.zahodeny = e.defaultPrevented; }, 0);
  }, true);
  var prst = null;
  pridaj.call(window, "touchstart", function (e) {
    var p = e.touches && e.touches[0];
    if (z.klik != null && p) prst = { x: p.clientX, y: p.clientY };
  }, { capture: true, passive: true });
  pridaj.call(window, "touchmove", function (e) {
    var p = e.touches && e.touches[0];
    if (z.klik == null || !prst || !p) return;
    z.prsty.push([Math.round(e.timeStamp - z.klik), ms(), Math.round(Math.abs(p.clientX - prst.x) + Math.abs(p.clientY - prst.y)), zivot(), !z.plynuly]);
  }, { capture: true, passive: true });
  var povodny = window.scrollTo;
  window.scrollTo = function (o) {
    if (z.klik != null) {
      var obj = o && typeof o === "object", top = Math.round(obj ? o.top : arguments[1]), sp = (obj && o.behavior) || "";
      z.posuny.push([ms(), top, sp]);
      if (z.posun == null) z.posun = { ms: ms() };
      if (z.plynuly == null && sp === "smooth") z.plynuly = { y: Math.round(scrollY), ms: ms(), ciel: top };
    }
    return povodny.apply(window, arguments);
  };
  pridaj.call(window, "scroll", function () {
    if (z.druh.indexOf("prerusenie") !== 0 || !z.plynuly || z.prerusene || z.blizko) return;
    var y = Math.round(scrollY);
    if (Math.abs(y - z.plynuly.y) < 12) return;
    if (Math.abs(z.plynuly.ciel - y) < ${ZOSTATOK}) { z.blizko = { y: y, ms: ms() }; return; } // pozde — neprerušiť
    var smer = y > z.plynuly.y ? 1 : -1;
    z.prerusene = { y: y, ms: ms(), zostatok: Math.abs(z.plynuly.ciel - y) };
    povodny.call(window, { top: y - 2 * smer, behavior: "instant" });
  }, { passive: true });
  return true;
})()`;

const kolieska = (z) => z.kolieska.map((x) => x[0] + (x[1] - x[0] > 30 ? "/" + x[1] : "") + (x[2] !== "počas" ? " " + x[2] : "")).join(", ");
const prsty = (z) => z.prsty.map((x) => x[2] + " px " + x[0] + (x[1] - x[0] > 30 ? "/" + x[1] : "") + (x[3] !== "počas" ? " " + x[3] : "") + (x[4] ? "" : " (plynulý už beží)")).join(", ");
const kliky = (z) => z.kliky.map((x) => `${x.ciel} [${x.d}] ${x.t}${x.h - x.t > 30 ? "/" + x.h : ""} ms${x.aktivny ? " AKTIVNY" : ""}${x.zahodeny ? " zahodený" : ""}${x.f !== "počas" ? " " + x.f : ""}`).join(", ");
const zivotPosunu = (z) => `posun.js od ${z.start == null ? "?" : z.start} do ${z.koniec == null ? "?" : z.koniec} ms` + (z.yKoniec == null ? "" : `, koniec v y ${z.yKoniec}`);
/** Nastala porucha tak, ako má? null = áno, inak dôvod „neoveril“ (pomalý beh). */
function neoveril(druh, z) {
  if (druh === "prekreslenie") return z.predPosunom === true ? null
    : `cieľ sa nevymenil počas čakania posun.js na ustálené rozloženie, pred prvým posunom (${z.nahradene.join(", ") || "nič"}; ${zivotPosunu(z)})`;
  if (druh === "koliesko") return z.kolieska.some((x) => x[0] < OCHRANA - 20 && x[2] === "počas") ? null
    : `žiadne koliesko so vstupom do ${OCHRANA - 20} ms nespracované počas posunu (vstup/spracované ms: ${kolieska(z) || "nič"}; ${zivotPosunu(z)})`;
  if (druh === "prerusenie") return !z.plynuly ? "po kliku nezačal plynulý posun (window.scrollTo smooth)"
    : z.prerusene ? null
    : `plynulý posun (od ${z.plynuly.y} na ${z.plynuly.ciel}) sa neprerušil ďaleko od cieľa — ` + (z.blizko ? `prvý pohyb ≥ 12 px až ${Math.abs(z.plynuly.ciel - z.blizko.y)} px pred cieľom (${z.blizko.ms} ms)` : "krátky posun");
  if (druh === "prerusenie-klik") {
    const r = neoveril("prerusenie", z);
    if (r) return r;
    // klik na obyčajný obsah do 500 ms, ktorý stráž pustila, spracovaný počas posunu a pred dorovnaním
    const dor = z.posuny.find((p) => p[0] > z.prerusene.ms);
    const k = z.kliky.find((x) => x.d === 1 && !x.aktivny && x.f === "počas" && x.t < OCHRANA - 20 && x.zahodeny === false);
    return !k ? `žiadny pustený klik (detail 1) na obyčajný obsah do ${OCHRANA - 20} ms počas posunu (${kliky(z) || "nič"})`
      : dor && dor[0] < k.h ? `klik na obsah spracovaný až po dorovnaní (${k.h} ms, dorovnanie ${dor[0]} ms)` : null;
  }
  const tah = `(${prsty(z) || "nič"}; ${zivotPosunu(z)}; plynulý od ${z.plynuly ? z.plynuly.ms + " ms" : "—"})`;
  // chvenie: ťah PRST–TAH počas posunu, ešte pred plynulým posunom (inak by ho prehliadač dobehol aj po zrušení)
  if (druh === "chvenie") return z.prsty.some((x) => x[0] < OCHRANA - 20 && x[2] > PRST && x[2] <= TAH && x[3] === "počas" && x[4]) ? null
    : `žiadny ťah prsta ${PRST}–${TAH} px so vstupom do ${OCHRANA - 20} ms nespracovaný počas posunu pred plynulým posunom ${tah}`;
  // svih: švihnutie zastihlo posun (ťah > PRST počas posunu) a prekročilo TAH
  return !z.prsty.some((x) => x[0] < OCHRANA - 20 && x[2] > PRST && x[3] === "počas") ? `švihnutie nezastihlo posun (ťah > ${PRST} px so vstupom do ${OCHRANA - 20} ms počas posunu) ${tah}`
    : !z.prsty.some((x) => x[2] > TAH) ? `švihnutie neprekročilo ${TAH} px ${tah}` : null;
}
/** koliesko, poloha zlá: posun.js dobehol (skončil na cieli svojho posledného plynulého posunu, aspoň 150 ms po ňom —
 *  sledovanie dobehu) a stránku potom odsunulo koliesko spracované až po konci posunu (artefakt záťaže) -> dôvod
 *  „neoveril“; inak (zrušený, mimo cieľa) null = skutočná chyba. Len plynulé posuny: skoky „instant“ po kliku sú aj
 *  ukotvenie kroky.js / vzorky-produkt.js (kliknuté miesto drží), nie cieľ posun.js. */
function poKonci(z) {
  const posledny = z.posuny.filter((x) => z.koniec != null && x[0] <= z.koniec && x[2] === "smooth").pop(), neskoro = z.kolieska.filter((x) => x[2] === "po");
  if (z.koniec == null || !posledny || z.koniec - posledny[0] < 150 || !neskoro.length || Math.abs(z.yKoniec - posledny[1]) > 2) return null;
  return `posun skončil na cieli (y ${z.yKoniec}, ${z.koniec} ms po kliku), stránku potom odsunulo ${neskoro.length} koliesok spracovaných až po konci (vstup/spracované ${neskoro.map((x) => x[0] + "/" + x[1]).join(", ")} ms)`;
}
/** Záznam poruchy do hlášky / info. */
function opis(druh, z) {
  if (druh === "koliesko") return "kolieska vstup/spracované ms (život): " + kolieska(z) + "; " + zivotPosunu(z) + "; posuny " + JSON.stringify(z.posuny);
  if (druh === "prekreslenie") return "prekreslené: " + z.nahradene.join(", ");
  if (druh.indexOf("prerusenie") === 0) return "plynulý " + JSON.stringify(z.plynuly) + ", prerušený " + JSON.stringify(z.prerusene) + ", posuny " + JSON.stringify(z.posuny)
    + (druh === "prerusenie-klik" ? ", kliky: " + kliky(z) : "");
  return "ťahy prsta px vstup/spracované ms: " + prsty(z) + "; " + zivotPosunu(z) + "; posuny " + JSON.stringify(z.posuny);
}

/** Jeden prechod typu s poruchou -> { info } alebo { neoveril } (porucha nenastala tak, ako má — pomalý beh). */
async function poruchaPokus(s, a, ovl, j, druh) {
  const t = s.t, k = s.k, typ = a.produkt.typ, dotyk = druh === "chvenie" || druh === "svih";
  const { otvorKartu } = await import("./ovladac-kroky.mjs");
  const kon = kontrola(t, j, { bezAnimacie: false });
  await j.otvor(s, a.url, { novy: true });
  await t.ev(ZAZNAM);
  // samo otvorené okno chatu (Luxia) by po ~30 s mohlo zakryť tlačidlo -> skryté (ako posun-dvojtuk-prechod)
  await t.ev(`(function () { var st = document.createElement("style"); st.textContent = 'iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"] { visibility: hidden !important; pointer-events: none !important; }'; document.head.appendChild(st); return true; })()`);
  // prechod: tlačidlo, cieľ (selektor, poradie), podmienka otvorenia, ciele prekreslenia
  let p;
  if (typ === "vzorky") {
    const KROK = `${F} .lcd1v-vz-kroky > .lcd1v-vz-krok`;
    const aktivny = (i) => `(function () { var e = document.querySelectorAll(${JSON.stringify(KROK)})[${i}]; return !!(e && e.classList.contains("active")); })()`;
    await t.cakaj(aktivny(0), { ms: 8000, popis: "otvorený krok 1" });
    p = { tlacidlo: `${KROK}.active .lcd1v-vz-dalej`, meno: "krok 2", sel: KROK, index: 1, otvorena: aktivny(1), ciele: [[KROK, 1]] };
  } else if (typ === "boxy") {
    await j.zaklad(s, ovl, {}); // farba + 1 box M
    if (!(await ponukaPripravena(t))) s.upozornenia.push("karta ponuky setu sa do 30 s neukázala — overený prechod na súhrn");
    p = { tlacidlo: `${krok("farba")} > .next-step-button`, meno: "ponuka setu / súhrn", sel: null, index: 0,
      otvorena: `!!document.querySelector("${F} .lcd1v-komplet.active") || ${ZIADNY_OTVORENY}`,
      ciele: [[`${F} .lcd1v-komplet.active`, 0], [`${F} .lcd1v-suhrn`, 0]] };
  } else {
    await otvorKartu(t, "vzor");
    p = { tlacidlo: `${krok("vzor")} > .next-step-button`, meno: "auto", sel: krok("auto"), index: 0, otvorena: otvoreny("auto"), ciele: [[krok("auto"), 0]] };
  }
  // tlačidlo pri vrchu okna (20 % výšky): zbalený krok nad ním -> nový krok ďaleko hore, posun je dlhý (ako posun-dvojklik)
  let b = null;
  for (let pokus = 0; pokus < 3; pokus++) {
    if (pokus) await t.pauza(400);
    b = await t.ev(BOD + "(" + JSON.stringify(p.tlacidlo) + ",0.2)");
    if (!b.chyba) break;
  }
  if (b.chyba) throw new Error(`Pokračujte (${druh}): ${b.chyba}`);
  await t.ev(PORUCHA(druh, p.tlacidlo, p.ciele));
  const { x, y } = b;
  const posli = [];
  // čas vstupu (CDP timestamp, s od 1970) = čas podľa plánu: pod záťažou ho stránka spracuje neskôr, posun.js meria
  // čas vstupu (Event.timeStamp). T = klik (myš hneď; ťuknutie: dotyk -30 ms, pustenie T)
  const T = Date.now() / 1000 + (dotyk ? 0.03 : 0), pri = (ms) => ({ timestamp: T + ms / 1000 });
  const vCase = async (ms, prikaz, param) => {
    const zostava = T * 1000 + ms - Date.now();
    if (zostava > 0) await t.pauza(zostava);
    posli.push(k.posli(prikaz, { ...param, ...pri(ms) }));
  };
  const bod = (dy) => [{ x, y: y + dy, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
  if (dotyk) {
    // ťuknutie prstom (telefón), potom druhý dotyk s ťahom
    await vCase(-30, "Input.dispatchTouchEvent", { type: "touchStart", touchPoints: bod(0) });
    await vCase(0, "Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const [zac, tahy, kon2] = druh === "chvenie" ? [CHVENIE_DOTYK, CHVENIE, CHVENIE_KONIEC] : [SVIH_DOTYK, SVIH, SVIH_KONIEC];
    await vCase(zac, "Input.dispatchTouchEvent", { type: "touchStart", touchPoints: bod(0) });
    for (const [ms, dy] of tahy) await vCase(ms, "Input.dispatchTouchEvent", { type: "touchMove", touchPoints: bod(dy) });
    await vCase(kon2, "Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }));
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }));
    posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }));
    if (druh === "prekreslenie") {
      // ďalšie ťuknutie počas čakania na ustálené rozloženie (druhé stlačenie dvojkliku) prekreslí cieľ znova
      await t.pauza(120);
      posli.push(k.posli("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 2 }));
      posli.push(k.posli("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 2 }));
    } else if (druh === "koliesko") {
      for (const [ms, dy] of DOBEH) await vCase(ms, "Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY: dy });
    } else if (druh === "prerusenie-klik") {
      // druhé ťuknutie toho istého gesta na obyčajný obsah (iPhone: klik s detail 1) — stráž ho pustí, dorovnanie nesmie
      // vypnúť (nález recenzie 25. 10. 2026); bod hľadá stránka po rozbalení nového kroku
      await t.pauza(60);
      const o = await t.ev(BOD_OBSAH + "(" + JSON.stringify(AKTIVNY) + ")");
      if (o.chyba) { await Promise.all(posli); return { neoveril: "klik na obsah: " + o.chyba }; }
      await vCase(KLIK_OBSAH - 30, "Input.dispatchMouseEvent", { type: "mouseMoved", x: o.x, y: o.y });
      await vCase(KLIK_OBSAH - 30, "Input.dispatchMouseEvent", { type: "mousePressed", x: o.x, y: o.y, button: "left", clickCount: 1 });
      await vCase(KLIK_OBSAH, "Input.dispatchMouseEvent", { type: "mouseReleased", x: o.x, y: o.y, button: "left", clickCount: 1 });
    }
  }
  await Promise.all(posli);
  await t.cakaj(p.otvorena, { ms: 8000, popis: "otvorená " + p.meno + " po kliku (" + druh + ")" });
  let sel = p.sel;
  if (!sel) sel = (await t.ev(`!!document.querySelector("${F} .lcd1v-komplet.active")`)) ? `${F} .lcd1v-komplet.active` : `${F} .lcd1v-suhrn`;
  const meno = typ === "boxy" ? (/komplet/.test(sel) ? "ponuka setu" : "súhrn") : p.meno;
  const stav = () => t.ev(`(function () { var z = window.__lcdPorucha; return { klik: z.klik != null, nahradene: z.nahradene, predPosunom: z.predPosunom, kolieska: z.kolieska,
    prsty: z.prsty, kliky: z.kliky, posuny: z.posuny, plynuly: z.plynuly, prerusene: z.prerusene, blizko: z.blizko, start: z.start, koniec: z.koniec, yKoniec: z.yKoniec }; })()`);
  if (druh === "svih") {
    // zákazník švihol prstom (ťah > 40 px) do 500 ms: posun sa zruší — žiadne ďalšie window.scrollTo posun.js, poloha
    // stránky je jeho vec (neoveruje sa)
    await ustalene(t, sel, p.index);
    const z = await stav();
    j.over(z.klik, `${druh}: stránka klik (mouseup) na „Pokračujte“ nezaznamenala`);
    const dovod = neoveril(druh, z);
    if (dovod) return { neoveril: dovod };
    // zrušený = posun.js skončil najneskôr ~0,4 s po ťahu > 40 px (nezrušený dobieha a stráži ešte ≥ 0,5 s) a potom
    // už plynulo neposúval (nezrušený by stránku po švihnutí dorovnal)
    const m = z.prsty.find((x) => x[2] > TAH);
    const neskor = z.posuny.filter((x) => x[0] > m[1] && x[2] === "smooth");
    j.over(neskor.length === 0, `švihnutie prstom (${m[2]} px, vstup ${m[0]} ms, spracované ${m[1]} ms po kliku) posun nezrušilo — posun.js potom posunul stránku: ${JSON.stringify(neskor)} [${opis(druh, z)}]`);
    j.over(z.koniec != null && z.koniec <= m[1] + 400, `švihnutie prstom (${m[2]} px, spracované ${m[1]} ms po kliku) posun nezrušilo — posun.js skončil ${z.koniec == null ? "nikdy" : z.koniec + " ms po kliku"} [${opis(druh, z)}]`);
    return { info: `${meno}: švihnutie ${m[2]} px (vstup ${m[0]} ms) posun zrušilo, posun.js skončil ${z.koniec} ms po kliku, posuny ${JSON.stringify(z.posuny)}` };
  }
  try {
    if (meno === "súhrn") await kon.overSuhrn(`${meno} (${druh})`); // súhrn od vrchu (Michal 26. 10. 2026)
    else await kon.over(`${meno} (${druh})`, sel, p.index);
  } catch (e) {
    // porucha nenastala tak, ako má (pomalý beh) -> neoveril; inak skutočná chyba posunu
    const z = await stav().catch(() => null);
    const dovod = z && z.klik ? neoveril(druh, z) || (druh === "koliesko" ? poKonci(z) : null) : null;
    if (dovod) return { neoveril: dovod + " — " + String(e.message).slice(0, 160) };
    if (z) e.message += ` [${opis(druh, z)}]`;
    throw e;
  }
  const z = await stav();
  j.over(z.klik, `${druh}: stránka klik (mouseup) na „Pokračujte“ nezaznamenala`);
  const dovod = neoveril(druh, z);
  if (dovod) return { neoveril: dovod };
  const info = druh === "prekreslenie" ? "prekreslené: " + z.nahradene.join(", ")
    : druh === "koliesko" ? "kolieska po kliku: " + kolieska(z) + " ms (vstup[/spracované][ po = až po konci posunu])"
    : druh.indexOf("prerusenie") === 0 ? `plynulý posun od ${z.plynuly.ms} ms na ${z.plynuly.ciel}, prerušený v y ${z.prerusene.y} (${z.prerusene.ms} ms, ${z.prerusene.zostatok} px pred cieľom)`
      + (druh === "prerusenie-klik" ? `; klik na obsah: ${kliky(z)}` : "")
    : "ťahy prsta: " + prsty(z) + " (px vstup[/spracované] ms)";
  return { info: kon.vysl.join("; ") + " — " + info };
}

/** posun-prekreslenie / posun-koliesko-dobeh / posun-prerusenie / posun-prerusenie-klik / posun-prst-chvenie /
 *  posun-prst-svih (popis hore):
 *  pomalý beh (porucha nenastala tak, ako má) -> nový pokus (upozornenie), najviac POKUSY, potom zlyhá „neoveril“. */
async function sPoruchou(s, a, ovl, j, druh) {
  if (!a.novy) return { preskoc: "len nový vzhľad (?novy=1)" };
  if ((druh === "chvenie" || druh === "svih") && !s.t.mobil) return { preskoc: "len telefón (dotyk cez CDP, šírka < 768 px)" };
  const zle = [];
  for (let pokus = 1; pokus <= POKUSY; pokus++) {
    const r = await poruchaPokus(s, a, ovl, j, druh);
    if (!r.neoveril) {
      j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
      return { info: r.info + (zle.length ? ` (${pokus}. pokus)` : "") };
    }
    zle.push(r.neoveril);
    s.upozornenia.push(`${druh}: pomalý beh, ${pokus}. pokus neoveril (${r.neoveril}) — ${pokus < POKUSY ? "opakujem" : "koniec"}`);
  }
  j.over(false, `${druh}: pomalý beh — porucha nenastala tak, ako má, ani na ${POKUSY}. pokus, scenár neoveril: ${zle.join(" | ")}`);
}

const TYPY = ["jedno", "dvoj", "kufor-classic", "kufor-premium", "boxy", "vzorky"];

export const SCENARE = {
  "posun-nastred": { typy: TYPY, fn: (s, a, pom, ovl, j) => prechody(s, a, ovl, j) },
  "posun-bez-animacie": { typy: TYPY, fn: (s, a, pom, ovl, j) => prechody(s, a, ovl, j, { bezAnimacie: true }) },
  "posun-po-chybe": { typy: ["jedno", "dvoj", "kufor-classic", "kufor-premium"], fn: (s, a, pom, ovl, j) => poChybe(s, a, ovl, j) },
  "posun-dvojklik": { typy: ["jedno", "dvoj", "kufor-classic", "kufor-premium", "vzorky"], fn: (s, a, pom, ovl, j) => dvojkliky(s, a, ovl, j) },
  "posun-dvojtuk-prechod": { typy: ["jedno", "kufor-classic", "kufor-premium", "boxy"], fn: (s, a, pom, ovl, j) => dvojtukPrechod(s, a, ovl, j) },
  "posun-prekreslenie": { typy: TYPY, fn: (s, a, pom, ovl, j) => sPoruchou(s, a, ovl, j, "prekreslenie") },
  "posun-koliesko-dobeh": { typy: TYPY, fn: (s, a, pom, ovl, j) => sPoruchou(s, a, ovl, j, "koliesko") },
  "posun-prerusenie": { typy: TYPY, fn: (s, a, pom, ovl, j) => sPoruchou(s, a, ovl, j, "prerusenie") },
  "posun-prerusenie-klik": { typy: TYPY, fn: (s, a, pom, ovl, j) => sPoruchou(s, a, ovl, j, "prerusenie-klik") },
  "posun-prst-chvenie": { typy: TYPY, fn: (s, a, pom, ovl, j) => sPoruchou(s, a, ovl, j, "chvenie") },
  "posun-prst-svih": { typy: TYPY, fn: (s, a, pom, ovl, j) => sPoruchou(s, a, ovl, j, "svih") },
};
