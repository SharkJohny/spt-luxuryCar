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
//                  Banner setu C (Michal 17. 10. 2026, set-banner.js): „Rohož do kufra … len za X €“ + „keď ju kúpite
//                  spolu s autokobercami pod sedadlá“ + „Samostatne Y €“ + „Ušetríte Z €“, nikde „+ X €“; fotka pozadia
//                  set-banner-autokoberce-480/800.jpg (lenivo, srcset, každá ≤ 80 kB), malá fotka = og:image produktu,
//                  zelené tlačidlo na jednovrstvové toho istého vzoru. Stuha „Zľava −X %“ cez pravý horný roh
//                  (X = round((samostatne − v sete) / samostatne × 100) z tých istých nezávislých čísel), text celý,
//                  neprekryje cenu, tlačidlo ani štítky; bunky „Samostatne / Ušetríte“ pod cenou, čísla ≥ 20 px
//                  (set-banner-kontrola.mjs, pri každej šírke).
//   kufor-set-prenos – zelené tlačidlo banneru (skutočný klik) -> jednovrstvové toho istého vzoru s PREDVYBRANOU rohožou
//                  (Classic = dno, Premium = dno + boky; prenos.js): select, živá karta aj karta nového vzhľadu; úplný výber
//                  (auto, farba, rozloženie) -> POST; potom tá istá stránka nanovo a rohož RUČNE kartou -> POST musí byť
//                  rovnaký (kľúč po prenose ostáva „prijatý“, druhá návšteva nič nepreberá).
//   vzor-auto    – auto vybrané na rohoži ostane po prechode dlaždicou vzoru na sesterskú rohož (619 -> 622 …), nový
//                  vzhľad tam beží ďalej a košík pošle platný POST sesterského produktu (priceId z plan.md §4).
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUKTY } from "./produkty.mjs";
import { stavStuhy, overStuhu, percentoZlavy } from "./set-banner-kontrola.mjs";

