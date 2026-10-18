// Obsah 1V kľúča „kamiony“ (kamióny a dodávky SK 640) — mapa sekcií a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: časť OBSAH (admin-html/src/p1v-kamiony/, assets/css/_lcd1v-obsah-kamiony.scss). Plán: docs/kamiony-1v-plan.md §4.
// Formát sekcie[] a kontroly(t): pozri tools/test-1v/obsah-a.mjs. Zapojenie v jadre: SKUPINY.kamiony, PLUGINY.kamiony = ["kamiony"].
//
// Zdroj textov: schválený vzor kamiony-app (data/texty.json obsah.*), ZNENIE nižšie je doslovná kópia (bez cien — tie dosadí obsah-cisla.js).
// Návrh na serveri návrhov nie je (vzor je artefakt), snímky sú len z webu.
//
// Kontroly s ?novy=vyvoj (na každej šírke): CSS partial = každý selektor pod body.lcd-1v; 10 sekcií v poradí ART, viditeľné a odhalené;
// texty doslovne zo vzoru; žiadne zakázané formulácie; žiadna suma „N €“ mimo značiek data-p1v-cislo; veta o tapacíri celá
// (s číslami alebo bez nich); kotva #p1v-kamiony-dopravcovia, telefón a e-mail; 3 výzvy na konfigurátor (#product-detail-form);
// galéria: 6 fotiek stiahnutých, 2 / 3 stĺpce, klik otvorí okno #p1v-lb s fotkou a zatvorí ho; materiály 5 kariet (od 1000 px v rade);
// časová os 4 kroky (pred osou --p 0, za osou --p 1); FAQ 7 otázok zo vzoru, klik rozbalí a zbalí; záver s fotkou kabíny;
// mierka písma (Michal 18. 10. 2026, tools/test-1v/pismo-kamion.mjs): vlastné triedy ostro, spoločné časti ako upozornenie.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pismoVyraz, vypisNalezy, ROLY_OBSAH, ROLY_SPOLOCNE } from "./pismo-kamion.mjs";

export const SKUPINA = "kamiony";
export const NAVRH = null;
/** Spoločné sekcie A, C, D oživujú obsah-a/c/d.js bez zmeny; ich kontroly sú pre obsah 598 (počty z v26), tu nie. */
export const zdielane = [];
export const sekcie = [
  { meno: "kamiony-galeria", navrh: [] },
  { meno: "kamiony-co-dostanete", navrh: [] },
  { meno: "kamiony-materialy", navrh: [] },
  { meno: "kamiony-detaily", navrh: [] },
  { meno: "c-casova-os", navrh: [] },
  { meno: "kamiony-dopravcovia", navrh: [] },
  { meno: "a-recenzie", navrh: [] },
  { meno: "d-faq", navrh: [] },
  { meno: "kamiony-vyzva", navrh: [] },
];

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "../..");
/** Poradie sekcií na stránke = ART texty.json obsah.poradie (kus 1: 10–20, kus 2: 30–42). */
const PORADIE = sekcie.map((s) => s.meno);

// zákaznícke texty (docs/1v-obsah.md §4): žiadne „na milimeter“, 1. osoba „vyrábame“, počet vrstiev, záruka, DragonSkin / Elite / Basic,
// uchytenie do fixačných bodov, „Comfort“, „zadarmo“, odporúčaná cena.
const ZAKAZANE = /na\s+milimeter|vyr[aá]bame|(?:\b\d+|dve|dva|tri|štyri|päť|piatich)[\s-]+vrstv|z[aá]ruk|dragon\s*skin|\belite\b|\bbasic\b|comfort|fixa[čc]n|uchyt|zadarmo|zdarma|bezplatn|odpor[uú]čan[aá] cena/i;

