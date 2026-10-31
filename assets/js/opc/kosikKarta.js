// Jedna stránka pokladne (Michal 31. 10. 2026 „Sprav to takto“, náhľady scratchpad/opc/nahlad-7: navrh-vybrat-postup.png
// a navrh-box-po-tuknuti.png): karta „Váš košík“ navrchu pokladne. Samostatný košík sa pri zapnutom OPC preskočí
// (opc/kosik.js), všetko je tu — položky s fotkou, cenou a rozpisom ako v košíku (cart.js / functions/kosikRozpis.js),
// „− počet +“, „Odobrať“ a pod produktmi ponuka k setu so zlatým „Vybrať“ (lcdKosikDoplnok.js kartaVybrat). Pridaný
// doplnok sa pripíše k produktu ako odrážka s krížikom (vlozKriziky) a z ponuky zmizne.
//
// Každá zmena košíka (počet, odobratie, doplnok) najprv uloží vyplnené údaje formulára (sessionStorage), potom ide cez
// /kosik/ znova rovno do pokladne (Step1Validate s rovnakou dopravou a platbou, opc/kosik.js) a údaje sa vrátia do
// prázdnych polí. Súhlasy sa nevracajú — zákazník ich zaškrtne sám.
// Karta je síce v #order-form (Shoptet ho má okolo celej stránky), ale jej vstupy majú form = pomocný formulár mimo neho
// (V.FORM_NIC) a udalosti change / input z karty ďalej nejdú: s objednávkou sa z karty nikdy nič neodošle.
import { lcdRozpis, lcdRozpisEl } from "../functions/kosikRozpis.js";
import { autoRiadku, popisAuta, ulozistaAuta } from "../functions/autoPamat.js";
import * as D from "../lcdKosikDoplnok.js";
import { KLUC_BEZ_KARTY } from "./kosik.js";

export const KLUC_FORMULARA = "lcdOpcFormular";
export const FORMULAR_PLATI_MS = 30 * 60 * 1000;
/** Prepínače, ktoré otvárajú ďalšie polia (firma, iná adresa doručenia) — vracajú sa pred textovými poľami. */
export const PREPINACE = ["company-shopping", "another-shipping"];
export const KAM_PO_ZMENE = "/kosik/";

const cisty = (t) => String(t || "").replace(/\s+/g, " ").trim();

function el(doc, tag, attrs, deti) {
  const e = doc.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) return;
    if (k === "text") e.textContent = v;
    else if (k === "class") e.className = v;
    else e.setAttribute(k, v === true ? "" : v);
  });
  (deti || []).forEach(function (d) { if (d) e.appendChild(typeof d === "string" ? doc.createTextNode(d) : d); });
  return e;
}

// ------------------------------------------------------------------ údaje formulára cez obnovenie stránky

/** Pole, ktoré sa ukladá: textové polia, výbery a prepínače PREPINACE; nie skryté, heslá, rádiá ani súhlasy. */
function ukladat(e) {
  if (!e || !e.name || e.disabled) return false;
  const t = (e.type || "").toLowerCase();
  if (e.tagName === "SELECT" || e.tagName === "TEXTAREA") return true;
  if (t === "checkbox") return PREPINACE.indexOf(e.id) > -1;
  return ["text", "email", "tel", "number", "search", ""].indexOf(t) > -1 && e.tagName === "INPUT";
}

/** Vyplnené údaje formulára -> sessionStorage (pred zmenou košíka). -> počet uložených polí. */
export function ulozFormular(form, ss, teraz) {
  const polia = [];
  Array.prototype.forEach.call(form.elements, function (e) {
    if (!ukladat(e)) return;
    if (e.type === "checkbox") { if (e.checked) polia.push({ n: e.name, id: e.id, c: true }); return; }
    if (cisty(e.value) !== "") polia.push({ n: e.name, id: e.id || null, v: e.value });
  });
  try { ss.setItem(KLUC_FORMULARA, JSON.stringify({ t: teraz || Date.now(), polia: polia })); } catch (e) { return 0; }
  return polia.length;
}

/**
 * Uložené údaje späť do PRÁZDNYCH polí (vyplnené Shoptetom / zákazníkom sa neprepisujú), prepínače najprv (otvoria
 * polia firmy / inej adresy). Záznam sa po prečítaní zmaže; starší ako FORMULAR_PLATI_MS nič. -> počet vrátených polí.
 */
