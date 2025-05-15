/**
 * Sticky Photos - Implementace sticky scrollování pro produktové obrázky
 *
 * Tato funkce zajistí, že při scrollování stránky zůstane .p-image-wrapper
 * přichycený k horní části obrazovky a zastaví se, když dosáhne spodní
 * části prvku .product-top
 */

export function stickyPhotos() {
  // Inicializace při načtení DOMu
  // document.addEventListener("DOMContentLoaded", initStickyProductInfo);
  initStickyProductInfo();
}
/**
 * Inicializace sticky scrollování pro produkt info wrapper
 */
function initStickyProductInfo() {
  console.log("Sticky photos initialized");
  // Kontrola, zda jsme na produktové stránce a existují potřebné prvky
  const productTop = document.querySelector(".product-top");
  const infoWrapper = document.querySelector(".p-info-wrapper");

  if (!productTop || !infoWrapper) {
    return;
  }

  // Přidání CSS stylu pro sticky prvek, pokud ještě neexistuje
  if (!document.getElementById("sticky-product-styles")) {
    const styleElement = document.createElement("style");
    styleElement.id = "sticky-product-styles";
    styleElement.textContent = `
      .p-info-wrapper.sticky {
        position: fixed;
        top: 0;
        z-index: 50;
        transition: transform 0.2s ease-out;
      }
      
      @media (max-width: 991px) {
        .p-info-wrapper.sticky {
          position: static !important;
          transform: none !important;
          width: auto !important;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Proměnné pro sledování rozměrů a pozic
  let infoWrapperWidth;
  let infoWrapperLeft;
  let productTopBottom;
  let infoWrapperHeight;
  let headerHeight;

  // Funkce pro aktualizaci rozměrů a pozic
  function updateDimensions() {
    infoWrapperWidth = infoWrapper.offsetWidth;
    infoWrapperLeft = infoWrapper.getBoundingClientRect().left + window.pageXOffset;
    productTopBottom = productTop.getBoundingClientRect().top + productTop.offsetHeight + window.pageYOffset;
    infoWrapperHeight = infoWrapper.offsetHeight;

    // Získání výšky hlavičky webu, pokud existuje
    const headerElement = document.querySelector(".header-top") || document.querySelector("header");
    headerHeight = headerElement ? headerElement.offsetHeight : 0;
  }

  // Inicializace rozměrů
  updateDimensions();

  // Aktualizace rozměrů při změně velikosti okna
  window.addEventListener("resize", function () {
    updateDimensions();
    handleScroll(); // Přepočítat pozici po změně rozměrů
  });

  // Funkce pro správu sticky chování při scrollování
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const infoWrapperTop = infoWrapper.getBoundingClientRect().top + window.pageYOffset - headerHeight;

    // Výpočet, kdy by měl prvek dosáhnout spodní hranice
    const maxTranslate = productTopBottom - (infoWrapperTop + infoWrapperHeight) - headerHeight;

    // Přepnutí na sticky, když scrollujeme pod horní hranici prvku
    if (scrollTop > infoWrapperTop) {
      //   infoWrapper.classList.add("sticky");

      // Aplikování původní šířky a pozice při sticky režimu
      //   infoWrapper.style.width = infoWrapperWidth + "px";
      //   infoWrapper.style.left = infoWrapperLeft + "px";
      //   infoWrapper.style.top = headerHeight + "px";

      // Omezení, aby nepřesahoval spodní hranici parent prvku
      if (scrollTop + infoWrapperHeight + headerHeight > productTopBottom) {
        const translateY = maxTranslate < 0 ? maxTranslate : 0;
        infoWrapper.style.transform = `translateY(${translateY}px)`;
      } else {
        infoWrapper.style.transform = "translateY(0)";
      }
    } else {
      // Návrat do původního stavu, když scrollujeme zpět nahoru
      infoWrapper.classList.remove("sticky");
      infoWrapper.style.width = "";
      infoWrapper.style.left = "";
      infoWrapper.style.transform = "";
      infoWrapper.style.top = "";
    }
  }

  // Přidání event listeneru pro scrollování
  window.addEventListener("scroll", handleScroll);

  // Počáteční kontrola scrollování
  handleScroll();
}

// Export funkce pro možné použití v jiných modulech
// if (typeof module !== "undefined" && module.exports) {
//   module.exports = { initStickyProductInfo };
// }

/**
 * Sticky Photos - Jednoduché posouvání obrázků při scrollování
 * Tato funkce ovlivňuje pouze p-image-wrapper, p-info-wrapper zůstává nezměněn
 */

document.addEventListener("DOMContentLoaded", function () {
  // Počkejme, až se načte DOM
  if (!$("body.desktop").length) {
    return;
  }
  setTimeout(initStickyPhotos, 500);
});

function initStickyPhotos() {
  const imageWrapper = document.querySelector(".p-image-wrapper");
  const productTop = document.querySelector(".product-top");

  if (!imageWrapper || !productTop) {
    console.log("Produktové elementy nenalezeny");
    return;
  }

  // CSS optimalizace pro plynulost
  imageWrapper.style.willChange = "transform";

  // Odsazení od horního okraje okna při sticky efektu
  const stickyOffset = 100;

  // Základní proměnné
  let imageWrapperHeight = imageWrapper.offsetHeight;
  let productTopRect = productTop.getBoundingClientRect();
  let productTopTop = productTopRect.top + window.pageYOffset;
  let productTopHeight = productTop.offsetHeight;
  let initialOffsetTop = imageWrapper.getBoundingClientRect().top + window.pageYOffset;

  // Optimalizace scrollu pomocí requestAnimationFrame
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updatePosition);
      ticking = true;
    }
  }

  function updatePosition() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    // Výška a pozice se mohou měnit (např. při resize)
    imageWrapperHeight = imageWrapper.offsetHeight;
    productTopHeight = productTop.offsetHeight;
    productTopTop = productTop.getBoundingClientRect().top + window.pageYOffset;
    initialOffsetTop = productTopTop;

    // Vypočítej maximální možný posun
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

  // Funkce pro aktualizaci rozměrů
  function updateDimensions() {
    imageWrapperHeight = imageWrapper.offsetHeight;
    productTopHeight = productTop.offsetHeight;
    productTopTop = productTop.getBoundingClientRect().top + window.pageYOffset;
    initialOffsetTop = productTopTop;
    updatePosition();
  }

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", updateDimensions);

  // Inicializace
  updateDimensions();
  updatePosition();
}
