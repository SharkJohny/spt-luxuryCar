// Jednotkový test functions/ulozisko.js (30. 10. 2026) — adresy obrázkov z kópií úložísk v CDN repa a zálohy.
// Bez siete a prehliadača; location.hostname sa podstrčí.
//   node tools/test-ulozisko.mjs   (exit 1 = chyba)
//
// obrazokUloziska: súbor v zozname webu -> CDN …/img/ulozisko/<web>/…, mimo zoznamu -> úložisko webu (relatívne, ?verzia).
// obrazokSpolocny: súbor v zozname spoločných -> CDN …/img/ulozisko/spolocne/…, mimo zoznamu (nové meno obrázka ponuky
// v data.json) -> úložisko webu, na ktorom stránka beží (predtým CDN 404 bez zálohy).
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/ulozisko/";
globalThis.location = { hostname: "www.luxurycardesign.sk" };
const U = await import(pathToFileURL(join(KOREN, "assets/js/functions/ulozisko.js")).href);
const D = await import(pathToFileURL(join(KOREN, "assets/js/functions/ulozisko-data.js")).href);

let ok = 0, zle = 0;
function over(podmienka, popis) {
  if (podmienka) { ok++; console.log("✓ " + popis); } else { zle++; console.log("✗ " + popis); }
}

over(U.ULOZISKO_CDN === CDN, "základ CDN = …/assets/img/ulozisko/ (spoločný, nie priečinok verzie)");

// ------------------------------------------------------------------ obrazokUloziska
location.hostname = "www.luxurycardesign.sk";
over(U.obrazokUloziska("config/lux-color-01.jpg", "15") === CDN + "www.luxurycardesign.sk/config/lux-color-01.jpg", "SK: lux-color-01 z CDN SK, bez ?15");
location.hostname = "www.luxurycardesign.cz";
over(U.obrazokUloziska("config/lux-color-01.jpg", "15") === CDN + "www.luxurycardesign.cz/config/lux-color-01.jpg", "CZ: lux-color-01 z CDN CZ (iné bajty ako SK)");
over(U.obrazokUloziska("config/nova-farba-xyz.jpg", "15") === "/user/documents/upload/assets/config/nova-farba-xyz.jpg?15", "mimo zoznamu: záloha z úložiska webu s ?15");
location.hostname = "www.luxurycardesign.pl";
over(U.obrazokUloziska("config/lux-color-01.jpg") === "/user/documents/upload/assets/config/lux-color-01.jpg", "nový trh bez priečinka: úložisko webu (kód sa nemení)");

// ------------------------------------------------------------------ obrazokSpolocny
over(Array.isArray(D.ULOZISKO_SPOLOCNE) && D.ULOZISKO_SPOLOCNE.length > 0, "ulozisko-data.js má zoznam ULOZISKO_SPOLOCNE (" + (D.ULOZISKO_SPOLOCNE || []).length + ")");
over((D.ULOZISKO_SPOLOCNE || []).every((z) => existsSync(join(KOREN, "assets/img/ulozisko/spolocne", ...z.split(">").pop().split("/")))), "každý spoločný súbor zo zoznamu je v repe");
for (const web of ["www.luxurycardesign.sk", "www.luxurycardesign.cz"]) {
  location.hostname = web;
  over(U.obrazokSpolocny("new/base-p.jpg") === CDN + "spolocne/new/base-p.jpg", web + ": new/base-p.jpg z CDN spolocne/");
  over(U.obrazokSpolocny("config/D-1.jpg") === CDN + "spolocne/config/D-1.jpg", web + ": vzorka D-1 z CDN spolocne/");
  over(U.obrazokSpolocny("new/base-p-2027.jpg") === "/user/documents/upload/assets/new/base-p-2027.jpg",
    web + ": nové meno v data.json (mimo zoznamu) -> záloha z úložiska webu, nie 404 z CDN");
}

console.log(`\n${ok} ok, ${zle} zle`);
process.exit(zle ? 1 : 0);
