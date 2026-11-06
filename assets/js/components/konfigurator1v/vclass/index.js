// Konfigurátor Mercedes triedy V (SK 646, zatiaľ skrytý produkt v kategórii Test, vidí ho len prihlásený admin).
// Do hlavného súboru webu ide len táto brána, samotný konfigurátor je časť js/lcd-vclass.js (app.js). Keď sa časť nenačíta
// alebo zlyhá, ostane natívny formulár Shoptetu so selectmi príplatkov a dá sa objednať aj tak.
import { nacitajCast } from "../../../functions/lcdCasti.js";

export const MENO = "vclass";
let bezi = null;

/** @param {ReturnType<import("../ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  nacitajCast("vclass")
    .then(function (cast) { bezi = cast.spusti(ctx); })
    .catch(function (e) {
      ctx.chyby.push("vclass: " + ((e && e.message) || e));
      console.error("[lcd-1v] vclass", e);
      if (ctx.zlozit) ctx.zlozit();
    });
}

export function zlozit() {
  if (bezi) bezi.zrus();
  bezi = null;
}
