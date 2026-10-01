/* Tri moduly z konceptu redizajnu (30. 9. 2026), na úvodnej stránke od 1. 10. 2026:
   PRED A PO  — scéna sa pri scrollovaní prilepí a zlatá čiara prejde z holej podlahy na koberce,
   FARBY      — vzorky prepínajú veľkú fotku skutočného koberca,
   GALÉRIA    — pás fotiek z áut zákazníkov; na PC ho posúva scroll, na mobile sa ťahá prstom.
   Rovnaký kód používa aj návrh produktovej stránky, preto adresy obrázkov idú cez `obr`.
   Štýly: blok „HP: PRED A PO + FARBY + GALÉRIA" v _lcdHome.scss / luxuryCar.css. */

const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/";

const TEXTY = {
  sk: {
    ppNad: "Posúvajte stránku nadol", ppH: "Pred a <b>po</b>", ppPocet: "podlahy pod ochranou",
    ppPo: "Po", ppPred: "Pred", ppKurzor: "Posúvajte",
    ppAltPred: "Interiér auta bez autokobercov", ppAltPo: "Ten istý interiér s luxusnými autokobercami",
    ppBody: [
      ["Celá podlaha", "Pokrýva 100 % podlahy"],
      ["Aj boky", "Boky kryté z 95 %"],
      ["Šité na mieru", "Podľa šablóny pre Váš model"],
      ["Čistenie za minútu", "Vyberiete a utriete vlhkou handrou"],
    ],
    fNad: "Farba podľa interiéru", fH: "Ku ktorej farbe patrí Vaše auto?",
    fText: "Vyberte vzorku a pozrite si farbu na skutočnom koberci v aute.",
    fKurzor: "Farba", fSkupina: "Farebné vzorky",
    gH: "Z áut našich zákazníkov",
    gText: "Osobné autá, SUV, kufre aj kamióny. Každý set na šablóne pre konkrétny model.",
    gKurzor: "Pozrieť", gZavriet: "Zavrieť",
  },
  cs: {
    ppNad: "Posouvejte stránku dolů", ppH: "Před a <b>po</b>", ppPocet: "podlahy pod ochranou",
    ppPo: "Po", ppPred: "Před", ppKurzor: "Posouvejte",
    ppAltPred: "Interiér auta bez autokoberců", ppAltPo: "Tentýž interiér s luxusními autokoberci",
    ppBody: [
      ["Celá podlaha", "Pokrývá 100 % podlahy"],
      ["I boky", "Boky kryté z 95 %"],
      ["Šité na míru", "Podle šablony pro Váš model"],
      ["Čištění za minutu", "Vyjmete a otřete vlhkým hadříkem"],
    ],
    fNad: "Barva podle interiéru", fH: "Ke které barvě patří Vaše auto?",
    fText: "Vyberte vzorek a podívejte se na barvu na skutečném koberci v autě.",
    fKurzor: "Barva", fSkupina: "Barevné vzorky",
    gH: "Z aut našich zákazníků",
    gText: "Osobní auta, SUV, kufry i kamiony. Každý set na šabloně pro konkrétní model.",
    gKurzor: "Detail", gZavriet: "Zavřít",
  },
};

/* vzorka = výrez materiálu, foto = ten istý materiál v aute */
const FARBY = [
  { sw: "lcd-home/sw1.jpg", foto: "produkt-farby/ciernocervene.jpg", sk: "Čierna · červené prešitie", cs: "Černá · červené prošití" },
  { sw: "lcd-home/sw2.jpg", foto: "produkt-farby/ciernosede.jpg", sk: "Čierna · sivé prešitie", cs: "Černá · šedé prošití" },
  { sw: "lcd-home/sw4.jpg", foto: "lcd-home/m-jed.jpg", sk: "Červená · sivé prešitie", cs: "Červená · šedé prošití" },
  { sw: "lcd-home/sw-bezova.jpg", foto: "produkt-farby/bezove.jpg", sk: "Béžová · béžové prešitie", cs: "Béžová · béžové prošití" },
  { sw: "lcd-home/sw-pruhy.jpg", foto: "lcd-home/cmp1.jpg", sk: "Čierna · červené pruhy", cs: "Černá · červené pruhy" },
];

