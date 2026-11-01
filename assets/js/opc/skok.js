// Jedna stránka (Michal 1. 11. 2026 z iPhonu: „keď idem do košíka, tak to rôzne preblikáva“): z webu rovno do pokladne.
// Predtým sa po kliku na košík načítal košík (chvíľu celý, potom „Načítavam…“ s holými − a +), až potom pokladňa.
// Teraz: klik na odkaz do košíka (ikona v hlavičke aj tlačidlo v okne košíka) aj presun konfigurátora po „Do košíka“
// (window.__lcdDoKosika, functions/configuratorEngine.js) -> hneď obrazovka „Načítavam…“, na pozadí krok 1 a Step1Validate
// ako v košíku (opc/kosik.js) a potom rovno /objednavka/krok-2/. Stránka košíka sa vôbec nenačíta.
// Hocičo zlyhá (prázdny košík, krok 1 neodpovie, banka) -> /kosik/ ako doteraz (tam sa skúsi preskočiť znova).
import { stiahniModelKrok1, potvrdKrok1, CESTA_KROK1 } from "./kosik.js";
import { TEXTY } from "./texty.js";
import { oznacPreskocenie } from "./analytika.js";

export const SKOK = "lcd-opc-skok";
const ID = "lcd-opc-skok";
/** Obrazovka „Načítavam…“ hneď od začiatku stránky: dá ju riadok v hlavičke HTML kódov (kniha § 10.26) ešte pred obsahom. */
export const HNED = "lcd-opc-hned";
/** Text pre obrazovku na ďalšej stránke (zmena štátu): sessionStorage -> riadok v hlavičke -> html[data-lcd-opc-hlaska]. */
export const KLUC_HLASKA = "lcdOpcHlaska";
/** Najdlhšie čakanie na krok 1 + Step1Validate (limity sync.js by spolu dali až ~16 s) -> potom košík ako doteraz. */
export const SKOK_MAX_MS = 10000;

/** Odkaz do košíka na tomto webe (/kosik/ bez parametrov; ?opc=… ide natívne, ten flag zapína/vypína)? */
export function jeOdkazNaKosik(a, origin) {
  if (!a || !a.getAttribute) return false;
  const h = a.getAttribute("href");
  if (!h) return false;
  try {
    const u = new URL(h, origin + "/");
    return u.origin === origin && /^\/kosik\/?$/.test(u.pathname) && !u.search;
  } catch (e) {
    return false;
  }
}

/** Počet kusov v odznaku košíka v hlavičke (ako functions/configuratorEngine.js) | NaN, keď odznak nie je (Shoptet ho pri
 *  prázdnom košíku nekreslí, overené naživo 1. 11. 2026). */
export function pocetVOdznaku(doc) {
  const i = doc.querySelector(".navigation-buttons a[data-target='cart'] i, a.cart-count i, .cart-count i");
  return i ? parseInt((i.textContent || "").replace(/\D/g, ""), 10) : NaN;
}

/** Obrazovka „Načítavam…“ cez celú stránku (rovnaká farba ako pokladňa, _lcdOpc.scss); hlavičku nechá vidno, ale
 *  zakrytú priehľadne — počas skoku sa nedá kliknúť inam (dve navigácie naraz, revízia 1. 11.). */
export function ukazSkok(doc, T, text) {
  const H = doc.documentElement;
  if (doc.getElementById(ID)) return;
  try {
    const hl = doc.getElementById("header") || doc.querySelector("header");
    const spodok = hl ? Math.round(hl.getBoundingClientRect().bottom) : 0;
    H.style.setProperty("--lcd-opc-skok-hore", Math.max(0, spodok) + "px");
  } catch (e) {}
  const d = doc.createElement("div");
  d.id = ID;
  d.setAttribute("role", "status");
  d.setAttribute("aria-live", "polite");
  d.textContent = text || T.nacitavamKosik;
  doc.body.appendChild(d);
  H.classList.add(SKOK);
}

/**
 * Obrazovka z hlavičky stránky (html.lcd-opc-hned, Michal 1. 11. 2026: pri zmene štátu preblikla pokladňa Shoptetu) ostane,
 * kým bundle skrýva krok 2 (lcd-opc-caka) alebo prechádza z košíka (lcd-opc-prechadzam), potom zmizne naraz s nimi.
 * Poistku 3 s z hlavičky ruší — tú preberajú poistky bundla (KROK2_LIMIT_MS, prechod). Nič neskrýva -> preč hneď.
 * -> true = obrazovka ostáva.
 */
