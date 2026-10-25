// Nový konfigurátor 1V — box do kufra 616. VLASTNÍK: worker boxy (T3.2) (+ typy/boxy.js, assets/css/_lcd1v-boxy.scss,
// tools/test-1v/ovladac-boxy-produkt.mjs novy, tools/test-1v/scenare-boxy.mjs, assets/img/1v/boxprodukt-*).
// Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md §5.
//
// JEDNA karta „Vaše boxy do kufra“ (Michal 23. 10. 2026: „všetko na jednom mieste“, nič sa neotvára). Karta = živý krok
// Farba (produkty.js TYPY.boxy.kroky ["farba"]; hlavičku a „Pokračujte k súhrnu“ robí kroky.js). Modul do nej vloží
// (všetko bez name a bez živých tried .option-button/.options-wrap/… — tie čítajú lcdStepFilled a kroky.js):
//   - nadpis „Farba boxov — platí pre všetky boxy“ nad živými vzorkami, pod nimi „Vybraná farba: Čierna koža, béžové
//     šitie“ (kroky.js popisFarby, text zo živého selectu; Michal 19. 10. 2026) a náhľad materiálu so štítkom
//     „Diamond Line“ (fotka podľa názvu farby, hlavná fotka produktu sa nemení; od 25. 10. 2026 štvorec max 320 px
//     v strede ako na autokobercoch, nie pás — Michal: „aby sa náhľad tej vzorky taktiež zobrazoval normálne“);
//   - „Počet boxov“: kompaktný segment [1 box][2 boxy][3 boxy] s cenou „od“ -> ctx.zapis("pocetKs", n) = živé tlačidlo
//     „N ks“ (živý kód vyprázdni veľkosti nad počtom: kľúč v POST chýba ako pri starom vzhľade; ctx vráti zvolený 1. box,
//     ktorý živé „1 ks“ zmaže). Pri štarte 1 box (živý web má predvolené „2 ks“);
//   - pre každý box v počte „Veľkosť N. boxu“: 4 karty s kresbou boxu (návrh B „Realistický pohľad zhora“, Michal
//     18. 10. 2026; box-kresba.js, vo vybranej farbe) -> ctx.zapis("box1|2|3", v); ceny kariet z ctx.moznosti
//     (1. box = cena variantu + príplatok, 2. a 3. box = príplatok);
//   - na telefóne riadok „Spolu“ = kópia súhrnu pod kartou (cena.js .lcd1v-suhrn), žiadny vlastný výpočet.
// Živé kroky Počet a Veľkosť ostávajú v DOM ako nosiče POST (data-lcd1v-bxp-skryte -> skryté CSS).
// Košík: farba + veľkosť KAŽDÉHO boxu v počte. Živá validácia pozná len „aspoň jedna veľkosť“ -> pravidlo kroku Farba
// (ctx.pravidloKroku: farba + všetky veľkosti, aj košík) a stráž na window capture: neúplný výber pri „Pokračujte
// k súhrnu“ aj pri každom button.add-to-cart-button zastaví (POST 0), kartu nechá otvorenú s červeným rámom,
// data-lcd1v-chyba-cast="farba|velkost" ukáže vetu pri chýbajúcej sekcii a posunie k nej, len keď ju nevidno. Úplný
// výber ide ďalej (komplet-ponuka.js otvorí ponuku setu, inak kroky.js súhrn / živé tlačidlo košíka). Poistka: ak živý
// kód otvorí skrytý krok Počet alebo Veľkosť, hneď sa zavrie a otvorí sa karta.
// Suma „od“ pri neúplných veľkostiach a popis lepivej lišty idú cez háčiky cena.js (ctx.hacik "cena:od", "cena:lista").
// Hlavička: vizuálny názov „Luxusný box do kufra Diamond Line“ (živý H1 ostáva v DOM, CSS ho len vizuálne skryje).
// Ponuka setu s autokobercami (komplet-ponuka.js) je samostatná karta hneď pod touto kartou.
// Nič natvrdo: ID parametrov, ceny ani hodnoty volieb. Nové prvky bez name. Text H1 sa nemení.
import { nazovFarby, popisFarby } from "./kroky.js";
import { definicieKresby, kresba, nastavFarbuKresby } from "./box-kresba.js";
import { vyskaHlavicky, plynulo } from "./posun.js";

