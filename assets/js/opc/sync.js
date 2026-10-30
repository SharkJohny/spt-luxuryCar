// One page checkout (kniha OPC § 6.5): uloženie dopravy a platby do session Shoptetu cez Step1Validate (XHR) a stavový
// stroj zmeny voľby na kroku 2. Ten istý POST, aký pošle formulár kroku 1, len na pozadí. Odpoveď XHR je JSON
// {"code":303,"payload":{"returnUrl":…}} (overené 28. 10. 2026 na SK aj CZ, kniha § 4.5). Čo session naozaj má, sa potvrdí
// z GET /objednavka/krok-1/ (101 kB, ~0,5 s): zaškrtnutá doprava a platba + #summary-box so sumou (živý dôkaz 29. 10.;
// step2CustomerAjax naživo vracia payload [] bez HTML, preto sa nevolá). GET /objednavka/krok-2/ (459 kB) je len záloha,
// keď súhrn kroku 1 nestačí (opc/vzhlad.js potvrdenieZKroku1). Objednávku nikdy neodosiela — Step2Validate ide len
// natívnym formulárom.
//
// Stavy (§ 6.5): nacitavam -> potvrdene <-> meni-sa -> (potvrdene | chyba); zachrana (sekcia sa nezobrazí).
//   - zmena voľby: stav meni-sa hneď, požiadavka po debounce 300 ms, naraz najviac 1 (novšia voľba počká a pôjde po nej),
//   - Step1Validate ≠ 303 / sieť: 1 automatický pokus, potom overenie súhrnu zo servera: má pôvodnú voľbu -> chyba
//     (overené, odoslať sa smie s pôvodnou), má novú -> potvrdene, nevieme -> chyba neoverená (odoslanie stojí),
//   - 303, ale súhrn zo servera nesedí s voľbou -> rovnako ako pri chybe (overí sa, čo server naozaj má),
//   - požiadavka dobehla, keď zákazník medzitým zvolil inú voľbu: čo session má, sa vezme zo súhrnu zo servera; keď ho
//     nevieme, voľba sa považuje za neoverenú a najnovšia voľba sa pošle vždy (revízia R2 29. 10. 2026),
//   - overZnova(): súhrn na stránke nesedí s potvrdenou voľbou (napr. neskorá odpoveď Shoptetu) -> overí sa zo servera.

export const LIMIT_MS = 8000;
export const LIMIT_KROK1_MS = 4000; // GET /objednavka/krok-1/ na pozadí (košík aj krok 2): dlhšie = dnešný tok / záchrana
export const DEBOUNCE_MS = 300;
export const POKUS_MS = 600;
export const CESTA_KROK1 = "/objednavka/krok-1/";
export const CESTA_KROK2 = "/objednavka/krok-2/";

function csrf() {
  // CSRF: na LCD dnes vypnuté (shoptet.csrf.enabled = false); keď ho Shoptet zapne, token ako injectToken (test S15)
  try {
    const c = window.shoptet && window.shoptet.csrf;
    return c && c.enabled && c.token ? String(c.token) : null;
  } catch (e) {
    return null;
  }
}

const XHR = {
  "X-Requested-With": "XMLHttpRequest",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Accept: "application/json, text/javascript, */*; q=0.01",
};

/** Je platba rýchla platba cez banku (Shoptet Pay „pis“) podľa modelu kroku 1? */
export function jePisPlatba(model, id) {
  const p = model && model.platby ? model.platby.find(function (x) { return x.id === String(id); }) : null;
  return !!(p && p.podmetoda === "pis");
}

/**
 * Telo Step1Validate: polia formulára kroku 1 (model.pole) s vybranou dopravou a platbou, pri zapnutom CSRF aj __csrf__.
 * Rýchla platba cez banku (volby.shoptetPayPisCode, len keď je billingId „pis“): kód banky hneď za billingId — presne ako
 * formulár kroku 1 Shoptetu, kde skryté pole shoptetPayPisCode leží v riadku tej platby (zachytené offline 30. 10. 2026:
 * language=sk&shippingId=96&billingId=112&shoptetPayPisCode=vub_banka_oauth_client_sk&gopayPayInstrument=).
 */
