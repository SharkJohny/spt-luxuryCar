// Obsah 1V typu „classic“ (rohož do kufra Classic 619/622/625) — mapa sekcií (web ↔ návrh) a kontroly pre tools/test-1v-obsah.mjs. T2.3.
// VLASTNÍK: T2.3. Pravidlá: docs/1v-obsah.md („Testy“). Formát sekcie[] a kontroly(t): pozri tools/test-1v/obsah-a.mjs.
//
// Skupiny A–D sa nepoužijú (zdielane = []): ich kontroly platia pre počty a texty obsahu 598 (9 vecí, 12 otázok, a-ponuka vedie na dvojvrstvové…).
// Tento plugin overuje všetky sekcie rohože Classic samostatne a s ?novy=vyvoj / ?novy=1 na každej šírke:
//   * CSS partial (každý selektor pod body.lcd-1v), sekcie sú na stránke, viditeľné;
//   * poradie sekcií (PORADIE): recenzie PRVÉ pod konfigurátorom, hneď za nimi Pred a po; banner setu (a-ponuka) nie pod konfigurátorom,
//     ale ďalej v popise a od banneru boxu (classic-box) aspoň 2 sekcie (Michal 25. 10. 2026, ako Premium);
//   * zdrojový text (admin-html/src/p1v-classic) okrem FAQ: žiadne zakázané formulácie (na milimeter, vyrábame, názvy materiálu, fixačné body,
//     Comfort, počty vrstiev, záruka), žiadny „kovový štítok“ ani „skladom“, žiadna cena natvrdo (okrem trhovej ceny napodobenín); rozhodnutia
//     Michala 14. 10. 2026: logo Luxury Car Design (čip, úvod 8 vecí, balenie) a lehota 21–29 dní (časová os) sú v texte;
//     FAQ = živé FAQ z /faq/ doslovne (tools/test-1v/obsah-faq.mjs), preto sa naň pravidlá nových textov nevzťahujú;
//   * čísla a odkazy podľa vzoru proti NEZÁVISLÝM očakávaniam (GET živých stránok sestier, ako sonda čísel): vlastná cena (230/240/240),
//     Premium toho istého vzoru (340/350/350), príplatok v sete Classic/Premium, úspora, samostatný box a box v sete; odkazy Premium/jednovrstvové/box;
//   * funkčnosť: galéria + okno, osem vecí (PC scéna 8 × 44 vh / telefón karusel s 8 kartami a 8 bodkami, 9 čipov), materiál, pred a po, Classic alebo
//     Premium (dva stĺpce vedľa seba), kam siahajú, upsell boxu, balenie (4 položky: 3 kresby + logo), časová os (6 krokov, 21–29 dní), farby (vzorky
//     len podľa produktu, počítadlo, „Mnoho ďalších farieb“), vzorky, realita (klik = okno), FAQ (= živé, 12 otázok), záver, výzvy vedú na konfigurátor.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { KOREN, register, sestra, zivaStranka } from "./obsah-spolocne.mjs";
import { kontrolaFaqZive } from "./obsah-faq.mjs";

export const SKUPINA = "classic";
export const NAVRH = "kufor-classic.html";
/** skupiny A–D sa nepoužijú: ich kontroly sú pre počty a texty obsahu 598 — tu ich nahrádza tento plugin */
export const zdielane = [];
export const sekcie = [
  // Michal 25. 10. 2026 (pri Premium 628: dva tmavé bannery hneď pod konfigurátorom = „úplný nonsens. Prvé majú byť recenzie a potom nejako
  // porozdeľovať tieto dva bannery do toho celého popisu“): prvé pod konfigurátorom sú recenzie, hneď za nimi Pred a po (24. 10. 2026:
  // „obrázok Pred a po daj hneď pod recenzie, je to veľmi dobrý predajný point“); banner setu z návrhu (hneď pod konfigurátorom) je za vzorkami
  { meno: "a-recenzie", navrh: [{ sel: "#recenzie" }] },
  { meno: "b-predapo", navrh: [{ sel: "#predapo" }] },
  { meno: "a-referencie", navrh: [{ sel: "#referencie" }] },
  { meno: "a-galeria", navrh: [{ sel: "#galeria" }] },
  { meno: "b-ocakavat", navrh: [{ sel: "#ocakavat" }] },
  { meno: "b-material", navrh: [{ sel: "#material" }] },
  { meno: "b-porovnanie", navrh: [{ sel: "#porovnanie" }] },
  { meno: "classic-premium", navrh: [{ sel: "#premium" }, { sel: ".spat", za: "#premium" }] },
  { meno: "c-kam", navrh: [{ sel: "section.chapter", text: "Kam všade rohož siaha" }] },
  { meno: "classic-box", navrh: [{ sel: "section.chapter", text: "Doplňte kufor o box" }, { sel: ".spat", za: "#predapo" }] },
  { meno: "c-domov", navrh: [{ sel: "section.chapter", text: "Čo Vám príde domov" }] },
  { meno: "c-casova-os", navrh: [{ sel: "section.chapter", text: "Od objednávky po doručenie" }, { sel: ".spat", pred: "#farby" }] },
  { meno: "c-farby", navrh: [{ sel: "#farby" }] },
  { meno: "c-vzorky", navrh: [{ sel: "#vzorky" }] },
  // karta setu (v návrhu prvá sekcia pod konfigurátorom) — na webe za vzorkami, pred videami z praxe
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Potrebujete aj koberce pod nohy" }] },
  { meno: "d-realita", navrh: [{ sel: "#realita" }] },
  { meno: "d-faq", navrh: [{ sel: "section.faqsec" }] },
  { meno: "d-koniec", navrh: [{ sel: "section.end" }] },
  { meno: "d-pomocne", navrh: [] },
];

/** poradie sekcií v obsahu (kus 1 potom kus 2). Oproti návrhu: recenzie PRVÉ pod konfigurátorom, hneď za nimi Pred a po (Michal 24. a 25. 10. 2026);
 *  banner setu (a-ponuka, v návrhu hneď pod konfigurátorom) je v kapitole 3 za vzorkami — ďaleko od banneru boxu (classic-box, kapitola 2) */
const PORADIE = ["a-recenzie", "b-predapo", "a-referencie", "a-galeria", "b-ocakavat", "b-material", "b-porovnanie", "classic-premium",
  "c-kam", "classic-box", "c-domov", "c-casova-os", "c-farby", "c-vzorky", "a-ponuka", "d-realita", "d-faq", "d-koniec", "d-pomocne"];

/** rovnaký zlom ako obsah-b.js MQ_STATICKA / LCD-HOME */
const MQ = "(max-width:900px), (min-width:901px) and (max-width:1199px) and (orientation:portrait) and (hover:none) and (pointer:coarse)";
const ZDROJ = join(KOREN, "admin-html/src/p1v-classic");
const SCSS = join(KOREN, "assets/css/_lcd1v-obsah-classic.scss");

/** zákaznícke texty (docs/1v-obsah.md bod 4 + rozhodnutia.md D3; logo a lehota 21–29 dní podľa rozhodnutia Michala 14. 10. 2026) */
const ZAKAZANE = /na\s+milimeter|vyr[aá]bame|dragon\s*skin|\belite\b|\bbasic\b|comfort|fixa[čc]n|bez\s+lepenia/i;
const POCET_VRSTIEV = /\d\s*-?\s*vrstv|päť\s*vrstiev|päťvrstv|piatich\s*vrstiev|pät\s*vrstiev/i;
const D3 = {
  sk: /štítok|štítk|kovov|skladom|rýchle\s+dodanie/iu,
  // CZ obsah používa podľa korektúry „Kovové logo“; zakázaný ostáva štítok a tvrdenie o skladovej dostupnosti.
  cz: /štítek|štítk|skladem|rychlé\s+dodání/iu,
};

