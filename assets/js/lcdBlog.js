/* Novy blog — zoznam /blog/ a detail clanku podla navrhu z 3. 10. 2026
   (Desktop/LCD/web/blog-navrh-2026-10, zadanie ZADANIE-pre-automatizaciu-blogu.md).
   Obsah clanku: kontrakt tried cl-* (pise automatizacia blogu). Stare clanky (inline styly
   z generatora v1, Pobo) zjednoti normalizuj(). Banner pri clanku vzdy k teme (div.cl-data alebo odhad z titulku).
   Nahlad: ?blogv2=1 zapne (zapamata sa), ?blogv2=0 vypne. CSS: assets/css/_lcdBlog.scss -> blok LCD-BLOG v luxuryCar.css. */

var ZAPNUTE_PRE_VSETKYCH = true; /* 3. 10. 2026 zapnute pre vsetkych (SK + CZ) */

var CZ = location.hostname.indexOf("luxurycardesign.cz") !== -1;
var IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/";

var T = CZ ? {
  domov: "Domů", eyebrow: "Blog Luxury Car Design",
  h1: 'Čtení pro řidiče, kteří si <em class="zlato-svetle">všímají detailů</em>',
  lede: "Testy modelů, mýty při koupi auta, novinky ze světa elektromobilů a rady, jak udržet interiér jako nový. Stručně a k věci.",
  temNazov: "témat", modelov: "modelů aut", minPriemer: "min. průměrné čtení",
  najnovsi: "Nejnovější článek", citat: "Číst článek", archiv: "Archiv článků", vsetky: "Všechny články",
  vsetko: "Vše", filter: "Filtrovat podle tématu", vsetkyTemy: "Všechna témata",
  prazdne: "V tomto tématu zatím není žádný článek.", min: "min čtení",
  temy: { autokoberce: "Autokoberce a kufr", modely: "Modely aut", elektro: "Elektromobily", kupa: "Koupě a prodej", trendy: "Trendy" },
  konEyebrow: "Pro Vaše auto", konH: "Autokoberce na míru pro více než 1 000 modelů",
  konP: "Vyberte značku, model a barvu — cenu uvidíte ještě před objednávkou.", konBtn: "Otevřít konfigurátor",
  obsah: "Obsah článku", zavriet: "Zavřít", citaj: "Číst", pred: "← Předchozí článek", dalsi: "Další článek →",
  kopiruj: "Kopírovat odkaz", skopirovane: "Odkaz zkopírován",
  suvisE: "Čtěte dál", suvisH: "Související články",
  endH: "Koberce pro Vaše auto",
  endP: "Luxusní autokoberce na míru Vašeho vozidla — podle přesných šablon pro Váš model. Pro osobní auta, kamiony i dodávky.",
  endB1: "Zadejte údaje o vozidle", endB2: "Objednejte si vzorky",
  endTr: ["5,0 na Google · 89 recenzí", "Šablony pro 1 000+ modelů", "Pro osobní auta i kamiony"],
  preModel: "Pro model ", preAuto: "Pro Vaše auto",
  mesiace: ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"],
  clanky: function (n) { return n === 1 ? "článek" : (n > 1 && n < 5 ? "články" : "článků"); },
  faq: /časté dotazy|často kladené|časté otázky|FAQ/i
} : {
  domov: "Domov", eyebrow: "Blog Luxury Car Design",
  h1: 'Čítanie pre vodičov, ktorí si <em class="zlato-svetle">všímajú detaily</em>',
  lede: "Testy modelov, mýty pri kúpe auta, novinky zo sveta elektromobilov a rady, ako udržať interiér ako nový. Stručne a k veci.",
  temNazov: "tém", modelov: "modelov áut", minPriemer: "min. priemerné čítanie",
  najnovsi: "Najnovší článok", citat: "Čítať článok", archiv: "Archív článkov", vsetky: "Všetky články",
  vsetko: "Všetko", filter: "Filtrovať podľa témy", vsetkyTemy: "Všetky témy",
  prazdne: "V tejto téme zatiaľ nie je žiadny článok.", min: "min čítania",
  temy: { autokoberce: "Autokoberce a kufor", modely: "Modely áut", elektro: "Elektromobily", kupa: "Kúpa a predaj", trendy: "Trendy" },
  konEyebrow: "Pre Vaše auto", konH: "Autokoberce na mieru pre viac ako 1 000 modelov",
  konP: "Vyberte značku, model a farbu — cenu uvidíte ešte pred objednávkou.", konBtn: "Otvoriť konfigurátor",
  obsah: "Obsah článku", zavriet: "Zavrieť", citaj: "Čítať", pred: "← Predchádzajúci článok", dalsi: "Ďalší článok →",
  kopiruj: "Kopírovať odkaz", skopirovane: "Odkaz skopírovaný",
  suvisE: "Čítajte ďalej", suvisH: "Súvisiace články",
  endH: "Koberce pre Vaše auto",
  endP: "Luxusné autokoberce na mieru Vášho vozidla — podľa presných šablón pre Váš model. Pre osobné autá, kamióny aj dodávky.",
  endB1: "Zadajte údaje o vozidle", endB2: "Objednajte si vzorky",
  endTr: ["5,0 na Google · 89 recenzií", "Šablóny pre 1 000+ modelov", "Pre osobné autá aj kamióny"],
  preModel: "Pre model ", preAuto: "Pre Vaše auto",
  mesiace: ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"],
  clanky: function (n) { return n === 1 ? "článok" : (n > 1 && n < 5 ? "články" : "článkov"); },
  faq: /často kladené|časté otázky|FAQ/i
};

