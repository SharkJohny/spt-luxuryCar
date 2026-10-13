// Ovládač produktu „Box do kufra“ (616): počet boxov 1–3, farba (variant 78), veľkosť každého boxu.
// VLASTNÍK `novy`: worker boxy (T3.2, assets/js/components/konfigurator1v/boxy-produkt.js). `stary` = živý web
// (referencia, nemeniť, T0.2 14. 10. 2026). Kým je `novy` null, --novy/--vyvoj použije `stary`.
//
// Živý web (creatButtons.js amountChoser + productPage.js):
//   K1 „Počet boxov“  .content-wrap > .parameter-wrap:has(.amount-wrap)  — .amount-button „1 ks / 2 ks / 3 ks“ bez name,
//                     predvolene aktívne „2 ks“; klik volá resetBoxSizeOptions (1 ks vynuluje VŠETKY veľkosti, 2/3 ks
//                     len skryté) a neexistujúcu priceActualization (výnimka v konzole — chyba živého webu)
//   K2 „Farba boxov“  .content-wrap > .parameter-wrap.parameter-<id farba>  (variant, priceId)
//   K3 „Veľkosť“      .content-wrap > .parameter-wrap:has(.parameter-sizes) — v ňom .parameter-sizes[data-parameterid=<id>]
//                     pre 1./2./3. box (príplatky 94/97/100), tlačidlá .option-button[data-value]
//   Skrytý box dostane .val(0) -> select bez voľby „0“ -> selectedIndex -1 -> kľúč v POST chýba.
import { pauza } from "./cdp.mjs";
import { F, otvorKrok, hodnota } from "./stary-ui.mjs";

const KLUCE = ["box1", "box2", "box3"];
const vzorVelkosti = (v) => new RegExp("^" + v + "\\s*:", "i");

async function hodnoty(t) {
  const o = {};
  for (const k of KLUCE) o[k] = (await t.maParameter(k)) ? await hodnota(t, k) : "";
  return o;
}

export const stary = {
  meno: "stary",

  /** Klik na „n ks“ -> n (aktívne tlačidlo počtu). */
  async vyberPocet(t, n) {
    const sel = await otvorKrok(t, "pocet");
    await t.klikni(`${sel} .amount-wrap .amount-button`, { index: n - 1, popis: n + " ks" });
    await t.cakaj(`(function () { var a = document.querySelector(${JSON.stringify(sel + " .amount-button.active")}); return !!(a && a.textContent.trim().indexOf("${n}") === 0); })()`, { ms: 3000, popis: "aktívne " + n + " ks" });
    await pauza(300);
    return stary.pocet(t);
  },

  /** Aktívny počet boxov (číslo z „n ks“) alebo null. */
  async pocet(t) {
    const txt = await t.ev(`(function () { var a = document.querySelector("${F} .content-wrap .amount-wrap .amount-button.active"); return a ? a.textContent.trim() : ""; })()`);
    const n = parseInt(txt, 10);
    return Number.isFinite(n) ? n : null;
  },

  /** Farba boxov (index viditeľnej vzorky) -> value vo variant selecte farby. */
  async vyberFarbu(t, { index = 0 } = {}) {
    const sel = await otvorKrok(t, "farba");
    await t.klikni(`${sel} .option-button`, { index, popis: "farba boxov " + index });
    const id = await t.idParametra("farba");
    return t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba boxov vo formulári" });
  },

  /** Veľkosti 1., 2., 3. boxu (["S","L"] …) -> { box1, box2, box3 } hodnoty selectov po výbere. */
  async vyberVelkosti(t, velkosti) {
    const sel = await otvorKrok(t, "velkost");
    for (let i = 0; i < velkosti.length; i++) {
      const kluc = KLUCE[i];
      const id = await t.idParametra(kluc);
      const val = await t.moznost(kluc, vzorVelkosti(velkosti[i]));
      await t.klikni(`${sel} .parameter-sizes[data-parameterid="${id}"] .option-button[data-value="${val}"]`, { popis: (i + 1) + ". box " + velkosti[i] });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 3000, popis: (i + 1) + ". box vo formulári" });
    }
    await pauza(300);
    return hodnoty(t);
  },

  /** Hodnoty selectov veľkostí { box1, box2, box3 } ('' = nevybrané alebo bez voľby). */
  hodnoty,
};

/** Nový vzhľad (worker boxy, T3.2): rovnaké metódy a návratové hodnoty ako `stary`. */
export const novy = null;