/** vzorky farieb obsahu -> regulárny výraz na text voľby živého selectu (nezávislé od kódu webu) */
const VZORKY = { sk: [
  ["Čierna · červené šitie", /ko[žz]e\s*:\s*čierna\s*\/?\s*farba\s+šitia\s*:\s*červená\s*$/i],
  ["Čierna · modré šitie", /ko[žz]e\s*:\s*čierna\s*\/?\s*farba\s+šitia\s*:\s*modrá\s*$/i],
  ["Čierna · béžové šitie", /ko[žz]e\s*:\s*čierna\s*\/?\s*farba\s+šitia\s*:\s*béžová\s*$/i],
  ["Béžová", /ko[žz]e\s*:\s*béžová\s*$/i],
  ["Hnedá", /ko[žz]e\s*:\s*hnedá\s*$/i],
  ["Hnedá káva", /ko[žz]e\s*:\s*hnedá\s+káva\s*$/i],
  ["Vínovo červená", /ko[žz]e\s*:\s*vínovo\s+červená\s*$/i],
  ["Oranžová", /ko[žz]e\s*:\s*oranžová\s*$/i],
  ["Modrá", /ko[žz]e\s*:\s*modrá\s*$/i],
], cz: [
  ["Černá · červené prošívání", /kůže\s*:\s*černá\s*\/?\s*barva\s+šití\s*:\s*červená\s*$/i],
  ["Černá · modré prošívání", /kůže\s*:\s*černá\s*\/?\s*barva\s+šití\s*:\s*modrá\s*$/i],
  ["Černá · béžové prošívání", /kůže\s*:\s*černá\s*\/?\s*barva\s+šití\s*:\s*béžová\s*$/i],
  ["Béžová", /kůže\s*:\s*béžová\s*$/i],
  ["Hnědá", /kůže\s*:\s*hnědá\s*$/i],
  ["Hnědá káva", /kůže\s*:\s*(?:kávově\s+hnědá|hnědá\s+káva)\s*$/i],
  ["Vínově červená", /kůže\s*:\s*vínově\s+červená\s*$/i],
  ["Oranžová", /kůže\s*:\s*oranžová\s*$/i],
  ["Modrá", /kůže\s*:\s*modrá\s*$/i],
] };

const nbsp = (s) => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const suma = (n, web) => Number(n) > 0
  ? String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (web === "cz" ? " Kč" : " €")
  : null;
const dve = (n) => String(n).padStart(2, "0");

