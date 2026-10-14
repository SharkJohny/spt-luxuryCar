// Nový vzhľad 1V — obsah pod konfigurátorom, SKUPINA A: ponuka dvojvrstvových, referenčné videá, galéria, recenzie.
// VLASTNÍK: worker skupiny A (+ admin-html/src/p1v-598/1x-a-*.sk.html, assets/css/_lcd1v-obsah-a.scss,
// tools/test-1v/obsah-a.mjs). Pravidlá: docs/1v-obsah.md.
//
// HTML sekcií je statické (admin); tento modul ho len OŽIVÍ. Nič zo živého DOM nemaže, nič neodosiela, žiadny fetch.
// Volá ho obsah.js pod body.lcd-1v, keď sú korene obsahu na stránke. Sekcia, ktorá ešte nie je v admine (stub), nie je
// v DOM: oc.sekcia(meno) === null a jej časť sa preskočí.
//   a-referencie poster slučiek až pri priblížení pásu, prehráva max 2 najbližšie stredu (telefón 1, .mid), bez autoplay
//                pri šetrení dát / pomalej sieti / reduced-motion; šípky; natáčanie kariet do perspektívy (ako titulka).
//                Klik na kartu = celé video z YouTube v okne skupiny D (data-p1v-lb-yt, obsluhuje obsah-d.js).
//   a-galeria    modul titulky lx galéria: lxModulyOziv len na tejto sekcii (posun pásu scrollom). Zväčšenie fotky
//                = jediné okno obsahu #p1v-lb skupiny D (sada „a-galeria“: šípky, potiahnutie, počítadlo), nie .lx-zoom.
//   reveal .rv robí spoločne obsah.js pre všetky sekcie.
//   a-recenzie   skóre, počet a karty zo živých dát window.LCD_REVIEWS (reviews-data.js, načíta ho main.js pre widget
//                lcd-reviews v starom popise). Nič natvrdo: keď dáta do 30 s neprídu, sekcia sa skryje (.p1v-rev-bez).
import { lxModulyOziv } from "../../lcdHomeModuly.js";
import { lcdMultiKoren } from "../../functions/lcdOziv.js";

export const MENO = "obsah-a";

const SEKCIE = ["a-ponuka", "a-referencie", "a-galeria", "a-recenzie"];
const pole = (x) => Array.prototype.slice.call(x || []);
const mm = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
const pohyb = () => !mm("(prefers-reduced-motion: reduce)");

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const sekcie = SEKCIE.map((m) => oc.sekcia(m)).filter(Boolean);
  if (!sekcie.length) return;
  const ref = oc.sekcia("a-referencie");
  if (ref) referencie(ref, oc);
  const gal = oc.sekcia("a-galeria");
  if (gal) {
    // lcdMultiKoren([gal]).querySelectorAll(".lx-gal") sekciu samu nevráti -> lxModulyOziv nepostaví vlastné .lx-zoom,
    // querySelector(".lx-gal") ju vráti -> posun pásu scrollom ide. Klik na fotku otvorí okno D (data-p1v-lb-*).
    lxModulyOziv(lcdMultiKoren([gal]), oc.ctx.jazyk === "cs");
    galeriaDoOkna(gal);
  }
  const rec = oc.sekcia("a-recenzie");
  if (rec) recenzie(rec, oc);
}

/** Fotky galérie -> okno #p1v-lb (obsah-d.js, delegovaný klik na .p1v-miesto): adresa fotky, sada a popis (figcaption
 *  rieši okno samo). Kópie pásu (.lx-klon, aria-hidden) okno namapuje na originál s rovnakou fotkou. HTML sa nemení. */
function galeriaDoOkna(gal) {
  pole(gal.querySelectorAll(".lx-gal-f")).forEach((b) => {
    const im = b.querySelector("img");
    const src = im && (im.getAttribute("data-src") || im.getAttribute("src"));
    if (!src) return;
    b.setAttribute("data-p1v-lb-foto", src);
    b.setAttribute("data-p1v-lb-sada", "a-galeria");
  });
}

