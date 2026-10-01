/* Tri moduly z konceptu redizajnu na úvodnej stránke (od 1. 10. 2026), postavené ako
   sticky scény 08 a 09 (Materiál): číslovaná hlavička, štítky, legenda, spodná lišta
   s postupom a tlačidlom, jemný vzor kosoštvorcov v pozadí.
   PRED A PO — tmavá scéna za porovnaním s konkurenciou; čiara pri scrollovaní prejde
               z holej podlahy na koberce a v legende sa rozsvietia body,
   FARBY     — svetlá sekcia pred vzorkovníkom: oficiálne vzorky z konfigurátora
               a k nim fotky zo skutočných áut,
   GALÉRIA   — tmavý pás fotiek pred kontaktným formulárom; na PC ho posúva scroll.
   Tmavé moduly stoja medzi svetlými, aby nešla tmavá sekcia do tmavej.
   Rovnaký kód používa aj návrh produktovej stránky, preto adresy obrázkov idú cez `obr`.
   Štýly: blok „HP: PRED A PO + FARBY + GALÉRIA" v _lcdHome.scss / luxuryCar.css. */

const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/";

const TEXTY = {
  sk: {
    cta: "Zvoliť model vozidla", vzorky: "Objednať vzorky", zavriet: "Zavrieť",
    pp: {
      rule: "Pred a po", h: "Pred a <b>po</b>",
      p: "Rolujte a sledujte, ako koberce zakryjú podlahu. Rovnaké auto, rovnaké svetlo, jediný rozdiel sú koberce.",
      pocet: "podlahy pod ochranou", po: "Po", pred: "Pred", kurzor: "Rolujte",
      altPred: "Interiér auta bez autokobercov", altPo: "Ten istý interiér s luxusnými autokobercami",
      chips: ["Rovnaké auto", "Rovnaké svetlo", "Rovnaký uhol", "Jediný rozdiel: koberce"],
      body: [
        ["Celá podlaha", "Pokrýva 100 % podlahy", "Podlaha"],
        ["Aj boky", "Boky kryté z 95 %", "Boky"],
        ["Šité na mieru", "Podľa šablóny pre Váš model", "Strih"],
        ["Čistenie za minútu", "Vyberiete a utriete vlhkou handrou", "Údržba"],
      ],
      hint: "Rolujte", hint2: " — podlaha sa zakryje",
    },
    f: {
      rule: "Farby", h: "Ku ktorej farbe patrí Vaše auto?",
      p: "Vyberte vzorku a pozrite si farbu na skutočných kobercoch v aute.",
      chips: ["Farba kože", "Farba šitia", "Fotky zo skutočných áut", "Vzorky aj poštou"],
      skupina: "Farebné vzorky", vzorka: "Vzorka", kurzor: "Farba",
      viac: "Mnoho ďalších farieb kože aj šitia", viacOdkaz: "Pozrite si ich v Elite Diamond Line",
    },
    g: {
      rule: "Realizácie", h: "Z áut našich zákazníkov",
      p: "Osobné autá, SUV, kufre aj kamióny. Každý set na šablóne pre konkrétny model.",
      chips: ["Osobné autá", "SUV", "Kufre", "Boxy do kufra", "Kamióny"],
      fotka: "fotka", kurzor: "Pozrieť", hint: "Rolujte", hint2: " — fotky sa posúvajú",
    },
  },
  cs: {
    cta: "Zvolit model vozidla", vzorky: "Objednat vzorky", zavriet: "Zavřít",
    pp: {
      rule: "Před a po", h: "Před a <b>po</b>",
      p: "Posouvejte a sledujte, jak koberce zakryjí podlahu. Stejné auto, stejné světlo, jediný rozdíl jsou koberce.",
      pocet: "podlahy pod ochranou", po: "Po", pred: "Před", kurzor: "Posouvejte",
      altPred: "Interiér auta bez autokoberců", altPo: "Tentýž interiér s luxusními autokoberci",
      chips: ["Stejné auto", "Stejné světlo", "Stejný úhel", "Jediný rozdíl: koberce"],
      body: [
        ["Celá podlaha", "Pokrývá 100 % podlahy", "Podlaha"],
        ["I boky", "Boky kryté z 95 %", "Boky"],
        ["Šité na míru", "Podle šablony pro Váš model", "Střih"],
        ["Čištění za minutu", "Vyjmete a otřete vlhkým hadříkem", "Údržba"],
      ],
      hint: "Posouvejte", hint2: " — podlaha se zakryje",
    },
    f: {
      rule: "Barvy", h: "Ke které barvě patří Vaše auto?",
      p: "Vyberte vzorek a podívejte se na barvu na skutečných kobercích v autě.",
      chips: ["Barva kůže", "Barva prošití", "Fotky ze skutečných aut", "Vzorky i poštou"],
      skupina: "Barevné vzorky", vzorka: "Vzorek", kurzor: "Barva",
      viac: "Mnoho dalších barev kůže i prošití", viacOdkaz: "Podívejte se na ně v Elite Diamond Line",
    },
    g: {
      rule: "Realizace", h: "Z aut našich zákazníků",
      p: "Osobní auta, SUV, kufry i kamiony. Každý set na šabloně pro konkrétní model.",
      chips: ["Osobní auta", "SUV", "Kufry", "Boxy do kufru", "Kamiony"],
      fotka: "fotka", kurzor: "Detail", hint: "Posouvejte", hint2: " — fotky se posouvají",
    },
  },
};

