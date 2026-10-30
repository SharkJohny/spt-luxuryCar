// One page checkout: vzhľad na kroku 2 (kniha OPC § 6.2–6.9). Len kreslenie a čisté výpočty — sieť a stav rieši
// opc/krok2.js a opc/sync.js. Sekcia „Doprava a platba“ je klon označenia Shoptetu z kroku 1 (input -> label ->
// .shipping-billing-name, triedy .radio-wrapper / .payment-info / .payment-logo / .payment-shipping-price), aby platilo
// CSS Shoptetu aj naše lcdDobierkaZaloha (cart.js). Rádiá majú form="lcd-opc-nic" (prázdny pomocný formulár mimo
// #order-form): skupina podľa name funguje, ale do Step2Validate sa nepošlú (platbu berie Shoptet zo session).

import { suhrnInfo, volbaZoSuhrnu } from "./sync.js";
import { krok1Model } from "./krok1Model.js";
import { vycistiKopiu } from "./polozky.js";

export const CESTA_KROK1 = "/objednavka/krok-1/";
export const FORM_NIC = "lcd-opc-nic";

// ------------------------------------------------------------------ čisté výpočty

/** „€13“, „1 269 Kč“, „€5,50“ -> číslo; „ZADARMO“ / prázdne -> null. */
export function cisloZCeny(text) {
  const t = String(text == null ? "" : text).replace(/[^\d.,]/g, "");
  if (!/\d/.test(t)) return null;
  const n = Number(t.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Mena webu zo shoptet.config (SK „€13“, CZ „300 Kč“). */
export function menaWebu() {
  try {
    const c = (window.shoptet && window.shoptet.config) || {};
    if (c.currencySymbol) return { symbol: String(c.currencySymbol), vlavo: String(c.currencySymbolLeft) === "1", tisice: c.thousandSeparator == null ? " " : String(c.thousandSeparator) };
  } catch (e) {}
  return /\.cz$/i.test(location.hostname) ? { symbol: "Kč", vlavo: false, tisice: " " } : { symbol: "€", vlavo: true, tisice: " " };
}

/** Číslo -> text ceny v tvare Shoptetu. Celé čísla bez desatinných miest, inak 2 miesta s čiarkou (🟡 vzor SK/CZ). */
export function cenaText(n, mena) {
  const m = mena || menaWebu();
  const cele = Math.abs(n - Math.round(n)) < 0.005;
  const [i, d] = (cele ? String(Math.round(Math.abs(n))) : Math.abs(n).toFixed(2)).split(".");
  const cislo = (n < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, m.tisice) + (d ? "," + d : "");
  return m.vlavo ? m.symbol + cislo : cislo + " " + m.symbol;
}

const PORADIE = { transfer: 0, scheme: 1, applepay: 2, googlepay: 3, pis: 4, cashOnDelivery: 5 };
/** Poradie platieb (kniha § 6.2 bod 5, § 6.7): prevod navrchu, karta, Apple Pay, Google Pay, rýchla platba, dobierka. */
export function zoradPlatby(platby) {
  const r = function (p) {
    if (PORADIE[p.typ] !== undefined && p.typ !== "shoptetpay") return PORADIE[p.typ];
    if (p.typ === "shoptetpay" && PORADIE[p.podmetoda] !== undefined) return PORADIE[p.podmetoda];
    return 10;
  };
  return platby.map(function (p, i) { return { p: p, i: i }; })
    .sort(function (a, b) { return r(a.p) - r(b.p) || a.i - b.i; })
    .map(function (x) { return x.p; });
}

/** Druh košíka podľa názvov položiek: "koberce" (aj rohož a box) | "kamion" | "vzorky" (aj poukážka) | null. */
export function druhKosika(nazvy) {
  let koberce = false, kamion = false, ine = false;
  (nazvy || []).forEach(function (n) {
    const t = String(n || "");
    if (/vzorkovn[ií]k|poukáž|poukaz/i.test(t)) ine = true;
    else if (/\btruck\b|kami[oó]n/i.test(t)) kamion = true;
    else if (t.trim()) koberce = true;
  });
  return koberce ? "koberce" : kamion ? "kamion" : ine ? "vzorky" : null;
}

/**
 * Je v košíku tovar pripravovaný na mieru (riadok o nemožnosti odstúpiť, kniha § 8 otázka 3)? Rozsah podľa VOP
 * (Michal 29. 10.): bod 6.13 = „tovar zhotovený podľa špeciálnych požiadaviek“, bod 1.7 = „autokoberce zhotovované na
 * mieru podľa požiadaviek Kupujúceho“. Áno: autokoberce (aj sety 1V), rohože do kufra (na webe „autokoberce do kufra“),
 * koberce do kamiónov. Nie: samotný box do kufra (VOP ho ako tovar na mieru neuvádza), vzorkovník, poukážka a iný tovar
 * (nepravdivá informácia o odstúpení je pre spotrebiteľa zavádzajúca, revízia 29. 10.).
 */
export function naMieru(nazvy) {
  return (nazvy || []).some(function (n) {
    const t = String(n || "");
    if (/vzorkovn[ií]k|poukáž|poukaz/i.test(t)) return false;
    return /autokoberc|koberc|rohož|rohoz|kami[oó]n|\btruck\b/i.test(t);
  });
}

// Termín doručenia bez dátumov (Michal 29. 10., kniha § 8 otázka 2 = b): „Doručenie do 21–29 dní“ (aj box), kamióny
// 14–25 dní. Pri vzorkách a poukážke termín nepíšeme (nie sú na mieru, lehotu nepoznáme). -> { od, po } v dňoch | null
const LEHOTY = { koberce: [21, 29], kamion: [14, 25] };
export function terminDorucenia(druh) {
  const l = LEHOTY[druh];
  return l ? { od: l[0], po: l[1] } : null;
}

/**
 * Veta s odkazom na obchodné podmienky: „<text> – <odkaz>.“ (odkaz v novej karte, rozpísaná objednávka ostane).
 * Právne vety OPC (záloha pri dobierke, tovar na mieru, spôsoby platby v záchrane) = znenie a bod našich VOP.
 */
export function vetaSOdkazom(doc, tag, trieda, text, odkazText, href) {
  return el(doc, tag, { class: trieda }, [
    text + " – ",
    el(doc, "a", { href: href, target: "_blank", rel: "noopener", text: odkazText }),
    ".",
  ]);
}

// ------------------------------------------------------------------ sekcia Doprava a platba

function el(doc, tag, attrs, deti) {
  const e = doc.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === "text") e.textContent = attrs[k];
    else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
  });
  (deti || []).forEach(function (d) { if (d) e.appendChild(typeof d === "string" ? doc.createTextNode(d) : d); });
  return e;
}

