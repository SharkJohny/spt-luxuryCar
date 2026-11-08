// Konfigurátor Mercedes triedy V (SK 646, CZ presná kópia od 8. 11. 2026): samostatná časť js/lcd-vclass.js, stiahne sa len na tejto
// stránke (vclass/index.js). Trh podľa ctx.jazyk (vclass/trh.js): SK data.js a texty v kóde, CZ data-cz.js a texty-cz.js.
// Cesta zákazníka zhora nadol: tmavá úvodná časť s videom a cenou, pruh krokov, krok „Vaše auto“ so všetkými údajmi naraz
// (rovnaký vzhľad ako v konfigurátore 1V), rozloženie aj s kufrom na dlaždiciach, vzor, farba, druhá vrstva, boxy, košík. Kresba až od rozloženia.
// Ceny sú len v Shoptete: základ = jednovrstvové autokoberce k predným sedadlám, príplatky = 2. a 3. rad, druhá vrstva, rohož, boxy.
// Košík: všetky výbery idú do natívnych selectov príplatkov (admin 415–442), ceny rátá Shoptet. Do košíka sa klikne natívne
// tlačidlo, takže rozpis v košíku aj riadok objednávky fungujú ako pri ostatných produktoch.
import { kresli } from "./kresba.js";
import { nastavTrh, data, t, cenaText } from "./trh.js";
import { NAHLADY_FARIEB } from "../farby-nahlady-data.js";
import { CSS } from "./styl.js";
import { htmlDruha, ozivVideo, otvorOkno, zrusOkno, nastavTextyCz } from "./druha.js";
import { ozivObsah } from "./obsah.js";
import { vytvorOknoBoxov } from "./boxy.js";

/** Názvy modelov v katalógu áut. */
const MODELY = { M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" };
const MOBIL = "(max-width: 991px)";
const IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";
const FARBY_CDN = IMG + "farby/";
const OBS = IMG + "obsah/";
const TELEFON = "+421 903 660 720";
const KLUC_ULOZENIA = "lcdVclass";
const nahlad = (slug) => (NAHLADY_FARIEB[slug] ? FARBY_CDN + slug + "-" + NAHLADY_FARIEB[slug] + "-w144.jpg" : "");
const eur = (n) => cenaText(n);
const cistyText = (o) => String(o.textContent || "").replace(/\s*\+\s*(?:€|Kč)?\s*[\d\s.,]+\s*(?:€|Kč)?\s*$/, "").trim();

function selectPodlaMena(meno) {
  return Array.prototype.find.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), (s) => (s.getAttribute("data-parameter-name") || "").trim() === meno) || null;
}
function moznost(sel, text) {
  return Array.prototype.find.call(sel.options, (o) => o.value && cistyText(o) === text) || null;
}
/** Fotka na karte voľby: text je v tlačidle, preto prázdny alt. */
const fotoKarta = (s) => '<picture><source type="image/webp" srcset="' + OBS + s + '-w480.webp"><img src="' + OBS + s + '.jpg" alt="" loading="lazy" width="1500" height="1000"></picture>';