/* vzorka = oficiálny obrázok z konfigurátora, foto = rovnaká farba v skutočnom aute
   (časť z galérie e-shopu, časť z recenzií zákazníkov) */
const FARBY = [
  { id: "cierna-cervena", vzor: "Diamond Line", sk: "Čierna · červené šitie", cs: "Černá · červené prošití" },
  { id: "cierna-modra", vzor: "Diamond Line", sk: "Čierna · modré šitie", cs: "Černá · modré prošití" },
  { id: "cierna-bezova", vzor: "Diamond Line", sk: "Čierna · béžové šitie", cs: "Černá · béžové prošití" },
  { id: "bezova", vzor: "Diamond Line", sk: "Béžová", cs: "Béžová" },
  { id: "hneda", vzor: "Diamond Line", sk: "Hnedá", cs: "Hnědá" },
  { id: "hneda-kava", vzor: "Diamond Line", sk: "Hnedá káva", cs: "Hnědá káva" },
  { id: "vinovo-cervena", vzor: "Diamond Line", sk: "Vínovo červená", cs: "Vínově červená" },
  { id: "oranzova", vzor: "Diamond Line", sk: "Oranžová", cs: "Oranžová" },
  { id: "modra", vzor: "Diamond Line", sk: "Modrá", cs: "Modrá" },
];
/* koniec druhého radu vzoriek: ďalšie farby sú v konfigurátore */
const VIAC_HREF = "/luxusne-autokoberce-dragonskin-elite-diamond-line/";

const GALERIA = [
  { f: "lcd-home/f03.jpg", sk: "Osobné auto · vpredu", cs: "Osobní auto · vpředu" },
  { f: "lcd-home/set2.jpg", sk: "Kufor · béžová", cs: "Kufr · béžová" },
  { f: "lcd-home/truck.jpg", sk: "Kamión · čierna s červenou", cs: "Kamion · černá s červenou" },
  { f: "lcd-home/f04.jpg", sk: "Čierna · červené šitie", cs: "Černá · červené prošití" },
  { f: "lcd-home/k-box.jpg", sk: "Box do kufra", cs: "Box do kufru" },
  { f: "lcd-home/set1.jpg", sk: "Béžová · vpredu", cs: "Béžová · vpředu" },
  { f: "lcd-home/k-hf.jpg", sk: "Kufor · celý priestor", cs: "Kufr · celý prostor" },
  { f: "lcd-home/p-dd.jpg", sk: "Dvojvrstvové · pruh", cs: "Dvouvrstvé · pruh" },
];

const cdnObr = (cesta) => CDN + cesta;
const dve = (n) => String(n).padStart(2, "0");

