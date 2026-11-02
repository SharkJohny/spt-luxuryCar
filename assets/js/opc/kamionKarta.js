// Jedna stránka pokladne (opc/kosikKarta.js): kamión 640 / 2452 v karte „Váš košík“ (Michal 2. 11. 2026, snímka z PC: „vôbec
// tu nevidím tú rekapituláciu objednávky … a takisto by tam mala byť aj potom ako príplatok, ak som si nevybral … tapacír na
// dvere, aby mi to ponúklo“; upresnenie: „má fungovať úplne takisto ako rekapitulácia objednávky na osobné autá … vidno hlavne
// materiál, z ktorého to bude vyrobené, a následne potom Zobraziť viac“).
//
// 1) Rozpis: zoznam ul.lcd-rozpis ako pri osobných autách (zlaté odrážky), hneď vidno Vozidlo a „Typ a farba materiálu“,
//    zvyšok po „Zobraziť viac“ (opc/polozky.js hnedVidno). Predtým sa rozpis kopíroval zo súhrnu #summary-box, ktorý ho v tej
//    chvíli ešte nemal -> karta ukázala len názov a cenu. Teraz sa skladá priamo:
//    - zo súhrnu konfigurátora (sessionStorage truckOrderSummary — z neho je aj blok poznámky objednávky), keď je v košíku
//      jediný kamión a súhrn sedí s príplatkami riadku (materiál a farba), inak
//    - z príplatkov riadku košíka (text zo servera; vozidlo v nich nie je, takže bez neho).
// 2) Ponuka „Tapacír dverí“ (len TIR — tapacír majú len kamióny „(TIR)“, dodávka nie; vozidlo sa musí dať zistiť, inak nič):
//    výmena riadku ako pri doplnkoch setu (lcdKosikDoplnok.js spustiVymenu: pridať -> overiť cenu a text -> zmazať pôvodný),
//    nový riadok = všetky pôvodné príplatky + tapacír „Rovnaké ako koberce“ bez nášivky na dverách — presne tie hodnoty, ktoré
//    by poslal konfigurátor (kamion/shoptet.js resolveValue). Cena z príplatkov stránky produktu (nič natvrdo). Po výmene
//    sa do súhrnu doplní časť TAPACÍR DVERÍ v rovnakom tvare ako z konfigurátora (order-summary.mjs addSameDoorPanelsToSummary)
//    — formát poznámky pre Jánov export sa nemení. Pri akejkoľvek neistote sa ponuka neukáže (fail-closed).
import { parseTruckOrderSummary, addSameDoorPanelsToSummary, truckSummaryTexts } from "../truck-konfigurator/order-summary.mjs";
import { SELECTY, normalizeOptionText, resolveValue } from "../components/konfigurator1v/kamion/shoptet.js";
import { jeTir, PRECIARKNUTE_EUR, PRECIARKNUTE_CZK } from "../components/konfigurator1v/kamion/data.js";
import { lcdRozpisEl } from "../functions/kosikRozpis.js";
import * as D from "../lcdKosikDoplnok.js";

export const KLUC_SUHRNU = "truckOrderSummary";
export const KLUC_VOZIDLA = "truckVehicle";
const FOTO = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/kosik/tapacir-dveri.jpg";

export const TEXTY = {
  sk: {
    tapacir: "Tapacír dverí",
    tapMaterial: "Tapacír – materiál",
    tapLem: "Tapacír – lemovanie",
    tapNasivka: "Tapacír – nášivka",
    tapNasTyp: "Tapacír – typ nášivky",
    tapNasNit: "Tapacír – farba nášivky",
    akoKoberce: "rovnaký ako koberčeky",
    nadpis: "Doplňte svoj kamión",
    pod: "za cenu s kobercami",
    meno: "Tapacír dverí",
    popis: "rovnaký ako koberce · šofér aj spolujazdec",
    alt: "Tapacír dverí kamióna, ilustračná fotka",
    hotovo: "Tapacír dverí je pridaný k Vášmu kamiónu.",
    ciastocne: "Tapacír je pridaný, pôvodné koberce bez neho však ostali v košíku.",
    odoberte: "Odoberte, prosím, zvýraznenú položku tlačidlom „Odobrať“.",
    znizte: "Znížte, prosím, počet zvýraznenej položky o 1.",
  },
  cz: {
    tapacir: "Čalounění dveří",
    tapMaterial: "Čalounění – materiál",
    tapLem: "Čalounění – lemování",
    tapNasivka: "Čalounění – nášivka",
    tapNasTyp: "Čalounění – typ nášivky",
    tapNasNit: "Čalounění – barva nášivky",
    akoKoberce: "stejné jako koberečky",
    nadpis: "Doplňte svůj kamion",
    pod: "za cenu s koberečky",
    meno: "Čalounění dveří",
    popis: "stejné jako koberečky · řidič i spolujezdec",
    alt: "Čalounění dveří kamionu, ilustrační fotka",
    hotovo: "Čalounění dveří je přidané k Vašemu kamionu.",
    ciastocne: "Čalounění je přidané, původní koberečky bez něj však zůstaly v košíku.",
    odoberte: "Odeberte prosím zvýrazněnou položku tlačítkem „Odebrat“.",
    znizte: "Snižte prosím počet zvýrazněné položky o 1.",
  },
};
export function texty(trh) { return TEXTY[trh] || TEXTY.sk; }

