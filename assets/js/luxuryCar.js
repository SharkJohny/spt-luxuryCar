// assets/js/option.js
var timestamp = Date.now();
var optionData = {
  key: "value",
  downloadData: "/user/documents/upload/data.json?" + timestamp
};

// assets/js/components/index.js
function intIndex() {
  setTimeout(function() {
    $(".twentytwenty-container").twentytwenty({
      before_label: "P\u0159edt\xEDm",
      after_label: "Potom"
    });
  }, 400);
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
  $("collection-list.collection-list").slick({
    dots: true,
    centerMode: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 4e3,
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
          slidesToShow: 2,
          slidesToScroll: 2,
          autoplay: false
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
          slidesToShow: 2,
          slidesToScroll: 2,
          autoplay: false
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
  $("video").parent().click(function() {
    if ($(this).children("video").get(0).paused) {
      $(this).children("video").get(0).play();
      $(this).children("video").addClass("active");
      $(this).children(".playpause").fadeOut();
    } else {
      $(this).children("video").get(0).pause();
      $(this).children(".playpause").fadeIn();
      $(this).children("video").removeClass("active");
    }
  });
  $(".hotspot").on("click", function() {
    $(".tooltips").removeClass("show");
    $(this).find(".tooltips").addClass("show");
  });
  $(document).on("click", function(e) {
    const $target = $(e.target);
    if (!$target.closest(".hotspot").length && !$target.closest(".tooltips").length) {
      $(".tooltips").removeClass("show");
    }
  });
}

// assets/js/components/productPage.js
function initProduct(setupData2) {
  if ($(".id-751")[0]) {
    $(".benefitBanner__item").remove();
  }
  $(".p-detail-inner .p-detail-info").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  $(".p-detail-inner .p-detail-inner-header").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  $(".benefitBanner.position--benefitProduct .benefitBanner__item").insertBefore(".col-xs-12.col-lg-6.p-info-wrapper");
  const model = sessionStorage.getItem("model");
  if (model) {
    const modelInfo = $("<section>").attr("id", "model-info").insertBefore("section#model-selector");
    $("section#model-selector").hide();
    const infoWrap = $("<div>").addClass("model-info").appendTo(modelInfo);
    $("<div>").addClass("header-info").text("Garancia kompatibility s Va\u0161\xEDm vozidlom").appendTo(infoWrap);
    $("<div>").addClass("model-text").text(model).appendTo(infoWrap);
    $("<div>").addClass("setup-model").text("Upravi\u0165").appendTo(modelInfo);
    $(".setup-model").on("click", function() {
      $("section#model-selector").show();
      modelInfo.remove();
    });
  }
  priplatky(setupData2);
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
}
function priplatky(setupData2) {
  let order = 6;
  if ($(".type-detail").length) {
    $("<div>", {
      class: "upsale-wrap"
    }).insertAfter(".detail-parameters");
    const upsaleBanner = $("<div>", {
      class: "upsale-Banner"
    }).insertAfter(".detail-parameters");
    const bannerWrap = $('<div class="updale-banner-info"></div>').appendTo(upsaleBanner);
    $('<icon class="icon">!</icon>').appendTo(bannerWrap);
    $('<div class="h4">').text("k\xFAp viac za menej").appendTo(bannerWrap);
    $("<span>").text("Vyu\u017Ei na\u0161u akciov\xFA ponuku set s autokobercami za v\xFDhodn\xFA cenu").appendTo(bannerWrap);
    if ($(".parameter-id-89")[0]) {
      const buttonWrap = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap trunk"
      }).appendTo(upsaleBanner);
      $(`<div class="order">${order}</div>`).appendTo(buttonWrap);
      $('<h5 class="variant name">\u0160pecifik\xE1cia vozidla</h5>').appendTo(buttonWrap);
      const parameterWrap = $("<div>", {
        class: "parameter-cars"
      }).appendTo(buttonWrap);
      const carpetsText = setupData2.settings.carpetsText.split(",");
      const carpetsValue = setupData2.settings.carpetsValue.split(",");
      const carpetsImage = setupData2.settings.carpetsImage.split(",");
      const carpetsPrice = setupData2.settings.carpetsPrice.split(",");
      $(carpetsText).each(function(e) {
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
    if ($(".parameter-id-95")[0]) {
      const boxsText = setupData2.settings.boxsText.split(",");
      const boxsValue = setupData2.settings.boxsValue.split(",");
      const boxsImage = setupData2.settings.boxsImage.split(",");
      const boxsPrice = setupData2.settings.boxsPrice.split(",");
      order += 1;
      const buttonWrapBox = $("<div>", {
        class: "upsale-buttons position-wrap parameter-cars parameter-wrap boxs"
      }).appendTo(upsaleBanner);
      $(`<div class="order">${order}</div>`).appendTo(buttonWrapBox);
      $('<h5 class="variant name">boxy do kufra</h5>').appendTo(buttonWrapBox);
      const parameterWrap2 = $("<div>", {
        class: "parameter-cars"
      }).appendTo(buttonWrapBox);
      $(boxsText).each(function(e) {
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
    firstPage();
    const pairVariantList = JSON.parse(setupData2.settings.pairVariantList);
    const pairedOrders = {};
    let orders = 2;
    createBoxConfig();
    $(".detail-parameters .variant-list select").each(function() {
      orders += 1;
      const position = this;
      createOptions(position, orders);
    });
    $(".detail-parameters .surcharge-list select").each(function() {
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
    $(".button.option-button").on("click", function() {
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
        class: "image-wrap"
      }).appendTo(".parameter-wrap.parameter-" + parameterId).fadeIn(1e3);
      $("<img>", { src: image2 }).appendTo(imageWrap);
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
  }
}
function createUpsaleButton(img, text, position, value, type, price, prefix) {
  console.log("price", price);
  if (!img || !text || !position || !price) {
    console.error("Invalid parameters passed to createUpsaleButton");
    return;
  }
  console.log(price.split("/"));
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
  const button = $(buttonHTML).appendTo(position);
  if (priceText[0] == "0") return;
  const save = priceText[1] - priceText[0];
  let priceHTML = `<div class="price">${NumToPrice(priceText[0])}</div><div class="save">U\u0161et\u0159\xEDte ${NumToPrice(save)}</div>`;
  if (prefix) {
    priceHTML = `<div class="price">od ${NumToPrice(priceText[0])}</div><div class="save">U\u0161et\u0159\xEDte a\u017E ${NumToPrice(save)}</div>`;
  }
  const positionadd = $(button).find(".banner-header");
  $(priceHTML).appendTo(positionadd);
  $(".upsale-Banner").hide();
}
$(document).on("click", ".upsale-button", function(e) {
  $(".image-wrap").remove();
  const trunk = $(this).closest(".upsale-buttons.trunk");
  const boxs = $(this).closest(".upsale-buttons.boxs");
  if (trunk.length) {
    if (trunk.hasClass("minimalize")) {
      e.stopPropagation();
      trunk.removeClass("minimalize");
    } else {
      $(".upsale-buttons.boxs").show();
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
  const value = $(this).attr("value")?.split("-");
  console.log(value);
  if (!value) {
    console.error("Atribut 'value' nen\xED dostupn\xFD!");
    return;
  }
  if (boxs.length) {
    $(".upsale-buttons.boxs .upsale-button").removeClass("active");
  }
  if ($(this).hasClass("active")) {
    $(this).removeClass("active");
    $("select.surcharge-parameter.parameter-id-" + value[0]).val(0);
  } else {
    if ($(this).hasClass("radio")) {
      $(".upsale-button.radio").removeClass("active");
    }
    $(this).addClass("active");
    $("select.surcharge-parameter.parameter-id-" + value[0]).val(value[1]);
  }
  if ($(this).hasClass("config")) {
    $(this).parents(".upsale-Banner").addClass("showConf");
  }
  if (value[0] === "conf1") {
    $(".parameter-wrap.parameter-29.orders-5").hide();
  } else if (value[0] === "conf2") {
    $(".parameter-wrap.parameter-29.orders-5").show();
  }
  setTimeout(() => {
    if (typeof shoptet !== "undefined" && shoptet.surcharges?.updatePrices) {
      shoptet.surcharges.updatePrices();
    } else {
      console.warn("Funkce `shoptet.surcharges.updatePrices` nen\xED dostupn\xE1.");
    }
  }, 100);
});
$(document).on("click", ".box-config .close-btn", function() {
  $(this).parents(".upsale-Banner").removeClass("showConf");
  $(this).parents(".upsale-buttons").addClass("minimalize");
});
function firstPage() {
  const wrap = $("<div>", {
    class: "navigatte-button class first",
    "data-option": "option-0"
  }).appendTo(".navidation-Wrap");
  const wheelval = $("select.parameter-id-37.surcharge-parameter").val();
  let typeVal = $("select.parameter-id-22.surcharge-parameter").val();
  if (wheelval == "") {
    $("select.parameter-id-37.surcharge-parameter").val(250);
  }
  if (typeVal == "") {
    const getModel = sessionStorage.getItem("carType");
    console.log(getModel);
    const value = $("select.parameter-id-22.surcharge-parameter option").filter(function() {
      return $(this).text().indexOf(getModel) !== -1;
    }).val();
    console.log(value);
    $("select.parameter-id-22.surcharge-parameter").val(value);
    typeVal = value;
  }
  const pageWrap = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active"
  }).appendTo(".content-wrap");
  $('<div class="order">1</div>').appendTo(pageWrap);
  $('<h5 class="variant name">\u0160pecifik\xE1cia vozidla</h5>').appendTo(pageWrap);
  const wheelWrao = $("<div>", {
    class: "parameter-cars wheel-Position "
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label wheel",
    text: "poz\xEDcia volantu:"
  }).appendTo(wheelWrao);
  const wheelOption = $("<div>", {
    class: "option-wrap"
  }).appendTo(wheelWrao);
  $(
    `<div class='button option-button active' data-value='left'><img src='https://689946.myshoptet.com/user/documents/upload/assets/image/Layer_left.png' alt='250.jpg'><div class='text'>V\u013Eavo</div></div>`
  ).appendTo(wheelOption);
  $(
    `<div class='button option-button' data-value='right'><img src='https://689946.myshoptet.com/user/documents/upload/assets/image/Layer_right.png' alt='251.jpg'><div class='text'>Vpravo</div></div>`
  ).appendTo(wheelOption);
  const sitposition = $("<div>", {
    class: "parameter-cars sit-Position"
  }).appendTo(pageWrap);
  $("<div>", {
    class: "label sit",
    text: "miest na sedenie:"
  }).appendTo(sitposition);
  const sitOption = $("<div>", {
    class: "option-wrap"
  }).appendTo(sitposition);
  $(`<div class='button option-button active' data-value='pass-2'><div class='text'>2</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-4'><div class='text'>4</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-5'><div class='text'>5</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-6'><div class='text'>6</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-7'><div class='text'>7</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-8'><div class='text'>8</div></div>`).appendTo(sitOption);
  $(`<div class='button option-button' data-value='pass-9'><div class='text'>9</div></div>`).appendTo(sitOption);
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
  const patterns = $("<div>", {
    class: "position-wrap parameter-cars parameter-wrap  base-config active"
  }).appendTo(".content-wrap");
  $('<div class="order">2</div>').appendTo(patterns);
  $('<h5 class="variant name">vzor pre\u0161\xEDvania koberca</h5>').appendTo(patterns);
  const patternsWrap = $("<div>", {
    class: "parameter-cars patterns-wrap"
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
    `<a href="${diamondurl}" class="button option-button active" data-value="pattern1"><img src="/user/documents/upload/assets/banners/diamont.jpg" alt="Pattern1.jpg"><div class="banner-header"> diamond LINE</div></a>`
  ).appendTo(patternsWrap);
  const hexa = $(
    `<a href="${hexaurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/hesaline.jpg" alt="Pattern1.jpg"><div class="banner-header"> diamond LINE</div></a>`
  ).appendTo(patternsWrap);
  const stripe = $(
    `<a href="${stripeurl}" class="button option-button " data-value="pattern1"><img src="/user/documents/upload/assets/banners/stripe-line.jpg" alt="Pattern1.jpg"><div class="banner-header"> diamond LINE</div></a>`
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
function createOptions(position, orders) {
  console.log(orders);
  let name = $(position).parents(".variant-list").find("th").text().trim();
  if (name == "") {
    name = $(position).parents(".surcharge-list").find("th").text().trim().replace("?", "");
  }
  const createSlug = (text) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  };
  let slug = createSlug(name);
  const options = $(position).find("option");
  const parameterId = $(position).attr("data-parameter-id");
  let optPosition = ".content-wrap";
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
  $("<h5>", {
    class: "variant name",
    text: name
  }).appendTo(paramerer);
  const optionsWrap = $("<div>", {
    class: "options-wrap"
  }).appendTo(paramerer);
  $(options).each(function() {
    const value = $(this).val();
    if (value == "") return;
    const textOption = $(this).text();
    const valueText = textOption.split("+");
    const nameSplit = valueText[0].split(":");
    const optionButton = $("<div>", {
      class: "button option-button",
      "data-value": value,
      "data-variant": parameterId
    }).appendTo(optionsWrap);
    $("<div>", {
      text: textOption,
      class: "text"
    }).appendTo(optionButton);
    if (textOption.includes("cm")) {
      $("<div>", {
        class: "description",
        html: `<span>${nameSplit[0]}</span><div class='parm'> ${nameSplit[1]}</div><div class='price'>${valueText[1]}</div>`
      }).appendTo(optionButton);
      $(optionButton).addClass("text");
    } else if (textOption.includes("rad")) {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/variants/${parameterId}-${value}.png?8`
      }).appendTo(optionButton);
      $("<div>", {
        class: "banner-header",
        html: `<span>${nameSplit[0]}</span><div class='price'>${valueText[1]}</div>`
      }).appendTo(optionButton);
      $(optionButton).addClass("lines");
    } else if (textOption == "\u017DIADNY +0 K\u010D") {
      $("<div>", {
        class: "description",
        text: valueText[0]
      }).appendTo(optionButton);
      $(optionButton).addClass("text");
    } else {
      $("<img>", {
        alt: `${parameterId}-${value}.jpg`,
        src: `/user/documents/upload/assets/variants/${parameterId}-${value}.jpg?8`
      }).appendTo(optionButton);
    }
  });
}
function createBoxConfig() {
  const wrap = $("<div>", {
    class: "box-config"
  }).appendTo(".upsale-buttons.boxs");
  $('<div class="order">7</div>').appendTo(wrap);
  $('<h5 class="variant name">FARBA</h5>').appendTo(wrap);
  $("<div>", {
    class: "close-btn",
    text: "-"
  }).appendTo(wrap);
  $("<div>", {
    class: "close-btn return",
    text: "potvrdit"
  }).appendTo(wrap);
  const configWrap = $("<div>", {
    class: "config-wrap"
  }).appendTo(wrap);
}

// assets/js/script.js
var setupData;
var googleRef = `<div class="HeaderContainer__Inner-sc-1532ffp-0 kfmkAH HeaderComponent__StyledHeader-sc-9lcg5s-0 ggCtvU es-header-container"><div class="HeaderInfoContainer__Info-sc-16jx15e-0 iXURJw HeaderStyle8__Info-sc-b1gtz-1 fYYhKJ es-header-info"><div class="HeaderRating__RatingContainer-sc-117jf4y-0 iTpmcQ HeaderStyle8__StyledHeaderRating-sc-b1gtz-0 brkxaF es-header-rating-container"><div class="Rating__Container-sc-bk54oq-0 izQGGt es-rating-container HeaderRating__Rating-sc-117jf4y-1 ieRgGM es-header-rating"><div class="RatingValue__Container-sc-fl6036-0 iCNeqx es-rating-value">4.9</div></div></div><div class="HeaderHeading__Container-sc-1fncda3-0 llhhPp es-header-heading-container"><div class="HeaderHeading__Text-sc-1fncda3-1 AGaFi es-header-heading-text">Google Recenzie</div></div><div class="HeaderRating__RatingContainer-sc-117jf4y-0 iTpmcQ es-header-rating-container"><div class="Rating__Container-sc-bk54oq-0 izQGGt es-rating-container HeaderRating__Rating-sc-117jf4y-1 ieRgGM es-header-rating"><div class="RatingBar__Container-sc-qimg51-0 eyLxdR es-rating-bar-container"><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-unfilled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw fHHaSD es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div></div></div><span class="HeaderRating__ReviewsCount-sc-117jf4y-2 kSLkip es-header-rating-reviews-count">(47)</span></div></div><div class="HeaderWriteReviewButton__Component-sc-a5mrro-0 kBskxl es-header-write-review-button-container"><button size="14" class="ButtonBase__ButtonContainer-sc-p43e7i-3 euBiGU HeaderWriteReviewButton__WriteReviewButton-sc-a5mrro-1 iqYjDs es-header-write-review-button" type="button" style="border-radius: 24px; border-color: rgba(0, 0, 0, 0); line-height: 1.32; color: rgb(255, 255, 255); font-family: inherit; font-weight: bold; font-size: 14px; font-style: normal; background-color: rgb(25, 123, 255); border-width: 2px;"><span class="ButtonBase__Overlay-sc-p43e7i-4 jhGZeV" style="padding: 8px 21px; border-radius: calc(22px); background-color: rgba(0, 0, 0, 0);"><span class="ButtonBase__Ellipsis-sc-p43e7i-5 dqiKFy">zobrazi\u0165 na google</span></span></button></div></div>`;
$.getJSON(optionData.downloadData, function(data) {
  setupData = data;
  console.log(setupData.settings);
  initModelSelect2(setupData);
  googleReviews(setupData);
  initProduct(setupData);
  addNote();
});
var logoGoogle = '<svg viewBox="0 0 512 512" height="18" width="18"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path></g></svg>';
jQuery(document).ready(function($2) {
  initHeader();
  intIndex();
  initSignpost();
  initCart();
});
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
}
function initModelSelect2() {
  let insertPosidion = ".in-index .content-wrapper.container:eq(1)";
  if ($(".mobile")[0]) {
    insertPosidion = ".in-index .row.banners-content.body-banners";
  }
  if ($(".type-product")[0]) {
    insertPosidion = ".availability-value";
  }
  const getBrand = sessionStorage.getItem("Brand");
  const getModel = sessionStorage.getItem("Model");
  const getYear = sessionStorage.getItem("Year");
  const getCarType = sessionStorage.getItem("carType");
  const section = $("<section>", {
    id: "model-selector"
  });
  if ($(".mobile")[0]) {
    $(section).prependTo(insertPosidion);
  } else {
    $(section).insertAfter(insertPosidion);
  }
  const container = $("<div>", {
    class: "model-selector container"
  }).appendTo(section);
  if ($(".in-index")[0]) {
    $("<h2>").text("zadajte \xFAdaje o vozidle").appendTo(container);
    $('<div class="prefix">a vytvorte si cenovo zv\xFDhodnen\xED set pod\u013Ea va\u0161\xEDch predst\xE1v</div>').appendTo(container);
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
  if ($(".in-index")[0]) {
    $(znacka + model + rocnik + type + button).appendTo(choiceWrap);
  } else {
    $(znacka + model + rocnik + type).appendTo(choiceWrap);
  }
  $(setupData.settings.carVariant.split(",")).each(function() {
    const option = $("<option>").text(this).appendTo(".type-selector .selector select");
  });
  if (getBrand != null) {
    console.log(getBrand);
    $("<option>" + getBrand + "</option>").prependTo(".surcharge-list.brands.dm-selector select");
    $(".surcharge-list.brands.dm-selector select").val(getBrand);
  }
  if (getModel != null) {
    $("<option>" + getModel + "</option>").prependTo(".surcharge-list.models.dm-selector select");
    $(".surcharge-list.models.dm-selector select").val(getModel);
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
  $(".brands select").on("change", function() {
    if ($(this).val() === cstm_znacka.at(1)) {
      $(".models option:not(.notselect)").remove();
    } else {
      $(".models option:not(.notselect)").remove();
      const models_for_brand = setupData.cars[$(this).val()];
      for (let i = 0; i < models_for_brand.length; i++) {
        $("<option>" + models_for_brand.at(i) + "</option>").appendTo(".models select");
      }
    }
  });
  $(".btn.choice-Model").on("click", function() {
    saveModel(true);
  });
  $(".surcharge-list").on("change", function() {
    saveModel(false);
  });
}
function saveModel(redirect) {
  const Brand = $(".surcharge-list.brands.dm-selector select").val();
  const Model = $(".surcharge-list.models.dm-selector select").val();
  const Year = $(".surcharge-list.years.dm-selector select").val();
  const type = $(".surcharge-list.type-selector select").val();
  console.log(Brand + " " + Model + " " + Year);
  sessionStorage.setItem("model", Brand + " " + Model + " " + Year + " " + type);
  sessionStorage.setItem("Brand", Brand);
  sessionStorage.setItem("Model", Model);
  sessionStorage.setItem("Year", Year);
  sessionStorage.setItem("carType", type);
  if ($(".in-index")[0] && redirect) {
    window.location.href = "/rozcestnik/";
  }
}
function initSignpost() {
  const model = sessionStorage.getItem("model");
  $("section#Model-selecte .model span").text(model);
}
function googleReviews() {
  const google = $("<section/>").attr("id", "goggle-review-wrap").html(googleRef);
  if ($(".mobile")[0]) {
    google.insertAfter(".in-index .row.banners-content.body-banners");
  } else {
    google.insertAfter(".in-index section#model-selector");
  }
}
setTimeout(function() {
  $(logoGoogle).appendTo(".review-item-long");
  $("#google-reviews br").remove();
}, 2500);
function initCart() {
  if (!$(".id--9")[0]) return;
  const bannerWrap = $("<div>", {
    class: "banner-wrap"
  }).insertBefore("table.cart-table");
  $("<div>", {
    class: "h3",
    text: "Dokonal\xE1 ochrana pre v\xE1\u0161 kufor za EXTR\xC9MNE zv\xFDodnenu cenu!"
  }).appendTo(bannerWrap);
  $("<p>", {
    text: "Len teraz m\xF4\u017Eete prida\u0165 luxusn\xE9 autokoberce do kufra alebo \xFAlo\u017En\xE9 boxy za v\xFDrazne zv\xFDhodnen\xFA cenu. Chr\xE1\u0148te kufor V\xE1\u0161ho vozidla pred ne\u010Distotami a majte v\u0161etko na mieste!"
  }).appendTo(bannerWrap);
  const timer = $("<div>", {
    class: "timer-wrap"
  }).appendTo(bannerWrap);
  $("<span>", {
    text: "\u0160peci\xE1lna ponuka kon\u010D\xED za"
  }).appendTo(timer);
  const countdownSpan = $("<span>", {
    class: "countdown",
    text: ""
  }).appendTo(timer);
  $("<a>", {
    class: "btn",
    text: "Prida\u0165 so z\u013Eavou do objedn\xE1vky!",
    href: "#"
  }).appendTo(bannerWrap);
  $("<div>", {
    class: "description",
    text: "T\xFAto ponuku z\xEDskate len pri tejto objedn\xE1vke. Nepreme\u0161kajte \u0161ancu z\xEDska\u0165 doplnky za najlep\u0161iu cenu!"
  }).appendTo(bannerWrap);
  let endTime = sessionStorage.getItem("timerEndTime");
  if (!endTime || new Date(endTime) < /* @__PURE__ */ new Date()) {
    endTime = new Date((/* @__PURE__ */ new Date()).getTime() + 30 * 60 * 1e3);
    sessionStorage.setItem("timerEndTime", endTime);
  } else {
    endTime = new Date(endTime);
  }
  function updateCountdown() {
    const now = /* @__PURE__ */ new Date();
    const remainingTime = endTime - now;
    if (remainingTime <= 0) {
      countdownSpan.text("\u010Das vypr\u0161el!");
      clearInterval(countdownInterval);
      sessionStorage.removeItem("timerEndTime");
    } else {
      const minutes = Math.floor(remainingTime / 1e3 / 60 % 60);
      const seconds = Math.floor(remainingTime / 1e3 % 60);
      countdownSpan.text(`${minutes} min ${seconds} sec`);
    }
  }
  const countdownInterval = setInterval(updateCountdown, 1e3);
  updateCountdown();
}
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
