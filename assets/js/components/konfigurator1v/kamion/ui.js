// UI konfigurátora kamiónov a dodávok (SK 640): hlavička, 6 krokov, súhrn, lepivá lišta. Port schváleného artefaktu
// kamiony-app/app.js (render a akcie ř. 38–130, 164–680, 755–995) BEZ pásu ukážky, poznámok k návrhu, prepínača
// PC/Telefón, vlastnej galérie, ukážky košíka a obsahu pod konfigurátorom (docs/kamiony-1v-plan.md §3.1–3.2).
// Všetky tlačidlá type="button", žiadne name (koreň je vo <form>). Ceny len z cena.js (živé ceny Shoptetu).
// Do košíka nič nepíše: zmenu výberu a „Pridať do košíka“ odovzdá cez naZmenu / doKosika (index.js -> shoptet.js).
import { TEXTY } from "./texty.js";
import { MATERIALY, LEMOVANIE, NASIVKY, NITE, POLIA, PORADIE_POLI, ZNACKY, FOTKA_DVERI_SUBOR, FOTKY_DVERI, FOTKA_KABINY_NASIVKY } from "./data.js";
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
  const U = { otvoreny: "vozidlo", chyby: {}, chybaKosik: false, zablesk: null, dvereInfo: false, odosiela: false,
    // kroky 5 a 6 — otázky po jednej: čo je zodpovedané / potvrdené „Pokračovať“ a čo je znova otvorené cez „Zmeniť“ (len UI, nie S)
    n5: { boky: false, stred: false, stredOdp: false }, n6: { matOdp: false, mat: false, nasOdp: false, nas: false }, znova: { nasivky: null, tapacir: null } };
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
        /* Otázky po jednej (Michal 18. 10. 2026 večer): krok je hotový až po „Pokračovať“ v každej karte a odpovedi na
           stredový koberec pri všetkých troch (U.n5). Košík to nemení — S.nas a motívy idú do Shoptetu ako doteraz. */
        c = tk.nasivky.chyby;
        if (!S.nas) return { pole: "nas", msg: c.volba };
        if (S.nas === "nechcem") return null;
        if (S.nas === "boky" || S.nas === "boky+stred") {
          if (!S.nasBoky.motiv) return { pole: "bokyMotiv", msg: c.motiv };
          if (!S.nasBoky.nit) return { pole: "bokyNit", msg: c.nit };
          if (!U.n5.boky) return { pole: "bokyDalej", msg: c.pokracovat };
          if (S.nas === "boky") return null;
        }
        if (S.nas === "boky+stred") {
          if (!U.n5.stredOdp) return { pole: "stredVolba", msg: c.stred_volba };
          if (S.stredRovnaky) return null;
        }
        if (!S.nasStred.motiv) return { pole: "stredMotiv", msg: S.nas === "stred" ? c.motiv : c.motiv_stred };
        if (!S.nasStred.nit) return { pole: "stredNit", msg: S.nas === "stred" ? c.nit : c.nit_stred };
        if (!U.n5.stred) return { pole: "stredDalej", msg: c.pokracovat };
        return null;
      case "tapacir":
        c = tk.tapacir.chyby;
        if (!S.tap) return { pole: "tap", msg: c.volba };
        if (S.tap === "nie") return null;
        if (!U.n6.matOdp) return { pole: "tapRovn", msg: c.rovnake };
        if (!S.tapRovnaky) {
          if (!S.tapMat) return { pole: "tapMat", msg: c.material };
          if (!S.tapFarba || !farba(S.tapMat, S.tapFarba)) return { pole: "tapFarba", msg: c.farba };
          if (!S.tapLem) return { pole: "tapLem", msg: c.lemovanie };
          if (!U.n6.mat) return { pole: "tapMatDalej", msg: c.pokracovat };
        }
        /* U.dvereInfo: nášivka na dvere „ako na kobercoch“ stratila vzor -> otázka Áno / Nie platí znova (s vysvetlením),
           kým na ňu zákazník neodpovie — ani znova „Áno“ pri tapacíri ju neobíde (revízia 18. 10. 2026 večer). */
        if (S.tapNas == null || U.dvereInfo) return { pole: "tapNas", msg: c.nasivka };
        if (S.tapNas) {
          if (koberecNas() && !U.n6.nasOdp) return { pole: "tapNasVolba", msg: c.nasivka_volba };
          if (!(S.tapNasRovnaka && koberecNas())) {
            if (!S.tapNasMotiv) return { pole: "dvereMotiv", msg: c.motiv };
            if (!S.tapNasNit) return { pole: "dvereNit", msg: c.nit };
            if (!U.n6.nas) return { pole: "dvereDalej", msg: c.pokracovat };
          }
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
    // 1B (Michal 22. 10. 2026): bez úvodnej vety a čipov „V základnej cene“ — čo je v cene, povedia dve vety s ✓ v cenovom boxe
    zvysok.innerHTML =
      '<div class="k-cena"><div class="k-cena__stl"><div class="k-cena__fig"><div class="k-cena__stitok">' + esc(h.cena_popis.stitok) +
      '</div><div class="k-cena__teraz"><i class="k-cena__od">' + esc(h.cena_popis.od) + ' </i><b class="k-cena__suma">' + eur(D.ceny.zaklad_eur) + "</b></div></div></div>" +
      '<ul class="k-cena__vc">' + h.cena_popis.v_cene.map((x) => '<li class="k-cena__vr">' + esc(x) + "</li>").join("") + "</ul></div>" +
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
  /** Hlavička hotového kroku = „čo je vybraté · cena“ ako autokoberce (6A, Michal 22. 10. 2026; súhrn bez riadkov):
   *  cena na konci za nezalomiteľnou medzerou (na telefóne nový riadok nezačne „· + 119 €“). Ceny len z cena.js (živé
   *  ceny Shoptetu). Pole = viac riadkov (tapacír + nášivka na dvere). */
  const sCenou = (s, c) => s + NB + "·" + NB + c;
  function zhrnutie(id) {
    const tk = T.kroky, vCene = T.suhrn.v_cene, po = ponuka();
    let t, f, l, s;
    switch (id) {
      case "vozidlo": s = nazovVozidla(); t = detailyVozidla(); return sCenou(t ? s + " · " + t : s, eur(D.ceny.zaklad_eur));
      case "material": t = matT(S.material); return fill(tk.material.zhrnutie, { nazov: t.nazov, variant: t.variant, cena_text: cenaMaterialu(S.material) });
      case "farba": f = farba(S.material, S.farba); return sCenou(fill(tk.farba.zhrnutie, { farba: f.meno, kod: f.kod }), vCene);
      case "lemovanie": l = lem(S.lem); return sCenou(l.menoUi + " (" + l.kod + ")", vCene);
      case "nasivky": {
        if (S.nas === "nechcem") return sCenou(tk.nasivky.zhrnutie_nie, tk.nasivky.hotove.bez_priplatku);
        const rozsah = tk.nasivky.rozsah[S.nas];
        const x = S.nas === "stred" ? S.nasStred : S.nasBoky;
        s = rozsah + " · " + motiv(x.motiv).meno + " · " + fill(U0.nit, { x: mala(nit(x.nit).menoUi) });
        if (S.nas === "boky+stred" && !S.stredRovnaky) s += " · stred: " + motiv(S.nasStred.motiv).meno + ", " + fill(U0.nit, { x: mala(nit(S.nasStred.nit).menoUi) });
        return sCenou(s, plus(po.nasivky[S.nas].suma));
      }
      case "tapacir": {
        if (S.tap === "nie") return tk.tapacir.zhrnutie_nie;
        f = S.tapRovnaky ? null : farba(S.tapMat, S.tapFarba);
        l = S.tapRovnaky ? null : lem(S.tapLem);
        s = S.tapRovnaky ? tk.tapacir.zhrnutie_ano
          : fill(tk.tapacir.zhrnutie_ano_vlastne, { nazov: matT(S.tapMat).nazov, variant: matT(S.tapMat).variant, farba: f ? farbaTx(f) : "", lemovanie: l ? lemTx(l) : "" });
        const r = [sCenou(s, plus(po.tapacir.suma))];
        if (S.tapNas) {
          const dn = S.tapNasRovnaka && koberecNas() ? koberecNas() : { motiv: S.tapNasMotiv, nit: S.tapNasNit };
          r.push(sCenou(fill(tk.tapacir.zhrnutie_nasivka, { x: motivTxt(dn) }), plus(po.nasivka_dvere.suma)));
        }
        return r.length > 1 ? r : r[0];
      }
    }
    return "";
  }
  const vyHtml = (vy) => (Array.isArray(vy) ? vy.map((x) => '<span class="k-krok__vr">' + esc(x) + "</span>").join("") : esc(vy));

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
        '<span class="k-krok__nm">' + esc(t.nazov) + (done && !open ? '<span class="k-sr">' + esc(U0.krok_hotove) + "</span>" : "") + '</span><span class="k-krok__vy">' + vyHtml(vy) + "</span></span>" +
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
    let html = '<div class="k-skupina"><span class="k-stitok" id="' + P + 'lbl-typ">' + esc(t.prepinac.popis) + '</span><div class="k-segment" role="group" aria-labelledby="' + P + 'lbl-typ">' +
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
    // číslo ostane pri slove („7 modelov“ sa nerozdelí na konci riadka); telefón celý drží CSS (white-space: nowrap)
    html += '<p class="k-pozn">' + esc(t.poznamka).replace(/(\d) /g, "$1 ") + "<br>" + nie + "</p>";
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

  // ------------------------------------------------------------------ kroky 5 a 6 — otázky po jednej (Michal 18. 10. 2026 večer)
  // Krok 5: „Prosím, vyberte si, kam chcete nášivky“ — 4 výlučné voľby v poradí pod sedadlá šoféra a spolujazdca —
  // stredový koberec — ★ všetky tri — „Nie, ďakujem“ (zvolená je zelená LEN jedna), ceny v riadkoch ako rohož a box do
  // kufra (kufor-boxy.js riadky(), cenyRiadky). Potom podotázky v kartách, vždy otvorená LEN jedna: motív + niť + veľký náhľad +
  // „Pokračovať“, stredový koberec „rovnaká / iná“. Zodpovedaná sa zatvorí do riadka „✓ … — Zmeniť“. Krok 6 rovnako:
  // ponuka tapacíru → materiál, farba a lemovanie → nášivka na dvere → motív a niť. Do Shoptetu ide stále jeden zo
  // 4 stavov S.nas a tie isté polia S (košík a ceny bez zmeny); ktorá podotázka je otvorená, drží len UI stav U
  // (U.n5, U.n6 = zodpovedané / potvrdené, U.znova = znova otvorené cez „Zmeniť“).
  const jeBoky = () => S.nas === "boky" || S.nas === "boky+stred";
  const jeStred = () => S.nas === "stred" || S.nas === "boky+stred";
  /** Miesta na fotke kabíny (FOTKA_KABINY 4:3, % šírky / výšky; data.js FOTKA_KABINY_NASIVKY). */
  const BOD = {
    sofer: { x: "33.8%", y: "59%", d: "11.5%", tr: " kn-bod--hore" },
    spolujazdec: { x: "73.6%", y: "59%", d: "11.5%", tr: " kn-bod--hore kn-bod--r" },
    stred: { x: "53.1%", y: "80.7%", d: "16%", tr: "" },
  };
  /** Malé vzorky v karte „Vlastná kombinácia“ (tapacír): materiál + kód farby. */
  const MOZAIKA_MAT = [["presivana", "11"], ["tonovana", "11PES"], ["jednofarebna", "1G"], ["mikro-jedno", "5NUB"]];
  /** Lemovania na ukážku v karte „Vlastná kombinácia“: prvé dve, ktoré nie sú lemovanie kobercov. */
  const LEM_UKAZKA = ["05", "09", "01", "11"];
  /** Pole z chyba() -> blok (podotázka) kroku, v ktorom je. */
  const BLOK_POLA = {
    nasivky: { nas: "kam", bokyMotiv: "boky", bokyNit: "boky", bokyDalej: "boky", stredVolba: "stred", stredMotiv: "stred", stredNit: "stred", stredDalej: "stred" },
    tapacir: { tap: "ponuka", tapRovn: "mat", tapMat: "mat", tapFarba: "mat", tapLem: "mat", tapMatDalej: "mat", tapNas: "nas", tapNasVolba: "dvere", dvereMotiv: "dvere", dvereNit: "dvere", dvereDalej: "dvere" },
  };
  /** Pole „Pokračovať“ v karte -> hodnota akcie potvrd (aj lišta „Pokračovať“ na telefóne). */
  const POTVRD_POLA = { bokyDalej: "boky", stredDalej: "stred", tapMatDalej: "tapMat", dvereDalej: "dvere" };
  function blokyKroku(id) {
    if (id === "nasivky") return ["kam"].concat(jeBoky() ? ["boky"] : [], jeStred() ? ["stred"] : []);
    return ["ponuka"].concat(S.tap === "ano" ? ["mat", "nas"] : [], S.tap === "ano" && S.tapNas === true ? ["dvere"] : []);
  }
  /** Otvorený blok kroku 5 / 6: znova otvorený cez „Zmeniť“, inak prvý nezodpovedaný (chyba()); null = všetko hotové. */
  function otvorenyBlok(id) {
    if (id !== "nasivky" && id !== "tapacir") return null;
    const bl = blokyKroku(id), ch = chyba(id);
    const zCh = ch ? BLOK_POLA[id][ch.pole] || null : null;
    const zn = U.znova[id];
    if (zn && bl.indexOf(zn) >= 0 && (!zCh || bl.indexOf(zn) <= bl.indexOf(zCh))) return zn;
    return zCh;
  }
  /** V bloku je otázka „rovnaké / iné“ (nie podrobnosti voľby „iné“). */
  const otazkaStred = () => S.nas === "boky+stred" && (U.znova.nasivky === "stred" || !U.n5.stredOdp);
  const otazkaMat = () => U.znova.tapacir === "mat" || !U.n6.matOdp;
  const otazkaDvere = () => !!koberecNas() && (U.znova.tapacir === "dvere" || !U.n6.nasOdp);
  /** Kľúč zobrazenia (blok + otázka / podrobnosti): keď sa po akcii zmení, posunie sa na novo otvorenú podotázku. */
  function kluc(id) {
    const b = otvorenyBlok(id);
    return String(b) + (b === "stred" ? (otazkaStred() ? "q" : "x") : b === "mat" ? (otazkaMat() ? "q" : "x") : b === "dvere" ? (otazkaDvere() ? "q" : "x") : "");
  }

  /** Ceny v riadkoch ako rohož a box do kufra (kufor-boxy.js riadky(); Michal 18. 10. 2026 v noci): „Samostatne 70 €“ /
   *  „Výhoda v sete − 11 €“ (zelená, tučná) / čiara / „V SETE + 59 €“. Samostatne a Výhoda sa ukážu len spolu a len pri vyššej
   *  samostatnej cene; posledný riadok je vždy „V sete“ (nášivky aj tapacír sa kupujú so setom kobercov). Bez veľkej ceny,
   *  prečiarknutej ceny a pilulky „Ušetríte“. suma = text posledného riadku („+ 59 €“ príplatok, „119 €“ tapacír);
   *  p = ponuka() — suma, povodna, usetrite. */
  function cenyRiadky(suma, p) {
    const r = (m, nm, h) => '<span class="k-ucet__r k-ucet__r--' + m + '"><span class="k-ucet__rn">' + esc(nm) + '</span><span class="k-ucet__rh">' + esc(h) + "</span></span>";
    const viac = !!(p && p.povodna != null && p.povodna > p.suma);
    return '<span class="k-ucet">' + (viac ? r("samo", U0.cenovka_samostatne, eur(p.povodna)) + r("zl", U0.cenovka_vyhoda, "−" + NB + eur(p.usetrite)) : "") +
      r("sum", U0.cenovka_v_sete, suma) + "</span>";
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
    const sc = T.kroky.nasivky.schema, mm = sc.miesta;
    const ln = tmava ? "#8a826a" : "#b5ab8f", bg = tmava ? "rgba(255,255,255,.04)" : "#fff", mat = tmava ? "rgba(255,255,255,.07)" : "#efebe0";
    const sed = tmava ? "rgba(255,255,255,.1)" : "#ddd6c4";
    const kob = (x, y, w2, h, on) => '<rect x="' + x + '" y="' + y + '" width="' + w2 + '" height="' + h + '" rx="4" fill="' + (on ? "rgba(230,200,119,.28)" : mat) + '" stroke="' + (on ? "#c49b31" : ln) + '" stroke-width="' + (on ? 1.6 : 1) + '"/>';
    const bod = (cx, cy, r, on) => (on
      ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 3) + '" fill="rgba(230,200,119,.35)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e6c877" stroke="#8f7020" stroke-width="1"/>'
      : '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + ln + '" stroke-width="1" stroke-dasharray="2 2"/>');
    const popis = [sel.s ? mm.sofer : "", sel.p ? mm.spolujazdec : "", sel.c ? mm.stred : ""].filter(Boolean).join(", ") || mm.nic;
    return '<svg class="kn-schema" viewBox="0 0 100 92" role="img" aria-label="' + attr(fill(sc.aria, { x: popis })) + '">' +
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
  /** Farby nite (3B, Michal 22. 10. 2026): paleta všetkých 11 farieb, 4 v rade — krúžok vo farbe nite, pod ním meno a kód
   *  (bez „Ďalšie farby“). Nášivky na koberce aj nášivka na dvere. */
  function cipyNiti(prefix, vybrata) {
    return '<div class="nt" role="group" aria-label="' + attr(U0.nit_aria) + '">' + nite().map((n) => {
      const on = vybrata === n.kod;
      return '<button type="button" class="nt__b' + (on ? " is-on" : "") + '" data-a="nit" data-m="' + prefix + '" data-v="' + n.kod + '" data-f="nit:' + prefix + n.kod + '" aria-pressed="' + on + '">' +
        '<i style="background:' + n.hex + '" aria-hidden="true"></i><span class="nt__nm">' + esc(n.menoUi) + '</span><span class="nt__kod">' + n.kod + "</span></button>";
    }).join("") + "</div>";
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
  /** Dve rovnocenné dlaždice „rovnaké / iné“ (zjavná voľba namiesto skrytého odkazu či zaškrtávacieho políčka). */
  function rvDlazdica(akcia, v, on, viz, nm, poHtml) {
    return '<button type="button" class="kn-rv__b' + (on ? " is-on" : "") + '" data-a="' + akcia + '"' + (v != null ? ' data-v="' + v + '"' : "") +
      ' data-f="' + akcia + (v != null ? ":" + v : "") + '" aria-pressed="' + on + '"><span class="kn-rv__viz">' + viz + '<span class="kn-rv__r" aria-hidden="true"></span></span>' +
      '<span class="kn-rv__tx"><span class="kn-rv__nm">' + esc(nm) + '</span><span class="kn-rv__po">' + poHtml + "</span></span></button>";
  }
  /** Materiál cez celú plochu dlaždice — LEN materiál, lemovanie sa naň nikdy nekladie (Michal 22. 10. 2026). */
  const vizMaterial = (src) => '<span class="kn-rv__mat"' + (src ? ' style="background-image:url(' + attr(src) + ')"' : "") + "></span>";
  const mozaikaMotivov = (miesto) => '<span class="kn-rv__mozaika kn-rv__mozaika--motiv">' + motivy(miesto).slice(0, 2).map((m) => '<i style="background-image:url(' + attr(m.full) + ')"></i>').join("") + "</span>";
  const popisTx = (x) => "<span>" + esc(x) + "</span>";
  const farbaTx = (f) => mala(f.meno) + " (" + f.kod + ")";
  const lemMeno = (l) => l.menoUi.toLowerCase() + " (" + l.kod + ")";
  const lemTx = (l) => fill(U0.suhrn_lemovanie, { x: lemMeno(l) });
  /** Druh materiálu pod variantom: mikrosemiš / velúr / syntetická koža (koza = kratšie „koža“ v lište). */
  const druhMat = (v, koza) => (v.nazov === "Mikrosemiš" ? U0.mikrosemis : v.nazov === "Velúr" ? U0.velur : koza ? U0.koza : U0.syntetika);
  /** „Prešívaná syntetická koža“, „Jednofarebný mikrosemiš“, „Vzorovaný velúr“ — variant + druh materiálu (ako dlaždice materiálu tapacíru). */
  function matMeno(nazov) {
    const v = matT(nazov);
    return v ? v.variant.charAt(0).toUpperCase() + v.variant.slice(1) + " " + druhMat(v) : nazov;
  }

  // Krok 6 — otázka „materiál, farba a lemovanie tapacíru“ (Michal 22. 10. 2026): čiernobiela fotka výplne dverí (len kde
  // tapacír je, nie jeho farba), pod ňou dve karty — „Rovnaké ako koberce“ (materiál a lemovanie kobercov) a „Vlastná
  // kombinácia“ (malé vzorky). PRAVIDLO: fotka materiálu a fotka lemovania sa NIKDY neprekrývajú (žiadny pás lemovania cez
  // materiál, žiadny rám) — vždy dve samostatné fotky vedľa seba alebo pod sebou, každá s popisom.
  /** Výrez fotky dverí na tapacír (zdroj x 290–1105, y 200–700) v odtieňoch sivej + „Ilustračná fotka“; bez čísel a štítkov. */
  function fotkaTapaciru(t) {
    return '<div class="kn-tvfoto"><img src="' + attr(FOTKA_DVERI) + '" alt="' + attr(t.rovnake.foto_alt) + '" width="1536" height="1024" loading="lazy" decoding="async">' +
      '<span class="kn-ilu kn-ilu--dole">' + esc(t.ilustracna) + "</span></div>";
  }
  /** Karta voľby (celá je tlačidlo): krúžok 28 px vpravo hore, názov, popis, obsah. */
  function tvKarta(akcia, on, nm, po, obsah) {
    return '<button type="button" class="kn-tv__b' + (on ? " is-on" : "") + '" data-a="' + akcia + '" data-f="' + akcia + '" aria-pressed="' + on + '">' +
      '<span class="kn-tv__r" aria-hidden="true"></span><span class="kn-tv__nm">' + esc(nm) + '</span><span class="kn-tv__po">' + esc(po) + "</span>" + obsah + "</button>";
  }
  /** „Rovnaké ako koberce“: dve samostatné dlaždice Materiál | Lemovanie z výberu kobercov (živé dáta krokov 2–4). */
  function tvRovnake(r, on) {
    const fk = S.material && S.farba ? farba(S.material, S.farba) : null, lk = S.lem ? lem(S.lem) : null;
    const src = fk ? fk.full : S.material && matD(S.material) ? matD(S.material).karta_obrazok : "";
    const dl = (stitok, viz, nm, po) => '<span class="kn-tv__d"><span class="kn-tv__st">' + esc(stitok) + "</span>" + viz +
      '<span class="kn-tv__dn">' + esc(nm) + '</span><span class="kn-tv__dp">' + esc(po) + "</span></span>";
    return tvKarta("tapRovnake", on, r.ano, r.ano_popis, '<span class="kn-tv__dl">' +
      dl(r.stitok_material, src ? '<img class="kn-tv__foto" src="' + attr(src) + '" alt="" loading="lazy" decoding="async">' : '<span class="kn-tv__foto"></span>',
        S.material ? matMeno(S.material) : r.nevybrate, fk ? farbaTx(fk) : "") +
      dl(r.stitok_lemovanie, '<span class="kn-tv__pas">' + (lk ? '<img src="' + attr(lk.full) + '" alt="" loading="lazy" decoding="async">' : "") + "</span>",
        lk ? lemMeno(lk) : r.nevybrate, r.lem_popis) + "</span>");
  }
  /** „Vlastná kombinácia“: 4 malé vzorky materiálu | čiara | 2 pásy lemovania pod sebou (iné ako na kobercoch). */
  function tvVlastna(r, on) {
    const mat = MOZAIKA_MAT.map((x) => {
      const m = MATERIALY.filter((y) => y.slug === x[0])[0];
      const f = m && (m.farby.filter((y) => y.kod === x[1])[0] || m.farby[0]);
      return f ? '<img class="kn-tv__mt" src="' + attr(f.swatch) + '" alt="" width="34" height="34" loading="lazy" decoding="async">' : "";
    }).join("");
    const lm = LEM_UKAZKA.filter((k) => k !== S.lem).slice(0, 2).map((k) => lem(k)).filter(Boolean)
      .map((l) => '<img class="kn-tv__lt" src="' + attr(l.swatch) + '" alt="" width="56" height="16" loading="lazy" decoding="async">').join("");
    return tvKarta("tapZmenit", on, r.inak, r.inak_popis, '<span class="kn-tv__mini" aria-hidden="true"><span class="kn-tv__mm">' + mat +
      '</span><span class="kn-tv__del"></span><span class="kn-tv__ml">' + lm + "</span></span>");
  }
  /** „Vybraté pre tapacír“ (tmavý box pri vlastnej kombinácii): materiál a lemovanie ako dve samostatné fotky vedľa seba,
   *  každá so štítkom (predtým pás lemovania cez fotku materiálu). */
  function vzorkyVz(matSrc, lemSrc, r) {
    return '<span class="kn-vz__obr"><span class="kn-vz__o"><span class="kn-vz__st">' + esc(r.stitok_material) + '</span><span class="kn-vz__mat">' +
      (matSrc ? '<img src="' + attr(matSrc) + '" alt="" loading="lazy" decoding="async">' : "") + '</span></span><span class="kn-vz__o"><span class="kn-vz__st">' +
      esc(r.stitok_lemovanie) + '</span><span class="kn-vz__lem">' + (lemSrc ? '<img src="' + attr(lemSrc) + '" alt="" loading="lazy" decoding="async">' : "") + "</span></span></span>";
  }
  /** Výhody v rámiku ponuky (krok 6): krátke riadky so zelenou ✓ namiesto dlhej vety (Michal 22. 10. 2026). */
  const benefity = (zoz) => '<ul class="kn-ponuka__ben">' + zoz.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  /** Fotka tapacíru v ponuke (data.js FOTKY_DVERI): jedna = celá fotka 3:2 ako doteraz; 2 a viac = prelínanie (opacity
   *  .7 s), bodky pod fotkou, autoplay 3 s (nastavGaleriu). Štítok „Tapacír dverí“ len na prvej fotke. galI = zobrazená. */
  function fotkyDveri(t) {
    const stitok = '<span class="kn-stitok" style="--x:43%;--y:21%">' + esc(t.foto_stitok) + "</span>", ilu = '<span class="kn-ilu kn-ilu--dole">' + esc(t.ilustracna) + "</span>";
    const img = (f, alt) => '<img src="' + attr(OBRAZKY_1V + f) + '" alt="' + attr(alt) + '" width="1536" height="1024" loading="lazy" decoding="async">';
    if (FOTKY_DVERI.length < 2) return '<div class="kn-dvere">' + img(FOTKY_DVERI[0] || FOTKA_DVERI_SUBOR, t.foto_alt) + stitok + ilu + "</div>";
    if (galI >= FOTKY_DVERI.length) galI = 0;
    return '<div class="kn-gal" data-gal><div class="kn-dvere kn-dvere--gal">' + FOTKY_DVERI.map((f, i) =>
      '<span class="kn-gal__s' + (i === galI ? " is-on" : "") + '"' + (i === galI ? "" : ' aria-hidden="true"') + ">" + img(f, i ? t.foto_alt_dalsia : t.foto_alt) + (i ? "" : stitok) + "</span>").join("") + ilu +
      '</div><div class="kn-gal__bodky" role="group" aria-label="' + attr(t.fotky_aria) + '">' + FOTKY_DVERI.map((f, i) =>
      '<button type="button" class="kn-gal__b' + (i === galI ? " is-on" : "") + '" data-a="foto" data-v="' + i + '" data-f="foto:' + i + '" aria-pressed="' + (i === galI) + '" aria-label="' +
        attr(fill(t.fotka_aria, { n: i + 1 })) + '"></button>').join("") + "</div></div>";
  }

  /** Čiastková otázka „Prosím, vyberte si …“ veľkým písmom + obsah; červený rám pri chybe poľa (ako sk). */
  function skOt(id, pole, otazka, obsah) {
    const msg = chybaSk(id, pole);
    return '<div class="k-sk' + (msg ? " is-chyba" : "") + '" data-pole="' + pole + '"><p class="kn-ot" id="' + P + "ot-" + pole + '">' + esc(otazka) + "</p>" +
      obsah + '<p class="k-sk__chyba">' + esc(msg) + "</p></div>";
  }
  /** Zelené „Pokračovať“ na konci karty — zatvorí podotázku (akcia potvrd). */
  function potvrdTl(id, pole, v) {
    const msg = chybaSk(id, pole);
    return '<div class="k-sk kn-potvrd' + (msg ? " is-chyba" : "") + '" data-pole="' + pole + '"><button type="button" class="k-btn-zelene" data-a="potvrd" data-v="' + v + '" data-f="potvrd:' + v + '">' +
      esc(T.kroky.tlacidla.pokracovat) + '</button><p class="k-sk__chyba">' + esc(msg) + "</p></div>";
  }
  /** Zodpovedaná podotázka: „✓ <b>nadpis</b> hodnota — Zmeniť“ (vnutri = riadok voľby „iné“ v otvorenej karte).
   *  Hodnota „· + 95 €“ sa pripojí nezalomiteľnou medzerou (na telefóne nový riadok nezačne bodkou a cenou). */
  function riadokHot(zmenit, nadpis, hodnota, vnutri) {
    return '<div class="kn-hot' + (vnutri ? " kn-hot--vnutri" : "") + '" data-hot="' + zmenit + '"><span class="kn-hot__ic" aria-hidden="true"></span><span class="kn-hot__tx"><b>' + esc(nadpis) + "</b>" +
      (hodnota ? (/^·/.test(hodnota) ? NB : " ") + esc(hodnota) : "") + '</span><button type="button" class="kn-hot__zm" data-a="zmenit" data-v="' + zmenit + '" data-f="zmenit:' + zmenit + (vnutri ? ":v" : "") +
      '" aria-label="' + attr(fill(U0.zmenit_aria, { x: String(nadpis).replace(/:$/, "") })) + '">' + esc(T.kroky.tlacidla.zmenit) + "</button></div>";
  }
  const karta = (blok, nadpis, obsah) => '<div class="kn-karta" data-blok="' + blok + '" tabindex="-1"><p class="kn-karta__ey">' + esc(nadpis) + "</p>" + obsah + "</div>";
  /** Zodpovedané riadky, otvorený blok (len jeden), za ním nič; „Pokračujte“ až keď je všetko zodpovedané — aj pod
   *  otázkou znova otvorenou cez „Zmeniť“ (revízia 18. 10. 2026 večer: inak hotový krok ostal bez tlačidla). */
  function telo56(id, posledny, blok, riadok) {
    const otv = otvorenyBlok(id), bl = blokyKroku(id);
    let html = "";
    for (let i = 0; i < bl.length; i++) {
      if (bl[i] === otv) { html += blok(otv); break; }
      html += riadok(bl[i]);
    }
    return html + koniecKroku(id, posledny, !hotovy(id));
  }
  const teloNasivky = (posledny) => telo56("nasivky", posledny, blokNasivky, riadokNasivky);
  const teloTapacir = (posledny) => telo56("tapacir", posledny, blokTapacir, riadokTapacir);

  function blokNasivky(b) {
    const t = T.kroky.nasivky, V = t.volby, pon = ponuka().nasivky;
    const fk = S.material && S.farba ? farba(S.material, S.farba) : null;
    const bg = fk ? fk.full : "", podklad = fk ? fill(t.podklad, { x: farbaTx(fk) }) : "";
    if (b === "kam") {
      const nie = S.nas === "nechcem";
      const dl = (id, cls, foto, pas) => {
        const on = S.nas === id;
        return '<button type="button" class="kn-dv__b' + cls + (on ? " is-on" : "") + '" data-a="nas" data-v="' + id + '" data-f="nas:' + id + '" aria-pressed="' + on + '">' + pas + foto +
          '<span class="kn-dv__tx"><span class="kn-rad" aria-hidden="true"></span><span class="kn-dv__txt"><span class="kn-dv__nm">' + esc(V[id].text) + '</span><span class="kn-dv__po">' + esc(V[id].popis) + "</span>" +
          cenyRiadky(plus(pon[id].suma), pon[id]) + "</span></span></button>";
      };
      // poradie podľa Michala (18. 10. 2026 večer): pod sedadlá — stredový koberec — ★ všetky tri — Nie, ďakujem
      const d1 = dl("boky", "", fotkaKabiny("--z:1.75;--fx:.537;--fy:.5", ["sofer", "spolujazdec"], V.boky.alt), "");
      const d2 = dl("stred", "", fotkaKabiny("--z:2.5;--fx:.531;--fy:.8", ["stred"], V.stred.alt), "");
      const d3 = dl("boky+stred", " kn-dv__b--bal", fotkaKabiny("--z:1.4;--fx:.537;--fy:.64", ["sofer", "spolujazdec", "stred"], V["boky+stred"].alt, true),
        '<span class="kn-dv__top">' + esc(V["boky+stred"].stitok) + "</span>");
      const tlNie = '<button type="button" class="k-btn-zlate kn-nie' + (nie ? " is-on" : S.nas ? " je-druha" : "") + '" data-a="nas" data-v="nechcem" data-f="nas:nechcem" aria-pressed="' + nie + '">' +
        (nie ? "✓ " : "") + esc(V.nechcem.text) + "<small>" + esc(V.nechcem.popis) + "</small></button>";
      return '<div class="kn-blok" data-blok="kam" tabindex="-1"><p class="k-pod">' + esc(t.pomocna_veta[0]) + "<b>" + esc(t.pomocna_veta[1]) + "</b>" + esc(t.pomocna_veta[2]) + "</p>" +
        skOt("nasivky", "nas", t.kam, '<div class="kn-dv" role="group" aria-labelledby="' + P + 'ot-nas">' + d1 + d2 + d3 + "</div>" + tlNie) + "</div>";
    }
    if (b === "boky") {
      const vsetky = S.nas === "boky+stred" && U.n5.stredOdp && S.stredRovnaky;
      return karta("boky", t.karta.boky,
        skOt("nasivky", "bokyMotiv", t.otazky.motiv, dlazdiceMotivov("boky", S.nasBoky.motiv, "boky")) +
        skOt("nasivky", "bokyNit", t.otazky.nit, cipyNiti("boky", S.nasBoky.nit)) +
        nahladVelky(S.nasBoky, bg, t.kam_pride[vsetky ? "boky+stred" : "boky"], podklad, schemaKabiny({ s: true, p: true, c: vsetky }, true)) +
        potvrdTl("nasivky", "bokyDalej", "boky"));
    }
    // stredový koberec: pri všetkých troch najprv „rovnaká / iná“, pri samotnom strede rovno motív a niť
    const sr = t.stred_rovnaky;
    if (otazkaStred()) {
      const kb = S.nasBoky.motiv && S.nasBoky.nit ? S.nasBoky : null, odp = U.n5.stredOdp;
      return karta("stred", t.karta.stred, skOt("nasivky", "stredVolba", t.otazky.stred, '<div class="kn-rv" role="group" aria-labelledby="' + P + 'ot-stredVolba">' +
        rvDlazdica("stredRovnaky", "1", odp && S.stredRovnaky, kb ? platno("kn-rv__cv", kb, bg, ".92", 600, 400) : vizMaterial(bg), sr.ano, popisTx(kb ? motivTxt(kb) : sr.ano_bez_vyberu)) +
        rvDlazdica("stredRovnaky", "0", odp && !S.stredRovnaky, mozaikaMotivov("stred"), sr.inak, popisTx(sr.inak_popis)) + "</div>"));
    }
    const bal = S.nas === "boky+stred";
    return karta("stred", bal ? t.karta.stred : t.karta.stred_len, (bal ? riadokHot("stred", sr.inak, "", true) : "") +
      skOt("nasivky", "stredMotiv", t.otazky.motiv, dlazdiceMotivov("stred", S.nasStred.motiv, "stred")) +
      skOt("nasivky", "stredNit", t.otazky.nit, cipyNiti("stred", S.nasStred.nit)) +
      nahladVelky(S.nasStred, bg, t.kam_pride.stred, podklad, schemaKabiny({ s: false, p: false, c: true }, true)) +
      potvrdTl("nasivky", "stredDalej", "stred"));
  }
  function riadokNasivky(b) {
    const t = T.kroky.nasivky, h = t.hotove;
    if (b === "kam") {
      if (S.nas === "nechcem") return riadokHot("kam", t.zhrnutie_nie, "·" + NB + h.bez_priplatku);
      const p = ponuka().nasivky[S.nas];
      return riadokHot("kam", t.volby[S.nas].text, p && p.suma ? "·" + NB + plus(p.suma) : "");
    }
    if (b === "boky") return riadokHot("boky", h.boky, motivTxt(S.nasBoky));
    if (S.nas === "boky+stred" && S.stredRovnaky) return riadokHot("stred", h.stred, fill(h.stred_rovnaka, { x: motivTxt(S.nasBoky) }));
    return riadokHot("stred", h.stred, motivTxt(S.nasStred));
  }

  function blokTapacir(b) {
    const t = T.kroky.tapacir, po = ponuka(), oz = t.otazky;
    if (b === "ponuka") {
      const a = t.volby.ano, on = S.tap === "ano", off = S.tap === "nie", pt = po.tapacir;
      // fotka celých dverí 3:2 bez orezania (pri 2+ fotkách prelínanie s bodkami), ponuka v rámiku s ✓ výhodami a cenami
      // v riadkoch, zelené Áno, zlaté Nie
      return '<div class="kn-blok" data-blok="ponuka" tabindex="-1"><p class="k-pod">' + esc(t.vysvetlivka) + "</p>" + fotkyDveri(t) +
        sk("tapacir", "tap", "", '<div class="kn-ponuka"><span class="kn-ponuka__nm">' + esc(t.nazov) + "</span>" + benefity(t.benefity) +
          cenyRiadky(eur(pt.suma), pt) +
          '<button type="button" class="k-btn-zelene' + (on ? " is-on" : off ? " je-druha" : "") + '" data-a="tap" data-v="ano" data-f="tap:ano" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(a.text) + "</button></div>" +
          '<button type="button" class="k-btn-zlate' + (off ? " is-on" : on ? " je-druha" : "") + '" data-a="tap" data-v="nie" data-f="tap:nie" aria-pressed="' + off + '">' + (off ? "✓ " : "") + esc(t.volby.nie.text) + "</button>" +
          (off ? '<p class="k-pozn">' + esc(t.volby.nie.pozn) + "</p>" : "")) + "</div>";
    }
    if (b === "mat") {
      const r = t.rovnake, vl = t.vlastne;
      if (otazkaMat()) {
        // čiernobiela fotka výplne dverí, pod ňou dve karty pod sebou (materiál a lemovanie vždy ako samostatné fotky)
        const odp = U.n6.matOdp;
        return karta("mat", U0.tap_oddiel, skOt("tapacir", "tapRovn", oz.mat, fotkaTapaciru(t) + '<div class="kn-tv" role="group" aria-labelledby="' + P + 'ot-tapRovn">' +
          tvRovnake(r, odp && S.tapRovnaky) + tvVlastna(r, odp && !S.tapRovnaky) + "</div>"));
      }
      let html = riadokHot("mat", r.inak_hotove, "", true) + skOt("tapacir", "tapMat", oz.material, '<div class="k-dlazdice k-dlazdice--mat" role="group" aria-labelledby="' + P + 'ot-tapMat">' + MATERIALY.map((m, i) => {
        const v = matT(m.nazov), x = S.tapMat === m.nazov, fx = x && S.tapFarba ? farba(m.nazov, S.tapFarba) : null;
        return '<button type="button" class="k-dlazdica' + (x ? " is-on" : "") + '" data-a="tapMat" data-v="' + attr(m.nazov) + '" data-f="tapMat:' + i + '" aria-pressed="' + x + '">' +
          '<img class="k-dlazdica__img" src="' + attr(fx ? fx.full : m.karta_obrazok) + '" alt="" loading="lazy"><span class="k-dlazdica__nm">' + esc(v.variant) + "<small>" + esc(druhMat(v)) + "</small></span></button>";
      }).join("") + "</div>");
      if (S.tapMat) html += skOt("tapacir", "tapFarba", oz.farba, mriezkaFarieb(S.tapMat, S.tapFarba, "tapFarba", "tf:"));
      html += skOt("tapacir", "tapLem", oz.lemovanie, mriezkaLem(S.tapLem, "tapLem", "tl:", null));
      const tm = S.tapMat, tf = tm && S.tapFarba ? farba(tm, S.tapFarba) : null, tl = S.tapLem ? lem(S.tapLem) : null;
      html += '<div class="kn-vz">' + vzorkyVz(tf ? tf.full : tm ? matD(tm).karta_obrazok : "", tl ? tl.full : "", r) + "<p><b>" + esc(vl.vybrate) + "</b>" +
        esc(tm ? matKratko(tm) : vl.bez_materialu) + "<br>" + esc(tf ? fill(vl.farba_x, { x: farbaTx(tf) }) : vl.bez_farby) + "<br>" + esc(tl ? lemTx(tl) : vl.bez_lemovania) + "</p></div>";
      return karta("mat", U0.tap_oddiel, html + potvrdTl("tapacir", "tapMatDalej", "tapMat"));
    }
    const nd = t.nasivka_dvere;
    if (b === "nas") {
      // kde presne (výrez dverí so zlatým krúžkom), otázka s cenami v riadkoch, zelené Áno / zlaté Nie
      const an = U.dvereInfo ? null : S.tapNas, pd = po.nasivka_dvere; // po strate vzoru otázka znova bez predvoľby
      return karta("nas", nd.nadpis, '<p class="k-pod">' + esc(nd.kde[0]) + "<b>" + esc(nd.kde[1]) + "</b>" + esc(nd.kde[2]) + "</p>" +
        '<div class="kn-dvere kn-dvere--vyrez"><span class="kn-foto kn-foto--169"><span class="kn-scena" style="--ar:3/2;--z:1.3;--fx:.433;--fy:.45"><img src="' + attr(FOTKA_DVERI) + '" alt="' + attr(nd.foto_alt) + '" loading="lazy" decoding="async">' +
        '<span class="kn-bod" style="--x:43.3%;--y:45%;--d:23%"><b>' + esc(nd.bod) + '</b></span></span><span class="kn-ilu">' + esc(t.ilustracna) + "</span></span></div>" +
        sk("tapacir", "tapNas", "", (U.dvereInfo ? '<p class="tp-info">' + esc(nd.zmena_info) + "</p>" : "") +
          '<div class="kn-ponuka kn-ponuka--nas"><span class="kn-ponuka__nm">' + esc(nd.otazka) + "</span>" + benefity(nd.benefity) + cenyRiadky(plus(pd.suma), pd) +
          '<div class="an' + (an != null ? " an--vybrate" : "") + '" role="group" aria-label="' + attr(nd.otazka) + '">' +
          '<button type="button" class="an__b an__b--ano' + (an === true ? " is-on" : "") + '" data-a="tapNas" data-v="ano" data-f="tapNas:ano" aria-pressed="' + (an === true) + '">' + (an === true ? "✓ " : "") + esc(nd.ano) + "<small>" + plus(pd.suma) + "</small></button>" +
          '<button type="button" class="an__b an__b--nie' + (an === false ? " is-on" : "") + '" data-a="tapNas" data-v="nie" data-f="tapNas:nie" aria-pressed="' + (an === false) + '">' + (an === false ? "✓ " : "") + esc(nd.nie) + "<small>" + esc(nd.bez_priplatku) + "</small></button></div></div>"));
    }
    // motív a niť nášivky na tapacíri: rovnaká ako na kobercoch / iná (bez nášivky na kobercoch rovno motív a niť)
    const kn = koberecNas(), tm = tapMaterial(), tk = tapFarbaKod();
    const ft = tm ? (tk && farba(tm, tk)) || null : null;
    const bgT = ft ? ft.full : tm ? matD(tm).karta_obrazok : "";
    const podT = tm ? fill(nd.podklad, { x: matKratko(tm) + (ft ? ", " + farbaTx(ft) : "") }) : "";
    // karta motívu má vlastný nadpis (nie ten istý ako zatvorená otázka Áno / Nie hneď nad ňou)
    if (otazkaDvere()) {
      const odp = U.n6.nasOdp;
      return karta("dvere", nd.nadpis_motiv, skOt("tapacir", "tapNasVolba", oz.nasivka, '<div class="kn-rv" role="group" aria-labelledby="' + P + 'ot-tapNasVolba">' +
        rvDlazdica("tapNasRovnaka", "1", odp && S.tapNasRovnaka, platno("kn-rv__cv", kn, bgT, ".92", 600, 400), nd.rovnaka, popisTx(motivTxt(kn))) +
        rvDlazdica("tapNasRovnaka", "0", odp && !S.tapNasRovnaka, mozaikaMotivov("dvere"), nd.ina, popisTx(nd.ina_popis)) + "</div>"));
    }
    return karta("dvere", nd.nadpis_motiv, (kn ? riadokHot("dvere", nd.ina, "", true) : '<p class="kn-info">' + esc(S.nas == null ? nd.bez_kobercov_nevybrate : nd.bez_kobercov) + "</p>") +
      skOt("tapacir", "dvereMotiv", oz.motiv, dlazdiceMotivov("dvere", S.tapNasMotiv, "dvere")) +
      skOt("tapacir", "dvereNit", oz.nit, cipyNiti("dvere", S.tapNasNit)) +
      nahladVelky({ motiv: S.tapNasMotiv, nit: S.tapNasNit }, bgT, nd.kam_pride, podT, schemaDvere()) +
      potvrdTl("tapacir", "dvereDalej", "dvere"));
  }
  function riadokTapacir(b) {
    const t = T.kroky.tapacir, h = t.hotove, po = ponuka();
    if (b === "ponuka") return riadokHot("ponuka", h.ponuka, S.tap === "ano" ? fill(h.ano, { x: eur(po.tapacir.suma) }) : h.nie);
    if (b === "mat") {
      if (S.tapRovnaky) return riadokHot("mat", h.mat, h.mat_rovnake);
      const f = S.tapMat && S.tapFarba ? farba(S.tapMat, S.tapFarba) : null, l = S.tapLem ? lem(S.tapLem) : null;
      return riadokHot("mat", h.mat, [S.tapMat ? matKratko(S.tapMat) : "", f ? fill(t.vlastne.farba_x, { x: farbaTx(f) }) : "", l ? lemTx(l) : ""].filter(Boolean).join(" · "));
    }
    if (b === "nas") return riadokHot("nas", h.nas, S.tapNas ? fill(h.ano, { x: plus(po.nasivka_dvere.suma) }) : h.nie);
    const kn = koberecNas();
    if (kn && S.tapNasRovnaka) return riadokHot("dvere", h.dvere, fill(h.dvere_rovnaka, { x: motivTxt(kn) }));
    return riadokHot("dvere", h.dvere, motivTxt({ motiv: S.tapNasMotiv, nit: S.tapNasNit }));
  }

  // ------------------------------------------------------------------ súhrn (6A, Michal 22. 10. 2026): bez karty a riadkov
  // „Súhrn objednávky“ — čo je vybraté a za koľko, ukazujú hlavičky krokov (zhrnutie); pod krokmi ostáva „Spolu“, čo ešte
  // chýba, úspora, tlačidlo košíka, fakty a odkaz pre dopravcov (ako .lcd1v-suhrn autokobercov)
  function renderSuhrn() {
    const c = cena(), ts = T.suhrn;
    const z = znacka(), dod = z ? z.typ === "dodavka" : S.typ === "dodavka";
    const chybaju = kroky().filter((k) => !hotovy(k)), hot = !chybaju.length;
    let html = '<div class="sh">';
    html += '<div class="k-suhrn"><span class="k-suhrn__lb">' + esc(ts.spolu) + (hot ? "" : esc(U0.suhrn_zatial)) + '</span><b class="k-suhrn__suma" aria-live="polite">' + eur(c.spolu) + "</b></div>";
    if (!hot) html += '<p class="sh__chyba-r">' + esc(fill(U0.suhrn_niet, { x: chybaju.map((k) => mala(T.kroky[k].nazov)).join(", ") })) + "</p>";
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
      mt ? druhMat(mt, true) + ", " + mt.variant : ""].filter(Boolean).join(" · ");
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

  // ------------------------------------------------------------------ fotky tapacíru (krok 6, len pri 2+ fotkách v FOTKY_DVERI)
  // Autoplay každé 3 s len kým je fotka v okne (IntersectionObserver) a zákazník nechce menej pohybu (prefers-reduced-motion
  // = bez autoplay, bodky fungujú). Každé render() časovač aj observer zruší a nastaví znova (krok zatvorený / prekreslený
  // = žiadny bežiaci interval); zrus() ich zruší tiež.
  const GAL_MS = 3000;
  let galI = 0, galCas = 0, galIo = null, galVidno = false;
  const menejPohybu = () => !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function galZastav() { if (galCas) { clearInterval(galCas); galCas = 0; } }
  function galZrus() { galZastav(); if (galIo) { galIo.disconnect(); galIo = null; } galVidno = false; }
  /** Zobrazí fotku i (dookola): prelínanie cez triedu is-on, bodky aria-pressed; bez prekreslenia kroku. */
  function galUkaz(i) {
    const g = root.querySelector("[data-gal]");
    if (!g) return;
    const s = g.querySelectorAll(".kn-gal__s"), b = g.querySelectorAll(".kn-gal__b"), n = s.length;
    if (!n) return;
    galI = ((i % n) + n) % n;
    Array.prototype.forEach.call(s, (x, j) => { x.classList.toggle("is-on", j === galI); if (j === galI) x.removeAttribute("aria-hidden"); else x.setAttribute("aria-hidden", "true"); });
    Array.prototype.forEach.call(b, (x, j) => { x.classList.toggle("is-on", j === galI); x.setAttribute("aria-pressed", String(j === galI)); });
  }
  function galSpusti() {
    galZastav();
    if (galVidno && !menejPohybu() && root.querySelector("[data-gal]")) galCas = setInterval(() => galUkaz(galI + 1), GAL_MS);
  }
  function nastavGaleriu() {
    galZrus();
    const g = root.querySelector("[data-gal]");
    if (!g) { galI = 0; return; }
    if (menejPohybu() || typeof w.IntersectionObserver !== "function") return;
    galIo = new w.IntersectionObserver((en) => { en.forEach((x) => { galVidno = x.isIntersecting; }); galSpusti(); }, { threshold: 0.3 });
    galIo.observe(g.querySelector(".kn-dvere"));
  }

  // ------------------------------------------------------------------ vykreslenie
  /* Fokus do zoznamu (select) vraciame len po klávesnici: iPhone pri fokuse zoznam otvorí, takže po výbere prstom
     sa značka / model / ročník o chvíľu otvorili znova (Michal 23. 10. 2026). Po klávesnici fokus ostane (Tab, šípky). */
  let klavesnica = false;
  const fokusDoZoznamu = (el) => !el || el.tagName !== "SELECT" || klavesnica;
  function render() {
    const ae = doc.activeElement;
    const f = ae && (root.contains(ae) || lst.contains(ae)) && fokusDoZoznamu(ae) ? ae.getAttribute("data-f") : null;
    renderKroky();
    nastavGaleriu();
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
  /** Všetko vybraté (Michal 24. 10. 2026): v okne celý prehľad — „Váš set v N krokoch“, riadky krokov, Spolu a „Pridať
   *  do košíka“ (predtým len súhrn navrchu a kroky nad oknom). Keď sa nevojde, tlačidlo košíka ostane celé pri spodku okna. */
  function posunNaPrehlad() {
    const p = $('[data-k="postup"]'), kb = $('[data-k="suhrn"] .k-kosik');
    if (!p || !kb || !p.getBoundingClientRect().height) { posun($('[data-k="suhrn"]')); return; }
    const k = root.querySelector(".k-krok");
    const hore = (k ? parseFloat(w.getComputedStyle(k).scrollMarginTop) || 0 : 0) + 12, dole = 16;
    const rp = p.getBoundingClientRect(), rb = kb.getBoundingClientRect();
    let ciel = w.pageYOffset + rp.top - hore;
    const navyse = rb.bottom - rp.top - (w.innerHeight - hore - dole);
    if (navyse > 0) ciel += navyse;
    try { w.scrollTo({ top: Math.max(0, ciel), behavior: menejPohybu() ? "auto" : "smooth" }); } catch (e) { w.scrollTo(0, Math.max(0, ciel)); }
  }
  function posunKrok(id, fokus) {
    const el = root.querySelector('[data-krok="' + id + '"]');
    posun(el);
    if (fokus && el) { const h = el.querySelector(".k-krok__hd"); try { h.focus({ preventScroll: true }); } catch (e) { /* */ } }
  }
  /** Po zatvorení podotázky: plynulo na novo otvorenú kartu (fokus na ňu), inak na „Pokračujte“ kroku. */
  function posunNaBlok(id) {
    const k = root.querySelector('[data-krok="' + id + '"]');
    if (!k) return;
    const b = otvorenyBlok(id);
    const el = (b && k.querySelector('[data-blok="' + b + '"]')) || k.querySelector('[data-a="dalej"]');
    if (!el) return;
    posun(el, b ? "start" : "center");
    try { el.focus({ preventScroll: true }); } catch (e) { /* */ }
  }
  function posunPole(id, pole) {
    const el = root.querySelector('[data-krok="' + id + '"] [data-pole="' + pole + '"]') || root.querySelector('[data-krok="' + id + '"]');
    posun(el, "center");
    const ctl = el && el.querySelector("select:not([disabled]), button, input");
    if (ctl && fokusDoZoznamu(ctl)) try { ctl.focus({ preventScroll: true }); } catch (e) { /* */ }
  }

  // ------------------------------------------------------------------ navigácia krokov (artefakt ř. 937–979)
  function prvyNehotovyPred(id) {
    const ks = kroky(), i = ks.indexOf(id);
    for (let j = 0; j < i; j++) if (!hotovy(ks[j])) return ks[j];
    return null;
  }
  /** Otázky znova otvorené cez „Zmeniť“ platia len kým je krok otvorený: zatvorenie hlavičky alebo iný krok ich zavrie
   *  (revízia 18. 10. 2026 večer — po návrate bol krok bez riadkov ✓ a bez „Pokračujte“). */
  const zavriZnova = () => { U.znova.nasivky = null; U.znova.tapacir = null; };
  function otvorKrok(id) {
    if (kroky().indexOf(id) < 0) id = "vozidlo"; // neznámy krok (napr. tapacír pri dodávke) -> prvý
    zavriZnova();
    const pred = prvyNehotovyPred(id);
    if (pred) { U.chyby[pred] = chyba(pred); U.znova[pred] = null; U.zablesk = pred; U.otvoreny = pred; render(); posunPole(pred, U.chyby[pred].pole); return; }
    U.otvoreny = id; render(); posunKrok(id, true);
  }
  function klikHlavicka(id) {
    if (U.otvoreny === id) { U.otvoreny = null; zavriZnova(); render(); return; }
    otvorKrok(id);
  }
  function pokracuj(id) {
    const ch = chyba(id);
    if (ch) { U.chyby[id] = ch; U.znova[id] = null; U.zablesk = id; render(); posunPole(id, ch.pole); return; }
    delete U.chyby[id];
    if (U.znova[id]) U.znova[id] = null;
    const ks = kroky(), i = ks.indexOf(id);
    let dalsi = null, j;
    for (j = i + 1; j < ks.length; j++) if (!hotovy(ks[j])) { dalsi = ks[j]; break; }
    if (!dalsi) for (j = 0; j < i; j++) if (!hotovy(ks[j])) { dalsi = ks[j]; break; }
    U.otvoreny = dalsi; render();
    if (dalsi && U.chyby[dalsi]) posunPole(dalsi, U.chyby[dalsi].pole);
    else if (dalsi) posunKrok(dalsi, true);
    else { posunNaPrehlad(); const kb = $('[data-k="suhrn"] .k-kosik'); if (kb) try { kb.focus({ preventScroll: true }); } catch (e) { /* */ } }
  }
  /** „Pridať do košíka“: prvý nevyplnený krok sa otvorí s červeným rámom, inak odovzdá výber (index.js doKosika). */
  function kosik() {
    if (U.odosiela) return false; // výber už odišiel do košíka, čaká sa na Shoptet (N4)
    const ks = kroky();
    let prvy = null;
    ks.forEach((k) => { if (!hotovy(k)) { U.chyby[k] = chyba(k); if (U.znova[k]) U.znova[k] = null; if (!prvy) prvy = k; } });
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
    if (x && !hotovy(x)) {
      /* otázka znova otvorená cez „Zmeniť“ zakrýva nezodpovedanú podotázku -> lišta ju zavrie a posunie na tú podotázku */
      if (U.znova[x]) { U.znova[x] = null; render(); posunNaBlok(x); return; }
      /* v karte kroku 5 / 6 čaká len „Pokračovať“ -> lišta „Pokračovať“ urobí to isté */
      const ch = chyba(x), pv = POTVRD_POLA[ch.pole];
      if (pv && otvorenyBlok(x) === BLOK_POLA[x][ch.pole]) { const k0 = kluc(x); potvrd(pv); if (poOtazke(x, true)) return; if (kluc(x) !== k0) posunNaBlok(x); return; }
      posunPole(x, ch.pole); return;
    }
    if (x && hotovy(x)) { pokracuj(x); return; }
    const p = kroky().filter((k) => !hotovy(k))[0];
    U.otvoreny = p; render(); posunKrok(p, true);
  }

  // ------------------------------------------------------------------ zmeny výberu (artefakt ř. 982–995)
  function zmena(fn) {
    const malNas = !!koberecNas();
    fn();
    if (!tapDostupny()) {
      S.tap = null; S.tapNas = null;
      U.n6 = { matOdp: false, mat: false, nasOdp: false, nas: false }; U.znova.tapacir = null; U.dvereInfo = false;
    }
    /* Nášivka na tapacír „ako na kobercoch“ stratila vzor -> otázka na dvere sa ukáže znova s vysvetlením. S.tapNas ostane
       (predtým null: select Shoptetu ostal na „Áno“ = cena Shoptetu o 49 € vyššia, console.error); krok 6 je neúplný,
       kým zákazník neodpovie Áno (potom motív a niť) alebo Nie — otázku otvára chyba() (pole tapNas), nie U.znova. */
    if (malNas && !koberecNas() && S.tap === "ano" && S.tapNas === true && S.tapNasRovnaka && U.n6.nasOdp) {
      U.dvereInfo = true; U.n6.nasOdp = false; U.n6.nas = false;
    }
    if (U.dvereInfo && koberecNas()) U.dvereInfo = false; // vzor je späť
    prepocitajChyby();
    render();
    o.naZmenu(S);
  }
  const resetVozidla = () => { S.znacka = null; S.model = null; S.polia = {}; };
  /** Pridanie nášiviek pod sedadlá k stredovému kobercu: prevezmú jeho motív a niť (vybraté sa nestratí). */
  function pridajBoky() {
    if (S.nas === "stred" && (S.nasStred.motiv || S.nasStred.nit)) { S.nasBoky = { motiv: S.nasStred.motiv, nit: S.nasStred.nit }; S.stredRovnaky = true; }
  }
  /** Odobratie nášiviek pod sedadlami: stredový koberec prevezme ich motív a niť, ak bol „rovnaký“, ak ešte nemá vlastný,
   *  alebo pri prechode z „pod sedadlá“ (zákazník práve videl ich motív a niť, nie starý výber stredu z histórie). */
  function odoberBoky() {
    if (!(S.nasBoky.motiv || S.nasBoky.nit)) return;
    const bokyCele = !!(S.nasBoky.motiv && S.nasBoky.nit), stredPrazdny = !S.nasStred.motiv && !S.nasStred.nit;
    if ((S.nas === "boky+stred" && S.stredRovnaky) || (S.nas === "boky" && (bokyCele || stredPrazdny))) S.nasStred = { motiv: S.nasBoky.motiv, nit: S.nasBoky.nit };
  }
  /** „Pokračovať“ v karte kroku 5 / 6: karta sa zatvorí, ak je v nej všetko vybraté; inak červený rám chýbajúceho poľa. */
  function potvrd(v) {
    const krok = v === "boky" || v === "stred" ? "nasivky" : "tapacir";
    const ok = v === "boky" ? S.nasBoky.motiv && S.nasBoky.nit : v === "stred" ? S.nasStred.motiv && S.nasStred.nit
      : v === "tapMat" ? S.tapMat && S.tapFarba && farba(S.tapMat, S.tapFarba) && S.tapLem : v === "dvere" ? S.tapNasMotiv && S.tapNasNit : false;
    if (!ok) {
      const ch = chyba(krok);
      if (ch) { U.chyby[krok] = ch; render(); posunPole(krok, ch.pole); }
      return;
    }
    if (v === "boky") U.n5.boky = true;
    else if (v === "stred") U.n5.stred = true;
    else if (v === "tapMat") U.n6.mat = true;
    else U.n6.nas = true;
    U.znova[krok] = null;
    prepocitajChyby();
    render();
  }
  /** „Zmeniť“ pri zodpovedanej podotázke: znova ju otvorí (výber ostane, kým zákazník nezvolí iné). */
  function zmenit(v) {
    if (v === "kam") U.znova.nasivky = "kam";
    else if (v === "boky") { U.n5.boky = false; U.znova.nasivky = null; }
    else if (v === "stred") { if (S.nas === "boky+stred") U.znova.nasivky = "stred"; else { U.n5.stred = false; U.znova.nasivky = null; } }
    else if (v === "ponuka" || v === "mat" || v === "nas") U.znova.tapacir = v;
    else if (v === "dvere") { if (koberecNas()) U.znova.tapacir = "dvere"; else { U.n6.nas = false; U.znova.tapacir = null; } }
    render();
  }
  /** Krok, ktorého podotázky akcia otvára / zatvára (posun na novo otvorenú kartu). */
  function krokAkcie(a, v) {
    if (a === "nas" || a === "stredRovnaky") return "nasivky";
    if (a === "tap" || a === "tapRovnake" || a === "tapZmenit" || a === "tapNas" || a === "tapNasRovnaka") return "tapacir";
    if (a === "potvrd") return v === "boky" || v === "stred" ? "nasivky" : "tapacir";
    if (a === "zmenit") return v === "kam" || v === "boky" || v === "stred" ? "nasivky" : "tapacir";
    return null;
  }
  /** Kroky 5 a 6 — automatický posun (Michal 18. 10. 2026: „…vyberám si na stred koberca, rovnaké alebo iné. Hotovo.“):
   *  odpoveď na poslednú otvorenú podotázku (Pokračovať v poslednej karte, „Rovnaká ako …“, Nie pri nášivke na dvere,
   *  aj podotázka znova otvorená cez „Zmeniť“) krok rovno uzavrie a otvorí ďalší — ako „Nie, ďakujem“. S ani košík sa
   *  nemenia (len U.otvoreny cez pokracuj). Znova otvorený hotový krok bez otvorenej podotázky má „Pokračujte“ ako zálohu.
   *  bolaOtazka = pred akciou bola v kroku otvorená podotázka (prvá nezodpovedaná alebo znova otvorená cez „Zmeniť“). */
  function poOtazke(kp, bolaOtazka) {
    if (!bolaOtazka || U.otvoreny !== kp || !hotovy(kp) || otvorenyBlok(kp)) return false;
    pokracuj(kp);
    return true;
  }
  function akcia(a, el) {
    const kp = krokAkcie(a, el.getAttribute("data-v")), k0 = kp ? kluc(kp) : null;
    const bolaOtazka = !!kp && a !== "zmenit" && U.otvoreny === kp && !!otvorenyBlok(kp);
    akciaVyberu(a, el);
    if (kp && poOtazke(kp, bolaOtazka)) return;
    if (kp && U.otvoreny === kp && kluc(kp) !== k0) posunNaBlok(kp);
  }

  function akciaVyberu(a, el) {
    const v = el.getAttribute("data-v"), m = el.getAttribute("data-m");
    switch (a) {
      case "krok": klikHlavicka(v); return;
      case "dalej": pokracuj(v); return;
      case "typ": if (S.typ !== v) zmena(() => { S.typ = v; resetVozidla(); }); return;
      case "mat": zmena(() => { if (S.material !== v) { S.material = v; if (S.farba && !farba(v, S.farba)) S.farba = null; } }); return;
      case "farba": zmena(() => { S.farba = v; }); return;
      case "lem": zmena(() => { S.lem = v; }); return;
      case "nas": {
        /* 4 výlučné voľby (Michal 18. 10. 2026 večer): zvolená je LEN jedna. Výber sa nikdy nevráti na prázdny (revízia
           18. 10. 2026): ťuk na už zvolenú voľbu S nemení — inak by selecty Shoptetu ostali na starej hodnote. Pri zmene
           voľby sa motív a niť prenesú (pridajBoky / odoberBoky); potvrdenie „pod sedadlami“ ostane len pri voľbe, ktorá
           ich mala aj predtým, stredový koberec sa pýta znova. */
        if (v === S.nas) {
          if (U.znova.nasivky === "kam") { U.znova.nasivky = null; render(); }
          if (v === "nechcem") pokracuj("nasivky");
          return;
        }
        const b = jeBoky();
        zmena(() => {
          if (v === "nechcem" || v === "stred") { if (b) odoberBoky(); }
          else if (!b) pridajBoky();
          S.nas = v;
          U.n5.boky = b && jeBoky() && U.n5.boky;
          U.n5.stred = false; U.n5.stredOdp = false; U.znova.nasivky = null;
        });
        if (v === "nechcem") pokracuj("nasivky");
        return;
      }
      case "motiv": zmena(() => { if (m === "boky") S.nasBoky.motiv = v; else if (m === "stred") S.nasStred.motiv = v; else { S.tapNasMotiv = v; if (!koberecNas()) { S.tapNasRovnaka = false; U.n6.nasOdp = true; } } }); return;
      case "nit": zmena(() => { if (m === "boky") S.nasBoky.nit = v; else if (m === "stred") S.nasStred.nit = v; else { S.tapNasNit = v; if (!koberecNas()) { S.tapNasRovnaka = false; U.n6.nasOdp = true; } } }); return;
      case "foto": galUkaz(+v); galSpusti(); return; // bodka pod fotkou tapacíru: bez prekreslenia, autoplay odznova
      case "potvrd": potvrd(v); return;
      case "zmenit": zmenit(v); return;
      /* „Rovnaká ako pod sedadlami“ = hotovo (karta sa zatvorí); „Iná nášivka“ = motív, niť, Pokračovať */
      case "stredRovnaky": zmena(() => { S.stredRovnaky = v === "1"; U.n5.stredOdp = true; U.n5.stred = v === "1"; U.znova.nasivky = null; }); return;
      case "tapNasRovnaka": zmena(() => { S.tapNasRovnaka = v === "1"; U.n6.nasOdp = true; U.n6.nas = v === "1"; U.znova.tapacir = null; }); return;
      case "tap":
        /* U.dvereInfo ostáva: otázku na nášivku na dvere s vysvetlením zruší až odpoveď Áno / Nie (akcia tapNas) */
        zmena(() => { S.tap = v; U.znova.tapacir = null; });
        if (v === "nie") pokracuj("tapacir");
        return;
      case "tapZmenit":
        /* Už zvolené „Vybrať inak“ S nemení (len otvorí materiál, farbu a lemovanie). Inak sa vopred doplní materiál, farba
           a lemovanie kobercov, farba len ak patrí k materiálu tapacíru (revízia 18. 10. 2026: inak „12“ pri dvojfarebnom
           mikrosemiši zhodilo zhrnutie -> React). */
        zmena(() => {
          if (S.tapRovnaky) {
            S.tapRovnaky = false; S.tapMat = S.tapMat || S.material;
            if (!S.tapFarba && S.tapMat && S.farba && farba(S.tapMat, S.farba)) S.tapFarba = S.farba;
            S.tapLem = S.tapLem || S.lem;
          }
          U.n6.matOdp = true; U.n6.mat = false; U.znova.tapacir = null;
        });
        return;
      case "tapRovnake": zmena(() => { S.tapRovnaky = true; U.n6.matOdp = true; U.n6.mat = true; U.znova.tapacir = null; }); return;
      case "tapMat": zmena(() => { if (S.tapMat !== v) { S.tapMat = v; if (S.tapFarba && !farba(v, S.tapFarba)) S.tapFarba = null; } }); return;
      case "tapFarba": zmena(() => { S.tapFarba = v; }); return;
      case "tapLem": zmena(() => { S.tapLem = v; }); return;
      case "tapNas": zmena(() => { S.tapNas = v === "ano"; U.znova.tapacir = null; U.dvereInfo = false; }); return;
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
  const naKlaves = () => { klavesnica = true; };
  const naDotyk = () => { klavesnica = false; };
  root.addEventListener("click", naKlik);
  root.addEventListener("change", naZmenuPola);
  lst.addEventListener("click", naKlik);
  doc.addEventListener("keydown", naKlaves, true);
  doc.addEventListener("pointerdown", naDotyk, true);
  doc.addEventListener("touchstart", naDotyk, { capture: true, passive: true });

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
      galZrus();
      hodn.removeEventListener("click", naHodnotenie);
      root.removeEventListener("click", naKlik);
      root.removeEventListener("change", naZmenuPola);
      lst.removeEventListener("click", naKlik);
      doc.removeEventListener("keydown", naKlaves, true);
      doc.removeEventListener("pointerdown", naDotyk, true);
      doc.removeEventListener("touchstart", naDotyk, { capture: true, passive: true });
    },
  };
}
