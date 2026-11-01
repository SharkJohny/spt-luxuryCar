// One page checkout: poznámka pre predajcu zbalená za odkaz „+ Pridať poznámku pre predajcu“ (kniha OPC § 6.2 riadok 6;
// Michal 1. 11. 2026 schválil náhľad kontrola-pokladne/nahlady/nahlad-telefon-390-sk.png).
//
// Prečo: doplnok ProductNote.js (poznámka k produktu, shoptet.jankucera.work) pri existujúcom localStorage NoteArray —
// aj prázdnom „[]“ — zaškrtne a zamkne „Zadať poznámku pre predajcu“ a otvorí prázdne pole. Na telefóne bol pred súhrnom
// veľký prázdny box (kontrola pokladne 1. 11. 2026, nález 3).
//
// Ako: prepínač Shoptetu (#add-note, bez name — neodosiela sa) je pri OPC skrytý a namiesto neho je odkaz. Klik = pole
// sa ukáže a dostane kurzor. Keď je v poli text (doplnok, obnova údajov po zmene košíka, návrat s chybou), je pole otvorené
// hneď. #remark ostáva v DOM a vo formulári a odošle sa vždy, aj zbalené (toNote v main.js doň píše „model: …“ / blok
// kamióna tesne pred odoslaním, § 6.10 bod 7). Nič sa tu neodosiela ani nemaže, mení sa len viditeľnosť (CSS triedy).
//
// POZOR: Shoptet pri odoslaní vymaže polia vo všetkých [data-unveil] blokoch, ktorých prepínač nie je zaškrtnutý
// (validátor: n.find("[data-unveil]") … $(this).val("")) — bez zaškrtnutého #add-note by ručná poznámka zákazníka
// zmizla (test S9 1. 11. 2026). Preto otvorenie poľa, písanie doň aj odoslanie s textom #add-note potichu zaškrtne
// (len vlastnosť checked, bez udalostí — Shoptet tak neprepne triedu .visible). „model: …“ píše toNote až po tomto
// mazaní, preto sa doň zapíše vždy.

/** Po koľkých ms sa ešte raz pozrie, či do poľa niekto nevpísal text (doplnok / obnova údajov sú neskôr než init). */
export const ZNOVA_MS = [300, 1000, 2500, 5000];

/**
 * Zbalí poznámku za odkaz. -> { otvor(sKurzorom), otvorena() } | null (chýba označenie Shoptetu alebo už beží).
 */
export function zbalPoznamku(form, T) {
  const doc = form && form.ownerDocument;
  if (!doc) return null;
  const remark = doc.getElementById("remark");
  const note = doc.getElementById("note");
  const prepinac = doc.getElementById("add-note");
  const skupina = prepinac && prepinac.closest(".form-group");
  const obal = note && note.parentNode;
  if (!remark || !note || !note.contains(remark) || !skupina || !obal || skupina.parentNode !== obal || doc.getElementById("lcd-opc-pozn")) return null;

  const odkaz = doc.createElement("button");
  odkaz.type = "button";
  odkaz.id = "lcd-opc-pozn";
  odkaz.className = "lcd-opc-pozn";
  odkaz.setAttribute("aria-controls", "note");
  odkaz.setAttribute("aria-expanded", "false");
  const plus = doc.createElement("span");
  plus.setAttribute("aria-hidden", "true");
  plus.textContent = "+";
  odkaz.appendChild(plus);
  odkaz.appendChild(doc.createTextNode(" " + T.pridatPoznamku));
  skupina.classList.add("lcd-opc-pozn-prepinac");
  obal.insertBefore(odkaz, skupina);

  let otvorena = false;
  const plna = function () { return String(remark.value || "").trim() !== ""; };
  // Shoptet pri odoslaní maže #note, keď #add-note nie je zaškrtnutý (pozri hore)
  const zapni = function () { if (!prepinac.checked) prepinac.checked = true; };
  const otvor = function (sKurzorom) {
    zapni();
    if (otvorena) return;
    otvorena = true;
    obal.classList.remove("lcd-opc-pozn-zbalena");
    obal.classList.add("lcd-opc-pozn-otvorena");
    odkaz.setAttribute("aria-expanded", "true");
    if (sKurzorom) { try { remark.focus({ preventScroll: false }); } catch (e) { remark.focus(); } }
  };
  if (plna()) otvor(false);
  else obal.classList.add("lcd-opc-pozn-zbalena");
  odkaz.addEventListener("click", function () { otvor(true); });
  remark.addEventListener("input", function () { if (plna()) otvor(false); });
  // poistka: text vložený skriptom bez udalosti — zachytávanie na dokumente beží pred validátorom Shoptetu na formulári
  doc.addEventListener("submit", function (e) { if (e.target === form && plna()) otvor(false); }, true);
  const win = doc.defaultView;
  if (win && !otvorena) ZNOVA_MS.forEach(function (ms) { win.setTimeout(function () { if (!otvorena && plna()) otvor(false); }, ms); });
  return { otvor: otvor, otvorena: function () { return otvorena; } };
}
