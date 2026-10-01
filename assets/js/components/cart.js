import { parseTruckOrderSummary } from "../truck-konfigurator/order-summary.mjs";
import { getShoptetContext } from "../functions/shoptetContext.js";

export function initCart(texts) {
  console.log("Initializing cart with texts:", texts);
  console.log("Cart initialized");
  changeDescription();

  // Michal req 2026-05-18: po zmene/zmazani produktu v kosiku Shoptet AJAX-om
  // prekresli obsah — span.main-link-surcharges sa vyrenderuje surovy a
  // changeDescription() (formator priplatkovych parametrov) sa uz nespusti,
  // co rozhodi format. Riesenie: po ShoptetCartUpdated evente spravit reload.
  // ShoptetCartUpdated sa emituje IBA pri AJAX zmene kosika (nie pri page load),
  // takze reload je bezpecny — guard flag pre istotu proti loop-u.
  if (!window.__lcdCartReloadBound) {
    window.__lcdCartReloadBound = true;
    document.addEventListener("ShoptetCartUpdated", function () {
      if (window.__lcdCartReloading) return;
      window.__lcdCartReloading = true;
      location.reload();
    });
  }
  if ($(".id--9")[0]) {
    $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
    $(".p-label:contains(Cena za m. j.)").text("Cena za set");

    chechCupon(texts);
    document.addEventListener("ShoptetDOMContentLoaded", function () {
      chechCupon(texts);
      $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
      $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    });

    $("button.btn.btn-secondary").click(function () {
      $(".messages").hide();
    });
  }
  const wheelPosition = sessionStorage.getItem("wheelPosition");
  const seatPosition = sessionStorage.getItem("seatPosition");
  const doorPosition = sessionStorage.getItem("doorPosition");
  $(
    `<input type="text" value="` +
      wheelPosition +
      `" id="varchar1" name="varchar1" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
  $(
    `<input type="text" value="` +
      seatPosition +
      `" id="varchar2" name="varchar2" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
  $(
    `<input type="text" value="` +
      doorPosition +
      `" id="varchar3" name="varchar3" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
}

/**
 * Je tento riadok kosika kamionovy produkt?
 *
 * Povodne stacilo slovo "truck" v texte riadku. Michal 2026-09-01 produkt
 * premenoval (SK "luxusne autokoberce do kamionov", CZ "do kamionu"), slovo
 * truck zmizlo a kosik prestal riadok formatovat. Berieme obe pomenovania.
 */
function jeKamionovyRiadok(text) {
  const t = String(text || "");
  return /\btruck\b/i.test(t) || /kami[oó]n/i.test(t);
}

function changeDescription() {
  const getBrand = sessionStorage.getItem("Brand");
  const getModel = sessionStorage.getItem("Model");
  const getYear = sessionStorage.getItem("Year");
  const getCarType = sessionStorage.getItem("carType");
  console.log("Changing description for cart items");

  let truckSummary = "";
  try {
    truckSummary = sessionStorage.getItem("truckOrderSummary") || "";
  } catch (e) {
    // Storage môže byť v súkromnom režime nedostupné; použije sa pôvodný výpis.
  }
  const truckRowCount = $("span.main-link-surcharges").filter(function () {
    return jeKamionovyRiadok($(this).closest("tr").text());
  }).length;

  // Fallback pre samostatne produkty BEZ surcharges (Premium/Klasik kufrove rohoze):
  // formatuj span.main-link-variant na bullety "Farba 1./2. vrstvy".
  $("tr").each(function () {
    var $row = $(this);
    if ($row.find("span.main-link-surcharges").length) return; // ma surcharges, riesi nizsie
    var $variant = $row.find("span.main-link-variant").first();
    if (!$variant.length || $variant.data("lcdFormatted")) return;
    var variantText = ($variant.text() || "").replace(/\s+/g, " ");
    if (!/farba\s*[12]\.?\s*vrstvy/i.test(variantText)) return;
    var m1 = variantText.match(/farba\s*1\.?\s*vrstvy\s*:\s*([^,]+?)(?=\s*farba\s*2|\s*$)/i);
    var m2 = variantText.match(/farba\s*2\.?\s*vrstvy\s*:\s*(.+)$/i);
    if (!m1 && !m2) return;
    var $ul = $("<ul>").addClass("lcd-variant-bullets");
    if (m1) $("<li>").text("Farba 1. vrstvy: " + m1[1].trim()).appendTo($ul);
    if (m2) $("<li>").text("Farba 2. vrstvy: " + m2[1].trim()).appendTo($ul);
    $variant.after($ul).hide();
    $variant.data("lcdFormatted", true);
  });

  $("span.main-link-surcharges").each(function () {
    const text = $(this).text().split(",");
    // Truck produkt: vozidlo NIE je v sessionStorage (tú plní autokoberce
    // konfigurátor), ale v surcharge parametri "Vozidlo: <značka model>".
    const isTruckRow = jeKamionovyRiadok($(this).closest("tr").text());
    if (isTruckRow && truckSummary && truckRowCount === 1) {
      const groups = parseTruckOrderSummary(truckSummary);
      if (groups.length) {
        const $summary = $("<div>").addClass("lcd-truck-cart-summary");
        groups.forEach(function (group) {
          const $group = $("<section>").addClass("lcd-truck-cart-summary__group").appendTo($summary);
          $("<h4>").text(group.heading).appendTo($group);
          const $list = $("<dl>").appendTo($group);
          group.items.forEach(function (item) {
            $("<dt>").text(item.label).appendTo($list);
            $("<dd>").text(item.value).appendTo($list);
          });
        });
        $(this).empty().append($summary);
        return;
      }
    }
    let truckVehicle = null;
    let newText = "";
    if (text.length > 1) {
      newText += "<ul>";
      $(text).each(function () {
        if (this.includes("TYP")) return;
        const item = String(this).replace(/P[rř][ií]platky:\s*/gi, "").trim();
        // "Vozidlo" u trucku vytiahni hore k modelu (nie medzi príplatky).
        // Shoptet oddeľuje názov a hodnotu ":" alebo "-".
        if (isTruckRow && /^Vozidlo\s*[-–:]/i.test(item)) {
          truckVehicle = item.replace(/^Vozidlo\s*[-–:]\s*/i, "");
          return;
        }
        // Placeholder hodnoty informačných parametrov trucku sú pre
        // zákazníka bezvýznamné — skry ich.
        if (isTruckRow && /Vyberie sa v konfigurátore/i.test(item)) return;
        newText += "<li>" + item + "</li>";
      });
      newText += "</ul>";
    }
    console.log(text);
    const infowrap = $("<div>").addClass("info-wrap");
    const model = $("<ul>").addClass("model").appendTo(infowrap);
    const setup = $("<div>").addClass("setup").appendTo(infowrap);
    // Riadok pridaj LEN keď má skutočnú hodnotu — "Značka: undefined" u
    // produktov bez auto-konfigurátora (truck, vzorkovník) nemá čo robiť.
    const addLine = (label, value) => {
      if (!value || value === "undefined" || value === "null") return;
      $("<li>").text(label + ": " + value).appendTo(model);
    };
    if (isTruckRow) {
      // Skutočnú značku+model ukladá truck konfigurátor do sessionStorage
      // (Shoptet select "Vozidlo" má len placeholder hodnotu). Fallback:
      // hodnota zo surcharge textu, ak by storage chýbala.
      let ssVehicle = null;
      try { ssVehicle = sessionStorage.getItem("truckVehicle"); } catch (e) { /* private mode */ }
      if (truckVehicle && /Vyberie sa v konfigurátore/i.test(truckVehicle)) truckVehicle = null;
      addLine("Vozidlo", ssVehicle || truckVehicle);
    } else {
      addLine("Značka", getBrand);
      addLine("Model", getModel);
      addLine("Rok", getYear);
      addLine("Typ", getCarType);
    }
    // Farba 1. a 2. vrstvy z variantu (span.main-link-variant) - nad priplatkami.
    var $variant = $(this).closest("tr").find("span.main-link-variant").first();
    var variantText = ($variant.text() || "").replace(/\s+/g, " ");
    var m1 = variantText.match(/farba\s*1\.?\s*vrstvy\s*:\s*([^,]+)/i);
    var m2 = variantText.match(/farba\s*2\.?\s*vrstvy\s*:\s*(.+)$/i);
    if (m1) $("<li>").text("Farba 1. vrstvy: " + m1[1].trim()).appendTo(model);
    if (m2) $("<li>").text("Farba 2. vrstvy: " + m2[1].trim()).appendTo(model);
    $variant.hide();
    $("<span>").html(newText).appendTo(setup);
    $(this).html(infowrap);

    // $(this).html(newText);
  });
}

function chechCupon(texts) {
  console.log(texts);
  console.log("Checking coupon code in cart -----------------------");
  const getCode = getShoptetContext().cartInfo?.discountCoupon?.code || "";
  let chechCupon = false;
  if (getCode == "LUX10") {
    console.log("Checking coupon code:", getCode);
    $(".main-link-surcharges").each(function () {
      const $this = $(this);
      if (
        $this.text().includes("Farba boxov ") ||
        $this.text().includes("autokoberce do kufru - Jednoduché") ||
        $this.text().includes("Kompletní ochrana")
      ) {
        console.log("Coupon found in surcharge:", $this.text());
        chechCupon = true;
      }
    });
    // $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }

  if (!chechCupon) {
    if (!$(".alert.alert-warning")[0] && getCode == "LUX10") {
      setTimeout(function () {
        $(".cart-summary").before('<div class="alert alert-warning" role="alert">' + texts.cupon_message + "</div>");
      }, 1000);
    }
    console.log("Coupon code is not valid, applying changes");
    $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }
}
