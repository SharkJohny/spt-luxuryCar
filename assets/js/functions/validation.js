import { showUpsalePopup } from "../components/UpsalePopup.js";

export function validation(texts) {
  $("button.btn.btn-lg.btn-conversion.add-to-cart-button").on("click", function (e) {
    // Klient: „byly tam validace na všechno, nemůže se přidat do košíku
    // produkt který není nakonfigurovaný". Predtým bolo všetko
    // (preventDefault a stopPropagation) zakomentované – Shoptet form
    // sa odoslal bez ohľadu na chýbajúce výbery. Teraz blokujeme.
    if (!validateProductConfig()) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    errorToCart(e, texts);
    // Find highest errorToCart element and scroll to it
    const $errorElements = $(".errorToCart");
    if ($errorElements.length) {
      $errorElements.toArray().reduce((prev, curr) => {
        return $(prev).offset().top < $(curr).offset().top ? prev : curr;
      });
    }
  });

  $(document).on("click", ".close-btn.return", function () {
    if (!optionTest()) return;
    $(this).parents(".upsale-Banner").removeClass("showConf");
  });

  $(".content-wrap").on("click", function (event) {
    if ($(event.target).closest(".modl-selector-wrap").length) {
      return;
    }
    const model = sessionStorage.getItem("model");
    console.log(model);
    if (
      !model ||
      (model && (model.includes("Zna\u010Dka") || model.trim() === "Model" || model.includes("Rok v\xFDroby") || model.includes("Typ auta")))
    ) {
      const name = $("h1").text();
      if (name.includes("box") || name.includes("Boxy")) {
        return;
      }
      console.log("click neeeeniiii");
      createpopup(texts);
      setTimeout(() => {
        $(event.target).closest(".button.option-button").removeClass("active");
      }, 1e3);
      $(".image-wrap").remove();
    }
  });
}

/**
 * Komplexná pre-cart validácia. Vracia `true` ak sa môže pokračovať
 * do košíka, `false` ak chýba výber – v tom prípade označí chýbajúce
 * sekcie `.errorToCart`, otvorí prípadne zatvorený `.upsale-Banner`,
 * zoskrolnie na prvú chybu a po 2.5 s zhodí červené borders.
 *
 * Klient: „byly tam validace na všechno, nemůže se přidat do košíku
 * produkt který není nakonfigurovaný do piče". Vrátené naspäť.
 */
function validateProductConfig() {
  const $errors = $();
  let $first = null;

  function add($el) {
    if (!$el || !$el.length) return;
    $el.addClass("errorToCart");
    $errors.push.apply($errors, $el.toArray());
    if (!$first) $first = $el;
  }

  // 1) Všetky viditeľné `.parameter-wrap` – akordeon kroky aj box-config
  //    musia mať aktívny výber, ak obsahujú selectable element.
  $(".parameter-wrap:visible").each(function () {
    const $wrap = $(this);
    if (!isWrapValid($wrap)) add($wrap);
  });

  // 2) Skupiny upsale tlačítok (carpets, boxes, atď.) – každá viditeľná
  //    `.upsale-buttons` musí mať aspoň jednu `.upsale-button.active`
  //    (mimo voľby „Nechcem"/none, ktorá je `.none`).
  $(".upsale-buttons:visible").each(function () {
    const $group = $(this);
    if (!$group.find(".upsale-button").length) return;
    if (!$group.find(".upsale-button.active").not(".none").length) {
      add($group);
    }
  });

  // 3) Aktivuj zatvorené nadradené paneli, aby user videl chybu.
  if ($first) {
    const $banner = $first.closest(".upsale-Banner");
    if ($banner.length && !$banner.hasClass("showConf")) {
      $banner.addClass("showConf");
    }
    const $boxConfig = $first.closest(".box-config");
    if ($boxConfig.length && $boxConfig.css("display") === "none") {
      $boxConfig.css("display", "");
    }

    // 4) Scroll na prvú chybu (100 px ofset od horného okraja).
    setTimeout(function () {
      const top = $first.offset() && $first.offset().top;
      if (top != null) {
        $("html, body").stop(true).animate({ scrollTop: Math.max(top - 100, 0) }, 400);
      }
    }, 50);

    // 5) Po 2.5 s zhoď červené orámovanie.
    setTimeout(function () {
      $(".errorToCart").removeClass("errorToCart");
    }, 2500);
  }

  return $first === null;
}

/**
 * Lokálne mirroruje `isWrapSelectionValid` z productPage.js (tam je
 * v closure a nedá sa importovať). Wrap je validný ak nemá selectable
 * element (info wrap), ALEBO ak má aspoň jeden aktívny.
 */
function isWrapValid($wrap) {
  let hasSelectable = false;
  let valid = false;

  if ($wrap.find(".option-button").length) {
    hasSelectable = true;
    if ($wrap.find(".option-button.active").length) valid = true;
  }
  if ($wrap.find(".upsale-button").length) {
    hasSelectable = true;
    if ($wrap.find(".upsale-button.active").not(".none").length) valid = true;
  }
  if ($wrap.find("select.surcharge-parameter").length) {
    hasSelectable = true;
    $wrap.find("select.surcharge-parameter").each(function () {
      const val = $(this).val();
      if (val && val !== "0" && val !== "" && val !== null) valid = true;
    });
  }
  if ($wrap.find("input[type='radio'], input[type='checkbox']").length) {
    hasSelectable = true;
    if ($wrap.find("input[type='radio']:checked, input[type='checkbox']:checked").length) {
      valid = true;
    }
  }

  return !hasSelectable || valid;
}

