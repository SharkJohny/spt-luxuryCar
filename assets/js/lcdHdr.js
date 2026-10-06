/* GENEROVANE gen-lcdhdr-bundle.py - globalna dizajnova hlavicka pre cely SK e-shop.
   HP (in-index) a rozcestnik (in-rozcestnik) maju hlavicku vo vlastnom bloku - tam sa nevklada.

   Web bez prekrývania (10/2026): keď je hlavička natívna (html.lcd-native-hdr alebo
   na stránke je statický koreň [data-lcd-cast], napr. #mega z banneru 172 / 108),
   vlastná hlavička sa NEKRESLÍ — len sa oživí statické menu #mega (functions/lcdOziv.js).
   Bez statického koreňa a bez triedy kreslí ako doteraz (prechodné obdobie). */
import { LCDHDR_MARKUP, LCDHDR_MARKUP_CZ } from "./lcdHdr-markup.js";
import { lcdKorene, lcdMegaOziv, lcdNativnaHlavicka } from "./functions/lcdOziv.js";

function lcdhdrBoot() {
  var lcdhdrCZ = location.hostname.indexOf("luxurycardesign.cz") !== -1;
  if (location.hostname.indexOf("luxurycardesign.sk") === -1 && !lcdhdrCZ) return;
  var b = document.body;
  if (!b) return;
  /* statické menu z banneru oživ na každej stránke (aj na titulke a rozcestníku) */
  lcdKorene("mega").forEach(function (m) {
    try { lcdMegaOziv(m); } catch (e) {}
  });
  /* titulka a rozcestník: natívna hlavička až keď je statický koreň danej stránky
     (kým ich kreslí JS, majú vlastnú .hdr a natívnu skrýva ich gate) */
  var naHP = b.classList.contains("in-index"), naRz = b.classList.contains("in-rozcestnik");
  var nativna = naHP ? lcdKorene("hp").length > 0
              : naRz ? lcdKorene("rz").length > 0
              : lcdNativnaHlavicka();
  /* poistka: trieda býva v HTML kódoch Záhlavia; keď tam chýba, doplní ju JS,
     aby platili štýly natívnej hlavičky */
  if (nativna) document.documentElement.classList.add("lcd-native-hdr");
  if (naHP || naRz) return;
  if (document.getElementById("lcd-hdr")) return;
  if (nativna) return;
  var host = document.querySelector(".overall-wrapper") || b;
  var root = document.createElement("div");
  root.id = "lcd-hdr";
  root.innerHTML = lcdhdrCZ ? LCDHDR_MARKUP_CZ : LCDHDR_MARKUP;
  host.insertBefore(root, host.firstChild);
  var st = document.createElement("style");
  st.id = "lcdhdr-gate";
  st.textContent =
    "body.lcdhdr-on #header," +
    "body.lcdhdr-on .top-navigation-bar{display:none !important}" +
    "body.lcdhdr-on .overall-wrapper{overflow:clip}" +
    "#lcd-hdr .hdr{position:sticky;top:0}";
  document.head.appendChild(st);
  b.classList.add("lcdhdr-on");
  var bg = document.getElementById("burg"), mega = document.getElementById("mega"),
      ovl = document.getElementById("megaOvl"), mx = document.getElementById("megaX");
  function megaSet(o) {
    mega.classList.toggle("open", o); ovl.classList.toggle("open", o);
    bg.setAttribute("aria-expanded", o ? "true" : "false");
    document.body.style.overflow = o ? "hidden" : "";
    /* Lenis inak zoberie koliesko sebe a menu sa neposunie (len PC) */
    mega.setAttribute("data-lenis-prevent", "");
  }
  /* S10: obrazky v #mega su lazy (zatvorene menu nic nestahuje). Pri prvom dotyku / nabehnuti /
     fokuse na burger ich prepneme na eager — stahuju sa uz pocas kliku, nie az po otvoreni. */
  var megaZohriate = false;
  function megaZohrej() {
    if (megaZohriate || !mega) return; megaZohriate = true;
    [].forEach.call(mega.querySelectorAll('img[loading="lazy"]'), function (im) { im.loading = "eager"; });
  }
  if (bg) ["pointerdown", "touchstart", "mouseenter", "focus"].forEach(function (t) {
    bg.addEventListener(t, megaZohrej, { passive: true });
  });
  if (bg) bg.addEventListener("click", function () { megaZohrej(); megaSet(!mega.classList.contains("open")); });
  if (ovl) ovl.addEventListener("click", function () { megaSet(false); });
  if (mx) mx.addEventListener("click", function () { megaSet(false); });
  if (mega) [].forEach.call(mega.querySelectorAll("a"), function (a2) {
    a2.addEventListener("click", function () { megaSet(false); });
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lcdhdrBoot);
else lcdhdrBoot();
