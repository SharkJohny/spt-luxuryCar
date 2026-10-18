// Ponuka setu s autokobercami pod sedadlá na sólo rohožiach do kufra Classic 619/622/625, Premium 628/631/634 a na boxe
// 616 — Michal 17. 10. 2026 vybral návrh 1 „Ponuka ako druhá vrstva“ (komplet-navrhy v1-*) a upresnil: „pri kufri skrytá
// sekcia PREDTÝM, ako si vyberie farbu koberca; pri boxoch keď si vyberie …, tak hneď potom tam bude tá skrytá sekcia“.
// TYPY["kufor-classic" | "kufor-premium" | "boxy"].moduly (produkty.js), len pod body.lcd-1v (brána v index.js).
// Texty: typy/<typ>.js „komplet“ (banner: „komplet.banner“); banner: set-banner.js; CSS: assets/css/_lcd1v-komplet.scss
// (blok LCD-1V-KOMPLET) + vzhľad schválenej karty druhej vrstvy (_lcd1v-druha.scss — karta nesie aj triedu lcd1v-druha).
//
// Správanie ako karta druhej vrstvy (druha-vrstva.js, docs/1v-kontrakt.md §13):
//   - SKRYTÁ karta BEZ čísla (nie je v ctx.produkt.kroky ani v lcdGetSteps -> „Krok N z 3“, postup aj validácia košíka
//     sa nemenia). Rohož: v DOM hneď za kartou Auto (pred Farbou), ukáže sa, keď je auto úplné. Box: za kartou Počet
//     boxov, pred Veľkosťou (Michal 17. 10. 2026 večer: „toto sa má zobrazovať po kroku počet boxov“; CSS order — živý
//     DOM má počet -> farba -> veľkosť), ukáže sa, keď je zvolená farba; pri 3 boxoch nikdy (set má najviac 2 boxy).
//     Bez čísla v sete (chyba siete, voľba na cieli chýba) sa karta neukáže.
//   - nepovinná: bez odpovede = Nie, nič neblokuje. „Pokračujte ďalej“ v Aute (rohož) / v Počte boxov (box) ju otvorí,
//     kým nie je zodpovedaná (capture na window — pred kroky.js a boxy-produkt.js, ktoré by otvorili ďalší krok).
//   - „Nie, ďakujem“ (zlaté): karta sa zbalí s fajkou; rohož -> otvorí Farbu, box -> otvorí Veľkosť (všetky veľkosti už
//     zvolené -> kroky zatvorené a súhrn s košíkom, ako „Pokračujte k súhrnu“ v kroky.js).
//   - telo karty = banner setu C (set-banner.js; Michal 17. 10. 2026 večer: „toto má byť v medzikroku, nie ďalší iný
//     banner“ -> samostatný banner pod cenou zrušený): stuha „Zľava −X %“, „Rohož do kufra Premium len za 239 €, keď ju
//     kúpite spolu s autokobercami pod sedadlá“, „Samostatne <s>340 €</s>“, „Ušetríte 101 €“, malá fotka produktu.
//   - „Áno, chcem set s autokobercami“ (zelené tlačidlo banneru; klik kamkoľvek do banneru = to isté): správa v karte,
//     tlačidlá zablokované, prenos.js zapisVyber(<táto stránka>, <jednovrstvové>, vyber) a prechod na jednovrstvové
//     toho istého vzoru (619/628 -> 598, 622/631 -> 610, 625/634 -> 613, box -> 598). vyber = len ID hodnôt cieľa:
//       rohož { kufor: voľba „dno“ (Classic) / „dno + boky“ (Premium) podľa textu } — farbu volí zákazník až na
//         autokobercoch (rohož v sete je vo farbe autokobercov; povie to veta v dlaždici), auto ide živým sessionStorage;
//       box { pocetBoxov: 1 | 2, boxSolo | box1 + box2: veľkosť podľa písmena S/M/L/XL (len keď je zvolená pri každom
//         boxe), farbaBoxov: farba podľa NÁZVU } — farbu, ktorú set nemá (dnes Šedá), neprenáša (povie to veta pod
//         bannerom); čo chýba (farba alebo veľkosti), vyberie zákazník v okne boxov na cieli (prenos.js aplikujVyber).
//         Bez veľkostí ukáže banner cenu „už od“ = najlacnejšia veľkosť, ktorú má set aj táto stránka (dnes S), pri
//         každom boxe; „Samostatne“ je tá istá veľkosť na tejto stránke (variant + príplatok).
//     Prijímač prenos.js na cieli zapíše výber cez ctx.zapis (klik na živé ovládače) -> POST = ručný výber.
// Čísla vždy živo, nič natvrdo (banner „… len za X €“ / „Samostatne <s>Y €</s>“ / „Ušetríte Z €“ / „Zľava −P %“):
//   X = cena voľby kufra / boxov na jednovrstvových (ceny-ine.js stranka -> mapaZFormulara; box: box solo pri 1 boxe,
//       1. box + 2. box pri 2 boxoch, + príplatok farby boxov, ak ho má), Y = ctx.cena().spolu tejto stránky, Z = Y − X.
// Nič s atribútom name, žiadny zápis do formulára tejto stránky. Bez flagu nič (brána).
import { najdiProdukt, jeZapnutyTyp } from "./produkty.js";
import { stranka, moznostiZMapy } from "./ceny-ine.js";
import { zapisVyber } from "./prenos.js";
import { nazovFarby } from "./kroky.js";
import { velkostZTextu } from "./boxy-produkt.js";
import { postavBanner, percentoZlavy } from "./set-banner.js";
import { lcdGetSteps, lcdFirstUnfilled } from "../../functions/configuratorEngine.js";

