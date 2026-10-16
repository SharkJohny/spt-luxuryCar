// Obsah 1V typu „dvoj“ (dvojvrstvové 601/604/607) — mapa sekcií (web ↔ návrh dvojvrstvove.html) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: T1.3. Pravidlá: docs/1v-obsah.md („Testy“). Spec: prieskum-vsetky/navrh-dvojvrstvove.md §5–8.
//
// Obsah dvojvrstvových = obsah 598 s inými textami a fotkami + nové komponenty (porovnanie .vs2, 6. doska materiálu, položka „Druhá vrstva“,
// 4 vzorky farieb; FAQ = živé FAQ z /faq/ doslovne ako pri 598 — rozhodnutie Michala 14. 10. 2026, overuje ho skupina D). Preto plugin NESPÚŠŤA skupiny A–D cez `zdielane` (ich kontroly majú čísla 598: 12 otázok, 9 vzoriek,
// text „vrstv“ zakázaný…), ale volá ich kontroly sám a vyradí tie, ktoré pre dvojvrstvové neplatia (zoznam VYRADIT) — a nahradí ich vlastnými.
// Základ (korene, miesto, sekcie viditeľné a odhalené, čísla data-p1v-cislo dosadené, odkazy data-p1v-odkaz v tom istom vzore, sonda, konzola,
// vodorovný posun) overuje test-1v-obsah.mjs sám pre každý kľúč.
//   sekcie[].meno  = data-lcd-sekcia obalu sekcie v admin-html/src/p1v-dvoj/NN-*.sk.html
//   sekcie[].navrh = ako nájsť to isté v návrhu dvojvrstvove.html: [{ sel, text?, za?, pred? }] (snímka = spoločný obdĺžnik)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as skA from "./obsah-a.mjs";
import * as skB from "./obsah-b.mjs";
import * as skC from "./obsah-c.mjs";
import * as skD from "./obsah-d.mjs";

export const SKUPINA = "dvoj";
export const NAVRH = "dvojvrstvove.html";
/** skupiny A–D sa volajú priamo v kontroly() (s vyradením neplatných kontrol), nie cez zdielane */
export const zdielane = [];
// poradie A od 15. 10. 2026 (Michal): recenzie prvé pod konfigurátorom, porovnanie za galériou (kontrola „poradie A“ v obsah-a.mjs)
export const sekcie = [
  { meno: "a-recenzie", navrh: [{ sel: "#recenzie" }] },
  { meno: "a-referencie", navrh: [{ sel: "#referencie" }] },
  { meno: "a-galeria", navrh: [{ sel: "#galeria" }] },
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Jednovrstvové alebo dvojvrstvové" }] },
  { meno: "b-ocakavat", navrh: [{ sel: "#ocakavat" }, { sel: "#s2Mob" }] },
  { meno: "b-material", navrh: [{ sel: "#material" }] },
  { meno: "b-porovnanie", navrh: [{ sel: "#porovnanie" }, { sel: ".spat", za: "#porovnanie" }] },
  { meno: "c-kam", navrh: [{ sel: "section.chapter", text: "Kam všade koberce siahajú" }, { sel: '.kap[data-k="2"] .spat' }] },
  { meno: "c-domov", navrh: [{ sel: "section.chapter", text: "Čo Vám príde domov" }] },
  { meno: "c-casova-os", navrh: [{ sel: "section.chapter", text: "Od objednávky po doručenie" }, { sel: ".spat", pred: "#farby" }] },
  { meno: "c-farby", navrh: [{ sel: "#farby" }] },
  { meno: "c-vzorky", navrh: [{ sel: "#vzorky" }] },
  { meno: "d-realita", navrh: [{ sel: "#realita" }] },
  { meno: "d-faq", navrh: [{ sel: "section.faqsec" }] },
  { meno: "d-koniec", navrh: [{ sel: "section.end" }] },
  { meno: "d-pomocne", navrh: [] },
];

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CDN_OBSAH = "assets/img/1v/obsah/";
/** očakávané živé hodnoty (plan.md §1, GET 13. 10. 2026): cena dvojvrstvového od, počet farieb 1. vrstvy, cena jednovrstvového toho vzoru od.
 *  Zmena ceny / farieb v admine = tieto čísla v teste treba aktualizovať (kontrola je vtedy správne červená). */