export function obnovFormular(form, ss, teraz) {
  let z = null;
  try { z = JSON.parse(ss.getItem(KLUC_FORMULARA) || "null"); ss.removeItem(KLUC_FORMULARA); } catch (e) { z = null; }
  if (!z || !Array.isArray(z.polia) || (teraz || Date.now()) - (z.t || 0) > FORMULAR_PLATI_MS) return 0;
  const doc = form.ownerDocument;
  const pole = function (p) {
    const e = (p.id && doc.getElementById(p.id)) || form.elements.namedItem(p.n);
    return e && e.tagName && form.contains(e) ? e : null;
  };
  const udalost = function (e, typ) { try { e.dispatchEvent(new Event(typ, { bubbles: true })); } catch (x) {} };
  let n = 0;
  z.polia.filter(function (p) { return p.c; }).forEach(function (p) {
    const e = pole(p);
    if (!e || e.type !== "checkbox" || e.checked) return;
    e.checked = true;
    udalost(e, "change");
    n++;
  });
  z.polia.filter(function (p) { return !p.c; }).forEach(function (p) {
    const e = pole(p);
    if (!e || !ukladat(e) || e.type === "checkbox" || cisty(e.value) !== "") return;
    if (e.tagName === "SELECT" && !Array.prototype.some.call(e.options, function (o) { return o.value === p.v; })) return;
    e.value = p.v;
    udalost(e, "input");
    udalost(e, "change");
    n++;
  });
  return n;
}

// ------------------------------------------------------------------ položky košíka