/** Klon .radio-wrapper zo Shoptetu s rádiom pre náš pomocný formulár. */
function klon(doc, polozka) {
  const t = doc.createElement("div");
  t.innerHTML = polozka.html;
  const w = t.firstElementChild;
  if (!w) return null;
  const i = w.querySelector('input[type="radio"]');
  if (!i) return null;
  i.removeAttribute("checked");
  i.checked = false;
  i.setAttribute("form", FORM_NIC);
  i.setAttribute("data-lcd-opc", polozka.id);
  w.classList.remove("active");
  w.classList.add("lcd-opc-volba");
  return w;
}

/** Riadok, ktorý vedie na klasický krok 1 (rýchla platba s výberom banky, výdajné miesto): bez rádia. */
function riadokOdkaz(doc, polozka, T, texty) {
  const info = el(doc, "span", { class: "payment-info" }, [
    el(doc, "b", { class: "shipping-billing-name", text: polozka.nazov }),
    el(doc, "span", { class: "sublabel sublabel-description lcd-opc-odkaz__nie", text: texty.popis }),
    el(doc, "span", { class: "sublabel sublabel-description lcd-opc-odkaz__ano", text: texty.zvolene }),
  ]);
  const logo = polozka.logo ? el(doc, "span", { class: "payment-logo" }, [el(doc, "img", { src: polozka.logo, alt: "", loading: "lazy" })]) : null;
  const a = el(doc, "a", { class: "lcd-opc-odkaz__akcia", href: CESTA_KROK1, "data-lcd-opc-krok1": "" }, [
    el(doc, "span", { class: "lcd-opc-odkaz__nie", text: texty.akcia }),
    el(doc, "span", { class: "lcd-opc-odkaz__ano", text: texty.zmenit }),
  ]);
  return el(doc, "div", { class: "radio-wrapper lcd-opc-volba lcd-opc-odkaz", "data-submethod": polozka.podmetoda || null, "data-lcd-opc-id": polozka.id }, [
    el(doc, "div", { class: "lcd-opc-odkaz__riadok" }, [info, logo, a]),
  ]);
}

/**
 * Rýchla platba cez banku priamo v OPC (Michal 30. 10. 2026): pod rádiom riadok so zvolenou bankou (logo, názov, „Zmeniť
 * banku“) a podmienky Shoptet Pay prevzaté z kroku 1 (Salt Edge, krok1Model pisPodmienky). Mimo štítku rádia: ťuk na
 * „Zmeniť banku“ neprepína platbu. Viditeľný len pri zvolenej platbe (CSS .radio-wrapper.active). Okno: opc/banka.js.
 */
