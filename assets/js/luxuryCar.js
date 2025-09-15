// assets/js/option.js
var timestamp = Date.now();
console.log("Timestamp for data.json:", timestamp);
var optionData = {
  key: "value",
  downloadData: "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json?" + timestamp,
};

// assets/js/components/index.js
function intIndex() {
  setTimeout(function () {
    $(".twentytwenty-container").twentytwenty({
      before_label: "Potom",
      after_label: "P\u0159edt\xEDm",
    });
  }, 1e3);
  $("svg.icon.icon-circle-button-right-clipped").remove();
  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    video.removeAttribute("controls");
  });
  function animateCountUp(element, targetNumber, duration) {
    const $element = $(element);
    $({ count: 0 }).animate(
      { count: targetNumber },
      {
        duration,
        easing: "swing",
        step: function (now) {
          $element.text(Math.floor(now));
        },
        complete: function () {
          $element.text(targetNumber);
        },
      }
    );
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const $element = $(entry.target).find('span[style*="text-align: end"]');
        const targetNumber = parseFloat($element.text().replace(",", ""));
        console.log(targetNumber);
        if (targetNumber > 0) {
          console.log("assdsd");
          const duration = parseFloat($(entry.target).attr("count-up")) * 1e3;
          animateCountUp($element, targetNumber, duration);
          observer.unobserve(entry.target);
        }
      }
    });
  });
  $("[count-up]").each(function () {
    observer.observe(this);
  });
  setTimeout(function () {
    $("collection-list.collection-list").slick({
      dots: true,
      centerMode: false,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 2,
      autoplay: true,
      autoplaySpeed: 3e3,
      arrows: true,
      responsive: [
        {
          breakpoint: 1480,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            arrows: true,
          },
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3,
          },
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });
  }, 1e3);
  $("section.foto-slider .image-slider").slick({
    dots: true,
    centerMode: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4e3,
    arrows: true,
    responsive: [
      {
        breakpoint: 1480,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: true,
        },
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 770,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 350,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  });
  setTimeout(function () {
    $(".customers-video").slick({
      dots: true,
      centerMode: false,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 4e3,
      arrows: true,
      responsive: [
        {
          breakpoint: 1480,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: true,
          },
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3,
          },
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });
    $(".google-reviews").slick({
      dots: true,
      centerMode: false,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 4e3,
      arrows: true,
      responsive: [
        {
          breakpoint: 1480,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: true,
          },
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3,
          },
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });
  }, 1e3);
  $("button.text-with-icon.group").on("click", function () {
    $("section#comparison").toggleClass("show-more");
    if (!$("button.text-with-icon.group.less")[0]) {
      $(".feature-chart__table-row[hidden]").removeAttr("hidden").addClass("addHidden");
      const less = $(this).attr("data-view-less");
      $(this).addClass("less");
      $(this).find("span.feature-chart__toggle-text.reversed-link").text(less);
    } else {
      const more = $(this).attr("data-view-more");
      $(".feature-chart__table-row.addHidden").attr("hidden", true).removeClass("addHidden");
      $(this).removeClass("less");
      $(this).find("span.feature-chart__toggle-text.reversed-link").text(more);
    }
  });
  $(".btn.more-pictures-button").on("click", function () {
    $(".more-pictures").toggleClass("slow");
    if (!$(".btn.more-pictures-button.less")[0]) {
      const less = $(this).attr("data-view-less");
      $(this).text(less);
      $(this).addClass("less");
    } else {
      const more = $(this).attr("data-view-more");
      $(this).text(more);
      $(this).removeClass("less");
    }
  });
  $(".hotspot").on("click", function () {
    $(".tooltips").removeClass("show");
    $(this).find(".tooltips").addClass("show");
  });
  $(document).on("click", function (e) {
    const $target = $(e.target);
    if (!$target.closest(".hotspot").length && !$target.closest(".tooltips").length) {
      $(".tooltips").removeClass("show");
    }
  });
  setTimeout(function () {
    $(".review-photo").each(function () {
      const width = $(this).width();
      $(this).height(width);
    });
  }, 1e3);
}

// assets/js/components/UpsalePopup.js
function showUpsalePopup() {
  $("body").addClass("upsale-popup-active");
  console.log("showUpsalePopup");
  if ($(".overflow.upsale-popup").length) return;
  const $overlay = $("<div>", { class: "overflow upsale-popup" }).appendTo("body");
  const $popup = $("<div>", { class: "upsale-popup-box" }).appendTo($overlay);
  const $inner = $("<div>", { class: "upsale-popup-inner" }).appendTo($popup);
  $("<div>", {
    text: "NEZABUDOL SI NA NIE\u010CO?",
    class: "upsale-popup-title",
  }).appendTo($inner);
  $("<div>", {
    html: "ROHO\u017D DO KUFRA<br>ALEBO \u0160T\xDDLOV\xC9 BOXY",
    class: "upsale-popup-subtitle",
  }).appendTo($inner);
  $("<div>", {
    html: "VYU\u017DI Z\u013DAVU PRI N\xC1KUPE SPOLU<br>S KOBERCAMI POD SEDADL\xC1 \u2013 JE TO JEDINE\u010CN\xC1 PR\xCDLE\u017DITOS\u0164",
    class: "upsale-popup-info",
  }).appendTo($inner);
  $("<div>", {
    html: "POU\u017DI K\xD3D <b>LUX10</b> A Z\xCDSKAJ DODATO\u010CN\xDA Z\u013DAVU PRI N\xC1KUPE SETU",
    class: "upsale-popup-code",
  }).appendTo($inner);
  $("<div>", {
    text: "NA VYU\u017DITIE SLEVY V\xC1M OST\xC1VA LEN:",
    class: "upsale-popup-timer-label",
  }).appendTo($inner);
  const $timer = $("<div>", {
    class: "upsale-popup-timer",
    text: "10:00",
  }).appendTo($inner);
  const $btnWrap = $("<div>", { class: "upsale-popup-btns" }).appendTo($inner);
  $("<button>", {
    html: "CHCEM Z\u013DAVU\n<span>UPRAVI\u0164 OBJEDN\xC1VKU</span>",
    class: "upsale-popup-btn want",
    click: function () {
      $overlay.remove();
      $(".upsale-wrap").addClass("active");
      window.allowDirectAddToCart = true;
      upsaleBorder();
    },
  }).appendTo($btnWrap);
  $("<button>", {
    html: "NECHCEM Z\u013DAVU\n<span>PREJS\u0164 DO KO\u0160\xCDKA</span>",
    class: "upsale-popup-btn dontwant",
    click: function () {
      console.log("click");
      $overlay.remove();
      window.allowDirectAddToCart = true;
      var btns = document.querySelectorAll("button.btn.btn-lg.btn-conversion.add-to-cart-button");
      $("button.btn.btn-lg.btn-conversion.add-to-cart-button").click();
      for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        var style = window.getComputedStyle(btn);
        if (style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null) {
          break;
        }
      }
    },
  }).appendTo($btnWrap);
  let timeLeft = 10 * 60;
  function updateTimer() {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    $timer.text(`${min}:${sec}`);
    if (timeLeft > 0) {
      timeLeft--;
      setTimeout(updateTimer, 1e3);
    } else {
      $timer.text("00:00");
    }
  }
  updateTimer();
}
function upsaleBorder() {
  if (!$(".upsale-blur-overlay").length) {
    $("body").append('<div class="upsale-blur-overlay"></div>');
  }
  $(".upsale-Banner").addClass("active").css("z-index", 10001);
  $(".upsale-Banner.active").on("click", function () {
    removeUpsaleBorder();
  });
}
function removeUpsaleBorder() {
  $(".upsale-blur-overlay").remove();
  $(".upsale-Banner").removeClass("active").css("z-index", "");
}

