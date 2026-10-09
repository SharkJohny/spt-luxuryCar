/* test-kosik-rozpis.mjs — rozpis položky v paneli košíka (assets/js/functions/kosikRozpis.js).
 *
 * Michal 9. 10. 2026 (iPhone CZ): panel ukazoval „Příplatky: rozložení koberců - první a druhá řada,…“ —
 * Shoptet text v paneli skracuje. Overuje delenie farieb vrstiev a príplatkov na riadky (skutočné texty z CZ/SK
 * košíka), vynechanie „TYP - …“ a čítanie plného textu z obsahu košíka podľa itemId.
 * Spustenie: node tools/test-kosik-rozpis.mjs
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { JSDOM } = createRequire(join(ROOT, "package.json"))("jsdom");
const { lcdRozpis, lcdRozpisZObsahu, lcdVrstvy } = await import(pathToFileURL(join(ROOT, "assets/js/functions/kosikRozpis.js")).href);

let zlyhania = 0;
const over = (podm, m, detail) => { if (podm) console.log("✓ " + m); else { zlyhania++; console.error("✗ " + m + (detail !== undefined ? " — " + JSON.stringify(detail) : "")); } };
const txt = (r) => r.map((x) => (x.n ? x.n + ": " : "") + x.h);

// CZ dvojvrstvový set z hlásenia (iPhone 17:31)
let r = lcdRozpis({ cz: true, variant: "Barva 1.vrstvy: Diamond Barva kůže: Šedá, Barva 2.vrstvy: Lux Color 09",
  priplatky: "Příplatky: rozložení koberců - první a druhá řada, autokoberce do kufru - Koberec na dno + boky, Barva boxů - Barva kůže: výnově červena, TYP - Combi, Velikost 1. boxu - M : 40x32x30 cm, Velikost 2. boxu - M : 40x32x30 cm" });
over(JSON.stringify(txt(r)) === JSON.stringify(["Barva 1. vrstvy: Diamond Barva kůže: Šedá", "Barva 2. vrstvy: Lux Color 09",
  "Rozložení koberců: první a druhá řada", "Autokoberce do kufru: Koberec na dno + boky", "Barva boxů: Barva kůže: výnově červena",
  "Velikost 1. boxu: M: 40x32x30 cm", "Velikost 2. boxu: M: 40x32x30 cm"]), "CZ dvojvrstvový set: 2 farby + 5 príplatkov, bez TYP", txt(r));

// SK jednovrstvový + box Solo („názov: - hodnota“) + farba so „/“
r = lcdRozpis({ cz: false, variant: "Farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Červená",
  priplatky: "Príplatky: rozloženie koberčekov - prvý a druhý rad, autokoberce do kufra - nie, Farba boxov - Farba kože: Čierna / Farba šitia: Červená, TYP - Combi, Velokost box Solo: - S : 33x32x30 cm" });
over(JSON.stringify(txt(r)) === JSON.stringify(["Farba 1. vrstvy: Diamond Farba kože: Čierna / Farba šitia: Červená", "Rozloženie koberčekov: prvý a druhý rad",
  "Autokoberce do kufra: nie", "Farba boxov: Farba kože: Čierna / Farba šitia: Červená", "Velokost box Solo: S: 33x32x30 cm"]), "SK jednovrstvový + box Solo", txt(r));

// čiarka vo vnútri hodnoty nedelí
r = lcdRozpis({ cz: false, variant: "", priplatky: "Príplatky: rozloženie koberčekov - prvý, druhý a tretí rad, autokoberce do kufra - nie" });
over(r.length === 2 && r[0].h === "prvý, druhý a tretí rad", "hodnota s čiarkou ostane celá", txt(r));

// farba 1. vrstvy s čiarkou pred 2. vrstvou (cart.js fallback ju strácal)
over(JSON.stringify(lcdVrstvy("Barva 1.vrstvy: Hexa, Barva kůže: Béžová, Barva 2.vrstvy: Lux Color 12")) === JSON.stringify(["Hexa, Barva kůže: Béžová", "Lux Color 12"]), "1. vrstva s čiarkou");

// bez farieb a príplatkov (poukážka) -> prázdne = natívny text ostáva
over(lcdRozpis({ cz: false, variant: "Hodnota: 100 €", priplatky: "" }).length === 0, "poukážka: nič na rozpis");

// zvyšok variantu mimo farieb sa nestratí (natívny variant je v paneli skrytý)
r = lcdRozpis({ cz: true, variant: "Typ: Combi, Barva 1.vrstvy: Hexa", priplatky: "Příplatky: rozložení koberců - první řada" });
over(JSON.stringify(txt(r)) === JSON.stringify(["Typ: Combi", "Barva 1. vrstvy: Hexa", "Rozložení koberců: první řada"]), "zvyšok variantu ostane", txt(r));
r = lcdRozpis({ cz: false, variant: "Veľkosť: L", priplatky: "Príplatky: farba - čierna" });
over(JSON.stringify(txt(r)) === JSON.stringify(["Veľkosť: L", "Farba: čierna"]), "variant bez farieb + príplatky", txt(r));

// kamiónové zástupné hodnoty preč
r = lcdRozpis({ cz: false, variant: "", priplatky: "Príplatky: Vozidlo - Vyberie sa v konfigurátore, kabína - jednoduchá" });
over(JSON.stringify(txt(r)) === JSON.stringify(["Kabína: jednoduchá"]), "kamión: bez zástupných hodnôt", txt(r));

// obsah košíka -> plný text podľa itemId (2 riadky toho istého produktu)
const html = `<table><tr class="removeable" data-micro="cartItem"><td class="p-name"><a class="main-link">luxusní autokoberce
  <span class="main-link-variant" data-testid="cartWidgetVariantName">Barva 1.vrstvy: Diamond   Barva kůže: Černá</span>
  <span class="main-link-surcharges" data-testid="cartWidgetSurchargeName">Příplatky: rozložení koberců - první a druhá řada, autokoberce do kufru - Koberec na dno kufru</span></a></td>
  <td><form><input type="hidden" value="6ac64dd2e3ab0" name="itemId"/></form></td></tr>
  <tr class="removeable" data-micro="cartItem"><td><a class="main-link">x<span class="main-link-variant" data-testid="cartWidgetVariantName">Barva 1.vrstvy: Hexa</span></a></td>
  <td><form><input type="hidden" value="aa11" name="itemId"/></form></td></tr></table>`;
const { window } = new JSDOM("");
const m = lcdRozpisZObsahu(html, window.DOMParser);
over(Object.keys(m).join() === "6ac64dd2e3ab0,aa11", "2 riadky podľa itemId", Object.keys(m));
over(m["6ac64dd2e3ab0"].p.endsWith("Koberec na dno kufru") && m["6ac64dd2e3ab0"].v === "Barva 1.vrstvy: Diamond Barva kůže: Černá", "plný text príplatkov, zlúčené medzery", m["6ac64dd2e3ab0"]);
over(m.aa11.p === "", "riadok bez príplatkov");
over(Object.keys(lcdRozpisZObsahu("", window.DOMParser)).length === 0, "prázdny obsah");

console.log(zlyhania ? `\n${zlyhania} zlyhaní` : "\nVšetko OK");
process.exit(zlyhania ? 1 : 0);
