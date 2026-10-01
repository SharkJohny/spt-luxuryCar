import { optionData } from "./option.js";
import { intIndex } from "./components/index.js";
import { initProduct } from "./components/productPage.js";
import { stickyPhotos } from "./functions/stickyphotos.js";
import { errorToCart } from "./functions/errorToCart.js";
import { initHeader } from "./components/header.js";
import { initVideoPlayAgain } from "./functions/video-play-again.js";
import { initCart } from "./components/cart.js";
import { validation } from "./functions/validation.js";
import { initConfiguratorEngine } from "./functions/configuratorEngine.js";
import { initLivePrice } from "./functions/livePrice.js";
import { initContactForm } from "./components/contactForm.js";
import "./seo-runtime.js"; // SEO Fáza A — runtime inject (JSON-LD, hreflang, H1, etc.)
import "./configurator-enhance.js"; // Konfigurátor — best-seller badge na možnostiach
import "./lcdHome.js";
import "./lcdHdr.js"; // Nova uvodna stranka (lcd-home)
import "./lcdRz.js"; // Novy rozcestnik (lcd-rz)
import "./lcdLang.js"; // Prepinac jazyka vo vlajke (ponuka namiesto okamziteho prepnutia)
import { mergeTruckOrderSummaryIntoNote } from "./truck-konfigurator/order-summary.mjs";
import {
  TRUCK_BRANDS,
  TRUCK_FIELD_ORDER,
  TRUCK_PRODUCT_URLS,
  TRUCK_VEHICLES,
} from "./truck-konfigurator/truck-brands.js";

let setupData;

$.getJSON(optionData.downloadData, function (data) {
  setupData = data;

  console.log("setupData:", setupData);
  console.log("setupData.settings:", setupData.settings);
  console.log("setupData.cars:", setupData.cars);
  let language = dataLayer[0].shoptet.language;

  if (dataLayer[0].shoptet.projectId == 704436) {
    language = "cs";
  }
  const texts = setupData.language[language];
  console.log("setupData.language:", texts);
  initProduct(setupData, texts);
  initModelSelect(texts, setupData);
  googleReviews(setupData, texts);
  lcdVideos();

  addNote();
  validation(texts);
  initConfiguratorEngine();
  initLivePrice();
  initCart(texts);
  $(".config-wrap .parameter-wrap:eq(1)").addClass("noText");
  $(".config-wrap .parameter-wrap:eq(2)").addClass("noText");

  $(".config-wrap .parameter-wrap:eq(3)").addClass("noText");
});

const logoGoogle =
  '<svg viewBox="0 0 512 512" height="18" width="18"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path></g></svg>';

jQuery(document).ready(function ($) {
  // dinamicPictures();
  initHeader();

  intIndex();
  initSignpost();

  //stickyPhotos();
  // errorToCart();
  initVideoPlayAgain();
  initContactForm();

  setTimeout(() => {
    $("body").addClass("showBody");
  }, 500);
});

/**
 * Dynamically updates an image based on the visible section on the screen./..
 */
function dynamicPictures() {
  const sections = $(".text-block");
  const dynamicImage = $("#dynamic-image");
  const transitionDuration = 500; // Match this to the CSS transition duration

  /**
   * Updates the image based on the currently visible section.
   */
  function changeImage() {
    let currentSection = null;

    // Find the section currently in the middle of the viewport
    for (let i = 0; i < sections.length; i++) {
      const section = $(sections[i]);
      const rect = sections[i].getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;

      if (sectionTop <= window.innerHeight / 2 && sectionBottom >= window.innerHeight / 2) {
        currentSection = section;
        break;
      }
    }

    if (currentSection) {
      const newImageSrc = currentSection.data("picture");

      if (dynamicImage.attr("src") !== newImageSrc) {
        // Add transition effect
        dynamicImage.addClass("transition-out");

        setTimeout(() => {
          dynamicImage.attr("src", newImageSrc).removeClass("transition-out").addClass("transition-in");

          // Remove transition-in class after animation ends
          setTimeout(() => {
            dynamicImage.removeClass("transition-in");
          }, transitionDuration);
        }, transitionDuration);
      }
    }
  }

  // Optimize scrolling event with throttle
  let scrollTimeout = null;
  $(window).on("scroll", () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(changeImage, 100); // Adjust the debounce delay if necessary
  });

  changeImage(); // Run once on page load
}

