// Údaje konfigurátora triedy V (SK 646): názvy príplatkov z adminu, kroky, farby. Všetky ceny sú v Shoptete, tu žiadna nie je.
// Názvy príplatkov aj hodnoty musia sedieť s adminom (príplatky 415–442), app.js overí pri štarte, že všetky existujú.
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";

/** Kľúč výberu -> meno selectu príplatku (data-parameter-name). Shoptet dovolí produktu najviac 15 príplatkov, je ich presne 15. */
export const SELECTY = {
  rok: "Rok výroby",
  volant: "Volant",
  stred: "Stred medzi sedadlami",
  dvere: "Bočné dvere",
  sedadla: "Sedadlá v 2. a 3. rade",
  stolcek: "Stolček vzadu",
  zasuvky: "Zásuvky pod sedadlami",
  farba: "Vzor a farba 1. vrstvy",
  farba2: "Farba 2. vrstvy",
  rozlozenie: "Rozloženie",
  rohoz: "Rohož do kufra",
  // ceny ako pri autokobercoch: jeden box od 99 €, pri dvoch každý od 89 € (Michal 7. 11. 2026), preto samostatné príplatky
  box1: "Box do kufra",
  box2: "Prvý box z dvoch",
  box3: "Druhý box z dvoch",
  boxFarba: "Farba boxov do kufra",
};

/** t = text v rozbaľovacom menu (krátky, vedľa roku výroby sa musí zmestiť aj na telefóne), p = veta pod ním. */
export const VELKOSTI = [
  { v: "M", t: "M, 4,9 m", p: "M je kompaktná verzia, dĺžka auta asi 4,9 m." },
  { v: "L", t: "L, 5,1 m", p: "L je dlhá verzia, dĺžka auta asi 5,1 m." },
  { v: "XL", t: "XL, 5,4 m", p: "XL je extra dlhá verzia, dĺžka auta asi 5,4 m." },
];

export const ROKY = (() => { const r = []; for (let y = 2026; y >= 2014; y--) r.push(String(y)); return r; })();
export const VOLANT = ["Vľavo", "Vpravo"];
/** Michal 7. 11. 2026: nie „tunel“, ľudia nevedia, čo to je. Podlaha = medzi sedadlami nič nie je, kresba bez výrezu (s = false). */
export const STRED = ["Podlaha", "Lakťová opierka alebo chladnička"];
export const DVERE = ["Jedny, vpravo", "Dvoje, na oboch stranách"];
export const SEDADLA = ["2", "3"];
/** Počet sedadiel v 2. a 3. rade ide do objednávky ako jedna hodnota príplatku (produkt má strop 15 príplatkov). */
export const sedadlaText = (r2, r3) => r2 + " sedadlá v 2. rade a " + r3 + " sedadlá v 3. rade";
export const SEDADLA_TEXTY = [].concat(...SEDADLA.map((a) => SEDADLA.map((b) => sedadlaText(a, b))));
export const STOLCEK = ["Bez stolčeka", "So stolčekom"];
export const ZASUVKY = ["Bez zásuviek", "So zásuvkami"];

/** Čistá vzorka materiálu, rovnaká ako pri výbere vzoru na autokobercoch Basic (Michal 7. 11. 2026). */
const VZORKY = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/ulozisko/www.luxurycardesign.sk/banners/";
export const VZORY = [
  { id: "diamond", nm: "Diamond Line", img: VZORKY + "diamont.jpg" },
  { id: "stripe", nm: "Stripe Line", img: VZORKY + "stripe-line.jpg" },
  { id: "hexa", nm: "Hexa Line", img: VZORKY + "hesaline.jpg" },
];

