// Scenáre ponuky setu s autokobercami pod sedadlá na sólo rohožiach do kufra (619–634) a boxe (616) — Michal 17. 10. 2026
// (návrh 1 „Ponuka ako druhá vrstva“: skrytá karta bez čísla; rohož PRED Farbou, box PO Veľkosti). Kód:
// assets/js/components/konfigurator1v/komplet-ponuka.js + prenos.js (box bez farby v sete) + assets/css/_lcd1v-komplet.scss.
// Tvar scenára: tools/test-1v/scenare-jedno.mjs. Všetko s ?novy=1 (bez flagu sa scenár preskočí; starý vzhľad stráži
// nulova-zmena). Každý POST košíka je zachytený a zrušený (jadro testu).
//
//   kufor-komplet-nie  karta skrytá, kým nie je auto úplné; potom viditeľná BEZ čísla medzi kartou Auto a Farba (DOM aj
//                      obrazovka), postup „… v 3 krokoch“ a „Krok N z 3“ bez zmeny; „Pokračujte ďalej“ v Aute otvorí kartu
//                      (nie Farbu); texty (nadpis, veta s cenou, dlaždica, tlačidlá), dve reálne fotky (autokoberce vzoru +
//                      fotka rohože), cenovka „V sete len X €“ / „Samostatne <s>Y €</s>“ / „Ušetríte Z €“ = čísla zistené
//                      NEZÁVISLE (GET jednovrstvových toho istého vzoru: voľba kufra dno / dno + boky; profil: cena rohože);
//                      zelené Áno v dlaždici, zlaté Nie; Nie -> karta zbalená („Len rohož do kufra“), otvorí sa Farba;
//                      farba -> POST = baseline (profil platne: priceId, suma)
//   kufor-komplet-ano  hlavička karty -> Áno -> jednovrstvové toho istého vzoru: rohož (Classic = dno, Premium = dno + boky)
//                      predvybraná, auto prenesené, otvorená Farba bez predvoľby; farba + rozloženie -> POST; tá istá
//                      stránka nanovo a všetko ručne -> POST rovnaký pole po poli
//   box-komplet-nie    karta skrytá, kým nie je zvolená veľkosť (aj pri zvolenej farbe a počte); potom za kartou Veľkosť bez
//                      čísla; „Pokračujte k súhrnu“ otvorí kartu; 1 box M: „Box do kufra M len za X €“ (X = Box solo M na
//                      598, GET), „Samostatne“ = cena stránky (variant + príplatok z DOM); Nie -> kroky zatvorené, súhrn na
//                      obrazovke, POST 0; košík -> POST = baseline (profil platne 1 × M)
//   box-komplet-ano    1 box M -> 2 boxy M + L: čísla v karte sa prepočítajú živo („Boxy do kufra M + L len za X €“, X =
//                      1. box M + 2. box L na 598); farba, ktorú set má (podľa názvu); Áno -> 598: počet, farba boxov
//                      a veľkosti prenesené, okno boxov zatvorené; auto + farba + rozloženie -> POST; nanovo ručne -> POST
//                      rovnaký pole po poli
//   box-komplet-seda   farba boxu, ktorú set nemá (dnes Šedá — test ju hľadá sám porovnaním názvov 616 a 598): veta v dlaždici
//                      to povie; Áno -> 598: počet a veľkosť prenesené, farba nie — okno boxov otvorené na výber farby;
//                      zákazník zvolí farbu a potvrdí; auto + farba + rozloženie -> POST platný (box solo, farba boxov)
//   box-komplet-3      3 boxy: karta sa neukáže (ani keď bola pri 2 boxoch viditeľná), „Pokračujte k súhrnu“ ide rovno na
//                      súhrn; POST 3 boxov platný
import { join } from "node:path";
import { PRODUKTY } from "./produkty.mjs";
import { F } from "./stary-ui.mjs";

const KARTA = `${F} .lcd1v-komplet`;
const KLUC = "lcd1vPrenos:v1";
const OKNO = `${F} .upsale-Banner.lcd1v-kb .box-config`;
const cisty = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim(); // aj NBSP
const eur = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")) + " €";
const cesta = (url) => new URL(url).pathname;
const preskocBez = (a) => (a.novy ? null : { preskoc: "len nový vzhľad (?novy=1)" });
const ZAKAZANE = /na milimeter|vyr[áa]bame|zadarmo|comfort|dragon|elite|basic|z[áa]ruk|vrstiev|fixa[čc]n|do interi[ée]ru/i;
const ROHOZ = { "kufor-classic": "Classic", "kufor-premium": "Premium" };

/** Profil (id + produkty.mjs) daného typu a vzoru. */
function profil(typ, vzor) {
  const id = Object.keys(PRODUKTY).find((i) => PRODUKTY[i].typ === typ && PRODUKTY[i].vzor === vzor);
  return id ? { id: Number(id), ...PRODUKTY[id] } : null;
}

/** Názov farby na porovnanie 616 -> 598 NEZÁVISLE od kódu webu: bez diakritiky, bez „Diamond / Farba kože / Farba šitia“
 *  a ceny, koncovky preč („bielou“ = „Biela“), sivá = šedá. „Diamond Farba kože : Čierna / Farba šitia: Červená“ -> „ciern cerven“. */
export function normFarby(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\+\s*€.*$/, "").replace(/diamond|farba\s+koze|farba\s+sitia|[:/]/g, " ")
    .split(/\s+/).filter(Boolean).map((w) => w.replace(/(ou|a|y|e|i)$/, "")).map((w) => (w === "siv" ? "sed" : w)).join(" ");
}

