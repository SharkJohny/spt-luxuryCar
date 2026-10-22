// Scenáre navyše pre rohože do kufra Classic 619/622/625 a Premium 628/631/634 (typy „kufor-classic“, „kufor-premium“).
// VLASTNÍK: worker kufor (W3 / T2.2). Tvar a parametre: tools/test-1v/scenare-jedno.mjs.
//
// Spoločné scenáre pre rohože sú v jadre (tools/test-konfigurator-1v.mjs): brana, nulova-zmena, bez-auta,
// neuplne (auto -> farba), platne (auto + farba -> POST), dokoncit (starý web: „Dokončiť konfiguráciu“ = živý POST,
// zachytený a zrušený), k-suhrnu (nový vzhľad: posledný krok nevkladá, POST 0, potom košík).
// Živý POST rohože (14. 10. 2026): productId, priceId, language, amount, parameterValueId[78] — nič iné.
//
// Tu (len nový vzhľad, ?novy=1 / --vyvoj):
//   kufor-vzhlad – to, čo pridáva kufor-produkt.js + CSS typu, overené proti NEZÁVISLÉMU zdroju: ceny vzorov z profilov
//                  (produkty.mjs, plan.md §4), príplatok setu GET-om živej stránky jednovrstvových (select „do kufru“),
//                  živý H1 zo servera; texty z návrhov kufor-classic.html / kufor-premium.html. Farba nemení hlavnú fotku.
//                  Ponuka setu s autokobercami (banner C) je LEN v skrytom medzikroku (komplet-ponuka.js, Michal
//                  17. 10. 2026: „toto má byť v medzikroku, nie ďalší iný banner“) -> mimo karty .lcd1v-komplet banner nie je
//                  (texty, čísla, stuha a prenos banneru: scenare-komplet.mjs).
//   vzor-auto    – auto vybrané na rohoži ostane po prechode dlaždicou vzoru na sesterskú rohož (619 -> 622 …), nový
//                  vzhľad tam beží ďalej a košík pošle platný POST sesterského produktu (priceId z plan.md §4).
import { PRODUKTY } from "./produkty.mjs";

const NAZOV = { "kufor-classic": "Luxusná rohož do kufra Classic", "kufor-premium": "Luxusná rohož do kufra Premium" };
const TYP_TEXT = { "kufor-classic": "Dno kufra", "kufor-premium": "Celý kufor" };
const VZOR_NAZOV = { diamond: "Diamond Line", stripe: "Stripe Line", hexa: "Hexa Line" };
const VZORY = ["diamond", "stripe", "hexa"];
/** Jadro kroky.js po oprave prazdnePole (obnovené auto = vyplnené pole) -> true: vzor-auto to kontroluje natvrdo. */
const JADRO_AUTO_OPRAVENE = true; // kroky.js prazdnePole opravené (T1.1, integrácia WA 14. 10. 2026)
const cisty = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim(); // aj NBSP
const eur = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")) + " €";

/** Profil (id + produkty.mjs) daného typu a vzoru. */
function profil(typ, vzor) {
  const id = Object.keys(PRODUKTY).find((i) => PRODUKTY[i].typ === typ && PRODUKTY[i].vzor === vzor);
  return id ? { id: Number(id), ...PRODUKTY[id] } : null;
}
/** Základná cena produktu z profilu (platne.spolu = variant bez príplatkov: rohož nemá žiadne príplatky). */
const zaklad = (p) => (p && p.platne ? p.platne.spolu : null);
const cesta = (url) => new URL(url).pathname;

/** Očakávaný štítok dlaždice: rozdiel sesterská − vlastná. */
function stitok(rozdiel) {
  if (rozdiel === 0) return "v cene";
  return (rozdiel > 0 ? "+ " : "− ") + eur(Math.abs(rozdiel));
}

/** Hlavná fotka galérie (najväčší viditeľný obrázok v .p-image-wrapper) -> src alebo null. */
const FOTO = `(function () {
  var w = document.querySelector(".p-image-wrapper") || document.querySelector(".p-image");
  if (!w) return null;
  var best = null, plocha = 0;
  Array.prototype.forEach.call(w.querySelectorAll("img"), function (i) { var r = i.getBoundingClientRect(); var p = r.width * r.height; if (p > plocha) { plocha = p; best = i; } });
  return best && plocha > 10000 ? (best.currentSrc || best.src) : null;
})()`;

