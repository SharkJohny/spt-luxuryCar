// Nový konfigurátor 1V — cenová karta (Odporúčaná cena, % zľava, aktuálna cena) + lepivá lišta s cenou a tlačidlom.
// JADRO od T0.1 (14. 10. 2026; mení len vydanie) + assets/css/_lcd1v-cena.scss + tools/test-1v/ovladac-cena.mjs.
// Štítok typu nad H1 a veta pri cene podľa typu produktu: ctx.texty("cena") { typ, zaSet } (typy/<typ>.js).
// Bez odporúčanej ceny (v admine chýba bežná cena: 613, 625, 616) ostane len veta „Cena za … na mieru“.
// Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md — ceny len z ctx.cena() / Shoptetu,
// košík len ctx.doKosika().
//
// Čo robí (návrh v26, hlavička produktu + „Spolu“ + lišta na telefóne):
//  - hlavička: nad H1 štítok „Jednovrstvové“, názov radu v H1 zlatý (text H1 ostáva rovnaký), pod H1 hodnotenie
//    „5,0 ★★★★★ N recenzií na Google“ z window.LCD_REVIEWS (reviews-data.js; kým nepríde, riadok je skrytý);
//  - cena „bez poľa, priamo nad krokmi“ (Michal 7. 10.): Odporúčaná cena prečiarknutá + −X % + Naša cena (od) X +
//    Ušetríte Y · cena za set na mieru. Zápis ceny ako v návrhoch „230 €“ (ctx.formatCena; Shoptet píše „€230“ len vo
//    svojich skrytých prvkoch). Všetky čísla sú ZRKADLO živej ceny .p-final-price-wrapper (livePrice.js píše
//    súčet do .price-final-holder, productPage.js odporúčanú cenu súčet × 1,6 nahor na desiatky a %). Nič sa
//    nepočíta nanovo; živý blok ostáva v DOM (len vizuálne skrytý) a jeho JS beží ďalej;
//  - „Spolu“ nad tlačidlom + živé tlačidlo „Pridať do košíka“ preštýlované; text „Dokončite výber“ / „Vložte do košíka“
//    podľa ctx.prvyNevyplneny(). Klik ostáva klikom na živé tlačidlo (validácia, červený rám, odoslanie = živý kód);
//  - telefón (do 991 px): lepivá lišta dole s tou istou cenou a tlačidlom (ctx.doKosika()), keď je konfigurátor mimo
//    obrazovky. Bublina chatu Luxia sa nad lištu zdvihne (nikdy ju neprekryje a nie je ňou prekrytá); bezpečná zóna
//    iPhonu (env(safe-area-inset-bottom)) je v CSS. Lepkavá lišta Shoptetu (#js-plugin-header) je pod 1V skrytá.
export const MENO = "cena";

const TEXTY = {
  sk: {
    typ: "Jednovrstvové",
    odporucana: "Odporúčaná cena",
    nasa: "Naša cena",
    od: "od",
    usetrite: "Ušetríte",
    zaSet: "cena za set na mieru",
    spolu: "Spolu",
    dokoncite: "Dokončite výber",
    vlozte: "Vložte do košíka",
    recenzie: ["recenzia", "recenzie", "recenzií"],
    naGoogle: "na Google",
    hodnotenie: "Hodnotenie",
    z5: "z 5",
  },
  // CZ nie je v ZOZNAM_1V (13. 10. 2026) — texty pred zapnutím na CZ overiť s Michalom
  cz: {
    typ: "Jednovrstvé",
    odporucana: "Doporučená cena",
    nasa: "Naše cena",
    od: "od",
    usetrite: "Ušetříte",
    zaSet: "cena za set na míru",
    spolu: "Celkem",
    dokoncite: "Dokončete výběr",
    vlozte: "Vložit do košíku",
    recenzie: ["recenze", "recenze", "recenzí"],
    naGoogle: "na Google",
    hodnotenie: "Hodnocení",
    z5: "z 5",
  },
};

