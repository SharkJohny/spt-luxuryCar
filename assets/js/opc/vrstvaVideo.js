// Druhá vrstva v ponuke „Doplňte svoj set“ v pokladni (lcdKosikDoplnok.js kartaVybrat) — živé video namiesto fotky.
// Michal 1. 11. 2026 (kolo 4, „1 to sa mi páči, to tam daj“): čierna fotka druhej vrstvy „vyzerá ako niečo čierne,
// človek vôbec nechápe“ -> v riadku sa samo prehráva krátke video (bez zvuku), ťuknutie ho otvorí na celú obrazovku
// ako príbeh (obe videá z konfigurátora za sebou) s vetou, „8 z 10“ a zlatým „Pridať druhú vrstvu“.
// Náhľady: /mnt/project-files/kosik-navrhy/video-3-sposoby-*.png (variant 1 + po ťuknutí variant 3).
//
// Dlaždica (videoDlazdica):
//   - <button> s <video muted playsinline preload=none> a pásikom priebehu; nič sa nesťahuje, kým nie je dlaždica
//     aspoň z polovice na obrazovke (IntersectionObserver) — až vtedy sa pridajú <source> (webm, mp4) a spustí sa;
//     mimo obrazovky pauza. Prehráva sa len úsek ZACIATOK–KONIEC (voda na vrstve a umývanie), nie tmavý začiatok.
//   - Šetrenie dát (navigator.connection.saveData) alebo „menej pohybu“ (prefers-reduced-motion) -> len záber + ▶,
//     video sa nesťahuje, kým zákazník neťukne.
//   - Karta sa po výmene doplnku prekreslí (stará dlaždica zmizne z DOM) -> hrajúce video sa samo zastaví
//     (timeupdate kontroluje isConnected) a observer sa odpojí.
// Príbeh (otvorPribeh): celá obrazovka (PC: stĺpec 420 px v strede), role=dialog, fokus na ×, Tab ostáva vnútri,
// Esc / × / tlačidlo Späť v prehliadači (history.pushState) zavrú, fokus sa vráti na dlaždicu; ťuknutie vpravo =
// ďalšie video, vľavo = predchádzajúce; po poslednom znova prvé. „Pridať druhú vrstvu“ zavrie príbeh a otvorí výber
// farby v riadku (o.pridat). Stránka pod príbehom sa neroluje (trieda lcd-vyb-pribeh na <html>).
// Súbory: assets/img/1v/druha-video-vapka|pribeh .webm/.mp4/-poster.jpg (konfigurátor), assets/img/kosik/vrstva-video.jpg
// (záber dlaždice, 4,5 s videa vapka). Štýly: assets/css/_lcdOpc.scss blok „druhá vrstva s videom“.
// Testy: tools/test-kosik-doplnok.mjs (videoDlazdica/otvorPribeh), tools/test-opc/scenare-jedna.mjs S61.

const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/";
export const VIDEA = [
  { meno: "druha-video-vapka", alt: "vybVideoAlt" },
  { meno: "druha-video-pribeh", alt: "vybVideoAlt2" },
];
export const DLAZDICA_POSTER = CDN + "kosik/vrstva-video.jpg";
// úsek videa vapka v dlaždici (s): kvapka vody na vrstve a umývanie tlakovou vodou
export const ZACIATOK = 3.2;
export const KONIEC = 9.8;

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

/** Bez zvuku, v stránke (iPhone), bez ovládania a bez sťahovania vopred. */
function noveVideo(trieda, poster) {
  const v = document.createElement("video");
  v.className = trieda;
  v.muted = true;
  v.defaultMuted = true;
  v.setAttribute("muted", "");
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.setAttribute("webkit-playsinline", "");
  v.setAttribute("disablepictureinpicture", "");
  v.setAttribute("disableremoteplayback", "");
  v.preload = "none";
  if (poster) v.poster = poster;
  return v;
}

/** Nastaví zdroje (webm, mp4) a načíta. priecinok = podpriečinok assets/img/ (predvolene 1v/). */
function zdroje(v, meno, priecinok) {
  const cesta = CDN + (priecinok || "1v/") + meno;
  while (v.firstChild) v.removeChild(v.firstChild);
  v.appendChild(el("source", { src: cesta + ".webm", type: "video/webm" }));
  v.appendChild(el("source", { src: cesta + ".mp4", type: "video/mp4" }));
  v.dataset.meno = meno;
  try { v.load(); } catch (e) { /* starý prehliadač */ }
}

