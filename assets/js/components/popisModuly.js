/*
 * Dva moduly v popise produktu (Michal 2026-09-30, podľa konceptu redizajnu):
 *
 * 1. PRED A PO — namiesto posuvníka „Rozdiel s Luxusnými autokobercami", ktorý
 *    sa musel ťahať myšou, sa pri scrollovaní scéna prilepí a zlatá čiara sama
 *    prejde z holej podlahy na podlahu s kobercami. Fotky berie z pôvodného
 *    posuvníka, takže každý produkt ukáže svoje vlastné.
 * 2. FARBY — sekcia „Špeciálna farba interiéru?" dostane vzorky farieb; klik
 *    prepne fotku na skutočný koberec v danej farbe. Len na Diamond Line, lebo
 *    fotky všetkých farieb existujú len pre tento vzor (Hexa/Stripe majú v
 *    galérii iba čiernu s červenou a cudzí vzor by zákazníka zavádzal).
 *
 * Pôvodné bloky sa nemažú, len skryjú — iný kód (twentytwenty) sa na ne viaže.
 */

const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/produkt-farby/";

const TEXTY = {
  sk: {
    ppNadpis: "Rovnaké auto, iný interiér",
    ppNad: "Pred a po",
    ppNavod: "Posúvajte stránku a sledujte, ako sa interiér mení",
    ppPred: "Pred",
    ppPo: "Po",
    ppBody: [
      ["Celá podlaha", "Šablóna pre Váš model zakryje podlahu od pedálov až po prah."],
      ["Aj boky", "Okraje siahajú až na bočné časti podlahy."],
      ["Nič sa neposúva", "Drží na suchom zipse, pri plastových lištách na klipoch."],
      ["Ľahké čistenie", "Vyberiete ho, utriete vlhkou handrou a vložíte späť."],
    ],
    ppFotka: "Na fotke: Diamond Line, čierna s červeným šitím.",
    fNadpis: "Farbu vyberiete podľa interiéru",
    fText: "Kliknite na farbu a pozrite si ju v skutočnom aute. Farbu kože a šitia potom zvolíte v konfigurátore hore na stránke.",
    fTlacidlo: "Vyberte farbu v konfigurátore",
    fSkupina: "Farby autokobercov",
  },
  cs: {
    ppNadpis: "Stejné auto, jiný interiér",
    ppNad: "Před a po",
    ppNavod: "Posouvejte stránku a sledujte, jak se interiér mění",
    ppPred: "Před",
    ppPo: "Po",
    ppBody: [
      ["Celá podlaha", "Šablona pro Váš model zakryje podlahu od pedálů až po práh."],
      ["I boky", "Okraje sahají až na boční části podlahy."],
      ["Nic se neposouvá", "Drží na suchém zipu, u plastových lišt na klipech."],
      ["Snadné čištění", "Vyndáte ho, otřete vlhkým hadříkem a vrátíte zpět."],
    ],
    ppFotka: "Na fotce: Diamond Line, černá s červeným prošitím.",
    fNadpis: "Barvu vyberete podle interiéru",
    fText: "Klikněte na barvu a podívejte se na ni ve skutečném autě. Barvu kůže a prošití pak zvolíte v konfigurátoru nahoře na stránce.",
    fTlacidlo: "Vyberte barvu v konfigurátoru",
    fSkupina: "Barvy autokoberců",
  },
};

// Fotky sú zo SK galérie Diamond Line (súbory pomenované podľa farby),
// rovnaký záber na miesto vodiča. koza/sitie = farby krúžku vzorky.
const FARBY = [
  { id: "ciernocervene", sk: "Čierna · červené šitie", cs: "Černá · červené prošití", koza: "#161616", sitie: "#d4232e" },
  { id: "ciernomodre", sk: "Čierna · modré šitie", cs: "Černá · modré prošití", koza: "#161616", sitie: "#3563d6" },
  { id: "ciernosede", sk: "Čierna · sivé šitie", cs: "Černá · šedé prošití", koza: "#161616", sitie: "#b3b3b3" },
  { id: "ciernobezove", sk: "Čierna · béžové šitie", cs: "Černá · béžové prošití", koza: "#161616", sitie: "#dcc7a2" },
  { id: "bezove", sk: "Béžová", cs: "Béžová", koza: "#d9c9ab", sitie: "#f3eadb" },
  { id: "hnede", sk: "Hnedá", cs: "Hnědá", koza: "#b36f3b", sitie: "#f0e1c9" },
  { id: "oranzove", sk: "Oranžová", cs: "Oranžová", koza: "#d2712b", sitie: "#f4e4cd" },
  { id: "vinovocervene", sk: "Vínovo červená", cs: "Vínově červená", koza: "#7b2631", sitie: "#ecdfd0" },
];

