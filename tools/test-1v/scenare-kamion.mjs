// Scenáre kamiónov SK 640 (typ „kamion“) pre tools/test-konfigurator-1v.mjs — živá stránka s lokálnym buildom,
// POST do košíka sa zachytí a zruší. Plán: docs/kamiony-1v-plan.md §5 (c), (e). Tvar: scenare-vzorky.mjs.
// Nový vzhľad (--vyvoj, po vydaní --novy) sa ovláda klikmi na prvky [data-a] v #lcd1v-kamion (ako zákazník);
// starý vzhľad (React) tieto scenáre preskočí — React pokrýva npm run truck:test a brana / nulova-zmena.
//   kamion-platne   DAF XF106 2017–2021, prešívaná 12, lem 04, balík H19/2999, tapacír ako koberce -> 423 €, POST
//   kamion-dodavka  Fiat Ducato, jednofarebná 10G, lem 09, len stred H21/3546 -> 258 €, bez kroku tapacíru, POST
//   kamion-neuplne  nič nevybraté -> „Pridať do košíka“ aj lišta: žiadny POST, krok 1 červený
import { join } from "node:path";

/** --snimky: snímka s menom podľa šírky okna (640-<meno>-<šírka>.png). */
async function snimka(s, a, meno) {
  if (!a.snimky) return;
  const w = await s.t.ev("window.innerWidth").catch(() => "");
  await s.k.snimka(join(a.snimky, "640-" + meno + "-" + w + ".png")).catch(() => {});
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

async function doKosika(s, a, j, meno) {
  await snimka(s, a, meno + "-pred-kosikom");
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
        ["klik", a_("nas", "boky+stred")], ["klik", a_("motiv", "H19", "boky")], ["klik", a_("nit", "2999", "boky")], ["dalej", "nasivky"],
        ["klik", a_("tap", "ano")], ["klik", a_("tapNas", "nie")],
      ]);
      const { st, cena } = await doKosika(s, a, j, "kamion-platne");
      const ocak = { 346: "Prémiová syntetická koža – prešívaná", 349: "Šofér + spolujazdec + stred (BALÍK)", 403: "Nášivka H19", 406: "2999 – Čierna", 409: "Nášivka H19", 412: "2999 – Čierna", 352: "Áno chcem (v konfigurátore – balík)", 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" };
      Object.entries(ocak).forEach(([id, t]) => j.over(st.sel[id] === t, id + " „" + st.sel[id] + "“ ≠ „" + t + "“"));
      j.over(st.vozidlo === "DAF (TIR) XF106 2017-2021", "truckVehicle " + st.vozidlo);
      return { info: "423 € = " + cena.zaklad + " + " + cena.rozpis, post: null, spolu: cena.spolu };
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
        ["klik", a_("nas", "stred")], ["klik", a_("motiv", "H21", "stred")], ["klik", a_("nit", "3546", "stred")], ["dalej", "nasivky"],
      ]);
      const pred = await s.t.ev(STAV);
      j.over(pred.krokov === 5, "dodávka má mať 5 krokov (bez tapacíru), je " + pred.krokov);
      const { st, cena } = await doKosika(s, a, j, "kamion-dodavka");
      j.over(st.sel[352] === "Nie nechcem tapacír dverí" && st.sel[355] === "Nie nechcem nášivku na dverách", "tapacír v selectoch: " + st.sel[352] + " / " + st.sel[355]);
      j.over(st.spolu === 258, "spolu " + st.spolu + " ≠ 258 €");
      return { info: "258 € = " + cena.zaklad + " + " + cena.rozpis, spolu: cena.spolu };
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
