// Kópie konfigurátora kamiónov rozpoznané podľa ADRESY, nie podľa ID (kniha Brain napady/2026-11-11-kamiony-vsetky-ulohy.md
// §2.1): ID kópií vzniknú až v admine, kód sa tak dá vydať skôr, než produkty existujú. Súbor je bez importov (číta ho
// produkty.js, truck-konfigurator/mount.js a testy).
//
//   skryty: true            skrytý konfigurátor s logami značiek (A2) — vzhľad ako 640 / 2452, motívy sa berú zo selectov
//                           (v admine zapnuté logá), po štarte bundla <meta name="robots" content="noindex, nofollow">;
//                           jeden spoločný odkaz pre overených zákazníkov (Michal 11. 11. 2026).
//   kamion: { znacka, model, nazov }
//                           stránka kamióna alebo dodávky pre Google (A3) s pevným modelom (ako stránky áut, auto-produkt.js):
//                           znacka = kľúč zo zoznamu vozidiel („Scania (TIR)“, „Fiat (dodávka)“), model = presný názov
//                           z tabuľky (data.json, „R 2017-2026“), nazov = text nápisu „Predvyplnené pre …“. H1 = názov
//                           produktu z adminu.
//
// Pravidlo pre admin (detektory košíka a objednávky = functions/kamionPolozka.js): kód produktu obsahuje samostatné slovo
// TRUCK (TRUCK-LOGA, TRUCK-SCANIA-R, TRUCK-FIAT-DUCATO …); stránka kamióna má v názve „kamión“ / „kamion“ a v adrese
// „kamion“; stránka dodávky má názov „Autokoberce do dodávky …“ a adresu /autokoberce-do-dodavky-<model>/ (13. 11. 2026).
// Rovnaký slug SK aj CZ pri stránkach kamiónov a dodávok (seo-hreflang.js ich páruje); skrytá kópia má na CZ vlastnú
// adresu a jazykový pár nemá.

