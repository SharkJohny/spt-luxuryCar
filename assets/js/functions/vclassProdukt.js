/**
 * Mercedes triedy V (konfigurátor components/konfigurator1v/vclass/): produkt na SK a CZ webe. Jediné miesto s ID produktu,
 * priceId a kódom — používa ho košík (lcdKosikDoplnok.js jeVclass, opc/vclassKarta.js, components/cart.js) a presmerovanie
 * (functions/vclassPresmerovanie.js). Register konfigurátora 1V (konfigurator1v/produkty.js) má ID napísané číslom (test ho
 * číta regulárnym výrazom), musí sa zhodovať s pid nižšie (tools/test-vclass-cz.mjs to overí).
 *
 * SK 646 naživo od 8. 11. 2026. CZ = presná kópia SK (Michal 8. 11. 2026: „urob presnú kópiu, ako sme to spravili na Slovensku“),
 * produkt a príplatky v CZ admine založil druhý pomocník 8. 11. 2026, adresa je rovnaká ako na SK.
 * Ponuka v košíku a rozpis sa riadia projektom webu: SK produkt len na SK, CZ produkt len na CZ, nikdy krížom.
 */
export const VCLASS_SK = { trh: "sk", projekt: "562035", pid: "646", priceId: "68434", kod: "VCLASS", url: "/autokoberce-mercedes-v-class/" };

/** CZ produkt triedy V 2458 (CZ admin 8. 11. 2026, príplatky 355–397; zatiaľ v kategórii Test len pre prihláseného admina). */
export const VCLASS_CZ = { trh: "cz", projekt: "581408", pid: "2458", priceId: "46327", kod: "VCLASS", url: "/autokoberce-mercedes-v-class/" };

/**
 * Presmerovanie na CZ stránku triedy V (okno „Máte Mercedes třídy V?“ v konfigurátore autokobercov a výber auta na titulke).
 * false = CZ zákazníkov nič nepresmeruje (CZ produkt je zatiaľ len pre prihláseného admina). Prepnúť na true až v tom istom
 * vydaní, keď je CZ produkt verejný (hlavná session).
 */
export const CZ_SPUSTENE = false;

/** Produkt triedy V webu s týmto projektom Shoptetu (SK 562035, CZ 581408) alebo null. */
export function vclassPreProjekt(projekt) {
  const p = String(projekt == null ? "" : projekt);
  return p === VCLASS_SK.projekt ? VCLASS_SK : p === VCLASS_CZ.projekt ? VCLASS_CZ : null;
}
