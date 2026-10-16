/** Konfigurátor — tok krokov: model, verifikácia, scroll, handlery. */

// export: aj pre nový konfigurátor 1V (components/konfigurator1v/ctx.js) — správanie bez zmeny
export function lcdGetSteps() {
  var steps = [];
  document
    .querySelectorAll(".content-wrap > .position-wrap, .content-wrap > .parameter-wrap")
    .forEach(function (el) { steps.push(el); });
  var trunk = document.querySelector(".upsale-buttons.trunk");
  if (trunk) steps.push(trunk);
  var boxs = document.querySelector(".upsale-buttons.boxs");
  if (boxs) steps.push(boxs);
  return steps;
}

export function lcdStepFilled(stepEl) {
  var $s = $(stepEl);
  // Kroky trunk (autokoberce do kufra) a boxs (boxy) su NEPOVINNE.
  // Cislo kroku K4/K5/K6 zavisi od produktu (BASIC vs ELITE),
  // preto detekujeme cez selektor, nie index. Ak zakaznik nevybere,
  // automaticky to znamena "nechcem" — krok je platny.
  if ($s.hasClass("trunk") || $s.hasClass("boxs") ||
      $s.is(".upsale-buttons.trunk") || $s.is(".upsale-buttons.boxs")) {
    return true;
  }
  // Krok "Specifikace vozidla" — vsetky car dropdowny musia mat realny
  // vyber. Placeholder = selectedIndex 0. sessionStorage.model moze byt
  // staly po reloade, preto kontrolujeme priamo dropdowny (zdroj pravdy).
  if ($s.find(".wheel-Position").length) {
    var lcdPlaceholders = ["Značka", "Model", "Rok výroby", "Typ auta",
                           "Značka", "Ročník", "Typ"];
    var carOk = true;
    $s.find("select").each(function () {
      var opt = this.options[this.selectedIndex];
      var txt = (opt ? opt.text : "").replace(/\s+/g, " ").trim();
      if (!txt || lcdPlaceholders.indexOf(txt) > -1) carOk = false;
    });
    if (!carOk) return false;
  }
  var hasControl = false, picked = false;
  if ($s.find(".option-button").length) {
    hasControl = true;
    if ($s.find(".option-button.active").length) picked = true;
  }
  if ($s.find(".upsale-button").length) {
    hasControl = true;
    if ($s.find(".upsale-button.active").length) picked = true; // NECHCI sa pocita
  }
  if ($s.find("select.surcharge-parameter").length) {
    hasControl = true;
    $s.find("select.surcharge-parameter").each(function () {
      var v = $(this).val();
      if (v && v !== "0" && v !== "") picked = true;
    });
  }
  if ($s.find("input[type='radio'], input[type='checkbox']").length) {
    hasControl = true;
    if ($s.find("input[type='radio']:checked, input[type='checkbox']:checked").length) picked = true;
  }
  return !hasControl || picked;
}

var lcdScroll = { token: 0, priority: false };

function lcdHeaderH() {
  var sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (var i = 0; i < sels.length; i++) {
    var e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20) return e.offsetHeight;
  }
  return 90;
}

function lcdDesiredY(el) {
  // Zarovnaj VRCH kroku tesne pod header (nie centrovanie — to robilo velke
  // posuny hore-dole a posobilo "skakavo"). Konzistentny maly pohyb.
  var hH = lcdHeaderH();
  var r = el.getBoundingClientRect();
  return Math.max(0, Math.round(window.scrollY + r.top - hH - 16));
}

/** Krok je v "pohodlnej zone" viewportu — nescrolluj vobec. */
function lcdStepComfortable(el) {
  var vh = window.innerHeight || document.documentElement.clientHeight || 0;
  var hH = lcdHeaderH();
  var r = el.getBoundingClientRect();
  // vrch kroku medzi headerom a ~45 % viewportu => uzivatel krok vidi
  return r.top >= hH - 8 && r.top <= hH + (vh - hH) * 0.45;
}

