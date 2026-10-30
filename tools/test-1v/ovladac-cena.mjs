// Ovládač cenovej karty, lepivej lišty a tlačidla košíka. VLASTNÍK: worker „cena“
// (assets/js/components/konfigurator1v/cena.js + assets/css/_lcd1v-cena.scss). Kontrakt: docs/1v-kontrakt.md.
// `stary` = živá stránka (referencia, nemeniť). `novy` = nový vzhľad; kým je null, --novy použije `stary`.
import { pauza } from "./cdp.mjs";
import { F, cislo } from "./stary-ui.mjs";

export const stary = {
  meno: "stary",

  /** Cena, ktorú zákazník vidí ako „Aktuálna cena“ (číslo). */
  async zobrazenaCena(t) {
    return cislo(await t.ev(`(document.querySelector("${F} .p-final-price-wrapper .price-final-holder") || {}).textContent`));
  },

  /** Odporúčaná (prečiarknutá) cena -> { cena, zlava (percentá), stitok (text nad cenou) }. */
  async odporucana(t) {
    const r = await t.ev(`(function () {
      var w = document.querySelector("${F} .p-final-price-wrapper .price-standard");
      if (!w) return null;
      var c = Array.prototype.find.call(w.querySelectorAll(":scope > span"), function (s) { return !s.classList.contains("price-save"); });
      return { cena: c ? c.textContent : "", zlava: (w.querySelector(".price-save") || {}).textContent || "", stitok: ((w.querySelector(".recommended-price") || {}).textContent || "").trim() };
    })()`);
    if (!r) return null;
    return { cena: cislo(r.cena), zlava: cislo(r.zlava), stitok: r.stitok };
  },

  /** Klik na „Pridať do košíka“ (tlačidlo, ktoré zákazník vidí). */
  async pridajDoKosika(t) {
    await t.klikni(`${F} .add-to-cart button.add-to-cart-button`, { popis: "Pridať do košíka" });
  },
};

/**
 * Nový vzhľad (?novy=1, assets/js/components/konfigurator1v/cena.js): cena nad krokmi (.lcd1v-cena) + „Spolu“
 * (.lcd1v-suhrn) + živé tlačidlo košíka preštýlované + lepivá lišta na telefóne (.lcd1v-lista).
 * Všetky tri zobrazené ceny sú zrkadlo živej ceny Shoptetu — zobrazenaCena() vráti číslo len keď sa zhodujú.
 */
