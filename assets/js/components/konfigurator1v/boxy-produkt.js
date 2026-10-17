// Nový konfigurátor 1V — box do kufra 616 (návrh boxy.html, navrh-boxy.md §3–4). VLASTNÍK: worker boxy (T3.2)
// (+ typy/boxy.js, assets/css/_lcd1v-boxy.scss, tools/test-1v/ovladac-boxy-produkt.mjs novy, tools/test-1v/scenare-boxy.mjs,
// assets/img/1v/boxprodukt-*). Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md §5.
//
// Kroky farba → počet → veľkosť (živý DOM má počet → farba → veľkosť; poradie kariet mení len CSS typu, DOM ostáva):
//   krok 1 Farba   živé vzorky (kroky.js) + náhľad materiálu „Diamond Line — <farba>“ (fotka podľa názvu farby,
//                  hlavná fotka produktu sa nemení);
//   krok 2 Počet   karty 1 / 2 / 3 boxy -> ctx.zapis("pocetKs", n) = živé tlačidlo „N ks“ (živý kód vyprázdni
//                  veľkosti nad počtom: select bez voľby -> kľúč v POST chýba ako pri starom vzhľade; ctx vráti
//                  zvolený 1. box, ktorý živé „1 ks“ zmaže). Pri štarte 1 box (živý web má predvolené „2 ks“);
//   krok 3 Veľkosť pre každý box v počte 4 karty so siluetou (šírka = cm z textu možnosti) -> ctx.zapis("box1|2|3", v);
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
// Hlavička: vizuálny názov „Luxusný box do kufra Diamond Line“ (živý H1 ostáva v DOM, CSS ho len vizuálne skryje)
// a banner setu „Box do kufra už od …, keď ho kúpite spolu s autokobercami pod sedadlá“ (set-banner.js; cena boxu S
// v sete z 598 cez ceny-ine.js, odkaz z registra).
// Nič natvrdo: ID parametrov, ceny ani hodnoty volieb. Nové prvky bez name. Text H1 sa nemení.
import { nazovFarby } from "./kroky.js";
import { priplatkyTypu, moznostiZMapy } from "./ceny-ine.js";
import { najdiProdukt } from "./produkty.js";
import { postavBanner } from "./set-banner.js";

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

