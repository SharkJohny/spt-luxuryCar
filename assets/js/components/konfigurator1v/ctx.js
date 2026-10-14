// Spoločný kontext (ctx) modulov nového konfigurátora 1V. JADRO — mení len vydanie (T0.1 14. 10. 2026: všetky SK
// produkty z registra produkty.js — ctx.produkt, ctx.texty, ctx.obrazokVzoru, kroky farba2/pocet/velkost,
// parametre farba2/box3, zapis("pocetKs")). Moduly ho len používajú. Kontrakt a pravidlá: docs/1v-kontrakt.md §4–5.
//
// Zlaté pravidlo: nový vzhľad NIKDY nepíše do košíka sám. Voľbu zákazníka zapíše JEDINE ctx.zapis(kluc, hodnota),
// ktorá klikne na existujúci ovládač živého konfigurátora (tlačidlo voľby / kartu kufra či boxov) — tým bežia všetky
// pôvodné handlery (productPage.js priceActualization: $(select).val(v).trigger("change"), Shoptet variant + priceId,
// livePrice, TYP z auta, validácia, odporúčaná cena). Až keď ovládač neexistuje, nastaví select rovnakou cestou
// ($(select).val(v).trigger("change")). Žiadny vlastný POST, žiadne ceny natvrdo, žiadne ID parametrov natvrdo.
import { lcdGetSteps, lcdStepFilled, lcdFirstUnfilled } from "../../functions/configuratorEngine.js";
import { lcdCena } from "../../functions/livePrice.js";

/** Parametre formulára podľa data-parameter-name (SK aj CZ; ID sa medzi obchodmi líšia — SK 78 = farba, CZ 78 = box solo). */
export const PARAMETRE = {
  farba: /^(farba|barva)\s*1\.?\s*vrstv/i, // variant Shoptetu (mení priceId); box 616: farba boxu
  farba2: /^(farba|barva)\s*2\.?\s*vrstv/i, // dvojvrstvové: variant Shoptetu (SK 71 „farba 2.vrstvy“), priceId = oba varianty
  rozlozenie: /rozlo[žz]en/i,
  kufor: /do\s+kufr/i,
  farbaBoxov: /^(farba|barva)\s+box/i,
  box1: /\b1\.\s*box/i,
  box2: /\b2\.\s*box/i,
  box3: /\b3\.\s*box/i, // box do kufra 616 (SK 100 „Velikost 3. boxu“)
  boxSolo: /box\s*solo/i,
  typ: /^typ$/i, // príplatok za karosériu; nastavuje ho živý kód z auta (productPage.js createModelInfo)
};

/** Karty počtu boxov v živom kroku boxov setu (value atribút .upsale-button). */
const KARTY_BOXOV = { 0: "0", 1: "conf1", 2: "conf2" };

/** Všetky mená živých krokov (ctx.krok / ctx.menoKroku); poradie produktu je ctx.produkt.kroky. */
const MENA_KROKOV = ["vzor", "auto", "farba", "farba2", "rozlozenie", "kufor", "boxy", "pocet", "velkost"];

/** Spoločný priečinok obrázkov 1V na CDN (deploy zrkadlí assets/ repa; obrázky nie sú vo verzii v/<sha>/). */
export const OBRAZKY_1V = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";

const SUFIX_CENY = /\s*\+\s*(?:€|Kč|EUR|CZK)?\s*-?[\d\s.,]+\s*(?:€|Kč|EUR|CZK)?\s*$/i;

function cenaMoznosti(o) {
  const f = Number(o.getAttribute("data-surcharge-final-price"));
  if (Number.isFinite(f) && f > 0) return f;
  const a = Number(o.getAttribute("data-surcharge-additional-price"));
  return Number.isFinite(a) ? a : 0;
}

/**
 * @param {{ setupData: any, texts: any, kontext: any, produkt?: any }} vstup
 *   produkt = záznam registra + typ (produkty.js produkt1v): { id, typ, vzor, url, obsah, kroky, moduly, obal, texty, obrazky }
 */
