// Nový konfigurátor 1V — krok rozloženia kobercov (len 1. rad / 1.+2. rad / všetky tri rady): jednovrstvové krok 4,
// dvojvrstvové krok 5 (beží len pri typoch s modulom „rozlozenie“, produkty.js TYPY).
// JADRO od T0.1 (14. 10. 2026; mení len vydanie) + assets/css/_lcd1v-rozlozenie.scss + tools/test-1v/ovladac-rozlozenie.mjs.
// Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md — DOM sa nemaže, voľby len ctx.zapis().
// Texty: TEXTY nižšie (návrh v26) + prepisy typu ctx.texty("rozlozenie"); fotky kariet: ctx.obrazokVzoru("rozlozenie-N").
//
// Podľa návrhu v26 (krok 4): podnadpis + „i“, „Miest na sedenie“ (zrkadlo dlaždíc kroku 2 oboma smermi),
// tmavý pôdorys auta zhora (rady podľa počtu miest, zvolené rady zlaté, „Podložené“) a karty s fotkami.
//   - Karty patria k živému selectu rozloženia (SK 85 / CZ 57, hľadá sa podľa data-parameter-name). Klik = ctx.zapis(),
//     ktorý klikne na živé tlačidlo voľby -> Shoptet select, cena, validácia košíka bežia ako doteraz.
//   - Ceny sa čítajú zo Shoptetu (ctx.moznosti), rady podľa textu voľby (tretí/třetí -> 3, druhý/druhá -> 2, inak 1).
//   - Dlaždice miest klikajú na živé dlaždice kroku 2 (.sit-Position, sessionStorage seatPosition) a stav čítajú z nich.
//   - Živé .options-wrap kroku ostáva v DOM (CSS ho pod body.lcd-1v len skryje); nové prvky nemajú name ani input
//     (nejdú do POST, nemenia pravidlo vyplnenia kroku v configuratorEngine.js).
export const MENO = "rozlozenie";

const TEXTY = {
  sk: {
    podnadpis: "Na autíčku vidíte, kde budú koberce. Na fotkách stmavená časť ostane bez nich.",
    info: "Vysvetlenie",
    vysvetlenie:
      "<b>Prvý rad</b> = koberce pod nohami vodiča a spolujazdca. " +
      "<b>Druhý rad</b> = zadné sedadlá vrátane prekrytia stredového tunela. " +
      "<b>Tretí rad</b> = posledný rad v sedemmiestnych autách.",
    miesta: "Miest na sedenie",
    plan: "Pôdorys auta zhora: zlaté sú rady, kde budú koberce",
    podlozene: "Podložené",
    kufor: "Kufor je samostatný — vyberiete si ho v <b>ďalšom kroku</b>.",
    skupina: "Rozloženie kobercov",
    vCene: "v cene",
    tretiRad: "+ 3. rad",
    karty: {
      1: ["Len prvý rad", "Pod nohami vodiča a spolujazdca"],
      2: ["Prvý a druhý rad", "Vpredu aj na zadných sedadlách"],
      3: ["Všetky tri rady", "Aj tretí rad v sedemmiestnych autách"],
    },
  },
};

const OBRAZKY = {
  // záloha, keď typ nemá kľúč rozlozenie-N (typy/jedno.js ho má: Diamond béžová pre všetky vzory, plan.md §2.5)
  foto: { 1: "rozlozenie-rad-prvy.jpg", 2: "rozlozenie-rad-vsetky.jpg", 3: "rozlozenie-rad-vsetky.jpg" },
  ikona: { 1: "rozlozenie-rad-ikona-1.png", 2: "rozlozenie-rad-ikona-2.png", 3: "rozlozenie-rad-ikona-3.png" },
  // prirodzené rozmery ikon (šírka x 156) -> width/height atribúty, nech sa karta pri načítaní nehýbe
  sirkaIkony: { 1: 90, 2: 168, 3: 222 },
};

