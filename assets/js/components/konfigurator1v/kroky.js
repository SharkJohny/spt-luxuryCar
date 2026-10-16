// Nový konfigurátor 1V — kroky 1–3 (vzor prešívania, Vaše auto, farba) + spoločný „obal“ krokov (číslovanie,
// otváranie, postup, „Dokončite výber“ / červený rám podľa živej validácie).
// JADRO od T0.1 (14. 10. 2026; mení len vydanie) + assets/css/_lcd1v-kroky.scss + tools/test-1v/ovladac-kroky.mjs.
// Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md — DOM sa nemaže, voľby len ctx.zapis().
// Kroky a ich poradie = ctx.produkt.kroky (produkty.js TYPY: jedno 6, dvoj 7 s farba2, rohože 3, box farba/pocet/
// velkost); texty kariet a postupu = ctx.texty("kroky") (typy/<typ>.js, základ typy/jedno.js = návrh v26).
//
// Obal (všetky kroky produktu, návrh v26 #sprv .krok):
//   - každý živý krok dostane triedy lcd1v-krok + lcd1v-k-<meno> a novú hlavičku button.lcd1v-hd (číslo / fajka,
//     „Krok N z 6“, „Prosím, vyberte …“ so zlatou linkou, zhrnutie voľby, „Zmeniť“). Živý .order ostáva v DOM a CSS
//     ho roztiahne priehľadne cez hlavičku: klik myšou = klik na .order = živý akordeón (productPage.js), teda aj
//     výzva na auto (validation.js) a SELF-HEAL K3 bežia ako doteraz. Klávesnica (Enter na hlavičke) -> .order.click().
//   - otvorený krok = živá trieda .active (akordeón zostáva živý); zatvorená karta ukazuje len hlavičku (CSS).
//   - „Pokračujte ďalej“ = živé .next-step-button (validácia + otvorenie ďalšieho kroku robí configuratorEngine.js);
//     text nového vzhľadu je v data-lcd1v-text (CSS ::after), živý text ostáva v DOM pre živý kód.
//   - červený rám: živá validácia dáva kroku na 3 s .lcd-needs-fill — obal z neho urobí trvalý rám lcd1v-chyba
//     (+ zablesk), ktorý zmizne, až keď je krok vyplnený (ctx.vyplneny). V kroku auta označí aj prázdne polia.
//   - postup „Vaše autokoberce do interiéru v 6 krokoch“ (zelený = hotový, zlatý = otvorený, sivý = čaká) a zelený pás kompatibility
//     s autom nad krokmi; živý .model-info je pod 1V skrytý (CSS).
//   - po „Pokračujte ďalej“ / kliku na hlavičku stránka podrží kliknutú hlavičku na mieste, resp. posunie novo
//     otvorený krok pod hlavičku webu (zatvorenie dlhého kroku nad ním by ho inak vytlačilo mimo obrazovky).
// Kroky 1–3 (telo): preštýlované živé ovládače (odkazy na sesterské vzory, selecty auta, dlaždice volantu/miest/
//   dverí, 18 farieb) + nové prvky bez name (podnadpis, náhľad farby, chybové texty, poznámka). Farba je len náhľad
//   v kroku (hlavná fotka galérie sa nemení); živý .image-wrap je pod 1V skrytý.
// Ostatné moduly: zhrnutie voľby v hlavičke kroku si môžu prepísať cez data-lcd1v-vyber na živom kroku; po postavení
//   obalu príde udalosť ctx.na("kroky:hotovo"), pri zmene otvoreného kroku ctx.na("kroky:otvoreny", { meno, el }).
// Posledný krok produktu (jedno/dvoj boxy, rohož farba, box velkost): „Pokračujte k súhrnu“ — živé tlačidlo by vkladalo
//   do košíka; pod 1V len zatvorí krok a posunie na súhrn (handler na konci súboru).
// Pokus prejsť na kartu za autom bez auta (hlavička, voľba) = „Pokračujte ďalej“ v karte auta, bez výzvy (Michal
//   16. 10. 2026, docs/1v-kontrakt.md §15; handler „pokus prejsť ďalej bez auta“ nižšie, validation.js pod 1V mlčí).
import { lcdOverKrok } from "../../functions/configuratorEngine.js";

export const MENO = "kroky";

