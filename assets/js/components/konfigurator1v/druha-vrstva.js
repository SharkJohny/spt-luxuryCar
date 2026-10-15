// Ponuka druhej vrstvy na jednovrstvových (598 Diamond, 610 Hexa, 613 Stripe) — Michal 14. 10. 2026. JADRO (vydanie):
// TYPY.jedno.moduly (produkty.js), beží len pod body.lcd-1v (brána v index.js). Návrh: druha-vrstva.html (texty, dlaždice),
// texty v typy/jedno.js „druha“, CSS assets/css/_lcd1v-druha.scss (blok LCD-1V-DRUHA).
//
// Rozhodnutia Michala (14. 10. 2026):
//   - karta sa ukáže hneď po kroku Farba (keď je farba zvolená) ako SKRYTÝ krok BEZ čísla: „Krok N z 6“, postup a počty
//     krokov sa nemenia (karta nie je v ctx.produkt.kroky ani v lcdGetSteps -> validácia košíka sa nemení),
//   - nepovinná: bez odpovede = Nie; „Pokračujte ďalej“ vo Farbe ju otvorí (kým nie je zodpovedaná), inak nič neblokuje,
//   - zlatá dlaždica s reálnou fotkou dvojvrstvového koberca a príplatkom „+ N €“ rátaným živo (cena dvojvrstvového
//     produktu pri tých istých voľbách − cena tejto stránky; chyba siete = cena sa neukáže),
//   - Michal 15. 10. 2026 („ani neviem, že na to môžem kliknúť“): v dlaždici je skutočné zlaté TLAČIDLO „Áno, chcem druhú
//     vrstvu“ (<button>, klávesnica). Dlaždica je obyčajný <div> a klik na ňu (fotka, text) robí to isté — tlačidlá sa do
//     seba nevnárajú, takže klávesnicou sa ide len na tlačidlo,
//   - zelené tlačidlo „Nie, ďakujem“ = hlavná cesta: karta sa zbalí („Bez druhej vrstvy“) a otvorí sa Rozloženie,
//   - „Áno“: krátka správa v karte, tlačidlá sa zablokujú, výber sa zapíše do kľúča prenosu (prenos.js) a otvorí sa
//     dvojvrstvový produkt toho istého vzoru (598 -> 601, 610 -> 604, 613 -> 607; register produkty.js).
// Nič s atribútom name, žiadny zápis do formulára: karta je nový prvok v .content-wrap BEZ tried .position-wrap /
// .parameter-wrap. Bez flagu nič (brána).
import { najdiProdukt, jeZapnutyTyp } from "./produkty.js";
import { priplatkyProduktu } from "./ceny-ine.js";
import { PARAMETRE } from "./ctx.js";
import { zapisPrenos } from "./prenos.js";
import { lcdGetSteps, lcdFirstUnfilled } from "../../functions/configuratorEngine.js";

export const MENO = "druha-vrstva";

const NBSP = " ";

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}
function nastavText(e, text) {
  if (e && e.textContent !== text) e.textContent = text;
}
function prepni(e, trieda, stav) {
  if (e && e.classList.contains(trieda) !== !!stav) e.classList.toggle(trieda, !!stav);
}
const cisty = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

function vyskaHlavicky() {
  const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (let i = 0; i < sels.length; i++) {
    const e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight;
  }
  return 0;
}
/** Rovnako ako kroky.js po „Pokračujte ďalej“: otvorená karta pod hlavičku webu, ak nie je v hornej polovici okna. */
function posunNa(e) {
  if (!e || !e.isConnected) return;
  const hH = vyskaHlavicky();
  const top = e.getBoundingClientRect().top;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (top < hH + 8 || top > hH + (vh - hH) * 0.5) window.scrollTo({ top: Math.max(0, Math.round(window.pageYOffset + top - hH - 12)), behavior: "instant" });
}

/**
 * Cena dvojvrstvového produktu pri tých istých voľbách (mapa = mapaZFormulara jeho stránky, ceny-ine.js):
 * variant s tou istou farbou 1. vrstvy (najlacnejšia farba 2. vrstvy, ktorá nie je vypredaná) + rovnaké príplatky.
 * Čokoľvek nesedí (farba alebo hodnota príplatku na cieli nie je) -> null (cena sa neukáže).
 */