/** Lišta len na telefóne a tablete (PC má tlačidlo v stĺpci konfigurátora; rovnaká hranica ako lišta v košíku). */
const MOBIL = "(max-width: 991px)";
/** Výška pevnej hlavičky webu na telefóne (62 px) + rezerva: konfigurátor pod ňou sa ráta ako mimo obrazovky. */
const HORE = 70;

/** Cena z textu („€269“, „1 250,00 €“, „5 664 Kč“) -> číslo (rovnaké pravidlo ako lcdParsePrice v productPage.js). */
export function cislo(text) {
  let t = String(text == null ? "" : text).replace(/[^\d.,\s]/g, "").trim().replace(/\s+/g, "");
  if (!t) return NaN;
  const d = Math.max(t.lastIndexOf(","), t.lastIndexOf("."));
  let des = "";
  if (d > -1 && t.length - d <= 3) { des = t.slice(d + 1); t = t.slice(0, d); }
  const n = Number(t.replace(/[^\d]/g, "") + (des ? "." + des : ""));
  return Number.isFinite(n) ? n : NaN;
}

/** Tvar „recenzia / recenzie / recenzií“ podľa počtu. */
function tvar(n, slova) {
  if (n === 1) return slova[0];
  if (n >= 2 && n <= 4) return slova[1];
  return slova[2];
}

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

/** Text prvku bez zalomení a dvojitých medzier. */
function text(e) {
  return e ? (e.textContent || "").replace(/\s+/g, " ").trim() : "";
}

