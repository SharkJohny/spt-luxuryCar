// Skupina C obsahu 1V — mapa sekcií (web ↔ návrh v26) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: worker skupiny C (kam siahajú + výzva, čo príde domov, časová os + výzva, farby, vzorky). docs/1v-obsah.md.
// Formát sekcie[] a kontroly(t): pozri tools/test-1v/obsah-a.mjs.
//
// Kontroly s ?novy=1 (na každej šírke): sekcie sú na stránke a viditeľné; kam siahajú = na PC dve karty vedľa seba,
// na telefóne pod sebou; výzvy vedú na konfigurátor (skutočný klik -> formulár košíka vo výreze); balenie = 3 kresby
// stiahnuté, od 820 px riadok v 3 stĺpcoch; časová os = pred osou --p 0 a nič nesvieti, za osou --p 1 a svieti 6 krokov,
// lehota v úvode aj v odznaku rovnaká; farby = klik na 2. vzorku prepne názov, číslo aj fotku (stiahne sa až teraz);
// vzorky = odkaz na vzorkovník, 5 fotiek vejára; texty bez zakázaných formulácií a bez cien natvrdo;
// CSS partial = každý selektor pod body.lcd-1v.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SKUPINA = "c";
export const sekcie = [
  { meno: "c-kam", navrh: [{ sel: "section.chapter", text: "Kam všade koberce siahajú" }, { sel: ".spat", za: "#predapo" }] },
  { meno: "c-domov", navrh: [{ sel: "section.chapter", text: "Čo Vám príde domov" }] },
  { meno: "c-casova-os", navrh: [{ sel: "section.chapter", text: "Od objednávky po doručenie" }, { sel: ".spat", pred: "#farby" }] },
  { meno: "c-farby", navrh: [{ sel: "#farby" }] },
  { meno: "c-vzorky", navrh: [{ sel: "#vzorky" }] },
];

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "../..");
// zákaznícke texty (docs/1v-obsah.md bod 4): žiadne „na milimeter“, 1. osoba „vyrábame“, počty vrstiev, záruka ako argument,
// názvy materiálu, uchytenie do fixačných bodov, „Comfort“; ceny nikdy natvrdo
const ZAKAZANE = /na\s+milimeter|vyr[aá]bame|vrstv|z[aá]ruk|dragon\s*skin|\belite\b|\bbasic\b|comfort|fixa[čc]n|€|\beur\b/i;

