// Vstup samostatnej časti js/lcd-gsap.js (functions/lcdCasti.js, úloha C 25. 10. 2026): GSAP + ScrollTrigger (~110 kB,
// prenos ~47 kB) mimo luxuryCar.js. Používa ho len PC titulka v module Materiál (lcdHome.js lcdhStOn). Nič sa tu
// nespúšťa — registráciu pluginu robí lcdHome.js (lcdhStRegistruj) až pri vytvorení ScrollTriggera.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

(window.__lcdCasti = window.__lcdCasti || {}).gsap = { gsap, ScrollTrigger };
