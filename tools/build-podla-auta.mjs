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

/**
 * Značky abecedne podľa názvu (sk). koho = genitív do karty („Nenašli ste model svojej Škody?“), kto = „do auta Audi“.
 * Počty modelov sa nepíšu (Michal 10. 11. 2026: „aby si ľudia nemysleli, že to nemáme“).
 * pata: true = v pätičke (Michal 10. 11. 2026: 5 najpredávanejších podľa 530 objednávok Back Office — Mercedes 81,
 * Škoda 70, BMW 62, Volkswagen 55, Audi 40). Značka bez áut = stránka len s kartou „Nenašli ste…?“ (kým nepribudne auto).
 */
const ZNACKY = [
  {
    kluc: "audi", nazov: "Audi", logo: "znacky/audi.svg", url: "/autokoberce-audi/", pata: true,
    koho: "svojho Audi", kto: "Audi",
    auta: [
      { nazov: "Audi A6 C7", roky: "roky 2011–2018", cena: 219, url: "/autokoberce-audi-a6-c7/", foto: "1v/auto/audi-a6-c7/audi-a6-c7-auto-w2", w: 480, h: 246 },
    ],
  },
  {
    kluc: "bmw", nazov: "BMW", logo: "znacky/bmw.svg", url: "/autokoberce-bmw/", pata: true,
    koho: "svojho BMW", kto: "BMW",
    // stránky áut zverejnené 12. 11. 2026 (dvojvrstvové kópie 601), autá z hlavných fotiek Witamats (Michal 12. 11.)
    auta: [
      { nazov: "BMW 3 G20/G21", roky: "od roku 2019", cena: 351, url: "/autokoberce-bmw-3-g20-g21/", foto: "1v/auto/bmw-3-g20/bmw-3-g20-auto-w", w: 480, h: 204 },
      { nazov: "BMW 5 G30/G31", roky: "roky 2017–2023", cena: 351, url: "/autokoberce-bmw-5-g30-g31/", foto: "1v/auto/bmw-5-g30/bmw-5-g30-auto-w", w: 480, h: 228 },
      { nazov: "BMW X7 G07", roky: "od roku 2019", cena: 351, url: "/autokoberce-bmw-x7-g07/", foto: "1v/auto/bmw-x7-g07/bmw-x7-g07-auto-w", w: 480, h: 260 },
    ],
  },
  {
    kluc: "volkswagen", nazov: "Volkswagen", logo: "znacky/volkswagen.svg", url: "/autokoberce-volkswagen/", pata: true,
    koho: "svojho Volkswagenu", kto: "Volkswagen",
    auta: [],
  },
  {
    kluc: "mercedes-benz", nazov: "Mercedes-Benz", logo: "znacky/mercedes.svg", url: "/autokoberce-mercedes-benz/", pata: true,
    koho: "svojho Mercedesu",
    auta: [
      { nazov: "Mercedes-Benz triedy V", roky: "W447 od roku 2014", cena: 300, url: "/autokoberce-mercedes-v-class/", foto: "1v/auto/mercedes-v-class/v-class-auto", w: 480, h: 237 },
      { nazov: "Mercedes-Benz GLE", roky: "V167 a Coupé C167 od roku 2019", cena: 219, url: "/autokoberce-mercedes-gle/", foto: "1v/auto/mercedes-gle-v167/mercedes-gle-v167-auto-w", w: 480, h: 259 },
    ],
  },
  {
    kluc: "skoda", nazov: "Škoda", logo: "znacky/skoda.svg", url: "/autokoberce-skoda/", pata: true,
    koho: "svojej Škody",
    auta: [
      // Kodiaq I (produkt 667, kópia 598, 12. 11. 2026): auto = tlačová fotka Škoda Auto (Kodiaq Scout, IAA 2017), uhol ako autá Witamats.
      // Produkt je zatiaľ skrytý (hosť 404) — Popis značky Škoda vkladať až po zverejnení 667.
      { nazov: "Škoda Kodiaq I", roky: "roky 2016–2024", cena: 219, url: "/autokoberce-skoda-kodiaq-i/", foto: "1v/auto/skoda-kodiaq-i/skoda-kodiaq-i-auto-w2", w: 480, h: 259 },
      { nazov: "Škoda Kodiaq II", roky: "od roku 2024", cena: 230, url: "/autokoberce-skoda-kodiaq-ii/", foto: "1v/auto/skoda-kodiaq-ii/kodiaq-ii-auto", w: 480, h: 226 },
    ],
  },
].sort((a, b) => a.nazov.localeCompare(b.nazov, "sk"));

/**
 * Pripravené dlaždice ďalších 5 áut (Michal 12. 11. 2026) — ZATIAĽ VYPNUTÉ, nikam sa nevypisujú (odkaz by viedol na 404).
 * TODO ID po vytvorení v admine: keď produkt v Shoptete existuje (register produkty.js „NOVE-<slug>“ má číslo) a fotka auta
 * je v repe, riadok presunúť do auta[] svojej značky a znova vložiť Popis kategórie značky aj prehľadu.
 * Ceny = cena produktu na webe 12. 11. 2026: jednovrstvové Diamond 598 od 219 €, dvojvrstvové Elite Diamond 601 od 351 €.
 * Audi a GLE: súbory a6-c7-auto / gle-v167-auto v repe ešte nie sú (fotka auta čaká na schválenie).
 */