/** Stav karty ponuky, ako ju vidí zákazník (texty, cenovka, fotky, tlačidlá, poloha voči susedným kartám). */
function stavKarty(t) {
  return t.ev(`(function () {
    var k = document.querySelector(${JSON.stringify(KARTA)});
    if (!k) return { je: false };
    function tx(q, kde) { var e = (kde || k).querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
    function vid(e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return !e.hidden && r.width > 0 && r.height > 0 && c.display !== "none" && c.visibility !== "hidden"; }
    function tl(b) { return b ? { tag: b.tagName, typ: b.type, text: b.textContent.replace(/\\s+/g, " ").trim(), tab: b.tabIndex, pozadie: getComputedStyle(b).backgroundImage, vidno: vid(b) } : null; }
    function box(e) { if (!e || !vid(e)) return null; var r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; }
    var f = document.getElementById("product-detail-form");
    var dl = k.querySelector(".lcd1v-komplet__dlazdica"), ano = k.querySelector(".lcd1v-komplet__ano"), nie = k.querySelector(".lcd1v-komplet__nie");
    var cb = k.querySelector(".lcd1v-komplet__cb"), s = k.querySelector(".lcd1v-komplet__cb-s"), pr = s && s.querySelector("s"), u = k.querySelector(".lcd1v-komplet__cb-u");
    var meno = function (e) { var m = e && /lcd1v-k-(\\w+)/.exec(e.className || ""); return m ? m[1] : (e ? (e.className || e.tagName) : null); };
    return {
      je: true, vidno: vid(k), otvorena: k.classList.contains("active"), hotova: k.classList.contains("lcd1v-hotovy"),
      ey: tx(":scope > .lcd1v-hd .lcd1v-ey"), nm: tx(":scope > .lcd1v-hd .lcd1v-nm"), ti: tx(":scope > .lcd1v-hd .lcd1v-ti"), vy: tx(":scope > .lcd1v-hd .lcd1v-vy"),
      cislo: tx(":scope > .lcd1v-hd .lcd1v-no"), cisloVidno: vid(k.querySelector(":scope > .lcd1v-hd .lcd1v-no")),
      pod: tx(":scope > .lcd1v-pod"), stitok: tx(".lcd1v-kb__top"), dnm: tx(".lcd1v-kb__nm"), dpo: tx(".lcd1v-kb__po"), dben: tx(".lcd1v-kb__ben"),
      cb: vid(cb) ? { l: tx(".lcd1v-komplet__cb-l"), c: tx(".lcd1v-komplet__cb-c"), s: vid(s) ? tx(".lcd1v-komplet__cb-s") : null, pr: pr ? pr.textContent.replace(/\\s+/g, " ").trim() : null,
        u: vid(u) ? tx(".lcd1v-komplet__cb-u") : null, ciara: pr ? getComputedStyle(pr).textDecorationLine + " " + getComputedStyle(pr).textDecorationColor : "",
        pilulka: u ? getComputedStyle(u).backgroundColor + " " + getComputedStyle(u).color : "", cPx: Math.round(parseFloat(getComputedStyle(k.querySelector(".lcd1v-komplet__cb-c")).fontSize)),
        pretek: cb.scrollWidth > cb.clientWidth + 1 || cb.parentNode.scrollWidth > cb.parentNode.clientWidth + 1 } : null,
      cenaTx: tx(".lcd1v-komplet__cb-c"), // aj pri zbalenej karte (cenovka je v skrytom tele karty)
      ano: tl(ano), nie: tl(nie), pozn: tx(":scope > .lcd1v-pozn"),
      anoVDlazdici: !!(dl && ano && dl.contains(ano)), dlTag: dl ? dl.tagName : null, dlTlacidiel: dl ? dl.querySelectorAll("button").length : 0,
      anoNadNie: !!(ano && nie && ano.getBoundingClientRect().bottom <= nie.getBoundingClientRect().top),
      fotky: dl ? Array.prototype.map.call(dl.querySelectorAll("img"), function (i) { return { src: i.currentSrc || i.getAttribute("src") || "", ok: i.complete && i.naturalWidth > 0, vidno: vid(i), loading: i.getAttribute("loading") }; }) : [],
      maName: !!k.querySelector("[name]"), anoZablok: !!(ano && ano.disabled), nieZablok: !!(nie && nie.disabled),
      prenos: vid(k.querySelector(".lcd1v-komplet__prenos")) ? tx(".lcd1v-komplet__prenos") : null,
      text: k.textContent.replace(/\\s+/g, " ").trim(),
      dlVyska: dl ? Math.round(dl.getBoundingClientRect().height) : 0,
      pred: meno(k.previousElementSibling), za: meno(k.nextElementSibling),
      poloha: { karta: box(k), auto: box(f.querySelector(".lcd1v-k-auto")), farba: box(f.querySelector(".lcd1v-k-farba")), pocet: box(f.querySelector(".lcd1v-k-pocet")), velkost: box(f.querySelector(".lcd1v-k-velkost")) },
    };
  })()`);
}

/** Postup a čísla kariet — skrytá karta ich nemení. */
function cislaKrokov(t) {
  return t.ev(`(function () {
    function tx(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; }
    return { postup: tx(document.querySelector(".lcd1v-postup-t")), dlazdice: document.querySelectorAll(".lcd1v-postup-dl > i").length,
      ey: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-krok:not(.lcd1v-komplet) > .lcd1v-hd .lcd1v-ey"), tx) };
  })()`);
}

/** Snímka pre ľudskú kontrolu (len s --snimky): prvok `sel` zarovnaný nahor pod hlavičku webu. */
async function snimka(s, a, meno, sel) {
  if (!a.snimky) return;
  await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`);
  await s.t.pauza(700);
  await s.k.snimka(join(a.snimky, `${a.produkt.id}-${meno}-${s.t.sirka}.png`)).catch(() => {});
}

const kluc = (t) => t.ev(`(function () { try { return JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC)}) || "null"); } catch (e) { return "chyba"; } })()`);

/** Polia formulára pre overPost na inej stránke tej istej karty (ako j.otvor; jednovrstvové nemajú nepovinné selecty). */
async function nastavFormKluce(s) {
  s.formKluce = await s.t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    var k = ["productId", "priceId", "language", "amount"], volitelne = [];
    Array.prototype.forEach.call(f.querySelectorAll("select[name]"), function (s) { k.push(s.name); });
    Array.prototype.forEach.call(f.querySelectorAll(".content-wrap input[type=radio][name^='parameter-']"), function (r) { if (volitelne.indexOf(r.name) < 0) volitelne.push(r.name); });
    return { povinne: k.sort(), volitelne: volitelne, priceIdZaklad: (f.querySelector("input[name=priceId]") || {}).value || "" };
  })()`);
}

/** Čaká, kým je karta viditeľná a má cenovku (čísla prídu z GET jednovrstvových) -> stav karty. */
async function cakajKartu(t, popis) {
  await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); var c = k && k.querySelector(".lcd1v-komplet__cb-c");
    return !!(k && !k.hidden && k.offsetHeight > 30 && c && c.textContent.trim()); })()`, { ms: 30000, popis });
  return stavKarty(t);
}

/** Otvorená karta (po „Pokračujte“ alebo hlavičke): výška > 200 px, fotky načítané. */
async function cakajOtvorenu(t, popis) {
  await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); return !!(k && k.classList.contains("active") && k.getBoundingClientRect().height > 200); })()`, { ms: 10000, popis });
  await t.ev(`document.querySelector(${JSON.stringify(KARTA + " .lcd1v-komplet__dlazdica")}).scrollIntoView({ block: "center", behavior: "instant" })`);
  await t.cakaj(`Array.prototype.every.call(document.querySelectorAll(${JSON.stringify(KARTA + " .lcd1v-komplet__dlazdica img")}), function (i) { return i.complete && i.naturalWidth > 0; })`, { ms: 15000, popis: "fotky v dlaždici ponuky" });
  await t.pauza(400);
  return stavKarty(t);
}