const OCAKAVANE = {
  601: { dvoj: 351, jedno: 219, farby: "18 farieb", farby2: "16 farieb", vzor: "Diamond Line" },
  604: { dvoj: 362, jedno: 230, farby: "3 farby", farby2: "16 farieb", vzor: "Hexa Line" },
  607: { dvoj: 362, jedno: 230, farby: "8 farieb", farby2: "16 farieb", vzor: "Stripe Line" },
};
const eur = (n) => String(n) + " €";
const norm = (s) => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/** kontroly A–D, ktoré platia pre obsah 598 a pre dvojvrstvové NIE (číslo / znenie iné) — nahradené vlastnými nižšie */
const VYRADIT = [
  /^a-ponuka: (žiadna cena|fotka)/,                        // dvojvrstvové: v tabuľke sú ceny (dosadené z živých dát), fotka sa overuje nižšie; „bez tlačidla“ z A platí
  /^b-porovnanie: naša cena/,                              // cena cez data-p1v-cislo „od 362 €“, nie .p1v-b-od „od €362“
  /náhľad 09 má fotku z CSS/,                              // náhľady Deväť vecí majú fotky dvojvrstvových
  /^texty C bez zakázaných formulácií/,                    // regulárny výraz C zakazuje „vrstv“ (dvojvrstvové sú o vrstvách) a „€“ — nahradené kontrolou nižšie
  /^farby: klik na 2\. vzorku prepol/,                     // 598 má 9 vzoriek (2. = Čierna · modré šitie), dvojvrstvové 4
  /^koniec: ozdobné pozadie \(hero\.jpg/,                  // pozadie záveru dvojvrstvových = dvoj-koniec.jpg
  /^CSS _lcd1v-obsah-c\.scss/,                             // statická kontrola súboru skupiny C (jej vlastník ju overuje v teste 598)
];

/** selektory partialu, ktoré nezačínajú body.lcd-1v (komentáre preč, @media rozbalené) */
function zleSelektory(subor) {
  const css = readFileSync(join(KOREN, subor), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const zle = [];
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const s = m[1].trim();
    if (!s || s.startsWith("@media") || s.startsWith("@supports")) continue;
    if (s.startsWith("@")) { zle.push(s.slice(0, 40)); continue; }
    let h = 0, kus = "";
    const kusy = [];
    for (const ch of s) { if (ch === "(") h++; if (ch === ")") h--; if (ch === "," && !h) { kusy.push(kus); kus = ""; } else kus += ch; }
    kusy.push(kus);
    kusy.map((x) => x.trim()).filter((x) => !/^body\.lcd-1v[\s.:[]/.test(x)).forEach((x) => zle.push(x.slice(0, 60)));
  }
  return zle;
}

export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis, pozor) => out.push({ ok: !!podm, popis, ...(pozor ? { pozor: true } : {}) });
  const S = (m) => `.p1v-miesto ${t.sekcia(m)}`;
  const J = JSON.stringify;
  const id = t.produkt && t.produkt.id;
  const ocak = OCAKAVANE[id];
  const sir = t.sirka;

  // ---------------------------------------------------------------- statické: CSS partial a texty
  const zle = zleSelektory("assets/css/_lcd1v-obsah-dvoj.scss");
  ok(!zle.length, "CSS _lcd1v-obsah-dvoj.scss: každý selektor pod body.lcd-1v" + (zle.length ? " — zlé: " + zle.join(" | ") : ""));

  // ---------------------------------------------------------------- kontroly A–D, ktoré platia aj pre dvojvrstvové
  for (const [meno, g] of [["A", skA], ["B", skB], ["C", skC], ["D", skD]]) {
    let r = [];
    try { r = (await g.kontroly(t)) || []; } catch (e) { r = [{ ok: false, popis: `skupina ${meno} (kontroly 598 pre dvojvrstvové): výnimka ${e && e.message ? e.message : e}` }]; }
    out.push(...r.filter((x) => !VYRADIT.some((re) => re.test(x.popis))));
  }
  await t.ev(`window.scrollTo({ top: 0, behavior: "instant" })`);

  // ---------------------------------------------------------------- všetky sekcie dvojvrstvových sú na stránke (a-… b-… c-… d-…; b-predapo NIE)
  for (const s of sekcie) ok(await t.je(s.meno), `sekcia ${s.meno} je na stránke`);
  ok(!(await t.je("b-predapo")), "b-predapo (Pred a po) v dvojvrstvových nie je (návrh ju nemá)");

  // ---------------------------------------------------------------- texty: zakázané formulácie (docs/1v-obsah.md bod 4), cena nikdy natvrdo
  // FAQ (d-faq) = živý text z /faq/ doslovne (rozhodnutie Michala 14. 10. 2026; skupina D ho porovnáva so živým) — pravidlá nových textov nie
  const text = await t.ev(`(function () { var m = document.querySelector(".p1v-miesto");
    return [].filter.call(m.querySelectorAll("[data-lcd-sekcia]"), function (e) { return e.getAttribute("data-lcd-sekcia") !== "d-faq"; })
      .map(function (e) { return e.textContent; }).join(" \\n "); })()`);
  const ZAKAZ = /na\s+milimeter|vyr[aá]bame|dragon\s*skin|\belite\b|\bbasic\b|comfort|fixa[čc]n|upevnen|nezasahuj[ée]\s+do\s+fixa/i;
  const zakaz = text.match(new RegExp(ZAKAZ.source, "gi"));
  ok(!zakaz, "texty dvojvrstvových bez zakázaných formulácií (milimeter, vyrábame, DragonSkin/Elite/Basic, Comfort, fixačné body)" + (zakaz ? ": " + zakaz.join(", ") : ""));
  // počet vrstiev materiálu ako argument: číslo / číslovka pred „vrstv“ (okrem názvu typu „Dve vrstvy, každá s vlastnou úlohou“ a „dvojvrstvov…“)
  const pocet = (text.replace(/Dve vrstvy, každá s vlastnou úlohou/g, "").match(/(\b\d+|päť|piatich|šesť|šiestich|\btri|\bštyri)[\s-]*vrstv/gi) || []);
  ok(!pocet.length, "texty dvojvrstvových bez počtu vrstiev materiálu" + (pocet.length ? ": " + pocet.join(", ") : ""));
  const zaruka = await t.ev(`(function () { var m = document.querySelector(".p1v-miesto"), n = { faq: 0, inde: 0 };
    [].forEach.call(m.querySelectorAll("[data-lcd-sekcia]"), function (e) { var c = (e.textContent.match(/z[aá]ruk/gi) || []).length; if (e.getAttribute("data-lcd-sekcia") === "d-faq") n.faq += c; else n.inde += c; }); return n; })()`);
  ok(zaruka.inde === 0, `záruka sa mimo FAQ nespomína (inde ${zaruka.inde}×; FAQ ${zaruka.faq}× = živý text), nie je argument`);

  // ---------------------------------------------------------------- a-ponuka: tabuľka .vs2 + ceny z živých dát, BEZ tlačidla na jednovrstvové (15. 10. 2026)
  if (await t.je("a-ponuka")) {
    await t.ev(`document.querySelector(${J(S("a-ponuka"))}).scrollIntoView({ block: "center", behavior: "instant" })`);
    await t.pauza(500);
    const r = await t.ev(`(function () {
      var s = document.querySelector(${J(S("a-ponuka"))}), v = s.querySelector(".vs2"), c = v ? [].slice.call(v.children) : [];
      var a = s.querySelector("a.btn"), im = s.querySelector("img"), cs = v ? getComputedStyle(v) : null;
      return { n: c.length, hlavicka: c.slice(0, 3).map(function (x) { return x.textContent.trim(); }), riadky: [3, 6, 9, 12].map(function (i) { return c[i] ? c[i].textContent.trim() : null; }),
        bunky: c.slice(13).map(function (x) { return x.textContent.replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(); }),
        stavy: c.slice(13).map(function (x) { return x.getAttribute("data-p1v-stav"); }), vis: c.slice(13).map(function (x) { return getComputedStyle(x).visibility; }),
        stlpce: cs ? cs.gridTemplateColumns.split(" ").length : 0, vyskaH: c[0] ? Math.round(c[0].getBoundingClientRect().height) : 0, sirkaTab: v ? Math.round(v.getBoundingClientRect().width) : 0,
        href: a && a.getAttribute("href"), znacka: a && a.getAttribute("data-p1v-odkaz"), img: !!im && im.complete && im.naturalWidth > 0,
        kroky: [].map.call(s.querySelectorAll("li"), function (x) { return x.textContent; }).length };
    })()`);
    ok(r.n === 15 && r.stlpce === 3 && r.sirkaTab > 200, `a-ponuka: tabuľka .vs2 má 15 buniek v 3 stĺpcoch (${r.n}, ${r.stlpce}), šírka ${r.sirkaTab} px`);
    ok(r.hlavicka[1] === "Jednovrstvové" && r.hlavicka[2] === "Dvojvrstvové" && r.riadky.join("|") === "Kedy|Voda, sneh, blato|Čistenie|Cena", `a-ponuka: hlavička a riadky tabuľky (${r.hlavicka.join("/")} · ${r.riadky.join("/")})`);
    ok(r.stavy.every((x) => x === "ok") && r.vis.every((x) => x === "visible"), `a-ponuka: ceny v tabuľke dosadené zo živých dát (${r.bunky.join(" | ")}; stav ${r.stavy.join("/")})`);
    if (ocak) {
      ok(r.bunky[1] === norm(`od ${eur(ocak.dvoj)}`) && r.bunky[0] === norm(`od ${eur(ocak.jedno)}`),
        `a-ponuka: ${id} má v tabuľke jednovrstvové „od ${ocak.jedno} €“ a dvojvrstvové „od ${ocak.dvoj} €“ (je ${r.bunky.join(" | ")})`);
    }
    ok(!r.href && !r.znacka, `a-ponuka: porovnanie bez tlačidla „Pozrite si jednovrstvové“ — zákazník ostáva na dvojvrstvových (${r.href || "žiadne"})`);
    ok(r.img, "a-ponuka: fotka sa načítala");
  }

  // ---------------------------------------------------------------- b-ocakavat: náhľady krokov majú fotky dvojvrstvových, bod 8 má počty z živých dát
  if (await t.je("b-ocakavat")) {
    const th = await t.ev(`(function () { var b = document.querySelectorAll(${J(S("b-ocakavat") + " .s2-thumbs button")}); return [].map.call(b, function (x) { return getComputedStyle(x, ":before").backgroundImage; }); })()`);
    ok(th.length === 9 && th[0].includes("dvoj-ocakavat-celorocne.jpg") && th[4].includes("dvoj-ocakavat-pravost.jpg") && th[8].includes("dvoj-ocakavat-treti-rad.jpg") && th[3].includes("lcd-home/f01.jpg"),
      `b-ocakavat: 9 náhľadov krokov s fotkami dvojvrstvových z CSS (${th.map((x) => (/\/([^/"')]+)["')]*$/.exec(x) || [])[1]).join(", ")})`);
    const ch = await t.ev(`(function () { var s = document.querySelector(${J(S("b-ocakavat"))}); return { chips: [].map.call(s.querySelectorAll(".chip"), function (x) { return x.textContent.replace(/\\u00a0/g, " ").trim(); }),
      farba: s.querySelectorAll(".s2-t")[7].textContent.replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(), kicker: [].map.call(s.querySelectorAll(".s2-t .k"), function (x) { return x.textContent; }),
      stav: [].map.call(s.querySelectorAll("[data-p1v-cislo]"), function (x) { return x.getAttribute("data-p1v-stav"); }) }; })()`);
    ok(ch.chips.length === 9 && ch.chips[1] === "Celoročné" && ch.chips[7] === "Dve farby, jeden celok", `b-ocakavat: 9 štítkov dvojvrstvových (${ch.chips.length}: ${ch.chips.join(" · ")})`);
    ok(ch.kicker.join(",") === "Celý rok,Druhá vrstva,Údržba,Presnosť,Pravosť,Krytie,Montáž,Farba,Tretí rad", `b-ocakavat: 9 bodov v poradí návrhu (${ch.kicker.join(", ")})`);
    if (ocak) ok(ch.farba.includes(`Prvá prešívaná vrstva: ${ocak.farby} na výber.`) && ch.farba.includes(`jednu zo ${ocak.farby2} druhej vrstvy`),
      `b-ocakavat: bod 8 má počty farieb z živých dát (${ocak.farby} / ${ocak.farby2}): „${ch.farba}“`);
    ok(ch.stav.every((x) => x === "ok"), `b-ocakavat: čísla v bode 8 dosadené (${ch.stav.join("/")})`);
  }

  // ---------------------------------------------------------------- b-material: 6 dosiek, farby hrán, vzorky v legende, medzera podľa počtu
  if (await t.je("b-material")) {
    const sek = S("b-material");
    await t.ev(`(function () { var e = document.querySelector(${J(sek + " .exp")}); e.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
    await t.pauza(900);
    const m = await t.ev(`(function () { var s = document.querySelector(${J(sek)}), b = [].slice.call(s.querySelectorAll(".mbox")), l = [].slice.call(s.querySelectorAll(".leg"));
      var stat = matchMedia("(max-width:900px), (min-width:901px) and (max-width:1199px) and (orientation:portrait) and (hover:none) and (pointer:coarse)").matches;
      return { dosky: b.length, legenda: l.length, hot: s.querySelectorAll(".exp .hot").length, statika: stat,
        cf0: getComputedStyle(b[0]).getPropertyValue("--cf").trim(), cf1: getComputedStyle(b[1]).getPropertyValue("--cf").trim(),
        sw0: getComputedStyle(l[0].querySelector(".sw")).backgroundImage, sw5: getComputedStyle(l[5].querySelector(".sw")).backgroundImage,
        meno0: l[0].querySelector(".k").textContent, menaVsetky: l.map(function (x) { return x.querySelector(".k").textContent; }),
        img0: b[0].querySelector("img").getAttribute("src"), imgOk: b.map(function (x) { return x.querySelector("img").complete && x.querySelector("img").naturalWidth > 0; }),
        h2: s.querySelector("h2").textContent, z: b.map(function (x) { return (/translateZ\\(([-\\d.]+)px\\)/.exec(x.style.transform) || [])[1]; }),
        t: b.map(function (x) { return parseFloat(getComputedStyle(x).getPropertyValue("--t")); }), pw: parseFloat(getComputedStyle(b[0]).getPropertyValue("--pw")) }; })()`);
    ok(m.dosky === 6 && m.legenda === 6 && m.hot === 6, `b-material: 6 dosiek, 6 riadkov legendy, 6 bodov (${m.dosky}/${m.legenda}/${m.hot})`);
    ok(m.h2 === "Dve vrstvy, každá s vlastnou úlohou" && m.meno0 === "Odnímateľná druhá vrstva", `b-material: nadpis „${m.h2}“, 1. riadok legendy „${m.meno0}“`);
    ok(m.cf0 === "rgb(40,44,56)" && m.cf1 === "rgb(50,51,63)", `b-material: farby hrán 6 dosiek z CSS dvojvrstvových (1. ${m.cf0}, 2. ${m.cf1})`);
    ok(/dvoj-material-vzorka-lux10\.jpg/.test(m.sw0) && /lcd-home\/tex1\.jpg/.test(m.sw5), `b-material: vzorky legendy z CSS (1. dvoj-material-vzorka-lux10, 6. tex1)`);
    ok(m.imgOk.every(Boolean), `b-material: fotky všetkých dosiek načítané (${m.imgOk.map((x) => (x ? "✓" : "✗")).join("")})`);
    // rozloženie: na PC otvoriť rez posunom scény, na telefóne tlačidlom; medzera dosiek = pw·0,58·min(1, 4/(n−1)) = 0,8 · pw · 0,58 pri 6 doskách
    if (!m.statika) {
      await t.ev(`(function () { var st = document.querySelector(${J(sek + " .stage")}), r = st.getBoundingClientRect(); scrollTo({ top: r.top + scrollY + 0.5 * Math.max(0, r.height - innerHeight), behavior: "instant" }); })()`);
    } else {
      await t.ev(`(function () { var b = document.querySelector(${J(sek + " .mat-toggle")}); if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
    }
    // rez sa rozloží na scroll / po 500 ms pri zobrazení — pri pomalom stroji počkať (do 8 s), nie fixná pauza
    let otvoreny = await t.cakaj(`document.querySelector(${J(sek + " .exp")}).classList.contains("open")`, { ms: m.statika ? 2500 : 8000, popis: "rez materiálu rozložený" }).catch(() => false);
    if (!otvoreny && m.statika) { await t.klikni(sek + " .mat-toggle", { popis: "Rozložiť materiál", pockaj: 600 }); otvoreny = await t.ev(`document.querySelector(${J(sek + " .exp")}).classList.contains("open")`); }
    const z = await t.ev(`(function () { var b = [].slice.call(document.querySelectorAll(${J(sek + " .mbox")}));
      return { z: b.map(function (x) { return parseFloat((/translateZ\\(([-\\d.]+)px\\)/.exec(x.style.transform) || [])[1]); }), t: b.map(function (x) { return parseFloat(x.style.getPropertyValue("--t")); }), pw: parseFloat(b[0].style.getPropertyValue("--pw")) }; })()`);
    const kroky = z.z.slice(1).map((v, i) => z.z[i] - v);
    const gap = z.pw * 0.58 * Math.min(1, 4 / 5);
    const ocakKrok = kroky.map((_, i) => (z.t[i] + z.t[i + 1]) / 2 + gap);
    const odchylka = Math.max(...kroky.map((k, i) => Math.abs(k - ocakKrok[i])));
    ok(otvoreny && kroky.length === 5 && kroky.every((k) => k > 0) && odchylka < 1.5,
      `b-material: rez rozložený, 6 dosiek za sebou s medzerou pre 6 dosiek (pw ${z.pw} px, medzera ${gap.toFixed(1)} px, kroky ${kroky.map((k) => k.toFixed(1)).join("/")}, odchýlka ${odchylka.toFixed(2)} px)`);
    await t.ev(`window.scrollTo({ top: 0, behavior: "instant" })`);
  }

  // ---------------------------------------------------------------- b-porovnanie: naša cena „od …“ cez data-p1v-cislo, ľavý stĺpec dvojvrstvových
  if (await t.je("b-porovnanie")) {
    const r = await t.ev(`(function () { var s = document.querySelector(${J(S("b-porovnanie"))}), p = s.querySelector(".cmp-col.us .price"), n = s.querySelector(".cmp-col.us .name"), im = s.querySelector(".cmp-col.us img");
      return { cena: p ? p.textContent.replace(/[\\u00a0\\u202f]/g, " ").trim() : null, stav: p && p.getAttribute("data-p1v-stav"), vis: p ? getComputedStyle(p).visibility : null, meno: n && n.textContent,
        img: im && im.getAttribute("src"), imgOk: !!im && im.complete && im.naturalWidth > 0, mat: s.querySelector(".cmp-col.us li span b + *, .cmp-col.us li") ? s.querySelector(".cmp-col.us li").textContent : "",
        vyzva: s.querySelector(".spat-btn") && s.querySelector(".spat-btn").getAttribute("href") }; })()`);
    ok(r.stav === "ok" && r.vis === "visible" && (!ocak || r.cena === norm(`od ${eur(ocak.dvoj)}`)), `b-porovnanie: naša cena zo živých dát „${r.cena}“ (stav ${r.stav}${ocak ? ", čakám od " + ocak.dvoj + " €" : ""})`);
    ok(r.meno === "Originálne dvojvrstvové autokoberce" && /dvoj-porovnanie-original\.jpg/.test(r.img || "") && r.imgOk, `b-porovnanie: ľavý stĺpec „${r.meno}“ s fotkou dvojvrstvových (${r.imgOk ? "načítaná" : "nenačítaná"})`);
    ok(/odnímateľná druhá vrstva/.test(r.mat), "b-porovnanie: bod Materiál spomína odnímateľnú druhú vrstvu");
    ok(r.vyzva === "#product-detail-form", "b-porovnanie: výzva vedie na konfigurátor");
  }

  // ---------------------------------------------------------------- c-kam, c-domov, c-casova-os
  if (await t.je("c-kam")) {
    const r = await t.ev(`(function () { var s = document.querySelector(${J(S("c-kam"))}); var b = s.querySelectorAll(".kry-b");
      return { interier: [].map.call(b[0].querySelectorAll("li"), function (x) { return x.textContent; }), kufor: b[1].querySelectorAll("li").length }; })()`);
    ok(r.interier.length === 5 && r.interier[4] === "Druhá vrstva na ploche, kde sa šliape" && r.kufor === 3, `c-kam: interiér má 5 bodov vrátane druhej vrstvy (${r.interier.length}), kufor 3 (${r.kufor})`);
  }
  if (await t.je("c-domov")) {
    await t.ev(`document.querySelector(${J(S("c-domov") + " .balkarta")}).scrollIntoView({ block: "center", behavior: "instant" })`);
    await t.pauza(500);
    const r = await t.ev(`(function () { var s = document.querySelector(${J(S("c-domov"))}); var li = [].slice.call(s.querySelectorAll(".bal li")), sv = li[1] && li[1].querySelector("svg");
      var rc = sv ? sv.getBoundingClientRect() : null;
      return { n: li.length, mena: li.map(function (x) { return x.querySelector("b").textContent; }), koberce: li[0] && li[0].querySelector(".ba-p").textContent,
        druha: li[1] && li[1].querySelector(".ba-p").textContent, svg: rc ? Math.round(rc.width) + "×" + Math.round(rc.height) : null,
        img: [].every.call(s.querySelectorAll(".ba-i img"), function (i) { return i.complete && i.naturalWidth > 0; }) }; })()`);
    ok(r.n === 4 && r.mena.join("|") === "Autokoberce na mieru|Druhá vrstva|Klipy na uchytenie|Suché zipsy a páska", `c-domov: 4 položky balenia (${r.mena.join(" | ")})`);
    ok(/^Prvá prešívaná vrstva pre tie rady/.test(r.koberce) && /^Odnímateľná druhá vrstva vo farbe/.test(r.druha), "c-domov: „Prvá prešívaná vrstva pre tie rady…“ a „Odnímateľná druhá vrstva vo farbe…“ (Michal 15. 10. 2026: vrstvy vždy pomenované)");
    ok(r.svg === "40×40" && r.img, `c-domov: ikona druhej vrstvy (SVG ${r.svg}) a kresby balenia načítané (${r.img})`);
  }
  if (await t.je("c-casova-os")) {
    const r = await t.ev(`document.querySelector(${J(S("c-casova-os") + " .tml li .c p")}).textContent`);
    ok(/farby oboch vrstiev/.test(r), `c-casova-os: bod 1 „${r}“`);
  }

  // ---------------------------------------------------------------- c-farby: 4 vzorky dvojvrstvových
  if (await t.je("c-farby")) {
    const F = S("c-farby");
    await t.ev(`document.querySelector(${J(F)}).scrollIntoView({ block: "center", behavior: "instant" })`);
    await t.pauza(600);
    // skupina C (kontroly 598) už klikla na 2. vzorku — späť na 1., nech je počítadlo 01 / 04
    await t.klikni(F + " .lx-farby-vzorka", { index: 0, popis: "vzorka farby 1", pockaj: 500 }).catch(() => {});
    await t.pauza(300);
    const r = await t.ev(`(function () { var s = document.querySelector(${J(F)});
      return { velke: s.querySelectorAll(".lx-farby-velka img").length, vz: s.querySelectorAll(".lx-farby-vzorka").length, stitok: s.querySelector(".lx-farby-stitok").textContent.replace(/\\s+/g, ""),
        meno: s.querySelector(".lx-farby-meno").textContent, viac: s.querySelector(".lx-farby-viac").getAttribute("href"), span: s.querySelector(".lx-farby-viac").style.gridColumn,
        sw: [].every.call(s.querySelectorAll(".lx-farby-vzorka img"), function (i) { return i.complete && i.naturalWidth > 0; }),
        prva: (function () { var i = s.querySelector(".lx-farby-velka img.on"); return i && i.complete && i.naturalWidth > 0; })() }; })()`);
    ok(r.velke === 4 && r.vz === 4 && r.stitok === "01/04", `c-farby: 4 fotky a 4 vzorky, počítadlo ${r.stitok}`);
    ok(r.sw && r.prva, "c-farby: vzorky a 1. fotka načítané");
    ok(r.viac === "#product-detail-form" && /span\s*3/.test(r.span), `c-farby: „Mnoho ďalších farieb“ vedie na konfigurátor (${r.viac}, ${r.span})`);
    const caka = [["Čierna · červené šitie + Lux 07", "02", "Vzorka · Hexa Line"], ["Čierna · biele šitie + Lux 15", "03", "Vzorka · Diamond Line"], ["Hnedá + Lux 11", "04", "Vzorka · Stripe Line"]];
    for (let i = 0; i < caka.length; i++) {
      try {
        await t.klikni(F + " .lx-farby-vzorka", { index: i + 1, popis: "vzorka farby " + (i + 2), pockaj: 500 });
        await t.cakaj(`(function(){var i=document.querySelectorAll(${J(F + " .lx-farby-velka img")})[${i + 1}];return i&&i.getAttribute("src")&&i.classList.contains("on")})()`, { ms: 5000, popis: "fotka farby " + (i + 2) + " .on" });
        const po = await t.ev(`[document.querySelector(${J(F + " .lx-farby-meno")}).textContent, document.querySelector(${J(F + " .lx-farby-cislo")}).textContent, document.querySelector(${J(F + " .lx-farby-vzor-n")}).textContent]`);
        ok(po[0] === caka[i][0] && po[1] === caka[i][1] && po[2] === caka[i][2], `c-farby: klik na vzorku ${i + 2} prepol názov, číslo aj vzor (${po.join(" · ")})`);
      } catch (e) { ok(false, `c-farby: vzorka ${i + 2}: ${e.message}`); }
    }
  }

  // ---------------------------------------------------------------- d-faq: = živé FAQ z /faq/ doslovne (rozhodnutie Michala 14. 10. 2026)
  // 12 otázok ako 598 — počet, tlačidlá, zhodu so živým FAQ a rozbalenie overujú kontroly skupiny D (skD vyššie, už nie sú vyradené).

  // ---------------------------------------------------------------- d-koniec: pozadie dvojvrstvových, odkaz
  if (await t.je("d-koniec")) {
    await t.ev(`document.querySelector(${J(S("d-koniec"))}).scrollIntoView({ block: "center", behavior: "instant" })`);
    await t.pauza(700);
    const r = await t.ev(`(function () { var s = document.querySelector(${J(S("d-koniec"))}), bg = s.querySelector(".endbg"), a = s.querySelector("a[data-p1v-ciel]");
      return { bg: bg ? getComputedStyle(bg).backgroundImage : "", lede: s.querySelector(".lede").textContent, href: a && a.getAttribute("href") }; })()`);
    ok(/1v\/obsah\/dvoj-koniec\.jpg/.test(r.bg), `d-koniec: pozadie je fotka dvojvrstvových dvoj-koniec.jpg (${r.bg.slice(-40)})`);
    ok(/^Dvojvrstvové autokoberce na mieru Vášho vozidla — na leto aj zimu/.test(r.lede), `d-koniec: úvod dvojvrstvových („${r.lede.slice(0, 50)}…“)`);
    ok(r.href === "#p1v-dvoj-1", `d-koniec: záložný odkaz recenzií vedie na #p1v-dvoj-1 (${r.href})`);
  }

  // ---------------------------------------------------------------- všetky obrázky obsahu sa po prejdení načítajú (žiadny 404 / zlý názov)
  const zle404 = await t.ev(`(async function () {
    var m = document.querySelector(".p1v-miesto"), im = [].slice.call(m.querySelectorAll("img")).filter(function (i) { return /1v\\/obsah\\/dvoj-/.test(i.getAttribute("src") || i.getAttribute("data-src") || ""); });
    var vsetky = im.length;
    for (var k = 0; k < im.length; k++) { var i = im[k]; if (i.getAttribute("data-src") && !i.getAttribute("src")) i.setAttribute("src", i.getAttribute("data-src")); i.loading = "eager"; }
    await Promise.race([Promise.all(im.map(function (i) { return i.complete ? 0 : new Promise(function (r) { i.addEventListener("load", r); i.addEventListener("error", r); }); })), new Promise(function (r) { setTimeout(r, 6000); })]);
    return { vsetky: vsetky, zle: im.filter(function (i) { return !(i.complete && i.naturalWidth > 0); }).map(function (i) { return i.getAttribute("src"); }) };
  })()`);
  ok(!zle404.zle.length && zle404.vsetky >= 12, `obrázky dvojvrstvových (${CDN_OBSAH}dvoj-*): ${zle404.vsetky} v HTML, nenačítané: ${zle404.zle.join(", ") || "žiadne"}`);
  await t.ev(`window.scrollTo({ top: 0, behavior: "instant" })`);
  void sir;
  return out;
}