// Spoločné texty obalu. Mená a vety kariet (nm, ti, vy, pod, chyba, pozn, dalej) a postup sú v typy/<typ>.js.
const TEXTY = {
  sk: {
    krokNz: (n, z) => "Krok " + n + " z " + z,
    zmenit: "Zmeniť",
    postup: (z) => "Vaše autokoberce do interiéru v " + z + " krokoch",
    hotovo: (h, z) => "Hotovo " + h + " z " + z,
    vsetko: "Všetko vybrané",
    kompat: "Garancia kompatibility s Vaším vozidlom", // Michal 13. 10.: ako na živom webe
    dalej: "Pokračujte ďalej",
    kSuhrnu: "Pokračujte k súhrnu", // posledný krok produktu
    // 1 farba / 2–4 farby / 5+ farieb (návrhy rohoží: Hexa „3 farby na výber“)
    farbyNaVyber: (n) => n + (n === 1 ? " farba" : n >= 2 && n <= 4 ? " farby" : " farieb") + " na výber",
    // polia auta: [štítok, text prázdneho poľa, chyba]
    polia: {
      brands: ["Značka", "Vyberte značku", "Vyberte, prosím, značku"],
      models: ["Model", "Vyberte model", "Vyberte, prosím, model"],
      years: ["Rok výroby", "Vyberte rok", "Vyberte, prosím, rok"],
      "type-selector": ["Typ karosérie", "Vyberte karosériu", "Vyberte, prosím, karosériu"],
    },
    jedenBox: "1 box",
    dvaBoxy: "2 boxy",
  },
};

// farba šitia (stem bez diakritiky) -> tvar pred „šitie“ (návrh: „Čierna / červené šitie“)
const SITIE = {
  cerven: "červené", modr: "modré", ciern: "čierne", bezov: "béžové", siv: "sivé", sed: "šedé",
  biel: "biele", zlt: "žlté", zelen: "zelené", bronzov: "bronzové", oranzov: "oranžové", hned: "hnedé", fialov: "fialové",
};

const bezDiakritiky = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const prveVelke = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** „Diamond Farba kože : Čierna / Farba šitia: Červená“ -> { vzor: "Diamond", nazov: "Čierna / červené šitie" } */
export function nazovFarby(text) {
  // NFC: časť textov v Shoptete je rozložená (s + mäkčeň ako 2 znaky: „čierna farba šitia zelená“)
  const t = String(text || "").normalize("NFC").replace(/\s+/g, " ").trim();
  const m = /^(.*?)\s*farba\s+ko[žz]e\s*:?\s*(.+?)(?:\s*\/?\s*farba\s+[šs]itia\s*:?\s*(.+))?$/i.exec(t);
  if (!m) return { vzor: "", nazov: t };
  const koza = prveVelke(m[2].replace(/[\s/]+$/, "").trim().toLowerCase());
  if (!m[3]) return { vzor: m[1].trim(), nazov: koza };
  const kmen = bezDiakritiky(m[3].trim()).replace(/(ou|a|y|e|i)$/, "");
  const sitie = SITIE[kmen] || m[3].trim().toLowerCase();
  return { vzor: m[1].trim(), nazov: koza + " / " + sitie + " šitie" };
}

