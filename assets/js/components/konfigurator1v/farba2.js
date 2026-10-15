// Nový konfigurátor 1V — krok „Farba 2. vrstvy“ dvojvrstvových (601 Diamond, 604 Hexa, 607 Stripe). VLASTNÍK: worker dvoj
// (T1.2; + typy/dvoj.js, assets/css/_lcd1v-dvoj.scss, tools/test-1v/ovladac-farba2.mjs novy). Návrh: dvojvrstvove.html
// krok 4 (N:3964–4030), špecifikácia navrh-dvojvrstvove.md §3.6. Beží len pod body.lcd-1v (brána v index.js), moduly typu
// v TYPY.dvoj.moduly (produkty.js: „kroky“ postaví obal karty, tento modul jej telo).
//
// Ako (kontrakt docs/1v-kontrakt.md §5): ovládače sú ŽIVÉ tlačidlá .option-button[data-variant][data-value] kroku
// .parameter-wrap.parameter-<id farby 2. vrstvy> (16 × „Lux Color NN“, variant Shoptetu: mení priceId, cenu nie).
// Klik na vzorku = klik na živé tlačidlo (živé handlery: aktívna trieda, select, priceId, livePrice, validácia), tento
// modul DOM nemaže ani nepresúva: vzorky len preštýluje (CSS order -> 2 skupiny 7 + 9), pridá im názov a popis a vedľa
// nich postaví nové prvky BEZ name (vysvetlenie „i“, štítok „Odporúčame“, náhľad). Voľbu zapisuje živý klik (resp.
// ctx.zapis("farba2", v)), nič sa nepredvoľuje. Hlavná fotka galérie sa nemení (náhľad je len v kroku).
// Ponúka sa len Lux 01–16: vzorka, ktorej text nie je „Lux Color NN“, sa schová (Comfort ani nič iné sa nikdy nezobrazí).
// Zhrnutie kroku v hlavičke: atribút data-lcd1v-vyber na živom kroku (číta ho kroky.js).
// Štítok „Odporúčame“: jednofarebná Lux v tóne zvolenej farby 1. vrstvy rovnakým pravidlom ako v košíku (odporucanaLux
// z lcdKosikDoplnok.js: béžová 12, hnedá aj hnedá káva 11, vínová aj červená 13, šedá 16, inak 10); bez farby 1. vrstvy sa
// neukáže nič.
import { odporucanaLux, luxCislo, LUX_JEDNOFAREBNE } from "../../lcdKosikDoplnok.js";

export const MENO = "farba2";

// Texty z návrhu (navrh-dvojvrstvove.md §3.6) a štítok „Odporúčame“ (rovnaké slovo ako v košíku).
const TEXTY = {
  info: "Vysvetlenie",
  vysvetlenie: ["Druhá vrstva", " sa kladie na prvú prešívanú vrstvu tam, kde sa šliape. Zachytí vodu, sneh aj blato a dá sa vybrať a umyť aj vapkou. Farba druhej vrstvy cenu nemení."],
  odporucame: "Odporúčame",
  nahladPrazdny: "Druhá vrstva — vyberte farbu",
  nahladAlt: (n) => "Druhá vrstva — " + n,
  farbyNaVyber: (n) => n + (n === 1 ? " farba" : n >= 2 && n <= 4 ? " farby" : " farieb") + " na výber",
};

// Popisy Lux farieb z návrhu (Shoptet ich nemá). Poradie = poradie vzoriek v návrhu: najprv 7 jednofarebných a melírovaných,
// potom 9 s pruhmi (Lux 01–09).
const SKUPINY = [
  [[10, "čierna"], [11, "tmavohnedá"], [12, "béžová"], [13, "vínovo červená"], [16, "sivá"], [14, "čierno-červená melírovaná"], [15, "čierno-sivá melírovaná"]],
  [[1, "tmavohnedá s pruhmi"], [2, "tmavomodrá s pruhmi"], [3, "tmavohnedá s pruhmi"], [4, "béžová s pruhmi"], [5, "tmavohnedá s pruhmi"],
    [6, "sivá s pruhmi"], [7, "čierna s pruhmi"], [8, "čierna s pruhmi"], [9, "tmavohnedá s pruhmi"]],
];
const POPIS = {};
const PORADIE = {};
(function () {
  let i = 0;
  SKUPINY.forEach((s) => s.forEach(([n, popis]) => { POPIS[n] = popis; PORADIE[n] = ++i; }));
}());

