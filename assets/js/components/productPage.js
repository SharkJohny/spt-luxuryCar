import { showUpsalePopup } from "./UpsalePopup.js";
import { createUpsaleButton, createOptions, createBoxConfig } from "./creatButtons.js";
let koberce = 88;
let boxy = 91;
let box1 = 94;
let box2 = 97;
let boxsPrice = [];

const language = shoptetData.language;
if (dataLayer[0].shoptet.projectId == "581408") {
  koberce = 60;
  boxy = 63;
  box1 = 66;
  box2 = 69;
}
/**
 * Initializes the product page.
 */

sessionStorage.setItem("wheelPosition", "left");
sessionStorage.setItem("seatPosition", "pass-5");

const standartPrice = Number(
  $(".p-final-price-wrapper .price-standard span").length
    ? $(".p-final-price-wrapper .price-standard span")
        .text()
        .replace(/[^0-9]/g, "")
    : 0,
);
const price = Number(
  $("span.calculated-price").length
    ? $("span.calculated-price")
        .text()
        .replace(/[^0-9]/g, "")
    : 0,
);

const diference = standartPrice - price;

console.log(diference);
export function initProduct(setupData, texts) {
  createModelInfo();
  // changeThumbnails();
  setTimeout(() => {
    $(".p-thumbnails-horizontal").addClass("overflow-next");
  }, 1000);

  $("<div class='recommended-price'>Doporučená cena</div>").prependTo(".p-info-wrapper span.price-standard");

  $(".price-save:eq(1)").appendTo(".p-info-wrapper span.price-standard");
  $("<div class='recommended-price-final'>" + texts.current_price + "</div>").prependTo(".p-info-wrapper .price-final");
  setTimeout(() => {
    if ($(".col-xs-12.col-lg-6.p-info-wrapper").length) {
      $(".col-xs-12.col-lg-6.p-info-wrapper").addClass("active");
    }
  }, 1000);
  if ($(".id-751").length) {
    $(".benefitBanner__item").remove();
  }

  if ($("body.desktop").length) {
    $("video.mobile").remove();
  } else {
    $("video.desctop").remove();
  }
  if ($(".p-detail-inner .p-detail-info").length) {
    $(".p-detail-inner .p-detail-info").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  if ($(".p-detail-inner .p-detail-inner-header").length) {
    $(".p-detail-inner .p-detail-inner-header").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  if ($(".benefitBanner.position--benefitProduct .benefitBanner__item").length) {
    $(".benefitBanner.position--benefitProduct .benefitBanner__item").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  createModelInfo();
  priplatky(setupData, texts);

  $(".button.btn.select-model").on("click", function () {
    const overflow = $("<div>", {
      class: "overflow",
      style:
        "position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;",
    }).appendTo("body");

    const popup = $("<div>", {
      class: "model-select",
      style: "position: relative; background-color: #fff; padding: 20px;",
    }).appendTo(overflow);

    $("<div>", {
      class: "h3",
      text: "Vyberte model",
    }).appendTo(popup);
    initModelSelect();
  });

  $("select.parameter-id-38.surcharge-parameter").val("248").trigger("change");
  const buttons = $("button.timeline__nav-item");
  const prevButton = $('button[is="prev-button"]');
  const nextButton = $('button[is="next-button"]');
  let currentIndex = 0;

  buttons.on("click", function () {
    const index = $(this).index();
    buttons.removeClass("active");
    $(this).addClass("active");

    $(".timeline__slide").removeClass("is-selected").addClass("reveal-invisible").attr("style", "opacity: 0; visibility: hidden; z-index: 0;");
    $(`.timeline__slide:eq(${index})`)
      .addClass("is-selected")
      .removeClass("reveal-invisible")
      .attr("style", "opacity: 1; visibility: visible; z-index: 1;");

    currentIndex = index;
    console.log(`Kliknul jsi na tlačítko s indexem: ${index}`);
  });

  prevButton.on("click", function () {
    if (currentIndex > 0) {
      currentIndex--;
      buttons.removeClass("active");
      buttons.eq(currentIndex).addClass("active");

      $(".timeline__slide").removeClass("is-selected").addClass("reveal-invisible").attr("style", "opacity: 0; visibility: hidden; z-index: 0;");
      $(`.timeline__slide:eq(${currentIndex})`)
        .addClass("is-selected")
        .removeClass("reveal-invisible")
        .attr("style", "opacity: 1; visibility: visible; z-index: 1;");

      console.log(`Posunul jsi zpět na index: ${currentIndex}`);
    }
  });

  nextButton.on("click", function () {
    if (currentIndex < buttons.length - 1) {
      currentIndex++;
      buttons.removeClass("active");
      buttons.eq(currentIndex).addClass("active");

      $(".timeline__slide").removeClass("is-selected").addClass("reveal-invisible").attr("style", "opacity: 0; visibility: hidden; z-index: 0;");
      $(`.timeline__slide:eq(${currentIndex})`)
        .addClass("is-selected")
        .removeClass("reveal-invisible")
        .attr("style", "opacity: 1; visibility: visible; z-index: 1;");

      console.log(`Posunul jsi dopředu na index: ${currentIndex}`);
    }
  });

  // const wrap = $("<div>", {
  //   class: "thumbnails-wrap",
  // }).appendTo(".col-xs-12.col-lg-6.p-image-wrapper");
  // $(".p-thumbnails-inner>div>a").each(function (n) {
  //   if (n % 2 !== 0 || n > 15) return;
  //   console.log(n);
  //   const src = $(this).attr("href");
  //   const image = $("<a>", {
  //     class: "thumbnail-image p-main-image cloud-zoom",
  //     href: src,
  //   }).appendTo(wrap);
  //   $("<img>", {
  //     src,
  //   }).appendTo(image);
  // });

  $(".next-step-button").on("click", function (event) {
    if ($(event.target).closest(".parameter-cars.patterns-wrap").length) {
      return;
    }
    const model = sessionStorage.getItem("model");
    console.log(model);
    if (!model || (model && (model.includes("Značka") || model.trim() === "Model" || model.includes("Rok výroby") || model.includes("Typ auta")))) {
      const name = $("h1").text();
      if (name.includes("box") || name.includes("Boxy")) {
        return;
      }

      createpopup(texts);
      setTimeout(() => {
        // Místo odebrání všech active buttonů v content-wrap
        // odebereme active pouze z tlačítka, na které se kliklo
        $(event.target).closest(".button.option-button").removeClass("active");
      }, 1000);

      $(".image-wrap").remove();
    }
  });
  setTimeout(() => {
    $(".parameter-wrap.orders-1").removeClass("goToAction");
  }, 1000);
  $(".parameter-cars.wheel-Position .option-wrap .option-button").on("click", function () {
    const position = $(this).data("value");
    sessionStorage.setItem("wheelPosition", position);
  });
  $(".parameter-cars.sit-Position .option-wrap .option-button").on("click", function () {
    const position = $(this).data("value");
    console.log(position);
    sessionStorage.setItem("seatPosition", position);
  });
}

/**
 * Initializes the upsale section.
 */
function priplatky(setupData, texts) {
  if (!$(".type-detail").length) return;
  let order = 6;

  if (shoptetData.product.id == 598 || shoptetData.product.id == 610 || shoptetData.product.id == 613) {
    order = 4;
  } else if (shoptetData.product.id == 2403 || shoptetData.product.id == 2415 || shoptetData.product.id == 2418) {
    order = 4;
  }

  if ($(".type-detail").length) {
    $("<div>", {
      class: "upsale-wrap",
    }).insertAfter(".detail-parameters");

    createUpsaleInfo(texts);

    if ($(".parameter-id-" + koberce)[0]) {
      // $(upsaleBanner).hide();
      // condownMessage(upsaleBanner, 30, "Zvýhodněná nabídka na přislušenství platí ještě: ");

      $("body").addClass("upsale-page");

      const buttonWrap = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap trunk",
      }).appendTo(".upsale-Banner");
      $(`<div class="order">${order}</div>`).appendTo(buttonWrap);
      $('<h5 class="variant name">autokoberce do kufru</h5>').appendTo(buttonWrap);
      const parameterWrap = $("<div>", {
        class: "parameter-cars",
      }).appendTo(buttonWrap);
      const name = $("h1").text();
      console.log(name);
      let prefix = "";
      if (name.includes("HEXA")) {
        prefix = "hexa-";
      } else if (name.includes("STRIPE")) {
        prefix = "stripe-";
      }
      let carpetsText = setupData.settings.carpetsText.split(",");
      let carpetsValue = setupData.settings.carpetsValue.split(",");
      let carpetsImage = setupData.settings.carpetsImage.split(",");
      let Price = getcarpetprice(carpetsValue);
      let carpetsPrice = setupData.priceListEUR;
      let priceArray = [Price[0] + "/" + carpetsPrice.classic_trunk.recommended, Price[1] + "/" + carpetsPrice.premium_trunk.recommended, "0/0"];
      if (dataLayer[0].shoptet.projectId == "581408") {
        carpetsText = setupData.settings.carpetsTextcs.split(",");
        carpetsValue = setupData.settings.carpetsValuecs.split(",");
        Price = getcarpetprice(carpetsValue);
        carpetsPrice = setupData.priceListCZK;

        priceArray = [Price[0] + "/" + carpetsPrice.classic_trunk.recommended, Price[1] + "/" + carpetsPrice.premium_trunk.recommended, "0/0"];
      }
      $(carpetsText).each(function (e) {
        if (e == 2) {
          prefix = "";
        }
        createUpsaleButton(
          "https://cdn.myshoptet.com/usr/581408.myshoptet.com/user/documents/upload/assets/new/" + prefix + carpetsImage[e],
          this,
          parameterWrap,
          carpetsValue[e],
          "radio",
          priceArray[e],
          false,
          texts,
        );
      });
    }

    function getcarpetprice(carpetsValue) {
      let array = [];
      carpetsValue.forEach((value, index) => {
        console.log("value-------", value);
        const valueKey = value.split("-");
        const getPrice = $(".parameter-id-" + valueKey[0] + " option[value='" + valueKey[1] + "']").data("surcharge-additional-price");

        array.push(getPrice);
      });
      console.log(array);
      return array;
    }

    // createUpsaleButton(
    //   "https://cdn.myshoptet.com/usr/581408.myshoptet.com/user/documents/upload/assets/boxy.jpg",
    //   "LUXUSNÉ BOXY DO KUFRU NA MIERU",
    //   buttonWrap,
    //   "conf",
    //   "config"
    // );
    if ($(".parameter-id-" + boxy)[0]) {
      let boxsText = setupData.settings.boxsText.split(",");

      const boxsValue = setupData.settings.boxsValue.split(",");
      const boxsImage = setupData.settings.boxsImage.split(",");

      let carpetsPrice = setupData.priceListEUR;
      let priceArray = [
        carpetsPrice.box_one.selling + "/" + carpetsPrice.box_one.recommended,
        carpetsPrice.box_two.selling + "/" + carpetsPrice.box_two.recommended,
        "0/0",
      ];
      if (dataLayer[0].shoptet.projectId == "581408") {
        boxsText = setupData.settings.boxsTextcs.split(",");
        boxsPrice = setupData.settings.boxsPricecs.split(",");
        carpetsPrice = setupData.priceListCZK;
        priceArray = [
          carpetsPrice.box_one.selling + "/" + carpetsPrice.box_one.recommended,
          carpetsPrice.box_two.selling + "/" + carpetsPrice.box_two.recommended,
          "0/0",
        ];
      }
      order += 1;
      const buttonWrapBox = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap boxs",
      }).appendTo(".upsale-Banner");
      $(`<div class="order">${order}</div>`).appendTo(buttonWrapBox);
      $('<h5 class="variant name">' + texts.suitcase_boxes + "</h5>").appendTo(buttonWrapBox);
      const parameterWrap2 = $("<div>", {
        class: "parameter-cars",
      }).appendTo(buttonWrapBox);
      const name = $("h1").text();
      console.log(name);
      let prefix = "";
      if (name.includes("HEXA")) {
        prefix = "hexa-";
      } else if (name.includes("STRIPE")) {
        prefix = "stripe-";
      }

      $(boxsText).each(function (e) {
        createUpsaleButton(
          "https://cdn.myshoptet.com/usr/581408.myshoptet.com/user/documents/upload/assets/new/" + prefix + boxsImage[e],
          this,
          parameterWrap2,
          boxsValue[e],
          "config",
          priceArray[e],
          true,
          texts,
        );
      });
    }

    $("<div>", { class: "content-wrap" }).insertAfter(".p-info-wrapper .detail-parameters");

    // $("button.btn.btn-lg.btn-conversion.add-to-cart-button").addClass("upsale");
    // $(".add-to-cart").on("click", "button.btn.btn-lg.btn-conversion.add-to-cart-button.upsale", function (e) {
    //   e.stopPropagation();
    //   e.preventDefault();
    //   createUpsalePopup();
    // });

    // Akordeon funkcionalita pro position-wrap a parameter-wrap elementy
    $(document).on(
      "click",
      ".position-wrap .order, .position-wrap .variant.name, .parameter-wrap .order, .parameter-wrap .variant.name, .parameter-wrap h5",
      function (e) {
        e.preventDefault();
        const clickedWrap = $(this).closest(".position-wrap, .parameter-wrap");

        // Pokud je již aktivní, zavři ho
        if (clickedWrap.hasClass("active")) {
          clickedWrap.removeClass("active");
          return;
        }

        // Zavři všechny ostatní position-wrap a parameter-wrap elementy
        $(".position-wrap, .parameter-wrap").removeClass("active");

        // Otevři kliknutý element
        clickedWrap.addClass("active");

        const elementType = clickedWrap.hasClass("position-wrap") ? "position-wrap" : "parameter-wrap";
        const elementName = clickedWrap.find(".variant.name, h5").first().text() || "Unnamed";
        console.log(`Otevřen ${elementType}:`, elementName);
      },
    );

    // Funkcionalita pro tlačítko "Přejít k dalšímu kroku"
    $(document).on("click", ".next-step-button", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const currentWrap = $(this).closest(".position-wrap, .parameter-wrap");
      const allWraps = $(".position-wrap, .parameter-wrap");
      const currentIndex = allWraps.index(currentWrap);

      // Najdi následující wrap element
      if (currentIndex < allWraps.length - 1) {
        const nextWrap = allWraps.eq(currentIndex + 1);

        // Zavři současný element
        currentWrap.removeClass("active");

        // Otevři následující element
        nextWrap.addClass("active");

        console.log("Přechod k dalšímu kroku:", nextWrap.find(".variant.name, h5").first().text() || "Unnamed");
      } else {
        console.log("Konfigurace dokončena");
        // Zavři všechny elementy
        allWraps.removeClass("active");

        // Můžeme zde přidat další logiku pro dokončení konfigurace
        // například zvýraznění tlačítka "Přidat do košíku" nebo zobrazení shrnutí
      }

      // Aktualizuj texty tlačítek po každé změně
      setTimeout(() => {
        updateButtonTexts();
      }, 50);
    });

    // Přidání tlačítek "Přejít k dalšímu kroku" do všech wrap elementů
    function addNextStepButtons() {
      const allWraps = $(".position-wrap, .parameter-wrap");

      allWraps.each(function (index) {
        const $wrap = $(this);

        // Pokud už tlačítko existuje, nepřidávej ho znovu
        if ($wrap.find(".next-step-button").length > 0) {
          return;
        }

        // Určí text tlačítka podle pozice
        const isLast = index === allWraps.length - 1;
        let buttonText = isLast ? "Dokončit konfiguraci" : "Přejít k dalšímu kroku";
        if (dataLayer[0].shoptet.language == "sk") {
          buttonText = isLast ? "Dokončiť konfiguráciu" : "Prejsť k ďalšiemu kroku";
        }
        const buttonClass = isLast ? "next-step-button finish-button" : "next-step-button";

        // Přidej tlačítko na konec wrap elementu
        $("<button>", {
          class: buttonClass,
          text: buttonText,
          type: "button",
        }).appendTo($wrap);
      });
    }

    // Funkce pro aktualizaci textů tlačítek
    function updateButtonTexts() {
      const allWraps = $(".content-wrap .parameter-wrap.parameter-undefined");

      allWraps.each(function (index) {
        const $wrap = $(this);
        const $button = $wrap.find(".next-step-button");

        if ($button.length > 0) {
          const isLast = index === allWraps.length - 1;
          console.log(index);
          console.log(isLast);
          const buttonText = isLast ? "Dokončit konfiguraci" : "Přejít k dalšímu kroku";

          // Aktualizuj text a třídu
          $button.text(buttonText);
          $button.toggleClass("finish-button", isLast);
        }
      });
    }

    // Observer pro sledování změn v DOMu a přidání tlačítek do nových elementů
    const observer = new MutationObserver(function (mutations) {
      let shouldAddButtons = false;
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            // Element node
            if (
              $(node).hasClass("position-wrap") ||
              $(node).hasClass("parameter-wrap") ||
              $(node).find(".position-wrap, .parameter-wrap").length > 0
            ) {
              shouldAddButtons = true;
            }
          }
        });
      });

      if (shouldAddButtons) {
        setTimeout(() => {
          console.log("Přidání tlačítek---------");
          addNextStepButtons();
          updateButtonTexts(); // Aktualizuj texty po přidání nových elementů
        }, 400); // Malé zpoždění pro jistotu
      }
    });

    // Začni sledovat změny v DOMu
    if (document.querySelector(".p-info-wrapper")) {
      observer.observe(document.querySelector(".p-info-wrapper"), {
        childList: true,
        subtree: true,
      });
    }

    firstPage(texts);

    // Spusť přidání tlačítek po načtení firstPage (i když skončí předčasně)
    setTimeout(() => {
      addNextStepButtons();
      updateButtonTexts();
    }, 100);

    const pairVariantList = JSON.parse(setupData.settings.pairVariantList);
    const pairedOrders = {};
    let orders = 1;
    const header = $("h1").text();
    if (header.includes("box")) {
      orders = 1;

      createOptions("box", orders);
    }
    createBoxConfig();

    $(".detail-parameters .variant-list select").each(function () {
      orders += 1;
      const position = this;
      createOptions(position, orders);
    });

    if (header.includes("box")) {
      orders += 1;
      createOptions("sizes", orders);
      return;
    }

    $(".detail-parameters .surcharge-list select").each(function () {
      const id = $(this).attr("data-parameter-id");

      if (id == "37" || id == "60" || id == "88" || id == "89" || id == "47" || id == "74") return;

      let sharedOrder = null;
      pairVariantList.forEach((pair) => {
        if (pair.includes(parseInt(id))) {
          sharedOrder = pair;
        }
      });

      if (sharedOrder) {
        if (pairedOrders[sharedOrder]) {
          orders = pairedOrders[sharedOrder];
        } else {
          orders += 1;
          pairedOrders[sharedOrder] = orders;
        }
      } else {
        orders += 1;
      }

      console.log(id);
      const position = this;
      createOptions(position, orders);
      console.log(pairVariantList);
    });
    console.log("clickaaaa");

    if ($("html[lang='cs']").length) {
      $(".p-variants-block .surcharge-list:contains('Velikost boxu') option[data-index='0']").text("Zvolte velikost boxu");
      $(".p-variants-block .surcharge-list:contains('Rozměr 2. Boxu') option[data-index='0']").text("Zvolte velikost 2.boxu");

      $(".p-variants-block .surcharge-list:contains('Rozměr boxu') option[data-index='0']").text("Zvolte velikost boxu");
      $(".p-variants-block .surcharge-list:contains('Velikost 2. Boxu') option[data-index='0']").text("Zvolte velikost 2.boxu");

      $(".p-variants-block .surcharge-list:contains('Barva boxu') option[data-index='0']").text("Zvolte barvu boxu");
      $(".p-variants-block .surcharge-list:contains('Barva 2. boxu') option[data-index='0']").text("Zvolte barvu 2.boxu");

      $(".p-variants-block .surcharge-list:contains('Umístění volantu') option[data-index='0']").text("Prosím, vyberte umístění volantu");
    }
    if ($("html[lang='sk']").length) {
      $(".p-variants-block .surcharge-list:contains('Veľkosť boxu') option[data-index='0']").text("Zvoľte veľkosť boxu");
      $(".p-variants-block .surcharge-list:contains('Rozmer 2. Boxu') option[data-index='0']").text("Zvoľte veľkosť 2.boxu");

      $(".p-variants-block .surcharge-list:contains('Rozmer boxu') option[data-index='0']").text("Zvoľte veľkosť boxu");
      $(".p-variants-block .surcharge-list:contains('Veľkosť 2. Boxu') option[data-index='0']").text("Zvoľte veľkosť 2.boxu");

      $(".p-variants-block .surcharge-list:contains('Farba boxu') option[data-index='0']").text("Zvoľte farbu boxu");
      $(".p-variants-block .surcharge-list:contains('Farba 2. boxu') option[data-index='0']").text("Zvoľte farbu 2.boxu");

      $(".p-variants-block .surcharge-list:contains('Umiestenie volantu') option[data-index='0']").text("Prosím,vyberte umiestnenie volantu");
    }

    $(".navigatte-button").on("click", function () {
      const option = $(this).attr("data-option").split("-");
      const optionName = option[1];
      $(".parameter-wrap").removeClass("active");
      $(`.parameter-wrap:eq(${optionName})`).addClass("active");
      $(".navigatte-button").removeClass("active");
      $(`.navigatte-button:eq(${optionName})`).addClass("active");
    });
    console.log("clickaaaa");
  }
}

