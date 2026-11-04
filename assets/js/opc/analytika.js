// One page checkout: analytika GA4 (gtag Shoptetu) tam, kde OPC obchádza načítanie stránky (živý dôkaz T9a, T11,
// T12, T15 29. 10. 2026; kniha OPC § 10.6).
//   - Natívny krok 1 posiela inline gtag('event', 'begin_checkout', {…}) (+ page_view). OPC krok 1 preskočí, preto
//     begin_checkout pošle OPC: LEN keď sa krok 1 naozaj preskočil (príznak z košíka v sessionStorage, čerstvý, zmaže sa
//     pri prvom čítaní = najviac raz; každá iná stránka s OPC, napr. natívny krok 1, ho zahodí) a payload vezme z HTML
//     kroku 1, ktoré OPC na kroku 2 aj tak sťahuje.
//   - Krok 2 posiela pri načítaní add_payment_info s payment_type "<data-payment-type>~<názov platby>" (✅ "transfer~Prevodom",
//     "shoptetpay~Apple Pay", "shoptetpay~Online platba kartou"; 🟡 dobierka "cashOnDelivery~Dobierkou" podľa toho istého
//     vzoru). Zmenu platby v OPC Shoptet nevidí (krok 2 sa nenačíta znova) -> OPC pošle add_payment_info pri POTVRDENEJ
//     zmene (nie pri prvom zobrazení, nie pri chybe, nie 2× za sebou pre tú istú platbu). Payload = add_payment_info
//     z inline skriptu kroku 2, vymení sa len payment_type. Keď vzor alebo typ chýba: len dataLayer lcd_opc_platba.
//     Platbu, ktorú session dostala inde (overenie zo servera, prevzatie pri resyncu = iná karta), len zapamätá (zname).
//   - Fail-closed: čo sa nedá bezpečne prečítať (iný tvar skriptu, 2 výskyty, neplatný JSON), sa neposiela.
//   - Skok z webu (opc/skok.js): stránka košíka sa nenačíta, chýbal by view_cart -> pošle ho krok 2 z payloadu begin_checkout.
//   - Meta (živá sonda 4. 11. 2026, kniha § 10.36): Shoptet vkladá fbq("track", …) do HTML podľa poradia načítaní: prvá
//     stránka po pridaní AddToCart, krok 1 AddPaymentInfo. OPC krok 1 sťahuje na pozadí, skripty v ňom nebežia -> udalosti sa
//     odložia a pošle ich krok 2 s pôvodným eventID Shoptetu. fbq je na stránke len so súhlasom s cookies, bez neho nič.

export const KLUC_PRESKOCIL = "lcdOpcPreskocilKrok1";
export const PRESKOCIL_MAX_MS = 60000; // príznak z košíka platí 1 min (krok 2 sa medzitým načíta aj na pomalom telefóne)
export const KLUC_BEZ_KOSIKA = "lcdOpcBezKosika"; // skok z webu: stránka košíka sa nenačítala
export const KLUC_META = "lcdOpcMeta"; // udalosti Meta z kroku 1 stiahnutého na pozadí, čakajú na krok 2
const UDALOSTI_META = /^(AddToCart|InitiateCheckout|AddPaymentInfo)$/;

/** Index konca JSON objektu/poľa od otváracej zátvorky na pozícii i (reťazce s escape) alebo -1. */
function koniecJson(s, i) {
  let hlbka = 0, vRetazci = false, esc = false;
  const max = Math.min(s.length, i + 200000);
  for (let k = i; k < max; k++) {
    const c = s[k];
    if (vRetazci) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') vRetazci = false;
      continue;
    }
    if (c === '"') vRetazci = true;
    else if (c === "{" || c === "[") hlbka++;
    else if (c === "}" || c === "]") {
      hlbka--;
      if (hlbka === 0) return k;
      if (hlbka < 0) return -1;
    }
  }
  return -1;
}

/**
 * Payload udalosti z inline skriptu Shoptetu: gtag('event', '<udalost>', {…JSON…}); -> objekt | null.
 * Len keď je volanie práve 1×, objekt je platný JSON s poľom items a za ním nasleduje „)“.
 */
