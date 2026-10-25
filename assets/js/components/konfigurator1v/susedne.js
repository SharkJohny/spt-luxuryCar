// Susedné stránky produktov pre ceny nového vzhľadu 1V — lacno a bez zdržania prvého vykreslenia.
// Michal 25. 10. 2026 (rýchlosť): „aby sa to otváralo rýchlo aj na starších zariadeniach“ (docs/1v-rychlost.md, bod 3).
// Doteraz ceny-ine.js sťahoval celé HTML sesterskej stránky (170 kB – 1 MB) a parsoval ho cez DOMParser na hlavnom
// vlákne, hneď pri štarte a pri plnej priorite siete (3–5 stránok na rohoži do kufra a boxe). Tu:
//   vyrezStranky(html) – z HTML vyreže len to, čo z neho čítajú cenaStranky / mapaZFormulara (lcdKosikDoplnok.js) a
//                        maBeznuCenu (ceny-ine.js): og:image, prvú značku s itemprop="price", formulár
//                        #product-detail-form (začiatočná značka, prvé productId a language, selecty príplatkov
//                        a variantov, .p-final-price-wrapper) a skript s necessaryVariantData. DOMParser potom dostane
//                        len výrez (jednotky kB) a tie isté funkcie nad ním vrátia to isté ako nad celou stránkou.
//                        Prechod textom je lineárny: komentáre, skripty, štýly a <template> sa preskakujú ako v HTML
//                        parseri. Čokoľvek nečakané (formulár nenájdený alebo bez id product-detail-form, cena/obal
//                        ceny/skript variantov mimo očakávaného miesta, select s vnorenými poľami …) -> null a volajúci
//                        parsuje celú stránku ako doteraz.
//   stiahniText(cesta) – GET stránky s nízkou prioritou (fetch priority: low; ceny nesmú brať pásmo fotkám a skriptom
//                        stránky; prehliadač bez podpory voľbu ignoruje).
//   poNecinnosti(ms)   – Promise v nečinnosti hlavného vlákna (requestIdleCallback, najneskôr po ms); bez neho (Safari)
//                        po načítaní stránky, najneskôr po ms.
// Len pre volajúcich 1V (ceny-ine.js); košík (lcdKosikDoplnok.js) má vlastné sťahovanie a ostáva bez zmeny.
// Pri importe sa nič nespúšťa.

/** Prvky, ktorých obsah je surový text až po vlastnú koncovú značku (HTML tokenizer; skripty sa v DOMParseri nespúšťajú). */
const SUROVE = { script: 1, style: 1, textarea: 1, title: 1, xmp: 1, iframe: 1, noembed: 1, noframes: 1 };
/** Prázdne prvky (bez koncovej značky). */
const PRAZDNE = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1, keygen: 1 };
const RE_MENO = /<([a-zA-Z][^\s/>]*)/y;
const RE_KONCOVA = /<\/([a-zA-Z][^\s/>]*)[^>]*>/y;
const RE_ATR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const RE_KONIEC_SUROVEHO = {};

function jeMedzera(c) {
  return c === 32 || c === 9 || c === 10 || c === 12 || c === 13;
}

/** Index „>“, ktorým končí značka začatá na h[od] (hodnoty atribútov v úvodzovkách sa preskočia), alebo -1. */
function koniecZnacky(h, od) {
  const n = h.length;
  let k = od;
  while (k < n) {
    const c = h.charCodeAt(k);
    if (c === 62) return k; // >
    if (c === 61) { // = : hodnota atribútu
      k++;
      while (k < n && jeMedzera(h.charCodeAt(k))) k++;
      const q = h.charCodeAt(k);
      if (q === 34 || q === 39) {
        const e = h.indexOf(q === 34 ? '"' : "'", k + 1);
        if (e < 0) return -1;
        k = e + 1;
      }
      continue;
    }
    k++;
  }
  return -1;
}

/** Atribúty značky h[od..po) (za menom značky): mená malými písmenami, prvý výskyt platí (ako HTML parser), hodnoty bez dekódovania. */
function atributy(h, od, po) {
  const t = h.slice(od, po);
  const out = {};
  RE_ATR.lastIndex = 0;
  let m;
  while ((m = RE_ATR.exec(t))) {
    const k = m[1].toLowerCase();
    if (!(k in out)) out[k] = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : "";
  }
  return out;
}

/** Ukazovateľ na ďalší výskyt slova (text sa prechádza len dopredu -> spolu lineárne): je výskyt v [od, po)? */
function ukazovatel(h, slovo) {
  let p = h.indexOf(slovo);
  return function (od, po) {
    if (p > -1 && p < od) p = h.indexOf(slovo, od);
    return p > -1 && p < po;
  };
}

