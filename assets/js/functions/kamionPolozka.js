// Rozpoznanie produktu kamiónov a dodávok (640 / 2452 a ich kópie: skrytá s logami, stránky kamiónov, stránky dodávok)
// v košíku, v objednávke, na ďakovnej stránke a pri pridaní do košíka. JEDNO miesto pre všetky detektory (13. 11. 2026,
// kniha Brain napady/2026-11-11-kamiony-vsetky-ulohy.md §2.1 otvorený bod „dodávky“): components/cart.js,
// functions/autoPamat.js, functions/poznamkaObjednavky.js, opc/kamionKarta.js (-> opc/kosikKarta.js), opc/krok2.js,
// opc/vzhlad.js, opc/dakujeme.js, lcdKosikDoplnok.js. Súbor je bez importov.
//
// Pravidlo pre admin (každá kópia 640 / 2452 musí splniť všetky tri, detektory berú ktorýkoľvek znak):
//   kód produktu   samostatné slovo TRUCK (TEST-TRUCK, TRUCK, TRUCK-LOGA, TRUCK-SCANIA-R, TRUCK-FIAT-DUCATO …)
//   adresa         obsahuje „kamion“ (/luxusne-autokoberce-kamiony/, /autokoberce-do-kamionu-scania-r/), alebo je to
//                  stránka dodávky /autokoberce-do-dodavky-<model>/
//   názov          obsahuje „kamión“ / „kamion“, alebo „Autokoberce do dodávky …“ (SK aj CZ rovnako)
// Osobné autá: kód nikdy nemá slovo TRUCK, adresa nemá „kamion“ ani „autokoberce-do-dodavky“, názov nemá „kamión“ ani
// „autokoberce do dodávky“ — pre ne sa nič nemení (tools/test-kamion-detekcia.mjs).

const RE_KOD = /\btruck\b/i;
const RE_ADRESA = /kamion|autokoberce-do-dodavky/i;
const RE_NAZOV = /kami[oó]n|autokoberce\s+do\s+dod[aá]vky/i;

/** Kód produktu (data-micro-sku, dataLayer code) patrí kamiónu / dodávke? */
export function jeKamionKod(kod) {
  return RE_KOD.test(String(kod == null ? "" : kod));
}

/** Adresa produktu (href položky, location.pathname) patrí kamiónu / dodávke? */
export function jeKamionAdresa(adresa) {
  return RE_ADRESA.test(String(adresa == null ? "" : adresa));
}

/** Názov produktu patrí kamiónu / dodávke? (bez slova „truck“ — to je znak kódu a starého názvu, pozri jeKamionText) */
export function jeKamionNazov(nazov) {
  return RE_NAZOV.test(String(nazov == null ? "" : nazov));
}

/** Text riadku košíka / názov položky: slovo „truck“ (starý názov produktu) alebo názov kamiónu / dodávky. */
export function jeKamionText(text) {
  const t = String(text == null ? "" : text);
  return RE_KOD.test(t) || RE_NAZOV.test(t);
}

/** Položka { sku, href, text } je kamión / dodávka podľa ktoréhokoľvek znaku? */
export function jeKamionPolozka(p) {
  return !!p && (jeKamionKod(p.sku) || jeKamionAdresa(p.href) || jeKamionText(p.text));
}