const IMG_1V = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "assets", "img", "1v");
const FOTKA_BANNERA = ["set-banner-autokoberce-480.jpg", "set-banner-autokoberce-800.jpg"];
const KLUC_PRENOSU = "lcd1vPrenos:v1";

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
      await t.cakaj(`!!document.querySelector("#product-detail-form .lcd1v-bs") && document.querySelectorAll("#product-detail-form .lcd1v-k-vzor .banner-header[data-lcd1v-cena]").length === 3`,
        { ms: 15000, popis: "banner setu a ceny dlaždíc vzoru (GET sesterských stránok)" });
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
        var set = f.querySelector(".lcd1v-bs"), alt = f.querySelector(".lcd1v-kf-alt");
        var setA = set && set.querySelector("a.lcd1v-bs__tl");
        function tx(q) { var e = set && set.querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
        var bg = set && set.querySelector("img.lcd1v-bs__bg"), pip = set && set.querySelector(".lcd1v-bs__pip img"), og = document.querySelector('meta[property="og:image"]');
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
          set: set ? set.textContent.replace(/\\s+/g, " ").trim() : null, setVidno: vid(set), setHref: setA ? setA.getAttribute("href") : null,
          setPredPostupom: !!(set && set.nextElementSibling && set.nextElementSibling.classList.contains("lcd1v-postup")),
          starePasy: f.querySelectorAll(".lcd1v-kf-set").length,
          bs: set ? { ey: tx(".lcd1v-bs__ey"), h: tx(".lcd1v-bs__h"), c: tx(".lcd1v-bs__c"), kd: tx(".lcd1v-bs__kd"), s: tx(".lcd1v-bs__s"), sCiara: tx(".lcd1v-bs__s s"),
            u: tx(".lcd1v-bs__u"), tag: tx(".lcd1v-bs__tag"), pip: tx(".lcd1v-bs__pip i"), tl: tx("a.lcd1v-bs__tl"), attr: set.getAttribute("data-lcd1v-set"),
            poradie: Array.prototype.map.call(set.querySelectorAll(".lcd1v-bs__row > *"), function (e) { return e.className; }).join(","),
            tlPozadie: setA ? getComputedStyle(setA).backgroundImage : "", bgLoading: bg ? bg.getAttribute("loading") : null, bgSrcset: bg ? bg.getAttribute("srcset") : "",
            pipSrc: pip ? pip.getAttribute("src") : null, og: og ? og.content : null, pipLoading: pip ? pip.getAttribute("loading") : null,
            sirka: Math.round(set.getBoundingClientRect().width), pretek: set.scrollWidth > set.clientWidth + 1 } : null,
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
      // 3 kroky bez volantu, miest a dverí
      j.over(JSON.stringify(st.kroky) === JSON.stringify(["vzor", "auto", "farba"]), "kroky " + JSON.stringify(st.kroky) + " ≠ vzor, auto, farba");
      j.over(st.ey[0] === "Krok 1 z 3" && st.ey[2] === "Krok 3 z 3", "číslovanie kariet " + JSON.stringify(st.ey));
      j.over(!st.volant && !st.miesta && !st.dvere, "krok auta má byť bez volantu, miest a dverí: " + JSON.stringify({ volant: st.volant, miesta: st.miesta, dvere: st.dvere }));
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
      // pás setu: príplatok voľby kufra zo živej stránky jednovrstvových toho istého vzoru (nezávislý GET + parsovanie)
      const jedno = profil("jedno", P.vzor);
      const setCena = await t.ev(`(async function (url, premium) {
        var html = await fetch(url, { credentials: "same-origin" }).then(function (r) { return r.text(); });
        var d = new DOMParser().parseFromString(html, "text/html");
        var s = Array.prototype.find.call(d.querySelectorAll("#product-detail-form select[data-parameter-name]"), function (x) { return /do\\s+kufr/i.test(x.getAttribute("data-parameter-name")); });
        if (!s) return null;
        var o = Array.prototype.find.call(s.options, function (o) { var tx = o.textContent; return o.value && (premium ? /bok/i.test(tx) : /dno/i.test(tx) && !/bok/i.test(tx)); });
        return o ? Number(o.getAttribute("data-surcharge-final-price")) || Number(o.getAttribute("data-surcharge-additional-price")) : null;
      })(${JSON.stringify(cesta(jedno.url))}, ${typ === "kufor-premium"})`);
      j.over(setCena > 0, "príplatok setu na " + jedno.url + " sa nedal zistiť (test)");
      const us = own - setCena;
      j.over(st.setVidno && st.setPredPostupom && st.starePasy === 0, "banner setu nie je viditeľný pod cenou pred postupom krokov (starý pás " + st.starePasy + "×)");
      const B = st.bs, rohoz = typ === "kufor-classic" ? "Classic" : "Premium";
      // texty banneru C (Michal 17. 10. 2026): cena v sete s vysvetlením, nikdy „+ X €“ (vyzerá ako príplatok k cene hore)
      j.over(cisty(B.ey) === "★ Výhodnejšie v sete" && B.h === "Rohož do kufra " + rohoz + " len za" && cisty(B.c) === eur(setCena)
        && B.kd === "keď ju kúpite spolu s autokobercami pod sedadlá", "banner: „" + B.h + " | " + B.c + " | " + B.kd + "“ ≠ „Rohož do kufra " + rohoz + " len za | " + eur(setCena) + " | keď ju kúpite spolu s autokobercami pod sedadlá“");
      j.over(cisty(B.s) === "Samostatne " + eur(own) && cisty(B.sCiara) === eur(own) && cisty(B.u) === "Ušetríte " + eur(us), "banner: „" + B.s + "“ / „" + B.u + "“ ≠ Samostatne " + eur(own) + " (prečiarknuté) / Ušetríte " + eur(us));
      j.over(B.poradie === "lcd1v-bs__c,lcd1v-bs__kd,lcd1v-bs__sb", "poradie v DOM (čítačka: cena hneď s podmienkou): " + B.poradie);
      j.over(Number(B.attr) === setCena, "data-lcd1v-set " + B.attr + " ≠ " + setCena);
      j.over(!/\+\s*\d/.test(cisty(st.set)) && !/do interiéru/.test(st.set), "banner obsahuje „+ číslo“ alebo „do interiéru“: " + st.set);
      j.over(B.tag === "Autokoberce pod sedadlá" && B.pip === "Rohož do kufra " + rohoz && B.tl === "Zostaviť set s autokobercami", "štítky / tlačidlo banneru: " + JSON.stringify([B.tag, B.pip, B.tl]));
      j.over(/29,\s*107,\s*74/.test(B.tlPozadie), "tlačidlo banneru nie je zelené: " + B.tlPozadie);
      j.over(B.pipSrc && B.pipSrc === B.og, "malá fotka produktu " + B.pipSrc + " ≠ og:image " + B.og);
      j.over(B.bgLoading === "lazy" && B.pipLoading === "lazy" && FOTKA_BANNERA.every((x) => B.bgSrcset.includes("/img/1v/" + x)), "fotky banneru: loading " + B.bgLoading + "/" + B.pipLoading + ", srcset " + B.bgSrcset);
      j.over(!B.pretek, "banner preteká (" + B.sirka + " px)");
      const velkosti = FOTKA_BANNERA.map((x) => statSync(join(IMG_1V, x)).size);
      j.over(velkosti.every((v) => v <= 82000), "fotky pozadia banneru majú byť ≤ 80 kB: " + velkosti.join(" / ") + " B");
      // lenivá fotka sa načíta, keď je banner na obrazovke
      await t.ev(`document.querySelector("#product-detail-form .lcd1v-bs").scrollIntoView({ block: "center", behavior: "instant" })`);
      await t.cakaj(`Array.prototype.every.call(document.querySelectorAll("#product-detail-form .lcd1v-bs img"), function (i) { return i.complete && i.naturalWidth > 0; })`, { ms: 15000, popis: "fotky banneru setu" });
      const bgSrc = await t.ev(`document.querySelector("#product-detail-form .lcd1v-bs__bg").currentSrc`);
      j.over(/\/img\/1v\/set-banner-autokoberce-(480|800)\.jpg$/.test(bgSrc), "fotka pozadia banneru: " + bgSrc);
      // stuha „Zľava −X %“ (Michal 17. 10. 2026) a väčšie bunky pod cenou — percento z nezávislých čísel testu
      const pct = percentoZlavy(own, setCena);
      const G = await t.ev(stavStuhy("#product-detail-form .lcd1v-bs"));
      overStuhu(j, G, { percento: pct, popis: "round((" + own + " − " + setCena + ") / " + own + " × 100)" });
      j.over(st.setHref === cesta(jedno.url), "odkaz setu " + st.setHref + " ≠ jednovrstvové " + cesta(jedno.url));
      info.push("banner: len za " + setCena + " € s autokobercami pod sedadlá, samostatne " + own + " €, ušetríte " + us + " €, stuha „" + G.stuha + "“ (" + G.px + " px, bez prekrytia) -> " + jedno.id + " (" + bgSrc.split("/").pop() + ")");
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

  "kufor-set-prenos": {
    typy: ["kufor-classic", "kufor-premium"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.kroky !== "novy") return { preskoc: "len nový vzhľad (?novy=1 / --vyvoj)" };
      const t = s.t, P = a.produkt, druh = P.typ === "kufor-premium" ? "premium" : "classic";
      const J = profil("jedno", P.vzor);
      j.over(J, "jednovrstvové vzoru " + P.vzor + " nie sú v profiloch");
      await j.otvor(s, a.url, { novy: true });
      await t.cakaj(`!!document.querySelector("#product-detail-form .lcd1v-bs a.lcd1v-bs__tl")`, { ms: 15000, popis: "banner setu (GET jednovrstvových)" });
      // očakávaná voľba kufra NEZÁVISLE: GET živej stránky jednovrstvových, select „do kufru“ (Classic = dno, Premium = boky)
      const kuforOcak = await t.ev(`(async function (url, premium) {
        var html = await fetch(url, { credentials: "same-origin" }).then(function (r) { return r.text(); });
        var d = new DOMParser().parseFromString(html, "text/html");
        var s = Array.prototype.find.call(d.querySelectorAll("#product-detail-form select[data-parameter-name]"), function (x) { return /do\\s+kufr/i.test(x.getAttribute("data-parameter-name")); });
        var o = s && Array.prototype.find.call(s.options, function (o) { var tx = o.textContent; return o.value && (premium ? /bok/i.test(tx) : /dno/i.test(tx) && !/bok/i.test(tx)); });
        return o ? o.value : null;
      })(${JSON.stringify(cesta(J.url))}, ${druh === "premium"})`);
      j.over(kuforOcak, "voľba kufra " + druh + " na " + J.url + " sa nedala zistiť (test)");
      // skutočný klik myšou na zelené tlačidlo
      await t.klikni("#product-detail-form .lcd1v-bs a.lcd1v-bs__tl", { popis: "zelené tlačidlo banneru setu" });
      await t.cakaj(`location.pathname === ${JSON.stringify(cesta(J.url))}`, { ms: 40000, popis: "prechod na jednovrstvové " + J.id });
      t.zabudni();
      s.produkt = J;
      try {
        await t.cakaj(j.TYPY_TEST.jedno.pripravene, { ms: 40000, popis: "postavený konfigurátor " + J.id });
        await t.cakaj(`document.body.classList.contains("lcd-1v") && document.body.getAttribute("data-lcd1v-typ") === "jedno" && !!window.__lcd1v`, { ms: 30000, popis: "nový vzhľad na " + J.id });
        const idK = await t.idParametra("kufor");
        await t.cakaj(`(document.querySelector('#product-detail-form select[data-parameter-id="${idK}"]') || {}).value === ${JSON.stringify(kuforOcak)}`, { ms: 20000, popis: "predvybraná rohož " + druh + " (" + kuforOcak + ")" });
        await j.pauza(2300); // prenos.js dorovnáva otvorený krok do 2 s
        const st = await t.ev(`(function () {
          var f = document.getElementById("product-detail-form"), k = null;
          try { k = JSON.parse(sessionStorage.getItem(${JSON.stringify(KLUC_PRENOSU)}) || "null"); } catch (e) {}
          var p = f.querySelector('.upsale-buttons.trunk .lcd1v-kb__karta[aria-pressed="true"]');
          return { karta: !!f.querySelector(".upsale-buttons.trunk > .parameter-cars > .upsale-button.active"), press: p ? p.getAttribute("data-kufor") : "",
            kluc: k, chyby: window.__lcd1v ? window.__lcd1v.chyby.slice() : ["window.__lcd1v chýba"] };
        })()`);
        j.over(st.karta && st.press === druh, "rohož na " + J.id + ": živá karta " + st.karta + ", karta nového vzhľadu „" + st.press + "“ (má " + druh + ")");
        j.over(st.kluc && st.kluc.z === P.id && st.kluc.na === J.id && st.kluc.prijate > 0 && JSON.stringify(st.kluc.vyber) === JSON.stringify({ kufor: kuforOcak }),
          "kľúč prenosu " + JSON.stringify(st.kluc) + " ≠ { z: " + P.id + ", na: " + J.id + ", vyber: { kufor: " + kuforOcak + " }, prijate }");
        j.over(!st.chyby.length, "window.__lcd1v.chyby na " + J.id + ": " + st.chyby.join("; "));
        // formulár cieľa (kľúče POST) — j.otvor tu nebežal
        s.formKluce = await t.ev(`(function () {
          var f = document.getElementById("product-detail-form"), k = ["productId", "priceId", "language", "amount"], volitelne = [];
          Array.prototype.forEach.call(f.querySelectorAll("select[name]"), function (s) { k.push(s.name); });
          Array.prototype.forEach.call(f.querySelectorAll(".content-wrap input[type=radio][name^='parameter-']"), function (r) { if (volitelne.indexOf(r.name) < 0) volitelne.push(r.name); });
          return { povinne: k.sort(), volitelne: volitelne, priceIdZaklad: (f.querySelector("input[name=priceId]") || {}).value || "" };
        })()`);
        // úplný výber bez dotyku kroku kufra -> POST
        const z1 = await j.zaklad(s, ovl);
        await ovl.cena.pridajDoKosika(t);
        const post1 = await j.cakajNaPost(s);
        const cena1 = await j.overPost(s, post1, { ...z1.ocak, kufor: kuforOcak });
        const c1 = await j.overCenu(s, ovl, cena1);
        // ručný výber: tá istá stránka nanovo (kľúč je prijatý -> nič sa nepreberie), rohož kartou v kroku kufra
        s.posty.length = 0;
        await j.otvor(s, J.url, { novy: true });
        const pred = await t.ev(`(document.querySelector('#product-detail-form select[data-parameter-id="${idK}"]') || {}).value || ""`);
        j.over(pred !== kuforOcak, "pri druhej návšteve " + J.id + " je rohož znova predvybraná (" + pred + ") — kľúč sa mal prijať len raz");
        const z2 = await j.zaklad(s, ovl);
        const kufor2 = await ovl.kuforBoxy.vyberKufor(t, druh);
        j.over(kufor2 === kuforOcak, "ručná voľba " + druh + " = " + kufor2 + " ≠ " + kuforOcak);
        await ovl.cena.pridajDoKosika(t);
        const post2 = await j.cakajNaPost(s);
        await j.overPost(s, post2, { ...z2.ocak, kufor: kufor2 });
        const p1 = post1.pole, p2 = post2.pole, rozdiel = [];
        new Set([...Object.keys(p1), ...Object.keys(p2)]).forEach((k) => { if (p1[k] !== p2[k]) rozdiel.push(k + ": prenos " + p1[k] + " / ručne " + p2[k]); });
        j.over(!rozdiel.length, "POST po prenose ≠ POST pri ručnom výbere: " + rozdiel.join("; "));
        return { info: `${P.id} -> ${J.id}: rohož ${druh} (${kuforOcak}) predvybraná, karta stlačená; POST = ručný výber (${Object.keys(p1).length} polí), ${c1.videne} €`, post: post1.body, spolu: cena1.spolu };
      } finally {
        s.produkt = P;
      }
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