// Pôdorys auta z návrhu v26 (#carPlan): rady 1/2/3 majú varianty s 2 a 3 sedadlami (data-var; sedadlo = rect.rzp-s).
// Dĺžka auta podľa počtu miest (Michal 16. 10. 2026: pri 2 miestach malé auto, nie dodávka s polovičným kufrom):
// zadok (.rzp-zad = zadné kolesá, koniec karosérie, zadné okno, priečka, kufor, svetlá) stojí za 3. radom a CSS ho
// posunie za posledný kreslený rad (data-dlzka kratke / bezne / dlhe); karoséria = dve otvorené cesty .rzp-telo
// (predok stojí, zadok sa posúva, prekrývajú sa pri každej dĺžke), celé auto (.rzp-auto) sa v rámiku vycentruje.
// Stav kreslí CSS podľa data-* na koreni (data-rady, data-r1, data-r2, data-r3, data-dlzka, data-volant, data-kufor).
const SVG_PLAN = `<svg class="rz-svg" focusable="false" viewBox="0 0 472 200"><defs><linearGradient id="lcd1v-rz-cg" x1="0" y1="0" x2=".38" y2="1"><stop offset="0" stop-color="#fbf1d2"/><stop offset=".45" stop-color="#e4c46f"/><stop offset="1" stop-color="#ab8120"/></linearGradient><pattern id="lcd1v-rz-cq" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V11M0 0H11" fill="none" stroke="#8a6a17" stroke-opacity=".42" stroke-width="1"/></pattern><linearGradient id="lcd1v-rz-csk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6674"/><stop offset="1" stop-color="#232a33"/></linearGradient><linearGradient id="lcd1v-rz-ctel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#332e23"/><stop offset=".5" stop-color="#262218"/><stop offset="1" stop-color="#1b1811"/></linearGradient></defs><g class="rzp-auto"><rect x="64" y="14" width="62" height="30" rx="10" fill="#0a0a0c" stroke="#8e856a" stroke-opacity=".8" stroke-width="2"/><rect x="64" y="156" width="62" height="30" rx="10" fill="#0a0a0c" stroke="#8e856a" stroke-opacity=".8" stroke-width="2"/><g class="rzp-zad"><rect x="368" y="14" width="62" height="30" rx="10" fill="#0a0a0c" stroke="#8e856a" stroke-opacity=".8" stroke-width="2"/><rect x="368" y="156" width="62" height="30" rx="10" fill="#0a0a0c" stroke="#8e856a" stroke-opacity=".8" stroke-width="2"/></g><path class="rzp-telo rzp-zad" d="M286 30 L430 30 Q458 30 458 50 L458 150 Q458 170 430 170 L286 170" fill="url(#lcd1v-rz-ctel)" stroke="#9a9074" stroke-width="3"/><path class="rzp-telo" d="M290 170 L150 170 C110 170 60 166 48 150 Q40 132 40 100 Q40 68 48 50 C60 34 110 30 150 30 L290 30" fill="url(#lcd1v-rz-ctel)" stroke="#9a9074" stroke-width="3"/><path d="M122 31 l16 -11 q5 -3 7 2 l3 8 z" fill="#3a3527" stroke="#9a9074" stroke-width="1.6"/><path d="M122 169 l16 11 q5 3 7 -2 l3 -8 z" fill="#3a3527" stroke="#9a9074" stroke-width="1.6"/><path d="M86 58 Q78 100 86 142 L124 156 Q115 100 124 44 Z" fill="url(#lcd1v-rz-csk)" stroke="#9a9074" stroke-width="1.8"/><path d="M60 46 Q52 100 60 154" fill="none" stroke="#54503e" stroke-width="1.6"/><g fill="#55503c"><rect x="42" y="58" width="7" height="24" rx="3.5"/><rect x="42" y="118" width="7" height="24" rx="3.5"/></g><path d="M128 44 Q136 100 128 156 L158 158 Q151 100 158 42 Z" fill="#242015"/><rect x="141" y="84" width="7" height="22" rx="3" fill="#0f0e0a" stroke="#5a5341" stroke-width="1"/><g fill="url(#lcd1v-rz-csk)" fill-opacity=".85"><rect x="134" y="35" width="94" height="8" rx="3"/><rect x="134" y="157" width="94" height="8" rx="3"/></g><g class="rzp-ok" data-okno="2" fill="url(#lcd1v-rz-csk)" fill-opacity=".85"><rect x="236" y="35" width="68" height="8" rx="3"/><rect x="236" y="157" width="68" height="8" rx="3"/></g><g class="rzp-ok" data-okno="3" fill="url(#lcd1v-rz-csk)" fill-opacity=".85"><rect x="312" y="35" width="52" height="8" rx="3"/><rect x="312" y="157" width="52" height="8" rx="3"/></g><g class="rzp-zad"><g fill="url(#lcd1v-rz-csk)" fill-opacity=".85"><rect x="372" y="35" width="52" height="8" rx="3"/><rect x="372" y="157" width="52" height="8" rx="3"/></g><rect class="rzp-div" x="369" y="52" width="6" height="96" rx="3" fill="#4a4433" stroke="#9a9074" stroke-width="1.4"/><g class="rzp-z rzp-kuf" data-rad="k"><g class="rzp-off"><rect x="380" y="48" width="66" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><text x="413" y="106" text-anchor="middle" font-family="'Exo 2','Segoe UI',sans-serif" font-size="14" font-weight="800" letter-spacing="0.8" fill="#b8ae8f">KUFOR</text></g><g class="rzp-on"><rect x="380" y="48" width="66" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="380" y="48" width="66" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><text x="413" y="106" text-anchor="middle" font-family="'Exo 2','Segoe UI',sans-serif" font-size="14" font-weight="800" letter-spacing="0.8" fill="#2a2109">KUFOR</text></g></g><g fill="#55503c"><rect x="452" y="46" width="6" height="26" rx="3"/><rect x="452" y="128" width="6" height="26" rx="3"/></g><path d="M446 36 L446 164" stroke="#6f6853" stroke-opacity=".6" stroke-width="1.6" fill="none"/></g><g class="rzp-z rzp-r1" data-rad="1" data-var="2"><g class="rzp-off"><rect x="164" y="48" width="64" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><rect class="rzp-s" x="169" y="56" width="54" height="42" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="205" y="56" width="18" height="42" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="169" y="102" width="54" height="42" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="205" y="102" width="18" height="42" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/></g><g class="rzp-on"><rect x="164" y="48" width="64" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="164" y="48" width="64" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><rect class="rzp-s" x="169" y="56" width="54" height="42" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="205" y="56" width="18" height="42" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="169" y="102" width="54" height="42" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="205" y="102" width="18" height="42" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/></g></g><g class="rzp-z rzp-r1" data-rad="1" data-var="3"><g class="rzp-off"><rect x="164" y="48" width="64" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><rect class="rzp-s" x="169" y="54" width="54" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="205" y="54" width="18" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="169" y="86" width="54" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="205" y="86" width="18" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="169" y="118" width="54" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="205" y="118" width="18" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/></g><g class="rzp-on"><rect x="164" y="48" width="64" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="164" y="48" width="64" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><rect class="rzp-s" x="169" y="54" width="54" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="205" y="54" width="18" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="169" y="86" width="54" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="205" y="86" width="18" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="169" y="118" width="54" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="205" y="118" width="18" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/></g></g><g class="rzp-z rzp-r2" data-rad="2" data-var="2"><g class="rzp-off"><rect x="236" y="48" width="68" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><rect class="rzp-s" x="241" y="56" width="58" height="42" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="280" y="56" width="19" height="42" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="241" y="102" width="58" height="42" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="280" y="102" width="19" height="42" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/></g><g class="rzp-on"><rect x="236" y="48" width="68" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="236" y="48" width="68" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><rect class="rzp-s" x="241" y="56" width="58" height="42" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="280" y="56" width="19" height="42" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="241" y="102" width="58" height="42" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="280" y="102" width="19" height="42" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/></g></g><g class="rzp-z rzp-r2" data-rad="2" data-var="3"><g class="rzp-off"><rect x="236" y="48" width="68" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><rect class="rzp-s" x="241" y="54" width="58" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="280" y="54" width="19" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="241" y="86" width="58" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="280" y="86" width="19" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="241" y="118" width="58" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="280" y="118" width="19" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/></g><g class="rzp-on"><rect x="236" y="48" width="68" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="236" y="48" width="68" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><rect class="rzp-s" x="241" y="54" width="58" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="280" y="54" width="19" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="241" y="86" width="58" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="280" y="86" width="19" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="241" y="118" width="58" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="280" y="118" width="19" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/></g></g><g class="rzp-z rzp-r3" data-rad="3" data-var="2"><g class="rzp-off"><rect x="312" y="48" width="52" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><rect class="rzp-s" x="317" y="58" width="42" height="40" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="345" y="58" width="14" height="40" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="317" y="102" width="42" height="40" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="345" y="102" width="14" height="40" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/></g><g class="rzp-on"><rect x="312" y="48" width="52" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="312" y="48" width="52" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><rect class="rzp-s" x="317" y="58" width="42" height="40" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="345" y="58" width="14" height="40" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="317" y="102" width="42" height="40" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="345" y="102" width="14" height="40" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/></g></g><g class="rzp-z rzp-r3" data-rad="3" data-var="3"><g class="rzp-off"><rect x="312" y="48" width="52" height="104" rx="12" fill="#161410" stroke="#7d7660" stroke-width="1.6" stroke-dasharray="5 5"/><rect class="rzp-s" x="317" y="54" width="42" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="345" y="54" width="14" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="317" y="86" width="42" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="345" y="86" width="14" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/><rect class="rzp-s" x="317" y="118" width="42" height="28" rx="9" fill="#37321f" stroke="#83795c" stroke-width="1.4"/><rect x="345" y="118" width="14" height="28" rx="7" fill="#2b2718" stroke="#83795c" stroke-width="1.2"/></g><g class="rzp-on"><rect x="312" y="48" width="52" height="104" rx="12" fill="url(#lcd1v-rz-cg)"/><rect x="312" y="48" width="52" height="104" rx="12" fill="url(#lcd1v-rz-cq)" stroke="#fdf6e2" stroke-width="1.8"/><rect class="rzp-s" x="317" y="54" width="42" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="345" y="54" width="14" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="317" y="86" width="42" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="345" y="86" width="14" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/><rect class="rzp-s" x="317" y="118" width="42" height="28" rx="9" fill="#1b1506" stroke="#7a5f13" stroke-width="1.4"/><rect x="345" y="118" width="14" height="28" rx="7" fill="#110d04" stroke="#7a5f13" stroke-width="1.2"/></g></g><g class="rzp-vol" data-vol="vlavo"><circle cx="143" cy="123" r="13" fill="none" stroke="#d9c489" stroke-width="4.5"/><circle cx="143" cy="123" r="3.5" fill="#d9c489"/></g><g class="rzp-vol" data-vol="vpravo"><circle cx="143" cy="77" r="13" fill="none" stroke="#d9c489" stroke-width="4.5"/><circle cx="143" cy="77" r="3.5" fill="#d9c489"/></g></g></svg>`;

