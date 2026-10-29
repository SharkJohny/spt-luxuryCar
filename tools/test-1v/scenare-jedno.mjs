// Scenáre navyše pre jednovrstvové 598 Diamond / 610 Hexa / 613 Stripe (typ „jedno“). VLASTNÍK: worker jedno-vzory (T1.1).
// Spoločné scenáre (brana, nulova-zmena, platne, kufor-*, box-*, rady-3, k-suhrnu …) sú v tools/test-konfigurator-1v.mjs.
//
// Tvar (rovnaký vo všetkých scenare-<typ>.mjs):
//   export const SCENARE = { "<meno>": { typy: ["jedno"], fn: async (s, a, pom, ovl, j) => ({ info, post, spolu } | { preskoc }) } };
//   s    = otvorená karta (s.t pomocník, s.posty zachytené POST, s.produkt profil, s.upozornenia [])
//   a    = prepínače + a.url / a.produkt tohto behu
//   pom  = { novaStranka(build) }
//   ovl  = ovládače { kroky, rozlozenie, kuforBoxy, cena, farba2, boxy, vzorky, zdroj }
//   j    = jadro { otvor, zaklad, overPost, overCenu, cakajNaPost, nieHodnoty, novaOdporucana, over, pauza, AUTO, TYPY_TEST }
// Vrátené `spolu` sa porovná s profilom (tools/test-1v/produkty.mjs `ceny[<meno>]`), ak tam je.
//
// Čo tu je (len nový vzhľad, ?novy=1 / --vyvoj; bez flagu sa scenár preskočí):
//   vzor-jedno       vzor produktu v karte (body data-*, krok 1, názov radu, štítok typu, „N farieb na výber“, žiadny cudzí vzor)
//   farba-nahlad     výber farby mení len náhľad v kroku, hlavná fotka galérie ostáva (pravidlo „farba len náhľad“; naživo ju na
//                    598/610/613 nemení ani starý vzhľad, scenár stráži, aby ju nový nezačal meniť; náhľad musí byť pri každej farbe iný)
//   vzor-prechod     klik na sesterský vzor: správna adresa, nový vzhľad ostane zapnutý, správny vzor a farby a auto zostane
//                    (nájdená chyba: kroky.js bral auto obnovené z sessionStorage ako prázdne — prazdnePole)
//   kufor-nie-cena   Nechcem rohož do kufra = presne to, čo posiela živý web (POST [88]=598; 610 „nie“ +5 € opravené v admine 22. 10. 2026)
//   odporucana-jedno 598/610 ukážu Odporúčanú cenu (×1,6 nahor na desiatky), 613 (v admine chýba bežná cena) ju neukáže
//
// Predvolená sada (bez --krok): mená sú v `scenare` profilov 598/610/613 v produkty.mjs (integrácia WA 14. 10. 2026).
import { join } from "node:path";
import { PRODUKTY } from "./produkty.mjs";
import { otvorKartu } from "./ovladac-kroky.mjs";
import { F, hodnota } from "./stary-ui.mjs";

/** vzor -> názov v kroku 1 a v názve radu (živý H1 končí „… <VZOR> LINE“). */
const VZOR = { diamond: "Diamond Line", hexa: "Hexa Line", stripe: "Stripe Line" };
/** Počet farieb 1. vrstvy naživo (produkty-sk.md, GET 13. 10. 2026) — nepravdivé „N farieb na výber“ by klamalo zákazníka. */
const FARBY = { 598: 18, 610: 3, 613: 8 };
/** Príplatok voľby „nie“ (autokoberce do kufra) = čo sa pošle aj ukáže. 610 mal v admine +5 € (D2), Michal 22. 10. 2026 dal opraviť na 0 €. */
const KUFOR_NIE = { 598: 0, 610: 0, 613: 0 };
const TYP_STITOK = "Jednovrstvové";

const preskocBez = (a) => (a.novy ? null : { preskoc: "len nový vzhľad (?novy=1 / --vyvoj)" });
const sklon = (n) => n + (n === 1 ? " farba" : n >= 2 && n <= 4 ? " farby" : " farieb") + " na výber";

/**
 * t.cakaj, ktoré znesie zaseknutú požiadavku Chrome: pri výmene dokumentu (klik na sesterský vzor) môže Runtime.evaluate zostať bez
 * odpovede a základné t.cakaj by na ňom visel celých 120 s (limit CDP) — raz to zhodilo celý scenár (14. 10. 2026 pod záťažou stroja).
 * Každá požiadavka tu má vlastný krátky limit (krokMs), zaseknutá sa zahodí a podmienka sa skúša znova, až do `ms`.
 */