/* Produkty pre banner a CTA k teme — kluce rovnake ako data-produkt v div.cl-data (zadanie, sekcia 6.1). */
var PRODUKTY = {
  jednovrstvove: { url: "/luxusne-autokoberce-dragonskin-diamond-line/", img: "f04.jpg",
    sk: ["Luxusné autokoberce na mieru", "Šité podľa šablóny pre Váš model. Kryjú 100 % podlahy aj 95 % bokov.", "Otvoriť konfigurátor"],
    cz: ["Luxusní autokoberce na míru", "Šité podle šablony pro Váš model. Kryjí 100 % podlahy i 95 % boků.", "Otevřít konfigurátor"] },
  dvojvrstvove: { url: "/luxusne-autokoberce-dragonskin-elite-diamond-line/", img: "p-dd.jpg",
    sk: ["Dvojvrstvové luxusné autokoberce", "Navrchu odnímateľná vrstva, ktorá zachytí vodu, sneh aj blato.", "Pozrieť dvojvrstvové"],
    cz: ["Dvouvrstvé luxusní autokoberce", "Navrchu odnímatelná vrstva, která zachytí vodu, sníh i bláto.", "Zobrazit dvouvrstvé"] },
  "kufor-premium": { url: "/luxusny-koberced-do-kufra-dragonskin-premium/", img: "k-df.jpg",
    sk: ["Rohož do kufra Premium", "Kryje dno, boky kufra aj chrbty zadných sedadiel.", "Pozrieť rohož Premium"],
    cz: ["Rohož do kufru Premium", "Chrání dno, boky kufru i opěradla zadních sedadel.", "Zobrazit rohož Premium"] },
  "kufor-classic": { url: "/luxusny-koberced-do-kufra-dragonskin-klasik/", img: "k-s.jpg",
    sk: ["Rohož do kufra Classic", "Ochrana dna kufra na mieru Vášho auta.", "Pozrieť rohož Classic"],
    cz: ["Rohož do kufru Classic", "Ochrana dna kufru na míru Vašeho auta.", "Zobrazit rohož Classic"] },
  box: { url: "/luxusny-boxi-do-kufra/", img: "k-box.jpg",
    sk: ["Box do kufra", "Poriadok v kufri pre nákupy aj výbavu auta.", "Pozrieť box"],
    cz: ["Box do kufru", "Pořádek v kufru pro nákupy i výbavu auta.", "Zobrazit box"] },
  vzorky: { url: CZ ? "/vzorkovnik-dragonskin---objednavka-vzorku/" : "/vzorkovnik-dragonskin---objednavka-vzoriek/", img: "flat1.jpg",
    sk: ["Objednajte si vzorky", "Farbu aj štruktúru si pozriete priamo vo svojom aute.", "Objednať vzorky"],
    cz: ["Objednejte si vzorky", "Barvu i strukturu si prohlédnete přímo ve svém autě.", "Objednat vzorky"] }
};
var TEMY = ["autokoberce", "modely", "elektro", "kupa", "trendy"];
var ZNACKY = /(?:^|[^A-Za-zÀ-ž])(Audi|BMW|Mercedes-Benz|Mercedes|Škoda|Skoda|Volvo|BYD|Xiaomi|Tesla|Volkswagen|VW|Toyota|Hyundai|Kia|Porsche|Land Rover|Range Rover|Lexus|Ford|Peugeot|Renault|Dacia|Seat|Cupra|Mazda|Honda|Nissan|Jaguar|Mini|Fiat|Opel|Citroën|Lamborghini|Ferrari|Bentley|Rolls-Royce|Maserati|Jeep|Subaru|Suzuki|Mitsubishi|Genesis|Polestar|Alfa Romeo)\s+((?:Trieda|Třída|Class)\s+[A-Z]\b|[A-Z0-9][A-Za-z0-9-]*(?:\s+(?:Plus|Max|Pro|[A-Z0-9]{1,4}\b))?)/;
var IKO_DATUM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
var IKO_CAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
var IKO_ODKAZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.6 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6"/></svg>';

