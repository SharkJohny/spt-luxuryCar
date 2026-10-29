// Skupina A obsahu 1V — mapa sekcií (web ↔ návrh v26) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: worker skupiny A (recenzie, referenčné videá, galéria, ponuka dvojvrstvových). docs/1v-obsah.md.
// Poradie od 15. 10. 2026 (Michal): recenzie PRVÉ pod konfigurátorom, ponuka za galériou a bez tlačidla na iný produkt
// (zákazník ostáva na stránke). Kontrola „poradie A“ platí aj pre dvoj (obsah-dvoj.mjs volá tieto kontroly).
//
// sekcie[].meno = data-lcd-sekcia obalu sekcie v admin-html/src/p1v-598/1x-a-*.sk.html (v poradí na stránke)
// sekcie[].navrh = ako nájsť to isté v návrhu (jednovrstvove.html); snímka = spoločný obdĺžnik všetkých kúskov:
//   { sel: "#referencie" } · { sel: "section", text: "Jazdíte aj v zime" } (prvý so zhodným textom)
//   · { sel: ".spat", za: "#porovnanie" } (prvý .spat za #porovnanie v poradí dokumentu). Neviditeľný kúsok sa preskočí.
// vylúčené z prvých 3 kariet (lcdRecenzie.js VYLUCENE_NAJNOVSIE) — čakané poradie ráta s tým istým zoznamom ako web
import { VYLUCENE_NAJNOVSIE } from "../../assets/js/functions/lcdRecenzie.js";

