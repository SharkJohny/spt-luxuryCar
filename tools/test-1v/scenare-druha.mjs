// Scenáre ponuky druhej vrstvy (jedno 598 / 610 / 613 -> dvoj 601 / 604 / 607) a prenosu výberu (Michal 14. 10. 2026).
// JADRO (vydanie): assets/js/components/konfigurator1v/druha-vrstva.js + prenos.js + assets/css/_lcd1v-druha.scss.
// Tvar a parametre scenára: tools/test-1v/scenare-jedno.mjs. Všetko s ?novy=1 (bez flagu sa scenár preskočí; časť
// „bez flagu“ si scenár druha-nie overí sám na začiatku). Každý POST košíka je zachytený a zrušený (jadro testu).
//
//   druha-nie       bez flagu žiadna karta ani kľúč; s flagom karta skrytá do výberu farby, potom viditeľná BEZ čísla
//                   (postup „Váš set v 6 krokoch“, kroky „N z 6“); „Pokračujte ďalej“ vo Farbe otvorí kartu (nie Rozloženie),
//                   príplatok „+ N €“ = živý rozdiel; Áno aj Nie sú skutočné tlačidlá (<button type=button>, fokus klávesnicou),
//                   zlaté „Áno, chcem druhú vrstvu“ v dlaždici (div) nad zeleným „Nie, ďakujem“ (Michal 15. 10. 2026);
//                   „Nie, ďakujem“ zbalí kartu („Bez druhej vrstvy“) a otvorí Rozloženie;
//                   POST = baseline jednovrstvového produktu (1v-baseline.json, scenár platne)
//   druha-ano       hlavička karty -> tlačidlo „Áno, chcem druhú vrstvu“ (myš): správa v karte, tlačidlá zablokované, prechod na dvojvrstvový produkt
//                   toho istého vzoru; tam vzor, auto, farba prenesené, otvorený krok „Farba 2. vrstvy“ bez predvoľby, žiadna
//                   veta navyše; príplatok z karty = živý rozdiel cien (dvoj − jedno, Shoptet); úplný výber -> POST = baseline
//                   dvojvrstvového produktu; tlačidlo Späť -> jednovrstvový produkt s autom a farbou, karta nezodpovedaná
//   druha-vsetko    rozloženie 3 rady (7 miest), rohož Classic a 2 boxy vybraté pred „Áno“ (390 px: ťuk na fotku dlaždice —
//                   dlaždica je klikateľná celá; 1280 px: Enter na tlačidle Áno — klávesnica) -> na dvojvrstvovom všetko
//                   rovnaké (miesta, rozloženie, kufor, farba a veľkosti boxov, okno boxov zatvorené), POST platný
//   prenos-neplatny (dvoj) kľúč starší ako 10 min / pre iný produkt / s farbou, ktorú produkt nemá -> nič sa neprenesie,
//                   bez chyby; pri chýbajúcej farbe sa otvorí krok Farba
import { join } from "node:path";
import { PRODUKTY } from "./produkty.mjs";
import { F } from "./stary-ui.mjs";
import { stary as staryKroky } from "./ovladac-kroky.mjs";

const KARTA = `${F} .lcd1v-druha`;
const KLUC = "lcd1vPrenos:v1";
const NBSP = " ";

/** POST starého vzhľadu (CDN, 14. 10. 2026, 1v-baseline.json scenár platne: farba index 2, 1. a 2. rad, Audi A6 2015 Combi). */
const BASELINE = {
  598: "productId=598&priceId=63493&language=sk&parameterValueId[78]=549&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  610: "productId=610&priceId=59803&language=sk&parameterValueId[78]=673&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  613: "productId=613&priceId=66872&language=sk&parameterValueId[78]=679&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  601: "productId=601&priceId=66989&language=sk&parameterValueId[78]=549&parameterValueId[71]=540&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  604: "productId=604&priceId=67856&language=sk&parameterValueId[78]=673&parameterValueId[71]=540&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
  607: "productId=607&priceId=68003&language=sk&parameterValueId[78]=679&parameterValueId[71]=540&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1",
};
/** jednovrstvový -> dvojvrstvový toho istého vzoru (nezávisle od kódu webu: podľa profilov testu) */
const cielDvoj = (P) => Number(Object.keys(PRODUKTY).find((id) => PRODUKTY[id].typ === "dvoj" && PRODUKTY[id].vzor === P.vzor));
const cesta = (id) => new URL(PRODUKTY[id].url).pathname;
const preskocBez = (a) => (a.novy ? null : { preskoc: "len nový vzhľad (?novy=1)" });

/** POST sa rovná baseline (rádio rozloženia parameter-<id> ide len po skutočnom kliku na rádio — voliteľné). */
function rovnakyAkoBaseline(j, post, id) {
  const ocak = Object.fromEntries(new URLSearchParams(BASELINE[id]));
  const je = post.pole;
  const volitelne = (k) => /^parameter-\d+$/.test(k);
  const rozdiel = [];
  Object.keys(ocak).forEach((k) => { if (volitelne(k) && !(k in je)) return; if (je[k] !== ocak[k]) rozdiel.push(k + ": " + je[k] + " ≠ " + ocak[k]); });
  Object.keys(je).forEach((k) => { if (!(k in ocak)) rozdiel.push(k + " navyše (" + je[k] + ")"); });
  j.over(!rozdiel.length, `POST ${id} sa nerovná baseline starého vzhľadu (1v-baseline.json platne): ${rozdiel.join("; ")}`);
}

