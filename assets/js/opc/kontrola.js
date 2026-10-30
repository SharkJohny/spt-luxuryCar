// One page checkout: kontrola polí pred odoslaním (Michal 29. 10. 2026: „keby od samého začiatku klikal Objednať, tak
// vždy mu to ukáže: toto vyplň“). Klik na „Objednať“ (aj v lište dole) -> PRVÉ chýbajúce alebo chybné pole v poradí na
// stránke (osobné údaje, adresa, naša Doprava a platba, súhlas): posun k nemu, červený rám, text pod ním, kurzor do
// poľa. Nič neodíde ani sa neoveruje so serverom. Zákazník opraví a klikne znova -> ďalšie pole; keď je všetko v
// poriadku, ide odoslanie ako doteraz (opc/krok2.js: resync, zámok, natívny Step2Validate). Rám zmizne hneď po oprave.
//
// Pravidlá sú Shoptetu, nevymýšľame vlastné (kniha § 6.4):
//   - kontrolujú sa tie isté polia ako validátor Shoptetu (selektor zo shoptetFormValidator v main-3g.js); povinné =
//     atribút required / trieda required / js-validate-required; pozastavené (js-validation-suspended) sa preskočia,
//   - chyby formátu (telefón, PSČ, e-mail, ulica s číslom) hlási Shoptet sám triedou js-error-field (nový validátor)
//     alebo error-field (starý) a jeho textom — my pole len nájdeme a zvýrazníme,
//   - telefón, ktorý Shoptet práve overuje (GET ShoptetValidatePhone: pole disabled + js-validated-field), neblokujeme;
//     rozhodne Shoptet (jeho validácia pri odoslaní na overenie počká a pri chybe ohlási ShoptetFailedValidation),
//   - texty sú Shoptetu (shoptet.messages.validator.<pole>Required, napr. „Zadajte telefónne číslo.“), inak naše
//     (texty.js poleChyba) a značky tiež (.js-validator-msg.msg-error vo .js-validated-element-wrapper, js-error-field),
//     takže chyba vyzerá rovnako ako chyby Shoptetu. Pridávame len triedu skupiny lcd-opc-chyba-pole (rám, CSS).

// Selektor shoptetFormValidator + .js-validate-required (validatorRequired Shoptetu hľadá povinné polia podľa triedy
// getElementsByClassName("js-validate-required")) — súhlas len s touto triedou má štítok „Povinné“ (_lcdOpc.scss, súhlasy
// B1) a kontrola ho musí nájsť tiež (revízia 30. 10. 2026, N5)
export const SELEKTOR_POLI = "input[required], input.required, textarea[required], input#companyId, input#passwordAgain, .js-validate, .js-validate-required";
const CHYBA_SHOPTETU = ["js-error-field", "error-field"];
const POVINNE = "validatorRequired"; // typ správy Shoptetu pre prázdne povinné pole (validatorRequired.messageType)
const NASA = "data-lcd-opc-chyba"; // pole / box sme označili my: "prazdne" | "chyba" | "doprava" | "platba"
const SKUPINA = "lcd-opc-chyba-pole";
const VYNECHAJ = /^(score|search|discountCouponCode)$/; // výnimky pravidla required v Shoptete

function okno(el) {
  return (el && el.ownerDocument && el.ownerDocument.defaultView) || null;
}
function validatorShoptetu(el) {
  try {
    const w = okno(el);
    return (w && w.shoptet && w.shoptet.validator) || null;
  } catch (e) {
    return null;
  }
}
/** shoptet.messages (texty chýb Shoptetu pre web), keď má validator; inak null. */
export function spravyShoptetu(w) {
  try {
    const m = w && w.shoptet && w.shoptet.messages;
    return m && m.validator ? m : null;
  } catch (e) {
    return null;
  }
}