// Single event listener for .upsale-button
$(document).on("click", ".upsale-button", function (e) {
  // Check if the clicked element is within .upsale-buttons.trunk
  updateUpsale(this, e);
});

$(document).on("click", ".close-btn.close", function () {
  $(this).parents(".upsale-Banner").removeClass("showConf");
  $("select.parameter-id-" + boxy + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box1 + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box2 + ".surcharge-parameter").val(0);
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button").removeClass("active");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button.none").addClass("active");
  $(".config-wrap .option-button").removeClass("active");
  updateUpsale(this);
});
$(document).on("click", ".boxs .upsale-button.none", function (e) {
  console.log("clickaaaa");
  // Check if the clicked element is within .upsale-buttons.  $("select.parameter-id-" + boxy + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box1 + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box2 + ".surcharge-parameter").val(0);
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button").removeClass("active");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button.none").addClass("active");
  $(".config-wrap .option-button").removeClass("active");
  updateUpsale(this);
});
/**
 * Initializes the first page of the upsale section.
 */
function firstPage(texts) {
  if (dataLayer[0].shoptet.product.id == "2427") {
    setTimeout(function () {
      $(".orders-1").addClass("active");
    }, 200);
    return;
  }
  // Nejprve krok 0: výběr vzoru
  const patterns = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config", // krok 0 není otevřený
  }).appendTo(".content-wrap");
  $('<div class="order">0</div>').appendTo(patterns);
  $('<h5 class="variant name">' + texts.carpet_quilting_pattern + "</h5>").appendTo(patterns);

  const patternsWrap = $("<div>", {
    class: "parameter-cars patterns-wrap",
  }).appendTo(patterns);
  let diamondurl = $(".detail-parameters tr:contains('diamond') td").text();
  let hexaurl = $(".detail-parameters tr:contains('hexa') td").text();
  let stripeurl = $(".detail-parameters tr:contains('stripe') td").text();
  console.log(diamondurl);

  const diamond = $(
    `<a href="${diamondurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/diamont.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> DIAMOND LINE</div></a>`,
  ).appendTo(patternsWrap);
  const hexa = $(
    `<a href="${hexaurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/hesaline.jpg?v1" alt="Pattern1.jpg"><div class="banner-header">HEXA LINE</div></a>`,
  ).appendTo(patternsWrap);
  const stripe = $(
    `<a href="${stripeurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/stripe-line.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> STRIPE LINE</div></a>`,
  ).appendTo(patternsWrap);
  console.log(diamondurl);

  if (diamondurl == "active") {
    diamond.addClass("active");
  }
  if (hexaurl == "active") {
    hexa.addClass("active");
  }
  if (stripeurl == "active") {
    stripe.addClass("active");
  }

  // Krok 1: specifikace vozidla (otevřený defaultně)
  const pageWrap = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active",
  }).appendTo(".content-wrap");
  $('<div class="order">1</div>').appendTo(pageWrap);
  $('<h5 class="variant name">' + texts.vehicle_specifications + "</h5>").appendTo(pageWrap);

  const wheelWrao = $("<div>", {
    class: "parameter-cars wheel-Position ",
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label wheel",
    text: texts.wheel_position,
  }).appendTo(wheelWrao);
  const wheelOption = $("<div>", {
    class: "option-wrap",
  }).appendTo(wheelWrao);
  $(
    `<div class='button option-button active' data-value='left'><span>EU</span><img src='/user/documents/upload/assets/image/Layer_left.png' ><div class='text'>Vľavo</div></div>`,
  ).appendTo(wheelOption);
  $(
    `<div class='button option-button' data-value='right'><img src='/user/documents/upload/assets/image/Layer_right.png' ><div class='text'>Vpravo</div><span>UK</span></div>`,
  ).appendTo(wheelOption);

  const sitposition = $("<div>", {
    class: "parameter-cars sit-Position",
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label sit",
    text: texts.seat_position,
  }).appendTo(sitposition);
  const sitOption = $("<div>", {
    class: "option-wrap",
  }).appendTo(sitposition);
  $(`<div class='button option-button ' data-value='pass-2'><div class='text'>2</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-4'><div class='text'>4</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button active' data-value='pass-5'><div class='text'>5</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-6'><div class='text'>6</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-7'><div class='text'>7</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-8'><div class='text'>8</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-9'><div class='text'>9</div></div>`).appendTo(sitOption);

  $(".can-toggle.wheel-option").on("click", function () {
    if ($(this).find("input").is(":checked")) {
      $("select.parameter-id-37.surcharge-parameter").val(253);
    }
  });

  $(".type-option.button").on("click", function () {
    $(this).addClass("active").siblings().removeClass("active");
    const value = $(this).attr("data-value");
    $("select.parameter-id-22.surcharge-parameter").val(value);
  });
}

