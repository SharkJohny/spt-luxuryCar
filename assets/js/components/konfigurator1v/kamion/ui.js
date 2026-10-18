// UI konfigurátora kamiónov a dodávok (SK 640): hlavička, 6 krokov, súhrn, lepivá lišta. Port schváleného artefaktu
// kamiony-app/app.js (render a akcie ř. 38–130, 164–680, 755–995) BEZ pásu ukážky, poznámok k návrhu, prepínača
// PC/Telefón, vlastnej galérie, ukážky košíka a obsahu pod konfigurátorom (docs/kamiony-1v-plan.md §3.1–3.2).
// Všetky tlačidlá type="button", žiadne name (koreň je vo <form>). Ceny len z cena.js (živé ceny Shoptetu).
// Do košíka nič nepíše: zmenu výberu a „Pridať do košíka“ odovzdá cez naZmenu / doKosika (index.js -> shoptet.js).
import { TEXTY } from "./texty.js";
import { MATERIALY, LEMOVANIE, NASIVKY, NITE, POLIA, PORADIE_POLI, ZNACKY, FOTKA_DVERI_SUBOR, FOTKA_KABINY_NASIVKY } from "./data.js";
import { OBRAZKY_1V } from "../ctx.js";
import { vypocitajCenu, ponuka as ponukaCien, tapacirDostupny } from "./cena.js";
import { novyStav, koberecNas as knS, najdiZnacku, najdiModel, naStavCeny } from "./stav.js";

const NB = " "; // nezalomiteľná medzera „423 €“ (ako artefakt a 1V)
const P = "k1v-"; // predpona id prvkov (stránka Shoptetu má vlastné id)
const FOTKA_KABINY = OBRAZKY_1V + FOTKA_KABINY_NASIVKY; // kabína zhora so všetkými tromi nášivkami (krok 5)
const FOTKA_DVERI = OBRAZKY_1V + FOTKA_DVERI_SUBOR; // celý panel dverí s tapacírom 3:2 (krok 6)

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
const attr = esc;
const eur = (n) => n + NB + "€";
const plus = (n) => "+" + NB + eur(n);
const roky = (s) => String(s).replace(/(\d{4})-(\d{4})/g, "$1–$2");
const fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
const mala = (s) => { s = String(s); return s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s; };
const tvar = (n, slova) => (n === 1 ? slova[0] : n >= 2 && n <= 4 ? slova[1] : slova[2]);

/**
 * @param {{ root: HTMLElement, hlavicka: HTMLElement|null, lista: HTMLElement, ceny: object, motivy: {boky:string[],stred:string[],dvere:string[]},
 *   predvyber?: object|null, naZmenu: (S) => void, doKosika: (S) => boolean, priChybe?: (e) => void, okno?: Window }} o
 */
