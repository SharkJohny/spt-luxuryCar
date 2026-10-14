// Skupina B obsahu 1V — mapa sekcií (web ↔ návrh v26) a kontroly pre tools/test-1v-obsah.mjs.
// VLASTNÍK: worker skupiny B (Deväť vecí, materiál, porovnanie + výzva, pred a po). docs/1v-obsah.md.
// Formát sekcie[] a kontroly(t): pozri tools/test-1v/obsah-a.mjs.
//
// Kontroly (s ?novy=1, každá šírka): sekcie viditeľné; tlačidlá vedú na #product-detail-form; naša cena „od …“ prišla zo
// živých dát (nie z HTML); Deväť vecí — PC: výška scény 9 × 44 vh, scroll prepína kroky, klik na náhľad posunie,
// telefón/tablet na výšku: karusel z toho istého markupu (9 kariet, 9 bodiek v jednom riadku, bodka posunie kartu);
// Materiál — PC: scroll rozloží rez, telefón: tlačidlo Rozložiť/Zložiť, legenda ako akordeón; Pred a po — čiara a percentá
// sa pohnú pri scrollovaní; reveal .rv v porovnaní.
export const SKUPINA = "b";
export const sekcie = [
  { meno: "b-ocakavat", navrh: [{ sel: "#ocakavat" }, { sel: "#s2Mob" }] },
  { meno: "b-material", navrh: [{ sel: "#material" }] },
  { meno: "b-porovnanie", navrh: [{ sel: "#porovnanie" }, { sel: ".spat", za: "#porovnanie" }] },
  { meno: "b-predapo", navrh: [{ sel: "#predapo" }] },
];

/** rovnaký zlom ako obsah-b.js MQ_STATICKA / LCD-HOME */
const MQ = "(max-width:900px), (min-width:901px) and (max-width:1199px) and (orientation:portrait) and (hover:none) and (pointer:coarse)";

