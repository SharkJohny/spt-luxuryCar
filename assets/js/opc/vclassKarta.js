// Jedna stránka pokladne (opc/kosikKarta.js): Mercedes triedy V (SK 646) v karte „Váš košík“ — rozpis po častiach setu,
// ponuka „Doplňte svoj set“ a krížiky pri pridaných častiach (Michal 8. 11. 2026, schválený plán kosik-vclass/plan.md).
//
// LEN riadky produktu 646: D.jeVclass = kód „VCLASS“ + priceId 68434 + SK, a mapa príplatkov musí mať productId 646.
// Iné produkty (sety Basic a Elite, rohože, boxy, vzorkovník, kamióny, poukážka) sem nikdy neprídu a ponuka setov
// (lcdKosikDoplnok.js pripravKontexty) riadok 646 naopak vynechá.
//
// Set triedy V je JEDEN riadok košíka s príplatkami (všetky ceny sú príplatky produktu 646 v Shoptete, tu žiadna nie je):
//   „Rozloženie“ (predné sedadlá, 2. a 3. rad s veľkosťou M / L / XL, bez predných …), „Rohož do kufra“, „Farba 2. vrstvy“,
//   „Box do kufra“ / „Prvý box z dvoch“ + „Druhý box z dvoch“, „Farba boxov do kufra“. Časť pridaná alebo odobratá =
//   výmena riadku ako pri doplnkoch setu (D.spustiVymenu: pridať nový riadok so všetkými pôvodnými príplatkami a zmenou ->
//   overiť cenu a text -> až potom zmazať pôvodný; nesedí -> nový preč, košík ako bol, hláška). Hodnoty príplatkov sú presne
//   tie, ktoré by poslal konfigurátor (vclass/app.js textRozlozenia / textRohoze) — položka objednávky je rovnaká, ako keby
//   si to zákazník naklikal, Jánov export ani poznámka sa nemenia. Produkt ostáva na 15 príplatkoch z 15.
// Ponuka (poradie, Michal 8. 11. 2026): 2. a 3. rad so štítkom „Najvýhodnejšie“, predné sedadlá (len keď v sete nie sú),
//   rohož do kufra, druhá vrstva (len s prednými sedadlami), box do kufra (len keď v sete žiadny nie je; druhý box nie).
//   Rohož ani box nie, keď je v košíku samostatná rohož / box (ako pri autách). Veľkosť pre 2. a 3. rad pri sete bez nich =
//   auto v košíku (autoPamat, Mercedes V Class M / L / XL a rovnaký rok); nedá sa zistiť alebo sú v košíku dva riadky
//   triedy V -> 2. a 3. rad sa neponúkne. „Ušetríte“ = samostatná cena z data.js SAMOSTATNE (rad 750 / 850 / 950, rohož 340,
//   predok 390 = odporúčaná, box 197–246) mínus príplatok zo Shoptetu.
// Krížik × pri 2. a 3. rade, rohoži, druhej vrstve a boxoch (rovnaká výmena späť); predné sedadlá len „Odobrať“ celej položky.
// Časť, po ktorej odobratí by v sete nič neostalo, krížik nemá. Pri akejkoľvek neistote (neznámy text, mapa bez príplatku,
// cena nevie) sa ponuka ani krížik neukážu (fail-closed). Kniha: docs/one-page-checkout-kniha.md, kapitola o triede V.
// Test: tools/test-kosik-vclass.mjs (dočasný košík, žiadna objednávka).
import * as D from "../lcdKosikDoplnok.js";
import { lcdPriplatky, lcdRozpisEl } from "../functions/kosikRozpis.js";
import { autoRiadku, popisAuta, ulozistaAuta } from "../functions/autoPamat.js";
import { DALSI } from "./polozky.js";
import { CDN, SELECTY, SAMOSTATNE, VELKOSTI, ROZ_PREDOK, ROZ_BEZ, rozSet, rozLen, rozRadRohoz, ROHOZ, ROHOZ_SAM, BEZ_DRUHEJ, BOXY, BOX_FARBY, luxKFarbe } from "../components/konfigurator1v/vclass/data.js";

export const jeVclass = D.jeVclass;

export const TEXTY = {
  nadpis: "Doplňte svoj set",
  pod: "za cenu v sete",
  kSetu: "K setu: ",
  predok: "Predné sedadlá",
  rad: "2. a 3. rad",
  rohoz: "Rohož do kufra",
  vrstva: "Druhá vrstva",
  box: "Box do kufra",
  menoRad: "Autokoberce pre 2. a 3. rad",
  menoPredok: "Autokoberce pre predné sedadlá",
  najvyhodnejsie: "Najvýhodnejšie",
  vrstvaPopis: "vpredu, zachytí vodu aj blato",
  hotovoRad: "2. a 3. rad je pridaný k Vášmu setu.",
  hotovoPredok: "Predné sedadlá sú pridané k Vášmu setu.",
  hotovoRohoz: "Rohož do kufra je pridaná k Vášmu setu.",
  hotovoVrstva: (l) => "Druhá vrstva " + l + " je pridaná k Vášmu setu.",
  hotovoBox1: "Box je pridaný k Vášmu setu.",
  hotovoBox2: "Boxy sú pridané k Vášmu setu.",
  odobranyRad: "2. a 3. rad je odstránený zo setu.",
  odobranaRohoz: "Rohož do kufra je odstránená zo setu.",
  odobranaVrstva: "Druhá vrstva je odstránená zo setu.",
  odobranyBox: "Box je odstránený zo setu.",
  odobranyBoxKus: (v) => "Box " + v + " je odstránený zo setu.",
};

// fotky triedy V v dlaždiciach (assets/img/1v/obsah, webp 480 + jpg; druhá vrstva = pedále triedy V, nie červeno-zelená)
const OBS = CDN + "obsah/";
export const FOTKY = {
  rad: "autokoberce-mercedes-v-class-cierne-2-rad-3-rad",
  predok: "autokoberce-mercedes-v-class-jednovrstvove-predok",
  rohoz: "koberec-do-kufra-mercedes-v-class",
  vrstva2: "autokoberce-mercedes-v-class-foto-pedale-druha-vrstva-2",
  box: "boxy-do-kufra-mercedes-v-class-jeden-box-2",
};