function riadokBanky(doc, banka, podmienky, T) {
  const pod = el(doc, "p", { class: "lcd-opc-banka__podmienky" });
  podmienky.forEach(function (c) {
    pod.appendChild(c.href ? el(doc, "a", { href: c.href, target: "_blank", rel: "noopener", text: c.text }) : doc.createTextNode(c.text));
  });
  return el(doc, "div", { class: "lcd-opc-banka", "data-lcd-opc-banka": "" }, [
    el(doc, "div", { class: "lcd-opc-banka__riadok" }, [
      el(doc, "span", { class: "lcd-opc-banka__vybrana" }, [
        el(doc, "img", { class: "lcd-opc-banka__logo", src: banka.logo || null, alt: "", loading: "lazy", decoding: "async", hidden: !banka.logo }),
        el(doc, "span", { class: "lcd-opc-banka__meno", text: banka.name }),
      ]),
      el(doc, "button", { type: "button", class: "lcd-opc-banka__zmenit", "data-lcd-opc-zmenit-banku": "", text: T.zmenitBanku }),
    ]),
    pod,
  ]);
}

/** Zvolená banka v riadku pod rýchlou platbou (po „Potvrdiť výber“ v okne). */
export function nastavBanku(sek, banka) {
  const r = sek && sek.querySelector(".lcd-opc-banka");
  if (!r || !banka) return;
  const meno = r.querySelector(".lcd-opc-banka__meno");
  if (meno) meno.textContent = banka.name;
  const logo = r.querySelector(".lcd-opc-banka__logo");
  if (logo) {
    if (banka.logo) { logo.setAttribute("src", banka.logo); logo.hidden = false; }
    else { logo.removeAttribute("src"); logo.hidden = true; }
  }
}

/** Termín „Doručenie do 21–29 dní“: lehota „21–29 dní“ sa nezalomí (na úzkom telefóne by ostalo „21–“ na konci riadku). */
function terminEl(doc, text) {
  const m = /^(.*?)(\d.*)$/.exec(text);
  if (!m) return el(doc, "span", { class: "lcd-opc-termin", text: text });
  return el(doc, "span", { class: "lcd-opc-termin" }, [m[1], el(doc, "span", { class: "lcd-opc-termin__lehota", text: m[2] })]);
}

/** Dlaždica = platba zadarmo, ktorá sa volí rádiom (nie dobierka s príplatkom, nie riadok-odkaz na výber banky). */
function jeDlazdica(p) {
  return p.typ !== "cashOnDelivery" && p.podmetoda !== "pis" && !p.cena;
}

/**
 * Dlaždice v mriežke: PC = toľko stĺpcov, koľko je dlaždíc (najviac 4, CSS premenná --lcd-opc-dl), telefón 2 stĺpce —
 * nepárna posledná dlaždica ide na celú šírku (inak by vedľa nej ostala diera).
 */
function rozlozDlazdice(platbyEl, dlazdice) {
  const n = dlazdice.length;
  platbyEl.setAttribute("data-lcd-opc-dlazdice", String(n));
  platbyEl.style.setProperty("--lcd-opc-dl", String(Math.min(4, Math.max(1, n))));
  if (n % 2) dlazdice[n - 1].classList.add("lcd-opc-dlazdica--posledna");
}

/**
 * Sekcia „Doprava a platba“ (vkladá sa do #order-form medzi adresu a poznámku).
 * o: { volby: { doprava, platba }, applePay: bool, termin: { od, po } | null,
 *      banka: { banka: { code, name, logo }, podmienky } | null — rýchla platba cez banku ako rádio s výberom banky v OPC;
 *      bez zoznamu bánk alebo podmienok Shoptet Pay záloha: riadok s odkazom na klasický krok 1 }
 */
