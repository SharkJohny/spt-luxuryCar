// Prijme web taby kamiony a kamionycs z data.json? Rovnaká kontrola ako na webe, vypíše počty alebo dôvod odmietnutia.
// node tools/kontrola-kamiony-tabulka.mjs
import { kamionyZDat } from "../assets/js/components/konfigurator1v/kamion/tabulka.js";
import { VOZIDLA } from "../assets/js/components/konfigurator1v/kamion/data.js";

const r = await fetch("https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json?t=" + Date.now());
const d = await r.json();
console.log("data.json z " + r.headers.get("last-modified"));
if (!kamionyZDat(d)) {
  console.log("Web ide zo zoznamu v kóde (taby v data.json nie sú alebo nesedia, dôvod je vyššie).");
  process.exit(1);
}
const modelov = Object.values(VOZIDLA).reduce((n, z) => n + Object.keys(z).length, 0);
console.log(`OK: ${Object.keys(VOZIDLA).length} značiek, ${modelov} modelov.`);