/** projectId -> cesta -> záznam. SK = 562035, CZ = 581408. Cesta malými písmenami, s lomkou na začiatku aj na konci. */
export const KAMION_STRANKY = {
  562035: {
    "/luxusne-autokoberce-kamiony-1/": { skryty: true },
    // prvá vlna stránok kamiónov (kniha §2.3): modely a roky presne z tabuľky konfigurátora (data.json 11. 11. 2026)
    "/autokoberce-do-kamionu-scania-r/": { kamion: { znacka: "Scania (TIR)", model: "R 2016-2026", aliasy: ["R 2017-2026"], nazov: "Scania R" } },
    "/autokoberce-do-kamionu-man-tgx/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2020-2026", aliasy: ["TGX 2021-2026"], nazov: "MAN TGX" } },
    "/autokoberce-do-kamionu-volvo-fh4/": { kamion: { znacka: "Volvo (TIR)", model: "FH4 2013-2021", nazov: "Volvo FH4" } },
    "/autokoberce-do-kamionu-mercedes-actros/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP4/MP5/MP6 (rovná podlaha) 2011-2026", nazov: "Mercedes-Benz Actros MP4/MP5/MP6" } },
    // vlna 2 a 3 (kniha Brain napady/2026-11-12-kamiony-vlna-2-3-disk-a-odpov.md §2.1, a3/plan-35-modelov.csv, variant A po
    // generáciách, Michal 12. 11. 2026): znacka + model znak po znaku z tabuľky, nazov = nazov_sk bez „Autokoberce do kamiónu “.
    // Produkty zatiaľ neexistujú — kým adresa v Shoptete nie je, záznam sa nikdy nepoužije (žiadne ID, žiadny fetch).
    "/autokoberce-do-kamionu-daf-xf105/": { kamion: { znacka: "DAF (TIR)", model: "XF105 2006-2012", nazov: "DAF XF105" } },
    "/autokoberce-do-kamionu-daf-xf106/": { kamion: { znacka: "DAF (TIR)", model: "XF106 2017-2021", nazov: "DAF XF106" } },
    "/autokoberce-do-kamionu-daf-xg/": { kamion: { znacka: "DAF (TIR)", model: "XG / XG+ 2021-2026", aliasy: ["XG / XG+ 2022-2026"], nazov: "DAF XG a XG+" } },
    "/autokoberce-do-kamionu-man-tgx-2018/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2018-2020", nazov: "MAN TGX 2018–2020" } },
    "/autokoberce-do-kamionu-mercedes-actros-solostar/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP4/MP5/MP6 2021-2026 – obytná kabína (Solostar)", nazov: "Mercedes-Benz Actros Solostar" } },
    "/autokoberce-do-kamionu-scania-s/": { kamion: { znacka: "Scania (TIR)", model: "S 2016-2026", aliasy: ["S 2017-2026"], nazov: "Scania S" } },
    "/autokoberce-do-kamionu-daf-xf106-2013/": { kamion: { znacka: "DAF (TIR)", model: "XF106 2013-2016", nazov: "DAF XF106 2013–2016" } },
    "/autokoberce-do-kamionu-man-tgx-2007/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2007-2017", nazov: "MAN TGX 2007–2017" } },
    "/autokoberce-do-kamionu-mercedes-actros-2003/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP2/MP3 (rovná podlaha) 2003-2011", aliasy: ["Actros MP2/MP3 (rovná podlaha) 2003-2008"], nazov: "Mercedes-Benz Actros MP2/MP3" } },
    "/autokoberce-do-kamionu-mercedes-actros-f/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP5/MP6 F (s tunelom) 2021-2026", nazov: "Mercedes-Benz Actros F s tunelom" } },
    "/autokoberce-do-kamionu-renault-t/": { kamion: { znacka: "Renault (TIR)", model: "T Range (rovná podlaha) 2013-2026", nazov: "Renault T s rovnou podlahou" } },
    "/autokoberce-do-kamionu-renault-t-s-tunelom/": { kamion: { znacka: "Renault (TIR)", model: "T Range (s tunelom) 2013-2026", nazov: "Renault T s tunelom" } },
    "/autokoberce-do-kamionu-scania-r-2004/": { kamion: { znacka: "Scania (TIR)", model: "R 2004-2008", nazov: "Scania R 2004–2008" } },
    "/autokoberce-do-kamionu-scania-r-2009/": { kamion: { znacka: "Scania (TIR)", model: "R 2009-2013", nazov: "Scania R 2009–2013" } },
    "/autokoberce-do-kamionu-scania-r-2014/": { kamion: { znacka: "Scania (TIR)", model: "R 2014-2016", nazov: "Scania R 2014–2016" } },
    "/autokoberce-do-kamionu-volvo-fh13/": { kamion: { znacka: "Volvo (TIR)", model: "FH (FH13) 2009-2013", nazov: "Volvo FH13" } },
    // vlna 4 a 5 (13. 11. 2026, a3/plan-35-modelov.csv): 6 kamiónov (večer + IVECO s obytnou kabínou) a 6 dodávok. Značka a model znak po znaku z tabuľky
    // (data.json settings.kamiony; kľúč značky = „<Značka> (<Typ>)“, kamion/tabulka.js). Produkty zatiaľ neexistujú — kým adresa
    // v Shoptete nie je, záznam sa nikdy nepoužije. Dodávky majú adresu /autokoberce-do-dodavky-…/ (bez „kamion“): košík
    // a objednávka ich spoznajú podľa functions/kamionPolozka.js (kód so slovom TRUCK, adresa, názov „Autokoberce do dodávky“).
    "/autokoberce-do-kamionu-daf-xf/": { kamion: { znacka: "DAF (TIR)", model: "XF 2021-2026", nazov: "DAF XF" } },
    "/autokoberce-do-kamionu-ford-f-max/": { kamion: { znacka: "Ford (TIR)", model: "F-MAX 2018-2026", nazov: "Ford F-MAX" } },
    "/autokoberce-do-kamionu-iveco-stralis-hi-way/": { kamion: { znacka: "IVECO (TIR)", model: "Stralis Hi-Way 2011-2019", nazov: "IVECO Stralis Hi-Way" } },
    "/autokoberce-do-kamionu-iveco-stralis-hi-way-obytna-kabina/": { kamion: { znacka: "IVECO (TIR)", model: "Stralis Hi-Way 2011-2019 – obytná kabína", nazov: "IVECO Stralis Hi-Way s obytnou kabínou" } },
    "/autokoberce-do-kamionu-volvo-fh5/": { kamion: { znacka: "Volvo (TIR)", model: "FH5 2022-2026", nazov: "Volvo FH5" } },
    "/autokoberce-do-kamionu-volvo-fh5-aero/": { kamion: { znacka: "Volvo (TIR)", model: "FH5 Aero 2025-2026", nazov: "Volvo FH5 Aero" } },
    "/autokoberce-do-dodavky-citroen-jumper-2006/": { kamion: { znacka: "Citroën (dodávka)", model: "Jumper 2006-2014", nazov: "Citroën Jumper 2006–2014" } },
    "/autokoberce-do-dodavky-citroen-jumper/": { kamion: { znacka: "Citroën (dodávka)", model: "Jumper 2014-2026", nazov: "Citroën Jumper" } },
    "/autokoberce-do-dodavky-peugeot-boxer-2006/": { kamion: { znacka: "Peugeot (dodávka)", model: "Boxer 2006-2014", nazov: "Peugeot Boxer 2006–2014" } },
    "/autokoberce-do-dodavky-peugeot-boxer/": { kamion: { znacka: "Peugeot (dodávka)", model: "Boxer 2014-2026", nazov: "Peugeot Boxer" } },
    "/autokoberce-do-dodavky-fiat-ducato/": { kamion: { znacka: "Fiat (dodávka)", model: "Ducato 2006-2026", nazov: "Fiat Ducato" } },
    "/autokoberce-do-dodavky-mercedes-sprinter/": { kamion: { znacka: "Mercedes-Benz (dodávka)", model: "Sprinter 2018-2026 (zadný pohon)", nazov: "Mercedes-Benz Sprinter" } },
  },
  581408: {
    "/luxusni-autokoberce-kamiony-1/": { skryty: true },
    // CZ: kľúče vozidiel sú slovenské (poznámka objednávky, Jánov export); na CZ sa model len zobrazí po česky (vozidloCs)
    "/autokoberce-do-kamionu-scania-r/": { kamion: { znacka: "Scania (TIR)", model: "R 2016-2026", aliasy: ["R 2017-2026"], nazov: "Scania R" } },
    "/autokoberce-do-kamionu-man-tgx/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2020-2026", aliasy: ["TGX 2021-2026"], nazov: "MAN TGX" } },
    "/autokoberce-do-kamionu-volvo-fh4/": { kamion: { znacka: "Volvo (TIR)", model: "FH4 2013-2021", nazov: "Volvo FH4" } },
    "/autokoberce-do-kamionu-mercedes-actros/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP4/MP5/MP6 (rovná podlaha) 2011-2026", nazov: "Mercedes-Benz Actros MP4/MP5/MP6" } },
    // vlna 2 a 3: tie isté adresy a kľúče ako SK, nazov = nazov_cz bez „Autokoberce do kamionu “ (CZ „s tunelem“)
    "/autokoberce-do-kamionu-daf-xf105/": { kamion: { znacka: "DAF (TIR)", model: "XF105 2006-2012", nazov: "DAF XF105" } },
    "/autokoberce-do-kamionu-daf-xf106/": { kamion: { znacka: "DAF (TIR)", model: "XF106 2017-2021", nazov: "DAF XF106" } },
    "/autokoberce-do-kamionu-daf-xg/": { kamion: { znacka: "DAF (TIR)", model: "XG / XG+ 2021-2026", aliasy: ["XG / XG+ 2022-2026"], nazov: "DAF XG a XG+" } },
    "/autokoberce-do-kamionu-man-tgx-2018/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2018-2020", nazov: "MAN TGX 2018–2020" } },
    "/autokoberce-do-kamionu-mercedes-actros-solostar/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP4/MP5/MP6 2021-2026 – obytná kabína (Solostar)", nazov: "Mercedes-Benz Actros Solostar" } },
    "/autokoberce-do-kamionu-scania-s/": { kamion: { znacka: "Scania (TIR)", model: "S 2016-2026", aliasy: ["S 2017-2026"], nazov: "Scania S" } },
    "/autokoberce-do-kamionu-daf-xf106-2013/": { kamion: { znacka: "DAF (TIR)", model: "XF106 2013-2016", nazov: "DAF XF106 2013–2016" } },
    "/autokoberce-do-kamionu-man-tgx-2007/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2007-2017", nazov: "MAN TGX 2007–2017" } },
    "/autokoberce-do-kamionu-mercedes-actros-2003/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP2/MP3 (rovná podlaha) 2003-2011", aliasy: ["Actros MP2/MP3 (rovná podlaha) 2003-2008"], nazov: "Mercedes-Benz Actros MP2/MP3" } },
    "/autokoberce-do-kamionu-mercedes-actros-f/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP5/MP6 F (s tunelom) 2021-2026", nazov: "Mercedes-Benz Actros F s tunelem" } },
    "/autokoberce-do-kamionu-renault-t/": { kamion: { znacka: "Renault (TIR)", model: "T Range (rovná podlaha) 2013-2026", nazov: "Renault T s rovnou podlahou" } },
    "/autokoberce-do-kamionu-renault-t-s-tunelom/": { kamion: { znacka: "Renault (TIR)", model: "T Range (s tunelom) 2013-2026", nazov: "Renault T s tunelem" } },
    "/autokoberce-do-kamionu-scania-r-2004/": { kamion: { znacka: "Scania (TIR)", model: "R 2004-2008", nazov: "Scania R 2004–2008" } },
    "/autokoberce-do-kamionu-scania-r-2009/": { kamion: { znacka: "Scania (TIR)", model: "R 2009-2013", nazov: "Scania R 2009–2013" } },
    "/autokoberce-do-kamionu-scania-r-2014/": { kamion: { znacka: "Scania (TIR)", model: "R 2014-2016", nazov: "Scania R 2014–2016" } },
    "/autokoberce-do-kamionu-volvo-fh13/": { kamion: { znacka: "Volvo (TIR)", model: "FH (FH13) 2009-2013", nazov: "Volvo FH13" } },
    // vlna 4 a 5 (13. 11. 2026, a3/plan-35-modelov.csv): 6 kamiónov (večer + IVECO s obytnou kabínou) a 6 dodávok. Značka a model znak po znaku z tabuľky
    // (data.json settings.kamiony; kľúč značky = „<Značka> (<Typ>)“, kamion/tabulka.js). Produkty zatiaľ neexistujú — kým adresa
    // v Shoptete nie je, záznam sa nikdy nepoužije. Dodávky majú adresu /autokoberce-do-dodavky-…/ (bez „kamion“): košík
    // a objednávka ich spoznajú podľa functions/kamionPolozka.js (kód so slovom TRUCK, adresa, názov „Autokoberce do dodávky“).
    // CZ: model je slovenský kľúč tabuľky („zadný pohon“); česky („zadní pohon“) ho ukáže vozidloCs z listu kamionycs.
    "/autokoberce-do-kamionu-daf-xf/": { kamion: { znacka: "DAF (TIR)", model: "XF 2021-2026", nazov: "DAF XF" } },
    "/autokoberce-do-kamionu-ford-f-max/": { kamion: { znacka: "Ford (TIR)", model: "F-MAX 2018-2026", nazov: "Ford F-MAX" } },
    "/autokoberce-do-kamionu-iveco-stralis-hi-way/": { kamion: { znacka: "IVECO (TIR)", model: "Stralis Hi-Way 2011-2019", nazov: "IVECO Stralis Hi-Way" } },
    "/autokoberce-do-kamionu-iveco-stralis-hi-way-obytna-kabina/": { kamion: { znacka: "IVECO (TIR)", model: "Stralis Hi-Way 2011-2019 – obytná kabína", nazov: "IVECO Stralis Hi-Way s obytnou kabinou" } },
    "/autokoberce-do-kamionu-volvo-fh5/": { kamion: { znacka: "Volvo (TIR)", model: "FH5 2022-2026", nazov: "Volvo FH5" } },
    "/autokoberce-do-kamionu-volvo-fh5-aero/": { kamion: { znacka: "Volvo (TIR)", model: "FH5 Aero 2025-2026", nazov: "Volvo FH5 Aero" } },
    "/autokoberce-do-dodavky-citroen-jumper-2006/": { kamion: { znacka: "Citroën (dodávka)", model: "Jumper 2006-2014", nazov: "Citroën Jumper 2006–2014" } },
    "/autokoberce-do-dodavky-citroen-jumper/": { kamion: { znacka: "Citroën (dodávka)", model: "Jumper 2014-2026", nazov: "Citroën Jumper" } },
    "/autokoberce-do-dodavky-peugeot-boxer-2006/": { kamion: { znacka: "Peugeot (dodávka)", model: "Boxer 2006-2014", nazov: "Peugeot Boxer 2006–2014" } },
    "/autokoberce-do-dodavky-peugeot-boxer/": { kamion: { znacka: "Peugeot (dodávka)", model: "Boxer 2014-2026", nazov: "Peugeot Boxer" } },
    "/autokoberce-do-dodavky-fiat-ducato/": { kamion: { znacka: "Fiat (dodávka)", model: "Ducato 2006-2026", nazov: "Fiat Ducato" } },
    "/autokoberce-do-dodavky-mercedes-sprinter/": { kamion: { znacka: "Mercedes-Benz (dodávka)", model: "Sprinter 2018-2026 (zadný pohon)", nazov: "Mercedes-Benz Sprinter" } },
  },
};