function hlava(rule, h, p, vpravo) {
  return '<div class="lx-hlava"><div class="lx-hlava-t">' +
    (rule ? '<div class="rule"><span class="n">00 — ' + rule + "</span></div>" : "") +
    '<h2 class="lx-h">' + h + '</h2><p class="lx-p">' + p + "</p></div>" + (vpravo || "") + "</div>";
}
const stitky = (chips) => '<div class="lx-chips">' + chips.map((c) => '<span class="chip">' + c + "</span>").join("") + "</div>";
const lista = (hint, hint2, cta) =>
  '<div class="pinfoot lx-foot"><span class="pf-hint">' + hint + "<span>" + hint2 + "</span></span>" +
  '<span class="pf-bar"><i class="lx-bar"></i></span>' +
  '<a class="btn pf-cta" href="' + cta.href + '">' + cta.text + "</a></div>";

/* HTML troch modulov; `obr` premení relatívnu cestu obrázka na adresu,
   `moznosti.cta` / `moznosti.vzorky` = kam vedú tlačidlá,
   `moznosti.kapitoly: false` = bez čísla kapitoly (stránka, ktorá ich nepoužíva) */
export function lxModulyHTML(cz, obr = cdnObr, moznosti = {}) {
  const T = cz ? TEXTY.cs : TEXTY.sk;
  const jaz = cz ? "cs" : "sk";
  const cta = moznosti.cta || { href: "#konf", text: T.cta };
  const vzorkyHref = moznosti.vzorky || "#vzorky";
  const kap = moznosti.kapitoly !== false;
  const od = [0.12, 0.36, 0.6, 0.84];

  const predPo =
    '<section class="lx lx-tma lx-pp" id="predapo"><div class="lx-pp-lep lx-vzor"><div class="lx-pin">' +
    hlava(kap && T.pp.rule, T.pp.h, T.pp.p,
      '<div class="lx-pocet"><span><span class="lx-pp-cislo">0</span>&nbsp;%</span><small>' + T.pp.pocet + "</small></div>") +
    stitky(T.pp.chips) +
    '<div class="lx-pp-main"><div class="lx-pp-stage">' +
    '<div class="lx-pp-plocha" data-lx-kurzor="' + T.pp.kurzor + '">' +
    '<img src="' + obr("lcd-home/ba-before.jpg") + '" alt="' + T.pp.altPred + '" width="1400" height="655" decoding="async" loading="lazy">' +
    '<img class="lx-pp-po" src="' + obr("lcd-home/ba-after.jpg") + '" alt="' + T.pp.altPo + '" width="1400" height="655" decoding="async" loading="lazy">' +
    '<div class="lx-pp-hrana" aria-hidden="true"></div>' +
    '<div class="lx-cip lx-cip-l">' + T.pp.po + '</div><div class="lx-cip lx-cip-r">' + T.pp.pred + "</div></div>" +
    '<ol class="lx-leg">' +
    T.pp.body.map((b, i) =>
      '<li class="lx-leg-r" data-od="' + od[i] + '"><span class="lx-leg-no">' + (i + 1) + "</span>" +
      '<span class="lx-leg-sw" style="background-image:url(' + obr("lcd-home/pp-" + (i + 1) + ".jpg") + ')"></span>' +
      '<span class="lx-leg-t"><b>' + b[0] + "</b><span>" + b[1] + "</span></span>" +
      '<span class="lx-leg-i">' + b[2] + '</span><span class="lx-leg-ok" aria-hidden="true"></span></li>'
    ).join("") +
    "</ol></div></div>" +
    lista(T.pp.hint, T.pp.hint2, cta) +
    "</div></div></section>";

  const farby =
    '<section class="lx lx-svetla lx-farby" id="farby"><div class="lx-vzor"><div class="lx-wrap lx-farby-in">' +
    hlava(kap && T.f.rule, T.f.h, T.f.p) +
    stitky(T.f.chips) +
    '<div class="lx-farby-main">' +
    '<div class="lx-farby-velka" data-lx-kurzor="' + T.f.kurzor + '">' +
    FARBY.map((f, i) =>
      '<img' + (i === 0 ? ' class="on"' : "") + ' src="' + obr("farby/" + f.id + ".jpg") + '" alt="' + f[jaz] + " · " + f.vzor + '" decoding="async" loading="lazy">'
    ).join("") +
    '<div class="lx-farby-stitok"><span class="lx-farby-cislo">01</span><span> / ' + dve(FARBY.length) + "</span></div></div>" +
    '<div class="lx-farby-panel">' +
    '<div class="lx-farby-vzor-n">' + T.f.vzorka + " · " + FARBY[0].vzor + "</div>" +
    '<div class="lx-farby-meno" aria-live="polite">' + FARBY[0][jaz] + "</div>" +
    '<div class="lx-farby-vzorky" role="group" aria-label="' + T.f.skupina + '">' +
    FARBY.map((f, i) =>
      '<button class="lx-farby-vzorka" type="button" data-i="' + i + '" data-vzor="' + f.vzor + '" aria-pressed="' + (i === 0) + '" aria-label="' + f[jaz] + ", " + f.vzor + '">' +
      '<img src="' + obr("farby/sw-" + f.id + ".jpg") + '" alt="" width="68" height="68" decoding="async" loading="lazy"></button>'
    ).join("") +
    '<a class="lx-farby-viac" href="' + (moznosti.viac || VIAC_HREF) + '" style="grid-column:span ' + (7 - (FARBY.length % 7 || 7) || 7) + '">' +
    '<span class="lx-farby-viac-t">' + T.f.viac + '</span><span class="lx-farby-viac-o">' + T.f.viacOdkaz + " →</span></a>" +
    "</div>" +
    '<div class="lx-farby-akcie"><a class="btn pf-cta" href="' + cta.href + '">' + cta.text + "</a>" +
    '<a class="lx-odkaz" href="' + vzorkyHref + '">' + T.vzorky + "</a></div>" +
    "</div></div></div></div></section>";

  const galeria =
    '<section class="lx lx-tma lx-gal" id="galeria"><div class="lx-gal-lep lx-vzor"><div class="lx-gal-pin">' +
    '<div class="lx-gal-hore">' +
    hlava(kap && T.g.rule, T.g.h, T.g.p,
      '<div class="lx-pocet lx-gal-pocet"><span><span class="lx-gal-cislo">01</span> / ' + dve(GALERIA.length) + "</span><small>" + T.g.fotka + "</small></div>") +
    stitky(T.g.chips) + "</div>" +
    '<div class="lx-gal-okno"><div class="lx-gal-trat">' +
    GALERIA.map((g) =>
      '<figure class="lx-gal-k"><button class="lx-gal-f" type="button" data-lx-kurzor="' + T.g.kurzor + '" aria-label="' + T.g.kurzor + ": " + g[jaz] + '">' +
      '<img src="' + obr(g.f) + '" alt="' + g[jaz] + '" decoding="async" loading="lazy"></button>' +
      "<figcaption>" + g[jaz] + "</figcaption></figure>"
    ).join("") +
    "</div></div>" +
    '<div class="lx-gal-dole">' + lista(T.g.hint, T.g.hint2, cta) + "</div>" +
    "</div></div></section>";

  return { predPo, farby, galeria };
}