export function vykresliSekciu(doc, model, T, o) {
  const volby = o.volby || {};
  const dopravaEl = el(doc, "div", { class: "shipping-billing-table lcd-opc-volby", id: "lcd-opc-doprava", role: "radiogroup", "aria-labelledby": "lcd-opc-h-doprava" });
  model.doprava.forEach(function (d) {
    if (d.vydajneMiesto) {
      // v1: doprava s výberom výdajného miesta -> klasický krok 1 (kniha § 6.6)
      dopravaEl.appendChild(riadokOdkaz(doc, d, T, { popis: "", zvolene: "", akcia: T.vybratMiesto, zmenit: T.vybratMiesto }));
      return;
    }
    const w = klon(doc, d);
    if (!w) return;
    if (o.termin) {
      const info = w.querySelector(".payment-info");
      if (info) info.appendChild(terminEl(doc, T.termin(o.termin.od, o.termin.po)));
    }
    dopravaEl.appendChild(w);
  });
  const zd = model.doprava.find(function (d) { return d.id === String(volby.doprava); });
  const relacie = zd ? zd.relacie : [];
  const platbyEl = el(doc, "div", { class: "shipping-billing-table lcd-opc-volby", id: "lcd-opc-platby", role: "radiogroup", "aria-labelledby": "lcd-opc-h-platba" });
  const dlazdice = [];
  zoradPlatby(model.platby).forEach(function (p) {
    if (p.podmetoda === "applepay" && !o.applePay) return; // len kde ju prehliadač vie (ApplePaySession.canMakePayments)
    const sBankou = p.podmetoda === "pis" && o.banka && o.banka.banka && o.banka.podmienky && o.banka.podmienky.length;
    if (p.podmetoda === "pis" && !sBankou) {
      // záloha (zoznam bánk Shoptet Pay alebo jeho podmienky chýbajú): výber banky na klasickom kroku 1 (kniha § 8 otázka 6a)
      platbyEl.appendChild(riadokOdkaz(doc, p, T, { popis: T.bankaPopis, zvolene: T.bankaZvolena, akcia: T.vybratBanku, zmenit: T.zmenitBanku }));
      return;
    }
    const w = klon(doc, p);
    if (!w) return;
    // rýchla platba cez banku v OPC (Michal 30. 10. 2026): rádio ako ostatné + riadok so zvolenou bankou (opc/banka.js)
    if (sBankou) w.appendChild(riadokBanky(doc, o.banka.banka, o.banka.podmienky, T));
    const i = w.querySelector("input");
    const l = w.querySelector("label");
    if (relacie.length && relacie.indexOf(p.id) === -1) {
      i.disabled = true;
      if (l) l.classList.add("inactive");
    }
    if (p.typ === "cashOnDelivery" && l) {
      // poučenie o zálohe podľa VOP 4.13 (kniha § 8 otázka 3) — sivý riadok len pri zvolenej dobierke (CSS :checked)
      l.appendChild(vetaSOdkazom(doc, "small", "lcd-opc-zaloha-info", T.zalohaInfo, T.zalohaOdkaz, T.vop));
    }
    // dizajn A: platby zadarmo (prevod, karta, Apple Pay, Google Pay) ako dlaždice, platené (dobierka) ostávajú riadkom
    if (jeDlazdica(p)) { w.classList.add("lcd-opc-dlazdica"); dlazdice.push(w); }
    platbyEl.appendChild(w);
  });
  rozlozDlazdice(platbyEl, dlazdice);
  const hlaska = el(doc, "p", { class: "lcd-opc-hlaska", role: "status", "aria-live": "polite", hidden: true });
  const sek = el(doc, "div", { id: "lcd-opc", class: "lcd-opc", "data-lcd-opc": "" }, [
    el(doc, "div", { class: "box box-sm box-bg-default co-box co-delivery-method lcd-opc-box lcd-opc-karta" }, [
      el(doc, "h2", { id: "lcd-opc-h-doprava", "data-lcd-opc-cislo": "3", text: T.doprava }), dopravaEl,
    ]),
    el(doc, "div", { class: "box box-sm box-bg-default co-box co-payment-method lcd-opc-box lcd-opc-karta" }, [
      el(doc, "h2", { id: "lcd-opc-h-platba", "data-lcd-opc-cislo": "4", text: T.platba }), platbyEl, hlaska,
    ]),
  ]);
  nastavVolby(sek, volby);
  return sek;
}

/** Zaškrtne rádiá podľa volieb a označí aktívne riadky (.radio-wrapper.active ako na kroku 1). */
export function nastavVolby(sek, volby) {
  if (!sek) return;
  sek.querySelectorAll('input[type="radio"][data-lcd-opc]').forEach(function (i) {
    const zv = i.name === "shippingId" ? String(volby.doprava) : String(volby.platba);
    i.checked = i.value === zv;
    const w = i.closest(".radio-wrapper");
    if (w) w.classList.toggle("active", i.checked);
  });
  sek.querySelectorAll(".lcd-opc-odkaz[data-lcd-opc-id]").forEach(function (w) {
    const id = w.getAttribute("data-lcd-opc-id");
    w.classList.toggle("active", id === String(volby.platba) || id === String(volby.doprava));
  });
}

/** Hláška pod platbami (chyba zmeny) + odkaz na krok 1; info = sivá („Prepočítavam…“ počas zmeny); prázdne = skryť. */
export function hlaska(sek, text, odkazText, info) {
  const p = sek && sek.querySelector(".lcd-opc-hlaska");
  if (!p) return;
  p.textContent = "";
  p.classList.toggle("lcd-opc-hlaska--info", !!info);
  if (!text) { p.hidden = true; return; }
  p.appendChild(p.ownerDocument.createTextNode(text));
  if (odkazText) {
    const a = p.ownerDocument.createElement("a");
    a.href = CESTA_KROK1;
    a.textContent = odkazText;
    p.appendChild(a);
    p.appendChild(p.ownerDocument.createTextNode("."));
  }
  p.hidden = false;
}

// ------------------------------------------------------------------ súhrn Shoptetu (#summary-box)

/** Riadok súhrnu dopravy / platby: „<span data-testid=recapItemPrice>€3</span> Dobierkou“. */
function nastavRiadok(strong, cena, nazov) {
  if (!strong) return;
  const doc = strong.ownerDocument;
  strong.textContent = "";
  strong.appendChild(el(doc, "span", { "data-testid": "recapItemPrice", text: cena }));
  strong.appendChild(doc.createTextNode(" " + nazov));
}

