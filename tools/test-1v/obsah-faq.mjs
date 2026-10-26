// FAQ obsahu 1V = FAQ živého webu (rozhodnutie Michala 14. 10. 2026): na každom produkte otázky aj odpovede PRESNE ako na živom
// webe — tá istá sada, to isté poradie, doslovne. Živý produkt (bez flagu) načíta FAQ z https://www.luxurycardesign.sk/faq/
// (assets/js/components/index.js: div[itemprop='about'], bloky „[accordion *||*otázka*||*odpoveď]“). Kontrolu volajú pluginy
// obsah-d (598), obsah-dvoj, obsah-classic, obsah-premium, obsah-boxy a obsah-vzorky.
//
//   const r = await faqAkoZive(t, selektorSekcie);   // { n, nZive, rozdiely: [] } — rozdiely prázdne = zhoda
//
// Porovnanie: text otázky aj odpovede bez bielych znakov (&nbsp; aj medzery medzi odsekmi nie sú obsah), poradie, počet, odkazy
// (href) a obrázky (src) v odpovediach. /faq/ si stiahne samotná stránka (to isté robí živý index.js na každom produkte) a parsuje
// ju DOMParserom — inertný dokument, nič sa z neho nesťahuje ani nespúšťa.
export const ZIVE_FAQ = { sk: "https://www.luxurycardesign.sk/faq/", cz: "https://www.luxurycardesign.cz/faq/" };

export function faqAkoZive(t, sel) {
  const faq = ZIVE_FAQ[t.web === "cz" ? "cz" : "sk"];
  return t.ev(`(async function () {
    var bez = function (s) { return String(s || "").replace(/[\\s\\u00a0\\u202f]+/g, ""); };
    var citat = function (s) { return String(s || "").replace(/[\\u00a0\\u202f]/g, " ").replace(/\\s+/g, " ").trim(); };
    var html = "";
    try { html = await fetch(${JSON.stringify(faq)}, { credentials: "same-origin" }).then(function (r) { return r.ok ? r.text() : ""; }); } catch (e) { html = ""; }
    var doc = new DOMParser().parseFromString(html, "text/html");
    var src = [].map.call(doc.querySelectorAll("div[itemprop='about']"), function (x) { return x.innerHTML; }).join("");
    var zive = [];
    src.replace(/\\[accordion([\\s\\S]*?)\\]/g, function (m, vnut) {
      var c = vnut.split("*||*");
      if (c.length < 3) return m;
      var q = doc.createElement("div"); q.innerHTML = c[1];
      var a = doc.createElement("div"); a.innerHTML = c.slice(2).join("*||*").replace(/\\]$/, "");
      zive.push({ q: q.textContent, a: a.textContent,
        h: [].map.call(a.querySelectorAll("a[href]"), function (x) { return x.getAttribute("href"); }),
        i: [].map.call(a.querySelectorAll("img[src]"), function (x) { return x.getAttribute("src"); }) });
      return m;
    });
    var s = document.querySelector(${JSON.stringify(sel)});
    var web = s ? [].map.call(s.querySelectorAll(".p1v-faq-o"), function (o) {
      var t = o.querySelector(".p1v-faq-q .t"), a = o.querySelector(".p1v-faq-a .a");
      return { q: t ? t.textContent : "", a: a ? a.textContent : "",
        h: a ? [].map.call(a.querySelectorAll("a[href]"), function (x) { return x.getAttribute("href"); }) : [],
        i: a ? [].map.call(a.querySelectorAll("img[src]"), function (x) { return x.getAttribute("src"); }) : [] };
    }) : [];
    var rozdiely = [];
    if (!zive.length) rozdiely.push("živé FAQ z " + ${JSON.stringify(faq)} + " sa nedalo prečítať");
    if (zive.length !== web.length) rozdiely.push("počet otázok " + web.length + " ≠ živé " + zive.length);
    var prvy = function (x, y) { var k = 0; while (k < x.length && x[k] === y[k]) k++; return k; };
    for (var k = 0; k < Math.min(zive.length, web.length); k++) {
      var z = zive[k], w = web[k], c = String(k + 1).padStart(2, "0");
      if (bez(z.q) !== bez(w.q)) rozdiely.push(c + " otázka „" + citat(w.q) + "“ ≠ živé „" + citat(z.q) + "“");
      if (bez(z.a) !== bez(w.a)) { var zb = bez(z.a), wb = bez(w.a), i = prvy(zb, wb);
        rozdiely.push(c + " odpoveď sa líši od znaku " + i + ": „…" + wb.slice(Math.max(0, i - 10), i + 30) + "“ ≠ živé „…" + zb.slice(Math.max(0, i - 10), i + 30) + "“"); }
      if (JSON.stringify(z.h) !== JSON.stringify(w.h)) rozdiely.push(c + " odkazy " + JSON.stringify(w.h) + " ≠ živé " + JSON.stringify(z.h));
      var hostik = function (a) { return JSON.stringify((a || []).map(function (u) { return String(u).replace(/www\.luxurycardesign\.(sk|cz)/, "www.luxurycardesign"); })); }; // obrázok FAQ môže byť na SK aj CZ úložisku Shoptetu
      if (hostik(z.i) !== hostik(w.i)) rozdiely.push(c + " obrázky " + JSON.stringify(w.i) + " ≠ živé " + JSON.stringify(z.i));
    }
    return { n: web.length, nZive: zive.length, otazky: web.map(function (x) { return citat(x.q); }), rozdiely: rozdiely };
  })()`);
}

/** Jedna kontrola { ok, popis } pre plugin: FAQ sekcie sel = živé FAQ (počet, poradie, texty, odkazy, obrázky). */
export async function kontrolaFaqZive(t, sel) {
  const r = await faqAkoZive(t, sel);
  return { ok: r.n > 0 && r.n === r.nZive && !r.rozdiely.length,
    popis: `faq = živé FAQ z /faq/ doslovne (rozhodnutie Michala 14. 10. 2026): ${r.n} otázok, živé ${r.nZive}` + (r.rozdiely.length ? " — " + r.rozdiely.slice(0, 4).join(" | ") : "") };
}