const luxMeno = (n) => "Lux Color " + (n < 10 ? "0" : "") + n;

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}
function nastavText(e, text) {
  if (e && e.textContent !== text) e.textContent = text;
}
function nastavAttr(e, meno, hodnota) {
  if (!e) return;
  if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
  else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const krok = ctx.krok("farba2");
  const param = ctx.parameter("farba2");
  if (!krok || !param) throw new Error("krok farby 2. vrstvy sa nenašiel");
  if (krok.querySelector(":scope > .lcd1v-f2-nahlad")) return; // už postavené
  const ow = krok.querySelector(":scope > .options-wrap");
  if (!ow) throw new Error("farba 2. vrstvy: chýba .options-wrap");

  // ---------------------------------------------------------------- vzorky (živé tlačidlá)
  const nm = (ctx.texty("kroky").kroky || {}).farba2;
  ow.setAttribute("role", "group");
  ow.setAttribute("aria-label", (nm && nm.nm) || "Farba 2. vrstvy");
  const vzorky = [];
  Array.prototype.forEach.call(ow.querySelectorAll(":scope > .option-button"), function (b) {
    const tx = b.querySelector(".text");
    const n = luxCislo(tx ? tx.textContent : b.textContent);
    if (n == null) { b.classList.add("lcd1v-f2-skry"); b.setAttribute("aria-hidden", "true"); b.setAttribute("tabindex", "-1"); return; } // len Lux 01–16
    const nazov = luxMeno(n);
    const popis = POPIS[n] || "";
    const text = popis ? nazov + " — " + popis : nazov;
    b.classList.add("lcd1v-f2-vzorka");
    b.setAttribute("data-lcd1v-lux", String(n));
    b.setAttribute("data-lcd1v-nazov", nazov);
    b.setAttribute("data-lcd1v-popis", popis);
    b.setAttribute("title", text);
    b.setAttribute("aria-label", text);
    b.setAttribute("role", "button");
    b.setAttribute("tabindex", "0");
    b.style.setProperty("--f2-o", String(PORADIE[n] || 50));
    b.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); b.click(); }
    });
    vzorky.push({ n, b, nazov, popis, text });
  });
  if (!vzorky.length) throw new Error("farba 2. vrstvy: žiadna vzorka Lux");
  const podlaN = (n) => vzorky.find((v) => v.n === n) || null;

  // ---------------------------------------------------------------- podnadpis + „i“ s vysvetlením
  const pod = krok.querySelector(":scope > .lcd1v-pod");
  const vysv = el("div", "lcd1v-f2-vysv");
  vysv.id = "lcd1v-f2-vysv";
  vysv.hidden = true;
  vysv.appendChild(el("b", null, TEXTY.vysvetlenie[0]));
  vysv.appendChild(document.createTextNode(TEXTY.vysvetlenie[1]));
  const info = el("button", "lcd1v-f2-info", "i");
  info.type = "button";
  info.setAttribute("aria-label", TEXTY.info);
  info.setAttribute("aria-expanded", "false");
  info.setAttribute("aria-controls", vysv.id);
  if (pod) {
    pod.appendChild(document.createTextNode(" "));
    pod.appendChild(info);
  }
  function zmerajKrok() {
    if (krok.classList.contains("active") && typeof window.__lcdMeasureStep === "function") window.__lcdMeasureStep(krok);
  }
  info.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation(); // vysvetlenie nie je voľba: bez auta nemá otvárať okno „vyberte model“ (validation.js)
    vysv.hidden = !vysv.hidden;
    info.setAttribute("aria-expanded", vysv.hidden ? "false" : "true");
    zmerajKrok();
  });

  // ---------------------------------------------------------------- štítok „Odporúčame“ + náhľad
  const odp = el("div", "lcd1v-f2-odp");
  odp.hidden = true;
  odp.appendChild(el("span", "lcd1v-f2-odp-st", TEXTY.odporucame));
  const odpVz = el("img", "lcd1v-f2-odp-vz");
  odpVz.alt = "";
  odpVz.width = 28;
  odpVz.height = 28;
  odpVz.decoding = "async";
  odp.appendChild(odpVz);
  const odpTx = el("span", "lcd1v-f2-odp-tx");
  odp.appendChild(odpTx);

  const nahlad = el("div", "lcd1v-nahlad lcd1v-f2-nahlad");
  nahlad.hidden = true;
  nahlad.appendChild(el("b", "lcd1v-nahlad-nm", TEXTY.nahladPrazdny));
  const nahladImg = el("img", "lcd1v-nahlad-img");
  nahladImg.alt = "";
  nahladImg.width = 400;
  nahladImg.height = 400;
  nahladImg.decoding = "async";
  nahlad.appendChild(nahladImg);

  // poradie v karte určuje CSS order (kroky.js: hlavička -10, podnadpis -9, náhľad 50, tlačidlo 95)
  if (pod) krok.insertBefore(vysv, pod.nextSibling);
  else krok.insertBefore(vysv, ow);
  krok.insertBefore(odp, ow);
  krok.insertBefore(nahlad, ow.nextSibling);

  // ---------------------------------------------------------------- stav (číta živý DOM)
  /** Odporúčaná Lux podľa zvolenej farby 1. vrstvy (text voľby zo Shoptetu), alebo null. */
  function odporucana() {
    const m = ctx.moznosti("farba").find((x) => x.zvolena && x.hodnota);
    if (!m) return null;
    const n = odporucanaLux(m.text);
    return LUX_JEDNOFAREBNE.indexOf(n) > -1 && podlaN(n) ? n : null;
  }

  function obnov() {
    const zv = vzorky.find((v) => v.b.classList.contains("active")) || null;
    // zhrnutie v hlavičke kroku: názov zvolenej vzorky, inak „N farieb na výber“
    nastavAttr(krok, "data-lcd1v-vyber", zv ? zv.nazov : TEXTY.farbyNaVyber(vzorky.length));
    vzorky.forEach((v) => nastavAttr(v.b, "aria-pressed", v === zv ? "true" : "false"));
    // náhľad (len v kroku, hlavnú fotku galérie nemení)
    const im = zv && zv.b.querySelector("img");
    if (zv && im) {
      nastavText(nahlad.firstChild, zv.text);
      const src = im.getAttribute("src");
      if (src && nahladImg.getAttribute("src") !== src) nahladImg.setAttribute("src", src);
      nahladImg.alt = TEXTY.nahladAlt(zv.nazov);
    }
    if (nahlad.hidden === !!(zv && im)) {
      nahlad.hidden = !(zv && im);
      zmerajKrok();
    }
    // odporúčanie: štítok nad vzorkami + značka na vzorke
    const r = odporucana();
    const rv = r != null ? podlaN(r) : null;
    vzorky.forEach((v) => {
      const je = v === rv;
      if (v.b.classList.contains("lcd1v-f2-odporucana") !== je) v.b.classList.toggle("lcd1v-f2-odporucana", je);
      const al = je ? v.text + ", " + TEXTY.odporucame.toLowerCase() : v.text;
      if (v.b.getAttribute("aria-label") !== al) { v.b.setAttribute("aria-label", al); v.b.setAttribute("title", al); }
    });
    if (rv) {
      nastavText(odpTx, rv.text);
      const im2 = rv.b.querySelector("img");
      const s2 = im2 && im2.getAttribute("src");
      if (s2 && odpVz.getAttribute("src") !== s2) odpVz.setAttribute("src", s2);
    }
    if (odp.hidden === !!rv) {
      odp.hidden = !rv;
      zmerajKrok();
    }
  }

  let caka = null;
  function naplanuj() {
    if (caka) return;
    caka = setTimeout(function () { caka = null; obnov(); }, 0);
  }

  // zmeny: trieda .active vzoriek (živý klik), farba 1. vrstvy (odporúčanie), selecty (jQuery change), zápis cez ctx
  if (window.MutationObserver) {
    const mo = new MutationObserver(naplanuj);
    mo.observe(ow, { subtree: true, attributes: true, attributeFilter: ["class"] });
    const farba = ctx.krok("farba");
    const fow = farba && farba.querySelector(":scope > .options-wrap");
    if (fow) mo.observe(fow, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  const $ = window.jQuery || window.$;
  ["farba", "farba2"].forEach(function (kl) {
    const p = ctx.parameter(kl);
    if (!p) return;
    if ($) $(p.select).on("change", naplanuj);
    else p.select.addEventListener("change", naplanuj);
  });
  ctx.na("zmena", naplanuj);

  obnov();
}