/** Farba: slug náhľadu bez vzoru, názov (rovnaký ako v príplatku), farba kože a šitia na kresbe. */
const CIERNA = "#17161a";
const F = {
  cervene: ["farba-koze-cierna-farba-sitia-cervena", "Čierna, červené šitie", CIERNA, "#d0342f"],
  modre: ["farba-koze-cierna-farba-sitia-modra", "Čierna, modré šitie", CIERNA, "#3f84e0"],
  cierne: ["farba-koze-cierna-farba-sitia-cierna", "Čierna, čierne šitie", CIERNA, "#34343a"],
  bezove: ["farba-koze-cierna-farba-sitia-bezova", "Čierna, béžové šitie", CIERNA, "#dcc9a2"],
  sive: ["farba-koze-cierna-farba-sitia-siva", "Čierna, sivé šitie", CIERNA, "#a2a3a8"],
  biele: ["farba-koze-cierna-farba-sitia-bielou", "Čierna, biele šitie", CIERNA, "#ecebe6"],
  zlte: ["farba-koze-cierna-farba-sitia-zltou", "Čierna, žlté šitie", CIERNA, "#e6c13a"],
  zelene: ["farba-koze-cierna-farba-sitia-zelena", "Čierna, zelené šitie", CIERNA, "#3f9d5a"],
  bronzove: ["farba-koze-cierna-farba-sitia-bronzova", "Čierna, bronzové šitie", CIERNA, "#b0793f"],
  bezova: ["farba-koze-bezova", "Béžová", "#cdb791", "#7d6642"],
  kava: ["farba-koze-hneda-kava", "Hnedá káva", "#4d3a30", "#c9a877"],
  hneda: ["farba-koze-hneda", "Hnedá", "#8a5a40", "#e2c49c"],
  vino: ["farba-koze-vinovo-cervena", "Vínovo červená", "#7a2434", "#e0b2b2"],
  cervena: ["farba-koze-cervena", "Červená", "#b92a30", "#f0c9c9"],
  seda: ["farba-koze-seda", "Šedá", "#7c7f88", "#dcdde0"],
  oranz: ["farba-koze-oranzova", "Oranžová", "#d96a35", "#f6d9c2"],
  modra: ["farba-koze-modra", "Modrá", "#245fb0", "#cbdcf3"],
  fial: ["farba-koze-fialova", "Fialová", "#5f3a78", "#ddcde8"],
};
/** Odporúčaná Lux v tóne kože, rovnaké pravidlo ako v košíku (odporucanaLux v lcdKosikDoplnok.js): ostatné farby Lux 10. */
const LUX_K_FARBE = { bezova: "12", kava: "11", hneda: "11", vino: "13", cervena: "13", seda: "16" };
const zoznam = (vzor, kluce) => kluce.map((k) => ({ slug: vzor + "-" + F[k][0], nm: F[k][1], koza: F[k][2], sit: F[k][3], lux: LUX_K_FARBE[k] || "10" }));
export const FARBY = {
  diamond: zoznam("diamond", ["cervene", "modre", "cierne", "bezove", "sive", "biele", "zlte", "zelene", "bronzove", "bezova", "kava", "hneda", "vino", "cervena", "seda", "oranz", "modra", "fial"]),
  stripe: zoznam("stripe", ["cervene", "bezove", "cierne", "bezova", "kava", "hneda", "vino", "cervena"]),
  hexa: zoznam("hexa", ["cervene", "modre", "cierne"]),
};

/** Druhá vrstva: číslo, farba na kresbe (stred vzorky). */
export const LUX = [["10", "#0f1116"], ["12", "#9e877c"], ["11", "#261719"], ["13", "#240b15"], ["14", "#341516"], ["15", "#2d2e33"], ["16", "#515055"], ["07", "#111519"], ["04", "#66282a"], ["01", "#35302b"], ["08", "#0f181e"], ["06", "#2c233d"], ["03", "#1e191c"], ["05", "#872924"], ["09", "#342422"], ["02", "#141937"]];

export const BEZ_DRUHEJ = "Bez druhej vrstvy";
export const ROZ_PREDOK = "Len predné sedadlá";
export const ROZ_SET = "Predné sedadlá, 2. a 3. rad";
/** Cena 2. a 3. radu závisí od veľkosti, preto je veľkosť priamo v hodnote príplatku Rozloženie. */
export const rozSet = (v) => ROZ_SET + " (" + v + ")";
export const ROHOZ = ["S rohožou do kufra", "Bez rohože do kufra"];
/** Michal 7. 11. 2026: dá sa kúpiť aj len jedna časť, potom bez zľavy. Základ produktu (300 €) sú predné sedadlá, preto bez nich vlastné hodnoty príplatkov. */
export const ROZ_BEZ = "Bez autokobercov, len rohož do kufra";
export const rozLen = (v) => "Len 2. a 3. rad (" + v + ")";
export const rozRadRohoz = (v) => "2. a 3. rad s rohožou, bez predných sedadiel (" + v + ")";
export const ROHOZ_SAM = "Len rohož do kufra";
export const BOXY = [
  { v: "S", t: "S 33 × 32 × 30 cm", r: "33 × 32 × 30 cm" },
  { v: "M", t: "M 40 × 32 × 30 cm", r: "40 × 32 × 30 cm" },
  { v: "L", t: "L 54 × 32 × 30 cm", r: "54 × 32 × 30 cm" },
  { v: "XL", t: "XL 66 × 32 × 30 cm", r: "66 × 32 × 30 cm" },
];
export const BOX_FARBY = [
  { nm: "Čierna, červené šitie", img: "boxprodukt-farba-cierna-cervene.jpg" },
  { nm: "Čierna, modré šitie", img: "boxprodukt-farba-cierna-modre.jpg" },
  { nm: "Čierna, čierne šitie", img: "boxprodukt-farba-cierna-cierne.jpg" },
  { nm: "Čierna, béžové šitie", img: "boxprodukt-farba-cierna-bezove.jpg" },
  { nm: "Čierna, biele šitie", img: "boxprodukt-farba-cierna-biele.jpg" },
  { nm: "Čierna, sivé šitie", img: "boxprodukt-farba-cierna-sive.jpg" },
  { nm: "Hnedá káva", img: "boxprodukt-farba-hneda-kava.jpg" },
  { nm: "Vínovo červená", img: "boxprodukt-farba-vinovo-cervena.jpg" },
  { nm: "Béžová", img: "boxprodukt-farba-bezova.jpg" },
];

