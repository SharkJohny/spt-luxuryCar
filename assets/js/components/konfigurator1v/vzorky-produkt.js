// Nový vzhľad vzorkovníka 637 (typ „vzorky“) podľa návrhu navrhy/vzorkovnik.html (T4.2, opravený 14. 10. 2026 podľa
// rozhodnutia.md „Doplnené ~01:50“). VLASTNÍK: T5.1 + assets/css/_lcd1v-vzorky.scss + tools/test-1v/ovladac-vzorky.mjs
// (novy) + tools/test-1v/scenare-vzorky.mjs. Texty: typy/vzorky.js (ctx.texty("vzorky")).
// Beží len pod body.lcd-1v (brána v index.js; do vydania typu len ?novy=vyvoj). Pravidlá: docs/1v-kontrakt.md.
//
// Živý vzorkovník: 45 príplatkových selectov (1 vzorka = 1 parameter, data-parameter-name = kód „D-3“, „S-1“, „LUX-10“ alebo celý názov s kódom v zátvorke),
// voľby „Nechcem +€0“ / „Áno +€5“, nevybraná vzorka = prázdna hodnota (ako živý widget assets/js/vzorky-konfigurator).
// Čo robí (všetko nové je bez name, živý DOM ostáva — widget, tabuľka parametrov a krátky popis sú len skryté CSS):
//  - hlavička: štítok „Vzorkovník“, nadpis návrhu len vizuálne (živý H1 ostáva v DOM pre SEO aj čítačku), hodnotenie;
//  - cena „Každá vzorka €5 · Vratná záloha“ = príplatok voľby „Áno“ zo Shoptetu (nič natvrdo) + pás „Zálohu dostanete späť“;
//  - 4 kroky = série živého widgetu (Diamond, Stripe, Hexa, druhá vrstva Lux) s dlaždicami: fotka, názov farby doslovne
//    zo živej stránky (popis parametra) a kód. Objednať sa dá PRESNE to, čo živý widget (manifest swatch-data.js
//    orderable + select vo formulári) — ostatné vzorky série sú „Len náhľad“ (dnes Lux okrem LUX-10);
//  - klik na vzorku = ctx.zapis(<id parametra>, „Áno“ | ""), nič iné; súhrn = ctx.cena() (Shoptet);
//  - krok potvrdený bez vzorky = preskočený (nie zelený); postup píše počet vzoriek, nikdy „Všetko vybrané“;
//  - „Vybrané vzorky“ (fotka, názov, kód, cena, odobrať), „Spolu“, živé tlačidlo košíka s textom „Vyberte vzorky“ /
//    „Vložte do košíka“; pri 0 vzorkách sa do košíka NEPOŠLE nič (capture na document zastaví klik aj submit) a otvorí
//    sa 1. krok s červeným rámom. Lepivá lišta na telefóne (ako cena.js).
import { VZORKY_SERIES, VZORKY_ITEMS } from "../../vzorky-konfigurator/swatch-data.js";
import { posunNaStred, vyskaHlavicky, plynulo } from "./posun.js";
// riadok hodnotenia drží miesto od prvého snímku (Úloha H, 25. 10. 2026) — rovnako ako cena.js
import { zastupHodn, staryFaqPocasObsahu } from "./cena.js";

export const MENO = "vzorky-produkt";

const LOKALNE = {
  sk: { vysvetlenie: "Vysvetlenie", vzorka: "Vzorka", nahlad: "Náhľad" },
  cz: { vysvetlenie: "Vysvětlení", vzorka: "Vzorek", nahlad: "Náhled" },
};

/** Kód vzorky z data-parameter-name živého selectu: holý („D-3“, „S-1“, „H-2“, „LUX-10“) alebo na konci celého názvu
 *  „Vzorka Diamond – Čierna prešívaná čiernou (D-3)“ (tak je v admine od 22. 10. 2026; starý widget číta rovnako, idFromText). */
const KOD = /^(?:.*\()?((?:S|H|D|LUX)-\d+)\)?$/;
/** Voľba „chcem vzorku“ (SK „Áno +€5“, starší text „Chcem – vratná záloha 5 €“); „Nechcem“ nie. */
const ANO = /^(áno|ano|chcem|chci)\b/i;
/** Telefón a tablet: lepivá lišta (rovnaká hranica ako cena.js a košík). */
const MOBIL = "(max-width: 991px)";
const HORE = 70;

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}
function nastav(e, t) {
  if (e && e.textContent !== t) e.textContent = t;
}
function prepni(e, trieda, stav) {
  if (e && e.classList.contains(trieda) !== !!stav) e.classList.toggle(trieda, !!stav);
}
function attr(e, meno, hodnota) {
  if (!e) return;
  if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
  else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
}
/** 1 -> slova[0], 2–4 -> slova[1], inak slova[2] */
function tvar(n, slova) {
  return n === 1 ? slova[0] : n >= 2 && n <= 4 ? slova[1] : slova[2];
}

