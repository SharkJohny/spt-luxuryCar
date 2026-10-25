// Samostatné časti bundla (zrýchlenie 25. 10. 2026): kód, ktorý treba len na jednej stránke, nie je v luxuryCar.js,
// ale v js/lcd-<meno>.js tej istej verzie (LCD_ZAKLAD = …/assets/v/<sha>/). Ostatné stránky ho nesťahujú ani neparsujú.
// Časť sa po načítaní sama zapíše do window.__lcdCasti[meno] (napr. truck-konfigurator/cast.jsx). Ak už zapísaná je
// (test v jsdom ju zbalí priamo do bundla), načítanie skončí hneď. Build: .github/workflows/production.yml (druhý esbuild).
import { LCD_ZAKLAD } from "./lcdZaklad.js";

// truck = React kamiónov; gsap / reels / hp = titulka (úloha C 25. 10. 2026, vstupy v assets/js/casti/, docs/rychlost-web.md §1)
const SUBORY = { truck: "js/lcd-truck.js", gsap: "js/lcd-gsap.js", reels: "js/lcd-reels.js", hp: "js/lcd-hp.js" };
const sluby = {};

const zapisana = (meno) => (window.__lcdCasti && window.__lcdCasti[meno]) || null;

/** Promise s API časti; viackrát volané = jedno stiahnutie. Pri chybe siete sa skúsi ešte 2× (po 1,5 s a 3 s). */
export function nacitajCast(meno) {
  if (sluby[meno]) return sluby[meno];
  if (zapisana(meno)) return (sluby[meno] = Promise.resolve(zapisana(meno)));
  sluby[meno] = new Promise((ok, zle) => {
    const pokus = (n) => {
      const s = document.createElement("script");
      s.src = LCD_ZAKLAD + SUBORY[meno];
      s.async = true;
      s.onload = () => (zapisana(meno) ? ok(zapisana(meno)) : zle(new Error("lcd časť " + meno + " sa nezapísala")));
      s.onerror = () => {
        s.remove();
        if (n < 3) setTimeout(() => pokus(n + 1), 1500 * n);
        else zle(new Error("lcd časť " + meno + " sa nenačítala: " + s.src));
      };
      (document.head || document.documentElement).appendChild(s);
    };
    pokus(1);
  });
  sluby[meno].catch(() => { delete sluby[meno]; });
  return sluby[meno];
}
