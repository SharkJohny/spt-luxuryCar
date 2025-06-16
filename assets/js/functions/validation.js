import { showUpsalePopup } from "../components/UpsalePopup.js";

export function validation() {
  $("button.btn.btn-lg.btn-conversion.add-to-cart-button").on("click", function (e) {
    console.log("Validation triggered");
    boxValidation(e);
    upsaleValidation(e);
    popupValidation(e);
    errorToCart(e);
  });
}

function upsaleValidation(e) {
  if (!$(".upsale-buttons")[0]) return;
  if (!$(".upsale-buttons .active")[1]) {
    e.preventDefault();
    e.stopPropagation();
    // Přidej errorToCart pouze na ty upsale-buttons, kde není žádné .active tlačítko
    $(".upsale-buttons").each(function () {
      if (!$(this).find(".active").length) {
        $(this).addClass("errorToCart");
        const $errorElement = $(".errorToCart:eq(0)");
        console.log($errorElement.length);
        if ($errorElement.length) {
          $("html, body").animate(
            {
              scrollTop: $errorElement.offset().top - 100,
            },
            500
          );
        }
        setTimeout(() => {
          $(this).removeClass("errorToCart");
        }, 2000);
      }
    });
  }
}
function popupValidation(e) {
  console.log("Popup validation triggered");

  console.log(window.allowDirectAddToCart);
  if (window.allowDirectAddToCart) {
    console.log("allowDirectAddToCart");
    // povolíme submit, resetujeme flag a dál nic neblokujeme
    window.allowDirectAddToCart = false;
    return;
  } else if (!$(".goToAction")[0]) {
    console.log("nenene");
    showUpsalePopup();
    e.stopPropagation();
    e.preventDefault();
    return;
  } else {
    console.log("povolíme submit");
    document.addEventListener("ShoptetCartUpdated", function () {
      window.location.href = "/kosik/";
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
    const $errorElement = $(".errorToCart:eq(0)");
    if ($errorElement.length) {
      $("html, body").animate(
        {
          scrollTop: $errorElement.offset().top - 100,
        },
        500
      );
    }

    setTimeout(() => {
      $(".parameter-wrap").removeClass("errorToCart");
    }, 2000);

    return;
  }
}

function errorToCart(e) {
  console.log("Error to cart initialized");
  // Inicializace při načtení DOMu

  if ($(".goToAction")[0]) {
    $(".goToAction").addClass("errorToCart");

    setTimeout(() => {
      $(".goToAction").removeClass("errorToCart");
    }, 2000);
  }
}