export function vytvorCtx({ setupData, texts, kontext, produkt }) {
  const form = () => document.getElementById("product-detail-form");
  const jazyk = String(kontext.projectId) === "704436" ? "cs" : kontext.language || document.documentElement.lang || "sk";

  /** { kluc, id, meno, select, variant } alebo null. kluc = meno z PARAMETRE alebo číselné data-parameter-id. */
  function parameter(kluc) {
    const f = form();
    if (!f) return null;
    let s = null;
    if (/^\d+$/.test(String(kluc))) s = f.querySelector('select[data-parameter-id="' + kluc + '"]');
    else if (PARAMETRE[kluc]) {
      s = Array.prototype.find.call(f.querySelectorAll("select[data-parameter-name]"), function (x) {
        return PARAMETRE[kluc].test((x.getAttribute("data-parameter-name") || "").trim());
      }) || null;
    }
    if (!s) return null;
    return { kluc: String(kluc), id: s.getAttribute("data-parameter-id"), meno: s.getAttribute("data-parameter-name"), select: s, variant: !s.classList.contains("surcharge-parameter") };
  }

  /** Možnosti parametra zo Shoptetu: [{ hodnota, text (bez „+€N“), cena (príplatok s DPH; variant 0), zvolena }]. */
  function moznosti(kluc) {
    const p = parameter(kluc);
    if (!p) return [];
    return Array.prototype.filter.call(p.select.options, (o) => o.value).map((o) => ({
      hodnota: o.value,
      text: o.text.replace(SUFIX_CENY, "").replace(/\s+/g, " ").trim(),
      cena: p.variant ? 0 : cenaMoznosti(o),
      zvolena: o.selected,
    }));
  }

  /** Aktuálna hodnota parametra vo formulári ('' = nič). */
  function precitaj(kluc) {
    const p = parameter(kluc);
    return p ? p.select.value || "" : "";
  }

  const ciel = new EventTarget();
  /** Udalosti modulov: ctx.na("zmena", fn) — detail { kluc, hodnota, cesta }; vlastné mená len s predponou modulu. */
  function na(meno, fn) {
    const h = (e) => fn(e.detail, e);
    ciel.addEventListener(meno, h);
    return () => ciel.removeEventListener(meno, h);
  }
  function vysli(meno, detail) {
    ciel.dispatchEvent(new CustomEvent(meno, { detail }));
  }

  /**
   * JEDINÁ schválená cesta zápisu voľby. Vráti "tlacidlo" | "karta" | "select" | "uz" (už bolo zvolené) | null.
   *   zapis("farba", "549"), zapis("rozlozenie", "589"), zapis("kufor", "595"), zapis("farbaBoxov", "604"),
   *   zapis("box1", "622"), zapis("box2", "634"), zapis("boxSolo", "734"), zapis("pocetBoxov", 0|1|2),
   *   zapis("kufor", "") = zrušiť voľbu (karta sa odznačí, select prázdny),
   *   zapis("farba2", "540") (dvojvrstvové), zapis("box3", "706") (box 616),
   *   zapis("pocetKs", 1|2|3) = počet boxov na produkte box do kufra 616 (živé tlačidlo „N ks“: resetBoxSizeOptions
   *   vyprázdni veľkosti nad počtom; živý web pri tom hodí známu chybu „priceActualization is not defined“). Zvolené
   *   veľkosti boxov v rozsahu počtu ostanú (živé „1 ks“ by zmazalo aj 1. box), vyprázdnené dostanú „change“.
   */
  function zapis(kluc, hodnota) {
    const f = form();
    if (!f) return null;
    const h = hodnota == null ? "" : String(hodnota);
    let cesta = null;
    if (kluc === "pocetKs") {
      const n = parseInt(h, 10);
      const tl = n > 0 ? f.querySelectorAll(".amount-wrap > .amount-button")[n - 1] : null;
      if (!tl) return null;
      if (tl.classList.contains("active")) cesta = "uz";
      else {
        // Živé „N ks“ (creatButtons.js resetBoxSizeOptions) pri „1 ks“ vyprázdni aj 1. box a skryté veľkosti nastaví
        // na 0 bez „change“ (živá cena by ostala stará). Po kliku: zvolená veľkosť boxu v rozsahu počtu sa vráti tou
        // istou cestou (zapis -> živé tlačidlo), vyprázdnená veľkosť nad počtom dostane „change“ (prepočet ceny).
        const pred = ["box1", "box2", "box3"].map((k) => { const p = parameter(k); return p ? { k, p, v: p.select.value || "" } : null; }).filter(Boolean);
        tl.click();
        cesta = "tlacidlo";
        pred.forEach((x) => {
          if ((x.p.select.value || "") === x.v) return;
          const poradie = Number(x.k.slice(3));
          if (poradie <= n && x.v !== "" && x.v !== "0") zapis(x.k, x.v);
          else (window.jQuery || window.$)(x.p.select).trigger("change");
        });
      }
      vysli("zmena", { kluc, hodnota: h, cesta });
      return cesta;
    }
    if (kluc === "pocetBoxov") {
      const v = KARTY_BOXOV[h];
      const karta = v != null ? f.querySelector('.upsale-buttons.boxs > .parameter-cars > .upsale-button[value="' + v + '"]') : null;
      if (!karta) return null;
      if (karta.classList.contains("active")) cesta = "uz";
      else { karta.click(); cesta = "karta"; }
      vysli("zmena", { kluc, hodnota: h, cesta });
      return cesta;
    }
    const p = parameter(kluc);
    if (!p) return null;
    const teraz = p.select.value || "";
    if (h === "") {
      const aktivna = f.querySelector('.upsale-button.active[value^="' + p.id + '-"]');
      if (aktivna) { aktivna.click(); cesta = "karta"; }
      else if (teraz !== "") { (window.jQuery || window.$)(p.select).val("").trigger("change"); cesta = "select"; }
      else cesta = "uz";
    } else {
      const tlacidlo = f.querySelector('.option-button[data-variant="' + p.id + '"][data-value="' + h + '"]');
      const karta = tlacidlo ? null : f.querySelector('.upsale-button[value="' + p.id + "-" + h + '"]');
      const ovladac = tlacidlo || karta;
      if (ovladac) {
        if (ovladac.classList.contains("active") && teraz === h) cesta = "uz";
        else { ovladac.click(); cesta = tlacidlo ? "tlacidlo" : "karta"; }
      } else if (teraz !== h) { (window.jQuery || window.$)(p.select).val(h).trigger("change"); cesta = "select"; }
      else cesta = "uz";
    }
    vysli("zmena", { kluc: String(kluc), hodnota: h, cesta });
    return cesta;
  }

  /**
   * Živý krok podľa mena -> element alebo null:
   *   vzor | auto | farba | farba2 | rozlozenie | kufor | boxy | boxyVyber | kosik | cena
   *   pocet (box 616: dieťa .content-wrap s .amount-wrap) | velkost (box 616: dieťa .content-wrap s .parameter-sizes)
   */
  function krok(meno) {
    const f = form();
    if (!f) return null;
    const cw = f.querySelector(".content-wrap");
    const dieta = (sel) => (cw ? Array.prototype.find.call(cw.children, (e) => e.matches(sel) || e.querySelector(sel)) || null : null);
    switch (meno) {
      case "vzor": return dieta(".patterns-wrap");
      case "auto": return dieta(".wheel-Position");
      case "pocet": return dieta(".amount-wrap");
      case "velkost": return dieta(".parameter-sizes");
      case "farba":
      case "farba2":
      case "rozlozenie": {
        const p = parameter(meno);
        return p && cw ? cw.querySelector(":scope > .parameter-wrap.parameter-" + p.id) : null;
      }
      case "kufor": return f.querySelector(".upsale-buttons.trunk");
      case "boxy": return f.querySelector(".upsale-buttons.boxs");
      case "boxyVyber": return f.querySelector(".upsale-buttons.boxs .box-config");
      case "kosik": return f.querySelector(".add-to-cart button.add-to-cart-button");
      case "cena": return f.querySelector(".p-final-price-wrapper") || document.querySelector(".p-info-wrapper .p-final-price-wrapper");
      default: return null;
    }
  }

  /** Meno živého kroku pre element (opak krok()); najprv kroky produktu, potom ostatné známe mená. */
  function menoKroku(el) {
    if (!el) return null;
    const vlastne = produkt && produkt.kroky ? produkt.kroky : [];
    const mena = vlastne.concat(MENA_KROKOV.filter((m) => vlastne.indexOf(m) < 0));
    for (let i = 0; i < mena.length; i++) if (krok(mena[i]) === el) return mena[i];
    return el.closest && el.closest(".box-config") ? "boxy" : null;
  }

  /** Texty typu produktu pre časť (kroky, cena, rozlozenie, kuforBoxy …): typy/jedno.js zlúčené s typy/<typ>.js; nič -> {}. */
  function texty(cast) {
    const t = produkt && produkt.texty && produkt.texty[cast];
    return t && typeof t === "object" ? t : {};
  }

  /** Obrázok podľa vzoru produktu: typ.obrazky[kluc][vzor], inak Diamond; kľúč nie je -> null (žiadne 404). */
  function obrazokVzoru(kluc) {
    const o = produkt && produkt.obrazky && produkt.obrazky[kluc];
    const subor = o ? o[(produkt && produkt.vzor) || "diamond"] || o.diamond : null;
    return subor ? OBRAZKY_1V + subor : null;
  }

  /** Cena podľa Shoptetu (len číta): variant (necessaryVariantData podľa priceId) + zvolené príplatky. */
  function cena() {
    const f = form();
    const pi = f && f.querySelector("input[name=priceId]");
    let zaklad = null;
    const nvd = window.shoptet && window.shoptet.variantsSplit && window.shoptet.variantsSplit.necessaryVariantData;
    if (nvd && pi) Object.keys(nvd).forEach((k) => { if (String(nvd[k].id) === String(pi.value)) zaklad = Number(nvd[k].priceUnformatted); });
    if (!(zaklad > 0)) {
      const holder = document.querySelector(".price-final-holder");
      const d = holder && Number(holder.getAttribute("data-price"));
      if (d > 0) zaklad = d;
    }
    let priplatky = 0;
    if (f) f.querySelectorAll("select.surcharge-parameter").forEach((s) => {
      if (!s.value || s.value === "0") return;
      const o = s.options[s.selectedIndex];
      if (o) priplatky += cenaMoznosti(o);
    });
    const spolu = (zaklad || 0) + priplatky;
    // Odporúčaná cena len keď produkt má v admine bežnú cenu (Shoptet vtedy vykreslí .price-standard; 613, 625, 616,
    // 637 ju nemajú -> 0, nič nevymýšľať — D2). Vzorec ako productPage.js calculateStandartPrice: × 1,6 nahor na desiatky.
    const ziva = krok("cena");
    const maBeznuCenu = !!(ziva && ziva.querySelector(".price-standard"));
    const odporucana = maBeznuCenu ? Math.ceil((spolu * 1.6) / 10) * 10 : 0;
    return { zaklad, priplatky, spolu, odporucana, maBeznuCenu, zlava: odporucana > 0 ? Math.round(((odporucana - spolu) / odporucana) * 100) : 0 };
  }

  /** „Pridať do košíka“: klik na živé tlačidlo formulára — validáciu (červený rám, posun) a odoslanie robí živý kód. */
  function doKosika() {
    const b = krok("kosik");
    if (b) b.click();
    return !!b;
  }

  /** Čaká (každých 100 ms, max limit ms), kým podmienka() vráti niečo pravdivé, potom zavolá fn(výsledok). */
  function ked(podmienka, fn, { limit = 10000 } = {}) {
    const start = Date.now();
    (function skus() {
      let v = null;
      try { v = podmienka(); } catch (e) { v = null; }
      if (v) { fn(v); return; }
      if (Date.now() - start < limit) setTimeout(skus, 100);
    })();
  }

  return {
    verzia: 2,
    projectId: String(kontext.projectId || ""),
    productId: Number(kontext.productId || 0),
    produkt: produkt || null, // { id, typ, vzor, url, obsah, kroky, moduly, obal, texty, obrazky } (produkty.js)
    jazyk,
    trh: jazyk === "cs" ? "cz" : "sk",
    setupData,
    texts,
    form,
    parameter,
    moznosti,
    precitaj,
    zapis,
    krok,
    menoKroku,
    kroky: () => lcdGetSteps(), // živé kroky v poradí validácie (poradie DOM: .content-wrap, kufor, boxy)
    vyplneny: (el) => lcdStepFilled(el), // rovnaké pravidlo ako validácia košíka
    prvyNevyplneny: () => lcdFirstUnfilled(), // prvý chýbajúci krok (element) alebo null = dá sa pridať do košíka
    cena,
    formatCena: lcdCena, // tvar ceny ako Shoptet (SK „€219“, CZ „5 664 Kč“)
    obrazok: (meno) => OBRAZKY_1V + meno,
    obrazokVzoru,
    texty,
    doKosika,
    na,
    vysli,
    ked,
    chyby: [],
  };
}
