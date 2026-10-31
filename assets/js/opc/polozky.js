// One page checkout: položky súhrnu kroku 2 — malá fotka a pod názvom rekapitulácia z košíka.
// Michal 29. 10. 2026 schválil podľa náhľadu 2 malú fotku a zlatú pilulku pod názvom. Náhľad 5 (Michal 30. 10. 2026): pod
// názvom je PRESNE rekapitulácia z košíka — ten istý rozpis v tom istom vzhľade ako v košíku (ul.lcd-rozpis so zlatými
// odrážkami, pri kamióne karty skupín .lcd-truck-cart-summary). Žiadne obrázky, guličky farieb, prepisovanie riadkov,
// „Počet“ / „Cena“ (sú v riadku položky) ani „Niečo nesedí“ („Upraviť košík“ je v hlavičke súhrnu).
// Náhľad 6, variant A1 bez čísel (Michal 30. 10. 2026): rozpis je pod názvom HNEĎ — viditeľné sú najdôležitejšie riadky
// (koberce „Auto“, „Farba 1. vrstvy“, „Farba 2. vrstvy“ / CZ „Barva …“; kamión „Vozidlo“ a prvé „Typ a farba materiálu“;
// ostatné, napr. vzorkovník, prvé 2 riadky), zvyšok sa ukáže po zlatej pilulke „Zobraziť viac“ (po rozbalení „Zobraziť
// menej“), bez počtu skrytých riadkov. Keď sa nič neskrýva, pilulka nie je a názov je celý (lcd-opc-cely-nazov; revízia A1,
// N2 — orezaný na 2 riadky by sa bez pilulky nedal zobraziť). To isté v zbalenom súhrne navrchu (telefón, vlastná pilulka
// a stav) aj v bočnom paneli na PC.
//
// Web bez prekrývania: karta detailu obsahuje len NATÍVNY rozpis položky (cart.js changeDescription — ul.lcd-rozpis za
// názvom, pri kamióne span.main-link-surcharges s .lcd-truck-cart-summary / .info-wrap). Presunie sa pod položku bez zmeny,
// nič sa nekopíruje; riadky „až po Zobraziť viac“ dostanú len triedu lcd-opc-dalsi (CSS ich skryje, kým položka nie je
// rozbalená — .lcd-opc-otvorena). Obsah a čísla #summary-box Shoptetu (názov, počet, cena, sumy) sa nemenia — okrem
// veľkého začiatočného písmena názvu (velkePismenoNazvu, doladenie 2).
//
// Fotka: košík (opc/kosik.js) uloží do sessionStorage mapu „data-micro-identifier|data-micro-sku“ -> URL malého náhľadu
// z riadku košíka (oba atribúty má aj položka v súhrne kroku 2; kód varianty rozlíši dva sety toho istého produktu v inej
// farbe). Bez záznamu = bez fotky. <img> má pevné 60 × 60 (bez CLS). Fotka, ktorá sa nenačíta (404, chyba siete), sa
// odstráni celá aj so stĺpcom (žiadny prázdny rámik) a pri prekreslení súhrnu sa už nevloží.

export const KLUC_FOTIEK = "lcdOpcFotky";
const MAX_FOTIEK = 40;

function el(doc, tag, attrs, deti) {
  const e = doc.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === "text") e.textContent = attrs[k];
    else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
  });
  (deti || []).forEach(function (d) { if (d) e.appendChild(typeof d === "string" ? doc.createTextNode(d) : d); });
  return e;
}

// ------------------------------------------------------------------ fotka (košík -> krok 2)

/** Kľúč položky spoločný pre riadok košíka (tr) aj súhrn kroku 2 (div.cart-item): data-micro-identifier Shoptetu. */
export function klucPolozky(e) {
  return (e && e.getAttribute && e.getAttribute("data-micro-identifier")) || null;
}

/** Kľúč fotky: identifikátor produktu + kód varianty (data-micro-sku) — iný variant toho istého produktu má inú fotku
 *  (revízia doladenia 1). Bez identifikátora null. */
export function klucFotky(e) {
  const k = klucPolozky(e);
  return k ? k + "|" + ((e.getAttribute("data-micro-sku") || "").trim()) : null;
}

/** Len adresa obrázka cez http(s), nie data:, nie originál (/orig/ = plná veľkosť). */
export function platnaFotka(u) {
  return typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/i.test(u) && !/\/orig\//i.test(u);
}