/** Zapíše text len pri zmene (žiadne zbytočné mutácie -> žiadne slučky observerov). */
function nastav(e, t) {
  if (e && e.textContent !== t) e.textContent = t;
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  // typ produktu (štítok nad H1, veta pri cene) z typy/<typ>.js — texty typov sú len SK
  const T = Object.assign({}, TEXTY[ctx.trh] || TEXTY.sk, ctx.trh === "sk" && ctx.texty ? ctx.texty("cena") : {});
  const form = ctx.form();
  const ziva = ctx.krok("cena"); // .p-final-price-wrapper — zdroj všetkých čísel
  const kos = ctx.krok("kosik"); // živé „Pridať do košíka“
  const stlpec = ziva && ziva.closest(".p-info-wrapper");
  const doKosika = kos && kos.closest(".add-to-cart");
  if (!form || !ziva || !kos || !stlpec || !doKosika) throw new Error("chýba živá cena, tlačidlo košíka alebo .p-info-wrapper");
  const holder = () => ziva.querySelector(".price-final-holder");
  if (!holder()) throw new Error("chýba .price-final-holder");
  const body = document.body;
  const povodne = { text: kos.textContent, aria: kos.getAttribute("aria-label") };
  const vlozene = []; // prvky, ktoré pridal tento modul (pri návrate na starý vzhľad sa odstránia)
  const spat = []; // ďalšie kroky návratu (H1, observery, časovače)
  let zruseny = false;

  // ---------------------------------------------------------------- hlavička: štítok, názov radu, hodnotenie
  const hlavicka = stlpec.querySelector(".p-detail-inner-header");
  const h1 = hlavicka && hlavicka.querySelector("h1");
  let hodn = null;
  if (h1) {
    const typ = el("p", "lcd1v-typ", T.typ);
    hlavicka.insertBefore(typ, h1);
    vlozene.push(typ);
    spat.push(zvyrazniRad(h1));
    hodn = el("a", "lcd1v-hodn");
    hodn.href = "#";
    hodn.hidden = true;
    hodn.addEventListener("click", function (e) {
      e.preventDefault();
      // nový obsah pod konfigurátorom (docs/1v-obsah.md): recenzie z Google v sekcii a-recenzie; starý widget je vtedy
      // v skrytých záložkách (výška 0) -> len keď nová sekcia nie je alebo je skrytá (dáta neprišli)
      const nova = document.querySelector('.p1v-miesto [data-lcd-sekcia="a-recenzie"]');
      const w = nova && nova.getClientRects().length ? nova : document.querySelector(".lcd-reviews-widget");
      if (!w) return;
      const plynulo = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      window.scrollTo({ top: w.getBoundingClientRect().top + window.pageYOffset - 90, behavior: plynulo ? "smooth" : "auto" });
    });
    h1.parentNode.insertBefore(hodn, h1.nextSibling);
    vlozene.push(hodn);
    ctx.ked(function () {
      const p = window.LCD_REVIEWS && window.LCD_REVIEWS.place;
      return p && Number(p.rating) > 0 && Number(p.totalReviews) > 0 ? p : null;
    }, function (p) {
      if (zruseny) return;
      const r = Number(p.rating), n = Math.round(Number(p.totalReviews));
      const rt = r.toFixed(1).replace(".", ",");
      const hviezdy = Math.max(0, Math.min(5, Math.round(r)));
      hodn.textContent = "";
      hodn.appendChild(el("b", null, rt));
      const st = el("span", "lcd1v-hodn__st", "★★★★★".slice(0, hviezdy) + "☆☆☆☆☆".slice(0, 5 - hviezdy));
      st.setAttribute("aria-hidden", "true");
      hodn.appendChild(st);
      hodn.appendChild(el("i", null, n + " " + tvar(n, T.recenzie) + " " + T.naGoogle));
      hodn.setAttribute("aria-label", T.hodnotenie + " " + rt + " " + T.z5 + " – " + n + " " + tvar(n, T.recenzie) + " " + T.naGoogle);
      hodn.hidden = false;
    }, { limit: 30000 });
  }

  // ---------------------------------------------------------------- cena nad krokmi (zrkadlo živej ceny)
  const karta = el("div", "lcd1v-cena");
  const bolo = el("div", "lcd1v-cena__bolo");
  bolo.appendChild(el("div", "lcd1v-cena__stitok", T.odporucana));
  const boloV = el("div", "lcd1v-cena__v");
  const odp = el("s", "lcd1v-cena__odp");
  const zlava = el("b", "lcd1v-cena__zlava");
  boloV.appendChild(odp);
  boloV.appendChild(document.createTextNode(" "));
  boloV.appendChild(zlava);
  bolo.appendChild(boloV);
  const fig = el("div", "lcd1v-cena__fig");
  fig.appendChild(el("div", "lcd1v-cena__stitok lcd1v-cena__stitok--nasa", T.nasa));
  const teraz = el("div", "lcd1v-cena__teraz");
  const od = el("i", "lcd1v-cena__od", T.od + " ");
  const suma = el("b", "lcd1v-cena__suma");
  teraz.appendChild(od);
  teraz.appendChild(suma);
  fig.appendChild(teraz);
  const pozn = el("p", "lcd1v-cena__pozn");
  const usetrite = el("span", "lcd1v-cena__us-w");
  usetrite.appendChild(document.createTextNode(T.usetrite + " "));
  const us = el("b", "lcd1v-cena__us");
  usetrite.appendChild(us);
  const bod = el("span", "lcd1v-cena__bod", "·");
  bod.setAttribute("aria-hidden", "true");
  pozn.appendChild(usetrite);
  pozn.appendChild(bod);
  const za = el("span", "lcd1v-cena__za", T.zaSet);
  pozn.appendChild(za);
  karta.appendChild(bolo);
  karta.appendChild(fig);
  karta.appendChild(pozn);
  // za krátky popis (oba order 1 v stĺpci -> rozhoduje poradie v DOM): názov, hodnotenie, popis, cena, kroky
  const popis = stlpec.querySelector(":scope > .p-short-description");
  const pred = popis || hlavicka;
  if (pred && pred.parentNode === stlpec) stlpec.insertBefore(karta, pred.nextSibling);
  else stlpec.insertBefore(karta, stlpec.firstChild);
  vlozene.push(karta);

  // ---------------------------------------------------------------- „Spolu“ nad živým tlačidlom
  const suhrn = el("div", "lcd1v-suhrn");
  suhrn.appendChild(el("span", "lcd1v-suhrn__lb", T.spolu));
  const suhrnSuma = el("b", "lcd1v-suhrn__suma");
  suhrnSuma.setAttribute("aria-live", "polite");
  suhrnSuma.setAttribute("aria-atomic", "true");
  suhrn.appendChild(suhrnSuma);
  doKosika.parentNode.insertBefore(suhrn, doKosika);
  vlozene.push(suhrn);

  // ---------------------------------------------------------------- lepivá lišta (telefón)
  const lista = el("div", "lcd1v-lista");
  lista.id = "lcd1v-lista";
  const listaC = el("div", "lcd1v-lista__c");
  const listaSuma = el("b", "lcd1v-lista__suma");
  const listaPopis = el("small", "lcd1v-lista__popis");
  listaC.appendChild(listaSuma);
  listaC.appendChild(listaPopis);
  const listaKos = el("button", "lcd1v-lista__kos");
  listaKos.type = "button";
  listaKos.addEventListener("click", function (e) {
    e.preventDefault();
    ctx.doKosika(); // živé tlačidlo: validácia (červený rám + posun na chýbajúci krok) aj odoslanie robí živý kód
  });
  lista.appendChild(listaC);
  lista.appendChild(listaKos);
  document.body.appendChild(lista);
  vlozene.push(lista);

  // ---------------------------------------------------------------- obnova (zlúčená do jedného snímku)
  const mobil = window.matchMedia ? window.matchMedia(MOBIL) : { matches: false };
  const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn) => setTimeout(fn, 16);
  let snimok = 0, snimokListy = 0;
  function naplanuj() {
    if (snimok) return;
    snimok = raf(function () { snimok = 0; obnov(); });
  }
  // rolovanie mení len to, či je lišta zapnutá (ceny a texty nie) -> lacná obnova
  function naplanujListu() {
    if (snimokListy || snimok) return;
    snimokListy = raf(function () { snimokListy = 0; obnovListu(); });
  }

  /**
   * Popis lepivej lišty (telefón). Základ (jedno, dvoj): „Diamond Line · 1.+2. rad“. Typ ho prepíše textom
   * ctx.texty("cena").lista(info) (rohože: „Diamond Line · rohož Classic“ / „Premium · Diamond Line · <farba>“) alebo
   * modul typu háčikom ctx.hacik("cena:lista", fn(info)) (box: „Box do kufra ×2 · S + L · <farba>“).
   */
  function vzorARad() {
    const v = ctx.krok("vzor");
    const a = v && v.querySelector(".option-button.active");
    const vzor = a ? text(a).toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase()) : "";
    const r = ctx.moznosti("rozlozenie").find((o) => o.zvolena);
    const f = ctx.krok("farba");
    const fa = f && f.querySelector(".options-wrap > .option-button.active");
    const info = { vzor, rozlozenie: r ? r.text.toLowerCase() : "", farba: fa ? fa.getAttribute("data-lcd1v-nazov") || "" : "" };
    const h = ctx.hacikom("cena:lista", info);
    if (typeof h === "string") return h;
    if (typeof T.lista === "function") {
      try { const t = T.lista(info); if (typeof t === "string") return t; } catch (e) { /* základ nižšie */ }
    }
    return [info.vzor, info.rozlozenie].filter(Boolean).join(" · ");
  }

  /**
   * Návrat na starý vzhľad, keď trieda body.lcd-1v zmizne (index.js ju zloží, ak zlyhá init iného modulu — to sa stane
   * až PO init tohto modulu): bez nej by pridané prvky ostali na stránke bez štýlov. Odstráni len vlastné prvky,
   * živému tlačidlu vráti pôvodný text, H1 pôvodný textový uzol.
   */
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    vlozene.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    spat.forEach((f) => { try { if (f) f(); } catch (e) { /* nič */ } });
    if (kos.textContent !== povodne.text) kos.textContent = povodne.text;
    if (povodne.aria == null) kos.removeAttribute("aria-label");
    else kos.setAttribute("aria-label", povodne.aria);
    kos.removeAttribute("data-lcd1v-hotovo");
    body.classList.remove("lcd1v-lista-on", "lcd1v-bublina");
  }
  function zapnute() {
    if (zruseny) return false;
    if (!body.classList.contains("lcd-1v")) { zrus(); return false; }
    return true;
  }

  function obnov() {
    if (!zapnute()) return;
    // čísla zo živej ceny (to, čo zákazník zaplatí = súčet livePrice; odporúčaná a % = productPage.js)
    const std = ziva.querySelector(".price-standard");
    const odpEl = std && Array.prototype.find.call(std.querySelectorAll(":scope > span"), (s) => !s.classList.contains("price-save"));
    const zlavaEl = std && std.querySelector(".price-save");
    const terazT = text(holder());
    const odpT = text(odpEl);
    const nTeraz = cislo(terazT), nOdp = cislo(odpT), nZlava = cislo(text(zlavaEl));
    const maOdp = nOdp > 0 && nTeraz > 0 && nOdp > nTeraz;
    // „od“ a text tlačidla podľa toho istého pravidla ako validácia košíka (+ pravidlá typu, ctx.pravidloKroku)
    let hotovo = false;
    try { hotovo = ctx.prvyNevyplneny() === null; } catch (e) { hotovo = false; }
    // kým výber nie je úplný, typ môže ukázať najnižšiu možnú sumu (box 616: 2 boxy bez veľkostí = 2 × najlacnejší box,
    // živý súčet by ukázal len zvolené boxy); úplný výber = vždy živá cena
    const odTyp = hotovo ? null : ctx.hacikom("cena:od");
    // tvar návrhov „230 €“ (ctx.formatCena), nie Shoptetu „€230“: číslo je to isté, mení sa len zápis; nečitateľný text ostane ako je
    const zobraz = Number(odTyp) > 0 && Number(odTyp) > (nTeraz || 0) ? ctx.formatCena(Number(odTyp)) : nTeraz > 0 ? ctx.formatCena(nTeraz) : terazT;
    nastav(suma, zobraz);
    nastav(suhrnSuma, zobraz);
    nastav(listaSuma, zobraz);
    nastav(odp, nOdp > 0 ? ctx.formatCena(nOdp) : odpT);
    nastav(zlava, nZlava > 0 ? "−" + nZlava + " %" : "");
    zlava.hidden = !(nZlava > 0);
    bolo.hidden = !maOdp;
    nastav(us, maOdp ? ctx.formatCena(Math.round((nOdp - nTeraz) * 100) / 100) : "");
    usetrite.hidden = !maOdp;
    bod.hidden = !maOdp;
    // bez „Ušetríte …“ stojí veta sama -> veľké písmeno („Cena za rohož na mieru“, návrh kufor-classic)
    nastav(za, maOdp || !T.zaSet ? T.zaSet : T.zaSet.charAt(0).toUpperCase() + T.zaSet.slice(1));

    od.hidden = hotovo;
    const stitok = hotovo ? T.vlozte : T.dokoncite;
    nastav(kos, stitok);
    if (kos.getAttribute("aria-label") !== stitok) kos.setAttribute("aria-label", stitok);
    nastav(listaKos, stitok);
    if (kos.getAttribute("data-lcd1v-hotovo") !== String(hotovo)) kos.setAttribute("data-lcd1v-hotovo", String(hotovo));
    nastav(listaPopis, vzorARad());

    obnovListu();
  }

  // lišta: zapnutá, keď je celý stĺpec konfigurátora (od názvu po tlačidlo košíka) mimo obrazovky
  let listaOn = false;
  function obnovListu() {
    if (!zapnute()) return;
    let on = false;
    if (mobil.matches) {
      const a = stlpec.getBoundingClientRect();
      const b = doKosika.getBoundingClientRect();
      const spodok = b.height > 0 ? b.bottom : a.bottom;
      on = spodok < HORE || a.top > window.innerHeight;
    }
    if (window.__lcdAnchoring) return; // akordeón práve dorovnáva scroll (header.js robí to isté) — neprepínať
    if (on !== listaOn) {
      listaOn = on;
      lista.classList.toggle("on", on);
      document.body.classList.toggle("lcd1v-lista-on", on);
    }
    // bublina chatu Luxia (76 × 76) sa zdvihne nad lištu; otvorený chat (vyšší) sa nehýbe
    const f = document.querySelector('iframe[title="Luxia chat"]');
    const r = f && f.getBoundingClientRect();
    const bublina = !!(r && r.height > 0 && r.height <= 130);
    if (document.body.classList.contains("lcd1v-bublina") !== bublina) document.body.classList.toggle("lcd1v-bublina", bublina);
  }

  // každá zápis živej ceny (livePrice, productPage, Shoptet pri zmene variantu) -> hneď zrkadlo
  const mo1 = new MutationObserver(naplanuj);
  mo1.observe(ziva, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["data-price"] });
  // voľby (triedy aktívnych ovládačov, selecty auta) -> „od“, text tlačidla, popis lišty
  const mo2 = new MutationObserver(naplanuj);
  mo2.observe(form, { subtree: true, attributes: true, attributeFilter: ["class"] });
  spat.push(() => { mo1.disconnect(); mo2.disconnect(); });
  form.addEventListener("change", naplanuj, true);
  form.addEventListener("click", function () { naplanuj(); setTimeout(naplanuj, 400); }, true);
  document.addEventListener("LuxuryCarPriceRecalculated", naplanuj);
  document.addEventListener("ShoptetVariantChange", function () { setTimeout(naplanuj, 80); });
  ctx.na("zmena", naplanuj);
  window.addEventListener("scroll", naplanujListu, { passive: true });
  window.addEventListener("resize", naplanujListu);
  if (mobil.addEventListener) mobil.addEventListener("change", naplanuj);
  // bublina Luxie sa načíta neskoro (widget tretej strany) a mení veľkosť (uvítanie, otvorený chat)
  const interval = setInterval(function () { if (zapnute() && listaOn) obnovListu(); }, 1000);
  spat.push(() => clearInterval(interval));
  obnov();
  // index.js zloží body.lcd-1v synchrónne po init všetkých modulov, ak niektorý zlyhal -> hneď späť na starý vzhľad
  setTimeout(zapnute, 0);
  // odporúčanú cenu productPage.js prepočíta 600 a 1500 ms po štarte (observer to zachytí; poistka pre istotu)
  setTimeout(naplanuj, 700);
  setTimeout(naplanuj, 1700);
}

