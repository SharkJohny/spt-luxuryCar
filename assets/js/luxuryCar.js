// assets/js/option.js
var timestamp = Date.now();
console.log("Timestamp for data.json:", timestamp);
var optionData = {
  key: "value",
  downloadData: "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json?" + timestamp
};

// assets/js/components/index.js
function intIndex() {
  const lang2 = dataLayer[0].shoptet.projectId == 704436 ? "cs" : shoptetData.language || dataLayer[0].shoptet.language;
  function initTwentyTwenty() {
    $(".twentytwenty-container").twentytwenty({
      before_label: lang2 === "cs" ? "Potom" : "Po",
      after_label: lang2 === "cs" ? "P\u0159edt\xEDm" : "Predt\xFDm"
    });
  }
  const $ttImages = $(".twentytwenty-container img");
  if ($ttImages.length) {
    const loadPromises = $ttImages.toArray().map(function(img) {
      return new Promise(function(resolve) {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }
      });
    });
    Promise.all(loadPromises).then(initTwentyTwenty);
  }
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
        step: function(now) {
          $element.text(Math.floor(now));
        },
        complete: function() {
          $element.text(targetNumber);
        }
      }
    );
  }
  $(document).on("click", ".accordion", function(e) {
    e.preventDefault();
    console.log("Accordion clicked!");
    $(this).toggleClass("active");
    var $panel = $(this).next(".panel");
    console.log("Found panel:", $panel.length);
    if (!$panel.length) return;
    if ($panel.css("display") === "none") {
      $panel.css("display", "block");
    } else {
      $panel.css("display", "none");
    }
  });
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
  $("[count-up]").each(function() {
    observer.observe(this);
  });
  setTimeout(function() {
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
            arrows: true
          }
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3
          }
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
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
          arrows: true
        }
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 3
        }
      },
      {
        breakpoint: 770,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 350,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });
  setTimeout(function() {
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
            arrows: true
          }
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3
          }
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
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
            arrows: true
          }
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3
          }
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    });
  }, 1e3);
  $("button.text-with-icon.group").on("click", function() {
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
  $(".btn.more-pictures-button").on("click", function() {
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
  $(".hotspot").on("click", function() {
    $(this).parents(".layers-info-wrap").addClass("show");
    $(".tooltips").removeClass("show");
    $(this).find(".tooltips").addClass("show");
  });
  $(document).on("click", function(e) {
    const $target = $(e.target);
    if (!$target.closest(".hotspot").length && !$target.closest(".tooltips").length) {
      $(".tooltips").removeClass("show");
    }
  });
  setTimeout(function() {
    $(".review-photo").each(function() {
      const width = $(this).width();
      $(this).height(width);
    });
  }, 1e3);
  const faq = $('<div class="faq container"></div>');
  $("<div>").addClass("sec-header").text("\u010Casto kladen\xE9 ot\xE1zky").appendTo(faq);
  const faqContent = $('<div class="faq-content">').appendTo(faq);
  $(faqContent).load("/faq/ div[itemprop='about']", function() {
    accordion();
  });
  if ($(".in-index")[0]) {
    $(faq).insertBefore(".foto-slider");
  } else if ($(".type-product")[0]) {
    $(faq).appendTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  if ($(".type-index.admin-logged").length) {
    const adminBtn = $(`
      <button class="admin-generate-orders" type="button" style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #c49b30;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        transition: all 0.3s;
      ">
        Generovat objedn\xE1vky
      </button>
    `);
    $("body").append(adminBtn);
    adminBtn.on("click", function() {
      const $btn = $(this);
      const originalText = $btn.text();
      $btn.prop("disabled", true).text("Odes\xEDl\xE1n\xED...");
      fetch("https://projectmanager-8352.rostiapp.cz/api/ingest/luxury-cars/proces_orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ start: true })
      }).then(function(response) {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("HTTP " + response.status);
        }
      }).then(function(data) {
        $btn.text("\u2713 Odesl\xE1no").css("background", "#28a745");
        console.log("Success:", data);
        setTimeout(function() {
          $btn.prop("disabled", false).text(originalText).css("background", "#c49b30");
        }, 2e3);
      }).catch(function(error) {
        $btn.text("\u2717 Chyba").css("background", "#dc3545");
        console.error("Error:", error);
        setTimeout(function() {
          $btn.prop("disabled", false).text(originalText).css("background", "#c49b30");
        }, 2e3);
      });
    });
    adminBtn.on("mouseenter", function() {
      $(this).css("transform", "scale(1.05)");
    }).on("mouseleave", function() {
      $(this).css("transform", "scale(1)");
    });
  }
}
function accordion() {
  if (!$(".acordeoncsss")[0]) {
    $("body").addClass("acordeoncsss").append(` <style type='text/css'>
    .accordion {
    background-color: white;
       color: #444;
    cursor: pointer;
    padding: 18px;
    width: 100%;
    text-align: left;
    border: none;
    outline: none;
    transition: 0.4s;
    border-bottom: 2px solid gold;
    font-size: 18px;
    }
    .accordion.active, .accordion:hover {
      
    background-color: white;

      color: #c49b30;
      box-shadow: 0 4px 24px rgba(196,155,48,0.10);
    }
    .accordion:after {
      content: "+";
      font-size: 22px;
      color: #c49b30;
      float: right;
      margin-left: 10px;
      font-weight: 800;
      transition: transform 0.3s;
    }
    .accordion.active:after {
      content: "-";
      transform: rotate(180deg);
    }
    .panel {
      padding: 10px 24px 18px 24px;
   color: black;
    font-size: 15px;
      
      border-radius: 0 0 12px 12px;
      margin-bottom: 12px;
      display: none;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      transition: background 0.3s, color 0.3s;
    }

    .panel[style*="display: block"] {
      animation: fadeInPanel 0.3s;
    }
    @keyframes fadeInPanel {
      from { opacity: 0; transform: translateY(-10px);} 
      to { opacity: 1; transform: translateY(0);} 
    }

    /* New styles for product page limitation */
    .faq .accordion-hidden { display: none !important; }
    .faq .faq-show-more { text-align: center; margin-top: 8px; }
    .faq .faq-show-more button { background: transparent; border: 1px solid #c49b30; color: #c49b30; padding: 8px 14px; border-radius: 8px; cursor: pointer; }

    </style> `);
  }
  let evenOdd = 0;
  $(".faq").each(function() {
    try {
      let html = $(this).html();
      if (!html || html.indexOf("[accordion") === -1) return;
      html = html.replace(/\[accordion([\s\S]*?)\]/g, function(match, inner) {
        let parts = inner.split("*||*");
        if (parts.length < 3) return match;
        let button = parts[1].trim();
        let content = parts.slice(2).join("*||*").trim();
        content = content.replace(/\]$/, "");
        evenOdd += 1;
        let buttonClass = evenOdd % 2 === 0 ? "accordion" : "accordion even";
        return `</p><div class="accordion-wrapper"><button class="${buttonClass}">${button}</button><div class="panel">${content}</div></div><p>`;
      });
      $(this).html(html);
      if ($(".type-product").length) {
        const $accordions = $(this).find(".accordion-wrapper");
        if ($accordions.length > 4) {
          $accordions.each(function(i) {
            if (i >= 4) {
              $(this).addClass("accordion-hidden");
            }
          });
          if (!$(this).find(".faq-show-more").length) {
            const showMore = $(`<div class="faq-show-more"><button type="button">${lang === "sk" ? "Zobrazi\u0165 viac" : "Zobrazit v\xEDce"}</button></div>`);
            $(this).append(showMore);
            showMore.on("click", "button", function() {
              const hidden = $(this).closest(".faq").find(".accordion-hidden");
              if (hidden.length) {
                hidden.removeClass("accordion-hidden");
                $(this).text(lang === "sk" ? "Zobrazi\u0165 menej" : "Zobrazit m\xE9n\u011B");
              } else {
                const $accordions2 = $(this).closest(".faq").find(".accordion-wrapper");
                $accordions2.each(function(i) {
                  if (i >= 4) $(this).addClass("accordion-hidden");
                });
                $(this).text(lang === "sk" ? "Zobrazi\u0165 viac" : "Zobrazit v\xEDce");
                $(this).closest(".faq").find(".panel").css("display", "none");
                $(this).closest(".faq").find(".accordion").removeClass("active");
              }
            });
          }
        }
      }
    } catch (e) {
    }
  });
  $(".faq p").each(function() {
    if ($(this).html().trim() === "" || $(this).html().trim() === '<meta charset="utf-8">') {
      $(this).remove();
    }
  });
}

// assets/js/components/creatButtons.js
var twoLayersProducts;
var boxsParameterIds2;
var oneLayerProducts;
var language2 = dataLayer[0].shoptet.projectId == 704436 ? "cs" : shoptetData.language || dataLayer[0].shoptet.language;
if ($(".type-product")[0]) {
  twoLayersProducts = shoptetData.product.id == 601 || shoptetData.product.id == 604 || shoptetData.product.id == 607;
  boxsParameterIds2 = [94, 97, 104];
  oneLayerProducts = shoptetData.product.id == 598 || shoptetData.product.id == 610 || shoptetData.product.id == 613;
  if (dataLayer[0].shoptet.projectId == "581408") {
    $(".custom-footer__banner10").hide();
    twoLayersProducts = shoptetData.product.id == 2406 || shoptetData.product.id == 2409 || shoptetData.product.id == 2412;
    oneLayerProducts = shoptetData.product.id == 2403 || shoptetData.product.id == 2415 || shoptetData.product.id == 2418;
    boxsParameterIds2 = [66, 69, 78, 104];
  }
}
var ButtonUtils = {
  /**
   * Creates HTML for price display
   * @param {number} price - Base price
   * @param {number} save - Amount saved
   * @param {boolean} prefix - Whether to show "od" prefix
   * @returns {string} HTML string for price display
   */
  createPriceHTML: (price2, save, prefix) => {
    if (prefix) {
      return `<div class="price">od ${NumToPrice(price2)}</div><div class="save" data-save="${save}">U\u0161etr\xEDte a\u017E ${NumToPrice(save)}</div>`;
    }
    return `<div class="price">${NumToPrice(price2)}</div><div class="save" data-save="${save}">U\u0161etr\xEDte ${NumToPrice(save)}</div>`;
  },
  /**
   * Determines button type class
   * @param {string} type - Button type
   * @param {string|number} value - Button value
   * @returns {string} CSS class for button type
   */
  getButtonTypeClass: (type, value) => {
    if (type === "config" && value == 0) return "none";
    if (value === "89-2225") return "radio none";
    return type;
  }
};
function createSlug(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}
function createUpsaleButton(img, text, position, value, type, price2, prefix, texts) {
  if (!img || !text || !position) return;
  const priceParts = String(price2 || "0/0").split("/");
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
  if (base > 0) {
    const priceHTML = ButtonUtils.createPriceHTML(base, save, !!prefix).replace(
      /Ušetríte/,
      texts && texts.you_will_save ? texts.you_will_save : "U\u0161etr\xEDte"
    );
    $(button).find(".banner-header").append(priceHTML);
  }
  $(".upsale-Banner").hide();
  setTimeout(() => {
    $(".parameter-wrap.orders-1").removeClass("goToAction");
  }, 1e3);
}
function createOptions(position, orders) {
  let name = "";
  if (position == "box") {
    name = language2 === "cs" ? "Po\u010Det box\u016F" : "Po\u010Det boxov";
  } else if (position == "sizes") {
    name = "ve\u013Ekos\u0165";
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
      "data-option": `option-${orders}`
    }).appendTo(".navidation-Wrap");
  }
  $(".btn.button-more").on("click", function() {
    $(".pop-ower").addClass("show");
  });
  $(".close-btn").on("click", function() {
    $(".pop-ower").removeClass("show");
  });
  if (!$(`.orders-${orders}`)[0]) {
    const wrap = $("<div>", {
      class: `parameter-wrap parameter-${parameterId} orders-${orders}`,
      "data-parameterId": parameterId
    }).appendTo(optPosition);
    if (orders <= upsale) {
      $(wrap).addClass("goToAction");
      $(wrap).addClass("base-config");
    }
    $("<div>", {
      class: "order",
      text: orders
    }).appendTo(`.parameter-wrap.orders-${orders}`);
  }
  $(".navigatte-button:eq(0)").addClass("active");
  const paramerer = `.parameter-wrap.orders-${orders}`;
  console.log(name);
  const nameWrap = $("<div>", {
    class: "name-wrap"
  }).appendTo(paramerer);
  const getName = $("table.detail-parameters tr:contains(colorTitle) td").text().trim();
  console.log(getName);
  if (parameterId == "107" && getName != "") {
    name = getName;
  }
  const tooltipInfo = $(position).parents(".surcharge-list").find(".show-tooltip").attr("title") || $(position).parents(".surcharge-list").find(".show-tooltip").attr("data-original-title");
  $("<h5>", {
    class: "variant name",
    text: name
  }).appendTo(nameWrap);
  if (tooltipInfo && tooltipInfo.trim() !== "") {
    $("<div>", {
      class: "parameter-info",
      html: `<i class="info-icon">i</i> ${tooltipInfo}`
    }).appendTo(nameWrap);
  }
  const priceWrap = $("<div>", {
    class: "price-wrap"
  }).appendTo(nameWrap);
  const isBoxParam = boxsParameterIds2.includes(parseInt(parameterId));
  let basePrice = 0;
  if (isBoxParam) {
    $(`.parameter-wrap.parameter-${parameterId}.orders-${orders}`).addClass("noText");
  }
  if (isBoxParam) {
    const $select = $(position);
    const $firstWithPrice = $select.find('option[data-surcharge-final-price]:not([value=""])').filter(function() {
      const raw = String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0");
      const num = Number(raw.replace(/[^0-9]/g, ""));
      return num > 0;
    }).first();
    if ($firstWithPrice.length) {
      const raw = String($firstWithPrice.attr("data-surcharge-final-price") || $firstWithPrice.attr("data-surcharge-additional-price") || "0");
      basePrice = Number(raw.replace(/[^0-9]/g, ""));
    }
    if (!header.includes("box")) {
      $('<span class="text">Cena boxu</span>').appendTo(priceWrap);
    }
    $("<div>", {
      class: "price price-standart",
      text: basePrice > 0 ? NumToPrice(basePrice) : "0 K\u010D",
      "data-price": basePrice
    }).appendTo(priceWrap);
  }
  amountChoser(position, priceWrap);
  const optionsWrap = $("<div>", {
    class: "options-wrap"
  }).appendTo(paramerer);
  console.log(options);
  createOptionButtons(options, parameterId, optionsWrap, isBoxParam, basePrice);
  if (name == "ve\u013Ekos\u0165") {
    $(".surcharge-list").each(function() {
      const parameterId2 = $(this).find("select").attr("data-parameter-id");
      console.log(parameterId2);
      const isBoxNested = boxsParameterIds2.includes(parseInt(parameterId2));
      let basePriceNested = 0;
      if (isBoxNested) {
        const $select = $(this).find("select");
        const $firstWithPrice = $select.find('option[data-surcharge-final-price]:not([value=""])').filter(function() {
          const raw = String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0");
          const num = Number(raw.replace(/[^0-9]/g, ""));
          return num > 0;
        }).first();
        if ($firstWithPrice.length) {
          const raw = String($firstWithPrice.attr("data-surcharge-final-price") || $firstWithPrice.attr("data-surcharge-additional-price") || "0");
          basePriceNested = Number(raw.replace(/[^0-9]/g, ""));
        }
      }
      const parametrWraps = $("<div>", {
        class: "parameter-wrap parameter-sizes",
        "data-parameterId": parameterId2
      }).appendTo(optionsWrap);
      const surchargeName = $(this).find("th").text().trim().replace("?", "");
      $("<div>", {
        class: "variant name",
        text: surchargeName
      }).appendTo(parametrWraps);
      const priceWrapNested = $("<div>", { class: "price-wrap" }).appendTo(parametrWraps);
      if (isBoxNested) {
        if (!header.includes("box")) {
          $("<span>", { class: "text", text: "Cena boxu" }).appendTo(priceWrapNested);
        }
        $("<div>", {
          class: "price price-standart",
          text: basePriceNested > 0 ? NumToPrice(basePriceNested) : "0 K\u010D",
          "data-price": basePriceNested
        }).appendTo(priceWrapNested);
      }
      const optionWrap = $("<div>", {
        class: "option-wrap"
      }).appendTo(parametrWraps);
      const options2 = $(this).find("option");
      createOptionButtons(options2, parameterId2, optionWrap, isBoxNested, basePriceNested);
    });
    $(".parameter-wrap.parameter-sizes").eq(2).hide();
  }
  $(".parameter-wrap.parameter-98 h5.variant.name").text("Box 1");
  $(".parameter-wrap.parameter-101 h5.variant.name").text("Box 2");
}
function createBoxConfig() {
  const wrap = $("<div>", {
    class: "box-config "
  }).appendTo(".upsale-buttons.boxs");
  $('<div class="order">7</div>').appendTo(wrap);
  $('<h5 class="variant name">FARBA</h5>').appendTo(wrap);
  $("<div>", {
    class: "close-btn close",
    text: "-"
  }).appendTo(wrap);
  $("<div>", {
    class: "close-btn close bottom",
    text: language2 === "sk" ? "Nechcem" : "Nechci"
  }).appendTo(wrap);
  $("<div>", {
    class: "close-btn return",
    text: language2 === "sk" ? "potvrdi\u0165" : "potvrdit"
  }).appendTo(wrap);
  const configWrap = $("<div>", {
    class: "config-wrap"
  }).appendTo(wrap);
}
function amountChoser(name, position) {
  if (name != "box") {
    return;
  }
  let amount = 3;
  const amountWrap = $("<div>", {
    class: "amount-wrap"
  }).appendTo(position);
  function resetBoxSizeOptions(visibleCount, resetAll = false) {
    const wraps = $(".parameter-wrap.parameter-sizes");
    wraps.each(function(index) {
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
      click: function() {
        $(".amount-button").removeClass("active");
        $(this).addClass("active");
        amount = i;
        $(".image-wrap").hide();
        if (i == 1) {
          resetBoxSizeOptions(1, true);
          priceActualization();
        } else if (i == 2) {
          resetBoxSizeOptions(2);
          priceActualization();
        } else if (i == 3) {
          resetBoxSizeOptions(3);
          priceActualization();
        }
      }
    }).appendTo(amountWrap);
  }
}
function createOptionButtons(options, parameterId, optionsWrap, isBoxParam = false, basePrice = 0) {
  $(options).each(function() {
    const $opt = $(this);
    const value = $opt.val();
    if (value == "") return;
    const textOption = $opt.text();
    const valueText = textOption.split("+");
    const nameSplit = valueText[0].split(":");
    const surchargeFinal = Number($opt.attr("data-surcharge-final-price") || $opt.attr("data-surcharge-additional-price") || 0);
    if (isBoxParam && surchargeFinal === 0 && !textOption.includes("cm")) return;
    if (textOption.includes("\u017DIADNY") && !isBoxParam) {
      return;
    }
    const optionButton = $("<div>", {
      class: "button option-button",
      "data-value": value,
      "data-variant": parameterId
    }).appendTo(optionsWrap);
    $("<div>", {
      text: textOption,
      class: "text"
    }).appendTo(optionButton);
    let priceButton = {
      619: 0,
      622: 10,
      625: 30,
      628: 45,
      634: 0,
      637: 10,
      640: 30,
      643: 45
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
        540: 999
      };
    }
    if (textOption.includes("cm")) {
      let paramText = nameSplit[1];
      if (paramText == void 0) {
        paramText = "";
      }
      const buttonDescription = $("<div>", {
        class: "description",
        html: `<span>${nameSplit[0]}</span><div class='parm'> ${paramText}</div>`
      }).appendTo(optionButton);
      if (isBoxParam) {
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
      if (isBoxParam) {
        $(optionButton).on("click", function() {
          $(this).addClass("active").siblings().removeClass("active");
        });
      }
      let label;
    } else if (textOption.includes("rad") || textOption.includes("\u0159ada")) {
      $("<input>", {
        type: "radio",
        id: `radio-${parameterId}-${value}`,
        name: `parameter-${parameterId}`,
        value
      }).appendTo(optionButton);
      $("<label>", {
        for: `radio-${parameterId}-${value}`,
        class: "radio-label",
        html: `<span class="radio-text">${nameSplit[0]}</span><strong class="radio-price">+ ${valueText[1]}</strong>`
      }).appendTo(optionButton);
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.png?15`
      }).appendTo(optionButton.find("label"));
      $(optionButton).addClass("radio-row");
      $(optionButton).parents(".options-wrap").addClass("radio-wrap");
    } else if (textOption == "\u017DIADNY +0 K\u010D") {
      $("<div>", {
        class: "description",
        text: valueText[0]
      }).appendTo(optionButton);
      $(optionButton).addClass("text");
    } else {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/config/${createSlug(valueText[0])}.jpg?15`
      }).appendTo(optionButton);
    }
  });
}

