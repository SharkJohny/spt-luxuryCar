// Napojenie konfigurátora kamiónov na Shoptet (SK 640): živé ceny zo selectov príplatkov, zápis výberu do selectov,
// klik na natívne „Pridať do košíka“. Plán: docs/kamiony-1v-plan.md §2.
//
// PARITA S REACTOM: blok na konci súboru (normalizeOptionText, findMatchingOption, resolveValue, syncToShoptet) a
// PRICE_SUFFIX_RE/_parseOptionPrice sú DOSLOVNÁ kópia truck-konfigurator/konfigurator.gen.jsx (PC aj telefón sú zhodné;
// 18. 10. 2026) — do košíka ide presne to isté, čo dnes posiela React. Vstup je stav v tvare React finalConfiguration
// (stav.js naStavReactu). tools/test-kamion-kosik.mjs porovnáva výsledok s vyrezaným aktuálnym gen.jsx: pri re-syncu
// Reactu z klientskeho repa test chytí rozdiel. Poznámku objednávky skladá order-summary.mjs (persistTruckOrderSummary).
// Pri importe sa nič nespúšťa.
import { povoleneNasivkyVsade } from "../../../truck-konfigurator/pricing.js";
import { PRECIARKNUTE_EUR, NASIVKY_ZALOHA } from "./data.js";

/** Selecty príplatkov 640 podľa data-parameter-name (SK aj CZ meno; ID sa medzi obchodmi líšia). Všetky sú nutné. */
export const SELECTY = {
  material: ["Typ materiálu", "Typ materiálu koberečků"],
  farba: ["Farba materiálu", "Barva materiálu"],
  lemovanie: ["Farba lemovania", "Barva lemování"],
  nasivky: ["Rozloženie nášiviek", "Rozložení nášivek"],
  bokyTyp: ["Typ nášiviek na boky", "Typ nášivek na boky"],
  bokyNit: ["Farba nášiviek na boky", "Barva nášivek na boky"],
  stredTyp: ["Typ nášivky na stred", "Typ nášivky na střed"],
  stredNit: ["Farba nášivky na stred", "Barva nášivky na střed"],
  tapacir: ["Tapacír", "Čalounění"],
  tapMaterial: ["Typ materiálu tapacíru"],
  tapFarba: ["Farba materiálu tapacíru", "Barva materiálu tapacíru"],
  tapLem: ["Farba lemovania tapacíru", "Barva lemování tapacíru"],
  tapNasivka: ["Nášivky na tapacír"],
  tapNasTyp: ["Typ nášivky na tapacír"],
  tapNasNit: ["Farba nášiviek na tapacíre", "Barva nášivek na tapacíru"],
};

const dokument = (d) => d || (typeof document !== "undefined" ? document : null);
const menoSelectu = (s) => String(s.getAttribute("data-parameter-name") || "").trim();
const presne = (s) => String(s || "").trim().toLowerCase();

/** Select podľa kľúča SELECTY (alebo null); meno sa porovnáva presne (bez veľkosti písmen), ako resolveValue. */
export function select(kluc, doc) {
  const d = dokument(doc);
  if (!d) return null;
  const mena = (SELECTY[kluc] || []).map(presne);
  return Array.prototype.find.call(d.querySelectorAll("select[data-parameter-id][data-parameter-name]"), (s) => mena.indexOf(presne(menoSelectu(s))) > -1) || null;
}

/** Natívne tlačidlo košíka (to isté ako [data-testid=buttonAddToCart]). */
export function nativneTlacidlo(doc) {
  const d = dokument(doc);
  return d ? d.querySelector("#product-detail-form .add-to-cart button.add-to-cart-button") || d.querySelector('[data-testid="buttonAddToCart"]') : null;
}