/** Silueta boxu v mierke: šírka obdĺžnika = šírka boxu v cm (viewBox 76 × 44 ako návrh, B:3970–4011). */
function silueta(sirka) {
  const w = Math.max(12, Math.min(70, Number(sirka) || 40));
  const x = Math.round(((76 - w) / 2) * 10) / 10;
  const s = svg("svg", { class: "lcd1v-bxp-sil", viewBox: "0 0 76 44", "aria-hidden": "true", focusable: "false" });
  s.appendChild(svg("path", { class: "lcd1v-bxp-sil-gr", d: "M2 40.5H74", fill: "none", "stroke-width": 1, "stroke-linecap": "round" }));
  s.appendChild(svg("rect", { x: 32, y: 3.6, width: 12, height: 5.4, rx: 2.7, fill: "none", stroke: "#8f7020", "stroke-width": 1.5 }));
  s.appendChild(svg("rect", { x, y: 9, width: w, height: 31, rx: 3.6, fill: "url(#lcd1v-bxp-g)", stroke: "#8f7020", "stroke-width": 1 }));
  s.appendChild(svg("rect", { x, y: 9, width: w, height: 31, rx: 3.6, fill: "url(#lcd1v-bxp-q)" }));
  s.appendChild(svg("rect", { x: x + 3, y: 13.5, width: w - 6, height: 5, rx: 2, fill: "#17130a", "fill-opacity": 0.16 }));
  return s;
}
/** Prechod a mriežka siluet (jeden raz na stránke; nie display:none, inak by sa výplň nevykreslila). */
function definicieSiluet() {
  const s = svg("svg", { class: "lcd1v-bxp-defs", width: 0, height: 0, "aria-hidden": "true", focusable: "false" });
  const defs = svg("defs", {});
  const g = svg("linearGradient", { id: "lcd1v-bxp-g", x1: 0, y1: 0, x2: 0.38, y2: 1 });
  g.appendChild(svg("stop", { offset: 0, "stop-color": "#fbf1d2" }));
  g.appendChild(svg("stop", { offset: 0.45, "stop-color": "#e4c46f" }));
  g.appendChild(svg("stop", { offset: 1, "stop-color": "#ab8120" }));
  const p = svg("pattern", { id: "lcd1v-bxp-q", width: 5.2, height: 5.2, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  p.appendChild(svg("path", { d: "M0 0V5.2M0 0H5.2", fill: "none", stroke: "#8a6a17", "stroke-opacity": 0.5, "stroke-width": 0.5 }));
  defs.appendChild(g);
  defs.appendChild(p);
  s.appendChild(defs);
  return s;
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
    // ---------------------------------------------------------------- krok 2: karty počtu
    const kartyPoctu = [];
    const volby = el("div", { class: "lcd1v-kb__volby", role: "group", "aria-label": T.skupinaPocet || null });
    for (let n = 1; n <= maxKs; n++) {
      const d = (T.pocet && T.pocet[n]) || { nm: n + "× box", po: "", alt: "" };
      const src = ctx.obrazokVzoru("boxprodukt-pocet-" + n);
      const cn = el("span", { class: "lcd1v-bxp-od" });
      const b = el("button", { type: "button", class: "lcd1v-kb__karta lcd1v-bxp-ks", "data-ks": n, "aria-pressed": "false" }, [
        src ? el("span", { class: "lcd1v-kb__fot" }, [el("img", { src, alt: d.alt || "", loading: "lazy", decoding: "async", width: 480, height: 360 })]) : null,
        el("span", { class: "lcd1v-kb__tx" }, [el("span", { class: "lcd1v-kb__nm", text: d.nm }), cn, d.po ? el("span", { class: "lcd1v-kb__po", text: d.po }) : null]),
      ]);
      b.addEventListener("click", function (e) {
        e.preventDefault();
        vyberPocet(n);
      });
      volby.appendChild(b);
      kartyPoctu.push({ n, b, cn });
    }
    const pocty = el("div", { class: "lcd1v-kb lcd1v-bxp-pocty", "data-ks": "" }, [volby]);
    vloz(kPocet, pocty, kPocet.querySelector(":scope > .next-step-button"));

    // ---------------------------------------------------------------- krok 3: veľkosti so siluetou
    const velk = el("div", { class: "lcd1v-bxp-velk" }, [definicieSiluet()]);
    const skupiny = boxy.slice(0, maxKs).map(function (kluc, i) {
      const karty = ctx.moznosti(kluc).map(function (o) {
        const v = velkostZTextu(o.text);
        const cn = el("span", { class: "lcd1v-bxp-vk-c" });
        const b = el("button", { type: "button", class: "lcd1v-bxp-vk", "data-hodnota": o.hodnota, "aria-pressed": "false", "aria-label": (T.box ? T.box(i + 1) : i + 1 + ". box") + ": " + v.v + (v.rozmer ? ", " + v.rozmer : "") }, [
          silueta(v.sirka),
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
      // karty počtu: aktívna + „od“ (1. box variant + najlacnejší príplatok, každý ďalší + najlacnejší príplatok)
      let od = zaklad;
      kartyPoctu.forEach(function (k) {
        od += minCena(boxy[k.n - 1]);
        nastavText(k.cn, (T.od ? T.od + " " : "") + ctx.formatCena(od));
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
        if (src && nahladImg.getAttribute("src") !== src) nahladImg.setAttribute("src", src);
        nahladImg.alt = nazov;
        if (nahlad.hidden !== !src) nahlad.hidden = !src;
      } else if (!nahlad.hidden) nahlad.hidden = true;
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
      // banner setu (set-banner.js, návrh C 17. 10. 2026): cena boxu S v sete s autokobercami (598 „box solo“), box S
      // samostatne (cena variantu + príplatok S tejto stránky), úspora; odkaz na jednovrstvové (register) na konfigurátor.
      // Box sa na jednovrstvových nepredvyberá (treba farbu aj veľkosť) -> obyčajný odkaz.
      const jedno = najdiProdukt(ctx.projectId, "jedno", null);
      if (!jedno || !stlpec || !T.set) return;
      priplatkyTypu(ctx.projectId, "jedno", null).then(function (mapa) {
        if (!zapnute()) return;
        const solo = moznostiZMapy(mapa, "boxSolo").filter((o) => o.cena > 0);
        const s = solo.find((o) => velkostZTextu(o.text).v === "S") || solo.slice().sort((x, y) => x.cena - y.cena)[0];
        if (!s) return;
        const prvy = ctx.moznosti(boxy[0]);
        const samoS = prvy.find((o) => velkostZTextu(o.text).v === "S") || prvy.slice().sort((x, y) => x.cena - y.cena)[0];
        const samo = samoS ? cenaVariantu() + samoS.cena : 0;
        const banner = postavBanner(T.set, {
          cena: ctx.formatCena(s.cena),
          samostatne: samo > s.cena ? ctx.formatCena(samo) : null,
          usetrite: samo > s.cena ? ctx.formatCena(Math.round((samo - s.cena) * 100) / 100) : null,
          href: jedno.url + "#product-detail-form",
          pip: ctx.obrazokVzoru("boxprodukt-pocet-1"),
          obrazok: ctx.obrazok,
        });
        banner.setAttribute("data-lcd1v-set", String(s.cena));
        // hneď pod rámik ceny (order 1 ako karta; _lcd1v-boxy.scss)
        const karta = stlpec.querySelector(":scope > .lcd1v-cena");
        vloz(stlpec, banner, karta ? karta.nextSibling : hl ? hl.nextSibling : stlpec.firstChild);
      }).catch(function () { /* bez ceny sa banner neukáže */ });
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
