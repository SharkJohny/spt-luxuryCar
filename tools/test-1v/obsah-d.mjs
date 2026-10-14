// Skupina D obsahu 1V — mapa sekcií (web ↔ návrh v26) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: worker skupiny D (realita, FAQ, Kúpiť a nečakať, zlatá linka čítania, okno #p1v-lb). docs/1v-obsah.md.
// Formát sekcie[] a kontroly(t): pozri tools/test-1v/obsah-a.mjs. Pomocné prvky (d-pomocne) nemajú snímku návrhu.
//
// Kontroly (s ?novy=1, každá šírka; po nich sa stav vráti: okno zatvorené, FAQ zbalené, injektované tlačidlá preč):
//   realita  6 dlaždíc s platným YouTube id, skutočný klik -> okno v <body> nad všetkým (klik na × nič nezakrýva),
//            iframe youtube-nocookie + popis, fokus na ×; zatvorenie vráti fokus a posúvanie stránky; šípka posunie pás
//   faq      12 otázok = button type=button mimo <form>, bez .faq/<details>; klik rozbalí a zbalí odpoveď; otázky aj odpovede
//            = živé FAQ z /faq/ doslovne (rozhodnutie Michala 14. 10. 2026, tools/test-1v/obsah-faq.mjs)
//   koniec   „Zadajte údaje o vozidle“ -> prvý nevyplnený krok otvorený a pod hlavičkou, adresa bez zmeny (nič neodoslané)
//   pomocne  linka čítania mimo obsahu skrytá, v strede obsahu viditeľná a čiastočne plná; okno ako API pre ostatné
//            skupiny: sada 2 fotiek cez data-p1v-lb-* (šípka, počítadlo, Escape) a udalosť ctx.vysli("obsah-d:okno")
import { kontrolaFaqZive } from "./obsah-faq.mjs";

export const SKUPINA = "d";
export const sekcie = [
  { meno: "d-realita", navrh: [{ sel: "#realita" }] },
  { meno: "d-faq", navrh: [{ sel: "section.faqsec" }] },
  { meno: "d-koniec", navrh: [{ sel: "section.end" }] },
  { meno: "d-pomocne", navrh: [] },
];

const FOTO = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/";
const OKNO = `(function () {
  var lb = document.getElementById("p1v-lb");
  if (!lb) return null;
  var ram = lb.querySelector(".p1v-lb-ram"), m = ram && ram.firstElementChild, pod = lb.querySelector(".p1v-lb-pod");
  var x = lb.querySelector(".p1v-lb-x"), sp = lb.querySelector(".p1v-lb-spat"), da = lb.querySelector(".p1v-lb-dalej");
  var r = lb.getBoundingClientRect();
  return { vBody: lb.parentNode === document.body, hidden: lb.hidden, on: lb.classList.contains("on"),
    display: getComputedStyle(lb).display, z: getComputedStyle(lb).zIndex, cela: r.left <= 0 && r.top <= 0 && r.width >= Math.min(document.documentElement.clientWidth, document.body.clientWidth) - 1 && r.height >= innerHeight - 1, rect: Math.round(r.width) + "×" + Math.round(r.height),
    tag: m ? m.tagName.toLowerCase() : null, src: m ? (m.getAttribute("src") || "") : "", pod: pod && !pod.hidden ? pod.textContent : "",
    sipky: !!(sp && !sp.hidden && da && !da.hidden), fokusX: document.activeElement === x,
    overflow: document.documentElement.style.overflow };
})()`;
/** skutočný klik myšou ako t.klikni, ale prvok v hornej tretine okna: na telefóne Luxia po ~25 s rozbalí pozdrav cez
 *  spodnú polovicu okna (360×348, nie je to vec obsahu) — klik do stredu by ho trafil. Zakrytie inak = chyba. */