const GALERIA = [
  { f: "lcd-home/f03.jpg", sk: "Osobné auto · vpredu", cs: "Osobní auto · vpředu" },
  { f: "lcd-home/set2.jpg", sk: "Kufor · béžová", cs: "Kufr · béžová" },
  { f: "lcd-home/truck.jpg", sk: "Kamión · čierna s červenou", cs: "Kamion · černá s červenou" },
  { f: "lcd-home/f04.jpg", sk: "Čierna · červené prešitie", cs: "Černá · červené prošití" },
  { f: "lcd-home/k-box.jpg", sk: "Box do kufra", cs: "Box do kufru" },
  { f: "lcd-home/set1.jpg", sk: "Béžová · vpredu", cs: "Béžová · vpředu" },
  { f: "lcd-home/k-hf.jpg", sk: "Kufor · celý priestor", cs: "Kufr · celý prostor" },
  { f: "lcd-home/p-dd.jpg", sk: "Dvojvrstvové · pruh", cs: "Dvouvrstvé · pruh" },
];

const cdnObr = (cesta) => CDN + cesta;

/* HTML troch modulov; `obr` premení relatívnu cestu obrázka na adresu */
export function lxModulyHTML(cz, obr = cdnObr) {
  const T = cz ? TEXTY.cs : TEXTY.sk;
  const jaz = cz ? "cs" : "sk";
  const od = [0.15, 0.38, 0.6, 0.82];

  const predPo =
    '<section class="lx lx-pp" id="predapo">' +
    '<div class="lx-pp-lep"><div class="lx-wrap lx-pp-in">' +
    '<div class="lx-pp-hl"><div><div class="lx-nad">' + T.ppNad + '</div><h2 class="lx-h">' + T.ppH + "</h2></div>" +
    '<div class="lx-pp-pocet"><span><span class="lx-pp-cislo">0</span>&nbsp;%</span><small>' + T.ppPocet + "</small></div></div>" +
    '<div class="lx-pp-plocha" data-lx-kurzor="' + T.ppKurzor + '">' +
    '<img src="' + obr("lcd-home/ba-before.jpg") + '" alt="' + T.ppAltPred + '" width="1400" height="655" decoding="async" loading="lazy">' +
    '<img class="lx-pp-po" src="' + obr("lcd-home/ba-after.jpg") + '" alt="' + T.ppAltPo + '" width="1400" height="655" decoding="async" loading="lazy">' +
    '<div class="lx-pp-hrana" aria-hidden="true"></div>' +
    '<div class="lx-cip lx-cip-l">' + T.ppPo + '</div><div class="lx-cip lx-cip-r">' + T.ppPred + "</div></div>" +
    '<div class="lx-pp-body">' +
    T.ppBody.map((b, i) => '<div class="lx-pp-bod" data-od="' + od[i] + '"><b>' + b[0] + "</b><span>" + b[1] + "</span></div>").join("") +
    "</div></div></div></section>";

  const farby =
    '<section class="lx lx-farby" id="farby"><div class="lx-wrap lx-farby-in">' +
    '<div class="lx-farby-velka" data-lx-kurzor="' + T.fKurzor + '">' +
    FARBY.map((f, i) =>
      '<img' + (i === 0 ? ' class="on"' : "") + ' src="' + obr(f.foto) + '" alt="' + f[jaz] + '" decoding="async" loading="lazy">'
    ).join("") +
    "</div>" +
    '<div class="lx-farby-hlava"><div class="lx-nad">' + T.fNad + '</div><h2 class="lx-h">' + T.fH + "</h2>" +
    '<p class="lx-p">' + T.fText + "</p></div>" +
    '<div class="lx-farby-vyber"><div class="lx-farby-vzorky" role="group" aria-label="' + T.fSkupina + '">' +
    FARBY.map((f, i) =>
      '<button class="lx-farby-vzorka" type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + f[jaz] + '">' +
      '<img src="' + obr(f.sw) + '" alt="" width="68" height="68" decoding="async" loading="lazy"></button>'
    ).join("") +
    '</div><div class="lx-farby-meno" aria-live="polite">' + FARBY[0][jaz] + "</div></div>" +
    "</div></section>";

  const galeria =
    '<section class="lx lx-gal" id="galeria"><div class="lx-gal-lep">' +
    '<div class="lx-wrap lx-gal-hl"><h2 class="lx-h">' + T.gH + '</h2><p class="lx-p">' + T.gText + "</p></div>" +
    '<div class="lx-gal-trat">' +
    GALERIA.map((g) =>
      '<figure class="lx-gal-k"><button class="lx-gal-f" type="button" data-lx-kurzor="' + T.gKurzor + '" aria-label="' + T.gKurzor + ": " + g[jaz] + '">' +
      '<img src="' + obr(g.f) + '" alt="' + g[jaz] + '" decoding="async" loading="lazy"></button>' +
      "<figcaption>" + g[jaz] + "</figcaption></figure>"
    ).join("") +
    "</div></div></section>";

  return { predPo, farby, galeria, zavriet: T.gZavriet };
}