/**
 * Vlastná podkategória skrytej kópie (a2/POSTUP-ADMIN.md, variant B): jediná cesta, ako ju v Shoptete Basic vyradiť
 * z feedov Google Nákupy a vlastných XML feedov (zákaz exportu podľa VÝCHODZEJ kategórie). Adresa presne takto; odkazy na
 * ňu (menu, dlaždice podkategórií) skryje skryOdkazyKopie, stránka kategórie dostane noindex ako kópia.
 */
export const SKRYTE_KATEGORIE = {
  562035: ["/kamiony-1/"],
  581408: ["/kamiony-1/"],
};

/** Cesta na porovnanie: bez dopytu a kotvy, malými písmenami, s lomkou na konci. */
export function normCesta(cesta) {
  let c = String(cesta == null ? "" : cesta).split("#")[0].split("?")[0].trim().toLowerCase();
  if (!c) return "";
  if (c.charAt(0) !== "/") c = "/" + c;
  if (c.charAt(c.length - 1) !== "/") c += "/";
  return c;
}

/** Záznam stránky ({ skryty } alebo { kamion }) pre projekt a cestu, inak null. Vráti kópiu (záznam sa nedá zmeniť zvonka). */
export function kamionStranka(projectId, pathname) {
  const p = KAMION_STRANKY[String(projectId)];
  const z = p && p[normCesta(pathname)];
  if (!z) return null;
  return JSON.parse(JSON.stringify(z));
}

