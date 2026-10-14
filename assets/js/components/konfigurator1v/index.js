// Nový vzhľad konfigurátora jednovrstvových autokobercov podľa návrhu v26 — TICHÝ TEST (Michal 13. 10. 2026).
// SPOLOČNÝ SÚBOR — po základe sa nemení. Moduly patria workerom (docs/1v-kontrakt.md, „Vlastníctvo súborov“).
//
// Brána: beží LEN na produktoch zo ZOZNAM_1V (dnes SK Diamond Line: projekt 562035, produkt 598) a LEN keď návštevník
// otvoril stránku s ?novy=1 (zapne sessionStorage lcd1v=1 pre túto kartu; ?novy=0 vypne). Inak sa nič nemení:
// žiadna trieda na body, žiadny handler (všetko CSS 1V platí len pod body.lcd-1v).
// Zlyhá init niektorého modulu -> trieda lcd-1v sa zloží, zákazník vidí starý vzhľad (chyby v window.__lcd1v.chyby).
import { getShoptetContext } from "../../functions/shoptetContext.js";
import { vytvorCtx } from "./ctx.js";
import * as kroky from "./kroky.js";
import * as rozlozenie from "./rozlozenie.js";
import * as kuforBoxy from "./kufor-boxy.js";
import * as cena from "./cena.js";
import * as obsah from "./obsah.js"; // obsah pod konfigurátorom (statické HTML z adminu), docs/1v-obsah.md

/** projectId Shoptetu -> produkty s novým vzhľadom (ID produktov sa medzi SK a CZ obchodom líšia). */
export const ZOZNAM_1V = { 562035: [598] };
export const KLUC_FLAGU = "lcd1v";
export const TRIEDA = "lcd-1v";

/** ?novy=1 zapne, ?novy=0 vypne (sessionStorage karty). Bez parametra nič. */
export function prepinac(search) {
  const m = /[?&]novy=([01])(?:[&#]|$)/.exec(search || "");
  if (!m) return;
  try {
    if (m[1] === "1") sessionStorage.setItem(KLUC_FLAGU, "1");
    else sessionStorage.removeItem(KLUC_FLAGU);
  } catch (e) { /* súkromný režim: flag sa nedá uložiť -> nový vzhľad sa nezapne */ }
}

export function jeZapnute() {
  try { return sessionStorage.getItem(KLUC_FLAGU) === "1"; } catch (e) { return false; }
}

export function jeProdukt1v(kontext) {
  const zoznam = ZOZNAM_1V[String(kontext.projectId)];
  return !!zoznam && zoznam.indexOf(Number(kontext.productId)) > -1;
}

/** Volá main.js po postavení živého konfigurátora (initProduct … initConfiguratorEngine, initLivePrice). */
export function initKonfigurator1v(setupData, texts) {
  try {
    prepinac(window.location.search);
    const kontext = getShoptetContext();
    if (!jeProdukt1v(kontext) || !jeZapnute()) return null;
    const form = document.getElementById("product-detail-form");
    if (!form || !form.querySelector(".content-wrap")) return null; // živý konfigurátor sa nepostavil -> nič
    document.body.classList.add(TRIEDA);
    const ctx = vytvorCtx({ setupData, texts, kontext });
    window.__lcd1v = ctx; // ladenie + test (tools/test-konfigurator-1v.mjs)
    [kroky, rozlozenie, kuforBoxy, cena, obsah].forEach(function (modul) {
      try {
        modul.init(ctx);
      } catch (e) {
        ctx.chyby.push(modul.MENO + ": " + ((e && e.message) || e));
        console.error("[lcd-1v] " + modul.MENO, e);
      }
    });
    if (ctx.chyby.length) document.body.classList.remove(TRIEDA);
    return ctx;
  } catch (e) {
    try { document.body.classList.remove(TRIEDA); } catch (x) {}
    return null;
  }
}