function condownMessage(position, time, text) {
  const wrap = $("<div>", {
    class: "countdown-wrap",
  }).appendTo(position);

  $("<div>", {
    class: "label",
    html: text + "<span></span>",
  }).appendTo(wrap);

  condown(time, ".countdown-wrap .label span");
}

function condown(time, selector) {
  const endTime = new Date().getTime() + time * 60 * 1000; // Převod minut na milisekundy

  function updateCountdown() {
    const now = new Date().getTime();
    const remainingTime = endTime - now;

    if (remainingTime <= 0) {
      $(selector).text("čas vypršel!");
      clearInterval(countdownInterval);
    } else {
      const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
      const seconds = Math.floor((remainingTime / 1000) % 60);
      $(selector).text(`${minutes} min ${seconds} sec`);
    }
  }

  const countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();
}

$("body").on("click", ".btn.choice-Model", function () {
  createModelInfo();
});

$("body").on("click", ".position-wrap ", function () {
  createModelInfo();
});

function createModelInfo() {
  const model = sessionStorage.getItem("model");
  console.log(model);
  const type = sessionStorage.getItem("carType");
  console.log("type -----------", type);
  if (type && type !== "undefined") {
    console.log("type", type);
    const paramId = dataLayer[0].shoptet.projectId == "581408" ? 47 : 74;

    const value = $(`select.parameter-id-${paramId} option`)
      .filter(function () {
        return $(this).text().toLowerCase().includes(type.toLowerCase());
      })
      .val();

    if (value) {
      $(`select.parameter-id-${paramId}`).val(value).trigger("change");
    }
  }
  if ($(".in-index")[0]) return;

  if (model && (model.includes("Značka") || model.trim() === "Model" || model.includes("Rok výroby") || model.includes("Typ auta"))) {
    return;
  }

  if (model) {
    console.log("model", model);
    // const modelInfo = $("<section>").attr("id", "model-info").insertBefore(".content-wrap");

    if ($(".model-info")[0]) return;
    const infoWrap = $("<div>").addClass("model-info").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
    $("<div>").addClass("header-info").text("Garancia kompatibility s Vaším vozidlom").appendTo(infoWrap);
    $("<div>").addClass("model-text").text(model).appendTo(infoWrap);

    // $("<div>").addClass("setup-model").text("Upraviť").appendTo(infoWrap);

    $(".setup-model").on("click", function () {
      console.log("setup model");
      $("section#model-selector").show();
      modelInfo.remove();
    });
  }
  // $('<div class="model-info"> <span class="model">Model:</span> <span class="model-name">' + model + "</span></div>").insertBefore(
  //   "section#model-selector"
  // );
}