/** Projekt podľa domény (záloha, keď dataLayer ešte nie je): .cz = 581408, inak SK 562035. */
export function projektPodlaDomeny(hostname) {
  return /\.cz$/i.test(String(hostname || "")) ? 581408 : 562035;
}

/** Je cesta kópia kamiónov (skrytá alebo stránka kamióna) v ktoromkoľvek projekte? (truck-konfigurator/mount.js) */
export function jeKamionCesta(pathname) {
  const c = normCesta(pathname);
  return !!c && Object.keys(KAMION_STRANKY).some((p) => !!KAMION_STRANKY[p][c]);
}

/** Je cesta skrytá kópia (v ktoromkoľvek projekte)? Slúži na skrytie odkazov v zoznamoch produktov. */
export function jeSkrytaCesta(pathname) {
  const c = normCesta(pathname);
  return Object.keys(KAMION_STRANKY).some((p) => !!(KAMION_STRANKY[p][c] && KAMION_STRANKY[p][c].skryty));
}

/** Je cesta podkategória skrytej kópie v projekte? (noindex ako kópia) */
export function jeSkrytaKategoria(projectId, pathname) {
  const c = normCesta(pathname);
  return !!c && (SKRYTE_KATEGORIE[String(projectId)] || []).indexOf(c) > -1;
}