/**
 * Počet miest -> sedadlá v radoch [1. rad, 2. rad, 3. rad]; súčet = počet miest, 0 = rad sa nekreslí.
 * Michal 16. 10. 2026: pri 2 miestach pôdorys kreslil 4 sedadlá (2. rad navyše), pri 9 len 8 (návrh v26 konf()
 * mal 2 a 4 rovnako a 8 a 9 rovnako). Dlaždice kroku 2: 2, 4, 5, 6, 7, 8, 9 (productPage.js).
 */
export function sedadlaPodlaMiest(n) {
  n = parseInt(n, 10) || 5;
  if (n >= 9) return [3, 3, 3];
  if (n === 8) return [2, 3, 3];
  if (n === 7) return [2, 3, 2];
  if (n === 6) return [2, 2, 2];
  if (n === 5) return [2, 3, 0];
  if (n === 4) return [2, 2, 0];
  if (n === 3) return [3, 0, 0];
  return [2, 0, 0];
}

/** Počet miest -> dĺžka auta v pôdoryse: kratke = len 1. rad (2–3 miesta), bezne = 2 rady (4–5), dlhe = 3 rady (6–9). */
export function dlzkaPodlaMiest(n) {
  const r = sedadlaPodlaMiest(n);
  return r[2] ? "dlhe" : r[1] ? "bezne" : "kratke";
}

