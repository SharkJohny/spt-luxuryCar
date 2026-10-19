// Nový konfigurátor 1V — kresba boxu do kufra (návrh B „Realistický pohľad zhora“), spoločná pre:
//   - box do kufra 616 (boxy-produkt.js, krok 3 Veľkosť: karty S/M/L/XL vo farbe z kroku 1),
//   - okno „Vaše boxy do kufra“ na autokobercoch (kufor-boxy.js, karty veľkostí vo farbe boxov z toho istého okna).
// Michal 18. 10. 2026: „To, ako si vymyslel boxy — veľkosti tých boxov a možno aj ich farby — by sa mohlo premietnuť aj
// do konfigurátora koberčekov pod sedadlá, že by tam tie boxy boli znázornené.“ Vytiahnuté z boxy-produkt.js bez zmeny
// vzhľadu 616 (rovnaké ID vzorov s predvolenou predponou).
//
// Kresba (Michal 18. 10. 2026 namiesto zlatého kufríka: „toto nezodpovedá tomu, ako boxíky v skutočnosti vyzerajú“; podľa
// fotiek boxprodukt-pocet-*.jpg): telo a veko prešité do kosoštvorcov (vypuklé „vankúšiky“), veko prekrýva hornú časť
// prednej steny a končí zaobleným lemom so šitím, plochý pás rúčky na veku, kovový štítok, tieň na podlahe. Jednotky = cm
// (šírka boxu z textu možnosti, výška 30), všetky karty v rovnakej mierke (viewBox 72 cm široký). Kosoštvorec
// 8,25 × 5,8 cm (o trochu väčší než skutočný, aby sa na telefóne neslieval).
//
// Farby: CSS premenné na obale (nastavFarbuKresby): --bxp-lth koža, --bxp-sp rúčka, --bxp-edge lem/obrys, --bxp-st šitie,
// --bxp-gr ryha prešívania. Triedy .lcd1v-bxp-k-* štýlujú _lcd1v-boxy.scss (616) a _lcd1v-kufor-boxy.scss (okno boxov).
// Vzory <pattern> dedia premenné podľa SVOJHO miesta v DOM -> definicieKresby() patrí dovnútra obalu s premennými
// (nie display:none, inak sa výplň nevykreslí). ID vzorov musia byť na stránke unikátne -> predpona (jedna sada na stránke).

export const PREDPONA = "lcd1v-bxp-";