/** Spustí video; zakázané automatické prehrávanie (napr. iPhone v režime úspory energie) -> nezdar() */
function hraj(v, nezdar) {
  try {
    const p = v.play();
    if (p && p.catch) p.catch(function (e) { if (nezdar && !(e && e.name === "AbortError")) nezdar(); });
  } catch (e) { if (nezdar) nezdar(); }
}

/** Šetriť dáta alebo pohyb -> video sa samo nespúšťa. */
export function bezAutoplay() {
  try {
    if (navigator.connection && navigator.connection.saveData) return true;
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) { return false; }
}

/**
 * Dlaždica s videom pre riadok druhej vrstvy. T = texty trhu (vybVideoOtvor, vybVideoAlt, …), o.otvor() = otvoriť
 * príbeh, o.forma = id pomocného formulára (atribút form). -> { el, video, zastav }
 */
export function videoDlazdica(T, o) {
  const staticke = bezAutoplay();
  const video = noveVideo("lcd-vyb__vid-video", DLAZDICA_POSTER);
  video.setAttribute("aria-hidden", "true");
  const lis = el("b");
  // form = pomocný formulár karty (ako ostatné tlačidlá kartaVybrat), aby tlačidlo nepatrilo k #order-form
  const tl = el("button", { type: "button", class: "lcd-vyb__vid" + (staticke ? " lcd-vyb__vid--staticke" : ""), "aria-label": T.vybVideoOtvor, "data-lcd-vyb-video": "", form: o.forma || null }, [
    video,
    el("span", { class: "lcd-vyb__vid-lis", "aria-hidden": "true" }, [lis]),
    el("span", { class: "lcd-vyb__vid-play", "aria-hidden": "true" }),
  ]);
  let io = null;
  let vidno = false;
  const zastav = function () {
    vidno = false;
    try { video.pause(); } catch (e) {}
    if (io) { io.disconnect(); io = null; }
  };
  video.addEventListener("loadedmetadata", function () {
    try { if (video.currentTime < ZACIATOK) video.currentTime = ZACIATOK; } catch (e) {}
  });
  video.addEventListener("timeupdate", function () {
    if (!tl.isConnected) { zastav(); return; }
    const t = video.currentTime;
    if (t >= KONIEC) { try { video.currentTime = ZACIATOK; } catch (e) {} }
    lis.style.width = Math.max(0, Math.min(100, ((t - ZACIATOK) / (KONIEC - ZACIATOK)) * 100)).toFixed(1) + "%";
  });
  video.addEventListener("ended", function () { try { video.currentTime = ZACIATOK; } catch (e) {} if (vidno) hraj(video); });
  const spusti = function () {
    if (!video.dataset.meno) zdroje(video, VIDEA[0].meno);
    // prehliadač nedovolil hrať -> ostane záber, pridá sa ▶, aby bolo jasné, že je to video
    hraj(video, function () { tl.classList.add("lcd-vyb__vid--staticke"); });
  };
  if (!staticke && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!tl.isConnected) { zastav(); return; }
        vidno = z.isIntersecting && z.intersectionRatio >= 0.5;
        if (vidno && !document.documentElement.classList.contains("lcd-vyb-pribeh")) spusti();
        else { try { video.pause(); } catch (e) {} }
      });
    }, { threshold: [0, 0.5] });
    io.observe(tl);
  } else if (!staticke) tl.classList.add("lcd-vyb__vid--staticke"); // starý prehliadač bez IntersectionObserver: záber + ▶
  tl.addEventListener("click", function () {
    try { video.pause(); } catch (e) {}
    o.otvor(tl, function () { if (vidno && !staticke && tl.isConnected) spusti(); });
  });
  return { el: tl, video: video, zastav: zastav };
}

// ------------------------------------------------------------------ rohož a box do kufra
// Michal 2. 11. 2026: „aj rohož do kufra, aj box do kufra … ako video“ — namiesto fotky krátke slučkové video
// poskladané z našich fotiek (tools/kosik-videa.py; Michal 6. 11. 2026: rohoz-dno = kufor bez rohože -> rohož na dno, lebo
// príplatok je rohož na dno, nie Premium; box-poriadok = veci po podlahe -> veci v boxoch -> zatvorené boxy; tapacir-dvere =
// dvere v kamióne, bez loga Scania a vikinga), 288 × 360, bez zvuku. Len ozdoba ako fotka predtým (nie tlačidlo, ťuknutie
// nič nerobí), sťahuje sa až keď je riadok z polovice na obrazovke, mimo obrazovky pauza. Šetrenie dát / menej
// pohybu / zakázané prehrávanie -> ostane záber (poster = prvý záber videa).
export const PRODUKT_VIDEA = { rohoz: "rohoz-dno", box: "box-poriadok", tapacir: "tapacir-dvere" };

