// Vstup samostatnej časti js/lcd-hp.js (functions/lcdCasti.js, úloha C 25. 10. 2026): záložný markup titulky SK/CZ
// (~170 kB, prenos ~20 kB) mimo luxuryCar.js. Treba ho len vtedy, keď v HTML chýbajú statické korene titulky z adminu
// ([data-lcd-cast^="hp-"]) — lcdHome.js ho potom stiahne a titulku nakreslí ako doteraz.
import { LCDH_MARKUP, LCDH_MARKUP_CZ } from "../lcdHome-markup.js";

(window.__lcdCasti = window.__lcdCasti || {}).hp = { LCDH_MARKUP, LCDH_MARKUP_CZ };