export function teloStep1(model, volby) {
  const telo = new URLSearchParams();
  const s = String(volby.shippingId), b = String(volby.billingId);
  const kod = volby.shoptetPayPisCode && jePisPlatba(model, b) ? String(volby.shoptetPayPisCode) : null;
  const pridajB = function () { telo.append("billingId", b); if (kod) telo.append("shoptetPayPisCode", kod); };
  let maS = false, maB = false;
  model.pole.forEach(function (p) {
    if (p[0] === "shippingId") { if (!maS) telo.append("shippingId", s); maS = true; return; }
    if (p[0] === "billingId") { if (!maB) pridajB(); maB = true; return; }
    if (p[0] === "__csrf__" || p[0] === "shoptetPayPisCode") return;
    telo.append(p[0], p[1]);
  });
  if (!maS) telo.append("shippingId", s);
  if (!maB) pridajB();
  const t = csrf();
  if (t) telo.set("__csrf__", t);
  return telo;
}

/** Je returnUrl náš krok 2 na tom istom webe? -> cesta, inak null. */
export function cestaKroku2(returnUrl, origin) {
  try {
    const u = new URL(String(returnUrl || ""), origin);
    if (u.origin !== origin) return null;
    return /^\/objednavka\/krok-2\/?$/.test(u.pathname) ? u.pathname + u.search : null;
  } catch (e) {
    return null;
  }
}

/** fetch s časovým limitom -> Response | { chyba: "limit" | "siet" } */
export function fetchSLimitom(url, init, limit) {
  const ovladac = typeof AbortController === "function" ? new AbortController() : null;
  let casovac = null;
  const vyprsal = new Promise(function (res) {
    casovac = setTimeout(function () {
      try { if (ovladac) ovladac.abort(); } catch (e) {}
      res({ chyba: "limit" });
    }, limit);
  });
  const p = fetch(url, Object.assign({ credentials: "same-origin", signal: ovladac ? ovladac.signal : undefined }, init))
    .catch(function () { return { chyba: "siet" }; });
  return Promise.race([p, vyprsal]).then(function (v) {
    clearTimeout(casovac);
    return v;
  });
}

/** Chyby v messages odpovede Shoptetu: [] / {} / { notices } -> [] (bez chýb); { errors: [...] } -> zoznam; neznámy tvar -> ["?"]. */
function chybySprav(m) {
  if (m == null) return [];
  if (Array.isArray(m)) return m.length ? ["?"] : []; // neprázdne pole správ nepoznáme -> fail-closed
  if (typeof m !== "object") return ["?"];
  const e = m.errors;
  if (e == null) return [];
  if (Array.isArray(e)) return e.map(String);
  return [String(e)];
}

/**
 * Prísne kritérium úspechu Step1Validate (živý dôkaz 29. 10. 2026): code 303 + payload.returnUrl = krok 2 na tom istom webe
 * + messages bez errors. Neplatná voľba vracia TIEŽ 303 (messages.errors, returnUrl krok 1) a v session zruší krok 1;
 * bez session je code null (T7b). -> { ok: true, ciel } | { ok: false, typ: "kod" | "chyby" | "ciel", kod, chyby }
 */
export function vysledokStep1(j, origin) {
  if (!j || typeof j !== "object" || Number(j.code) !== 303) {
    return { ok: false, typ: "kod", kod: j && typeof j === "object" ? j.code : null };
  }
  const chyby = chybySprav(j.messages);
  if (chyby.length) return { ok: false, typ: "chyby", kod: 303, chyby: chyby };
  const ciel = cestaKroku2(j.payload && j.payload.returnUrl, origin);
  return ciel ? { ok: true, ciel: ciel } : { ok: false, typ: "ciel", kod: 303 };
}

/**
 * Step1Validate na pozadí (prísne kritérium: vysledokStep1).
 * -> { ok: true, ciel: "/objednavka/krok-2/" } | { ok: false, typ: "siet" | "limit" | "kod" | "chyby" | "ciel", kod }
 */
export function posliStep1(model, volby, moznosti) {
  const limit = (moznosti && moznosti.limit) || LIMIT_MS;
  const origin = window.location.origin;
  return fetchSLimitom(model.akcia, { method: "POST", headers: XHR, body: teloStep1(model, volby).toString() }, limit)
    .then(function (r) {
      if (r.chyba) return { ok: false, typ: r.chyba };
      if (!r.ok) return { ok: false, typ: "kod", kod: r.status };
      return r.json().then(function (j) { return vysledokStep1(j, origin); });
    })
    .catch(function () { return { ok: false, typ: "siet" }; });
}

