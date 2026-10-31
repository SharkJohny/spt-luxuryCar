// Ďakovná stránka Shoptetu po objednávke (/objednavka/dekujeme/, SK 🟡 aj /objednavka/dakujeme/) v návrhu
// „4 – Prémiový s platbou hore“ (schválené náhľady 30. 10. 2026). LEN pri zapnutom tajnom kóde OPC (opc/index.js
// jeZapnute, ?opc=0 vypína, data.json "opc": false má prednosť) — bez kódu sa stránka pre zákazníkov nemení.
//
// Bezpečnosť: stránka Shoptetu sa nemaže. Nový blok #lcd-dakujeme sa vloží pred obsah a pôvodný obsah sa len skryje
// triedou (.lcd-dak-povodne). Skripty Shoptetu bežia ďalej (presmerovanie na platobnú bránu, merače). Keď sa nepodarí
// spoľahlivo načítať kľúčové údaje (číslo objednávky, suma, spôsob platby; pri prevode aj účet a VS), nič sa neskryje
// a ostane pôvodná stránka. Hodnoty sa berú podľa popisov Shoptetu („Číslo“, „Zvolená platba“, „Částka k úhradě“ /
// „Suma na úhradu“, „Bankovní účet“, „Variabilní symbol“…), nie podľa poradia ani tried.
//
// Stav platby kartou / online (❓ Shoptet ho na ďakovnej stránke ukazuje inak podľa výsledku brány, presné texty
// nepoznáme — doladí záznam nižšie). Revízia 31. 10. 2026 (N1, K1, K2, N2): náš blok sa pri karte ukáže LEN pri
// rozpoznanom tlačidle/odkaze Shoptetu na platbu a bez textu o úspechu alebo čakaní = „neprebehla“ (naše zelené tlačidlo
// použije to Shoptetu). Všetko ostatné (zaplatené podľa textu, čaká/PENDING, veta len o objednávke, neúspech bez tlačidla,
// nič) = pôvodná stránka Shoptetu. „Zaplatené“ podľa textu je vypnuté (ZAPLATENE_PODLA_TEXTU), kým záznam nepotvrdí
// presný text Shoptetu; aj potom LEN pri vete o PLATBE v minulom čase bez záporu, budúceho času a čakania.
// Dva rôzne údaje toho istého popisu (číslo, suma, účet, VS) alebo suma bez práve jednej ceny s menou = pôvodná stránka.
//
// Záznam na overenie: pri zapnutom kóde sa pôvodné HTML hlavného obsahu (bez skriptov, zachytené hneď pri načítaní
// bundla, pred úpravami cart.js) uloží do localStorage „lcdOpcDakujemeZaznam“ (posledných 5, dátum, adresa bez query).
// Nikam sa neposiela — prečíta sa v prehliadači Michala po skúšobnej objednávke a podľa neho sa doladia popisy.

import { lcdRozpis, lcdRozpisEl } from "../functions/kosikRozpis.js";
import { cisloZCeny, cenaText } from "./vzhlad.js";
import { TEXTY_DAKUJEME } from "./dakujemeTexty.js";

export const KLUC_ZAZNAMU = "lcdOpcDakujemeZaznam";
export const MAX_ZAZNAMOV = 5;
export const MAX_ZNAKOV_ZAZNAMU = 150000;
export const SKORO_LIMIT_MS = 3000;
export const TRIEDA = "lcd-opc-dakujeme"; // na <html>: nový vzhľad stojí
export const TRIEDA_CAKA = "lcd-opc-dakujeme-caka"; // na <html>: obsah skrytý, kým sa nerozhodne (CLS)
export const TRIEDA_POVODNE = "lcd-dak-povodne"; // pôvodný obsah Shoptetu (skrytý, nie zmazaný)

// ------------------------------------------------------------------ pomocné čisté funkcie

/** Text bez diakritiky, malými, jedna medzera (porovnávanie popisov Shoptetu SK aj CZ). */
export function bezDiakritiky(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\s ]+/g, " ").trim();
}
const cisty = (s) => String(s == null ? "" : s).replace(/[\s ]+/g, " ").trim();

/** Adresa ďakovnej stránky Shoptetu (SK aj CZ tvar, s lomkou aj bez). */
export function jeCestaDakujeme(cesta) {
  return /^\/objednavka\/d[ae]kujeme(\/|$)/i.test(String(cesta || ""));
}

/** Ďakovná stránka podľa adresy, triedy tela (🟡 in-dekujeme / in-dakujeme) alebo pageType Shoptetu (🟡 thankYou). */
export function jeDakujeme(doc, cesta) {
  try {
    const d = doc || document;
    if (jeCestaDakujeme(cesta != null ? cesta : (d.defaultView || window).location.pathname)) return true;
    const b = d.body;
    if (b && b.classList && (b.classList.contains("in-dekujeme") || b.classList.contains("in-dakujeme"))) return true;
    const dl = (d.defaultView || window).dataLayer;
    if (Array.isArray(dl)) return dl.some((x) => x && x.shoptet && /^thank/i.test(String(x.shoptet.pageType || "")));
  } catch (e) {}
  return false;
}

/** Koreň pôvodného obsahu Shoptetu (to, čo sa skryje) a hlavný obsah (to, čo sa zaznamená). */
export function korenPovodneho(doc) {
  return doc.getElementById("content-wrapper") || doc.getElementById("content") || doc.querySelector("main");
}
function hlavnyObsah(doc) {
  return doc.getElementById("content") || doc.querySelector("main") || doc.getElementById("content-wrapper");
}

const POPISY = {
  cislo: /^(cislo|cislo objednavky|objednavka cislo|objednavka c\.?|c\. objednavky)$/,
  doprava: /^(zvolena doprava|doprava|sposob dopravy|zpusob dopravy|zvoleny sposob dopravy|zvoleny zpusob dopravy)$/,
  platba: /^(zvolena platba|platba|sposob platby|zpusob platby|zvoleny sposob platby|zvoleny zpusob platby|sposob uhrady|zpusob uhrady)$/,
  suma: /^(castka k uhrade|suma k uhrade|suma na uhradu|celkom k uhrade|celkem k uhrade|k uhrade|celkova suma|celkova castka)$/,
  ucet: /^(bankovni ucet|bankovy ucet|cislo uctu|cislo bankovniho uctu|cislo bankovneho uctu)$/,
  vs: /^(variabilni symbol|variabilny symbol|vs)$/,
};
/** Kľúč popisu (cislo, doprava, platba, suma, ucet, vs) podľa textu „Zvolená platba“, „Variabilný symbol:“… alebo null. */
export function klucPopisu(text) {
  const n = bezDiakritiky(text).replace(/\s*:\s*$/, "");
  if (!n || n.length > 40) return null;
  for (const k in POPISY) if (POPISY[k].test(n)) return k;
  return null;
}

/** Vlastný text prvku (len priame textové uzly). */
function vlastnyText(el) {
  let t = "";
  el.childNodes.forEach((n) => { if (n.nodeType === 3) t += n.nodeValue; });
  return cisty(t);
}
const SKRYTE_ZNACKY = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG)$/i;

/**
 * Kontrola hodnoty podľa popisu a jej porovnávací tvar (dva rôzne tvary = rozpor). Suma = PRÁVE jedna cena s menou
 * (preškrtnutá + nová cena alebo číslo bez meny neprejde, V1). Doprava a platba sa nekontrolujú (prvý výskyt).
 */