/** Je prvok na stránke viditeľný (má rozloženie a nie je visibility:hidden)? */
export function viditelne(el) {
  if (!el || !el.getClientRects || !el.getClientRects().length) return false;
  try {
    const w = okno(el);
    return !w || w.getComputedStyle(el).visibility !== "hidden";
  } catch (e) {
    return true;
  }
}
/** Skupina poľa (popis + pole + text chyby): .form-group, inak obal validátora, inak rodič. */
export function skupinaPola(el) {
  if (!el || !el.closest) return null;
  return el.closest(".form-group") || el.closest(".js-validated-element-wrapper") || el.parentNode;
}
export function jePovinne(el) {
  return !!(el.required || el.classList.contains("required") || el.classList.contains("js-validate-required"));
}
/** Pole sme označili ako prázdne povinné (rám a text čakajú na opravu)? */
export function oznacenaPrazdna(el) {
  return !!(el && el.getAttribute && el.getAttribute(NASA) === "prazdne");
}
export function jePrazdne(el) {
  if (el.type === "checkbox" || el.type === "radio") return !el.checked;
  return !String(el.value == null ? "" : el.value).trim();
}

/**
 * Stav jedného poľa: null (v poriadku, alebo rozhodne Shoptet) | "prazdne" (povinné a prázdne) | "chyba" (Shoptet ho
 * označil ako chybné). o.viditelne = vlastná kontrola viditeľnosti (jednotkové testy v jsdom).
 */
export function stavPola(el, o) {
  if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return null;
  if (el.type === "hidden" || el.type === "search" || el.disabled || el.hasAttribute("data-lcd-opc")) return null;
  if (el.classList.contains("js-validation-suspended") || VYNECHAJ.test(el.name || "")) return null;
  if (el.classList.contains("js-validated-field")) return null; // Shoptet práve overuje (telefón)
  const vid = (o && o.viditelne) || viditelne;
  if (!vid(el) && !vid(skupinaPola(el))) return null;
  if (jePovinne(el) && jePrazdne(el)) return "prazdne";
  // chyba Shoptetu; trieda js-error-field z nášho označenia prázdneho poľa, ktoré je už vyplnené, chybou nie je
  if (CHYBA_SHOPTETU.some(function (c) { return el.classList.contains(c); }) && el.getAttribute(NASA) !== "prazdne") return "chyba";
  return null;
}

/** Naša sekcia Doprava a platba: skupina bez zvolenej voľby (rádio ani riadok-odkaz) = chyba na mieste sekcie. */
function chybySekcie(sek) {
  const out = [];
  if (!sek || !sek.querySelector) return out;
  [["shippingId", "doprava", ".co-delivery-method"], ["billingId", "platba", ".co-payment-method"]].forEach(function (x) {
    const box = sek.querySelector(x[2]);
    if (!box) return;
    const r = 'input[type="radio"][name="' + x[0] + '"][data-lcd-opc]';
    if (!box.querySelector(r) && !box.querySelector(".lcd-opc-odkaz")) return;
    if (box.querySelector(r + ":checked") || box.querySelector(".lcd-opc-odkaz.active")) return;
    const prve = box.querySelector(r + ":not(:disabled)") || box.querySelector("a.lcd-opc-odkaz__akcia") || box;
    out.push({ el: prve, dovod: x[1], skupina: box });
  });
  return out;
}

/**
 * Prvé zlé pole v poradí na stránke (formulár Shoptetu + naša sekcia + súhlas v bočnom paneli) -> { el, dovod, skupina }
 * | null. dovod: "prazdne" | "chyba" | "doprava" | "platba".
 */
export function prvaChyba(form, sek, o) {
  if (!form || !form.querySelectorAll) return null;
  const k = [];
  form.querySelectorAll(SELEKTOR_POLI).forEach(function (el) {
    const d = stavPola(el, o);
    if (d) k.push({ el: el, dovod: d, skupina: skupinaPola(el) });
  });
  chybySekcie(sek).forEach(function (x) { k.push(x); });
  if (!k.length) return null;
  k.sort(function (a, b) {
    if (a.el === b.el) return 0;
    return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; // 4 = DOCUMENT_POSITION_FOLLOWING
  });
  return k[0];
}

