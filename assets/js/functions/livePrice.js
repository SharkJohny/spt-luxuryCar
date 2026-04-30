/**
 * Živý prepočet zobrazenej ceny na produktovom detaile podľa vybraných
 * surcharge parametrov.
 *
 * Shoptet natívne updatuje `.price-final-holder` len pri zmene **varianty**
 * (parameter s `data-parameter-id` na `<select class="variant-parameter">`).
 * Príplatky (`<select class="surcharge-parameter">`) sa premietnu až v košíku,
 * takže klient na detaile vidí stále základnú cenu — to klient hlási ako
 * „cena sa nemení pri výbere ohrožíku kufra / TYPu / koberca do kufru".
 *
 * Riešenie: posluchač na všetkých surcharge selectoch sčíta
 * `data-surcharge-final-price` (fallback `data-surcharge-additional-price`)
 * vybraných options a pripočíta ich k base cene. Po Shoptet evente
 * `ShoptetVariantChanged` sa base cena re-readne (Shoptet ju mohol prepísať)
 * a sumár príplatkov sa opätovne aplikuje.
 */

const PRICE_HOLDER_SEL = ".price-final-holder.calculated, .price-final-holder";
let basePrice = null;

function readNumber($opt, attr) {
  const v = Number($opt.attr(attr));
  return Number.isFinite(v) ? v : 0;
}

function getSurchargeSum() {
  let sum = 0;
  $("select.surcharge-parameter").each(function () {
    const $sel = $(this);
    const val = $sel.val();
    if (!val || val === "0") return;
    const $opt = $sel.find("option:selected");
    if (!$opt.length) return;
    const final = readNumber($opt, "data-surcharge-final-price");
    const additional = readNumber($opt, "data-surcharge-additional-price");
    sum += final > 0 ? final : additional;
  });
  return sum;
}

function readBasePriceFromDom() {
  const $holder = $(PRICE_HOLDER_SEL).first();
  if (!$holder.length) return null;
  // 1) data-price atribút (najspoľahlivejší – Shoptet ho updatuje pri varianttom switchi)
  const dataPrice = Number($holder.attr("data-price"));
  if (Number.isFinite(dataPrice) && dataPrice > 0) return dataPrice;
  // 2) fallback – číselne z textu (odstránime všetko okrem číslic, čiarok, bodiek)
  const txt = ($holder.text() || "").replace(/[^\d,.\s]/g, "").trim();
  const normalized = txt.replace(/\s+/g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function formatPrice(value) {
  // Použijeme shoptet config (rovnaký separator ako Shoptet sám)
  const cfg = (window.shoptet && window.shoptet.config) || {};
  const thousandSep = cfg.thousandSeparator || " ";
  const currency = cfg.currencySymbol || "Kč";
  const left = cfg.currencySymbolLeft === "1" || cfg.currencySymbolLeft === 1;
  const decPlaces = parseInt(cfg.decPlaces, 10);
  const decimals = Number.isFinite(decPlaces) ? decPlaces : 0;
  const decSep = cfg.decSeparator || ",";

  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  const numStr = decPart ? intWithSep + decSep + decPart : intWithSep;
  return left ? currency + " " + numStr : numStr + " " + currency;
}

function applyLivePrice() {
  if (basePrice == null) basePrice = readBasePriceFromDom();
  if (basePrice == null) return;
  const surcharge = getSurchargeSum();
  const total = basePrice + surcharge;
  const $holder = $(PRICE_HOLDER_SEL).first();
  if (!$holder.length) return;
  // Zachováme štruktúru – len prepíšeme text price
  // (Shoptet drží symbol v rovnakom node, takže nahradíme celý obsah).
  $holder.text(formatPrice(total));
  // Vlastný event, ak by chcel niekto reagovať (napr. ďalšie UI bloky)
  document.dispatchEvent(new CustomEvent("LuxuryCarPriceRecalculated", {
    detail: { basePrice, surcharge, total },
  }));
}

export function initLivePrice() {
  if (!$(PRICE_HOLDER_SEL).length) return; // nie sme na detaile
  if (!$("select.surcharge-parameter").length) return; // nič na sčítanie

  basePrice = readBasePriceFromDom();

  // Posluchače na zmenu surcharge selectov (delegovane na document, lebo
  // niektoré bloky sa môžu rendrovať dodatočne)
  $(document).on("change", "select.surcharge-parameter", applyLivePrice);

  // Pri zmene varianty Shoptet prepíše .price-final-holder vrátane data-price.
  // Re-readneme base a opäť aplikujeme surcharge sum.
  document.addEventListener("ShoptetVariantChange", function () {
    setTimeout(function () {
      basePrice = readBasePriceFromDom();
      applyLivePrice();
    }, 50);
  });

  // Prvotná aplikácia – ak má niektorý select už pred-vyplnenú hodnotu
  applyLivePrice();
}
