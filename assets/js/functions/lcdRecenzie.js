// Recenzie z Google — spoločná logika výberu a zobrazenia (29. 10. 2026, schválené Michalom: „3 najnovšie + 9 vybraných“).
// Bez DOM a bez window: rovnaký kód používa sekcia 1V „Hodnotenia priamo z Google“ (konfigurator1v/obsah-a.js), oživenie
// recenzií titulky (functions/lcdHpRecenzie.js) aj generátor HTML titulky pre admin (tools/hp-recenzie.mjs v Node) —
// admin HTML a web tak rátajú výber, texty aj dátumy rovnako.
//
// Dáta: window.LCD_REVIEWS (assets/js/reviews-data.js, generuje tools/reviews-update.mjs): place { rating, totalReviews,
// fetchedAt }, reviews [{ id "g-N", author, rating, text, photos, dateApprox "RRRR-MM-DD", relativeDate „Pred N týždňami“ }].
// Nová recenzia dostane id o 1 vyššie než doteraz najvyššie (reviews-update.mjs) — podľa toho titulka pozná recenzie
// novšie než jej HTML v admine (data-lcd-rec-max).

/** Najkratší text recenzie, ktorá smie byť medzi najnovšími / vybranými kartami (Michal 29. 10. 2026: „s textom ≥ 40 znakov“). */
export const MIN_TEXT = 40;
/** Koľko najnovších recenzií ide pred Michalov ručný výber. */
export const NAJNOVSICH = 3;

/** Karta s textom: aspoň 4 hviezdy a text ≥ MIN_TEXT znakov. */
export function dobraRecenzia(r) {
  return !!r && Number(r.rating) >= 4 && String(r.text || "").trim().length >= MIN_TEXT;
}

/** Číslo z id „g-N“ (0, keď id nie je v tomto tvare). */
export function cisloId(r) {
  const m = /^g-(\d+)$/.exec(String((r && r.id) || ""));
  return m ? Number(m[1]) : 0;
}

const TYZDEN = 7 * 864e5;
/** Približný čas recenzie (ms): dateApprox, inak „Pred N týždňami“ k place.fetchedAt; NaN, keď sa nedá určiť. */
export function casRecenzie(r, fetchedAt) {
  const t = Date.parse(r && r.dateApprox);
  if (t > 0) return t;
  const m = /(\d+)\s*týž/i.exec(String((r && r.relativeDate) || ""));
  const f = Date.parse(fetchedAt);
  return m && f > 0 ? f - Number(m[1]) * TYZDEN : NaN;
}

/**
 * n najnovších recenzií s textom (dobraRecenzia). Google ukazuje len „pred X“, preto majú viaceré recenzie ten istý
 * približný dátum — pri zhode má prednosť recenzia s fotkami, potom novšie id (pridaná neskôr).
 */
export function najnovsie(zoznam, n, fetchedAt) {
  return (zoznam || []).filter(dobraRecenzia).map((r) => ({ r, t: casRecenzie(r, fetchedAt) || 0 }))
    .sort((a, b) => b.t - a.t || ((b.r.photos || []).length - (a.r.photos || []).length) || (cisloId(b.r) - cisloId(a.r)))
    .slice(0, Math.max(0, n)).map((x) => x.r);
}

/**
 * Poradie kariet: NAJNOVSICH najnovších s textom, potom Michalov výber podľa mena autora (vyber = pole mien, bez
 * duplicít), potom doterajšie pravidlo 5★ + ≥ 2 fotky + text ≥ 200 znakov a napokon všetky ostatné s textom (≥ 4★) v poradí
 * zdroja („Zobraziť ďalšie recenzie“). Prvých 12 = 3 najnovšie + 9 z výberu.
 */