/** Dlaždica s videom pre riadok rohože, boxu a tapacíru (kluc z PRODUKT_VIDEA). -> { el, video, zastav } */
export function produktDlazdica(kluc) {
  const meno = PRODUKT_VIDEA[kluc];
  const staticke = bezAutoplay();
  const video = noveVideo("lcd-vyb__vid-video", CDN + "kosik/" + meno + ".jpg");
  video.loop = true;
  video.setAttribute("loop", "");
  video.setAttribute("aria-hidden", "true");
  const lis = el("b");
  const t = el("span", { class: "lcd-vyb__vid lcd-vyb__vid--produkt" + (staticke ? " lcd-vyb__vid--staticke" : ""), "aria-hidden": "true", "data-lcd-vyb-produkt-video": kluc }, [
    video,
    el("span", { class: "lcd-vyb__vid-lis" }, [lis]),
  ]);
  let io = null;
  const zastav = function () {
    try { video.pause(); } catch (e) {}
    if (io) { io.disconnect(); io = null; }
  };
  video.addEventListener("timeupdate", function () {
    if (!t.isConnected) { zastav(); return; }
    const d = video.duration;
    if (d > 0) lis.style.width = Math.min(100, (video.currentTime / d) * 100).toFixed(1) + "%";
  });
  if (!staticke && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!t.isConnected) { zastav(); return; }
        if (z.isIntersecting && z.intersectionRatio >= 0.5 && !document.documentElement.classList.contains("lcd-vyb-pribeh")) {
          if (!video.dataset.meno) zdroje(video, meno, "kosik/");
          hraj(video, function () { t.classList.add("lcd-vyb__vid--staticke"); });
        } else { try { video.pause(); } catch (e) {} }
      });
    }, { threshold: [0, 0.5] });
    io.observe(t);
  } else if (!staticke) t.classList.add("lcd-vyb__vid--staticke");
  return { el: t, video: video, zastav: zastav };
}

// ------------------------------------------------------------------ príbeh na celú obrazovku
let P = null; // jeden príbeh na stránku, postaví sa pri prvom otvorení

function postav(T) {
  const video = noveVideo("lcd-vyb-pribeh__video", null);
  const lisy = VIDEA.map(function () { return el("span", {}, [el("b")]); });
  const x = el("button", { type: "button", class: "lcd-vyb-pribeh__x", "aria-label": T.vybPribehZavriet, "data-lcd-vyb-pribeh-x": "" }, [el("span", { "aria-hidden": "true", text: "×" })]);
  const poradie = el("small");
  const predch = el("button", { type: "button", class: "lcd-vyb-pribeh__predch", "aria-label": T.vybPribehPredch });
  const dalej = el("button", { type: "button", class: "lcd-vyb-pribeh__dalej", "aria-label": T.vybPribehDalej }, [el("span", { "aria-hidden": "true", text: "›" })]);
  const pridat = el("button", { type: "button", class: "lcd-vyb-pribeh__pridat", "data-lcd-vyb-pribeh-pridat": "" });
  const pocet = el("p", { class: "lcd-vyb-pribeh__pocet" }, [el("b", { text: T.vybPribehPocet[0] }), " " + T.vybPribehPocet[1]]);
  const idNadpisu = "lcd-vyb-pribeh-nadpis";
  const panel = el("div", { class: "lcd-vyb-pribeh__panel", role: "dialog", "aria-modal": "true", "aria-labelledby": idNadpisu }, [
    el("div", { class: "lcd-vyb-pribeh__lisy", "aria-hidden": "true" }, lisy),
    el("div", { class: "lcd-vyb-pribeh__hlava" }, [
      el("span", { class: "lcd-vyb-pribeh__logo", "aria-hidden": "true", text: "LCD" }),
      el("span", { class: "lcd-vyb-pribeh__meno" }, [el("b", { id: idNadpisu, text: T.vybPribehNadpis }), poradie]),
      x,
    ]),
    el("div", { class: "lcd-vyb-pribeh__obraz" }, [video, predch, dalej]),
    el("div", { class: "lcd-vyb-pribeh__spodok" }, [el("p", { class: "lcd-vyb-pribeh__text", text: T.vybPribehText }), pocet, pridat]),
  ]);
  const koren = el("div", { class: "lcd-vyb-pribeh", hidden: true }, [el("div", { class: "lcd-vyb-pribeh__pozadie", "data-lcd-vyb-pribeh-pozadie": "" }), panel]);
  document.body.appendChild(koren);
  P = { T: T, koren: koren, panel: panel, video: video, lisy: lisy, x: x, poradie: poradie, predch: predch, dalej: dalej, pridat: pridat,
    i: 0, otvoreny: false, spat: null, poZatvoreni: null, onPridat: null, historia: false };

  video.addEventListener("timeupdate", function () {
    const d = video.duration;
    if (d > 0) P.lisy[P.i].firstChild.style.width = Math.min(100, (video.currentTime / d) * 100).toFixed(1) + "%";
  });
  video.addEventListener("ended", function () { ukaz((P.i + 1) % VIDEA.length); });
  x.addEventListener("click", function () { zatvor(); });
  koren.querySelector("[data-lcd-vyb-pribeh-pozadie]").addEventListener("click", function () { zatvor(); });
  predch.addEventListener("click", function () { ukaz(P.i > 0 ? P.i - 1 : 0); });
  dalej.addEventListener("click", function () { ukaz((P.i + 1) % VIDEA.length); });
  pridat.addEventListener("click", function () {
    const f = P.onPridat, po = P.poZatvoreni;
    P.poZatvoreni = function () { if (po) po(); if (f) f(); };
    zatvor();
  });
  koren.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); zatvor(); return; }
    if (e.key === "ArrowRight") { ukaz((P.i + 1) % VIDEA.length); return; }
    if (e.key === "ArrowLeft") { ukaz(P.i > 0 ? P.i - 1 : 0); return; }
    if (e.key !== "Tab") return;
    const f = [x, predch, dalej, pridat].filter(function (b) { return b.offsetParent !== null; });
    const prvy = f[0], posledny = f[f.length - 1];
    if (e.shiftKey && document.activeElement === prvy) { e.preventDefault(); posledny.focus(); }
    else if (!e.shiftKey && document.activeElement === posledny) { e.preventDefault(); prvy.focus(); }
  });
  window.addEventListener("popstate", function () { if (P.otvoreny && P.historia) { P.historia = false; zatvor(true); } });
}