/** Počet miest -> [sedadlá v 2. rade, sedadlá v 3. rade] (tvar návrhu v26 konf(); 0 = rad nie je). */
export function radyPodlaMiest(n) {
  const r = sedadlaPodlaMiest(n);
  return [r[1], r[2]];
}

/** Text voľby Shoptetu -> počet radov (SK „prvý, druhý a tretí rad“, CZ „první, druhá a třetí řada“). */
export function radyZTextu(text) {
  const t = String(text || "").toLowerCase();
  if (/tret|třet/.test(t)) return 3;
  if (/druh/.test(t)) return 2;
  if (/prv/.test(t)) return 1;
  return 0;
}

function el(tag, trieda, html) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (html != null) e.innerHTML = html;
  return e;
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const zaklad = TEXTY[ctx.jazyk === "cs" ? "cs" : "sk"] || TEXTY.sk;
  const typ = ctx.texty ? ctx.texty("rozlozenie") : {};
  const T = Object.assign({}, zaklad, typ, { karty: Object.assign({}, zaklad.karty, typ.karty) });
  const fotoKarty = (r) => (ctx.obrazokVzoru && ctx.obrazokVzoru("rozlozenie-" + r)) || ctx.obrazok(OBRAZKY.foto[r]);
  const param = ctx.parameter("rozlozenie");
  const krok = ctx.krok("rozlozenie");
  if (!param || !krok) throw new Error("krok rozloženia sa nenašiel");
  if (krok.querySelector(":scope > .lcd1v-rz")) return; // už postavené

  // voľby Shoptetu -> karty podľa počtu radov (poradie a ceny zo Shoptetu, nič natvrdo)
  const volby = {};
  ctx.moznosti("rozlozenie").forEach((m, i) => {
    let r = radyZTextu(m.text);
    if (!r || volby[r]) r = i + 1;
    if (r >= 1 && r <= 3 && !volby[r]) volby[r] = m;
  });
  if (!volby[1] || !volby[2]) throw new Error("rozloženie: chýba voľba 1. alebo 1.+2. radu");

  // ---------------------------------------------------------------- DOM
  const koren = el("div", "lcd1v-rz");
  koren.dataset.rady = "0";
  koren.dataset.volant = "vlavo";
  koren.dataset.kufor = "0";

  const pod = el("p", "rz-podnadpis");
  pod.appendChild(document.createTextNode(T.podnadpis + " "));
  const info = el("button", "rz-info", "i");
  info.type = "button";
  info.setAttribute("aria-label", T.info);
  info.setAttribute("aria-expanded", "false");
  info.setAttribute("aria-controls", "lcd1v-rz-vysv");
  pod.appendChild(info);
  const vysv = el("div", "rz-vysv", T.vysvetlenie);
  vysv.id = "lcd1v-rz-vysv";
  vysv.hidden = true;

  // „Miest na sedenie“ — dlaždice podľa živých dlaždíc kroku 2 (hodnoty pass-N)
  const miesta = el("div", "rz-miesta");
  miesta.appendChild(el("span", "rz-miesta-nm", T.miesta));
  const dlazdice = el("span", "rz-dlazdice");
  dlazdice.setAttribute("role", "group");
  dlazdice.setAttribute("aria-label", T.miesta);
  zive("miesta").forEach((b) => {
    const v = (b.getAttribute("data-value") || "").replace(/^pass-/, "");
    if (!v) return;
    const d = el("button", null, "");
    d.type = "button";
    d.dataset.v = v;
    d.textContent = (b.textContent || v).trim() || v;
    d.setAttribute("aria-pressed", "false");
    dlazdice.appendChild(d);
  });
  miesta.appendChild(dlazdice);
  if (!dlazdice.children.length) miesta.hidden = true;

  const plan = el("div", "rz-plan", SVG_PLAN);
  const svg = plan.querySelector("svg");
  if (svg) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", T.plan);
  }
  plan.appendChild(el("div", "rz-legenda", '<span class="rz-je">' + T.podlozene + "</span>"));
  plan.appendChild(el("p", "rz-hint", T.kufor));

  const karty = el("div", "rz-karty");
  karty.setAttribute("role", "group");
  karty.setAttribute("aria-label", T.skupina);
  [1, 2, 3].forEach((r) => {
    const m = volby[r];
    if (!m) return;
    const k = el("button", "rz-karta");
    k.type = "button";
    k.dataset.rady = String(r);
    k.dataset.hodnota = m.hodnota;
    k.setAttribute("aria-pressed", "false");
    const cena = m.cena > 0 ? "+ " + ctx.formatCena(m.cena) : T.vCene;
    k.innerHTML =
      '<span class="rz-foto"><img src="' + fotoKarty(r) + '" alt="" width="112" height="112" loading="lazy" decoding="async">' +
      (r === 3 ? "<b>" + T.tretiRad + "</b>" : "") + "</span>" +
      '<span class="rz-tx"><span class="rz-nm">' + T.karty[r][0] + '</span><span class="rz-po">' + T.karty[r][1] + "</span>" +
      '<span class="rz-cena"><span class="rz-ikona" aria-hidden="true"><img src="' + ctx.obrazok(OBRAZKY.ikona[r]) + '" alt="" width="' +
      OBRAZKY.sirkaIkony[r] + '" height="156" loading="lazy" decoding="async"></span><span class="rz-pl">' + cena + "</span></span></span>" +
      '<span class="rz-vol" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="M3.6 8.4l2.9 2.9 5.9-6.6"/></svg></span>';
    karty.appendChild(k);
  });

  koren.append(pod, vysv, miesta, plan, karty);
  krok.classList.add("lcd1v-rz-krok");
  vloz();

  // ---------------------------------------------------------------- stav
  let poslMiesta = (function () {
    try { return parseInt(String(sessionStorage.getItem("seatPosition") || "").replace(/^pass-/, ""), 10) || 5; } catch (e) { return 5; }
  })();
  let predR3 = null;
  let zvolene = 0; // rady zvolené v živom kroku (0 = nič)
  let nahlad = null; // rady pod myšou (náhľad pred klikom)

  /** Živé prvky: miesta | volant | volby (tlačidlá rozloženia). */
  function zive(co) {
    const f = ctx.form();
    if (!f) return [];
    if (co === "miesta") {
      const a = ctx.krok("auto");
      return a ? Array.prototype.slice.call(a.querySelectorAll(".sit-Position .option-button[data-value^='pass-']")) : [];
    }
    if (co === "volant") {
      const a = ctx.krok("auto");
      return a ? Array.prototype.slice.call(a.querySelectorAll(".wheel-Position .option-button")) : [];
    }
    const k = ctx.krok("rozlozenie");
    return k ? Array.prototype.slice.call(k.querySelectorAll('.options-wrap .option-button[data-variant="' + param.id + '"]')) : [];
  }

  function vloz() {
    const k = ctx.krok("rozlozenie");
    if (!k) return;
    if (koren.parentNode === k) return;
    k.classList.add("lcd1v-rz-krok");
    const ow = k.querySelector(":scope > .options-wrap");
    const dalej = k.querySelector(":scope > .next-step-button");
    k.insertBefore(koren, ow || dalej || null);
  }

  function zmerajKrok() {
    const k = ctx.krok("rozlozenie");
    if (k && k.classList.contains("active") && typeof window.__lcdMeasureStep === "function") window.__lcdMeasureStep(k);
  }

  function synchronizuj() {
    if (!koren.isConnected) vloz();
    // miesta (krok 2 je zdroj pravdy; bez aktívnej dlaždice drží posledný známy počet)
    const aktMiesto = zive("miesta").find((b) => b.classList.contains("active"));
    const v = aktMiesto ? (aktMiesto.getAttribute("data-value") || "").replace(/^pass-/, "") : "";
    if (v) poslMiesta = parseInt(v, 10) || poslMiesta;
    Array.prototype.forEach.call(dlazdice.children, (d) => {
      const on = d.dataset.v === v;
      d.classList.toggle("on", on);
      d.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const rr = sedadlaPodlaMiest(poslMiesta);
    koren.dataset.r1 = String(rr[0]);
    koren.dataset.r2 = String(rr[1]);
    koren.dataset.r3 = String(rr[2]);
    koren.dataset.dlzka = dlzkaPodlaMiest(poslMiesta);
    // volant
    const vol = zive("volant").find((b) => b.classList.contains("active"));
    koren.dataset.volant = vol && vol.getAttribute("data-value") === "right" ? "vpravo" : "vlavo";
    // kufor (krok 5): rozsvieti sa, keď je zvolená rohož (platená voľba okrem „nie“ — 610 má v admine „nie“ +5 €)
    const kv = ctx.precitaj("kufor");
    const km = kv ? ctx.moznosti("kufor").find((m) => m.hodnota === kv) : null;
    koren.dataset.kufor = km && km.cena > 0 && !/^(nie|ne)\b/i.test(km.text) ? "1" : "0";
    // zvolené rozloženie = aktívne živé tlačidlo (rovnaké pravidlo ako validácia košíka)
    const akt = zive("volby").find((b) => b.classList.contains("active"));
    const hod = akt ? akt.getAttribute("data-value") : "";
    zvolene = 0;
    Array.prototype.forEach.call(karty.children, (k) => {
      const on = !!hod && k.dataset.hodnota === hod;
      if (on) zvolene = Number(k.dataset.rady);
      k.classList.toggle("on", on);
      k.setAttribute("aria-pressed", on ? "true" : "false");
    });
    koren.dataset.rady = String(nahlad || zvolene);
    // auto bez 3. radu: „všetky tri rady“ sa prepne na „prvý a druhý rad“ (návrh v26 aplikuj()), len pri zmene miest.
    // Aj pri 2 miestach ostáva „Prvý a druhý rad“ v ponuke ako na starom webe (ten počet miest s rozložením neviaže).
    if (predR3 !== null && predR3 > 0 && rr[2] === 0 && zvolene === 3 && volby[2]) {
      predR3 = 0;
      ctx.zapis("rozlozenie", volby[2].hodnota);
      return synchronizuj();
    }
    predR3 = rr[2];
    zmerajKrok();
  }

  let caka = null;
  function naplanuj() {
    if (caka) return;
    caka = setTimeout(() => { caka = null; synchronizuj(); }, 16);
  }

  // ---------------------------------------------------------------- udalosti
  info.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // vysvetlenie nie je voľba: bez auta nemá otvárať okno „vyberte model“ (validation.js)
    vysv.hidden = !vysv.hidden;
    info.setAttribute("aria-expanded", vysv.hidden ? "false" : "true");
    zmerajKrok();
  });

  dlazdice.addEventListener("click", (e) => {
    const d = e.target.closest("button");
    if (!d || !dlazdice.contains(d)) return;
    const zivy = zive("miesta").find((b) => b.getAttribute("data-value") === "pass-" + d.dataset.v);
    // klik tu = klik na dlaždicu v kroku 2 (živý handler: sessionStorage seatPosition, aktívna trieda)
    if (zivy && !zivy.classList.contains("active")) zivy.click();
    synchronizuj();
  });

  karty.addEventListener("click", (e) => {
    const k = e.target.closest(".rz-karta");
    if (!k || !karty.contains(k)) return;
    nahlad = null;
    ctx.zapis("rozlozenie", k.dataset.hodnota);
    synchronizuj();
    const m = volby[Number(k.dataset.rady)];
    ctx.vysli("rozlozenie:vyber", { rady: Number(k.dataset.rady), hodnota: k.dataset.hodnota, nazov: T.karty[k.dataset.rady][0], cena: m ? m.cena : 0 });
  });

  // náhľad na pôdoryse pri prejdení myšou (pred klikom), po odchode späť na zvolené
  const mys = window.matchMedia ? window.matchMedia("(hover: hover)") : null;
  karty.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse" || (mys && !mys.matches)) return;
    const k = e.target.closest(".rz-karta");
    if (!k) return;
    nahlad = Number(k.dataset.rady);
    koren.dataset.rady = String(nahlad);
  });
  karty.addEventListener("pointerleave", () => {
    nahlad = null;
    koren.dataset.rady = String(zvolene);
  });

  // zmeny živého stavu: dlaždice kroku 2, volant, voľby rozloženia (aj validácia), selecty (jQuery change)
  if (window.MutationObserver) {
    const mo = new MutationObserver(naplanuj);
    const auto = ctx.krok("auto");
    if (auto) mo.observe(auto, { subtree: true, attributes: true, attributeFilter: ["class"] });
    const ow = krok.querySelector(":scope > .options-wrap");
    if (ow) mo.observe(ow, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  const $ = window.jQuery || window.$;
  ["rozlozenie", "kufor"].forEach((kl) => {
    const p = ctx.parameter(kl);
    if (p && $) $(p.select).on("change", naplanuj);
    else if (p) p.select.addEventListener("change", naplanuj);
  });
  ctx.na("zmena", naplanuj);

  synchronizuj();
}