const bezDiakritiky = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Názov farby (kroky.js nazovFarby) -> kľúč mapy: „Čierna / červené šitie“ -> „cierna-cervene-sitie“. */
export const slugFarby = (s) => bezDiakritiky(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Farby kresby podľa farby boxu (kľúč = slugFarby(nazovFarby(text možnosti).nazov), ako fotky boxprodukt-farba-*;
// odtiene odčítané z fotiek vzoriek): koža, rúčka, lem/obrys, šitie, (ryha prešívania, inak čierna .42).
// Názvy farieb boxov naživo (GET 18. 10. 2026): 616 select farby; 598/610/613 a 601/604/607 select „farba boxov“
// (rovnakých 9 možností) — 616 má „Čierna / Sivá“ a „Šedá“, sety „Čierna / Šedá“ a „Béžová“.
const CIERNA = { koza: "#2a2b30", rucka: "#55585f", lem: "#0e0f11" };
// Béžová (Michal 18. 10. 2026: „Ten béžový box treba spraviť naozaj béžový“, podľa jeho vzorky): svetlá teplá béžová koža,
// šitie béžové/krémové o tón tmavšie a teplejšie, lem tmavšia béžová, rúčka o tón tmavšia ako koža, ryha teplá hnedá
// (čierna ryha robila zo svetlej kože sivú). Svetlý box 616 („Šedá“) aj svetlý box setu („Béžová“) kreslíme rovnako.
const BEZOVA = { koza: "#d4cbbb", rucka: "#c2b59f", lem: "#9a8463", sitie: "#c9b08a", ryha: "rgba(92, 68, 36, .24)" };
export const FARBY_KRESBY = {
  "cierna-cervene-sitie": Object.assign({ sitie: "#d63a46" }, CIERNA),
  "cierna-modre-sitie": Object.assign({ sitie: "#3f74d6" }, CIERNA),
  "cierna-cierne-sitie": Object.assign({ sitie: "#5a5d65" }, CIERNA),
  "cierna-bezove-sitie": Object.assign({ sitie: "#dcc59c" }, CIERNA),
  "cierna-sive-sitie": Object.assign({ sitie: "#a9adb5" }, CIERNA),
  "cierna-sede-sitie": Object.assign({ sitie: "#a9adb5" }, CIERNA), // sety: „Farba šitia: Šedá“ = 616 „Sivá“
  "cierna-biele-sitie": Object.assign({ sitie: "#f2f2ef" }, CIERNA),
  "hneda-kava": { koza: "#4b3934", rucka: "#68534b", lem: "#22180f", sitie: "#dccdbf" },
  "vinovo-cervena": { koza: "#922c3d", rucka: "#ad4255", lem: "#4a1019", sitie: "#f0dcdf" },
  "bezova": BEZOVA, // sety: „Farba kože : Béžová“
  "seda": BEZOVA, // 616: „Farba kože : Šedá“ (svetlý box; predtým svetlošedá #cbc4c4)
};
/** Bez farby / neznáma farba: čierna s béžovým šitím. */
export const PREDVOLENA = "cierna-bezove-sitie";
const RYHA = "rgba(0, 0, 0, .42)";
const PREMENNE = ["--bxp-lth", "--bxp-sp", "--bxp-edge", "--bxp-st", "--bxp-gr"];

/**
 * Nastaví farby kresby na obale (CSS premenné + data-lcd1v-farba). Neznámy / prázdny kľúč = PREDVOLENA.
 * Vráti použitý kľúč; pri rovnakej farbe nič neprepisuje.
 */
export function nastavFarbuKresby(obal, slug) {
  const k = slug && FARBY_KRESBY[slug] ? slug : PREDVOLENA;
  if (!obal || obal.getAttribute("data-lcd1v-farba") === k) return k;
  const c = FARBY_KRESBY[k];
  const predtym = obal.hasAttribute("data-lcd1v-farba");
  [c.koza, c.rucka, c.lem, c.sitie, c.ryha || RYHA].forEach((v, i) => obal.style.setProperty(PREMENNE[i], v));
  obal.setAttribute("data-lcd1v-farba", k);
  // iPhone (WebKit; Michal 19. 10. 2026): keď sa zmení len farba šitia (čierna / červené -> čierna / modré šitie), vzory
  // <pattern> sa neprekreslili všade — časť boxu ostala v starej farbe (Chrome to prekreslí sám). Nová kópia <defs>
  // (rovnaké ID) prinúti prehliadač prekresliť všetky kresby, ktoré vzory používajú. Obal <svg class="lcd1v-bxp-defs">
  // ostáva ten istý uzol (kufor-boxy.js ho pri návrate na starý vzhľad odstraňuje podľa odkazu).
  const defs = predtym && obal.querySelector(".lcd1v-bxp-defs > defs");
  if (defs) defs.replaceWith(defs.cloneNode(true));
  return k;
}
/** Návrat na starý vzhľad: premenné a značka farby z obalu preč. */
export function zrusFarbuKresby(obal) {
  if (!obal) return;
  PREMENNE.forEach((p) => obal.style.removeProperty(p));
  obal.removeAttribute("data-lcd1v-farba");
  if (obal.getAttribute("style") === "") obal.removeAttribute("style");
}

const QW = 8.25, QH = 5.8;
const MIERKA = 1.75; // px na cm na karte (telefón 2 karty v rade ~2, PC 4 v rade ~1,5) — hrúbky čiar sa rátajú v px
const f2 = (n) => Math.round(n * 100) / 100;
const QD = "M" + f2(QW / 2) + " 0L" + QW + " " + f2(QH / 2) + "L" + f2(QW / 2) + " " + QH + "L0 " + f2(QH / 2) + "Z";

/** Reťazec SVG -> prvok (parser HTML vloží <svg> do správneho menného priestoru). */
function zoSvg(retazec) {
  const t = document.createElement("template");
  t.innerHTML = retazec;
  return t.content.firstElementChild;
}
/** Prešívanie: vypuklé vankúšiky, ryha a šitie (farba šitia = --bxp-st, ryhy = --bxp-gr cez triedy). */
function vzorKresby(p, id, x, y, tf) {
  const s = MIERKA;
  const e = (cx, cy) => '<ellipse cx="' + f2(cx) + '" cy="' + f2(cy) + '" rx="' + f2(QW * 0.42) + '" ry="' + f2(QH * 0.42) + '" fill="url(#' + p + 'puff)"/>';
  return '<pattern id="' + p + id + '" patternUnits="userSpaceOnUse" x="' + f2(x) + '" y="' + f2(y) + '" width="' + QW + '" height="' + QH + '"' + (tf ? ' patternTransform="' + tf + '"' : "") + ">"
    + e(QW / 2, QH / 2) + e(0, 0) + e(QW, 0) + e(0, QH) + e(QW, QH)
    + '<path d="' + QD + '" class="lcd1v-bxp-k-qg" fill="none" stroke-width="' + f2(2 / s) + '"/>'
    + '<path d="' + QD + '" class="lcd1v-bxp-k-qs" fill="none" stroke-width="' + f2(0.95 / s) + '" stroke-opacity=".92"/></pattern>';
}
function prechod(p, id, stopy) {
  return '<linearGradient id="' + p + id + '" x1="0" y1="0" x2="0" y2="1">'
    + stopy.map((st) => '<stop offset="' + st[0] + '" stop-color="' + st[1] + '" stop-opacity="' + st[2] + '"/>').join("") + "</linearGradient>";
}
/**
 * Prechody a vzory kresby (jeden raz na stránke, vnútri obalu s premennými; nie display:none, inak by sa výplň
 * nevykreslila). `predpona` = predpona ID (iná predpona = iná sada; kresba() musí dostať tú istú).
 */
export function definicieKresby(predpona) {
  const p = predpona || PREDPONA;
  return zoSvg('<svg class="lcd1v-bxp-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>'
    + '<radialGradient id="' + p + 'puff"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="' + p + 'floor"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".6" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
    + prechod(p, "body", [[0, "#fff", 0.04], [0.5, "#000", 0], [1, "#000", 0.28]])
    + prechod(p, "flap", [[0, "#fff", 0.26], [0.08, "#fff", 0.07], [0.55, "#000", 0], [1, "#000", 0.14]])
    + prechod(p, "top", [[0, "#000", 0.16], [1, "#fff", 0.13]])
    + prechod(p, "shade", [[0, "#000", 0.5], [1, "#000", 0]])
    + '<linearGradient id="' + p + 'metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfbf9"/><stop offset=".45" stop-color="#b8b8b4"/><stop offset=".7" stop-color="#ececea"/><stop offset="1" stop-color="#8d8d89"/></linearGradient>'
    + vzorKresby(p, "qb", 36 - QW / 2, 16.2) + vzorKresby(p, "qf", 36, 15.4) + vzorKresby(p, "qt", 36 - QW / 2, 0, "translate(0 7.6) scale(1 .55)")
    + "</defs></svg>");
}
/** Obdĺžnik so zaoblením hore (rt) a dole (rb). */
function rr(x0, y0, x1, y1, rt, rb) {
  return "M" + f2(x0) + " " + f2(y0 + rt) + "Q" + f2(x0) + " " + f2(y0) + " " + f2(x0 + rt) + " " + f2(y0) + "H" + f2(x1 - rt) + "Q" + f2(x1) + " " + f2(y0) + " " + f2(x1) + " " + f2(y0 + rt)
    + "V" + f2(y1 - rb) + "Q" + f2(x1) + " " + f2(y1) + " " + f2(x1 - rb) + " " + f2(y1) + "H" + f2(x0 + rb) + "Q" + f2(x0) + " " + f2(y1) + " " + f2(x0) + " " + f2(y1 - rb) + "Z";
}
/** Otvorené „U“ (šitie lemu veka). */
function openU(x0, ys, x1, y1, r) {
  return "M" + f2(x0) + " " + f2(ys) + "V" + f2(y1 - r) + "Q" + f2(x0) + " " + f2(y1) + " " + f2(x0 + r) + " " + f2(y1) + "H" + f2(x1 - r) + "Q" + f2(x1) + " " + f2(y1) + " " + f2(x1) + " " + f2(y1 - r) + "V" + f2(ys);
}
/** Vrch veka: vpredu široký ako veko, vzadu mierne užší, zaoblené rohy. */
function vrchVeka(fx0, fx1, yb, yf, ins, r) {
  return "M" + f2(fx0) + " " + f2(yf + 0.8) + "V" + f2(yf - 0.3) + "Q" + f2(fx0 + 0.15) + " " + f2(yb) + " " + f2(fx0 + ins + r) + " " + f2(yb)
    + "H" + f2(fx1 - ins - r) + "Q" + f2(fx1 - 0.15) + " " + f2(yb) + " " + f2(fx1) + " " + f2(yf - 0.3) + "V" + f2(yf + 0.8) + "Z";
}
/** Plochá rúčka položená na veku: tieň, pás, dve prišité koncovky. */
function rucka(cx, y, h) {
  const sw = f2(0.9 / MIERKA);
  return '<rect x="' + f2(cx - 7) + '" y="' + f2(y + 0.45) + '" width="14" height="' + f2(h) + '" rx="' + f2(h / 2) + '" fill="#000" fill-opacity=".35"/>'
    + '<rect x="' + f2(cx - 6.8) + '" y="' + f2(y) + '" width="13.6" height="' + f2(h) + '" rx="' + f2(h / 2) + '" class="lcd1v-bxp-k-s" stroke-width="' + sw + '"/>'
    + '<path d="M' + f2(cx - 5.6) + " " + f2(y + h * 0.3) + "H" + f2(cx + 5.6) + '" stroke="#fff" stroke-opacity=".28" stroke-width="' + sw + '" stroke-linecap="round"/>'
    + '<rect x="' + f2(cx - 7.6) + '" y="' + f2(y - 0.12) + '" width="1.7" height="' + f2(h + 0.24) + '" rx=".4" class="lcd1v-bxp-k-ef"/>'
    + '<rect x="' + f2(cx + 5.9) + '" y="' + f2(y - 0.12) + '" width="1.7" height="' + f2(h + 0.24) + '" rx=".4" class="lcd1v-bxp-k-ef"/>';
}
/** Kresba boxu šírky `sirka` cm (výška 30 cm) v jednotnej mierke kariet; `predpona` ako pri definicieKresby(). */
export function kresba(sirka, predpona) {
  const p = predpona || PREDPONA;
  const s = MIERKA;
  const w = Math.max(12, Math.min(70, Number(sirka) || 40));
  const cx = 36, x0 = cx - w / 2, x1 = cx + w / 2, yb = 7.6, yf = 15, o = 0.35, fx0 = x0 - o, fx1 = x1 + o, fy1 = 33, yB = 45, di = 1.05;
  const telo = rr(x0, yf + 1, x1, yB, 0.01, 1.3), veko = rr(fx0, yf - 0.3, fx1, fy1, 1.1, 1.7), vrch = vrchVeka(fx0, fx1, yb, yf, 2.2, 1.4);
  const u = (id) => "url(#" + p + id + ")";
  return zoSvg('<svg class="lcd1v-bxp-sil" viewBox="0 5.8 72 41.6" aria-hidden="true" focusable="false">'
    + '<ellipse cx="36" cy="' + f2(yB + 0.15) + '" rx="' + f2(w / 2 + 3.2) + '" ry="1.9" fill="' + u("floor") + '"/>'
    + '<path d="' + telo + '" class="lcd1v-bxp-k-l"/><path d="' + telo + '" fill="' + u("qb") + '"/>'
    + '<path d="' + telo + '" fill="' + u("body") + '" class="lcd1v-bxp-k-e" stroke-width="' + f2(1.1 / s) + '"/>'
    + '<rect x="' + f2(x0) + '" y="' + f2(fy1 - 0.2) + '" width="' + f2(w) + '" height="2.8" fill="' + u("shade") + '"/>'
    + '<path d="' + vrch + '" class="lcd1v-bxp-k-l"/><path d="' + vrch + '" fill="' + u("qt") + '"/>'
    + '<path d="' + vrch + '" fill="' + u("top") + '" class="lcd1v-bxp-k-e" stroke-width="' + f2(1.1 / s) + '"/>'
    + rucka(cx, 10.3, 2)
    + '<path d="' + veko + '" class="lcd1v-bxp-k-l"/><path d="' + veko + '" fill="' + u("qf") + '"/>'
    + '<path d="' + veko + '" fill="' + u("flap") + '" class="lcd1v-bxp-k-e" stroke-width="' + f2(Math.max(1.3 / s, 0.42)) + '"/>'
    + '<path d="' + openU(fx0 + di, yf + 1.6, fx1 - di, fy1 - di, 1.1) + '" class="lcd1v-bxp-k-t" fill="none" stroke-width="' + f2(0.95 / s) + '" stroke-dasharray="' + f2(2.3 / s) + " " + f2(1.5 / s) + '" stroke-linecap="round"/>'
    + '<rect x="' + f2(cx - 3.1) + '" y="' + f2(fy1 - 3.6) + '" width="6.2" height="1.55" rx=".75" fill="' + u("metal") + '" stroke="#000" stroke-opacity=".4" stroke-width="' + f2(0.6 / s) + '"/>'
    + "</svg>");
}