// assets/js/components/creatButtons.js
var twoLayersProducts;
if ($(".type-product")[0]) {
  twoLayersProducts = shoptetData.product.id == 601 || shoptetData.product.id == 604 || shoptetData.product.id == 607;
  if (dataLayer[0].shoptet.projectId == "704436") {
    twoLayersProducts = shoptetData.product.id == 3011 || shoptetData.product.id == 3018 || shoptetData.product.id == 3021;
  }
}
function createUpsaleButton(img, text, position, value, type, price2, prefix, texts) {
  console.log("textty", texts.you_will_save);
  if (!img || !text || !position || !price2) {
    console.error("Invalid parameters passed to createUpsaleButton");
    return;
  }
  let priceText = price2.split("/");
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
  let priceHTML = `<div class="price">${NumToPrice(priceText[0])}</div><div class="save" data-save="${save}">${texts.you_will_save} ${NumToPrice(
    save
  )}</div>`;
  if (prefix) {
    priceHTML = `<div class="price">od ${NumToPrice(priceText[0])} / ks</div><div class="save" data-save="${save}">${
      texts.you_will_save
    } a\u017E ${NumToPrice(save)}</div>`;
  }
  const positionadd = $(button).find(".banner-header");
  $(priceHTML).appendTo(positionadd);
  $(".upsale-Banner").hide();
  setTimeout(() => {
    $(".parameter-wrap.orders-1").removeClass("goToAction");
  }, 1e3);
}
function createOptions(position, orders) {
  let name = "";
  if (position == "box") {
    name = "Po\u010Det boxov";
  } else if (position == "sizes") {
    name = "ve\u013Ekos\u0165";
  } else {
    name = $(position).parents(".variant-list").find("th").text().trim();
  }
  if (name == "") {
    name = $(position).parents(".surcharge-list").find("th").text().trim().replace("?", "");
  }
  const createSlug2 = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };
  let slug = createSlug2(name);
  const options = $(position).find("option");
  const parameterId = $(position).attr("data-parameter-id");
  let optPosition = ".content-wrap";
  let upsale = 4;
  if (twoLayersProducts) {
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
  amountChoser(position, priceWrap);
  const optionsWrap = $("<div>", {
    class: "options-wrap",
  }).appendTo(paramerer);
  console.log(options);
  createOptionButtons(options, parameterId, optionsWrap);
  if (name == "ve\u013Ekos\u0165") {
    $(".surcharge-list").each(function () {
      const parameterId2 = $(this).find("select").attr("data-parameter-id");
      console.log(parameterId2);
      const parametrWraps = $("<div>", {
        class: "parameter-wrap parameter-sizes",
        "data-parameterId": parameterId2,
      }).appendTo(optionsWrap);
      const surchargeName = $(this).find("th").text().trim().replace("?", "");
      $("<div>", {
        class: "variant name",
        text: surchargeName,
      }).appendTo(parametrWraps);
      const optionWrap = $("<div>", {
        class: "option-wrap",
      }).appendTo(parametrWraps);
      const options2 = $(this).find("option");
      createOptionButtons(options2, parameterId2, optionWrap);
    });
    $(".parameter-wrap.parameter-sizes").eq(2).hide();
  }
  $(".parameter-wrap.parameter-98 h5.variant.name").text("Box 1");
  $(".parameter-wrap.parameter-101 h5.variant.name").text("Box 2");
}
function createBoxConfig() {
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
    if (textOption.includes("\u017DIADNY")) {
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
    if (textOption.includes("cm")) {
      let paramText = nameSplit[1];
      if (paramText == void 0) {
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
    } else if (textOption.includes("rad") || textOption.includes("\u0159ada")) {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.png?11`,
      }).appendTo(optionButton);
      $("<div>", {
        class: "banner-header",
        html: `<span>${nameSplit[0]}</span><div class='price'>${valueText[1]}</div>`,
      }).appendTo(optionButton);
      $(optionButton).addClass("lines");
    } else if (textOption == "\u017DIADNY +0 K\u010D") {
      $("<div>", {
        class: "description",
        text: valueText[0],
      }).appendTo(optionButton);
      $(optionButton).addClass("text");
    } else {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.jpg?11`,
      }).appendTo(optionButton);
    }
  });
}
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

