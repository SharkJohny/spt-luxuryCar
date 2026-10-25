// Konfigurátor kamiónov a dodávok 1V (SK 640 /luxusne-autokoberce-kamiony/) — nový vzhľad podľa schváleného artefaktu
// kamiony-app namiesto React konfigurátora (docs/kamiony-1v-plan.md). Beží LEN pod bránou index.js (?novy=vyvoj, po
// vydaní ?novy=1); productPage.js vtedy React nemontuje (budeKamion1v).
//
// init(ctx):
//   1. poistka 1.4: overí formulár, stĺpec, natívne tlačidlo, cenu a všetkých 15 selectov; chýba čokoľvek -> throw
//      (index.js zlozit -> zlozit() nižšie -> React);
//   2. ceny zo živých selectov (shoptet.js citajCeny), motívy podľa selectov (povoleneMotivy), predvýber vozidla zo
//      sessionStorage (prepínač na titulke);
//   3. body.is-truck-konfigurator + .p-info-wrapper.active (to isté ako React: skryje starý obsah stĺpca), koreň
//      .truck-konfigurator-wrap.lcd1v-kamion > #lcd1v-kamion na konci .p-info-wrapper, hlavička produktu presunutá
//      do koreňa, H1 s textom artefaktu (pôvodný sa vráti pri zlozit), lepivá lišta #lcd1v-lista ako 1V;
//   4. každá zmena výberu -> syncToShoptet(naStavReactu(S)) (doslovne React) + upratTapacir (bez tapacíru prázdne
//      detaily tapacíru, oprava N1) + kontrola ceny (Shoptet = cena.js);
//      „Pridať do košíka“ -> finálny sync, kontrola povinných selectov, o 100 ms (ako React) kontrola, že sa výber
//      medzitým nezmenil (N3), persistTruckOrderSummary (poznámka objednávky ako React — až tesne pred klikom, N2) a klik
//      na natívne tlačidlo; potom ~3 s „odosiela sa“ (tlačidlá vypnuté, N4), kým nepríde ShoptetCartUpdated.
// zlozit(): všetko vlastné preč, hlavička a H1 späť, poslucháči preč, mountTruckConfigurator() -> zákazník dostane React.
import { mountTruckConfigurator } from "../../../truck-konfigurator/mount.js";
import { persistTruckOrderSummary } from "../../../truck-konfigurator/order-summary.mjs";
import { sTextamiPriplatkov } from "../../../truck-konfigurator/farby-nazvy.mjs";
import { chybajuce, citajCeny, povoleneMotivy, syncToShoptet, upratTapacir, sucetShoptetu, povinneBezHodnoty, klikniKosik } from "./shoptet.js";
import { naStavReactu, naStavCeny, predvyber } from "./stav.js";
import { vypocitajCenu } from "./cena.js";
import { ZNACKY, MATERIALY } from "./data.js";
import { TEXTY } from "./texty.js";
import { vytvorUi } from "./ui.js";

export const MENO = "kamion";
/** Telefón a tablet: lepivá lišta (rovnaká hranica ako 1V cena.js). */
const MOBIL = "(max-width: 991px)";
/** CZ 2452 (luxurycardesign.cz): české texty a ceny v Kč; poznámka objednávky má CZ značky (order-summary.mjs). */
const jazykStranky = () => (/\.cz$/i.test(location.hostname) ? "cs" : "sk");

let aktivny = null; // { zrus } — jeden konfigurátor na stránke