async function cakajTrpezlivo(t, expr, { ms = 30000, krokMs = 6000, popis } = {}) {
  const koniec = Date.now() + ms;
  let posledna;
  while (Date.now() < koniec) {
    let tm;
    try {
      const v = await Promise.race([t.ev(expr), new Promise((_, rej) => { tm = setTimeout(() => rej(new Error("Chrome neodpovedal do " + krokMs / 1000 + " s")), krokMs); })]);
      if (v) return v;
    } catch (e) { posledna = e; } finally { clearTimeout(tm); }
    await t.pauza(150);
  }
  throw new Error("Nedočkal som sa: " + popis + (posledna ? " (" + posledna.message + ")" : ""));
}

/**
 * ovl.kuforBoxy.vyberKufor + dlhšie čakanie na označenú kartu. Ovládač čaká na aria-pressed len 3 s (ovladac-kufor-boxy.mjs); pod
 * záťažou stroja (desiatky Chromov iných behov) sa karta označí neskôr. Ak ovládač zlyhá práve tam, voľba vo formulári už je
 * (predošlé čakania prešli) — nekliká sa znova, len sa čaká dlhšie; ak karta nikdy neostane označená, scenár zlyhá ako predtým.
 */
async function vyberKuforTrpezlivo(t, ovl, druh) {
  try {
    return await ovl.kuforBoxy.vyberKufor(t, druh);
  } catch (e) {
    if (!/karta kufra označená/.test(e.message)) throw e;
    await cakajTrpezlivo(t, `(function () { var k = document.querySelector('${F} .upsale-buttons.trunk .lcd1v-kb__karta[data-kufor="${druh}"]'); return !!k && k.getAttribute("aria-pressed") === "true"; })()`,
      { ms: 25000, popis: "karta kufra " + druh + " označená (ovládač čakal len 3 s)" });
    await t.pauza(400);
    return hodnota(t, "kufor");
  }
}

/**
 * ovl.kroky.vyberAuto + dlhšie čakanie na pás kompatibility. Ovládač (ovladac-kroky.mjs) čaká na pás len 8 s; pri 6 súbežných
 * Chromoch a cudzích behoch na stroji sa pás ukázal až po limite (snímka). Polia už sú nastavené (nastavSelect prešiel), preto sa
 * nevyberá znova, len sa čaká dlhšie — ak pás nepríde ani tak, scenár zlyhá ako predtým.
 */
async function vyberAutoTrpezlivo(t, ovl, a) {
  try {
    return await ovl.kroky.vyberAuto(t, a);
  } catch (e) {
    if (!/pás kompatibility s autom/.test(e.message)) throw e;
    await cakajTrpezlivo(t, `(function () { var k = document.querySelector(".lcd1v-kompat"); return !!(k && !k.hidden && k.offsetHeight > 0); })()`,
      { ms: 25000, popis: "pás kompatibility s autom (ovládač čakal len 8 s)" });
    return t.ev(`sessionStorage.getItem("model")`);
  }
}

/** Kópia ovládačov s trpezlivým výberom auta a kufra; j.zaklad(s, ovl) ich použije tiež, preto sa podáva do každého scenára. */
const trpezlivyOvl = (ovl) => ({
  ...ovl,
  kroky: { ...ovl.kroky, vyberAuto: (t, a) => vyberAutoTrpezlivo(t, ovl, a) },
  kuforBoxy: { ...ovl.kuforBoxy, vyberKufor: (t, druh) => vyberKuforTrpezlivo(t, ovl, druh) },
});

