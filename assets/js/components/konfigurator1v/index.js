// Nový vzhľad konfigurátora podľa návrhov (jednovrstvové v26, dvojvrstvové, rohože do kufra, box) — TICHÝ TEST.
// JADRO — mení len vydanie (docs/1v-kontrakt.md §10; T0.1 14. 10. 2026: register produkty.js, brána po typoch).
//
// Brána: beží LEN na produktoch z registra (produkty.js PRODUKTY_1V, SK projekt 562035) a LEN so zapnutým flagom karty:
//   ?novy=1     -> sessionStorage lcd1v = "1": nový vzhľad len na produktoch zapnutých typov (ZAPNUTE_TYPY),
//   ?novy=vyvoj -> lcd1v = "vyvoj": celý register (aj nevydané typy — vývoj, test --vyvoj, nie pre zákazníkov),
//   ?novy=0     -> flag zmaže. Inak sa nič nemení: žiadna trieda, atribút ani handler (CSS 1V len pod body.lcd-1v).
// Zapnuté: body.lcd-1v + data-lcd1v-typ / data-lcd1v-vzor (atribúty, nie triedy — lcd1v-vzor-* majú dlaždice vzoru);
// moduly podľa TYPY[typ].moduly. Zlyhá init modulu -> trieda aj atribúty sa zložia, zákazník vidí starý vzhľad
// (chyby v window.__lcd1v.chyby).
import { getShoptetContext } from "../../functions/shoptetContext.js";
import { vytvorCtx } from "./ctx.js";
import * as kroky from "./kroky.js";
import * as rozlozenie from "./rozlozenie.js";
import * as kuforBoxy from "./kufor-boxy.js";
import * as cena from "./cena.js";
import * as obsah from "./obsah.js"; // obsah pod konfigurátorom (statické HTML z adminu), docs/1v-obsah.md
// ---- brána po typoch (T0.1): register produktov + moduly typov
import { produkt1v, jeZapnutyTyp, zoznamZapnutych } from "./produkty.js";
import * as farba2 from "./farba2.js";
import * as kuforProdukt from "./kufor-produkt.js";
import * as boxyProdukt from "./boxy-produkt.js";
import * as vzorkyProdukt from "./vzorky-produkt.js";

/** Moduly podľa mena (TYPY[typ].moduly v produkty.js); meno, ktoré tu nie je, sa preskočí. */
const MODULY = { kroky, farba2, rozlozenie, "kufor-boxy": kuforBoxy, "kufor-produkt": kuforProdukt, "boxy-produkt": boxyProdukt, "vzorky-produkt": vzorkyProdukt, cena };

/** projectId -> produkty zapnuté pre ?novy=1 (odvodené z registra; ponechané pre spätnú kompatibilitu). */
export const ZOZNAM_1V = zoznamZapnutych();
export const KLUC_FLAGU = "lcd1v";
export const TRIEDA = "lcd-1v";
const FLAGY = ["1", "vyvoj"];

/** ?novy=1 / ?novy=vyvoj zapne, ?novy=0 vypne (sessionStorage karty). Bez parametra nič. */
export function prepinac(search) {
  const m = /[?&]novy=(0|1|vyvoj)(?:[&#]|$)/.exec(search || "");
  if (!m) return;
  try {
    if (m[1] === "0") sessionStorage.removeItem(KLUC_FLAGU);
    else sessionStorage.setItem(KLUC_FLAGU, m[1]);
  } catch (e) { /* súkromný režim: flag sa nedá uložiť -> nový vzhľad sa nezapne */ }
}

/** Hodnota flagu karty: "1" | "vyvoj" | null (vypnuté). */
export function jeZapnute() {
  try {
    const f = sessionStorage.getItem(KLUC_FLAGU);
    return FLAGY.indexOf(f) > -1 ? f : null;
  } catch (e) { return null; }
}

/** Produkt registra, ak má pri tomto flagu dostať nový vzhľad (vyvoj = celý register, 1 = len zapnuté typy), inak null. */
export function jeProdukt1v(kontext, flag) {
  const p = produkt1v(kontext);
  if (!p) return null;
  return flag === "vyvoj" || jeZapnutyTyp(p.typ) ? p : null;
}
// ---- koniec brány

/** Volá main.js po postavení živého konfigurátora (initProduct … initConfiguratorEngine, initLivePrice). */
export function initKonfigurator1v(setupData, texts) {
  try {
    prepinac(window.location.search);
    const kontext = getShoptetContext();
    const flag = jeZapnute();
    const produkt = flag ? jeProdukt1v(kontext, flag) : null;
    if (!produkt) return null;
    const form = document.getElementById("product-detail-form");
    if (!form || (produkt.obal && !form.querySelector(produkt.obal))) return null; // živý konfigurátor sa nepostavil -> nič
    document.body.classList.add(TRIEDA);
    document.body.setAttribute("data-lcd1v-typ", produkt.typ);
    if (produkt.vzor) document.body.setAttribute("data-lcd1v-vzor", produkt.vzor);
    const ctx = vytvorCtx({ setupData, texts, kontext, produkt });
    // Chyba, ktorá príde až po init (asynchrónne), zloží celý nový vzhľad cez ctx.zlozit(). Obsah z CDN (obsah.js)
    // ho zámerne nevolá: pri jeho chybe sa vráti len obsah, konfigurátor ostáva nový.
    ctx.zlozit = zlozit;
    window.__lcd1v = ctx; // ladenie + test (tools/test-konfigurator-1v.mjs)
    produkt.moduly.map((m) => MODULY[m]).filter(Boolean).concat([obsah]).forEach(function (modul) {
      try {
        modul.init(ctx);
      } catch (e) {
        ctx.chyby.push(modul.MENO + ": " + ((e && e.message) || e));
        console.error("[lcd-1v] " + modul.MENO, e);
      }
    });
    if (ctx.chyby.length) zlozit();
    return ctx;
  } catch (e) {
    try { zlozit(); } catch (x) {}
    return null;
  }
}

/** Návrat na starý vzhľad: trieda aj atribúty typu preč (moduly, ktoré sledujú body.lcd-1v, upracú svoje prvky). */
function zlozit() {
  document.body.classList.remove(TRIEDA);
  document.body.removeAttribute("data-lcd1v-typ");
  document.body.removeAttribute("data-lcd1v-vzor");
}