function jazyk() {
  return /\.cz$/.test(location.hostname) ? "cs" : "sk";
}

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

/* ---------------------------------------------------------------- PRED A PO */
function predPo(T) {
  // body („od pedálov až po prah") platia pre interiér, nie pre kufor a boxy
  if (/kufr|kufor|kufra|box/i.test(location.pathname)) return;
  const obal = document.querySelector("#description .twentytwenty-wrap");
  if (!obal || document.querySelector(".lcd-pp")) return;
  const obrazky = [].slice.call(obal.querySelectorAll(".twentytwenty-container img"));
  // pôvodný posuvník má triedy before/after naopak, preto rozhodujú alt a názov súboru
  const jePo = (i) => /^po$/i.test((i.alt || "").trim()) || /after/i.test(i.src);
  const po = obrazky.find(jePo);
  const pred = obrazky.find((i) => i !== po);
  if (!po || !pred) return;

  // full-width = rovnaký mechanizmus plnej šírky, aký používajú ostatné pásy popisu
  const sekcia = el("section", "lcd-pp full-width");
  sekcia.setAttribute("aria-label", T.ppNad);
  const lep = el("div", "lcd-pp-lep");
  const vnutro = el("div", "lcd-pp-in");

  const hlava = el("div", "lcd-pp-hl");
  const hl = el("div");
  hl.appendChild(el("p", "lcd-pp-nad", T.ppNad));
  hl.appendChild(el("h3", "lcd-pp-h", T.ppNadpis));
  hlava.appendChild(hl);
  hlava.appendChild(el("p", "lcd-pp-navod", T.ppNavod));

  const plocha = el("div", "lcd-pp-plocha");
  const imPred = el("img");
  imPred.src = pred.src;
  imPred.alt = T.ppPred;
  imPred.loading = "lazy";
  const imPo = el("img", "lcd-pp-po");
  imPo.src = po.src;
  imPo.alt = T.ppPo;
  imPo.loading = "lazy";
  plocha.appendChild(imPred);
  plocha.appendChild(imPo);
  plocha.appendChild(el("div", "lcd-pp-hrana"));
  plocha.appendChild(el("span", "lcd-pp-cip lcd-pp-cip-po", T.ppPo));
  plocha.appendChild(el("span", "lcd-pp-cip lcd-pp-cip-pred", T.ppPred));

  const body = el("div", "lcd-pp-body");
  const prahy = [0.12, 0.36, 0.6, 0.84];
  T.ppBody.forEach((b, i) => {
    const d = el("div", "lcd-pp-bod");
    d.setAttribute("data-od", String(prahy[i]));
    d.appendChild(el("b", null, b[0]));
    d.appendChild(el("span", null, b[1]));
    body.appendChild(d);
  });

  vnutro.appendChild(hlava);
  vnutro.appendChild(plocha);
  vnutro.appendChild(body);
  // Hexa a Stripe majú vlastnú fotku „po"; spoločná fotka Diamond Line
  // (Posuvka-after1) sa inde než na jednovrstvovom Diamonde musí popísať,
  // inak by napr. pri dvojvrstvových ukazovala iný produkt bez vysvetlenia.
  if (/Posuvka-after1/i.test(po.src) && !/dragonskin-diamond-line/i.test(location.pathname)) {
    vnutro.appendChild(el("p", "lcd-pp-pozn", T.ppFotka));
  }
  lep.appendChild(vnutro);
  sekcia.appendChild(lep);
  obal.parentNode.insertBefore(sekcia, obal);
  obal.classList.add("lcd-pp-nahradene");

  const bodyEl = [].slice.call(body.children);

  // Prilepenie (position:sticky) zlyhá, keď má niektorý nadradený prvok
  // overflow hidden/auto — na mobile to robí .content-wrapper šablóny.
  // Globálny obal nemeníme; scéna sa vtedy neprilepí a čiara ide podľa toho,
  // ako fotka prechádza obrazovkou.
  let bezLepu = false;
  function rezim() {
    bezLepu = false;
    for (let e = sekcia.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (/hidden|auto|scroll/.test(cs.overflowX + " " + cs.overflowY)) {
        bezLepu = true;
        break;
      }
    }
    sekcia.classList.toggle("lcd-pp-bez-lepu", bezLepu);
  }
  function postup() {
    if (bezLepu) {
      const r = plocha.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.65)));
    }
    const r = sekcia.getBoundingClientRect();
    const dlzka = r.height - window.innerHeight;
    return dlzka > 0 ? Math.min(1, Math.max(0, -r.top / dlzka)) : 0;
  }
  let caka = false;
  function kresli() {
    caka = false;
    const q = Math.min(1, Math.max(0, (postup() - 0.04) / 0.86));
    plocha.style.setProperty("--p", (q * 100).toFixed(2) + "%");
    bodyEl.forEach((b) => b.classList.toggle("on", q >= +b.getAttribute("data-od")));
  }
  function naScroll() {
    if (!caka) {
      caka = true;
      requestAnimationFrame(kresli);
    }
  }
  window.addEventListener("scroll", naScroll, { passive: true });
  window.addEventListener("resize", () => {
    rezim();
    naScroll();
  });
  rezim();
  kresli();
}

