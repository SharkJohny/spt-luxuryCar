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
  box1: "Box 1 do kufra",
  box2: "Box 2 do kufra",
  box3: "Box 3 do kufra",
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
export const STRED = ["Stredový tunel", "Lakťová opierka alebo chladnička"];
export const DVERE = ["Jedny, vpravo", "Dvoje, na oboch stranách"];
export const SEDADLA = ["2", "3"];
/** Počet sedadiel v 2. a 3. rade ide do objednávky ako jedna hodnota príplatku (produkt má strop 15 príplatkov). */
export const sedadlaText = (r2, r3) => r2 + " sedadlá v 2. rade a " + r3 + " sedadlá v 3. rade";
export const SEDADLA_TEXTY = [].concat(...SEDADLA.map((a) => SEDADLA.map((b) => sedadlaText(a, b))));
export const STOLCEK = ["Bez stolčeka", "So stolčekom"];
export const ZASUVKY = ["Bez zásuviek", "So zásuvkami"];

export const VZORY = [
  { id: "diamond", nm: "Diamond Line", img: CDN + "dvoj-vzor-diamond.jpg" },
  { id: "stripe", nm: "Stripe Line", img: CDN + "dvoj-vzor-stripe.jpg" },
  { id: "hexa", nm: "Hexa Line", img: CDN + "dvoj-vzor-hexa.jpg" },
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

/** Kroky v poradí (Michal 7. 11. 2026): auto, rozloženie, vzor, farba, druhá vrstva, rohož, boxy. Cena začína na jednovrstvových
 *  autokobercoch k predným sedadlám, všetko ostatné sú príplatky. auto = po výbere sa hneď ide ďalej. */
export const KROKY = [
  { id: "auto", nm: "Vaše auto", kr: "Auto", ti: "Prosím, vyberte si svoje auto", vy: "Rok, veľkosť a výbava auta" },
  { id: "rozl", nm: "Rozloženie", kr: "Rozloženie", ti: "Prosím, vyberte si rozloženie autokobercov", pod: "2. a 3. rad sa dajú objednať len spolu.", vy: "Predné sedadlá alebo aj 2. a 3. rad", auto: true },
  { id: "vzor", nm: "Vzor prešívania", kr: "Vzor", ti: "Prosím, vyberte si vzor prešívania", vy: "Diamond, Stripe alebo Hexa", auto: true },
  { id: "farba", nm: "Farba 1. vrstvy", kr: "Farba", ti: "Prosím, vyberte si farbu 1. vrstvy", pod: "Na kresbe hneď uvidíte, ako budú farby spolu ladiť.", vy: "Farba kože a šitia" },
  { id: "druha", nm: "Druhá vrstva", kr: "2. vrstva", ti: "Prajete si aj druhú odnímateľnú vrstvu?", vy: "Áno alebo nie" },
  { id: "rohoz", nm: "Rohož do kufra", kr: "Rohož", ti: "Prosím, vyberte si rohož do kufra", vy: "S rohožou alebo bez nej", auto: true },
  { id: "boxy", nm: "Boxy do kufra", kr: "Boxy", ti: "Prosím, vyberte si boxy do kufra", vy: "Počet, veľkosť a farba" },
];

/** Fotky hore, súbory assets/img/1v/obsah/<s>.jpg a <s>-w<šírka>.webp (názvy kvôli vyhľadávaniu obrázkov). Prvá = to auto s kobercami. */
const M = "autokoberce-mercedes-v-class-";
export const FOTKY = [
  { s: M + "interier", alt: "Mercedes V Class s otvorenými dverami a autokobercami od predných sedadiel po 3. rad" },
  { s: M + "sofer", alt: "Autokoberec na mieru pri šoférovi v Mercedese triedy V, pedále a pätná podložka" },
  { s: M + "stred", alt: "Autokoberec medzi prednými sedadlami v Mercedes V Class" },
  { s: M + "druhy-rad", alt: "Autokoberce v 2. rade Mercedes V Class so sedadlom na koľajniciach" },
  { s: M + "kolajnice", alt: "Výrezy autokoberca okolo koľajníc sedadiel v Mercedese triedy V" },
  { s: "koberec-do-kufra-mercedes-v-class", alt: "Koberec do kufra Mercedes V Class, pohľad od piatych dverí" },
];
export const FOTO_SIRKY = [480, 800, 1200, 1500];
