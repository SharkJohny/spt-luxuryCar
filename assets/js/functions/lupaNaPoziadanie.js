// Veľká fotka pre lupu sa sťahuje až vtedy, keď ju zákazník naozaj použije (6. 11. 2026, Michal: stránky rýchlejšie).
// Shoptet main-3g.js pri štarte aj pri prepnutí fotky volá $(".cloud-zoom").CloudZoom() a tá hneď stiahne data-href,
// čiže originál /user/shop/orig/ (0,85 až 2,16 MB na väčšine produktov), aj na telefóne, kde sa lupa neotvára.
// Výmena 249 fotiek by zmenšila len tento súbor, preto sa namiesto nej sťahovanie posúva.
//   - Lupa ostáva spustená, lebo vytvára #wrap, na ktorom je rám fotky (_content.scss, _lcd1v-galeria.scss), a klik
//     na fotku ide cez .mousetrap. Dostane len veľkú fotku z href, ktorú stránka už má.
//   - Telefón a tablet (bez myši): originál sa nestiahne nikdy.
//   - PC: pri prvom prejdení myšou sa lupa spustí znova s originálom pôvodnej fotky.
// Beží pred $(document).ready: luxuryCar.js je za main-3g.js a oba sú pred koncom stránky bez defer.

const ORIG = /\/orig\//;
const ATR = "data-lcd-lupa";

/** Má zariadenie myš? Bez nej sa lupa nedá použiť. */
function maMys(w) {
  try { return w.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) { return false; }
}

/** Obalí $.fn.CloudZoom. -> true, keď sa obalila */
export function lupaNaPoziadanie(w = window) {
  const $ = w.jQuery;
  const povodna = $ && $.fn && $.fn.CloudZoom;
  if (!povodna || povodna.lcdLupa) return false;

  const obal = function (nastavenia) {
    this.filter(".cloud-zoom").each(function () {
      const a = $(this), orig = a.attr("data-href"), big = a.attr("href");
      if (!orig || !big || !ORIG.test(orig)) return;
      a.attr(ATR, orig).attr("data-href", big);
    });
    return povodna.call(this, nastavenia);
  };
  Object.keys(povodna).forEach((k) => { obal[k] = povodna[k]; });
  obal.lcdLupa = true;
  $.fn.CloudZoom = obal;

  if (maMys(w)) {
    $(w.document).on("mouseenter", "#wrap", function () {
      const a = $(this).find("a.cloud-zoom").first(), orig = a.attr(ATR);
      if (!orig) return;
      a.removeAttr(ATR).attr("data-href", orig);
      const zoom = a.data("zoom");
      if (zoom) zoom.destroy();
      povodna.call(a, (w.shoptet && w.shoptet.config && w.shoptet.config.cloudZoomOptions) || {});
    });
  }
  return true;
}