/** URL malého náhľadu z riadku košíka: data-src (lenivé načítanie Shoptetu, ?x=100&y=100) alebo src. */
export function fotkaZRiadku(tr) {
  const img = tr && tr.querySelector ? tr.querySelector(".cart-p-image img") : null;
  if (!img) return null;
  const u = img.getAttribute("data-src") || img.getAttribute("src") || "";
  return platnaFotka(u) ? u : null;
}

/** Košík: mapa kľúč -> URL náhľadu do sessionStorage (vždy celý aktuálny košík, stará mapa sa prepíše). */
export function ulozFotky(doc, ss) {
  const m = {};
  let n = 0;
  doc.querySelectorAll("tr.removeable[data-micro-identifier], .cart-table tr[data-micro-identifier]").forEach(function (tr) {
    const k = klucFotky(tr), u = fotkaZRiadku(tr);
    if (k && u && !m[k] && n < MAX_FOTIEK) { m[k] = u; n++; }
  });
  try { ss.setItem(KLUC_FOTIEK, JSON.stringify(m)); } catch (e) { /* súkromný režim: bez fotiek */ }
  return m;
}

/** Krok 2: mapa zo sessionStorage ({} keď chýba alebo je poškodená). */
export function citajFotky(ss) {
  try {
    const m = JSON.parse(ss.getItem(KLUC_FOTIEK) || "{}");
    return m && typeof m === "object" && !Array.isArray(m) ? m : {};
  } catch (e) {
    return {};
  }
}

// ------------------------------------------------------------------ DOM

/** Natívny rozpis položky súhrnu: ul.lcd-rozpis (osobné autá, rohože) alebo span príplatkov s rozpisom kamióna. */
function rozpisPolozky(p) {
  const meno = p.querySelector(".cart-item-name");
  if (!meno) return null;
  const ul = meno.querySelector("ul.lcd-rozpis");
  if (ul) return ul;
  return Array.prototype.find.call(meno.querySelectorAll("span.main-link-surcharges"), function (s) {
    return !!s.querySelector(".lcd-truck-cart-summary, .info-wrap");
  }) || null;
}

// ------------------------------------------------------------------ A1: čo je vidno hneď (Michal 30. 10. 2026)

/** Trieda riadku (a prázdnej skupiny / zoznamu), ktorý sa ukáže až po „Zobraziť viac“. */
export const DALSI = "lcd-opc-dalsi";
/** Trieda položky bez pilulky (nič sa neskrýva, aj bez rozpisu): celý názov, nie orezaný na 2 riadky (revízia A1, N2). */
export const CELY_NAZOV = "lcd-opc-cely-nazov";
const KOBERCE = /^(Auto|(Farba|Barva) [12]\. vrstvy)$/i;
const VOZIDLO = /^Vozidlo$/i;
const MATERIAL = /^Typ a (farba|barva) materiálu$/i;
// kamión bez súhrnu (.info-wrap): materiál je v dvoch riadkoch príplatkov „Typ materiálu - …“ a „Farba materiálu - …“
const TYP_MATERIALU = /^Typ materiálu$/i;
const FARBA_MATERIALU = /^(Farba|Barva) materiálu$/i;

const cisty = (t) => String(t || "").replace(/\s+/g, " ").trim();

/**
 * Riadky natívneho rozpisu: [{ els: prvky riadku, nazov, obal: skupina / zoznam, ktorý sa skryje, keď v ňom nič nie je
 * hneď }] a druh rozpisu („rozpis“ osobné autá a vzorky, „kamion“ karty skupín, „info“ kamión bez súhrnu).
 */
export function riadkyRozpisu(rozpis) {
  if (!rozpis) return { druh: null, riadky: [] };
  if (rozpis.matches("ul.lcd-rozpis")) {
    return { druh: "rozpis", riadky: Array.prototype.map.call(rozpis.children, function (li) {
      const n = li.querySelector(".lcd-rozpis__n");
      return { els: [li], nazov: n ? cisty(n.textContent).replace(/\s*:$/, "") : "", obal: null };
    }) };
  }
  const skupiny = rozpis.querySelectorAll(".lcd-truck-cart-summary__group");
  if (skupiny.length) {
    const riadky = [];
    skupiny.forEach(function (g) {
      g.querySelectorAll("dt").forEach(function (dt) {
        const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === "DD" ? dt.nextElementSibling : null;
        riadky.push({ els: dd ? [dt, dd] : [dt], nazov: cisty(dt.textContent), obal: g });
      });
    });
    return { druh: "kamion", riadky: riadky };
  }
  const info = rozpis.querySelector(".info-wrap");
  if (!info) return { druh: null, riadky: [] };
  return { druh: "info", riadky: Array.prototype.map.call(info.querySelectorAll("li"), function (li) {
    // „Vozidlo: …“ (ul.model) alebo príplatok „Typ materiálu - …“ (.setup)
    const m = /^(.+?)\s*(?::|\s[-–]\s)/.exec(cisty(li.textContent));
    return { els: [li], nazov: m ? m[1] : "", obal: li.closest("ul.model, .setup") };
  }) };
}

