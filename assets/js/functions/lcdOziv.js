/* Režim „oživ existujúci DOM“ (web bez prekrývania, 10/2026).

   Obsah titulky, rozcestníka a menu prichádza v HTML zo Shoptet adminu
   (bannery, popis stránky). Každý taký kus je STATICKÝ KOREŇ s atribútom
   data-lcd-cast:
     hp-vrch, hp-telo-1, hp-telo-2 …  titulka (#lcd-home, #lcd-home-2, #lcd-home-3)
     rz                                 rozcestník (#lcd-rz)
     mega                               menu z banneru 172 / 108 (#mega)
   Keď statický koreň na stránke je, JS NIKDY nekreslí, neskrýva ani neprekrýva,
   len oživí (animácie, konfigurátor, menu). Keď nie je, lcdHome / lcdRz / lcdHdr
   kreslia ako doteraz (prechodné obdobie, kým sa admin neprepne).

   Hlavička: natívna hlavička Shoptetu je v platnosti, keď má <html> triedu
   lcd-native-hdr (nastaví ju riadok v HTML kódoch Záhlavia) alebo keď je na stránke
   ktorýkoľvek statický koreň. lcdHdr vtedy vlastnú hlavičku nekreslí. */

/* všetky statické korene danej časti v poradí dokumentu
   ("hp" = hp-vrch, hp-telo-1…; "rz" = rz; "mega" = mega) */
export function lcdKorene(cast) {
  var vsetky = document.querySelectorAll("[data-lcd-cast]");
  var out = [];
  for (var i = 0; i < vsetky.length; i++) {
    var c = vsetky[i].getAttribute("data-lcd-cast") || "";
    if (c === cast || c.indexOf(cast + "-") === 0) out.push(vsetky[i]);
  }
  return out;
}

/* Jeden logický koreň nad viacerými bannermi (#lcd-home, #lcd-home-2 …).
   Má presne tie metódy, ktoré oživovací kód volá na koreni; querySelectorAll
   vracia pole (forEach, length, [].slice.call fungujú rovnako ako pri NodeList). */
export function lcdMultiKoren(korene) {
  return {
    korene: korene,
    jeMulti: true,
    querySelector: function (sel) {
      for (var i = 0; i < korene.length; i++) {
        if (korene[i].matches && korene[i].matches(sel)) return korene[i];
        var x = korene[i].querySelector(sel);
        if (x) return x;
      }
      return null;
    },
    querySelectorAll: function (sel) {
      var out = [];
      for (var i = 0; i < korene.length; i++) {
        var n = korene[i].querySelectorAll(sel);
        for (var j = 0; j < n.length; j++) out.push(n[j]);
      }
      return out;
    },
    addEventListener: function (t, fn, o) {
      korene.forEach(function (k) { k.addEventListener(t, fn, o); });
    },
    appendChild: function (el) { return korene[0].appendChild(el); },
    contains: function (el) {
      return korene.some(function (k) { return k.contains(el); });
    },
  };
}

/* Poistka v HTML kódoch Záhlavia (lcdh-early / lcdrz-early) schová hlavičku a obsah,
   kým JS nenakreslí novú titulku, a odoberie sa sama len vtedy, keď #lcd-home / #lcd-rz
   NEexistuje. So statickým koreňom by ostala navždy (kritik, blocker 2) — preto ju
   pri statickom koreni odoberá JS. */
export function lcdOdoberPoistku(trieda) {
  try { document.documentElement.classList.remove(trieda); } catch (e) {}
}

/* true = natívna hlavička Shoptetu (lcdHdr nekreslí vlastnú) */
export function lcdNativnaHlavicka() {
  var h = document.documentElement;
  if (h.classList.contains("lcd-native-hdr")) return true;
  return !!document.querySelector("[data-lcd-cast]");
}

/* Reveal bez zmiznutia: všetko, čo je vo výreze alebo nad ním (top < innerHeight),
   dostane .on ešte PRED triedou html.lcd-anim. Animácia (opacity 0 → 1) sa tak týka
   len obsahu pod ohybom, ktorý ešte nikto nevidel. Vracia prvky, ktoré treba
   sledovať IntersectionObserverom. */
export function lcdRevealOznacVidene(els) {
  var vh = window.innerHeight || document.documentElement.clientHeight || 0;
  var zvysok = [];
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (el.classList.contains("on")) continue;
    var top = 0;
    try { top = el.getBoundingClientRect().top; } catch (e) { top = 0; }
    if (top < vh) el.classList.add("on");
    else zvysok.push(el);
  }
  return zvysok;
}