const cisty = (t) => String(t == null ? "" : t).normalize("NFC").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
/** „Vyberie sa v konfigurátore“ / „Vybere se v konfigurátoru“ = hodnota, ktorú admin ešte nemá (shoptet.js najdiZastupnuMoznost). */
const zastupna = (t) => /\bv konfiguratoru$/.test(normalizeOptionText(t));
const jeKamion = (p) => /\btruck\b|kami[oó]n/i.test((p && p.text) || "") || /kamion/i.test((p && p.href) || "");
export { jeKamion };

// ------------------------------------------------------------------ príplatky riadku podľa mien parametrov (bez mapy produktu)

/**
 * Text príplatkov riadku košíka („Príplatky: Typ materiálu - …, Farba materiálu - …“) -> { kľúč SELECTY: hodnota }. Delí sa
 * podľa presných mien parametrov (SK aj CZ), nie podľa čiarky — hodnota „čierna, čierne šitie – 11“ má čiarku vo vnútri.
 */
export function hodnotyPriplatkov(sur) {
  const t = cisty(sur).replace(/^p[rř][ií]platky\s*:\s*/i, "");
  const tn = t.toLowerCase();
  if (!t || tn.length !== t.length) return {};
  const najdene = [];
  Object.keys(SELECTY).forEach(function (k) {
    let prvy = null;
    SELECTY[k].forEach(function (meno) {
      const kluc = meno.toLowerCase() + " - ";
      let i = tn.indexOf(kluc);
      while (i >= 0 && !(i === 0 || tn.slice(i - 2, i) === ", ")) i = tn.indexOf(kluc, i + 1);
      if (i >= 0 && (!prvy || i < prvy.zac)) prvy = { k: k, zac: i, hod: i + kluc.length };
    });
    if (prvy) najdene.push(prvy);
  });
  najdene.sort(function (a, b) { return a.zac - b.zac; });
  const out = {};
  najdene.forEach(function (a, i) {
    const b = najdene[i + 1];
    const h = cisty(t.slice(a.hod, b ? b.zac - 2 : t.length));
    if (h && !zastupna(h)) out[a.k] = h;
  });
  return out;
}

const ANO = (t) => /^(ano|áno)\b/i.test(cisty(t));
const ROVNAKE = (t) => /^(rovnak|stejn)/i.test(cisty(t));
const bezNasivky = (t) => cisty(t).replace(/^(nášivka|nášivky)\s+/i, "");
/** „Bez nite“ / „Bez nitě“ = na tom mieste nášivka nie je -> do rozpisu nejde (živá kontrola 2. 11.: „Farba nášiviek na boky: Bez nite“ pri „Len stred“). */
const sNitou = (t) => (t && !/^bez nit/.test(normalizeOptionText(t)) ? t : "");