/** Indexy riadkov, ktoré sú vidno hneď (A1). Nič z pravidiel -> prvé 2 riadky. */
export function hnedVidno(r) {
  const riadky = r.riadky;
  let v = [];
  if (r.druh === "kamion" || r.druh === "info") {
    riadky.forEach(function (x, i) { if (VOZIDLO.test(x.nazov)) v.push(i); });
    let m = riadky.findIndex(function (x) { return MATERIAL.test(x.nazov); });
    if (m >= 0) v.push(m);
    else {
      [TYP_MATERIALU, FARBA_MATERIALU].forEach(function (re) {
        m = riadky.findIndex(function (x) { return re.test(x.nazov); });
        if (m >= 0) v.push(m);
      });
    }
  } else {
    riadky.forEach(function (x, i) { if (KOBERCE.test(x.nazov)) v.push(i); });
  }
  if (!v.length) v = riadky.slice(0, 2).map(function (x, i) { return i; });
  return v.sort(function (a, b) { return a - b; });
}

function odznac(e) {
  if (!e.classList.contains(DALSI)) return;
  e.classList.remove(DALSI);
  if (!e.classList.length) e.removeAttribute("class");
}

/**
 * Označí riadky rozpisu „až po Zobraziť viac“ (lcd-opc-dalsi), aj skupinu / zoznam, v ktorom nič nie je hneď. Opakovateľné
 * (staré značky preč, nové podľa aktuálnych riadkov). -> počet riadkov po „Zobraziť viac“ (0 = tlačidlo netreba).
 */
export function oznacRiadky(koren) {
  if (!koren) return 0;
  koren.querySelectorAll("." + DALSI).forEach(odznac);
  const r = riadkyRozpisu(koren.matches("ul.lcd-rozpis, span.main-link-surcharges, .lcd-opc-kopia-priplatky") ? koren
    : koren.querySelector("ul.lcd-rozpis, span.main-link-surcharges, .lcd-opc-kopia-priplatky"));
  const v = hnedVidno(r);
  let skryte = 0;
  r.riadky.forEach(function (x, i) {
    if (v.indexOf(i) >= 0) return;
    skryte++;
    x.els.forEach(function (e) { e.classList.add(DALSI); });
  });
  if (!skryte) return 0;
  r.riadky.forEach(function (x) {
    if (x.obal && !x.obal.classList.contains(DALSI) && r.riadky.every(function (y, i) { return y.obal !== x.obal || v.indexOf(i) < 0; })) x.obal.classList.add(DALSI);
  });
  return skryte;
}

function vytvorZob(doc) {
  return el(doc, "button", { type: "button", class: "lcd-opc-zob", "aria-expanded": "false" }, [
    el(doc, "span", { class: "lcd-opc-zob__pil" }, [el(doc, "span", { class: "lcd-opc-zob__text" }), el(doc, "i", { "aria-hidden": "true" })]),
  ]);
}

/** Stav položky: rozbalená = vidno všetky riadky rozpisu a celý názov (.lcd-opc-otvorena), text pilulky podľa stavu. */
function nastavZob(zob, p, ano, T) {
  zob.setAttribute("aria-expanded", String(ano));
  if (p) p.classList.toggle("lcd-opc-otvorena", ano);
  const t = zob.querySelector(".lcd-opc-zob__text");
  if (t) t.textContent = ano ? T.zobrazitMenej : T.zobrazitViac;
}

/**
 * Veľké začiatočné písmeno názvu položky priamo v texte (Shoptet posiela „luxusné autokoberce…“). Nie cez ::first-letter:
 * WebKit (Safari, iPhone) ho na zbalenom názve (-webkit-box s line-clamp) neuplatní a ukazoval „luxusné…“ (doladenie 2).
 * Mení sa len prvé písmeno prvého neprázdneho textového uzla odkazu (potomkovia ako príplatky nie); už veľké, číslo
 * alebo bez odkazu = nič, takže opakované volanie (prekreslenie súhrnu Shoptetom) nič nezmení. -> true = zmenené.
 */
