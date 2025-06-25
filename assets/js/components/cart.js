export function initCart(setupData) {
  console.log("Cart initialized");

  if ($(".id--9")[0]) {
    $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
    $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    changeDescription();
    chechCupon();
    document.addEventListener("ShoptetDOMContentLoaded", function () {
      chechCupon();
    });
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

function chechCupon() {
  console.log("Checking coupon code in cart -----------------------");
  const getCode = shoptetData.cartInfo.discountCoupon.code;
  let chechCupon = false;
  if (getCode == "LUX10") {
    console.log("Checking coupon code:", getCode);
    $(".main-link-surcharges").each(function () {
      const $this = $(this);
      if (
        $this.text().includes("Farba boxov ") ||
        $this.text().includes("autokoberce do kufru - Jednoduché") ||
        $this.text().includes("Kompletní ochrana")
      ) {
        console.log("Coupon found in surcharge:", $this.text());
        chechCupon = true;
      }
    });
    // $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }

  if (!chechCupon) {
    console.log("Coupon code is not valid, applying changes");
    $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }
}