export function lcdAnimZapni() {
  document.documentElement.classList.add("lcd-anim");
}

/* Prechod: kým titulka / rozcestník kreslia vlastnú hlavičku s menu a na stránke už
   je statický #mega z banneru, id v kreslenom markupe sa premenujú — inak by na stránke
   boli dve #mega, #megaOvl, #megaX. Štýly idú cez triedy (.mega, .mega-ovl, .m-x),
   takže vzhľad sa nemení. */
export function lcdPremenujMegu(root, prefix) {
  if (!root || !document.querySelector('[data-lcd-cast="mega"]')) return false;
  var zmena = false;
  ["mega", "megaOvl", "megaX"].forEach(function (id) {
    var el = root.querySelector("#" + id);
    if (el) { el.id = prefix + id; zmena = true; }
  });
  [].forEach.call(root.querySelectorAll('[aria-controls="mega"]'), function (el) {
    el.setAttribute("aria-controls", prefix + "mega");
  });
  return zmena;
}

/* Statický #mega (banner 172 SK / 108 CZ). Zobrazenie rieši CSS cez stav Shoptetu
   body.navigation-window-visible (natívny burger ho nastaví sám, aj na dotyk —
   main-3g.js robí na touchend preventDefault, preto žiadny vlastný click interceptor).
   JS len doplní: Esc, zatvorenie (krížik, prekrytie, klik na odkaz) cez
   shoptet.menu.hideNavigation() a zahriatie lazy obrázkov pred otvorením. */
var NAV_TRIEDA = "navigation-window-visible";

export function lcdMegaZavri() {
  try {
    if (window.shoptet && window.shoptet.menu && typeof window.shoptet.menu.hideNavigation === "function") {
      window.shoptet.menu.hideNavigation();
      return;
    }
  } catch (e) {}
  document.body.classList.remove("user-action-visible", "submenu-visible", NAV_TRIEDA);
}

export function lcdMegaOziv(mega) {
  if (!mega || mega.__lcdOziv) return;
  mega.__lcdOziv = true;
  /* Lenis (PC) by inak zobral koliesko sebe a menu by sa neposunulo */
  mega.setAttribute("data-lenis-prevent", "");

  var zohriate = false;
  function zohrej() {
    if (zohriate) return; zohriate = true;
    [].forEach.call(mega.querySelectorAll('img[loading="lazy"]'), function (im) { im.loading = "eager"; });
  }
  function otvorene() { return document.body.classList.contains(NAV_TRIEDA); }

  /* natívny burger Shoptetu (aj prípadný vlastný v banneri) — obrázky sa začnú
     sťahovať už pri dotyku / nabehnutí, nie až po otvorení */
  var BURGER = '.toggle-window[data-target="navigation"], [data-target="navigation"], #burg';
  ["pointerdown", "touchstart", "mouseover", "focusin"].forEach(function (t) {
    document.addEventListener(t, function (e) {
      if (zohriate) return;
      var c = e.target && e.target.closest ? e.target.closest(BURGER) : null;
      if (c) zohrej();
    }, { passive: true, capture: true });
  });
  /* otvorenie inou cestou (klávesnica, iný skript) — zahrej hneď, ako sa stav zmení */
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (otvorene()) { zohrej(); mo.disconnect(); }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && otvorene()) lcdMegaZavri();
  });
  /* krížik a prekrytie: v banneri ako .m-x / #megaX a .mega-ovl / #megaOvl,
     prípadne čokoľvek s data-lcd-mega-zavri */
  var ZAVRI = '.m-x, #megaX, [data-lcd-mega-zavri]';
  mega.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(ZAVRI)) { lcdMegaZavri(); return; }
    var a = t.closest("a[href]");
    /* odkaz (aj kotva na tej istej stránke): menu sa zavrie, ako v kreslenom menu.
       Výnimka: prepínače podmenu (href="#", aria-expanded, role=button) */
    if (a && a.getAttribute("href") !== "#" && !a.hasAttribute("aria-expanded") &&
        a.getAttribute("role") !== "button") lcdMegaZavri();
  });
  [].forEach.call(document.querySelectorAll('#megaOvl, .mega-ovl[data-lcd-cast], [data-lcd-cast="mega"] ~ .mega-ovl'), function (ovl) {
    if (ovl.__lcdOziv || (ovl.closest && ovl.closest("#lcd-home, #lcd-rz, #lcd-hdr"))) return;
    ovl.__lcdOziv = true;
    ovl.addEventListener("click", lcdMegaZavri);
  });
}
