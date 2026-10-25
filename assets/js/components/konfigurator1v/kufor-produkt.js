// Nový konfigurátor 1V — rohože do kufra Classic a Premium (619–634): názov rohože len vizuálne, cena pod dlaždicami
// vzoru, podnadpis kroku 1 s cenami vzorov a (Classic) odkaz na rohož Premium pod košíkom. Ponuka setu s autokobercami
// (banner C) je LEN v skrytom medzikroku komplet-ponuka.js (Michal 17. 10. 2026: „nie ďalší iný banner“).
// VLASTNÍK: worker kufor (T2.2) (+ typy/kufor-classic.js, typy/kufor-premium.js, assets/css/_lcd1v-kufor.scss,
// tools/test-1v/scenare-kufor.mjs, assets/img/1v/rohoz-classic-*).
//
// Čo robí jadro a tu sa neopakuje: obal 3 kariet vzor → auto → farba, texty kariet (typy/<typ>.js), posledný krok
// „Pokračujte k súhrnu“ bez košíka (kroky.js zachytí živý finish-button), cenová karta „cena za rohož na mieru“ bez
// riadku odporúčanej, keď ju živý web nemá (625; cena.js), košík len ctx.doKosika() (cena.js).
// Auto bez volantu (počet miest a dverí áno, Michal 23. 10. 2026): živý volant ostáva v DOM, skrýva ho CSS typu (_lcd1v-kufor.scss).
//
// Pravidlá (docs/1v-kontrakt.md §5, §11; plan.md §2.3–2.5):
//  - nič sa nezapisuje do formulára (rohož má len farbu, tú volí kroky.js cez živé tlačidlá); žiadne prvky s name;
//  - živý DOM sa nemaže ani neprepisuje: H1 ostáva v DOM s pôvodným textom (SEO, živý kód číta $("h1").text()),
//    len sa vizuálne skryje (CSS) a nad hodnotením sa ukáže nový názov (aria-hidden — čítačka číta živý H1);
//  - ceny NIKDY natvrdo: ceny vzorov = [itemprop=price] sesterských stránok rohože toho istého typu, príplatok setu
//    = voľba kufra (dno / dno + boky) na jednovrstvovom produkte toho istého vzoru — všetko cez ceny-ine.js (GET
//    stránky, localStorage 24 h). Odkazy z registra (produkty.js najdiProdukt). Keď sa číslo nedá zistiť, prvok
//    s číslom sa neukáže (žiadne vymyslené čísla).
//  - hlavná fotka galérie sa pri farbe nemení (tento modul na galériu nesiaha);
//  - všetky prvky vznikajú až po init ostatných modulov (setTimeout 0) a len kým má body triedu lcd-1v; keď ju
//    index.js zloží (zlyhal iný modul), prvky sa odstránia (inak by ostali na stránke bez štýlov).
import { cenaProduktu } from "./ceny-ine.js";
import { najdiProdukt } from "./produkty.js";
import { poNecinnosti } from "./susedne.js";

export const MENO = "kufor-produkt";

/** Vzory v poradí dlaždíc a vo vetách („Stripe Line a Hexa Line“). */
const VZORY = ["diamond", "stripe", "hexa"];
const NBSP = " ";

/** 129 -> „129 €“, 129.5 -> „129,50 €“ (NBSP pred €; ako ceny v obsahu, plan.md §2.4). */
export function suma(n) {
  const x = Math.round(Number(n) * 100) / 100;
  const t = Number.isInteger(x) ? String(x) : x.toFixed(2).replace(".", ",");
  return t.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + NBSP + "€";
}

/** Cena pod dlaždicou vzoru (Premium): rozdiel cien (vzor − základný vzor) -> „v cene“ | „+ 10 €“ | „− 10 €“ | null (nezistené). */
export function textRozdielu(rozdiel, vCene) {
  if (rozdiel == null || !Number.isFinite(rozdiel)) return null;
  const r = Math.round(rozdiel * 100) / 100;
  if (r === 0) return vCene;
  return (r > 0 ? "+" : "−") + NBSP + suma(Math.abs(r));
}

/**
 * Podnadpis kroku 1 z cien vzorov { diamond, stripe, hexa } (všetky čísla zo živých stránok):
 *  - všetky rovnaké -> T.vzorPodRovnako,
 *  - jeden najlacnejší a ostatné o rovnakú sumu drahšie -> T.vzorPod(„Diamond Line“, [„Stripe Line“, „Hexa Line“], „10 €“),
 *  - čokoľvek iné alebo chýbajúca cena -> null (veta sa neukáže; netvrdiť nič, čo ceny nepotvrdia).
 */