/**
 * Lokálny prepočet súhrnu hneď po zmene (kniha § 6.5 bod 3.2), kým nepríde súhrn zo servera: riadky dopravy a platby
 * a „Celkom k úhrade“ = doterajšia suma − staré ceny + nové (zľavy a kupóny ostanú započítané). -> nová suma | null
 */
export function prepocitajSuhrn(box, model, stare, nove, mena) {
  const info = suhrnInfo(box);
  if (!info) return null;
  const najdi = function (zoznam, id) { return zoznam.find(function (x) { return x.id === String(id); }); };
  const dS = najdi(model.doprava, stare.doprava), dN = najdi(model.doprava, nove.doprava);
  const pS = najdi(model.platby, stare.platba), pN = najdi(model.platby, nove.platba);
  const celkom = cisloZCeny(info.celkom);
  if (!dN || !pN || celkom === null) return null;
  const c = function (x) { return x && x.cena !== null && x.cena !== undefined ? x.cena : 0; };
  const nova = celkom - c(dS) - c(pS) + c(dN) + c(pN);
  nastavRiadok(box.querySelector('[data-testid="recapDeliveryMethod"]'), cenaText(c(dN), mena), dN.nazov);
  nastavRiadok(box.querySelector('[data-testid="recapPaymentMethod"]'), cenaText(c(pN), mena), pN.nazov);
  const f = box.querySelector('[data-testid="recapFullPrice"]');
  if (f) f.textContent = cenaText(nova, mena);
  return nova;
}

// ------------------------------------------------------------------ súhrn zo servera z GET kroku 1 (živý dôkaz 29. 10. 2026)
// #summary-box kroku 1 je #summary-box kroku 2 bez bloku „Spôsob dopravy / Platba“ (rovnaké položky aj „Celkom za tovar“,
// overené na SK, CZ, sete aj kamióne). Po Step1Validate „Celkom k úhrade“ kroku 1 obsahuje dopravu aj platbu zo session
// (krok1-dobierka: €13 = súhrn kroku 2; pred Step1Validate je to len tovar). Súhrn kroku 2 sa preto dá zložiť len z dát
// servera: časť kroku 1 + riadky dopravy a platby (názov a cena z kroku 1 pre voľbu v session) v označení zo šablóny.

/** Súhrn kroku 1 (#summary-box): { celkom, tovar, polozky } | null (nerozoznateľný). */
export function suhrnKroku1(box) {
  try {
    if (!box || !box.querySelector) return null;
    const c = box.querySelector('[data-testid="recapFullPrice"]');
    const t = box.querySelector('[data-testid="recapItemTotalPrice"]');
    const cist = function (e) { return e ? String(e.textContent || "").replace(/[\s\u00a0]+/g, " ").trim() : ""; };
    if (!c || !cist(c) || !box.querySelector(".order-summary-item.price")) return null;
    return { celkom: cist(c), tovar: cist(t), polozky: box.querySelectorAll(".cart-items .cart-item").length };
  } catch (e) {
    return null;
  }
}

/**
 * Súhrn kroku 2 zložený z dát servera: deti #summary-box kroku 1 (box1) + blok dopravy a platby zo šablóny (aktuálny
 * #summary-box stránky, ktorý dal server) s názvom a cenou voľby z modelu kroku 1. -> innerHTML | null
 */
export function zlozSuhrn(box1, sablona, model, volby, mena) {
  try {
    if (!box1 || !sablona || !model || !volby) return null;
    const d = model.doprava.find(function (x) { return x.id === String(volby.doprava); });
    const p = model.platby.find(function (x) { return x.id === String(volby.platba); });
    const vzor = sablona.querySelector('[data-testid="recapDeliveryMethod"]');
    const blok = vzor && vzor.closest(".cart-items");
    if (!d || !p || !blok || !blok.querySelector('[data-testid="recapPaymentMethod"]')) return null;
    const doc = box1.ownerDocument;
    const koren = doc.createElement("div");
    koren.innerHTML = box1.innerHTML;
    const cena = koren.querySelector(".order-summary-item.price");
    if (!cena || !koren.querySelector('[data-testid="recapFullPrice"]')) return null;
    const novy = doc.importNode(blok, true);
    const c = function (x) { return x.cena !== null && x.cena !== undefined ? x.cena : 0; };
    nastavRiadok(novy.querySelector('[data-testid="recapDeliveryMethod"]'), cenaText(c(d), mena), d.nazov);
    nastavRiadok(novy.querySelector('[data-testid="recapPaymentMethod"]'), cenaText(c(p), mena), p.nazov);
    cena.parentNode.insertBefore(novy, cena);
    // suma ako na kroku 2 (krok 1 pri nej nesie data-price-total-*, ktoré môže čítať JS kroku 1)
    koren.querySelectorAll("[data-price-total-wv], [data-price-total-vat]").forEach(function (e) {
      e.removeAttribute("data-price-total-wv");
      e.removeAttribute("data-price-total-vat");
    });
    return koren.innerHTML;
  } catch (e) {
    return null;
  }
}