/** Spoločné kontroly otvorenej karty: texty, tlačidlá, farby, fotky, cenovka (čísla podaj zvonka), bez „+ číslo“. */
function overOtvorenu(j, st, { pod, dnm, dpo, dben, vSete, samostatne, pozn, foto1, foto2, kde }) {
  j.over(st.ti === "Prosíte si aj autokoberce pod sedadlá?", `${kde}: nadpis „${st.ti}“`);
  j.over(st.ey === "Autokoberce pod sedadlá" && !st.cisloVidno, `${kde}: karta bez čísla (eyebrow „${st.ey}“, číslo „${st.cislo}“ viditeľné ${st.cisloVidno})`);
  j.over(st.pod === pod, `${kde}: veta „${st.pod}“ ≠ „${pod}“`);
  j.over(st.stitok === "★ Výhodnejšie v sete" && st.dnm === dnm && st.dpo === dpo && st.dben === dben,
    `${kde}: dlaždica „${st.stitok} | ${st.dnm} | ${st.dpo} | ${st.dben}“ ≠ „★ Výhodnejšie v sete | ${dnm} | ${dpo} | ${dben}“`);
  const us = Math.round((samostatne - vSete) * 100) / 100;
  j.over(!!st.cb, `${kde}: cenovka nie je viditeľná`);
  j.over(st.cb.l === "V sete len" && st.cb.c === eur(vSete), `${kde}: cenovka „${st.cb.l} ${st.cb.c}“ ≠ „V sete len ${eur(vSete)}“`);
  j.over(st.cb.s === "Samostatne " + eur(samostatne) && st.cb.pr === eur(samostatne), `${kde}: „${st.cb.s}“ ≠ Samostatne ${eur(samostatne)} (prečiarknuté)`);
  j.over(st.cb.u === "Ušetríte " + eur(us), `${kde}: „${st.cb.u}“ ≠ Ušetríte ${eur(us)}`);
  j.over(/line-through/.test(st.cb.ciara) && /192, 57, 43/.test(st.cb.ciara), `${kde}: samostatná cena nie je prečiarknutá červenou: ${st.cb.ciara}`);
  j.over(/226, 243, 233/.test(st.cb.pilulka) && /29, 107, 74/.test(st.cb.pilulka), `${kde}: „Ušetríte“ nie je zelená pilulka: ${st.cb.pilulka}`);
  j.over(st.cb.cPx >= 24, `${kde}: cena v sete má byť veľká (${st.cb.cPx} px)`);
  j.over(!st.cb.pretek, `${kde}: cenovka pretŕča zo stĺpca dlaždice`);
  // tlačidlá: zelené „Áno“ v dlaždici (kam chceme zákazníka), zlaté „Nie“ pod ňou; skutočné <button type=button>
  j.over(st.ano && st.ano.tag === "BUTTON" && st.ano.typ === "button" && st.ano.text === "Áno, chcem set s autokobercami" && st.ano.tab >= 0 && st.ano.vidno && st.anoVDlazdici,
    `${kde}: tlačidlo Áno ${JSON.stringify(st.ano)} (v dlaždici ${st.anoVDlazdici})`);
  j.over(st.nie && st.nie.tag === "BUTTON" && st.nie.typ === "button" && st.nie.text === "Nie, ďakujem" && st.nie.vidno && st.pozn === pozn, `${kde}: tlačidlo Nie ${JSON.stringify(st.nie)} / „${st.pozn}“`);
  j.over(st.dlTag === "DIV" && st.dlTlacidiel === 1 && st.anoNadNie, `${kde}: dlaždica ${st.dlTag} s ${st.dlTlacidiel} tlačidlami, Áno nad Nie ${st.anoNadNie}`);
  j.over(/47, 156, 104|29, 107, 74/.test(st.ano.pozadie) && /196, 155, 49|177, 136, 34|226, 190, 92/.test(st.nie.pozadie), `${kde}: farby Áno (zelené) ${st.ano.pozadie} / Nie (zlaté) ${st.nie.pozadie}`);
  // dve reálne fotky: autokoberce pod sedadlá vo vzore + rohož / box; lenivo
  j.over(st.fotky.length === 2 && st.fotky.every((f) => f.ok && f.vidno && f.loading === "lazy"), `${kde}: fotky ${JSON.stringify(st.fotky)}`);
  j.over(foto1.test(st.fotky[0].src) && foto2.test(st.fotky[1].src), `${kde}: fotky ${st.fotky.map((f) => f.src).join(" | ")} ≠ ${foto1} | ${foto2}`);
  // ceny setu bez „+“ (Michal 17. 10. 2026: „+ X €“ vyzerá ako príplatok); „+ 2 boxy“ je počet, nie cena
  j.over(!/\+\s*\d[\d\s.,]*€/.test(st.text), `${kde}: v karte je cena s „+“: ${st.text}`);
  j.over(!ZAKAZANE.test(st.text), `${kde}: zakázané slovo v karte: ${st.text}`);
  j.over(!st.maName, `${kde}: prvok s name v karte (išiel by do POST)`);
  return us;
}

