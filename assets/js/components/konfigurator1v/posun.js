// Spoločný posun stránky nového konfigurátora 1V (Michal 24. 10. 2026: „vždy keď nejaký krok skončím … aby ten daný
// krok, ktorý sa otvorí, vyroloval nastred“). Nie je to modul index.js — len pomocník, ktorý importujú kroky.js,
// druha-vrstva.js, komplet-ponuka.js, boxy-produkt.js a vzorky-produkt.js.
//
// posunNaStred(el): po dokončení kroku („Pokračujte ďalej“, odpoveď, ktorá kartu sama zatvorí a otvorí ďalšiu,
//   „Pokračujte k súhrnu“) plynulo posunie stránku tak, aby bol novo otvorený krok (alebo súhrn) v STREDE viditeľnej
//   plochy = okno mínus pevná hlavička webu (vyskaHlavicky). Posúva vždy, nie len keď je krok mimo obrazovky.
//   - krok vyšší ako plocha (výber auta na telefóne): vrch kroku 12 px pod hlavičku — nadpis kroku musí byť vidieť;
//   - cieľ sa ráta až z KONEČNÉHO rozloženia: zatvorenie predošlého kroku, prekreslenie hlavičiek (kroky.js obnov po
//     kliku ~60 ms) a ukotvenie posunu na telefóne menia polohu ešte chvíľu po kliku -> čaká sa, kým poloha aj výška
//     prvku stoja (najviac 700 ms). 1V karty nemajú prechod výšky (CSS: max-height none, zatvorená = display none);
//   - po dobehnutí posunu sa poloha prepočíta (neskoro načítaný obrázok) a raz-dvakrát dorovná — len keď stránka
//     stojí presne tam, kam ju poslal tento posun (inak ju medzitým posunul zákazník alebo iný kód -> nechať tak);
//   - zákazník sám posúva (koliesko, ťahá prstom, iný kláves) = posun sa zruší hneď; ďalšie stlačenie (myš, prst,
//     Enter / medzera) až po 500 ms — skôr je to druhé stlačenie toho istého dvojkliku / dvojťuknutia a to posun rušiť
//     nesmie (nález recenzie 24. 10. 2026: stránka stála, nadpis nového kroku nad oknom). Samotný klik druhého stlačenia
//     sa zahodí: zbalený krok vytiahne pod kurzor hlavičku / „Pokračujte“ nižšieho kroku a klik by otvoril iný krok,
//     posun ťahá popod prst dlaždicu druhej vrstvy / banner setu a klik by odviedol na iný produkt (straz). Časy sa
//     merajú podľa času vstupu (Event.timeStamp), nie spracovania — zaneprázdnený telefón druhé ťuknutie spracuje
//     neskôr. Neskôr ručné otvorenie / zatvorenie hlavičkou posun zruší (hlavička sa drží na mieste); nový posunNaStred
//     zruší predošlý;
//   - prefers-reduced-motion: reduce -> bez animácie. html má na webe scroll-behavior: smooth (pri reduce ho
//     Bootstrap vypína), preto „instant“, nie „auto“ — skok bez animácie v každom prípade.
// Nemení: klik na hlavičku kroku (kliknutá hlavička sa drží na mieste — kroky.js, vzorky-produkt.js), posun pri chybe
// / validácii, posuny cena.js a prenos.js, kamióny (kamion/).

/** Medzera pod hlavičkou webu pri kroku vyššom ako viditeľná plocha (px). */
const MEDZERA = 12;
/** Udalosti zákazníka, ktoré prebiehajúci posun môžu zrušiť (pravidlá v posunNaStred -> ruka). */
const RUKA = ["wheel", "touchstart", "touchmove", "mousedown", "keydown", "click"];
/** Prvých 500 ms ďalšie stlačenie posun nezruší: druhé stlačenie dvojkliku (Windows najviac 500 ms) / dvojťuknutia. */
const OCHRANA = 500;
/** Prst sa pohol o viac ako 10 px = zákazník ťahá stránku (drobné chvenie pri ťuknutí nie). */
const PRST = 10;
/** Hlavička kroku — ručné otvorenie / zatvorenie (kroky.js, vzorky-produkt.js, karty druhej vrstvy a setu). */
const HLAVICKA = ".lcd1v-krok > .order, .lcd1v-krok > .lcd1v-hd";
/** Plochy „Áno“, ktoré odvedú na iný produkt: CELÁ dlaždica druhej vrstvy a CELÝ banner setu (klik kamkoľvek = Áno,
 *  tlačidlá Áno sú vnútri) — nie len tlačidlo (nález recenzie 24. 10. 2026: posun ťahá dlaždicu / banner popod prst,
 *  druhé ťuknutie trafilo text mimo tlačidla a zákazník odišiel na iný produkt). */
