let twoLayersProducts;
let boxsParameterIds;
let oneLayerProducts;

if ($(".type-product")[0]) {
  twoLayersProducts = shoptetData.product.id == 601 || shoptetData.product.id == 604 || shoptetData.product.id == 607;
  boxsParameterIds = [94, 97, 104];
  oneLayerProducts = shoptetData.product.id == 598 || shoptetData.product.id == 610 || shoptetData.product.id == 613;
  if (dataLayer[0].shoptet.projectId == "581408") {
    $(".custom-footer__banner10").hide();
    twoLayersProducts = shoptetData.product.id == 2406 || shoptetData.product.id == 2409 || shoptetData.product.id == 2412;
    oneLayerProducts = shoptetData.product.id == 2403 || shoptetData.product.id == 2415 || shoptetData.product.id == 2418;
    boxsParameterIds = [66, 69, 78, 104];
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
 * Creates a slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} Slugified text
 */
function createSlug(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
  if (!img || !text || !position) return;

  const priceParts = String(price || "0/0").split("/");
  const base = Number(priceParts[0]);
  const full = Number(priceParts[1] || 0);

  const save = full - base;
  const typeClass = ButtonUtils.getButtonTypeClass(type, value);

  const buttonHTML = `
    <div class="upsale-button ${typeClass}" value="${value}">
      <img src="${img}?7" alt="${text}" />
      <div class="banner-header"><span>${text}</span></div>
    </div>
  `;

  const button = $(buttonHTML).appendTo(position);

  // If base price is 0, we keep the button but don't append the price block (e.g. "Nechci" option)
  if (base > 0) {
    const priceHTML = ButtonUtils.createPriceHTML(base, save, !!prefix).replace(
      /Ušetríte/,
      texts && texts.you_will_save ? texts.you_will_save : "Ušetríte",
    );
    $(button).find(".banner-header").append(priceHTML);
  }

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

  const isBoxParam = boxsParameterIds.includes(parseInt(parameterId));
  let basePrice = 0;
  // Preserve original visual style for box parameters
  if (isBoxParam) {
    $(`.parameter-wrap.parameter-${parameterId}.orders-${orders}`).addClass("noText");
  }
  if (isBoxParam) {
    // Determine box base price from the first option that has a surcharge final price
    const $select = $(position);
    const $firstWithPrice = $select
      .find('option[data-surcharge-final-price]:not([value=""])')
      .filter(function () {
        const raw = String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0");
        const num = Number(raw.replace(/[^0-9]/g, ""));
        return num > 0;
      })
      .first();
    if ($firstWithPrice.length) {
      const raw = String($firstWithPrice.attr("data-surcharge-final-price") || $firstWithPrice.attr("data-surcharge-additional-price") || "0");
      basePrice = Number(raw.replace(/[^0-9]/g, ""));
    }

    $('<span class="text">Cena boxu</span>').appendTo(priceWrap);
    $("<div>", {
      class: "price price-standart",
      text: basePrice > 0 ? NumToPrice(basePrice) : "0 Kč",
      "data-price": basePrice,
    }).appendTo(priceWrap);
  }

  amountChoser(position, priceWrap);

  const optionsWrap = $("<div>", {
    class: "options-wrap",
  }).appendTo(paramerer);

  console.log(options);

  createOptionButtons(options, parameterId, optionsWrap, isBoxParam, basePrice);

  if (name == "veľkosť") {
    $(".surcharge-list").each(function () {
      const parameterId = $(this).find("select").attr("data-parameter-id");
      console.log(parameterId);
      // determine if nested param is a box param and compute its base price
      const isBoxNested = boxsParameterIds.includes(parseInt(parameterId));
      let basePriceNested = 0;
      if (isBoxNested) {
        const $select = $(this).find("select");
        const $firstWithPrice = $select
          .find('option[data-surcharge-final-price]:not([value=""])')
          .filter(function () {
            const raw = String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0");
            const num = Number(raw.replace(/[^0-9]/g, ""));
            return num > 0;
          })
          .first();
        if ($firstWithPrice.length) {
          const raw = String($firstWithPrice.attr("data-surcharge-final-price") || $firstWithPrice.attr("data-surcharge-additional-price") || "0");
          basePriceNested = Number(raw.replace(/[^0-9]/g, ""));
        }
      }

      const parametrWraps = $("<div>", {
        class: "parameter-wrap parameter-sizes",
        "data-parameterId": parameterId,
      }).appendTo(optionsWrap);
      const surchargeName = $(this).find("th").text().trim().replace("?", "");
      $("<div>", {
        class: "variant name",
        text: surchargeName,
      }).appendTo(parametrWraps);
      // If this nested parameter is a box-size, create a price-wrap with base price
      const priceWrapNested = $("<div>", { class: "price-wrap" }).appendTo(parametrWraps);
      if (isBoxNested) {
        $("<span>", { class: "text", text: "Cena boxu" }).appendTo(priceWrapNested);
        $("<div>", {
          class: "price price-standart",
          text: basePriceNested > 0 ? NumToPrice(basePriceNested) : "0 Kč",
          "data-price": basePriceNested,
        }).appendTo(priceWrapNested);
      }

      const optionWrap = $("<div>", {
        class: "option-wrap",
      }).appendTo(parametrWraps);
      const options = $(this).find("option");
      createOptionButtons(options, parameterId, optionWrap, isBoxNested, basePriceNested);
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

  function resetBoxSizeOptions(visibleCount, resetAll = false) {
    const wraps = $(".parameter-wrap.parameter-sizes");
    wraps.each(function (index) {
      const $wrap = $(this);
      const shouldShow = index < visibleCount;

      if (shouldShow) {
        $wrap.show();
      } else {
        $wrap.hide();
      }

      if (resetAll || !shouldShow) {
        $wrap.find(".button.option-button.text").removeClass("active");
        $wrap.find("input[type='radio'], input[type='checkbox']").prop("checked", false);

        const paramId = $wrap.attr("data-parameterId");
        if (paramId) {
          $(`select.parameter-id-${paramId}.surcharge-parameter`).val(0);
        }
      }
    });
  }

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
          // Show only first size, reset all to defaults
          resetBoxSizeOptions(1, true);
          priceActualization();
        } else if (i == 2) {
          // Show first two sizes, reset hidden ones
          resetBoxSizeOptions(2);
          priceActualization();
        } else if (i == 3) {
          // Show all sizes
          resetBoxSizeOptions(3);
          priceActualization();
        }
      },
    }).appendTo(amountWrap);
  }
}

