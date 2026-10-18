// Scenáre kamiónov SK 640 (typ „kamion“) pre tools/test-konfigurator-1v.mjs — živá stránka s lokálnym buildom,
// POST do košíka sa zachytí a zruší. Plán: docs/kamiony-1v-plan.md §5 (c), (e). Tvar: scenare-vzorky.mjs.
// Nový vzhľad (--vyvoj, po vydaní --novy) sa ovláda klikmi na prvky [data-a] v #lcd1v-kamion (ako zákazník);
// starý vzhľad (React) tieto scenáre preskočí — React pokrýva npm run truck:test a brana / nulova-zmena.
//   kamion-platne   DAF XF106 2017–2021, prešívaná 12, lem 04, balík H19/2999, tapacír ako koberce -> 423 €, POST
//                   (kroky 5–6 otázky po jednej, Michal 18. 10. 2026 večer: kam -> motív + niť -> Pokračovať -> stred rovnaký)
//   kamion-dodavka  Fiat Ducato, jednofarebná 10G, lem 09, len stred H21/3546 -> 258 €, bez kroku tapacíru, POST
//   kamion-neuplne  nič nevybraté -> „Pridať do košíka“ aj lišta: žiadny POST, krok 1 červený
import { join } from "node:path";

/** --snimky: snímka s menom podľa šírky okna (640-<meno>-<šírka>.png). */
async function snimka(s, a, meno) {
  if (!a.snimky) return;
  const w = await s.t.ev("window.innerWidth").catch(() => "");
  await s.k.snimka(join(a.snimky, "640-" + meno + "-" + w + ".png")).catch(() => {});
}
/** --snimky: prvok #lcd1v-kamion <sel> hore v okne (pod hlavičkou webu), potom snímka okna. */
async function snimkaPrvku(s, a, j, sel, meno) {
  if (!a.snimky) return;
  await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify("#lcd1v-kamion " + sel)}); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 70, behavior: "instant" }); })()`);
  await j.pauza(700);
  await snimka(s, a, meno);
}
/** ?novy=1 pred vydaním (kamion nie je v ZAPNUTE_TYPY) = React: scenár sa preskočí, nie zlyhá (body.lcd-1v sa nečaká). */
const zapnuty = (a) => (a.zapnuteSet ? a.zapnuteSet.has(640) : !!a.novy);
const jeNovy = (s) => s.t.ev(`!!document.getElementById("lcd1v-kamion")`);

/** Postupnosť krokov v stránke: ["klik", selektor v #lcd1v-kamion] | ["vyber", pole, hodnota] | ["dalej", krok]. */
async function rob(s, j, kroky) {
  for (const k of kroky) {
    const r = await s.t.ev(`(function (k) {
      var root = document.getElementById("lcd1v-kamion"); if (!root) return "koreň chýba";
      var sel = k[0] === "dalej" ? '[data-a="dalej"][data-v="' + k[1] + '"]' : k[0] === "klik" ? k[1] : null;
      if (sel) { var el = root.querySelector(sel); if (!el) return "neexistuje " + sel; el.click(); return ""; }
      var s = root.querySelector('select[data-p="' + k[1] + '"]'); if (!s) return "neexistuje pole " + k[1];
      s.value = k[2]; if (s.value !== k[2]) return "pole " + k[1] + " nemá " + k[2];
      s.dispatchEvent(new Event("change", { bubbles: true })); return "";
    })(${JSON.stringify(k)})`);
    j.over(!r, "krok " + JSON.stringify(k) + ": " + r);
    await j.pauza(120);
  }
}
const a_ = (akcia, v, m) => '[data-a="' + akcia + '"]' + (m ? '[data-m="' + m + '"]' : "") + (v != null ? '[data-v="' + v + '"]' : "");

/** Stav po výbere: texty zvolených možností 15 selectov, súčet UI, poznámka objednávky. */
const STAV = `(function () {
  var sel = {}, ine = {};
  Array.prototype.forEach.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), function (s) {
    var o = s.options[s.selectedIndex];
    sel[s.getAttribute("data-parameter-id")] = s.value && o ? o.textContent.trim().replace(/\\s*\\+\\s*€\\s*\\d+\\s*$/, "") : "";
    if (s.value) ine[s.getAttribute("data-parameter-id")] = s.value;
  });
  var k = window.__lcd1vKamion, suma = document.querySelector("#lcd1v-kamion .k-suhrn__suma");
  return { sel: sel, ine: ine, spolu: k ? k.ui.cena().spolu : null, suma: suma ? suma.textContent : null,
    poznamka: sessionStorage.getItem("truckOrderSummary"), vozidlo: sessionStorage.getItem("truckVehicle"),
    krokov: document.querySelectorAll("#lcd1v-kamion .k-krok").length };
})()`;

/** R1: náhľad nášivky (canvas) nie je „tainted“ a motív je v farbe nite (počet pixelov blízkych farbe rgb). */
const NAHLAD = (rgb) => `(function (c) {
  var cv = document.querySelector("#lcd1v-kamion canvas[data-motiv]"); if (!cv) return { chyba: "canvas náhľadu chýba" };
  var d; try { d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return { chyba: "canvas tainted: " + e.message }; }
  var n = 0; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - c[0]) < 40 && Math.abs(d[i + 1] - c[1]) < 40 && Math.abs(d[i + 2] - c[2]) < 40) n++;
  return { n: n };
})(${JSON.stringify(rgb)})`;
async function overNahlad(s, j, rgb, meno) {
  let r = null;
  for (let i = 0; i < 20; i++) { r = await s.t.ev(NAHLAD(rgb)); if (r && !r.chyba && r.n > 50) break; await j.pauza(250); }
  j.over(r && !r.chyba && r.n > 50, "náhľad nášivky " + meno + ": " + JSON.stringify(r));
}
/** R2: pravidlá s BEM modifikátorom „--“ sú v CSS (computed style); „zvolené = zelené“ a otázky po jednej (Michal 18. 10. 2026). */
const STYLY = `(function () {
  function cs(sel, p, ps) { var el = document.querySelector("#lcd1v-kamion " + sel); return el ? getComputedStyle(el, ps || null)[p] : null; }
  var zm = document.querySelector("#lcd1v-kamion .kn-hot__zm");
  return { ano: cs(".an__b--ano", "backgroundImage"), nie: cs(".an__b--nie", "backgroundImage"), ponuka: cs(".kn-ponuka", "borderTopColor"),
    pas: cs(".kn-dv__b--bal .kn-dv__top", "backgroundImage"), dlZvol: cs(".kn-dv__b.is-on", "borderTopColor"), rad: cs(".kn-dv__b.is-on .kn-rad", "backgroundImage"),
    dlRamy: Array.prototype.map.call(document.querySelectorAll("#lcd1v-kamion .kn-dv__b"), function (e) { return getComputedStyle(e).borderTopColor; }),
    preciarknute: cs(".kn-dv__b .k-cenovka__s s", "textDecorationColor"), pilulka: cs(".kn-dv__b .k-cenovka__u", "backgroundColor"), cena: cs(".kn-dv__b .k-cenovka__c", "fontSize"),
    ot: cs(".kn-ot", "fontSize"), hotIc: cs(".kn-hot__ic", "backgroundImage"), zmenitH: zm ? zm.getBoundingClientRect().height : 0,
    motiv: cs(".k-dlazdice--motiv .k-dlazdica__img", "backgroundColor"), motivFit: cs(".k-dlazdice--motiv .k-dlazdica__img", "objectFit"), motivZvol: cs(".k-dlazdice--motiv .k-dlazdica.is-on", "borderTopColor"),
    motivFajka: cs(".k-dlazdice--motiv .k-dlazdica.is-on", "backgroundImage", "::after"), nitZvol: cs(".nt__b.is-on", "borderTopColor") };
})()`;
const ZELENA = "rgb(31, 122, 82)", ZLATA = "rgb(196, 155, 49)";
/** Krok 5.1: otázka s 3 fotkovými dlaždicami (načítaná fotka kabíny, cenovka) + „Nie, ďakujem“, bez zeleného tlačidla v dlaždiciach. */
const KROK5 = `(function () {
  var q = function (s) { return document.querySelectorAll("#lcd1v-kamion " + s); };
  return { dlazdic: q(".kn-dv > .kn-dv__b").length, nie: !!document.querySelector('#lcd1v-kamion [data-a="nas"][data-v="nechcem"]'),
    foto: Array.prototype.map.call(q(".kn-dv__b .kn-scena > img"), function (i) { return i.complete ? i.naturalWidth : 0; }),
    cenovky: q(".kn-dv__b .k-cenovka").length, zelene: q(".kn-dv .k-btn-zelene").length, dalej: q('[data-a="dalej"][data-v="nasivky"]').length,
    otazka: (document.querySelector("#lcd1v-kamion .kn-ot") || {}).textContent || "" };
})()`;
/** Karta podotázky kroku 5: otvorené bloky, veľký náhľad cez celú šírku karty v ≥ 2× rozlíšení. */
const KARTA5 = `(function () {
  var cv = document.querySelector('#lcd1v-kamion [data-krok="nasivky"] .kn-karta .kn-nh__cv'), k = cv && cv.closest(".kn-karta"), cs = k ? getComputedStyle(k) : null;
  return { otvorene: Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion [data-krok="nasivky"] [data-blok]'), function (e) { return e.getAttribute("data-blok"); }),
    vnutro: k ? k.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) : 0, cvCss: cv ? cv.clientWidth : 0, cvW: cv ? cv.width : 0, cvH: cv ? cv.height : 0 };
})()`;
/** Po „Pokračovať“ je novo otvorená karta plynulo posunutá hore do okna (pod hlavičku webu). */
const POSUN = (blok) => `(function () { var e = document.querySelector('#lcd1v-kamion [data-blok="${blok}"]'); if (!e) return null; var r = e.getBoundingClientRect(); return { top: Math.round(r.top), vh: innerHeight }; })()`;
/** Krok 6: celá fotka dverí v ponuke (pomer vykreslenia = pomer súboru, bez orezania), dve zjavné voľby „rovnaké / inak“ (aj po zatvorení ponuky). */
const KROK6 = `(function () {
  var rv = Array.prototype.map.call(document.querySelectorAll('#lcd1v-kamion [data-krok="tapacir"] .kn-rv__b'), function (x) { return x.getAttribute("data-a") + ":" + x.getAttribute("aria-pressed"); });
  var i = document.querySelector('#lcd1v-kamion [data-krok="tapacir"] .kn-dvere:not(.kn-dvere--vyrez) > img'); if (!i) return { chyba: "fotka dverí chýba", rv: rv };
  var b = i.getBoundingClientRect(), r = i.parentElement.getBoundingClientRect();
  return { nw: i.complete ? i.naturalWidth : 0, nh: i.naturalHeight, w: b.width, h: b.height, ram: r.width, fit: getComputedStyle(i).objectFit, rv: rv };
})()`;
/** Opakuje vyhodnotenie (lenivé načítanie fotiek, kreslenie plátna), kým podmienka neplatí, najviac ~6 s. */
async function cakaj(s, j, vyraz, ok) {
  let r = null;
  for (let i = 0; i < 24; i++) { r = await s.t.ev(vyraz); if (r && ok(r)) break; await j.pauza(250); }
  return r;
}

async function doKosika(s, a, j, meno) {
  await snimkaPrvku(s, a, j, '[data-k="suhrn"]', meno + "-pred-kosikom");
  await rob(s, j, [["klik", a_("kosik")]]);
  const post = await j.cakajNaPost(s);
  const st = await s.t.ev(STAV);
  // „Rozloženie nášiviek“ (349) jadro testu berie ako krok rozloženia autokobercov (PARAMETRE.rozlozenie) -> ocak.rozlozenie
  const idR = await s.t.maParameter("rozlozenie");
  const ine = Object.assign({}, st.ine);
  if (idR) delete ine[idR];
  const cena = await j.overPost(s, post, { ine, rozlozenie: idR ? st.ine[idR] : undefined });
  j.over(cena.spolu === st.spolu, "cena v košíku Shoptetu " + cena.spolu + " € (" + cena.rozpis + ") ≠ konfigurátor " + st.spolu + " €");
  j.over(st.suma === j.eur(st.spolu), "súhrn „" + st.suma + "“ ≠ " + j.eur(st.spolu));
  j.over(/^ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: /.test(st.poznamka || ""), "poznámka objednávky chýba: " + st.poznamka);
  return { post, st, cena };
}

export const SCENARE = {
  "kamion-platne": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await snimka(s, a, "kamion-start");
      await rob(s, j, [
        ["vyber", "znacka", "DAF (TIR)"], ["vyber", "model", "XF106 2017-2021"], ["dalej", "vozidlo"],
        ["klik", a_("mat", "Prémiová syntetická koža – prešívaná")], ["dalej", "material"],
        ["klik", a_("farba", "12")], ["dalej", "farba"],
        ["klik", a_("lem", "04")], ["dalej", "lemovanie"],
      ]);
      // 5.1 — veľká otázka, 4 výlučné voľby s cenovkou, žiadne zelené tlačidlo v dlaždiciach ani „Pokračujte ďalej“
      await s.t.ev(`document.querySelector('#lcd1v-kamion .kn-dv').scrollIntoView({ block: "start" })`);
      const k5 = await cakaj(s, j, KROK5, (r) => r.foto.length === 3 && r.foto.every((x) => x > 0));
      j.over(k5.dlazdic === 3 && k5.nie && k5.cenovky === 3 && !k5.zelene && !k5.dalej && k5.otazka === "Prosím, vyberte si, kam chcete nášivky", "krok 5.1: 3 fotkové dlaždice s cenovkou + „Nie, ďakujem“, bez zeleného tlačidla: " + JSON.stringify(k5));
      j.over(k5.foto.length === 3 && k5.foto.every((x) => x > 0), "fotka kabíny sa nenačítala: " + JSON.stringify(k5.foto));
      const st5a = await s.t.ev(STYLY);
      j.over(/rgb\(143, 112, 32\)|rgb\(230, 200, 119\)/.test(st5a.pas || ""), "pás „★ Najobľúbenejšie ★“ nie je zlatý: " + st5a.pas);
      j.over(st5a.preciarknute === "rgb(192, 57, 43)" && st5a.pilulka === "rgb(226, 243, 233)" && parseFloat(st5a.cena) >= 25, "cenovka nie je ako rohož a box (červená čiara, zelená pilulka, veľká cena): " + JSON.stringify([st5a.preciarknute, st5a.pilulka, st5a.cena]));
      j.over(parseFloat(st5a.ot) >= 18, "otázka „Prosím, vyberte si …“ nie je veľká: " + st5a.ot);
      j.over(st5a.dlRamy.every((x) => x !== ZELENA), "pred výberom je niektorá dlaždica zelená: " + JSON.stringify(st5a.dlRamy));
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-kam");
      await rob(s, j, [["klik", a_("nas", "boky+stred")], ["klik", a_("motiv", "H19", "boky")], ["klik", a_("viac", null, "boky")], ["klik", a_("nit", "2824", "boky")]]);
      const st5 = await s.t.ev(STYLY);
      j.over(st5.motivZvol === ZELENA && st5.nitZvol === ZELENA, "zvolené nie je zelené (motív " + st5.motivZvol + ", niť " + st5.nitZvol + ")");
      j.over(/rgb\(29, 107, 74\)/.test(st5.motivFajka || "") && /rgb\(29, 107, 74\)/.test(st5.hotIc || ""), "fajka zvolenej voľby nie je zelená: " + st5.motivFajka + " | " + st5.hotIc);
      j.over(st5.zmenitH >= 44, "„Zmeniť“ má ťuk-plochu " + st5.zmenitH + " px (< 44)");
      // revízia 18. 10. 2026 (ako návrh C): motív cez celú dlaždicu (cover) na béžovom podklade PNG motívu #f0edda
      j.over(st5.motiv === "rgb(240, 237, 218)" && st5.motivFit === "cover", "dlaždica motívu nie je ako návrh C (béžový podklad, cover): " + st5.motiv + " | " + st5.motivFit);
      const kk = await cakaj(s, j, KARTA5, (r) => r.cvW > 0);
      j.over(JSON.stringify(kk.otvorene) === JSON.stringify(["boky"]), "po výbere všetkých troch má byť otvorená LEN karta „pod sedadlami“: " + JSON.stringify(kk.otvorene));
      j.over(kk.cvCss >= kk.vnutro - 2 && kk.cvW >= 2 * kk.cvCss - 1 && Math.abs(kk.cvW * 2 - kk.cvH * 3) <= 3, "veľký náhľad: plátno " + kk.cvW + "×" + kk.cvH + " px, CSS " + kk.cvCss + " px, karta " + kk.vnutro + " px");
      await overNahlad(s, j, [200, 30, 40], "v nití 2824 (červená)");
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-nasivky");
      await snimkaPrvku(s, a, j, ".k-dlazdice--motiv", "kamion-krok5-nahlad");
      await rob(s, j, [["klik", a_("nit", "2999", "boky")], ["klik", a_("potvrd", "boky")]]);
      await j.pauza(900);
      const ps = await s.t.ev(POSUN("stred"));
      j.over(ps && ps.top >= 0 && ps.top < ps.vh * 0.6, "po „Pokračovať“ sa karta stredového koberca neposunula do okna: " + JSON.stringify(ps));
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-stred");
      await rob(s, j, [["klik", a_("stredRovnaky", "1")], ["klik", a_("zmenit", "kam")]]);
      const st5z = await s.t.ev(STYLY);
      j.over(st5z.dlRamy.filter((x) => x === ZELENA).length === 1 && st5z.dlZvol === ZELENA && /rgb\(29, 107, 74\)/.test(st5z.rad || ""), "zvolená má byť zelená LEN jedna dlaždica: " + JSON.stringify(st5z.dlRamy) + " | " + st5z.rad);
      await rob(s, j, [["klik", a_("nas", "boky+stred")]]);
      await snimkaPrvku(s, a, j, '[data-krok="nasivky"]', "kamion-krok5-hotove");
      await rob(s, j, [["dalej", "nasivky"]]);
      j.over((await s.t.ev(STYLY)).ponuka === ZLATA, "ponuka tapacíru (kn-ponuka) bez zlatého rámu");
      await s.t.ev(`document.querySelector('#lcd1v-kamion [data-krok="tapacir"]').scrollIntoView({ block: "start" })`);
      const k6 = await cakaj(s, j, KROK6, (r) => r.nw > 0);
      j.over(k6.nw > 0 && Math.abs(k6.w / k6.h - k6.nw / k6.nh) < 0.02 && Math.abs(k6.w - k6.ram) <= 2, "fotka dverí nie je celá (bez orezania) cez šírku karty: " + JSON.stringify(k6));
      await snimkaPrvku(s, a, j, '[data-krok="tapacir"]', "kamion-krok6-ponuka");
      await rob(s, j, [["klik", a_("tap", "ano")]]);
      const k6a = await s.t.ev(KROK6);
      j.over(JSON.stringify(k6a.rv) === JSON.stringify(["tapRovnake:false", "tapZmenit:false"]), "tapacír: chýba otázka „Rovnaké ako koberce / Vybrať inak“ bez predvoľby: " + JSON.stringify(k6a.rv));
      await snimkaPrvku(s, a, j, '[data-krok="tapacir"]', "kamion-krok6-ano");
      if (a.snimky) {
        await rob(s, j, [["klik", a_("tapZmenit")]]);
        await snimkaPrvku(s, a, j, '[data-krok="tapacir"]', "kamion-krok6-zmenit");
        await rob(s, j, [["klik", a_("zmenit", "mat")]]);
      }
      await rob(s, j, [["klik", a_("tapRovnake")]]);
      await snimkaPrvku(s, a, j, ".an", "kamion-krok6-nasivka-dvere");
      const st6 = await s.t.ev(STYLY);
      j.over(/rgb\(29, 107, 74\)/.test(st6.ano || "") && /rgb\(226, 190, 92\)/.test(st6.nie || ""), "nášivka na tapacír: Áno nie je zelené / Nie zlaté: " + st6.ano + " | " + st6.nie);
      await rob(s, j, [["klik", a_("tapNas", "nie")]]);
      const { post, st, cena } = await doKosika(s, a, j, "kamion-platne");
      const ocak = { 346: "Prémiová syntetická koža – prešívaná", 349: "Šofér + spolujazdec + stred (BALÍK)", 403: "Nášivka H19", 406: "2999 – Čierna", 409: "Nášivka H19", 412: "2999 – Čierna", 352: "Áno chcem (v konfigurátore – balík)", 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" };
      Object.entries(ocak).forEach(([id, t]) => j.over(st.sel[id] === t, id + " „" + st.sel[id] + "“ ≠ „" + t + "“"));
      j.over(st.vozidlo === "DAF (TIR) XF106 2017-2021", "truckVehicle " + st.vozidlo);
      // telo POST do výsledku (--json): porovnanie bajt po bajte s docs/kamiony-snimky/post-porovnanie.json (= React)
      return { info: "423 € = " + cena.zaklad + " + " + cena.rozpis, post: post ? post.body : null, spolu: cena.spolu };
    },
  },
  "kamion-dodavka": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await rob(s, j, [
        ["klik", a_("typ", "dodavka")], ["vyber", "znacka", "Fiat (dodávka)"], ["vyber", "model", "Ducato 2007-2025"], ["dalej", "vozidlo"],
        ["klik", a_("mat", "Prémiová syntetická koža – jednofarebná")], ["dalej", "material"],
        ["klik", a_("farba", "10G")], ["dalej", "farba"],
        ["klik", a_("lem", "09")], ["dalej", "lemovanie"],
        ["klik", a_("nas", "stred")], ["klik", a_("motiv", "H21", "stred")], ["klik", a_("nit", "3546", "stred")],
      ]);
      await overNahlad(s, j, [220, 200, 168], "v nití 3546 (béžová)");
      await rob(s, j, [["klik", a_("potvrd", "stred")], ["dalej", "nasivky"]]);
      const pred = await s.t.ev(STAV);
      j.over(pred.krokov === 5, "dodávka má mať 5 krokov (bez tapacíru), je " + pred.krokov);
      const { post, st, cena } = await doKosika(s, a, j, "kamion-dodavka");
      j.over(st.sel[352] === "Nie nechcem tapacír dverí" && st.sel[355] === "Nie nechcem nášivku na dverách", "tapacír v selectoch: " + st.sel[352] + " / " + st.sel[355]);
      j.over(st.spolu === 258, "spolu " + st.spolu + " ≠ 258 €");
      return { info: "258 € = " + cena.zaklad + " + " + cena.rozpis, post: post ? post.body : null, spolu: cena.spolu };
    },
  },
  "kamion-neuplne": {
    typy: ["kamion"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy, kontrola1v: zapnuty(a) });
      if (!(await jeNovy(s))) return { preskoc: "starý vzhľad (React) — pokrýva npm run truck:test" };
      await rob(s, j, [["klik", a_("kosik")]]);
      await s.t.ev(`(function () { var b = document.querySelector('#lcd1v-lista [data-a="lista"]'); if (b) b.click(); })()`);
      await j.pauza(2500);
      j.over(!s.posty.length, "nič nevybraté, ale odišiel POST do košíka");
      const r = await s.t.ev(`!!document.querySelector('#lcd1v-kamion [data-krok="vozidlo"].is-open.is-error')`);
      j.over(r, "krok 1 nie je otvorený s červeným rámom");
      return { info: "bez POST, krok 1 červený" };
    },
  },
};
