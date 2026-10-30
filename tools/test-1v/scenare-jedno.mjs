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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUKTY } from "./produkty.mjs";
import { otvorKartu } from "./ovladac-kroky.mjs";
import { F, hodnota } from "./stary-ui.mjs";
import { SAFARI_ROZLOZENIA, TELEFONY, IPHONE_VRCH, ANDROID_VRCH } from "./ovladac-kufor-boxy.mjs";

/**
 * Referencia polohy okna boxov z 909cc67 (živá verzia pred variantom B, 30. 10. 2026) pre okno-poloha-ios: vypočítané
 * štýly okna a päty + poloha okna a tlačidla tam, kde sa nič meniť nesmie (bez triedy iOS, PC 1280/1366/1920, iPad nad
 * 720 px, iPhone pri rozbalenej lište). Uloženie: LCD_OKNO_REF_ULOZ=1 node tools/test-konfigurator-1v.mjs --zdroj 909cc67
 * --krok okno-poloha-ios … (beh na CDN verzii 909cc67; každá úloha dopíše svoje kľúče). Iný súbor: LCD_OKNO_REF=<cesta>.
 */
const REF_OKNA = process.env.LCD_OKNO_REF || join(dirname(fileURLToPath(import.meta.url)), "okno-poloha-909cc67.json");
const REF_ULOZ = process.env.LCD_OKNO_REF_ULOZ === "1";
/**
 * Čo variant 2 (okno „všetko na jednu obrazovku“, Michal 30. 10. 2026) na telefóne mení zámerne oproti 909cc67: hustejšie
 * okno (okraje 14 / 16 px, päta s rovnakými bočnými okrajmi), vyššia max. výška (iPhone 100svh − 2px, ostatné 100dvh − 2px)
 * a preto aj vrch okna. Spodok okna, tlačidlo a päta zdola ostávajú = 909cc67 / variant B. Nové rozloženie stráži
 * okno-vsetko-mobil.
 */
const VARIANT2_TELEFON = ["okno.top", "okno.paddingTop", "okno.paddingRight", "okno.paddingLeft", "okno.maxHeight", "pata.marginRight", "pata.marginLeft",
  "pata.paddingRight", "pata.paddingLeft", "rect.oknoVrch"];
/** Zapíše (REF_ULOZ) alebo porovná polohu s referenciou -> "" alebo popis rozdielu. Synchrónne = bez pretekov v behu. */
function refOkna(kluc, p, ignoruj = []) {
  const zapis = { ih: p.ih, styly: p.styly, rect: { oknoVrch: p.oknoVrch, oknoSpodok: p.oknoSpodok, tlacVrch: p.tlacVrch, tlacSpodok: p.tlacSpodok } };
  const vsetko = existsSync(REF_OKNA) ? JSON.parse(readFileSync(REF_OKNA, "utf8")) : {};
  if (REF_ULOZ) {
    vsetko[kluc] = zapis;
    writeFileSync(REF_OKNA, JSON.stringify(Object.fromEntries(Object.keys(vsetko).sort().map((k) => [k, vsetko[k]])), null, 1) + "\n");
    return "";
  }
  const r = vsetko[kluc];
  if (!r) return `${kluc}: referencia z 909cc67 chýba (${REF_OKNA}; ulož LCD_OKNO_REF_ULOZ=1 … --zdroj 909cc67)`;
  const rozdiely = [];
  const px = (x) => (/^-?[\d.]+px$/.test(String(x)) ? parseFloat(x) : null);
  for (const cast of ["okno", "pata"]) for (const [k, v] of Object.entries(r.styly[cast])) {
    if (ignoruj.includes(cast + "." + k)) continue;
    const n = zapis.styly[cast][k], a = px(v), b = px(n);
    if (a != null && b != null ? Math.abs(a - b) > 0.5 : v !== n) rozdiely.push(`${cast}.${k} ${v} -> ${n}`);
  }
  if (r.ih === zapis.ih) for (const [k, v] of Object.entries(r.rect)) if (!ignoruj.includes("rect." + k) && Math.abs(v - zapis.rect[k]) > 1) rozdiely.push(`${k} ${v} -> ${zapis.rect[k]}`);
  return rozdiely.length ? `${kluc}: iné ako 909cc67: ${rozdiely.join(", ")}` : "";
}

