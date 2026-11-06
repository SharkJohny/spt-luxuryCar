// Údaje konfigurátora triedy V (SK 646): názvy príplatkov z adminu, kroky, farby. Všetky ceny sú v Shoptete, tu žiadna nie je.
// Názvy príplatkov aj hodnoty musia sedieť s adminom (príplatky 415–442), app.js overí pri štarte, že všetky existujú.
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";

/** Kľúč výberu -> meno selectu príplatku (data-parameter-name). */
export const SELECTY = {
  velkost: "Veľkosť",
  rok: "Rok výroby",
  volant: "Volant",
  stred: "Stred medzi sedadlami",
  dvere: "Bočné dvere",
  miesta: "Počet miest",
  stolcek: "Stolček vzadu",
  zasuvky: "Zásuvky pod sedadlami",
  farba: "Vzor a farba 1. vrstvy",
  farba2: "Farba 2. vrstvy",
};

export const VELKOSTI = [
  { v: "M", p: "Kompaktná, dĺžka auta asi 4,9 m" },
  { v: "L", p: "Dlhá, dĺžka auta asi 5,1 m" },
  { v: "XL", p: "Extra dlhá, dĺžka auta asi 5,4 m" },
];

export const ROKY = (() => { const r = []; for (let y = 2026; y >= 2014; y--) r.push(String(y)); return r; })();
export const VOLANT = ["Vľavo", "Vpravo"];
export const STRED = ["Stredový tunel", "Lakťová opierka alebo chladnička"];
export const DVERE = ["Jedny, vpravo", "Dvoje, na oboch stranách"];
export const MIESTA = ["5", "6", "7", "8"];
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
const zoznam = (vzor, kluce) => kluce.map((k) => ({ slug: vzor + "-" + F[k][0], nm: F[k][1], koza: F[k][2], sit: F[k][3] }));
export const FARBY = {
  diamond: zoznam("diamond", ["cervene", "modre", "cierne", "bezove", "sive", "biele", "zlte", "zelene", "bronzove", "bezova", "kava", "hneda", "vino", "cervena", "seda", "oranz", "modra", "fial"]),
  stripe: zoznam("stripe", ["cervene", "bezove", "cierne", "bezova", "kava", "hneda", "vino", "cervena"]),
  hexa: zoznam("hexa", ["cervene", "modre", "cierne"]),
};

/** Druhá vrstva: číslo, farba na kresbe (stred vzorky). */
export const LUX = [["10", "#0f1116"], ["12", "#9e877c"], ["11", "#261719"], ["13", "#240b15"], ["14", "#341516"], ["15", "#2d2e33"], ["16", "#515055"], ["07", "#111519"], ["04", "#66282a"], ["01", "#35302b"], ["08", "#0f181e"], ["06", "#2c233d"], ["03", "#1e191c"], ["05", "#872924"], ["09", "#342422"], ["02", "#141937"]];

/** Kroky v poradí, otázka po jednej. auto = po výbere sa hneď ide ďalej. */
export const KROKY = [
  { id: "velkost", nm: "Veľkosť auta", ti: "Prosím, vyberte si veľkosť auta", vy: "M, L alebo XL", auto: true },
  { id: "auto", nm: "Rok výroby a volant", ti: "Prosím, vyberte si rok výroby a pozíciu volantu", vy: "Rok výroby a pozícia volantu" },
  { id: "stred", nm: "Stred medzi sedadlami", ti: "Prosím, vyberte si, čo je medzi prednými sedadlami", vy: "Tunel, opierka alebo chladnička", auto: true },
  { id: "dvere", nm: "Bočné dvere", ti: "Prosím, vyberte si počet bočných posuvných dverí", vy: "Jedny alebo dvoje", auto: true },
  { id: "miesta", nm: "Počet miest", ti: "Prosím, vyberte si počet miest na sedenie", vy: "5 až 8 miest", auto: true },
  { id: "stolcek", nm: "Stolček", ti: "Prosím, vyberte si, či je medzi sedadlami vzadu stolček", pod: "So stolčekom sú stredné koľajnice širšie, koberec im prispôsobíme.", vy: "So stolčekom alebo bez neho", auto: true },
  { id: "zasuvky", nm: "Zásuvky", ti: "Prosím, vyberte si, či sú pod sedadlami v 2. a 3. rade zásuvky", vy: "So zásuvkami alebo bez nich", auto: true },
  { id: "vzor", nm: "Vzor prešívania", ti: "Prosím, vyberte si vzor prešívania", vy: "Diamond, Stripe alebo Hexa", auto: true },
  { id: "farba", nm: "Farba 1. vrstvy", ti: "Prosím, vyberte si farbu 1. vrstvy", pod: "Na obrázku hneď uvidíte, ako vám bude ladiť.", vy: "Farba kože a šitia" },
  { id: "farba2", nm: "Farba 2. vrstvy", ti: "Prosím, vyberte si farbu 2. vrstvy", pod: "Druhá vrstva je na podlahe vpredu, pod nohami šoféra a spolujazdca.", vy: "Lux Color" },
];