/** Skupiny ako parseTruckOrderSummary zo samotných príplatkov riadku (vozidlo v nich nie je; vozidlo = text alebo null). */
export function skupinyZPriplatkov(sur, jazyk, vozidlo) {
  const v = hodnotyPriplatkov(sur);
  const X = truckSummaryTexts(jazyk);
  const L = X.labels;
  const skupiny = [];
  if (vozidlo) skupiny.push({ heading: X.headings.vehicle, items: [{ label: L.vehicle, value: cisty(vozidlo) }] });
  const k = [];
  const pridaj = function (zoznam, label, value) { if (value) zoznam.push({ label: label, value: value }); };
  pridaj(k, L.materialColor, [v.material, v.farba].filter(Boolean).join(" – "));
  pridaj(k, L.edgingColor, v.lemovanie);
  pridaj(k, L.embroideryPlacement, v.nasivky && v.nasivky.replace(/\s*\((bal[ií]k|bal[ií]ček)\)\s*$/i, ""));
  pridaj(k, L.sidePatchType, v.bokyTyp && bezNasivky(v.bokyTyp));
  pridaj(k, L.sidePatchColor, sNitou(v.bokyNit));
  pridaj(k, L.centrePatchType, v.stredTyp && bezNasivky(v.stredTyp));
  pridaj(k, L.centrePatchColor, sNitou(v.stredNit));
  if (k.length) skupiny.push({ heading: X.headings.carpets, items: k });
  if (v.tapacir && ANO(v.tapacir)) {
    const mat = k.length && k[0].label === L.materialColor ? k[0].value : "";
    const d = [];
    pridaj(d, L.materialColor, v.tapMaterial && ROVNAKE(v.tapMaterial) ? X.sameMaterial + (mat ? " – " + mat : "")
      : [v.tapMaterial, v.tapFarba].filter(Boolean).join(" – "));
    pridaj(d, L.edgingColor, v.tapLem && ROVNAKE(v.tapLem) ? X.sameEdging + (v.lemovanie ? " – " + v.lemovanie : "") : v.tapLem);
    const nas = v.tapNasivka ? ANO(v.tapNasivka) : false;
    pridaj(d, L.doorPatches, nas ? X.yes : X.no);
    if (nas) {
      pridaj(d, L.doorPatchType, v.tapNasTyp && bezNasivky(v.tapNasTyp));
      pridaj(d, L.doorPatchColor, v.tapNasNit);
    }
    skupiny.push({ heading: X.headings.doors, items: d });
  }
  return skupiny;
}

// ------------------------------------------------------------------ údaje kamióna (súhrn konfigurátora alebo príplatky)

const polozkaSkupiny = function (skupiny, re, label) {
  for (const g of skupiny) {
    if (re && !re.test(g.heading)) continue;
    const x = g.items.find(function (i) { return i.label === label; });
    if (x) return x.value;
  }
  return null;
};
const KOBERCE = /^KOBER/i;
const DVERE = /^TAPAC[IÍ]R DVE/i;

/**
 * Sedí súhrn konfigurátora s príplatkami riadku? Materiál zo súhrnu musí začínať typom materiálu z riadku a obsahovať jeho
 * farbu (ak ju riadok má). Riadok bez materiálu (nečitateľné príplatky) -> súhrnu sa verí. Porovnáva sa cez
 * normalizeOptionText (SK = CS): CZ konfigurátor píše do súhrnu „Prémiová syntetická koža – prešívaná“, Shoptet 2452 má
 * „Prémiová syntetická kůže – prošívaná“ (živá kontrola 2. 11. 2026).
 */
export function suhrnSedi(skupinySuhrnu, sur, jazyk) {
  const v = hodnotyPriplatkov(sur);
  if (!v.material) return true;
  const m = polozkaSkupiny(skupinySuhrnu, KOBERCE, truckSummaryTexts(jazyk).labels.materialColor);
  if (!m) return false;
  const n = (t) => " " + normalizeOptionText(t) + " ";
  return n(m).indexOf(n(v.material).trimEnd()) === 0 && (!v.farba || n(m).indexOf(n(v.farba)) > -1);
}

/** Má riadok tapacír „Rovnaké ako koberce“ bez nášivky na dverách (tak, ako ho pridá ponuka)? */
export function maTapacirAkoKoberce(sur) {
  const v = hodnotyPriplatkov(sur);
  return !!(v.tapacir && ANO(v.tapacir) && v.tapMaterial && ROVNAKE(v.tapMaterial) && (!v.tapFarba || ROVNAKE(v.tapFarba)) &&
    v.tapLem && ROVNAKE(v.tapLem) && !(v.tapNasivka && ANO(v.tapNasivka)));
}

function citaj(ss, k) { try { return ss ? ss.getItem(k) : null; } catch (e) { return null; } }