/** Riadok „Samostatne“ na dlaždiciach, ponuka ako pri autách (Michal 7. 11. 2026). Predajné ceny sú len v Shoptete, toto je porovnanie:
 *  predok = odporúčaná cena predných sedadiel (Michal 7. 11. 2026: aj tam nech je zľava), rad = cena 2. a 3. radu pred znížením, rohoz = samostatná rohož Premium na webe, box = samostatný box 616 na webe (overené 7. 11. 2026). */
export const SAMOSTATNE = { predok: 390, rad: { M: 750, L: 850, XL: 950 }, rohoz: 340, box: { S: 197, M: 207, L: 232, XL: 246 } };

/** Kroky v poradí (Michal 7. 11. 2026): predné sedadlá, 2. a 3. rad aj rohož do kufra sú v jednom kroku Rozloženie, každý krok končí
 *  tlačidlom „Pokračujte ďalej“, po výbere sa neskáče. Cena začína na jednovrstvových autokobercoch k predným sedadlám. */
export const KROKY = [
  { id: "auto", nm: "Vaše auto", kr: "Auto", ti: "Prosím, vyberte si svoje auto", pod: "Pri každej otázke kliknite na možnosť, ktorá platí pre Vaše auto.", vy: "Rok, veľkosť a výbava auta" },
  { id: "rozl", nm: "Rozloženie", kr: "Rozloženie", ti: "Prosím, vyberte si rozloženie autokobercov", pod: "Vyberte si, čo chcete. 2. a 3. rad sa dajú objednať len spolu. Zľavu získate, keď si vyberiete aspoň dve časti.", vy: "Predné sedadlá, 2. a 3. rad, kufor" },
  { id: "vzor", nm: "Vzor prešívania", kr: "Vzor", ti: "Prosím, vyberte si vzor prešívania", vy: "Diamond, Stripe alebo Hexa" },
  { id: "farba", nm: "Farba 1. vrstvy", kr: "Farba", ti: "Prosím, vyberte si farbu 1. vrstvy", pod: "Na kresbe hneď uvidíte, ako budú farby spolu ladiť.", vy: "Farba kože a šitia" },
  { id: "druha", nm: "Druhá vrstva", kr: "2. vrstva", ti: "Prajete si aj druhú odnímateľnú vrstvu?", vy: "Áno alebo nie" },
  { id: "boxy", nm: "Boxy do kufra", kr: "Boxy", ti: "Prosím, vyberte si boxy do kufra", pod: "Skladacie boxy z rovnakého materiálu. Veľkosť a farbu zvolíte hneď po výbere.", vy: "Jeden, dva alebo žiadny" },
];

/** Video hore: pokojnejší strih nášho videa z V Class (Michal 7. 11. 2026: najprv auto zvonka, pomalšie, bez záberu z GLE), bez zvuku, dokola.
 *  Súbory assets/img/1v/<meno>-pc|tel.mp4 a .jpg, výrez 4:5 aby bolo vidno celé auto. */
export const VIDEO = { meno: "mercedes-v-class-film-3", alt: "Video autokobercov v Mercedes V Class XL" };

/** Okienko pri otázke v prvom kroku (ikona i): skutočné fotky podlahy z priečinka plocha/mercedes V class (Michal 7. 11. 2026, video bolo rozmazané). */
export const INFO = {
  zasuvky: {
    nm: "Zásuvky pod sedadlami",
    img: "mercedes-v-class-zasuvka-v-podlahe-2.jpg",
    alt: "Dve zásuvky v podlahe Mercedes V Class medzi koľajnicami a detail zásuvky so zapojeným káblom sedadla",
    text: "Elektrické sedadlá v 2. a 3. rade sa zapájajú do zásuviek v podlahe. Hore sú dve zásuvky v podlahe medzi koľajnicami, dole jedna zblízka so zapojeným káblom. Autokoberce majú okolo nich výrez.",
  },
};