/** Základná cena produktu (meta[itemprop=price], ako gen.jsx _readBasePrice). */
export function zakladnaCena(doc) {
  const d = dokument(doc);
  const el = d && (d.querySelector('meta[itemprop="price"]') || d.querySelector('meta[property="product:price:amount"]'));
  if (!el) return 0;
  const v = parseFloat(String(el.getAttribute("content") || "").replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
}

/** Čo na stránke chýba pre nový konfigurátor ([] = všetko je): formulár, stĺpec, tlačidlo, cena, 15 selectov. */
export function chybajuce(doc) {
  const d = dokument(doc);
  const out = [];
  if (!d || !d.getElementById("product-detail-form")) out.push("form#product-detail-form");
  if (!d || !d.querySelector(".p-info-wrapper")) out.push(".p-info-wrapper");
  if (!nativneTlacidlo(d)) out.push(".add-to-cart button.add-to-cart-button");
  if (!(zakladnaCena(d) > 0)) out.push("meta[itemprop=price]");
  Object.keys(SELECTY).forEach((k) => { if (!select(k, d)) out.push("select " + SELECTY[k][0]); });
  return out;
}

// ---- cena z textu možnosti: DOSLOVNE konfigurator.gen.jsx
const PRICE_SUFFIX_RE = /\s*([+\-])\s*(?:Kč|€|EUR|CZK)?\s*(\d[\d\s ]*(?:[.,]\d+)?)\s*(?:Kč|€|EUR|CZK)?\s*$/i;

function _parseOptionPrice(text) {
  if (!text) return { price: 0, clean: "" };
  const trimmed = String(text).trim();
  const m = trimmed.match(PRICE_SUFFIX_RE);
  if (!m) return { price: 0, clean: trimmed };
  const sign = m[1] === "-" ? -1 : 1;
  const num = parseFloat(m[2].replace(/[\s ]/g, "").replace(",", "."));
  return {
    price: Number.isFinite(num) ? sign * num : 0,
    clean: trimmed.slice(0, m.index).trim(),
  };
}

/** Príplatok možnosti z textu („+€10“ aj „+10 €“); nezhoda s data-surcharge-final-price -> zápis do nezhody. */
function priplatokMoznosti(o, nezhody) {
  const t = _parseOptionPrice(o.textContent).price;
  const f = Number(o.getAttribute("data-surcharge-final-price"));
  if (o.hasAttribute("data-surcharge-final-price") && Number.isFinite(f) && f !== t) nezhody.push(o.textContent.trim() + " (data " + f + ")");
  return t;
}

/** Príplatok možnosti selectu, ktorú nájde findMatchingOption (ako sync), inak throw. */
function priplatok(kluc, hladany, d, nezhody) {
  const s = select(kluc, d);
  const o = s && findMatchingOption(s, hladany);
  if (!o) throw new Error("kamion: v selecte " + SELECTY[kluc][0] + " chýba možnosť „" + hladany + "“");
  return priplatokMoznosti(o, nezhody);
}

/**
 * Živé ceny v tvare cena.js data.ceny: základ (meta price) + príplatky z textov možností. Chýba select alebo možnosť
 * -> throw (poistka: zákazník dostane React). Prečiarknuté ceny = PRECIARKNUTE_EUR (Shoptet ich nemá, React tiež nie).
 * nezhody = možnosti, kde text a data-surcharge-final-price nesedia (len hlásenie).
 */
export function citajCeny(doc) {
  const d = dokument(doc);
  const nezhody = [];
  const zaklad = zakladnaCena(d);
  if (!(zaklad > 0)) throw new Error("kamion: chýba základná cena (meta[itemprop=price])");
  const sm = select("material", d);
  if (!sm) throw new Error("kamion: chýba select Typ materiálu");
  const material = {};
  Array.prototype.forEach.call(sm.querySelectorAll("option[value]"), (o) => {
    if (!o.value) return;
    const { clean } = _parseOptionPrice(o.textContent);
    if (clean) material[clean] = priplatokMoznosti(o, nezhody);
  });
  if (!Object.keys(material).length) throw new Error("kamion: select Typ materiálu nemá možnosti");
  return {
    zaklad_eur: zaklad,
    priplatky: {
      material,
      nasivky_rozlozenie: {
        nechcem: priplatok("nasivky", "Bez nášiviek", d, nezhody),
        stred: priplatok("nasivky", "Len stred", d, nezhody),
        boky: priplatok("nasivky", "Šofér + spolujazdec", d, nezhody),
        "boky+stred": priplatok("nasivky", "Šofér + spolujazdec + stred (BALÍK)", d, nezhody),
      },
      tapacir_balik: priplatok("tapacir", "Áno chcem (v konfigurátore – balík)", d, nezhody),
      nasivka_na_dverach: priplatok("tapNasivka", "Áno chcem nášivku na dverách", d, nezhody),
    },
    preciarknute_ceny: Object.assign({}, PRECIARKNUTE_EUR),
    nezhody,
  };
}

/** Motívy nášiviek povolené v selectoch Shoptetu (pricing.js povoleneNasivkyVsade): { boky, stred, dvere } = [kódy]. */
export function povoleneMotivy(doc) {
  let p = null;
  try { p = povoleneNasivkyVsade(dokument(doc)); } catch (e) { p = null; }
  const out = {};
  ["boky", "stred", "dvere"].forEach((k) => {
    const s = p && p[k];
    out[k] = s && s.size ? Array.from(s) : NASIVKY_ZALOHA.slice();
  });
  return out;
}

/** Súčet ceny podľa Shoptetu: základ + príplatky zvolených možností všetkých selectov príplatkov formulára. */
export function sucetShoptetu(doc) {
  const d = dokument(doc);
  let spolu = zakladnaCena(d);
  Array.prototype.forEach.call(d.querySelectorAll("#product-detail-form select.surcharge-parameter"), (s) => {
    if (!s.value) return;
    const o = s.options[s.selectedIndex];
    if (o) spolu += _parseOptionPrice(o.textContent).price;
  });
  return spolu;
}

/** Povinné selecty bez hodnoty (ako diagnostika Reactu pred klikom) -> [mená]. */
export function povinneBezHodnoty(doc) {
  const d = dokument(doc);
  return Array.prototype.filter.call(d.querySelectorAll("select[data-parameter-id]"), (s) => s.required && !s.value).map((s) => menoSelectu(s) || s.name);
}

/** Klik na natívne tlačidlo (záloha form.requestSubmit, ako React). true = kliklo sa. */
export function klikniKosik(doc) {
  const b = nativneTlacidlo(doc);
  if (!b) return false;
  try {
    b.click();
  } catch (e) {
    const f = b.closest("form");
    if (!f || typeof f.requestSubmit !== "function") return false;
    try { f.requestSubmit(b); } catch (x) { return false; }
  }
  return true;
}

/** Selecty detailov tapacíru (materiál, farba, lemovanie, nášivka a niť na dverách). */
const TAPACIR_DETAILY = ["tapMaterial", "tapFarba", "tapLem", "tapNasTyp", "tapNasNit"];

/**
 * Upratanie po syncToShoptet (oprava N1, nové UI navyše oproti Reactu): bez tapacíru (doorPanelChoice !== "ano" —
 * tapacír Nie alebo vozidlo bez „(TIR)“) syncToShoptet nechá v detailoch tapacíru starú hodnotu, kde resolveValue
 * vráti null (napr. TIR s nášivkou na dverách -> dodávka: 397 „Nášivka H21“, 400 „2824 – Červená“). Takýto select sa
 * vráti na prázdnu hodnotu „Vyberte príplatok“ — rovnako, ako keď zákazník tapacír nikdy nevybral (čerstvá dodávka,
 * tapacír Nie hneď). Povinné a jednohodnotové selecty sa nemenia. Vráti počet upratnutých selectov.
 */
export function upratTapacir(state, doc) {
  const d = dokument(doc);
  if (!d || !state || state.doorPanelChoice === "ano") return 0;
  let n = 0;
  TAPACIR_DETAILY.forEach((k) => {
    const s = select(k, d);
    if (!s || s.required || !s.value) return;
    const realne = Array.prototype.filter.call(s.querySelectorAll("option"), (o) => o.getAttribute("value"));
    if (realne.length === 1) return;
    if (resolveValue(menoSelectu(s), state) !== null) return;
    s.value = "";
    s.dispatchEvent(new d.defaultView.Event("change", { bubbles: true }));
    n++;
  });
  return n;
}

// ================================================================ DOSLOVNÁ KÓPIA konfigurator.gen.jsx (nemeniť ručne)
export function normalizeOptionText(value) {
  return String(value || "")
    .replace(/\s*[+\-]\s*(?:Kč|€|EUR|CZK)?\s*\d[\d\s]*(?:[.,]\d+)?\s*(?:Kč|€|EUR|CZK)?\s*$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bkoza\b/g, "kuze")
    .replace(/\bjednofarebna\b/g, "jednobarevna")
    .replace(/\bpresivana\b/g, "prosivana")
    .replace(/\bjednofarebny\b/g, "jednobarevny")
    .replace(/\bdvojfarebny\b/g, "dvoubarevny")
    .replace(/\bnasiviek\b/g, "nasivek")
    .replace(/\bpouze\b|\blen\b/g, "jen")
    .replace(/\bsofer\b/g, "ridic")
    .replace(/\bspolujazdec\b/g, "spolujezdec")
    .replace(/\bbalik\b|\bbundle\b/g, "balicek")
    .replace(/\bchcem\b/g, "chci")
    .replace(/\bnechcem\b/g, "nechci")
    .replace(/\bnie\b/g, "ne")
    .replace(/\bdverach\b/g, "dverich")
    .replace(/\bako\b/g, "jako")
    .replace(/\bvyberie\b/g, "vybere")
    .replace(/\bsa\b/g, "se")
    .replace(/\bkonfiguratore\b/g, "konfiguratoru")
    .replace(/\brovnaky\b/g, "stejny")
    .replace(/\brovnaka\b/g, "stejna")
    .replace(/\brovnake\b/g, "stejne")
    .replace(/[(),–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findMatchingOption(select, search) {
  if (!search) return null;
  const opts = select.querySelectorAll("option[value]");
  const searchNorm = normalizeOptionText(search);
  for (const o of opts) {
    if (!o.value) continue;
    const t = normalizeOptionText(o.textContent);
    if (t === searchNorm) return o;
  }
  for (const o of opts) {
    if (!o.value) continue;
    const t = normalizeOptionText(o.textContent);
    if (t.includes(searchNorm) || searchNorm.includes(t)) return o;
  }
  return null;
}

/** Možnosť „Vyberie sa v konfigurátore“ / „Vybere se v konfigurátoru“ (záloha, keď výber v admine ešte nemá hodnotu). */
export function najdiZastupnuMoznost(select) {
  return Array.from(select.querySelectorAll("option[value]")).find(
    (o) => o.value && /\bv konfiguratoru$/.test(normalizeOptionText(o.textContent)),
  ) || null;
}

export function resolveValue(paramName, s) {
  const n = String(paramName || "").trim().toLowerCase();

  // Cenotvorné parametre (test-truck.xml SHORT_NAMEs)
  if (
    n === "materiál" ||
    n === "material" ||
    n === "typ materiálu" ||
    n === "typ materiálu koberečků"
  ) return s.selectedMaterial || null;

  if (n === "nášivky" || n === "nasivky" || n === "rozloženie nášiviek" || n === "rozložení nášivek") {
    if (!s.nasivkyPlacement) return null;
    return ({
      nechcem: "Bez nášiviek",
      stred: "Len stred",
      boky: "Šofér + spolujazdec",
      "boky+stred": "Šofér + spolujazdec + stred (BALÍK)",
    })[s.nasivkyPlacement] || null;
  }

  if (n === "nášivka boky" || n === "nasivka boky" || n === "typ nášiviek na boky" || n === "typ nášivek na boky") {
    if (!s.nasivkyPlacement) return null;
    const hasSideEmbroidery =
      s.nasivkyPlacement === "boky" || s.nasivkyPlacement === "boky+stred";
    if (!hasSideEmbroidery) return "Bez nášivky";
    return s.selectedNasivka ? "Nášivka " + s.selectedNasivka.code : null;
  }

  if (n === "niť boky" || n === "nit boky" || n === "farba nášiviek na boky" || n === "barva nášivek na boky") {
    if (!s.nasivkyPlacement) return null;
    const hasSideEmbroidery =
      s.nasivkyPlacement === "boky" || s.nasivkyPlacement === "boky+stred";
    if (!hasSideEmbroidery) return "Bez nite";
    return s.selectedNasivka && s.selectedNitColor
      ? s.selectedNitColor.code
      : null;
  }

  if (n === "nášivka stred" || n === "nasivka stred" || n === "typ nášivky na stred" || n === "typ nášivky na střed") {
    if (!s.nasivkyPlacement) return null;
    const hasCenterEmbroidery =
      s.nasivkyPlacement === "stred" || s.nasivkyPlacement === "boky+stred";
    if (!hasCenterEmbroidery) return "Bez nášivky";
    return s.selectedStredNasivka
      ? "Nášivka " + s.selectedStredNasivka.code
      : null;
  }

  if (n === "niť stred" || n === "nit stred" || n === "farba nášivky na stred" || n === "barva nášivky na střed") {
    if (!s.nasivkyPlacement) return null;
    const hasCenterEmbroidery =
      s.nasivkyPlacement === "stred" || s.nasivkyPlacement === "boky+stred";
    if (!hasCenterEmbroidery) return "Bez nite";
    return s.selectedStredNasivka && s.selectedStredNitColor
      ? s.selectedStredNitColor.code
      : null;
  }

  if (n === "tapacír" || n === "tapacir") {
    if (s.doorPanelChoice === "ano") return "Áno chcem (v konfigurátore – balík)";
    // null (krok 5 preskočený) = "nechcem" — Shoptet select Tapacír je POVINNÝ;
    // bez hodnoty by natívne Pridať do košíka potichu zlyhalo.
    return "Nie nechcem tapacír dverí";
  }

  if (n === "čalounění" || n === "calouneni") {
    if (s.doorPanelChoice === "ano") return "Ano, chci (v konfigurátoru – balíček)";
    return "Ne, nechci čalounění dveří";
  }

  if (
    n === "nášivka dvere" ||
    n === "nasivka dvere" ||
    n === "nášivka dveře" ||
    n === "nasivka dveře" ||
    n === "nášivky na tapacír"
  ) {
    if (s.doorPanelChoice !== "ano") return "Nie nechcem nášivku na dverách";
    if (s.doorWantsNasivka === true) return "Áno chcem nášivku na dverách";
    if (s.doorWantsNasivka === false) return "Nie nechcem nášivku na dverách";
    return null;
  }

  // Informatívne (PRICE=0)
  if (n === "farba" || n === "farba materiálu" || n === "barva materiálu") {
    if (!s.selectedMaterial || !s.selectedColor) return null;
    return s.farbaPriplatok || s.selectedMaterial + " / " + s.selectedColor.code;
  }
  if (n === "lemovanie" || n === "farba lemovania" || n === "barva lemování") {
    if (!s.selectedLemovanie) return null;
    return s.lemovaniePriplatok || s.selectedLemovanie.code;
  }
  if (n === "nášivka" || n === "nasivka") {
    if (!s.selectedNasivka) return null;
    return s.selectedNasivka.code;
  }
  if (n === "farba nite") {
    if (!s.selectedNitColor) return null;
    return s.selectedNitColor.code;
  }
  if (
    n === "materiál dvere" ||
    n === "material dvere" ||
    n === "materiál dveře" ||
    n === "material dveře" ||
    n === "typ materiálu tapacíru"
  ) {
    if (s.doorPanelChoice !== "ano") return null;
    if (s.doorSameAsCarpet && s.doorSameAsCarpet.material) return "Rovnaký ako koberec";
    return s.doorMaterial || null;
  }
  if (n === "farba dvere" || n === "barva dveře" || n === "farba materiálu tapacíru" || n === "barva materiálu tapacíru") {
    if (s.doorPanelChoice !== "ano") return null;
    if (s.doorSameAsCarpet && s.doorSameAsCarpet.material) return "Rovnaká ako koberec";
    if (!s.doorMaterial || !s.doorColor) return null;
    return s.doorFarbaPriplatok || "Vybere se v konfigurátoru";
  }
  if (n === "lemovanie dvere" || n === "lemování dveře" || n === "farba lemovania tapacíru" || n === "barva lemování tapacíru") {
    if (s.doorPanelChoice !== "ano") return null;
    if (s.doorSameAsCarpet && s.doorSameAsCarpet.lemovanie) return "Rovnaké ako koberec";
    return s.doorLemovanie ? (s.doorLemovaniePriplatok || "Vybere se v konfigurátoru") : null;
  }
  if (
    n === "nášivka dvere druh" ||
    n === "nasivka dvere druh" ||
    n === "nášivka dveře druh" ||
    n === "nasivka dveře druh" ||
    n === "typ nášivky na tapacír"
  ) {
    if (!s.doorPanelChoice) return null;
    if (s.doorPanelChoice !== "ano" || s.doorWantsNasivka === false) {
      return "Bez nášivky";
    }
    if (s.doorWantsNasivka === null) return null;
    if (s.doorSameNasivkaAsCarpet) return "Rovnaká ako koberec";
    return s.doorNasivka ? "Nášivka " + s.doorNasivka.code : null;
  }
  if (
    n === "niť dvere" ||
    n === "nit dvere" ||
    n === "niť dveře" ||
    n === "nit dveře" ||
    n === "farba nite – dvere" ||
    n === "farba nite - dvere" ||
    n === "farba nášiviek na tapacíre" ||
    n === "barva nášivek na tapacíru"
  ) {
    if (!s.doorPanelChoice) return null;
    if (
      s.doorPanelChoice !== "ano" ||
      s.doorWantsNasivka === false
    ) {
      return "Bez nite";
    }
    if (s.doorWantsNasivka === null) return null;
    if (s.doorSameNitAsCarpet) return "Rovnaká ako koberec";
    return (s.doorNitColor && s.doorNitColor.code) || null;
  }

  // Vozidlo + extras
  if (n === "vozidlo" || (n.includes("značka") && n.includes("model")) || (n.includes("znacka") && n.includes("model"))) {
    if (!s.znacka || !s.model) return null;
    return s.znacka + " " + s.model;
  }
  if (n === "prevodovka" || n === "převodovka" || n === "typ prevodovky") {
    return (s.extras && s.extras.prevodovka) || null;
  }
  if (n === "sedadlo" || n === "sedadlo spolujazdca" || n.startsWith("sedadl") || n === "typ sedadla spolujazdca") {
    return (s.extras && s.extras.sedadlo) || null;
  }
  if (n === "zásuvky" || n === "zasuvky" || n.startsWith("počet zásuv") || n.startsWith("pocet zasuv")) {
    return (s.extras && s.extras.zasuvky) || null;
  }
  if (n === "brzda" || n === "typ parkovacej brzdy" || n === "typ brzdy" || n.startsWith("brzd")) {
    return (s.extras && s.extras.brzda) || null;
  }
  if (n === "podlaha" || n.startsWith("podlah")) {
    return (s.extras && s.extras.podlaha) || null;
  }

  return null;
}

export function syncToShoptet(state) {
  if (typeof document === "undefined") return { totalSelects: 0, matchedCount: 0, changed: false };
  // Skutočná značka+model kamiónu sa do Shoptet selectu nedostane (Vozidlo má
  // jedinú hodnotu "Vyberie sa v konfigurátore") — ulož do sessionStorage,
  // košík (cart.js) ju odtiaľ zobrazí ako "Vozidlo: <značka model>".
  try {
    if (state.znacka && state.model) {
      sessionStorage.setItem("truckVehicle", state.znacka + " " + state.model);
    }
  } catch (e) { /* private mode */ }
  const allSelects = document.querySelectorAll("select[data-parameter-id]");
  let changed = false;
  let matchedCount = 0;

  allSelects.forEach(function (sel) {
    const name = (sel.dataset.parameterName || "").trim();

    // Single-option select (placeholder + jediná hodnota „Vyberie sa
    // v konfigurátore"). HTML5 required validácia by inak padla,
    // pretože Shoptet pred ňu vkladá `<option value="">Vyberte
    // príplatek</option>` ktorý je defaultne zvolený.
    const realOptions = Array.from(sel.querySelectorAll("option")).filter(
      (o) => o.getAttribute("value") && o.getAttribute("value") !== "",
    );
    if (realOptions.length === 1) {
      matchedCount++;
      const opt = realOptions[0];
      if (sel.value !== opt.value) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        changed = true;
      }
      return;
    }

    const value = resolveValue(name, state);
    if (value === null) return;
    // hodnota, ktorú admin ešte nemá (napr. nová farba) -> „Vyberie sa v konfigurátore“, nech košík neodmietne povinný príplatok
    const option = findMatchingOption(sel, value) || najdiZastupnuMoznost(sel);
    if (option) {
      matchedCount++;
      if (sel.value !== option.value) {
        sel.value = option.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        changed = true;
      }
    }
  });

  return { totalSelects: allSelects.length, matchedCount, changed };
}