export function payloadUdalosti(text, udalost) {
  try {
    const s = String(text || "");
    const re = new RegExp("gtag\\(\\s*['\"]event['\"]\\s*,\\s*['\"]" + udalost + "['\"]\\s*,\\s*\\{", "g");
    const najdene = [];
    let m;
    while ((m = re.exec(s))) najdene.push(m);
    if (najdene.length !== 1) return null;
    const zac = najdene[0].index + najdene[0][0].length - 1;
    const kon = koniecJson(s, zac);
    if (kon < 0 || !/^\s*\)/.test(s.slice(kon + 1, kon + 12))) return null;
    const o = JSON.parse(s.slice(zac, kon + 1));
    if (!o || typeof o !== "object" || Array.isArray(o) || !Array.isArray(o.items)) return null;
    return o;
  } catch (e) {
    return null;
  }
}

/** payment_type v tvare Shoptetu z platby modelu kroku 1 ({ typ: data-payment-type, nazov }) | null. */
export function typPlatby(platba) {
  if (!platba || !platba.typ || !platba.nazov) return null;
  return String(platba.typ) + "~" + String(platba.nazov);
}

/** Košík a skok z webu: OPC práve preskakuje krok 1 (tesne pred prechodom na krok 2). bezKosika = aj stránku košíka. */
export function oznacPreskocenie(teraz, bezKosika) {
  try {
    sessionStorage.setItem(KLUC_PRESKOCIL, String(teraz || Date.now()));
    if (bezKosika) sessionStorage.setItem(KLUC_BEZ_KOSIKA, "1");
    else sessionStorage.removeItem(KLUC_BEZ_KOSIKA);
  } catch (e) {}
}

/** Krok 2: prišlo sa skokom z webu, bez stránky košíka? Prečíta sa a hneď zmaže. */
export function vezmiBezKosika() {
  try {
    const v = sessionStorage.getItem(KLUC_BEZ_KOSIKA);
    sessionStorage.removeItem(KLUC_BEZ_KOSIKA);
    return v === "1";
  } catch (e) {
    return false;
  }
}

/** Krok 2: preskočil sa krok 1? Príznak sa prečíta a hneď zmaže (najviac raz); starší ako 1 min neplatí. */
export function vezmiPreskocenie(teraz) {
  let v = null;
  try {
    v = sessionStorage.getItem(KLUC_PRESKOCIL);
    sessionStorage.removeItem(KLUC_PRESKOCIL);
  } catch (e) {
    return false;
  }
  const t = Number(v);
  const vek = (teraz || Date.now()) - t;
  return !!v && Number.isFinite(t) && vek >= -5000 && vek < PRESKOCIL_MAX_MS;
}

/**
 * Iná stránka než krok 2 (s OPC v karte): príznak preč. Prechod z košíka sa prerušil (krok 2 presmeroval na krok 1,
 * Späť, …) -> natívny krok 1 poslal begin_checkout sám a krok 2 ho nesmie poslať druhýkrát (volá opc/index.js).
 */
export function zahodPreskocenie() {
  try {
    sessionStorage.removeItem(KLUC_PRESKOCIL);
    sessionStorage.removeItem(KLUC_BEZ_KOSIKA);
    sessionStorage.removeItem(KLUC_META);
  } catch (e) {}
}

/** window.gtag Shoptetu (inline skript stránky); bez neho nič. -> true = zavolané */
function gtag() {
  try {
    if (typeof window.gtag !== "function") return false;
    window.gtag.apply(window, arguments);
    return true;
  } catch (e) {
    return false;
  }
}

/** begin_checkout z HTML kroku 1, len keď sa krok 1 preskočil. -> true = poslané */
export function posliBeginCheckout(htmlKroku1, preskocil) {
  if (!preskocil) return false;
  const p = payloadUdalosti(htmlKroku1, "begin_checkout");
  return p ? gtag("event", "begin_checkout", p) : false;
}

/** view_cart pri skoku z webu (stránka košíka sa nenačítala): rovnaký payload ako begin_checkout, inak by v lieviku chýbal. */
export function posliViewCart(htmlKroku1, bezKosika) {
  if (!bezKosika) return false;
  const p = payloadUdalosti(htmlKroku1, "begin_checkout");
  return p ? gtag("event", "view_cart", Object.assign({}, p, { content_group: "cart" })) : false;
}