const N = (t) => D.normalizuj(t);
const SEP = /\s[-–]\s/;

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
  try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: udalost, lcd_trh: "sk", lcd_miesto: "pokladna" }, data)); } catch (e) {}
}

// ------------------------------------------------------------------ čisté funkcie (tools/test-kosik-vclass.mjs)

/**
 * Texty príplatkov „Rozloženie“ a „Rohož do kufra“ pre výber x = { p: predné sedadlá, r: 2. a 3. rad, k: rohož do kufra }
 * a veľkosť (len pri 2. a 3. rade) — presne ako konfigurátor (vclass/app.js textRozlozenia, textRohoze).
 */
export function textyCasti(x, vel) {
  const roz = x.p ? (x.r ? rozSet(vel) : ROZ_PREDOK) : x.r ? (x.k ? rozRadRohoz(vel) : rozLen(vel)) : ROZ_BEZ;
  const roh = x.k ? (x.p || x.r ? ROHOZ[0] : ROHOZ_SAM) : ROHOZ[1];
  return { roz: roz, roh: roh };
}

/** Výber { p, r, k, vel } z textov rozloženia a rohože (len kombinácie, ktoré pošle konfigurátor); iné -> null. */
export function castiZTextov(roz, roh) {
  if (!roz || !roh) return null;
  for (const p of [true, false]) for (const r of [true, false]) for (const k of [true, false]) {
    if (!p && !r && !k) continue;
    for (const vel of r ? VELKOSTI.map(function (v) { return v.v; }) : [null]) {
      const t = textyCasti({ p: p, r: r, k: k }, vel);
      if (N(t.roz) === N(roz) && N(t.roh) === N(roh)) return { p: p, r: r, k: k, vel: vel };
    }
  }
  return null;
}

/** Id parametra mapy s menom príplatku (data.js SELECTY) alebo null. */
export function idParametra(mapa, meno) {
  if (!mapa || !mapa.params) return null;
  const n = N(meno);
  const ids = Object.keys(mapa.params).filter(function (id) { return N(mapa.params[id].n) === n; });
  return ids.length === 1 ? ids[0] : null;
}

/** Id hodnoty parametra s presne týmto textom (jediná zhoda) alebo null. */
export function idHodnoty(mapa, pid, text) {
  const p = mapa && mapa.params && mapa.params[pid];
  if (!p || !text) return null;
  const z = (p.p || Object.keys(p.o)).filter(function (oid) { return p.o[oid] && N(p.o[oid].t) === N(text); });
  return z.length === 1 ? z[0] : null;
}

/** Mapa produktu 646 s príplatkami, ktoré ponuka potrebuje (uložená mapa v localStorage sa inak stiahne znova). */
export function platnaMapa(m) {
  return !!(m && String(m.pid) === D.VCLASS.pid && ["rozlozenie", "rohoz", "farba2", "farba"].every(function (k) { return idParametra(m, SELECTY[k]); }));
}

/** Farba z hodnoty „Vzor a farba 1. vrstvy“ („Diamond Line – Čierna, červené šitie“ -> „Čierna, červené šitie“). */
export function farbaKoberca(text) {
  const t = D.cisty(text);
  const i = t.indexOf(" – ");
  return i > 0 ? t.slice(i + 3) : null;
}

/**
 * Rozbor riadku košíka 646 podľa mapy príplatkov -> { ids, volby, p, r, k, vel, lux, boxy: ["M"] | ["S", "L"] | [], farba1, rok }
 * alebo null (iný produkt, neznámy text, nekonzistentný výber — napr. druhá vrstva bez predných sedadiel).
 */
export function rozborVclass(sur, mapa) {
  if (!platnaMapa(mapa)) return null;
  const ids = {};
  Object.keys(SELECTY).forEach(function (k) { ids[k] = idParametra(mapa, SELECTY[k]); });
  const rb = D.rozoberPriplatky(sur, mapa);
  if (!rb.ok) return null;
  const text = function (k) { return ids[k] && rb.volby[ids[k]] !== undefined ? mapa.params[ids[k]].o[rb.volby[ids[k]]].t : null; };
  const s = castiZTextov(text("rozlozenie"), text("rohoz"));
  const f2 = text("farba2");
  if (!s || !f2) return null;
  const lux = /^Lux Color (\d+)$/i.exec(D.cisty(f2));
  if (!lux && N(f2) !== N(BEZ_DRUHEJ)) return null;
  if (lux && !s.p) return null;
  const box = function (k) {
    const t = text(k);
    if (!t) return null;
    const b = BOXY.find(function (x) { return N(x.t) === N(t); });
    return b ? b.v : undefined;
  };
  const b1 = box("box1"), b2 = box("box2"), b3 = box("box3");
  if (b1 === undefined || b2 === undefined || b3 === undefined) return null;
  let boxy;
  if (b1 && !b2 && !b3) boxy = [b1];
  else if (!b1 && b2 && b3) boxy = [b2, b3];
  else if (!b1 && !b2 && !b3) boxy = [];
  else return null;
  if (boxy.length && !text("boxFarba")) return null;
  return { ids: ids, volby: rb.volby, p: s.p, r: s.r, k: s.k, vel: s.vel, lux: lux ? lux[1] : null, boxy: boxy, farba1: text("farba"), rok: text("rok") };
}

/** Veľkosť triedy V z auta v košíku (Mercedes-Benz, Model „V Class XL (…)“, rovnaký rok ako riadok) alebo null. */
export function velkostZAuta(auto, rok) {
  if (!auto || !/^mercedes/i.test(D.cisty(auto.Brand))) return null;
  const m = /^V\s*Class\s+(XL|L|M)\b/i.exec(D.cisty(auto.Model));
  if (!m) return null;
  if (!rok || D.cisty(auto.Year) !== D.cisty(rok)) return null;
  return m[1].toUpperCase();
}

