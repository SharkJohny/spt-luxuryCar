// One page checkout: rýchla platba cez banku (Shoptet Pay „pis“, SK billingId 112) — výber banky priamo na finálnej stránke.
// Michal 30. 10. 2026 (iPhone): „Rýchla platba bankou“ ho z OPC poslala na starý krok 1 s čiernym oknom Shoptet Pay; banka
// sa má vybrať tu a okno má vyzerať ako web.
//
// Čo o banke vie Shoptet (zistené offline nad fixtures, kniha OPC § 6.7):
//   - session: pole shoptetPayPisCode v Step1Validate (formulár kroku 1 ho nesie hneď za billingId; opc/sync.js teloStep1),
//   - prehliadač: localStorage pisBankSelected / pisCountrySelected / pisCurrencySelected (widget kroku 1 si pamätá výber),
//   - zoznam bánk: verejný GET /action/ShoptetPayPaymentData/getBankProviderData/ (to isté volá krok 1) ->
//     { SK: { code, name, providers: { <kód>: { code, name, logoUrl, isDefault } } }, CZ: … }, na CZ webe [].
// Predvolená krajina a banka sú podľa rovnakých pravidiel ako widget kroku 1, aby klasický krok 1 aj OPC ukázali tú istú
// banku a do session išlo to, čo by poslal formulár kroku 1 (pravidlá opísané a napísané nanovo — kód Shoptetu sa do repa
// nekopíruje, VOP čl. 11.3):
//   - uložená mena ≠ mena webu -> uložená krajina aj banka neplatia,
//   - krajina: uložená (ak má banky), inak EUR + sk = SK, HUF alebo EUR + hu = HU, inak CZ; tá nie je v zozname -> prvá,
//   - banka: uložená, bez uloženej tá s isDefault, inak prvá v krajine.
// Okno výberu je naše (dialóg nad stránkou, žiadny colorbox Shoptetu): krajina len keď ich je viac, banky ako voľby OPC
// (zelený rám + fajka), „Späť“ / „Potvrdiť výber“. Potvrdenie zapíše tie isté kľúče localStorage ako widget kroku 1.

import { fetchSLimitom, LIMIT_KROK1_MS } from "./sync.js";

export const CESTA_BANKY = "/action/ShoptetPayPaymentData/getBankProviderData/";
export const KLUC = { banka: "pisBankSelected", krajina: "pisCountrySelected", mena: "pisCurrencySelected" };

/** localStorage okna, alebo null (súkromný režim / zakázané úložisko hádže už pri prístupe). */
export function ulozisko(win) {
  try { return win.localStorage || null; } catch (e) { return null; }
}

/** Bezpečné čítanie z úložiska (súkromný režim, zakázané úložisko -> null). */
function citaj(ls, k) {
  try { return ls && typeof ls.getItem === "function" ? ls.getItem(k) : null; } catch (e) { return null; }
}

/**
 * Odpoveď getBankProviderData -> [{ code, name, banky: [{ code, name, logo, isDefault }] }] (len krajiny s bankami) | null
 * (žiadna banka, prázdne pole CZ webu, nezmysel). Poradie krajín a bánk ako v odpovedi (tak ich ukazuje aj Shoptet).
 */
export function zoznamBank(data) {
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const krajiny = [];
    Object.keys(data).forEach(function (k) {
      const c = data[k];
      if (!c || typeof c !== "object" || !c.providers || typeof c.providers !== "object") return;
      const banky = Object.keys(c.providers).map(function (p) { return c.providers[p]; })
        .filter(function (b) { return b && typeof b === "object" && b.code && b.name; })
        .map(function (b) { return { code: String(b.code), name: String(b.name), logo: b.logoUrl ? String(b.logoUrl) : "", isDefault: b.isDefault === true }; });
      if (banky.length) krajiny.push({ code: String(c.code || k), name: String(c.name || c.code || k), banky: banky });
    });
    return krajiny.length ? krajiny : null;
  } catch (e) {
    return null;
  }
}

/** Banka v krajine podľa pravidla widgetu kroku 1: uložená, bez uloženej isDefault, inak prvá. */
export function bankaVKrajine(krajina, ulozena) {
  if (!krajina || !krajina.banky.length) return null;
  const n = krajina.banky.find(function (b) { return b.code === ulozena || (!ulozena && b.isDefault); });
  return n || krajina.banky[0];
}

/**
 * Stav výberu: { krajiny, krajina (kód), banka { code, name, logo } } | null (žiadna banka).
 * o: { mena: "EUR", jazyk: "sk" } (menaAJazyk), ls = localStorage (môže chýbať alebo hádzať).
 */
