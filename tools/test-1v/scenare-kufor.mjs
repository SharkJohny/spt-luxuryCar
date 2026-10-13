// Scenáre navyše pre rohože do kufra Classic 619/622/625 a Premium 628/631/634 (typy „kufor-classic“, „kufor-premium“).
// VLASTNÍK: worker kufor (W3 / T2.2). Tvar a parametre: tools/test-1v/scenare-jedno.mjs.
//
// Spoločné scenáre pre rohože sú v jadre (tools/test-konfigurator-1v.mjs): brana, nulova-zmena, bez-auta,
// neuplne (auto -> farba), platne (auto + farba -> POST), dokoncit (starý web: „Dokončiť konfiguráciu“ = živý POST,
// zachytený a zrušený), k-suhrnu (nový vzhľad: posledný krok nevkladá, POST 0, potom košík).
// Živý POST rohože (14. 10. 2026): productId, priceId, language, amount, parameterValueId[78] — nič iné.
export const SCENARE = {};
