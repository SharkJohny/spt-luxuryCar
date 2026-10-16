// Ceny a príplatky INÝCH (sesterských) produktov pre nový konfigurátor 1V (T0.1, 14. 10. 2026). JADRO.
// Použitie: dlaždice vzoru rohoží („v cene / + 10 €“ = cena sesterskej stránky − vlastná), pás setu (príplatok kufra
// na jednovrstvovom produkte toho istého vzoru), čísla v obsahu pod konfigurátorom (obsah-cisla.js, plan.md §2.4).
//
// Zdroj = živá stránka produktu (GET cez stiahniDokument z lcdKosikDoplnok.js, ten istý ako porovnanie v košíku):
//   cena      = [itemprop=price] (cenaStranky) — základná cena „od“ (variant bez príplatkov),
//   príplatky = selecty formulára (mapaZFormulara) — { pid, params: { <id>: { n, o: { <value>: { t, fp, ap } }, p } }, vpar, kom },
//   bezna     = má produkt v admine bežnú cenu (Shoptet vtedy v cene stránky vykreslí .price-standard; rovnaké pravidlo ako
//               ctx.cena().maBeznuCenu) — bez nej web odporúčanú cenu neukazuje (613, D2), takže ju nesmie ukázať ani 1V.
// Vlastná stránka sa nesťahuje (číta sa aktuálny dokument). Výsledok sa drží v localStorage 24 h (každý prístup
// v try/catch; súkromný režim / plné úložisko = len bez cache). Nič natvrdo: ceny ani ID parametrov.
// Kľúč cache v2 (16. 10. 2026): pribudlo „bezna“ — záznamy v1 ho nemajú, preto sa nečítajú.
// Pri importe sa nič nespúšťa. Chyba siete -> null (volajúci ukáže prvok bez čísla alebo ho skryje).
import { stiahniDokument, cenaStranky, mapaZFormulara } from "../../lcdKosikDoplnok.js";
import { PARAMETRE } from "./ctx.js";
import { najdiProdukt } from "./produkty.js";

const TTL = 24 * 3600 * 1000;
const KLUC = "lcd1vStranka:v2:"; // + cesta (localStorage je podľa domény -> SK a CZ sa nemiešajú)
const bezi = new Map();

function cesta(url) {
  try { return new URL(url, location.href).pathname; } catch (e) { return String(url || ""); }
}
function lsCitaj(k) {
  try {
    const v = JSON.parse(localStorage.getItem(k) || "null");
    return v && v.t && Date.now() - v.t < TTL ? v : null;
  } catch (e) { return null; }
}
function lsPis(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* plné / zakázané úložisko: bez cache */ }
}

/** Bežná cena v admine: .price-standard v cene stránky (ako ctx.cena(); nie štítok zľavy na fotke ani iné produkty). */
function maBeznuCenu(doc) {
  try {
    return !!doc.querySelector(".p-info-wrapper .p-final-price-wrapper .price-standard, #product-detail-form .p-final-price-wrapper .price-standard");
  } catch (e) { return false; }
}

/** { cena, mapa, bezna } stránky produktu (cesta alebo URL); vlastná stránka z aktuálneho dokumentu. Chyba -> { cena: null, mapa: null, bezna: false }. */
export function stranka(url) {
  const c = cesta(url);
  if (!c) return Promise.resolve({ cena: null, mapa: null, bezna: false });
  if (typeof location !== "undefined" && c === location.pathname) {
    let v = { cena: null, mapa: null, bezna: false };
    try { v = { cena: cenaStranky(document), mapa: mapaZFormulara(document), bezna: maBeznuCenu(document) }; } catch (e) { /* nič */ }
    return Promise.resolve(v);
  }
  const k = KLUC + c;
  const ulozene = lsCitaj(k);
  if (ulozene) return Promise.resolve({ cena: ulozene.cena, mapa: ulozene.mapa, bezna: ulozene.bezna === true });
  if (!bezi.has(k)) {
    bezi.set(k, stiahniDokument(c).then(function (doc) {
      const v = { cena: cenaStranky(doc), mapa: mapaZFormulara(doc), bezna: maBeznuCenu(doc) };
      if (v.cena || v.mapa) lsPis(k, { t: Date.now(), cena: v.cena, mapa: v.mapa, bezna: v.bezna });
      return v;
    }).catch(function () {
      return { cena: null, mapa: null, bezna: false };
    }).then(function (v) {
      bezi.delete(k);
      return v;
    }));
  }
  return bezi.get(k);
}

/** Základná cena produktu („od“, s DPH) zo živej stránky -> číslo alebo null. */
export function cenaProduktu(url) {
  return stranka(url).then(function (v) { return v.cena; });
}

/** Mapa príplatkov formulára produktu (mapaZFormulara) -> objekt alebo null. */
export function priplatkyProduktu(url) {
  return stranka(url).then(function (v) { return v.mapa; });
}

/**
 * Možnosti parametra z mapy príplatkov podľa mena (rovnaké kľúče ako ctx: kufor, rozlozenie, farbaBoxov, box1, box2,
 * box3, boxSolo, typ) -> [{ hodnota, text (bez ceny), cena (s DPH) }] v poradí selectu; parameter nie je -> [].
 * Príklad (pás setu na rohoži Classic Hexa): moznostiZMapy(mapa610, "kufor").find((o) => /dno/i.test(o.text) && !/bok/i.test(o.text)).cena
 */
export function moznostiZMapy(mapa, kluc) {
  const re = PARAMETRE[kluc];
  if (!mapa || !mapa.params || !re) return [];
  const id = Object.keys(mapa.params).find(function (i) { return re.test(String(mapa.params[i].n || "").trim()); });
  if (!id) return [];
  const p = mapa.params[id];
  const poradie = Array.isArray(p.p) ? p.p : Object.keys(p.o || {});
  return poradie.filter(function (v) { return p.o && p.o[v]; }).map(function (v) {
    const o = p.o[v];
    const c = Number(o.fp) > 0 ? Number(o.fp) : Number(o.ap) || 0;
    return { hodnota: v, text: o.t, cena: c };
  });
}

/** Cena produktu iného typu v tom istom vzore z registra (napr. cenaTypu(ctx.projectId, "kufor-premium", "hexa") -> 350). */
export function cenaTypu(projectId, typ, vzor) {
  const p = najdiProdukt(projectId, typ, vzor);
  return p ? cenaProduktu(p.url) : Promise.resolve(null);
}

/** Mapa príplatkov produktu iného typu v tom istom vzore z registra (napr. jedno-hexa 610 pre pás setu rohože 622). */
export function priplatkyTypu(projectId, typ, vzor) {
  const p = najdiProdukt(projectId, typ, vzor);
  return p ? priplatkyProduktu(p.url) : Promise.resolve(null);
}