export function stavBanky(data, ls, o) {
  const krajiny = zoznamBank(data);
  if (!krajiny) return null;
  const mena = String((o && o.mena) || ""), jazyk = String((o && o.jazyk) || "").slice(0, 2).toLowerCase();
  let ulozenaKrajina = citaj(ls, KLUC.krajina), ulozenaBanka = citaj(ls, KLUC.banka);
  const ulozenaMena = citaj(ls, KLUC.mena);
  if (ulozenaMena && mena && ulozenaMena !== mena) { ulozenaKrajina = null; ulozenaBanka = null; }
  const najdi = function (kod) { return krajiny.find(function (k) { return k.code === kod; }) || null; };
  let k = ulozenaKrajina ? najdi(ulozenaKrajina) : null;
  if (!k) {
    let pred = "CZ";
    if (mena === "HUF" || (mena === "EUR" && jazyk === "hu") || (!mena && jazyk === "hu")) pred = "HU";
    else if ((mena === "EUR" || !mena) && jazyk === "sk") pred = "SK";
    k = najdi(pred) || krajiny[0];
  }
  return { krajiny: krajiny, krajina: k.code, banka: bankaVKrajine(k, ulozenaBanka) };
}

/** Potvrdený výber -> localStorage ako widget kroku 1 (klasický krok 1 potom ukáže tú istú banku). */
export function ulozBanku(ls, o) {
  try {
    if (!ls || typeof ls.setItem !== "function") return;
    ls.setItem(KLUC.krajina, String(o.krajina));
    ls.setItem(KLUC.banka, String(o.banka));
    if (o.mena) ls.setItem(KLUC.mena, String(o.mena));
  } catch (e) {}
}

/** Mena a jazyk stránky z dataLayer Shoptetu ({ shoptet: { currency, language } } — košík aj krok 2), inak jazyk z <html lang>. */
export function menaAJazyk(win) {
  let mena = "", jazyk = "";
  try {
    (win.dataLayer || []).some(function (x) {
      if (x && x.shoptet && x.shoptet.currency) { mena = String(x.shoptet.currency); jazyk = String(x.shoptet.language || ""); return true; }
      return false;
    });
  } catch (e) {}
  if (!jazyk) { try { jazyk = String(win.document.documentElement.lang || ""); } catch (e) {} }
  return { mena: mena, jazyk: jazyk.slice(0, 2).toLowerCase() };
}

