// Starý (živý) konfigurátor: kde sú kroky a ako sa otvárajú. Používajú ho implementácie `stary`
// v ovladac-*.mjs. JADRO — mení len vydanie (T0.2 14. 10. 2026: kroky dvojvrstvových, rohoží a boxu).
// Nový vzhľad má vlastné `novy` ovládače.
//
// Kroky živej stránky (všetko vo formulári #product-detail-form, duplikát v popise produktu sa ignoruje):
//   vzor        .content-wrap > .base-config:has(.patterns-wrap)        (K0, 3 odkazy na sesterské produkty)
//   auto        .content-wrap > .position-wrap:has(.wheel-Position)     (K1, selecty auta + volant/miesta/dvere)
//   farba       .content-wrap > .parameter-wrap.parameter-<id farby>    (K2, variant Shoptetu; rohož: posledný krok
//                                                                         s „Dokončiť konfiguráciu“; box: „Farba boxov“)
//   farba2      .content-wrap > .parameter-wrap.parameter-<id farba2>   (dvojvrstvové K3, variant Shoptetu)
//   rozlozenie  .content-wrap > .parameter-wrap.parameter-<id rozloženia> (K3, dvojvrstvové K4)
//   kufor       .upsale-Banner > .upsale-buttons.trunk                  (skrytý do výberu rozloženia)
//   boxy        .upsale-Banner > .upsale-buttons.boxs (+ .box-config)   (skrytý do výberu kufra / ďalšieho kroku)
//   pocet       .content-wrap > .parameter-wrap:has(.amount-wrap)       (box 616 K1 „Počet boxov“ 1/2/3 ks, bez name)
//   velkost     .content-wrap > .parameter-wrap:has(.parameter-sizes)   (box 616 K3 „Veľkosť“, tlačidlá 1./2./3. boxu)
import { pauza } from "./cdp.mjs";

export const F = "#product-detail-form";

export async function selKroku(t, meno) {
  switch (meno) {
    case "vzor": return `${F} .content-wrap > .base-config:has(.patterns-wrap)`;
    case "auto": return `${F} .content-wrap > .position-wrap:has(.wheel-Position)`;
    case "farba": return `${F} .content-wrap > .parameter-wrap.parameter-${await t.idParametra("farba")}`;
    case "farba2": return `${F} .content-wrap > .parameter-wrap.parameter-${await t.idParametra("farba2")}`;
    case "rozlozenie": return `${F} .content-wrap > .parameter-wrap.parameter-${await t.idParametra("rozlozenie")}`;
    case "kufor": return `${F} .upsale-buttons.trunk`;
    case "boxy": return `${F} .upsale-buttons.boxs`;
    case "pocet": return `${F} .content-wrap > .parameter-wrap:has(.amount-wrap)`;
    case "velkost": return `${F} .content-wrap > .parameter-wrap:has(.parameter-sizes)`;
    default: throw new Error("neznámy krok: " + meno);
  }
}

/** Otvorí krok akordeónu klikom na jeho hlavičku (číslo kroku), ak ešte nie je otvorený. */
export async function otvorKrok(t, meno) {
  const sel = await selKroku(t, meno);
  const q = JSON.stringify(sel);
  const aktivny = await t.ev(`(function () { var e = document.querySelector(${q}); return !!(e && e.classList.contains("active") && e.offsetHeight > 60); })()`);
  if (aktivny) return sel;
  await t.klikni(sel + " > .order", { popis: "hlavička kroku " + meno, vRamci: sel });
  await t.cakaj(`(function () { var e = document.querySelector(${q}); return !!(e && e.classList.contains("active")); })()`, { popis: "otvorený krok " + meno });
  await pauza(450); // rozbaľovanie (max-height transition)
  return sel;
}

/** Hodnota selectu parametra vo formulári ('' = nič). */
export async function hodnota(t, kluc) {
  const id = await t.idParametra(kluc);
  return t.ev(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value || ""`);
}

/** Mená krokov všetkých typov (selKroku). */
export const MENA_KROKOV = ["vzor", "auto", "farba", "farba2", "rozlozenie", "kufor", "boxy", "pocet", "velkost"];

/** Ktorý krok má červený rám (lcd-needs-fill / selection-required, drží 3 s) -> meno kroku alebo null. */
export async function cervenyKrok(t, { ms = 2500 } = {}) {
  const sely = {};
  // len kroky, ktoré formulár má (farba2 len dvojvrstvové, rozloženie nie pri rohoži a boxe …)
  for (const m of MENA_KROKOV) { try { sely[m] = await selKroku(t, m); } catch {} }
  const koniec = Date.now() + ms;
  do {
    const m = await t.ev(`(function (sely) {
      var e = document.querySelector("${F} .lcd-needs-fill, ${F} .selection-required");
      if (!e) return null;
      for (var k in sely) { try { if (e.matches(sely[k])) return k; } catch (x) {} }
      if (e.closest(".box-config")) return "boxy";
      return "iny:" + e.className;
    })(${JSON.stringify(sely)})`);
    if (m) return m;
    await pauza(100);
  } while (Date.now() < koniec);
  return null;
}

/** Cena z textu („€269“, „1 250,00 €“, „5 664 Kč“) -> číslo; rovnaké pravidlo ako lcdParsePrice v productPage.js. */
export function cislo(text) {
  let t = String(text == null ? "" : text).replace(/[^\d.,\s]/g, "").trim().replace(/\s+/g, "");
  if (!t) return NaN;
  const d = Math.max(t.lastIndexOf(","), t.lastIndexOf("."));
  if (d > -1 && t.length - d <= 3) t = t.slice(0, d);
  return Number(t.replace(/[^\d]/g, ""));
}