/** @param {ReturnType<import("../ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const chyba = chybajuce(document);
  if (chyba.length) throw new Error("kamion: na stránke chýba " + chyba.join(", "));
  const ceny = citajCeny(document);
  // materiály v Shoptete = materiály konfigurátora (nový / premenovaný materiál v admine -> React, kým sa nedoplní)
  const vShoptete = Object.keys(ceny.priplatky.material).sort().join("|");
  const vKonfiguratore = MATERIALY.filter((m) => TEXTY.kroky.material.volby.some((v) => v.shoptet === m.nazov)).map((m) => m.nazov).sort().join("|");
  if (vShoptete !== vKonfiguratore) throw new Error("kamion: materiály v Shoptete (" + vShoptete + ") ≠ konfigurátor (" + vKonfiguratore + ")");
  const motivy = povoleneMotivy(document);
  const data = { ceny, vozidla: { znacky: ZNACKY } };
  const stlpec = document.querySelector(".col-xs-12.col-lg-6.p-info-wrapper") || document.querySelector(".p-info-wrapper");
  const hlavicka = document.querySelector(".p-detail-inner-header");
  const h1 = hlavicka && hlavicka.querySelector("h1");
  const povodne = {
    hlavickaRodic: hlavicka ? hlavicka.parentNode : null,
    hlavickaZa: hlavicka ? hlavicka.nextSibling : null,
    h1Html: h1 ? h1.innerHTML : null,
    h1Trieda: h1 ? h1.className : null,
    stlpecAktivny: stlpec.classList.contains("active"),
    truckTrieda: document.body.classList.contains("is-truck-konfigurator"),
  };
  const spat = []; // kroky návratu (poslucháči, observery, časovače)
  let zruseny = false, casovac = 0, ui = null, api = null;

  // ------------------------------------------------------------------ návrat (poistka) — funguje aj pri rozostavanom UI
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    clearTimeout(casovac);
    spat.forEach((f) => { try { f(); } catch (e) { /* nič */ } });
    if (hlavicka && povodne.hlavickaRodic) {
      hlavicka.querySelectorAll(":scope > .k-typ, :scope > .k-hodn").forEach((x) => x.remove());
      const za = povodne.hlavickaZa && povodne.hlavickaZa.parentNode === povodne.hlavickaRodic ? povodne.hlavickaZa : null;
      povodne.hlavickaRodic.insertBefore(hlavicka, za);
    }
    if (h1) { h1.innerHTML = povodne.h1Html; h1.className = povodne.h1Trieda; }
    if (obal.parentNode) obal.parentNode.removeChild(obal);
    if (lista.parentNode) lista.parentNode.removeChild(lista);
    if (!povodne.stlpecAktivny) stlpec.classList.remove("active");
    if (!povodne.truckTrieda) document.body.classList.remove("is-truck-konfigurator");
    document.body.classList.remove("lcd1v-lista-on", "lcd1v-bublina");
    if (api && window.__lcd1vKamion === api) delete window.__lcd1vKamion;
  }

  // ------------------------------------------------------------------ koreň a lišta
  document.body.classList.add("is-truck-konfigurator");
  stlpec.classList.add("active");
  const obal = document.createElement("div");
  obal.className = "truck-konfigurator-wrap lcd1v-kamion";
  const root = document.createElement("div");
  root.id = "lcd1v-kamion";
  root.className = "k-info";
  obal.appendChild(root);
  stlpec.appendChild(obal);
  const lista = document.createElement("div");
  lista.id = "lcd1v-lista";
  lista.className = "lcd1v-lista lcd1v-lista--kamion";
  document.body.appendChild(lista);
  aktivny = { zrus }; // od tejto chvíle vie zlozit() upratať aj rozostavaný konfigurátor

  // ------------------------------------------------------------------ sync a košík
  function sync(S) {
    const stav = naStavReactu(S);
    syncToShoptet(sTextamiPriplatkov(stav, jazykStranky()));
    upratTapacir(stav, document);
    const shoptet = sucetShoptetu(document);
    const nase = vypocitajCenu(naStavCeny(S), data).spolu;
    if (shoptet !== nase) console.error("[lcd-1v] kamion: cena Shoptetu " + shoptet + " ≠ konfigurátor " + nase);
    return stav;
  }
  /** Každá zmena výberu: zruší čakajúci klik do košíka a stav „odosiela sa“ (N3, N4), potom sync. */
  function naZmenu(S) {
    clearTimeout(casovac);
    if (ui) ui.odosiela(false);
    return sync(S);
  }
  function doKosika(S) {
    const stav = sync(S);
    const chybaju = povinneBezHodnoty(document);
    if (chybaju.length) {
      console.error("[lcd-1v] kamion: povinné selecty bez hodnoty — do košíka sa nepridá:", chybaju);
      return false;
    }
    const odtlacok = JSON.stringify(stav);
    clearTimeout(casovac);
    ui.odosiela(true); // hneď: tlačidlá vypnuté, druhé ťuknutie nič nepošle (N4)
    casovac = setTimeout(function () {
      if (zruseny) return;
      // výber sa za 100 ms zmenil (naZmenu klik zruší; toto je poistka) -> nič neodíde, zákazník klikne znova
      const teraz = naStavReactu(ui.S);
      if (JSON.stringify(teraz) !== odtlacok || !ui.hotovo()) { ui.odosiela(false); return; }
      persistTruckOrderSummary(teraz);
      if (!klikniKosik(document)) ui.odosiela(false);
    }, 100);
    return true;
  }

  try {
    ui = vytvorUi({ root, hlavicka, lista, ceny, motivy, predvyber: predvyber(), naZmenu, doKosika, jazyk: jazykStranky(),
      priChybe: function (e) {
        console.error("[lcd-1v] kamion: chyba po štarte — návrat na React", e);
        if (!zruseny) ctx.zlozit();
      },
    });
    spat.push(() => ui.zrus());
    sync(ui.S); // jediné možnosti „Vyberie sa v konfigurátore“ + „Nie nechcem …“ hneď (ako React pri mounte)

    // hodnotenie z Google (ako 1V cena.js); kým dáta neprídu, riadok je skrytý
    ctx.ked(function () {
      const p = window.LCD_REVIEWS && window.LCD_REVIEWS.place;
      return p && Number(p.rating) > 0 && Number(p.totalReviews) > 0 ? p : null;
    }, function (p) { if (!zruseny) ui.hodnotenie(p); }, { limit: 30000 });

    // výzvy obsahu pod konfigurátorom (a[href="#product-detail-form"]) -> krok z data-p1v-kamion-krok (napr. „Vybrať
    // materiál“ -> material), inak Vozidlo; otvorKrok otvorí prvý nehotový krok pred ním s červeným rámom (ako ART)
    const naVyzvu = function (e) {
      const a = e.target && e.target.closest && e.target.closest('a[href="#product-detail-form"]');
      if (!a || root.contains(a)) return;
      e.preventDefault();
      ui.otvorKrok(a.getAttribute("data-p1v-kamion-krok") || "vozidlo");
    };
    document.addEventListener("click", naVyzvu, true);
    spat.push(() => document.removeEventListener("click", naVyzvu, true));
    // košík Shoptetu odpovedal -> tlačidlá znova aktívne (inak po 3 s samé, ui.odosiela)
    const naKosikShoptetu = function () { if (!zruseny) ui.odosiela(false); };
    document.addEventListener("ShoptetCartUpdated", naKosikShoptetu);
    spat.push(() => document.removeEventListener("ShoptetCartUpdated", naKosikShoptetu));

    // lišta: telefón, keď súhrn s tlačidlom nie je na obrazovke (artefakt; prvok a triedy ako 1V)
    const mobil = window.matchMedia ? window.matchMedia(MOBIL) : { matches: false };
    let suhrnVidno = false, listaOn = null;
    // výška okna chatu Luxia: ResizeObserver (zrýchlenie 25. 10. 2026) — getBoundingClientRect každú sekundu a po každom
    // ťuknutí vynucoval prepočet rozloženia celej stránky (~70 ms pri CPU 6×); bez ResizeObserver ako predtým
    let chat = null, chatVyska = null, chatRo = null;
    const vyskaChatu = function () {
      const f = document.querySelector('iframe[title="Luxia chat"]');
      if (f !== chat) {
        if (chatRo) chatRo.disconnect();
        chat = f; chatVyska = null;
        if (f && typeof window.ResizeObserver === "function") {
          chatRo = new window.ResizeObserver(function (en) { chatVyska = en[0].contentRect.height; obnovListu(); });
          chatRo.observe(f);
        } else chatRo = null;
      }
      if (!f) return 0;
      return chatRo ? (chatVyska == null ? 0 : chatVyska) : f.getBoundingClientRect().height;
    };
    spat.push(() => { if (chatRo) chatRo.disconnect(); });
    const obnovListu = function () {
      if (zruseny) return;
      const on = !!mobil.matches && !suhrnVidno;
      if (on !== listaOn) {
        listaOn = on;
        lista.classList.toggle("on", on);
        document.body.classList.toggle("lcd1v-lista-on", on);
      }
      // bublina chatu Luxia (76 × 76) sa zdvihne nad lištu; otvorený chat (vyšší) sa nehýbe (ako 1V cena.js)
      const vyska = vyskaChatu();
      const bublina = !!(on && vyska > 0 && vyska <= 130);
      if (document.body.classList.contains("lcd1v-bublina") !== bublina) document.body.classList.toggle("lcd1v-bublina", bublina);
    };
    if (typeof window.IntersectionObserver === "function") {
      const io = new window.IntersectionObserver(function (en) {
        en.forEach(function (x) { suhrnVidno = x.isIntersecting; });
        obnovListu();
      }, { threshold: 0.15 });
      io.observe(ui.suhrn());
      spat.push(() => io.disconnect());
    }
    if (mobil.addEventListener) { mobil.addEventListener("change", obnovListu); spat.push(() => mobil.removeEventListener("change", obnovListu)); }
    const interval = setInterval(obnovListu, 1000); // bublina Luxie sa načíta neskoro
    spat.push(() => clearInterval(interval));
    obnovListu();
  } catch (e) {
    zrus();
    aktivny = null;
    throw e;
  }

  api = { ui, sync: () => sync(ui.S), zrus };
  window.__lcd1vKamion = api; // ladenie + test (tools/test-kamion-*.mjs)
  aktivny = api;
}

/** Návrat na React (poistka 1.4): index.js ho volá pri chybe init ktoréhokoľvek modulu aj pri ctx.zlozit(). */
export function zlozit() {
  const a = aktivny;
  aktivny = null;
  if (a) {
    try { a.zrus(); } catch (e) { console.error("[lcd-1v] kamion zrus", e); }
  }
  mountTruckConfigurator();
}