function zHTML(html) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content.firstElementChild;
}

/* čísla kapitol „NN — názov" idú za sebou podľa poradia na stránke
   (rovnaký názov = rovnaké číslo, napr. mobilná kópia hlavičky) */
export function lxCislujKapitoly(root) {
  const cisla = new Map();
  root.querySelectorAll(".rule .n").forEach((n) => {
    const m = n.textContent.match(/^\s*\d{1,2}\s+—\s+(.+)$/);
    if (!m) return;
    if (!cisla.has(m[1])) cisla.set(m[1], cisla.size + 1);
    n.textContent = dve(cisla.get(m[1])) + " — " + m[1];
  });
}

/* úvodná stránka: starý posuvník (modul 01) ide preč; farby pred vzorkovník,
   pred a po za porovnanie s konkurenciou, galéria pred kontaktný formulár —
   ešte pred vložením do stránky, aby GSAP počítal pozície už s nimi */
export function lcdhModulyPostav(root, cz) {
  const h = lxModulyHTML(cz);
  const stary = root.querySelector("#predapo");
  if (stary) stary.remove();
  const vzorky = root.querySelector("#vzorky");
  if (vzorky) vzorky.before(zHTML(h.farby));
  const porovnanie = root.querySelector("#porovnanie");
  if (porovnanie) porovnanie.after(zHTML(h.predPo));
  const napiste = root.querySelector("#napiste");
  if (napiste) napiste.before(zHTML(h.galeria));
  lxCislujKapitoly(root);
}

