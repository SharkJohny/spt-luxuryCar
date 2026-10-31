// One page checkout (kniha OPC § 5 variant A, § 6): /objednavka/krok-2/ Shoptetu = jednostránková pokladňa.
// Natívny formulár (#order-form, Step2Validate), súhrn (#checkoutSidebar), súhlas aj „Objednať s povinnosťou platby“
// ostávajú Shoptetu. Pribudne sekcia „Doprava a platba“ medzi adresu a poznámku (dáta z GET /objednavka/krok-1/),
// zmena platby cez Step1Validate na pozadí (opc/sync.js), zbalený súhrn a lišta na telefóne, 2 kroky v lište krokov.
//
// Čo sa NEMENÍ (§ 6.10): podpis Shoptetu, tlačidlo a jeho text, súhlas, súhrn tesne nad tlačidlom, #remark (toNote
// v main.js cez postSuccessfulValidation), varchar1–3 (cart.js), odoslanie len natívnym POST Step2Validate, adresa pod
// /objednavka/ (tichá Luxia), predvolený prevod a povinné číslo domu zo Shoptetu. Na stránke sa nikdy nevolá reload.
//
// Záchrana (fail-closed): krok 1 nejde stiahnuť / prečítať (aj po limite 4 s), súhrn nesedí s krokom 1, výnimka ->
// sekcia sa nezobrazí, pod súhrnom je odkaz „Zmeniť dopravu alebo platbu“ na /objednavka/krok-1/ = dnešný krok 2.
//
// Klik na „Objednať“ (Michal 29. 10. 2026, opc/kontrola.js): chýba alebo je zlé pole -> posun na PRVÉ také pole, červený
// rám, text pod ním, kurzor; nič neodíde ani sa neoveruje. Všetko v poriadku -> odoslanie ako doteraz. Lišta dole na
// telefóne (a karta pri súhrne na PC, keď tlačidlo nevidno) = „Celkom … | Objednať s povinnosťou platby“, klik = klik na
// natívne tlačidlo, takže prejde tými istými kontrolami (kontrola polí, resync, zámok, analytika) a odíde práve 1×.
//
// Objednávka = to, čo zákazník vidí (kniha § 5 Riziká, § 6.10 bod 4; revízia 29. 10. 2026):
//   - súhrn nad tlačidlom ukazuje vždy súhrn zo servera (nový alebo posledný potvrdený), lokálny prepočet len počas zmeny,
//   - pred odoslaním kontrola zhody: súhrn = potvrdená voľba = zaškrtnuté rádio, inak sa overí zo servera a neodošle,
//   - odložené odoslanie (klik počas zmeny) prejde len, keď sa potvrdila presne voľba z času kliku; pri chybe alebo novej
//     voľbe sa zruší a zákazník klikne znova.
import { krok1Model } from "./krok1Model.js";
import { posliStep1, nacitajKrok1, nacitajSuhrnKroku2, suhrnInfo, volbaZoSuhrnu, vytvorSync } from "./sync.js";
import * as V from "./vzhlad.js";
import * as P from "./polozky.js";
import { TEXTY } from "./texty.js";
import * as A from "./analytika.js";
import * as K from "./kontrola.js";
import * as B from "./banka.js";
import { lcdDobierkaZaloha, lcdBublinaMimoTlacidla, changeDescription } from "../components/cart.js";
import { vymenaBezi } from "../lcdKosikDoplnok.js";

/** Z čoho na kroku 2 bublina Luxie ustúpi okrem „Objednať“: tlačidlo v lište, polia, odkazy, zaškrtávacie polia a voľby. */
/** Prvky kroku 2, z ktorých ustúpi bublina Luxie (cart.js lcdBublinaMimoTlacidla `dalsie`) — „Objednať“ len tu, nie v cart.js. */
export const BUBLINA_USTUPI = ["#submit-order", ".lcd-opc-lista__btn", "#order-form .form-control", "#order-form .phone-combined-input", "#order-form .form-group a",
  "#order-form input[type=checkbox] + label", "#lcd-opc .radio-wrapper"].join(", ");

const ODLOZ_MAX_MS = 10000; // odložené odoslanie (zmena platby / výmena doplnku) čaká najviac 10 s
const ZAMOK_MS = 5000; // po úspešnej validácii Shoptetu sa ďalšie odoslanie 5 s neprepustí (dvojklik); zruší ho neúspešná
/**
 * Zámok sekcie Doprava a platba pri odoslaní (živý dôkaz T3-L7 29. 10. 2026): keď submit pustíme k Shoptetu, ten môže
 * čakať na overenie telefónu (GET ShoptetValidatePhone) a formulár pošle až potom cez form.submit() BEZ udalosti submit.
 * Zmena platby v tom čase by odišla 1× Step1Validate a objednávka by mala platbu, ktorú stránka neukazovala. Preto je
 * sekcia zamknutá (rádiá disabled + inert, sync nič nepošle) až do ShoptetFailedValidation, návratu (pageshow) alebo
 * bezpečnostného limitu. 20 s: dlhšie ako naše najdlhšie čakanie (Step1Validate 8 s + GET krok 1 4 s) aj pomalé overenie
 * telefónu na mobile (naživo ~0,2 s 🟡, v teste 1,5 s); kratšie, než by zákazník so zamknutou stránkou odišiel. Zvyškové
 * riziko (🟡): Shoptet odošle až po limite a zákazník medzitým zmení platbu — vtedy ide zmena bežne cez sync.
 */
const ODOSIELANIE_MAX_MS = 20000;
/** Skrytý formulár (html.lcd-opc-caka) sa odkryje najneskôr 3 s od začiatku stránky, aspoň 0,8 s po štarte initKrok2. */
const ODKRY_DO_MS = 3000;
const ODKRY_MIN_MS = 800;

const rovnake = function (a, b) { return !!a && !!b && String(a.doprava) === String(b.doprava) && String(a.platba) === String(b.platba); };