/** selektory partialu, ktoré nezačínajú body.lcd-1v (komentáre preč, @media rozbalené) */
function zleSelektory() {
  const css = readFileSync(join(KOREN, "assets/css/_lcd1v-obsah-c.scss"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const zle = [];
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const s = m[1].trim();
    if (!s || s.startsWith("@media") || s.startsWith("@supports")) continue;
    if (s.startsWith("@")) { zle.push(s.slice(0, 40)); continue; }
    // čiarky len na najvyššej úrovni (nie vnútri :is(...))
    let h = 0, kus = "";
    const kusy = [];
    for (const ch of s) { if (ch === "(") h++; if (ch === ")") h--; if (ch === "," && !h) { kusy.push(kus); kus = ""; } else kus += ch; }
    kusy.push(kus);
    kusy.map((x) => x.trim()).filter((x) => !/^body\.lcd-1v[\s.:[]/.test(x)).forEach((x) => zle.push(x.slice(0, 60)));
  }
  return zle;
}

/** Kontroly s ?novy=1 po vložení obsahu (raz na každú šírku). Vráti pole { ok, popis }. */
export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const S = (m) => `.p1v-miesto ${t.sekcia(m)}`;
  const sek = (m) => JSON.stringify(S(m));
  const sir = t.sirka;
  const navrh = (selCss, blok = "center") => t.ev(`(function(){var e=document.querySelector(${JSON.stringify(selCss)});if(!e)return false;e.scrollIntoView({block:"${blok}",behavior:"instant"});return true})()`);

  // 0) CSS partial (statická kontrola, raz stačí, ale je lacná)
  const zle = zleSelektory();
  ok(!zle.length, "CSS _lcd1v-obsah-c.scss: každý selektor pod body.lcd-1v" + (zle.length ? " — zlé: " + zle.join(" | ") : ""));

  // 1) sekcie na stránke a viditeľné
  const stav = await t.ev(`(${JSON.stringify(sekcie.map((s) => s.meno))}).map(function(m){var e=document.querySelector('.p1v-miesto [data-lcd-sekcia="'+m+'"]');return e?[m,Math.round(e.getBoundingClientRect().height),getComputedStyle(e).display]:[m,-1,""]})`);
  const chyba = stav.filter((x) => x[1] < 40 || x[2] === "none");
  ok(!chyba.length, `sekcie C na stránke a viditeľné (${sir} px)` + (chyba.length ? ": " + JSON.stringify(chyba) : ""));
  if (chyba.length) return out;

  // 2) texty a ceny
  const text = await t.ev(`[].map.call(document.querySelectorAll(".p1v-miesto [data-lcd-sekcia^='c-']"),function(e){return e.textContent}).join(" ")`);
  const zakaz = text.match(new RegExp(ZAKAZANE.source, "gi"));
  ok(!zakaz, "texty C bez zakázaných formulácií a cien natvrdo" + (zakaz ? ": " + zakaz.join(", ") : ""));
  const lehoty = (text.match(/\d+\s*–\s*\d+\s*dní/g) || []).map((x) => x.replace(/\s+/g, " "));
  ok(lehoty.length === 2 && lehoty[0] === lehoty[1], "časová os: lehota v úvode aj v odznaku rovnaká (" + lehoty.join(" / ") + ")");

  // 3) kam siahajú: karty vedľa seba (PC) / pod sebou (telefón)
  const kry = await t.ev(`[].map.call(document.querySelectorAll(${JSON.stringify(S("c-kam") + " .kry-b")}),function(e){var r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top+scrollY),Math.round(r.width)]})`);
  if (sir >= 901) ok(kry.length === 2 && Math.abs(kry[0][1] - kry[1][1]) < 2 && kry[1][0] > kry[0][0] + kry[0][2], "kam siahajú: na PC dve karty vedľa seba " + JSON.stringify(kry));
  else ok(kry.length === 2 && kry[1][1] > kry[0][1] + 40, "kam siahajú: na telefóne témy pod sebou " + JSON.stringify(kry));

  // 4) balenie: kresby stiahnuté, PC riadok v 3 stĺpcoch
  await navrh(S("c-domov") + " .balkarta");
  await t.cakaj(`[].every.call(document.querySelectorAll(${JSON.stringify(S("c-domov") + " .ba-i img")}),function(i){return i.complete&&i.naturalWidth>0})`, { ms: 8000, popis: "kresby balenia" }).then(() => ok(true, "balenie: 3 kresby stiahnuté"), (e) => ok(false, "balenie: " + e.message));
  const stlpce = await t.ev(`getComputedStyle(document.querySelector(${JSON.stringify(S("c-domov") + " .bal li")})).gridTemplateColumns.split(" ").length`);
  ok(sir >= 820 ? stlpce === 3 : stlpce === 2, `balenie: riadok má ${stlpce} stĺpce (${sir >= 820 ? "PC 3" : "telefón 2"})`);

  // 5) časová os: pred osou prázdna, za osou plná
  const os = S("c-casova-os") + " .tml";
  const osStav = `(function(){var t=document.querySelector(${JSON.stringify(os)});return [parseFloat(t.style.getPropertyValue("--p")||"0"),t.querySelectorAll("li.on").length]})()`;
  await t.ev(`(function(){var e=document.querySelector(${JSON.stringify(os)});scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight-40,behavior:"instant"})})()`);
  await t.pauza(600);
  const pred = await t.ev(osStav);
  ok(pred[0] === 0 && pred[1] === 0, "časová os pod oknom: --p 0, nič nesvieti " + JSON.stringify(pred));
  await t.ev(`(function(){var e=document.querySelector(${JSON.stringify(os)});scrollTo({top:e.getBoundingClientRect().bottom+scrollY-innerHeight*0.3,behavior:"instant"})})()`);
  await t.pauza(600);
  const za = await t.ev(osStav);
  ok(za[0] === 1 && za[1] === 6, "časová os prečítaná: --p 1, svieti 6 krokov " + JSON.stringify(za));
  if (sir >= 901) {
    const strany = await t.ev(`(function(){var t=document.querySelector(${JSON.stringify(os)}),x=t.getBoundingClientRect().left+t.offsetWidth/2;return [].map.call(t.querySelectorAll("li > .c"),function(c){var r=c.getBoundingClientRect();return r.right<=x?"L":r.left>=x?"P":"?"}).join("")})()`);
    ok(strany === "LPLPLP", "časová os na PC: kroky striedavo vľavo/vpravo od osi (" + strany + ")");
  }

  // 6) farby: klik na 2. vzorku prepne názov, číslo aj fotku
  const F = S("c-farby");
  const druha = await t.ev(`(function(){var i=document.querySelectorAll(${JSON.stringify(F + " .lx-farby-velka img")})[1];return i?[i.getAttribute("src"),i.classList.contains("on")]:null})()`);
  ok(druha && !druha[0] && !druha[1], "farby: 2. fotka pred výberom nestiahnutá (len data-src) " + JSON.stringify(druha));
  try {
    await t.klikni(F + " .lx-farby-vzorka", { index: 1, popis: "2. vzorka farby", pockaj: 400 });
    await t.cakaj(`(function(){var i=document.querySelectorAll(${JSON.stringify(F + " .lx-farby-velka img")})[1];return i&&i.getAttribute("src")&&i.classList.contains("on")})()`, { ms: 5000, popis: "2. fotka farby .on" });
    const po = await t.ev(`[document.querySelector(${JSON.stringify(F + " .lx-farby-meno")}).textContent,document.querySelector(${JSON.stringify(F + " .lx-farby-cislo")}).textContent,document.querySelectorAll(${JSON.stringify(F + " .lx-farby-vzorka")})[1].getAttribute("aria-pressed")]`);
    // 2. farba: Diamond (598) zo statického HTML; Hexa/Stripe (610/613) = 2. farba živého kroku Farba tohto produktu
    const vzor = (t.produkt && t.produkt.vzor) || "diamond";
    const druhaFarba = vzor === "diamond" ? "Čierna · modré šitie"
      : await t.ev(`(function(){var b=document.querySelectorAll(".lcd1v-k-farba .options-wrap > .option-button")[1];return b?(b.getAttribute("data-lcd1v-nazov")||"").replace(/\\s*\\/\\s*/g," · "):null})()`);
    ok(po[0] === druhaFarba && po[1] === "02" && po[2] === "true", `farby: klik na 2. vzorku prepol názov („${druhaFarba}“), číslo aj fotku ` + JSON.stringify(po));
  } catch (e) { ok(false, "farby: " + e.message); }
  // farby vlastného vzoru (integrácia 14. 10. 2026): na Hexa/Stripe ani jedna vzorka, fotka či popis Diamond Line
  {
    const vzor = (t.produkt && t.produkt.vzor) || "diamond";
    const meno = { diamond: "Diamond Line", stripe: "Stripe Line", hexa: "Hexa Line" }[vzor];
    const f = await t.ev(`(function(){var e=document.querySelector(${JSON.stringify(F)});var k=document.querySelectorAll(".lcd1v-k-farba .options-wrap > .option-button");
      return { n: (e.querySelector(".lx-farby-vzor-n")||{}).textContent, vzorky: [].map.call(e.querySelectorAll(".lx-farby-vzorka"),function(b){return b.getAttribute("data-vzor")}),
        diamond: /Diamond/.test(e.textContent + [].map.call(e.querySelectorAll("[aria-label],img[alt]"),function(x){return (x.getAttribute("aria-label")||"")+" "+(x.getAttribute("alt")||"")}).join(" ")),
        fotkyDiamond: [].filter.call(e.querySelectorAll("img"),function(i){return /\\/img\\/farby\\/(?!sw-x-)/.test(i.getAttribute("src")||i.getAttribute("data-src")||"")}).length,
        pocet: e.querySelectorAll(".lx-farby-vzorka").length, farbyKroku: k.length, stitok: (e.querySelector(".lx-farby-stitok")||{}).textContent }; })()`);
    if (vzor === "diamond") ok(f.n === "Vzorka · Diamond Line", "farby 598: „" + f.n + "“");
    else ok(f.n === "Vzorka · " + meno && f.vzorky.every((x) => x === meno) && !f.diamond && !f.fotkyDiamond && f.pocet === f.farbyKroku && f.pocet > 0,
      `farby ${t.produkt.id}: vlastný vzor „${f.n}“, ${f.pocet} vzoriek = ${f.farbyKroku} farieb produktu, bez Diamond (text ${f.diamond}, fotky ${f.fotkyDiamond}), štítok „${(f.stitok || "").replace(/\s+/g, " ").trim()}“`);
  }

  // 7) vzorky: odkaz a vejár
  await navrh(S("c-vzorky"));
  const vz = await t.cakaj(`(function(){var e=document.querySelector(${sek("c-vzorky")}),im=e.querySelectorAll(".fan img");var hotovo=[].every.call(im,function(i){return i.complete&&i.naturalWidth>0});return hotovo&&[im.length,e.querySelector("a.btn").getAttribute("href")]})()`, { ms: 8000, popis: "vejár vzoriek" }).catch((e) => [0, e.message]);
  ok(vz[0] === 5 && /vzorkovnik/.test(vz[1]), "vzorky: 5 fotiek vejára stiahnutých, odkaz na vzorkovník " + JSON.stringify(vz));

  // 8) výzvy: skutočný klik -> formulár košíka (konfigurátor) vo výreze
  for (const [m, popis] of [["c-kam", "Pokračujte vo výbere"], ["c-casova-os", "Dokončite objednávku"]]) {
    try {
      const href = await t.ev(`document.querySelector(${JSON.stringify(S(m) + " .spat-btn")}).getAttribute("href")`);
      await t.klikni(S(m) + " .spat-btn", { popis, pockaj: 1600 });
      const r = await t.ev(`(function(){var f=document.getElementById("product-detail-form").getBoundingClientRect();return [Math.round(f.top),Math.round(f.bottom),innerHeight]})()`);
      ok(href === "#product-detail-form" && r[0] < r[2] * 0.6 && r[1] > 60, `výzva „${popis}“ vedie na konfigurátor (formulár top ${r[0]}, okno ${r[2]})`);
    } catch (e) { ok(false, `výzva „${popis}“: ` + e.message); }
  }
  return out;
}