function ukaz(i) {
  P.i = i;
  P.lisy.forEach(function (s, j) { s.firstChild.style.width = j < i ? "100%" : "0%"; });
  P.poradie.textContent = (i + 1) + " / " + VIDEA.length;
  P.video.poster = CDN + "1v/" + VIDEA[i].meno + "-poster.jpg";
  P.video.setAttribute("aria-label", P.T[VIDEA[i].alt]);
  zdroje(P.video, VIDEA[i].meno);
  hraj(P.video);
}

/**
 * Otvorí príbeh. T = texty trhu, o: { spat (prvok na fokus po zatvorení), cena („+147 €“), pridat() }, poZatvoreni().
 */
export function otvorPribeh(T, o, poZatvoreni) {
  if (!P) postav(T);
  if (P.otvoreny) return;
  P.T = T;
  P.spat = o.spat || null;
  P.onPridat = o.pridat || null;
  P.poZatvoreni = poZatvoreni || null;
  P.pridat.textContent = T.vybPribehPridat + (o.cena ? " · " + o.cena : "");
  P.koren.hidden = false;
  P.otvoreny = true;
  document.documentElement.classList.add("lcd-vyb-pribeh");
  try { history.pushState({ lcdVybPribeh: 1 }, ""); P.historia = true; } catch (e) { P.historia = false; }
  ukaz(0);
  try { P.x.focus({ preventScroll: true }); } catch (e) { P.x.focus(); }
}

/** Zatvorí príbeh (zPopstate = už sa vrátilo v histórii). */
export function zatvor(zPopstate) {
  if (!P || !P.otvoreny) return;
  P.otvoreny = false;
  try { P.video.pause(); } catch (e) {}
  while (P.video.firstChild) P.video.removeChild(P.video.firstChild);
  delete P.video.dataset.meno;
  try { P.video.removeAttribute("src"); P.video.load(); } catch (e) {}
  P.koren.hidden = true;
  document.documentElement.classList.remove("lcd-vyb-pribeh");
  const spat = P.spat;
  if (spat && spat.isConnected) { try { spat.focus({ preventScroll: true }); } catch (e) { spat.focus(); } }
  const f = P.poZatvoreni;
  P.poZatvoreni = null;
  if (zPopstate || !P.historia) { if (f) f(); return; }
  // náš záznam v histórii preč; prehliadač po návrate obnoví rolovanie -> otvorenie výberu farby až potom
  P.historia = false;
  let hotovo = false;
  const dalej = function () { if (hotovo) return; hotovo = true; window.removeEventListener("popstate", dalej); if (f) f(); };
  window.addEventListener("popstate", dalej);
  setTimeout(dalej, 400);
  try { history.back(); } catch (e) { dalej(); }
}

/** Pre testy. */
export function stavPribehu() { return P ? { otvoreny: P.otvoreny, i: P.i, historia: P.historia } : null; }
