// Kontrola mierky písma kamiónov SK 640 (Michal 18. 10. 2026: „malé texty si ľudia neprečítajú“; pamäť
// feedback_vacsie_pismo_mierka): minimá telefón / PC (≥ 768 px) cez getComputedStyle v živom prehliadači.
//   bežný text 16 / 17 (line-height ≥ 1,5) · úvodná veta pod nadpisom 17 / 18 · bunky tabuliek 15 / 16, hlavičky 13 ·
//   poznámky a popisky 14 / 15 · nadpisy kariet ≥ 18 · FAQ otázka 17, odpoveď 16 · štítky verzálkami ≥ 12 · tlačidlá ≥ 14.
// Rola prvku = najbližší predok (aj on sám), ktorý sedí na selektor z ROLY_*; inak tlačidlo (<button>, ale nie karta / dlaždica
// voľby — tie majú popisky vymenované v ROLY_*), inak štítok (verzálky), inak BEŽNÝ TEXT 16 / 17 (revízia 18. 10. 2026: nový
// súvislý text bez známej triedy nesmie prejsť ako 14 px poznámka). Ďalej sa kontroluje, že sa žiadne slovo nezalomí
// uprostred (overflow-wrap: anywhere je zakázané), nepretečie z rámika, že ho čiastočne neoreže predok s overflow hidden /
// clip (štítok na fotke, názov v dlaždici — revízia 18. 10. 2026; celé skryté slová, napr. zbalené FAQ, sa nerátajú; posuvný
// kontajner auto / scroll hľadanie ukončí) a stránka nemá vodorovný posuvník.
// Použitie: tools/test-1v/scenare-kamion.mjs (konfigurátor, --sirka 1280,390), tools/test-1v/obsah-kamiony.mjs (obsah).

/** rola -> [telefón, PC ≥ 768 px], riadkovanie (line-height / font-size) pre súvislý text */
export const MIERKA = {
  text: [16, 17], uvod: [17, 18], cena: [16, 17], bunka: [15, 16], hlavicka: [13, 13], pozn: [14, 15],
  karta: [18, 18], nadpis: [18, 18], faqOtazka: [17, 17], faqOdpoved: [16, 16], stitok: [12, 12], tlacidlo: [14, 14],
};
const RIADKOVANIE = { text: 1.5, uvod: 1.5, faqOdpoved: 1.5 };

/** Konfigurátor (#lcd1v-kamion) a lišta: poradie = priorita pri tom istom prvku (konkrétnejšie skôr). */
export const ROLY_KONFIGURATOR = [
  // štítky verzálkami (aj vnútri dlaždíc a tlačidiel) a čísla krokov
  [".k-typ, .k-cena__stitok, .vc__h, .k-postup__t, .k-postup__st, .k-krok__ey, .k-krok.is-done .k-krok__nm, .k-stitok, .k-sk-h, .mk-var, " +
    ".k-cenovka__l, .k-badge, .k-suhrn__lb, .sh__ey, .kn-bod b, .kn-stitok, .kn-dv__top, .kn-karta__ey, .lcd1v-lista__suma small, .k-krok__no", "stitok"],
  // nadpisy kariet a krokov, otázky
  [".k-h1, .k-krok__ti, .kn-ot, .sh__h", "nadpis"],
  [".k-krok__nm, .k-rkarta__nm, .kn-dv__nm, .kn-rv__nm, .kn-ponuka__nm", "karta"],
  // úvodné vety pod nadpisom
  [".k-perex, .k-pod", "uvod"],
  // ceny
  [".k-cena__suma, .k-cenovka__c, .k-suhrn__suma, .sh__c, .k-rkarta__pl, .kn-rv__plus, .lcd1v-lista__suma", "cena"],
  // bežný text: súhrnné riadky ✓, súhrn objednávky, vysvetlenia, výber v poliach
  [".k-krok.is-done .k-krok__vy, .kn-hot__tx, .k-kompat__tx b, .sh__voz, .sh__t b, .sh__us, .tp-info, .kn-info, .kn-ponuka__ben, .k-select, .k-veta-pole", "text"],
  // tlačidlá
  [".k-btn-zelene, .k-btn-zlate, .an__b, .kn-hot__zm, .k-krok__zm, .k-segment > button, .lcd1v-lista__kos", "tlacidlo"],
  // poznámky a popisky (popisky dlaždíc, ceny „Samostatne“, popisy volieb, chyby)
  [".k-krok__vy, .k-pozn, .k-cena__od, .vc__l li, .k-kompat__tx i, .k-rkarta__po, .k-rkarta__foto b, .k-dlazdica__nm, .fb__nm, .fb__kod, " +
    ".lm__nm, .lm__kod, .nt__b, .k-cenovka__s, .k-cenovka__u, .sh__t span, .sh__chyba-r, .sh__fakty li, .k-alt, .kn-ilu, .kn-dv__po, " +
    ".kn-rv__po, .kn-nie small, .kn-nh__hd, .kn-nh__pop, .kn-vz p, .k-nahlad-farby__nm, .lm-nahlad p, .k-pole__chyba, .k-sk__chyba, " +
    ".k-chyba-tx, .sh__err, .k-hodn, .sh__c s, .sh__c em, .lcd1v-lista__popis", "pozn"],
];

