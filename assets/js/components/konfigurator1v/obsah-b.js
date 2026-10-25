// Nový vzhľad 1V — obsah pod konfigurátorom, SKUPINA B: Deväť vecí, materiál, porovnanie + výzva, pred a po.
// VLASTNÍK: worker skupiny B (+ admin-html/src/p1v-598/2x-b-*.sk.html, assets/css/_lcd1v-obsah-b.scss,
// tools/test-1v/obsah-b.mjs, nové obrázky assets/img/1v/obsah/b-*). Pravidlá: docs/1v-obsah.md.
// Pre všetky skupiny obsahu (T0.3): sekcie B nájde podľa mena v ktoromkoľvek kľúči (598, dvoj, classic, premium,
// boxy); chýbajúca sekcia = nič; rez materiálu má ľubovoľný počet dosiek (medzera podľa počtu, dvojvrstvové 6).
//
// HTML sekcií je statické (admin); tento modul ho len OŽIVÍ (animácie, posun, video pri zobrazení). Nič nekreslí
// a nič zo živého DOM nemaže. Volá ho obsah.js pod body.lcd-1v, keď sú korene obsahu na stránke. Od 25. 10. 2026
// (rýchlosť) po sekciách, keď sa sekcia priblíži k oknu: oc.sekcia vráti len tú jednu, init teda môže prísť viackrát.
// oc = { ctx, korene, koren (multi-koreň pre lxModulyOziv), miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn),
//        nacitajMedia(el), ked, na, vysli }. Sekcia, ktorá je ešte stub, nie je v DOM: oc.sekcia(meno) === null.
//
// Správanie je to isté ako na titulke (assets/js/lcdHome.js „01-05“ a „exploded vrstvy“, návrh v26 r. 5396–5660),
// len viazané na triedy vo vnútri vlastnej sekcie (titulka používa id #stage2, #exp…, ktoré obsah 1V mať nesmie):
//   b-ocakavat  — PC: 9 krokov riadi scroll prilepenej scény (výška 9 × 44 vh ako návrh), klik na číslo / náhľad posunie;
//                 telefón (CSS karusel z toho istého markupu): bodky .s2-rail ukazujú kartu v strede, klik ju posunie,
//   b-material  — rozloženie rezu podľa scrollu (PC) alebo tlačidlom / pri zobrazení (telefón), legenda ako akordeón,
//   b-porovnanie — reveal .rv + naša cena „od …“ zo živých dát Shoptetu (nikdy natvrdo v HTML),
//   b-predapo   — modul titulky lx-pp: lxModulyOziv (assets/js/lcdHomeModuly.js).
import { lxModulyOziv } from "../../lcdHomeModuly.js";
import { lcdMultiKoren } from "../../functions/lcdOziv.js";

export const MENO = "obsah-b";

/** Statická (neprilepená) verzia scén — rovnaký zlom ako LCD-HOME (telefón, tablet na výšku). */
export const MQ_STATICKA = "(max-width:900px), (min-width:901px) and (max-width:1199px) and (orientation:portrait) and (hover:none) and (pointer:coarse)";

const obmedz = (x) => Math.min(1, Math.max(0, x));
const dve = (i) => String(i).padStart(2, "0");
const pole = (zoz) => Array.prototype.slice.call(zoz);

/** Jedno prekreslenie na snímku: vráti funkciu, ktorá naplánuje fn cez requestAnimationFrame. */
function naRaf(fn) {
  let caka = false;
  return () => {
    if (caka) return;
    caka = true;
    requestAnimationFrame(() => { caka = false; fn(); });
  };
}

/** Postup prilepenej scény 0..1: koľko z jej výšky (mínus okno) už prešlo hore. */
function postup(el) {
  const r = el.getBoundingClientRect();
  const d = r.height - innerHeight;
  return d > 0 ? obmedz(-r.top / d) : 0;
}

