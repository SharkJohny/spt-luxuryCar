export function initCart(setupData) {
  console.log("Cart initialized");

  if ($(".id--9")[0]) {
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
