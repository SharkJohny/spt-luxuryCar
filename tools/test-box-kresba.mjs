// Názvy farieb boxov SK aj CZ -> kľúč kresby (box-kresba.js slugFarby + FARBY_KRESBY) a fotky farby (typy/boxy.js).
// Texty sú zo živých selectov 616 (SK) a 2427 (CZ), 4. 11. 2026. Chyba, ktorú stráži: CZ názvy nemali kľúč v mape, takže
// kresba boxu na CZ ostávala v predvolenej farbe (vínový box čierny s béžovým šitím).
//   node tools/test-box-kresba.mjs
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { JSDOM } = createRequire(join(ROOT, "package.json"))("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://www.luxurycardesign.cz/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const modul = (cesta) => import(pathToFileURL(join(ROOT, "assets/js/components/konfigurator1v", cesta)).href);
const { slugFarby, FARBY_KRESBY, PREDVOLENA } = await modul("box-kresba.js");
const { nazovFarby } = await modul("kroky.js");
const { TYP: boxy } = await modul("typy/boxy.js");

const VZORY = [
  ["Diamond Farba kože : Čierna / Farba šitia: Červená", "cierna-cervene-sitie"],
  ["Diamond Farba kože : Čierna / Farba šitia: Modrá", "cierna-modre-sitie"],
  ["Diamond Farba kože : Čierna / Farba šitia: Čierna", "cierna-cierne-sitie"],
  ["Diamond Farba kože : čierna / Farba šitia : Béžová", "cierna-bezove-sitie"],
  ["Diamond Farba kože : Čierna / Farba šitia : Sivá", "cierna-sive-sitie"],
  ["Diamond Farba kože : čierna / Farba šitia : bielou", "cierna-biele-sitie"],
  ["Diamond Farba kože : Béžová", "bezova"],
  ["Diamond Farba kože : Hnedá káva", "hneda-kava"],
  ["Diamond Farba kože : Vínovo Červená", "vinovo-cervena"],
  ["Diamond Barva kůže: Černá / Barva šití: Červená", "cierna-cervene-sitie"],
  ["Diamond Barva kůže: Černá / Barva šití: Modrá", "cierna-modre-sitie"],
  ["Diamond Barva kůže: Černá / Barva šití: Černá", "cierna-cierne-sitie"],
  ["Diamond Barva kůže: Černá / Barva šití: Béžová", "cierna-bezove-sitie"],
  ["Diamond Barva kůže: Černá / Barva šití: Šedá", "cierna-sede-sitie"],
  ["Diamond Barva kůže: Černá / Barva šití: Bílá", "cierna-biele-sitie"],
  ["Diamond Barva kůže: Kávově hnědá", "hneda-kava"],
  ["Diamond Barva kůže: Vínově červená", "vinovo-cervena"],
  ["Diamond Barva kůže: Šedá", "seda"],
  ["Barva kůže: výnově červena", "vinovo-cervena"], // preklep v CZ admine setov (2403 …), kým sa neopraví
  ["Barva kůže: Béžová", "bezova"],
  ["Barva kůže: bežová", "bezova"],
];

let chyby = 0;
for (const [text, cakany] of VZORY) {
  const k = slugFarby(nazovFarby(text).nazov);
  try {
    assert.equal(k, cakany);
    assert.ok(FARBY_KRESBY[k], "kľúč nie je v FARBY_KRESBY");
    assert.ok(boxy.obrazky["boxprodukt-farba-" + k], "chýba fotka farby");
    console.log("OK  ", text, "->", k);
  } catch (e) {
    chyby++;
    console.log("CHYBA", text, "->", k, "| čakané", cakany, "|", e.message.split("\n")[0]);
  }
}
assert.ok(FARBY_KRESBY[PREDVOLENA]);
console.log(chyby ? `CHYBY: ${chyby}` : `Všetko OK (${VZORY.length})`);
process.exit(chyby ? 1 : 0);