/** Všetky cesty skrytých kópií a ich podkategórií (SK aj CZ). */
export function skryteCesty() {
  const out = [];
  Object.keys(KAMION_STRANKY).forEach((p) => Object.keys(KAMION_STRANKY[p]).forEach((c) => { if (KAMION_STRANKY[p][c].skryty && out.indexOf(c) < 0) out.push(c); }));
  Object.keys(SKRYTE_KATEGORIE).forEach((p) => SKRYTE_KATEGORIE[p].forEach((c) => { if (out.indexOf(c) < 0) out.push(c); }));
  return out;
}

/**
 * <meta name="robots" content="noindex, nofollow"> v hlave dokumentu: existujúci robots meta (Shoptet dáva „index,follow“)
 * prepíše, inak pridá nový. Záloha k nastaveniam v admine (Google, kniha §2.1). Vráti meta prvok alebo null (bez dokumentu).
 */
export function nastavNoindex(doc) {
  try {
    const d = doc || (typeof document !== "undefined" ? document : null);
    if (!d || !d.head) return null;
    const vsetky = Array.prototype.slice.call(d.head.querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]'));
    let m = vsetky.filter((x) => String(x.getAttribute("name")).toLowerCase() === "robots")[0];
    vsetky.forEach((x) => { if (x !== m) x.setAttribute("content", "noindex, nofollow"); });
    if (!m) {
      m = d.createElement("meta");
      m.setAttribute("name", "robots");
      d.head.appendChild(m);
    }
    m.setAttribute("content", "noindex, nofollow");
    return m;
  } catch (e) {
    return null;
  }
}

/**
 * Zoznamy produktov (kategória, vyhľadávanie, našepkávač, „podobné produkty“): dlaždica, ktorá odkazuje na skrytú kópiu, sa skryje
 * štýlom (aj dlaždice, ktoré Shoptet dokreslí neskôr). Poistka k nastaveniam v admine. Vráti <style> alebo null.
 */
export function skryOdkazyKopie(doc) {
  try {
    const d = doc || (typeof document !== "undefined" ? document : null);
    if (!d || !d.head || d.getElementById("lcd-kamion-skryte")) return null;
    const sel = [];
    skryteCesty().forEach((c) => {
      const a = 'a[href*="' + c + '"]';
      // našepkávač vyhľadávania: kategória je <a class="search-whisperer-document"> priamo v div-e (nie v li), 13. 11. 2026
      sel.push(".product:has(" + a + ")", "li:has(> " + a + ")", "a.search-whisperer-document" + a.slice(1));
    });
    const st = d.createElement("style");
    st.id = "lcd-kamion-skryte";
    st.textContent = sel.join(",\n") + " { display: none !important; }";
    d.head.appendChild(st);
    return st;
  } catch (e) {
    return null;
  }
}