function initModelSelect(texts) {
  const header = $("h1").text();
  if (header.includes("box")) return;

  let insertPosidion = ".in-index .content-wrapper.container:eq(1)";

  if ($(".in-rozcestnik")[0]) {
    insertPosidion = ".in-rozcestnik #Model-selecte";
  }
  if ($(".type-product")[0]) {
    insertPosidion = ".parameter-cars.wheel-Position";
  }
  // if ($(".id--9 ")[0]) {
  //   insertPosidion = ".cart-table";
  // }
  if ($("body.mobile")[0]) {
    if ($(".in-index")[0]) {
      insertPosidion = ".in-index .row.banners-content.body-banners";
    }
    if ($(".in-rozcestnik")[0]) {
      insertPosidion = ".in-rozcestnik #sets";
    }
    if ($(".type-product")[0]) {
      insertPosidion = ".parameter-cars.wheel-Position";
    }
  }

  let getBrand, getModel, getYear, getCarType;
  try {
    getBrand = sessionStorage.getItem("Brand");
    getModel = sessionStorage.getItem("Model");
    getYear = sessionStorage.getItem("Year");
    getCarType = sessionStorage.getItem("carType");
    // Ošetření "undefined"/"null" stringů uložených v sessionStorage
    if (!getBrand || getBrand === "undefined" || getBrand === "null") getBrand = null;
    if (!getModel || getModel === "undefined" || getModel === "null") getModel = null;
    if (!getYear || getYear === "undefined" || getYear === "null") getYear = null;
    if (!getCarType || getCarType === "undefined" || getCarType === "null") getCarType = null;
  } catch (e) {
    getBrand = null;
    getModel = null;
    getYear = null;
    getCarType = null;
  }

  const section = $("<section>", {
    id: "model-selector",
  });
  if ($("body.mobile")[0]) {
    $(section).prependTo(insertPosidion);
    if ($(".type-product")[0]) {
      $(section).insertAfter(insertPosidion);
    }
  } else {
    $(section).insertAfter(insertPosidion);
  }

  const container = $("<div>", {
    class: "model-selector container",
  }).appendTo(section);
  if ($(".in-index")[0]) {
    $("<h2>").text(texts.select_car_header).appendTo(container);
    $('<div class="prefix">' + texts.select_car_prefix + "</div>").appendTo(container);
  }
  const choiceWrap = $("<div>").addClass("modl-selector-wrap").appendTo(container);
  const znacka =
    `
        <div class="surcharge-list brands dm-selector">
            
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` +
    cstm_znacka[0] +
    `</option>
                </select>
            </div>
        </div>
        `;

  const model =
    `
        <div class="surcharge-list models dm-selector">
          
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` +
    cstm_model[0] +
    `</option>
                </select>
            </div>
        </div>
        `;

  const rocnik =
    `
        <div class="surcharge-list years dm-selector">
            
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` +
    cstm_rocnik[0] +
    `</option>
                </select>
            </div>
        </div>
        `;

  const type = `
        <div class="surcharge-list type-selector">
           
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>Typ auta</option>
                </select>
            </div>
        </div>
        `;

  const button = `<div class='btn choice-Model'>Zvolit model</div>`;

  if ($(".in-index")[0] || $(".in-rozcestnik")[0]) {
    $(znacka + model + rocnik + type + button).appendTo(choiceWrap);
  } else {
    $(znacka + model + rocnik + type).appendTo(choiceWrap);
  }

  const otherLabel = (typeof language !== "undefined" && language === "cs")
    ? "Jiné, prosím napište do poznámky"
    : "Iné, prosím napíšte do poznámky";
  const otherVariants = ["Jiné, prosím napište do poznámky", "Iné, prosím napíšte do poznámky"];

  const carVariantParts = setupData.settings.carVariant.split(",");
  // "Jiné" a "Prosím napište do poznámky" jsou v JSONu dvě části jedné položky — sloučíme je
  const carVariants = [];
  for (let i = 0; i < carVariantParts.length; i++) {
    const part = carVariantParts[i].trim();
    if (part === "Jiné" && carVariantParts[i + 1] && carVariantParts[i + 1].trim().startsWith("Prosím")) {
      i++;
      carVariants.push(otherLabel);
    } else {
      carVariants.push(part);
    }
  }
  carVariants.forEach(function (variant) {
    $("<option>").text(variant).appendTo(".type-selector .selector select");
  });

  if (getBrand != null) {
    console.log(getBrand);
    $("<option>" + getBrand + "</option>").prependTo(".surcharge-list.brands.dm-selector select");
    $(".surcharge-list.brands.dm-selector select").val(getBrand);
  }

  if (getModel != null && getBrand != null) {
    // Získej modely pro vybranou značku
    const models_for_brand = setupData.cars[getBrand];

    if (models_for_brand && Array.isArray(models_for_brand)) {
      // Přidej všechny modely do selectu
      for (let i = 0; i < models_for_brand.length; i++) {
        $("<option>" + models_for_brand[i] + "</option>").appendTo(".surcharge-list.models.dm-selector select");
      }

      // Nastav model vícekrát s různými časovými intervaly
      setTimeout(() => {
        console.log("Nastavuji model (600ms):", getModel);
        $(".surcharge-list.models.dm-selector select").val(getModel);
      }, 600);

      setTimeout(() => {
        console.log("Nastavuji model znovu (1200ms):", getModel);
        $(".surcharge-list.models.dm-selector select").val(getModel);
      }, 1200);

      setTimeout(() => {
        console.log("Poslední pokus o nastavení modelu (2000ms):", getModel);
        $(".surcharge-list.models.dm-selector select").val(getModel);
        console.log("Aktuální hodnota selectu:", $(".surcharge-list.models.dm-selector select").val());
      }, 2000);
    }
  }
  // Normalizace
  if (getYear && otherVariants.includes(getYear)) {
    getYear = otherLabel;
  }

  if (getYear != null) {
    $("<option>" + getYear + "</option>").prependTo(".surcharge-list.years.dm-selector select");
    $(".surcharge-list.years.dm-selector select").val(getYear);
  }
  if (getCarType != null) {
    $("<option>" + getCarType + "</option>").prependTo(".surcharge-list.type-selector select");
    $(".surcharge-list.type-selector select").val(getCarType);
  }

  const cars = setupData.cars;

  const numberOfBrands = Object.keys(cars).length;
  const brands = Object.keys(cars);
  for (let i = 0; i < numberOfBrands; i++) {
    $("<option>" + brands[i] + "</option>").appendTo(".brands select");
  }
  const d = new Date();
  const currentYear = d.getFullYear();
  for (let year = Number(years_from); year <= currentYear; year++) {
    $("<option>" + year + "</option>").appendTo(".years select");
  }

  const other_option = "<option>" + otherLabel + "</option>";
  $(other_option).appendTo(".type select");
  // Přidáme "other" do years jen pokud ještě tam není (přes sessionStorage)
  if (!getYear || !otherVariants.includes(getYear)) {
    $(other_option).appendTo(".years select");
  }

  // Obnova hodnot ze sessionStorage výše používá jen .val(), takže sama
  // change nevyvolá. Handler proto může být aktivní ihned; časový zámek by
  // blokoval skutečného uživatele, který značku vybere rychle po načtení.
  $(".brands select").on("change", function () {
    console.log("Spouští se change event pro značku:", $(this).val());

    if ($(this).val() === cstm_znacka.at(1)) {
      $(".models option:not(.notselect)").remove();
    } else {
      $(".models option:not(.notselect)").remove();
      const models_for_brand = setupData.cars[$(this).val()];
      if (models_for_brand && Array.isArray(models_for_brand)) {
        for (let i = 0; i < models_for_brand.length; i++) {
          $("<option>" + models_for_brand.at(i) + "</option>").appendTo(".models select");
        }
      }
    }
  });

  $(".btn.choice-Model").on("click", function () {
    saveModel(true);
  });
  // Ukládej i první rychlou změnu provedenou po vykreslení formuláře.
  $(".surcharge-list select").on("change", function () {
    console.log("change");
    saveModel(false);
  });

  // Hlavný prepínač osobné vozidlá ↔ kamióny (len homepage). Volané ako
  // POSLEDNÉ a v try/catch — nesmie za žiadnych okolností zhodiť výber
  // osobných vozidiel vyššie.
  if ($(".in-index")[0]) {
    try {
      initVehicleKindSwitch(container, choiceWrap);
    } catch (e) {
      console.error("[vehicle-switch] init zlyhal:", e);
    }
  }
}