/** Obsah pod konfigurátorom (časti p1v-kamiony-*): vlastné triedy _lcd1v-obsah-kamiony.scss. */
export const ROLY_OBSAH = [
  [".kk-h, .km-pill", "stitok"],
  [".km-t b", "karta"],
  [".kk-t, .kk-zoz li, .km-t p", "text"],
  [".kg figcaption, .kk-foto figcaption, .kn figcaption", "pozn"],
];
/** Spoločné časti titulky / 1V obsahu (štýlujú ich spoločné partialy — iná session): kontrolujú sa, ale len ako upozornenie. */
export const ROLY_SPOLOCNE = [
  [".eyebrow, .p1v-faq-q .i", "stitok"], // .i = poradové číslo otázky FAQ (01, 02 …)
  ["h2, h3:not(.kk-h)", "nadpis"],
  [".lede", "uvod"],
  [".p1v-faq-q", "faqOtazka"],
  [".p1v-faq-a", "faqOdpoved"],
  [".btn", "tlacidlo"],
  // spoločné sekcie A (recenzie), C (časová os), D (FAQ, pomocné) — celé zo spoločných partialov
  ['[data-lcd-sekcia^="a-"], [data-lcd-sekcia^="c-"], [data-lcd-sekcia^="d-"]', "pozn"],
];

/** Karty a dlaždice volieb sú <button>, ale ich texty nie sú text tlačidla (názov, popis, cena majú vlastnú rolu v ROLY_*). */
const KARTY_VOLIEB = ".k-rkarta, .kn-dv__b, .kn-rv__b, .k-dlazdica, .fb__b, .lm__b";

/**
 * Výraz pre Runtime.evaluate: { pc, n, zle: [{ r, fs, min, el, t, z }], riadky: [...], zlom: [...], pretek: [...], orez: [...], strana }.
 * korene = selektory koreňov; roly = [[selektor, rola]]; spolocne = roly, ktorých nález sa označí z: true (upozornenie).
 */