async function klik(t, sel, { index = 0, popis, pockaj = 300 } = {}) {
  const r = await t.ev(`(async function () {
    var el = document.querySelectorAll(${JSON.stringify(sel)})[${index}];
    if (!el) return { chyba: "prvok nenájdený" };
    var r = el.getBoundingClientRect();
    window.scrollTo({ top: window.pageYOffset + r.top + r.height / 2 - innerHeight * 0.3, behavior: "instant" });
    await new Promise(function (z) { setTimeout(z, 400); });
    r = el.getBoundingClientRect();
    var x = Math.round(r.left + Math.min(r.width / 2, 40)), y = Math.round(r.top + r.height / 2);
    if (r.width < 2 || r.height < 2 || y < 0 || y > innerHeight) return { chyba: "prvok mimo okna" };
    var h = document.elementFromPoint(x, y);
    if (!h || !(h === el || el.contains(h))) return { chyba: "zakryté: " + (h ? h.tagName.toLowerCase() + (h.className && typeof h.className === "string" ? "." + h.className.split(" ")[0] : "") + (h.src ? " " + String(h.src).slice(0, 50) : "") : "nič") };
    return { x: x, y: y };
  })()`);
  if (r.chyba) throw new Error((popis || sel) + ": " + r.chyba);
  await t.k.klik(r.x, r.y);
  await t.pauza(pockaj);
}
/** čaká (bez výnimky), kým je výraz v stránke pravdivý; vráti true/false. Pevná pauza po posune/kliku pod záťažou stroja
 *  (desiatky Chrome iných behov) nestačila a kontrola náhodne zlyhala (jadroChyby T1.3, T3.3, 14. 10. 2026). */
async function pockajNa(t, expr, ms = 5000) {
  const t0 = Date.now();
  for (;;) {
    let r = false;
    try { r = await t.ev(expr); } catch (e) { r = false; }
    if (r) return true;
    if (Date.now() - t0 > ms) return false;
    await t.pauza(120);
  }
}
const OKNO_OTVORENE = `(function () { var lb = document.getElementById("p1v-lb"); return !!lb && !lb.hidden && lb.classList.contains("on"); })()`;
const OKNO_ZAVRETE = `(function () { var lb = document.getElementById("p1v-lb"); return !!lb && lb.hidden && getComputedStyle(lb).display === "none"; })()`;
const KLAVES = (k) => `document.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true }))`;

