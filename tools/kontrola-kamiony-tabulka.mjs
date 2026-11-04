// Prijme web listy kamiony a kamionycs z data.json? Rovnaká kontrola ako na webe, vypíše počty alebo dôvod odmietnutia.
// node tools/kontrola-kamiony-tabulka.mjs
import { nacitajKamiony } from "../assets/js/components/konfigurator1v/kamion/tabulka.js";

const r = await fetch("https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json?t=" + Date.now());
const d = await r.json();
console.log("data.json z " + r.headers.get("last-modified"));
if (d.kamiony === undefined && d.kamionycs === undefined) {
  console.log("Listy v data.json nie sú, web ide zo zoznamu v kóde.");
} else {
  const v = nacitajKamiony(d.kamiony, d.kamionycs);
  if (!v.vozidla) {
    console.log("ODMIETNUTÉ, web ide zo zoznamu v kóde: " + v.chyba);
    process.exit(1);
  }
  const modelov = Object.values(v.vozidla).reduce((n, z) => n + Object.keys(z).length, 0);
  console.log(`OK: ${Object.keys(v.vozidla).length} značiek, ${modelov} modelov.`);
}
