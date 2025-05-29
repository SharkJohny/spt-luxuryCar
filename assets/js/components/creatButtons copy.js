/**
 * Creates options for a given position and order.
 *
 * @param {HTMLElement} position - The position element.
 * @param {number} orders - The order number.
 */
export function createOptions(position, orders) {
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

  // změna upsalu

  let upsale = 4;
  if (shoptetData.product.id == 3011 || shoptetData.product.id == 3018 || shoptetData.product.id == 3021) {
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

  console.log(options);
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

    if (textOption.includes("cm")) {
      let paramText = nameSplit[1];
      if (paramText == undefined) {
        paramText = "";
      }
      $("<div>", {
        class: "description",
        html: `<span>${nameSplit[0]}</span><div class='parm'> ${paramText}</div><div class='price'>+ ${valueText[1]}</div>`,
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
      <img src="${img}?2" alt="${text}" />
      <div class="banner-header"><span>${text}</span>
    </div>
  `;

  const button = $(buttonHTML).appendTo(position);

  if (priceText[0] == "0") return;

  const save = priceText[1] - priceText[0];
  let priceHTML = `<div class="price">${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}">Ušetříte ${NumToPrice(save)}</div>`;

  if (prefix) {
    priceHTML = `<div class="price">od ${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}">Ušetříte až ${NumToPrice(save)}</div>`;
  }

  const positionadd = $(button).find(".banner-header");
  $(priceHTML).appendTo(positionadd);
  $(".upsale-Banner").hide();
}
