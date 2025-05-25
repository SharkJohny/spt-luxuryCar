// UpsalePopup.js
// Samostatný popup pro upsale s odpočtem a vlastním stylem
// Používá jQuery

export function showUpsalePopup() {
  console.log("showUpsalePopup");
  if ($(".overflow.upsale-popup").length) return;

  const $overlay = $("<div>", { class: "overflow upsale-popup" }).appendTo("body");
  const $popup = $("<div>", { class: "upsale-popup-box" }).appendTo($overlay);

  //   // Zavírací křížek
  //   $("<div>", {
  //     text: "×",
  //     class: "upsale-popup-close",
  //     click: function () {
  //       $overlay.remove();
  //     },
  //   }).appendTo($popup);

  // Vnitřní wrap pro obsah
  const $inner = $("<div>", { class: "upsale-popup-inner" }).appendTo($popup);

  // Nadpis
  $("<div>", {
    text: "NEZABUDOL SI NA NIEČO?",
    class: "upsale-popup-title",
  }).appendTo($inner);

  // Podnadpis
  $("<div>", {
    html: "ROHOŽ DO KUFRA<br>ALEBO ŠTÝLOVÉ BOXY",
    class: "upsale-popup-subtitle",
  }).appendTo($inner);

  // Info text
  $("<div>", {
    html: "VYUŽI ZĽAVU PRI NÁKUPE SPOLU<br>S KOBERCAMI POD SEDADLÁ – JE TO JEDINEČNÁ PRÍLEŽITOSŤ",
    class: "upsale-popup-info",
  }).appendTo($inner);

  // Zvýrazněný kód
  $("<div>", {
    html: "POUŽI KÓD <b>LUX10</b> A ZÍSKAJ DODATOČNÚ ZĽAVU PRI NÁKUPE SETU",
    class: "upsale-popup-code",
  }).appendTo($inner);

  // Text před timerem
  $("<div>", {
    text: "NA VYUŽITIE SLEVY VÁM OSTÁVA LEN:",
    class: "upsale-popup-timer-label",
  }).appendTo($inner);

  // Timer
  const $timer = $("<div>", {
    class: "upsale-popup-timer",
    text: "10:00",
  }).appendTo($inner);

  // Tlačítka
  const $btnWrap = $("<div>", { class: "upsale-popup-btns" }).appendTo($inner);
  $("<button>", {
    html: "CHCEM ZĽAVU\n<span>UPRAVIŤ OBJEDNÁVKU</span>",
    class: "upsale-popup-btn want",
    click: function () {
      $overlay.remove();
      $(".upsale-wrap").addClass("active");
    },
  }).appendTo($btnWrap);
  $("<button>", {
    html: "NECHCEM ZĽAVU\n<span>PREJSŤ DO KOŠÍKA</span>",
    class: "upsale-popup-btn dontwant",
    click: function () {
      console.log("click");
      $overlay.remove();
      window.allowDirectAddToCart = true;
      var btns = document.querySelectorAll("button.btn.btn-lg.btn-conversion.add-to-cart-button");
      for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        var style = window.getComputedStyle(btn);
        if (style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null) {
          btn.click();
          break;
        }
      }
      window.location.href = "/kosik/";
    },
  }).appendTo($btnWrap);

  // Odpočet 10 minut
  let timeLeft = 10 * 60;
  function updateTimer() {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    $timer.text(`${min}:${sec}`);
    if (timeLeft > 0) {
      timeLeft--;
      setTimeout(updateTimer, 1000);
    } else {
      $timer.text("00:00");
    }
  }
  updateTimer();
}