/**
 * Údaje kamióna riadku p: { skupiny, vozidlo, zoSuhrnu }. o: { ss (sessionStorage), jazyk ("sk" | "cs"), jediny (v košíku je
 * práve jeden kamión) }. Súhrn konfigurátora sa použije len pri jedinom kamióne a keď sedí s príplatkami; tapacír pridaný
 * v pokladni (riadok ho má, súhrn nie) sa do súhrnu doplní — z neho ide blok do poznámky objednávky.
 */
export function udajeKamiona(p, o) {
  const jazyk = o.jazyk === "cs" ? "cs" : "sk";
  const X = truckSummaryTexts(jazyk);
  let suhrn = o.jediny ? citaj(o.ss, KLUC_SUHRNU) : null;
  let skupiny = suhrn ? parseTruckOrderSummary(suhrn) : [];
  if (skupiny.length && !suhrnSedi(skupiny, p.sur, jazyk)) skupiny = [];
  if (skupiny.length && !skupiny.some(function (g) { return DVERE.test(g.heading); }) && maTapacirAkoKoberce(p.sur)) {
    const novy = addSameDoorPanelsToSummary(suhrn);
    if (novy !== suhrn) {
      try { o.ss.setItem(KLUC_SUHRNU, novy); suhrn = novy; skupiny = parseTruckOrderSummary(novy); } catch (e) {}
    }
  }
  if (skupiny.length) {
    return { skupiny: skupiny, vozidlo: polozkaSkupiny(skupiny, null, X.labels.vehicle) || (o.jediny ? citaj(o.ss, KLUC_VOZIDLA) : null), zoSuhrnu: true };
  }
  // bez súhrnu: vozidlo z konfigurátora len pri jedinom kamióne a bez súhrnu, ktorý by nesedel (iný kamión)
  const vozidlo = o.jediny && !suhrn ? citaj(o.ss, KLUC_VOZIDLA) : null;
  return { skupiny: skupinyZPriplatkov(p.sur, jazyk, vozidlo), vozidlo: vozidlo, zoSuhrnu: false };
}

/** Vozidlo pre zákazníka ako v konfigurátore (data.js meno): bez „(TIR)“ / „(dodávka)“, roky s pomlčkou „2022–2025“. Poznámka objednávky ostáva bez zmeny. */
const vozidloNaZobrazenie = (t) => cisty(t).replace(/\s*\((TIR|dodávka)\)/gi, "").replace(/(\d{4})\s*-\s*(\d{4})/g, "$1–$2");

/**
 * Riadky rozpisu [{ n, h }] zo skupín: vozidlo a koberčeky ako v súhrne (bez „Bez nášivky“), tapacír jedným riadkom
 * „Tapacír dverí: rovnaký ako koberčeky“, alebo po častiach s „Tapacír – …“ (rovnaké popisy ako koberčeky by sa plietli).
 */
export function riadkyRozpisu(skupiny, jazyk, trh) {
  const X = truckSummaryTexts(jazyk === "cs" ? "cs" : "sk");
  const T = texty(trh);
  const L = X.labels;
  const out = [];
  skupiny.forEach(function (g) {
    if (DVERE.test(g.heading)) {
      const h = function (label) { const x = g.items.find(function (i) { return i.label === label; }); return x ? x.value : ""; };
      const rovnake = ROVNAKE(h(L.materialColor)) && ROVNAKE(h(L.edgingColor)) && h(L.doorPatches) !== X.yes;
      if (rovnake) { out.push({ n: T.tapacir, h: T.akoKoberce }); return; }
      const mena = {};
      mena[L.materialColor] = T.tapMaterial;
      mena[L.edgingColor] = T.tapLem;
      mena[L.doorPatches] = T.tapNasivka;
      mena[L.doorPatchType] = T.tapNasTyp;
      mena[L.doorPatchColor] = T.tapNasNit;
      g.items.forEach(function (i) {
        const hod = ROVNAKE(i.value) ? i.value.split(" – ")[0] : i.value;
        out.push({ n: mena[i.label] || i.label, h: hod });
      });
      return;
    }
    g.items.forEach(function (i) {
      if (KOBERCE.test(g.heading) && i.value === X.noPatch) return;
      out.push({ n: i.label, h: i.label === L.vehicle ? vozidloNaZobrazenie(i.value) : i.value });
    });
  });
  return out;
}

