import { TRUCK_PRODUCT_URLS } from "../truck-konfigurator/truck-brands.js";

export function initHeader() {
  $(".top-navigation-bar-menu-helper").empty();
  $("ul.top-navigation-bar-menu li").addClass("cropped").clone().appendTo(".top-navigation-bar-menu-helper");

  $(".navigation-buttons .cart-count span:contains(košík)").text("Košík");

  $('<a href="#" class="toggle-window" data-target="search" data-testid="linkSearchIcon"></a>').prependTo(".desktop  .navigation-buttons");

  // Language flags for SK / CZ - prepend to navigation buttons

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
  $('<a class="contact-link" href="/kontakty/">Kontakt</a>').prependTo(".navigation-buttons");

  // Language flags dropdown - one flag shown, click to expand
  const isSk = window.dataLayer?.[0]?.shoptet?.projectId === 562035;
  const flagSk = '<img src="https://flagcdn.com/sk.svg" width="24" height="16" alt="SK">';
  const flagCz = '<img src="https://flagcdn.com/cz.svg" width="24" height="16" alt="CZ">';
  const current = isSk
    ? { flag: flagSk, label: "Slovenská verzia" }
    : { flag: flagCz, label: "Česká verze" };
  const other = isSk
    ? `<a href="https://www.luxurycardesign.cz/" class="flag-link" data-lang="cs" aria-label="Česká verze">${flagCz}</a>`
    : `<a href="https://www.luxurycardesign.sk/" class="flag-link" data-lang="sk" aria-label="Slovenská verzia">${flagSk}</a>`;

  const $flags = $("<div>", { class: "language-flags" }).html(
    `<span class="flag-current" aria-label="${current.label}" role="button">${current.flag}</span>` +
      `<div class="language-dropdown">${other}</div>`,
  );
  $flags.prependTo(".navigation-buttons");

  $flags.on("click", ".flag-current", function (e) {
    e.stopPropagation();
    $flags.toggleClass("open");
  });
  $("body").on("click", function () {
    $flags.removeClass("open");
  });
  initTruckMenuItem();
  initVzorkyMenuCta();
  headerFixProdukt();
}

/** Produktová stránka vzorkovníka — oba slugy overené (SK aj CZ vracia 200). */
const VZORKY_PRODUCT_URLS = {
  sk: "/vzorkovnik-dragonskin---objednavka-vzoriek/",
  cs: "/vzorkovnik-dragonskin---objednavka-vzorku/",
};
// Swatche berieme z rovnakého uploadu ako vzorkovník (nič nové sa neuploaduje).
const VZORKY_SWATCH_BASE = "https://www.luxurycardesign.sk/user/documents/upload/assets/config/";
const VZORKY_CTA_SWATCHES = ["D-1", "S-1", "H-1", "LUX-01"];

/** CTA pás na spodku menu widgetu — vzorkovník nie je kategória, preto vizuálne
 *  odlíšený riadok pod dlaždicami, nie šiesta dlaždica. */
function initVzorkyMenuCta() {
  const $menu = $("#menu-widget");
  if (!$menu.length || $menu.children(".menu-widget-cta").length) return;

  const shoptet = window.dataLayer?.find((entry) => entry?.shoptet)?.shoptet || {};
  const isCz =
    String(shoptet.projectId) === "704436" ||
    shoptet.language === "cs" ||
    window.location.hostname.endsWith(".cz");
  const t = isCz
    ? {
        href: VZORKY_PRODUCT_URLS.cs,
        head: "Nevíte, jakou barvu?",
        text: "Záloha 99 Kč se vrací.",
        cta: "Objednat vzorky",
      }
    : {
        href: VZORKY_PRODUCT_URLS.sk,
        head: "Neviete, akú farbu?",
        text: "Záloha 5 € sa vracia.",
        cta: "Objednať vzorky",
      };

  const $cta = $("<a>", { class: "menu-widget-cta", href: t.href });
  const $swatches = $("<div>", { class: "menu-widget-cta__swatches" }).appendTo($cta);
  VZORKY_CTA_SWATCHES.forEach((id) => {
    $("<img>", { src: `${VZORKY_SWATCH_BASE}${id}.jpg`, alt: "", loading: "lazy" }).appendTo($swatches);
  });
  const $body = $("<div>", { class: "menu-widget-cta__body" }).appendTo($cta);
  $("<strong>", { text: t.head }).appendTo($body);
  $("<span>", { text: t.text }).appendTo($body);
  $("<span>", { class: "menu-widget-cta__button", text: t.cta }).appendTo($cta);

  $cta.appendTo($menu);
}

