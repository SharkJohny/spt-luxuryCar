// Nový konfigurátor 1V — „Poznámka k objednávke“ pod tlačidlom košíka podľa návrhov (.pozn-dole v jednovrstvove,
// dvojvrstvove, kufor-classic, kufor-premium a boxy.html): malý štítok, pilulka „nepovinné“, príklad v placeholdri
// podľa typu a veta pod poľom. Texty: ctx.texty("poznamka") { nepovinne, ph, hint } (typy/<typ>.js, základ jedno).
// Vzorkovník 637 tento modul nemá — návrh vzorkovnik.html poznámku nemá, pole skryje _lcd1v-vzorky.scss.
//
// Pole NEstavia 1V. Je to pole doplnku Shoptetu ProductNote.js (.NoteDiv > textarea#Note): doplnok ho vkladá za
// .add-to-cart a pri vložení do košíka (udalosť shoptet.tracking.getFormAction) uloží text #Note do localStorage,
// v objednávke ho zapíše do #remark. 1V pole len preštýluje (_lcd1v-cena.scss) a doplní pilulku, placeholder a vetu —
// text ide do objednávky presne ako dnes (nič nové sa neposiela, žiadne name).
// PC (jednovrstvové a dvojvrstvové): doplnok pole pri načítaní nevloží (jeho kotva .p-info-wrapper .add-to-cart vtedy
// ešte nestojí), vloží ho až pri prvej udalosti shoptet.surcharges.updatePrices, teda uprostred výberu. Návrh má
// pole aj na PC hneď pod tlačidlom, preto modul zavolá tú istú funkciu doplnku (showNoteTextArea s jeho
// konfiguráciou) hneď — pole aj jeho obsluha sú doplnku, len prídu skôr.
// Beží len pod body.lcd-1v (brána v index.js). Zlyhanie tu nezloží nový vzhľad: poznámka je nepovinná, pole ostane,
// ako ho dá doplnok.
export const MENO = "poznamka";

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

/** Konfigurácia doplnku (`const productNoteConfig` v HTML kóde Shoptetu — globálna, ale nie vlastnosť window). */
function konfiguraciaDoplnku() {
  try {
    // eslint-disable-next-line no-undef
    return typeof productNoteConfig !== "undefined" && productNoteConfig ? productNoteConfig : null;
  } catch (e) {
    return null;
  }
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const T = ctx.texty("poznamka");
  const form = ctx.form();
  const kos = ctx.krok("kosik");
  const doKosika = kos && kos.closest(".add-to-cart");
  if (!form || !doKosika || !doKosika.parentNode) return; // bez tlačidla košíka niet kam — pole ostane, ako ho dá doplnok
  const body = document.body;
  let zruseny = false;
  let pole = null; // { div, ta, ph, lbl, desc, vlozene[] } — upravené pole doplnku

  const najdi = () => form.querySelector(".NoteDiv");

  /** Vráti pole doplnku do pôvodného stavu (pilulka a veta preč, placeholder a aria späť). */
  function vrat() {
    if (!pole) return;
    pole.vlozene.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    if (pole.ta) {
      if (pole.ph == null) pole.ta.removeAttribute("placeholder");
      else pole.ta.setAttribute("placeholder", pole.ph);
      if (pole.lbl == null) pole.ta.removeAttribute("aria-labelledby");
      else pole.ta.setAttribute("aria-labelledby", pole.lbl);
      if (pole.desc == null) pole.ta.removeAttribute("aria-describedby");
      else pole.ta.setAttribute("aria-describedby", pole.desc);
    }
    pole = null;
  }

  function zrus() {
    if (zruseny) return;
    zruseny = true;
    vrat();
    mo.disconnect();
    moBody.disconnect();
  }

  function uprav() {
    if (zruseny) return;
    if (!body.classList.contains("lcd-1v")) { zrus(); return; }
    const div = najdi();
    if (!div) return;
    if (pole && pole.div === div) return; // už upravené
    vrat(); // doplnok pole vymenil (nestáva sa) -> upraviť nové
    const ta = div.querySelector("textarea");
    const nadpis = div.querySelector(".NoteNadpis");
    pole = { div, ta, ph: ta && ta.getAttribute("placeholder"), lbl: ta && ta.getAttribute("aria-labelledby"), desc: ta && ta.getAttribute("aria-describedby"), vlozene: [] };
    const nazvy = [];
    if (nadpis) {
      if (!nadpis.id) nadpis.id = "lcd1v-pozn-nadpis";
      nazvy.push(nadpis.id);
      if (T.nepovinne) {
        const nep = el("i", "lcd1v-pozn-nep", T.nepovinne);
        nep.id = "lcd1v-pozn-nep";
        nadpis.parentNode.insertBefore(nep, nadpis.nextSibling);
        pole.vlozene.push(nep);
        nazvy.push(nep.id);
      }
    }
    if (ta) {
      if (T.ph) ta.setAttribute("placeholder", T.ph);
      if (nazvy.length) ta.setAttribute("aria-labelledby", nazvy.join(" "));
      if (T.hint) {
        const hint = el("p", "lcd1v-pozn-hint", T.hint);
        hint.id = "lcd1v-pozn-hint";
        ta.parentNode.insertBefore(hint, ta.nextSibling);
        pole.vlozene.push(hint);
        ta.setAttribute("aria-describedby", hint.id);
      }
    }
  }

  // doplnok vkladá pole za .add-to-cart (jQuery .after) -> stačí sledovať rodiča tlačidla, nie celý formulár
  let naplanovane = false;
  const mo = new MutationObserver(function () {
    if (naplanovane) return;
    naplanovane = true;
    setTimeout(function () { naplanovane = false; uprav(); }, 0);
  });
  mo.observe(doKosika.parentNode, { childList: true });
  // návrat na starý vzhľad neskôr (ctx.zlozit po asynchrónnej chybe) -> pilulka a veta preč, pole doplnku ako dnes
  const moBody = new MutationObserver(function () { if (!body.classList.contains("lcd-1v")) zrus(); });
  moBody.observe(body, { attributes: true, attributeFilter: ["class"] });

  // pole doplnku hneď (PC ho inak dostane až pri prvom prepočte príplatkov); doplnok sa načítava pred luxuryCar.js,
  // čakanie je len poistka
  ctx.ked(() => najdi() || (typeof window.showNoteTextArea === "function" && konfiguraciaDoplnku()), function () {
    if (zruseny || !body.classList.contains("lcd-1v")) return;
    if (!najdi()) {
      try { window.showNoteTextArea(konfiguraciaDoplnku()); } catch (e) { /* doplnok tretej strany — bez poľa ako dnes */ }
    }
    uprav();
  }, { limit: 15000 });
  uprav();
  // index.js zloží body.lcd-1v synchrónne po init všetkých modulov, ak niektorý zlyhal -> späť
  setTimeout(function () { if (!body.classList.contains("lcd-1v")) zrus(); }, 0);
}
