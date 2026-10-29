// Titulka SK/CZ — sekcia „06 — Čo hovoria naši zákazníci“ (29. 10. 2026, Michal: číslo a karty z aktuálnych dát).
//
// Web bez prekrývania: celá sekcia je HTML v admine (banner hp-telo-1, generuje tools/hp-recenzie.mjs z reviews-data.js:
// počet, hodnotenie, 12 kariet = 3 najnovšie výrazné + Michalov výber, dátumy „mesiac rok“). Tento modul ju len OŽIVÍ,
// keď sa sekcia priblíži k oknu a prídu aktuálne dáta (functions/lcdRecenzieData.js — spoločný súbor assets/data/):
//   - počet recenzií a hodnotenie v hlavičke podľa dát (Google pribúdajú recenzie aj medzi úpravami adminu),
//   - recenzie NOVŠIE než HTML (id vyššie než data-lcd-rec-max sekcie) pridá na začiatok pásu, pred prvú kartu HTML
//     (data-lcd-rec-prvy) — najviac 3, najnovšia prvá; len výrazné (vyraznaRecenzia: 5★, text ≥ 120 znakov alebo
//     fotky + text ≥ 40), rovnako ako generátor HTML — krátka recenzia by nechala prvú kartu skoro prázdnu.
// Nič neskrýva, nemaže ani neprepisuje karty z adminu. Bez dát (výpadok CDN) alebo s dátami staršími než HTML
// (place.fetchedAt pred data-lcd-rec-stav — napr. záloha zo staršej verzie bundla) ostane HTML z adminu, ako je.
import { nacitajRecenzie } from "./lcdRecenzieData.js";
import {
  NAJNOVSICH, cisloId, cislo1, datumRecenzie, fotkyKarty, iniciala, nahladRecenzie, najnovsie, riadokPoctu,
  textRecenzie, vyraznaRecenzia,
} from "./lcdRecenzie.js";

function prvok(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Karta ako v admin HTML (tools/hp-recenzie.mjs kartaHtml): úvodzovka, hviezdy, text, fotky, päta s menom a dátumom. */
function karta(r, g, fetchedAt, trh) {
  const a = prvok("article", "rev");
  a.setAttribute("data-lcd-rec-id", String(r.id || ""));
  a.appendChild(prvok("span", "qm", "“")).setAttribute("aria-hidden", "true");
  const hv = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
  a.appendChild(prvok("div", "st", "★".repeat(hv)));
  a.appendChild(prvok("p", "", textRecenzie(r.text)));
  const foto = fotkyKarty(r);
  if (foto.length) {
    const sh = a.appendChild(prvok("div", "shots"));
    foto.forEach((plna) => {
      const im = prvok("img");
      im.loading = "lazy"; im.decoding = "async"; im.alt = ""; im.width = 168; im.height = 168;
      const u = nahladRecenzie(plna);
      // náhľad 168 px (tools/recenzie-nahlady.py); keď ešte nie je na CDN, plná fotka
      if (u !== plna) im.addEventListener("error", function zaloha() { im.removeEventListener("error", zaloha); im.src = plna; });
      im.src = u;
      sh.appendChild(im);
    });
  }
  const foot = a.appendChild(prvok("div", "foot"));
  foot.appendChild(prvok("span", "av", iniciala(r.author))).setAttribute("aria-hidden", "true");
  const meta = foot.appendChild(prvok("span", "meta"));
  meta.appendChild(prvok("b", "", String(r.author || "").trim()));
  meta.appendChild(prvok("i", "", datumRecenzie(r, fetchedAt, trh) || (trh === "cz" ? "Ověřený zákazník" : "Overený zákazník")));
  if (g) { const ik = g.cloneNode(true); ik.removeAttribute("class"); foot.appendChild(ik); }
  return a;
}

function ozivHlavicku(sek, d, trh) {
  const hodnotenie = Number(d.place.rating), pocet = Math.round(Number(d.place.totalReviews));
  if (!(hodnotenie > 0) || !(pocet > 0)) return;
  const skore = sek.querySelector(".revhead .score"), sub = sek.querySelector(".revhead .sub");
  const s = cislo1(hodnotenie), r = riadokPoctu(pocet, hodnotenie, trh);
  if (skore && skore.textContent.trim() !== s) skore.textContent = s;
  if (sub && sub.textContent.trim() !== r) sub.textContent = r;
}

function pridajNove(sek, pas, d, trh) {
  const max = Number(sek.getAttribute("data-lcd-rec-max")) || 0;
  if (!(max > 0)) return 0;
  const znama = {};
  [].forEach.call(pas.querySelectorAll("[data-lcd-rec-id]"), (k) => { znama[k.getAttribute("data-lcd-rec-id")] = 1; });
  const kandidati = d.reviews.filter((r) => cisloId(r) > max && !znama[r.id] && vyraznaRecenzia(r));
  const nove = najnovsie(kandidati, NAJNOVSICH, d.place.fetchedAt);
  if (!nove.length) return 0;
  const prvy = pas.querySelector('[data-lcd-rec-id="' + sek.getAttribute("data-lcd-rec-prvy") + '"]') || pas.firstElementChild;
  const g = sek.querySelector(".revhead .gmark");
  const frag = document.createDocumentFragment();
  nove.forEach((r) => frag.appendChild(karta(r, g, d.place.fetchedAt, trh)));
  // Pás je nekonečný (lcdHome.js nekonecnyPas presúva karty z konca na začiatok), viditeľný začiatok = prvá karta HTML.
  // Nové karty idú pred ňu a pás ostane na tom istom posune -> na mieste prvej karty je teraz najnovšia recenzia.
  const posun = pas.scrollLeft;
  pas.style.scrollSnapType = "none";
  pas.insertBefore(frag, prvy && prvy.parentNode === pas ? prvy : null);
  pas.scrollLeft = posun;
  requestAnimationFrame(() => { pas.style.scrollSnapType = ""; });
  return nove.length;
}

export function initHpRecenzie() {
  try {
    const sek = document.querySelector("[data-lcd-cast^=hp] [data-lcd-rec]");
    if (!sek || sek.__lcdRec) return;
    sek.__lcdRec = true;
    const pas = sek.querySelector(".revs");
    if (!pas) return;
    const trh = (document.documentElement.getAttribute("lang") || "").toLowerCase().indexOf("cs") === 0 ? "cz" : "sk";
    const oziv = () => {
      nacitajRecenzie().then((d) => {
        if (!d) return;
        // dáta staršie než HTML z adminu (napr. záloha zo starej verzie bundla) -> HTML ostáva, ako je
        const stavHtml = sek.getAttribute("data-lcd-rec-stav") || "";
        if (stavHtml && String(d.place.fetchedAt || "").slice(0, 10) < stavHtml) return;
        try {
          ozivHlavicku(sek, d, trh);
          pridajNove(sek, pas, d, trh);
        } catch (e) { /* HTML z adminu ostáva, ako je */ }
      });
    };
    // dáta (~13 kB) až keď je sekcia blízko okna — titulka ich pri prvom vykreslení nepotrebuje
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((z) => {
        if (!z.some((x) => x.isIntersecting)) return;
        io.disconnect();
        oziv();
      }, { rootMargin: "1500px 0px" });
      io.observe(sek);
    } else if (document.readyState === "complete") oziv();
    else window.addEventListener("load", oziv, { once: true });
  } catch (e) { /* nič: HTML z adminu */ }
}