/** Zmena príplatkov rozloženia a rohože na výber x2 (veľkosť vel pri 2. a 3. rade) -> { id: hodnota } | null. */
function zmenaCasti(st, x2, vel, mapa) {
  if (!x2.p && !x2.r && !x2.k) return null;
  if (x2.r && !vel) return null;
  const t = textyCasti(x2, vel);
  const a = idHodnoty(mapa, st.ids.rozlozenie, t.roz), b = idHodnoty(mapa, st.ids.rohoz, t.roh);
  if (!a || !b) return null;
  const zm = {};
  if (a !== st.volby[st.ids.rozlozenie]) zm[st.ids.rozlozenie] = a;
  if (b !== st.volby[st.ids.rohoz]) zm[st.ids.rohoz] = b;
  return Object.keys(zm).length ? zm : null;
}

/** Veľkosti boxu parametra: { S: { id, fp, rozmer }, … } (texty z data.js BOXY, cena zo Shoptetu). */
export function velkostiBoxu(mapa, pid) {
  const out = {};
  if (!pid) return out;
  BOXY.forEach(function (b) {
    const id = idHodnoty(mapa, pid, b.t);
    const o = id && mapa.params[pid].o[id];
    if (o && o.fp != null) out[b.v] = { id: id, fp: o.fp, rozmer: b.r };
  });
  return out;
}

/**
 * Ponuky k riadku (poradie: 2. a 3. rad, predné sedadlá, rohož, druhá vrstva, box).
 * o = { velAuta (veľkosť z auta v košíku alebo null), maRohoz / maBox (samostatná rohož / box v košíku) }
 * -> [{ kluc, zm, rozdiel, samo } | { kluc: "vrstva2", moznosti, odporucana } | { kluc: "box", … }]
 */
export function ponukyVclass(st, mapa, o) {
  o = o || {};
  const out = [];
  const zCasti = function (kluc, x2, vel, samo) {
    const zm = zmenaCasti(st, x2, vel, mapa);
    const rozdiel = zm && D.rozdielCeny(st.volby, zm, mapa);
    if (rozdiel && rozdiel.s > 0) out.push({ kluc: kluc, zm: zm, rozdiel: rozdiel, samo: samo || null, vel: vel || null });
  };
  if (!st.r) {
    const vel = o.velAuta || null;
    if (vel) zCasti("rad", { p: st.p, r: true, k: st.k }, vel, SAMOSTATNE.rad[vel]);
  }
  if (!st.p) zCasti("predok", { p: true, r: st.r, k: st.k }, st.vel, SAMOSTATNE.predok);
  if (!st.k && !o.maRohoz) zCasti("rohoz", { p: st.p, r: st.r, k: true }, st.vel, SAMOSTATNE.rohoz);
  if (st.p && !st.lux) {
    const pid = st.ids.farba2, par = mapa.params[pid];
    const moznosti = [];
    (par.p || Object.keys(par.o)).forEach(function (oid) {
      const m = /^Lux Color (\d+)$/i.exec(D.cisty(par.o[oid].t));
      if (!m) return;
      const zm = {};
      zm[pid] = oid;
      const rozdiel = D.rozdielCeny(st.volby, zm, mapa);
      if (rozdiel && rozdiel.s > 0) moznosti.push({ lux: m[1], text: D.cisty(par.o[oid].t), zm: zm, rozdiel: rozdiel });
    });
    if (moznosti.length) {
      const tip = luxKFarbe(st.farba1);
      const odporucana = moznosti.some(function (m) { return m.lux === tip; }) ? tip : moznosti[0].lux;
      out.push({ kluc: "vrstva2", moznosti: moznosti, odporucana: odporucana });
    }
  }
  if (!st.boxy.length && !o.maBox && st.ids.box1 && st.ids.box2 && st.ids.box3 && st.ids.boxFarba) {
    const v1 = velkostiBoxu(mapa, st.ids.box1), v2 = velkostiBoxu(mapa, st.ids.box2), v3 = velkostiBoxu(mapa, st.ids.box3);
    const par = mapa.params[st.ids.boxFarba];
    const farby = (par.p || Object.keys(par.o)).map(function (oid) {
      const f = BOX_FARBY.find(function (x) { return N(x.nm) === N(par.o[oid].t); });
      return f && par.o[oid].fp != null ? { id: oid, nm: f.nm, img: CDN + f.img } : null;
    }).filter(Boolean);
    const fk = farbaKoberca(st.farba1);
    const predvolena = farby.find(function (f) { return fk && N(f.nm) === N(fk); });
    const cenaPre = function (pocet, a, b, farba) {
      const zm = {};
      if (pocet === 1) { if (!v1[a]) return null; zm[st.ids.box1] = v1[a].id; }
      else { if (!v2[a] || !v3[b]) return null; zm[st.ids.box2] = v2[a].id; zm[st.ids.box3] = v3[b].id; }
      zm[st.ids.boxFarba] = farba || (farby[0] && farby[0].id);
      const rozdiel = D.rozdielCeny(st.volby, zm, mapa);
      const samo = pocet === 1 ? SAMOSTATNE.box[a] : SAMOSTATNE.box[a] + SAMOSTATNE.box[b];
      return rozdiel && rozdiel.s > 0 ? { zm: zm, rozdiel: rozdiel, samo: samo || null } : null;
    };
    const vel = BOXY.map(function (b) { return b.v; });
    const ma1 = vel.filter(function (v) { return cenaPre(1, v, null); });
    const ma2a = vel.filter(function (v) { return v2[v]; }), ma2b = vel.filter(function (v) { return v3[v]; });
    const ma2 = ma2a.filter(function (v) { return v3[v] && cenaPre(2, v, v); });
    if (farby.length && (ma1.length || ma2.length)) {
      const vsetky = [];
      ma1.forEach(function (v) { const i = cenaPre(1, v, null); vsetky.push({ s: i.rozdiel.s, samo: i.samo }); });
      ma2.forEach(function (v) { const i = cenaPre(2, v, v); vsetky.push({ s: i.rozdiel.s, samo: i.samo }); });
      const naj = vsetky.reduce(function (a, b) { return b.s < a.s ? b : a; });
      out.push({ kluc: "box", farby: farby, predvolena: predvolena ? predvolena.id : null, v1: v1, v2: v2, v3: v3, ma1: ma1, ma2: ma2, ma2a: ma2a, ma2b: ma2b,
        cenaPre: cenaPre, naj: naj, viac: vsetky.length > 1 });
    }
  }
  return out;
}