/** Fokus klávesnicou na Áno aj Nie. */
async function overFokus(t, j, kde) {
  const f = await t.ev(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}), r = {};
    ["ano", "nie"].forEach(function (m) { var b = k.querySelector(".lcd1v-komplet__" + m); b.focus({ preventScroll: true }); r[m] = document.activeElement === b; b.blur(); });
    return r; })()`);
  j.over(f.ano && f.nie, `${kde}: fokus klávesnicou Áno ${f.ano}, Nie ${f.nie}`);
}

/** Voľba kufra na jednovrstvových (NEZÁVISLE: GET živej stránky, select „do kufru“) -> { hodnota, cena }. */
function volbaKufra(t, url, premium) {
  return t.ev(`(async function (url, premium) {
    var html = await fetch(url, { credentials: "same-origin" }).then(function (r) { return r.text(); });
    var d = new DOMParser().parseFromString(html, "text/html");
    var s = Array.prototype.find.call(d.querySelectorAll("#product-detail-form select[data-parameter-name]"), function (x) { return /do\\s+kufr/i.test(x.getAttribute("data-parameter-name")); });
    var o = s && Array.prototype.find.call(s.options, function (o) { var tx = o.textContent; return o.value && (premium ? /bok/i.test(tx) : /dno/i.test(tx) && !/bok/i.test(tx)); });
    return o ? { hodnota: o.value, cena: Number(o.getAttribute("data-surcharge-final-price")) || Number(o.getAttribute("data-surcharge-additional-price")) } : null;
  })(${JSON.stringify(url)}, ${!!premium})`);
}

/** Boxy na jednovrstvových 598 (NEZÁVISLE: GET živej stránky): { solo|b1|b2: { S: { hodnota, cena } … }, farby: [{ hodnota, text }] }. */
function boxyCiela(t, url) {
  return t.ev(`(async function (url) {
    var html = await fetch(url, { credentials: "same-origin" }).then(function (r) { return r.text(); });
    var d = new DOMParser().parseFromString(html, "text/html");
    function sel(re) { return Array.prototype.find.call(d.querySelectorAll("#product-detail-form select[data-parameter-name]"), function (x) { return re.test(x.getAttribute("data-parameter-name")); }); }
    function velkosti(s) { var o = {}; if (!s) return o; Array.prototype.forEach.call(s.options, function (x) { var m = /^\\s*(XL|[SML])\\s*:/.exec(x.textContent); if (x.value && m) o[m[1]] = { hodnota: x.value, cena: Number(x.getAttribute("data-surcharge-final-price")) || Number(x.getAttribute("data-surcharge-additional-price")) }; }); return o; }
    var fb = sel(/farba\\s+box/i);
    return { solo: velkosti(sel(/box\\s*solo/i)), b1: velkosti(sel(/1\\.\\s*box/i)), b2: velkosti(sel(/2\\.\\s*box/i)),
      farby: fb ? Array.prototype.filter.call(fb.options, function (o) { return !!o.value; }).map(function (o) { return { hodnota: o.value, text: o.textContent.replace(/\\s+/g, " ").trim() }; }) : [] };
  })(${JSON.stringify(url)})`);
}

/** Box 616: farby (vzorky v karte Farba) s textom -> [{ hodnota, text, index }]. */
function farbyBoxu(t, idF) {
  return t.ev(`(function () {
    var s = document.querySelector('${F} select[data-parameter-id="${idF}"]');
    return Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-k-farba > .options-wrap > .option-button"), function (b, i) {
      var v = b.getAttribute("data-value"), o = s && Array.prototype.find.call(s.options, function (x) { return x.value === v; });
      return { hodnota: v, text: o ? o.textContent.replace(/\\s+/g, " ").trim() : "", index: i };
    });
  })()`);
}

/** Cena stránky boxu (NEZÁVISLE od ctx.cena): variant podľa priceId (necessaryVariantData) + zvolené príplatky z DOM. */
function cenaStrankyBoxu(t) {
  return t.ev(`(function () {
    var f = document.getElementById("product-detail-form"), pi = f.querySelector("input[name=priceId]").value, z = null;
    var nvd = shoptet.variantsSplit.necessaryVariantData;
    Object.keys(nvd).forEach(function (k) { if (String(nvd[k].id) === String(pi)) z = Number(nvd[k].priceUnformatted); });
    var p = 0;
    Array.prototype.forEach.call(f.querySelectorAll("select.surcharge-parameter"), function (s) {
      if (!s.value || s.value === "0" || s.selectedIndex < 0) return;
      var o = s.options[s.selectedIndex]; p += Number(o.getAttribute("data-surcharge-final-price")) || Number(o.getAttribute("data-surcharge-additional-price")) || 0;
    });
    return z == null ? null : Math.round((z + p) * 100) / 100;
  })()`);
}

/** „Pokračujte k súhrnu“ / Nie na boxe: kroky zatvorené a súhrn (Spolu + košík) na obrazovke. */
function stavSuhrnu(t) {
  return t.ev(`(function () { var e = document.querySelector(".lcd1v-suhrn"); var r = e && e.getBoundingClientRect();
    return { vidno: !!(r && r.top >= 0 && r.bottom <= innerHeight), aktivne: Array.prototype.map.call(document.querySelectorAll("#product-detail-form .lcd1v-krok.active"), function (k) { return k.className; }) }; })()`);
}

/** Na jednovrstvových po prenose: nový vzhľad beží, kľúč prijatý, otvorený `krok` (len on). */
async function poPrichode(s, j, { J, z, krok }) {
  const t = s.t;
  await t.cakaj(`location.pathname === ${JSON.stringify(cesta(J.url))}`, { ms: 40000, popis: "prechod na jednovrstvové " + J.id });
  t.zabudni();
  await t.cakaj(j.TYPY_TEST.jedno.pripravene, { ms: 40000, popis: "postavený konfigurátor " + J.id });
  await t.cakaj(`document.body.classList.contains("lcd-1v") && document.body.getAttribute("data-lcd1v-typ") === "jedno" && !!window.__lcd1v`, { ms: 30000, popis: "nový vzhľad na " + J.id });
  await t.cakaj(`!!document.querySelector("${F} .lcd1v-k-${krok}.active")`, { ms: 20000, popis: "otvorená karta " + krok + " po prenose" });
  await j.pauza(2300); // prenos.js dorovnáva otvorený krok do 2 s
  const st = await t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    return { otvorene: Array.prototype.map.call(f.querySelectorAll(".lcd1v-krok.active"), function (e) { var m = /lcd1v-k-(\\w+)/.exec(e.className); return m ? m[1] : e.className; }),
      kluc: (function () { try { return JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC)}) || "null"); } catch (e) { return null; } })(),
      chyby: window.__lcd1v.chyby.slice(), komplet: !!f.querySelector(".lcd1v-komplet"), veta: /preniesli|prenesen/i.test(f.innerText || "") };
  })()`);
  j.over(st.kluc && st.kluc.z === z && st.kluc.na === J.id && st.kluc.prijate > 0, `kľúč prenosu po príchode: ${JSON.stringify(st.kluc)} (z ${z}, na ${J.id})`);
  j.over(!st.chyby.length, `chyby 1V na ${J.id}: ${st.chyby.join("; ")}`);
  j.over(!st.komplet, `ponuka setu je aj na jednovrstvových ${J.id}`);
  j.over(!st.veta, `na ${J.id} je veta o prenose (len otvorený krok, žiadna veta navyše)`);
  return st;
}

/** POST po prenose = POST pri ručnom výbere, pole po poli. */
function rovnakePosty(j, p1, p2, kde) {
  const rozdiel = [];
  new Set([...Object.keys(p1.pole), ...Object.keys(p2.pole)]).forEach((k) => { if (p1.pole[k] !== p2.pole[k]) rozdiel.push(k + ": prenos " + p1.pole[k] + " / ručne " + p2.pole[k]); });
  j.over(!rozdiel.length, `${kde}: POST po prenose ≠ POST pri ručnom výbere: ${rozdiel.join("; ")}`);
}

/** Box 616 až po veľkosti: farba (index), počet, veľkosti -> { farba, box1, box2, box3 }. */
async function boxVyber(t, ovl, { farba, pocet, velkosti }) {
  const f = await ovl.boxy.vyberFarbu(t, { index: farba });
  await ovl.boxy.vyberPocet(t, pocet);
  const v = await ovl.boxy.vyberVelkosti(t, velkosti);
  return { farba: f, ...v };
}

