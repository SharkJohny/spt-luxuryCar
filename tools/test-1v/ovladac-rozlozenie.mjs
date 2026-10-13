// Ovládač kroku 4 (rozloženie kobercov). VLASTNÍK: worker „rozlozenie“
// (assets/js/components/konfigurator1v/rozlozenie.js + assets/css/_lcd1v-rozlozenie.scss). Kontrakt: docs/1v-kontrakt.md.
// `stary` = živý konfigurátor (referencia, nemeniť). `novy` = nový vzhľad; kým je null, --novy použije `stary`.
import { F, otvorKrok } from "./stary-ui.mjs";

export const stary = {
  meno: "stary",

  /** Vyberie rozloženie (index: 0 = len 1. rad, 1 = 1.+2. rad, 2 = všetky tri rady) -> value v selecte rozloženia. */
  async vyberRozlozenie(t, { index = 0 } = {}) {
    const sel = await otvorKrok(t, "rozlozenie");
    await t.klikni(`${sel} .option-button`, { index, popis: "rozloženie " + index });
    const id = await t.idParametra("rozlozenie");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "rozloženie vo formulári" });
    // mobil: živý kód po 350 ms sám zbalí rozloženie a otvorí kufor (configuratorEngine.js, K3 auto-postup, zámok do 700 ms)
    // — počkať, kým dobehne, inak by sa klik na hlavičku kufra s ním pobil
    await t.pauza(t.mobil ? 1200 : 300);
    return v;
  },
};

/** Nový vzhľad (?novy=1): karty s fotkami v kroku 4 (assets/js/components/konfigurator1v/rozlozenie.js). */
const RZ = `${F} .lcd1v-rz`;

/** Otvorí krok 4 tak, ako to urobí zákazník: klik na viditeľnú hlavičku kroku (číslo / názov). */
export async function otvorKrok4(t) {
  const id = await t.idParametra("rozlozenie");
  const sel = `${F} .content-wrap > .parameter-wrap.parameter-${id}`;
  const q = JSON.stringify(sel);
  const otvoreny = `(function () { var e = document.querySelector(${q}); var r = document.querySelector(${JSON.stringify(RZ + " .rz-karty")});
    return !!(e && e.classList.contains("active") && r && r.getBoundingClientRect().height > 60 && e.getBoundingClientRect().bottom > r.getBoundingClientRect().top + 60); })()`;
  if (await t.ev(otvoreny)) return sel;
  // hlavičku kreslí worker „kroky“ (button.lcd1v-hd; živý .order je cez ňu priehľadne roztiahnutý): prvá viditeľná
  // z kandidátov; zásah čohokoľvek v rámci kroku je v poriadku (vRamci)
  const hlavicka = await t.ev(`(function (sel) {
    var k = [sel + " > .lcd1v-hd", sel + " > .order", sel + " > .name-wrap h5", sel + " > .name-wrap", sel + " h5"];
    for (var i = 0; i < k.length; i++) { var e = document.querySelector(k[i]); if (e) { var r = e.getBoundingClientRect(); var s = getComputedStyle(e);
      if (r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity || "1") > 0.05) return k[i]; } }
    return null; })(${q})`);
  if (!hlavicka) throw new Error("krok 4: viditeľná hlavička kroku nie je");
  await t.klikni(hlavicka, { popis: "hlavička kroku 4", vRamci: sel });
  await t.cakaj(otvoreny, { popis: "otvorený krok 4 s kartami" });
  await t.pauza(450); // rozbaľovanie
  return sel;
}

export const novy = {
  meno: "novy",

  /** Vyberie rozloženie kartou nového vzhľadu (index: 0 = len 1. rad, 1 = 1.+2. rad, 2 = všetky tri rady) -> value v selecte. */
  async vyberRozlozenie(t, { index = 0 } = {}) {
    await otvorKrok4(t);
    const rady = index + 1;
    const karta = `${RZ} .rz-karta[data-rady="${rady}"]`;
    const kartaVidno = `(function () { var e = document.querySelector(${JSON.stringify(karta)}); return !!(e && e.offsetHeight > 0); })()`;
    if (rady === 3 && !(await t.ev(kartaVidno))) {
      // „Všetky tri rady“ sa ukáže len pri aute s 3. radom: 7 miest dlaždicou v kroku 4 (zrkadlo dlaždíc kroku 2)
      await t.klikni(`${RZ} .rz-dlazdice button[data-v="7"]`, { popis: "7 miest (krok 4)" });
      await t.cakaj(`!!document.querySelector('${F} .sit-Position .option-button.active[data-value="pass-7"]')`, { popis: "7 miest aj v kroku 2" });
      await t.cakaj(kartaVidno, { popis: "karta „Všetky tri rady“ po 7 miestach" });
    }
    await t.klikni(karta, { popis: "rozloženie " + index });
    const id = await t.idParametra("rozlozenie");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "rozloženie vo formulári" });
    const hodnotaKarty = await t.ev(`document.querySelector(${JSON.stringify(karta)}).getAttribute("data-hodnota")`);
    if (v !== hodnotaKarty) throw new Error("rozloženie: select " + v + " ≠ karta " + hodnotaKarty);
    // karta označená, pôdorys rozsvietil zvolené rady
    await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(karta)}); var r = document.querySelector(${JSON.stringify(RZ)});
      return k.classList.contains("on") && k.getAttribute("aria-pressed") === "true" && r.getAttribute("data-rady") === "${rady}"; })()`, { popis: "označená karta a pôdorys " + rady });
    // mobil: živý kód po 350 ms sám zbalí rozloženie a otvorí kufor (configuratorEngine.js) — počkať, kým dobehne
    await t.pauza(t.mobil ? 1200 : 300);
    return v;
  },
};