// assets/js/components/productPage.js
var koberce = 88;
var boxy = 91;
var box1 = 94;
var box2 = 97;
var language = shoptetData.language;
if (dataLayer[0].shoptet.projectId == "704436") {
  koberce = 89;
  boxy = 95;
  box1 = 98;
  box2 = 101;
}
var standartPrice = Number(
  $(".p-final-price-wrapper .price-standard span").length
    ? $(".p-final-price-wrapper .price-standard span")
        .text()
        .replace(/[^0-9]/g, "")
    : 0
);
var price = Number(
  $("span.calculated-price").length
    ? $("span.calculated-price")
        .text()
        .replace(/[^0-9]/g, "")
    : 0
);
var diference = standartPrice - price;
console.log(diference);
function initProduct(setupData2, texts) {
  createModelInfo();
  setTimeout(() => {
    $(".p-thumbnails-horizontal").addClass("overflow-next");
  }, 1e3);
  $("<div class='recommended-price'>Doporu\u010Den\xE1 cena</div>").prependTo(".p-info-wrapper span.price-standard");
  $(".price-save:eq(1)").appendTo(".p-info-wrapper span.price-standard");
  $("<div class='recommended-price-final'>" + texts.current_price + "</div>").prependTo(".p-info-wrapper .price-final");
  setTimeout(() => {
    if ($(".col-xs-12.col-lg-6.p-info-wrapper").length) {
      $(".col-xs-12.col-lg-6.p-info-wrapper").addClass("active");
    }
  }, 1e3);
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
  priplatky(setupData2, texts);
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
    console.log(`Kliknul jsi na tla\u010D\xEDtko s indexem: ${index}`);
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
      console.log(`Posunul jsi zp\u011Bt na index: ${currentIndex}`);
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
      console.log(`Posunul jsi dop\u0159edu na index: ${currentIndex}`);
    }
  });

  setTimeout(() => {
    $(".parameter-wrap.orders-1").removeClass("goToAction");
  }, 1e3);
}
function priplatky(setupData2, texts) {
  let order = 6;
  if ($(".type-detail").length) {
    $("<div>", {
      class: "upsale-wrap",
    }).insertAfter(".detail-parameters");
    createUpsaleInfo(texts);
    if ($(".parameter-id-" + koberce)[0]) {
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
      let carpetsText = setupData2.settings.carpetsText.split(",");
      let carpetsValue = setupData2.settings.carpetsValue.split(",");
      let carpetsImage = setupData2.settings.carpetsImage.split(",");
      let carpetsPrice = setupData2.settings.carpetsPrice.split(",");
      if (dataLayer[0].shoptet.projectId == "704436") {
        carpetsText = setupData2.settings.carpetsTextcs.split(",");
        carpetsValue = setupData2.settings.carpetsValuecs.split(",");
        carpetsPrice = setupData2.settings.carpetsPricecs.split(",");
      }
      $(carpetsText).each(function (e) {
        createUpsaleButton(
          "https://cdn.myshoptet.com/usr/704436.myshoptet.com/user/documents/upload/assets/new/" + prefix + carpetsImage[e],
          this,
          parameterWrap,
          carpetsValue[e],
          "radio",
          carpetsPrice[e],
          false,
          texts
        );
      });
    }
    if ($(".parameter-id-" + boxy)[0]) {
      let boxsText = setupData2.settings.boxsText.split(",");
      const boxsValue = setupData2.settings.boxsValue.split(",");
      const boxsImage = setupData2.settings.boxsImage.split(",");
      let boxsPrice = setupData2.settings.boxsPrice.split(",");
      if (dataLayer[0].shoptet.projectId == "704436") {
        boxsText = setupData2.settings.boxsTextcs.split(",");
        boxsPrice = setupData2.settings.boxsPricecs.split(",");
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
          "https://cdn.myshoptet.com/usr/704436.myshoptet.com/user/documents/upload/assets/new/" + prefix + boxsImage[e],
          this,
          parameterWrap2,
          boxsValue[e],
          "config",
          boxsPrice[e],
          true,
          texts
        );
      });
    }
    $("<div>", { class: "content-wrap" }).insertAfter(".p-info-wrapper .detail-parameters");
    firstPage(texts);
    const pairVariantList = JSON.parse(setupData2.settings.pairVariantList);
    const pairedOrders = {};
    let orders = 2;
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
      if (id == "37" || id == "22" || id == "88" || id == "89") return;
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
      $(".p-variants-block .surcharge-list:contains('Rozm\u011Br 2. Boxu') option[data-index='0']").text("Zvolte velikost 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Rozm\u011Br boxu') option[data-index='0']").text("Zvolte velikost boxu");
      $(".p-variants-block .surcharge-list:contains('Velikost 2. Boxu') option[data-index='0']").text("Zvolte velikost 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Barva boxu') option[data-index='0']").text("Zvolte barvu boxu");
      $(".p-variants-block .surcharge-list:contains('Barva 2. boxu') option[data-index='0']").text("Zvolte barvu 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Um\xEDst\u011Bn\xED volantu') option[data-index='0']").text(
        "Pros\xEDm, vyberte um\xEDst\u011Bn\xED volantu"
      );
    }
    if ($("html[lang='sk']").length) {
      $(".p-variants-block .surcharge-list:contains('Ve\u013Ekos\u0165 boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 boxu");
      $(".p-variants-block .surcharge-list:contains('Rozmer 2. Boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Rozmer boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 boxu");
      $(".p-variants-block .surcharge-list:contains('Ve\u013Ekos\u0165 2. Boxu') option[data-index='0']").text(
        "Zvo\u013Ete ve\u013Ekos\u0165 2.boxu"
      );
      $(".p-variants-block .surcharge-list:contains('Farba boxu') option[data-index='0']").text("Zvo\u013Ete farbu boxu");
      $(".p-variants-block .surcharge-list:contains('Farba 2. boxu') option[data-index='0']").text("Zvo\u013Ete farbu 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Umiestenie volantu') option[data-index='0']").text("Pros\xEDm,vyberte umiestnenie volantu");
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
$(document).on("click", ".upsale-button", function (e) {
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
$(document).on("click", ".close-btn.return", function () {
  if (!optionTest()) return;
  $(this).parents(".upsale-Banner").removeClass("showConf");
});
function firstPage(texts) {
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
  const header = $("h1").text();
  if (header.includes("box")) return;
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
    `<div class='button option-button active' data-value='left'><span>EU</span><img src='https://704436.myshoptet.com/user/documents/upload/assets/image/Layer_left.png' alt='250.jpg'><div class='text'>V\u013Eavo</div></div>`
  ).appendTo(wheelOption);
  $(
    `<div class='button option-button' data-value='right'><img src='https://704436.myshoptet.com/user/documents/upload/assets/image/Layer_right.png' alt='251.jpg'><div class='text'>Vpravo</div><span>UK</span></div>`
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
  const patterns = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active",
  }).appendTo(".content-wrap");
  $('<div class="order">2</div>').appendTo(patterns);
  $('<h5 class="variant name">' + texts.carpet_quilting_pattern + "</h5>").appendTo(patterns);
  const patternsWrap = $("<div>", {
    class: "parameter-cars patterns-wrap",
  }).appendTo(patterns);
  let diamondurl = $(".detail-parameters tr:contains('diamond') td").text();
  let hexaurl = $(".detail-parameters tr:contains('hexa') td").text();
  let stripeurl = $(".detail-parameters tr:contains('stripe') td").text();
  console.log(diamondurl);
  const diamond = $(
    `<a href="${diamondurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/diamont.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> DIAMOND LINE</div></a>`
  ).appendTo(patternsWrap);
  const hexa = $(
    `<a href="${hexaurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/hesaline.jpg?v1" alt="Pattern1.jpg"><div class="banner-header">HEXA LINE</div></a>`
  ).appendTo(patternsWrap);
  const stripe = $(
    `<a href="${stripeurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/stripe-line.jpg?v1" alt="Pattern1.jpg"><div class="banner-header"> STRIPE LINE</div></a>`
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
}
$("body").on("click", ".btn.choice-Model", function () {
  createModelInfo();
});
$("body").on("click", ".modl-selector-wrap", function () {
  createModelInfo();
});

function createModelInfo() {
  if ($("#model-info")[0] || $(".in-index")[0]) return;
  const model = sessionStorage.getItem("model");
  console.log(model);
  if (model && (model.includes("Zna\u010Dka") || model.trim() === "Model" || model.includes("Rok v\xFDroby") || model.includes("Typ auta"))) {
    return;
  }
  if (model) {
    const modelInfo = $("<section>").attr("id", "model-info").insertBefore("section#model-selector");
    $("section#model-selector").hide();
    const infoWrap = $("<div>").addClass("model-info").appendTo(modelInfo);
    $("<div>").addClass("header-info").text("Garancia kompatibility s Va\u0161\xEDm vozidlom").appendTo(infoWrap);
    $("<div>").addClass("model-text").text(model).appendTo(infoWrap);
    $("<div>").addClass("setup-model").text("Upravi\u0165").appendTo(infoWrap);
    $(".setup-model").on("click", function () {
      $("section#model-selector").show();
      modelInfo.remove();
    });
  }
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
        $("html, body").animate(
          {
            scrollTop: $(scrollselector).offset().top,
          },
          500
        );
        $("#model-selector").fadeIn(200);
      });
      $("#model-selector").addClass("errorToCart");
      setTimeout(() => {
        $("#model-selector").removeClass("errorToCart");
      }, 2e3);
    },
  }).appendTo(popup);
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
function calculateStandartPrice(diference2) {
  setTimeout(() => {}, 1e3);
  console.log(diference2);
  const price2 = Number(
    $("span.calculated-price")
      .text()
      .replace(/[^0-9]/g, "")
  );
  let newStandartPrice = price2 + diference2;
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
  const discount = Math.round(((newStandartPrice - price2) / newStandartPrice) * 100);
  console.log("discount", discount);
  $(".p-final-price-wrapper .price-save").text("- " + discount + "%");
  $(".p-final-price-wrapper .price-standard span").not(".price-save").text(NumToPrice(newStandartPrice));
  updateBoxPrice();
}
window.allowDirectAddToCart = false;
function optionTest() {
  console.log("optionTest");
  let allSelected = true;
  let firstErrorElement = null;
  $(".config-wrap .parameter-wrap:visible").each(function () {
    if (!$(this).find(".option-button.active").length) {
      $(this).addClass("errorToCart");
      if (!firstErrorElement) {
        firstErrorElement = $(this);
      }
      allSelected = false;
      setTimeout(() => {
        $(this).removeClass("errorToCart");
      }, 2e3);
    }
  });
  if (firstErrorElement) {
    $("html, body").animate(
      {
        scrollTop: firstErrorElement.offset().top - 100,
      },
      500
    );
  }
  return allSelected;
}
window.allowDirectAddToCart = false;
function updateUpsale($this, event) {
  $(".image-wrap").remove();
  const trunk = $($this).closest(".upsale-buttons.trunk");
  const boxs = $($this).closest(".upsale-buttons.boxs");
  if (trunk.length) {
    if (trunk.hasClass("minimalize")) {
      event.stopPropagation();
      trunk.removeClass("minimalize");
    } else {
      $(".upsale-buttons.boxs").show();
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
  const value = $($this).attr("value")?.split("-");
  console.log(value);
  if (value) {
    if (boxs.length) {
      $(".upsale-buttons.boxs .upsale-button").removeClass("active");
    }
    if ($($this).hasClass("active")) {
      $($this).removeClass("active");
      $("select.surcharge-parameter.parameter-id-" + value[0]).val(0);
    } else {
      if ($($this).hasClass("radio")) {
        $(".upsale-button.radio ").removeClass("active");
      }
      $($this).addClass("active");
      $("select.surcharge-parameter.parameter-id-" + value[0]).val(value[1]);
    }
    if ($($this).hasClass("config")) {
      $($this).parents(".upsale-Banner").addClass("showConf");
    }
  }
  setTimeout(() => {
    if (typeof shoptet !== "undefined" && shoptet.surcharges?.updatePrices) {
      shoptet.surcharges.updatePrices();
    } else {
      console.warn("Funkce `shoptet.surcharges.updatePrices` nen\xED dostupn\xE1.");
    }
  }, 100);
  setTimeout(() => {
    calculateStandartPrice(diference);
  }, 200);
}
function updateBoxPrice() {
  $(".box-config .parameter-wrap").each(function () {
    const price2 = Number($(this).find(".price.price-standart").attr("data-price"));
    const addPrice = Number($(this).find(".button.option-button.text.active .price").attr("data-price"));
    console.log(price2, addPrice);
    if (addPrice) {
      $(this)
        .find(".price.price-standart")
        .text(NumToPrice(price2 + addPrice));
    }
  });
}
function createUpsaleInfo(texts) {
  const upsaleBanner = $("<div>", {
    class: "upsale-Banner",
  }).insertAfter(".detail-parameters");
  const bannerWrap = $('<div class="updale-banner-info"></div>').appendTo(upsaleBanner);
  $('<icon class="icon">!</icon>').appendTo(bannerWrap);
  const productName = $("h1").text().toLowerCase();
  const idUpsaleBanner = [3039, 3033, 3036];
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
  priceActualization2(e);
  setTimeout(() => {
    calculateStandartPrice(diference);
  }, 100);
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
function priceActualization2(e) {
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
      .fadeIn(1e3);
    $("<img>", { src: image2 }).appendTo(imageWrap);
  });
  $(".parameter-wrap").not($(e.target).parents(".parameter-wrap")).find(".image-wrap").remove();
}

// assets/js/functions/stickyphotos.js
document.addEventListener("DOMContentLoaded", function () {
  if (!$("body.desktop").length) {
    return;
  }
  setTimeout(initStickyPhotos, 500);
});
function initStickyPhotos() {
  const imageWrapper = document.querySelector(".p-image-wrapper");
  const productTop = document.querySelector(".product-top");
  if (!imageWrapper || !productTop) {
    console.log("Produktov\xE9 elementy nenalezeny");
    return;
  }
  imageWrapper.style.willChange = "transform";
  const stickyOffset = 100;
  let imageWrapperHeight = imageWrapper.offsetHeight;
  let productTopRect = productTop.getBoundingClientRect();
  let productTopTop = productTopRect.top + window.pageYOffset;
  let productTopHeight = productTop.offsetHeight;
  let initialOffsetTop = imageWrapper.getBoundingClientRect().top + window.pageYOffset;
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updatePosition);
      ticking = true;
    }
  }
  function updatePosition() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    imageWrapperHeight = imageWrapper.offsetHeight;
    productTopHeight = productTop.offsetHeight;
    productTopTop = productTop.getBoundingClientRect().top + window.pageYOffset;
    initialOffsetTop = productTopTop;
    const maxScroll = productTopHeight - imageWrapperHeight;
    let translateY = 0;
    const stickyStart = initialOffsetTop - stickyOffset;
    if (scrollY < stickyStart) {
      translateY = 0;
    } else {
      translateY = Math.min(scrollY - stickyStart, maxScroll);
    }
    imageWrapper.style.transform = `translateY(${translateY}px)`;
    ticking = false;
  }
  function updateDimensions() {
    imageWrapperHeight = imageWrapper.offsetHeight;
    productTopHeight = productTop.offsetHeight;
    productTopTop = productTop.getBoundingClientRect().top + window.pageYOffset;
    initialOffsetTop = productTopTop;
    updatePosition();
  }
  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", updateDimensions);
  updateDimensions();
  updatePosition();
}