const HODNOTY = {
  cislo: { ok: (h) => /^[A-Za-z0-9][A-Za-z0-9\-\/]{2,30}$/.test(h.replace(/\s+/g, "")) && /\d/.test(h), tvar: (h) => h.replace(/\s+/g, "") },
  suma: { ok: (h) => ceny(h).length === 1, tvar: (h) => { const c = ceny(h)[0]; return cisloZCeny(c) + " " + menaZTextu(c).symbol; } },
  ucet: { ok: (h) => /\d/.test(h), tvar: (h) => h.replace(/\s+/g, "") },
  vs: { ok: (h) => /^\d{1,10}$/.test(h.replace(/\s+/g, "")), tvar: (h) => h.replace(/\s+/g, "") },
};
const MAX_ZNAKOV_HODNOTY = 120;

/**
 * Dvojice „popis -> hodnota“ podľa popisov Shoptetu (nie poradia): „Popis <strong>hodnota</strong>“ v jednom prvku, inak
 * hodnota v nasledujúcom súrodencovi (<td>, <dd>, <strong>). Pri čísle, sume, účte a VS sa berie prvá hodnota, ktorá
 * prejde kontrolou (popis s poznámkou „Částka k úhradě <span>(2 položky)</span>“ -> susedná bunka), a keď sú na stránke
 * dve rôzne, pár má rozne: true (V2). Doprava a platba: prvý výskyt.
 * -> { cislo: { h, el, rozne? }, doprava: …, platba: …, suma: …, ucet: …, vs: … }
 */
export function paryPopisov(koren, vynechaj) {
  const out = {};
  if (!koren) return out;
  const tvary = {};
  const vsetky = koren.querySelectorAll("*");
  for (let i = 0; i < vsetky.length; i++) {
    const el = vsetky[i];
    if (SKRYTE_ZNACKY.test(el.tagName) || (vynechaj && vynechaj.contains(el))) continue;
    const k = klucPopisu(vlastnyText(el));
    if (!k) continue;
    const kontrola = HODNOTY[k];
    if (out[k] && !kontrola) continue;
    const kand = [];
    // „Číslo <strong>2820260033</strong>“: popis je textový uzol, hodnota v potomkovi
    const deti = Array.prototype.filter.call(el.children, (c) => !SKRYTE_ZNACKY.test(c.tagName) && cisty(c.textContent));
    if (deti.length) kand.push({ h: cisty(deti.map((c) => c.textContent).join(" ")), el: deti[0] });
    let s = el.nextElementSibling;
    while (s && !cisty(s.textContent)) s = s.nextElementSibling;
    if (s) kand.push({ h: cisty(s.textContent), el: s });
    const vyber = kand.find((c) => c.h && !klucPopisu(c.h) && (!kontrola || (c.h.length <= MAX_ZNAKOV_HODNOTY && kontrola.ok(c.h))));
    if (!vyber) continue;
    if (kontrola) {
      const tv = kontrola.tvar(vyber.h);
      tvary[k] = tvary[k] || [];
      if (tvary[k].indexOf(tv) < 0) tvary[k].push(tv);
    }
    if (!out[k]) out[k] = { h: vyber.h, el: vyber.el };
  }
  for (const k in tvary) if (tvary[k].length > 1) out[k].rozne = true;
  return out;
}

/** Spôsob platby podľa názvu Shoptetu: prevod | dobierka | karta | online (Apple/Google Pay, rýchla platba) | null. */
export function druhPlatby(nazov) {
  const n = bezDiakritiky(nazov);
  if (!n) return null;
  if (/prevod/.test(n)) return "prevod";
  if (/dobierk|dobirk/.test(n)) return "dobierka";
  if (/kart|\bcard\b/.test(n)) return "karta";
  if (/apple ?pay|google ?pay|rychla platba|shoptet ?pay|gopay|comgate|thepay|platebni bran|platobn\w* bran|online/.test(n)) return "online";
  return null;
}

/**
 * „Zaplatené“ podľa textu stránky (revízia 31. 10. 2026, N1/K2): VYPNUTÉ, kým záznam lcdOpcDakujemeZaznam z Michalovej
 * skúšobnej objednávky nepotvrdí presný text Shoptetu po zaplatení. Dovtedy pri zaplatenej karte ostane stránka Shoptetu.
 */
export const ZAPLATENE_PODLA_TEXTU = false;

// Vety o platbe (bez diakritiky). Úspech LEN: podmet PLATBA + sloveso v minulom čase („Platba byla úspěšně přijata“,
// „Platba prebehla v poriadku“), bez záporu, budúceho času a čakania vo vete. Veta o OBJEDNÁVKE („přijata“, „potvrzena“,
// „bude označena jako zaplacená“) úspech nie je (K2). PENDING podľa dokumentácie brán Shoptetu („Platba byla zadána
// správně… bude označena jako zaplacená“) = čaká (K1).
const V_JE_PLATBA = /\b(platb\w*|payment\w*|zaplac\w*|zaplat\w*|uhrad\w*|uhraz\w*)\b/;
const V_USPECH = /\b(platba|platbu|payment)\b.{0,40}?\b(prebehla|probehla|prijata|zaplacena|zaplatena|uhrazena|uhradena|dokoncena|provedena|vykonana|realizovana|successful|received|completed)\b|\b(zaplaceno|zaplatene)\b|\buspesne (zaplacen|zaplaten|uhrazen|uhraden)/;
const V_ZAPOR = /\b(nebyla|nebola|nebyl|nebol|nebylo|nebolo|neni|nie je|nie su|nejsou|nebude|nebudu|nebudou|not)\b/;
const V_ZATIM = /\b(zatim|este|jeste|yet)\b/;
const V_NEUSPECH = /\b(neprobehla|neprebehla|nepodarilo|nepodarila|zamitnut\w*|zamietnut\w*|zrusen\w*|selhal\w*|zlyhal\w*|neuspesn\w*|nezaplacen\w*|nezaplaten\w*|neuhrazen\w*|neuhraden\w*|nedokoncen\w*|failed|declined)\b/;
const V_CAKA_VZDY = /(zadana spravne|zadana uspesne|pending|ceka na (platbu|zaplaceni|potvrzeni|pripsani)|caka na (platbu|zaplatenie|potvrdenie|pripisanie)|cekame na platbu|cakame na platbu)/;
const V_CAKA_PRI_PLATBE = /\b(bude|budou|budu|jakmile|akonahle|ako nahle|ked|kdyz|az|po|zpracov\w*|spracov\w*|overuj\w*|overov\w*|cek\w*|cak\w*)\b/;

/**
 * Text o výsledku platby po vetách (bodka, !, ?, ;, nový riadok = koniec vety): { uspech, neuspech, caka }.
 * Zápor („nebyla zaplacena“, „není uhrazena“) = neúspech, so „zatím / ešte“ = čaká. Úspech nikdy vo vete so záporom,
 * budúcim časom ani čakaním.
 */
