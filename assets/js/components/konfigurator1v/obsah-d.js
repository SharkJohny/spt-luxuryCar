// Nový vzhľad 1V — obsah pod konfigurátorom, SKUPINA D: realita (videá), FAQ, Kúpiť a nečakať, zlatá linka čítania, okno.
// VLASTNÍK: worker skupiny D (+ admin-html/src/p1v-598/4x-d-*.sk.html, assets/css/_lcd1v-obsah-d.scss,
// tools/test-1v/obsah-d.mjs). Pravidlá: docs/1v-obsah.md (API okna: „Okno na fotky a videá #p1v-lb“).
// Pre všetky skupiny obsahu (T0.3): sekcie D nájde podľa mena v ktoromkoľvek kľúči (598, dvoj, classic, premium,
// boxy); sekcia, ktorá v skupine nie je (stub alebo ju návrh nemá), sa preskočí.
//
// HTML sekcií je statické (admin); tento modul ho len OŽIVÍ. Nič nekreslí, nič zo živého DOM nemaže, nič neodosiela.
// Volá ho obsah.js pod body.lcd-1v, keď sú korene obsahu na stránke. Sekcia, ktorá ešte nie je v admine (stub), nie je
// v DOM: oc.sekcia(meno) === null a jej časť sa preskočí. Od 25. 10. 2026 (rýchlosť) po sekciách (pozri spolocne()).
//   d-realita  šípky pásu (schovajú sa, keď sa pás zmestí), natáčanie kariet do perspektívy (ako titulka), klik = video v okne
//   d-faq      otázka = <button type="button" aria-expanded>, odpoveď sa rozbalí (viac otvorených naraz, ako <details> v návrhu)
//   d-koniec   pozadie (CSS) až pri priblížení (trieda p1v-blizko); „Zadajte údaje o vozidle“ = posun na prvý nevyplnený krok (otvorí ho), inak na súhrn košíka; „Pozrite si
//              recenzie“ = posun na sekciu skupiny A. To isté robí každý odkaz href="#product-detail-form" v obsahu,
//              ktorý si skupina neobslúži sama (preventDefault v jej handleri = D ho nechá tak).
//   d-pomocne  zlatá linka čítania (#p1v-citanie) a okno na fotky/videá (#p1v-lb) — obe sa presunú priamo do <body>
//              (position:fixed nad hlavičkou bez ohľadu na predkov). Okno drží atribút hidden, kým nie je otvorené.
// .rv prvky sekcií D dostanú .on pri zobrazení (reveal titulky: bez .on sú priehľadné).
export const MENO = "obsah-d";

const KONF = 'a[href="#product-detail-form"], [data-p1v-konf]';
const LB_SEL = "[data-p1v-lb-foto], [data-p1v-lb-yt], [data-p1v-lb-video]";
const YT_ID = /^[\w-]{6,20}$/;

let okno = null; // singleton okna (pripravOkno); null = okno na stránke nie je

// ------------------------------------------------------------------------------------------------ plná fotka okna
// rýchlosť (25. 10. 2026): galéria ukazuje zmenšené WebP (build obalí fotky do <picture>), okno chce plný JPG
// z data-p1v-lb-foto. Kým JPG nebol stiahnutý, okno ostávalo na pomalej sieti chvíľu prázdne a rám zmrštený (rozmer rámu
// dáva fotka). Preto okno hneď ukáže fotku, ktorú prehliadač už má (náhľad = currentSrc kliknutej fotky), v rozmere plnej
// fotky, a plný JPG ju nahradí až po stiahnutí — rám neposkočí.
const MA_URL = typeof URL === "function";

/** Absolútna adresa (porovnanie s img.currentSrc); zlá adresa -> "". */
function absolutna(u) {
  if (!u) return "";
  try { return MA_URL ? new URL(u, document.baseURI).href : u; } catch (e) { return ""; }
}

/** Šírka súboru (px) kandidáta url zo srcset obrázka alebo <source> jeho <picture> („…-w480.webp 480w“), inak 0.
 *  naturalWidth to nie je: pri srcset vracia šírku prepočítanú cez sizes, nie šírku súboru. */