/**
 * Časti, ktoré sa dajú krížikom odobrať: [{ cast: "rad" | "rohoz" | "vrstva2" | "box" | "box1" | "box2", nazov, zm, rozdiel, hotovo }].
 * Predné sedadlá nie (celá položka „Odobrať“); časť, po ktorej by v sete nič neostalo, tiež nie.
 */
export function odobratelne(st, mapa) {
  const out = [];
  const pridaj = function (cast, nazov, zm, hotovo) {
    const rozdiel = zm && D.rozdielCeny(st.volby, zm, mapa);
    if (rozdiel && rozdiel.s < 0) out.push({ cast: cast, nazov: nazov, zm: zm, rozdiel: rozdiel, hotovo: hotovo });
  };
  if (st.r) pridaj("rad", TEXTY.rad, zmenaCasti(st, { p: st.p, r: false, k: st.k }, null, mapa), TEXTY.odobranyRad);
  if (st.k) pridaj("rohoz", TEXTY.rohoz, zmenaCasti(st, { p: st.p, r: st.r, k: false }, st.vel, mapa), TEXTY.odobranaRohoz);
  if (st.lux) {
    const bez = idHodnoty(mapa, st.ids.farba2, BEZ_DRUHEJ);
    const zm = {};
    if (bez) zm[st.ids.farba2] = bez;
    pridaj("vrstva2", TEXTY.vrstva + " Lux Color " + st.lux, bez ? zm : null, TEXTY.odobranaVrstva);
  }
  if (st.boxy.length === 1) {
    const zm = {};
    zm[st.ids.box1] = null;
    zm[st.ids.boxFarba] = null;
    pridaj("box", TEXTY.box + " " + st.boxy[0], zm, TEXTY.odobranyBox);
  } else if (st.boxy.length === 2) {
    // ako pri autách: odobratie jedného z dvoch boxov nechá druhý ako 1 box (iná cena v sete), farba ostáva
    [1, 2].forEach(function (kus) {
      const ostava = st.boxy[kus === 1 ? 1 : 0];
      const id = idHodnoty(mapa, st.ids.box1, (BOXY.find(function (b) { return b.v === ostava; }) || {}).t);
      const zm = {};
      zm[st.ids.box2] = null;
      zm[st.ids.box3] = null;
      if (id) zm[st.ids.box1] = id;
      pridaj("box" + kus, TEXTY.box + " " + st.boxy[kus - 1], id ? zm : null, TEXTY.odobranyBoxKus(st.boxy[kus - 1]));
    });
  }
  return out;
}

// ------------------------------------------------------------------ rozpis položky

function polozkyTextu(sur) {
  return lcdPriplatky(sur).map(function (s) {
    const i = s.search(SEP);
    return i > 0 ? { n: D.cisty(s.slice(0, i)), h: D.cisty(s.slice(i).replace(SEP, "")) } : { n: null, h: D.cisty(s) };
  });
}

/** Auto riadku triedy V (auto v košíku, ak je to Mercedes V Class s rovnakým rokom) -> { auto, vel } alebo null. */
export function autoVclass(p, rok) {
  const u = ulozistaAuta();
  const a = autoRiadku(u.ss, u.ls, { priceId: p.priceId, sur: p.sur });
  const vel = velkostZAuta(a, rok);
  return vel ? { auto: a, vel: vel } : null;
}

/**
 * Rozpis položky 646 (ul.lcd-rozpis ako pri autách): hneď Auto, časti setu („Predné sedadlá“, „2. a 3. rad: XL“, „Rohož do
 * kufra“), farby vrstiev a boxy; rok, volant, dvere a ostatné po „Zobraziť viac“ (plán § 4: predtým bolo hneď vidno len
 * „Farba 2. vrstvy“). Riadky častí majú data-lcd-vc-cast (krížik). Nie 646 alebo neznámy text -> null (karta použije
 * bežný rozpis).
 */
export function rozpisVclass(doc, p) {
  if (!jeVclass(p)) return null;
  const pol = polozkyTextu(p.sur);
  const pouzite = new Set();
  const hod = function (k) {
    const i = pol.findIndex(function (y) { return y.n && N(y.n) === N(SELECTY[k]); });
    if (i < 0) return null;
    pouzite.add(i);
    return pol[i].h;
  };
  const s = castiZTextov(hod("rozlozenie"), hod("rohoz"));
  if (!s) return null;
  const rok = pol.find(function (y) { return y.n && N(y.n) === N(SELECTY.rok); });
  const av = autoVclass(p, rok ? rok.h : null);
  const riadky = [];
  if (av && popisAuta(av.auto)) riadky.push({ n: "Auto", h: popisAuta(av.auto), hned: true });
  if (s.p) riadky.push({ n: null, h: TEXTY.predok, cast: "predok", hned: true });
  if (s.r) riadky.push({ n: TEXTY.rad, h: s.vel, cast: "rad", hned: true });
  if (s.k) riadky.push({ n: null, h: TEXTY.rohoz, cast: "rohoz", hned: true });
  const f1 = hod("farba");
  if (f1) riadky.push({ n: SELECTY.farba, h: f1, hned: true });
  const f2 = hod("farba2");
  if (f2) riadky.push({ n: SELECTY.farba2, h: f2, cast: s.p && N(f2) !== N(BEZ_DRUHEJ) ? "vrstva2" : null, hned: s.p });
  const b1 = hod("box1"), b2 = hod("box2"), b3 = hod("box3");
  if (b1) riadky.push({ n: SELECTY.box1, h: b1, cast: "box", hned: true });
  if (b2) riadky.push({ n: SELECTY.box2, h: b2, cast: "box1", hned: true });
  if (b3) riadky.push({ n: SELECTY.box3, h: b3, cast: "box2", hned: true });
  const bf = hod("boxFarba");
  if (bf) riadky.push({ n: SELECTY.boxFarba, h: bf });
  pol.forEach(function (y, i) { if (!pouzite.has(i)) riadky.push({ n: y.n, h: y.h }); });
  const ul = lcdRozpisEl(doc, riadky, "lcd-rozpis");
  ul.setAttribute("data-lcd-vclass", "");
  riadky.forEach(function (r, i) {
    const li = ul.children[i];
    if (r.cast) li.setAttribute("data-lcd-vc-cast", r.cast);
    if (r.hned) li.setAttribute("data-lcd-vc-hned", "");
  });
  return ul;
}

