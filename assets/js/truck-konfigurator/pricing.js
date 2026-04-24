/**
 * Truck konfigurátor – cenová logika DRIVEN BY SHOPTET DOM.
 *
 * Ceny príplatkov sa čítajú LIVE z `<select data-parameter-id>` elementov,
 * ktoré Shoptet vykresľuje na stránke produktu. Žiadna cena NIE JE hardcoded
 * v tomto súbore – keď si admin v Shoptete upraví cenu v príplatkovom
 * parametri (alebo príde nový `productsComplete.xml` feed), konfigurátor
 * ju pri najbližšom rendere automaticky premietne.
 *
 * Tok:
 *   Shoptet produkt (test-truck.xml → Shoptet admin)
 *     └─ vykreslí <select data-parameter-name="Materiál">
 *        └─ option: "Prémiová syntetická koža – prešívaná +10 €"
 *            └─ readShoptetSurcharges() text → { price: 10, clean: "Prémiová..." }
 *               └─ calculatePrice(state) mapuje state.selectedMaterial
 *                   na option text a vracia jeho cenu.
 *
 * Base PRICE (<PRICE>199</PRICE>) tiež čítame z DOMu:
 *   <meta itemprop="price"> alebo <meta property="product:price:amount">.
 *
 * Ak produkt v DOMe nie je (napr. čistý standalone /test-truck/ bez
 * Shoptet produktu), ceny spadnú na 0 a panel to zobrazí tak ako je
 * – developer hneď vidí „nie sú napojené parametre".
 */

// ============================================================
// Parsovanie ceny z textu Shoptet option-u
// ============================================================

/**
 * Zhoduje sa s koncovým „+10 €", „+ 59 Kč", „-15 EUR", „+1 200,50 Kč" atď.
 * Shoptet v štandardnom template vkladá cenu na koniec textu option-u.
 */
const PRICE_SUFFIX_RE = /\s*([+\-])\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(Kč|€|EUR|CZK)\s*$/i;

/** Textový znak meny → kód meny. */
function normalizeCurrency(sym) {
  if (!sym) return null;
  const s = sym.trim().toUpperCase();
  if (s === "KČ" || s === "CZK") return "CZK";
  if (s === "€" || s === "EUR") return "EUR";
  return s;
}

/**
 * Z textu option-u vytiahne cenu a vráti „čistý" názov bez suffix-u.
 * Príklad: „Prémiová koža – prešívaná +10 €" → { price: 10, clean: "Prémiová…", currency: "EUR" }
 */
export function parseOptionPrice(text) {
  if (!text) return { price: 0, clean: "", currency: null };
  const trimmed = String(text).trim();
  const m = trimmed.match(PRICE_SUFFIX_RE);
  if (!m) return { price: 0, clean: trimmed, currency: null };
  const sign = m[1] === "-" ? -1 : 1;
  const num = parseFloat(m[2].replace(/\s+/g, "").replace(",", "."));
  const price = Number.isFinite(num) ? sign * num : 0;
  const clean = trimmed.slice(0, m.index).trim();
  return { price, clean, currency: normalizeCurrency(m[3]) };
}

// ============================================================
// Čítanie z DOMu
// ============================================================

/**
 * Naskenuje všetky Shoptet príplatkové <select>-y a postaví:
 *   { "Materiál": { "Prémiová koža – prešívaná": 10, ... }, ... }
 * + najčastejšia mena zo všetkých option-ov (podľa prvého výskytu).
 */
export function readShoptetSurcharges() {
  const map = {};
  let currency = null;

  if (typeof document === "undefined") return { map, currency };

  const selects = document.querySelectorAll(
    "select[data-parameter-id][data-parameter-name]",
  );

  selects.forEach((sel) => {
    const paramName = String(sel.dataset.parameterName || "").trim();
    if (!paramName) return;
    const options = sel.querySelectorAll("option[value]");
    if (!options.length) return;
    const bucket = (map[paramName] = {});
    options.forEach((opt) => {
      const { price, clean, currency: c } = parseOptionPrice(opt.textContent);
      if (!clean) return;
      bucket[clean] = price;
      if (!currency && c) currency = c;
    });
  });

  return { map, currency };
}

/**
 * Základnú cenu produktu (PRICE) berieme z Shoptet meta tagov.
 * Shoptet vkladá <meta property="product:price:amount" content="199">
 * a/alebo <meta itemprop="price" content="199">. Ak ani jeden nie je,
 * vrátime 0 (+ info v UI, že produkt nie je na stránke).
 */
