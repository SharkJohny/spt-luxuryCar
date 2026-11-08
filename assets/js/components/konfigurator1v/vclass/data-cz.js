// Údaje konfigurátora triedy V pre CZ web (presná kópia SK 646, Michal 8. 11. 2026): názvy príplatkov a hodnôt z CZ adminu,
// české texty krokov, ceny „Samostatne“ v Kč. Všetky predajné ceny sú v Shoptete, tu sú len porovnávacie ceny SAMOSTATNE.
// Tvar je rovnaký ako data.js (tie isté kľúče), app.js, obsah.js, boxy.js a opc/vclassKarta.js berú SK alebo CZ podľa webu
// (vclass/trh.js). Hodnoty príplatkov sa neprepisujú ručne: CZ = HODNOTY_CZ[SK hodnota], kde HODNOTY_CZ je preklad, podľa ktorého
// druhý pomocník založil CZ admin (8. 11. 2026); hodnota, ktorá sa v češtine nemení (roky, Lux Color, „Béžová“, rozmery boxov),
// v zozname nie je. app.js pri štarte overí, že všetky existujú v selectoch CZ produktu (inak ostane natívny formulár).
import * as SK from "./data.js";

/** SK -> CZ: mená príplatkov a hodnoty, ktoré sa v CZ admine líšia (preklad.json druhého pomocníka 8. 11. 2026). */
export const HODNOTY_CZ = {
  "Bočné dvere": "Boční dveře",
  "Dvoje, na oboch stranách": "Dvoje, na obou stranách",
  "Box do kufra": "Box do kufru",
  "Prvý box z dvoch": "První box ze dvou",
  "Druhý box z dvoch": "Druhý box ze dvou",
  "Farba 2. vrstvy": "Barva 2. vrstvy",
  "Bez druhej vrstvy": "Bez druhé vrstvy",
  "Farba boxov do kufra": "Barva boxů do kufru",
  "Čierna, červené šitie": "Černá, červené šití",
  "Čierna, modré šitie": "Černá, modré šití",
  "Čierna, čierne šitie": "Černá, černé šití",
  "Čierna, béžové šitie": "Černá, béžové šití",
  "Čierna, biele šitie": "Černá, bílé šití",
  "Čierna, sivé šitie": "Černá, šedé šití",
  "Hnedá káva": "Hnědá káva",
  "Vínovo červená": "Vínově červená",
  "Čierna, žlté šitie": "Černá, žluté šití",
  "Čierna, zelené šitie": "Černá, zelené šití",
  "Čierna, bronzové šitie": "Černá, bronzové šití",
  "Hnedá": "Hnědá",
  "Rohož do kufra": "Rohož do kufru",
  "S rohožou do kufra": "S rohoží do kufru",
  "Bez rohože do kufra": "Bez rohože do kufru",
  "Len rohož do kufra": "Pouze rohož do kufru",
  "Rozloženie": "Rozložení",
  "Len predné sedadlá": "Pouze přední sedadla",
  "Predné sedadlá, 2. a 3. rad (M)": "Přední sedadla, 2. a 3. řada (M)",
  "Predné sedadlá, 2. a 3. rad (L)": "Přední sedadla, 2. a 3. řada (L)",
  "Predné sedadlá, 2. a 3. rad (XL)": "Přední sedadla, 2. a 3. řada (XL)",
  "Len 2. a 3. rad (M)": "Pouze 2. a 3. řada (M)",
  "Len 2. a 3. rad (L)": "Pouze 2. a 3. řada (L)",
  "Len 2. a 3. rad (XL)": "Pouze 2. a 3. řada (XL)",
  "2. a 3. rad s rohožou, bez predných sedadiel (M)": "2. a 3. řada s rohoží, bez předních sedadel (M)",
  "2. a 3. rad s rohožou, bez predných sedadiel (L)": "2. a 3. řada s rohoží, bez předních sedadel (L)",
  "2. a 3. rad s rohožou, bez predných sedadiel (XL)": "2. a 3. řada s rohoží, bez předních sedadel (XL)",
  "Bez autokobercov, len rohož do kufra": "Bez autokoberců, pouze rohož do kufru",
  "Sedadlá v 2. a 3. rade": "Sedadla ve 2. a 3. řadě",
  "2 sedadlá v 2. rade a 2 sedadlá v 3. rade": "2 sedadla ve 2. řadě a 2 sedadla ve 3. řadě",
  "2 sedadlá v 2. rade a 3 sedadlá v 3. rade": "2 sedadla ve 2. řadě a 3 sedadla ve 3. řadě",
  "3 sedadlá v 2. rade a 2 sedadlá v 3. rade": "3 sedadla ve 2. řadě a 2 sedadla ve 3. řadě",
  "3 sedadlá v 2. rade a 3 sedadlá v 3. rade": "3 sedadla ve 2. řadě a 3 sedadla ve 3. řadě",
  "Stolček vzadu": "Stolek vzadu",
  "Bez stolčeka": "Bez stolku",
  "So stolčekom": "Se stolkem",
  "Stred medzi sedadlami": "Střed mezi sedadly",
  "Lakťová opierka alebo chladnička": "Loketní opěrka nebo lednička",
  "Vľavo": "Vlevo",
  "Vzor a farba 1. vrstvy": "Vzor a barva 1. vrstvy",
  "Zásuvky pod sedadlami": "Zásuvky pod sedadly",
  "Bez zásuviek": "Bez zásuvek",
  "So zásuvkami": "Se zásuvkami",
};