export const SCENARE = {
  "kufor-vzhlad": {
    typy: ["kufor-classic", "kufor-premium"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.kroky !== "novy") return { preskoc: "len nový vzhľad (?novy=1 / --vyvoj)" };
      const t = s.t, P = a.produkt, typ = P.typ, info = [];
      await j.otvor(s, a.url, { novy: true });
      // prvky s cenami vznikajú až po GET sesterských stránok (ceny-ine.js)
      await t.cakaj(`document.querySelectorAll("#product-detail-form .lcd1v-k-vzor .banner-header[data-lcd1v-cena]").length === 3`,
        { ms: 15000, popis: "ceny dlaždíc vzoru (GET sesterských stránok)" });
      const st = await t.ev(`(async function () {
        function vid(e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 2 && r.height > 2 && c.display !== "none" && c.visibility !== "hidden"; }
        var f = document.getElementById("product-detail-form");
        var h1 = document.querySelector(".p-detail-inner-header > h1");
        var srv = await fetch(location.pathname, { credentials: "same-origin" }).then(function (r) { return r.text(); });
        var d = new DOMParser().parseFromString(srv, "text/html");
        var h1s = d.querySelector(".p-detail-inner-header h1") || d.querySelector("h1");
        var n = document.querySelector(".lcd1v-kf-nazov");
        var kroky = Array.prototype.map.call(f.querySelectorAll(".lcd1v-krok:not(.lcd1v-komplet)"), function (k) {
          var m = /lcd1v-k-(\\w+)/.exec(Array.prototype.find.call(k.classList, function (c) { return /^lcd1v-k-/.test(c); }) || ""); return m ? m[1] : "?"; });
        var auto = f.querySelector(".lcd1v-k-auto");
        var alt = f.querySelector(".lcd1v-kf-alt");
        return {
          h1: h1 ? h1.textContent.replace(/\\s+/g, " ").trim() : null, h1Server: h1s ? h1s.textContent.replace(/\\s+/g, " ").trim() : null,
          h1Deti: h1 ? h1.children.length : -1, h1Vidno: vid(h1), nazov: n ? n.textContent.replace(/\\s+/g, " ").trim() : null, nazovVidno: vid(n),
          nazovAria: n ? n.getAttribute("aria-hidden") : null,
          typ: (document.querySelector(".p-detail-inner-header .lcd1v-typ") || {}).textContent || null,
          kroky: kroky, ey: Array.prototype.map.call(f.querySelectorAll(".lcd1v-krok:not(.lcd1v-komplet) .lcd1v-ey"), function (e) { return e.textContent; }),
          volant: !!(auto && auto.querySelector(".wheel-Position")) && vid(auto.querySelector(".wheel-Position")),
          miesta: vid(auto && auto.querySelector(".sit-Position")), dvere: vid(auto && auto.querySelector(".door-Position")),
          polia: auto ? Array.prototype.filter.call(auto.querySelectorAll(".modl-selector-wrap select"), vid).length : 0,
          dlazdice: Array.prototype.map.call(f.querySelectorAll(".lcd1v-k-vzor .patterns-wrap > .option-button"), function (a) {
            var b = a.querySelector(".banner-header"); var v = (/lcd1v-vzor-(\\w+)/.exec(a.className) || [])[1];
            return { vzor: v, text: b ? b.textContent.replace(/\\s+/g, " ").trim() : "", cena: b ? b.getAttribute("data-lcd1v-cena") : null, aktivna: a.classList.contains("active"),
              poZnak: b ? getComputedStyle(b, "::after").content : "" }; }),
          pod: (f.querySelector(".lcd1v-k-vzor > .lcd1v-pod") || {}).textContent || null,
          // banner setu len v skrytom medzikroku (komplet-ponuka.js), nikde inde; starý pás setu tiež nie
          bannerMimo: Array.prototype.filter.call(document.querySelectorAll(".lcd1v-bs"), function (b) { return !b.closest(".lcd1v-komplet"); }).length,
          starePasy: f.querySelectorAll(".lcd1v-kf-set").length,
          alt: alt ? alt.textContent.replace(/\\s+/g, " ").trim() : null, altHref: alt && alt.querySelector("a") ? alt.querySelector("a").getAttribute("href") : null, altVidno: vid(alt),
          altZaKosikom: !!(alt && alt.previousElementSibling && alt.previousElementSibling.classList.contains("add-to-cart")),
          benefit: vid(document.querySelector(".p-info-wrapper > .benefitBanner__item")), upsale: vid(f.querySelector(".p-info-wrapper > .upsale-Banner")),
          menaVNovych: document.querySelectorAll(".lcd1v-kf-nazov [name], .lcd1v-bs [name], .lcd1v-kf-alt [name], .lcd1v-kf-pod [name]").length,
          chyby: window.__lcd1v ? window.__lcd1v.chyby : ["window.__lcd1v chýba"],
        };
      })()`);
      // názov: živý H1 v DOM nezmenený (rovnaký ako zo servera), len vizuálne skrytý; nový názov podľa návrhu
      j.over(st.h1 && st.h1 === st.h1Server, "živý H1 sa zmenil: „" + st.h1 + "“ ≠ server „" + st.h1Server + "“");
      j.over(st.h1Deti === 0, "do živého H1 sa niečo vložilo (" + st.h1Deti + " prvkov)");
      j.over(!st.h1Vidno, "živý H1 „" + st.h1 + "“ je viditeľný (má byť len vizuálne skrytý)");
      const nazov = NAZOV[typ] + " " + VZOR_NAZOV[P.vzor];
      j.over(st.nazov === nazov && st.nazovVidno && st.nazovAria === "true", "nový názov „" + st.nazov + "“ (vidno " + st.nazovVidno + ", aria-hidden " + st.nazovAria + ") ≠ „" + nazov + "“");
      j.over(st.typ === TYP_TEXT[typ], "štítok typu „" + st.typ + "“ ≠ „" + TYP_TEXT[typ] + "“");
      info.push("názov „" + nazov + "“ (H1 v DOM)");
      // 3 kroky; auto bez volantu, ale s počtom miest a dverí (Michal 23. 10. 2026)
      j.over(JSON.stringify(st.kroky) === JSON.stringify(["vzor", "auto", "farba"]), "kroky " + JSON.stringify(st.kroky) + " ≠ vzor, auto, farba");
      j.over(st.ey[0] === "Krok 1 z 3" && st.ey[2] === "Krok 3 z 3", "číslovanie kariet " + JSON.stringify(st.ey));
      j.over(!st.volant && st.miesta && st.dvere, "krok auta: bez volantu, s počtom miest a dverí: " + JSON.stringify({ volant: st.volant, miesta: st.miesta, dvere: st.dvere }));
      j.over(st.polia === 4, "krok auta: viditeľné polia " + st.polia + " ≠ 4");
      // dlaždice vzoru: rozdiel cien podľa profilov (plan.md §4), vlastná „v cene“; text dlaždice bez ceny
      const own = zaklad(P);
      // základný vzor = najlacnejšia rohož toho typu (profily, plan.md §4) — Premium dlaždice sú rozdiel oproti nemu na všetkých stránkach
      const zakladVzoru = Math.min(...VZORY.map((v) => zaklad(profil(typ, v))).filter((c) => c > 0));
      const ocakPod = {};
      for (const d of st.dlazdice) {
        const sp = profil(typ, d.vzor);
        j.over(sp && zaklad(sp) != null, "dlaždica " + d.vzor + ": profil sesterskej rohože chýba");
        ocakPod[d.vzor] = zaklad(sp);
        // Classic (návrh kufor-classic.html): plná cena vzoru „240 €“; Premium (kufor-premium.html): „v cene / + 10 € / + 10 €“
        const ocak = typ === "kufor-classic" ? eur(zaklad(sp)) : stitok(zaklad(sp) - zakladVzoru);
        j.over(cisty(d.cena) === ocak, "dlaždica " + d.vzor + ": cena „" + d.cena + "“ ≠ „" + ocak + "“ (" + zaklad(sp) + (typ === "kufor-classic" ? "" : " − " + zakladVzoru) + ")");
        j.over(d.text === VZOR_NAZOV[d.vzor].toUpperCase() || cisty(d.text).toLowerCase() === VZOR_NAZOV[d.vzor].toLowerCase(), "text dlaždice " + d.vzor + " „" + d.text + "“ (cena má byť len v ::after)");
        j.over(/v cene|€/.test(d.poZnak), "cena dlaždice " + d.vzor + " sa nezobrazuje (::after " + d.poZnak + ")");
      }
      info.push("dlaždice " + st.dlazdice.map((d) => d.vzor + " " + cisty(d.cena)).join(", "));
      // podnadpis kroku 1: jeden najlacnejší vzor, ostatné o rovnakú sumu drahšie (dnešné ceny) -> veta z návrhu
      const ceny = VZORY.map((v) => ocakPod[v]);
      const min = Math.min(...ceny), drahe = VZORY.filter((v) => ocakPod[v] !== min);
      if (VZORY.filter((v) => ocakPod[v] === min).length === 1 && drahe.length === 2 && ocakPod[drahe[0]] === ocakPod[drahe[1]]) {
        const lacny = VZOR_NAZOV[VZORY.find((v) => ocakPod[v] === min)], r = eur(ocakPod[drahe[0]] - min), dv = drahe.map((v) => VZOR_NAZOV[v]).join(" a ");
        const ocak = typ === "kufor-classic"
          ? lacny + " je v základnej cene. " + dv + " stoja o " + r + " viac."
          : lacny + " je v základnej cene, " + dv + " stoja o " + r + " viac. Ponuka farieb sa pri každom vzore líši.";
        j.over(cisty(st.pod) === ocak, "podnadpis kroku 1 „" + st.pod + "“ ≠ „" + ocak + "“");
      } else s.upozornenia.push("ceny vzorov " + JSON.stringify(ocakPod) + " nemajú tvar návrhu — podnadpis kroku 1: " + st.pod);
      // Michal 17. 10. 2026: „toto má byť v medzikroku, nie ďalší iný banner“ -> pod cenou ani inde mimo medzikroku banner nie je
      j.over(st.bannerMimo === 0 && st.starePasy === 0, "banner setu mimo medzikroku (" + st.bannerMimo + "×) / starý pás setu (" + st.starePasy + "×)");
      // Classic: odkaz na Premium toho istého vzoru pod košíkom; Premium bez neho
      if (typ === "kufor-classic") {
        const pr = profil("kufor-premium", P.vzor);
        j.over(st.alt === "Chcete chrániť aj boky kufra? Pozrite si rohož do kufra Premium" && st.altVidno && st.altZaKosikom, "riadok pod košíkom „" + st.alt + "“ (vidno " + st.altVidno + ", za košíkom " + st.altZaKosikom + ")");
        j.over(st.altHref === cesta(pr.url), "odkaz na Premium " + st.altHref + " ≠ " + cesta(pr.url));
        info.push("pod košíkom -> " + pr.id);
      } else j.over(!st.alt, "Premium nemá mať riadok pod košíkom: " + st.alt);
      j.over(!st.benefit && !st.upsale, "živé bannery stĺpca majú byť skryté: benefit " + st.benefit + ", upsale " + st.upsale);
      j.over(st.menaVNovych === 0, "nové prvky obsahujú polia s name (" + st.menaVNovych + ")");
      j.over(!st.chyby.length, "window.__lcd1v.chyby: " + st.chyby.join("; "));
      // auto + farba: hlavná fotka galérie sa pri farbe nemení (pravidlo Michal 7. 10.)
      const foto = await t.ev(FOTO);
      j.over(foto, "hlavná fotka galérie sa nenašla (.p-image-wrapper img)");
      await ovl.kroky.vyberAuto(t, j.AUTO);
      const f1 = await ovl.kroky.vyberFarbu(t, { index: 1 });
      await j.pauza(1500);
      const foto2 = await t.ev(FOTO);
      j.over(foto2 === foto, "hlavná fotka sa po farbe " + f1 + " zmenila: " + foto + " -> " + foto2);
      j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
      info.push("farba " + f1 + ": hlavná fotka bez zmeny, POST 0");
      return { info: info.join("; ") };
    },
  },

  "vzor-auto": {
    typy: ["kufor-classic", "kufor-premium"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.kroky !== "novy") return { preskoc: "len nový vzhľad (?novy=1 / --vyvoj)" };
      const t = s.t, P = a.produkt;
      const cielVzor = P.vzor === "hexa" ? "diamond" : "hexa";
      const C = profil(P.typ, cielVzor);
      await j.otvor(s, a.url, { novy: true });
      const model = await ovl.kroky.vyberAuto(t, j.AUTO);
      const { otvorKartu } = await import("./ovladac-kroky.mjs");
      const sel = await otvorKartu(t, "vzor");
      await t.klikni(`${sel} .patterns-wrap > .lcd1v-vzor-${cielVzor}`, { popis: "dlaždica " + cielVzor });
      await t.cakaj(`location.pathname === ${JSON.stringify(cesta(C.url))}`, { ms: 25000, popis: "prechod na " + C.id + " " + cesta(C.url) });
      await t.cakaj(j.TYPY_TEST[C.typ].pripravene, { ms: 30000, popis: "konfigurátor " + C.id });
      await j.pauza(1500);
      t.zabudni();
      const st = await t.ev(`(function () {
        var f = document.getElementById("product-detail-form"), w = f.querySelector(".modl-selector-wrap");
        // obnovené auto (main.js initModelSelect) je možnosť vložená na index 0 BEZ .notselect -> platný výber
        function hod(c) { var s = w && w.querySelector("." + c + " select"); var o = s && s.selectedIndex > -1 && s.options[s.selectedIndex]; return o && !o.classList.contains("notselect") && s.value ? o.text.trim() : ""; }
        var ss = {}; ["Brand", "Model", "Year", "carType", "model"].forEach(function (k) { try { ss[k] = sessionStorage.getItem(k); } catch (e) {} });
        var k = document.querySelector(".lcd1v-kompat");
        return { trieda: document.body.classList.contains("lcd-1v"), typ: document.body.getAttribute("data-lcd1v-typ"), vzor: document.body.getAttribute("data-lcd1v-vzor"),
          pid: String((window.__lcd1v || {}).productId || ""), polia: [hod("brands"), hod("models"), hod("years"), hod("type-selector")], ss: ss,
          kompat: !!(k && !k.hidden && k.offsetHeight > 0), kompatTx: k ? k.textContent.replace(/\\s+/g, " ").trim() : "",
          autoHotovy: !!f.querySelector(".lcd1v-k-auto.lcd1v-hotovy"), chyby: window.__lcd1v ? window.__lcd1v.chyby : null };
      })()`);
      j.over(st.trieda && st.typ === C.typ && st.vzor === cielVzor && st.pid === String(C.id), "po prechode na " + C.id + " nový vzhľad nebeží: " + JSON.stringify(st));
      j.over(JSON.stringify(st.polia) === JSON.stringify([j.AUTO.znacka, j.AUTO.model, j.AUTO.rok, j.AUTO.typ]), "auto po prechode na " + C.id + ": polia " + JSON.stringify(st.polia) + " (sessionStorage " + JSON.stringify(st.ss) + ")");
      j.over(st.ss.model === model, "sessionStorage.model po prechode " + st.ss.model + " ≠ " + model);
      // Zobrazenie auta v novom vzhľade po prechode: obnovené auto (main.js) je možnosť na indexe 0 bez .notselect,
      // ktorú jadro kroky.js (prazdnePole: selectedIndex <= 0) berie ako prázdne pole -> karta auta „Vyberte značku“,
      // bez pásu kompatibility, hoci živá validácia aj POST auto majú. Chyba JADRA (hlásené z T2.2) — kým ju vydanie
      // neopraví, len upozornenie; po oprave prepnúť JADRO_AUTO_OPRAVENE na true (tvrdá kontrola).
      const zobrazene = st.kompat && st.autoHotovy;
      if (JADRO_AUTO_OPRAVENE) j.over(zobrazene, "po prechode: pás kompatibility " + st.kompat + " / karta auta hotová " + st.autoHotovy);
      else if (!zobrazene) s.upozornenia.push("JADRO kroky.js prazdnePole: po prechode na " + C.id + " sú polia auta vyplnené (" + st.polia.join(" ") + "), ale nový vzhľad ich ukazuje ako prázdne (pás kompatibility " + st.kompat + ", karta auta hotová " + st.autoHotovy + ")");
      j.over(st.chyby && !st.chyby.length, "window.__lcd1v.chyby na " + C.id + ": " + JSON.stringify(st.chyby));
      // košík sesterskej rohože: farba (ako scenár platne) -> POST = baseline sesterského produktu
      s.produkt = C; // overCenu: odporúčaná podľa profilu sesterského produktu
      const farba = await ovl.kroky.vyberFarbu(t, { index: 2 });
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba });
      j.over(post.pole.productId === String(C.id) && post.pole.priceId === C.platne.priceId, "POST po prechode: productId " + post.pole.productId + " priceId " + post.pole.priceId + " ≠ " + C.id + " / " + C.platne.priceId);
      const c = await j.overCenu(s, ovl, cena);
      j.over(cena.spolu === C.platne.spolu, "cena " + cena.spolu + " ≠ " + C.platne.spolu);
      return { info: `${P.id} -> ${C.id} dlaždicou: auto ostalo (${st.polia.join(" ")}), nový vzhľad beží, POST priceId ${post.pole.priceId}, cena ${c.videne}`, post: post.body };
    },
  },
};
