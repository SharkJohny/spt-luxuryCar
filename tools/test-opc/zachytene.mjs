// Fixtures offline testov one page checkoutu (tools/test-opc.mjs, test-opc-jednotky.mjs, test-opc-snimky.mjs).
// Priečinok tools/test-opc/fixtures/ NIE JE v gite: VOP Shoptet 07/2026 čl. 11.3 zakazuje kópie JS Shoptetu v repe
// (fixtures/cdn má main-3g.js, checkout-3g.js…, HTML krokov má inline skripty Shoptetu). Každý si ich vyrobí lokálne
// podľa tools/test-opc/FIXTURES.md. Keď chýbajú, spúšťač skončí touto hláškou a exit 1 — nie pádom.
//   LCD_OPC_FIXTURES=<priečinok>  iné umiestnenie (aj test hlášky v test-opc-jednotky.mjs)
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const FIXTURES = process.env.LCD_OPC_FIXTURES ? resolve(process.env.LCD_OPC_FIXTURES) : join(KOREN, "tools/test-opc/fixtures");

const ZAKLAD = ["kosik.html", "krok1.html", "krok2.html", "step1-303.json", "suhrn-5.html"];
/** Súbory, bez ktorých testy webu nebežia (set a kamión sú zachytené len pre SK). */
const POTREBNE = {
  sk: [...ZAKLAD.map((f) => "sk/" + f), "sk/krok1-dobierka.html", "sk/suhrn-3.html", ...ZAKLAD.map((f) => "sk-set/" + f), ...ZAKLAD.map((f) => "sk-kamion/" + f)],
  cz: [...ZAKLAD.map((f) => "cz/" + f), "cz/krok1-dobierka.html", "cz/suhrn-87.html"],
};

/** Chýbajúce súbory fixtures pre weby (cesty relatívne k FIXTURES). bezCdn = statické súbory Shoptetu sa práve dopĺňajú. */
export function chybajuceFixtures(weby = ["sk", "cz"], { bezCdn = false } = {}) {
  const zoznam = ["data.json", ...(bezCdn ? [] : ["cdn/manifest.json"])];
  weby.forEach((w) => zoznam.push(...(POTREBNE[w] || [])));
  return zoznam.filter((f) => !existsSync(join(FIXTURES, f)));
}

/** Keď fixtures chýbajú: hláška s návodom a exit 1. */
export function vyzadujFixtures(weby, moznosti = {}) {
  const ch = chybajuceFixtures(weby, moznosti);
  if (!ch.length) return;
  const ukaz = ch.slice(0, 8).join(", ") + (ch.length > 8 ? " … (spolu " + ch.length + ")" : "");
  console.error(`CHÝBAJÚ FIXTURES offline testu one page checkoutu v ${FIXTURES}
  chýba: ${ukaz}
  Priečinok nie je v gite (VOP Shoptet 07/2026 čl. 11.3: žiadne kópie JS Shoptetu v repe). Vyrob ho lokálne podľa
  tools/test-opc/FIXTURES.md:
    node tools/test-opc-zachyt.mjs --web sk        (a --web cz, --kosik set / kamion --telo <súbor>; live-read: len GET,
                                                    košík, Step1Validate, nič sa neobjedná)
    node tools/test-opc.mjs --doplnit-cdn          (statické súbory Shoptetu raz GET-om z cdn.myshoptet.com)`);
  process.exit(1);
}