export const MENO = "boxy-produkt";

const KLUCE = ["box1", "box2", "box3"];

const bezDiakritiky = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (s) => bezDiakritiky(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function el(tag, attrs, deti) {
  const e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    const v = attrs[k];
    if (v == null || v === false) return;
    if (k === "text") e.textContent = v;
    else if (k === "class") e.className = v;
    else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, String(v));
  });
  (deti || []).forEach(function (d) {
    if (d == null) return;
    e.appendChild(typeof d === "string" ? document.createTextNode(d) : d);
  });
  return e;
}
function nastavAttr(e, meno, hodnota) {
  if (!e) return;
  if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
  else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
}
function nastavText(e, t) {
  if (e && e.textContent !== t) e.textContent = t;
}

/** „S : 33x32x30 cm“ / „L: 54x32x30 cm“ -> { v: "S", sirka: 33, rozmer: "33 × 32 × 30 cm" }; iný tvar -> { v: text }. */
export function velkostZTextu(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const m = /^(XXL|XL|[SML])\b\s*:?\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i.exec(t);
  if (!m) return { v: t, sirka: null, rozmer: "" };
  return { v: m[1].toUpperCase(), sirka: Number(m[2].replace(",", ".")), rozmer: m[2] + " × " + m[3] + " × " + m[4] + " cm" };
}