/** „ DIAMOND LINE“ -> „Diamond Line“ */
const nazovVzoru = (s) => String(s || "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase());

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

function prepni(e, trieda, stav) {
  if (e && e.classList.contains(trieda) !== !!stav) e.classList.toggle(trieda, !!stav);
}
function nastavText(e, text) {
  if (e && e.textContent !== text) e.textContent = text;
}
function nastavAttr(e, meno, hodnota) {
  if (!e) return;
  if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
  else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  // CZ zatiaľ nie je v registri (produkty.js); texty sú len SK. Typ: mená kariet a postup z typy/<typ>.js.
  const TT = ctx.texty("kroky");
  const T = Object.assign({}, TEXTY.sk, { postup: typeof TT.postup === "function" ? TT.postup : TEXTY.sk.postup, kroky: TT.kroky || {} });
  const textKroku = (meno) => T.kroky[meno] || {};
  const MENA = ctx.produkt && ctx.produkt.kroky ? ctx.produkt.kroky : ["vzor", "auto", "farba", "rozlozenie", "kufor", "boxy"];
  const form = ctx.form();
  const cw = form && form.querySelector(".content-wrap");
  if (!cw) return;

  /** @type {{ meno: string, el: HTMLElement, hd: HTMLElement, no: HTMLElement, vy: HTMLElement, navstiveny: boolean }[]} */
  const kroky = [];
  const zoznam = MENA.map((m) => ({ meno: m, el: ctx.krok(m) })).filter((k) => k.el);
  const spolu = zoznam.length;

  // ---------------------------------------------------------------- hlavičky
  zoznam.forEach(function (k, i) {
    const t = textKroku(k.meno);
    const krok = k.el;
    krok.classList.add("lcd1v-krok", "lcd1v-k-" + k.meno);
    const hd = el("button", "lcd1v-hd");
    hd.type = "button";
    const no = el("span", "lcd1v-no", String(i + 1));
    no.setAttribute("aria-hidden", "true");
    const tx = el("span", "lcd1v-tx");
    tx.appendChild(el("span", "lcd1v-ey", T.krokNz(i + 1, spolu)));
    tx.appendChild(el("span", "lcd1v-nm", t.nm || ""));
    tx.appendChild(el("span", "lcd1v-ti", t.ti || ""));
    const vy = el("span", "lcd1v-vy", t.vy || "");
    tx.appendChild(vy);
    hd.appendChild(no);
    hd.appendChild(tx);
    hd.appendChild(el("span", "lcd1v-zm", T.zmenit));
    const order = krok.querySelector(":scope > .order");
    if (order) {
      order.setAttribute("aria-hidden", "true"); // číslo živého kroku (iné číslovanie) čítačka nečíta; hlavička je button
      krok.insertBefore(hd, order.nextSibling);
    } else krok.insertBefore(hd, krok.firstChild);
    // klávesnica / čítačka: hlavička je button pod priehľadným .order (myš kliká na .order = živý akordeón)
    hd.addEventListener("click", function (e) {
      if (e.target.closest(".order")) return;
      const o = krok.querySelector(":scope > .order");
      if (o) o.click();
    });
    kroky.push({ meno: k.meno, el: krok, hd, no, vy, navstiveny: false });
  });
  const krokPodla = (meno) => kroky.find((k) => k.meno === meno) || null;
  const posledny = kroky.length ? kroky[kroky.length - 1] : null;

  // výška hlavičky -> priehľadný živý .order presne cez ňu (CSS var na kroku)
  const ro = window.ResizeObserver
    ? new ResizeObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        const krok = z.target.parentNode;
        if (!krok) return;
        const v = Math.round(z.target.getBoundingClientRect().height) + "px";
        if (krok.style.getPropertyValue("--lcd1v-hd-h") !== v) krok.style.setProperty("--lcd1v-hd-h", v);
      });
    })
    : null;
  kroky.forEach((k) => { if (ro) ro.observe(k.hd); });

  // „Pokračujte ďalej“: živé tlačidlo s textom nového vzhľadu (vzniká asynchrónne 100–400 ms po postavení krokov)
  function textyTlacidiel() {
    kroky.forEach(function (k) {
      const b = k.el.querySelector(":scope > .next-step-button");
      if (!b) return;
      // posledný krok produktu: „Pokračujte k súhrnu“ — klik zachytí handler nižšie (zatvorí krok, posunie na súhrn)
      const text = textKroku(k.meno).dalej || (k === posledny ? T.kSuhrnu : T.dalej);
      nastavAttr(b, "data-lcd1v-text", text);
      nastavAttr(b, "aria-label", text);
    });
  }

  // ---------------------------------------------------------------- nové prvky v tele krokov (podľa textov typu)
  function pridajPodnadpis(k, text) {
    if (!k || !text || k.el.querySelector(":scope > .lcd1v-pod")) return;
    const p = el("p", "lcd1v-pod", text);
    k.el.insertBefore(p, k.hd.nextSibling);
  }
  const vzor = krokPodla("vzor"), auto = krokPodla("auto"), farba = krokPodla("farba");
  kroky.forEach((k) => pridajPodnadpis(k, textKroku(k.meno).pod));

  // chybový text nad „Pokračujte ďalej“ a poznámka pod ním (krok, ktorý ich má v textoch typu) — až keď živé tlačidlo existuje
  function prvkyPriTlacidle() {
    kroky.forEach(function (k) {
      const t = textKroku(k.meno);
      if (!t.chyba && !t.pozn) return;
      const b = k.el.querySelector(":scope > .next-step-button");
      if (!b) return;
      if (t.chyba && !k.el.querySelector(":scope > .lcd1v-chyba-tx")) {
        const p = el("p", "lcd1v-chyba-tx", t.chyba);
        p.setAttribute("role", "alert");
        k.el.insertBefore(p, b);
      }
      if (t.pozn && !k.el.querySelector(":scope > .lcd1v-pozn")) k.el.insertBefore(el("p", "lcd1v-pozn", t.pozn), b.nextSibling);
    });
  }

  // krok 1: hlavička / „Zmeniť“ otvorí výber vzoru aj bez auta (návrhy). Živý validation.js má na .content-wrap klik,
  // ktorý bez vybraného auta ukáže okno „Prosím, najskôr vyberte model vášho vozidla“ — pri vzore (krok pred autom)
  // nemá zmysel. Klik na hlavičku kroku vzor preto neprejde k .content-wrap ani k document; akordeón (productPage.js:
  // ostatné kroky zavrieť, tento prepnúť cez __lcdSetStepOpen) a SELF-HEAL max-height (configuratorEngine.js) urobí tu
  // rovnako. Dlaždice vzorov (odkazy na sesterské produkty) ostávajú bez zmeny — majú vlastné delegované handlery.
  if (vzor) {
    vzor.el.addEventListener("click", function (e) {
      if (!document.body.classList.contains("lcd-1v")) return;
      const t = e.target && e.target.closest ? e.target.closest(".order, .lcd1v-hd, h5.variant.name") : null;
      if (!t || t.parentNode !== vzor.el) return;
      e.stopPropagation();
      if (t.classList.contains("lcd1v-hd")) return; // klávesnica: handler hlavičky už klikol na .order (spracované nižšie)
      e.preventDefault();
      const nastavOtvoreny = (el, on) => {
        if (typeof window.__lcdSetStepOpen === "function") window.__lcdSetStepOpen(el, on);
        else el.classList.toggle("active", on);
      };
      const otvor = !vzor.el.classList.contains("active");
      if (otvor) {
        form.querySelectorAll(".content-wrap > .position-wrap, .content-wrap > .parameter-wrap, .upsale-buttons.trunk, .upsale-buttons.boxs").forEach(function (w) {
          if (w !== vzor.el && w.classList.contains("active")) nastavOtvoreny(w, false);
        });
      }
      vzor.el.style.removeProperty("max-height");
      nastavOtvoreny(vzor.el, otvor);
      naplanuj();
    });
  }

  // krok 1: dlaždice vzorov (živé odkazy na sesterské produkty — navigácia ostáva)
  if (vzor) {
    vzor.el.querySelectorAll(".patterns-wrap > .option-button").forEach(function (a) {
      const n = bezDiakritiky((a.querySelector(".banner-header") || a).textContent + " " + a.getAttribute("href"));
      const druh = /stripe/.test(n) ? "stripe" : /hexa|hesa/.test(n) ? "hexa" : /diamon/.test(n) ? "diamond" : "";
      if (druh) a.classList.add("lcd1v-vzor-" + druh);
      // aktívny vzor = táto stránka (živé href="active" by viedlo na neexistujúcu adresu)
      a.addEventListener("click", function (e) {
        if (a.classList.contains("active")) e.preventDefault();
      });
    });
  }

  // krok 2: štítky polí auta, text prázdneho poľa, chyba poľa (CSS cez data-*)
  const polia = [];
  if (auto) {
    Object.keys(T.polia).forEach(function (kluc) {
      const wrap = auto.el.querySelector(".modl-selector-wrap .surcharge-list." + kluc);
      const select = wrap && wrap.querySelector("select");
      if (!select) return;
      const [stitok, prazdne, chyba] = T.polia[kluc];
      wrap.classList.add("lcd1v-pole");
      wrap.setAttribute("data-lcd1v-stitok", stitok);
      wrap.setAttribute("data-lcd1v-chyba", chyba);
      const sel = select.parentNode; // .selector
      if (sel) sel.setAttribute("data-lcd1v-prazdne", prazdne);
      select.setAttribute("aria-label", stitok);
      polia.push({ wrap, select });
    });
    // dlaždice volantu / miest / dverí: ovládateľné aj klávesnicou
    auto.el.querySelectorAll(".wheel-Position .option-button, .sit-Position .option-button, .door-Position .option-button").forEach(klavesnica);
  }
  // Prázdne pole = placeholder (.notselect). Auto z predošlej stránky (sessionStorage: zákazník prepol vzor alebo sa vrátil
  // na produkt) živý kód obnoví tak, že hodnotu vloží na index 0 BEZ .notselect (functions/autoVyber.js lcdPlatnaHodnota:
  // „obnovená značka/rok/typ JE platný výber“) — selectedIndex <= 0 by ho zle bral ako prázdne a pole by ostalo prekryté
  // placeholderom „Vyberte značku“, pás kompatibility skrytý a postup „Hotovo 1 z 6“.
  const prazdnePole = (s) => {
    const o = s.options[s.selectedIndex];
    return !o || s.selectedIndex < 0 || o.classList.contains("notselect") || !String(o.text || "").trim();
  };
  const autoKompletne = () => polia.length > 0 && polia.every((p) => !prazdnePole(p.select));

  // krok 3: farby — skupina (čierna s farebným šitím / jednofarebné), názov, klávesnica; náhľad pod farbami
  let nahlad = null;
  if (farba) {
    farba.el.querySelectorAll(".options-wrap > .option-button").forEach(function (b) {
      const tx = b.querySelector(".text");
      const f = nazovFarby(tx ? tx.textContent : b.textContent);
      b.classList.add(/\//.test(f.nazov) ? "lcd1v-f-sitie" : "lcd1v-f-jedno");
      b.setAttribute("data-lcd1v-nazov", f.nazov);
      b.setAttribute("data-lcd1v-vzor", f.vzor);
      b.setAttribute("title", f.nazov);
      b.setAttribute("aria-label", f.nazov);
      klavesnica(b);
    });
    nahlad = el("div", "lcd1v-nahlad");
    nahlad.hidden = true;
    nahlad.appendChild(el("b", "lcd1v-nahlad-nm"));
    const img = el("img", "lcd1v-nahlad-img");
    img.alt = "";
    img.width = 400;
    img.height = 400;
    img.decoding = "async";
    nahlad.appendChild(img);
    const ow = farba.el.querySelector(":scope > .options-wrap");
    farba.el.insertBefore(nahlad, ow ? ow.nextSibling : null);
  }

  function klavesnica(e) {
    if (e.hasAttribute("tabindex")) return;
    e.setAttribute("tabindex", "0");
    e.setAttribute("role", "button");
    e.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); e.click(); }
    });
  }

  // ---------------------------------------------------------------- pás kompatibility + postup nad krokmi
  const kompat = el("div", "lcd1v-kompat");
  kompat.hidden = true;
  const ic = el("span", "lcd1v-kompat-ic", "✓");
  ic.setAttribute("aria-hidden", "true");
  const ktx = el("span", "lcd1v-kompat-tx");
  ktx.appendChild(el("b", null, T.kompat));
  const kAuto = el("i");
  ktx.appendChild(kAuto);
  kompat.appendChild(ic);
  kompat.appendChild(ktx);
  const postup = el("div", "lcd1v-postup");
  postup.setAttribute("aria-hidden", "true");
  postup.appendChild(el("span", "lcd1v-postup-t", T.postup(spolu)));
  const pSt = el("span", "lcd1v-postup-st");
  postup.appendChild(pSt);
  const pDl = el("span", "lcd1v-postup-dl");
  kroky.forEach(() => pDl.appendChild(el("i")));
  postup.appendChild(pDl);
  cw.parentNode.insertBefore(kompat, cw);
  cw.parentNode.insertBefore(postup, cw);

  // ---------------------------------------------------------------- stav (číta živý DOM, píše len do nových prvkov a tried)
  function autoText() {
    let u = {};
    try { ["Brand", "Model", "Year", "carType"].forEach((k) => { u[k] = sessionStorage.getItem(k) || ""; }); } catch (e) { u = {}; }
    if (!u.Brand) {
      u = {};
      polia.forEach((p) => { if (!prazdnePole(p.select)) u[p.wrap.classList.contains("brands") ? "Brand" : p.wrap.classList.contains("models") ? "Model" : p.wrap.classList.contains("years") ? "Year" : "carType"] = p.select.value; });
    }
    return [[u.Brand, u.Model].filter(Boolean).join(" "), u.Year, u.carType].filter(Boolean).join(", ");
  }

  function vybrataMoznost(kluc) {
    const o = ctx.moznosti(kluc).find((x) => x.zvolena && x.hodnota);
    return o && o.cena > 0 ? o : null;
  }

  function zhrnutie(k) {
    const vlastne = k.el.getAttribute("data-lcd1v-vyber");
    if (vlastne) return vlastne;
    const t = textKroku(k.meno);
    switch (k.meno) {
      case "vzor": {
        const a = k.el.querySelector(".patterns-wrap > .option-button.active .banner-header");
        return a ? nazovVzoru(a.textContent) : t.vy;
      }
      case "auto": return autoKompletne() ? autoText() || t.vy : t.vy;
      case "farba": {
        const a = k.el.querySelector(".options-wrap > .option-button.active");
        return a ? a.getAttribute("data-lcd1v-nazov") || "" : T.farbyNaVyber(k.el.querySelectorAll(".options-wrap > .option-button").length);
      }
      case "rozlozenie": {
        const o = ctx.moznosti("rozlozenie").find((x) => x.zvolena && x.hodnota);
        return o && ctx.vyplneny(k.el) ? prveVelke(o.text) : t.vy;
      }
      case "kufor": {
        const o = vybrataMoznost("kufor");
        return o ? prveVelke(o.text) : t.vy;
      }
      case "boxy": {
        if (vybrataMoznost("box1") && vybrataMoznost("box2")) return T.dvaBoxy;
        if (vybrataMoznost("boxSolo") || vybrataMoznost("box1")) return T.jedenBox;
        return t.vy;
      }
      default: return t.vy || ""; // farba2, pocet, velkost …: modul typu píše data-lcd1v-vyber
    }
  }

  function jeHotovy(k, otv) {
    switch (k.meno) {
      case "vzor": return !!k.el.querySelector(".patterns-wrap > .option-button.active");
      case "auto": return autoKompletne() && ctx.vyplneny(k.el);
      case "farba":
      case "rozlozenie": return !!ctx.vyplneny(k.el);
      case "kufor": // nepovinné: hotové po výbere rohože alebo keď ho zákazník videl a išiel ďalej
        return !!vybrataMoznost("kufor") || (k.navstiveny && !otv);
      case "boxy": // (automatické „nechcem“ živého kódu pri „Pridať do košíka“ sa za hotový krok nepočíta)
        return !!(vybrataMoznost("boxSolo") || vybrataMoznost("box1")) || (k.navstiveny && !otv);
      default: // farba2, pocet, velkost …: rovnaké pravidlo ako validácia košíka
        return !!ctx.vyplneny(k.el);
    }
  }

  let otvorenyPred = null;
  function obnov() {
    naplanovane = false;
    textyTlacidiel();
    prvkyPriTlacidle();
    let hotovych = 0;
    let otvoreny = null;
    kroky.forEach(function (k, i) {
      const otv = k.el.classList.contains("active");
      if (otv) { k.navstiveny = true; otvoreny = otvoreny || k; }
      const hot = jeHotovy(k, otv);
      if (hot) hotovych++;
      prepni(k.el, "lcd1v-hotovy", hot);
      nastavAttr(k.hd, "aria-expanded", otv ? "true" : "false");
      nastavText(k.vy, zhrnutie(k));
      // živá validácia (.lcd-needs-fill na 3 s) -> trvalý červený rám, kým krok nie je vyplnený (zmizne hneď po doplnení)
      const vypl = jeVyplneny(k);
      if (k.el.classList.contains("lcd-needs-fill") && !vypl && !k.el.classList.contains("lcd1v-chyba")) {
        k.el.classList.add("lcd1v-chyba");
        k.el.classList.remove("lcd1v-zablesk");
        void k.el.offsetWidth; // reštart animácie
        k.el.classList.add("lcd1v-zablesk");
        if (k.meno === "auto") polia.forEach((p) => prepni(p.wrap, "lcd1v-err", prazdnePole(p.select)));
      } else if (k.el.classList.contains("lcd1v-chyba") && vypl) {
        k.el.classList.remove("lcd1v-chyba", "lcd1v-zablesk");
      }
      const dl = pDl.children[i];
      if (dl) dl.className = otv ? "o" : hot ? "h" : "";
    });
    nastavText(pSt, hotovych === kroky.length ? T.vsetko : T.hotovo(hotovych, kroky.length));
    // polia auta: prázdne / chyba
    polia.forEach(function (p) {
      const prazdne = prazdnePole(p.select);
      prepni(p.wrap, "lcd1v-prazdne", prazdne);
      if (!prazdne) prepni(p.wrap, "lcd1v-err", false);
    });
    // pás kompatibility
    const kompl = autoKompletne();
    if (kompat.hidden === kompl) kompat.hidden = !kompl;
    if (kompl) nastavText(kAuto, autoText());
    // dlaždice: aria-pressed podľa živej .active
    if (auto) auto.el.querySelectorAll(".option-wrap > .option-button").forEach((b) => nastavAttr(b, "aria-pressed", b.classList.contains("active") ? "true" : "false"));
    // náhľad farby
    if (nahlad && farba) {
      const a = farba.el.querySelector(".options-wrap > .option-button.active");
      const im = a && a.querySelector("img");
      if (a && im) {
        nastavText(nahlad.firstChild, (a.getAttribute("data-lcd1v-vzor") || "") + " — " + (a.getAttribute("data-lcd1v-nazov") || ""));
        const src = im.getAttribute("src");
        if (nahlad.lastChild.getAttribute("src") !== src) nahlad.lastChild.setAttribute("src", src);
        nahlad.lastChild.alt = a.getAttribute("data-lcd1v-nazov") || "";
        farba.el.querySelectorAll(".options-wrap > .option-button").forEach((b) => nastavAttr(b, "aria-pressed", b === a ? "true" : "false"));
      }
      if (nahlad.hidden === !!(a && im)) nahlad.hidden = !(a && im);
    }
    if (otvoreny !== otvorenyPred) {
      otvorenyPred = otvoreny;
      ctx.vysli("kroky:otvoreny", { meno: otvoreny ? otvoreny.meno : null, el: otvoreny ? otvoreny.el : null });
    }
  }
  function jeVyplneny(k) {
    if (k.meno === "auto") return autoKompletne() && ctx.vyplneny(k.el);
    return !!ctx.vyplneny(k.el);
  }

  let naplanovane = false;
  function naplanuj() {
    if (naplanovane) return;
    naplanovane = true;
    (window.requestAnimationFrame || setTimeout)(obnov);
  }

  // zmeny: triedy krokov a volieb (akordeón, výber, validácia), selecty (jQuery .trigger("change") nevyšle natívny
  // change -> delegovaný jQuery handler), nové živé prvky (tlačidlá krokov), zápis cez ctx
  const mo = new MutationObserver(naplanuj);
  kroky.forEach((k) => mo.observe(k.el, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true }));
  const $ = window.jQuery || window.$;
  if ($) $(form).on("change", "select", naplanuj);
  else form.addEventListener("change", naplanuj);
  document.addEventListener("click", function () { setTimeout(naplanuj, 60); });
  document.addEventListener("LuxuryCarPriceRecalculated", naplanuj);
  ctx.na("zmena", naplanuj);
  // tlačidlá krokov pridáva productPage.js asynchrónne; configurator-enhance prerába DOM ~24 s
  ctx.ked(() => cw.querySelector(".next-step-button"), naplanuj, { limit: 15000 });

  // ---------------------------------------------------------------- pokus prejsť ďalej bez auta
  // Michal 16. 10. 2026: „verifikácia by sa nemala vyvolať, až keď klikne na Pokračovať a niečo nemá vybraté — tak mu
  // zvýrazni, čo nevybral.“ Klik zákazníka na hlavičku alebo voľbu karty ZA kartou auta, kým auto nie je úplné, = to
  // isté ako „Pokračujte ďalej“ v karte auta (configuratorEngine.js lcdOverKrok): žiadna výzva (validation.js pod 1V
  // mlčí), nič sa neodznačí, otvorená ostane len karta auta, chýbajúce polia sú červené (obnov(): .lcd-needs-fill ->
  // lcd1v-chyba + lcd1v-err) a stránka ide na prvé z nich. Hlavička: klik ďalej nepustíme (živý akordeón by kartu
  // otvoril a auto zavrel; capture na document = pred .content-wrap aj delegovanými handlermi). Voľba: výber dobehne
  // (živé handlery), až potom prechod na auto. Len skutočné kliky (isTrusted) — programové kliky modulov (prenos,
  // rozloženie, ctx.zapis) idú bez zdržania. „Pokračujte ďalej“ kariet rieši engine sám (prvý nevyplnený krok = auto);
  // vzor (karta pred autom) a karta auta bez zmeny. Auto úplné = nič sa nemení.
  const zaAutom = auto ? kroky.slice(kroky.indexOf(auto) + 1) : [];
  if (zaAutom.length) {
    document.addEventListener("click", function (e) {
      const t = e.target;
      if (!e.isTrusted || !t || !t.closest || !document.body.classList.contains("lcd-1v")) return;
      const k = zaAutom.find((x) => x.el.contains(t));
      if (!k || t.closest(".next-step-button")) return;
      const h = t.closest(".order, .lcd1v-hd, h5, .variant.name");
      const hlavicka = h && h.parentNode === k.el;
      if (!hlavicka && !t.closest(".option-button, .upsale-button, button, a[href], [role='button'], select, input, label")) return;
      if (!lcdOverKrok(auto.el, true)) return;
      if (hlavicka) {
        e.preventDefault();
        e.stopImmediatePropagation();
        lcdOverKrok(auto.el);
      } else {
        setTimeout(function () { lcdOverKrok(auto.el); }, 0);
      }
    }, true);
  }

  // ---------------------------------------------------------------- posun stránky pri akordeóne
  // Zatvorenie dlhého otvoreného kroku nad kliknutým by kliknutú hlavičku vytlačilo hore mimo obrazovky
  // (desktop živý kód scroll nerieši). Hlavička: podržať na mieste. „Pokračujte ďalej“: nový krok pod hlavičku webu.
  function vyskaHlavicky() {
    const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
    for (let i = 0; i < sels.length; i++) {
      const e = document.querySelector(sels[i]);
      if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight;
    }
    return 0;
  }
  function posun(y) {
    if (Math.abs(y) < 2) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + y), behavior: "instant" });
  }
  document.addEventListener("click", function (e) {
    const t = e.target;
    if (!t || !t.closest) return;
    const hlavicka = t.closest(".lcd1v-krok > .order, .lcd1v-krok > .lcd1v-hd");
    const dalej = !hlavicka && t.closest(".lcd1v-krok > .next-step-button");
    const k = (hlavicka || dalej) && kroky.find((x) => x.el === (hlavicka || dalej).parentNode);
    if (!k) return;
    const pred = k.el.getBoundingClientRect().top;
    setTimeout(function () {
      if (document.querySelector(".overflow") || document.querySelector(".lcd-needs-fill")) return; // výzva / validácia posúva sama
      if (hlavicka) {
        posun(k.el.getBoundingClientRect().top - pred);
        return;
      }
      const o = kroky.find((x) => x.el.classList.contains("active"));
      if (!o || o === k) return;
      const hH = vyskaHlavicky();
      const top = o.el.getBoundingClientRect().top;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (top < hH + 8 || top > hH + (vh - hH) * 0.5) posun(top - hH - 12);
    }, 0);
  }, true);

  // Posledný krok „Pokračujte k súhrnu“ (návrh v26 krok 6; rohož krok 3 farba, box krok 3 veľkosť): živé tlačidlo
  // posledného kroku (finish-button) by hneď vkladalo do košíka — tesne nad „Spolu“ a „Vložte do košíka“ by tak boli
  // dve zelené tlačidlá košíka. Pod 1V krok len zatvorí a posunie stránku na súhrn s tlačidlom košíka; kontrolu výberu
  // (červený rám, posun na chýbajúci krok) robí to tlačidlo ako doteraz.
  // Zachytené v capture fáze na document -> handlery živého tlačidla (delegované aj priame) nebežia.
  const selPosledny = posledny ? ".lcd1v-k-" + posledny.meno + " > .next-step-button" : null;
  document.addEventListener("click", function (e) {
    const t = e.target;
    const b = selPosledny && t && t.closest && t.closest(selPosledny);
    if (!b || !document.body.classList.contains("lcd-1v")) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const k = posledny;
    if (k) {
      k.navstiveny = true;
      if (typeof window.__lcdSetStepOpen === "function") window.__lcdSetStepOpen(k.el, false);
      else k.el.classList.remove("active");
    }
    const ciel = document.querySelector(".lcd1v-suhrn") || ctx.krok("kosik");
    if (ciel) setTimeout(function () { ciel.scrollIntoView({ block: "center", behavior: "smooth" }); }, 30);
    naplanuj();
  }, true);

  obnov();
  ctx.vysli("kroky:hotovo", { kroky: kroky.map((k) => ({ meno: k.meno, el: k.el })) });
}