/** Snímka pre ľudskú kontrolu (len s --snimky): prvok `sel` zarovnaný nahor pod hlavičku webu. */
async function snimka(s, a, meno, sel) {
  if (!a.snimky) return;
  await s.t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`);
  await s.t.pauza(500);
  await s.k.snimka(join(a.snimky, `${s.produkt.id}-${meno}-${s.t.sirka}.png`)).catch(() => {});
}

const SCENARE = {
  /** Vzor produktu je v celej karte správny (nič z Diamondu na Hexa/Stripe) a čísla v krokoch sedia so živým formulárom. */
  "vzor-jedno": {
    typy: ["jedno"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t, vzor = P.vzor;
      await j.otvor(s, a.url, { novy: true });
      const cudziRe = Object.keys(VZOR).filter((d) => d !== vzor).join("|"); // vlastný vzor v texte byť môže, cudzí nie
      const st = await t.ev(`(function (cudziRe) {
        function tx(q) { var e = document.querySelector(q); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
        var f = document.getElementById("product-detail-form");
        var h1 = document.querySelector(".p-detail-inner-header h1");
        var cudzi = [];
        // viditeľný text nového vzhľadu mimo dlaždíc vzoru (tie z princípu ukazujú všetky tri vzory)
        [".lcd1v-krok", ".lcd1v-cena", ".lcd1v-suhrn", ".lcd1v-lista", ".lcd1v-kompat", ".lcd1v-typ", ".lcd1v-hodn"].forEach(function (q) {
          Array.prototype.forEach.call(document.querySelectorAll(q), function (e) {
            var kopia = e.cloneNode(true);
            Array.prototype.forEach.call(kopia.querySelectorAll(".patterns-wrap"), function (p) { p.remove(); });
            var t = (e.innerText != null && !e.querySelector(".patterns-wrap") ? e.innerText : kopia.textContent) || "";
            var m = new RegExp(cudziRe, "ig"), x;
            while ((x = m.exec(t))) cudzi.push(x[0].toLowerCase() + " v " + q);
          });
        });
        return {
          typ: document.body.getAttribute("data-lcd1v-typ"), vzor: document.body.getAttribute("data-lcd1v-vzor"),
          h1: h1 ? h1.textContent.replace(/\\s+/g, " ").trim() : null, stitok: tx(".lcd1v-typ"), cenaText: (document.querySelector(".lcd1v-cena") || {}).textContent || null, za: !!document.querySelector(".lcd1v-cena__za"),
          vzorVy: tx(".lcd1v-k-vzor .lcd1v-vy"), farbaVy: tx(".lcd1v-k-farba .lcd1v-vy"), postup: tx(".lcd1v-postup"),
          aktivne: Array.prototype.map.call(f.querySelectorAll(".lcd1v-k-vzor .patterns-wrap > .option-button.active"), function (a) { return a.className; }),
          dlazdice: Array.prototype.map.call(f.querySelectorAll(".lcd1v-k-vzor .patterns-wrap > .option-button"), function (a) {
            var m = /lcd1v-vzor-(\\w+)/.exec(a.className); return { druh: m ? m[1] : "", aktivna: a.classList.contains("active"), href: a.getAttribute("href") };
          }),
          farieb: f.querySelectorAll(".lcd1v-k-farba .options-wrap > .option-button").length,
          cudzi: cudzi,
        };
      })(${JSON.stringify(cudziRe)})`);
      j.over(st.typ === "jedno" && st.vzor === vzor, `body data-lcd1v-typ/-vzor = ${st.typ}/${st.vzor}, má byť jedno/${vzor}`);
      j.over(st.h1 && st.h1.toUpperCase().endsWith(VZOR[vzor].toUpperCase()), `živý H1 „${st.h1}“ nekončí na „${VZOR[vzor]}“ (H1 sa nemení; názov radu na webe sa zmenil?)`);
      j.over(st.stitok === TYP_STITOK, `štítok typu nad názvom „${st.stitok}“ ≠ „${TYP_STITOK}“`);
      // rámik ceny (návrh 3, Michal 15. 10. 2026): veta „Cena za set na mieru“ v ňom nemá byť vôbec
      j.over(st.cenaText && !/na\s+mier/i.test(st.cenaText) && !st.za, `v rámiku ceny je veta „… na mieru“: „${st.cenaText}“`);
      j.over(st.vzorVy === VZOR[vzor], `krok 1 (vzor) ukazuje „${st.vzorVy}“, má „${VZOR[vzor]}“`);
      j.over(/6 krokoch/.test(st.postup || ""), `postup „${st.postup}“ — jedno má 6 krokov`);
      j.over(st.dlazdice.length === 3 && ["diamond", "hexa", "stripe"].every((d) => st.dlazdice.some((x) => x.druh === d)), `dlaždice vzoru: ${JSON.stringify(st.dlazdice)}`);
      j.over(st.aktivne.length === 1 && /lcd1v-vzor-(\w+)/.exec(st.aktivne[0])[1] === vzor, `aktívna dlaždica vzoru: ${st.aktivne.join("|")}, má byť ${vzor}`);
      for (const d of st.dlazdice.filter((x) => !x.aktivna)) {
        const sester = Object.keys(PRODUKTY).find((id) => PRODUKTY[id].typ === "jedno" && PRODUKTY[id].vzor === d.druh);
        const cesta = new URL(PRODUKTY[sester].url).pathname;
        j.over(d.href === cesta, `dlaždica ${d.druh} vedie na „${d.href}“, má na ${cesta}`);
      }
      const ocak = FARBY[P.id];
      j.over(st.farieb === ocak, `počet farieb v kroku 3: ${st.farieb}, očakávané ${ocak} (produkty-sk.md; admin zmenil paletu? uprav FARBY v scenare-jedno.mjs)`);
      j.over(st.farbaVy === sklon(ocak), `krok 3 pred výberom píše „${st.farbaVy}“, má „${sklon(ocak)}“`);
      j.over(!st.cudzi.length, `v texte nového vzhľadu je cudzí vzor (produkt ${vzor}): ${[...new Set(st.cudzi)].join(", ")}`);
      if (a.snimky) {
        await snimka(s, a, "vzor-jedno-karta", ".p-detail-inner-header");
        await ovl.kroky.vyberAuto(t, j.AUTO); // bez auta by otvorenie kroku 3 ukázalo živé okno „vyberte model“
        await otvorKartu(t, "farba");
        await snimka(s, a, "vzor-jedno-farby", "#product-detail-form .lcd1v-k-farba");
      }
      return { info: `${vzor}: krok 1 „${st.vzorVy}“, štítok „${st.stitok}“, ${st.farbaVy}, dlaždice → sesterské adresy, žiadny cudzí vzor v texte` };
    },
  },

  /** Farba je len náhľad v kroku: hlavná fotka galérie sa pri výbere farby nemení; náhľad v kroku sa s farbou mení. */
  "farba-nahlad": {
    typy: ["jedno"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      await j.otvor(s, a.url, { novy: true });
      await ovl.kroky.vyberAuto(t, j.AUTO);
      const FOTO = `(function () { var i = document.querySelector(".p-image-wrapper .p-image img") || document.querySelector(".p-image-wrapper img"); return i ? (i.getAttribute("src") || "") + "|" + (i.getAttribute("data-src") || "") : ""; })()`;
      const NAHLAD = `(function () { var n = document.querySelector("#product-detail-form .lcd1v-k-farba > .lcd1v-nahlad"); var i = n && n.querySelector("img"); var d = n && n.querySelector(".lcd1v-nahlad__nazov, .lcd1v-nahlad__nm, b, strong"); return { vidno: !!(n && !n.hidden && n.offsetHeight > 100), src: i ? (i.currentSrc || i.getAttribute("src") || "") : "", text: n ? n.textContent.replace(/\\s+/g, " ").trim() : "" }; })()`;
      const pred = await t.ev(FOTO);
      j.over(pred, "nenašiel som hlavnú fotku galérie (.p-image-wrapper img) — selektor v scenári");
      const pocet = await t.ev(`document.querySelectorAll("#product-detail-form .lcd1v-k-farba .options-wrap > .option-button").length`);
      const indexy = [0, Math.floor((pocet - 1) / 2), pocet - 1].filter((x, i, p) => p.indexOf(x) === i);
      const nahlady = [];
      for (const index of indexy) {
        const v = await ovl.kroky.vyberFarbu(t, { index });
        await j.pauza(900); // Shoptet variantImage prepíše hlavnú fotku zo samotného ajaxu — pár stoviek ms
        const foto = await t.ev(FOTO);
        j.over(foto === pred, `po výbere farby ${index} (${v}) sa zmenila hlavná fotka galérie: „${pred.slice(-60)}“ → „${foto.slice(-60)}“`);
        const n = await t.ev(NAHLAD);
        j.over(n.vidno, `po výbere farby ${index} nie je viditeľný náhľad farby v kroku 3`);
        nahlady.push(n.src + "|" + n.text);
      }
      j.over(new Set(nahlady).size === nahlady.length, `náhľad farby sa pri iných farbách nemení: ${nahlady.map((x) => x.slice(-50)).join(" ; ")}`);
      await snimka(s, a, "farba-nahlad", "#product-detail-form .lcd1v-k-farba");
      return { info: `${P.vzor}: ${indexy.length} farby (${indexy.join(", ")} z ${pocet}) → hlavná fotka galérie bez zmeny, náhľad v kroku sa mení` };
    },
  },

  /** Klik na sesterský vzor: správna adresa, nový vzhľad ostane zapnutý (flag v karte), správny vzor a počet farieb. */
  "vzor-prechod": {
    typy: ["jedno"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      const ceste = [];
      for (const druh of Object.keys(VZOR).filter((d) => d !== P.vzor)) {
        const sester = Object.keys(PRODUKTY).find((id) => PRODUKTY[id].typ === "jedno" && PRODUKTY[id].vzor === druh);
        const cesta = new URL(PRODUKTY[sester].url).pathname;
        await j.otvor(s, a.url, { novy: true });
        // bez auta by živé okno „vyberte model“ (validation.js, klik kamkoľvek do .content-wrap) zakrylo dlaždice
        await ovl.kroky.vyberAuto(t, j.AUTO);
        await otvorKartu(t, "vzor");
        await t.klikni(`#product-detail-form .lcd1v-k-vzor .patterns-wrap > .option-button.lcd1v-vzor-${druh}`, { popis: "dlaždica vzoru " + druh, vRamci: "#product-detail-form .lcd1v-k-vzor" });
        await cakajTrpezlivo(t, `location.pathname === ${JSON.stringify(cesta)}`, { ms: 40000, popis: "prechod na " + cesta });
        t.zabudni();
        await cakajTrpezlivo(t, j.TYPY_TEST.jedno.pripravene, { ms: 40000, popis: "postavený konfigurátor " + sester });
        await cakajTrpezlivo(t, `document.body.classList.contains("lcd-1v") && !!document.querySelector(".lcd1v-k-vzor .lcd1v-vy") && !!document.querySelector(".lcd1v-k-farba .lcd1v-vy")`, { ms: 30000, popis: "nový vzhľad na " + sester + " po prechode" });
        await j.pauza(1200);
        const st = await t.ev(`({ vzor: document.body.getAttribute("data-lcd1v-vzor"), vy: (document.querySelector(".lcd1v-k-vzor .lcd1v-vy") || {}).textContent, farby: (document.querySelector(".lcd1v-k-farba .lcd1v-vy") || {}).textContent,
          chyby: window.__lcd1v ? window.__lcd1v.chyby.slice() : null, model: sessionStorage.getItem("model"), autoVy: ((document.querySelector(".lcd1v-k-auto .lcd1v-vy") || {}).textContent || "").trim(), aktivna: (function () { var a = document.querySelector(".lcd1v-k-vzor .patterns-wrap > .option-button.active"); var m = a && /lcd1v-vzor-(\\w+)/.exec(a.className); return m ? m[1] : ""; })() })`);
        j.over(st.vzor === druh && st.aktivna === druh, `po prechode na ${druh}: data-lcd1v-vzor „${st.vzor}“, aktívna dlaždica „${st.aktivna}“`);
        j.over(st.vy === VZOR[druh], `po prechode na ${druh} krok 1 píše „${st.vy}“, má „${VZOR[druh]}“`);
        j.over(st.farby === sklon(FARBY[sester]), `po prechode na ${druh} krok 3 píše „${st.farby}“, má „${sklon(FARBY[sester])}“`);
        j.over(!(st.chyby && st.chyby.length), `po prechode na ${druh} chyby 1V: ${st.chyby && st.chyby.join("; ")}`);
        j.over(st.model === "Audi A6 2015 Combi" && st.autoVy === "Audi A6, 2015, Combi", `po prechode na ${druh} sa stratilo auto: sessionStorage.model „${st.model}“, krok 2 „${st.autoVy}“`);
        ceste.push(`${druh} (${sester})`);
      }
      return { info: `${P.vzor} → ${ceste.join(", ")}: správna adresa, nový vzhľad zapnutý, správny vzor aj počet farieb, auto zachované` };
    },
  },

  /**
   * Nechcem rohož do kufra = presne to, čo posiela živý starý web (baseline 14. 10. 2026): [88] = hodnota „nie“, nie prázdne.
   * D2: 610 mal „nie“ s príplatkom +5 € (chyba v admine, opravené 22. 10. 2026) — teraz majú 598, 610 aj 613 „nie“ za 0 €;
   * nový vzhľad cenu nikdy neskrýva, POST aj cena v karte sedia.
   */
  /**
   * Okno boxov bez farby: veľkosti áno, farba nie, okno posunuté dole -> „Potvrďte výber boxov“ -> okno ostane otvorené
   * a posunie sa na farby s chybovou vetou (Michal 26. 10. 2026). 2 boxy; na PC, kde sa okno neposúva, len okno + chyba.
   */
  "okno-bez-farby": {
    typy: ["jedno", "dvoj"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      if (!ovl.kuforBoxy.oknoBezFarby) return { preskoc: "len nový vzhľad (ovládač novy)" };
      await j.otvor(s, a.url, { novy: true });
      await j.zaklad(s, ovl, { rozlozenie: 0 });
      // telefón: viditeľná výška iPhonu so stĺpcami Safari (~640 px), 2 boxy = najvyššie okno -> farby sú nad okrajom
      if (s.t.sirka < 768) await s.k.posli("Emulation.setDeviceMetricsOverride", { width: s.t.sirka, height: 640, deviceScaleFactor: 1, mobile: true });
      const r = await ovl.kuforBoxy.oknoBezFarby(s.t, { pocet: 2, velkost: "M" });
      j.over(r.pred && r.po, "okno boxov alebo farby v ňom chýbajú");
      j.over(r.otvorene, "okno boxov sa po „Potvrďte“ bez farby zavrelo");
      j.over(r.po.vidno, `farby nevidno po „Potvrďte“ bez farby: vrch ${r.po.hore} px voči oknu (pred ${r.pred.hore} px, posun ${r.po.posun}/${r.po.max})`);
      j.over(r.po.chyba, "chybová veta „Vyberte prosím farbu boxov.“ nie je vidno v okne");
      return { info: `okno ${r.pred.max > 0 ? "posúvateľné" : "bez posunu"}: farby pred ${r.pred.hore} px → po ${r.po.hore} px (posun ${r.pred.posun} → ${r.po.posun})` };
    },
  },

  /**
   * „Potvrďte výber boxov“ potvrdí JEDNÝM ťuknutím (Michal 29. 10. 2026, iPhone: „musí dvakrát kliknúť na to zelené
   * tlačidlo v tom pop-up okne“). Telefón: model zbalenej spodnej lišty Safari (ovládač jedenTuk — pás lišty pri spodku
   * ťuknutie zhltne). (1) 2 boxy, farba, M + M (ako na Michalovej snímke) -> 1 ťuknutie; (2) úprava: znova okno, 2. box
   * L a ťuknutie hneď po voľbe; (3) 1 box (farba sa prenesie) XL -> 1 ťuknutie. Po každom: okno zavreté, súhrn kroku
   * a karta sedia, žiadny červený rám; nakoniec do košíka (POST: farba boxov + samostatný box XL, bez 1./2. boxu).
   */
  "okno-jeden-tuk": {
    typy: ["jedno", "dvoj"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      if (!ovl.kuforBoxy.jedenTuk) return { preskoc: "len nový vzhľad (ovládač novy)" };
      const t = s.t, kb = ovl.kuforBoxy;
      await j.otvor(s, a.url, { novy: true });
      const z = await j.zaklad(s, ovl, { rozlozenie: 0 });
      const kroky = [];
      const over1 = (meno, r, vzor, pocet) => {
        const kde = `${meno} (${t.sirka} px${r.model ? ", lišta Safari zbalená" : ""}, stred tlačidla ${r.tlacidlo.odSpodku} px nad spodkom)`;
        j.over(r.zavrete, `${kde}: okno ostalo otvorené po 1. ťuknutí` + (r.zhltnute ? ` — ťuknutie vzala lišta Safari (${r.zhltnute}×)` : "") +
          (r.druhe ? ", zavrelo až 2. ťuknutie (chyba z iPhonu)" : ", nezavrelo ani 2. ťuknutie") + `; chyby v okne: ${r.stav.chyby.join(" | ") || "žiadne"}`);
        j.over(!r.zhltnute, `${kde}: ťuknutie do tlačidla vzala lišta Safari`);
        j.over(!r.stav.chyby.length, `${kde}: v okne je červený rám / chybová veta: ${r.stav.chyby.join(" | ")}`);
        j.over(r.stav.ariaHidden === "true" && !r.stav.viditelne, `${kde}: okno je po potvrdení stále vidno (aria-hidden ${r.stav.ariaHidden})`);
        j.over(r.stav.karta === pocet, `${kde}: označená karta boxov ${r.stav.karta}, čakám ${pocet}`);
        j.over(vzor.test(r.stav.vyber || ""), `${kde}: súhrn kroku boxov „${r.stav.vyber}“ nesedí s ${vzor}`);
        kroky.push(`${meno} ${r.tlacidlo.odSpodku} px`);
      };
      const r1 = await kb.jedenTuk(t, { pocet: 2, farba: 1, velkost: "M", velkost2: "M" });
      over1("2 boxy M + M", r1, /^2× box · M \+ M · .+ · \+ /, 2);
      const r2 = await kb.jedenTuk(t, { pocet: 2, farba: null, velkosti: [["box2", "L"]], hned: true });
      over1("úprava: 2. box L tesne pred ťuknutím", r2, /^2× box · M \+ L · /, 2);
      j.over(r2.hodnoty.farbaBoxov === r1.hodnoty.farbaBoxov && r2.hodnoty.box1 === r1.hodnoty.box1 && r2.hodnoty.box2 && r2.hodnoty.box2 !== r1.hodnoty.box2,
        "úprava 2. boxu: formulár " + JSON.stringify(r2.hodnoty) + " (pred " + JSON.stringify(r1.hodnoty) + ")");
      const r3 = await kb.jedenTuk(t, { pocet: 1, farba: null, velkosti: [["boxSolo", "XL"]] });
      over1("1 box XL (farba prenesená)", r3, /^1× box · XL · /, 1);
      j.over(r3.hodnoty.farbaBoxov === r1.hodnoty.farbaBoxov && r3.hodnoty.boxSolo, "1 box: formulár " + JSON.stringify(r3.hodnoty));
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ...z.ocak, farbaBoxov: r3.hodnoty.farbaBoxov, boxSolo: r3.hodnoty.boxSolo });
      return { info: `1 ťuknutie stačí: ${kroky.join(", ")}; POST farba boxov + box XL, spolu ${cena.spolu}`, post: post.body, spolu: cena.spolu };
    },
  },

  /**
   * Dvojité ťuknutie na „Potvrďte výber boxov“ výber nezmení (kontrola 29. 10. 2026 k okno-jeden-tuk: druhé ťuknutie
   * 0,3–0,7 s po potvrdení prepadlo cez zatvorené okno na stránku — telefón s tlačidlom nad lištou Safari: karta
   * „Nechcem“ pod ním zrušila oba boxy; 601 s 1 boxom XL: karta „2 boxy“ prepla na 2× S + S a otvorila okno). Pozadie
   * okna chytá ťuknutia ešte 0,8 s po zatvorení (_lcd1v-kufor-boxy.scss). Telefón: model zbalenej lišty Safari ako
   * okno-jeden-tuk. (1) 2 boxy M + M, druhé ťuknutie o 300 ms; (2) úprava bez zmeny, o 700 ms; (3) 1 box XL (farba
   * prenesená), o 300 ms. Po každom: okno sa zavrelo 1. ťuknutím a znova neotvorilo, formulár ako pred ťuknutím, karta
   * a súhrn kroku sedia. Bez košíka: POST 0.
   */
  "okno-dvojtuk": {
    typy: ["jedno", "dvoj"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      if (!ovl.kuforBoxy.dvojTuk) return { preskoc: "len nový vzhľad (ovládač novy)" };
      const t = s.t, kb = ovl.kuforBoxy;
      await j.otvor(s, a.url, { novy: true });
      await j.zaklad(s, ovl, { rozlozenie: 0 });
      const kroky = [];
      const over2 = (meno, r, vzor, pocet) => {
        const kde = `${meno} (${t.sirka} px${r.model ? ", lišta Safari zbalená" : ""}, 2. ťuknutie o ${r.ms} ms na ${r.ciel})`;
        j.over(r.zavrete, `${kde}: okno sa 1. ťuknutím nezavrelo (prvé ťuknutie na ${r.prvy}, zatvorené o ${r.zatvoreneMs} ms)`);
        j.over(r.ms < 780, `${kde}: odstup ťuknutí ${r.ms} ms — pomalý beh (pozadie chytá 800 ms), scenár neoveril`);
        j.over(!r.otvorene, `${kde}: druhé ťuknutie okno znova otvorilo`);
        j.over(JSON.stringify(r.hodnoty) === JSON.stringify(r.pred), `${kde}: druhé ťuknutie zmenilo výber ${JSON.stringify(r.pred)} -> ${JSON.stringify(r.hodnoty)}`);
        j.over(r.stav.karta === pocet, `${kde}: označená karta boxov ${r.stav.karta}, čakám ${pocet}`);
        j.over(vzor.test(r.stav.vyber || ""), `${kde}: súhrn kroku boxov „${r.stav.vyber}“ nesedí s ${vzor}`);
        kroky.push(`${meno} ${r.ms} ms → ${r.ciel}`);
      };
      const r1 = await kb.dvojTuk(t, { pocet: 2, farba: 1, velkost: "M", velkost2: "M", rozostup: 300 });
      over2("2 boxy M + M", r1, /^2× box · M \+ M · /, 2);
      const r2 = await kb.dvojTuk(t, { pocet: 2, farba: null, velkosti: [], rozostup: 700 });
      over2("úprava bez zmeny", r2, /^2× box · M \+ M · /, 2);
      const r3 = await kb.dvojTuk(t, { pocet: 1, farba: null, velkosti: [["boxSolo", "XL"]], rozostup: 300 });
      over2("1 box XL", r3, /^1× box · XL · /, 1);
      j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
      return { info: `výber ostal: ${kroky.join("; ")}` };
    },
  },

  "kufor-nie-cena": {
    typy: ["jedno"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      await j.otvor(s, a.url, { novy: true });
      const z = await j.zaklad(s, ovl, { rozlozenie: 0 }); // 1. rad: +0 €
      await ovl.kuforBoxy.vyberKufor(t, "classic"); // ovl je trpezlivý (trpezlivyOvl)
      const nie = await ovl.kuforBoxy.vyberKufor(t, "nie");
      const ocakNie = await t.moznost("kufor", /^nie\b/i);
      j.over(nie === ocakNie, `Nechcem: kufor vo formulári „${nie}“, živý web posiela voľbu „nie“ = „${ocakNie}“ (nie prázdne)`);
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, z.ocak);
      const idK = await t.idParametra("kufor");
      j.over(post.pole["surchargeParameterValueId[" + idK + "]"] === ocakNie, `POST [${idK}] = „${post.pole["surchargeParameterValueId[" + idK + "]"]}“, má „${ocakNie}“`);
      const priplatok = await t.ev(`(function () { var o = document.querySelector('#product-detail-form select[data-parameter-id="${idK}"] option[value="${ocakNie}"]'); return o ? Number(o.getAttribute("data-surcharge-final-price")) || 0 : -1; })()`);
      j.over(priplatok === KUFOR_NIE[P.id], `príplatok voľby „nie“ naživo ${priplatok} €, očakávaný ${KUFOR_NIE[P.id]} € (admin opravený? uprav KUFOR_NIE v scenare-jedno.mjs a zoznam chýb)`);
      const c = await j.overCenu(s, ovl, cena); // zobrazená cena = karta = Spolu = lišta = Shoptet
      const spolu = cena.zaklad + 0 + KUFOR_NIE[P.id] + 15; // základ + 1. rad 0 + „nie“ + TYP Combi 15
      j.over(cena.spolu === spolu && c.videne === spolu, `cena ${c.videne} / Shoptet ${cena.spolu}, očakávaná ${spolu} = ${cena.zaklad} + 0 + ${KUFOR_NIE[P.id]} + 15`);
      return { info: `Nechcem kufor: [${idK}]=${ocakNie} (voľba „nie“ ${KUFOR_NIE[P.id] ? "+" + KUFOR_NIE[P.id] + " € — chyba v admine, D2" : "+0 €"}), cena ${c.videne}`, post: post.body, spolu: cena.spolu };
    },
  },

  /** Odporúčaná cena: 598/610 ju ukážu (×1,6 nahor na desiatky, štítok bez právnych viet), 613 (chýba bežná cena) nie — ani pred výberom, ani po ňom. */
  "odporucana-jedno": {
    typy: ["jedno"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const P = a.produkt, t = s.t;
      await j.otvor(s, a.url, { novy: true });
      const zaklad = Number((await t.ev(`(function () { var e = document.querySelector(".lcd1v-cena .lcd1v-cena__suma"); return e ? e.textContent : ""; })()`)).replace(/[^\d]/g, ""));
      j.over(zaklad > 0, "cena nad krokmi (.lcd1v-cena__suma) pred výberom je prázdna");
      const kontrola = async (kedy, spolu) => {
        const odp = await ovl.cena.odporucana(t);
        const nova = await j.novaOdporucana(s);
        const text = await t.ev(`(function () { var k = document.querySelector(".lcd1v-cena"); var l = document.querySelector(".lcd1v-lista"); return ((k ? k.innerText : "") + " " + (l ? l.innerText : "")).replace(/\\s+/g, " "); })()`);
        if (P.odporucana === false) {
          j.over(!(odp && odp.cena) && !nova.najdene.length, `${kedy}: nový vzhľad ukazuje Odporúčanú cenu${odp && odp.cena ? " " + odp.cena : ""} (${nova.najdene.join("; ")}), v admine chýba bežná cena`);
          j.over(!/u[šs]etr[ií]te\s*€?\s*\d/i.test(text), `${kedy}: ukazuje sa „Ušetríte“ s čiastkou bez odporúčanej ceny: ${text.slice(0, 160)}`);
          return "bez odporúčanej";
        }
        const ocak = Math.ceil((spolu * 1.6) / 10) * 10;
        j.over(odp && odp.cena === ocak, `${kedy}: odporúčaná ${odp && odp.cena}, očakávaná ${ocak} (${spolu} × 1,6 nahor na desiatky)`);
        j.over(odp.zlava === Math.round(((ocak - spolu) / ocak) * 100), `${kedy}: zľava ${odp.zlava} %`);
        j.over(/^Odporúčaná cena$/.test(odp.stitok), `${kedy}: štítok „${odp.stitok}“ ≠ „Odporúčaná cena“`);
        j.over(!/v[ýy]robc|doporu[čc]en|zákon|pr[áa]vn/i.test(text), `${kedy}: v karte je vysvetlenie / „výrobcu“ / „Doporučená“: ${text.slice(0, 200)}`);
        // tvar návrhov „Ušetríte 171 €“ (číslo, NBSP, €), nie Shoptetu „€171“ (integrácia 14. 10. 2026)
        j.over(new RegExp("U[šs]etr[ií]te\\s+" + (ocak - spolu) + "[\\s\\u00a0]€", "i").test(text), `${kedy}: „Ušetríte ${ocak - spolu} €“ v karte nie je: ${text.slice(0, 200)}`);
        return odp.cena + " € −" + odp.zlava + " %";
      };
      const pred = await kontrola("pred výberom", zaklad);
      const z = await j.zaklad(s, ovl);
      const po = await kontrola("po výbere", Number((await t.ev(`(document.querySelector(".lcd1v-cena .lcd1v-cena__suma") || {}).textContent`)).replace(/[^\d]/g, "")));
      await snimka(s, a, "odporucana", ".p-detail-inner-header");
      return { info: `${P.odporucana === false ? "bez odporúčanej ceny (v admine chýba bežná cena)" : "odporúčaná cena ×1,6 nahor na desiatky, štítok „Odporúčaná cena“, bez právnych viet"}: pred výberom ${pred}, po výbere ${po}` };
    },
  },
};

// každý scenár dostane trpezlivé ovládače (pozri trpezlivyOvl)
for (const sc of Object.values(SCENARE)) {
  const fn = sc.fn;
  sc.fn = (s, a, pom, ovl, j) => fn(s, a, pom, trpezlivyOvl(ovl), j);
}

export { SCENARE };