/** Stav karty ponuky, ako ju vidí zákazník. */
function stavKarty(t) {
  return t.ev(`(function () {
    var k = document.querySelector(${JSON.stringify(KARTA)});
    if (!k) return { je: false };
    function tx(q) { var e = k.querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
    function vid(e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return !e.hidden && r.width > 0 && r.height > 0 && c.display !== "none" && c.visibility !== "hidden"; }
    var dl = k.querySelector(".lcd1v-druha__dlazdica"), ano = k.querySelector(".lcd1v-druha__ano"), nie = k.querySelector(".lcd1v-druha__nie"), img = dl && dl.querySelector("img");
    var suma = k.querySelector(".lcd1v-druha__suma");
    function tl(b) { return b ? { tag: b.tagName, typ: b.type, text: b.textContent.replace(/\\s+/g, " ").trim(), tab: b.tabIndex, pozadie: getComputedStyle(b).backgroundImage } : null; }
    return {
      je: true, vidno: vid(k), otvorena: k.classList.contains("active"), hotova: k.classList.contains("lcd1v-hotovy"),
      ey: tx(".lcd1v-hd .lcd1v-ey"), nm: tx(".lcd1v-hd .lcd1v-nm"), ti: tx(".lcd1v-hd .lcd1v-ti"), vy: tx(".lcd1v-hd .lcd1v-vy"),
      cislo: tx(".lcd1v-hd .lcd1v-no"), cisloVidno: vid(k.querySelector(".lcd1v-hd .lcd1v-no")),
      pod: tx(":scope > .lcd1v-pod"), anoText: dl ? dl.textContent.replace(/\\s+/g, " ").trim() : null, anoVidno: vid(ano),
      anoTl: tl(ano), nieTl: tl(nie), dlTag: dl ? dl.tagName : null, dlTlacidiel: dl ? dl.querySelectorAll("button").length : 0,
      anoVDlazdici: !!(dl && ano && dl.contains(ano)), anoNadNie: !!(ano && nie && ano.getBoundingClientRect().bottom <= nie.getBoundingClientRect().top),
      nieText: nie ? nie.textContent.trim() : null, nieVidno: vid(nie), pozn: tx(":scope > .lcd1v-pozn"),
      priplatok: suma && vid(suma) ? suma.textContent : null, priplatokCislo: ano ? Number(ano.getAttribute("data-lcd1v-priplatok")) || null : null,
      foto: img ? { src: img.currentSrc || img.src, ok: img.complete && img.naturalWidth > 100, alt: img.alt } : null,
      anoZablok: !!(ano && ano.disabled), nieZablok: !!(nie && nie.disabled),
      prenos: vid(k.querySelector(".lcd1v-druha__prenos")) ? tx(".lcd1v-druha__prenos") : null,
      maName: !!k.querySelector("[name]"),
      zaFarbou: !!(k.previousElementSibling && k.previousElementSibling.classList.contains("lcd1v-k-farba")),
    };
  })()`);
}

/** Text viditeľných kariet (eyebrow) a postupu — počty krokov sa ponukou nemenia. */
function cislaKrokov(t) {
  return t.ev(`(function () {
    function tx(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; }
    return { postup: tx(document.querySelector(".lcd1v-postup-t")), st: tx(document.querySelector(".lcd1v-postup-st")),
      ey: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-krok:not(.lcd1v-druha) > .lcd1v-hd .lcd1v-ey"), tx),
      dlazdice: document.querySelectorAll(".lcd1v-postup-dl > i").length };
  })()`);
}

/** Snímka pre ľudskú kontrolu (len s --snimky): prvok `sel` zarovnaný nahor pod hlavičku webu. */
async function snimka(s, a, meno, sel) {
  if (!a.snimky) return;
  await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`);
  await s.t.pauza(500);
  await s.k.snimka(join(a.snimky, `${a.produkt.id}-${meno}-${s.t.sirka}.png`)).catch(() => {});
}

const ctxCena = (t) => t.ev(`window.__lcd1v ? window.__lcd1v.cena().spolu : null`);
const kluc = (t) => t.ev(`(function () { try { return JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC)}) || "null"); } catch (e) { return "chyba"; } })()`);

/** Polia formulára pre overPost na inej stránke tej istej karty (rovnaké ako j.otvor; dvoj nemá nepovinné selecty). */
async function nastavFormKluce(s) {
  s.formKluce = await s.t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    var k = ["productId", "priceId", "language", "amount"], volitelne = [];
    Array.prototype.forEach.call(f.querySelectorAll("select[name]"), function (s) { k.push(s.name); });
    Array.prototype.forEach.call(f.querySelectorAll(".content-wrap input[type=radio][name^='parameter-']"), function (r) { if (volitelne.indexOf(r.name) < 0) volitelne.push(r.name); });
    return { povinne: k.sort(), volitelne: volitelne, priceIdZaklad: (f.querySelector("input[name=priceId]") || {}).value || "" };
  })()`);
}

