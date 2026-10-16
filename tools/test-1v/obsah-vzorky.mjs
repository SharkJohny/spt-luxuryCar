// Obsah 1V kľúča „vzorky“ (vzorkovník 637) — mapa sekcií (web ↔ návrh) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: T5.1b (admin-html/src/p1v-vzorky/, assets/css/_lcd1v-obsah-vzorky.scss, assets/img/1v/obsah/vzorky-*). docs/1v-obsah.md.
// Formát sekcie[] a kontroly(t): pozri tools/test-1v/obsah-a.mjs. Plugin sa zapojí v tools/test-1v-obsah.mjs (jadro):
//   import * as skVzorky from "./test-1v/obsah-vzorky.mjs";  SKUPINY.vzorky = skVzorky;  PLUGINY.vzorky = ["vzorky"].
//
// Sekcie (zdroj: navrhy/vzorkovnik.html, po oprave T5.1): c-casova-os „Ako k Vám vzorky prídu“, vzorky-vratenie „Ako dostanete
// zálohu späť“ + výzva, a-ponuka „Zostavte si autokoberce na mieru“, d-faq „Na čo sa nás pýtate najčastejšie“.
//
// Kontroly s ?novy=vyvoj (na každej šírke): sekcie v poradí, viditeľné a odhalené; texty doslovne z návrhu (ZNENIE nižšie je
// skontrolované proti návrhu); žiadne zakázané formulácie a ŽIADNA iná cena než doslovná záloha „5 €“ (nikde „zadarmo“),
// Lux len 10/11/12/13/16; časová os: 4 kroky, pred osou --p 0, za osou --p 1 a svieti 4 (na PC striedavo L/P); vrátenie: na PC
// dve karty vedľa seba, na telefóne pod sebou, odkaz na formulár, kotva #p1v-vratenie a [data-lcd-sekcia$="vratenie"] pre
// konfigurátor; ponuka: fotka stiahnutá, 2 tlačidlá na dvojvrstvové a jednovrstvové (Diamond, vzorkovník vzor nemá), PC fotka
// vedľa textu; FAQ = živé FAQ z /faq/ doslovne (12 otázok, rozhodnutie Michala 14. 10. 2026 — živý vzorkovník ukazuje to isté FAQ ako
// ostatné produkty; tools/test-1v/obsah-faq.mjs), klik rozbalí a znova zbalí odpoveď; odkaz „Formulár nájdete tu“ vedie na
// /odstupenie-od-zmluvy/ (Michal 14. 10. 2026); výzva vedie na konfigurátor (skutočný klik); CSS partial = každý selektor pod body.lcd-1v.
// Pravidlá nových textov (zakázané slová, jediná cena 5 €, Lux) platia na sekcie mimo FAQ — FAQ je živý text.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { kontrolaFaqZive } from "./obsah-faq.mjs";

export const SKUPINA = "vzorky";
export const NAVRH = "vzorkovnik.html";
/** Sekcie A–D oživujú obsah-a.js, obsah-c.js a obsah-d.js (bez zmeny); ich kontroly sú pre obsah 598 (počty z v26), tu nie. */
export const zdielane = [];
export const sekcie = [
  { meno: "c-casova-os", navrh: [{ sel: "main > section.chapter", text: "Ako k Vám vzorky prídu" }] },
  { meno: "vzorky-vratenie", navrh: [{ sel: "section.chapter", text: "Ako dostanete zálohu späť" }, { sel: ".spat", za: "#vratenie" }] },
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Zostavte si autokoberce na mieru" }] },
  { meno: "d-faq", navrh: [{ sel: "#otazky" }] },
];

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "../..");
/** Poradie sekcií na stránke (kus 1: časová os, vrátenie; kus 2: ponuka, FAQ). */
const PORADIE = sekcie.map((s) => s.meno);

// zákaznícke texty (docs/1v-obsah.md bod 4 + rozhodnutia.md): žiadne „na milimeter“, 1. osoba „vyrábame“, počet vrstiev materiálu,
// záruka ako argument, DragonSkin / Elite / Basic, uchytenie do fixačných bodov, „Comfort“, „zadarmo“ ani „zdarma“.
// „vrstva“ (Lux) a „Jednovrstvové / Dvojvrstvové“ (názvy typov) sú v poriadku, zakázaný je len počet („5 vrstiev“).
const ZAKAZANE = /na\s+milimeter|vyr[aá]bame|(?:\b\d+|dve|dva|tri|štyri|päť|piatich)[\s-]+vrstv|z[aá]ruk|dragon\s*skin|\belite\b|\bbasic\b|comfort|fixa[čc]n|uchyt|zadarmo|zdarma|bezplatn|odpor[uú]čan[aá] cena/i;

