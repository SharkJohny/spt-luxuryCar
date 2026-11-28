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
// Od 28. 11. 2026 karty áut = biele autá z nových titulok (Michal: „to isté aj s fotkami do kategórií“), assets/img/1v/auto/titulky-1128/<auto>-480/-960.
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
      { nazov: "Audi A6 C7", roky: "roky 2011–2018", cena: 219, url: "/autokoberce-audi-a6-c7/", foto: "1v/auto/titulky-1128/audi-a6-c7", w: 480, h: 239 },
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Audi Q7 4M", roky: "od roku 2015", cena: 219, url: "/autokoberce-audi-q7-4m/", foto: "1v/auto/titulky-1128/audi-q7-4m", w: 480, h: 271 },
      { nazov: "Audi Q8", roky: "od roku 2018", cena: 219, url: "/autokoberce-audi-q8/", foto: "1v/auto/titulky-1128/audi-q8", w: 480, h: 219 },
      // 14. 11. 2026: autá 11–20 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Audi e-tron / Q8 e-tron", roky: "roky 2018–2025", cena: 219, url: "/autokoberce-audi-e-tron/", foto: "1v/auto/titulky-1128/audi-e-tron", w: 480, h: 232 },
      { nazov: "Audi A6 C8", roky: "roky 2018–2025", cena: 219, url: "/autokoberce-audi-a6-c8/", foto: "1v/auto/titulky-1128/audi-a6-c8", w: 480, h: 213 },
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Audi Q7 4L", roky: "roky 2006–2015", cena: 219, url: "/autokoberce-audi-q7-4l/", foto: "1v/auto/titulky-1128/audi-q7-4l", w: 480, h: 284 },
      { nazov: "Audi A4 B9", roky: "roky 2015–2024", cena: 219, url: "/autokoberce-audi-a4-b9/", foto: "1v/auto/titulky-1128/audi-a4-b9", w: 480, h: 223 },
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Audi Q5 FY", roky: "roky 2017–2024", cena: 219, url: "/autokoberce-audi-q5-fy/", foto: "1v/auto/titulky-1128/audi-q5-fy", w: 480, h: 266 },
    ],
  },
  {
    kluc: "bmw", nazov: "BMW", logo: "znacky/bmw.svg", url: "/autokoberce-bmw/", pata: true,
    koho: "svojho BMW", kto: "BMW",
    // stránky áut zverejnené 12. 11. 2026 (dvojvrstvové kópie 601), autá z hlavných fotiek Witamats (Michal 12. 11.)
    auta: [
      { nazov: "BMW 3 G20/G21", roky: "od roku 2019", cena: 219, url: "/autokoberce-bmw-3-g20-g21/", foto: "1v/auto/titulky-1128/bmw-3-g20-g21", w: 480, h: 206 },
      { nazov: "BMW 5 G30/G31", roky: "roky 2017–2023", cena: 219, url: "/autokoberce-bmw-5-g30-g31/", foto: "1v/auto/titulky-1128/bmw-5-g30-g31", w: 480, h: 229 },
      { nazov: "BMW X7 G07", roky: "od roku 2019", cena: 219, url: "/autokoberce-bmw-x7-g07/", foto: "1v/auto/titulky-1128/bmw-x7-g07", w: 480, h: 259 },
      // 14. 11. 2026: autá 11–20 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "BMW X6 E71", roky: "roky 2008–2014", cena: 219, url: "/autokoberce-bmw-x6-e71/", foto: "1v/auto/titulky-1128/bmw-x6-e71", w: 480, h: 231 },
      { nazov: "BMW X5 F15", roky: "roky 2013–2018", cena: 219, url: "/autokoberce-bmw-x5-f15/", foto: "1v/auto/titulky-1128/bmw-x5-f15", w: 480, h: 246 },
      { nazov: "BMW X5 G05", roky: "roky 2018–2026", cena: 219, url: "/autokoberce-bmw-x5-g05/", foto: "1v/auto/titulky-1128/bmw-x5-g05", w: 480, h: 272 },
      { nazov: "BMW XM", roky: "G09 od roku 2023", cena: 219, url: "/autokoberce-bmw-xm/", foto: "1v/auto/titulky-1128/bmw-xm", w: 480, h: 212 },
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "BMW X5 E70", roky: "roky 2006–2013", cena: 219, url: "/autokoberce-bmw-x5-e70/", foto: "1v/auto/titulky-1128/bmw-x5-e70", w: 480, h: 227 },
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "BMW 5 F10/F11", roky: "roky 2010–2017", cena: 219, url: "/autokoberce-bmw-5-f10-f11/", foto: "1v/auto/titulky-1128/bmw-5-f10-f11", w: 480, h: 243 },
    ],
  },
  {
    kluc: "volkswagen", nazov: "Volkswagen", logo: "znacky/volkswagen.svg", url: "/autokoberce-volkswagen/", pata: true,
    koho: "svojho Volkswagenu", kto: "Volkswagen",
    auta: [
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Volkswagen Touareg III", roky: "od roku 2018", cena: 219, url: "/autokoberce-volkswagen-touareg-iii/", foto: "1v/auto/titulky-1128/volkswagen-touareg-iii", w: 480, h: 268 },
      { nazov: "Volkswagen Passat B8", roky: "roky 2014–2023", cena: 219, url: "/autokoberce-volkswagen-passat-b8/", foto: "1v/auto/titulky-1128/volkswagen-passat-b8", w: 480, h: 200 },
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Volkswagen Passat B6", roky: "roky 2005–2010", cena: 219, url: "/autokoberce-volkswagen-passat-b6/", foto: "1v/auto/titulky-1128/volkswagen-passat-b6", w: 480, h: 237 },
      { nazov: "Volkswagen Passat B7", roky: "roky 2010–2015", cena: 219, url: "/autokoberce-volkswagen-passat-b7/", foto: "1v/auto/titulky-1128/volkswagen-passat-b7", w: 480, h: 259 },
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Volkswagen Tiguan I", roky: "roky 2007–2016", cena: 219, url: "/autokoberce-volkswagen-tiguan-i/", foto: "1v/auto/titulky-1128/volkswagen-tiguan-i", w: 480, h: 280 },
      { nazov: "Volkswagen Tiguan III", roky: "od roku 2024", cena: 219, url: "/autokoberce-volkswagen-tiguan-iii/", foto: "1v/auto/titulky-1128/volkswagen-tiguan-iii", w: 480, h: 276 },
    ],
  },
  {
    kluc: "mercedes-benz", nazov: "Mercedes-Benz", logo: "znacky/mercedes.svg", url: "/autokoberce-mercedes-benz/", pata: true,
    koho: "svojho Mercedesu",
    auta: [
      { nazov: "Mercedes-Benz triedy V", roky: "W447 od roku 2014", cena: 300, url: "/autokoberce-mercedes-v-class/", foto: "1v/auto/titulky-1128/mercedes-v-class", w: 480, h: 238 },
      { nazov: "Mercedes-Benz GLE", roky: "V167 a Coupé C167 od roku 2019", cena: 219, url: "/autokoberce-mercedes-gle/", foto: "1v/auto/titulky-1128/mercedes-gle", w: 480, h: 257 },
      { nazov: "Mercedes-Benz triedy G", roky: "W463, roky 2018–2024", cena: 219, url: "/autokoberce-mercedes-g-class/", foto: "1v/auto/titulky-1128/mercedes-g-class", w: 480, h: 295 },
      { nazov: "Mercedes-Benz GLS", roky: "X167 od roku 2019", cena: 219, url: "/autokoberce-mercedes-gls/", foto: "1v/auto/titulky-1128/mercedes-gls", w: 480, h: 252 },
      { nazov: "Mercedes-Benz EQE SUV", roky: "X294 od roku 2022", cena: 219, url: "/autokoberce-mercedes-eqe-suv/", foto: "1v/auto/titulky-1128/mercedes-eqe-suv", w: 480, h: 256 },
      // 14. 11. 2026: autá 11–20 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Mercedes-Benz GLE W166", roky: "roky 2015–2019", cena: 219, url: "/autokoberce-mercedes-gle-w166/", foto: "1v/auto/titulky-1128/mercedes-gle-w166", w: 480, h: 291 },
      { nazov: "Mercedes-Benz triedy S W222", roky: "roky 2013–2020", cena: 219, url: "/autokoberce-mercedes-s-w222/", foto: "1v/auto/titulky-1128/mercedes-s-w222", w: 480, h: 229 },
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Mercedes-Benz GLC X254", roky: "od roku 2022", cena: 219, url: "/autokoberce-mercedes-glc-x254/", foto: "1v/auto/titulky-1128/mercedes-glc-x254", w: 480, h: 244 },
      { nazov: "Mercedes-Benz triedy E W213", roky: "roky 2016–2023", cena: 219, url: "/autokoberce-mercedes-e-w213/", foto: "1v/auto/titulky-1128/mercedes-e-w213", w: 480, h: 211 },
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Mercedes-Benz triedy S W221", roky: "roky 2005–2013", cena: 219, url: "/autokoberce-mercedes-s-w221/", foto: "1v/auto/titulky-1128/mercedes-s-w221", w: 480, h: 216 },
    ],
  },
  {
    kluc: "skoda", nazov: "Škoda", logo: "znacky/skoda.svg", url: "/autokoberce-skoda/", pata: true,
    koho: "svojej Škody",
    auta: [
      // Kodiaq I (produkt 667, kópia 598, 12. 11. 2026): auto = tlačová fotka Škoda Auto (Kodiaq Scout, IAA 2017), uhol ako autá Witamats.
      // Produkt je zatiaľ skrytý (hosť 404) — Popis značky Škoda vkladať až po zverejnení 667.
      { nazov: "Škoda Kodiaq I", roky: "roky 2016–2024", cena: 219, url: "/autokoberce-skoda-kodiaq-i/", foto: "1v/auto/titulky-1128/skoda-kodiaq-i", w: 480, h: 258 },
      { nazov: "Škoda Kodiaq II", roky: "od roku 2024", cena: 230, url: "/autokoberce-skoda-kodiaq-ii/", foto: "1v/auto/titulky-1128/skoda-kodiaq-ii", w: 480, h: 227 },
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Škoda Superb III", roky: "roky 2015–2023", cena: 219, url: "/autokoberce-skoda-superb-iii/", foto: "1v/auto/titulky-1128/skoda-superb-iii", w: 480, h: 187 },
      { nazov: "Škoda Octavia II", roky: "roky 2004–2013", cena: 219, url: "/autokoberce-skoda-octavia-ii/", foto: "1v/auto/titulky-1128/skoda-octavia-ii", w: 480, h: 257 },
      { nazov: "Škoda Octavia III", roky: "roky 2013–2020", cena: 219, url: "/autokoberce-skoda-octavia-iii/", foto: "1v/auto/titulky-1128/skoda-octavia-iii", w: 480, h: 220 },
      { nazov: "Škoda Karoq", roky: "od roku 2017", cena: 219, url: "/autokoberce-skoda-karoq/", foto: "1v/auto/titulky-1128/skoda-karoq", w: 480, h: 242 },
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Škoda Superb II", roky: "roky 2008–2015", cena: 219, url: "/autokoberce-skoda-superb-ii/", foto: "1v/auto/titulky-1128/skoda-superb-ii", w: 480, h: 206 },
    ],
  },
  {
    kluc: "dodge", nazov: "Dodge", logo: "znacky/dodge.svg", url: "/autokoberce-dodge/", pata: false,
    koho: "svojho Dodge", kto: "Dodge",
    auta: [
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Dodge Challenger", roky: "roky 2008–2023", cena: 219, url: "/autokoberce-dodge-challenger/", foto: "1v/auto/titulky-1128/dodge-challenger", w: 480, h: 217 },
      // 14. 11. 2026: autá 11–20 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Dodge Durango", roky: "od roku 2011", cena: 219, url: "/autokoberce-dodge-durango/", foto: "1v/auto/titulky-1128/dodge-durango", w: 480, h: 234 },
    ],
  },
  {
    kluc: "toyota", nazov: "Toyota", logo: "znacky/toyota.svg", url: "/autokoberce-toyota/", pata: false,
    koho: "svojej Toyoty", kto: "Toyota",
    auta: [
      // 13. 11. 2026: generácie podľa objednávok „ako Witamats“ (kópie 598), titulka = vzorový koberec + tlačová fotka auta
      { nazov: "Toyota RAV4 V", roky: "roky 2018–2025", cena: 219, url: "/autokoberce-toyota-rav4-v/", foto: "1v/auto/titulky-1128/toyota-rav4-v", w: 480, h: 275 },
    ],
  },
  {
    kluc: "hyundai", nazov: "Hyundai", logo: "znacky/hyundai.svg", url: "/autokoberce-hyundai/", pata: false,
    koho: "svojho Hyundaia", kto: "Hyundai",
    auta: [
      // 14. 11. 2026: autá 11–20 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Hyundai Tucson IV", roky: "roky 2020–2026", cena: 219, url: "/autokoberce-hyundai-tucson-iv/", foto: "1v/auto/titulky-1128/hyundai-tucson-iv", w: 480, h: 228 },
    ],
  },
  {
    kluc: "volvo", nazov: "Volvo", logo: "znacky/volvo.svg", url: "/autokoberce-volvo/", pata: false,
    koho: "svojho Volva", kto: "Volvo",
    auta: [
      // 14. 11. 2026: autá 11–20 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Volvo XC90 II", roky: "od roku 2015", cena: 219, url: "/autokoberce-volvo-xc90-ii/", foto: "1v/auto/titulky-1128/volvo-xc90-ii", w: 480, h: 237 },
    ],
  },
  {
    kluc: "ford", nazov: "Ford", logo: "znacky/ford.svg", url: "/autokoberce-ford/", pata: false,
    koho: "svojho Fordu", kto: "Ford",
    auta: [
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Ford Ranger T6", roky: "roky 2011–2022", cena: 219, url: "/autokoberce-ford-ranger-t6/", foto: "1v/auto/titulky-1128/ford-ranger-t6", w: 480, h: 291 },
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Ford Mondeo Mk5", roky: "roky 2014–2022", cena: 219, url: "/autokoberce-ford-mondeo-mk5/", foto: "1v/auto/titulky-1128/ford-mondeo-mk5", w: 480, h: 219 },
    ],
  },
  {
    kluc: "kia", nazov: "Kia", logo: "znacky/kia.svg", url: "/autokoberce-kia/", pata: false,
    koho: "svojej Kie", kto: "Kia",
    auta: [
      // 14. 11. 2026 večer: autá 21–30 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Kia Sorento IV", roky: "od roku 2020", cena: 219, url: "/autokoberce-kia-sorento-iv/", foto: "1v/auto/titulky-1128/kia-sorento-iv", w: 480, h: 271 },
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Kia Sportage QL", roky: "roky 2015–2021", cena: 219, url: "/autokoberce-kia-sportage-ql/", foto: "1v/auto/titulky-1128/kia-sportage-ql", w: 480, h: 263 },
    ],
  },
  {
    kluc: "cupra", nazov: "Cupra", logo: "znacky/cupra.svg", url: "/autokoberce-cupra/", pata: false,
    koho: "svojej Cupry", kto: "Cupra",
    auta: [
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Cupra Formentor", roky: "od roku 2020", cena: 219, url: "/autokoberce-cupra-formentor/", foto: "1v/auto/titulky-1128/cupra-formentor", w: 480, h: 266 },
    ],
  },
  {
    kluc: "mitsubishi", nazov: "Mitsubishi", logo: "znacky/mitsubishi.svg", url: "/autokoberce-mitsubishi/", pata: false,
    koho: "svojho Mitsubishi", kto: "Mitsubishi",
    auta: [
      // 14. 11. 2026 večer: autá 31–39 zo zoznamu najpredávanejších generácií (kópie 598), titulka = vzorový koberec + fotka auta
      { nazov: "Mitsubishi Outlander III", roky: "roky 2012–2021", cena: 219, url: "/autokoberce-mitsubishi-outlander-iii/", foto: "1v/auto/titulky-1128/mitsubishi-outlander-iii", w: 480, h: 293 },
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
  mitsubishi: { koho: "svého Mitsubishi", kto: "Mitsubishi" },
  cupra: { koho: "své Cupry", kto: "Cupra" },
  kia: { koho: "své Kie", kto: "Kia" },
  ford: { koho: "svého Fordu", kto: "Ford" },
  volvo: { koho: "svého Volva", kto: "Volvo" },
  hyundai: { koho: "svého Hyundaie", kto: "Hyundai" },
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
  "/autokoberce-kia-sportage-ql/": { id: 2724, cena: 5664 },
  "/autokoberce-bmw-5-f10-f11/": { id: 2721, cena: 5664 },
  "/autokoberce-volkswagen-tiguan-iii/": { id: 2718, cena: 5664 },
  "/autokoberce-volkswagen-tiguan-i/": { id: 2715, cena: 5664 },
  "/autokoberce-mercedes-s-w221/": { id: 2712, cena: 5664, nazov: "Mercedes-Benz třídy S W221" },
  "/autokoberce-mitsubishi-outlander-iii/": { id: 2709, cena: 5664 },
  "/autokoberce-cupra-formentor/": { id: 2706, cena: 5664 },
  "/autokoberce-ford-mondeo-mk5/": { id: 2703, cena: 5664 },
  "/autokoberce-audi-q5-fy/": { id: 2700, cena: 5664 },
  "/autokoberce-kia-sorento-iv/": { id: 2697, cena: 5664 },
  "/autokoberce-mercedes-e-w213/": { id: 2694, cena: 5664, nazov: "Mercedes-Benz třídy E W213" },
  "/autokoberce-ford-ranger-t6/": { id: 2691, cena: 5664 },
  "/autokoberce-mercedes-glc-x254/": { id: 2688, cena: 5664, nazov: "Mercedes-Benz GLC X254" },
  "/autokoberce-audi-a4-b9/": { id: 2685, cena: 5664 },
  "/autokoberce-audi-q7-4l/": { id: 2682, cena: 5664 },
  "/autokoberce-bmw-x5-e70/": { id: 2679, cena: 5664 },
  "/autokoberce-volkswagen-passat-b7/": { id: 2676, cena: 5664 },
  "/autokoberce-volkswagen-passat-b6/": { id: 2673, cena: 5664 },
  "/autokoberce-skoda-superb-ii/": { id: 2670, cena: 5664 },
  "/autokoberce-bmw-xm/": { id: 2667, cena: 5664 },
  "/autokoberce-audi-a6-c8/": { id: 2664, cena: 5664 },
  "/autokoberce-dodge-durango/": { id: 2661, cena: 5664 },
  "/autokoberce-mercedes-s-w222/": { id: 2658, cena: 5664, nazov: "Mercedes-Benz třídy S W222" },
  "/autokoberce-bmw-x5-g05/": { id: 2655, cena: 5664 },
  "/autokoberce-bmw-x5-f15/": { id: 2652, cena: 5664 },
  "/autokoberce-mercedes-gle-w166/": { id: 2649, cena: 5664, nazov: "Mercedes-Benz GLE W166" },
  "/autokoberce-audi-e-tron/": { id: 2646, cena: 5664 },
  "/autokoberce-bmw-x6-e71/": { id: 2643, cena: 5664 },
  "/autokoberce-volvo-xc90-ii/": { id: 2640, cena: 5664 },
  "/autokoberce-hyundai-tucson-iv/": { id: 2637, cena: 5664 },
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
