// Scenáre ponuky setu s autokobercami pod sedadlá na sólo rohožiach do kufra (619–634) a boxe (616) — Michal 17. 10. 2026
// (návrh 1 „Ponuka ako druhá vrstva“: skrytá karta bez čísla; rohož PRED Farbou, box hneď POD jedinou kartou „Vaše boxy
// do kufra“ — Michal 23. 10. 2026, variant C). Kód:
// assets/js/components/konfigurator1v/komplet-ponuka.js + prenos.js (box bez farby v sete) + assets/css/_lcd1v-komplet.scss.
// Tvar scenára: tools/test-1v/scenare-jedno.mjs. Všetko s ?novy=1 (bez flagu sa scenár preskočí; starý vzhľad stráži
// nulova-zmena). Každý POST košíka je zachytený a zrušený (jadro testu).
//
//   kufor-komplet-nie  karta skrytá, kým nie je auto úplné; potom viditeľná BEZ čísla medzi kartou Auto a Farba (DOM aj
//                      obrazovka), postup „… v 3 krokoch“ a „Krok N z 3“ bez zmeny; „Pokračujte ďalej“ v Aute otvorí kartu
//                      (nie Farbu); telo karty = banner setu C (Michal 17. 10. 2026: „toto má byť v medzikroku, nie ďalší
//                      iný banner“): „Rohož do kufra … len za X €“ + „keď ju kúpite spolu s autokobercami pod sedadlá“,
//                      „Samostatne <s>Y €</s>“, „Ušetríte Z €“, stuha „Zľava −P %“ (bez prekrytia, set-banner-kontrola.mjs),
//                      fotka pozadia set-banner-autokoberce-480/800 (lenivo, ≤ 80 kB), malá fotka = og:image; čísla zistené
//                      NEZÁVISLE (GET jednovrstvových toho istého vzoru: voľba kufra dno / dno + boky; profil: cena rohože);
//                      zelené Áno v banneri, zlaté Nie pod ním; Nie -> karta zbalená („Len rohož do kufra“), otvorí sa Farba;
//                      farba -> POST = baseline (profil platne: priceId, suma)
//   kufor-komplet-ano  hlavička karty -> Áno -> jednovrstvové toho istého vzoru: rohož (Classic = dno, Premium = dno + boky)
//                      predvybraná, auto prenesené, otvorená Farba bez predvoľby; farba + rozloženie -> POST; tá istá
//                      stránka nanovo a všetko ručne -> POST rovnaký pole po poli
//   box-komplet-nie    karta skrytá, kým nie je zvolená farba; potom zbalená hneď pod kartou „Vaše boxy do kufra“ bez čísla
//                      (postup skrytý — jedna karta boxu); hlavička ju otvorí (karta boxov sa zbalí); bez veľkosti „Box do
//                      kufra už od X €“ (X = najlacnejší Box solo na 598, GET), „Box S samostatne Y €“ (Y = variant +
//                      príplatok tej istej veľkosti na 616, z DOM); Nie -> späť do karty boxov, POST 0; veľkosť M + košík ->
//                      POST = baseline (profil platne 1 × M)
//   box-komplet-ano    1 box M (presné „Box do kufra M len za“) -> 2 boxy bez veľkostí („Boxy do kufra už od“) -> M + L:
//                      čísla v karte sa prepočítajú živo („Boxy do kufra M + L len za X €“, X = 1. box M + 2. box L na
//                      598); „Pokračujte k súhrnu“ v karte boxov ju pri úplnom výbere otvorí sama (karta boxov sa zbalí);
//                      farba, ktorú set má (podľa názvu); Áno -> 598: počet, farba boxov a veľkosti prenesené, okno
//                      boxov zatvorené; auto + farba + rozloženie -> POST; nanovo ručne -> POST rovnaký pole po poli
//   box-komplet-od     „Áno“ v karte otvorenej hlavičkou (veľkosť ešte nezvolená): 598 dostane počet a farbu, okno boxov ostane otvorené
//                      na výber veľkosti; zákazník ju zvolí a potvrdí; auto + farba + rozloženie -> POST platný (box solo,
//                      farba boxov)
//   box-komplet-seda   farba boxu, ktorú set nemá (test ju hľadá sám porovnaním názvov 616 a 598; do 22. 10. 2026 „Šedá“,
//                      po prestavení svetlého boxu na Béžovú žiadna -> preskočí sa), veľkosť S zvolená: veta pod bannerom
//                      to povie; Áno -> 598: počet a veľkosť prenesené, farba nie — okno boxov otvorené na výber farby;
//                      zákazník zvolí farbu a potvrdí; auto + farba + rozloženie -> POST platný (box solo, farba boxov)
//   box-komplet-bezova svetlý box „Béžová“ (Michal 22. 10. 2026: šedý box je chyba; admin 616 558 „Šedá“ -> 561 „Béžová“),
//                      1 box S: veta „Farba aj veľkosť boxu Vám ostanú.“; Áno -> 598: kľúč prenosu a selecty = Box solo S
//                      + farba boxov Béžová (727, podľa názvu nezávisle od kódu), kresba v okne boxov béžová; POST 0.
//                      Kým admin 616 hovorí „Šedá“, preskočí sa (s pokynom spustiť znova)
//   box-komplet-3      3 boxy: karta sa neukáže (ani keď bola pri 2 boxoch viditeľná), „Pokračujte k súhrnu“ v karte boxov
//                      ide rovno na súhrn; POST 3 boxov platný
import { statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUKTY } from "./produkty.mjs";
import { stavStuhy, overStuhu, percentoZlavy } from "./set-banner-kontrola.mjs";
import { F } from "./stary-ui.mjs";