/** Riadky po „Zobraziť viac“ (P.DALSI) = všetky bez data-lcd-vc-hned. -> počet skrytých (0 = pilulka netreba). */
export function oznacRiadky(ul) {
  let n = 0;
  Array.prototype.forEach.call(ul.children, function (li) {
    if (li.hasAttribute("data-lcd-vc-hned")) { li.classList.remove(DALSI); if (!li.classList.length) li.removeAttribute("class"); return; }
    li.classList.add(DALSI);
    n++;
  });
  return n;
}

// ------------------------------------------------------------------ ponuka a krížiky

function textyVymeny() {
  return Object.assign({}, D.textyPonuky("sk"));
}

/** Dlaždica s fotkou triedy V (webp 480, záloha jpg) v stĺpci fotky riadku ponuky (.lcd-vyb__mini). */
function fotka(doc, kluc) {
  const img = el(doc, "img", { class: "lcd-vyb__mini", src: OBS + FOTKY[kluc] + ".jpg", alt: "", width: "152", height: "190", loading: "lazy", decoding: "async" });
  img.addEventListener("error", function () { img.style.visibility = "hidden"; });
  return el(doc, "picture", { class: "lcd-vyb__pic", "data-lcd-vc-foto": kluc }, [el(doc, "source", { type: "image/webp", srcset: OBS + FOTKY[kluc] + "-w480.webp" }), img]);
}

let poradie = 0;

/**
 * Blok „Doplňte svoj set“ pre riadok 646 vo vzhľade ponuky k setu (.lcd-vyb, rovnaké triedy ako D.kartaVybrat): fotka, názov,
 * cena v sete a „ušetríte“, zelené „Pridať“. 2. a 3. rad, predné sedadlá a rohož sa pridajú hneď; druhá vrstva a box
 * otvoria výber pod riadkom. c = { riadok, mapa, st, ponuky, kSetu }, o = { R, forma }. -> element alebo null
 */