export function vysledokTextu(text) {
  const r = { uspech: false, neuspech: false, caka: false };
  String(text == null ? "" : text).split(/[.!?;\n]+/).forEach((veta) => {
    const v = bezDiakritiky(veta);
    if (!v) return;
    const platba = V_JE_PLATBA.test(v);
    const zle = V_NEUSPECH.test(v) || (platba && V_ZAPOR.test(v));
    const caka = V_CAKA_VZDY.test(v) || (platba && V_CAKA_PRI_PLATBE.test(v)) || (zle && V_ZATIM.test(v));
    if (caka) r.caka = true;
    else if (zle) r.neuspech = true;
    else if (V_USPECH.test(v)) r.uspech = true;
  });
  return r;
}

const TEXT_PLATBY = /^(zaplatit|opakovat platbu|zopakovat platbu|platit|pay\b|dokoncit platbu|na platbu|(prejst|prejit|pokracovat)\b.{0,30}\b(platb|bran)|(zkusit|skusit)( platbu)? (znovu|znova|este raz|jeste jednou))|platebni bran|platobn\w* bran/;
const ADRESA_BRANY = /shoptet-?pay|\/action\/[^?#]*pay|gopay|comgate|thepay|gpwebpay|\/payments?(\/|\?|#|$)|\/pay(\/|\?|#|$)|\/platba(\/|\?|#|$)|\/zaplatit/i;

/**
 * Tlačidlo/odkaz Shoptetu na (opakovanú) platbu v pôvodnom obsahu, alebo null: text tlačidla („Zaplatit“, „Pokračovat
 * k platbě“, „Přejít na platební bránu“, „Na platbu“, „Zkusit znovu“…), adresa odkazu alebo action formulára na bránu
 * (N2). Informačné odkazy („/doprava-a-platba/“, „#platba“) nie.
 */
export function odkazPlatby(koren, vynechaj) {
  if (!koren) return null;
  const kand = koren.querySelectorAll("a[href], button, input[type=submit], input[type=button]");
  for (let i = 0; i < kand.length; i++) {
    const e = kand[i];
    if (vynechaj && vynechaj.contains(e)) continue;
    let adresa = "";
    if (e.tagName === "A") adresa = String(e.getAttribute("href") || "");
    else {
      const f = e.form || (e.closest && e.closest("form"));
      adresa = String(e.getAttribute("formaction") || (f && f.getAttribute("action")) || "");
    }
    if (/^(tel:|mailto:|javascript:)/i.test(adresa)) continue;
    const t = bezDiakritiky(e.tagName === "INPUT" ? e.value : e.textContent);
    if (TEXT_PLATBY.test(t) || (ADRESA_BRANY.test(adresa) && !/^#?$/.test(adresa))) return e;
  }
  return null;
}

const CENA = /(€\s?\d[\d\s .,]*\d|€\s?\d|\d[\d\s .,]*\s?(?:Kč|€|EUR|CZK))/gi;
const NIE_CENA_TEXT = /^(zdarma|zadarmo)$/i;
const ceny = (t) => (String(t || "").match(CENA) || []).map(cisty);
/** Mena podľa textu ceny Shoptetu („€764“ vľavo, „20 006 Kč“ vpravo). */
export function menaZTextu(t) {
  const s = cisty(t);
  if (/€/.test(s)) return { symbol: "€", vlavo: /^€/.test(s), tisice: " " };
  return { symbol: "Kč", vlavo: false, tisice: " " };
}

/** Riadky textu bunky podľa <br> a blokových prvkov (príplatky a variant Shoptet dáva do jednej bunky). */
function riadkyTextu(el) {
  const out = [];
  let cur = "";
  const BLOK = /^(DIV|P|LI|UL|OL|TABLE|TR|TD|DL|DT|DD|H[1-6]|SECTION)$/;
  const prejdi = (n) => {
    if (n.nodeType === 3) { cur += n.nodeValue; return; }
    if (n.nodeType !== 1 || SKRYTE_ZNACKY.test(n.tagName)) return;
    if (n.classList && (n.classList.contains("lcd-rozpis") || n.classList.contains("lcd-rozpis-zdroj"))) return; // cart.js
    if (n.tagName === "BR") { out.push(cur); cur = ""; return; }
    const blok = BLOK.test(n.tagName) || /main-link-variant|main-link-surcharges/.test(String(n.className || ""));
    if (blok) { out.push(cur); cur = ""; }
    n.childNodes.forEach(prejdi);
    if (blok) { out.push(cur); cur = ""; }
  };
  el.childNodes.forEach(prejdi);
  out.push(cur);
  const riadky = [];
  out.map(cisty).filter(Boolean).forEach((r) => {
    // spojený text bez zlomu: „…DIAMOND LINE Barva 1.vrstvy: … Příplatky: …“ -> rozdeliť pred variant a príplatky
    r.replace(/\s+(?=P[rř][ií]platky\s*:)/g, "\n").replace(/\s+(?=(?:Farba|Barva)\s*1\.?\s*vrstvy\s*:)/gi, "\n").split("\n").forEach((x) => { if (cisty(x)) riadky.push(cisty(x)); });
  });
  return riadky;
}
const JE_PRIPLATKY = /^P[rř][ií]platky\s*:/i;
const JE_VARIANT = /^(?:Farba|Barva)\s*\d\.?\s*vrstvy\s*:|^(?:Farba|Barva|Veľkosť|Velikost|Typ|Hodnota)\s*[^:]{0,30}:/i;

/** Riadky rozpisu, ktoré už v bunke vyrobil cart.js (ul.lcd-rozpis) -> [{ n, h }]. */
function rozpisZCartJs(ul) {
  return Array.prototype.map.call(ul.querySelectorAll(":scope > li"), (li) => {
    const n = li.querySelector(".lcd-rozpis__n"), h = li.querySelector(".lcd-rozpis__h");
    return { n: n ? cisty(n.textContent).replace(/\s*:\s*$/, "") || null : null, h: cisty(h ? h.textContent : li.textContent) };
  }).filter((x) => x.h);
}

function velkePrve(s, jazyk) {
  if (!s) return s;
  let v = s.charAt(0);
  try { v = v.toLocaleUpperCase(jazyk); } catch (e) { v = v.toUpperCase(); }
  return v + s.slice(1);
}

/**
 * Položky z tabuľky „Obsah objednávky“: riadky s fotkou alebo bunkou názvu a cenou. Riadky s popisom (Zvolená platba…)
 * sa vynechajú. -> { polozky: [{ nazov, foto, ks, cena, rozpis }], ine: počet iných riadkov s cenou (zľava, doprava…) }
 */
export function citajPolozky(koren, vynechaj, cz) {
  const polozky = [];
  let ine = 0;
  if (!koren) return { polozky, ine };
  const riadky = koren.querySelectorAll("tr");
  for (let i = 0; i < riadky.length; i++) {
    const tr = riadky[i];
    if (vynechaj && vynechaj.contains(tr)) continue;
    const bunky = Array.prototype.filter.call(tr.children, (c) => /^T[DH]$/.test(c.tagName));
    if (bunky.length < 2 || bunky.some((c) => klucPopisu(vlastnyText(c)) || klucPopisu(c.textContent))) continue;
    if (!ceny(tr.textContent).length) continue;
    const img = tr.querySelector("img");
    let nazovBunka = tr.querySelector(".p-name, [data-testid=cellProductName]");
    if (!nazovBunka) {
      nazovBunka = bunky.filter((c) => !c.querySelector("img") && !ceny(c.textContent).length)
        .sort((a, b) => cisty(b.textContent).length - cisty(a.textContent).length)[0] || null;
    }
    if (!img && !(nazovBunka && /p-name/.test(nazovBunka.className))) { ine++; continue; }
    if (!nazovBunka) continue;
    const riadkyNazvu = riadkyTextu(nazovBunka);
    const nazov = riadkyNazvu.find((r) => !JE_PRIPLATKY.test(r) && !JE_VARIANT.test(r)) || (img && cisty(img.getAttribute("alt"))) || "";
    const ul = nazovBunka.querySelector("ul.lcd-rozpis");
    let rozpis;
    if (ul) rozpis = rozpisZCartJs(ul);
    else {
      const ostatne = riadkyNazvu.filter((r) => r !== nazov);
      let priplatky = ostatne.filter((r) => JE_PRIPLATKY.test(r)).join(", ");
      const variant = ostatne.filter((r) => !JE_PRIPLATKY.test(r)).join(", ");
      // kamión: hodnoty z konfigurátora majú vo vnútri „ – “ („Čierna, čierne šitie – 11“) a lcdRozpis by ich rozdelil
      // ako nový príplatok. Oddeľovač Shoptetu je „ - “ (spojovník), preto sa pomlčka v hodnote dočasne chráni. Len pri
      // kamióne — košík kamión rozpisuje inak (truckOrderSummary), pri ostatných ostáva presne rozpis košíka.
      const kamion = /kami[oó]n|\btruck\b/i.test(nazov);
      const CHRANENA = "\u2060\u2013\u2060"; // pomlčka medzi „spojkami slov“ (nie \s) -> lcdRozpis ju nedelí
      if (kamion) priplatky = priplatky.replace(/\s\u2013\s/g, CHRANENA);
      rozpis = lcdRozpis({ variant, priplatky, cz: !!cz });
      if (kamion) rozpis = rozpis.map((x) => ({ n: x.n && x.n.split(CHRANENA).join(" \u2013 "), h: x.h.split(CHRANENA).join(" \u2013 ") }));
    }
    // množstvo a cena riadku: mimo bunky názvu, posledná cena v riadku = súčet riadku
    const mimoNazvu = bunky.filter((c) => c !== nazovBunka).map((c) => c.textContent).join(" | ");
    const mks = /(\d+(?:[.,]\d+)?)\s*(?:ks|kus\w*)\b/i.exec(mimoNazvu);
    const vsetkyCeny = ceny(mimoNazvu).filter((c) => !NIE_CENA_TEXT.test(c));
    const cenaT = vsetkyCeny[vsetkyCeny.length - 1] || null;
    let foto = null;
    if (img) {
      const kand = [img.getAttribute("data-src"), img.getAttribute("src")].map((x) => String(x || "").trim());
      foto = kand.find((x) => x && !/^data:/i.test(x)) || null;
    }
    polozky.push({ nazov: velkePrve(nazov, cz ? "cs" : "sk"), foto, ks: mks ? mks[1].replace(",", ".") : null, cenaText: cenaT, cena: cenaT ? cisloZCeny(cenaT) : null, rozpis });
  }
  return { polozky, ine };
}

/** Druh objednávky pre text kroku „Príprava a doručenie“: kamion | vzorky | auto. */
export function druhObjednavky(polozky) {
  const n = (polozky || []).map((p) => bezDiakritiky(p.nazov));
  if (n.some((x) => /kamion|truck/.test(x))) return "kamion";
  if (n.length && n.every((x) => /vzork/.test(x))) return "vzorky";
  return "auto";
}

const BLOKOVE = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|BR|BUTTON|DD|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
/**
 * Text pôvodného obsahu a hlásení Shoptetu (mimo nášho bloku a skriptov) — na rozpoznanie výsledku platby. Blokové prvky
 * (bunky, odseky, nadpisy) sú oddelené novým riadkom, aby sa „Zvolená platba“ v jednej bunke nespojila s vetou inde.
 */
export function textPovodneho(doc, koren, vynechaj) {
  const casti = [];
  const text = (el) => {
    let t = "";
    const prejdi = (n) => {
      if (n.nodeType === 3) { t += n.nodeValue; return; }
      if (n.nodeType !== 1 || SKRYTE_ZNACKY.test(n.tagName) || n.id === "lcd-dakujeme" || (vynechaj && n === vynechaj)) return;
      const blok = BLOKOVE.test(n.tagName);
      if (blok) t += "\n";
      n.childNodes.forEach(prejdi);
      if (blok) t += "\n";
    };
    prejdi(el);
    return t;
  };
  const pridaj = (el) => {
    if (!el || (vynechaj && (vynechaj === el || vynechaj.contains(el)))) return;
    casti.push(text(el));
  };
  pridaj(koren);
  doc.querySelectorAll(".messages, .msg, .flash-message").forEach((m) => { if (!koren || !koren.contains(m)) pridaj(m); });
  return casti.join("\n");
}

/**
 * Údaje ďakovnej stránky zo Shoptetu. -> { ok: true, udaje } alebo { ok: false, dovod } (fallback = pôvodná stránka).
 * udaje: { trh, cislo, doprava, platba, druh, suma, sumaText, mena, ucet, vs, qr, polozky, ine, stav, neuspech, odkaz, spat }
 * o: { zaplatenePodlaTextu } — len pre testy schváleného vzhľadu „zaplatené“; naživo platí ZAPLATENE_PODLA_TEXTU.
 */
export function citajUdaje(doc, trh, vynechaj, o) {
  const koren = korenPovodneho(doc);
  if (!koren) return { ok: false, dovod: "chýba obsah stránky" };
  const pary = paryPopisov(koren, vynechaj);
  // dve rôzne hodnoty toho istého popisu (iný blok s účtom, VS, sumou) -> nevieme, ktorá platí (V2)
  for (const k of ["cislo", "suma", "ucet", "vs"]) if (pary[k] && pary[k].rozne) return { ok: false, dovod: "dva rôzne údaje: " + k };
  const cislo = pary.cislo ? pary.cislo.h.replace(/\s+/g, "") : "";
  if (!/^[A-Za-z0-9][A-Za-z0-9\-\/]{2,30}$/.test(cislo)) return { ok: false, dovod: "číslo objednávky" };
  const sumaText = pary.suma ? ceny(pary.suma.h)[0] || "" : ""; // práve jedna cena s menou (HODNOTY.suma, V1)
  const suma = cisloZCeny(sumaText);
  if (!(suma > 0)) return { ok: false, dovod: "suma" };
  const platba = pary.platba ? pary.platba.h : "";
  const druh = druhPlatby(platba);
  if (!druh) return { ok: false, dovod: "spôsob platby" + (platba ? " (" + platba + ")" : "") };
  const ucet = pary.ucet ? pary.ucet.h : null;
  const vs = pary.vs ? pary.vs.h.replace(/\s+/g, "") : null;
  const maPrevod = !!(ucet && /\d/.test(ucet) && vs && /^\d{1,10}$/.test(vs));
  if (druh === "prevod" && !maPrevod) return { ok: false, dovod: "prevod bez čísla účtu alebo variabilného symbolu" };
  const { polozky, ine } = citajPolozky(koren, vynechaj, trh === "cz");
  // QR obrázok, ktorý vykreslil sám Shoptet (vlastný QR nerobíme — Michal 30. 10. 2026)
  const qr = Array.prototype.find.call(koren.querySelectorAll("img, canvas, svg"), (e) => {
    if (vynechaj && vynechaj.contains(e)) return false;
    const s = bezDiakritiky([e.getAttribute("class"), e.getAttribute("alt"), e.getAttribute("id"), e.tagName === "IMG" ? e.getAttribute("src") : ""].join(" "));
    return /\bqr/.test(s) || /qrcode|qr-?code|qr-?platba/.test(s);
  }) || null;
  const t = vysledokTextu(textPovodneho(doc, koren, vynechaj));
  const odkaz = druh === "karta" || druh === "online" ? odkazPlatby(koren, vynechaj) : null;
  const zaplatenePodlaTextu = o && o.zaplatenePodlaTextu != null ? !!o.zaplatenePodlaTextu : ZAPLATENE_PODLA_TEXTU;
  let stav;
  if (druh === "prevod") stav = "prevod";
  else if (druh === "dobierka") stav = "dobierka";
  // karta / online: náš blok len pri rozpoznanom tlačidle Shoptetu (zákazník má ako zaplatiť) a bez textu o úspechu
  // alebo čakaní; „zaplatené“ len pri jednoznačnom texte a zapnutom ZAPLATENE_PODLA_TEXTU; inak stránka Shoptetu (N1, N2)
  else if (odkaz && !t.uspech && !t.caka) stav = "neprebehla";
  else if (zaplatenePodlaTextu && !odkaz && t.uspech && !t.neuspech && !t.caka) stav = "zaplatene";
  else {
    const co = [odkaz ? "tlačidlo" : "bez tlačidla", t.uspech && "úspech", t.neuspech && "neúspech", t.caka && "čaká"].filter(Boolean);
    return { ok: false, dovod: "stav platby nie je jednoznačný (" + druh + ": " + co.join(", ") + ")" };
  }
  const spatEl = Array.prototype.find.call(koren.querySelectorAll(".order-complete-links a[href], a[href]"), (a) =>
    (!vynechaj || !vynechaj.contains(a)) && /^(spat|zpet|pokracovat v nakupe|pokracovat v nakupu|domov|uvod)/.test(bezDiakritiky(a.textContent)));
  return {
    ok: true,
    udaje: {
      trh, cislo, doprava: pary.doprava ? pary.doprava.h : "", platba, druh, suma, sumaText: cisty(sumaText), mena: menaZTextu(sumaText),
      ucet: maPrevod ? ucet : null, vs: maPrevod ? vs : null, qr, polozky, ine, stav, neuspech: t.neuspech, odkaz,
      spat: spatEl ? spatEl.getAttribute("href") : "/",
    },
  };
}

// ------------------------------------------------------------------ kopírovanie

/** Skopíruje text: Clipboard API, inak skrytá textarea + execCommand. -> Promise<boolean> */
export function kopiruj(text, doc) {
  const d = doc || document;
  const w = d.defaultView || window;
  const zalozne = () => {
    try {
      const ta = d.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
      d.body.appendChild(ta);
      ta.select();
      try { ta.setSelectionRange(0, text.length); } catch (e) {}
      let ok = false;
      try { ok = !!d.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    } catch (e) { return false; }
  };
  try {
    const cb = w.navigator && w.navigator.clipboard;
    if (cb && typeof cb.writeText === "function") return cb.writeText(text).then(() => true, () => zalozne());
  } catch (e) {}
  return Promise.resolve(zalozne());
}

// ------------------------------------------------------------------ kreslenie

const SVG = {
  fajkaPecat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#e0bd63" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fajkaB: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fajkaZ: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#2e7d32"/><path d="M7 12.3l3.3 3.3L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  karta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2" fill="none" stroke="#7c5f16" stroke-width="1.8"/><path d="M2.5 10h19M6.5 14.5h4" fill="none" stroke="#7c5f16" stroke-width="1.8" stroke-linecap="round"/></svg>',
  balik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" fill="none" stroke="#7c5f16" stroke-width="1.7" stroke-linejoin="round"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9M7.8 5.3l8.5 4.6" fill="none" stroke="#7c5f16" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  sipka: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  kopia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  telefon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-2 1.6a12 12 0 0 0 6.3 6.3l1.6-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="#e0bd63" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2" fill="none" stroke="#e0bd63" stroke-width="1.8"/><path d="M4 7l8 6 8-6" fill="none" stroke="#e0bd63" stroke-width="1.8" stroke-linejoin="round"/></svg>',
};

/** Suma do textu krokov s nezalomiteľnými medzerami („20 006 Kč“ v jednom kuse). */
const nezlom = (s) => cisty(s).replace(/ /g, " ");

/**
 * Nový blok #lcd-dakujeme (návrh 4) z údajov. Texty len cez textContent (hodnoty Shoptetu nikdy ako HTML),
 * ikony sú pevné SVG. QR obrázok Shoptetu sa prevezme (img klon, canvas/svg presun), vlastný sa nekreslí.
 */
export function postavBlok(doc, u, T) {
  const d = doc;
  const el = (tag, cls, text) => {
    const e = d.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const svg = (kod) => { const s = el("span", "lcd-dak-ikona"); s.innerHTML = SVG[kod]; return s.firstChild; };
  const stav = u.stav;
  const sumaT = nezlom(u.sumaText);
  const karta = u.druh === "karta";
  const koren = el("div", "lcd-dak lcd-dak--" + stav); // div, nie section: téma Shoptetu má na mobile section{padding:0;margin:0 !important}
  koren.id = "lcd-dakujeme";
  koren.setAttribute("lang", T.jazyk);
  koren.setAttribute("data-lcd-dak-stav", stav);

  // --- tmavý pás
  const hero = el("div", "lcd-dak-hero");
  const heroIn = el("div", "lcd-dak-hero__in");
  const pecat = el("div", "lcd-dak-pecat");
  pecat.setAttribute("aria-hidden", "true");
  pecat.appendChild(svg("fajkaPecat"));
  heroIn.appendChild(pecat);
  heroIn.appendChild(el("p", "lcd-dak-hero__cislo", T.cisloObjednavky(u.cislo)));
  heroIn.appendChild(el("h1", "lcd-dak-hero__h1", T.nadpis));
  const heroText = stav === "prevod" ? T.hero.prevod : stav === "zaplatene" ? (karta ? T.hero.zaplatene : T.hero.zaplateneIna)
    : stav === "dobierka" ? T.hero.dobierka : T.hero.neprebehla;
  heroIn.appendChild(el("p", "lcd-dak-hero__text", heroText));
  hero.appendChild(heroIn);
  koren.appendChild(hero);

  const obsah = el("div", "lcd-dak-obsah");
  koren.appendChild(obsah);
  const mriezka = el("div", "lcd-dak-mriezka");
  obsah.appendChild(mriezka);

  // --- údaje na prevod (účet, VS, suma) s Kopírovať
  const udajeZoznam = () => {
    const ul = el("ul", "lcd-dak-udaje");
    const riadok = (kluc, nazov, hodnota, kopia, suma) => {
      const li = el("li", "lcd-dak-udaj" + (suma ? " lcd-dak-udaj--suma" : ""));
      li.appendChild(el("span", "lcd-dak-udaj__n", nazov));
      const h = el("span", "lcd-dak-udaj__h");
      // číslo účtu: zlom až za lomkou („2002871802/<wbr>2010“)
      String(hodnota).split("/").forEach((cast, i, vsetky) => {
        h.appendChild(d.createTextNode(cast + (i < vsetky.length - 1 ? "/" : "")));
        if (i < vsetky.length - 1) h.appendChild(d.createElement("wbr"));
      });
      li.appendChild(h);
      const b = el("button", "lcd-dak-kopia");
      b.type = "button";
      b.setAttribute("data-kopia", kopia);
      b.setAttribute("aria-label", T.kopirovatAria[kluc]);
      b.innerHTML = SVG.kopia;
      b.appendChild(d.createTextNode(T.kopirovat));
      li.appendChild(b);
      ul.appendChild(li);
    };
    riadok("ucet", T.ucet, u.ucet, u.ucet);
    riadok("vs", T.vs, u.vs, u.vs);
    const n = u.suma;
    riadok("suma", T.suma, u.sumaText, Math.abs(n - Math.round(n)) < 0.005 ? String(Math.round(n)) : n.toFixed(2).replace(".", ","), true);
    return ul;
  };
  const qrBlok = () => {
    if (!u.qr) return null;
    const box = el("div", "lcd-dak-qr");
    const obr = u.qr.tagName === "IMG" ? u.qr.cloneNode(false) : u.qr; // obrázok klon, canvas/svg presun (klon canvasu je prázdny)
    obr.removeAttribute("id");
    obr.classList.add("lcd-dak-qr__obr");
    box.appendChild(obr);
    box.appendChild(el("p", "lcd-dak-qr__text", T.qrNavod));
    return box;
  };

  // --- PLATBA
  const platba = el("div", "lcd-dak-karta lcd-dak-platba");
  platba.setAttribute("role", "region");
  platba.setAttribute("aria-labelledby", "lcd-dak-platba-h");
  const stitok = (text, id) => { const p = el("p", "lcd-dak-platba__stitok", text); if (id) p.id = id; return p; };
  const titul = (text) => { const h = el("h2", "lcd-dak-platba__titul", text); h.id = "lcd-dak-platba-h"; return h; };
  const sumaEl = () => el("p", "lcd-dak-platba__suma", u.sumaText);
  const nazovPlatby = karta ? T.stitokKarta : u.platba;
  if (stav === "prevod") {
    platba.classList.add("lcd-dak-platba--prevod");
    const hl = el("div", "lcd-dak-platba__hl");
    hl.appendChild(stitok(T.stitokPrevod, "lcd-dak-platba-h"));
    hl.appendChild(sumaEl());
    hl.appendChild(el("p", "lcd-dak-platba__navod", T.navodPrevod));
    platba.appendChild(hl);
    platba.appendChild(udajeZoznam());
    const q = qrBlok();
    if (q) platba.appendChild(q);
  } else {
    const vrch = el("div", "lcd-dak-platba__vrch");
    const hl = el("div", "lcd-dak-platba__hl");
    vrch.appendChild(hl);
    const znak = el("span", "lcd-dak-znak");
    znak.setAttribute("aria-hidden", "true");
    if (stav === "zaplatene") {
      platba.classList.add("lcd-dak-platba--ok");
      hl.appendChild(stitok(nazovPlatby));
      hl.appendChild(titul(T.zaplateneTitul));
      hl.appendChild(sumaEl());
      znak.classList.add("lcd-dak-znak--ok");
      znak.appendChild(svg("fajkaB"));
      vrch.appendChild(znak);
      platba.appendChild(vrch);
      const potvrd = el("p", "lcd-dak-potvrd");
      potvrd.appendChild(svg("fajkaZ"));
      potvrd.appendChild(el("span", null, T.zaplatenePotvrd));
      platba.appendChild(potvrd);
    } else if (stav === "dobierka") {
      hl.appendChild(stitok(T.stitokDobierka));
      hl.appendChild(titul(T.dobierkaTitul));
      hl.appendChild(sumaEl());
      hl.appendChild(el("p", "lcd-dak-platba__navod", T.dobierkaNavod));
      znak.classList.add("lcd-dak-znak--zlaty");
      znak.appendChild(svg("balik"));
      vrch.appendChild(znak);
      platba.appendChild(vrch);
    } else {
      // neprebehla / čaká (karta, Apple Pay, Google Pay, rýchla platba)
      hl.appendChild(stitok(nazovPlatby));
      hl.appendChild(titul(T.neprebehlaTitul));
      hl.appendChild(sumaEl());
      if (u.neuspech) hl.appendChild(el("p", "lcd-dak-platba__navod", T.neprebehlaNavod));
      znak.classList.add("lcd-dak-znak--zlaty");
      znak.appendChild(svg("karta"));
      vrch.appendChild(znak);
      platba.appendChild(vrch);
      if (u.odkaz) {
        const text = karta ? (u.neuspech ? T.zaplatitKartouZnova : T.zaplatitKartou) : (u.neuspech ? T.zaplatitZnova : T.zaplatit);
        let b;
        const href = u.odkaz.tagName === "A" ? u.odkaz.getAttribute("href") : null;
        if (href) {
          b = el("a", "lcd-dak-btn-zeleny lcd-dak-platba__btn", text);
          b.href = href;
          const ciel = u.odkaz.getAttribute("target");
          if (ciel) b.setAttribute("target", ciel);
        } else {
          // tlačidlo formulára Shoptetu: klik na pôvodné (skryté) tlačidlo, odošle formulár Shoptetu
          b = el("button", "lcd-dak-btn-zeleny lcd-dak-platba__btn", text);
          b.type = "button";
          const povodne = u.odkaz;
          b.addEventListener("click", () => { try { povodne.click(); } catch (e) {} });
        }
        platba.appendChild(b);
      }
      if (u.ucet && u.vs) {
        const det = el("details", "lcd-dak-prevod");
        const sum = el("summary", null, T.aleboPrevodom + " ");
        sum.appendChild(svg("sipka"));
        det.appendChild(sum);
        const vnut = el("div", "lcd-dak-prevod__in");
        vnut.appendChild(el("p", "lcd-dak-platba__navod", T.navodPrevod));
        vnut.appendChild(udajeZoznam());
        const q = qrBlok();
        if (q) vnut.appendChild(q);
        det.appendChild(vnut);
        platba.appendChild(det);
      }
    }
  }
  mriezka.appendChild(platba);

  // --- VAŠA OBJEDNÁVKA
  const obj = el("div", "lcd-dak-karta lcd-dak-objednavka");
  obj.setAttribute("role", "region");
  obj.setAttribute("aria-labelledby", "lcd-dak-obj-h");
  const objH = el("h2", "lcd-dak-karta__h", T.vasaObjednavka);
  objH.id = "lcd-dak-obj-h";
  obj.appendChild(objH);
  let tovar = 0, tovarOk = u.polozky.length > 0;
  u.polozky.forEach((p) => {
    const box = el("div", "lcd-dak-polozka" + (p.foto ? "" : " lcd-dak-polozka--bez-fotky"));
    if (p.foto) {
      const img = el("img", "lcd-dak-polozka__foto");
      img.src = p.foto;
      img.alt = "";
      img.width = 80;
      img.height = 80;
      img.loading = "lazy";
      box.appendChild(img);
    }
    const txt = el("div", "lcd-dak-polozka__txt");
    txt.appendChild(el("p", "lcd-dak-polozka__nazov", p.nazov));
    const c = el("div", "lcd-dak-polozka__cena");
    c.appendChild(el("span", null, p.ks ? T.kusy(p.ks) : ""));
    c.appendChild(el("b", null, p.cenaText || ""));
    txt.appendChild(c);
    box.appendChild(txt);
    if (p.rozpis && p.rozpis.length) box.appendChild(lcdRozpisEl(d, p.rozpis, "lcd-rozpis"));
    obj.appendChild(box);
    if (p.cena == null) tovarOk = false; else tovar += p.cena;
  });
  const suhrn = el("ul", "lcd-dak-suhrn");
  // „Doprava a platba“ = celkom − tovar, len keď sedia všetky riadky a nie je zľava ani iný riadok (inak by klamalo)
  const doprava = u.suma - tovar;
  if (tovarOk && !u.ine && doprava >= -0.005) {
    const li = el("li");
    const n = el("span", null, T.dopravaAPlatba);
    const popis = [u.doprava, u.platba].filter(Boolean).join(" · ");
    if (popis) n.appendChild(el("small", null, popis));
    li.appendChild(n);
    li.appendChild(el("span", null, Math.abs(doprava) < 0.005 ? T.zadarmo : cenaText(doprava, u.mena).replace(/ /g, " ")));
    suhrn.appendChild(li);
  }
  const spolu = el("li", "lcd-dak-suhrn__spolu");
  spolu.appendChild(el("span", null, T.spolu));
  spolu.appendChild(el("span", null, u.sumaText));
  suhrn.appendChild(spolu);
  obj.appendChild(suhrn);
  mriezka.appendChild(obj);

  // --- ČO BUDE ĎALEJ (4 kroky, bez lehoty dodania)
  const kroky = el("div", "lcd-dak-karta lcd-dak-kroky");
  kroky.setAttribute("role", "region");
  kroky.setAttribute("aria-labelledby", "lcd-dak-kroky-h");
  const krH = el("h2", "lcd-dak-karta__h", T.coBudeDalej);
  krH.id = "lcd-dak-kroky-h";
  kroky.appendChild(krH);
  const ol = el("ol", "lcd-dak-osa");
  let cislo = 0;
  const krok = (hotovo, nadpis, text, teraz) => {
    cislo++;
    const li = el("li", hotovo ? "lcd-dak-osa--hotovo" : teraz ? "lcd-dak-osa--teraz" : null);
    const bod = el("span", "lcd-dak-osa__bod", hotovo ? null : String(cislo));
    if (hotovo) bod.appendChild(svg("fajkaB"));
    li.appendChild(bod);
    const div = el("div");
    const b = el("b", null, nadpis);
    if (teraz) { b.appendChild(d.createTextNode(" ")); b.appendChild(el("em", null, T.teraz)); }
    div.appendChild(b);
    div.appendChild(el("span", "lcd-dak-osa__text", text));
    li.appendChild(div);
    ol.appendChild(li);
  };
  const druhObj = druhObjednavky(u.polozky);
  const dopravca = u.doprava && /kur[yi]r|kurier|dpd|gls|ppl|packeta|zasilkovn|posta|ups|fedex|dhl|sps|expres/i.test(bezDiakritiky(u.doprava)) ? u.doprava : null;
  const priprava = T.krokPripravaText(druhObj, dopravca);
  krok(true, T.krokPrijata, T.krokPrijataText);
  if (stav === "prevod") {
    krok(false, T.krokPlatbaPrevodom, T.krokPlatbaPrevodomText, true);
    krok(false, T.krokKonzultacia, T.krokKonzultaciaText);
    krok(false, T.krokPriprava, priprava);
  } else if (stav === "zaplatene") {
    krok(true, T.krokPlatbaPrijata, T.krokPlatbaPrijataText(sumaT));
    krok(false, T.krokKonzultacia, T.krokKonzultaciaText, true);
    krok(false, T.krokPriprava, priprava);
  } else if (stav === "dobierka") {
    krok(false, T.krokKonzultacia, T.krokKonzultaciaText, true);
    krok(false, T.krokPriprava, priprava);
    krok(false, T.krokPrevzatie, T.krokPrevzatieText(sumaT));
  } else {
    const textPlatby = u.odkaz ? (u.ucet ? T.krokPlatbaKartouAPrevodom : T.krokPlatbaKartou) : T.krokPlatbaCaka;
    krok(false, T.krokPlatba, textPlatby, true);
    krok(false, T.krokKonzultacia, T.krokKonzultaciaText);
    krok(false, T.krokPriprava, priprava);
  }
  kroky.appendChild(ol);
  // prevod: kroky pod mriežkou (platba a objednávka vedľa seba), ostatné stavy: kroky pod platbou v ľavom stĺpci
  if (stav === "prevod") obsah.appendChild(kroky);
  else { mriezka.classList.add("lcd-dak-mriezka--kroky"); mriezka.appendChild(kroky); }

  // --- KONTAKT
  const kontakt = el("div", "lcd-dak-kontakt");
  kontakt.setAttribute("role", "region");
  kontakt.setAttribute("aria-labelledby", "lcd-dak-kontakt-h");
  const kText = el("div");
  const kH = el("h2", null, T.kontaktNadpis);
  kH.id = "lcd-dak-kontakt-h";
  kText.appendChild(kH);
  kText.appendChild(el("p", null, T.kontaktText(u.cislo)));
  kontakt.appendChild(kText);
  const volby = el("div", "lcd-dak-kontakt__volby");
  const volba = (href, ikona, popis, hodnota) => {
    const a = el("a", "lcd-dak-kontakt__a");
    a.href = href;
    a.appendChild(svg(ikona));
    const s = el("span");
    s.appendChild(el("small", null, popis));
    s.appendChild(d.createTextNode(hodnota));
    a.appendChild(s);
    volby.appendChild(a);
  };
  volba(T.telefonHref, "telefon", T.telefonPopis, T.telefon);
  volba("mailto:" + T.email, "email", T.emailPopis, T.email);
  kontakt.appendChild(volby);
  obsah.appendChild(kontakt);

  // --- späť do obchodu (zelené = hlavné; pri tlačidle platby je hlavné to, späť ostane vedľajšie)
  const spat = el("div", "lcd-dak-spat");
  const a = el("a", u.odkaz && stav === "neprebehla" ? "lcd-dak-btn-vedlajsi" : "lcd-dak-btn-zeleny", T.spat);
  a.href = u.spat || "/";
  spat.appendChild(a);
  obsah.appendChild(spat);

  // Kopírovať: Clipboard API, inak záloha; pri neúspechu sa hodnota označí (skopíruje sa ručne)
  koren.querySelectorAll(".lcd-dak-kopia").forEach((b) => {
    const povodny = Array.prototype.slice.call(b.childNodes); // ikona + „Kopírovať“ (aj pri 2 rýchlych klikoch)
    b.addEventListener("click", () => {
      const text = b.getAttribute("data-kopia") || "";
      kopiruj(text, d).then((ok) => {
        if (!ok) {
          try {
            const h = b.parentNode.querySelector(".lcd-dak-udaj__h");
            const r = d.createRange();
            r.selectNodeContents(h);
            const s = (d.defaultView || window).getSelection();
            s.removeAllRanges();
            s.addRange(r);
          } catch (e) {}
          return;
        }
        b.classList.add("lcd-dak-kopia--hotovo");
        b.textContent = T.skopirovane;
        clearTimeout(b.__lcdDakTm);
        b.__lcdDakTm = setTimeout(() => {
          b.classList.remove("lcd-dak-kopia--hotovo");
          b.textContent = "";
          povodny.forEach((n) => b.appendChild(n));
        }, 1800);
      });
    });
  });
  return koren;
}

// ------------------------------------------------------------------ záznam na overenie (localStorage, nikam sa neposiela)

/** Pôvodné HTML hlavného obsahu bez skriptov (+ hlásenia Shoptetu mimo neho), max. MAX_ZNAKOV_ZAZNAMU znakov. */
export function htmlNaZaznam(doc) {
  try {
    const k = hlavnyObsah(doc);
    if (!k) return null;
    const casti = [];
    const pridaj = (el) => {
      const c = el.cloneNode(true);
      c.querySelectorAll("script, noscript, #lcd-dakujeme").forEach((x) => x.remove());
      casti.push(c.outerHTML);
    };
    pridaj(k);
    doc.querySelectorAll(".messages, .msg, .flash-message").forEach((m) => { if (!k.contains(m) && !m.closest("#lcd-dakujeme")) pridaj(m); });
    let h = casti.join("\n<!-- lcd: hlásenie mimo obsahu -->\n");
    if (h.length > MAX_ZNAKOV_ZAZNAMU) h = h.slice(0, MAX_ZNAKOV_ZAZNAMU) + "\n<!-- lcd: skrátené -->";
    return h;
  } catch (e) {
    return null;
  }
}

/** Pridá záznam (posledných MAX_ZAZNAMOV) do úložiska. z: { html, url, telo, stav, dovod }. -> true = uložené. */
export function ulozZaznam(uloz, z, teraz) {
  try {
    if (!uloz || !z || !z.html) return false;
    let zoznam = [];
    try { zoznam = JSON.parse(uloz.getItem(KLUC_ZAZNAMU) || "[]"); } catch (e) { zoznam = []; }
    if (!Array.isArray(zoznam)) zoznam = [];
    const posledny = zoznam[zoznam.length - 1];
    if (posledny && posledny.html === z.html && posledny.url === z.url) return false; // obnovenie tej istej stránky
    zoznam.push({ datum: new Date(teraz || Date.now()).toISOString(), url: z.url, telo: z.telo || "", stav: z.stav || null, dovod: z.dovod || null, html: z.html });
    while (zoznam.length > MAX_ZAZNAMOV) zoznam.shift();
    // plné úložisko: najprv zahodiť staršie záznamy, potom vzdať
    for (;;) {
      try { uloz.setItem(KLUC_ZAZNAMU, JSON.stringify(zoznam)); return true; } catch (e) {
        if (zoznam.length <= 1) return false;
        zoznam.shift();
      }
    }
  } catch (e) {
    return false;
  }
}

// ------------------------------------------------------------------ skorý vzhľad a zapojenie

let skoryZaznam = null;
/**
 * Hneď pri načítaní bundla (koniec <body>, pred data.json a pred cart.js): zachytí pôvodné HTML na záznam a skryje
 * pôvodný obsah (visibility, html.lcd-opc-dakujeme-caka), aby neprebliklo. Volá ho opc/index.js LEN pri zapnutom kóde.
 * Poistka: keď sa do SKORO_LIMIT_MS nerozhodne (initDakujeme nebežal), obsah sa odkryje.
 */
export function dakujemeSkoro(doc, o) {
  try {
    if (!jeDakujeme(doc)) return false;
    skoryZaznam = htmlNaZaznam(doc);
    if (!korenPovodneho(doc)) return false;
    const H = doc.documentElement;
    H.classList.add(TRIEDA_CAKA);
    const okno = doc.defaultView || window;
    okno.setTimeout(() => { H.classList.remove(TRIEDA_CAKA); }, (o && o.limitMs) || SKORO_LIMIT_MS);
    return true;
  } catch (e) {
    return false;
  }
}
/** Vypnuté (data.json / flag): skorý vzhľad späť, zachytené HTML zahodiť. */
export function zrusDakujemeSkoro(doc) {
  skoryZaznam = null;
  try { const H = (doc || document).documentElement; if (H.classList.contains(TRIEDA_CAKA)) H.classList.remove(TRIEDA_CAKA); } catch (e) {}
}

/**
 * Ďakovná stránka pri zapnutom kóde (opc/index.js initOpc). ctx: { trh, stav, chyby }.
 * Uloží záznam, prečíta údaje; keď chýbajú kľúčové -> pôvodná stránka (ctx.stav = "dakujeme-povodna"),
 * inak vloží #lcd-dakujeme pred pôvodný obsah a ten skryje triedou (ctx.stav = "dakujeme-<stav>").
 */
export function initDakujeme(ctx, o) {
  const doc = (o && o.doc) || document;
  const H = doc.documentElement;
  const okno = doc.defaultView || window;
  const T = TEXTY_DAKUJEME[ctx.trh];
  let vysledok = null;
  try {
    if (doc.getElementById("lcd-dakujeme")) { ctx.stav = "dakujeme-uz-je"; return ctx; }
    const r = citajUdaje(doc, ctx.trh, null);
    vysledok = r;
    if (!r.ok || !T) {
      ctx.stav = "dakujeme-povodna";
      ctx.dovod = r.ok ? "texty" : r.dovod;
      return ctx;
    }
    const blok = postavBlok(doc, r.udaje, T);
    const povodne = korenPovodneho(doc);
    povodne.parentNode.insertBefore(blok, povodne);
    povodne.classList.add(TRIEDA_POVODNE);
    H.classList.add(TRIEDA);
    ctx.stav = "dakujeme-" + r.udaje.stav;
    ctx.udaje = { cislo: r.udaje.cislo, suma: r.udaje.suma, platba: r.udaje.platba, stav: r.udaje.stav, polozky: r.udaje.polozky.length };
    return ctx;
  } catch (e) {
    // chyba pri kreslení: nič nesmie ostať skryté
    try { const b = doc.getElementById("lcd-dakujeme"); if (b) b.remove(); } catch (x) {}
    try { const p = korenPovodneho(doc); if (p) p.classList.remove(TRIEDA_POVODNE); } catch (x) {}
    H.classList.remove(TRIEDA);
    ctx.stav = "dakujeme-chyba";
    ctx.chyby.push(String((e && e.message) || e));
    return ctx;
  } finally {
    H.classList.remove(TRIEDA_CAKA);
    try {
      const html = skoryZaznam || htmlNaZaznam(doc);
      skoryZaznam = null;
      let uloz = null;
      try { uloz = (o && o.uloz) || okno.localStorage; } catch (e) { uloz = null; }
      ulozZaznam(uloz, {
        html, url: okno.location.origin + okno.location.pathname, telo: doc.body ? doc.body.className : "",
        stav: vysledok && vysledok.ok ? vysledok.udaje.stav : null, dovod: vysledok && !vysledok.ok ? vysledok.dovod : null,
      });
    } catch (e) {}
  }
}
