// Skupina A obsahu 1V — mapa sekcií (web ↔ návrh v26) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: worker skupiny A (ponuka dvojvrstvových, referenčné videá, galéria, recenzie). docs/1v-obsah.md.
//
// sekcie[].meno = data-lcd-sekcia obalu sekcie v admin-html/src/p1v-598/1x-a-*.sk.html
// sekcie[].navrh = ako nájsť to isté v návrhu (jednovrstvove.html); snímka = spoločný obdĺžnik všetkých kúskov:
//   { sel: "#referencie" } · { sel: "section", text: "Jazdíte aj v zime" } (prvý so zhodným textom)
//   · { sel: ".spat", za: "#porovnanie" } (prvý .spat za #porovnanie v poradí dokumentu). Neviditeľný kúsok sa preskočí.
export const SKUPINA = "a";
export const sekcie = [
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Jazdíte aj v zime" }] },
  { meno: "a-referencie", navrh: [{ sel: "#referencie" }] },
  { meno: "a-galeria", navrh: [{ sel: "#galeria" }] },
  { meno: "a-recenzie", navrh: [{ sel: "#recenzie" }] },
];

/** Kontroly s ?novy=1 po vložení obsahu (raz na každú šírku). t = pomocník tools/test-1v/pomocnik.mjs
 *  (t.ev, t.cakaj, t.klikni — skutočný klik s kontrolou zakrytia, t.sirka, t.mobil, t.pauza) + t.sekcia(meno) = selektor
 *  obalu sekcie + await t.je(meno) = sekcia je na stránke (stub nie je). Vráti pole { ok, popis }. */
