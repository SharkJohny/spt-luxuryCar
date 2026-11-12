// Kópie konfigurátora kamiónov rozpoznané podľa ADRESY, nie podľa ID (kniha Brain napady/2026-11-11-kamiony-vsetky-ulohy.md
// §2.1): ID kópií vzniknú až v admine, kód sa tak dá vydať skôr, než produkty existujú. Súbor je bez importov (číta ho
// produkty.js, truck-konfigurator/mount.js a testy).
//
//   skryty: true            skrytý konfigurátor s logami značiek (A2) — vzhľad ako 640 / 2452, motívy sa berú zo selectov
//                           (v admine zapnuté logá), po štarte bundla <meta name="robots" content="noindex, nofollow">;
//                           jeden spoločný odkaz pre overených zákazníkov (Michal 11. 11. 2026).
//   kamion: { znacka, model, nazov }
//                           stránka kamióna pre Google (A3) s pevným modelom (ako stránky áut, auto-produkt.js):
//                           znacka = kľúč zo zoznamu vozidiel („Scania (TIR)“), model = presný názov z tabuľky (data.json,
//                           „R 2017-2026“), nazov = text nápisu „Predvyplnené pre …“. H1 = názov produktu z adminu.
//
// Pravidlo pre admin (detektory košíka a objednávky sa nemenia): názov kópie obsahuje „kamión“ / „kamion“, adresa obsahuje
// „kamion“, kód produktu obsahuje samostatné slovo TRUCK (TRUCK-LOGA, TRUCK-SCANIA-R …). Rovnaký slug SK aj CZ pri
// stránkach kamiónov (seo-hreflang.js ich páruje); skrytá kópia má na CZ vlastnú adresu a jazykový pár nemá.

/** projectId -> cesta -> záznam. SK = 562035, CZ = 581408. Cesta malými písmenami, s lomkou na začiatku aj na konci. */
export const KAMION_STRANKY = {
  562035: {
    "/luxusne-autokoberce-kamiony-loga/": { skryty: true },
    // prvá vlna stránok kamiónov (kniha §2.3): modely a roky presne z tabuľky konfigurátora (data.json 11. 11. 2026)
    "/autokoberce-do-kamionu-scania-r/": { kamion: { znacka: "Scania (TIR)", model: "R 2017-2026", nazov: "Scania R" } },
    "/autokoberce-do-kamionu-man-tgx/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2021-2026", nazov: "MAN TGX" } },
    "/autokoberce-do-kamionu-volvo-fh4/": { kamion: { znacka: "Volvo (TIR)", model: "FH4 2013-2021", nazov: "Volvo FH4" } },
    "/autokoberce-do-kamionu-mercedes-actros/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP4/MP5/MP6 (rovná podlaha) 2011-2026", nazov: "Mercedes-Benz Actros" } },
  },
  581408: {
    "/luxusni-autokoberce-kamiony-loga/": { skryty: true },
    // CZ: kľúče vozidiel sú slovenské (poznámka objednávky, Jánov export); na CZ sa model len zobrazí po česky (vozidloCs)
    "/autokoberce-do-kamionu-scania-r/": { kamion: { znacka: "Scania (TIR)", model: "R 2017-2026", nazov: "Scania R" } },
    "/autokoberce-do-kamionu-man-tgx/": { kamion: { znacka: "MAN (TIR)", model: "TGX 2021-2026", nazov: "MAN TGX" } },
    "/autokoberce-do-kamionu-volvo-fh4/": { kamion: { znacka: "Volvo (TIR)", model: "FH4 2013-2021", nazov: "Volvo FH4" } },
    "/autokoberce-do-kamionu-mercedes-actros/": { kamion: { znacka: "Mercedes-Benz (TIR)", model: "Actros MP4/MP5/MP6 (rovná podlaha) 2011-2026", nazov: "Mercedes-Benz Actros" } },
  },
};

/**
 * Vlastná podkategória skrytej kópie (a2/POSTUP-ADMIN.md, variant B): jediná cesta, ako ju v Shoptete Basic vyradiť
 * z feedov Google Nákupy a vlastných XML feedov (zákaz exportu podľa VÝCHODZEJ kategórie). Adresa presne takto; odkazy na
 * ňu (menu, dlaždice podkategórií) skryje skryOdkazyKopie, stránka kategórie dostane noindex ako kópia.
 */
export const SKRYTE_KATEGORIE = {
  562035: ["/kamiony-s-logami/"],
  581408: ["/kamiony-s-logy/"],
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
 * Zoznamy produktov (kategória, vyhľadávanie, „podobné produkty“): dlaždica, ktorá odkazuje na skrytú kópiu, sa skryje
 * štýlom (aj dlaždice, ktoré Shoptet dokreslí neskôr). Poistka k nastaveniam v admine. Vráti <style> alebo null.
 */
export function skryOdkazyKopie(doc) {
  try {
    const d = doc || (typeof document !== "undefined" ? document : null);
    if (!d || !d.head || d.getElementById("lcd-kamion-skryte")) return null;
    const sel = [];
    skryteCesty().forEach((c) => {
      const a = 'a[href*="' + c + '"]';
      sel.push(".product:has(" + a + ")", "li:has(> " + a + ")");
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