/**
 * Nový vzhľad 1V (body.lcd-1v, Michal 16. 10. 2026: „zvýrazni, čo nevybral“): verifikácia karty auta posúva na PRVÉ
 * PRÁZDNE POLE auta (červené .lcd1v-pole z konfigurator1v/kroky.js), nie na vrch karty — na nízkom telefóne by spodné
 * pole (Typ karosérie) ostalo pod okrajom. Prázdne = rovnaké pravidlo ako kroky.js prazdnePole. Bez 1V vždy null.
 */
function lcd1vPrvePrazdnePole(el) {
  if (!document.body.classList.contains("lcd-1v") || !el.classList || !el.classList.contains("lcd1v-k-auto")) return null;
  var sels = el.querySelectorAll(".lcd1v-pole select");
  for (var i = 0; i < sels.length; i++) {
    var o = sels[i].options[sels[i].selectedIndex];
    if (!o || sels[i].selectedIndex < 0 || o.classList.contains("notselect") || !String(o.text || "").trim()) {
      return sels[i].closest(".lcd1v-pole") || sels[i];
    }
  }
  return null;
}

/** Cieľ verifikačného posunu je v pohodlnej zóne: krok (vrch, ako doteraz) alebo pole 1V (celé pod hlavičkou). */
function lcdCielPohodlny(el) {
  var pole = lcd1vPrvePrazdnePole(el);
  if (!pole) return lcdStepComfortable(el);
  var vh = window.innerHeight || document.documentElement.clientHeight || 0;
  var r = pole.getBoundingClientRect();
  return r.top >= lcdHeaderH() - 8 && r.bottom <= vh - 8;
}

/** Cieľová pozícia verifikačného posunu: vrch kroku, v 1V karte auta vrch prvého prázdneho poľa. */
function lcdCielY(el) {
  return lcdDesiredY(lcd1vPrvePrazdnePole(el) || el);
}

/**
 * Vycentruje krok na stred. isVerify=true => priorita.
 * Pocka kym sa layout ustali, potom INSTANTNE skoci (CSS scroll-behavior:smooth
 * by inak animoval kazdy scrollTo a vznikol by 2s "skakajuci" efekt).
 * Max 3 instantne scrolly, rozlozene v case — ziadne tesne hamranie.
 */
function lcdScrollToStep(el, isVerify) {
  if (!el) return;
  // Auto-scroll pri vyberoch VYPNUTY na desktope AJ mobile. Na mobile settle()
  // smycka (poll layoutu / 60ms) + smooth scrollTo + korekcia po 700ms bojovali
  // s prebiehajucim reflowom (lazy obrazky, 600ms enhance interval) — viewport
  // opakovane popojizdel a cely konfigurator sa "trasol". Scrolluje sa uz LEN
  // verifikacia (skok na chybajuci krok pri Pridat do kosika).
  var lcdIsMobile = window.matchMedia("(max-width: 768px)").matches;
  if (!isVerify) return;
  if (lcdScroll.priority && !isVerify) return; // verifikacny scroll ma prednost
  // ANTI-DRIFT + POHODLNA ZONA: ak krok uz vidno v hornej casti viewportu,
  // NESCROLLUJ vobec — kazdy zbytocny scroll = "skakanie".
  if (lcdCielPohodlny(el)) return;
  if (Math.abs(window.scrollY - lcdCielY(el)) < 100) return;
  if (isVerify) lcdScroll.priority = true;
  var myToken = ++lcdScroll.token;
  var aborted = false;
  function onUser() { aborted = true; }
  window.addEventListener("wheel", onUser, { passive: true });
  window.addEventListener("touchmove", onUser, { passive: true });
  window.addEventListener("keydown", onUser, { passive: true });
  function done() {
    window.removeEventListener("wheel", onUser);
    window.removeEventListener("touchmove", onUser);
    window.removeEventListener("keydown", onUser);
    if (lcdScroll.token === myToken) lcdScroll.priority = false;
  }
  function alive() {
    return myToken === lcdScroll.token && !aborted && el.isConnected;
  }
  // 1) Kratke pockanie na ustalenie layoutu (accordion transition ~300ms),
  //    potom JEDEN plynuly (smooth) scroll — ziadne instant teleporty.
  //    Povodne: az 1.4s cakania + instant skok + druhy instant skok = "kostrbate".
  var lastAbs = null, stable = 0, waited = 0;
  function settle() {
    if (!alive()) { done(); return; }
    var abs = window.scrollY + el.getBoundingClientRect().top;
    if (lastAbs !== null && Math.abs(abs - lastAbs) < 2) stable++;
    else stable = 0;
    lastAbs = abs;
    waited += 60;
    if (stable >= 3 || waited >= 800) {
      if (lcdCielPohodlny(el)) { done(); return; }
      // PC: ziadna posuvacia animacia — jeden okamzity skok (len verifikacia).
      // Mobil: smooth (posun je velky, instant by dezorientoval).
      var lcdBehavior = lcdIsMobile ? "smooth" : "instant";
      window.scrollTo({ top: lcdCielY(el), behavior: lcdBehavior });
      // Jedina korekcia — len pri VELKOM neskorom reflowe (obrazky).
      setTimeout(function () {
        if (alive()) {
          var w1 = lcdCielY(el);
          if (Math.abs(window.scrollY - w1) > 150 && !lcdCielPohodlny(el)) {
            window.scrollTo({ top: w1, behavior: lcdBehavior });
          }
        }
        done();
      }, 700);
    } else {
      setTimeout(settle, 60);
    }
  }
  settle();
}