function sirkaSuboru(img, url) {
  const zdroje = [img];
  const pic = img.parentNode;
  if (pic && pic.nodeName === "PICTURE") Array.prototype.forEach.call(pic.querySelectorAll("source"), (s) => zdroje.push(s));
  for (let i = 0; i < zdroje.length; i++) {
    const ss = zdroje[i].getAttribute("srcset");
    if (!ss) continue;
    const kandidati = ss.split(",");
    for (let j = 0; j < kandidati.length; j++) {
      const m = /^\s*(\S+)\s+(\d+)w\s*$/.exec(kandidati[j]);
      if (m && absolutna(m[1]) === url) return Number(m[2]);
    }
  }
  return 0;
}

/** Náhľad položky: fotka v galérii už načítaná a iná ako plná -> { src, w (šírka súboru) }, inak null. */
function nahladZ(img, plna) {
  if (!img || !img.complete || !(img.naturalWidth > 0)) return null;
  const src = img.currentSrc || "";
  if (!src || src === absolutna(plna)) return null; // starý iPhone bez WebP: galéria už má plný JPG
  const w = sirkaSuboru(img, src);
  return w > 0 ? { src, w } : null;
}

const sTahuje = new Map(); // url -> Image, kým sa plná fotka sťahuje (potom je v cache prehliadača; nedržať dekódované)
/** Plná fotka do cache prehliadača (jedna požiadavka na adresu) -> Image; complete = už je. */
function plnaFotka(url) {
  let im = sTahuje.get(url);
  if (im) return im;
  im = new Image();
  im.decoding = "async";
  im.src = url;
  if (im.complete && im.naturalWidth > 0) return im;
  sTahuje.set(url, im);
  const hotovo = () => { sTahuje.delete(url); };
  im.addEventListener("load", hotovo, { once: true });
  im.addEventListener("error", hotovo, { once: true });
  return im;
}

const pohyb = () => !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const zapnute = () => document.body.classList.contains("lcd-1v");

/** výška pevnej/lepivej hlavičky webu (ako kroky.js) — posun nech neskončí pod ňou */
function vyskaHlavicky() {
  const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (let i = 0; i < sels.length; i++) {
    const e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) {
      const r = e.getBoundingClientRect();
      if (r.bottom > 0 && r.top < 40) return Math.round(r.bottom);
    }
  }
  return 0;
}

/** plynulý posun tak, aby horný okraj el bol pod hlavičkou (odstup 12 px) */
function posunNa(el, { stred = false } = {}) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const hH = vyskaHlavicky();
  const y = stred ? r.top + r.height / 2 - (hH + (vh - hH) / 2) : r.top - hH - 12;
  window.scrollTo({ top: Math.max(0, Math.round(window.pageYOffset + y)), behavior: pohyb() ? "smooth" : "auto" });
}