export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const S = (m) => JSON.stringify(t.sekcia(m));
  // okno chatu Luxia (iframe tretej strany) sa na telefóne samo otvára cez stred obrazovky — pre klik ho skryjeme (len test)
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);

  // --- všetky sekcie A: viditeľné, odhalené (.rv dostanú .on pri zobrazení)
  for (const m of sekcie.map((x) => x.meno)) {
    if (!(await t.je(m))) continue;
    const r = await t.ev(`(async function () {
      var s = document.querySelector(${S(m)}); s.scrollIntoView({ block: "start", behavior: "instant" });
      await new Promise(function (r) { setTimeout(r, 1300); });
      var rv = [].slice.call(s.querySelectorAll(".rv")), vid = rv.filter(function (x) { var b = x.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0; });
      return { h: s.getBoundingClientRect().height, rv: s.classList.contains("p1v-rv"), skryte: vid.filter(function (x) { return getComputedStyle(x).opacity < 0.9; }).length, vid: vid.length };
    })()`);
    ok(r.h > 150 && r.rv && r.skryte === 0, `${m}: viditeľná a odhalená (výška ${Math.round(r.h)} px, .p1v-rv ${r.rv}, .rv vo výreze skryté ${r.skryte}/${r.vid})`);
  }

  // --- a-ponuka: odkaz na dvojvrstvové TOHO ISTÉHO vzoru (žiadna cena v sekcii). --produkt (T0.3): 598 -> elite Diamond,
  //     610 -> elite Hexa, 613 -> elite Stripe (data-p1v-odkaz="dvoj", obsah-cisla.js). Kým značka v obsahu chýba (T1.1),
  //     na Hexa/Stripe ostáva statický odkaz na Diamond = upozornenie, nie zlyhanie.
  if (await t.je("a-ponuka")) {
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("a-ponuka")}), a = s.querySelector("a.btn"), img = s.querySelector("img");
      return { href: a && a.getAttribute("href"), znacka: !!(a && a.hasAttribute("data-p1v-odkaz")), cena: /\\d\\s*(€|eur|Kč)|(€|Kč)\\s*\\d/i.test(s.textContent), img: img && img.complete && img.naturalWidth > 0 };
    })()`);
    const cakam = (t.sestra && t.sestra("dvoj")) || "/luxusne-autokoberce-dragonskin-elite-diamond-line/";
    const href = String(r.href || "").split("#")[0];
    const vzor = t.produkt && t.produkt.vzor ? t.produkt.vzor : "diamond";
    out.push({ ok: href === cakam, pozor: !r.znacka && vzor !== "diamond", popis: `a-ponuka: tlačidlo vedie na dvojvrstvové toho istého vzoru ${vzor} (${r.href}, čakám ${cakam}${r.znacka ? "" : "; bez data-p1v-odkaz"})` });
    ok(!r.cena, "a-ponuka: žiadna cena v texte");
    ok(r.img, "a-ponuka: fotka sa načítala");
  }

  // --- a-referencie: 6 kariet, poster + video sa načítajú až pri zobrazení, šípky posúvajú, klik = okno D (ak je)
  if (await t.je("a-referencie")) {
    const r = await t.ev(`(async function () {
      var s = document.querySelector(${S("a-referencie")}), deck = s.querySelector(".deck.refs");
      s.scrollIntoView({ block: "center", behavior: "instant" });
      await new Promise(function (r) { setTimeout(r, 1500); });
      var v = [].slice.call(deck.querySelectorAll("video"));
      return { karty: deck.querySelectorAll(".ref").length, postery: v.filter(function (x) { return x.getAttribute("poster"); }).length,
        hra: v.filter(function (x) { return !x.paused; }).length, src: v.filter(function (x) { return x.getAttribute("src"); }).length,
        sirka: deck.scrollWidth > deck.clientWidth, yt: s.querySelectorAll("[data-p1v-lb-yt]").length };
    })()`);
    ok(r.karty === 6 && r.yt === 6, `a-referencie: 6 kariet s YouTube id (${r.karty}, ${r.yt})`);
    ok(r.postery === 6, `a-referencie: postery nastavené pri zobrazení (${r.postery}/6)`);
    ok(r.hra >= 1 && r.hra <= (t.mobil ? 1 : 2) && r.src <= 6, `a-referencie: prehráva ${r.hra} slučiek (max ${t.mobil ? 1 : 2}), video src ${r.src}/6`);
    if (r.sirka) {
      const x0 = await t.ev(`document.querySelector(${S("a-referencie")} + " .deck.refs").scrollLeft`);
      await t.klikni(t.sekcia("a-referencie") + " .p1v-ref-dalej", { popis: "šípka Ďalšie video", pockaj: 900 });
      const x1 = await t.ev(`document.querySelector(${S("a-referencie")} + " .deck.refs").scrollLeft`);
      ok(x1 > x0, `a-referencie: šípka posunie pás (${Math.round(x0)} -> ${Math.round(x1)})`);
    }
    const okno = await t.ev(`!!document.getElementById("p1v-lb")`);
    if (okno) {
      await t.klikni(t.sekcia("a-referencie") + " .ref-v", { popis: "karta videa", pockaj: 900 });
      const o = await t.ev(`(function () { var lb = document.getElementById("p1v-lb"); var f = lb && lb.querySelector("iframe");
        return { otvorene: !!lb && !lb.hidden, yt: !!f && /youtube(-nocookie)?\\.com\\/embed\\//.test(f.getAttribute("src") || "") }; })()`);
      ok(o.otvorene && o.yt, `a-referencie: klik otvorí video v okne #p1v-lb (otvorené ${o.otvorene}, YouTube ${o.yt})`);
      await t.ev(`(function () { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); })()`);
      await t.pauza(500);
    }
  }

  // --- a-galeria: 8 fotiek + kópie, počítadlo 01 / 08, na PC sa pás posúva scrollom, zväčšenie fotky
  if (await t.je("a-galeria")) {
    const r = await t.ev(`(async function () {
      var s = document.querySelector(${S("a-galeria")}), trat = s.querySelector(".lx-gal-trat");
      var y0 = s.getBoundingClientRect().top + scrollY;
      scrollTo({ top: y0 + 10, behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 400); });
      var t0 = getComputedStyle(trat).transform, c0 = s.querySelector(".lx-gal-cislo").textContent;
      scrollTo({ top: y0 + s.offsetHeight * 0.55, behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 500); });
      var t1 = getComputedStyle(trat).transform, c1 = s.querySelector(".lx-gal-cislo").textContent;
      return { fotky: s.querySelectorAll(".lx-gal-k:not(.lx-klon)").length, klony: s.querySelectorAll(".lx-gal-k.lx-klon").length,
        lepi: !s.classList.contains("lx-bez-lepu"), t0: t0, t1: t1, c0: c0, c1: c1, h: s.offsetHeight, sirka: innerWidth };
    })()`);
    ok(r.fotky === 8 && r.klony === 8, `a-galeria: 8 fotiek + 8 kópií pre pás (${r.fotky} + ${r.klony})`);
    if (!t.mobil && t.sirka > 760) {
      ok(r.lepi && r.h > 1500, `a-galeria: od 761 px prilepená scéna (lepí ${r.lepi}, výška ${r.h} px)`);
      ok(r.t0 !== r.t1 && r.c1 !== r.c0, `a-galeria: scroll posúva pás a počítadlo (${r.c0} -> ${r.c1})`);
    }
    // jedno okno obsahu: fotka galérie sa otvorí v #p1v-lb skupiny D (sada 8 fotiek), nie vo vlastnom .lx-zoom titulky
    const z = await t.ev(`(async function () {
      var s = document.querySelector(${S("a-galeria")}), b = s.querySelectorAll(".lx-gal-k:not(.lx-klon) .lx-gal-f")[1];
      var kl = s.querySelector(".lx-gal-k.lx-klon .lx-gal-f");
      var lb = document.getElementById("p1v-lb");
      if (!lb) return { okno: false };
      b.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise(function (r) { setTimeout(r, 300); });
      b.click(); await new Promise(function (r) { setTimeout(r, 400); });
      var im = lb.querySelector(".p1v-lb-ram img"), poc = (lb.querySelector(".p1v-lb-pod") || {}).textContent || "";
      var r = { okno: true, otv: !lb.hidden, src: !!im && im.getAttribute("src") === b.getAttribute("data-p1v-lb-foto"), poc: poc.replace(/\\s+/g, " ").trim(),
        zoom: !!s.querySelector(".lx-zoom") };
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await new Promise(function (r) { setTimeout(r, 400); });
      r.zatv = lb.hidden;
      if (kl) { kl.click(); await new Promise(function (r) { setTimeout(r, 400); });
        var im2 = lb.querySelector(".p1v-lb-ram img"); r.klon = !lb.hidden && !!im2 && im2.getAttribute("src") === kl.getAttribute("data-p1v-lb-foto");
        r.klonPoc = ((lb.querySelector(".p1v-lb-pod") || {}).textContent || "").replace(/\\s+/g, " ").trim();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await new Promise(function (r) { setTimeout(r, 400); }); }
      return r;
    })()`);
    ok(z.okno && z.otv && z.src && z.zatv && !z.zoom && /2\s*\/\s*8/.test(z.poc) && (z.klon === undefined || (z.klon && /\/\s*8/.test(z.klonPoc))),
      `a-galeria: klik na fotku ju otvorí v okne #p1v-lb (sada ${z.poc}, kópia pásu ${z.klonPoc || "-"}), Escape zavrie, bez .lx-zoom (${JSON.stringify(z)})`);
  }

  // --- a-recenzie: skóre a počet zo živých dát (nie natvrdo), karty z LCD_REVIEWS, šípky
  if (await t.je("a-recenzie")) {
    try { await t.cakaj(`document.querySelector(${S("a-recenzie")}).classList.contains("p1v-rev-ok") || document.querySelector(${S("a-recenzie")}).classList.contains("p1v-rev-bez")`, { ms: 32000, popis: "recenzie: dáta LCD_REVIEWS" }); } catch (e) { /* vyhodnotí sa nižšie */ }
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("a-recenzie")}), d = window.LCD_REVIEWS;
      var cis = function (x) { return (Math.round(Number(x) * 10) / 10).toFixed(1).replace(".", ","); };
      return { ok: s.classList.contains("p1v-rev-ok"), data: !!(d && d.place), skore: s.querySelector(".score").textContent.trim(),
        ocSkore: d && d.place ? cis(d.place.rating) : null, sub: s.querySelector(".sub").textContent.trim(),
        pocet: d && d.place ? d.place.totalReviews : null, karty: s.querySelectorAll(".revs .rev").length,
        prazdne: [].filter.call(s.querySelectorAll(".revs .rev"), function (a) { return !a.querySelector("p").textContent.trim() || !a.querySelector(".meta b").textContent.trim(); }).length,
        vid: getComputedStyle(s.querySelector(".revwrap")).visibility, prvy: (s.querySelector(".revs .rev .meta b") || {}).textContent };
    })()`);
    ok(r.ok && r.data, `a-recenzie: dáta window.LCD_REVIEWS prišli a sekcia je vykreslená (ok ${r.ok}, dáta ${r.data})`);
    ok(r.ok && r.skore === r.ocSkore && r.sub.indexOf(String(r.pocet) + " ") === 0, `a-recenzie: skóre a počet zo živých dát („${r.skore}“, „${r.sub}“)`);
    ok(r.karty >= 6 && r.karty <= 12 && !r.prazdne && r.vid === "visible", `a-recenzie: ${r.karty} kariet (prvá ${r.prvy}), prázdne ${r.prazdne}, pás ${r.vid}`);
    if (r.ok) {
      const x0 = await t.ev(`document.querySelector(${S("a-recenzie")} + " .revs").scrollLeft`);
      await t.klikni(t.sekcia("a-recenzie") + " .p1v-rev-dalej", { popis: "šípka Ďalšia recenzia", pockaj: 900 });
      const x1 = await t.ev(`document.querySelector(${S("a-recenzie")} + " .revs").scrollLeft`);
      ok(x1 > x0, `a-recenzie: šípka posunie pás (${Math.round(x0)} -> ${Math.round(x1)})`);
    }
  }
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.removeProperty("visibility"); })`);
  // pásy späť na začiatok a myš preč (snímky sekcií po kontrolách nech nemajú posunutý pás ani :hover)
  await t.ev(`[].forEach.call(document.querySelectorAll('.p1v-miesto [data-lcd-sekcia^="a-"] :is(.deck.refs, .revs)'), function (p) { p.scrollLeft = 0; })`);
  await t.k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 }).catch(() => {});
  return out;
}