export function drzHned(doc, okno) {
  try { okno.sessionStorage.removeItem(KLUC_HLASKA); } catch (e) {}
  const H = doc.documentElement;
  if (!H.classList.contains(HNED)) return false;
  try { okno.clearTimeout(okno.__lcdOpcHned); } catch (e) {}
  const skryva = function () { return H.classList.contains("lcd-opc-caka") || H.classList.contains("lcd-opc-prechadzam"); };
  const zrus = function () { H.classList.remove(HNED); H.removeAttribute("data-lcd-opc-hlaska"); };
  if (!skryva()) { zrus(); return false; }
  const mo = new okno.MutationObserver(function () { if (!skryva()) { mo.disconnect(); zrus(); } });
  mo.observe(H, { attributes: true, attributeFilter: ["class"] });
  return true;
}

export function zrusSkok(doc) {
  const d = doc.getElementById(ID);
  if (d) d.remove();
  doc.documentElement.classList.remove(SKOK);
  doc.documentElement.style.removeProperty("--lcd-opc-skok-hore");
}

/** ctx: { trh, stav, meraj } (opc/index.js initOpc na stránkach mimo košíka a pokladne). */
export function initSkok(ctx) {
  const T = TEXTY[ctx.trh] || TEXTY.sk;
  let bezi = false;
  ctx.stav = "web";

  function chod(kam) {
    if (bezi) return;
    bezi = true;
    try { ukazSkok(document, T); } catch (e) {} // bez obrazovky „Načítavam…“ skok aj tak pokračuje
    ctx.stav = "web-skok";
    const t0 = Date.now();
    let koniec = false;
    // zlyhanie: rýchla platba cez banku bez banky -> rovno krok 1 (výber banky je tam; košík by skončil rovnako), inak košík
    const zachrana = function (r) {
      if (koniec) return;
      koniec = true;
      ctx.stav = "web-zachrana";
      ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: (r && r.typ) || "vynimka", lcd_opc_kod: r && r.kod != null ? r.kod : null, lcd_opc_miesto: "web" });
      location.assign(r && r.typ === "pis" ? CESTA_KROK1 : kam);
    };
    const poistka = setTimeout(function () { zachrana({ typ: "limit-web" }); }, SKOK_MAX_MS);
    stiahniModelKrok1()
      .then(potvrdKrok1)
      .then(function (r) {
        if (!r || !r.ok) throw r;
        if (koniec) return;
        koniec = true;
        clearTimeout(poistka);
        ctx.stav = "web-na-krok2";
        ctx.meraj("lcd_opc_prechod", { lcd_opc_platba: r.platba, lcd_opc_ms: Date.now() - t0, lcd_opc_miesto: "web" });
        oznacPreskocenie(); // krok 1 sa nenačíta -> begin_checkout pošle krok 2 (opc/analytika.js, T9a)
        location.assign(r.ciel);
        // prechod zastavený (napr. „Zastaviť“ v Safari) -> po chvíli obrazovka preč a košík sa dá kliknúť znova
        setTimeout(function () { bezi = false; zrusSkok(document); ctx.stav = "web"; }, SKOK_MAX_MS);
      })
      .catch(function (r) {
        clearTimeout(poistka);
        zachrana(r);
      });
  }

  // klik v zachytávaní na window (pred Shoptetom): ikona košíka v hlavičke (toggle-window) by inak otvorila aj okno
  // košíka Shoptetu pod obrazovkou „Načítavam…“ — košík je navrchu pokladne, okno netreba (Michal 1. 11. 2026)
  window.addEventListener("click", function (e) {
    try {
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!jeOdkazNaKosik(a, location.origin)) return;
      if (a.target && a.target !== "_self") return;
      if (!(pocetVOdznaku(document) > 0)) return; // prázdny košík / bez odznaku -> obyčajný odkaz
      e.preventDefault();
      e.stopPropagation();
      chod(new URL(a.getAttribute("href"), location.href).href);
    } catch (x) {
      // náš kód zlyhal -> odkaz pokračuje natívne (ak ešte nebol zastavený)
    }
  }, true);

  // konfigurátor po pridaní do košíka (functions/configuratorEngine.js): true = prevzaté, inak ide sám na /kosik/
  window.__lcdDoKosika = function () {
    try { chod("/kosik/"); return true; } catch (e) { return false; }
  };

  // Späť z pokladne (bfcache): stránka sa vráti s obrazovkou „Načítavam…“ -> preč s ňou
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    bezi = false;
    zrusSkok(document);
    ctx.stav = "web";
  });
}