// assets/js/components/header.js
function initHeader() {
  $(".top-navigation-bar-menu-helper").empty();
  $("ul.top-navigation-bar-menu li").addClass("cropped").clone().appendTo(".top-navigation-bar-menu-helper");
  $(".navigation-buttons .cart-count span:contains(ko\u0161\xEDk)").text("Ko\u0161\xEDk");
  $('<a href="#" class="toggle-window" data-target="search" data-testid="linkSearchIcon"></a>').prependTo(".desktop  .navigation-buttons");
  $("<div>", {
    class: "navigation-show",
    text: "E-shop",
  }).appendTo(".top-navigation-bar .container");
  $("div#menu-widget").appendTo(".top-navigation-bar .container");
  $(".navigation-show").on("click", function () {
    $("body").toggleClass("showNav");
  });
  $("body").on("click", function (e) {
    if (!$(e.target).closest("#menu-widget").length && !$(e.target).closest(".navigation-show").length) {
      $("body").removeClass("showNav");
    }
  });
  $('<a class="contact-link" href="/kontakt/">Kontakt</a>').prependTo(".navigation-buttons");
  headerFixProdukt();
}
headerFixProdukt();
function headerFixProdukt() {
  if ($(".in-kosik")[0] || $(".in-krok-1")[0]) {
    return;
  }
  function getElementOffsetTop(element) {
    return parseInt(element.getBoundingClientRect().top + window.pageYOffset);
  }
  function debounceScroll(func, wait, immediate, args) {
    let timeout;
    const context = this;
    const argArray = arguments;
    return function (event) {
      const laterFunction = function () {
        timeout = null;
        if (!immediate) func.apply(context, argArray);
      };
      clearTimeout(timeout);
      timeout = setTimeout(laterFunction, wait);
      if (immediate && !timeout) func.apply(context, argArray);
    };
  }
  const passiveListener = { capture: true, passive: true };
  class FixedHeader {
    constructor() {
      window.addEventListener("DOMContentLoaded", () => {
        this.init();
      });
    }
    init() {
      const header = document.querySelector("header");
      const productForm = document.getElementById("product-detail-form");
      if (!header || !productForm) {
        console.warn("Stop render conversion header");
        return false;
      }
      const submitButton = productForm.querySelector("button[type=submit]") || productForm.querySelector("input[type=submit]");
      const fixedHeaderDiv = document.createElement("div");
      const buttonOffsetTop = getElementOffsetTop(submitButton);
      const productTitle = document.getElementsByTagName("h1")[0]?.innerText || "";
      const metaImage = document.querySelector('meta[property~="og:image"]');
      const imageUrl = metaImage && metaImage.getAttribute("content");
      const availabilityElement =
        document.getElementsByClassName("cell-availability-value")[0] ||
        document.getElementsByClassName("product-detail-availability")[0] ||
        document.getElementsByClassName("availability")[0] ||
        document.getElementsByClassName("availability-label")[0];
      const priceElement =
        document.getElementsByClassName("price-final-holder")[0] ||
        document.getElementsByClassName("sub-left-position")[0] ||
        document.getElementsByClassName("product-detail-final-price")[0] ||
        document.getElementsByClassName("price-final-holder")[0];
      const scrollHandler = debounceScroll(function () {
        const shouldShowFixed = window.pageYOffset > buttonOffsetTop;
        const pluginHeader = document.querySelector("#js-plugin-header");
        const isSticky = "sticky" === getComputedStyle(header).position;
        const isDesktop = window.innerWidth > 468;
        const headerHeight = header.clientHeight;
        if (shouldShowFixed) {
          pluginHeader?.classList.add("active");
          if (isDesktop && isSticky) {
            pluginHeader.style = `top: ${headerHeight}px`;
          }
        } else {
          pluginHeader?.classList.remove("active");
          if (isDesktop && isSticky) {
            pluginHeader.style = "top: -200px";
          }
        }
      }, 5);
      window.addEventListener("scroll", () => scrollHandler(), passiveListener);
      setTimeout(() => {
        const fixedButton = document.querySelector("#js-plugin-fixed-header-add-to-cart");
        if (fixedButton) {
          fixedButton.addEventListener("click", () => {
            submitButton?.click();
          });
        }
      }, 1e3);
      fixedHeaderDiv.innerHTML = `
        <div class="plugin-fixed-header" id="js-plugin-header">
          <div class="fixed-header-container">
            <div class="plugin-fixed-header__image">
              <img src="${imageUrl}" class="plugin-fixed-header__img" alt="${submitButton.innerText}">
            </div>
            <div class="plugin-fixed-header__name">
              ${productTitle}
              <span class="plugin-fixed-header__availability">
                (${availabilityElement?.innerText || ""})
              </span>
            </div>  
            <div class="plugin-fixed-header__price">
              ${priceElement?.innerHTML || ""}
            </div>
            <div class="plugin-fixed-header__basket"> 
              <button class="${submitButton?.classList || ""}" id="js-plugin-fixed-header-add-to-cart"> 
                ${window.shoptet?.messages?.toCart || "Add to Cart"}
              </button>
            </div>
          </div>
        </div>`;
      header.parentNode.insertBefore(fixedHeaderDiv, header);
    }
  }
  new FixedHeader();
}