export function podnadpisVzoru(ceny, T) {
  const v = VZORY.filter((k) => T.vzory && T.vzory[k]);
  if (!v.length || v.some((k) => !(Number(ceny[k]) > 0))) return null;
  const min = Math.min.apply(null, v.map((k) => ceny[k]));
  const lacne = v.filter((k) => ceny[k] === min);
  const drahe = v.filter((k) => ceny[k] !== min);
  if (!drahe.length) return T.vzorPodRovnako || null;
  if (lacne.length !== 1 || typeof T.vzorPod !== "function") return null;
  const rozdiel = ceny[drahe[0]] - min;
  if (drahe.some((k) => ceny[k] - min !== rozdiel)) return null;
  return T.vzorPod(T.vzory[lacne[0]], drahe.map((k) => T.vzory[k]), suma(rozdiel));
}

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const P = ctx.produkt;
  if (!P || !/^kufor-/.test(P.typ)) throw new Error("kufor-produkt: produkt nie je rohož do kufra (" + (P && P.typ) + ")");
  const T = ctx.texty("kuforProdukt");
  if (!T || !T.nazov) throw new Error("kufor-produkt: chýbajú texty typu " + P.typ + " (typy/" + P.typ + ".js kuforProdukt)");
  const form = ctx.form();
  const stlpec = form && form.querySelector(".p-info-wrapper");
  if (!stlpec) throw new Error("kufor-produkt: chýba .p-info-wrapper");

  const vlozene = [];
  const atributy = []; // [prvok, meno] — pri návrate na starý vzhľad sa zmažú
  const zapnute = () => document.body.classList.contains("lcd-1v");
  let zruseny = false;
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    vlozene.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    atributy.forEach(([e, m]) => e.removeAttribute(m));
  }
  /** Vloží prvok (len kým je nový vzhľad zapnutý). */
  function vloz(rodic, prvok, pred) {
    if (zruseny || !zapnute() || !rodic) return false;
    rodic.insertBefore(prvok, pred || null);
    vlozene.push(prvok);
    return true;
  }
  function nastavAttr(e, meno, hodnota) {
    if (!e || zruseny || !zapnute()) return;
    if (e.getAttribute(meno) !== hodnota) e.setAttribute(meno, hodnota);
    atributy.push([e, meno]);
  }

  // Ostatné moduly (cena: štítok typu pred H1 a hodnotenie za H1) bežia synchrónne PO tomto init -> prvky až potom.
  // Úloha H (25. 10. 2026): mikroúloha, nie setTimeout 0 — dobehne hneď po init všetkých modulov, ešte pred prvým
  // vykreslením 1V. Pri setTimeout medzi tým prešiel snímok a hlavička (názov rohože −26…+2 px) aj odkaz pod košíkom
  // (+45 px) sa pridali až po ňom: stĺpec zmenil výšku po prvom snímku a obsah pod ním (už vložený) sa posunul.
  (typeof queueMicrotask === "function" ? queueMicrotask : function (fn) { Promise.resolve().then(fn); })(function () {
    if (!zapnute()) { zrus(); return; }
    nazov();
    ceny();
    alt();
    // index.js zloží body.lcd-1v, ak zlyhal iný modul; aj neskôr (napr. ručný ?novy=0 v tej istej karte nie je, ale
    // poistka je lacná) -> sledovať triedu body a upratať
    const mo = new MutationObserver(function () { if (!zapnute()) { zrus(); mo.disconnect(); } });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  });

  // ---------------------------------------------------------------- názov rohože (len vizuálne)
  function nazov() {
    const hlavicka = stlpec.querySelector(".p-detail-inner-header");
    const h1 = hlavicka && hlavicka.querySelector("h1");
    if (!h1 || hlavicka.querySelector(".lcd1v-kf-nazov")) return;
    const n = el("p", "lcd1v-kf-nazov");
    n.setAttribute("aria-hidden", "true"); // čítačka a vyhľadávač čítajú živý H1 (ostáva v DOM)
    n.appendChild(document.createTextNode(T.nazov + " "));
    const vz = T.vzory && T.vzory[P.vzor];
    if (vz) n.appendChild(el("em", "lcd1v-kf-nazov__vzor", vz));
    // hneď za H1 (pred hodnotenie z cena.js); H1 sa skryje CSS-om až vtedy, keď nový názov existuje
    if (vloz(h1.parentNode, n, h1.nextSibling)) nastavAttr(document.body, "data-lcd1v-kf-nazov", "1");
  }

  // ---------------------------------------------------------------- ceny vzorov, podnadpis
  // Michal 25. 10. 2026 (rýchlosť): sesterské stránky sa sťahujú až po vykreslení konfigurátora (nečinnosť, najneskôr
  // 1,5 s; ceny-ine.js s nízkou prioritou) — inak by pri štarte brali sieť a hlavné vlákno prvému vykresleniu. Krok 1
  // je pri otvorení zbalený (dlaždice a podnadpis vidno až po jeho otvorení). Kým ceny nie sú, krok nesie
  // data-lcd1v-ceny="caka" a CSS drží pod názvom vzoru prázdny riadok ceny (_lcd1v-kufor.scss): po príchode cien
  // dlaždica neposkočí a nikdy neukáže inú ako zistenú cenu. Zhrnutie hlavičky Classic („Diamond Line · 230 €“)
  // potrebuje len vlastnú cenu (aktuálny dokument, bez siete) -> hneď; Premium potrebuje základný vzor -> s cenami.
  function ceny() {
    const krok = ctx.krok("vzor");
    if (T.dlazdica === "cena") cenaProduktu(location.pathname).then(function (own) { zhrnutie(own, null); });
    if (krok) nastavAttr(krok, "data-lcd1v-ceny", "caka");
    rezervaPodnadpisu(krok);
    poNecinnosti(1500).then(function () {
      if (zruseny || !zapnute()) return null;
      const vlastna = cenaProduktu(location.pathname);
      // ceny všetkých troch vzorov tohto typu (vlastná stránka bez siete)
      const sesterske = VZORY.map(function (v) {
        const z = najdiProdukt(ctx.projectId, P.typ, v);
        return z && z.vzor === v ? cenaProduktu(z.url) : Promise.resolve(null);
      });
      return Promise.all([vlastna].concat(sesterske));
    }).then(function (r) {
      if (!r) return;
      const own = r[0];
      const cenyVzorov = {};
      VZORY.forEach((v, i) => { cenyVzorov[v] = r[i + 1]; });
      dlazdice(own, cenyVzorov);
      podnadpis(cenyVzorov);
    }).catch(function () { /* bez cien: dlaždice bez ceny, bez podnadpisu */ }).then(function () {
      if (!krok) return;
      krok.removeAttribute("data-lcd1v-ceny"); // rezervovaný riadok preč (cena je v atribúte dlaždice, alebo nezistená)
      const rez = krok.querySelector(":scope > .lcd1v-kf-pod--caka");
      if (rez && rez.parentNode) rez.parentNode.removeChild(rez); // veta nevyšla (ceny nezistené): bez podnadpisu
    });
  }

  /**
   * rýchlosť (25. 10. 2026, revízia): kým ceny nie sú, drží miesto aj podnadpis kroku 1 — ten istý odsek s vetou
   * v rovnakom tvare (T.vzorPod), len neviditeľný (visibility:hidden v _lcd1v-kufor.scss, aria-hidden) a namiesto sumy
   * medzery šírky číslic (žiadne číslo). Po príchode cien dostane skutočný text (podnadpis), keď veta nevyjde, zmizne.
   * Inak by sa pri kroku 1 otvorenom pred príchodom cien dlaždice posunuli o 2–3 riadky nadol.
   */
  function rezervaPodnadpisu(krok) {
    if (!krok || typeof T.vzorPod !== "function" || krok.querySelector(":scope > .lcd1v-pod")) return;
    const v = VZORY.filter((k) => T.vzory && T.vzory[k]);
    if (v.length < 2) return;
    const p = el("p", "lcd1v-pod lcd1v-kf-pod lcd1v-kf-pod--caka", T.vzorPod(T.vzory[v[0]], v.slice(1).map((k) => T.vzory[k]), "\u2007\u2007" + NBSP + "€"));
    p.setAttribute("aria-hidden", "true");
    const hd = krok.querySelector(":scope > .lcd1v-hd");
    vloz(krok, p, hd ? hd.nextSibling : krok.firstChild);
  }

  /** Zhrnutie v hlavičke kroku 1 ako v návrhoch: Classic „Diamond Line · 230 €“, Premium „Diamond Line“ / „Stripe Line · + 10 €“. */
  function zhrnutie(own, zaklad) {
    const krok = ctx.krok("vzor");
    const vz = T.vzory && T.vzory[P.vzor];
    if (!krok || !(own > 0) || !vz) return;
    let z = vz;
    if (T.dlazdica === "cena") z = vz + " · " + suma(own);
    else if (zaklad > 0 && own - zaklad > 0) z = vz + " · +" + NBSP + suma(own - zaklad);
    nastavAttr(krok, "data-lcd1v-vyber", z);
    ctx.vysli("zmena", { kluc: "vzor", hodnota: P.vzor, cesta: "kufor-produkt" }); // kroky.js prepíše zhrnutie hneď
  }

  function dlazdice(own, cenyVzorov) {
    const krok = ctx.krok("vzor");
    if (!krok || !(own > 0)) return;
    // základný vzor = najlacnejší zo zistených cien (dnes Diamond); keď sa nič nezistilo, vlastná cena
    const zistene = VZORY.map((x) => cenyVzorov[x]).filter((c) => c > 0);
    const zaklad = zistene.length === VZORY.length ? Math.min.apply(null, zistene) : null;
    krok.querySelectorAll(".patterns-wrap > .option-button").forEach(function (a) {
      const v = VZORY.find((x) => a.classList.contains("lcd1v-vzor-" + x)); // triedu dáva kroky.js
      const hlava = a.querySelector(".banner-header");
      if (!v || !hlava) return;
      // Classic (návrh kufor-classic.html): plná cena vzoru „230 € / 240 € / 240 €“; Premium (kufor-premium.html): rozdiel oproti
      // základnému (najlacnejšiemu) vzoru „v cene / + 10 € / + 10 €“ — na všetkých troch stránkach rovnako, ako podnadpis kroku
      const t = T.dlazdica === "cena"
        ? (cenyVzorov[v] > 0 ? suma(cenyVzorov[v]) : null)
        : textRozdielu(cenyVzorov[v] > 0 && zaklad > 0 ? cenyVzorov[v] - zaklad : null, T.vCene || "");
      // text cez atribút + CSS ::after: textContent dlaždice ostáva „DIAMOND LINE“ (zhrnutie kroku a popis lišty ho čítajú)
      if (t) nastavAttr(hlava, "data-lcd1v-cena", t);
    });
    // zhrnutie Premium (rozdiel oproti základnému vzoru); Classic ho má už z ceny() (len vlastná cena)
    if (T.dlazdica !== "cena") zhrnutie(own, zaklad);
  }

  function podnadpis(cenyVzorov) {
    const krok = ctx.krok("vzor");
    const text = podnadpisVzoru(cenyVzorov, T);
    // rezervovaný odsek (rezervaPodnadpisu) dostane skutočnú vetu na tom istom mieste; bez vety ho odstráni ceny()
    const rez = krok && krok.querySelector(":scope > .lcd1v-kf-pod--caka");
    if (rez && text) {
      rez.textContent = text;
      rez.removeAttribute("aria-hidden");
      rez.classList.remove("lcd1v-kf-pod--caka");
      return;
    }
    if (!krok || !text || krok.querySelector(":scope > .lcd1v-pod")) return;
    const p = el("p", "lcd1v-pod lcd1v-kf-pod", text);
    const hd = krok.querySelector(":scope > .lcd1v-hd");
    vloz(krok, p, hd ? hd.nextSibling : krok.firstChild);
  }

  // ---------------------------------------------------------------- odkaz na druhú rohož pod košíkom (Classic)
  function alt() {
    const A = T.alt;
    if (!A || !A.typ) return;
    const z = najdiProdukt(ctx.projectId, A.typ, P.vzor);
    const kosik = ctx.krok("kosik");
    const obal = kosik && kosik.closest(".add-to-cart");
    if (!z || !obal || !obal.parentNode) return;
    const p = el("p", "lcd1v-kf-alt");
    p.appendChild(document.createTextNode(A.text + " "));
    const a = el("a", null, A.odkaz);
    a.href = z.url;
    p.appendChild(a);
    vloz(obal.parentNode, p, obal.nextSibling);
  }
}