const PRIPRAVENE = { // eslint-disable-line no-unused-vars
  audi: [
  ],
  bmw: [
  ],
  "mercedes-benz": [
  ],
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cena = (c) => "od " + String(c).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";

function prehlad() {
  const dlazdice = ZNACKY.map((z) =>
    `  <li><a class="lcd-pa__znacka" href="${z.url}"><img src="${IMG}${z.logo}" alt="" width="46" height="46" loading="lazy" decoding="async"><b>${esc(z.nazov)}</b></a></li>`).join("\n");
  return `<div class="lcd-pa lcd-pa--prehlad" data-lcd-cast="podla-auta">
<p class="lcd-pa__uvod">Vyberte značku. Pri každom aute nájdete fotky od našich zákazníkov a konfigurátor s cenou.</p>
<ul class="lcd-pa__znacky">
${dlazdice}
</ul>
<div class="lcd-pa__nenasli lcd-pa__nenasli--siroka">
  <div><b>Nenašli ste model svojho auta?</b><p>Nevadí, nájdete ho tu. Autokoberce máme pre viac ako 1&nbsp;000 modelov áut a cenu uvidíte hneď.</p></div>
  <a class="lcd-pa__tl" href="${KONFIGURATOR}">Nájsť moje auto</a>
</div>
</div>
`;
}

function znacka(z) {
  if (!z.auta.length) {
    // značka bez stránok áut: len široká karta do konfigurátora
    return `<div class="lcd-pa lcd-pa--znacka" data-lcd-cast="podla-auta-${z.kluc}">
<p class="lcd-pa__uvod">Luxusné autokoberce na mieru do auta ${esc(z.kto)}. Model, vzor aj farbu si vyberiete v konfigurátore.</p>
<div class="lcd-pa__nenasli lcd-pa__nenasli--siroka">
  <div><b>Model ${esc(z.koho)} nájdete tu</b><p>Autokoberce máme pre viac ako 1&nbsp;000 modelov áut a cenu uvidíte hneď.</p></div>
  <a class="lcd-pa__tl" href="${KONFIGURATOR}">Nájsť moje auto</a>
</div>
<a class="lcd-pa__spat" href="/autokoberce-podla-auta/">Všetky značky</a>
</div>
`;
  }
  const karty = z.auta.map((a) =>
    `  <li><a class="lcd-pa__auto" href="${a.url}"><span class="lcd-pa__foto"><picture><source type="image/webp" srcset="${IMG}${a.foto}-480.webp 480w, ${IMG}${a.foto}-960.webp 960w" sizes="(max-width: 900px) 45vw, 220px"><img src="${IMG}${a.foto}-480.png" alt="${esc(a.nazov)}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async"></picture></span><b>${esc(a.nazov)}</b><span>${esc(a.roky)}</span><i>${cena(a.cena)}</i></a></li>`).join("\n");
  return `<div class="lcd-pa lcd-pa--znacka" data-lcd-cast="podla-auta-${z.kluc}">
<p class="lcd-pa__uvod">Vyberte model. Na stránke modelu nájdete fotky z auta nášho zákazníka a konfigurátor s cenou.</p>
<ul class="lcd-pa__auta">
${karty}
  <li><div class="lcd-pa__nenasli"><b>Nenašli ste model ${esc(z.koho)}?</b><p>Nevadí, nájdete ho tu. Autokoberce máme pre viac ako 1&nbsp;000 modelov.</p><a class="lcd-pa__tl" href="${KONFIGURATOR}">Nájsť moje auto</a></div></li>
</ul>
<a class="lcd-pa__spat" href="/autokoberce-podla-auta/">Všetky značky</a>
</div>
`;
}

function paticka() {
  const riadky = ZNACKY.filter((z) => z.pata).map((z) =>
    `    <li><a href="${z.url}"><span class="lcd-pa-pata__k"><img src="${IMG}${z.logo}" alt="" width="19" height="19" loading="lazy" decoding="async"></span>${esc(z.nazov)}</a></li>`).join("\n");
  // pätička: posledná položka zoznamu „Nájsť moje auto“ s lupou (návrh C z 12. 11. 2026; zlatý rámik zrušený — odskakoval od pätičky a naťahoval ju)
  // nadpis = odkaz na prehľad značiek (Michal 10. 11. 2026: „prvé čo mi napadlo kliknúť na to“); vzhľad ako ostatné nadpisy
  return `<h4 style="margin-top:22px"><a href="/autokoberce-podla-auta/" style="color:inherit;text-decoration:none">Podľa auta</a></h4>
<ul class="lcd-pa-pata">
${riadky}
    <li><a class="lcd-pa-pata__hladaj" href="${KONFIGURATOR}"><span class="lcd-pa-pata__k"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1f7a52" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></span>Nájsť moje auto</a></li>
</ul>
<p class="lcd-pa-pata__vsetky"><a href="/autokoberce-podla-auta/">Zobraziť ostatné značky</a></p>`;
}

mkdirSync(VYSTUP, { recursive: true });
writeFileSync(join(VYSTUP, "autokoberce-podla-auta.sk.html"), prehlad());
ZNACKY.forEach((z) => writeFileSync(join(VYSTUP, "autokoberce-" + z.kluc + ".sk.html"), znacka(z)));
writeFileSync(join(VYSTUP, "paticka-podla-auta.sk.html"), paticka() + "\n");
console.log("ok: " + (ZNACKY.length + 2) + " súborov v admin-html/podla-auta/");
