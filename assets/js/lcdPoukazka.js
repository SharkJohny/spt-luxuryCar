/* Darčeková poukážka (SK) / Dárkový poukaz (CZ) — stránka podľa návrhu z 3. 10. 2026.
   Produkt v Shoptete má 15 variantov: SK POUKAZKA-100 … POUKAZKA-800 (po 50 €),
   CZ POUKAZ-2500 … POUKAZ-20000 (po 1 250 Kč). Kód a PDF posiela automat Jána Kučeru.
   Tu len rozpoznáme stránku poukážky (podľa kódu produktu) a načítame jej vlastné
   štýly a skript (assets/poukazka/pk.css + pk.js / pk-cz.js, generuje tools/extract-lcd-pk.py),
   aby ostatné stránky webu nemuseli sťahovať nič navyše. */

var LOKAL = location.hostname === "127.0.0.1" || location.hostname === "localhost";
var CZ = location.hostname.indexOf("luxurycardesign.cz") !== -1 || (LOKAL && /[?&]pkcz=1/.test(location.search));
var ZAKLAD = LOKAL ? "/poukazka/" : "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/poukazka/";

function jePoukazka() {
  var b = document.body;
  if (!b || !b.classList.contains("type-detail")) return false;
  var sku = document.querySelector('meta[itemprop="sku"]');
  return !!(sku && /^POUKAZ/.test(sku.getAttribute("content") || ""));
}

function verzia() {
  var s = document.querySelector('script[src*="luxuryCar.js"]');
  var m = s && /[?&]v=([^&#]+)/.exec(s.src);
  return m ? m[1] : "1";
}

/* Po vložení do košíka ide zákazník rovno do košíka (pk.js nastaví značku lcdPkDoKosika a presmeruje).
   Shoptet po vložení stránku obnovuje a mohol by presmerovanie prebiť — preto značka: na ktorejkoľvek
   stránke sa zmaže a na stránke poukážky (obnovenej Shoptetom) ešte presmeruje do košíka. */
function chceDoKosika() {
  try {
    var t = +sessionStorage.getItem("lcdPkDoKosika");
    if (t) sessionStorage.removeItem("lcdPkDoKosika");
    return !!t && Date.now() - t < 30000;
  } catch (e) { return false; }
}

function lcdPoukazkaBoot() {
  var doKosika = chceDoKosika();
  if (window.__LCD_PK__ || !jePoukazka()) return;
  if (doKosika) {
    document.documentElement.classList.add("lcd-pk-cakam");
    location.replace("/kosik/");
    return;
  }
  window.__LCD_PK__ = CZ
    ? { kod: "POUKAZ-", kosikUrl: "/kosik/", textPridavam: "Vkládám do košíku…", textPridane: "Vloženo do košíku ✓",
        textChyba: "Nepodařilo se, zkuste znovu", textVKosiku: "Poukaz v hodnotě %s je v košíku", textDoKosika: "Přejít do košíku" }
    : { kod: "POUKAZKA-", kosikUrl: "/kosik/", textPridavam: "Vkladám do košíka…", textPridane: "Vložené do košíka ✓",
        textChyba: "Nepodarilo sa, skúste znova", textVKosiku: "Poukážka v hodnote %s je v košíku", textDoKosika: "Prejsť do košíka" };
  var html = document.documentElement;
  html.classList.add("lcd-pk-cakam");
  var v = verzia();
  var l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = ZAKLAD + "pk.css?v=" + v;
  document.head.appendChild(l);
  var s = document.createElement("script");
  s.src = ZAKLAD + (CZ ? "pk-cz.js" : "pk.js") + "?v=" + v;
  s.onerror = function () { html.classList.remove("lcd-pk-cakam"); };
  document.body.appendChild(s);
  /* poistka: keď sa nová stránka do 8 s nepostaví, ukáž pôvodný produkt Shoptetu */
  setTimeout(function () {
    if (!document.getElementById("lcd-pk")) html.classList.remove("lcd-pk-cakam");
  }, 8000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lcdPoukazkaBoot);
else lcdPoukazkaBoot();
