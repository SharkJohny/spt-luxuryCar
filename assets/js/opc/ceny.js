// One page checkout: ceny v pokladni v tvare „591 €“, nie „€591“ (Michal 1. 11. 2026 schválil náhľad
// kontrola-pokladne/nahlady/nahlad-pc-1366-sk.png; rovnaký tvar ako nový vzhľad produktu, docs/1v-obsah.md r. 490).
//
// SK admin má symbol meny vľavo, preto server píše „€591“ v súhrne, v kartách dopravy a platby aj v košíku a rovnako ich
// píše vzhlad.cenaText (tvar zo shoptet.config). Tu sa po každej zmene prepíšu TEXTOVÉ UZLY v pokladni (formulár, súhrn,
// lišta dole, zbalený súhrn) — mení sa len zápis na obrazovke, číslo ostáva. Hodnoty polí, atribúty, text v poli
// poznámky ani skripty sa nemenia. Naše porovnania súm idú cez čísla (vzhlad.cisloZCeny číta oba tvary), takže kontroly
// pred odoslaním tvar textu neovplyvní. CZ („15 545 Kč“) vzoru nevyhovuje — nič sa nezmení, kód je pre SK aj CZ rovnaký.
// MutationObserver beží pred vykreslením (mikroúloha), prebliknutie „€591“ preto nevznikne.

/** Kde sa ceny prepisujú (krok 2 pokladne). */
export const KORENE_CIEN = "#order-form, #checkoutSidebar, .lcd-opc-lista, #lcd-opc-zbalene";
/** V týchto prvkoch sa text nemení (text, ktorý píše zákazník, výber, skripty). */
const BEZ_ZMENY = /^(TEXTAREA|SCRIPT|STYLE|OPTION|NOSCRIPT|TEMPLATE)$/;
// „€591“, „€ 1 269“, „€5,50“ — číslo s medzerami po tisícoch a desatinnou čiarkou; za ním nesmie pokračovať číslica
// (čiarka ako interpunkcia „€3, spolu“ áno)
const VZOR = /€[ \u00a0\u202f]?(\d{1,3}(?:[ \u00a0\u202f]\d{3})*(?:,\d{1,2})?)(?!\d|,\d)/g;

/** „€591“ -> „591 €“, „€1 269“ -> „1 269 €“, „€5,50“ -> „5,50 €“, „−€79“ -> „−79 €“ (pred € nezalomiteľná medzera). */
export function tvarCeny(text) {
  const t = String(text == null ? "" : text);
  return t.indexOf("€") < 0 ? t : t.replace(VZOR, function (_, cislo) { return cislo + "\u00a0€"; });
}

function prepisUzol(uzol, korene) {
  const v = uzol.nodeValue;
  if (!v || v.indexOf("€") < 0) return 0;
  const rodic = uzol.parentElement;
  if (!rodic || BEZ_ZMENY.test(rodic.tagName) || rodic.isContentEditable || !rodic.closest(korene)) return 0;
  const n = tvarCeny(v);
  if (n === v) return 0;
  uzol.nodeValue = n;
  return 1;
}

/** Prepíše ceny v textových uzloch pod `koren` (len tie, ktoré sú v KORENE_CIEN). -> počet zmenených uzlov */
export function prepisCeny(koren, korene) {
  const k = korene || KORENE_CIEN;
  if (!koren) return 0;
  if (koren.nodeType === 3) return prepisUzol(koren, k);
  if (koren.nodeType !== 1 && koren.nodeType !== 9) return 0;
  const doc = koren.ownerDocument || koren;
  const w = doc.createTreeWalker(koren, 4 /* NodeFilter.SHOW_TEXT */);
  let pocet = 0;
  for (let u = w.nextNode(); u; u = w.nextNode()) pocet += prepisUzol(u, k);
  return pocet;
}

/**
 * Prepíše ceny teraz a potom pri každej zmene stránky (nový súhrn zo servera, karta košíka, doprava a platba, lišta).
 * Zmena textu z prepisu už vzoru nevyhovuje, takže sa nezacyklí. -> { stop() }
 */
export function strazCeny(doc, korene) {
  const d = doc || document;
  const k = korene || KORENE_CIEN;
  const telo = d.body || d.documentElement;
  if (!telo) return { stop: function () {} };
  prepisCeny(telo, k);
  const Okno = d.defaultView;
  if (!Okno || typeof Okno.MutationObserver !== "function") return { stop: function () {} };
  const mo = new Okno.MutationObserver(function (zaznamy) {
    for (const z of zaznamy) {
      if (z.type === "characterData") prepisCeny(z.target, k);
      else for (const n of z.addedNodes) prepisCeny(n, k);
    }
  });
  mo.observe(telo, { subtree: true, childList: true, characterData: true });
  return { stop: function () { mo.disconnect(); } };
}