// ---------------------------------------------------------------- kresba boxu (veľkosti)
// Návrh B „Realistický pohľad zhora“ (Michal 18. 10. 2026) je v box-kresba.js (spoločná s oknom boxov na autokobercoch,
// kufor-boxy.js); farby kože, šitia a lemu = CSS premenné --bxp-* na .lcd1v-bxp-velk (obnov() podľa vybranej farby,
// box-kresba.js FARBY_KRESBY); vzory sú v jednom <defs> vnútri .lcd1v-bxp-velk, aby premenné zdedili.

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const T = ctx.texty("boxyProdukt");
  const S = T.sekcie || {};
  const CH = T.chyby || {};
  const form = ctx.form();
  const kPocet = ctx.krok("pocet"), kFarba = ctx.krok("farba"), kVelk = ctx.krok("velkost");
  if (!form || !kPocet || !kFarba || !kVelk) throw new Error("chýba krok počtu, farby alebo veľkosti boxu");
  const tlacidlaPoctu = () => kPocet.querySelectorAll(".amount-wrap > .amount-button");
  const boxy = KLUCE.filter((k) => ctx.parameter(k));
  const maxKs = Math.min(tlacidlaPoctu().length, boxy.length);
  if (!maxKs) throw new Error("chýbajú tlačidlá počtu alebo veľkosti boxov");

  const vlozene = []; // vlastné prvky (pri návrate na starý vzhľad sa odstránia)
  const odhlas = []; // poslucháči a observery
  let zruseny = false;
  const zapnute = () => !zruseny && document.body.classList.contains("lcd-1v");
  function vloz(rodic, e, pred) {
    rodic.insertBefore(e, pred && pred.parentNode === rodic ? pred : null);
    vlozene.push(e);
    return e;
  }
  const textF = (x, ...arg) => (typeof x === "function" ? x(...arg) : x || "");

  // ---------------------------------------------------------------- stav zo živého formulára
  /** Počet boxov = aktívne živé tlačidlo „N ks“ (1 … maxKs). */
  function pocet() {
    const t = tlacidlaPoctu();
    for (let i = 0; i < t.length; i++) if (t[i].classList.contains("active")) return Math.max(1, Math.min(i + 1, maxKs));
    return 1;
  }
  const zvolene = (kluc) => { const v = ctx.precitaj(kluc); return v && v !== "0" ? v : ""; };
  /** Je zvolená farba? (živé pravidlo kroku Farba = aktívna vzorka) */
  const farbaHotova = () => !!ctx.vyplnenyZivo(kFarba);
  /** Index prvého boxu v počte bez veľkosti, alebo -1. */
  function prvyBezVelkosti(n) {
    const k = n || pocet();
    for (let i = 0; i < k; i++) if (!zvolene(boxy[i])) return i;
    return -1;
  }
  /** Má každý box v počte veľkosť? */
  const velkostiHotove = (n) => prvyBezVelkosti(n) < 0;
  const cenaVariantu = () => { const c = ctx.cena(); return c && c.zaklad > 0 ? c.zaklad : 0; };
  const minCena = (kluc) => ctx.moznosti(kluc).reduce((m, o) => (m == null || o.cena < m ? o.cena : m), null) || 0;

  try {
    // ---------------------------------------------------------------- živé kroky Počet a Veľkosť = len nosiče POST
    nastavAttr(kPocet, "data-lcd1v-bxp-skryte", "1");
    nastavAttr(kVelk, "data-lcd1v-bxp-skryte", "1");

    // ---------------------------------------------------------------- farba: nadpis nad vzorkami, veta pri chybe
    const ow = kFarba.querySelector(":scope > .options-wrap");
    const nadpFarba = el("p", { class: "lcd1v-bxp-nadp lcd1v-bxp-nadp--farba" }, [el("span", { class: "lcd1v-bxp-nadp-t", text: S.farba || "" }), S.farbaEm ? el("em", { text: S.farbaEm }) : null]);
    vloz(kFarba, nadpFarba, ow);
    const chybaFarba = el("p", { class: "lcd1v-bxp-chyba lcd1v-bxp-chyba--farba", role: "alert", text: CH.farba || "" });
    vloz(kFarba, chybaFarba, ow ? ow.nextSibling : null);

    // ---------------------------------------------------------------- počet: kompaktný segment (Michal 23. 10. 2026)
    // [1 box][2 boxy][3 boxy], pod názvom cena „od“ (1. box variant + najlacnejší príplatok, každý ďalší + najlacnejší
    // príplatok); zvolený = zelený rám + fajka
    const kartyPoctu = [];
    const volby = el("div", { class: "lcd1v-bxp-ksz", role: "group", "aria-label": T.skupinaPocet || null });
    for (let n = 1; n <= maxKs; n++) {
      const d = (T.pocet && T.pocet[n]) || { nm: n + "× box" };
      const cn = el("b", { class: "lcd1v-bxp-od" });
      const b = el("button", { type: "button", class: "lcd1v-bxp-ks", "data-ks": n, "aria-pressed": "false" }, [
        el("span", { class: "lcd1v-bxp-ks-nm", text: d.nm }),
        cn,
      ]);
      b.addEventListener("click", function (e) {
        e.preventDefault();
        vyberPocet(n);
      });
      volby.appendChild(b);
      kartyPoctu.push({ n, b, cn });
    }
    const pocty = el("div", { class: "lcd1v-bxp-pocty", "data-ks": "" }, [el("p", { class: "lcd1v-bxp-nadp lcd1v-bxp-nadp--pocet" }, [el("span", { class: "lcd1v-bxp-nadp-t", text: S.pocet || "" })]), volby]);
    vloz(kFarba, pocty, kFarba.querySelector(":scope > .next-step-button"));

    // ---------------------------------------------------------------- veľkosti s kresbou boxu (návrh B, 18. 10. 2026)
    const velk = el("div", { class: "lcd1v-bxp-velk" }, [definicieKresby()]);
    const skupiny = boxy.slice(0, maxKs).map(function (kluc, i) {
      const karty = ctx.moznosti(kluc).map(function (o) {
        const v = velkostZTextu(o.text);
        const cn = el("span", { class: "lcd1v-bxp-vk-c" });
        const b = el("button", { type: "button", class: "lcd1v-bxp-vk", "data-hodnota": o.hodnota, "aria-pressed": "false", "aria-label": (T.box ? T.box(i + 1) : i + 1 + ". box") + ": " + v.v + (v.rozmer ? ", " + v.rozmer : "") }, [
          kresba(v.sirka),
          el("span", { class: "lcd1v-bxp-vk-l", text: v.v }),
          v.rozmer ? el("span", { class: "lcd1v-bxp-vk-d", text: v.rozmer }) : null,
          cn,
        ]);
        b.addEventListener("click", function (e) {
          e.preventDefault();
          vyberVelkost(kluc, o.hodnota);
        });
        return { b, cn, o, v };
      });
      const nadpT = el("span", { class: "lcd1v-bxp-nadp-t" });
      const nadpEm = el("em", { text: T.vyberteVelkost || "" });
      const chyba = el("p", { class: "lcd1v-bxp-chyba", role: "alert" });
      const g = el("div", { class: "lcd1v-bxp-vgrp", "data-box": i + 1, role: "group", "aria-label": T.box ? T.box(i + 1) : null, hidden: i > 0 }, [
        el("p", { class: "lcd1v-bxp-nadp" }, [nadpT, nadpEm]),
        el("div", { class: "lcd1v-bxp-vcards" }, karty.map((x) => x.b)),
        chyba,
      ]);
      velk.appendChild(g);
      return { kluc, i, g, karty, nadpT, nadpEm, chyba };
    });
    if (T.tip) velk.appendChild(el("p", { class: "lcd1v-bxp-tip" }, [el("b", { text: T.tipB || "" }), T.tip]));
    vloz(kFarba, velk, kFarba.querySelector(":scope > .next-step-button"));

    // ---------------------------------------------------------------- náhľad materiálu vo farbe boxu
    // rovnaké triedy ako náhľad kroky.js (.lcd1v-nahlad) -> rovnaký vzhľad ako na autokobercoch (štvorec max 320 px
    // v strede, štítok nad fotkou; Michal 25. 10. 2026); .lcd1v-bxp-nahlad len odlíši vlastný náhľad od toho z kroky.js
    const nahladNm = el("b", { class: "lcd1v-nahlad-nm" });
    const nahladImg = el("img", { class: "lcd1v-nahlad-img", alt: "", width: 400, height: 400, decoding: "async" });
    const nahlad = el("div", { class: "lcd1v-nahlad lcd1v-bxp-nahlad", hidden: true }, [nahladNm, nahladImg]);
    vloz(kFarba, nahlad, ow ? ow.nextSibling : null);
    // vybraná farba slovami tesne pod vzorkami (pred náhľadom; bez voľby skrytá) — rovnaké ako v okne boxov na autokobercoch
    const farbaNazov = el("b", { class: "lcd1v-bxp-farba-nm" });
    const farbaPopis = el("p", { class: "lcd1v-bxp-farba-popis", "aria-live": "polite", hidden: true }, [el("span", { class: "lcd1v-bxp-farba-l", text: T.vybranaFarba || "" }), " ", farbaNazov]);
    vloz(kFarba, farbaPopis, nahlad);

    // ---------------------------------------------------------------- telefón: „Spolu“ v karte = kópia súhrnu (cena.js)
    // label a suma z .lcd1v-suhrn, „od“ z ceny nad krokmi (.lcd1v-cena__od, kým výber nie je úplný); nič sa nepočíta
    const spoluLb = el("span", { class: "lcd1v-bxp-spolu-lb", text: T.spolu || "" });
    const spoluOd = el("i", { class: "lcd1v-bxp-spolu-od", hidden: true });
    const spoluSuma = el("b", { class: "lcd1v-bxp-spolu-suma" });
    const spolu = el("div", { class: "lcd1v-bxp-spolu", "aria-hidden": "true", hidden: true }, [spoluLb, el("span", { class: "lcd1v-bxp-spolu-c" }, [spoluOd, spoluSuma])]);
    vloz(kFarba, spolu, kFarba.querySelector(":scope > .next-step-button"));
    function kopirujSuhrn() {
      if (zruseny) return;
      const sh = document.querySelector(".lcd1v-suhrn");
      if (!sh) return;
      const lb = sh.querySelector(".lcd1v-suhrn__lb"), su = sh.querySelector(".lcd1v-suhrn__suma");
      const od = document.querySelector(".lcd1v-cena .lcd1v-cena__od");
      const tSu = su ? su.textContent : "";
      nastavText(spoluLb, lb ? lb.textContent : T.spolu || "");
      nastavText(spoluSuma, tSu);
      const odVid = !!(od && !od.hidden && od.textContent.trim());
      if (odVid) nastavText(spoluOd, od.textContent.trim() + " ");
      if (spoluOd.hidden === odVid) spoluOd.hidden = !odVid;
      const ma = !!tSu.trim();
      if (spolu.hidden === ma) spolu.hidden = !ma;
    }
    const moSuhrn = new MutationObserver(kopirujSuhrn);
    odhlas.push(() => moSuhrn.disconnect());
    ctx.ked(() => (zruseny ? null : document.querySelector(".lcd1v-suhrn")), function (sh) {
      if (zruseny) return;
      moSuhrn.observe(sh, { childList: true, characterData: true, subtree: true });
      const od = document.querySelector(".lcd1v-cena .lcd1v-cena__od");
      if (od) moSuhrn.observe(od, { attributes: true, attributeFilter: ["hidden"], childList: true, characterData: true, subtree: true });
      kopirujSuhrn();
    }, { limit: 15000 });

    // ---------------------------------------------------------------- otváranie: len karta (skryté živé kroky nikdy)
    function otvorKrok(krok) {
      const otvor = window.__lcdSetStepOpen;
      ctx.kroky().forEach(function (s) {
        if (s !== krok && s.classList.contains("active")) { if (typeof otvor === "function") otvor(s, false); else s.classList.remove("active"); }
      });
      if (!krok.classList.contains("active")) { if (typeof otvor === "function") otvor(krok, true); else krok.classList.add("active"); }
    }

    // ---------------------------------------------------------------- obnova (číta živý DOM, píše len do nových prvkov)
    function obnov() {
      if (!zapnute()) { zrus(); return; }
      // poistka: živý kód (validácia, akordeón) otvoril skrytý krok -> zavrieť ho a otvoriť kartu
      if (kPocet.classList.contains("active") || kVelk.classList.contains("active")) otvorKrok(kFarba);
      const n = pocet();
      const zaklad = cenaVariantu();
      // segment počtu: zvolený + „od“ (1. box variant + najlacnejší príplatok, každý ďalší + najlacnejší príplatok)
      let od = zaklad;
      kartyPoctu.forEach(function (k) {
        od += minCena(boxy[k.n - 1]);
        nastavText(k.cn, (T.od ? T.od + " " : "") + ctx.formatCena(od));
        nastavAttr(k.b, "aria-pressed", k.n === n ? "true" : "false");
      });
      nastavAttr(pocty, "data-ks", n);
      // veľkosti: skupiny v počte, nadpisy podľa počtu, zvolená karta, ceny kariet
      const pismena = [];
      skupiny.forEach(function (s) {
        const vidno = s.i < n;
        if (s.g.hidden === vidno) s.g.hidden = !vidno;
        const v = zvolene(s.kluc);
        nastavText(s.nadpT, textF(S.velkost, s.i + 1, n) || (T.box ? T.box(s.i + 1) : ""));
        if (s.nadpEm.hidden !== !!v) s.nadpEm.hidden = !!v;
        nastavText(s.chyba, textF(CH.velkost, s.i + 1, n));
        s.karty.forEach(function (x) {
          nastavAttr(x.b, "aria-pressed", x.o.hodnota === v ? "true" : "false");
          nastavText(x.cn, ctx.formatCena((s.i === 0 ? zaklad : 0) + x.o.cena));
          if (vidno && x.o.hodnota === v) pismena.push(x.v.v);
        });
      });
      const hotove = velkostiHotove(n);
      // zhrnutie zbalenej karty (kroky.js ho číta z data-lcd1v-vyber): „Čierna / béžové šitie · 2 boxy · S + L“
      const a = kFarba.querySelector(":scope > .options-wrap > .option-button.active");
      const tx = a && a.querySelector(".text");
      const nazov = a ? a.getAttribute("data-lcd1v-nazov") || nazovFarby(tx ? tx.textContent : a.textContent).nazov : "";
      const tp = (T.pocet && T.pocet[n]) || {};
      // pevné medzery: „S + L“ sa nelámu a riadok nezačína bodkou (kontrola vzhľadu 23. 10. 2026, telefón 360/390 px)
      nastavAttr(kFarba, "data-lcd1v-vyber", a ? [nazov, tp.vy || n + " ×"].concat(hotove && pismena.length ? [pismena.join("\u00a0+\u00a0")] : []).join("\u00a0· ") : null);
      // chyba: červený rám karty (kroky.js lcd1v-chyba / živé lcd-needs-fill) -> veta pri chýbajúcej sekcii
      const farbaOk = farbaHotova();
      const cervena = (kFarba.classList.contains("lcd1v-chyba") || kFarba.classList.contains("lcd-needs-fill")) && !(farbaOk && hotove);
      nastavAttr(kFarba, "data-lcd1v-chyba-cast", cervena ? (!farbaOk ? "farba" : "velkost") : null);
      const iChyba = cervena && farbaOk ? prvyBezVelkosti(n) : -1;
      skupiny.forEach((s) => nastavAttr(s.g, "data-lcd1v-chyba", s.i === iChyba ? "1" : null));
      // vybraná farba slovami: zo živého selectu farby (zdroj pravdy pre košík), bez voľby skrytá
      const fv = ctx.precitaj("farba");
      const fo = fv ? ctx.moznosti("farba").find((o) => o.hodnota === fv) : null;
      const popis = fo ? popisFarby(fo.text) : "";
      if (popis) nastavText(farbaNazov, popis);
      if (farbaPopis.hidden !== !popis) farbaPopis.hidden = !popis;
      // náhľad farby: fotka materiálu podľa názvu farby, inak živá vzorka; kresba boxov vo vybranej farbe
      // (box-kresba.js FARBY_KRESBY, kľúč = názov bez diakritiky; bez farby / neznáma = predvolená čierna, béžové šitie)
      if (a) {
        const im = a.querySelector("img");
        const src = ctx.obrazokVzoru("boxprodukt-farba-" + slug(nazov)) || (im && im.getAttribute("src")) || "";
        // farbu slovami ukazuje riadok „Vybraná farba: …“ hneď nad náhľadom -> štítok náhľadu len rad (bez farby dvakrát)
        nastavText(nahladNm, T.nahlad || nazov);
        nastavFarbuKresby(velk, slug(nazov));
        if (src && nahladImg.getAttribute("src") !== src) nahladImg.setAttribute("src", src);
        nahladImg.alt = nazov;
        if (nahlad.hidden !== !src) nahlad.hidden = !src;
      } else {
        if (!nahlad.hidden) nahlad.hidden = true;
        nastavFarbuKresby(velk, null);
      }
    }

    // ---------------------------------------------------------------- voľby (len ctx.zapis)
    function vyberPocet(n) {
      ctx.zapis("pocetKs", n); // živé „N ks“ (resetBoxSizeOptions + prepočet); ctx vráti zvolený 1. box
      obnov();
    }
    function vyberVelkost(kluc, hodnota) {
      ctx.zapis(kluc, hodnota);
      obnov();
    }

    // ---------------------------------------------------------------- pravidlo košíka: farba + veľkosť každého boxu
    // háčik jadra (ctx.pravidloKroku): krok Farba (= karta) je vyplnený až s veľkosťou každého boxu v počte (aj košík)
    odhlas.push(ctx.pravidloKroku(kFarba, () => !zapnute() || velkostiHotove()));

    // ---------------------------------------------------------------- cena a lišta (háčiky cena.js)
    // kým nie sú veľkosti všetkých boxov v počte, suma „od“ = variant + pre každý box zvolená alebo najlacnejšia veľkosť
    // (živý súčet by pri 2 boxoch bez veľkostí ukázal cenu 1 boxu)
    odhlas.push(ctx.hacik("cena:od", function () {
      if (!zapnute()) return null;
      const n = pocet();
      if (velkostiHotove(n)) return null;
      let suma = cenaVariantu();
      if (!(suma > 0)) return null;
      for (let i = 0; i < n; i++) {
        const v = zvolene(boxy[i]);
        const o = v ? ctx.moznosti(boxy[i]).find((x) => x.hodnota === v) : null;
        suma += o ? o.cena : minCena(boxy[i]);
      }
      return suma;
    }));
    // popis lišty (návrh boxy.html): „Box do kufra ×2 · S + L · <farba>“
    odhlas.push(ctx.hacik("cena:lista", function (info) {
      if (!zapnute() || !T.lista) return undefined;
      const n = pocet();
      const casti = [T.lista + (n > 1 ? " ×" + n : "")];
      if (velkostiHotove(n)) {
        const v = [];
        for (let i = 0; i < n; i++) {
          const o = ctx.moznosti(boxy[i]).find((x) => x.hodnota === zvolene(boxy[i]));
          if (o) v.push(velkostZTextu(o.text).v);
        }
        if (v.length) casti.push(v.join(" + "));
      }
      if (info && info.farba) casti.push(info.farba.toLowerCase());
      return casti.join(" · ");
    }));

    // ---------------------------------------------------------------- stráž: neúplný výber nikam
    /** Posun na prvok, len keď nie je celý na obrazovke (pod hlavičkou webu). Chyba výberu — nie posun do stredu po
     *  dokončení kroku (ten robí kroky.js / komplet-ponuka.js cez posun.js); spoločná je len výška hlavičky. */
    function ukaz(e) {
      if (!e || !e.isConnected) return;
      const r = e.getBoundingClientRect();
      const hH = vyskaHlavicky();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top >= hH && r.bottom <= vh) return;
      window.scrollTo({ top: Math.max(0, Math.round(r.top + window.pageYOffset - hH - 12)), behavior: plynulo() ? "smooth" : "auto" });
    }
    /** Červený rám karty ako živá validácia (lcd-needs-fill na 3 s -> kroky.js z neho urobí trvalý rám), veta pri sekcii
     *  `cast` ("farba" alebo index boxu bez veľkosti) a posun k nej, keď ju nevidno. */
    function zvyrazni(cast) {
      const bolaZatvorena = !kFarba.classList.contains("active");
      otvorKrok(kFarba);
      kFarba.classList.add("lcd-needs-fill", "selection-required");
      setTimeout(function () { kFarba.classList.remove("lcd-needs-fill", "selection-required"); }, 3000);
      obnov();
      const ciel = cast !== "farba" && skupiny[cast] ? skupiny[cast].g : nadpFarba;
      setTimeout(() => ukaz(ciel), 30);
      if (bolaZatvorena) setTimeout(() => ukaz(ciel), 380); // otvorenie karty mení výšku (prechod ~300 ms)
    }
    // capture na window: pred komplet-ponuka.js (window, registruje sa neskôr), kroky.js (document) aj živými handlermi
    function straz(e) {
      if (!zapnute()) return;
      const t = e.target;
      if (!t || !t.closest) return;
      const dalej = t.closest(".next-step-button");
      const kos = t.closest("button.add-to-cart-button");
      if (!(dalej && dalej.parentNode === kFarba) && !kos) return;
      const farbaOk = farbaHotova();
      if (farbaOk && velkostiHotove()) return; // úplný výber: ponuka setu / súhrn / živý košík
      e.preventDefault();
      e.stopImmediatePropagation();
      zvyrazni(!farbaOk ? "farba" : prvyBezVelkosti());
    }
    window.addEventListener("click", straz, true);
    odhlas.push(() => window.removeEventListener("click", straz, true));

    // ---------------------------------------------------------------- hlavička (po cena.js: hodnotenie a cena už stoja)
    function hlavicka() {
      if (!zapnute()) { zrus(); return; }
      const ziva = ctx.krok("cena");
      const stlpec = ziva && ziva.closest(".p-info-wrapper");
      const hl = stlpec && stlpec.querySelector(".p-detail-inner-header");
      const h1 = hl && hl.querySelector("h1");
      if (h1 && T.nazov && !hl.querySelector(".lcd1v-bxp-nazov")) {
        vloz(h1.parentNode, el("div", { class: "lcd1v-bxp-nazov", "aria-hidden": "true" }, [T.nazov + " ", T.rad ? el("em", { text: T.rad }) : null]), h1.nextSibling);
      }
    }

    // ---------------------------------------------------------------- spustenie
    // Živý web má predvolené „2 ks“; návrh začína 1 boxom (len pri nedotknutom formulári: žiadna veľkosť zvolená).
    if (pocet() !== 1 && !boxy.some((k) => zvolene(k))) ctx.zapis("pocetKs", 1);
    // karta otvorená vždy (jediná karta; živý kód mohol otvoriť skrytý krok)
    otvorKrok(kFarba);
    obnov();

    // zmeny: zápis cez ctx, selecty (jQuery .trigger("change") nevyšle natívny change), triedy živých ovládačov, variant
    odhlas.push(ctx.na("zmena", obnov));
    const $ = window.jQuery || window.$;
    const naZmenu = function () { obnov(); };
    if ($) { $(form).on("change", "select", naZmenu); odhlas.push(() => $(form).off("change", "select", naZmenu)); }
    form.addEventListener("change", naZmenu, true);
    odhlas.push(() => form.removeEventListener("change", naZmenu, true));
    const naCenu = function () { setTimeout(obnov, 60); };
    document.addEventListener("LuxuryCarPriceRecalculated", naZmenu);
    document.addEventListener("ShoptetVariantChange", naCenu);
    odhlas.push(() => { document.removeEventListener("LuxuryCarPriceRecalculated", naZmenu); document.removeEventListener("ShoptetVariantChange", naCenu); });
    // triedy kariet (akordeón, validácia — aj poistka pri otvorení skrytého kroku) a živých ovládačov
    const mo = new MutationObserver(obnov);
    [kPocet, kFarba, kVelk].forEach((k) => mo.observe(k, { attributes: true, attributeFilter: ["class"] }));
    [kPocet.querySelector(".amount-wrap"), ow, kVelk.querySelector(":scope > .options-wrap")]
      .filter(Boolean).forEach((w) => mo.observe(w, { attributes: true, attributeFilter: ["class"], subtree: true }));
    odhlas.push(() => mo.disconnect());
    // index.js zloží body.lcd-1v synchrónne po init všetkých modulov, ak niektorý zlyhal -> späť na starý vzhľad
    setTimeout(hlavicka, 0);
  } catch (e) {
    zrus();
    throw e;
  }

  /** Návrat na starý vzhľad: vlastné prvky a atribúty preč, ctx a poslucháči späť (živý DOM sa nemenil). */
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    odhlas.forEach((f) => { try { f(); } catch (x) { /* nič */ } });
    vlozene.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    nastavAttr(kPocet, "data-lcd1v-bxp-skryte", null);
    nastavAttr(kVelk, "data-lcd1v-bxp-skryte", null);
    nastavAttr(kFarba, "data-lcd1v-vyber", null);
    nastavAttr(kFarba, "data-lcd1v-chyba-cast", null);
  }
}
