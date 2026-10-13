// Ovládač vzorkovníka 637 (45 príplatkových selectov, 1 vzorka = 1 parameter „Nechcem +€0“ / „Áno +€5“).
// VLASTNÍK `novy`: worker vzorkovníka (T5.1). `stary` = živý web (referencia, nemeniť, T0.2 14. 10. 2026).
// Kým je `novy` null, --novy/--vyvoj použije `stary`.
//
// Živý web (assets/js/vzorky-konfigurator/index.js): natívne riadky .surcharge-list sú skryté, nad nimi akordeóny
// .lcd-vz-acc (Diamond / Stripe / Hexa / 2. vrstva), dlaždica .lcd-vz-swatch[data-id="D-3"] prepne select
// s data-parameter-name="D-3" na „Áno“ / „Nechcem“; LUX okrem LUX-10 sú len náhľad (.lcd-vz-swatch--preview).
// Rekapitulácia .lcd-vz-recap-total = „Vratná záloha spolu“.
import { pauza } from "./cdp.mjs";
import { F, cislo } from "./stary-ui.mjs";

const ANO = "^(áno|ano|chcem)\\b";

/** Select vzorky podľa ID vzorky (data-parameter-name, napr. „D-3“) -> { id, ano } (id parametra, value „Áno“). */
export async function selectVzorky(t, idVzorky) {
  const r = await t.ev(`(function () {
    var s = Array.prototype.find.call(document.querySelectorAll("${F} select.surcharge-parameter"), function (s) { return (s.getAttribute("data-parameter-name") || "").trim() === ${JSON.stringify(idVzorky)}; });
    if (!s) return null;
    var re = new RegExp(${JSON.stringify(ANO)}, "i");
    var o = Array.prototype.find.call(s.options, function (o) { return o.value && re.test(o.text.trim()); });
    return { id: s.getAttribute("data-parameter-id"), ano: o ? o.value : null };
  })()`);
  if (!r) throw new Error("vzorka " + idVzorky + " vo formulári nie je (select data-parameter-name)");
  if (!r.ano) throw new Error("vzorka " + idVzorky + ": voľba „Áno / Chcem“ chýba");
  return r;
}

export const stary = {
  meno: "stary",

  /** Vyberie vzorky (ID z návrhu: „D-3“, „S-2“, „LUX-10“) -> { hodnoty: { <id parametra>: value „Áno“ }, pocet }. */
  async vyberVzorky(t, idcka) {
    const hodnoty = {};
    for (const idV of idcka) {
      const s = await selectVzorky(t, idV);
      const dl = `.lcd-vz-swatch[data-id="${idV}"]:not(.lcd-vz-swatch--preview)`;
      const ak = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(dl)}); if (!b) return null; var a = b.closest(".lcd-vz-acc");
        return { i: Array.prototype.indexOf.call(document.querySelectorAll(".lcd-vz-acc"), a), otvoreny: a.classList.contains("is-open") }; })()`);
      if (!ak) throw new Error("dlaždica vzorky " + idV + " nie je (alebo je len náhľad)");
      if (!ak.otvoreny) { await t.klikni(".lcd-vz-acc .lcd-vz-acc-head", { index: ak.i, popis: "akordeón vzoriek " + ak.i }); await pauza(450); }
      await t.klikni(dl, { popis: "vzorka " + idV });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${s.id}"]') || {}).value === "${s.ano}"`, { ms: 3000, popis: "vzorka " + idV + " vo formulári" });
      hodnoty[s.id] = s.ano;
    }
    await pauza(400);
    return { hodnoty, pocet: await stary.pocet(t) };
  },

  /** Počet vzoriek s voľbou „Áno / Chcem“ vo formulári. */
  async pocet(t) {
    return t.ev(`(function () { var re = new RegExp(${JSON.stringify(ANO)}, "i"); return Array.prototype.filter.call(document.querySelectorAll("${F} select.surcharge-parameter"), function (s) { var o = s.options[s.selectedIndex]; return !!(s.value && o && re.test(o.text.trim())); }).length; })()`);
  },

  /** „Vratná záloha spolu“ v rekapitulácii (číslo, € ) alebo NaN. */
  async zaloha(t) {
    return cislo(await t.ev(`(document.querySelector(".lcd-vz-recap-total") || {}).textContent || ""`));
  },
};

/** Nový vzhľad (T5.1): rovnaké metódy a návratové hodnoty ako `stary`. */
export const novy = null;
