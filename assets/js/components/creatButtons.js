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
export function createUpsaleButton(img, text, position, value, type, price, prefix) {
  console.log(img, text, position, price, prefix);
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
      <img src="${img}?6" alt="${text}" />
      <div class="banner-header"><span>${text}</span>
    </div>
  `;

  const button = $(buttonHTML).appendTo(position);

  if (priceText[0] == "0") return;

  const save = priceText[1] - priceText[0];
  let priceHTML = `<div class="price">${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}">Ušetríte ${NumToPrice(save)}</div>`;

  if (prefix) {
    priceHTML = `<div class="price">od ${NumToPrice(priceText[0])} / ks</div><div class="save" data-save="${save}">Ušetríte až ${NumToPrice(
      save
    )}</div>`;
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

  let upsale = 4;
  if (shoptetData.product.id == 601 || shoptetData.product.id == 604 || shoptetData.product.id == 607) {
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

  if (parameterId == "107" && getName != "") {
    name = getName;
  }

  $("<h5>", {
    class: "variant name",
    text: name,
  }).appendTo(nameWrap);
  const priceWrap = $("<div>", {
    class: "price-wrap",
  }).appendTo(nameWrap);
  console.log(orders);
  if (parameterId == "98" || parameterId == "101") {
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

    const priceButton = {
      619: 0,
      622: 10,
      625: 30,
      628: 45,
      634: 0,
      637: 10,
      640: 30,
      643: 45,
    };

    // if (priceButton[value]) {
    //   $(`<div class='price'>+ ${NumToPrice(priceButton[value])}</div>`).appendTo(optionButton);
    // }

    if (textOption.includes("cm")) {
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
    } else if (textOption.includes("rad")) {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.png?9`,
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
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.jpg?9`,
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