/**
 * Potvrdenie voľby z HTML kroku 1 (GET po Step1Validate): čo má session = zaškrtnutá doprava a platba, súhrn = zlozSuhrn.
 * Fail-closed: zmenené HTML, súhrn nesedí s voľbou, alebo „Celkom k úhrade“ = len tovar pri platenej doprave/platbe
 * (session bez voľby) -> { ok: false, typ } a volajúci použije zálohu (GET krok 2).
 * -> { ok: true, volby, html, info, model, zdroj: "krok1" } | { ok: false, typ, model? }
 */
export function potvrdenieZKroku1(html, sablona, mena) {
  try {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    const m = krok1Model(null, { doc: doc });
    if (!m.ok) return { ok: false, typ: "krok1-" + m.dovod };
    const volby = { doprava: m.zvolenaDoprava, platba: m.zvolenaPlatba };
    const box1 = doc.getElementById("summary-box");
    const s1 = suhrnKroku1(box1);
    if (!s1) return { ok: false, typ: "krok1-suhrn", model: m };
    const d = m.doprava.find(function (x) { return x.id === volby.doprava; });
    const p = m.platby.find(function (x) { return x.id === volby.platba; });
    const priplatky = ((d && d.cena) || 0) + ((p && p.cena) || 0);
    const celkom = cisloZCeny(s1.celkom), tovar = cisloZCeny(s1.tovar);
    if (priplatky > 0 && celkom !== null && tovar !== null && Math.abs(celkom - tovar) < 0.005) return { ok: false, typ: "krok1-bez-volby", model: m };
    const h = zlozSuhrn(box1, sablona, m, volby, mena);
    const info = h ? suhrnInfo(h) : null;
    const zo = volbaZoSuhrnu(m, info);
    if (!info || !zo || zo.doprava !== volby.doprava || zo.platba !== volby.platba) return { ok: false, typ: "krok1-zlozenie", model: m };
    return { ok: true, volby: volby, html: h, info: info, model: m, zdroj: "krok1" };
  } catch (e) {
    return { ok: false, typ: "krok1-vynimka" };
  }
}

// ------------------------------------------------------------------ zbalený súhrn (telefón), lišta, kroky

/** Zbalený súhrn navrchu (telefón, vzor vasky.cz): „Vaša objednávka · 1 položka · Celkom €10“ ˅ -> položky s rozpisom. */
export function vytvorZbalenySuhrn(doc, T) {
  const sum = el(doc, "summary", { class: "lcd-opc-zbalene__hlava" }, [
    el(doc, "span", { class: "lcd-opc-zbalene__nazov" }, [
      el(doc, "b", { text: T.vasaObjednavka }),
      el(doc, "small", { class: "lcd-opc-zbalene__pocet" }),
    ]),
    el(doc, "span", { class: "lcd-opc-zbalene__suma" }, [el(doc, "small", { text: T.celkom }), el(doc, "b", { class: "lcd-opc-zbalene__celkom" })]),
  ]);
  const obsah = el(doc, "div", { class: "lcd-opc-zbalene__obsah" }, [
    el(doc, "div", { class: "lcd-opc-zbalene__polozky" }),
    el(doc, "a", { class: "lcd-opc-zbalene__upravit", href: "/kosik/", text: T.upravitKosik }),
  ]);
  return el(doc, "details", { class: "lcd-opc-zbalene", id: "lcd-opc-zbalene" }, [sum, obsah]);
}

/** Obnoví zbalený súhrn z #summary-box (počet, suma, položky s rozpisom ako v súhrne). */
export function obnovZbalenySuhrn(zb, box, T) {
  if (!zb || !box) return;
  const info = suhrnInfo(box);
  const polozky = box.querySelectorAll(".cart-items .cart-item");
  const pocet = zb.querySelector(".lcd-opc-zbalene__pocet");
  if (pocet) pocet.textContent = T.polozky(polozky.length);
  const c = zb.querySelector(".lcd-opc-zbalene__celkom");
  if (c) c.textContent = info ? info.celkom : "";
  const kam = zb.querySelector(".lcd-opc-zbalene__polozky");
  if (kam) {
    kam.textContent = "";
    polozky.forEach(function (p) {
      // bez fotky a zobáčika, rozpis z karty detailu späť pod názov (opc/polozky.js)
      const k = vycistiKopiu(p.cloneNode(true));
      k.removeAttribute("data-testid");
      k.querySelectorAll("[data-testid]").forEach(function (x) { x.removeAttribute("data-testid"); });
      k.querySelectorAll("a[href]").forEach(function (a) { a.setAttribute("tabindex", "-1"); });
      // kópia nesmie vyzerať ako riadok košíka pre cart.js (changeDescription formátuje span.main-link-* na celej stránke)
      k.querySelectorAll(".main-link-surcharges, .main-link-variant").forEach(function (x) {
        x.classList.replace("main-link-surcharges", "lcd-opc-kopia-priplatky") || x.classList.replace("main-link-variant", "lcd-opc-kopia-variant");
      });
      kam.appendChild(k);
    });
  }
}