function zapnute() {
  if (ZAPNUTE_PRE_VSETKYCH) return true;
  var q = null;
  try { q = new URLSearchParams(location.search).get("blogv2"); } catch (e) { /* stary prehliadac */ }
  try {
    if (q === "1") localStorage.setItem("lcdBlogV2", "1");
    if (q === "0") localStorage.removeItem("lcdBlogV2");
    return q === "1" || (q !== "0" && localStorage.getItem("lcdBlogV2") === "1");
  } catch (e) { return q === "1"; }
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
}
function bezDiak(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function slug(s) { return bezDiak(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, ""); }
function cisty(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function prvok(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function rozbal(n) { var p = n.parentNode; if (!p) return; while (n.firstChild) p.insertBefore(n.firstChild, n); p.removeChild(n); }

function model(s) { var m = ZNACKY.exec(s || ""); return m ? cisty(m[1] + " " + m[2]) : ""; }

/* temy podla titulku (+ perexu) — rovnake pravidla pre zoznam aj clanok */
function temyZTextu(titulok, popis) {
  var t = bezDiak(titulok + " " + (popis || "")), r = [];
  if (model(titulok)) r.push("modely");
  if (/elektr|bateri|dojazd|dojezd|nabij|tesla|\bbyd\b|xiaomi|enyaq|hybrid/.test(t)) r.push("elektro");
  if (/koberc|rohoz|kufor|kufr/.test(t)) r.push("autokoberce");
  if (/ojazden|ojet|kupit|kupe |kupa |koupi|koupit|predaj|prodej|bazar|dealer|leasing|inzerat/.test(t)) r.push("kupa");
  if (/trend|dizajn|design|buduc|budouc|volant|novink|autosalon|automobily pre rok|automobily pro rok/.test(t)) r.push("trendy");
  if (!r.length) r.push("autokoberce");
  return r.slice(0, 2);
}
/* produkt k teme, ked clanok nema div.cl-data — len podla titulku */
function produktZTitulku(titulok) {
  var t = bezDiak(titulok);
  if (/kufor|kufr|batozin|zavazadl/.test(t)) return "kufor-premium";
  if (/\bzim|snez|snih|sneh|blat|\bsol\b|dazd|\bdest|\bpes\b|\bpsa\b|\bpsi\b|deti|rodin/.test(t)) return "dvojvrstvove";
  if (/\bbox|poriad|porad/.test(t)) return "box";
  return "jednovrstvove";
}

/* div.cl-data — data-* alebo nahradne triedy p-/t-/m- (ak by Shoptet data-* zahodil) */
function citajData(koren) {
  var d = koren && koren.querySelector(".cl-data");
  if (!d) return null;
  var o = { produkt: d.getAttribute("data-produkt") || "", model: d.getAttribute("data-model") || "",
    temy: (d.getAttribute("data-temy") || "").split(/\s+/).filter(Boolean), min: parseInt(d.getAttribute("data-min"), 10) || 0 };
  [].forEach.call(d.classList, function (c) {
    if (c.indexOf("p-") === 0 && !o.produkt) o.produkt = c.slice(2);
    else if (c.indexOf("t-") === 0) o.temy.push(c.slice(2));
    else if (c.indexOf("m-") === 0 && !o.min) o.min = parseInt(c.slice(2), 10) || 0;
  });
  var dm = d.querySelector(".cl-model");
  if (dm && !o.model) o.model = cisty(dm.textContent);
  o.temy = o.temy.filter(function (x, i, a) { return TEMY.indexOf(x) !== -1 && a.indexOf(x) === i; }).slice(0, 2);
  if (!PRODUKTY[o.produkt]) o.produkt = "";
  return o;
}

function datumDlhy(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? (+m[3]) + ". " + T.mesiace[+m[2] - 1] + " " + m[1] : "";
}
function datumKratky(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? (+m[3]) + ". " + (+m[2]) + ". " + m[1] : "";
}

/* ---------- zoznam clankov (aj pre suvisiace a predchadzajuci/dalsi) ---------- */
function polozky(doc) {
  return [].map.call(doc.querySelectorAll("#newsWrapper .news-item"), function (n) {
    var a = n.querySelector("a.title") || n.querySelector("a"), im = n.querySelector(".image img"),
      tm = n.querySelector("time"), de = n.querySelector(".description");
    var src = im ? (im.getAttribute("data-src") || im.getAttribute("src") || "") : "";
    if (src.indexOf("data:") === 0) src = "";
    var dat = citajData(de), titulok = cisty(a ? a.textContent : ""), popis = de ? cisty(de.textContent) : "";
    var iso = tm ? (tm.getAttribute("datetime") || "").slice(0, 10) : "";
    return { href: a ? a.getAttribute("href") : "#", titulok: titulok, img: src, iso: iso, popis: popis,
      temy: dat && dat.temy.length ? dat.temy : temyZTextu(titulok, popis), min: dat ? dat.min : 0 };
  });
}
function nacitajVsetky(prvaDoc) {
  var kluc = "lcdBlogZoznam:" + location.hostname, pamat = null;
  try { pamat = JSON.parse(sessionStorage.getItem(kluc) || "null"); } catch (e) { /* bez pamate */ }
  if (pamat && Date.now() - pamat.t < 20 * 60 * 1000 && pamat.p && pamat.p.length) return Promise.resolve(pamat.p);
  function stiahni(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }
  var prva = prvaDoc ? Promise.resolve(prvaDoc) : stiahni("/blog/");
  return prva.then(function (doc) {
    var posl = doc.querySelector(".pagination__link--last"), n = posl ? parseInt(posl.textContent, 10) || 1 : 1, dalsie = [];
    for (var i = 2; i <= Math.min(n, 6); i++) dalsie.push(stiahni("/blog/strana-" + i + "/"));
    return Promise.all(dalsie).then(function (docs) {
      var vsetky = polozky(doc);
      docs.forEach(function (d) { vsetky = vsetky.concat(polozky(d)); });
      var videne = {};
      vsetky = vsetky.filter(function (p) { if (videne[p.href]) return false; videne[p.href] = 1; return true; });
      try { sessionStorage.setItem(kluc, JSON.stringify({ t: Date.now(), p: vsetky })); } catch (e) { /* plna pamat */ }
      return vsetky;
    });
  });
}
function karta(p, d) {
  var tema = T.temy[p.temy[0]] || "";
  return '<article class="kc"' + (d ? ' style="--d:' + d + 's"' : "") + ' data-temy="' + esc(p.temy.join(" ")) + '"><a class="kc-a" href="' + esc(p.href) + '">' +
    '<div class="kc-img"><img src="' + esc(p.img || IMG + "hero.jpg") + '" alt="" loading="lazy" decoding="async">' +
    (tema ? '<span class="tema tema-tmava">' + esc(tema) + "</span>" : "") + "</div>" +
    '<div class="kc-t"><div class="kc-meta"><time datetime="' + esc(p.iso) + '">' + datumKratky(p.iso) + "</time>" +
    (p.min ? '<span class="min">' + p.min + "&nbsp;" + T.min + "</span>" : "") + "</div>" +
    "<h3>" + esc(p.titulok) + "</h3>" + (p.popis ? "<p>" + esc(p.popis) + "</p>" : "") +
    '<span class="kc-cit">' + T.citat + ' <i aria-hidden="true">→</i></span></div></a></article>';
}
function zaver() {
  var j = PRODUKTY.jednovrstvove, v = PRODUKTY.vzorky;
  return '<div class="end"><div class="endbg"><img src="' + IMG + 'hero.jpg" alt="" loading="lazy"></div>' +
    '<div class="eyebrow">Luxury Car Design</div><h2>' + T.endH + '</h2><p class="lede">' + T.endP + "</p>" +
    '<div class="end-cta"><a class="btn" href="' + j.url + '">' + T.endB1 + '</a><a class="btn ghost" href="' + v.url + '">' + T.endB2 + "</a></div>" +
    '<div class="end-tr">' + T.endTr.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div></div>";
}
function produktTexty(kluc) { var p = PRODUKTY[kluc] || PRODUKTY.jednovrstvove; return { url: p.url, img: IMG + p.img, t: CZ ? p.cz : p.sk }; }

/* odhalenie pri rolovani + naklon karty za mysou */
function ozivy(koren) {
  var prvky = koren.querySelectorAll(".kc,.rv");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ((koren.closest && koren.closest("#lcd-blog")) || koren).classList.add("lb-anim");
  var io = new IntersectionObserver(function (zaz) {
    zaz.forEach(function (z) { if (z.isIntersecting) { z.target.classList.add("on"); io.unobserve(z.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  [].forEach.call(prvky, function (e) { io.observe(e); });
  setTimeout(function () { [].forEach.call(koren.querySelectorAll(".kc,.rv"), function (e) { e.classList.add("on"); }); }, 4000);
  if (!matchMedia("(pointer:fine)").matches) return;
  koren.addEventListener("mousemove", function (ev) {
    var a = ev.target.closest && ev.target.closest(".kc-a");
    if (!a) return;
    var r = a.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    a.parentNode.classList.add("hybe");
    a.style.setProperty("--ry", ((x - 0.5) * 6).toFixed(2) + "deg");
    a.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
    a.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    a.style.setProperty("--my", (y * 100).toFixed(1) + "%");
  });
  koren.addEventListener("mouseout", function (ev) {
    var a = ev.target.closest && ev.target.closest(".kc-a");
    if (!a || (ev.relatedTarget && a.contains(ev.relatedTarget))) return;
    a.parentNode.classList.remove("hybe");
    a.style.removeProperty("--rx"); a.style.removeProperty("--ry");
  });
}

function zoznam() {
  var wrap = document.getElementById("content-wrapper");
  if (!wrap || !document.getElementById("newsWrapper")) return;
  var h1 = document.querySelector("#content h1");
  var naPrvej = /^\/blog\/?$/.test(location.pathname);
  nacitajVsetky(naPrvej ? document : null).then(function (vsetky) {
    if (!vsetky.length) return;
    var koren = prvok("div", "lb-zoznam");
    koren.id = "lcd-blog";
    var pocty = {}, minSpolu = 0, minPocet = 0;
    vsetky.forEach(function (p) {
      p.temy.forEach(function (t) { pocty[t] = (pocty[t] || 0) + 1; });
      if (p.min) { minSpolu += p.min; minPocet++; }
    });
    var temy = TEMY.filter(function (t) { return pocty[t]; });
    var tretie = minPocet ? "<div><b>" + Math.round(minSpolu / minPocet) + "</b><span>" + T.minPriemer + "</span></div>"
      : "<div><b>1&nbsp;000+</b><span>" + T.modelov + "</span></div>";
    var hl = vsetky[0];
    koren.innerHTML =
      '<div class="bl-hero"><div class="in"><div><nav class="drob" aria-label="Omrvinky"><a href="/">' + T.domov +
      '</a><i class="od" aria-hidden="true"></i><span aria-current="page">Blog</span></nav><div class="eyebrow">' + T.eyebrow +
      '</div><div class="lb-h1"></div><p class="lede">' + T.lede + "</p></div>" +
      '<div class="bl-cisla"><div><b>' + vsetky.length + "</b><span>" + T.clanky(vsetky.length) + "</span></div><div><b>" + temy.length +
      "</b><span>" + T.temNazov + "</span></div>" + tretie + "</div></div></div>" +
      '<div class="bl-feat" aria-label="' + T.najnovsi + '"><a class="bf rv" href="' + esc(hl.href) + '"><div class="bf-img"><img src="' +
      esc(hl.img || IMG + "hero.jpg") + '" alt="" fetchpriority="high" decoding="async"></div><div class="bf-t"><div class="bf-stitky"><span class="tema tema-zlata">' +
      T.najnovsi + '</span><span class="tema tema-obrys">' + esc(T.temy[hl.temy[0]] || "") + "</span></div><h2>" + esc(hl.titulok) + "</h2>" +
      (hl.popis ? "<p>" + esc(hl.popis) + "</p>" : "") + '<div class="bf-meta"><span>' + IKO_DATUM + datumDlhy(hl.iso) + "</span>" +
      (hl.min ? "<span>" + IKO_CAS + hl.min + "&nbsp;" + T.min + "</span>" : "") + '</div><span class="btn">' + T.citat +
      ' <i aria-hidden="true">→</i></span></div></a></div>' +
      '<div class="bl-list" id="clanky"><div class="wrap"><div class="bl-hlava"><div><span class="eyebrow">' + T.archiv +
      '</span><h2 class="zlato">' + T.vsetky + '</h2></div><div class="cipy" role="group" aria-label="' + T.filter + '">' +
      '<button type="button" class="cip" data-tema="vsetko" aria-pressed="true"><span class="n">' + T.vsetko + "</span><small>" + vsetky.length + "</small></button>" +
      temy.map(function (t) {
        return '<button type="button" class="cip" data-tema="' + t + '" aria-pressed="false"><span class="n">' + T.temy[t] + "</span><small>" + pocty[t] + "</small></button>";
      }).join("") + '</div></div><p class="bl-stav" aria-live="polite"></p><div class="mriezka"></div><p class="bl-prazdne" hidden>' +
      T.prazdne + "</p></div></div>" + zaver();
    var mriezka = koren.querySelector(".mriezka"), html = "";
    vsetky.forEach(function (p, i) {
      html += karta(p, (i % 3) * 0.08);
      if (i === 6) {
        var j = produktTexty("jednovrstvove");
        html += '<article class="kc kc-kon" data-temy="' + TEMY.join(" ") + '"><a class="kc-a" href="' + j.url + '"><div class="kc-img"><img src="' + j.img +
          '" alt="" loading="lazy" decoding="async"></div><div class="kc-t"><span class="eyebrow">' + T.konEyebrow + "</span><h3>" + T.konH +
          "</h3><p>" + T.konP + '</p><span class="btn">' + T.konBtn + "</span></div></a></article>";
      }
    });
    mriezka.innerHTML = html;
    if (h1) { h1.removeAttribute("class"); h1.innerHTML = T.h1; koren.querySelector(".lb-h1").replaceWith(h1); }
    else koren.querySelector(".lb-h1").outerHTML = "<h1>" + T.h1 + "</h1>";
    wrap.parentNode.insertBefore(koren, wrap);
    filter(koren);
    ozivy(koren);
    document.documentElement.classList.add("lcd-blog-v2");
  }).catch(function (e) { console.warn("lcdBlog zoznam", e); });
}
function filter(koren) {
  var cipy = koren.querySelectorAll(".cip"), mriezka = koren.querySelector(".mriezka"), stav = koren.querySelector(".bl-stav"),
    prazdne = koren.querySelector(".bl-prazdne");
  function nastav(tema, posun) {
    var n = 0;
    [].forEach.call(cipy, function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-tema") === tema ? "true" : "false"); });
    mriezka.classList.add("mizne");
    setTimeout(function () {
      [].forEach.call(mriezka.querySelectorAll(".kc"), function (k) {
        var ok = tema === "vsetko" || (" " + k.getAttribute("data-temy") + " ").indexOf(" " + tema + " ") !== -1;
        if (k.classList.contains("kc-kon")) ok = tema === "vsetko";
        k.hidden = !ok;
        if (ok && !k.classList.contains("kc-kon")) n++;
        if (posun) k.classList.add("on");
      });
      prazdne.hidden = n > 0;
      stav.textContent = (tema === "vsetko" ? T.vsetkyTemy : T.temy[tema]) + " · " + n + " " + T.clanky(n);
      mriezka.classList.remove("mizne");
    }, posun ? 200 : 0);
    try { history.replaceState(null, "", tema === "vsetko" ? location.pathname + location.search : "#tema-" + tema); } catch (e) { /* bez historie */ }
  }
  [].forEach.call(cipy, function (c) { c.addEventListener("click", function () { nastav(c.getAttribute("data-tema"), true); }); });
  var m = /^#tema-([a-z]+)$/.exec(location.hash);
  nastav(m && T.temy[m[1]] ? m[1] : "vsetko", false);
  if (m) setTimeout(function () { var c = koren.querySelector("#clanky"); if (c) c.scrollIntoView(); }, 60);
}

/* ---------- normalizacia starych clankov (generator v1 s inline stylmi, Pobo) ---------- */
function normalizuj(text) {
  [].forEach.call(text.querySelectorAll("img[data-src]"), function (im) {
    var s = im.getAttribute("src") || "";
    if (!s || s.indexOf("data:") === 0) im.setAttribute("src", im.getAttribute("data-src"));
    im.classList.remove("lazyLoad");
    im.setAttribute("loading", "lazy");
  });
  [].forEach.call(text.querySelectorAll("[id='isPasted']"), function (n) { n.removeAttribute("id"); });
  /* v1: nadpis v obale s prerusovanou ciarou */
  [].forEach.call(text.querySelectorAll("h2"), function (h) {
    var w = h.parentNode;
    if (w !== text && w.tagName === "DIV" && w.getAttribute("style") && w.children.length <= 2) {
      [].forEach.call(w.querySelectorAll("div"), function (d) { if (!cisty(d.textContent)) d.remove(); });
      w.parentNode.insertBefore(h, w);
      if (!cisty(w.textContent)) w.remove();
    }
  });
  /* vlastny "Obsah clanku" v starych clankoch — obsah kresli web, tento by bol dvakrat */
  [].forEach.call(text.querySelectorAll("h2"), function (h) {
    if (!/^obsah(\s+článku)?:?$/i.test(cisty(h.textContent))) return;
    var zoz = h.nextElementSibling;
    if (zoz && /^(UL|OL)$/.test(zoz.tagName)) zoz.remove();
    h.remove();
  });
  [].forEach.call(text.querySelectorAll("div[style]"), function (d) {
    var st = (d.getAttribute("style") || "").replace(/\s/g, "").toLowerCase(), tx = cisty(d.textContent);
    if (st.indexOf("display:flex") !== -1 && /^◆?$/.test(tx)) d.remove();               /* oddelovac */
    else if (/^height:\d+px;?$/.test(st) && !tx) d.remove();                              /* medzera */
    else if (st.indexOf("overflow-x") !== -1 && d.querySelector("table")) d.className = "cl-tab";
    else if (st.indexOf("56.25%") !== -1 && d.querySelector("iframe")) d.className = "cl-video";
  });
  [].forEach.call(text.querySelectorAll("span"), function (s) {
    var st = (s.getAttribute("style") || "").replace(/\s/g, "").toLowerCase();
    if (cisty(s.textContent) === "◆") s.remove();
    else if (st.indexOf("float:left") !== -1 && s.parentNode.tagName === "P") rozbal(s);  /* inicialka */
  });
  [].forEach.call(text.querySelectorAll("ul[style]"), function (u) { u.classList.add("cl-kos"); });
  [].forEach.call(text.querySelectorAll("a[style]"), function (a) {
    var st = (a.getAttribute("style") || "").toLowerCase();
    if (st.indexOf("1fa64a") !== -1 || (st.indexOf("background") !== -1 && st.indexOf("padding") !== -1)) {
      a.className = "btn";
      if (a.parentNode.tagName === "P") a.parentNode.classList.add("cl-tlacidlo");
    }
  });
  [].forEach.call(text.querySelectorAll("p[style]"), function (p) {
    var st = (p.getAttribute("style") || "").replace(/\s/g, "").toLowerCase();
    if (st.indexOf("border-top") !== -1 && st.indexOf("dashed") !== -1) p.classList.add("cl-ps");
  });
  [].forEach.call(text.querySelectorAll("blockquote"), function (b) {
    if (b.classList.contains("cl-recenzia")) return;
    var hv = null;
    [].forEach.call(b.children, function (c) { if (!hv && c.tagName === "DIV" && /★/.test(c.textContent)) hv = c; });
    if (!hv) return;
    b.className = "cl-recenzia";
    hv.className = "hv";
    hv.innerHTML = '<i aria-hidden="true">★★★★★</i>';
    var ci = b.querySelector("cite");
    if (ci && !ci.closest("footer")) {
      var casti = cisty(ci.textContent).split(/\s*[·•|]\s*/), f = prvok("footer");
      f.innerHTML = "<cite><b>" + esc(casti[0] || "") + "</b>" + (casti[1] ? "<span>" + esc(casti.slice(1).join(" · ")) + "</span>" : "") + "</cite>";
      ci.replaceWith(f);
    }
  });
  [].forEach.call(text.querySelectorAll("figure"), function (f) { f.classList.add("cl-fig"); });
  [].forEach.call(text.querySelectorAll("[style]"), function (n) { n.removeAttribute("style"); });
  [].forEach.call(text.querySelectorAll("font"), rozbal);
}
/* FAQ: v1 = <p><b>Otazka?</b><br>odpoved</p>, nahradny tvar kontraktu = div.cl-otazka > h3 + div.odp */
function faq(text) {
  [].forEach.call(text.querySelectorAll(".cl-otazka"), function (o) {
    var h = o.querySelector("h3,h4,b,strong"), d = prvok("details"), odp = o.querySelector(".odp") || prvok("div", "odp");
    d.innerHTML = "<summary>" + esc(h ? cisty(h.textContent) : "") + '<i aria-hidden="true"></i></summary>';
    if (h) h.remove();
    if (!odp.parentNode) { while (o.firstChild) odp.appendChild(o.firstChild); }
    d.appendChild(odp);
    o.replaceWith(d);
  });
  [].forEach.call(text.querySelectorAll(".cl-faq summary"), function (s) {
    if (!s.querySelector("i")) s.insertAdjacentHTML("beforeend", '<i aria-hidden="true"></i>');
  });
  if (text.querySelector(".cl-faq")) return;
  var h = [].filter.call(text.querySelectorAll("h2"), function (x) { return T.faq.test(x.textContent); })[0];
  if (!h) return;
  var sek = prvok("section", "cl-faq"), n = h.nextElementSibling, pocet = 0;
  h.parentNode.insertBefore(sek, h);
  sek.appendChild(h);
  while (n) {
    var dalsi = n.nextElementSibling, prvy = n.firstChild;
    while (prvy && prvy.nodeType === 3 && !prvy.textContent.trim()) prvy = prvy.nextSibling;
    if (n.tagName === "P" && prvy && prvy.nodeType === 1 && /^(B|STRONG)$/.test(prvy.tagName) && /\?\s*$/.test(prvy.textContent)) {
      var d = prvok("details"), odp = prvok("div", "odp");
      d.innerHTML = "<summary>" + esc(cisty(prvy.textContent)) + '<i aria-hidden="true"></i></summary>';
      prvy.remove();
      while (n.firstChild && (n.firstChild.nodeName === "BR" || (n.firstChild.nodeType === 3 && !n.firstChild.textContent.trim()))) n.removeChild(n.firstChild);
      odp.appendChild(n);
      d.appendChild(odp);
      sek.appendChild(d);
      pocet++;
    } else if (/^H[234]$/.test(n.tagName) && /\?\s*$/.test(n.textContent)) {
      /* otazka ako nadpis (aj stare clanky s otazkami v H2) — odpoved su prvky do dalsieho nadpisu */
      var d2 = prvok("details"), odp2 = prvok("div", "odp"), m = n.nextElementSibling;
      d2.innerHTML = "<summary>" + esc(cisty(n.textContent)) + '<i aria-hidden="true"></i></summary>';
      while (m && !/^(H2|H3|H4)$/.test(m.tagName) && !m.classList.contains("cl-zaver")) { var mm = m.nextElementSibling; odp2.appendChild(m); m = mm; }
      n.remove();
      d2.appendChild(odp2);
      sek.appendChild(d2);
      pocet++;
      dalsi = m;
    } else break;
    n = dalsi;
  }
  if (!pocet) { sek.parentNode.insertBefore(h, sek); sek.remove(); return; }
  var prva = sek.querySelector("details");
  if (prva) prva.open = true;
}

function clanok() {
  var wrap = document.getElementById("content-wrapper"), det = document.querySelector("#content .news-item-detail");
  var text = det && det.querySelector(".text"), h1 = det && det.querySelector("h1");
  if (!wrap || !text || !h1) return;
  var titulok = cisty(h1.textContent);
  var md = document.querySelector('meta[name="description"]');
  var perex = cisty(md ? md.getAttribute("content") : "").replace(/(\.\.\.|…)$/, "");
  /* Shoptet perex skracuje uprostred vety — nechaj len cele vety */
  if (perex && !/[.!?]$/.test(perex)) perex = perex.slice(0, Math.max(perex.lastIndexOf(". "), perex.lastIndexOf("? "), perex.lastIndexOf("! ")) + 1);
  if (perex.length < 40) perex = "";
  var dat = citajData(text) || { produkt: "", model: "", temy: [], min: 0 };
  normalizuj(text);
  faq(text);
  var temy = dat.temy.length ? dat.temy : temyZTextu(titulok, perex);
  var produkt = dat.produkt || produktZTitulku(titulok);
  var mdl = dat.model || model(titulok);
  var slov = cisty(text.textContent).split(" ").length;
  var minut = dat.min || Math.max(1, Math.round(slov / 200));
  var imgMeta = det.querySelector('[itemprop="image"] meta[itemprop="url"]');
  var prvyObr = text.querySelector("img");
  var hero = imgMeta ? imgMeta.getAttribute("content") : (prvyObr ? prvyObr.getAttribute("src") : IMG + "hero.jpg");
  var dp = det.querySelector('meta[itemprop="datePublished"]');
  var iso = dp ? dp.getAttribute("content") : "";
  var pt = produktTexty(produkt), eyebrow = mdl ? T.preModel + mdl : T.preAuto;

  /* uvodny odstavec */
  if (!text.querySelector(".cl-uvod,.uvod")) {
    var p1 = [].filter.call(text.querySelectorAll("p"), function (p) { return cisty(p.textContent).length > 60; })[0];
    if (p1 && !p1.closest(".cl-faq,blockquote,.cl-vytah,.cl-cta,[class*='rc-image-']")) p1.classList.add("cl-uvod");
  }
  /* kapitoly: cisla + kotvy + obsah */
  var obsah = [], i = 0, idcka = {};
  [].forEach.call(text.querySelectorAll("h2"), function (h) {
    var jeFaq = !!h.closest(".cl-faq") || T.faq.test(h.textContent), no = jeFaq ? "?" : (++i < 10 ? "0" + i : String(i));
    /* stare clanky maju cislo v nadpise ("1. Vodicsky koberec") — cislo doplni web */
    var prvyText = h.firstChild;
    while (prvyText && prvyText.nodeType !== 3) prvyText = prvyText.firstChild;
    if (prvyText && /^\s*\d{1,2}[.)]\s+/.test(prvyText.textContent)) prvyText.textContent = prvyText.textContent.replace(/^\s*\d{1,2}[.)]\s+/, "");
    var txt = cisty(h.textContent);
    if (!txt) return;
    var id = h.id || slug(txt) || "kapitola-" + i;
    while (idcka[id] || (document.getElementById(id) && document.getElementById(id) !== h)) id += "-2";
    idcka[id] = 1;
    h.id = id;
    if (!h.querySelector(".no")) h.innerHTML = '<span class="no zlato" aria-hidden="true">' + no + "</span><span>" + h.innerHTML + "</span>";
    obsah.push({ id: id, no: no, txt: txt });
  });
  var tocLi = obsah.map(function (o) { return '<li><a href="#' + o.id + '"><span>' + o.no + "</span><em>" + esc(o.txt) + "</em></a></li>"; }).join("");
  if (obsah.length > 1) {
    var tm = prvok("details", "toc-m", "<summary>" + T.obsah + '<i aria-hidden="true"></i></summary><ol>' + tocLi + "</ol>");
    text.insertBefore(tm, text.firstChild);
  }
  /* CTA karta k teme v texte, ked ju clanok nema */
  if (!text.querySelector(".cl-cta")) {
    var cta = prvok("a", "cl-cta");
    cta.href = pt.url;
    cta.innerHTML = '<span class="cl-cta-t"><span class="eyebrow">' + esc(eyebrow) + "</span><b>" + pt.t[0] + "</b><small>" + pt.t[1] +
      '</small><span class="btn">' + pt.t[2] + ' <i aria-hidden="true">→</i></span></span><span class="cl-cta-img"><img src="' + pt.img +
      '" alt="" loading="lazy" decoding="async"></span>';
    var kap = [].filter.call(text.querySelectorAll("h2"), function (h) { return !h.closest(".cl-faq") && h.parentNode === text; });
    var kam = kap.length >= 3 ? kap[2] : (text.querySelector(".cl-faq") || null);
    if (kam && kam.parentNode === text) text.insertBefore(cta, kam); else text.appendChild(cta);
  }
  text.classList.add("cl-text");

  /* hero */
  var stitky = temy.map(function (t, k) {
    return '<a class="tema ' + (k ? "tema-obrys" : "tema-zlata") + '" href="/blog/#tema-' + t + '">' + T.temy[t] + "</a>";
  }).join("");
  var heroEl = prvok("header", "cl-hero",
    '<div class="cl-hero-bg"><img src="' + esc(hero) + '" alt="" fetchpriority="high" decoding="async"></div><div class="in"><div class="cl-hero-t">' +
    '<nav class="drob" aria-label="Omrvinky"><a href="/">' + T.domov + '</a><i class="od" aria-hidden="true"></i><a href="/blog/">Blog</a></nav>' +
    '<div class="cl-stitky">' + stitky + '</div><div class="lb-h1"></div>' + (perex ? '<p class="cl-perex">' + esc(perex) + "</p>" : "") +
    '<div class="cl-meta"><span class="cl-autor"><img src="' + IMG + 'logo.png" alt="" width="42" height="42">Luxury Car Design</span>' +
    (iso ? '<span class="m">' + IKO_DATUM + '<time datetime="' + esc(iso.slice(0, 10)) + '">' + datumDlhy(iso) + "</time></span>" : "") +
    '<span class="m">' + IKO_CAS + minut + "&nbsp;" + T.min + "</span></div></div></div>" +
    '<div class="cl-dole" aria-hidden="true">' + T.citaj + "<i></i></div>");
  heroEl.querySelector(".lb-h1").replaceWith(h1);

  /* telo + bocny panel */
  var telo = prvok("div", "cl-telo"), hlavny = prvok("div", "cl-hlavny"), bok = prvok("aside", "cl-bok");
  bok.setAttribute("aria-label", T.obsah);
  bok.innerHTML = (obsah.length > 1 ? '<nav class="toc"><div class="toc-hlava"><span class="eyebrow">' + T.obsah +
    '</span><span class="toc-perc" aria-hidden="true">0&nbsp;%</span></div><div class="toc-linka" aria-hidden="true"><i></i></div><ol>' + tocLi + "</ol></nav>" : "") +
    '<a class="bok-cta" href="' + pt.url + '"><span class="img"><img src="' + pt.img + '" alt="" loading="lazy" decoding="async"></span><span class="t"><span class="eyebrow">' +
    esc(eyebrow) + "</span><b>" + pt.t[0] + '</b><span class="pop">' + pt.t[1] + '</span><span class="btn">' + pt.t[2] + "</span></span></a>";
  var pata = prvok("div", "cl-pata", '<div class="cl-tagy">' + temy.map(function (t) { return '<a href="/blog/#tema-' + t + '">' + T.temy[t] + "</a>"; }).join("") +
    '</div><button type="button" class="cl-zdiel">' + IKO_ODKAZ + "<span>" + T.kopiruj + "</span></button>");
  var np = det.querySelector(".next-prev"), predA = np && np.querySelector('[data-testid="buttonPreviousArticle"]'),
    dalA = np && np.querySelector('[data-testid="buttonNextArticle"]');
  var dalsie = prvok("nav", "cl-dalsie");
  dalsie.setAttribute("aria-label", T.pred + " / " + T.dalsi);
  if (predA) dalsie.insertAdjacentHTML("beforeend", '<a href="' + esc(predA.getAttribute("href")) + '" data-k="p"><small>' + T.pred + "</small><b></b></a>");
  if (dalA) dalsie.insertAdjacentHTML("beforeend", '<a class="vpravo" href="' + esc(dalA.getAttribute("href")) + '" data-k="d"><small>' + T.dalsi + "</small><b></b></a>");
  det.insertBefore(heroEl, text);
  det.insertBefore(telo, text);
  telo.appendChild(hlavny);
  telo.appendChild(bok);
  hlavny.appendChild(text);
  hlavny.appendChild(pata);
  if (dalsie.children.length) hlavny.appendChild(dalsie);

  var koren = prvok("div", "lb-clanok");
  koren.id = "lcd-blog";
  koren.appendChild(det);
  koren.insertAdjacentHTML("beforeend", '<div class="cl-suvis" hidden><div class="wrap"><div class="hl"><div><span class="eyebrow">' + T.suvisE +
    '</span><h2 class="zlato">' + T.suvisH + '</h2></div><a href="/blog/">' + T.vsetky + ' <span aria-hidden="true">→</span></a></div><div class="mriezka"></div></div></div>' +
    zaver() + '<div class="postup" aria-hidden="true"><i></i></div>');
  wrap.parentNode.insertBefore(koren, wrap);
  document.documentElement.classList.add("lcd-blog-v2");

  /* kopirovat odkaz */
  var zd = pata.querySelector(".cl-zdiel");
  zd.addEventListener("click", function () {
    var hotovo = function () { zd.querySelector("span").textContent = T.skopirovane; setTimeout(function () { zd.querySelector("span").textContent = T.kopiruj; }, 2200); };
    try { navigator.clipboard.writeText(location.href.split("#")[0]).then(hotovo, hotovo); } catch (e) { hotovo(); }
  });

  /* obsah na telefone pri citani: tlacidlo vlavo dole + zoznam kapitol zdola */
  var pil = null, plach = null, tocM = text.querySelector(".toc-m");
  if (obsah.length > 1) {
    pil = prvok("button", "toc-pil", '<span class="toc-pil-ik" aria-hidden="true"><i></i><i></i><i></i></span><span class="toc-pil-t">' +
      '<b class="toc-pil-no"></b><em class="toc-pil-n">' + T.obsah + '</em></span><span class="toc-pil-p" aria-hidden="true"><i></i></span>');
    pil.type = "button";
    pil.setAttribute("aria-label", T.obsah);
    pil.setAttribute("aria-haspopup", "dialog");
    plach = prvok("div", "toc-plach", '<div class="toc-plach-bg"></div><div class="toc-plach-in" tabindex="-1" role="dialog" aria-modal="true" aria-label="' + T.obsah +
      '"><nav class="toc"><div class="toc-hlava"><span class="eyebrow">' + T.obsah + '</span><span class="toc-perc" aria-hidden="true">0&nbsp;%</span>' +
      '<button type="button" class="toc-zavri" aria-label="' + T.zavriet + '">×</button></div><div class="toc-linka" aria-hidden="true"><i></i></div><ol>' + tocLi + "</ol></nav></div>");
    plach.hidden = true;
    koren.appendChild(pil);
    koren.appendChild(plach);
    var zavri = function () {
      plach.classList.remove("open");
      setTimeout(function () { plach.hidden = true; }, 320);
      pil.focus({ preventScroll: true });
    };
    pil.addEventListener("click", function () {
      plach.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { plach.classList.add("open"); }); });
      plach.querySelector(".toc-plach-in").focus({ preventScroll: true });
    });
    plach.querySelector(".toc-plach-bg").addEventListener("click", zavri);
    plach.querySelector(".toc-zavri").addEventListener("click", zavri);
    plach.addEventListener("keydown", function (e) { if (e.key === "Escape") zavri(); });
    [].forEach.call(plach.querySelectorAll("a"), function (a) { a.addEventListener("click", zavri); });
    if (tocM) [].forEach.call(tocM.querySelectorAll("a"), function (a) { a.addEventListener("click", function () { tocM.open = false; }); });
  }

  /* postup citania, aktivna kapitola, parallax hero */
  var linka = koren.querySelector(".postup i"), linky = koren.querySelectorAll(".toc-linka i,.toc-pil-p i"), percy = koren.querySelectorAll(".toc-perc"),
    zoznamy = [bok.querySelectorAll(".toc a"), plach ? plach.querySelectorAll(".toc a") : []], heroImg = heroEl.querySelector(".cl-hero-bg img"),
    pohyb = !matchMedia("(prefers-reduced-motion: reduce)").matches, cakam = false, kapitol = obsah.filter(function (o) { return o.no !== "?"; }).length;
  function prepocitaj() {
    cakam = false;
    var r = text.getBoundingClientRect(), vh = innerHeight, p = Math.min(1, Math.max(0, (vh * 0.35 - r.top) / Math.max(1, r.height - vh * 0.35)));
    var sx = "scaleX(" + p.toFixed(4) + ")";
    linka.style.transform = sx;
    [].forEach.call(linky, function (i) { i.style.transform = sx; });
    [].forEach.call(percy, function (e) { e.innerHTML = Math.round(p * 100) + "&nbsp;%"; });
    var akt = -1;
    obsah.forEach(function (o, k) { var e = document.getElementById(o.id); if (e && e.getBoundingClientRect().top < 150) akt = k; });
    zoznamy.forEach(function (z) { [].forEach.call(z, function (a, k) { a.classList.toggle("on", k === akt); }); });
    if (pil) {
      var o = obsah[Math.max(0, akt)];
      pil.querySelector(".toc-pil-no").textContent = o.no === "?" ? "?" : o.no + "/" + (kapitol < 10 ? "0" + kapitol : kapitol);
      pil.querySelector(".toc-pil-n").textContent = akt < 0 ? T.obsah : o.txt;
      /* ukaz az za rozbalovacim obsahom na zaciatku a skry na konci clanku */
      var zaObsahom = tocM ? tocM.getBoundingClientRect().bottom < 0 : r.top < 0;
      pil.classList.toggle("ukaz", zaObsahom && pata.getBoundingClientRect().top > vh * 0.75);
    }
    if (pohyb && heroImg) { var hr = heroEl.getBoundingClientRect(); if (hr.bottom > 0) heroImg.style.setProperty("--py", (-hr.top * 0.25).toFixed(1) + "px"); }
  }
  addEventListener("scroll", function () { if (!cakam) { cakam = true; requestAnimationFrame(prepocitaj); } }, { passive: true });
  addEventListener("resize", prepocitaj);
  prepocitaj();

  /* suvisiace clanky + nazvy predchadzajuceho/dalsieho */
  nacitajVsetky(null).then(function (vsetky) {
    var cesta = location.pathname, mapa = {};
    vsetky.forEach(function (p) { mapa[p.href] = p.titulok; });
    [].forEach.call(dalsie.querySelectorAll("a"), function (a) { a.querySelector("b").textContent = mapa[a.getAttribute("href")] || ""; });
    var ine = vsetky.filter(function (p) { return p.href !== cesta; }).map(function (p, k) {
      var spol = p.temy.filter(function (t) { return temy.indexOf(t) !== -1; }).length;
      return { p: p, s: spol * 100 - k };
    }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
    if (!ine.length) return;
    var su = koren.querySelector(".cl-suvis");
    su.querySelector(".mriezka").innerHTML = ine.map(function (x, k) { return karta(x.p, k * 0.08); }).join("");
    su.hidden = false;
    ozivy(su);
  }).catch(function (e) { console.warn("lcdBlog suvisiace", e); });
}

function lcdBlogBoot() {
  var b = document.body;
  if (!b || !b.classList.contains("in-blog") || document.getElementById("lcd-blog")) return;
  if (location.hostname.indexOf("luxurycardesign.") === -1 && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") return;
  if (!zapnute()) return;
  try {
    if (b.classList.contains("type-posts-listing")) zoznam();
    else if (b.classList.contains("type-post")) clanok();
  } catch (e) {
    console.warn("lcdBlog", e);
    document.documentElement.classList.remove("lcd-blog-v2");
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lcdBlogBoot);
else lcdBlogBoot();