function zHTML(html) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content.firstElementChild;
}

/* úvodná stránka: pred a po nahradí starý posuvník (modul 01), farby idú pred
   vzorkovník a galéria za referenčné videá — ešte pred vložením do stránky,
   aby GSAP počítal pozície už s nimi */
export function lcdhModulyPostav(root, cz) {
  const h = lxModulyHTML(cz);
  const stary = root.querySelector("#predapo");
  if (stary) stary.replaceWith(zHTML(h.predPo));
  const vzorky = root.querySelector("#vzorky");
  if (vzorky) vzorky.before(zHTML(h.farby));
  const ref = root.querySelector("#referencie");
  if (ref) ref.after(zHTML(h.galeria));
}

/* správanie: scroll scény, prepínanie farieb, zväčšenie fotky, kurzor so štítkom */
export function lxModulyOziv(root, cz) {
  const zavriet = cz ? TEXTY.cs.gZavriet : TEXTY.sk.gZavriet;
  const tichy = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mys = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const obmedz = (x) => Math.min(1, Math.max(0, x));

  /* farby */
  root.querySelectorAll(".lx-farby").forEach((sek) => {
    const velke = sek.querySelectorAll(".lx-farby-velka img");
    const vzorky = sek.querySelectorAll(".lx-farby-vzorka");
    const meno = sek.querySelector(".lx-farby-meno");
    vzorky.forEach((v) => {
      const zvol = () => {
        const i = +v.dataset.i;
        velke.forEach((im, j) => im.classList.toggle("on", i === j));
        vzorky.forEach((w) => w.setAttribute("aria-pressed", w === v ? "true" : "false"));
        if (meno && velke[i]) meno.textContent = velke[i].alt;
      };
      v.addEventListener("click", zvol);
      if (mys) v.addEventListener("pointerenter", zvol);
    });
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
    const zoom = zHTML('<div class="lx-zoom" hidden><img alt=""><button class="lx-zoom-x" type="button" aria-label="' + zavriet + '">&times;</button></div>');
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
  const cislo = pp && pp.querySelector(".lx-pp-cislo");
  const body = pp ? pp.querySelectorAll(".lx-pp-bod") : [];
  const gal = root.querySelector(".lx-gal");
  const trat = gal && gal.querySelector(".lx-gal-trat");
  if (!pp && !gal) return;

  /* position:sticky nefunguje, keď má niektorý predok overflow hidden/auto —
     vtedy scéna beží ako normálny blok a postup sa ráta podľa polohy fotky */
  const rezim = () => [pp, gal].forEach((s) => {
    if (!s) return;
    let el = s.parentElement, zly = false;
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (/(hidden|auto|scroll)/.test(cs.overflowY + " " + cs.overflowX)) { zly = true; break; }
      el = el.parentElement;
    }
    s.classList.toggle("lx-bez-lepu", zly);
  });
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
      if (cislo) cislo.textContent = Math.round(q * 100);
      body.forEach((b) => b.classList.toggle("on", q >= +b.dataset.od));
    }
    if (gal && trat) {
      if (innerWidth > 760 && !gal.classList.contains("lx-bez-lepu")) {
        const cesta = Math.max(0, trat.scrollWidth - innerWidth);
        trat.style.transform = "translate3d(" + (-postup(gal) * cesta).toFixed(1) + "px,0,0)";
      } else trat.style.transform = "";
    }
  };
  let caka = false;
  const naRaf = () => { if (!caka) { caka = true; requestAnimationFrame(() => { caka = false; kresli(); }); } };
  addEventListener("scroll", naRaf, { passive: true });
  addEventListener("resize", () => { rezim(); naRaf(); });
  addEventListener("load", () => { rezim(); naRaf(); });
  requestAnimationFrame(() => { rezim(); kresli(); });
}