/**
 * Hlavný prepínač na homepage: OSOBNÉ VOZIDLÁ ↔ KAMIÓNY A DODÁVKY.
 *
 * Osobáky ostávajú nedotknuté. Kamiónová vetva používa ROVNAKÝ dizajn ako
 * výber značiek osobákov (natívne selecty .surcharge-list .dm-selector,
 * zlatý rámček, tlačidlo .btn.choice-Model) — mení sa len zdroj dát:
 * značky+modely z truck konfigurátora (truck-brands.js). CTA uloží výber
 * do sessionStorage a pošle na truck konfigurátor, ktorý si ho predvyplní.
 */
function initVehicleKindSwitch(container, choiceWrap) {
  const isCs = ($("html").attr("lang") || "").toLowerCase().indexOf("cs") === 0;
  const t = isCs
    ? {
        cars: "Osobní vozidla",
        trucks: "Kamiony a dodávky",
        brand: "Značka",
        model: "Model",
        cta: "Zvolit model",
        fields: {
          prevodovka: "Typ převodovky",
          sedadlo: "Typ sedadla spolujezdce",
          zasuvky: "Počet zásuvek (šuplíků)",
          brzda: "Typ parkovací (ruční) brzdy",
          podlaha: "Typ podlahy",
        },
      }
    : {
        cars: "Osobné vozidlá",
        trucks: "Kamióny a dodávky",
        brand: "Značka",
        model: "Model",
        cta: "Zvoliť model",
        fields: {
          prevodovka: "Typ prevodovky",
          sedadlo: "Typ sedadla spolujazdca",
          zasuvky: "Počet zásuviek (šuplíkov)",
          brzda: "Typ parkovacej (ručnej) brzdy",
          podlaha: "Typ podlahy",
        },
      };

  // Piktogramové taby (auto / kamión) s názvom — decentné, bez veľkých
  // tlačidiel. Aktívny tab = zlatá farba + podčiarknutie.
  // Ikony: Font Awesome Free 6.5.2 (car-side, truck-moving) — CC BY 4.0,
  // https://fontawesome.com/license/free
  const ICON_CAR =
    '<svg viewBox="0 0 640 512" aria-hidden="true"><path fill="currentColor" d="M171.3 96H224v96H111.3l30.4-75.9C146.5 104 158.2 96 171.3 96zM272 192V96h81.2c9.7 0 18.9 4.4 25 12l67.2 84H272zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36H171.3c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256V368c0 17.7 14.3 32 32 32H65.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H385.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H608c17.7 0 32-14.3 32-32V320c0-65.2-48.8-119-111.8-127zM434.7 368a48 48 0 1 1 90.5 32 48 48 0 1 1 -90.5-32zM160 336a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/></svg>';
  const ICON_TRUCK =
    '<svg viewBox="0 0 640 512" aria-hidden="true"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96V304v80 16c0 44.2 35.8 80 80 80c26.2 0 49.4-12.6 64-32c14.6 19.4 37.8 32 64 32c44.2 0 80-35.8 80-80c0-5.5-.6-10.8-1.6-16H416h33.6c-1 5.2-1.6 10.5-1.6 16c0 44.2 35.8 80 80 80s80-35.8 80-80c0-5.5-.6-10.8-1.6-16H608c17.7 0 32-14.3 32-32V288 272 261.7c0-9.2-3.2-18.2-9-25.3l-58.8-71.8c-10.6-13-26.5-20.5-43.3-20.5H480V96c0-35.3-28.7-64-64-64H64zM585 256H480V192h48.8c2.4 0 4.7 1.1 6.2 2.9L585 256zM528 368a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM176 400a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM80 368a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>';

  const sw = $("<div>", { class: "lcd-vehicle-switch", role: "tablist" });
  const mkTab = function (icon, label, active) {
    return $("<button>", {
      type: "button",
      class: "lcd-vehicle-switch__tab" + (active ? " is-active" : ""),
      role: "tab",
      "aria-selected": active ? "true" : "false",
      html: icon + '<span class="lcd-vehicle-switch__name">' + label + "</span>",
    });
  };
  const btnCars = mkTab(ICON_CAR, t.cars, true);
  const btnTrucks = mkTab(ICON_TRUCK, t.trucks, false);
  sw.append(btnCars, btnTrucks);
  sw.insertBefore(choiceWrap);

  // Kamiónový riadok — IDENTICKÝ markup ako osobácke selecty, aby dedil
  // rovnaké CSS (rámčeky, radius, focus). Len iné dáta.
  const truckWrap = $("<div>", { class: "modl-selector-wrap lcd-truck-wrap", hidden: true }).insertAfter(choiceWrap);
  let truckSelectId = 0;
  const mkSelect = function (cls, placeholder, field) {
    const selectId = "lcd-truck-select-" + (++truckSelectId);
    const $wrap = $("<div>", {
      class: "surcharge-list " + cls + " dm-selector",
      "data-truck-field": field || null,
    }).appendTo(truckWrap);
    $("<label>", {
      class: "lcd-truck-field-label",
      for: selectId,
      text: placeholder,
    }).appendTo($wrap);
    const $selector = $("<div>", { class: "selector" }).appendTo($wrap);
    const $select = $("<select>", {
      id: selectId,
      "aria-label": placeholder,
    }).appendTo($selector);
    $("<option>", {
      class: "notselect",
      value: "",
      text: placeholder,
    }).appendTo($select);
    return $wrap;
  };
  mkSelect("truck-brands", t.brand);
  mkSelect("truck-models", t.model);
  const truckBtn = $("<div>", { class: "btn choice-Model lcd-truck-go", text: t.cta }).appendTo(truckWrap);

  const $brand = truckWrap.find(".truck-brands select");
  const $model = truckWrap.find(".truck-models select");

  Object.keys(TRUCK_BRANDS).forEach(function (brand) {
    $("<option>").text(brand).appendTo($brand);
  });

  const fillModels = function (brand) {
    $model.find("option:not(.notselect)").remove();
    (TRUCK_BRANDS[brand] || []).forEach(function (m) {
      $("<option>").text(m).appendTo($model);
    });
  };

  const clearExtras = function () {
    truckWrap.find(".truck-extra").remove();
    truckWrap.removeClass("has-extras");
  };

  // Zobraz presne tie isté podmienené polia ako krok 1 v truck konfigurátore.
  // Aj jednohodnotové polia zostávajú viditeľné (sú automaticky vybrané),
  // takže zákazník vidí kompletnú špecifikáciu vozidla.
  const fillExtras = function (brand, model, savedExtras) {
    clearExtras();
    const config = TRUCK_VEHICLES[brand] && TRUCK_VEHICLES[brand][model];
    if (!config) return;

    TRUCK_FIELD_ORDER.forEach(function (field) {
      const options = config[field];
      if (!Array.isArray(options) || !options.length) return;
      const $wrap = mkSelect("truck-extra truck-extra--" + field, t.fields[field], field);
      const $select = $wrap.find("select");
      options.forEach(function (option) {
        $("<option>").text(option).attr("value", option).appendTo($select);
      });
      if (savedExtras && options.indexOf(savedExtras[field]) > -1) {
        $select.val(savedExtras[field]);
      } else if (options.length === 1) {
        $select.val(options[0]);
      }
      $select.on("change", function (e) {
        e.stopImmediatePropagation();
        $wrap.removeClass("errorToCart");
      });
    });

    truckWrap.toggleClass("has-extras", truckWrap.find(".truck-extra").length > 0);
    // mkSelect pridáva na koniec; CTA má zostať posledná.
    truckBtn.appendTo(truckWrap);
  };

  // Vlastný change handler MUSÍ bežať prvý a zastaviť ďalšie handlery —
  // globálny binding `$(".surcharge-list select").on("change") → saveModel`
  // by inak prepisoval sessionStorage osobákov hodnotami z kamiónov.
  $brand.on("change", function (e) {
    e.stopImmediatePropagation();
    $model.val("");
    clearExtras();
    fillModels($(this).val());
  });
  $model.on("change", function (e) {
    e.stopImmediatePropagation();
    fillExtras($brand.val(), $(this).val(), {});
  });

  // Predvyplň z predchádzajúcej návštevy (späť z konfigurátora)
  try {
    const savedBrand = sessionStorage.getItem("truckBrand");
    const savedModel = sessionStorage.getItem("truckModel");
    let savedExtras = {};
    try { savedExtras = JSON.parse(sessionStorage.getItem("truckExtras") || "{}") || {}; } catch (e) { savedExtras = {}; }
    if (savedBrand && TRUCK_BRANDS[savedBrand]) {
      $brand.val(savedBrand);
      fillModels(savedBrand);
      if (savedModel && TRUCK_BRANDS[savedBrand].indexOf(savedModel) > -1) {
        $model.val(savedModel);
        fillExtras(savedBrand, savedModel, savedExtras);
      }
    }
  } catch (e) { /* private mode */ }

  truckBtn.on("click", function () {
    const brand = $brand.val();
    const model = $model.val();
    // Rovnaká validácia ako u osobákov — červený rámček, žiadny redirect.
    let invalid = false;
    if (!brand) { truckWrap.find(".truck-brands").addClass("errorToCart"); invalid = true; }
    if (!model) { truckWrap.find(".truck-models").addClass("errorToCart"); invalid = true; }
    const extras = {};
    truckWrap.find(".truck-extra").each(function () {
      const $field = $(this);
      const key = $field.attr("data-truck-field");
      const value = $field.find("select").val();
      if (!value) {
        $field.addClass("errorToCart");
        invalid = true;
      } else {
        extras[key] = value;
      }
    });
    if (invalid) {
      setTimeout(function () { $(".errorToCart").removeClass("errorToCart"); }, 2000);
      return;
    }
    try {
      sessionStorage.setItem("truckBrand", brand);
      sessionStorage.setItem("truckModel", model);
      sessionStorage.setItem("truckExtras", JSON.stringify(extras));
    } catch (e) { /* private mode */ }
    window.location.href = TRUCK_PRODUCT_URLS[isCs ? "cs" : "sk"];
  });

  const setKind = function (kind) {
    const trucks = kind === "trucks";
    btnCars.toggleClass("is-active", !trucks).attr("aria-selected", String(!trucks));
    btnTrucks.toggleClass("is-active", trucks).attr("aria-selected", String(trucks));
    choiceWrap.prop("hidden", trucks);
    truckWrap.prop("hidden", !trucks);
    try { sessionStorage.setItem("vehicleKind", kind); } catch (e) { /* private mode */ }
  };

  btnCars.on("click", function () { setKind("cars"); });
  btnTrucks.on("click", function () { setKind("trucks"); });

  // Obnov posledný režim (user prišiel späť z truck konfigurátora)
  try {
    if (sessionStorage.getItem("vehicleKind") === "trucks") setKind("trucks");
  } catch (e) { /* private mode */ }
}