// ------------------------------------------------------------------------------------------------ okno #p1v-lb
/** Pripraví okno zo statického HTML (43-d-pomocne). Presunie ho do <body>, skryje atribútom hidden. */
function pripravOkno(el) {
  if (!el) return null;
  const ram = el.querySelector(".p1v-lb-ram");
  const pod = el.querySelector(".p1v-lb-pod");
  const x = el.querySelector(".p1v-lb-x");
  const spat = el.querySelector(".p1v-lb-spat");
  const dalej = el.querySelector(".p1v-lb-dalej");
  if (!ram || !pod || !x) return null;
  el.hidden = true;
  document.body.appendChild(el);
  const s = { el, ram, pod, x, spat, dalej, polozky: [], i: 0, fokus: null, overflow: null, casovac: 0, otvorene: false };

  function vykresli() {
    const p = s.polozky[s.i];
    while (ram.firstChild) ram.removeChild(ram.firstChild);
    ram.className = "p1v-lb-ram je-" + p.typ;
    let m;
    if (p.typ === "foto") {
      m = document.createElement("img");
      m.alt = p.alt || p.popis || "";
      m.decoding = "async";
      const plna = p.nahlad && p.sirka > 0 ? plnaFotka(p.src) : null;
      if (plna && !(plna.complete && plna.naturalWidth > 0)) {
        // rýchlosť (25. 10. 2026): náhľad z cache v rozmere plnej fotky — srcset s šírkou súboru náhľadu a sizes = šírka
        // plnej fotky (atribút width galérie = rozmer JPG) -> prirodzená veľkosť obrázka je tá istá ako po výmene.
        // src ostáva plná fotka (kto číta atribút src, vidí ju ako doteraz); pri srcset s w-deskriptorom ju prehliadač
        // z tohto <img> nesťahuje (src nie je kandidát) — sťahuje ju plnaFotka.
        // Po stiahnutí (a dekódovaní) plnej fotky sa srcset zruší a ukáže sa src — rám ostane rovnaký.
        m.sizes = p.sirka + "px";
        m.srcset = p.nahlad.src + " " + p.nahlad.w + "w";
        m.src = p.src;
        const img = m;
        const vymen = () => {
          if (!img.isConnected || !img.hasAttribute("srcset")) return;
          img.removeAttribute("srcset");
          img.removeAttribute("sizes");
        };
        // chyba plnej fotky: náhľad ostáva (lepší ako prázdny rám)
        plna.addEventListener("load", () => {
          if (plna.decode) plna.decode().then(vymen, vymen);
          else vymen();
        }, { once: true });
      } else {
        m.src = p.src;
      }
    } else if (p.typ === "yt") {
      m = document.createElement("iframe");
      m.src = "https://www.youtube-nocookie.com/embed/" + p.src + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
      m.title = p.popis || "Video";
      m.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      m.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      m.setAttribute("allowfullscreen", "");
    } else {
      m = document.createElement("video");
      m.src = p.src;
      m.controls = true;
      m.autoplay = true;
      m.playsInline = true;
      m.setAttribute("playsinline", "");
    }
    ram.appendChild(m);
    const viac = s.polozky.length > 1;
    pod.textContent = (p.popis || "") + (viac ? (p.popis ? " · " : "") + (s.i + 1) + " / " + s.polozky.length : "");
    pod.hidden = !pod.textContent;
    if (spat) spat.hidden = !viac;
    if (dalej) dalej.hidden = !viac;
  }
  function posun(o) {
    if (s.polozky.length < 2 || !s.otvorene) return;
    s.i = (s.i + o + s.polozky.length) % s.polozky.length;
    vykresli();
  }
  function zavri() {
    if (!s.otvorene) return;
    s.otvorene = false;
    el.classList.remove("on");
    clearTimeout(s.casovac);
    const hotovo = () => {
      el.hidden = true;
      while (ram.firstChild) ram.removeChild(ram.firstChild); // zastaví video
    };
    if (pohyb()) s.casovac = setTimeout(hotovo, 260);
    else hotovo();
    document.documentElement.style.overflow = s.overflow || "";
    s.overflow = null;
    const f = s.fokus;
    s.fokus = null;
    if (f && f.focus && f.isConnected) try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }
  function otvor(polozky, i, spatFokus) {
    clearTimeout(s.casovac);
    s.polozky = polozky;
    s.i = Math.max(0, Math.min(polozky.length - 1, i | 0));
    vykresli();
    if (s.otvorene) return; // už otvorené (aj počas zatvárania sa vráti) — len nový obsah
    s.otvorene = true;
    s.fokus = spatFokus || (document.activeElement !== document.body ? document.activeElement : null);
    s.overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const bolo = el.hidden;
    el.hidden = false;
    if (bolo) void el.offsetWidth; // štart prechodu opacity
    el.classList.add("on");
    try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); }
  }

  x.addEventListener("click", zavri);
  if (spat) spat.addEventListener("click", () => posun(-1));
  if (dalej) dalej.addEventListener("click", () => posun(1));
  el.addEventListener("click", (e) => {
    if (e.target === el || e.target === s.el.querySelector(".p1v-lb-in")) zavri();
  });
  document.addEventListener("keydown", (e) => {
    if (!s.otvorene) return;
    if (e.key === "Escape") { e.preventDefault(); zavri(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); posun(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); posun(1); }
    else if (e.key === "Tab") {
      // fokus ostáva v okne (zavrieť, šípky, prvky prehrávača)
      const t = [x, spat, dalej].filter((b) => b && !b.hidden);
      const i = t.indexOf(document.activeElement);
      if (i === -1 && !el.contains(document.activeElement)) { e.preventDefault(); t[0].focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); t[t.length - 1].focus(); }
      else if (!e.shiftKey && i === t.length - 1) { e.preventDefault(); t[0].focus(); }
    }
  });
  // potiahnutie prstom pri sade fotiek
  let tx = null, ty = 0;
  el.addEventListener("touchstart", (e) => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) posun(dx < 0 ? 1 : -1);
  }, { passive: true });

  return { otvor, zavri, el };
}

