export function errorToCart() {
  console.log("Error to cart initialized");
  // Inicializace při načtení DOMu

  $("button.btn.btn-lg.btn-conversion.add-to-cart-button").on("click", function (e) {
    if ($(".goToAction")[0]) {
      $(".goToAction").addClass("errorToCart");

      setTimeout(() => {
        $(".goToAction").removeClass("errorToCart");
      }, 3000);
    }
  });
}