/** Hodnota príplatku v CZ admine k SK hodnote (bez zmeny, keď sa v češtine nelíši). „Vzor a barva 1. vrstvy“ = vzor + farba
 *  („Diamond Line – Čierna, červené šitie“ -> „Diamond Line – Černá, červené šití“), farby rovnako ako farby boxov. */
export function cz(s) {
  if (Object.prototype.hasOwnProperty.call(HODNOTY_CZ, s)) return HODNOTY_CZ[s];
  const m = /^((?:Diamond|Stripe|Hexa) Line – )(.+)$/.exec(s);
  return m ? m[1] + cz(m[2]) : s;
}
const mapuj = (o) => { const out = {}; Object.keys(o).forEach((k) => { out[k] = cz(o[k]); }); return out; };

export const CDN = SK.CDN;
export const SELECTY = mapuj(SK.SELECTY);
export const VELKOSTI = [
  { v: "M", t: "M, 4,9 m", p: "M je kompaktní verze, délka auta asi 4,9 m." },
  { v: "L", t: "L, 5,1 m", p: "L je dlouhá verze, délka auta asi 5,1 m." },
  { v: "XL", t: "XL, 5,4 m", p: "XL je extra dlouhá verze, délka auta asi 5,4 m." },
];
export const ROKY = SK.ROKY;
export const VOLANT = SK.VOLANT.map(cz);
export const STRED = SK.STRED.map(cz);
export const DVERE = SK.DVERE.map(cz);
export const SEDADLA = SK.SEDADLA;
export const sedadlaText = (r2, r3) => cz(SK.sedadlaText(r2, r3));
export const SEDADLA_TEXTY = SK.SEDADLA_TEXTY.map(cz);
export const STOLCEK = SK.STOLCEK.map(cz);
export const ZASUVKY = SK.ZASUVKY.map(cz);
export const VZORY = SK.VZORY;
/** Farby s CZ názvom (nm) ako v príplatku „Vzor a barva 1. vrstvy“, sk = SK názov (slug náhľadu a kresba sa nemenia). */
export const FARBY = {};
SK.VZORY.forEach((v) => {
  const pred = v.nm + " – ";
  FARBY[v.id] = SK.FARBY[v.id].map((f) => Object.assign({}, f, { nm: cz(pred + f.nm).slice(pred.length), sk: f.nm }));
});
/** Odporúčaná Lux k hodnote „Vzor a barva 1. vrstvy“ („Diamond Line – Hnědá“ -> "11"), ako SK luxKFarbe. */
export function luxKFarbe(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  for (const v of VZORY) {
    const f = t.indexOf(v.nm + " – ") === 0 ? FARBY[v.id].find((x) => v.nm + " – " + x.nm === t) : null;
    if (f) return f.lux;
  }
  return null;
}
export const LUX = SK.LUX;
export const BEZ_DRUHEJ = cz(SK.BEZ_DRUHEJ);
export const ROZ_PREDOK = cz(SK.ROZ_PREDOK);
export const rozSet = (v) => cz(SK.rozSet(v));
export const ROHOZ = SK.ROHOZ.map(cz);
export const ROZ_BEZ = cz(SK.ROZ_BEZ);
export const rozLen = (v) => cz(SK.rozLen(v));
export const rozRadRohoz = (v) => cz(SK.rozRadRohoz(v));
export const ROHOZ_SAM = cz(SK.ROHOZ_SAM);
export const BOXY = SK.BOXY.map((b) => Object.assign({}, b, { t: cz(b.t) }));
/** Farby boxov s CZ názvom (nm) ako v príplatku „Barva boxů do kufru“, sk = SK názov (kresba boxu podľa neho). */
export const BOX_FARBY = SK.BOX_FARBY.map((f) => Object.assign({}, f, { nm: cz(f.nm), sk: f.nm }));