/** položka okna z prvku s data-p1v-lb-* (popis: data-p1v-lb-popis, inak .cap / figcaption / alt obrázka) */
function polozkaZ(el) {
  const d = el.dataset;
  const typ = d.p1vLbFoto ? "foto" : d.p1vLbYt ? "yt" : d.p1vLbVideo ? "video" : null;
  if (!typ) return null;
  const src = (d.p1vLbFoto || d.p1vLbYt || d.p1vLbVideo || "").trim();
  const img = el.querySelector("img");
  const cap = el.querySelector(".cap, figcaption") || (el.closest("figure") && el.closest("figure").querySelector("figcaption"));
  const popis = (d.p1vLbPopis || (cap && cap.textContent) || (img && img.alt) || "").replace(/\s+/g, " ").trim();
  const p = { typ, src, popis, alt: (img && img.alt) || popis };
  // fotka: náhľad z galérie a šírka plnej fotky (atribút width = rozmer JPG) — okno ich ukáže, kým JPG nie je (vykresli)
  if (typ === "foto" && img) {
    const n = nahladZ(img, src);
    const w = parseInt(img.getAttribute("width"), 10);
    if (n && w > 0) { p.nahlad = n; p.sirka = w; }
  }
  return p;
}

/** platná položka: foto/video https alebo relatívna adresa, YouTube id */
function platna(p) {
  if (!p || typeof p.src !== "string" || !p.src) return false;
  if (p.typ === "yt") return YT_ID.test(p.src);
  if (p.typ !== "foto" && p.typ !== "video") return false;
  return /^(https:\/\/|\/(?!\/))/.test(p.src);
}

/**
 * API okna pre všetky skupiny (docs/1v-obsah.md „Okno na fotky a videá #p1v-lb“).
 * polozky: [{ typ: "foto" | "yt" | "video", src, popis?, alt? }] alebo jedna položka; index = prvá zobrazená;
 * spat = prvok, ktorý po zatvorení dostane fokus. Vráti false, keď okno na stránke nie je (stub, bez flagu,
 * starý vzhľad) alebo položka nie je platná — volajúci si poradí sám (napr. nechá odkaz otvoriť fotku).
 */
export function otvorOkno(polozky, index = 0, spat = null) {
  if (!okno || !zapnute()) return false;
  const zoznam = (Array.isArray(polozky) ? polozky : [polozky]).filter(platna);
  if (!zoznam.length) return false;
  okno.otvor(zoznam, index, spat);
  return true;
}
/** Zatvorí okno (ak je otvorené). */
export function zavriOkno() {
  if (okno) okno.zavri();
}

/** deklaratívne API: klik na [data-p1v-lb-foto|yt|video] v obsahu; sada = rovnaké data-p1v-lb-sada v poradí DOM */
function klikOkno(miesto, e) {
  if (e.defaultPrevented || !e.target || !e.target.closest) return;
  let el = e.target.closest(LB_SEL);
  if (!el || !miesto.contains(el)) return;
  let prvky = [el];
  const sada = el.getAttribute("data-p1v-lb-sada");
  if (sada) {
    prvky = Array.prototype.filter.call(miesto.querySelectorAll(LB_SEL), (x) =>
      x.getAttribute("data-p1v-lb-sada") === sada && !x.closest("[aria-hidden=true]"));
    // kópia pásu (aria-hidden, napr. nekonečná galéria) -> originál s tou istou položkou, inak by bola v sade dvakrát
    if (prvky.indexOf(el) === -1) {
      const kluc = (x) => x.getAttribute("data-p1v-lb-foto") || x.getAttribute("data-p1v-lb-yt") || x.getAttribute("data-p1v-lb-video");
      const orig = prvky.find((x) => kluc(x) === kluc(el));
      if (orig) el = orig;
      else prvky.unshift(el);
    }
  }
  const polozky = [], mapa = [];
  prvky.forEach((x) => { const p = polozkaZ(x); if (platna(p)) { polozky.push(p); mapa.push(x); } });
  const i = mapa.indexOf(el);
  if (i === -1) return;
  e.preventDefault();
  okno.otvor(polozky, i, el);
}

// ------------------------------------------------------------------------------------------------ zlatá linka čítania
/** koľko obsahu pod konfigurátorom má čitateľ za sebou (od začiatku .p1v-miesto po jeho koniec, stred okna) */
function linkaCitania(oc, el) {
  if (!el) return;
  const ciara = el.querySelector("i");
  if (!ciara) return;
  document.body.appendChild(el);
  let caka = false;
  function prepocitaj() {
    caka = false;
    if (!zapnute()) { el.classList.remove("zap"); return; }
    const r = oc.miesto.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const p = (vh * 0.5 - r.top) / Math.max(1, r.height);
    const zap = p > 0 && p < 1 && r.height > 0;
    if (el.classList.contains("zap") !== zap) el.classList.toggle("zap", zap);
    ciara.style.transform = "scaleX(" + Math.max(0, Math.min(1, p)).toFixed(4) + ")";
  }
  const naplanuj = () => { if (!caka) { caka = true; window.requestAnimationFrame(prepocitaj); } };
  window.addEventListener("scroll", naplanuj, { passive: true });
  window.addEventListener("resize", naplanuj, { passive: true });
  naplanuj();
}