function lcdResetOptionsWrap($s) {
  $s.find("> .options-wrap").each(function () {
    this.style.maxHeight = ""; this.style.overflow = "";
    this.style.opacity = ""; this.style.padding = "";
  });
}

/**
 * Nastavi cielovu vysku akordeonu podla skutocneho obsahu. Pevnych 1000px
 * sposobovalo, ze kratke kroky sa otvarali rychlo a dlhe viditelne trhali.
 */
function lcdMeasureStep(el) {
  if (!el || !el.isConnected) return;
  var height = Math.max(50, el.scrollHeight);
  // Zapíš LEN pri reálnej zmene (>2px). Bez tejto poistky sa ResizeObserver
  // (nižšie) zacyklil: measure → zmena --lcd-step-open-height → max-height →
  // resize kroku → observer → measure … Na mobile to spolu so scroll-anchoringom
  // rozkmitalo celý konfigurátor (najmä otvorenú "Specifikáciu vozidla").
  var prev = parseInt(el.style.getPropertyValue("--lcd-step-open-height"), 10);
  if (!isNaN(prev) && Math.abs(prev - height) <= 2) return;
  el.style.setProperty("--lcd-step-open-height", height + "px");
}

function lcdCloseStep(el) {
  if (!el) return;
  // Pred odobratim triedy zachovaj realny start transitionu.
  if (el.classList.contains("active")) lcdMeasureStep(el);
  el.classList.remove("active");
}

function lcdSetStepOpen(el, open) {
  if (!el) return;
  if (!open) {
    lcdCloseStep(el);
    return;
  }
  lcdMeasureStep(el);
  el.classList.add("active");
  // Obsah sa pri otvoreni moze prelomit az po zobrazeni (obrazky, selecty).
  requestAnimationFrame(function () { lcdMeasureStep(el); });
}

window.__lcdSetStepOpen = lcdSetStepOpen;
// Umožni preview obrázku (priceActualization) premerať krok potom, ako doňho
// pridá .image-wrap — inak ho overflow:hidden orezal na starej cieľovej výške.
window.__lcdMeasureStep = lcdMeasureStep;

/** Otvori IBA tento krok, ostatne zatvori. */
function lcdOpenStep(el) {
  lcdGetSteps().forEach(function (s) {
    if (s !== el) lcdCloseStep(s);
  });
  var $s = $(el);
  if ($s.hasClass("trunk") || $s.hasClass("boxs")) {
    $s.show();
    $(".upsale-Banner").show();
  }
  // Tlacidlo musi byt viditelne uz PRI merani scrollHeight. Ked sa ukazalo
  // az potom, cielova vyska bola mensia a spodok tlacidla zostal orezany.
  $s.find("> .next-step-button").show();
  lcdSetStepOpen(el, true);
  lcdResetOptionsWrap($s);
}