export function readShoptetBasePrice() {
  if (typeof document === "undefined") return { price: 0, currency: null };
  const el =
    document.querySelector('meta[itemprop="price"]') ||
    document.querySelector('meta[property="product:price:amount"]');
  if (!el) return { price: 0, currency: null };
  const raw = el.getAttribute("content");
  const v = parseFloat(String(raw).replace(/\s+/g, "").replace(",", "."));
  const currencyEl =
    document.querySelector('meta[itemprop="priceCurrency"]') ||
    document.querySelector('meta[property="product:price:currency"]');
  const currency = currencyEl
    ? normalizeCurrency(currencyEl.getAttribute("content"))
    : null;
  return { price: Number.isFinite(v) ? v : 0, currency };
}

// ============================================================
// Mapovanie state konfigurátora ↔ Shoptet parameter
// ============================================================

/**
 * Jeden riadok v ceníku = jeden Shoptet príplatkový parameter.
 *   matcher   – vyberie Shoptet parameter podľa jeho `data-parameter-name`
 *   getOption – zo stavu konfigurátora vráti text option-u, ktorý v Shoptete
 *               hľadáme (alebo null, ak ešte nič nevybral)
 *   label     – hezký label do PriceBreakdown panelu
 *
 * `matcher` je zámerne fuzzy – Shoptet admin môže parameter pomenovať
 * „Materiál" / „MATERIAL" / „Druh materiálu"… všetko to tu chytíme.
 */
/**
 * Mapovanie Shoptet `data-parameter-name` (= SHORT_NAME z XML feedu)
 * na cenotvorné riadky konfigurátora.
 *
 * Pozri test-truck.xml – Shoptet do `data-parameter-name` dosadí
 * `<SHORT_NAME>` (nie `<NAME>`). Preto matche musia sedieť na shortnames:
 *   • "Materiál"        ← <SHORT_NAME>Materiál</SHORT_NAME>
 *   • "Nášivky"         ← <SHORT_NAME>Nášivky</SHORT_NAME>      (umiestnenie)
 *   • "Tapacír"         ← <SHORT_NAME>Tapacír</SHORT_NAME>
 *   • "Nášivka dvere"   ← <SHORT_NAME>Nášivka dvere</SHORT_NAME>
 *
 * Strict equality (s diakritickou toleranciou) – pretože v DOMe sú
 * aj informatívne parametre s podobnými názvami (napr. "Nášivka" =
 * druh nášivky, BEZ ceny). Fuzzy matching by ich falošne trefil.
 *
 * Ak admin v Shoptete premenuje SHORT_NAME, panel zobrazí
 * "⚠ parameter nie je v Shoptete" a vieš presne, ktorý matcher upraviť.
 */
const eq = (...variants) => (n) => {
  const t = String(n || "").trim().toLowerCase();
  return variants.some((v) => v.toLowerCase() === t);
};

const PRICING_LINES = [
  {
    key: "material",
    // Iba "Materiál" / "Material" – NIE "Materiál dvere" (informatívny).
    matcher: eq("Materiál", "Material"),
    getOption: (s) => s.selectedMaterial || null,
    label: (opt) => (opt ? `Materiál: ${opt}` : "Materiál (nevybrané)"),
  },
  {
    key: "nasivky_placement",
    // Plurál "Nášivky" – NIE singular "Nášivka" (= druh, bez ceny)
    // a NIE "Nášivka dvere" (= door panel nášivka, iný riadok).
    matcher: eq("Nášivky", "Nasivky"),
    getOption: (s) => {
      if (!s.nasivkyPlacement) return null;
      return (
        {
          nechcem: "Bez nášiviek",
          stred: "Len stred",
          boky: "Šofér + spolujazdec",
          "boky+stred": "Šofér + spolujazdec + stred (BUNDLE)",
        }[s.nasivkyPlacement] || null
      );
    },
    label: (opt) => (opt ? `Nášivky: ${opt}` : "Nášivky (nevybrané)"),
  },
  {
    key: "door_panel",
    matcher: eq("Tapacír", "Tapacir"),
    getOption: (s) => {
      if (s.doorPanelChoice === "ano") {
        return "Áno chcem (v konfigurátore – bundle)";
      }
      if (s.doorPanelChoice === "nie") return "Nie nechcem tapacír dverí";
      return null;
    },
    label: (opt) => (opt ? `Tapacír dverí: ${opt}` : null),
  },
  {
    key: "door_nasivka",
    // Iba "Nášivka dvere" (yes/no s cenou) – NIE "Nášivka dvere druh"
    // (= druh nášivky na dverách, informatívny bez ceny).
    matcher: eq("Nášivka dvere", "Nasivka dvere"),
    getOption: (s) => {
      if (s.doorPanelChoice !== "ano") return null;
      if (s.doorWantsNasivka === true) return "Áno chcem nášivku na dverách";
      if (s.doorWantsNasivka === false) return "Nie nechcem nášivku na dverách";
      return null;
    },
    label: (opt) => (opt ? `Nášivka na dverách: ${opt}` : null),
  },
];