/**
 * Názov radu na konci H1 („… DIAMOND LINE“) do <em> — text H1 (aj pre SEO a živý kód) ostáva presne rovnaký.
 * Názov materiálu v H1 („Dragonskin Basic“ / „Dragonskin Elite“) dostane <span class="lcd1v-mat">, ktorý CSS pod
 * body.lcd-1v skryje: návrhy jednovrstvove.html aj dvojvrstvove.html majú „Luxusné autokoberce Diamond Line“ a názvy
 * DragonSkin/Elite/Basic do nového vzhľadu nepatria (rozhodnutia.md). textContent H1 sa nemení.
 */
function zvyrazniRad(h1) {
  if (h1.querySelector(".lcd1v-rad")) return null;
  const uzol = Array.prototype.find.call(h1.childNodes, (n) => n.nodeType === 3 && /\S/.test(n.nodeValue));
  if (!uzol) return null;
  const povodny = uzol.nodeValue;
  const m = /^([\s\S]*?)(\S+\s+line)(\s*)$/i.exec(povodny);
  if (!m || !/\S/.test(m[1])) return null;
  const mat = /^([\s\S]*?\S\s+)(dragon\s*skin(?:\s+(?:basic|elite))?\s+)$/i.exec(m[1]);
  const span = mat ? el("span", "lcd1v-mat", mat[2]) : null;
  const em = el("em", "lcd1v-rad", m[2]);
  const koniec = m[3] ? document.createTextNode(m[3]) : null;
  uzol.nodeValue = mat ? mat[1] : m[1];
  if (span) h1.insertBefore(span, uzol.nextSibling);
  h1.insertBefore(em, (span || uzol).nextSibling);
  if (koniec) h1.insertBefore(koniec, em.nextSibling);
  /** návrat: pôvodný jeden textový uzol */
  return function () {
    if (span && span.parentNode) span.parentNode.removeChild(span);
    if (em.parentNode) em.parentNode.removeChild(em);
    if (koniec && koniec.parentNode) koniec.parentNode.removeChild(koniec);
    uzol.nodeValue = povodny;
  };
}
