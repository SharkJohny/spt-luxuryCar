// Nový konfigurátor 1V — kroky 5–6 (rohož do kufra Classic / Premium / Nechcem, boxy 1× / 2× / Nechcem + farba a veľkosti).
// Set autokobercov: jednovrstvové kroky 5–6, dvojvrstvové 6–7 (len typy s modulom „kufor-boxy“, produkty.js TYPY).
// JADRO od T0.1 (14. 10. 2026; mení len vydanie) + assets/css/_lcd1v-kufor-boxy.scss + tools/test-1v/ovladac-kufor-boxy.mjs
// (+ assets/js/lcdKosikDoplnok.js: ponuka v košíku neponúkne, čo už je v sete).
// Texty: TEXTY nižšie (návrh v26) + prepisy typu ctx.texty("kuforBoxy"); fotky kariet: ctx.obrazokVzoru(<kľúč>).
// „Nechcem“ pri kufri pošle to isté ako starý web (voľbu „nie“). Keď má „nie“ v admine príplatok (610 Hexa: +5 €,
// rozhodnutia.md D2), karta ukáže tú cenu a bez výberu nie je žiadna karta označená — cena na stránke = cena v košíku.
// Beží len pod body.lcd-1v (brána v index.js). Pravidlá: docs/1v-kontrakt.md — DOM sa nemaže, voľby len ctx.zapis().
//
// Ako:
// - Karty kufra a počtu boxov sú NOVÉ tlačidlá (type=button, bez name -> nejdú do POST) vložené do živých krokov
//   .upsale-buttons.trunk / .boxs; živé karty ostanú v DOM, len ich CSS skryje. Klik = ctx.zapis(), teda klik na živú
//   kartu (productPage.js updateUpsale -> select.val().trigger("change"), livePrice, validácia).
// - Okno boxov je ŽIVÝ .box-config (farba, veľkosti, validácia lcdHandleBoxConfig ostávajú), len preštýlovaný na okno
//   podľa návrhu (#bxBox) + doplnený nadpis, popisky a tlačidlo „Potvrďte výber boxov“ (klikne živé „potvrdiť“).
// - Chyba G10b z návrhu (box zavretý krížikom ostal označený, ale cena ho nezapočítala) sa nedá zopakovať: stav kariet sa
//   vždy číta zo živých selectov; krížik / pozadie / Esc pri novom výbere = živé „zrušiť“ (všetko späť na Nechcem),
//   pri úprave už potvrdeného výberu = zavrieť, len ak je výber úplný. Označený box bez farby/veľkosti pri zavretom okne
//   sa do 0,7 s vráti na Nechcem.
// - Zmena počtu boxov (1 <-> 2) ide cez živé „zrušiť“: inak by veľkosť druhého počtu ostala aktívna a priceActualization
//   by ju pri ďalšom kliku vrátila do formulára (box navyše v cene). Farba boxov sa prenesie.
// - Ceny: v sete zo selectov Shoptetu (ctx.moznosti), „Samostatne“ zo živých stránok samostatných produktov tým istým
//   kódom ako porovnanie v košíku (lcdKosikDoplnok.samostatneCenyKonfigurator). Nič natvrdo.
// - Vzhľad karty (Michal 15. 10. 2026, návrh E v navrhy-naj): odporúčaná karta má široký zlatý pás
//   „★ Najobjednávanejšie ★“ s vetou pod ním, krémové pozadie a zlatú žiaru; karta Nechcem má väčšie texty.
// - Ceny na karte v riadkoch „Samostatne / Výhoda v sete / V sete“ (Michal 18. 10. 2026: „chcel som, aby tie dlaždice
//   mali takto tie texty“ — vzhľad pred návrhom E, verzia d582a33; cenovka s veľkou cenou a pilulkou Ušetríte preč).
// - Poradie kariet (Michal 15. 10. 2026: „obľúbená varianta vždy v strede“): kufor Premium, Classic (★), Nechcem; boxy
//   1×, 2× (★), Nechcem. Mení sa len poradie NOVÝCH kariet v DOM; živé karty, ich poradie a hodnoty v POST ostávajú.
import { samostatneCenyKonfigurator, samostatneBoxy } from "../../lcdKosikDoplnok.js";
import { zluc } from "./produkty.js";
import { nazovFarby, popisFarby } from "./kroky.js";
import { definicieKresby, kresba, nastavFarbuKresby, zrusFarbuKresby, slugFarby } from "./box-kresba.js";
import { prelozTextyCz } from "./texty-cz.js";

export const MENO = "kufor-boxy";

// Kresba boxu v kartách veľkostí okna (box-kresba.js, ako krok 3 na boxe 616; Michal 18. 10. 2026: veľkosti a farby boxov
// premietnuť aj do konfigurátora autokobercov). Vlastná predpona ID vzorov (jedna sada na stránke, defs v okne).
const PREDPONA_KRESBY = "lcd1v-bxk-";