/** Doslovné znenie zo vzoru (kamiony-app data/texty.json obsah.*), po sekciách. Vety s cenou len po značku čísla. */
export const ZNENIE = {
  "kamiony-galeria": ["Galéria", "Ako koberce vyzerajú v kabíne", "Rôzne materiály, farby a lemovanie v kabínach kamiónov.", "Vybrať vozidlo a zistiť cenu"],
  "kamiony-co-dostanete": [
    "Čo dostanete", "Tri koberce do kabíny",
    "V základnej cene sú tri koberce v jednofarebnej syntetickej koži – vo farbe a s lemovaním podľa Vášho výberu. Nášivky a pri kamiónoch aj tapacír dverí si môžete pridať.",
    "Koberec šoféra", "Koberec spolujazdca", "Stredový koberec", "Na fotke prešívaná syntetická koža", "V základnej cene", "Za príplatok",
    "Tapacír dverí", "Len pre kamióny. Výplne dverí ladené s kobercami",
  ],
  "kamiony-materialy": [
    "Materiály", "Dva materiály v piatich prevedeniach",
    "Každé prevedenie je v niekoľkých farbách. Príplatok za materiál platíte raz – za všetky tri koberce spolu.",
    "Prémiová syntetická koža – jednofarebná", "13 farieb", "Hladký povrch v jednej farbe. Pôsobí čisto a nadčasovo.",
    "Prémiová syntetická koža – prešívaná", "14 farieb", "Prešívaný kosoštvorcový vzor dodá kabíne luxusnejší vzhľad.",
    "Prémiová syntetická koža – tónovaná", "5 farieb", "Povrch s jemne žíhaným, vintage vzhľadom.",
    "Mikrosemiš – jednofarebný", "Mäkký, jemný povrch v jednej farbe.",
    "Mikrosemiš – dvojfarebný", "6 farieb", "Mikrosemiš s melírovaným dvojfarebným efektom.", "Vybrať materiál",
  ],
  "kamiony-detaily": [
    "Detaily", "Nášivky a lemovanie", "Kabínu si zladíte do detailu – od pásika po okraji koberca až po motív na koberci.",
    "Lemovanie", "Pásik po okraji každého koberca. Na výber je 13 farebných kombinácií, všetky v cene.",
    "Nášivky na koberce", "Dva motívy v 11 farbách nite. Na koberce šoféra a spolujazdca, na stredový koberec alebo na všetky tri.",
    "Nášivka na tapacír dverí", "Ak si ku kamiónu vyberiete tapacír dverí, motív môže byť aj na ňom.",
  ],
  "c-casova-os": [
    "Ako to prebieha", "Od konfigurácie po doručenie",
    "Koberce sa šijú až po objednávke. Príprava, výroba aj doprava trvajú spolu približne 20–30 dní, podľa aktuálnej vyťaženosti.",
    "Konfigurácia", "Vyberiete vozidlo, materiál, farbu, lemovanie, nášivky a pri kamiónoch aj tapacír dverí. Cenu vidíte hneď.",
    "Potvrdenie", "Objednávku Vám potvrdíme e-mailom.",
    "Šitie", "Koberce sa šijú podľa šablóny Vášho modelu a podľa Vášho výberu.",
    "Doručenie", "Keď bude zásielka na ceste, pošleme Vám e-mail. Spolu približne 20–30 dní od objednávky.",
  ],
  "kamiony-dopravcovia": [
    "Pre dopravcov", "Máte vo firme viac kamiónov?",
    "Firemné a flotilové objednávky riešime individuálne. Napíšte nám názov firmy, kontakt, počet a typy vozidiel a pošleme Vám ponuku.",
    "Faktúra na firmu (IČO, DIČ)", "Ponuka pre viac vozidiel naraz", "Telefón +421 903 660 720", "E-mail info@luxurycardesign.sk",
    "Napísať e-mail", "Zavolať",
  ],
  "a-recenzie": ["Recenzie", "Hodnotenia priamo z Google", "Čo o Luxury Car Design píšu zákazníci.", "Prečítajte si všetky", "Napíšte recenziu"],
  "d-faq": [
    "Otázky", "Na čo sa nás pýtate najčastejšie",
    "Sadnú koberce do môjho modelu a vyhotovenia kabíny?",
    "Áno. Koberce sa šijú podľa šablóny pre konkrétny model a roky výroby. Ak sa kabíny daného modelu líšia, konfigurátor sa opýta aj na prevodovku, sedadlo spolujazdca, počet zásuviek alebo typ parkovacej brzdy. Rovnú podlahu alebo tunel rozlišuje už názov modelu.",
    "Čo ak mám iné sedadlo spolujazdca alebo zásuvky?",
    "Po výbere modelu Vám konfigurátor ukáže len možnosti, ktorými sa kabíny tohto modelu líšia – napríklad pevné, odpružené alebo otočné sedadlo spolujazdca, jednu alebo dve zásuvky. Vyberte to, čo máte v kabíne. Ak svoje vyhotovenie v ponuke nevidíte, zavolajte nám na +421 903 660 720 alebo napíšte na info@luxurycardesign.sk a dostupnosť preveríme.",
    "Moje vozidlo v zozname nie je. Čo teraz?",
    "Napíšte nám na info@luxurycardesign.sk alebo zavolajte na +421 903 660 720. Uveďte značku, model, rok výroby a vyhotovenie kabíny. Dostupnosť šablóny preveríme a ozveme sa Vám s ďalším postupom.",
    "Ako sa koberce čistia?",
    "Syntetickú kožu stačí utrieť mikrovláknovou handričkou alebo uterákom s mydlovou vodou či jemným čistiacim prostriedkom. S čistením mikrosemišu Vám radi poradíme telefonicky alebo e-mailom.",
    "Ako dlho trvá dodanie?",
    "Koberce sa šijú až po objednávke, podľa Vášho výberu. Od zadania objednávky trvá príprava, výroba aj doprava spolu približne 20–30 dní, podľa aktuálnej vyťaženosti. Keď bude zásielka na ceste, pošleme Vám e-mail.",
    "Dá sa objednať pre viac kamiónov naraz a na firmu?",
    "Áno. Pri objednávke zadáte údaje firmy (IČO, DIČ) a faktúru dostanete na firmu. Ak objednávate pre viac vozidiel, napíšte nám názov firmy, kontakt, počet a typy vozidiel a pošleme Vám ponuku.",
    "Môžem mať iný motív nášivky, než je v ponuke?",
    "Ponúkame motívy, ktoré nájdete v konfigurátore – aktuálne dva motívy, každý v 11 farbách nite. Ak máte iné želanie, napíšte nám na info@luxurycardesign.sk.",
  ],
  "kamiony-vyzva": ["Luxury Car Design", "Kabína je Váš druhý domov", "Vyberte vozidlo, materiál a farby. Cenu uvidíte hneď pri každom kroku.", "Vybrať vozidlo a zistiť cenu"],
};
const norm = (s) => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/** selektory partialu, ktoré nezačínajú body.lcd-1v (komentáre preč, @media rozbalené) */
export function zleSelektory(css = readFileSync(join(KOREN, "assets/css/_lcd1v-obsah-kamiony.scss"), "utf8")) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
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

