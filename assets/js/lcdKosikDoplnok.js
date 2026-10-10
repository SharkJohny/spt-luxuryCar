// Ponuka v košíku: rohož do kufra a box k setu autokobercov za cenu v sete (Michal 7. 10. 2026).
// Druhá vrstva (Michal 10. 10. 2026: „keď si vyberie jednovrstvové, tak dvojvrstvové bude vždy to prvé, čo má ponúkať“):
// pri jednovrstvovom sete prvá karta s odporúčanou Lux farbou k farbe setu (odporucanaLux) a výberom inej. Jedno- a
// dvojvrstvový set sú SAMOSTATNÉ produkty (ROLE.sety) -> výmena riadku na iný priceId aj productId (vymen s c.ciel);
// priceId variantu a ceny sa čítajú zo stránky dvojvrstvového produktu (necessaryVariantData), nič sa nepočíta.
//
// Kedy: na /kosik/ pri riadku setu autokobercov (produkt má parameter „autokoberce do kufru“), ktorému chýba
// rohož do kufra alebo box. Rohož Classic / Premium a box (1 alebo 2, veľkosť S–XL, farba) sa ponúkajú zvlášť.
//
// Ako (technický spike C:/Users/M/Desktop/LCD/web/kosik-upsell-spike.md, variant A = výmena riadku):
//   1. obsah riadku sa zistí z textu príplatkov zo servera (zachytený pred prepisom v cart.js, pri výmene
//      znova cez GET /action/Cart/GetCartContent/) a z mapy príplatkov produktu (selecty formulára produktu:
//      data-parameter-id, data-parameter-name, option texty bez „ +€N“, data-surcharge-final-price).
//      Text sa NEdelí podľa čiarky („prvý, druhý a tretí rad“), ale podľa presných názvov parametrov.
//   2. klik: POST addCartItem s priceId a VŠETKÝMI pôvodnými príplatkami + doplnok -> kontrola ceny (nový riadok =
//      pôvodný + rozdiel príplatkov z mapy) a textu (rozbor nového riadku = pôvodné voľby + doplnok)
//      -> až potom deleteCartItem starého (pri množstve N > 1 setCartItemAmount N − 1) -> jedno obnovenie stránky.
//   3. fail-closed: keď si nie sme istí obsahom riadku, ponuka sa neukáže; keď kontrola po pridaní nesedí,
//      nový riadok sa zmaže a košík ostane, ako bol (zrozumiteľná hláška).
//   4. počas výmeny zvyšok stránky stojí: „Pokračovať“ a odkazy sa vykonajú až po dokončení, +/−/× košíka sa ignorujú,
//      F5 / zatvorenie karty -> beforeunload. Výmeny z viacerých kariet idú po jednej (Web Locks, bez nich zámok
//      v localStorage). Záznam rozbehnutej výmeny v localStorage: keď zákazník aj tak odíde, ďalšia načítaná stránka
//      (košík, krok objednávky, …) výmenu dokončí (nový riadok už bol overený) alebo vráti (neoverený kus preč).
// Priamy fetch nespúšťa udalosti Shoptetu (ShoptetCartUpdated -> reload v cart.js, add_to_cart meranie Shoptetu).
// Meranie: vlastné udalosti v dataLayer (lcd_set_doplnok_zobrazenie / _klik / _pridany / _chyba).
// Vypnutie bez nasadenia JS: data.json "kosik_doplnky": false (alebo settings.kosik_doplnky). Test bez ponuky: ?lcddoplnok=0
import { getShoptetContext } from "./functions/shoptetContext.js";

// ID parametrov podľa projektu (rovnaké ako productPage.js r. 34–48 + overené na živých formulároch 7. 10. 2026)
// v1 / v2 = parameter variantu „farba 1. / 2. vrstvy“; sety = jednovrstvový set (productId) -> dvojvrstvový set
// (samostatné produkty, overené na živých stránkach 10. 10. 2026); dph = sadzba na odhad ceny bez DPH v meraní
export const ROLE = {
  562035: {
    trh: "sk", mena: "EUR", rohoz: "88", classic: "595", premium: "601", nie: "598",
    farbaBox: "91", box1: "94", box2: "97", boxSolo: "104",
    v1: "78", v2: "71", dph: 1.23, sety: { 598: "601", 610: "604", 613: "607" },
  },
  581408: {
    trh: "cz", mena: "CZK", rohoz: "60", classic: "492", premium: "498", nie: "495",
    farbaBox: "63", box1: "66", box2: "69", boxSolo: "78",
    v1: "72", v2: "44", dph: 1.21, sety: { 2403: "2406", 2415: "2409", 2418: "2412" },
  },
};

// Samostatné produkty na porovnanie ceny (rovnaké adresy na SK aj CZ). Cena sa číta zo živej stránky produktu.
const SAMOSTATNE = {
  classic: (d) => "/luxusny-koberced-do-kufra-dragonskin-klasik" + d + "/",
  premium: (d) => "/luxusny-koberced-do-kufra-dragonskin-premium" + d + "/",
  box: () => "/luxusny-boxi-do-kufra/",
};

const TEXTY = {
  sk: {
    // druhá vrstva k jednovrstvovému setu (Michal 10. 10.: vždy prvá ponuka)
    nadpisVrstva: "Doplňte set o druhú vrstvu",
    nadpisSet: "Doplňte svoj set",
    vrstvaOdporucame: "Odporúčame k Vašej farbe",
    vrstvaZvolena: "Vami zvolená farba",
    vrstvaMeno: (l) => "Druhá vrstva · " + l,
    vrstvaVeta: "Odnímateľná vrstva navrch zachytí vodu, sneh aj blato.",
    pridatVrstvu: "Pridať druhú vrstvu",
    inaFarba: "Vybrať inú farbu",
    vrstvaVyber: "Farba druhej vrstvy",
    vrstvaTip: "odporúčame",
    vrstvaAlt: (l) => "Vzorka druhej vrstvy " + l,
    vrstvaFotoAlt: "Dvojvrstvové autokoberce",
    hotovoVrstva: (l) => "Druhá vrstva " + l + " je pridaná k Vášmu setu.",
    nadpis: "Doplňte kufor v rovnakom štýle",
    stitok: "Len k tomuto setu",
    podnadpis: "Za cenu v sete – len pri objednávke spolu s autokobercami.",
    kSetu: "K setu: ",
    nie: "Nie, ďakujem",
    rohozKratko: "Rohož",
    premiumNadtitul: "Celý kufor",
    premiumVeta: "Kryje dno, boky kufra aj chrbty zadných sedadiel.",
    classicNadtitul: "Dno kufra",
    classicVeta: "Ochrana dna kufra na mieru Vášho auta.",
    boxNadtitul: "1 alebo 2 boxy",
    boxVeta: "Poriadok v kufri pre nákupy aj výbavu auta.",
    vybratVelkost: "Vybrať veľkosť",
    skrytVyber: "Skryť výber",
    boxVyber: "Box do kufra – počet, veľkosť a farba",
    samostatne: "samostatne",
    az: "až",
    vybrat: "Vybrať",
    skryt: "Skryť",
    rohoz: "Rohož do kufra",
    classic: "Classic",
    classicPopis: "dno kufra",
    premium: "Premium",
    premiumPopis: "dno aj boky kufra",
    box: "Box do kufra",
    pocet: "Počet",
    box1: "1 box",
    box2: "2 boxy",
    velkost: "Veľkosť",
    velkost1: "Veľkosť 1. boxu",
    velkost2: "Veľkosť 2. boxu",
    farba: "Farba",
    od: "od",
    vSete: "v sete",
    usetrite: "ušetríte",
    usetriteAspon: "ušetríte aspoň",
    pridat: "Pridať do setu",
    pridavam: "Pridávam…",
    chybaVelkost: "Zvoľte, prosím, veľkosť boxu.",
    chybaVelkost1: "Zvoľte, prosím, veľkosť 1. boxu.",
    chybaVelkost2: "Zvoľte, prosím, veľkosť 2. boxu.",
    chybaFarba: "Zvoľte, prosím, farbu boxu.",
    hotovoRohoz: (v) => "Rohož " + v + " je pridaná k Vášmu setu.",
    hotovoBox1: "Box je pridaný k Vášmu setu.",
    hotovoBox2: "Boxy sú pridané k Vášmu setu.",
    chyba: "Doplnok sa nepodarilo pridať. Váš košík ostal bez zmeny. Skúste to, prosím, znova.",
    chybaCiastocna: "Doplnok je pridaný, pôvodný set bez neho však ostal v košíku. Odstráňte, prosím, celý zvýraznený riadok krížikom vpravo hore.",
    chybaCiastocnaViac: "Doplnok je pridaný, pôvodný set bez neho však ostal v košíku. Znížte, prosím, počet zvýrazneného riadku o 1 kus.",
    chybaStav: "Košík sa medzitým zmenil. Skontrolujte ho, prosím.",
    chybaKontrola: "Doplnok sa nepodarilo pridať. Skontrolujte, prosím, obsah košíka.",
    chybaKontrolaOdober: "Doplnok sa nepodarilo odstrániť. Skontrolujte, prosím, obsah košíka.",
    // odobratie doplnku zo setu (krížik v košíku, Michal 10. 10.)
    vSeteDoplnky: "Doplnky v sete:",
    odstranit: "Odstrániť zo setu",
    boxJeden: "Box",
    odoberam: "Odstraňujem…",
    odobraneRohoz: (v) => "Rohož " + v + " je odstránená zo setu.",
    odobraneBox1: "Box je odstránený zo setu.",
    odobraneBox2: "Boxy sú odstránené zo setu.",
    chybaOdober: "Doplnok sa nepodarilo odstrániť. Váš košík ostal bez zmeny. Skúste to, prosím, znova.",
    chybaCiastocnaOdober: "Set bez doplnku je v košíku, pôvodný set však ostal tiež. Odstráňte, prosím, celý zvýraznený riadok krížikom vpravo hore.",
    chybaCiastocnaOdoberViac: "Set bez doplnku je v košíku, pôvodný set však ostal tiež. Znížte, prosím, počet zvýrazneného riadku o 1 kus.",
  },
  cz: {
    nadpisVrstva: "Doplňte set o druhou vrstvu",
    nadpisSet: "Doplňte svůj set",
    vrstvaOdporucame: "Doporučujeme k Vaší barvě",
    vrstvaZvolena: "Vámi zvolená barva",
    vrstvaMeno: (l) => "Druhá vrstva · " + l,
    vrstvaVeta: "Odnímatelná vrstva navrch zachytí vodu, sníh i bláto.",
    pridatVrstvu: "Přidat druhou vrstvu",
    inaFarba: "Vybrat jinou barvu",
    vrstvaVyber: "Barva druhé vrstvy",
    vrstvaTip: "doporučujeme",
    vrstvaAlt: (l) => "Vzorek druhé vrstvy " + l,
    vrstvaFotoAlt: "Dvouvrstvé autokoberce",
    hotovoVrstva: (l) => "Druhá vrstva " + l + " byla přidána k Vašemu setu.",
    nadpis: "Doplňte kufr ve stejném stylu",
    stitok: "Jen k tomuto setu",
    podnadpis: "Za cenu v setu – jen při objednávce spolu s autokoberci.",
    kSetu: "K setu: ",
    nie: "Ne, děkuji",
    rohozKratko: "Rohož",
    premiumNadtitul: "Celý kufr",
    premiumVeta: "Chrání dno, boky kufru i opěradla zadních sedadel.",
    classicNadtitul: "Dno kufru",
    classicVeta: "Ochrana dna kufru na míru Vašeho auta.",
    boxNadtitul: "1 nebo 2 boxy",
    boxVeta: "Pořádek v kufru pro nákupy i výbavu auta.",
    vybratVelkost: "Vybrat velikost",
    skrytVyber: "Skrýt výběr",
    boxVyber: "Box do kufru – počet, velikost a barva",
    samostatne: "samostatně",
    az: "až",
    vybrat: "Vybrat",
    skryt: "Skrýt",
    rohoz: "Rohož do kufru",
    classic: "Classic",
    classicPopis: "dno kufru",
    premium: "Premium",
    premiumPopis: "dno i boky kufru",
    box: "Box do kufru",
    pocet: "Počet",
    box1: "1 box",
    box2: "2 boxy",
    velkost: "Velikost",
    velkost1: "Velikost 1. boxu",
    velkost2: "Velikost 2. boxu",
    farba: "Barva",
    od: "od",
    vSete: "v setu",
    usetrite: "ušetříte",
    usetriteAspon: "ušetříte alespoň",
    pridat: "Přidat do setu",
    pridavam: "Přidávám…",
    chybaVelkost: "Zvolte prosím velikost boxu.",
    chybaVelkost1: "Zvolte prosím velikost 1. boxu.",
    chybaVelkost2: "Zvolte prosím velikost 2. boxu.",
    chybaFarba: "Zvolte prosím barvu boxu.",
    hotovoRohoz: (v) => "Rohož " + v + " byla přidána k Vašemu setu.",
    hotovoBox1: "Box byl přidán k Vašemu setu.",
    hotovoBox2: "Boxy byly přidány k Vašemu setu.",
    chyba: "Doplněk se nepodařilo přidat. Váš košík zůstal beze změny. Zkuste to prosím znovu.",
    chybaCiastocna: "Doplněk je přidaný, původní set bez něj však zůstal v košíku. Odeberte prosím celý zvýrazněný řádek křížkem vpravo nahoře.",
    chybaCiastocnaViac: "Doplněk je přidaný, původní set bez něj však zůstal v košíku. Snižte prosím počet zvýrazněného řádku o 1 kus.",
    chybaStav: "Košík se mezitím změnil. Zkontrolujte ho prosím.",
    chybaKontrola: "Doplněk se nepodařilo přidat. Zkontrolujte prosím obsah košíku.",
    chybaKontrolaOdober: "Doplněk se nepodařilo odebrat. Zkontrolujte prosím obsah košíku.",
    vSeteDoplnky: "Doplňky v setu:",
    odstranit: "Odebrat ze setu",
    boxJeden: "Box",
    odoberam: "Odebírám…",
    odobraneRohoz: (v) => "Rohož " + v + " byla odebrána ze setu.",
    odobraneBox1: "Box byl odebrán ze setu.",
    odobraneBox2: "Boxy byly odebrány ze setu.",
    chybaOdober: "Doplněk se nepodařilo odebrat. Váš košík zůstal beze změny. Zkuste to prosím znovu.",
    chybaCiastocnaOdober: "Set bez doplňku je v košíku, původní set však zůstal také. Odeberte prosím celý zvýrazněný řádek křížkem vpravo nahoře.",
    chybaCiastocnaOdoberViac: "Set bez doplňku je v košíku, původní set však zůstal také. Snižte prosím počet zvýrazněného řádku o 1 kus.",
  },
};

const VELKOSTI = ["S", "M", "L", "XL"];
const TTL = 24 * 3600 * 1000;
const KLUC_MAPY = "lcdPriplatky:v3:"; // v2: + varianty (vpar) a kombinácie variantov -> priceId a cena (kom); v3: + poradie hodnôt (params/vpar .p) a hlavná fotka (foto)
const KLUC_CIEN = "lcdSamostatne:v3:"; // v2: + zaklad, p1, p2 (2 boxy rôznych veľkostí); v3: p2 len kladný
const KLUC_NIE = "lcdDoplnokNie:";
const KLUC_HOTOVO = "lcdDoplnokHotovo";
const KLUC_OBNOVA = "lcdDoplnokObnova:";
const XHR = { "X-Requested-With": "XMLHttpRequest", "X-Shoptet-XHR": "Shoptet_Coo7ai" };

// Záznam rozbehnutej výmeny (localStorage, spoločný pre karty): obnova po odchode zo stránky počas výmeny
// a záložný zámok medzi kartami v prehliadači bez Web Locks (iOS Safari < 15.4).
// { id, t, hb (tep), faza, opustene, trh, href, stary: {itemId, priceId, q}, ocakavane, pred: {itemId: q},
//   novy: {itemId, q}, kod, hotovo (text), rozdiel }
// faza: zamok (len zámok) -> start (nič neodoslané) -> pridavam (addCartItem odoslaný) -> mazem (nový riadok overený,
//       mažeme pôvodný) -> hotovo (výmena dokončená; ďalšia stránka overí, či nebola vykreslená pred zmazaním)
const KLUC_VYMENA = "lcdDoplnokVymena";
// mapa produktu s daným t už raz čerstvo nepomohla ponuke druhej vrstvy -> znova sťahovať až s novšou mapou (TTL 24 h
// alebo návšteva stránky produktu), nie pri každom otvorení košíka (stránka dvojvrstvového produktu má ~1 MB)
const KLUC_SKUSENA = "lcdVrstvaSkusena:v1:";
const ZAMOK = "lcd-kosik-doplnok";
const HB_ZIVY = 5000; // tep starší ako 5 s = výmena už nebeží (karta zavretá / spadla)
const OBNOVA_CAKAJ = 15000; // „pridávam“ bez stopy v košíku: do 15 s od začiatku môže byť požiadavka ešte na ceste
const ZAZNAM_MAX = 30 * 60 * 1000;
const BEZI = { zamok: 1, start: 1, pridavam: 1, mazem: 1 };

// ------------------------------------------------------------------ čisté funkcie (testy: tools/test-kosik-doplnok.mjs)

/** Zjednotí medzery (aj NBSP) a Unicode tvar; veľkosť písmen nemení. */
export function cisty(s) {
  return String(s == null ? "" : s).normalize("NFC").replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
}

/** Na porovnanie: cisty + malé písmená. */
export function normalizuj(s) {
  return cisty(s).toLowerCase();
}

/** Text možnosti bez ceny na konci („Koberec na dno + boky kufra +€239“ -> „Koberec na dno + boky kufra“). */
export function bezCeny(t) {
  return cisty(t).replace(/\s\+\s?(?:€\s?)?-?\d[\d\s.,]*(?:\s?(?:€|Kč|EUR|CZK))?$/i, "").trim();
}

/** „S : 33x32x30 cm“ -> "S"; iné texty (ŽIADNY, Žádný …) -> null. */
export function velkost(t) {
  const m = /^(XL|S|M|L)\s*:/i.exec(cisty(t));
  return m ? m[1].toUpperCase() : null;
}