/* správanie: scroll scény, prepínanie farieb, zväčšenie fotky, kurzor so štítkom */
export function lxModulyOziv(root, cz) {
  const T = cz ? TEXTY.cs : TEXTY.sk;
  const tichy = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mys = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const obmedz = (x) => Math.min(1, Math.max(0, x));

  /* farby — prepína sa kliknutím (prejdenie myšou meniť nebude, fotka by blikala) */
  root.querySelectorAll(".lx-farby").forEach((sek) => {
    const velke = sek.querySelectorAll(".lx-farby-velka img");
    const vzorky = sek.querySelectorAll(".lx-farby-vzorka");
    const meno = sek.querySelector(".lx-farby-meno");
    const vzorN = sek.querySelector(".lx-farby-vzor-n");
    const cislo = sek.querySelector(".lx-farby-cislo");
    vzorky.forEach((v) => v.addEventListener("click", () => {
      const i = +v.dataset.i;
      velke.forEach((im, j) => im.classList.toggle("on", i === j));
      vzorky.forEach((w) => w.setAttribute("aria-pressed", w === v ? "true" : "false"));
      if (meno) meno.textContent = (v.getAttribute("aria-label") || "").split(", ")[0];
      if (vzorN) vzorN.textContent = T.f.vzorka + " · " + v.dataset.vzor;
      if (cislo) cislo.textContent = dve(i + 1);
    }));
    /* fotky ostatných farieb stiahnuť až keď je sekcia blízko */
    const nacitaj = () => velke.forEach((im) => { im.loading = "eager"; });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((z) => { if (z.some((x) => x.isIntersecting)) { nacitaj(); io.disconnect(); } }, { rootMargin: "600px 0px" });
      io.observe(sek);
    } else nacitaj();
  });

  /* galéria: klik zväčší fotku */
  const galerie = root.querySelectorAll(".lx-gal");
  if (galerie.length) {
    const zoom = zHTML('<div class="lx-zoom" hidden><img alt=""><button class="lx-zoom-x" type="button" aria-label="' + T.zavriet + '">&times;</button></div>');
    root.appendChild(zoom);
    const zImg = zoom.querySelector("img");
    let spat = null;
    const zatvor = () => { zoom.hidden = true; zImg.removeAttribute("src"); if (spat) spat.focus(); };
    zoom.addEventListener("click", zatvor);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !zoom.hidden) zatvor(); });
    galerie.forEach((g) => g.querySelectorAll(".lx-gal-f").forEach((b) => {
      b.addEventListener("click", () => {
        const im = b.querySelector("img");
        zImg.src = im.currentSrc || im.src; zImg.alt = im.alt;
        spat = b; zoom.hidden = false; zoom.querySelector(".lx-zoom-x").focus();
      });
    }));
  }

  /* kurzor so štítkom — len nad fotkami modulov, nikde inde */
  if (mys && !tichy) {
    const kurzor = zHTML('<div class="lx-kurzor" aria-hidden="true"><span></span></div>');
    const stitok = kurzor.querySelector("span");
    root.appendChild(kurzor);
    root.classList.add("lx-mys");
    let mx = -200, my = -200, kx = -200, ky = -200, bezi = false;
    const slucka = () => {
      kx += (mx - kx) * 0.2; ky += (my - ky) * 0.2;
      kurzor.style.transform = "translate3d(" + kx + "px," + ky + "px,0)";
      if (Math.abs(mx - kx) + Math.abs(my - ky) > 0.5 || kurzor.classList.contains("on")) requestAnimationFrame(slucka);
      else bezi = false;
    };
    root.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      const ciel = e.target.closest && e.target.closest("[data-lx-kurzor]");
      if (ciel) {
        if (!kurzor.classList.contains("on")) { kx = mx; ky = my; }
        stitok.textContent = ciel.dataset.lxKurzor;
      }
      kurzor.classList.toggle("on", !!ciel);
      if (!bezi) { bezi = true; requestAnimationFrame(slucka); }
    });
    root.addEventListener("pointerleave", () => kurzor.classList.remove("on"));
  }

  /* scény riadené scrollovaním */
  const pp = root.querySelector(".lx-pp");
  const plocha = pp && pp.querySelector(".lx-pp-plocha");
  const ppCislo = pp && pp.querySelector(".lx-pp-cislo");
  const ppBar = pp && pp.querySelector(".lx-bar");
  const body = pp ? pp.querySelectorAll(".lx-leg-r") : [];
  const gal = root.querySelector(".lx-gal");
  const trat = gal && gal.querySelector(".lx-gal-trat");
  const galCislo = gal && gal.querySelector(".lx-gal-cislo");
  const galBar = gal && gal.querySelector(".lx-bar");
  const galPocet = gal ? gal.querySelectorAll(".lx-gal-k").length : 0;
  if (!pp && !gal) return;

  /* position:sticky nefunguje, keď má niektorý predok overflow hidden/auto —
     vtedy scéna beží ako normálny blok a postup sa ráta podľa polohy fotky */
  const galLepi = () => gal && innerWidth > 760 && !gal.classList.contains("lx-bez-lepu");
  const rezim = () => {
    [pp, gal].forEach((s) => {
      if (!s) return;
      let el = s.parentElement, zly = false;
      while (el && el !== document.body && el !== document.documentElement) {
        const cs = getComputedStyle(el);
        if (/(hidden|auto|scroll)/.test(cs.overflowY + " " + cs.overflowX)) { zly = true; break; }
        el = el.parentElement;
      }
      s.classList.toggle("lx-bez-lepu", zly);
    });
    /* výška galérie podľa dĺžky pásu: scroll a posun idú zhruba 1 : 1 */
    if (gal && trat) {
      if (galLepi()) {
        const cesta = Math.max(0, trat.scrollWidth - innerWidth);
        gal.style.height = Math.round(innerHeight * 1.2 + cesta) + "px";
      } else gal.style.height = "";
    }
  };
  const postup = (el) => {
    const r = el.getBoundingClientRect(), dlzka = r.height - innerHeight;
    return dlzka > 0 ? obmedz(-r.top / dlzka) : 0;
  };
  const kresli = () => {
    if (pp && plocha) {
      let q;
      if (pp.classList.contains("lx-bez-lepu")) {
        const r = plocha.getBoundingClientRect();
        q = obmedz((innerHeight * 0.85 - r.top) / (innerHeight * 0.65));
      } else q = obmedz((postup(pp) - 0.05) / 0.85);
      plocha.style.setProperty("--p", (q * 100).toFixed(2) + "%");
      if (ppCislo) ppCislo.textContent = Math.round(q * 100);
      if (ppBar) ppBar.style.width = (q * 100).toFixed(1) + "%";
      body.forEach((b) => b.classList.toggle("on", q >= +b.dataset.od));
    }
    if (gal && trat) {
      let g;
      if (galLepi()) {
        g = postup(gal);
        const cesta = Math.max(0, trat.scrollWidth - innerWidth);
        trat.style.transform = "translate3d(" + (-g * cesta).toFixed(1) + "px,0,0)";
      } else {
        trat.style.transform = "";
        const max = trat.scrollWidth - trat.clientWidth;
        g = max > 0 ? obmedz(trat.scrollLeft / max) : 0;
      }
      if (galCislo) galCislo.textContent = dve(Math.min(galPocet, Math.round(g * (galPocet - 1)) + 1));
      if (galBar) galBar.style.width = (g * 100).toFixed(1) + "%";
    }
  };
  let caka = false;
  const naRaf = () => { if (!caka) { caka = true; requestAnimationFrame(() => { caka = false; kresli(); }); } };
  addEventListener("scroll", naRaf, { passive: true });
  if (trat) trat.addEventListener("scroll", naRaf, { passive: true });
  addEventListener("resize", () => { rezim(); naRaf(); });
  addEventListener("load", () => { rezim(); naRaf(); });
  requestAnimationFrame(() => { rezim(); kresli(); });
}
