export function initHeader() {
  $(".top-navigation-bar-menu-helper").empty();
  $("ul.top-navigation-bar-menu li").addClass("cropped").clone().appendTo(".top-navigation-bar-menu-helper");

  $(".navigation-buttons .cart-count span:contains(košík)").text("Košík");

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
}