/** Názov vzorky doslovne zo živej stránky: popis parametra „Pridať vzorku … – <názov> [D-3] do objednávky…“. */
function nazovZoStranky(form, idParametra, kod) {
  const lb = form.querySelector('label[for="surcharge-parameter-id-' + idParametra + '"]');
  const tip = lb && lb.querySelector(".show-tooltip, [data-original-title], [title]");
  const t = tip ? tip.getAttribute("title") || tip.getAttribute("data-original-title") || tip.getAttribute("data-bs-original-title") || "" : "";
  const m = /[–—-]\s*(.+?)\s*\[\s*([A-Z]+-\d+)\s*\]/.exec(t.replace(/\s+/g, " "));
  if (m && m[2] === kod && m[1].trim()) return m[1].trim();
  const z = VZORKY_ITEMS[kod];
  return z && z.label ? String(z.label).replace(/\s+—\s+/g, " – ") : kod;
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const T = ctx.texty("vzorky");
  const L = LOKALNE[ctx.trh] || LOKALNE.sk;
  if (!T || !T.serie) throw new Error("texty vzorkovníka chýbajú (typy/vzorky.js)");
  const form = ctx.form();
  const kos = ctx.krok("kosik");
  const stlpec = form && form.querySelector(".p-info-wrapper");
  const doKos = kos && kos.closest(".add-to-cart");
  if (!form || !stlpec || !kos || !doKos || doKos.parentNode !== stlpec) throw new Error("chýba formulár, stĺpec .p-info-wrapper alebo tlačidlo košíka");
  const body = document.body;
  const povodne = { text: kos.textContent, aria: kos.getAttribute("aria-label") };
  const vlozene = [];
  const spat = [];
  let zruseny = false;

  // ---------------------------------------------------------------- vzorky zo živého formulára
  /** kód -> { kod, id (data-parameter-id), select, ano (value „Áno“), cena, nazov } */
  const vz = {};
  form.querySelectorAll("select.surcharge-parameter[data-parameter-name]").forEach(function (s) {
    const m = KOD.exec((s.getAttribute("data-parameter-name") || "").trim());
    const kod = m && m[1];
    const id = s.getAttribute("data-parameter-id");
    if (!kod || !id || vz[kod]) return;
    const moz = ctx.moznosti(id);
    const ano = moz.find((o) => ANO.test(o.text)) || null;
    vz[kod] = { kod, id, select: s, ano: ano ? ano.hodnota : null, cena: ano ? ano.cena : 0, nazov: nazovZoStranky(form, id, kod) };
  });
  if (!Object.keys(vz).length) throw new Error("vzorky (príplatky s kódom D-/S-/H-/LUX-) vo formulári nie sú");
  /** Objednateľná = to isté pravidlo ako živý widget: manifest orderable a select s voľbou „Áno“. */
  const objednatelna = (kod) => !!(vz[kod] && vz[kod].ano) && (VZORKY_ITEMS[kod] || {}).orderable !== false;
  const zvolena = (kod) => !!(vz[kod] && vz[kod].ano && vz[kod].select.value === vz[kod].ano);
  const obrazok = (kod) => (VZORKY_ITEMS[kod] && VZORKY_ITEMS[kod].img) || "";
  const nazov = (kod) => (vz[kod] ? vz[kod].nazov : (VZORKY_ITEMS[kod] && VZORKY_ITEMS[kod].label) || kod);
  // neobjednateľná vzorka, ktorú Shoptet predsa ponúka, sa do objednávky nedostane (živý widget robí to isté)
  Object.keys(vz).forEach(function (kod) {
    if (!objednatelna(kod) && vz[kod].select.value) ctx.zapis(vz[kod].id, "");
  });

  // ceny: príplatok „Áno“ zo Shoptetu (dnes 5 € pri každej vzorke)
  const ceny = Object.keys(vz).filter(objednatelna).map((k) => vz[k].cena).filter((c) => c > 0);
  const cenaVzorky = ceny.length ? Math.min.apply(null, ceny) : 0;
  const rovnakaCena = ceny.every((c) => c === cenaVzorky);
  const cenaT = ctx.formatCena(cenaVzorky);

  // série v poradí návrhu (= poradie živého widgetu), len tie, v ktorých sa dá niečo objednať
  const serie = Object.keys(T.serie).map(function (kluc) {
    const man = VZORKY_SERIES.find((s) => s.key === kluc);
    const vsetky = (man && man.ids ? man.ids : Object.keys(vz).filter((k) => (VZORKY_ITEMS[k] || {}).series === kluc)).filter((k) => vz[k] || obrazok(k));
    const obj = vsetky.filter(objednatelna);
    const nahlady = vsetky.filter((k) => !objednatelna(k) && obrazok(k));
    const cfg = T.serie[kluc];
    let skupiny;
    if (cfg.skupiny) {
      const pouzite = new Set();
      skupiny = cfg.skupiny.map(function (g) {
        const idcka = g.idcka.filter((k) => vsetky.indexOf(k) > -1 && (objednatelna(k) || obrazok(k)));
        idcka.forEach((k) => pouzite.add(k));
        return { nadpis: g.nadpis, idcka };
      }).filter((g) => g.idcka.length);
      const zvysok = vsetky.filter((k) => !pouzite.has(k) && (objednatelna(k) || obrazok(k)));
      if (zvysok.length) {
        if (skupiny.length) skupiny[skupiny.length - 1].idcka = skupiny[skupiny.length - 1].idcka.concat(zvysok);
        else skupiny.push({ nadpis: "", idcka: zvysok });
      }
    } else {
      skupiny = [{ nadpis: T.objednanieSkupina, idcka: obj }];
      if (nahlady.length) skupiny.push({ nadpis: T.nahladSkupina, idcka: nahlady, nahlad: true });
    }
    return { kluc, cfg, nm: cfg.nm || (man && man.title) || kluc, obj, nahlady, skupiny };
  }).filter((s) => s.obj.length);
  if (!serie.length) throw new Error("vzorkovník nemá žiadnu objednateľnú vzorku");

  // ---------------------------------------------------------------- hlavička: štítok, nadpis (vizuálne), hodnotenie
  const hlavicka = stlpec.querySelector(":scope > .p-detail-inner-header");
  const h1 = hlavicka && hlavicka.querySelector("h1");
  if (h1) {
    const typ = el("p", "lcd1v-typ", T.typ);
    hlavicka.insertBefore(typ, h1);
    vlozene.push(typ);
    const nadpis = el("div", "lcd1v-vz-nazov");
    nadpis.setAttribute("aria-hidden", "true"); // čítačka číta živý H1
    nadpis.appendChild(document.createTextNode(T.nazov[0] + " "));
    nadpis.appendChild(el("em", null, T.nazov[1]));
    h1.parentNode.insertBefore(nadpis, h1.nextSibling);
    vlozene.push(nadpis);
    const hodn = el("a", "lcd1v-hodn");
    hodn.href = "#";
    // Úloha H (25. 10. 2026): miesto riadka rezervované neviditeľne (data-lcd1v-caka, zástupné prvky), nie hidden — po
    // príchode dát LCD_REVIEWS hlavička nenarastie; bez dát miesto ostane (zdôvodnenie v cena.js)
    zastupHodn(hodn);
    hodn.addEventListener("click", function (e) {
      e.preventDefault();
      const nova = document.querySelector('.p1v-miesto [data-lcd-sekcia$="recenzie"]');
      const w = nova && nova.getClientRects().length ? nova : document.querySelector(".lcd-reviews-widget");
      if (!w) return;
      window.scrollTo({ top: w.getBoundingClientRect().top + window.pageYOffset - 90, behavior: plynulo() ? "smooth" : "auto" });
    });
    nadpis.parentNode.insertBefore(hodn, nadpis.nextSibling);
    vlozene.push(hodn);
    ctx.ked(function () {
      const p = window.LCD_REVIEWS && window.LCD_REVIEWS.place;
      return p && Number(p.rating) > 0 && Number(p.totalReviews) > 0 ? p : null;
    }, function (p) {
      if (zruseny) return;
      const r = Number(p.rating), n = Math.round(Number(p.totalReviews));
      const rt = r.toFixed(1).replace(".", ",");
      const hviezdy = Math.max(0, Math.min(5, Math.round(r)));
      hodn.textContent = "";
      hodn.appendChild(el("b", null, rt));
      const st = el("span", "lcd1v-hodn__st", "★★★★★".slice(0, hviezdy) + "☆☆☆☆☆".slice(0, 5 - hviezdy));
      st.setAttribute("aria-hidden", "true");
      hodn.appendChild(st);
      hodn.appendChild(el("i", null, n + " " + tvar(n, T.recenzie) + " " + T.naGoogle));
      hodn.setAttribute("aria-label", T.hodnotenie + " " + rt + " " + T.z5 + " – " + n + " " + tvar(n, T.recenzie) + " " + T.naGoogle);
      hodn.removeAttribute("data-lcd1v-caka");
    }, { limit: 30000 });
  }

  // ---------------------------------------------------------------- cena vzorky + vrátenie zálohy
  const karta = el("div", "lcd1v-vz-cena");
  karta.appendChild(el("span", "lcd1v-vz-cena__stitok", T.cena.stitok));
  const sumaVzorky = el("b", "lcd1v-vz-cena__suma", (rovnakaCena ? "" : "od ") + cenaT);
  karta.appendChild(sumaVzorky);
  const pozn = el("p", "lcd1v-vz-cena__pozn");
  const zal = el("span", "lcd1v-vz-cena__zal");
  zal.appendChild(el("b", null, T.cena.zaloha));
  const info = el("button", "lcd1v-vz-info", "i");
  info.type = "button";
  info.setAttribute("aria-label", T.cena.infoAria);
  info.setAttribute("aria-expanded", "false");
  zal.appendChild(info);
  pozn.appendChild(zal);
  const bod = el("span", "lcd1v-vz-cena__bod", "·");
  bod.setAttribute("aria-hidden", "true");
  pozn.appendChild(bod);
  pozn.appendChild(el("span", "lcd1v-vz-cena__za", T.cena.za));
  karta.appendChild(pozn);
  const tip = el("p", "lcd1v-vz-tip", T.cena.info(cenaT));
  tip.id = "lcd1v-vz-tip";
  tip.hidden = true;
  info.setAttribute("aria-controls", tip.id);
  karta.appendChild(tip);
  info.addEventListener("click", function (e) {
    e.preventDefault();
    tip.hidden = !tip.hidden;
    info.setAttribute("aria-expanded", String(!tip.hidden));
  });

  const hint = el("button", "lcd1v-vz-hint");
  hint.type = "button";
  hint.setAttribute("aria-expanded", "false");
  const hIc = el("span", "lcd1v-vz-hint__ic");
  hIc.setAttribute("aria-hidden", "true");
  hIc.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
  const hTx = el("span", "lcd1v-vz-hint__t");
  hTx.appendChild(el("b", null, T.vratenie.nadpis));
  hTx.appendChild(el("span", null, T.vratenie.text));
  hint.appendChild(hIc);
  hint.appendChild(hTx);
  hint.appendChild(el("span", "lcd1v-vz-hint__go", T.vratenie.go));
  const vratenie = el("div", "lcd1v-vz-vratenie");
  vratenie.id = "lcd1v-vz-vratenie";
  vratenie.hidden = true;
  hint.setAttribute("aria-controls", vratenie.id);
  const vrZoz = el("ol", "lcd1v-vz-vratenie__zoz");
  T.vratenie.kroky.forEach((x) => vrZoz.appendChild(el("li", null, x)));
  vratenie.appendChild(vrZoz);
  vratenie.appendChild(el("p", null, T.vratenie.zaver));
  const vrOdkaz = el("a", "lcd1v-vz-vratenie__a", T.vratenie.odkaz);
  vrOdkaz.href = T.vratenie.url;
  vratenie.appendChild(vrOdkaz);
  hint.addEventListener("click", function (e) {
    e.preventDefault();
    // sekcia o vrátení pod konfigurátorom (obsah, ďalšia vlna) -> posun; kým nie je, rozbalí sa popis tu
    const sekcia = document.querySelector('#vratenie, .p1v-miesto [data-lcd-sekcia$="vratenie"]');
    if (sekcia && sekcia.getClientRects().length) {
      window.scrollTo({ top: sekcia.getBoundingClientRect().top + window.pageYOffset - vyskaHlavicky() - 12, behavior: plynulo() ? "smooth" : "auto" });
      return;
    }
    vratenie.hidden = !vratenie.hidden;
    hint.setAttribute("aria-expanded", String(!vratenie.hidden));
  });
  const zaHlavickou = hlavicka && hlavicka.parentNode === stlpec ? hlavicka.nextSibling : stlpec.firstChild;
  [karta, hint, vratenie].forEach(function (x) { stlpec.insertBefore(x, zaHlavickou); vlozene.push(x); });

  // ---------------------------------------------------------------- kroky (série) + postup
  const koren = el("div", "lcd1v-vz-kroky");
  const postup = el("div", "lcd1v-postup");
  postup.setAttribute("aria-hidden", "true");
  postup.appendChild(el("span", "lcd1v-postup-t", T.postup(serie.length)));
  const postupSt = el("span", "lcd1v-postup-st");
  postup.appendChild(postupSt);
  const postupDl = el("span", "lcd1v-postup-dl");
  serie.forEach(() => postupDl.appendChild(el("i")));
  postup.appendChild(postupDl);
  koren.appendChild(postup);

  /** @type {{ s: any, el: HTMLElement, hd: HTMLElement, vy: HTMLElement, dlazdice: HTMLElement[], nahlad: HTMLElement, potvrdeny: boolean }[]} */
  const kroky = [];
  const dlazdicaPodlaKodu = {};
  serie.forEach(function (s, i) {
    const krok = el("div", "lcd1v-krok lcd1v-vz-krok");
    krok.setAttribute("data-lcd1v-vz-seria", s.kluc);
    const hd = el("button", "lcd1v-hd");
    hd.type = "button";
    hd.setAttribute("aria-expanded", "false");
    const no = el("span", "lcd1v-no", String(i + 1));
    no.setAttribute("aria-hidden", "true");
    const tx = el("span", "lcd1v-tx");
    tx.appendChild(el("span", "lcd1v-ey", T.krokNz(i + 1, serie.length) + " · " + s.nm));
    tx.appendChild(el("span", "lcd1v-nm", s.nm));
    tx.appendChild(el("span", "lcd1v-ti", T.ti));
    const vy = el("span", "lcd1v-vy");
    tx.appendChild(vy);
    hd.appendChild(no);
    hd.appendChild(tx);
    hd.appendChild(el("span", "lcd1v-zm", T.zmenit));
    krok.appendChild(hd);

    const pod = el("p", "lcd1v-pod", s.cfg.pod || "");
    krok.appendChild(pod);
    if (s.cfg.info) {
      const ib = el("button", "lcd1v-vz-info", "i");
      ib.type = "button";
      ib.setAttribute("aria-label", L.vysvetlenie);
      ib.setAttribute("aria-expanded", "false");
      pod.appendChild(document.createTextNode(" "));
      pod.appendChild(ib);
      const vysv = el("p", "lcd1v-vz-vysv");
      vysv.id = "lcd1v-vz-vysv-" + s.kluc;
      vysv.hidden = true;
      if (s.cfg.infoNadpis) { vysv.appendChild(el("b", null, s.cfg.infoNadpis)); vysv.appendChild(document.createTextNode(" ")); }
      vysv.appendChild(document.createTextNode(s.cfg.infoNadpis && s.cfg.info.indexOf(s.cfg.infoNadpis) === 0 ? s.cfg.info.slice(s.cfg.infoNadpis.length).trim() : s.cfg.info));
      ib.setAttribute("aria-controls", vysv.id);
      ib.addEventListener("click", function (e) {
        e.preventDefault();
        vysv.hidden = !vysv.hidden;
        ib.setAttribute("aria-expanded", String(!vysv.hidden));
      });
      krok.appendChild(vysv);
    }

    const dlazdice = [];
    const skupinyEl = el("div", "lcd1v-vz-skupiny");
    s.skupiny.forEach(function (g) {
      const sk = el("div", "lcd1v-vz-skup" + (g.nahlad ? " lcd1v-vz-skup--nahlad" : ""));
      if (g.nadpis) {
        const fn = el("p", "lcd1v-vz-fnad");
        fn.appendChild(el("span", null, g.nadpis));
        fn.appendChild(el("b", null, String(g.idcka.length)));
        sk.appendChild(fn);
      }
      const farby = el("div", "lcd1v-vz-farby");
      g.idcka.forEach(function (kod) {
        const obj = objednatelna(kod);
        const nm = nazov(kod);
        const b = el("button", "lcd1v-vz-dl" + (obj ? "" : " lcd1v-vz-dl--nahlad"));
        b.type = "button";
        b.setAttribute("data-kod", kod);
        if (obj) {
          b.setAttribute("aria-pressed", "false");
          b.setAttribute("aria-label", L.vzorka + " " + kod + " — " + nm);
          b.title = kod + " · " + nm;
        } else {
          b.setAttribute("aria-disabled", "true");
          b.setAttribute("aria-label", L.nahlad + " " + kod + " — " + nm + T.nahladSuffix);
          b.title = kod + " · " + nm + T.nahladSuffix;
        }
        const sw = el("span", "lcd1v-vz-sw");
        const src = obrazok(kod);
        if (src) {
          const img = el("img", "lcd1v-vz-img");
          img.src = src;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          sw.appendChild(img);
        }
        if (!obj) sw.appendChild(el("span", "lcd1v-vz-tag", T.nahladTag));
        b.appendChild(sw);
        b.appendChild(el("span", "lcd1v-vz-nm", nm));
        b.appendChild(el("span", "lcd1v-vz-kd", kod));
        farby.appendChild(b);
        dlazdice.push(b);
        if (obj) dlazdicaPodlaKodu[kod] = b;
      });
      sk.appendChild(farby);
      skupinyEl.appendChild(sk);
    });
    krok.appendChild(skupinyEl);
    if (s.nahlady.length) {
      const posielame = s.obj.length === 1 ? (/^LUX-/.test(s.obj[0]) ? "Lux " + Number(s.obj[0].slice(4)) : s.obj[0]) : "";
      krok.appendChild(el("p", "lcd1v-vz-npozn", T.nahladPozn(posielame)));
    }
    const nahlad = el("div", "lcd1v-nahlad");
    nahlad.hidden = true;
    nahlad.appendChild(el("p", "lcd1v-nahlad-nm", s.nm));
    const nImg = el("img", "lcd1v-nahlad-img");
    nImg.alt = "";
    nImg.decoding = "async";
    nahlad.appendChild(nImg);
    krok.appendChild(nahlad);
    krok.appendChild(el("p", "lcd1v-chyba-tx", T.chyba));
    const dalej = el("button", "lcd1v-vz-dalej", i === serie.length - 1 ? T.kSuhrnu : T.dalej);
    dalej.type = "button";
    krok.appendChild(dalej);
    koren.appendChild(krok);
    kroky.push({ s, el: krok, hd, vy, dlazdice, nahlad, potvrdeny: false });
  });
  // poradie v stĺpci rieši CSS (order 3 = medzi skrytou tabuľkou parametrov a skrytým živým widgetom)
  const host = stlpec.querySelector(":scope > .lcd-vz-host");
  stlpec.insertBefore(koren, host || doKos);
  vlozene.push(koren);

  // ---------------------------------------------------------------- vybrané vzorky, „Spolu“ (nad živým tlačidlom)
  const vyber = el("div", "lcd1v-vz-vyber");
  const vyberHd = el("p", "lcd1v-vz-vyber__hd");
  vyberHd.appendChild(el("span", null, T.vyber.nadpis));
  const pocetEl = el("b", "lcd1v-vz-pocet nula", "0");
  vyberHd.appendChild(pocetEl);
  vyber.appendChild(vyberHd);
  const prazdne = el("p", "lcd1v-vz-prazdne", T.vyber.prazdne);
  vyber.appendChild(prazdne);
  const zoz = el("ul", "lcd1v-vz-zoz");
  vyber.appendChild(zoz);
  const suhrn = el("div", "lcd1v-suhrn lcd1v-vz-suhrn");
  suhrn.appendChild(el("span", "lcd1v-suhrn__lb", T.spolu));
  const suhrnSuma = el("b", "lcd1v-suhrn__suma");
  suhrnSuma.setAttribute("aria-live", "polite");
  suhrnSuma.setAttribute("aria-atomic", "true");
  suhrn.appendChild(suhrnSuma);
  const sumPozn = el("p", "lcd1v-vz-sumpozn");
  [vyber, suhrn, sumPozn].forEach(function (x) { stlpec.insertBefore(x, doKos); vlozene.push(x); });

  // ---------------------------------------------------------------- lepivá lišta (telefón)
  const lista = el("div", "lcd1v-lista lcd1v-vz-lista");
  lista.id = "lcd1v-lista";
  const listaC = el("div", "lcd1v-lista__c");
  const listaSuma = el("b", "lcd1v-lista__suma");
  const listaPopis = el("small", "lcd1v-lista__popis");
  listaC.appendChild(listaSuma);
  listaC.appendChild(listaPopis);
  const listaKos = el("button", "lcd1v-lista__kos");
  listaKos.type = "button";
  listaKos.addEventListener("click", function (e) {
    e.preventDefault();
    if (pocet() === 0) { chybaBezVzorky(); return; }
    ctx.doKosika(); // živé tlačidlo: odoslanie robí živý kód
  });
  lista.appendChild(listaC);
  lista.appendChild(listaKos);
  document.body.appendChild(lista);
  vlozene.push(lista);

  // ---------------------------------------------------------------- stav
  /** kódy vybraných vzoriek v poradí výberu (nové na koniec, odobraté preč) */
  let poradie = [];
  function vybrane() {
    const teraz = [];
    serie.forEach((s) => s.obj.forEach((k) => { if (zvolena(k)) teraz.push(k); }));
    poradie = poradie.filter((k) => teraz.indexOf(k) > -1).concat(teraz.filter((k) => poradie.indexOf(k) < 0));
    return poradie.slice();
  }
  function pocet() {
    return serie.reduce((n, s) => n + s.obj.filter(zvolena).length, 0);
  }

  function zapnute() {
    if (zruseny) return false;
    if (!body.classList.contains("lcd-1v")) { zrus(); return false; }
    return true;
  }
  function zrus() {
    if (zruseny) return;
    zruseny = true;
    vlozene.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    spat.forEach((f) => { try { if (f) f(); } catch (e) { /* nič */ } });
    if (kos.textContent !== povodne.text) kos.textContent = povodne.text;
    if (povodne.aria == null) kos.removeAttribute("aria-label");
    else kos.setAttribute("aria-label", povodne.aria);
    kos.removeAttribute("data-lcd1v-vz-pocet");
    body.classList.remove("lcd1v-lista-on", "lcd1v-bublina");
  }

  let snimok = 0, snimokListy = 0;
  const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn) => setTimeout(fn, 16);
  function naplanuj() {
    if (snimok) return;
    snimok = raf(function () { snimok = 0; obnov(); });
  }
  function naplanujListu() {
    if (snimokListy || snimok) return;
    snimokListy = raf(function () { snimokListy = 0; obnovListu(); });
  }

  function obnov() {
    if (!zapnute()) return;
    const vyb = vybrane();
    const n = vyb.length;
    // kroky: zhrnutie, hotový (má vzorku) / preskočený (potvrdený bez vzorky), dlaždice
    kroky.forEach(function (k) {
      const kody = k.s.obj.filter(zvolena);
      prepni(k.el, "lcd1v-hotovy", kody.length > 0);
      prepni(k.el, "lcd1v-vz-preskoceny", !kody.length && k.potvrdeny);
      let t;
      if (kody.length > 4) t = T.vybranych + kody.length + " " + tvar(kody.length, T.tvar);
      else if (kody.length) t = T.vybrane + kody.join(", ");
      else if (k.potvrdeny) t = T.bezVzorky;
      else t = k.s.obj.length + " " + tvar(k.s.obj.length, T.tvar) + " " + T.naVyber;
      nastav(k.vy, t);
      k.dlazdice.forEach(function (b) {
        const kod = b.getAttribute("data-kod");
        if (b.getAttribute("aria-disabled") === "true") return;
        const on = zvolena(kod);
        prepni(b, "on", on);
        attr(b, "aria-pressed", String(on));
      });
      if (n) prepni(k.el, "lcd1v-chyba", false);
    });
    // postup: zelený = séria so vzorkou, zlatý = otvorený, svetlý = preskočený, sivý = čaká
    const dl = postupDl.children;
    kroky.forEach(function (k, i) {
      const c = k.el.classList.contains("active") ? "o" : k.el.classList.contains("lcd1v-hotovy") ? "h" : k.el.classList.contains("lcd1v-vz-preskoceny") ? "p" : "";
      if (dl[i] && dl[i].className !== c) dl[i].className = c;
    });
    nastav(postupSt, n ? T.stav(n, tvar(n, T.tvar)) : T.stavNula);
    // vybrané vzorky
    nastav(pocetEl, String(n));
    prepni(pocetEl, "nula", !n);
    prazdne.hidden = !!n;
    const kluc = vyb.join(",");
    if (zoz.getAttribute("data-kody") !== kluc) {
      zoz.setAttribute("data-kody", kluc);
      zoz.textContent = "";
      vyb.forEach(function (kod) {
        const s = serie.find((x) => x.obj.indexOf(kod) > -1);
        const li = el("li");
        li.setAttribute("data-kod", kod);
        const f = el("span", "lcd1v-vz-zoz__f");
        if (obrazok(kod)) f.style.backgroundImage = 'url("' + obrazok(kod) + '")';
        f.setAttribute("aria-hidden", "true");
        const t = el("span", "lcd1v-vz-zoz__t");
        t.appendChild(el("b", null, nazov(kod)));
        t.appendChild(el("i", null, kod + " · " + (s ? s.nm : "")));
        const c = el("span", "lcd1v-vz-zoz__c", ctx.formatCena(vz[kod].cena));
        const x = el("button", "lcd1v-vz-zoz__x", "×");
        x.type = "button";
        x.setAttribute("aria-label", T.vyber.odobrat + kod);
        x.addEventListener("click", function (e) {
          e.preventDefault();
          zapis(kod, false);
        });
        li.appendChild(f);
        li.appendChild(t);
        li.appendChild(c);
        li.appendChild(x);
        zoz.appendChild(li);
      });
    }
    // súhrn = Shoptet (ctx.cena: základ produktu + zvolené príplatky)
    const spolu = ctx.formatCena(ctx.cena().spolu);
    nastav(suhrnSuma, spolu);
    nastav(listaSuma, spolu);
    nastav(sumPozn, T.pozn(n, cenaT));
    nastav(listaPopis, T.lista(n, tvar(n, T.tvar), cenaT));
    const stitok = n ? T.vlozte : T.vyberte;
    nastav(kos, stitok);
    attr(kos, "aria-label", stitok);
    attr(kos, "data-lcd1v-vz-pocet", String(n));
    nastav(listaKos, stitok);
    obnovListu();
  }

  // lišta: zapnutá, keď je celý stĺpec konfigurátora (od názvu po tlačidlo košíka) mimo obrazovky (ako cena.js)
  const mobil = window.matchMedia ? window.matchMedia(MOBIL) : { matches: false };
  let listaOn = false;
  function obnovListu() {
    if (!zapnute()) return;
    let on = false;
    if (mobil.matches) {
      const a = stlpec.getBoundingClientRect();
      const b = doKos.getBoundingClientRect();
      const spodok = b.height > 0 ? b.bottom : a.bottom;
      on = spodok < HORE || a.top > window.innerHeight;
    }
    if (on !== listaOn) {
      listaOn = on;
      lista.classList.toggle("on", on);
      body.classList.toggle("lcd1v-lista-on", on);
    }
    const f = document.querySelector('iframe[title="Luxia chat"]');
    const r = f && f.getBoundingClientRect();
    const bublina = !!(r && r.height > 0 && r.height <= 130);
    if (body.classList.contains("lcd1v-bublina") !== bublina) body.classList.toggle("lcd1v-bublina", bublina);
  }

  // ---------------------------------------------------------------- zápis voľby (JEDINÁ cesta: ctx.zapis)
  function zapis(kod, chcem) {
    const v = vz[kod];
    if (!v || !objednatelna(kod)) return null;
    const r = ctx.zapis(v.id, chcem ? v.ano : "");
    naplanuj();
    return r;
  }

  function ukazNahlad(k, kod, lenNahlad) {
    const nm = k.nahlad.querySelector(".lcd1v-nahlad-nm");
    const img = k.nahlad.querySelector(".lcd1v-nahlad-img");
    nastav(nm, kod + " · " + nazov(kod) + (lenNahlad ? T.nahladSuffix : ""));
    const src = obrazok(kod);
    if (src && img.getAttribute("src") !== src) img.src = src;
    img.alt = (lenNahlad ? L.nahlad : L.vzorka) + " " + kod + " — " + nazov(kod);
    k.nahlad.hidden = !src;
  }

  koren.addEventListener("click", function (e) {
    const b = e.target.closest && e.target.closest(".lcd1v-vz-dl");
    if (!b || !koren.contains(b)) return;
    e.preventDefault();
    const kod = b.getAttribute("data-kod");
    const k = kroky.find((x) => x.dlazdice.indexOf(b) > -1);
    if (b.getAttribute("aria-disabled") === "true") { if (k) ukazNahlad(k, kod, true); return; }
    const chcem = !zvolena(kod);
    zapis(kod, chcem);
    if (k && chcem) ukazNahlad(k, kod, false);
  });

  // ---------------------------------------------------------------- akordeón (jeden otvorený), posun stránky
  // Hlavička: kliknutá ostane na mieste. „Pokračujte ďalej“ / „Pokračujte k súhrnu“ (Michal 24. 10. 2026): ďalší krok
  // / súhrn VŽDY plynulo do stredu viditeľnej plochy (posun.js, ako kroky.js; vyšší krok vrchom pod hlavičku webu).
  function posun(y) {
    if (Math.abs(y) < 2) return;
    window.scrollTo({ top: Math.max(0, window.pageYOffset + y), behavior: "instant" });
  }
  function otvor(index) {
    kroky.forEach(function (k, i) {
      const on = i === index;
      prepni(k.el, "active", on);
      k.hd.setAttribute("aria-expanded", String(on));
    });
    naplanuj();
  }
  kroky.forEach(function (k, i) {
    k.hd.addEventListener("click", function (e) {
      e.preventDefault();
      const pred = k.el.getBoundingClientRect().top;
      if (k.el.classList.contains("active")) otvor(-1);
      else otvor(i);
      posun(k.el.getBoundingClientRect().top - pred); // kliknutá hlavička ostane na mieste
    });
    k.el.querySelector(".lcd1v-vz-dalej").addEventListener("click", function (e) {
      e.preventDefault();
      k.potvrdeny = true;
      if (i < kroky.length - 1) {
        otvor(i + 1);
        posunNaStred(kroky[i + 1].el);
        return;
      }
      // posledný krok: „Pokračujte k súhrnu“ — nič do košíka, len zatvoriť a ukázať súhrn s tlačidlom
      otvor(-1);
      posunNaStred(suhrn);
    });
  });

  // ---------------------------------------------------------------- košík pri 0 vzorkách: nič neposlať
  function chybaBezVzorky() {
    const k = kroky[0];
    otvor(0);
    prepni(k.el, "lcd1v-chyba", true);
    k.el.classList.remove("lcd1v-zablesk");
    if (plynulo()) { void k.el.offsetWidth; k.el.classList.add("lcd1v-zablesk"); setTimeout(() => k.el.classList.remove("lcd1v-zablesk"), 1800); }
    const hH = vyskaHlavicky();
    setTimeout(function () {
      window.scrollTo({ top: Math.max(0, k.el.getBoundingClientRect().top + window.pageYOffset - hH - 14), behavior: plynulo() ? "smooth" : "auto" });
    }, 30);
  }
  function jeKosik(t) {
    const b = t && t.closest && t.closest("button.add-to-cart-button, #js-plugin-fixed-header-add-to-cart");
    return !!(b && (form.contains(b) || b.id === "js-plugin-fixed-header-add-to-cart"));
  }
  // capture na document: beží pred živými handlermi košíka (Shoptet, configuratorEngine) aj pred odoslaním formulára
  function naKlik(e) {
    if (!zapnute() || !jeKosik(e.target) || pocet() > 0) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    chybaBezVzorky();
  }
  function naOdoslanie(e) {
    if (!zapnute() || e.target !== form || pocet() > 0) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  document.addEventListener("click", naKlik, true);
  document.addEventListener("submit", naOdoslanie, true);
  spat.push(() => { document.removeEventListener("click", naKlik, true); document.removeEventListener("submit", naOdoslanie, true); });

  // zmeny selectov odinakiaľ (Shoptet, živý widget, späť v prehliadači) -> prekresliť
  const $ = window.jQuery || window.$;
  if ($) $(form).on("change.lcd1vvz", "select.surcharge-parameter", naplanuj);
  form.addEventListener("change", naplanuj, true);
  spat.push(() => { if ($) $(form).off("change.lcd1vvz"); form.removeEventListener("change", naplanuj, true); });
  const odhlas = ctx.na("zmena", naplanuj);
  spat.push(odhlas);
  document.addEventListener("LuxuryCarPriceRecalculated", naplanuj);
  window.addEventListener("scroll", naplanujListu, { passive: true });
  window.addEventListener("resize", naplanujListu);
  if (mobil.addEventListener) mobil.addEventListener("change", naplanuj);
  const interval = setInterval(function () { if (zapnute() && listaOn) obnovListu(); }, 1000);
  spat.push(() => clearInterval(interval));
  // starý blok FAQ v stĺpci skrytý, kým sa vkladá obsah z CDN (Úloha H, 25. 10. 2026; cena.js staryFaqPocasObsahu)
  spat.push(staryFaqPocasObsahu(ctx, zapnute));

  otvor(0);
  obnov();
  // index.js zloží body.lcd-1v synchrónne po init všetkých modulov, ak niektorý zlyhal -> hneď späť na starý vzhľad
  setTimeout(zapnute, 0);
}
