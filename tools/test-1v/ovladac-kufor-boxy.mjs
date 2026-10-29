// Ovládač krokov 5–6 (rohož do kufra, boxy). VLASTNÍK: worker „kufor-boxy“
// (assets/js/components/konfigurator1v/kufor-boxy.js + assets/css/_lcd1v-kufor-boxy.scss + assets/js/lcdKosikDoplnok.js).
// Kontrakt: docs/1v-kontrakt.md. `stary` = živá stránka (referencia, nemeniť). `novy` = nový vzhľad; kým je null,
// --novy použije `stary`.
//
// Druhy kufra: "classic" (dno), "premium" (dno + boky), "nie". Veľkosti boxu: "S" | "M" | "L" | "XL".
import { pauza } from "./cdp.mjs";
import { F, otvorKrok, hodnota } from "./stary-ui.mjs";

export const VZOR_KUFRA = { classic: /^(?!.*bok).*dno/i, premium: /bok/i, nie: /^(nie|ne)\b/i };
const vzorVelkosti = (v) => new RegExp("^" + v + "\\s*:", "i");

async function viditelny(t, sel) {
  return t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); return !!(e && e.offsetHeight > 0 && getComputedStyle(e).visibility !== "hidden"); })()`);
}

export const stary = {
  meno: "stary",

  /** Starý vzhľad: kufor aj boxy sú skryté, kým zákazník nevyberie rozloženie (nevybrané = do košíka „nič“). */
  skryteNaZaciatku: true,

  /** { kufor: viditeľný?, boxy: viditeľné? } */
  async stav(t) {
    return { kufor: await viditelny(t, `${F} .upsale-buttons.trunk`), boxy: await viditelny(t, `${F} .upsale-buttons.boxs`) };
  },

  /** Vyberie rohož do kufra -> value v selecte kufra. */
  async vyberKufor(t, druh) {
    const id = await t.idParametra("kufor");
    const v = await t.moznost("kufor", VZOR_KUFRA[druh]);
    await otvorKrok(t, "kufor");
    await t.klikni(`${F} .upsale-buttons.trunk .upsale-button[value="${id}-${v}"]`, { popis: "kufor " + druh });
    await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${v}"`, { popis: "kufor vo formulári" });
    await pauza(400);
    return v;
  },

  /**
   * Vyberie boxy: { pocet: 0|1|2, farba: index farby boxov, velkost: "S".."XL", velkost2 (2. box, inak = velkost) }
   * -> { farbaBoxov, box1, box2, boxSolo } hodnoty selectov po výbere.
   */
  async vyberBoxy(t, { pocet, farba = 0, velkost = "S", velkost2 } = {}) {
    if (!(await viditelny(t, `${F} .upsale-buttons.boxs`))) {
      // boxy sa ukážu po výbere kufra alebo tlačidlom „Prejsť k ďalšiemu kroku“ v kroku kufra
      await otvorKrok(t, "kufor");
      await t.klikni(`${F} .upsale-buttons.trunk > .next-step-button`, { popis: "ďalší krok z kufra" });
      await t.cakaj(`(document.querySelector("${F} .upsale-buttons.boxs") || {}).offsetHeight > 0`, { popis: "krok boxov" });
    }
    await otvorKrok(t, "boxy");
    const karta = pocet === 2 ? "conf2" : pocet === 1 ? "conf1" : "0";
    await t.klikni(`${F} .upsale-buttons.boxs > .parameter-cars > .upsale-button[value="${karta}"]`, { popis: "boxy " + pocet });
    if (pocet) {
      await t.cakaj(`document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "výber farby a veľkosti boxov" });
      await pauza(300);
      const idF = await t.idParametra("farbaBoxov");
      await t.klikni(`${F} .box-config .parameter-wrap.parameter-${idF} .option-button`, { index: farba, popis: "farba boxov" });
      await t.cakaj(`!!(document.querySelector('${F} select[data-parameter-id="${idF}"]') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
      const velkosti = pocet === 2 ? [["box1", velkost], ["box2", velkost2 || velkost]] : [["boxSolo", velkost]];
      for (const [kluc, v] of velkosti) {
        const id = await t.idParametra(kluc);
        const val = await t.moznost(kluc, vzorVelkosti(v));
        await t.klikni(`${F} .box-config .option-button[data-variant="${id}"][data-value="${val}"]`, { popis: kluc + " " + v });
      }
      await t.klikni(`${F} .box-config .close-btn.return`, { popis: "potvrdiť boxy" });
      await pauza(400);
    }
    return {
      farbaBoxov: await hodnota(t, "farbaBoxov"),
      box1: await hodnota(t, "box1"),
      box2: await hodnota(t, "box2"),
      boxSolo: await hodnota(t, "boxSolo"),
    };
  },
};

// ------------------------------------------------------------------ nový vzhľad (?novy=1)
// Kroky 5–6 podľa návrhu v26 (assets/js/components/konfigurator1v/kufor-boxy.js): karty Classic / Premium / Nechcem
// a 1× / 2× box / Nechcem (.lcd1v-kb__karta), okno boxov = živý .box-config preštýlovaný (farby, veľkosti S–XL,
// „Potvrďte výber boxov“ .lcd1v-bx__ok, krížik .lcd1v-bx__x). Klik len na to, čo vidí zákazník.
const KB = (krok) => `${F} .upsale-buttons.${krok === "kufor" ? "trunk" : "boxs"}`;
const KARTA_KUFRA = (druh) => `${KB("kufor")} .lcd1v-kb__karta[data-kufor="${druh}"]`;
const KARTA_BOXOV = (pocet) => `${KB("boxy")} .lcd1v-kb__karta[data-boxy="${pocet}"]`;
const OKNO = `${F} .upsale-Banner.lcd1v-kb .box-config`;

/**
 * Popis vybranej farby pod vzorkami (kufor-boxy.js okno boxov, boxy-produkt.js krok Farba 616; Michal 19. 10. 2026:
 * „aby sa aj pri výbere farby zobrazovala niekde dole s kontextom, že aká je to farba“). Bez voľby v živom selecte
 * `kluc` skrytý; s voľbou „Vybraná farba: <Koža> koža, <šitie> šitie“ (koža so šitím) alebo „Vybraná farba: <názov>“
 * podľa textu zvolenej možnosti (nič z adminu „Farba kože :“, „+€0“), pod vzorkami, písmo ≥ 16 px, nepreteká.
 * Obnova ide cez requestAnimationFrame / MutationObserver -> čaká do 5 s. Vráti text popisu ("" = skrytý).
 */
export async function overPopisFarby(t, selPopis, kluc) {
  const id = await t.idParametra(kluc);
  const kontrola = `(function () {
    var s = document.querySelector('${F} select[data-parameter-id="${id}"]'), p = document.querySelector(${JSON.stringify(selPopis)});
    if (!s) return "select " + ${JSON.stringify(kluc)} + " chýba";
    if (!p) return "popis farby chýba (" + ${JSON.stringify(selPopis)} + ")";
    var vid = !p.hidden && p.offsetHeight > 0 && getComputedStyle(p).display !== "none";
    var pt = p.textContent.replace(/\\s+/g, " ").trim();
    if (!s.value) return vid ? "popis viditeľný bez voľby farby: " + pt : "";
    var o = s.options[s.selectedIndex];
    var t = o.text.normalize("NFC").replace(/\\s*\\+\\s*(?:€|Kč)?\\s*-?[\\d\\s.,]+\\s*(?:€|Kč)?\\s*$/, "").replace(/\\s+/g, " ").trim();
    if (!vid) return "popis skrytý pri voľbe " + t;
    var m = /farba\\s+ko[žz]e\\s*:?\\s*(.+?)(?:\\s*\\/?\\s*farba\\s+[šs]itia\\s*:?\\s*(.+))?$/i.exec(t);
    if (!m) return "text možnosti bez „Farba kože“: " + t;
    var bez = function (x) { return String(x).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase(); };
    var koza = m[1].replace(/[\\s\\/]+$/, "").trim(), sitie = m[2] ? m[2].trim() : "";
    if (pt.indexOf("Vybraná farba: ") !== 0) return "popis nezačína „Vybraná farba:“: " + pt;
    var nm = pt.slice("Vybraná farba: ".length);
    if (/farba|[+€:\\/]/i.test(nm)) return "v popise ostal text z adminu: " + pt;
    if (nm.charAt(0) !== nm.charAt(0).toUpperCase()) return "popis nezačína veľkým písmenom: " + pt;
    if (sitie) {
      var c = nm.split(", ");
      if (c.length !== 2 || bez(c[0]) !== bez(koza) + " koza" || !/ šitie$/.test(c[1]) || bez(c[1]).indexOf(bez(sitie).slice(0, 3)) !== 0)
        return "popis „" + pt + "“ nesedí s voľbou „" + t + "“ (čakám „<koža> koža, <šitie> šitie“)";
    } else if (bez(nm) !== bez(koza)) return "popis „" + pt + "“ nesedí s voľbou „" + t + "“";
    var ow = p.parentElement && p.parentElement.querySelector(":scope > .options-wrap");
    if (ow && p.getBoundingClientRect().top < ow.getBoundingClientRect().bottom - 1) return "popis nie je pod vzorkami";
    var cs = getComputedStyle(p);
    if (parseFloat(cs.fontSize) < 16) return "písmo popisu farby " + cs.fontSize + " (< 16 px)";
    if (p.scrollWidth > p.clientWidth + 1 || p.getBoundingClientRect().right > document.documentElement.clientWidth + 1) return "popis farby preteká: " + p.scrollWidth + " > " + p.clientWidth;
    return "";
  })()`;
  let chyba = "";
  for (let i = 0; i < 34; i++) {
    chyba = await t.ev(kontrola);
    if (!chyba) break;
    await pauza(150);
  }
  if (chyba) throw new Error("popis farby (" + kluc + "): " + chyba);
  return t.ev(`(function () { var p = document.querySelector(${JSON.stringify(selPopis)}); return p && !p.hidden ? p.textContent.replace(/\\s+/g, " ").trim() : ""; })()`);
}

/** Karta je naozaj viditeľná a nezrezaná zbaleným krokom (akordeón). */
async function kartaVidno(t, sel) {
  return t.ev(`(function () {
    var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false;
    var r = e.getBoundingClientRect(); if (r.height < 40 || getComputedStyle(e).visibility === "hidden") return false;
    var p = e.parentElement;
    while (p && p !== document.body) {
      var c = getComputedStyle(p);
      if (c.display === "none") return false;
      if (c.overflow !== "visible" || c.overflowY !== "visible") { var q = p.getBoundingClientRect(); if (r.bottom > q.bottom + 1 || r.top < q.top - 1) return false; }
      p = p.parentElement;
    }
    return true;
  })()`);
}

/** Otvorí krok 5/6, ak je zbalený: klik na hlavičku kroku (nový vzhľad: hlavička krokov patrí workerovi „kroky“). */
async function otvorKrokNovy(t, krok, karta) {
  if (await kartaVidno(t, karta)) return;
  const sel = KB(krok);
  const hlavicka = await t.ev(`(function () {
    var s = document.querySelector(${JSON.stringify(sel)}); if (!s) return null;
    // nový obal krokov (worker „kroky“): živý .order roztiahnutý cez hlavičku .lcd1v-hd = živý akordeón
    var k = [":scope > .order", ":scope > .lcd1v-hd", ":scope > h5.variant.name"];
    for (var i = 0; i < k.length; i++) { var e = s.querySelector(k[i]); if (e && e.getBoundingClientRect().height > 0) return k[i].replace(":scope", ""); }
    return null;
  })()`);
  if (hlavicka) await t.klikni(sel + hlavicka, { popis: "hlavička kroku " + krok, vRamci: sel });
  else await otvorKrok(t, krok);
  await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(karta)}); return !!(e && e.getBoundingClientRect().height > 40); })()`, { popis: "otvorený krok " + krok });
  await pauza(450);
}

async function oknoOtvorene(t) {
  return t.ev(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible"); })()`);
}