export function kartaVclass(doc, c, o) {
  const R = o.R;
  const T = TEXTY;
  const TD = D.textyPonuky("sk");
  const TV = textyVymeny();
  const id = "lcd-vc-" + ++poradie;
  const forma = o.forma || null;
  const k = el(doc, "div", { class: "lcd-vyb lcd-vyb--vclass", "data-item": c.riadok.itemId, role: "group", "aria-labelledby": id + "-h" });
  k.appendChild(el(doc, "div", { class: "lcd-vyb__hlava" }, [
    el(doc, "h3", { class: "lcd-vyb__nadpis", id: id + "-h", text: T.nadpis }),
    el(doc, "span", { class: "lcd-vyb__pod", text: T.pod }),
  ]));
  if (c.kSetu) k.appendChild(el(doc, "p", { class: "lcd-vyb__kset", text: c.kSetu }));
  const zoznam = el(doc, "ul", { class: "lcd-vyb__zoznam" });
  k.appendChild(zoznam);
  const stav = el(doc, "p", { class: "lcd-dop__stav lcd-vyb__stav", role: "status", "aria-live": "polite" });
  const vstup = function (a) { if (forma) a.form = forma; return el(doc, "input", a); };
  const tlacidlo = function (a, deti) { a.type = "button"; if (forma) a.form = forma; return el(doc, "button", a, deti); };
  const sada = function (a, deti) { if (forma) a.form = forma; return el(doc, "fieldset", a, deti); };
  const otvorene = { r: null };
  const ctx = { riadok: c.riadok, mapa: c.mapa, volby: c.st.volby };
  const vymen = function (doplnok, zm, rozdiel) { D.spustiVymenu(ctx, doplnok, zm, rozdiel, TV, R, stav, k); };
  const usetri = function (samo, s) { return samo && samo > s + 0.5 ? TD.usetrite + " " + D.cenaText(samo - s, R) : null; };

  const prepni = function (r, ano) {
    r.panel.hidden = !ano;
    r.li.classList.toggle("je-otvorena", ano);
    r.btn.setAttribute("aria-expanded", ano ? "true" : "false");
    r.btnText.textContent = ano ? TD.vybZavriet : TD.vybTlacidlo;
    r.btn.classList.toggle("lcd-vyb__btn--zavriet", ano);
    otvorene.r = ano ? r : null;
    doc.documentElement.classList.toggle("lcd-vyb-otvorene", !!doc.querySelector(".lcd-vyb__riadok.je-otvorena"));
  };
  /** p: { kluc, meno, stitok, naj, cena, pod, usetri, panel | null, klik } */
  const riadok = function (p) {
    const btnText = el(doc, "span", { text: TD.vybTlacidlo });
    const btn = tlacidlo({ class: "lcd-vyb__btn", "data-lcd-vyb": "vclass-" + p.kluc, "aria-expanded": p.panel ? "false" : null, "aria-controls": p.panel ? id + "-" + p.kluc : null, "aria-describedby": id + "-m-" + p.kluc }, [btnText]);
    const li = el(doc, "li", { class: "lcd-vyb__riadok" + (p.naj ? " lcd-vyb__riadok--naj" : ""), "data-doplnok": p.kluc }, [
      el(doc, "div", { class: "lcd-vyb__pas" }, [
        fotka(doc, p.kluc),
        el(doc, "span", { class: "lcd-vyb__text" }, [
          el(doc, "span", { class: "lcd-vyb__meno", id: id + "-m-" + p.kluc }, [el(doc, "b", { text: p.meno }), p.stitok ? el(doc, "span", { class: "lcd-vyb__odp lcd-vyb__odp--veta", text: p.stitok }) : null]),
          el(doc, "span", { class: "lcd-vyb__cena" }, [el(doc, "b", { text: p.cena }), p.pod ? el(doc, "span", {}, [" · ", p.usetri ? el(doc, "span", { class: "lcd-vyb__usetri", text: p.pod }) : p.pod]) : null]),
        ]),
        btn,
      ]),
    ]);
    const r = { li: li, btn: btn, btnText: btnText, panel: p.panel || null };
    if (r.panel) {
      r.panel.id = id + "-" + p.kluc;
      r.panel.hidden = true;
      li.appendChild(r.panel);
    }
    btn.addEventListener("click", function () {
      if (!r.panel) { p.klik(); return; }
      const otvor = otvorene.r !== r;
      if (otvorene.r) prepni(otvorene.r, false);
      if (!otvor) return;
      prepni(r, true);
      meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vclass_" + p.kluc, lcd_varianta: "rozbalit", lcd_set_sku: c.riadok.sku || null });
      const pokojne = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      try { r.panel.scrollIntoView({ block: "nearest", behavior: pokojne ? "auto" : "smooth" }); } catch (x) { /* starý Safari */ }
    });
    zoznam.appendChild(li);
    return r;
  };

  const zobrazene = [];
  c.ponuky.forEach(function (pn) {
    if (pn.kluc === "rad" || pn.kluc === "predok" || pn.kluc === "rohoz") {
      const hotovo = pn.kluc === "rad" ? T.hotovoRad : pn.kluc === "predok" ? T.hotovoPredok : T.hotovoRohoz;
      riadok({
        kluc: pn.kluc, meno: pn.kluc === "rad" ? T.menoRad : pn.kluc === "predok" ? T.menoPredok : T.rohoz,
        stitok: pn.kluc === "rad" ? T.najvyhodnejsie : null, naj: pn.kluc === "rad",
        cena: D.cenaText(pn.rozdiel.s, R, true), pod: usetri(pn.samo, pn.rozdiel.s), usetri: true,
        klik: function () {
          meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vclass_" + pn.kluc, lcd_velkost: pn.vel, lcd_set_sku: c.riadok.sku || null });
          vymen({ typ: "vclass_" + pn.kluc, kod: "vclass_" + pn.kluc, velkost: pn.vel, hotovo: hotovo }, pn.zm, pn.rozdiel);
        },
      });
      zobrazene.push(pn.kluc);
      return;
    }
    if (pn.kluc === "vrstva2") {
      const stV = { lux: pn.odporucana };
      const moz = function (l) { return pn.moznosti.find(function (m) { return m.lux === l; }) || null; };
      const zorad = [moz(pn.odporucana)].concat(pn.moznosti.filter(function (m) { return m.lux !== pn.odporucana; })).filter(Boolean);
      const VIDNO = 5;
      const zvolena = el(doc, "b");
      const pridat = tlacidlo({ class: "lcd-vyb__pridat", "data-lcd-vyb-pridat": "vclass-vrstva2" });
      const prekresli = function () {
        const m = moz(stV.lux);
        zvolena.textContent = m.text;
        pridat.textContent = TD.vybPridat + " · " + D.cenaText(m.rozdiel.s, R, true);
      };
      const mriezka = el(doc, "div", { class: "lcd-vyb__farby lcd-vyb__farby--lux" });
      zorad.forEach(function (m, i) {
        const inp = vstup({ type: "radio", name: id + "-lux", value: m.lux, checked: m.lux === stV.lux, "data-lcd-vyb-lux": m.lux });
        inp.addEventListener("change", function () { stV.lux = m.lux; prekresli(); });
        const lab = el(doc, "label", { class: "lcd-vyb__vz" + (i >= VIDNO ? " lcd-vyb__vz--dalsia" : ""), title: m.text }, [
          inp, el(doc, "span", { class: "lcd-vyb__obr" }, [el(doc, "img", { src: D.luxFoto(parseInt(m.lux, 10)), alt: m.text, width: "96", height: "96", loading: "lazy", decoding: "async" })]),
        ]);
        if (i >= VIDNO) lab.hidden = true;
        mriezka.appendChild(lab);
      });
      if (zorad.length > VIDNO) {
        const dalsie = tlacidlo({ class: "lcd-vyb__dalsie" }, [el(doc, "span", { text: TD.vybDalsie(zorad.length - VIDNO) })]);
        dalsie.addEventListener("click", function () {
          const skryte = mriezka.querySelectorAll(".lcd-vyb__vz--dalsia");
          skryte.forEach(function (l) { l.hidden = false; });
          dalsie.remove();
          const prva = skryte[0] && skryte[0].querySelector("input");
          if (prva) { try { prva.focus({ preventScroll: true }); } catch (e) { prva.focus(); } }
        });
        mriezka.insertBefore(dalsie, mriezka.children[VIDNO]);
      }
      const panel = el(doc, "div", { class: "lcd-vyb__panel" }, [
        sada({ class: "lcd-vyb__fs" }, [el(doc, "legend", { text: TD.vybFarbaVrstvy }), mriezka]),
        el(doc, "p", { class: "lcd-vyb__zvolena" }, [TD.vybZvolena + " ", zvolena]),
        pridat,
      ]);
      pridat.addEventListener("click", function () {
        const m = moz(stV.lux);
        if (!m) { stav.textContent = TV.chyba; return; }
        meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vclass_vrstva2", lcd_varianta: m.text, lcd_set_sku: c.riadok.sku || null });
        vymen({ typ: "vclass_vrstva2", kod: "vclass_vrstva2", lcdVarianta: m.text, hotovo: T.hotovoVrstva(m.text) }, m.zm, m.rozdiel);
      });
      prekresli();
      riadok({ kluc: "vrstva2", meno: T.vrstva, cena: D.cenaText(moz(pn.odporucana).rozdiel.s, R, true), pod: T.vrstvaPopis, panel: panel });
      zobrazene.push("vrstva2");
      return;
    }
    if (pn.kluc === "box") {
      const stB = { pocet: pn.ma1.length ? 1 : 2, velkost: null, velkost2: null, farba: pn.predvolena };
      const pocty = [];
      if (pn.ma1.length) pocty.push(1);
      if (pn.ma2.length) pocty.push(2);
      const pridat = tlacidlo({ class: "lcd-vyb__pridat", "data-lcd-vyb-pridat": "vclass-box" });
      const zvolenaFarba = el(doc, "p", { class: "lcd-vyb__zvolena" });
      const fsFarba = sada({ class: "lcd-vyb__fs" }, [el(doc, "legend", { text: TD.vybFarbaBoxu })]);
      const mriezkaFarieb = el(doc, "div", { class: "lcd-vyb__farby lcd-vyb__farby--box" });
      pn.farby.forEach(function (f) {
        const inp = vstup({ type: "radio", name: id + "-farba", value: f.id, checked: f.id === stB.farba, "data-lcd-vyb-farba": f.id });
        inp.addEventListener("change", function () { stB.farba = f.id; prekresli(); });
        const vz = el(doc, "img", { src: f.img, alt: f.nm, width: "96", height: "96", loading: "lazy", decoding: "async" });
        vz.addEventListener("error", function () { vz.style.visibility = "hidden"; });
        mriezkaFarieb.appendChild(el(doc, "label", { class: "lcd-vyb__vz", title: f.nm }, [inp, el(doc, "span", { class: "lcd-vyb__obr" }, [vz])]));
      });
      fsFarba.appendChild(mriezkaFarieb);
      fsFarba.appendChild(zvolenaFarba);
      const fsPocet = sada({ class: "lcd-vyb__fs", hidden: pocty.length < 2 }, [el(doc, "legend", { text: TD.pocet }), el(doc, "div", { class: "lcd-vyb__dlazdice lcd-vyb__dlazdice--2" }, pocty.map(function (n) {
        const inp = vstup({ type: "radio", name: id + "-pocet", value: String(n), checked: n === stB.pocet, "data-lcd-vyb-pocet": String(n) });
        inp.addEventListener("change", function () { stB.pocet = n; prekresli(); });
        return el(doc, "label", { class: "lcd-vyb__dl" }, [inp, el(doc, "span", {}, [el(doc, "b", { text: n === 1 ? TD.box1 : TD.box2 })])]);
      }))]);
      const legVel = el(doc, "legend"), legVel2 = el(doc, "legend", { text: TD.velkost2 });
      const fsVel = sada({ class: "lcd-vyb__fs" }, [legVel]);
      const fsVel2 = sada({ class: "lcd-vyb__fs", hidden: true }, [legVel2]);
      const dlazdice = function (fs, zoz, mapaVel, kluc, cena) {
        while (fs.children.length > 1) fs.removeChild(fs.lastChild);
        fs.appendChild(el(doc, "div", { class: "lcd-vyb__dlazdice lcd-vyb__dlazdice--4" }, zoz.map(function (v) {
          const inp = vstup({ type: "radio", name: id + "-" + kluc, value: v, checked: v === stB[kluc], "data-lcd-vyb-velkost": kluc === "velkost2" ? null : v, "data-lcd-vyb-velkost2": kluc === "velkost2" ? v : null });
          inp.addEventListener("change", function () { stB[kluc] = v; prekresliTlacidlo(); });
          return el(doc, "label", { class: "lcd-vyb__dl" }, [inp, el(doc, "span", {}, [
            el(doc, "b", { text: v }), el(doc, "small", { text: mapaVel[v].rozmer }), el(doc, "em", { text: D.cenaText(cena(v), R, true) }),
          ])]);
        })));
      };
      const info = function () {
        const dva = stB.pocet === 2;
        if (!stB.farba || !stB.velkost || (dva && !stB.velkost2)) return null;
        return pn.cenaPre(stB.pocet, stB.velkost, dva ? stB.velkost2 : null, stB.farba);
      };
      const prekresliTlacidlo = function () {
        const dva = stB.pocet === 2;
        const chyba = !stB.farba ? TD.vybVyberteFarbu : !stB.velkost ? (dva ? TD.vybVyberteVelkost1 : TD.vybVyberteVelkost)
          : dva && !stB.velkost2 ? TD.vybVyberteVelkost2 : null;
        const i = chyba ? null : info();
        pridat.disabled = !i;
        pridat.textContent = i ? TD.vybPridat + " · " + D.cenaText(i.rozdiel.s, R, true) : chyba || TD.vybVyberteVelkost;
      };
      const prekresli = function () {
        const dva = stB.pocet === 2;
        if (stB.velkost && (dva ? pn.ma2a : pn.ma1).indexOf(stB.velkost) < 0) stB.velkost = null;
        if (stB.velkost2 && pn.ma2b.indexOf(stB.velkost2) < 0) stB.velkost2 = null;
        legVel.textContent = dva ? TD.velkost1 : TD.velkost;
        if (dva) {
          dlazdice(fsVel, pn.ma2a, pn.v2, "velkost", function (v) { return pn.v2[v].fp; });
          dlazdice(fsVel2, pn.ma2b, pn.v3, "velkost2", function (v) { return pn.v3[v].fp; });
        } else {
          dlazdice(fsVel, pn.ma1, pn.v1, "velkost", function (v) { return pn.v1[v].fp; });
        }
        fsVel2.hidden = !dva;
        zvolenaFarba.textContent = "";
        const f = pn.farby.find(function (x) { return x.id === stB.farba; });
        if (f) {
          zvolenaFarba.appendChild(doc.createTextNode(TD.vybZvolenaBox + " "));
          zvolenaFarba.appendChild(el(doc, "b", { text: f.nm }));
          if (stB.farba === pn.predvolena) zvolenaFarba.appendChild(doc.createTextNode(" – " + TD.vybAkoKoberce));
        }
        prekresliTlacidlo();
      };
      pridat.addEventListener("click", function () {
        const i = info();
        if (!i) { prekresliTlacidlo(); return; }
        const dva = stB.pocet === 2;
        const velkosti = dva ? stB.velkost + "+" + stB.velkost2 : stB.velkost;
        meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vclass_box", lcd_varianta: "box_" + stB.pocet, lcd_velkost: velkosti, lcd_pocet: stB.pocet, lcd_set_sku: c.riadok.sku || null });
        vymen({ typ: "box", pocet: stB.pocet, velkost: velkosti, kod: "vclass_box_" + stB.pocet, hotovo: dva ? T.hotovoBox2 : T.hotovoBox1 }, i.zm, i.rozdiel);
      });
      const panel = el(doc, "div", { class: "lcd-vyb__panel" }, [fsFarba, fsPocet, fsVel, fsVel2, pridat]);
      prekresli();
      riadok({ kluc: "box", meno: T.box, cena: (pn.viac ? TD.od + " " : "") + D.cenaText(pn.naj.s, R, true), pod: usetri(pn.naj.samo, pn.naj.s), usetri: true, panel: panel });
      zobrazene.push("box");
    }
  });
  k.appendChild(stav);
  k.zobrazene = zobrazene;
  return zobrazene.length ? k : null;
}

