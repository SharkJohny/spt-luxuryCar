import { parseTruckOrderSummary } from "../truck-konfigurator/order-summary.mjs";
import { getShoptetContext } from "../functions/shoptetContext.js";
import { lcdRozpis, lcdRozpisEl } from "../functions/kosikRozpis.js";

export function initCart(texts) {
  console.log("Initializing cart with texts:", texts);
  console.log("Cart initialized");
  changeDescription();
  if (document.body && document.body.classList.contains("in-kosik")) lcdBublinaMimoTlacidla();

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

    // kontrola kupónu LUX10 odstránená (Michal 10. 10. 2026: kupón nemá fungovať; doplnok Zľavové kupóny nie je aktívny)
    document.addEventListener("ShoptetDOMContentLoaded", function () {
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

/* Zástupné texty selectov konfigurátora (cars.js cstm_*, „Typ auta“; configuratorEngine.js lcdPlaceholders) —
   v košíku nie sú údaj o aute („Značka: Značka, Rok: Rok výroby“; tablet 8. 10. 2026). */
export const LCD_AUTO_ZASTUPNE = ["Značka", "Model", "Rok výroby", "Typ auta", "Ročník", "Typ",
  "Prosím, vyberte značku vozidla", "Prosím,vyberte model vozidla", "Prosím,vyberte rok výroby vozidla"];
export function lcdAutoHodnota(v) {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/\s+/g, " ").trim();
  if (!t || t === "undefined" || t === "null" || LCD_AUTO_ZASTUPNE.indexOf(t) !== -1) return null;
  return t;
}
/* Položka: v košíku riadok tabuľky (tr), v rekapitulácii krokov objednávky div.cart-item v .cart-items (Michal 10. 10.
   2026: v pokladni ostávala farba vrstiev v zlatom názve veľkými písmenami, lebo closest("tr") nič nenašiel). */
const LCD_POLOZKA = "tr, body.ordering-process .cart-items .cart-item";
/* CZ košík: variant je „Barva 1.vrstvy: …“, SK „Farba 1.vrstvy: …“ — popis podľa jazyka webu */
const lcdCz = () => /^cs/i.test(document.documentElement.lang || "") || /\.cz$/i.test(location.hostname);
const lcdVrstva = (n) => (lcdCz() ? "Barva " : "Farba ") + n + ". vrstvy: ";
/* príplatky „názov - hodnota, názov - hodnota“: deliť len na čiarke, za ktorou ide ďalší „názov - “ alebo „názov:“
   (hodnota „prvý, druhý a tretí rad“ má čiarku vo vnútri) */
const lcdDelPriplatky = (t) => String(t).split(/,\s*(?=[^,]*(?:\s[-–]\s|:))/);

/* Rozpis položky (Michal 9. 10. 2026: košík ako náhľad v hlavičke): farby vrstiev a príplatky po riadkoch
   (functions/kosikRozpis.js — rovnaké delenie ako panel košíka), auto zo sessionStorage navrch. Zoznam ide hneď ZA odkaz
   s názvom (nie do neho); natívne spany ostávajú so surovým textom, len skryté (číta ho ponuka k setu). */
function lcdVlozRozpis(zdroje, riadky) {
  const prvy = zdroje[0];
  const a = prvy.closest("a");
  const kotva = a || prvy;
  const stary = kotva.nextElementSibling;
  if (stary && stary.classList.contains("lcd-rozpis")) stary.remove();
  kotva.after(lcdRozpisEl(document, riadky, "lcd-rozpis"));
  zdroje.forEach((e) => e.classList.add("lcd-rozpis-zdroj"));
}

/* Bublina chatu Luxia (76 × 76 vpravo dole) ležala na „Pokračovať“ (Michal, iPhone 9. 10. 2026): kým by ho prekryla,
   ustúpi; otvorený chat (vyšší ako bublina) sa neskrýva nikdy. */
function lcdBublinaMimoTlacidla() {
  const H = document.documentElement;
  const krok = function () {
    const f = document.querySelector('iframe[title="Luxia chat"]');
    // „Pokračovať“ aj tlačidlá ponuky k setu („Pridať do setu“ / „Vybrať veľkosť“ sú na mobile vpravo pod bublinou)
    const tl = document.querySelectorAll("#continue-order-button, #lcd-doplnok .lcd-dop__pridat, #lcd-doplnok .lcd-dop__vybrat");
    let skry = false, bublina = false;
    if (f) {
      const x = f.getBoundingClientRect();
      // bublina (nie otvorený chat): pri lište dole ju CSS zdvihne nad lištu (_lcdKosik.scss .lcd-kosik-bublina)
      bublina = x.height > 0 && x.height <= 130;
      if (bublina) {
        skry = Array.prototype.some.call(tl, function (b) {
          const y = b.getBoundingClientRect();
          return y.height > 0 && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top;
        });
      }
    }
    if (H.classList.contains("lcd-kosik-bez-bubliny") !== skry) H.classList.toggle("lcd-kosik-bez-bubliny", skry);
    if (H.classList.contains("lcd-kosik-bublina") !== bublina) H.classList.toggle("lcd-kosik-bublina", bublina);
  };
  addEventListener("scroll", krok, { passive: true });
  addEventListener("resize", krok);
  setInterval(krok, 1000);
  krok();
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
    return jeKamionovyRiadok($(this).closest(LCD_POLOZKA).text());
  }).length;

  // Fallback pre samostatne produkty BEZ surcharges (Premium/Klasik kufrove rohoze):
  // formatuj span.main-link-variant na bullety "Farba 1./2. vrstvy".
  $(LCD_POLOZKA).each(function () {
    var $row = $(this);
    if ($row.find("span.main-link-surcharges").length) return; // ma surcharges, riesi nizsie
    var $variant = $row.find("span.main-link-variant").first();
    if (!$variant.length || $variant.data("lcdFormatted")) return;
    var riadky = lcdRozpis({ variant: $variant.text(), priplatky: "", cz: lcdCz() });
    if (!riadky.length) return;
    lcdVlozRozpis([$variant[0]], riadky);
    $variant.data("lcdFormatted", true);
  });

  $("span.main-link-surcharges").each(function () {
    const $tr = $(this).closest(LCD_POLOZKA);
    if (!jeKamionovyRiadok($tr.text())) {
      // osobné autá: rozpis ako v paneli košíka; kamión ide pôvodnou cestou nižšie (skupiny z truckOrderSummary)
      if (this.classList.contains("lcd-rozpis-zdroj")) return;
      const $variant = $tr.find("span.main-link-variant").first();
      const riadky = lcdRozpis({ variant: $variant.text(), priplatky: $(this).text(), cz: lcdCz() });
      const auto = [getBrand, getModel, getYear, getCarType].map(lcdAutoHodnota).filter(Boolean).join(" ");
      if (auto && riadky.length) riadky.unshift({ n: "Auto", h: auto });
      if (riadky.length) lcdVlozRozpis($variant.length ? [this, $variant[0]] : [this], riadky);
      return;
    }
    const text = lcdDelPriplatky($(this).text());
    // Truck produkt: vozidlo NIE je v sessionStorage (tú plní autokoberce
    // konfigurátor), ale v surcharge parametri "Vozidlo: <značka model>".
    const isTruckRow = jeKamionovyRiadok($(this).closest(LCD_POLOZKA).text());
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
      value = lcdAutoHodnota(value);
      if (!value) return;
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
    var $variant = $(this).closest(LCD_POLOZKA).find("span.main-link-variant").first();
    var variantText = ($variant.text() || "").replace(/\s+/g, " ");
    var m1 = variantText.match(/(?:farba|barva)\s*1\.?\s*vrstvy\s*:\s*([^,]+)/i);
    var m2 = variantText.match(/(?:farba|barva)\s*2\.?\s*vrstvy\s*:\s*(.+)$/i);
    if (m1) $("<li>").text(lcdVrstva(1) + m1[1].trim()).appendTo(model);
    if (m2) $("<li>").text(lcdVrstva(2) + m2[1].trim()).appendTo(model);
    // variant schovať len keď farba prešla do odrážok (inak by zmizla úplne — CZ „Barva“ predtým)
    if (m1 || m2) $variant.hide();
    $("<span>").html(newText).appendTo(setup);
    $(this).html(infowrap);

    // $(this).html(newText);
  });
}

