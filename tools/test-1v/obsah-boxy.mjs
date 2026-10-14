// Obsah 1V typu „boxy“ (box do kufra 616) — mapa sekcií (web ↔ návrh boxy.html) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: T3.3 (admin-html/src/p1v-boxy/*, konfigurator1v/obsah-boxy.js, _lcd1v-obsah-boxy.scss, assets/img/1v/obsah/boxy-*).
// Spec: prieskum-vsetky/navrh-boxy.md §6. Pravidlá: docs/1v-obsah.md („Testy“, „Plugin skupiny“).
//
// test-1v-obsah.mjs pre kľúč obsahu „boxy“ spustí tento plugin (namiesto A–D, ktoré overujú obsah 598 s jeho počtami). Základ
// (korene, miesto, sekcie viditeľné a odhalené, čísla data-p1v-cislo dosadené, odkazy data-p1v-odkaz v tom istom vzore, sonda,
// konzola, vodorovný posun) overuje test sám pre každý kľúč; tu je to, čo je špecifické pre box:
//   - tabuľka cien .cenv (Samostatne / V sete / V sete pri dvoch boxoch × S M L XL) a karty veľkostí #velkosti: čísla sa porovnávajú
//     s NEZÁVISLÝM GET živých stránok (select 616 „Velikost 1. boxu“ + základ; jednovrstvové Diamond „Box solo“ a „1. box“), nie s kódom webu,
//   - silueta v skutočnom pomere (šírka obdĺžnika = 33/40/54/66 z viewBox 76 × 44), gradient z <defs> s id p1v-…,
//   - D3: o boxe nič o skladovosti ani o lehote dodania; zakázané slová; žiadna cena natvrdo v zdroji sekcií,
//   - karty „Doplňte kufor o rohož“ (odkazy v tom istom vzore, ceny zo živých stránok, celá karta je odkaz),
//   - 8 krokov „Osem vecí“, farby (9), časová os (4), FAQ (12, ceny v odpovediach), záver, okno fotiek, všetky obrázky boxy-* sa načítajú.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { KOREN, register, sestra, zivaStranka } from "./obsah-spolocne.mjs";

export const SKUPINA = "boxy";
export const NAVRH = "boxy.html";
/** skupiny A–D, ktorých kontroly platia aj pre tento obsah (bez zmeny): žiadne — počty a texty 598 tu neplatia */
export const zdielane = [];
export const sekcie = [
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Berete aj autokoberce" }] },
  { meno: "a-galeria", navrh: [{ sel: "#galeria" }] },
  { meno: "a-recenzie", navrh: [{ sel: "#recenzie" }] },
  { meno: "b-ocakavat", navrh: [{ sel: "#ocakavat" }] },
  { meno: "boxy-velkosti", navrh: [{ sel: "#velkosti" }, { sel: ".spat", za: "#velkosti" }] },
  { meno: "b-predapo", navrh: [{ sel: "#predapo" }] },
  { meno: "c-kam", navrh: [{ sel: "section.chapter", text: "Čo sa doň zmestí" }, { sel: ".spat", za: "#predapo" }] },
  { meno: "c-domov", navrh: [{ sel: "section.chapter", text: "Čo dostanete" }] },
  { meno: "c-casova-os", navrh: [{ sel: "section.chapter", text: "Od objednávky po doručenie" }, { sel: ".spat", za: "#tml" }] },
  { meno: "c-farby", navrh: [{ sel: "#farby" }] },
  { meno: "c-vzorky", navrh: [{ sel: "#vzorky" }] },
  { meno: "boxy-cross", navrh: [{ sel: "section.chapter", text: "Doplňte kufor o rohož" }] },
  { meno: "d-faq", navrh: [{ sel: "section.faqsec" }] },
  { meno: "d-koniec", navrh: [{ sel: "section.end" }] },
  { meno: "d-pomocne", navrh: [] },
];

/** Výraz v stránke: vzhľad obsahu podľa SKUTOČNÝCH vypočítaných štýlov (nie len počty prvkov) — kapitoly, zlaté nadpisy, tmavá karta ponuky,
 *  čitateľnosť tabuľky cien a sken kontrastu všetkého textu (text vs. skutočné pozadie vrátane predkov a prechodov). Chytí stav, keď sa
 *  pravidlá skupín A–D na koreň boxu nevzťahujú: tá istá štruktúra, ale biely text na krémovom podklade, čierne nadpisy, otvorené FAQ. */