export async function kontroly(t) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const S = (m) => JSON.stringify(t.sekcia(m));
  const je = {};
  for (const s of sekcie) je[s.meno] = await t.je(s.meno);
  if (!Object.values(je).some(Boolean)) return out;
  // chat a pod. môžu prekryť klik (skutočný klik s kontrolou zakrytia)
  await t.ev(`[].forEach.call(document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"]'), function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
  const staticka = await t.ev(`matchMedia(${JSON.stringify(MQ)}).matches`);
  // posun stránky tak, aby prvok sel bol na pozícii p (0..1) svojej scény (výška - okno), alebo na vrchu okna (p = null)
  const posun = (sel, p, { dalej = 0 } = {}) => t.ev(`(async function () {
    var el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
    var r = el.getBoundingClientRect(), top = r.top + scrollY;
    var y = ${p === null ? "top - 80" : `top + ${p} * Math.max(0, r.height - innerHeight)`} + ${dalej};
    scrollTo({ top: Math.max(0, y - 400), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 120); });
    scrollTo({ top: Math.max(0, y), behavior: "instant" }); await new Promise(function (z) { setTimeout(z, 450); });
    return Math.round(scrollY);
  })()`);

  // ---------------------------------------------------------------- spoločné
  const vid = await t.ev(`(function () { var o = {}; ${JSON.stringify(sekcie.map((s) => s.meno))}.forEach(function (m) {
    var e = document.querySelector('.p1v-miesto [data-lcd-sekcia="' + m + '"]'); o[m] = !!(e && e.getClientRects().length && e.getBoundingClientRect().height > 50); }); return o; })()`);
  for (const s of sekcie) if (je[s.meno]) ok(vid[s.meno], `${s.meno}: sekcia je viditeľná`);
  const kotvy = await t.ev(`(function () { var a = [].slice.call(document.querySelectorAll('.p1v-miesto [data-lcd-sekcia^="b-"] a[href]'));
    return { n: a.length, zle: a.filter(function (x) { return x.getAttribute("href") !== "#product-detail-form"; }).map(function (x) { return x.getAttribute("href"); }), ciel: !!document.getElementById("product-detail-form") }; })()`);
  ok(kotvy.n >= 1 && !kotvy.zle.length && kotvy.ciel, `skupina B: ${kotvy.n} tlačidiel vedie na #product-detail-form (zlé: ${kotvy.zle.join(", ") || "—"})`);

  // ---------------------------------------------------------------- porovnanie: cena + reveal
  if (je["b-porovnanie"]) {
    let cena = "";
    try { cena = await t.cakaj(`(function () { var e = document.querySelector(${S("b-porovnanie")} + " .p1v-b-od.ma-cenu"); return e && e.getClientRects().length ? e.textContent : ""; })()`, { ms: 9000, popis: "cena od" }); } catch (e) { cena = ""; }
    ok(/^od\s.*\d/.test(cena), `b-porovnanie: naša cena zo živých dát „${cena || "—"}“`);
    // reveal: po prejdení sekcie (nadpis -> výzva) sú všetky .rv odhalené
    const rvSel = t.sekcia("b-porovnanie") + " .rv";
    const n = await t.ev(`document.querySelectorAll(${JSON.stringify(rvSel)}).length`);
    for (let i = 0; i < n; i++) {
      await t.ev(`(function () { var e = document.querySelectorAll(${JSON.stringify(rvSel)})[${i}]; if (e) e.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
      await t.pauza(350);
    }
    const rv = await t.cakaj(`(function () { var a = document.querySelectorAll(${JSON.stringify(rvSel)}), n = 0; [].forEach.call(a, function (e) { if (e.classList.contains("on") && getComputedStyle(e).opacity > 0.5) n++; }); return n === a.length && a.length > 0 ? n : 0; })()`, { ms: 4000, popis: "reveal porovnania" }).catch(() => 0);
    ok(rv === n && n >= 4, `b-porovnanie: ${rv}/${n} prvkov .rv odhalených po prejdení sekcie`);
  }

  // ---------------------------------------------------------------- Deväť vecí
  if (je["b-ocakavat"]) {
    const sek = t.sekcia("b-ocakavat");
    if (staticka) {
      await posun(sek, null);
      const k = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), m = s.querySelector(".pinmain"), cw = document.documentElement.clientWidth;
        var bod = [].slice.call(s.querySelectorAll(".s2-rail button")).map(function (b) { var r = b.getBoundingClientRect(); return [Math.round((r.top + r.bottom) / 2), Math.round(r.left), Math.round(r.right)]; });
        var im = [].slice.call(s.querySelectorAll(".s2-media img")).map(function (i) { return Math.round(i.getBoundingClientRect().top); });
        return { posuv: m.scrollWidth > m.clientWidth + 50, karty: im.length, riadok: new Set(im).size === 1, bodky: bod.length,
          jedenRiadok: bod.every(function (b) { return Math.abs(b[0] - bod[0][0]) <= 3; }), vOkne: bod.every(function (b) { return b[1] >= 0 && b[2] <= cw; }),
          stage: s.querySelector(".stage2").style.height, lista: getComputedStyle(s.querySelector(".pinfoot")).display }; })()`);
      ok(k.posuv && k.karty === 9 && k.riadok, `b-ocakavat (karusel): posuvný pás, ${k.karty} kariet v jednom riadku`);
      ok(k.bodky === 9 && k.jedenRiadok && k.vOkne, `b-ocakavat (karusel): ${k.bodky} bodiek v jednom riadku v okne`);
      ok(!k.stage && k.lista === "none", `b-ocakavat (karusel): bez výšky prilepenej scény (${k.stage || "auto"}) a bez spodnej lišty`);
      await t.klikni(sek + " .s2-rail button", { index: 2, popis: "bodka 3", pockaj: 1200 });
      const po = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}), m = s.querySelector(".pinmain"), r = m.getBoundingClientRect();
        var i = s.querySelectorAll(".s2-media img")[2].getBoundingClientRect(); var on = s.querySelector(".s2-rail button.on");
        return { odchylka: Math.round(Math.abs(i.left + i.width / 2 - (r.left + r.width / 2))), on: on ? on.getAttribute("data-i") : null }; })()`);
      ok(po.odchylka < 24 && po.on === "2", `b-ocakavat (karusel): bodka 3 posunula kartu 3 do stredu (odchýlka ${po.odchylka} px, aktívna ${po.on})`);
    } else {
      const v = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)} + " .stage2"); return { h: s.getBoundingClientRect().height, cak: 9 * 0.44 * innerHeight, pin: getComputedStyle(s.querySelector(".pin2")).position }; })()`);
      ok(Math.abs(v.h - v.cak) < 3 && v.pin === "sticky", `b-ocakavat (PC): scéna ${Math.round(v.h)} px = 9 × 44 vh (${Math.round(v.cak)}), prilepená (${v.pin})`);
      await posun(sek + " .stage2", 0.6);
      const k = await t.cakaj(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); var on = s.querySelector(".s2-t.on"), im = s.querySelector(".s2-media img.on");
        return on && im && on.getAttribute("data-i") === "5" && im.getAttribute("data-i") === "5" ? s.querySelector(".s2-big").textContent : ""; })()`, { ms: 3000, popis: "krok 6 pri 60 %" }).catch(() => "");
      ok(k === "06", `b-ocakavat (PC): pri 60 % scény je krok 06 (číslo „${k || "—"}“)`);
      await t.klikni(sek + " .s2-thumbs button", { index: 2, popis: "náhľad 03", pockaj: 200 });
      const n = await t.cakaj(`(function () { var on = document.querySelector(${JSON.stringify(sek)} + " .s2-t.on"); return on && on.getAttribute("data-i") === "2" ? "2" : ""; })()`, { ms: 4000, popis: "náhľad 03 posunie na krok 3" }).catch(() => "");
      ok(n === "2", "b-ocakavat (PC): klik na náhľad 03 posunie scénu na krok 3");
      const th = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(sek)} + " .s2-thumbs button[data-i='8']"); return b ? getComputedStyle(b, ":before").backgroundImage : ""; })()`);
      ok(/b-ocakavat-zvierata\.jpg/.test(th), "b-ocakavat (PC): náhľad 09 má fotku z CSS (assets/img/1v/obsah/b-ocakavat-zvierata.jpg)");
    }
  }

  // ---------------------------------------------------------------- Materiál
  if (je["b-material"]) {
    const sek = t.sekcia("b-material");
    if (staticka) {
      await posun(sek + " .exp", null);
      await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(sek)} + " .mat-toggle"); if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
      await t.pauza(1300); // rez sa na telefóne rozloží sám 500 ms po zobrazení — tlačidlo ho potom zloží
      const pred = await t.ev(`document.querySelector(${JSON.stringify(sek)} + " .exp").classList.contains("open")`);
      await t.klikni(sek + " .mat-toggle", { popis: "Rozložiť/Zložiť materiál", pockaj: 500 });
      const po = await t.ev(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return { open: s.querySelector(".exp").classList.contains("open"), text: s.querySelector(".mat-toggle").textContent.trim() }; })()`);
      ok(po.open !== pred && po.text === (po.open ? "Zložiť materiál" : "Rozložiť materiál"), `b-material (telefón): tlačidlo prepne rez (${pred ? "rozložený" : "zložený"} -> ${po.open ? "rozložený" : "zložený"}, „${po.text}“)`);
    } else {
      await posun(sek + " .stage", 0.5);
      const o = await t.cakaj(`(function () { var s = document.querySelector(${JSON.stringify(sek)}); return s.querySelector(".exp").classList.contains("open") ? s.querySelector(".pinfoot .pf-bar i").style.width : ""; })()`, { ms: 3000, popis: "rez rozložený pri 50 %" }).catch(() => "");
      ok(o === "100%", `b-material (PC): pri 50 % scény je rez rozložený (lišta ${o || "—"})`);
    }
    await t.ev(`(function () { var b = document.querySelectorAll(${JSON.stringify(sek)} + " .leg-h")[1]; if (b) b.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
    await t.pauza(300);
    await t.klikni(sek + " .leg-h", { index: 1, popis: "legenda 2", pockaj: 600 });
    const l = await t.ev(`(function () { var L = document.querySelectorAll(${JSON.stringify(sek)} + " .leg"); var h = L[1].querySelector(".leg-h"), d = L[1].querySelector(".leg-d");
      return { exp: h.getAttribute("aria-expanded"), h: Math.round(d.getBoundingClientRect().height), ine: [].filter.call(L, function (x) { return x.querySelector(".leg-h").getAttribute("aria-expanded") === "true"; }).length }; })()`);
    ok(l.exp === "true" && l.h > 20 && l.ine === 1, `b-material: legenda 2 sa otvorila (výška popisu ${l.h} px, otvorených ${l.ine})`);
  }

  // ---------------------------------------------------------------- Pred a po
  if (je["b-predapo"]) {
    const sek = t.sekcia("b-predapo");
    const lep = await t.ev(`document.querySelector(${JSON.stringify(sek)}).classList.contains("lx-bez-lepu")`);
    if (lep) await t.ev(`(function () { var p = document.querySelector(${JSON.stringify(sek)} + " .lx-pp-plocha"); var r = p.getBoundingClientRect(); scrollTo({ top: r.top + scrollY - innerHeight * 0.2, behavior: "instant" }); })()`);
    else await posun(sek, 0.6);
    const c = await t.cakaj(`(function () { var n = +document.querySelector(${JSON.stringify(sek)} + " .lx-pp-cislo").textContent; return n > 0 ? String(n) : ""; })()`, { ms: 3000, popis: "pred a po: percentá" }).catch(() => "");
    ok(Number(c) > 0, `b-predapo (${lep ? "neprilepená" : "prilepená"} scéna): pri posune ${c || 0} % podlahy pod ochranou`);
    const sw = await t.ev(`getComputedStyle(document.querySelector(${JSON.stringify(sek)} + " .lx-leg-sw")).backgroundImage`);
    ok(/lcd-home\/pp-1\.jpg/.test(sw), "b-predapo: vzorka 1 v legende z CSS (lcd-home/pp-1.jpg)");
  }
  return out;
}
