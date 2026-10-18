// Výpočet ceny konfigurátora kamiónov — čistá funkcia bez DOM. Port schváleného artefaktu kamiony-app/cena.js
// (ES modul namiesto UMD; logika a čísla bez zmeny). Ceny dáva shoptet.js citajCeny() zo živých selectov Shoptetu.
// NEpoužíva truck-konfigurator/pricing.js calculatePrice (mŕtvy kód, zlé „+€10“) ani chyby konfigurator.gen.jsx:
//   Z1 — po prepnutí tapacíru na Nie sa nášivka na dverách (49 €) už nepripočíta (React ju v súhrne nechá),
//   Z2 — úspora 11 € pri jednej strane nášiviek sa počíta do „Ušetríte“ (React nie; prepínač usporaAjPriJednejStrane).
//
// vypocitajCenu(stav, data, moznosti) -> { spolu, riadky, usetrene, usetrenePercent, povodneSpolu, tapacirDostupny }
// ponuka(data, moznosti) -> sumy na kartách (príplatok, prečiarknutá cena, úspora) cez vypocitajCenu, takže karty,
//   lišta aj súhrn majú vždy rovnaké čísla.
//
// stav: typ 'kamion' | 'dodavka', znacka (kľúč značky, napr. 'DAF (TIR)'), material (text Shoptetu), nasivky
//   'nechcem' | 'stred' | 'boky' | 'boky+stred', tapacir 'ano' | 'nie', nasivkaDvere true | false (len pri tapacir 'ano').
// data: { ceny: { zaklad_eur, priplatky: { material{}, nasivky_rozlozenie{}, tapacir_balik, nasivka_na_dverach },
//   preciarknute_ceny: { nasivky_balik, nasivky_sofer_spolujazdec, nasivky_len_stred, tapacir, nasivka_na_dverach } },
//   vozidla: { znacky: [{ kluc, tapacir_dveri_dostupny }] } }.
//
// Pravidlá: spolu = základ + materiál + nášivky + tapacír + nášivka na dverách (tapacír a nášivka na dverách LEN pri
// vybranej značke s tapacírom — bez vozidla nič, ako živý kód). Prečiarknuté: balík nášiviek, tapacír, nášivka na
// dverách; „len šofér a spolujazdec“ / „len stred“ len ak moznosti.usporaAjPriJednejStrane !== false.
// usetrene = max(0, povodneSpolu − spolu), usetrenePercent = round(usetrene / povodneSpolu × 100).

export const NASIVKY = ["nechcem", "stred", "boky", "boky+stred"];

export function najdiZnacku(data, kluc) {
  if (!kluc || !data || !data.vozidla) return null;
  const z = data.vozidla.znacky;
  for (let i = 0; i < z.length; i++) if (z[i].kluc === kluc) return z[i];
  return null;
}

/** Tapacír dverí majú len kamióny („(TIR)“ v značke). Bez značky rozhoduje prepínač typu vozidla. */
export function tapacirDostupny(stav, data) {
  const z = najdiZnacku(data, stav && stav.znacka);
  if (z) return !!z.tapacir_dveri_dostupny;
  return !stav || stav.typ !== "dodavka";
}

export function vypocitajCenu(stav, data, moznosti) {
  stav = stav || {};
  moznosti = moznosti || {};
  if (!data || !data.ceny) throw new Error("vypocitajCenu: chýbajú data.ceny");
  const c = data.ceny, p = c.priplatky, pr = c.preciarknute_ceny;
  const usporaJedna = moznosti.usporaAjPriJednejStrane !== false;
  const riadky = [];

  riadky.push({ id: "zaklad", suma: c.zaklad_eur, povodna: null });

  if (stav.material) {
    if (!Object.prototype.hasOwnProperty.call(p.material, stav.material)) {
      throw new Error("vypocitajCenu: neznámy materiál „" + stav.material + "“");
    }
    riadky.push({ id: "material", suma: p.material[stav.material], povodna: null });
  }

  if (stav.nasivky && stav.nasivky !== "nechcem") {
    if (NASIVKY.indexOf(stav.nasivky) < 0) throw new Error("vypocitajCenu: neznáme rozloženie nášiviek „" + stav.nasivky + "“");
    let povodnaNas = null;
    if (stav.nasivky === "boky+stred") povodnaNas = pr.nasivky_balik;
    else if (usporaJedna) povodnaNas = stav.nasivky === "boky" ? pr.nasivky_sofer_spolujazdec : pr.nasivky_len_stred;
    riadky.push({ id: "nasivky", suma: p.nasivky_rozlozenie[stav.nasivky], povodna: povodnaNas });
  }

  const tapOk = tapacirDostupny(stav, data);
  const zn = najdiZnacku(data, stav.znacka);
  if (zn && zn.tapacir_dveri_dostupny && stav.tapacir === "ano") {
    riadky.push({ id: "tapacir", suma: p.tapacir_balik, povodna: pr.tapacir });
    if (stav.nasivkaDvere === true) {
      riadky.push({ id: "nasivka_dvere", suma: p.nasivka_na_dverach, povodna: pr.nasivka_na_dverach });
    }
  }

  let spolu = 0, povodne = 0;
  for (let i = 0; i < riadky.length; i++) {
    spolu += riadky[i].suma;
    povodne += riadky[i].povodna != null ? riadky[i].povodna : riadky[i].suma;
  }
  const usetrene = Math.max(0, povodne - spolu);
  const pct = povodne > 0 ? Math.round((usetrene / povodne) * 100) : 0;
  return { spolu, riadky, usetrene, usetrenePercent: pct, povodneSpolu: povodne, tapacirDostupny: tapOk };
}

/** Sumy na kartách ponuky — každá z riadkov vypocitajCenu (karta, lišta aj súhrn ukážu to isté číslo). */
export function ponuka(data, moznosti) {
  const out = { material: {}, nasivky: {}, tapacir: null, nasivka_dvere: null };
  function riadok(stav, id) {
    const r = vypocitajCenu(stav, data, moznosti).riadky;
    for (let i = 0; i < r.length; i++) if (r[i].id === id) return r[i];
    return null;
  }
  function karta(r) {
    if (!r) return null;
    return { suma: r.suma, povodna: r.povodna, usetrite: r.povodna != null ? Math.max(0, r.povodna - r.suma) : 0 };
  }
  Object.keys(data.ceny.priplatky.material).forEach((m) => { out.material[m] = riadok({ material: m }, "material").suma; });
  NASIVKY.forEach((k) => { out.nasivky[k] = k === "nechcem" ? { suma: 0, povodna: null, usetrite: 0 } : karta(riadok({ nasivky: k }, "nasivky")); });
  let tir = null;
  const z = data.vozidla.znacky;
  for (let i = 0; i < z.length; i++) if (z[i].tapacir_dveri_dostupny) { tir = z[i].kluc; break; }
  if (tir) {
    out.tapacir = karta(riadok({ znacka: tir, tapacir: "ano" }, "tapacir"));
    out.nasivka_dvere = karta(riadok({ znacka: tir, tapacir: "ano", nasivkaDvere: true }, "nasivka_dvere"));
  }
  return out;
}
