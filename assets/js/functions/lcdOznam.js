// Oznam o zvýšení cien na produktových stránkach (Michal 17. 11. 2026, len SK).
//
// OBSAH JE V ADMINE (web-bez-prekryvania): Shoptet SK → HTML kódy → Zápätie, prvok
//   <div id="lcd-oznam" class="lcd-oznam" hidden data-od="2026-12-01" data-pct="10">
//     <div class="lcd-oznam__in"><p class="lcd-oznam__t">Rastú ceny … <b>od 1. decembra zvyšujeme ceny o 10 %.</b> …</p></div>
//   </div>
// CZ admin ho nemá -> na CZ sa nič nedeje. Ďalšia etapa = v admine prepísať text, data-od a data-pct.
//   data-od  = deň, od ktorého platia nové ceny (od tohto dňa sa oznam aj stĺpec v cenovej karte samy skryjú)
//   data-pct = o koľko % stúpne dnešná cena (cenová karta z toho ukáže budúcu cenu, nadol na …9)
//
// Tento modul text len oživí: presunie ho hore nad hlavičku (pevný pás, aj pri rolovaní), doplní „ešte N dní“
// a ak sa text nezmestí na šírku, pustí ho dookola ako bežiaci pás. Pri „obmedziť pohyb“ v systéme nebeží, zalomí sa.

const DEN = 86400000;

/** { od: Date (polnoc miestneho času), pct, posledny: Date } alebo null, keď oznam nie je / už neplatí. */
export function zdrazenie(teraz) {
  const e = typeof document !== "undefined" ? document.getElementById("lcd-oznam") : null;
  if (!e) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(e.getAttribute("data-od") || "").trim());
  const pct = Number(String(e.getAttribute("data-pct") || "").replace(",", "."));
  if (!m || !(pct > 0 && pct < 100)) return null;
  const od = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const t = teraz instanceof Date ? teraz : new Date();
  if (!(t < od)) return null;
  return { od, pct, posledny: new Date(od.getTime() - DEN / 2) };
}

/** Budúca cena: dnešná × (1 + pct), nadol na číslo končiace 9 (nikdy nie viac, ako oznamujeme). */
export function buducaCena(cena, pct) {
  const x = Number(cena) * (1 + Number(pct) / 100);
  if (!(x >= 20)) return NaN;
  return Math.floor((x + 1) / 10) * 10 - 1;
}

/** „1. 12. 2026“ / „30. 11.“ (nezalomiteľné medzery) */
export function datum(d, sRokom) {
  return d.getDate() + ". " + (d.getMonth() + 1) + "." + (sRokom ? " " + d.getFullYear() : "");
}

/** „ešte 1 deň“ / „ešte 3 dni“ / „ešte 14 dní“ */
export function zostava(od, teraz) {
  const dnes = new Date(teraz.getFullYear(), teraz.getMonth(), teraz.getDate());
  const n = Math.max(1, Math.round((od - dnes) / DEN));
  return "ešte " + n + " " + (n === 1 ? "deň" : n <= 4 ? "dni" : "dní");
}

export function initOznam() {
  const body = document.body;
  if (!body || !body.classList.contains("type-detail")) return;
  const e = document.getElementById("lcd-oznam");
  const cfg = zdrazenie();
  if (!e || !cfg) return;
  const obal = document.querySelector(".overall-wrapper") || body;
  const vnutro = e.querySelector(".lcd-oznam__in");
  const text = e.querySelector(".lcd-oznam__t");
  if (!vnutro || !text) return;

  // „ešte N dní“ vpravo (nebeží s textom)
  let cip = e.querySelector(".lcd-oznam__cip");
  if (!cip) {
    cip = document.createElement("span");
    cip.className = "lcd-oznam__cip";
    vnutro.appendChild(cip);
  }
  cip.textContent = zostava(cfg.od, new Date());

  // pás s textom: [text][kópia pre plynulé opakovanie]
  const pas = document.createElement("div");
  pas.className = "lcd-oznam__pas";
  const draha = document.createElement("div");
  draha.className = "lcd-oznam__draha";
  vnutro.insertBefore(pas, text);
  pas.appendChild(draha);
  draha.appendChild(text);
  const kopia = text.cloneNode(true);
  kopia.classList.add("lcd-oznam__t--kopia");
  kopia.setAttribute("aria-hidden", "true");

  if (e.parentNode !== obal || obal.firstChild !== e) obal.insertBefore(e, obal.firstChild);
  e.hidden = false;
  document.documentElement.classList.add("lcd-oznam-on");

  const pokoj = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function prepocitaj() {
    // výška pásu -> odsadenie stránky (pás je pevný hore)
    document.documentElement.style.setProperty("--lcd-oznam-h", e.offsetHeight + "px");
    const bezi = !pokoj.matches && text.scrollWidth > pas.clientWidth + 1;
    if (bezi) {
      if (!kopia.parentNode) draha.appendChild(kopia);
      // rýchlosť ~ 55 px/s, nech sa dá pohodlne čítať
      e.style.setProperty("--lcd-oznam-t", Math.max(10, Math.round(text.scrollWidth / 55)) + "s");
    } else if (kopia.parentNode) {
      kopia.parentNode.removeChild(kopia);
    }
    e.classList.toggle("lcd-oznam--bezi", bezi);
    document.documentElement.style.setProperty("--lcd-oznam-h", e.offsetHeight + "px");
  }
  prepocitaj();
  let snimok = 0;
  const naplanuj = () => {
    if (snimok) return;
    snimok = (window.requestAnimationFrame || setTimeout)(() => { snimok = 0; prepocitaj(); });
  };
  window.addEventListener("resize", naplanuj);
  if (pokoj.addEventListener) pokoj.addEventListener("change", naplanuj);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(naplanuj, () => {});
  setTimeout(naplanuj, 1500);
}
