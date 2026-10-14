// Ovládač krokov 1–3 (vzor, auto, farba) + výzva na auto a červený rám. VLASTNÍK: worker „kroky“
// (assets/js/components/konfigurator1v/kroky.js + assets/css/_lcd1v-kroky.scss). Kontrakt: docs/1v-kontrakt.md.
//
// `stary` = živý konfigurátor (nemeniť, je to referencia). `novy` = nový vzhľad pod body.lcd-1v; kým je null,
// test s --novy použije `stary` (stuby nič nemenia). Metódy vracajú to, čo je napísané pri nich.
import { pauza } from "./cdp.mjs";
import { F, selKroku, otvorKrok, hodnota, cervenyKrok } from "./stary-ui.mjs";

export const stary = {
  meno: "stary",

  /** Vyberie auto ({ znacka, model, rok, typ } = texty možností) -> sessionStorage.model („Audi A6 2015 Combi“). */
  async vyberAuto(t, a) {
    await otvorKrok(t, "auto");
    const w = `${F} .modl-selector-wrap`;
    await t.nastavSelect(`${w} .brands select`, a.znacka);
    await t.cakaj(`document.querySelector("${w} .models select").options.length > 1`, { popis: "zoznam modelov" });
    await t.nastavSelect(`${w} .models select`, a.model);
    await t.nastavSelect(`${w} .years select`, a.rok);
    await t.nastavSelect(`${w} .type-selector select`, a.typ);
    return t.ev(`sessionStorage.getItem("model")`);
  },

  /** Vyberie farbu 1. vrstvy (index viditeľnej voľby) -> value vo variant selecte farby. */
  async vyberFarbu(t, { index = 0 } = {}) {
    const sel = await otvorKrok(t, "farba");
    await t.klikni(`${sel} .option-button`, { index, popis: "farba " + index });
    const id = await t.idParametra("farba");
    return t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba vo formulári" });
  },

  /** Zákazník bez auta skúsi pokračovať (klik na krok farby) -> { vyzva: true/false } (okno „vyberte model“). */
  async skusBezAuta(t) {
    const sel = await selKroku(t, "farba");
    await t.klikni(`${sel} > .order`, { popis: "hlavička farby bez auta", vRamci: sel });
    const vyzva = await t.cakaj(`!!(function () { var o = document.querySelector(".overflow"); return o && o.offsetHeight > 0 && o.querySelector("h3"); })()`, { ms: 3000 }).catch(() => false);
    return { vyzva: !!vyzva };
  },

  /** Zavrie výzvu na auto. */
  async zavriVyzvu(t) {
    await t.klikni(".overflow button.btn", { popis: "Rozumiem vo výzve" });
    await t.cakaj(`!document.querySelector(".overflow")`, { ms: 3000, popis: "zatvorené okno výzvy" });
    await pauza(300);
  },

  /** Krok s červeným rámom po neúspešnom „Pridať do košíka“ -> "auto" | "farba" | "rozlozenie" | … | null. */
  cervenyKrok,

  /** Hodnota parametra vo formulári (pomocník pre scenáre). */
  hodnota,

  /**
   * Klik na tlačidlo na konci kroku `meno` (otvorí ho, ak je zbalený) -> text tlačidla.
   * Starý web (T0.2, 14. 10. 2026): na poslednom kroku rohože „Dokončiť konfiguráciu“ a boxu „Prejsť k ďalšiemu
   * kroku“ (configuratorEngine.js: posledný krok = klik na „Pridať do košíka“ -> POST, ak je všetko vyplnené).
   */
  async dokonci(t, meno) {
    const sel = await otvorKrok(t, meno);
    const tl = `${sel} > .next-step-button`;
    const text = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(tl)}); return b ? b.textContent.trim() : null; })()`);
    await t.klikni(tl, { popis: "tlačidlo kroku " + meno + " „" + text + "“" });
    return text;
  },
};

// ------------------------------------------------------------------ nový vzhľad (?novy=1)
// Karty krokov (assets/js/components/konfigurator1v/kroky.js): živý krok má triedy lcd1v-krok lcd1v-k-<meno>,
// hlavička je button.lcd1v-hd (živý .order je cez ňu priehľadne roztiahnutý: klik = živý akordeón), otvorený krok
// = živá trieda .active, červený rám = trvalá trieda lcd1v-chyba (zo živej validácie .lcd-needs-fill, drží, kým krok
// nie je vyplnený). Ovládač kliká len na to, čo zákazník vidí: hlavičku karty, polia auta, vzorky farieb.
const selNovy = (meno) => `${F} .lcd1v-krok.lcd1v-k-${meno}`;

/** Otvorí kartu kroku klikom na jej hlavičku (ak nie je otvorená); bez auta zavrie výzvu „vyberte model“. */
export async function otvorKartu(t, meno) {
  const sel = selNovy(meno);
  const q = JSON.stringify(sel);
  const jeOtvorena = `(function () { var e = document.querySelector(${q}); return !!(e && e.classList.contains("active")); })()`;
  if (await t.ev(jeOtvorena)) return sel;
  await t.klikni(sel + " > .lcd1v-hd", { popis: "hlavička karty " + meno, vRamci: sel });
  await t.cakaj(jeOtvorena, { popis: "otvorená karta " + meno });
  await pauza(250);
  return sel;
}

/** Karta s červeným rámom (nový vzhľad: trvalá lcd1v-chyba; okno boxov: živé .lcd-needs-fill v .box-config). */
async function cervenyKrokNovy(t, { ms = 2500 } = {}) {
  // všetky mená kariet z TYPY[*].kroky (produkty.js): jedno, dvoj (+farba2), rohože do kufra, box 616 (pocet, velkost)
  const mena = ["vzor", "auto", "farba", "farba2", "rozlozenie", "kufor", "boxy", "pocet", "velkost"];
  const koniec = Date.now() + ms;
  do {
    const m = await t.ev(`(function (mena) {
      var f = document.getElementById("product-detail-form");
      var e = f.querySelector(".lcd1v-krok.lcd1v-chyba") || f.querySelector(".box-config .lcd-needs-fill, .box-config .selection-required");
      if (!e) return null;
      for (var i = 0; i < mena.length; i++) if (e.classList.contains("lcd1v-k-" + mena[i])) return mena[i];
      if (e.closest(".box-config")) return "boxy";
      return "iny:" + e.className;
    })(${JSON.stringify(mena)})`);
    if (m) return m;
    await pauza(100);
  } while (Date.now() < koniec);
  return null;
}

export const novy = {
  meno: "novy",

  /** Karta „Vaše auto“: natívne selecty (preštýlované biele polia) -> sessionStorage.model. */
  async vyberAuto(t, a) {
    const sel = await otvorKartu(t, "auto");
    const w = `${sel} .modl-selector-wrap`;
    await t.cakaj(`(function () { var s = document.querySelector("${w} .lcd1v-pole.brands select"); return !!(s && s.getBoundingClientRect().height > 30); })()`, { popis: "viditeľné pole Značka" });
    await t.nastavSelect(`${w} .brands select`, a.znacka);
    await t.cakaj(`document.querySelector("${w} .models select").options.length > 1`, { popis: "zoznam modelov" });
    await t.nastavSelect(`${w} .models select`, a.model);
    await t.nastavSelect(`${w} .years select`, a.rok);
    await t.nastavSelect(`${w} .type-selector select`, a.typ);
    // nový vzhľad: zhrnutie auta v hlavičke karty + pás kompatibility nad krokmi
    await t.cakaj(`(function () { var k = document.querySelector(".lcd1v-kompat"); return !!(k && !k.hidden && k.offsetHeight > 0); })()`, { popis: "pás kompatibility s autom" });
    return t.ev(`sessionStorage.getItem("model")`);
  },

  /** Karta „Farba koberca“: klik na vzorku (index viditeľnej) -> value vo variant selecte farby; náhľad sa ukáže. */
  async vyberFarbu(t, { index = 0 } = {}) {
    const sel = await otvorKartu(t, "farba");
    await t.klikni(`${sel} > .options-wrap > .option-button`, { index, popis: "vzorka farby " + index });
    const id = await t.idParametra("farba");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba vo formulári" });
    await t.cakaj(`(function () { var n = document.querySelector("${sel} > .lcd1v-nahlad"); return !!(n && !n.hidden && n.offsetHeight > 100); })()`, { popis: "náhľad farby" });
    return v;
  },

  /** Bez auta klik na hlavičku karty farby -> { vyzva } (živé okno „vyberte model“ z validation.js). */
  async skusBezAuta(t) {
    const sel = selNovy("farba");
    await t.klikni(sel + " > .lcd1v-hd", { popis: "hlavička karty farby bez auta", vRamci: sel });
    const vyzva = await t.cakaj(`!!(function () { var o = document.querySelector(".overflow"); return o && o.offsetHeight > 0 && o.querySelector("h3"); })()`, { ms: 3000 }).catch(() => false);
    return { vyzva: !!vyzva };
  },

  /** Zavrie výzvu na auto (okno je živé, rovnaké ako v starom vzhľade). */
  zavriVyzvu: stary.zavriVyzvu,

  /** Karta s červeným rámom -> "auto" | "farba" | "rozlozenie" | … | null. */
  cervenyKrok: cervenyKrokNovy,

  hodnota,
};
