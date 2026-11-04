#!/usr/bin/env node
// Názov parametra veľkosti boxu: SK bol v admine po česky „Velikost 1. boxu“, po oprave „Veľkosť 1. boxu“. Živý kód okna boxov
// rozpoznáva veľkosti podľa nadpisu h5, preto musí prijať všetky zápisy (aj CZ preklep „Velokost box Solo“).
//   node tools/test-nazov-velkost.mjs
import { readFileSync } from "node:fs";

const SUBORY = ["assets/js/components/productPage.js", "assets/js/configurator-enhance.js"];
const ZAPISY = ["Velikost 1. boxu", "Velikost Box solo", "Velokost box Solo", "Veľkosť 1. boxu", "Veľkosť Box solo", "veľkosť 2. boxu", "Velkost 3. boxu"];
const INE = ["Farba boxov", "Počet boxov", "Barva boxu"];
let zle = 0;
for (const f of SUBORY) {
  const zdroj = readFileSync(new URL("../" + f, import.meta.url), "utf8");
  const vzory = [...zdroj.matchAll(/\/\^ve[^/]*kos\[tť\]\/i?/g)].map((m) => m[0]);
  if (!vzory.length) { console.log("ZLE", f, "vzor sa nenašiel"); zle++; }
  for (const v of vzory) {
    const re = new RegExp(v.slice(1, v.lastIndexOf("/")), "i");
    for (const t of ZAPISY) if (!re.test(t)) { console.log("ZLE", f, v, "neprijal", t); zle++; }
    for (const t of INE) if (re.test(t)) { console.log("ZLE", f, v, "prijal", t); zle++; }
  }
}
console.log(zle ? zle + " ZLE" : "Všetko OK");
process.exit(zle ? 1 : 0);
