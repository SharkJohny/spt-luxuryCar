/**
 * Initializes the product page.
 */

const standartPrice = Number(
  $(".p-final-price-wrapper .price-standard span")
    .text()
    .replace(/[^0-9]/g, "")
);
const price = Number(
  $("span.calculated-price")
    .text()
    .replace(/[^0-9]/g, "")
);

const diference = standartPrice - price;

console.log(diference);
export function initProduct(setupData) {
  if ($(".id-751")[0]) {
    $(".benefitBanner__item").remove();
  }
  $(".p-detail-inner .p-detail-info").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  $(".p-detail-inner .p-detail-inner-header").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  $(".benefitBanner.position--benefitProduct .benefitBanner__item").insertBefore(".col-xs-12.col-lg-6.p-info-wrapper");
  createModelInfo();
  priplatky(setupData);

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

  $("button.btn.btn-lg.btn-conversion.add-to-cart-button").on("click", function (e) {
    if (!$(".upsale-buttons .active")[1]) {
      e.preventDefault();
      e.stopPropagation();
      // Přidej errorToCart pouze na ty upsale-buttons, kde není žádné .active tlačítko
      $(".upsale-buttons").each(function () {
        if (!$(this).find(".active").length) {
          $(this).addClass("errorToCart");
          setTimeout(() => {
            $(this).removeClass("errorToCart");
          }, 2000);
        }
      });
    }
  });
}

/**
 * Initializes the upsale section.
 */
