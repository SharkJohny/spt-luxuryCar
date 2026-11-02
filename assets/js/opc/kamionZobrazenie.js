// Kamión 640 / 2452: hodnoty súhrnu konfigurátora a príplatkov riadku košíka na zobrazenie zákazníkovi (karta pokladne
// opc/kamionKarta.js aj klasický košík components/cart.js). Len zobrazenie — súhrn v sessionStorage (poznámka objednávky,
// Jánov export) sa nemení. Živá kontrola 2. 11. 2026: CZ konfigurátor píše do súhrnu slovenské hodnoty („Prémiová syntetická
// koža – prešívaná“, „Automatická prevodovka“, „Sedadlo spolujazdca odpružené“), Shoptet 2452 má „kůže – prošívaná“.
import { truckSummaryTexts } from "../truck-konfigurator/order-summary.mjs";
import { SELECTY, normalizeOptionText } from "../components/konfigurator1v/kamion/shoptet.js";
import { TEXTY_CS } from "../components/konfigurator1v/kamion/texty-cs.js";

export const cisty = (t) => String(t == null ? "" : t).normalize("NFC").replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
/** „Vyberie sa v konfigurátore“ / „Vybere se v konfigurátoru“ = hodnota, ktorú admin ešte nemá (shoptet.js najdiZastupnuMoznost). */
export const zastupna = (t) => /\bv konfiguratoru$/.test(normalizeOptionText(t));
export const ANO = (t) => /^(ano|áno)\b/i.test(cisty(t));
export const ROVNAKE = (t) => /^(rovnak|stejn)/i.test(cisty(t));
export const KOBERCE = /^KOBER/i;
export const DVERE = /^TAPAC[IÍ]R DVE/i;

/**
 * Text príplatkov riadku košíka („Príplatky: Typ materiálu - …, Farba materiálu - …“) -> { kľúč SELECTY: hodnota }. Delí sa
 * podľa presných mien parametrov (SK aj CZ), nie podľa čiarky — hodnota „čierna, čierne šitie – 11“ má čiarku vo vnútri.
 */
export function hodnotyPriplatkov(sur) {
  const t = cisty(sur).replace(/^p[rř][ií]platky\s*:\s*/i, "");
  const tn = t.toLowerCase();
  if (!t || tn.length !== t.length) return {};
  const najdene = [];
  Object.keys(SELECTY).forEach(function (k) {
    let prvy = null;
    SELECTY[k].forEach(function (meno) {
      const kluc = meno.toLowerCase() + " - ";
      let i = tn.indexOf(kluc);
      while (i >= 0 && !(i === 0 || tn.slice(i - 2, i) === ", ")) i = tn.indexOf(kluc, i + 1);
      if (i >= 0 && (!prvy || i < prvy.zac)) prvy = { k: k, zac: i, hod: i + kluc.length };
    });
    if (prvy) najdene.push(prvy);
  });
  najdene.sort(function (a, b) { return a.zac - b.zac; });
  const out = {};
  najdene.forEach(function (a, i) {
    const b = najdene[i + 1];
    const h = cisty(t.slice(a.hod, b ? b.zac - 2 : t.length));
    if (h && !zastupna(h)) out[a.k] = h;
  });
  return out;
}

/** Vozidlo pre zákazníka ako v konfigurátore (data.js meno): bez „(TIR)“ / „(dodávka)“, roky s pomlčkou „2022–2025“. Poznámka objednávky ostáva bez zmeny. */
export const vozidloNaZobrazenie = (t) => cisty(t).replace(/\s*\((TIR|dodávka)\)/gi, "").replace(/(\d{4})\s*-\s*(\d{4})/g, "$1–$2");

/** CZ: výbava vozidla zo súhrnu („Automatická prevodovka“) ako ju ukazuje CZ konfigurátor („Automatická“) — texty-cs.js polia.*.moznosti. */
const VYBAVA_CS = (function () {
  const m = {};
  (function prejdi(o, hlbka) {
    if (!o || typeof o !== "object" || hlbka > 6) return;
    Object.keys(o).forEach(function (k) {
      const x = o[k];
      if (k === "polia" && x && typeof x === "object") {
        Object.keys(x).forEach(function (pole) {
          const mo = x[pole] && x[pole].moznosti;
          if (mo && typeof mo === "object") Object.keys(mo).forEach(function (sk) { if (typeof mo[sk] === "string") m[sk] = mo[sk]; });
        });
      } else prejdi(x, hlbka + 1);
    });
  })(TEXTY_CS, 0);
  return m;
})();

/**
 * Materiál zo súhrnu s typom materiálu z príplatku Shoptetu: CZ súhrn „Prémiová syntetická koža – prešívaná – černá…“ +
 * príplatok „Prémiová syntetická kůže – prošívaná“ -> „Prémiová syntetická kůže – prošívaná – černá…“. Nesedí -> bez zmeny.
 */
export function materialNaZobrazenie(hodnota, material) {
  if (!material) return hodnota;
  const casti = String(hodnota).split(" – ");
  const ciel = normalizeOptionText(material);
  for (let k = 1; k <= casti.length; k++) {
    if (normalizeOptionText(casti.slice(0, k).join(" – ")) === ciel) return [cisty(material)].concat(casti.slice(k)).join(" – ");
  }
  return hodnota;
}

/**
 * Skupiny súhrnu (parseTruckOrderSummary) s hodnotami na zobrazenie: vozidlo bez „(TIR)“, typ materiálu koberčekov a vlastného
 * materiálu tapacíru z príplatku Shoptetu (aj za „Rovnaký ako koberce – …“), na CZ výbava vozidla ako CZ konfigurátor.
 * sur = text príplatkov riadku košíka (môže chýbať). Vracia nové objekty, vstup sa nemení.
 */
export function skupinyNaZobrazenie(skupiny, jazyk, sur) {
  const cs = jazyk === "cs";
  const L = truckSummaryTexts(cs ? "cs" : "sk").labels;
  const v = sur ? hodnotyPriplatkov(sur) : {};
  const tapMaterial = v.tapMaterial && !ROVNAKE(v.tapMaterial) ? v.tapMaterial : null;
  return (skupiny || []).map(function (g) {
    const koberce = KOBERCE.test(g.heading), dvere = DVERE.test(g.heading);
    return {
      heading: g.heading,
      items: g.items.map(function (i) {
        let h = i.value;
        if (i.label === L.vehicle) h = vozidloNaZobrazenie(h);
        else if (i.label === L.materialColor && (koberce || dvere)) {
          if (dvere && ROVNAKE(h)) {
            const c = String(h).split(" – ");
            if (c.length > 1) h = c[0] + " – " + materialNaZobrazenie(c.slice(1).join(" – "), v.material);
          } else h = materialNaZobrazenie(h, dvere ? tapMaterial : v.material);
        } else if (cs && VYBAVA_CS[cisty(h)]) h = VYBAVA_CS[cisty(h)];
        return { label: i.label, value: h };
      }),
    };
  });
}