/** Riadky obsahu košíka (GetCartContent) s fotkou a cenou riadku: rozoberRiadky + fotka, cena, kľúč položky. */
export function polozkyZObsahu(docObsahu) {
  const riadky = D.rozoberRiadky(docObsahu);
  const tr = docObsahu.querySelectorAll('tr.removeable, tr[data-micro="cartItem"]');
  return riadky.map(function (r, i) {
    const t = tr[i];
    const img = t && t.querySelector(".cart-p-image img");
    let foto = img ? img.getAttribute("data-src") || img.getAttribute("src") || "" : "";
    if (!/^https?:\/\//i.test(foto)) foto = "";
    const cena = t && t.querySelector('.p-total .price-final, [data-testid="cartPrice"]');
    return Object.assign({}, r, {
      foto: foto,
      cena: cena ? cisty(cena.textContent) : "",
      kluc: t ? (t.getAttribute("data-micro-identifier") || "") + "|" + (t.getAttribute("data-micro-sku") || "") : "",
    });
  });
}

/** Názov s veľkým začiatočným písmenom („luxusné autokoberce …“ zo Shoptetu). */
export function nazovPolozky(n, jazyk) {
  const s = cisty(n);
  return s ? s.charAt(0).toLocaleUpperCase(jazyk || "sk") + s.slice(1) : s;
}

/** Je to kamión (rozpis kreslí cart.js po skupinách — berie sa hotový zo súhrnu)? */
const jeKamion = (p) => /\btruck\b|kami[oó]n/i.test(p.text || "") || /kamion/i.test(p.href || "");

/** Rozpis položky ako v košíku: Auto navrchu (autokoberce, rohož, box), farby vrstiev, príplatky. */
export function rozpisPolozky(doc, p, cz) {
  const riadky = lcdRozpis({ variant: p.variant, priplatky: p.sur, cz: cz });
  const href = String(p.href || "");
  if (riadky.length && !/vzorkovnik|poukaz/i.test(href) && /autokoberce|koberced?-do-kufr|boxi?-do-kufr/i.test(href)) {
    const u = ulozistaAuta();
    const auto = popisAuta(autoRiadku(u.ss, u.ls, { priceId: p.priceId, sur: p.sur }));
    if (auto) riadky.unshift({ n: "Auto", h: auto });
  }
  return riadky.length ? lcdRozpisEl(doc, riadky, "lcd-rozpis") : null;
}

/** Kamión: hotový rozpis zo súhrnu (cart.js) podľa kľúča a poradia; bez „Zobraziť viac“ a skrytých tried A1. */
function rozpisKamionaZoSuhrnu(box, p, poradie) {
  if (!box) return null;
  const [id, sku] = p.kluc.split("|");
  const polozky = Array.prototype.filter.call(box.querySelectorAll(".cart-items .cart-item[data-micro-identifier]"), function (e) {
    return e.getAttribute("data-micro-identifier") === id && (e.getAttribute("data-micro-sku") || "") === sku;
  });
  const e = polozky[poradie] || polozky[0];
  const zdroj = e && Array.prototype.find.call(e.querySelectorAll(".cart-item-name span.main-link-surcharges"), function (s) {
    return !!s.querySelector(".lcd-truck-cart-summary, .info-wrap");
  });
  if (!zdroj) return null;
  const k = zdroj.cloneNode(true);
  k.removeAttribute("id");
  k.classList.add("lcd-opc-kk__kamion");
  k.querySelectorAll("[id]").forEach(function (x) { x.removeAttribute("id"); });
  k.querySelectorAll(".lcd-opc-dalsi").forEach(function (x) { x.classList.remove("lcd-opc-dalsi"); });
  k.querySelectorAll("button, .lcd-opc-zob").forEach(function (x) { x.remove(); });
  return k;
}

// ------------------------------------------------------------------ karta

/**
 * Karta „Váš košík“ pred kartou Kontakt. o: { form, box (#summary-box), T (opc/texty.js), forma (id pomocného formulára),
 * ss (sessionStorage), obsah (náhrada GetCartContent pre testy) } -> { karta, hotovo: Promise<počet položiek | null> }.
 */
export function initKosikKarta(ctx, o) {
  const doc = o.form.ownerDocument;
  const T = o.T;
  const R = D.rolePonuky();
  const TD = D.textyPonuky(ctx.trh);
  const cz = ctx.trh === "cz";
  const jazyk = cz ? "cs" : "sk";
  const kontakt = o.form.querySelector("fieldset.co-contact-information");
  if (!kontakt || !kontakt.parentNode) return null;
  let ss = o.ss || null;
  if (!ss) { try { ss = window.sessionStorage; } catch (e) { ss = null; } }

  // údaje z predchádzajúcej zmeny košíka späť (pred kartou: polia sú už na stránke)
  if (ss) { try { obnovFormular(o.form, ss); } catch (e) {} }

  const obsah = el(doc, "div", { id: "lcd-doplnok", class: "lcd-opc-kk__obsah", "aria-busy": "true" });
  // div, nie section: staré globálne `section { padding: 0 !important }` Shoptetu (do 768 px) by karte zrušilo okraj
  const karta = el(doc, "div", { id: "lcd-opc-kosik", class: "lcd-opc-karta lcd-opc-karta--hotovo lcd-opc-kosikkarta", role: "region", "aria-labelledby": "lcd-opc-h-kosik" }, [
    el(doc, "h2", { id: "lcd-opc-h-kosik", "data-lcd-opc-cislo": "1", text: T.kosikNadpis }),
    obsah,
  ]);
  kontakt.parentNode.insertBefore(karta, kontakt);
  // nič z karty nejde do formulára objednávky (Shoptet na change / input posiela údaje zákazníka na server)
  ["change", "input"].forEach(function (t) { karta.addEventListener(t, function (e) { e.stopPropagation(); }); });

  // háčik výmeny doplnku (lcdKosikDoplnok.js spustiVymenu): údaje uložiť a cez košík znova rovno sem
  D.nastavPredObnovou(function () {
    if (ss) ulozFormular(o.form, ss);
    return KAM_PO_ZMENE;
  });

  const stav = el(doc, "p", { class: "lcd-dop__stav lcd-opc-kk__stav", role: "status", "aria-live": "polite" });
  const H = doc.documentElement;
  // zámok karty: zmena počtu / Odobrať (bezi) a odosielanie objednávky (opc/krok2.js zamkniOdoslanie); disabled stav
  // prvkov sa po odomknutí vráti presne (sivé „−“ pri 1 kuse, sivé „Pridať k setu“ bez veľkosti)
  let bezi = false, odosiela = false, zamky = 0;
  const povodne = new Map();
  const zamkniPrvky = function (koren) {
    koren.querySelectorAll("button, input").forEach(function (b) { if (!povodne.has(b)) povodne.set(b, b.disabled); b.disabled = true; });
  };
  const zamkni = function (ano) {
    if (ano) {
      if (zamky++ === 0) zamkniPrvky(obsah);
      obsah.setAttribute("aria-busy", "true");
      return;
    }
    if (zamky === 0 || --zamky > 0) return;
    povodne.forEach(function (d, b) { b.disabled = d; });
    povodne.clear();
    obsah.removeAttribute("aria-busy");
  };
  /** Smie sa košík meniť (počet, Odobrať, Vybrať, krížik)? Nie počas zmeny, výmeny doplnku ani odosielania objednávky. */
  const smie = function () {
    const k2 = ctx.krok2;
    return !bezi && !odosiela && !H.classList.contains("lcd-dop-bezi") && !(k2 && typeof k2.odosielanie === "function" && k2.odosielanie());
  };
  D.nastavSmieZacat(smie);
  const zmenPocet = function (p, q) {
    if (!smie()) return;
    bezi = true;
    zamkni(true);
    // trieda výmeny: „Objednať“ medzitým počká (opc/krok2.js blokovane -> vymenaBezi), stránka potom ide cez košík
    H.classList.add("lcd-dop-bezi");
    stav.classList.remove("lcd-dop__stav--chyba");
    stav.textContent = T.menimKosik;
    ctx.meraj("lcd_opc_kosik", { lcd_opc_akcia: q > 0 ? "pocet" : "odobrat", lcd_opc_pocet: q });
    D.zmenPocetRiadku(p, q).then(function (ok) {
      if (ok) {
        if (ss) ulozFormular(o.form, ss);
        location.replace(KAM_PO_ZMENE);
        return;
      }
      throw new Error("kosik");
    }).catch(function () {
      bezi = false;
      H.classList.remove("lcd-dop-bezi");
      zamkni(false);
      stav.classList.add("lcd-dop__stav--chyba");
      stav.textContent = T.chybaPoctu;
    });
  };

  const polozkaEl = function (p, poradie) {
    const nazov = nazovPolozky(p.nazov, jazyk);
    const foto = p.foto ? el(doc, "img", { class: "lcd-opc-kk__foto", src: p.foto, alt: "", width: "100", height: "100", decoding: "async" }) : el(doc, "span", { class: "lcd-opc-kk__foto", "aria-hidden": "true" });
    if (p.foto) foto.addEventListener("error", function () { foto.style.visibility = "hidden"; });
    const rozpis = jeKamion(p) ? rozpisKamionaZoSuhrnu(o.box, p, poradie) : rozpisPolozky(doc, p, cz);
    const menej = el(doc, "button", { type: "button", form: o.forma, class: "lcd-opc-kk__krok", "aria-label": T.pocetMenej, disabled: !(p.q > 1), "data-lcd-opc-min": !(p.q > 1) }, [el(doc, "span", { "aria-hidden": "true", text: "−" })]);
    const viac = el(doc, "button", { type: "button", form: o.forma, class: "lcd-opc-kk__krok", "aria-label": T.pocetViac }, [el(doc, "span", { "aria-hidden": "true", text: "+" })]);
    const odobrat = el(doc, "button", { type: "button", form: o.forma, class: "lcd-opc-kk__odobrat", "aria-label": T.odobratAria(nazov), text: T.odobratPolozku });
    menej.addEventListener("click", function () { if (p.q > 1) zmenPocet(p, p.q - 1); });
    viac.addEventListener("click", function () { zmenPocet(p, p.q + 1); });
    odobrat.addEventListener("click", function () { zmenPocet(p, 0); });
    const telo = el(doc, "div", { class: "lcd-opc-kk__telo" }, [
      el(doc, "div", { class: "lcd-opc-kk__hore" }, [
        el(doc, "b", { class: "lcd-opc-kk__nazov", text: nazov }),
        p.cena ? el(doc, "b", { class: "lcd-opc-kk__cena", text: p.cena }) : null,
      ]),
      rozpis,
      el(doc, "div", { class: "lcd-opc-kk__ovl" }, [
        el(doc, "span", { class: "lcd-opc-kk__pocet", role: "group", "aria-label": T.pocetNazov }, [menej, el(doc, "output", { form: o.forma, text: String(p.q) }), viac]),
        odobrat,
      ]),
    ]);
    return el(doc, "li", { class: "lcd-opc-kk__polozka", "data-item": p.itemId }, [foto, telo]);
  };

  const nacitaj = o.obsah ? Promise.resolve(o.obsah) : D.obsahKosika();
  const hotovo = nacitaj.then(function (docObsahu) {
    const polozky = polozkyZObsahu(docObsahu);
    if (!polozky.length) throw new Error("prazdny");
    const zoznam = el(doc, "ul", { class: "lcd-opc-kk__polozky" });
    const poradia = {};
    const miesta = {};
    polozky.forEach(function (p) {
      const i = poradia[p.kluc] = (poradia[p.kluc] == null ? 0 : poradia[p.kluc] + 1);
      const li = polozkaEl(p, i);
      miesta[p.itemId] = li;
      zoznam.appendChild(li);
    });
    obsah.appendChild(zoznam);
    obsah.appendChild(stav);
    // hláška z predchádzajúcej výmeny doplnku („✓ Druhá vrstva Lux 10 je pridaná k Vášmu setu.“); úspech po chvíli zmizne.
    // Výmena na polovici (nový set aj pôvodný v košíku, h.stary): pôvodný set zvýrazniť, pokyn na „Odobrať“ / počet −1
    // (v karte nie je krížik vpravo hore ako v košíku) a k nemu ponuku nekresliť (ako košík: vynechaj)
    const h = D.vezmiHotovo();
    const stary = h && h.typ === "chyba" && h.stary && miesta[h.stary] ? h.stary : null;
    if (stary) {
      const ps = polozky.find(function (x) { return x.itemId === stary; });
      miesta[stary].classList.add("lcd-opc-kk__polozka--zvyrazni");
      h.text = (/^Set bez dopl/i.test(h.text) ? T.ciastocneOdober : T.ciastocne) + " " + (ps && ps.q > 1 ? T.ciastocneZnizte : T.ciastocneOdoberte);
    }
    if (h) {
      const chyba = h.typ === "chyba";
      const p = el(doc, "p", { class: "lcd-opc-kk__hlaska" + (chyba ? " lcd-opc-kk__hlaska--chyba" : ""), role: chyba ? "alert" : "status", text: (chyba ? "" : "✓ ") + h.text });
      obsah.insertBefore(p, stav);
      if (!chyba) setTimeout(function () { p.classList.add("je-prec"); setTimeout(function () { p.remove(); }, 400); }, 6000);
    }
    if (!zamky) obsah.removeAttribute("aria-busy");
    // ponuka vypnutá v data.json (kosik_doplnky: false) / ?lcddoplnok=0 -> ako v košíku: ani ponuka, ani krížiky
    if (!R || ctx.ponukaVypnuta) return polozky.length;
    // ponuka k setu a krížiky pri doplnkoch: len vzhľad košíka — chyba / pomalá sieť nič nezastaví
    return D.pripravKontexty(polozky, R, { vynechaj: stary }).then(function (v) {
      v.ctxs.forEach(function (c) {
        const li = miesta[c.riadok.itemId];
        if (li && c.odobrat.length) {
          c.miestoOdober = li;
          D.vlozKriziky(c, R);
          if (zamky) zamkniPrvky(li); // dokreslené počas zmeny počtu / odosielania -> zamknuté ako zvyšok karty
        }
      });
      v.ponuky.forEach(function (c) {
        const k = D.kartaVybrat(c, R, { forma: o.forma, kSetu: v.ponuky.length > 1 ? TD.kSetu + (c.kSetu || "") : null });
        if (!k) return;
        obsah.appendChild(k);
        if (zamky) zamkniPrvky(k);
        D.merajZobrazenie(c, R);
      });
      return polozky.length;
    }, function () { return polozky.length; });
  }).catch(function (e) {
    // obsah košíka sa nedá načítať -> karta preč, pokladňa ostáva ako doteraz (súhrn má položky aj „Upraviť košík“);
    // čísla kariet späť od 1, „Upraviť košík“ na skutočný košík a košík sa v tejto karte prehliadača 30 min nepreskakuje
    karta.remove();
    D.nastavPredObnovou(null);
    D.nastavSmieZacat(null);
    H.classList.remove("lcd-opc-jedna-karta");
    o.form.querySelectorAll("h2[data-lcd-opc-cislo]").forEach(function (h2) {
      const n = Number(h2.getAttribute("data-lcd-opc-cislo"));
      if (n > 1) h2.setAttribute("data-lcd-opc-cislo", String(n - 1));
    });
    if (ss) { try { ss.setItem(KLUC_BEZ_KARTY, String(Date.now())); } catch (x) {} }
    const up = doc.querySelector(".lcd-opc-upravit");
    if (up) up.setAttribute("href", "/kosik/");
    ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "kosik-karta-" + String((e && e.message) || e).slice(0, 40), lcd_opc_miesto: "krok2" });
    return null;
  });
  H.classList.add("lcd-opc-jedna-karta");
  return {
    karta: karta, hotovo: hotovo,
    bezi: function () { return bezi; },
    /** opc/krok2.js: odosielanie objednávky beží / skončilo — karta zamknutá, košík sa medzitým nemení */
    zamkniOdoslanie: function (ano) { if (!!ano === odosiela) return; odosiela = !!ano; zamkni(odosiela); },
  };
}