function saveModel(redirect) {
  console.log("saveModel");
  const Brand = $(".surcharge-list.brands.dm-selector select").val();
  const Model = $(".surcharge-list.models.dm-selector select").val();
  const Year = $(".surcharge-list.years.dm-selector select").val();
  const type = $(".surcharge-list.type-selector select").val();
  setTimeout(() => {
    try {
      console.log(Brand + " " + Model + " " + Year);

      sessionStorage.setItem("Brand", Brand);
      if (Model !== "Model") {
        sessionStorage.setItem("Model", Model);
        // Na strankach bez auto-konfiguratora su vsetky selecty prazdne — bez
        // tejto poistky sa ulozilo "undefined undefined undefined undefined"
        // a taky riadok potom skoncil v poznamke objednavky.
        if (Brand && Model && Year && type) {
          sessionStorage.setItem("model", Brand + " " + Model + " " + Year + " " + type);
        }
      }
      sessionStorage.setItem("Year", Year);
      sessionStorage.setItem("carType", type);
      $(".model-text").text(Brand + " " + Model + " " + Year + " " + type);
    } catch (e) {
      console.warn("Session storage is not available:", e);
      // Fallback - could use cookies or other storage mechanism here
    }
  }, 100);
  if ($(".in-index")[0] && redirect) {
    if (
      $(".surcharge-list.brands.dm-selector select").val() === cstm_znacka[0] ||
      $(".surcharge-list.models.dm-selector select").val() === cstm_model[0] ||
      $(".surcharge-list.years.dm-selector select").val() === cstm_rocnik[0] ||
      $(".surcharge-list.type-selector select").val() === "Typ auta"
    ) {
      if ($(".surcharge-list.brands.dm-selector select").val() === cstm_znacka[0]) {
        $(".surcharge-list.brands.dm-selector").addClass("errorToCart");
      }
      if ($(".surcharge-list.models.dm-selector select").val() === cstm_model[0]) {
        $(".surcharge-list.models.dm-selector").addClass("errorToCart");
      }
      if ($(".surcharge-list.years.dm-selector select").val() === cstm_rocnik[0]) {
        $(".surcharge-list.years.dm-selector").addClass("errorToCart");
      }
      if ($(".surcharge-list.type-selector select").val() === "Typ auta") {
        $(".surcharge-list.type-selector").addClass("errorToCart");
      }
      setTimeout(() => {
        $(".errorToCart").removeClass("errorToCart");
      }, 2000);

      return;
    }
    window.location.href = "/rozcestnik/";
  }
}
function initSignpost() {
  const model = sessionStorage.getItem("model");
  $("section#Model-selecte .model span").text(model);
}