/** Text tlačidla Shoptetu („Objednať s povinnosťou platby“) bez nášho „Odosielam…“; bez tlačidla záložný text. */
export function textTlacidla(tlacidlo, T) {
  if (!tlacidlo) return T.objednat;
  const k = tlacidlo.cloneNode(true);
  k.querySelectorAll(".lcd-opc-odosielam-text").forEach(function (x) { x.remove(); });
  const t = String(k.textContent || "").replace(/\s+/g, " ").trim();
  return t || T.objednat;
}

/**
 * Lišta dole „Celkom 274 € | Objednať s povinnosťou platby“ (Michal 29. 10.: tlačidlo Objednať je stále viditeľné). Text
 * je text tlačidla Shoptetu (zákonná formulácia, SK § 17 ods. 4, CZ § 1826a OZ) a suma je pri ňom. Klik = klik na
 * natívne tlačidlo (opc/krok2.js), lišta sama nič neposiela (type=button, mimo formulára).
 */
export function vytvorListu(doc, T, text) {
  const t = el(doc, "span", { class: "lcd-opc-lista__text" });
  nastavTextListy(t, text || T.objednat);
  return el(doc, "div", { class: "lcd-lista lcd-opc-lista", role: "region", "aria-label": T.listaAria }, [
    el(doc, "span", { class: "lcd-lista__suma" }, [el(doc, "small", { text: T.celkom }), el(doc, "b", { class: "lcd-opc-lista__celkom" })]),
    el(doc, "button", { type: "button", class: "lcd-lista__btn lcd-opc-lista__btn" }, [t]),
  ]);
}

/**
 * Text tlačidla v lište na 2 riadky ako natívne tlačidlo (dizajn A): „OBJEDNAŤ“ + „s povinnosťou platby“. Text ostáva
 * celý a v jednom kuse (textContent = text tlačidla Shoptetu), na prvej medzere sa delí len vzhľad.
 */
export function nastavTextListy(span, text) {
  if (!span) return;
  const doc = span.ownerDocument;
  const t = String(text || "");
  const i = t.indexOf(" ");
  span.textContent = "";
  span.appendChild(el(doc, "b", { class: "lcd-opc-lista__hlavny", text: i > 0 ? t.slice(0, i) : t }));
  if (i > 0) {
    span.appendChild(doc.createTextNode(" "));
    span.appendChild(el(doc, "small", { class: "lcd-opc-lista__suffix", text: t.slice(i + 1) }));
  }
}

/** Lišta krokov Shoptetu -> 2 kroky („Nákupný košík · Objednávka“): krok Doprava a platba sa skryje. */
export function upravKroky(ol, T) {
  if (!ol) return;
  ol.classList.add("lcd-opc-kroky");
  const k2 = ol.querySelector("li.step-2");
  if (k2) k2.setAttribute("hidden", "");
  const k3 = ol.querySelector("li.step-3 strong span, li.step-3 a span");
  if (k3) k3.textContent = T.kroky[1];
}

// ------------------------------------------------------------------ dizajn A „ako konfigurátor“ (Michal 29. 10. 2026)
// Karty 1–4 s číslom v krúžku (Kontakt, Adresa, Doprava, Platba), fajka pri vyplnenej karte, popis nad poľom, adresa
// v 2 riadkoch (Ulica + Číslo, PSČ + Mesto). Len vzhľad a usporiadanie: polia, súhlasy a tlačidlo ostávajú Shoptetu, presúvajú
// sa len celé skupiny polí v rámci karty Adresa (žiadne kópie). Kontrolu polí pred odoslaním robí opc/kontrola.js.

/** Polia, po ktorých vyplnení dostane karta fajku (len vzhľad, nie kontrola). */
export const POLIA_KARIET = { kontakt: ["billFullName", "email", "phone"], adresa: ["billStreet", "billHouseNumber", "billCity", "billZip"] };

function oznacKartu(karta, cislo, nadpis) {
  if (!karta) return;
  karta.classList.add("lcd-opc-karta");
  const h2 = karta.querySelector("h2");
  if (!h2) return;
  h2.setAttribute("data-lcd-opc-cislo", String(cislo));
  if (nadpis) h2.textContent = nadpis;
}

/** Skupina poľa (.form-group) -> data-lcd-opc-pole = id poľa: rozloženie mriežky v CSS bez :has. */
function oznacPolia(koren) {
  koren.querySelectorAll(".form-group").forEach(function (g) {
    const i = g.querySelector("input.form-control, select.form-control, textarea.form-control, input[type=checkbox]");
    if (i && i.id && !g.hasAttribute("data-lcd-opc-pole")) g.setAttribute("data-lcd-opc-pole", i.id);
  });
}

