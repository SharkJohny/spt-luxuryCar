// Nový konfigurátor 1V — box do kufra 616 (návrh boxy.html, navrh-boxy.md §3–4). VLASTNÍK: worker boxy (T3.2)
// (+ typy/boxy.js, assets/css/_lcd1v-boxy.scss, tools/test-1v/ovladac-boxy-produkt.mjs novy, tools/test-1v/scenare-boxy.mjs,
// assets/img/1v/boxprodukt-*). Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md §5.
//
// Kroky farba → počet → veľkosť (živý DOM má počet → farba → veľkosť; poradie kariet mení len CSS typu, DOM ostáva):
//   krok 1 Farba   živé vzorky (kroky.js) + náhľad materiálu „Diamond Line — <farba>“ (fotka podľa názvu farby,
//                  hlavná fotka produktu sa nemení);
//   krok 2 Počet   dlaždice 1 / 2 / 3 boxy (návrh C „Fotka cez celú dlaždicu“, Michal 18. 10. 2026: reálna fotka cez
//                  dlaždicu, text na tmavom prechode) -> ctx.zapis("pocetKs", n) = živé tlačidlo „N ks“ (živý kód vyprázdni
//                  veľkosti nad počtom: select bez voľby -> kľúč v POST chýba ako pri starom vzhľade; ctx vráti
//                  zvolený 1. box, ktorý živé „1 ks“ zmaže). Pri štarte 1 box (živý web má predvolené „2 ks“);
//   krok 3 Veľkosť pre každý box v počte 4 karty s kresbou boxu (návrh B „Realistický pohľad zhora“, Michal 18. 10. 2026:
//                  prešívaný box s vekom, plochou rúčkou a štítkom vo farbe z kroku 1; šírka = cm z textu možnosti,
//                  všetky karty v rovnakej mierke) -> ctx.zapis("box1|2|3", v);
//                  ceny kariet z ctx.moznosti (1. box = cena variantu + príplatok, 2. a 3. box = príplatok).
// Posledný krok „Pokračujte k súhrnu“ (bez košíka) zachytáva kroky.js. „Pokračujte ďalej“ na farbe a počte ide
// v poradí návrhu (živý kód by išiel v poradí DOM: počet -> farba -> veľkosť).
// Košík: farba + veľkosť KAŽDÉHO boxu v počte. Živá validácia pozná len „aspoň jedna veľkosť“ -> modul rozšíri
// pravidlá kroku cez háčik jadra ctx.pravidloKroku (krok veľkosti = všetky boxy v počte; krok počtu je „hotový“ až
// po potvrdení, ako v návrhu „Hotovo 0 z 3“) a pred živým tlačidlom košíka zastaví neúplný výber (červený rám na kroku
// veľkosti, do košíka nič). Úplný výber posiela živé tlačidlo ako doteraz (ctx.doKosika / živý kód). Suma „od“ pri
// neúplných veľkostiach a popis lepivej lišty idú cez háčiky cena.js (ctx.hacik "cena:od", "cena:lista").
// Klik na „N ks“ hádzal „priceActualization is not defined“ (creatButtons.js, opravené pri integrácii WA 14. 10. 2026 —
// CDN do vydania ju má stále); modul sa na tú cestu nespolieha — cenu prepočíta živý delegovaný handler tlačidiel
// a ctx.zapis („change“ na vyprázdnených selectoch).
// Hlavička: vizuálny názov „Luxusný box do kufra Diamond Line“ (živý H1 ostáva v DOM, CSS ho len vizuálne skryje).
// Ponuka setu s autokobercami (banner C) je LEN v skrytom medzikroku za Počtom boxov (komplet-ponuka.js; Michal 17. 10.
// 2026: „toto má byť v medzikroku, nie ďalší iný banner“, „toto sa má zobrazovať po kroku počet boxov“).
// Nič natvrdo: ID parametrov, ceny ani hodnoty volieb. Nové prvky bez name. Text H1 sa nemení.
import { nazovFarby } from "./kroky.js";

export const MENO = "boxy-produkt";

const KLUCE = ["box1", "box2", "box3"];
const SVG = "http://www.w3.org/2000/svg";

const bezDiakritiky = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (s) => bezDiakritiky(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function el(tag, attrs, deti) {
  const e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    const v = attrs[k];
    if (v == null || v === false) return;
    if (k === "text") e.textContent = v;
    else if (k === "class") e.className = v;
    else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, String(v));
  });
  (deti || []).forEach(function (d) {
    if (d == null) return;
    e.appendChild(typeof d === "string" ? document.createTextNode(d) : d);
  });
  return e;
}
function svg(tag, attrs) {
  const e = document.createElementNS(SVG, tag);
  Object.keys(attrs).forEach((k) => e.setAttribute(k, String(attrs[k])));
  return e;
}
function nastavAttr(e, meno, hodnota) {
  if (!e) return;
  if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
  else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
}
function nastavText(e, t) {
  if (e && e.textContent !== t) e.textContent = t;
}