export const MENO = "komplet-ponuka";

const KLUCE_BOXOV = ["box1", "box2", "box3"];

/** Voľba kufra na jednovrstvových podľa textu (nie ID): classic = dno bez bokov, premium = dno + boky -> možnosť alebo null. */
export function volbaRohoze(moznosti, druh) {
  const m = moznosti || [];
  return (druh === "premium" ? m.find((x) => /bok/i.test(x.text)) : m.find((x) => /dno/i.test(x.text) && !/bok/i.test(x.text))) || null;
}

const bezDiakritiky = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Kľúč farby na porovnanie podľa názvu: „Diamond Farba kože : Čierna / Farba šitia: Sivá“ -> „cierna / sede sitie“
 *  (nazovFarby z kroky.js, bez diakritiky; sivé = šedé šitie — 616 píše „Sivá“, 598 „Šedá“, tá istá niť). */
export function klucFarby(text) {
  const n = nazovFarby(text).nazov;
  return n ? bezDiakritiky(n).replace(/\s+/g, " ").trim().replace(/\bsive\b/g, "sede") : "";
}

/** Farba boxu tejto stránky (text možnosti) -> voľba farby boxov na cieli s tým istým názvom, alebo null (set ju nemá). */
export function farbaNaCieli(text, moznostiCiel) {
  const k = klucFarby(text);
  return k ? (moznostiCiel || []).find((o) => klucFarby(o.text) === k) || null : null;
}

/**
 * Boxy na cieli pre veľkosti ["M"] / ["M", "L"] (písmená S/M/L/XL): 1 box = „Box solo“, 2 boxy = 1. box + 2. box
 * -> { vyber: { boxSolo | box1, box2: ID }, cena } alebo null (iný počet, veľkosť na cieli chýba, cena 0).
 */
export function boxyNaCieli(mapa, velkosti) {
  const kluce = velkosti.length === 1 ? ["boxSolo"] : velkosti.length === 2 ? ["box1", "box2"] : null;
  if (!mapa || !kluce) return null;
  const vyber = {};
  let cena = 0;
  for (let i = 0; i < kluce.length; i++) {
    const o = moznostiZMapy(mapa, kluce[i]).find((x) => velkostZTextu(x.text).v === velkosti[i]);
    if (!o || !(o.cena > 0)) return null;
    vyber[kluce[i]] = o.hodnota;
    cena += o.cena;
  }
  return { vyber, cena: Math.round(cena * 100) / 100 };
}

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}
function nastavText(e, text) {
  if (e && e.textContent !== text) e.textContent = text;
}
function prepni(e, trieda, stav) {
  if (e && e.classList.contains(trieda) !== !!stav) e.classList.toggle(trieda, !!stav);
}
function atribut(e, meno, hodnota) {
  if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
  else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
}
/** Text typu: reťazec alebo funkcia údajov ponuky. */
const text = (x, d) => (typeof x === "function" ? x(d) : x || "");