export function vytvorUi(o) {
  const T = TEXTY, U0 = T.ui;
  const root = o.root, lst = o.lista;
  const w = o.okno || window;
  const doc = root.ownerDocument;
  const D = { ceny: o.ceny, vozidla: { znacky: ZNACKY } };
  const S = novyStav();
  const U = { otvoreny: "vozidlo", chyby: {}, chybaKosik: false, zablesk: null, dvereInfo: false, odosiela: false, viac: {} };
  if (o.predvyber) {
    S.typ = o.predvyber.typ || S.typ;
    S.znacka = o.predvyber.znacka;
    S.model = o.predvyber.model;
    S.polia = Object.assign({}, o.predvyber.polia || {});
  }
  const $ = (sel) => root.querySelector(sel);

  // ------------------------------------------------------------------ prístup k dátam (artefakt ř. 38–130)
  const znackyTypu = () => ZNACKY.filter((z) => z.typ === S.typ).sort((a, b) => a.meno.localeCompare(b.meno, "sk"));
  const znacka = () => najdiZnacku(S.znacka);
  const model = () => najdiModel(S);
  const tapDostupny = () => tapacirDostupny(S, D);
  const kroky = () => { const k = ["vozidlo", "material", "farba", "lemovanie", "nasivky"]; if (tapDostupny()) k.push("tapacir"); return k; };
  const matT = (nazov) => T.kroky.material.volby.filter((v) => v.shoptet === nazov)[0];
  const matD = (nazov) => MATERIALY.filter((m) => m.nazov === nazov)[0];
  function farbyMat(nazov) {
    const m = matD(nazov);
    if (!m) return [];
    const por = T.kroky.farba.mena_farieb_navrh[nazov] || [];
    const byKod = {};
    m.farby.forEach((f) => { byKod[f.kod] = f; });
    const out = [];
    por.forEach((p) => { if (byKod[p.kod]) { out.push(Object.assign({}, byKod[p.kod], { meno: p.meno })); delete byKod[p.kod]; } });
    m.farby.forEach((f) => { if (byKod[f.kod]) out.push(Object.assign({}, f, { meno: f.kod })); });
    return out;
  }
  const farba = (nazov, kod) => farbyMat(nazov).filter((f) => f.kod === kod)[0];
  const lemy = () => LEMOVANIE.map((l) => { const t = T.kroky.lemovanie.volby.filter((v) => v.kod === l.kod)[0]; return Object.assign({}, l, { menoUi: t ? t.nazov : l.meno }); });
  const lem = (kod) => lemy().filter((l) => l.kod === kod)[0];
  function motiv(kod) {
    const n = NASIVKY.filter((z) => z.kod === kod)[0] || {};
    const t = T.kroky.nasivky.motiv.volby.filter((v) => v.kod === kod)[0];
    return Object.assign({}, n, { kod, meno: t ? t.meno : kod });
  }
  const motivy = (miesto) => (o.motivy[miesto] || []).map(motiv);
  function nit(kod) {
    const n = NITE.filter((x) => x.kod === kod)[0] || {};
    const t = T.kroky.nasivky.nit.volby.filter((v) => v.kod === kod)[0];
    return Object.assign({}, n, { kod, menoUi: t ? t.meno : n.meno });
  }
  const nite = () => NITE.map((n) => nit(n.kod));
  function kratkaHodnota(pole, hodnota) {
    const p = T.kroky.vozidlo.polia[pole];
    return p && p.moznosti && p.moznosti[hodnota] ? p.moznosti[hodnota] : hodnota;
  }
  function detailyVozidla() {
    const m = model();
    if (!m) return "";
    return PORADIE_POLI.filter((p) => m.polia[p] && S.polia[p]).map((p) => {
      const k = kratkaHodnota(p, S.polia[p]);
      if (p === "sedadlo") return /^Bez/.test(k) ? mala(k) : fill(U0.sedadlo, { x: mala(k) });
      if (p === "brzda") return fill(U0.brzda, { x: mala(k) });
      return mala(k);
    }).join(" · ");
  }
  function nazovVozidla() {
    const z = znacka();
    if (!z) return "";
    return z.meno + (S.model ? " " + roky(S.model) : "");
  }
  const koberecNas = () => knS(S);
  function motivTxt(x) { const m = motiv(x.motiv), n = nit(x.nit); return m.meno + " (" + m.kod + ") · " + fill(U0.nit, { x: mala(n.menoUi) }) + " (" + n.kod + ")"; }
  function matKratko(nazov) { const t = matT(nazov); return t ? t.nazov + ", " + t.variant : nazov; }
  const ponuka = () => ponukaCien(D);
  function cenaMaterialu(nazov) { const x = ponuka().material[nazov]; return x ? plus(x) : T.kroky.material.cena_v_cene; }
  const eurX = (t, x) => fill(t, { x: eur(x) });
  const tapMaterial = () => (S.tapRovnaky ? S.material : S.tapMat);
  const tapFarbaKod = () => (S.tapRovnaky ? S.farba : S.tapFarba);
  const tapLemKod = () => (S.tapRovnaky ? S.lem : S.tapLem);
  function odporucanyLem() {
    if (!S.material || !S.farba) return null;
    const f = farba(S.material, S.farba);
    if (!f) return null;
    const m = f.meno.toLowerCase();
    if (/béž|karamel|krém/.test(m)) return "11";
    if (/hned|koňak|čokol/.test(m)) return "13";
    return "09";
  }

  // ------------------------------------------------------------------ kontrola krokov (artefakt ř. 164–225)
  function chyba(id) {
    const tk = T.kroky;
    let c, m, i;
    switch (id) {
      case "vozidlo":
        c = tk.vozidlo.chyby;
        if (!S.znacka) return { pole: "znacka", msg: c.znacka };
        if (!S.model) return { pole: "model", msg: c.model };
        m = model();
        for (i = 0; i < m.povinne_polia.length; i++) {
          if (!S.polia[m.povinne_polia[i]]) return { pole: m.povinne_polia[i], msg: c[m.povinne_polia[i]] || c.karta };
        }
        return null;
      case "material": return S.material ? null : { pole: "material", msg: tk.material.chyba };
      case "farba":
        if (!S.material) return { pole: "farba", msg: tk.material.chyba };
        return S.farba ? null : { pole: "farba", msg: tk.farba.chyba };
      case "lemovanie": return S.lem ? null : { pole: "lem", msg: tk.lemovanie.chyba };
      case "nasivky":
        c = tk.nasivky.chyby;
        if (!S.nas) return { pole: "nas", msg: c.volba };
        if (S.nas === "boky" || S.nas === "boky+stred") {
          if (!S.nasBoky.motiv) return { pole: "bokyMotiv", msg: c.motiv };
          if (!S.nasBoky.nit) return { pole: "bokyNit", msg: c.nit };
        }
        if (S.nas === "stred") {
          if (!S.nasStred.motiv) return { pole: "stredMotiv", msg: c.motiv };
          if (!S.nasStred.nit) return { pole: "stredNit", msg: c.nit };
        }
        if (S.nas === "boky+stred" && !S.stredRovnaky) {
          if (!S.nasStred.motiv) return { pole: "stredMotiv", msg: c.motiv_stred };
          if (!S.nasStred.nit) return { pole: "stredNit", msg: c.nit_stred };
        }
        return null;
      case "tapacir":
        c = tk.tapacir.chyby;
        if (!S.tap) return { pole: "tap", msg: c.volba };
        if (S.tap === "nie") return null;
        if (!S.tapRovnaky) {
          if (!S.tapMat) return { pole: "tapMat", msg: c.material };
          if (!S.tapFarba || !farba(S.tapMat, S.tapFarba)) return { pole: "tapFarba", msg: c.farba };
          if (!S.tapLem) return { pole: "tapLem", msg: c.lemovanie };
        }
        if (S.tapNas == null) return { pole: "tapNas", msg: c.nasivka };
        if (S.tapNas && !(S.tapNasRovnaka && koberecNas())) {
          if (!S.tapNasMotiv) return { pole: "dvereMotiv", msg: c.motiv };
          if (!S.tapNasNit) return { pole: "dvereNit", msg: c.nit };
        }
        return null;
    }
    return null;
  }
  const hotovy = (id) => !chyba(id);
  const vsetkoHotove = () => kroky().every(hotovy);
  /* Červené ostane len pole, ktoré bolo červené a stále nie je vyplnené (artefakt). */
  function prepocitajChyby() {
    Object.keys(U.chyby).forEach((id) => {
      const ch = kroky().indexOf(id) >= 0 ? chyba(id) : null;
      if (ch && ch.pole === U.chyby[id].pole) U.chyby[id] = ch;
      else delete U.chyby[id];
    });
    if (vsetkoHotove()) U.chybaKosik = false;
  }

  const cena = () => vypocitajCenu(naStavCeny(S), D);

  // ------------------------------------------------------------------ hlavička (raz)
  function renderHlavicka() {
    const h = T.hlavicka;
    const hl = o.hlavicka;
    const h1 = hl && hl.querySelector("h1");
    const typ = doc.createElement("p");
    typ.className = "k-typ";
    typ.textContent = h.kicker;
    const hodn = doc.createElement("a");
    hodn.className = "k-hodn";
    hodn.href = "#p1v-recenzie";
    hodn.hidden = true;
    hodn.addEventListener("click", naHodnotenie);
    if (h1) {
      h1.classList.add("k-h1");
      h1.innerHTML = esc(h.h1[0]) + " <em>" + esc(h.h1[1]) + "</em>";
      hl.insertBefore(typ, h1);
      h1.parentNode.insertBefore(hodn, h1.nextSibling);
      root.appendChild(hl);
    } else {
      const nove = doc.createElement("p");
      nove.className = "k-h1";
      nove.innerHTML = esc(h.h1[0]) + " <em>" + esc(h.h1[1]) + "</em>";
      root.appendChild(typ);
      root.appendChild(nove);
      root.appendChild(hodn);
    }
    const zvysok = doc.createElement("div");
    zvysok.className = "k-info-telo";
    zvysok.innerHTML =
      '<p class="k-perex">' + esc(h.perex) + "</p>" +
      '<div class="k-cena"><div class="k-cena__stl"><div class="k-cena__fig"><div class="k-cena__stitok">' + esc(h.cena_popis.stitok) +
      '</div><div class="k-cena__teraz"><i class="k-cena__od">' + esc(h.cena_popis.od) + ' </i><b class="k-cena__suma">' + eur(D.ceny.zaklad_eur) + "</b></div></div></div></div>" +
      '<div class="vc"><span class="vc__h">' + esc(h.v_cene.nadpis) + '</span><ul class="vc__l">' + h.v_cene.chipy.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul></div>" +
      '<div data-k="kompat"></div><div data-k="postup"></div><div class="k-kroky" data-k="kroky"></div><div data-k="suhrn"></div>';
    root.appendChild(zvysok);
    return hodn;
  }

  /** Klik na hodnotenie pod H1 -> sekcia Recenzie pod konfigurátorom (ako 1V cena.js; starý widget, ak nová nie je). */
  function naHodnotenie(e) {
    e.preventDefault();
    const nova = doc.querySelector('.p1v-miesto [data-lcd-sekcia="a-recenzie"]');
    const ciel = nova && nova.getClientRects().length ? nova : doc.querySelector(".lcd-reviews-widget");
    if (!ciel) return;
    const plynulo = !(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
    try { w.scrollTo({ top: ciel.getBoundingClientRect().top + w.pageYOffset - 90, behavior: plynulo ? "smooth" : "auto" }); } catch (x) { /* staré prehliadače */ }
  }

  /** Hodnotenie z Google (window.LCD_REVIEWS, ako 1V cena.js); kým dáta nie sú, riadok je skrytý. */
  function nastavHodnotenie(hodn, p) {
    const r = Number(p.rating), n = Math.round(Number(p.totalReviews));
    if (!(r > 0) || !(n > 0)) return false;
    const rt = r.toFixed(1).replace(".", ",");
    const hv = Math.max(0, Math.min(5, Math.round(r)));
    const tv = tvar(n, T.hlavicka.hodnotenie.tvary);
    hodn.innerHTML = "<b>" + rt + '</b><span class="k-hodn__st" aria-hidden="true">' + "★★★★★".slice(0, hv) + "☆☆☆☆☆".slice(0, 5 - hv) + "</span><i>" + n + " " + esc(tv) + " " + esc(U0.na_google) + "</i>";
    hodn.setAttribute("aria-label", fill(U0.hodnotenie_aria, { r: rt, n, tvar: tv }));
    hodn.hidden = false;
    return true;
  }

  // ------------------------------------------------------------------ kroky (artefakt ř. 286–346)
  function vyPlaceholder(id) {
    const p = U0.placeholder;
    switch (id) {
      case "vozidlo": return p.vozidlo;
      case "material": return fill(p.material, { n: MATERIALY.length });
      case "farba": return S.material ? fill(p.farba, { n: farbyMat(S.material).length }) : p.farba_bez;
      case "lemovanie": return p.lemovanie;
      case "nasivky": return p.nasivky;
      case "tapacir": return p.tapacir;
    }
    return "";
  }
  function zhrnutie(id) {
    const tk = T.kroky;
    let t, f, l, s;
    switch (id) {
      case "vozidlo": s = nazovVozidla(); t = detailyVozidla(); return t ? s + " · " + t : s;
      case "material": t = matT(S.material); return fill(tk.material.zhrnutie, { nazov: t.nazov, variant: t.variant, cena_text: cenaMaterialu(S.material) });
      case "farba": f = farba(S.material, S.farba); return fill(tk.farba.zhrnutie, { farba: f.meno, kod: f.kod });
      case "lemovanie": l = lem(S.lem); return l.menoUi + " (" + l.kod + ")";
      case "nasivky": {
        if (S.nas === "nechcem") return tk.nasivky.zhrnutie_nie;
        const rozsah = tk.nasivky.rozsah[S.nas];
        const x = S.nas === "stred" ? S.nasStred : S.nasBoky;
        s = rozsah + " · " + motiv(x.motiv).meno + " · " + fill(U0.nit, { x: mala(nit(x.nit).menoUi) });
        if (S.nas === "boky+stred" && !S.stredRovnaky) s += " · stred: " + motiv(S.nasStred.motiv).meno + ", " + fill(U0.nit, { x: mala(nit(S.nasStred.nit).menoUi) });
        return s;
      }
      case "tapacir":
        if (S.tap === "nie") return tk.tapacir.zhrnutie_nie;
        f = S.tapRovnaky ? null : farba(S.tapMat, S.tapFarba);
        s = S.tapRovnaky ? tk.tapacir.zhrnutie_ano : fill(tk.tapacir.zhrnutie_ano_vlastne, { nazov: matT(S.tapMat).nazov, variant: matT(S.tapMat).variant, farba: f ? mala(f.meno) : "" });
        return s + (S.tapNas ? U0.tap_s_nasivkou : "");
    }
    return "";
  }

  function renderKroky() {
    const ks = kroky(), M = ks.length;
    $('[data-k="kroky"]').innerHTML = ks.map((id, i) => {
      const t = T.kroky[id];
      const open = U.otvoreny === id, done = hotovy(id), err = !!U.chyby[id];
      const cls = "k-krok" + (open ? " is-open" : "") + (done && !open ? " is-done" : "") + (err ? " is-error" : "");
      const vy = done ? zhrnutie(id) : vyPlaceholder(id);
      return '<section class="' + cls + '" data-krok="' + id + '" id="' + P + "krok-" + id + '">' +
        '<button type="button" class="k-krok__hd" data-a="krok" data-v="' + id + '" data-f="hd:' + id + '" aria-expanded="' + open + '" aria-controls="' + P + "telo-" + id + '">' +
        '<span class="k-krok__no" aria-hidden="true">' + (i + 1) + '</span><span class="k-krok__tx">' +
        '<span class="k-krok__ey">' + esc(fill(U0.krok_ey, { n: i + 1, m: M })) + '</span><span class="k-krok__ti">' + esc(t.otazka) + "</span>" +
        '<span class="k-krok__nm">' + esc(t.nazov) + (done && !open ? '<span class="k-sr">' + esc(U0.krok_hotove) + "</span>" : "") + '</span><span class="k-krok__vy">' + esc(vy) + "</span></span>" +
        '<span class="k-krok__zm" aria-hidden="true">' + esc(T.kroky.tlacidla.zmenit) + "</span></button>" +
        '<div class="k-krok__telo" id="' + P + "telo-" + id + '" role="group" aria-label="' + attr(t.nazov) + '">' + (open ? telo(id, i === M - 1) : "") + "</div></section>";
    }).join("");

    const h = ks.filter(hotovy).length;
    $('[data-k="postup"]').innerHTML = '<div class="k-postup"><span class="k-postup__t">' + esc(fill(U0.postup, { m: M })) + '</span><span class="k-postup__st">' +
      esc(h === M ? U0.postup_hotovo : fill(U0.postup_stav, { h, m: M })) + '</span><span class="k-postup__dl" aria-hidden="true">' +
      ks.map((id) => '<i class="' + (U.otvoreny === id ? "o" : hotovy(id) ? "h" : "") + '"></i>').join("") + "</span></div>";

    const m = model();
    $('[data-k="kompat"]').innerHTML = m ? '<div class="k-kompat"><span class="k-kompat__ic" aria-hidden="true">✓</span><span class="k-kompat__tx"><b>' +
      esc(fill(T.hlavicka.kompatibilita.text, { vozidlo: nazovVozidla() })) + "</b><i>" + esc(T.kroky.vozidlo.prepinac[znacka().typ] +
      (detailyVozidla() ? " · " + detailyVozidla() : "")) + "</i></span></div>" : "";
  }

  function chybaSk(id, pole) {
    const ch = U.chyby[id];
    return ch && ch.pole === pole ? ch.msg : "";
  }
  function sk(id, pole, nadpis, obsah) {
    const msg = chybaSk(id, pole);
    return '<div class="k-sk' + (msg ? " is-chyba" : "") + '" data-pole="' + pole + '">' + (nadpis ? '<span class="k-sk-h">' + esc(nadpis) + "</span>" : "") +
      obsah + '<p class="k-sk__chyba">' + esc(msg) + "</p></div>";
  }
  /* bez tlačidla: krok tapacíru pred voľbou Áno – Nie pokračuje samo */
  function koniecKroku(id, posledny, bezTlacidla) {
    const ch = U.chyby[id];
    const msg = ch ? (id === "vozidlo" && ch.pole !== "znacka" ? T.kroky.vozidlo.chyby.karta : ch.msg) : "";
    return '<p class="k-chyba-tx" role="alert">' + esc(msg) + "</p>" + (bezTlacidla ? "" :
      '<button type="button" class="k-btn-zelene" data-a="dalej" data-v="' + id + '" data-f="dalej:' + id + '">' +
      esc(posledny ? T.kroky.tlacidla.posledny_dalej : T.kroky.tlacidla.dalej) + "</button>");
  }
  function telo(id, posledny) {
    switch (id) {
      case "vozidlo": return teloVozidlo(posledny);
      case "material": return teloMaterial(posledny);
      case "farba": return teloFarba(posledny);
      case "lemovanie": return teloLem(posledny);
      case "nasivky": return teloNasivky(posledny);
      case "tapacir": return teloTapacir(posledny);
    }
    return "";
  }

  function selectPole(pole, label, placeholder, moznosti, hodnota, disabled) {
    const msg = chybaSk("vozidlo", pole);
    return '<label class="k-pole' + (msg ? " is-error" : "") + '" data-pole="' + pole + '"><span class="k-stitok">' + esc(label) + "</span>" +
      '<select class="k-select' + (hodnota ? "" : " is-prazdne") + '" id="' + P + "pole-" + pole + '" data-a="sel" data-p="' + pole + '" data-f="sel:' + pole + '"' + (disabled ? " disabled" : "") +
      (msg ? ' aria-invalid="true" aria-describedby="' + P + "chyba-" + pole + '"' : "") + ">" +
      '<option value="">' + esc(placeholder) + "</option>" +
      moznosti.map((x) => '<option value="' + attr(x.v) + '"' + (x.v === hodnota ? " selected" : "") + ">" + esc(x.t) + "</option>").join("") +
      '</select><span class="k-pole__chyba" id="' + P + "chyba-" + pole + '">' + esc(msg) + "</span></label>";
  }

  function teloVozidlo(posledny) {
    const t = T.kroky.vozidlo, PP = t.polia;
    let html = '<p class="k-pod">' + esc(t.pomocna_veta) + "</p>";
    html += '<div class="k-skupina"><span class="k-stitok" id="' + P + 'lbl-typ">' + esc(t.prepinac.popis) + '</span><div class="k-segment" role="group" aria-labelledby="' + P + 'lbl-typ">' +
      ["kamion", "dodavka"].map((v) => {
        const on = S.typ === v;
        return '<button type="button" class="' + (on ? "is-on" : "") + '" data-a="typ" data-v="' + v + '" data-f="typ:' + v + '" aria-pressed="' + on + '">' + esc(t.prepinac[v]) + "</button>";
      }).join("") + "</div></div>";
    html += '<div class="k-delic"><div class="k-polia">';
    html += selectPole("znacka", PP.znacka.label, PP.znacka.placeholder, znackyTypu().map((z) => ({ v: z.kluc, t: z.meno })), S.znacka);
    const z = znacka();
    html += selectPole("model", PP.model.label, z ? PP.model.placeholder : U0.model_bez_znacky, z ? z.modely.map((m) => ({ v: m.nazov, t: roky(m.nazov) })) : [], S.model, !z);
    const m = model();
    if (m) {
      PORADIE_POLI.forEach((p) => {
        const mo = m.polia[p];
        if (!mo) return;
        const pp = PP[p] || { label: POLIA[p].label, placeholder: POLIA[p].placeholder };
        if (mo.length === 1) {
          html += '<div class="k-pole" data-pole="' + p + '"><span class="k-stitok">' + esc(pp.label) + '</span><div class="k-veta-pole">' +
            esc(fill(t.jedina_moznost, { hodnota: kratkaHodnota(p, mo[0]) })) + "</div></div>";
        } else {
          html += selectPole(p, pp.label, pp.placeholder, mo.map((x) => ({ v: x, t: kratkaHodnota(p, x) })), S.polia[p]);
        }
      });
    }
    html += "</div></div>";
    html += koniecKroku("vozidlo", posledny);
    const nie = esc(T.hlavicka.kompatibilita.nie_je_v_zozname)
      .replace("+421 903 660 720", '<a href="tel:+421903660720">+421 903 660 720</a>')
      .replace("info@luxurycardesign.sk", '<a href="mailto:info@luxurycardesign.sk">info@luxurycardesign.sk</a>');
    html += '<p class="k-pozn">' + esc(t.poznamka) + "<br>" + nie + "</p>";
    return html;
  }

  function teloMaterial(posledny) {
    const t = T.kroky.material;
    let html = '<p class="k-pod">' + esc(t.pomocna_veta) + "</p>";
    const karty = MATERIALY.map((m, i) => {
      const v = matT(m.nazov), on = S.material === m.nazov;
      return '<button type="button" class="k-rkarta' + (on ? " is-on" : "") + '" data-a="mat" data-v="' + attr(m.nazov) + '" data-f="mat:' + i + '" aria-pressed="' + on + '">' +
        '<span class="k-rkarta__foto"><img src="' + attr(m.karta_obrazok) + '" alt="' + attr(fill(U0.vzorka, { x: v.nazov + ", " + v.variant })) + '" loading="lazy"><b>' + esc(cenaMaterialu(m.nazov)) + "</b></span>" +
        '<span class="k-rkarta__tx"><span class="k-rkarta__nm">' + esc(v.nazov) + '</span><span class="mk-var">' + esc(v.variant + " · " + v.farby_text) + "</span>" +
        '<span class="k-rkarta__po">' + esc(v.popis) + '</span><span class="k-rkarta__pl">' + esc(cenaMaterialu(m.nazov)) + "</span></span>" +
        '<span class="k-rkarta__vol" aria-hidden="true"></span></button>';
    }).join("");
    html += sk("material", "material", "", '<div class="k-rkarty">' + karty + "</div>");
    html += koniecKroku("material", posledny);
    return html;
  }

  function mriezkaFarieb(material, vybrata, akcia, prefix) {
    return '<div class="fb" role="group" aria-label="' + attr(U0.farby_aria) + '">' + farbyMat(material).map((f) => {
      const on = vybrata === f.kod;
      return '<button type="button" class="fb__b' + (on ? " is-on" : "") + '" data-a="' + akcia + '" data-v="' + attr(f.kod) + '" data-f="' + prefix + attr(f.kod) + '" aria-pressed="' + on +
        '" aria-label="' + attr(fill(U0.kod_aria, { meno: f.meno, kod: f.kod })) + '"><span class="fb__sw"><img src="' + attr(f.swatch) + '" alt="" loading="lazy"></span><span class="fb__nm">' + esc(f.meno) +
        '</span><span class="fb__kod">' + esc(fill(T.kroky.farba.kod_popis, { kod: f.kod })) + "</span></button>";
    }).join("") + "</div>";
  }

  function teloFarba(posledny) {
    const t = T.kroky.farba;
    let html = '<p class="k-pod">' + esc(t.pomocna_veta) + "</p>";
    if (!S.material) return html + '<p class="k-pod">' + esc(U0.farba_bez_materialu) + "</p>" + koniecKroku("farba", posledny);
    html += sk("farba", "farba", "", mriezkaFarieb(S.material, S.farba, "farba", "fa:"));
    const f = S.farba && farba(S.material, S.farba);
    if (f) {
      html += '<div class="k-nahlad-farby"><p class="k-nahlad-farby__nm">' + esc(fill(t.nahlad, { farba: f.meno, kod: f.kod, material: matKratko(S.material) })) +
        '</p><img class="k-nahlad-farby__img" src="' + attr(f.full) + '" alt="' + attr(fill(U0.zvacsena, { x: f.meno })) + '"></div>';
    }
    html += koniecKroku("farba", posledny);
    return html;
  }

  function mriezkaLem(vybraty, akcia, prefix, odporucany) {
    return '<div class="lm" role="group" aria-label="' + attr(U0.lem_aria) + '">' + lemy().map((l) => {
      const on = vybraty === l.kod;
      return '<button type="button" class="lm__b' + (on ? " is-on" : "") + '" data-a="' + akcia + '" data-v="' + l.kod + '" data-f="' + prefix + l.kod + '" aria-pressed="' + on + '">' +
        (odporucany === l.kod ? '<span class="k-badge">' + esc(T.kroky.lemovanie.stitok_odporucame) + "</span>" : "") +
        '<img src="' + attr(l.full) + '" alt="" loading="lazy"><span class="lm__nm">' + esc(l.menoUi) + '</span><span class="lm__kod">' + l.kod + "</span></button>";
    }).join("") + "</div>";
  }

  function teloLem(posledny) {
    const t = T.kroky.lemovanie;
    let html = '<p class="k-pod">' + esc(t.pomocna_veta) + " " + esc(t.v_cene) + "</p>";
    html += sk("lemovanie", "lem", "", mriezkaLem(S.lem, "lem", "lem:", odporucanyLem()));
    const l = S.lem && lem(S.lem);
    if (l) html += '<div class="lm-nahlad"><p>' + esc(fill(U0.vybrate, { x: l.menoUi + " (" + l.kod + ")" })) + '</p><img src="' + attr(l.full) + '" alt="' + attr(fill(U0.lem_zblizka, { x: l.menoUi })) + '"></div>';
    html += koniecKroku("lemovanie", posledny);
    return html;
  }

  // ------------------------------------------------------------------ kroky 5 a 6 — návrh C (Michal 18. 10. 2026)
  // Krok 5: tri dlaždice so skutočnou fotkou kabíny a zlatými krúžkami presne na nášivkách (pred sedadlá — ★ všetky tri
  // v strede — stredový koberec) + „Nie, ďakujem“; do Shoptetu ide stále jeden zo 4 stavov S.nas (bez / len stred /
  // šofér + spolujazdec / všetky tri). Veľký náhľad motívu v nití cez celú šírku karty. Krok 6: fotka celých dverí,
  // ponuka v rámiku, „Rovnaké ako koberce / Vybrať inak“ a „Rovnaká ako na kobercoch / Iný motív a niť“ ako dve
  // rovnocenné dlaždice, výrez dverí so zlatým krúžkom na mieste nášivky.
  const jeBoky = () => S.nas === "boky" || S.nas === "boky+stred";
  const jeStred = () => S.nas === "stred" || S.nas === "boky+stred";
  const naNas = (b, s) => (b && s ? "boky+stred" : b ? "boky" : s ? "stred" : null);
  /** Miesta na fotke kabíny (FOTKA_KABINY 4:3, % šírky / výšky; data.js FOTKA_KABINY_NASIVKY). */
  const BOD = {
    sofer: { x: "33.8%", y: "59%", d: "11.5%", tr: " kn-bod--hore" },
    spolujazdec: { x: "73.6%", y: "59%", d: "11.5%", tr: " kn-bod--hore kn-bod--r" },
    stred: { x: "53.1%", y: "80.7%", d: "16%", tr: "" },
  };
  /** Mozaika „Vybrať inak“ (tapacír): materiál + kód farby. */
  const MOZAIKA_MAT = [["presivana", "12"], ["tonovana", "PES5"], ["jednofarebna", "1G"], ["mikro-jedno", "5NUB"]];

  /** Cena v rámiku: veľká suma, prečiarknutá pôvodná červenou, zelený štítok „Ušetríte“ (p = ponuka().nasivky[id]). */
  function cenaRamik(p, usetrite) {
    if (!p || !p.suma) return "";
    return '<span class="kn-cena"><b>' + plus(p.suma) + "</b>" + (p.povodna != null ? "<s>" + eur(p.povodna) + "</s>" : "") +
      (p.usetrite ? "<i>" + esc(eurX(usetrite, p.usetrite)) + "</i>" : "") + "</span>";
  }
  /** Cenovka ponuky (tapacír, nášivka na dvere): „S kobercami len 119 €  Samostatne 179 €  Ušetríte 60 €“. */
  function cenovka(l, sumaHtml, samostatne, p, usetrite) {
    return '<span class="k-cenovka kn-cenovka"><span class="k-cenovka__l">' + esc(l) + '</span><span class="k-cenovka__c">' + sumaHtml + "</span>" +
      (p.povodna != null ? '<span class="k-cenovka__s">' + esc(samostatne) + " <s>" + eur(p.povodna) + "</s></span>" : "") +
      (p.usetrite ? '<span class="k-cenovka__u">' + esc(eurX(usetrite, p.usetrite)) + "</span>" : "") + "</span>";
  }
  /** Výrez fotky kabíny cez CSS (--z zväčšenie, --fx/--fy stred výrezu) so zlatými krúžkami na nášivkách. */
  function fotkaKabiny(vyrez, miesta, alt, bokStred) {
    const t = T.kroky.nasivky;
    return '<span class="kn-foto" aria-hidden="true"><span class="kn-scena" style="' + vyrez + '"><img src="' + attr(FOTKA_KABINY) + '" alt="' + attr(alt) + '" loading="lazy" decoding="async">' +
      miesta.map((k) => {
        const b = BOD[k];
        return '<span class="kn-bod' + b.tr + (k === "stred" && bokStred ? " kn-bod--bok" : "") + '" style="--x:' + b.x + ";--y:" + b.y + ";--d:" + b.d + '"><b>' + esc(t.miesta[k]) + "</b></span>";
      }).join("") +
      '</span><span class="kn-ilu">' + esc(t.ilustracna) + "</span></span>";
  }
  /** Schéma kabíny zhora (vlastná kresba): s = šofér, p = spolujazdec, c = stredový koberec. */
  function schemaKabiny(sel, tmava) {
    const vv = T.kroky.nasivky.vasa_volba, mm = vv.schema_miesta;
    const ln = tmava ? "#8a826a" : "#b5ab8f", bg = tmava ? "rgba(255,255,255,.04)" : "#fff", mat = tmava ? "rgba(255,255,255,.07)" : "#efebe0";
    const sed = tmava ? "rgba(255,255,255,.1)" : "#ddd6c4";
    const kob = (x, y, w2, h, on) => '<rect x="' + x + '" y="' + y + '" width="' + w2 + '" height="' + h + '" rx="4" fill="' + (on ? "rgba(230,200,119,.28)" : mat) + '" stroke="' + (on ? "#c49b31" : ln) + '" stroke-width="' + (on ? 1.6 : 1) + '"/>';
    const bod = (cx, cy, r, on) => (on
      ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 3) + '" fill="rgba(230,200,119,.35)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e6c877" stroke="#8f7020" stroke-width="1"/>'
      : '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + ln + '" stroke-width="1" stroke-dasharray="2 2"/>');
    const popis = [sel.s ? mm.sofer : "", sel.p ? mm.spolujazdec : "", sel.c ? mm.stred : ""].filter(Boolean).join(", ") || mm.nic;
    return '<svg class="kn-schema" viewBox="0 0 100 92" role="img" aria-label="' + attr(fill(vv.schema_aria, { x: popis })) + '">' +
      '<rect x="1.5" y="1.5" width="97" height="89" rx="12" fill="' + bg + '" stroke="' + ln + '"/><path d="M6 16 Q50 6 94 16" fill="none" stroke="' + ln + '" stroke-width="1.2"/>' +
      '<circle cx="21" cy="19" r="7" fill="none" stroke="' + ln + '" stroke-width="1.6"/>' +
      kob(7, 30, 27, 30, sel.s) + kob(66, 30, 27, 30, sel.p) + kob(38, 30, 24, 56, sel.c) +
      '<rect x="8" y="64" width="25" height="22" rx="5" fill="' + sed + '"/><rect x="67" y="64" width="25" height="22" rx="5" fill="' + sed + '"/>' +
      bod(20.5, 42, 5, sel.s) + bod(79.5, 42, 5, sel.p) + bod(50, 64, 7, sel.c) + "</svg>";
  }
  /** Schéma dverí (vlastná kresba): nášivka v strede výplne. */
  function schemaDvere() {
    return '<svg class="kn-schema" viewBox="0 0 100 70" role="img" aria-label="' + attr(U0.schema_dvere_aria) + '">' +
      '<path d="M8 8 H86 Q94 8 94 16 V60 Q94 64 90 64 H14 Q6 64 6 56 V12 Q6 8 8 8Z" fill="rgba(255,255,255,.04)" stroke="#8a826a"/>' +
      '<path d="M22 50 Q20 28 36 22 L62 18 Q66 30 64 48 Q62 52 56 52 H28 Q22 52 22 50Z" fill="rgba(230,200,119,.25)" stroke="#c49b31" stroke-width="1.4"/>' +
      '<circle cx="43" cy="35" r="9" fill="rgba(230,200,119,.35)"/><circle cx="43" cy="35" r="6" fill="#e6c877" stroke="#8f7020"/>' +
      '<rect x="70" y="20" width="18" height="26" rx="5" fill="rgba(255,255,255,.08)" stroke="#8a826a"/></svg>';
  }

  function dlazdiceMotivov(miesto, vybraty, prefix) {
    const zoz = motivy(miesto);
    return '<div class="k-dlazdice k-dlazdice--motiv" style="--k-dl-n:' + Math.max(1, Math.min(4, zoz.length)) + '" role="group" aria-label="' + attr(U0.motiv_aria) + '">' + zoz.map((m) => {
      const on = vybraty === m.kod;
      return '<button type="button" class="k-dlazdica' + (on ? " is-on" : "") + '" data-a="motiv" data-m="' + prefix + '" data-v="' + m.kod + '" data-f="mot:' + prefix + m.kod + '" aria-pressed="' + on + '">' +
        '<img class="k-dlazdica__img" src="' + attr(m.full) + '" alt="' + attr(fill(U0.motiv_alt, { x: m.meno })) + '" loading="lazy"><span class="k-dlazdica__nm">' + esc(m.meno) + "<small>" + m.kod + "</small></span></button>";
    }).join("") + "</div>";
  }
  /** Farby nite: prvých N v poradí ponuky + „Ďalšie farby (+n)“ (krok je na telefóne kratší); vybraná sa nikdy neskryje. */
  function cipyNiti(prefix, vybrata) {
    const tn = T.kroky.nasivky.nit, vsetky = nite(), prve = tn.prve || vsetky.length;
    let idx = -1;
    vsetky.forEach((n, i) => { if (n.kod === vybrata) idx = i; });
    const ukaz = U.viac[prefix] || idx >= prve || vsetky.length <= prve + 1 ? vsetky : vsetky.slice(0, prve);
    return '<div class="nt" role="group" aria-label="' + attr(U0.nit_aria) + '">' + ukaz.map((n) => {
      const on = vybrata === n.kod;
      return '<button type="button" class="nt__b' + (on ? " is-on" : "") + '" data-a="nit" data-m="' + prefix + '" data-v="' + n.kod + '" data-f="nit:' + prefix + n.kod + '" aria-pressed="' + on + '">' +
        '<i style="background:' + n.hex + '" aria-hidden="true"></i>' + esc(n.menoUi) + " <small>" + n.kod + "</small></button>";
    }).join("") + (ukaz.length < vsetky.length ? '<button type="button" class="nt__b nt__b--viac" data-a="viac" data-m="' + prefix + '" data-f="viac:' + prefix + '" aria-expanded="false">' +
      esc(fill(tn.viac, { n: vsetky.length - ukaz.length })) + "</button>" : "") + "</div>";
  }
  /** Plátno náhľadu: motív prefarbený na niť na fotke materiálu (kreslí kresliNahlady; rozlíšenie podľa šírky). */
  function platno(cls, x, bg, k, w2, h2, aria) {
    const m = motiv(x.motiv), n = x.nit ? nit(x.nit) : null;
    return '<canvas class="' + cls + '" width="' + w2 + '" height="' + h2 + '" data-motiv="' + attr(m.full) + '" data-hex="' + (n ? n.hex : "") + '" data-bg="' + attr(bg || "") +
      '" data-k="' + k + '"' + (aria ? ' role="img" aria-label="' + attr(aria) + '"' : ' aria-hidden="true"') + "></canvas>";
  }
  /** Veľký náhľad motívu (cez celú šírku karty) + „Kam príde“ so schémou. */
  function nahladVelky(x, bg, kam, podklad, schemaHtml) {
    if (!x.motiv) return '<p class="kn-info">' + esc(U0.nahlad_bez_motivu) + "</p>";
    const m = motiv(x.motiv), n = x.nit ? nit(x.nit) : null;
    return '<figure class="kn-nh"><figcaption class="kn-nh__hd">' + esc(fill(U0.nahlad, { meno: m.meno, kod: m.kod }) + (n ? fill(U0.nahlad_nit, { nit: mala(n.menoUi), kod: n.kod }) : "")) + "</figcaption>" +
      platno("kn-nh__cv", x, bg, ".96", 960, 640, fill(U0.nahlad_aria, { x: m.meno })) +
      '<div class="kn-nh__pop">' + schemaHtml + "<div><p><b>" + esc(U0.nahlad_kam) + "</b> " + esc(kam) + "</p>" +
      (podklad ? "<p><b>" + esc(U0.nahlad_podklad) + "</b> " + esc(podklad) + "</p>" : "") +
      (n ? "" : "<p><b>" + esc(U0.nahlad_bez_nite[0]) + "</b>" + esc(U0.nahlad_bez_nite[1]) + "</p>") +
      "<p><i>" + esc(U0.nahlad_ilustr) + "</i></p></div></div></figure>";
  }
  /** Dve rovnocenné dlaždice „rovnaké / inak“ (zjavná voľba namiesto skrytého odkazu či zaškrtávacieho políčka). */
  function rvDlazdica(akcia, v, on, viz, nm, poHtml) {
    return '<button type="button" class="kn-rv__b' + (on ? " is-on" : "") + '" data-a="' + akcia + '"' + (v != null ? ' data-v="' + v + '"' : "") +
      ' data-f="' + akcia + (v != null ? ":" + v : "") + '" aria-pressed="' + on + '"><span class="kn-rv__viz">' + viz + '<span class="kn-rv__r" aria-hidden="true"></span></span>' +
      '<span class="kn-rv__tx"><span class="kn-rv__nm">' + esc(nm) + '</span><span class="kn-rv__po">' + poHtml + "</span></span></button>";
  }
  const vizMat = (matSrc, lemSrc) => '<span class="kn-rv__mat' + (lemSrc ? "" : " kn-rv__mat--cela") + '"' + (matSrc ? ' style="background-image:url(' + attr(matSrc) + ')"' : "") + "></span>" +
    (lemSrc ? '<span class="kn-rv__lem" style="background-image:url(' + attr(lemSrc) + ')"></span>' : "");
  const mozaikaMotivov = (miesto) => '<span class="kn-rv__mozaika kn-rv__mozaika--motiv">' + motivy(miesto).slice(0, 2).map((m) => '<i style="background-image:url(' + attr(m.full) + ')"></i>').join("") + "</span>";
  function mozaikaMaterialov() {
    return '<span class="kn-rv__mozaika">' + MOZAIKA_MAT.map((x) => {
      const m = MATERIALY.filter((y) => y.slug === x[0])[0];
      const f = m && (m.farby.filter((y) => y.kod === x[1])[0] || m.farby[0]);
      return f ? '<i style="background-image:url(' + attr(f.full) + ')"></i>' : "";
    }).join("") + '</span><span class="kn-rv__plus" aria-hidden="true">+</span>';
  }
  const popisTx = (x) => "<span>" + esc(x) + "</span>";
  const farbaTx = (f) => mala(f.meno) + " (" + f.kod + ")";
  const lemTx = (l) => fill(U0.suhrn_lemovanie, { x: l.menoUi.toLowerCase() + " (" + l.kod + ")" });

  function teloNasivky(posledny) {
    const t = T.kroky.nasivky, V = t.volby, pon = ponuka().nasivky;
    const b = jeBoky(), s = jeStred(), bal = b && s, nie = S.nas === "nechcem";
    let html = '<p class="k-pod">' + esc(t.pomocna_veta[0]) + "<b>" + esc(t.pomocna_veta[1]) + "</b>" + esc(t.pomocna_veta[2]) + "</p>";
    const cenaStrany = (id) => (bal ? '<span class="kn-cena"><em>' + esc(t.v_baliku) + "</em></span>" : cenaRamik(pon[id], t.usetrite));
    const dlazdica = (id, on, cls, foto, cenaHtml, pred, po) =>
      '<button type="button" class="kn-dv__b' + cls + (on ? " is-on" : "") + '" data-a="nas" data-v="' + id + '" data-f="nas:' + id + '" aria-pressed="' + on + '">' + pred + foto +
      '<span class="kn-dv__tx"><span class="kn-chk" aria-hidden="true"></span><span><span class="kn-dv__nm">' + esc(V[id].text) + '</span><span class="kn-dv__po">' + esc(V[id].popis) + "</span></span>" +
      cenaHtml + "</span>" + po + "</button>";
    // poradie: pred sedadlá — ★ všetky tri (najobľúbenejšie v strede) — stredový koberec
    const tB = dlazdica("boky", b, "", fotkaKabiny("--z:1.75;--fx:.537;--fy:.5", ["sofer", "spolujazdec"], V.boky.alt), cenaStrany("boky"), "", "");
    const tBal = dlazdica("boky+stred", bal, " kn-dv__b--bal", fotkaKabiny("--z:1.4;--fx:.537;--fy:.64", ["sofer", "spolujazdec", "stred"], V["boky+stred"].alt, true),
      cenaRamik(pon["boky+stred"], t.usetrite), '<span class="k-badge">' + esc(V["boky+stred"].stitok) + "</span>",
      '<span class="kn-dv__cta' + (bal ? " kn-dv__cta--stav" : "") + '">' + esc(bal ? V["boky+stred"].vybrate : V["boky+stred"].ano) + "</span>");
    const tS = dlazdica("stred", s, "", fotkaKabiny("--z:2.5;--fx:.531;--fy:.8", ["stred"], V.stred.alt), cenaStrany("stred"), "", "");
    const tlNie = '<button type="button" class="k-btn-zlate kn-nie' + (nie ? " is-on" : S.nas ? " je-druha" : "") + '" data-a="nas" data-v="nechcem" data-f="nas:nechcem" aria-pressed="' + nie + '">' +
      (nie ? "✓ " : "") + esc(V.nechcem.text) + "<small>" + esc(V.nechcem.popis) + "</small></button>";
    // „Vaša voľba“ — až po výbere, pod všetkými voľbami
    let vyber = "";
    if (S.nas && !nie) {
      const vv = t.vasa_volba, x = vv[S.nas], pA = pon["boky+stred"];
      const tip = S.nas === "boky" ? vv.tip_boky : S.nas === "stred" ? vv.tip_stred : null;
      vyber = '<div class="kn-vv" aria-live="polite">' + schemaKabiny({ s: b, p: b, c: s }, false) + '<div class="kn-vv__tx"><span class="kn-vv__l">' + esc(vv.label) + '</span><span class="kn-vv__nm">' + esc(x[0]) +
        '</span><span class="kn-vv__po">' + esc(x[1]) + "</span>" + cenaRamik(pon[S.nas], t.usetrite) + "</div>" +
        (tip && pA && pA.suma && pA.povodna != null ? '<p class="kn-vv__tip">' + esc(tip[0]) + "<b>" + esc(fill(tip[1], { suma: eur(pA.suma) })) + "</b>" + esc(fill(tip[2], { povodna: eur(pA.povodna) })) + "</p>" : "") +
        "</div>";
    } else if (nie) vyber = '<p class="k-pozn">' + esc(V.nechcem.pozn) + "</p>";
    html += sk("nasivky", "nas", t.kam, '<div class="kn-dv" role="group" aria-label="' + attr(t.kam) + '">' + tB + tBal + tS + "</div>" + tlNie + vyber);

    // motív a niť + veľký náhľad na farbe kobercov (krok 3)
    const fk = S.material && S.farba ? farba(S.material, S.farba) : null;
    const bg = fk ? fk.full : "", podklad = fk ? fill(t.podklad, { x: farbaTx(fk) }) : "";
    if (b) {
      const vsetky = s && S.stredRovnaky;
      html += '<div class="tp-oddiel"><span class="k-sk-h">' + esc(vsetky ? t.oddiel.vsetky : t.oddiel.boky) + "</span>" +
        sk("nasivky", "bokyMotiv", t.motiv.label, dlazdiceMotivov("boky", S.nasBoky.motiv, "boky")) +
        sk("nasivky", "bokyNit", t.nit.label, cipyNiti("boky", S.nasBoky.nit)) +
        nahladVelky(S.nasBoky, bg, t.kam_pride[vsetky ? "boky+stred" : "boky"], podklad, schemaKabiny({ s: true, p: true, c: vsetky }, true)) + "</div>";
      if (s) {
        const kb = S.nasBoky.motiv && S.nasBoky.nit ? S.nasBoky : null, sr = t.stred_rovnaky;
        html += '<div class="tp-oddiel"><span class="k-sk-h">' + esc(t.oddiel.stred_pri_bokoch) + '</span><div class="kn-rv" role="group" aria-label="' + attr(t.oddiel.stred_pri_bokoch) + '">' +
          rvDlazdica("stredRovnaky", "1", S.stredRovnaky, kb ? platno("kn-rv__cv", kb, bg, ".92", 600, 400) : vizMat(bg, ""), sr.ano, popisTx(kb ? motivTxt(kb) : sr.ano_bez_vyberu)) +
          rvDlazdica("stredRovnaky", "0", !S.stredRovnaky, mozaikaMotivov("stred"), sr.inak, popisTx(sr.inak_popis)) + "</div>";
        if (!S.stredRovnaky) {
          html += sk("nasivky", "stredMotiv", t.stred_iny.motiv, dlazdiceMotivov("stred", S.nasStred.motiv, "stred")) +
            sk("nasivky", "stredNit", t.stred_iny.nit, cipyNiti("stred", S.nasStred.nit)) +
            nahladVelky(S.nasStred, bg, t.kam_pride.stred, podklad, schemaKabiny({ s: false, p: false, c: true }, true));
        }
        html += "</div>";
      }
    } else if (s) {
      html += '<div class="tp-oddiel"><span class="k-sk-h">' + esc(t.oddiel.stred) + "</span>" +
        sk("nasivky", "stredMotiv", t.motiv.label, dlazdiceMotivov("stred", S.nasStred.motiv, "stred")) +
        sk("nasivky", "stredNit", t.nit.label, cipyNiti("stred", S.nasStred.nit)) +
        nahladVelky(S.nasStred, bg, t.kam_pride.stred, podklad, schemaKabiny({ s: false, p: false, c: true }, true)) + "</div>";
    }
    html += koniecKroku("nasivky", posledny);
    return html;
  }

  function teloTapacir(posledny) {
    const t = T.kroky.tapacir, a = t.volby.ano;
    const on = S.tap === "ano", off = S.tap === "nie", po = ponuka(), pt = po.tapacir;
    let html = '<p class="k-pod">' + esc(t.vysvetlivka) + "</p>";
    // fotka celých dverí 3:2 bez orezania
    html += '<div class="kn-dvere"><img src="' + attr(FOTKA_DVERI) + '" alt="' + attr(t.foto_alt) + '" width="1536" height="1024" loading="lazy" decoding="async">' +
      '<span class="kn-stitok" style="--x:43%;--y:21%">' + esc(t.foto_stitok) + '</span><span class="kn-ilu kn-ilu--dole">' + esc(t.ilustracna) + "</span></div>";
    const ponukaHtml = '<div class="kn-ponuka"><span class="kn-ponuka__nm">' + esc(t.nazov) + '</span><span class="kn-ponuka__ben">' + esc(t.benefit) + "</span>" +
      cenovka(a.s_kobercami, eur(pt.suma), a.samostatne, pt, a.usetrite) +
      '<button type="button" class="k-btn-zelene' + (on ? " is-on" : off ? " je-druha" : "") + '" data-a="tap" data-v="ano" data-f="tap:ano" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(a.text) + "</button></div>" +
      '<button type="button" class="k-btn-zlate' + (off ? " is-on" : on ? " je-druha" : "") + '" data-a="tap" data-v="nie" data-f="tap:nie" aria-pressed="' + off + '">' + (off ? "✓ " : "") + esc(t.volby.nie.text) + "</button>" +
      (off ? '<p class="k-pozn">' + esc(t.volby.nie.pozn) + "</p>" : "");
    html += sk("tapacir", "tap", "", ponukaHtml);

    if (on) {
      // 1) materiál, farba, lemovanie: rovnaké ako koberce / vybrať inak
      const r = t.rovnake, vl = t.vlastne;
      const fk = S.material && S.farba ? farba(S.material, S.farba) : null, lk = S.lem ? lem(S.lem) : null;
      html += '<div class="tp-oddiel"><span class="k-sk-h">' + esc(U0.tap_oddiel) + '</span><div class="kn-rv" role="group" aria-label="' + attr(U0.tap_oddiel) + '">' +
        rvDlazdica("tapRovnake", null, S.tapRovnaky, vizMat(fk ? fk.full : "", lk ? lk.full : ""), r.ano,
          popisTx(S.material ? matKratko(S.material) : "") + popisTx([fk ? farbaTx(fk) : "", lk ? lemTx(lk) : ""].filter(Boolean).join(" · "))) +
        rvDlazdica("tapZmenit", null, !S.tapRovnaky, mozaikaMaterialov(), r.inak, popisTx(r.inak_popis)) + "</div>";
      if (!S.tapRovnaky) {
        html += sk("tapacir", "tapMat", vl.material, '<div class="k-dlazdice k-dlazdice--mat" role="group" aria-label="' + attr(vl.material) + '">' + MATERIALY.map((m, i) => {
          const v = matT(m.nazov), x = S.tapMat === m.nazov, fx = x && S.tapFarba ? farba(m.nazov, S.tapFarba) : null;
          return '<button type="button" class="k-dlazdica' + (x ? " is-on" : "") + '" data-a="tapMat" data-v="' + attr(m.nazov) + '" data-f="tapMat:' + i + '" aria-pressed="' + x + '">' +
            '<img class="k-dlazdica__img" src="' + attr(fx ? fx.full : m.karta_obrazok) + '" alt="" loading="lazy"><span class="k-dlazdica__nm">' + esc(v.variant) + "<small>" + esc(v.nazov === "Mikrosemiš" ? U0.mikrosemis : U0.syntetika) + "</small></span></button>";
        }).join("") + "</div>");
        if (S.tapMat) html += sk("tapacir", "tapFarba", vl.farba, mriezkaFarieb(S.tapMat, S.tapFarba, "tapFarba", "tf:"));
        html += sk("tapacir", "tapLem", vl.lemovanie, mriezkaLem(S.tapLem, "tapLem", "tl:", null));
        const tm = S.tapMat, tf = tm && S.tapFarba ? farba(tm, S.tapFarba) : null, tl = S.tapLem ? lem(S.tapLem) : null;
        html += '<div class="kn-vz"><span class="kn-rv__viz">' + vizMat(tf ? tf.full : tm ? matD(tm).karta_obrazok : "", tl ? tl.full : "") + "</span><p><b>" + esc(vl.vybrate) + "</b>" +
          esc(tm ? matKratko(tm) : vl.bez_materialu) + "<br>" + esc(tf ? fill(vl.farba_x, { x: farbaTx(tf) }) : vl.bez_farby) + "<br>" + esc(tl ? lemTx(tl) : vl.bez_lemovania) + "</p></div>";
      }
      html += "</div>";

      // 2) nášivka na tapacír: kde presne (výrez dverí so zlatým krúžkom), otázka s cenou v rámiku, rovnaká / iná
      const nd = t.nasivka_dvere, an = S.tapNas, pd = po.nasivka_dvere;
      html += '<div class="tp-oddiel"><span class="k-sk-h">' + esc(nd.nadpis) + "</span>" +
        '<p class="k-pod">' + esc(nd.kde[0]) + "<b>" + esc(nd.kde[1]) + "</b>" + esc(nd.kde[2]) + "</p>" +
        '<div class="kn-dvere kn-dvere--vyrez"><span class="kn-foto kn-foto--169"><span class="kn-scena" style="--ar:3/2;--z:1.3;--fx:.433;--fy:.45"><img src="' + attr(FOTKA_DVERI) + '" alt="' + attr(nd.foto_alt) + '" loading="lazy" decoding="async">' +
        '<span class="kn-bod" style="--x:43.3%;--y:45%;--d:23%"><b>' + esc(nd.bod) + '</b></span></span><span class="kn-ilu">' + esc(t.ilustracna) + "</span></span></div>";
      html += sk("tapacir", "tapNas", "", (U.dvereInfo && an == null ? '<p class="tp-info">' + esc(nd.zmena_info) + "</p>" : "") +
        '<div class="kn-ponuka kn-ponuka--nas"><span class="kn-ponuka__nm">' + esc(nd.otazka) + "</span>" + cenovka(nd.s_tapacirom, plus(pd.suma), nd.samostatne, pd, nd.usetrite) +
        '<div class="an' + (an != null ? " an--vybrate" : "") + '" role="group" aria-label="' + attr(nd.otazka) + '">' +
        '<button type="button" class="an__b an__b--ano' + (an === true ? " is-on" : "") + '" data-a="tapNas" data-v="ano" data-f="tapNas:ano" aria-pressed="' + (an === true) + '">' + (an === true ? "✓ " : "") + esc(nd.ano) + "<small>" + plus(pd.suma) + "</small></button>" +
        '<button type="button" class="an__b an__b--nie' + (an === false ? " is-on" : "") + '" data-a="tapNas" data-v="nie" data-f="tapNas:nie" aria-pressed="' + (an === false) + '">' + (an === false ? "✓ " : "") + esc(nd.nie) + "<small>" + esc(nd.bez_priplatku) + "</small></button></div></div>");
      if (an === true) {
        const kn = koberecNas(), tm = tapMaterial(), tk = tapFarbaKod();
        const ft = tm ? (tk && farba(tm, tk)) || null : null;
        const bgT = ft ? ft.full : tm ? matD(tm).karta_obrazok : "";
        const podT = tm ? fill(nd.podklad, { x: matKratko(tm) + (ft ? ", " + farbaTx(ft) : "") }) : "";
        if (kn) {
          html += '<div class="kn-rv kn-rv--dvere" role="group" aria-label="' + attr(nd.nadpis) + '">' +
            rvDlazdica("tapNasRovnaka", "1", S.tapNasRovnaka, platno("kn-rv__cv", kn, bgT, ".92", 600, 400), nd.rovnaka, popisTx(motivTxt(kn))) +
            rvDlazdica("tapNasRovnaka", "0", !S.tapNasRovnaka, mozaikaMotivov("dvere"), nd.ina, popisTx(nd.ina_popis)) + "</div>";
        } else {
          html += '<p class="kn-info">' + esc(S.nas == null ? nd.bez_kobercov_nevybrate : nd.bez_kobercov) + "</p>";
        }
        if (!kn || !S.tapNasRovnaka) {
          html += sk("tapacir", "dvereMotiv", nd.motiv, dlazdiceMotivov("dvere", S.tapNasMotiv, "dvere")) +
            sk("tapacir", "dvereNit", nd.nit, cipyNiti("dvere", S.tapNasNit));
        }
        html += nahladVelky(kn && S.tapNasRovnaka ? kn : { motiv: S.tapNasMotiv, nit: S.tapNasNit }, bgT, nd.kam_pride, podT, schemaDvere());
      }
      html += "</div>";
    }
    html += koniecKroku("tapacir", posledny, !on);
    return html;
  }

  // ------------------------------------------------------------------ súhrn (artefakt ř. 625–679, bez ukážky košíka)
  function renderSuhrn() {
    const c = cena(), ts = T.suhrn, r = {};
    c.riadky.forEach((x) => { r[x.id] = x; });
    const z = znacka(), dod = z ? z.typ === "dodavka" : S.typ === "dodavka";
    let html = '<div class="sh" aria-labelledby="' + P + 'sh-h"><p class="sh__ey">' + esc(U0.suhrn_ey) + '</p><h2 class="sh__h" id="' + P + 'sh-h">' + esc(dod ? ts.nadpis_dodavka : ts.nadpis_kamion) + "</h2>";
    html += '<p class="sh__voz">' + esc(S.model ? nazovVozidla() + (detailyVozidla() ? " · " + detailyVozidla() : "") : U0.suhrn_bez_vozidla) + "</p>";
    const riadok = (b, span, cHtml) => '<div class="sh__r"><div class="sh__t"><b>' + esc(b) + "</b>" + (span ? "<span>" + esc(span) + "</span>" : "") + '</div><div class="sh__c">' + cHtml + "</div></div>";
    const cen = (x) => (x.povodna != null ? "<s>" + eur(x.povodna) + "</s>" : "") + "<span>" + (x.suma ? plus(x.suma) : "0" + NB + "€") + "</span>";
    const bezSpolujazdca = /^Bez sedadla/.test(S.polia.sedadlo || "");
    html += riadok(ts.riadky.koberce.nazov, bezSpolujazdca ? ts.riadky.koberce.popis_bez_spolujazdca : ts.riadky.koberce.popis, "<span>" + eur(r.zaklad.suma) + "</span>");
    if (S.material) {
      const f = S.farba && farba(S.material, S.farba), l = S.lem && lem(S.lem);
      html += riadok(matKratko(S.material) + (f ? " · " + mala(f.meno) + " (" + f.kod + ")" : ""), l ? lemTx(l) : "",
        r.material.suma ? "<span>" + plus(r.material.suma) + "</span>" : "<em>" + esc(ts.v_cene) + "</em>");
    }
    if (S.nas === "nechcem") html += riadok(U0.suhrn_bez_nasiviek, "", "<span>0" + NB + "€</span>");
    else if (S.nas && r.nasivky) {
      const nz = { "boky+stred": ts.riadky.nasivky.nazov_vsetky, boky: ts.riadky.nasivky.nazov_boky, stred: ts.riadky.nasivky.nazov_stred }[S.nas];
      const x = S.nas === "stred" ? S.nasStred : S.nasBoky;
      let popis = "";
      if (x.motiv && x.nit) popis = motivTxt(x);
      if (S.nas === "boky+stred" && !S.stredRovnaky && S.nasStred.motiv && S.nasStred.nit) popis += fill(U0.suhrn_stred, { x: motivTxt(S.nasStred) });
      html += riadok(nz, popis, cen(r.nasivky));
    }
    if (tapDostupny() && S.tap === "nie") html += riadok(U0.suhrn_bez_tapaciru, "", "<span>0" + NB + "€</span>");
    if (r.tapacir) {
      const tm = tapMaterial(), tf = tapFarbaKod() && tm && farba(tm, tapFarbaKod()), tl = tapLemKod() && lem(tapLemKod());
      html += riadok(ts.riadky.tapacir.nazov, S.tapRovnaky ? ts.riadky.tapacir.popis_rovnaky :
        (tm ? matKratko(tm) : "") + (tf ? " · " + mala(tf.meno) + " (" + tf.kod + ")" : "") + (tl ? " · " + lemTx(tl) : ""), cen(r.tapacir));
    }
    if (r.nasivka_dvere) {
      const dn = S.tapNasRovnaka && koberecNas() ? koberecNas() : { motiv: S.tapNasMotiv, nit: S.tapNasNit };
      html += riadok(ts.riadky.nasivka_dvere.nazov, dn.motiv && dn.nit ? motivTxt(dn) : "", cen(r.nasivka_dvere));
    }
    const chybaju = kroky().filter((k) => !hotovy(k));
    if (chybaju.length) html += '<p class="sh__chyba-r">' + esc(fill(U0.suhrn_niet, { x: chybaju.map((k) => mala(T.kroky[k].nazov)).join(", ") })) + "</p>";
    const hot = !chybaju.length;
    html += '<div class="k-suhrn"><span class="k-suhrn__lb">' + esc(ts.spolu) + (hot ? "" : esc(U0.suhrn_zatial)) + '</span><b class="k-suhrn__suma" aria-live="polite">' + eur(c.spolu) + "</b></div>";
    if (c.usetrene > 0) html += '<p class="sh__us">' + esc(eurX(ts.usetrili, c.usetrene)) + "</p>";
    if (U.chybaKosik && !hot) html += '<p class="sh__err" role="alert">' + esc(T.kroky.chyba_kosik) + "</p>";
    if (U.chybaPrenosu) html += '<p class="sh__err" role="alert">' + esc(U0.chyba_kosiku) + "</p>";
    const zaneprazdnene = U.odosiela ? ' disabled aria-disabled="true" aria-busy="true"' : "";
    html += '<button type="button" class="k-btn-zelene k-kosik" data-a="kosik" data-f="kosik"' + zaneprazdnene + ">" + esc(hot ? ts.tlacidlo : T.kroky.tlacidla.dokoncite) + "</button>";
    html += '<ul class="sh__fakty">' + ts.fakty.map((f) => "<li>" + esc(f) + "</li>").join("") + "</ul>";
    html += '<p class="k-alt">' + esc(dod ? ts.dopravcovia.text_dodavka : ts.dopravcovia.text) + ' <a href="#p1v-kamiony-dopravcovia" data-a="skok" data-v="p1v-kamiony-dopravcovia">' + esc(ts.dopravcovia.odkaz) + "</a></p>";
    html += "</div>";
    $('[data-k="suhrn"]').innerHTML = html;
  }

  // ------------------------------------------------------------------ lišta (telefón; prvok a triedy ako 1V cena.js)
  function renderLista() {
    const c = cena(), hot = vsetkoHotove(), t = T.kroky.lista;
    const mt = S.material ? matT(S.material) : null;
    const popis = [S.model ? znacka().meno + " " + roky(S.model).replace(/\s*\d{4}–\d{4}$/, "") : "",
      mt ? (/Mikrosemiš/.test(mt.nazov) ? U0.mikrosemis : U0.koza) + ", " + mt.variant : ""].filter(Boolean).join(" · ");
    lst.innerHTML = '<div class="lcd1v-lista__c"><b class="lcd1v-lista__suma"><small>' + esc(t.spolu) + " </small>" + (hot ? "" : esc(t.od) + " ") + eur(c.spolu) + "</b>" +
      '<small class="lcd1v-lista__popis">' + esc(popis) + "</small></div>" +
      '<button type="button" class="lcd1v-lista__kos" data-a="lista" data-f="lista"' + (U.odosiela ? ' disabled aria-disabled="true" aria-busy="true"' : "") + ">" + esc(hot ? t.do_kosika : t.pokracovat) + "</button>";
  }

  // ------------------------------------------------------------------ náhľad motívu v nití (canvas; návrh C)
  // Motív (čiernobiele PNG) sa prefarbí na niť ako doteraz: lum = (r+g+b)/3; lum > 200 -> priehľadné, inak farba nite
  // s alfou 255 − lum. Nakreslí sa na fotku materiálu (cover) s jemným tieňom. Rozlíšenie plátna = aspoň 2× jeho CSS
  // šírky (ostré na retine); bez rozloženia (test) ostane rozmer z HTML.
  const imgCache = {};
  function nacitaj(src) {
    if (!imgCache[src]) imgCache[src] = new Promise((res, rej) => { const i = new w.Image(); i.crossOrigin = "anonymous"; /* CDN posiela ACAO * -> canvas nie je „tainted“, motív sa prefarbí na niť (ako React) */ i.onload = () => res(i); i.onerror = rej; i.src = src; });
    return imgCache[src];
  }
  function prefarbi(im, hex) {
    const t = doc.createElement("canvas");
    t.width = im.naturalWidth; t.height = im.naturalHeight;
    const tc = t.getContext("2d");
    tc.drawImage(im, 0, 0);
    let d;
    try { d = tc.getImageData(0, 0, t.width, t.height); } catch (e) { d = null; } // obrázok z iného pôvodu: bez prefarbenia
    if (d) {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      for (let i = 0; i < d.data.length; i += 4) {
        const lum = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
        if (lum > 200) d.data[i + 3] = 0;
        else { d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = Math.round(255 - lum); }
      }
      tc.putImageData(d, 0, 0);
    }
    return t;
  }
  function kresliNahlady() {
    Array.prototype.forEach.call(root.querySelectorAll("canvas[data-motiv]"), (cv) => {
      let c2 = null;
      try { c2 = cv.getContext && cv.getContext("2d"); } catch (e) { c2 = null; }
      if (!c2) return; // bez canvasu (test) náhľad nie je nevyhnutný
      const cw = cv.clientWidth;
      if (cw > 0) {
        const W = Math.min(1600, Math.round(cw * Math.max(2, w.devicePixelRatio || 1)));
        if (W !== cv.width) { const pomer = cv.height / cv.width; cv.width = W; cv.height = Math.round(W * pomer); }
      }
      const ms = cv.getAttribute("data-motiv"), hex = cv.getAttribute("data-hex"), bg = cv.getAttribute("data-bg");
      const k = parseFloat(cv.getAttribute("data-k") || ".9");
      Promise.all([nacitaj(ms), bg ? nacitaj(bg).catch(() => null) : Promise.resolve(null)]).then((im) => {
        const W = cv.width, H = cv.height;
        c2.clearRect(0, 0, W, H);
        if (im[1]) {
          const b = im[1], s = Math.max(W / b.naturalWidth, H / b.naturalHeight), bw = b.naturalWidth * s, bh = b.naturalHeight * s;
          c2.drawImage(b, (W - bw) / 2, (H - bh) / 2, bw, bh);
        } else { c2.fillStyle = "#fff"; c2.fillRect(0, 0, W, H); }
        if ("imageSmoothingQuality" in c2) c2.imageSmoothingQuality = "high";
        const ve = Math.min(W, H) * k, x = (W - ve) / 2, y = (H - ve) / 2, o = W / 300;
        c2.globalAlpha = 0.45;
        c2.drawImage(prefarbi(im[0], "#000000"), x + o, y + o * 1.3, ve, ve); // tieň
        c2.globalAlpha = hex ? 1 : 0.6; // bez nite: svetlý obrys motívu
        c2.drawImage(prefarbi(im[0], hex || "#efe7d2"), x, y, ve, ve);
        c2.globalAlpha = 1;
      }).catch(() => { /* náhľad nie je nevyhnutný */ });
    });
  }

  // ------------------------------------------------------------------ vykreslenie
  function render() {
    const ae = doc.activeElement;
    const f = ae && (root.contains(ae) || lst.contains(ae)) ? ae.getAttribute("data-f") : null;
    renderKroky();
    renderSuhrn();
    renderLista();
    kresliNahlady();
    if (f) {
      const el = root.querySelector('[data-f="' + f.replace(/"/g, '\\"') + '"]') || lst.querySelector('[data-f="' + f.replace(/"/g, '\\"') + '"]');
      if (el) try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    }
    if (U.zablesk) {
      const k = root.querySelector('[data-krok="' + U.zablesk + '"]');
      if (k) { k.classList.add("is-zablesk"); setTimeout(() => k.classList.remove("is-zablesk"), 1700); }
      U.zablesk = null;
    }
  }

  function posun(el, blok) {
    if (!el) return;
    const reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: blok || "start" }); } catch (e) { /* staré prehliadače */ }
  }
  function posunKrok(id, fokus) {
    const el = root.querySelector('[data-krok="' + id + '"]');
    posun(el);
    if (fokus && el) { const h = el.querySelector(".k-krok__hd"); try { h.focus({ preventScroll: true }); } catch (e) { /* */ } }
  }
  function posunPole(id, pole) {
    const el = root.querySelector('[data-krok="' + id + '"] [data-pole="' + pole + '"]') || root.querySelector('[data-krok="' + id + '"]');
    posun(el, "center");
    const ctl = el && el.querySelector("select:not([disabled]), button, input");
    if (ctl) try { ctl.focus({ preventScroll: true }); } catch (e) { /* */ }
  }

  // ------------------------------------------------------------------ navigácia krokov (artefakt ř. 937–979)
  function prvyNehotovyPred(id) {
    const ks = kroky(), i = ks.indexOf(id);
    for (let j = 0; j < i; j++) if (!hotovy(ks[j])) return ks[j];
    return null;
  }
  function otvorKrok(id) {
    if (kroky().indexOf(id) < 0) id = "vozidlo"; // neznámy krok (napr. tapacír pri dodávke) -> prvý
    const pred = prvyNehotovyPred(id);
    if (pred) { U.chyby[pred] = chyba(pred); U.zablesk = pred; U.otvoreny = pred; render(); posunPole(pred, U.chyby[pred].pole); return; }
    U.otvoreny = id; render(); posunKrok(id, true);
  }
  function klikHlavicka(id) {
    if (U.otvoreny === id) { U.otvoreny = null; render(); return; }
    otvorKrok(id);
  }
  function pokracuj(id) {
    const ch = chyba(id);
    if (ch) { U.chyby[id] = ch; U.zablesk = id; render(); posunPole(id, ch.pole); return; }
    delete U.chyby[id];
    const ks = kroky(), i = ks.indexOf(id);
    let dalsi = null, j;
    for (j = i + 1; j < ks.length; j++) if (!hotovy(ks[j])) { dalsi = ks[j]; break; }
    if (!dalsi) for (j = 0; j < i; j++) if (!hotovy(ks[j])) { dalsi = ks[j]; break; }
    U.otvoreny = dalsi; render();
    if (dalsi && U.chyby[dalsi]) posunPole(dalsi, U.chyby[dalsi].pole);
    else if (dalsi) posunKrok(dalsi, true);
    else { posun($('[data-k="suhrn"]')); const kb = $('[data-k="suhrn"] .k-kosik'); if (kb) try { kb.focus({ preventScroll: true }); } catch (e) { /* */ } }
  }
  /** „Pridať do košíka“: prvý nevyplnený krok sa otvorí s červeným rámom, inak odovzdá výber (index.js doKosika). */
  function kosik() {
    if (U.odosiela) return false; // výber už odišiel do košíka, čaká sa na Shoptet (N4)
    const ks = kroky();
    let prvy = null;
    ks.forEach((k) => { if (!hotovy(k)) { U.chyby[k] = chyba(k); if (!prvy) prvy = k; } });
    if (prvy) { U.chybaKosik = true; U.otvoreny = prvy; U.zablesk = prvy; render(); posunPole(prvy, U.chyby[prvy].pole); return false; }
    U.chybaPrenosu = false;
    const ok = o.doKosika(S) !== false;
    if (!ok) { U.chybaPrenosu = true; render(); }
    return ok;
  }
  function lista() {
    if (U.odosiela) return;
    if (vsetkoHotove()) { kosik(); return; }
    const x = U.otvoreny;
    if (x && !hotovy(x)) { posunPole(x, chyba(x).pole); return; }
    if (x && hotovy(x)) { pokracuj(x); return; }
    const p = kroky().filter((k) => !hotovy(k))[0];
    U.otvoreny = p; render(); posunKrok(p, true);
  }

  // ------------------------------------------------------------------ zmeny výberu (artefakt ř. 982–995)
  function zmena(fn) {
    const malNas = !!koberecNas();
    fn();
    if (!tapDostupny()) { S.tap = null; S.tapNas = null; }
    /* Nášivka na tapacír „ako na kobercoch“ stratila vzor -> otázka na dvere sa ukáže znova s vysvetlením. */
    if (malNas && !koberecNas() && S.tap === "ano" && S.tapNas === true && S.tapNasRovnaka) {
      S.tapNas = null; U.dvereInfo = true; U.chyby.tapacir = chyba("tapacir");
    }
    if (S.tapNas != null) U.dvereInfo = false;
    prepocitajChyby();
    render();
    o.naZmenu(S);
  }
  const resetVozidla = () => { S.znacka = null; S.model = null; S.polia = {}; };
  /** Pridanie nášiviek pred sedadlá k stredovému kobercu: prevezmú jeho motív a niť (vybraté sa nestratí). */
  function pridajBoky() {
    if (S.nas === "stred" && (S.nasStred.motiv || S.nasStred.nit)) { S.nasBoky = { motiv: S.nasStred.motiv, nit: S.nasStred.nit }; S.stredRovnaky = true; }
  }
  /** Odobratie nášiviek pred sedadlami: stredový koberec „rovnaký ako pred sedadlami“ si nechá ich motív a niť. */
  function odoberBoky() {
    if (S.nas === "boky+stred" && S.stredRovnaky && (S.nasBoky.motiv || S.nasBoky.nit)) S.nasStred = { motiv: S.nasBoky.motiv, nit: S.nasBoky.nit };
  }

  function akcia(a, el) {
    const v = el.getAttribute("data-v"), m = el.getAttribute("data-m");
    switch (a) {
      case "krok": klikHlavicka(v); return;
      case "dalej": pokracuj(v); return;
      case "typ": if (S.typ !== v) zmena(() => { S.typ = v; resetVozidla(); }); return;
      case "mat": zmena(() => { if (S.material !== v) { S.material = v; if (S.farba && !farba(v, S.farba)) S.farba = null; } }); return;
      case "farba": zmena(() => { S.farba = v; }); return;
      case "lem": zmena(() => { S.lem = v; }); return;
      case "nas": {
        /* Dlaždice miest sa zaškrtávajú (návrh C): „pred sedadlá“ a „stredový koberec“ prepínajú svoje miesto, „všetky
           tri“ zapne obe; z prázdneho výberu = presne ten stav (boky / stred / boky+stred / nechcem). Výber sa nikdy
           nevráti na prázdny (revízia 18. 10. 2026): ťuk na jediné zvolené miesto ani na zvolený balík nič nemení —
           inak by selecty Shoptetu ostali na starej hodnote (sync s null nič nenastaví). Zmena = iné miesto alebo „Nie“. */
        const b = jeBoky(), s = jeStred();
        if ((v === "boky+stred" && b && s) || (v === "boky" && b && !s) || (v === "stred" && s && !b)) return;
        zmena(() => {
          if (v === "nechcem") { if (b) odoberBoky(); S.nas = "nechcem"; }
          else if (v === "boky+stred") { if (!b) pridajBoky(); S.nas = "boky+stred"; }
          else if (v === "boky") { if (b) { odoberBoky(); S.nas = naNas(false, s); } else { pridajBoky(); S.nas = naNas(true, s); } }
          else if (v === "stred") S.nas = naNas(b, !s);
        });
        if (v === "nechcem") pokracuj("nasivky");
        return;
      }
      case "motiv": zmena(() => { if (m === "boky") S.nasBoky.motiv = v; else if (m === "stred") S.nasStred.motiv = v; else { S.tapNasMotiv = v; if (!koberecNas()) S.tapNasRovnaka = false; } }); return;
      case "nit": zmena(() => { if (m === "boky") S.nasBoky.nit = v; else if (m === "stred") S.nasStred.nit = v; else { S.tapNasNit = v; if (!koberecNas()) S.tapNasRovnaka = false; } }); return;
      case "viac": {
        U.viac[m] = true;
        render();
        const zoz = root.querySelectorAll('[data-a="nit"][data-m="' + m + '"]'), prvy = zoz[T.kroky.nasivky.nit.prve || 0];
        if (prvy) try { prvy.focus({ preventScroll: true }); } catch (e) { /* */ }
        return;
      }
      case "stredRovnaky": zmena(() => { S.stredRovnaky = v === "1"; }); return;
      case "tapNasRovnaka": zmena(() => { S.tapNasRovnaka = v === "1"; }); return;
      case "tap":
        zmena(() => { S.tap = v; });
        if (v === "nie") pokracuj("tapacir");
        return;
      case "tapZmenit":
        /* Už zvolené „Vybrať inak“ -> bez účinku. Vopred sa doplní materiál, farba a lemovanie kobercov, farba len ak patrí
           k materiálu tapacíru (revízia 18. 10. 2026: inak „12“ pri dvojfarebnom mikrosemiši zhodilo zhrnutie -> React). */
        if (!S.tapRovnaky) return;
        zmena(() => {
          S.tapRovnaky = false; S.tapMat = S.tapMat || S.material;
          if (!S.tapFarba && S.tapMat && S.farba && farba(S.tapMat, S.farba)) S.tapFarba = S.farba;
          S.tapLem = S.tapLem || S.lem;
        });
        return;
      case "tapRovnake": zmena(() => { S.tapRovnaky = true; }); return;
      case "tapMat": zmena(() => { if (S.tapMat !== v) { S.tapMat = v; if (S.tapFarba && !farba(v, S.tapFarba)) S.tapFarba = null; } }); return;
      case "tapFarba": zmena(() => { S.tapFarba = v; }); return;
      case "tapLem": zmena(() => { S.tapLem = v; }); return;
      case "tapNas": zmena(() => { S.tapNas = v === "ano"; }); return;
      case "kosik": kosik(); return;
      case "lista": lista(); return;
      case "skok": posun(doc.getElementById(v)); return;
    }
  }

  // ------------------------------------------------------------------ poslucháči
  function naKlik(e) {
    const el = e.target.closest && e.target.closest("[data-a]");
    if (!el || !(root.contains(el) || lst.contains(el))) return;
    if (el.tagName === "SELECT" || el.tagName === "INPUT") return;
    e.preventDefault();
    try { akcia(el.getAttribute("data-a"), el); } catch (x) { chybaUi(x); }
  }
  /** Chyba po štarte (klik, zmena) -> index.js vráti React (poistka: nikdy rozbitá stránka). */
  function chybaUi(x) {
    if (typeof o.priChybe === "function") o.priChybe(x);
    else throw x;
  }
  function naZmenuPola(e) {
    const el = e.target, a = el.getAttribute && el.getAttribute("data-a");
    if (!a || !root.contains(el)) return;
    e.stopPropagation(); // naše polia nie sú polia formulára Shoptetu (žiadne name) — živý kód ich nemá vidieť
    try { zmenaPola(el, a); } catch (x) { chybaUi(x); }
  }
  function zmenaPola(el, a) {
    if (a === "sel") {
      const p = el.getAttribute("data-p"), v = el.value || null;
      zmena(() => {
        if (p === "znacka") { S.znacka = v; S.model = null; S.polia = {}; }
        else if (p === "model") { S.model = v; const mm = model(); S.polia = mm ? Object.assign({}, mm.auto_vybrane) : {}; }
        else S.polia[p] = v;
      });
    }
  }
  root.addEventListener("click", naKlik);
  root.addEventListener("change", naZmenuPola);
  lst.addEventListener("click", naKlik);

  /** „Odosiela sa“: tlačidlá košíka vypnuté; samé sa zapnú po 3 s (index.js ich zapne skôr po ShoptetCartUpdated). */
  let odosielaCas = 0;
  function odosiela(on) {
    clearTimeout(odosielaCas);
    if (on) odosielaCas = setTimeout(() => odosiela(false), 3000);
    if (U.odosiela === !!on) return;
    U.odosiela = !!on;
    renderSuhrn();
    renderLista();
  }

  const hodn = renderHlavicka();
  render();
  return {
    S,
    U,
    render,
    otvorKrok,
    kosik,
    odosiela,
    hotovo: vsetkoHotove,
    cena,
    hodnotenie: (p) => nastavHodnotenie(hodn, p),
    /** súhrn s tlačidlom (lišta sa skryje, keď je na obrazovke) */
    suhrn: () => $('[data-k="suhrn"]'),
    zrus() {
      clearTimeout(odosielaCas);
      hodn.removeEventListener("click", naHodnotenie);
      root.removeEventListener("click", naKlik);
      root.removeEventListener("change", naZmenuPola);
      lst.removeEventListener("click", naKlik);
    },
  };
}