/** GET zoznamu bánk na pozadí (ako krok 1: XHR), limit 4 s. -> { ok: true, data } | { ok: false, typ } */
export function nacitajBanky(limit) {
  return fetchSLimitom(CESTA_BANKY, { headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json, text/javascript, */*; q=0.01" } }, limit || LIMIT_KROK1_MS)
    .then(function (r) {
      if (r.chyba) return { ok: false, typ: r.chyba };
      if (!r.ok) return { ok: false, typ: "kod", kod: r.status };
      return r.json().then(function (j) { return { ok: true, data: j }; }, function () { return { ok: false, typ: "json" }; });
    })
    .catch(function () { return { ok: false, typ: "siet" }; });
}

// ------------------------------------------------------------------ okno výberu banky

function el(doc, tag, attrs, deti) {
  const e = doc.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === "text") e.textContent = attrs[k];
    else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
  });
  (deti || []).forEach(function (d) { if (d) e.appendChild(typeof d === "string" ? doc.createTextNode(d) : d); });
  return e;
}

let poradie = 0;

/**
 * Otvorí okno výberu banky (pripojí sa na koniec <body>, mimo formulára objednávky). o:
 *   T (TEXTY webu), krajiny (zoznamBank), krajina (kód), banka (kód zvolenej), fokus (prvok, kam sa po zatvorení vráti fokus),
 *   naKoniec(vysledok) — { krajina, banka: { code, name, logo } } po „Potvrdiť výber“, null po „Späť“ / Esc / kliku vedľa.
 * -> { zavri() } (zavrie bez výsledku, naKoniec(null)).
 */
export function otvorOkno(doc, o) {
  const T = o.T;
  const id = "lcd-opc-banky-" + (++poradie);
  let krajina = o.krajiny.find(function (k) { return k.code === o.krajina; }) || o.krajiny[0];
  let zvolena = bankaVKrajine(krajina, o.banka);
  let hotovo = false;

  const nadpis = el(doc, "h2", { id: id + "-h", class: "lcd-opc-banky__nadpis", text: T.bankaNadpis });
  const zoznam = el(doc, "div", { class: "lcd-opc-banky__zoznam", role: "radiogroup", "aria-labelledby": id + "-h" });
  let vyberKrajiny = null;
  if (o.krajiny.length > 1) {
    const sel = el(doc, "select", { id: id + "-k", class: "lcd-opc-banky__krajina" });
    o.krajiny.forEach(function (k) {
      const op = el(doc, "option", { value: k.code, text: k.name + " · " + T.pocetBank(k.banky.length) });
      if (k.code === krajina.code) op.selected = true;
      sel.appendChild(op);
    });
    sel.addEventListener("change", function () {
      krajina = o.krajiny.find(function (k) { return k.code === sel.value; }) || krajina;
      zvolena = bankaVKrajine(krajina, zvolena && zvolena.code);
      kresli();
    });
    vyberKrajiny = el(doc, "div", { class: "lcd-opc-banky__krajina-pole" }, [
      el(doc, "label", { class: "lcd-opc-banky__krajina-stitok", for: id + "-k", text: T.bankaKrajina }), sel,
    ]);
  }
  const spat = el(doc, "button", { type: "button", class: "lcd-opc-banky__spat", text: T.spat });
  const potvrdit = el(doc, "button", { type: "button", class: "lcd-opc-banky__potvrdit", text: T.potvrditBanku });
  const okno = el(doc, "div", { class: "lcd-opc-banky__okno", role: "dialog", "aria-modal": "true", "aria-labelledby": id + "-h" }, [
    nadpis, vyberKrajiny, zoznam, el(doc, "div", { class: "lcd-opc-banky__akcie" }, [spat, potvrdit]),
  ]);
  const koren = el(doc, "div", { class: "lcd-opc-banky", "data-lcd-opc-banky": "" }, [okno]);

  function kresli() {
    zoznam.textContent = "";
    krajina.banky.forEach(function (b) {
      const r = el(doc, "input", { type: "radio", name: id, value: b.code, class: "lcd-opc-banky__radio" });
      r.checked = !!zvolena && b.code === zvolena.code;
      r.addEventListener("change", function () { if (r.checked) { zvolena = b; oznac(); } });
      const logo = el(doc, "span", { class: "lcd-opc-banky__logo" }, [b.logo ? el(doc, "img", { src: b.logo, alt: "", loading: "lazy", decoding: "async" }) : null]);
      zoznam.appendChild(el(doc, "label", { class: "lcd-opc-banky__banka", "data-kod": b.code }, [r, logo, el(doc, "span", { class: "lcd-opc-banky__meno", text: b.name })]));
    });
    oznac();
  }
  function oznac() {
    zoznam.querySelectorAll(".lcd-opc-banky__banka").forEach(function (l) {
      l.classList.toggle("lcd-opc-banky__banka--zvolena", !!zvolena && l.getAttribute("data-kod") === zvolena.code);
    });
  }
  function zavri(vysledok) {
    if (hotovo) return;
    hotovo = true;
    doc.removeEventListener("keydown", klavesy, true);
    if (koren.parentNode) koren.parentNode.removeChild(koren);
    doc.documentElement.classList.remove("lcd-opc-okno");
    try { if (o.fokus && typeof o.fokus.focus === "function") o.fokus.focus({ preventScroll: true }); } catch (e) {}
    try { if (o.naKoniec) o.naKoniec(vysledok); } catch (e) {}
  }
  function prvky() {
    return Array.prototype.filter.call(okno.querySelectorAll("select, input[type=radio], button"), function (e) {
      return !e.disabled && (e.type !== "radio" || e.checked || !zoznam.querySelector("input:checked"));
    });
  }
  function klavesy(e) {
    if (hotovo) return;
    if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); zavri(null); return; }
    // rám fokusu na banke len pri ovládaní klávesnicou (Safari ho inak ukáže aj po ťuknutí, okno otvára fokus na banke)
    koren.classList.add("lcd-opc-banky--klavesnica");
    if (e.key !== "Tab") return;
    // fokus ostáva v okne (aria-modal): z posledného na prvý a naopak
    const p = prvky();
    if (!p.length) return;
    const i = p.indexOf(doc.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); p[p.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === p.length - 1)) { e.preventDefault(); p[0].focus(); }
  }

  spat.addEventListener("click", function () { zavri(null); });
  potvrdit.addEventListener("click", function () {
    zavri(zvolena ? { krajina: krajina.code, banka: { code: zvolena.code, name: zvolena.name, logo: zvolena.logo } } : null);
  });
  // klik vedľa okna (na tmavý podklad) = Späť
  koren.addEventListener("click", function (e) { if (e.target === koren) zavri(null); });
  doc.addEventListener("keydown", klavesy, true);

  kresli();
  doc.documentElement.classList.add("lcd-opc-okno");
  doc.body.appendChild(koren);
  try {
    const f = zoznam.querySelector("input:checked") || potvrdit;
    f.focus({ preventScroll: true });
  } catch (e) {}
  return { zavri: function () { zavri(null); } };
}