/** Text pod poľom: Shoptetu pre pole (<name>Required, pri consents[] „consentsRequired“), inak náš. */
export function textChyby(z, T, spravy) {
  if (z.dovod === "doprava") return T.vyberteDopravu;
  if (z.dovod === "platba") return T.vybertePlatbu;
  if (z.dovod === "chyba") return T.poleSkontrolujte;
  const v = (spravy && spravy.validator) || {};
  const el = z.el || {};
  const kluce = [String(el.name || "").split("[")[0], el.id].filter(Boolean);
  for (let i = 0; i < kluce.length; i++) {
    const t = v[kluce[i] + "Required"];
    if (typeof t === "string" && t.trim()) return t;
  }
  return T.poleChyba;
}

function novaSprava(doc, typ) {
  const m = doc.createElement("div");
  m.className = "js-validator-msg msg-error";
  m.setAttribute("data-type", typ);
  return m;
}

/**
 * Zvýrazní zlé pole: rám skupiny (lcd-opc-chyba-pole), aria-invalid a text pod poľom. Prázdne povinné pole dostane
 * správu cez shoptet.validator.addErrorMessage (ako jeho chyby; text prepíšeme textChyby), bez neho rovnaké značky
 * vlastnými silami. Chybe Shoptetu (formát) necháme jeho text; bez textu doplníme „Skontrolujte, prosím, toto pole.“
 */
export function oznacChybu(z, text) {
  const el = z.el;
  const doc = el.ownerDocument;
  const sk = z.skupina || skupinaPola(el);
  if (z.dovod === "doprava" || z.dovod === "platba") {
    sk.classList.add(SKUPINA);
    sk.setAttribute(NASA, z.dovod);
    let p = sk.querySelector(".lcd-opc-chyba-text");
    if (!p) {
      p = doc.createElement("p");
      p.className = "lcd-opc-chyba-text msg-error";
      p.setAttribute("role", "alert");
      sk.appendChild(p);
    }
    p.textContent = text;
    return;
  }
  if (sk) sk.classList.add(SKUPINA);
  el.setAttribute("aria-invalid", "true");
  const obal = el.closest(".js-validated-element-wrapper") || sk;
  if (z.dovod === "prazdne") {
    el.setAttribute(NASA, "prazdne");
    const sv = validatorShoptetu(el);
    if (sv && typeof sv.addErrorMessage === "function" && el.closest(".js-validated-element-wrapper")) {
      try { sv.addErrorMessage(el, POVINNE); } catch (e) {}
    }
    let m = obal && obal.querySelector('.js-validator-msg[data-type="' + POVINNE + '"]');
    if (!m && obal) {
      // ako addErrorMessage Shoptetu: staré správy v obale preč, jedna nová na koniec obalu
      obal.querySelectorAll(".js-validator-msg").forEach(function (x) { x.remove(); });
      m = novaSprava(doc, POVINNE);
      obal.appendChild(m);
    }
    el.classList.add("js-error-field");
    if (m) {
      m.textContent = text;
      m.setAttribute("role", "alert");
    }
    return;
  }
  el.setAttribute(NASA, "chyba");
  const maText = obal && Array.prototype.some.call(obal.querySelectorAll(".js-validator-msg, .validator-msg"), function (x) { return String(x.textContent || "").trim(); });
  if (!maText && obal) {
    const m = novaSprava(doc, "lcdOpc");
    m.textContent = text;
    m.setAttribute("role", "alert");
    obal.appendChild(m);
  }
}

/**
 * Po zmene poľa (input / change / opustenie / Shoptet zrušil chybu): keď je naše označené pole už v poriadku, rám
 * a náš text hneď preč. -> true, keď sa niečo zrušilo. Chybu formátu ruší Shoptet sám (po jeho kontrole sa zruší aj rám).
 */