export function jeZiadny(t) {
  return /^(žiadn|žádn|nie\b|ne\b|bez\b)/i.test(cisty(t));
}

/** „S : 33x32x30 cm“ -> „33 × 32 × 30 cm“ */
export function rozmer(t) {
  const m = /^(?:XL|S|M|L)\s*:\s*(.+)$/i.exec(cisty(t));
  return m ? m[1].replace(/\s*[x×]\s*/gi, " × ") : "";
}

/**
 * Mapa príplatkov z formulára produktu (dokument stránky produktu alebo DOMParser z fetchu).
 * { pid, lang, params: { "88": { n: "autokoberce do kufru", o: { "595": { t, fp, ap } } } } }
 */
export function mapaZFormulara(doc) {
  const f = doc && doc.querySelector('#product-detail-form, form[data-testid="formProduct"]');
  if (!f) return null;
  const pidEl = f.querySelector('input[name="productId"]');
  const langEl = f.querySelector('input[name="language"]');
  const params = {};
  f.querySelectorAll('select[name^="surchargeParameterValueId["]').forEach(function (s) {
    const id = s.getAttribute("data-parameter-id") || (/\[(\d+)\]/.exec(s.name) || [])[1];
    const n = cisty(s.getAttribute("data-parameter-name"));
    if (!id || !n) return;
    const o = {}, poradie = [];
    s.querySelectorAll("option").forEach(function (op) {
      if (!/^\d+$/.test(op.value)) return;
      const fp = parseFloat(op.getAttribute("data-surcharge-final-price"));
      const ap = parseFloat(op.getAttribute("data-surcharge-additional-price"));
      o[op.value] = { t: bezCeny(op.textContent), fp: isFinite(fp) ? fp : null, ap: isFinite(ap) ? ap : null };
      poradie.push(op.value);
    });
    params[id] = { n: n, o: o, p: poradie };
  });
  if (!pidEl || !Object.keys(params).length) return null;
  // varianty (farba 1. / 2. vrstvy): názvy hodnôt + kombinácie -> priceId a cena (pre ponuku druhej vrstvy)
  const vpar = {};
  f.querySelectorAll('select[name^="parameterValueId["]').forEach(function (s) {
    const id = s.getAttribute("data-parameter-id") || (/\[(\d+)\]/.exec(s.name) || [])[1];
    if (!id) return;
    const o = {}, poradie = [];
    s.querySelectorAll("option").forEach(function (op) { if (/^\d+$/.test(op.value)) { o[op.value] = cisty(op.textContent); poradie.push(op.value); } });
    vpar[id] = { n: cisty(s.getAttribute("data-parameter-name")), o: o, p: poradie };
  });
  // hlavná fotka produktu, ako ju má web (Michal 10. 10.: karta druhej vrstvy = produktová fotka dvojvrstvového setu)
  const og = doc.querySelector('meta[property="og:image"]');
  const foto = og && /^https:\/\/cdn\.myshoptet\.com\/usr\/[^/]+\/user\/shop\//.test(og.getAttribute("content") || "") ? og.getAttribute("content") : null;
  return { pid: pidEl.value, lang: langEl ? langEl.value : "", params: params, vpar: vpar, kom: kombinacieVariantov(doc), foto: foto, t: Date.now() };
}

/**
 * shoptet.variantsSplit.necessaryVariantData zo skriptu stránky (DOMParser skripty nespúšťa -> čítanie textu):
 * { "71-540-78-543": { id: "66983", c: 351 }, … } (id = priceId, c = cena s DPH); nevie -> null.
 */
export function kombinacieVariantov(doc) {
  const skripty = doc && doc.querySelectorAll ? doc.querySelectorAll("script") : [];
  for (let i = 0; i < skripty.length; i++) {
    const t = skripty[i].textContent || "";
    const z = t.indexOf("necessaryVariantData");
    if (z < 0) continue;
    const data = jsonObjekt(t, t.indexOf("{", z));
    if (!data || typeof data !== "object") continue;
    const out = {};
    Object.keys(data).forEach(function (k) {
      const v = data[k];
      if (!/^\d+-\d+(?:-\d+-\d+)*$/.test(k) || !v || v.id == null) return;
      const c = typeof v.priceUnformatted === "number" ? v.priceUnformatted : parseFloat(v.priceUnformatted);
      out[k] = { id: String(v.id), c: isFinite(c) ? c : null };
      if (v.isNotSoldOut === false) out[k].x = 1; // vypredané
    });
    return Object.keys(out).length ? out : null;
  }
  return null;
}

/** JSON objekt od pozície „{“ po zodpovedajúcu „}“ (reťazce s úvodzovkami a \ sa preskočia); chyba -> null */
function jsonObjekt(t, od) {
  if (od < 0 || t[od] !== "{") return null;
  let d = 0, s = false, e = false;
  for (let k = od; k < t.length; k++) {
    const c = t[k];
    if (s) { if (e) e = false; else if (c === "\\") e = true; else if (c === '"') s = false; continue; }
    if (c === '"') s = true;
    else if (c === "{") d++;
    else if (c === "}" && --d === 0) { try { return JSON.parse(t.slice(od, k + 1)); } catch (x) { return null; } }
  }
  return null;
}

/**
 * Rozbor surového textu príplatkov riadku košíka podľa názvov parametrov z mapy (bez delenia podľa čiarky).
 * -> { ok: true, volby: { "85": "592", "88": "598", "74": "485" } } alebo { ok: false, dovod }
 */
export function rozoberPriplatky(text, mapa) {
  if (!mapa || !mapa.params) return { ok: false, dovod: "mapa" };
  const t = cisty(text).replace(/^p[rř][ií]platky\s*:\s*/i, "");
  if (!t) return { ok: true, volby: {} };
  const tn = t.toLowerCase();
  if (tn.length !== t.length) return { ok: false, dovod: "text" };
  const najdene = [];
  Object.keys(mapa.params).forEach(function (id) {
    const kluc = mapa.params[id].n.toLowerCase() + " - ";
    let i = tn.indexOf(kluc);
    while (i >= 0) {
      if (i === 0 || tn.slice(i - 2, i) === ", ") najdene.push({ id: id, zac: i, hod: i + kluc.length });
      i = tn.indexOf(kluc, i + 1);
    }
  });
  najdene.sort(function (a, b) { return a.zac - b.zac; });
  if (!najdene.length || najdene[0].zac !== 0) return { ok: false, dovod: "nepriradeny-text" };
  const volby = {};
  for (let k = 0; k < najdene.length; k++) {
    const a = najdene[k], b = najdene[k + 1];
    if (b && b.zac - 2 < a.hod) return { ok: false, dovod: "prekryv" };
    if (volby[a.id] !== undefined) return { ok: false, dovod: "dvakrat-" + a.id };
    const hodnota = normalizuj(t.slice(a.hod, b ? b.zac - 2 : t.length));
    const zhody = Object.keys(mapa.params[a.id].o).filter(function (oid) {
      return normalizuj(mapa.params[a.id].o[oid].t) === hodnota;
    });
    if (zhody.length !== 1) return { ok: false, dovod: "hodnota-" + a.id, hodnota: hodnota };
    volby[a.id] = zhody[0];
  }
  return { ok: true, volby: volby };
}

/** Má mapa štruktúru setu (všetky roly a známe možnosti rohože)? */
export function jeSet(mapa, R) {
  const p = mapa && mapa.params;
  if (!p || !R) return false;
  const r = p[R.rohoz];
  return !!(r && r.o[R.classic] && r.o[R.premium] && r.o[R.nie] && p[R.farbaBox] && p[R.box1] && p[R.box2] && p[R.boxSolo]);
}

/** Čo riadku chýba: { rohoz: "ma"|"chyba"|"nevie", box: "ma"|"chyba"|"nevie" } alebo null (nie je set). */
export function coChyba(volby, mapa, R) {
  if (!jeSet(mapa, R)) return null;
  const p = mapa.params;
  const vr = volby[R.rohoz];
  const rohoz = vr === R.classic || vr === R.premium ? "ma" : vr === undefined || vr === R.nie ? "chyba" : "nevie";
  let box = "chyba";
  [R.box1, R.box2, R.boxSolo].forEach(function (id) {
    const v = volby[id];
    if (v === undefined || box === "ma") return;
    const o = p[id].o[v];
    if (o && velkost(o.t)) box = "ma";
    else if (!o || !jeZiadny(o.t)) box = "nevie";
  });
  return { rohoz: rohoz, box: box };
}

/** Veľkosti boxu z parametra: { S: { id, fp, ap, rozmer }, … } */
export function velkostiBoxu(mapa, pid) {
  const out = {};
  const p = mapa.params[pid];
  if (!p) return out;
  Object.keys(p.o).forEach(function (id) {
    const o = p.o[id], v = velkost(o.t);
    if (v && o.fp != null && !out[v]) out[v] = { id: id, fp: o.fp, ap: o.ap, rozmer: rozmer(o.t) };
  });
  return out;
}

/** Samostatná cena boxov na porovnanie: 1 box = box1[a]; 2 boxy = základ + príplatok 1. boxu a + 2. boxu b. */
export function samostatneBoxy(sam, pocet, a, b) {
  if (!sam || !a) return null;
  if (pocet !== 2) return (sam.box1 && sam.box1[a]) || null;
  const v2 = b || a;
  if (sam.zaklad && sam.p1 && sam.p2 && sam.p1[a] != null && sam.p2[v2] != null) return sam.zaklad + sam.p1[a] + sam.p2[v2];
  return a === v2 && sam.box2 && sam.box2[a] ? sam.box2[a] : null;
}

/** Zmena príplatkov pre doplnok. rohož: {typ:"rohoz", varianta}; box: {typ:"box", pocet, velkost, velkost2?, farba}
 * (2 boxy: velkost = 1. box, velkost2 = 2. box — Michal 10. 10.: každý box zvlášť; bez velkost2 = rovnaká) */
export function zmena(doplnok, mapa, R) {
  if (doplnok.typ === "rohoz") return { [R.rohoz]: doplnok.varianta === "premium" ? R.premium : R.classic };
  const z = { [R.farbaBox]: String(doplnok.farba) };
  if (doplnok.pocet === 2) {
    const a = velkostiBoxu(mapa, R.box1)[doplnok.velkost], b = velkostiBoxu(mapa, R.box2)[doplnok.velkost2 || doplnok.velkost];
    if (!a || !b) return null;
    z[R.box1] = a.id;
    z[R.box2] = b.id;
  } else {
    const s = velkostiBoxu(mapa, R.boxSolo)[doplnok.velkost];
    if (!s) return null;
    z[R.boxSolo] = s.id;
  }
  return z;
}

/**
 * Odobratie doplnku zo setu (Michal 10. 10.: krížik pri rohoži / boxe v košíku): rohož -> „nie“, box -> všetky
 * parametre boxu preč (null = parameter v novom riadku vynechať, ako set, ku ktorému sa box nikdy nepridal).
 */
export function zmenaOdober(co, volby, R) {
  if (co === "rohoz") return volby[R.rohoz] === R.classic || volby[R.rohoz] === R.premium ? { [R.rohoz]: R.nie } : null;
  const z = {};
  [R.farbaBox, R.box1, R.box2, R.boxSolo].forEach(function (id) { if (volby[id] !== undefined) z[id] = null; });
  return Object.keys(z).length ? z : null;
}

/** Príplatky po zmene; null = parameter vynechať (payload aj očakávaný stav nového riadku). */
export function zluc(volby, zm) {
  const o = Object.assign({}, volby, zm);
  Object.keys(o).forEach(function (k) { if (o[k] === null || o[k] === undefined) delete o[k]; });
  return o;
}

/** Doplnky, ktoré set má (krížiky v košíku): [{ co, nazov, pocet }] */
export function doplnkySetu(volby, mapa, R, T) {
  const out = [], p = mapa.params;
  const vr = volby[R.rohoz];
  if (vr === R.classic || vr === R.premium) out.push({ co: "rohoz", nazov: T.rohozKratko + " " + (vr === R.premium ? T.premium : T.classic), varianta: vr === R.premium ? "premium" : "classic" });
  const vel = function (id) {
    const v = volby[id], o = v !== undefined && p[id] ? p[id].o[v] : null;
    return o && velkost(o.t) ? velkost(o.t) : null;
  };
  const s1 = vel(R.boxSolo), a = vel(R.box1), b = vel(R.box2);
  if (a && b) out.push({ co: "box", nazov: T.box2 + " " + a + " + " + b, pocet: 2 });
  else if (s1 || a || b) out.push({ co: "box", nazov: T.boxJeden + " " + (s1 || a || b), pocet: 1 });
  return out;
}

/** Rozdiel ceny riadku po zmene (s DPH aj bez) z príplatkov mapy; nevie -> null. */
export function rozdielCeny(volby, zm, mapa) {
  let s = 0, b = 0;
  for (const pid of Object.keys(zm)) {
    const p = mapa.params[pid];
    if (!p) return null;
    const stara = volby[pid] !== undefined ? p.o[volby[pid]] : null;
    if (zm[pid] === null) {
      // parameter vynechaný (odobratie doplnku)
      if (stara && stara.fp == null) return null;
      s -= stara ? stara.fp : 0;
      b -= stara ? stara.ap || 0 : 0;
      continue;
    }
    const nova = p.o[zm[pid]];
    if (!nova || nova.fp == null || (stara && stara.fp == null)) return null;
    s += nova.fp - (stara ? stara.fp : 0);
    b += (nova.ap || 0) - (stara ? stara.ap || 0 : 0);
  }
  return { s: Math.round(s * 100) / 100, b: Math.round(b * 100) / 100 };
}

/** Telo POST addCartItem: priceId, productId, language, VŠETKY pôvodné príplatky + zmena, amount=1. */
export function zostavPayload(riadok, volby, zm, mapa, csrf) {
  const vsetky = zluc(volby, zm);
  const casti = ["priceId=" + encodeURIComponent(riadok.priceId), "productId=" + encodeURIComponent(mapa.pid)];
  if (mapa.lang) casti.push("language=" + encodeURIComponent(mapa.lang));
  Object.keys(vsetky).sort(function (a, b) { return a - b; }).forEach(function (pid) {
    casti.push("surchargeParameterValueId%5B" + pid + "%5D=" + encodeURIComponent(vsetky[pid]));
  });
  casti.push("amount=1");
  if (csrf) casti.push("__csrf__=" + encodeURIComponent(csrf));
  return casti.join("&");
}

export function rovnakeVolby(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(function (k) { return String(a[k]) === String(b[k]); });
}

