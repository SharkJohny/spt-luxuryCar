// Panel košíka (ikona košíka v hlavičke) — doplnok k CSS bloku D) v _lcdNativeHdr.scss (Michal 8. 10. 2026, návrh A+).
// Nad natívnym #cart-widget Shoptetu len DOPĹŇA mimo zoznamu (.cart-widget-inner, ten Shoptet pri každom otvorení prepíše AJAXom):
//   hlavičku karty („Váš košík“ + počet položiek [· K ks] + zavrieť), súčet (2+ položky, text z ceny v hlavičke Shoptetu),
//   tichý odkaz „Nakupovať ďalej“, clonu pod kartou (dotyk: ťuk na ňu kartu zavrie a nič pod ňou nespustí),
//   polohu karty pod pásom / plaketou loga / lepkavou lištou (--kw-top), Esc v oboch režimoch, popis koša pre čítačky,
//   pole množstva len na čítanie a na PC skrytie chatu Luxia, len keď by kartu zakryl alebo je väčší ako bublina
//   (uvítanie, ponuka; na dotyku chat skrýva CSS vždy, kým je karta otvorená). Natívny obsah nemaže ani neskrýva.
// Platí len v režime natívnej hlavičky (html.lcd-native-hdr alebo statický koreň [data-lcd-cast]) — inak nič nerobí.
(function init() {
  var d = document, H = d.documentElement;
  if (window.__lcdKosikPanel) return;
  if (!d.body) { d.addEventListener("DOMContentLoaded", init, { once: true }); return; }
  window.__lcdKosikPanel = 1;
  var host = location.hostname;
  if (!/luxurycardesign\.(sk|cz)$/i.test(host)) return;

  var cz = /^cs/i.test(H.lang || "") || /\.cz$/i.test(host);
  var T = cz
    ? { titul: "Váš košík", spat: "Nakupovat dál", suma: "Celkem s DPH", zavriet: "Zavřít košík", odstranit: "Odebrat z košíku", pol: ["položka", "položky", "položek"] }
    : { titul: "Váš košík", spat: "Nakupovať ďalej", suma: "Spolu s DPH", zavriet: "Zavrieť košík", odstranit: "Odstrániť z košíka", pol: ["položka", "položky", "položiek"] };
  var tvar = function (n) { return n === 1 ? T.pol[0] : n >= 2 && n <= 4 ? T.pol[1] : T.pol[2]; };
  var nativna = function () { return H.classList.contains("lcd-native-hdr") || !!d.querySelector("[data-lcd-cast]"); };
  var panel = function () { return d.getElementById("cart-widget"); };
  var otvoreny = function () { return d.body.classList.contains("cart-window-visible"); };
  var nastav = function (el, text) { if (el && el.textContent !== text) el.textContent = text; };
  var ikona = function () { return d.querySelector('#header a[data-target="cart"], #header .navigation-buttons > .cart-count'); };
  // PC = myš a široké okno (rovnaký zlom ako CSS bloku D); inak dotykový režim s clonou
  var PC = window.matchMedia ? matchMedia("(hover:hover) and (pointer:fine) and (min-width:900px)") : { matches: true };

  // zavrieť ako Shoptet (shoptet.popups; shoptet.global.* je zastaraný alias) + upratať stav ikony a fokus
  function zavri(e, klavesnica) {
    if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
    var el = panel(), a = d.activeElement;
    var fokusVKarte = !!(a && el && el.contains(a));
    if (fokusVKarte && a.blur) a.blur();
    var hotovo = false;
    try {
      var sp = window.shoptet;
      if (sp && sp.popups && typeof sp.popups.hideContentWindows === "function") { sp.popups.hideContentWindows(); hotovo = true; }
      else if (sp && sp.global && typeof sp.global.hideContentWindows === "function") { sp.global.hideContentWindows(); hotovo = true; }
    } catch (x) {}
    if (!hotovo || otvoreny()) d.body.classList.remove("cart-window-visible", "user-action-visible");
    d.querySelectorAll('[aria-controls="cart-widget"]').forEach(function (i) { i.setAttribute("aria-expanded", "false"); i.classList.remove("hovered"); });
    var ik = ikona();
    if (ik) ik.classList.remove("hovered");
    // zatvorenie klávesnicou (Esc, Enter na krížiku / odkaze) -> fokus späť na ikonu košíka
    if ((klavesnica || (e && e.detail === 0 && e.type === "click")) && ik && ik.focus) { try { ik.focus({ preventScroll: true }); } catch (x) { ik.focus(); } }
  }
  function cena() {
    var e = d.querySelector('#header [data-testid="headerCartPrice"]');
    var t = e ? e.textContent.replace(/\s+/g, " ").trim() : "";
    return /\d/.test(t) ? t : ""; // prázdny košík: Shoptet tam píše „Košík“
  }
  // karta pod najnižším viditeľným prvkom hore (pás, plaketa loga, lepkavá lišta produktu) + 12 px; nič vidieť = 12 px
  var HORE = [".top-navigation-bar", "#header .site-name", "#js-plugin-header.active", ".plugin-fixed-header.active"];
  function poloha() {
    var el = panel();
    if (!el) return;
    var vh = innerHeight || H.clientHeight, spodok = 0;
    HORE.forEach(function (sel) {
      d.querySelectorAll(sel).forEach(function (x) {
        var r = x.getBoundingClientRect();
        if (!(r.height > 0 && r.bottom > 0 && r.top < vh / 2)) return;
        var cs = getComputedStyle(x);
        if (cs.visibility === "hidden" || cs.display === "none") return;
        if (r.bottom > spodok) spodok = r.bottom;
      });
    });
    var top = Math.round(spodok > 0 ? spodok + 12 : 12) + "px";
    if (el.style.getPropertyValue("--kw-top") !== top) el.style.setProperty("--kw-top", top);
  }
  // chat Luxia (iframe tretej strany): skryť len pri otvorenom košíku a len pri prieniku s kartou alebo keď nie je bublinou
  var sledujem = null, interval = null;
  function luxia() {
    var f = d.querySelector('iframe[title="Luxia chat"]'), el = panel(), skry = false;
    if (f && el && otvoreny() && PC.matches) {
      var a = f.getBoundingClientRect(), b = el.getBoundingClientRect();
      var prienik = a.width > 0 && a.height > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      skry = prienik || a.height > 120;
    }
    if (H.classList.contains("lcd-kw-bez-luxie") !== skry) H.classList.toggle("lcd-kw-bez-luxie", skry);
    if (f && f !== sledujem && window.ResizeObserver) {
      sledujem = f;
      new ResizeObserver(function () { if (otvoreny()) luxia(); }).observe(f);
    }
  }
  function clona(el) {
    var c = el.previousElementSibling;
    if (c && c.classList.contains("lcd-kw-clona")) return;
    c = d.createElement("div");
    c.className = "lcd-kw-clona";
    c.setAttribute("aria-hidden", "true");
    // click = posledná udalosť ťuku -> clona ho celý zachytí, pod ňou sa nič nespustí (galéria, odkazy)
    c.addEventListener("click", zavri);
    el.parentNode.insertBefore(c, el);
  }
  // karta = #cart-widget; Shoptet prepisuje len .cart-widget-inner, naše prvky sú mimo neho a ostávajú
  function dopln() {
    var el = panel();
    if (!el || !nativna()) return;
    clona(el);
    if (el.getAttribute("aria-labelledby") !== "lcd-kw-titul") el.setAttribute("aria-labelledby", "lcd-kw-titul");
    var riadky = el.querySelectorAll('.cart-widget-product[data-micro="cartItem"]'), n = riadky.length, ks = 0;
    // množstvo len na čítanie (zmena je v /kosik/); kôš s popisom pre čítačky; súčet kusov pre „· K ks“
    riadky.forEach(function (r) {
      var a = r.querySelector("input.amount");
      if (a) {
        if (!a.readOnly) a.readOnly = true;
        if (a.tabIndex !== -1) a.tabIndex = -1;
        var q = parseFloat(String(a.value).replace(",", "."));
        ks += q > 0 ? q : 1;
      } else ks += 1;
      r.querySelectorAll(".remove-item").forEach(function (b) { if (!b.getAttribute("aria-label")) b.setAttribute("aria-label", T.odstranit); });
    });
    var hl = el.querySelector(".lcd-kw-hlava");
    if (!hl) {
      hl = d.createElement("div");
      hl.className = "lcd-kw-hlava";
      hl.innerHTML = '<span class="lcd-kw-ikona" aria-hidden="true"></span><div class="lcd-kw-texty"><p id="lcd-kw-titul"></p>' +
        '<p class="lcd-kw-pocet"></p></div><button type="button" class="lcd-kw-x"></button>';
      hl.querySelector("#lcd-kw-titul").textContent = T.titul;
      var x = hl.querySelector(".lcd-kw-x");
      x.setAttribute("aria-label", T.zavriet);
      x.addEventListener("click", zavri);
      el.insertBefore(hl, el.firstChild);
    } else if (hl !== el.firstElementChild) el.insertBefore(hl, el.firstChild);
    nastav(hl.querySelector(".lcd-kw-pocet"), n ? n + " " + tvar(n) + (ks !== n ? " · " + ks + " ks" : "") : "");
    if (el.classList.contains("lcd-kw-viac") !== (n >= 2)) el.classList.toggle("lcd-kw-viac", n >= 2);
    if (el.classList.contains("lcd-kw-prazdny") !== (n === 0)) el.classList.toggle("lcd-kw-prazdny", n === 0);
    var btn = el.querySelector(".cart-widget-button"), su = el.querySelector(".lcd-kw-suma"), sp = el.querySelector(".lcd-kw-spat");
    var c = n >= 2 ? cena() : "";
    if (c && btn) {
      if (!su) {
        su = d.createElement("div"); su.className = "lcd-kw-suma";
        su.innerHTML = "<span></span><strong></strong>"; su.firstChild.textContent = T.suma;
      }
      if (su.nextElementSibling !== btn) btn.parentNode.insertBefore(su, btn);
      nastav(su.lastChild, c);
    } else if (su) su.remove();
    if (!sp) {
      sp = d.createElement("button"); sp.type = "button"; sp.className = "lcd-kw-spat"; sp.textContent = T.spat;
      sp.addEventListener("click", zavri);
    }
    if (el.lastElementChild !== sp) el.appendChild(sp);
  }
  function priOtvoreni() { poloha(); dopln(); luxia(); }
  var neskor = function () { setTimeout(function () { if (otvoreny()) priOtvoreni(); else dopln(); }, 0); };
  d.addEventListener("ShoptetDOMCartContentLoaded", neskor);
  d.addEventListener("ShoptetCartUpdated", neskor);
  // otvorenie / zatvorenie = trieda na body; MutationObserver beží pred vykreslením -> karta neskáče
  var bolOtvoreny = otvoreny();
  new MutationObserver(function () {
    var o = otvoreny();
    if (o === bolOtvoreny) return;
    bolOtvoreny = o;
    if (o) {
      priOtvoreni();
      if (!interval) interval = setInterval(function () { if (otvoreny()) luxia(); }, 700);
    } else {
      H.classList.remove("lcd-kw-bez-luxie");
      if (interval) { clearInterval(interval); interval = null; }
    }
  }).observe(d.body, { attributes: true, attributeFilter: ["class"] });
  var cp = d.querySelector('#header [data-testid="headerCartPrice"]');
  if (cp) new MutationObserver(function () { if (otvoreny()) dopln(); }).observe(cp, { childList: true, characterData: true, subtree: true });
  d.addEventListener("keydown", function (e) { if ((e.key === "Escape" || e.key === "Esc") && otvoreny() && nativna()) zavri(null, true); });
  addEventListener("resize", function () { if (otvoreny()) { poloha(); luxia(); } });
  // PC režim nemá zámok rolovania: pri posune stránky drž kartu pod hlavičkou
  addEventListener("scroll", function () { if (otvoreny()) poloha(); }, { passive: true });
  if (panel()) dopln();
  if (otvoreny()) priOtvoreni();
})();
