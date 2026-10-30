// One page checkout: položky súhrnu kroku 2 — malá fotka a „Zobraziť detail“ (zobáčik) s rekapituláciou z košíka.
// Michal 29. 10. 2026 schválil podľa náhľadu 2 (2a zbalené, 2b rozbalené, 4 PC) zlatú pilulku pod názvom, predvolene zbalené.
// Náhľad 5 (Michal 30. 10. 2026): po ťuknutí sa pod názvom ukáže PRESNE rekapitulácia z košíka — ten istý rozpis v tom
// istom vzhľade ako v košíku (ul.lcd-rozpis so zlatými odrážkami, pri kamióne karty skupín .lcd-truck-cart-summary). Žiadne
// obrázky, guličky farieb, prepisovanie riadkov, „Počet“ / „Cena“ (sú v riadku položky) ani „Niečo nesedí“ („Upraviť košík“
// je v hlavičke súhrnu). Položka bez rozpisu nemá zobáčik.
//
// Web bez prekrývania: karta detailu obsahuje len NATÍVNY rozpis položky (cart.js changeDescription — ul.lcd-rozpis za
// názvom, pri kamióne span.main-link-surcharges s .lcd-truck-cart-summary / .info-wrap). Presunie sa pod položku bez zmeny,
// nič sa neskrýva ani nekopíruje; obsah a čísla #summary-box Shoptetu (názov, počet, cena, sumy) sa nemenia — okrem veľkého
// začiatočného písmena názvu (velkePismenoNazvu, doladenie 2).
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

function nastavZob(zob, det, ano, T) {
  zob.setAttribute("aria-expanded", String(ano));
  det.hidden = !ano;
  // rozbalená položka ukáže celý názov (náhľad 2b / 4); zbalená na PC ostáva na 2 riadkoch („Objednať“ na 1366×657)
  if (zob.parentElement) zob.parentElement.classList.toggle("lcd-opc-otvorena", ano);
  const t = zob.querySelector(".lcd-opc-zob__text");
  if (t) t.textContent = ano ? T.skrytDetail : T.zobrazitDetail;
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
 * Položky #summary-box: fotka (keď je v mape), zobáčik a karta detailu s natívnym rozpisom (len pri položke s rozpisom).
 * Opakovateľné — po každom prekreslení súhrnu (Shoptet, opc/krok2.js nastavSuhrn) doplní, čo chýba (aj zobáčik, keď
 * cart.js doplnil rozpis neskôr), a stav zbalené / rozbalené vráti z `otvorene` (kľúč položky + poradie). Vráti počet položiek.
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
      // fotka sa nenačítala: nie prázdny rámik 60 px — celý preč, položka bez stĺpca fotky (názov a zobáčik od ľavého okraja)
      foto.addEventListener("error", function () {
        zle[url] = true;
        foto.remove();
        if (!p.querySelector(":scope > .lcd-opc-foto")) p.classList.remove("lcd-opc-s-fotkou");
      }, { once: true });
      p.insertBefore(foto, p.firstChild);
    }
    p.classList.toggle("lcd-opc-s-fotkou", !!foto);
    // zobáčik + karta detailu = natívny rozpis z košíka bez zmeny (náhľad 5)
    let zob = p.querySelector(":scope > .lcd-opc-zob");
    let det = p.querySelector(":scope > .lcd-opc-detail");
    if (!zob || !det) {
      if (zob) zob.remove();
      if (det) det.remove();
      const rozpis = rozpisPolozky(p);
      if (!rozpis) { p.classList.remove("lcd-opc-otvorena"); return; } // bez rozpisu nie je čo zobraziť
      det = el(doc, "div", { class: "lcd-opc-detail", id: id });
      det.appendChild(rozpis);
      zob = el(doc, "button", { type: "button", class: "lcd-opc-zob", "aria-controls": id, "aria-expanded": "false" }, [
        el(doc, "span", { class: "lcd-opc-zob__pil" }, [el(doc, "span", { class: "lcd-opc-zob__text" }), el(doc, "i", { "aria-hidden": "true" })]),
      ]);
      p.appendChild(zob);
      p.appendChild(det);
    }
    zob.setAttribute("aria-controls", id);
    det.id = id;
    zob.setAttribute("data-lcd-opc-kluc", kluc);
    // čítačka: „Zobraziť detail“ s názvom položky (pri viacerých položkách sa tlačidlá inak nerozlíšia; revízia)
    const meno = p.querySelector(".cart-item-name");
    if (meno) {
      if (!meno.id) meno.id = "lcd-opc-nazov-" + (i + 1);
      zob.setAttribute("aria-describedby", meno.id);
    }
    nastavZob(zob, det, !!otvorene[kluc], T);
  });
  return polozky.length;
}

/** Klik na zobáčik (delegovaný z #summary-box): prepne kartu a zapamätá stav. Vráti nový stav alebo null (iný klik). */
export function prepniDetail(ciel, box, T, otvorene) {
  const zob = ciel && ciel.closest ? ciel.closest(".lcd-opc-zob") : null;
  if (!zob || !box.contains(zob)) return null;
  const det = box.ownerDocument.getElementById(zob.getAttribute("aria-controls"));
  if (!det) return null;
  const ano = zob.getAttribute("aria-expanded") !== "true";
  nastavZob(zob, det, ano, T);
  otvorene[zob.getAttribute("data-lcd-opc-kluc")] = ano;
  return ano;
}

/**
 * Kópia položky pre zbalený súhrn navrchu (vzhlad.js obnovZbalenySuhrn): bez fotky a zobáčika; natívny rozpis z karty
 * detailu sa vráti pod názov (ako pred zobáčikom) a je viditeľný.
 */
export function vycistiKopiu(k) {
  k.querySelectorAll(".lcd-opc-foto, .lcd-opc-zob").forEach(function (x) { x.remove(); });
  k.querySelectorAll('[id^="lcd-opc-nazov-"]').forEach(function (x) { x.removeAttribute("id"); }); // id popisu zobáčika len raz
  k.classList.remove("lcd-opc-s-fotkou", "lcd-opc-otvorena");
  const det = k.querySelector(".lcd-opc-detail");
  if (!det) return k;
  const meno = k.querySelector(".cart-item-name") || k;
  while (det.firstChild) meno.appendChild(det.firstChild);
  det.remove();
  return k;
}