/** fbq("track", "<meno>", {…}, {"eventID":…}) z HTML stránky -> [[meno, údaje, voľby], …]; čo sa nedá prečítať, vynechá. */
export function udalostiMeta(html) {
  const s = String(html || ""), out = [];
  const re = /fbq\("track",\s*"([A-Za-z]+)",\s*\{/g;
  let m;
  while ((m = re.exec(s))) {
    if (!UDALOSTI_META.test(m[1])) continue;
    try {
      const i = m.index + m[0].length - 1, k = koniecJson(s, i);
      if (k < 0) continue;
      const v = s.indexOf("{", k + 1), kv = v > -1 && v - k < 5 ? koniecJson(s, v) : -1;
      if (kv < 0) continue;
      const volby = JSON.parse(s.slice(v, kv + 1));
      if (volby.eventID) out.push([m[1], JSON.parse(s.slice(i, k + 1)), volby]);
    } catch (e) {}
  }
  return out;
}

function citajMeta() {
  try { return JSON.parse(sessionStorage.getItem(KLUC_META) || "[]"); } catch (e) { return []; }
}

/** Každá udalosť raz, platí prvé stiahnutie (Shoptet AddToCart vloží len do prvej stránky po pridaní). */
function spojMeta(a, b) {
  const out = a.slice();
  b.forEach(function (u) { if (!out.some(function (x) { return x[0] === u[0]; })) out.push(u); });
  return out;
}

/** Krok 1 stiahnutý na pozadí: jeho skripty nebežia, udalosti Meta sa odložia pre krok 2. */
export function odlozMeta(html) {
  try {
    const nove = udalostiMeta(html);
    if (nove.length) sessionStorage.setItem(KLUC_META, JSON.stringify(spojMeta(citajMeta(), nove)));
  } catch (e) {}
}

/**
 * Krok 2: odložené udalosti + z jeho vlastného stiahnutia kroku 1, len keď sa krok 1 preskočil. fbq zapína Shoptet po
 * načítaní stránky (súhlas s cookies), preto ešte pár pokusov; bez súhlasu sa nikdy neobjaví a nepošle sa nič.
 * o (testy): { pokusy: [ms…], cakaj: fn }. -> počet poslaných hneď
 */
export function posliMeta(htmlKroku1, preskocil, o) {
  const zoznam = spojMeta(citajMeta(), preskocil ? udalostiMeta(htmlKroku1) : []);
  try { sessionStorage.removeItem(KLUC_META); } catch (e) {}
  if (!preskocil || !zoznam.length) return 0;
  const pokusy = ((o && o.pokusy) || [500, 1500, 3000]).slice();
  const cakaj = (o && o.cakaj) || setTimeout;
  function posli() {
    if (typeof window.fbq !== "function") {
      if (pokusy.length) cakaj(posli, pokusy.shift());
      return 0;
    }
    let n = 0;
    zoznam.forEach(function (u) {
      try { window.fbq("track", u[0], u[1], u[2]); n++; } catch (e) {}
    });
    return n;
  }
  return posli();
}

/** Text inline skriptu stránky, ktorý volá danú udalosť (krok 2: add_payment_info) | "". */
export function skriptSUdalostou(doc, udalost) {
  try {
    const s = Array.prototype.find.call(doc.querySelectorAll("script:not([src])"), function (x) {
      return String(x.textContent || "").indexOf("'" + udalost + "'") !== -1;
    });
    return s ? String(s.textContent || "") : "";
  } catch (e) {
    return "";
  }
}

/**
 * Sledovanie platby na kroku 2. o: { skript (inline skript kroku 2), platba (id pri načítaní = už poslal Shoptet),
 * model (krok 1), meraj (dataLayer) } -> potvrdena(id): add_payment_info pri zmene oproti poslednej poslanej platbe.
 * potvrdena.zname(id): session má túto platbu, ale nezvolil ju zákazník v tejto karte (iné okno, prevzatie zo servera)
 * -> neposiela sa, len sa zapamätá (dvojité počítanie s druhou kartou nie; 🟡 kniha § 10.6).
 */
export function sledujPlatbu(o) {
  const vzor = payloadUdalosti(o.skript, "add_payment_info");
  let posledna = o.platba == null ? null : String(o.platba);
  const potvrdena = function (id) {
    const novaId = String(id);
    if (novaId === posledna) return false;
    posledna = novaId;
    const pl = o.model && o.model.platby ? o.model.platby.find(function (x) { return x.id === novaId; }) : null;
    const typ = typPlatby(pl);
    if (vzor && typ) {
      const p = Object.assign({}, vzor, { payment_type: typ });
      if (gtag("event", "add_payment_info", p)) return true;
    }
    // formát sa nedá odvodiť / gtag chýba: len vlastná udalosť (kniha § 10.6)
    try { if (o.meraj) o.meraj("lcd_opc_platba", { lcd_opc_platba: novaId, lcd_opc_typ: typ }); } catch (e) {}
    return false;
  };
  potvrdena.zname = function (id) {
    if (id != null) posledna = String(id);
  };
  return potvrdena;
}