function googleReviews(setupData, texts) {
  // Widget recenzii (lcd-reviews) - nahradil stary Google badge.
  // Homepage: za model-selector. Bezny produkt: medzi "10 dovodov" a "%".
  // Box produkt: ako prvy widget. SK/CZ cez data-lang.
  var lang = (($("html").attr("lang") || "").toLowerCase().indexOf("cs") === 0) ? "cz" : "sk";
  var base = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/js/";
  var WV = "9";

  $("#goggle-review-wrap, .google-reviews").remove();

  // Novy dizajn titulky (#lcd-home) ma vlastne recenzie (#revs). Stary widget by
  // sa postavil uz len do skryteho obsahu - 1 406 prvkov a ~96 stiahnutych fotiek,
  // ktore nikto neuvidi. Preto sa na titulke s novym dizajnom vobec nestavia.
  // Podmienka je zamerne na #lcd-home, nie na URL: ked by novy dizajn nenabehol,
  // stara titulka dostane recenzie presne ako doteraz.
  if ($(".in-index")[0] && document.getElementById("lcd-home")) return;

  function makeWidget() {
    var title = (lang === "cz")
      ? "Co \u0159\u00EDkaj\u00ED na\u0161i z\u00E1kazn\u00EDci"
      : "\u010Co hovoria na\u0161i z\u00E1kazn\u00EDci";
    return $('<div class="lcd-reviews-widget"></div>')
      .attr("data-title", title)
      .attr("data-lang", lang)
      .attr("data-limit", "30")
      .attr("data-min-rating", "4");
  }

  function placeWidget() {
    if ($(".in-index")[0]) {
      // Homepage: widget MUSI byt hned za model-selectorom (desktop aj mobil).
      // Na mobile sa model-selector vklada cez prependTo do banners-row,
      // co moze widget premiestnit pred neho - preto poradie vzdy preveruj.
      var $ms = $(".in-index section#model-selector");
      if (!$ms.length) return false;
      var $rev = $(".lcd-reviews-widget");
      if (!$rev.length) { makeWidget().insertAfter($ms); return true; }
      // widget existuje - ak nie je hned za model-selectorom, presun ho tam
      if (!$ms.next().is($rev)) { $rev.first().insertAfter($ms); }
      return true;
    }
    if ($(".lcd-reviews-widget").length) return true;
    if ($(".type-product")[0]) {
      var isBox = /box/i.test($("h1").first().text());
      if (isBox) {
        var $desc = $("div.basic-description").first();
        if ($desc.length) { makeWidget().prependTo($desc); return true; }
        var $pi = $(".p-info-wrapper").first();
        if ($pi.length) { makeWidget().prependTo($pi); return true; }
        return false;
      }
      var $pct = $(".impact-text").first();
      if ($pct.length) {
        var $pctSec = $pct.closest(".section, section");
        makeWidget().insertBefore($pctSec.length ? $pctSec : $pct);
        return true;
      }
      var $sec = $(".images-scrolling__counter").first().closest("section");
      if ($sec.length) { makeWidget().insertBefore($sec); return true; }
      var $d2 = $("div.basic-description").first();
      if ($d2.length) { makeWidget().appendTo($d2); return true; }
      return false;
    }
    return false;
  }

  function loadScripts() {
    if (window.__lcdReviewsScriptsInjected) return;
    window.__lcdReviewsScriptsInjected = true;
    var d = document.createElement("script");
    d.src = base + "reviews-data.js?v=" + WV;
    d.onload = function () {
      var w = document.createElement("script");
      w.src = base + "lcd-reviews.js?v=" + WV;
      document.body.appendChild(w);
    };
    document.body.appendChild(d);
  }

  loadScripts();
  var tries = 0, extra = 0;
  (function tryPlace() {
    tries++;
    var placed = placeWidget();
    // Po umiestneni na homepage este par cyklov preveruj poradie -
    // model-selector sa na mobile vklada cez prependTo a moze widget
    // docasne premiestnit pred seba.
    if (placed) {
      if ($(".in-index")[0] && extra < 6) { extra++; setTimeout(tryPlace, 300); }
      return;
    }
    if (tries >= 25) return;
    setTimeout(tryPlace, 300);
  })();

  // Mobilna homepage sklada bannery a model-selector asynchronne aj po
  // skonceni retry cyklu. Udrz recenzie vzdy bezprostredne ZA celym vyberom
  // vozidla; desktopove poradie tym nie je dotknute.
  if ($(".in-index").length && window.matchMedia("(max-width: 768px)").matches && window.MutationObserver) {
    var orderFrame = 0;
    var orderObserver = new MutationObserver(function () {
      if (orderFrame) return;
      orderFrame = requestAnimationFrame(function () {
        orderFrame = 0;
        var $ms = $(".in-index section#model-selector").first();
        if (!$ms.length) return;
        // Trustindex vie neskoro znovu vlozit povodny #goggle-review-wrap;
        // presuvame preto novy aj legacy rating blok.
        var $ratings = $(".in-index section#goggle-review-wrap, .in-index .lcd-reviews-widget");
        var $anchor = $ms;
        $ratings.each(function () {
          var $rating = $(this);
          if (!$anchor.next().is($rating)) $rating.insertAfter($anchor);
          $anchor = $rating;
        });
      });
    });
    orderObserver.observe(document.body, { childList: true, subtree: true });
  }
}