const PRECHOD = ".lcd1v-druha__dlazdica, .lcd1v-komplet__bs";
/** Ovládače, ktoré menia otvorený krok alebo vkladajú do košíka: hlavička, „Pokračujte“, odpoveď karty, košík. */
const OVLADAC = HLAVICKA + ", .lcd1v-krok > .next-step-button, .lcd1v-vz-dalej, .lcd1v-druha__nie, " + PRECHOD + ", button.add-to-cart-button";
/** Druhé ťuknutie na iPhone prehliadač za dvojklik neoznačí (click.detail 1) -> klik na ovládač do 350 ms sa zahodí,
 *  na plochu PRECHOD celých 500 ms (OCHRANA) — omyl tu zákazníka odvedie z rozpracovanej stránky. */
const DVOJKLIK = 350;

/** Výška pevnej / lepivej hlavičky webu (0 = žiadna). Rovnaké pravidlo ako doteraz v kroky.js. */
export function vyskaHlavicky() {
  const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (let i = 0; i < sels.length; i++) {
    const e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight;
  }
  return 0;
}

/** Plynulé posuny len bez prefers-reduced-motion: reduce. */
export function plynulo() {
  return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** Cieľ posunu (scrollY): stred prvku v strede viditeľnej plochy; prvok vyšší ako plocha -> vrch 12 px pod hlavičku. */
export function cielNaStred(el) {
  const r = el.getBoundingClientRect();
  const hH = vyskaHlavicky();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const plocha = vh - hH;
  const y = r.height + 2 * MEDZERA > plocha ? r.top - hH - MEDZERA : r.top + r.height / 2 - (hH + plocha / 2);
  const max = Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - vh);
  return Math.min(max, Math.max(0, Math.round(window.pageYOffset + y)));
}

/** Cieľ posunu (scrollY): vrch prvku 12 px pod hlavičku webu (kamióny: „vždy začiatok ďalšieho kroku“, Michal 25. 10. 2026). */
export function cielNaVrch(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const max = Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - vh);
  return Math.min(max, Math.max(0, Math.round(window.pageYOffset + r.top - vyskaHlavicky() - MEDZERA)));
}

let beh = 0;

/** Plynulý posun novo otvoreného kroku / súhrnu `el` do stredu viditeľnej plochy (popis hore).
 *  cielFn(el) = iný cieľ (napr. cielNaVrch); čakanie na konečné rozloženie, dorovnanie a zrušenie rukou ostávajú. */