const SKEN_VZHLADU = String.raw`(function () {
  var koren = document.querySelector(".p1v-miesto");
  function rgba(s) { var m = /rgba?\(([^)]+)\)/.exec(s || ""); if (!m) return [0, 0, 0, 0]; var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  function lum(c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
  function kontrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(h, d) { var a = h[3]; return [h[0] * a + d[0] * (1 - a), h[1] * a + d[1] * (1 - a), h[2] * a + d[2] * (1 - a)]; }
  // kandidáti na skutočné pozadie prvku ([r,g,b]); null = pod ním je obrázok (kontrast sa neráta)
  function pozadie(e) {
    if (!e || e === document) return [[255, 255, 255]];
    var cs = getComputedStyle(e), img = cs.backgroundImage, c = rgba(cs.backgroundColor), zaklad;
    if (c[3] >= 0.98) zaklad = [[c[0], c[1], c[2]]];
    else { var rodic = pozadie(e.parentElement); zaklad = rodic && (c[3] > 0.02 ? rodic.map(function (d) { return mix(c, d); }) : rodic); }
    if (img && img !== "none") {
      if (/url\(/.test(img)) return null;
      var st = (img.match(/rgba?\([^)]*\)/g) || []).map(rgba);
      if (st.length) {
        if (!zaklad && st.every(function (x) { return x[3] >= 0.98; })) return st.map(function (x) { return [x[0], x[1], x[2]]; });
        var pod = zaklad || pozadie(e.parentElement);
        if (!pod) return null;
        var out = []; st.forEach(function (x) { pod.forEach(function (d) { out.push(mix(x, d)); }); }); return out;
      }
    }
    return zaklad;
  }
  function cesta(e) { var o = []; for (var p = e; p && p !== koren && o.length < 3; p = p.parentElement) o.push(p.tagName.toLowerCase() + (typeof p.className === "string" && p.className.trim() ? "." + p.className.trim().split(/\s+/)[0] : "")); return o.reverse().join(" > "); }
  function sekcia(e) { var s = e.closest("[data-lcd-sekcia]"); return s ? s.getAttribute("data-lcd-sekcia") : "?"; }
  var res = { skontrolovane: 0, preskocene: 0, zle: [], nizke: 0, minKontrast: 99 };
  [].slice.call(koren.querySelectorAll("*")).forEach(function (e) {
    if (/^(SCRIPT|STYLE|SVG|IMG|PATH|BR|DEFS|LINEARGRADIENT|PATTERN|RECT|CIRCLE|USE|G|STOP|SYMBOL|TITLE)$/i.test(e.tagName)) return;
    var txt = ""; [].forEach.call(e.childNodes, function (n) { if (n.nodeType === 3) txt += n.nodeValue; });
    txt = txt.replace(/\s+/g, " ").trim();
    if (!txt || !/[A-Za-z0-9À-ſ]/.test(txt)) return; // ozdobné znaky (★, úvodzovky) bez písmen a číslic sa nečítajú
    var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
    var cs = getComputedStyle(e); if (cs.visibility === "hidden") return;
    var op = 1; for (var p = e; p && p !== koren.parentNode; p = p.parentElement) { var s = getComputedStyle(p); if (s.display === "none") return; op *= parseFloat(s.opacity); }
    if (op < 0.3) return;
    var tc = rgba(cs.webkitTextFillColor || cs.color); if (tc[3] < 0.05) return; // priehľadná výplň = zlatý prechod (kontroluje sa zvlášť)
    var bg = pozadie(e); if (!bg) { res.preskocene++; return; }
    var k = 99, najhorsie = null;
    bg.forEach(function (b) { var q = kontrast(mix(tc, b), b); if (q < k) { k = q; najhorsie = b; } });
    res.skontrolovane++;
    if (k < res.minKontrast) res.minKontrast = k;
    if (k < 4.5) res.nizke++;
    if (k < 3 && res.zle.length < 8) res.zle.push({ sek: sekcia(e), kde: cesta(e), txt: txt.slice(0, 30), k: Math.round(k * 100) / 100, text: cs.color, pozadie: "rgb(" + najhorsie.map(Math.round).join(",") + ")" });
  });
  // zlaté nadpisy: na svetlom podklade musí byť nadpis modulu zlatý prechod s priehľadnou výplňou (nie čierny)
  res.nadpisy = [].slice.call(koren.querySelectorAll(".chapter h2, .pinhead h2")).filter(function (h) { var r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map(function (h) {
    var cs = getComputedStyle(h), b = pozadie(h.parentElement), svetle = !!b && b.every(function (x) { return lum(x) > 0.35; });
    var st = (cs.backgroundImage.match(/rgba?\([^)]*\)/g) || []).map(rgba);
    var zlate = rgba(cs.webkitTextFillColor)[3] < 0.05 && /gradient/.test(cs.backgroundImage) && st.some(function (x) { return x[0] >= 130 && x[2] <= 110 && x[0] > x[2] + 60; });
    return { sek: sekcia(h), txt: h.textContent.trim().slice(0, 28), svetle: svetle, zlate: zlate, farba: cs.webkitTextFillColor };
  });
  // kapitoly: odsadenie návrhu clamp(38px, 4,8vw, 68px)
  var ocak = Math.min(68, Math.max(38, innerWidth * 0.048));
  res.kapitoly = [].slice.call(koren.querySelectorAll("section.chapter[data-lcd-kap], [data-lcd-kap] > section.chapter")).map(function (s) {
    var cs = getComputedStyle(s); return { sek: sekcia(s), hore: parseFloat(cs.paddingTop), dole: parseFloat(cs.paddingBottom) };
  }).map(function (x) { x.ok = Math.abs(x.hore - ocak) < 1.5 && Math.abs(x.dole - ocak) < 1.5; return x; });
  res.ocak = Math.round(ocak * 10) / 10;
  // tmavá karta ponuky a čitateľnosť tabuľky cien
  var ups = koren.querySelector('[data-lcd-sekcia="a-ponuka"] .ups'), bu = ups && pozadie(ups);
  res.ups = bu ? Math.max.apply(null, bu.map(lum)) : null;
  res.cenv = { min: 99, n: 0 };
  [].forEach.call(koren.querySelectorAll('[data-lcd-sekcia="a-ponuka"] .cenv .r > *'), function (c) {
    var b = pozadie(c), tc = rgba(getComputedStyle(c).color); if (!b) return;
    b.forEach(function (d) { var q = kontrast(mix(tc, d), d); if (q < res.cenv.min) res.cenv.min = q; }); res.cenv.n++;
  });
  res.cenv.min = Math.round(res.cenv.min * 100) / 100;
  return res;
})()`;

/** Výraz v stránke: šírka n znakov „ch“ v písme prvku el (sonda), porovnaná s jeho vypočítaným max-width. */
const LEDE_CH = String.raw`(function (sel, n) {
  var e = document.querySelector(sel); if (!e) return null;
  var q = document.createElement("span"); q.style.cssText = "position:absolute;visibility:hidden;height:0;width:" + n + "ch;"; e.appendChild(q);
  var w = q.getBoundingClientRect().width; e.removeChild(q);
  return { max: parseFloat(getComputedStyle(e).maxWidth), ocak: w, sirka: Math.round(e.getBoundingClientRect().width) };
})`;

const VEL = ["S", "M", "L", "XL"];
const SIRKA_CM = { S: 33, M: 40, L: 54, XL: 66 };
const nbsp = (s) => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const eur = (n) => (Number(n) > 0 || n === 0 ? String(Math.round(n)) + " €" : null);
const vel = (o) => ((/^(XL|S|M|L)\s*:/i.exec(o.text) || [])[1] || "").toUpperCase();
const vyber = (st, re) => st.selecty[Object.keys(st.selecty).find((k) => re.test(k))] || [];
const fp = (st, re, v) => (vyber(st, re).find((o) => vel(o) === v) || {}).fp;

/** Očakávané ceny z živých stránok (GET): samostatne = základ 616 + príplatok 1. boxu, v sete = jednovrstvové Diamond „Box solo“, dva boxy = „1. box“. */
async function ocakavane() {
  const reg = register();
  const box = await zivaStranka(sestra(reg, "boxy", null).url);
  const jedno = await zivaStranka(sestra(reg, "jedno", null).url);
  const kl = await zivaStranka(sestra(reg, "kufor-classic", null).url);
  const pr = await zivaStranka(sestra(reg, "kufor-premium", null).url);
  const kufor = vyber(jedno, /do\s+kufr/i);
  const setClassic = (kufor.find((o) => /dno/i.test(o.text) && !/bok/i.test(o.text)) || {}).fp;
  const setPremium = (kufor.find((o) => /bok/i.test(o.text)) || {}).fp;
  const o = { sam: {}, set: {}, set2: {}, reg, classic: kl.cena, premium: pr.cena, jedno: jedno.cena, setClassic, setPremium };
  for (const v of VEL) {
    o.sam[v] = eur(box.cena + fp(box, /\b1\.\s*box/i, v));
    o.set[v] = eur(fp(jedno, /box\s*solo/i, v));
    o.set2[v] = eur(fp(jedno, /\b1\.\s*box/i, v));
  }
  return o;
}