// Texty z návrhu v26 (jednovrstvove.html, kroky 5–6 a okno #bxBox). Typ ich môže prepísať (typy/<typ>.js texty.kuforBoxy).
const TEXTY = {
  naj: "★ Najobjednávanejšie ★",
  samostatne: "Samostatne",
  vyhoda: "Výhoda v sete",
  // cenovka na karte kufra/boxu: ostáva „V sete“ aj po pravidle Michala 16. 10. 2026 (v zákazníckom texte vždy, kam
  // produkt patrí) — karta je krok konfigurátora autokobercov pod sedadlá, set = práve zostavované autokoberce; štítok
  // nad veľkou cenou (VERZÁLKY, 11 px) má pri 360 px vedľa fotky ~170 px, „V sete s autokobercami“ by sa zalomil
  vSete: "V sete",
  vCene: "v cene",
  od: "od",
  az: "až",
  info: "Vysvetlenie",
  kufor: {
    skupina: "Rohož do kufra",
    veta: "Zákazníci si ju vyberajú najčastejšie",
    pod: "Len na dno kufra alebo aj na boky a operadlá.",
    vysv: [["Na dno kufra", " chráni podlahu batožinového priestoru. "], ["Na dno a boky", " obalí aj bočné steny a prah — nič sa nedostane do čalúnenia, keď naložíte niečo mokré alebo špinavé."]],
    classic: { nm: "Classic", po: "Na dno kufra", alt: "Rohož do kufra Classic", kluc: "kufor-classic", obr: "kufor-boxy-classic.jpg", popis: "Rohož do kufra Classic" },
    premium: { nm: "Premium", po: "Na dno, boky aj operadlá", alt: "Rohož do kufra Premium", kluc: "kufor-premium", obr: "kufor-boxy-premium.jpg", popis: "Rohož do kufra Premium" },
    nie: { nm: "Nechcem", po: "Bez rohože do kufra", ben: "Kufor necháte tak, ako\u00a0je.", alt: "Kufor bez rohože", kluc: "kufor-nie", obr: "kufor-boxy-bez-rohoze.jpg", popis: "Bez rohože do kufra" },
  },
  boxy: {
    skupina: "Boxy do kufra",
    veta: "Zákazníci si ich vyberajú najčastejšie",
    pod: "Skladacie boxy z rovnakého materiálu. Veľkosť a farbu zvolíte hneď po výbere.",
    1: { nm: "1× box", po: "Praktický organizér", alt: "Jeden box v kufri", kluc: "boxy-1", obr: "kufor-boxy-1-box.jpg" },
    2: { nm: "2× box", po: "Dvojitá kapacita", alt: "Dva boxy v kufri", kluc: "boxy-2", obr: "kufor-boxy-2-boxy.jpg" },
    0: { nm: "Nechcem", po: "Kufor bez organizérov", ben: "Kufor ostane voľný.", alt: "Kufor bez boxov", kluc: "boxy-0", obr: "kufor-boxy-premium.jpg", popis: "Bez boxov" },
  },
  okno: {
    nadpis: "Vaše boxy do kufra",
    zavriet: "Zavrieť",
    pod1: "Vyberte farbu a veľkosť boxu.",
    pod2: "Vyberte farbu a veľkosť oboch boxov.",
    farba: "Farba boxov",
    // pod vzorkami: vybraná farba slovami (kroky.js popisFarby, text zo živého selectu), kým nie je vybraná, nie je vidno
    vybranaFarba: "Vybraná farba:",
    velkost: { boxSolo: "Veľkosť boxu", box1: "Veľkosť 1. boxu", box2: "Veľkosť 2. boxu" },
    najcastejsie: "Najčastejšie",
    potvrdit: "Potvrďte výber boxov",
    chybaFarba: "Vyberte prosím farbu boxov.",
    chybaVelkost: "Vyberte prosím veľkosť boxu.",
  },
};
const TEXTY_CZ = prelozTextyCz(TEXTY);

// „Najčastejšie“ pri veľkosti ako v návrhu: 1 box -> L, 2 boxy -> 1. box M, 2. box L
const NAJCASTEJSIE = { boxSolo: "L", box1: "M", box2: "L" };
const VELKOSTI = ["S", "M", "L", "XL"];

function el(tag, attrs, deti) {
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    const v = attrs[k];
    if (v == null || v === false) return;
    if (k === "text") e.textContent = v;
    else e.setAttribute(k, v === true ? "" : v);
  });
  (deti || []).forEach(function (d) { if (d != null) e.appendChild(typeof d === "string" ? document.createTextNode(d) : d); });
  return e;
}

/** „M : 40x32x30 cm“ -> { v: "M", rozmer: "40 × 32 × 30 cm", sirka: 40 }; ŽIADNY a iné -> null (sirka = prvé číslo, pre kresbu) */
export function velkostZTextu(t) {
  const m = /^(XL|S|M|L)\s*:\s*(.*)$/i.exec(String(t == null ? "" : t).replace(/\s+/g, " ").trim());
  if (!m) return null;
  const s = /^(\d+(?:[.,]\d+)?)/.exec(m[2]);
  return { v: m[1].toUpperCase(), rozmer: m[2].replace(/\s*[x×]\s*/gi, " × ").trim(), sirka: s ? Number(s[1].replace(",", ".")) : null };
}

/** „Farba kože : Čierna / Farba šitia: Červená“ -> „Čierna / Červená“ (súhrn kroku) */
export function kratkaFarba(t) {
  return String(t == null ? "" : t).replace(/\s+/g, " ").replace(/(farba|barva)\s+(kože|kůže|šitia|šití)\s*:\s*/gi, "").trim();
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  ctx.ked(function () {
    const kufor = ctx.krok("kufor"), boxy = ctx.krok("boxy"), vyber = ctx.krok("boxyVyber");
    if (!kufor || !boxy || !vyber) return null;
    if (kufor.querySelectorAll(":scope > .parameter-cars > .upsale-button").length < 3) return null;
    if (boxy.querySelectorAll(":scope > .parameter-cars > .upsale-button[value]").length < 3) return null;
    const pf = ctx.parameter("farbaBoxov");
    if (!pf || !ctx.parameter("kufor") || !ctx.parameter("boxSolo") || !ctx.parameter("box1") || !ctx.parameter("box2")) return null;
    if (!vyber.querySelector(".parameter-wrap.parameter-" + pf.id + " .option-button")) return null;
    if (!vyber.querySelector(":scope > .close-btn.return") || !vyber.querySelector(":scope > .close-btn.close")) return null;
    return { kufor, boxy, vyber };
  }, function (k) {
    const vytvorene = [];
    try {
      postav(ctx, k, vytvorene);
    } catch (e) {
      // poistka ako v index.js: radšej starý vzhľad celého konfigurátora než napoly postavené kroky 5–6
      vytvorene.forEach(function (x) { try { x(); } catch (y) {} });
      ctx.chyby.push(MENO + ": " + ((e && e.message) || e));
      document.body.classList.remove("lcd-1v");
      console.error("[lcd-1v] " + MENO, e);
    }
  }, { limit: 15000 });
}