/** Cerveno zvyrazni krok + vyzva na doplnenie. */
function lcdHighlightStep(el) {
  var $s = $(el);
  $s.addClass("lcd-needs-fill selection-required");
  setTimeout(function () {
    $s.removeClass("lcd-needs-fill selection-required");
  }, 3000);
}

/** Vrati prvy nevyplneny krok 0..uptoIndex, alebo null. */
export function lcdFirstUnfilled(uptoIndex) {
  var steps = lcdGetSteps();
  var limit = (typeof uptoIndex === "number" && uptoIndex >= 0) ? uptoIndex : steps.length - 1;
  for (var i = 0; i <= limit && i < steps.length; i++) {
    if (!lcdStepFilled(steps[i])) return steps[i];
  }
  return null;
}

/**
 * SCROLL ANCHORING: drzi prvok pocas layout zmien (zatvaranie predchadzajuceho
 * kroku, max-height transition 300ms) na ROVNAKEJ vizualnej vyske — kazdy
 * frame instantne dorovna scroll o posun prvku. Ziadne "poskocenie" pri
 * zatvarani okna nad aktivnym krokom. Prerusi sa, ked user sam scrollne
 * alebo ked bezi prioritny verifikacny scroll.
 */
var lcdAnchorToken = 0;

function lcdAnchorTo(el, duration, fixedTop) {
  if (!el) return;
  var myToken = ++lcdAnchorToken;
  var targetTop = typeof fixedTop === "number" ? fixedTop : el.getBoundingClientRect().top;
  var start = performance.now();
  var aborted = false;
  // Flag pre header.js — konverzna fixna lista pocas anchoringu neprepina
  // (kompenzacne scrollBy prekmitavali cez jej prah => problikavanie).
  window.__lcdAnchoring = true;
  function onUser() { aborted = true; }
  window.addEventListener("wheel", onUser, { passive: true });
  window.addEventListener("touchmove", onUser, { passive: true });
  function cleanup() {
    if (myToken === lcdAnchorToken) window.__lcdAnchoring = false;
    window.removeEventListener("wheel", onUser);
    window.removeEventListener("touchmove", onUser);
  }
  function tick(now) {
    if (myToken !== lcdAnchorToken || aborted || !el.isConnected || lcdScroll.priority) {
      cleanup();
      return;
    }
    // Skryty prvok (display:none) ma rect.top 0 — korekcia by odstrelila
    // stranku o obrovsku deltu. Tento frame preskoc.
    if (el.offsetParent) {
      var d = el.getBoundingClientRect().top - targetTop;
      if (Math.abs(d) > 0.25) {
        // Priamy zapis je deterministicky a nevytvara dalsiu scroll animaciu.
        var root = document.scrollingElement || document.documentElement;
        root.scrollTop += d;
      }
    }
    if (now - start < duration) requestAnimationFrame(tick);
    else cleanup();
  }
  requestAnimationFrame(tick);
}

// Export pre productPage.js (akordeonovy klik na hlavicku kroku) — nech aj
// manualne otvaranie krokov drzi kliknuty krok na mieste.
window.__lcdAnchorTo = lcdAnchorTo;

function lcdGoToStep(el, isVerify) {
  var lcdMob = window.matchMedia("(max-width: 768px)").matches;
  // Desktop: ziadna manipulacia so scrollom. Viewport zostane presne tam,
  // kde ho uzivatel nechal; meni sa iba otvoreny stav akordeonu.
  if (!lcdMob && !isVerify) {
    lcdOpenStep(el);
    return;
  }
  lcdOpenStep(el);
  lcdScrollToStep(el, isVerify);
}

/** Prvy nevyplneny box-config pod-krok (farba/velkost boxov) — len ak je
 *  vybrany box (config, nie "nechci"). Vrati element alebo null. */
function lcdBoxConfigUnfilled() {
  var boxPicked = document.querySelector(
    ".upsale-buttons.boxs .upsale-button.active.config:not(.none)"
  );
  if (!boxPicked) return null;
  var wraps = document.querySelectorAll(".box-config .parameter-wrap");
  for (var i = 0; i < wraps.length; i++) {
    if (wraps[i].offsetParent === null) continue; // skryty pod-krok
    if (!lcdStepFilled(wraps[i])) return wraps[i];
  }
  return null;
}