export function initKrok2(ctx) {
  const T = TEXTY[ctx.trh];
  const H = document.documentElement;
  const form = document.getElementById("order-form");
  const box = document.getElementById("summary-box");
  const tlacidlo = document.getElementById("submit-order");
  // banky: výber banky pri rýchlej platbe priamo tu (opc/banka.js stavBanky: krajiny, krajina, banka), null = záloha
  // (riadok s odkazom na klasický krok 1)
  const k2 = { model: null, sync: null, sekcia: null, banky: null };
  ctx.krok2 = k2;
  // krok 1 sa preskočil (príznak z košíka, prečíta sa a zmaže hneď -> begin_checkout najviac raz, aj pri F5)
  const preskocilKrok1 = A.vezmiPreskocenie();
  if (!form || !box || !tlacidlo) {
    H.classList.remove("lcd-opc", "lcd-opc-caka"); // skorý vzhľad (opc/index.js) späť: dnešný krok 2
    ctx.stav = "krok2-zachrana";
    ctx.meraj("lcd_opc_zachrana", { lcd_opc_dovod: "stranka" });
    return;
  }
  H.classList.add("lcd-opc");
  ctx.stav = "krok2-nacitavam";
  ctx.meraj("lcd_opc_zobrazenie", { lcd_opc_trh: ctx.trh });

  // Odkrytie (doladenie 2, CLS): formulár je od načítania bundla skrytý (opc/index.js vzhladKrok2Skoro, html.lcd-opc-caka)
  // a odkryje sa naraz, až keď stojí celý dizajn A aj sekcia Doprava a platba (postav) alebo záchrana. Dva snímky: prvý
  // vykreslí nové rozloženie ešte skryté, druhý ho ukáže — posun skrytého obsahu sa do CLS neráta. Pomalý krok 1: najneskôr
  // ODKRY_DO_MS od začiatku stránky (aspoň ODKRY_MIN_MS po štarte), potom s „Načítavam dopravu a platbu…“.
  let odkryte = !H.classList.contains("lcd-opc-caka");
  const odkry = function () {
    if (odkryte) return;
    odkryte = true;
    const hotovo = function () { H.classList.remove("lcd-opc-caka"); };
    if (document.visibilityState === "hidden" || typeof window.requestAnimationFrame !== "function") { setTimeout(hotovo, 0); return; }
    window.requestAnimationFrame(function () { window.requestAnimationFrame(hotovo); });
    setTimeout(hotovo, 1000); // poistka: snímky sa nekreslia (karta na pozadí) — bez kreslenia ani posun
  };
  if (!odkryte) {
    let od = 0;
    try { od = window.performance && performance.now ? performance.now() : 0; } catch (e) { od = 0; }
    setTimeout(odkry, Math.max(ODKRY_MIN_MS, ODKRY_DO_MS - od));
  }

  // položky súhrnu (Michal 29. 10. 2026, náhľad 2): malá fotka a pod názvom natívny rozpis z košíka — najdôležitejšie
  // riadky hneď, zvyšok po „Zobraziť viac“ (A1, Michal 30. 10. 2026; opc/polozky.js). Hneď pri načítaní (nie až po doprave
  // a platbe: súhrn je na PC na prvej obrazovke), po prekreslení súhrnu znova (poZmeneSuhrnu); stav zbalené / rozbalené
  // drží `otvorene`. Len vzhľad — chyba tu nič nezastaví.
  let ss = null;
  try { ss = window.sessionStorage; } catch (e) { ss = null; }
  const polozky = { fotky: P.citajFotky(ss), otvorene: {} };
  const rozsirPolozky = function () { try { P.rozsirPolozky(box, T, polozky); } catch (e) {} };
  rozsirPolozky();
  box.addEventListener("click", function (e) { try { P.prepniDetail(e.target, box, T, polozky.otvorene); } catch (x) {} });

  // dizajn A (Michal 29. 10. 2026): karty 1–4 s číslom, fajka pri vyplnenej karte, popis nad poľom, adresa v 2 riadkoch.
  // Len vzhľad — chyba tu nič nezastaví (odoslanie, kontrola polí aj sekcia bežia ďalej bez neho).
  const obnovKarty = function () { try { V.obnovKarty(form, k2.sekcia); } catch (e) {} };
  try {
    V.pripravKarty(form, T);
    form.addEventListener("input", obnovKarty);
    form.addEventListener("change", obnovKarty);
    // Shoptet označí zlé pole (js-error-field) až po svojej kontrole (telefón aj po overení na serveri)
    const mo = new MutationObserver(obnovKarty);
    V.POLIA_KARIET.kontakt.concat(V.POLIA_KARIET.adresa).forEach(function (id) {
      const e = document.getElementById(id);
      if (e) mo.observe(e, { attributes: true, attributeFilter: ["class"] });
    });
  } catch (e) {}
  obnovKarty();

  // pomocný prázdny formulár pre naše rádiá (mimo #order-form: formuláre sa nesmú vnárať)
  let nic = document.getElementById(V.FORM_NIC);
  if (!nic) {
    nic = document.createElement("form");
    nic.id = V.FORM_NIC;
    nic.hidden = true;
    nic.setAttribute("aria-hidden", "true");
    nic.addEventListener("submit", function (e) { e.preventDefault(); });
    document.body.appendChild(nic);
  }

  // miesto sekcie: za adresou (aj „Doručiť na inú adresu“), pred poznámkou a registráciou
  const obsah = form.querySelector("#checkoutContent .cart-content") || form;
  const zaAdresou = obsah.querySelector("#shipping-address") || obsah.querySelector(".co-billing-address");
  const pred = obsah.querySelector(".co-box-additional");
  const nacitavam = document.createElement("div");
  nacitavam.className = "lcd-opc-nacitavam";
  nacitavam.setAttribute("role", "status");
  nacitavam.textContent = T.nacitavam;
  vloz(nacitavam);

  function vloz(el) {
    if (pred && pred.parentNode) pred.parentNode.insertBefore(el, pred);
    else if (zaAdresou && zaAdresou.parentNode) zaAdresou.parentNode.insertBefore(el, zaAdresou.nextSibling);
    else obsah.appendChild(el);
  }

  // ------------------------------------------------------------ odoslanie: len natívne, my ho najviac odložíme
  let zamokDo = 0;
  let odklad = null;
  let cakamTrvale = false; // hláška pri tlačidle je výsledok (neodišlo…), nie čakanie -> ostane, kým sa niečo nezmení
  const cakam = document.createElement("p");
  cakam.className = "lcd-opc-cakam";
  cakam.setAttribute("role", "status");
  cakam.setAttribute("aria-live", "polite");
  cakam.hidden = true;
  const krokDalej = tlacidlo.closest(".next-step");
  if (krokDalej && krokDalej.parentNode) krokDalej.parentNode.insertBefore(cakam, krokDalej);

  /**
   * Súhrn nad tlačidlom nesedí s potvrdenou voľbou alebo so zaškrtnutým rádiom (§ 6.10 bod 4) — napr. neskorá odpoveď
   * Shoptetu pri opustení poľa prepísala súhrn starým. Počas zmeny a v záchrane sa nekontroluje.
   */
  function nezhoda() {
    const sy = k2.sync;
    if (!sy || !k2.model || !k2.sekcia) return false;
    const s = sy.stav();
    if (s === "meni-sa" || s === "zachrana") return false;
    const p = sy.potvrdene();
    const zo = volbaZoSuhrnu(k2.model, suhrnInfo(box));
    if (!zo || !rovnake(zo, p)) return true;
    const rp = k2.sekcia.querySelector('input[name="billingId"][data-lcd-opc]:checked');
    const rd = k2.sekcia.querySelector('input[name="shippingId"][data-lcd-opc]:checked');
    return !!((rp && rp.value !== p.platba) || (rd && rd.value !== p.doprava));
  }
  /** null | "platba" | "nezhoda" | "kosik" — prečo teraz objednávka nesmie odísť. */
  function blokovane() {
    if (k2.sync && !k2.sync.mozeOdoslat()) return "platba";
    if (nezhoda()) return "nezhoda";
    if (vymenaBezi()) return "kosik";
    return null;
  }
  function obnovTlacidlo() {
    const b = blokovane();
    if (b) tlacidlo.setAttribute("aria-disabled", "true");
    else tlacidlo.removeAttribute("aria-disabled");
    if (b === "kosik") sledujVymenu();
    if (!b && odklad == null && !cakamTrvale && !cakam.hidden) { const v = vyskaCakam(); cakam.hidden = true; poZmeneCakam(v); }
  }
  /**
   * Bočný panel Shoptetu (súhrn, hláška, tlačidlo) na PC: Shoptet ho posúva inline „top“ (fixSidebar) a pri spodku stránky
   * ho neprepočíta. Keď panel narastie (hláška pri tlačidle) alebo obsah vľavo zmizne (neskorá záchrana), starý posun ho
   * vytlačí pod koniec obsahu a tlačidlo sa nedá zobraziť (overflow:clip, zistené testami S22 a S35 na 1366). Preto:
   * prepočet Shoptetom (contentResized = jeho handleWithSidebar) a posun najviac po spodok obsahu. Bez inline top nič.
   */
  function srovnajPanel() {
    try {
      if (window.jQuery) window.jQuery("html").trigger("contentResized");
      const panel = document.getElementById("checkoutSidebar");
      const vlavo = document.getElementById("checkoutContent");
      if (!panel || !vlavo || !panel.style.top) return;
      const max = Math.max(0, vlavo.offsetHeight - panel.offsetHeight);
      if ((parseFloat(panel.style.top) || 0) > max) panel.style.top = max + "px";
    } catch (e) {}
  }
  function vyskaCakam() {
    return cakam.hidden ? 0 : cakam.offsetHeight;
  }
  function poZmeneCakam(pred) {
    if (vyskaCakam() !== pred) srovnajPanel();
  }
  /** odkaz = text odkazu na klasický krok 1 za hláškou (cesta ďalej, keď objednávka z tejto stránky neodišla). */
  function ukazCakam(text, trvale, odkaz) {
    const pred = vyskaCakam();
    cakam.textContent = text;
    if (odkaz) {
      const a = document.createElement("a");
      a.href = V.CESTA_KROK1;
      a.textContent = odkaz;
      cakam.appendChild(a);
      cakam.appendChild(document.createTextNode("."));
    }
    cakam.hidden = false;
    cakamTrvale = !!trvale;
    // výsledok (objednávka neodišla, zmena v inom okne) je výrazná hláška 16 px; čakanie a „odosiela sa“ ostávajú sivé
    cakam.classList.toggle("lcd-opc-cakam--pozor", !!trvale && text !== T.odosiela);
    poZmeneCakam(pred);
    // klik bol v lište (tlačidlo a hláška sú mimo obrazovky): výsledok (neodišlo, zmena v inom okne) treba vidieť
    if (trvale && H.classList.contains("lcd-lista-on")) {
      try { cakam.scrollIntoView({ block: "center", behavior: plynulo() ? "smooth" : "auto" }); } catch (e) {}
    }
  }
  function plynulo() {
    try { return !window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; }
  }
  function skryCakam() {
    const pred = vyskaCakam();
    cakam.hidden = true;
    cakamTrvale = false;
    poZmeneCakam(pred);
  }
  function zrusOdklad(text, typ, odkaz) {
    if (odklad != null) clearInterval(odklad);
    odklad = null;
    tlacidlo.removeAttribute("aria-busy");
    if (text) ukazCakam(text, true, odkaz);
    else skryCakam();
    if (typ) ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "odoslanie-" + typ });
  }
  /** Platba nie je overená alebo súhrn nesedí: overiť zo servera; objednávka sama neodíde (zákazník klikne znova). */
  function overPredOdoslanim(dovod) {
    const bezi = k2.sync ? k2.sync.overZnova() : false;
    ukazCakam(bezi ? T.overujem : T.skontrolujte, !bezi);
    ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "odoslanie-" + dovod });
    if (bezi) k2.sync.pripravene(ODLOZ_MAX_MS).then(function () { if (cakam.textContent === T.overujem) ukazCakam(T.skontrolujte, true); });
  }
  function odlozOdoslanie(dovod) {
    if (odklad != null) return; // už čakáme
    const sy = k2.sync;
    if (dovod === "nezhoda" || (dovod === "platba" && sy && sy.stav() !== "meni-sa")) return overPredOdoslanim(dovod);
    // voľba v čase kliku: odoslať sa smie len ona (revízia R7)
    const priKliku = sy ? sy.vybrane() : null;
    const menilaSa = !!sy && sy.stav() === "meni-sa";
    /** Odložené odoslanie smie odísť len s potvrdenou voľbou z času kliku (alebo v záchrane, kde voľby nemeníme). */
    const smieOdist = function () {
      if (!sy || !priKliku) return true;
      const s = sy.stav();
      if (s === "zachrana") return true;
      if (!rovnake(sy.potvrdene(), priKliku)) return false;
      return s === "potvrdene" || (s === "chyba" && sy.overene() && !menilaSa);
    };
    ukazCakam(dovod === "kosik" ? T.cakamKosik : T.cakamPlatbu);
    tlacidlo.setAttribute("aria-busy", "true");
    const t0 = Date.now();
    odklad = setInterval(function () {
      // zákazník medzitým zvolil inú dopravu / platbu, alebo zmena, na ktorú klik čakal, zlyhala -> neodoslať s pôvodnou,
      // nech skontroluje a klikne znova
      if (sy && priKliku && !rovnake(sy.vybrane(), priKliku)) return zrusOdklad(T.skontrolujte, "zmena-pocas-cakania");
      if (sy && menilaSa && sy.stav() === "chyba") return zrusOdklad(T.skontrolujte, "platba-" + (sy.typ() || "?"));
      const b = blokovane();
      if (!b) {
        if (!smieOdist()) return zrusOdklad(T.skontrolujte, "nepotvrdene");
        zrusOdklad("");
        // natívne poradie ďalej: validácia Shoptetu -> postSuccessfulValidation (toNote) -> POST Step2Validate
        try {
          if (typeof form.requestSubmit === "function") form.requestSubmit(tlacidlo);
          else tlacidlo.click();
        } catch (e) { tlacidlo.click(); }
        return;
      }
      if (b === "nezhoda") return zrusOdklad(T.skontrolujte, "nezhoda");
      ukazCakam(b === "kosik" ? T.cakamKosik : T.cakamPlatbu);
      if (Date.now() - t0 > ODLOZ_MAX_MS) zrusOdklad(T.neodoslane, b, T.neodoslaneOdkaz);
    }, 100);
  }
  // ------------------------------------------------------------ zámok pri odoslaní (T3-L7, ODOSIELANIE_MAX_MS)
  // odosielanie.faza: "resync" = kontrola so serverom pred odoslaním beží, "pustene" = submit išiel k Shoptetu
  let odosielanie = null; // null | { faza, casovac } — sekcia je zamknutá
  let pustitDalej = false; // náš requestSubmit po resyncu: najbližší submit ide k Shoptetu (práve 1×)
  k2.odosielanie = function () { return odosielanie ? odosielanie.faza : null; };
  let infoZamku = false; // v sekcii svieti náš sivý text „Objednávka sa odosiela…“ (nie chybová hláška pri platbách)
  /** Sekcia Doprava a platba bez klikania: rádiá disabled (pôvodný stav sa vráti), inert, stlmená (CSS), sivé vysvetlenie. */
  function zamkniSekciu(zap) {
    const sek = k2.sekcia;
    if (!sek) return;
    sek.classList.toggle("lcd-opc-zamknute", zap);
    if (zap) sek.setAttribute("aria-disabled", "true");
    else sek.removeAttribute("aria-disabled");
    try { sek.inert = zap; } catch (e) {}
    sek.querySelectorAll("input[data-lcd-opc]").forEach(function (i) {
      if (zap) {
        if (!i.hasAttribute("data-lcd-opc-zamok")) { i.setAttribute("data-lcd-opc-zamok", i.disabled ? "1" : "0"); i.disabled = true; }
      } else if (i.hasAttribute("data-lcd-opc-zamok")) {
        i.disabled = i.getAttribute("data-lcd-opc-zamok") === "1";
        i.removeAttribute("data-lcd-opc-zamok");
      }
    });
    // telefón: Shoptet pri overení telefónu posunie stránku k poľu Telefón a „Odosielam…“ v tlačidle je mimo obrazovky ->
    // zamknutá sekcia povie, čo sa deje (revízia vzhľadu); chybovú hlášku pri platbách neprepíše
    const h = sek.querySelector(".lcd-opc-hlaska");
    if (zap) {
      if (h && (h.hidden || h.classList.contains("lcd-opc-hlaska--info"))) { V.hlaska(sek, T.odosiela, null, true); infoZamku = true; }
    } else if (infoZamku) {
      infoZamku = false;
      if (h && h.textContent === T.odosiela) V.hlaska(sek, "");
    }
  }
  /** „Odosielam…“ v tlačidle; pôvodný text Shoptetu ostáva v DOM (len skrytý cez CSS) a po odomknutí sa ukáže. */
  function tlacidloOdosielam(zap) {
    let t = tlacidlo.querySelector(".lcd-opc-odosielam-text");
    if (zap) {
      if (!t) {
        t = document.createElement("span");
        t.className = "lcd-opc-odosielam-text";
        t.textContent = T.odosielam;
        tlacidlo.appendChild(t);
      }
      tlacidlo.classList.add("lcd-opc-odosielam");
      tlacidlo.setAttribute("aria-busy", "true");
    } else {
      if (t) t.remove();
      tlacidlo.classList.remove("lcd-opc-odosielam");
      if (odklad == null) tlacidlo.removeAttribute("aria-busy");
    }
  }
  function zacniOdosielanie(faza) {
    if (odosielanie && odosielanie.casovac) clearTimeout(odosielanie.casovac);
    odosielanie = { faza: faza, casovac: null };
    odosielanie.casovac = setTimeout(function () {
      ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "odoslanie-limit" });
      koniecOdosielania();
    }, ODOSIELANIE_MAX_MS);
    if (k2.sync) k2.sync.zamkni(true);
    zamkniSekciu(true);
    tlacidloOdosielam(true);
  }
  function koniecOdosielania() {
    if (!odosielanie) return;
    if (odosielanie.casovac) clearTimeout(odosielanie.casovac);
    odosielanie = null;
    pustitDalej = false;
    if (k2.sync) k2.sync.zamkni(false);
    zamkniSekciu(false);
    tlacidloOdosielam(false);
    obnovTlacidlo();
  }
  /** Sekcia je postavená a mimo záchrany (len vtedy je čo zamykať a overovať). */
  function jeSekcia() {
    return !!(k2.sync && k2.model && k2.sekcia && k2.sync.stav() !== "zachrana");
  }

  let zlyhaniaResync = 0; // zlyhania kontroly pred odoslaním za sebou (2. = záchrana, revízia 29. 10.)
  /** Dočasná chyba kontroly (sieť, limit, 5xx zo servera): zmysel má skúsiť znova; iné typy znamenajú trvalú chybu. */
  function docasne(p) {
    return /^(step1|krok1)-(siet|limit)$/.test(p.typ) || p.typ === "vynimka" || (p.typ === "step1-kod" && Number(p.kod) >= 500);
  }
  /** Je platba rýchla platba cez banku (Shoptet Pay „pis“)? */
  function jePis(id) {
    const p = k2.model && k2.model.platby.find(function (x) { return x.id === String(id); });
    return !!(p && p.podmetoda === "pis");
  }
  /**
   * Voľby pre Step1Validate: pri rýchlej platbe s výberom banky v OPC aj kód zvolenej banky (shoptetPayPisCode, ako formulár
   * kroku 1). Kód sa berie v čase odoslania, takže ide vždy posledná potvrdená banka.
   */
  function volbyStep1(v) {
    const o = { shippingId: v.doprava, billingId: v.platba };
    if (k2.banky && k2.banky.banka && jePis(v.platba)) o.shoptetPayPisCode = k2.banky.banka.code;
    return o;
  }
  /** Suma „Celkom k úhrade“ ako číslo (porovnanie súhrnu na stránke so serverom). */
  function suma(info) {
    return info ? V.cisloZCeny(info.celkom) : null;
  }
  /**
   * Resync tesne pred odoslaním (živý dôkaz T5b, T6b): session Shoptetu mohla zmeniť iná karta (platba) alebo iné okno
   * (košík), Step2Validate nenesie ani platbu, ani košík. Preto: Step1Validate so ZOBRAZENOU voľbou (prísne kritérium) a GET
   * krok 1 -> voľba aj „Celkom k úhrade“ musia sedieť so súhrnom na stránke. Zhoda -> requestSubmit práve 1× (validácia
   * Shoptetu ďalej natívne). Nezhoda -> neodoslať, súhrn a voľba zo servera, hláška. Chyba -> neodoslať, hláška s odkazom
   * na klasický krok 1; trvalá chyba (session bez kroku 1, odmietnutie servera) alebo 2. zlyhanie za sebou -> záchrana.
   * Bežne 2 požiadavky (~0,3 s naživo, 🟡 odhad z dôkazu: Step1Validate 0,13–0,17 s, krok 1 0,18–0,5 s). Rýchla platba
   * cez banku (112): Step1Validate s kódom banky zvolenej v OPC (shoptetPayPisCode, volbyStep1). Len v zálohe bez zoznamu
   * bánk (banka z klasického kroku 1, OPC kód nepozná) bez Step1Validate, len GET krok 1.
   */
  function resync() {
    const sy = k2.sync;
    const zobrazene = sy.potvrdene();
    const sumaPred = suma(suhrnInfo(box));
    zacniOdosielanie("resync");
    const tento = odosielanie;
    // rýchla platba cez banku v zálohe (banku vybral widget klasického kroku 1, OPC kód nepozná): Step1Validate bez kódu by
    // banku v session prepísal (revízia 29. 10.) -> len overenie zo servera (GET krok 1: voľba aj suma)
    const krok = jePis(zobrazene.platba) && !k2.banky
      ? Promise.resolve({ ok: true })
      : posliStep1(k2.model, volbyStep1(zobrazene));
    krok
      .then(function (r) {
        if (!r.ok) return { ok: false, typ: "step1-" + r.typ, kod: r.kod };
        return nacitajKrok1().then(function (k) {
          if (!k.ok) return { ok: false, typ: "krok1-" + k.typ };
          const p = V.potvrdenieZKroku1(k.html, box, V.menaWebu());
          return p.ok ? p : { ok: false, typ: p.typ };
        });
      })
      .catch(function () { return { ok: false, typ: "vynimka" }; })
      .then(function (p) {
        if (odosielanie !== tento) return; // medzitým návrat (pageshow) alebo bezpečnostný limit
        if (!p.ok) {
          koniecOdosielania();
          zlyhaniaResync++;
          ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "odoslanie-resync-" + p.typ, lcd_opc_kod: p.kod != null ? p.kod : null });
          if (docasne(p) && zlyhaniaResync < 2) return ukazCakam(T.neodoslane, true, T.neodoslaneOdkaz);
          // trvalé zlyhanie (revízia 29. 10.): odmietnutie servera (303 + errors zruší krok 1 v session), session alebo košík
          // sú preč, zmenené HTML, alebo 2. zlyhanie za sebou -> kontrola tu nemá ako prejsť. Záchrana: sekcia preč, odkaz
          // na klasický krok 1, ďalší klik ide natívne ako bez OPC (🟡 Shoptet pri session bez kroku 1 presmeruje, overí F4)
          zachrana("resync-" + p.typ);
          ukazCakam(T.neodoslaneZachrana, true, T.neodoslaneOdkaz);
          return;
        }
        zlyhaniaResync = 0;
        const volbaSedi = rovnake(p.volby, zobrazene);
        const sumaSedi = sumaPred !== null && suma(p.info) === sumaPred;
        if (volbaSedi && sumaSedi) return pust();
        // iné okno / karta: objednávka neodíde, zákazník uvidí, čo má server, a klikne znova
        koniecOdosielania();
        sy.prevezmi(p.volby, p.html, p.info);
        ukazCakam(T.zmenaInde, true);
        ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "odoslanie-ine-okno", lcd_opc_volba: volbaSedi, lcd_opc_suma: sumaSedi });
      });
  }
  /** Resync sedí: submit k Shoptetu práve 1× (náš capture ho pustí), sekcia ostáva zamknutá (T3-L7). */
  function pust() {
    odosielanie.faza = "pustene";
    pustitDalej = true;
    try {
      if (typeof form.requestSubmit === "function") form.requestSubmit(tlacidlo);
      else tlacidlo.click();
    } catch (e) {
      try { if (pustitDalej) tlacidlo.click(); } catch (x) {}
    }
    // submit sa nespustil (prehliadač ho zastavil) -> nič nečaká, odomknúť
    if (pustitDalej) { pustitDalej = false; koniecOdosielania(); }
  }

  // capture na dokumente: beží pred validáciou Shoptetu (jQuery submit na formulári)
  document.addEventListener("submit", function (e) {
    try {
      if (e.target !== form) return;
      if (pustitDalej) {
        // náš requestSubmit po resyncu -> validácia Shoptetu a natívne odoslanie; zámok drží (T3-L7)
        pustitDalej = false;
        if (cakamTrvale) skryCakam();
        return;
      }
      if (odosielanie || Date.now() < zamokDo) {
        // dvojklik počas resyncu / objednávka sa už odosiela; klik sa nezahodí potichu (revízia R4)
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!odosielanie || odosielanie.faza !== "resync") ukazCakam(T.odosiela, true);
        return;
      }
      // kontrola polí (Michal 29. 10.): prvé chýbajúce / chybné pole -> posun, rám, text, kurzor; nič neodíde ani sa
      // neoveruje so serverom (žiadny resync pri neúplnom formulári)
      const zle = K.prvaChyba(form, jeSekcia() ? k2.sekcia : null);
      if (zle) {
        e.preventDefault();
        e.stopImmediatePropagation();
        ukazChybuPola(zle, "klik");
        return;
      }
      const b = blokovane();
      if (b) {
        e.preventDefault();
        e.stopImmediatePropagation();
        odlozOdoslanie(b);
        return;
      }
      if (cakamTrvale) skryCakam();
      if (!jeSekcia()) return; // záchrana / sekcia sa ešte načítava: dnešné odoslanie bez zmeny
      // pred odoslaním over so serverom, že objednávka bude to, čo zákazník vidí (T5b, T6b); sekcia sa zamkne (T3-L7)
      e.preventDefault();
      e.stopImmediatePropagation();
      resync();
    } catch (x) { /* náš kód zlyhal -> odoslanie ide natívne */ }
  }, true);
  /** Zlé pole: text (Shoptetu, inak náš), rám, posun nad lištu, kurzor; meranie lcd_opc_chyba typ "pole". */
  function ukazChybuPola(z, zdroj) {
    K.oznacChybu(z, K.textChyby(z, T, K.spravyShoptetu(window)));
    obnovKarty(); // červený krúžok čísla karty s chybou
    const panel = document.getElementById("checkoutSidebar");
    if (panel && panel.contains(z.el)) srovnajPanel(); // text pod súhlasom zväčší bočný panel (PC)
    const l = H.classList.contains("lcd-lista-on") && lista ? lista.getBoundingClientRect().height : 0;
    K.posunNaChybu(z, { dole: l + 8 });
    ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "pole", lcd_opc_pole: z.el.id || z.el.name || z.dovod, lcd_opc_dovod: z.dovod, lcd_opc_zdroj: zdroj });
  }
  // oprava poľa: rám a náš text hneď preč (input = počas písania, change = výber, opustenie a zrušenie chyby Shoptetom
  // po jeho kontrole, napr. overenie telefónu)
  const poOprave = function (e) { try { K.poOprave(e.target); } catch (x) {} };
  form.addEventListener("input", poOprave, true);
  form.addEventListener("change", poOprave, true);
  form.addEventListener("shoptetRemoveErrorMessage", poOprave, true);
  form.addEventListener("focusout", function (e) { setTimeout(function () { poOprave(e); }, 0); }, true);
  form.addEventListener("ShoptetSuccessfulValidation", function () {
    zamokDo = Date.now() + ZAMOK_MS;
    ctx.meraj("lcd_opc_odoslanie", { lcd_opc_platba: k2.sync ? k2.sync.potvrdene().platba : null });
  });
  /**
   * Shoptet práve overuje telefón (GET ShoptetValidatePhone). Vtedy pri submit ohlási ShoptetFailedValidation (pole je
   * počas overenia disabled), ale zároveň si odloží odoslanie: po overení formulár znova zvaliduje a pošle sám (form.submit
   * bez udalosti submit). Overené v teste nad jeho main-3g.js 29. 10. 2026 (🟡 vnútorný čítač validatorPhone.ajaxPending
   * + trieda js-validated-field na poli počas overenia).
   */
  function telefonSaOveruje() {
    try {
      const v = window.shoptet && window.shoptet.validatorPhone;
      if (v && Number(v.ajaxPending) > 0) return true;
      return !!form.querySelector(".js-validate-phone.js-validated-field[disabled]");
    } catch (e) {
      return false;
    }
  }
  // validácia neprešla -> zámok preč, zákazník opraví pole, môže meniť platbu a ďalší klik prejde (revízia R4, T3-L7);
  // keď sa telefón ešte overuje, Shoptet formulár po overení pošle sám -> zámok drží, kým nepríde ďalší výsledok
  form.addEventListener("ShoptetFailedValidation", function () {
    zamokDo = 0;
    if (odosielanie && telefonSaOveruje()) return;
    koniecOdosielania();
    if (cakam.textContent === T.odosiela) skryCakam();
    // Shoptet našiel chybu, ktorú kontrola pred klikom nevidela (napr. telefón neprešiel overením): ako pri kliku —
    // rám, posun, kurzor. Hneď (nie s odkladom): po overení telefónu Shoptet sám neposúva ani nedáva kurzor (S38), pri
    // okamžitej chybe jeho posun (requestAnimationFrame) ide na to isté pole.
    try { const z = K.prvaChyba(form, jeSekcia() ? k2.sekcia : null); if (z) ukazChybuPola(z, "shoptet"); } catch (e) {}
  });
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    zamokDo = 0;
    koniecOdosielania();
    tlacidlo.removeAttribute("aria-busy");
    skryCakam();
    obnovTlacidlo();
  });

  // výmena doplnku v inej karte (záznam v localStorage): kým beží, „Objednať“ stojí (kniha § 6.9)
  let sledovanie = null;
  function sledujVymenu() {
    if (sledovanie != null) return;
    sledovanie = setInterval(function () {
      if (!vymenaBezi()) { clearInterval(sledovanie); sledovanie = null; obnovTlacidlo(); }
    }, 500);
  }
  window.addEventListener("storage", function (e) { if (!e.key || e.key === "lcdDoplnokVymena") obnovTlacidlo(); });
  obnovTlacidlo();

  // ------------------------------------------------------------ súhrn Shoptetu: rozpis, zbalený súhrn, lišta
  let zbalene = null, lista = null;
  let potvrdenyHtml = null; // #summary-box (už s rozpisom) k potvrdenej voľbe — sem sa súhrn vracia, nikdy nie k prepočtu
  /**
   * Po zmene súhrnu: zbalený súhrn a suma v lište. Rozpis položiek (cart.js changeDescription) LEN nad čerstvým HTML
   * zo servera — nad už spracovaným súhrnom nie je idempotentný (kamión bez truckOrderSummary by prišiel o rozpis, R3).
   */
  function poZmeneSuhrnu(rozpis) {
    if (rozpis) { try { changeDescription(); } catch (e) {} }
    rozsirPolozky();
    try {
      if (zbalene) V.obnovZbalenySuhrn(zbalene, box, T);
      const info = suhrnInfo(box);
      const c = lista && lista.querySelector(".lcd-opc-lista__celkom");
      if (c) c.textContent = info ? info.celkom : "";
    } catch (e) {}
  }
  // Shoptet prekreslil súhrn sám (step2CustomerAjax pri opustení poľa): rozpis nad novým HTML; keď súhrn ukazuje inú
  // voľbu, než je potvrdená, overí sa zo servera, čo session naozaj má (a kým nie, odoslanie stojí)
  const pozorovatel = new MutationObserver(function (zaznamy) {
    // rozpis (changeDescription) len keď Shoptet naozaj vymenil položky (nové .cart-items / .cart-item), nie keď checkout-3g
    // len vloží #shipping-billing-summary (setActiveShippingAndPayments po našom rozpise: pomalé zariadenie, data.json
    // z keše) — druhý beh nad už spracovaným kamiónom rozpis vymaže (revízia 30. 10. 2026, K1-3; S24)
    const novePolozky = zaznamy.some(function (m) {
      return Array.prototype.some.call(m.addedNodes, function (n) {
        return n.nodeType === 1 && (n.matches(".cart-items, .cart-item") || !!n.querySelector(".cart-item"));
      });
    });
    poZmeneSuhrnu(novePolozky);
    try {
      const sy = k2.sync;
      if (!sy || !k2.model || sy.stav() === "meni-sa" || sy.stav() === "zachrana") return;
      if (rovnake(volbaZoSuhrnu(k2.model, suhrnInfo(box)), sy.potvrdene())) potvrdenyHtml = box.innerHTML;
      else sy.overZnova();
    } catch (e) {}
    obnovTlacidlo();
  });
  pozorovatel.observe(box, { childList: true });
  /** Náš zápis do súhrnu: html zo servera (surove = rozpis treba) alebo posledný potvrdený (už s rozpisom). */
  function nastavSuhrn(html, surove) {
    box.innerHTML = html;
    pozorovatel.takeRecords(); // vlastný zápis: pozorovateľ nespúšťať (rozpis by bežal 2×)
    poZmeneSuhrnu(surove);
    if (surove) potvrdenyHtml = box.innerHTML;
  }

  function zachrana(dovod) {
    ctx.stav = "krok2-zachrana";
    if (k2.sync) k2.sync.zachrana(dovod);
    if (nacitavam.parentNode) nacitavam.remove();
    const neskoro = !!(k2.sekcia && k2.sekcia.parentNode); // sekcia už stála (napr. zlyhaná kontrola pred odoslaním)
    if (neskoro) k2.sekcia.remove();
    H.classList.remove("lcd-opc-aktivne");
    H.classList.add("lcd-opc-zachrana");
    if (neskoro) srovnajPanel(); // obsah sa skrátil o sekciu -> panel s tlačidlom nesmie ostať pod koncom obsahu
    // krok 1 sa preskočil a sekcia sa nezobrazí -> pod odkazom „Zmeniť dopravu alebo platbu“ spôsoby platby z VOP 4.5
    // (kniha § 6.10 bod 5, SK § 17 ods. 2; Michal 29. 10.: „použi, čo už máme vo VOP“), zvolená ostáva v súhrne
    if (!document.querySelector(".lcd-opc-zmenit")) {
      const a = document.createElement("a");
      a.className = "lcd-opc-zmenit";
      a.href = V.CESTA_KROK1;
      a.textContent = T.zmenitVolby;
      const p = document.createElement("p");
      p.className = "lcd-opc-zmenit-riadok";
      p.appendChild(a);
      box.parentNode.insertBefore(p, box.nextSibling);
      p.parentNode.insertBefore(V.vetaSOdkazom(document, "p", "lcd-opc-platby-vop", T.platbyZachrana, T.platbyZachranaOdkaz, T.vop), p.nextSibling);
    }
    obnovTlacidlo();
    ctx.meraj("lcd_opc_zachrana", { lcd_opc_dovod: dovod });
    odkry();
  }

  // ------------------------------------------------------------ dáta z kroku 1 (s limitom: visiaca sieť = záchrana, R6)
  // zoznam bánk Shoptet Pay súbežne s krokom 1 (rýchla platba cez banku, opc/banka.js; limit 4 s): zlyhanie = záloha,
  // nie záchrana — rýchla platba ostane riadkom s odkazom na klasický krok 1
  const bankyP = B.nacitajBanky().catch(function () { return { ok: false, typ: "vynimka" }; });
  nacitajKrok1()
    .then(function (r) {
      if (!r.ok) return { ok: false, dovod: "krok1-" + r.typ };
      // begin_checkout, ktorý by poslal natívny krok 1 (payload z jeho inline skriptu; fail-closed, T9a)
      try { A.posliBeginCheckout(r.html, preskocilKrok1); } catch (e) {}
      return krok1Model(r.html);
    })
    .catch(function () { return { ok: false, dovod: "krok1-siet" }; })
    .then(function (m) {
      if (!m || !m.ok) return zachrana((m && m.dovod) || "krok1");
      // súhrn na stránke (session Shoptetu) musí ukazovať to isté, čo má zaškrtnuté krok 1
      const info = suhrnInfo(box);
      const server = volbaZoSuhrnu(m, info);
      if (!server) return zachrana(info ? "nezhoda-nazov" : "suhrn");
      if (server.doprava !== m.zvolenaDoprava || server.platba !== m.zvolenaPlatba) return zachrana("nezhoda");
      return bankyP.then(function (b) { postav(m, server, info, b); });
    })
    .catch(function (e) {
      ctx.chyby.push(String((e && e.message) || e));
      zachrana("vynimka");
    });

  function applePay() {
    try { return !!(window.ApplePaySession && window.ApplePaySession.canMakePayments()); } catch (e) { return false; }
  }

  /** Zoznam bánk -> stav výberu (krajina, banka podľa localStorage ako widget kroku 1), len keď má krok 1 rýchlu platbu aj jej podmienky. */
  function stavBanky(m, b) {
    try {
      if (!b || !b.ok || !m.pisPodmienky || !m.platby.some(function (p) { return p.podmetoda === "pis"; })) return null;
      return B.stavBanky(b.data, B.ulozisko(window), B.menaAJazyk(window));
    } catch (e) {
      return null;
    }
  }

  function postav(m, volby, info, banky) {
    k2.model = m;
    k2.banky = stavBanky(m, banky);
    if (!k2.banky && m.platby.some(function (p) { return p.podmetoda === "pis"; })) {
      ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "banky-" + ((banky && !banky.ok && banky.typ) || (m.pisPodmienky ? "prazdne" : "podmienky")) });
    }
    const druh = V.druhKosika(info.polozky.map(function (p) { return p.nazov || p.text; }));
    const sek = V.vykresliSekciu(document, m, T, { volby: volby, applePay: applePay(), termin: V.terminDorucenia(druh),
      banka: k2.banky ? { banka: k2.banky.banka, podmienky: m.pisPodmienky } : null });
    k2.sekcia = sek;
    nacitavam.replaceWith(sek);
    try { lcdDobierkaZaloha(); } catch (e) {} // „+ záloha“ pri dobierke (cart.js) nad našimi rádiami

    box.setAttribute("data-lcd-opc-prepocet", T.prepocitavam); // text „Prepočítavam…“ pod súhrnom počas zmeny (CSS)
    // add_payment_info pri potvrdenej zmene platby (Shoptet ho poslal pri načítaní so session platbou; T12)
    let platbaGa = function () { return false; };
    platbaGa.zname = function () {};
    try { platbaGa = A.sledujPlatbu({ skript: A.skriptSUdalostou(document, "add_payment_info"), platba: volby.platba, model: m, meraj: ctx.meraj }); } catch (e) {}
    potvrdenyHtml = box.innerHTML; // súhrn stránky (rozpis už spravil cart.js) = overená voľba pri štarte
    const mena = V.menaWebu();
    const sync = vytvorSync({
      zvolene: volby,
      posli: function (v) { return posliStep1(m, volbyStep1(v)); },
      // čo má session: GET krok 1 (zaškrtnuté voľby + súhrn so sumou, ~100 kB); záloha GET krok 2, keď súhrn kroku 1
      // nestačí (oba s limitom 4 s); step2CustomerAjax sa nevolá (naživo vracia payload [] bez HTML)
      potvrd: function () {
        return nacitajKrok1().then(function (r) {
          if (!r.ok) return r;
          const p = V.potvrdenieZKroku1(r.html, box, mena);
          if (p.ok) return p;
          const mm = p.model || m;
          return nacitajSuhrnKroku2().then(function (r2) {
            if (!r2.ok) return r2;
            const i = suhrnInfo(r2.html);
            return { ok: !!i, volby: volbaZoSuhrnu(mm, i), html: r2.html, info: i, zdroj: "krok2", zaloha: p.typ };
          });
        });
      },
      naZmenu: function (stav, d) {
        ctx.stav = "krok2-" + stav;
        if (stav === "meni-sa") {
          V.nastavVolby(sek, d.volby);
          // „Prepočítavam…“ aj pri platbách (na telefóne je súhrn ďaleko pod nimi), sivé
          V.hlaska(sek, d.overenie ? T.overujem : T.prepocitavam, null, true);
          if (cakamTrvale && !d.overenie) skryCakam(); // zákazník mení voľbu -> stará hláška pri tlačidle neplatí
          box.classList.add("lcd-opc-prepocet");
          box.setAttribute("aria-busy", "true");
          if (!d.overenie) {
            // lokálny prepočet od toho, čo súhrn na stránke naozaj ukazuje (nie od predpokladu)
            try {
              const naStranke = volbaZoSuhrnu(m, suhrnInfo(box));
              if (naStranke) V.prepocitajSuhrn(box, m, naStranke, d.volby, mena);
            } catch (e) {}
          }
          poZmeneSuhrnu(false);
        } else {
          box.classList.remove("lcd-opc-prepocet");
          box.removeAttribute("aria-busy");
          // súhrn = vždy zo servera: nový (ako Shoptet: $("#summary-box").html(…)), inak posledný potvrdený — nikdy
          // nezostane lokálny prepočet (návrat v rámci debounce, chyba, neoverené; revízia R1)
          if (d.html) nastavSuhrn(d.html, true);
          else if (potvrdenyHtml != null) nastavSuhrn(potvrdenyHtml, false);
          V.nastavVolby(sek, stav === "potvrdene" ? d.potvrdene : d.volby);
          if (stav === "chyba") {
            // platba, ktorú má session podľa servera (pôvodná alebo z inej karty), sa do GA neposiela, len zapamätá
            if (d.overene && d.potvrdene) { try { platbaGa.zname(d.potvrdene.platba); } catch (e) {} }
            const pl = m.platby.find(function (x) { return x.id === String((d.volby || {}).platba); });
            V.hlaska(sek, d.overene ? T.chybaPlatby(pl ? pl.nazov : "") : T.chybaOverenia, T.chybaPlatbyOdkaz);
            ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "platba-" + (d.typ || "?"), lcd_opc_overene: !!d.overene });
          } else if (stav === "potvrdene") {
            V.hlaska(sek, "");
            ctx.meraj("lcd_opc_zmena_platby", { lcd_opc_platba: d.potvrdene.platba, lcd_opc_doprava: d.potvrdene.doprava });
            // prevzaté pri resyncu (iné okno) = nezvolil zákazník tu -> len zapamätať (bez dvojitého počítania)
            try { if (d.prevzate) platbaGa.zname(d.potvrdene.platba); else platbaGa(d.potvrdene.platba); } catch (e) {}
          }
        }
        obnovKarty();
        obnovTlacidlo();
      },
    });
    k2.sync = sync;

    sek.addEventListener("change", function (e) {
      const i = e.target;
      if (!i || i.type !== "radio" || !i.hasAttribute("data-lcd-opc")) return;
      const v = sync.vybrane();
      if (i.name === "shippingId") {
        v.doprava = i.value;
        const d = m.doprava.find(function (x) { return x.id === i.value; });
        const rel = d ? d.relacie : [];
        sek.querySelectorAll('input[name="billingId"][data-lcd-opc]').forEach(function (b) {
          const nie = rel.length > 0 && rel.indexOf(b.value) === -1;
          b.disabled = nie;
          if (b.nextElementSibling) b.nextElementSibling.classList.toggle("inactive", nie);
        });
        if (rel.length && rel.indexOf(v.platba) === -1) {
          const prva = sek.querySelector('input[name="billingId"][data-lcd-opc]:not(:disabled)');
          if (prva) v.platba = prva.value;
        }
      } else if (i.name === "billingId") {
        if (k2.banky && jePis(i.value)) {
          // rýchla platba cez banku: najprv okno výberu banky, platba sa zmení až po „Potvrdiť výber“; „Späť“ = rádio späť
          // na doterajšiu voľbu a nič neodíde (Michal 30. 10. 2026)
          vyberBanku(i, function (ok) {
            if (!ok) { V.nastavVolby(sek, sync.vybrane()); return; }
            const v2 = sync.vybrane();
            v2.platba = i.value;
            sync.zvol(v2);
          });
          return;
        }
        v.platba = i.value;
      }
      sync.zvol(v);
    });
    /**
     * Okno výberu banky (opc/banka.js). Potvrdená banka sa zapíše do localStorage ako vo widgete kroku 1 a do riadku pod
     * rýchlou platbou; hotovo(true, ina) = potvrdené (ina = iná banka než doteraz), hotovo(false) = Späť / Esc / klik
     * vedľa. Počas odosielania (zámok) ani v záchrane sa neotvorí.
     */
    function vyberBanku(fokus, hotovo) {
      if (sync.zamknute() || sync.stav() === "zachrana" || !k2.banky) { hotovo(false); return; }
      try {
        B.otvorOkno(document, {
          T: T, krajiny: k2.banky.krajiny, krajina: k2.banky.krajina, banka: k2.banky.banka && k2.banky.banka.code, fokus: fokus,
          naKoniec: function (r) {
            if (!r || sync.zamknute() || sync.stav() === "zachrana") { hotovo(false); return; }
            const ina = !k2.banky.banka || k2.banky.banka.code !== r.banka.code;
            k2.banky.krajina = r.krajina;
            k2.banky.banka = r.banka;
            B.ulozBanku(B.ulozisko(window), { krajina: r.krajina, banka: r.banka.code, mena: B.menaAJazyk(window).mena });
            V.nastavBanku(sek, r.banka);
            ctx.meraj("lcd_opc_banka", { lcd_opc_krajina: r.krajina, lcd_opc_ina: ina });
            hotovo(true, ina);
          },
        });
      } catch (e) {
        ctx.chyby.push(String((e && e.message) || e));
        hotovo(false);
      }
    }
    // „Zmeniť banku“ pod zvolenou rýchlou platbou: iná banka pri tej istej platbe = Step1Validate s novým kódom (sync.znova)
    sek.addEventListener("click", function (e) {
      const b = e.target && e.target.closest ? e.target.closest("[data-lcd-opc-zmenit-banku]") : null;
      if (!b) return;
      e.preventDefault();
      vyberBanku(b, function (ok, ina) {
        if (ok && ina && jePis(sync.vybrane().platba)) sync.znova();
      });
    });
    // neoverená platba: klik na už zaškrtnuté rádio („zvoľte ju znova“) change nevyvolá -> zvoliť ručne
    sek.addEventListener("click", function (e) {
      const i = e.target;
      if (!i || i.type !== "radio" || !i.hasAttribute("data-lcd-opc") || !i.checked) return;
      if (sync.stav() !== "chyba" || sync.overene()) return;
      const v = sync.vybrane();
      if ((i.name === "billingId" ? v.platba : v.doprava) === i.value) sync.zvol(v);
    });

    upravStranku(m);
    ctx.stav = "krok2-potvrdene";
    H.classList.add("lcd-opc-aktivne");
    obnovKarty();
    obnovTlacidlo();
    odkry(); // všetko stojí (sekcia, kroky, zbalený súhrn, lišta) -> formulár naraz, bez posunu
  }

  /** Zvyšok stránky: kroky, Späť, zbalený súhrn, lišta, upraviť košík, zákonný riadok, polia, Luxia. */
  function upravStranku(m) {
    V.upravKroky(document.querySelector("ol.cart-header"), T);
    // krok 1 sa preskočil -> Späť vedie do košíka (Shoptet tam má /objednavka/krok-1/) a hovorí to
    const spat = document.querySelector("#checkoutSidebar .next-step-back");
    if (spat) { spat.setAttribute("href", "/kosik/"); spat.textContent = T.spatKosik; }
    // štát v adrese: „Môžete zmeniť v predchádzajúcom kroku“ -> „Zmeniť štát“ (krok s krajinou zákazník nevidel), odkaz
    // na klasický krok 1 (tam je výber krajiny) ostáva
    form.querySelectorAll("em.helpNote").forEach(function (em) {
      const a = em.querySelector("a[href]");
      if (!a || !/^\/objednavka\/krok-1\/?$/.test(a.getAttribute("href"))) return;
      a.textContent = T.zmenitStat;
      em.textContent = "";
      em.appendChild(a);
    });
    // telefón: zbalený súhrn navrchu (CSS ho na PC skryje)
    const hlavicka = obsah.querySelector("ol.cart-header");
    zbalene = V.vytvorZbalenySuhrn(document, T);
    if (hlavicka && hlavicka.parentNode) hlavicka.parentNode.insertBefore(zbalene, hlavicka.nextSibling);
    else obsah.insertBefore(zbalene, obsah.firstChild);
    // „Zobraziť viac“ v kópiách položiek (A1): vlastný stav kópie, kópie sa prekresľujú (obnovZbalenySuhrn) -> delegované
    const zb = zbalene;
    zb.addEventListener("click", function (e) { try { P.prepniDetail(e.target, zb, T, null); } catch (x) {} });
    // upraviť košík pri súhrne (mimo #summary-box, ten Shoptet prekresľuje)
    if (!document.querySelector(".lcd-opc-upravit")) {
      const a = document.createElement("a");
      a.className = "lcd-opc-upravit";
      a.href = "/kosik/";
      a.textContent = T.upravitKosik;
      box.parentNode.insertBefore(a, box);
    }
    // tovar na mieru = bez odstúpenia po začatí výroby (VOP 6.13, kniha § 8 otázka 3), sivý riadok pod súhlasmi, nad
    // tlačidlom; len pri tovare na mieru (V.naMieru: koberce, rohože, kamióny — nie samotný box, vzorky, poukážka). Text
    // súhlasu sa nemení.
    const info = suhrnInfo(box);
    const nazvy = info ? info.polozky.map(function (p) { return p.nazov || p.text; }) : [];
    if (V.naMieru(nazvy) && cakam.parentNode && !document.querySelector(".lcd-opc-pravne")) {
      cakam.parentNode.insertBefore(V.vetaSOdkazom(document, "p", "lcd-opc-pravne", T.naMieru, T.naMieruOdkaz, T.vop), cakam);
    }
    // polia: doplniť len chýbajúce autocomplete / inputmode (kniha § 6.4), nič iné sa nemení. Číselná klávesnica pri PSČ
    // len keď vzor Shoptetu pre krajinu je len z číslic (SK, CZ); PL „00-950“ potrebuje pomlčku
    const lenCisla = function (e) { const v = e.getAttribute("data-pattern") || e.getAttribute("pattern") || ""; return !!v && v.indexOf("-") === -1; };
    [["billZip", null, "numeric"], ["deliveryZip", "shipping postal-code", "numeric"], ["deliveryFullName", "shipping name", null],
      ["deliveryStreet", "shipping street-address", null], ["deliveryCity", "shipping address-level2", null], ["deliveryCompany", "shipping organization", null]]
      .forEach(function (x) {
        const e = document.getElementById(x[0]);
        if (!e) return;
        if (x[1] && !e.hasAttribute("autocomplete")) e.setAttribute("autocomplete", x[1]);
        if (x[2] && !e.hasAttribute("inputmode") && lenCisla(e)) e.setAttribute("inputmode", x[2]);
      });
    // lišta dole „Celkom … | Objednať s povinnosťou platby“ (Michal 29. 10.): klik = klik na natívne tlačidlo (kontrola
    // polí, resync, zámok, analytika — všetko ako pri ňom), skryje sa, keď je „Objednať“ na obrazovke. Telefón: celá
    // šírka; PC: karta nad stĺpcom súhrnu, len keď tlačidlo v bočnom paneli nevidno (vysoký panel navrchu stránky)
    lista = V.vytvorListu(document, T, V.textTlacidla(tlacidlo, T));
    document.body.appendChild(lista);
    const listaBtn = lista.querySelector("button");
    const listaText = lista.querySelector(".lcd-opc-lista__text");
    const textObjednat = listaText.textContent;
    listaBtn.addEventListener("click", function () { tlacidlo.click(); });
    // stav natívneho tlačidla (čaká, zablokované, „Odosielam…“) aj v lište
    const zrkadli = function () {
      ["aria-busy", "aria-disabled"].forEach(function (a) {
        if (tlacidlo.hasAttribute(a)) listaBtn.setAttribute(a, tlacidlo.getAttribute(a)); else listaBtn.removeAttribute(a);
      });
      const t = tlacidlo.classList.contains("lcd-opc-odosielam") ? T.odosielam : textObjednat;
      if (listaText.textContent !== t) V.nastavTextListy(listaText, t);
    };
    zrkadli();
    try { new MutationObserver(zrkadli).observe(tlacidlo, { attributes: true, attributeFilter: ["aria-busy", "aria-disabled", "class"] }); } catch (e) {}
    const panel = document.getElementById("checkoutSidebar");
    /** PC: karta lišty presne nad viditeľnou kartou súhrnu (bočný panel má vľavo 24 px odsadenie — lišta bola širšia, revízia). */
    const zarovnajListu = function () {
      try {
        if (!panel || window.innerWidth < 992) { lista.style.removeProperty("--lcd-opc-lista-x"); lista.style.removeProperty("--lcd-opc-lista-w"); return; }
        const r = (panel.querySelector(":scope > .cart-content") || panel).getBoundingClientRect();
        lista.style.setProperty("--lcd-opc-lista-x", Math.round(r.left) + "px");
        lista.style.setProperty("--lcd-opc-lista-w", Math.round(r.width) + "px");
      } catch (e) {}
    };
    zarovnajListu();
    window.addEventListener("resize", zarovnajListu);
    if (window.IntersectionObserver) {
      // lišta zmizne, keď je „Objednať“ na obrazovke nad ňou (inak by tlačidlo zakrývala); súhlas už lištu neskryje —
      // tlačidlo Objednať musí byť vidno stále (Michal 29. 10.). 72 px = najmenšia výška lišty (telefón 73, PC 76, obe na
      // spodnom okraji okna): keď svieti, natívne tlačidlo je celé pod ňou, inak je celé nad ňou
      const io = new IntersectionObserver(function (z) {
        const on = !z[z.length - 1].isIntersecting;
        if (on) zarovnajListu();
        if (H.classList.contains("lcd-lista-on") !== on) H.classList.toggle("lcd-lista-on", on);
      }, { rootMargin: "0px 0px -72px 0px" });
      io.observe(tlacidlo);
    }
    poZmeneSuhrnu(false);
    // bublina Luxie ustúpi z „Objednať“ (cart.js, rovnako ako v košíku pri „Pokračovať“), z tlačidla v lište (PC notebook:
    // ležala na jeho pravej polovici) a z polí, odkazov a volieb formulára (telefón: ťuk do poľa Mesto otvoril chat; revízia)
    try { lcdBublinaMimoTlacidla(BUBLINA_USTUPI); } catch (e) {}
  }
}