/** Text bez nadbytočných medzier (aj NBSP). */
function cisty(s) {
  return String(s == null ? "" : s).replace(/[\s ]+/g, " ").trim();
}

/** Názov z riadku súhrnu („<span>€3</span> Dobierkou“ -> „Dobierkou“) a cena v ňom. */
function riadokSuhrnu(el) {
  if (!el) return { nazov: "", cena: "" };
  const c = el.querySelector('[data-testid="recapItemPrice"]');
  const kopia = el.cloneNode(true);
  kopia.querySelectorAll('[data-testid="recapItemPrice"]').forEach(function (x) { x.remove(); });
  return { nazov: cisty(kopia.textContent), cena: cisty(c && c.textContent) };
}

/**
 * Čo ukazuje súhrn Shoptetu (#summary-box alebo jeho HTML): doprava, platba, ich ceny, celkom, počet položiek.
 * -> { doprava, dopravaCena, platba, platbaCena, celkom, tovar, polozky: [{ nazov, text }] } | null (súhrn nie je rozoznateľný)
 */
export function suhrnInfo(koren) {
  try {
    let r = koren;
    if (typeof koren === "string") {
      r = new DOMParser().parseFromString("<div>" + koren + "</div>", "text/html").body.firstElementChild;
    }
    if (!r || !r.querySelector) return null;
    const d = riadokSuhrnu(r.querySelector('[data-testid="recapDeliveryMethod"]'));
    const p = riadokSuhrnu(r.querySelector('[data-testid="recapPaymentMethod"]'));
    const celkom = r.querySelector('[data-testid="recapFullPrice"]');
    if (!d.nazov || !p.nazov || !celkom) return null;
    const tovar = r.querySelector('[data-testid="recapItemTotalPrice"]');
    const polozky = Array.prototype.map.call(r.querySelectorAll(".cart-items .cart-item"), function (e) {
      const a = e.querySelector("a.main-link, .cart-item-name");
      const kopia = a ? a.cloneNode(true) : null;
      if (kopia) kopia.querySelectorAll("span, ul, div").forEach(function (x) { x.remove(); });
      return { nazov: cisty(kopia ? kopia.textContent : ""), text: cisty(e.textContent) };
    });
    return {
      doprava: d.nazov, dopravaCena: d.cena, platba: p.nazov, platbaCena: p.cena,
      celkom: cisty(celkom.textContent), tovar: cisty(tovar && tovar.textContent), polozky: polozky,
    };
  } catch (e) {
    return null;
  }
}

/** Názvy zo súhrnu -> id dopravy a platby z modelu kroku 1 (porovnanie názvov). Nejasné -> null. */
export function volbaZoSuhrnu(model, info) {
  if (!model || !info) return null;
  const rovne = function (a, b) { return cisty(a).toLowerCase() === cisty(b).toLowerCase(); };
  const d = model.doprava.filter(function (x) { return rovne(x.nazov, info.doprava); });
  const p = model.platby.filter(function (x) { return rovne(x.nazov, info.platba); });
  if (d.length !== 1 || p.length !== 1) return null;
  return { doprava: d[0].id, platba: p[0].id };
}

/** GET /objednavka/krok-1/ na pozadí s limitom (4 s). -> { ok: true, html } | { ok: false, typ: "limit" | "siet" | "stranka" } */
export function nacitajKrok1(limit) {
  return fetchSLimitom(CESTA_KROK1, { headers: { Accept: "text/html" } }, limit || LIMIT_KROK1_MS)
    .then(function (r) {
      if (r.chyba) return { ok: false, typ: r.chyba };
      // prázdny košík / vypršaná session: Shoptet presmeruje na /kosik/
      if (!r.ok || !/\/objednavka\/krok-1\/?$/.test(new URL(r.url, location.href).pathname)) return { ok: false, typ: "stranka" };
      return r.text().then(function (h) { return { ok: true, html: h }; });
    })
    .catch(function () { return { ok: false, typ: "siet" }; });
}

/**
 * Záloha potvrdenia: #summary-box z GET /objednavka/krok-2/ (459 kB, na telefóne pomalé), len keď súhrn kroku 1 nestačí.
 * Limit ako pri kroku 1 (4 s). -> { ok: true, html, zdroj: "krok2" } | { ok: false, typ }
 */
