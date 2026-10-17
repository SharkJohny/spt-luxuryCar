// Nový konfigurátor 1V — rohože do kufra Classic a Premium (619–634): názov rohože len vizuálne, cena pod dlaždicami
// vzoru, podnadpis kroku 1 s cenami vzorov, banner setu pod cenou (set-banner.js, návrh C 17. 10. 2026; tlačidlo
// predvyberie rohož na jednovrstvových cez prenos.js) a (Classic) odkaz na rohož Premium pod košíkom.
// VLASTNÍK: worker kufor (T2.2) (+ typy/kufor-classic.js, typy/kufor-premium.js, assets/css/_lcd1v-kufor.scss,
// tools/test-1v/scenare-kufor.mjs, assets/img/1v/rohoz-classic-*, set-banner-autokoberce-*).
//
// Čo robí jadro a tu sa neopakuje: obal 3 kariet vzor → auto → farba, texty kariet (typy/<typ>.js), posledný krok
// „Pokračujte k súhrnu“ bez košíka (kroky.js zachytí živý finish-button), cenová karta „cena za rohož na mieru“ bez
// riadku odporúčanej, keď ju živý web nemá (625; cena.js), košík len ctx.doKosika() (cena.js).
// Auto bez volantu, miest a dverí: živé prvky ostávajú v DOM, skrýva ich CSS typu (_lcd1v-kufor.scss).
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
import { cenaProduktu, priplatkyTypu, moznostiZMapy } from "./ceny-ine.js";
import { najdiProdukt } from "./produkty.js";
import { postavBanner } from "./set-banner.js";
import { zapisVyber } from "./prenos.js";

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
  setTimeout(function () {
    if (!zapnute()) { zrus(); return; }
    nazov();
    ceny();
    alt();
    // index.js zloží body.lcd-1v, ak zlyhal iný modul; aj neskôr (napr. ručný ?novy=0 v tej istej karte nie je, ale
    // poistka je lacná) -> sledovať triedu body a upratať
    const mo = new MutationObserver(function () { if (!zapnute()) { zrus(); mo.disconnect(); } });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }, 0);

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

  // ---------------------------------------------------------------- ceny vzorov, podnadpis, banner setu
  function ceny() {
    const vlastna = cenaProduktu(location.pathname);
    // ceny všetkých troch vzorov tohto typu (vlastná stránka bez siete)
    const sesterske = VZORY.map(function (v) {
      const z = najdiProdukt(ctx.projectId, P.typ, v);
      return z && z.vzor === v ? cenaProduktu(z.url) : Promise.resolve(null);
    });
    Promise.all([vlastna].concat(sesterske)).then(function (r) {
      const own = r[0];
      const cenyVzorov = {};
      VZORY.forEach((v, i) => { cenyVzorov[v] = r[i + 1]; });
      dlazdice(own, cenyVzorov);
      podnadpis(cenyVzorov);
    }).catch(function () { /* bez cien: dlaždice bez ceny, bez podnadpisu */ });
    Promise.all([vlastna, priplatkyTypu(ctx.projectId, "jedno", P.vzor)]).then(function (r) {
      pasSetu(r[0], r[1]);
    }).catch(function () { /* bez príplatku: banner sa neukáže */ });
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
    // zhrnutie v hlavičke kroku 1 ako v návrhoch: Classic „Diamond Line · 230 €“, Premium „Diamond Line“ / „Stripe Line · + 10 €“
    const vz = T.vzory && T.vzory[P.vzor];
    if (!vz) return;
    let z = vz;
    if (T.dlazdica === "cena") z = vz + " · " + suma(own);
    else if (zaklad > 0 && own - zaklad > 0) z = vz + " · +" + NBSP + suma(own - zaklad);
    nastavAttr(krok, "data-lcd1v-vyber", z);
    ctx.vysli("zmena", { kluc: "vzor", hodnota: P.vzor, cesta: "kufor-produkt" }); // kroky.js prepíše zhrnutie hneď
  }

  function podnadpis(cenyVzorov) {
    const krok = ctx.krok("vzor");
    const text = podnadpisVzoru(cenyVzorov, T);
    if (!krok || !text || krok.querySelector(":scope > .lcd1v-pod")) return;
    const p = el("p", "lcd1v-pod lcd1v-kf-pod", text);
    const hd = krok.querySelector(":scope > .lcd1v-hd");
    vloz(krok, p, hd ? hd.nextSibling : krok.firstChild);
  }

  function pasSetu(own, mapa) {
    const S = T.set;
    const jedno = najdiProdukt(ctx.projectId, "jedno", P.vzor);
    if (!S || !jedno || !(own > 0) || !mapa) return;
    const moznosti = moznostiZMapy(mapa, "kufor");
    const o = S.rohoz === "premium"
      ? moznosti.find((x) => /bok/i.test(x.text))
      : moznosti.find((x) => /dno/i.test(x.text) && !/bok/i.test(x.text));
    if (!o || !(o.cena > 0)) return;
    const us = Math.round((own - o.cena) * 100) / 100;
    const kam = stlpec.querySelector(":scope > .lcd1v-postup") || form.querySelector(".lcd1v-postup");
    // banner setu C (set-banner.js): „Rohož do kufra Premium len za 239 €“, „keď ju kúpite spolu s autokobercami pod
    // sedadlá“, „Samostatne 340 €“ (= cena tejto stránky), „Ušetríte 101 €“ — nikdy „+ 239 €“ (Michal 17. 10. 2026)
    const og = document.querySelector('meta[property="og:image"]');
    const banner = postavBanner(S, {
      cena: suma(o.cena),
      samostatne: own > o.cena ? suma(own) : null,
      usetrite: us > 0 ? suma(us) : null,
      href: jedno.url,
      pip: (og && og.content) || null,
      obrazok: ctx.obrazok,
    });
    banner.setAttribute("data-lcd1v-set", String(o.cena));
    // Predvýber rohože na jednovrstvových (prenos.js): obyčajný klik zapíše kľúč { kufor: ID voľby z cieľovej stránky },
    // prijímač ho tam zapíše cez ctx.zapis (klik na živú kartu kufra = POST ako ručný výber, test kufor-set-prenos).
    // Nová karta / okno (Ctrl, Shift, Cmd, stredné tlačidlo) = len odkaz, kľúč sa nepíše.
    const tl = banner.querySelector("a.lcd1v-bs__tl");
    tl.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      zapisVyber(ctx.productId, jedno.id, { kufor: o.hodnota });
    });
    // medzi cenu (a pás kompatibility) a postup „Vaša rohož do kufra v 3 krokoch“ (rovnaký order ako postup, pred ním v DOM)
    if (kam && kam.parentNode) vloz(kam.parentNode, banner, kam);
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