function createpopup(texts) {
  if ($(".overflow")[0]) return;
  const overflow = $("<div>", {
    class: "overflow",
    style: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(3px);
    `,
  }).appendTo("body");

  const popup = $("<div>", {
    style: `
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      max-width: 450px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: fadeIn 0.3s ease-out;
    `,
  }).appendTo(overflow);

  $("<h3>", {
    text: texts.no_model_select,
    style: `
      margin-bottom: 30px;
      font-size: 22px;
      color: #333;
      font-weight: 500;
      line-height: 1.4;
    `,
  }).appendTo(popup);

  $("<button>", {
    text: texts.i_understand,
    class: "btn",
    style: `
      padding: 12px 40px;
      font-size: 16px;
      border: none;
      border-radius: 6px;
      background: #c49b31;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
      font-weight: 500;
      &:hover {
        background: #c49b31;
      }
    `,
    click: function () {
      $(".overflow").remove();
      overflow.fadeOut(200, function () {
        $(this).remove();

        let scrollselector = ".col-xs-12.col-lg-6.p-info-wrapper";
        if ($("body").hasClass("mobile")) {
          scrollselector = ".p-thumbnails-wrapper";
        }
        // Zobrazit model selector bez scrollování
        $("#model-selector").fadeIn(200);
        $(".position-wrap.parameter-cars.parameter-wrap.base-config.active").removeClass("active");
        $(".position-wrap.parameter-cars.parameter-wrap.base-config:eq(0)").addClass("active");
      });
      $("#model-selector").addClass("errorToCart");
      // vzroluj o  100px nad nejvrchnější errorToCart

      setTimeout(() => {
        $("#model-selector").removeClass("errorToCart");
      }, 2000);
    },
  }).appendTo(popup);

  // Add animation keyframes
  $("<style>")
    .text(
      `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
    )
    .appendTo("head");
}

function calculateStandartPrice(diference) {
  setTimeout(() => {}, 1000);
  console.log(diference);

  const price = Number(
    $(".p-final-price-wrapper span.calculated-price:eq(0)")
      .text()
      .replace(/[^0-9]/g, ""),
  );

  console.log("price", price);

  // Vypočítej novou standard cenu jako aktuální cena + 60%
  let newStandartPrice = Math.round(price * 1.6); // price + 60%

  console.log("price", price, "newStandartPrice (price + 60%)", newStandartPrice);

  // Přidej ceny z aktivních upsale tlačítek
  $(".upsale-button.active").each(function () {
    const priceText = $(this).find(".save").attr("data-save");
    console.log(priceText);
    if (priceText) {
      const priceValue = Number(priceText.replace(/[^0-9]/g, ""));
      console.log("priceValue", priceValue);
      // newStandartPrice += priceValue;
      console.log("newStandartPrice s upsale", newStandartPrice);
    }
  });

  // Vypočítej procentuální slevu z nové standard ceny
  const discount = Math.round(((newStandartPrice - price) / newStandartPrice) * 100);
  console.log("discount", discount);
  if (newStandartPrice < 100) return;
  // Aktualizuj zobrazení cen
  $(".p-final-price-wrapper .price-save").text("–" + discount + " %");
  $(".p-final-price-wrapper .price-standard span").not(".price-save").text(NumToPrice(newStandartPrice));
  updateBoxPrice();
}
window.allowDirectAddToCart = false;

function createUpsalePopup() {
  if (!$(".upsale-button.none.active")[1]) return;
  createPop();
  $(".ti-widget-container").addClass("upsale");
  $("<div>", {
    class: "h2",
    text: "Iba teraz za zvýhodnenú cenu!",
  }).appendTo(".ti-widget-container");
  $("<div>", {
    class: "description",
    text: " Doplňte svoju objednávku o kufrové koberčeky alebo úložné boxy s výraznou zľavou. Ponuka platí len chvíľu!",
  }).appendTo(".ti-widget-container");
  $("<div>", {
    class: "button btn open-upsale",
    text: "Využiť zvýhodnenú ponuku!",
  }).appendTo(".ti-widget-container");
  $("<div>", {
    class: "prefix",
    text: "Len počas tejto objednávky môžete získať koberčeky do kufra alebo úložné boxy za extrémne zvýhodnenú cenu. Chráňte a organizujte svoj kufor so štýlom!",
  }).appendTo(".ti-widget-container");

  $(".button.btn.open-upsale").on("click", function () {
    $(".overflow").remove();
    $(".upsale-wrap").addClass("active");
  });
}

window.allowDirectAddToCart = false;

// $("button.btn-conversion.add-to-cart-button").on("click", function (e) {
//   if (!window.allowDirectAddToCart && $(".upsale-button.none.active")[1]) {
//     showUpsalePopup();
//     e.stopPropagation();
//     e.preventDefault();
//     return;
//   }
//   window.allowDirectAddToCart = false; // reset pro další kliknutí
// });
function updateUpsale($this, event) {
  $(".image-wrap").remove();
  const trunk = $($this).closest(".upsale-buttons.trunk");
  const boxs = $($this).closest(".upsale-buttons.boxs");
  // Tady buď trunk už minimalizovaný je, tak ho zruším,
  // nebo ho minimalizuju po kliknutí
  if (trunk.length) {
    if (trunk.hasClass("minimalize")) {
      event.stopPropagation();
      trunk.removeClass("minimalize");
    } else {
      // Zobrazím boxs
      $(".upsale-buttons.boxs").show();
      // Po 200ms přidám minimalize
      setTimeout(() => {
        trunk.addClass("minimalize");
      }, 200);
    }
  } else if (boxs.length) {
    if (boxs.hasClass("minimalize")) {
      event.stopPropagation();
      boxs.removeClass("minimalize");
      setTimeout(() => {
        $(".upsale-Banner.showConf").removeClass("showConf");
      }, 200);
    } else {
    }
  }

  // Zjistím value
  const value = $($this).attr("value")?.split("-");
  console.log(value);

  if (value) {
    // Odeberu active ze všech tlačítek v boxs
    if (boxs.length) {
      $(".upsale-buttons.boxs .upsale-button").removeClass("active");
    }

    // Přepínání active
    if ($($this).hasClass("active")) {
      $($this).removeClass("active");
      $("select.surcharge-parameter.parameter-id-" + value[0]).val(0);
    } else {
      // Pokud je to radio, nejdřív deaktivuju ostatní
      if ($($this).hasClass("radio")) {
        $(".upsale-button.radio ").removeClass("active");
      }
      $($this).addClass("active");
      $("select.surcharge-parameter.parameter-id-" + value[0]).val(value[1]);
    }

    // Pokud je config, zobrazím konfiguraci
    if ($($this).hasClass("config")) {
      $($this).parents(".upsale-Banner").addClass("showConf");
    }

    // Ukázka, jak schovat/zobrazit nějaké prvky
    if (value[0] === "conf1") {
      // conf1: show only Solo box (parameter 78), hide other box parameters (box1/box2)
      const prices = (boxsPrice[0] || "0/0").split("/")[0];
      // IDs: box1 => box1, box2 => box2, solo => 78
      const soloId = 78;
      $(".parameter-wrap.parameter-" + box1).hide();
      $(".parameter-wrap.parameter-" + box2).hide();
      $(".parameter-wrap.parameter-" + soloId).show();
      // update solo price element specifically
      const $soloPrice = $(".parameter-wrap.parameter-" + soloId).find('.price.price-standart');
      $soloPrice.attr('data-price', prices);
      if ($soloPrice.length) $soloPrice.text(NumToPrice(prices));
    } else if (value[0] === "conf2") {
      // conf2: hide Solo box, show other box parameters (box1/box2)
      const prices = (boxsPrice[1] || "0/0").split("/")[0];
      const soloId = 78;
      $(".parameter-wrap.parameter-" + soloId).hide();
      $(".parameter-wrap.parameter-" + box1).show();
      $(".parameter-wrap.parameter-" + box2).show();
      // update box1 price element specifically
      const $box1Price = $(".parameter-wrap.parameter-" + box1).find('.price.price-standart');
      $box1Price.attr('data-price', prices);
      if ($box1Price.length) $box1Price.text(NumToPrice(prices));
    }
  }
  // Delay for price update
  setTimeout(() => {
    if (typeof shoptet !== "undefined" && shoptet.surcharges?.updatePrices) {
      shoptet.surcharges.updatePrices();
    } else {
      console.warn("Funkce `shoptet.surcharges.updatePrices` není dostupná.");
    }
  }, 100);
  setTimeout(() => {
    calculateStandartPrice(diference);
  }, 200);
}

function updateBoxPrice() {
  $(".box-config .parameter-wrap").each(function () {
    const price = Number($(this).find(".price.price-standart").attr("data-price"));
    const addPrice = Number($(this).find(".button.option-button.text.active .price").attr("data-price"));
    console.log(price, addPrice);

    if (addPrice) {
      $(this)
        .find(".price.price-standart")

        .text(NumToPrice(price + addPrice));
    }
  });
}

function createUpsaleInfo(texts) {
  const upsaleBanner = $("<div>", {
    class: "upsale-Banner",
  }).insertAfter(".detail-parameters");
  if ($(".surcharge-list")[4]) {
    return;
  }
  const bannerWrap = $('<div class="updale-banner-info"></div>').appendTo(upsaleBanner);
  $('<icon class="icon">!</icon>').appendTo(bannerWrap);

  const productName = $("h1").text().toLowerCase();

  const idUpsaleBanner = [2424, 2427, 2430, 2433, 2421, 2436, 2439, 619, 622, 625, 628, 631, 634];

  if (idUpsaleBanner.includes(dataLayer[0].shoptet.product.id)) {
    $('<div class="h4">').text(texts.upsale_banner_header).appendTo(bannerWrap);
    $("<span>").html(texts.upsale_banner_text).appendTo(bannerWrap);
    $(texts.upsale_link).appendTo(bannerWrap);
  } else {
    $('<div class="h4">').text(texts.upsale_banner_header).appendTo(bannerWrap);
    $("<span>").html(texts.upsale_banner_text_2Layers).appendTo(bannerWrap);
  }
}
$("body").on("click", ".button.option-button", function (e) {
  console.log("click");
  createModelInfo();

  $(this).parents(".parameter-wrap").removeClass("goToAction").removeClass("errorToCart");
  $("body").removeClass("disabled-add-to-cart");
  $(this).addClass("active").siblings().removeClass("active");
  priceActualization(e);

  setTimeout(() => {
    calculateStandartPrice(diference);
  }, 100);

  // Aktualizuj texty tlačítek po kliknutí na option button
  setTimeout(() => {
    if (typeof updateButtonTexts === "function") {
      updateButtonTexts();
    }
  }, 200);

  if (!$(".goToAction")[0]) {
    console.log("goToAction");

    $(".upsale-Banner").fadeIn(400);

    $(".upsale-Banner").show();
    $(".upsale-buttons.position-wrap.parameter-cars.parameter-wrap.boxs").hide();

    if ($(".upsale-buttons.position-wrap.trunk .upsale-button.radio.active")[0]) {
      $(".upsale-buttons.position-wrap.parameter-cars.parameter-wrap.boxs").show();
    }
    if (!$(".parameter-id-" + koberce)[0]) {
      $(".upsale-buttons.boxs").show();
    }
  }
});
function priceActualization(e) {
  const header = $("h1").text();
  if (header.includes("box")) {
    $(".surcharge-list select").val(0);
  }
  $(".image-wrap").remove();
  $(".button.option-button.active").each(function () {
    const value = $(this).attr("data-value");
    const variant = $(this).attr("data-variant");

    const parameterId = $(this).parents(".parameter-wrap").attr("data-parameterid");
    const image = $(this).find("img").attr("src");
    $(".navigatte-button.parameterNav" + parameterId).attr("style", " background-image: url(" + image + ");");
    console.log(parameterId);

    $(".parameter-id-" + variant).val(value);
    shoptet.surcharges.updatePrices();
    if (variant == 4) {
    }
    const image2 = $(this).find("img").attr("src");
    console.log(image2);

    console.log(".parameter-wrap.parameter-" + parameterId);
    const imageWrap = $("<div>", {
      class: "image-wrap",
    })
      .appendTo(".parameter-wrap.parameter-" + parameterId)
      .fadeIn(1000);
    $("<img>", { src: image2 }).appendTo(imageWrap);
  });

  $(".parameter-wrap").not($(e.target).parents(".parameter-wrap")).find(".image-wrap").remove();
}

function changeThumbnails() {
  $(".p-thumbnails-inner").clone().addClass("slick").appendTo(".p-image-wrapper");
  $(".p-thumbnails-inner.slick a.cbox-gal.cboxElement").remove();
  setInterval(() => {}, 1000);
  $(".p-thumbnails-inner.slick>div").slick({
    dots: true,
    centerMode: false,
    infinite: true,
    slidesToShow: 5.5,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 8000,
    arrows: true,

    responsive: [
      {
        breakpoint: 1600,
        settings: {
          slidesToShow: 5.5,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1480,
        settings: {
          slidesToShow: 5.5,
          slidesToScroll: 5,
        },
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,

          autoplay: false,
        },
      },
      // {
      //     breakpoint: 350,
      //     settings: {
      //         slidesToShow: 1,
      //         slidesToScroll: 1,
      //     },
      // },
    ],
  });
}