export const SCENARE = {
  "kufor-komplet-nie": {
    typy: ["kufor-classic", "kufor-premium"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, rohoz = ROHOZ[P.typ], J = profil("jedno", P.vzor);
      j.over(J, "jednovrstvové vzoru " + P.vzor + " nie sú v profiloch");
      await j.otvor(s, a.url, { novy: true });
      const pred = await stavKarty(t);
      j.over(pred.je && !pred.vidno, `karta ponuky má byť pred výberom auta skrytá: ${JSON.stringify({ je: pred.je, vidno: pred.vidno })}`);
      const kroky0 = await cislaKrokov(t);
      // nezávislé čísla: voľba kufra na jednovrstvových (GET), cena rohože z profilu
      const vk = await volbaKufra(t, cesta(J.url), P.typ === "kufor-premium");
      j.over(vk && vk.cena > 0, "voľba kufra na " + J.url + " sa nedala zistiť (test)");
      const own = P.platne.spolu;
      await ovl.kroky.vyberAuto(t, j.AUTO);
      const st = await cakajKartu(t, "karta ponuky po výbere auta");
      j.over(st.vidno && !st.otvorena && !st.hotova && !st.cisloVidno && st.nm === "Autokoberce pod sedadlá" && st.vy === "Áno alebo nie",
        `zbalená karta po aute: ${JSON.stringify({ vidno: st.vidno, otvorena: st.otvorena, cislo: st.cisloVidno, nm: st.nm, vy: st.vy })}`);
      j.over(st.pred === "auto" && st.za === "farba", `karta v DOM medzi Autom a Farbou: pred ${st.pred}, za ${st.za}`);
      const pl = st.poloha;
      j.over(pl.auto && pl.karta && pl.farba && pl.auto.bottom <= pl.karta.top + 1 && pl.karta.bottom <= pl.farba.top + 1, `karta na obrazovke medzi Autom a Farbou: ${JSON.stringify(pl)}`);
      const kroky1 = await cislaKrokov(t);
      j.over(JSON.stringify(kroky1.ey) === JSON.stringify(kroky0.ey) && /3 krokoch/.test(kroky1.postup) && kroky1.dlazdice === 3 && kroky1.ey.every((x) => /^Krok \d z 3$/.test(x)),
        `počty krokov sa zmenili: pred ${JSON.stringify(kroky0)}, po ${JSON.stringify(kroky1)}`);
      // „Pokračujte ďalej“ v Aute otvorí kartu (nie Farbu)
      await t.klikni(`${F} .lcd1v-k-auto > .next-step-button`, { popis: "Pokračujte ďalej (Auto)" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky po „Pokračujte ďalej“ v Aute");
      const farbaOtv = await t.ev(`document.querySelector("${F} .lcd1v-k-farba").classList.contains("active")`);
      j.over(!farbaOtv, "po „Pokračujte ďalej“ v Aute sa otvorila Farba, má sa otvoriť karta ponuky");
      const us = overOtvorenu(j, otv, {
        pod: "Rohož do kufra " + rohoz + " len za " + eur(vk.cena) + ", keď ju kúpite spolu s autokobercami pod sedadlá.",
        dnm: "Autokoberce pod sedadlá", dpo: "+ rohož do kufra " + rohoz, dben: "Vzor aj auto Vám ostanú, rohož bude vo farbe autokobercov.",
        vSete: vk.cena, samostatne: own, pozn: "Pokračujete len s rohožou do kufra.",
        foto1: new RegExp("/img/1v/kroky-vzor-" + P.vzor + "\\.jpg$"), foto2: /\/user\/shop\//, kde: "karta " + P.id,
      });
      const og = await t.ev(`(document.querySelector('meta[property="og:image"]') || {}).content || ""`);
      j.over(otv.fotky[1].src.split("?")[0] === og.split("?")[0], `fotka rohože ${otv.fotky[1].src} ≠ og:image ${og}`);
      await overFokus(t, j, "karta " + P.id);
      if (t.mobil) j.over(otv.dlVyska > 0 && otv.dlVyska <= 560, `dlaždica na telefóne je vysoká ${otv.dlVyska} px (najviac 560)`);
      await snimka(s, a, "komplet-otazka", KARTA);
      // Nie -> karta zbalená, otvorí sa Farba
      await t.klikni(`${KARTA} .lcd1v-komplet__nie`, { popis: "Nie, ďakujem" });
      await t.cakaj(`document.querySelector("${F} .lcd1v-k-farba").classList.contains("active")`, { ms: 8000, popis: "otvorená Farba po „Nie, ďakujem“" });
      await j.pauza(500);
      const poNie = await stavKarty(t);
      j.over(!poNie.otvorena && poNie.hotova && poNie.vy === "Len rohož do kufra" && poNie.cisloVidno, `karta po Nie: ${JSON.stringify({ o: poNie.otvorena, h: poNie.hotova, vy: poNie.vy, fajka: poNie.cisloVidno })}`);
      await snimka(s, a, "komplet-po-nie", `${F} .lcd1v-k-auto`); // zbalená karta medzi Autom a otvorenou Farbou
      // farba -> POST = baseline rohože (profil platne)
      const farba = await ovl.kroky.vyberFarbu(t, { index: 2 });
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba });
      await j.overCenu(s, ovl, cena);
      j.over(post.pole.priceId === P.platne.priceId && cena.spolu === P.platne.spolu, `POST priceId ${post.pole.priceId} / suma ${cena.spolu} ≠ profil ${P.platne.priceId} / ${P.platne.spolu}`);
      j.over((await kluc(t)) === null, "po „Nie“ ostal kľúč prenosu v sessionStorage");
      return { info: `karta až po aute, medzi Autom a Farbou, bez čísla (3 kroky); Pokračujte -> karta; v sete ${vk.cena} €, samostatne ${own} €, ušetríte ${us} €; Nie -> Farba; POST = baseline ${P.id}`, post: post.body, spolu: cena.spolu };
    },
  },

  "kufor-komplet-ano": {
    typy: ["kufor-classic", "kufor-premium"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, druh = P.typ === "kufor-premium" ? "premium" : "classic", J = profil("jedno", P.vzor);
      j.over(J, "jednovrstvové vzoru " + P.vzor + " nie sú v profiloch");
      await j.otvor(s, a.url, { novy: true });
      const vk = await volbaKufra(t, cesta(J.url), druh === "premium");
      j.over(vk && vk.hodnota, "voľba kufra " + druh + " na " + J.url + " sa nedala zistiť (test)");
      const model = await ovl.kroky.vyberAuto(t, j.AUTO);
      await cakajKartu(t, "karta ponuky po výbere auta");
      // kartu otvorí aj hlavička
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty ponuky" });
      await cakajOtvorenu(t, "otvorená karta ponuky (hlavička)");
      await t.klikni(`${KARTA} .lcd1v-komplet__ano`, { popis: "Áno, chcem set s autokobercami" });
      const hned = await stavKarty(t).catch(() => null);
      if (hned && hned.je) {
        j.over(hned.prenos && hned.prenos.startsWith("Prenášame Váš výber na autokoberce pod sedadlá…"), `správa po Áno: „${hned.prenos}“`);
        j.over(hned.anoZablok && hned.nieZablok, "po Áno nie sú tlačidlá zablokované");
      }
      s.produkt = J;
      try {
        const pr = await poPrichode(s, j, { J, z: P.id, krok: "farba" });
        j.over(JSON.stringify(pr.otvorene) === '["farba"]', `otvorené karty na ${J.id}: ${pr.otvorene.join(", ")} (má byť len Farba)`);
        j.over(JSON.stringify(pr.kluc.vyber) === JSON.stringify({ kufor: vk.hodnota }), `výber v kľúči ${JSON.stringify(pr.kluc.vyber)} ≠ { kufor: ${vk.hodnota} }`);
        const idK = await t.idParametra("kufor"), idF = await t.idParametra("farba");
        const st = await t.ev(`(function () {
          var f = document.getElementById("product-detail-form");
          var p = f.querySelector('.upsale-buttons.trunk .lcd1v-kb__karta[aria-pressed="true"]');
          function hod(c) { var s = f.querySelector(".modl-selector-wrap ." + c + " select"); var o = s && s.selectedIndex > -1 && s.options[s.selectedIndex]; return o && s.value ? o.text.trim() : ""; }
          return { kufor: (f.querySelector('select[data-parameter-id="${idK}"]') || {}).value, karta: !!f.querySelector(".upsale-buttons.trunk > .parameter-cars > .upsale-button.active"),
            press: p ? p.getAttribute("data-kufor") : "", farba: (f.querySelector('select[data-parameter-id="${idF}"]') || {}).value || "",
            farbaTl: f.querySelectorAll('.content-wrap .option-button.active[data-variant="${idF}"]').length,
            model: sessionStorage.getItem("model"), polia: [hod("brands"), hod("models"), hod("years"), hod("type-selector")],
            autoHotove: !!f.querySelector(".lcd1v-k-auto.lcd1v-hotovy") };
        })()`);
        j.over(st.kufor === vk.hodnota && st.karta && st.press === druh, `rohož na ${J.id}: select ${st.kufor} (má ${vk.hodnota}), živá karta ${st.karta}, karta nového vzhľadu „${st.press}“`);
        j.over(st.model === model && JSON.stringify(st.polia) === JSON.stringify([j.AUTO.znacka, j.AUTO.model, j.AUTO.rok, j.AUTO.typ]) && st.autoHotove, `auto na ${J.id}: ${JSON.stringify(st)}`);
        j.over(!st.farba && !st.farbaTl, `farba na ${J.id} je predvolená (${st.farba}) — zákazník ju volí na autokobercoch`);
        if (a.snimky) await snimka(s, { ...a, produkt: P }, "komplet-ciel-" + J.id, `${F} .lcd1v-k-farba`);
        await nastavFormKluce(s);
        // zákazník doplní farbu a rozloženie -> POST
        const farba = await ovl.kroky.vyberFarbu(t, { index: 2 });
        const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
        await ovl.cena.pridajDoKosika(t);
        const post1 = await j.cakajNaPost(s);
        const cena1 = await j.overPost(s, post1, { farba, rozlozenie, kufor: vk.hodnota });
        const c1 = await j.overCenu(s, ovl, cena1);
        // ručný výber: tá istá stránka nanovo (kľúč je prijatý -> nič sa nepreberie), všetko kartami
        s.posty.length = 0;
        await j.otvor(s, J.url, { novy: true });
        const pred = await t.ev(`(document.querySelector('${F} select[data-parameter-id="${idK}"]') || {}).value || ""`);
        j.over(pred !== vk.hodnota, `pri druhej návšteve ${J.id} je rohož znova predvybraná (${pred}) — kľúč sa mal prijať len raz`);
        const z2 = await j.zaklad(s, ovl);
        const kufor2 = await ovl.kuforBoxy.vyberKufor(t, druh);
        j.over(kufor2 === vk.hodnota, `ručná voľba ${druh} = ${kufor2} ≠ ${vk.hodnota}`);
        await ovl.cena.pridajDoKosika(t);
        const post2 = await j.cakajNaPost(s);
        await j.overPost(s, post2, { ...z2.ocak, kufor: kufor2 });
        rovnakePosty(j, post1, post2, `${P.id} -> ${J.id}`);
        return { info: `${P.id} -> ${J.id}: rohož ${druh} (${vk.hodnota}) predvybraná, auto prenesené, otvorená Farba bez predvoľby; POST = ručný výber (${Object.keys(post1.pole).length} polí), ${c1.videne} €`, post: post1.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "box-komplet-nie": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, J = profil("jedno", "diamond");
      await j.otvor(s, a.url, { novy: true });
      const ciel = await boxyCiela(t, cesta(J.url));
      j.over(ciel.solo.M && ciel.solo.M.cena > 0, "Box solo M na " + J.url + " sa nedal zistiť (test): " + JSON.stringify(ciel.solo));
      const pred = await stavKarty(t);
      j.over(pred.je && !pred.vidno, `karta ponuky má byť pred výberom veľkosti skrytá: ${JSON.stringify({ je: pred.je, vidno: pred.vidno })}`);
      const kroky0 = await cislaKrokov(t);
      // farba a počet bez veľkosti: karta stále skrytá
      const farba = await ovl.boxy.vyberFarbu(t, { index: 2 });
      await ovl.boxy.vyberPocet(t, 1);
      await j.pauza(600);
      j.over(!(await stavKarty(t)).vidno, "karta ponuky je viditeľná pred výberom veľkosti");
      const v = await ovl.boxy.vyberVelkosti(t, ["M"]);
      const st = await cakajKartu(t, "karta ponuky po výbere veľkosti");
      j.over(st.vidno && !st.otvorena && !st.cisloVidno && st.nm === "Autokoberce pod sedadlá" && st.vy === "Áno alebo nie", `zbalená karta po veľkosti: ${JSON.stringify({ vidno: st.vidno, otvorena: st.otvorena, cislo: st.cisloVidno, nm: st.nm, vy: st.vy })}`);
      const pl = st.poloha;
      j.over(pl.velkost && pl.karta && pl.velkost.bottom <= pl.karta.top + 1 && pl.pocet.bottom <= pl.velkost.top + 1, `karta na obrazovke za kartou Veľkosť: ${JSON.stringify(pl)}`);
      const kroky1 = await cislaKrokov(t);
      j.over(JSON.stringify(kroky1.ey) === JSON.stringify(kroky0.ey) && /3 krokoch/.test(kroky1.postup) && kroky1.dlazdice === 3 && kroky1.ey.every((x) => /^Krok \d z 3$/.test(x)), `počty krokov sa zmenili: pred ${JSON.stringify(kroky0)}, po ${JSON.stringify(kroky1)}`);
      await snimka(s, a, "komplet-zbalena", `${F} .lcd1v-k-velkost`); // zbalená karta za kartou Veľkosť
      // „Pokračujte k súhrnu“ vo Veľkosti otvorí kartu (POST 0)
      await t.klikni(`${F} .lcd1v-k-velkost > .next-step-button`, { popis: "Pokračujte k súhrnu (Veľkosť)" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky po „Pokračujte k súhrnu“");
      const samo = await cenaStrankyBoxu(t);
      j.over(samo > 0, "cena stránky boxu sa nedala zistiť (test)");
      const us = overOtvorenu(j, otv, {
        pod: "Box do kufra M len za " + eur(ciel.solo.M.cena) + ", keď ho kúpite spolu s autokobercami pod sedadlá.",
        dnm: "Autokoberce pod sedadlá", dpo: "+ box do kufra M", dben: "Farba aj veľkosť boxu Vám ostanú.",
        vSete: ciel.solo.M.cena, samostatne: samo, pozn: "Pokračujete len s boxom do kufra.",
        foto1: /\/img\/1v\/kroky-vzor-diamond\.jpg$/, foto2: /\/img\/1v\/boxprodukt-pocet-1\.jpg$/, kde: "karta 616 (1 × M)",
      });
      await overFokus(t, j, "karta 616");
      j.over(s.posty.length === 0, "„Pokračujte k súhrnu“ poslal POST: " + (s.posty[0] && s.posty[0].body));
      await snimka(s, a, "komplet-otazka", KARTA);
      // Nie -> súhrn (kroky zatvorené), POST 0; potom košík -> baseline
      await t.klikni(`${KARTA} .lcd1v-komplet__nie`, { popis: "Nie, ďakujem" });
      await j.pauza(1500);
      const sh = await stavSuhrnu(t);
      const poNie = await stavKarty(t);
      j.over(!sh.aktivne.length && sh.vidno, `po „Nie“ majú byť kroky zatvorené a súhrn na obrazovke: ${JSON.stringify(sh)}`);
      j.over(!poNie.otvorena && poNie.hotova && poNie.vy === "Len box do kufra", `karta po Nie: ${JSON.stringify({ o: poNie.otvorena, h: poNie.hotova, vy: poNie.vy })}`);
      j.over(s.posty.length === 0, "„Nie, ďakujem“ poslal POST: " + (s.posty[0] && s.posty[0].body));
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba, box1: v.box1, box2: v.box2, box3: v.box3 });
      await j.overCenu(s, ovl, cena);
      j.over(post.pole.priceId === P.platne.priceId && cena.spolu === P.platne.spolu, `POST priceId ${post.pole.priceId} / suma ${cena.spolu} ≠ profil ${P.platne.priceId} / ${P.platne.spolu}`);
      j.over((await kluc(t)) === null, "po „Nie“ ostal kľúč prenosu v sessionStorage");
      return { info: `karta až po veľkosti, za Veľkosťou, bez čísla; Pokračujte k súhrnu -> karta; 1 × M v sete ${ciel.solo.M.cena} €, samostatne ${samo} €, ušetríte ${us} €; Nie -> súhrn; POST = baseline 616`, post: post.body, spolu: cena.spolu };
    },
  },

  "box-komplet-ano": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, J = profil("jedno", "diamond");
      await j.otvor(s, a.url, { novy: true });
      const ciel = await boxyCiela(t, cesta(J.url));
      const idF = await t.idParametra("farba");
      // farba, ktorú set má (podľa názvu, nezávisle): prvá zľava
      const farby = (await farbyBoxu(t, idF)).map((f) => ({ ...f, ciel: ciel.farby.find((c) => normFarby(c.text) === normFarby(f.text)) || null }));
      const fv = farby.find((f) => f.ciel);
      j.over(fv, "žiadna farba boxu 616 nie je v sete 598 (test): " + JSON.stringify(farby.map((f) => f.text)));
      // 1 × M -> karta s cenou boxu solo; potom 2 boxy M + L -> čísla sa prepočítajú
      await boxVyber(t, ovl, { farba: fv.index, pocet: 1, velkosti: ["M"] });
      const st1 = await cakajKartu(t, "karta ponuky (1 × M)");
      j.over(st1.cenaTx === eur(ciel.solo.M.cena), `1 × M: v sete „${st1.cenaTx}“ ≠ ${eur(ciel.solo.M.cena)}`);
      await ovl.boxy.vyberPocet(t, 2);
      await j.pauza(600);
      j.over(!(await stavKarty(t)).vidno, "pri 2 boxoch bez veľkosti 2. boxu je karta viditeľná");
      const v = await ovl.boxy.vyberVelkosti(t, ["M", "L"]);
      const vSete = Math.round((ciel.b1.M.cena + ciel.b2.L.cena) * 100) / 100;
      await t.cakaj(`((document.querySelector(${JSON.stringify(KARTA + " .lcd1v-komplet__cb-c")}) || {}).textContent || "").replace(/\\s+/g, " ").trim() === ${JSON.stringify(eur(vSete))}`, { ms: 10000, popis: "cena v karte prepočítaná na 2 boxy" });
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty ponuky" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky (2 boxy)");
      const samo = await cenaStrankyBoxu(t);
      const us = overOtvorenu(j, otv, {
        pod: "Boxy do kufra M + L len za " + eur(vSete) + ", keď ich kúpite spolu s autokobercami pod sedadlá.",
        dnm: "Autokoberce pod sedadlá", dpo: "+ 2 boxy do kufra M + L", dben: "Farba aj veľkosti boxov Vám ostanú.",
        vSete, samostatne: samo, pozn: "Pokračujete len s boxmi do kufra.",
        foto1: /\/img\/1v\/kroky-vzor-diamond\.jpg$/, foto2: /\/img\/1v\/boxprodukt-pocet-2\.jpg$/, kde: "karta 616 (2 × M + L)",
      });
      await snimka(s, a, "komplet-otazka-2boxy", KARTA);
      const ocak = { pocetBoxov: 2, farbaBoxov: fv.ciel.hodnota, box1: ciel.b1.M.hodnota, box2: ciel.b2.L.hodnota };
      await t.klikni(`${KARTA} .lcd1v-komplet__ano`, { popis: "Áno, chcem set s autokobercami" });
      s.produkt = J;
      try {
        const pr = await poPrichode(s, j, { J, z: P.id, krok: "auto" });
        j.over(JSON.stringify(pr.otvorene) === '["auto"]', `otvorené karty na ${J.id}: ${pr.otvorene.join(", ")} (má byť len Auto — box nemá auto)`);
        const kv = pr.kluc.vyber;
        j.over(kv.pocetBoxov === 2 && kv.farbaBoxov === ocak.farbaBoxov && kv.box1 === ocak.box1 && kv.box2 === ocak.box2 && !kv.boxSolo && !kv.kufor,
          `výber v kľúči ${JSON.stringify(kv)} ≠ ${JSON.stringify(ocak)} (farba „${fv.text}“ -> „${fv.ciel.text}“)`);
        const ids = {};
        for (const k of ["farbaBoxov", "box1", "box2"]) ids[k] = await t.idParametra(k);
        const st = await t.ev(`(function (ids) {
          var f = document.getElementById("product-detail-form");
          function v(k) { var s = f.querySelector('select[data-parameter-id="' + ids[k] + '"]'); return s ? s.value : null; }
          return { farbaBoxov: v("farbaBoxov"), box1: v("box1"), box2: v("box2"), okno: f.querySelector(".upsale-Banner").classList.contains("showConf"),
            karta: (f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active") || { getAttribute: function () { return ""; } }).getAttribute("value"),
            press: (f.querySelector('.upsale-buttons.boxs .lcd1v-kb__karta[aria-pressed="true"]') || { getAttribute: function () { return ""; } }).getAttribute("data-boxy") };
        })(${JSON.stringify(ids)})`);
        j.over(st.farbaBoxov === ocak.farbaBoxov && st.box1 === ocak.box1 && st.box2 === ocak.box2 && st.karta === "conf2" && st.press === "2" && !st.okno, `boxy na ${J.id}: ${JSON.stringify(st)}, majú byť ${JSON.stringify(ocak)} a okno zatvorené`);
        if (a.snimky) await snimka(s, { ...a, produkt: P }, "komplet-ciel-" + J.id, `${F} .upsale-buttons.boxs`);
        await nastavFormKluce(s);
        const z1 = await j.zaklad(s, ovl);
        await ovl.cena.pridajDoKosika(t);
        const post1 = await j.cakajNaPost(s);
        const cena1 = await j.overPost(s, post1, { ...z1.ocak, farbaBoxov: ocak.farbaBoxov, box1: ocak.box1, box2: ocak.box2 });
        const c1 = await j.overCenu(s, ovl, cena1);
        // ručne: nanovo, auto + farba + rozloženie + 2 boxy M + L v tej istej farbe
        s.posty.length = 0;
        await j.otvor(s, J.url, { novy: true });
        const z2 = await j.zaklad(s, ovl);
        const idFb = ids.farbaBoxov;
        const idx = await t.ev(`Array.prototype.map.call(document.querySelectorAll(${JSON.stringify(OKNO + " .parameter-wrap.parameter-" + idFb + " .option-button")}), function (b) { return b.getAttribute("data-value"); }).indexOf(${JSON.stringify(ocak.farbaBoxov)})`);
        j.over(idx > -1, `farba boxov ${ocak.farbaBoxov} nie je v okne boxov ${J.id}`);
        const b = await ovl.kuforBoxy.vyberBoxy(t, { pocet: 2, farba: idx, velkost: "M", velkost2: "L" });
        j.over(b.farbaBoxov === ocak.farbaBoxov && b.box1 === ocak.box1 && b.box2 === ocak.box2, `ručné boxy ${JSON.stringify(b)} ≠ ${JSON.stringify(ocak)}`);
        await ovl.cena.pridajDoKosika(t);
        const post2 = await j.cakajNaPost(s);
        await j.overPost(s, post2, { ...z2.ocak, farbaBoxov: b.farbaBoxov, box1: b.box1, box2: b.box2 });
        rovnakePosty(j, post1, post2, `616 -> ${J.id}`);
        return { info: `1 × M -> 2 × M + L: v sete ${vSete} € (živo), samostatne ${samo} €, ušetríte ${us} €; Áno -> ${J.id}: 2 boxy, farba „${fv.text}“ -> ${ocak.farbaBoxov}, veľkosti prenesené, okno zatvorené; POST = ručný výber (${Object.keys(post1.pole).length} polí), ${c1.videne} €`, post: post1.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "box-komplet-seda": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, J = profil("jedno", "diamond");
      await j.otvor(s, a.url, { novy: true });
      const ciel = await boxyCiela(t, cesta(J.url));
      const idF = await t.idParametra("farba");
      const farby = (await farbyBoxu(t, idF)).map((f) => ({ ...f, ciel: ciel.farby.find((c) => normFarby(c.text) === normFarby(f.text)) || null }));
      const bez = farby.find((f) => !f.ciel);
      if (!bez) return { preskoc: "všetky farby boxu 616 sú v sete 598 — nie je čo skúšať" };
      await boxVyber(t, ovl, { farba: bez.index, pocet: 1, velkosti: ["S"] });
      await cakajKartu(t, "karta ponuky (farba mimo setu)");
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty ponuky" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky (farba mimo setu)");
      const nazov = cisty(otv.dben).replace(/^Farba „([^“]+)“.*$/, "$1");
      j.over(otv.dben === "Farba „" + nazov + "“ sa v sete neponúka, farbu boxu si vyberiete pri autokobercoch." && normFarby(nazov) === normFarby(bez.text),
        `veta o farbe mimo setu: „${otv.dben}“ (farba „${bez.text}“)`);
      j.over(otv.cb && otv.cb.c === eur(ciel.solo.S.cena), `v sete „${otv.cb && otv.cb.c}“ ≠ Box solo S ${eur(ciel.solo.S.cena)}`);
      await snimka(s, a, "komplet-seda", KARTA);
      await t.klikni(`${KARTA} .lcd1v-komplet__ano`, { popis: "Áno, chcem set s autokobercami" });
      s.produkt = J;
      try {
        // okno boxov je v kroku boxov -> otvorený krok Boxy s oknom na výber farby (prenos.js otvorPoPrenose)
        const pr = await poPrichode(s, j, { J, z: P.id, krok: "boxy" });
        j.over(JSON.stringify(pr.otvorene) === '["boxy"]', `otvorené karty na ${J.id}: ${pr.otvorene.join(", ")} (má byť krok Boxy s oknom)`);
        j.over(JSON.stringify(pr.kluc.vyber) === JSON.stringify({ pocetBoxov: 1, boxSolo: ciel.solo.S.hodnota }), `výber v kľúči ${JSON.stringify(pr.kluc.vyber)} — farba sa nemá prenášať`);
        const ids = {};
        for (const k of ["farbaBoxov", "boxSolo"]) ids[k] = await t.idParametra(k);
        const st = await t.ev(`(function (ids) {
          var f = document.getElementById("product-detail-form"), b = f.querySelector(".upsale-Banner");
          function v(k) { var s = f.querySelector('select[data-parameter-id="' + ids[k] + '"]'); return s ? s.value : null; }
          var o = f.querySelector(".upsale-Banner.lcd1v-kb .box-config"), c = o && getComputedStyle(o);
          return { farbaBoxov: v("farbaBoxov"), boxSolo: v("boxSolo"), okno: b.classList.contains("showConf"), oknoVidno: !!(c && c.visibility === "visible" && c.opacity === "1"),
            karta: (f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active") || { getAttribute: function () { return ""; } }).getAttribute("value") };
        })(${JSON.stringify(ids)})`);
        j.over(st.okno && st.oknoVidno && st.karta === "conf1" && st.boxSolo === ciel.solo.S.hodnota && !st.farbaBoxov, `na ${J.id} má byť otvorené okno boxov s veľkosťou a bez farby: ${JSON.stringify(st)}`);
        if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-komplet-seda-ciel-${J.id}-${t.sirka}.png`)).catch(() => {});
        // zákazník zvolí farbu v okne a potvrdí
        await t.klikni(`${OKNO} .parameter-wrap.parameter-${ids.farbaBoxov} .option-button`, { index: 0, popis: "farba boxov v okne" });
        await t.cakaj(`!!(document.querySelector('${F} select[data-parameter-id="${ids.farbaBoxov}"]') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
        await t.klikni(`${OKNO} .lcd1v-bx__ok`, { popis: "Potvrďte výber boxov" });
        await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { ms: 8000, popis: "okno boxov zavreté po potvrdení" });
        // po zatvorení okna prvý nevyplnený krok (box nemá auto -> Auto)
        await t.cakaj(`!!document.querySelector("${F} .lcd1v-k-auto.active")`, { ms: 8000, popis: "otvorené Auto po potvrdení boxov" });
        const fb = await t.ev(`document.querySelector('${F} select[data-parameter-id="${ids.farbaBoxov}"]').value`);
        await nastavFormKluce(s);
        const z = await j.zaklad(s, ovl);
        await ovl.cena.pridajDoKosika(t);
        const post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { ...z.ocak, farbaBoxov: fb, boxSolo: ciel.solo.S.hodnota });
        const c = await j.overCenu(s, ovl, cena);
        return { info: `farba „${bez.text}“ mimo setu: veta v dlaždici, Áno -> ${J.id}: 1 box S prenesený, okno boxov otvorené na farbu; po farbe a potvrdení POST platný, ${c.videne} €`, post: post.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "box-komplet-3": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t;
      await j.otvor(s, a.url, { novy: true });
      const z = await boxVyber(t, ovl, { farba: 2, pocet: 2, velkosti: ["S", "S"] });
      await cakajKartu(t, "karta ponuky pri 2 boxoch");
      await ovl.boxy.vyberPocet(t, 3);
      const v = await ovl.boxy.vyberVelkosti(t, ["S", "S", "M"]);
      await j.pauza(800);
      const st = await stavKarty(t);
      j.over(st.je && !st.vidno, `pri 3 boxoch (set má najviac 2) je karta ponuky viditeľná`);
      await t.klikni(`${F} .lcd1v-k-velkost > .next-step-button`, { popis: "Pokračujte k súhrnu (3 boxy)" });
      await j.pauza(1500);
      const sh = await stavSuhrnu(t);
      j.over(!sh.aktivne.length && sh.vidno, `3 boxy: „Pokračujte k súhrnu“ má ísť rovno na súhrn: ${JSON.stringify(sh)}`);
      j.over(s.posty.length === 0, "„Pokračujte k súhrnu“ poslal POST: " + (s.posty[0] && s.posty[0].body));
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba: z.farba, box1: v.box1, box2: v.box2, box3: v.box3 });
      const c = await j.overCenu(s, ovl, cena);
      return { info: `2 boxy: karta viditeľná; 3 boxy: karta skrytá, Pokračujte k súhrnu -> súhrn; POST 3 boxov ${c.videne} €`, post: post.body, spolu: cena.spolu };
    },
  },
};

