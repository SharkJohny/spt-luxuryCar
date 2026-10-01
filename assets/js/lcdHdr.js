/* GENEROVANE gen-lcdhdr-bundle.py - globalna dizajnova hlavicka pre cely SK e-shop.
   HP (in-index) a rozcestnik (in-rozcestnik) maju hlavicku vo vlastnom bloku - tam sa nevklada. */
import { LCDHDR_MARKUP, LCDHDR_MARKUP_CZ } from "./lcdHdr-markup.js";

function lcdhdrBoot() {
  var lcdhdrCZ = location.hostname.indexOf("luxurycardesign.cz") !== -1;
  if (location.hostname.indexOf("luxurycardesign.sk") === -1 && !lcdhdrCZ) return;
  var b = document.body;
  if (!b || b.classList.contains("in-index") || b.classList.contains("in-rozcestnik")) return;
  if (document.getElementById("lcd-hdr")) return;
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
  if (bg) bg.addEventListener("click", function () { megaSet(!mega.classList.contains("open")); });
  if (ovl) ovl.addEventListener("click", function () { megaSet(false); });
  if (mx) mx.addEventListener("click", function () { megaSet(false); });
  if (mega) [].forEach.call(mega.querySelectorAll("a"), function (a2) {
    a2.addEventListener("click", function () { megaSet(false); });
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lcdhdrBoot);
else lcdhdrBoot();