/** „S : 33x32x30 cm“ / „L: 54x32x30 cm“ -> { v: "S", sirka: 33, rozmer: "33 × 32 × 30 cm" }; iný tvar -> { v: text }. */
export function velkostZTextu(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const m = /^(XXL|XL|[SML])\b\s*:?\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i.exec(t);
  if (!m) return { v: t, sirka: null, rozmer: "" };
  return { v: m[1].toUpperCase(), sirka: Number(m[2].replace(",", ".")), rozmer: m[2] + " × " + m[3] + " × " + m[4] + " cm" };
}

// ---------------------------------------------------------------- kresba boxu (krok 3)
// Návrh B „Realistický pohľad zhora“ (Michal 18. 10. 2026 namiesto zlatého kufríka: „toto nezodpovedá tomu, ako boxíky
// v skutočnosti vyzerajú“; podľa fotiek boxprodukt-pocet-*.jpg): telo a veko prešité do kosoštvorcov (vypuklé
// „vankúšiky“), veko prekrýva hornú časť prednej steny a končí zaobleným lemom so šitím, plochý pás rúčky na veku,
// kovový štítok, tieň na podlahe. Jednotky = cm (šírka boxu z textu možnosti, výška 30), všetky karty v rovnakej
// mierke (viewBox 72 cm široký). Kosoštvorec 8,25 × 5,8 cm (o trochu väčší než skutočný, aby sa na telefóne
// neslieval). Farby kože, šitia a lemu = CSS premenné --bxp-* na .lcd1v-bxp-velk (obnov() podľa farby z kroku 1,
// typy/boxy.js farbyKresby); vzory sú v jednom <defs> vnútri .lcd1v-bxp-velk, aby premenné zdedili.
const QW = 8.25, QH = 5.8;
const MIERKA = 1.75; // px na cm na karte (telefón 2 karty v rade ~2, PC 4 v rade ~1,5) — hrúbky čiar sa rátajú v px
const IDK = "lcd1v-bxp-";
const f2 = (n) => Math.round(n * 100) / 100;
const QD = "M" + f2(QW / 2) + " 0L" + QW + " " + f2(QH / 2) + "L" + f2(QW / 2) + " " + QH + "L0 " + f2(QH / 2) + "Z";