export function posunNaStred(el, cielFn) {
  const vypocet = () => (cielFn ? cielFn(el) : cielNaStred(el));
  if (!el || !el.isConnected) return;
  const moj = ++beh;
  const start = Date.now(), t0 = performance.now();
  // ms od zavolania podľa času VSTUPU (Event.timeStamp), nie spracovania: zaneprázdnený telefón (rozloženie novej karty,
  // video) spracuje druhé ťuknutie neskôr, ochrana aj stráž však majú merať, kedy ho zákazník naozaj spravil
  const odStartu = (e) => (e.timeStamp > 0 && e.timeStamp < 1e12 ? e.timeStamp : performance.now()) - t0;
  let zruseny = false, prst = null;
  const hlavicka = (e) => !!(e.target && e.target.closest && e.target.closest(HLAVICKA));
  const ruka = (e) => {
    if (e.type === "wheel") { zruseny = true; return; }
    if (e.type === "click") { if (odStartu(e) >= OCHRANA && hlavicka(e)) zruseny = true; return; }
    const p = e.touches && e.touches[0];
    if (e.type === "touchmove") {
      if (!prst || !p || Math.abs(p.clientX - prst.x) + Math.abs(p.clientY - prst.y) > PRST) zruseny = true;
      return;
    }
    if (e.type === "touchstart") prst = p ? { x: p.clientX, y: p.clientY } : null;
    const stlacenie = e.type !== "keydown" || e.key === "Enter" || e.key === " ";
    if (!stlacenie || odStartu(e) >= OCHRANA) zruseny = true;
  };
  RUKA.forEach((u) => window.addEventListener(u, ruka, { capture: true, passive: true }));
  // Druhé stlačenie dvojkliku / dvojťuknutia po dokončení kroku: zbalený krok vytiahne pod kurzor hlavičku alebo
  // „Pokračujte“ nižšieho kroku -> klik by otvoril iný krok a zbalil práve otvorený. Zahodí sa skutočný klik, ktorý
  // prehliadač označí za dvojklik (detail ≥ 2, do 500 ms), klik na plochu prechodu na iný produkt do 500 ms alebo klik
  // na iný ovládač do 350 ms (nie passive — preventDefault).
  const straz = (e) => {
    if (!e.isTrusted) return;
    const ms = odStartu(e);
    const c = e.target && e.target.closest ? e.target : null;
    const limit = e.detail >= 2 || (c && c.closest(PRECHOD)) ? OCHRANA : c && c.closest(OVLADAC) ? DVOJKLIK : 0;
    if (ms < limit) { e.preventDefault(); e.stopImmediatePropagation(); }
  };
  window.addEventListener("click", straz, true);
  // odchod až po 2 s: časovač pri zaneprázdnenom vlákne môže dobehnúť skôr než čakajúce ťuknutie (limit stráže je v čase
  // vstupu, neskorší klik prejde aj tak)
  setTimeout(() => window.removeEventListener("click", straz, true), 2000);
  const koniec = () => RUKA.forEach((u) => window.removeEventListener(u, ruka, { capture: true, passive: true }));
  const zije = () => moj === beh && !zruseny && el.isConnected;
  const poloha = () => {
    const r = el.getBoundingClientRect();
    return Math.round(r.top + window.pageYOffset) + ":" + Math.round(r.height);
  };
  let pred = null, stoji = 0, ciel = 0, korekcie = 0;

  // 1) konečné rozloženie: poloha aj výška prvku 3 merania po sebe rovnaké (aspoň 100 ms po kliku), najviac 700 ms
  (function cakaj() {
    if (!zije()) { koniec(); return; }
    const p = poloha();
    stoji = p === pred ? stoji + 1 : 0;
    pred = p;
    const ubehlo = Date.now() - start;
    if ((stoji < 2 || ubehlo < 100) && ubehlo < 700) { setTimeout(cakaj, 40); return; }
    chod();
  })();

  // 2) jeden posun na cieľ
  function chod() {
    if (!zije() || !el.getClientRects().length) { koniec(); return; }
    ciel = vypocet();
    if (Math.abs(ciel - window.pageYOffset) >= 2) window.scrollTo({ top: ciel, behavior: plynulo() ? "smooth" : "instant" });
    sleduj();
  }

  // 3) po dobehnutí (poloha stránky 3 merania stojí; mimo cieľa aspoň 500 ms — animácia sa mohla len rozbiehať;
  //    najviac 1,6 s) prepočítať a pri zmene rozloženia dorovnať
  function sleduj() {
    const t0 = Date.now();
    let y0 = null, n = 0;
    (function kontrola() {
      if (!zije()) { koniec(); return; }
      const y = Math.round(window.pageYOffset);
      n = y === y0 ? n + 1 : 0;
      y0 = y;
      const ubehlo = Date.now() - t0;
      if ((n < 3 || (Math.abs(y - ciel) > 2 && ubehlo < 500)) && ubehlo < 1600) { setTimeout(kontrola, 50); return; }
      if (Math.abs(y - ciel) > 2 || !el.getClientRects().length) { koniec(); return; } // posunul niekto iný -> nechať
      const novy = vypocet();
      if (Math.abs(novy - ciel) > 8 && korekcie++ < 2) {
        ciel = novy;
        window.scrollTo({ top: ciel, behavior: plynulo() ? "smooth" : "instant" });
        sleduj();
        return;
      }
      koniec();
    })();
  }
}