/**
 * Vzhľad karty: odporúčaná karta kroku má široký zlatý pás s vetou „… najčastejšie“ (návrh E, Michal 15. 10. 2026);
 * ceny v riadkoch (Michal 18. 10. 2026, vzhľad d582a33): „V sete“ vždy s cenou; „Samostatne“ a „Výhoda v sete“ idú
 * spolu a Výhoda = Samostatne − V sete (presne = vybraný kufor / boxy s veľkosťou: „+ N €“). Ceny sú zo živej stránky,
 * nič natvrdo; „Samostatne“ sa načíta neskôr (pred načítaním sa kontroluje len cena v sete).
 */
async function overKartu(t, karta, { presne }) {
  const r = await t.ev(`(function () {
    var k = document.querySelector(${JSON.stringify(karta)}); if (!k) return "karta chýba";
    var veta = k.closest(".lcd1v-kb").querySelector(".lcd1v-kb__karta--naj > .lcd1v-kb__top > .lcd1v-kb__veta");
    if (!veta || !/najčastejšie/i.test(veta.textContent)) return "odporúčaná karta nemá zlatý pás s vetou „… najčastejšie“";
    var r = k.querySelectorAll(".lcd1v-kb__r"); if (!r.length) return ""; // Nechcem: bez riadkov ceny
    if (r.length !== 3) return "karta nemá 3 riadky ceny";
    var num = function (s) { var m = /(\\d[\\d\\s\\u00a0]*(?:,\\d+)?)/.exec(s || ""); return m ? Number(m[1].replace(/[\\s\\u00a0]/g, "").replace(",", ".")) : NaN; };
    var h = function (i) { return r[i].querySelector(".lcd1v-kb__rh").textContent; };
    if (r[2].hidden || !(num(h(2)) > 0)) return "cena v sete chýba: " + h(2);
    if (!/Samostatne/.test(r[0].textContent) || !/Výhoda v sete/.test(r[1].textContent) || !/V sete/i.test(r[2].textContent)) return "riadky nie sú Samostatne / Výhoda v sete / V sete: " + k.textContent;
    if (${presne ? "true" : "false"} && !/^\\+\\s/.test(h(2))) return "cena v sete nie je presná „+ N €“: " + h(2);
    if (r[0].hidden !== r[1].hidden) return "„Samostatne“ a „Výhoda v sete“ nie sú zobrazené spolu";
    if (r[0].hidden) return "";
    if (!/^(až\\s)?−\\s/.test(h(1))) return "výhoda nie je „− N €“: " + h(1);
    if (${presne ? "true" : "false"} && Math.abs(num(h(0)) - num(h(2)) - num(h(1))) > 0.01) return "Výhoda ≠ Samostatne − V sete: " + [h(0), h(1), h(2)].join(" / ");
    return "";
  })()`);
  if (r) throw new Error("karta " + karta.replace(/^.*\[/, "[") + ": " + r);
}

async function hodnotyBoxov(t) {
  return {
    farbaBoxov: await hodnota(t, "farbaBoxov"),
    box1: await hodnota(t, "box1"),
    box2: await hodnota(t, "box2"),
    boxSolo: await hodnota(t, "boxSolo"),
  };
}

/** Vyberie farbu a veľkosti v otvorenom okne (klik na vzorku / kartu veľkosti). */
async function vyplnOkno(t, { pocet, farba = 0, velkost = "S", velkost2 }) {
  const idF = await t.idParametra("farbaBoxov");
  await t.klikni(`${OKNO} .parameter-wrap.parameter-${idF} .option-button`, { index: farba, popis: "farba boxov" });
  await t.cakaj(`!!(document.querySelector('${F} select[data-parameter-id="${idF}"]') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
  await overPopisFarby(t, `${OKNO} .lcd1v-bx__farba-popis`, "farbaBoxov"); // vybraná farba slovami pod vzorkami
  const velkosti = pocet === 2 ? [["box1", velkost], ["box2", velkost2 || velkost]] : [["boxSolo", velkost]];
  for (const [kluc, v] of velkosti) {
    const id = await t.idParametra(kluc);
    const val = await t.moznost(kluc, vzorVelkosti(v));
    await t.klikni(`${OKNO} .option-button[data-variant="${id}"][data-value="${val}"]`, { popis: kluc + " " + v });
    await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 10000, popis: kluc + " vo formulári" });
  }
}

// ------------------------------------------------------------------ jedno ťuknutie na „Potvrďte výber boxov“
// Michal 29. 10. 2026 (iPhone, Safari, SK naživo e21be04): „musí dvakrát kliknúť na to zelené tlačidlo v tom pop-up okne“.
// Chromium aj WebKit (Playwright, profil iPhone) potvrdia JEDNÝM ťuknutím — stránka ťuknutie, ktoré dostane, spracuje
// hneď (touchend -> živé „potvrdiť“ -> okno zavreté). Na iPhone prvé ťuknutie stránka nedostane: Safari má po rolovaní
// dlhej stránky spodnú lištu ZBALENÚ a pás pri spodnom okraji obrazovky patrí jej — ťuknutie tam lištu len rozbalí
// (okno boxov sa s ňou posunie hore), až druhé trafí tlačidlo. Model pre test: rozdiel malého a veľkého výrezu
// (100lvh − 100svh = výška lišty; CDP Emulation.setSmallViewportHeightDifferenceOverride) a pás tej výšky pri spodku
// patrí „Safari“ (vrstva testu, ktorá ťuknutie zhltne a zmizne = lišta sa rozbalila). Bez modelu (PC) obyčajný klik.
const OK_BTN = `${OKNO} .lcd1v-bx__ok`;
/** Výška rozbalenej spodnej lišty Safari na iPhone (svh vs lvh, približne; iPhone 13–17 na výšku 80 ± 5 px). */
export const SAFARI_LISTA = 80;

async function safariListaZbalena(t, px) {
  if (!px || !t.mobil || !t.k || !t.k.tuk) return false;
  await t.k.posli("Emulation.setSmallViewportHeightDifferenceOverride", { difference: px });
  await t.ev(`(function (px) {
    var e = document.getElementById("lcd-test-safari-lista"); if (e) e.remove();
    e = document.createElement("div");
    e.id = "lcd-test-safari-lista";
    e.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:" + px + "px;z-index:2147483647;background:rgba(30,30,30,.14);touch-action:none";
    var zhltni = function (ev) { if (ev.cancelable) ev.preventDefault(); ev.stopPropagation(); };
    ["touchstart", "touchmove", "pointerdown", "pointerup", "mousedown", "mouseup", "click"].forEach(function (ty) { e.addEventListener(ty, zhltni, { passive: false }); });
    e.addEventListener("touchend", function (ev) { zhltni(ev); window.__lcdTestSafari = (window.__lcdTestSafari || 0) + 1; e.remove(); }, { passive: false });
    window.__lcdTestSafari = 0;
    document.documentElement.appendChild(e);
    return true;
  })(${px})`);
  await pauza(200); // prepočet výrezu (svh) a CSS
  return true;
}
async function safariListaRozbalena(t) {
  if (!t.k || !t.k.tuk || !t.mobil) return;
  await t.ev(`(function () { var e = document.getElementById("lcd-test-safari-lista"); if (e) e.remove(); return 1; })()`);
  await t.k.posli("Emulation.setSmallViewportHeightDifferenceOverride", { difference: 0 });
  await pauza(150);
}
/** Ťuknutie (PC klik) do stredu „Potvrďte výber boxov“ tak, ako mieri zákazník — bez kontroly, čo tam leží. */
async function tukniStredPotvrd(t) {
  const r = await t.ev(`(function () {
    var b = document.querySelector(${JSON.stringify(OK_BTN)}); if (!b) return null;
    var q = b.getBoundingClientRect();
    return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2), odSpodku: Math.round(innerHeight - (q.top + q.height / 2)),
      vidno: q.width > 0 && q.height > 0 && q.top >= 0 && q.bottom <= innerHeight + 1 };
  })()`);
  if (!r || !r.vidno) throw new Error("„Potvrďte výber boxov“ nie je celé na obrazovke: " + JSON.stringify(r));
  await tukni(t, r.x, r.y);
  return r;
}
/** Ťuknutie (telefón, CDP dotyk) alebo klik (PC) do bodu výrezu. */
async function tukni(t, x, y) {
  if (t.mobil && t.k && t.k.tuk) await t.k.tuk(x, y); else await t.k.klik(x, y);
}
/** Klik na kartu počtu boxov (nový výber alebo úprava toho istého počtu) a čakanie na úplne otvorené okno. */
async function otvorOknoKartou(t, pocet) {
  const karta = KARTA_BOXOV(pocet);
  await otvorKrokNovy(t, "boxy", karta);
  await t.klikni(karta, { popis: "boxy " + pocet });
  await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
  await pauza(300);
}
/** Farba (index vzorky, null = nemeniť) a veľkosti v otvorenom okne; hned = posledná voľba bez čakania na formulár. */
async function vyberVOkne(t, { pocet, farba, velkost, velkost2, velkosti, hned = false }) {
  if (farba != null) {
    const idF = await t.idParametra("farbaBoxov");
    await t.klikni(`${OKNO} .parameter-wrap.parameter-${idF} .option-button`, { index: farba, popis: "farba boxov" });
    await t.cakaj(`!!(document.querySelector('${F} select[data-parameter-id="${idF}"]') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
  }
  const zoznam = velkosti || (pocet === 2 ? [["box1", velkost], ["box2", velkost2 || velkost]] : [["boxSolo", velkost]]);
  for (let i = 0; i < zoznam.length; i++) {
    const [kluc, v] = zoznam[i];
    const id = await t.idParametra(kluc);
    const val = await t.moznost(kluc, vzorVelkosti(v));
    const posledna = i === zoznam.length - 1;
    await t.klikni(`${OKNO} .option-button[data-variant="${id}"][data-value="${val}"]`, { popis: kluc + " " + v, pockaj: hned && posledna ? 0 : 300 });
    if (!(hned && posledna)) await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 10000, popis: kluc + " vo formulári" });
  }
  if (!hned) await pauza(500);
}
// v stránke: záznam ťuknutí (pustenie prsta / myši: čas, cieľ) a otvorenia / zatvorenia okna boxov (showConf) — dvojTuk
// tak nemusí stránky pýtať medzi ťuknutiami (CDP volanie by posunulo odstup)
const ZAZNAM_TUKOV = `(function () {
  window.__lcdTestTuky = []; window.__lcdTestOkno = [];
  if (window.__lcdTestTukyZap) return true;
  window.__lcdTestTukyZap = true;
  var opis = function (c) { if (!c || !c.tagName) return String(c); var k = typeof c.className === "string" ? c.className.trim().split(/\\s+/).slice(0, 2).join(".") : ""; return c.tagName.toLowerCase() + (k ? "." + k : ""); };
  ["touchend", "mouseup"].forEach(function (ty) { window.addEventListener(ty, function (e) { if (e.isTrusted) window.__lcdTestTuky.push({ ty: ty, t: performance.now(), ciel: opis(e.target) }); }, true); });
  var b = document.querySelector(${JSON.stringify(F + " .upsale-Banner")});
  new MutationObserver(function () { var o = b.classList.contains("showConf"), z = window.__lcdTestOkno; if (!z.length || z[z.length - 1].o !== o) z.push({ o: o, t: performance.now() }); })
    .observe(b, { attributes: true, attributeFilter: ["class"] });
  return true;
})()`;
async function oknoZavrete(t) {
  return t.ev(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`);
}
/** Stav po potvrdení: súhrn kroku boxov, označená karta, chybové rámy v okne, viditeľnosť okna. */
async function stavPoPotvrdeni(t) {
  return t.ev(`(function () {
    var o = document.querySelector(${JSON.stringify(OKNO)}), k = document.querySelector('${KB("boxy")} .lcd1v-kb__karta[aria-pressed="true"]');
    return { vyber: document.querySelector("${KB("boxy")}").getAttribute("data-lcd1v-vyber"), karta: k ? Number(k.getAttribute("data-boxy")) : null,
      chyby: Array.prototype.map.call(o.querySelectorAll(".lcd-needs-fill, .selection-required"), function (e) { return e.className.replace(/\\s+/g, " ").slice(0, 60); }),
      ariaHidden: o.getAttribute("aria-hidden"), viditelne: getComputedStyle(o).visibility === "visible" && getComputedStyle(o).opacity !== "0" };
  })()`);
}

export const novy = {
  meno: "novy",

  /**
   * Okno boxov a JEDNO ťuknutie na „Potvrďte výber boxov“ (telefón: model zbalenej lišty Safari, lista px; PC klik).
   * pocet 1|2 = klik na kartu počtu (nový výber alebo úprava toho istého počtu), farba = index vzorky (null = nemeniť),
   * velkosti = [[kluc, "S".."XL"], …] (null = podľa pocet/velkost/velkost2), hned = ťuknúť hneď po poslednej voľbe
   * (bez čakania na formulár: zmena veľkosti tesne pred ťuknutím).
   * -> { zavrete po 1. ťuknutí, zhltnute (ťuknutia, ktoré vzala lišta), druhe (zavrelo až 2. ťuknutie), tlacidlo
   *      { odSpodku: stred tlačidla nad spodkom výrezu px }, stav, hodnoty }
   */
  async jedenTuk(t, { pocet = 2, farba = 0, velkost = "M", velkost2, velkosti = null, hned = false, lista = SAFARI_LISTA } = {}) {
    await otvorOknoKartou(t, pocet);
    const model = await safariListaZbalena(t, lista); // zákazník je pri kroku 7 dole na stránke: lišta Safari zbalená
    try {
      await vyberVOkne(t, { pocet, farba, velkost, velkost2, velkosti, hned });
      const tlacidlo = await tukniStredPotvrd(t);
      let zavrete = false;
      for (let i = 0; i < 12 && !zavrete; i++) { await pauza(150); zavrete = await oknoZavrete(t); }
      const zhltnute = model ? await t.ev(`window.__lcdTestSafari || 0`) : 0;
      if (model) await safariListaRozbalena(t); // po ťuknutí do lišty je lišta rozbalená
      let druhe = false;
      if (!zavrete) {
        // ako zákazník: ťukne ešte raz (len pre výpis — scenár zlyhá aj tak)
        await pauza(300);
        await tukniStredPotvrd(t);
        for (let i = 0; i < 12 && !druhe; i++) { await pauza(150); druhe = await oknoZavrete(t); }
      }
      await pauza(400);
      return { zavrete, zhltnute, druhe, tlacidlo, model, stav: await stavPoPotvrdeni(t), hodnoty: await hodnotyBoxov(t) };
    } finally {
      if (model) await safariListaRozbalena(t).catch(() => {});
    }
  },

  /**
   * Okno boxov a DVOJITÉ ťuknutie na „Potvrďte výber boxov“: prst / myš sa vráti na to isté miesto o rozostup ms
   * (dvojklik na PC, na iPhone zvyk z čias, keď prvé ťuknutie brala lišta Safari). Výber a model lišty ako jedenTuk.
   * Druhé ťuknutie mieri do toho istého bodu bez ohľadu na to, čo tam po zatvorení okna leží.
   * -> { zavrete (po 1. ťuknutí), ms (odstup ťuknutí nameraný v stránke), ciel (prvok, ktorý dostal 2. ťuknutie),
   *      otvorene (okno po 2. ťuknutí), tlacidlo, model, pred (formulár pred ťuknutím), stav, hodnoty }
   */
  async dvojTuk(t, { pocet = 2, farba = 0, velkost = "M", velkost2, velkosti = null, rozostup = 300, lista = SAFARI_LISTA } = {}) {
    await otvorOknoKartou(t, pocet);
    const model = await safariListaZbalena(t, lista);
    try {
      await vyberVOkne(t, { pocet, farba, velkost, velkost2, velkosti });
      const pred = await hodnotyBoxov(t);
      await t.ev(ZAZNAM_TUKOV);
      const tlacidlo = await tukniStredPotvrd(t);
      // ťuknutie (CDP) = dotyk, 50 ms, pustenie -> druhé pustenie o rozostup ms po prvom
      await pauza(Math.max(0, rozostup - (t.mobil && t.k && t.k.tuk ? 50 : 0)));
      await tukni(t, tlacidlo.x, tlacidlo.y);
      await pauza(1200); // poistka G10b (700 ms) a prípadné znovuotvorenie okna
      // zavrete = okno sa zavrelo medzi 1. a 2. ťuknutím; otvorene = po 2. ťuknutí je (znova) otvorené
      const z = await t.ev(`(function (ty) { var p = (window.__lcdTestTuky || []).filter(function (x) { return x.ty === ty; }), o = window.__lcdTestOkno || [];
        if (p.length < 2) return { ms: -1, ciel: p.map(function (x) { return x.ciel; }).join(" + ") || "nič" };
        return { ms: Math.round(p[1].t - p[0].t), ciel: p[1].ciel, prvy: p[0].ciel,
          zavrete: o.some(function (x) { return !x.o && x.t >= p[0].t - 5 && x.t <= p[1].t; }),
          zatvoreneMs: (o.filter(function (x) { return !x.o && x.t >= p[0].t - 5; })[0] || { t: NaN }).t - p[0].t,
          znova: o.some(function (x) { return x.o && x.t > p[1].t; }) }; })(${JSON.stringify(t.mobil && t.k && t.k.tuk ? "touchend" : "mouseup")})`);
      if (z.ms < 0) throw new Error("stránka nezaznamenala dve ťuknutia (" + z.ciel + ")");
      return { ...z, zatvoreneMs: z.zatvoreneMs == null ? null : Math.round(z.zatvoreneMs), otvorene: z.znova || !(await oknoZavrete(t)), tlacidlo, model, pred, stav: await stavPoPotvrdeni(t), hodnoty: await hodnotyBoxov(t) };
    } finally {
      if (model) await safariListaRozbalena(t).catch(() => {});
    }
  },

  /** Nový vzhľad: kroky 5 a 6 sú viditeľné od začiatku (nevybrané = Nechcem, do košíka „nič“). */
  skryteNaZaciatku: false,

  async stav(t) {
    return { kufor: await viditelny(t, KB("kufor")), boxy: await viditelny(t, KB("boxy")) };
  },

  /** Klik na kartu Classic / Premium / Nechcem -> value v selecte kufra ("" alebo „nie“ pri Nechcem bez predošlého výberu). */
  async vyberKufor(t, druh) {
    const id = await t.idParametra("kufor");
    const karta = KARTA_KUFRA(druh);
    await otvorKrokNovy(t, "kufor", karta);
    await t.klikni(karta, { popis: "kufor " + druh });
    if (druh === "nie") {
      const nie = await t.moznost("kufor", VZOR_KUFRA.nie);
      await t.cakaj(`(function () { var v = (document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value; return v === "" || v === "${nie}"; })()`, { popis: "kufor Nechcem vo formulári" });
    } else {
      const v = await t.moznost("kufor", VZOR_KUFRA[druh]);
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${v}"`, { popis: "kufor vo formulári" });
    }
    await t.cakaj(`(document.querySelector(${JSON.stringify(karta)}) || {}).getAttribute && document.querySelector(${JSON.stringify(karta)}).getAttribute("aria-pressed") === "true"`, { ms: 15000, popis: "karta kufra označená" });
    await pauza(400);
    await overKartu(t, karta, { presne: true });
    return hodnota(t, "kufor");
  },

  /**
   * Okno boxov bez farby (Michal 26. 10. 2026: „keď si vyberiem veľkosti boxov a nemám vybratú farbu, verifikácia ma
   * nevyscroluje na farbu“): karta počtu -> len veľkosti -> okno posunuté na spodok (farba nad okrajom) -> „Potvrďte
   * výber boxov“. -> { pred, po, otvorene }; pred/po = { hore: vrch farieb voči vrchu okna px, vidno, chyba, posun, max }.
   */
  async oknoBezFarby(t, { pocet = 1, velkost = "M" } = {}) {
    const karta = KARTA_BOXOV(pocet);
    await otvorKrokNovy(t, "boxy", karta);
    await t.klikni(karta, { popis: "boxy " + pocet });
    await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
    await pauza(300);
    const velkosti = pocet === 2 ? [["box1", velkost], ["box2", velkost]] : [["boxSolo", velkost]];
    for (const [kluc, v] of velkosti) {
      const id = await t.idParametra(kluc);
      const val = await t.moznost(kluc, vzorVelkosti(v));
      await t.klikni(`${OKNO} .option-button[data-variant="${id}"][data-value="${val}"]`, { popis: kluc + " " + v });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 10000, popis: kluc + " vo formulári" });
    }
    const idF = await t.idParametra("farbaBoxov");
    const W = `${OKNO} .parameter-wrap.parameter-${idF}`;
    const mer = `(function () {
      var o = document.querySelector(${JSON.stringify(OKNO)}), w = document.querySelector(${JSON.stringify(W)}), p = o && o.querySelector(".lcd1v-bx__pata");
      if (!o || !w) return null;
      var ro = o.getBoundingClientRect(), rw = w.getBoundingClientRect(), dole = ro.bottom - (p ? p.offsetHeight : 0);
      var ch = w.querySelector(".lcd1v-bx__chyba"), rc = ch && ch.getBoundingClientRect();
      return { hore: Math.round(rw.top - ro.top), vidno: rw.top >= ro.top - 1 && rw.top <= dole - 48, chyba: !!(rc && rc.height > 0 && getComputedStyle(ch).display !== "none" && rc.top >= ro.top - 1 && rc.bottom <= dole + 1),
        posun: Math.round(o.scrollTop), max: Math.round(o.scrollHeight - o.clientHeight) };
    })()`;
    await t.ev(`(function () { var o = document.querySelector(${JSON.stringify(OKNO)}); o.scrollTop = o.scrollHeight; })()`);
    await pauza(400);
    const pred = await t.ev(mer);
    await t.tukni(`${OKNO} .lcd1v-bx__ok`, { popis: "Potvrďte výber boxov bez farby" });
    let po = null;
    for (let i = 0; i < 16; i++) { await pauza(150); po = await t.ev(mer); if (po && po.vidno && po.chyba) break; }
    const otvorene = await t.ev(`document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`);
    return { pred, po, otvorene };
  },

  /** { pocet: 0|1|2, farba, velkost, velkost2 } -> klik na kartu počtu, v okne farba + veľkosti + „Potvrďte výber boxov“. */
  async vyberBoxy(t, { pocet, farba = 0, velkost = "S", velkost2 } = {}) {
    const karta = KARTA_BOXOV(pocet || 0);
    await otvorKrokNovy(t, "boxy", karta);
    await t.klikni(karta, { popis: "boxy " + (pocet || 0) });
    if (pocet) {
      await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
      await pauza(300);
      await vyplnOkno(t, { pocet, farba, velkost, velkost2 });
      await t.tukni(`${OKNO} .lcd1v-bx__ok`, { popis: "Potvrďte výber boxov (na telefóne ťuknutím)" });
      await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "okno boxov zavreté po potvrdení" });
    } else {
      await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "bez okna pri Nechcem" });
    }
    await t.cakaj(`document.querySelector(${JSON.stringify(karta)}).getAttribute("aria-pressed") === "true"`, { ms: 15000, popis: "karta boxov označená" });
    await pauza(400);
    await overKartu(t, karta, { presne: !!pocet });
    return hodnotyBoxov(t);
  },

  /**
   * Popis vybranej farby v okne boxov (Michal 19. 10. 2026): 1 box -> bez farby popis skrytý -> klik na čiernu s béžovým
   * šitím (inak 4. vzorka) -> popis + kresba v tej farbe -> iná farba priamo v živom selecte (jQuery change, ako živý kód;
   * prednostne jednofarebná) -> popis aj kresba sa prepnú -> krížik (nový výber = živé „zrušiť“) -> popis skrytý.
   * Do košíka nič. -> { pred, bezova, zivy, poKriziku, kresba: [farba kresby po kliku, po živom selecte] }
   */
  async skusPopisFarby(t) {
    const karta = KARTA_BOXOV(1);
    const SEL = `${OKNO} .lcd1v-bx__farba-popis`;
    await otvorKrokNovy(t, "boxy", karta);
    await t.klikni(karta, { popis: "boxy 1" });
    await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
    await pauza(300);
    const idF = await t.idParametra("farbaBoxov");
    const SELECT = `${F} select[data-parameter-id="${idF}"]`;
    const r = { pred: await overPopisFarby(t, SEL, "farbaBoxov") };
    if (r.pred) throw new Error("popis farby pred výberom farby má byť skrytý: " + r.pred);
    const texty = await t.ev(`(function () { var s = document.querySelector('${SELECT}'); return Array.prototype.map.call(document.querySelectorAll(${JSON.stringify(OKNO + " .parameter-wrap.parameter-" + idF + " .option-button")}), function (b) { var o = Array.prototype.find.call(s.options, function (x) { return x.value === b.getAttribute("data-value"); }); return o ? o.text.normalize("NFC") : ""; }); })()`);
    const iBez = texty.findIndex((x) => /čiern.*šitia\s*:?\s*béžov/i.test(x));
    await t.klikni(`${OKNO} .parameter-wrap.parameter-${idF} .option-button`, { index: iBez > -1 ? iBez : Math.min(3, texty.length - 1), popis: "farba boxov čierna / béžové šitie" });
    await t.cakaj(`!!(document.querySelector('${SELECT}') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
    r.bezova = await overPopisFarby(t, SEL, "farbaBoxov");
    const kresba = () => t.ev(`(function () { var o = document.querySelector(${JSON.stringify(OKNO)}); return o ? o.getAttribute("data-lcd1v-farba") : null; })()`);
    const k1 = await kresba();
    // iná farba priamo v živom selecte (ako by ju zmenil živý kód / obnova z pamäte), prednostne bez šitia v názve
    const ina = await t.ev(`(function () { var s = document.querySelector('${SELECT}'); var o = Array.prototype.filter.call(s.options, function (x) { return x.value && x.value !== s.value; });
      var j = o.find(function (x) { return !/[šs]itia/i.test(x.text.normalize("NFC")); }) || o[0]; if (!j) return null;
      if (window.jQuery) window.jQuery(s).val(j.value).trigger("change"); else { s.value = j.value; s.dispatchEvent(new Event("change", { bubbles: true })); }
      return j.value; })()`);
    if (!ina) throw new Error("farba boxov: v selecte nie je druhá farba");
    await t.cakaj(`(document.querySelector('${SELECT}') || {}).value === ${JSON.stringify(ina)}`, { ms: 5000, popis: "iná farba boxov v živom selecte" });
    r.zivy = await overPopisFarby(t, SEL, "farbaBoxov");
    if (r.zivy === r.bezova) throw new Error("popis farby sa po zmene živého selectu nezmenil: " + r.zivy);
    await t.cakaj(`(function () { var o = document.querySelector(${JSON.stringify(OKNO)}); return !!o && o.getAttribute("data-lcd1v-farba") !== ${JSON.stringify(k1)}; })()`, { ms: 5000, popis: "kresba boxu v novej farbe po zmene živého selectu" });
    r.kresba = [k1, await kresba()];
    await t.klikni(`${OKNO} .lcd1v-bx__x`, { popis: "krížik okna boxov" });
    await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "okno boxov zavreté krížikom" });
    await pauza(900);
    r.poKriziku = await overPopisFarby(t, SEL, "farbaBoxov");
    return r;
  },

  /**
   * G10b (len nový vzhľad): karta počtu -> farba + veľkosť -> krížik BEZ potvrdenia.
   * -> { hodnoty: {farbaBoxov, box1, box2, boxSolo}, oznacena: číslo označenej karty počtu (0 = Nechcem) alebo null }
   */
  async zavriVyberKrizikom(t, { pocet = 1, farba = 0, velkost = "S", velkost2 } = {}) {
    const karta = KARTA_BOXOV(pocet);
    await otvorKrokNovy(t, "boxy", karta);
    await t.klikni(karta, { popis: "boxy " + pocet });
    await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
    await pauza(300);
    await vyplnOkno(t, { pocet, farba, velkost, velkost2 });
    await t.klikni(`${OKNO} .lcd1v-bx__x`, { popis: "krížik okna boxov" });
    await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "okno boxov zavreté krížikom" });
    await pauza(900);
    const oznacena = await t.ev(`(function () { var e = document.querySelector('${KB("boxy")} .lcd1v-kb__karta[aria-pressed="true"]'); var n = e ? Number(e.getAttribute("data-boxy")) : null; return n ? n : null; })()`);
    return { hodnoty: await hodnotyBoxov(t), oznacena, okno: await oknoOtvorene(t) };
  },
};