/** Auto + farba (index 2 = farba baseline) -> { model, farba }; karta je pred farbou skrytá. */
async function autoAFarba(s, ovl, j) {
  const t = s.t;
  const pred = await stavKarty(t);
  j.over(pred.je && !pred.vidno, `karta druhej vrstvy má byť pred výberom farby skrytá: ${JSON.stringify(pred)}`);
  const model = await ovl.kroky.vyberAuto(t, j.AUTO);
  const poAute = await stavKarty(t);
  j.over(!poAute.vidno, "karta druhej vrstvy je viditeľná po výbere auta, ešte pred farbou");
  const farba = await ovl.kroky.vyberFarbu(t, { index: 2 });
  await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); return !!(k && !k.hidden && k.offsetHeight > 30); })()`, { ms: 10000, popis: "karta druhej vrstvy po výbere farby" });
  return { model, farba };
}

/** Čaká na príplatok „+ N €“ v karte -> N (číslo). */
async function cakajPriplatok(t, j) {
  await t.cakaj(`(function () { var a = document.querySelector("${KARTA} .lcd1v-druha__ano"); var s = document.querySelector("${KARTA} .lcd1v-druha__suma");
    return !!(a && a.getAttribute("data-lcd1v-priplatok") && s && s.getBoundingClientRect().height > 0); })()`, { ms: 30000, popis: "príplatok „+ N €“ na dlaždici Áno (stránka dvojvrstvového produktu)" });
  const st = await stavKarty(t);
  const n = st.priplatokCislo;
  j.over(n > 0 && st.priplatok === "+" + NBSP + String(n).replace(".", ",") + NBSP + "€", `príplatok v karte „${st.priplatok}“ (atribút ${n}) — tvar „+ N €“`);
  return n;
}

/** Na dvojvrstvovom po prenose: prijatý kľúč, otvorený krok Farba 2. vrstvy, nič predvolené. */
async function poPrenose(s, j, { P, cielId, farba }) {
  const t = s.t;
  await t.cakaj(`location.pathname === ${JSON.stringify(cesta(cielId))}`, { ms: 40000, popis: "prechod na dvojvrstvový produkt " + cielId });
  t.zabudni();
  await t.cakaj(j.TYPY_TEST.dvoj.pripravene, { ms: 40000, popis: "postavený konfigurátor " + cielId });
  await t.cakaj(`document.body.classList.contains("lcd-1v") && document.body.getAttribute("data-lcd1v-typ") === "dvoj" && !!window.__lcd1v`, { ms: 30000, popis: "nový vzhľad na " + cielId });
  const idF2 = await t.idParametra("farba2");
  await t.cakaj(`(function () { var k = document.querySelector("${F} .content-wrap > .parameter-wrap.parameter-${idF2}"); return !!(k && k.classList.contains("active") && k.classList.contains("lcd1v-k-farba2")); })()`, { ms: 20000, popis: "otvorený krok „Farba 2. vrstvy“ po prenose" });
  // krok má byť po ustálení stránky na obrazovke (prenos.js dorovnáva do 2 s; z CDN sa karta farby zbalí neskôr)
  await t.cakaj(`(function () { var k = document.querySelector(".lcd1v-k-farba2"); var r = k && k.getBoundingClientRect(); return !!r && r.top >= -2 && r.top < innerHeight - 80; })()`, { ms: 3500, popis: "otvorený krok „Farba 2. vrstvy“ na obrazovke" }).catch(() => {});
  await j.pauza(2300); // po poslednom dorovnaní (2 s) sa už nesmie pohnúť
  const idF = await t.idParametra("farba");
  const st = await t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    function tx(q) { var e = f.querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; }
    var f2 = f.querySelector(".lcd1v-k-farba2"), r = f2.getBoundingClientRect();
    return {
      vzor: document.body.getAttribute("data-lcd1v-vzor"), model: sessionStorage.getItem("model"), autoVy: tx(".lcd1v-k-auto > .lcd1v-hd .lcd1v-vy"),
      farbaTl: (f.querySelector('.content-wrap .option-button.active[data-variant="${idF}"]') || { getAttribute: function () { return ""; } }).getAttribute("data-value"),
      farbaSel: (f.querySelector('select[data-parameter-id="${idF}"]') || {}).value || "",
      f2Aktivne: f2.querySelectorAll(".option-button.active").length, f2Sel: (f.querySelector('select[data-parameter-id="${idF2}"]') || {}).value || "",
      otvorene: Array.prototype.map.call(f.querySelectorAll(".lcd1v-krok.active"), function (e) { return e.className.replace(/.*lcd1v-k-(\\w+).*/, "$1"); }),
      vOkne: r.top >= -2 && r.top < innerHeight - 80,
      veta: /preniesli|prenesen/i.test(f.innerText || ""), karta: !!f.querySelector(".lcd1v-druha"),
      chyby: window.__lcd1v.chyby.slice(), ey: tx(".lcd1v-k-farba2 > .lcd1v-hd .lcd1v-ey"),
      kluc: (function () { try { return JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC)}) || "null"); } catch (e) { return null; } })(),
    };
  })()`);
  j.over(st.vzor === P.vzor, `vzor na ${cielId}: ${st.vzor}, má ${P.vzor}`);
  j.over(st.model === [j.AUTO.znacka, j.AUTO.model, j.AUTO.rok, j.AUTO.typ].join(" ") && st.autoVy === "Audi A6, 2015, Combi", `auto sa nepreniesla: model „${st.model}“, krok 2 „${st.autoVy}“`);
  j.over(st.farbaTl === farba && st.farbaSel === farba, `farba 1. vrstvy na ${cielId}: tlačidlo ${st.farbaTl}, select ${st.farbaSel}, má ${farba}`);
  j.over(st.f2Aktivne === 0 && st.f2Sel === "", `farba 2. vrstvy je predvolená (aktívnych ${st.f2Aktivne}, select „${st.f2Sel}“) — nič sa nemá predvoliť`);
  j.over(st.otvorene.length === 1 && st.otvorene[0] === "farba2", `otvorené karty na ${cielId}: ${st.otvorene.join(", ")} (má byť len farba2)`);
  j.over(/^Krok 4 z 7$/.test(st.ey), `krok Farba 2. vrstvy: „${st.ey}“`);
  j.over(st.vOkne, "otvorený krok „Farba 2. vrstvy“ nie je na obrazovke");
  j.over(!st.veta, "na dvojvrstvovom je veta o prenose — Michal: len otvorený krok, žiadna veta navyše");
  j.over(!st.karta, "karta ponuky druhej vrstvy je aj na dvojvrstvovom produkte");
  j.over(!st.chyby.length, `chyby 1V na ${cielId}: ${st.chyby.join("; ")}`);
  j.over(st.kluc && st.kluc.na === cielId && st.kluc.prijate > 0, `kľúč prenosu po príchode: ${JSON.stringify(st.kluc)}`);
  return st;
}