const KARTA = `${F} .lcd1v-komplet`;
const BANNER = `${KARTA} .lcd1v-bs`;
const IMG_1V = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "assets", "img", "1v");
const FOTKA_BANNERA = ["set-banner-autokoberce-480.jpg", "set-banner-autokoberce-800.jpg"];
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
    var bs = k.querySelector(".lcd1v-bs"), ano = k.querySelector(".lcd1v-komplet__ano"), nie = k.querySelector(".lcd1v-komplet__nie");
    var meno = function (e) { var m = e && /lcd1v-k-(\\w+)/.exec(e.className || ""); return m ? m[1] : (e ? (e.className || e.tagName) : null); };
    var bg = bs && bs.querySelector("img.lcd1v-bs__bg"), pip = bs && bs.querySelector(".lcd1v-bs__pip img"), ss = bs && bs.querySelector(".lcd1v-bs__s s");
    return {
      je: true, vidno: vid(k), otvorena: k.classList.contains("active"), hotova: k.classList.contains("lcd1v-hotovy"),
      ey: tx(":scope > .lcd1v-hd .lcd1v-ey"), nm: tx(":scope > .lcd1v-hd .lcd1v-nm"), ti: tx(":scope > .lcd1v-hd .lcd1v-ti"), vy: tx(":scope > .lcd1v-hd .lcd1v-vy"),
      cislo: tx(":scope > .lcd1v-hd .lcd1v-no"), cisloVidno: vid(k.querySelector(":scope > .lcd1v-hd .lcd1v-no")),
      pod: tx(":scope > .lcd1v-pod"), ben: tx(".lcd1v-bs .lcd1v-komplet__ben"),
      // banner setu C v tele karty (set-banner.js)
      bs: vid(bs) ? { ey: tx(".lcd1v-bs__ey"), h: tx(".lcd1v-bs__h"), c: tx(".lcd1v-bs__c"), kd: tx(".lcd1v-bs__kd"), s: tx(".lcd1v-bs__s"), pr: tx(".lcd1v-bs__s s"),
        u: tx(".lcd1v-bs__u"), tag: tx(".lcd1v-bs__tag"), pip: tx(".lcd1v-bs__pip i"), attr: bs.getAttribute("data-lcd1v-set"),
        poradie: Array.prototype.map.call(bs.querySelectorAll(".lcd1v-bs__row > *"), function (e) { return e.className; }).join(","),
        ciara: ss ? getComputedStyle(ss).textDecorationLine : "", cPx: Math.round(parseFloat(getComputedStyle(bs.querySelector(".lcd1v-bs__c")).fontSize)),
        bgSrc: bg ? bg.currentSrc || bg.getAttribute("src") : "", bgSrcset: bg ? bg.getAttribute("srcset") || "" : "", bgLoading: bg ? bg.getAttribute("loading") : null,
        pipSrc: pip ? pip.getAttribute("src") : null, pipLoading: pip ? pip.getAttribute("loading") : null, pipPx: pip ? Math.round(pip.getBoundingClientRect().width) : 0,
        fotkyOk: Array.prototype.every.call(bs.querySelectorAll("img"), function (i) { return i.complete && i.naturalWidth > 0; }),
        vyska: Math.round(bs.getBoundingClientRect().height), pretek: bs.scrollWidth > bs.clientWidth + 1 } : null,
      cenaTx: tx(".lcd1v-bs__c"), // aj pri zbalenej karte (banner je v skrytom tele karty)
      ano: tl(ano), nie: tl(nie), pozn: tx(":scope > .lcd1v-pozn"),
      anoVBanneri: !!(bs && ano && bs.contains(ano)), bsTlacidiel: bs ? bs.querySelectorAll("button, a").length : 0,
      anoNadNie: !!(ano && nie && ano.getBoundingClientRect().bottom <= nie.getBoundingClientRect().top),
      maName: !!k.querySelector("[name]"), anoZablok: !!(ano && ano.disabled), nieZablok: !!(nie && nie.disabled),
      prenos: vid(k.querySelector(".lcd1v-komplet__prenos")) ? tx(".lcd1v-komplet__prenos") : null,
      text: k.textContent.replace(/\\s+/g, " ").trim(),
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

/** Snímka otvorenej ponuky setu na boxe (len s --snimky): výrez od zbalenej karty boxov po spodok karty ponuky (aj mimo
 *  okna), bublina a okno chatu skryté. */
async function snimkaPonukyBoxu(s, a, meno) {
  if (!a.snimky) return;
  const t = s.t;
  const r = await t.ev(`(function () {
    [].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"]'), function (f) { f.setAttribute("data-skryte-snimka", "1"); f.style.setProperty("visibility", "hidden", "important"); });
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (e) { if (!e.closest("#product-detail-form") && /Začať konverzáciu|Sme práve online/.test(e.textContent || "") && getComputedStyle(e).position === "fixed") { e.setAttribute("data-skryte-snimka", "1"); e.style.setProperty("visibility", "hidden", "important"); } });
    var b = document.querySelector("${F} .lcd1v-k-farba"), k = document.querySelector(${JSON.stringify(KARTA)});
    if (!b || !k) return null;
    var y0 = b.getBoundingClientRect().top + window.scrollY - 30, y1 = k.getBoundingClientRect().bottom + window.scrollY + 30;
    return { y: Math.max(0, Math.round(y0)), h: Math.round(y1 - y0) };
  })()`);
  if (!r) return;
  await t.pauza(500);
  try {
    const o = await s.k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: r.y, width: t.sirka, height: Math.min(r.h, 6000), scale: 1 } });
    writeFileSync(join(a.snimky, `${a.produkt.id}-karta-${meno}-${t.sirka}.png`), Buffer.from(o.data, "base64"));
  } catch (e) { (s.upozornenia || []).push("snímka " + meno + ": " + e.message); }
  await t.ev(`[].forEach.call(document.querySelectorAll("[data-skryte-snimka]"), function (e) { e.style.removeProperty("visibility"); e.removeAttribute("data-skryte-snimka"); })`);
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