// assets/js/components/productPage.js
window.addEventListener(
  "error",
  (event) => {
    if (event.target && event.target.tagName === "IMG") {
      const img = event.target;
      if (!img.dataset.retried) {
        console.warn("Image load failed (possible 502), retrying with timestamp:", img.src);
        img.dataset.retried = "true";
        const separator = img.src.includes("?") ? "&" : "?";
        img.src = img.src + separator + Date.now();
      }
    }
  },
  true
  // Capture phase is needed because error events on elements do not bubble
);
var koberce = 88;
var boxy = 91;
var box1 = 94;
var box2 = 97;
var boxsPrice = [];
var language3 = dataLayer[0].shoptet.projectId == 704436 ? "cs" : shoptetData.language || dataLayer[0].shoptet.language;
if (dataLayer[0].shoptet.projectId == "581408") {
  koberce = 60;
  boxy = 63;
  box1 = 66;
  box2 = 69;
}
sessionStorage.setItem("wheelPosition", "left");
sessionStorage.setItem("seatPosition", "pass-5");
sessionStorage.setItem("doorPosition", "doors-4");
var standartPrice = Number(
  $(".p-final-price-wrapper .price-standard span").length ? $(".p-final-price-wrapper .price-standard span").text().replace(/[^0-9]/g, "") : 0
);
var price = Number(
  $("span.calculated-price").length ? $("span.calculated-price").text().replace(/[^0-9]/g, "") : 0
);
var diference = standartPrice - price;
console.log(diference);
function initProduct(setupData2, texts) {
  if (isTruckConfiguratorPage()) {
    mountTruckConfigurator();
    return;
  }
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
  $(".button.btn.select-model").on("click", function() {
    const overflow = $("<div>", {
      class: "overflow",
      style: "position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;"
    }).appendTo("body");
    const popup = $("<div>", {
      class: "model-select",
      style: "position: relative; background-color: #fff; padding: 20px;"
    }).appendTo(overflow);
    $("<div>", {
      class: "h3",
      // TODO: Tato hláška "Vyberte model" ve volbě vozidla se musí přeložit do slovenštiny pomocí JS (dle proměnné `language` / `texts`)
      text: "Vyberte model"
    }).appendTo(popup);
    initModelSelect();
  });
  $("select.parameter-id-38.surcharge-parameter").val("248").trigger("change");
  const buttons = $("button.timeline__nav-item");
  const prevButton = $('button[is="prev-button"]');
  const nextButton = $('button[is="next-button"]');
  let currentIndex = 0;
  buttons.on("click", function() {
    const index = $(this).index();
    buttons.removeClass("active");
    $(this).addClass("active");
    $(".timeline__slide").removeClass("is-selected").addClass("reveal-invisible").attr("style", "opacity: 0; visibility: hidden; z-index: 0;");
    $(`.timeline__slide:eq(${index})`).addClass("is-selected").removeClass("reveal-invisible").attr("style", "opacity: 1; visibility: visible; z-index: 1;");
    currentIndex = index;
    console.log(`Kliknul jsi na tla\u010D\xEDtko s indexem: ${index}`);
  });
  prevButton.on("click", function() {
    if (currentIndex > 0) {
      currentIndex--;
      buttons.removeClass("active");
      buttons.eq(currentIndex).addClass("active");
      $(".timeline__slide").removeClass("is-selected").addClass("reveal-invisible").attr("style", "opacity: 0; visibility: hidden; z-index: 0;");
      $(`.timeline__slide:eq(${currentIndex})`).addClass("is-selected").removeClass("reveal-invisible").attr("style", "opacity: 1; visibility: visible; z-index: 1;");
      console.log(`Posunul jsi zp\u011Bt na index: ${currentIndex}`);
    }
  });
  nextButton.on("click", function() {
    if (currentIndex < buttons.length - 1) {
      currentIndex++;
      buttons.removeClass("active");
      buttons.eq(currentIndex).addClass("active");
      $(".timeline__slide").removeClass("is-selected").addClass("reveal-invisible").attr("style", "opacity: 0; visibility: hidden; z-index: 0;");
      $(`.timeline__slide:eq(${currentIndex})`).addClass("is-selected").removeClass("reveal-invisible").attr("style", "opacity: 1; visibility: visible; z-index: 1;");
      console.log(`Posunul jsi dop\u0159edu na index: ${currentIndex}`);
    }
  });
  $(".next-step-button").on("click", function(event) {
    if ($(event.target).closest(".parameter-cars.patterns-wrap").length) {
      return;
    }
    const model = sessionStorage.getItem("model");
    console.log(model);
    if (!model || model && (model.includes("Zna\u010Dka") || model.trim() === "Model" || model.includes("Rok v\xFDroby") || model.includes("Typ auta"))) {
      const name = $("h1").text();
      if (name.includes("box") || name.includes("Boxy")) {
        return;
      }
      createpopup(texts);
      setTimeout(() => {
        $(event.target).closest(".button.option-button").removeClass("active");
      }, 1e3);
      $(".image-wrap").remove();
    }
  });
  setTimeout(() => {
    $(".parameter-wrap.orders-1").removeClass("goToAction");
  }, 1e3);
  $(".parameter-cars.wheel-Position .option-wrap .option-button").on("click", function() {
    const position = $(this).data("value");
    sessionStorage.setItem("wheelPosition", position);
  });
  $(".parameter-cars.sit-Position .option-wrap .option-button").on("click", function() {
    const position = $(this).data("value");
    console.log(position);
    sessionStorage.setItem("seatPosition", position);
  });
  $(".parameter-cars.door-Position .option-wrap .option-button").on("click", function() {
    const position = $(this).data("value");
    sessionStorage.setItem("doorPosition", position);
  });
  const faqObserver = new MutationObserver(() => {
    const $faqContent = $(".p-info-wrapper .faq-content");
    if (!$faqContent.length) return;
    const $accordions = $faqContent.find(".accordion-wrapper");
    if ($accordions.length <= 4) return;
    if ($faqContent.find(".faq-show-more").length) return;
    faqObserver.disconnect();
    $accordions.each(function(i) {
      if (i >= 4) $(this).addClass("accordion-hidden");
    });
    const btnLabel = language3 === "sk" ? "Zobrazi\u0165 viac" : "Zobrazit v\xEDce";
    const btnLabelLess = language3 === "sk" ? "Zobrazi\u0165 menej" : "Zobrazit m\xE9n\u011B";
    const $showMore = $(`<div class="faq-show-more" style="text-align:center;margin-top:8px;">
      <button type="button" style="background:transparent;border:1px solid #c49b30;color:#c49b30;padding:8px 14px;border-radius:8px;cursor:pointer;">${btnLabel}</button>
    </div>`);
    $faqContent.append($showMore);
    $showMore.on("click", "button", function() {
      const $hidden = $faqContent.find(".accordion-hidden");
      if ($hidden.length) {
        $hidden.removeClass("accordion-hidden");
        $(this).text(btnLabelLess);
      } else {
        $accordions.each(function(i) {
          if (i >= 4) $(this).addClass("accordion-hidden");
        });
        $(this).text(btnLabel);
      }
    });
  });
  faqObserver.observe(document.querySelector(".p-info-wrapper") || document.body, {
    childList: true,
    subtree: true
  });
}
function priplatky(setupData2, texts) {
  if (!$(".type-detail").length) return;
  let order = 6;
  if (shoptetData.product.id == 598 || shoptetData.product.id == 610 || shoptetData.product.id == 613) {
    order = 4;
  } else if (shoptetData.product.id == 2403 || shoptetData.product.id == 2415 || shoptetData.product.id == 2418) {
    order = 4;
  }
  if ($(".type-detail").length) {
    let getcarpetprice = function(carpetsValue) {
      let array = [];
      carpetsValue.forEach((value, index) => {
        console.log("value-------", value);
        const valueKey = value.split("-");
        const getPrice = $(".parameter-id-" + valueKey[0] + " option[value='" + valueKey[1] + "']").data("surcharge-additional-price");
        array.push(getPrice);
      });
      console.log(array);
      return array;
    }, isWrapSelectionValid = function($wrap) {
      let hasSelectable = false;
      let valid = false;
      if ($wrap.find(".option-button").length) {
        hasSelectable = true;
        if ($wrap.find(".option-button.active").length) valid = true;
      }
      if ($wrap.find(".upsale-button").length) {
        hasSelectable = true;
        if ($wrap.find(".upsale-button.active").length) valid = true;
      }
      if ($wrap.find("select.surcharge-parameter").length) {
        hasSelectable = true;
        $wrap.find("select.surcharge-parameter").each(function() {
          const val = $(this).val();
          if (val && val !== "0" && val !== "" && val !== null) valid = true;
        });
      }
      if ($wrap.find("input[type='radio'], input[type='checkbox']").length) {
        hasSelectable = true;
        if ($wrap.find("input[type='radio']:checked, input[type='checkbox']:checked").length) valid = true;
      }
      return !hasSelectable || valid;
    }, getNavigableWraps = function() {
      return $(".position-wrap, .parameter-wrap").filter(function() {
        return !$(this).closest(".box-config").length;
      });
    }, isCartStepWrap = function($wrap) {
      return $wrap.hasClass("upsale-buttons") && $wrap.hasClass("boxs");
    }, getStepButtonText = function($wrap, isLast) {
      if (isCartStepWrap($wrap)) {
        return language3 === "sk" ? "Prejs\u0165 do ko\u0161\xEDka" : "P\u0159ej\xEDt do ko\u0161\xEDku";
      }
      if (language3 === "sk") {
        return isLast ? "Dokon\u010Di\u0165 konfigur\xE1ciu" : "Prejs\u0165 k \u010Fal\u0161iemu kroku";
      }
      return isLast ? "Dokon\u010Dit konfiguraci" : "P\u0159ej\xEDt k dal\u0161\xEDmu kroku";
    }, scrollToStep = function($wrap) {
      if (!$wrap.length) return;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const wrapTop = $wrap.offset().top;
      if (window.matchMedia("(min-width: 992px)").matches) {
        const rect = $wrap[0].getBoundingClientRect();
        const comfortableTop = 120;
        const comfortableBottom = viewportHeight * 0.72;
        if (rect.top >= comfortableTop && rect.top <= comfortableBottom) {
          return;
        }
        const wrapHeight = Math.min($wrap.outerHeight() || 0, viewportHeight * 0.7);
        const targetScrollTop = Math.max(0, wrapTop - Math.max((viewportHeight - wrapHeight) / 2, 120));
        $("html, body").stop(true).animate({ scrollTop: targetScrollTop }, 400);
        return;
      }
      $("html, body").stop(true).animate({ scrollTop: Math.max(wrapTop - 80, 0) }, 400);
    }, proceedToCartFromStep = function() {
      const $addToCartButton = $("button.btn.btn-lg.btn-conversion.add-to-cart-button").filter(function() {
        const style = window.getComputedStyle(this);
        return style.display !== "none" && style.visibility !== "hidden" && this.offsetParent !== null;
      }).first();
      $(".upsale-Banner.showConf").removeClass("showConf");
      if ($addToCartButton.length) {
        $addToCartButton.trigger("click");
        return;
      }
      $(".position-wrap, .parameter-wrap").removeClass("active");
    }, addNextStepButtons = function() {
      const allWraps = getNavigableWraps();
      allWraps.each(function(index) {
        const $wrap = $(this);
        if ($wrap.find(".next-step-button").length > 0) {
          return;
        }
        const isLast = index === allWraps.length - 1;
        const buttonText = getStepButtonText($wrap, isLast);
        const buttonClass = isLast || isCartStepWrap($wrap) ? "next-step-button finish-button" : "next-step-button";
        $("<button>", {
          class: buttonClass,
          text: buttonText,
          type: "button"
        }).appendTo($wrap);
      });
    }, updateButtonTexts2 = function() {
      const allWraps = getNavigableWraps();
      allWraps.each(function(index) {
        const $wrap = $(this);
        const $button = $wrap.find(".next-step-button");
        if ($button.length > 0) {
          const isLast = index === allWraps.length - 1;
          const buttonText = getStepButtonText($wrap, isLast);
          $button.text(buttonText);
          $button.toggleClass("finish-button", isLast || isCartStepWrap($wrap));
        }
      });
    };
    $("<div>", {
      class: "upsale-wrap"
    }).insertAfter(".detail-parameters");
    createUpsaleInfo(texts);
    if ($(".parameter-id-" + koberce)[0]) {
      $("body").addClass("upsale-page");
      const buttonWrap = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap trunk"
      }).appendTo(".upsale-Banner");
      $(`<div class="order">${order}</div>`).appendTo(buttonWrap);
      $('<h5 class="variant name">autokoberce do kufru</h5>').appendTo(buttonWrap);
      const parameterWrap = $("<div>", {
        class: "parameter-cars"
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
      let Price = getcarpetprice(carpetsValue);
      let carpetsPrice = setupData2.priceListEUR;
      let priceArray = [Price[0] + "/" + carpetsPrice.classic_trunk.recommended, Price[1] + "/" + carpetsPrice.premium_trunk.recommended, "0/0"];
      if (dataLayer[0].shoptet.projectId == "581408") {
        carpetsText = setupData2.settings.carpetsTextcs.split(",");
        carpetsValue = setupData2.settings.carpetsValuecs.split(",");
        Price = getcarpetprice(carpetsValue);
        carpetsPrice = setupData2.priceListCZK;
        priceArray = [Price[0] + "/" + carpetsPrice.classic_trunk.recommended, Price[1] + "/" + carpetsPrice.premium_trunk.recommended, "0/0"];
      }
      $(carpetsText).each(function(e) {
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
          texts
        );
      });
    }
    if ($(".parameter-id-" + boxy)[0]) {
      let boxsText = setupData2.settings.boxsText.split(",");
      const boxsValue = setupData2.settings.boxsValue.split(",");
      const boxsImage = setupData2.settings.boxsImage.split(",");
      let carpetsPrice = setupData2.priceListEUR;
      let priceArray = [
        carpetsPrice.box_one.selling + "/" + carpetsPrice.box_one.recommended,
        carpetsPrice.box_two.selling + "/" + carpetsPrice.box_two.recommended,
        "0/0"
      ];
      if (dataLayer[0].shoptet.projectId == "581408") {
        boxsText = setupData2.settings.boxsTextcs.split(",");
        boxsPrice = setupData2.settings.boxsPricecs.split(",");
        carpetsPrice = setupData2.priceListCZK;
        priceArray = [
          carpetsPrice.box_one.selling + "/" + carpetsPrice.box_one.recommended,
          carpetsPrice.box_two.selling + "/" + carpetsPrice.box_two.recommended,
          "0/0"
        ];
      }
      order += 1;
      const buttonWrapBox = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap boxs"
      }).appendTo(".upsale-Banner");
      $(`<div class="order">${order}</div>`).appendTo(buttonWrapBox);
      $('<h5 class="variant name">' + texts.suitcase_boxes + "</h5>").appendTo(buttonWrapBox);
      const parameterWrap2 = $("<div>", {
        class: "parameter-cars"
      }).appendTo(buttonWrapBox);
      const name = $("h1").text();
      console.log(name);
      let prefix = "";
      if (name.includes("HEXA")) {
        prefix = "hexa-";
      } else if (name.includes("STRIPE")) {
        prefix = "stripe-";
      }
      $(boxsText).each(function(e) {
        createUpsaleButton(
          "https://cdn.myshoptet.com/usr/581408.myshoptet.com/user/documents/upload/assets/new/" + prefix + boxsImage[e],
          this,
          parameterWrap2,
          boxsValue[e],
          "config",
          priceArray[e],
          true,
          texts
        );
      });
    }
    $("<div>", { class: "content-wrap" }).insertAfter(".p-info-wrapper .detail-parameters");
    $(document).on(
      "click",
      ".position-wrap .order, .position-wrap .variant.name, .parameter-wrap .order, .parameter-wrap .variant.name, .parameter-wrap h5",
      function(e) {
        e.preventDefault();
        const clickedWrap = $(this).closest(".position-wrap, .parameter-wrap");
        if (clickedWrap.hasClass("active")) {
          clickedWrap.removeClass("active");
          return;
        }
        const allWraps = $(".position-wrap, .parameter-wrap");
        const clickedIndex = allWraps.index(clickedWrap);
        const $activeWrap = $(".position-wrap.active, .parameter-wrap.active").first();
        const activeIndex = $activeWrap.length ? allWraps.index($activeWrap) : -1;
        if (clickedIndex > activeIndex && activeIndex >= 0) {
          for (let i = 0; i < clickedIndex; i++) {
            const $wrap = allWraps.eq(i);
            if (!isWrapSelectionValid($wrap)) {
              $wrap.addClass("selection-required");
              setTimeout(() => $wrap.removeClass("selection-required"), 1200);
              return;
            }
          }
        }
        $(".position-wrap, .parameter-wrap").removeClass("active");
        clickedWrap.addClass("active");
        const elementType = clickedWrap.hasClass("position-wrap") ? "position-wrap" : "parameter-wrap";
        const elementName = clickedWrap.find(".variant.name, h5").first().text() || "Unnamed";
        console.log(`Otev\u0159en ${elementType}:`, elementName);
      }
    );
    $(document).on("click", ".next-step-button", function(e) {
      e.preventDefault();
      e.stopPropagation();
      const currentWrap = $(this).closest(".position-wrap, .parameter-wrap");
      if (!isWrapSelectionValid(currentWrap)) {
        currentWrap.addClass("selection-required");
        setTimeout(() => currentWrap.removeClass("selection-required"), 1200);
        return;
      }
      if (isCartStepWrap(currentWrap)) {
        proceedToCartFromStep();
        return;
      }
      const allWraps = getNavigableWraps();
      const currentIndex = allWraps.index(currentWrap);
      if (currentIndex < allWraps.length - 1) {
        const nextWrap = allWraps.eq(currentIndex + 1);
        currentWrap.removeClass("active");
        openNextAccordion(nextWrap);
        setTimeout(() => {
          scrollToStep(nextWrap);
        }, 600);
        console.log("P\u0159echod k dal\u0161\xEDmu kroku:", nextWrap.find(".variant.name, h5").first().text() || "Unnamed");
      } else {
        console.log("Konfigurace dokon\u010Dena");
        allWraps.removeClass("active");
      }
      setTimeout(() => {
        updateButtonTexts2();
      }, 50);
    });
    const observer = new MutationObserver(function(mutations) {
      let shouldAddButtons = false;
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if ($(node).hasClass("position-wrap") || $(node).hasClass("parameter-wrap") || $(node).find(".position-wrap, .parameter-wrap").length > 0) {
              shouldAddButtons = true;
            }
          }
        });
      });
      if (shouldAddButtons) {
        setTimeout(() => {
          console.log("P\u0159id\xE1n\xED tla\u010D\xEDtek---------");
          addNextStepButtons();
          updateButtonTexts2();
        }, 400);
      }
    });
    if (document.querySelector(".p-info-wrapper")) {
      observer.observe(document.querySelector(".p-info-wrapper"), {
        childList: true,
        subtree: true
      });
    }
    const header = $("h1").text();
    const isBoxProduct = header.toLowerCase().includes("box");
    if (!isBoxProduct) {
      firstPage(texts);
    }
    setTimeout(() => {
      addNextStepButtons();
      updateButtonTexts2();
    }, 100);
    const pairVariantList = JSON.parse(setupData2.settings.pairVariantList);
    const pairedOrders = {};
    let orders = 1;
    if (isBoxProduct) {
      orders = 1;
      createOptions("box", orders);
    }
    createBoxConfig();
    $(".detail-parameters .variant-list select").each(function() {
      orders += 1;
      const position = this;
      createOptions(position, orders);
    });
    if (isBoxProduct) {
      orders += 1;
      createOptions("sizes", orders);
      return;
    }
    $(".detail-parameters .surcharge-list select").each(function() {
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
      $(".p-variants-block .surcharge-list:contains('Rozm\u011Br 2. Boxu') option[data-index='0']").text("Zvolte velikost 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Rozm\u011Br boxu') option[data-index='0']").text("Zvolte velikost boxu");
      $(".p-variants-block .surcharge-list:contains('Velikost 2. Boxu') option[data-index='0']").text("Zvolte velikost 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Barva boxu') option[data-index='0']").text("Zvolte barvu boxu");
      $(".p-variants-block .surcharge-list:contains('Barva 2. boxu') option[data-index='0']").text("Zvolte barvu 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Um\xEDst\u011Bn\xED volantu') option[data-index='0']").text("Pros\xEDm, vyberte um\xEDst\u011Bn\xED volantu");
    }
    if ($("html[lang='sk']").length) {
      $(".p-variants-block .surcharge-list:contains('Ve\u013Ekos\u0165 boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 boxu");
      $(".p-variants-block .surcharge-list:contains('Rozmer 2. Boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Rozmer boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 boxu");
      $(".p-variants-block .surcharge-list:contains('Ve\u013Ekos\u0165 2. Boxu') option[data-index='0']").text("Zvo\u013Ete ve\u013Ekos\u0165 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Farba boxu') option[data-index='0']").text("Zvo\u013Ete farbu boxu");
      $(".p-variants-block .surcharge-list:contains('Farba 2. boxu') option[data-index='0']").text("Zvo\u013Ete farbu 2.boxu");
      $(".p-variants-block .surcharge-list:contains('Umiestenie volantu') option[data-index='0']").text("Pros\xEDm,vyberte umiestnenie volantu");
    }
    $(".navigatte-button").on("click", function() {
      const option = $(this).attr("data-option").split("-");
      const optionName = option[1];
      $(".parameter-wrap").removeClass("active");
      $(`.parameter-wrap:eq(${optionName})`).addClass("active");
      $(".navigatte-button").removeClass("active");
      $(`.navigatte-button:eq(${optionName})`).addClass("active");
    });
    console.log("clickaaaa");
    const contentStepCount = $(".content-wrap").children(".position-wrap, .parameter-wrap").length;
    $(".upsale-buttons.trunk .order").text(contentStepCount);
    $(".upsale-buttons.boxs .order").text(contentStepCount + 1);
  }
}
function openNextAccordion($next) {
  $next.addClass("active");
}
$(document).on("click", ".upsale-button", function(e) {
  updateUpsale(this, e);
  const $trunk = $(this).closest(".upsale-buttons.trunk");
  if ($trunk.length && !$(this).hasClass("none")) {
    setTimeout(() => {
      const $boxs = $(".upsale-buttons.boxs");
      if ($boxs.is(":visible")) {
        openNextAccordion($boxs);
      }
    }, 600);
  }
});
function resetBoxConfigDefaults() {
  const $amountButtons = $(".box-config .amount-button");
  if ($amountButtons.length) {
    $amountButtons.removeClass("active");
    $amountButtons.filter(function() {
      return $(this).text().trim().startsWith("2");
    }).addClass("active");
  }
  $(".box-config .parameter-wrap.parameter-sizes").each(function(index) {
    const $wrap = $(this);
    const shouldShow = index < 2;
    if (shouldShow) {
      $wrap.show();
    } else {
      $wrap.hide();
    }
    $wrap.find(".button.option-button.text").removeClass("active");
    $wrap.find("input[type='radio'], input[type='checkbox']").prop("checked", false);
    const paramId = $wrap.attr("data-parameterId");
    if (paramId) {
      $("select.parameter-id-" + paramId + ".surcharge-parameter").val("");
    }
  });
  $(".box-config .parameter-wrap").each(function() {
    const $wrap = $(this);
    $wrap.find(".button.option-button").removeClass("active");
    $wrap.find("input[type='radio'], input[type='checkbox']").prop("checked", false);
    const paramId = $wrap.attr("data-parameterId");
    if (paramId) {
      $("select.parameter-id-" + paramId + ".surcharge-parameter").val("");
    }
  });
}
$(document).on("click", ".close-btn.close", function() {
  $(this).parents(".upsale-Banner").removeClass("showConf");
  $("select.parameter-id-" + boxy + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box1 + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box2 + ".surcharge-parameter").val(0);
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button").removeClass("active");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button.none").addClass("active");
  $(".config-wrap .option-button").removeClass("active");
  resetBoxConfigDefaults();
  updateUpsale(this);
});
$(document).on("click", ".boxs .upsale-button.none", function(e) {
  console.log("clickaaaa");
  $("select.parameter-id-" + box1 + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box2 + ".surcharge-parameter").val(0);
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button").removeClass("active");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button.none").addClass("active");
  $(".config-wrap .option-button").removeClass("active");
  $(".upsale-Banner").removeClass("showConf");
  resetBoxConfigDefaults();
  updateUpsale(this);
});
function firstPage(texts) {
  if (dataLayer[0].shoptet.product.id == "2427") {
    setTimeout(function() {
      $(".orders-1").addClass("active");
    }, 200);
    return;
  }
  const patterns = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config"
    // krok 0 není otevřený
  }).appendTo(".content-wrap");
  $('<div class="order">0</div>').appendTo(patterns);
  $('<h5 class="variant name">' + texts.carpet_quilting_pattern + "</h5>").appendTo(patterns);
  const patternsWrap = $("<div>", {
    class: "parameter-cars patterns-wrap"
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
  const pageWrap = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active"
  }).appendTo(".content-wrap");
  $('<div class="order">1</div>').appendTo(pageWrap);
  $('<h5 class="variant name">' + texts.vehicle_specifications + "</h5>").appendTo(pageWrap);
  const wheelWrao = $("<div>", {
    class: "parameter-cars wheel-Position "
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label wheel",
    text: texts.wheel_position
  }).appendTo(wheelWrao);
  const wheelOption = $("<div>", {
    class: "option-wrap"
  }).appendTo(wheelWrao);
  $(
    `<div class='button option-button active' data-value='left'><span>EU</span><img src='/user/documents/upload/assets/image/Layer_left.png' ><div class='text'>V\u013Eavo</div></div>`
  ).appendTo(wheelOption);
  $(
    `<div class='button option-button' data-value='right'><img src='/user/documents/upload/assets/image/Layer_right.png' ><div class='text'>Vpravo</div><span>UK</span></div>`
  ).appendTo(wheelOption);
  const sitposition = $("<div>", {
    class: "parameter-cars sit-Position"
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label sit",
    text: texts.seat_position
  }).appendTo(sitposition);
  const sitOption = $("<div>", {
    class: "option-wrap"
  }).appendTo(sitposition);
  $(`<div class='button option-button ' data-value='pass-2'><div class='text'>2</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-4'><div class='text'>4</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button active' data-value='pass-5'><div class='text'>5</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-6'><div class='text'>6</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-7'><div class='text'>7</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-8'><div class='text'>8</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-9'><div class='text'>9</div></div>`).appendTo(sitOption);
  const doorposition = $("<div>", {
    class: "parameter-cars door-Position"
  }).appendTo(pageWrap);
  const doorLabel = $("<div>", { class: "label door" }).appendTo(doorposition);
  $("<div>").text(language3 === "cs" ? "Po\u010Det dve\u0159\xED" : "Po\u010Det dver\xED").appendTo(doorLabel);
  $("<div>", { class: "label-sub", text: language3 === "cs" ? "(bez kufru)" : "(bez kufra)" }).appendTo(doorLabel);
  const doorOption = $("<div>", {
    class: "option-wrap"
  }).appendTo(doorposition);
  $(`<div class='button option-button' data-value='doors-2'><div class='text'>2</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button' data-value='doors-3'><div class='text'>3</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button active' data-value='doors-4'><div class='text'>4</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button' data-value='doors-5'><div class='text'>5</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button' data-value='doors-6'><div class='text'>6</div></div>`).appendTo(doorOption);
  $(".can-toggle.wheel-option").on("click", function() {
    if ($(this).find("input").is(":checked")) {
      $("select.parameter-id-37.surcharge-parameter").val(253);
    }
  });
  $(".type-option.button").on("click", function() {
    $(this).addClass("active").siblings().removeClass("active");
    const value = $(this).attr("data-value");
    $("select.parameter-id-22.surcharge-parameter").val(value);
  });
}
$("body").on("click", ".btn.choice-Model", function() {
  createModelInfo();
});
$("body").on("click", ".position-wrap ", function() {
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
    const value = $(`select.parameter-id-${paramId} option`).filter(function() {
      return $(this).text().toLowerCase().includes(type.toLowerCase());
    }).val();
    if (value) {
      $(`select.parameter-id-${paramId}`).val(value).trigger("change");
    }
  }
  if ($(".in-index")[0]) return;
  if (model && (model.includes("Zna\u010Dka") || model.trim() === "Model" || model.includes("Rok v\xFDroby") || model.includes("Typ auta"))) {
    return;
  }
  if (model) {
    console.log("model", model);
    if ($(".model-info")[0]) return;
    const infoWrap = $("<div>").addClass("model-info").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
    $("<div>").addClass("header-info").text(language3 === "cs" ? "Z\xE1ruka kompatibility s Va\u0161\xEDm vozidlem" : "Garancia kompatibility s Va\u0161\xEDm vozidlom").appendTo(infoWrap);
    $("<div>").addClass("model-text").text(model).appendTo(infoWrap);
    $(".setup-model").on("click", function() {
      console.log("setup model");
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
    `
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
    `
  }).appendTo(overflow);
  $("<h3>", {
    text: texts.no_model_select,
    style: `
      margin-bottom: 30px;
      font-size: 22px;
      color: #333;
      font-weight: 500;
      line-height: 1.4;
    `
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
    click: function() {
      $(".overflow").remove();
      overflow.fadeOut(200, function() {
        $(this).remove();
        let scrollselector = ".col-xs-12.col-lg-6.p-info-wrapper";
        if ($("body").hasClass("mobile")) {
          scrollselector = ".p-thumbnails-wrapper";
        }
        $("#model-selector").fadeIn(200);
        $(".position-wrap.parameter-cars.parameter-wrap.base-config.active").removeClass("active");
        $(".position-wrap.parameter-cars.parameter-wrap.base-config:eq(0)").addClass("active");
      });
      $("#model-selector").addClass("errorToCart");
      setTimeout(() => {
        $("#model-selector").removeClass("errorToCart");
      }, 2e3);
    }
  }).appendTo(popup);
  $("<style>").text(
    `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `
  ).appendTo("head");
}
function calculateStandartPrice(diference2) {
  setTimeout(() => {
  }, 1e3);
  console.log(diference2);
  const price2 = Number(
    $(".p-final-price-wrapper span.calculated-price:eq(0)").text().replace(/[^0-9]/g, "")
  );
  console.log("price", price2);
  let newStandartPrice = Math.round(price2 * 1.6);
  console.log("price", price2, "newStandartPrice (price + 60%)", newStandartPrice);
  $(".upsale-button.active").each(function() {
    const priceText = $(this).find(".save").attr("data-save");
    console.log(priceText);
    if (priceText) {
      const priceValue = Number(priceText.replace(/[^0-9]/g, ""));
      console.log("priceValue", priceValue);
      console.log("newStandartPrice s upsale", newStandartPrice);
    }
  });
  const discount = Math.round((newStandartPrice - price2) / newStandartPrice * 100);
  console.log("discount", discount);
  if (newStandartPrice < 100) return;
  $(".p-final-price-wrapper .price-save").text("\u2013" + discount + " %");
  $(".p-final-price-wrapper .price-standard span").not(".price-save").text(NumToPrice(newStandartPrice));
  updateBoxPrice();
}
window.allowDirectAddToCart = false;
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
    if ($($this).hasClass("config") && !$($this).hasClass("none")) {
      $($this).parents(".upsale-Banner").addClass("showConf");
    }
    if (value[0] === "conf1" || value[0] === "conf2") {
      const $boxConfig = $(".box-config");
      const domBoxIds = $boxConfig.length ? $boxConfig.find(".parameter-wrap").map(function() {
        return Number($(this).attr("data-parameterid"));
      }).get().filter((id) => !Number.isNaN(id) && id !== Number(boxy)) : [];
      const allBoxIds = domBoxIds.length ? domBoxIds : typeof boxsParameterIds !== "undefined" && Array.isArray(boxsParameterIds) && boxsParameterIds.length ? boxsParameterIds.map(Number).filter((id) => id !== Number(boxy)) : [Number(box1), Number(box2)];
      let soloId = allBoxIds.includes(104) ? 104 : allBoxIds.includes(78) ? 78 : allBoxIds[0];
      if (value[0] === "conf1") {
        allBoxIds.forEach((id) => {
          if (Number(id) === Number(soloId)) {
            $(`.box-config .parameter-wrap.parameter-${id}`).show();
          } else {
            $(`.box-config .parameter-wrap.parameter-${id}`).hide();
          }
        });
        const $soloSelect = $(`select.parameter-id-${soloId}.surcharge-parameter`);
        let soloPrice = 0;
        if ($soloSelect.length) {
          const $sel = $soloSelect.find("option:selected");
          const raw = String($sel.attr("data-surcharge-final-price") || $sel.attr("data-surcharge-additional-price") || "");
          if (raw && raw.replace(/[^0-9]/g, "") !== "") {
            soloPrice = Number(raw.replace(/[^0-9]/g, ""));
          } else {
            const $first = $soloSelect.find('option[data-surcharge-final-price]:not([value=""])').filter(function() {
              return Number(
                String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0").replace(
                  /[^0-9]/g,
                  ""
                )
              ) > 0;
            }).first();
            if ($first.length) {
              soloPrice = Number(
                String($first.attr("data-surcharge-final-price") || $first.attr("data-surcharge-additional-price") || "0").replace(/[^0-9]/g, "")
              );
            }
          }
        }
        const $soloPriceEl = $(`.box-config .parameter-wrap.parameter-${soloId}`).find(".price.price-standart");
        $soloPriceEl.attr("data-price", soloPrice);
        if ($soloPriceEl.length) $soloPriceEl.text(soloPrice > 0 ? NumToPrice(soloPrice) : "0 K\u010D");
      } else {
        allBoxIds.forEach((id) => $(`.box-config .parameter-wrap.parameter-${id}`).hide());
        $(`.box-config .parameter-wrap.parameter-104`).hide();
        $(`.box-config .parameter-wrap.parameter-78`).hide();
        $(`.box-config .parameter-wrap.parameter-${box1}`).show();
        $(`.box-config .parameter-wrap.parameter-${box2}`).show();
        [box1, box2].forEach((bid) => {
          const $selWrap = $(`select.parameter-id-${bid}.surcharge-parameter`);
          let p = 0;
          if ($selWrap.length) {
            const $sel = $selWrap.find("option:selected");
            const raw = String($sel.attr("data-surcharge-final-price") || $sel.attr("data-surcharge-additional-price") || "");
            if (raw && raw.replace(/[^0-9]/g, "") !== "") {
              p = Number(raw.replace(/[^0-9]/g, ""));
            } else {
              const $first = $selWrap.find('option[data-surcharge-final-price]:not([value=""])').filter(function() {
                return Number(
                  String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0").replace(
                    /[^0-9]/g,
                    ""
                  )
                ) > 0;
              }).first();
              if ($first.length) {
                p = Number(
                  String($first.attr("data-surcharge-final-price") || $first.attr("data-surcharge-additional-price") || "0").replace(/[^0-9]/g, "")
                );
              }
            }
          }
          const $priceEl = $(`.box-config .parameter-wrap.parameter-${bid}`).find(".price.price-standart");
          $priceEl.attr("data-price", p);
          if ($priceEl.length) $priceEl.text(p > 0 ? NumToPrice(p) : "0 K\u010D");
        });
      }
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
  $(".box-config .parameter-wrap, .parameter-wrap.parameter-sizes").each(function() {
    const price2 = Number($(this).find(".price.price-standart").attr("data-price"));
    const addPrice = Number($(this).find(".button.option-button.text.active .price").attr("data-price") || 0);
    console.log(price2, addPrice);
    $(this).find(".price.price-standart").text(NumToPrice(price2 + addPrice));
  });
}
function createUpsaleInfo(texts) {
  const upsaleBanner = $("<div>", {
    class: "upsale-Banner"
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
$("body").on("click", ".button.option-button", function(e) {
  console.log("click");
  createModelInfo();
  $(this).parents(".parameter-wrap").removeClass("goToAction").removeClass("errorToCart");
  $("body").removeClass("disabled-add-to-cart");
  $(this).addClass("active").siblings().removeClass("active");
  priceActualization2(e);
  setTimeout(() => {
    calculateStandartPrice(diference);
  }, 100);
  setTimeout(() => {
    if (typeof updateButtonTexts === "function") {
      updateButtonTexts();
    }
  }, 200);
  const $currentWrap = $(this).closest(".position-wrap, .parameter-wrap");
  const orderNum = parseInt($currentWrap.find(".order").first().text());
  const isStep0or1 = orderNum === 0 || orderNum === 1;
  const hasNextBtn = $currentWrap.find(".next-step-button").length > 0;
  const isInBoxConfig = !!$currentWrap.closest(".config-wrap, .box-config").length;
  if (hasNextBtn && !isStep0or1 && !isInBoxConfig) {
    setTimeout(() => {
      const allContentWraps = $(".content-wrap").children(".position-wrap, .parameter-wrap");
      const contentIndex = allContentWraps.index($currentWrap);
      let $nextWrap = null;
      if (contentIndex >= 0 && contentIndex < allContentWraps.length - 1) {
        $nextWrap = allContentWraps.eq(contentIndex + 1);
      } else if (contentIndex === -1) {
        const $siblings = $currentWrap.parent().children(".position-wrap, .parameter-wrap");
        const sibIndex = $siblings.index($currentWrap);
        if (sibIndex >= 0 && sibIndex < $siblings.length - 1) {
          $nextWrap = $siblings.eq(sibIndex + 1);
        }
      }
      if ($nextWrap) {
        openNextAccordion($nextWrap);
      } else if (!$(".goToAction")[0]) {
        console.log("goToAction");
        $(".upsale-Banner").fadeIn(400);
        $(".upsale-Banner").show();
        $(".upsale-buttons.position-wrap.parameter-cars.parameter-wrap.boxs").hide();
        if ($(".upsale-buttons.position-wrap.trunk .upsale-button.radio.active")[0]) {
          const $boxs = $(".upsale-buttons.boxs");
          $boxs.show();
          openNextAccordion($boxs);
        } else {
          openNextAccordion($(".upsale-buttons.trunk"));
        }
        if (!$(".parameter-id-" + koberce)[0]) {
          const $boxs = $(".upsale-buttons.boxs");
          $boxs.show();
          openNextAccordion($boxs);
        }
      }
    }, 400);
  }
});
function priceActualization2(e) {
  const header = $("h1").text();
  if (header.includes("box")) {
    $(".surcharge-list select").val(0);
  }
  if (header.includes("box")) {
    setTimeout(() => updateBoxPrice(), 150);
  }
  $(".image-wrap").remove();
  $(".button.option-button.active").each(function() {
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
      class: "image-wrap"
    }).appendTo(".parameter-wrap.parameter-" + parameterId).fadeIn(1e3);
    $("<img>", { src: image2 }).appendTo(imageWrap);
  });
  $(".parameter-wrap").not($(e.target).parents(".parameter-wrap")).find(".image-wrap").remove();
}
function isTruckConfiguratorPage() {
  try {
    return /\/test-truck(\/|$)/i.test(window.location.pathname);
  } catch (e) {
    return false;
  }
}
function loadTruckConfiguratorBundle() {
  if (window.__truckKonfLoaded) return;
  window.__truckKonfLoaded = true;
  const s = document.createElement("script");
  s.src = "/assets/js/truck-konfigurator/app.js";
  s.async = false;
  s.onerror = () => console.error("[truck-konf] nepoda\u0159ilo se na\u010D\xEDst app.js");
  document.head.appendChild(s);
}
function mountTruckConfigurator() {
  $("body").addClass("is-truck-konfigurator");
  const placeMountNode = () => {
    const $host = $(".col-xs-12.col-lg-6.p-info-wrapper").first().length ? $(".col-xs-12.col-lg-6.p-info-wrapper").first() : $(".p-info-wrapper").first();
    if (!$host.length) return false;
    $host.addClass("active");
    if ($host.find(".truck-konfigurator-wrap").length) return true;
    const $wrap = $("<div>", { class: "truck-konfigurator-wrap" });
    $("<div>", { id: "truck-konfigurator-root" }).appendTo($wrap);
    $host.append($wrap);
    return true;
  };
  if (placeMountNode()) {
    loadTruckConfiguratorBundle();
    return;
  }
  let tries = 0;
  const iv = setInterval(() => {
    if (placeMountNode()) {
      clearInterval(iv);
      loadTruckConfiguratorBundle();
      return;
    }
    if (++tries > 40) clearInterval(iv);
  }, 100);
}

// assets/js/functions/stickyphotos.js
document.addEventListener("DOMContentLoaded", function() {
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
    text: "E-shop"
  }).appendTo(".top-navigation-bar .container");
  $("div#menu-widget").appendTo(".top-navigation-bar .container");
  $(".navigation-show").on("click", function() {
    $("body").toggleClass("showNav");
  });
  $("body").on("click", function(e) {
    if (!$(e.target).closest("#menu-widget").length && !$(e.target).closest(".navigation-show").length) {
      $("body").removeClass("showNav");
    }
  });
  $('<a class="contact-link" href="/kontakty/">Kontakt</a>').prependTo(".navigation-buttons");
  const isSk = window.dataLayer?.[0]?.shoptet?.projectId === 562035;
  const flagSk = '<img src="https://flagcdn.com/sk.svg" width="24" height="16" alt="SK">';
  const flagCz = '<img src="https://flagcdn.com/cz.svg" width="24" height="16" alt="CZ">';
  const current = isSk ? { flag: flagSk, label: "Slovensk\xE1 verzia" } : { flag: flagCz, label: "\u010Cesk\xE1 verze" };
  const other = isSk ? `<a href="https://www.luxurycardesign.cz/" class="flag-link" data-lang="cs" aria-label="\u010Cesk\xE1 verze">${flagCz}</a>` : `<a href="https://www.luxurycardesign.sk/" class="flag-link" data-lang="sk" aria-label="Slovensk\xE1 verzia">${flagSk}</a>`;
  const $flags = $("<div>", { class: "language-flags" }).html(
    `<span class="flag-current" aria-label="${current.label}" role="button">${current.flag}</span><div class="language-dropdown">${other}</div>`
  );
  $flags.prependTo(".navigation-buttons");
  $flags.on("click", ".flag-current", function(e) {
    e.stopPropagation();
    $flags.toggleClass("open");
  });
  $("body").on("click", function() {
    $flags.removeClass("open");
  });
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
    return function(event) {
      const laterFunction = function() {
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
      const availabilityElement = document.getElementsByClassName("cell-availability-value")[0] || document.getElementsByClassName("product-detail-availability")[0] || document.getElementsByClassName("availability")[0] || document.getElementsByClassName("availability-label")[0];
      const priceElement = document.getElementsByClassName("price-final-holder")[0] || document.getElementsByClassName("sub-left-position")[0] || document.getElementsByClassName("product-detail-final-price")[0] || document.getElementsByClassName("price-final-holder")[0];
      const scrollHandler = debounceScroll(function() {
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
  jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .customers-video video, .slick-slide video").off(
    "click.videoControl touchend.videoControl ended.videoControl play.videoControl pause.videoControl"
  );
  function pauseOtherVideos(currentVideo) {
    jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .customers-video video, .slick-slide video").each(
      function() {
        if (this !== currentVideo && !this.paused) {
          this.pause();
        }
      }
    );
  }
  function initSingleVideo($video) {
    const $container = $video.parent();
    const videoEl = $video[0];
    const videoSrc = $video.find("source").attr("src") || "no source";
    const containerClasses = $container.attr("class") || "no classes";
    const videoClasses = $video.attr("class") || "no classes";
    const isInSlider = $video.closest(".slick-slide").length > 0;
    console.log("Processing video:", videoSrc, containerClasses, videoClasses, "isInSlider:", isInSlider);
    if ($container.hasClass("wrapper")) {
      $video.show();
      console.log("Wrapper video found:", $video.attr("class"), "in container:", $container.attr("class"));
    } else {
      const isMobile = window.innerWidth < 768;
      if (isMobile && $video.hasClass("desctop") || !isMobile && $video.hasClass("mobile")) {
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
    $video.on("click.videoControl touchend.videoControl", function(e) {
      e.stopPropagation();
      e.preventDefault();
      const isMobile = window.innerWidth < 768;
      const videoClass = $video.attr("class") || "no classes";
      const paused = videoEl.paused;
      console.log("Video clicked/touched:", "isMobile:", isMobile, "videoClass:", videoClass, "paused:", paused);
      if (videoEl.paused) {
        pauseOtherVideos(videoEl);
        videoEl.play().catch((error) => console.error("Video play failed:", error));
      } else {
        videoEl.pause();
      }
    });
    $playPauseBtn.on("click.videoControl", function(e) {
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
    $video.on("play.videoControl", function() {
      pauseOtherVideos(videoEl);
      updateButtonState();
    });
    $video.on("pause.videoControl ended.videoControl", updateButtonState);
    updateButtonState();
    $video.data("video-initialized", true);
  }
  jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .customers-video video, .slick-slide video").each(
    function() {
      const $video = jQuery(this);
      initSingleVideo($video);
    }
  );
  jQuery(document).on("click.videoControl touchend.videoControl", ".customers-video video, .slick-slide video, .customer-video video", function(e) {
    const $video = jQuery(this);
    const videoEl = $video[0];
    e.stopPropagation();
    e.preventDefault();
    const src = $video.find("source").attr("src") || "no source";
    const paused = videoEl.paused;
    console.log("Video clicked via delegation:", "src:", src, "paused:", paused);
    if (videoEl.paused) {
      pauseOtherVideos(videoEl);
      videoEl.play().catch((error) => console.error("Video play failed:", error));
    } else {
      videoEl.pause();
    }
  });
  jQuery(document).on("click.videoControl touchend.videoControl", "video", function(e) {
    const $video = jQuery(this);
    const videoEl = $video[0];
    if ($video.data("video-initialized")) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const src = $video.find("source").attr("src") || "no source";
    const paused = videoEl.paused;
    console.log("General video clicked via delegation:", "src:", src, "paused:", paused);
    if (videoEl.paused) {
      pauseOtherVideos(videoEl);
      videoEl.play().catch((error) => console.error("Video play failed:", error));
    } else {
      videoEl.pause();
    }
  });
  jQuery(document).on("afterChange", ".slick-initialized", function(event, slick, currentSlide) {
    console.log("Slick slide changed, reinitializing videos");
    setTimeout(() => {
      jQuery(".slick-active video").each(function() {
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
function initCart(texts) {
  console.log("Initializing cart with texts:", texts);
  console.log("Cart initialized");
  changeDescription();
  if ($(".id--9")[0]) {
    $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
    $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    chechCupon(texts);
    document.addEventListener("ShoptetDOMContentLoaded", function() {
      chechCupon(texts);
      $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
      $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    });
    $("button.btn.btn-secondary").click(function() {
      $(".messages").hide();
    });
  }
  const wheelPosition = sessionStorage.getItem("wheelPosition");
  const seatPosition = sessionStorage.getItem("seatPosition");
  const doorPosition = sessionStorage.getItem("doorPosition");
  $(
    `<input type="text" value="` + wheelPosition + `" id="varchar1" name="varchar1" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
  $(
    `<input type="text" value="` + seatPosition + `" id="varchar2" name="varchar2" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
  $(
    `<input type="text" value="` + doorPosition + `" id="varchar3" name="varchar3" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
}
function changeDescription() {
  const getBrand = sessionStorage.getItem("Brand");
  const getModel = sessionStorage.getItem("Model");
  const getYear = sessionStorage.getItem("Year");
  const getCarType = sessionStorage.getItem("carType");
  console.log("Changing description for cart items");
  $("span.main-link-surcharges").each(function() {
    const text = $(this).text().split(",");
    let newText = "";
    if (text.length > 1) {
      newText += "<ul>";
      $(text).each(function() {
        if (this.includes("TYP")) return;
        newText += "<li>" + this.replace("P\u0159\xEDplatky:", "") + "</li>";
      });
      newText += "</ul>";
    }
    console.log(text);
    const infowrap = $("<div>").addClass("info-wrap");
    const model = $("<ul>").addClass("model").appendTo(infowrap);
    const setup = $("<div>").addClass("setup").appendTo(infowrap);
    $("<li>").text("Zna\u010Dka: " + getBrand).appendTo(model);
    $("<li  >").text("Model: " + getModel).appendTo(model);
    $("<li>").text("Rok: " + getYear).appendTo(model);
    $("<li>").text("Typ: " + getCarType).appendTo(model);
    $("<span>").html(newText).appendTo(setup);
    $(this).html(infowrap);
  });
}
function chechCupon(texts) {
  console.log(texts);
  console.log("Checking coupon code in cart -----------------------");
  const getCode = shoptetData.cartInfo.discountCoupon.code;
  let chechCupon2 = false;
  if (getCode == "LUX10") {
    console.log("Checking coupon code:", getCode);
    $(".main-link-surcharges").each(function() {
      const $this = $(this);
      if ($this.text().includes("Farba boxov ") || $this.text().includes("autokoberce do kufru - Jednoduch\xE9") || $this.text().includes("Kompletn\xED ochrana")) {
        console.log("Coupon found in surcharge:", $this.text());
        chechCupon2 = true;
      }
    });
  }
  if (!chechCupon2) {
    if (!$(".alert.alert-warning")[0] && getCode == "LUX10") {
      setTimeout(function() {
        $(".cart-summary").before('<div class="alert alert-warning" role="alert">' + texts.cupon_message + "</div>");
      }, 1e3);
    }
    console.log("Coupon code is not valid, applying changes");
    $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }
}

// assets/js/functions/validation.js
function validation(texts) {
  $("button.btn.btn-lg.btn-conversion.add-to-cart-button").on("click", function(e) {
    console.log("Validation triggered");
    errorToCart(e, texts);
    const $errorElements = $(".errorToCart");
    if ($errorElements.length) {
      $errorElements.toArray().reduce((prev, curr) => {
        return $(prev).offset().top < $(curr).offset().top ? prev : curr;
      });
    }
  });
  $(document).on("click", ".close-btn.return", function() {
    if (!optionTest()) return;
    $(this).parents(".upsale-Banner").removeClass("showConf");
  });
  $(".content-wrap").on("click", function(event) {
    if ($(event.target).closest(".modl-selector-wrap").length) {
      return;
    }
    const model = sessionStorage.getItem("model");
    console.log(model);
    if (!model || model && (model.includes("Zna\u010Dka") || model.trim() === "Model" || model.includes("Rok v\xFDroby") || model.includes("Typ auta"))) {
      const name = $("h1").text();
      if (name.includes("box") || name.includes("Boxy")) {
        return;
      }
      console.log("click neeeeniiii");
      createpopup2(texts);
      setTimeout(() => {
        $(event.target).closest(".button.option-button").removeClass("active");
      }, 1e3);
      $(".image-wrap").remove();
    }
  });
}
function errorToCart(e, texts) {
  console.log("Error to cart initialized --------------");
  const header = $("h1").text();
  if (header.includes("box") || header.includes("Boxy")) {
    document.addEventListener("ShoptetCartUpdated", function() {
      console.log("Error to cart initialized xxxxxxxxxxxxxxxx");
      window.location.href = "/kosik/";
    });
    return;
  }
  if ($(".goToAction")[0]) {
    console.log("goToAction exists");
    $(".position-wrap").removeClass("active");
    $(".goToAction").addClass("errorToCart").addClass("active");
    setTimeout(() => {
      $(".goToAction").removeClass("errorToCart");
    }, 2e3);
    return;
  }
  if (!$(".upsale-buttons")[0]) {
    document.addEventListener("ShoptetCartUpdated", function() {
    });
    return;
  }
  if ($(".upsale-popup-active")[0]) {
    document.addEventListener("ShoptetCartUpdated", function() {
      window.location.href = "/kosik/";
    });
    return;
  }
  const length = $(".upsale-buttons .active").not(".none").length;
  console.log("Active upsale buttons:", length);
  if (length == 0) {
  }
  document.addEventListener("ShoptetCartUpdated", function() {
    window.location.href = "/kosik/";
  });
  return;
}
function optionTest() {
  console.log("optionTest");
  let allSelected = true;
  let firstErrorElement = null;
  $(".config-wrap .parameter-wrap:visible").each(function() {
    if (!$(this).find(".option-button.active").length) {
      $(this).addClass("errorToCart");
      if (!firstErrorElement) {
        firstErrorElement = $(this);
      }
      allSelected = false;
    }
  });
  return allSelected;
}
function createpopup2(texts) {
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
    `
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
    `
  }).appendTo(overflow);
  $("<h3>", {
    text: texts.no_model_select,
    style: `
      margin-bottom: 30px;
      font-size: 22px;
      color: #333;
      font-weight: 500;
      line-height: 1.4;
    `
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
    click: function() {
      $(".overflow").remove();
      overflow.fadeOut(200, function() {
        $(this).remove();
        let scrollselector = ".col-xs-12.col-lg-6.p-info-wrapper";
        if ($("body").hasClass("mobile")) {
          scrollselector = ".p-thumbnails-wrapper";
        }
        $("#model-selector").fadeIn(200);
        $(".position-wrap.parameter-cars.parameter-wrap.base-config.active").removeClass("active");
        $(".position-wrap.parameter-cars.parameter-wrap.base-config:eq(1)").addClass("active");
      });
      $("#model-selector").addClass("errorToCart");
      setTimeout(() => {
        $("#model-selector").removeClass("errorToCart");
      }, 2e3);
    }
  }).appendTo(popup);
  $("<style>").text(
    `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `
  ).appendTo("head");
}

// assets/js/components/contactForm.js
var PHONE_LABELS = {
  cs: {
    label: "Mobiln\xED telefon",
    placeholder: "+420 900 000 000",
    error: "Vypl\u0148te telefonn\xED \u010D\xEDslo",
    messagePrefix: "Telefon"
  },
  sk: {
    label: "Mobiln\xFD telef\xF3n",
    placeholder: "+421 900 000 000",
    error: "Vypl\u0148te telef\xF3nne \u010D\xEDslo",
    messagePrefix: "Telef\xF3n"
  }
};
var DEFAULT_LANG = "sk";
function initContactForm() {
  const $form = $("#formContact");
  if (!$form.length) return;
  const shoptetLang = window.dataLayer?.find((item) => item.shoptet?.language)?.shoptet?.language ?? document.documentElement.lang?.slice(0, 2).toLowerCase();
  const lang2 = shoptetLang?.slice(0, 2).toLowerCase();
  const t = PHONE_LABELS[lang2] ?? PHONE_LABELS[DEFAULT_LANG];
  const $phoneWrapper = $(`
    <div class="form-group lc-phone-wrapper" id="lc-phone-wrapper">
      <label for="lcPhone"><span class="required-asterisk">${t.label}</span></label>
      <input type="tel" id="lcPhone" class="form-control" autocomplete="tel" placeholder="${t.placeholder}" />
      <span class="lc-phone-error">${t.error}</span>
    </div>
  `);
  $form.find("#email").closest(".form-group").after($phoneWrapper);
  $(document).on("input", "#lcPhone", function() {
    if ($(this).val().trim()) {
      $("#lc-phone-wrapper").removeClass("lc-phone-invalid");
    }
  });
  $form[0].addEventListener(
    "submit",
    function(e) {
      const phone = document.getElementById("lcPhone").value.trim();
      if (!phone) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $("#lc-phone-wrapper").addClass("lc-phone-invalid");
        document.getElementById("lcPhone").focus();
        const top = $("#lc-phone-wrapper").offset().top - 120;
        $("html, body").animate({ scrollTop: top }, 300);
        return;
      }
      const $message = $form.find('textarea[name="message"]');
      const original = $message.val().trim();
      $message.val(t.messagePrefix + ": " + phone + (original ? "\n\n" + original : ""));
    },
    true
  );
}

// assets/js/script.js
var setupData;
$.getJSON(optionData.downloadData, function(data) {
  setupData = data;
  console.log("setupData:", setupData);
  console.log("setupData.settings:", setupData.settings);
  console.log("setupData.cars:", setupData.cars);
  let language4 = dataLayer[0].shoptet.language;
  if (dataLayer[0].shoptet.projectId == 704436) {
    language4 = "cs";
  }
  const texts = setupData.language[language4];
  console.log("setupData.language:", texts);
  initProduct(setupData, texts);
  initModelSelect2(texts, setupData);
  googleReviews(setupData, texts);
  addNote();
  validation(texts);
  initCart(texts);
  $(".config-wrap .parameter-wrap:eq(1)").addClass("noText");
  $(".config-wrap .parameter-wrap:eq(2)").addClass("noText");
  $(".config-wrap .parameter-wrap:eq(3)").addClass("noText");
});
var logoGoogle = '<svg viewBox="0 0 512 512" height="18" width="18"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path></g></svg>';
jQuery(document).ready(function($2) {
  initHeader();
  intIndex();
  initSignpost();
  initVideoPlayAgain();
  initContactForm();
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
    insertPosidion = ".parameter-cars.wheel-Position";
  }
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
    id: "model-selector"
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
    class: "model-selector container"
  }).appendTo(section);
  if ($(".in-index")[0]) {
    $("<h2>").text(texts.select_car_header).appendTo(container);
    $('<div class="prefix">' + texts.select_car_prefix + "</div>").appendTo(container);
  }
  const choiceWrap = $("<div>").addClass("modl-selector-wrap").appendTo(container);
  const znacka = `
        <div class="surcharge-list brands dm-selector">
            
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` + cstm_znacka[0] + `</option>
                </select>
            </div>
        </div>
        `;
  const model = `
        <div class="surcharge-list models dm-selector">
          
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` + cstm_model[0] + `</option>
                </select>
            </div>
        </div>
        `;
  const rocnik = `
        <div class="surcharge-list years dm-selector">
            
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` + cstm_rocnik[0] + `</option>
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
  const otherLabel = typeof language !== "undefined" && language === "cs" ? "Jin\xE9, pros\xEDm napi\u0161te do pozn\xE1mky" : "In\xE9, pros\xEDm nap\xED\u0161te do pozn\xE1mky";
  const otherVariants = ["Jin\xE9, pros\xEDm napi\u0161te do pozn\xE1mky", "In\xE9, pros\xEDm nap\xED\u0161te do pozn\xE1mky"];
  const carVariantParts = setupData.settings.carVariant.split(",");
  const carVariants = [];
  for (let i = 0; i < carVariantParts.length; i++) {
    const part = carVariantParts[i].trim();
    if (part === "Jin\xE9" && carVariantParts[i + 1] && carVariantParts[i + 1].trim().startsWith("Pros\xEDm")) {
      i++;
      carVariants.push(otherLabel);
    } else {
      carVariants.push(part);
    }
  }
  carVariants.forEach(function(variant) {
    $("<option>").text(variant).appendTo(".type-selector .selector select");
  });
  if (getBrand != null) {
    console.log(getBrand);
    $("<option>" + getBrand + "</option>").prependTo(".surcharge-list.brands.dm-selector select");
    $(".surcharge-list.brands.dm-selector select").val(getBrand);
  }
  if (getModel != null && getBrand != null) {
    const models_for_brand = setupData.cars[getBrand];
    if (models_for_brand && Array.isArray(models_for_brand)) {
      for (let i = 0; i < models_for_brand.length; i++) {
        $("<option>" + models_for_brand[i] + "</option>").appendTo(".surcharge-list.models.dm-selector select");
      }
      setTimeout(() => {
        console.log("Nastavuji model (600ms):", getModel);
        $(".surcharge-list.models.dm-selector select").val(getModel);
      }, 600);
      setTimeout(() => {
        console.log("Nastavuji model znovu (1200ms):", getModel);
        $(".surcharge-list.models.dm-selector select").val(getModel);
      }, 1200);
      setTimeout(() => {
        console.log("Posledn\xED pokus o nastaven\xED modelu (2000ms):", getModel);
        $(".surcharge-list.models.dm-selector select").val(getModel);
        console.log("Aktu\xE1ln\xED hodnota selectu:", $(".surcharge-list.models.dm-selector select").val());
      }, 2e3);
    }
  }
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
  const d = /* @__PURE__ */ new Date();
  const currentYear = d.getFullYear();
  for (let year = Number(years_from); year <= currentYear; year++) {
    $("<option>" + year + "</option>").appendTo(".years select");
  }
  const other_option = "<option>" + otherLabel + "</option>";
  $(other_option).appendTo(".type select");
  if (!getYear || !otherVariants.includes(getYear)) {
    $(other_option).appendTo(".years select");
  }
  let isInitializing = true;
  $(".brands select").on("change", function() {
    if (isInitializing) {
      console.log("Ignoruji change event b\u011Bhem inicializace pro:", $(this).val());
      return;
    }
    console.log("Spou\u0161t\xED se change event pro zna\u010Dku:", $(this).val());
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
  setTimeout(() => {
    isInitializing = false;
    console.log("Inicializace dokon\u010Dena, change eventy povoleny");
  }, 2500);
  $(".btn.choice-Model").on("click", function() {
    saveModel(true);
  });
  setTimeout(() => {
    $(".surcharge-list select").on("change", function() {
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
      $(".model-text").text(Brand + " " + Model + " " + Year + " " + type);
    } catch (e) {
      console.warn("Session storage is not available:", e);
    }
  }, 100);
  if ($(".in-index")[0] && redirect) {
    if ($(".surcharge-list.brands.dm-selector select").val() === cstm_znacka[0] || $(".surcharge-list.models.dm-selector select").val() === cstm_model[0] || $(".surcharge-list.years.dm-selector select").val() === cstm_rocnik[0] || $(".surcharge-list.type-selector select").val() === "Typ auta") {
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
setTimeout(function() {
  $(logoGoogle).appendTo(".review-item-long");
  $("#google-reviews br").remove();
}, 2500);
function addNote() {
  if ($(".id--17")[0]) {
    let toNote = function() {
      const city2 = sessionStorage.getItem("adressDelivery");
      const fakturacniAdresa = `
            Adresa zadan\xE1 pro v\xFDpo\u010Det:
             ` + city2 + `
      
     
        `;
      const model = `
            model : ` + sessionStorage.getItem("model") + `  
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
    shoptet.custom.postSuccessfulValidation = function(form) {
      if ($(form).attr("id") === "order-form") {
        console.log("tttt");
        toNote();
      }
      return true;
    };
  }
}