/** „Samostatně“ v Kč (Michal 8. 11. 2026 = SK × 25): predok 390 € -> 9 750 Kč, rad 750 / 850 / 950 € -> 18 750 / 21 250 / 23 750 Kč,
 *  rohož 340 € -> 8 500 Kč; box = samostatný box 2427 na CZ webe (/luxusny-boxi-do-kufra/, overené 8. 11. 2026: S 5 100, M 5 499,
 *  L 5 959, XL 6 099 Kč — SK 616 má 197 / 207 / 232 / 246 €). */
export const SAMOSTATNE = { predok: 9750, rad: { M: 18750, L: 21250, XL: 23750 }, rohoz: 8500, box: { S: 5100, M: 5499, L: 5959, XL: 6099 } };

/** Kroky v rovnakom poradí ako SK (data.js KROKY), české texty. */
export const KROKY = [
  { id: "auto", nm: "Vaše auto", kr: "Auto", ti: "Vyberte si prosím své auto", pod: "U každé otázky klikněte na možnost, která platí pro Vaše auto.", vy: "Rok, velikost a výbava auta" },
  { id: "rozl", nm: "Rozložení", kr: "Rozložení", ti: "Vyberte si prosím rozložení autokoberců", pod: "Vyberte si, co chcete. 2. a 3. řadu lze objednat jen společně. Slevu získáte, když si vyberete alespoň dvě části.", vy: "Přední sedadla, 2. a 3. řada, kufr" },
  { id: "vzor", nm: "Vzor prošívání", kr: "Vzor", ti: "Vyberte si prosím vzor prošívání", vy: "Diamond, Stripe nebo Hexa" },
  { id: "farba", nm: "Barva 1. vrstvy", kr: "Barva", ti: "Vyberte si prosím barvu 1. vrstvy", pod: "Na nákresu hned uvidíte, jak spolu budou barvy ladit.", vy: "Barva kůže a prošití" },
  { id: "druha", nm: "Druhá vrstva", kr: "2. vrstva", ti: "Přejete si také druhou odnímatelnou vrstvu?", vy: "Ano, nebo ne" },
  { id: "boxy", nm: "Boxy do kufru", kr: "Boxy", ti: "Vyberte si prosím boxy do kufru", pod: "Skládací boxy ze stejného materiálu. Velikost a barvu zvolíte hned po výběru.", vy: "Jeden, dva, nebo žádný" },
];

export const VIDEO = { meno: SK.VIDEO.meno, alt: "Video autokoberců v Mercedesu V Class XL" };

export const INFO = {
  zasuvky: {
    nm: "Zásuvky pod sedadly",
    img: SK.INFO.zasuvky.img,
    alt: "Dvě zásuvky v podlaze Mercedesu V Class mezi kolejnicemi a detail zásuvky se zapojeným kabelem sedadla",
    text: "Elektrická sedadla ve 2. a 3. řadě se zapojují do zásuvek v podlaze. Nahoře jsou dvě zásuvky v podlaze mezi kolejnicemi, dole jedna zblízka se zapojeným kabelem. Autokoberce mají kolem nich výřez.",
  },
};