/**
 * Krížiky × pri častiach setu v položke karty (li = .lcd-opc-kk__polozka s rozpisom z rozpisVclass): riadok s krížikom
 * ako pri autách (li.lcd-dop-riadok, text vľavo, krížik vpravo). c = { riadok, mapa, st, odobrat }. -> počet krížikov
 */
export function vlozKriziky(li, c, o) {
  const ul = li && li.querySelector("ul.lcd-rozpis[data-lcd-vclass]");
  if (!ul || ul.querySelector(".lcd-dop-x") || !c.odobrat.length) return 0;
  const doc = li.ownerDocument;
  const TV = textyVymeny();
  const stav = el(doc, "span", { class: "lcd-dop__stav", role: "status", "aria-live": "polite" });
  const ctx = { riadok: c.riadok, mapa: c.mapa, volby: c.st.volby };
  let n = 0;
  c.odobrat.forEach(function (d) {
    const r = ul.querySelector('li[data-lcd-vc-cast="' + d.cast + '"]');
    if (!r) return;
    const b = el(doc, "button", { type: "button", form: o.forma || null, class: "lcd-dop-x", "data-lcd-dop-odober": "vclass-" + d.cast, "data-item": c.riadok.itemId,
      "aria-label": TV.odstranit + ": " + d.nazov, title: TV.odstranit + ": " + d.nazov }, [el(doc, "i", { "aria-hidden": "true", text: "×" })]);
    b.addEventListener("click", function () {
      meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vclass_" + d.cast, lcd_varianta: "odobrat", lcd_set_sku: c.riadok.sku || null });
      D.spustiVymenu(ctx, { typ: "odober", co: d.cast, kod: "odober_vclass_" + d.cast, hotovo: d.hotovo }, d.zm, d.rozdiel, TV, o.R, stav, ul);
    });
    const t = el(doc, "span", { class: "lcd-dop-text" });
    while (r.firstChild) t.appendChild(r.firstChild);
    r.appendChild(t);
    r.classList.add("lcd-dop-riadok");
    r.appendChild(b);
    n++;
  });
  if (n) ul.parentNode.insertBefore(stav, ul.nextSibling);
  return n;
}