/**
 * Referencia okna boxov na PC / tablete z 38d0bf8 (pred variantom 2) pre okno-vsetko-mobil: vypočítané štýly a polohy
 * okna a jeho častí (STYL_OKNA v ovladac-kufor-boxy.mjs). Uloženie: LCD_OKNO_VSETKO_REF_ULOZ=1 node
 * tools/test-konfigurator-1v.mjs --zdroj 38d0bf8 --krok okno-vsetko-mobil --sirka 768,1280,1366,1920 … Iný súbor: LCD_OKNO_VSETKO_REF.
 */
const REF_VSETKO = process.env.LCD_OKNO_VSETKO_REF || join(dirname(fileURLToPath(import.meta.url)), "okno-vsetko-38d0bf8.json");
const REF_VSETKO_ULOZ = process.env.LCD_OKNO_VSETKO_REF_ULOZ === "1";
function refVsetko(kluc, styl) {
  const vsetko = existsSync(REF_VSETKO) ? JSON.parse(readFileSync(REF_VSETKO, "utf8")) : {};
  if (REF_VSETKO_ULOZ) {
    vsetko[kluc] = styl;
    writeFileSync(REF_VSETKO, JSON.stringify(Object.fromEntries(Object.keys(vsetko).sort().map((k) => [k, vsetko[k]])), null, 1) + "\n");
    return "";
  }
  const r = vsetko[kluc];
  if (!r) return `referencia z 38d0bf8 chýba pre ${kluc} (${REF_VSETKO}; ulož LCD_OKNO_VSETKO_REF_ULOZ=1 … --zdroj 38d0bf8)`;
  if (!styl) return "štýly okna sa nedali prečítať";
  const rozdiely = [];
  const px = (x) => (/^-?[\d.]+px$/.test(String(x)) ? parseFloat(x) : null);
  for (const [cast, s] of Object.entries(r)) {
    const n = styl[cast];
    if (!s || !n) { if (!s !== !n) rozdiely.push(`${cast} ${s ? "chýba" : "navyše"}`); continue; }
    for (const [k, v] of Object.entries(s)) {
      const x = n[k];
      if (Array.isArray(v)) { if (!Array.isArray(x) || v.some((y, i) => Math.abs(y - x[i]) > 1)) rozdiely.push(`${cast}.${k} ${JSON.stringify(v)} -> ${JSON.stringify(x)}`); continue; }
      if (typeof v === "number") { if (typeof x !== "number" || Math.abs(v - x) > 1) rozdiely.push(`${cast}.${k} ${v} -> ${x}`); continue; }
      const a = px(v), b = px(x);
      if (a != null && b != null ? Math.abs(a - b) > 0.5 : v !== x) rozdiely.push(`${cast}.${k} ${v} -> ${x}`);
    }
  }
  return rozdiely.length ? `iné ako 38d0bf8 (${rozdiely.length}): ${rozdiely.slice(0, 15).join(", ")}${rozdiely.length > 15 ? " …" : ""}` : "";
}
/** Android telefón (okno-vsetko-mobil): kufor-boxy.js dá triedu lcd1v-bx--ios len iPhonu / iPadu. */
const UA_ANDROID = "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
/** Najmenšie písmo v okne boxov (Michal 18. 10. 2026): text 16, rozmery a ceny 15, štítky 12, tlačidlo 14 (ako doteraz). */
const PISMO_OKNA = { nadpis: 16, pod: 16, "farba-l": 16, "farba-nm": 16, vl: 16, rozmer: 15, pripl: 15, nadp: 12, topv: 12, ok: 14 };

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
   * Poloha okna boxov na iPhone (variant B, Michal 30. 10. 2026 podľa náhľadu): pri ZBALENEJ spodnej lište Safari okno
   * končí nad lištou (pod ním stmavená stránka) a pod „Potvrďte výber boxov“ je len 20 px bielej; pri rozbalenej lište
   * presne ako 909cc67. Snímky z iPhonu: 29. 10. (rozbalená, päta 20 px) a 30. 10. 2026 (zbalená: pod tlačidlom 162 px
   * bielej = 20 + env 34 + 108). Telefón (390 / 440), 2 boxy M + M aj 1 box XL, každé rozloženie lišty
   * (SAFARI_ROZLOZENIA: hore, kompaktne, dole, stary80) a rozbalená lišta:
   *   - tlačidlo mimo pásu lišty: výrez − spodok tlačidla ≥ pás + 16,
   *   - biela pod tlačidlom (spodok okna − spodok tlačidla) ≤ 22 px,
   *   - okno nesiaha do pásu lišty: výrez − spodok okna ≥ pás − 1,
   *   - rozbalená lišta = dnešný stav: spodok okna = výrez ±1, päta 20 px, štýly = 909cc67,
   *   - ťuknutie pod spodok okna (medzera nad pásom; bez pásu 10 px nad spodkom) okno nezavrie a výber nezmení,
   *   - JEDNO ťuknutie do stredu tlačidla okno zavrie, súhrn kroku a karta sedia; nakoniec košík (POST: box XL),
   *   - bez triedy lcd1v-bx--ios (Android) v každom modeli štýly a poloha = 909cc67,
   *   - na telefóne okrem toho, čo variant 2 mení zámerne (VARIANT2_TELEFON: okraje, max. výška, vrch okna — stráži
   *     okno-vsetko-mobil; spodok okna, tlačidlo a päta zdola ostávajú = 909cc67).
   * PC (1280 / 1366 / 1920): štýly a poloha okna = 909cc67, aj s triedou iOS a výrezom zbalenej lišty (iPad nad 720 px).
   * Referencia: okno-poloha-909cc67.json (refOkna). Hlási všetky nálezy naraz (čísla pre opravu), nie len prvý.
   */
  "okno-poloha-ios": {
    typy: ["jedno", "dvoj"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const kb = ovl.kuforBoxy;
      if (!kb.polohaIos) return { preskoc: "len nový vzhľad (ovládač novy)" };
      const t = s.t, P = a.produkt, web = a.web || "sk";
      await j.otvor(s, a.url, { novy: true });
      const z = await j.zaklad(s, ovl, { rozlozenie: 0 });
      const chyby = [], info = [];
      const over = (ok, sprava) => { if (!ok) chyby.push(sprava); };
      // telefón: variant 2 (okno-vsetko-mobil) mení okraje, max. výšku a vrch okna zámerne (VARIANT2_TELEFON)
      const ref = (kluc, p, kde) => { const r = refOkna(`${web}|${P.id}|${t.sirka}|${kluc}`, p, t.mobil ? VARIANT2_TELEFON : []); if (r) chyby.push(kde + ": " + r); };
      const VYBER = [
        { pocet: 2, prvy: { farba: 1, velkost: "M", velkost2: "M" }, vzor: /^2× box · M \+ M · /, meno: "2 boxy M + M" },
        { pocet: 1, prvy: { farba: null, velkosti: [["boxSolo", "XL"]] }, vzor: /^1× box · XL · /, meno: "1 box XL" },
      ];
      let posledne = null;
      for (const v of VYBER) {
        if (!t.mobil) {
          const r = await kb.polohaPc(t, { pocet: v.pocet, ...v.prvy });
          const kde = `${v.meno}, ${t.sirka} px`;
          ref(`${v.pocet}|pc`, r.pc, kde);
          if (r.ipad) ref(`${v.pocet}|ipad`, r.ipad, kde + ", trieda iOS + výrez zbalenej lišty (iPad)");
          else chyby.push(`${kde}: model iPadu sa nedal nastaviť: ${r.ipadChyba}`);
          over(r.zavrete && r.stav.karta === v.pocet && v.vzor.test(r.stav.vyber || ""), `${kde}: po „Potvrďte“ okno ${r.zavrete ? "zavreté" : "otvorené"}, karta ${r.stav.karta}, súhrn „${r.stav.vyber}“`);
          info.push(`${v.pocet} box: okno ${r.pc.oknoVrch}–${r.pc.oknoSpodok}, tlačidlo ${r.pc.tlacVrch}–${r.pc.tlacSpodok}`);
          posledne = r;
          continue;
        }
        let prvy = true;
        for (const meno of [...Object.keys(SAFARI_ROZLOZENIA), "rozbalene"]) {
          const g = SAFARI_ROZLOZENIA[meno] || null;
          const r = await kb.polohaIos(t, { pocet: v.pocet, ...(prvy ? v.prvy : { farba: null, velkosti: [] }), lista: g });
          prvy = false;
          const p = r.ios, kde = `${v.meno}, ${t.sirka} px, lišta ${g ? "zbalená " + meno : "rozbalená"}`;
          const biela = +(p.oknoSpodok - p.tlacSpodok).toFixed(1), nadSpodkom = +(p.ih - p.tlacSpodok).toFixed(1);
          over(p.trieda, `${kde}: okno nemá triedu lcd1v-bx--ios (UA iPhone)`);
          if (g) {
            over(nadSpodkom >= g.pas + 16, `${kde}: spodok tlačidla ${nadSpodkom} px nad spodkom výrezu (pás lišty ${g.pas} + 16)`);
            over(biela <= 22, `${kde}: pod tlačidlom ${biela} px bielej (max 22)`);
            over(p.ih - p.oknoSpodok >= g.pas - 1, `${kde}: okno siaha do pásu lišty (spodok okna ${+(p.ih - p.oknoSpodok).toFixed(1)} px nad spodkom výrezu, pás ${g.pas})`);
          } else {
            over(Math.abs(p.oknoSpodok - p.ih) <= 1, `${kde}: spodok okna ${p.oknoSpodok}, výrez ${p.ih} (dnes okno sedí na spodku)`);
            over(Math.abs(p.padPaty - 20) <= 0.5, `${kde}: päta ${p.padPaty} px (dnes 20)`);
            ref(`${v.pocet}|ios-rozbalene`, p, kde);
          }
          ref(`${v.pocet}|bez-ios|${meno}`, r.bezTriedy, kde + ", bez triedy iOS");
          for (const u of r.pod) {
            if (!u.mimoOkna) continue; // okno siaha po spodok (909cc67) — pod ním nie je kam ťuknúť
            over(u.otvorene, `${kde}: ťuknutie pod okno (${u.kde}, y ${u.y}, spodok okna ${u.spodokOkna}) okno zavrelo`);
            over(!u.zmena, `${kde}: ťuknutie pod okno zmenilo výber ${u.zmena}`);
            over(!u.zhltnute, `${kde}: ťuknutie pod okno (${u.kde}) vzal pás lišty — test mieril zle`);
          }
          if (r.zavrete !== null) {
            over(r.zavrete, `${kde}: okno ostalo otvorené po 1. ťuknutí na „Potvrďte“` + (r.zhltnute ? ` — vzala ho lišta Safari (${r.zhltnute}×)` : "") + (r.druhe ? ", zavrelo až 2. ťuknutie" : ""));
            over(!r.zhltnute, `${kde}: ťuknutie do tlačidla vzala lišta Safari`);
            over(!r.stav.chyby.length, `${kde}: v okne je červený rám: ${r.stav.chyby.join(" | ")}`);
            over(r.stav.karta === v.pocet && v.vzor.test(r.stav.vyber || ""), `${kde}: karta ${r.stav.karta}, súhrn „${r.stav.vyber}“`);
          }
          const pod = r.pod.filter((u) => u.mimoOkna).length;
          info.push(`${v.pocet}/${meno}: biela ${biela}, tlačidlo ${nadSpodkom} nad spodkom${pod ? ", ťuk pod okno " + pod + "×" : ""}${r.zavrete ? ", 1 ťuk" : ""}`);
          posledne = r;
        }
      }
      // košík: posledný výber = 1 box XL (farba z 2 boxov)
      let post = null, spolu = null;
      try {
        await ovl.cena.pridajDoKosika(t);
        post = await j.cakajNaPost(s);
        const cena = await j.overPost(s, post, { ...z.ocak, farbaBoxov: posledne.hodnoty.farbaBoxov, boxSolo: posledne.hodnoty.boxSolo });
        spolu = cena.spolu;
        over(posledne.hodnoty.boxSolo && !posledne.hodnoty.box1 && !posledne.hodnoty.box2, "formulár po 1 boxe XL: " + JSON.stringify(posledne.hodnoty));
      } catch (e) { chyby.push("košík: " + e.message); }
      j.over(!chyby.length, `${chyby.length} nálezov: ${chyby.join(" | ")} || namerané: ${info.join("; ")}`);
      return { info: `${REF_ULOZ ? "referencia uložená; " : ""}${info.join("; ")}; POST box XL, spolu ${spolu}`, post: post && post.body, spolu };
    },
  },

  /**
   * „Potvrďte výber boxov“ potvrdí JEDNÝM ťuknutím (Michal 29. 10. 2026, iPhone: „musí dvakrát kliknúť na to zelené
   * tlačidlo v tom pop-up okne“). Telefón: model zbalenej spodnej lišty Safari (ovládač jedenTuk — pás lišty pri spodku
   * ťuknutie zhltne). (1) 2 boxy, farba, M + M (ako na Michalovej snímke) -> 1 ťuknutie; (2) úprava: znova okno, 2. box
   * L a ťuknutie hneď po voľbe; (3) 1 box (farba sa prenesie) XL -> 1 ťuknutie. Po každom: okno zavreté, súhrn kroku
   * a karta sedia, žiadny červený rám; nakoniec do košíka (POST: farba boxov + samostatný box XL, bez 1./2. boxu).
   * Telefón: (1)–(3) v geometrii lišty „hore“ (Michalov iPhone, 30. 10. 2026) aj „stary80“ (model z 29. 10.).
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
      let geo = "";
      const over1 = (meno, r, vzor, pocet) => {
        const kde = `${meno} (${t.sirka} px${r.model ? ", lišta Safari zbalená " + geo : ""}, stred tlačidla ${r.tlacidlo.odSpodku} px nad spodkom)`;
        j.over(r.zavrete, `${kde}: okno ostalo otvorené po 1. ťuknutí` + (r.zhltnute ? ` — ťuknutie vzala lišta Safari (${r.zhltnute}×)` : "") +
          (r.druhe ? ", zavrelo až 2. ťuknutie (chyba z iPhonu)" : ", nezavrelo ani 2. ťuknutie") + `; chyby v okne: ${r.stav.chyby.join(" | ") || "žiadne"}`);
        j.over(!r.zhltnute, `${kde}: ťuknutie do tlačidla vzala lišta Safari`);
        j.over(!r.stav.chyby.length, `${kde}: v okne je červený rám / chybová veta: ${r.stav.chyby.join(" | ")}`);
        j.over(r.stav.ariaHidden === "true" && !r.stav.viditelne, `${kde}: okno je po potvrdení stále vidno (aria-hidden ${r.stav.ariaHidden})`);
        j.over(r.stav.karta === pocet, `${kde}: označená karta boxov ${r.stav.karta}, čakám ${pocet}`);
        j.over(vzor.test(r.stav.vyber || ""), `${kde}: súhrn kroku boxov „${r.stav.vyber}“ nesedí s ${vzor}`);
        kroky.push(`${geo ? geo + ": " : ""}${meno} ${r.tlacidlo.odSpodku} px`);
      };
      let r3;
      for (geo of t.mobil ? ["hore", "stary80"] : [""]) {
        const lista = geo ? SAFARI_ROZLOZENIA[geo] : undefined;
        const r1 = await kb.jedenTuk(t, { pocet: 2, farba: 1, velkost: "M", velkost2: "M", lista });
        over1("2 boxy M + M", r1, /^2× box · M \+ M · .+ · \+ /, 2);
        const r2 = await kb.jedenTuk(t, { pocet: 2, farba: null, velkosti: [["box2", "L"]], hned: true, lista });
        over1("úprava: 2. box L tesne pred ťuknutím", r2, /^2× box · M \+ L · /, 2);
        j.over(r2.hodnoty.farbaBoxov === r1.hodnoty.farbaBoxov && r2.hodnoty.box1 === r1.hodnoty.box1 && r2.hodnoty.box2 && r2.hodnoty.box2 !== r1.hodnoty.box2,
          "úprava 2. boxu: formulár " + JSON.stringify(r2.hodnoty) + " (pred " + JSON.stringify(r1.hodnoty) + ")");
        r3 = await kb.jedenTuk(t, { pocet: 1, farba: null, velkosti: [["boxSolo", "XL"]], lista });
        over1("1 box XL (farba prenesená)", r3, /^1× box · XL · /, 1);
        j.over(r3.hodnoty.farbaBoxov === r1.hodnoty.farbaBoxov && r3.hodnoty.boxSolo, "1 box: formulár " + JSON.stringify(r3.hodnoty));
      }
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
   * a súhrn kroku sedia. Bez košíka: POST 0. Telefón: (1)–(3) v geometrii lišty „hore“ aj „stary80“ (ako okno-jeden-tuk).
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
      let geo = "";
      const over2 = (meno, r, vzor, pocet) => {
        const kde = `${meno} (${t.sirka} px${r.model ? ", lišta Safari zbalená " + geo : ""}, 2. ťuknutie o ${r.ms} ms na ${r.ciel})`;
        j.over(r.zavrete, `${kde}: okno sa 1. ťuknutím nezavrelo (prvé ťuknutie na ${r.prvy}, zatvorené o ${r.zatvoreneMs} ms)`);
        j.over(r.ms < 780, `${kde}: odstup ťuknutí ${r.ms} ms — pomalý beh (pozadie chytá 800 ms), scenár neoveril`);
        j.over(!r.otvorene, `${kde}: druhé ťuknutie okno znova otvorilo`);
        j.over(JSON.stringify(r.hodnoty) === JSON.stringify(r.pred), `${kde}: druhé ťuknutie zmenilo výber ${JSON.stringify(r.pred)} -> ${JSON.stringify(r.hodnoty)}`);
        j.over(r.stav.karta === pocet, `${kde}: označená karta boxov ${r.stav.karta}, čakám ${pocet}`);
        j.over(vzor.test(r.stav.vyber || ""), `${kde}: súhrn kroku boxov „${r.stav.vyber}“ nesedí s ${vzor}`);
        kroky.push(`${geo ? geo + ": " : ""}${meno} ${r.ms} ms → ${r.ciel}`);
      };
      for (geo of t.mobil ? ["hore", "stary80"] : [""]) {
        const lista = geo ? SAFARI_ROZLOZENIA[geo] : undefined;
        const r1 = await kb.dvojTuk(t, { pocet: 2, farba: 1, velkost: "M", velkost2: "M", rozostup: 300, lista });
        over2("2 boxy M + M", r1, /^2× box · M \+ M · /, 2);
        const r2 = await kb.dvojTuk(t, { pocet: 2, farba: null, velkosti: [], rozostup: 700, lista });
        over2("úprava bez zmeny", r2, /^2× box · M \+ M · /, 2);
        const r3 = await kb.dvojTuk(t, { pocet: 1, farba: null, velkosti: [["boxSolo", "XL"]], rozostup: 300, lista });
        over2("1 box XL", r3, /^1× box · XL · /, 1);
      }
      j.over(s.posty.length === 0, "scenár bez košíka poslal POST: " + (s.posty[0] && s.posty[0].body));
      return { info: `výber ostal: ${kroky.join("; ")}` };
    },
  },

  /**
   * Okno boxov „všetko na jednu obrazovku“ (variant 2, Michal 30. 10. 2026 podľa náhľadu nahlad-2/variant-2-vsetko.png,
   * iPhone 440 × 956, lišta Safari zbalená). Telefón (--sirka 360 / 375 / 390 / 414 / 440, výšky obrazovky TELEFONY):
   * iPhone UA (lišta zbalená v modeli „hore“ a rozbalená; výrez ako v náhľade = obrazovka − IPHONE_VRCH) a Android UA
   * (výrez = obrazovka − ANDROID_VRCH), 2 boxy M + M a 1 box XL (farba prenesená):
   *   - S / M / L / XL = 4 dlaždice v jednom riadku pre každý box; nič nepreteká dlaždicu (scrollWidth ≤ clientWidth,
   *     písmeno, rozmer, cena, štítok, kresba vnútri) a nič sa neprekrýva,
   *   - písmo (PISMO_OKNA): text ≥ 16 px, rozmery a ceny ≥ 15, štítky ≥ 12, tlačidlo ≥ 14; žiadne overflow-wrap: anywhere,
   *   - vzorky 5 v riadku, ≥ 64 px; „Vybraná farba“ nad vzorkami, v jednom riadku s „Farba boxov“, keď sa vedľa seba
   *     zmestia (dlhý názov farby — napr. CZ „Černá kůže, … prošití“ na 414 px — ide pod nadpis),
   *   - „Potvrďte výber boxov“ celé v okne aj na obrazovke (aj keď okno roluje — iPhone SE 375 × 667),
   *   - iPhone, zbalená lišta: vrch okna ≥ 100 px obrazovky (nie nad kapsulou adresy); rozbalená: nie nad vrchom výrezu,
   *   - bez posunu v okne (scrollHeight ≤ clientHeight): iPhone 440 × 956 so zbalenou lištou (náhľad); inde sa posun vypíše,
   *   - JEDNO „Potvrďte“ okno zavrie, karta a súhrn kroku sedia.
   * PC / tablet (768 / 1280 / 1366 / 1920): vypočítané štýly a polohy okna a jeho častí = 38d0bf8 (refVsetko).
   * S --snimky: snímka každej geometrie. Hlási všetky nálezy naraz (čísla pre opravu). Bez košíka (POST 0).
   */
  "okno-vsetko-mobil": {
    typy: ["jedno", "dvoj"],
    fn: async (s, a, pom, ovl, j) => {
      const sk = preskocBez(a); if (sk) return sk;
      const kb = ovl.kuforBoxy;
      if (!kb.oknoVsetko) return { preskoc: "len nový vzhľad (ovládač novy)" };
      const t = s.t, P = a.produkt, web = a.web || "sk";
      const chyby = [], info = [];
      const over = (ok, sprava) => { if (!ok) chyby.push(sprava); };
      const VYBER = [
        { pocet: 2, farba: 1, velkost: "M", velkost2: "M", vzor: /^2× box · M \+ M · /, meno: "2 boxy" },
        { pocet: 1, farba: null, velkosti: [["boxSolo", "XL"]], vzor: /^1× box · XL · /, meno: "1 box" },
      ];
      const potvrd = (r, v, kde) => over(r.zavrete && r.stav.karta === v.pocet && v.vzor.test(r.stav.vyber || "") && !r.stav.chyby.length,
        `${kde}: po „Potvrďte“ okno ${r.zavrete ? "zavreté" : "otvorené"}, karta ${r.stav.karta}, súhrn „${r.stav.vyber}“${r.stav.chyby.length ? ", chyby " + r.stav.chyby.join(" | ") : ""}`);
      if (!t.mobil) {
        await j.otvor(s, a.url, { novy: true });
        await j.zaklad(s, ovl, { rozlozenie: 0 });
        for (const v of VYBER) {
          const r = await kb.oknoVsetko(t, v);
          const kde = `${v.meno}, ${t.sirka} px`;
          const rozdiel = refVsetko(`${web}|${P.id}|${t.sirka}|${v.pocet}`, r.styl);
          if (rozdiel) chyby.push(kde + ": " + rozdiel);
          potvrd(r, v, kde);
          if (r.styl) info.push(`${v.meno}: okno ${r.styl.okno.rect.join(" / ")}, dlaždice ${r.styl.dlazdice && r.styl.dlazdice.gridTemplateColumns}`);
        }
        j.over(!chyby.length, `${chyby.length} nálezov: ${chyby.join(" | ")} || namerané: ${info.join("; ")}`);
        j.over(s.posty.length === 0, "scenár bez košíka poslal POST");
        return { info: `${REF_VSETKO_ULOZ ? "referencia 38d0bf8 uložená; " : "= 38d0bf8; "}${info.join("; ")}` };
      }
      const vysky = TELEFONY[t.sirka] || [s.k.vyska];
      const uaPovodny = await t.ev("navigator.userAgent");
      try {
        for (const ua of ["iphone", "android"]) {
          if (ua === "android") await s.k.posli("Emulation.setUserAgentOverride", { userAgent: UA_ANDROID, platform: "Linux armv8l" });
          await j.otvor(s, a.url, { novy: true });
          await j.zaklad(s, ovl, { rozlozenie: 0 });
          const geometrie = [];
          for (const h of vysky) {
            const g = SAFARI_ROZLOZENIA.hore;
            if (ua === "iphone") {
              geometrie.push({ meno: `iphone-${t.sirka}x${h}-zbalena`, vyska: h - IPHONE_VRCH, model: { rozdiel: g.rozdiel, inset: h <= 667 ? 0 : g.inset }, posun: IPHONE_VRCH, obrazovka: h, zbalena: true });
              geometrie.push({ meno: `iphone-${t.sirka}x${h}-rozbalena`, vyska: h - IPHONE_VRCH - g.rozdiel, model: null, posun: IPHONE_VRCH + g.rozdiel - g.pas, obrazovka: h });
            } else geometrie.push({ meno: `android-${t.sirka}x${h}`, vyska: h - ANDROID_VRCH, model: null, posun: ANDROID_VRCH, obrazovka: h });
          }
          for (const v of VYBER) {
            const r = await kb.oknoVsetko(t, { ...v, geometrie, snimka: a.snimky ? (m) => join(a.snimky, `okno-vsetko-${web}-${P.id}-${v.pocet}-${m}.png`) : null });
            for (const m of r.merania) {
              const g = geometrie.find((x) => x.meno === m.meno);
              const kde = `${v.meno}, ${m.meno}`;
              over(m.trieda === (ua === "iphone"), `${kde}: trieda lcd1v-bx--ios ${m.trieda ? "áno" : "nie"} (UA ${ua})`);
              over(m.boxy.length === v.pocet, `${kde}: viditeľných boxov ${m.boxy.length}, čakám ${v.pocet}`);
              for (const b of m.boxy) {
                over(b.n === 4 && b.riadok, `${kde}, ${b.kluc}: ${b.n} dlaždíc ${b.riadok ? "v 1 riadku" : "vo viacerých riadkoch"} (čakám S / M / L / XL v 1 riadku), dlaždica ${b.w} × ${b.h}`);
                over(!b.pretek.length, `${kde}, ${b.kluc}: preteká ${b.pretek.join("; ")}`);
              }
              over(!m.prekryv.length, `${kde}: ${m.prekryv.join("; ")}`);
              over(!m.anywhere.length, `${kde}: overflow-wrap anywhere / word-break break-all na ${m.anywhere.join(", ")}`);
              for (const k of ["nadpis", "pod", "nadp", "vl", "rozmer", "pripl", "ok"]) over(k in m.pisma, `${kde}: text „${k}“ v okne nevidno`);
              for (const [k, f] of Object.entries(m.pisma)) {
                const min = PISMO_OKNA[k] || 12;
                over(f >= min - 0.01, `${kde}: písmo ${k} ${f} px (min. ${min})`);
              }
              over(m.vzoriekVRiadku === 5 && m.vzorka >= 63.5, `${kde}: vzorky ${m.vzoriekVRiadku} v riadku, ${m.vzorka} px (čakám 5, ≥ 64)`);
              over(m.farba.nadVzorkami, `${kde}: „Vybraná farba“ nie je nad vzorkami`);
              if (m.farba.zmesti) over(m.farba.jedenRiadok, `${kde}: „Farba boxov“ a „Vybraná farba“ sa zmestia vedľa seba, ale nie sú v jednom riadku`);
              over(m.tlacVrch >= m.oknoVrch - 0.5 && m.tlacSpodok <= m.oknoSpodok + 0.5 && m.tlacVrch >= 0 && m.tlacSpodok <= m.ih + 0.5,
                `${kde}: „Potvrďte výber boxov“ ${m.tlacVrch}–${m.tlacSpodok} nie je celé v okne ${m.oknoVrch}–${m.oknoSpodok} / výreze 0–${m.ih}`);
              const vrch = +(m.oknoVrch + g.posun).toFixed(1);
              if (ua === "iphone" && g.zbalena) over(vrch >= 100, `${kde}: vrch okna ${vrch} px obrazovky — nad kapsulou adresy (≥ 100)`);
              else over(m.oknoVrch >= -0.5, `${kde}: vrch okna ${m.oknoVrch} px nad vrchom výrezu`);
              if (ua === "iphone" && g.zbalena && t.sirka === 440 && g.obrazovka === 956)
                over(m.posun <= 1, `${kde}: okno sa posúva o ${m.posun} px (farba, ${v.pocet === 2 ? "oba boxy" : "box"} a tlačidlo majú byť bez posunu, okno ${m.vyska} px, max ${m.maxHeight})`);
              const roz = m.boxy.map((b) => b.rozmerRiadky).join("/");
              info.push(`${m.meno.replace(/-/g, " ")} ${v.pocet}b: okno ${vrch}–${+(m.oknoSpodok + g.posun).toFixed(1)}${m.posun > 1 ? " posun " + m.posun : " bez posunu"}, dlaždica ${m.boxy[0] ? m.boxy[0].w + "×" + m.boxy[0].h : "?"} (rozmer ${roz} r.), vzorka ${m.vzorka}`);
            }
            potvrd(r, v, `${v.meno}, ${ua}`);
          }
        }
      } finally {
        await s.k.posli("Emulation.setUserAgentOverride", { userAgent: uaPovodny, platform: "iPhone" }).catch(() => {});
      }
      j.over(!chyby.length, `${chyby.length} nálezov: ${chyby.join(" | ")} || namerané: ${info.join("; ")}`);
      j.over(s.posty.length === 0, "scenár bez košíka poslal POST");
      return { info: info.join("; ") };
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
