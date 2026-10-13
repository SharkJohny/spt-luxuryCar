// Starý (živý, 5db0f33) konfigurátor: kde sú kroky a ako sa otvárajú. Používajú ho implementácie `stary`
// v ovladac-*.mjs. SPOLOČNÝ SÚBOR — po základe (13. 10. 2026) sa nemení. Nový vzhľad má vlastné `novy` ovládače.
//
// Kroky živej stránky (všetko vo formulári #product-detail-form, duplikát v popise produktu sa ignoruje):
//   vzor        .content-wrap > .base-config:has(.patterns-wrap)        (K0, 3 odkazy na sesterské produkty)
//   auto        .content-wrap > .position-wrap:has(.wheel-Position)     (K1, selecty auta + volant/miesta/dvere)
//   farba       .content-wrap > .parameter-wrap.parameter-<id farby>    (K2, variant Shoptetu)
//   rozlozenie  .content-wrap > .parameter-wrap.parameter-<id rozloženia> (K3)
//   kufor       .upsale-Banner > .upsale-buttons.trunk                  (skrytý do výberu rozloženia)
//   boxy        .upsale-Banner > .upsale-buttons.boxs (+ .box-config)   (skrytý do výberu kufra / ďalšieho kroku)
import { pauza } from "./cdp.mjs";

export const F = "#product-detail-form";

export async function selKroku(t, meno) {
  switch (meno) {
    case "vzor": return `${F} .content-wrap > .base-config:has(.patterns-wrap)`;
    case "auto": return `${F} .content-wrap > .position-wrap:has(.wheel-Position)`;
    case "farba": return `${F} .content-wrap > .parameter-wrap.parameter-${await t.idParametra("farba")}`;
    case "rozlozenie": return `${F} .content-wrap > .parameter-wrap.parameter-${await t.idParametra("rozlozenie")}`;
    case "kufor": return `${F} .upsale-buttons.trunk`;
    case "boxy": return `${F} .upsale-buttons.boxs`;
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

/** Ktorý krok má červený rám (lcd-needs-fill / selection-required, drží 3 s) -> meno kroku alebo null. */
export async function cervenyKrok(t, { ms = 2500 } = {}) {
  const mena = ["vzor", "auto", "farba", "rozlozenie", "kufor", "boxy"];
  const sely = {};
  for (const m of mena) sely[m] = await selKroku(t, m);
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