// ============================================================
// Hľadanie ceny v DOM-mape (robustné voči zmenám textu)
// ============================================================

function findOptionPrice(bucket, needle) {
  if (!bucket || !needle) return null;
  if (needle in bucket) return bucket[needle];
  const nl = String(needle).trim().toLowerCase();
  for (const k of Object.keys(bucket)) {
    if (k.toLowerCase() === nl) return bucket[k];
  }
  for (const k of Object.keys(bucket)) {
    const kl = k.toLowerCase();
    if (kl.includes(nl) || nl.includes(kl)) return bucket[k];
  }
  return null;
}

function findMatchingParamName(map, matcher) {
  for (const name of Object.keys(map)) {
    if (matcher(name)) return name;
  }
  return null;
}

// ============================================================
// Formátovanie
// ============================================================

/**
 * Formátuje sumu s menou. Mena sa prenáša z readShoptet…() – ak nič,
 * default EUR (ceník je v €).
 *
 * Ponechávame názov `formatEur` pre spätnú kompatibilitu s komponentami
 * (PriceBreakdown, alert v konfigurátore); mena je voliteľná 2. parameter.
 */
export function formatEur(amount, currency = "EUR") {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const rounded = Math.round(amount * 100) / 100;
  const sym = currency === "CZK" ? "Kč" : "€";
  return `${rounded} ${sym}`;
}

// ============================================================
// Hlavný vstup pre konfigurátor
// ============================================================

/**
 * Prepočíta celkovú cenu na základe DOM stavu Shoptetu.
 *
 * @param {object} s – state konfigurátora (selectedMaterial, nasivkyPlacement, …)
 * @returns {{
 *   total: number,
 *   standaloneTotal: number,
 *   savings: number,
 *   currency: "EUR"|"CZK"|string,
 *   lines: Array<{ key, label, price, active, note?: string }>,
 *   shoptet: { paramsFound: number, paramsMatched: number, basePriceFromDom: boolean },
 * }}
 */
export function calculatePrice(s) {
  const { map: surchargeMap, currency: surchargeCurrency } = readShoptetSurcharges();
  const { price: basePrice, currency: baseCurrency } = readShoptetBasePrice();
  const currency = baseCurrency || surchargeCurrency || "EUR";

  const lines = [];
  let paramsMatched = 0;
  const paramsFound = Object.keys(surchargeMap).length;

  // BOD 1 – Základ. Berieme zo Shoptet meta tagu. Ak produkt nie je
  // na stránke, basePrice=0 a label to povie.
  lines.push({
    key: "base",
    label: basePrice > 0 ? "Autokoberce (základ)" : "Autokoberce (produkt nenájdený v DOM)",
    price: basePrice,
    active: true,
  });

  for (const line of PRICING_LINES) {
    const optText = line.getOption(s);
    const label = line.label(optText);
    if (!label) continue; // riadok nechceme zobraziť

    const paramName = findMatchingParamName(surchargeMap, line.matcher);
    let price = 0;
    let note = null;

    if (paramName && optText) {
      const found = findOptionPrice(surchargeMap[paramName], optText);
      if (found !== null) {
        price = found;
        paramsMatched++;
      } else {
        note = "nenájdená hodnota v Shoptete";
      }
    } else if (!paramName && optText) {
      note = "parameter nie je v Shoptete";
    }

    lines.push({
      key: line.key,
      label,
      price,
      active: Boolean(optText),
      note,
    });
  }

  const total = lines.reduce((sum, l) => sum + (l.active ? l.price : 0), 0);

  return {
    total,
    // Zatiaľ nemáme „standalone" ceny zo Shoptetu – dávame rovnaký total,
    // aby PriceBreakdown nevyhadzoval „ušetríte X €" keď to nevieme.
    standaloneTotal: total,
    savings: 0,
    currency,
    lines,
    shoptet: {
      paramsFound,
      paramsMatched,
      basePriceFromDom: basePrice > 0,
    },
  };
}