export function poOprave(el) {
  if (!el || !el.closest || !el.hasAttribute) return false;
  if (el.hasAttribute("data-lcd-opc")) {
    const box = el.closest(".lcd-opc-box");
    if (!box || !box.hasAttribute(NASA)) return false;
    if (!box.querySelector('input[type="radio"][data-lcd-opc]:checked') && !box.querySelector(".lcd-opc-odkaz.active")) return false;
    box.classList.remove(SKUPINA);
    box.removeAttribute(NASA);
    const p = box.querySelector(".lcd-opc-chyba-text");
    if (p) p.remove();
    return true;
  }
  const typ = el.getAttribute(NASA);
  if (!typ) return false;
  const obal = el.closest(".js-validated-element-wrapper");
  if (typ === "prazdne") {
    if (jePrazdne(el)) return false;
    const sv = validatorShoptetu(el);
    if (sv && typeof sv.removeErrorMessage === "function") {
      try { sv.removeErrorMessage(el, POVINNE); } catch (e) {}
    }
    if (obal) obal.querySelectorAll('.js-validator-msg[data-type="' + POVINNE + '"]').forEach(function (x) { x.remove(); });
    if (!obal || !obal.querySelector(".js-validator-msg")) el.classList.remove("js-error-field");
  } else if (CHYBA_SHOPTETU.some(function (c) { return el.classList.contains(c); })) {
    return false;
  }
  if (obal) obal.querySelectorAll('.js-validator-msg[data-type="lcdOpc"]').forEach(function (x) { x.remove(); });
  el.removeAttribute(NASA);
  el.removeAttribute("aria-invalid");
  const sk = skupinaPola(el);
  if (sk) sk.classList.remove(SKUPINA);
  return true;
}

/**
 * Posun k zlému poľu a kurzor doň. Keď je celá skupina už na obrazovke (nad lištou dole), stránka sa nehýbe; inak
 * príde skupina na 20 % výšky okna (nad ňou kúsok kontextu, pod ňou miesto pre klávesnicu telefónu a lištu).
 * o: { dole: výška lišty dole v px, hore: rezerva navrchu }
 */
/** Zariadenie s klávesnicou na obrazovke: úzke okno (telefón, tablet na výšku) alebo dotykový ukazovateľ. */
function dotykove(w) {
  if ((w.innerWidth || 0) < 992) return true;
  try { return !!w.matchMedia && w.matchMedia("(pointer: coarse)").matches; } catch (e) { return false; }
}
export function posunNaChybu(z, o) {
  const el = z.el;
  const w = okno(el);
  if (!w) return;
  const opt = o || {};
  const ciel = z.skupina || skupinaPola(el) || el;
  const r = ciel.getBoundingClientRect();
  const vh = w.innerHeight || 0;
  const hore = opt.hore != null ? opt.hore : 12;
  let dole = opt.dole || 0;
  // telefón / tablet: po fokuse sa otvorí klávesnica (textová s lištou formulára ≈ 336–380 px na iPhone) a prekryje dolnú
  // polovicu okna — pole aj s textom chyby musí byť v horných 55 % okna, inak sa posunie na 20 % (revízia: Mesto ostalo pod
  // klávesnicou). Zaškrtávacie polia a rádiá klávesnicu neotvárajú -> bez zmeny.
  if (/^(input|textarea|select)$/i.test(el.tagName || "") && !/^(checkbox|radio|button|submit|hidden)$/i.test(el.type || "") && dotykove(w)) {
    dole = Math.max(dole, Math.round(vh * 0.45));
  }
  if (!(r.top >= hore && r.bottom <= vh - dole)) {
    let plynulo = true;
    try { plynulo = !w.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    const y = r.top + (w.pageYOffset || 0) - Math.max(hore, Math.round(vh * 0.2));
    w.scrollTo({ top: Math.max(0, Math.round(y)), behavior: plynulo ? "smooth" : "auto" });
  }
  try {
    el.focus({ preventScroll: true });
  } catch (e) {
    try { el.focus(); } catch (x) {}
  }
}