function createOptionButtons(options, parameterId, optionsWrap, isBoxParam = false, basePrice = 0) {
  $(options).each(function () {
    const $opt = $(this);
    const value = $opt.val();
    if (value == "") return;
    const textOption = $opt.text();
    const valueText = textOption.split("+");
    const nameSplit = valueText[0].split(":");

    const surchargeFinal = Number($opt.attr("data-surcharge-final-price") || $opt.attr("data-surcharge-additional-price") || 0);

    // For box parameters, skip options with zero surcharge
    if (isBoxParam && surchargeFinal === 0) return;

    if (textOption.includes("ŽIADNY") && !isBoxParam) {
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

      if (isBoxParam) {
        // Use surchargeFinal and basePrice to compute diff
        const diff = surchargeFinal - (Number(basePrice) || 0);
        const diffText = diff > 0 ? "+ " + NumToPrice(diff) : "";
        $(`<div class='price' data-price="${diff > 0 ? diff : 0}">${diffText}</div>`).appendTo(buttonDescription);
      } else {
        let textPrice = priceButton[value] ? priceButton[value] : "";

        if (priceButton[value]) {
          textPrice = "+ " + NumToPrice(priceButton[value]);
        }

        $(`<div class='price' data-price="${priceButton[value]}">${textPrice}</div>`).appendTo(buttonDescription);
      }

      $(optionButton).addClass("text");
      // If this is a box parameter, keep base price unchanged to avoid double counting.
      if (isBoxParam) {
        $(optionButton).on("click", function () {
          $(this).addClass("active").siblings().removeClass("active");
        });
      }
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
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.png?14`,
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
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.jpg?14`,
      }).appendTo(optionButton);
    }
  });
}
