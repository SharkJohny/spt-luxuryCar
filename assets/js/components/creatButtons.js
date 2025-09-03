let twoLayersProducts;
let boxsParameterIds;
let oneLayerProducts;

if ($(".type-product")[0]) {
  twoLayersProducts = shoptetData.product.id == 601 || shoptetData.product.id == 604 || shoptetData.product.id == 607;
  boxsParameterIds = [94, 97];
  oneLayerProducts = shoptetData.product.id == 601 || shoptetData.product.id == 604 || shoptetData.product.id == 607;
  if (dataLayer[0].shoptet.projectId == "581408") {
    $(".custom-footer__banner10").hide();
    twoLayersProducts = shoptetData.product.id == 2406 || shoptetData.product.id == 2409 || shoptetData.product.id == 2412;
    oneLayerProducts = shoptetData.product.id == 2403 || shoptetData.product.id == 2415 || shoptetData.product.id == 2418;
    boxsParameterIds = [66, 69];
  }
}
/**
 * Utility functions for button creation and management
 */
const ButtonUtils = {
  /**
   * Creates HTML for price display
   * @param {number} price - Base price
   * @param {number} save - Amount saved
   * @param {boolean} prefix - Whether to show "od" prefix
   * @returns {string} HTML string for price display
   */
  createPriceHTML: (price, save, prefix) => {
    if (prefix) {
      return `<div class="price">od ${NumToPrice(price)}</div><div class="save" data-save="${save}">Ušetríte až ${NumToPrice(save)}</div>`;
    }
    return `<div class="price">${NumToPrice(price)}</div><div class="save" data-save="${save}">Ušetríte ${NumToPrice(save)}</div>`;
  },

  /**
   * Determines button type class
   * @param {string} type - Button type
   * @param {string|number} value - Button value
   * @returns {string} CSS class for button type
   */
  getButtonTypeClass: (type, value) => {
    if (type === "config" && value === 0) return "none";
    if (value === "89-2225") return "radio none";
    return type;
  },
};

/**
 * Creates an upsale button with an image and text, and appends it to the specified position.
 *
 * @param {string} img - The URL of the image to be displayed on the button.
 * @param {string} text - The text to be displayed on the button.
 * @param {jQuery|HTMLElement} position - The element where the button will be appended.
 * @param {number} [value] - Optional value attribute for the button.
 * @param {string} type - Type of the button (radio, config, none)
 * @param {string} price - Price string in format "price/save"
 * @param {boolean} prefix - Whether to show "od" prefix in price
 */
export function createUpsaleButton(img, text, position, value, type, price, prefix, texts) {
  console.log("textty", texts.you_will_save);
  if (!img || !text || !position || !price) {
    console.error("Invalid parameters passed to createUpsaleButton");
    return;
  }

  let priceText = price.split("/");
  let typeClass = type;

  if (type == "config" && value == 0) {
    typeClass = "none";
  }

  if (value == "89-2225") {
    typeClass = "radio none";
  }

  const buttonHTML = `
    <div class="upsale-button ${typeClass}" value="${value}">
      <img src="${img}?7" alt="${text}" />
      <div class="banner-header"><span>${text}</span>
    </div>
  `;

  const button = $(buttonHTML).appendTo(position);

  if (priceText[0] == "0") return;

  const save = priceText[1] - priceText[0];
  let priceHTML = `<div class="price">${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}">${texts.you_will_save} ${NumToPrice(
    save
  )}</div>`;

  if (prefix) {
    priceHTML = `<div class="price">od ${NumToPrice(priceText[0])} / ks</div><div class="save" data-save="${save}">${
      texts.you_will_save
    } až ${NumToPrice(save)}</div>`;
  }

  const positionadd = $(button).find(".banner-header");
  $(priceHTML).appendTo(positionadd);
  $(".upsale-Banner").hide();
  setTimeout(() => {
    $(".parameter-wrap.orders-1").removeClass("goToAction");
  }, 1000);
}

/**
 * Creates options for a given position and order.
 *
 * @param {HTMLElement} position - The position element.
 * @param {number} orders - The order number.
 */