export function cenaNaCieli(mapa, farba, priplatky) {
  if (!mapa || !mapa.kom || !mapa.vpar || !mapa.params || !farba) return null;
  const idF = Object.keys(mapa.vpar).find((id) => PARAMETRE.farba.test(String(mapa.vpar[id].n || "").trim()));
  if (!idF) return null;
  let variant = null;
  Object.keys(mapa.kom).forEach((kluc) => {
    const e = mapa.kom[kluc];
    if (!e || e.x || typeof e.c !== "number" || !isFinite(e.c)) return;
    const casti = kluc.split("-");
    for (let i = 0; i + 1 < casti.length; i += 2) {
      if (casti[i] === idF && casti[i + 1] === String(farba)) { if (variant == null || e.c < variant) variant = e.c; break; }
    }
  });
  if (variant == null) return null;
  let spolu = variant;
  for (let i = 0; i < priplatky.length; i++) {
    const x = priplatky[i];
    let p = mapa.params[x.id];
    if (!p || cisty(p.n) !== cisty(x.meno)) p = Object.keys(mapa.params).map((id) => mapa.params[id]).find((q) => cisty(q.n) === cisty(x.meno)) || p;
    const o = p && p.o && p.o[x.hodnota];
    if (!o) return null;
    const c = Number(o.fp) > 0 ? Number(o.fp) : Number(o.ap) || 0;
    spolu += c;
  }
  return Math.round(spolu * 100) / 100;
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  if (!ctx.produkt || ctx.produkt.typ !== "jedno") return;
  // cieľ = dvojvrstvový produkt toho istého vzoru; len keď sa pri aktuálnom flagu otvorí v novom vzhľade (inak by
  // zákazník pristál v starom vzhľade bez prenosu)
  const ciel = najdiProdukt(ctx.projectId, "dvoj", ctx.produkt.vzor);
  let flag = null;
  try { flag = sessionStorage.getItem("lcd1v"); } catch (e) { flag = null; }
  if (!ciel || !(flag === "vyvoj" || jeZapnutyTyp("dvoj"))) return;
  const T = ctx.texty("druha");
  const farba = ctx.krok("farba");
  const form = ctx.form();
  if (!T.ti || !farba || !form || !farba.parentNode) return;
  if (form.querySelector(".lcd1v-druha")) return; // už postavené

  // ---------------------------------------------------------------- karta (bez čísla, bez name)
  const karta = el("div", "lcd1v-krok lcd1v-druha");
  karta.hidden = true;
  karta.setAttribute("role", "group");
  karta.setAttribute("aria-label", T.nm);
  const hd = el("button", "lcd1v-hd");
  hd.type = "button";
  hd.setAttribute("aria-expanded", "false");
  const no = el("span", "lcd1v-no");
  no.setAttribute("aria-hidden", "true");
  const tx = el("span", "lcd1v-tx");
  tx.appendChild(el("span", "lcd1v-ey", T.nm));
  tx.appendChild(el("span", "lcd1v-nm", T.nm));
  tx.appendChild(el("span", "lcd1v-ti", T.ti));
  const vy = el("span", "lcd1v-vy", T.vy);
  tx.appendChild(vy);
  hd.appendChild(no);
  hd.appendChild(tx);
  hd.appendChild(el("span", "lcd1v-zm", "Zmeniť"));
  karta.appendChild(hd);
  if (T.pod) karta.appendChild(el("p", "lcd1v-pod", T.pod));

  // zlatá dlaždica (vzhľad kariet kroku Rohož do kufra: .lcd1v-kb__karta) — <div>, nie <button>: vnútri je skutočné
  // tlačidlo „Áno“ (tlačidlo v tlačidle HTML nedovolí); klik kamkoľvek do dlaždice = to isté ako tlačidlo
  const volby = el("div", "lcd1v-kb lcd1v-druha__volby");
  const dlazdica = el("div", "lcd1v-kb__karta lcd1v-kb__karta--naj lcd1v-druha__dlazdica");
  dlazdica.appendChild(el("span", "lcd1v-kb__top", T.naj));
  const fot = el("span", "lcd1v-kb__fot");
  const img = el("img");
  const src = ctx.obrazokVzoru("druha-ano");
  if (src) img.src = src;
  img.alt = (T.ano && T.ano.alt) || "";
  img.width = 400;
  img.height = 300;
  img.loading = "lazy";
  img.decoding = "async";
  fot.appendChild(img);
  dlazdica.appendChild(fot);
  const atx = el("span", "lcd1v-kb__tx");
  atx.appendChild(el("span", "lcd1v-kb__nm", T.ano.nm));
  if (T.ano.po) atx.appendChild(el("span", "lcd1v-kb__po", T.ano.po));
  atx.appendChild(el("span", "lcd1v-kb__ben", T.ano.ben));
  const ucet = el("span", "lcd1v-kb__ucet");
  ucet.hidden = true;
  const riadok = el("span", "lcd1v-kb__r lcd1v-kb__r--sum");
  riadok.appendChild(el("span", "lcd1v-kb__rn", T.priplatok));
  const suma = el("span", "lcd1v-kb__rh lcd1v-druha__suma");
  riadok.appendChild(suma);
  ucet.appendChild(riadok);
  atx.appendChild(ucet);
  dlazdica.appendChild(atx);
  // zlaté tlačidlo „Áno“ = doplnok (zelené „Nie“ pod dlaždicou je hlavná cesta)
  const ano = el("button", "lcd1v-druha__ano", T.ano.tl);
  ano.type = "button";
  dlazdica.appendChild(ano);
  volby.appendChild(dlazdica);
  karta.appendChild(volby);

  // správa pri prenose
  const prenos = el("div", "lcd1v-druha__prenos");
  prenos.hidden = true;
  prenos.setAttribute("role", "status");
  const toc = el("span", "lcd1v-druha__toc");
  toc.setAttribute("aria-hidden", "true");
  const ptx = el("span", "lcd1v-druha__prenos-t");
  ptx.appendChild(el("b", null, T.prenos));
  const pVyber = el("span", "lcd1v-druha__prenos-vyber");
  ptx.appendChild(pVyber);
  prenos.appendChild(toc);
  prenos.appendChild(ptx);
  karta.appendChild(prenos);

  // zelené „Nie, ďakujem“ = hlavná cesta (vzhľad „Pokračujte ďalej“), pod ním veta z návrhu
  const nie = el("button", "lcd1v-druha__nie", T.nie.nm);
  nie.type = "button";
  karta.appendChild(nie);
  if (T.nie.pozn) karta.appendChild(el("p", "lcd1v-pozn", T.nie.pozn));

  farba.parentNode.insertBefore(karta, farba.nextSibling);

  // ---------------------------------------------------------------- stav
  const stav = { odpoved: null, prenos: false, mapa: undefined, nacitava: false };
  const nastavOtvoreny = (e, on) => {
    if (typeof window.__lcdSetStepOpen === "function") window.__lcdSetStepOpen(e, on);
    else e.classList.toggle("active", on);
  };
  const farbaVyplnena = () => !!ctx.vyplneny(farba);

  function otvor(posun) {
    lcdGetSteps().forEach((s) => { if (s.classList.contains("active")) nastavOtvoreny(s, false); });
    karta.classList.add("active");
    hd.setAttribute("aria-expanded", "true");
    nacitajCenu();
    obnov();
    if (posun) {
      setTimeout(() => posunNa(karta), 0);
      setTimeout(() => posunNa(karta), 380); // zatvorenie kroku nad ňou mení výšku (prechod ~300 ms)
    }
  }
  function zatvor() {
    karta.classList.remove("active");
    hd.setAttribute("aria-expanded", "false");
  }

  /** Príplatky zvolené na tejto stránke (rovnaká množina ako ctx.cena()): [{ id, meno, hodnota }]. */
  function zvolenePriplatky() {
    const out = [];
    form.querySelectorAll("select.surcharge-parameter").forEach((s) => {
      if (!s.value || s.value === "0") return;
      out.push({ id: s.getAttribute("data-parameter-id"), meno: s.getAttribute("data-parameter-name") || "", hodnota: s.value });
    });
    return out;
  }
  function obnovCenu() {
    const p = ctx.parameter("farba");
    const v = p ? p.select.value : "";
    const tu = ctx.cena();
    const tam = stav.mapa ? cenaNaCieli(stav.mapa, v, zvolenePriplatky()) : null;
    const rozdiel = tam != null && tu && tu.spolu > 0 ? Math.round((tam - tu.spolu) * 100) / 100 : null;
    const ok = rozdiel != null && rozdiel > 0;
    if (ok) nastavText(suma, "+" + NBSP + ctx.formatCena(rozdiel));
    if (ucet.hidden === ok) ucet.hidden = !ok;
    if (ok) ano.setAttribute("data-lcd1v-priplatok", String(rozdiel));
    else ano.removeAttribute("data-lcd1v-priplatok");
  }
  function nacitajCenu() {
    if (stav.mapa !== undefined || stav.nacitava) return;
    stav.nacitava = true;
    priplatkyProduktu(ciel.url).then(function (mapa) {
      stav.mapa = mapa || null;
    }, function () {
      stav.mapa = null;
    }).then(function () {
      stav.nacitava = false;
      naplanuj();
    });
  }

  function obnov() {
    naplanovane = false;
    const vid = farbaVyplnena() || stav.prenos;
    if (karta.hidden === vid) karta.hidden = !vid;
    if (vid) nacitajCenu();
    const hotova = stav.odpoved === "nie" || stav.prenos;
    prepni(karta, "lcd1v-hotovy", hotova);
    prepni(karta, "lcd1v-druha--prenos", stav.prenos);
    nastavText(vy, stav.odpoved === "nie" ? T.vyNie : T.vy);
    obnovCenu();
  }
  let naplanovane = false;
  function naplanuj() {
    if (naplanovane) return;
    naplanovane = true;
    setTimeout(obnov, 30);
  }

  // ---------------------------------------------------------------- akcie
  hd.addEventListener("click", function () {
    if (stav.prenos) return;
    if (karta.classList.contains("active")) zatvor();
    else otvor(false);
    obnov();
  });

  nie.addEventListener("click", function () {
    if (stav.prenos) return;
    stav.odpoved = "nie";
    zatvor();
    // hlavná cesta: ďalší živý krok po Farbe (ako „Pokračujte ďalej“ živého enginu), cena sa nemení
    const kroky = lcdGetSteps();
    const i = kroky.indexOf(farba);
    const dalsi = i > -1 ? kroky[i + 1] : ctx.krok("rozlozenie");
    if (dalsi) {
      kroky.forEach((s) => { if (s !== dalsi && s.classList.contains("active")) nastavOtvoreny(s, false); });
      if (!dalsi.classList.contains("active")) nastavOtvoreny(dalsi, true);
      setTimeout(() => posunNa(dalsi), 0);
      setTimeout(() => posunNa(dalsi), 380);
    }
    obnov();
  });

  // tlačidlo „Áno“ (myš, Enter, medzerník) aj klik kamkoľvek do dlaždice: klik na tlačidlo prebuble do dlaždice -> jeden poslucháč
  dlazdica.addEventListener("click", function () {
    if (stav.prenos) return;
    stav.prenos = true;
    stav.odpoved = "ano";
    ano.disabled = true;
    nie.disabled = true;
    hd.disabled = true;
    const riadky = ["vzor", "auto", "farba"].map((m) => {
      const k = form.querySelector(".lcd1v-k-" + m + " > .lcd1v-hd .lcd1v-vy");
      return k ? k.textContent.replace(/\s+/g, " ").trim() : "";
    }).filter(Boolean);
    nastavText(pVyber, riadky.join(" · "));
    prenos.hidden = false;
    obnov();
    zapisPrenos(ctx, ciel.id); // zakázané úložisko: prechod aj tak (prenesie sa nanajvýš auto)
    setTimeout(function () { window.location.assign(ciel.url); }, 450);
  });

  // „Pokračujte ďalej“ vo Farbe: kým nie je otázka zodpovedaná, otvorí kartu namiesto Rozloženia. Nevyplnená farba
  // (alebo krok pred ňou) = živá validácia ako doteraz (červený rám). Capture na document -> živý engine nebeží.
  document.addEventListener("click", function (e) {
    const t = e.target;
    const b = t && t.closest && t.closest(".lcd1v-k-farba > .next-step-button");
    if (!b || b.parentNode !== farba || !document.body.classList.contains("lcd-1v")) return;
    if (stav.odpoved || stav.prenos) return;
    const kroky = lcdGetSteps();
    const i = kroky.indexOf(farba);
    if (i < 0 || lcdFirstUnfilled(i)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    karta.hidden = false;
    otvor(true);
  }, true);

  // otvorený živý krok (hlavička, „Pokračujte ďalej“, validácia košíka) -> karta sa zatvorí (jedna otvorená karta)
  const mo = new MutationObserver(function () {
    if (!karta.classList.contains("active")) return;
    if (lcdGetSteps().some((s) => s.classList.contains("active"))) { zatvor(); naplanuj(); }
  });
  lcdGetSteps().forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
  // výber farby (živá trieda .active na vzorke) -> karta sa ukáže
  const fow = farba.querySelector(":scope > .options-wrap");
  if (fow) new MutationObserver(naplanuj).observe(fow, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // zmeny výberu a ceny -> príplatok „+ N €“
  const $ = window.jQuery || window.$;
  if ($) $(form).on("change", "select", naplanuj);
  else form.addEventListener("change", naplanuj);
  document.addEventListener("LuxuryCarPriceRecalculated", naplanuj);
  document.addEventListener("ShoptetVariantChange", naplanuj);
  ctx.na("zmena", naplanuj);

  // Safari bfcache (Späť bez nového načítania): karta znova nezodpovedaná, tlačidlá odblokované
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    stav.prenos = false;
    stav.odpoved = null;
    ano.disabled = false;
    nie.disabled = false;
    hd.disabled = false;
    prenos.hidden = true;
    zatvor();
    obnov();
  });

  obnov();
}
