// Obsah 1V typu „premium“ (rohož Premium 628/631/634) — mapa sekcií (web ↔ návrh kufor-premium.html) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: T2.4. Pravidlá: docs/1v-obsah.md („Testy“). Spec: prieskum-vsetky/navrh-kufor-premium.md §6.
//
// test-1v-obsah.mjs pre kľúč obsahu „premium“ spustí tento plugin (namiesto A–D, ktoré overujú obsah 598 s jeho počtami).
// Základ (korene, miesto, sekcie viditeľné a odhalené, čísla data-p1v-cislo dosadené, odkazy data-p1v-odkaz v tom istom vzore,
// sonda, konzola, vodorovný posun) overuje test sám pre každý kľúč. Tu: poradie a počty sekcií, ceny a odkazy podľa vzoru
// (628 340 €, 631/634 350 €; Classic v tom istom vzore), mapa #kryje (klik, prechod myšou, zóny), päť vecí, pred a po s troma
// bodmi, FAQ = živé FAQ z /faq/ doslovne (12 otázok, tools/test-1v/obsah-faq.mjs), texty mimo FAQ bez zakázaných formulácií (žiadny
// „kovový štítok“, žiadne „skladom“) a bez cien natvrdo; rozhodnutia Michala 14. 10. 2026: logo Luxury Car Design (úvod, čip) a lehota
// 21–29 dní (časová os); CSS partial = každý selektor pod body.lcd-1v, štýly A–D platia na koreni p1v-premium-N
// (jadro ich cieli na p1v-598-N; kontrola prejde aj po oprave jadra, keď sa dočasná kópia v partiali zmaže).
import { readFileSync } from "node:fs";
import { kontrolaFaqZive } from "./obsah-faq.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SKUPINA = "premium";
export const NAVRH = "kufor-premium.html";
/** skupiny A–D, ktorých kontroly platia aj pre tento obsah (bez zmeny): žiadne — A–D overujú počty obsahu 598 */
export const zdielane = [];
export const sekcie = [
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Ku kufru patria aj koberce do auta" }] },
  { meno: "a-referencie", navrh: [{ sel: "#referencie" }] },
  { meno: "a-galeria", navrh: [{ sel: "#galeria" }] },
  { meno: "a-recenzie", navrh: [{ sel: "#recenzie" }] },
  { meno: "b-ocakavat", navrh: [{ sel: "#ocakavat" }, { sel: "#s2Mob" }] },
  { meno: "b-material", navrh: [{ sel: "#material" }] },
  { meno: "premium-porovnanie", navrh: [{ sel: "#porovnanie" }, { sel: ".spat", za: "#porovnanie" }] },
  { meno: "b-predapo", navrh: [{ sel: "#predapo" }] },
  { meno: "premium-kryje", navrh: [{ sel: "#kryje" }, { sel: ".spat", za: "#kryje" }] },
  { meno: "c-domov", navrh: [{ sel: "section.chapter", text: "Čo Vám príde domov" }] },
  { meno: "c-casova-os", navrh: [{ sel: "section.chapter", text: "Od objednávky po doručenie" }, { sel: ".spat", pred: "#farby" }] },
  { meno: "c-farby", navrh: [{ sel: "#farby" }] },
  { meno: "c-vzorky", navrh: [{ sel: "#vzorky" }] },
  { meno: "d-realita", navrh: [{ sel: "#realita" }] },
  { meno: "d-faq", navrh: [{ sel: "section.chapter.faqsec" }] },
  { meno: "d-koniec", navrh: [{ sel: "section.end" }] },
];

/** poradie sekcií v obsahu (kus 1 potom kus 2) — rovnaké ako v návrhu */
const PORADIE = ["a-ponuka", "a-referencie", "a-galeria", "a-recenzie", "b-ocakavat", "b-material", "premium-porovnanie", "b-predapo",
  "premium-kryje", "c-domov", "c-casova-os", "c-farby", "c-vzorky", "d-realita", "d-faq", "d-koniec", "d-pomocne"];
/** základné ceny (plan.md §4): Premium 628 340 €, 631/634 350 €; Classic tej istej línie 230 / 240 / 240 € */
const CENY = { 628: { premium: 340, classic: 230 }, 631: { premium: 350, classic: 240 }, 634: { premium: 350, classic: 240 } };
const KLASIK = { 628: "/luxusny-koberced-do-kufra-dragonskin-klasik/", 631: "/luxusny-koberced-do-kufra-dragonskin-klasik-hexa/", 634: "/luxusny-koberced-do-kufra-dragonskin-klasik-stripe/" };
/** zákaznícke texty mimo FAQ (docs/1v-obsah.md bod 4): žiadne „na milimeter“, 1. osoba „vyrábame“, názvy materiálu, fixačné body,
 *  „Comfort“, počet vrstiev; na rohoži je logo, nie kovový štítok (Michal 14. 10. 2026); žiadne „skladom“. Lehota 21–29 dní a logo áno. */
