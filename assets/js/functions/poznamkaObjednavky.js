/**
 * poznamkaObjednavky.js — čo ide do poznámky objednávky (main.js toNote) podľa riadkov objednávky, kniha OPC § 10.44.
 *
 * Prečo: toNote písal buď blok kamióna, alebo „model: …“, podľa toho, čo ostalo v sessionStorage. Súhrn kamióna sa nikde
 * nemazal, takže košík s kamiónom aj autom prišiel bez „model: …“ a košík bez kamióna so starým blokom kamióna. Teraz
 * rozhodujú riadky objednávky, rovnako ako v Jánovom exporte („Rozhoduje položka, nie poznámka“).
 *
 * Formát nemeniť (čítajú ho Jánov export, Back Office feed.js, CRM api/email.js):
 *  - blok medzi značkami skladá mergeTruckOrderSummaryIntoNote, „model: …“ do bloku nikdy nepatrí;
 *  - „model: …“ ide PRED blok, CRM reže poznámku na 300 znakov a blok je dlhší;
 *  - ručný text zákazníka ostáva navrchu.
 * Keď sa riadky nedajú prečítať, platí pôvodné správanie: blok má prednosť, inak „model: …“.
 */
import { mergeTruckOrderSummaryIntoNote } from "../truck-konfigurator/order-summary.mjs";
import { jeKamionKod, jeKamionAdresa, jeKamionText } from "./kamionPolozka.js";

/** Model je použiteľný, len keď má všetky časti. Na stránkach bez konfigurátora auta saveModel uloží „undefined undefined…“. */
function pouzitelnyModel(savedModel) {
  const value = String(savedModel || "").trim();
  if (!value || value === "undefined" || value === "null") return false;
  return !/\b(undefined|null)\b/.test(value);
}

/** Riadok objednávky { sku, href, text } je kamión / dodávka? Kód a adresa sú presné, text („Auto: …“ môže obsahovať čokoľvek)
 *  len záloha. Pravidlo (TRUCK v kóde, „kamion“ / „autokoberce-do-dodavky“ v adrese) je vo functions/kamionPolozka.js. */
export function jeKamionRiadok(r) {
  if (!r) return false;
  if (r.sku || r.href) return jeKamionKod(r.sku) || jeKamionAdresa(r.href);
  return jeKamionText(r.text);
}

/** Patrí k položke s touto adresou auto? Autokoberce, rohož do kufra a box; vzorkovník, poukážka, kamión ani dodávka
 *  (/autokoberce-do-dodavky-…/ má v adrese „autokoberce“) nie (aj cart.js autoPolozky). */
export function patriAutu(href) {
  const h = String(href || "");
  return !/vzorkovnik|poukaz/i.test(h) && !jeKamionAdresa(h) && /autokoberce|koberced?-do-kufr|boxi?-do-kufr/i.test(h);
}

/** Riadky rekapitulácie objednávky [{ sku, href, text }]; null = nevieme (vtedy pôvodné správanie). Stará pokladňa aj OPC majú rovnaké značky. */
export function riadkyPoznamky(doc) {
  try {
    const el = doc.querySelectorAll("body.ordering-process .cart-items .cart-item");
    if (!el.length) return null;
    return Array.prototype.map.call(el, function (r) {
      const a = r.querySelector("a.main-link");
      return { sku: r.getAttribute("data-micro-sku") || "", href: (a && a.getAttribute("href")) || "", text: r.textContent || "" };
    });
  } catch (e) { return null; }
}

/**
 * Nový text poznámky. o: { truckSummary, savedModel, riadky }.
 * Volá sa po každej úspešnej validácii, takže výsledok sa pri opakovaní nesmie meniť.
 */
export function zlozPoznamku(note, o) {
  const summary = o.truckSummary || "";
  const riadky = Array.isArray(o.riadky) && o.riadky.length ? o.riadky : null;
  const kamion = riadky ? riadky.some(jeKamionRiadok) : !!summary;
  const auto = !riadky ? !summary : !kamion || riadky.some(function (r) { return patriAutu(r.href); });

  let text = String(note || "");
  // starý automatický blok preč; kamión bez súhrnu v karte si blok z predošlého pokusu nechá, iný už nikde nie je
  if (kamion ? !!summary : !!riadky) text = mergeTruckOrderSummaryIntoNote(text, "");
  if (auto && pouzitelnyModel(o.savedModel)) {
    const riadok = `model: ${o.savedModel}`;
    if (!text.includes(riadok)) text = text ? `${text}\n\n${riadok}` : riadok;
  }
  if (kamion && summary) text = mergeTruckOrderSummaryIntoNote(text, summary);
  return text;
}
