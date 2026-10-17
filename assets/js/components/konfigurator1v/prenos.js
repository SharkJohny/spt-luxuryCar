// Prenos výberu zákazníka medzi jednovrstvovými a dvojvrstvovými (ponuka druhej vrstvy, Michal 14. 10. 2026). JADRO
// (vydanie): beží v TYPY.jedno.moduly aj TYPY.dvoj.moduly (produkty.js), len pod body.lcd-1v (brána v index.js).
//
// Kľúč sessionStorage „lcd1vPrenos:v1“ (karta prehliadača, bez hashu a parametra v URL):
//   { v: 1, t: čas kliku na „Áno“, z: odkiaľ (598), na: kam (601), vyber: { … }, prijate: 0 | čas príchodu }
//   vyber = len ID hodnôt zo živého formulára + data-value aktívnych dlaždíc kroku 2:
//     farba, rozlozenie, kufor, pocetBoxov (1 | 2), farbaBoxov, boxSolo, box1, box2, volant, miesta, dvere
//   Zapisuje ho druha-vrstva.js (zapisPrenos) tesne pred prechodom na dvojvrstvový produkt toho istého vzoru
//   a kufor-produkt.js (zapisVyber, Michal 17. 10. 2026): klik na zelené tlačidlo banneru setu na rohoži do kufra
//   (619–634) -> jednovrstvové toho istého vzoru (598 / 610 / 613) s vyber = { kufor: ID voľby Classic | Premium },
//   a komplet-ponuka.js (zapisVyber, Michal 17. 10. 2026): „Áno“ v skrytej karte ponuky setu na rohoži (to isté
//   { kufor }) alebo na boxe 616 -> 598 s { pocetBoxov, boxSolo | box1 + box2, farbaBoxov len keď ju set má }.
//
// PRIJÍMATEĽ (init):
//   - na cieľovom produkte (na === productId, ešte neprijaté, mladšie ako 10 min): výber sa zapíše JEDINOU schválenou
//     cestou ctx.zapis (klik na živé ovládače, docs/1v-kontrakt.md §5) + klik na živé dlaždice volantu/miest/dverí
//     -> POST košíka je rovnaký ako v starom vzhľade pri tých istých voľbách. Poradie: dlaždice kroku 2 -> farba ->
//     rozloženie -> kufor -> boxy (počet -> farba -> veľkosti -> živé „potvrdiť“, ako kufor-boxy.js). Potom sa otvorí
//     prvý nevyplnený krok (po prenose „Farba 2. vrstvy“; nič sa nepredvolí). Boxy bez farby, ktorú produkt má (box 616
//     vo farbe mimo setu): počet a veľkosti sa zapíšu, otvorí sa krok boxov s oknom na výber farby a prvý nevyplnený krok
//     až po zatvorení okna. Kľúč ostane s prijate (žiadny druhý prenos).
//   - na zdrojovom produkte po tlačidle Späť (navigation type back_forward, z === productId, do 30 min): ten istý zápis
//     vráti výber, kľúč sa zmaže. Karta otázky je po návrate znova nezodpovedaná (druha-vrstva.js).
//   Starý kľúč, iný produkt, nová karta, zablokované úložisko: nič sa neprenesie, bez chyby.
// Pri importe sa nič nespúšťa.
export const MENO = "prenos";
export const KLUC = "lcd1vPrenos:v1";
/** Prenos na dvojvrstvový produkt platí 10 minút od kliku na „Áno“. */
export const PLATNOST = 10 * 60 * 1000;
/** Návrat tlačidlom Späť vráti výber do 30 minút od kliku na „Áno“. */
export const PLATNOST_SPAT = 30 * 60 * 1000;

const TRIEDY_AUTA = { volant: "wheel-Position", miesta: "sit-Position", dvere: "door-Position" };

export function citajKluc() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KLUC) || "null");
    return v && typeof v === "object" && v.v === 1 && v.vyber && typeof v.vyber === "object" ? v : null;
  } catch (e) { return null; }
}
function pisKluc(v) {
  try {
    if (v == null) sessionStorage.removeItem(KLUC);
    else sessionStorage.setItem(KLUC, JSON.stringify(v));
    return true;
  } catch (e) { return false; }
}