/** Rozpis kamióna do karty (ul.lcd-rozpis ako pri autách) alebo null. */
export function rozpisKamiona(doc, p, o) {
  const u = udajeKamiona(p, o);
  const riadky = riadkyRozpisu(u.skupiny, o.jazyk, o.trh);
  if (!riadky.length) return null;
  const ul = lcdRozpisEl(doc, riadky, "lcd-rozpis");
  ul.classList.add("lcd-opc-kk__kamion-rozpis");
  return ul;
}

// ------------------------------------------------------------------ ponuka tapacíru

// stav konfigurátora „Áno, chcem aj tapacír dverí“ + „Rovnaké ako koberce“ (★) bez nášivky na dverách
const STAV_TAPACIR = { doorPanelChoice: "ano", doorSameAsCarpet: { material: true, lemovanie: true }, doorWantsNasivka: false };
const KLUCE_TAPACIRU = ["tapacir", "tapMaterial", "tapFarba", "tapLem", "tapNasivka", "tapNasTyp", "tapNasNit"];

/** Možnosť parametra mapy pre hľadaný text — ako shoptet.js findMatchingOption (najprv presná zhoda, potom obsahuje). */
export function najdiMoznost(param, hladany) {
  if (!param || !hladany) return null;
  const h = normalizeOptionText(hladany);
  const ids = param.p || Object.keys(param.o);
  const presne = ids.find(function (id) { return normalizeOptionText(param.o[id].t) === h; });
  if (presne) return presne;
  return ids.find(function (id) { const t = normalizeOptionText(param.o[id].t); return t && (t.includes(h) || h.includes(t)); }) || null;
}

/** Id parametra mapy podľa kľúča SELECTY (meno SK aj CZ, bez veľkosti písmen) alebo null. */
export function idParametra(mapa, kluc) {
  const mena = (SELECTY[kluc] || []).map(function (n) { return n.toLowerCase(); });
  return Object.keys(mapa.params).find(function (id) { return mena.indexOf(cisty(mapa.params[id].n).toLowerCase()) > -1; }) || null;
}

/**
 * Ponuka tapacíru pre riadok p (rozoberRiadky) a mapu produktu (mapaZFormulara) -> { volby, zmena, rozdiel } alebo null
 * (tapacír už má, príplatky nesedia s mapou, chýba parameter / hodnota, cena nevie). Čistá funkcia (tools/test-kamion-tapacir.mjs).
 */
export function ponukaTapaciru(p, mapa) {
  if (!mapa || !mapa.params || !p || !p.sur) return null;
  const rb = D.rozoberPriplatky(p.sur, mapa);
  if (!rb.ok) return null;
  const idTap = idParametra(mapa, "tapacir");
  if (!idTap) return null;
  const sTap = rb.volby[idTap] !== undefined ? mapa.params[idTap].o[rb.volby[idTap]] : null;
  if (sTap && ANO(sTap.t)) return null; // tapacír už má
  const zmena = {};
  for (const k of KLUCE_TAPACIRU) {
    const id = idParametra(mapa, k);
    if (!id) { if (k === "tapacir") return null; continue; }
    const oid = najdiMoznost(mapa.params[id], resolveValue(mapa.params[id].n, STAV_TAPACIR));
    if (!oid) return null;
    zmena[id] = oid;
  }
  const rozdiel = D.rozdielCeny(rb.volby, zmena, mapa);
  if (!rozdiel || !(rozdiel.s > 0)) return null;
  return { volby: rb.volby, zmena: zmena, rozdiel: rozdiel };
}

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

function meraj(udalost, data) {
  try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: udalost }, data)); } catch (e) {}
}

/**
 * Karta ponuky tapacíru vo vzhľade ponuky k setu (.lcd-vyb, kartaVybrat): fotka, „Tapacír dverí“, cena a úspora, zlaté /
 * zelené „Pridať“ podľa štýlu ponuky. c = { riadok, mapa, volby, zmena, rozdiel }, o = { R, forma }. -> element
 */
