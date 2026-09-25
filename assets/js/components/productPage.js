import { showUpsalePopup } from "./UpsalePopup.js";
import { createUpsaleButton, createOptions, createBoxConfig } from "./creatButtons.js";
import { renderTruckConfigurator } from "../truck-konfigurator/index.jsx";
import {
  isVzorkyConfiguratorPage,
  mountVzorkyConfigurator,
} from "../vzorky-konfigurator/index.js";
import {
  isVoucherPage,
  mountVoucherConfigurator,
} from "../voucher-konfigurator/index.jsx";
import { getShoptetContext } from "../functions/shoptetContext.js";

window.addEventListener(
  "error",
  (event) => {
    if (event.target && event.target.tagName === "IMG") {
      const img = event.target;
      // Check if we already retried this image to prevent infinite loop
      if (!img.dataset.retried) {
        // We can't strictly check for 502 status in JS error event, so we retry on any error once
        console.warn("Image load failed (possible 502), retrying with timestamp:", img.src);

        img.dataset.retried = "true";
        const separator = img.src.includes("?") ? "&" : "?";
        img.src = img.src + separator + Date.now();
      }
    }
  },
  true, // Capture phase is needed because error events on elements do not bubble
);

let koberce = 88;
let boxy = 91;
let box1 = 94;
let box2 = 97;
let boxsPrice = [];