export function velkePismenoNazvu(a, jazyk) {
  if (!a || !a.childNodes) return false;
  const t = Array.prototype.find.call(a.childNodes, function (n) { return n.nodeType === 3 && /\S/.test(n.nodeValue); });
  if (!t) return false;
  const v = t.nodeValue, i = v.search(/\S/), ch = v.charAt(i);
  let velke = ch;
  try { velke = ch.toLocaleUpperCase(jazyk || "sk"); } catch (e) { velke = ch.toUpperCase(); } // neplatný jazyk stránky
  if (velke === ch) return false;
  t.nodeValue = v.slice(0, i) + velke + v.slice(i + 1);
  return true;
}

/**
 * Položky #summary-box: fotka (keď je v mape), karta detailu s natívnym rozpisom pod názvom (vždy viditeľná) a pod ňou
 * pilulka „Zobraziť viac“, keď sa niečo skrýva (A1). Opakovateľné — po každom prekreslení súhrnu (Shoptet, opc/krok2.js
 * nastavSuhrn) doplní, čo chýba (aj kartu, keď cart.js doplnil rozpis neskôr), značky riadkov prepočíta a stav zbalené /
 * rozbalené vráti z `otvorene` (kľúč položky + poradie). Vráti počet položiek.
 */
export function rozsirPolozky(box, T, o) {
  if (!box) return 0;
  const doc = box.ownerDocument;
  const fotky = (o && o.fotky) || {};
  const otvorene = (o && o.otvorene) || {};
  // adresy fotiek, ktoré sa nenačítali (404, chyba siete) — pamätá sa v stave krok2.js, aby ich prekreslenie súhrnu
  // nevložilo znova (doladenie 2)
  const zle = o ? (o.zle || (o.zle = {})) : {};
  const jazyk = (doc.documentElement && doc.documentElement.getAttribute("lang")) || "sk";
  const polozky = box.querySelectorAll(".cart-items .cart-item");
  polozky.forEach(function (p, i) {
    const id = "lcd-opc-detail-" + (i + 1);
    const kluc = (klucPolozky(p) || "?") + "#" + i;
    velkePismenoNazvu(p.querySelector(".cart-item-name a.main-link"), jazyk);
    // fotka vľavo od názvu
    let foto = p.querySelector(":scope > .lcd-opc-foto");
    const url = fotky[klucFotky(p)];
    if (!foto && platnaFotka(url) && !zle[url]) {
      foto = el(doc, "img", { class: "lcd-opc-foto", src: url, alt: "", width: "60", height: "60", decoding: "async" });
      // fotka sa nenačítala: nie prázdny rámik 60 px — celý preč, položka bez stĺpca fotky (názov a pilulka od ľavého okraja)
      foto.addEventListener("error", function () {
        zle[url] = true;
        foto.remove();
        if (!p.querySelector(":scope > .lcd-opc-foto")) p.classList.remove("lcd-opc-s-fotkou");
      }, { once: true });
      p.insertBefore(foto, p.firstChild);
    }
    p.classList.toggle("lcd-opc-s-fotkou", !!foto);
    // pilulka mimo svojho miesta (napr. kópia vrátená do súhrnu) preč — vždy len jedna, priamo v položke
    p.querySelectorAll(".lcd-opc-zob").forEach(function (z) { if (z.parentElement !== p) z.remove(); });
    // karta detailu = natívny rozpis z košíka bez zmeny (náhľad 5), pod názvom vždy viditeľná (A1)
    let det = p.querySelector(":scope > .lcd-opc-detail");
    if (det && !det.firstElementChild) { det.remove(); det = null; }
    if (!det) {
      const rozpis = rozpisPolozky(p);
      let z = p.querySelector(":scope > .lcd-opc-zob");
      if (!rozpis) { if (z) z.remove(); p.classList.remove("lcd-opc-otvorena"); p.classList.add(CELY_NAZOV); return; } // bez rozpisu nie je čo zobraziť
      det = el(doc, "div", { class: "lcd-opc-detail", id: id });
      det.appendChild(rozpis);
      if (z) p.insertBefore(det, z);
      else p.appendChild(det);
    }
    det.id = id;
    det.hidden = false; // súhrn uložený pred A1 (karta bola predvolene [hidden])
    // pilulka „Zobraziť viac“ len keď sa niečo skrýva; pod kartou (poradie čítania). Bez pilulky celý názov (N2).
    let zob = p.querySelector(":scope > .lcd-opc-zob");
    if (!oznacRiadky(det)) {
      if (zob) zob.remove();
      p.classList.remove("lcd-opc-otvorena");
      p.classList.add(CELY_NAZOV);
      return;
    }
    p.classList.remove(CELY_NAZOV);
    if (!zob) zob = vytvorZob(doc);
    if (det.nextElementSibling !== zob) det.after(zob);
    zob.setAttribute("aria-controls", id);
    zob.setAttribute("data-lcd-opc-kluc", kluc);
    // čítačka: tlačidlo s názvom položky (pri viacerých položkách sa tlačidlá inak nerozlíšia; revízia)
    const meno = p.querySelector(".cart-item-name");
    if (meno) {
      if (!meno.id) meno.id = "lcd-opc-nazov-" + (i + 1);
      zob.setAttribute("aria-describedby", meno.id);
    }
    nastavZob(zob, p, !!otvorene[kluc], T);
  });
  return polozky.length;
}