const zmerane = new Set(); // zobrazenie ponuky sa meria raz za stránku

/**
 * Ponuka a krížiky pre riadky 646 v karte košíka. o: { R, forma, doc, vynechaj (itemId po čiastočnej chybe výmeny) }.
 * -> Promise<[{ riadok, karta: element | null, kSetu: „K setu: …“, kriziky: (li) => počet }]> (iný produkt / CZ / chyba = [])
 */
export async function ponukaVKarte(polozky, o) {
  const R = o && o.R;
  if (!R || R.trh !== "sk") return [];
  const vc = polozky.filter(jeVclass);
  if (!vc.length) return [];
  const maRohoz = polozky.some(function (r) { return /koberced?-do-kufr/i.test(r.href || ""); });
  const maBox = polozky.some(function (r) { return /boxi?-do-kufr/i.test(r.href || ""); });
  const doc = o.doc || document;
  const out = [];
  for (const p of vc) {
    if (!p.itemId || !p.priceId || !p.href || !p.sur || !(p.q >= 1) || p.itemId === o.vynechaj) continue;
    let mapa = await D.mapaProduktu(p.href, platnaMapa, false).catch(function () { return null; });
    let st = mapa ? rozborVclass(p.sur, mapa) : null;
    if (mapa && !st) {
      // uložená mapa mohla zostarnúť (nová hodnota v admine) -> raz čerstvá
      mapa = await D.mapaProduktu(p.href, platnaMapa, true).catch(function () { return null; });
      st = mapa ? rozborVclass(p.sur, mapa) : null;
    }
    if (!st) continue;
    // veľkosť pre 2. a 3. rad z auta v košíku len pri jedinom riadku triedy V (dve triedy V = nevieme, ku ktorej auto patrí)
    const av = !st.r && vc.length === 1 ? autoVclass(p, st.rok) : null;
    const ponuky = ponukyVclass(st, mapa, { velAuta: av ? av.vel : null, maRohoz: maRohoz, maBox: maBox });
    // „K setu: …“: v karte hneď pri dvoch riadkoch 646 (aj s cenou, názov je rovnaký); pri inej karte v košíku (zmiešaný
    // košík so setom) ho doplní opc/kosikKarta.js, keď je kariet ponuky viac (revízia 8. 11. 2026)
    const kSetu = TEXTY.kSetu + D.cisty(p.nazov) + (vc.length > 1 && p.cena ? " · " + p.cena : "");
    const c = { riadok: p, mapa: mapa, st: st, ponuky: ponuky, odobrat: odobratelne(st, mapa), kSetu: vc.length > 1 ? kSetu : null };
    const karta = ponuky.length ? kartaVclass(doc, c, o) : null;
    if (karta) {
      const nove = karta.zobrazene.filter(function (d) { return !zmerane.has(p.sku + "|" + p.itemId + "|" + d); });
      nove.forEach(function (d) {
        zmerane.add(p.sku + "|" + p.itemId + "|" + d);
        meraj("lcd_set_doplnok_zobrazenie", { lcd_doplnok: "vclass_" + d, lcd_set_sku: p.sku || null });
      });
    }
    out.push({ riadok: p, karta: karta, kSetu: kSetu, kriziky: function (li) { return vlozKriziky(li, c, o); } });
  }
  return out;
}