/** Reťazec SVG -> prvok (parser HTML vloží <svg> do správneho menného priestoru). */
function zoSvg(retazec) {
  const t = document.createElement("template");
  t.innerHTML = retazec;
  return t.content.firstElementChild;
}
/** Prešívanie: vypuklé vankúšiky, ryha a šitie (farba šitia = --bxp-st cez triedu). */
function vzorKresby(id, x, y, tf) {
  const s = MIERKA;
  const e = (cx, cy) => '<ellipse cx="' + f2(cx) + '" cy="' + f2(cy) + '" rx="' + f2(QW * 0.42) + '" ry="' + f2(QH * 0.42) + '" fill="url(#' + IDK + 'puff)"/>';
  return '<pattern id="' + IDK + id + '" patternUnits="userSpaceOnUse" x="' + f2(x) + '" y="' + f2(y) + '" width="' + QW + '" height="' + QH + '"' + (tf ? ' patternTransform="' + tf + '"' : "") + ">"
    + e(QW / 2, QH / 2) + e(0, 0) + e(QW, 0) + e(0, QH) + e(QW, QH)
    + '<path d="' + QD + '" class="lcd1v-bxp-k-qg" fill="none" stroke-width="' + f2(2 / s) + '"/>'
    + '<path d="' + QD + '" class="lcd1v-bxp-k-qs" fill="none" stroke-width="' + f2(0.95 / s) + '" stroke-opacity=".92"/></pattern>';
}
function prechod(id, stopy) {
  return '<linearGradient id="' + IDK + id + '" x1="0" y1="0" x2="0" y2="1">'
    + stopy.map((st) => '<stop offset="' + st[0] + '" stop-color="' + st[1] + '" stop-opacity="' + st[2] + '"/>').join("") + "</linearGradient>";
}
/** Prechody a vzory kresby (jeden raz na stránke; nie display:none, inak by sa výplň nevykreslila). */
function definicieKresby() {
  return zoSvg('<svg class="lcd1v-bxp-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>'
    + '<radialGradient id="' + IDK + 'puff"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="' + IDK + 'floor"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".6" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
    + prechod("body", [[0, "#fff", 0.04], [0.5, "#000", 0], [1, "#000", 0.28]])
    + prechod("flap", [[0, "#fff", 0.26], [0.08, "#fff", 0.07], [0.55, "#000", 0], [1, "#000", 0.14]])
    + prechod("top", [[0, "#000", 0.16], [1, "#fff", 0.13]])
    + prechod("shade", [[0, "#000", 0.5], [1, "#000", 0]])
    + '<linearGradient id="' + IDK + 'metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfbf9"/><stop offset=".45" stop-color="#b8b8b4"/><stop offset=".7" stop-color="#ececea"/><stop offset="1" stop-color="#8d8d89"/></linearGradient>'
    + vzorKresby("qb", 36 - QW / 2, 16.2) + vzorKresby("qf", 36, 15.4) + vzorKresby("qt", 36 - QW / 2, 0, "translate(0 7.6) scale(1 .55)")
    + "</defs></svg>");
}
/** Obdĺžnik so zaoblením hore (rt) a dole (rb). */
function rr(x0, y0, x1, y1, rt, rb) {
  return "M" + f2(x0) + " " + f2(y0 + rt) + "Q" + f2(x0) + " " + f2(y0) + " " + f2(x0 + rt) + " " + f2(y0) + "H" + f2(x1 - rt) + "Q" + f2(x1) + " " + f2(y0) + " " + f2(x1) + " " + f2(y0 + rt)
    + "V" + f2(y1 - rb) + "Q" + f2(x1) + " " + f2(y1) + " " + f2(x1 - rb) + " " + f2(y1) + "H" + f2(x0 + rb) + "Q" + f2(x0) + " " + f2(y1) + " " + f2(x0) + " " + f2(y1 - rb) + "Z";
}
/** Otvorené „U“ (šitie lemu veka). */
function openU(x0, ys, x1, y1, r) {
  return "M" + f2(x0) + " " + f2(ys) + "V" + f2(y1 - r) + "Q" + f2(x0) + " " + f2(y1) + " " + f2(x0 + r) + " " + f2(y1) + "H" + f2(x1 - r) + "Q" + f2(x1) + " " + f2(y1) + " " + f2(x1) + " " + f2(y1 - r) + "V" + f2(ys);
}
/** Vrch veka: vpredu široký ako veko, vzadu mierne užší, zaoblené rohy. */
function vrchVeka(fx0, fx1, yb, yf, ins, r) {
  return "M" + f2(fx0) + " " + f2(yf + 0.8) + "V" + f2(yf - 0.3) + "Q" + f2(fx0 + 0.15) + " " + f2(yb) + " " + f2(fx0 + ins + r) + " " + f2(yb)
    + "H" + f2(fx1 - ins - r) + "Q" + f2(fx1 - 0.15) + " " + f2(yb) + " " + f2(fx1) + " " + f2(yf - 0.3) + "V" + f2(yf + 0.8) + "Z";
}
/** Plochá rúčka položená na veku: tieň, pás, dve prišité koncovky. */
function rucka(cx, y, h) {
  const sw = f2(0.9 / MIERKA);
  return '<rect x="' + f2(cx - 7) + '" y="' + f2(y + 0.45) + '" width="14" height="' + f2(h) + '" rx="' + f2(h / 2) + '" fill="#000" fill-opacity=".35"/>'
    + '<rect x="' + f2(cx - 6.8) + '" y="' + f2(y) + '" width="13.6" height="' + f2(h) + '" rx="' + f2(h / 2) + '" class="lcd1v-bxp-k-s" stroke-width="' + sw + '"/>'
    + '<path d="M' + f2(cx - 5.6) + " " + f2(y + h * 0.3) + "H" + f2(cx + 5.6) + '" stroke="#fff" stroke-opacity=".28" stroke-width="' + sw + '" stroke-linecap="round"/>'
    + '<rect x="' + f2(cx - 7.6) + '" y="' + f2(y - 0.12) + '" width="1.7" height="' + f2(h + 0.24) + '" rx=".4" class="lcd1v-bxp-k-ef"/>'
    + '<rect x="' + f2(cx + 5.9) + '" y="' + f2(y - 0.12) + '" width="1.7" height="' + f2(h + 0.24) + '" rx=".4" class="lcd1v-bxp-k-ef"/>';
}
/** Kresba boxu šírky `sirka` cm (výška 30 cm) v jednotnej mierke kariet. */
function kresba(sirka) {
  const s = MIERKA;
  const w = Math.max(12, Math.min(70, Number(sirka) || 40));
  const cx = 36, x0 = cx - w / 2, x1 = cx + w / 2, yb = 7.6, yf = 15, o = 0.35, fx0 = x0 - o, fx1 = x1 + o, fy1 = 33, yB = 45, di = 1.05;
  const telo = rr(x0, yf + 1, x1, yB, 0.01, 1.3), veko = rr(fx0, yf - 0.3, fx1, fy1, 1.1, 1.7), vrch = vrchVeka(fx0, fx1, yb, yf, 2.2, 1.4);
  const u = (id) => "url(#" + IDK + id + ")";
  return zoSvg('<svg class="lcd1v-bxp-sil" viewBox="0 5.8 72 41.6" aria-hidden="true" focusable="false">'
    + '<ellipse cx="36" cy="' + f2(yB + 0.15) + '" rx="' + f2(w / 2 + 3.2) + '" ry="1.9" fill="' + u("floor") + '"/>'
    + '<path d="' + telo + '" class="lcd1v-bxp-k-l"/><path d="' + telo + '" fill="' + u("qb") + '"/>'
    + '<path d="' + telo + '" fill="' + u("body") + '" class="lcd1v-bxp-k-e" stroke-width="' + f2(1.1 / s) + '"/>'
    + '<rect x="' + f2(x0) + '" y="' + f2(fy1 - 0.2) + '" width="' + f2(w) + '" height="2.8" fill="' + u("shade") + '"/>'
    + '<path d="' + vrch + '" class="lcd1v-bxp-k-l"/><path d="' + vrch + '" fill="' + u("qt") + '"/>'
    + '<path d="' + vrch + '" fill="' + u("top") + '" class="lcd1v-bxp-k-e" stroke-width="' + f2(1.1 / s) + '"/>'
    + rucka(cx, 10.3, 2)
    + '<path d="' + veko + '" class="lcd1v-bxp-k-l"/><path d="' + veko + '" fill="' + u("qf") + '"/>'
    + '<path d="' + veko + '" fill="' + u("flap") + '" class="lcd1v-bxp-k-e" stroke-width="' + f2(Math.max(1.3 / s, 0.42)) + '"/>'
    + '<path d="' + openU(fx0 + di, yf + 1.6, fx1 - di, fy1 - di, 1.1) + '" class="lcd1v-bxp-k-t" fill="none" stroke-width="' + f2(0.95 / s) + '" stroke-dasharray="' + f2(2.3 / s) + " " + f2(1.5 / s) + '" stroke-linecap="round"/>'
    + '<rect x="' + f2(cx - 3.1) + '" y="' + f2(fy1 - 3.6) + '" width="6.2" height="1.55" rx=".75" fill="' + u("metal") + '" stroke="#000" stroke-opacity=".4" stroke-width="' + f2(0.6 / s) + '"/>'
    + "</svg>");
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const T = ctx.texty("boxyProdukt");
  const TK = (ctx.texty("kroky").kroky || {});
  const form = ctx.form();
  const kPocet = ctx.krok("pocet"), kFarba = ctx.krok("farba"), kVelk = ctx.krok("velkost");
  if (!form || !kPocet || !kFarba || !kVelk) throw new Error("chýba krok počtu, farby alebo veľkosti boxu");
  const tlacidlaPoctu = () => kPocet.querySelectorAll(".amount-wrap > .amount-button");
  const boxy = KLUCE.filter((k) => ctx.parameter(k));
  const maxKs = Math.min(tlacidlaPoctu().length, boxy.length);
  if (!maxKs) throw new Error("chýbajú tlačidlá počtu alebo veľkosti boxov");

  const vlozene = []; // vlastné prvky (pri návrate na starý vzhľad sa odstránia)
  const odhlas = []; // poslucháči a observery
  let zruseny = false;
  const zapnute = () => !zruseny && document.body.classList.contains("lcd-1v");
  function vloz(rodic, e, pred) {
    rodic.insertBefore(e, pred || null);
    vlozene.push(e);
    return e;
  }

  // ---------------------------------------------------------------- stav zo živého formulára
  /** Počet boxov = aktívne živé tlačidlo „N ks“ (1 … maxKs). */
  function pocet() {
    const t = tlacidlaPoctu();
    for (let i = 0; i < t.length; i++) if (t[i].classList.contains("active")) return Math.max(1, Math.min(i + 1, maxKs));
    return 1;
  }
  const zvolene = (kluc) => { const v = ctx.precitaj(kluc); return v && v !== "0" ? v : ""; };
  /** Má každý box v počte veľkosť? */
  function velkostiHotove(n) {
    const k = n || pocet();
    for (let i = 0; i < k; i++) if (!zvolene(boxy[i])) return false;
    return true;
  }
  const cenaVariantu = () => { const c = ctx.cena(); return c && c.zaklad > 0 ? c.zaklad : 0; };
  const minCena = (kluc) => ctx.moznosti(kluc).reduce((m, o) => (m == null || o.cena < m ? o.cena : m), null) || 0;

  try {
    // ---------------------------------------------------------------- krok 2: dlaždice počtu (návrh C, Michal 18. 10. 2026)
    // reálna fotka cez pravú časť dlaždice, vľavo tmavý prechod s názvom, vetou a cenou „od“ (+ „2 × od 197 €“, keď
    // je každý box od rovnakej sumy); vybraná dlaždica = zlatý rám a zelená fajka
    const kartyPoctu = [];
    const volby = el("div", { class: "lcd1v-bxp-ksz", role: "group", "aria-label": T.skupinaPocet || null });
    for (let n = 1; n <= maxKs; n++) {
      const d = (T.pocet && T.pocet[n]) || { nm: n + "× box", ben: "", alt: "" };
      const src = ctx.obrazokVzoru("boxprodukt-pocet-" + n);
      const cn = el("b", { class: "lcd1v-bxp-od" });
      const po = el("small", { class: "lcd1v-bxp-ks-po" });
      const b = el("button", { type: "button", class: "lcd1v-bxp-ks", "data-ks": n, "aria-pressed": "false" }, [
        src ? el("img", { class: "lcd1v-bxp-ks-img", src, alt: d.alt || "", loading: "lazy", decoding: "async", width: 480, height: 360 }) : null,
        el("span", { class: "lcd1v-bxp-ks-in" }, [
          el("span", { class: "lcd1v-bxp-ks-nm", text: d.nm }),
          d.ben ? el("span", { class: "lcd1v-bxp-ks-ben", text: d.ben }) : null,
          el("span", { class: "lcd1v-bxp-ks-c" }, [cn, po]),
        ]),
      ]);
      b.addEventListener("click", function (e) {
        e.preventDefault();
        vyberPocet(n);
      });
      volby.appendChild(b);
      kartyPoctu.push({ n, b, cn, po });
    }
    const pocty = el("div", { class: "lcd1v-bxp-pocty", "data-ks": "" }, [volby]);
    vloz(kPocet, pocty, kPocet.querySelector(":scope > .next-step-button"));

    // ---------------------------------------------------------------- krok 3: veľkosti s kresbou boxu (návrh B, 18. 10. 2026)
    const velk = el("div", { class: "lcd1v-bxp-velk" }, [definicieKresby()]);
    const skupiny = boxy.slice(0, maxKs).map(function (kluc, i) {
      const karty = ctx.moznosti(kluc).map(function (o) {
        const v = velkostZTextu(o.text);
        const cn = el("span", { class: "lcd1v-bxp-vk-c" });
        const b = el("button", { type: "button", class: "lcd1v-bxp-vk", "data-hodnota": o.hodnota, "aria-pressed": "false", "aria-label": (T.box ? T.box(i + 1) : i + 1 + ". box") + ": " + v.v + (v.rozmer ? ", " + v.rozmer : "") }, [
          kresba(v.sirka),
          el("span", { class: "lcd1v-bxp-vk-l", text: v.v }),
          v.rozmer ? el("span", { class: "lcd1v-bxp-vk-d", text: v.rozmer }) : null,
          cn,
        ]);
        b.addEventListener("click", function (e) {
          e.preventDefault();
          vyberVelkost(kluc, o.hodnota);
        });
        return { b, cn, o, v };
      });
      const g = el("div", { class: "lcd1v-bxp-vgrp", "data-box": i + 1, role: "group", "aria-label": T.box ? T.box(i + 1) : null, hidden: i > 0 }, [
        el("p", { class: "lcd1v-bxp-nadp" }, [T.box ? T.box(i + 1) : i + 1 + ". box", el("em", { text: T.vyberteVelkost || "" })]),
        el("div", { class: "lcd1v-bxp-vcards" }, karty.map((x) => x.b)),
      ]);
      velk.appendChild(g);
      return { kluc, i, g, karty };
    });
    if (T.tip) velk.appendChild(el("p", { class: "lcd1v-bxp-tip" }, [el("b", { text: T.tipB || "" }), T.tip]));
    vloz(kVelk, velk, kVelk.querySelector(":scope > .next-step-button"));

    // ---------------------------------------------------------------- krok 1: náhľad materiálu vo farbe boxu
    const nahladNm = el("b", { class: "lcd1v-nahlad-nm" });
    const nahladImg = el("img", { class: "lcd1v-nahlad-img", alt: "", width: 400, height: 400, decoding: "async" });
    const nahlad = el("div", { class: "lcd1v-nahlad lcd1v-bxp-nahlad", hidden: true }, [nahladNm, nahladImg]);
    const ow = kFarba.querySelector(":scope > .options-wrap");
    vloz(kFarba, nahlad, ow ? ow.nextSibling : null);

    // ---------------------------------------------------------------- obnova (číta živý DOM, píše len do nových prvkov)
    let potvrdeny = false; // krok počtu „hotový“ až po potvrdení (návrh: na začiatku Hotovo 0 z 3)
    let pocetVidel = false;

    function obnov() {
      if (!zapnute()) { zrus(); return; }
      const n = pocet();
      const zaklad = cenaVariantu();
      // potvrdenie počtu: „Pokračujte ďalej“ (klik nižšie) / krok počtu bol otvorený a zatvoril sa / zvolená veľkosť
      const pocetOtvoreny = kPocet.classList.contains("active");
      if (pocetOtvoreny) pocetVidel = true;
      if (!potvrdeny && ((pocetVidel && !pocetOtvoreny) || boxy.some((k) => zvolene(k)))) potvrdeny = true;
      // karty počtu: aktívna + „od“ (1. box variant + najlacnejší príplatok, každý ďalší + najlacnejší príplatok);
      // „2 × od 197 €“ len keď je každý box od rovnakej sumy (inak by násobok klamal)
      let od = zaklad;
      const naBox = [];
      kartyPoctu.forEach(function (k) {
        const jeden = (k.n === 1 ? zaklad : 0) + minCena(boxy[k.n - 1]);
        naBox.push(jeden);
        od += minCena(boxy[k.n - 1]);
        nastavText(k.cn, (T.od ? T.od + " " : "") + ctx.formatCena(od));
        const rovnake = k.n > 1 && jeden > 0 && naBox.every((x) => x === naBox[0]);
        nastavText(k.po, rovnake && T.krat ? T.krat(k.n, ctx.formatCena(naBox[0])) : "");
        nastavAttr(k.b, "aria-pressed", k.n === n ? "true" : "false");
      });
      nastavAttr(pocty, "data-ks", n);
      // veľkosti: skupiny v počte, zvolená karta, ceny kariet
      const vyber = [];
      skupiny.forEach(function (s) {
        const vidno = s.i < n;
        if (s.g.hidden === vidno) s.g.hidden = !vidno;
        const v = zvolene(s.kluc);
        s.karty.forEach(function (x) {
          nastavAttr(x.b, "aria-pressed", x.o.hodnota === v ? "true" : "false");
          nastavText(x.cn, ctx.formatCena((s.i === 0 ? zaklad : 0) + x.o.cena));
          if (vidno && x.o.hodnota === v) vyber.push(x.v.sirka ? x.v.v + " (" + x.v.sirka + " cm)" : x.v.v);
        });
      });
      // zhrnutia kariet (kroky.js ich číta z data-lcd1v-vyber)
      const tp = (T.pocet && T.pocet[n]) || {};
      nastavAttr(kPocet, "data-lcd1v-vyber", tp.vy || n + " ×");
      nastavAttr(kVelk, "data-lcd1v-vyber", velkostiHotove(n) && vyber.length ? vyber.join(" + ") : (TK.velkost && TK.velkost.vy) || "");
      nastavAttr(pocty, "data-lcd1v-potvrdene", potvrdeny ? "1" : null);
      // náhľad farby: fotka materiálu podľa názvu farby, inak živá vzorka
      const a = kFarba.querySelector(":scope > .options-wrap > .option-button.active");
      if (a) {
        const tx = a.querySelector(".text");
        const nazov = a.getAttribute("data-lcd1v-nazov") || nazovFarby(tx ? tx.textContent : a.textContent).nazov;
        const im = a.querySelector("img");
        const src = ctx.obrazokVzoru("boxprodukt-farba-" + slug(nazov)) || (im && im.getAttribute("src")) || "";
        nastavText(nahladNm, (T.nahlad ? T.nahlad + " — " : "") + nazov);
        farbaKresby(slug(nazov));
        if (src && nahladImg.getAttribute("src") !== src) nahladImg.setAttribute("src", src);
        nahladImg.alt = nazov;
        if (nahlad.hidden !== !src) nahlad.hidden = !src;
      } else {
        if (!nahlad.hidden) nahlad.hidden = true;
        farbaKresby(null);
      }
    }
    // farba kresby boxu v kroku 3 podľa farby z kroku 1 (typy/boxy.js farbyKresby, kľúč = názov farby bez diakritiky);
    // bez farby / neznáma farba = predvolená (čierna, béžové šitie)
    let farbaK = "";
    function farbaKresby(kluc) {
      const F = T.farbyKresby || {};
      const k = kluc && F[kluc] ? kluc : T.farbaKresbyPredvolena;
      const c = F[k];
      if (!c || k === farbaK) return;
      farbaK = k;
      velk.style.setProperty("--bxp-lth", c.koza);
      velk.style.setProperty("--bxp-sp", c.rucka);
      velk.style.setProperty("--bxp-edge", c.lem);
      velk.style.setProperty("--bxp-st", c.sitie);
      nastavAttr(velk, "data-lcd1v-farba", k);
    }

    // ---------------------------------------------------------------- voľby (len ctx.zapis)
    function vyberPocet(n) {
      // krok sa „hotový“ stane až po „Pokračujte ďalej“ / zatvorení kroku (návrh: hotovy(2) pri data-dalej="2")
      ctx.zapis("pocetKs", n); // živé „N ks“ (resetBoxSizeOptions + prepočet); ctx vráti zvolený 1. box
      obnov();
    }
    function vyberVelkost(kluc, hodnota) {
      ctx.zapis(kluc, hodnota);
      obnov();
    }

    // ---------------------------------------------------------------- pravidlo košíka: veľkosť každého boxu v počte
    // háčik jadra (ctx.pravidloKroku): veľkosť = všetky boxy v počte (aj košík), počet = hotový až po potvrdení (len karta)
    const povVyplneny = ctx.vyplnenyZivo, povPrvy = ctx.prvyNevyplnenyZivo; // živé pravidlo (to pustí živé tlačidlo)
    odhlas.push(ctx.pravidloKroku(kVelk, () => !zapnute() || velkostiHotove()));
    odhlas.push(ctx.pravidloKroku(kPocet, () => !zapnute() || potvrdeny, { kosik: false }));

    // ---------------------------------------------------------------- cena a lišta (háčiky cena.js)
    // kým nie sú veľkosti všetkých boxov v počte, suma „od“ = variant + pre každý box zvolená alebo najlacnejšia veľkosť
    // (živý súčet by pri 2 boxoch bez veľkostí ukázal cenu 1 boxu)
    odhlas.push(ctx.hacik("cena:od", function () {
      if (!zapnute()) return null;
      const n = pocet();
      if (velkostiHotove(n)) return null;
      let suma = cenaVariantu();
      if (!(suma > 0)) return null;
      for (let i = 0; i < n; i++) {
        const v = zvolene(boxy[i]);
        const o = v ? ctx.moznosti(boxy[i]).find((x) => x.hodnota === v) : null;
        suma += o ? o.cena : minCena(boxy[i]);
      }
      return suma;
    }));
    // popis lišty (návrh boxy.html): „Box do kufra ×2 · S + L · <farba>“
    odhlas.push(ctx.hacik("cena:lista", function (info) {
      if (!zapnute() || !T.lista) return undefined;
      const n = pocet();
      const casti = [T.lista + (n > 1 ? " ×" + n : "")];
      if (velkostiHotove(n)) {
        const v = [];
        for (let i = 0; i < n; i++) {
          const o = ctx.moznosti(boxy[i]).find((x) => x.hodnota === zvolene(boxy[i]));
          if (o) v.push(velkostZTextu(o.text).v);
        }
        if (v.length) casti.push(v.join(" + "));
      }
      if (info && info.farba) casti.push(info.farba.toLowerCase());
      return casti.join(" · ");
    }));

    // ---------------------------------------------------------------- otváranie krokov v poradí návrhu
    function otvorKrok(krok) {
      const otvor = window.__lcdSetStepOpen;
      ctx.kroky().forEach(function (s) {
        if (s !== krok && s.classList.contains("active")) { if (typeof otvor === "function") otvor(s, false); else s.classList.remove("active"); }
      });
      if (!krok.classList.contains("active")) { if (typeof otvor === "function") otvor(krok, true); else krok.classList.add("active"); }
    }
    /** Červený rám ako živá validácia (lcd-needs-fill na 3 s -> kroky.js z neho urobí trvalý rám) + posun na krok. */
    function zvyrazni(krok) {
      otvorKrok(krok);
      krok.classList.add("lcd-needs-fill", "selection-required");
      setTimeout(function () { krok.classList.remove("lcd-needs-fill", "selection-required"); }, 3000);
      setTimeout(function () {
        const y = krok.getBoundingClientRect().top + window.pageYOffset - 104;
        const plynulo = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
        window.scrollTo({ top: Math.max(0, y), behavior: plynulo ? "smooth" : "auto" });
      }, 30);
    }

    // capture na document: beží pred živými handlermi (delegované jQuery na document aj priame na tlačidle)
    function klik(e) {
      if (!zapnute()) return;
      const t = e.target;
      if (!t || !t.closest) return;
      // „Pokračujte ďalej“: farba -> počet, počet -> veľkosť (živý kód by išiel v poradí DOM)
      const dalej = t.closest(".lcd1v-k-farba > .next-step-button, .lcd1v-k-pocet > .next-step-button");
      if (dalej && (dalej.parentNode === kFarba || dalej.parentNode === kPocet)) {
        if (dalej.parentNode === kFarba && !povVyplneny(kFarba)) return; // bez farby: živá validácia (červený rám)
        e.preventDefault();
        e.stopImmediatePropagation();
        if (dalej.parentNode === kPocet) potvrdeny = true;
        otvorKrok(dalej.parentNode === kFarba ? kPocet : kVelk);
        obnov();
        return;
      }
      // košík: živá validácia prejde už s jednou veľkosťou -> pri neúplných veľkostiach zastaviť (POST 0)
      const kos = t.closest("button.add-to-cart-button");
      if (kos && !povPrvy() && !velkostiHotove()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        zvyrazni(kVelk);
      }
    }
    document.addEventListener("click", klik, true);
    odhlas.push(() => document.removeEventListener("click", klik, true));

    // ---------------------------------------------------------------- hlavička (po cena.js: hodnotenie a cena už stoja)
    function hlavicka() {
      if (!zapnute()) { zrus(); return; }
      const ziva = ctx.krok("cena");
      const stlpec = ziva && ziva.closest(".p-info-wrapper");
      const hl = stlpec && stlpec.querySelector(".p-detail-inner-header");
      const h1 = hl && hl.querySelector("h1");
      if (h1 && T.nazov && !hl.querySelector(".lcd1v-bxp-nazov")) {
        vloz(h1.parentNode, el("div", { class: "lcd1v-bxp-nazov", "aria-hidden": "true" }, [T.nazov + " ", T.rad ? el("em", { text: T.rad }) : null]), h1.nextSibling);
      }
    }

    // ---------------------------------------------------------------- spustenie
    // Živý web má predvolené „2 ks“; návrh začína 1 boxom (len pri nedotknutom formulári: žiadna veľkosť zvolená).
    if (pocet() !== 1 && !boxy.some((k) => zvolene(k))) ctx.zapis("pocetKs", 1);
    // na začiatku otvorený krok 1 (farba), ak živý kód neotvoril nič
    if (!ctx.kroky().some((s) => s.classList.contains("active"))) otvorKrok(kFarba);
    obnov();

    // zmeny: zápis cez ctx, selecty (jQuery .trigger("change") nevyšle natívny change), triedy živých ovládačov, variant
    odhlas.push(ctx.na("zmena", obnov));
    const $ = window.jQuery || window.$;
    const naZmenu = function () { obnov(); };
    if ($) { $(form).on("change", "select", naZmenu); odhlas.push(() => $(form).off("change", "select", naZmenu)); }
    form.addEventListener("change", naZmenu, true);
    odhlas.push(() => form.removeEventListener("change", naZmenu, true));
    const naCenu = function () { setTimeout(obnov, 60); };
    document.addEventListener("LuxuryCarPriceRecalculated", naZmenu);
    document.addEventListener("ShoptetVariantChange", naCenu);
    odhlas.push(() => { document.removeEventListener("LuxuryCarPriceRecalculated", naZmenu); document.removeEventListener("ShoptetVariantChange", naCenu); });
    const mo = new MutationObserver(obnov);
    [kPocet, kFarba, kVelk].forEach((k) => mo.observe(k, { attributes: true, attributeFilter: ["class"] }));
    [kPocet.querySelector(".amount-wrap"), kFarba.querySelector(":scope > .options-wrap"), kVelk.querySelector(":scope > .options-wrap")]
      .filter(Boolean).forEach((w) => mo.observe(w, { attributes: true, attributeFilter: ["class"], subtree: true }));
    odhlas.push(() => mo.disconnect());
    // index.js zloží body.lcd-1v synchrónne po init všetkých modulov, ak niektorý zlyhal -> späť na starý vzhľad
    setTimeout(hlavicka, 0);
  } catch (e) {
    zrus();
    throw e;
  }

  /** Návrat na starý vzhľad: vlastné prvky preč, ctx a poslucháči späť (živý DOM sa nemenil). */
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    odhlas.forEach((f) => { try { f(); } catch (x) { /* nič */ } });
    vlozene.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    nastavAttr(kPocet, "data-lcd1v-vyber", null);
    nastavAttr(kVelk, "data-lcd1v-vyber", null);
  }
}
