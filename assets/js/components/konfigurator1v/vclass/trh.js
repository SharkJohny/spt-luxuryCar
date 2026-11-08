// Trh konfigurátora triedy V: SK (data.js, texty priamo v kóde) alebo CZ (data-cz.js, texty-cz.js). app.js ho nastaví pri štarte
// podľa ctx.jazyk (CZ projekt 581408 = "cs"), ostatné moduly časti (obsah.js, boxy.js, druha.js, sken.js) sa ho len pýtajú.
// SK: t(text) vráti presne ten istý text (aj s dosadením {0}, {1} …), správanie SK sa tým nemení.
import * as SK from "./data.js";
import * as CZ from "./data-cz.js";
import { TEXTY_CZ } from "./texty-cz.js";

let trh = "sk";

/** "cz" pre český web, inak "sk". */
export function nastavTrh(t) { trh = t === "cz" ? "cz" : "sk"; }
export const jeCz = () => trh === "cz";
/** Údaje trhu (tvar data.js): mená príplatkov, hodnoty, kroky, ceny „Samostatne“. */
export const dataTrhu = (t) => (t === "cz" ? CZ : SK);
export const data = () => dataTrhu(trh);

/** Text pre zákazníka: SK bez zmeny, CZ z TEXTY_CZ. {0}, {1} … sa nahradia ďalšími argumentmi. */
export function t(s) {
  let x = trh === "cz" && TEXTY_CZ.has(s) ? TEXTY_CZ.get(s) : s;
  for (let i = 1; i < arguments.length; i++) x = x.split("{" + (i - 1) + "}").join(String(arguments[i]));
  return x;
}

/** Cena v tvare webu: „1 300 €“ / „32 500 Kč“ (nezlomiteľná medzera ako doteraz). */
export const cenaText = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, " ") + " " + (trh === "cz" ? "Kč" : "€");
