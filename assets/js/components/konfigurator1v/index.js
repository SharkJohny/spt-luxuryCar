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
import * as poznamka from "./poznamka.js";
// ponuka druhej vrstvy (jedno) + prenos výberu na dvojvrstvové a späť (Michal 14. 10. 2026)
import * as druhaVrstva from "./druha-vrstva.js";
import * as prenos from "./prenos.js";
// ponuka setu s autokobercami pod sedadlá na rohožiach do kufra a boxe (Michal 17. 10. 2026)
import * as kompletPonuka from "./komplet-ponuka.js";
// kamióny a dodávky SK 640: celé UI namiesto Reactu (docs/kamiony-1v-plan.md); pri chybe zlozit() vráti React
import * as kamion from "./kamion/index.js";

/** Moduly podľa mena (TYPY[typ].moduly v produkty.js); meno, ktoré tu nie je, sa preskočí. */
const MODULY = { kroky, farba2, rozlozenie, "kufor-boxy": kuforBoxy, "kufor-produkt": kuforProdukt, "boxy-produkt": boxyProdukt, "vzorky-produkt": vzorkyProdukt, cena, poznamka, "druha-vrstva": druhaVrstva, prenos, "komplet-ponuka": kompletPonuka, kamion };

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
/**
 * true = na tejto stránke sa postaví kamión 1V a React konfigurátor sa NEmontuje (productPage.js initProduct). Tá istá
 * brána ako initKonfigurator1v (flag karty + register), takže nemôže nastať „oba“ ani „žiadny“. Bez ?novy= nič nezapisuje.
 */
export function budeKamion1v() {
  try {
    prepinac(window.location.search);
    const f = jeZapnute();
    const p = f ? jeProdukt1v(getShoptetContext(), f) : null;
    return !!(p && p.typ === "kamion" && document.getElementById("product-detail-form"));
  } catch (e) {
    return false;
  }
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
    aktivne = produkt.moduly.map((m) => MODULY[m]).filter(Boolean);
    aktivne.concat([obsah]).forEach(function (modul) {
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
    // kamión: chyba skôr, než sa modul zaradil (aktivne prázdne) -> React musí aj tak nabehnúť (initProduct ho vynechal)
    const bezModulov = aktivne.length === 0;
    try { zlozit(); } catch (x) {}
    try { if (bezModulov && budeKamion1v()) kamion.zlozit(); } catch (x) {}
    return null;
  }
}

/** Moduly typu tohto produktu (pre zlozit); prázdne, kým initKonfigurator1v nič nepostavil. */
let aktivne = [];

/**
 * Návrat na starý vzhľad: najprv zlozit() modulov typu, ktoré ho exportujú (kamion: vráti H1 a hlavičku, namontuje React),
 * potom trieda aj atribúty typu preč (moduly, ktoré sledujú body.lcd-1v, upracú svoje prvky).
 */
function zlozit() {
  const moduly = aktivne;
  aktivne = [];
  moduly.forEach(function (modul) {
    if (typeof modul.zlozit !== "function") return;
    try { modul.zlozit(); } catch (e) { console.error("[lcd-1v] " + modul.MENO + " zlozit", e); }
  });
  document.body.classList.remove(TRIEDA);
  document.body.removeAttribute("data-lcd1v-typ");
  document.body.removeAttribute("data-lcd1v-vzor");
}