function vyskaHlavicky() {
  const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (let i = 0; i < sels.length; i++) {
    const e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight;
  }
  return 0;
}
/** Ako kroky.js po „Pokračujte ďalej“: otvorená karta pod hlavičku webu, ak nie je v hornej polovici okna. */
function posunNa(e) {
  if (!e || !e.isConnected) return;
  const hH = vyskaHlavicky();
  const top = e.getBoundingClientRect().top;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (top < hH + 8 || top > hH + (vh - hH) * 0.5) window.scrollTo({ top: Math.max(0, Math.round(window.pageYOffset + top - hH - 12)), behavior: "instant" });
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const P = ctx.produkt;
  if (!P) return;
  const rohoz = /^kufor-/.test(P.typ), box = P.typ === "boxy";
  if (!rohoz && !box) return;
  // cieľ = jednovrstvové toho istého vzoru (box: Diamond 598); len keď sa pri aktuálnom flagu otvoria v novom vzhľade
  // (inak by zákazník pristál v starom vzhľade bez prenosu)
  const ciel = najdiProdukt(ctx.projectId, "jedno", P.vzor);
  let flag = null;
  try { flag = sessionStorage.getItem("lcd1v"); } catch (e) { flag = null; }
  if (!ciel || !(flag === "vyvoj" || jeZapnutyTyp("jedno"))) return;
  const T = ctx.texty("komplet");
  const form = ctx.form();
  if (!T || !T.ti || !T.ano || !T.banner || !form || form.querySelector(".lcd1v-komplet")) return;
  const kAuto = rohoz ? ctx.krok("auto") : null, kFarba = ctx.krok("farba");
  const kPocet = box ? ctx.krok("pocet") : null, kVelk = box ? ctx.krok("velkost") : null;
  const kotva = rohoz ? kAuto : kPocet; // karta ide hneď za ňu (box: poradie robí CSS)
  if (!kotva || !kotva.parentNode || !kFarba || (box && !kPocet)) return;
  const druh = P.typ === "kufor-premium" ? "premium" : "classic";

  // ---------------------------------------------------------------- karta (bez čísla, bez name; vzhľad karty druhej vrstvy)
  const karta = el("div", "lcd1v-krok lcd1v-druha lcd1v-komplet");
  karta.hidden = true;
  karta.setAttribute("role", "group");
  karta.setAttribute("aria-label", T.nm);
  const hd = el("button", "lcd1v-hd");
  hd.type = "button";
  hd.setAttribute("aria-expanded", "false");
  const no = el("span", "lcd1v-no");
  no.setAttribute("aria-hidden", "true");
  const tx = el("span", "lcd1v-tx");
  tx.appendChild(el("span", "lcd1v-ey", T.nm));
  tx.appendChild(el("span", "lcd1v-nm", T.nm));
  tx.appendChild(el("span", "lcd1v-ti", T.ti));
  const vy = el("span", "lcd1v-vy", T.vy);
  tx.appendChild(vy);
  hd.appendChild(no);
  hd.appendChild(tx);
  hd.appendChild(el("span", "lcd1v-zm", "Zmeniť"));
  karta.appendChild(hd);

  // banner setu C (set-banner.js) — stavia sa, až keď sú čísla (obnovTexty), pri zmene čísel nanovo. Vnútri je skutočné
  // tlačidlo „Áno“; klik kamkoľvek do banneru = to isté (obal počúva, banner sa môže vymeniť)
  const bsObal = el("div", "lcd1v-komplet__bs");
  karta.appendChild(bsObal);
  let ano = null, bsKluc = "";
  // čo sa pri Áno prenesie / čo nie (vzor a auto ostanú; farba boxu, ktorú set nemá) — veta je V banneri pod zeleným
  // tlačidlom (pripojí ju obnovTexty pri každom postavení banneru), zlaté „Nie“ ide hneď pod banner (Michal 18. 10. 2026)
  const ben = el("p", "lcd1v-komplet__ben");

  // zlaté „Nie, ďakujem“ (zelené je „Áno“ — Michal: zelené = kam chceme zákazníka), pod ním veta
  const nie = el("button", "lcd1v-druha__nie lcd1v-komplet__nie", T.nie.nm);
  nie.type = "button";
  karta.appendChild(nie);
  const pozn = el("p", "lcd1v-pozn");
  karta.appendChild(pozn);

  // správa pri prenose
  const prenos = el("div", "lcd1v-druha__prenos lcd1v-komplet__prenos");
  prenos.hidden = true;
  prenos.setAttribute("role", "status");
  const toc = el("span", "lcd1v-druha__toc");
  toc.setAttribute("aria-hidden", "true");
  const ptx = el("span", "lcd1v-druha__prenos-t");
  ptx.appendChild(el("b", null, T.prenos));
  const pVyber = el("span", "lcd1v-druha__prenos-vyber");
  ptx.appendChild(pVyber);
  prenos.appendChild(toc);
  prenos.appendChild(ptx);
  karta.appendChild(prenos);

  kotva.parentNode.insertBefore(karta, kotva.nextSibling);

  // ---------------------------------------------------------------- stav a údaje ponuky
  const stav = { odpoved: null, prenos: false, mapa: undefined, ponuka: null };
  const zapnute = () => document.body.classList.contains("lcd-1v");
  const nastavOtvoreny = (e, on) => {
    if (typeof window.__lcdSetStepOpen === "function") window.__lcdSetStepOpen(e, on);
    else e.classList.toggle("active", on);
  };

  /** Rohož: { vSete, samostatne, vyber, d } alebo null (voľba kufra na cieli chýba / bez ceny). */
  function ponukaRohoze() {
    const m = volbaRohoze(moznostiZMapy(stav.mapa, "kufor"), druh);
    if (!m || !(m.cena > 0)) return null;
    const c = ctx.cena();
    return { vSete: m.cena, samostatne: c && c.spolu > 0 ? c.spolu : null, vyber: { kufor: m.hodnota }, d: {} };
  }
  /** Počet boxov = aktívne živé tlačidlo „N ks“ (ako boxy-produkt.js). */
  function pocetBoxov() {
    const t = kPocet.querySelectorAll(".amount-wrap > .amount-button");
    for (let i = 0; i < t.length; i++) if (t[i].classList.contains("active")) return i + 1;
    return 1;
  }
  /** Najlacnejšia veľkosť (písmeno) boxu i, ktorú má set (kľúč cieľa) aj táto stránka, alebo null. */
  function najlacnejsia(kluc, i) {
    const tu = ctx.moznosti(KLUCE_BOXOV[i]).map((x) => velkostZTextu(x.text).v);
    const m = moznostiZMapy(stav.mapa, kluc).filter((o) => o.cena > 0 && tu.indexOf(velkostZTextu(o.text).v) >= 0);
    m.sort((x, y) => x.cena - y.cena);
    return m.length ? velkostZTextu(m[0].text).v : null;
  }
  /** Box: 1 alebo 2 boxy -> ponuka, inak null (3 boxy, cieľ veľkosť nemá). Veľkosť zvolená pri každom boxe = presné
   *  čísla; inak „už od“ (najlacnejšia veľkosť pri každom boxe, „Samostatne“ = variant + jej príplatok na tejto stránke). */
  function ponukaBoxov() {
    const n = pocetBoxov();
    if (n < 1 || n > 2) return null;
    let velkosti = [];
    for (let i = 0; i < n; i++) {
      const v = ctx.precitaj(KLUCE_BOXOV[i]);
      const o = v && v !== "0" ? ctx.moznosti(KLUCE_BOXOV[i]).find((x) => x.hodnota === v) : null;
      if (!o) { velkosti = null; break; }
      velkosti.push(velkostZTextu(o.text).v);
    }
    const od = !velkosti;
    const c = ctx.cena();
    let samostatne = c && c.spolu > 0 ? c.spolu : null;
    if (od) {
      const kluce = n === 1 ? ["boxSolo"] : ["box1", "box2"];
      velkosti = kluce.map(najlacnejsia);
      if (velkosti.some((x) => !x)) return null;
      // samostatne = variant (farba) + príplatok tej istej veľkosti pri každom boxe na tejto stránke
      let sam = c && c.zaklad > 0 ? c.zaklad : 0;
      for (let i = 0; i < n; i++) {
        const o = ctx.moznosti(KLUCE_BOXOV[i]).find((x) => velkostZTextu(x.text).v === velkosti[i]);
        if (!o) return null;
        sam += o.cena;
      }
      samostatne = sam > 0 ? Math.round(sam * 100) / 100 : null;
    }
    const b = boxyNaCieli(stav.mapa, velkosti);
    if (!b) return null;
    // farba boxu (na 616 variant „farba“) -> farba boxov na cieli podľa názvu; set ju nemá -> neprenáša sa
    const fv = ctx.precitaj("farba");
    const fo = fv ? ctx.moznosti("farba").find((x) => x.hodnota === fv) : null;
    const fc = fo ? farbaNaCieli(fo.text, moznostiZMapy(stav.mapa, "farbaBoxov")) : null;
    // bez zvolených veľkostí sa prenesie len počet (a farba): veľkosti vyberie zákazník v okne boxov na cieli
    const vyber = Object.assign({ pocetBoxov: n }, od ? {} : b.vyber);
    let vSete = b.cena;
    if (fc) {
      vyber.farbaBoxov = fc.hodnota;
      vSete = Math.round((vSete + (fc.cena > 0 ? fc.cena : 0)) * 100) / 100;
    }
    return {
      vSete, samostatne, vyber,
      d: { pocet: n, od, velkosti: velkosti.join(" + "), farba: !fo ? "ziadna" : fc ? "ok" : "nie", nazov: fo ? nazovFarby(fo.text).nazov : "" },
    };
  }
  /** Má sa karta ukázať? Rohož: auto úplné. Box: zvolená farba (počet má vždy hodnotu; 3 boxy vylúči ponukaBoxov). */
  const pripravena = () => (rohoz ? ctx.vyplneny(kAuto) : ctx.vyplneny(kFarba));

  function obnovTexty(p) {
    if (!p) return;
    const d = Object.assign({ cena: ctx.formatCena(p.vSete) }, p.d);
    nastavText(ben, text(T.ben, d));
    nastavText(pozn, text(T.nie.pozn, d));
    nastavText(vy, stav.odpoved === "nie" ? text(T.vyNie, d) : T.vy);
    const us = p.samostatne > p.vSete ? Math.round((p.samostatne - p.vSete) * 100) / 100 : null;
    // malá fotka: rohož = hlavná fotka produktu (og:image, tá istá ako galéria — už načítaná), box = fotka podľa počtu
    let pip = null;
    if (rohoz) {
      const og = document.querySelector('meta[property="og:image"]');
      pip = (og && og.content) || null;
    } else pip = ctx.obrazokVzoru("boxprodukt-pocet-" + p.d.pocet) || null;
    const B = T.banner;
    const tb = { ey: B.ey, h: text(B.h, d), kd: text(B.kd, d), sam: text(B.sam, d), us: text(B.us, d), stuha: B.stuha, pip: text(B.pip, d), tag: B.tag, tl: T.ano.tl };
    const kluc = JSON.stringify([tb, p.vSete, p.samostatne, pip]);
    if (kluc === bsKluc) return;
    bsKluc = kluc;
    const bn = postavBanner(tb, {
      cena: ctx.formatCena(p.vSete),
      samostatne: us != null ? ctx.formatCena(p.samostatne) : null,
      usetrite: us != null ? ctx.formatCena(us) : null,
      zlava: us != null ? percentoZlavy(p.samostatne, p.vSete) : null,
      pip: pip,
      tlTrieda: "lcd1v-komplet__ano",
      obrazok: ctx.obrazok,
    });
    bn.setAttribute("data-lcd1v-set", String(p.vSete));
    ano = bn.querySelector(".lcd1v-komplet__ano");
    if (ano && stav.prenos) ano.disabled = true;
    const vnutro = bn.querySelector(".lcd1v-bs__in");
    if (vnutro) vnutro.appendChild(ben);
    bsObal.replaceChildren(bn);
  }

  function obnov() {
    naplanovane = false;
    if (!zapnute()) { zrus(); return; }
    if (!stav.prenos) {
      let p = null;
      try { p = stav.mapa ? (rohoz ? ponukaRohoze() : ponukaBoxov()) : null; } catch (e) { p = null; }
      stav.ponuka = p && pripravena() ? p : null;
    }
    const vid = stav.prenos || !!stav.ponuka;
    if (karta.hidden === vid) karta.hidden = !vid;
    if (!vid && karta.classList.contains("active")) zatvor();
    obnovTexty(stav.ponuka);
    prepni(karta, "lcd1v-hotovy", stav.odpoved === "nie" || stav.prenos);
    prepni(karta, "lcd1v-druha--prenos", stav.prenos);
  }
  let naplanovane = false;
  function naplanuj() {
    if (naplanovane) return;
    naplanovane = true;
    setTimeout(obnov, 30);
  }

  function otvor(posun) {
    lcdGetSteps().forEach((s) => { if (s.classList.contains("active")) nastavOtvoreny(s, false); });
    karta.classList.add("active");
    hd.setAttribute("aria-expanded", "true");
    if (posun) {
      setTimeout(() => posunNa(karta), 0);
      setTimeout(() => posunNa(karta), 380); // zatvorenie kroku nad ňou mení výšku (prechod ~300 ms)
    }
  }
  function zatvor() {
    karta.classList.remove("active");
    hd.setAttribute("aria-expanded", "false");
  }

  // ---------------------------------------------------------------- akcie
  hd.addEventListener("click", function () {
    if (stav.prenos) return;
    if (karta.classList.contains("active")) zatvor();
    else otvor(false);
    obnov();
  });

  nie.addEventListener("click", function () {
    if (stav.prenos) return;
    stav.odpoved = "nie";
    zatvor();
    if (rohoz) {
      // hlavná cesta: Farba (ako „Pokračujte ďalej“ v Aute)
      lcdGetSteps().forEach((s) => { if (s !== kFarba && s.classList.contains("active")) nastavOtvoreny(s, false); });
      if (!kFarba.classList.contains("active")) nastavOtvoreny(kFarba, true);
      setTimeout(() => posunNa(kFarba), 0);
      setTimeout(() => posunNa(kFarba), 380);
    } else if (!ctx.vyplneny(kVelk)) {
      // box: hlavná cesta = Veľkosť (ako „Pokračujte ďalej“ v Počte boxov)
      lcdGetSteps().forEach((s) => { if (s !== kVelk && s.classList.contains("active")) nastavOtvoreny(s, false); });
      if (!kVelk.classList.contains("active")) nastavOtvoreny(kVelk, true);
      setTimeout(() => posunNa(kVelk), 0);
      setTimeout(() => posunNa(kVelk), 380);
    } else {
      // box s veľkosťami (karta otvorená hlavičkou neskôr): ako „Pokračujte k súhrnu“ (kroky.js) — súhrn s košíkom
      lcdGetSteps().forEach((s) => { if (s.classList.contains("active")) nastavOtvoreny(s, false); });
      const suhrn = document.querySelector(".lcd1v-suhrn") || ctx.krok("kosik");
      if (suhrn) setTimeout(function () { suhrn.scrollIntoView({ block: "center", behavior: "smooth" }); }, 30);
    }
    obnov();
  });

  // tlačidlo „Áno“ (myš, Enter, medzerník) aj klik kamkoľvek do banneru: klik na tlačidlo prebuble do obalu
  bsObal.addEventListener("click", function () {
    if (stav.prenos || !stav.ponuka) return;
    const p = stav.ponuka;
    stav.prenos = true;
    stav.odpoved = "ano";
    if (ano) ano.disabled = true;
    nie.disabled = true;
    hd.disabled = true;
    const hlavicky = (rohoz ? ["vzor", "auto"] : ["farba", "pocet", "velkost"]).map((m) => {
      const k = form.querySelector(".lcd1v-k-" + m + " > .lcd1v-hd .lcd1v-vy");
      return k ? k.textContent.replace(/\s+/g, " ").trim().replace(/\s·\s.*$/, "") : "";
    });
    if (rohoz && T.prenosRohoz) hlavicky.push(T.prenosRohoz);
    nastavText(pVyber, hlavicky.filter(Boolean).join(" · "));
    prenos.hidden = false;
    obnov();
    zapisVyber(ctx.productId, ciel.id, p.vyber); // zakázané úložisko: prechod aj tak (prenesie sa nanajvýš auto)
    setTimeout(function () { window.location.assign(ciel.url); }, 450);
  });

  // „Pokračujte ďalej“ v Aute (rohož) / v Počte boxov (box): kým nie je otázka zodpovedaná a ponuka platí, otvorí kartu.
  // Capture na window = pred kroky.js a boxy-produkt.js (document capture otvára ďalší krok) aj pred živým enginom.
  // Nevyplnený krok = živá validácia ako doteraz (červený rám).
  function naPokracuj(e) {
    const t = e.target;
    if (!zapnute() || !t || !t.closest) return;
    const b = t.closest(".next-step-button");
    if (!b || b.parentNode !== kotva || stav.odpoved || stav.prenos) return;
    if (rohoz) {
      const i = lcdGetSteps().indexOf(kAuto);
      if (i < 0 || lcdFirstUnfilled(i)) return;
    } else if (!ctx.vyplneny(kFarba)) return; // bez farby: boxy-produkt.js otvorí Farbu / validácia
    obnov();
    if (!stav.ponuka || karta.hidden) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    otvor(true);
  }
  window.addEventListener("click", naPokracuj, true);

  // otvorený živý krok (hlavička, „Pokračujte ďalej“, validácia košíka) -> karta sa zatvorí (jedna otvorená karta)
  const mo = new MutationObserver(function () {
    if (!karta.classList.contains("active")) return;
    if (lcdGetSteps().some((s) => s.classList.contains("active"))) { zatvor(); naplanuj(); }
  });
  lcdGetSteps().forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
  // výber auta / počtu / veľkostí / farby (živé triedy ovládačov) -> karta sa ukáže alebo skryje
  const moVyber = new MutationObserver(naplanuj);
  (rohoz ? [kAuto] : [kPocet, kVelk, kFarba]).forEach((k) => moVyber.observe(k, { subtree: true, attributes: true, attributeFilter: ["class"] }));

  // zmeny výberu a ceny
  const $ = window.jQuery || window.$;
  if ($) $(form).on("change", "select", naplanuj);
  form.addEventListener("change", naplanuj, true);
  document.addEventListener("LuxuryCarPriceRecalculated", naplanuj);
  document.addEventListener("ShoptetVariantChange", naplanuj);
  document.addEventListener("click", function () { setTimeout(naplanuj, 60); });
  ctx.na("zmena", naplanuj);
  // auto obnovené zo sessionStorage (main.js) bez udalosti -> skontrolovať, kým sa stránka nepostaví
  if (rohoz) ctx.ked(() => ctx.vyplneny(kAuto), naplanuj, { limit: 15000 });

  // Safari bfcache (Späť bez nového načítania): karta znova nezodpovedaná, tlačidlá odblokované
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    stav.prenos = false;
    stav.odpoved = null;
    if (ano) ano.disabled = false;
    nie.disabled = false;
    hd.disabled = false;
    prenos.hidden = true;
    zatvor();
    obnov();
  });

  // index.js zloží body.lcd-1v (zlyhal iný modul) -> karta preč (bez štýlov by ostala viditeľná)
  let zruseny = false;
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    window.removeEventListener("click", naPokracuj, true);
    mo.disconnect();
    moVyber.disconnect();
    if (karta.parentNode) karta.parentNode.removeChild(karta);
  }
  new MutationObserver(function (z, o) { if (!zapnute()) { zrus(); o.disconnect(); } }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // ceny cieľa (tá istá stránka ako banner setu: jedna požiadavka, localStorage 24 h)
  stranka(ciel.url).then(function (v) {
    stav.mapa = (v && v.mapa) || null;
  }, function () {
    stav.mapa = null;
  }).then(naplanuj);

  obnov();
}