const shoptetContext = getShoptetContext();
const projectId = String(shoptetContext.projectId || "");
const language = projectId === "704436" ? "cs" : shoptetContext.language;
if (projectId === "581408") {
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
sessionStorage.setItem("doorPosition", "doors-4");

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
// Pole „Poznámka k objednávke“ stavia doplnok ProductNote.js (spoločný pre
// viac e-shopov). Vloží <textarea id="Note"> bez </textarea>, takže prehliadač
// zoberie zvyšok jeho šablóny („        </div>“) ako text poľa — zákazník potom
// vidí „</div>“ namiesto nápovedy. Doplnok neupravujeme; keď je v poli presne
// táto smetiarina, vyprázdnime ho (zákazník by „</div>“ sám nenapísal).
function vycistiPoznamkuKObjednavke() {
  function skus() {
    var pole = document.getElementById("Note");
    if (pole && pole.value.trim() === "</div>") pole.value = "";
  }
  skus();
  if (!window.MutationObserver || !document.body) return;
  new MutationObserver(skus).observe(document.body, { childList: true, subtree: true });
}

export function initProduct(setupData, texts) {
  vycistiPoznamkuKObjednavke();

  // --- TRUCK CONFIGURATOR (isolated) ---
  // Na URL /test-truck/ se místo standardního konfigurátoru osobáků
  // zobrazí nový truck konfigurátor z assets/truck-konfigurator/index.html.
  // Spouští se pouze na této jediné stránce, aby funkčnost osobáků zůstala
  // beze změn. Napojení na košík / parametry řešíme později.
  if (isTruckConfiguratorPage()) {
    mountTruckConfigurator();
    return;
  }

  // --- DARČEKOVÁ POUKÁŽKA (plný takeover, rovnaký princíp ako truck) ---
  // Na stránke master produktu poukazu (/darcekova-poukazka/) sa namiesto
  // štandardnej produktovej stránky zobrazí konfigurátor hodnoty poukazu;
  // ten sám pridáva zodpovedajúce "mince" (VOUCHER-100…500) do košíka.
  if (isVoucherPage()) {
    mountVoucherConfigurator();
    return;
  }

  // --- VZORKOVNÍK DRAGONSKIN (vizuálny vzorkovník napojený na košík) ---
  // Na stránke /vzorkovnik-dragonskin---objednavka-vzoriek prekreslíme surcharge
  // <select>-y na mriežku farebných dlaždíc; výber sa propaguje späť do natívnych
  // selectov → Shoptet ráta vratnú zálohu a košík funguje.
  //
  // Vzorkovník (a iné „jednoduché" produkty) NIE je autokoberec — nesmie dostať
  // konfigurátor osobáků, model-info ani upsale/cenové bannery, ktoré initProduct
  // štandardne generuje pre autokoberce. Príznak `isVzorky` vypína VŠETKY tieto
  // generátory. Sem sa pridajú ďalšie produkty, kde je auto-konfigurátor nežiadúci.
  //
  // POZOR: žiadny `return`! Na rozdiel od truck konfigurátora (ktorý nahrádza
  // celú stránku) je vzorkovník NORMÁLNY produkt — initProduct musí dobehnúť do
  // konca (odhalenie stĺpca, cena, košík), inak stránka ostane „visieť". Preto
  // negenerátorový page-init necháme bežať (jeho selektory tu aj tak nič netrafia).
  const isVzorky = isVzorkyConfiguratorPage();
  if (isVzorky) {
    mountVzorkyConfigurator();
  }

  if (!isVzorky) createModelInfo();
  // changeThumbnails();
  setTimeout(() => {
    $(".p-thumbnails-horizontal").addClass("overflow-next");
  }, 1000);

  if (!isVzorky) {
    $("<div class='recommended-price'>Doporučená cena</div>").prependTo(".p-info-wrapper span.price-standard");

    $(".price-save:eq(1)").appendTo(".p-info-wrapper span.price-standard");
    $("<div class='recommended-price-final'>" + texts.current_price + "</div>").prependTo(".p-info-wrapper .price-final");
  }
  setTimeout(() => {
    if ($(".col-xs-12.col-lg-6.p-info-wrapper").length) {
      $(".col-xs-12.col-lg-6.p-info-wrapper").addClass("active");
    }
  }, 1000);
  if ($(".id-751").length) {
    $(".benefitBanner__item").remove();
  }

  // Odstraníme nesprávnou variantu videa JEN když v bloku existují obě varianty.
  // Pokud má video blok jen jednu variantu (desctop nebo mobile), necháme ji
  // na všech zařízeních — jinak by produkt s jedním videem zůstal bez videa.
  var isDesktopBody = $("body.desktop").length > 0;
  $("video.desctop, video.mobile").each(function () {
    var $v = $(this);
    var $vp = $v.parent();
    var bothVariants =
      $vp.children("video.desctop").length > 0 &&
      $vp.children("video.mobile").length > 0;
    if (!bothVariants) return;
    if (isDesktopBody && $v.hasClass("mobile")) $v.remove();
    if (!isDesktopBody && $v.hasClass("desctop")) $v.remove();
  });
  // Odstraň prázdné odstavce (&nbsp; / mezery z editoru) v popisu produktu —
  // dělají nesmyslné bílé mezery mezi sekcemi (např. před widgetem "Krok 1-6").
  $(".basic-description p").each(function () {
    var $p = $(this);
    if (
      $p.children().length === 0 &&
      ($p.text() || "").replace(/\u00a0/g, "").trim() === ""
    ) {
      $p.remove();
    }
  });
  if ($(".p-detail-inner .p-detail-info").length) {
    $(".p-detail-inner .p-detail-info").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  if ($(".p-detail-inner .p-detail-inner-header").length) {
    $(".p-detail-inner .p-detail-inner-header").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  if (!isVzorky && $(".benefitBanner.position--benefitProduct .benefitBanner__item").length) {
    $(".benefitBanner.position--benefitProduct .benefitBanner__item").prependTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }
  // Hlavné generátory autokoberec-konfigurátora a upsale/banerov — na vzorkovníku
  // (a iných jednoduchých produktoch) ich PRESKOČÍME, aby sa negenerovali.
  if (!isVzorky) {
    createModelInfo();
    priplatky(setupData, texts);
  }

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
      // TODO: Tato hláška "Vyberte model" ve volbě vozidla se musí přeložit do slovenštiny pomocí JS (dle proměnné `language` / `texts`)
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
  $(".parameter-cars.door-Position .option-wrap .option-button").on("click", function () {
    const position = $(this).data("value");
    sessionStorage.setItem("doorPosition", position);
  });

  // Čeká na async načtení FAQ a přidá tlačítko "Zobrazit více"
  const faqObserver = new MutationObserver(() => {
    const $faqContent = $(".p-info-wrapper .faq-content");
    if (!$faqContent.length) return;

    const $accordions = $faqContent.find(".accordion-wrapper");
    if ($accordions.length <= 4) return;

    if ($faqContent.find(".faq-show-more").length) return;

    faqObserver.disconnect();

    $accordions.each(function (i) {
      if (i >= 4) $(this).addClass("accordion-hidden");
    });

    const btnLabel = language === "sk" ? "Zobraziť viac" : "Zobrazit více";
    const btnLabelLess = language === "sk" ? "Zobraziť menej" : "Zobrazit méně";

    const $showMore = $(`<div class="faq-show-more" style="text-align:center;margin-top:8px;">
      <button type="button" style="background:transparent;border:1px solid #c49b30;color:#c49b30;padding:8px 14px;border-radius:8px;cursor:pointer;">${btnLabel}</button>
    </div>`);

    $faqContent.append($showMore);

    $showMore.on("click", "button", function () {
      const $hidden = $faqContent.find(".accordion-hidden");
      if ($hidden.length) {
        $hidden.removeClass("accordion-hidden");
        $(this).text(btnLabelLess);
      } else {
        $accordions.each(function (i) {
          if (i >= 4) $(this).addClass("accordion-hidden");
        });
        $(this).text(btnLabel);
      }
    });
  });

  faqObserver.observe(document.querySelector(".p-info-wrapper") || document.body, {
    childList: true,
    subtree: true,
  });

  // RRP recalc na page-load: bez tohto volania renderuje Shoptet natívnu
  // recommendedPrice z admin field-u (často nesprávnu — napr. 490 € pri
  // aktuálnej 550 €). Volanie zabezpečí že doporučená cena = current * 1.6
  // zaokrúhlené nahor na 10 už pri prvom render-e, nie až po prvom klike.
  setTimeout(() => calculateStandartPrice(0), 600);
  setTimeout(() => calculateStandartPrice(0), 1500);

  // RRP recalc pri KAŽDEJ zmene ceny — livePrice.js vystavuje
  // LuxuryCarPriceRecalculated s detail.total (base + všetky príplatky:
  // rohož, boxy, TYP). Tým je doporučená cena vždy = aktuálny total × 1.6,
  // teda aj keď zákazník pridá rohož do kufra alebo boxy.
  document.addEventListener("LuxuryCarPriceRecalculated", function (e) {
    const total = e && e.detail && e.detail.total;
    calculateStandartPrice(0, total);
  });
}

/**
 * Initializes the upsale section.
 */
function priplatky(setupData, texts) {
  if (!$(".type-detail").length) return;
  let order = 6;
  const productId = getShoptetContext().productId;

  if (productId == 598 || productId == 610 || productId == 613) {
    order = 4;
  } else if (productId == 2403 || productId == 2415 || productId == 2418) {
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
      // Shoptet vykresľuje na option-och dva atribúty:
      //   data-surcharge-final-price      = cena s DPH (čo vidí zákazník v "+€129")
      //   data-surcharge-additional-price = cena bez DPH (~104.88 = 105 po zaokrúhlení)
      // Pre upsale tlačítka chceme cenu, ktorú zákazník reálne zaplatí ⇒ final.
      // Fallback na additional pre prípad, že by Shoptet final neposlal
      // (rovnako ako to robia ostatné miesta v creatButtons.js / productPage.js).
      const array = [];
      carpetsValue.forEach((value) => {
        const valueKey = value.split("-");
        const $opt = $(
          ".parameter-id-" + valueKey[0] + " option[value='" + valueKey[1] + "']",
        );
        const final = Number($opt.attr("data-surcharge-final-price"));
        const additional = Number($opt.attr("data-surcharge-additional-price"));
        const price = Number.isFinite(final) && final > 0
          ? final
          : Number.isFinite(additional)
          ? additional
          : 0;
        array.push(price);
      });
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

        // Pokud je již aktivní, zavři ho — s kotvou (jediná cesta bez ní;
        // hlavička drží místo, obsah pod ní se složí plynule bez bliknutí)
        if (clickedWrap.hasClass("active")) {
          if (window.__lcdSetStepOpen) window.__lcdSetStepOpen(clickedWrap[0], false);
          else clickedWrap.removeClass("active");
          return;
        }

        const allWraps = $(".content-wrap > .position-wrap, .content-wrap > .parameter-wrap")
          .add(".upsale-buttons.trunk, .upsale-buttons.boxs");
        // Zavři všechny ostatní position-wrap a parameter-wrap elementy
        allWraps.each(function () {
          if (this === clickedWrap[0]) return;
          if (window.__lcdSetStepOpen) window.__lcdSetStepOpen(this, false);
          else $(this).removeClass("active");
        });

        // Otevři kliknutý element
        if (window.__lcdSetStepOpen) window.__lcdSetStepOpen(clickedWrap[0], true);
        else clickedWrap.addClass("active");

        const elementType = clickedWrap.hasClass("position-wrap") ? "position-wrap" : "parameter-wrap";
        const elementName = clickedWrap.find(".variant.name, h5").first().text() || "Unnamed";
        console.log(`Otevřen ${elementType}:`, elementName);
      },
    );

    function isCartStepWrap($wrap) {
      return $wrap.hasClass("upsale-buttons") && $wrap.hasClass("boxs");
    }

    function getStepButtonText($wrap, isLast) {
      if (isCartStepWrap($wrap)) {
        return language === "sk" ? "Prejsť do košíka" : "Přejít do košíku";
      }

      if (language === "sk") {
        return isLast ? "Dokončiť konfiguráciu" : "Prejsť k ďalšiemu kroku";
      }

      return isLast ? "Dokončit konfiguraci" : "Přejít k dalšímu kroku";
    }

    // Přidání tlačítek "Přejít k dalšímu kroku" do všech wrap elementů
    function addNextStepButtons() {
      const allWraps = $(".position-wrap, .parameter-wrap").filter(function () { return !$(this).closest(".box-config").length; });

      allWraps.each(function (index) {
        const $wrap = $(this);

        // Pokud už tlačítko existuje, nepřidávej ho znovu
        if ($wrap.find(".next-step-button").length > 0) {
          return;
        }

        // Určí text tlačítka podle pozice
        const isLast = index === allWraps.length - 1;
        const buttonText = getStepButtonText($wrap, isLast);
        const buttonClass = isLast || isCartStepWrap($wrap) ? "next-step-button finish-button" : "next-step-button";

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
      const allWraps = $(".position-wrap, .parameter-wrap").filter(function () { return !$(this).closest(".box-config").length; });

      allWraps.each(function (index) {
        const $wrap = $(this);
        const $button = $wrap.find(".next-step-button");

        if ($button.length > 0) {
          const isLast = index === allWraps.length - 1;
          const buttonText = getStepButtonText($wrap, isLast);

          // Aktualizuj text a třídu
          $button.text(buttonText);
          $button.toggleClass("finish-button", isLast || isCartStepWrap($wrap));
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

    const header = $("h1").text();
    const isBoxProduct = header.toLowerCase().includes("box");

    if (!isBoxProduct) {
      firstPage(texts);
    }

    // Spusť přidání tlačítek po načtení firstPage (i když skončí předčasně)
    setTimeout(() => {
      addNextStepButtons();
      updateButtonTexts();
    }, 100);

    const pairVariantList = JSON.parse(setupData.settings.pairVariantList);
    const pairedOrders = {};
    let orders = 1;

    if (isBoxProduct) {
      orders = 1;
      createOptions("box", orders);
    }
    createBoxConfig();

    // Klient: defaultne skry "Velikost" wrapy v box-config — zobrazia sa až po
    // výbere conf1/conf2. Bez tohto sa Velikost 1+2+Solo zobrazia naraz aj keď
    // user ešte nič nevybral.
    setTimeout(function () {
      if (typeof resetBoxConfigDefaults === "function") resetBoxConfigDefaults();
    }, 100);

    $(".detail-parameters .variant-list select").each(function () {
      orders += 1;
      const position = this;
      createOptions(position, orders);
    });

    if (isBoxProduct) {
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

    // Dynamicky oprav čísla pořadí trunk a boxs podle skutečného počtu kroků v content-wrap
    const contentStepCount = $(".content-wrap").children(".position-wrap, .parameter-wrap").length;
    $(".upsale-buttons.trunk .order").text(contentStepCount);
    $(".upsale-buttons.boxs .order").text(contentStepCount + 1);
  }
}

// Otevře akordeon bez scrollování
function openNextAccordion($next) {
  $next.addClass("active");
  // Boxs/trunk wrapy su default display:none (skryte cez .hide() v auto-postup
  // logike). Samotne addClass("active") ich nezviditelni - treba explicitne
  // .show(). Bez tohto sa K6 (boxy) neotvori ked zakaznik v K5 (rohoz) nic
  // nevyberie a klikne "Prejst na dalsi krok".
  if ($next.hasClass("boxs") || $next.hasClass("trunk")) {
    $next.show();
  }
}

// Single event listener for .upsale-button
$(document).on("click", ".upsale-button", function (e) {
  // Check if the clicked element is within .upsale-buttons.trunk
  updateUpsale(this, e);

});

function resetBoxConfigDefaults() {
  // Klient: „neviem prečo sa zobrazuje výber veľkosti 3 boxov keď si môže vybrať
  // buď 2 alebo 1 box". Pri reset / pred výberom conf1/conf2 skryjeme všetky
  // box-size parameter wraps (parameter-66/69/78/104 v CZ; .parameter-sizes
  // class v SK). Zobrazia sa až po výbere conf1 (solo) alebo conf2 (box1+2).
  // Cielime cez h5 text (Velikost / Veľkosť / Velokost) — funguje univerzálne
  // bez ohľadu na ID parameter wrapu.
  $(".box-config .parameter-wrap").each(function () {
    const txt = ($(this).find("h5").first().text() || "").toLowerCase().trim();
    if (/^vel[ioe]kos[tť]/.test(txt)) {
      $(this).hide();
    }
  });

  // reset amount buttons to default (2 ks)
  const $amountButtons = $(".box-config .amount-button");
  if ($amountButtons.length) {
    $amountButtons.removeClass("active");
    $amountButtons
      .filter(function () {
        return $(this).text().trim().startsWith("2");
      })
      .addClass("active");
  }

  // reset size selections and visibility (default: 2 sizes visible)
  $(".box-config .parameter-wrap.parameter-sizes").each(function (index) {
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

  // reset all box-config parameters to default (empty value)
  $(".box-config .parameter-wrap").each(function () {
    const $wrap = $(this);

    // reset all option buttons to inactive
    $wrap.find(".button.option-button").removeClass("active");

    // reset all inputs
    $wrap.find("input[type='radio'], input[type='checkbox']").prop("checked", false);

    // reset select to default empty value
    const paramId = $wrap.attr("data-parameterId");
    if (paramId) {
      $("select.parameter-id-" + paramId + ".surcharge-parameter").val("");
    }
  });
}

function setBoxConfigVisibleCount(visibleCount) {
  const count = Math.max(1, Math.min(Number(visibleCount) || 1, 3));

  $(".box-config .amount-button").removeClass("active");
  $(".box-config .amount-button")
    .filter(function () {
      return $(this).text().trim().startsWith(String(count));
    })
    .addClass("active");

  $(".box-config .parameter-wrap.parameter-sizes").each(function (index) {
    const $wrap = $(this);
    const shouldShow = index < count;

    if (shouldShow) {
      $wrap.show();
      return;
    }

    $wrap.hide();
    $wrap.find(".button.option-button.text").removeClass("active");
    $wrap.find("input[type='radio'], input[type='checkbox']").prop("checked", false);

    const paramId = $wrap.attr("data-parameterId");
    if (paramId) {
      $(`select.parameter-id-${paramId}.surcharge-parameter`).val(0);
    }
  });
}

$(document).on("click", ".close-btn.close", function () {
  $(this).parents(".upsale-Banner").removeClass("showConf");
  // trigger("change") — livePrice musí cenu po zrušení boxů snížit zpět
  $("select.parameter-id-" + boxy + ".surcharge-parameter").val(0).trigger("change");
  $("select.parameter-id-" + box1 + ".surcharge-parameter").val(0).trigger("change");
  $("select.parameter-id-" + box2 + ".surcharge-parameter").val(0).trigger("change");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button").removeClass("active");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button.none").addClass("active");
  $(".config-wrap .option-button").removeClass("active");
  resetBoxConfigDefaults();
  updateUpsale(this);
});
$(document).on("click", ".boxs .upsale-button.none", function (e) {
  console.log("clickaaaa");
  // Check if the clicked element is within .upsale-buttons.  $("select.parameter-id-" + boxy + ".surcharge-parameter").val(0);
  $("select.parameter-id-" + box1 + ".surcharge-parameter").val(0).trigger("change");
  $("select.parameter-id-" + box2 + ".surcharge-parameter").val(0).trigger("change");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button").removeClass("active");
  $(".upsale-buttons.parameter-wrap.boxs .upsale-button.none").addClass("active");
  $(".config-wrap .option-button").removeClass("active");
  $(".upsale-Banner").removeClass("showConf");
  resetBoxConfigDefaults();
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

  const doorposition = $("<div>", {
    class: "parameter-cars door-Position",
  }).appendTo(pageWrap);
  const doorLabel = $("<div>", { class: "label door" }).appendTo(doorposition);
  $("<div>")
    .text(language === "cs" ? "Počet dveří" : "Počet dverí")
    .appendTo(doorLabel);
  $("<div>", { class: "label-sub", text: language === "cs" ? "(bez kufru)" : "(bez kufra)" }).appendTo(doorLabel);
  const doorOption = $("<div>", {
    class: "option-wrap",
  }).appendTo(doorposition);
  $(`<div class='button option-button' data-value='doors-2'><div class='text'>2</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button' data-value='doors-3'><div class='text'>3</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button active' data-value='doors-4'><div class='text'>4</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button' data-value='doors-5'><div class='text'>5</div></div>`).appendTo(doorOption);
  $(`<div class='button option-button' data-value='doors-6'><div class='text'>6</div></div>`).appendTo(doorOption);

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
  // Vzorkovník nie je autokoberec — žiadne auto „model-info" (banner kompatibility
  // s vozidlom). Bráni aj globálnemu .position-wrap click handleru vyššie.
  if (isVzorkyConfiguratorPage()) return;
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
    $("<div>")
      .addClass("header-info")
      .text(language === "cs" ? "Záruka kompatibility s Vaším vozidlem" : "Garancia kompatibility s Vaším vozidlom")
      .appendTo(infoWrap);
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

// Bezpečné parsovanie ceny zo zobrazeného textu. SK/CZ formát:
// medzera = tisícový separátor, čiarka = desatinný separátor.
// "€ 371,00" -> 371   |   "1 250,00 €" -> 1250
// (Pôvodné replace(/[^0-9]/g,"") zlepilo "371,00" na "37100" a RRP
//  vyletela na 59 360 € — to tento parser opravuje.)
function lcdParsePrice(raw) {
  if (raw == null) return 0;
  let t = String(raw).replace(/[^\d.,\s]/g, "").trim();
  if (!t) return 0;
  t = t.replace(/\s+/g, ""); // odstráň tisícové medzery
  // posledná čiarka alebo bodka = desatinný oddeľovač -> odsekneme desatiny
  const lastComma = t.lastIndexOf(",");
  const lastDot = t.lastIndexOf(".");
  const decPos = Math.max(lastComma, lastDot);
  if (decPos > -1 && t.length - decPos <= 3) {
    t = t.slice(0, decPos);
  }
  t = t.replace(/[^\d]/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function calculateStandartPrice(diference, explicitPrice) {
  setTimeout(() => {}, 1000);
  console.log(diference);

  // 0) Explicitný total — odovzdaný z LuxuryCarPriceRecalculated eventu
  //    (livePrice.js počíta total = base + všetky surcharge príplatky:
  //    rohož do kufra, boxy, TYP...). Per Michalov spec: doporučená cena =
  //    to čo sa počíta v konfigurátore × 1.6 — teda VRÁTANE príplatkov.
  let price = Number(explicitPrice);
  if (!Number.isFinite(price) || price <= 0) price = 0;

  // 1) .price-final-holder text — livePrice.js sem zapisuje total vrátane
  //    príplatkov. Najspoľahlivejší zdroj aktuálnej zobrazenej ceny.
  if (!price || price <= 0) {
    price = lcdParsePrice($(".price-final-holder").first().text());
  }

  // 2) calculated-price (po user interakcii v konfigurátore)
  if (!price || price <= 0) {
    price = lcdParsePrice($(".p-final-price-wrapper span.calculated-price:eq(0)").text());
  }

  // 3) Fallback pre page-load fázu: meta[itemprop=price] → .price-final-holder
  //    data-price → .price-final span
  if (!price || price <= 0) {
    const metaPrice = Number($('meta[itemprop="price"]').attr("content"));
    if (Number.isFinite(metaPrice) && metaPrice > 0) {
      price = metaPrice;
    } else {
      const holderPrice = Number($(".price-final-holder").attr("data-price"));
      if (Number.isFinite(holderPrice) && holderPrice > 0) {
        price = holderPrice;
      } else {
        price = lcdParsePrice($(".p-final-price-wrapper .price-final span, .price-final span").first().text());
      }
    }
  }

  console.log("price", price);

  // Vypočítej novou standard cenu jako aktuální cena + 60%
  let newStandartPrice = Math.ceil((price * 1.6) / 10) * 10; // price * 1.6, zaokrúhlené nahor na desiatky

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
    text: language === "cs" ? "Jen teď za zvýhodněnou cenu!" : "Iba teraz za zvýhodnenú cenu!",
  }).appendTo(".ti-widget-container");
  $("<div>", {
    class: "description",
    text:
      language === "cs"
        ? "Doplňte svou objednávku o kufřové koberce nebo úložné boxy s výraznou slevou. Nabídka platí jen chvíli!"
        : "Doplňte svoju objednávku o kufrové koberčeky alebo úložné boxy s výraznou zľavou. Ponuka platí len chvíľu!",
  }).appendTo(".ti-widget-container");
  $("<div>", {
    class: "button btn open-upsale",
    text: language === "cs" ? "Využít zvýhodněnou nabídku!" : "Využiť zvýhodnenú ponuku!",
  }).appendTo(".ti-widget-container");
  $("<div>", {
    class: "prefix",
    text:
      language === "cs"
        ? "Jen během této objednávky můžete získat koberce do kufru nebo úložné boxy za extrémně zvýhodněnou cenu. Chraňte a organizujte svůj kufr se stylem!"
        : "Len počas tejto objednávky môžete získať koberčeky do kufra alebo úložné boxy za extrémne zvýhodnenú cenu. Chráňte a organizujte svoj kufor so štýlom!",
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
    // .trigger("change") je NUTNÝ — livePrice.js přepočítává cenu na detailu
    // na change event; bez něj se cena při výběru koberců/boxů do kufru
    // vůbec neměnila (setrvala základní).
    if ($($this).hasClass("active")) {
      $($this).removeClass("active");
      $("select.surcharge-parameter.parameter-id-" + value[0]).val(0).trigger("change");
    } else {
      // Pokud je to radio, nejdřív deaktivuju ostatní
      if ($($this).hasClass("radio")) {
        $(".upsale-button.radio ").removeClass("active");
      }
      $($this).addClass("active");
      $("select.surcharge-parameter.parameter-id-" + value[0]).val(value[1]).trigger("change");
    }

    // Pokud je config a ne none, zobrazím konfiguraci
    if ($($this).hasClass("config") && !$($this).hasClass("none")) {
      $($this).parents(".upsale-Banner").addClass("showConf");
    }

    // Ukázka, jak schovat/zobrazit nějaké prvky
    if (value[0] === "conf1" || value[0] === "conf2") {
      const $boxConfig = $(".box-config");
      const domBoxIds = $boxConfig.length
        ? $boxConfig
            .find(".parameter-wrap")
            .map(function () {
              return Number($(this).attr("data-parameterid"));
            })
            .get()
            .filter((id) => !Number.isNaN(id) && id !== Number(boxy))
        : [];

      const allBoxIds = domBoxIds.length
        ? domBoxIds
        : typeof boxsParameterIds !== "undefined" && Array.isArray(boxsParameterIds) && boxsParameterIds.length
          ? boxsParameterIds.map(Number).filter((id) => id !== Number(boxy))
          : [Number(box1), Number(box2)];

      // Prefer parameter 104 for Solo box if present; fallback to 78, then first available
      let soloId = allBoxIds.includes(104) ? 104 : allBoxIds.includes(78) ? 78 : allBoxIds[0];

      if (value[0] === "conf1") {
        setBoxConfigVisibleCount(1);

        // show only soloId, hide other box params
        allBoxIds.forEach((id) => {
          if (Number(id) === Number(soloId)) {
            $(`.box-config .parameter-wrap.parameter-${id}`).show();
          } else {
            $(`.box-config .parameter-wrap.parameter-${id}`).hide();
          }
        });

        // update solo price from select
        const $soloSelect = $(`select.parameter-id-${soloId}.surcharge-parameter`);
        let soloPrice = 0;
        if ($soloSelect.length) {
          const $sel = $soloSelect.find("option:selected");
          const raw = String($sel.attr("data-surcharge-final-price") || $sel.attr("data-surcharge-additional-price") || "");
          if (raw && raw.replace(/[^0-9]/g, "") !== "") {
            soloPrice = Number(raw.replace(/[^0-9]/g, ""));
          } else {
            const $first = $soloSelect
              .find('option[data-surcharge-final-price]:not([value=""])')
              .filter(function () {
                return (
                  Number(
                    String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0").replace(
                      /[^0-9]/g,
                      "",
                    ),
                  ) > 0
                );
              })
              .first();
            if ($first.length) {
              soloPrice = Number(
                String($first.attr("data-surcharge-final-price") || $first.attr("data-surcharge-additional-price") || "0").replace(/[^0-9]/g, ""),
              );
            }
          }
        }
        const $soloPriceEl = $(`.box-config .parameter-wrap.parameter-${soloId}`).find(".price.price-standart");
        $soloPriceEl.attr("data-price", soloPrice);
        if ($soloPriceEl.length) $soloPriceEl.text(soloPrice > 0 ? NumToPrice(soloPrice) : "0 Kč");
      } else {
        setBoxConfigVisibleCount(2);

        // conf2: show box1 and box2, hide other box params (including solo)
        allBoxIds.forEach((id) => $(`.box-config .parameter-wrap.parameter-${id}`).hide());
        // explicitly hide solo parameter ids to be safe
        $(`.box-config .parameter-wrap.parameter-104`).hide();
        $(`.box-config .parameter-wrap.parameter-78`).hide();
        $(`.box-config .parameter-wrap.parameter-${box1}`).show();
        $(`.box-config .parameter-wrap.parameter-${box2}`).show();

        // update prices for box1 and box2
        [box1, box2].forEach((bid) => {
          const $selWrap = $(`select.parameter-id-${bid}.surcharge-parameter`);
          let p = 0;
          if ($selWrap.length) {
            const $sel = $selWrap.find("option:selected");
            const raw = String($sel.attr("data-surcharge-final-price") || $sel.attr("data-surcharge-additional-price") || "");
            if (raw && raw.replace(/[^0-9]/g, "") !== "") {
              p = Number(raw.replace(/[^0-9]/g, ""));
            } else {
              const $first = $selWrap
                .find('option[data-surcharge-final-price]:not([value=""])')
                .filter(function () {
                  return (
                    Number(
                      String($(this).attr("data-surcharge-final-price") || $(this).attr("data-surcharge-additional-price") || "0").replace(
                        /[^0-9]/g,
                        "",
                      ),
                    ) > 0
                  );
                })
                .first();
              if ($first.length) {
                p = Number(
                  String($first.attr("data-surcharge-final-price") || $first.attr("data-surcharge-additional-price") || "0").replace(/[^0-9]/g, ""),
                );
              }
            }
          }
          const $priceEl = $(`.box-config .parameter-wrap.parameter-${bid}`).find(".price.price-standart");
          $priceEl.attr("data-price", p);
          if ($priceEl.length) $priceEl.text(p > 0 ? NumToPrice(p) : "0 Kč");
        });
      }
    }
  }
  // Trigger change on surcharge selects so Shoptet recalculates prices
  setTimeout(() => {
    $("select.surcharge-parameter").each(function () {
      if ($(this).val()) {
        $(this).trigger("change");
      }
    });
  }, 100);
  setTimeout(() => {
    calculateStandartPrice(diference);
  }, 200);
}

function updateBoxPrice() {
  $(".box-config .parameter-wrap, .parameter-wrap.parameter-sizes").each(function () {
    const price = Number($(this).find(".price.price-standart").attr("data-price"));
    const addPrice = Number($(this).find(".button.option-button.text.active .price").attr("data-price") || 0);
    console.log(price, addPrice);

    $(this)
      .find(".price.price-standart")
      .text(NumToPrice(price + addPrice));
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

});
function priceActualization(e) {
  const header = $("h1").text();
  if (header.includes("box")) {
    $(".surcharge-list select").val(0);
  }
  if (header.includes("box")) {
    setTimeout(() => updateBoxPrice(), 150);
  }
  $(".button.option-button.active").each(function () {
    const value = $(this).attr("data-value");
    const variant = $(this).attr("data-variant");

    const parameterId = $(this).parents(".parameter-wrap").attr("data-parameterid");
    const image = $(this).find("img").attr("src");
    $(".navigatte-button.parameterNav" + parameterId).attr("style", " background-image: url(" + image + ");");
    console.log(parameterId);

    $(".parameter-id-" + variant).val(value).trigger("change");
    const image2 = $(this).find("img").attr("src");

    // Preview obrázok LEN pre krok, v ktorom sa kliklo, výmena na mieste.
    // Pôvodné globálne $(".image-wrap").remove() + append + fadeIn(1000) pri
    // KAŽDOM kliku zmrštilo a znovu nafúklo otvorený krok — stránka poskočila.
    const $wrap = $(this).parents(".parameter-wrap").has(e && e.target);
    if (e && $wrap.length) {
      $wrap.find(".image-wrap").remove();
      const imageWrap = $("<div>", { class: "image-wrap" }).appendTo($wrap);
      const $img = $("<img>", { src: image2 }).appendTo(imageWrap);
      // Preview zväčší obsah kroku AŽ po tom, čo akordeon zmeral cieľovú výšku
      // pri otvorení — bez premerania ho overflow:hidden orezal (preview zmizol).
      const remeasure = () => {
        if (window.__lcdMeasureStep) $wrap.each((_, el) => window.__lcdMeasureStep(el));
      };
      requestAnimationFrame(remeasure);
      $img.on("load", remeasure);
    }
  });

  // e môže byť undefined (amountChoser volá priceActualization() bez eventu)
  if (e) {
    $(".parameter-wrap").not($(e.target).parents(".parameter-wrap")).find(".image-wrap").remove();
  }
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

/* =========================================================================
 * TRUCK KONFIGURÁTOR – izolovaný embed
 * =========================================================================
 * Pro jediný testovací produkt `/test-truck/` vyměníme celou plochu detailu
 * produktu za iframe s novým konfigurátorem (standalone React app ze souboru
 * assets/truck-konfigurator/index.html). Žádná funkcionalita osobáků se tím
 * nemění – hlavní větev initProduct() se na truck stránce vůbec nespustí.
 *
 * Záměrně zatím neřešíme:
 *  - napojení na Shoptet košík / parametry produktu
 *  - předvýběr jazyka
 *  - postMessage komunikaci s rodičem
 * To doplníme v další iteraci.
 * ========================================================================= */
/**
 * Truck konfigurátor sa aktivuje na produktovej stránke, ktorej H1
 * obsahuje slovo "TRUCK" (case-insensitive). Tým pokrýva:
 *  - test produkt /luxusne-autokoberce-truck---test-konfigurator/
 *  - akýkoľvek budúci truck produkt s "TRUCK" v názve, bez nutnosti
 *    pridávať URL slug do kódu.
 *
 * Fallback: starý slug /test-truck/ (prototyp bez reálneho Shoptet
 * produktu na lokáli) detekujeme aj URL-om, lebo tam H1 nemusí byť.
 */
function isTruckConfiguratorPage() {
  try {
    const cesta = window.location.pathname || "";
    if (/\/test-truck(\/|$)/i.test(cesta)) return true;
    // Michal 2026-09-01 premenoval produkt z "truck" na "kamiony" — H1 uz
    // slovo truck neobsahuje a konfigurator prestal nabiehat. Berieme oboje.
    if (/autokoberce-(truck|kamiony)(\/|$)/i.test(cesta)) return true;
    const h1 = document.querySelector("h1");
    const nadpis = h1 ? h1.textContent || "" : "";
    if (/\btruck\b/i.test(nadpis)) return true;
    if (/kami[oó]n/i.test(nadpis)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

function mountTruckConfigurator() {
  $("body").addClass("is-truck-konfigurator");

  // Verbose log pre vývoj – každá zmena stavu konfigurátora vypíše
  // rozpis ceny do konzoly. Na produkcii vypnuté (iba na localhoste).
  try {
    const host = (window.location && window.location.hostname) || "";
    if (/^localhost$|^127\.0\.0\.1$|\.local$/i.test(host)) {
      window.__TRUCK_KONFIG_VERBOSE__ = true;
      // eslint-disable-next-line no-console
      console.log(
        "%c[truck-konfig] verbose mode ON – ceny vidíš v panele i v tomto logu. " +
          "Aktuálny výpočet: window.__truckKonfig",
        "color:#C5A44E;font-weight:600",
      );
    }
  } catch (e) { /* ignore */ }

  const placeMountNode = () => {
    const $host = $(".col-xs-12.col-lg-6.p-info-wrapper").first().length
      ? $(".col-xs-12.col-lg-6.p-info-wrapper").first()
      : $(".p-info-wrapper").first();
    if (!$host.length) return null;

    $host.addClass("active");

    let mountEl = document.getElementById("truck-konfigurator-root");
    if (mountEl) return mountEl;

    const $wrap = $("<div>", { class: "truck-konfigurator-wrap" });
    mountEl = document.createElement("div");
    mountEl.id = "truck-konfigurator-root";
    $wrap.append(mountEl);
    $host.append($wrap);
    return mountEl;
  };

  const mountEl = placeMountNode();
  if (mountEl) { renderTruckConfigurator(mountEl); return; }

  let tries = 0;
  const iv = setInterval(() => {
    const el = placeMountNode();
    if (el) { clearInterval(iv); renderTruckConfigurator(el); return; }
    if (++tries > 40) clearInterval(iv);
  }, 100);
}