/** Kontroly s ?novy=vyvoj po vložení obsahu (raz na každú šírku). Vráti pole { ok, popis, pozor? }. */
export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis, pozor = false) => out.push({ ok: !!podm, popis, pozor: pozor && !podm });
  const S = (m) => `.p1v-miesto ${t.sekcia(m)}`;
  const sek = (m) => JSON.stringify(S(m));
  const sir = t.sirka;
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
  const naSekciu = (m, blok = "start") => t.ev(`(function(){var e=document.querySelector(${sek(m)});if(!e)return false;e.scrollIntoView({block:${JSON.stringify(blok)},behavior:"instant"});return true})()`);

  // 0) CSS partial: každý selektor pod body.lcd-1v
  const zle = zleSelektory();
  ok(!zle.length, "CSS _lcd1v-obsah-kamiony.scss: každý selektor pod body.lcd-1v" + (zle.length ? " — zlé: " + zle.join(" | ") : ""));

  // 1) sekcie na stránke, v poradí a viditeľné
  const stav = await t.ev(`(${JSON.stringify(PORADIE)}).map(function(m){var e=document.querySelector('.p1v-miesto [data-lcd-sekcia="'+m+'"]');return e?[m,Math.round(e.getBoundingClientRect().height),getComputedStyle(e).display,Math.round(e.getBoundingClientRect().top+scrollY)]:[m,-1,"",0]})`);
  const chyba = stav.filter((x) => x[1] < 40 || x[2] === "none");
  // recenzie sa skryjú, keď window.LCD_REVIEWS nepríde (p1v-rev-bez) — to je upozornenie, nie chyba obsahu
  const bezRec = chyba.filter((x) => x[0] !== "a-recenzie");
  ok(!bezRec.length, `${PORADIE.length - 1} sekcií kamiónov (okrem recenzií) na stránke a viditeľné (${sir} px)` + (bezRec.length ? ": " + JSON.stringify(bezRec) : ""));
  if (bezRec.length) return out;
  const rec = stav.find((x) => x[0] === "a-recenzie");
  ok(rec[1] >= 40 && rec[2] !== "none", "a-recenzie viditeľné (window.LCD_REVIEWS na 640 prišlo) " + JSON.stringify(rec), true);
  const vid = stav.filter((x) => x[1] >= 40 && x[2] !== "none");
  const poradie = vid.map((x) => x[3]);
  ok(poradie.every((y, i) => !i || y > poradie[i - 1]), "sekcie idú za sebou v poradí vzoru " + JSON.stringify(vid.map((x) => x[0] + "@" + x[3])));

  // 2) reveal: po zobrazení sekcie sú všetky jej .rv odhalené. „Vo výreze“ = nad spodnými 8 % (obsah.js odhaľuje s okrajom
  //    "0px 0px -8% 0px"; na 390 px tlačidlo galérie vykukne o 5 px pod hranicu a odhalí sa až pri ďalšom posune)
  for (const m of vid.map((x) => x[0])) {
    await naSekciu(m);
    await t.pauza(900);
    const r = await t.ev(`(function(){var s=document.querySelector(${sek(m)});var rv=[].slice.call(s.querySelectorAll(".rv")).concat(s.classList.contains("rv")?[s]:[]);var v=rv.filter(function(x){var b=x.getBoundingClientRect();return b.top<innerHeight*0.92&&b.bottom>0});return {rv:s.classList.contains("p1v-rv"),skryte:v.filter(function(x){return getComputedStyle(x).opacity<0.9}).length,vid:v.length}})()`);
    ok(r.rv && r.skryte === 0 && (r.vid > 0 || m === "kamiony-vyzva"), `${m}: odhalená (.p1v-rv ${r.rv}, .rv vo výreze skryté ${r.skryte}/${r.vid})`);
  }

  // 3) texty doslovne zo vzoru
  const texty = await t.ev(`(${JSON.stringify(PORADIE)}).map(function(m){var e=document.querySelector('.p1v-miesto [data-lcd-sekcia="'+m+'"]');return e?e.textContent:""})`);
  PORADIE.forEach((m, i) => {
    const text = norm(texty[i]);
    const ch = ZNENIE[m].filter((z) => !text.includes(norm(z)));
    ok(!ch.length, `${m}: texty doslovne zo vzoru (${ZNENIE[m].length} kusov)` + (ch.length ? " — chýba: " + ch.map((x) => "„" + x.slice(0, 50) + "“").join(", ") : ""));
  });

  // 4) zakázané formulácie; sumy „N €“ len v značkách data-p1v-cislo (text bez nich nemá žiadnu sumu)
  const cely = norm(texty.join(" "));
  const zakaz = cely.match(new RegExp(ZAKAZANE.source, "gi"));
  ok(!zakaz, "texty bez zakázaných formulácií" + (zakaz ? ": " + zakaz.join(", ") : ""));
  const bezCisel = await t.ev(`(function(){var k=[].map.call(document.querySelectorAll('.p1v-miesto [data-lcd-cast^="p1v-kamiony-"]'),function(r){var c=r.cloneNode(true);[].forEach.call(c.querySelectorAll("[data-p1v-cislo], .revs, .revhead .score, .revhead .sub"),function(x){x.remove()});return c.textContent});return k.join(" ")})()`);
  const sumy = norm(bezCisel).match(/\d[\d ]*(?:[.,]\d+)? ?(?:€|eur)\b|\d ?€/gi);
  ok(!sumy, "žiadna suma v statickom texte (ceny len cez data-p1v-cislo)" + (sumy ? ": " + sumy.join(", ") : ""));

  // 5) čísla kamiónov: veta o tapacíri je celá — s oboma sumami alebo bez nich
  const tap = await t.ev(`(function(){var li=document.querySelector(${JSON.stringify(S("kamiony-co-dostanete") + " .kk-zoz:last-of-type li")});return li?li.textContent.replace(/[\\u00a0\\u202f]/g," ").replace(/\\s+/g," ").trim():null})()`);
  ok(tap && (/kobercami\. S kobercami len za \d+(?:,\d+)? €, samostatne \d+(?:,\d+)? €\.$/.test(tap) || /kobercami\.$/.test(tap) || /kobercami\. S kobercami len za \d+(?:,\d+)? €\.$/.test(tap)),
    "tapacír: veta celá („… S kobercami len za X €, samostatne Y €.“ alebo bez súm) „" + tap + "“");
  const cisla = await t.ev(`[].map.call(document.querySelectorAll('.p1v-miesto [data-p1v-cislo^="kamion-"], .p1v-miesto [data-lcd-sekcia="kamiony-co-dostanete"] [data-p1v-cislo="cena-od"]'),function(x){return x.getAttribute("data-p1v-cislo")+"="+x.getAttribute("data-p1v-stav")+" „"+x.textContent.trim()+"“"})`);
  ok(cisla.length === 4 && cisla.every((x) => /=ok /.test(x)), "čísla kamiónov dosadené zo živých selectov (K8): " + cisla.join(", "), true);

  // 6) kotva dopravcov + kontakty, výzvy na konfigurátor
  const kd = await t.ev(`(function(){var a=document.getElementById("p1v-kamiony-dopravcovia");var s=document.querySelector(${sek("kamiony-dopravcovia")});return [!!a&&a===s&&a.getBoundingClientRect().height>40,[].map.call(s.querySelectorAll("a[href]"),function(x){return x.getAttribute("href")})]})()`);
  ok(kd[0], "kotva #p1v-kamiony-dopravcovia = sekcia dopravcov, viditeľná (zmluva §4.3)");
  ok(JSON.stringify(kd[1]) === JSON.stringify(["tel:+421903660720", "mailto:info@luxurycardesign.sk", "mailto:info@luxurycardesign.sk", "tel:+421903660720"]), "dopravcovia: odkazy na telefón a e-mail " + JSON.stringify(kd[1]));
  const vyzvy = await t.ev(`[].map.call(document.querySelectorAll('.p1v-miesto [data-lcd-cast^="p1v-kamiony-"] a[href="#product-detail-form"]'),function(a){return a.closest("[data-lcd-sekcia]").getAttribute("data-lcd-sekcia")})`);
  ok(JSON.stringify(vyzvy) === JSON.stringify(["kamiony-galeria", "kamiony-materialy", "kamiony-vyzva"]), "3 výzvy na konfigurátor (#product-detail-form): galéria, materiály, záver " + JSON.stringify(vyzvy));

  // 7) galéria: 6 fotiek stiahnutých, 2 / 3 stĺpce, okno #p1v-lb
  await naSekciu("kamiony-galeria");
  const g = S("kamiony-galeria") + " .kg-f";
  const gal = await t.cakaj(`(function(){var b=document.querySelectorAll(${JSON.stringify(g)});var im=[].map.call(b,function(x){return x.querySelector("img")});if(im.length!==6||im.some(function(i){return !i.complete||!i.naturalWidth}))return false;return [].map.call(b,function(x){var r=x.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top+scrollY)]})})()`, { ms: 15000, popis: "6 fotiek galérie" }).catch((e) => ({ chyba: e.message }));
  ok(Array.isArray(gal), "galéria: 6 fotiek produktu 640 stiahnutých " + (gal.chyba || ""));
  if (Array.isArray(gal)) {
    const vRade = gal.filter((x) => Math.abs(x[1] - gal[0][1]) < 2).length;
    ok(vRade === (sir >= 901 ? 3 : 2), `galéria: ${sir >= 901 ? 3 : 2} fotky v rade (${vRade})`);
    try {
      await t.klikni(g, { index: 0, popis: "fotka 1 galérie", pockaj: 700 });
      const lb = await t.ev(`(function(){var l=document.getElementById("p1v-lb");var i=l&&l.querySelector(".p1v-lb-ram img");return l?[l.hidden,!!i&&/640-29_/.test(i.getAttribute("src")||""),(l.querySelector(".p1v-lb-pod")||{}).textContent||""]:null})()`);
      ok(lb && lb[0] === false && lb[1] && /1 \/ 6/.test(lb[2]), "galéria: klik otvorí okno #p1v-lb s fotkou 1 / 6 " + JSON.stringify(lb));
      await t.klikni("#p1v-lb .p1v-lb-x", { popis: "zavrieť okno", pockaj: 700 });
      const zav = await t.ev(`document.getElementById("p1v-lb").hidden`);
      ok(zav === true, "galéria: okno sa zatvorí");
    } catch (e) { ok(false, "galéria: okno — " + e.message); }
  }

  // 8) materiály: 5 kariet so vzorkou, od 1000 px v jednom rade
  await naSekciu("kamiony-materialy");
  const km = await t.cakaj(`(function(){var k=document.querySelectorAll(${JSON.stringify(S("kamiony-materialy") + " .km-k")});if(k.length!==5)return false;var im=[].map.call(k,function(x){return x.querySelector("img")});if(im.some(function(i){return !i.complete||!i.naturalWidth}))return false;return [].map.call(k,function(x){return Math.round(x.getBoundingClientRect().top+scrollY)})})()`, { ms: 12000, popis: "5 kariet materiálov" }).catch((e) => ({ chyba: e.message }));
  ok(Array.isArray(km), "materiály: 5 kariet, vzorky stiahnuté " + (km.chyba || ""));
  if (Array.isArray(km) && sir >= 1000) ok(km.every((y) => Math.abs(y - km[0]) < 2), "materiály: na PC 5 kariet v rade " + JSON.stringify(km));

  // 9) časová os: 4 kroky, pred osou prázdna, za osou plná (obsah-c.js)
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

  // 10) FAQ: 7 otázok zo vzoru, klik rozbalí a zbalí
  await naSekciu("d-faq");
  await t.pauza(400);
  const q = S("d-faq") + " .p1v-faq-q";
  const n = await t.ev(`document.querySelectorAll(${JSON.stringify(q)}).length`);
  ok(n === 7, "FAQ: 7 otázok zo vzoru (" + n + ")");
  try {
    const odp = (i) => t.ev(`(function(){var b=document.querySelectorAll(${JSON.stringify(q)})[${i}],a=document.getElementById(b.getAttribute("aria-controls"));return [b.getAttribute("aria-expanded"),Math.round(a.getBoundingClientRect().height),getComputedStyle(a).visibility]})()`);
    const p0 = await odp(0);
    await t.klikni(q, { index: 0, popis: "FAQ 01", pockaj: 600 });
    const p1 = await odp(0);
    await t.klikni(q, { index: 0, popis: "FAQ 01 späť", pockaj: 600 });
    const p2 = await odp(0);
    ok(p0[0] === "false" && p0[1] === 0 && p1[0] === "true" && p1[1] > 20 && p1[2] === "visible" && p2[0] === "false" && p2[1] === 0,
      "FAQ 01: zbalená -> klik rozbalí odpoveď -> klik zbalí " + JSON.stringify([p0, p1, p2]));
  } catch (e) { ok(false, "FAQ: " + e.message); }

  // 11) záver: tmavý, fotka kabíny 640 v pozadí stiahnutá pri priblížení
  await naSekciu("kamiony-vyzva", "center");
  const end = await t.cakaj(`(function(){var s=document.querySelector(${sek("kamiony-vyzva")});var i=s&&s.querySelector(".endbg img");if(!i||!i.complete||!i.naturalWidth)return false;return [getComputedStyle(s).color,/640-27_/.test(i.getAttribute("src")),Math.round(s.getBoundingClientRect().height)]})()`, { ms: 12000, popis: "fotka záveru" }).catch((e) => ({ chyba: e.message }));
  ok(Array.isArray(end) && end[0] === "rgb(255, 255, 255)" && end[1] && end[2] > 200, "záver: biely text na tmavom, fotka kabíny 640 stiahnutá " + JSON.stringify(end));

  // 13) mierka písma (Michal 18. 10. 2026): vlastné triedy kamiónov (.kg, .kk, .km, .kn) ostro, spoločné časti titulky /
  //     1V obsahu (štítok, nadpis, úvod, recenzie, časová os, FAQ, tlačidlá) len ako upozornenie (spoločné partialy)
  const pis = await t.ev(pismoVyraz(["#p1v-kamiony-1", "#p1v-kamiony-2"], ROLY_OBSAH, ROLY_SPOLOCNE));
  const fp = vypisNalezy(pis), vl = (x) => !x.z, sp = (x) => x.z;
  ok(pis.n > 40 && !pis.zle.filter(vl).length && !pis.riadky.filter(vl).length,
    `písmo obsahu kamiónov podľa mierky (${sir} px, ${pis.n} textov)` + (pis.zle.filter(vl).length || pis.riadky.filter(vl).length ? ": " + fp(pis.zle.filter(vl).concat(pis.riadky.filter(vl))) : ""));
  ok(!pis.zlom.filter(vl).length && !pis.pretek.filter(vl).length && !pis.orez.filter(vl).length && !pis.strana,
    "obsah kamiónov: žiadne slovo zalomené uprostred / pretečené / čiastočne orezané, bez vodorovného posuvníka" +
    (pis.zlom.filter(vl).length || pis.pretek.filter(vl).length || pis.orez.filter(vl).length ? ": " + fp(pis.zlom.concat(pis.pretek, pis.orez).filter(vl)) : ""));
  const spol = pis.zle.filter(sp).concat(pis.riadky.filter(sp), pis.orez.filter(sp));
  ok(!spol.length, "písmo spoločných častí pod kamiónmi (spoločné partialy)" + (spol.length ? ": " + fp(spol) : ""), true);

  // 12) „Vybrať materiál“ (data-p1v-kamion-krok="material") otvorí krok Materiál; bez vozidla krok 1 s červeným rámom (ako ART)
  if (await t.ev(`!!window.__lcd1vKamion`)) {
    const vyzva = `(function(){var a=document.querySelector('.p1v-miesto a[href="#product-detail-form"][data-p1v-kamion-krok="material"]');if(!a)return null;a.click();var k=window.__lcd1vKamion.ui;return [k.U.otvoreny,!!document.querySelector('#lcd1v-kamion [data-krok="vozidlo"].is-error')]})()`;
    const bez = await t.ev(vyzva);
    await t.ev(`(function(){var r=document.getElementById("lcd1v-kamion");function v(p,x){var s=r.querySelector('select[data-p="'+p+'"]');s.value=x;s.dispatchEvent(new Event("change",{bubbles:true}))}v("znacka","DAF (TIR)");v("model","XF106 2017-2021");r.querySelector('[data-a="dalej"][data-v="vozidlo"]').click()})()`);
    await t.pauza(300);
    const s = await t.ev(vyzva);
    ok(JSON.stringify(bez) === JSON.stringify(["vozidlo", true]) && s && s[0] === "material", "„Vybrať materiál“: bez vozidla krok 1 červený, s vozidlom krok Materiál " + JSON.stringify([bez, s]));
  }
  return out;
}