export async function kontroly(t) {
  const v = [];
  const ok = (podm, popis) => v.push({ ok: !!podm, popis });
  const sel = (m) => ".p1v-miesto " + t.sekcia(m);

  // ---------------------------------------------------------------- pomocné prvky (okno + linka) — základ pre ostatné
  const pomocne = await t.je("d-pomocne");
  if (pomocne) {
    const z = await t.ev(`(function () {
      var c = document.getElementById("p1v-citanie"), lb = document.getElementById("p1v-lb");
      return { c: !!c && c.parentNode === document.body, lb: !!lb && lb.parentNode === document.body && lb.hidden,
        lbDisp: lb ? getComputedStyle(lb).display : null };
    })()`);
    ok(z.c, "linka čítania #p1v-citanie je priamo v <body>");
    ok(z.lb && z.lbDisp === "none", "okno #p1v-lb je v <body>, zatvorené a skryté (display " + z.lbDisp + ")");

    // linka: hore na stránke skrytá, v strede obsahu viditeľná a čiastočne plná, v pätičke skrytá
    const linka = async (kam, ocakavam) => {
      await t.ev(kam);
      await t.pauza(200);
      await pockajNa(t, `(function () { var c = document.getElementById("p1v-citanie"), i = c && c.querySelector("i"); if (!c) return false;
        var m = i ? getComputedStyle(i).transform : "", x = /matrix\\(([^,]+)/.exec(m), s = x ? parseFloat(x[1]) : (m === "none" ? 1 : null), zap = c.classList.contains("zap");
        return ${ocakavam}; })()`, 4000);
      return t.ev(`(function () { var c = document.getElementById("p1v-citanie"), i = c && c.querySelector("i");
        var m = i ? getComputedStyle(i).transform : ""; var s = /matrix\\(([^,]+)/.exec(m);
        return { zap: c.classList.contains("zap"), op: getComputedStyle(c).opacity, s: s ? parseFloat(s[1]) : (m === "none" ? 1 : null),
          z: getComputedStyle(c).zIndex }; })()`);
    };
    const hore = await linka(`window.scrollTo({ top: 0, behavior: "instant" })`, "!zap");
    ok(!hore.zap, "linka čítania je pri konfigurátore skrytá");
    const stred = await linka(`(function () { var m = document.querySelector(".p1v-miesto"), r = m.getBoundingClientRect();
      window.scrollTo({ top: window.pageYOffset + r.top + r.height / 2 - innerHeight / 2, behavior: "instant" }); })()`, "zap && s > 0.2 && s < 0.8");
    ok(stred.zap && stred.s > 0.2 && stred.s < 0.8, `linka čítania v strede obsahu viditeľná a z časti plná (zap ${stred.zap}, plnosť ${stred.s})`);
    const dole = await linka(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })`, "!zap");
    ok(!dole.zap, "linka čítania v pätičke skrytá");
  }

  // ---------------------------------------------------------------- d-realita
  if (await t.je("d-realita")) {
    const s = sel("d-realita");
    const d = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(s)});
      var k = [].slice.call(s.querySelectorAll(".vids > .vid"));
      return { n: k.length, yt: k.every(function (b) { return /^[\\w-]{6,20}$/.test(b.getAttribute("data-p1v-lb-yt") || "") && b.type === "button"; }),
        lazy: [].every.call(s.querySelectorAll("img"), function (i) { return i.loading === "lazy" && i.getAttribute("width") && i.getAttribute("height"); }),
        vyskaKarty: k[0] ? Math.round(k[0].getBoundingClientRect().height) : 0, sirkaKarty: k[0] ? k[0].offsetWidth : 0 }; })()`);
    ok(d.n === 5 && d.yt, `realita: 5 dlaždíc s YouTube id (${d.n}); V-klasa vynechaná kvôli náhľadu „NA MILIMETER.“`);
    ok(d.lazy, "realita: obrázky lazy s width/height");
    ok(d.sirkaKarty >= 170 && d.sirkaKarty <= 232 && d.vyskaKarty > d.sirkaKarty * 1.4, `realita: karta 9:16 (${d.sirkaKarty}×${d.vyskaKarty})`);

    if (pomocne) {
      await klik(t, s + " .vids > .vid", { index: 0, popis: "realita: prvé video", pockaj: 150 });
      await pockajNa(t, OKNO_OTVORENE);
      let o = await t.ev(OKNO);
      ok(o && !o.hidden && o.on && o.vBody && o.cela, "realita: klik otvorí okno na celé okno prehliadača (" + JSON.stringify(o && { hidden: o.hidden, on: o.on, vBody: o.vBody, rect: o.rect, display: o.display }) + ")");
      ok(o && o.tag === "iframe" && /^https:\/\/www\.youtube-nocookie\.com\/embed\/snb_QNjkcIs\?/.test(o.src), "realita: okno prehráva správne video (" + (o && o.src.slice(0, 60)) + ")");
      ok(o && o.pod === "Perfektná inštalácia koberčekov na mieru", "realita: popis videa v okne („" + (o && o.pod) + "“)");
      ok(o && o.fokusX && o.overflow === "hidden", "realita: fokus na × a stránka sa pod oknom neposúva");
      ok(o && !o.sipky, "realita: jedno video bez šípok");
      // × skutočným klikom = nič ho nezakrýva (hlavička, Luxia, lepivá lišta)
      let zakryte = null;
      try { await t.klikni("#p1v-lb .p1v-lb-x", { popis: "okno: zavrieť", pockaj: 450 }); } catch (e) { zakryte = e.message; }
      ok(!zakryte, "okno: × je navrchu a dá sa kliknúť" + (zakryte ? " — " + zakryte : ""));
      if (zakryte) await t.ev(KLAVES("Escape"));
      await pockajNa(t, OKNO_ZAVRETE);
      o = await t.ev(OKNO);
      const fokus = await t.ev(`document.activeElement && document.activeElement.matches(${JSON.stringify(s + " .vid")})`);
      ok(o && o.hidden && o.display === "none" && !o.tag && o.overflow === "", "okno: po zatvorení skryté, video zastavené (rám prázdny), posúvanie stránky vrátené");
      ok(fokus, "okno: fokus sa vrátil na dlaždicu videa");
    }

    // šípky: ak sa pás nezmestí, posunú ho
    const nav = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(s)}), p = s.querySelector(".vids"), n = s.querySelector(".vidnav");
      return { skryte: n.hidden, display: getComputedStyle(n).display, pretek: p.scrollWidth - p.clientWidth, x: p.scrollLeft }; })()`);
    ok(nav.skryte === (nav.pretek < 8) && (nav.display === "none") === nav.skryte, `realita: šípky len keď sa pás nezmestí (preteká ${nav.pretek} px, skryté ${nav.skryte})`);
    if (!nav.skryte) {
      await klik(t, s + " .p1v-vid-dalej", { popis: "realita: ďalšie video", pockaj: 150 });
      await pockajNa(t, `document.querySelector(${JSON.stringify(s + " .vids")}).scrollLeft > ${nav.x + 50}`, 4000);
      const x2 = await t.ev(`document.querySelector(${JSON.stringify(s + " .vids")}).scrollLeft`);
      ok(x2 > nav.x + 50, `realita: šípka posunie pás (${nav.x} -> ${x2})`);
      await t.ev(`document.querySelector(${JSON.stringify(s + " .vids")}).scrollTo({ left: 0, behavior: "instant" })`);
    }
  }

  // ---------------------------------------------------------------- d-faq
  if (await t.je("d-faq")) {
    const s = sel("d-faq");
    const d = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(s)});
      var b = [].slice.call(s.querySelectorAll(".p1v-faq-q"));
      return { n: b.length, typ: b.every(function (x) { return x.type === "button" && !x.closest("form") && x.getAttribute("aria-expanded") === "false"
          && document.getElementById(x.getAttribute("aria-controls")) === x.nextElementSibling; }),
        zakazane: s.querySelectorAll(".faq, .accordion, details").length,
        zbalene: b.every(function (x) { var a = x.nextElementSibling; return a.getBoundingClientRect().height < 2 && getComputedStyle(a).visibility === "hidden"; }) }; })()`);
    ok(d.n === 12 && d.typ, `faq: 12 otázok = button type=button mimo formulára košíka, aria-controls na odpoveď (${d.n})`);
    ok(d.zakazane === 0, "faq: bez .faq/.accordion/<details> (kotvy živého JS, TinyMCE)");
    ok(d.zbalene, "faq: odpovede na začiatku zbalené a skryté pred čítačkou");
    const fz = await kontrolaFaqZive(t, s);
    ok(fz.ok, fz.popis);
    const pred = await t.ev("location.href");
    await klik(t, s + " .p1v-faq-q", { index: 0, popis: "faq: prvá otázka", pockaj: 150 });
    await pockajNa(t, `(function () { var b = document.querySelector(${JSON.stringify(s + " .p1v-faq-q")}), a = b.nextElementSibling;
      return b.getAttribute("aria-expanded") === "true" && a.getBoundingClientRect().height > 30 && getComputedStyle(a).visibility === "visible"
        && getComputedStyle(b.querySelector(".p")).transform !== "none"; })()`);
    const o = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(s + " .p1v-faq-q")}), a = b.nextElementSibling;
      return { exp: b.getAttribute("aria-expanded"), h: Math.round(a.getBoundingClientRect().height), vis: getComputedStyle(a).visibility,
        txt: a.textContent.trim().slice(0, 40), p: getComputedStyle(b.querySelector(".p")).transform }; })()`);
    ok(o.exp === "true" && o.h > 30 && o.vis === "visible" && o.txt.length > 10, `faq: klik rozbalí odpoveď (výška ${o.h}, „${o.txt}…“)`);
    ok(o.p !== "none", "faq: + sa otočí na ×");
    await klik(t, s + " .p1v-faq-q", { index: 0, popis: "faq: prvá otázka znova", pockaj: 150 });
    // Zbalené = aria-expanded false a riadok mriežky 0px (cieľ prechodu). Odpoveď 1 je od 14. 10. 2026 živé FAQ (6 odsekov, ~400 px):
    // v karte na pozadí paralelného behu hodiny animácií stoja a výška ostane na ~2 px chvosta prechodu (3 z 19 behov pri 1280,
    // namerané {"exp":"false","h":2,"vis":"visible","rows":"0px"}) — preto stačí riadok 0px alebo výška pod 2 px.
    const zbalena = `(function () { var b = document.querySelector(${JSON.stringify(s + " .p1v-faq-q")}), a = b.nextElementSibling;
      return b.getAttribute("aria-expanded") === "false" && (a.getBoundingClientRect().height < 2 || getComputedStyle(a).gridTemplateRows === "0px"); })()`;
    await pockajNa(t, zbalena, 8000);
    const z = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(s + " .p1v-faq-q")}), a = b.nextElementSibling;
      return { exp: b.getAttribute("aria-expanded"), h: Math.round(a.getBoundingClientRect().height), vis: getComputedStyle(a).visibility, rows: getComputedStyle(a).gridTemplateRows }; })()`);
    const zbaleneOk = z.exp === "false" && (z.h < 2 || z.rows === "0px");
    ok(zbaleneOk, "faq: druhý klik odpoveď zbalí" + (zbaleneOk ? "" : " " + JSON.stringify(z)));
    ok((await t.ev("location.href")) === pred, "faq: klik nič neodoslal ani nezmenil adresu");
  }

  // ---------------------------------------------------------------- d-koniec
  if (await t.je("d-koniec")) {
    const s = sel("d-koniec");
    await t.ev(`document.querySelector(${JSON.stringify(s)}).scrollIntoView({ block: "center", behavior: "instant" })`);
    await t.pauza(300);
    await pockajNa(t, `(function () { var bg = document.querySelector(${JSON.stringify(s + " .endbg")});
      return !!bg && getComputedStyle(bg).opacity === "0.3" && /\.jpg/.test(getComputedStyle(bg).backgroundImage); })()`, 4000);
    const d = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(s)});
      var h = s.querySelector("h2"), bg = s.querySelector(".endbg");
      return { h2: h && h.textContent.trim(), farba: h && getComputedStyle(h).webkitTextFillColor, bg: bg ? getComputedStyle(bg).backgroundImage : "", bgOp: bg ? getComputedStyle(bg).opacity : "",
        tl: [].map.call(s.querySelectorAll(".end-cta a"), function (a) { return a.textContent.trim(); }).join(" | ") }; })()`);
    ok(d.h2 === "Kúpiť a nečakať!" && d.farba === "rgb(255, 255, 255)", `koniec: biely nadpis „${d.h2}“ (${d.farba})`);
    ok(/lcd-home\/hero\.jpg/.test(d.bg) && d.bgOp === "0.3", "koniec: ozdobné pozadie (hero.jpg, priehľadnosť 0.3) po priblížení");
    ok(d.tl === "Zadajte údaje o vozidle | Pozrite si recenzie", "koniec: tlačidlá (" + d.tl + ")");
    const pred = await t.ev("location.href");
    await klik(t, s + " [data-p1v-konf]", { popis: "koniec: Zadajte údaje o vozidle", pockaj: 600 });
    // plynulý posun ku konfigurátoru: čakať, kým cieľ (prvý nevyplnený krok / súhrn) je v hornej časti okna a posun stojí
    await pockajNa(t, `(function () { var c = window.__lcd1v, krok = c && c.prvyNevyplneny ? c.prvyNevyplneny() : null;
      var el = krok || document.querySelector(".lcd1v-suhrn") || (c && c.krok("kosik")); if (!el) return false;
      var r = el.getBoundingClientRect(), y = Math.round(pageYOffset), stoji = window.__p1vPosunY === y; window.__p1vPosunY = y;
      return stoji && r.top >= 0 && r.top < innerHeight * 0.6; })()`, 6000);
    const k = await t.ev(`(function () {
      var c = window.__lcd1v, krok = c && c.prvyNevyplneny ? c.prvyNevyplneny() : null;
      var el = krok || document.querySelector(".lcd1v-suhrn") || (c && c.krok("kosik"));
      if (!el) return { chyba: "nič na posun" };
      var r = el.getBoundingClientRect();
      return { krok: !!krok, meno: krok && c.menoKroku ? c.menoKroku(krok) : null, active: krok ? krok.classList.contains("active") : null,
        top: Math.round(r.top), vh: innerHeight, otvorenych: (c.kroky() || []).filter(function (x) { return x.classList.contains("active"); }).length };
    })()`);
    ok(!k.chyba && k.top >= 0 && k.top < k.vh * 0.6, `koniec: posun na ${k.krok ? "prvý nevyplnený krok " + (k.meno || "") : "súhrn košíka"} (hore ${k.top} px z ${k.vh})`);
    if (k.krok) ok(k.active && k.otvorenych === 1, `koniec: chýbajúci krok je otvorený a jediný (${k.active}, otvorených ${k.otvorenych})`);
    ok((await t.ev("location.href")) === pred, "koniec: klik nič neodoslal ani nezmenil adresu");
  }

  // ---------------------------------------------------------------- okno ako API pre ostatné skupiny
  if (pomocne) {
    const host = (await t.je("d-realita")) ? sel("d-realita") + " .wrap" : ".p1v-miesto";
    await t.ev(`(function () { var h = document.querySelector(${JSON.stringify(host)}), d = document.createElement("div");
      d.id = "p1v-test-okno"; d.style.cssText = "display:flex;gap:8px;margin:12px 0";
      d.innerHTML = '<button type="button" data-p1v-lb-foto="${FOTO}f03.jpg" data-p1v-lb-sada="test" data-p1v-lb-popis="Prvá">A</button>'
        + '<button type="button" data-p1v-lb-foto="${FOTO}f04.jpg" data-p1v-lb-sada="test"><img src="${FOTO}f04.jpg" alt="Druhá" width="40" height="40"></button>';
      h.appendChild(d); })()`);
    await klik(t, "#p1v-test-okno button", { index: 0, popis: "okno: fotka zo sady", pockaj: 150 });
    await pockajNa(t, OKNO_OTVORENE);
    let o = await t.ev(OKNO);
    ok(o && !o.hidden && o.tag === "img" && /f03\.jpg$/.test(o.src) && o.pod === "Prvá · 1 / 2" && o.sipky, `okno API: fotka zo sady (${o && o.tag} ${o && o.src.slice(-8)}, „${o && o.pod}“, šípky ${o && o.sipky})`);
    await t.ev(KLAVES("ArrowRight"));
    await pockajNa(t, `(function () { var m = document.querySelector("#p1v-lb .p1v-lb-ram img"); return !!m && /f04\.jpg$/.test(m.getAttribute("src") || ""); })()`, 3000);
    o = await t.ev(OKNO);
    ok(o && /f04\.jpg$/.test(o.src) && o.pod === "Druhá · 2 / 2", `okno API: šípka doprava = ďalšia fotka, popis z alt (${o && o.src.slice(-8)}, „${o && o.pod}“)`);
    const ram = await t.ev(`(function () { var i = document.querySelector("#p1v-lb .p1v-lb-ram img"), r = i && i.getBoundingClientRect();
      return r ? { w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight } : null; })()`);
    ok(ram && ram.w > 50 && ram.w <= ram.vw && ram.h <= ram.vh, "okno API: fotka sa zmestí do okna (" + JSON.stringify(ram) + ")");
    await t.ev(KLAVES("Escape"));
    await pockajNa(t, OKNO_ZAVRETE);
    o = await t.ev(OKNO);
    ok(o && o.hidden && !o.tag, "okno API: Escape zatvorí");
    // udalosť pre skupiny bez importu
    await t.ev(`window.__lcd1v.vysli("obsah-d:okno", { polozky: [{ typ: "foto", src: "${FOTO}f03.jpg", popis: "Udalosť" }] })`);
    await pockajNa(t, OKNO_OTVORENE);
    o = await t.ev(OKNO);
    ok(o && !o.hidden && o.tag === "img" && o.pod === "Udalosť" && !o.sipky, "okno API: udalosť obsah-d:okno otvorí jednu fotku bez šípok");
    // klik na pozadie zatvorí
    await t.ev(`document.getElementById("p1v-lb").dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
    await pockajNa(t, OKNO_ZAVRETE);
    o = await t.ev(OKNO);
    ok(o && o.hidden, "okno API: klik na pozadie zatvorí");
    // neplatná položka (javascript:, cudzie id) sa neotvorí
    await t.ev(`window.__lcd1v.vysli("obsah-d:okno", { polozky: [{ typ: "foto", src: "javascript:alert(1)" }, { typ: "yt", src: "<x>" }] })`);
    await t.pauza(200);
    o = await t.ev(OKNO);
    ok(o && o.hidden, "okno API: neplatné položky sa neotvoria");
    await t.ev(`(function () { var d = document.getElementById("p1v-test-okno"); if (d) d.parentNode.removeChild(d); })()`);
  }
  await t.ev(`window.scrollTo({ top: 0, behavior: "instant" })`);
  return v;
}