// ------------------------------------------------------------------------------------------------ referenčné videá
function referencie(sek, oc) {
  const deck = sek.querySelector(".deck.refs");
  if (!deck) return;
  const karty = pole(deck.children);
  const videa = pole(deck.querySelectorAll("video"));
  const mobil = () => mm("(max-width:820px)");
  const con = navigator.connection || {};
  const autoplay = pohyb() && !con.saveData && !/2g|3g/.test(con.effectiveType || "");

  // šípky: o šírku karty
  const krok = () => { const k = deck.querySelector(".ref"); return k ? k.getBoundingClientRect().width + 16 : 280; };
  const spat = sek.querySelector(".p1v-ref-spat"), dalej = sek.querySelector(".p1v-ref-dalej");
  if (spat) spat.addEventListener("click", () => deck.scrollBy({ left: -krok(), behavior: pohyb() ? "smooth" : "auto" }));
  if (dalej) dalej.addEventListener("click", () => deck.scrollBy({ left: krok(), behavior: pohyb() ? "smooth" : "auto" }));

  // médiá: poster až pri priblížení pásu, video (src) až keď má hrať
  let blizko = false;
  const nacitaj = (v) => { const s = v.getAttribute("data-src"); if (s && !v.getAttribute("src")) v.setAttribute("src", s); };
  const hraj = (v) => { nacitaj(v); const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const stoj = (v) => { if (!v.paused) v.pause(); };
  /** karty viditeľné v páse, zoradené podľa vzdialenosti od jeho stredu */
  const poradie = () => {
    const o = karty.length && karty[0].offsetParent === deck ? 0 : deck.offsetLeft;
    const l = deck.scrollLeft, r = l + deck.clientWidth, c = l + deck.clientWidth / 2;
    return karty.map((el, i) => {
      const a = el.offsetLeft - o, w = el.offsetWidth;
      return { i, d: Math.abs(a + w / 2 - c), vid: a + w > l && a < r };
    }).filter((x) => x.vid).sort((x, y) => x.d - y.d);
  };
  const sync = () => {
    const mob = mobil();
    const por = blizko || mob ? poradie() : [];
    const chce = {};
    if (blizko && autoplay && !document.hidden) por.slice(0, mob ? 1 : 2).forEach((x) => { chce[x.i] = 1; });
    const stred = mob && por.length ? por[0].i : -1;
    karty.forEach((el, i) => {
      el.classList.toggle("mid", mob && i === stred);
      const v = el.querySelector("video");
      if (v) (chce[i] ? hraj : stoj)(v);
    });
  };
  let t = 0;
  deck.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(sync, 90); }, { passive: true });
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(sync, 160); }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) videa.forEach(stoj); else sync(); });
  oc.priZobrazeni(deck, () => {
    videa.forEach((v) => { const p = v.getAttribute("data-poster"); if (p && !v.getAttribute("poster")) v.setAttribute("poster", p); });
  }, { okraj: "600px 0px" });
  if (typeof IntersectionObserver === "function") {
    new IntersectionObserver((z) => { blizko = z[0].isIntersecting; sync(); }, { rootMargin: "200px 0px", threshold: 0 }).observe(deck);
  } else { blizko = true; }
  requestAnimationFrame(sync);

  // natáčanie kariet do perspektívy (dotyk: len zmenšenie — iOS nekreslí <video> pod 3D transformáciou)
  const plocho = mm("(hover:none)");
  let caka = false;
  const prekresli = () => {
    caka = false;
    const r0 = deck.getBoundingClientRect(), stred = r0.left + deck.clientWidth / 2, sirka = deck.clientWidth;
    karty.forEach((k) => {
      const r = k.getBoundingClientRect(), os = r.left + r.width / 2;
      if (os < stred - sirka || os > stred + sirka) { if (k.style.transform) { k.style.transform = ""; k.style.zIndex = ""; } return; }
      const p = Math.max(-1, Math.min(1, (os - stred) / (r.width * 1.15))), a = Math.abs(p);
      k.style.transform = plocho
        ? "scale(" + (1 - a * 0.14).toFixed(3) + ") translateY(" + Math.round(a * 8) + "px)"
        : "rotateY(" + (-p * 16).toFixed(2) + "deg) translateZ(" + Math.round(-a * 95) + "px) scale(" + (1 - a * 0.1).toFixed(3) + ")";
      k.style.zIndex = String(100 - Math.round(a * 40));
    });
  };
  const naplanuj = () => { if (!caka) { caka = true; requestAnimationFrame(prekresli); } };
  if (pohyb()) {
    deck.addEventListener("scroll", naplanuj, { passive: true });
    window.addEventListener("resize", naplanuj, { passive: true });
    naplanuj(); setTimeout(naplanuj, 400); setTimeout(naplanuj, 1200);
  }
}

// ------------------------------------------------------------------------------------------------ recenzie z Google
function recenzie(sek, oc) {
  const pas = sek.querySelector(".revs");
  if (!pas) return;
  const spat = sek.querySelector(".p1v-rev-spat"), dalej = sek.querySelector(".p1v-rev-dalej");
  const krok = () => { const k = pas.querySelector(".rev"); return k ? k.getBoundingClientRect().width + 16 : 300; };
  if (spat) spat.addEventListener("click", () => pas.scrollBy({ left: -krok(), behavior: pohyb() ? "smooth" : "auto" }));
  if (dalej) dalej.addEventListener("click", () => pas.scrollBy({ left: krok(), behavior: pohyb() ? "smooth" : "auto" }));

  let hotovo = false;
  oc.ked(() => {
    const d = window.LCD_REVIEWS;
    return d && d.place && Array.isArray(d.reviews) && d.reviews.length ? d : null;
  }, (d) => {
    hotovo = true;
    try { vykresliRecenzie(sek, pas, d); sek.classList.add("p1v-rev-ok"); } catch (e) {
      sek.classList.add("p1v-rev-bez"); // sekcia sa skryje, chyba ide do __lcd1v.chyby (test ju nahlási)
      oc.ctx.chyby.push(MENO + " recenzie: " + ((e && e.message) || e));
    }
  }, { limit: 30000 });
  setTimeout(() => { if (!hotovo) sek.classList.add("p1v-rev-bez"); }, 30500);
}