export function kartaTapaciru(doc, c, o) {
  const R = o.R;
  const T = texty(R.trh);
  // texty chýb výmeny (lcdKosikDoplnok.js) s kamiónom namiesto setu
  const TV = Object.assign({}, D.textyPonuky(R.trh), {
    chybaCiastocna: T.ciastocne + " " + T.odoberte,
    chybaCiastocnaViac: T.ciastocne + " " + T.znizte,
  });
  const id = "lcd-kam-tap";
  const k = el(doc, "div", { class: "lcd-vyb lcd-vyb--kamion", "data-item": c.riadok.itemId, role: "group", "aria-labelledby": id + "-h" });
  k.appendChild(el(doc, "div", { class: "lcd-vyb__hlava" }, [
    el(doc, "h3", { class: "lcd-vyb__nadpis", id: id + "-h", text: T.nadpis }),
    el(doc, "span", { class: "lcd-vyb__pod", text: T.pod }),
  ]));
  const stav = el(doc, "p", { class: "lcd-dop__stav lcd-vyb__stav", role: "status", "aria-live": "polite" });
  const samo = (R.mena === "CZK" ? PRECIARKNUTE_CZK : PRECIARKNUTE_EUR).tapacir;
  const usetri = samo && samo > c.rozdiel.s + 0.5 ? TV.usetrite + " " + D.cenaText(samo - c.rozdiel.s, R) : null;
  const mini = el(doc, "img", { class: "lcd-vyb__mini", src: FOTO, alt: T.alt, width: "152", height: "190", decoding: "async" });
  mini.addEventListener("error", function () { mini.style.visibility = "hidden"; });
  const btn = el(doc, "button", { type: "button", form: o.forma || null, class: "lcd-vyb__btn", "data-lcd-vyb": "tapacir", "aria-describedby": id + "-m" }, [el(doc, "span", { text: TV.vybTlacidlo })]);
  k.appendChild(el(doc, "ul", { class: "lcd-vyb__zoznam" }, [
    el(doc, "li", { class: "lcd-vyb__riadok", "data-doplnok": "tapacir" }, [
      el(doc, "div", { class: "lcd-vyb__pas" }, [
        mini,
        el(doc, "span", { class: "lcd-vyb__text" }, [
          el(doc, "span", { class: "lcd-vyb__meno", id: id + "-m" }, [el(doc, "b", { text: T.meno })]),
          el(doc, "span", { class: "lcd-vyb__cena" }, [el(doc, "b", { text: D.cenaText(c.rozdiel.s, R, true) }), usetri ? el(doc, "span", { text: " · " + usetri }) : null]),
          el(doc, "span", { class: "lcd-vyb__popis", text: T.popis }),
        ]),
        btn,
      ]),
    ]),
  ]));
  k.appendChild(stav);
  btn.addEventListener("click", function () {
    meraj("lcd_set_doplnok_klik", { lcd_doplnok: "kamion_tapacir", lcd_trh: R.trh, lcd_set_sku: c.riadok.sku || null, lcd_miesto: "pokladna" });
    D.spustiVymenu({ riadok: c.riadok, mapa: c.mapa, volby: c.volby }, { typ: "kamion_tapacir", kod: "kamion_tapacir", hotovo: T.hotovo },
      c.zmena, c.rozdiel, TV, R, stav, k);
  });
  return k;
}

/**
 * Ponuka tapacíru do karty pre položky košíka: jediný kamión TIR (vozidlo zo súhrnu / konfigurátora) bez tapacíru, mapa
 * príplatkov zo stránky produktu. o: { R, ss, jazyk, forma, doc }. -> Promise<element | null> (chyba = null).
 */
export async function ponukaVKarte(polozky, o) {
  const kamiony = polozky.filter(jeKamion);
  if (kamiony.length !== 1 || !o.R) return null;
  const p = kamiony[0];
  if (!p.itemId || !p.priceId || !p.href || !p.sur || !(p.q >= 1)) return null;
  const u = udajeKamiona(p, { ss: o.ss, jazyk: o.jazyk, jediny: true });
  if (!jeTir(u.vozidlo)) return null;
  if (u.skupiny.some(function (g) { return DVERE.test(g.heading); })) return null;
  const mapa = D.mapaZFormulara(await D.stiahniDokument(new URL(p.href, location.href).pathname));
  const pon = ponukaTapaciru(p, mapa);
  if (!pon) return null;
  meraj("lcd_set_doplnok_zobrazenie", { lcd_doplnok: "kamion_tapacir", lcd_trh: o.R.trh, lcd_set_sku: p.sku || null, lcd_miesto: "pokladna" });
  return kartaTapaciru(o.doc || document, { riadok: p, mapa: mapa, volby: pon.volby, zmena: pon.zmena, rozdiel: pon.rozdiel }, o);
}