// assets/js/functions/video-play-again.js
function initVideoPlayAgain() {
  console.log("initVideoPlayAgain called");
  jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .slick-slide video").off(
    "click.videoControl touchend.videoControl ended.videoControl play.videoControl pause.videoControl"
  );
  function pauseOtherVideos(currentVideo) {
    jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .slick-slide video").each(function () {
      if (this !== currentVideo && !this.paused) {
        this.pause();
      }
    });
  }
  function initSingleVideo($video) {
    const $container = $video.parent();
    const videoEl = $video[0];
    console.log("Processing video:", {
      videoSrc: $video.find("source").attr("src") || "no source",
      containerClasses: $container.attr("class") || "no classes",
      videoClasses: $video.attr("class") || "no classes",
      isInSlider: $video.closest(".slick-slide").length > 0,
    });
    if ($container.hasClass("wrapper")) {
      $video.show();
      console.log("Wrapper video found:", $video.attr("class"), "in container:", $container.attr("class"));
    } else {
      const isMobile = window.innerWidth < 768;
      if ((isMobile && $video.hasClass("desctop")) || (!isMobile && $video.hasClass("mobile"))) {
        $video.css("display", "none");
        return;
      } else {
        $video.show();
      }
    }
    let $playPauseBtn = $container.find(".playpause");
    if ($playPauseBtn.length === 0) {
      $playPauseBtn = jQuery('<div class="playpause"></div>');
      $container.append($playPauseBtn);
      console.log("Created new playpause button");
    } else {
      console.log("Found existing playpause button");
    }
    function updateButtonState() {
      if (videoEl.ended) {
        $video.removeClass("active");
        $playPauseBtn.html("<span>P\u0159ehr\xE1t znovu</span>").css({ display: "flex", opacity: 1 }).show();
      } else if (videoEl.paused) {
        $video.removeClass("active");
        $playPauseBtn.text("").css({ display: "flex", opacity: 1 }).show();
      } else {
        $video.addClass("active");
        $playPauseBtn.text("").fadeOut(200);
      }
    }
    $video.on("click.videoControl touchend.videoControl", function (e) {
      e.stopPropagation();
      e.preventDefault();
      console.log("Video clicked/touched:", {
        isMobile: window.innerWidth < 768,
        videoClass: $video.attr("class") || "no classes",
        paused: videoEl.paused,
      });
      if (videoEl.paused) {
        pauseOtherVideos(videoEl);
        videoEl.play().catch((error) => console.error("Video play failed:", error));
      } else {
        videoEl.pause();
      }
    });
    $playPauseBtn.on("click.videoControl", function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (videoEl.ended) {
        pauseOtherVideos(videoEl);
        videoEl.currentTime = 0;
        videoEl.play();
      } else if (videoEl.paused) {
        pauseOtherVideos(videoEl);
        videoEl.play();
      } else {
        videoEl.pause();
      }
      return false;
    });
    $video.on("play.videoControl", function () {
      pauseOtherVideos(videoEl);
      updateButtonState();
    });
    $video.on("pause.videoControl ended.videoControl", updateButtonState);
    updateButtonState();
  }
  jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .slick-slide video").each(function () {
    const $video = jQuery(this);
    initSingleVideo($video);
  });
  jQuery(document).on("click.videoControl touchend.videoControl", ".slick-slide video", function (e) {
    const $video = jQuery(this);
    const videoEl = $video[0];
    e.stopPropagation();
    e.preventDefault();
    console.log("Slick video clicked via delegation:", {
      src: $video.find("source").attr("src") || "no source",
      paused: videoEl.paused,
    });
    if (videoEl.paused) {
      pauseOtherVideos(videoEl);
      videoEl.play().catch((error) => console.error("Video play failed:", error));
    } else {
      videoEl.pause();
    }
  });
  jQuery(document).on("afterChange", ".slick-initialized", function (event, slick, currentSlide) {
    console.log("Slick slide changed, reinitializing videos");
    setTimeout(() => {
      jQuery(".slick-active video").each(function () {
        const $video = jQuery(this);
        if (!$video.data("video-initialized")) {
          initSingleVideo($video);
          $video.data("video-initialized", true);
        }
      });
    }, 100);
  });
}

