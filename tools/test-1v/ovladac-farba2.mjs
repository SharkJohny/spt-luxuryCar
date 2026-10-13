// Ovládač kroku „Farba 2. vrstvy“ (dvojvrstvové 601/604/607). VLASTNÍK `novy`: worker dvoj (T1.2,
// assets/js/components/konfigurator1v/farba2.js). `stary` = živý web (referencia, nemeniť, T0.2 14. 10. 2026).
// Kým je `novy` null, --novy/--vyvoj použije `stary`.
//
// Živý web: krok .content-wrap > .parameter-wrap.parameter-<id farba2> (K3 dvojvrstvových, 16 × Lux Color),
// variant Shoptetu: spolu s farbou 1. vrstvy určuje priceId (necessaryVariantData „71-<lux>-78-<farba>“).
import { F, otvorKrok } from "./stary-ui.mjs";

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

/** Nový vzhľad (worker dvoj, T1.2): rovnaké metódy a návratové hodnoty ako `stary`. */
export const novy = null;