// Farba: kľúč „koža/šitie“ z textov SK aj CZ (synonymá sivá=šedá, bielou=biela=bílá, kávově hnědá=hnedá káva…).
// „Hnedá“ a „Hnedá káva“ sú rôzne farby.
const FARBY = [
  [/hneda kava|kavove hneda|kavova/, "kava"], [/vin\S* cerven|vyn\S* cerven/, "vino"], [/cierna|cerna/, "cierna"],
  [/bezov/, "bezova"], [/hneda|hneda/, "hneda"], [/cerven/, "cervena"], [/sed|siv/, "seda"], [/biel|bil/, "biela"],
  [/zlt|zlut/, "zlta"], [/zelen/, "zelena"], [/bronz/, "bronz"], [/oranz/, "oranzova"], [/modr/, "modra"], [/fialov/, "fialova"],
];
function kanon(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  for (const [re, k] of FARBY) if (re.test(t)) return k;
  return "?" + t;
}
export function klucFarby(text) {
  const t = cisty(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const m = /(?:koze|kuze)\s*:?\s*(.*)$/.exec(t);
  if (!m) return null;
  const zvysok = m[1];
  const sit = /(?:farba|barva)\s+(?:sitia|siti)\s*:?\s*(.*)$/.exec(zvysok);
  const koza = (sit ? zvysok.slice(0, sit.index) : zvysok).replace(/[\/,]\s*$/, "").replace(/\//g, " ").trim();
  return kanon(koza) + "|" + (sit ? kanon(sit[1].replace(/[\/,]/g, " ")) : "");
}

/** Predvolená farba boxu podľa farby setu (text variantu riadku); bez jednoznačnej zhody -> null. */
export function predvolenaFarbaBoxu(variantText, mapa, R) {
  const k = klucFarby(String(variantText || "").replace(/,?\s*(?:farba|barva)\s*2\.?\s*vrstvy\s*:.*$/i, ""));
  if (!k || /\?/.test(k)) return null;
  const p = mapa.params[R.farbaBox];
  if (!p) return null;
  const zhody = Object.keys(p.o).filter(function (id) { return klucFarby(p.o[id].t) === k; });
  return zhody.length === 1 ? zhody[0] : null;
}

/** „Farba kože : Čierna / Farba šitia: Červená“ -> „Čierna / Červená“ */
export function popisFarby(t) {
  const s = cisty(t)
    .replace(/^(?:diamond|hexa|stripe)\s*:?\s*/i, "")
    .replace(/(?:farba|barva)\s+(?:kože|kůže)\s*:\s*/i, "")
    .replace(/\s*\/?\s*(?:farba|barva)\s+(?:šitia|šití)\s*:?\s*/i, " / ")
    .replace(/^\/\s*|\s*\/$/g, "")
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/** Riadky košíka z HTML (stránka /kosik/ alebo obsah GetCartContent). */
export function rozoberRiadky(root) {
  const out = [];
  const videne = new Set();
  root.querySelectorAll('tr.removeable, tr[data-micro="cartItem"]').forEach(function (tr) {
    if (videne.has(tr)) return;
    videne.add(tr);
    const hodnota = function (sel) { const e = tr.querySelector(sel); return e ? e.value : null; };
    const amt = tr.querySelector("input.amount");
    const sur = tr.querySelector('[data-testid="cartWidgetSurchargeName"], .main-link-surcharges');
    const vari = tr.querySelector('[data-testid="cartWidgetVariantName"], .main-link-variant');
    const a = tr.querySelector('a.main-link, [data-testid="cartProductName"]');
    let nazov = "";
    if (a) a.childNodes.forEach(function (n) { if (n.nodeType === 3) nazov += n.textContent; });
    out.push({
      itemId: hodnota('input[name="itemId"]'),
      priceId: hodnota('input[name="priceId"]'),
      q: amt ? parseInt(amt.value, 10) : NaN,
      sur: sur ? cisty(sur.textContent) : "",
      maPriplatky: !!sur,
      variant: vari ? cisty(vari.textContent) : "",
      href: a ? a.getAttribute("href") : null,
      nazov: cisty(nazov),
      sku: tr.getAttribute("data-micro-sku") || "",
      text: cisty(tr.textContent),
    });
  });
  return out;
}

export function cenaText(n, R, plus) {
  const cele = Math.abs(n) % 1 === 0;
  const s = new Intl.NumberFormat(R.trh === "cz" ? "cs-CZ" : "sk-SK", {
    minimumFractionDigits: cele ? 0 : 2, maximumFractionDigits: 2,
  }).format(Math.abs(n)).replace(/[\u202f ]/g, "\u00a0");
  return (plus ? "+" : n < 0 ? "−" : "") + s + "\u00a0" + (R.mena === "EUR" ? "€" : "Kč");
}

/** Beží výmena podľa záznamu ešte (iná karta, tep do 5 s)? */
export function zaznamZivy(z, teraz) {
  return !!(z && BEZI[z.faza] && !z.opustene && teraz - (z.hb || z.t || 0) < HB_ZIVY);
}

/**
 * Rozbehnutá výmena z predchádzajúcej stránky (záznam) vs. aktuálny košík -> čo spraviť:
 *   nic      add sa neodoslal / nič nepribudlo (a už nie je na ceste)
 *   cakaj    nič nepribudlo, ale add mohol byť ešte na ceste (záznam mladší ako 15 s)
 *   vrat     pribudol presne 1 kus s našimi voľbami, kontrola ceny ešte neprebehla -> ten kus späť (kus)
 *   dokonci  nový riadok bol overený, pôvodný ostal -> pôvodný o 1 kus menej (kus)
 *   hotove   výmena je v košíku celá (len stránka sa neobnovila)
 *   nejasne  košík sa medzitým menil inak -> nič nemazať
 */
export function rozhodniObnovu(z, kosik, mapa, teraz) {
  const s = z && z.stary;
  if (!s || !Array.isArray(kosik)) return { akcia: "nejasne" };
  const X = kosik.find(function (r) { return r.itemId === s.itemId; });
  const qX = X ? X.q : 0;
  // výmena na iný produkt (druhá vrstva): nový riadok má cieľové priceId a v texte variantu cieľovú Lux farbu
  const cp = String(z.ciel && z.ciel.priceId ? z.ciel.priceId : s.priceId);
  const sedi = function (r) {
    if (!mapa || !r || String(r.priceId) !== cp) return false;
    if (z.ciel && z.ciel.lux && luxZVariantu(r.variant) !== z.ciel.lux) return false;
    const rb = rozoberPriplatky(r.sur, mapa);
    return rb.ok && rovnakeVolby(rb.volby, z.ocakavane || {});
  };
  const kus = function (r) { return { itemId: r.itemId, priceId: String(r.priceId), q: r.q }; };
  if (z.faza === "mazem" && z.novy) {
    const Y = kosik.find(function (r) { return r.itemId === z.novy.itemId; });
    if (Y && qX === s.q - 1) return { akcia: "hotove" };
    if (X && qX === s.q && Y && Y.q === z.novy.q && sedi(Y)) return { akcia: "dokonci", kus: kus(X) };
    return { akcia: "nejasne" };
  }
  if (z.faza !== "pridavam" || !z.pred) return { akcia: "nic" };
  const prib = kosik.filter(function (r) {
    return r.itemId !== s.itemId && String(r.priceId) === cp && r.q > (z.pred[r.itemId] || 0);
  });
  if (!prib.length) return qX === s.q ? { akcia: teraz - (z.t || 0) < OBNOVA_CAKAJ ? "cakaj" : "nic" } : { akcia: "nejasne" };
  const Y = prib[0];
  if (prib.length === 1 && qX === s.q && Y.q - (z.pred[Y.itemId] || 0) === 1 && sedi(Y)) return { akcia: "vrat", kus: kus(Y) };
  return { akcia: "nejasne" };
}

/** Stránka vykreslená pred zmazaním pôvodného riadku (navigácia predbehla výmenu)? cart = dataLayer shoptet.cart */
export function vykreslenePredZmazanim(stary, cart) {
  if (!stary || !Array.isArray(cart)) return false;
  return cart.some(function (c) { return c && c.itemId === stary.itemId && Number(c.quantity) === stary.q; });
}

/** Dizajn setu z adresy produktu: "" (Diamond), "-hexa", "-stripe"; neznámy -> null. */
export function dizajnZAdresy(href) {
  const h = String(href || "").toLowerCase();
  if (/hexa/.test(h)) return "-hexa";
  if (/stripe/.test(h)) return "-stripe";
  if (/diamond/.test(h)) return "";
  return null;
}

// ------------------------------------------------------------------ druhá vrstva (jednovrstvový -> dvojvrstvový set)
/** „Lux Color 10“ -> 10; iné texty (aj Comfort) -> null — druhá vrstva je len Lux 01–16 */
export function luxCislo(t) {
  const m = /^lux\s*colou?r\s*(\d{1,2})$/i.exec(cisty(t));
  const n = m ? parseInt(m[1], 10) : NaN;
  return n >= 1 && n <= 16 ? n : null;
}
export function luxNazov(n) { return "Lux " + (n < 10 ? "0" : "") + n; }
/** Vzorka Lux farby (rovnaká cesta na SK aj CZ, HTTP 200 overené 10. 10. 2026; LUX-NN.jpg na CZ chýba) */
export function luxFoto(n) { return "/user/documents/upload/assets/config/lux-color-" + (n < 10 ? "0" : "") + n + ".jpg?15"; }
/** Poradie farieb 2. vrstvy ako na produkte (select „farba 2.vrstvy“, SK aj CZ Diamond/Hexa/Stripe, overené 10. 10. 2026) —
 *  záloha, keď mapa poradie nemá */
export const PORADIE_LUX = [10, 12, 11, 13, 14, 15, 16, 7, 4, 1, 8, 6, 3, 5, 9, 2];

/** Vzorka farby kože (farba boxov) ako na produkte: /assets/config/<slug textu po prvé „+“>.jpg (creatButtons.js
 *  createSlug(text.split("+")[0]); všetkých 9 SK aj CZ farieb HTTP 200 overené 10. 10. 2026) */
export function vzorkaFarby(t) {
  const slug = cisty(String(t == null ? "" : t).split("+")[0]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  return slug ? "/user/documents/upload/assets/config/" + slug + ".jpg?15" : null;
}

/** Má riadok košíka 2. vrstvu? (text variantu „…, farba 2.vrstvy: Lux Color 10“) */
export function maDruhuVrstvu(variant) { return /(?:farba|barva)\s*2\.?\s*vrstvy/i.test(cisty(variant)); }
/** Lux farba 2. vrstvy z textu variantu riadku -> číslo alebo null */
export function luxZVariantu(variant) {
  const m = /(?:farba|barva)\s*2\.?\s*vrstvy\s*:\s*([^,]+)/i.exec(cisty(variant));
  return m ? luxCislo(m[1]) : null;
}

/** Mercedes V-Class (sessionStorage auta / poznámka): „V-Class“, „V Klasse“, „Trieda V“, „Třída V“ */
export function jeVClass(auto) {
  const t = cisty(auto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return /(?:^|[^a-z0-9])v[\s-]?(?:class|klasse)\b/.test(t) || /\b(?:trieda|trida)\s+v\b/.test(t);
}

/**
 * Odporúčaná Lux farba 2. vrstvy k farbe 1. vrstvy (Michal 10. 10. 2026): čierna + červené šitie 10, čierna + modré
 * šitie 08, vínová 13, oranžová 03, modrá 06, béžová 12, hnedá aj hnedá káva 11, čierna + šedé šitie pri Mercedes
 * V-Class 15, všetko ostatné 10. text = text farby 1. vrstvy (SK aj CZ), auto = značka/model, ak je známe.
 */
export function odporucanaLux(text, auto) {
  const k = klucFarby(text);
  if (!k) return 10;
  const [koza, sitie] = k.split("|");
  if (koza === "cierna") {
    if (sitie === "cervena") return 10;
    if (sitie === "modra") return 8;
    if (sitie === "seda" && jeVClass(auto)) return 15;
    return 10;
  }
  return { vino: 13, oranzova: 3, modra: 6, bezova: 12, hneda: 11, kava: 11 }[koza] || 10;
}

/** Kľúč kombinácie v necessaryVariantData: parametre podľa ID vzostupne („71-540-78-543“, CZ „44-453-72-546“) */
export function klucKombinacie(par) {
  return Object.keys(par).sort(function (a, b) { return a - b; }).map(function (p) { return p + "-" + par[p]; }).join("-");
}

/** Hodnota 1. vrstvy riadku podľa jeho priceId (kombinácia jednovrstvového produktu „78-543“) -> "543" alebo null */
export function v1ZPriceId(priceId, mapa, R) {
  const kom = mapa && mapa.kom;
  if (!kom || !R) return null;
  const k = Object.keys(kom).filter(function (x) { return kom[x].id === String(priceId); });
  if (k.length !== 1) return null;
  const m = new RegExp("^" + R.v1 + "-(\\d+)$").exec(k[0]);
  return m ? m[1] : null;
}

/** Adresa dvojvrstvového setu k jednovrstvovému („…-dragonskin-diamond-line/“ -> „…-dragonskin-elite-diamond-line/“) */
export function adresaDvojvrstvoveho(href) {
  let cesta;
  try { cesta = new URL(String(href || ""), "https://x.invalid/").pathname; } catch (e) { return null; }
  const m = /^(\/luxusne-autokoberce-dragonskin-)((?:diamond|hexa|stripe)-line\/)$/i.exec(cesta);
  return m ? m[1] + "elite-" + m[2] : null;
}

/**
 * Rozdiel ceny riadku po prechode na dvojvrstvový set: (variant dvojvrstvového − jednovrstvového) + súčet rozdielov
 * VŠETKÝCH zvolených príplatkov (ten istý príplatok má v produktoch iné ceny, napr. rozloženie, SK Stripe rohož / box / TYP).
 * -> { s, b } (b = bez DPH = s / dph — ceny príplatkov bez DPH sú v admine nespoľahlivé, SK jednovrstvový má bez DPH
 *    rovné s DPH) alebo null (čokoľvek chýba).
 */
export function rozdielPrechodu(volby, mapaZ, mapaC, cenaZ, cenaC, dph) {
  if (!mapaZ || !mapaC || !(typeof cenaZ === "number") || !(typeof cenaC === "number") || !isFinite(cenaZ) || !isFinite(cenaC)) return null;
  let s = cenaC - cenaZ;
  for (const pid of Object.keys(volby)) {
    const pz = mapaZ.params[pid], pc = mapaC.params[pid];
    const oz = pz && pz.o[volby[pid]], oc = pc && pc.o[volby[pid]];
    if (!oz || !oc || oz.fp == null || oc.fp == null) return null;
    s += oc.fp - oz.fp;
  }
  return { s: Math.round(s * 100) / 100, b: Math.round(s / (dph || 1) * 100) / 100 };
}

/**
 * Ponuka druhej vrstvy pre riadok jednovrstvového setu (fail-closed: čokoľvek nesedí -> null).
 * mapaZ = jednovrstvový produkt riadku, mapaC = dvojvrstvový; volby = príplatky riadku (rozbor mapou mapaZ).
 * -> { odporucana, moznosti: [{ lux, vid, priceId, rozdiel }] (poradie ako na produkte), v1, foto }
 */
export function ponukaVrstvy(riadok, volby, mapaZ, mapaC, R, auto) {
  if (!riadok || !mapaZ || !mapaC || !R || !R.sety) return null;
  if (R.sety[mapaZ.pid] == null || String(R.sety[mapaZ.pid]) !== String(mapaC.pid)) return null;
  if (maDruhuVrstvu(riadok.variant)) return null;
  const v1 = v1ZPriceId(riadok.priceId, mapaZ, R);
  const p2 = mapaC.vpar && mapaC.vpar[R.v2];
  if (!v1 || !p2 || !mapaC.kom || !mapaZ.vpar || !mapaZ.vpar[R.v1]) return null;
  const zaklad = mapaZ.kom[klucKombinacie({ [R.v1]: v1 })];
  if (!zaklad || zaklad.c == null) return null;
  // príplatky riadku musia mať v dvojvrstvovom produkte rovnaké názvy (kontrola textu po pridaní ide jeho mapou)
  const rb = rozoberPriplatky(riadok.sur, mapaC);
  if (!rb.ok || !rovnakeVolby(rb.volby, volby)) return null;
  const moznosti = [];
  Object.keys(p2.o).forEach(function (vid) {
    const lux = luxCislo(p2.o[vid]);
    if (lux == null || moznosti.some(function (m) { return m.lux === lux; })) return;
    const e = mapaC.kom[klucKombinacie({ [R.v1]: v1, [R.v2]: vid })];
    if (!e || e.x || e.c == null) return;
    const rozdiel = rozdielPrechodu(volby, mapaZ, mapaC, zaklad.c, e.c, R.dph);
    if (rozdiel && rozdiel.s > 0) moznosti.push({ lux: lux, vid: vid, priceId: e.id, rozdiel: rozdiel });
  });
  // poradie ako na produkte (Michal 10. 10.): poradie hodnôt v selecte dvojvrstvového produktu, inak PORADIE_LUX
  const kde = function (m) { const i = p2.p ? p2.p.indexOf(m.vid) : -1; return i > -1 ? i : 100 + PORADIE_LUX.indexOf(m.lux); };
  moznosti.sort(function (a, b) { return kde(a) - kde(b); });
  if (!moznosti.length) return null;
  const chce = odporucanaLux(mapaZ.vpar[R.v1].o[v1] || riadok.variant, auto);
  const odporucana = moznosti.some(function (m) { return m.lux === chce; }) ? chce : moznosti.some(function (m) { return m.lux === 10; }) ? 10 : null;
  if (odporucana == null) return null;
  return { odporucana: odporucana, moznosti: moznosti, v1: v1, foto: mapaC.foto || null };
}

/** Poradie kariet v ponuke (Michal 10. 10.: druhá vrstva vždy prvá; potom rohož Classic, box, rohož Premium) */
export const PORADIE_KARIET = ["vrstva2", "classic", "box", "premium"];

// ------------------------------------------------------------------ úložisko (každý prístup v try/catch)
function lsCitaj(k) {
  try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v && v.t && Date.now() - v.t < TTL ? v : null; } catch (e) { return null; }
}
function lsPis(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function ssCitaj(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ssPis(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
function zaznamCitaj() {
  try { const v = JSON.parse(localStorage.getItem(KLUC_VYMENA) || "null"); return v && typeof v === "object" && v.id ? v : null; } catch (e) { return null; }
}
function zaznamPis(v) { try { localStorage.setItem(KLUC_VYMENA, JSON.stringify(v)); return true; } catch (e) { return false; } }
/** Zmaže záznam, len ak je stále ten istý (id); bez id zmaže hocijaký. */
function zaznamZmaz(id) {
  try { const v = zaznamCitaj(); if (!id || !v || v.id === id) localStorage.removeItem(KLUC_VYMENA); } catch (e) {}
}
function noveId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function pauza(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function webLocks() {
  try { return navigator.locks && typeof navigator.locks.request === "function" ? navigator.locks : null; } catch (e) { return null; }
}

function projekt() {
  const c = getShoptetContext();
  return String(c.projectId || "");
}

/** Produktová stránka: mapu príplatkov si odloží pre košík (len čítanie formulára, nič nemení). */
export function ulozMapuProduktu() {
  try {
    const R = ROLE[projekt()];
    if (!R || !document.getElementById("product-detail-form")) return;
    const m = mapaZFormulara(document);
    if (m && jeSet(m, R)) lsPis(KLUC_MAPY + projekt() + ":" + location.pathname, m);
  } catch (e) {}
}

// ------------------------------------------------------------------ sieť
async function stiahniDokument(cesta) {
  const r = await fetch(cesta, { credentials: "same-origin" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return new DOMParser().parseFromString(await r.text(), "text/html");
}

// rovnaký produkt vo viacerých riadkoch -> jedno stiahnutie (prebiehajúce požiadavky podľa kľúča)
const bezi = new Map();
function raz(kluc, fn) {
  if (!bezi.has(kluc)) bezi.set(kluc, fn());
  return bezi.get(kluc);
}

async function ziskajMapu(href, R, cerstva) {
  const cesta = new URL(href, location.href).pathname;
  const kluc = KLUC_MAPY + projekt() + ":" + cesta;
  if (!cerstva) { const m = lsCitaj(kluc); if (m && jeSet(m, R)) return m; }
  return raz(kluc, async function () {
    const m = mapaZFormulara(await stiahniDokument(cesta));
    if (m) lsPis(kluc, m);
    return m;
  });
}

/** Zabudne mapu produktu v localStorage (kontrola ceny / textu nesedela -> mapa mohla zostarnúť, napr. nová cena v admine). */
function zabudniMapu(href) {
  try { localStorage.removeItem(KLUC_MAPY + projekt() + ":" + new URL(href, location.href).pathname); } catch (e) {}
}

/** Ceny samostatných produktov (porovnanie). Chyba -> null (ponuka bez porovnania). */
async function ziskajSamostatneCeny(dizajn, R) {
  if (dizajn === null) return null;
  const kluc = KLUC_CIEN + projekt() + ":" + dizajn;
  const ulozene = lsCitaj(kluc);
  if (ulozene) return ulozene;
  return raz(kluc, function () { return stiahniSamostatneCeny(dizajn, R, kluc); });
}

async function stiahniSamostatneCeny(dizajn, R, kluc) {
  const cena = function (doc) {
    const m = doc.querySelector('[itemprop="price"]');
    const v = m ? parseFloat(m.getAttribute("content")) : NaN;
    return isFinite(v) && v > 0 ? v : null;
  };
  const vys = { t: Date.now(), classic: null, premium: null, box1: {}, box2: {}, zaklad: null, p1: {}, p2: {} };
  const [c, p, b] = await Promise.all(["classic", "premium", "box"].map(function (k) {
    return stiahniDokument(SAMOSTATNE[k](dizajn)).catch(function () { return null; });
  }));
  if (c) vys.classic = cena(c);
  if (p) vys.premium = cena(p);
  if (b) {
    const zaklad = cena(b), m = mapaZFormulara(b);
    if (zaklad && m) {
      const v1 = velkostiBoxu(m, R.box1), v2 = velkostiBoxu(m, R.box2);
      vys.zaklad = zaklad;
      VELKOSTI.forEach(function (v) {
        if (v1[v]) { vys.box1[v] = zaklad + v1[v].fp; vys.p1[v] = v1[v].fp; }
        // 2. box „+0“ (CZ admin, 2. box S) by ukázal úsporu ~0 -> len kladný príplatok (kontrola kódu 10. 10.)
        if (v2[v] && v2[v].fp > 0) vys.p2[v] = v2[v].fp;
        if (v1[v] && v2[v] && v2[v].fp > 0) vys.box2[v] = zaklad + v1[v].fp + v2[v].fp;
      });
    }
  }
  if (vys.classic || vys.premium || Object.keys(vys.box1).length) lsPis(kluc, vys);
  return vys;
}

async function nacitajKosik() {
  const r = await fetch("/action/Cart/GetCartContent/", { headers: XHR, credentials: "same-origin", cache: "no-store" });
  const t = await r.text();
  let html = t;
  try { const j = JSON.parse(t); html = (j.payload && (j.payload.content || j.payload.html)) || ""; } catch (e) {}
  if (!html) throw new Error("GetCartContent bez obsahu");
  return rozoberRiadky(new DOMParser().parseFromString(html, "text/html"));
}

function csrf() {
  try { return (window.shoptet && shoptet.csrf && shoptet.csrf.token) || ""; } catch (e) { return ""; }
}

/**
 * POST na košík. Výpadok siete -> výnimka. Odpoveď, ktorej nemožno veriť (presmerovanie = Shoptet požiadavku
 * nespracoval ako XHR, telo nie je JSON), má neiste: true a code null — volajúci musí stav overiť v košíku.
 */
async function postKosik(akcia, telo) {
  const r = await fetch("/action/Cart/" + akcia + "/", {
    method: "POST",
    credentials: "same-origin",
    headers: Object.assign({ "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }, XHR),
    body: telo,
  });
  const t = await r.text();
  let j = null;
  try { j = JSON.parse(t); } catch (e) {}
  if (!j || typeof j !== "object" || r.redirected) {
    return { code: null, neiste: true, message: (r.redirected ? "presmerované" : "neplatná odpoveď") + " (HTTP " + r.status + ")" };
  }
  return j;
}

function teloRiadku(itemId, priceId, amount) {
  const c = csrf();
  return "itemId=" + encodeURIComponent(itemId) + "&priceId=" + encodeURIComponent(priceId) + "&amount=" + amount +
    (c ? "&__csrf__=" + encodeURIComponent(c) : "");
}

/**
 * Uberie PRESNE 1 kus riadku t {itemId, priceId, q} (q > 1 -> setCartItemAmount q − 1, inak deleteCartItem).
 * Obe akcie sú idempotentné (zmazaný riadok druhýkrát nezmizne, množstvo sa nastavuje na pevné číslo).
 * Keď odpoveď nepríde alebo jej nemožno veriť, rozhodne stav košíka (zmazanie mohlo prejsť, len sa stratila odpoveď).
 */
async function uberJedenKus(t) {
  if (!t || !(t.q >= 1)) return false;
  const akcia = t.q > 1 ? "setCartItemAmount" : "deleteCartItem";
  const telo = teloRiadku(t.itemId, t.priceId, t.q > 1 ? t.q - 1 : 1);
  for (let pokus = 0; pokus < 2; pokus++) {
    const v = await postKosik(akcia, telo).catch(function () { return null; });
    if (v && v.code === 200) return true;
    const k = await nacitajKosik().catch(function () { return null; });
    if (!k) continue;
    const r = k.find(function (x) { return x.itemId === t.itemId; });
    if (t.q > 1 ? r && r.q === t.q - 1 : !r) return true;
    if (t.q > 1 ? !r || r.q !== t.q : r.q !== 1) return false; // riadok medzitým zmenil niekto iný -> nehádať
  }
  return false;
}

// ------------------------------------------------------------------ meranie
const MERANIE_KLUCE = ["lcd_doplnok", "lcd_varianta", "lcd_velkost", "lcd_pocet", "lcd_trh", "lcd_set_sku", "lcd_value",
  "lcd_value_wo_vat", "lcd_currency", "lcd_krok", "lcd_code", "lcd_sprava"];
function meraj(udalost, data) {
  try {
    const o = { event: udalost };
    MERANIE_KLUCE.forEach(function (k) { o[k] = data && data[k] !== undefined ? data[k] : null; });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(o);
  } catch (e) {}
}

// ------------------------------------------------------------------ výmena riadku
/**
 * Pridá doplnok k setu výmenou riadku. -> { ok: true } | { ok: false, krok, code, sprava, ciastocne, reload }
 * Poradie: pridať -> overiť cenu a text -> až potom zmazať / znížiť starý riadok. Pri nezhode sa vráti presne
 * 1 pridaný kus. „Bez zmeny“ (ok: false bez reload) len vtedy, keď to potvrdil košík; inak reload: true.
 * c.faza(faza, údaje): zápis postupu do záznamu (obnova po odchode zo stránky) — „pridavam“ tesne pred addCartItem,
 *   „mazem“ tesne pred zmazaním pôvodného riadku.
 * c.ciel = { priceId, lux } (druhá vrstva): nový riadok je iný produkt — payload s cieľovým priceId a productId z c.mapa
 *   (mapa dvojvrstvového produktu), nový riadok sa hľadá podľa cieľového priceId a overí aj Lux v texte variantu;
 *   c.rozdiel = rozdiel celej ceny riadku (variant + všetky príplatky). Bez c.ciel = rovnaký variant ako pôvodný riadok.
 * c.zamknute === false: výmena beží bez zámku medzi kartami (ani Web Locks, ani localStorage) -> pri neistom pridaní
 *   sa nič nemaže (pribudnutý kus mohla pridať iná karta), len sa obnoví stránka.
 */
export async function vymen(c) {
  const R = c.R, mapa = c.mapa;
  const faza = typeof c.faza === "function" ? c.faza : function () {};
  const zamknute = c.zamknute !== false;
  // 1) riadok musí byť stále rovnaký (iná karta mohla košík zmeniť); bez načítaného košíka sa nič neodošle
  let pred;
  try { pred = await nacitajKosik(); } catch (e) { return { ok: false, krok: "siet", sprava: String((e && e.message) || e).slice(0, 120) }; }
  const stary = pred.find(function (r) { return r.itemId === c.riadok.itemId; });
  if (!stary || stary.priceId !== c.riadok.priceId || cisty(stary.sur) !== cisty(c.riadok.sur) || !(stary.q >= 1)) {
    return { ok: false, krok: "zmena_kosika", reload: true };
  }
  const predQ = new Map(pred.map(function (r) { return [r.itemId, r.q]; }));
  const ocakavane = zluc(c.volby, c.zmena);
  const qZ = function (i) { return Number(i.quantity != null ? i.quantity : i.q); };
  // cieľový variant: rovnaký ako pôvodný riadok (rohož, box), alebo iný produkt (druhá vrstva: c.ciel = {priceId, lux},
  // mapa = mapa dvojvrstvového produktu — payload, productId aj rozbor textu nového riadku)
  const cielPriceId = String(c.ciel && c.ciel.priceId ? c.ciel.priceId : stary.priceId);
  // riadky CIEĽOVÉHO variantu setu, ktoré po pridaní pribudli alebo im stúplo množstvo (pôvodný riadok sa
  // nepočíta; iné produkty, napr. darček, ktorý Shoptet pridá sám, rozhodovanie neovplyvnia)
  const pribudnute = function (zoznam) {
    return zoznam.filter(function (i) {
      return i.itemId !== stary.itemId && String(i.priceId) === cielPriceId && (!predQ.has(i.itemId) || qZ(i) > predQ.get(i.itemId));
    });
  };
  const jednotky = function (i) { return qZ(i) - (predQ.get(i.itemId) || 0); };
  // riadok je presne to, čo sme pridávali: cieľový variant (pri druhej vrstve aj Lux farba v texte variantu)
  // a text príplatkov = pôvodné voľby + doplnok
  const sedi = function (r) {
    if (!r || String(r.priceId) !== cielPriceId) return false;
    if (c.ciel && c.ciel.lux && luxZVariantu(r.variant) !== c.ciel.lux) return false;
    const rb = rozoberPriplatky(r.sur, mapa);
    return rb.ok && rovnakeVolby(rb.volby, ocakavane);
  };
  const ciel1 = function (r, zText) { return { itemId: r.itemId, priceId: String(r.priceId), q: qZ(r), zText: zText }; };

  // vrátenie PRESNE 1 kusu (q > 1 -> setCartItemAmount q − 1, inak deleteCartItem)
  const vratKus = uberJedenKus;

  // 2–3) pridanie. Výpadok siete, presmerovanie, odpoveď mimo JSON alebo code ≠ 200 = neisté: server mohol
  // položku pridať a len sa stratila odpoveď -> rozhodne košík (nikdy „bez zmeny“ bez overenia)
  faza("pridavam", { pred: Object.fromEntries(predQ) });
  let add;
  try { add = await postKosik("addCartItem", zostavPayload({ priceId: cielPriceId }, c.volby, c.zmena, mapa, csrf())); }
  catch (e) { add = { code: null, neiste: true, message: "sieť: " + String((e && e.message) || e).slice(0, 100) }; }
  const istePridane = !!(add && add.code === 200 && !add.neiste);
  const polozky = (istePridane && add.payload && add.payload.cartItems) || [];
  const po = await nacitajKosik().catch(function () { return null; });

  // 4) náš riadok: nový alebo zlúčený s existujúcim rovnakým (q + 1). Viac pribudnutých riadkov (iná karta /
  //    zariadenie v tej istej relácii) -> ten, ktorého text sedí s pridávanými voľbami; nejednoznačné -> nehádať.
  //    subeh = okrem nášho kusu pribudol ďalší kus toho istého setu (iná karta / zariadenie robí to isté naraz).
  let ciel = null, subeh = false;
  if (po) {
    const prib = pribudnute(po);
    const zhoda = prib.filter(sedi);
    if (zhoda.length === 1) {
      ciel = ciel1(zhoda[0], true);
      subeh = prib.length > 1 || jednotky(zhoda[0]) > 1;
    } else if (zhoda.length > 1) ciel = { nejasne: true };
    else if (prib.length === 1 && istePridane && jednotky(prib[0]) === 1) ciel = ciel1(prib[0], false); // určite náš, ale s iným textom -> vrátenie
    else if (prib.length) ciel = { nejasne: true };
  } else if (istePridane) {
    const prib = pribudnute(polozky);
    if (prib.length === 1 && jednotky(prib[0]) === 1) ciel = ciel1(prib[0], false);
    else if (prib.length) ciel = { nejasne: true };
  }
  const staryPo = po && po.find(function (r) { return r.itemId === stary.itemId; });
  const staryOk = !!(staryPo && staryPo.q === stary.q);
  const zaznamVratenia = function () { meraj("lcd_set_doplnok_chyba", { lcd_krok: "vratenie", lcd_trh: R.trh, lcd_doplnok: c.doplnok.kod }); };
  const vrat = async function (krok, extra) {
    const vratene = await vratKus(ciel);
    if (!vratene) zaznamVratenia();
    return Object.assign({ ok: false, krok: krok, reload: !vratene }, extra || {});
  };

  if (!istePridane) {
    const info = { code: add ? add.code : null, sprava: add && add.message };
    // košík sa nedá prečítať, pribudlo niečo, čo nevieme priradiť, pribudlo viac kusov (súbeh), alebo beží bez zámku
    // medzi kartami (pribudnutý kus mohla pridať iná karta) -> nič nemazať a obnoviť stránku (ukáže skutočný stav)
    if (!po || (ciel && (ciel.nejasne || subeh || !zamknute))) return Object.assign({ ok: false, krok: "pridanie", reload: true, neiste: true }, info);
    // overené: nepribudlo nič -> košík je naozaj bez zmeny (ak sa nezmenil ani pôvodný riadok)
    if (!ciel) return Object.assign({ ok: false, krok: staryOk ? "pridanie" : "zmena_kosika", reload: !staryOk }, info);
    // pridanie prešlo, len sa stratila odpoveď -> späť presne 1 kus; pôvodný riadok medzitým zmenený -> obnoviť
    const vratene = await vratKus(ciel);
    if (!vratene) zaznamVratenia();
    return Object.assign({ ok: false, krok: staryOk ? "pridanie" : "zmena_kosika", reload: !vratene || !staryOk, vratene: vratene }, info);
  }
  if (!ciel) {
    // code 200, ale nič nepribudlo: s načítaným košíkom je to overené „bez zmeny“, inak obnoviť
    return { ok: false, krok: po && !staryOk ? "zmena_kosika" : "pridanie", sprava: "nový riadok sa nenašiel", reload: !po || !staryOk };
  }
  if (ciel.nejasne) return { ok: false, krok: "pridanie", sprava: "viac nových riadkov", reload: true };
  if (subeh) {
    // ten istý set s doplnkom pribudol aj inde (iná karta / zariadenie) -> vrátiť náš kus, nič iné nemazať
    const v = await vrat("zmena_kosika", { sprava: "súbeh: pribudol ďalší kus setu" });
    v.reload = true;
    return v;
  }

  // pôvodný riadok musí byť v košíku nezmenený, inak ho medzitým menila iná karta / zariadenie -> vrátiť náš kus
  const polozka = function (id) { return polozky.find(function (x) { return x.itemId === id; }) || null; };
  const iStary = polozka(stary.itemId);
  if (!iStary || qZ(iStary) !== stary.q || (po && !staryOk)) {
    const v = await vrat("zmena_kosika", { sprava: "pôvodný riadok sa medzitým zmenil" });
    v.reload = true;
    return v;
  }

  // 5) kontrola ceny: nový = pôvodný + rozdiel príplatkov
  const cena = function (i) { return i && typeof i.priceWithVat === "number" ? i.priceWithVat : NaN; };
  // zľava skupiny zákazníkov / množstvová (discounts.finalRatio) mení cenu celého riadku vrátane príplatkov:
  // musí byť na oboch riadkoch rovnaká; pri pomere ≠ 1 tolerancia 1 jednotka na zaokrúhlenie (text kontroluje krok 6)
  const pomer = function (i) { const d = i && i.discounts; return d && typeof d.finalRatio === "number" && d.finalRatio > 0 ? d.finalRatio : 1; };
  const iNovy = polozka(ciel.itemId);
  const cStary = cena(iStary), cNovy = cena(iNovy), r = pomer(iNovy);
  const tolerancia = r === 1 ? 0.011 : 1.01;
  if (pomer(iStary) !== r || !(Math.abs(cNovy - (cStary + c.rozdiel.s * r)) < tolerancia)) {
    return vrat("kontrola_ceny", { sprava: "cena " + cNovy + " ≠ " + cStary + " + " + c.rozdiel.s + (r !== 1 ? " × " + r : "") });
  }

  // 6) kontrola textu: nový riadok = pôvodné voľby + doplnok (chytí aj príplatky za +0, napr. farba boxov)
  const novyRiadok = po && po.find(function (r) { return r.itemId === ciel.itemId; });
  if (!ciel.zText || !novyRiadok || !sedi(novyRiadok)) {
    return vrat("kontrola_textu", { sprava: novyRiadok ? novyRiadok.sur.slice(0, 160) : "riadok chýba" });
  }

  // 7) starý riadok preč (množstvo N > 1 -> N − 1); 1 opakovanie
  faza("mazem", { novy: { itemId: ciel.itemId, q: ciel.q } });
  let zmazane = false, posledna = null;
  for (let pokus = 0; pokus < 2 && !zmazane; pokus++) {
    posledna = stary.q > 1
      ? await postKosik("setCartItemAmount", teloRiadku(stary.itemId, stary.priceId, stary.q - 1)).catch(function () { return null; })
      : await postKosik("deleteCartItem", teloRiadku(stary.itemId, stary.priceId, stary.q)).catch(function () { return null; });
    zmazane = !!(posledna && posledna.code === 200);
  }
  if (!zmazane) {
    const teraz = await nacitajKosik().catch(function () { return null; });
    const ostal = teraz && teraz.find(function (r) { return r.itemId === stary.itemId && r.q === stary.q; });
    if (!teraz || ostal) {
      return { ok: false, krok: "zmazanie", ciastocne: true, reload: true, code: posledna && posledna.code, sprava: posledna && posledna.message, stary: stary.itemId };
    }
  }
  return { ok: true, novy: ciel.itemId, kupon: add.payload ? add.payload.discountCoupon : undefined };
}

// ------------------------------------------------------------------ UI
let poradie = 0;
let zamok = false;

function el(tag, attrs, deti) {
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    const v = attrs[k];
    if (v == null || v === false) return;
    if (k === "text") e.textContent = v;
    else if (k === "class") e.className = v;
    else e.setAttribute(k, v === true ? "" : v);
  });
  (deti || []).forEach(function (d) { if (d != null) e.appendChild(typeof d === "string" ? document.createTextNode(d) : d); });
  return e;
}

/**
 * Cena v karte: veľké „+129 € v sete“, pod tým „samostatne 230 €“ (prečiarknuté) a „ušetríte 101 €“
 * (Michal 7. 10.: tvar „Ušetríte …“, nie „−101 €“). kratko = „od +99 €“ bez riadku úspory (karta boxu).
 */
function cenovka(T, R, rozdiel, samostatne, kratko, usetriAspon) {
  const usetri = samostatne && samostatne > rozdiel + 0.5 ? samostatne - rozdiel : 0;
  const deti = [el("span", { class: "lcd-dop__hlavna" }, [
    el("b", { class: "lcd-dop__vsete", text: (kratko ? T.od + " " : "") + cenaText(rozdiel, R, true) }), " ",
    el("small", { text: T.vSete }),
  ])];
  if (usetri) {
    deti.push(" ", el("span", { class: "lcd-dop__samoriadok" }, [T.samostatne + " " + (kratko ? T.od + " " : ""), el("s", { class: "lcd-dop__samo", text: cenaText(samostatne, R) })]));
    if (!kratko) deti.push(" ", el("span", { class: "lcd-dop__usetri" }, [T.usetrite + " " + cenaText(usetri, R)]));
  }
  // karta boxu („od +99 €“): najmenšia úspora zo všetkých veľkostí a počtov (Michal 10. 10.: „ušetríte aspoň …“)
  if (kratko && usetriAspon > 0.5) deti.push(" ", el("span", { class: "lcd-dop__usetri" }, [T.usetriteAspon + " " + cenaText(usetriAspon, R)]));
  return el("span", { class: "lcd-dop__cena" }, deti);
}

/**
 * Fotky doplnkov = béžové fotky kufra z návrhu nového konfigurátora (Michal 9. 10.: „chcem aby tam boli tieto
 * fotky“): to isté auto s rohožou Classic, Premium, 1 a 2 boxmi. 720×540 (4 : 3), spoločné assets/img/kosik/ na CDN.
 */
const FOTO = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/kosik/";
export const FOTKY = { classic: "rohoz-classic.jpg", premium: "rohoz-premium.jpg", box1: "box-1.jpg", box2: "box-2.jpg" };
export function fotoDoplnku(subor) { return FOTO + subor; }
function foto(src, alt, trieda) {
  const i = el("img", { src: src, alt: alt || "", class: trieda, width: "720", height: "540", loading: "lazy", decoding: "async" });
  // chyba -> len skryť (nie odstrániť): fotka druhej vrstvy aj boxu mení src, ďalšia vzorka sa musí dať ukázať
  i.addEventListener("error", function () { i.style.visibility = "hidden"; });
  i.addEventListener("load", function () { i.style.visibility = ""; });
  return i;
}

/** „K setu: Diamond-Line, čierna / červená + Lux 10“ — bez názvov materiálu (Basic / Elite / Dragonskin) */
export function setNazov(riadok) {
  const m = /(diamond|hexa|stripe)\s*line/i.exec(riadok.nazov || "");
  const n = m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() + "-Line" : cisty(String(riadok.nazov || "").replace(/\b(?:dragon\s*skin|elite|basic)\b/gi, ""));
  const f = popisFarby(String(riadok.variant || "").replace(/^(?:farba|barva)\s*1\.?\s*vrstvy\s*:\s*/i, "").replace(/,?\s*(?:farba|barva)\s*2\.?\s*vrstvy\s*:.*$/i, ""));
  const lux = luxZVariantu(riadok.variant);
  return (f ? n + ", " + f.toLowerCase() : n) + (lux ? " + " + luxNazov(lux) : "");
}

/**
 * Ponuka k setu ako tmavý prémiový blok (Michal 9. 10.: „vôbec mi to nepríde lákavé“): tri karty s béžovou fotkou
 * z návrhu konfigurátora — Classic, Box, Premium — so štítkom zľavy, veľkou cenou v sete a jednou vetou, čo zákazník
 * získa. Mobil: karty sa listujú prstom (ďalšia vykukuje), PC: vedľa seba. Box má pod kartami výber počtu,
 * veľkosti a farby. Háčiky pre E2E ostávajú: .lcd-dop__volba, .lcd-dop__polozka[data-doplnok="box"] .lcd-dop__vybrat,
 * data-lcd-dop-pridat / -pocet / -velkost / -farba / -nie.
 */
// zaokrúhlenie NADOL: štítok nesmie sľubovať viac, než je (SK box 54,8 % -> „až −54 %“, nie −55 %)
// (+1e-9: presné celé % ako 200 -> 180 = 10 % nesmie po výpočte v pohyblivej čiarke spadnúť na 9 %)
export function zlava(samo, s) { return samo && samo > s + 0.5 ? Math.floor((samo - s) * 100 / samo + 1e-9) : 0; }

function karta(ctx, T, R, viacSetov) {
  const id = "lcd-dop-" + ++poradie;
  const k = el("article", { class: "lcd-dop__karta", "data-item": ctx.riadok.itemId, "aria-labelledby": id + "-h" });
  const hlava = el("div", { class: "lcd-dop__hlava" }, [
    el("div", { class: "lcd-dop__titul" }, [
      el("p", { class: "lcd-dop__stitok", text: T.stitok }),
      el("h2", { class: "lcd-dop__nadpis", id: id + "-h", text: T.nadpis }),
    ]),
    el("button", { type: "button", class: "lcd-dop__nie", "data-lcd-dop-nie": "", text: T.nie }),
  ]);
  k.appendChild(hlava);
  k.appendChild(el("p", { class: "lcd-dop__podnadpis", text: T.podnadpis }));
  if (viacSetov) k.appendChild(el("p", { class: "lcd-dop__kset", text: T.kSetu + (ctx.kSetu || setNazov(ctx.riadok)) }));

  const volby = el("ul", { class: "lcd-dop__volby", "aria-labelledby": id + "-h" });
  k.appendChild(volby);
  const stav = el("p", { class: "lcd-dop__stav", role: "status", "aria-live": "polite" });

  /** jedna karta: fotka so štítkom zľavy, nadtitul, názov, veta, cena, tlačidlo */
  const ponuka = function (o) {
    const obr = foto(o.foto, o.alt, "lcd-dop__vfoto");
    const menoId = id + "-meno-" + (o.varianta || o.doplnok);
    o.tlacidlo.setAttribute("aria-describedby", menoId);
    // štítok na fotke bez zľavy (druhá vrstva: číslo Lux farby, na produktovej fotke aj s malou vzorkou)
    const znackaObr = o.znackaVzorka ? el("img", { class: "lcd-dop__znacka-vz", src: o.znackaVzorka, alt: "", width: "40", height: "40", decoding: "async" }) : null;
    const znackaText = o.znacka ? el("span", { text: o.znacka }) : null;
    const znacka = o.znacka ? el("span", { class: "lcd-dop__znacka" }, [znackaObr, znackaText]) : null;
    const nadtitul = el("span", { class: "lcd-dop__nadtitul", text: o.nadtitul });
    const meno = el("b", { class: "lcd-dop__meno", id: menoId, text: o.meno });
    const pct = o.zlava ? el("span", { class: "lcd-dop__zlava", text: (o.az ? T.az + " " : "") + "−" + o.zlava + " %" }) : null;
    const li = el("li", { class: "lcd-dop__volba" + (o.trieda ? " " + o.trieda : ""), "data-doplnok": o.doplnok, "data-varianta": o.varianta || null }, [
      el("div", { class: "lcd-dop__foto" }, [obr, pct, znacka]),
      el("div", { class: "lcd-dop__vtext" }, [
        nadtitul,
        meno,
        el("span", { class: "lcd-dop__veta", text: o.veta }),
        o.extra || null,
      ]),
      o.cena,
      o.tlacidlo,
    ]);
    volby.appendChild(li);
    return { li: li, obr: obr, nadtitul: nadtitul, meno: meno, znacka: znacka, znackaText: znackaText, znackaObr: znackaObr };
  };

  /** Výber (farba druhej vrstvy, veľkosť boxu) hneď pod svojou kartou (Michal 10. 10.); pri kartách na listovanie
   *  (telefón) pod kartami. Zatvorený výber v zozname nezostáva (prázdna položka by pridala medzeru). */
  const pripniVyber = function (telo, li) {
    const kotva = document.createComment("lcd-dop-vyber");
    k.appendChild(kotva);
    k.insertBefore(telo, kotva);
    const obal = el("li", { class: "lcd-dop__vyber" });
    const umiestni = function () {
      let karusel = false;
      try { karusel = getComputedStyle(volby).flexDirection === "row"; } catch (e) { /* bez štýlov -> pod kartu */ }
      // presun prvku zahodí fokus -> vrátiť ho na tú istú voľbu (klávesnica / čítačka pri otočení tabletu)
      const fokus = document.activeElement && telo.contains(document.activeElement) ? document.activeElement : null;
      if (telo.hidden || karusel) {
        if (telo.parentNode !== k) k.insertBefore(telo, kotva);
        if (obal.parentNode) obal.parentNode.removeChild(obal);
      } else {
        if (li.nextSibling !== obal) volby.insertBefore(obal, li.nextSibling);
        if (telo.parentNode !== obal) obal.appendChild(telo);
      }
      if (fokus && document.activeElement !== fokus) { try { fokus.focus({ preventScroll: true }); } catch (e) { fokus.focus(); } }
    };
    let snimok = 0;
    window.addEventListener("resize", function () {
      if (snimok || telo.hidden) return;
      snimok = (window.requestAnimationFrame || setTimeout)(function () { snimok = 0; umiestni(); });
    });
    return umiestni;
  };

  // --- druhá vrstva (len jednovrstvový set; Michal 10. 10.: vždy prvá ponuka) — odporúčaná Lux farba k farbe setu,
  //     „Vybrať inú farbu“ rozbalí výber zo vzoriek Lux hneď pod kartou (ako výber boxu). Farba je len pre 2. vrstvu.
  //     Fotka karty = produktová fotka dvojvrstvového setu z webu, zvolenú farbu ukazuje štítok so vzorkou.
  if (ctx.ponuka.vrstva2) {
    const pv = ctx.ponuka.vrstva2;
    const stV = { lux: pv.odporucana };
    const moz = function (l) { return pv.moznosti.find(function (m) { return m.lux === l; }) || null; };
    const tid = id + "-lux";
    const tl = el("button", { type: "button", class: "lcd-dop__pridat", "data-lcd-dop-pridat": "vrstva2", text: T.pridatVrstvu });
    const napisIna = el("span", { text: T.inaFarba });
    const ina = el("button", { type: "button", class: "lcd-dop__ina", "aria-expanded": "false", "aria-controls": tid, "data-lcd-dop-ina": "" }, [napisIna, el("i", { "aria-hidden": "true" })]);
    let cenaKarta = cenovka(T, R, moz(stV.lux).rozdiel.s, null, false);
    let fotoSetu = pv.foto || null;
    const kv = ponuka({
      doplnok: "vrstva2", varianta: "vrstva2", trieda: "lcd-dop__volba--vrstva2",
      foto: fotoSetu || luxFoto(stV.lux), alt: fotoSetu ? T.vrstvaFotoAlt : T.vrstvaAlt(luxNazov(stV.lux)),
      znacka: luxNazov(stV.lux), znackaVzorka: fotoSetu ? luxFoto(stV.lux) : null,
      nadtitul: T.vrstvaOdporucame, meno: T.vrstvaMeno(luxNazov(stV.lux)), veta: T.vrstvaVeta, extra: ina,
      cena: cenaKarta, tlacidlo: tl,
    });
    const suhrnCena = el("div", { class: "lcd-dop__suhrn-cena" });
    const tl2 = el("button", { type: "button", class: "lcd-dop__pridat", "data-lcd-dop-pridat": "vrstva2-vyber", text: T.pridatVrstvu });
    const mriezka = el("div", { class: "lcd-dop__luxy" });
    const fsLux = el("fieldset", { class: "lcd-dop__fs lcd-dop__fs--lux" }, [el("legend", { text: T.vrstvaVyber }), mriezka]);
    const prekresliV = function () {
      const m = moz(stV.lux);
      const nazov = luxNazov(stV.lux);
      if (!fotoSetu) { kv.obr.src = luxFoto(stV.lux); kv.obr.alt = T.vrstvaAlt(nazov); }
      if (kv.znackaObr) { kv.znackaObr.src = luxFoto(stV.lux); kv.znackaObr.hidden = !fotoSetu; }
      kv.znackaText.textContent = nazov;
      kv.nadtitul.textContent = stV.lux === pv.odporucana ? T.vrstvaOdporucame : T.vrstvaZvolena;
      kv.meno.textContent = T.vrstvaMeno(nazov);
      const nova = cenovka(T, R, m.rozdiel.s, null, false);
      kv.li.replaceChild(nova, cenaKarta);
      cenaKarta = nova;
      tl.setAttribute("data-lux", String(stV.lux));
      suhrnCena.textContent = "";
      suhrnCena.appendChild(el("span", { class: "lcd-dop__suhrn-lux", text: nazov }));
      suhrnCena.appendChild(cenovka(T, R, m.rozdiel.s, null, false));
    };
    // dlaždice: vzorka, „Lux 10“, pri odporúčanej „odporúčame“; cena len keď sa od odporúčanej líši
    const odp = moz(pv.odporucana);
    pv.moznosti.forEach(function (m) {
      const i = el("input", { type: "radio", name: tid, value: String(m.lux), checked: m.lux === stV.lux, "data-lcd-dop-lux": String(m.lux) });
      i.addEventListener("change", function () { stV.lux = m.lux; prekresliV(); });
      const popis = [el("img", { src: luxFoto(m.lux), alt: "", width: "400", height: "400", loading: "lazy", decoding: "async" }), el("b", { text: luxNazov(m.lux) })];
      if (m.lux === pv.odporucana) popis.push(el("small", { text: T.vrstvaTip }));
      else if (odp && Math.abs(odp.rozdiel.s - m.rozdiel.s) > 0.005) popis.push(el("em", { text: cenaText(m.rozdiel.s, R, true) }));
      mriezka.appendChild(el("label", { class: "lcd-dop__opt lcd-dop__opt--lux" }, [i, el("span", {}, popis)]));
    });
    const teloV = el("div", { class: "lcd-dop__telo lcd-dop__luxvyber", id: tid, hidden: true, "data-doplnok": "vrstva2" }, [
      fsLux, el("div", { class: "lcd-dop__suhrn" }, [suhrnCena, tl2]),
    ]);
    const umiestniV = pripniVyber(teloV, kv.li);
    // produktová fotka sa nenačíta -> vzorka zvolenej farby (ako pred 10. 10.)
    kv.obr.addEventListener("error", function () { if (!fotoSetu) return; fotoSetu = null; prekresliV(); });
    const pridaj = function () {
      const m = moz(stV.lux);
      if (!m) { stav.textContent = T.chyba; return; }
      const nazov = luxNazov(m.lux);
      meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vrstva2", lcd_varianta: nazov, lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
      spustiVymenu(ctx, {
        typ: "vrstva2", kod: "vrstva2", lcdVarianta: nazov, nazov: nazov,
        ciel: { priceId: m.priceId, lux: m.lux, href: pv.href, mapa: pv.mapa },
      }, {}, m.rozdiel, T, R, stav, k);
    };
    tl.addEventListener("click", pridaj);
    tl2.addEventListener("click", pridaj);
    ina.addEventListener("click", function () {
      const otvor = ina.getAttribute("aria-expanded") !== "true";
      ina.setAttribute("aria-expanded", otvor ? "true" : "false");
      napisIna.textContent = otvor ? T.skrytVyber : T.inaFarba;
      teloV.hidden = !otvor;
      umiestniV();
      kv.li.classList.toggle("je-otvorena", otvor);
      if (otvor) {
        meraj("lcd_set_doplnok_klik", { lcd_doplnok: "vrstva2", lcd_varianta: "vybrat", lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
        const pokojne = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        try { teloV.scrollIntoView({ block: "nearest", behavior: pokojne ? "auto" : "smooth" }); } catch (e) { /* starý Safari */ }
        // výber je v DOM za „Pridať druhú vrstvu“ na karte (na telefóne až za kartami) -> fokus rovno na zvolenú farbu
        const zvolena = teloV.querySelector("input:checked");
        if (zvolena) { try { zvolena.focus({ preventScroll: true }); } catch (e) { zvolena.focus(); } }
      }
    });
    prekresliV();
    ctx.zobrazene.push("vrstva2");
  }

  // --- rohož (poradie kariet nastaví koniec funkcie)
  if (ctx.ponuka.rohoz) {
    const moznosti = ["premium", "classic"].map(function (v) {
      const zm = zmena({ typ: "rohoz", varianta: v }, ctx.mapa, R);
      return { v: v, zm: zm, rozdiel: rozdielCeny(ctx.volby, zm, ctx.mapa), samo: ctx.samostatne ? ctx.samostatne[v] : null };
    }).filter(function (o) { return o.rozdiel && o.rozdiel.s > 0; });
    moznosti.forEach(function (o) {
      const tl = el("button", { type: "button", class: "lcd-dop__pridat", "data-lcd-dop-pridat": "rohoz", "data-varianta": o.v, text: T.pridat });
      tl.addEventListener("click", function () {
        meraj("lcd_set_doplnok_klik", { lcd_doplnok: "rohoz", lcd_varianta: o.v, lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
        spustiVymenu(ctx, { typ: "rohoz", varianta: o.v, kod: "rohoz_" + o.v, nazov: T[o.v] }, o.zm, o.rozdiel, T, R, stav, k);
      });
      ponuka({
        doplnok: "rohoz", varianta: o.v, trieda: "lcd-dop__volba--" + o.v,
        foto: fotoDoplnku(FOTKY[o.v]), alt: T.rohoz + " " + T[o.v] + " – " + T[o.v + "Popis"],
        zlava: zlava(o.samo, o.rozdiel.s), nadtitul: T[o.v + "Nadtitul"], meno: T.rohozKratko + " " + T[o.v], veta: T[o.v + "Veta"],
        cena: cenovka(T, R, o.rozdiel.s, o.samo, false), tlacidlo: tl,
      });
    });
    if (moznosti.length) ctx.zobrazene.push("rohoz");
  }

  // --- box: karta + výber pod kartami (počet, veľkosť s rozmermi, farba)
  if (ctx.ponuka.box) {
    const vSolo = velkostiBoxu(ctx.mapa, R.boxSolo), v1 = velkostiBoxu(ctx.mapa, R.box1), v2 = velkostiBoxu(ctx.mapa, R.box2);
    const farbaP = ctx.mapa.params[R.farbaBox];
    // poradie ako na produkte (Object.keys by číselné ID zoradil vzostupne)
    const farby = (farbaP.p || Object.keys(farbaP.o)).filter(function (fid) { return farbaP.o[fid] && farbaP.o[fid].fp != null; });
    const predvolena = predvolenaFarbaBoxu(ctx.riadok.variant, ctx.mapa, R);
    // 2 boxy: každý box vlastná veľkosť (Michal 10. 10.) — velkost = 1. box, velkost2 = 2. box
    const stavBox = { pocet: 1, velkost: null, velkost2: null, farba: predvolena };
    const cenaPre = function (pocet, v, vb) {
      if (!v || !farby.length) return null;
      const zm = zmena({ typ: "box", pocet: pocet, velkost: v, velkost2: vb || v, farba: stavBox.farba || farby[0] }, ctx.mapa, R);
      const rozdiel = zm && rozdielCeny(ctx.volby, zm, ctx.mapa);
      return rozdiel && rozdiel.s > 0 ? { zm: zm, rozdiel: rozdiel, samo: samostatneBoxy(ctx.samostatne, pocet, v, vb || v) } : null;
    };
    const ma1 = VELKOSTI.filter(function (v) { return vSolo[v] && cenaPre(1, v); });
    const ma2a = VELKOSTI.filter(function (v) { return v1[v]; }), ma2b = VELKOSTI.filter(function (v) { return v2[v]; });
    // 2 boxy len keď ide zložiť aspoň rovnakú dvojicu (a cena je známa); pre „od“ a štítok zľavy stačia rovnaké dvojice
    const ma2 = ma2a.filter(function (v) { return v2[v] && cenaPre(2, v, v); });
    if (farby.length && (ma1.length || ma2.length)) {
      const n = "lcd-dop-" + poradie;
      const pocty = [];
      if (ma1.length) pocty.push(1);
      if (ma2.length) pocty.push(2);
      stavBox.pocet = pocty[0];
      // všetky kombinácie: najnižšia cena („od“) a najväčšia zľava na štítok („až −X %“, keď sa líšia)
      const vsetky = [];
      pocty.forEach(function (p) { (p === 2 ? ma2 : ma1).forEach(function (v) { const i = cenaPre(p, v); vsetky.push({ s: i.rozdiel.s, samo: i.samo, z: zlava(i.samo, i.rozdiel.s) }); }); });
      const naj = vsetky.reduce(function (a, b) { return b.s < a.s ? b : a; });
      // najmenšia úspora: všetky veľkosti 1 boxu aj všetky dvojice veľkostí 2 boxov (aj rôzne)
      const uspory = [];
      const uspora = function (i) { if (i && i.samo && i.samo > i.rozdiel.s + 0.5) uspory.push(i.samo - i.rozdiel.s); else if (i) uspory.push(0); };
      if (pocty.indexOf(1) > -1) ma1.forEach(function (v) { uspora(cenaPre(1, v)); });
      if (pocty.indexOf(2) > -1) ma2a.forEach(function (a) { ma2b.forEach(function (b) { uspora(cenaPre(2, a, b)); }); });
      const usetriAspon = uspory.length ? Math.min.apply(null, uspory) : 0;
      const zlavy = vsetky.map(function (x) { return x.z; });
      const maxZ = Math.max.apply(null, zlavy);

      const tid = n + "-box";
      const napis = el("span", { text: T.vybratVelkost });
      const btn = el("button", { type: "button", class: "lcd-dop__vybrat", "aria-expanded": "false", "aria-controls": tid }, [napis, el("i", { "aria-hidden": "true" })]);
      const karticka = ponuka({
        doplnok: "box", trieda: "lcd-dop__polozka lcd-dop__volba--box",
        foto: fotoDoplnku(pocty[0] === 2 ? FOTKY.box2 : FOTKY.box1), alt: T.box,
        zlava: maxZ, az: zlavy.some(function (z) { return z !== maxZ; }),
        nadtitul: T.boxNadtitul, meno: T.box, veta: T.boxVeta,
        cena: cenovka(T, R, naj.s, naj.samo, true, usetriAspon), tlacidlo: btn,
      });

      const fsPocet = el("fieldset", { class: "lcd-dop__fs lcd-dop__fs--pocet" }, [el("legend", { text: T.pocet })].concat(pocty.map(function (p) {
        const i = el("input", { type: "radio", name: n + "-pocet", value: String(p), checked: p === stavBox.pocet, "data-lcd-dop-pocet": String(p) });
        i.addEventListener("change", function () {
          stavBox.pocet = p;
          hint.textContent = "";
          karticka.obr.src = fotoDoplnku(p === 2 ? FOTKY.box2 : FOTKY.box1);
          prekresli();
        });
        return el("label", { class: "lcd-dop__opt" }, [i, el("span", { text: p === 1 ? T.box1 : T.box2 })]);
      })));
      const legVel = el("legend", { text: T.velkost }), legVel2 = el("legend", { text: T.velkost2 });
      const fsVel = el("fieldset", { class: "lcd-dop__fs lcd-dop__fs--velkost" }, [legVel]);
      const fsVel2 = el("fieldset", { class: "lcd-dop__fs lcd-dop__fs--velkost lcd-dop__fs--velkost2", hidden: true }, [legVel2]);
      // farba boxov: vzorky kože ako na produkte (Michal 10. 10.: „vzorky, nie text“), popis farby pod vzorkou
      const mriezkaFarieb = el("div", { class: "lcd-dop__farby" }, farby.map(function (fid) {
        const i = el("input", { type: "radio", name: n + "-farba", value: fid, checked: fid === predvolena, "data-lcd-dop-farba": fid });
        i.addEventListener("change", function () { stavBox.farba = fid; hint.textContent = ""; prekresli(); });
        const vz = el("img", { src: vzorkaFarby(farbaP.o[fid].t), alt: "", width: "400", height: "400", loading: "lazy", decoding: "async" });
        vz.addEventListener("error", function () { vz.style.visibility = "hidden"; });
        return el("label", { class: "lcd-dop__opt lcd-dop__opt--farba" }, [i, el("span", {}, [vz, el("b", { text: popisFarby(farbaP.o[fid].t) })])]);
      }));
      const fsFarba = el("fieldset", { class: "lcd-dop__fs lcd-dop__fs--farba" }, [el("legend", { text: T.farba }), mriezkaFarieb]);
      const suhrnCena = el("div", { class: "lcd-dop__suhrn-cena" });
      const tl = el("button", { type: "button", class: "lcd-dop__pridat", "data-lcd-dop-pridat": "box", text: T.pridat });
      const hint = el("p", { class: "lcd-dop__hint", "aria-live": "polite" });
      // dlaždice veľkostí: pri 1 boxe cena celej zmeny, pri 2 boxoch príplatok daného boxu v sete
      const dlazdice = function (fs, zoznam, mapaVel, kluc, attr, cena) {
        while (fs.children.length > 1) fs.removeChild(fs.lastChild);
        zoznam.forEach(function (v) {
          const a = { type: "radio", name: n + "-" + kluc, value: v, checked: v === stavBox[kluc] };
          a[attr] = v;
          const i = el("input", a);
          i.addEventListener("change", function () { stavBox[kluc] = v; hint.textContent = ""; prekresliSuhrn(); });
          fs.appendChild(el("label", { class: "lcd-dop__opt lcd-dop__opt--vel" }, [i, el("span", {}, [
            el("b", { text: v }), el("small", { text: mapaVel[v].rozmer }), el("em", { text: cenaText(cena(v), R, true) }),
          ])]));
        });
      };
      const prekresli = function () {
        const dva = stavBox.pocet === 2;
        const zoz1 = dva ? ma2a : ma1;
        if (stavBox.velkost && zoz1.indexOf(stavBox.velkost) < 0) stavBox.velkost = null;
        if (stavBox.velkost2 && ma2b.indexOf(stavBox.velkost2) < 0) stavBox.velkost2 = null;
        legVel.textContent = dva ? T.velkost1 : T.velkost;
        if (dva) {
          dlazdice(fsVel, ma2a, v1, "velkost", "data-lcd-dop-velkost", function (v) { return v1[v].fp; });
          dlazdice(fsVel2, ma2b, v2, "velkost2", "data-lcd-dop-velkost2", function (v) { return v2[v].fp; });
        } else {
          dlazdice(fsVel, ma1, vSolo, "velkost", "data-lcd-dop-velkost", function (v) { return cenaPre(1, v).rozdiel.s; });
        }
        fsVel2.hidden = !dva;
        prekresliSuhrn();
      };
      const prekresliSuhrn = function () {
        suhrnCena.textContent = "";
        const dva = stavBox.pocet === 2;
        const info = stavBox.velkost && (!dva || stavBox.velkost2) ? cenaPre(stavBox.pocet, stavBox.velkost, dva ? stavBox.velkost2 : null) : null;
        if (info) suhrnCena.appendChild(cenovka(T, R, info.rozdiel.s, info.samo, false));
      };
      tl.addEventListener("click", function () {
        const dva = stavBox.pocet === 2;
        const velkosti = dva ? (stavBox.velkost || "?") + "+" + (stavBox.velkost2 || "?") : stavBox.velkost;
        meraj("lcd_set_doplnok_klik", { lcd_doplnok: "box", lcd_varianta: "box_" + stavBox.pocet, lcd_velkost: velkosti, lcd_pocet: stavBox.pocet, lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
        if (!stavBox.velkost) { hint.textContent = dva ? T.chybaVelkost1 : T.chybaVelkost; const r = fsVel.querySelector("input"); if (r) r.focus(); return; }
        if (dva && !stavBox.velkost2) { hint.textContent = T.chybaVelkost2; const r = fsVel2.querySelector("input"); if (r) r.focus(); return; }
        if (!stavBox.farba) { hint.textContent = T.chybaFarba; const r = fsFarba.querySelector("input"); if (r) r.focus(); return; }
        const zm = zmena({ typ: "box", pocet: stavBox.pocet, velkost: stavBox.velkost, velkost2: dva ? stavBox.velkost2 : null, farba: stavBox.farba }, ctx.mapa, R);
        const rozdiel = zm && rozdielCeny(ctx.volby, zm, ctx.mapa);
        if (!zm || !rozdiel) { stav.textContent = T.chyba; return; }
        spustiVymenu(ctx, { typ: "box", pocet: stavBox.pocet, velkost: velkosti, kod: "box_" + stavBox.pocet }, zm, rozdiel, T, R, stav, k);
      });

      // výber boxu hneď pod kartou boxu (na telefóne pod kartami), otvára ho tlačidlo na karte boxu
      const telo = el("div", { class: "lcd-dop__telo lcd-dop__boxvyber", id: tid, hidden: true, "data-doplnok": "box" }, [
        el("p", { class: "lcd-dop__boxtitul", text: T.boxVyber }),
        fsPocet, fsVel, fsVel2, fsFarba,
        el("div", { class: "lcd-dop__suhrn" }, [suhrnCena, tl]),
        hint,
      ]);
      const umiestni = pripniVyber(telo, karticka.li);
      btn.addEventListener("click", function () {
        const otvor = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", otvor ? "true" : "false");
        napis.textContent = otvor ? T.skrytVyber : T.vybratVelkost;
        telo.hidden = !otvor;
        umiestni();
        karticka.li.classList.toggle("je-otvorena", otvor);
        if (otvor) {
          meraj("lcd_set_doplnok_klik", { lcd_doplnok: "box", lcd_varianta: "vybrat", lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
          const pokojne = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
          try { telo.scrollIntoView({ block: "nearest", behavior: pokojne ? "auto" : "smooth" }); } catch (e) { /* starý Safari */ }
        }
      });
      prekresli();
      ctx.zobrazene.push("box");
    }
  }

  k.appendChild(stav);
  hlava.querySelector("[data-lcd-dop-nie]").addEventListener("click", function () {
    ssPis(KLUC_NIE + ctx.riadok.itemId, "1");
    meraj("lcd_set_doplnok_klik", { lcd_doplnok: ctx.zobrazene.join("+"), lcd_varianta: "nie", lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
    const sec = k.parentNode;
    k.remove();
    if (sec && !sec.querySelector(".lcd-dop__karta, .lcd-dop__hotovo")) sec.remove();
  });
  // poradie kariet (Michal 9. 10.): rohož Classic, box, rohož Premium; druhá vrstva vždy prvá (Michal 10. 10.)
  const kluc = function (li) { return PORADIE_KARIET.indexOf(li.getAttribute("data-varianta") || li.getAttribute("data-doplnok")); };
  Array.prototype.slice.call(volby.children).sort(function (a, b) { return kluc(a) - kluc(b); })
    .forEach(function (li) { volby.appendChild(li); });
  if (volby.children.length === 1) volby.classList.add("lcd-dop__volby--jedna");
  // s druhou vrstvou (prvá karta) nadpis o celom sete; len druhá vrstva (set má rohož aj box) -> nadpis o druhej vrstve
  if (ctx.zobrazene.indexOf("vrstva2") > -1) k.querySelector(".lcd-dop__nadpis").textContent = ctx.zobrazene.length === 1 ? T.nadpisVrstva : T.nadpisSet;
  return ctx.zobrazene.length ? k : null;
}

/**
 * Výmeny z viacerých kariet toho istého prehliadača idú po jednej: druhá karta počká, kým prvá výmenu dokončí,
 * a potom v kroku 1 zistí, že sa riadok zmenil („Košík sa medzitým zmenil“). Bez zámku by dve súčasné výmeny
 * toho istého setu mohli skončiť dvoma setmi alebo žiadnym.
 *   - Web Locks API (navigator.locks), čakanie max. 30 s;
 *   - bez Web Locks (iOS Safari < 15.4): zámok v localStorage (zamkniLS);
 *   - ani localStorage -> bez zámku: vymen() dostane zamknute: false a pri neistom pridaní nič nemaže.
 * fn({ zamknute, id, predchodca }) — predchodca = opustený záznam výmeny (najprv ho treba dokončiť alebo vrátiť).
 */
async function sZamkom(fn) {
  const L = webLocks();
  if (L) {
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    const t = ac ? setTimeout(function () { ac.abort(); }, 30000) : 0;
    return L.request(ZAMOK, ac ? { signal: ac.signal } : {}, function () {
      clearTimeout(t);
      const z = zaznamCitaj();
      return fn({ zamknute: true, id: noveId(), predchodca: z && (z.faza === "pridavam" || z.faza === "mazem") ? z : null });
    }).catch(function (e) {
      clearTimeout(t);
      if (e && e.name === "AbortError") return { ok: false, krok: "zmena_kosika", reload: true, sprava: "zámok: iná karta" };
      throw e;
    });
  }
  const id = noveId();
  const z = await zamkniLS(id, 30000);
  if (z.nedostupne) return fn({ zamknute: false, id: id, predchodca: null });
  if (!z.ok) return { ok: false, krok: "zmena_kosika", reload: true, sprava: "zámok: iná karta" };
  return fn({ zamknute: true, id: id, predchodca: z.predchodca });
}

/**
 * Záložný zámok v localStorage: kým iná karta drží živý záznam (tep do 5 s), čaká sa. Inak zápis {id}, krátke
 * čakanie a dvojité opätovné prečítanie — keď dve karty zapíšu naraz, vyhrá posledný zápis a druhá karta to po
 * prečítaní zistí a čaká ďalej. Opustený záznam výmeny (tep starší ako 5 s / označený pri odchode zo stránky)
 * sa vráti ako predchodca. -> { ok, predchodca } | { ok: false } (časový limit) | { nedostupne: true }
 */
async function zamkniLS(id, max) {
  const t0 = Date.now();
  for (;;) {
    let z;
    try { z = JSON.parse(localStorage.getItem(KLUC_VYMENA) || "null"); } catch (e) { return { nedostupne: true }; }
    if (!zaznamZivy(z, Date.now())) {
      const predchodca = !z ? null : z.faza === "pridavam" || z.faza === "mazem" ? z : z.faza === "zamok" && z.predchodca ? z.predchodca : null;
      if (!zaznamPis({ id: id, t: Date.now(), hb: Date.now(), faza: "zamok", predchodca: predchodca })) return { nedostupne: true };
      await pauza(150 + Math.floor(Math.random() * 100));
      let z2 = zaznamCitaj();
      if (z2 && z2.id === id) {
        await pauza(100);
        z2 = zaznamCitaj();
        if (z2 && z2.id === id) return { ok: true, predchodca: predchodca };
      }
    }
    if (Date.now() - t0 > max) return { ok: false };
    await pauza(200 + Math.floor(Math.random() * 100));
  }
}

/** Opustenú výmenu (záznam z predchádzajúcej stránky / karty) dokončí alebo vráti podľa košíka. Chyba siete -> výnimka. */
async function obnov(z, R) {
  const kosik = await nacitajKosik();
  // nový riadok sa rozoberá mapou cieľového produktu (druhá vrstva: dvojvrstvový set), inak mapou pôvodného
  const href = z.cielHref || z.href;
  let mapa = href ? await ziskajMapu(href, R, false).catch(function () { return null; }) : null;
  let o = rozhodniObnovu(z, kosik, mapa, Date.now());
  if (o.akcia === "nejasne" && href) {
    // mapa z localStorage mohla zostarnúť -> raz čerstvá
    mapa = await ziskajMapu(href, R, true).catch(function () { return null; });
    if (mapa) o = rozhodniObnovu(z, kosik, mapa, Date.now());
  }
  if (o.akcia === "vrat" || o.akcia === "dokonci") {
    o.zmena = await uberJedenKus(o.kus);
    if (!o.zmena) o.akcia = "nejasne";
  }
  if (o.akcia === "dokonci") {
    meraj(/^odober_/.test(z.kod || "") ? "lcd_set_doplnok_odobrany" : "lcd_set_doplnok_pridany", {
      lcd_doplnok: z.kod, lcd_varianta: z.varianta || null, lcd_velkost: z.velkost || null, lcd_pocet: z.pocet || null, lcd_trh: z.trh, lcd_set_sku: z.sku || null,
      lcd_value: z.rozdiel, lcd_value_wo_vat: z.rozdielB, lcd_currency: z.mena, lcd_krok: "obnova",
    });
  } else if (o.akcia === "vrat" || o.akcia === "nejasne") {
    meraj("lcd_set_doplnok_chyba", { lcd_krok: "obnova_" + o.akcia, lcd_doplnok: z.kod, lcd_trh: z.trh, lcd_set_sku: z.sku || null });
  }
  return o;
}

function dlKosik() {
  try { const e = (window.dataLayer || []).find(function (x) { return x && x.shoptet; }); return (e && e.shoptet && e.shoptet.cart) || null; } catch (e) { return null; }
}

/**
 * Pri načítaní stránky: záznam výmeny z predchádzajúcej stránky / karty.
 *  - hotovo: výmena prebehla; stránka vykreslená ešte pred zmazaním pôvodného riadku (navigácia ju predbehla) -> obnoviť raz
 *  - pridavam / mazem a výmena už nebeží (zámok voľný, resp. bez Web Locks tep starší ako 5 s / odchod) -> obnov()
 * -> { akcia, zmena, z } | null
 */
async function obnovaPriStarte(R) {
  const z = zaznamCitaj();
  if (!z) return null;
  const teraz = Date.now();
  if (!z.faza || teraz - (z.t || 0) > ZAZNAM_MAX) { zaznamZmaz(z.id); return null; }
  if (z.faza === "hotovo") {
    zaznamZmaz(z.id);
    const k = KLUC_OBNOVA + z.id;
    if (teraz - z.t < 60000 && vykreslenePredZmazanim(z.stary, dlKosik()) && !ssCitaj(k)) { ssPis(k, "1"); return { akcia: "zastarane", z: z }; }
    return null;
  }
  if (z.faza !== "pridavam" && z.faza !== "mazem") {
    // zamok / start: do košíka sa ešte nič neodoslalo
    if (!zaznamZivy(z, teraz)) zaznamZmaz(z.id);
    return null;
  }
  const vykonaj = async function () {
    const z2 = zaznamCitaj();
    if (!z2 || z2.id !== z.id) return null;
    const o = await obnov(z2, R);
    if (o.akcia !== "cakaj") zaznamZmaz(z2.id);
    o.z = z2;
    return o;
  };
  const L = webLocks();
  if (L) return L.request(ZAMOK, { ifAvailable: true }, function (lock) { return lock ? vykonaj() : { akcia: "bezi" }; });
  return zaznamZivy(z, teraz) ? { akcia: "bezi" } : vykonaj();
}

let interakcia = false;
/** Obnova pri štarte + výsledok pre stránku: { reload } | null. Výmena v inej karte / požiadavka na ceste -> neskôr znova. */
function spustObnovu(R, naKosiku, pokus, sprava) {
  pokus = pokus || 0;
  if (!pokus) {
    // zákazník už písal do formulára (krok objednávky) -> tú stránku neobnovovať
    const zaznac = function () { interakcia = true; };
    try { window.addEventListener("input", zaznac, true); window.addEventListener("change", zaznac, true); } catch (e) {}
  }
  return Promise.resolve().then(function () { return obnovaPriStarte(R); }).catch(function () { return null; }).then(function (o) {
    if (!o) return null;
    if (o.akcia === "bezi" || o.akcia === "cakaj") {
      if (pokus < 8) {
        const ms = o.akcia === "cakaj" && o.z ? Math.max(500, OBNOVA_CAKAJ - (Date.now() - (o.z.t || 0)) + 300) : 3000;
        setTimeout(function () {
          if (zamok) return; // v tejto karte práve beží výmena -> tá si opustený záznam spracuje sama (sZamkom)
          spustObnovu(R, naKosiku, pokus + 1, sprava).then(function (o2) { if (o2 && o2.reload && !zamok) location.reload(); });
        }, ms);
      }
      return null;
    }
    const T = TEXTY[R.trh];
    const objednavka = !naKosiku && !!(document.body && document.body.classList.contains("ordering-process"));
    const mozeObnovit = naKosiku || (objednavka && !interakcia);
    const zastarane = o.akcia === "zastarane" || (o.akcia === "hotove" && !!o.z && vykreslenePredZmazanim(o.z.stary, dlKosik()));
    if (sprava && o.akcia !== "zastarane" && o.akcia !== "nic") {
      const ok = o.akcia === "dokonci" || o.akcia === "hotove";
      const odober = /^odober_/.test((o.z && o.z.kod) || "");
      const text = ok ? (o.z && o.z.hotovo) || null : o.akcia === "vrat" ? (odober ? T.chybaOdober : T.chyba) : (odober ? T.chybaKontrolaOdober : T.chybaKontrola);
      if (text) ssPis(KLUC_HOTOVO, JSON.stringify({ text: text, typ: ok ? "ok" : "chyba", t: Date.now() }));
    }
    return { reload: mozeObnovit && !!(o.zmena || zastarane) };
  });
}

// ------------------------------------------------------------------ počas výmeny: zvyšok stránky stojí
/**
 * Kým výmena beží, zákazník neodíde ani nezmení košík inou cestou (inak by ostali 2 sety alebo by sa zmena stratila):
 *  - klik na odkaz (aj „Pokračovať“) sa odloží: po dokončení výmeny prehliadač prejde na jeho adresu;
 *  - ovládanie košíka Shoptetu (+ / − / ×, množstvo, kupón) a odoslanie formulára sa ignoruje, riadky sú stlmené;
 *  - F5, zatvorenie karty, adresa v paneli: beforeunload (prehliadač sa opýta). Keď zákazník aj tak odíde,
 *    pagehide označí záznam ako opustený a ďalšia stránka výmenu dokončí alebo vráti (obnovaPriStarte).
 */
function zablokujStranku(aktivne) {
  const st = { odlozene: null };
  const mimo = function (t) { return !!(t && t.closest) && !t.closest("#lcd-doplnok"); };
  const vstupy = [...document.querySelectorAll("#cart-wrapper input.amount")].filter(function (i) { return !i.readOnly; });
  vstupy.forEach(function (i) { i.readOnly = true; });
  const pokr = document.getElementById("continue-order-button");
  const pokrAria = pokr ? pokr.getAttribute("aria-disabled") : null;
  if (pokr) pokr.setAttribute("aria-disabled", "true");
  // aria-busy len na tabuľke riadkov (nie na celom #cart-wrapper — v ňom je aj stav ponuky s aria-live)
  const cw = document.querySelector("#cart-wrapper .cart-table");
  if (cw) cw.setAttribute("aria-busy", "true");
  document.documentElement.classList.add("lcd-dop-bezi");
  const klik = function (e) {
    const t = e.target;
    if (!mimo(t)) return;
    const a = t.closest("a[href]");
    if (!a && !t.closest("#cart-wrapper")) return;
    if (a && (e.ctrlKey || e.metaKey || e.shiftKey || (a.target && a.target !== "_self"))) return; // nová karta: táto stránka ostáva
    e.preventDefault();
    e.stopImmediatePropagation();
    if (a) {
      try {
        const u = new URL(a.getAttribute("href"), location.href);
        // odložiť len odkaz na INÝ dokument; „#“ (hamburger, lupa, prihlásenie v hlavičke) a kotvy tejto stránky sa zahodia —
        // location.assign na ten istý dokument by stránku neobnovil a ostala by zablokovaná (kontrola kódu, kolo 3)
        if (/^https?:$/.test(u.protocol) && u.href.split("#")[0] !== location.href.split("#")[0]) st.odlozene = u.href;
      } catch (x) {}
    }
  };
  const stopka = function (e) { if (mimo(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); } };
  const zmena = function (e) { if (mimo(e.target) && e.target.closest("#cart-wrapper")) e.stopImmediatePropagation(); };
  const odchod = function (e) { e.preventDefault(); e.returnValue = ""; return ""; };
  const skry = function () {
    const z = zaznamCitaj();
    if (z && aktivne.id && z.id === aktivne.id && BEZI[z.faza]) { z.opustene = true; zaznamPis(z); }
  };
  window.addEventListener("click", klik, true);
  window.addEventListener("submit", stopka, true);
  window.addEventListener("change", zmena, true);
  window.addEventListener("beforeunload", odchod);
  window.addEventListener("pagehide", skry);
  st.pustOdchod = function () {
    window.removeEventListener("beforeunload", odchod);
    window.removeEventListener("pagehide", skry);
  };
  st.odblokuj = function () {
    st.pustOdchod();
    window.removeEventListener("click", klik, true);
    window.removeEventListener("submit", stopka, true);
    window.removeEventListener("change", zmena, true);
    vstupy.forEach(function (i) { i.readOnly = false; });
    if (pokr) { if (pokrAria == null) pokr.removeAttribute("aria-disabled"); else pokr.setAttribute("aria-disabled", pokrAria); }
    if (cw) cw.removeAttribute("aria-busy");
    document.documentElement.classList.remove("lcd-dop-bezi");
  };
  return st;
}

async function spustiVymenu(ctx, doplnok, zm, rozdiel, T, R, stav, kartaEl) {
  if (zamok) return;
  zamok = true;
  window.__lcdCartReloading = true; // cart.js r. 15–21: počas výmeny nič neobnovovať
  const tlacidla = document.querySelectorAll("#lcd-doplnok button, #lcd-doplnok input, #lcd-doplnok select, .lcd-dop-odober button, .lcd-dop-x");
  const odober = doplnok.typ === "odober";
  tlacidla.forEach(function (b) { b.disabled = true; });
  kartaEl.setAttribute("aria-busy", "true");
  stav.className = "lcd-dop__stav";
  stav.textContent = odober ? T.odoberam : T.pridavam;
  const hotovo = odober ? (doplnok.co === "rohoz" ? T.odobraneRohoz(doplnok.nazov) : doplnok.pocet === 2 ? T.odobraneBox2 : T.odobraneBox1)
    : doplnok.typ === "vrstva2" ? T.hotovoVrstva(doplnok.nazov)
    : doplnok.typ === "rohoz" ? T.hotovoRohoz(doplnok.nazov) : doplnok.pocet === 2 ? T.hotovoBox2 : T.hotovoBox1;
  // druhá vrstva = výmena na iný produkt (dvojvrstvový set): cieľové priceId, Lux farba a mapa cieľového produktu
  const ciel = doplnok.ciel || null;
  const stary = { itemId: ctx.riadok.itemId, priceId: String(ctx.riadok.priceId), q: ctx.riadok.q };
  const aktivne = { id: null };
  const blok = zablokujStranku(aktivne);
  let v;
  try {
    v = await sZamkom(async function (zl) {
      const id = zl.id;
      aktivne.id = id;
      const zapis = function (zmeny) {
        const z = zaznamCitaj();
        if (z && z.id === id) zaznamPis(Object.assign(z, zmeny, { hb: Date.now() }));
      };
      zaznamPis({ id: id, t: Date.now(), hb: Date.now(), faza: "zamok" });
      const tep = setInterval(function () { zapis({}); }, 1000);
      try {
        if (zl.predchodca) {
          // opustená výmena (predchádzajúca stránka / iná karta) -> najprv dokončiť alebo vrátiť; zmenený košík -> obnoviť
          const o = await obnov(zl.predchodca, R).catch(function () { return { akcia: "nejasne" }; });
          if (o.akcia !== "nic" && o.akcia !== "cakaj") {
            zaznamZmaz(id);
            return { ok: false, krok: "zmena_kosika", reload: true, sprava: "obnova: " + o.akcia };
          }
        }
        zaznamPis({
          id: id, t: Date.now(), hb: Date.now(), faza: "start", trh: R.trh, mena: R.mena, href: ctx.riadok.href, stary: stary,
          ocakavane: zluc(ctx.volby, zm), kod: doplnok.kod, velkost: doplnok.velkost || null, pocet: doplnok.pocet || null,
          sku: ctx.riadok.sku || null, hotovo: hotovo, rozdiel: rozdiel.s, rozdielB: rozdiel.b, varianta: doplnok.lcdVarianta || null,
          ciel: ciel ? { priceId: String(ciel.priceId), lux: ciel.lux } : null, cielHref: ciel ? ciel.href : null,
        });
        let vys;
        try {
          vys = await vymen({
            riadok: ctx.riadok, volby: ctx.volby, mapa: ciel ? ciel.mapa : ctx.mapa, R: R, zmena: zm, rozdiel: rozdiel, doplnok: doplnok,
            ciel: ciel ? { priceId: String(ciel.priceId), lux: ciel.lux } : null,
            zamknute: zl.zamknute, faza: function (f, d) { zapis(Object.assign({ faza: f }, d)); },
          });
        } catch (e) {
          zapis({ opustene: true }); // nečakaná chyba uprostred -> záznam ostane, obnova po obnovení stránky
          throw e;
        }
        // ešte pod zámkom: hotovo (ďalšia stránka overí, či nebola vykreslená pred zmazaním) alebo záznam preč
        if (vys.ok) zaznamPis({ id: id, t: Date.now(), faza: "hotovo", stary: stary });
        else zaznamZmaz(id);
        return vys;
      } finally {
        clearInterval(tep);
      }
    });
  } catch (e) {
    // vymen() výpadky siete rieši sama; sem príde len nečakaná chyba, keď už nevieme, či sa košík zmenil -> obnoviť
    v = { ok: false, krok: "neznamy", reload: true, sprava: String((e && e.message) || e).slice(0, 120) };
  }
  if (v.ok) {
    meraj(odober ? "lcd_set_doplnok_odobrany" : "lcd_set_doplnok_pridany", {
      lcd_doplnok: doplnok.kod, lcd_varianta: doplnok.lcdVarianta || null, lcd_velkost: doplnok.velkost || null, lcd_pocet: doplnok.pocet || null, lcd_trh: R.trh,
      lcd_set_sku: ctx.riadok.sku, lcd_value: rozdiel.s, lcd_value_wo_vat: rozdiel.b, lcd_currency: R.mena,
    });
    if (ctx.kupon && !(v.kupon && v.kupon.code)) meraj("lcd_set_doplnok_chyba", { lcd_krok: "kupon", lcd_trh: R.trh, lcd_sprava: String(ctx.kupon) });
    stav.textContent = hotovo;
    blok.pustOdchod();
    if (blok.odlozene && blok.odlozene.split("#")[0] !== location.href.split("#")[0]) {
      // zákazník počas výmeny klikol na „Pokračovať“ / odkaz -> teraz tam (košík je už celý vymenený)
      const kam = blok.odlozene;
      setTimeout(function () { location.assign(kam); }, 150);
      // poistka: navigácia dokument nevymenila (súbor na stiahnutie, 204, zrušená) -> obnoviť, nech stránka nie je zablokovaná;
      // 20 s, aby pomalé mobilné pripojenie stihlo prejsť na „Pokračovať“ (5 s by navigáciu zrušilo — kontrola košíka 9. 10.)
      setTimeout(function () { location.reload(); }, 20000);
    } else {
      ssPis(KLUC_HOTOVO, JSON.stringify({ text: hotovo, typ: "ok", t: Date.now() }));
      setTimeout(function () { location.reload(); }, 150);
    }
    return;
  }
  meraj("lcd_set_doplnok_chyba", {
    lcd_krok: v.krok, lcd_code: v.code != null ? v.code : null, lcd_sprava: v.sprava ? String(v.sprava).replace(/<[^>]*>/g, "").slice(0, 160) : null,
    lcd_doplnok: doplnok.kod, lcd_varianta: doplnok.lcdVarianta || null, lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku,
  });
  // ďalšie zobrazenie košíka načíta čerstvú mapu (ponuka ukáže aktuálnu cenu); táto stránka ostáva fail-closed
  if (v.krok === "kontrola_ceny" || v.krok === "kontrola_textu") { zabudniMapu(ctx.riadok.href); if (ciel) zabudniMapu(ciel.href); }
  // pri množstve N > 1 by krížik zmazal všetky kusy setu -> pokyn ubrať 1 kus (kontrola kódu, kolo 3)
  const text = v.ciastocne
    ? (Number(ctx.riadok.q) > 1 ? (odober ? T.chybaCiastocnaOdoberViac : T.chybaCiastocnaViac) : (odober ? T.chybaCiastocnaOdober : T.chybaCiastocna))
    : v.krok === "zmena_kosika" ? T.chybaStav : v.reload ? (odober ? T.chybaKontrolaOdober : T.chybaKontrola) : odober ? T.chybaOdober : T.chyba;
  if (v.reload) {
    blok.pustOdchod();
    ssPis(KLUC_HOTOVO, JSON.stringify({ text: text, typ: "chyba", stary: v.stary || null, t: Date.now() }));
    setTimeout(function () { location.reload(); }, 150);
    return;
  }
  blok.odblokuj();
  stav.className = "lcd-dop__stav lcd-dop__stav--chyba";
  stav.textContent = text;
  kartaEl.removeAttribute("aria-busy");
  tlacidla.forEach(function (b) { b.disabled = false; });
  window.__lcdCartReloading = false;
  zamok = false;
}

/** Odrážka rozpisu (cart.js ul.lcd-rozpis) s parametrom doplnku: rohož -> „Autokoberce do kufru“, boxy -> prvá z
 *  „Farba boxov“, „Velikost Box solo“, „Velikost 1. boxu“, „Velikost 2. boxu“ (podľa názvu parametra v mape). */
export function odrazkaDoplnku(ul, d, volby, mapa, R) {
  if (!ul || !mapa || !mapa.params) return null;
  const norm = function (t) { return cisty(t).replace(/\s*:\s*$/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  const ids = d.co === "rohoz" ? [R.rohoz] : [R.farbaBox, R.boxSolo, R.box1, R.box2];
  for (const id of ids) {
    const p = mapa.params[id];
    if (!p || volby[id] === undefined) continue;
    const li = Array.prototype.find.call(ul.children, function (x) { const n = x.querySelector(".lcd-rozpis__n"); return !!n && norm(n.textContent) === norm(p.n); });
    if (li) return li;
  }
  return null;
}

/** Krížik pri doplnku setu v riadku košíka (Michal 10. 10.: odrážky ostávajú ako sú, krížik priamo pri odrážke rohože
 *  a boxov). Bez odrážky (rozpis chýba / iný názov) -> náhradný riadok „Doplnky v sete: Rohož Premium ×  2 boxy M + L ד. */
function vlozOdober(ctx, T, R, pokus) {
  const vstup = [...document.querySelectorAll('#cart-wrapper input[name="itemId"]')].find(function (i) { return i.value === ctx.riadok.itemId; });
  const tr = vstup && vstup.closest("tr");
  if (!tr || tr.querySelector(".lcd-dop-odober, .lcd-dop-x")) return;
  const ul = tr.querySelector("ul.lcd-rozpis");
  // rozpis vkladá cart.js pri načítaní košíka (ponuka beží neskôr) — keby ešte nebol, chvíľu počkať
  if (!ul && (pokus || 0) < 10) { setTimeout(function () { vlozOdober(ctx, T, R, (pokus || 0) + 1); }, 200); return; }
  const miesta = ctx.odobrat.map(function (d) { return odrazkaDoplnku(ul, d, ctx.volby, ctx.mapa, R); });
  const priOdrazke = miesta.every(Boolean) && miesta.every(function (li, i) { return miesta.indexOf(li) === i; });
  const miesto = tr.querySelector("td.p-name") || tr;
  const stav = el("span", { class: "lcd-dop__stav", role: "status", "aria-live": "polite" });
  const box = priOdrazke ? ul : el("div", { class: "lcd-dop-odober", "data-item": ctx.riadok.itemId }, [el("span", { class: "lcd-dop-odober__n", text: T.vSeteDoplnky })]);
  ctx.odobrat.forEach(function (d, poradie) {
    const b = priOdrazke
      ? el("button", { type: "button", class: "lcd-dop-x", "data-lcd-dop-odober": d.co, "data-item": ctx.riadok.itemId, "aria-label": T.odstranit + ": " + d.nazov, title: T.odstranit + ": " + d.nazov }, [
        el("i", { "aria-hidden": "true", text: "×" }),
      ])
      : el("button", { type: "button", class: "lcd-dop-odober__x", "data-lcd-dop-odober": d.co, "data-item": ctx.riadok.itemId, "aria-label": T.odstranit + ": " + d.nazov }, [
        el("span", { text: d.nazov }), el("i", { "aria-hidden": "true", text: "×" }),
      ]);
    b.addEventListener("click", function () {
      meraj("lcd_set_doplnok_klik", { lcd_doplnok: d.co, lcd_varianta: "odobrat", lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
      const zm = zmenaOdober(d.co, ctx.volby, R);
      const rozdiel = zm && rozdielCeny(ctx.volby, zm, ctx.mapa);
      if (!zm || !rozdiel) { stav.className = "lcd-dop__stav lcd-dop__stav--chyba"; stav.textContent = T.chybaOdober; return; }
      spustiVymenu(ctx, { typ: "odober", co: d.co, pocet: d.pocet || null, nazov: d.co === "rohoz" ? T[d.varianta] : d.nazov, kod: "odober_" + d.co },
        zm, rozdiel, T, R, stav, box);
    });
    if (priOdrazke) miesta[poradie].appendChild(b);
    else box.appendChild(b);
  });
  if (priOdrazke) ul.parentNode.insertBefore(stav, ul.nextSibling);
  else { box.appendChild(stav); miesto.appendChild(box); }
}

function hotovoZPredchadzajucej(sec) {
  const s = ssCitaj(KLUC_HOTOVO);
  if (!s) return;
  ssPis(KLUC_HOTOVO, null);
  let h;
  try { h = JSON.parse(s); } catch (e) { return; }
  if (!h || !h.text || Date.now() - (h.t || 0) > 120000) return;
  const p = el("p", { class: "lcd-dop__hotovo" + (h.typ === "chyba" ? " lcd-dop__hotovo--chyba" : ""), role: h.typ === "chyba" ? "alert" : "status", tabindex: "-1", text: h.text });
  sec.insertBefore(p, sec.firstChild);
  if (h.stary) {
    const tr = [...document.querySelectorAll('tr.removeable, tr[data-micro="cartItem"]')].find(function (t) {
      const i = t.querySelector('input[name="itemId"]'); return i && i.value === h.stary;
    });
    if (tr) tr.classList.add("lcd-dop-zvyrazni");
  }
  return p;
}

/** fokus na hlášku až keď je na stránke; chybovú (zákazník musí niečo v košíku opraviť) aj ukázať */
function zameraj(p) {
  if (!p || !p.isConnected) return;
  if (p.classList.contains("lcd-dop__hotovo--chyba")) {
    // po location.reload() by prehliadač po „load“ vrátil pôvodnú pozíciu (zákazník bol dole pri ponuke) a hlášku
    // by prekryl -> obnovu pozície pre túto stránku vypnúť a posunúť k hláške aj po „load“
    try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
    const ukaz = function () { try { p.scrollIntoView({ block: "center" }); } catch (e) {} };
    ukaz();
    if (document.readyState !== "complete") window.addEventListener("load", function () { setTimeout(ukaz, 0); }, { once: true });
  }
  try { p.focus({ preventScroll: true }); } catch (e) {}
}

function miestoSekcie() {
  return document.querySelector("#cart-wrapper .cart-content.summary-wrapper") || document.querySelector(".cart-content.summary-wrapper");
}

/**
 * Michal 9. 10.: zákazník musí mať voľnú cestu k „Pokračovať“ — ponuka je len možnosť navyše, ak by náhodou.
 * Kde je súhrn pod košíkom (telefón, tablet do 991 px), ide ponuka až ZA súhrn s tlačidlom „Pokračovať“;
 * na PC je vľavo vedľa súhrnu (tlačidlo ostáva vpravo hore). Pri otočení tabletu sa presunie.
 */
const POD_SUHRNOM = "(max-width: 991px)";
function podSuhrnom() { try { return !!(window.matchMedia && window.matchMedia(POD_SUHRNOM).matches); } catch (e) { return false; } }
function umiestni(sec, m) {
  // chybová hláška po výmene (napr. pôvodný set ostal v košíku) ide pred súhrn — zákazník ju musí vidieť pred objednaním
  if (podSuhrnom() && !sec.querySelector(".lcd-dop__hotovo--chyba")) { if (sec.parentNode !== m || sec !== m.lastElementChild) m.appendChild(sec); }
  else if (sec.parentNode !== m || sec !== m.firstElementChild) m.insertBefore(sec, m.firstChild);
}
let sledujeMiesto = false;
function sledujMiesto() {
  if (sledujeMiesto || !window.matchMedia) return;
  sledujeMiesto = true;
  const mq = window.matchMedia(POD_SUHRNOM);
  const f = function () {
    const sec = document.getElementById("lcd-doplnok"), m = miestoSekcie();
    if (sec && m && sec.parentNode === m) umiestni(sec, m);
  };
  if (mq.addEventListener) mq.addEventListener("change", f);
  else if (mq.addListener) mq.addListener(f);
}

function vlozSekciu(sec) {
  const m = miestoSekcie();
  if (m) { umiestni(sec, m); sledujMiesto(); }
  else {
    const t = document.querySelector("#cart-wrapper table.cart-table");
    if (!t) return false;
    t.parentNode.insertBefore(sec, t.nextSibling);
  }
  return true;
}

// ------------------------------------------------------------------ štart
let zachytene = null;

/**
 * Volať PRED initCart (cart.js prepíše text príplatkov). Zachytí riadky košíka zo serverového HTML a zvyšok
 * (mapy, vykreslenie) spustí asynchrónne — teda až po synchrónnom initCart.
 */
export function initKosikDoplnok(setupData) {
  try {
    const R = ROLE[projekt()];
    if (!R) return;
    ulozMapuProduktu();
    const b = document.body;
    const naKosiku = !!(b && (b.classList.contains("id--9") || b.classList.contains("in-kosik")));
    const s = setupData || {};
    const ponuka = naKosiku && !/[?&]lcddoplnok=0\b/.test(location.search) &&
      !(s.kosik_doplnky === false || (s.settings && s.settings.kosik_doplnky === false));
    // rozbehnutá výmena z predchádzajúcej stránky / karty (zákazník odišiel počas výmeny): dokončiť alebo vrátiť —
    // na každej stránke, kde je záznam (košík, krok objednávky, …), aj keď je ponuka vypnutá
    const obnova = zaznamCitaj() ? spustObnovu(R, naKosiku, 0, ponuka) : null;
    if (!ponuka) {
      if (obnova) obnova.then(function (o) { if (o && o.reload) location.reload(); });
      return;
    }
    zachytene = rozoberRiadky(document);
    // data-lcd-doplnok na <html> = počet kariet ponuky po dokončení (0 = nič) — pre testy a ladenie
    const hotovo = function (n) { try { document.documentElement.setAttribute("data-lcd-doplnok", String(n)); } catch (e) {} };
    Promise.resolve(obnova).then(function (o) {
      if (o && o.reload) { window.__lcdCartReloading = true; location.reload(); return null; } // ponuka až na obnovenej stránke
      return spusti(R).then(hotovo);
    }).catch(function (e) {
      hotovo("chyba");
      meraj("lcd_set_doplnok_chyba", { lcd_krok: "init", lcd_trh: R.trh, lcd_sprava: String((e && e.message) || e).slice(0, 160) });
    });
  } catch (e) {}
}

/**
 * Auto k riadku košíka (pre Lux 15 pri Mercedes V-Class). sessionStorage konfigurátora (Brand / Model / model) drží
 * len POSLEDNÉ nakonfigurované auto, riadok košíka auto nenesie -> zo sessionStorage len vtedy, keď je v košíku
 * jediný set autokobercov; pri viacerých setoch len text riadku (inak všeobecné pravidlo, čierna + šedé šitie = Lux 10).
 */
export function autoKRiadku(riadok, pocetSetov, citaj) {
  const casti = [];
  if (pocetSetov === 1 && citaj) ["Brand", "Model", "model"].forEach(function (k) { const v = citaj(k); if (v) casti.push(v); });
  casti.push((riadok && riadok.text) || "");
  return casti.join(" ").trim();
}

/** Promise s časovým limitom: nestihne -> null (pomalé / visiace spojenie nesmie zdržať celú ponuku) */
export function sLimitom(p, ms) {
  return Promise.race([
    Promise.resolve(p).catch(function () { return null; }),
    new Promise(function (r) { setTimeout(function () { r(null); }, ms); }),
  ]);
}

function cestaMapy(href) { return projekt() + ":" + new URL(href, location.href).pathname; }
/** Smie sa mapa stiahnuť čerstvá? Len staršia ako 60 s a nie tá istá (t), ktorá už raz čerstvo nepomohla. */
function mozemObnovit(href, m) {
  if (!m || Date.now() - (m.t || 0) <= 60000) return false;
  try { return localStorage.getItem(KLUC_SKUSENA + cestaMapy(href)) !== String(m.t); } catch (e) { return true; }
}
function oznacSkusenu(href, m) {
  try { if (m && m.t) localStorage.setItem(KLUC_SKUSENA + cestaMapy(href), String(m.t)); } catch (e) {}
}

/**
 * Ponuka druhej vrstvy k riadku (jednovrstvový set): mapa dvojvrstvového produktu (z localStorage, inak stiahnuť
 * jeho stránku) + ponukaVrstvy. Nesedí -> raz s čerstvou mapou; stále nie -> null (ponuka sa neukáže).
 */
export async function ponukaDruhejVrstvy(riadok, volby, mapa, R, auto) {
  if (!R.sety || R.sety[mapa.pid] == null || maDruhuVrstvu(riadok.variant)) return null;
  const href = adresaDvojvrstvoveho(riadok.href);
  if (!href) return null;
  // jednovrstvová mapa bez priceId riadku (nová farba 1. vrstvy, mapa z iného zariadenia) -> raz čerstvá;
  // bez neho ponuka nevznikne -> stránku dvojvrstvového produktu ani nesťahovať
  if (!v1ZPriceId(riadok.priceId, mapa, R)) {
    if (!mozemObnovit(riadok.href, mapa)) return null;
    const f = await ziskajMapu(riadok.href, R, true).catch(function () { return null; });
    const rb = f && rozoberPriplatky(riadok.sur, f);
    if (rb && rb.ok && rovnakeVolby(rb.volby, volby)) mapa = f;
    if (!v1ZPriceId(riadok.priceId, mapa, R)) { if (f) oznacSkusenu(riadok.href, f); return null; } // sieťová chyba -> bez značky
  }
  let mc = await ziskajMapu(href, R, false);
  let p = mc && ponukaVrstvy(riadok, volby, mapa, mc, R, auto);
  if (!p && mozemObnovit(href, mc)) {
    // mapa z localStorage mohla zostarnúť (nová cena / varianta v admine) -> raz čerstvá (čerstvo stiahnutú nie znova)
    mc = await ziskajMapu(href, R, true);
    p = mc && ponukaVrstvy(riadok, volby, mapa, mc, R, auto);
  }
  if (!p) { oznacSkusenu(href, mc); return null; }
  p.href = href;
  p.mapa = mc;
  return p;
}

async function spusti(R) {
  const T = TEXTY[R.trh];
  const riadky = zachytene || [];
  const maSamostatnuRohoz = riadky.some(function (r) { return /koberced?-do-kufr/i.test(r.href || ""); });
  const maSamostatnyBox = riadky.some(function (r) { return /boxi?-do-kufr/i.test(r.href || ""); });
  let kandidati = riadky.filter(function (r) {
    return r.itemId && r.priceId && r.href && r.maPriplatky && r.sur && r.q >= 1 &&
      !/\btruck\b|kami[oó]n/i.test(r.text) && !/(boxi?-do-kufr|koberced?-do-kufr|vzorkovnik|poukaz|kamion)/i.test(r.href);
  });
  const sec = el("div", { id: "lcd-doplnok", class: "lcd-dop", role: "region", "aria-label": T.nadpis });
  const pred = ssCitaj(KLUC_HOTOVO);
  const naOdstranenie = (function () { try { const h = pred && JSON.parse(pred); return (h && h.typ === "chyba" && h.stary) || null; } catch (e) { return null; } })();
  if (naOdstranenie) kandidati = kandidati.filter(function (r) { return r.itemId !== naOdstranenie; });
  if (!kandidati.length) {
    if (pred) { const h = hotovoZPredchadzajucej(sec); if (sec.firstChild && vlozSekciu(sec)) zameraj(h); }
    return 0;
  }
  const kupon = (function () { try { const c = getShoptetContext().cartInfo; return c && c.discountCoupon && c.discountCoupon.code; } catch (e) { return null; } })();

  const ctxs = (await Promise.all(kandidati.map(async function (riadok) {
    // „Nie, ďakujem“ skryje len ponuku; krížiky na odobratie doplnku ostávajú
    const nie = !!ssCitaj(KLUC_NIE + riadok.itemId);
    let mapa = await ziskajMapu(riadok.href, R, false).catch(function () { return null; });
    let rozbor = mapa ? rozoberPriplatky(riadok.sur, mapa) : null;
    if (mapa && (!rozbor.ok || !jeSet(mapa, R))) {
      // mapa z localStorage mohla zostarnúť (premenovanie v admine) -> raz čerstvá
      mapa = await ziskajMapu(riadok.href, R, true).catch(function () { return null; });
      rozbor = mapa ? rozoberPriplatky(riadok.sur, mapa) : null;
    }
    if (!mapa || !rozbor || !rozbor.ok) return null;
    const ch = coChyba(rozbor.volby, mapa, R);
    if (!ch) return null;
    const ponuka = { rohoz: !nie && ch.rohoz === "chyba" && !maSamostatnuRohoz, box: !nie && ch.box === "chyba" && !maSamostatnyBox };
    const odobrat = doplnkySetu(rozbor.volby, mapa, R, T);
    // druhá vrstva (len jednovrstvový set; stránka dvojvrstvového produktu sa sťahuje až teraz) a ceny samostatných
    // produktov súbežne, každé s limitom: chyba / nestihne -> bez ponuky druhej vrstvy, resp. bez porovnania
    const [vrstva2, samostatne] = await Promise.all([
      nie ? null : sLimitom(ponukaDruhejVrstvy(riadok, rozbor.volby, mapa, R, autoKRiadku(riadok, kandidati.length, ssCitaj)), 5000),
      ponuka.rohoz || ponuka.box ? sLimitom(ziskajSamostatneCeny(dizajnZAdresy(riadok.href), R), 4000) : null,
    ]);
    ponuka.vrstva2 = vrstva2;
    if (!ponuka.rohoz && !ponuka.box && !ponuka.vrstva2 && !odobrat.length) return null;
    return { riadok: riadok, mapa: mapa, volby: rozbor.volby, ponuka: ponuka, odobrat: odobrat, samostatne: samostatne, kupon: kupon, zobrazene: [] };
  }))).filter(Boolean);
  // krížiky pri doplnkoch setu (aj keď ponuka nie je); ponuka len pre sety, ktorým niečo chýba
  ctxs.forEach(function (ctx) { if (ctx.odobrat.length) vlozOdober(ctx, T, R); });
  const ponuky = ctxs.filter(function (c) { return c.ponuka.rohoz || c.ponuka.box || c.ponuka.vrstva2; });

  // rovnaký set viackrát (napr. po rozdelení množstva) -> k názvu cena za kus, aby sa karty dali rozlíšiť
  const ceny = (function () {
    try { const e = (window.dataLayer || []).find(function (x) { return x && x.shoptet; }); return (e && e.shoptet && e.shoptet.cart) || []; } catch (e) { return []; }
  })();
  const nazvy = ponuky.map(function (c) { return setNazov(c.riadok); });
  ponuky.forEach(function (ctx, i) {
    const dup = nazvy.filter(function (n) { return n === nazvy[i]; }).length > 1;
    const c = ceny.find(function (x) { return x && x.itemId === ctx.riadok.itemId; });
    ctx.kSetu = nazvy[i] + (dup && c && typeof c.priceWithVat === "number" ? " · " + cenaText(c.priceWithVat, R) : "");
  });
  ponuky.forEach(function (ctx) {
    const k = karta(ctx, T, R, ponuky.length > 1);
    if (k) sec.appendChild(k);
  });
  // názov oblasti pre čítačky = viditeľný nadpis (jedna karta), pri viacerých kartách so druhou vrstvou všeobecný
  const nadpisy = sec.querySelectorAll(".lcd-dop__karta .lcd-dop__nadpis");
  if (nadpisy.length === 1) { sec.removeAttribute("aria-label"); sec.setAttribute("aria-labelledby", nadpisy[0].id); }
  else if (ctxs.some(function (c) { return c.zobrazene.indexOf("vrstva2") > -1; })) sec.setAttribute("aria-label", T.nadpisSet);
  const hlaska = pred ? hotovoZPredchadzajucej(sec) : null;
  if (!sec.firstChild || document.getElementById("lcd-doplnok") || !vlozSekciu(sec)) return 0;
  zameraj(hlaska);
  let karty = 0;
  ctxs.forEach(function (ctx) {
    if (ctx.zobrazene.length) karty++;
    ctx.zobrazene.forEach(function (d) {
      meraj("lcd_set_doplnok_zobrazenie", { lcd_doplnok: d, lcd_trh: R.trh, lcd_set_sku: ctx.riadok.sku });
    });
  });
  return karty;
}

/** Karta ponuky pre testy (tools/test-kosik-doplnok.mjs): poradie kariet, texty, výber Lux farby. */
export function kartaPonuky(ctx, R, viacSetov) { return karta(ctx, TEXTY[R.trh], R, viacSetov); }