export function zoradRecenzie(zoznam, vyber, { najnovsich = NAJNOVSICH, fetchedAt } = {}) {
  const z = (zoznam || []).filter(Boolean);
  const out = najnovsie(z, najnovsich, fetchedAt);
  const pridaj = (r) => { if (out.indexOf(r) === -1) out.push(r); };
  (vyber || []).map((x) => String(x).trim()).filter(Boolean).forEach((meno) => {
    const r = z.find((x) => x.author === meno);
    if (dobraRecenzia(r)) pridaj(r);
  });
  z.filter((r) => dobraRecenzia(r) && Number(r.rating) >= 5 && (r.photos || []).length >= 2 && String(r.text).length >= 200).forEach(pridaj);
  z.filter((r) => Number(r.rating) >= 4 && String(r.text || "").trim()).forEach(pridaj);
  return out;
}

/** „Majlo Mario|Pavol Papúch|…“ (data-p1v-vyber) -> pole mien */
export const menaVyberu = (s) => String(s || "").split("|").map((x) => x.trim()).filter(Boolean);

/** Text karty: bez dátumu na začiatku a odpovede majiteľa (prilepené starým scraperom), dlhý skrátený na celé slovo (~300 zn.). */
export function textRecenzie(t) {
  let s = String(t || "").replace(/\s*Luxury Car Design\s+Vlastník\b[\s\S]*$/i, "").replace(/\s+/g, " ").trim()
    .replace(/^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\s*/, "");
  if (s.length > 300) { const c = s.slice(0, 301); s = c.slice(0, c.lastIndexOf(" ")).replace(/[\s,;:–—-]+$/, "") + "…"; }
  return s;
}

/** Iniciály autora do krúžku karty („Majlo Mario“ -> „MM“). */
export function iniciala(meno) {
  const c = String(meno || "").trim().split(/\s+/).filter(Boolean);
  return ((c[0] || "?").charAt(0) + (c.length > 1 ? c[c.length - 1].charAt(0) : "")).toUpperCase();
}

/** 5 -> „5,0“ */
export const cislo1 = (x) => (Math.round(Number(x) * 10) / 10).toFixed(1).replace(".", ",");

/** Tvar slova za počtom: SK 1 recenzia, 2–4 recenzie, 5+ recenzií; CZ 1 recenze, 2–4 recenze, 5+ recenzí. */
export function tvarRecenzii(n, trh) {
  const k = Math.round(Number(n));
  if (trh === "cz") return k === 1 || (k >= 2 && k <= 4) ? "recenze" : "recenzí";
  return k === 1 ? "recenzia" : k >= 2 && k <= 4 ? "recenzie" : "recenzií";
}

/** „101 recenzií na Google · hodnotenie 5,0“ / „101 recenzí na Google · hodnocení 5,0“ */
export function riadokPoctu(pocet, hodnotenie, trh) {
  return pocet + " " + tvarRecenzii(pocet, trh) + " na Google · " + (trh === "cz" ? "hodnocení " : "hodnotenie ") + cislo1(hodnotenie);
}

/**
 * Dátum na karte ako „mesiac rok“ podľa trhu („október 2026“ / „říjen 2026“), nie relatívne „Pred N týždňami“
 * (s časom prestane sedieť). Z dateApprox, inak z relativeDate k fetchedAt; nedá sa -> "" (karta ukáže „Overený zákazník“).
 * Časové pásmo UTC: dateApprox je dátum bez času, výsledok nesmie závisieť od pásma prehliadača ani servera.
 */
export function datumRecenzie(r, fetchedAt, trh) {
  const t = casRecenzie(r, fetchedAt);
  if (!(t > 0)) return "";
  try {
    return new Intl.DateTimeFormat(trh === "cz" ? "cs-CZ" : "sk-SK", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(t));
  } catch (e) {
    return "";
  }
}

/** Adresa náhľadu fotky recenzie: …/assets/img/reviews/rg-N-I.jpg -> …/assets/img/reviews/m/rg-N-I.jpg (iné adresy bez zmeny). */
export function nahladRecenzie(u) {
  return String(u).replace(/(\/assets\/img\/reviews\/)(rg-[\w-]+\.jpg)(\?[^#]*)?$/, "$1m/$2");
}

/** Fotky karty: len https adresy, najviac 3 (ako doteraz v 1V). */
export const fotkyKarty = (r) => ((r && r.photos) || []).filter((u) => /^https:\/\//.test(u)).slice(0, 3);
