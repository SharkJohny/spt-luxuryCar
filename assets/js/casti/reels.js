// Vstup samostatnej časti js/lcd-reels.js (functions/lcdCasti.js, úloha C 25. 10. 2026): zoznam reels z YouTube pre pás
// videí na titulke (modul 07, ~85 kB, prenos ~23 kB) mimo luxuryCar.js. lcdHome.js ho stiahne, keď sa pás priblíži.
import { LCDH_REELS, LCDH_REELS_CZ } from "../lcdHome-reels.js";

(window.__lcdCasti = window.__lcdCasti || {}).reels = { LCDH_REELS, LCDH_REELS_CZ };