export function nacitajSuhrnKroku2(limit) {
  return fetchSLimitom(CESTA_KROK2, { headers: { Accept: "text/html" } }, limit || LIMIT_KROK1_MS)
    .then(function (r) {
      if (r.chyba) return { ok: false, typ: r.chyba };
      if (!r.ok || !/\/objednavka\/krok-2\/?$/.test(new URL(r.url, location.href).pathname)) return { ok: false, typ: "stranka" };
      return r.text().then(function (h) {
        const box = new DOMParser().parseFromString(h, "text/html").getElementById("summary-box");
        return box ? { ok: true, html: box.innerHTML, zdroj: "krok2" } : { ok: false, typ: "suhrn" };
      });
    })
    .catch(function () { return { ok: false, typ: "siet" }; });
}

const rovnake = function (a, b) { return !!a && !!b && String(a.doprava) === String(b.doprava) && String(a.platba) === String(b.platba); };
const kopia = function (v) { return v ? { doprava: String(v.doprava), platba: String(v.platba) } : null; };

/**
 * Stavový stroj zmeny dopravy a platby (§ 6.5). Závislosti sa dávajú zvonka (testy bez siete):
 *   o.zvolene  { doprava, platba } — voľba, ktorú má session Shoptetu teraz (overená pri štarte)
 *   o.posli(volby)   -> Promise<{ ok, typ, kod }>        Step1Validate
 *   o.potvrd()       -> Promise<{ ok, volby, html, info }> súhrn zo servera (GET krok 1); volby = čo naozaj má (null = nevieme)
 *   o.naZmenu(stav, detail)                               UI (vzhlad), detail: { volby, potvrdene, html, typ, overene }
 *   o.debounce (300), o.pokusMs (600)
 */
