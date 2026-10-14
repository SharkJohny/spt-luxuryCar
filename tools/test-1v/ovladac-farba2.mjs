// Ovládač kroku „Farba 2. vrstvy“ (dvojvrstvové 601/604/607). VLASTNÍK `novy`: worker dvoj (T1.2,
// assets/js/components/konfigurator1v/farba2.js + assets/css/_lcd1v-dvoj.scss). `stary` = živý web (referencia, nemeniť, T0.2 14. 10. 2026).
// Kým je `novy` null, --novy/--vyvoj použije `stary`.
//
// Živý web: krok .content-wrap > .parameter-wrap.parameter-<id farba2> (K3 dvojvrstvových, 16 × Lux Color),
// variant Shoptetu: spolu s farbou 1. vrstvy určuje priceId (necessaryVariantData „71-<lux>-78-<farba>“).
import { F, otvorKrok } from "./stary-ui.mjs";
import { otvorKartu } from "./ovladac-kroky.mjs";

export const stary = {
  meno: "stary",

  /** Vyberie farbu 2. vrstvy (index viditeľnej voľby; 0 = Lux Color 10) -> value vo variant selecte farby 2. vrstvy. */
  async vyberFarbu2(t, { index = 0 } = {}) {
    const sel = await otvorKrok(t, "farba2");
    await t.klikni(`${sel} .option-button`, { index, popis: "farba 2. vrstvy " + index });
    const id = await t.idParametra("farba2");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba 2. vrstvy vo formulári" });
    // mobil: živý kód po výbere sám posúva na ďalší krok — počkať, kým dobehne
    await t.pauza(t.mobil ? 900 : 250);
    return v;
  },
};

// ------------------------------------------------------------------ nový vzhľad (?novy=1 / ?novy=vyvoj)
// Karta kroku 4 (farba2.js): živý krok má triedy lcd1v-krok lcd1v-k-farba2, vzorky sú živé tlačidlá .option-button
// (trieda lcd1v-f2-vzorka, poradie cez CSS order, DOM ostáva v živom poradí), pod nimi náhľad .lcd1v-f2-nahlad.
// Ovládač kliká na to, čo zákazník vidí: hlavičku karty a vzorky farieb. Index = poradie vzorky v DOM (rovnako ako `stary`).
const SEL = `${F} .lcd1v-krok.lcd1v-k-farba2`;

export const novy = {
  meno: "novy",

  /** Karta „Farba 2. vrstvy“: klik na vzorku (index v živom poradí) -> value vo variant selecte farby 2. vrstvy; náhľad sa ukáže. */
  async vyberFarbu2(t, { index = 0 } = {}) {
    const sel = await otvorKartu(t, "farba2");
    await t.klikni(`${sel} > .options-wrap > .option-button.lcd1v-f2-vzorka`, { index, popis: "vzorka farby 2. vrstvy " + index });
    const id = await t.idParametra("farba2");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba 2. vrstvy vo formulári" });
    await t.cakaj(`(function () { var n = document.querySelector("${sel} > .lcd1v-f2-nahlad"); return !!(n && !n.hidden && n.offsetHeight > 100); })()`, { popis: "náhľad druhej vrstvy" });
    // mobil: živý kód po výbere sám posúva na ďalší krok — počkať, kým dobehne
    await t.pauza(t.mobil ? 900 : 250);
    return v;
  },

  /**
   * Stav kroku, ako ho vidí zákazník (len nový vzhľad): vzorky vo vizuálnom poradí (zhora nadol, zľava doprava),
   * zvolená, odporúčaná, náhľad, zhrnutie v hlavičke, štítok „Odporúčame“, vysvetlenie.
   */
  async stav(t) {
    return t.ev(`(function () {
      var k = document.querySelector(${JSON.stringify(SEL)});
      if (!k) return null;
      function vid(e) { var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== "none" && c.visibility !== "hidden" && !e.hidden; }
      var v = Array.prototype.filter.call(k.querySelectorAll(":scope > .options-wrap > .option-button"), vid).map(function (b) {
        var r = b.getBoundingClientRect();
        return { lux: Number(b.getAttribute("data-lcd1v-lux")), value: b.getAttribute("data-value"), top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width),
          aktivna: b.classList.contains("active"), odporucana: b.classList.contains("lcd1v-f2-odporucana"), label: b.getAttribute("aria-label") || "", text: (b.textContent || "").trim() };
      }).sort(function (a, b) { return a.top - b.top || a.left - b.left; });
      var nah = k.querySelector(":scope > .lcd1v-f2-nahlad");
      var odp = k.querySelector(":scope > .lcd1v-f2-odp");
      var vy = k.querySelector(".lcd1v-hd .lcd1v-vy");
      var vysv = k.querySelector(":scope > .lcd1v-f2-vysv");
      var info = k.querySelector(".lcd1v-f2-info");
      return {
        vzorky: v,
        nahlad: nah && vid(nah) ? { nazov: (nah.querySelector(".lcd1v-nahlad-nm") || {}).textContent || "", src: (nah.querySelector("img") || {}).src || "", v: Math.round(nah.getBoundingClientRect().height) } : null,
        odporucame: odp && vid(odp) ? { stitok: (odp.querySelector(".lcd1v-f2-odp-st") || {}).textContent || "", text: (odp.querySelector(".lcd1v-f2-odp-tx") || {}).textContent || "" } : null,
        zhrnutie: vy ? vy.textContent : null,
        vyber: k.getAttribute("data-lcd1v-vyber"),
        vysvetlenie: vysv ? { viditelne: vid(vysv), text: vysv.textContent } : null,
        info: info ? { viditelne: vid(info), expanded: info.getAttribute("aria-expanded") } : null,
        podnadpis: (k.querySelector(":scope > .lcd1v-pod") || {}).textContent || "",
        text: k.innerText || "",
        otvorena: k.classList.contains("active"),
        chyba: k.classList.contains("lcd1v-chyba"),
        chybaTx: (function () { var e = k.querySelector(":scope > .lcd1v-chyba-tx"); return e && vid(e) ? e.textContent : null; })()
      };
    })()`);
  },

  /** Otvorí kartu kroku (klik na hlavičku, ak nie je otvorená) -> selektor karty. */
  async otvor(t) {
    return otvorKartu(t, "farba2");
  },

  /** Klik na „i“ pri podnadpise (otvorí / zatvorí vysvetlenie). */
  async prepniVysvetlenie(t) {
    const sel = await otvorKartu(t, "farba2");
    await t.klikni(`${sel} .lcd1v-f2-info`, { popis: "„i“ pri farbe 2. vrstvy" });
    await t.pauza(200);
  },
};
