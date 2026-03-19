const PHONE_LABELS = {
  cs: {
    label: "Mobilní telefon",
    placeholder: "+420 900 000 000",
    error: "Vyplňte telefonní číslo",
    messagePrefix: "Telefon",
  },
  sk: {
    label: "Mobilný telefón",
    placeholder: "+421 900 000 000",
    error: "Vyplňte telefónne číslo",
    messagePrefix: "Telefón",
  },
};

const DEFAULT_LANG = "sk";

export function initContactForm() {
  const $form = $("#formContact");
  if (!$form.length) return;

  const shoptetLang =
    window.dataLayer?.find((item) => item.shoptet?.language)?.shoptet?.language ??
    document.documentElement.lang?.slice(0, 2).toLowerCase();
  const lang = shoptetLang?.slice(0, 2).toLowerCase();
  const t = PHONE_LABELS[lang] ?? PHONE_LABELS[DEFAULT_LANG];

  const $phoneWrapper = $(`
    <div class="form-group lc-phone-wrapper" id="lc-phone-wrapper">
      <label for="lcPhone"><span class="required-asterisk">${t.label}</span></label>
      <input type="tel" id="lcPhone" class="form-control" autocomplete="tel" placeholder="${t.placeholder}" />
      <span class="lc-phone-error">${t.error}</span>
    </div>
  `);
  $form.find("#email").closest(".form-group").after($phoneWrapper);

  $(document).on("input", "#lcPhone", function () {
    if ($(this).val().trim()) {
      $("#lc-phone-wrapper").removeClass("lc-phone-invalid");
    }
  });

  $form[0].addEventListener(
    "submit",
    function (e) {
      const phone = document.getElementById("lcPhone").value.trim();
      if (!phone) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $("#lc-phone-wrapper").addClass("lc-phone-invalid");
        document.getElementById("lcPhone").focus();
        const top = $("#lc-phone-wrapper").offset().top - 120;
        $("html, body").animate({ scrollTop: top }, 300);
        return;
      }
      const $message = $form.find('textarea[name="message"]');
      const original = $message.val().trim();
      $message.val(t.messagePrefix + ": " + phone + (original ? "\n\n" + original : ""));
    },
    true
  );
}