function maTriedu(a, trieda) {
  return a.class != null && (" " + a.class.replace(/\s+/g, " ") + " ").indexOf(" " + trieda + " ") > -1;
}

/**
 * Výrez stránky produktu (pozri hlavičku) ako samostatný HTML dokument alebo null (štruktúra nie je istá -> celá stránka).
 * Poradie prvkov vo výreze = poradie v stránke, preto „prvý“ v querySelector vráti ten istý prvok ako v celej stránke.
 */
export function vyrezStranky(h) {
  if (typeof h !== "string" || !h) return null;
  const n = h.length;
  const ip = ukazovatel(h, "itemprop"), og = ukazovatel(h, "og:image"), pfw = ukazovatel(h, "p-final-price-wrapper");
  const idf = ukazovatel(h, "product-detail-form"), tid = ukazovatel(h, "formProduct"), nvd = ukazovatel(h, "necessaryVariantData");
  const v = { og: null, cena: null, form: null, pid: null, lang: null, obal: null, selecty: [], skripty: [] };
  let zachyt = null; // rozpracovaný .p-final-price-wrapper { meno, od, hlbka }
  let koniecFormu = -1;
  let i = 0;
  while (i < n) {
    const lt = h.indexOf("<", i);
    if (lt < 0) break;
    const c = h.charCodeAt(lt + 1);
    if (c === 33) { // <! : komentár, doctype
      if (h.startsWith("<!--", lt)) {
        if (h.startsWith("<!-->", lt)) { i = lt + 5; continue; }
        if (h.startsWith("<!--->", lt)) { i = lt + 6; continue; }
        const e = h.indexOf("-->", lt + 4);
        if (e < 0) break;
        i = e + 3;
        continue;
      }
      const e = h.indexOf(">", lt + 2);
      if (e < 0) break;
      i = e + 1;
      continue;
    }
    if (c === 63) { // <? : falošný komentár
      const e = h.indexOf(">", lt + 2);
      if (e < 0) break;
      i = e + 1;
      continue;
    }
    if (c === 47) { // </ : koncová značka
      RE_KONCOVA.lastIndex = lt;
      const m = RE_KONCOVA.exec(h);
      if (!m) {
        const e = h.indexOf(">", lt + 2);
        if (e < 0) break;
        i = e + 1;
        continue;
      }
      i = RE_KONCOVA.lastIndex;
      const meno = m[1].toLowerCase();
      if (zachyt && meno === zachyt.meno && --zachyt.hlbka === 0) {
        if (v.obal) return null; // druhý obal ceny vo formulári: neisté, ktorý by querySelector vybral
        v.obal = h.slice(zachyt.od, i);
        zachyt = null;
      }
      if (meno === "form" && v.form) { koniecFormu = lt; break; } // všetko potrebné je pred koncom formulára
      continue;
    }
    RE_MENO.lastIndex = lt;
    const m = RE_MENO.exec(h);
    if (!m) { i = lt + 1; continue; } // „<“ v texte
    const meno = m[1].toLowerCase();
    const zac = RE_MENO.lastIndex;
    const e = koniecZnacky(h, zac);
    if (e < 0) return null;
    i = e + 1;
    const samozatv = h.charCodeAt(e - 1) === 47;
    let a = null;
    const attr = () => a || (a = atributy(h, zac, e));
    // formulár produktu (#product-detail-form alebo form[data-testid=formProduct], prvý v stránke)
    if (!v.form && (idf(zac, e) || (meno === "form" && tid(zac, e)))) {
      const x = attr();
      if (x.id === "product-detail-form" || (meno === "form" && x["data-testid"] === "formProduct")) {
        if (meno !== "form") return null;
        // rýchlosť (25. 10. 2026, revízia): formulár len s data-testid (bez id) -> celá stránka. maBeznuCenu (ceny-ine.js)
        // hľadá bežnú cenu cez „.p-info-wrapper …“ alebo „#product-detail-form …“; výrez .p-info-wrapper nemá a bez id by
        // vrátil bezna = false, kým celá stránka true (overené úpravou živých stránok, revízia vyrez/porovnaj.mjs)
        if (x.id !== "product-detail-form") return null;
        v.form = h.slice(lt, e + 1);
        continue;
      }
    }
    if (!v.og && meno === "meta" && og(zac, e) && attr().property === "og:image") v.og = h.slice(lt, e + 1);
    if (!v.cena && ip(zac, e) && attr().itemprop === "price") {
      if (!v.form) return null; // cena pred formulárom: mimo očakávaného miesta
      v.cena = h.slice(lt, e + 1) + (PRAZDNE[meno] || samozatv ? "" : "</" + meno + ">");
    }
    if (pfw(zac, e) && maTriedu(attr(), "p-final-price-wrapper")) {
      if (!v.form || zachyt || PRAZDNE[meno] || SUROVE[meno] || meno === "select" || meno === "template") return null;
      zachyt = { meno: meno, od: lt, hlbka: 1 };
      continue;
    }
    if (zachyt && meno === zachyt.meno && !PRAZDNE[meno]) zachyt.hlbka++;
    if (v.form && meno === "input" && (!v.pid || !v.lang)) {
      const x = attr();
      if (!v.pid && x.name === "productId") v.pid = h.slice(lt, e + 1);
      else if (!v.lang && x.name === "language") v.lang = h.slice(lt, e + 1);
      continue;
    }
    if (meno === "select") {
      // select až po </select> (option-y sa neprechádzajú); vnorené polia by HTML parser spracoval inak -> celá stránka
      const re = /<\/select\s*>|<(?:select|input|textarea|keygen)\b|<\/form\b/gi;
      re.lastIndex = i;
      const k = re.exec(h);
      if (!k || k[0].charAt(1) !== "/" || /^<\/form/i.test(k[0])) return null;
      const name = attr().name || "";
      if (v.form && (name.indexOf("surchargeParameterValueId[") === 0 || name.indexOf("parameterValueId[") === 0)) v.selecty.push(h.slice(lt, re.lastIndex));
      else if (!v.form && (name.indexOf("surchargeParameterValueId[") === 0 || name.indexOf("parameterValueId[") === 0)) return null;
      i = re.lastIndex;
      continue;
    }
    if (meno === "template") {
      // obsah <template> querySelector nevidí; vnorený template -> celá stránka
      const re = /<\/template\s*>|<template\b/gi;
      re.lastIndex = i;
      const k = re.exec(h);
      if (!k || k[0].charAt(1) !== "/") return null;
      i = re.lastIndex;
      continue;
    }
    if (meno === "plaintext") return null;
    if (SUROVE[meno]) {
      const re = RE_KONIEC_SUROVEHO[meno] || (RE_KONIEC_SUROVEHO[meno] = new RegExp("</" + meno + "[\\s/>]", "gi"));
      re.lastIndex = i;
      const k = re.exec(h);
      if (!k) return null;
      if (meno === "script" && nvd(i, k.index)) v.skripty.push(h.slice(i, k.index));
      const z = h.indexOf(">", k.index);
      if (z < 0) return null;
      i = z + 1;
    }
  }
  if (!v.form || koniecFormu < 0 || zachyt || !v.cena || !v.pid || !v.selecty.length) return null;
  // za formulárom nesmie byť nič, čo by querySelector v celej stránke našiel skôr / navyše (obal ceny, skript variantov,
  // og:image) — dnes tam nič z toho nie je; keby bolo, rozhodne celá stránka
  if (h.indexOf("p-final-price-wrapper", koniecFormu) > -1 || h.indexOf("necessaryVariantData", koniecFormu) > -1 || (!v.og && h.indexOf("og:image", koniecFormu) > -1)) return null;
  return "<!DOCTYPE html><html><head>" + (v.og || "") + "</head><body>" + v.form + v.cena + v.pid + (v.lang || "") + v.selecty.join("") + (v.obal || "") +
    "</form>" + v.skripty.map(function (s) { return "<script>" + s + "</script>"; }).join("") + "</body></html>";
}

/** GET stránky webu -> text, nízka priorita siete (fetch priority; bez podpory sa ignoruje). Chyba HTTP -> výnimka. */
export function stiahniText(cesta) {
  return fetch(cesta, { credentials: "same-origin", priority: "low" }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  });
}

/** Promise splnený v nečinnosti hlavného vlákna (requestIdleCallback, najneskôr po ms); bez neho po load, najneskôr po ms. */
export function poNecinnosti(ms) {
  return new Promise(function (hotovo) {
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(function () { hotovo(); }, { timeout: ms });
      return;
    }
    let raz = false;
    const spusti = function () { if (!raz) { raz = true; hotovo(); } };
    setTimeout(spusti, ms);
    if (typeof document === "undefined" || document.readyState === "complete") setTimeout(spusti, 1);
    else window.addEventListener("load", function () { setTimeout(spusti, 1); }, { once: true });
  });
}