/* ------------------------------------------------------------------- FARBY */
function farby(T, lang) {
  if (!/diamond/i.test(location.pathname)) return;
  const sekcia = [].slice
    .call(document.querySelectorAll("#description section.text-block"))
    .find((s) => /(farb|barv)[a-zěščřžýáíé]*\s+interi/i.test(s.textContent || ""));
  if (!sekcia || sekcia.querySelector(".lcd-farby")) return;
  const obr = sekcia.querySelector(".mobile-image img");
  const prose = sekcia.querySelector(".prose");
  if (!obr || !prose) return;
  sekcia.classList.add("lcd-farby-sekcia");

  const nadpis = prose.querySelector(".text-gradient") || prose.querySelector(".h1");
  if (nadpis) nadpis.textContent = T.fNadpis;
  [].slice.call(prose.querySelectorAll("p:not(.h1)")).forEach((p) => {
    p.hidden = true;
  });

  const blok = el("div", "lcd-farby");
  blok.appendChild(el("p", "lcd-farby-text", T.fText));
  const skupina = el("div", "lcd-farby-vzorky");
  skupina.setAttribute("role", "group");
  skupina.setAttribute("aria-label", T.fSkupina);
  const meno = el("p", "lcd-farby-meno");
  meno.setAttribute("aria-live", "polite");

  obr.classList.add("lcd-farby-foto");
  let nacitane = false;
  function prednacitaj() {
    if (nacitane) return;
    nacitane = true;
    FARBY.forEach((f) => {
      const i = new Image();
      i.src = CDN + f.id + ".jpg";
    });
  }

  function zvol(f, tl) {
    prednacitaj();
    [].forEach.call(skupina.children, (b) => b.setAttribute("aria-pressed", b === tl ? "true" : "false"));
    meno.textContent = f[lang];
    obr.classList.add("mizne");
    const nove = new Image();
    nove.onload = () => {
      obr.src = nove.src;
      obr.alt = f[lang];
      obr.classList.remove("mizne");
    };
    nove.onerror = () => obr.classList.remove("mizne");
    nove.src = CDN + f.id + ".jpg";
  }

  FARBY.forEach((f, i) => {
    const b = el("button", "lcd-farby-vzorka");
    b.type = "button";
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.setAttribute("aria-label", f[lang]);
    b.title = f[lang];
    b.style.setProperty("--koza", f.koza);
    b.style.setProperty("--sitie", f.sitie);
    b.addEventListener("click", () => zvol(f, b));
    b.addEventListener("pointerenter", prednacitaj, { once: true });
    skupina.appendChild(b);
  });
  meno.textContent = FARBY[0][lang];

  const tl = el("a", "lcd-farby-tl", T.fTlacidlo + " ↑");
  tl.href = "#";
  tl.addEventListener("click", (e) => {
    e.preventDefault();
    const ciel = document.querySelector(".p-info-wrapper") || document.body;
    const y = ciel.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  });

  blok.appendChild(skupina);
  blok.appendChild(meno);
  blok.appendChild(tl);
  prose.appendChild(blok);

  // prvá farba = čierna s červeným, rovnaká ako hlavná fotka produktu
  obr.src = CDN + FARBY[0].id + ".jpg";
  obr.alt = FARBY[0][lang];
}

export function initPopisModuly() {
  const lang = jazyk();
  const T = TEXTY[lang];
  function spusti() {
    try {
      predPo(T);
    } catch (e) {
      console.warn("lcd pred/po", e);
    }
    try {
      farby(T, lang);
    } catch (e) {
      console.warn("lcd farby", e);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", spusti);
  else spusti();
}
