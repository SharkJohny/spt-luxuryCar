// ─────────────────────────────────────────────────────────────────────
// Konfigurátor — best-seller označenie + box solo ceny
// (v5, 2026-05-15)
//
// 1) Badge "NAJOBJEDNÁVANEJŠIE" na možnostiach (krok 4/5/6)
// 2) Box "cena mimo setu" = data-recommended / 1.6 (skutočná SOLO cena,
//    nie RRP). Overené z cenníka: 315,2/1,6 = 197 €, 630,4/1,6 = 394 €.
//
// Konfigurátor sa generuje async, preto retry interval.
// ─────────────────────────────────────────────────────────────────────

import { lcdCena } from "./functions/livePrice.js";

(function configuratorEnhance() {
  "use strict";

  function markBestsellers() {
    // Oznac K3 "Rozloženie kobercov" parameter-wrap triedou lcd-k3-layout.
    // ROBUSTNY marker: pocita option-button-y s textom obsahujucim "rad/řad"
    // (rad, řada, prvý rad, druhý rad, prvý a druhý rad, prvý druhý a tretí rad...).
    // Ak >= 2 → je to K3 Rozlozenie kobercov. Pokryva SK aj CZ vsetky variante.
    document.querySelectorAll(".parameter-wrap").forEach(function (parWrap) {
      if (parWrap.classList.contains("lcd-k3-layout")) return;
      if (parWrap.closest(".box-config")) return; // skip box-config
      var btns = parWrap.querySelectorAll(".option-button");
      if (btns.length < 2) return;
      var radCount = 0;
      btns.forEach(function (btn) {
        var t = (btn.textContent || "").toLowerCase();
        if (/(^|\s)(rad|řad)/i.test(t)) radCount++;
      });
      if (radCount >= 2) {
        parWrap.classList.add("lcd-k3-layout");
      }
    });

    // K3 "Rozloženie kobercov" — badge "NAJOBJEDNÁVANEJŠIE" na "prvý a druhý rad".
    // Robustne cez TEXT match — nezavisi od parameter-ID (BASIC vs ELITE,
    // SK vs CZ mozu mat ine ID, ale text moznosti je rovnaky).
    document.querySelectorAll(".option-button").forEach(function (btn) {
      var txt = (btn.textContent || "").toLowerCase().replace(/\s+/g, " ");
      // SK: "prvý a druhý rad", CZ: "první a druhá řada"
      // POZOR: nesmie chytit "prvy, druhy A TRETI rad"
      var isSecondRow =
        /\bprv\S*\s+a\s+druh\S*\s+(rad|řad|rada|řada)/i.test(txt) &&
        !/tret|třet/i.test(txt);
      if (isSecondRow && !btn.classList.contains("lcd-najobjednavanejsie")) {
        btn.classList.add("lcd-najobjednavanejsie");
      }
    });
    // K5/K6 trunk (autokoberce do kufru) — "KLASIK - NA DNO" badge + reorder marker.
    document.querySelectorAll(".upsale-buttons.trunk .upsale-button").forEach(function (card) {
      var txt = (card.textContent || "").toLowerCase();
      if (/klasik/.test(txt) && !card.classList.contains("lcd-bestseller")) {
        card.classList.add("lcd-bestseller");
      }
      // PREMIUM (cely kufor) → marker pre CSS order (PREMIUM prvy, KLASIK stred)
      if (/premium/.test(txt) && !card.classList.contains("lcd-trunk-premium")) {
        card.classList.add("lcd-trunk-premium");
      }
    });
    // K5/K6 boxs (boxy do kufra) — "2x box".
    document.querySelectorAll(".upsale-buttons.boxs .upsale-button").forEach(function (card) {
      var txt = (card.textContent || "").toLowerCase().replace(/\s+/g, " ");
      if (/2\s*x\s*box/.test(txt) && !card.classList.contains("lcd-bestseller")) {
        card.classList.add("lcd-bestseller");
      }
    });
  }

  // Box "cena mimo setu" = data-recommended / 1.6 (skutočná solo cena)
  // Mena a tvar podľa Shoptetu cez lcdCena (CZK na .cz, EUR na .sk)
  function fixBoxSoloPrices() {
    document
      .querySelectorAll(".boxs .upsale-button .price-recommended")
      .forEach(function (el) {
        if (el.getAttribute("data-lcd-solo-fixed")) return;
        var rec = parseFloat(
          (el.getAttribute("data-recommended") || "").replace(",", ".")
        );
        if (!rec || isNaN(rec)) return;
        var solo = Math.round(rec / 1.6);
        // rovnaký tvar ako cena vedľa („od €99 €197“, nie „od €99 197 €“; tablet 9. 10. 2026)
        el.textContent = lcdCena(solo);
        el.setAttribute("data-lcd-solo-fixed", "1");
      });
  }

  // K2 / K3 / box-config: nad preview obrazkom vybranej farby zobraz text
  // s nazvom vzorky/farby (napr. "Diamond Farba kože : Čierna"). Text sa
  // berie z <select> option zodpovedajucej aktivnemu .option-button.
  function buildLabelFromActive(active) {
    var value = active.getAttribute("data-value");
    var variant = active.getAttribute("data-variant");
    if (!value || !variant) return "";
    var sel = document.querySelector("select.parameter-id-" + variant);
    var label = "";
    if (sel) {
      var opt = sel.querySelector('option[value="' + value + '"]');
      if (opt) label = (opt.textContent || "").trim();
    }
    // Strip "+X €/Kč" suffix a normalizuj medzery
    label = label.replace(/\s*\+\s*(?:€|Kč|EUR|CZK)?\s*[\d.,]+\s*(?:€|Kč|EUR|CZK)?\s*$/i, "").trim();
    label = label.replace(/\s+/g, " ");
    // Skratit "Diamond Farba kože : Čierna Farba šitia : Zelená" -> "Diamond — Čierna / Zelená"
    var m = label.match(/^(.+?)\s*Farba\s+ko[žz]e\s*:\s*([^\s].*?)(?:\s+Farba\s+[šs]itia\s*:\s*([^\s].*?))?\s*$/i);
    if (m) {
      // Trim trailing/leading whitespace + slash — option text moze obsahovat "Čierna /" pred "Farba šitia"
      var v1 = m[1].trim().replace(/[\s\/]+$/, "").replace(/^[\s\/]+/, "");
      var v2 = m[2].trim().replace(/[\s\/]+$/, "").replace(/^[\s\/]+/, "");
      var v3 = m[3] ? m[3].trim().replace(/[\s\/]+$/, "").replace(/^[\s\/]+/, "") : "";
      label = v1 + " — " + v2 + (v3 ? " / " + v3 : "");
    }
    return label;
  }

  function upsertLabel(container, text, position) {
    var existing = container.querySelector(":scope > .lcd-color-label");
    if (existing) {
      if (existing.textContent !== text) existing.textContent = text;
      return;
    }
    var div = document.createElement("div");
    div.className = "lcd-color-label";
    div.textContent = text;
    if (position === "end") container.appendChild(div);
    else container.insertBefore(div, container.firstChild);
  }

  function addColorLabels() {
    // 1) K2 / K3 — label NAD obrazkom v .image-wrap.
    //    SKIP: box-config (image-wrap je CSS-hidden) + size wraps (NEPLNI ucel,
    //    Michal vyzaduje aby pri velkosti boxu NEbol label).
    document.querySelectorAll(".image-wrap").forEach(function (wrap) {
      if (wrap.closest(".box-config")) return;
      var parWrap = wrap.closest(".parameter-wrap");
      if (!parWrap) return;
      // SKIP size wrap (3-vrstvova detekcia)
      if (parWrap.classList.contains("parameter-sizes")) return;
      var h5 = parWrap.querySelector("h5");
      if (h5 && /^vel[ioe]kos[tť]/i.test((h5.textContent || "").trim())) return;
      var active = parWrap.querySelector(".button.option-button.active");
      if (!active) return;
      var activeTxt = (active.textContent || "").toLowerCase();
      if (/\b\d+\s*x\s*\d+\s*x\s*\d+\s*cm\b/.test(activeTxt)) return;
      var label = buildLabelFromActive(active);
      if (!label) return;
      upsertLabel(wrap, label, "start");
    });

    // 2) Box-config — label v .parameter-wrap LEN PRE FARBU (nie velikost).
    //    Kombinovany filter: 3 detekcie size wrap (robustne):
    //      a) class .parameter-sizes
    //      b) text active option obsahuje "XxYxZ cm"
    //      c) h5 nadpis sa zacina "Velikost / Veľkosť / Velokost"
    document.querySelectorAll(".box-config .parameter-wrap").forEach(function (parWrap) {
      if (parWrap.classList.contains("parameter-sizes")) return;
      var h5 = parWrap.querySelector("h5");
      if (h5 && /^vel[ioe]kos[tť]/i.test((h5.textContent || "").trim())) return;
      var active = parWrap.querySelector(".button.option-button.active");
      if (!active) return;
      var activeTxt = (active.textContent || "").toLowerCase();
      if (/\b\d+\s*x\s*\d+\s*x\s*\d+\s*cm\b/.test(activeTxt)) return;
      var label = buildLabelFromActive(active);
      if (!label) return;
      // Pre box-config color wrap: vloz label PO .options-wrap (nie do parWrap),
      // aby bol POD swatchmi nezavisle od flex/grid layoutu parameter-wrap-u.
      var optionsWrap = parWrap.querySelector(".options-wrap");
      if (optionsWrap) {
        // Najst existujuci label hned za optionsWrap, alebo vytvorit novy
        var next = optionsWrap.nextElementSibling;
        if (next && next.classList && next.classList.contains("lcd-color-label")) {
          if (next.textContent !== label) next.textContent = label;
        } else {
          var div = document.createElement("div");
          div.className = "lcd-color-label";
          div.textContent = label;
          optionsWrap.parentNode.insertBefore(div, optionsWrap.nextSibling);
        }
      } else {
        upsertLabel(parWrap, label, "end");
      }
    });
  }

  // ═══ BOX PRODUKT (samostatny /luxusny-boxi-do-kufra/) — len pre tento produkt ═══

  function lcdIsStandaloneBoxProduct() {
    var h1 = (document.querySelector("h1") && document.querySelector("h1").textContent || "").toLowerCase();
    var path = (window.location.pathname || "").toLowerCase();
    return h1.indexOf("box") > -1 && /boxi|boxy/.test(path);
  }

  // Kufrove rohoze samostatne (Premium Diamond, Klasik Diamond) — rename "Farba 1.vrstvy" -> "Farba rohozi do kufra".
  // Detekcia: H1 includes "kufr" + ("koberce" || "rohoz") + NIE elite/basic/box.
  function lcdIsTrunkMatStandalone() {
    var h1 = (document.querySelector("h1") && document.querySelector("h1").textContent || "").toLowerCase();
    if (h1.indexOf("box") > -1) return false;
    if (h1.indexOf("elite") > -1 || h1.indexOf("basic") > -1) return false;
    if (h1.indexOf("hexa") > -1 || h1.indexOf("stripe") > -1) return false;
    if (!/kufr/.test(h1)) return false;
    return /kober(ce|ec)|rohoz|rohož/.test(h1);
  }
  function lcdRenameTrunkMatColorStep() {
    if (!lcdIsTrunkMatStandalone()) return;
    document.querySelectorAll(".parameter-wrap h5.variant.name, .parameter-wrap h5").forEach(function (h5) {
      var txt = (h5.textContent || "").trim().toLowerCase();
      if (/farba\s*1\.?\s*vrstv|barva\s*1\.?\s*vrstv/i.test(txt)) {
        var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
        var newName = lang.indexOf("cs") === 0 ? "Barva rohoží do kufru" : "Farba rohoží do kufra";
        if (h5.textContent.trim() !== newName) {
          h5.textContent = newName;
        }
      }
    });
  }

  // Box produkt — reorder krokov + rename "FARBA 1.VRSTVY" -> "FARBA BOXOV""
  // Nové poradie: 1) POČET BOXOV  2) FARBA BOXOV  3) VEĽKOSŤ
  // Scope: iba samostatny box produkt.
  function lcdBoxReorderAndRename() {
    if (!lcdIsStandaloneBoxProduct()) return;
    var contentWrap = document.querySelector(".content-wrap");
    if (!contentWrap) return;
    // Forsujem display:flex + flex-direction:column aby CSS 'order' fungoval
    if (!contentWrap.classList.contains("lcd-box-reordered")) {
      contentWrap.classList.add("lcd-box-reordered");
    }
    // Iteruj cez direct children (.parameter-wrap a .position-wrap)
    var children = contentWrap.querySelectorAll(":scope > .parameter-wrap, :scope > .position-wrap");
    children.forEach(function (wrap) {
      var h5 = wrap.querySelector("h5.variant.name, h5");
      if (!h5) return;
      var txt = (h5.textContent || "").trim().toLowerCase();
      // Rename: "Farba 1.vrstvy / Barva 1.vrstvy" -> "Farba boxov / Barva boxů"
      if (/farba\s*1\.?\s*vrstv|barva\s*1\.?\s*vrstv/i.test(txt)) {
        var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
        var newName = lang.indexOf("cs") === 0 ? "Barva boxů" : "Farba boxov";
        if (h5.textContent.trim() !== newName) {
          h5.textContent = newName;
        }
        wrap.style.order = "2"; // FARBA = krok 2
      } else if (/po[čc]et\s*box/i.test(txt)) {
        wrap.style.order = "1"; // POČET = krok 1
      } else if (/^vel[ioe]kos[tť]/i.test(txt)) {
        wrap.style.order = "3"; // VEĽKOSŤ = krok 3
      }
    });
  }

  // Text posledneho .next-step-button na box produkte:
  // "Prejsť k ďalšiemu kroku" -> "Dokončiť konfiguráciu"
  function lcdFixBoxLastButtonText() {
    if (!lcdIsStandaloneBoxProduct()) return;
    var wraps = document.querySelectorAll(".content-wrap .parameter-wrap:not(.parameter-sizes), .content-wrap .position-wrap");
    // Najst posledny viditelny wrap mimo box-config
    var lastVisible = null;
    document.querySelectorAll(".content-wrap > .parameter-wrap, .content-wrap > .position-wrap").forEach(function (w) {
      if (w.closest(".box-config")) return;
      if (w.offsetParent === null) return; // skryty
      lastVisible = w;
    });
    if (!lastVisible) return;
    var btn = lastVisible.querySelector(".next-step-button");
    if (!btn) return;
    var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    var newText = lang.indexOf("cs") === 0 ? "Dokončit konfiguraci" : "Dokončiť konfiguráciu";
    if (btn.textContent.trim() !== newText) {
      btn.textContent = newText;
      btn.classList.add("finish-button");
    }
  }

  // RRP cena (Doporucena cena) — pre box produkt pridat = aktualna × 1.6
  // Shoptet niekedy nevykresluje price-recommended ak variant nema RRP nastavene.
  function lcdAddBoxRRP() {
    if (!lcdIsStandaloneBoxProduct()) return;
    var finalEl = document.querySelector(".p-info-wrapper strong.price-final, strong.price-final");
    if (!finalEl) return;
    // Skontroluj ci RRP uz existuje (zo Shoptet alebo nasa injekcia)
    if (finalEl.querySelector(".lcd-rrp-injected")) return;
    var existing = finalEl.querySelector(".price-recommended, .recommended-price-final");
    if (existing && (existing.textContent || "").replace(/\s+/g, "").length > 0) return;
    // Vypocet RRP = aktualna * 1.6, zaokruhlene nahor na 10
    var amountText = (finalEl.textContent || "").replace(/[^0-9,\.]/g, "").replace(",", ".");
    var amount = parseFloat(amountText);
    if (!amount || isNaN(amount)) return;
    var rrp = Math.ceil((amount * 1.6) / 10) * 10;
    // mena a tvar ako cena, ktorú píše Shoptet (lcdCena)
    var rrpFmt = lcdCena(rrp);
    // Najst label "Aktuálna cena" / "Doporučená cena" v p-info-wrapper
    var labels = document.querySelectorAll(".p-info-wrapper .price-standard, .p-info-wrapper .price-label, .p-info-wrapper span");
    // Pridame RRP riadok PRED price-final
    var rrpWrap = document.createElement("div");
    rrpWrap.className = "lcd-rrp-wrap";
    rrpWrap.innerHTML = '<span class="lcd-rrp-label">' +
      (((document.documentElement.getAttribute("lang") || "").toLowerCase().indexOf("cs") === 0) ? "Doporučená cena" : "Doporučená cena") +
      '</span> <span class="price-recommended lcd-rrp-injected">' + rrpFmt + '</span>';
    var parent = finalEl.parentNode;
    if (parent && !parent.querySelector(".lcd-rrp-wrap")) {
      parent.insertBefore(rrpWrap, finalEl);
    }
  }

  // Hlavička akordeónu podľa návrhu — číslo kroku obalí do span.lcd-step-num
  // (tmavý štvorček na zlatom gradiente). Číslo je holý text node v .order,
  // CSS ho samostatne naštýlovať nevie. productPage.js môže .order.text(n)
  // prepísať — interval to ďalší tick znovu obalí.
  function lcdWrapStepNumbers() {
    document.querySelectorAll(".parameter-wrap .order, .position-wrap .order").forEach(function (order) {
      if (order.querySelector(".lcd-step-num")) return;
      var node = order.firstChild;
      if (!node || node.nodeType !== 3) return;
      var txt = (node.textContent || "").trim();
      if (!txt) return;
      var span = document.createElement("span");
      span.className = "lcd-step-num";
      span.textContent = txt;
      order.replaceChild(span, node);
    });
  }

  // ═══ K5/K6 TRUNK — redesign kariet podľa návrhu (2026-07) ═══
  // "KLASIK - NA DNO" → titulok + podtitulok, save badge s percentom,
  // "NECHCEM" karta dostane podtitulok + poznámku, PREMIUM badge.
  function lcdTrunkCardsRedesign() {
    var cs = (document.documentElement.getAttribute("lang") || "").toLowerCase().indexOf("cs") === 0;
    document.querySelectorAll(".upsale-buttons.trunk .upsale-button").forEach(function (card) {
      if (card.getAttribute("data-lcd-card")) return;
      var header = card.querySelector(".banner-header");
      var span = header && header.querySelector("span");
      if (!span) return;
      var raw = (span.textContent || "").replace(/\s+/g, " ").trim();
      if (!raw) return;
      // Rozdel na titulok a podtitulok podla prvej pomlcky ("KLASIK - NA DNO")
      var parts = raw.split(/\s*[-–—]\s*/);
      var title = (parts.shift() || raw).trim();
      var sub = parts.join(" · ").trim();
      var isNone = card.classList.contains("none");
      if (isNone && !sub) sub = cs ? "Ponechat kufr prázdný" : "Ponechať kufor prázdny";
      span.innerHTML = "";
      var t = document.createElement("span");
      t.className = "lcd-card-title";
      t.textContent = title;
      span.appendChild(t);
      if (sub) {
        var s = document.createElement("span");
        s.className = "lcd-card-sub";
        s.textContent = sub;
        span.appendChild(s);
      }
      if (isNone) {
        var note = document.createElement("div");
        note.className = "lcd-card-note";
        note.textContent = cs ? "Bez slevy na tento doplněk" : "Bez zľavy na tento doplnok";
        header.appendChild(note);
      }
      // Save badge: "UŠETRÍTE 8 449 Kč" + "−58 %" (percento z doporucenej ceny)
      var save = header.querySelector(".save");
      var rec = header.querySelector(".price-recommended");
      if (save && rec) {
        var saveVal = parseFloat((save.getAttribute("data-save") || "").replace(",", "."));
        var recVal = parseFloat((rec.getAttribute("data-recommended") || "").replace(",", "."));
        // suma aj s menou vľavo („Ušetríte“ + „€216“), inak by „€“ ostalo pri popise
        var m = (save.textContent || "").trim().match(/^(.*?)\s*((?:€|\$|EUR|CZK|Kč)?\s*\d[\d\s .,]*.*)$/);
        if (m) {
          save.innerHTML = "";
          var lbl = document.createElement("span");
          lbl.className = "lcd-save-label";
          lbl.textContent = m[1].trim();
          save.appendChild(lbl);
          var amt = document.createElement("strong");
          amt.textContent = m[2].trim();
          save.appendChild(amt);
          if (saveVal > 0 && recVal > 0) {
            var pct = document.createElement("span");
            pct.className = "lcd-save-pct";
            pct.textContent = "−" + Math.round((saveVal / recVal) * 100) + " %";
            save.appendChild(pct);
          }
        }
      }
      card.setAttribute("data-lcd-card", "1");
    });
    // Badge "★ NAJOBJEDNÁVANEJŠIE" na PREMIUM karte (podľa návrhu)
    var prem = document.querySelector(".upsale-buttons.trunk .upsale-button.lcd-trunk-premium");
    if (prem && !prem.querySelector(".lcd-upsale-badge")) {
      var b = document.createElement("span");
      b.className = "lcd-upsale-badge";
      b.textContent = "★ " + (cs ? "Nejobjednávanější" : "Najobjednávanejšie");
      prem.insertBefore(b, prem.firstChild);
    }
  }

  // Pridaj play button overlay na .customers-video karty (RECENZIA/POROVNANIE)
  // — aby ľudia videli že ide o videá a nie statické obrázky.
  function addVideoPlayOverlays() {
    document.querySelectorAll(".customers-video .customer-video").forEach(function (card) {
      if (card.querySelector(".lcd-video-play-overlay")) return;
      var vid = card.querySelector("video, a, .image-wrap");
      if (!vid) return;
      var overlay = document.createElement("div");
      overlay.className = "lcd-video-play-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = '<span class="lcd-video-play-circle"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';
      // vlozit ako prvy child .customer-video (absolute pozicia na video)
      card.insertBefore(overlay, card.firstChild);
    });
  }

  function run() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      markBestsellers();
      lcdWrapStepNumbers();
      lcdTrunkCardsRedesign();
      fixBoxSoloPrices();
      addColorLabels();
      addVideoPlayOverlays();
      lcdBoxReorderAndRename();
      lcdRenameTrunkMatColorStep();
      lcdFixBoxLastButtonText();
      lcdAddBoxRRP();
      if (tries > 40) clearInterval(iv);
    }, 600);
    // Tiez prepoctaj label po kazdom kliku na option-button (rychla odozva)
    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest(".button.option-button");
      if (!btn) return;
      setTimeout(addColorLabels, 250);
      setTimeout(addColorLabels, 800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
