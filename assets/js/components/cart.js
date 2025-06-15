export function initCart(setupData) {
  console.log("Cart initialized");

  if ($(".id--9")[0]) {
    $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
    changeDescription();
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