/**
 * Klik na pilulku (delegovaný z #summary-box alebo zo zbaleného súhrnu navrchu): prepne položku (zbalená / rozbalená)
 * a zapamätá stav v `otvorene` (keď je). Vráti nový stav alebo null (iný klik, pilulka mimo `koren`).
 */
export function prepniDetail(ciel, koren, T, otvorene) {
  const zob = ciel && ciel.closest ? ciel.closest(".lcd-opc-zob") : null;
  if (!zob || !koren || !koren.contains(zob)) return null;
  const p = zob.closest(".cart-item");
  if (!p || !koren.contains(p)) return null;
  const ano = zob.getAttribute("aria-expanded") !== "true";
  nastavZob(zob, p, ano, T);
  if (otvorene) otvorene[zob.getAttribute("data-lcd-opc-kluc")] = ano;
  return ano;
}

/**
 * Kópia položky pre zbalený súhrn navrchu (vzhlad.js obnovZbalenySuhrn): bez fotky; natívny rozpis z karty detailu sa
 * vráti pod názov a pod neho VLASTNÁ pilulka kópie (A1) — iné id (aria-controls na rozpis kópie, popis = názov kópie),
 * stav z `otvorene` (kľúč pilulky), nie zo súhrnu pri Objednať. Bez textov `T` (alebo keď sa nič neskrýva) je kópia bez
 * pilulky a s celým rozpisom.
 */
export function vycistiKopiu(k, T, otvorene) {
  k.querySelectorAll(".lcd-opc-foto").forEach(function (x) { x.remove(); });
  k.querySelectorAll('[id^="lcd-opc-nazov-"]').forEach(function (x) { x.removeAttribute("id"); }); // id popisu pilulky len raz
  k.classList.remove("lcd-opc-s-fotkou", "lcd-opc-otvorena", CELY_NAZOV); // názov kópie navrchu sa neoreže
  const det = k.querySelector(".lcd-opc-detail");
  let zob = k.querySelector(".lcd-opc-zob");
  if (!det) { if (zob) zob.remove(); return k; }
  const n = (/(\d+)$/.exec(det.id || "") || [0, "1"])[1];
  const meno = k.querySelector(".cart-item-name") || k;
  const rozpis = det.firstElementChild;
  while (det.firstChild) meno.appendChild(det.firstChild);
  det.remove();
  if (!T || !rozpis || !oznacRiadky(rozpis)) {
    if (zob) zob.remove();
    k.querySelectorAll("." + DALSI).forEach(odznac);
    return k;
  }
  if (!zob) zob = vytvorZob(k.ownerDocument);
  rozpis.id = "lcd-opc-zbalene-rozpis-" + n;
  rozpis.after(zob);
  zob.setAttribute("aria-controls", rozpis.id);
  const a = meno.querySelector("a.main-link");
  if (a) {
    a.id = "lcd-opc-zbalene-nazov-" + n;
    zob.setAttribute("aria-describedby", a.id);
  } else zob.removeAttribute("aria-describedby");
  nastavZob(zob, k, !!(otvorene && otvorene[zob.getAttribute("data-lcd-opc-kluc")]), T);
  return k;
}