function priplatky(setupData) {
  let order = 6;

  if ($(".type-detail").length) {
    $("<div>", {
      class: "upsale-wrap",
    }).insertAfter(".detail-parameters");

    const upsaleBanner = $("<div>", {
      class: "upsale-Banner",
    }).insertAfter(".detail-parameters");
    const bannerWrap = $('<div class="updale-banner-info"></div>').appendTo(upsaleBanner);
    $('<icon class="icon">!</icon>').appendTo(bannerWrap);
    $('<div class="h4">').text("kúp viac za menej").appendTo(bannerWrap);
    $("<span>").text("Ušetri až 40 % na rohoži a boxoch do kufra, ak objednáš spolu s kobercami pod sedadlá.").appendTo(bannerWrap);
    if ($(".parameter-id-89")[0]) {
      // $(upsaleBanner).hide();
      // condownMessage(upsaleBanner, 30, "Zvýhodněná nabídka na přislušenství platí ještě: ");

      const buttonWrap = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap trunk",
      }).appendTo(upsaleBanner);
      $(`<div class="order">${order}</div>`).appendTo(buttonWrap);
      $('<h5 class="variant name">autokoberce do kufru</h5>').appendTo(buttonWrap);
      const parameterWrap = $("<div>", {
        class: "parameter-cars",
      }).appendTo(buttonWrap);

      const carpetsText = setupData.settings.carpetsText.split(",");
      const carpetsValue = setupData.settings.carpetsValue.split(",");
      const carpetsImage = setupData.settings.carpetsImage.split(",");
      const carpetsPrice = setupData.settings.carpetsPrice.split(",");
      $(carpetsText).each(function (e) {
        createUpsaleButton(
          "https://cdn.myshoptet.com/usr/689946.myshoptet.com/user/documents/upload/assets/new/" + carpetsImage[e],
          this,
          parameterWrap,
          carpetsValue[e],
          "radio",
          carpetsPrice[e],
          false
        );
      });
    }
    // createUpsaleButton(
    //   "https://cdn.myshoptet.com/usr/689946.myshoptet.com/user/documents/upload/assets/boxy.jpg",
    //   "LUXUSNÉ BOXY DO KUFRU NA MIERU",
    //   buttonWrap,
    //   "conf",
    //   "config"
    // );
    if ($(".parameter-id-95")[0]) {
      const boxsText = setupData.settings.boxsText.split(",");
      const boxsValue = setupData.settings.boxsValue.split(",");
      const boxsImage = setupData.settings.boxsImage.split(",");
      const boxsPrice = setupData.settings.boxsPrice.split(",");

      order += 1;
      const buttonWrapBox = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap boxs",
      }).appendTo(upsaleBanner);
      $(`<div class="order">${order}</div>`).appendTo(buttonWrapBox);
      $('<h5 class="variant name">boxy do kufra</h5>').appendTo(buttonWrapBox);
      const parameterWrap2 = $("<div>", {
        class: "parameter-cars",
      }).appendTo(buttonWrapBox);

      $(boxsText).each(function (e) {
        createUpsaleButton(
          "https://cdn.myshoptet.com/usr/689946.myshoptet.com/user/documents/upload/assets/new/" + boxsImage[e],
          this,
          parameterWrap2,
          boxsValue[e],
          "config",
          boxsPrice[e],
          true
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

    firstPage();

    const pairVariantList = JSON.parse(setupData.settings.pairVariantList);
    const pairedOrders = {};
    let orders = 2;

    createBoxConfig();

    $(".detail-parameters .variant-list select").each(function () {
      orders += 1;
      const position = this;
      createOptions(position, orders);
    });
    $(".detail-parameters .surcharge-list select").each(function () {
      const id = $(this).attr("data-parameter-id");

      if (id == "37" || id == "22" || id == "89") return;

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

    $(".button.option-button").on("click", function () {
      createModelInfo();
      $(this).parents(".parameter-wrap").removeClass("goToAction");
      $("body").removeClass("disabled-add-to-cart");
      const value = $(this).attr("data-value");
      const variant = $(this).attr("data-variant");
      $(this).addClass("active").siblings().removeClass("active");
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

      $(".image-wrap").remove();

      const imageWrap = $("<div>", {
        class: "image-wrap",
      })
        .appendTo(".parameter-wrap.parameter-" + parameterId)
        .fadeIn(1000);
      $("<img>", { src: image2 }).appendTo(imageWrap);

      calculateStandartPrice(diference);

      if (!$(".goToAction")[0]) {
        console.log("goToAction");

        $(".upsale-Banner").fadeIn(400);

        $(".upsale-Banner").show();
        $(".upsale-buttons.position-wrap.parameter-cars.parameter-wrap.boxs").hide();

        if ($(".upsale-buttons.position-wrap.trunk .upsale-button.radio.active")[0]) {
          $(".upsale-buttons.position-wrap.parameter-cars.parameter-wrap.boxs").show();
        }
        if (!$(".parameter-id-89")[0]) {
          $(".upsale-buttons.boxs").show();
        }
      }
    });

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
  }
}

/**
 * Creates an upsale button with an image and text, and appends it to the specified position.
 *
 * @param {string} img - The URL of the image to be displayed on the button.
 * @param {string} text - The text to be displayed on the button.
 * @param {jQuery|HTMLElement} position - The element where the button will be appended.
 * @param {number} [value] - Optional value attribute for the button.
 */
function createUpsaleButton(img, text, position, value, type, price, prefix) {
  // console.log("price", price);
  if (!img || !text || !position || !price) {
    console.error("Invalid parameters passed to createUpsaleButton");
    return;
  }
  // console.log(price.split("/"));
  let priceText = price.split("/");

  let typeClass = type;
  if (type == "config" && value == 0) {
    typeClass = "none";
  }

  const buttonHTML = `
    <div class="upsale-button  ${typeClass}" value="${value}">
      <img src="${img}?2" alt="${text}" />
   
      <div class="banner-header"><span>${text}</span>
    </div>
  `;

  //   $(position).append(buttonHTML);
  const button = $(buttonHTML).appendTo(position);
  if (priceText[0] == "0") return;
  const save = priceText[1] - priceText[0];
  let priceHTML = `<div class="price">${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}" >Ušetříte ${NumToPrice(save)}</div>`;
  if (prefix) {
    priceHTML = `<div class="price">od ${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}>Ušetříte až ${NumToPrice(save)}</div>`;
  }
  const positionadd = $(button).find(".banner-header");
  $(priceHTML).appendTo(positionadd);
  $(".upsale-Banner").hide();
}
// Single event listener for .upsale-button
$(document).on("click", ".upsale-button", function (e) {
  // Check if the clicked element is within .upsale-buttons.trunk

  $(".image-wrap").remove();
  const trunk = $(this).closest(".upsale-buttons.trunk");
  const boxs = $(this).closest(".upsale-buttons.boxs");
  // Tady buď trunk už minimalizovaný je, tak ho zruším,
  // nebo ho minimalizuju po kliknutí
  if (trunk.length) {
    if (trunk.hasClass("minimalize")) {
      e.stopPropagation();
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
      e.stopPropagation();
      boxs.removeClass("minimalize");
      setTimeout(() => {
        $(".upsale-Banner.showConf").removeClass("showConf");
      }, 200);
    } else {
    }
  }

  // Zjistím value
  const value = $(this).attr("value")?.split("-");
  console.log(value);

  if (!value) {
    console.error("Atribut 'value' není dostupný!");
    return;
  }

  // Odeberu active ze všech tlačítek v boxs
  if (boxs.length) {
    $(".upsale-buttons.boxs .upsale-button").removeClass("active");
  }

  // Přepínání active
  if ($(this).hasClass("active")) {
    $(this).removeClass("active");
    $("select.surcharge-parameter.parameter-id-" + value[0]).val(0);
  } else {
    // Pokud je to radio, nejdřív deaktivuju ostatní
    if ($(this).hasClass("radio")) {
      $(".upsale-button.radio").removeClass("active");
    }
    $(this).addClass("active");
    $("select.surcharge-parameter.parameter-id-" + value[0]).val(value[1]);
  }

  // Pokud je config, zobrazím konfiguraci
  if ($(this).hasClass("config")) {
    $(this).parents(".upsale-Banner").addClass("showConf");
  }

  // Ukázka, jak schovat/zobrazit nějaké prvky
  if (value[0] === "conf1") {
    $(".parameter-wrap.parameter-101.orders-8").hide();
  } else if (value[0] === "conf2") {
    $(".parameter-wrap.parameter-101.orders-8").show();
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
});
$(document).on("click", ".box-config .close-btn", function () {
  $(this).parents(".upsale-Banner").removeClass("showConf");
  // $(this).parents(".upsale-buttons").addClass("minimalize");
});

/**
 * Initializes the first page of the upsale section.
 */
function firstPage() {
  const wrap = $("<div>", {
    class: "navigatte-button class first",
    "data-option": "option-0",
  }).appendTo(".navidation-Wrap");

  const wheelval = $("select.parameter-id-37.surcharge-parameter").val();
  let typeVal = $("select.parameter-id-22.surcharge-parameter").val();

  if (wheelval == "") {
    $("select.parameter-id-37.surcharge-parameter").val(250);
  }
  if (typeVal == "") {
    const getModel = sessionStorage.getItem("carType");
    console.log(getModel);

    const value = $("select.parameter-id-22.surcharge-parameter option")
      .filter(function () {
        return $(this).text().indexOf(getModel) !== -1;
      })
      .val();

    console.log(value);

    $("select.parameter-id-22.surcharge-parameter").val(value);
    typeVal = value;
  }
  const pageWrap = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active",
  }).appendTo(".content-wrap");
  $('<div class="order">1</div>').appendTo(pageWrap);
  $('<h5 class="variant name">Špecifikácia vozidla</h5>').appendTo(pageWrap);

  const wheelWrao = $("<div>", {
    class: "parameter-cars wheel-Position ",
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label wheel",
    text: "pozícia volantu:",
  }).appendTo(wheelWrao);
  const wheelOption = $("<div>", {
    class: "option-wrap",
  }).appendTo(wheelWrao);
  $(
    `<div class='button option-button active' data-value='left'><span>EU</span><img src='https://689946.myshoptet.com/user/documents/upload/assets/image/Layer_left.png' alt='250.jpg'><div class='text'>Vľavo</div></div>`
  ).appendTo(wheelOption);
  $(
    `<div class='button option-button' data-value='right'><img src='https://689946.myshoptet.com/user/documents/upload/assets/image/Layer_right.png' alt='251.jpg'><div class='text'>Vpravo</div><span>UK</span></div>`
  ).appendTo(wheelOption);

  const sitposition = $("<div>", {
    class: "parameter-cars sit-Position",
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label sit",
    text: "miest na sedenie:",
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
  ////// výběr vzoru

  const patterns = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active",
  }).appendTo(".content-wrap");
  $('<div class="order">2</div>').appendTo(patterns);
  $('<h5 class="variant name">vzor prešívania koberca</h5>').appendTo(patterns);

  const patternsWrap = $("<div>", {
    class: "parameter-cars patterns-wrap",
  }).appendTo(patterns);
  let diamondurl = $(".detail-parameters tr:contains('diamond') td").text();
  let hexaurl = $(".detail-parameters tr:contains('hexa') td").text();
  let stripeurl = $(".detail-parameters tr:contains('stripe') td").text();
  console.log(diamondurl);
  if (diamondurl == "active") {
    diamondurl = "";
  }
  if (hexaurl == "active") {
    hexaurl = "";
  }
  if (stripeurl == "active") {
    stripeurl = "";
  }

  const diamond = $(
    `<a href="${diamondurl}" class="button option-button active" data-value="pattern1"><img src="/user/documents/upload/assets/banners/diamont.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> diamond LINE</div></a>`
  ).appendTo(patternsWrap);
  const hexa = $(
    `<a href="${hexaurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/hesaline.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> diamond LINE</div></a>`
  ).appendTo(patternsWrap);
  const stripe = $(
    `<a href="${stripeurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/stripe-line.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> diamond LINE</div></a>`
  ).appendTo(patternsWrap);

  if (diamondurl == "active") {
    diamond.addClass("active");
  }
  if (hexaurl == "active") {
    hexa.addClass("active");
  }
  if (stripeurl == "active") {
    stripe.addClass("active");
  }
}

/**
 * Creates options for a given position and order.
 *
 * @param {HTMLElement} position - The position element.
 * @param {number} orders - The order number.
 */
function createOptions(position, orders) {
  console.log(orders);
  let name = $(position).parents(".variant-list").find("th").text().trim();
  if (name == "") {
    name = $(position).parents(".surcharge-list").find("th").text().trim().replace("?", "");
  }

  const createSlug = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };
  let slug = createSlug(name);

  const options = $(position).find("option");
  const parameterId = $(position).attr("data-parameter-id");
  let optPosition = ".content-wrap";

  // if (orders == 6) {
  //   console.log("aaaaaaaaaaaaaaaaa");
  //   const wrapOwerflow = $("<div>", {
  //     class: "pop-ower",
  //   }).appendTo(".content-wrap ");
  //   const popup = $("<div>", {
  //     class: "pop-up-options",
  //   }).appendTo(wrapOwerflow);
  //   $("<div>", {
  //     class: "close-btn",
  //     text: "+",
  //   }).appendTo(popup);
  //   $("<div>", {
  //     class: "btn button-more",
  //     text: "Něco navíc?",
  //   }).appendTo("#options-wrap");
  // }

  let upsale = 4;
  if (shoptetData.product.id == 3011 || shoptetData.product.id == 356) {
    $(".benefitBanner__content").hide();
    upsale = 5;
  }
  if (orders > upsale) {
    optPosition = ".config-wrap";
  }
  if (orders <= upsale) {
    $("<div>", {
      class: `navigatte-button class${orders} ${slug} parameterNav${parameterId}`,
      "data-option": `option-${orders}`,
    }).appendTo(".navidation-Wrap");
  }

  $(".btn.button-more").on("click", function () {
    $(".pop-ower").addClass("show");
  });
  $(".close-btn").on("click", function () {
    $(".pop-ower").removeClass("show");
  });

  if (!$(`.orders-${orders}`)[0]) {
    const wrap = $("<div>", {
      class: `parameter-wrap parameter-${parameterId} orders-${orders}`,
      "data-parameterId": parameterId,
    }).appendTo(optPosition);
    if (orders <= upsale) {
      $(wrap).addClass("goToAction");
      $(wrap).addClass("base-config");
    }
    $("<div>", {
      class: "order",
      text: orders,
    }).appendTo(`.parameter-wrap.orders-${orders}`);
  }

  $(".navigatte-button:eq(0)").addClass("active");
  const paramerer = `.parameter-wrap.orders-${orders}`;

  $("<h5>", {
    class: "variant name",
    text: name,
  }).appendTo(paramerer);
  const optionsWrap = $("<div>", {
    class: "options-wrap",
  }).appendTo(paramerer);

  $(options).each(function () {
    const value = $(this).val();
    if (value == "") return;
    const textOption = $(this).text();
    const valueText = textOption.split("+");
    const nameSplit = valueText[0].split(":");

    const optionButton = $("<div>", {
      class: "button option-button",
      "data-value": value,
      "data-variant": parameterId,
    }).appendTo(optionsWrap);
    $("<div>", {
      text: textOption,
      class: "text",
    }).appendTo(optionButton);
    if (textOption.includes("cm")) {
      $("<div>", {
        class: "description",
        html: `<span>${nameSplit[0]}</span><div class='parm'> ${nameSplit[1]}</div><div class='price'>+ ${valueText[1]}</div>`,
      }).appendTo(optionButton);

      $(optionButton).addClass("text");
    } else if (textOption.includes("rad")) {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/variants/${parameterId}-${value}.png?8`,
      }).appendTo(optionButton);
      $("<div>", {
        class: "banner-header",
        html: `<span>${nameSplit[0]}</span><div class='price'>${valueText[1]}</div>`,
      }).appendTo(optionButton);
      $(optionButton).addClass("lines");
    } else if (textOption == "ŽIADNY +0 Kč") {
      $("<div>", {
        class: "description",
        text: valueText[0],
      }).appendTo(optionButton);
      $(optionButton).addClass("text");
    } else {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/variants/${parameterId}-${value}.jpg?8`,
      }).appendTo(optionButton);
    }
  });
}