/** Doslovné znenie z návrhu (navrhy/vzorkovnik.html, oprava T5.1), po sekciách. Jediná úprava: FAQ 02 bez príkladu „tri vzorky = 15 €“. */
export const ZNENIE = {
  "c-casova-os": [
    "Ako k Vám vzorky prídu",
    "Farbu, prešívanie aj štruktúru si pozriete priamo vo svojom aute — pri dennom aj večernom svetle, nie na fotke z monitora.",
    "Výber vzoriek", "hneď", "Označíte vzorky, ktoré chcete vidieť naživo, a vložíte ich do košíka. Za každú zaplatíte vratnú zálohu 5 €.",
    "Odoslanie na adresu", "Vzorky Vám pošleme na adresu. Posielame ich po celej SK aj ČR.",
    "Porovnanie vo Vašom aute", "Vzorky priložíte k sedadlám a k podlahe a vyberiete farbu, ktorá k interiéru sedí.",
    "Vrátenie vzoriek", "záloha späť", "Vzorky nám pošlete späť. Zálohu vrátime po ich obdržaní.",
  ],
  "vzorky-vratenie": [
    "Ako dostanete zálohu späť",
    "Vrátenie vzoriek", "Vyplníte formulár na odstúpenie od zmluvy", "Vzorky nám pošlete späť", "Formulár nájdete tu",
    "Vrátenie zálohy", "5 € za každú vrátenú vzorku.", "Na Váš účet", "po obdržaní vzoriek", "Alebo jej hodnotu odpočítame", "z objednávky",
    "Vyberte si vzorky a pozrite si farby naživo.", "Pokračujte vo výbere",
  ],
  "a-ponuka": [
    "Máte vybratú farbu?", "Zostavte si autokoberce do interiéru na mieru",
    "Vzorky sú pre autokoberce do interiéru osobných áut. Vzor, farbu aj rozloženie potom zvolíte v konfigurátore.",
    "Jednovrstvové zvládnu jar, leto aj jeseň", "Dvojvrstvové majú na prvej prešívanej vrstve odnímateľnú druhú vrstvu Lux",
    "Šablóny máme pre viac než 1000 modelov osobných áut", "Jednovrstvové", "Dvojvrstvové",
  ],
  // otázky a odpovede FAQ = živé /faq/ (kontrolaFaqZive), tu len nadpis sekcie z návrhu
  "d-faq": [
    "Na čo sa nás pýtate najčastejšie",
  ],
};
const norm = (s) => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/** selektory partialu, ktoré nezačínajú body.lcd-1v (komentáre preč, @media rozbalené) */
function zleSelektory() {
  const css = readFileSync(join(KOREN, "assets/css/_lcd1v-obsah-vzorky.scss"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
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

/** Kontroly s ?novy=vyvoj po vložení obsahu (raz na každú šírku). Vráti pole { ok, popis }. */
export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const S = (m) => `.p1v-miesto ${t.sekcia(m)}`;
  const sek = (m) => JSON.stringify(S(m));
  const sir = t.sirka;
  // okno chatu Luxia (iframe tretej strany) sa na telefóne samo otvára cez stred obrazovky — pre klik ho skryjeme (len test)
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
  const naSekciu = (m, blok = "start") => t.ev(`(function(){var e=document.querySelector(${sek(m)});if(!e)return false;e.scrollIntoView({block:${JSON.stringify(blok)},behavior:"instant"});return true})()`);

  // 0) CSS partial (statická kontrola, lacná): každý selektor pod body.lcd-1v
  const zle = zleSelektory();
  ok(!zle.length, "CSS _lcd1v-obsah-vzorky.scss: každý selektor pod body.lcd-1v" + (zle.length ? " — zlé: " + zle.join(" | ") : ""));

  // 1) sekcie na stránke, v poradí (kus 1 pred kusom 2) a viditeľné
  const stav = await t.ev(`(${JSON.stringify(PORADIE)}).map(function(m){var e=document.querySelector('.p1v-miesto [data-lcd-sekcia="'+m+'"]');return e?[m,Math.round(e.getBoundingClientRect().height),getComputedStyle(e).display,Math.round(e.getBoundingClientRect().top+scrollY)]:[m,-1,"",0]})`);
  const chyba = stav.filter((x) => x[1] < 40 || x[2] === "none");
  ok(!chyba.length, `4 sekcie vzorkovníka na stránke a viditeľné (${sir} px)` + (chyba.length ? ": " + JSON.stringify(chyba) : ""));
  if (chyba.length) return out;
  const poradie = stav.map((x) => x[3]);
  ok(poradie.every((y, i) => !i || y > poradie[i - 1]), "sekcie idú za sebou: časová os, vrátenie, ponuka, FAQ " + JSON.stringify(stav.map((x) => x[0] + "@" + x[3])));

  // 2) reveal: po zobrazení sekcie sú všetky jej .rv odhalené (opacity 1)
  for (const m of PORADIE) {
    await naSekciu(m);
    await t.pauza(1100);
    const r = await t.ev(`(function(){var s=document.querySelector(${sek(m)});var rv=[].slice.call(s.querySelectorAll(".rv")).concat(s.classList.contains("rv")?[s]:[]);var vid=rv.filter(function(x){var b=x.getBoundingClientRect();return b.top<innerHeight&&b.bottom>0});return {rv:s.classList.contains("p1v-rv"),skryte:vid.filter(function(x){return getComputedStyle(x).opacity<0.9}).length,vid:vid.length,h:Math.round(s.getBoundingClientRect().height)}})()`);
    ok(r.rv && r.skryte === 0 && r.vid > 0, `${m}: odhalená (.p1v-rv ${r.rv}, .rv vo výreze skryté ${r.skryte}/${r.vid}, výška ${r.h} px)`);
  }

  // 3) texty: doslovne z návrhu (celý text sekcie obsahuje každý kus znenia)
  const texty = await t.ev(`(${JSON.stringify(PORADIE)}).map(function(m){var e=document.querySelector('.p1v-miesto [data-lcd-sekcia="'+m+'"]');return e?e.textContent:""})`);
  PORADIE.forEach((m, i) => {
    const text = norm(texty[i]);
    const chyba = ZNENIE[m].filter((z) => !text.includes(norm(z)));
    ok(!chyba.length, `${m}: texty doslovne z návrhu (${ZNENIE[m].length} kusov)` + (chyba.length ? " — chýba: " + chyba.map((x) => "„" + x.slice(0, 50) + "“").join(", ") : ""));
  });

  // 4) zakázané formulácie, ceny, Lux — sekcie mimo FAQ (FAQ = živý text z /faq/, kontroluje ho kontrolaFaqZive nižšie)
  const cely = norm(texty.filter((_, i) => PORADIE[i] !== "d-faq").join(" "));
  const zakaz = cely.match(new RegExp(ZAKAZANE.source, "gi"));
  ok(!zakaz, "texty mimo FAQ bez zakázaných formulácií (aj „zadarmo“)" + (zakaz ? ": " + zakaz.join(", ") : ""));
  const ceny = (cely.match(/\d[\d ]*(?:[.,]\d+)? ?(?:€|eur)|(?:€|eur) ?\d/gi) || []).map(norm);
  ok(ceny.length === 2 && ceny.every((c) => c === "5 €"), "jediná cena v texte mimo FAQ je doslovná záloha „5 €“ (2×: časová os, vrátenie) " + JSON.stringify(ceny));
  // druhá vrstva: ak text menuje Lux s číslom, len jednofarebné 10/11/12/13/16 (vzorkové FAQ 06 s „Lux 10/12/11“ nahradilo živé FAQ)
  const lux = [...cely.matchAll(/Lux(?: Color)? (\d+)/g)].map((m) => Number(m[1]));
  ok(lux.every((n) => [10, 11, 12, 13, 16].includes(n)), "druhá vrstva: v texte len jednofarebné Lux 10/11/12/13/16 " + JSON.stringify(lux));

  // 5) kotvy pre konfigurátor a skok na vrátenie
  const kot = await t.ev(`(function(){var a=document.getElementById("p1v-vratenie");var b=document.querySelector('.p1v-miesto [data-lcd-sekcia$="vratenie"]');return [!!a&&a.getBoundingClientRect().height>40,!!b&&b.getClientRects().length>0]})()`);
  ok(kot[0] && kot[1], "kotva #p1v-vratenie a [data-lcd-sekcia$=\"vratenie\"] (konfigurátor sem posúva) sú viditeľné " + JSON.stringify(kot));

  // 6) vrátenie: dve témy vedľa seba (PC) / pod sebou (telefón), odkaz na formulár
  await naSekciu("vzorky-vratenie");
  const kry = await t.ev(`[].map.call(document.querySelectorAll(${JSON.stringify(S("vzorky-vratenie") + " .kry-b")}),function(e){var r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top+scrollY),Math.round(r.width)]})`);
  if (sir >= 901) ok(kry.length === 2 && Math.abs(kry[0][1] - kry[1][1]) < 2 && kry[1][0] > kry[0][0] + kry[0][2], "vrátenie: na PC dve karty vedľa seba " + JSON.stringify(kry));
  else ok(kry.length === 2 && kry[1][1] > kry[0][1] + 40, "vrátenie: na telefóne témy pod sebou " + JSON.stringify(kry));
  const form = await t.ev(`(function(){var a=document.querySelector(${JSON.stringify(S("vzorky-vratenie") + " a.vz-form")});return a?[a.getAttribute("href"),Math.round(a.getBoundingClientRect().width)]:null})()`);
  ok(form && form[0] === "https://www.luxurycardesign.sk/odstupenie-od-zmluvy/" && form[1] > 60, "vrátenie: odkaz „Formulár nájdete tu“ vedie na formulár odstúpenia od zmluvy (Michal 14. 10. 2026) " + JSON.stringify(form));

  // 7) časová os: 4 kroky, pred osou prázdna, za osou plná
  const os = S("c-casova-os") + " .tml";
  const osStav = `(function(){var t=document.querySelector(${JSON.stringify(os)});return [parseFloat(t.style.getPropertyValue("--p")||"0"),t.querySelectorAll("li.on").length,t.querySelectorAll("li").length]})()`;
  await t.ev(`(function(){var e=document.querySelector(${JSON.stringify(os)});scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight-40,behavior:"instant"})})()`);
  await t.pauza(600);
  const pred = await t.ev(osStav);
  ok(pred[2] === 4 && pred[0] === 0 && pred[1] === 0, "časová os pod oknom: 4 kroky, --p 0, nič nesvieti " + JSON.stringify(pred));
  await t.ev(`(function(){var e=document.querySelector(${JSON.stringify(os)});scrollTo({top:e.getBoundingClientRect().bottom+scrollY-innerHeight*0.3,behavior:"instant"})})()`);
  await t.pauza(600);
  const za = await t.ev(osStav);
  ok(za[0] === 1 && za[1] === 4, "časová os prečítaná: --p 1, svietia 4 kroky " + JSON.stringify(za));
  if (sir >= 901) {
    const strany = await t.ev(`(function(){var t=document.querySelector(${JSON.stringify(os)}),x=t.getBoundingClientRect().left+t.offsetWidth/2;return [].map.call(t.querySelectorAll("li > .c"),function(c){var r=c.getBoundingClientRect();return r.right<=x?"L":r.left>=x?"P":"?"}).join("")})()`);
    ok(strany === "LPLP", "časová os na PC: kroky striedavo vľavo/vpravo od osi (" + strany + ")");
  }

  // 8) ponuka: fotka stiahnutá, rozloženie, dve tlačidlá na produkty toho istého vzoru (Diamond)
  await naSekciu("a-ponuka", "center");
  const foto = await t.cakaj(`(function(){var i=document.querySelector(${JSON.stringify(S("a-ponuka") + " .ups .ph img")});return i&&i.complete&&i.naturalWidth>0?[i.naturalWidth,i.getAttribute("src").split("/").pop()]:false})()`, { ms: 8000, popis: "fotka ponuky" }).catch((e) => [0, e.message]);
  ok(foto[0] === 760 && foto[1] === "vzorky-autokoberce-diamond.jpg", "ponuka: reálna fotka vzorky-autokoberce-diamond.jpg stiahnutá " + JSON.stringify(foto));
  const ups = await t.ev(`(function(){var u=document.querySelector(${JSON.stringify(S("a-ponuka") + " .ups")}),p=u.querySelector(".ph").getBoundingClientRect(),x=u.querySelector(".tx").getBoundingClientRect();var b=[].map.call(u.querySelectorAll(".vz-ups-cta .btn"),function(a){var r=a.getBoundingClientRect();return {t:a.textContent.trim(),h:a.getAttribute("href"),top:Math.round(r.top),l:Math.round(r.left),w:Math.round(r.width),o:a.getAttribute("data-p1v-odkaz"),s:a.getAttribute("data-p1v-stav")}});return {fotoVlavo:p.right<=x.left+2,fotoNad:p.bottom<=x.top+2,b:b,vis:getComputedStyle(u).display}})()`);
  if (sir >= 821) ok(ups.fotoVlavo, "ponuka: na PC fotka vľavo od textu");
  else ok(ups.fotoNad, "ponuka: na telefóne fotka nad textom");
  ok(ups.b.length === 2 && ups.b[0].t === "Jednovrstvové" && ups.b[1].t === "Dvojvrstvové", "ponuka: tlačidlá Jednovrstvové a Dvojvrstvové " + JSON.stringify(ups.b.map((x) => x.t)));
  const jedno = t.sestra("jedno"), dvoj = t.sestra("dvoj");
  ok(ups.b.length === 2 && ups.b[0].h === jedno && ups.b[1].h === dvoj && ups.b.every((x) => x.s === "ok"),
    `ponuka: odkazy vedú na jednovrstvové a dvojvrstvové toho istého vzoru (${jedno} / ${dvoj}), dosadené obsah-cisla.js ` + JSON.stringify(ups.b.map((x) => x.h + " " + x.s)));
  if (sir >= 1100) ok(ups.b.length === 2 && Math.abs(ups.b[0].top - ups.b[1].top) < 2 && ups.b[1].l > ups.b[0].l + ups.b[0].w, "ponuka: tlačidlá na PC vedľa seba " + JSON.stringify(ups.b.map((x) => [x.l, x.top, x.w])));
  const ramik = await t.ev(`(function(){var a=document.querySelectorAll(${JSON.stringify(S("a-ponuka") + " .vz-ups-cta .btn")});return [getComputedStyle(a[0]).borderTopWidth,getComputedStyle(a[1]).borderTopWidth]})()`);
  ok(ramik[0] === "0px" && ramik[1] === "1px", "ponuka: zlaté tlačidlo bez rámu, druhé (ghost) s rámom " + JSON.stringify(ramik));

  // 9) FAQ: = živé FAQ z /faq/ doslovne (12 otázok, Michal 14. 10. 2026), klik rozbalí odpoveď a druhý klik ju zbalí
  await naSekciu("d-faq");
  await t.pauza(500);
  const q = S("d-faq") + " .p1v-faq-q";
  const n = await t.ev(`document.querySelectorAll(${JSON.stringify(q)}).length`);
  ok(n === 12, "FAQ: 12 otázok (" + n + ")");
  const fz = await kontrolaFaqZive(t, S("d-faq"));
  ok(fz.ok, fz.popis);
  try {
    const odp = (i) => t.ev(`(function(){var b=document.querySelectorAll(${JSON.stringify(q)})[${i}],a=document.getElementById(b.getAttribute("aria-controls"));return [b.getAttribute("aria-expanded"),Math.round(a.getBoundingClientRect().height),getComputedStyle(a).visibility]})()`);
    const pred1 = await odp(0);
    await t.klikni(q, { index: 0, popis: "FAQ 01", pockaj: 600 });
    const po1 = await odp(0);
    await t.klikni(q, { index: 0, popis: "FAQ 01 späť", pockaj: 600 });
    const po2 = await odp(0);
    ok(pred1[0] === "false" && pred1[1] === 0 && po1[0] === "true" && po1[1] > 20 && po1[2] === "visible" && po2[0] === "false" && po2[1] === 0,
      "FAQ 01: zbalená -> klik rozbalí odpoveď -> klik zbalí " + JSON.stringify([pred1, po1, po2]));
  } catch (e) { ok(false, "FAQ: " + e.message); }

  // 10) výzva: skutočný klik -> formulár košíka (konfigurátor) vo výreze
  try {
    const href = await t.ev(`document.querySelector(${JSON.stringify(S("vzorky-vratenie") + " .spat-btn")}).getAttribute("href")`);
    await naSekciu("vzorky-vratenie");
    await t.klikni(S("vzorky-vratenie") + " .spat-btn", { popis: "Pokračujte vo výbere", pockaj: 1600 });
    const r = await t.ev(`(function(){var f=document.getElementById("product-detail-form").getBoundingClientRect();return [Math.round(f.top),Math.round(f.bottom),innerHeight]})()`);
    ok(href === "#product-detail-form" && r[0] < r[2] * 0.6 && r[1] > 60, `výzva „Pokračujte vo výbere“ vedie na konfigurátor (formulár top ${r[0]}, okno ${r[2]})`);
  } catch (e) { ok(false, "výzva „Pokračujte vo výbere“: " + e.message); }
  return out;
}