function lcdVideos() {
  // Widget YouTube videi (lcd-videos.js). Produkt: pod widgetom "Zlozenie materialu".
  var base = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/js/";
  var VV = "5";

  // Novy dizajn titulky ma vlastny pas videi (#vids, 668 reels). Stary widget by
  // postavil dalsich ~2 100 prvkov do skryteho obsahu. Rovnaka poistka ako pri
  // recenziach: ked novy dizajn nenabehne, stara titulka ho dostane ako doteraz.
  if ($(".in-index")[0] && document.getElementById("lcd-home")) return;

  function placeWidget() {
    if ($(".lcd-videos-widget").length) return true;
    if ($(".in-index")[0]) {
      var $h = $(".sec-header").filter(function () {
        return /vyroben.{0,4}koberce do kufr/i.test($(this).text().replace(/\s+/g, " "));
      }).first();
      if ($h.length) {
        var $sec = $h.closest("section");
        if ($sec.length) {
          $('<div class="lcd-videos-widget"></div>').insertBefore($sec);
          return true;
        }
      }
      return false;
    }
    if ($(".type-product")[0]) {
      if (/box/i.test($("h1").first().text())) {
        var $rev = $(".lcd-reviews-widget").first();
        if ($rev.length) {
          $('<div class="lcd-videos-widget"></div>').insertAfter($rev);
          return true;
        }
        return false;
      }
      var $mat = $(".basic-description .layers-info-wrap").first();
      if ($mat.length) {
        $('<div class="lcd-videos-widget"></div>').insertAfter($mat);
        return true;
      }
      return false;
    }
    return false;
  }

  function loadScript() {
    if (window.__lcdVideosScriptsInjected) return;
    window.__lcdVideosScriptsInjected = true;
    var v = document.createElement("script");
    v.src = base + "lcd-videos.js?v=" + VV;
    document.body.appendChild(v);
  }

  var tries = 0;
  (function tryPlace() {
    tries++;
    if (placeWidget()) { loadScript(); return; }
    if (tries < 25) { setTimeout(tryPlace, 300); return; }
    if (typeof MutationObserver === "function" && document.body) {
      var mo = new MutationObserver(function () {
        if (placeWidget()) { loadScript(); mo.disconnect(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  })();
}


function createPopUp() {
  $(`<div class="ti-dropdown-widget">
        <div class="ti-dropdown-widget-inner">
            <div class="ti-widget-container">
                <div class="ti-popup-header">
                    <a href="#" class="ti-close-lg"></a>
                </div>
                <div class="ti-reviews-container">
                    <div class="ti-reviews-container-wrapper"></div>
                </div>
            </div>
        </div>
    </div>`).appendTo(".model-selector.container");

  if ($(".ti-reviews-container-wrapper").length == 0) {
    return;
  }

  // Find a placeID via https://developers.google.com/places/place-id
}
setTimeout(function () {
  $(logoGoogle).appendTo(".review-item-long");
  $("#google-reviews br").remove();

  // $("#google-reviews").slick({
  //     dots: true,
  //     centerMode: false,
  //     infinite: true,
  //     slidesToShow: 5,
  //     slidesToScroll: 2,
  //     autoplay: true,
  //     autoplaySpeed: 8000,
  //     arrows: false,

  //     responsive: [{
  //             breakpoint: 1600,
  //             settings: {
  //                 slidesToShow: 4,
  //                 slidesToScroll: 1,
  //             },
  //         },
  //         {
  //             breakpoint: 1480,
  //             settings: {
  //                 slidesToShow: 3,
  //                 slidesToScroll: 1,
  //             },
  //         },
  //         {
  //             breakpoint: 1200,
  //             settings: {
  //                 slidesToShow: 2,
  //                 slidesToScroll: 1,
  //             },
  //         },
  //         {
  //             breakpoint: 800,
  //             settings: {
  //                 slidesToShow: 1,
  //                 slidesToScroll: 1,

  //                 autoplay: false,
  //             },
  //         },
  //         // {
  //         //     breakpoint: 350,
  //         //     settings: {
  //         //         slidesToShow: 1,
  //         //         slidesToScroll: 1,
  //         //     },
  //         // },
  //     ],
  // });
}, 2500);

function createPop() {
  $(`<div class="overflow" style="position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div class="ti-dropdown-widget">
        <style>
        .ti-dropdown-widget {
    opacity: 1;
    display: -ms-flexbox;
    display: flex;
   
    position: absolute;
    top: initial;
    bottom: initial;
    background: none;
    text-align: left !important;
    z-index: 999999;
    left: 50%;
        width: 100%;
    transform: translateX(-50%);
}
@media (max-width: 768px) {
    .ti-dropdown-widget {
        left: unset;
        transform: none;
        width: 90%;
    }
}

.ti-dropdown-widget-inner {
    height: 100%;
    padding: 40px 10px 10px 10px;
    overflow: visible;
    background-color: #ffffff !important;
    position: relative;
    max-width: 700px;
    margin: auto;
    box-shadow: 0px 0px 40px 0px rgba(0, 0, 0, 0.1), 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
     width: 100%;

}

.ti-content-container-wrapper {
    overflow: auto;
    display: inherit;
    margin: 0px !important;
    margin-top: 0px !important;
    padding-right: 20px;
}

.ti-widget-container {
    margin-bottom: 0px;
    height: 100%;
    display: flex !important;
    flex-direction: column;
    font-size: 14px;
    line-height: 1.4em;
    overflow-y: scroll;
    height: 95%;
}

.ti-close-lg {
    position: absolute;
    width: 30px;
    height: 30px;
    background-color: #fff;
    right: 6px;
    top: 6px;
    border-radius: 50px;
    display: block;
    cursor: pointer;
    pointer-events: visible !important;
    color: #333;
    &:before,
    &:after {
        content: "";
        position: absolute;
        display: block;
        border-radius: 2px;
        width: 16px;
        height: 3px;
        top: 13px;
        left: 7px;
        background-color: #555;
    }
    &:before {
        transform: rotate(45deg);
    }
    &:after {
        transform: rotate(-45deg);
    }
}
        </style>
        
        <div class="ti-dropdown-widget-inner">
        <div class="ti-popup-header">      <a href="#" class="ti-close-lg"></a>
                </div>
            <div class="ti-widget-container">
                
              
                <div class="ti-content-container">
                    <div class="ti-content-container-wrapper"></div>
                </div>
            </div>
            </div>
        </div>
    </div>`).appendTo("body");
  $("a.ti-close-lg").on("click", function () {
    $(".overflow").remove();
  });
}

function upsalePage(orders) {
  $("<div>", {
    class: "navigatte-button class" + orders + "  upsale",
    "data-option": "option-" + orders,
  }).appendTo(".navidation-Wrap");
  const pageWrap = $("<div>", { class: "parameter-wrap upsale " }).appendTo(".content-wrap");
  $("<h5>", {
    text: "Rekapitulace",
  }).appendTo(pageWrap);
  $("<p>", {
    text: " text pro upsale ",
  }).appendTo(pageWrap);
  const buttonWrao = $("<div>", {
    class: "button-wrap",
  }).appendTo(pageWrap);
  $("<div>", { class: "btn upsale", text: "upsale" }).appendTo(buttonWrao);
  $("<div>", { class: "btn close", text: "Ukoncit konfigurator" }).appendTo(buttonWrao);
}

// function initCart() {
//   if (!$(".id--9")[0]) return;
//   const bannerWrap = $("<div>", {
//     class: "banner-wrap",
//   }).insertBefore("table.cart-table");
//   $("<div>", {
//     class: "h3",
//     text: "Dokonalá ochrana pre váš kufor za EXTRÉMNE zvýodnenu cenu!",
//   }).appendTo(bannerWrap);
//   $("<p>", {
//     text: "Len teraz môžete pridať luxusné autokoberce do kufra alebo úložné boxy za výrazne zvýhodnenú cenu. Chráňte kufor Vášho vozidla pred nečistotami a majte všetko na mieste!",
//   }).appendTo(bannerWrap);
//   const timer = $("<div>", {
//     class: "timer-wrap",
//   }).appendTo(bannerWrap);
//   $("<span>", {
//     text: "Špeciálna ponuka končí za",
//   }).appendTo(timer);

//   const countdownSpan = $("<span>", {
//     class: "countdown",
//     text: "",
//   }).appendTo(timer);

//   $("<a>", {
//     class: "btn",
//     text: "Pridať so zľavou do objednávky!",
//     href: "#",
//   }).appendTo(bannerWrap);
//   $("<div>", {
//     class: "description",
//     text: "Túto ponuku získate len pri tejto objednávke. Nepremeškajte šancu získať doplnky za najlepšiu cenu!",
//   }).appendTo(bannerWrap);

//   // Získání aktuálního času odpočtu ze sessionStorage nebo nastavení 30 minut
//   let endTime = sessionStorage.getItem("timerEndTime");
//   if (!endTime || new Date(endTime) < new Date()) {
//     // Pokud není uložený čas nebo je již vypršel, nastavíme nový odpočet na 30 minut
//     endTime = new Date(new Date().getTime() + 30 * 60 * 1000);
//     sessionStorage.setItem("timerEndTime", endTime);
//   } else {
//     // Pokud je uložený čas platný, použijeme jej
//     endTime = new Date(endTime);
//   }

//   // Aktualizace odpočtu každou sekundu
//   function updateCountdown() {
//     const now = new Date();
//     const remainingTime = endTime - now;

//     if (remainingTime <= 0) {
//       countdownSpan.text("čas vypršel!");
//       clearInterval(countdownInterval);
//       sessionStorage.removeItem("timerEndTime");
//     } else {
//       const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
//       const seconds = Math.floor((remainingTime / 1000) % 60);
//       countdownSpan.text(`${minutes} min ${seconds} sec`);
//     }
//   }

//   // Spustit aktualizaci odpočtu každou sekundu
//   const countdownInterval = setInterval(updateCountdown, 1000);
//   updateCountdown();
// }

function dinamicPictures() {
  var sections = $(".text-block");
  var dynamicImage = $("#dynamic-image");

  function changeImage() {
    var currentSection = null;

    sections.each(function () {
      var section = $(this);
      var rect = this.getBoundingClientRect();
      var sectionTop = rect.top;
      var sectionBottom = rect.bottom;

      // Kontrola, zda je sekce uprostřed obrazovky
      if (sectionTop <= $(window).height() / 2 && sectionBottom >= $(window).height() / 2) {
        currentSection = section;
        return false; // Ukončíme each loop, protože jsme našli aktuální sekci
      }
    });

    if (currentSection) {
      var newImageSrc = currentSection.data("picture");

      if (dynamicImage.attr("src") !== newImageSrc) {
        // Přidání přechodového efektu
        dynamicImage.css("opacity", 0);

        setTimeout(function () {
          dynamicImage.attr("src", newImageSrc);
          dynamicImage.css("opacity", 1);
        }, 500); // Doba trvání přechodu musí odpovídat CSS přechodu
      }
    }
  }

  $(window).on("scroll", changeImage);
  changeImage(); // Inicializace při načtení stránky
}

/** Model je pouzitelny do poznamky, len ked ma vsetky styri casti vyplnene.
 *  Na strankach bez auto-konfiguratora (vzorkovnik, truck) saveModel ulozi
 *  "undefined undefined undefined undefined" — taky zapis do objednavky nepatri. */
function isUsableSavedModel(savedModel) {
  const value = String(savedModel || "").trim();
  if (!value || value === "undefined" || value === "null") return false;
  return !/\b(undefined|null)\b/.test(value);
}

function addNote() {
  if ($(".id--17")[0]) {
    console.log("adresa");
    // toNote();
    const city = sessionStorage.getItem("model");
    console.log(city);

    // $("input#billZip").val(city).addClass("disabled");

    // $("label.whole-width").on("click", function () {
    //   console.log("aaaa");

    //   setTimeout(function () {
    //     if ($("div#shipping-address.visible")[0]) {
    //       $("input#deliveryZip").val(city).addClass("disabled");
    //       $("input#billZip").removeClass("disabled");
    //     } else {
    //       $("input#billZip").val(city).addClass("disabled");
    //       $("input#deliveryZip").removeClass("disabled");
    //     }
    //   }, 400);
    // });

    shoptet.custom.postSuccessfulValidation = function (form) {
      if ($(form).attr("id") === "order-form") {
        console.log("tttt");
        toNote();
      }
      return true;
    };

    function toNote() {
      const $remark = $("#remark");
      if (!$remark.length) return;

      let truckSummary = "";
      let savedModel = "";
      try {
        truckSummary = sessionStorage.getItem("truckOrderSummary") || "";
        savedModel = sessionStorage.getItem("model") || "";
      } catch (e) {
        // Storage moze byt v sukromnom rezime nedostupne; rucnu poznamku
        // zakaznika v takom pripade nechame bez zmeny.
      }

      let note = String($remark.val() || "");

      if (truckSummary) {
        // postSuccessfulValidation moze prebehnut opakovane. Helper povodny
        // automaticky blok nahradi, rucnu poznamku zakaznika vsak zachova.
        note = mergeTruckOrderSummaryIntoNote(note, truckSummary);
      } else if (isUsableSavedModel(savedModel)) {
        // Povodny auto-konfigurator: zachovaj zapis modelu pre bezne autokoberce.
        const modelLine = `model: ${savedModel}`;
        if (!note.includes(modelLine)) note = note ? `${note}\n\n${modelLine}` : modelLine;
      }

      $remark.val(note);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SEO Fáza A — Fix #4: Lazy-load images (CWV / LCP optimization)
// Aplikuje loading="lazy" + decoding="async" na všetky <img> okrem
// hero (LCP image). Hero selectors: .banner img, .hero img,
// #main-banner img — tieto musia ostať eager + fetchpriority="high".
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  const heroSelectors = [".banner img", ".hero img", "#main-banner img"];
  const heroImgs = new Set();
  heroSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((img) => heroImgs.add(img));
  });

  document.querySelectorAll("img").forEach((img) => {
    if (!heroImgs.has(img) && !img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
    }
  });
});
