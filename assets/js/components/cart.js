export function initCart(texts) {
  console.log("Initializing cart with texts:", texts);
  console.log("Cart initialized");
  changeDescription();
  if ($(".id--9")[0]) {
    $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
    $(".p-label:contains(Cena za m. j.)").text("Cena za set");

    chechCupon(texts);
    document.addEventListener("ShoptetDOMContentLoaded", function () {
      chechCupon(texts);
      $(".cart-content.summary-wrapper").appendTo("div#cart-wrapper .col-md-8");
      $(".p-label:contains(Cena za m. j.)").text("Cena za set");
    });

    $("button.btn.btn-secondary").click(function () {
      $(".messages").hide();
    });
  }
  const wheelPosition = sessionStorage.getItem("wheelPosition");
  const seatPosition = sessionStorage.getItem("seatPosition");
  $(
    `<input type="text" value="` +
      wheelPosition +
      `" id="varchar1" name="varchar1" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
  $(
    `<input type="text" value="` +
      seatPosition +
      `" id="varchar2" name="varchar2" class="form-control short js-validate   spellcheck="false" data-ms-editor="true">`
  ).appendTo(".co-billing-address");
}

function changeDescription() {
  const getBrand = sessionStorage.getItem("Brand");
  const getModel = sessionStorage.getItem("Model");
  const getYear = sessionStorage.getItem("Year");
  const getCarType = sessionStorage.getItem("carType");
  console.log("Changing description for cart items");
  $("span.main-link-surcharges").each(function () {
    const text = $(this).text().split(",");
    let newText = "";
    if (text.length > 1) {
      newText += "<ul>";
      $(text).each(function () {
        if (this.includes("TYP")) return;
        newText += "<li>" + this.replace("Příplatky:", "") + "</li>";
      });
      newText += "</ul>";
    }
    console.log(text);
    const infowrap = $("<div>").addClass("info-wrap");
    const model = $("<ul>").addClass("model").appendTo(infowrap);
    const setup = $("<div>").addClass("setup").appendTo(infowrap);
    $("<li>")
      .text("Značka: " + getBrand)
      .appendTo(model);
    $("<li  >")
      .text("Model: " + getModel)
      .appendTo(model);
    $("<li>")
      .text("Rok: " + getYear)
      .appendTo(model);
    $("<li>")
      .text("Typ: " + getCarType)
      .appendTo(model);
    $("<span>").html(newText).appendTo(setup);
    $(this).html(infowrap);

    // $(this).html(newText);
  });
}

function chechCupon(texts) {
  console.log(texts);
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
    if (!$(".alert.alert-warning")[0] && getCode == "LUX10") {
      setTimeout(function () {
        $(".cart-summary").before('<div class="alert alert-warning" role="alert">' + texts.cupon_message + "</div>");
      }, 1000);
    }
    console.log("Coupon code is not valid, applying changes");
    $(".applied-coupon input.btn.btn-sm.btn-primary").click();
  }
}
