// UI konfigurátora kamiónov a dodávok (SK 640): hlavička, 6 krokov, súhrn, lepivá lišta. Port schváleného artefaktu
// kamiony-app/app.js (render a akcie ř. 38–130, 164–680, 755–995) BEZ pásu ukážky, poznámok k návrhu, prepínača
// PC/Telefón, vlastnej galérie, ukážky košíka a obsahu pod konfigurátorom (docs/kamiony-1v-plan.md §3.1–3.2).
// Všetky tlačidlá type="button", žiadne name (koreň je vo <form>). Ceny len z cena.js (živé ceny Shoptetu).
// Do košíka nič nepíše: zmenu výberu a „Pridať do košíka“ odovzdá cez naZmenu / doKosika (index.js -> shoptet.js).
import { TEXTY } from "./texty.js";
import { MATERIALY, LEMOVANIE, NASIVKY, NITE, POLIA, PORADIE_POLI, ZNACKY, FOTKA_DVERI } from "./data.js";
import { vypocitajCenu, ponuka as ponukaCien, tapacirDostupny } from "./cena.js";
import { novyStav, koberecNas as knS, stredEff as seS, najdiZnacku, najdiModel, naStavCeny } from "./stav.js";

const NB = " "; // nezalomiteľná medzera „423 €“ (ako artefakt a 1V)
const P = "k1v-"; // predpona id prvkov (stránka Shoptetu má vlastné id)

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
  const U = { otvoreny: "vozidlo", chyby: {}, chybaKosik: false, zablesk: null, dvereInfo: false };
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
  const stredEff = () => seS(S);
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
          if (!S.tapFarba) return { pole: "tapFarba", msg: c.farba };
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
    hodn.href = "#";
    hodn.hidden = true;
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
        s = S.tapRovnaky ? tk.tapacir.zhrnutie_ano : fill(tk.tapacir.zhrnutie_ano_vlastne, { nazov: matT(S.tapMat).nazov, variant: matT(S.tapMat).variant, farba: mala(farba(S.tapMat, S.tapFarba).meno) });
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

  function dlazdiceMotivov(miesto, vybraty, prefix) {
    const zoz = motivy(miesto);
    return '<div class="k-dlazdice k-dlazdice--motiv" style="--k-dl-n:' + Math.max(1, Math.min(4, zoz.length)) + '" role="group" aria-label="' + attr(U0.motiv_aria) + '">' + zoz.map((m) => {
      const on = vybraty === m.kod;
      return '<button type="button" class="k-dlazdica' + (on ? " is-on" : "") + '" data-a="motiv" data-m="' + prefix + '" data-v="' + m.kod + '" data-f="mot:' + prefix + m.kod + '" aria-pressed="' + on + '">' +
        '<img class="k-dlazdica__img" src="' + attr(m.full) + '" alt="' + attr(fill(U0.motiv_alt, { x: m.meno })) + '" loading="lazy"><span class="k-dlazdica__nm">' + esc(m.meno) + "<small>" + m.kod + "</small></span></button>";
    }).join("") + "</div>";
  }
  function cipyNiti(prefix, vybrata) {
    return '<div class="nt" role="group" aria-label="' + attr(U0.nit_aria) + '">' + nite().map((n) => {
      const on = vybrata === n.kod;
      return '<button type="button" class="nt__b' + (on ? " is-on" : "") + '" data-a="nit" data-m="' + prefix + '" data-v="' + n.kod + '" data-f="nit:' + prefix + n.kod + '" aria-pressed="' + on + '">' +
        '<i style="background:' + n.hex + '" aria-hidden="true"></i>' + esc(n.menoUi) + " <small>" + n.kod + "</small></button>";
    }).join("") + "</div>";
  }
  function nahladMotivu(x, bgMat, bgKod) {
    if (!x.motiv) return "";
    const m = motiv(x.motiv), n = x.nit ? nit(x.nit) : null, f = bgMat && bgKod ? farba(bgMat, bgKod) : null;
    return '<div class="mn"><canvas width="192" height="192" data-motiv="' + attr(m.full) + '" data-hex="' + (n ? n.hex : "#2a2a2a") + '" data-bg="' + (f ? attr(f.full) : "") +
      '" role="img" aria-label="' + attr(fill(U0.nahlad_aria, { x: m.meno })) + '"></canvas><p><b>' + esc(fill(U0.nahlad, { meno: m.meno, kod: m.kod })) + "</b>" +
      (n ? esc(fill(U0.nahlad_nit, { nit: mala(n.menoUi), kod: n.kod })) + (f ? esc(fill(U0.nahlad_na, { farba: mala(f.meno), kod: f.kod })) : "") + "." : esc(U0.nahlad_bez_nite)) +
      esc(U0.nahlad_ilustr) + "</p></div>";
  }

  function teloNasivky(posledny) {
    const t = T.kroky.nasivky;
    let html = '<p class="k-pod">' + esc(t.pomocna_veta) + "</p>";
    const pon = ponuka().nasivky;
    const volby = t.volby.map((v, i) => {
      const on = S.nas === v.id, naj = !!v.stitok, p = pon[v.id];
      const c = p && p.suma ? (p.povodna != null ? "<s>" + eur(p.povodna) + "</s>" : "") + "<b>" + plus(p.suma) + "</b>" + (p.usetrite ? "<i>" + esc(eurX(t.usetrite, p.usetrite)) + "</i>" : "")
        : "<em>" + esc(v.cena_text) + "</em>";
      return '<button type="button" class="nv__b' + (naj ? " nv__b--naj" : "") + (on ? " is-on" : "") + '" data-a="nas" data-v="' + v.id + '" data-f="nas:' + i + '" aria-pressed="' + on + '">' +
        (naj ? '<span class="k-naj">' + esc(v.stitok) + "</span>" : "") +
        '<span class="nv__r" aria-hidden="true"></span><span class="nv__tx"><span class="nv__nm">' + esc(v.text) + '</span><span class="nv__po">' + esc(v.popis) + "</span></span>" +
        '<span class="nv__c">' + c + "</span></button>";
    }).join("");
    html += sk("nasivky", "nas", "", '<div class="nv" role="group" aria-label="' + attr(U0.nasivky_aria) + '">' + volby + "</div>");
    const bg = [S.material, S.farba];
    if (S.nas === "boky" || S.nas === "boky+stred") {
      const ks = S.nas === "boky+stred" ? U0.motiv_boky_oba : t.motiv.label;
      html += '<div class="tp-oddiel">';
      html += sk("nasivky", "bokyMotiv", ks, dlazdiceMotivov("boky", S.nasBoky.motiv, "boky"));
      html += sk("nasivky", "bokyNit", t.nit.label, cipyNiti("boky", S.nasBoky.nit));
      html += nahladMotivu(S.nasBoky, bg[0], bg[1]);
      html += "</div>";
      if (S.nas === "boky+stred") {
        html += '<label class="zas"><input type="checkbox" data-a="stredRovnaky" data-f="stredRovnaky"' + (S.stredRovnaky ? " checked" : "") + "><span>" +
          esc(t.stred_rovnaky) + "<small>" + esc(t.stred_rovnaky_pozn) + "</small></span></label>";
        if (!S.stredRovnaky) {
          html += '<div class="tp-oddiel">';
          html += sk("nasivky", "stredMotiv", t.stred_iny.motiv, dlazdiceMotivov("stred", S.nasStred.motiv, "stred"));
          html += sk("nasivky", "stredNit", t.stred_iny.nit, cipyNiti("stred", S.nasStred.nit));
          html += nahladMotivu(S.nasStred, bg[0], bg[1]);
          html += "</div>";
        }
      }
    } else if (S.nas === "stred") {
      html += '<div class="tp-oddiel">';
      html += sk("nasivky", "stredMotiv", t.stred_iny.motiv, dlazdiceMotivov("stred", S.nasStred.motiv, "stred"));
      html += sk("nasivky", "stredNit", t.nit.label, cipyNiti("stred", S.nasStred.nit));
      html += nahladMotivu(S.nasStred, bg[0], bg[1]);
      html += "</div>";
    }
    html += koniecKroku("nasivky", posledny);
    return html;
  }

  function teloTapacir(posledny) {
    const t = T.kroky.tapacir, a = t.volby.ano;
    let html = '<p class="k-pod">' + esc(t.vysvetlivka) + "</p>";
    const on = S.tap === "ano", off = S.tap === "nie", po = ponuka(), pt = po.tapacir;
    const karta = '<div class="k-ponuka-k"><div class="k-kkarta k-kkarta--naj' + (on ? " is-on" : "") + '" role="group" aria-label="' + attr(t.nazov) + '">' +
      '<span class="k-kkarta__fot k-ponuka__fot"><span class="k-ponuka__ram"><img src="' + attr(FOTKA_DVERI) + '" alt="' + attr(U0.tap_foto_alt) + '" loading="lazy"></span></span>' +
      '<span class="k-kkarta__tx"><span class="k-kkarta__nm">' + esc(t.nazov) + '</span><span class="k-kkarta__ben">' + esc(t.benefit) + "</span>" +
      '<span class="tp-foto-pozn">' + esc(t.foto_pozn) + "</span>" +
      '<span class="k-cenovka"><span class="k-cenovka__l">' + esc(a.s_kobercami) + '</span><span class="k-cenovka__c">' + eur(pt.suma) + "</span>" +
      (pt.povodna != null ? '<span class="k-cenovka__s">' + esc(a.samostatne) + " <s>" + eur(pt.povodna) + "</s></span>" : "") +
      (pt.usetrite ? '<span class="k-cenovka__u">' + esc(eurX(a.usetrite, pt.usetrite)) + "</span>" : "") + "</span></span>" +
      '<button type="button" class="k-ponuka__ano' + (on ? " is-on" : off ? " je-druha" : "") + '" data-a="tap" data-v="ano" data-f="tap:ano" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(a.text) + "</button></div>" +
      '<button type="button" class="k-btn-zlate' + (off ? " is-on" : on ? " je-druha" : "") + '" data-a="tap" data-v="nie" data-f="tap:nie" aria-pressed="' + off + '">' + (off ? "✓ " : "") + esc(t.volby.nie.text) + "</button>" +
      (off ? '<p class="k-pozn">' + esc(t.volby.nie.pozn) + "</p>" : "") + "</div>";
    html += sk("tapacir", "tap", "", karta);

    if (on) {
      html += '<div class="tp-oddiel"><span class="k-sk-h">' + esc(U0.tap_oddiel) + "</span>";
      if (S.tapRovnaky) {
        const f = farba(S.material, S.farba), l = lem(S.lem);
        const popis = [S.material ? matKratko(S.material) : "", f ? mala(f.meno) + " (" + f.kod + ")" : "", l ? fill(U0.suhrn_lemovanie, { x: l.menoUi + " (" + l.kod + ")" }) : ""].filter(Boolean).join(" · ");
        html += '<div class="tp-rov"><span class="tp-rov__ic" aria-hidden="true">✓</span><span class="tp-rov__tx"><b>' + esc(t.predvolene.text) + "</b><span>" +
          esc(popis) + "</span></span>" +
          '<button type="button" class="tp-odkaz" data-a="tapZmenit" data-f="tapZmenit">' + esc(t.predvolene.zmenit) + "</button></div>";
      } else {
        html += sk("tapacir", "tapMat", t.vlastne.material, '<div class="k-dlazdice k-dlazdice--mat" role="group" aria-label="' + attr(t.vlastne.material) + '">' + MATERIALY.map((m, i) => {
          const v = matT(m.nazov), x = S.tapMat === m.nazov;
          return '<button type="button" class="k-dlazdica' + (x ? " is-on" : "") + '" data-a="tapMat" data-v="' + attr(m.nazov) + '" data-f="tapMat:' + i + '" aria-pressed="' + x + '">' +
            '<img class="k-dlazdica__img" src="' + attr(m.karta_obrazok) + '" alt="" loading="lazy"><span class="k-dlazdica__nm">' + esc(v.variant) + "<small>" + esc(v.nazov === "Mikrosemiš" ? U0.mikrosemis : U0.syntetika) + "</small></span></button>";
        }).join("") + "</div>");
        if (S.tapMat) html += sk("tapacir", "tapFarba", t.vlastne.farba, mriezkaFarieb(S.tapMat, S.tapFarba, "tapFarba", "tf:"));
        html += sk("tapacir", "tapLem", t.vlastne.lemovanie, mriezkaLem(S.tapLem, "tapLem", "tl:", null));
        html += '<button type="button" class="tp-odkaz tp-spat" data-a="tapRovnake" data-f="tapRovnake">' + esc(t.vlastne.spat) + "</button>";
      }
      html += "</div>";

      const nd = t.nasivka_dvere, an = S.tapNas, pd = po.nasivka_dvere;
      html += '<div class="tp-oddiel">';
      html += sk("tapacir", "tapNas", nd.otazka, (U.dvereInfo && an == null ? '<p class="tp-info">' + esc(nd.zmena_info) + "</p>" : "") +
        '<div class="an' + (an != null ? " an--vybrate" : "") + '" role="group" aria-label="' + attr(nd.otazka) + '">' +
        '<button type="button" class="an__b an__b--ano' + (an === true ? " is-on" : "") + '" data-a="tapNas" data-v="ano" data-f="tapNas:ano" aria-pressed="' + (an === true) + '">' + esc(nd.ano) + "<small>" + plus(pd.suma) + "</small></button>" +
        '<button type="button" class="an__b an__b--nie' + (an === false ? " is-on" : "") + '" data-a="tapNas" data-v="nie" data-f="tapNas:nie" aria-pressed="' + (an === false) + '">' + esc(nd.nie) + "<small>" + esc(nd.bez_priplatku) + "</small></button></div>" +
        (pd.povodna != null ? '<p class="an-info">' + esc(nd.info_samostatne) + " <s>" + eur(pd.povodna) + "</s>, " + esc(nd.info_s_tapacirom) + " " + eur(pd.suma) +
          (pd.usetrite ? " – <b>" + esc(eurX(nd.usetrite, pd.usetrite)) + "</b>" : "") + "</p>" : ""));
      if (an === true) {
        const kn = koberecNas();
        if (kn) {
          html += '<label class="zas"><input type="checkbox" data-a="tapNasRovnaka" data-f="tapNasRovnaka"' + (S.tapNasRovnaka ? " checked" : "") + "><span>" + esc(nd.rovnaka) +
            "<small>" + esc(motivTxt(kn)) + "</small></span></label>";
        }
        if (!kn || !S.tapNasRovnaka) {
          html += '<div class="tp-oddiel">';
          html += sk("tapacir", "dvereMotiv", nd.motiv, dlazdiceMotivov("dvere", S.tapNasMotiv, "dvere"));
          html += sk("tapacir", "dvereNit", nd.nit, cipyNiti("dvere", S.tapNasNit));
          html += nahladMotivu({ motiv: S.tapNasMotiv, nit: S.tapNasNit }, tapMaterial(), tapFarbaKod());
          html += "</div>";
        }
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
      html += riadok(matKratko(S.material) + (f ? " · " + mala(f.meno) + " (" + f.kod + ")" : ""), l ? fill(U0.suhrn_lemovanie, { x: l.menoUi + " (" + l.kod + ")" }) : "",
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
        (tm ? matKratko(tm) : "") + (tf ? " · " + mala(tf.meno) + " (" + tf.kod + ")" : "") + (tl ? " · " + fill(U0.suhrn_lemovanie, { x: tl.menoUi + " (" + tl.kod + ")" }) : ""), cen(r.tapacir));
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
    html += '<button type="button" class="k-btn-zelene k-kosik" data-a="kosik" data-f="kosik">' + esc(hot ? ts.tlacidlo : T.kroky.tlacidla.dokoncite) + "</button>";
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
      '<button type="button" class="lcd1v-lista__kos" data-a="lista" data-f="lista">' + esc(hot ? t.do_kosika : t.pokracovat) + "</button>";
  }

  // ------------------------------------------------------------------ náhľad motívu v nití (canvas, artefakt ř. 868–900)
  const imgCache = {};
  function nacitaj(src) {
    if (!imgCache[src]) imgCache[src] = new Promise((res, rej) => { const i = new w.Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    return imgCache[src];
  }
  function kresliNahlady() {
    Array.prototype.forEach.call(root.querySelectorAll("canvas[data-motiv]"), (cv) => {
      let c2 = null;
      try { c2 = cv.getContext && cv.getContext("2d"); } catch (e) { c2 = null; }
      if (!c2) return; // bez canvasu (test) náhľad nie je nevyhnutný
      const ms = cv.getAttribute("data-motiv"), hex = cv.getAttribute("data-hex"), bg = cv.getAttribute("data-bg");
      Promise.all([nacitaj(ms), bg ? nacitaj(bg) : Promise.resolve(null)]).then((im) => {
        const W = cv.width, H = cv.height;
        c2.clearRect(0, 0, W, H);
        if (im[1]) c2.drawImage(im[1], 0, 0, W, H); else { c2.fillStyle = "#fff"; c2.fillRect(0, 0, W, H); }
        const t = doc.createElement("canvas"); t.width = im[0].naturalWidth; t.height = im[0].naturalHeight;
        const tc = t.getContext("2d"); tc.drawImage(im[0], 0, 0);
        let d;
        try { d = tc.getImageData(0, 0, t.width, t.height); } catch (e) { d = null; } // obrázok z iného pôvodu: bez prefarbenia
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        if (d) {
          for (let i = 0; i < d.data.length; i += 4) {
            const lum = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
            if (lum > 200) d.data[i + 3] = 0;
            else { d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = Math.round(255 - lum); }
          }
          tc.putImageData(d, 0, 0);
        }
        const s = W * 0.82;
        c2.drawImage(t, (W - s) / 2, (H - s) / 2, s, s);
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

  function akcia(a, el) {
    const v = el.getAttribute("data-v"), m = el.getAttribute("data-m");
    switch (a) {
      case "krok": klikHlavicka(v); return;
      case "dalej": pokracuj(v); return;
      case "typ": if (S.typ !== v) zmena(() => { S.typ = v; resetVozidla(); }); return;
      case "mat": zmena(() => { if (S.material !== v) { S.material = v; if (S.farba && !farba(v, S.farba)) S.farba = null; } }); return;
      case "farba": zmena(() => { S.farba = v; }); return;
      case "lem": zmena(() => { S.lem = v; }); return;
      case "nas":
        zmena(() => {
          /* pri prepnutí rozsahu sa prenesie už vybraný motív a niť */
          const se = stredEff();
          if (v === "stred" && !(S.nasStred.motiv && S.nasStred.nit) && (S.nas === "boky" || S.nas === "boky+stred")) S.nasStred = { motiv: se.motiv || S.nasBoky.motiv, nit: se.nit || S.nasBoky.nit };
          else if (v === "stred" && S.nas === "boky+stred" && S.stredRovnaky) S.nasStred = { motiv: S.nasBoky.motiv, nit: S.nasBoky.nit };
          if ((v === "boky" || v === "boky+stred") && !(S.nasBoky.motiv && S.nasBoky.nit) && S.nas === "stred") S.nasBoky = { motiv: S.nasStred.motiv, nit: S.nasStred.nit };
          S.nas = v;
        });
        if (v === "nechcem") pokracuj("nasivky");
        return;
      case "motiv": zmena(() => { if (m === "boky") S.nasBoky.motiv = v; else if (m === "stred") S.nasStred.motiv = v; else S.tapNasMotiv = v; }); return;
      case "nit": zmena(() => { if (m === "boky") S.nasBoky.nit = v; else if (m === "stred") S.nasStred.nit = v; else S.tapNasNit = v; }); return;
      case "tap":
        zmena(() => { S.tap = v; });
        if (v === "nie") pokracuj("tapacir");
        return;
      case "tapZmenit": zmena(() => { S.tapRovnaky = false; S.tapMat = S.tapMat || S.material; S.tapFarba = S.tapFarba || S.farba; S.tapLem = S.tapLem || S.lem; }); return;
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
    } else if (a === "stredRovnaky") zmena(() => { S.stredRovnaky = el.checked; });
    else if (a === "tapNasRovnaka") zmena(() => { S.tapNasRovnaka = el.checked; });
  }
  root.addEventListener("click", naKlik);
  root.addEventListener("change", naZmenuPola);
  lst.addEventListener("click", naKlik);

  const hodn = renderHlavicka();
  render();
  return {
    S,
    U,
    render,
    otvorKrok,
    kosik,
    hotovo: vsetkoHotove,
    cena,
    hodnotenie: (p) => nastavHodnotenie(hodn, p),
    /** súhrn s tlačidlom (lišta sa skryje, keď je na obrazovke) */
    suhrn: () => $('[data-k="suhrn"]'),
    zrus() {
      root.removeEventListener("click", naKlik);
      root.removeEventListener("change", naZmenuPola);
      lst.removeEventListener("click", naKlik);
    },
  };
}