// ------------------------------------------------------------------------------------------------ d-realita
function realita(sek) {
  const pas = sek.querySelector(".vids");
  if (!pas) return;
  const nav = sek.querySelector(".vidnav");
  const karty = () => pas.querySelectorAll(".vid");
  const krok = () => {
    const k = karty()[0];
    const gap = parseFloat(getComputedStyle(pas).columnGap) || 16;
    return k ? k.offsetWidth + gap : 220;
  };
  const spat = sek.querySelector(".p1v-vid-spat"), dalej = sek.querySelector(".p1v-vid-dalej");
  if (spat) spat.addEventListener("click", () => pas.scrollBy({ left: -krok(), behavior: pohyb() ? "smooth" : "auto" }));
  if (dalej) dalej.addEventListener("click", () => pas.scrollBy({ left: krok(), behavior: pohyb() ? "smooth" : "auto" }));

  // karty ďalej od stredu pásu sa natočia dozadu (titulka lcdhCoverflow); na dotyku len zmenšia (rotácia ruší).
  // Poloha z offsetLeft (bez transformácií) — najprv všetko prečítať, potom zapísať.
  const plocho = window.matchMedia && window.matchMedia("(hover: none)").matches;
  let caka = false;
  function prekresli() {
    caka = false;
    const ks = Array.prototype.slice.call(karty());
    if (!ks.length) return;
    const stred = pas.offsetLeft + pas.scrollLeft + pas.clientWidth / 2, sirka = pas.clientWidth;
    const hodnoty = ks.map((k) => {
      const os = k.offsetLeft + k.offsetWidth / 2;
      if (os < stred - sirka || os > stred + sirka) return null;
      return Math.max(-1, Math.min(1, (os - stred) / (k.offsetWidth * 1.15)));
    });
    ks.forEach((k, i) => {
      const p = hodnoty[i];
      if (p === null || !pohyb()) { if (k.style.transform) { k.style.transform = ""; k.style.zIndex = ""; } return; }
      const a = Math.abs(p);
      k.style.transform = plocho
        ? "scale(" + (1 - a * 0.14).toFixed(4) + ") translateY(" + Math.round(a * 8) + "px)"
        : "rotateY(" + (-p * 16).toFixed(2) + "deg) translateZ(" + (-a * 95).toFixed(1) + "px) scale(" + (1 - a * 0.1).toFixed(4) + ")";
      k.style.zIndex = String(100 - Math.round(a * 40));
    });
    if (nav) {
      const skry = pas.scrollWidth - pas.clientWidth < 8;
      if (nav.hidden !== skry) nav.hidden = skry;
    }
  }
  const naplanuj = () => { if (!caka) { caka = true; window.requestAnimationFrame(prekresli); } };
  pas.addEventListener("scroll", naplanuj, { passive: true });
  window.addEventListener("resize", naplanuj, { passive: true });
  naplanuj();
  setTimeout(naplanuj, 400);
  setTimeout(naplanuj, 1200);
}

// ------------------------------------------------------------------------------------------------ d-faq
function faq(sek) {
  sek.querySelectorAll(".p1v-faq-q").forEach((b) => {
    b.addEventListener("click", () => {
      const otvorena = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", otvorena ? "false" : "true");
    });
  });
}