/** selektory partialu, ktoré nezačínajú body.lcd-1v (komentáre preč, @media rozbalené) */
function zleSelektory() {
  const css = readFileSync(SCSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
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

/** zdrojové HTML sekcií (bez komentárov): { subor, html, text } — text = viditeľný text + alt + aria-label */
function zdrojoveTexty(web = "sk") {
  return readdirSync(ZDROJ).filter((f) => new RegExp(`\\.${web}\\.html$`).test(f)).sort().map((f) => {
    const html = readFileSync(join(ZDROJ, f), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const atr = [...html.matchAll(/\s(?:alt|aria-label)="([^"]*)"/g)].map((m) => m[1]).join(" ");
    const text = html.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&times;|&lsaquo;|&rsaquo;/g, " ") + " " + atr;
    return { subor: f, html, text: text.replace(/\s+/g, " ") };
  });
}

/** očakávania nezávisle od kódu webu: GET živých stránok (vlastná, Premium, jednovrstvové, box toho istého vzoru) */
async function ocakavane(p, web = "sk") {
  const reg = register(web);
  const url = (typ) => { const s = sestra(reg, typ, p.vzor); return s ? s.url : null; };
  const ja = await zivaStranka(p.url);
  const prem = await zivaStranka(url("kufor-premium"));
  const jedno = await zivaStranka(url("jedno"));
  const box = await zivaStranka(url("boxy"));
  const sel = (st, re) => { const k = Object.keys(st.selecty).find((x) => re.test(x)); return k ? st.selecty[k] : []; };
  const kufor = sel(jedno, /do\s+kufr/i);
  const classic = (kufor.find((o) => /dno/i.test(o.text) && !/bok/i.test(o.text)) || {}).fp;
  const premium = (kufor.find((o) => /bok/i.test(o.text)) || {}).fp;
  const boxSoloS = (sel(jedno, /box\s*solo/i).find((o) => /^S\s*:/i.test(o.text)) || {}).fp;
  const farby = sel(ja, /^(farba|barva)\s*1\.?\s*vrstv/i);
  const viditelne = VZORKY[web].filter(([, re]) => farby.some((o) => re.test(o.text))).map(([n]) => n);
  return {
    cena: ja.cena, premiumCena: prem.cena, setClassic: classic, setPremium: premium, uspora: ja.cena - classic, boxCena: box.cena, boxSetS: boxSoloS,
    pocetFarieb: farby.length, farbyTexty: farby.map((o) => o.text), viditelne, cestaPremium: (sestra(reg, "kufor-premium", p.vzor) || {}).cesta, cestaJedno: (sestra(reg, "jedno", p.vzor) || {}).cesta,
    cestaBoxy: (sestra(reg, "boxy", p.vzor) || {}).cesta,
  };
}

export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const S = (m) => `.p1v-miesto ${t.sekcia(m)}`;
  const sj = (m) => JSON.stringify(S(m));
  const sir = t.sirka;
  const p = t.produkt;
  const web = t.web === "cz" ? "cz" : "sk";
  const cz = web === "cz";
  const peniaze = (n) => suma(n, web);
  const subor = (meno) => `${meno}.${web}.html`;
  const L = cz ? {
    logoUvod: "— a o kovové logo, které kopie nemá.", logoNazov: "Kovové logo",
    logoDomov: "Na rohoži je kovové logo Luxury Car Design, podle kterého poznáte originál.",
    setSpolu: "Společně s autokoberci pod sedadla", upSam: "Samostatne ",
    upSet: "S autokobercami pod sedadlá len za ", upUspora: "Ušetríte ",
    vetaSam: "samostatně za ", vetaSet: "Když ji koupíte společně s autokoberci pod sedadla, zaplatíte za ni jen ",
    boxSam: "Samostatne od ", boxSet: "S autokobercami pod sedadlá už od ",
    osem: /^Osm věcí/, materialDno: /dn[ěau] kufru/, kamSpolu: /Classic i Premium/, kamLen: /jen Premium/,
    balenieLogo: "Kovové logo", casUvod: /Šije se až po objednávce, proto dodání trvá 21–29 dní\./, casSpolu: /celkem 21–29 dní/,
    prvaFarba: "Černá · červené prošívání", vzorka: "Vzorek",
    faq6: /^Montáž je naprosto jednoduchá/,
    koniecH2: "Koupit a nečekat!", koniecLede: /^Rohož do kufru na míru Vašeho vozidla/,
    koniecTl: "Zadejte údaje o vozidle | Prohlédněte si recenze",
  } : {
    logoUvod: "— a o logu pravosti, ktoré kópia nemá.", logoNazov: "Logo pravosti",
    logoDomov: "Na rohoži je logo Luxury Car Design, podľa ktorého spoznáte originál.",
    setSpolu: "Spolu s autokobercami pod sedadlá", upSam: "Samostatne ",
    upSet: "S autokobercami pod sedadlá len za ", upUspora: "Ušetríte ",
    vetaSam: "samostatne za ", vetaSet: "Keď ju kúpite spolu s autokobercami pod sedadlá, zaplatíte za ňu len ",
    boxSam: "Samostatne od ", boxSet: "S autokobercami pod sedadlá už od ",
    osem: /^Osem vecí/, materialDno: /dnu kufra/, kamSpolu: /Classic aj Premium/, kamLen: /len Premium/,
    balenieLogo: "Logo pravosti", casUvod: /Šije sa až po objednávke, preto dodanie trvá 21–29 dní\./, casSpolu: /spolu 21–29 dní/,
    prvaFarba: "Čierna · červené šitie", vzorka: "Vzorka",
    faq6: /^Montáž je úplne jednoduchá/,
    koniecH2: "Kúpiť a nečakať!", koniecLede: /^Rohož do kufra na mieru Vášho vozidla/,
    koniecTl: "Zadajte údaje o vozidle | Pozrite si recenzie",
  };
  const je = {};
  for (const s of sekcie) je[s.meno] = await t.je(s.meno);
  // chat Luxia (iframe tretej strany) sa na telefóne sám otvára cez stred obrazovky — pre skutočné kliky ho skryjeme (len test)
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
  // ---------------------------------------------------------------- poradie sekcií na stránke (nie čísla súborov)
  // Pred a po hneď za recenziami (Michal 24. 10. 2026: „obrázok Pred a po daj hneď pod recenzie, je to veľmi dobrý predajný point“);
  // Michal 25. 10. 2026: prvé pod konfigurátorom recenzie, bannery setu a boxu nie hneď pod konfigurátorom ani pri sebe
  {
    const v = (await t.ev(`[].map.call(document.querySelectorAll(".p1v-miesto [data-lcd-sekcia]"), function (e) { return e.getAttribute("data-lcd-sekcia"); })`)).filter((m) => m !== "x-sonda-cisla");
    ok(JSON.stringify(v) === JSON.stringify(PORADIE), `sekcie v poradí (${v.length}/${PORADIE.length}): ${v.join(" > ")}`);
    const i = v.indexOf("a-recenzie");
    ok(i >= 0 && v[i + 1] === "b-predapo", `b-predapo je hneď za a-recenzie (${i >= 0 ? v.slice(Math.max(0, i - 1), i + 3).join(" → ") : "a-recenzie chýba"})`);
    // prvá sekcia pod konfigurátorom = prvá sekcia prvého koreňa obsahu (.p1v-miesto je pod konfigurátorom) a nad ňou žiadna iná sekcia
    const prva = await t.ev(`(function () { var m = document.querySelector(".p1v-miesto"), f = document.getElementById("product-detail-form");
      var s = m && [].filter.call(m.querySelectorAll("[data-lcd-sekcia]"), function (e) { return e.getAttribute("data-lcd-sekcia") !== "x-sonda-cisla"; })[0];
      return { meno: s ? s.getAttribute("data-lcd-sekcia") : null, podFormularom: !!(s && f && (f.compareDocumentPosition(s) & 4)) }; })()`);
    ok(prva.meno === "a-recenzie" && prva.podFormularom && v[0] === "a-recenzie" && v[1] === "b-predapo",
      `recenzie sú prvá sekcia pod konfigurátorom, hneď za nimi Pred a po (prvá „${prva.meno}“, pod formulárom ${prva.podFormularom}; ${v.slice(0, 2).join(" > ")})`);
    const iSet = v.indexOf("a-ponuka"), iBox = v.indexOf("classic-box");
    ok(iSet > 3 && iBox > 3 && Math.abs(iBox - iSet) > 2,
      `bannery rozdelené v popise: set za „${v[iSet - 1]}“ (${iSet + 1}. sekcia), box za „${v[iBox - 1]}“ (${iBox + 1}. sekcia), medzi nimi ${Math.abs(iBox - iSet) - 1} sekcií`);
    // rytmus kapitoly ako upsell boxu: linka nad kartou (za vzorkami) a odsadenie návrhu clamp(38px,4.8vw,68px), nie väčšie odsadenie skupiny A
    const kap = await t.ev(`(function () { var s = document.querySelector('.p1v-miesto [data-lcd-sekcia="a-ponuka"]'), c = s && s.querySelector(":scope > section.chapter");
      return s ? { kap: s.getAttribute("data-lcd-kap"), obal: !!c, linka: parseFloat(getComputedStyle(s).borderTopWidth), pad: c ? parseFloat(getComputedStyle(c).paddingTop) : -1, okno: innerWidth } : null; })()`);
    const padKap = kap ? Math.min(68, Math.max(38, 0.048 * kap.okno)) : 0;
    ok(kap && kap.kap === "3" && kap.obal && kap.linka >= 1 && Math.abs(kap.pad - padKap) <= 1.5,
      `banner setu je v kapitole 3: data-lcd-kap ${kap && kap.kap}, obal > section.chapter ${kap && kap.obal}, linka ${kap && kap.linka} px, odsadenie ${kap && kap.pad.toFixed(1)} px (návrh ${padKap.toFixed(1)} px)`);
  }
  const posun = (sel, pp, { dalej = 0 } = {}) => t.ev(`(async function () {
    var el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
    var r = el.getBoundingClientRect(), top = r.top + scrollY;
    var y = ${pp === null ? "top - 80" : `top + ${pp} * Math.max(0, r.height - innerHeight)`} + ${dalej};
    scrollTo({ top: Math.max(0, y - 400), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 120); });
    scrollTo({ top: Math.max(0, y), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 450); });
    return Math.round(scrollY);
  })()`);
  const text = (sel, i = 0) => t.ev(`(function () { var e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; return e ? e.textContent.replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim() : null; })()`);
  const stredu = (sel) => t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: "center", behavior: "instant" }); })()`);

  // ------------------------------------------------------------------ 0) CSS partial a zdrojové texty (statické kontroly)
  const zle = zleSelektory();
  ok(!zle.length, "CSS _lcd1v-obsah-classic.scss: každý selektor pod body.lcd-1v" + (zle.length ? " — zlé: " + zle.join(" | ") : ""));
  // FAQ (41-d-faq) = živý text z /faq/ (rozhodnutie Michala 14. 10. 2026) — pravidlá nových textov sa naň nevzťahujú, stráži ho kontrolaFaqZive
  const zdroje = zdrojoveTexty(web).filter((z) => !/41-d-faq/.test(z.subor));
  const ostatne = zdroje;
  const zakaz = zdroje.map((z) => (z.text.match(ZAKAZANE) || []).map((x) => z.subor + ": " + x)).flat();
  ok(!zakaz.length, "zdrojové texty bez zakázaných formulácií (na milimeter, vyrábame, názvy materiálu, fixačné body, Comfort)" + (zakaz.length ? ": " + zakaz.join(", ") : ""));
  const pocty = zdroje.map((z) => (z.text.match(POCET_VRSTIEV) || []).map((x) => z.subor + ": " + x)).flat();
  ok(!pocty.length, "zdrojové texty bez počtu vrstiev ako argumentu" + (pocty.length ? ": " + pocty.join(", ") : ""));
  const zaruka = ostatne.map((z) => (z.text.match(/z[aá]ruk/i) || []).map(() => z.subor)).flat();
  ok(!zaruka.length, "záruka sa nepoužíva ako argument (mimo FAQ ani raz)" + (zaruka.length ? ": " + zaruka.join(", ") : ""));
  const d3 = zdroje.map((z) => (z.text.match(D3[web]) || []).map((x) => z.subor + ": " + x)).flat();
  ok(!d3.length, "žiadny „kovový štítok“ ani „skladom“ v texte (na rohoži je logo, nie štítok)" + (d3.length ? ": " + d3.join(", ") : ""));
  const zdroj = (f) => (zdroje.find((z) => z.subor === f) || { text: "" }).text;
  ok(zdroj(subor("20-b-ocakavat")).includes(L.logoUvod) && zdroj(subor("20-b-ocakavat")).includes(L.logoNazov)
    && zdroj(subor("32-c-domov")).includes(L.logoDomov),
    "logo podľa rozhodnutia Michala 14. 10. 2026: úvod 8 vecí, čip „Logo pravosti“ a položka balenia doslovne z návrhu");
  const lehoty = zdroj(subor("33-c-casova-os")).match(/21–29 dní/g) || [];
  ok(lehoty.length === 2 && !/\d+\s*–\s*\d+\s*dní/.test(zdroj(subor("33-c-casova-os")).replace(/21–29 dní/g, "")), `časová os: lehota 21–29 dní v úvode aj v odznaku (${lehoty.length}×)`);
  const ceny = zdroje.map((z) => (z.text.replace(/50\s*€\s*–\s*129\s*€/g, "").match(/\d\s*(?:€|eur\b|Kč)|(?:€|Kč)\s*\d/gi) || []).map((x) => z.subor + ": " + x)).flat();
  ok(!ceny.length, "žiadna cena natvrdo v zdroji (okrem trhovej ceny napodobenín 50 € – 129 €)" + (ceny.length ? ": " + ceny.join(", ") : ""));
  const znacky = zdroje.map((z) => [...z.html.matchAll(/data-p1v-cislo="([^"]+)"/g)].length).reduce((a, b) => a + b, 0);
  ok(znacky >= 12, `čísla idú cez data-p1v-cislo (${znacky} značiek v zdroji)`);

  // ------------------------------------------------------------------ 1) sekcie sú na stránke, viditeľné, odhalené
  const pritomne = sekcie.filter((s) => s.meno !== "d-pomocne").map((s) => s.meno);
  const vid = await t.ev(`(function () { var o = {}; ${JSON.stringify(pritomne)}.forEach(function (m) {
    var e = document.querySelector('.p1v-miesto [data-lcd-sekcia="' + m + '"]'); o[m] = e ? Math.round(e.getBoundingClientRect().height) : -1; }); return o; })()`);
  const chybaju = pritomne.filter((m) => !(vid[m] > 40));
  ok(!chybaju.length, `všetkých ${pritomne.length} sekcií je na stránke a viditeľných (${sir} px)` + (chybaju.length ? " — chýba/neviditeľné: " + chybaju.map((m) => m + " " + vid[m]).join(", ") : ""));
  if (chybaju.length) return out;

  // ------------------------------------------------------------------ 2) čísla a odkazy podľa vzoru proti nezávislým očakávaniam
  let oc = null;
  try { oc = await ocakavane(p, web); } catch (e) { ok(false, "očakávané čísla (GET živých stránok sestier): " + e.message); }
  if (oc) {
    ok(oc.cena > 0 && oc.premiumCena > 0 && oc.setClassic > 0 && oc.setPremium > 0 && oc.boxCena > 0 && oc.boxSetS > 0, `nezávislé očakávania zo živých stránok: ${p.id} ${peniaze(oc.cena)}, Premium ${peniaze(oc.premiumCena)}, set Classic +${peniaze(oc.setClassic)} / Premium +${peniaze(oc.setPremium)}, box od ${peniaze(oc.boxCena)} / v sete od ${peniaze(oc.boxSetS)}`);
    // dokumentovaná hodnota z plánu (plan.md §4): 619 230 €, 622 a 625 240 €
    const dok = { 619: 230, 622: 240, 625: 240 }[p.id];
    ok(!dok || oc.cena === dok, `cena produktu ${p.id} je ${peniaze(dok)} (živá stránka: ${peniaze(oc.cena)})`);
    const kc = `${S("classic-premium")} .kc-cmp .cmp-col`;
    ok((await text(kc + " .price", 0)) === peniaze(oc.cena), `Classic alebo Premium: cena Classic „${await text(kc + " .price", 0)}“ = cena stránky ${peniaze(oc.cena)}`);
    ok((await text(kc + " .price", 1)) === peniaze(oc.premiumCena), `Classic alebo Premium: cena Premium „${await text(kc + " .price", 1)}“ = Premium toho istého vzoru ${peniaze(oc.premiumCena)}`);
    const sete = async (i) => text(`${kc}:nth-of-type(${i + 1}) li`, 3);
    // Michal 17. 10. 2026: cena v sete nie „Len + X €“, ale „Spolu s autokobercami pod sedadlá — Len za X € (samostatne Y €)“
    const setRiadok = (set, sam) => L.setSpolu + "Len za " + peniaze(set) + " (samostatne " + peniaze(sam) + ")";
    ok(nbsp(await sete(1)).endsWith(setRiadok(oc.setClassic, oc.cena)), `Classic alebo Premium: s autokobercami Classic „${await sete(1)}“ (čakám Len za ${peniaze(oc.setClassic)} (samostatne ${peniaze(oc.cena)}))`);
    ok(nbsp(await sete(2)).endsWith(setRiadok(oc.setPremium, oc.premiumCena)), `Classic alebo Premium: s autokobercami Premium „${await sete(2)}“ (čakám Len za ${peniaze(oc.setPremium)} (samostatne ${peniaze(oc.premiumCena)}))`);
    const up = [await text(S("a-ponuka") + " .ups li", 0), await text(S("a-ponuka") + " .ups li", 1), await text(S("a-ponuka") + " .ups li", 2), await text(S("a-ponuka") + " .ups p", 0)];
    ok(up[0] === L.upSam + peniaze(oc.cena) && up[1] === L.upSet + peniaze(oc.setClassic) && up[2] === L.upUspora + peniaze(oc.uspora),
      `upsell autokobercov: „${up[0]}“ / „${up[1]}“ / „${up[2]}“ (čakám ${peniaze(oc.cena)}, +${peniaze(oc.setClassic)}, ušetríte ${peniaze(oc.uspora)})`);
    ok(up[3].includes(L.vetaSam + peniaze(oc.cena)) && up[3].includes(L.vetaSet + peniaze(oc.setClassic) + "."), "upsell autokobercov: veta v texte má tie isté dve ceny (" + up[3] + ")");
    ok(!/\+\s*\d/.test(up.join(" ") + " " + (await sete(1)) + " " + (await sete(2))), "cena v sete bez „+“ (Michal 17. 10. 2026)");
    const bx = [await text(S("classic-box") + " .ups li", 1), await text(S("classic-box") + " .ups li", 2)];
    ok(bx[0] === L.boxSam + peniaze(oc.boxCena) && bx[1] === L.boxSet + peniaze(oc.boxSetS), `upsell boxu: „${bx[0]}“ / „${bx[1]}“ (čakám od ${peniaze(oc.boxCena)}, v sete od ${peniaze(oc.boxSetS)})`);
    ok((await text(S("b-porovnanie") + " .cmp-col.us .price")) === "od " + peniaze(oc.cena), `porovnanie: naša cena „${await text(S("b-porovnanie") + " .cmp-col.us .price")}“ = od ${peniaze(oc.cena)}`);
    // odkazy: Premium / jednovrstvové / box toho istého vzoru (a pre 622 dokumentovaný Premium Hexa)
    const odk = await t.ev(`(function () { var o = {}; [].forEach.call(document.querySelectorAll(".p1v-miesto a[data-p1v-odkaz]"), function (a) { var k = a.getAttribute("data-p1v-odkaz"); (o[k] = o[k] || []).push((a.getAttribute("href") || "").split("#")[0]); }); return o; })()`);
    const vsetky = (k, cesta) => (odk[k] || []).length > 0 && odk[k].every((h) => h === cesta);
    ok(vsetky("premium", oc.cestaPremium), `odkazy Premium (${(odk.premium || []).length}×) vedú na ${oc.cestaPremium}: ${[...new Set(odk.premium || [])].join(", ")}`);
    ok(vsetky("jedno", oc.cestaJedno), `odkazy na jednovrstvové (${(odk.jedno || []).length}×) vedú na ${oc.cestaJedno}: ${[...new Set(odk.jedno || [])].join(", ")}`);
    ok(vsetky("boxy", oc.cestaBoxy), `odkazy na box (${(odk.boxy || []).length}×) vedú na ${oc.cestaBoxy}: ${[...new Set(odk.boxy || [])].join(", ")}`);
    if (p.id === 622 || p.id === 2430) ok((odk.premium || []).every((h) => h === "/luxusny-koberced-do-kufra-dragonskin-premium-hexa/"), `${p.id}: odkaz Premium → /luxusny-koberced-do-kufra-dragonskin-premium-hexa/`);
  }

  // ------------------------------------------------------------------ 3) výzvy a tlačidlá vedú na konfigurátor
  const kotvy = await t.ev(`(function () { var a = [].slice.call(document.querySelectorAll('.p1v-miesto :is(.spat-btn,.pf-cta,.end-cta a:first-child)'));
    return { n: a.length, zle: a.filter(function (x) { return x.getAttribute("href") !== "#product-detail-form"; }).map(function (x) { return x.getAttribute("href"); }), ciel: !!document.getElementById("product-detail-form") }; })()`);
  ok(kotvy.n >= 9 && !kotvy.zle.length && kotvy.ciel, `${kotvy.n} tlačidiel výzvy vedie na #product-detail-form (zlé: ${kotvy.zle.join(", ") || "—"})`);
  for (const [m, nazov] of [["classic-premium", "Vyberte si model a farbu"], ["classic-box", "Pokračujte vo výbere"], ["c-casova-os", "Dokončite objednávku"]]) {
    try {
      await t.klikni(S(m) + " .spat-btn", { popis: nazov, pockaj: 1600 });
      const r = await t.ev(`(function () { var f = document.getElementById("product-detail-form").getBoundingClientRect(); return [Math.round(f.top), Math.round(f.bottom), innerHeight]; })()`);
      ok(r[0] < r[2] * 0.6 && r[1] > 60, `výzva „${nazov}“ posunie na konfigurátor (formulár top ${r[0]}, okno ${r[2]})`);
    } catch (e) { ok(false, `výzva „${nazov}“: ${e.message}`); }
  }

  // ------------------------------------------------------------------ 4) galéria + okno, referencie
  if (je["a-galeria"]) {
    const r = await t.ev(`(async function () {
      var s = document.querySelector(${sj("a-galeria")}), trat = s.querySelector(".lx-gal-trat");
      var y0 = s.getBoundingClientRect().top + scrollY;
      scrollTo({ top: y0 + 10, behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 400); });
      var c0 = s.querySelector(".lx-gal-cislo").textContent, t0 = getComputedStyle(trat).transform;
      scrollTo({ top: y0 + s.offsetHeight * 0.55, behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 500); });
      var c1 = s.querySelector(".lx-gal-cislo").textContent, t1 = getComputedStyle(trat).transform;
      var f = [].slice.call(s.querySelectorAll(".lx-gal-k:not(.lx-klon) img"));
      return { fotky: f.length, klony: s.querySelectorAll(".lx-gal-k.lx-klon").length, c0: c0, c1: c1, t0: t0, t1: t1, h: s.offsetHeight,
        triedaOk: f.every(function (i) { return /\\/img\\/1v\\/obsah\\/classic-[a-z0-9-]+\\.jpg$/.test(i.getAttribute("src") || ""); }) };
    })()`);
    ok(r.fotky === 8 && r.klony === 8 && r.triedaOk, `galéria: 8 fotiek classic-*.jpg + 8 kópií pre pás (${r.fotky} + ${r.klony})`);
    if (sir > 760) ok(r.t0 !== r.t1 && r.c1 !== r.c0, `galéria: scroll posúva pás a počítadlo (${r.c0} -> ${r.c1}), prilepená scéna ${Math.round(r.h)} px`);
    const z = await t.ev(`(async function () {
      var s = document.querySelector(${sj("a-galeria")}), b = s.querySelectorAll(".lx-gal-k:not(.lx-klon) .lx-gal-f")[1], lb = document.getElementById("p1v-lb");
      if (!lb) return { okno: false };
      b.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 300); });
      b.click(); await new Promise(function (r) { setTimeout(r, 400); });
      var im = lb.querySelector(".p1v-lb-ram img"), poc = (lb.querySelector(".p1v-lb-pod") || {}).textContent || "";
      var o = { okno: true, otv: !lb.hidden, src: !!im && im.getAttribute("src") === b.getAttribute("data-p1v-lb-foto"), poc: poc.replace(/\\s+/g, " ").trim() };
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await new Promise(function (r) { setTimeout(r, 400); });
      o.zatv = lb.hidden; return o; })()`);
    ok(z.okno && z.otv && z.src && z.zatv && /2\s*\/\s*8/.test(z.poc), `galéria: klik na fotku ju otvorí v okne #p1v-lb (sada „${z.poc}“), Escape zavrie`);
  }
  if (je["a-referencie"]) {
    await stredu(S("a-referencie"));
    await t.pauza(900);
    const r = await t.ev(`(function () { var s = document.querySelector(${sj("a-referencie")}); return { karty: s.querySelectorAll(".deck.refs .ref").length, yt: s.querySelectorAll("[data-p1v-lb-yt]").length }; })()`);
    ok(r.karty === 6 && r.yt === 6, `referencie: 6 kariet s YouTube id (${r.karty}/${r.yt})`);
  }

  // ------------------------------------------------------------------ 5) osem vecí
  if (je["b-ocakavat"]) {
    const sek = S("b-ocakavat");
    const staticka = await t.ev(`matchMedia(${JSON.stringify(MQ)}).matches`);
    const n = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return { img: s.querySelectorAll(".s2-media img").length, tx: s.querySelectorAll(".s2-t").length, rail: s.querySelectorAll(".s2-rail button").length,
      th: s.querySelectorAll(".s2-thumbs button").length, chip: s.querySelectorAll(".pintop .chip").length, h2: s.querySelector("h2").textContent.trim() }; })()`);
    ok(n.img === 8 && n.tx === 8 && n.rail === 8 && n.th === 8 && n.chip === 9, `osem vecí: 8 fotiek, 8 textov, 8 bodiek, 8 náhľadov, 9 čipov s „Logo pravosti“ (${JSON.stringify(n)})`);
    ok(L.osem.test(n.h2), `osem vecí: nadpis „${n.h2}“ (položka o logu čaká na náhľad v CSS a fotku loga na rohoži)`);
    if (staticka) {
      await posun(sek, null);
      const k = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), m = s.querySelector(".pinmain"), cw = document.documentElement.clientWidth;
        var bod = [].slice.call(s.querySelectorAll(".s2-rail button")).map(function (b) { var r = b.getBoundingClientRect(); return [Math.round((r.top + r.bottom) / 2), Math.round(r.left), Math.round(r.right)]; });
        var im = [].slice.call(s.querySelectorAll(".s2-media img")).map(function (i) { return Math.round(i.getBoundingClientRect().top); });
        return { posuv: m.scrollWidth > m.clientWidth + 50, karty: im.length, riadok: new Set(im).size === 1, bodky: bod.length, stlpce: getComputedStyle(m).gridTemplateColumns.split(" ").length,
          jedenRiadok: bod.every(function (b) { return Math.abs(b[0] - bod[0][0]) <= 3; }), vOkne: bod.every(function (b) { return b[1] >= 0 && b[2] <= cw; }),
          stage: s.querySelector(".stage2").style.height, lista: getComputedStyle(s.querySelector(".pinfoot")).display }; })()`);
      ok(k.posuv && k.karty === 8 && k.riadok && k.stlpce === 8, `osem vecí (karusel): posuvný pás, ${k.karty} kariet v jednom riadku, ${k.stlpce} stĺpcov (bez prázdneho 9.)`);
      ok(k.bodky === 8 && k.jedenRiadok && k.vOkne, `osem vecí (karusel): ${k.bodky} bodiek v jednom riadku v okne`);
      ok(!k.stage && k.lista === "none", `osem vecí (karusel): bez výšky prilepenej scény (${k.stage || "auto"}) a bez spodnej lišty`);
      await t.klikni(sek + " .s2-rail button", { index: 2, popis: "bodka 3", pockaj: 1200 });
      const po = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), m = s.querySelector(".pinmain"), r = m.getBoundingClientRect();
        var i = s.querySelectorAll(".s2-media img")[2].getBoundingClientRect(); var on = s.querySelector(".s2-rail button.on");
        return { odchylka: Math.round(Math.abs(i.left + i.width / 2 - (r.left + r.width / 2))), on: on ? on.getAttribute("data-i") : null }; })()`);
      ok(po.odchylka < 24 && po.on === "2", `osem vecí (karusel): bodka 3 posunula kartu 3 do stredu (odchýlka ${po.odchylka} px, aktívna ${po.on})`);
    } else {
      const v = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)} + " .stage2"); return { h: s.getBoundingClientRect().height, cak: 8 * 0.44 * innerHeight, pin: getComputedStyle(s.querySelector(".pin2")).position }; })()`);
      ok(Math.abs(v.h - v.cak) < 3 && v.pin === "sticky", `osem vecí (PC): scéna ${Math.round(v.h)} px = 8 × 44 vh (${Math.round(v.cak)}), prilepená (${v.pin})`);
      await posun(sek + " .stage2", 0.7);
      const k = await t.cakaj(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); var on = s.querySelectorAll(".s2-t.on"), im = s.querySelectorAll(".s2-media img.on");
        return on.length === 1 && im.length === 1 && on[0].getAttribute("data-i") === "5" && im[0].getAttribute("data-i") === "5" ? s.querySelector(".s2-big").textContent : ""; })()`, { ms: 3500, popis: "krok 6 pri 70 %" }).catch(() => "");
      ok(k === "06", `osem vecí (PC): pri 70 % scény je práve jeden krok, 06 (číslo „${k || "—"}“)`);
      await t.klikni(sek + " .s2-thumbs button", { index: 2, popis: "náhľad 03", pockaj: 200 });
      const nn = await t.cakaj(`(function () { var on = document.querySelector(${JSON.stringify(sek)} + " .s2-t.on"); return on && on.getAttribute("data-i") === "2" ? "2" : ""; })()`, { ms: 4000, popis: "náhľad 03 posunie na krok 3" }).catch(() => "");
      ok(nn === "2", "osem vecí (PC): klik na náhľad 03 posunie scénu na krok 3");
      const th = await t.ev(`(function () { var b = [].slice.call(document.querySelectorAll(${JSON.stringify(sek)} + " .s2-thumbs button")); return b.map(function (x) { return getComputedStyle(x, ":before").backgroundImage; }); })()`);
      const cakaneTh = ["classic-v1", "classic-v3", "classic-v4", "classic-v5", "classic-v6", "b-ocakavat-farba-interieru", "b-ocakavat-zvierata", "classic-v9"];
      ok(cakaneTh.every((f, i) => (th[i] || "").includes(f + ".jpg")), `osem vecí (PC): náhľady 1–8 majú fotky z CSS (${th.map((x) => (/\/([^/]+)\.jpg/.exec(x) || [])[1]).join(", ")})`);
    }
  }

  // ------------------------------------------------------------------ 6) materiál
  if (je["b-material"]) {
    const sek = S("b-material");
    const staticka = await t.ev(`matchMedia(${JSON.stringify(MQ)}).matches`);
    if (staticka) {
      await posun(sek + " .exp", null);
      await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(sek)} + " .mat-toggle"); if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
      await t.pauza(1300);
      const pred = await t.ev(`document.querySelector(${JSON.stringify(sek)} + " .exp").classList.contains("open")`);
      await t.klikni(sek + " .mat-toggle", { popis: "Rozložiť/Zložiť materiál", pockaj: 500 });
      const po = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return { open: s.querySelector(".exp").classList.contains("open"), text: s.querySelector(".mat-toggle").textContent.trim() }; })()`);
      ok(po.open !== pred && po.text === (po.open ? "Zložiť materiál" : "Rozložiť materiál"), `materiál (telefón): tlačidlo prepne rez (${pred ? "rozložený" : "zložený"} -> ${po.open ? "rozložený" : "zložený"})`);
    } else {
      await posun(sek + " .stage", 0.5);
      const o = await t.cakaj(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return s.querySelector(".exp").classList.contains("open") ? s.querySelector(".pinfoot .pf-bar i").style.width : ""; })()`, { ms: 3000, popis: "rez rozložený pri 50 %" }).catch(() => "");
      ok(o === "100%", `materiál (PC): pri 50 % scény je rez rozložený (lišta ${o || "—"})`);
    }
    await t.ev(`(function () { var b = document.querySelectorAll(${JSON.stringify(sek)} + " .leg-h")[1]; if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
    await t.pauza(300);
    await t.klikni(sek + " .leg-h", { index: 1, popis: "legenda 2", pockaj: 600 });
    const l = await t.ev(`(function () { var L = document.querySelectorAll(${JSON.stringify(sek)} + " .leg"); var h = L[1].querySelector(".leg-h"), d = L[1].querySelector(".leg-d");
      return { n: L.length, exp: h.getAttribute("aria-expanded"), h: Math.round(d.getBoundingClientRect().height), txt: d.textContent.trim().slice(0, 30), ine: [].filter.call(L, function (x) { return x.querySelector(".leg-h").getAttribute("aria-expanded") === "true"; }).length }; })()`);
    ok(l.n === 5 && l.exp === "true" && l.h > 20 && l.ine === 1 && L.materialDno.test(await text(sek + " .leg-d", 1)), `materiál: 5 položiek legendy, legenda 2 sa otvorila (výška ${l.h} px) a hovorí o dne kufra`);
  }

  // ------------------------------------------------------------------ 7) porovnanie a Classic alebo Premium
  if (je["classic-premium"]) {
    await stredu(S("classic-premium") + " .kc-cmp");
    await t.pauza(500);
    const c = await t.ev(`(function () { var s = document.querySelector(${sj("classic-premium")}), k = [].slice.call(s.querySelectorAll(".kc-cmp .cmp-col")).map(function (e) { var r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width)]; });
      var no = s.querySelectorAll(".kc-cmp .ic.no"); var bg = no[0] ? getComputedStyle(no[0]).backgroundColor : "";
      return { k: k, us: s.querySelectorAll(".kc-cmp .cmp-col.us").length, no: no.length, bg: bg, riadkov: s.querySelectorAll(".kc-cmp .cmp-col:first-of-type li, .kc-cmp .cmp-col li").length }; })()`);
    ok(c.k.length === 2 && c.us === 2 && Math.abs(c.k[0][1] - c.k[1][1]) < 2 && c.k[1][0] > c.k[0][0] + c.k[0][2] - 2, `Classic alebo Premium: dva stĺpce .us vedľa seba (${sir} px) ${JSON.stringify(c.k)}`);
    ok(c.no === 2 && c.bg === "rgb(226, 221, 209)", `Classic alebo Premium: 2 sivé „–“ (Boky, Chrbty) pri Classic (${c.no}, ${c.bg})`);
  }
  if (je["b-porovnanie"]) {
    const n = await t.ev(`(function () { var s = document.querySelector(${sj("b-porovnanie")}); return { us: s.querySelectorAll(".cmp-col.us li").length, them: s.querySelectorAll(".cmp-col.them li").length, spat: s.querySelectorAll(".spat").length }; })()`);
    ok(n.us === 5 && n.them === 5 && n.spat === 0, `porovnanie: 5 + 5 riadkov, výzva je až za sekciou Classic alebo Premium (${JSON.stringify(n)})`);
  }

  // ------------------------------------------------------------------ 8) pred a po
  if (je["b-predapo"]) {
    const sek = S("b-predapo");
    const lep = await t.ev(`document.querySelector(${JSON.stringify(sek)}).classList.contains("lx-bez-lepu")`);
    let cc = "";
    for (let pokus = 0; pokus < 3 && !(Number(cc) > 0); pokus++) { // pri zaťaženom stroji (paralelné Chromy) sa scroll udalosť môže oneskoriť
      if (lep) await t.ev(`(function () { var pl = document.querySelector(${JSON.stringify(sek)} + " .lx-pp-plocha"); var r = pl.getBoundingClientRect(); scrollTo({ top: r.top + scrollY - innerHeight * 0.2, behavior: "instant" }); })()`);
      else await posun(sek, 0.6);
      cc = await t.cakaj(`(function () { var n = +document.querySelector(${JSON.stringify(sek)} + " .lx-pp-cislo").textContent; return n > 0 ? String(n) : ""; })()`, { ms: 2500, popis: "pred a po: percentá" }).catch(() => "");
    }
    ok(Number(cc) > 0, `pred a po (${lep ? "neprilepená" : "prilepená"} scéna): pri posune ${cc || 0} % dna kufra pod ochranou`);
    const sw = await t.ev(`[1, 2, 3, 4].map(function (i) { return getComputedStyle(document.querySelector(${JSON.stringify(sek)} + " .lx-leg-r:nth-child(" + i + ") .lx-leg-sw")).backgroundImage; })`);
    ok(sw.every((x, i) => x.includes(`classic-pp-${i + 1}.jpg`)), "pred a po: vzorky legendy z CSS (classic-pp-1…4.jpg)");
    const im = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return [].map.call(s.querySelectorAll(".lx-pp-plocha img"), function (i) { return /classic-(pred|po)\\.jpg$/.test(i.getAttribute("src")) && i.naturalWidth > 0; }); })()`);
    ok(im.length === 2 && im.every(Boolean), "pred a po: obe fotky (classic-pred.jpg, classic-po.jpg) sa načítali");
  }

  // ------------------------------------------------------------------ 9) kam siahajú, upsell boxu, balenie, časová os
  if (je["c-kam"]) {
    const kry = await t.ev(`[].map.call(document.querySelectorAll(${JSON.stringify(S("c-kam") + " .kry-b")}), function (e) { var r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width)]; })`);
    if (sir >= 901) ok(kry.length === 2 && Math.abs(kry[0][1] - kry[1][1]) < 2 && kry[1][0] > kry[0][0] + kry[0][2], "kam siahajú: na PC dve karty vedľa seba " + JSON.stringify(kry));
    else ok(kry.length === 2 && kry[1][1] > kry[0][1] + 40, "kam siahajú: na telefóne témy pod sebou " + JSON.stringify(kry));
    const li = await t.ev(`[].map.call(document.querySelectorAll(${JSON.stringify(S("c-kam") + " .zoz li")}), function (e) { return e.textContent.trim(); })`);
    ok(li.length === 3 && L.kamSpolu.test(li[0]) && L.kamLen.test(li[1]) && L.kamLen.test(li[2]), `kam siahajú: 3 položky v kufri (${li.join(" | ")})`);
  }
  if (je["classic-box"]) {
    const b = await t.ev(`(function () { var s = document.querySelector(${sj("classic-box")}), u = s.querySelector(".ups"), i = s.querySelector(".ph img");
      return { cols: getComputedStyle(u).gridTemplateColumns.split(" ").length, bg: getComputedStyle(u).backgroundColor, li: s.querySelectorAll(".ups li").length, tx: s.textContent, foto: !!i && i.complete && i.naturalWidth > 0 }; })()`);
    ok(b.li === 3 && b.foto && !/Jeden alebo dva boxy/.test(b.tx), `upsell boxu: 3 riadky zoznamu, fotka načítaná, bez nepravdivého „Jeden alebo dva boxy“`);
    ok(sir > 820 ? b.cols === 2 : b.cols === 1, `upsell boxu: tmavá karta v ${b.cols} stĺpcoch (${sir > 820 ? "PC 2" : "telefón 1"})`);
    // rytmus kapitol ako v návrhu (.kap > section.chapter{padding-top:clamp(38px,4.8vw,68px) !important} + linka 1 px medzi sekciami kapitoly):
    // karta sa nesmie lepiť na „Kam všade rohož do kufra siaha“ (bola chyba: padding-top:0 a bez linky)
    const sp = await t.ev(`(function () { var w = document.querySelector(${sj("classic-box")}), c = w.querySelector("section.chapter");
      return { linka: parseFloat(getComputedStyle(w).borderTopWidth), pad: parseFloat(getComputedStyle(c).paddingTop), okno: innerWidth }; })()`);
    const padNavrh = Math.min(68, Math.max(38, 0.048 * sp.okno));
    ok(sp.linka >= 1 && Math.abs(sp.pad - padNavrh) <= 1.5, `upsell boxu: nad kartou deliaca linka ${sp.linka} px a odsadenie ${sp.pad.toFixed(1)} px (návrh clamp(38px,4.8vw,68px) = ${padNavrh.toFixed(1)} px)`);
  }
  if (je["c-domov"]) {
    await stredu(S("c-domov") + " .balkarta");
    const ok3 = await t.cakaj(`[].every.call(document.querySelectorAll(${JSON.stringify(S("c-domov") + " .ba-i img")}), function (i) { return i.complete && i.naturalWidth > 0; })`, { ms: 8000, popis: "kresby balenia" }).then(() => true, () => false);
    const nn = await t.ev(`({ kresby: document.querySelectorAll(${JSON.stringify(S("c-domov") + " .ba-i img")}).length, polozky: document.querySelectorAll(${JSON.stringify(S("c-domov") + " .bal li")}).length, stlpce: getComputedStyle(document.querySelector(${JSON.stringify(S("c-domov") + " .bal li")})).gridTemplateColumns.split(" ").length,
      logo: (function () { var l = document.querySelectorAll(${JSON.stringify(S("c-domov") + " .bal li")})[1], s = l && l.querySelector(".ba-i svg"), r = s && s.getBoundingClientRect(); return l ? [l.querySelector("b").textContent, r ? Math.round(r.width) + "×" + Math.round(r.height) : "bez svg"] : null; })() })`);
    ok(ok3 && nn.kresby === 3 && nn.polozky === 4, `balenie: 4 položky, 3 kresby stiahnuté (${nn.polozky}, ${nn.kresby})`);
    ok(nn.logo && nn.logo[0] === L.balenieLogo && nn.logo[1] === "40×40", `balenie: 2. položka „${L.balenieLogo}“ so štítom 40×40 ako kresby (${JSON.stringify(nn.logo)})`);
    ok(sir >= 820 ? nn.stlpce === 3 : nn.stlpce === 2, `balenie: riadok má ${nn.stlpce} stĺpce (${sir >= 820 ? "PC 3" : "telefón 2"})`);
  }
  if (je["c-casova-os"]) {
    const os = S("c-casova-os") + " .tml";
    const osStav = `(function () { var t = document.querySelector(${JSON.stringify(os)}); return [parseFloat(t.style.getPropertyValue("--p") || "0"), t.querySelectorAll("li.on").length, t.querySelectorAll("li").length]; })()`;
    await t.ev(`(function () { var e = document.querySelector(${JSON.stringify(os)}); scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight - 40, behavior: "instant" }); })()`);
    await t.pauza(600);
    const pred = await t.ev(osStav);
    ok(pred[0] === 0 && pred[1] === 0 && pred[2] === 6, `časová os pod oknom: 6 krokov, --p 0, nič nesvieti ${JSON.stringify(pred)}`);
    let za = [0, 0, 0];
    for (let pokus = 0; pokus < 3 && !(za[0] === 1 && za[1] === 6); pokus++) {
      await t.ev(`(function () { var e = document.querySelector(${JSON.stringify(os)}); scrollTo({ top: e.getBoundingClientRect().bottom + scrollY - innerHeight * 0.3, behavior: "instant" }); })()`);
      await t.pauza(600);
      za = await t.ev(osStav);
    }
    ok(za[0] === 1 && za[1] === 6, `časová os prečítaná: --p 1, svieti 6 krokov ${JSON.stringify(za)}`);
    const tx = await text(S("c-casova-os"));
    ok(L.casUvod.test(tx) && L.casSpolu.test(tx), `časová os: český/slovenský úvod a odznak s lehotou 21–29 dní (${web.toUpperCase()})`);
    if (sir >= 901) {
      const strany = await t.ev(`(function () { var t = document.querySelector(${JSON.stringify(os)}), x = t.getBoundingClientRect().left + t.offsetWidth / 2; return [].map.call(t.querySelectorAll("li > .c"), function (c) { var r = c.getBoundingClientRect(); return r.right <= x ? "L" : r.left >= x ? "P" : "?"; }).join(""); })()`);
      ok(strany === "LPLPLP", `časová os na PC: kroky striedavo vľavo/vpravo od osi (${strany})`);
    }
  }

  // ------------------------------------------------------------------ 10) farby: vzorky len podľa produktu
  if (je["c-farby"] && oc) {
    const F = S("c-farby");
    await stredu(F + " .lx-farby-panel");
    await t.pauza(400);
    const f = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(F)});
      var v = [].slice.call(s.querySelectorAll(".lx-farby-vzorka")), vis = v.filter(function (x) { return !x.hidden && getComputedStyle(x).display !== "none"; });
      var viac = s.querySelector(".lx-farby-viac");
      return { vsetky: v.length, vis: vis.map(function (x) { return (x.getAttribute("aria-label") || "").split(", ")[0]; }), prva: vis[0] ? vis[0].getAttribute("aria-pressed") : null,
        stitok: s.querySelector(".lx-farby-stitok").textContent.replace(/\\s+/g, " ").trim(), viac: viac ? getComputedStyle(viac).display !== "none" : null,
        meno: s.querySelector(".lx-farby-meno").textContent.trim(), velkych: s.querySelectorAll(".lx-farby-velka img").length,
        n: (s.querySelector(".lx-farby-vzor-n") || {}).textContent, diamond: v.some(function (x) { return x.getAttribute("data-vzor") === "Diamond Line"; }) }; })()`);
    // Diamond (619): 9 statických vzoriek Diamond Line, viditeľné len tie, ktoré produkt má. Hexa/Stripe (622/625, integrácia
    // 14. 10. 2026): obsah-c.js sekciu prestaví na VŠETKY farby produktu vo vlastnom vzore (žiadna vzorka Diamond Line) —
    // očakávania z GET živej stránky (počet a poradie volieb farby 1. vrstvy), nie z kódu webu.
    const bezDia = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const zhoda = (meno, text) => { const [koza, sitie] = bezDia(meno).split(" · "); const t2 = bezDia(text);
      const zaKozou = (t2.split(/koze|kuze/)[1] || ""), zaSitim = (t2.split(/sitia|siti/)[1] || "");
      return zaKozou.includes(koza) && (!sitie || zaSitim.includes(sitie.slice(0, 4))); };
    const viditelne = p.vzor === "diamond" ? oc.viditelne : f.vis;
    if (p.vzor === "diamond") {
      ok(f.vsetky === 9 && f.velkych === 9, `farby: v HTML 9 vzoriek a 9 veľkých fotiek (${f.vsetky}/${f.velkych})`);
      ok(JSON.stringify(f.vis) === JSON.stringify(oc.viditelne), `farby: viditeľné len vzorky, ktoré produkt ${p.id} má (${f.vis.length}): ${f.vis.join(", ")} — čakám ${oc.viditelne.length}: ${oc.viditelne.join(", ")}`);
      ok(f.viac === (oc.pocetFarieb - oc.viditelne.length >= 3), `farby: „Mnoho ďalších farieb“ ${f.viac ? "je" : "nie je"} (produkt má ${oc.pocetFarieb} farieb, vzoriek ${oc.viditelne.length})`);
    } else {
      ok(f.vsetky === oc.pocetFarieb && f.velkych === oc.pocetFarieb && f.vis.length === oc.pocetFarieb,
        `farby ${p.id}: vzorky vlastného vzoru = všetky farby produktu (${f.vsetky} vzoriek / ${f.velkych} fotiek / ${f.vis.length} viditeľných, živá stránka ${oc.pocetFarieb})`);
      const zle = f.vis.filter((n, i) => !zhoda(n, oc.farbyTexty[i]));
      ok(!zle.length, `farby ${p.id}: názvy vzoriek v poradí volieb živej stránky (${f.vis.join(", ")})` + (zle.length ? " — nesedí: " + zle.join(", ") : ""));
      ok(f.n === L.vzorka + " · " + { stripe: "Stripe Line", hexa: "Hexa Line" }[p.vzor] && !f.diamond, `farby ${p.id}: „${f.n}“, žiadna vzorka Diamond Line (${f.diamond})`);
      ok(f.viac === false, `farby ${p.id}: „Mnoho ďalších farieb“ na vlastný konfigurátor skryté (všetky farby sú vo vzorkách)`);
    }
    ok(f.prva === "true" && f.meno === L.prvaFarba, `farby: predvolená je „${f.meno}“ (prvá vzorka vybraná ${f.prva})`);
    ok(f.stitok.endsWith("/ " + dve(viditelne.length)), `farby: počítadlo „${f.stitok}“ = / ${dve(viditelne.length)}`);
    if (viditelne.length > 1) {
      try {
        await t.klikni(F + " .lx-farby-vzorka", { index: 1, popis: "2. viditeľná vzorka farby", pockaj: 400 });
        await t.cakaj(`(function () { var s = document.querySelector(${JSON.stringify(F)}); return s.querySelector(".lx-farby-meno").textContent.trim() !== ${JSON.stringify(L.prvaFarba)}; })()`, { ms: 4000, popis: "názov farby sa zmenil" });
        const po = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(F)}); return { meno: s.querySelector(".lx-farby-meno").textContent.trim(), cislo: s.querySelector(".lx-farby-cislo").textContent, on: [].filter.call(s.querySelectorAll(".lx-farby-velka img"), function (i) { return i.classList.contains("on"); }).length }; })()`);
        ok(po.meno === viditelne[1] && po.cislo === "02" && po.on === 1, `farby: klik na 2. vzorku prepne názov „${po.meno}“, číslo „${po.cislo}“ (poradie medzi viditeľnými) a jednu veľkú fotku`);
      } catch (e) { ok(false, "farby: " + e.message); }
    }
  }
  if (je["c-vzorky"]) {
    await stredu(S("c-vzorky"));
    const vz = await t.cakaj(`(function () { var e = document.querySelector(${sj("c-vzorky")}), im = e.querySelectorAll(".fan img"); var hotovo = [].every.call(im, function (i) { return i.complete && i.naturalWidth > 0; }); return hotovo && [im.length, e.querySelector("a.btn").getAttribute("href")]; })()`, { ms: 8000, popis: "vejár vzoriek" }).catch((e) => [0, e.message]);
    ok(vz[0] === 5 && /vzorkovnik/.test(vz[1]), `vzorky: 5 fotiek vejára stiahnutých, odkaz na vzorkovník (${JSON.stringify(vz)})`);
  }

  // ------------------------------------------------------------------ 11) realita, FAQ, záver
  if (je["d-realita"]) {
    const s = S("d-realita");
    const d = await t.ev(`(function () { var e = document.querySelector(${JSON.stringify(s)}); var k = [].slice.call(e.querySelectorAll(".vids > .vid"));
      return { n: k.length, yt: k.every(function (b) { return /^[\\w-]{6,20}$/.test(b.getAttribute("data-p1v-lb-yt") || ""); }) }; })()`);
    ok(d.n === 5 && d.yt, `realita: 5 dlaždíc s YouTube id (${d.n})`);
    if (await t.je("d-pomocne")) {
      await t.klikni(s + " .vids > .vid", { index: 0, popis: "realita: prvé video", pockaj: 600 });
      const o = await t.ev(`(function () { var lb = document.getElementById("p1v-lb"), f = lb && lb.querySelector("iframe"); return { otv: !!lb && !lb.hidden, yt: !!f && /youtube-nocookie\\.com\\/embed\\//.test(f.getAttribute("src") || "") }; })()`);
      ok(o.otv && o.yt, `realita: klik otvorí video v okne #p1v-lb (otvorené ${o.otv}, YouTube ${o.yt})`);
      await t.ev(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
      await t.pauza(450);
    }
  }
  if (je["d-faq"]) {
    // FAQ = živé FAQ z /faq/ doslovne (rozhodnutie Michala 14. 10. 2026): 12 otázok, bez cien a odkazov podľa vzoru (tie boli v starom FAQ 9–11)
    const s = S("d-faq");
    const d = await t.ev(`(function () { var e = document.querySelector(${JSON.stringify(s)}); var b = [].slice.call(e.querySelectorAll(".p1v-faq-q"));
      return { n: b.length, typ: b.every(function (x) { return x.type === "button" && !x.closest("form") && x.getAttribute("aria-expanded") === "false" && document.getElementById(x.getAttribute("aria-controls")) === x.nextElementSibling; }),
        cisla: [].map.call(e.querySelectorAll(".p1v-faq-q .i"), function (x) { return x.textContent; }).join(","), zakazane: e.querySelectorAll(".faq, .accordion, details").length,
        znacky: e.querySelectorAll("[data-p1v-cislo], [data-p1v-odkaz], [data-cl-ceny], [data-cl-bez]").length }; })()`);
    ok(d.n === 12 && d.typ && d.cisla === Array.from({ length: 12 }, (_, i) => dve(i + 1)).join(","), `faq: 12 otázok (01–12) = button type=button mimo formulára, aria-controls na odpoveď (${d.n})`);
    ok(d.zakazane === 0, "faq: bez .faq/.accordion/<details> (kotvy živého JS, TinyMCE)");
    ok(d.znacky === 0, `faq: bez dosadzovaných čísel a odkazov (živý text, ${d.znacky} značiek)`);
    const fz = await kontrolaFaqZive(t, s);
    ok(fz.ok, fz.popis);
    const pred = await t.ev("location.href");
    await t.klikni(s + " .p1v-faq-q", { index: 5, popis: "faq: 6. otázka", pockaj: 300 });
    await t.cakaj(`(function () { var b = document.querySelectorAll(${JSON.stringify(s + " .p1v-faq-q")})[5]; return b.nextElementSibling.getBoundingClientRect().height > 30; })()`, { ms: 4000, popis: "faq: odpoveď sa rozbalila" }).catch(() => null);
    const o = await t.ev(`(function () { var b = document.querySelectorAll(${JSON.stringify(s + " .p1v-faq-q")})[5], a = b.nextElementSibling;
      return { exp: b.getAttribute("aria-expanded"), h: Math.round(a.getBoundingClientRect().height), vis: getComputedStyle(a).visibility, txt: a.textContent.trim().slice(0, 40) }; })()`);
    ok(o.exp === "true" && o.h > 30 && o.vis === "visible" && L.faq6.test(o.txt), `faq: klik na 6. otázku rozbalí odpoveď (výška ${o.h}, „${o.txt}…“)`);
    await t.klikni(s + " .p1v-faq-q", { index: 5, popis: "faq: 6. otázka znova", pockaj: 300 });
    await t.cakaj(`(function () { var b = document.querySelectorAll(${JSON.stringify(s + " .p1v-faq-q")})[5]; return b.nextElementSibling.getBoundingClientRect().height < 2; })()`, { ms: 4000, popis: "faq: odpoveď sa zbalila" }).catch(() => null);
    const z = await t.ev(`(function () { var b = document.querySelectorAll(${JSON.stringify(s + " .p1v-faq-q")})[5]; return { exp: b.getAttribute("aria-expanded"), h: Math.round(b.nextElementSibling.getBoundingClientRect().height) }; })()`);
    ok(z.exp === "false" && z.h < 2 && (await t.ev("location.href")) === pred, "faq: druhý klik odpoveď zbalí, nič sa neodoslalo");
  }
  if (je["d-koniec"]) {
    const s = S("d-koniec");
    await stredu(s);
    await t.pauza(500);
    const d = await t.ev(`(function () { var e = document.querySelector(${JSON.stringify(s)}); var h = e.querySelector("h2");
      return { h2: h && h.textContent.trim(), lede: e.querySelector(".lede").textContent.trim(), tl: [].map.call(e.querySelectorAll(".end-cta a"), function (a) { return a.textContent.trim(); }).join(" | ") }; })()`);
    ok(d.h2 === L.koniecH2 && L.koniecLede.test(d.lede) && d.tl === L.koniecTl, `záver: „${d.h2}“, úvod o rohoži do kufra, tlačidlá (${d.tl})`);
  }

  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"]'), function (f) { f.style.removeProperty("visibility"); })`);
  // pásy späť na začiatok a myš preč (snímky sekcií po kontrolách nech nemajú posunutý pás ani :hover)
  await t.ev(`[].forEach.call(document.querySelectorAll('.p1v-miesto :is(.deck.refs, .revs, .vids)'), function (p) { p.scrollLeft = 0; })`);
  await t.k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 }).catch(() => {});
  return out;
}