/* ------------------------------------------------------------------ Deväť vecí */
function devatVeci(sek, mq) {
  const stage = sek.querySelector(".stage2");
  const main = sek.querySelector(".pinmain");
  const imgs = pole(sek.querySelectorAll(".s2-media img"));
  const texty = pole(sek.querySelectorAll(".s2-t"));
  const rail = pole(sek.querySelectorAll(".s2-rail button"));
  const nahlady = pole(sek.querySelectorAll(".s2-thumbs button"));
  const big = sek.querySelector(".s2-big");
  const prog = sek.querySelector(".pinfoot .pf-bar i");
  const n = imgs.length;
  if (!stage || !main || !n) return;
  let cur = -1;
  const nastav = (i) => {
    if (i === cur) return;
    cur = i;
    imgs.forEach((e, k) => e.classList.toggle("on", k === i));
    texty.forEach((e, k) => e.classList.toggle("on", k === i));
    rail.forEach((e, k) => { e.classList.toggle("on", k === i); e.classList.toggle("done", k < i); });
    nahlady.forEach((e, k) => e.classList.toggle("on", k === i));
    if (big) big.textContent = dve(i + 1);
  };
  // PC: výška scény = počet krokov × 44 vh (návrh: viac ako 6 krokov -> 44 vh, inak 62 vh)
  const vyska = () => { stage.style.height = mq.matches ? "" : n * (n > 6 ? 44 : 62) + "vh"; };
  // telefón: karta (fotka v 1. riadku gridu) najbližšie k stredu karuselu
  const kartaVStrede = () => {
    const r = main.getBoundingClientRect(), stred = r.left + r.width / 2;
    let best = 0, bd = Infinity;
    imgs.forEach((im, i) => { const q = im.getBoundingClientRect(), d = Math.abs(q.left + q.width / 2 - stred); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  const kresli = () => {
    if (mq.matches) { nastav(kartaVStrede()); return; }
    const r = stage.getBoundingClientRect();
    if (r.bottom < -innerHeight || r.top > innerHeight * 2) return; // mimo obrazovky nič
    const p = Math.min(0.999, postup(stage));
    nastav(Math.floor(p * n));
    if (prog) prog.style.width = (p * 100).toFixed(1) + "%";
  };
  const ideNa = (i) => {
    if (mq.matches) {
      const im = imgs[i];
      if (!im) return;
      const r = main.getBoundingClientRect(), q = im.getBoundingClientRect();
      main.scrollTo({ left: main.scrollLeft + (q.left + q.width / 2) - (r.left + r.width / 2), behavior: "smooth" });
      return;
    }
    const top = stage.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (stage.offsetHeight - innerHeight) * ((i + 0.5) / n), behavior: "smooth" });
  };
  rail.concat(nahlady).forEach((b) => b.addEventListener("click", () => ideNa(+b.getAttribute("data-i") || 0)));
  const plan = naRaf(kresli);
  addEventListener("scroll", plan, { passive: true });
  main.addEventListener("scroll", plan, { passive: true });
  addEventListener("resize", () => { vyska(); plan(); });
  const zmena = () => { vyska(); main.scrollLeft = 0; cur = -1; plan(); };
  if (mq.addEventListener) mq.addEventListener("change", zmena);
  vyska();
  kresli();
}

/* ------------------------------------------------------------------ Materiál */
function material(sek, mq, RM) {
  const stage = sek.querySelector(".stage");
  const exp = sek.querySelector(".exp");
  const boxy = pole(sek.querySelectorAll(".mbox"));
  const legy = pole(sek.querySelectorAll(".leg"));
  const hoty = pole(sek.querySelectorAll(".exp .hot"));
  const gs = sek.querySelector(".mgs");
  const prog = sek.querySelector(".pinfoot .pf-bar i");
  const tlac = sek.querySelector(".mat-toggle");
  if (!stage || !exp || !boxy.length) return;

  // legenda a body: prejdenie myšou zvýrazní pár, klik na riadok otvorí popis (akordeón), klik na bod posunie k riadku
  const zvyrazni = (i, on) => { if (legy[i]) legy[i].classList.toggle("on", on); if (hoty[i]) hoty[i].classList.toggle("on", on); };
  // Michal 25. 10. 2026 (rýchlosť): najprv výšky všetkých popisov, potom zápisy (čítanie scrollHeight po zápise max-height
  // predošlého riadku nútilo prepočítať rozloženie pri každom riadku; scrollHeight od max-height nezávisí)
  const vysky = () => {
    const riadky = legy.map((o) => {
      const h = o.querySelector(".leg-h"), d = o.querySelector(".leg-d");
      return h && d ? { d, otvoreny: h.getAttribute("aria-expanded") === "true" } : null;
    }).filter(Boolean);
    const vyska = riadky.map((x) => (x.otvoreny ? x.d.scrollHeight : 0));
    riadky.forEach((x, i) => { x.d.style.maxHeight = x.otvoreny ? vyska[i] + "px" : "0px"; });
  };
  legy.forEach((el, i) => {
    el.addEventListener("mouseenter", () => zvyrazni(i, true));
    el.addEventListener("mouseleave", () => zvyrazni(i, false));
    const h = el.querySelector(".leg-h");
    if (!h) return;
    h.addEventListener("click", () => {
      const bolo = h.getAttribute("aria-expanded") === "true";
      legy.forEach((o) => { const oh = o.querySelector(".leg-h"); if (oh) oh.setAttribute("aria-expanded", "false"); });
      if (!bolo) h.setAttribute("aria-expanded", "true");
      vysky();
    });
  });
  hoty.forEach((el, i) => {
    el.addEventListener("mouseenter", () => zvyrazni(i, true));
    el.addEventListener("mouseleave", () => zvyrazni(i, false));
    el.addEventListener("click", () => { if (legy[i]) legy[i].scrollIntoView({ block: "center", behavior: "smooth" }); });
  });

  // 3D rez: náklon podľa myši, rozostup vrstiev podľa „open“ 0..1 (rovnaký výpočet ako titulka)
  const TF = boxy.map((b) => parseFloat(b.getAttribute("data-t")) || 0.05);
  let mx = 0, my = 0, SC = 1, posledne = 0;
  const RX = -7, RY = 30;
  const naklon = () => { exp.style.transform = "scale(" + SC.toFixed(3) + ") rotateX(" + (RX - my * 4) + "deg) rotateY(" + (RY + mx * 7) + "deg)"; };
  const obal = exp.parentNode;
  obal.addEventListener("mousemove", (e) => {
    const r = exp.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    naklon();
  });
  obal.addEventListener("mouseleave", () => { mx = 0; my = 0; naklon(); });
  const rozloz = (open) => {
    posledne = open;
    const n = boxy.length, W = exp.clientWidth || 600;
    // rozložené vrstvy zaberú do šírky asi 2,23× hrúbku dosky — veľkosť tak, aby sa vždy zmestili do rámu
    const pw = Math.min(W * 0.42, 460), ph = pw / 1.55;
    const th = TF.map((f) => Math.max(3, f * pw));
    const tot = th.reduce((x, y) => x + y, 0);
    // medzera medzi doskami podľa ich počtu (návrh dvojvrstvových: 6 dosiek): pri 5 a menej rovnaká ako 598
    const gap = pw * 0.58 * Math.min(1, 4 / Math.max(1, n - 1));
    let acc = 0;
    boxy.forEach((B, i) => {
      const z = tot / 2 - acc - th[i] / 2 + ((n - 1) / 2 - i) * gap * open;
      acc += th[i];
      B.style.setProperty("--pw", pw.toFixed(1) + "px");
      B.style.setProperty("--ph", ph.toFixed(1) + "px");
      B.style.setProperty("--t", th[i].toFixed(1) + "px");
      B.style.transform = "translateZ(" + z.toFixed(1) + "px)";
      const h = B.querySelector(".hot");
      if (h) h.style.transform = "translate(-50%,-50%) translateZ(" + (th[i] / 2 + 14).toFixed(1) + "px)";
    });
    SC = 1.34 - 0.34 * open;
    naklon();
    if (gs) { gs.style.width = 30 + 46 * open + "%"; gs.style.opacity = String(0.55 + 0.45 * open); }
    exp.classList.toggle("open", open > 0.35);
  };

  // telefón / tablet na výšku: scéna v normálnom toku — tlačidlo, alebo sa rozloží samo pri zobrazení
  let matOpen = 0, io = null, t = null;
  const text = (k) => (tlac && tlac.getAttribute("data-" + k)) || "";
  const nastavMat = (o) => {
    if (matOpen === o) return;
    matOpen = o;
    rozloz(o);
    if (tlac) {
      tlac.classList.toggle("on", o > 0.5);
      tlac.textContent = o > 0.5 ? text("zlozit") : text("rozlozit");
    }
  };
  if (tlac) tlac.addEventListener("click", () => { clearTimeout(t); nastavMat(matOpen > 0.5 ? 0 : 1); });
  const auto = () => {
    if (io) { io.disconnect(); io = null; }
    clearTimeout(t);
    if (!mq.matches || typeof IntersectionObserver !== "function") return;
    io = new IntersectionObserver((zaznamy) => zaznamy.forEach((z) => {
      clearTimeout(t);
      // 500 ms pauza, nech to nevyskočí hneď pri prelete cez sekciu
      if (z.isIntersecting) t = setTimeout(() => nastavMat(1), 500);
      else nastavMat(0);
    }), { threshold: 0.45 });
    io.observe(exp);
  };
  // PC: prilepená scéna, rozostup podľa scrollu (rovnaká krivka ako titulka: 0–22 % otvára, 86–100 % zatvára)
  const kresli = () => {
    if (mq.matches) return;
    const r = stage.getBoundingClientRect();
    if (r.bottom < -innerHeight || r.top > innerHeight * 2) return;
    const p = postup(stage);
    let o = p < 0.22 ? p / 0.22 : p < 0.86 ? 1 : Math.max(0, 1 - (p - 0.86) / 0.14);
    o = obmedz(o);
    o = o * o * (3 - 2 * o);
    rozloz(o);
    if (prog) prog.style.width = Math.round(o * 100) + "%";
  };
  const plan = naRaf(kresli);
  if (!RM) addEventListener("scroll", plan, { passive: true });
  addEventListener("resize", () => { rozloz(posledne); vysky(); plan(); });
  if (mq.addEventListener) mq.addEventListener("change", () => {
    matOpen = 0;
    rozloz(0);
    if (tlac) { tlac.classList.remove("on"); tlac.textContent = text("rozlozit"); }
    auto();
    plan();
  });
  vysky();
  rozloz(0);
  auto();
  if (!RM) kresli();
}

/* ------------------------------------------------------------------ Porovnanie */
/** Najnižšia cena variantu (Shoptet necessaryVariantData), inak základ z ctx.cena(); null = nevieme. */
function najnizsiaCena(ctx) {
  let min = Infinity;
  const nvd = window.shoptet && window.shoptet.variantsSplit && window.shoptet.variantsSplit.necessaryVariantData;
  if (nvd) Object.keys(nvd).forEach((k) => { const p = Number(nvd[k] && nvd[k].priceUnformatted); if (p > 0 && p < min) min = p; });
  if (min === Infinity && ctx && typeof ctx.cena === "function") {
    const c = ctx.cena();
    if (c && c.zaklad > 0) min = c.zaklad;
  }
  return min === Infinity ? null : min;
}

function porovnanie(sek, oc) {
  const od = sek.querySelector(".p1v-b-od");
  if (!od || !oc.ctx) return;
  // Značka data-p1v-cislo (admin-html/src: „od {}“): číslo a tvar „od 219 €“ dosadí obsah-cisla.js — jeden mechanizmus
  // a jeden tvar ceny pre celý obsah (na Hexa/Stripe cena toho vzoru). Riadok sa ukáže (.ma-cenu), až keď je hodnota
  // zistená; nezistená = riadok ostane skrytý (CSS .p1v-b-od:not(.ma-cenu)).
  const znacka = od.querySelector("[data-p1v-cislo]");
  if (znacka) {
    oc.ked(() => { const st = znacka.getAttribute("data-p1v-stav"); return st === "ok" || st === "bez" ? st : null; },
      () => od.classList.add("ma-cenu"), { limit: 15000 });
    return;
  }
  // staršie HTML bez značky: najnižšia cena variantu zo Shoptetu
  oc.ked(() => najnizsiaCena(oc.ctx), (cena) => {
    od.textContent = "od " + oc.ctx.formatCena(cena);
    od.classList.add("ma-cenu");
  }, { limit: 8000 });
}

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const ocak = oc.sekcia("b-ocakavat");
  const mat = oc.sekcia("b-material");
  const por = oc.sekcia("b-porovnanie");
  const pp = oc.sekcia("b-predapo");
  if (!ocak && !mat && !por && !pp) return;
  const mq = matchMedia(MQ_STATICKA);
  const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  if (ocak) devatVeci(ocak, mq);
  if (mat) material(mat, mq, RM);
  if (por) porovnanie(por, oc); // reveal .rv robí spoločne obsah.js
  if (pp) lxModulyOziv(lcdMultiKoren([pp]), false);
}