// assets/js/components/cart.js
function initCart(setupData2) {
  console.log("Cart initialized");
  if ($(".id--9")[0]) {
    $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
    $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    changeDescription();
    chechCupon();
    document.addEventListener("ShoptetDOMContentLoaded", function () {
      chechCupon();
      $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
      $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    });
  }
}
function changeDescription() {
  console.log("Changing description for cart items");
  $("span.main-link-surcharges").each(function () {
    const text = $(this).text().split(",");
    let newText = "";
    if (text.length > 1) {
      $(text).each(function () {
        newText += " <br> " + this;
      });
    }
    console.log(text);
    $(this).html(newText);
  });
}
function chechCupon() {
  console.log("Checking coupon code in cart -----------------------");
  const getCode = shoptetData.cartInfo.discountCoupon.code;
  let chechCupon2 = false;
  if (getCode == "LUX10") {
    console.log("Checking coupon code:", getCode);
    $(".main-link-surcharges").each(function () {
      const $this = $(this);
      if (
        $this.text().includes("Farba boxov ") ||
        $this.text().includes("autokoberce do kufru - Jednoduch\xE9") ||
        $this.text().includes("Kompletn\xED ochrana")
      ) {
        console.log("Coupon found in surcharge:", $this.text());
        chechCupon2 = true;
      }
    });
  }
  if (!chechCupon2) {
    if (!$(".alert.alert-warning")[0] && getCode == "LUX10") {
      setTimeout(function () {
        $(".cart-summary").before(
          '<div class="alert alert-warning" role="alert">Kup\xF3nov\xFD k\xF3d LUX10 je mo\u017En\xE9 pou\u017Ei\u0165 iba pri n\xE1kupe setu s doplnkami (ochrana kufra alebo boxy).</div>'
        );
      }, 1e3);
    }
    console.log("Coupon code is not valid, applying changes");
    $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }
}