export const novy = {
  meno: "novy",

  /** „Naša cena“ nad krokmi; zároveň musí sedieť „Spolu“ aj cena v lište (inak vráti text s rozdielom -> test zlyhá). */
  async zobrazenaCena(t) {
    const r = await t.ev(`(function () {
      function tx(s) { var e = document.querySelector(s); return e ? e.textContent : null; }
      var k = document.querySelector("${F} .lcd1v-cena .lcd1v-cena__suma");
      return { karta: tx("${F} .lcd1v-cena .lcd1v-cena__suma"), spolu: tx("${F} .lcd1v-suhrn .lcd1v-suhrn__suma"), lista: tx(".lcd1v-lista .lcd1v-lista__suma"),
        vidno: !!(k && k.getBoundingClientRect().height > 0) };
    })()`);
    const n = cislo(r.karta);
    if (!r.vidno) return "cena nad krokmi nie je viditeľná";
    // tvar návrhov „230 €“ (číslo, medzera/NBSP, €) v karte, „Spolu“ aj lište — nikdy Shoptetové „€230“ (integrácia 14. 10. 2026)
    const tvar = (x) => /^\d{1,3}(?:[\s ]\d{3})*(?:,\d{2})?[\s ]€$/.test(String(x || "").trim());
    if (![r.karta, r.spolu, r.lista].every(tvar)) return `tvar ceny nie je „230 €“: karta „${r.karta}“ / Spolu „${r.spolu}“ / lišta „${r.lista}“`;
    if (cislo(r.spolu) !== n || cislo(r.lista) !== n) return `karta ${r.karta} / Spolu ${r.spolu} / lišta ${r.lista}`;
    return n;
  },

  /**
   * Odporúčaná (prečiarknutá) cena v rámiku nad krokmi -> { cena, zlava, stitok }. Rámik (návrh 3, Michal 15. 10. 2026):
   * ľavá polovica .lcd1v-cena__bolo = štítok + prečiarknutá suma, „−X %“ je v pruhu dole (.lcd1v-cena__pozn).
   */
  async odporucana(t) {
    const r = await t.ev(`(function () {
      var k = document.querySelector("${F} .lcd1v-cena");
      var w = k && k.querySelector(".lcd1v-cena__bolo");
      if (!w || w.hidden) return null;
      var z = k.querySelector(".lcd1v-cena__pozn .lcd1v-cena__zlava");
      return { cena: (w.querySelector(".lcd1v-cena__odp") || {}).textContent || "", zlava: z && !z.hidden ? z.textContent : "",
        stitok: ((w.querySelector(".lcd1v-cena__stitok") || {}).textContent || "").trim() };
    })()`);
    if (!r) return null;
    return { cena: cislo(r.cena), zlava: cislo(r.zlava), stitok: r.stitok };
  },

  /**
   * PC: klik na tlačidlo pod „Spolu“ (živé tlačidlo košíka v novom vzhľade).
   * Telefón: kým je konfigurátor na obrazovke, lišta je zasunutá; pod konfigurátorom sa vysunie a klikne sa na ňu.
   * Kontroluje aj text tlačidla (Dokončite výber / Vložte do košíka podľa ctx.prvyNevyplneny()) a že bublina chatu
   * Luxia lištu neprekrýva (ani lišta bublinu).
   */
  async pridajDoKosika(t) {
    const kos = `${F} .add-to-cart button.add-to-cart-button`;
    const TEXT = `(function () {
      var c = window.__lcd1v, b = document.querySelector("${kos}");
      var cz = /\\.cz$/.test(location.hostname); // CZ web (cena.js TEXTY.cs): okno boxov 2403 / 2406 ide až do košíka
      return { text: b ? b.textContent.trim() : null, ocak: c && c.prvyNevyplneny() === null ? (cz ? "Vložit do košíku" : "Vložte do košíka") : (cz ? "Dokončete výběr" : "Dokončite výber") };
    })()`;
    let text = await t.ev(TEXT);
    for (let i = 0; i < 40 && text.text !== text.ocak; i++) { await pauza(100); text = await t.ev(TEXT); } // obnova beží v ďalšom snímku
    if (text.text !== text.ocak) throw new Error(`tlačidlo košíka píše „${text.text}“, má „${text.ocak}“`);
    if (!t.mobil) {
      await t.klikni(kos, { popis: text.ocak });
      return;
    }
    // telefón: pri tlačidle v konfigurátore lišta zasunutá
    await t.ev(`document.querySelector("${kos}").scrollIntoView({ block: "center", behavior: "instant" })`);
    await pauza(500);
    if (await t.ev(`document.querySelector(".lcd1v-lista").classList.contains("on")`)) throw new Error("lišta je vysunutá, hoci je konfigurátor na obrazovke");
    // pod konfigurátorom sa vysunie
    await t.ev(`(function () { var b = document.querySelector("${F} .add-to-cart").getBoundingClientRect(); window.scrollTo(0, b.bottom + window.pageYOffset + 400); })()`);
    await t.cakaj(`document.querySelector(".lcd1v-lista").classList.contains("on")`, { ms: 10000, popis: "vysunutá lepivá lišta" });
    await pauza(450); // vysúvanie (transform .35 s)
    const st = await t.ev(`(function () {
      var b = document.querySelector(".lcd1v-lista .lcd1v-lista__kos").getBoundingClientRect();
      var f = document.querySelector('iframe[title="Luxia chat"]'), r = f && f.getBoundingClientRect();
      var prienik = !!(r && r.height > 0 && r.height <= 130 && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
      return { text: document.querySelector(".lcd1v-lista .lcd1v-lista__kos").textContent.trim(), prienik: prienik, spodok: Math.round(b.bottom), vyska: innerHeight };
    })()`);
    if (st.prienik) throw new Error("bublina chatu Luxia prekrýva tlačidlo lišty");
    if (st.spodok > st.vyska) throw new Error("tlačidlo lišty presahuje spodok okna (" + st.spodok + " > " + st.vyska + ")");
    if (st.text !== text.ocak) throw new Error(`lišta píše „${st.text}“, má „${text.ocak}“`);
    await t.klikni(".lcd1v-lista .lcd1v-lista__kos", { popis: "lepivá lišta: " + text.ocak });
  },
};