const ZAKAZANE = /na\s+milimeter|vyr[aá]bame|dragon\s*skin|\belite\b|\bbasic\b|comfort|fixa[čc]n|kovov|štítok|štitok|skladom|(p[aä][ťt]|\d)\s*vrstie?v/i;
const KOREN = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** selektory partialu, ktoré nezačínajú body.lcd-1v (komentáre preč, @media rozbalené) */
function zleSelektory() {
  const css = readFileSync(join(KOREN, "assets/css/_lcd1v-obsah-premium.scss"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const zle = [];
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const s = m[1].trim();
    if (!s || s.startsWith("@media") || s.startsWith("@supports")) continue;
    if (s.startsWith("@")) { zle.push(s.slice(0, 40)); continue; }
    let h = 0, kus = "";
    const casti = [];
    for (const ch of s) {
      if (ch === "(") h++;
      if (ch === ")") h--;
      if (ch === "," && h === 0) { casti.push(kus.trim()); kus = ""; } else kus += ch;
    }
    casti.push(kus.trim());
    for (const c of casti) if (c && !/^body\.lcd-1v\b/.test(c)) zle.push(c.slice(0, 60));
  }
  return zle;
}

export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const S = (m) => JSON.stringify(t.sekcia(m));
  const id = t.produkt && t.produkt.id;
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
  const staticka = await t.ev(`matchMedia("(max-width:900px), (min-width:901px) and (max-width:1199px) and (orientation:portrait) and (hover:none) and (pointer:coarse)").matches`);

  // ---------------------------------------------------------------- poradie a prítomnosť sekcií
  // sekcia x-sonda-cisla sa pridáva len v --sonda-cisla (test ju vkladá do 1. kusu) — do poradia nepatrí
  const poradie = (await t.ev(`[].map.call(document.querySelectorAll('.p1v-miesto [data-lcd-sekcia]'), function (e) { return e.getAttribute("data-lcd-sekcia"); })`)).filter((m) => m !== "x-sonda-cisla");
  ok(JSON.stringify(poradie) === JSON.stringify(PORADIE), `sekcie v poradí návrhu (${poradie.length}/${PORADIE.length}): ${poradie.join(" > ")}`);
  for (const s of sekcie) ok(await t.je(s.meno), `${s.meno}: sekcia je na stránke`);

  // ---------------------------------------------------------------- štýly skupín A–D a základu obsahu platia na koreni p1v-premium-N
  // (jadro ich cieli na #p1v-598-N; bez tejto kontroly prejde test aj s neštýlovanou stránkou — zlatý nadpis, tmavé karty .ups, FAQ)
  const styl = await t.ev(`(function () { var m = document.querySelector(".p1v-miesto");
    var cs = function (e, p) { return e ? getComputedStyle(e)[p] : null; };
    var h2 = m.querySelector('[data-lcd-sekcia="a-referencie"] h2'), ups = m.querySelector('[data-lcd-sekcia="a-ponuka"] .ups'),
      fq = m.querySelector(".p1v-faq-q"), fa = m.querySelector(".p1v-faq-a"), lede = m.querySelector(".lede"), ch = m.querySelector("section.chapter[data-lcd-kap]");
    return { h2: cs(h2, "webkitTextFillColor"), upsBg: cs(ups, "backgroundColor"), upsD: cs(ups, "display"), fq: cs(fq, "display"), fa: cs(fa, "display"),
      ledeMax: cs(lede, "maxWidth"), pad: ch ? Math.round(parseFloat(cs(ch, "paddingTop"))) : null }; })()`);
  ok(styl.h2 === "rgba(0, 0, 0, 0)", `štýly A–D na koreni: nadpis sekcie je zlatý prechod (text-fill ${styl.h2})`);
  ok(styl.upsD === "grid" && styl.upsBg && styl.upsBg !== "rgba(0, 0, 0, 0)", `štýly A–D na koreni: karty .ups sú tmavé (display ${styl.upsD}, pozadie ${styl.upsBg})`);
  ok(styl.fq === "flex" && styl.fa === "grid", `štýly D na koreni: FAQ otázka flex, odpoveď grid (${styl.fq}/${styl.fa})`);
  ok(styl.ledeMax && styl.ledeMax !== "none" && styl.pad > 20, `štýly základu na koreni: .lede má max-width (${styl.ledeMax}), kapitola odsadenie ${styl.pad} px`);

  // ---------------------------------------------------------------- texty: zakázané formulácie, ceny natvrdo, D3
  const txt = await t.ev(`(function () {
    var m = document.querySelector(".p1v-miesto"); if (!m) return null;
    var k = m.cloneNode(true);
    // recenzie = texty zákazníkov, FAQ = živý text z /faq/ (kontrolaFaqZive) — nie nové tvrdenia
    [].forEach.call(k.querySelectorAll("script,style,svg,[data-lcd-sekcia='a-recenzie'],[data-lcd-sekcia='d-faq']"), function (x) { x.remove(); });
    var bezCien = k.cloneNode(true);
    [].forEach.call(bezCien.querySelectorAll("[data-p1v-cislo]"), function (x) { x.remove(); });
    var t = (k.textContent || "").replace(/\\s+/g, " ");
    var alt = [].map.call(k.querySelectorAll("[alt],[aria-label],[data-p1v-lb-popis]"), function (x) { return (x.getAttribute("alt") || "") + " " + (x.getAttribute("aria-label") || "") + " " + (x.getAttribute("data-p1v-lb-popis") || ""); }).join(" ");
    return { text: t + " " + alt, bezCien: (bezCien.textContent || "").replace(/\\s+/g, " ") };
  })()`);
  const zl = txt ? (txt.text.match(new RegExp(ZAKAZANE.source, "gi")) || []) : ["(bez textu)"];
  ok(zl.length === 0, `texty mimo FAQ: bez zakázaných formulácií (kovový štítok, skladom, počet vrstiev…)${zl.length ? " — nájdené: " + [...new Set(zl.map((x) => x.toLowerCase()))].join(", ") : ""}`);
  const ceny = txt ? (txt.bezCien.match(/\d[\d\s ]*[,.]?\d*\s*(€|eur|Kč)/gi) || []) : [];
  ok(ceny.length === 0, `texty mimo FAQ: žiadna cena natvrdo mimo data-p1v-cislo${ceny.length ? " — nájdené: " + ceny.slice(0, 4).join(" | ") : ""}`);

  // ---------------------------------------------------------------- a-ponuka: dve karty, odkazy podľa vzoru, žiadna cena natvrdo
  if (await t.je("a-ponuka")) {
    await t.ev(`(function () { document.querySelector(${S("a-ponuka")}).scrollIntoView({ block: "start", behavior: "instant" }); })()`);
    await t.pauza(1200);
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("a-ponuka")}), u = [].slice.call(s.querySelectorAll(".ups"));
      return { n: u.length, odkazy: u.map(function (x) { var a = x.querySelector("a.btn"); return a ? a.getAttribute("href").split("#")[0] : null; }),
        znacky: u.map(function (x) { var a = x.querySelector("a.btn"); return a ? a.getAttribute("data-p1v-odkaz") : null; }),
        img: u.map(function (x) { var i = x.querySelector("img"); return !!(i && i.complete && i.naturalWidth > 0); }),
        cisla: u.map(function (x) { return [].map.call(x.querySelectorAll("[data-p1v-cislo]"), function (c) { return c.getAttribute("data-p1v-cislo") + "=" + (c.textContent || "").trim().replace(/\\u00a0/g, " "); }); }) };
    })()`);
    ok(r.n === 2, `a-ponuka: dve karty .ups (${r.n})`);
    const jedno = t.sestra("jedno");
    ok(r.odkazy[0] === jedno && r.znacky[0] === "jedno", `a-ponuka: „Zostavte si set s autokobercami“ vedie na jednovrstvové toho istého vzoru (${r.odkazy[0]}, čakám ${jedno})`);
    ok(r.odkazy[1] === "/luxusny-boxi-do-kufra/" && r.znacky[1] === "boxy", `a-ponuka: „Pozrite si boxy do kufra“ vedie na box (${r.odkazy[1]})`);
    ok(r.img.every(Boolean), `a-ponuka: obe fotky sa načítali (${r.img.join(",")})`);
    const c0 = r.cisla[0].join(" | "), c1 = r.cisla[1].join(" | ");
    // Michal 17. 10. 2026: cena v sete bez „+“ („stojí len 239 € namiesto 340 €“, „len za 239 € (samostatne 340 €)“)
    ok(/set-premium=\d/.test(c0) && /cena-od=\d/.test(c0) && !/\+/.test(c0), `a-ponuka: set „len … namiesto / samostatne …“ zo živých dát, bez „+“ (${c0})`);
    ok(/box-sam-s=\d/.test(c1) && /box-set-s=\d/.test(c1), `a-ponuka: box „Samostatne od …“ a „S autokobercami pod sedadlá už od …“ zo živých dát (${c1})`);
  }

  // ---------------------------------------------------------------- b-ocakavat: päť vecí
  if (await t.je("b-ocakavat")) {
    const sek = t.sekcia("b-ocakavat");
    const v = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)});
      return { h2: s.querySelector("h2").textContent.trim(), lede: s.querySelector(".pinhead .lede").textContent.trim(), chipTexty: [].map.call(s.querySelectorAll(".chip"), function (c) { return c.textContent.trim(); }), fotky: s.querySelectorAll(".s2-media img").length, texty: s.querySelectorAll(".s2-t").length,
        bodky: s.querySelectorAll(".s2-rail button").length, nahlady: s.querySelectorAll(".s2-thumbs button").length, chipy: s.querySelectorAll(".chip").length,
        cisloFarieb: (s.querySelector("[data-p1v-cislo='pocet-farieb']") || {}).textContent || "", vzor: ((s.querySelector("[data-p1v-cislo='vzor']") || {}).textContent || "").trim() }; })()`);
    ok(v.fotky === 5 && v.texty === 5 && v.bodky === 5 && v.nahlady === 5 && v.chipy === 6, `b-ocakavat: päť vecí (fotky ${v.fotky}, texty ${v.texty}, bodky ${v.bodky}, náhľady ${v.nahlady}, čipy ${v.chipy} s „Logo pravosti“); nadpis „${v.h2}“`);
    ok(v.chipTexty[1] === "Logo pravosti" && v.lede === "Nie je to o materiáli na fotke. Je to o strihu, o logu Luxury Car Design, ktoré kópia nemá, a o tom, ako sa rohož do kufra správa v každodennom používaní.",
      `b-ocakavat: logo podľa rozhodnutia Michala 14. 10. 2026 — čip 2 „${v.chipTexty[1]}“, úvod „${v.lede}“`);
    ok(/^\d+\s/.test(v.cisloFarieb.trim()), `b-ocakavat: počet farieb tohto vzoru zo živých dát („${v.cisloFarieb.trim().replace(/ /g, " ")}“)`);
    const vz = String((t.produkt && t.produkt.vzor) || "").toLowerCase();
    ok(/^(Diamond|Hexa|Stripe) Line$/.test(v.vzor) && vz && v.vzor.toLowerCase().startsWith(vz), `b-ocakavat: vzor tohto produktu zo živých dát („${v.vzor}“, čakám ${vz} Line)`);
    if (staticka) {
      await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); s.scrollIntoView({ block: "start", behavior: "instant" }); })()`);
      await t.pauza(500);
      const k = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), m = s.querySelector(".pinmain"), cw = document.documentElement.clientWidth;
        var im = [].slice.call(s.querySelectorAll(".s2-media img")).map(function (i) { return i.getBoundingClientRect(); });
        var bod = [].slice.call(s.querySelectorAll(".s2-rail button")).map(function (b) { var r = b.getBoundingClientRect(); return [Math.round((r.top + r.bottom) / 2), Math.round(r.left), Math.round(r.right)]; });
        var posledna = im[im.length - 1];
        return { posuv: m.scrollWidth > m.clientWidth + 50, karty: im.length, riadok: new Set(im.map(function (r) { return Math.round(r.top); })).size === 1,
          bodky: bod.length, jedenRiadok: bod.every(function (b) { return Math.abs(b[0] - bod[0][0]) <= 3; }), vOkne: bod.every(function (b) { return b[1] >= 0 && b[2] <= cw; }),
          // 5 kariet po 86 % + 4 medzery: za poslednou kartou nesmie byť prázdny posuvný priestor (9 stĺpcov z 598)
          volno: Math.round(m.scrollWidth - (m.scrollLeft + posledna.right - m.getBoundingClientRect().left)), };
      })()`);
      ok(k.posuv && k.karty === 5 && k.riadok, `b-ocakavat (karusel): posuvný pás, ${k.karty} kariet v jednom riadku`);
      ok(k.bodky === 5 && k.jedenRiadok && k.vOkne, `b-ocakavat (karusel): ${k.bodky} bodiek v jednom riadku v okne`);
      ok(k.volno >= -2 && k.volno <= 40, `b-ocakavat (karusel): za poslednou kartou bez prázdneho posuvného priestoru (${k.volno} px)`);
      await t.klikni(sek + " .s2-rail button", { index: 3, popis: "bodka 4", pockaj: 1200 });
      const po = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), m = s.querySelector(".pinmain"), r = m.getBoundingClientRect();
        var i = s.querySelectorAll(".s2-media img")[3].getBoundingClientRect(); var on = s.querySelector(".s2-rail button.on");
        return { odchylka: Math.round(Math.abs(i.left + i.width / 2 - (r.left + r.width / 2))), on: on ? on.getAttribute("data-i") : null }; })()`);
      ok(po.odchylka < 24 && po.on === "3", `b-ocakavat (karusel): bodka 4 posunula kartu 4 do stredu (odchýlka ${po.odchylka} px, aktívna ${po.on})`);
    } else {
      const v2 = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)} + " .stage2"); return { h: s.getBoundingClientRect().height, cak: 5 * 0.62 * innerHeight, pin: getComputedStyle(s.querySelector(".pin2")).position }; })()`);
      ok(Math.abs(v2.h - v2.cak) < 3 && v2.pin === "sticky", `b-ocakavat (PC): scéna ${Math.round(v2.h)} px = 5 × 62 vh (${Math.round(v2.cak)}), prilepená (${v2.pin})`);
      await t.ev(`(async function () { var el = document.querySelector(${JSON.stringify(sek)} + " .stage2"); var r = el.getBoundingClientRect(), top = r.top + scrollY;
        var y = top + 0.7 * Math.max(0, r.height - innerHeight); scrollTo({ top: Math.max(0, y - 400), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 150); });
        scrollTo({ top: y, behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 500); }); })()`);
      const k = await t.cakaj(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); var on = s.querySelector(".s2-t.on"), im = s.querySelector(".s2-media img.on");
        return on && im && on.getAttribute("data-i") === "3" && im.getAttribute("data-i") === "3" ? s.querySelector(".s2-big").textContent : ""; })()`, { ms: 3000, popis: "krok 4 pri 70 %" }).catch(() => "");
      ok(k === "04", `b-ocakavat (PC): pri 70 % scény je krok 04 (číslo „${k || "—"}“)`);
      const th = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(sek)} + " .s2-thumbs button[data-i='4']"); var a = document.querySelector(${JSON.stringify(sek)} + " .s2-thumbs button[data-i='1']");
        return [b ? getComputedStyle(b, ":before").backgroundImage : "", a ? getComputedStyle(a, ":before").backgroundImage : ""]; })()`);
      ok(/premium-diamond-boxy-2\.jpg/.test(th[0]) && /premium-diamond-bok\.jpg/.test(th[1]), "b-ocakavat (PC): náhľady 02 a 05 majú fotky Premium z CSS");
      const st = await t.ev(`(function () { var g = getComputedStyle(document.querySelector(${JSON.stringify(sek)} + " .s2-thumbs")).gridTemplateColumns.split(" ").length; return g; })()`);
      ok(st === 5, `b-ocakavat (PC): náhľady v 5 stĺpcoch (${st})`);
    }
  }

  // ---------------------------------------------------------------- b-predapo: tri body, bez počítadla %
  if (await t.je("b-predapo")) {
    const sek = t.sekcia("b-predapo");
    const r = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); var sw = [].map.call(s.querySelectorAll(".lx-leg-r"), function (x) { return getComputedStyle(x.querySelector(".lx-leg-sw")).backgroundImage; });
      var pomer = getComputedStyle(s.querySelector(".lx-pp-main")).getPropertyValue("--lx-pomer").trim();
      return { body: s.querySelectorAll(".lx-leg-r").length, pocitadlo: !!s.querySelector(".lx-pocet,.lx-pp-cislo"), sw: sw, pomer: pomer,
        podtext: getComputedStyle(s.querySelector(".lx-leg-t span")).display, titul: [].map.call(s.querySelectorAll(".lx-leg-t b"), function (b) { return b.textContent; }) }; })()`);
    ok(r.body === 3 && !r.pocitadlo, `b-predapo: 3 body legendy (${r.titul.join(" · ")}) a bez počítadla %`);
    ok(/premium-pp-dno/.test(r.sw[0]) && /premium-pp-boky/.test(r.sw[1]) && /premium-pp-operadla/.test(r.sw[2]), "b-predapo: vzorky legendy sú fotky Premium z CSS");
    ok(r.podtext === "none", "b-predapo: legenda len s nadpismi (ako návrh)");
    ok(r.pomer === "1.5", `b-predapo: pomer fotky 1,5 ako návrh (${r.pomer})`);
    // čiara a body sa pohnú pri scrollovaní
    const q = await t.ev(`(async function () { var s = document.querySelector(${JSON.stringify(sek)}); var r0 = s.getBoundingClientRect(), top = r0.top + scrollY;
      var vys = function (p) { return top + p * Math.max(0, r0.height - innerHeight); };
      scrollTo({ top: Math.max(0, vys(0.1) - 300), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 150); });
      scrollTo({ top: vys(0.95), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 700); });
      return [].filter.call(s.querySelectorAll(".lx-leg-r"), function (x) { return x.classList.contains("on"); }).length; })()`);
    ok(q === 3, `b-predapo: pri konci scény svietia všetky 3 body (${q})`);
  }

  // ---------------------------------------------------------------- premium-porovnanie: ceny, odkaz na Classic toho istého vzoru
  if (await t.je("premium-porovnanie")) {
    const sek = t.sekcia("premium-porovnanie");
    await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); s.scrollIntoView({ block: "start", behavior: "instant" }); })()`);
    await t.pauza(900);
    const r = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)});
      var nb = function (x) { return (x || "").replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(); };
      var st = function (c) { return [].map.call(c.querySelectorAll("li"), function (li) { return { ic: li.querySelector(".ic").textContent, t: nb(li.textContent.replace(li.querySelector(".ic").textContent, "")) }; }); };
      var us = s.querySelector(".cmp-col.us"), kl = s.querySelector(".cmp-col.klas");
      var dalej = [].map.call(s.querySelectorAll(".cmp-dalej a"), function (a) { return { href: a.getAttribute("href"), text: nb(a.textContent) }; });
      return { stlpce: s.querySelectorAll(".cmp-col").length, cenaUs: nb(us.querySelector(".price").textContent), cenaKl: nb(kl.querySelector(".price").textContent),
        us: st(us), kl: st(kl), dalej: dalej, h2: nb(s.querySelector("h2").textContent), obe: [].map.call(s.querySelectorAll(".cmp-col .ph img"), function (i) { return i.complete && i.naturalWidth > 0; }),
        filter: getComputedStyle(kl.querySelector(".ph img")).filter, spat: !!s.querySelector(".spat .spat-btn") }; })()`);
    const ce = CENY[id];
    ok(r.stlpce === 2 && r.h2 === "Premium alebo Classic?" && r.obe.every(Boolean), `premium-porovnanie: 2 stĺpce „${r.h2}“, obe fotky sa načítali`);
    if (ce) {
      ok(r.cenaUs === `od ${ce.premium} €`, `premium-porovnanie: Premium „${r.cenaUs}“ (čakám od ${ce.premium} €)`);
      ok(r.cenaKl === `od ${ce.classic} €`, `premium-porovnanie: Classic „${r.cenaKl}“ (čakám od ${ce.classic} €)`);
      // Michal 17. 10. 2026: „Spolu s autokobercami pod sedadlá — Len za X € (samostatne Y €)“, nie „+ X € namiesto Y €“
      const klSet = r.kl.find((x) => /pod sedadlá/.test(x.t)), usSet = r.us.find((x) => /pod sedadlá/.test(x.t));
      ok(usSet && new RegExp(`^Spolu s autokobercami pod sedadláLen za \\d+ € \\(samostatne ${ce.premium} €\\)$`).test(usSet.t), `premium-porovnanie: Premium s autokobercami „${usSet && usSet.t}“`);
      ok(klSet && new RegExp(`^Spolu s autokobercami pod sedadláLen za \\d+ € \\(samostatne ${ce.classic} €\\)$`).test(klSet.t), `premium-porovnanie: Classic s autokobercami „${klSet && klSet.t}“`);
    }
    ok(r.us.length === 4 && r.kl.length === 4 && ![...r.us, ...r.kl].some((x) => /Farby|Vzory/.test(x.t)),
      `premium-porovnanie: 4 riadky v každom stĺpci, bez riadku Farby/Vzory — nič, čo nie je v návrhu (${r.us.length}/${r.kl.length})`);
    ok(r.us.every((x) => x.ic === "✓") && r.kl.filter((x) => x.ic === "✕").length === 2 && /Boky/.test(r.kl.filter((x) => x.ic === "✕")[0].t) && /Chrbty/.test(r.kl.filter((x) => x.ic === "✕")[1].t),
      "premium-porovnanie: Premium kryje dno, boky aj chrbty; Classic nekryje boky ani chrbty");
    ok(r.filter === "none", `premium-porovnanie: fotka Classic bez šedého filtra (${r.filter})`);
    const cl = r.dalej.find((a) => /Classic/.test(a.text)), pr = r.dalej.find((a) => /Premium/.test(a.text));
    ok(cl && String(cl.href).split("#")[0] === KLASIK[id], `premium-porovnanie: „Pozrite si rohož do kufra Classic“ vedie na ${cl && cl.href} (čakám ${KLASIK[id]})`);
    ok(pr && pr.href === "#product-detail-form" && r.spat, "premium-porovnanie: „Vyberte si Premium“ a výzva vedú na konfigurátor");
  }

  // ---------------------------------------------------------------- premium-kryje: mapa krytia
  if (await t.je("premium-kryje")) {
    const sek = t.sekcia("premium-kryje");
    await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); s.scrollIntoView({ block: "start", behavior: "instant" }); })()`);
    await t.pauza(900);
    const d = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), f = s.querySelector(".kryv-f");
      var op = function (sel) { var e = f.querySelector(sel); return e ? +getComputedStyle(e).opacity : null; };
      var im = f.querySelector("img");
      return { z: f.getAttribute("data-z"), tlac: s.querySelectorAll(".kz").length, polygony: f.querySelectorAll("svg polygon").length, vb: f.querySelector("svg").getAttribute("viewBox"),
        foto: im.getAttribute("src").split("/").pop(), ok: im.complete && im.naturalWidth > 0, pn: f.querySelectorAll(".pn").length,
        vsetky: [op(".z-dno"), op(".z-boky"), op(".z-operadla")], on: [].map.call(s.querySelectorAll(".kz.on"), function (b) { return b.getAttribute("data-z"); }),
        stlpce: getComputedStyle(s.querySelector(".kryv")).gridTemplateColumns.split(" ").length }; })()`);
    ok(d.tlac === 4 && d.polygony === 5 && d.vb === "0 0 1600 1600" && d.pn === 3, `premium-kryje: 3 plochy + „všetko“, ${d.polygony} zón v SVG 1600×1600, ${d.pn} čísla`);
    ok(/premium-diamond-celok\.jpg$/.test(d.foto) && d.ok, `premium-kryje: vždy fotka premium-diamond-celok.jpg (${d.foto}), načítaná`);
    ok(d.z === "vsetko" && d.vsetky.every((o) => o === 1) && d.on.join() === "vsetko", `premium-kryje: na začiatku svietia všetky zóny (data-z=${d.z}, opacity ${d.vsetky.join("/")})`);
    const sirka = await t.ev("innerWidth");
    ok(d.stlpce === (sirka >= 901 ? 2 : 1), `premium-kryje: ${sirka >= 901 ? "fotka a plochy vedľa seba" : "pod sebou"} pri ${sirka} px (stĺpce ${d.stlpce})`);
    // skutočný klik na „Boky kufra“
    await t.klikni(sek + " .kz", { index: 1, popis: "Boky kufra", pockaj: 700 });
    const b = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), f = s.querySelector(".kryv-f");
      var op = function (sel) { return +getComputedStyle(f.querySelector(sel)).opacity; };
      return { z: f.getAttribute("data-z"), op: [op(".z-dno"), op(".z-boky"), op(".z-operadla")], on: [].map.call(s.querySelectorAll(".kz.on"), function (x) { return x.getAttribute("data-z"); }),
        pressed: [].map.call(s.querySelectorAll(".kz[aria-pressed='true']"), function (x) { return x.getAttribute("data-z"); }) }; })()`);
    ok(b.z === "boky" && b.op[1] === 1 && b.op[0] === 0 && b.op[2] === 0 && b.on.join() === "boky" && b.pressed.join() === "boky",
      `premium-kryje: klik na „Boky kufra“ nastaví data-z=${b.z}, svieti len zóna bokov (opacity ${b.op.join("/")}), aria-pressed ${b.pressed.join()}`);
    await t.klikni(sek + " .kz", { index: 2, popis: "Chrbty zadných sedadiel", pockaj: 700 });
    const c = await t.ev(`document.querySelector(${JSON.stringify(sek)} + " .kryv-f").getAttribute("data-z")`);
    ok(c === "operadla", `premium-kryje: klik na „Chrbty zadných sedadiel“ nastaví data-z=${c}`);
    // PC s myšou: prechod myšou rozsvieti plochu, po odchode späť na zvolenú
    const myska = await t.ev(`matchMedia("(hover:hover) and (pointer:fine)").matches`);
    if (myska) {
      const h = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), f = s.querySelector(".kryv-f"), l = s.querySelector(".kryv-l");
        var ev = function (typ, el, bubl) { el.dispatchEvent(new MouseEvent(typ, { bubbles: bubl, cancelable: true })); };
        ev("mouseover", l.querySelector(".kz[data-z='dno']"), true); var nad = f.getAttribute("data-z");
        ev("mouseleave", l, false); var po = f.getAttribute("data-z");
        return { nad: nad, po: po }; })()`);
      ok(h.nad === "dno" && h.po === "operadla", `premium-kryje (PC): prechod myšou nad „Dno kufra“ rozsvieti dno (${h.nad}), po odchode späť na zvolené (${h.po})`);
    }
    await t.klikni(sek + " .kz.vsetko", { popis: "Zobraziť všetko naraz", pockaj: 600 });
    const v = await t.ev(`document.querySelector(${JSON.stringify(sek)} + " .kryv-f").getAttribute("data-z")`);
    ok(v === "vsetko", `premium-kryje: „Zobraziť všetko naraz“ vráti data-z=${v}`);
    const a = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return { spat: !!s.querySelector(".spat .spat-btn"), href: (s.querySelector(".spat-btn") || {}).getAttribute ? s.querySelector(".spat-btn").getAttribute("href") : null }; })()`);
    ok(a.spat && a.href === "#product-detail-form", "premium-kryje: výzva „Pokračujte vo výbere“ vedie na konfigurátor");
  }

  // ---------------------------------------------------------------- c-casova-os: lehota 21–29 dní (rozhodnutie Michala 14. 10. 2026)
  if (await t.je("c-casova-os")) {
    const r = await t.ev(`(function () { var s = document.querySelector(${S("c-casova-os")}); return { lede: s.querySelector(".lede").textContent.trim(), kroky: s.querySelectorAll(".tml li").length,
      odznaky: [].map.call(s.querySelectorAll(".tml .tt"), function (x) { return x.textContent.trim(); }) }; })()`);
    ok(r.kroky === 6 && r.odznaky.join("|") === "hneď|do 24 hodín|spolu 21–29 dní" && r.lede === "Šije sa až po objednávke, preto dodanie trvá 21–29 dní.",
      `c-casova-os: 6 krokov, odznaky „hneď“, „do 24 hodín“, „spolu 21–29 dní“ a úvod s lehotou (${r.odznaky.join("|")}; „${r.lede}“)`);
  }

  // ---------------------------------------------------------------- d-faq: = živé FAQ z /faq/ doslovne (rozhodnutie Michala 14. 10. 2026)
  if (await t.je("d-faq")) {
    const sek = t.sekcia("d-faq");
    const d = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); var q = [].slice.call(s.querySelectorAll(".p1v-faq-q"));
      return { n: q.length, typ: q.every(function (b) { return b.type === "button" && !!document.getElementById(b.getAttribute("aria-controls")) && !b.closest("form"); }),
        zbalene: q.every(function (b) { return b.getAttribute("aria-expanded") === "false"; }),
        zakazane: s.querySelectorAll(".faq,.accordion,details").length, znacky: s.querySelectorAll("[data-p1v-cislo],[data-p1v-odkaz]").length }; })()`);
    ok(d.n === 12 && d.typ && d.zbalene, `d-faq: 12 otázok = button type=button mimo formulára, aria-controls na odpoveď, zbalené (${d.n})`);
    ok(d.zakazane === 0, "d-faq: bez .faq/.accordion/<details> (kotvy živého JS, TinyMCE)");
    ok(d.znacky === 0, `d-faq: bez dosadzovaných čísel a odkazov (živý text, ${d.znacky} značiek)`);
    const fz = await kontrolaFaqZive(t, sek);
    ok(fz.ok, fz.popis);
    await t.ev(`(function () { var b = document.querySelectorAll(${JSON.stringify(sek)} + " .p1v-faq-q")[2]; if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
    await t.pauza(500);
    await t.klikni(sek + " .p1v-faq-q", { index: 2, popis: "FAQ 3", pockaj: 600 });
    // prechod výšky pod záťažou (súbežné behy Chrome) nemusí byť po 600 ms hotový — počkať naň ako Classic (nie pevná pauza)
    await t.cakaj(`(function () { var b = document.querySelectorAll(${JSON.stringify(sek + " .p1v-faq-q")})[2]; return b.getAttribute("aria-expanded") === "true" && b.nextElementSibling.getBoundingClientRect().height > 15; })()`, { ms: 6000, popis: "FAQ 3 rozbalená" }).catch(() => null);
    const o = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); var b = s.querySelectorAll(".p1v-faq-q")[2], a = document.getElementById(b.getAttribute("aria-controls"));
      return { exp: b.getAttribute("aria-expanded"), h: Math.round(a.getBoundingClientRect().height), txt: a.textContent.trim().slice(0, 40) }; })()`);
    ok(o.exp === "true" && o.h > 15, `d-faq: klik rozbalí odpoveď (výška ${o.h}, „${o.txt}…“)`);
  }

  // ---------------------------------------------------------------- galéria: 8 fotiek premium z CDN, žiadna chýbajúca
  if (await t.je("a-galeria")) {
    const g = await t.ev(`(function () { var s = document.querySelector(${S("a-galeria")}); var f = [].slice.call(s.querySelectorAll(".lx-gal-k:not(.lx-klon)"));
      return { n: f.length, klony: s.querySelectorAll(".lx-klon").length, premium: f.filter(function (x) { return /premium-/.test(x.querySelector("img").getAttribute("src")); }).length,
        cislo: (s.querySelector(".lx-gal-pocet") || {}).textContent || "" }; })()`);
    ok(g.n === 8 && g.klony === 8 && g.premium === 6, `a-galeria: 8 fotiek (6 premium-* + set2 a k-box z lcd-home) a 8 kópií pásu (${g.n}/${g.klony}/${g.premium}), počítadlo „${g.cislo.replace(/\s+/g, " ").trim()}“`);
  }

  // ---------------------------------------------------------------- CSS partial: každý selektor pod body.lcd-1v
  const zle = zleSelektory();
  ok(zle.length === 0, `_lcd1v-obsah-premium.scss: každý selektor začína body.lcd-1v${zle.length ? " — zlé: " + zle.slice(0, 3).join(" | ") : ""}`);
  return out;
}