/** Overi box-config. Ak chyba farba/velkost — otvori, oznaci, naskroluje
 *  a vrati false. Inak true. */
function lcdHandleBoxConfig() {
  var bad = lcdBoxConfigUnfilled();
  if (!bad) return true;
  var bc = bad.closest(".box-config");
  if (bc && getComputedStyle(bc).display === "none") bc.style.display = "";
  lcdHighlightStep(bad);
  lcdScrollToStep(bad, true);
  return false;
}

export function initConfiguratorEngine() {
  // Chrome scroll anchoring dokaze pri zbaleni obsahu posunut viewport aj bez
  // JS. Na desktope ho pre konfigurator vypni spolu s manualnym scrollom.
  if (!window.matchMedia("(max-width: 768px)").matches) {
    document.documentElement.style.overflowAnchor = "none";
    document.body.style.overflowAnchor = "none";
  }
  // Drz cielovu vysku otvoreneho kroku aktualnu aj pri neskorom nacitani
  // obrazkov alebo zmene obsahu. ResizeObserver nesposobuje layout polling.
  // MOBIL: ResizeObserver NEregistruj vôbec. Otvorený krok tam má max-height:none
  // (CSS), takže meranú výšku nepotrebuje — a práve toto prepočítavanie pri zmene
  // vh (URL-bar prehliadača počas scrollu) rozkmitalo obsah pod editorom.
  if (window.ResizeObserver && !window.matchMedia("(max-width: 768px)").matches) {
    // rAF debounce — observer nesmie merať synchronne vo vnútri vlastného
    // resize callbacku (to je klasická ResizeObserver slučka). Spolu s >2px
    // poistkou v lcdMeasureStep to drží výšku aktuálnu bez kmitania.
    var lcdRoScheduled = false;
    var lcdStepResizeObserver = new ResizeObserver(function (entries) {
      if (lcdRoScheduled) return;
      lcdRoScheduled = true;
      requestAnimationFrame(function () {
        lcdRoScheduled = false;
        entries.forEach(function (entry) {
          if (entry.target.classList.contains("active")) lcdMeasureStep(entry.target);
        });
      });
    });
    lcdGetSteps().forEach(function (step) { lcdStepResizeObserver.observe(step); });
  }

  // "Prejsť k ďalšiemu kroku"
  $(document).on("click", ".next-step-button", function (e) {
    e.preventDefault(); e.stopPropagation();
    var steps = lcdGetSteps();
    // Nájdi krok ktorý obsahuje toto tlačidlo (robustne — nezávisí na triedach).
    var btn = this;
    var curIdx = -1;
    for (var ci = 0; ci < steps.length; ci++) {
      if (steps[ci].contains(btn)) { curIdx = ci; break; }
    }
    if (curIdx < 0) curIdx = steps.length - 1;
    var bad = lcdFirstUnfilled(curIdx);
    if (bad) {
      lcdHighlightStep(bad);
      lcdGoToStep(bad, true);   // verifikacny scroll — priorita
      return;
    }
    if (curIdx < steps.length - 1) {
      lcdGoToStep(steps[curIdx + 1], false);
    } else {
      var $cart = $("button.add-to-cart-button").filter(":visible").first();
      // Nativny click (nie jQuery trigger) — garantuje aj nativny submit
      // formulara; jQuery trigger na mobile obcas pridanie nespustil.
      if ($cart.length) $cart[0].click();
    }
  });

  // Auto-select "nechcem" (.upsale-button.none) v trunk a boxs ak ziadna
  // option nie je .active. Tym sa do Shoptet objednavky dostane
  // "Autokoberce do kufru: nechcem" / "Boxy do kufru: nechcem".
  function lcdAutoSelectNoneIfEmpty() {
    ["trunk", "boxs"].forEach(function (cls) {
      var $wrap = $(".upsale-buttons." + cls);
      if (!$wrap.length) return;
      if ($wrap.find(".upsale-button.active").length) return;
      var $none = $wrap.find(".upsale-button.none").first();
      if ($none.length) {
        // Trigger click — spusti Shoptet handlers + nastavi surcharge na 0.
        $none.trigger("click");
      }
    });
  }

  // K3 "Rozloženie kobercov" → auto-otvorit trunk (Autokoberce do kufru).
  // ROBUSTNE: detekcia K3 priamo v click handleri (pocet 'rad/řad' option-buttonov >= 2),
  // NEZAVISI OD .lcd-k3-layout markera (ten moze byt nedostupny ak markBestsellers
  // este nebezal). Cielime trunk cez selektor .upsale-buttons.trunk, NIE index
  // (K4 v BASIC, K5 v ELITE — selektor je univerzalny).
  $(document).on("click", ".button.option-button", function (e) {
    var $btn = $(this);
    var $parWrap = $btn.closest(".parameter-wrap");
    if (!$parWrap.length) return;
    if ($parWrap.closest(".box-config").length) return; // skip box-config
    // K3 detect: >= 2 option-buttony s textom rad/řad/rada/řada
    var radCount = 0;
    $parWrap.find(".option-button").each(function () {
      if (/(^|\s)(rad|řad)/i.test($(this).text())) radCount++;
    });
    if (radCount < 2) return;
    // DESKTOP: ZIADNY auto-prechod — stranka sa pri vybere nesmie sama hybat
    // (klient: "kdyz vyberu rozlozeni, vyjede to o kus nahoru"). Vyber
    // rozlozenia ale ODHALI zbalene kroky kufor/boxy: banner sa prida POD
    // aktualny krok, obsah pod nim sa len posunie nizsie — nic neskace.
    // Otvorenie kroku az klikom na "Prejst k dalsiemu kroku". Mobil: povodny flow.
    // Nový vzhľad 1V (body.lcd-1v len na SK 598 s ?novy=1): ani mobil sa sám nehýbe — kroky majú vlastné
    // „Pokračujte ďalej“ a krok 4 prepína rozloženie aj pri zmene počtu miest (nesmie zbaliť krok 2 a skočiť na kufor).
    if (!window.matchMedia("(max-width: 768px)").matches || document.body.classList.contains("lcd-1v")) {
      $(".upsale-Banner").show();
      return;
    }
    // K3 click -> auto-advance na trunk po Shoptet update.
    // Explicit close K3 wrap + open trunk (lcdGoToStep -> lcdOpenStep robi forEach
    // cez lcdGetSteps() ale niekedy K3 wrap nie je v tomto vystupe -> ostane active).
    var trunk = document.querySelector(".upsale-buttons.trunk");
    if (!trunk) return;
    // FORCE CLOSE: removeClass(active) + inline style.maxHeight=50px ktory
    // OVERRIDE-uje CSS .parameter-wrap.active { max-height:1000px } cez specificity.
    // Aj keby Shoptet pridal active spat, inline style donuti accordion zostat zatvoreny.
    // Cleanup po 5s aby user mohol K3 znovu otvorit manualne klikom na hlavicku.
    var elK3 = $parWrap[0];
    function closeK3() {
      $parWrap.removeClass("active goToAction errorToCart");
      if (elK3) {
        elK3.style.setProperty("max-height", "50px", "important");
      }
    }
    // Debug counter na window — Michal moze overit cez DevTools (window.__lcdK3Clicks)
    window.__lcdK3Clicks = (window.__lcdK3Clicks || 0) + 1;
    // 350ms pauza: user najprv VIDI ze sa jeho vyber oznacil, az potom sa
    // prejde dalej (okamzity presun pri 100ms posobil trhane).
    setTimeout(function () {
      closeK3();
      lcdGoToStep(trunk, false);
    }, 350);
    setTimeout(closeK3, 700);
    // Cleanup inline style — user moze znovu otvorit K3 manualne.
    // (Klik na hlavicku ho navyse odomkne OKAMZITE — viac v initConfiguratorEngine.)
    setTimeout(function () {
      if (elK3) elK3.style.removeProperty("max-height");
    }, 2500);
  });

  // SELF-HEAL: klik na hlavicku ktorehokolvek kroku okamzite odstrani inline
  // max-height zamok (K3 force-close) — inak by krok do 2.5s nesiel otvorit.
  $(document).on("click", ".parameter-wrap .order, .parameter-wrap h5, .parameter-wrap .variant.name", function () {
    var wrap = this.closest(".parameter-wrap");
    if (wrap) wrap.style.removeProperty("max-height");
  });

  // "Pridať do košíka"
  $(document).on("click", "button.add-to-cart-button", function (e) {
    // Auto "nechcem" pre nepovinne trunk/boxs ak prazdne.
    lcdAutoSelectNoneIfEmpty();
    var bad = lcdFirstUnfilled();
    if (bad) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      lcdHighlightStep(bad);
      lcdGoToStep(bad, true);
      return false;
    }
    // Box-config: ak je vybrany box, farba aj velkost musia byt vybrate.
    if (!lcdHandleBoxConfig()) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      return false;
    }
    // Vsetko vyplnene → Shoptet prida do kosika. Po pridani prejdi rovno
    // do kosika (/kosik/). __lcdCartReloading flag zabrani cart.js reloadu
    // produktovej stranky — namiesto toho spravime redirect.
    window.__lcdCartReloading = true;
    document.addEventListener("ShoptetCartUpdated", function lcdToCart() {
      document.removeEventListener("ShoptetCartUpdated", lcdToCart);
      // MOBIL BUG: ShoptetCartUpdated prisiel aj ked pridanie ZLYHALO —
      // zakaznik skoncil v prazdnom kosiku. Redirect LEN ked kosik realne
      // nieco obsahuje (badge v headri); inak ostan na produkte, Shoptet
      // ukaze vlastnu chybovu hlasku. Kratky delay — badge sa updatuje
      // tesne po evente.
      setTimeout(function () {
        var badge = document.querySelector(
          ".navigation-buttons a[data-target='cart'] i, a.cart-count i, .cart-count i"
        );
        var n = badge ? parseInt((badge.textContent || "").replace(/\D/g, ""), 10) : NaN;
        if (!isNaN(n) && n > 0) {
          window.location.href = "/kosik/";
        } else {
          window.__lcdCartReloading = false;
        }
      }, 200);
    });
  });

  // "potvrdiť" v box-config — over farba/velkost boxov.
  // Ak je vsetko OK, zatvor box-config panel (removeClass showConf)
  // a krok K5/K6 sa vrati do compact view.
  $(document).on("click", ".close-btn.return", function (e) {
    if (!lcdHandleBoxConfig()) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      return false;
    }
    // Vyplneny box-config → zatvor panel
    $(this).closest(".upsale-Banner").removeClass("showConf");
  });

  // BOX PRODUKT (URL /luxusny-boxi-do-kufra/ alebo H1 obsahuje "box"):
  // pri loade auto-otvor K1 (prvy krok). Ostatné kroky zatvorene. Po vybere
  // ziaden auto-advance — user klika "Prejst k dalsiemu kroku" rucne.
  function isBoxProduct() {
    var h1 = ($("h1").first().text() || "").toLowerCase();
    if (h1.indexOf("box") > -1) return true;
    var path = (window.location.pathname || "").toLowerCase();
    return /boxi|boxy|box/.test(path);
  }
  function lcdAutoOpenFirstStep() {
    if (!isBoxProduct()) return;
    // GUARD: ak uz user nieco vybral (akakolvek option-button alebo step active),
    // NEVRACAJ ho spat na K1 — inak by po 2-3s skacalo z K2 (farba) spat na K1 (pocet).
    if (document.querySelector(".content-wrap .button.option-button.active")) return;
    if (document.querySelector(".content-wrap .parameter-wrap.active")) {
      // Ak je uz nejaky krok active a NIE JE to prvy step, nechaj ho otvoreny
      var firstStep = document.querySelector(".content-wrap > .parameter-wrap, .content-wrap > .position-wrap");
      var active = document.querySelector(".content-wrap .parameter-wrap.active");
      if (active && active !== firstStep) return;
    }
    var steps = lcdGetSteps();
    if (steps.length === 0) return;
    lcdOpenStep(steps[0]);
  }
  // Retry — Shoptet generuje kroky async (5x 600ms).
  setTimeout(lcdAutoOpenFirstStep, 600);
  setTimeout(lcdAutoOpenFirstStep, 1500);
  setTimeout(lcdAutoOpenFirstStep, 3000);
}
