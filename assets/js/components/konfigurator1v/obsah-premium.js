// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „premium“ (rohož do kufra Premium 628/631/634).
// VLASTNÍK: T2.4 (+ admin-html/src/p1v-premium/*, assets/css/_lcd1v-obsah-premium.scss, tools/test-1v/obsah-premium.mjs,
// assets/img/1v/obsah/premium-*). Spec: $P/navrh-kufor-premium.md §6 (#kryje mapa krytia, porovnanie Premium/Classic). Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „premium“ (produkty.js -> obsah).
// Oživuje len sekcie, ktoré A–D nepoznajú (nové komponenty typu). Spoločné sekcie (referencie, galéria, recenzie,
// vecí, materiál, časová os, farby, FAQ, okno…) oživujú A–D podľa mena data-lcd-sekcia — tu ich neduplikovať.
// Čísla a odkazy závislé od vzoru dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz), nie tento modul.
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
//
// premium-kryje — „Čo všetko rohož do kufra Premium kryje“ (návrh kufor-premium.html r. 4971–4992):
//   .kryv-f[data-z] = zobrazená plocha (nic | vsetko | dno | boky | operadla); SVG zóny aj čísla .pn na fotke sa podľa nej
//   rozsvietia v CSS. Michal 25. 10. 2026: „nemá byť stále vidno tie čísla 1, 2, 3, ale že to má byť až pri prechode myšou nad
//   jednotlivými číslami. A keď dá zobraziť všetko, tak sa zobrazí všetko.“ Preto:
//   - predvolene „nic“ = čistá fotka, žiadne tlačidlo .on (HTML aj JS);
//   - klik/ťuk na .kz[data-z] plochu zvolí (.on, aria-pressed), opätovný klik na zvolenú ju zruší (späť „nic“); to isté
//     „Zobraziť všetko naraz“ (všetky zóny aj čísla / skryť);
//   - PC (hover:hover + pointer:fine): prechod myšou nad kartou (aj nad jej číslom) alebo nad zónou na fotke plochu rozsvieti,
//     po odchode myši sa vráti zvolený stav; klik na zónu na fotke = klik na jej kartu.
//   Nič neodosiela, nič z DOM nemaže.
// d-faq: čísla v odpovediach (data-p1v-cislo) dosadí obsah-cisla.js; v zbalenej odpovedi ich skrýva visibility:hidden odpovede
//   (dedia ho, takže ich ani čítačky nečítajú) — od integrácie WB 14. 10. 2026 bez vlastnej obchádzky.
export const MENO = "obsah-premium";

/** povolené plochy tlačidiel (data-z); „nic“ = čistá fotka (Michal 25. 10. 2026), nie je tlačidlo */
const PLOCHY = ["vsetko", "dno", "boky", "operadla"];
const NIC = "nic";
/** zóny na fotke: SVG g.z.z-<plocha> */
const ZONY = ["dno", "boky", "operadla"];

const pole = (x) => Array.prototype.slice.call(x || []);
const najblizsi = (e, sel) => (e && e.closest ? e.closest(sel) : null);

/** Mapa krytia: klik (a na PC aj prechod myšou) na tlačidlo plochy alebo zónu na fotke nastaví data-z na fotke. */
function kryje(sek) {
  const foto = sek.querySelector(".kryv-f");
  const zoznam = sek.querySelector(".kryv-l");
  if (!foto || !zoznam) return;
  const tlacidla = pole(zoznam.querySelectorAll(".kz[data-z]"));
  if (!tlacidla.length) return;
  const plocha = (b) => {
    const z = b && b.getAttribute("data-z");
    return PLOCHY.indexOf(z) >= 0 ? z : null;
  };
  const zvolene = () => tlacidla.find((b) => b.classList.contains("on")) || null;
  const nastav = (z) => foto.setAttribute("data-z", z || NIC);
  /** zóna pod myšou na fotke (polygón v g.z-<plocha>) alebo null */
  const zonaFotky = (e) => {
    const g = najblizsi(e && e.target, "g.z");
    if (!g || !foto.contains(g)) return null;
    return ZONY.find((z) => g.classList.contains("z-" + z)) || null;
  };
  /** klik na kartu (alebo jej zónu): zvolí ju; opätovný klik na zvolenú ju zruší (Michal 25. 10. 2026) */
  const zvol = (b) => {
    const zrus = b.classList.contains("on");
    tlacidla.forEach((x) => {
      const on = !zrus && x === b;
      x.classList.toggle("on", on);
      x.setAttribute("aria-pressed", on ? "true" : "false");
    });
    nastav(zrus ? NIC : plocha(b));
  };

  // predvolene čistá fotka (HTML data-z="nic"); stav fotky sa vždy zladí s tlačidlami
  nastav(plocha(zvolene()));

  zoznam.addEventListener("click", (e) => {
    const b = najblizsi(e.target, ".kz[data-z]");
    if (!b || !plocha(b) || !zoznam.contains(b)) return;
    zvol(b);
  });

  // PC s myšou: plocha sa rozsvieti po prejdení nad kartou alebo zónou na fotke; po odchode späť na zvolenú.
  // Zóny na fotke dostanú myš len tu (CSS: pointer-events v @media (hover:hover) and (pointer:fine)), na dotyku nie.
  if (typeof matchMedia === "function" && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    zoznam.addEventListener("mouseover", (e) => {
      const b = najblizsi(e.target, ".kz[data-z]");
      const z = plocha(b);
      if (b && z && zoznam.contains(b)) nastav(z);
    });
    zoznam.addEventListener("mouseleave", () => nastav(plocha(zvolene())));
    foto.addEventListener("mouseover", (e) => nastav(zonaFotky(e) || plocha(zvolene())));
    foto.addEventListener("mouseleave", () => nastav(plocha(zvolene())));
    foto.addEventListener("click", (e) => {
      const z = zonaFotky(e);
      const b = z ? tlacidla.find((x) => x.getAttribute("data-z") === z) : null;
      if (b) zvol(b); // ako klik na kartu: zvolí, opätovný klik zruší (fotka hneď čistá, ako pri karte)
    });
  }
}

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const sek = oc.sekcia("premium-kryje");
  if (sek) kryje(sek);
  // premium-porovnanie: len reveal .rv (spoločne robí obsah.js); ceny a odkaz na Classic dosadzuje obsah-cisla.js
}
