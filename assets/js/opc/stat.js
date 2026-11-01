// Zmena štátu priamo v pokladni (Michal 1. 11. 2026: „Zmeniť štát“ hodilo na starý krok 1 — „mali by tam vybehnúť štáty,
// do ktorých máme povolené posielať“). Pri adrese je hneď výber krajín z kroku 1 Shoptetu (#deliveryCountryId, tie isté
// krajiny ako tam) namiesto „Štát: X Zmeniť štát“ (Michal 1. 11.: „aby to v defaulte bolo ako drop-down“). Iná krajina -> vyplnené údaje do sessionStorage (ako pri zmene košíka, opc/kosikKarta.js),
// Step1ChooseDelivery ako krok 1 Shoptetu (XHR, overené naživo 1. 11.), krok 1 nanovo, Step1Validate s jeho predvolenou
// dopravou a platbou (ceny dopravy sú podľa krajiny) a krok 2 nanovo s obrazovkou „Načítavam…“.
// Hocičo zlyhá -> klasický krok 1 (dnešný odkaz), tam je krajina už zmenená alebo sa dá zmeniť.
import { fetchSLimitom, LIMIT_KROK1_MS } from "./sync.js";
import { stiahniModelKrok1, potvrdKrok1, CESTA_KROK1 } from "./kosik.js";
import { ukazSkok, KLUC_HLASKA } from "./skok.js";
import { ulozFormular } from "./kosikKarta.js";

export const AKCIA_KRAJINA = "/action/orderingProcess/Step1ChooseDelivery/";
const XHR = { "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Accept: "application/json, text/javascript, */*; q=0.01" };

/**
 * Výber krajiny namiesto odkazu „Zmeniť štát“. o: { krajiny: [{ id, nazov, zvolena }], T, form, ss, meraj, zakaz() }.
 * -> true = výber je na mieste odkazu, false = ostáva odkaz na krok 1 ako doteraz.
 */
export function vlozVyberStatu(a, o) {
  const krajiny = (o && o.krajiny) || [];
  if (krajiny.length < 2 || !a.parentNode) return false;
  const doc = a.ownerDocument;
  const sel = doc.createElement("select");
  sel.className = "lcd-opc-stat__vyber form-control";
  sel.setAttribute("aria-label", o.T.krajinaDorucenia);
  let povodna = null;
  krajiny.forEach(function (k) {
    const op = doc.createElement("option");
    op.value = k.id;
    op.textContent = k.nazov;
    if (k.zvolena) { op.selected = true; povodna = k.id; }
    sel.appendChild(op);
  });
  const riadok = a.closest(".form-control-wrapper") || a.parentNode;
  riadok.classList.add("lcd-opc-stat--vyber"); // názov štátu (strong) skryje CSS, výber ho nahradí
  a.parentNode.replaceChild(sel, a);
  sel.addEventListener("change", function () {
    if (!sel.value || sel.value === povodna) return;
    // košík sa práve mení / objednávka sa odosiela -> krajina ostane, zákazník to skúsi o chvíľu
    if (o.zakaz && o.zakaz()) { sel.value = povodna; return; }
    zmenStat(sel.value, sel, o);
  });
  return true;
}

/** Iná krajina doručenia -> údaje uložiť, krajina v session Shoptetu, krok 1 + Step1Validate, krok 2 nanovo. */
export function zmenStat(id, sel, o) {
  const doc = sel.ownerDocument;
  sel.disabled = true;
  // „Mením krajinu doručenia…“ tu aj na novom kroku 2 (riadok v hlavičke ho prečíta) -> jedna obrazovka cez obe stránky
  try { ukazSkok(doc, o.T, o.T.menimKrajinu); } catch (e) {}
  try { if (o.ss) o.ss.setItem(KLUC_HLASKA, o.T.menimKrajinu); } catch (e) {}
  try { if (o.form && o.ss) ulozFormular(o.form, o.ss); } catch (e) {}
  const meraj = o.meraj || function () {};
  return fetchSLimitom(AKCIA_KRAJINA, { method: "POST", headers: XHR, body: "deliveryCountryId=" + encodeURIComponent(id) }, LIMIT_KROK1_MS)
    .then(function (r) {
      if (r.chyba) throw { typ: "krajina-" + r.chyba };
      if (!r.ok) throw { typ: "krajina-kod", kod: r.status };
      return stiahniModelKrok1();
    })
    .then(potvrdKrok1)
    .then(function (r) {
      if (!r || !r.ok) throw r;
      meraj("lcd_opc_zmena_statu", { lcd_opc_krajina: id, lcd_opc_platba: r.platba });
      location.replace(r.ciel);
    })
    .catch(function (r) {
      meraj("lcd_opc_chyba", { lcd_opc_typ: (r && r.typ) || "vynimka", lcd_opc_kod: r && r.kod != null ? r.kod : null, lcd_opc_miesto: "stat" });
      try { if (o.ss) o.ss.removeItem(KLUC_HLASKA); } catch (e) {}
      location.assign(CESTA_KROK1);
    });
}