export function createOptions(position, orders) {
  let name = "";
  if (position == "box") {
    name = "Počet boxov";
  } else if (position == "sizes") {
    name = "veľkosť";
  } else {
    name = $(position).parents(".variant-list").find("th").text().trim();
  }
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

  let upsale = 2;

  const header = $("h1").text();
  if (header.includes("box") || header.includes("Boxy")) {
    upsale = 3;
    $("body").addClass("boxy");
  }
  if (twoLayersProducts || oneLayerProducts) {
    $(".benefitBanner__content").hide();
    upsale = 3;
  }

  if (twoLayersProducts) {
    upsale = 4;
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
  // vytvorenie wrapu pre parameter
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

  console.log(name);
  const nameWrap = $("<div>", {
    class: "name-wrap",
  }).appendTo(paramerer);
  const getName = $("table.detail-parameters tr:contains(colorTitle) td").text().trim();
  console.log(getName);

  if (parameterId == "107" && getName != "") {
    name = getName;
  }

  // Najdi tooltip informace pro tento parametr
  const tooltipInfo =
    $(position).parents(".surcharge-list").find(".show-tooltip").attr("title") ||
    $(position).parents(".surcharge-list").find(".show-tooltip").attr("data-original-title");

  $("<h5>", {
    class: "variant name",
    text: name,
  }).appendTo(nameWrap);

  // Přidej informační text pokud existuje tooltip
  if (tooltipInfo && tooltipInfo.trim() !== "") {
    $("<div>", {
      class: "parameter-info",
      html: `<i class="info-icon">i</i> ${tooltipInfo}`,
    }).appendTo(nameWrap);
  }
  const priceWrap = $("<div>", {
    class: "price-wrap",
  }).appendTo(nameWrap);

  if (boxsParameterIds.includes(parseInt(parameterId))) {
    console.log(boxsParameterIds);
    let price = 79;
    $('<span class="text">Cena boxu</span>').appendTo(priceWrap);
    $("<div>", {
      class: "price price-standart",
      text: "od " + NumToPrice(price),
      "data-price": price,
    }).appendTo(priceWrap);
  }

  amountChoser(position, priceWrap);

  const optionsWrap = $("<div>", {
    class: "options-wrap",
  }).appendTo(paramerer);

  console.log(options);

  createOptionButtons(options, parameterId, optionsWrap);

  if (name == "veľkosť") {
    $(".surcharge-list").each(function () {
      const parameterId = $(this).find("select").attr("data-parameter-id");
      console.log(parameterId);
      const parametrWraps = $("<div>", {
        class: "parameter-wrap parameter-sizes",
        "data-parameterId": parameterId,
      }).appendTo(optionsWrap);
      const surchargeName = $(this).find("th").text().trim().replace("?", "");
      $("<div>", {
        class: "variant name",
        text: surchargeName,
      }).appendTo(parametrWraps);
      const optionWrap = $("<div>", {
        class: "option-wrap",
      }).appendTo(parametrWraps);
      const options = $(this).find("option");
      createOptionButtons(options, parameterId, optionWrap);
    });

    $(".parameter-wrap.parameter-sizes").eq(2).hide();
  }

  $(".parameter-wrap.parameter-98 h5.variant.name").text("Box 1");
  $(".parameter-wrap.parameter-101 h5.variant.name").text("Box 2");
}

/**
 * Creates a box configuration for the product page.
 *
 * @returns {void}
 */
export function createBoxConfig() {
  const wrap = $("<div>", {
    class: "box-config ",
  }).appendTo(".upsale-buttons.boxs");

  $('<div class="order">7</div>').appendTo(wrap);
  $('<h5 class="variant name">FARBA</h5>').appendTo(wrap);

  $("<div>", {
    class: "close-btn close",
    text: "-",
  }).appendTo(wrap);
  $("<div>", {
    class: "close-btn close bottom",
    text: "Nechci",
  }).appendTo(wrap);
  $("<div>", {
    class: "close-btn return",
    text: "potvrdit",
  }).appendTo(wrap);
  const configWrap = $("<div>", {
    class: "config-wrap",
  }).appendTo(wrap);
}

function amountChoser(name, position) {
  if (name != "box") {
    return;
  }
  let amount = 3;
  const amountWrap = $("<div>", {
    class: "amount-wrap",
  }).appendTo(position);

  for (let i = 1; i <= amount; i++) {
    $("<div>", {
      class: "button option-button   amount-button" + (i === 2 ? " active" : ""),
      text: i + " ks",

      click: function () {
        $(".amount-button").removeClass("active");
        $(this).addClass("active");
        amount = i;

        // $("input.amount").val(i).trigger("change");
        $(".image-wrap").hide();
        if (i == 1) {
          $(".parameter-wrap.parameter-sizes").eq(1).hide();
          $(".parameter-wrap.parameter-sizes").eq(2).hide();
          $(".parameter-wrap.parameter-sizes:eq(1) .button.option-button.text.active").removeClass("active");
          $(".parameter-wrap.parameter-sizes:eq(2) .button.option-button.text").removeClass("active");
          priceActualization();
        } else if (i == 2) {
          $(".parameter-wrap.parameter-sizes").eq(1).show();
          $(".parameter-wrap.parameter-sizes").eq(2).hide();
          $(".parameter-wrap.parameter-sizes:eq(2) .button.option-button.text").removeClass("active");
          priceActualization();
        } else if (i == 3) {
          $(".parameter-wrap.parameter-sizes").eq(1).show();
          $(".parameter-wrap.parameter-sizes").eq(2).show();
          priceActualization();
        }
      },
    }).appendTo(amountWrap);
    $("input.amount").val(2);
  }
}

function createOptionButtons(options, parameterId, optionsWrap) {
  $(options).each(function () {
    const value = $(this).val();
    if (value == "") return;
    const textOption = $(this).text();
    const valueText = textOption.split("+");
    const nameSplit = valueText[0].split(":");
    if (textOption.includes("ŽIADNY")) {
      return;
    }
    const optionButton = $("<div>", {
      class: "button option-button",
      "data-value": value,
      "data-variant": parameterId,
    }).appendTo(optionsWrap);
    $("<div>", {
      text: textOption,
      class: "text",
    }).appendTo(optionButton);

    let priceButton = {
      619: 0,
      622: 10,
      625: 30,
      628: 45,
      634: 0,
      637: 10,
      640: 30,
      643: 45,
    };
    if (dataLayer[0].shoptet.projectId == "581408") {
      priceButton = {
        516: 0,
        519: 399,
        522: 859,
        525: 999,
        531: 0,
        534: 399,
        537: 859,
        540: 999,
      };
    }
    if (textOption.includes("cm")) {
      // if (priceButton[value]) {
      //   $(`<div class='price'>+ ${NumToPrice(priceButton[value])}</div>`).appendTo(optionButton);
      // }

      let paramText = nameSplit[1];
      if (paramText == undefined) {
        paramText = "";
      }
      const buttonDescription = $("<div>", {
        class: "description",
        html: `<span>${nameSplit[0]}</span><div class='parm'> ${paramText}</div>`,
      }).appendTo(optionButton);

      let textPrice = priceButton[value] ? priceButton[value] : "";

      if (priceButton[value]) {
        textPrice = "+ " + NumToPrice(priceButton[value]);
      }

      $(`<div class='price' data-price="${priceButton[value]}">${textPrice}</div>`).appendTo(buttonDescription);

      $(optionButton).addClass("text");
      let label;
    } else if (textOption.includes("rad") || textOption.includes("řada")) {
      // Vytvoř radio input
      $("<input>", {
        type: "radio",
        id: `radio-${parameterId}-${value}`,
        name: `parameter-${parameterId}`,
        value: value,
      }).appendTo(optionButton);

      // Vytvoř label pro radio
      $("<label>", {
        for: `radio-${parameterId}-${value}`,
        class: "radio-label",
        html: `<span class="radio-text">${nameSplit[0]}</span><strong class="radio-price">+ ${valueText[1]}</strong>`,
      }).appendTo(optionButton);
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.png?12`,
      }).appendTo(optionButton.find("label"));
      $(optionButton).addClass("radio-row");
      $(optionButton).parents(".options-wrap").addClass("radio-wrap");
    } else if (textOption == "ŽIADNY +0 Kč") {
      $("<div>", {
        class: "description",
        text: valueText[0],
      }).appendTo(optionButton);
      $(optionButton).addClass("text");
    } else {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.jpg?12`,
      }).appendTo(optionButton);
    }
  });
}
/**
 * Creates a slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} Slugified text
 */
function createSlug(text) {
  console.log(text);
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