function initTruckMenuItem() {
  const shoptet = window.dataLayer?.find((entry) => entry?.shoptet)?.shoptet || {};
  const isCz =
    String(shoptet.projectId) === "704436" ||
    shoptet.language === "cs" ||
    window.location.hostname.endsWith(".cz");
  const href = isCz ? TRUCK_PRODUCT_URLS.cs : TRUCK_PRODUCT_URLS.sk;
  const label = isCz ? "Kamiony a dodávky" : "Kamióny a dodávky";
  const subtitle = isCz ? "Autokoberce na míru" : "Autokoberce na mieru";
  const $menu = $("#menu-widget");

  if (!$menu.length || $menu.children(".mebu-wrap--truck").length) return;

  const image =
    "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/shop/big/2452-2_luxusne-autokoberce-do-kamionu-4-luxury-car-design-1x1.png?ff=1&x=1024&y=1024&q=85&ts=6a6bb789&sg=38cb01fe";
  const $wrap = $("<div>", { class: "mebu-wrap mebu-wrap--truck" });
  const $text = $("<div>", { class: "menu" }).appendTo($wrap);
  const $list = $("<ul>").appendTo($text);

  $("<li>", { class: "main" })
    .append($("<a>", { href, text: label }))
    .appendTo($list);
  $("<li>")
    .append($("<a>", { href, text: subtitle }))
    .appendTo($list);

  const $pictureLink = $("<a>", { href }).appendTo($wrap);
  const $picture = $("<div>", { class: "picture" }).appendTo($pictureLink);
  $("<img>", { src: image, alt: `${subtitle} – ${label}`, loading: "eager" }).appendTo($picture);
  const $title = $("<div>", { class: "title" }).appendTo($picture);
  $("<div>", { class: "header", text: label }).appendTo($title);
  $("<div>", { class: "prefix", text: subtitle }).appendTo($title);

  $wrap.appendTo($menu);
}

headerFixProdukt();
function headerFixProdukt() {
  // Skip execution if we're on cart or checkout pages
  if ($(".in-kosik")[0] || $(".in-krok-1")[0]) {
    return;
  }

  // Helper function to get element's offset top position
  function getElementOffsetTop(element) {
    return parseInt(element.getBoundingClientRect().top + window.pageYOffset);
  }

  // Debounce function for scroll events
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

  // Passive listener options
  const passiveListener = { capture: true, passive: true };

  // Fixed header class implementation
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

      // Get submit button
      const submitButton = productForm.querySelector("button[type=submit]") || productForm.querySelector("input[type=submit]");
      // Napr. stranka darcekovej poukazky ma #product-detail-form bez submit tlacidla
      // -> getElementOffsetTop(null) by hodil vynimku.
      if (!submitButton) return false;

      // Create fixed header element
      const fixedHeaderDiv = document.createElement("div");

      // Get button offset position
      const buttonOffsetTop = getElementOffsetTop(submitButton);

      // Get product title
      const productTitle = document.getElementsByTagName("h1")[0]?.innerText || "";

      // Get product image
      const metaImage = document.querySelector('meta[property~="og:image"]');
      const imageUrl = metaImage && metaImage.getAttribute("content");

      // Get availability info
      const availabilityElement =
        document.getElementsByClassName("cell-availability-value")[0] ||
        document.getElementsByClassName("product-detail-availability")[0] ||
        document.getElementsByClassName("availability")[0] ||
        document.getElementsByClassName("availability-label")[0];

      // Get price info
      const priceElement =
        document.getElementsByClassName("price-final-holder")[0] ||
        document.getElementsByClassName("sub-left-position")[0] ||
        document.getElementsByClassName("product-detail-final-price")[0] ||
        document.getElementsByClassName("price-final-holder")[0];

      // Create debounced scroll handler
      const scrollHandler = debounceScroll(function () {
        // Počas scroll-anchoringu konfigurátora (kompenzačné scrollBy každý
        // frame) NEprepínať — prahové prekmity robili problikávanie lišty.
        if (window.__lcdAnchoring) return;
        const pluginHeader = document.querySelector("#js-plugin-header");
        if (!pluginHeader) return;
        // Offset tlačidla čítať NAŽIVO — akordeón konfigurátora mení layout,
        // hodnota z initu bola po pár klikoch úplne mimo.
        const btnTop = submitButton ? getElementOffsetTop(submitButton) : buttonOffsetTop;
        // HYSTERÉZA ±120px: zap/vyp až za pásmom, žiadne blikanie na prahu.
        const isActive = pluginHeader.classList.contains("active");
        const shouldShowFixed = isActive
          ? window.pageYOffset > btnTop - 120
          : window.pageYOffset > btnTop + 120;
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

      // Add scroll listener
      window.addEventListener("scroll", () => scrollHandler(), passiveListener);

      // Add click handler to fixed header button after 1 second
      setTimeout(() => {
        const fixedButton = document.querySelector("#js-plugin-fixed-header-add-to-cart");
        if (fixedButton) {
          fixedButton.addEventListener("click", () => {
            submitButton?.click();
          });
        }
      }, 1000);

      // Create the fixed header HTML
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

      // Insert the fixed header before the main header
      header.parentNode.insertBefore(fixedHeaderDiv, header);
    }
  }

  // Initialize the fixed header
  new FixedHeader();
}
