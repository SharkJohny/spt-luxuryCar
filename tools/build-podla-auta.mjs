#!/usr/bin/env node
// Stránky „podľa auta“ (Michal 9. 11. 2026, náhľad schválený): Popisy kategórií SK + stĺpec pätičky.
//   node tools/build-podla-auta.mjs        -> admin-html/podla-auta/*.sk.html
// Výstupy:
//   autokoberce-podla-auta.sk.html   Popis kategórie „Autokoberce podľa auta“ (dlaždice značiek abecedne)
//   autokoberce-<znacka>.sk.html     Popis kategórie značky (malé náhľady áut + „Nenašli ste…?“)
//   paticka-podla-auta.sk.html       časť banneru 5 (pätička „Produkty“) od nadpisu „Podľa auta“
// Štýly: assets/css/_lcdPodlaAuta.scss (blok LCD-PODLA-AUTA). Nová značka = sem do ZNACKY + do CSS (body.in-… a logo).
// Fotky áut: Kodiaq II = obrázok od Michala; trieda V = tlačová fotka Mercedes-Benz AG 24C0048_004 (media.mercedes-benz.com,
// podmienky len na novinárske účely — Michal riziko fotiek výrobcov vedome prijal 9. 11. 2026).
// Nové auto = do auta značky (fotka auta assets/img/1v/auto/<auto>/<meno>-480/-960 .webp + .png, uhol ako Kodiaq II).
// Ceny „od“ = cena produktu na webe (pri zmene ceny upraviť a znova vložiť Popis).
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "..");
const VYSTUP = join(KOREN, "admin-html", "podla-auta");
const IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/";
const KONFIGURATOR = "/luxusne-autokoberce-dragonskin-diamond-line/"; // hlavný konfigurátor (Michal: vždy Diamond Line)

/** Značky abecedne podľa názvu (sk). nenasli = text karty, tvar = koho/čo („ju“ / „ho“). */
const ZNACKY = [
  {
    kluc: "mercedes-benz", nazov: "Mercedes-Benz", logo: "znacky/mercedes.svg", url: "/autokoberce-mercedes-benz/",
    nenasli: "Nenašli ste svoj Mercedes?", tvar: "ho",
    auta: [
      { nazov: "Mercedes-Benz triedy V", roky: "W447 od roku 2014", cena: 300, url: "/autokoberce-mercedes-v-class/", foto: "1v/auto/mercedes-v-class/v-class-auto", w: 480, h: 237 },
    ],
  },
  {
    kluc: "skoda", nazov: "Škoda", logo: "znacky/skoda.svg", url: "/autokoberce-skoda/",
    nenasli: "Nenašli ste svoju Škodu?", tvar: "ju",
    auta: [
      { nazov: "Škoda Kodiaq II", roky: "od roku 2024", cena: 230, url: "/autokoberce-skoda-kodiaq-ii/", foto: "1v/auto/skoda-kodiaq-ii/kodiaq-ii-auto", w: 480, h: 226 },
    ],
  },
].sort((a, b) => a.nazov.localeCompare(b.nazov, "sk"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const modely = (n) => n + " " + (n === 1 ? "model" : n < 5 ? "modely" : "modelov");
const cena = (c) => "od " + String(c).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";

function prehlad() {
  const dlazdice = ZNACKY.map((z) =>
    `  <li><a class="lcd-pa__znacka" href="${z.url}"><img src="${IMG}${z.logo}" alt="" width="46" height="46" loading="lazy" decoding="async"><b>${esc(z.nazov)}</b><span>${modely(z.auta.length)}</span></a></li>`).join("\n");
  return `<div class="lcd-pa lcd-pa--prehlad" data-lcd-cast="podla-auta">
<p class="lcd-pa__uvod">Vyberte značku. Pri každom aute nájdete fotky od našich zákazníkov a konfigurátor s cenou.</p>
<ul class="lcd-pa__znacky">
${dlazdice}
</ul>
<div class="lcd-pa__nenasli lcd-pa__nenasli--siroka">
  <div><b>Nenašli ste svoje auto?</b><p>Autokoberce máme pre viac ako 1 000 modelov áut. Vyberte svoje auto v konfigurátore a hneď uvidíte cenu.</p></div>
  <a class="lcd-pa__tl" href="${KONFIGURATOR}">Vybrať auto</a>
</div>
</div>
`;
}

function znacka(z) {
  const karty = z.auta.map((a) =>
    `  <li><a class="lcd-pa__auto" href="${a.url}"><span class="lcd-pa__foto"><picture><source type="image/webp" srcset="${IMG}${a.foto}-480.webp 480w, ${IMG}${a.foto}-960.webp 960w" sizes="(max-width: 900px) 45vw, 220px"><img src="${IMG}${a.foto}-480.png" alt="${esc(a.nazov)}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async"></picture></span><b>${esc(a.nazov)}</b><span>${esc(a.roky)}</span><i>${cena(a.cena)}</i></a></li>`).join("\n");
  return `<div class="lcd-pa lcd-pa--znacka" data-lcd-cast="podla-auta-${z.kluc}">
<p class="lcd-pa__uvod">Vyberte model. Na stránke modelu nájdete fotky z auta nášho zákazníka a konfigurátor s cenou.</p>
<ul class="lcd-pa__auta">
${karty}
  <li><div class="lcd-pa__nenasli"><b>${esc(z.nenasli)}</b><p>Vyberte ${z.tvar} v konfigurátore, autokoberce máme pre viac ako 1 000 modelov.</p><a class="lcd-pa__tl" href="${KONFIGURATOR}">Vybrať auto</a></div></li>
</ul>
<a class="lcd-pa__spat" href="/autokoberce-podla-auta/">Všetky značky</a>
</div>
`;
}

function paticka() {
  const riadky = ZNACKY.map((z) =>
    `    <li><a href="${z.url}"><span class="lcd-pa-pata__k"><img src="${IMG}${z.logo}" alt="" width="19" height="19" loading="lazy" decoding="async"></span>${esc(z.nazov)}</a></li>`).join("\n");
  return `<h4 style="margin-top:22px">Podľa auta</h4>
<ul class="lcd-pa-pata">
${riadky}
</ul>
<p class="lcd-pa-pata__vsetky"><a href="/autokoberce-podla-auta/">Všetky značky</a></p>
<p class="lcd-pa-pata__nenasli">Nenašli ste svoje auto? <a href="${KONFIGURATOR}">Vyberte ho v konfigurátore</a></p>`;
}

mkdirSync(VYSTUP, { recursive: true });
writeFileSync(join(VYSTUP, "autokoberce-podla-auta.sk.html"), prehlad());
ZNACKY.forEach((z) => writeFileSync(join(VYSTUP, "autokoberce-" + z.kluc + ".sk.html"), znacka(z)));
writeFileSync(join(VYSTUP, "paticka-podla-auta.sk.html"), paticka() + "\n");
console.log("ok: " + (ZNACKY.length + 2) + " súborov v admin-html/podla-auta/");