// ------------------------------------------------------------------------------------------------ výzvy (d-koniec + odkazy na konfigurátor)
/** prvý nevyplnený krok konfigurátora (otvorí ho, ostatné zatvorí); všetko vybrané = súhrn s tlačidlom košíka */
function kKonfiguratoru(oc) {
  let krok = null;
  try { krok = oc.ctx.prvyNevyplneny(); } catch (e) { krok = null; }
  if (krok) {
    const nastav = window.__lcdSetStepOpen;
    if (!krok.classList.contains("active") && typeof nastav === "function") {
      let kroky = [];
      try { kroky = oc.ctx.kroky() || []; } catch (e) { kroky = []; }
      kroky.forEach((k) => { if (k !== krok && k.classList.contains("active")) nastav(k, false); });
      nastav(krok, true);
    }
    // zatvorenie kroku nad ním mení výšku (prechod ~300 ms): cieľ sa prepočíta po ňom
    posunNa(krok);
    setTimeout(() => posunNa(krok), 380);
    return;
  }
  const suhrn = document.querySelector(".lcd1v-suhrn");
  let kosik = null;
  try { kosik = oc.ctx.krok("kosik"); } catch (e) { kosik = null; }
  const ciel = suhrn || kosik || oc.ctx.form();
  posunNa(ciel, { stred: !!(suhrn || kosik) });
}

function vyzvy(oc) {
  oc.miesto.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || !e.target || !e.target.closest) return;
    const konf = e.target.closest(KONF);
    if (konf && oc.miesto.contains(konf)) {
      e.preventDefault();
      kKonfiguratoru(oc);
      return;
    }
    const a = e.target.closest("[data-p1v-ciel]");
    if (a && oc.miesto.contains(a)) {
      const mena = (a.getAttribute("data-p1v-ciel") || "").split(/\s+/).filter(Boolean);
      let ciel = null;
      // v celom obsahu (oc.sekcia pri oživení po sekciách vidí len jednu sekciu)
      const najdi = oc.najdiSekciu || oc.sekcia;
      for (let i = 0; i < mena.length && !ciel; i++) ciel = najdi(mena[i]);
      if (!ciel) return; // sekcia ešte nie je (stub) -> kotva href
      e.preventDefault();
      posunNa(ciel);
    }
  });
}

/**
 * Michal 25. 10. 2026 (rýchlosť): obsah.js volá init po sekciách (oc.sekcia vráti len sekciu, ktorá sa práve oživuje)
 * a raz s oc bez sekcií hneď pri vložení. Spoločné časti (klik na položky okna, výzvy na konfigurátor, okno cez
 * udalosť) sa preto zaregistrujú len raz na miesto obsahu — inak by bežali pri každom volaní znova.
 */
const SPOLOCNE = typeof WeakSet === "function" ? new WeakSet() : null;
function spolocne(oc) {
  if (SPOLOCNE) {
    if (SPOLOCNE.has(oc.miesto)) return;
    SPOLOCNE.add(oc.miesto);
  }
  // okno sa môže pripraviť až pri neskoršom volaní (sekcia d-pomocne) -> kontrola pri kliku
  oc.miesto.addEventListener("click", (e) => { if (okno) klikOkno(oc.miesto, e); });
  // rýchlosť (25. 10. 2026): myš — plná fotka sa začne sťahovať už pri stlačení tlačidla (klik príde o ~100 ms neskôr).
  // Dotyk nie: potiahnutie pásu galérie tiež začína dotykom fotky a sťahovali by sa fotky, ktoré zákazník neotvorí.
  oc.miesto.addEventListener("pointerdown", (e) => {
    if (!okno || e.pointerType !== "mouse" || e.button !== 0 || !e.target || !e.target.closest) return;
    const el = e.target.closest("[data-p1v-lb-foto]");
    if (!el || !oc.miesto.contains(el)) return;
    const p = polozkaZ(el);
    if (p && p.nahlad && platna(p)) plnaFotka(p.src);
  }, { passive: true });
  // iné moduly môžu okno otvoriť aj udalosťou (bez importu): oc.vysli("obsah-d:okno", { polozky, index, spat })
  if (oc.na) oc.na("obsah-d:okno", (d) => { if (d) otvorOkno(d.polozky, d.index || 0, d.spat || null); });
  vyzvy(oc);
}

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  spolocne(oc);
  const pomocne = oc.sekcia("d-pomocne");
  if (pomocne) {
    okno = pripravOkno(pomocne.querySelector(".p1v-lb"));
    linkaCitania(oc, pomocne.querySelector(".p1v-citanie"));
  }

  const r = oc.sekcia("d-realita");
  if (r) realita(r);
  const f = oc.sekcia("d-faq");
  if (f) faq(f);
  const k = oc.sekcia("d-koniec");
  // ozdobné pozadie záveru (CSS, hero.jpg) až pri priblížení
  if (k) oc.priZobrazeni(k, (el) => el.classList.add("p1v-blizko"), { okraj: "800px 0px" });
  // reveal .rv robí spoločne obsah.js pre všetky sekcie
}
