/* Prepinac jazyka — klik na vlajku otvori ponuku jazykov namiesto okamziteho prepnutia.
   Michal 2026-08-27: "v header menu je vlajka ked na nu kliknem chcem vidiet ostatne
   vlajky teda ceskyu a nie aby ma to automaticky preplo na iny jazyk".

   Vlajka je v troch blokoch (#lcd-home, #lcd-rz, #lcd-hdr) a markup vklada az boot,
   preto sa hlada opakovane. Funkcia je idempotentna (data-lcdlang). */

var LCDLANG_SK =
  '<rect width="27" height="6" y="0" fill="#fff"/>' +
  '<rect width="27" height="6" y="6" fill="#0b4ea2"/>' +
  '<rect width="27" height="6" y="12" fill="#ee1c25"/>' +
  '<path d="M4.6 3.2h9.8v6.1c0 3.6-3 5.5-4.9 6.4-1.9-.9-4.9-2.8-4.9-6.4z" fill="#fff"/>' +
  '<path d="M5.8 4.4h7.4v4.9c0 2.9-2.4 4.4-3.7 5.1-1.3-.7-3.7-2.2-3.7-5.1z" fill="#ee1c25"/>' +
  '<path d="M5.8 11.1c1.2-1.5 2.5-1.5 3.7 0 1.2-1.5 2.5-1.5 3.7 0v-1.8c0 2.9-2.4 4.4-3.7 5.1-1.3-.7-3.7-2.2-3.7-5.1z" fill="#0b4ea2"/>' +
  '<path d="M8.8 5.1h1.4v7.2H8.8z" fill="#fff"/>' +
  '<path d="M7.1 6.6h4.8v1.2H7.1z" fill="#fff"/>' +
  '<path d="M6.2 8.9h6.6v1.2H6.2z" fill="#fff"/>';

var LCDLANG_CZ =
  '<rect width="27" height="9" y="0" fill="#fff"/>' +
  '<rect width="27" height="9" y="9" fill="#d7141a"/>' +
  '<path d="M0 0l13.5 9L0 18z" fill="#11457e"/>';

/* Michal 2026-08-28: "problem pri zobrazovani jazyka nieje viditelny, stacia
   vlajky a skratky" — v ponuke je preto len vlajka + SK / CZ, cely nazov
   ostava iba v aria-label pre citacky. */
var LCDLANG_JAZYKY = [
  { kod: "sk", skratka: "SK", nazov: "Slovenčina", url: "https://www.luxurycardesign.sk/", vlajka: LCDLANG_SK },
  { kod: "cz", skratka: "CZ", nazov: "Čeština",    url: "https://www.luxurycardesign.cz/", vlajka: LCDLANG_CZ }
];

function lcdlangSvg(vnutro) {
  return '<svg viewBox="0 0 27 18" aria-hidden="true">' + vnutro + "</svg>";
}

function lcdlangUprav(a) {
  if (a.getAttribute("data-lcdlang")) return;
  a.setAttribute("data-lcdlang", "1");

  var jeCZ = location.hostname.indexOf("luxurycardesign.cz") !== -1;
  var aktualny = jeCZ ? "cz" : "sk";

  var obal = document.createElement("div");
  obal.className = "lcdlang";
  a.parentNode.insertBefore(obal, a);
  obal.appendChild(a);

  /* uz to nie je odkaz na druhy web, ale prepinac */
  a.removeAttribute("href");
  a.setAttribute("role", "button");
  a.setAttribute("tabindex", "0");
  a.setAttribute("aria-haspopup", "true");
  a.setAttribute("aria-expanded", "false");
  a.setAttribute("aria-label", jeCZ ? "Změnit jazyk" : "Zmeniť jazyk");

  var menu = document.createElement("div");
  menu.className = "lcdlang-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  LCDLANG_JAZYKY.forEach(function (j) {
    var p = document.createElement("a");
    p.className = "lcdlang-p" + (j.kod === aktualny ? " je-aktivny" : "");
    p.href = j.url;
    p.setAttribute("role", "menuitem");
    if (j.kod === aktualny) p.setAttribute("aria-current", "true");
    p.setAttribute("aria-label", j.nazov);
    p.title = j.nazov;
    p.innerHTML = lcdlangSvg(j.vlajka) + '<span class="lcdlang-t">' + j.skratka + "</span>";
    menu.appendChild(p);
  });
  obal.appendChild(menu);

  function otvor(stav) {
    menu.hidden = !stav;
    obal.classList.toggle("je-otvoreny", stav);
    a.setAttribute("aria-expanded", stav ? "true" : "false");
  }
  a.addEventListener("click", function (e) {
    e.preventDefault(); e.stopPropagation();
    otvor(menu.hidden);
  });
  a.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otvor(menu.hidden); }
  });
  document.addEventListener("click", function (e) { if (!obal.contains(e.target)) otvor(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") otvor(false); });
}

function lcdlangBoot() {
  [].forEach.call(document.querySelectorAll("a.lang"), lcdlangUprav);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lcdlangBoot);
else lcdlangBoot();
[600, 1500, 3000, 5000].forEach(function (ms) { setTimeout(lcdlangBoot, ms); });