/** Skupina poľa s id (alebo null). */
function skupina(doc, id) {
  const e = doc.getElementById(id);
  return e ? e.closest(".form-group") : null;
}

/** Skupinu `co` dá pred skupinu `pred`, len keď sú v tom istom rodičovi (inak nič). */
function presunPred(co, pred) {
  if (co && pred && co !== pred && co.parentNode && co.parentNode === pred.parentNode) pred.parentNode.insertBefore(co, pred);
}

/**
 * Karty 1 (Kontakt) a 2 (Adresa) z natívnych blokov Shoptetu: číslo a nadpis, prihlásenie ako odkaz v hlavičke karty,
 * PSČ pred Mestom, pod adresou riadok „Štát · Zmeniť štát | Objednávam na firmu | (údaje firmy) | Doručiť na inú adresu“.
 * Opakované volanie nič nezmení.
 */
export function pripravKarty(form, T) {
  const doc = form.ownerDocument;
  const kontakt = form.querySelector("fieldset.co-contact-information");
  const adresa = form.querySelector(".co-billing-address");
  oznacKartu(kontakt, 1, T.kontakt);
  oznacKartu(adresa, 2, T.adresa);
  const dorucenie = form.querySelector("fieldset.co-shipping-address");
  if (dorucenie) dorucenie.classList.add("lcd-opc-karta", "lcd-opc-karta--bez-cisla");
  const login = kontakt && kontakt.querySelector("a.login-button");
  if (login) {
    const g = login.closest(".form-group");
    if (g) g.classList.add("lcd-opc-ucet");
    if (T.prihlasit) login.textContent = T.prihlasit;
  }
  oznacPolia(form);
  presunPred(skupina(doc, "billZip"), skupina(doc, "billCity"));
  presunPred(skupina(doc, "deliveryZip"), skupina(doc, "deliveryCity"));
  const fs = adresa && adresa.querySelector("fieldset");
  const stat = doc.getElementById("billCountryIdInput");
  const gStat = stat && stat.closest(".form-group");
  if (fs && gStat && gStat.parentNode === fs && !fs.querySelector(".lcd-opc-adresa-volby")) {
    gStat.classList.add("lcd-opc-stat");
    const riadok = doc.createElement("div");
    riadok.className = "lcd-opc-adresa-volby";
    fs.appendChild(riadok);
    // údaje firmy (Shoptet ich ukáže po „Objednávam na firmu“) hneď pod touto voľbou, „Doručiť na inú adresu“ až za nimi
    // (revízia: na telefóne boli polia firmy až pod druhou voľbou, oddelené od tej, ktorá ich otvorila)
    const firma = doc.getElementById("company-info");
    [gStat, skupina(doc, "company-shopping"), firma, skupina(doc, "another-shipping")].forEach(function (g) { if (g && adresa.contains(g)) riadok.appendChild(g); });
  }
  const statDor = dorucenie && dorucenie.querySelector(".form-group.populated");
  if (statDor) statDor.classList.add("lcd-opc-stat");
}

/** Fajka kariet podľa vyplnenosti (len vzhľad): Kontakt a Adresa = polia nie sú prázdne ani označené ako chybné; karta
 *  s chybou má červený krúžok (lcd-opc-karta--chyba). */
export function obnovKarty(form, sek) {
  const doc = form.ownerDocument;
  const plne = function (id) {
    const e = doc.getElementById(id);
    return !!e && String(e.value || "").trim() !== "" && !e.classList.contains("js-error-field") && !e.classList.contains("error-field");
  };
  // chyba (Shoptet js-error-field / error-field, naša kontrola lcd-opc-chyba-pole na skupine alebo na boxe sekcie) = červený
  // krúžok čísla karty (náčrt A, revízia); fajka len bez chyby
  const chyba = function (karta) { return karta.classList.contains("lcd-opc-chyba-pole") || !!karta.querySelector(".lcd-opc-chyba-pole, .js-error-field, .error-field"); };
  const nastav = function (karta, ok) {
    if (!karta) return;
    const zle = chyba(karta);
    karta.classList.toggle("lcd-opc-karta--chyba", zle);
    karta.classList.toggle("lcd-opc-karta--hotovo", !!ok && !zle);
  };
  nastav(form.querySelector("fieldset.co-contact-information.lcd-opc-karta"), POLIA_KARIET.kontakt.every(plne));
  nastav(form.querySelector(".co-billing-address.lcd-opc-karta"), POLIA_KARIET.adresa.every(plne));
  if (sek) {
    nastav(sek.querySelector(".co-delivery-method"), !!sek.querySelector('input[name="shippingId"][data-lcd-opc]:checked, #lcd-opc-doprava .lcd-opc-odkaz.active'));
    nastav(sek.querySelector(".co-payment-method"), !!sek.querySelector('input[name="billingId"][data-lcd-opc]:checked, #lcd-opc-platby .lcd-opc-odkaz.active'));
  }
}
