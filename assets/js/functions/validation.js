/**
 * validation.js — zredukovane na JEDINU zodpovednost: popup "vyberte model".
 *
 * Cely scroll + sekvencna verifikacia konfiguratora bol presunuty do
 * `functions/configuratorEngine.js`. Tu ostava len `.content-wrap` click
 * handler ktory ukaze popup ked uzivatel klikne do konfiguratora bez
 * vybraneho auta, a samotny `createpopup`.
 */
export function validation(texts) {
  $(".content-wrap").on("click", function (event) {
    if ($(event.target).closest(".modl-selector-wrap").length) {
      return;
    }
    // Nový vzhľad 1V (body.lcd-1v, ?novy=1; Michal 16. 10. 2026): karta „Vaše auto“ je miesto, kde sa auto vyberá —
    // volant, miesta, dvere a polia auta idú v ľubovoľnom poradí. Klik v nej bez auta výzvu neukáže a dlaždicu po 1 s
    // neodznačí (inak zmizli zvolené dvere/miesta). Chýbajúce polia zvýrazní až „Pokračujte ďalej“ (configuratorEngine.js
    // .lcd-needs-fill -> červený rám a polia v konfigurator1v/kroky.js). Bez flagu bez zmeny.
    if (document.body.classList.contains("lcd-1v") && $(event.target).closest(".lcd1v-k-auto").length) {
      return;
    }
    const model = sessionStorage.getItem("model");
    if (
      !model ||
      (model && (model.includes("Značka") || model.trim() === "Model" || model.includes("Rok v\xFDroby") || model.includes("Typ auta")))
    ) {
      const name = $("h1").text();
      if (name.includes("box") || name.includes("Boxy")) {
        return;
      }
      createpopup(texts);
      setTimeout(() => {
        $(event.target).closest(".button.option-button").removeClass("active");
      }, 1e3);
      $(".image-wrap").remove();
    }
  });
}

function createpopup(texts) {
  if ($(".overflow")[0]) return;
  const overflow = $("<div>", {
    class: "overflow",
    style: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(3px);
    `,
  }).appendTo("body");

  const popup = $("<div>", {
    style: `
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      max-width: 450px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: fadeIn 0.3s ease-out;
    `,
  }).appendTo(overflow);

  $("<h3>", {
    text: texts.no_model_select,
    style: `
      margin-bottom: 30px;
      font-size: 22px;
      color: #333;
      font-weight: 500;
      line-height: 1.4;
    `,
  }).appendTo(popup);

  $("<button>", {
    text: texts.i_understand,
    class: "btn",
    style: `
      padding: 12px 40px;
      font-size: 16px;
      border: none;
      border-radius: 6px;
      background: #c49b31;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
      font-weight: 500;
      &:hover {
        background: #c49b31;
      }
    `,
    click: function () {
      $(".overflow").remove();
      overflow.fadeOut(200, function () {
        $(this).remove();

        let scrollselector = ".col-xs-12.col-lg-6.p-info-wrapper";
        if ($("body").hasClass("mobile")) {
          scrollselector = ".p-thumbnails-wrapper";
        }
        // Zobrazit model selector bez scrollování
        $("#model-selector").fadeIn(200);
        $(".position-wrap.parameter-cars.parameter-wrap.base-config.active").removeClass("active");
        $(".position-wrap.parameter-cars.parameter-wrap.base-config:eq(1)").addClass("active");
      });
      $("#model-selector").addClass("errorToCart");

      setTimeout(() => {
        $("#model-selector").removeClass("errorToCart");
      }, 2000);
    },
  }).appendTo(popup);

  // Add animation keyframes
  $("<style>")
    .text(
      `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
    )
    .appendTo("head");
}