export function spusti(ctx) {
  const cz = !!ctx && ctx.jazyk === "cs";
  nastavTrh(cz ? "cz" : "sk");
  // karta druhej vrstvy po česky: texty z registra (produkty.js produkt1v, CZ preklad ako na autokobercoch)
  if (cz) nastavTextyCz(ctx.produkt && ctx.produkt.texty && ctx.produkt.texty.druha);
  // údaje trhu: SK = data.js (bez zmeny), CZ = data-cz.js (mená príplatkov a hodnôt z CZ adminu)
  const { SELECTY, VELKOSTI, ROKY, VOLANT, STRED, DVERE, SEDADLA, SEDADLA_TEXTY, sedadlaText, STOLCEK, ZASUVKY, VZORY, FARBY, LUX, KROKY, VIDEO, SAMOSTATNE, BEZ_DRUHEJ, ROZ_PREDOK, ROZ_BEZ, rozSet, rozLen, rozRadRohoz, ROHOZ, ROHOZ_SAM, INFO, BOXY, BOX_FARBY } = data();
  const form = document.getElementById("product-detail-form");
  const tlacidlo = form && form.querySelector(".add-to-cart button.add-to-cart-button");
  const stlpec = document.querySelector(".p-info-wrapper");
  const lavy = document.querySelector(".p-image-wrapper");
  const hlavicka = document.querySelector(".p-detail-inner-header");
  const obal = document.querySelector(".p-detail-inner") || (form && form.parentNode);
  const cenaMeta = document.querySelector('meta[itemprop="price"]');
  const zaklad = cenaMeta ? parseFloat(cenaMeta.getAttribute("content")) : 0;
  const sel = {};
  Object.keys(SELECTY).forEach((k) => { sel[k] = selectPodlaMena(SELECTY[k]); });
  const chyba = Object.keys(sel).filter((k) => !sel[k]);
  if (!form || !tlacidlo || !stlpec || !lavy || !obal || !(zaklad > 0) || chyba.length) throw new Error("vclass: na stránke chýba " + (chyba.join(", ") || "formulár, tlačidlo alebo cena"));
  // hodnoty v kóde musia byť v admine; chýbajúca hodnota = návrat na natívny formulár, nie tichý zlý výber
  const textyBoxov = BOXY.map((b) => b.t);
  // roky výroby: ROKY idú po aktuálny rok, ukážu sa len tie, ktoré má admin (nový rok sa objaví, až keď ho admin doplní)
  const roky = ROKY.filter((r) => moznost(sel.rok, r));
  if (!roky.length) throw new Error("vclass: v príplatku rok nie je žiadny rok výroby");
  const kontrola = { rok: roky, volant: VOLANT, stred: STRED, dvere: DVERE, sedadla: SEDADLA_TEXTY, stolcek: STOLCEK, zasuvky: ZASUVKY, farba2: LUX.map((l) => "Lux Color " + l[0]).concat(BEZ_DRUHEJ), rozlozenie: [ROZ_PREDOK, ROZ_BEZ].concat(VELKOSTI.map((x) => rozSet(x.v)), VELKOSTI.map((x) => rozLen(x.v)), VELKOSTI.map((x) => rozRadRohoz(x.v))), rohoz: ROHOZ.concat(ROHOZ_SAM), box1: textyBoxov, box2: textyBoxov, box3: textyBoxov, boxFarba: BOX_FARBY.map((f) => f.nm) };
  Object.keys(FARBY).forEach((v) => FARBY[v].forEach((f) => { if (!moznost(sel.farba, VZORY.find((x) => x.id === v).nm + " – " + f.nm)) throw new Error("vclass: v príplatku chýba " + f.nm); }));
  Object.keys(kontrola).forEach((k) => kontrola[k].forEach((t) => { if (!moznost(sel[k], t)) throw new Error("vclass: v príplatku " + k + " chýba " + t); }));

  const S = { velkost: "", rok: "", volant: VOLANT[0], stred: "", dvere: "", rad2: "", rad3: "", stolcek: "", zasuvky: "", vzor: "", farba: "", vrstva: "", farba2: "", predok: "ano", rozl: "P", rozlOk: false, rohoz: "nie", boxy: "", box1: "", box2: "", box3: "", boxFarba: "", akt: 0, chybaju: false };
  const spat = [];
  let zruseny = false;
  // návrat z košíka alebo obnovenie stránky: rozrobený výber ostáva, zákazník nezačína odznova
  try {
    const o = JSON.parse(sessionStorage.getItem(KLUC_ULOZENIA) || "null");
    if (o) Object.keys(S).forEach((k) => { if (k !== "chybaju" && typeof o[k] === typeof S[k]) S[k] = o[k]; });
    if (S.vzor && !(FARBY[S.vzor] || []).some((f) => f.nm === S.farba)) S.farba = "";
    // výber uložený pred 7. 11. 2026
    if (S.predok !== "nie") S.predok = "ano";
    if (S.rozl !== "Z") S.rozl = "P";
    if (S.rohoz !== "ano") S.rohoz = "nie";
    if (S.boxy === "3") { S.boxy = ""; S.box1 = ""; S.box2 = ""; S.box3 = ""; }
    if (S.stred && STRED.indexOf(S.stred) < 0) S.stred = "";
  } catch (e) { /* súkromný režim: začína sa odznova */ }
  const uloz = () => { try { sessionStorage.setItem(KLUC_ULOZENIA, JSON.stringify(S)); } catch (e) { /* nič */ } };
  // príchod z konfigurátora autokobercov alebo z titulky (functions/vclassPresmerovanie.js, ?rok=2020&velkost=L): rok a dĺžka
  // vopred LEN pri príchode. Hneď sa uložia a z adresy zmiznú, takže po zmene výberu, návrate z košíka (Späť) alebo F5
  // platí uložený výber, nie znova parametre z adresy.
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has("rok") || q.has("velkost")) {
      if (roky.indexOf(q.get("rok")) > -1) S.rok = q.get("rok");
      if (VELKOSTI.some((x) => x.v === q.get("velkost"))) S.velkost = q.get("velkost");
      uloz();
      q.delete("rok");
      q.delete("velkost");
      const zvysok = q.toString();
      window.history.replaceState(window.history.state, "", window.location.pathname + (zvysok ? "?" + zvysok : "") + window.location.hash);
    }
  } catch (e) { /* bez parametrov */ }

  // ---- ceny: všetko z možností príplatkov v Shoptete
  const prc = (k, text) => { const o = text ? moznost(sel[k], text) : null; return o ? Number(o.getAttribute("data-surcharge-final-price")) || 0 : 0; };
  const textBoxu = (v) => { const b = BOXY.find((x) => x.v === v); return b ? b.t : ""; };
  /** Cena boxu: jeden box má vlastný príplatok, pri dvoch boxoch platia príplatky „z dvoch“. */
  const prcBox = (n, i, v) => prc(n === 1 ? "box1" : "box" + (i + 1), textBoxu(v));
  /** Čo je vo výbere: predné sedadlá, 2. a 3. rad, rohož do kufra. */
  const vyb = (v) => ({ p: v.predok !== "nie", r: v.rozl === "Z", k: v.rohoz === "ano" });
  const maVyber = () => { const x = vyb(S); return x.p || x.r || x.k; };
  /** Hodnoty príplatkov: jedna časť bez predných sedadiel stojí samostatnú cenu, dve a viac sú so zľavou (Michal 7. 11. 2026). */
  function textRozlozenia(v) {
    const x = vyb(v), vel = v.velkost || "M";
    if (x.p) return x.r ? rozSet(vel) : ROZ_PREDOK;
    if (x.r) return x.k ? rozRadRohoz(vel) : rozLen(vel);
    return ROZ_BEZ;
  }
  function textRohoze(v) { const x = vyb(v); return x.k ? (x.p || x.r ? ROHOZ[0] : ROHOZ_SAM) : ROHOZ[1]; }
  /** Cena výberu: základ v Shoptete + príplatky len za to, čo si zákazník vybral. */
  function cena(zmena) {
    const v = Object.assign({}, S, zmena), x = vyb(v);
    let c = x.p || x.r || x.k ? zaklad + prc("rozlozenie", textRozlozenia(v)) + prc("rohoz", textRohoze(v)) : 0;
    if (x.p && v.vrstva === "ano") c += prc("farba2", "Lux Color " + (v.farba2 || LUX[0][0]));
    const nb = Number(v.boxy) || 0;
    [1, 2].slice(0, nb).forEach((i) => { if (v["box" + i]) c += prcBox(nb, i, v["box" + i]); });
    return c;
  }

  const styl = document.createElement("style");
  styl.id = "lcd-vclass-css";
  styl.textContent = CSS;
  document.head.appendChild(styl);
  document.body.classList.add("lcd-vclass");
  stlpec.classList.add("active");
  // prázdny Popis: Shoptet píše „Popis produktu nie je dostupný“, s vyplneným Popisom sa nič neskrýva
  const popis = document.querySelector("#description .basic-description");
  if (popis && (cz ? /není dostupn/i : /nie je dostupn/i).test(popis.textContent)) { popis.style.display = "none"; spat.push(() => { popis.style.display = ""; }); }

  // ---- úvodná časť s fotkami
  const hero = document.createElement("div"); // nie <section>: staré štýly webu mu vnucujú okraje
  hero.id = "lcd-vclass-hero";
  hero.setAttribute("role", "region");
  hero.setAttribute("aria-label", t("Mercedes triedy V"));
  hero.innerHTML = '<div class="lh-in"><div class="lh-g"><video class="lh-v" muted loop playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="none" aria-label="' + VIDEO.alt + '"></video><button type="button" class="lh-pauza" aria-label="' + t("Zastaviť video") + '" hidden></button></div><div class="lh-tx"><div class="lh-h"></div><p class="lh-p">' + t("Prešívané autokoberce na mieru pre Mercedes triedy V v dĺžkach M, L a XL, od pedálov až po kufor. Podlahu sme naskenovali, preto sedia okolo každej koľajnice aj zásuvky. Set si poskladáte po častiach a cenu vidíte pri každom kroku.") + '</p><div class="lh-dol"><div class="lh-c"><small>' + t("od") + '</small><b>' + eur(zaklad) + '</b><span>' + t("jednovrstvové autokoberce pod predné sedadlá") + '</span></div><button type="button" class="lh-cta">' + t("Zostaviť môj set") + '</button></div></div></div>';
  obal.insertBefore(hero, obal.firstChild);
  const povodne = { rodic: hlavicka && hlavicka.parentNode, za: hlavicka && hlavicka.nextSibling };
  const h1 = hlavicka && hlavicka.querySelector("h1");
  const h1Html = h1 ? h1.innerHTML : "";
  if (hlavicka) hero.querySelector(".lh-h").appendChild(hlavicka);
  if (h1) h1.innerHTML = 'Autokoberce <span>Mercedes V&nbsp;Class</span>';
  // video hore: naše video z V Class XL, bez zvuku; pri šetrení dát a obmedzení pohybu ostane obrázok
  const video = hero.querySelector(".lh-v");
  const pauzaTl = hero.querySelector(".lh-pauza");
  const mm = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  const verziaVidea = mm(MOBIL) ? "tel" : "pc";
  video.muted = true;
  video.poster = IMG + VIDEO.meno + "-" + verziaVidea + ".jpg";
  let videoPauza = false, ioVideo = null;
  const pripojenie = navigator.connection || {};
  const hraj = () => { const p = video.play(); if (p && p.catch) p.catch(() => { /* prehliadač autoplay nedovolil: ostáva obrázok */ }); };
  if (!mm("(prefers-reduced-motion: reduce)") && !pripojenie.saveData && !/2g/.test(pripojenie.effectiveType || "")) {
    video.src = IMG + VIDEO.meno + "-" + verziaVidea + ".mp4";
    pauzaTl.hidden = false;
    hraj();
    if (typeof IntersectionObserver === "function") {
      ioVideo = new IntersectionObserver((z) => { if (z[0].isIntersecting) { if (!videoPauza) hraj(); } else video.pause(); });
      ioVideo.observe(hero);
    }
  }

  /** Úvodná časť na celú šírku okna: viditeľná šírka, aby 100vw neurobilo vodorovný posuvník; centruje sa v obale stránky. */
  const stranka = document.querySelector(".overall-wrapper") || document.body;
  function rozsir() {
    hero.style.setProperty("--lv-vw", stranka.getBoundingClientRect().width + "px");
  }
  // posuvník sa objaví až po vykreslení krokov a zmenší šírku stránky
  if (typeof window.ResizeObserver === "function") {
    const ro = new window.ResizeObserver(rozsir);
    ro.observe(stranka);
    spat.push(() => ro.disconnect());
  }

  // ---- pruh krokov
  const cesta = document.createElement("div");
  cesta.id = "lcd-vclass-cesta";
  hero.parentNode.insertBefore(cesta, hero.nextSibling);

  // ---- kresba a kroky
  const nakres = document.createElement("div");
  nakres.id = "lcd-vclass-nakres";
  // v prvom kroku ešte nie je čo kresliť: na PC tam je fotka, na telefóne nič (umiestni)
  nakres.innerHTML = '<figure class="lv-n-f"><picture><source type="image/webp" srcset="' + OBS + 'autokoberce-mercedes-v-class-xl-predok-w800.webp"><img src="' + OBS + 'autokoberce-mercedes-v-class-xl-predok.jpg" alt="' + t("Autokoberce pri šoférovi v Mercedes V Class XL") + '" loading="lazy" width="1023" height="682"></picture><figcaption>' + t("Svoj set si poskladáte hneď v ďalšom kroku. Tu ho uvidíte presne tak, ako si ho vyberiete.") + '</figcaption></figure><div class="lv-n-set"><div class="lv-n-h">' + t("Váš set") + '</div><div class="lv-pl"><canvas class="lv-pred" role="img" aria-label="' + t("Predné koberce triedy V zhora") + '"></canvas><canvas class="lv-zad" role="img" aria-label="' + t("Koberce 2. a 3. radu a kufra zhora") + '"></canvas></div><p class="lv-pop">' + t("Kresba sa mení podľa Vášho výberu, predok je hore.") + '</p></div>';
  lavy.appendChild(nakres);
  const pred = nakres.querySelector(".lv-pred");
  const zad = nakres.querySelector(".lv-zad");

  const root = document.createElement("div");
  root.id = "lcd-vclass";
  root.innerHTML = '<div class="lv-kroky"></div><div class="lv-suhrn"><ul class="lv-rozpis" hidden></ul><div class="lv-cc" hidden><div class="lv-cc-h">' + t("Váš set je hotový") + '</div><div class="lv-cc-g"><div class="lv-cc-c"><small>' + t("Odporúčaná cena") + ' <s></s></small><span>' + t("Naša cena") + '</span><b></b></div><div class="lv-cc-z"><i class="lv-cc-s"></i><span class="lv-cc-p"></span></div></div><ul class="lv-cc-l"></ul></div><div class="lv-spolu"><span>' + t("Spolu") + '</span><b class="lv-c2"></b></div><p class="lv-us" hidden>' + t("V sete ušetríte") + ' <b></b></p><p class="lv-spr" hidden></p><button type="button" class="lv-cta"></button><p class="lv-dod">' + t("Šije sa až po objednávke, preto dodanie trvá 21–29 dní.") + '</p></div>';
  stlpec.appendChild(root);
  const kor = root.querySelector(".lv-kroky");
  const spr = root.querySelector(".lv-spr");
  const cta = root.querySelector(".lv-cta");
  const rozpis = root.querySelector(".lv-rozpis");
  const usetrite = root.querySelector(".lv-us");
  const kartaCien = root.querySelector(".lv-cc");
  const spoluRiadok = root.querySelector(".lv-spolu");
  const okno = vytvorOknoBoxov({
    img: IMG, eur, cena: prcBox,
    hotovo: (v) => {
      S.boxy = String(v.n); S.box1 = v.box1; S.box2 = v.box2; S.box3 = ""; S.boxFarba = v.farba;
      spr.hidden = true; S.chybaju = false;
      sync(); kroky(); uloz();
    },
  });

  // ---- lišta na telefóne: cena a ďalší krok sú stále na dosah (rovnaká lišta ako na ostatných produktoch 1V, cena.js)
  const lista = document.createElement("div");
  lista.className = "lcd1v-lista";
  lista.id = "lcd1v-lista";
  lista.innerHTML = '<div class="lcd1v-lista__c"><b class="lcd1v-lista__suma"></b><small class="lcd1v-lista__popis"></small></div><button type="button" class="lcd1v-lista__kos"></button>';
  document.body.appendChild(lista);
  const mobil = window.matchMedia ? window.matchMedia(MOBIL) : { matches: false };

  // ---- výber -> Shoptet
  const farbaText = () => (S.vzor && S.farba ? VZORY.find((v) => v.id === S.vzor).nm + " – " + S.farba : "");
  const hodnoty = () => {
    const n = Number(S.boxy) || 0;
    return {
      rok: S.rok, volant: S.volant, stred: S.stred, dvere: S.dvere, sedadla: S.rad2 && S.rad3 ? sedadlaText(S.rad2, S.rad3) : "", stolcek: S.stolcek, zasuvky: S.zasuvky, farba: farbaText(),
      farba2: S.predok === "nie" || S.vrstva === "nie" ? BEZ_DRUHEJ : S.vrstva === "ano" && S.farba2 ? "Lux Color " + S.farba2 : "",
      rozlozenie: S.rozl === "Z" && !S.velkost ? "" : textRozlozenia(S),
      rohoz: textRohoze(S),
      box1: n === 1 ? textBoxu(S.box1) : "", box2: n === 2 ? textBoxu(S.box1) : "", box3: n === 2 ? textBoxu(S.box2) : "",
      boxFarba: n ? S.boxFarba : "",
    };
  };
  function sync() {
    const h = hodnoty();
    Object.keys(sel).forEach((k) => {
      const o = h[k] ? moznost(sel[k], h[k]) : null;
      const v = o ? o.value : "";
      if (sel[k].value !== v) { sel[k].value = v; sel[k].dispatchEvent(new Event("change", { bubbles: true })); }
    });
  }
  const cenaSpolu = () => cena();

  // ---- kresba
  let plan = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  /** Skutočná vzorka druhej vrstvy, aby sa na kresbe ukázali aj pásiky (Michal 7. 11. 2026). CDN posiela CORS, bez neho ostane farba z tabuľky. */
  const vzorky = {};
  function vzorkaLux(n) {
    if (vzorky[n]) return vzorky[n];
    const slug = "lux-color-" + n, z = (vzorky[n] = {});
    if (!NAHLADY_FARIEB[slug]) return z;
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(im, 0, 0);
        z.w = c.width; z.h = c.height; z.d = x.getImageData(0, 0, c.width, c.height).data;
        if (!zruseny) prekresli();
      } catch (e) { /* ostáva farba z tabuľky */ }
    };
    im.src = FARBY_CDN + slug + "-" + NAHLADY_FARIEB[slug] + "-w240.jpg";
    return z;
  }
  function prekresli() {
    if (S.akt === 0) return; // v prvom kroku sa set ešte neukazuje
    cancelAnimationFrame(plan);
    plan = requestAnimationFrame(() => {
      if (zruseny) return;
      try {
        const sirka = Math.max(280, pred.parentNode.clientWidth || 320);
        const wP = Math.min(760, Math.round(sirka * DPR));
        const f = S.vzor && S.farba ? FARBY[S.vzor].find((x) => x.nm === S.farba) : null;
        const lux = S.predok !== "nie" && S.vrstva === "ano" && S.farba2 ? LUX.find((l) => l[0] === S.farba2) : null;
        const far = [f ? f.koza : "#17161a", f ? f.sit : "#dcc9a2", lux ? lux[1] : "#131315"];
        const vzor = S.vzor || "diamond";
        // cena a kresba hovoria to isté: výrazné je len to, čo je vo výbere
        const slabe = S.rozl === "Z" ? (S.rohoz === "ano" ? null : "kufor") : S.rohoz === "ano" ? "zadok" : "cele";
        kresli(pred, { cast: "predok", s: S.stred === STRED[1], vzor, bez2: S.predok === "nie" || S.vrstva !== "ano", slabe: S.predok === "nie" ? "cele" : null }, wP, far, lux ? vzorkaLux(lux[0]) : null);
        kresli(zad, { cast: "zadok", v: S.velkost || "XL", d: S.dvere === DVERE[0] ? 1 : 2, s: S.stolcek === STOLCEK[1], z: S.zasuvky === ZASUVKY[1], vzor, slabe }, Math.round(wP * 0.745), far);
        nakres.querySelector(".lv-pop").textContent = slabe || S.predok === "nie" ? t("Bledšie časti ste si zatiaľ nevybrali.") : t("Kresba sa mení podľa Vášho výberu, predok je hore.");
      } catch (e) {
        nakres.hidden = true; // kresba nie je nutná na objednanie
        console.error("[lcd-1v] vclass kresba", e);
      }
    });
  }

  // ---- kroky
  const POLIA_AUTA = ["rok", "velkost", "rad2", "rad3", "dvere", "stred", "stolcek", "zasuvky"];
  const pocetBoxov = () => Number(S.boxy) || 0;
  const hotovy = {
    auto: () => POLIA_AUTA.every((k) => !!S[k]), vzor: () => !!S.vzor, farba: () => !!S.farba,
    druha: () => S.predok === "nie" || S.vrstva === "nie" || (S.vrstva === "ano" && !!S.farba2),
    rozl: () => !!S.rozlOk && maVyber(), // krok je hotový, keď ho zákazník potvrdí a niečo si vybral
    boxy: () => S.boxy === "0" || (pocetBoxov() > 0 && !!S.boxFarba && [1, 2].slice(0, pocetBoxov()).every((i) => !!S["box" + i])),
  };
  const suhrn = {
    auto: () => t("Trieda V {0}, {1}, sedadlá {2} a {3}", S.velkost, S.rok, S.rad2, S.rad3),
    vzor: () => { const v = VZORY.find((x) => x.id === S.vzor); return v ? v.nm : ""; },
    farba: () => S.farba,
    druha: () => (S.predok === "nie" || S.vrstva === "nie" ? BEZ_DRUHEJ : "Lux Color " + S.farba2),
    rozl: () => { const x = vyb(S), z = [x.p && t("predné sedadlá"), x.r && t("2. a 3. rad"), x.k && t("rohož do kufra")].filter(Boolean).join(", "); return z.charAt(0).toUpperCase() + z.slice(1); },
    boxy: () => (S.boxy === "0" ? t("Bez boxov") : pocetBoxov() + (pocetBoxov() === 1 ? " box" : " boxy") + ": " + [1, 2].slice(0, pocetBoxov()).map((i) => S["box" + i]).join(", ")),
  };
  const tl = (k, v, vnutro, tr) => '<button type="button" class="' + (tr || "lv-v1") + '" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (String(S[k]) === String(v)) + '">' + vnutro + "</button>";
  /** Prepínač ako „Miest na sedenie“ v konfigurátore 1V; popisy môžu byť kratšie než hodnota v Shoptete. */
  const seg = (k, A, popisy) => '<div class="lv-seg lv-seg' + A.length + '" data-pole="' + k + '">' + A.map((a, i) => tl(k, a, popisy ? popisy[i] : a, "lv-s1")).join("") + "</div>";
  const chyb = (k) => (S.chybaju && !S[k] ? " lv-chyba" : "");
  const pole = (k, n, vnutro) => '<div class="lv-pole' + chyb(k) + '" data-pole-w="' + k + '"><span class="lv-l">' + n + "</span>" + vnutro + "</div>";
  /** Rozbaľovacie menu ako v konfigurátore 1V: zlatý rám a šípka, prázdne pole je výrazné, aby sa nedalo prehliadnuť. */
  const menu = (k, n, ph, A) => '<div class="lv-pole' + chyb(k) + '" data-pole-w="' + k + '"><label class="lv-l" for="lv-' + k + '">' + n + '</label><select id="lv-' + k + '" class="lv-sel' + (S[k] ? "" : " lv-pr") + '"><option value="">' + ph + "</option>" + A.map((x) => '<option value="' + x[0] + '"' + (x[0] === S[k] ? " selected" : "") + ">" + x[1] + "</option>").join("") + "</select></div>";
  const vetaVelkosti = () => { const x = VELKOSTI.find((y) => y.v === S.velkost); return x ? x.p : t("Dĺžka auta: M asi 4,9 m, L asi 5,1 m, XL asi 5,4 m."); };
  const zvolenaFarba = () => (S.vzor ? (FARBY[S.vzor] || []).find((f) => f.nm === S.farba) : null);
  const cenaDruhej = () => prc("farba2", "Lux Color " + LUX[0][0]);
  // ---- dlaždice s ponukou: rovnaké triedy ako rohož a boxy na autokobercoch (kufor-boxy.js), rozdiel oproti samostatnej cene je zľava v sete
  const velkostSetu = () => S.velkost || "M";
  const cenaRadu = () => prc("rozlozenie", rozSet(velkostSetu()));
  const cenaRohoze = () => prc("rohoz", ROHOZ[0]);
  /** Skutočná cena časti pri aktuálnom výbere: sama je za samostatnú cenu, s ďalšou časťou so zľavou. */
  const cenaRaduVyber = () => { const x = vyb(S), v = velkostSetu(); return x.p ? cenaRadu() : zaklad + prc("rozlozenie", x.k ? rozRadRohoz(v) : rozLen(v)); };
  const cenaRohozeVyber = () => { const x = vyb(S); return x.p || x.r ? cenaRohoze() : zaklad + prc("rohoz", ROHOZ_SAM); };
  const usporaRozlozenia = () => { const x = vyb(S); return (x.r ? SAMOSTATNE.rad[velkostSetu()] - cenaRaduVyber() : 0) + (x.k ? SAMOSTATNE.rohoz - cenaRohozeVyber() : 0); };
  const rUctu = (t, n, h) => '<span class="lcd1v-kb__r lcd1v-kb__r--' + t + '"><span class="lcd1v-kb__rn">' + n + '</span><span class="lcd1v-kb__rh">' + h + "</span></span>";
  const ucet = (samo, vSete, od, az) => '<span class="lcd1v-kb__ucet">' + (samo > vSete ? rUctu("samo", t("Samostatne"), (od ? t("od") + " " : "") + eur(samo)) + rUctu("zl", t("Výhoda v sete"), (az ? t("až") + " − " + eur(az) : "− " + eur(samo - vSete))) : "") + rUctu("sum", t("V sete"), (od ? t("od") + " " : "") + eur(vSete)) + "</span>";
  const percento = (samo, vSete) => (samo > vSete ? Math.round(((samo - vSete) / samo) * 100) : 0);
  const PRIDAT = '<span class="lv-tl"><span class="lv-tl-a">' + t("Pridať k setu") + '</span><span class="lv-tl-b">' + t("Odobrať") + "</span></span>";
  function karta(o) {
    const vnutro = (o.naj ? '<span class="lcd1v-kb__top">' + o.naj + (o.veta ? '<span class="lcd1v-kb__veta">' + o.veta + "</span>" : "") + "</span>" : "")
      + '<span class="lcd1v-kb__fot"><span class="lv-fotw">' + fotoKarta(o.foto) + (o.pct ? '<i class="lv-zlava">' + t("Zľava") + " −" + o.pct + " %</i>" : "") + "</span></span>"
      + '<span class="lcd1v-kb__tx"><span class="lcd1v-kb__nm">' + o.nm + '</span><span class="lcd1v-kb__po">' + o.po + "</span>" + (o.ben ? '<span class="lcd1v-kb__ben">' + o.ben + "</span>" : "") + (o.ucet || "") + (o.tl || "") + "</span>";
    const tr = "lcd1v-kb__karta lv-dl" + (o.naj ? " lcd1v-kb__karta--naj" : "") + (o.nie ? " lcd1v-kb__karta--nie" : "");
    if (o.vzdy) return '<div class="' + tr + ' lv-dl-vzdy" role="group" aria-label="' + o.nm + ", " + t("v cene") + '" aria-pressed="true">' + vnutro + "</div>";
    return '<button type="button" class="' + tr + '"' + o.atr + ">" + vnutro + "</button>";
  }
  const kartaVyber = (k, v, tog) => ' data-k="' + k + '" data-v="' + v + '"' + (tog ? ' data-tog="' + tog + '"' : "") + ' aria-pressed="' + (String(S[k]) === String(v)) + '"';
  function ponukaHtml() {
    const x = vyb(S), n = [x.p, x.r, x.k].filter(Boolean).length;
    const u = SAMOSTATNE.rad[velkostSetu()] - cenaRadu() + SAMOSTATNE.rohoz - cenaRohoze();
    if (!n) return t("Prosím, vyberte si aspoň jednu možnosť.");
    if (n > 1) return t("V sete ušetríte <b>{0}</b>", eur(usporaRozlozenia()));
    if (x.p) return t("Keď si pridáte 2. a 3. rad aj rohož do kufra, ušetríte <b>{0}</b>", eur(u));
    return t("Samostatne bez zľavy: <b>{0}</b>. Zľavu získate, keď si pridáte ďalšiu časť.", eur(x.r ? cenaRaduVyber() : cenaRohozeVyber()));
  }
  /** Bez výberu veľkostí ako pri autokobercoch: od najnižšej ceny, výhoda až do najvyššej úspory. Po potvrdení v okne presná suma. */
  function ucetBoxov(n) {
    const vybrane = pocetBoxov() === n && [1, 2].slice(0, n).every((i) => !!S["box" + i]);
    if (vybrane) {
      const vel = [1, 2].slice(0, n).map((i) => S["box" + i]);
      return { samo: vel.reduce((s, v) => s + SAMOSTATNE.box[v], 0), set: vel.reduce((s, v, i) => s + prcBox(n, i + 1, v), 0), od: false };
    }
    const set = BOXY.map((b) => [1, 2].slice(0, n).reduce((s, i) => s + prcBox(n, i, b.v), 0));
    const samo = BOXY.map((b) => SAMOSTATNE.box[b.v] * n);
    return { samo: Math.min.apply(null, samo), set: Math.min.apply(null, set), az: Math.max.apply(null, samo.map((x, i) => x - set[i])), od: true };
  }
  function kartaBoxov(n, nm, po, foto, naj) {
    const u = ucetBoxov(n);
    return karta({ atr: ' data-box-n="' + n + '" aria-haspopup="dialog" aria-pressed="' + (pocetBoxov() === n) + '"', nm, po, foto, pct: percento(u.samo, u.set), ucet: ucet(u.samo, u.set, u.od, u.az), naj: naj ? t("★ Najobjednávanejšie ★") : "", veta: naj ? t("Zákazníci si ich vyberajú najčastejšie") : "" });
  }
  const telo = {
    auto: () => pole("volant", t("Na ktorej strane máte volant?"), '<div class="lv-pi">' + VOLANT.map((v, i) => tl("volant", v, i ? t("Vpravo — UK") : t("Vľavo — EU"), "lv-s1")).join("") + "</div>")
      + '<hr class="lv-hr"><div class="lv-2 lv-2st"><div class="lv-pole"><span class="lv-l">' + t("Značka") + '</span><span class="lv-fix">Mercedes-Benz</span></div><div class="lv-pole"><span class="lv-l">' + t("Model") + '</span><span class="lv-fix">' + t("Trieda V") + "</span></div></div>"
      + '<div class="lv-2 lv-2st lv-2m">' + menu("rok", t("Aký je rok výroby?"), t("Vyberte rok"), roky.map((r) => [r, r])) + menu("velkost", t("Aká je veľkosť auta?"), t("Vyberte veľkosť"), VELKOSTI.map((x) => [x.v, x.t])) + "</div>"
      + '<p class="lv-veta" id="lv-veta">' + vetaVelkosti() + "</p>"
      + '<div class="lv-2 lv-2st">' + pole("rad2", t("Koľko máte sedadiel v 2. rade?"), seg("rad2", SEDADLA)) + pole("rad3", t("Koľko máte sedadiel v 3. rade?"), seg("rad3", SEDADLA)) + "</div>"
      + pole("dvere", t("Koľko máte posuvných bočných dverí?"), seg("dvere", DVERE, DVERE))
      + pole("stred", t("Čo máte medzi prednými sedadlami?"), seg("stred", STRED))
      + '<p class="lv-veta">' + t("Podlaha znamená, že medzi sedadlami nemáte lakťovú opierku ani chladničku.") + "</p>"
      + pole("stolcek", t("Máte v 2. alebo 3. rade stolček?"), seg("stolcek", STOLCEK, [t("Nie"), t("Áno")]))
      + pole("zasuvky", t("Máte pod sedadlami zásuvky (elektrické sedadlá)?") + ' <button type="button" class="lv-i" data-info="zasuvky" aria-haspopup="dialog" aria-label="' + t("Čo sú zásuvky pod sedadlami") + '">i</button>', seg("zasuvky", ZASUVKY, [t("Nie"), t("Áno")]))
      + '<p class="lv-veta">' + t("Zásuvky sú v podlahe, zapájajú sa do nich sedadlá 2. a 3. radu. Neviete si rady? Zavolajte nám na") + ' <a href="tel:' + TELEFON.replace(/\s/g, "") + '">' + TELEFON + "</a>.</p>",
    rozl: () => {
      const sR = SAMOSTATNE.rad[velkostSetu()], cR = cenaRadu(), sK = SAMOSTATNE.rohoz, cK = cenaRohoze();
      return '<div class="lcd1v-kb lv-dl-w' + (S.chybaju && !maVyber() ? " lv-chyba" : "") + '" data-lcd1v-kb="vclass"><div class="lcd1v-kb__volby">'
        + karta({ atr: kartaVyber("predok", "ano", "nie"), nm: t("Predné sedadlá"), po: t("Šofér a spolujazdec"), foto: "autokoberce-mercedes-v-class-jednovrstvove-predok", pct: percento(SAMOSTATNE.predok, zaklad), ucet: '<span class="lcd1v-kb__ucet">' + rUctu("samo", t("Odporúčaná cena"), eur(SAMOSTATNE.predok)) + rUctu("zl", t("Ušetríte"), "− " + eur(SAMOSTATNE.predok - zaklad)) + rUctu("sum", t("Naša cena"), eur(zaklad)) + "</span>", tl: PRIDAT })
        + karta({ atr: kartaVyber("rozl", "Z", "P"), naj: t("★ Najvýhodnejšie ★"), nm: t("2. a 3. rad"), po: t("Autokoberce až po kufor"), foto: "autokoberce-mercedes-v-class-cierne-2-rad-3-rad", pct: percento(sR, cR), ucet: ucet(sR, cR), tl: PRIDAT })
        + karta({ atr: kartaVyber("rohoz", "ano", "nie"), nm: t("Rohož do kufra"), po: t("Od sedadiel po okraj kufra"), foto: "koberec-do-kufra-mercedes-v-class-prazdny-kufor", pct: percento(sK, cK), ucet: ucet(sK, cK), tl: PRIDAT })
        + '</div><p class="lv-ponuka">' + ponukaHtml() + "</p></div>";
    },
    vzor: () => '<div class="lv-g lv-g3 lv-vzorky' + chyb("vzor") + '" data-pole-w="vzor">' + VZORY.map((v) => tl("vzor", v.id, '<img src="' + v.img + '" alt="" loading="lazy" width="350" height="206"><span>' + v.nm + "</span>", "lv-v1 lv-foto")).join("") + "</div>",
    farba: () => '<div class="lv-f' + chyb("farba") + '" data-pole-w="farba">' + (FARBY[S.vzor] || []).map((f) => tl("farba", f.nm, '<img src="' + nahlad(f.slug) + '" alt="" loading="lazy"><span>' + f.nm + "</span>", "lv-sw")).join("") + "</div>",
    druha: () => {
      if (S.predok === "nie") return '<p class="lv-p">' + t("Druhá vrstva sa dáva len k predným sedadlám, tie ste si nevybrali.") + "</p>";
      // CZ: „+ 3 750 Kč“ je dlhšie než „+ 150 €“, plus sa nesmie odtrhnúť od ceny (nezlomiteľná medzera)
      if (S.vrstva !== "ano") return htmlDruha((cz ? "+\u00a0" : "+ ") + eur(cenaDruhej()), S.vrstva === "nie");
      const f = zvolenaFarba(), odp = f ? f.lux : LUX[0][0];
      const poradie = [odp].concat(LUX.map((l) => l[0]).filter((n) => n !== odp));
      return '<div class="lv-dv"><span><b>' + t("Druhá vrstva k predným sedadlám") + "</b> + " + eur(cenaDruhej()) + '</span><button type="button" data-k="vrstva" data-v="nie">' + t("Nie, ďakujem") + "</button></div>"
        + pole("farba2", t("Prosím, vyberte si farbu 2. vrstvy"), '<div class="lv-f">' + poradie.map((n) => tl("farba2", n, (n === odp ? '<i class="lv-odp">' + t("Odporúčame") + "</i>" : "") + '<img src="' + nahlad("lux-color-" + n) + '" alt="" loading="lazy"><span>Lux Color ' + n + "</span>", n === odp ? "lv-sw lv-sw-odp" : "lv-sw")).join("") + "</div>");
    },
    boxy: () => '<div class="lcd1v-kb lv-dl-w' + chyb("boxy") + '" data-pole-w="boxy" data-lcd1v-kb="vclass-boxy"><div class="lcd1v-kb__volby">'
      + kartaBoxov(1, "1× box", t("Praktický organizér"), "boxy-do-kufra-mercedes-v-class-jeden-box-2")
      + kartaBoxov(2, "2× box", t("Dvojitá kapacita"), "boxy-do-kufra-mercedes-v-class-dva-boxy", true)
      + karta({ atr: kartaVyber("boxy", "0"), nie: true, nm: t("Nechcem"), po: t("Kufor bez organizérov"), ben: t("Kufor ostane voľný."), foto: "koberec-do-kufra-mercedes-v-class-prazdny-kufor" })
      + "</div></div>",
  };
  const kolko = () => KROKY.filter((k) => hotovy[k.id]()).length;
  /** Každý krok končí tlačidlom, len druhá vrstva sa najprv pýta Áno alebo Nie. */
  const ukazDalej = (k) => k.id !== "druha" || !!S.vrstva || S.predok === "nie";
  let zrusVideo = null;
  function krokoveTlacidlo(k) {
    return k.id === "boxy" ? t("Pokračujte k súhrnu") : t("Pokračujte ďalej");
  }
  function hlavicky() {
    const n = KROKY.length, h = kolko();
    cesta.innerHTML = '<ol class="lv-c-ol">' + KROKY.map((k, i) => {
      const ok = hotovy[k.id](), teraz = i === S.akt;
      const trieda = teraz ? "lv-teraz" : ok ? "lv-hot" : "";
      return '<li class="' + trieda + '"><button type="button" ' + (ok || teraz ? 'data-ot="' + i + '"' : "disabled") + '><i>' + (ok && !teraz ? "✓" : i + 1) + "</i><span>" + k.kr + "</span></button></li>";
    }).join("") + '<li class="' + (h === n ? "lv-teraz" : "") + '"><button type="button" ' + (h === n ? 'data-suhrn="1"' : "disabled") + "><i>" + (n + 1) + "</i><span>" + t("Košík") + "</span></button></li></ol>";
    root.querySelector(".lv-c2").textContent = eur(cenaSpolu());
    if (!cta.disabled) cta.textContent = h === n ? t("Vložte do košíka") : t("Dokončite výber");
    cta.classList.toggle("lv-hotovo", h === n);
    const r = riadkyRozpisu();
    const hotovoVsetko = h === n;
    rozpis.hidden = r.length < 2 || hotovoVsetko;
    rozpis.innerHTML = r.map((x) => "<li><span>" + x[0] + "</span><b>" + x[1] + "</b></li>").join("");
    lista.querySelector(".lcd1v-lista__suma").textContent = eur(cenaSpolu());
    lista.querySelector(".lcd1v-lista__popis").textContent = h === n ? t("Výber je hotový") : S.akt >= 0 ? t("Krok {0} z {1}", S.akt + 1, n) : "";
    // koniec výberu: rovnaká cenová karta ako pri základných autokobercoch, odporúčaná cena, naša cena, percento a úspora
    const u = uspora(), spolu = cenaSpolu();
    usetrite.hidden = !(u > 0) || hotovoVsetko;
    usetrite.querySelector("b").textContent = eur(u);
    spoluRiadok.hidden = hotovoVsetko;
    kartaCien.hidden = !hotovoVsetko;
    kartaCien.classList.toggle("lv-cc-1", !(u > 0));
    kartaCien.querySelector("s").textContent = eur(spolu + u);
    kartaCien.querySelector("b").textContent = eur(spolu);
    kartaCien.querySelector(".lv-cc-s").textContent = u > 0 ? "−" + Math.round((u / (spolu + u)) * 100) + " %" : "";
    kartaCien.querySelector(".lv-cc-p").textContent = u > 0 ? t("Ušetríte") + " " + eur(u) : "";
    kartaCien.querySelector(".lv-cc-l").innerHTML = r.map((x) => "<li><span>" + x[0] + "</span><b>" + x[1].replace("+ ", "") + "</b></li>").join("");
    tlacidloListy();
  }
  /** Na telefóne sa zelené tlačidlo v lište ukáže, len keď tlačidlo na konci kroku nie je na obrazovke. Pri Áno a Nie sa nebije so zeleným tlačidlom. */
  function tlacidloListy() {
    const n = KROKY.length, h = kolko();
    const kos = lista.querySelector(".lcd1v-lista__kos");
    kos.textContent = h === n ? t("Vložte do košíka") : t("Pokračujte ďalej");
    const ciel = root.querySelector(".lv-ot .lv-dalej") || (h === n ? cta : null);
    const r = ciel && ciel.getBoundingClientRect();
    const vidno = !!r && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight - 76;
    const ukaz = (h === n || !!(KROKY[S.akt] && ukazDalej(KROKY[S.akt]))) && !vidno;
    kos.hidden = !ukaz;
    lista.classList.toggle("lv-bez", !ukaz);
  }
  /** Rozpis ceny pod krokmi: zákazník vidí, za čo platí. */
  function riadkyRozpisu() {
    const r = [], x = vyb(S);
    if (x.p) r.push([t("Predné sedadlá"), eur(zaklad)]);
    if (x.r) r.push([t("2. a 3. rad"), (r.length ? "+ " : "") + eur(cenaRaduVyber())]);
    if (x.p && S.vrstva === "ano") r.push([t("Druhá vrstva"), "+ " + eur(cenaDruhej())]);
    if (x.k) r.push([t("Rohož do kufra"), (r.length ? "+ " : "") + eur(cenaRohozeVyber())]);
    [1, 2].slice(0, pocetBoxov()).forEach((i) => { if (S["box" + i]) r.push(["Box " + S["box" + i], "+ " + eur(prcBox(pocetBoxov(), i, S["box" + i]))]); });
    return r;
  }
  /** Cena pri zatvorenom kroku vedľa „Zmeniť“: zákazník vidí, za čo platí a koľko ušetril. */
  function cenaKroku(id) {
    const r = (s, t) => '<span class="lv-rc">' + (s ? "<s>" + eur(s) + "</s>" : "") + "<b>" + t + "</b></span>";
    if (id === "rozl") {
      const x = vyb(S);
      const v = (x.p ? zaklad : 0) + (x.r ? cenaRaduVyber() : 0) + (x.k ? cenaRohozeVyber() : 0), s = (x.p ? SAMOSTATNE.predok : 0) + (x.r ? SAMOSTATNE.rad[velkostSetu()] : 0) + (x.k ? SAMOSTATNE.rohoz : 0);
      return r(s > v ? s : 0, eur(v));
    }
    if (id === "vzor" || id === "farba") return '<span class="lv-rc lv-rc-0">' + t("v cene") + "</span>";
    if (id === "druha") return S.vrstva === "ano" && S.predok !== "nie" ? r(0, "+ " + eur(cenaDruhej())) : "";
    if (id === "boxy" && pocetBoxov() > 0) {
      const b = ucetBoxov(pocetBoxov());
      return r(b.samo > b.set ? b.samo : 0, "+ " + eur(b.set));
    }
    return "";
  }
  /** Čo zákazník ušetrí oproti samostatným cenám v tom, čo má vo výbere. */
  function uspora() {
    let u = usporaRozlozenia() + (vyb(S).p ? SAMOSTATNE.predok - zaklad : 0);
    [1, 2].slice(0, pocetBoxov()).forEach((i) => { if (S["box" + i]) u += SAMOSTATNE.box[S["box" + i]] - prcBox(pocetBoxov(), i, S["box" + i]); });
    return u;
  }
  const spravaKroku = (k) => (k.id === "auto" ? t("Prosím, doplňte označené údaje o aute.") : k.id === "rozl" ? t("Prosím, vyberte si aspoň jednu možnosť.") : k.id === "druha" ? (S.vrstva === "ano" ? t("Prosím, vyberte si farbu 2. vrstvy.") : t("Prosím, vyberte si Áno alebo Nie.")) : k.id === "boxy" ? t("Prosím, dokončite výber boxov.") : t("Prosím, vyberte si jednu z možností."));
  /** Kresba až od kroku, kde si zákazník niečo vyberá. Telefón: v otvorenom kroku nad tlačidlom, zákazník vidí zmenu bez posúvania. PC: ľavý stĺpec. */
  function umiestni() {
    nakres.classList.toggle("lv-uvod", S.akt === 0);
    if (!(window.matchMedia && window.matchMedia(MOBIL).matches)) { if (nakres.parentNode !== lavy) lavy.appendChild(nakres); return; }
    const ot = kor.querySelector(".lv-ot");
    const d = ot && ot.querySelector(".lv-dalej");
    if (d) ot.insertBefore(nakres, d);
    else if (ot) ot.parentNode.insertBefore(nakres, ot.nextSibling);
    else root.insertBefore(nakres, root.querySelector(".lv-suhrn"));
  }
  function kroky() {
    if (kor.contains(nakres)) lavy.appendChild(nakres); // innerHTML nižšie by kresbu zmazal
    kor.innerHTML = KROKY.map((k, i) => {
      const ok = hotovy[k.id]() && i !== S.akt;
      if (i === S.akt) return '<div class="lv-kr lv-ot" data-id="' + k.id + '"><div class="lv-k">' + t("Krok {0} z {1}", i + 1, KROKY.length) + '</div><div class="lv-t">' + k.ti + "</div><span class=\"lv-ciara\"></span>" + (k.pod ? '<p class="lv-p">' + k.pod + "</p>" : "") + telo[k.id]() + (S.chybaju ? '<p class="lv-spr">' + spravaKroku(k) + "</p>" : "") + (ukazDalej(k) ? '<button type="button" class="lv-dalej" data-dalej="1">' + krokoveTlacidlo(k) + "</button>" : "") + "</div>";
      return '<div class="lv-kr' + (ok ? " lv-ho" : "") + '"><button type="button" class="lv-r" ' + (ok ? 'data-ot="' + i + '"' : "disabled") + '><span class="lv-c-k">' + (ok ? "✓" : i + 1) + '</span><span class="lv-r-t"><b>' + k.nm + "</b><small>" + (ok ? suhrn[k.id]() : k.vy) + "</small></span>" + (ok ? '<span class="lv-rr">' + cenaKroku(k.id) + '<span class="lv-z">' + t("Zmeniť") + "</span></span>" : "") + "</button></div>";
    }).join("");
    umiestni();
    hlavicky();
    prekresli();
    if (zrusVideo) zrusVideo();
    zrusVideo = KROKY[S.akt] && KROKY[S.akt].id === "druha" ? ozivVideo(kor) : null;
  }
  function posunNa(prvok, vzdy) {
    if (!prvok || !prvok.getBoundingClientRect) return;
    const r = prvok.getBoundingClientRect();
    const hl = 96;
    if (vzdy || r.top < hl || r.top > window.innerHeight * 0.7) window.scrollTo({ top: window.pageYOffset + r.top - hl, behavior: "smooth" });
  }
  /** Chýbajúci výber: vidno celý krok a v ňom červeno označené pole (Michal 7. 11. 2026). Keď je krok vyšší ako okno, ostáva vidno pole aj tlačidlo. */
  function ukazCelyKrok() {
    const ot = kor.querySelector(".lv-ot");
    if (!ot) return;
    const hl = 96, vyska = window.innerHeight - hl - (mobil.matches ? 90 : 16);
    const r = ot.getBoundingClientRect();
    let zn = kor.querySelectorAll(".lv-ot .lv-chyba");
    if (!zn.length) zn = kor.querySelectorAll(".lv-ot .lv-spr");
    let y = r.top - hl;
    if (r.height > vyska && zn.length && zn[zn.length - 1].getBoundingClientRect().bottom - r.top > vyska) {
      const a = zn[0].getBoundingClientRect();
      y = r.bottom - hl - vyska;
      if (a.top - y < hl) y = a.top - hl - 12;
    }
    window.scrollTo({ top: window.pageYOffset + y, behavior: "smooth" });
  }
  /** Hotový výber (Michal 8. 11. 2026): dole na súhrn, nie hore na zoznam krokov. Na obrazovke je kresba „Váš set“, čierna karta
   *  „Váš set je hotový“ s cenou a zelené „Vložte do košíka“. PC: kresba je prilepená v ľavom stĺpci, posun len toľko, aby bolo
   *  vidno kartu aj tlačidlo. Telefón a tablet: kresba je nad kartou (umiestni), hore od nej. Keď sa nezmestí všetko (nízky
   *  telefón, tablet), kresba ostáva celá a vidno cenu; „Vložte do košíka“ vtedy ponúka lišta dole (tlacidloListy). */
  function posunNaSuhrn() {
    const tel = !!mobil.matches;
    // rezerva hore aj na telefóne: iPhone kreslí stránku aj pod hodiny a zmenšený riadok adresy (Michalova snímka 8. 11.)
    const hore = 96;
    // lišta dole: bez tlačidla je nižšia, ale keď „Vložte do košíka“ pod kartou nebude vidno, tlačidlo v nej pribudne (+26 px)
    const lh = tel ? lista.offsetHeight + (lista.classList.contains("lv-bez") ? 26 : 0) || 72 : 0;
    const dole = window.innerHeight - lh - (tel ? 10 : 16);
    const kartaVidno = !kartaCien.hidden;
    const karta = (kartaVidno ? kartaCien : root.querySelector(".lv-suhrn")).getBoundingClientRect();
    const ctaDole = cta.getBoundingClientRect().bottom;
    let y;
    if (tel && root.contains(nakres)) {
      const zac = nakres.getBoundingClientRect().top;
      y = Math.min(Math.max(zac - hore, ctaDole - dole), zac - 8); // tlačidlo, ak sa zmestí aj s celou kresbou
      const cena = kartaVidno ? kartaCien.querySelector(".lv-cc-g").getBoundingClientRect().bottom : karta.top;
      y = Math.min(Math.max(y, cena - dole), karta.top - 8); // cena je na obrazovke vždy
    } else {
      y = Math.min(Math.max(kor.getBoundingClientRect().top - hore, ctaDole - dole), karta.top - hore);
    }
    window.scrollTo({ top: Math.max(0, window.pageYOffset + y), behavior: "smooth" });
    planLista(); // bublina chatu aj bez posunu (už je na mieste)
  }
  function dalej() {
    const d = KROKY.findIndex((k) => !hotovy[k.id]());
    S.akt = d >= 0 ? d : -1;
    S.chybaju = false;
    kroky();
    if (d >= 0) posunNa(kor.querySelector(".lv-ot"));
    else posunNaSuhrn();
  }
  function oznac() {
    kor.querySelectorAll("button[data-k]").forEach((b) => b.setAttribute("aria-pressed", String(S[b.getAttribute("data-k")]) === b.getAttribute("data-v") ? "true" : "false"));
    kor.querySelectorAll("[data-pole-w]").forEach((p) => { if (S[p.getAttribute("data-pole-w")]) p.classList.remove("lv-chyba"); });
    if (!kor.querySelector(".lv-chyba")) { const m = kor.querySelector(".lv-ot .lv-spr"); if (m) m.parentNode.removeChild(m); }
    const pon = kor.querySelector(".lv-ponuka");
    if (pon) pon.innerHTML = ponukaHtml();
    if (maVyber()) { const w = kor.querySelector(".lv-dl-w.lv-chyba:not([data-pole-w])"); if (w) { w.classList.remove("lv-chyba"); const m = kor.querySelector(".lv-ot .lv-spr"); if (m) m.parentNode.removeChild(m); } }
    hlavicky();
  }

  // ---- udalosti
  let casovac = 0;
  function nastav(k, v) {
    S[k] = v;
    if (k === "vzor") { const zostava = (FARBY[v] || []).some((f) => f.nm === S.farba); if (!zostava) S.farba = ""; }
    if (k === "vrstva" && v === "nie") S.farba2 = "";
    if (k === "vrstva" && v === "ano" && !S.farba2) { const f = zvolenaFarba(); S.farba2 = f ? f.lux : ""; }
    if (k === "boxy") { [1, 2, 3].forEach((i) => { if (i > Number(v)) S["box" + i] = ""; }); if (v === "0") S.boxFarba = ""; }
    spr.hidden = true;
    sync();
    S.chybaju = false;
    if (k === "vrstva" || k === "boxy" || k === "predok") kroky(); else oznac();
    prekresli();
    uloz();
    clearTimeout(casovac);
    if (k === "vrstva" && v === "nie") casovac = setTimeout(() => { if (!zruseny) dalej(); }, 240);
  }
  /** Lišta na telefóne robí to isté ako „Pokračujte ďalej“: nedokončený krok ukáže, čo ešte chýba. */
  function poKroku() {
    const k = KROKY[S.akt];
    if (k && k.id === "rozl") S.rozlOk = true;
    if (k && hotovy[k.id]()) { spr.hidden = true; dalej(); uloz(); return; }
    if (!k) { const d = KROKY.findIndex((x) => !hotovy[x.id]()); if (d < 0) { doKosika(); return; } S.akt = d; }
    S.chybaju = true;
    kroky();
    ukazCelyKrok();
  }
  // ---- okienko pri otázke (ikona i): koliesko a prst neposúvajú stránku za ním
  let infoOkno = null;
  function zavriInfo() {
    if (!infoOkno) return;
    const { o, tl, esc } = infoOkno;
    infoOkno = null;
    document.removeEventListener("keydown", esc);
    if (o.parentNode) o.parentNode.removeChild(o);
    if (tl && tl.focus) tl.focus();
  }
  function ukazInfo(tl) {
    const inf = INFO[tl.getAttribute("data-info")];
    if (!inf) return;
    zavriInfo();
    const o = document.createElement("div");
    o.className = "lv-info";
    o.innerHTML = '<div class="lv-info-p" role="dialog" aria-modal="true" aria-label="' + inf.nm + '"><button type="button" class="lv-info-x" aria-label="' + t("Zavrieť") + '">×</button><img src="' + OBS + inf.img + '" alt="' + inf.alt + '"><b>' + inf.nm + "</b><p>" + inf.text + "</p><p>" + t("Neviete si rady? Zavolajte nám na") + ' <a href="tel:' + TELEFON.replace(/\s/g, "") + '">' + TELEFON + "</a>.</p></div>";
    o.addEventListener("click", (e) => { if (e.target === o || (e.target.closest && e.target.closest(".lv-info-x"))) zavriInfo(); });
    ["wheel", "touchmove"].forEach((u) => o.addEventListener(u, (e) => e.preventDefault(), { passive: false }));
    const esc = (e) => { if (e.key === "Escape") zavriInfo(); };
    document.addEventListener("keydown", esc);
    document.body.appendChild(o);
    infoOkno = { o, tl, esc };
    o.querySelector(".lv-info-x").focus();
  }
  function naKlik(e) {
    const a = e.target.closest && e.target.closest('a[href="#product-detail-form"]');
    if (a) {
      e.preventDefault();
      const vel = a.getAttribute("data-lv-velkost");
      if (vel && S.velkost !== vel) { S.velkost = vel; S.akt = 0; sync(); kroky(); prekresli(); uloz(); }
      posunNa(cesta, true);
      return;
    }
    if (e.target.closest && e.target.closest("#lcd1v-lista .lcd1v-lista__kos")) { poKroku(); return; }
    const dl = e.target.closest && e.target.closest(".lcd1v-druha__dlazdica");
    if (dl && root.contains(dl) && !(e.target.closest("button"))) { nastav("vrstva", "ano"); return; }
    const b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (hero.contains(b)) {
      if (b.classList.contains("lh-cta")) { posunNa(cesta, true); return; }
      if (b === pauzaTl) {
        videoPauza = !videoPauza;
        if (videoPauza) video.pause(); else hraj();
        pauzaTl.classList.toggle("lh-hraj", videoPauza);
        pauzaTl.setAttribute("aria-label", videoPauza ? t("Spustiť video") : t("Zastaviť video"));
      }
      return;
    }
    if (!root.contains(b) && !cesta.contains(b)) return;
    if (b.hasAttribute("data-info")) { ukazInfo(b); return; }
    if (b.hasAttribute("data-okno")) { otvorOkno(b, () => nastav("vrstva", "ano")); return; }
    if (b.hasAttribute("data-box-n")) { const n = Number(b.getAttribute("data-box-n")); okno.otvor(n, { farba: S.boxFarba, box1: S.box1, box2: S.box2 }, b); return; }
    if (b.hasAttribute("data-k")) {
      const k = b.getAttribute("data-k"), v = b.getAttribute("data-v"), tog = b.getAttribute("data-tog");
      nastav(k, tog && String(S[k]) === v ? tog : v);
      return;
    }
    if (b.hasAttribute("data-ot")) { clearTimeout(casovac); S.akt = +b.getAttribute("data-ot"); S.chybaju = false; kroky(); posunNa(kor.querySelector(".lv-ot")); return; }
    if (b.hasAttribute("data-suhrn")) { S.akt = -1; kroky(); posunNaSuhrn(); return; }
    if (b.hasAttribute("data-dalej")) { poKroku(); return; }
    if (b === cta) doKosika();
  }
  function naZmenu(e) {
    const id = e.target && e.target.id;
    if (id !== "lv-rok" && id !== "lv-velkost") return;
    S[id.slice(3)] = e.target.value;
    e.target.classList.toggle("lv-pr", !e.target.value);
    spr.hidden = true;
    sync();
    const veta = root.querySelector("#lv-veta");
    if (veta) veta.textContent = vetaVelkosti();
    oznac();
    prekresli();
    uloz();
  }
  function doKosika() {
    const ch = KROKY.findIndex((k) => !hotovy[k.id]());
    if (ch >= 0) {
      S.akt = ch; S.chybaju = true; kroky();
      spr.hidden = false; spr.textContent = t("Ešte chýba: {0}.", KROKY[ch].nm);
      ukazCelyKrok();
      return;
    }
    sync();
    const prazdne = Array.prototype.filter.call(form.querySelectorAll("select.surcharge-parameter"), (s) => s.required && !s.value);
    if (prazdne.length) { console.error("[lcd-1v] vclass: prázdne príplatky", prazdne.length); return; }
    // poznámka objednávky a rozpis v košíku berú auto z tejto karty (main.js toNote, autoPamat.js)
    try {
      // Model presne ako v katalógu áut (data.json), inak ho main.js pri ďalšej stránke zmaže ako neplatný
      sessionStorage.setItem("Brand", "Mercedes-Benz");
      sessionStorage.setItem("Model", MODELY[S.velkost]);
      sessionStorage.setItem("Year", S.rok);
      sessionStorage.removeItem("carType");
      sessionStorage.setItem("model", "Mercedes-Benz " + MODELY[S.velkost] + " " + S.rok);
    } catch (e) { /* súkromný režim: príplatky v položke aj tak nesú celý výber */ }
    cta.disabled = true;
    cta.textContent = t("Vkladám do košíka…");
    tlacidlo.click();
    clearTimeout(casovac);
    casovac = setTimeout(() => { if (!zruseny) { cta.disabled = false; hlavicky(); } }, 3000);
  }
  // lišta sa ukáže, keď je zákazník pri krokoch; bublina chatu sa zdvihne nad ňu (rovnaké triedy ako cena.js)
  let listaOn = false, naListu = 0;
  function obnovListu() {
    naListu = 0;
    if (zruseny) return;
    tlacidloListy();
    const on = !!mobil.matches && cesta.getBoundingClientRect().top < window.innerHeight * 0.55;
    if (on !== listaOn) {
      listaOn = on;
      lista.classList.toggle("on", on);
      document.body.classList.toggle("lcd1v-lista-on", on);
    }
    const f = document.querySelector('iframe[title="Luxia chat"]');
    const c = f && f.getBoundingClientRect();
    const bublina = !!(c && c.height > 0 && c.height <= 130);
    document.body.classList.toggle("lcd1v-bublina", bublina);
    // bublina ustúpi z čiernej karty s cenami a z „Vložte do košíka“ (Michal 8. 11. 2026, telefón), ako v košíku (cart.js);
    // karta s tlačidlom je jeden súvislý pás, takže pri rolovaní cez ňu bublina nepreblikáva; otvorený chat sa neskrýva
    let skry = false;
    if (bublina && !kartaCien.hidden) {
      const a = kartaCien.getBoundingClientRect(), b = cta.getBoundingClientRect();
      skry = c.left < Math.max(a.right, b.right) && c.right > Math.min(a.left, b.left) && c.top < Math.max(a.bottom, b.bottom) && c.bottom > a.top;
    }
    document.body.classList.toggle("lcd1v-vclass-bez-bubliny", skry);
  }
  const planLista = () => { if (!naListu) naListu = requestAnimationFrame(obnovListu); };
  window.addEventListener("scroll", planLista, { passive: true });
  document.addEventListener("click", naKlik);
  document.addEventListener("change", naZmenu);
  const naKosik = () => { if (!zruseny) { cta.disabled = false; hlavicky(); } };
  document.addEventListener("ShoptetCartUpdated", naKosik);
  let naResize = 0;
  const priZmene = () => { clearTimeout(naResize); naResize = setTimeout(() => { rozsir(); umiestni(); prekresli(); obnovListu(); }, 200); };
  window.addEventListener("resize", priZmene);

  function zrus() {
    if (zruseny) return;
    zruseny = true;
    clearTimeout(casovac);
    clearTimeout(naResize);
    cancelAnimationFrame(plan);
    spat.forEach((f) => { try { f(); } catch (e) { /* nič */ } });
    document.removeEventListener("click", naKlik);
    document.removeEventListener("change", naZmenu);
    document.removeEventListener("ShoptetCartUpdated", naKosik);
    window.removeEventListener("resize", priZmene);
    window.removeEventListener("scroll", planLista);
    if (zrusVideo) zrusVideo();
    zrusOkno();
    zavriInfo();
    if (zrusObsah) zrusObsah();
    if (ioVideo) ioVideo.disconnect();
    video.pause();
    okno.zrus();
    document.body.classList.remove("lcd1v-lista-on", "lcd1v-bublina", "lcd1v-vclass-bez-bubliny");
    if (h1) h1.innerHTML = h1Html;
    if (hlavicka && povodne.rodic) povodne.rodic.insertBefore(hlavicka, povodne.za && povodne.za.parentNode === povodne.rodic ? povodne.za : null);
    [root, nakres, hero, cesta, lista, styl].forEach((x) => { if (x.parentNode) x.parentNode.removeChild(x); });
    document.body.classList.remove("lcd-vclass");
  }

  const prvy = KROKY.findIndex((k) => !hotovy[k.id]());
  S.akt = prvy;
  rozsir();
  sync();
  kroky();
  prekresli();
  obnovListu();
  const zrusObsah = ozivObsah({
    prc, zaklad, eur,
    // „Chcem takýto set“ v prehliadke auta: vzor a farba idú rovno do krokov
    vyberFarbu: (vzor, farba) => { S.vzor = vzor; S.farba = farba; spr.hidden = true; sync(); kroky(); uloz(); posunNa(cesta, true); },
  });
  window.__lcdVclass = { S, sel, zrus, cenaSpolu }; // ladenie a test
  return { zrus };
}