const cssHodnota = (v) => String(v).replace(/["\\]/g, "\\$&");

/** Aktívne tlačidlo voľby parametra v živom kroku (nie hodnota selectu: Späť vracia selecty bez aktívnych tlačidiel). */
function aktivnaVolba(ctx, kluc) {
  const p = ctx.parameter(kluc);
  const f = ctx.form();
  const b = p && f ? f.querySelector('.content-wrap .option-button.active[data-variant="' + p.id + '"]') : null;
  return b ? b.getAttribute("data-value") || "" : "";
}

/** Výber zákazníka na tejto stránke (len to, čo je naozaj zvolené). */
export function precitajVyber(ctx) {
  const f = ctx.form();
  const vyber = {};
  if (!f) return vyber;
  const farba = aktivnaVolba(ctx, "farba");
  if (farba) vyber.farba = farba;
  const rozlozenie = aktivnaVolba(ctx, "rozlozenie");
  if (rozlozenie) vyber.rozlozenie = rozlozenie;
  // kufor: len keď je zvolená karta (aj „Nechcem“ = voľba „nie“, ako pošle starý vzhľad)
  if (f.querySelector(".upsale-buttons.trunk > .parameter-cars > .upsale-button.active")) {
    const k = ctx.precitaj("kufor");
    if (k) vyber.kufor = k;
  }
  // boxy: len úplný výber (počet + farba + každá veľkosť); okno bez potvrdenia sa neprenáša
  const kb = f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active");
  const pocet = kb ? ({ conf1: 1, conf2: 2 })[kb.getAttribute("value")] || 0 : 0;
  if (pocet) {
    const kluce = pocet === 1 ? ["boxSolo"] : ["box1", "box2"];
    const hodnoty = {};
    ["farbaBoxov"].concat(kluce).forEach((k) => { const v = ctx.precitaj(k); if (v && v !== "0") hodnoty[k] = v; });
    if (hodnoty.farbaBoxov && kluce.every((k) => hodnoty[k])) Object.assign(vyber, { pocetBoxov: pocet }, hodnoty);
  }
  // volant, miesta, dvere = aktívne dlaždice kroku 2 (živý kód ich drží len v sessionStorage a pri načítaní nuluje)
  const auto = ctx.krok("auto");
  Object.keys(TRIEDY_AUTA).forEach((k) => {
    const b = auto && auto.querySelector("." + TRIEDY_AUTA[k] + " .option-button.active");
    const v = b && b.getAttribute("data-value");
    if (v) vyber[k] = v;
  });
  return vyber;
}

/** Zapíše kľúč prenosu (klik na „Áno“) -> true | false (úložisko zakázané: prenesie sa nanajvýš auto). */
export function zapisPrenos(ctx, naId) {
  return pisKluc({ v: 1, t: Date.now(), z: ctx.productId, na: Number(naId), vyber: precitajVyber(ctx), prijate: 0 });
}

/**
 * Zapíše kľúč prenosu z iného typu produktu (rohož do kufra -> jednovrstvové) -> true | false (úložisko zakázané).
 * vyber = len ID hodnôt cieľového produktu (napr. { kufor: "595" } zo živej stránky cieľa, ceny-ine.js moznostiZMapy).
 */
export function zapisVyber(zId, naId, vyber) {
  return pisKluc({ v: 1, t: Date.now(), z: Number(zId), na: Number(naId), vyber: Object.assign({}, vyber), prijate: 0 });
}

/** Typ navigácie stránky: "navigate" | "reload" | "back_forward" | … */
function typNavigacie() {
  try {
    const n = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (n && n.type) return n.type;
  } catch (e) { /* starý prehliadač */ }
  try { return performance.navigation && performance.navigation.type === 2 ? "back_forward" : "navigate"; } catch (e) { return "navigate"; }
}

/** Zápis výberu na tejto stránke: všetko klikom na živé ovládače (ctx.zapis), hodnoty, ktoré produkt nemá, sa preskočia. */
export function aplikujVyber(ctx, v) {
  const ma = (kluc, hodnota) => !!hodnota && ctx.moznosti(kluc).some((o) => o.hodnota === String(hodnota));
  // (a) volant / miesta / dvere: živé dlaždice kroku 2 (živý handler: sessionStorage, aktívna trieda; miesta = rady kroku 4)
  const auto = ctx.krok("auto");
  Object.keys(TRIEDY_AUTA).forEach((k) => {
    if (!auto || !v[k]) return;
    const b = auto.querySelector("." + TRIEDY_AUTA[k] + ' .option-button[data-value="' + cssHodnota(v[k]) + '"]');
    if (b && !b.classList.contains("active")) b.click();
  });
  // (b) farba 1. vrstvy, (c) rozloženie a kufor
  ["farba", "rozlozenie", "kufor"].forEach((k) => { if (ma(k, v[k])) ctx.zapis(k, v[k]); });
  // (d) boxy ako kufor-boxy.js: počet -> farba -> veľkosti -> živé „potvrdiť“ (zatvorí okno); neúplné -> živé „zrušiť“.
  //     Bez farby, ktorú produkt má (box 616 vo farbe, ktorú set nemá — komplet-ponuka.js ju neprenesie, Michal 17. 10.
  //     2026): počet a veľkosti sa zapíšu a živé okno boxov ostane otvorené na výber farby (zákazník ju zvolí a potvrdí;
  //     zavretie bez farby = živé „zrušiť“, ako pri ručnom výbere).
  const n = Number(v.pocetBoxov) || 0;
  const kluce = n === 1 ? ["boxSolo"] : n === 2 ? ["box1", "box2"] : [];
  if (kluce.length && kluce.every((k) => ma(k, v[k])) && ctx.zapis("pocetBoxov", n)) {
    const sFarbou = ma("farbaBoxov", v.farbaBoxov);
    if (sFarbou) ctx.zapis("farbaBoxov", v.farbaBoxov);
    kluce.forEach((k) => ctx.zapis(k, v[k]));
    if (!sFarbou) return;
    const okno = ctx.krok("boxyVyber");
    const ok = okno && okno.querySelector(":scope > .close-btn.return");
    if (ok) ok.click();
    const banner = okno && okno.closest(".upsale-Banner");
    if (banner && banner.classList.contains("showConf")) {
      const zrus = okno.querySelector(":scope > .close-btn.close:not(.bottom)");
      if (zrus) zrus.click();
    }
  }
}

function vyskaHlavicky() {
  const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (let i = 0; i < sels.length; i++) {
    const e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight;
  }
  return 0;
}

/** Otvorí prvý nevyplnený krok (po prenose „Farba 2. vrstvy“) alebo `ciel`, ostatné zatvorí a posunie ho pod hlavičku webu. */
function otvorPrvyNevyplneny(ctx, ciel) {
  let krok = ciel || null;
  if (!krok) try { krok = ctx.prvyNevyplneny(); } catch (e) { krok = null; }
  const nastav = window.__lcdSetStepOpen;
  if (!krok || typeof nastav !== "function") return;
  let kroky = [];
  try { kroky = ctx.kroky() || []; } catch (e) { kroky = []; }
  kroky.forEach((k) => { if (k !== krok && k.classList.contains("active")) nastav(k, false); });
  if (!krok.classList.contains("active")) nastav(krok, true);
  // zákazník sám roluje/klikne -> ďalšie dorovnania sa vynechajú (stránka mu neskočí pod rukou)
  let vlastnyPohyb = false;
  const stop = () => { vlastnyPohyb = true; };
  ["wheel", "touchstart", "keydown", "mousedown"].forEach((e) => window.addEventListener(e, stop, { once: true, passive: true, capture: true }));
  const posun = () => {
    if (vlastnyPohyb || !krok.isConnected) return;
    const y = krok.getBoundingClientRect().top - vyskaHlavicky() - 12;
    if (Math.abs(y) > 2) window.scrollTo({ top: Math.max(0, Math.round(window.pageYOffset + y)), behavior: "auto" });
  };
  // zatvorenie krokov nad ním mení výšku (prechod ~300 ms) a živý auto-postup po farbe zbalí kartu farby až po ~350 ms
  // + prechode; pri načítaní z CDN to dobehne neskôr než pri lokálnom builde (15. 10. 2026: nadpis kroku 195 px nad oknom)
  [60, 420, 800, 1300, 2000].forEach((ms) => setTimeout(posun, ms));
}

/**
 * Po zápise: prvý nevyplnený krok. Ostalo otvorené okno boxov (farba boxu, ktorú produkt nemá — aplikujVyber ju vynechal):
 * okno je v kroku boxov a v zbalenom kroku sa nevykreslí (CSS zbalenej karty) -> otvorí sa krok boxov, zákazník zvolí
 * farbu a potvrdí (alebo okno zruší) a až po zatvorení okna sa otvorí prvý nevyplnený krok.
 */
function otvorPoPrenose(ctx) {
  const okno = ctx.krok("boxyVyber");
  const banner = okno && okno.closest(".upsale-Banner");
  const boxy = ctx.krok("boxy");
  if (!banner || !boxy || !banner.classList.contains("showConf")) { otvorPrvyNevyplneny(ctx); return; }
  otvorPrvyNevyplneny(ctx, boxy);
  const mo = new MutationObserver(function () {
    if (banner.classList.contains("showConf")) return;
    mo.disconnect();
    otvorPrvyNevyplneny(ctx);
  });
  mo.observe(banner, { attributes: true, attributeFilter: ["class"] });
}

/** Živý konfigurátor je postavený tak, aby sa dal výber zapísať (ovládače, okno boxov, tlačidlá krokov). */
function pripravene(ctx, v) {
  const f = ctx.form();
  if (!f || !f.querySelector(".content-wrap .next-step-button")) return false;
  const farba = ctx.krok("farba");
  if (!farba || !farba.querySelector(".option-button")) return false;
  if (v.kufor && !f.querySelector(".upsale-buttons.trunk > .parameter-cars > .upsale-button")) return false;
  if (v.pocetBoxov) {
    const okno = ctx.krok("boxyVyber");
    if (!okno || !okno.querySelector(":scope > .close-btn.return")) return false;
  }
  return true;
}

/** Zápis po init (asynchrónne): chyba ide do ctx.chyby (ladenie, test), nie do konzoly; nový vzhľad ostáva. */
function zapisBezpecne(ctx, vyber) {
  try { aplikujVyber(ctx, vyber); } catch (e) { ctx.chyby.push(MENO + ": " + ((e && e.message) || e)); }
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const k = citajKluc();
  if (!k) return;
  const teraz = Date.now();
  const vek = teraz - Number(k.t || 0);
  if (Number(k.na) === ctx.productId && !k.prijate) {
    if (!(vek >= 0 && vek <= PLATNOST)) { pisKluc(null); return; } // starý kľúč: nič, bez chyby
    // prijaté hneď (aj keby zápis nedobehol: obnovenie stránky už nič neprenáša)
    pisKluc(Object.assign({}, k, { prijate: teraz }));
    ctx.ked(() => pripravene(ctx, k.vyber), function () {
      zapisBezpecne(ctx, k.vyber);
      otvorPoPrenose(ctx);
      ctx.vysli("prenos:prijaty", { z: k.z, vyber: k.vyber });
    }, { limit: 15000 });
    return;
  }
  if (Number(k.z) === ctx.productId && typNavigacie() === "back_forward") {
    pisKluc(null);
    if (!(vek >= 0 && vek <= PLATNOST_SPAT)) return;
    ctx.ked(() => pripravene(ctx, k.vyber), function () {
      zapisBezpecne(ctx, k.vyber);
      ctx.vysli("prenos:spat", { vyber: k.vyber });
    }, { limit: 15000 });
  }
}