export const SKUPINA = "a";
export const sekcie = [
  { meno: "a-recenzie", navrh: [{ sel: "#recenzie" }] },
  { meno: "a-referencie", navrh: [{ sel: "#referencie" }] },
  { meno: "a-galeria", navrh: [{ sel: "#galeria" }] },
  { meno: "a-ponuka", navrh: [{ sel: "section.chapter", text: "Jazdíte aj v zime" }] },
];
/** poradie sekcií A na stránke (15. 10. 2026): recenzie hneď pod konfigurátorom, ponuka / porovnanie za galériou */
export const PORADIE_A = sekcie.map((s) => s.meno);

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

  // --- poradie A (Michal 15. 10. 2026): recenzie sú PRVÁ sekcia pod konfigurátorom, ponuka / porovnanie až za galériou;
  //     recenzie majú rytmus ostatných A (nie väčšie odsadenie .after-dark), to má sekcia za tmavou galériou
  {
    const r = await t.ev(`(function () {
      var m = document.querySelector(".p1v-miesto"), v = m ? [].map.call(m.querySelectorAll("[data-lcd-sekcia]"), function (e) { return e.getAttribute("data-lcd-sekcia"); }) : [];
      var pad = function (n) { var e = m && m.querySelector('[data-lcd-sekcia="' + n + '"]'); return e ? parseFloat(getComputedStyle(e).paddingTop) : null; };
      return { vsetky: v, a: v.filter(function (x) { return /^a-/.test(x); }), prva: v[0] || null, padRec: pad("a-recenzie"), padPon: pad("a-ponuka") };
    })()`);
    const cakam = PORADIE_A.filter((m) => r.a.indexOf(m) >= 0);
    ok(r.prva === "a-recenzie", `poradie A: prvá sekcia pod konfigurátorom je a-recenzie (je ${r.prva})`);
    ok(r.a.join(",") === cakam.join(","), `poradie A: ${r.a.join(" → ")} (čakám ${cakam.join(" → ")})`);
    if (r.padRec != null && r.padPon != null) ok(r.padRec < r.padPon, `poradie A: recenzie hore bez väčšieho odsadenia za tmavou sekciou (${r.padRec} px), ponuka za galériou ho má (${r.padPon} px)`);
  }

  // --- a-ponuka: BEZ tlačidla a bez odkazu na iný produkt (Michal 15. 10. 2026: zákazník ostáva na tejto stránke; druhú vrstvu
  //     ponúka konfigurátor), žiadna cena v sekcii (598; dvoj má ceny v tabuľke a túto kontrolu vyradí), fotka
  if (await t.je("a-ponuka")) {
    const r = await t.ev(`(function () {
      var s = document.querySelector(${S("a-ponuka")}), a = [].map.call(s.querySelectorAll("a, [data-p1v-odkaz]"), function (x) { return (x.getAttribute("href") || "") + " " + x.textContent.trim(); }), img = s.querySelector("img");
      return { odkazy: a, cena: /\\d\\s*(€|eur|Kč)|(€|Kč)\\s*\\d/i.test(s.textContent), img: img && img.complete && img.naturalWidth > 0 };
    })()`);
    ok(!r.odkazy.length, `a-ponuka: bez tlačidla a odkazu na iný produkt${r.odkazy.length ? " — je: " + r.odkazy.join(" | ") : ""}`);
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
      var dobra = function (x) { return x && Number(x.rating) >= 4 && String(x.text || "").trim().length > 0; }; // „Zobraziť ďalšie“ = všetky s textom
      return { ok: s.classList.contains("p1v-rev-ok"), data: !!(d && d.place), skore: s.querySelector(".score").textContent.trim(),
        ocSkore: d && d.place ? cis(d.place.rating) : null, sub: s.querySelector(".sub").textContent.trim(),
        pocet: d && d.place ? d.place.totalReviews : null, karty: s.querySelectorAll(".revs .rev").length,
        poFiltri: d && d.reviews ? d.reviews.filter(dobra).length : 0, viac: !!s.querySelector(".p1v-rev-viac"),
        prazdne: [].filter.call(s.querySelectorAll(".revs .rev"), function (a) { return !a.querySelector("p").textContent.trim() || !a.querySelector(".meta b").textContent.trim(); }).length,
        vid: getComputedStyle(s.querySelector(".revwrap")).visibility, prvy: (s.querySelector(".revs .rev .meta b") || {}).textContent,
        // Michal 29. 10. 2026: prvé 3 karty = 3 najnovšie VÝRAZNÉ (večer: 5★ a zobrazený text ≥ 120 znakov, alebo fotky
        // + text ≥ 40 — krátka recenzia nechala prvú kartu skoro prázdnu; dateApprox, inak „Pred N týždňami“ k fetchedAt;
        // pri rovnakom dátume s fotkami, potom vyššie id), potom ručný výber data-p1v-vyber; dátumy „mesiac rok“, nie „Pred …“
        prve3: [].slice.call(s.querySelectorAll(".revs .rev .meta b"), 0, 3).map(function (b) { return b.textContent.trim(); }),
        prve3Dlzky: [].slice.call(s.querySelectorAll(".revs .rev"), 0, 3).map(function (a) { return { n: a.querySelector("p").textContent.trim().length, foto: !!a.querySelector(".shots img") }; }),
        ocPrve3: (function () {
          if (!d || !d.reviews) return [];
          var f = Date.parse(d.place && d.place.fetchedAt), id = function (x) { var m = /^g-(\\d+)$/.exec(String(x.id || "")); return m ? +m[1] : 0; };
          var cas = function (x) { var t = Date.parse(x.dateApprox); if (t > 0) return t; var m = /(\\d+)\\s*týž/i.exec(String(x.relativeDate || "")); return m && f > 0 ? f - m[1] * 6048e5 : 0; };
          // zobrazený text ako lcdRecenzie.js textRecenzie (bez odpovede majiteľa a dátumu na začiatku); fotky len https
          var dlzka = function (x) { return String(x.text || "").replace(/\\s*Luxury Car Design\\s+Vlastník\\b[\\s\\S]*$/i, "").replace(/\\s+/g, " ").trim().replace(/^\\d{1,2}\\.\\s?\\d{1,2}\\.\\s?\\d{4}\\s*/, "").length; };
          var foto = function (x) { return (x.photos || []).some(function (u) { return /^https:\\/\\//.test(u); }); };
          var vyl = ${JSON.stringify(VYLUCENE_NAJNOVSIE)};
          return d.reviews.filter(function (x) { return Number(x.rating) >= 5 && String(x.text || "").trim().length >= 40 && (dlzka(x) >= 120 || (foto(x) && dlzka(x) >= 40)) && vyl.indexOf(String(x.id)) === -1; })
            .sort(function (a, b) { return cas(b) - cas(a) || ((b.photos || []).length - (a.photos || []).length) || id(b) - id(a); })
            .slice(0, 3).map(function (x) { return String(x.author).trim(); });
        })(),
        relativne: [].filter.call(s.querySelectorAll(".revs .rev .meta i"), function (i) { return /pred|před|týž|týd/i.test(i.textContent); }).length };
    })()`);
    ok(r.ok && r.data, `a-recenzie: dáta window.LCD_REVIEWS prišli a sekcia je vykreslená (ok ${r.ok}, dáta ${r.data})`);
    ok(r.ok && r.skore === r.ocSkore && r.sub.indexOf(String(r.pocet) + " ") === 0, `a-recenzie: skóre a počet zo živých dát („${r.skore}“, „${r.sub}“)`);
    ok(r.karty >= 6 && r.karty <= 12 && !r.prazdne && r.vid === "visible", `a-recenzie: ${r.karty} kariet (prvá ${r.prvy}), prázdne ${r.prazdne}, pás ${r.vid}`);
    ok(r.ok && r.prve3.join("|") === r.ocPrve3.join("|"), `a-recenzie: prvé 3 karty = 3 najnovšie výrazné (${r.prve3.join(", ")}; čakané ${r.ocPrve3.join(", ")})`);
    // poistka aj bez prepočtu poradia: žiadna z prvých 3 kariet nie je krátka bez fotky (text < 120 znakov a bez .shots)
    ok(r.ok && r.prve3Dlzky.every((x) => x.n >= 120 || (x.foto && x.n >= 40)), `a-recenzie: prvé 3 karty nie sú skoro prázdne (${r.prve3Dlzky.map((x) => x.n + (x.foto ? "+foto" : "")).join(", ")})`);
    ok(r.ok && !r.relativne, `a-recenzie: dátumy ako „mesiac rok“, nie relatívne (${r.relativne} relatívnych)`);
    ok(r.viac && r.poFiltri > r.karty, `a-recenzie: tlačidlo ďalších recenzií je zobrazené (${r.karty}/${r.poFiltri} kariet)`);
    if (r.ok) {
      const x0 = await t.ev(`document.querySelector(${S("a-recenzie")} + " .revs").scrollLeft`);
      await t.klikni(t.sekcia("a-recenzie") + " .p1v-rev-dalej", { popis: "šípka Ďalšia recenzia", pockaj: 900 });
      const x1 = await t.ev(`document.querySelector(${S("a-recenzie")} + " .revs").scrollLeft`);
      ok(x1 > x0, `a-recenzie: šípka posunie pás (${Math.round(x0)} -> ${Math.round(x1)})`);
      // náhľady fotiek (25. 10. 2026, tools/recenzie-nahlady.py): karta 56 × 56 px berie reviews/m/ (168 px), nie plnú fotku
      await t.cakaj(`[].some.call(document.querySelectorAll(${S("a-recenzie")} + " .rev .shots img"), function (i) { return i.complete && i.naturalWidth > 0 && !/^data:/.test(i.src); }) || !document.querySelector(${S("a-recenzie")} + " .rev .shots img")`, { ms: 15000, popis: "recenzie: náhľad fotky" }).catch(() => {});
      const f = await t.ev(`(function () {
        var im = [].slice.call(document.querySelectorAll(${S("a-recenzie")} + " .rev .shots img")).filter(function (i) { return !/^data:/.test(i.src); });
        var nase = im.filter(function (i) { return /\\/assets\\/img\\/reviews\\//.test(i.src); });
        var nacitane = im.filter(function (i) { return i.complete && i.naturalWidth > 0; });
        return { spolu: im.length, nase: nase.length, plne: nase.filter(function (i) { return !/\\/reviews\\/m\\//.test(i.src); }).map(function (i) { return i.src.split("/").pop(); }),
          nacitane: nacitane.length, najsirsia: nacitane.reduce(function (m, i) { return Math.max(m, i.naturalWidth); }, 0) };
      })()`);
      ok(!f.nase || (!f.plne.length && f.nacitane > 0 && f.najsirsia <= 200), `a-recenzie: fotky v kartách ako náhľady reviews/m/ (${f.nase} našich z ${f.spolu}, plné ${f.plne.length ? f.plne.join(",") : 0}, načítané ${f.nacitane}, najširšia ${f.najsirsia} px)`);
      if (r.viac) {
        await t.klikni(t.sekcia("a-recenzie") + " .p1v-rev-viac", { popis: "Zobraziť ďalšie recenzie", pockaj: 500 });
        const po = await t.ev(`(function () { var s = document.querySelector(${S("a-recenzie")}); return { karty: s.querySelectorAll(".revs .rev").length,
          tlacidlo: !!s.querySelector(".p1v-rev-viac"), lazy: [].every.call(s.querySelectorAll(".revs .rev img"), function (i) { return i.loading === "lazy"; }) }; })()`);
        ok(po.karty === r.poFiltri && !po.tlacidlo && po.lazy, `a-recenzie: po kliku ${po.karty}/${r.poFiltri} kariet, tlačidlo zmizlo, fotky lazy (${po.lazy})`);
      }
    }
  }
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"]'), function (f) { f.style.removeProperty("visibility"); })`);
  // pásy späť na začiatok a myš preč (snímky sekcií po kontrolách nech nemajú posunutý pás ani :hover)
  await t.ev(`[].forEach.call(document.querySelectorAll('.p1v-miesto [data-lcd-sekcia^="a-"] :is(.deck.refs, .revs)'), function (p) { p.scrollLeft = 0; })`);
  await t.k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 }).catch(() => {});
  return out;
}