export function vytvorSync(o) {
  const st = {
    stav: "potvrdene",
    potvrdene: kopia(o.zvolene),
    vybrane: kopia(o.zvolene),
    overene: true,
    typ: null,
    letiaca: false,
    casovac: null,
    noveHtml: null, // súhrn zo servera k potvrdenej voľbe, ktorý ešte UI nedostalo (medzivetva)
    noveInfo: null,
    poziadavky: 0, // počítadlo pre testy / ladenie
    sucasne: 0,
    maxSucasne: 0,
    zamknute: false, // odosielanie beží (krok2.js, T3-L7): voľba sa nemení, nič sa neposiela
    vynutit: false, // znova(): tá istá voľba sa pošle ešte raz (iná banka pri rýchlej platbe, opc/banka.js)
    cakatelia: [],
  };
  const debounce = o.debounce == null ? DEBOUNCE_MS : o.debounce;
  const pokusMs = o.pokusMs == null ? POKUS_MS : o.pokusMs;

  function oznam(stav, detail) {
    st.stav = stav;
    const d = Object.assign({ volby: kopia(st.vybrane), potvrdene: kopia(st.potvrdene), overene: st.overene, typ: st.typ }, detail || {});
    if (stav !== "meni-sa") {
      // súhrn k potvrdenej voľbe z medzivetvy, ak tento stav nenesie novší
      if (d.html == null && st.noveHtml != null) { d.html = st.noveHtml; d.info = st.noveInfo; }
      st.noveHtml = null;
      st.noveInfo = null;
    }
    try { if (o.naZmenu) o.naZmenu(stav, d); } catch (e) {}
    if (stav !== "meni-sa") {
      const c = st.cakatelia.splice(0);
      c.forEach(function (f) { f(stav); });
    }
  }

  function posliSPokusom(v) {
    st.poziadavky++;
    st.sucasne++;
    st.maxSucasne = Math.max(st.maxSucasne, st.sucasne);
    const hotovo = function (r) { st.sucasne--; return r; };
    return Promise.resolve().then(function () { return o.posli(v); }).catch(function () { return { ok: false, typ: "vynimka" }; }).then(hotovo)
      .then(function (r) {
        if (r && r.ok) return r;
        if (r && r.typ === "limit") return r; // 8 s bez odpovede: druhý pokus by zákazníka nechal čakať ďalších 8 s
        if (r && r.typ === "chyby") return r; // server voľbu výslovne odmietol (messages.errors) -> pokus nič nezmení
        // max. 1 automatický pokus (kniha § 6.9)
        return new Promise(function (res) { setTimeout(res, pokusMs); }).then(function () {
          if (!rovnake(st.vybrane, v)) return r; // medzitým iná voľba -> pokus nemá zmysel
          st.poziadavky++;
          st.sucasne++;
          st.maxSucasne = Math.max(st.maxSucasne, st.sucasne);
          return Promise.resolve().then(function () { return o.posli(v); }).catch(function () { return { ok: false, typ: "vynimka" }; }).then(hotovo);
        });
      });
  }

  function potvrd() {
    return Promise.resolve().then(function () { return o.potvrd(); }).catch(function () { return { ok: false, typ: "vynimka" }; });
  }

  function vyhodnot(v, r, p) {
    // r = výsledok Step1Validate, p = súhrn zo servera (čo naozaj má session)
    const server = p && p.ok ? p.volby : null;
    if (r && r.ok && server && rovnake(server, v)) {
      st.potvrdene = kopia(v);
      st.overene = true;
      st.typ = null;
      return oznam("potvrdene", { html: p.html, info: p.info });
    }
    st.typ = r && r.ok ? "nezhoda" : (r && r.typ) || "chyba";
    if (server && rovnake(server, v)) {
      // Step1Validate „zlyhal“ (napr. limit), ale session má novú voľbu -> zmena prešla
      st.potvrdene = kopia(v);
      st.overene = true;
      st.typ = null;
      return oznam("potvrdene", { html: p.html, info: p.info });
    }
    if (server) {
      // server má inú (zvyčajne pôvodnú) voľbu -> UI sa vráti na ňu, odoslať sa smie (súhrn = session)
      st.potvrdene = kopia(server);
      st.vybrane = kopia(server);
      st.overene = true;
      return oznam("chyba", { html: p.html, info: p.info });
    }
    // nevieme, čo má session -> odoslanie stojí, kým zákazník nezvolí znova (alebo nejde na krok 1)
    st.vybrane = kopia(st.potvrdene);
    st.overene = false;
    return oznam("chyba", {});
  }

  /** Letiaca požiadavka (Step1Validate a/alebo potvrdenie súhrnu) dobehla: vyhodnotiť, alebo ísť na novšiu voľbu. */
  function dobehla(v, r1, p) {
    st.letiaca = false;
    if (!rovnake(st.vybrane, v) || st.vynutit) {
      // medzitým nová voľba: výsledok tejto požiadavky len posunie, čo session má, a ide sa ďalej
      if (p && p.ok && p.volby) {
        st.potvrdene = kopia(p.volby);
        st.overene = true;
        st.noveHtml = p.html;
        st.noveInfo = p.info;
      } else {
        // nevieme, čo session má (napr. Step1Validate prešiel, ale súhrn zlyhal) -> najnovšia voľba sa pošle vždy,
        // aj keď je rovnaká ako posledná potvrdená (revízia R2)
        st.overene = false;
      }
      if (!st.casovac) spusti();
      return;
    }
    vyhodnot(v, r1, p);
  }

  function zlyhalo() {
    st.letiaca = false;
    st.vybrane = kopia(st.potvrdene);
    st.overene = false;
    st.typ = "vynimka";
    oznam("chyba", {});
  }

  function spusti() {
    st.casovac = null;
    if (st.letiaca) return; // po dokončení letiacej pôjde najnovšia voľba
    const v = kopia(st.vybrane);
    if (rovnake(v, st.potvrdene) && st.overene && !st.vynutit) return oznam("potvrdene", {});
    st.vynutit = false;
    st.letiaca = true;
    let r1 = null;
    posliSPokusom(v)
      .then(function (r) { r1 = r; return potvrd(); })
      .then(function (p) { dobehla(v, r1, p); })
      .catch(zlyhalo);
  }

  const api = {
    stav: function () { return st.stav; },
    potvrdene: function () { return kopia(st.potvrdene); },
    vybrane: function () { return kopia(st.vybrane); },
    overene: function () { return st.overene; },
    typ: function () { return st.typ; },
    statistika: function () { return { poziadavky: st.poziadavky, maxSucasne: st.maxSucasne }; },
    zamknute: function () { return st.zamknute; },
    /**
     * Zámok počas odosielania (živý dôkaz T3-L7): Shoptet môže formulár poslať až po overení telefónu (form.submit bez
     * udalosti submit) — kým odosielanie beží, zmena voľby ani overenie nepošlú nič, inak by objednávka odišla s platbou,
     * ktorú stránka neukazovala. Zamyká a odomyká krok2.js.
     */
    zamkni: function (zap) { st.zamknute = !!zap; },
    /** Zákazník zvolil dopravu/platbu. */
    zvol: function (volby) {
      if (st.stav === "zachrana" || st.zamknute) return;
      st.vybrane = kopia(volby);
      if (st.casovac) clearTimeout(st.casovac);
      st.casovac = null;
      if (!st.letiaca && st.overene && !st.vynutit && rovnake(st.vybrane, st.potvrdene)) {
        // späť na potvrdenú voľbu ešte pred odoslaním: nič sa neposiela
        if (st.stav !== "potvrdene") { st.typ = null; oznam("potvrdene", {}); }
        return;
      }
      if (st.stav !== "meni-sa") oznam("meni-sa", {});
      else { try { if (o.naZmenu) o.naZmenu("meni-sa", { volby: kopia(st.vybrane), potvrdene: kopia(st.potvrdene), overene: st.overene }); } catch (e) {} }
      st.casovac = setTimeout(spusti, debounce);
    },
    /**
     * Tá istá voľba ešte raz (Step1Validate): pri rýchlej platbe cez banku zákazník zmenil banku (opc/banka.js), voľba
     * dopravy a platby sa nemení, ale session musí dostať nový shoptetPayPisCode. Ako zvol: meni-sa hneď, požiadavka po
     * debounce, počas letiacej ide po nej. V zámku (odosielanie) a v záchrane nič.
     */
    znova: function () {
      if (st.stav === "zachrana" || st.zamknute) return;
      st.vynutit = true;
      if (st.casovac) clearTimeout(st.casovac);
      st.casovac = null;
      if (st.stav !== "meni-sa") oznam("meni-sa", {});
      else { try { if (o.naZmenu) o.naZmenu("meni-sa", { volby: kopia(st.vybrane), potvrdene: kopia(st.potvrdene), overene: st.overene }); } catch (e) {} }
      st.casovac = setTimeout(spusti, debounce);
    },
    /** Smie ísť objednávka (session = to, čo zákazník vidí)? */
    mozeOdoslat: function () {
      return st.stav === "potvrdene" || st.stav === "zachrana" || (st.stav === "chyba" && st.overene);
    },
    /** Promise so stavom, keď už nie je meni-sa (alebo po ms). */
    pripravene: function (ms) {
      if (st.stav !== "meni-sa") return Promise.resolve(st.stav);
      return new Promise(function (res) {
        let hotovo = false;
        const f = function (s) { if (!hotovo) { hotovo = true; res(s); } };
        st.cakatelia.push(f);
        if (ms) setTimeout(function () { f(st.stav); }, ms);
      });
    },
    /**
     * Overí zo servera, čo má session (bez Step1Validate): súhrn na stránke nesedí s potvrdenou voľbou alebo platba
     * nie je overená. -> true = overenie beží (stav meni-sa), false = práve beží zmena (overí sa sama) / záchrana.
     */
    overZnova: function () {
      if (st.stav === "zachrana" || st.zamknute || st.letiaca || st.casovac) return false;
      const v = kopia(st.vybrane);
      st.letiaca = true;
      oznam("meni-sa", { overenie: true });
      potvrd()
        .then(function (p) { dobehla(v, { ok: true }, p); })
        .catch(zlyhalo);
      return true;
    },
    /**
     * Resync pred odoslaním našiel na serveri inú voľbu alebo sumu (iné okno, T5/T6): voľba a súhrn zo servera sa prevezmú
     * bez Step1Validate (server ich už má) a stav je potvrdene. -> UI dostane html súhrnu cez naZmenu, detail.prevzate
     * = true (voľbu nezmenil zákazník v tejto karte -> analytika ju do GA neposiela, opc/analytika.js zname).
     */
    prevezmi: function (volby, html, info) {
      if (st.stav === "zachrana" || !volby) return;
      if (st.casovac) clearTimeout(st.casovac);
      st.casovac = null;
      st.potvrdene = kopia(volby);
      st.vybrane = kopia(volby);
      st.overene = true;
      st.typ = null;
      oznam("potvrdene", { html: html, info: info, prevzate: true });
    },
    zachrana: function (dovod) {
      if (st.casovac) clearTimeout(st.casovac);
      st.casovac = null;
      st.typ = dovod || "zachrana";
      oznam("zachrana", {});
    },
  };
  return api;
}