function postav(ctx, { kufor, boxy, vyber }, vytvorene) {
  const T = zluc(ctx.trh === "cz" ? TEXTY_CZ : TEXTY, ctx.texty ? ctx.texty("kuforBoxy") : {});
  const banner = kufor.closest(".upsale-Banner");
  if (!banner) throw new Error("kufor mimo .upsale-Banner");
  const fmt = function (n) { return ctx.formatCena(Math.round(n * 100) / 100); };
  const stav = { sam: null, nove: false, otvorene: false, predFokus: null, vyberText: null, hojenie: null, zvolene: {}, posunute: false };
  const vloz = function (rodic, uzol, pred) {
    rodic.insertBefore(uzol, pred || null);
    vytvorene.push(function () { uzol.remove(); });
    return uzol;
  };
  const trieda = function (e, t) {
    if (e.classList.contains(t)) return;
    e.classList.add(t);
    vytvorene.push(function () { e.classList.remove(t); });
  };
  const atribut = function (e, a, v) {
    const pred = e.getAttribute(a);
    e.setAttribute(a, v);
    vytvorene.push(function () { if (pred == null) e.removeAttribute(a); else e.setAttribute(a, pred); });
  };

  // ---------------------------------------------------------------- možnosti zo Shoptetu
  const mk = ctx.moznosti("kufor");
  const kv = {
    classic: mk.find(function (o) { return /dno/i.test(o.text) && !/bok/i.test(o.text); }) || null,
    premium: mk.find(function (o) { return /bok/i.test(o.text); }) || null,
    nie: mk.find(function (o) { return /^(nie|ne)\b/i.test(o.text); }) || null,
  };
  if (!kv.classic || !kv.premium) throw new Error("kufor: Classic/Premium v selecte nie sú");
  // „nie“ s príplatkom v admine (610 Hexa +5 €, D2): ukázať cenu, poslať ako starý web, bez výberu nič neoznačiť
  const niePlatene = !!(kv.nie && kv.nie.cena > 0.5);
  const velkosti = function (kluc) {
    const o = {};
    ctx.moznosti(kluc).forEach(function (m) {
      const x = velkostZTextu(m.text);
      if (x && !o[x.v]) o[x.v] = { hodnota: m.hodnota, cena: m.cena, rozmer: x.rozmer, sirka: x.sirka };
    });
    return o;
  };
  const vel = { boxSolo: velkosti("boxSolo"), box1: velkosti("box1"), box2: velkosti("box2") };
  ["boxSolo", "box1", "box2"].forEach(function (k) { if (!vel[k].S) throw new Error("boxy: veľkosť S v " + k + " nie je"); });
  const idParam = function (kluc) { return ctx.parameter(kluc).id; };
  const velkostVyberu = function (kluc) {
    const v = ctx.precitaj(kluc);
    const o = v ? ctx.moznosti(kluc).find(function (m) { return m.hodnota === v; }) : null;
    const x = o && velkostZTextu(o.text);
    return x ? x.v : null;
  };

  // ---------------------------------------------------------------- karty
  // ceny v riadkoch: „Samostatne … / Výhoda v sete − … (zelená) / V SETE …“ (riadky Samostatne a Výhoda až po načítaní
  // cien samostatných produktov a len keď je samostatná cena vyššia)
  function riadky() {
    return el("span", { class: "lcd1v-kb__ucet" }, [
      el("span", { class: "lcd1v-kb__r lcd1v-kb__r--samo", hidden: true }, [el("span", { class: "lcd1v-kb__rn", text: T.samostatne }), el("span", { class: "lcd1v-kb__rh" })]),
      el("span", { class: "lcd1v-kb__r lcd1v-kb__r--zl", hidden: true }, [el("span", { class: "lcd1v-kb__rn", text: T.vyhoda }), el("span", { class: "lcd1v-kb__rh" })]),
      el("span", { class: "lcd1v-kb__r lcd1v-kb__r--sum" }, [el("span", { class: "lcd1v-kb__rn", text: T.vSete }), el("span", { class: "lcd1v-kb__rh" })]),
    ]);
  }
  function karta(def, data, naj, veta) {
    const tx = el("span", { class: "lcd1v-kb__tx" }, [el("span", { class: "lcd1v-kb__nm", text: def.nm }), el("span", { class: "lcd1v-kb__po", text: def.po })]);
    if (def.ben) {
      tx.appendChild(el("span", { class: "lcd1v-kb__ben", text: def.ben }));
      tx.appendChild(el("span", { class: "lcd1v-kb__cn", text: T.vCene }));
    } else tx.appendChild(riadky());
    return el("button", Object.assign({ type: "button", class: "lcd1v-kb__karta" + (naj ? " lcd1v-kb__karta--naj" : "") + (def.ben ? " lcd1v-kb__karta--nie" : ""), "aria-pressed": "false" }, data), [
      naj ? el("span", { class: "lcd1v-kb__top" }, [T.naj, veta ? el("span", { class: "lcd1v-kb__veta", text: veta }) : null]) : null,
      el("span", { class: "lcd1v-kb__fot" }, [el("img", { src: (def.kluc && ctx.obrazokVzoru && ctx.obrazokVzoru(def.kluc)) || ctx.obrazok(def.obr), alt: def.alt, loading: "lazy", decoding: "async", width: "480", height: "360" })]),
      tx,
    ]);
  }
  function vysvetlenie(id, casti) {
    const telo = el("div", { class: "lcd1v-kb__vysv", id: id, hidden: true });
    casti.forEach(function (c) { telo.appendChild(el("b", { text: c[0] })); telo.appendChild(document.createTextNode(c[1])); });
    return telo;
  }

  // krok 5: kufor
  const zivyKufor = kufor.querySelector(":scope > .parameter-cars");
  const infoK = el("button", { type: "button", class: "lcd1v-kb__info", "aria-label": T.info, "aria-expanded": "false", "aria-controls": "lcd1v-kb-vysv-kufor", text: "i" });
  const vysvK = vysvetlenie("lcd1v-kb-vysv-kufor", T.kufor.vysv);
  const kartyK = {
    classic: karta(T.kufor.classic, { "data-kufor": "classic" }, true, T.kufor.veta),
    premium: karta(T.kufor.premium, { "data-kufor": "premium" }, false),
    nie: karta(T.kufor.nie, { "data-kufor": "nie" }, false),
  };
  if (niePlatene) {
    const cn = kartyK.nie.querySelector(".lcd1v-kb__cn");
    if (cn) cn.textContent = "+ " + fmt(kv.nie.cena);
  }
  const kbK = el("div", { class: "lcd1v-kb", "data-lcd1v-kb": "kufor" }, [
    el("p", { class: "lcd1v-kb__pod" }, [T.kufor.pod + " ", infoK]),
    vysvK,
    el("div", { class: "lcd1v-kb__volby", role: "group", "aria-label": T.kufor.skupina }, [kartyK.premium, kartyK.classic, kartyK.nie]), // ★ Classic v strede
  ]);
  vloz(kufor, kbK, zivyKufor.nextSibling);

  // krok 6: počet boxov
  const zivyBoxy = boxy.querySelector(":scope > .parameter-cars");
  const kartyB = {
    1: karta(T.boxy[1], { "data-boxy": "1" }, false),
    2: karta(T.boxy[2], { "data-boxy": "2" }, true, T.boxy.veta),
    0: karta(T.boxy[0], { "data-boxy": "0" }, false),
  };
  const kbB = el("div", { class: "lcd1v-kb", "data-lcd1v-kb": "boxy" }, [
    el("p", { class: "lcd1v-kb__pod", text: T.boxy.pod }),
    el("div", { class: "lcd1v-kb__volby", role: "group", "aria-label": T.boxy.skupina }, [kartyB[1], kartyB[2], kartyB[0]]), // ★ 2× box v strede
  ]);
  vloz(boxy, kbB, zivyBoxy.nextSibling);

  // ---------------------------------------------------------------- okno boxov (živý .box-config)
  const xBtn = el("button", { type: "button", class: "lcd1v-bx__x", "aria-label": T.okno.zavriet, text: "×" });
  const nadpisId = "lcd1v-bx-nadpis";
  const podOkna = el("p", { class: "lcd1v-bx__pod", text: T.okno.pod1 });
  vloz(vyber, el("div", { class: "lcd1v-bx__hd" }, [el("h3", { class: "lcd1v-bx__nadpis", id: nadpisId, text: T.okno.nadpis }), xBtn]), vyber.firstChild);
  vloz(vyber, podOkna, vyber.children[1]);
  const okBtn = el("button", { type: "button", class: "lcd1v-bx__ok", text: T.okno.potvrdit });
  // päta okna prilepená dole (CSS sticky): „Potvrďte výber boxov“ vidno vždy, netreba k nemu rolovať — na iPhone prvé
  // ťuknutie počas dobehu / odskoku rolovania okna len zastavilo rolovanie a klik neprešiel (Michal 26. 10. 2026)
  const pata = el("div", { class: "lcd1v-bx__pata" }, [okBtn]);
  vloz(vyber, pata, null);
  atribut(vyber, "role", "dialog");
  atribut(vyber, "aria-modal", "true");
  atribut(vyber, "aria-labelledby", nadpisId);
  atribut(vyber, "aria-hidden", "true");
  // PC (od 1025 px) beží na celom webe plynulé rolovanie Lenis (lcdHome.js) a koliesko myši posielalo celej stránke —
  // okno sa nedalo rolovať a „Potvrďte výber boxov“ ostalo pod okrajom (Michal 22. 10. 2026). Okno roluje samo.
  atribut(vyber, "data-lenis-prevent", "");
  // iPhone / iPad (všetky prehliadače na iOS sú Safari WebKit; iPadOS sa hlási ako Mac s dotykom): pri zbalenej spodnej
  // lište Safari končí okno nad lištou (_lcd1v-kufor-boxy.scss, .lcd1v-bx--ios, variant B — Michal 30. 10. 2026), pod
  // „Potvrďte výber boxov“ je 20 px bielej a pod oknom stmavená stránka. Príčina „treba ťuknúť 2×“ (Michal 26. a 29. 10.
  // 2026): zákazník je pri kroku 7 dole na dlhej stránke, Safari má spodnú lištu zbalenú a pás pri spodku obrazovky patrí
  // jej — prvé ťuknutie do tlačidla (stred 48 px nad spodkom) stránka vôbec nedostala, len rozbalilo lištu. e2ea795 to
  // riešil vyššou pätou, ale pripočítal aj env(safe-area-inset-bottom): snímka 30. 10. = 162 px bielej pod tlačidlom
  // (20 + env 34 + 108; 108 = 92 lišta dole + 16 adresa hore, env sa k tomu nesmie sčítať). Test: okno-poloha-ios,
  // okno-jeden-tuk.
  const uaIos = navigator.userAgent || "";
  if (/\biP(hone|ad|od)\b/.test(uaIos) || (/\bMacintosh\b/.test(uaIos) && navigator.maxTouchPoints > 1)) trieda(vyber, "lcd1v-bx--ios");

  const idF = idParam("farbaBoxov");
  const wrapFarby = vyber.querySelector(".parameter-wrap.parameter-" + idF);
  const ovladacePopis = []; // [prvok, aria-label]
  // vybraná farba slovami pod vzorkami (Michal 19. 10. 2026: béžové šitie na malej vzorke vyzerá ako žlté/biele)
  const farbaNazov = el("b", { class: "lcd1v-bx__farba-nm" });
  const farbaPopis = el("p", { class: "lcd1v-bx__farba-popis", "aria-live": "polite", hidden: true }, [el("span", { class: "lcd1v-bx__farba-l", text: T.okno.vybranaFarba }), " ", farbaNazov]);
  if (wrapFarby) {
    const ow = wrapFarby.querySelector(":scope > .options-wrap");
    vloz(wrapFarby, el("p", { class: "lcd1v-bx__nadp", text: T.okno.farba }), ow);
    vloz(wrapFarby, el("p", { class: "lcd1v-bx__chyba", role: "alert", text: T.okno.chybaFarba }), ow ? ow.nextSibling : null);
    vloz(wrapFarby, farbaPopis, ow ? ow.nextSibling : null); // medzi vzorkami a chybovou vetou
    trieda(wrapFarby, "lcd1v-bx-farby");
    wrapFarby.querySelectorAll(".option-button").forEach(function (b) {
      const t = b.querySelector(".text");
      ovladacePopis.push([b, kratkaFarba(t ? t.textContent.replace(/\s*\+\s*(?:€|Kč|CZK)?\s*[\d\s.,]+\s*(?:€|Kč|CZK)?\s*$/i, "") : "")]);
    });
  }
  ["boxSolo", "box1", "box2"].forEach(function (kluc) {
    const id = idParam(kluc);
    const w = vyber.querySelector(".parameter-wrap.parameter-" + id);
    if (!w) return;
    trieda(w, "lcd1v-bx-velk");
    atribut(w, "data-lcd1v-bx-kluc", kluc);
    const ow = w.querySelector(":scope > .options-wrap");
    vloz(w, el("p", { class: "lcd1v-bx__nadp", text: T.okno.velkost[kluc] }), ow);
    vloz(w, el("p", { class: "lcd1v-bx__chyba", role: "alert", text: T.okno.chybaVelkost }), ow ? ow.nextSibling : null);
    const s = vel[kluc].S;
    w.querySelectorAll(".option-button").forEach(function (b) {
      const v = VELKOSTI.find(function (x) { return vel[kluc][x] && vel[kluc][x].hodnota === b.getAttribute("data-value"); });
      if (!v) return;
      const o = vel[kluc][v];
      const pripl = o.cena - s.cena;
      // kresba boxu v skutočnom pomere šírky namiesto zlatého štvorčeka; písmeno ostáva ako text pod ňou (ako na 616)
      vloz(b, el("span", { class: "lcd1v-bx__vel", "aria-hidden": "true" }, [
        kresba(o.sirka, PREDPONA_KRESBY),
        el("span", { class: "lcd1v-bx__vl", text: v }),
        el("span", { class: "lcd1v-bx__rozmer", text: o.rozmer }),
        el("span", { class: "lcd1v-bx__pripl" + (pripl > 0.5 ? "" : " lcd1v-bx__pripl--v-cene"), text: pripl > 0.5 ? "+ " + fmt(pripl) : T.vCene }),
        NAJCASTEJSIE[kluc] === v ? el("span", { class: "lcd1v-bx__topv", text: T.okno.najcastejsie }) : null,
      ]), null);
      ovladacePopis.push([b, v + ", " + o.rozmer + ", " + (pripl > 0.5 ? "+ " + fmt(pripl) : T.vCene)]);
    });
  });
  // vzory kresby: jedna sada v okne (premenné farby --bxp-* sú na okne, vzory ich dedia podľa miesta v DOM)
  vloz(vyber, definicieKresby(PREDPONA_KRESBY), pata);
  vytvorene.push(function () { zrusFarbuKresby(vyber); });
  /**
   * Farba kresby = farba boxov zvolená v okne (živý select), bez farby predvolená (Michal 18. 10. 2026); popis pod
   * vzorkami = tá istá voľba slovami (bez voľby skrytý).
   */
  function farbaKresby() {
    const v = ctx.precitaj("farbaBoxov");
    const fo = v ? ctx.moznosti("farbaBoxov").find(function (m) { return m.hodnota === v; }) : null;
    nastavFarbuKresby(vyber, fo ? slugFarby(nazovFarby(fo.text).nazov) : null);
    const popis = fo ? popisFarby(fo.text) : "";
    if (popis) text(farbaNazov, popis);
    if (farbaPopis.hidden !== !popis) farbaPopis.hidden = !popis;
  }
  // živé ovládače okna (div) -> prístupné ako tlačidlá: rola, fokus, Enter/medzerník = ten istý klik
  ovladacePopis.forEach(function (x) {
    atribut(x[0], "role", "button");
    atribut(x[0], "tabindex", "0");
    if (x[1]) atribut(x[0], "aria-label", x[1]);
  });
  const naKlavesu = function (e) {
    const b = e.target && e.target.closest && e.target.closest(".lcd1v-bx-farby .option-button, .lcd1v-bx-velk .option-button");
    if (!b || !vyber.contains(b) || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    b.click();
  };
  vyber.addEventListener("keydown", naKlavesu);
  vytvorene.push(function () { vyber.removeEventListener("keydown", naKlavesu); });
  // veľkosti, ktoré zákazník v tomto otvorení okna sám zvolil (predvolené S sa neráta) -> posunKTlacidlu
  const naVelkost = function (e) {
    const w = e.target && e.target.closest && e.target.closest(".lcd1v-bx-velk .option-button") && e.target.closest(".lcd1v-bx-velk");
    if (w && vyber.contains(w)) stav.zvolene[w.getAttribute("data-lcd1v-bx-kluc")] = true;
  };
  vyber.addEventListener("click", naVelkost, true); // capture: živý handler voľby môže zastaviť bublanie
  vytvorene.push(function () { vyber.removeEventListener("click", naVelkost, true); });

  const pozadie = el("div", { class: "lcd1v-bx-pozadie", "aria-hidden": "true" });
  document.body.appendChild(pozadie);
  vytvorene.push(function () { pozadie.remove(); });

  trieda(banner, "lcd1v-kb");
  trieda(kufor, "lcd1v-kb-kufor");
  trieda(boxy, "lcd1v-kb-boxy");

  // ---------------------------------------------------------------- stav zo živého DOM
  function pocetBoxov() {
    const a = boxy.querySelector(":scope > .parameter-cars > .upsale-button.active");
    const v = a && a.getAttribute("value");
    return v === "conf1" ? 1 : v === "conf2" ? 2 : 0;
  }
  function klucePoctu(n) { return n === 1 ? ["boxSolo"] : n === 2 ? ["box1", "box2"] : []; }
  function kompletne(n) {
    return !!ctx.precitaj("farbaBoxov") && klucePoctu(n).every(function (k) { return !!velkostVyberu(k); });
  }
  // "classic" | "premium" | "nie" | "" (nič nezvolené a „nie“ má príplatok — žiadna karta nie je označená)
  function druhKufra() {
    const v = ctx.precitaj("kufor");
    if (v && v === kv.classic.hodnota) return "classic";
    if (v && v === kv.premium.hodnota) return "premium";
    if (niePlatene && v !== kv.nie.hodnota) return "";
    return "nie";
  }
  function klikZivy(sel) {
    const b = vyber.querySelector(":scope > " + sel);
    if (b) b.click();
    return !!b;
  }

  // ---------------------------------------------------------------- ceny na kartách
  function text(e, t) { if (e.textContent !== t) e.textContent = t; }
  // riadky: samo „230 €“, zl „− 101 €“ (null = riadok skrytý), sum „+ 129 €“
  function napis(karta, samo, zl, sum) {
    const r = karta.querySelectorAll(".lcd1v-kb__r");
    if (r.length !== 3) return;
    [samo, zl, sum].forEach(function (t, i) {
      if (t) text(r[i].querySelector(".lcd1v-kb__rh"), t);
      if (r[i].hidden !== !t) r[i].hidden = !t;
    });
  }
  // presná cena (kufor, vybraný box): samostatne „230 €“, výhoda „− 101 €“, v sete „+ 129 €“
  function napisPresne(karta, set, s) {
    const viac = !!(s && s > set + 0.5);
    napis(karta, viac ? fmt(s) : null, viac ? "− " + fmt(s - set) : null, "+ " + fmt(set));
  }
  function cenyKarty() {
    const sam = stav.sam;
    [["classic", kv.classic, sam && sam.classic], ["premium", kv.premium, sam && sam.premium]].forEach(function (x) {
      napisPresne(kartyK[x[0]], x[1].cena, x[2]);
    });
    const n = pocetBoxov(), hotovo = n && kompletne(n);
    // 1 box (solo)
    const solo = VELKOSTI.filter(function (v) { return vel.boxSolo[v]; });
    if (n === 1 && hotovo) {
      const v = velkostVyberu("boxSolo");
      napisPresne(kartyB[1], vel.boxSolo[v].cena, samostatneBoxy(sam, 1, v));
    } else {
      const set = Math.min.apply(null, solo.map(function (v) { return vel.boxSolo[v].cena; }));
      const samo = solo.map(function (v) { return samostatneBoxy(sam, 1, v); }).filter(Boolean);
      const uspory = solo.map(function (v) { const s = samostatneBoxy(sam, 1, v); return s ? s - vel.boxSolo[v].cena : null; }).filter(function (u) { return u != null; });
      napisOd(kartyB[1], samo, uspory, set);
    }
    // 2 boxy (1. + 2. box, každý svoju veľkosť)
    const p1 = VELKOSTI.filter(function (v) { return vel.box1[v]; }), p2 = VELKOSTI.filter(function (v) { return vel.box2[v]; });
    if (n === 2 && hotovo) {
      const a = velkostVyberu("box1"), b = velkostVyberu("box2");
      napisPresne(kartyB[2], vel.box1[a].cena + vel.box2[b].cena, samostatneBoxy(sam, 2, a, b));
    } else {
      const set = Math.min.apply(null, p1.map(function (v) { return vel.box1[v].cena; })) + Math.min.apply(null, p2.map(function (v) { return vel.box2[v].cena; }));
      const samo = [], uspory = [];
      p1.forEach(function (a) { p2.forEach(function (b) {
        const s = samostatneBoxy(sam, 2, a, b);
        if (s) { samo.push(s); uspory.push(s - vel.box1[a].cena - vel.box2[b].cena); }
      }); });
      napisOd(kartyB[2], samo, uspory, set);
    }
  }
  // nevybraný počet: „od“ najnižšie ceny; výhoda „až“ najvyššia úspora, keď sa úspora medzi veľkosťami líši
  function napisOd(karta, samo, uspory, set) {
    const ok = samo.length && uspory.length && Math.max.apply(null, uspory) > 0.5;
    const max = ok ? Math.max.apply(null, uspory) : 0, min = ok ? Math.min.apply(null, uspory) : 0;
    napis(karta,
      ok ? T.od + " " + fmt(Math.min.apply(null, samo)) : null,
      ok ? (max - min > 0.5 ? T.az + " " : "") + "− " + fmt(max) : null,
      T.od + " " + fmt(set));
  }

  // ---------------------------------------------------------------- obnova (živý DOM -> nový vzhľad)
  function stlac(b, ano) {
    const v = ano ? "true" : "false";
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  }
  function obnov() {
    const dk = druhKufra();
    Object.keys(kartyK).forEach(function (k) { stlac(kartyK[k], k === dk); });
    const n = pocetBoxov(), otvorene = banner.classList.contains("showConf"), hotovo = n && kompletne(n);
    [0, 1, 2].forEach(function (k) { stlac(kartyB[k], k === n); });
    ovladacePopis.forEach(function (x) { stlac(x[0], x[0].classList.contains("active")); });
    farbaKresby();
    const pod = n === 2 ? T.okno.pod2 : T.okno.pod1;
    if (podOkna.textContent !== pod) podOkna.textContent = pod;
    // okno: fokus dnu pri otvorení, späť na kartu pri zatvorení; chat Luxia a rolovanie stránky ustúpia (CSS)
    if (otvorene !== stav.otvorene) {
      stav.otvorene = otvorene;
      vyber.setAttribute("aria-hidden", otvorene ? "false" : "true");
      document.body.classList.toggle("lcd1v-bx-otvorene", otvorene);
      if (otvorene) {
        stav.zvolene = {};
        stav.posunute = false;
        stav.predFokus = document.activeElement;
        setTimeout(function () { try { xBtn.focus({ preventScroll: true }); } catch (e) {} }, 60);
      } else {
        stav.nove = false;
        const f = document.activeElement;
        if (!f || f === document.body || vyber.contains(f)) {
          const ciel = kartyB[pocetBoxov()] || stav.predFokus;
          try { if (ciel && ciel.focus) ciel.focus({ preventScroll: true }); } catch (e) {}
        }
      }
    }
    if (otvorene && n && hotovo && !stav.posunute && klucePoctu(n).every(function (k) { return stav.zvolene[k]; })) {
      stav.posunute = true;
      posunKTlacidlu();
    }
    // poistka G10b: označený box bez farby/veľkosti pri zavretom okne -> späť na Nechcem (živé „zrušiť“)
    if (n && !hotovo && !otvorene) {
      if (!stav.hojenie) stav.hojenie = setTimeout(function () {
        stav.hojenie = null;
        const m = pocetBoxov();
        if (m && !kompletne(m) && !banner.classList.contains("showConf")) { klikZivy(".close-btn.close:not(.bottom)"); naplanuj(); }
      }, 700);
    } else if (stav.hojenie) { clearTimeout(stav.hojenie); stav.hojenie = null; }
    cenyKarty();
    zhrnutie(dk, n, hotovo);
  }
  /**
   * Prvý úplný výber v otvorenom okne (farba + veľkosť každého boxu, ktorú zákazník sám zvolil) -> okno sa raz posunie
   * k „Potvrďte výber boxov“ (Michal 22. 10. 2026: „aby prvý krát, keď človek vyberie všetko, čo má, tak aby ho to
   * zoscrolovalo až k tomu tlačidlu“). Tlačidlo je posledné v okne; keď ho už vidno, nič sa nehýbe.
   */
  function posunKTlacidlu() {
    const r = okBtn.getBoundingClientRect(), o = vyber.getBoundingClientRect();
    if (r.bottom <= o.bottom - 8) return;
    const tichy = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { vyber.scrollTo({ top: vyber.scrollHeight, behavior: tichy ? "auto" : "smooth" }); } catch (e) { vyber.scrollTop = vyber.scrollHeight; }
  }
  function zhrnutie(dk, n, hotovo) {
    const kt = dk === "classic" || dk === "premium" ? T.kufor[dk].popis + " · + " + fmt(kv[dk].cena)
      : dk === "nie" && niePlatene ? T.kufor.nie.popis + " · + " + fmt(kv.nie.cena) : T.kufor.nie.popis;
    let bt = T.boxy[0].popis;
    if (n && hotovo) {
      const kl = klucePoctu(n);
      const sum = kl.reduce(function (s, k) { return s + vel[k][velkostVyberu(k)].cena; }, 0);
      const fo = ctx.moznosti("farbaBoxov").find(function (m) { return m.hodnota === ctx.precitaj("farbaBoxov"); });
      bt = n + "× box · " + kl.map(velkostVyberu).join(" + ") + " · " + kratkaFarba(fo ? fo.text : "") + " · + " + fmt(sum);
    }
    const kluc = kt + "|" + bt;
    if (stav.vyberText === kluc) return;
    stav.vyberText = kluc;
    kufor.setAttribute("data-lcd1v-vyber", kt);
    boxy.setAttribute("data-lcd1v-vyber", bt);
    ctx.vysli("kufor-boxy:vyber", { kufor: { druh: dk, text: kt }, boxy: { pocet: n && hotovo ? n : 0, text: bt } });
  }
  vytvorene.push(function () { kufor.removeAttribute("data-lcd1v-vyber"); boxy.removeAttribute("data-lcd1v-vyber"); document.body.classList.remove("lcd1v-bx-otvorene"); });

  let planovane = false;
  function naplanuj() {
    if (planovane) return;
    planovane = true;
    requestAnimationFrame(function () { planovane = false; obnov(); });
  }

  // ---------------------------------------------------------------- akcie
  kbK.addEventListener("click", function (e) {
    if (e.target.closest(".lcd1v-kb__info")) {
      const otvor = vysvK.hidden;
      vysvK.hidden = !otvor;
      infoK.setAttribute("aria-expanded", otvor ? "true" : "false");
      return;
    }
    const b = e.target.closest(".lcd1v-kb__karta");
    if (!b) return;
    const druh = b.getAttribute("data-kufor");
    // už zvolené (klik na aktívnu živú kartu by ju odznačil); Nechcem bez výberu = predvolené „nič“ ako naživo
    if (druh === druhKufra()) return;
    ctx.zapis("kufor", druh === "nie" ? (kv.nie ? kv.nie.hodnota : "") : kv[druh].hodnota);
    naplanuj();
  });

  kbB.addEventListener("click", function (e) {
    const b = e.target.closest(".lcd1v-kb__karta");
    if (!b) return;
    const n = Number(b.getAttribute("data-boxy"));
    const teraz = pocetBoxov();
    if (n === 0) {
      if (teraz !== 0 || !boxy.querySelector(":scope > .parameter-cars > .upsale-button.none.active")) ctx.zapis("pocetBoxov", 0);
      naplanuj();
      return;
    }
    if (n === teraz) {
      // úprava už vybraného počtu: len otvoriť okno (klik na živú aktívnu kartu by ju odznačil)
      stav.nove = !kompletne(n);
      banner.classList.add("showConf");
      naplanuj();
      return;
    }
    const farba = ctx.precitaj("farbaBoxov");
    if (teraz) klikZivy(".close-btn.close:not(.bottom)"); // zmena počtu: živé „zrušiť“ vyčistí veľkosti aj aktívne tlačidlá
    stav.nove = true;
    stav.predFokus = b;
    if (!ctx.zapis("pocetBoxov", n)) return;
    if (farba) ctx.zapis("farbaBoxov", farba);
    // veľkosť S (v cene) predvolená ako v návrhu; zákazník ju v okne zmení
    klucePoctu(n).forEach(function (k) { if (!velkostVyberu(k)) ctx.zapis(k, vel[k].S.hodnota); });
    naplanuj();
  });

  function zavriOkno() {
    if (!banner.classList.contains("showConf")) return;
    const n = pocetBoxov();
    // nový výber zavretý bez potvrdenia = žiadny box (nie G10b: označený box mimo ceny); úprava = ponechať úplný výber
    if (!stav.nove && n && kompletne(n)) klikZivy(".close-btn.return");
    else klikZivy(".close-btn.close:not(.bottom)");
    naplanuj();
  }
  xBtn.addEventListener("click", zavriOkno);
  // pozadie chytá ťuknutia ešte 0,8 s po zatvorení (CSS, dvojťuknutie na „Potvrďte“) — vtedy zavriOkno nerobí nič.
  // iPhone (variant B, Michal 30. 10. 2026): okno je spodný panel (do 720 px) a pri zbalenej lište Safari končí nad ňou;
  // ťuknutie pod spodný okraj okna ho NEZAVRIE — v tom páse môže byť lišta Safari a zákazník tam mieril na „Potvrďte“,
  // nie preč (zavretie by zrušilo nový výber). Nad oknom, krížik, Esc, PC, Android a iPad nad 720 px ako doteraz.
  const panelIos = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
  pozadie.addEventListener("click", function (e) {
    if (e && panelIos && panelIos.matches && vyber.classList.contains("lcd1v-bx--ios") && e.clientY >= vyber.getBoundingClientRect().bottom - 1) return;
    zavriOkno();
  });
  /**
   * Validácia boxov (configuratorEngine: lcd-needs-fill + posun) posúva len stránku, nie okno boxov, ktoré roluje samo —
   * chýbajúca farba ostala nad okrajom okna (Michal 26. 10. 2026: „verifikácia ma nevyscroluje na farbu“). Okno sa posunie
   * na prvé označené pole, keď nie je vidno jeho vrch (nad prilepenou pätou).
   */
  function posunNaChybu() {
    const ch = Array.prototype.find.call(vyber.querySelectorAll(".lcd-needs-fill"), function (e) { return e.offsetParent !== null; });
    if (!ch || !banner.classList.contains("showConf")) return;
    const r = ch.getBoundingClientRect(), o = vyber.getBoundingClientRect();
    if (r.top >= o.top && r.top <= o.bottom - pata.offsetHeight - 48) return;
    const ciel = Math.max(0, vyber.scrollTop + r.top - o.top - 12);
    const tichy = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { vyber.scrollTo({ top: ciel, behavior: tichy ? "auto" : "smooth" }); } catch (e) { vyber.scrollTop = ciel; }
  }
  function potvrd() {
    klikZivy(".close-btn.return"); // živá validácia: chýba farba/veľkosť -> červený rám (lcd-needs-fill) + chybová veta
    requestAnimationFrame(posunNaChybu);
    naplanuj();
  }
  okBtn.addEventListener("click", potvrd);
  // Krátke ťuknutie bez posunu prsta potvrdí priamo na touchend (6197fc5, 26. 10. 2026: Safari po ťuknutí počas dobehu
  // rolovania okna niekedy nepošle click); preventDefault zruší syntetický click (žiadne dvojité potvrdenie ani „duch“ na
  // prvku pod zavretým oknom). Myš, klávesnica a čítačky obrazovky idú cez click ako doteraz. Samotné „treba ťuknúť 2×“
  // na iPhone nebolo v stránke (ťuknutie sem neprišlo) — zbalená lišta Safari; okno preto na iPhone končí nad ňou
  // (lcd1v-bx--ios vyššie, variant B 30. 10. 2026).
  let dotyk = null;
  okBtn.addEventListener("touchstart", function (e) {
    const t = e.touches && e.touches[0];
    dotyk = t && e.touches.length === 1 ? { x: t.clientX, y: t.clientY, cas: Date.now() } : null;
  }, { passive: true });
  okBtn.addEventListener("touchend", function (e) {
    const t = e.changedTouches && e.changedTouches[0], d = dotyk;
    dotyk = null;
    if (!d || !t || Math.abs(t.clientX - d.x) > 10 || Math.abs(t.clientY - d.y) > 10 || Date.now() - d.cas > 700) return;
    e.preventDefault();
    potvrd();
  });
  okBtn.addEventListener("touchcancel", function () { dotyk = null; }, { passive: true });
  const naEsc = function (e) {
    if (!banner.classList.contains("showConf")) return;
    if (e.key === "Escape") { zavriOkno(); return; }
    if (e.key !== "Tab") return;
    // fokus ostáva v okne (aria-modal): krížik -> farby -> veľkosti -> Potvrďte -> krížik
    const prvky = [xBtn].concat(ovladacePopis.map(function (x) { return x[0]; }).filter(function (b) { return b.offsetParent !== null; }), [okBtn]);
    const i = prvky.indexOf(document.activeElement);
    if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === prvky.length - 1)) {
      e.preventDefault();
      prvky[e.shiftKey ? prvky.length - 1 : 0].focus();
    }
  };
  document.addEventListener("keydown", naEsc);
  vytvorene.push(function () { document.removeEventListener("keydown", naEsc); });

  // ---------------------------------------------------------------- sledovanie živého stavu
  const mo = new MutationObserver(function (zaznamy) {
    // validácia košíka (lcdHandleBoxConfig) zvýraznila nevyplnenú farbu/veľkosť -> ukázať okno, nech to zákazník vidí
    // a posunúť okno na označené pole (len pri novom označení, nie pri inej zmene triedy počas 3 s červeného rámu)
    for (let i = 0; i < zaznamy.length; i++) {
      const t = zaznamy[i].target;
      if (t.classList && t.classList.contains("lcd-needs-fill") && !/(^|\s)lcd-needs-fill(\s|$)/.test(zaznamy[i].oldValue || "") && vyber.contains(t) && pocetBoxov()) {
        banner.classList.add("showConf");
        requestAnimationFrame(posunNaChybu);
        break;
      }
    }
    naplanuj();
  });
  mo.observe(banner, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class"] });
  vytvorene.push(function () { mo.disconnect(); });
  const naCenu = function () { naplanuj(); };
  document.addEventListener("LuxuryCarPriceRecalculated", naCenu);
  vytvorene.push(function () { document.removeEventListener("LuxuryCarPriceRecalculated", naCenu); });
  const odhlas = ctx.na("zmena", naplanuj);
  vytvorene.push(odhlas);
  // farba boxov zmenená priamo v živom selecte (natívny change aj jQuery .trigger("change"), ktorý natívny nevyšle)
  const pFarby = ctx.parameter("farbaBoxov");
  const selFarby = pFarby && pFarby.select;
  if (selFarby) {
    selFarby.addEventListener("change", naplanuj);
    vytvorene.push(function () { selFarby.removeEventListener("change", naplanuj); });
    const $ = window.jQuery || window.$;
    if ($) { $(selFarby).on("change.lcd1vbx", naplanuj); vytvorene.push(function () { $(selFarby).off("change.lcd1vbx"); }); }
  }

  obnov();

  // „Samostatne“: ceny samostatných produktov (rovnaký zdroj ako košík; 24 h v localStorage) — až po načítaní stránky
  setTimeout(function () {
    samostatneCenyKonfigurator(ctx.projectId, location.pathname).then(function (s) {
      if (!s) return;
      stav.sam = s;
      naplanuj();
    }, function () {});
  }, 800);
}
