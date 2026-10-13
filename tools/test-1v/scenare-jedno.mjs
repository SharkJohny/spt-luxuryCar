// Scenáre navyše pre jednovrstvové 598/610/613 (typ „jedno“). VLASTNÍK: worker jedno-vzory (W1 / T1.1).
// Spoločné scenáre (brana, nulova-zmena, platne, kufor-*, box-*, rady-3, k-suhrnu …) sú v tools/test-konfigurator-1v.mjs.
//
// Tvar (rovnaký vo všetkých scenare-<typ>.mjs):
//   export const SCENARE = { "<meno>": { typy: ["jedno"], fn: async (s, a, pom, ovl, j) => ({ info, post, spolu } | { preskoc }) } };
//   s    = otvorená karta (s.t pomocník, s.posty zachytené POST, s.produkt profil, s.upozornenia [])
//   a    = prepínače + a.url / a.produkt tohto behu
//   pom  = { novaStranka(build) }
//   ovl  = ovládače { kroky, rozlozenie, kuforBoxy, cena, farba2, boxy, vzorky, zdroj }
//   j    = jadro { otvor, zaklad, overPost, overCenu, cakajNaPost, nieHodnoty, over, pauza, AUTO, TYPY_TEST }
// Vrátené `spolu` sa porovná s profilom (tools/test-1v/produkty.mjs `ceny[<meno>]`), ak tam je.
export const SCENARE = {};