/** Čaká, kým je karta viditeľná a má banner s cenou (čísla prídu z GET jednovrstvových) -> stav karty. */
async function cakajKartu(t, popis) {
  await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); var c = k && k.querySelector(".lcd1v-bs__c");
    return !!(k && !k.hidden && k.offsetHeight > 30 && c && c.textContent.trim()); })()`, { ms: 30000, popis });
  return stavKarty(t);
}

/** Otvorená karta (po „Pokračujte“ alebo hlavičke): výška > 200 px, fotky banneru načítané. */
async function cakajOtvorenu(t, popis) {
  await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); return !!(k && k.classList.contains("active") && k.getBoundingClientRect().height > 200); })()`, { ms: 10000, popis });
  await t.ev(`document.querySelector(${JSON.stringify(BANNER)}).scrollIntoView({ block: "center", behavior: "instant" })`);
  await t.cakaj(`Array.prototype.every.call(document.querySelectorAll(${JSON.stringify(BANNER + " img")}), function (i) { return i.complete && i.naturalWidth > 0; })`, { ms: 15000, popis: "fotky banneru ponuky" });
  await t.pauza(400);
  return stavKarty(t);
}

/** Spoločné kontroly otvorenej karty: nadpis, banner C (texty, čísla podaj zvonka, stuha, fotky), tlačidlá, bez „+ číslo“. */
async function overOtvorenu(t, j, st, { h, kd, pip, ben, vSete, samostatne, sam = "Samostatne", pozn, pipSrc, kde }) {
  j.over(st.ti === "Prosíte si aj autokoberce pod sedadlá?", `${kde}: nadpis „${st.ti}“`);
  j.over(st.ey === "Autokoberce pod sedadlá" && !st.cisloVidno, `${kde}: karta bez čísla (eyebrow „${st.ey}“, číslo „${st.cislo}“ viditeľné ${st.cisloVidno})`);
  j.over(!st.pod, `${kde}: nad bannerom nemá byť veta (banner hovorí všetko): „${st.pod}“`);
  const us = Math.round((samostatne - vSete) * 100) / 100;
  const B = st.bs;
  j.over(!!B, `${kde}: banner setu v karte nie je viditeľný`);
  if (!B) return us;
  // texty banneru C (Michal 17. 10. 2026): cena v sete s vysvetlením, nikdy „+ X €“ (vyzerá ako príplatok k cene hore)
  j.over(cisty(B.ey) === "★ Výhodnejšie v sete" && B.h === h && cisty(B.c) === eur(vSete) && B.kd === kd,
    `${kde}: banner „${B.ey} | ${B.h} | ${B.c} | ${B.kd}“ ≠ „★ Výhodnejšie v sete | ${h} | ${eur(vSete)} | ${kd}“`);
  j.over(cisty(B.s) === sam + " " + eur(samostatne) && cisty(B.pr) === eur(samostatne) && /line-through/.test(B.ciara) && cisty(B.u) === "Ušetríte " + eur(us),
    `${kde}: „${B.s}“ / „${B.u}“ ≠ ${sam} ${eur(samostatne)} (prečiarknuté) / Ušetríte ${eur(us)}`);
  j.over(B.poradie === "lcd1v-bs__c,lcd1v-bs__kd,lcd1v-bs__sb", `${kde}: poradie v DOM (čítačka: cena hneď s podmienkou): ${B.poradie}`);
  j.over(Number(B.attr) === vSete, `${kde}: data-lcd1v-set ${B.attr} ≠ ${vSete}`);
  j.over(B.cPx >= 40, `${kde}: cena v sete má byť veľká (${B.cPx} px)`);
  // bez štítkov na fotkách, malá fotka produktu väčšia (Michal 18. 10. 2026: „tie texty daj preč, radšej daj tú fotku väčšiu“)
  j.over(!B.tag && !B.pip && B.pipPx >= 88, `${kde}: banner má byť bez štítkov na fotkách a s väčšou fotkou produktu: ${JSON.stringify({ tag: B.tag, pip: B.pip, px: B.pipPx })}`);
  j.over(!B.pretek, `${kde}: banner preteká`);
  // fotky: pozadie = reálne autokoberce (lenivo, srcset), malá fotka = rohož (og:image) / box podľa počtu
  j.over(B.fotkyOk && B.bgLoading === "lazy" && B.pipLoading === "lazy" && FOTKA_BANNERA.every((x) => B.bgSrcset.includes("/img/1v/" + x)) && /\/img\/1v\/set-banner-autokoberce-(480|800)\.jpg$/.test(B.bgSrc),
    `${kde}: fotky banneru: ok ${B.fotkyOk}, loading ${B.bgLoading}/${B.pipLoading}, ${B.bgSrc}, srcset ${B.bgSrcset}`);
  j.over(pipSrc.test(String(B.pipSrc || "").split("?")[0]), `${kde}: malá fotka ${B.pipSrc} ≠ ${pipSrc}`);
  const velkosti = FOTKA_BANNERA.map((x) => statSync(join(IMG_1V, x)).size);
  j.over(velkosti.every((v) => v <= 82000), `${kde}: fotky pozadia banneru majú byť ≤ 80 kB: ${velkosti.join(" / ")} B`);
  // stuha „Zľava −X %“ (percento z nezávislých čísel testu), bez prekrytia textu, tlačidla a štítkov; bunky pod cenou ≥ 20 px
  const G = await t.ev(stavStuhy(BANNER));
  overStuhu(j, G, { percento: percentoZlavy(samostatne, vSete), popis: `${kde}: round((${samostatne} − ${vSete}) / ${samostatne} × 100)` });
  j.over(st.ben === ben, `${kde}: veta pod bannerom „${st.ben}“ ≠ „${ben}“`);
  // tlačidlá: zelené „Áno“ v banneri (kam chceme zákazníka), zlaté „Nie“ pod ním; skutočné <button type=button>
  j.over(st.ano && st.ano.tag === "BUTTON" && st.ano.typ === "button" && st.ano.text === "Áno, chcem set s autokobercami" && st.ano.tab >= 0 && st.ano.vidno && st.anoVBanneri,
    `${kde}: tlačidlo Áno ${JSON.stringify(st.ano)} (v banneri ${st.anoVBanneri})`);
  j.over(st.nie && st.nie.tag === "BUTTON" && st.nie.typ === "button" && st.nie.text === "Nie, ďakujem" && st.nie.vidno && st.pozn === pozn, `${kde}: tlačidlo Nie ${JSON.stringify(st.nie)} / „${st.pozn}“`);
  j.over(st.bsTlacidiel === 1 && st.anoNadNie, `${kde}: banner má ${st.bsTlacidiel} tlačidiel/odkazov (1 = Áno), Áno nad Nie ${st.anoNadNie}`);
  j.over(/47, 156, 104|29, 107, 74/.test(st.ano.pozadie) && /196, 155, 49|177, 136, 34|226, 190, 92/.test(st.nie.pozadie), `${kde}: farby Áno (zelené) ${st.ano.pozadie} / Nie (zlaté) ${st.nie.pozadie}`);
  // ceny setu bez „+“ (Michal 17. 10. 2026: „+ X €“ vyzerá ako príplatok); „2 boxy“ je počet, nie cena
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

/** Box 616 (NEZÁVISLE z DOM): príplatok veľkosti `pismeno` pri `kluc` (box1 / box2) -> číslo alebo null. */
async function priplatokBoxu(t, kluc, pismeno) {
  const id = await t.idParametra(kluc);
  return t.ev(`(function (id, p) {
    var s = document.querySelector('${F} select[data-parameter-id="' + id + '"]');
    var o = s && Array.prototype.find.call(s.options, function (x) { var m = /^\\s*(XL|[SML])\\s*:/.exec(x.textContent); return x.value && m && m[1] === p; });
    return o ? (Number(o.getAttribute("data-surcharge-final-price")) || Number(o.getAttribute("data-surcharge-additional-price")) || 0) : null;
  })(${JSON.stringify(id)}, ${JSON.stringify(pismeno)})`);
}

/** Najlacnejšia veľkosť v sete (598) z velkosti() boxyCiela -> písmeno (dnes S). */
const najlacnejsia = (o) => Object.keys(o || {}).filter((k) => o[k].cena > 0).sort((x, y) => o[x].cena - o[y].cena)[0] || null;

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
      const og = await t.ev(`(document.querySelector('meta[property="og:image"]') || {}).content || ""`);
      const us = await overOtvorenu(t, j, otv, {
        h: "Rohož do kufra " + rohoz + " len za", kd: "keď ju kúpite spolu s autokobercami pod sedadlá", pip: "Rohož do kufra " + rohoz,
        ben: "Vzor aj auto Vám ostanú, rohož bude vo farbe autokobercov.",
        vSete: vk.cena, samostatne: own, pozn: "Pokračujete len s rohožou do kufra.",
        pipSrc: new RegExp("^" + og.split("?")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), kde: "karta " + P.id,
      });
      await overFokus(t, j, "karta " + P.id);
      if (t.mobil && otv.bs) j.over(otv.bs.vyska > 0 && otv.bs.vyska <= 640, `banner na telefóne je vysoký ${otv.bs.vyska} px (najviac 640)`);
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
      const L = najlacnejsia(ciel.solo);
      j.over(L && ciel.solo.M && ciel.solo.M.cena > 0, "Box solo na " + J.url + " sa nedal zistiť (test): " + JSON.stringify(ciel.solo));
      const pred = await stavKarty(t);
      j.over(pred.je && !pred.vidno, `karta ponuky má byť pred výberom farby skrytá: ${JSON.stringify({ je: pred.je, vidno: pred.vidno })}`);
      // farba (index 2, v sete je) -> karta viditeľná hneď pod kartou „Vaše boxy do kufra“
      const farba = await ovl.boxy.vyberFarbu(t, { index: 2 });
      await ovl.boxy.vyberPocet(t, 1);
      const st = await cakajKartu(t, "karta ponuky po farbe a počte");
      j.over(st.vidno && !st.otvorena && !st.cisloVidno && st.nm === "Autokoberce pod sedadlá" && st.vy === "Áno alebo nie", `zbalená karta po počte: ${JSON.stringify({ vidno: st.vidno, otvorena: st.otvorena, cislo: st.cisloVidno, nm: st.nm, vy: st.vy })}`);
      const pl = st.poloha;
      j.over(pl.farba && pl.karta && pl.farba.bottom <= pl.karta.top + 1, `karta na obrazovke hneď pod kartou boxov: ${JSON.stringify(pl)}`);
      // jedna karta boxu: postup („Hotovo N z M“) skrytý, karta ponuky ho nemení
      const postup = await t.ev(`(function () { var p = document.querySelector(".lcd1v-postup"); return !!(p && p.getClientRects().length); })()`);
      j.over(!postup, "postup krokov má byť na boxe skrytý (jedna karta)");
      // hlavička otvorí kartu (bez veľkosti „už od“), karta boxov sa zbalí (POST 0)
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty ponuky" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky po kliku na hlavičku");
      j.over(!(await t.ev(`document.querySelector("${F} .lcd1v-k-farba").classList.contains("active")`)), "po otvorení ponuky ostala otvorená aj karta boxov (má byť otvorená len jedna karta)");
      // bez veľkosti: „už od“ = najlacnejší Box solo; samostatne = variant + príplatok tej istej veľkosti na 616
      const pr = await priplatokBoxu(t, "box1", L);
      const variant = await cenaStrankyBoxu(t);
      j.over(pr != null && variant > 0, `príplatok ${L} / variant 616 sa nedal zistiť (test): ${pr} / ${variant}`);
      const samo = Math.round((variant + pr) * 100) / 100;
      const us = await overOtvorenu(t, j, otv, {
        h: "Box do kufra už od", kd: "keď ho kúpite spolu s autokobercami pod sedadlá", pip: "Box do kufra",
        ben: "Farba boxu Vám ostane, veľkosť vyberiete pri autokobercoch.",
        vSete: ciel.solo[L].cena, samostatne: samo, sam: "Box " + L + " samostatne", pozn: "Pokračujete len s boxom do kufra.",
        pipSrc: /\/img\/1v\/boxprodukt-pocet-1\.jpg$/, kde: "karta 616 (1 box bez veľkosti)",
      });
      await overFokus(t, j, "karta 616");
      j.over(s.posty.length === 0, "„Pokračujte ďalej“ poslal POST: " + (s.posty[0] && s.posty[0].body));
      await snimka(s, a, "komplet-otazka", KARTA);
      // Nie bez veľkostí -> späť do karty boxov, POST 0; potom veľkosť M + košík -> baseline
      await t.klikni(`${KARTA} .lcd1v-komplet__nie`, { popis: "Nie, ďakujem" });
      await t.cakaj(`document.querySelector("${F} .lcd1v-k-farba").classList.contains("active")`, { ms: 8000, popis: "otvorená karta boxov po Nie" });
      const poNie = await stavKarty(t);
      j.over(!poNie.otvorena && poNie.hotova && poNie.vy === "Len box do kufra", `karta po Nie: ${JSON.stringify({ o: poNie.otvorena, h: poNie.hotova, vy: poNie.vy })}`);
      j.over(s.posty.length === 0, "„Nie, ďakujem“ poslal POST: " + (s.posty[0] && s.posty[0].body));
      const v = await ovl.boxy.vyberVelkosti(t, ["M"]);
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba, box1: v.box1, box2: v.box2, box3: v.box3 });
      await j.overCenu(s, ovl, cena);
      j.over(post.pole.priceId === P.platne.priceId && cena.spolu === P.platne.spolu, `POST priceId ${post.pole.priceId} / suma ${cena.spolu} ≠ profil ${P.platne.priceId} / ${P.platne.spolu}`);
      j.over((await kluc(t)) === null, "po „Nie“ ostal kľúč prenosu v sessionStorage");
      return { info: `karta po farbe hneď pod kartou boxov, bez čísla; hlavička -> karta; bez veľkosti „už od“ ${ciel.solo[L].cena} € (${L}), Box ${L} samostatne ${samo} €, ušetríte ${us} €; Nie -> karta boxov; M + košík: POST = baseline 616`, post: post.body, spolu: cena.spolu };
    },
  },

  "box-komplet-od": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, J = profil("jedno", "diamond");
      await j.otvor(s, a.url, { novy: true });
      const ciel = await boxyCiela(t, cesta(J.url));
      const L = najlacnejsia(ciel.solo);
      const idF = await t.idParametra("farba");
      const farby = (await farbyBoxu(t, idF)).map((f) => ({ ...f, ciel: ciel.farby.find((c) => normFarby(c.text) === normFarby(f.text)) || null }));
      const fv = farby.find((f) => f.ciel);
      j.over(fv && L, "farba v sete / Box solo na 598 sa nedali zistiť (test): " + JSON.stringify({ farby: farby.map((f) => f.text), solo: ciel.solo }));
      await ovl.boxy.vyberFarbu(t, { index: fv.index });
      await ovl.boxy.vyberPocet(t, 1);
      await cakajKartu(t, "karta ponuky po farbe a počte");
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty ponuky" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky (bez veľkosti)");
      j.over(otv.bs && otv.bs.h === "Box do kufra už od" && otv.cenaTx === eur(ciel.solo[L].cena), `banner bez veľkosti: „${otv.bs && otv.bs.h} ${otv.cenaTx}“ ≠ „Box do kufra už od ${eur(ciel.solo[L].cena)}“`);
      await t.klikni(`${KARTA} .lcd1v-komplet__ano`, { popis: "Áno, chcem set s autokobercami" });
      s.produkt = J;
      try {
        // počet a farba prenesené, veľkosť nie -> krok Boxy s otvoreným oknom na výber veľkosti (prenos.js otvorPoPrenose)
        const pr = await poPrichode(s, j, { J, z: P.id, krok: "boxy" });
        j.over(JSON.stringify(pr.otvorene) === '["boxy"]', `otvorené karty na ${J.id}: ${pr.otvorene.join(", ")} (má byť krok Boxy s oknom)`);
        j.over(JSON.stringify(pr.kluc.vyber) === JSON.stringify({ pocetBoxov: 1, farbaBoxov: fv.ciel.hodnota }), `výber v kľúči ${JSON.stringify(pr.kluc.vyber)} ≠ počet 1 + farba ${fv.ciel.hodnota} (bez veľkosti)`);
        const ids = {};
        for (const k of ["farbaBoxov", "boxSolo"]) ids[k] = await t.idParametra(k);
        const st = await t.ev(`(function (ids) {
          var f = document.getElementById("product-detail-form"), b = f.querySelector(".upsale-Banner");
          function v(k) { var s = f.querySelector('select[data-parameter-id="' + ids[k] + '"]'); return s ? s.value : null; }
          var o = f.querySelector(".upsale-Banner.lcd1v-kb .box-config"), c = o && getComputedStyle(o);
          return { farbaBoxov: v("farbaBoxov"), boxSolo: v("boxSolo"), okno: b.classList.contains("showConf"), oknoVidno: !!(c && c.visibility === "visible" && c.opacity === "1"),
            karta: (f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active") || { getAttribute: function () { return ""; } }).getAttribute("value") };
        })(${JSON.stringify(ids)})`);
        j.over(st.okno && st.oknoVidno && st.karta === "conf1" && st.farbaBoxov === fv.ciel.hodnota && (!st.boxSolo || st.boxSolo === "0"), `na ${J.id} má byť otvorené okno boxov s farbou a bez veľkosti: ${JSON.stringify(st)}`);
        if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-komplet-od-ciel-${J.id}-${t.sirka}.png`)).catch(() => {});
        // zákazník zvolí veľkosť (najlacnejšiu) v okne a potvrdí
        const iV = await t.ev(`Array.prototype.findIndex.call(document.querySelectorAll("${OKNO} .parameter-wrap.parameter-${ids.boxSolo} .option-button"), function (b) { return b.getAttribute("data-value") === ${JSON.stringify(ciel.solo[L].hodnota)}; })`);
        j.over(iV > -1, `veľkosť ${L} (${ciel.solo[L].hodnota}) nie je v okne boxov ${J.id}`);
        await t.klikni(`${OKNO} .parameter-wrap.parameter-${ids.boxSolo} .option-button`, { index: iV, popis: "veľkosť boxu v okne" });
        await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${ids.boxSolo}"]') || {}).value === ${JSON.stringify(ciel.solo[L].hodnota)}`, { ms: 10000, popis: "veľkosť boxu vo formulári" });
        await t.klikni(`${OKNO} .lcd1v-bx__ok`, { popis: "Potvrďte výber boxov" });
        await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { ms: 8000, popis: "okno boxov zavreté po potvrdení" });
        await t.cakaj(`!!document.querySelector("${F} .lcd1v-k-auto.active")`, { ms: 8000, popis: "otvorené Auto po potvrdení boxov" });
        await nastavFormKluce(s);
        const z = await j.zaklad(s, ovl);
        await ovl.cena.pridajDoKosika(t);
        const post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { ...z.ocak, farbaBoxov: fv.ciel.hodnota, boxSolo: ciel.solo[L].hodnota });
        const c = await j.overCenu(s, ovl, cena);
        return { info: `Áno bez veľkosti -> ${J.id}: 1 box + farba „${fv.text}“ prenesené, okno boxov otvorené na veľkosť; ${L} + potvrdenie -> POST platný, ${c.videne} €`, post: post.body };
      } finally {
        s.produkt = P;
      }
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
      // 1 × M -> karta s cenou boxu solo; 2 boxy bez veľkostí -> „už od“; M + L -> čísla sa prepočítajú
      await boxVyber(t, ovl, { farba: fv.index, pocet: 1, velkosti: ["M"] });
      const st1 = await cakajKartu(t, "karta ponuky (1 × M)");
      j.over(st1.cenaTx === eur(ciel.solo.M.cena), `1 × M: v sete „${st1.cenaTx}“ ≠ ${eur(ciel.solo.M.cena)}`);
      await ovl.boxy.vyberPocet(t, 2);
      // 2 boxy bez veľkostí (živý kód ich pri zmene počtu vyprázdni): „Boxy do kufra už od“ = najlacnejší 1. + 2. box na 598
      const odDva = Math.round((ciel.b1[najlacnejsia(ciel.b1)].cena + ciel.b2[najlacnejsia(ciel.b2)].cena) * 100) / 100;
      await t.cakaj(`((document.querySelector(${JSON.stringify(KARTA + " .lcd1v-bs__c")}) || {}).textContent || "").replace(/\s+/g, " ").trim() === ${JSON.stringify(eur(odDva))}`, { ms: 10000, popis: "2 boxy bez veľkostí: „už od“ " + eur(odDva) }).catch(() => null); // nesúlad vypíše kontrola nižšie (aj s textom karty)
      const st2 = await stavKarty(t);
      j.over(st2.vidno && st2.bs === null && st2.cenaTx === eur(odDva), `2 boxy bez veľkostí: karta viditeľná (zbalená) s „už od“ ${eur(odDva)}: ${JSON.stringify({ vidno: st2.vidno, c: st2.cenaTx, text: st2.text })}`);
      const v = await ovl.boxy.vyberVelkosti(t, ["M", "L"]);
      const vSete = Math.round((ciel.b1.M.cena + ciel.b2.L.cena) * 100) / 100;
      await t.cakaj(`((document.querySelector(${JSON.stringify(KARTA + " .lcd1v-bs__c")}) || {}).textContent || "").replace(/\\s+/g, " ").trim() === ${JSON.stringify(eur(vSete))}`, { ms: 10000, popis: "cena v karte prepočítaná na 2 boxy" });
      // úplný výber + „Pokračujte k súhrnu“ v karte boxov -> ponuka sa otvorí sama (presné čísla), karta boxov sa zbalí
      await t.klikni(`${F} .lcd1v-k-farba > .next-step-button`, { popis: "Pokračujte k súhrnu (2 boxy M + L)" });
      const otv = await cakajOtvorenu(t, "ponuka setu otvorená po „Pokračujte k súhrnu“ (2 boxy)");
      j.over(!(await t.ev(`document.querySelector("${F} .lcd1v-k-farba").classList.contains("active")`)), "po „Pokračujte k súhrnu“ ostala otvorená karta boxov (má sa zbaliť, otvorená ponuka setu)");
      j.over(s.posty.length === 0, "„Pokračujte k súhrnu“ poslal POST: " + (s.posty[0] && s.posty[0].body));
      const samo = await cenaStrankyBoxu(t);
      const us = await overOtvorenu(t, j, otv, {
        h: "Boxy do kufra M + L len za", kd: "keď ich kúpite spolu s autokobercami pod sedadlá", pip: "2 boxy do kufra",
        ben: "Farba aj veľkosti boxov Vám ostanú.",
        vSete, samostatne: samo, pozn: "Pokračujete len s boxmi do kufra.",
        pipSrc: /\/img\/1v\/boxprodukt-pocet-2\.jpg$/, kde: "karta 616 (2 × M + L)",
      });
      await snimka(s, a, "komplet-otazka-2boxy", KARTA);
      await snimkaPonukyBoxu(s, a, "ponuka-setu-2boxy");
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
      const nazov = cisty(otv.ben).replace(/^Farba „([^“]+)“.*$/, "$1");
      j.over(otv.ben === "Farba „" + nazov + "“ sa v sete neponúka, farbu boxu si vyberiete pri autokobercoch." && normFarby(nazov) === normFarby(bez.text),
        `veta o farbe mimo setu: „${otv.ben}“ (farba „${bez.text}“)`);
      j.over(otv.cenaTx === eur(ciel.solo.S.cena), `v sete „${otv.cenaTx}“ ≠ Box solo S ${eur(ciel.solo.S.cena)}`);
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

  "box-komplet-bezova": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const t = s.t, P = a.produkt, J = profil("jedno", "diamond");
      await j.otvor(s, a.url, { novy: true });
      const idF = await t.idParametra("farba");
      const farby = await farbyBoxu(t, idF);
      const seda = farby.find((f) => normFarby(f.text) === "sed");
      const bez = farby.find((f) => normFarby(f.text) === "bezov");
      if (!bez) return { preskoc: seda ? `admin 616 ešte „${seda.text}“ (${seda.hodnota}) — po prestavení na „Diamond Farba kože : Béžová“ (561) spustiť znova` : "616 nemá Béžovú: " + farby.map((f) => f.text).join(", ") };
      j.over(!seda, `616 ponúka aj Béžovú (${bez.hodnota}) aj Šedú (${seda && seda.hodnota}) — šedý box sa nemá ponúkať`);
      const ciel = await boxyCiela(t, cesta(J.url));
      const fc = ciel.farby.find((c) => normFarby(c.text) === "bezov");
      j.over(fc, `set ${J.id} nemá Béžovú vo „Farbe boxov“: ${ciel.farby.map((c) => c.text).join(", ")}`);
      await boxVyber(t, ovl, { farba: bez.index, pocet: 1, velkosti: ["S"] });
      await cakajKartu(t, "karta ponuky (Béžová)");
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty ponuky" });
      const otv = await cakajOtvorenu(t, "otvorená karta ponuky (Béžová)");
      j.over(otv.ben === "Farba aj veľkosť boxu Vám ostanú.", `veta pod bannerom pri Béžovej: „${otv.ben}“ (Béžová je v sete, nemá byť „sa v sete neponúka“)`);
      await snimka(s, a, "komplet-bezova", KARTA);
      await t.klikni(`${KARTA} .lcd1v-komplet__ano`, { popis: "Áno, chcem set s autokobercami" });
      s.produkt = J;
      try {
        const pr = await poPrichode(s, j, { J, z: P.id, krok: "auto" });
        const kv = pr.kluc.vyber;
        j.over(kv.pocetBoxov === 1 && kv.boxSolo === ciel.solo.S.hodnota && kv.farbaBoxov === fc.hodnota && !kv.box1 && !kv.box2,
          `výber v kľúči ${JSON.stringify(kv)} ≠ 1 box S ${ciel.solo.S.hodnota} + farba boxov „${fc.text}“ ${fc.hodnota}`);
        const ids = {};
        for (const k of ["farbaBoxov", "boxSolo"]) ids[k] = await t.idParametra(k);
        const st = await t.ev(`(function (ids) {
          var f = document.getElementById("product-detail-form");
          function v(k) { var s = f.querySelector('select[data-parameter-id="' + ids[k] + '"]'); return s ? s.value : null; }
          var kb = f.querySelector(".upsale-Banner.lcd1v-kb [data-lcd1v-farba]");
          return { farbaBoxov: v("farbaBoxov"), boxSolo: v("boxSolo"), kresba: kb ? kb.getAttribute("data-lcd1v-farba") : "" };
        })(${JSON.stringify(ids)})`);
        j.over(st.farbaBoxov === fc.hodnota && st.boxSolo === ciel.solo.S.hodnota && st.kresba === "bezova",
          `na ${J.id}: farba boxov ${st.farbaBoxov} (čakám ${fc.hodnota}), Box solo ${st.boxSolo} (čakám ${ciel.solo.S.hodnota}), kresba v okne boxov „${st.kresba}“ (čakám bezova)`);
        if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-komplet-bezova-ciel-${J.id}-${t.sirka}.png`)).catch(() => {});
        await j.pauza(500);
        j.over(s.posty.length === 0, "po prenose odišiel POST: " + (s.posty[0] && s.posty[0].body));
        return { info: `616 „${bez.text}“ (${bez.hodnota}), 1 box S: veta „${otv.ben}“; Áno -> ${J.id}: farba boxov „${fc.text}“ (${fc.hodnota}) + Box solo S prenesené, kresba béžová` };
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
      await t.klikni(`${F} .lcd1v-k-farba > .next-step-button`, { popis: "Pokračujte k súhrnu (3 boxy)" });
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