export function pismoVyraz(korene, roly, spolocne = []) {
  return `(function (korene, roly, spolocne, M, RIAD, KARTY) {
  var pc = innerWidth >= 768, zle = [], riadky = [], zlom = [], pretek = [], orez = [], n = 0, styl = new Map();
  function cs_(x) { var c = styl.get(x); if (!c) { c = getComputedStyle(x); styl.set(x, c); } return c; }
  /** Predkovia, ktorí orežú obsah (overflow hidden / clip), po prvý posuvný kontajner: [{ x, l, t, r, b }] (padding box). */
  function orezavaci(el) {
    var out = [];
    for (var x = el; x && x !== document.documentElement; x = x.parentElement) {
      var c = cs_(x), o = c.overflowX + " " + c.overflowY;
      if (/auto|scroll/.test(o)) break;
      if (/hidden|clip/.test(o)) { var q = x.getBoundingClientRect(), l = q.left + x.clientLeft, t = q.top + x.clientTop;
        out.push({ x: x, l: l, t: t, r: l + (x.clientWidth || q.width), b: t + (x.clientHeight || q.height) }); }
    }
    return out;
  }
  function popis(el) {
    var c = (el.getAttribute("class") || "").trim().split(/\\s+/)[0];
    return el.tagName.toLowerCase() + (c ? "." + c : "") + (el.getAttribute("data-a") ? '[data-a="' + el.getAttribute("data-a") + '"]' : "");
  }
  function rola(el, koren) {
    for (var x = el; x && x !== koren.parentNode; x = x.parentElement) {
      for (var i = 0; i < roly.length; i++) if (x.matches(roly[i][0])) return { r: roly[i][1], z: false };
      for (i = 0; i < spolocne.length; i++) if (x.matches(spolocne[i][0])) return { r: spolocne[i][1], z: true };
      if (x.tagName === "BUTTON" && !x.matches(KARTY)) return { r: "tlacidlo", z: false };
    }
    return { r: getComputedStyle(el).textTransform === "uppercase" ? "stitok" : "text", z: false };
  }
  function blok(el) {
    for (var x = el; x; x = x.parentElement) { var d = getComputedStyle(x).display; if (d !== "inline" && d !== "contents") return x; }
    return document.body;
  }
  korene.forEach(function (sel) {
    [].forEach.call(document.querySelectorAll(sel), function (koren) {
      [koren].concat([].slice.call(koren.querySelectorAll("*"))).forEach(function (el) {
        var t = "", c;
        for (c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3) t += c.textContent;
        t = t.replace(/\\s+/g, " ").trim();
        var jeSelect = el.tagName === "SELECT";
        if (!t && !jeSelect) return;
        if (el.closest(".k-sr, .sr-only, script, style, noscript, option, svg, [hidden]")) return;
        var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
        if (cs.visibility === "hidden" || !el.getClientRects().length || !fs) return; // fs 0 = hotový krok (fajka z ::after)
        if (t.length <= 2 && el.closest('[aria-hidden="true"]')) return; // glyfy ✓ + ! a čísla v ikonách
        n++;
        var ro = rola(el, koren), min = (M[ro.r] || M.pozn)[pc ? 1 : 0];
        if (fs + 0.01 < min) zle.push({ r: ro.r, fs: fs, min: min, el: popis(el), t: t.slice(0, 40), z: ro.z });
        var lh = cs.lineHeight === "normal" ? 1.2 : parseFloat(cs.lineHeight) / fs;
        if (RIAD[ro.r] && lh + 0.005 < RIAD[ro.r]) riadky.push({ el: popis(el), lh: Math.round(lh * 100) / 100, z: ro.z, t: t.slice(0, 30) });
        if (jeSelect) return;
        var b = blok(el), br = b.getBoundingClientRect(), oz = orezavaci(el);
        for (c = el.firstChild; c; c = c.nextSibling) {
          if (c.nodeType !== 3) continue;
          var re = /[^\\s\\-\\/\\u2013\\u2014\\u00b7]+/g, m;
          while ((m = re.exec(c.textContent))) {
            var rg = document.createRange(); rg.setStart(c, m.index); rg.setEnd(c, m.index + m[0].length);
            var tops = {}, rr = rg.getClientRects(), i;
            for (i = 0; i < rr.length; i++) if (rr[i].width > 0) tops[Math.round(rr[i].top)] = 1;
            if (Object.keys(tops).length > 1) zlom.push({ el: popis(el), w: m[0], z: ro.z });
            var r = rg.getBoundingClientRect();
            if (r.width > 0 && (r.right > br.right + 1.5 || r.left < br.left - 1.5) && getComputedStyle(b).textOverflow !== "ellipsis") pretek.push({ el: popis(el), w: m[0], z: ro.z });
            // čiastočne orezané slovo (časť vidno, časť skryje okraj predka s overflow hidden / clip); celé skryté sa nerátajú
            for (i = 0; r.width > 0 && i < oz.length; i++) {
              var p = oz[i], vidno = r.right > p.l + 0.5 && r.left < p.r - 0.5 && r.bottom > p.t + 0.5 && r.top < p.b - 0.5;
              // zvislo tolerancia ~¼ písma: obdĺžnik Range = celá výška písma (ascent + descent), riadok s line-height 1,15–1,3 je nižší
              var vonX = Math.max(r.right - p.r, p.l - r.left), vonY = Math.max(r.bottom - p.b, p.t - r.top);
              if (vidno && (vonX > 1 || vonY > Math.max(2, fs * 0.25)) && cs_(p.x).textOverflow !== "ellipsis") {
                orez.push({ el: popis(el), w: m[0] + " −" + Math.round(Math.max(vonX, vonY)) + " px v " + popis(p.x), z: ro.z }); break;
              }
            }
          }
        }
      });
    });
  });
  return { pc: pc, n: n, zle: zle, riadky: riadky, zlom: zlom, pretek: pretek, orez: orez, strana: document.documentElement.scrollWidth > innerWidth + 1 };
})(${JSON.stringify(korene)}, ${JSON.stringify(roly)}, ${JSON.stringify(spolocne)}, ${JSON.stringify(MIERKA)}, ${JSON.stringify(RIADKOVANIE)}, ${JSON.stringify(KARTY_VOLIEB)})`;
}

/** Krátky text nálezu do výpisu testu. */
export function vypisNalezy(r, len = 8) {
  const f = (x) => x.el + " " + (x.fs != null ? x.fs + " px < " + x.min + " (" + x.r + ")" : x.lh != null ? "line-height " + x.lh : "„" + x.w + "“") + (x.t ? " „" + x.t + "“" : "");
  return (arr) => arr.slice(0, len).map(f).join(" | ") + (arr.length > len ? " … +" + (arr.length - len) : "");
}