function createBoxConfig() {
  const wrap = $("<div>", {
    class: "box-config",
  }).appendTo(".upsale-buttons.boxs");

  $('<div class="order">7</div>').appendTo(wrap);
  $('<h5 class="variant name">FARBA</h5>').appendTo(wrap);

  $("<div>", {
    class: "close-btn",
    text: "-",
  }).appendTo(wrap);
  $("<div>", {
    class: "close-btn return",
    text: "potvrdit",
  }).appendTo(wrap);
  const configWrap = $("<div>", {
    class: "config-wrap",
  }).appendTo(wrap);
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
function createUpsalePopup() {
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

function createModelInfo() {
  if ($("#model-info")[0]) return;
  const model = sessionStorage.getItem("model");
  console.log(model);
  $(".content-wrap").on("click", function () {
    const model = sessionStorage.getItem("model");
    if (model == "Značka Model Rok výroby Typ auta") {
      createpopup();
    }
  });

  if (model == "Značka Model Rok výroby Typ auta") {
    return;
  }

  if (model) {
    const modelInfo = $("<section>").attr("id", "model-info").insertBefore("section#model-selector");
    $("section#model-selector").hide();
    const infoWrap = $("<div>").addClass("model-info").appendTo(modelInfo);
    $("<div>").addClass("header-info").text("Garancia kompatibility s Vaším vozidlom").appendTo(infoWrap);
    $("<div>").addClass("model-text").text(model).appendTo(infoWrap);

    $("<div>").addClass("setup-model").text("Upraviť").appendTo(infoWrap);

    $(".setup-model").on("click", function () {
      $("section#model-selector").show();
      modelInfo.remove();
    });
    // $('<div class="model-info"> <span class="model">Model:</span> <span class="model-name">' + model + "</span></div>").insertBefore(
    //   "section#model-selector"
    // );
  }
}

function createpopup() {
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
    text: "Prosím, nejdříve vyberte model vašeho vozidla",
    style: `
      margin-bottom: 30px;
      font-size: 22px;
      color: #333;
      font-weight: 500;
      line-height: 1.4;
    `,
  }).appendTo(popup);

  $("<button>", {
    text: "Rozumím",
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
      overflow.fadeOut(200, function () {
        $(this).remove();
      });
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
  `
    )
    .appendTo("head");
}

function calculateStandartPrice(diference) {
  console.log(diference);
  const price = Number(
    $("span.calculated-price")
      .text()
      .replace(/[^0-9]/g, "")
  );

  let newStandartPrice = price + diference;

  console.log("addss");
  $(".upsale-button.active").each(function () {
    const priceText = $(this).find(".save").attr("data-save");
    console.log(priceText);
    if (priceText) {
      const priceValue = Number(priceText.replace(/[^0-9]/g, ""));

      newStandartPrice += priceValue;
      console.log("newStandartPrice", newStandartPrice);
    }
  });
  // vypočet procentualni slevy price z newStandartPrice
  const discount = Math.round(((newStandartPrice - price) / newStandartPrice) * 100);
  console.log("discount", discount);
  $(".p-final-price-wrapper .price-save").text("- " + discount + "%");
  $(".p-final-price-wrapper .price-standard span").text(NumToPrice(newStandartPrice));
}