function upsaleValidation(e) {
  if (!$(".upsale-buttons")[0]) return;
  if (!$(".upsale-buttons .active")[1]) {
    e.preventDefault();
    e.stopPropagation();
    // Přidej errorToCart pouze na ty upsale-buttons, kde není žádné .active tlačítko
    $(".upsale-buttons").each(function () {
      if (!$(this).find(".active").length) {
        $(this).addClass("errorToCart").addClass("active");
        setTimeout(() => {
          $(this).removeClass("errorToCart");
        }, 2000);
      }
    });
  }
  if ($(".upsale-button.radio.active").not(".none")[0]) {
    window.allowDirectAddToCart = true;
  }
}
function popupValidation(e) {
  console.log("Popup validation triggered");

  console.log(window.allowDirectAddToCart);
  if (window.allowDirectAddToCart) {
    console.log("allowDirectAddToCart");
    // povolíme submit, resetujeme flag a dál nic neblokujeme
    window.allowDirectAddToCart = false;
    document.addEventListener("ShoptetCartUpdated", function () {
      //window.location.href = "/kosik/";
    });
    return;
  } else if (!$(".goToAction")[0]) {
    console.log("nenene");
    // showUpsalePopup();
    // e.stopPropagation();
    // e.preventDefault();
    return;
  } else {
    console.log("povolíme submit");
    document.addEventListener("ShoptetCartUpdated", function () {
      // window.location.href = "/kosik/";
    });
  }
}

function boxValidation(e) {
  const name = $("h1").text().trim();
  if (!name.toLowerCase().includes("box")) return;

  const visibleWraps = $(".parameter-wrap:visible");
  let allWrapsHaveActive = true;

  visibleWraps.each(function () {
    if (!$(this).find(".option-button.active").length) {
      allWrapsHaveActive = false;
      $(this).addClass("errorToCart");
      e.stopPropagation();
      e.preventDefault();
    }
  });

  if (!allWrapsHaveActive) {
    setTimeout(() => {
      $(".parameter-wrap").removeClass("errorToCart");
    }, 2000);

    return;
  }
}

function errorToCart(e, texts) {
  console.log("Error to cart initialized --------------");

  const header = $("h1").text();
  if (header.includes("box") || header.includes("Boxy")) {
    document.addEventListener("ShoptetCartUpdated", function () {
      console.log("Error to cart initialized xxxxxxxxxxxxxxxx");
      window.location.href = "/kosik/";
    });
    return;
  }
  // Inicializace při načtení DOMu

  if ($(".goToAction")[0]) {
    console.log("goToAction exists");
    $(".position-wrap").removeClass("active");
    $(".goToAction").addClass("errorToCart").addClass("active");

    setTimeout(() => {
      $(".goToAction").removeClass("errorToCart");
    }, 2000);
    // e.preventDefault();
    // e.stopPropagation();
    return;
  }
  if (!$(".upsale-buttons")[0]) {
    document.addEventListener("ShoptetCartUpdated", function () {
      // window.location.href = "/kosik/";
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
    // e.preventDefault();
    // e.stopPropagation();
    // $(".upsale-buttons").each(function () {
    //   if (!$(this).find(".active").length) {
    //     $(this).addClass("errorToCart");
    //     const $errorElement = $(".errorToCart:eq(0)");
    //     console.log($errorElement.length);
    //     if ($errorElement.length) {
    //       $("html, body").animate(
    //         {
    //           scrollTop: $errorElement.offset().top - 100,
    //         },
    //         500
    //       );
    //     }
    //     setTimeout(() => {
    //       $(this).removeClass("errorToCart");
    //     }, 2000);
    //   }
    // });
    // showUpsalePopup(texts);
  }
  document.addEventListener("ShoptetCartUpdated", function () {
    window.location.href = "/kosik/";
  });
  return;
}

function optionTest() {
  let allSelected = true;
  let firstErrorElement = null;

  $(".config-wrap .parameter-wrap:visible").each(function () {
    if (!$(this).find(".option-button.active").length) {
      $(this).addClass("errorToCart");
      if (!firstErrorElement) {
        firstErrorElement = $(this);
      }
      allSelected = false;
    }
  });

  // Klient: „posledný krok blbí — keď si nevyberie farbu, nevyroluje to tam
  // kde má na výber farby boxov". Označíme všetky chýbajúce naraz červeným
  // borderom (už urobené vyššie), zoskrolujeme k prvému, a po 2 s farbu
  // zhodíme aby user vedel skúsiť znova.
  if (!allSelected && firstErrorElement) {
    const $err = firstErrorElement;

    // Ak parent .box-config je zatvorený (display:none), otvoríme ho.
    const $boxConfig = $err.closest(".box-config");
    const $upsaleBanner = $err.closest(".upsale-Banner");
    if ($upsaleBanner.length && !$upsaleBanner.hasClass("showConf")) {
      $upsaleBanner.addClass("showConf");
    }
    if ($boxConfig.length && $boxConfig.css("display") === "none") {
      $boxConfig.css("display", "");
    }

    // Scroll na první chybějící (s 100px ofsetem od horního okraje viewportu)
    setTimeout(() => {
      const offsetTop = $err.offset() && $err.offset().top;
      if (offsetTop != null) {
        $("html, body").stop(true).animate({ scrollTop: Math.max(offsetTop - 100, 0) }, 400);
      }
    }, 50);

    setTimeout(() => {
      $(".config-wrap .parameter-wrap.errorToCart").removeClass("errorToCart");
    }, 2500);
  }

  return allSelected;
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
        $(".position-wrap.parameter-cars.parameter-wrap.base-config:eq(1)").addClass("active");
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