export const SCENARE = {
  "druha-nie": {
    typy: ["jedno"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      // 1) bez flagu: starý vzhľad, žiadna karta ani kľúč (aj po výbere auta a farby)
      await j.otvor(s, a.url, { novy: false });
      await staryKroky.vyberAuto(t, j.AUTO);
      await staryKroky.vyberFarbu(t, { index: 2 });
      await j.pauza(800);
      const bez = await t.ev(`({ trieda: document.body.classList.contains("lcd-1v"), karta: !!document.querySelector(".lcd1v-druha"), ctx: !!window.__lcd1v, kluc: sessionStorage.getItem(${JSON.stringify(KLUC)}) })`);
      j.over(!bez.trieda && !bez.karta && !bez.ctx && bez.kluc === null, `bez flagu sa niečo zmenilo: ${JSON.stringify(bez)}`);
      // 2) s flagom
      await j.otvor(s, a.url, { novy: true });
      const pred = await cislaKrokov(t);
      const { farba } = await autoAFarba(s, ovl, j);
      const st = await stavKarty(t);
      j.over(st.zaFarbou && !st.otvorena && !st.maName, `karta: za krokom Farba ${st.zaFarbou}, otvorená ${st.otvorena}, prvok s name ${st.maName}`);
      j.over(!st.cisloVidno && !st.cislo, `karta má číslo kroku „${st.cislo}“ (Michal: skrytý krok bez čísla)`);
      j.over(st.nm === "Druhá vrstva" && st.vy === "Áno alebo nie", `zbalená karta: „${st.nm}“ / „${st.vy}“`);
      const po = await cislaKrokov(t);
      j.over(/6 krokoch/.test(po.postup) && po.dlazdice === 6 && /z 6$/.test(po.st) && JSON.stringify(po.ey) === JSON.stringify(pred.ey), `počty krokov sa zmenili: pred ${JSON.stringify(pred)}, po ${JSON.stringify(po)}`);
      j.over(po.ey.every((x) => /^Krok \d z 6$/.test(x)), `kroky: ${po.ey.join(" | ")}`);
      // 3) „Pokračujte ďalej“ vo Farbe otvorí kartu (nie Rozloženie)
      const idR = await t.idParametra("rozlozenie");
      await t.klikni(`${F} .lcd1v-k-farba > .next-step-button`, { popis: "Pokračujte ďalej (Farba)" });
      await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}); return !!(k && k.classList.contains("active") && k.getBoundingClientRect().height > 200); })()`, { popis: "otvorená karta druhej vrstvy po „Pokračujte ďalej“" });
      await j.pauza(500);
      const otv = await stavKarty(t);
      const rozlOtv = await t.ev(`document.querySelector("${F} .content-wrap > .parameter-wrap.parameter-${idR}").classList.contains("active")`);
      j.over(!rozlOtv, "po „Pokračujte ďalej“ vo Farbe sa otvorilo Rozloženie, má sa otvoriť karta druhej vrstvy");
      j.over(otv.ey === "Druhá vrstva" && otv.ti === "Prosíte si aj druhú odnímateľnú vrstvu?", `otvorená karta: „${otv.ey}“ / „${otv.ti}“`);
      // Michal 15. 10. 2026: vrstvy vždy pomenované („prvá prešívaná“ / „druhá“); podnadpis ľudsky, nie „strojovo“
      j.over(otv.pod === "Či prídete z dažďa, zo snehu, s deťmi z ihriska alebo so psom z prechádzky — vodu, blato aj zimnú soľ z topánok zachytí druhá vrstva skôr, než sa dostanú k prvej prešívanej vrstve. Keď sa zašpiní, jednoducho ju vyberiete, vytrasiete alebo umyjete aj vapkou a vrátite späť. Prvá prešívaná vrstva ostane čistá a interiér pôsobí stále upravene.", `podnadpis „${otv.pod}“`);
      j.over(/Dvojvrstvové koberce/.test(otv.anoText) && /Prvá prešívaná \+ druhá vrstva/.test(otv.anoText) && /Vzor, auto aj farba Vám ostanú\./.test(otv.anoText) && /Odporúčame/.test(otv.anoText), `dlaždica Áno: „${otv.anoText}“`);
      j.over(otv.nieText === "Nie, ďakujem" && otv.nieVidno && otv.pozn === "Pokračujete s doterajším výberom.", `Nie: „${otv.nieText}“ / „${otv.pozn}“`);
      // Michal 15. 10. 2026 („ani neviem, že na to môžem kliknúť“): skutočné tlačidlá Áno (zlaté, v dlaždici, hore) a Nie (zelené)
      j.over(otv.anoVidno && otv.anoTl && otv.anoTl.tag === "BUTTON" && otv.anoTl.typ === "button" && otv.anoTl.text === "Áno, chcem druhú vrstvu" && otv.anoTl.tab >= 0 && otv.anoVDlazdici,
        `tlačidlo Áno: ${JSON.stringify(otv.anoTl)}, viditeľné ${otv.anoVidno}, v dlaždici ${otv.anoVDlazdici}`);
      j.over(otv.nieTl && otv.nieTl.tag === "BUTTON" && otv.nieTl.typ === "button" && otv.nieTl.tab >= 0, `tlačidlo Nie: ${JSON.stringify(otv.nieTl)}`);
      j.over(otv.dlTag === "DIV" && otv.dlTlacidiel === 1, `dlaždica má byť div s jedným tlačidlom (žiadne tlačidlo v tlačidle): ${otv.dlTag}, tlačidiel ${otv.dlTlacidiel}`);
      j.over(otv.anoNadNie, "tlačidlo Áno má byť nad tlačidlom Nie");
      j.over(/196, 155, 49|177, 136, 34|226, 190, 92/.test(otv.anoTl.pozadie) && /47, 156, 104|29, 107, 74/.test(otv.nieTl.pozadie), `farby: Áno zlaté (${otv.anoTl.pozadie}), Nie zelené (${otv.nieTl.pozadie})`);
      // klávesnica: obe tlačidlá dostanú fokus (Enter na Áno overí druha-vsetko pri 1280 px)
      const fokus = await t.ev(`(function () { var k = document.querySelector(${JSON.stringify(KARTA)}), r = {};
        ["ano", "nie"].forEach(function (m) { var b = k.querySelector(".lcd1v-druha__" + m); b.focus({ preventScroll: true }); r[m] = document.activeElement === b; b.blur(); });
        return r; })()`);
      j.over(fokus.ano && fokus.nie, `fokus klávesnicou: Áno ${fokus.ano}, Nie ${fokus.nie}`);
      // jedna fotka pre všetky vzory (Michal 15. 10. 2026): Diamond so šedou jednofarebnou druhou vrstvou
      j.over(otv.foto && otv.foto.ok && otv.foto.src.endsWith("/img/1v/druha-vrstva-lux.jpg"), `fotka dlaždice Áno: ${JSON.stringify(otv.foto)} (má druha-vrstva-lux.jpg pri každom vzore)`);
      j.over(otv.foto && /šedou jednofarebnou druhou vrstvou/.test(otv.foto.alt || ""), `alt fotky dlaždice Áno: „${otv.foto && otv.foto.alt}“`);
      const zakazane = /na milimeter|vyr[áa]bame|zadarmo|comfort|dragon|elite|basic|z[áa]ruk|vrstiev|fixa[čc]n/i;
      j.over(!zakazane.test(otv.anoText + " " + otv.pod + " " + otv.nieText + " " + otv.pozn + " " + otv.ti), "zakázané slovo v texte karty");
      j.over(!/prešívan\S*\s+vrstv/i.test((otv.anoText + " " + otv.pod).replace(/prv\S*\s+prešívan\S*/gi, "")), "„prešívaná vrstva“ bez „prvá“ v texte karty");
      await snimka(s, a, "druha-otazka", KARTA);
      // 4) príplatok = živý rozdiel (cena dvojvrstvového pri tých istých voľbách − táto); overí scenár druha-ano na dvoj stránke
      const n = await cakajPriplatok(t, j);
      // 5) Nie -> karta zbalená ako hotová, otvorí sa Rozloženie; POST = baseline
      await t.klikni(`${KARTA} .lcd1v-druha__nie`, { popis: "Nie, ďakujem" });
      await t.cakaj(`document.querySelector("${F} .content-wrap > .parameter-wrap.parameter-${idR}").classList.contains("active")`, { ms: 8000, popis: "otvorené Rozloženie po „Nie, ďakujem“" });
      const poNie = await stavKarty(t);
      await snimka(s, a, "druha-po-nie", KARTA);
      j.over(!poNie.otvorena && poNie.hotova && poNie.vy === "Bez druhej vrstvy" && poNie.cisloVidno, `karta po Nie: ${JSON.stringify({ o: poNie.otvorena, h: poNie.hotova, vy: poNie.vy, fajka: poNie.cisloVidno })}`);
      const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba, rozlozenie });
      await j.overCenu(s, ovl, cena);
      rovnakyAkoBaseline(j, post, P.id);
      j.over(cena.spolu === P.platne.spolu, `suma ${cena.spolu} ≠ ${P.platne.spolu}`);
      j.over((await kluc(t)) === null, "po „Nie“ ostal kľúč prenosu v sessionStorage");
      return { info: `bez flagu nič; karta bez čísla až po farbe (6 krokov), Pokračujte -> karta, príplatok + ${n} €, Nie -> Rozloženie; POST = baseline ${P.id}`, post: post.body, spolu: cena.spolu };
    },
  },

  "druha-ano": {
    typy: ["jedno"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t, cielId = cielDvoj(P), Pc = { id: cielId, ...PRODUKTY[cielId] };
      j.over(cielId, "dvojvrstvový produkt vzoru " + P.vzor + " nie je v profiloch");
      await j.otvor(s, a.url, { novy: true });
      const { farba } = await autoAFarba(s, ovl, j);
      // kartu otvorí aj hlavička (bez „Pokračujte ďalej“)
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty druhej vrstvy" });
      await t.cakaj(`document.querySelector(${JSON.stringify(KARTA)}).classList.contains("active")`, { popis: "otvorená karta" });
      const n = await cakajPriplatok(t, j);
      const cenaJedno = await ctxCena(t);
      // Áno: správa v karte, tlačidlá zablokované (stránka sa vymení o ~0,5 s)
      await t.klikni(`${KARTA} .lcd1v-druha__ano`, { popis: "tlačidlo Áno, chcem druhú vrstvu" });
      const hned = await stavKarty(t).catch(() => null);
      if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-druha-prenos-${t.sirka}.png`)).catch(() => {});
      if (hned && hned.je) {
        j.over(hned.prenos && hned.prenos.startsWith("Prenášame Váš výber na dvojvrstvové koberce…"), `správa po Áno: „${hned.prenos}“`);
        j.over(hned.anoZablok && hned.nieZablok, "po Áno nie sú tlačidlá zablokované");
      }
      s.produkt = Pc;
      try {
        await poPrenose(s, j, { P, cielId, farba });
        if (a.snimky) await s.k.snimka(join(a.snimky, `${P.id}-druha-prichod-${cielId}-${t.sirka}.png`)).catch(() => {});
        await nastavFormKluce(s);
        // príplatok = živý rozdiel: cena dvojvrstvového pri tých istých voľbách (farba 2. vrstvy cenu nemení) − jednovrstvového
        const farba2 = await ovl.farba2.vyberFarbu2(t, { index: 0 });
        const cenaDvoj = await ctxCena(t);
        j.over(Math.round((cenaDvoj - cenaJedno) * 100) / 100 === n, `príplatok v karte + ${n} € ≠ živý rozdiel ${cenaDvoj} − ${cenaJedno} = ${cenaDvoj - cenaJedno} €`);
        const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
        await ovl.cena.pridajDoKosika(t);
        const post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { farba, farba2, rozlozenie });
        await j.overCenu(s, ovl, cena);
        rovnakyAkoBaseline(j, post, cielId);
        j.over(cena.spolu === Pc.platne.spolu && post.pole.priceId === Pc.platne.priceId, `dvoj: suma ${cena.spolu} / priceId ${post.pole.priceId}, profil ${Pc.platne.spolu} / ${Pc.platne.priceId}`);
        // Späť: jednovrstvový s autom a farbou, karta nezodpovedaná, tlačidlá odblokované, kľúč zmazaný
        await t.ev(`history.back()`);
        await t.cakaj(`location.pathname === ${JSON.stringify(new URL(P.url).pathname)}`, { ms: 40000, popis: "Späť na " + P.id });
        t.zabudni();
        s.produkt = P;
        await t.cakaj(j.TYPY_TEST.jedno.pripravene, { ms: 40000, popis: "postavený konfigurátor " + P.id + " po Späť" });
        await t.cakaj(`document.body.classList.contains("lcd-1v") && !!document.querySelector(${JSON.stringify(KARTA)})`, { ms: 30000, popis: "nový vzhľad po Späť" });
        const idF = await t.idParametra("farba");
        await t.cakaj(`!!document.querySelector('${F} .content-wrap .option-button.active[data-variant="${idF}"][data-value="${farba}"]')`, { ms: 20000, popis: "farba " + farba + " vrátená po Späť" });
        await j.pauza(600);
        const spat = await stavKarty(t);
        const nav = await t.ev(`(performance.getEntriesByType("navigation")[0] || {}).type`);
        const auto = await t.ev(`({ model: sessionStorage.getItem("model"), vy: ((document.querySelector("${F} .lcd1v-k-auto > .lcd1v-hd .lcd1v-vy") || {}).textContent || "").trim(), chyby: window.__lcd1v.chyby.slice() })`);
        j.over(nav === "back_forward", "návrat nebol back_forward: " + nav);
        j.over(auto.model === "Audi A6 2015 Combi" && auto.vy === "Audi A6, 2015, Combi", `auto po Späť: ${JSON.stringify(auto)}`);
        j.over(spat.vidno && !spat.hotova && spat.vy === "Áno alebo nie" && !spat.anoZablok && !spat.nieZablok && !spat.prenos, `karta po Späť má byť nezodpovedaná a odblokovaná: ${JSON.stringify(spat)}`);
        j.over(!auto.chyby.length, "chyby 1V po Späť: " + auto.chyby.join("; "));
        j.over((await kluc(t)) === null, "kľúč prenosu po Späť nezmazaný");
        return { info: `${P.id} -> ${cielId}: vzor, auto, farba ${farba} prenesené, otvorený krok 4 bez predvoľby; príplatok + ${n} € = ${cenaDvoj} − ${cenaJedno}; POST = baseline ${cielId} (${cena.spolu} €); Späť vráti auto aj farbu`, post: post.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "druha-vsetko": {
    typy: ["jedno"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t, cielId = cielDvoj(P), Pc = { id: cielId, ...PRODUKTY[cielId] };
      await j.otvor(s, a.url, { novy: true });
      const { farba } = await autoAFarba(s, ovl, j);
      const rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 2 }); // všetky 3 rady -> 7 miest v kroku 2
      const kufor = await ovl.kuforBoxy.vyberKufor(t, "classic");
      const b = await ovl.kuforBoxy.vyberBoxy(t, { pocet: 2, farba: 0, velkost: "M", velkost2: "S" });
      j.over(b.farbaBoxov && b.box1 && b.box2, "boxy sa nevybrali: " + JSON.stringify(b));
      const miesta = await t.ev(`(document.querySelector("${F} .sit-Position .option-button.active") || { getAttribute: function () { return ""; } }).getAttribute("data-value")`);
      j.over(miesta === "pass-7", "po všetkých troch radoch nie je 7 miest: " + miesta);
      await t.klikni(`${KARTA} > .lcd1v-hd`, { popis: "hlavička karty druhej vrstvy" });
      await t.cakaj(`document.querySelector(${JSON.stringify(KARTA)}).classList.contains("active")`, { popis: "otvorená karta" });
      if (t.mobil) {
        // telefón: ťuk na fotku dlaždice (klikateľná je celá dlaždica, nielen tlačidlo)
        await t.klikni(`${KARTA} .lcd1v-druha__dlazdica .lcd1v-kb__fot img`, { popis: "fotka dlaždice druhej vrstvy" });
      } else {
        // PC: klávesnica — fokus na tlačidlo Áno a Enter
        const f = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(KARTA + " .lcd1v-druha__ano")}); b.scrollIntoView({ block: "center", behavior: "instant" }); b.focus(); return document.activeElement === b; })()`);
        j.over(f, "tlačidlo Áno nedostalo fokus");
        const kl = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
        await s.k.posli("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", unmodifiedText: "\r", ...kl });
        await s.k.posli("Input.dispatchKeyEvent", { type: "keyUp", ...kl });
      }
      s.produkt = Pc;
      try {
        await poPrenose(s, j, { P, cielId, farba });
        await nastavFormKluce(s);
        const ids = {};
        for (const k of ["rozlozenie", "kufor", "farbaBoxov", "box1", "box2"]) ids[k] = await t.idParametra(k);
        const st = await t.ev(`(function (ids) {
          var f = document.getElementById("product-detail-form");
          function v(k) { var s = f.querySelector('select[data-parameter-id="' + ids[k] + '"]'); return s ? s.value : null; }
          var rozl = f.querySelector('.content-wrap .option-button.active[data-variant="' + ids.rozlozenie + '"]');
          return { rozlozenie: v("rozlozenie"), rozlTl: rozl ? rozl.getAttribute("data-value") : "", kufor: v("kufor"), farbaBoxov: v("farbaBoxov"), box1: v("box1"), box2: v("box2"),
            kuforKarta: !!f.querySelector(".upsale-buttons.trunk > .parameter-cars > .upsale-button.active"), boxKarta: (f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active") || { getAttribute: function () { return ""; } }).getAttribute("value"),
            okno: f.querySelector(".upsale-Banner").classList.contains("showConf"), miesta: (f.querySelector(".sit-Position .option-button.active") || { getAttribute: function () { return ""; } }).getAttribute("data-value"),
            kuforPress: (f.querySelector('.upsale-buttons.trunk .lcd1v-kb__karta[aria-pressed="true"]') || { getAttribute: function () { return ""; } }).getAttribute("data-kufor") };
        })(${JSON.stringify(ids)})`);
        j.over(st.miesta === "pass-7", "miesta na dvojvrstvovom: " + st.miesta);
        j.over(st.rozlozenie === rozlozenie && st.rozlTl === rozlozenie, `rozloženie na ${cielId}: select ${st.rozlozenie}, tlačidlo ${st.rozlTl}, má ${rozlozenie}`);
        j.over(st.kufor === kufor && st.kuforKarta && st.kuforPress === "classic", `kufor na ${cielId}: ${st.kufor} (karta ${st.kuforKarta}, nový vzhľad ${st.kuforPress}), má ${kufor}`);
        j.over(st.boxKarta === "conf2" && st.farbaBoxov === b.farbaBoxov && st.box1 === b.box1 && st.box2 === b.box2 && !st.okno, `boxy na ${cielId}: ${JSON.stringify(st)}, majú byť ${JSON.stringify(b)} a okno zatvorené`);
        const farba2 = await ovl.farba2.vyberFarbu2(t, { index: 0 });
        await ovl.cena.pridajDoKosika(t);
        const post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { farba, farba2, rozlozenie, kufor, farbaBoxov: b.farbaBoxov, box1: b.box1, box2: b.box2 });
        const c = await j.overCenu(s, ovl, cena);
        return { info: `${P.id} -> ${cielId}: 7 miest, 3 rady, rohož Classic, 2 boxy (${b.box1}+${b.box2}) prenesené, okno boxov zatvorené; POST platný, ${c.videne} € = Shoptet`, post: post.body };
      } finally {
        s.produkt = P;
      }
    },
  },

  "prenos-neplatny": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      await j.otvor(s, a.url, { novy: true });
      await ovl.kroky.vyberAuto(t, j.AUTO);
      const idF = await t.idParametra("farba");
      const farby = await t.ev(`Array.prototype.map.call(document.querySelectorAll('${F} .content-wrap .option-button[data-variant="${idF}"]'), function (b) { return b.getAttribute("data-value"); })`);
      const zdroj = Number(Object.keys(PRODUKTY).find((id) => PRODUKTY[id].typ === "jedno" && PRODUKTY[id].vzor === P.vzor));
      const pokus = async (popis, zaznam, { ostane }) => {
        await t.ev(`sessionStorage.setItem(${JSON.stringify(KLUC)}, ${JSON.stringify(JSON.stringify(zaznam))})`);
        await j.otvor(s, a.url, { novy: true });
        await j.pauza(1500);
        const st = await t.ev(`({ farba: !!document.querySelector('${F} .content-wrap .option-button.active[data-variant="${idF}"]'), kluc: sessionStorage.getItem(${JSON.stringify(KLUC)}), chyby: window.__lcd1v.chyby.slice(),
          otvorene: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-krok.active"), function (e) { return e.className.replace(/.*lcd1v-k-(\\w+).*/, "$1"); }) })`);
        j.over(!st.farba, `${popis}: farba sa zapísala`);
        j.over(!st.chyby.length, `${popis}: chyby 1V ${st.chyby.join("; ")}`);
        j.over(ostane ? st.kluc !== null : !(st.kluc && JSON.parse(st.kluc).prijate === 0), `${popis}: kľúč ${st.kluc}`);
        return st;
      };
      await pokus("kľúč starší ako 10 min", { v: 1, t: Date.now() - 11 * 60 * 1000, z: zdroj, na: P.id, vyber: { farba: farby[0] }, prijate: 0 }, { ostane: false });
      await pokus("kľúč pre iný produkt", { v: 1, t: Date.now(), z: zdroj, na: 99999, vyber: { farba: farby[0] }, prijate: 0 }, { ostane: true });
      const st = await pokus("farba, ktorú produkt nemá", { v: 1, t: Date.now(), z: zdroj, na: P.id, vyber: { farba: "999999" }, prijate: 0 }, { ostane: true });
      j.over(st.otvorene.length === 1 && st.otvorene[0] === "farba", `chýbajúca farba: otvorené ${st.otvorene.join(", ")}, má sa otvoriť krok Farba`);
      await t.ev(`sessionStorage.removeItem(${JSON.stringify(KLUC)})`);
      return { info: `starý kľúč, iný produkt, chýbajúca farba: nič sa neprenieslo, bez chyby; pri chýbajúcej farbe otvorený krok Farba` };
    },
  },
};