/** Zdroj sekcií (bez komentárov): žiadne ceny natvrdo, žiadne zakázané ani D3 tvrdenia, žiadny TODO-D3. */
function kontrolaZdroja() {
  const dir = join(KOREN, "admin-html/src/p1v-boxy");
  const subory = readdirSync(dir).filter((f) => /\.html$/.test(f));
  const text = (h) => h.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const surove = subory.map((f) => ({ f, h: readFileSync(join(dir, f), "utf8") }));
  const bezKom = (h) => h.replace(/<!--[\s\S]*?-->/g, "");
  const ceny = surove.flatMap(({ f, h }) => (text(h).match(/\d[\d  ]*\s?(€|&euro;|eur\b|Kč)/gi) || []).map((m) => f + ": " + m));
  const todo = surove.filter(({ h }) => /TODO-D3/.test(h)).map((x) => x.f);
  const zakazane = surove.flatMap(({ f, h }) => (text(h).match(/skladom|lehot[aeuy]|dodací|dodanie|dodania|\d+\s*[–-]\s*\d+\s*dní|na milimeter|vyrábame|(?<!jedno|dvoj)vrstv|dragonskin|elite\b|basic\b|fixačn|uchyten|comfort|kovov|štítok|zadarmo/gi) || []).map((m) => f + ": " + m));
  const zaruka = surove.filter(({ f }) => !/faq/.test(f)).reduce((n, { h }) => n + (text(h).match(/záruk/gi) || []).length, 0);
  const zarukaFaq = surove.filter(({ f }) => /faq/.test(f)).reduce((n, { h }) => n + (text(h).match(/záruk/gi) || []).length, 0);
  const idBezPredpony = surove.flatMap(({ f, h }) => (bezKom(h).match(/\sid="(?!p1v-)[^"]*"/g) || []).map((m) => f + ":" + m.trim()));
  // každý obrázok, na ktorý sekcie a CSS odkazujú (assets/img/…), je v repe (preklep v názve = prázdne miesto)
  const css = readFileSync(join(KOREN, "assets/css/_lcd1v-obsah-boxy.scss"), "utf8");
  const odkazy = [...new Set(surove.map(({ h }) => bezKom(h)).concat(css).flatMap((h) => [...h.matchAll(/\/assets\/img\/([^"')\s?]+\.(?:jpg|png|webp))/g)].map((m) => m[1])))];
  const chybajuce = odkazy.filter((r) => !existsSync(join(KOREN, "assets/img", r)));
  return { subory: subory.length, ceny, todo, zakazane, zaruka, zarukaFaq, idBezPredpony, odkazy: odkazy.length, chybajuce };
}

/** Kontroly s ?novy=vyvoj po vložení obsahu (raz na každú šírku). t = pomocník tools/test-1v/pomocnik.mjs + t.sekcia(meno), await t.je(meno). */
export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis, pozor) => out.push({ ok: !!podm, popis, pozor: !!pozor });
  const S = (m) => JSON.stringify(t.sekcia(m));
  // okno chatu Luxia (iframe tretej strany) sa na telefóne samo otvára cez stred obrazovky — pre klik ho skryjeme (len test)
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
  const posun = (sel, kam = "start") => t.ev(`(async function () { var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false;
    e.scrollIntoView({ block: ${JSON.stringify(kam)}, behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 900); }); return true; })()`);

  // ---------------------------------------------------------------- zdroj sekcií (D3, ceny natvrdo, TODO-D3)
  const z = kontrolaZdroja();
  ok(z.subory >= 15, `zdroj: ${z.subory} súborov v admin-html/src/p1v-boxy`);
  ok(!z.ceny.length, "zdroj: žiadna cena natvrdo v texte sekcií" + (z.ceny.length ? " — " + z.ceny.slice(0, 4).join(", ") : ""));
  ok(!z.todo.length, "zdroj: žiadny TODO-D3" + (z.todo.length ? " — " + z.todo.join(", ") : ""));
  ok(!z.zakazane.length, "zdroj: nič o skladovosti ani lehote dodania (D3) a žiadne zakázané slová" + (z.zakazane.length ? " — " + z.zakazane.slice(0, 4).join(", ") : ""));
  ok(z.zaruka === 0 && z.zarukaFaq === 2, `zdroj: slovo „záruk“ len vo vecnej otázke a odpovedi FAQ 12 (inde ${z.zaruka}×, vo FAQ ${z.zarukaFaq}×)`);
  ok(!z.chybajuce.length && z.odkazy >= 40, `zdroj: všetkých ${z.odkazy} obrázkov, na ktoré sekcie a CSS odkazujú, je v assets/img` + (z.chybajuce.length ? " — chýbajú: " + z.chybajuce.join(", ") : ""));
  ok(!z.idBezPredpony.length, "zdroj: každé id má predponu p1v-" + (z.idBezPredpony.length ? " — " + z.idBezPredpony.slice(0, 3).join(", ") : ""));

  // ---------------------------------------------------------------- všetky sekcie: viditeľné a odhalené
  for (const m of sekcie.map((x) => x.meno)) {
    if (m === "d-pomocne" || !(await t.je(m))) continue;
    const r = await t.ev(`(async function () {
      var s = document.querySelector(${S(m)}); s.scrollIntoView({ block: "start", behavior: "instant" });
      var t0 = Date.now(), vid, skryte; // SPEVNENIE-CAKANIA: čaká na odhalenie (max 8 s), nie fixných 1,1 s — pri zaťaženom stroji (iné testy) trvá dlhšie
      do { await new Promise(function (r) { setTimeout(r, 300); });
        vid = [].slice.call(s.querySelectorAll(".rv")).filter(function (x) { var b = x.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0; });
        skryte = vid.filter(function (x) { return getComputedStyle(x).opacity < 0.9; }).length;
      } while ((skryte > 0 || !s.classList.contains("p1v-rv")) && Date.now() - t0 < 8000);
      return { h: s.getBoundingClientRect().height, rv: s.classList.contains("p1v-rv"), skryte: skryte, vid: vid.length };
    })()`);
    ok(r.h > 120 && r.rv && r.skryte === 0, `${m}: viditeľná a odhalená (výška ${Math.round(r.h)} px, .p1v-rv ${r.rv}, .rv vo výreze skryté ${r.skryte}/${r.vid})`);
  }

  // ---------------------------------------------------------------- vzhľad podľa vypočítaných štýlov (nie len počty prvkov)
  {
    const v = await t.ev(SKEN_VZHLADU);
    const kapOk = v.kapitoly.filter((k) => k.ok).length;
    ok(v.kapitoly.length >= 6 && kapOk === v.kapitoly.length, `vzhľad: kapitoly majú odsadenie návrhu ${v.ocak} px (clamp 38–68 px) — ${kapOk}/${v.kapitoly.length}` + (kapOk < v.kapitoly.length ? " — zle: " + v.kapitoly.filter((k) => !k.ok).slice(0, 3).map((k) => `${k.sek} ${k.hore}/${k.dole}`).join(", ") : ""));
    const nadSv = v.nadpisy.filter((h) => h.svetle), nadZl = nadSv.filter((h) => h.zlate);
    ok(nadSv.length >= 5 && nadZl.length === nadSv.length, `vzhľad: nadpisy modulov na svetlom podklade sú zlaté (prechod, priehľadná výplň) — ${nadZl.length}/${nadSv.length}` + (nadZl.length < nadSv.length ? " — čierne/nezlaté: " + nadSv.filter((h) => !h.zlate).slice(0, 4).map((h) => `${h.sek} „${h.txt}“ ${h.farba}`).join(", ") : ""));
    ok(v.ups !== null && v.ups < 0.1, `vzhľad: karta ponuky (.ups) je tmavá (relatívna svetlosť ${v.ups == null ? "?" : v.ups.toFixed(3)} < 0,1)`);
    ok(v.cenv.n === 20 && v.cenv.min >= 4.5, `vzhľad: text v tabuľke cien je čitateľný (${v.cenv.n} buniek, najnižší kontrast ${v.cenv.min}:1, treba aspoň 4,5:1)`);
    ok(v.skontrolovane > 150 && !v.zle.length, `vzhľad: žiadny text nemá kontrast pod 3:1 voči skutočnému pozadiu (${v.skontrolovane} prvkov, ${v.preskocene} nad obrázkom preskočených, najnižší ${v.minKontrast.toFixed(2)}:1, pod 4,5:1 ${v.nizke}×)` + (v.zle.length ? " — " + v.zle.slice(0, 4).map((z) => `${z.sek} ${z.kde} „${z.txt}“ ${z.text} na ${z.pozadie} = ${z.k}:1`).join("; ") : ""));
  }

  // ---------------------------------------------------------------- ceny zo živých stránok
  const o = await ocakavane();

  // a-ponuka: tabuľka .cenv — 3 riadky × 4 veľkosti = čísla zo živých selectov (616 a jednovrstvové Diamond)
  if (await t.je("a-ponuka")) {
    await posun(t.sekcia("a-ponuka") + " .cenv", "center");
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("a-ponuka")}), tab = s.querySelector(".cenv"), riadky = [].slice.call(tab.querySelectorAll(".r"));
      var bunky = function (r) { return [].map.call(r.querySelectorAll('[role="cell"]'), function (c) { return { t: (c.textContent || "").replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(), vis: getComputedStyle(c).visibility, stav: c.getAttribute("data-p1v-stav") }; }); };
      var hl = [].map.call(riadky[0].querySelectorAll('[role="columnheader"]'), function (c) { return (c.textContent || "").trim(); });
      var cb = tab.getBoundingClientRect(), karta = s.querySelector(".ups").getBoundingClientRect();
      var link = s.querySelector("a.btn");
      return { rola: tab.getAttribute("role"), aria: tab.getAttribute("aria-label"), riadkov: riadky.length, hlavicka: hl, r1: bunky(riadky[1]), r2: bunky(riadky[2]), r3: bunky(riadky[3]),
        nazvy: riadky.slice(1).map(function (r) { return (r.querySelector('[role="rowheader"]') || {}).textContent; }),
        vKarte: cb.left >= karta.left - 1 && cb.right <= karta.right + 1, sirka: Math.round(cb.width),
        href: link && link.getAttribute("href"), text: link && link.textContent.trim(), cislaVisi: [].filter.call(tab.querySelectorAll("[data-p1v-cislo]"), function (c) { return getComputedStyle(c).visibility === "hidden"; }).length };
    })()`);
    const rad = (b) => b.map((x) => x.t);
    ok(r.rola === "table" && r.riadkov === 4 && r.hlavicka.join("|") === "Veľkosť|S|M|L|XL", `a-ponuka: tabuľka cien má hlavičku S M L XL a 3 riadky (role ${r.rola}, riadkov ${r.riadkov}, hlavička ${r.hlavicka.join("|")})`);
    ok(r.nazvy.join("|") === "Samostatne|V sete s autokobercami|V sete, pri dvoch boxoch (každý)", `a-ponuka: riadky tabuľky ${r.nazvy.join(" | ")}`);
    const cakam = (m) => VEL.map((v) => m[v]);
    ok(nbsp(rad(r.r1).join(",")) === nbsp(cakam(o.sam).join(",")), `a-ponuka: Samostatne ${rad(r.r1).join(" ")} = živé selecty 616 (${cakam(o.sam).join(" ")})`);
    ok(nbsp(rad(r.r2).join(",")) === nbsp(cakam(o.set).join(",")), `a-ponuka: V sete ${rad(r.r2).join(" ")} = jednovrstvové „Box solo“ (${cakam(o.set).join(" ")})`);
    ok(nbsp(rad(r.r3).join(",")) === nbsp(cakam(o.set2).join(",")), `a-ponuka: V sete pri dvoch boxoch ${rad(r.r3).join(" ")} = jednovrstvové „1. box“ (${cakam(o.set2).join(" ")})`);
    ok(r.r1.concat(r.r2, r.r3).every((c) => c.stav === "ok" && c.vis === "visible"), "a-ponuka: všetkých 12 buniek dosadených (stav ok) a viditeľných");
    ok(r.vKarte && r.sirka > 240, `a-ponuka: tabuľka sa zmestí do tmavej karty (šírka ${r.sirka} px)`);
    const jedno = o.reg.produkty && sestra(o.reg, "jedno", null);
    ok(jedno && String(r.href || "").split("#")[0] === jedno.cesta && /#product-detail-form$/.test(r.href || "") && r.text === "Zostavte si set", `a-ponuka: „Zostavte si set“ vedie na jednovrstvové a ich konfigurátor (${r.href})`);
  }

  // boxy-velkosti: 4 karty, silueta v skutočnom pomere, ceny rovnaké ako v tabuľke, tipy, výzva
  if (await t.je("boxy-velkosti")) {
    await posun(t.sekcia("boxy-velkosti") + " .vel4", "center");
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("boxy-velkosti")});
      var k = [].map.call(s.querySelectorAll(".vel4 .vc"), function (c) {
        var rects = c.querySelectorAll(".sil rect"), telo = rects[1], kr = telo && telo.getBoundingClientRect(), sv = c.querySelector(".sil").getBoundingClientRect();
        var b = c.querySelectorAll(".vc-r b");
        return { v: c.querySelector(".vc-s b").textContent.trim(), dim: c.querySelector(".vc-d").textContent.trim(), pouzitie: c.querySelector(".vc-p").textContent.trim(),
          w: telo ? +telo.getAttribute("width") : 0, vpx: kr ? kr.width : 0, svg: sv.width, fill: telo ? telo.getAttribute("fill") : "", fill2: rects[2] ? rects[2].getAttribute("fill") : "",
          sam: (b[0] || {}).textContent, set: (b[1] || {}).textContent, stavy: [].map.call(c.querySelectorAll("[data-p1v-cislo]"), function (x) { return x.getAttribute("data-p1v-stav") + "/" + getComputedStyle(x).visibility; }) };
      });
      var tipy = [].map.call(s.querySelectorAll(".vpoz .p"), function (p) { return p.querySelector("b").textContent.trim(); });
      var btn = s.querySelector(".spat .btn"), cw = document.documentElement.clientWidth, vel = s.querySelector(".vel4").getBoundingClientRect();
      var def = document.getElementById("p1v-bxg"), vz = document.getElementById("p1v-bxq");
      return { k: k, tipy: tipy, stlpcov: getComputedStyle(s.querySelector(".vel4")).gridTemplateColumns.split(" ").length, spat: btn ? btn.textContent.trim() : null,
        spatHref: btn ? btn.getAttribute("href") : null, vOkne: vel.left >= -1 && vel.right <= cw + 1, def: !!def && def.tagName.toLowerCase() === "lineargradient", pattern: !!vz,
        spatDisp: btn ? getComputedStyle(btn.parentNode).display : "", sir: s.querySelector(".lede").textContent.trim() };
    })()`);
    ok(r.k.map((c) => c.v).join(",") === "S,M,L,XL", `boxy-velkosti: 4 karty ${r.k.map((c) => c.v).join(" ")}`);
    ok(r.k.every((c) => c.dim === `${SIRKA_CM[c.v]} × 32 × 30 cm`), `boxy-velkosti: rozmery ${r.k.map((c) => c.dim).join(" | ")}`);
    ok(r.k.every((c) => c.w === SIRKA_CM[c.v]), `boxy-velkosti: silueta má šírku ${r.k.map((c) => c.w).join("/")} z 76 (33/40/54/66)`);
    ok(r.k.every((c) => Math.abs(c.vpx / c.svg - SIRKA_CM[c.v] / 76) < 0.01), `boxy-velkosti: silueta je vykreslená v skutočnom pomere (${r.k.map((c) => (c.vpx / c.svg * 76).toFixed(1)).join("/")} z 76)`);
    ok(r.def && r.pattern && r.k.every((c) => c.fill === "url(#p1v-bxg)" && c.fill2 === "url(#p1v-bxq)"), "boxy-velkosti: farebný prechod a prešívanie z <defs> s id p1v-bxg / p1v-bxq");
    ok(r.k.map((c) => nbsp(c.sam)).join(",") === VEL.map((v) => o.sam[v]).join(",") && r.k.map((c) => nbsp(c.set)).join(",") === VEL.map((v) => o.set[v]).join(","),
      `boxy-velkosti: ceny kariet Samostatne ${r.k.map((c) => nbsp(c.sam)).join(" ")} / V sete ${r.k.map((c) => nbsp(c.set)).join(" ")} = živé selecty`);
    ok(r.k.every((c) => c.stavy.length === 2 && c.stavy.every((s) => s === "ok/visible")), "boxy-velkosti: všetky čísla kariet dosadené a viditeľné");
    ok(r.tipy.join("|") === "Zmerajte šírku|Spočítajte šírky|Nechajte rezervu", `boxy-velkosti: 3 tipy (${r.tipy.join(" | ")})`);
    ok(r.stlpcov === (t.sirka > 900 ? 4 : 2), `boxy-velkosti: ${r.stlpcov} stĺpce kariet pri ${t.sirka} px (4 nad 900 px, inak 2)`);
    ok(r.vOkne, "boxy-velkosti: karty sú v okne");
    ok(r.spat === "Vyberte si box" && r.spatHref === "#product-detail-form" && r.spatDisp === "flex", `boxy-velkosti: výzva „${r.spat}“ na konfigurátor (rozloženie ${r.spatDisp})`);
  }

  // b-ocakavat: 8 krokov (nie 9 ako 598), náhľady s fotkami z CSS
  if (await t.je("b-ocakavat")) {
    const sek = t.sekcia("b-ocakavat");
    const mq = await t.ev(`matchMedia("(max-width:900px), (min-width:901px) and (max-width:1199px) and (orientation:portrait) and (hover:none) and (pointer:coarse)").matches`);
    await posun(sek, "start");
    const r = await t.ev(`(function () {
      var s = document.querySelector(${JSON.stringify(sek)});
      var th = [].map.call(s.querySelectorAll(".s2-thumbs button"), function (b) { return getComputedStyle(b, ":before").backgroundImage; });
      return { img: s.querySelectorAll(".s2-media img").length, rail: s.querySelectorAll(".s2-rail button").length, texty: s.querySelectorAll(".s2-t").length, nahl: th.length,
        fotky: th.map(function (x) { return (/boxy-ocakavat-(\\d)\\.jpg/.exec(x) || [])[1] || "-"; }).join(""), chips: s.querySelectorAll(".pintop .chip").length,
        stlpcov: getComputedStyle(s.querySelector(".s2-thumbs")).gridTemplateColumns.split(" ").length, nadpis: s.querySelector(".pinhead h2").textContent.trim(),
        stage: s.querySelector(".stage2").getBoundingClientRect().height, pin: getComputedStyle(s.querySelector(".pin2")).position };
    })()`);
    ok(r.img === 8 && r.rail === 8 && r.texty === 8 && r.nahl === 8, `b-ocakavat: 8 krokov (${r.img} fotiek, ${r.rail} bodiek, ${r.texty} textov, ${r.nahl} náhľadov)`);
    ok(r.nadpis === "Osem vecí, vďaka ktorým je v kufri poriadok" && r.chips === 7, `b-ocakavat: nadpis „${r.nadpis}“, ${r.chips} štítkov`);
    ok(r.fotky === "12345678", `b-ocakavat: náhľady majú fotky boxov z CSS (boxy-ocakavat-N: ${r.fotky})`);
    if (!mq) {
      const l = await t.ev(`${LEDE_CH}(${S("b-ocakavat")} + " .pinhead .lede", 70)`);
      ok(l && Math.abs(l.max - l.ocak) < 1.5, `b-ocakavat (PC): úvod má šírku návrhu 70 znakov (max-width ${l && Math.round(l.max)} px, očakávané ${l && Math.round(l.ocak)} px)`);
      ok(r.stlpcov === (t.sirka >= 1200 ? 8 : 4), `b-ocakavat (PC): náhľady v ${r.stlpcov} stĺpcoch`);
      ok(Math.abs(r.stage - 8 * 0.44 * (await t.ev("innerHeight"))) < 3 && r.pin === "sticky", `b-ocakavat (PC): scéna ${Math.round(r.stage)} px = 8 × 44 vh, prilepená (${r.pin})`);
      await t.ev(`(function () { var st = document.querySelector(${JSON.stringify(sek)} + " .stage2"), y = st.getBoundingClientRect().top + scrollY; scrollTo({ top: y + (st.offsetHeight - innerHeight) * 0.62, behavior: "instant" }); })()`);
      try { await t.cakaj(`(function () { var on = document.querySelector(${JSON.stringify(sek)} + " .s2-t.on"); return !!on && on.getAttribute("data-i") === "4"; })()`, { ms: 8000, popis: "krok 05 pri 62 % scény" }); } catch (e) { /* vyhodnotí sa nižšie */ }
      await t.pauza(700);
      const k = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), on = s.querySelector(".s2-t.on"), im = s.querySelector(".s2-media img.on");
        return { t: on && on.getAttribute("data-i"), i: im && im.getAttribute("data-i"), big: s.querySelector(".s2-big").textContent }; })()`);
      ok(k.t === "4" && k.i === "4" && k.big === "05", `b-ocakavat (PC): pri 62 % scény je krok 05 z 8 (text ${k.t}, fotka ${k.i}, číslo ${k.big})`);
      // scena-jeden-krok: v tom istom okamihu je viditeľný presne jeden text a jedna veľká fotka (nie všetky kroky cez seba)
      const j = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), v = function (x) { return parseFloat(getComputedStyle(x).opacity) > 0.1 && getComputedStyle(x).visibility !== "hidden"; };
        return { texty: [].filter.call(s.querySelectorAll(".s2-t"), v).length, fotky: [].filter.call(s.querySelectorAll(".s2-media img"), v).length, on: s.querySelectorAll(".s2-t.on").length }; })()`);
      ok(j.texty === 1 && j.fotky === 1 && j.on === 1, `b-ocakavat (PC): v jednom okamihu je vidieť jeden krok (viditeľných textov ${j.texty}, fotiek ${j.fotky}, s triedou .on ${j.on})`);
      if (process.env.LCD_BOXY_SNIMKY) await t.k.snimka(join(process.env.LCD_BOXY_SNIMKY, `scena-62-${t.sirka}.png`)).catch(() => {});
    } else {
      const m = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), p = s.querySelector(".pinmain"), im = [].map.call(s.querySelectorAll(".s2-media img"), function (i) { return Math.round(i.getBoundingClientRect().top); });
        return { posuv: p.scrollWidth > p.clientWidth + 50, riadok: new Set(im).size === 1, bodky: s.querySelectorAll(".s2-rail button").length, stage: s.querySelector(".stage2").style.height }; })()`);
      ok(m.posuv && m.riadok && m.bodky === 8 && !m.stage, `b-ocakavat (karusel): 8 kariet v posuvnom páse v jednom riadku (posuv ${m.posuv}, riadok ${m.riadok}, bodiek ${m.bodky})`);
    }
  }

  // b-predapo: fotky legendy boxov, žiadne počítadlo %
  if (await t.je("b-predapo")) {
    const sek = t.sekcia("b-predapo");
    await posun(sek + " .lx-pp-plocha", "center");
    const r = await t.ev(`(function () {
      var s = document.querySelector(${JSON.stringify(sek)}), sw = [].map.call(s.querySelectorAll(".lx-leg-sw"), function (e) { return (/boxy-pp-(\\d)\\.jpg/.exec(getComputedStyle(e).backgroundImage) || [])[1] || "-"; }).join("");
      var im = [].map.call(s.querySelectorAll(".lx-pp-plocha img"), function (i) { return { ok: i.complete && i.naturalWidth > 0, src: i.getAttribute("src").split("/").pop() }; });
      return { sw: sw, cislo: !!s.querySelector(".lx-pp-cislo"), pocet: !!s.querySelector(".lx-pocet"), leg: s.querySelectorAll(".lx-leg-r").length, im: im,
        chips: [].map.call(s.querySelectorAll(".lx-chips .chip"), function (c) { return c.textContent.trim(); }).join("|") };
    })()`);
    ok(r.sw === "1234", `b-predapo: vzorky legendy majú fotky boxov z CSS (boxy-pp-N: ${r.sw})`);
    ok(!r.cislo && !r.pocet, "b-predapo: bez počítadla %");
    ok(r.leg === 4 && r.chips === "Rovnaký kufor|Rovnaké veci|Rovnaký uhol|Jediný rozdiel: boxy", `b-predapo: 4 body legendy a štítky (${r.chips})`);
    ok(r.im.length === 2 && r.im.every((i) => i.ok) && r.im.map((i) => i.src).join(",") === "boxy-pred.jpg,boxy-po.jpg", `b-predapo: fotky pred a po sa načítali (${r.im.map((i) => i.src + (i.ok ? "" : " ✗")).join(", ")})`);
  }

  // c-casova-os: 4 kroky bez lehoty dodania (D3)
  if (await t.je("c-casova-os")) {
    await posun(t.sekcia("c-casova-os") + " .tml", "center");
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("c-casova-os")});
      return { kroky: s.querySelectorAll(".tml > li").length, tt: [].map.call(s.querySelectorAll(".tml .tt"), function (x) { return x.textContent.trim(); }).join("|"),
        lede: s.querySelector(".lede").textContent.trim(), text: s.textContent.replace(/\\s+/g, " ") };
    })()`);
    ok(r.kroky === 4, `c-casova-os: 4 kroky (${r.kroky})`);
    ok(!/skladom|lehot|dní|dodani|termín/i.test(r.text), `c-casova-os: o boxe nič o skladovosti ani o lehote dodania (D3); úvod „${r.lede}“, časové značky „${r.tt}“`);
  }

  // c-farby: 9 farieb boxu, klik na vzorku prepne veľkú fotku a názov
  if (await t.je("c-farby")) {
    const sek = t.sekcia("c-farby");
    await posun(sek + " .lx-farby-main", "center");
    const r0 = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return { vz: s.querySelectorAll(".lx-farby-vzorka").length, vel: s.querySelectorAll(".lx-farby-velka > img").length,
      meno: s.querySelector(".lx-farby-meno").textContent.trim(), stitok: s.querySelector(".lx-farby-stitok").textContent.replace(/\\s+/g, " ").trim(),
      mena: [].map.call(s.querySelectorAll(".lx-farby-vzorka"), function (b) { return b.getAttribute("aria-label").replace(", Diamond Line", ""); }).join("|"),
      viac: s.querySelector(".lx-farby-viac").getAttribute("href"), viacTxt: s.querySelector(".lx-farby-viac-txt").textContent.trim(), cta: s.querySelector(".lx-farby-akcie .btn").textContent.trim() }; })()`);
    ok(r0.vz === 9 && r0.vel === 9 && /01\s*\/\s*09/.test(r0.stitok), `c-farby: 9 vzoriek a 9 veľkých fotiek (${r0.vz}/${r0.vel}, štítok „${r0.stitok}“)`);
    ok(r0.mena === "Čierna · červené šitie|Čierna · modré šitie|Čierna · čierne šitie|Čierna · béžové šitie|Čierna · sivé šitie|Čierna · biele šitie|Hnedá káva|Vínovo červená|Šedá", `c-farby: názvy farieb ${r0.mena}`);
    ok(/vzorkovnik-dragonskin---objednavka-vzoriek\/$/.test(r0.viac) && r0.viacTxt === "Vzorky pošleme domov" && r0.cta === "Vyberte si box", `c-farby: odkaz „${r0.viacTxt}“ → ${r0.viac}, tlačidlo „${r0.cta}“`);
    await t.klikni(sek + " .lx-farby-vzorka", { index: 6, popis: "vzorka Hnedá káva", pockaj: 1400 });
    const r1 = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), on = s.querySelector(".lx-farby-velka > img.on");
      return { meno: s.querySelector(".lx-farby-meno").textContent.trim(), src: on ? (on.getAttribute("src") || "") : "", ok: !!on && on.complete && on.naturalWidth > 0, cislo: s.querySelector(".lx-farby-cislo").textContent.trim() }; })()`);
    ok(r1.meno === "Hnedá káva" && /boxy-farba-7\.jpg$/.test(r1.src) && r1.ok && r1.cislo === "07", `c-farby: klik na 7. vzorku → „${r1.meno}“, fotka ${r1.src.split("/").pop()} (načítaná ${r1.ok}, ${r1.cislo})`);
  }

  // boxy-cross: 3 karty, ceny zo živých stránok, celá karta je odkaz
  if (await t.je("boxy-cross")) {
    await posun(t.sekcia("boxy-cross") + " .cross", "center");
    const r = await t.ev(`(async function () {
      var s = document.querySelector(${S("boxy-cross")}), k = [];
      var karty = [].slice.call(s.querySelectorAll(".cross .cr"));
      for (var n = 0; n < karty.length; n++) {
        var c = karty[n];
        c.scrollIntoView({ block: "center", behavior: "instant" });
        await new Promise(function (r) { setTimeout(r, 250); });
        var im0 = c.querySelector("img"), t1 = Date.now();
        while (im0 && !(im0.complete && im0.naturalWidth > 0) && Date.now() - t1 < 8000) await new Promise(function (r) { setTimeout(r, 150); });
        var a = c.querySelector("h3 a"), b = c.querySelector(".cr-c b"), i = c.querySelector(".cr-c i"), rc = c.getBoundingClientRect();
        var bod = document.elementFromPoint(Math.round(rc.left + rc.width / 2), Math.round(Math.min(Math.max(rc.top + rc.height * 0.4, 2), innerHeight - 2)));
        k.push({ stitok: c.querySelector(".od").textContent.trim(), h3: a ? a.textContent.trim() : null, href: a ? a.getAttribute("href") : null, cena: b ? b.textContent : null, popis: i ? i.textContent : null,
          cela: !!bod && !!a && bod.closest("a") === a, img: (function () { var im = c.querySelector("img"); return im && im.complete && im.naturalWidth > 0; })(),
          stavy: [].map.call(c.querySelectorAll("[data-p1v-cislo]"), function (x) { return x.getAttribute("data-p1v-stav") + "/" + getComputedStyle(x).visibility; }).join(",") });
      }
      return { k: k, stlpcov: getComputedStyle(s.querySelector(".cross")).gridTemplateColumns.split(" ").length, h2: s.querySelector("h2").textContent.trim() };
    })()`);
    const reg = o.reg;
    const cesta = (typ) => (sestra(reg, typ, null) || {}).cesta;
    ok(r.h2 === "Doplňte kufor o rohož" && r.k.map((c) => c.stitok).join("|") === "Classic|Premium|Autokoberce", `boxy-cross: nadpis „${r.h2}“ a karty ${r.k.map((c) => c.stitok).join(" | ")}`);
    ok(r.k.map((c) => (c.href || "").split("#")[0]).join(",") === [cesta("kufor-classic"), cesta("kufor-premium"), cesta("jedno")].join(","), `boxy-cross: odkazy kariet ${r.k.map((c) => c.href).join(", ")}`);
    ok(nbsp(r.k[0].cena) === eur(o.classic) && nbsp(r.k[0].popis) === "v sete s autokobercami + " + eur(o.setClassic), `boxy-cross: Classic ${nbsp(r.k[0].cena)}, „${nbsp(r.k[0].popis)}“ = živé stránky (${eur(o.classic)}, + ${eur(o.setClassic)})`);
    ok(nbsp(r.k[1].cena) === eur(o.premium) && nbsp(r.k[1].popis) === "v sete s autokobercami + " + eur(o.setPremium), `boxy-cross: Premium ${nbsp(r.k[1].cena)}, „${nbsp(r.k[1].popis)}“ = živé stránky (${eur(o.premium)}, + ${eur(o.setPremium)})`);
    ok(nbsp(r.k[2].cena) === "od " + eur(o.jedno) && nbsp(r.k[2].popis) === "box v sete od " + o.set.S, `boxy-cross: Autokoberce „${nbsp(r.k[2].cena)}“, „${nbsp(r.k[2].popis)}“ = živé stránky (od ${eur(o.jedno)}, box v sete od ${o.set.S})`);
    ok(r.k.every((c) => c.stavy.split(",").every((s) => s === "ok/visible")), "boxy-cross: všetky čísla kariet dosadené a viditeľné");
    ok(r.k.every((c) => c.img), "boxy-cross: fotky kariet sa načítali");
    ok(r.k.every((c) => c.cela), "boxy-cross: klik kamkoľvek na kartu zasiahne jej odkaz (natiahnutý odkaz)");
    ok(r.stlpcov === (t.sirka > 820 ? 3 : 1), `boxy-cross: ${r.stlpcov} stĺpce pri ${t.sirka} px (3 nad 820 px, inak 1)`);
  }

  // d-faq: 12 otázok, ceny v odpovediach 2 a 8 zo živých dát, otázka 10 bez skladovosti (D3)
  if (await t.je("d-faq")) {
    const q = t.sekcia("d-faq") + " .p1v-faq-q";
    await posun(t.sekcia("d-faq"), "start");
    const r0 = await t.ev(`(function () { var s = document.querySelector(${S("d-faq")}), b = [].slice.call(s.querySelectorAll(".p1v-faq-q"));
      return { n: b.length, t: b.map(function (x) { return x.querySelector(".t").textContent.trim(); }), mail: [].map.call(s.querySelectorAll('a[href^="mailto:"]'), function (a) { return a.getAttribute("href"); }) }; })()`);
    // PRED prvým klikom: všetky odpovede zatvorené (nie viditeľné), otázky sú štýlované tlačidlá (nie holé <button>)
    const z0 = await t.ev(`(function () { var s = document.querySelector(${S("d-faq")}), b = [].slice.call(s.querySelectorAll(".p1v-faq-q"));
      return { otv: b.filter(function (x) { return x.getAttribute("aria-expanded") !== "false"; }).length,
        vidne: b.filter(function (x) { var a = x.nextElementSibling, cs = getComputedStyle(a); return cs.visibility !== "hidden" || a.getBoundingClientRect().height > 2; }).length,
        holy: b.filter(function (x) { var cs = getComputedStyle(x); return cs.display !== "flex" || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundColor !== "rgba(0, 0, 0, 0)"; }).length,
        riadok: b.length ? Math.round(b[0].getBoundingClientRect().height) : 0 }; })()`);
    ok(z0.otv === 0 && z0.vidne === 0, `d-faq: na začiatku sú všetky odpovede zatvorené (otvorených ${z0.otv}, viditeľných ${z0.vidne})`);
    ok(z0.holy === 0 && z0.riadok > 40 && z0.riadok < 120, `d-faq: otázky sú štýlované (bez rámika a podkladu, flex; holých ${z0.holy}, výška riadka ${z0.riadok} px)`);
    ok(r0.n === 12, `d-faq: 12 otázok (${r0.n})`);
    ok(r0.t[9] === "Koľko stojí poštovné?" && r0.t[11] === "Aká je záruka na box?", `d-faq: otázka 10 „${r0.t[9]}“ (bez „kedy box dostanem“, D3), 12 „${r0.t[11]}“`);
    ok(r0.mail.length === 2 && r0.mail.every((m) => m === "mailto:info@luxurycardesign.sk"), `d-faq: e-mail je odkaz mailto (${r0.mail.length}×)`);
    const odpoved = async (i) => {
      await t.klikni(q, { index: i, popis: "FAQ otázka " + (i + 1), pockaj: 700 });
      return t.ev(`(async function () { var b = document.querySelectorAll(${JSON.stringify(q)})[${i}], a = b.nextElementSibling, t0 = Date.now();
        while (b.getAttribute("aria-expanded") === "true" && a.getBoundingClientRect().height < 30 && Date.now() - t0 < 6000) await new Promise(function (r) { setTimeout(r, 150); });
        return { exp: b.getAttribute("aria-expanded"), h: Math.round(a.getBoundingClientRect().height), text: a.textContent.replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(),
          stavy: [].map.call(a.querySelectorAll("[data-p1v-cislo]"), function (x) { return x.getAttribute("data-p1v-stav"); }).join(",") }; })()`);
    };
    const a2 = await odpoved(1);
    ok(a2.exp === "true" && a2.h > 30 && a2.stavy === "ok,ok,ok,ok" && a2.text.includes(`S (33 × 32 × 30 cm) za ${o.sam.S}`) && a2.text.includes(`M (40 × 32 × 30 cm) za ${o.sam.M}`) && a2.text.includes(`L (54 × 32 × 30 cm) za ${o.sam.L}`) && a2.text.includes(`XL (66 × 32 × 30 cm) za ${o.sam.XL}`),
      `d-faq: odpoveď 2 má ceny ${VEL.map((v) => o.sam[v]).join(" / ")} zo živých dát („${a2.text.slice(0, 70)}…“)`);
    await odpoved(1);
    const a8 = await odpoved(7);
    ok(a8.exp === "true" && a8.stavy === "ok,ok,ok" && a8.text.includes(`veľkosť S od ${o.set.S}`) && a8.text.includes(`každý od ${o.set2.S}`) && a8.text.includes(`začína na ${o.sam.S}`),
      `d-faq: odpoveď 8 má ceny ${o.set.S} / ${o.set2.S} / ${o.sam.S} zo živých dát („${a8.text.slice(0, 70)}…“)`);
    await odpoved(7);
    const a10 = await odpoved(9);
    ok(a10.exp === "true" && /poštovné/i.test(a10.text) && !/skladom|kedy|lehot/i.test(a10.text), `d-faq: odpoveď 10 len o poštovnom, bez skladovosti („${a10.text}“)`);
    await odpoved(9);
  }

  // d-koniec: záver s cenami zo živých dát, tlačidlo recenzií posunie na recenzie
  if (await t.je("d-koniec")) {
    const sek = t.sekcia("d-koniec");
    await posun(sek, "center");
    const r = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), h = s.querySelector("h2");
      return { h2: h && h.textContent.trim(), farba: h && getComputedStyle(h).webkitTextFillColor, lede: s.querySelector(".lede").textContent.replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(),
        tl: [].map.call(s.querySelectorAll(".end-cta a"), function (a) { return a.textContent.trim(); }).join(" | "), bg: getComputedStyle(s.querySelector(".endbg")).backgroundImage,
        stavy: [].map.call(s.querySelectorAll("[data-p1v-cislo]"), function (x) { return x.getAttribute("data-p1v-stav") + "/" + getComputedStyle(x).visibility; }).join(",") }; })()`);
    ok(r.h2 === "Poriadok v kufri na jeden klik" && r.farba === "rgb(255, 255, 255)", `d-koniec: biely nadpis „${r.h2}“ (${r.farba})`);
    ok(r.lede === `Luxusný box do kufra v štyroch veľkostiach a deviatich farbách. Samostatne od ${o.sam.S}, v sete s autokobercami od ${o.set.S}.` && r.stavy === "ok/visible,ok/visible", `d-koniec: úvod s cenami zo živých dát („${r.lede}“)`);
    ok(r.tl === "Vyberte farbu a veľkosť | Pozrite si recenzie", `d-koniec: tlačidlá (${r.tl})`);
    const le = await t.ev(`${LEDE_CH}(${S("d-koniec")} + " .lede", 56)`);
    ok(le && Math.abs(le.max - le.ocak) < 1.5, `d-koniec: úvod má šírku návrhu 56 znakov (max-width ${le && Math.round(le.max)} px, očakávané ${le && Math.round(le.ocak)} px)`);
    ok(/boxy-end\.jpg/.test(r.bg), "d-koniec: ozdobné pozadie boxy-end.jpg po priblížení sekcie");
    const pred = await t.ev("location.href");
    await t.klikni(sek + " .end-cta a.ghost", { popis: "Pozrite si recenzie", pockaj: 1900 });
    const po = await t.ev(`(async function () { var r = document.getElementById("p1v-recenzie"); if (!r) return { chyba: "chýba #p1v-recenzie" };
      var t0 = Date.now(), pred = null, stoji = 0; // plynulý posun: počká na stabilnú polohu (max 8 s)
      while (stoji < 4 && Date.now() - t0 < 8000) { var y = Math.round(r.getBoundingClientRect().top); stoji = y === pred ? stoji + 1 : 0; pred = y; await new Promise(function (r) { setTimeout(r, 150); }); }
      var b = r.getBoundingClientRect();
      return { top: Math.round(b.top), vh: innerHeight, href: location.href }; })()`);
    ok(!po.chyba && po.top > -140 && po.top < 400, `d-koniec: „Pozrite si recenzie“ posunie na sekciu recenzií (vrch ${po.top} px)`);
    ok(po.href === pred, "d-koniec: klik nič neodoslal ani nezmenil adresu");
  }

  // okno fotiek: fotka galérie sa otvorí v #p1v-lb (sada 8), Escape zavrie
  if ((await t.je("a-galeria")) && (await t.je("d-pomocne"))) {
    const g = await t.ev(`(async function () {
      var s = document.querySelector(${S("a-galeria")}), b = s.querySelectorAll(".lx-gal-k:not(.lx-klon) .lx-gal-f")[0], lb = document.getElementById("p1v-lb");
      if (!lb) return { okno: false };
      b.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 300); });
      b.click(); await new Promise(function (r) { setTimeout(r, 500); });
      var im = lb.querySelector(".p1v-lb-ram img"), poc = (lb.querySelector(".p1v-lb-pod") || {}).textContent || "";
      var r = { okno: true, otv: !lb.hidden, src: im ? im.getAttribute("src") : "", poc: poc.replace(/\\s+/g, " ").trim(), fotky: s.querySelectorAll(".lx-gal-k:not(.lx-klon)").length, klony: s.querySelectorAll(".lx-gal-k.lx-klon").length,
        pocet: s.querySelector(".lx-gal-pocet").textContent.replace(/\\s+/g, " ").trim() };
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await new Promise(function (r) { setTimeout(r, 400); });
      r.zatv = lb.hidden;
      return r;
    })()`);
    ok(g.fotky === 8 && g.klony === 8 && /08/.test(g.pocet), `a-galeria: 8 fotiek + 8 kópií pre pás, počítadlo „${g.pocet}“`);
    ok(g.okno && g.otv && /boxy-galeria-1\.jpg$/.test(g.src) && /1\s*\/\s*8/.test(g.poc) && g.zatv, `a-galeria: klik na fotku ju otvorí v okne #p1v-lb (${g.src.split("/").pop()}, „${g.poc}“), Escape zavrie`);
  }

  // a-recenzie: živé dáta, karty (rovnaké ako 598) a id pre odkaz v závere
  if (await t.je("a-recenzie")) {
    try { await t.cakaj(`document.querySelector(${S("a-recenzie")}).classList.contains("p1v-rev-ok") || document.querySelector(${S("a-recenzie")}).classList.contains("p1v-rev-bez")`, { ms: 32000, popis: "recenzie: dáta LCD_REVIEWS" }); } catch (e) { /* vyhodnotí sa nižšie */ }
    const r = await t.ev(`(function () { var s = document.querySelector(${S("a-recenzie")}); return { ok: s.classList.contains("p1v-rev-ok"), karty: s.querySelectorAll(".revs .rev").length, id: s.id,
      skore: s.querySelector(".score").textContent.trim() }; })()`);
    ok(r.ok && r.karty >= 6 && r.id === "p1v-recenzie", `a-recenzie: vykreslená zo živých dát (${r.karty} kariet, skóre ${r.skore}, id ${r.id})`);
  }

  // všetky obrázky obsahu boxu (boxy-*) sa načítajú — preklep v názve súboru by ukázal prázdne miesto
  await t.ev(`(async function () { var m = document.querySelector(".p1v-miesto"); var y = m.getBoundingClientRect().top + scrollY, h = m.offsetHeight;
    for (var p = y; p < y + h; p += Math.round(innerHeight * 0.7)) { scrollTo({ top: p, behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 120); }); } })()`);
  await t.pauza(1500);
  const im = await t.ev(`(function () { var v = [].slice.call(document.querySelectorAll(".p1v-miesto img")), zle = [];
    v.forEach(function (i) { var s = i.getAttribute("src"); if (!s) return; if (i.complete && i.naturalWidth === 0) zle.push(s.split("/").pop()); });
    return { n: v.length, boxy: v.filter(function (i) { return /boxy-/.test(i.getAttribute("src") || ""); }).length, zle: zle, bezAlt: v.filter(function (i) { return !i.hasAttribute("alt"); }).length }; })()`);
  ok(im.zle.length === 0 && im.boxy >= 28, `obrázky: ${im.boxy} obrázkov boxy-* a ${im.n - im.boxy} ďalších, žiadny nie je rozbitý (rozbité: ${im.zle.join(", ") || "žiadne"})`);
  ok(im.bezAlt === 0, `obrázky: každý <img> má atribút alt (${im.bezAlt} bez)`);

  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.removeProperty("visibility"); })`);
  await t.ev(`window.scrollTo({ top: 0, behavior: "instant" })`);
  await t.k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 }).catch(() => {});
  return out;
}