const cislo1 = (x) => (Math.round(Number(x) * 10) / 10).toFixed(1).replace(".", ",");

/** text recenzie: bez dátumu na začiatku a odpovede majiteľa (prilepené scraperom), dlhý skrátený na celé slovo (~300 zn.) */
function textRecenzie(t) {
  let s = String(t || "").replace(/\s*Luxury Car Design\s+Vlastník\b[\s\S]*$/i, "").replace(/\s+/g, " ").trim()
    .replace(/^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\s*/, "");
  if (s.length > 300) { const c = s.slice(0, 301); s = c.slice(0, c.lastIndexOf(" ")).replace(/[\s,;:–—-]+$/, "") + "…"; }
  return s;
}

function iniciala(meno) {
  const c = String(meno || "").trim().split(/\s+/).filter(Boolean);
  return ((c[0] || "?").charAt(0) + (c.length > 1 ? c[c.length - 1].charAt(0) : "")).toUpperCase();
}

function prvok(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** výber: najprv autori z data-p1v-vyber (poradie), potom pravidlo 5★ + ≥2 fotky + dlhší text, spolu data-p1v-pocet */
function vyberRecenzie(sek, zoznam) {
  const pocet = Math.max(1, Number(sek.getAttribute("data-p1v-pocet")) || 12);
  const dobra = (r) => r && Number(r.rating) >= 4 && String(r.text || "").trim().length >= 40;
  const out = [];
  (sek.getAttribute("data-p1v-vyber") || "").split("|").map((x) => x.trim()).filter(Boolean).forEach((meno) => {
    const r = zoznam.find((x) => x && x.author === meno);
    if (dobra(r) && out.indexOf(r) === -1) out.push(r);
  });
  zoznam.filter((r) => dobra(r) && Number(r.rating) >= 5 && (r.photos || []).length >= 2 && String(r.text).length >= 200)
    .forEach((r) => { if (out.length < pocet && out.indexOf(r) === -1) out.push(r); });
  return out.slice(0, pocet);
}

function vykresliRecenzie(sek, pas, d) {
  const hodnotenie = Number(d.place.rating), pocet = Number(d.place.totalReviews);
  const skore = sek.querySelector(".revhead .score"), sub = sek.querySelector(".revhead .sub");
  if (skore && hodnotenie > 0) skore.textContent = cislo1(hodnotenie);
  if (sub && pocet > 0 && hodnotenie > 0) {
    const tvar = pocet === 1 ? "recenzia" : pocet >= 2 && pocet <= 4 ? "recenzie" : "recenzií";
    sub.textContent = pocet + " " + tvar + " na Google · hodnotenie " + cislo1(hodnotenie);
  }
  const g = sek.querySelector(".revhead .gmark");
  const frag = document.createDocumentFragment();
  vyberRecenzie(sek, d.reviews).forEach((r) => {
    const a = prvok("article", "rev");
    a.appendChild(prvok("span", "qm", "“")).setAttribute("aria-hidden", "true");
    const hv = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    const st = a.appendChild(prvok("div", "st", "★".repeat(hv)));
    st.setAttribute("aria-label", hv + " z 5");
    a.appendChild(prvok("p", "", textRecenzie(r.text)));
    const foto = (r.photos || []).filter((u) => /^https:\/\//.test(u)).slice(0, 3);
    if (foto.length) {
      const sh = a.appendChild(prvok("div", "shots"));
      foto.forEach((u) => {
        const im = prvok("img");
        im.src = u; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.width = 260; im.height = 260;
        sh.appendChild(im);
      });
    }
    const foot = a.appendChild(prvok("div", "foot"));
    foot.appendChild(prvok("span", "av", iniciala(r.author))).setAttribute("aria-hidden", "true");
    const meta = foot.appendChild(prvok("span", "meta"));
    meta.appendChild(prvok("b", "", String(r.author || "").trim()));
    meta.appendChild(prvok("i", "", r.relativeDate || "Overený zákazník"));
    if (g) { const ik = g.cloneNode(true); ik.removeAttribute("class"); foot.appendChild(ik); }
    frag.appendChild(a);
  });
  while (pas.firstChild) pas.removeChild(pas.firstChild); // len prázdny komentár <!-- --> z adminu (TinyMCE)
  pas.appendChild(frag);
}
