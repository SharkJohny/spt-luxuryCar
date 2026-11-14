#!/usr/bin/env node
// Stránky „podľa auta“ (Michal 9. 11. 2026, náhľad schválený): Popisy kategórií SK + stĺpec pätičky.
//   node tools/build-podla-auta.mjs        -> admin-html/podla-auta/*.sk.html + *.cz.html
// Výstupy:
//   autokoberce-podla-auta.sk.html   Popis kategórie „Autokoberce podľa auta“ (dlaždice značiek abecedne)
//   autokoberce-<znacka>.sk.html     Popis kategórie značky (malé náhľady áut + „Nenašli ste…?“)
//   paticka-podla-auta.sk.html       časť banneru 5 (pätička „Produkty“) od nadpisu „Podľa auta“
// CZ (Michal 12. 11. 2026: „oba weby majú byť úplne totožne rovnaké“) — to isté po česky, ceny v Kč:
//   autokoberce-podle-auta.cz.html   Popis CZ kategórie „Autokoberce podle auta“ (/autokoberce-podle-auta/)
//   autokoberce-<znacka>.cz.html     Popis CZ kategórie „Autokoberce <Značka>“ (/autokoberce-<znacka>/, adresy ako SK)
//   paticka-podla-auta.cz.html       časť CZ banneru „Produkty“ od nadpisu „Podle auta“ (nahradí dnešné „Podle auta“ + zoznam)
//   Dlaždica auta sa na CZ vypíše, až keď má CZ produkt číslo (CZ_AUTA[url].id) — dovtedy by viedla na 404.
//   CZ kategórie ani CZ pätičku nevkladať, kým v CZ admine nie sú kategórie (inak odkazy na 404).
// Štýly: assets/css/_lcdPodlaAuta.scss (blok LCD-PODLA-AUTA). Nová značka = sem do ZNACKY + do CSS (body.in-… a logo).
// Fotky áut (od 13. 11. 2026 všetky biele, predkom DOĽAVA, nezrkadlené — Michal): trieda V = tlačová fotka Mercedes-Benz AG
// 23C0247_1202 (media.mercedes-benz.com), Kodiaq II = Škoda Storyboard 61_Skoda_Kodiaq_iV (vystrihnuté rembg isnet-general-use);
// podmienky tlačových fotiek len na novinárske účely — Michal riziko fotiek výrobcov vedome prijal 9. 11. 2026.
// Nové auto = do auta značky (fotka auta assets/img/1v/auto/<auto>/<meno>-480/-960 .webp + .png, biele, predok doľava).
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
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Audi Q7 4M", roky: "od roku 2015", cena: 219, url: "/autokoberce-audi-q7-4m/", foto: "1v/auto/audi-q7-4m/audi-q7-4m-auto-w", w: 480, h: 254 },
      { nazov: "Audi Q8", roky: "od roku 2018", cena: 219, url: "/autokoberce-audi-q8/", foto: "1v/auto/audi-q8/audi-q8-auto-w", w: 480, h: 208 },
    ],
  },
  {
    kluc: "bmw", nazov: "BMW", logo: "znacky/bmw.svg", url: "/autokoberce-bmw/", pata: true,
    koho: "svojho BMW", kto: "BMW",
    // stránky áut zverejnené 12. 11. 2026 (dvojvrstvové kópie 601), autá z hlavných fotiek Witamats (Michal 12. 11.)
    auta: [
      { nazov: "BMW 3 G20/G21", roky: "od roku 2019", cena: 219, url: "/autokoberce-bmw-3-g20-g21/", foto: "1v/auto/bmw-3-g20/bmw-3-g20-auto-w", w: 480, h: 204 },
      { nazov: "BMW 5 G30/G31", roky: "roky 2017–2023", cena: 219, url: "/autokoberce-bmw-5-g30-g31/", foto: "1v/auto/bmw-5-g30/bmw-5-g30-auto-w", w: 480, h: 228 },
      { nazov: "BMW X7 G07", roky: "od roku 2019", cena: 219, url: "/autokoberce-bmw-x7-g07/", foto: "1v/auto/bmw-x7-g07/bmw-x7-g07-auto-w", w: 480, h: 260 },
    ],
  },
  {
    kluc: "volkswagen", nazov: "Volkswagen", logo: "znacky/volkswagen.svg", url: "/autokoberce-volkswagen/", pata: true,
    koho: "svojho Volkswagenu", kto: "Volkswagen",
    auta: [
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Volkswagen Touareg III", roky: "od roku 2018", cena: 219, url: "/autokoberce-volkswagen-touareg-iii/", foto: "1v/auto/volkswagen-touareg-iii/volkswagen-touareg-iii-auto-w", w: 480, h: 205 },
      { nazov: "Volkswagen Passat B8", roky: "roky 2014–2023", cena: 219, url: "/autokoberce-volkswagen-passat-b8/", foto: "1v/auto/volkswagen-passat-b8/volkswagen-passat-b8-auto-w", w: 480, h: 176 },
    ],
  },
  {
    kluc: "mercedes-benz", nazov: "Mercedes-Benz", logo: "znacky/mercedes.svg", url: "/autokoberce-mercedes-benz/", pata: true,
    koho: "svojho Mercedesu",
    auta: [
      { nazov: "Mercedes-Benz triedy V", roky: "W447 od roku 2014", cena: 300, url: "/autokoberce-mercedes-v-class/", foto: "1v/auto/mercedes-v-class/v-class-auto-w", w: 480, h: 291 },
      { nazov: "Mercedes-Benz GLE", roky: "V167 a Coupé C167 od roku 2019", cena: 219, url: "/autokoberce-mercedes-gle/", foto: "1v/auto/mercedes-gle-v167/mercedes-gle-v167-auto-w", w: 480, h: 259 },
      { nazov: "Mercedes-Benz triedy G", roky: "W463, roky 2018–2024", cena: 219, url: "/autokoberce-mercedes-g-class/", foto: "1v/auto/mercedes-g-class-w463/mercedes-g-class-w463-auto-w", w: 480, h: 297 },
      { nazov: "Mercedes-Benz GLS", roky: "X167 od roku 2019", cena: 219, url: "/autokoberce-mercedes-gls/", foto: "1v/auto/mercedes-gls-x167/mercedes-gls-x167-auto-w", w: 480, h: 246 },
      { nazov: "Mercedes-Benz EQE SUV", roky: "X294 od roku 2022", cena: 219, url: "/autokoberce-mercedes-eqe-suv/", foto: "1v/auto/mercedes-eqe/mercedes-eqe-auto-w", w: 480, h: 257 },
    ],
  },
  {
    kluc: "skoda", nazov: "Škoda", logo: "znacky/skoda.svg", url: "/autokoberce-skoda/", pata: true,
    koho: "svojej Škody",
    auta: [
      // Kodiaq I (produkt 667, kópia 598, 12. 11. 2026): auto = tlačová fotka Škoda Auto (Kodiaq Scout, IAA 2017), uhol ako autá Witamats.
      // Produkt je zatiaľ skrytý (hosť 404) — Popis značky Škoda vkladať až po zverejnení 667.
      { nazov: "Škoda Kodiaq I", roky: "roky 2016–2024", cena: 219, url: "/autokoberce-skoda-kodiaq-i/", foto: "1v/auto/skoda-kodiaq-i/skoda-kodiaq-i-auto-w2", w: 480, h: 259 },
      { nazov: "Škoda Kodiaq II", roky: "od roku 2024", cena: 230, url: "/autokoberce-skoda-kodiaq-ii/", foto: "1v/auto/skoda-kodiaq-ii/kodiaq-ii-auto-w", w: 480, h: 258 },
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Škoda Superb III", roky: "roky 2015–2023", cena: 219, url: "/autokoberce-skoda-superb-iii/", foto: "1v/auto/skoda-superb-iii/skoda-superb-iii-auto-w", w: 480, h: 194 },
      { nazov: "Škoda Octavia II", roky: "roky 2004–2013", cena: 219, url: "/autokoberce-skoda-octavia-ii/", foto: "1v/auto/skoda-octavia-ii/skoda-octavia-ii-auto-w", w: 480, h: 260 },
      { nazov: "Škoda Octavia III", roky: "roky 2013–2020", cena: 219, url: "/autokoberce-skoda-octavia-iii/", foto: "1v/auto/skoda-octavia-iii/skoda-octavia-iii-auto-w", w: 480, h: 225 },
      { nazov: "Škoda Karoq", roky: "od roku 2017", cena: 219, url: "/autokoberce-skoda-karoq/", foto: "1v/auto/skoda-karoq/skoda-karoq-auto-w", w: 480, h: 230 },
    ],
  },
  {
    kluc: "dodge", nazov: "Dodge", logo: "znacky/dodge.svg", url: "/autokoberce-dodge/", pata: false,
    koho: "svojho Dodge", kto: "Dodge",
    auta: [
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Dodge Challenger", roky: "roky 2008–2023", cena: 219, url: "/autokoberce-dodge-challenger/", foto: "1v/auto/dodge-challenger/dodge-challenger-auto-w", w: 480, h: 215 },
    ],
  },
  {
    kluc: "toyota", nazov: "Toyota", logo: "znacky/toyota.svg", url: "/autokoberce-toyota/", pata: false,
    koho: "svojej Toyoty", kto: "Toyota",
    auta: [
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Toyota RAV4 V", roky: "roky 2018–2025", cena: 219, url: "/autokoberce-toyota-rav4-v/", foto: "1v/auto/toyota-rav4-v/toyota-rav4-v-auto-w", w: 480, h: 263 },
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

/**
 * CZ web (luxurycardesign.cz): značky — koho/kto po česky; autá podľa SK adresy (CZ kópia má tú istú adresu ako SK, ako
 * trieda V 2458). id = číslo CZ produktu: null = CZ produkt ešte nie je -> dlaždica sa na CZ NEVYPÍŠE (odkaz by viedol na 404).
 * TODO ID CZ po vytvorení v admine: doplniť id (rovnaké ako v registri produkty.js, sekcia 581408) a znova vložiť Popisy
 * CZ kategórií. cena = „od“ v Kč podľa CZ základného produktu naživo 12. 11. 2026: jednovrstvové Diamond 2403 od 5 664 Kč,
 * Stripe 2418 od 5 799 Kč (Kodiaq II = kópia Stripe), dvojvrstvové Elite Diamond 2406 od 8 799 Kč, trieda V 2458 od 7 500 Kč.
 * Auto zo ZNACKY bez riadku tu sa na CZ nevypíše (build to vypíše ako upozornenie).
 */
const CZ_ZNACKY = {
  audi: { koho: "svého Audi", kto: "Audi" },
  bmw: { koho: "svého BMW", kto: "BMW" },
  "mercedes-benz": { koho: "svého Mercedesu", kto: "Mercedes-Benz" },
  skoda: { koho: "své Škody", kto: "Škoda" },
  volkswagen: { koho: "svého Volkswagenu", kto: "Volkswagen" },
  dodge: { koho: "svého Dodge", kto: "Dodge" },
  toyota: { koho: "své Toyoty", kto: "Toyota" },
};
const CZ_AUTA = {
  "/autokoberce-audi-a6-c7/": { id: 2466, cena: 5664 },
  "/autokoberce-bmw-3-g20-g21/": { id: 2619, cena: 5664 },
  "/autokoberce-bmw-5-g30-g31/": { id: 2622, cena: 5664 },
  "/autokoberce-bmw-x7-g07/": { id: 2625, cena: 5664 },
  "/autokoberce-mercedes-v-class/": { id: 2458, cena: 7500, nazov: "Mercedes-Benz V-Class" },
  "/autokoberce-mercedes-gle/": { id: 2469, cena: 5664 },
  "/autokoberce-mercedes-g-class/": { id: 2628, cena: 5664, nazov: "Mercedes-Benz G-Class" },
  "/autokoberce-mercedes-gls/": { id: 2631, cena: 5664 },
  "/autokoberce-mercedes-eqe-suv/": { id: 2634, cena: 5664 },
  "/autokoberce-skoda-kodiaq-i/": { id: 2463, cena: 5664 },
  "/autokoberce-skoda-kodiaq-ii/": { id: 2460, cena: 5799 },
  "/autokoberce-skoda-superb-iii/": { id: 2553, cena: 5664 },
  "/autokoberce-skoda-octavia-ii/": { id: 2556, cena: 5664 },
  "/autokoberce-skoda-octavia-iii/": { id: 2559, cena: 5664 },
  "/autokoberce-skoda-karoq/": { id: 2562, cena: 5664 },
  "/autokoberce-volkswagen-touareg-iii/": { id: 2565, cena: 5664 },
  "/autokoberce-volkswagen-passat-b8/": { id: 2568, cena: 5664 },
  "/autokoberce-audi-q7-4m/": { id: 2571, cena: 5664 },
  "/autokoberce-audi-q8/": { id: 2574, cena: 5664 },
  "/autokoberce-dodge-challenger/": { id: 2577, cena: 5664 },
  "/autokoberce-toyota-rav4-v/": { id: 2580, cena: 5664 },
};

/** Texty a adresy webu. SK = presne doterajší výstup (zmena SK textu = zmena SK Popisu). */
const WEB = {
  sk: {
    prehladUrl: "/autokoberce-podla-auta/", prehladSubor: "autokoberce-podla-auta",
    uvodPrehlad: "Vyberte značku. Pri každom aute nájdete fotky od našich zákazníkov a konfigurátor s cenou.",
    nenasliAuto: "<b>Nenašli ste model svojho auta?</b><p>Nevadí, nájdete ho tu. Autokoberce máme pre viac ako 1&nbsp;000 modelov áut a cenu uvidíte hneď.</p>",
    najst: "Nájsť moje auto",
    inyModel: "Iný model?", nenasliSiroka: "Nenašli ste svoje auto?", vyhladat: "Vyhľadať",
    modelBezNadpis: (koho) => `Model ${koho} nájdete tu`,
    uvodBez: (kto) => `Luxusné autokoberce na mieru do auta ${kto}. Model, vzor aj farbu si vyberiete v konfigurátore.`,
    modelBez: (koho) => `<b>Model ${koho} nájdete tu</b><p>Autokoberce máme pre viac ako 1&nbsp;000 modelov áut a cenu uvidíte hneď.</p>`,
    vsetky: "Všetky značky",
    uvodZnacka: "Vyberte model. Na stránke modelu nájdete fotky, ročníky a konfigurátor s cenou.",
    nenasliZnacka: (koho) => `<b>Nenašli ste model ${koho}?</b><p>Nevadí, nájdete ho tu. Autokoberce máme pre viac ako 1&nbsp;000 modelov.</p>`,
    pata: "Podľa auta", pataVsetky: "Zobraziť ostatné značky",
    cena: (c) => "od " + String(c).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €",
  },
  cz: {
    prehladUrl: "/autokoberce-podle-auta/", prehladSubor: "autokoberce-podle-auta",
    uvodPrehlad: "Vyberte značku. U každého auta najdete fotky od našich zákazníků a konfigurátor s cenou.",
    nenasliAuto: "<b>Nenašli jste model svého auta?</b><p>Nevadí, najdete ho tady. Autokoberce máme pro více než 1&nbsp;000 modelů aut a cenu uvidíte hned.</p>",
    najst: "Najít moje auto",
    inyModel: "Jiný model?", nenasliSiroka: "Nenašli jste své auto?", vyhladat: "Vyhledat",
    modelBezNadpis: (koho) => `Model ${koho} najdete tady`,
    uvodBez: (kto) => `Luxusní autokoberce na míru do auta ${kto}. Model, vzor i barvu si vyberete v konfigurátoru.`,
    modelBez: (koho) => `<b>Model ${koho} najdete tady</b><p>Autokoberce máme pro více než 1&nbsp;000 modelů aut a cenu uvidíte hned.</p>`,
    vsetky: "Všechny značky",
    uvodZnacka: "Vyberte model. Na stránce modelu najdete fotky, ročníky a konfigurátor s cenou.",
    nenasliZnacka: (koho) => `<b>Nenašli jste model ${koho}?</b><p>Nevadí, najdete ho tady. Autokoberce máme pro více než 1&nbsp;000 modelů.</p>`,
    pata: "Podle auta", pataVsetky: "Zobrazit ostatní značky",
    cena: (c) => "od " + String(c).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Kč",
  },
};

// „Iný model?“ (návrh B, Michal 13. 11. 2026): zlatá ikona auta so zeleným „+“, celá dlaždica je odkaz do konfigurátora
const IKONA_AUTO = '<svg viewBox="0 0 72 34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M4 24v-5l7-2 9-8h22l10 8 12 2 4 3v4h-6"/><path d="M15 26H4"/><path d="M58 26H25"/><circle cx="20" cy="26" r="5"/><circle cx="54" cy="26" r="5"/><path d="M24 9l-4 8h31l-9-8z"/></svg>';
const iny = (nadpis, tl, siroka) => `<a class="lcd-pa__iny${siroka ? " lcd-pa__iny--siroka" : ""}" href="${KONFIGURATOR}"><span class="lcd-pa__iny-ik">${IKONA_AUTO}<i>+</i></span><b>${nadpis}</b><span class="lcd-pa__iny-tl">${tl}</span></a>`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const upozornenia = [];

/** Značky pre web: SK bez zmeny; CZ = české koho/kto a len autá s CZ produktom (id), cena v Kč, abecedne (cs). */
function znackyWebu(web) {
  if (web === "sk") return ZNACKY;
  return ZNACKY.map((z) => {
    const c = CZ_ZNACKY[z.kluc];
    if (!c) throw new Error("CZ_ZNACKY: chýba značka " + z.kluc);
    const auta = z.auta.flatMap((a) => {
      const x = CZ_AUTA[a.url];
      if (!x) { upozornenia.push(`CZ: ${a.nazov} (${a.url}) nemá riadok v CZ_AUTA — na CZ sa nevypíše`); return []; }
      return x.id ? [Object.assign({}, a, { nazov: x.nazov || a.nazov, roky: x.roky || a.roky, url: x.url || a.url, cena: x.cena })] : [];
    });
    return Object.assign({}, z, c, { auta });
  }).sort((a, b) => a.nazov.localeCompare(b.nazov, "cs"));
}

function prehlad(web) {
  const T = WEB[web];
  const dlazdice = znackyWebu(web).map((z) =>
    `  <li><a class="lcd-pa__znacka" href="${z.url}"><img src="${IMG}${z.logo}" alt="" width="46" height="46" loading="lazy" decoding="async"><b>${esc(z.nazov)}</b></a></li>`).join("\n");
  return `<div class="lcd-pa lcd-pa--prehlad" data-lcd-cast="podla-auta">
<p class="lcd-pa__uvod">${T.uvodPrehlad}</p>
<ul class="lcd-pa__znacky">
${dlazdice}
</ul>
${iny(T.nenasliSiroka, T.vyhladat, true)}
</div>
`;
}

function znacka(z, web) {
  const T = WEB[web];
  if (!z.auta.length) {
    // značka bez stránok áut: len široká karta do konfigurátora
    return `<div class="lcd-pa lcd-pa--znacka" data-lcd-cast="podla-auta-${z.kluc}">
<p class="lcd-pa__uvod">${T.uvodBez(esc(z.kto))}</p>
${iny(T.modelBezNadpis(esc(z.koho)), T.vyhladat, true)}
<a class="lcd-pa__spat" href="${T.prehladUrl}">${T.vsetky}</a>
</div>
`;
  }
  const karty = z.auta.map((a) =>
    `  <li><a class="lcd-pa__auto" href="${a.url}"><span class="lcd-pa__foto"><picture><source type="image/webp" srcset="${IMG}${a.foto}-480.webp 480w, ${IMG}${a.foto}-960.webp 960w" sizes="(max-width: 900px) 45vw, 220px"><img src="${IMG}${a.foto}-480.png" alt="${esc(a.nazov)}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async"></picture></span><b>${esc(a.nazov)}</b><span>${esc(a.roky)}</span><i>${T.cena(a.cena)}</i></a></li>`).join("\n");
  return `<div class="lcd-pa lcd-pa--znacka" data-lcd-cast="podla-auta-${z.kluc}">
<p class="lcd-pa__uvod">${T.uvodZnacka}</p>
<ul class="lcd-pa__auta">
${karty}
  <li>${iny(T.inyModel, T.vyhladat, false)}</li>
</ul>
<a class="lcd-pa__spat" href="${T.prehladUrl}">${T.vsetky}</a>
</div>
`;
}

function paticka(web) {
  const T = WEB[web];
  const riadky = znackyWebu(web).filter((z) => z.pata).map((z) =>
    `    <li><a href="${z.url}"><span class="lcd-pa-pata__k"><img src="${IMG}${z.logo}" alt="" width="19" height="19" loading="lazy" decoding="async"></span>${esc(z.nazov)}</a></li>`).join("\n");
  // pätička: posledná položka zoznamu „Nájsť moje auto“ s lupou (návrh C z 12. 11. 2026; zlatý rámik zrušený — odskakoval od pätičky a naťahoval ju)
  // nadpis = odkaz na prehľad značiek (Michal 10. 11. 2026: „prvé čo mi napadlo kliknúť na to“); vzhľad ako ostatné nadpisy
  return `<h4 style="margin-top:22px"><a href="${T.prehladUrl}" style="color:inherit;text-decoration:none">${T.pata}</a></h4>
<ul class="lcd-pa-pata">
${riadky}
    <li><a class="lcd-pa-pata__hladaj" href="${KONFIGURATOR}"><span class="lcd-pa-pata__k"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1f7a52" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></span>${T.najst}</a></li>
</ul>
<p class="lcd-pa-pata__vsetky"><a href="${T.prehladUrl}">${T.pataVsetky}</a></p>`;
}

mkdirSync(VYSTUP, { recursive: true });
let n = 0;
for (const web of ["sk", "cz"]) {
  writeFileSync(join(VYSTUP, WEB[web].prehladSubor + "." + web + ".html"), prehlad(web));
  znackyWebu(web).forEach((z) => writeFileSync(join(VYSTUP, "autokoberce-" + z.kluc + "." + web + ".html"), znacka(z, web)));
  writeFileSync(join(VYSTUP, "paticka-podla-auta." + web + ".html"), paticka(web) + "\n");
  n += ZNACKY.length + 2;
}
[...new Set(upozornenia)].forEach((u) => console.log("pozor " + u));
console.log("ok: " + n + " súborov v admin-html/podla-auta/ (SK aj CZ)");