// assets/js/functions/validation.js
function validation() {
  $("button.btn.btn-lg.btn-conversion.add-to-cart-button").on("click", function (e) {
    console.log("Validation triggered");
    errorToCart(e);
    const $errorElements = $(".errorToCart");
    if ($errorElements.length) {
      const topElement = $errorElements.toArray().reduce((prev, curr) => {
        return $(prev).offset().top < $(curr).offset().top ? prev : curr;
      });
      $("html, body").animate(
        {
          scrollTop: $(topElement).offset().top - 500,
        },
        500
      );
    }
  });
}
function errorToCart(e) {
  console.log("Error to cart initialized");
  if ($(".goToAction")[0]) {
    console.log("goToAction exists");
    $(".goToAction").addClass("errorToCart");
    setTimeout(() => {
      $(".goToAction").removeClass("errorToCart");
    }, 2e3);
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (!$(".upsale-buttons")[0]) {
    document.addEventListener("ShoptetCartUpdated", function () {
      window.location.href = "/kosik/";
    });
    return;
  }
  if ($(".upsale-popup-active")[0]) {
    document.addEventListener("ShoptetCartUpdated", function () {
      window.location.href = "/kosik/";
    });
    return;
  }
  const length = $(".upsale-buttons .active").not(".none").length;
  console.log("Active upsale buttons:", length);
  if (length == 0) {
    e.preventDefault();
    e.stopPropagation();
    showUpsalePopup();
  }
  document.addEventListener("ShoptetCartUpdated", function () {
    window.location.href = "/kosik/";
  });
  return;
}

// assets/js/script.js
var setupData;
$.getJSON(optionData.downloadData, function (data) {
  setupData = data;
  console.log("setupData:", setupData);
  console.log("setupData.settings:", setupData.settings);
  console.log("setupData.cars:", setupData.cars);
  let language2 = dataLayer[0].shoptet.language;
  if (dataLayer[0].shoptet.projectId == 704436) {
    language2 = "cs";
  }
  const texts = setupData.language[language2];
  console.log("setupData.language:", texts);
  initModelSelect2(texts, setupData);
  googleReviews(setupData, texts);
  initProduct(setupData, texts);
  addNote();
  validation();
  $(".config-wrap .parameter-wrap:eq(1)").addClass("noText");
  $(".config-wrap .parameter-wrap:eq(2)").addClass("noText");
});
var logoGoogle =
  '<svg viewBox="0 0 512 512" height="18" width="18"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path></g></svg>';
jQuery(document).ready(function ($2) {
  initHeader();
  intIndex();
  initSignpost();
  initVideoPlayAgain();
  initCart();
  setTimeout(() => {
    $2("body").addClass("showBody");
  }, 500);
});
function initModelSelect2(texts) {
  const header = $("h1").text();
  if (header.includes("box")) return;
  let insertPosidion = ".in-index .content-wrapper.container:eq(1)";
  if ($(".in-rozcestnik")[0]) {
    insertPosidion = ".in-rozcestnik #Model-selecte";
  }
  if ($(".type-product")[0]) {
    insertPosidion = ".availability-value";
  }
  if ($("body.mobile")[0]) {
    if ($(".in-index")[0]) {
      insertPosidion = ".in-index .row.banners-content.body-banners";
    }
    if ($(".in-rozcestnik")[0]) {
      insertPosidion = ".in-rozcestnik #sets";
    }
    if ($(".type-product")[0]) {
      insertPosidion = ".p-info-wrapper";
    }
  }
  let getBrand, getModel, getYear, getCarType;
  try {
    getBrand = sessionStorage.getItem("Brand") || null;
    getModel = sessionStorage.getItem("Model") || null;
    getYear = sessionStorage.getItem("Year") || null;
    getCarType = sessionStorage.getItem("carType") || null;
  } catch (e) {
    console.warn("SessionStorage is not available:", e);
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
  $(setupData.settings.carVariant.split(",")).each(function () {
    const option = $("<option>").text(this).appendTo(".type-selector .selector select");
  });
  if (getBrand != null) {
    console.log(getBrand);
    $("<option>" + getBrand + "</option>").prependTo(".surcharge-list.brands.dm-selector select");
    $(".surcharge-list.brands.dm-selector select").val(getBrand);
  }
  if (getModel != null) {
    setTimeout(() => {
      if (models_for_brand && Array.isArray(models_for_brand)) {
        for (let i = 0; i < models_for_brand.length; i++) {
          $("<option>" + models_for_brand[i] + "</option>").appendTo(".surcharge-list.models.dm-selector select");
          if (models_for_brand[i] === getModel) {
            $(".surcharge-list.models.dm-selector select").val(models_for_brand[i]);
          }
        }
      }
    }, 1e3);
    const models_for_brand = setupData.cars[getBrand];
    if (getModel != null) {
      $(".surcharge-list.models.dm-selector select").val(getModel);
    }
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
  const d = /* @__PURE__ */ new Date();
  const currentYear = d.getFullYear();
  for (let year = Number(years_from); year <= currentYear; year++) {
    $("<option>" + year + "</option>").appendTo(".years select");
  }
  const other_option = "<option>" + other + "</option>";
  $(other_option).appendTo(".type select");
  $(other_option).appendTo(".years select");
  $(".brands select").on("change", function () {
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
  setTimeout(() => {
    $(".surcharge-list select").on("change", function () {
      console.log("change");
      saveModel(false);
    });
  }, 1e3);
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
        sessionStorage.setItem("model", Brand + " " + Model + " " + Year + " " + type);
      }
      sessionStorage.setItem("Year", Year);
      sessionStorage.setItem("carType", type);
    } catch (e) {
      console.warn("Session storage is not available:", e);
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
      }, 2e3);
      return;
    }
    window.location.href = "/rozcestnik/";
  }
}
function initSignpost() {
  const model = sessionStorage.getItem("model");
  $("section#Model-selecte .model span").text(model);
}
function googleReviews(setupData2, texts) {
  const googleRef = `<div class="HeaderContainer__Inner-sc-1532ffp-0 kfmkAH HeaderComponent__StyledHeader-sc-9lcg5s-0 ggCtvU es-header-container"><div class="HeaderInfoContainer__Info-sc-16jx15e-0 iXURJw HeaderStyle8__Info-sc-b1gtz-1 fYYhKJ es-header-info"><div class="HeaderRating__RatingContainer-sc-117jf4y-0 iTpmcQ HeaderStyle8__StyledHeaderRating-sc-b1gtz-0 brkxaF es-header-rating-container"><div class="Rating__Container-sc-bk54oq-0 izQGGt es-rating-container HeaderRating__Rating-sc-117jf4y-1 ieRgGM es-header-rating"><div class="RatingValue__Container-sc-fl6036-0 iCNeqx es-rating-value">4.9</div></div></div><div class="HeaderHeading__Container-sc-1fncda3-0 llhhPp es-header-heading-container"><div class="HeaderHeading__Text-sc-1fncda3-1 AGaFi es-header-heading-text">${texts.google_review}</div></div><div class="HeaderRating__RatingContainer-sc-117jf4y-0 iTpmcQ es-header-rating-container"><div class="Rating__Container-sc-bk54oq-0 izQGGt es-rating-container HeaderRating__Rating-sc-117jf4y-1 ieRgGM es-header-rating"><div class="RatingBar__Container-sc-qimg51-0 eyLxdR es-rating-bar-container"><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-unfilled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw fHHaSD es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div></div></div><span class="HeaderRating__ReviewsCount-sc-117jf4y-2 kSLkip es-header-rating-reviews-count">(47)</span></div></div><div class="HeaderWriteReviewButton__Component-sc-a5mrro-0 kBskxl es-header-write-review-button-container"><a target="_blank" href="https://www.google.com/maps/place/Luxury+Car+Design/@49.1861708,18.7330054,1043m/data=!3m1!1e3!4m8!3m7!1s0x8c8f632b21071671:0xd702e416d6787c20!8m2!3d49.1861708!4d18.7330054!9m1!1b1!16s%2Fg%2F11txlgxckd?authuser=0&hl=cs&entry=ttu&g_ep=EgoyMDI1MDYwMy4wIKXMDSoASAFQAw%3D%3D" ><button size="14" class="ButtonBase__ButtonContainer-sc-p43e7i-3 euBiGU HeaderWriteReviewButton__WriteReviewButton-sc-a5mrro-1 iqYjDs es-header-write-review-button" type="button" style="border-radius: 24px; border-color: rgba(0, 0, 0, 0); line-height: 1.32; color: rgb(255, 255, 255); font-family: inherit; font-weight: bold; font-size: 14px; font-style: normal; background-color: rgb(25, 123, 255); border-width: 2px;"><span class="ButtonBase__Overlay-sc-p43e7i-4 jhGZeV" style="padding: 8px 21px; border-radius: calc(22px); background-color: rgba(0, 0, 0, 0);"><span class="ButtonBase__Ellipsis-sc-p43e7i-5 dqiKFy">${texts.show_on_google}</span></span></button><a></div></div>`;
  const google = $("<section/>").attr("id", "goggle-review-wrap").html(googleRef);
  if ($(".mobile")[0]) {
    google.appendTo(".row.banners-content.body-banners");
    google.clone().insertBefore(".in-index #footer");
    const googleRew = $("<div/>").addClass("review-row").insertBefore(".in-index #footer");
    const container = $('<div class="container"></div>').appendTo(googleRew);
    $(".google-reviews").appendTo(container);
  } else {
    google.insertAfter(".in-index section#model-selector");
    google.clone().insertBefore(".in-index #footer");
    const googleRew = $("<div/>").addClass("review-row").insertBefore(".in-index #footer");
    const container = $('<div class="container"></div>').appendTo(googleRew);
    $(".google-reviews").appendTo(container);
  }
}
setTimeout(function () {
  $(logoGoogle).appendTo(".review-item-long");
  $("#google-reviews br").remove();
}, 2500);
function addNote() {
  if ($(".id--17")[0]) {
    let toNote = function () {
      const city2 = sessionStorage.getItem("adressDelivery");
      const fakturacniAdresa =
        `
            Adresa zadan\xE1 pro v\xFDpo\u010Det:
             ` +
        city2 +
        `
      
     
        `;
      const model =
        `
            model : ` +
        sessionStorage.getItem("model") +
        `  
        `;
      let poznamka = $("#remark").val();
      if (poznamka) {
        poznamka += `

${model}`;
      } else {
        poznamka = model;
      }
      $("#remark").val(poznamka);
    };
    console.log("adresa");
    const city = sessionStorage.getItem("model");
    console.log(city);
    shoptet.custom.postSuccessfulValidation = function (form) {
      if ($(form).attr("id") === "order-form") {
        console.log("tttt");
        toNote();
      }
      return true;
    };
  }
}
