// Nový vzhľad 1V — OBSAH POD KONFIGURÁTOROM pre všetky SK produkty z registra (návrhy jednovrstvove, dvojvrstvove,
// kufor-classic, kufor-premium, boxy). JADRO (T0.3, 14. 10. 2026) — mení len vydanie. Pravidlá: docs/1v-obsah.md.
//
// Obsah je STATICKÉ HTML (admin-html/src/p1v-<kľúč>/ -> dist/p1v-<kľúč>-1|2.sk.html), JS ho len umiestni a oživí.
// Kľúč obsahu = ctx.produkt.obsah z registra (produkty.js): "598" pre 598/610/613 (jeden obsah pre jednovrstvové),
// "dvoj" 601/604/607, "classic" 619/622/625, "premium" 628/631/634, "boxy" 616, "vzorky" 637. Čísla a odkazy, ktoré
// závisia od vzoru alebo ceny, dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz) zo živých dát.
//
// Odkiaľ sa obsah vezme (beží len pod bránou index.js: flag ?novy=1 + zapnutý typ, alebo ?novy=vyvoj):
//   a) korene [data-lcd-cast^="p1v-<kľúč>-"] už sú v DOM (po spustení pre všetkých: Popis produktu; starší test: banner
//      v pätičke) -> použijú sa tie (umiestnia sa synchrónne, ako doteraz);
//   b) inak, keď OBSAH_CDN (rozhodnutia D1 = b, skúšobná fáza): kusy sa stiahnu z CDN z TEJ ISTEJ verzie ako bundle —
//      …/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html (sha z adresy luxuryCar.js; .github/workflows/production.yml ich tam
//      kopíruje z admin-html/dist). Bez flagu sa nič nesťahuje (obsah.js vôbec nebeží) a HTML stránky sa nemení.
//      Michal 25. 10. 2026 (rýchlosť, docs/1v-rychlost.md): sťahovanie začne už pri spustení bundla (index.js volá
//      predstiahni() za tou istou bránou), nie až po postavení konfigurátora; konfigurátor na obsah nikdy nečaká.
// Kus bez sekcií (len stuby) = nič: starý popis ostáva, nič sa neskrýva.
// Pod body.lcd-1v potom (Michal 25. 10. 2026, rýchlosť: ako titulka — konfigurátor sa ukáže hneď, obsah postupne):
//   1. každý kus sa vloží vo VLASTNEJ úlohe po vykreslení konfigurátora, hneď ako príde (kus 1 nečaká na kus 2); kus 2 sa
//      pripojí za kus 1 aj keď príde skôr (poradie kus 1, kus 2). Korene idú do .p1v-miesto hneď pred záložky
//      Popis/Diskusia (.p-detail > .shp-tabs-wrapper) = priamo pod konfigurátor; prázdny stĺpec pätičky (starý test)
//      dostane data-p1v-prazdny; šírka miesta sa zmeria PRED vložením obsahu (žiadne vynútené prepočítanie rozloženia);
//   2. body dostane .lcd-1v-obsah -> CSS (LCD-1V-OBSAH) ukáže korene a skryje starý popis (záložky);
//   3. obsah-cisla.js dosadí čísla a odkazy kusu (synchrónne skryje nedosadené, kým sa nezistia — Diamond na Hexa nikdy);
//   4. moduly skupín A–D (obsah-a.js … obsah-d.js) a modul typu (obsah-dvoj/-classic/-premium/-boxy.js) sa volajú PO
//      SEKCIÁCH: init(oc) dostane `oc`, v ktorom oc.sekcia(meno) vráti len tú jednu sekciu, ktorá sa práve oživuje
//      (ostatné null — rovnako ako stub); oc.najdiSekciu(meno) hľadá v celom obsahu (napr. cieľ odkazu pri kliku).
//      Po vložení kusu sa oživia VŠETKY sekcie postupne v poradí dokumentu, každá vo vlastnej úlohe v nečinnosti
//      (requestIdleCallback s limitom, inak setTimeout 0) — hlavné vlákno sa medzi sekciami uvoľní; sekcia blízko okna
//      (OKRAJ_OZIVENIA = 1,5 výšky okna) má prednosť, sekcia už vo výreze sa oživí hneď. Pomocné sekcie (*-pomocne: okno
//      na fotky, linka čítania) a spoločné časti modulov (init s oc bez sekcií) sa oživia hneď pri vložení. Časti, od
//      ktorých závisí VÝŠKA sekcie (výška scény, karty recenzií, vzorky farieb, riadok ceny), robí modul už pri vložení
//      (voliteľné vlozenie(oc), lacné a bez čítania rozloženia) — výšky sú hneď konečné. Oživenie aj neskoršie zmeny
//      modulov (oc.ukotvi) sú ručne ukotvené: obsah v okne neposkočí ani bez scroll anchoring (Safari);
//   5. reveal .rv: jeden IntersectionObserver (žiadne čítanie polôh pri vložení); čo je vo výreze alebo nad ním, dostane
//      .on hneď pri prvom hlásení, až potom obal sekcie dostane .p1v-rv (dovtedy je všetko viditeľné).
// Chyba: cesta a) -> ctx.chyby (index.js zloží celý nový vzhľad, ako doteraz); vloženie kusu (cesta b) -> chyba ide do
// ctx.chyby a vráti sa LEN obsah (miesto preč, starý popis späť). Chyba pri vložení/oživení sekcie v module ide do
// ctx.chyby, sekcia ostane statická a viditeľná (obsah sa pod zákazníkom nezloží).
// Žiadny živý DOM sa nemaže (záložky ostávajú v DOM, len skryté; JS na ne kotví — main.js, popisModuly.js).
// Stav pre test a ladenie: window.__lcd1v.obsah = { kluc, zdroj: "dom"|"cdn"|null, stav, kusy, hotovo (Promise),
// cisla (Promise), neozivene() -> mená sekcií, ktoré sa ešte neoživili, vyrovnane: { pocet, px, merania } — ručné
// vyrovnania polohy okna (Chrome so scroll anchoring 0) a koľkokrát sa kvôli kotve čítalo rozloženie }.
import { lcdMultiKoren } from "../../functions/lcdOziv.js";
import { OBRAZKY_1V } from "./ctx.js";
import * as cisla from "./obsah-cisla.js";
import * as skupinaA from "./obsah-a.js";
import * as skupinaB from "./obsah-b.js";
import * as skupinaC from "./obsah-c.js";
import * as skupinaD from "./obsah-d.js";
import * as typDvoj from "./obsah-dvoj.js";
import * as typClassic from "./obsah-classic.js";
import * as typPremium from "./obsah-premium.js";
import * as typBoxy from "./obsah-boxy.js";
import * as typKamiony from "./obsah-kamiony.js";

export const MENO = "obsah";
/** Obrázky obsahu: repo assets/img/1v/obsah/<meno> = CDN …/eshopy/luxuryCar/assets/img/1v/obsah/<meno> */
export const OBRAZKY_OBSAH = OBRAZKY_1V + "obsah/";
export const TRIEDA_OBSAH = "lcd-1v-obsah";
/**
 * D1 = b: kusy z CDN verzie bundle (len pod bránou). false = len korene, ktoré už sú v DOM (Popis po spustení).
 * Zapnuté pri integrácii vlny WA (14. 10. 2026, prvé vydanie podľa plan.md §2.6 bod 2): runnery, ktoré na živej
 * stránke vymieňajú luxuryCar.js (tools/test-konfigurator-1v.mjs, tools/test-boxy-prepni.mjs), kusy
 * …/v/<sha>/html/p1v-*.sk.html pri lokálnom builde obslúžia samy (prázdny koreň = obsah „nic“, konfigurátor sa testuje
 * bez obsahu); test obsahu (tools/test-1v/obsah-spolocne.mjs) ich obsluhuje z lokálneho admin-html/dist.
 * Prepnutie späť bez úpravy kódu: esbuild --define:LCD_OBSAH_CDN=false.
 */
/* global LCD_OBSAH_CDN */
export const OBSAH_CDN = typeof LCD_OBSAH_CDN === "boolean" ? LCD_OBSAH_CDN : true;
/** Počet kusov každého kľúča: -1 = sekcie 10–29, -2 = 30–49 (admin-html/ciele.json; build to kontroluje). */
export const KUSY = 2;
/** Modul typu podľa kľúča obsahu (beží po A–D); "598" a "vzorky" vlastný modul nemajú. */
const MODUL_TYPU = { dvoj: typDvoj, classic: typClassic, premium: typPremium, boxy: typBoxy, kamiony: typKamiony };
/** bundle verzie: …/assets/v/<sha>/js/luxuryCar.js -> …/assets/v/<sha>/ (len https; nevyverzovaný bundle = null) */
const RE_BUNDLE = /^(https:\/\/[^?#]+\/assets\/v\/[A-Za-z0-9._-]+\/)js\/luxuryCar\.js(?:[?#]|$)/;
/**
 * Michal 25. 10. 2026 (rýchlosť): sekcia, ktorá je od okna bližšie než 1,5 jeho výšky, sa oživí (moduly A–D a typu)
 * prednostne — na pomalom telefóne má dosť času byť hotová skôr, než ju zákazník uvidí. Ostatné idú za ňou v poradí
 * dokumentu, keď je prehliadač nečinný (revízia F1). Výšky sekcií sú konečné už od vloženia (vlozenie(oc) modulov),
 * oživenie pridáva len správanie (poslucháče, animácie) — preto vzdialené sekcie nemusia tlačiť na hlavné vlákno.
 */
const OKRAJ_OZIVENIA = "150% 0px";
/** Reveal .rv: rovnaký okraj ako doteraz (prvok sa odhalí, keď je nad spodnými 8 % okna). */
const OKRAJ_ODHALENIA = "0px 0px -8% 0px";
/** Najdlhšie čakanie na nečinnosť pred oživením sekcie blízko okna (ms). */
const LIMIT_NECINNOSTI = 200;
/** … a vzdialenej sekcie (ms): pri načítaní (konfigurátor, merače) neberie čas ničomu, čo zákazník práve potrebuje. */
const LIMIT_NECINNOSTI_DALEKO = 1500;

/** Kľúč obsahu produktu (register produkty.js -> obsah), inak productId. */
export function klucObsahu(ctx) {
  return String((ctx && ctx.produkt && ctx.produkt.obsah) || (ctx && ctx.productId) || "");
}

/** Statické korene obsahu kľúča v poradí kusov (p1v-<kľúč>-1, p1v-<kľúč>-2, …) v rodičovi (predvolene dokument). */
export function koreneObsahu(kluc, rodic) {
  const pred = "p1v-" + kluc + "-";
  return Array.prototype.filter
    .call((rodic || document).querySelectorAll("[data-lcd-cast]"), (el) => /^\d+$/.test((el.getAttribute("data-lcd-cast") || "").slice(pred.length)) && (el.getAttribute("data-lcd-cast") || "").indexOf(pred) === 0)
    .sort((a, b) => Number(a.getAttribute("data-lcd-cast").slice(pred.length)) - Number(b.getAttribute("data-lcd-cast").slice(pred.length)));
}

/** Adresa priečinka html/ verzie, z ktorej beží bundle (…/assets/v/<sha>/html/), alebo null. */
export function zakladHtml() {
  const s = Array.prototype.map.call(document.scripts || [], (x) => x.src || "").find((src) => RE_BUNDLE.test(src));
  return s ? RE_BUNDLE.exec(s)[1] + "html/" : null;
}

/** Adresy kusov kľúča na CDN (SK; CZ obsah 1V nemá) alebo [] keď bundle nie je z verzie v/<sha>/. */
export function adresyKusov(kluc) {
  const z = zakladHtml();
  if (!z || !kluc) return [];
  const out = [];
  for (let n = 1; n <= KUSY; n++) out.push(z + "p1v-" + kluc + "-" + n + ".sk.html");
  return out;
}

/** HTML kusu -> koreň (inertný <template>: nič sa nesťahuje ani nespúšťa, kým sa koreň nevloží) alebo null. */
function korenZHtml(html, cast) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content.querySelector('[data-lcd-cast="' + cast + '"]');
}

/** Jeden kus z CDN -> Promise(HTML | null); chyba siete / 404 = ten kus chýba. */
function stiahniKus(u) {
  return fetch(u, { credentials: "omit" })
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);
}

/** Kusy stiahnuté vopred pri spustení bundla: { kluc, texty: [Promise(HTML | null)] } alebo null. */
let vopred = null;

/**
 * Michal 25. 10. 2026 (rýchlosť): volá index.js hneď pri spustení bundla za tou istou bránou ako initKonfigurator1v
 * (flag karty + register). Len začne sťahovať kusy (žiadny DOM, trieda ani handler); init() ich potom prevezme a
 * nesťahuje znova. Konfigurátor (data.json, moduly) na ne nečaká. Korene v DOM (cesta a) alebo CZ = nič.
 * @param {{ projectId, productId, language }} kontext getShoptetContext()
 * @param {{ id, obsah }} produkt záznam registra (produkty.js produkt1v)
 */
export function predstiahni(kontext, produkt) {
  if (vopred || !OBSAH_CDN || !kontext || !produkt) return;
  // trh ako ctx.js (vytvorCtx): 704436 = CZ test, inak jazyk stránky
  const jazyk = String(kontext.projectId) === "704436" ? "cs" : kontext.language || document.documentElement.lang || "sk";
  if (jazyk === "cs") return;
  const kluc = klucObsahu({ produkt, productId: kontext.productId });
  if (!kluc || koreneObsahu(kluc).length) return;
  const adresy = adresyKusov(kluc);
  if (!adresy.length) return;
  vopred = { kluc, texty: adresy.map(stiahniKus) };
}

const maSekcie = (korene) => korene.some((k) => !!k.querySelector("[data-lcd-sekcia]"));
const pole = (x) => Array.prototype.slice.call(x || []);

/** Kam patrí miesto: hneď pred záložky produktu, inak na koniec .p-detail, inak #content / body. */
function cielMiesta() {
  const zalozky = document.querySelector(".p-detail > .shp-tabs-wrapper") || document.querySelector(".shp-tabs-wrapper");
  if (zalozky && zalozky.parentNode) return { rodic: zalozky.parentNode, pred: zalozky };
  const detail = document.querySelector(".p-detail");
  return { rodic: detail || document.querySelector("#content") || document.body, pred: null };
}

/**
 * Šírka a posun miesta na celú šírku stránky podľa .overall-wrapper (--p1v-sirka, --p1v-vlavo; CSS LCD-1V-OBSAH bod 4).
 * Shoptet ho nemusí mať presne cez okno (posuvník, bočné odsadenie).
 */
function rozmerMiesta(rodic) {
  const obal = document.querySelector(".overall-wrapper") || document.body;
  if (!obal || !rodic) return null;
  const o = obal.getBoundingClientRect(), r = rodic.getBoundingClientRect(), cs = getComputedStyle(rodic);
  const lavo = r.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0);
  // presne (nie zaokrúhlené): rodič má pri niektorých šírkach polovičné px (Math.round(-44.5) = -44 -> miesto o 1 px vpravo)
  return { sirka: +o.width.toFixed(2) + "px", vlavo: +(o.left - lavo).toFixed(2) + "px" };
}
function nastavRozmer(miesto, x) {
  if (!x) return;
  miesto.style.setProperty("--p1v-sirka", x.sirka);
  miesto.style.setProperty("--p1v-vlavo", x.vlavo);
}

/**
 * Miesto pod konfigurátorom; vytvorí sa raz. Michal 25. 10. 2026 (rýchlosť): rozmer sa zmeria PRED vložením miesta aj
 * obsahu (rozloženie je ešte z posledného vykreslenia — žiadne vynútené prepočítanie celej stránky s novým obsahom);
 * šírka ani ľavý okraj rodiča od obsahu pod ním nezávisia. Po zmene veľkosti okna sa meria znova (ako doteraz).
 */
function miestoObsahu() {
  let m = document.querySelector(".p1v-miesto");
  if (m) return m;
  const c = cielMiesta();
  const rozmer = rozmerMiesta(c.rodic);
  m = document.createElement("div");
  m.className = "p1v-miesto";
  nastavRozmer(m, rozmer);
  if (c.pred) c.rodic.insertBefore(m, c.pred);
  else c.rodic.appendChild(m);
  const miesto = m;
  window.addEventListener("resize", () => { if (miesto.parentElement) nastavRozmer(miesto, rozmerMiesta(miesto.parentElement)); }, { passive: true });
  return m;
}

/** Spustí fn(el) raz, keď sa el priblíži k výrezu (okraj ako rootMargin). Bez IntersectionObserver hneď. */
function priZobrazeni(el, fn, { okraj = "300px 0px" } = {}) {
  if (!el) return;
  if (typeof IntersectionObserver !== "function") { fn(el); return; }
  const io = new IntersectionObserver((zaznamy) => {
    zaznamy.forEach((z) => {
      if (!z.isIntersecting) return;
      io.unobserve(z.target);
      fn(z.target);
    });
  }, { rootMargin: okraj });
  io.observe(el);
}

/** Odložené médiá: data-src -> src, data-srcset -> srcset, data-poster -> poster (el aj potomkovia). Video po zmene zdroja load(). */
function nacitajMedia(el) {
  if (!el) return;
  const prvky = [el].concat(Array.prototype.slice.call(el.querySelectorAll("[data-src], [data-srcset], [data-poster]")));
  const videa = new Set();
  prvky.forEach((x) => {
    if (!x.getAttribute) return;
    const p = x.getAttribute("data-poster");
    if (p && !x.getAttribute("poster")) x.setAttribute("poster", p);
    const ss = x.getAttribute("data-srcset");
    if (ss && !x.getAttribute("srcset")) x.setAttribute("srcset", ss);
    const s = x.getAttribute("data-src");
    if (s && !x.getAttribute("src")) {
      x.setAttribute("src", s);
      const v = x.tagName === "VIDEO" ? x : x.tagName === "SOURCE" && x.parentNode && x.parentNode.tagName === "VIDEO" ? x.parentNode : null;
      if (v) videa.add(v);
    }
  });
  videa.forEach((v) => { try { v.load(); } catch (e) { /* video bez podpory */ } });
}

/** .rv sekcie (aj obal sekcie, ktorý je sám .rv) */
function rvSekcie(s) {
  const rv = s.classList.contains("rv") ? [s] : [];
  return rv.concat(pole(s.querySelectorAll(".rv")));
}

/**
 * Reveal .rv (Michal 25. 10. 2026, rýchlosť): JEDEN IntersectionObserver pre celý obsah namiesto čítania polohy každého
 * prvku hneď pri vložení (čítanie po zápise triedy = opakované prepočítanie štýlov a rozloženia čerstvého obsahu).
 * Prvé hlásenie IO má polohy z bežného vykreslenia: čo je vo výreze alebo nad ním (top < výška okna), dostane .on hneď
 * — ako lcdRevealOznacVidene titulky; až keď sú zatriedené všetky .rv sekcie, obal dostane .p1v-rv (CSS dovtedy nič
 * neskrýva, takže nič nezmizne ani neblikne). Zvyšok dostane .on pri zobrazení. Pri prefers-reduced-motion všetko hneď.
 */
function vytvorOdhalovanie() {
  const pokoj = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || typeof IntersectionObserver !== "function";
  const prve = new Map(); // .rv -> sekcia (čaká na prvé zatriedenie)
  const zostava = new Map(); // sekcia -> počet nezatriedených .rv
  const sledovane = new WeakSet();
  const io = pokoj ? null : new IntersectionObserver((zaznamy) => {
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const hotove = [];
    zaznamy.forEach((z) => {
      const el = z.target;
      const s = prve.get(el);
      if (s) {
        prve.delete(el);
        if (z.isIntersecting || z.boundingClientRect.top < vh) { el.classList.add("on"); io.unobserve(el); }
        const n = (zostava.get(s) || 1) - 1;
        if (n > 0) zostava.set(s, n);
        else { zostava.delete(s); hotove.push(s); }
      } else if (z.isIntersecting) {
        el.classList.add("on");
        io.unobserve(el);
      }
    });
    hotove.forEach((s) => s.classList.add("p1v-rv"));
  }, { rootMargin: OKRAJ_ODHALENIA });
  const sleduj = (el, s) => {
    if (sledovane.has(el)) return;
    sledovane.add(el);
    if (s) { prve.set(el, s); zostava.set(s, (zostava.get(s) || 0) + 1); }
    io.observe(el);
  };
  return {
    /** nové sekcie (pri vložení kusu) */
    sekcie(sekcie) {
      sekcie.forEach((s) => {
        const rv = rvSekcie(s).filter((x) => !x.classList.contains("on"));
        if (pokoj) { rv.forEach((x) => x.classList.add("on")); s.classList.add("p1v-rv"); return; }
        rv.forEach((x) => sleduj(x, s));
        if (!zostava.get(s)) s.classList.add("p1v-rv");
      });
    },
    /** .rv, ktoré v sekcii pribudli pri oživení (napr. kópie pásu galérie) */
    dopln(s) {
      const rv = rvSekcie(s).filter((x) => !x.classList.contains("on"));
      if (pokoj) { rv.forEach((x) => x.classList.add("on")); return; }
      const zatriedujem = !s.classList.contains("p1v-rv") && (zostava.get(s) || 0) > 0;
      rv.forEach((x) => sleduj(x, zatriedujem ? s : null));
    },
  };
}

/** Úloha v nečinnosti (requestIdleCallback s limitom), inak hneď v ďalšej úlohe (setTimeout 0 — Safari rIC nemá). */
function vNecinnosti(fn, limit = LIMIT_NECINNOSTI) {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(fn, { timeout: limit });
  else setTimeout(() => fn(null), 0);
}

/**
 * Úloha až po najbližšom vykreslení (requestAnimationFrame -> setTimeout 0): konfigurátor sa ukáže skôr, než sa vkladá
 * obsah, a každý kus sa rozloží vo vlastnom snímku. Skrytá karta (rAF nebeží) -> poistka po 1 s.
 */
function poVykresleni() {
  return new Promise((hotovo) => {
    let raz = false;
    const dalej = () => { if (!raz) { raz = true; hotovo(); } };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(() => setTimeout(dalej, 0));
    setTimeout(dalej, 1000);
  });
}

/**
 * Ručné ukotvenie (revízia F1, rýchlosť 25. 10. 2026): oživenie sekcie alebo neskoršia zmena modulu (vykreslenie
 * recenzií, riadok ceny) môže zmeniť výšku obsahu nad oknom — bez scroll anchoring (Safari) by obsah v okne poskočil
 * (reload/Späť zo stredu obsahu skončil inde, End + posun hore skákal o tisíce px). Pred zmenou si zapamätáme kotvu =
 * prvý prvok obsahu, ktorý pretína okno, a jeho polohu; po zmene posunieme okno o to, o čo sa kotva v okne pohla.
 * Chrome so scroll anchoring vyrovná posun už pri čítaní rozloženia (overené 25. 10. 2026: getBoundingClientRect aj
 * scrollY hneď po zmene vracajú vyrovnanú polohu) -> tu nameria 0 a nepridá nič, žiadne dvojité vyrovnanie; Safari
 * (a overflow-anchor:none) dorovná celé. Pozor: na PC (nad 768 px) web scroll anchoring vypína sám
 * (functions/configuratorEngine.js: overflow-anchor:none na html a body) — tam je ručné ukotvenie jediné. Poloha kotvy
 * sa meria podľa rozloženia (offsetTop), nie getBoundingClientRect: transformácie (reveal .rv, natáčanie kariet) sa
 * počas merania menia a neboli by posunom obsahu.
 */
/** Najhlbšia úroveň kotvy pod .p1v-miesto (miesto -> koreň kusu -> sekcia -> blok sekcie -> jeho dieťa). */
const HLBKA_KOTVY = 4;
/**
 * Menší posun sa nevyrovnáva (px): offsetTop je zaokrúhlený na celé px (súčet reťazca kolíše o 1–2 px), a zbytočný
 * scrollBy by zrušil prebiehajúci plynulý posun — aj obnovenie polohy pri reload/Späť (Chrome ho na stránke s plynulým
 * posunom robí animáciou; 1 px „vyrovnanie“ ho zastavilo o 3 400 px skôr, overené 25. 10. 2026).
 */
const PRAH_KOTVY = 3;
/** Poloha prvku v dokumente podľa rozloženia (súčet offsetTop) — bez transformácií prvku aj predkov. */
function polohaY(el) {
  let y = 0;
  for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
  return y;
}
const mieraKotvy = (k) => polohaY(k.el) + (k.dole ? k.el.offsetHeight : 0);

/**
 * Prvé dieťa el, ktoré pretína okno alebo je pod jeho horným okrajom: { c, q } alebo null. Absolútne umiestnené sa
 * preskočí (poloha môže závisieť od výšky rodiča, napr. bottom:0 — po zmene výšky by sa „pohlo“ samo); prilepené
 * a pevné sa s obsahom nehýbe -> null (kotvou ostane rodič, do neho sa nejde).
 */
function dietaVOkne(el) {
  for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
    const q = c.getBoundingClientRect();
    if (!(q.width || q.height) || q.bottom <= 0) continue;
    const poz = getComputedStyle(c).position;
    if (poz === "absolute") continue;
    return poz === "sticky" || poz === "fixed" ? null : { c, q };
  }
  return null;
}

/**
 * Kotva pred zmenou: { el, dole, y, sy } alebo null, keď zmena nič v okne neposunie (sekcia aj celý obsah pod oknom).
 * Okno pod obsahom (pätička) -> kotvou je spodný okraj miesta. Číta rozloženie — volať mimo úlohy vloženia kusu.
 */
function kotva(miesto, sekcia, stav) {
  if (!miesto || !miesto.isConnected) return null;
  if (stav && stav.vyrovnane) stav.vyrovnane.merania++;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  if (sekcia && sekcia.getBoundingClientRect().top >= vh) return null;
  const r = miesto.getBoundingClientRect();
  if (r.top >= vh) return null;
  let el = miesto;
  const dole = r.bottom <= 0;
  if (!dole) {
    for (let h = 0; h < HLBKA_KOTVY; h++) {
      const d = dietaVOkne(el);
      if (!d) break;
      el = d.c;
      if (d.q.top >= 0) break; // začína v okne — hlbšia kotva netreba
    }
  }
  const k = { el, dole, y: 0, sy: 0 };
  k.y = mieraKotvy(k);
  k.sy = window.pageYOffset;
  return k;
}

/** Posun okna o dy bez plynulého posunu (scroll-behavior stránky); staré prehliadače bez ScrollToOptions klasicky. */
function posunOkno(dy) {
  try {
    if ("scrollBehavior" in document.documentElement.style) { window.scrollBy({ top: dy, left: 0, behavior: "instant" }); return; }
  } catch (e) { /* neznáme behavior -> klasicky */ }
  window.scrollBy(0, dy);
}

/** Po zmene: posun okna o to, o čo sa kotva v okne pohla (Chrome už vyrovnal -> 0). Vráti posun v px. */
function dorovnaj(k, stav) {
  if (!k || !k.el.isConnected) return 0;
  const y = mieraKotvy(k); // najprv rozloženie (Chrome pri ňom vyrovná scrollY), až potom scrollY
  const posun = y - k.y - (window.pageYOffset - k.sy);
  if (Math.abs(posun) < PRAH_KOTVY) return 0;
  posunOkno(posun);
  k.y = mieraKotvy(k);
  k.sy = window.pageYOffset;
  if (stav && stav.vyrovnane) { stav.vyrovnane.pocet++; stav.vyrovnane.px += Math.round(posun); }
  return posun;
}

/**
 * Ešte raz pred najbližším vykreslením: moduly menia výšku aj v requestAnimationFrame (výška galérie podľa dĺžky pásu,
 * rezim() lcdHomeModuly.js). Náš rAF je zaregistrovaný po ich rAF -> beží po nich, pred vykreslením. Keď sa scrollY
 * medzitým zmenilo (posun zákazníka, alebo Chrome už vyrovnal pri čítaní), nerobí nič.
 */
function dorovnajPoSnimke(k, stav) {
  if (!k || typeof window.requestAnimationFrame !== "function") return;
  const sy = window.pageYOffset;
  window.requestAnimationFrame(() => { if (window.pageYOffset === sy) dorovnaj(k, stav); });
}

/**
 * Či je sekcia celá POD oknom, podľa IntersectionObservera — bez čítania rozloženia. Zmena sekcie pod oknom nič v okne
 * neposunie -> ukotvenie ani meranie netreba (meranie by v úlohe po zmene DOM vynútilo prepočítanie rozloženia;
 * zákazník pri konfigurátore má celý obsah pod oknom). Koreň je okno predĺžené nahor (rootMargin hore ~nekonečno):
 * „pretína“ = nad oknom alebo v ňom, „nepretína“ = pod oknom. Bežný IO by skok ponad okno (kotva, End, reload)
 * nenahlásil — z „pod“ do „nad“ sa stav pretínania nemení (overené 25. 10. 2026).
 */
const OKRAJ_NAD_OKNOM = "1000000px 0px 0px 0px";
function vytvorPolohu() {
  const pod = new WeakMap();
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((zaznamy) => zaznamy.forEach((z) => {
    pod.set(z.target, !z.isIntersecting);
  }), { rootMargin: OKRAJ_NAD_OKNOM }) : null;
  return {
    sleduj(sekcie) { if (io) sekcie.forEach((s) => io.observe(s)); },
    /** true = sekcia (alebo sekcia prvku) je celá pod oknom; neznáme = false (zmeria sa) */
    pod(el) {
      const s = el && el.closest ? el.closest("[data-lcd-sekcia]") : null;
      return !!s && pod.get(s) === true;
    },
  };
}

/**
 * fn() s ručným ukotvením (v úlohe vloženia kusu bez neho: nečítať rozloženie čerstvého obsahu; pri zmene pod oknom
 * tiež nie). el = prvok/sekcia, ktorej sa zmena týka (voliteľné).
 */
function ukotvene(miesto, fn, stav, beh, el) {
  const k = (beh && beh.vkladam) || (beh && beh.poloha && beh.poloha.pod(el)) ? null : kotva(miesto, null, stav);
  try {
    return fn();
  } finally {
    if (k) { dorovnaj(k, stav); dorovnajPoSnimke(k, stav); }
  }
}

/**
 * Oživovanie po sekciách (bod 4 hlavičky): po vložení sa všetky sekcie zaradia v poradí dokumentu a oživujú sa po
 * jednej v úlohách v nečinnosti; sekcia blízko okna (OKRAJ_OZIVENIA) má prednosť, sekcia vo výreze sa oživí hneď.
 * Pomocné sekcie (*-pomocne) hneď pri vložení. Každé oživenie mimo vkladania je ručne ukotvené (vyššie).
 * beh.vkladam = práve beží úloha vloženia kusu (rozloženie čerstvého obsahu sa nečíta).
 */
function vytvorOzivovanie(oc, moduly, odhalovanie, stav, beh) {
  const cakaju = []; // neoživené sekcie v poradí dokumentu (kusy sa pripájajú za seba)
  const prednost = new Set(); // sekcie blízko okna
  // naplánovaná úloha pre sekciu blízko okna / vzdialenú (blízka sa naplánuje aj keď už čaká vzdialená s dlhým limitom)
  let planBlizko = false, planDaleko = false;
  const ozivene = new WeakSet();
  const meno = (s) => s.getAttribute("data-lcd-sekcia") || "";
  /** oc pre jednu sekciu: oc.sekcia(meno) vráti len ju */
  const ocSekcie = (s) => {
    const m = meno(s), ocS = Object.create(oc);
    ocS.sekcia = (x) => (x === m ? s : null);
    return ocS;
  };

  function oziv(s) {
    if (ozivene.has(s)) return;
    ozivene.add(s);
    const i = cakaju.indexOf(s);
    if (i > -1) cakaju.splice(i, 1);
    prednost.delete(s);
    if (io) io.unobserve(s);
    const m = meno(s), ocS = ocSekcie(s);
    // kotva len keď sekcia nie je celá pod oknom (zmena pod oknom nič neposunie a rozloženie sa po nej nečíta)
    const k = beh.vkladam || beh.poloha.pod(s) ? null : kotva(oc.miesto, s, stav);
    moduly.forEach((mod) => {
      try {
        mod.init(ocS);
      } catch (e) {
        // sekcia ostane statická a viditeľná; test číta ctx.chyby aj po prejdení celého obsahu
        oc.ctx.chyby.push(mod.MENO + " (" + m + "): " + ((e && e.message) || e));
        console.error("[lcd-1v] " + mod.MENO + " " + m, e);
      }
    });
    try { odhalovanie.dopln(s); } catch (e) { console.error("[lcd-1v] " + MENO + " reveal " + m, e); }
    if (k) { dorovnaj(k, stav); dorovnajPoSnimke(k, stav); }
  }
  /** najprv sekcia blízko okna (prvá v poradí dokumentu), inak prvá neoživená */
  function dalsia() {
    for (let i = 0; i < cakaju.length; i++) if (prednost.has(cakaju[i])) return cakaju[i];
    return cakaju[0] || null;
  }
  // jedna sekcia na úlohu: hlavné vlákno sa medzi sekciami uvoľní (žiadna dlhá úloha ani pri 20 sekciách)
  function spracuj(blizko) {
    if (blizko) planBlizko = false;
    else planDaleko = false;
    const s = dalsia();
    if (s) oziv(s);
    if (cakaju.length) naplanuj();
  }
  function naplanuj() {
    const blizko = cakaju.some((s) => prednost.has(s));
    if (blizko ? planBlizko : planDaleko) return;
    if (blizko) planBlizko = true;
    else planDaleko = true;
    vNecinnosti(() => spracuj(blizko), blizko ? LIMIT_NECINNOSTI : LIMIT_NECINNOSTI_DALEKO);
  }
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((zaznamy) => {
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    zaznamy.forEach((z) => {
      if (!z.isIntersecting) return;
      io.unobserve(z.target);
      if (ozivene.has(z.target)) return;
      // sekcia už je vo výreze (skok kotvou, rýchly posun) -> hneď, zákazník ju práve vidí; inak prednostne v nečinnosti
      const r = z.boundingClientRect;
      if (r.top < vh && r.bottom > 0) oziv(z.target);
      else { prednost.add(z.target); naplanuj(); }
    });
  }, { rootMargin: OKRAJ_OZIVENIA }) : null;

  stav.neozivene = () => cakaju.map(meno);
  return {
    /** spoločné časti modulov (init s oc bez sekcií, napr. výzvy a okno skupiny D) — raz, pri prvom vložení */
    spolocne() {
      const ocBez = Object.create(oc);
      ocBez.sekcia = () => null;
      moduly.forEach((m) => {
        try { m.init(ocBez); } catch (e) {
          oc.ctx.chyby.push(m.MENO + ": " + ((e && e.message) || e));
          console.error("[lcd-1v] " + m.MENO, e);
        }
      });
    },
    /**
     * Pri vložení kusu: časti modulov, od ktorých závisí výška sekcie (vlozenie(oc) — lacné, bez čítania rozloženia),
     * aby výšky boli hneď konečné (obnovenie polohy po reload/Späť zodpovedá, oživenie neskôr výšku nemení).
     */
    vlozenie(sekcie) {
      sekcie.forEach((s) => {
        const ocS = ocSekcie(s);
        moduly.forEach((mod) => {
          if (typeof mod.vlozenie !== "function") return;
          try { mod.vlozenie(ocS); } catch (e) {
            oc.ctx.chyby.push(mod.MENO + " (" + meno(s) + ", vloženie): " + ((e && e.message) || e));
            console.error("[lcd-1v] " + mod.MENO + " " + meno(s), e);
          }
        });
      });
    },
    pridaj(sekcie) {
      sekcie.forEach((s) => {
        if (ozivene.has(s) || cakaju.indexOf(s) > -1) return;
        cakaju.push(s);
        if (/-pomocne$/.test(meno(s))) oziv(s);
        else if (io) io.observe(s);
      });
      if (cakaju.length) naplanuj();
    },
  };
}

/** Obsah sa nepodaril (cesta b): naše miesto preč, starý popis späť; konfigurátor ostáva. */
function vratObsah() {
  document.body.classList.remove(TRIEDA_OBSAH);
  // naše prvky: miesto s koreňmi + okno a linka čítania, ktoré skupina D presunula priamo do <body>
  Array.prototype.forEach.call(document.querySelectorAll(".p1v-miesto, body > .p1v-lb, body > .p1v-citanie"), (m) => {
    if (m.parentNode) m.parentNode.removeChild(m);
  });
}

/**
 * Obsah na stránke: miesto, trieda, `oc`, reveal a oživovanie — vytvorí sa pri prvom kuse so sekciami.
 * vloz(korene) umiestni korene za doterajšie (v poradí), dosadí ich čísla, zaradí ich sekcie na reveal a oživenie.
 */
function vytvorObsah(ctx, kluc, stav) {
  const miesto = miestoObsahu();
  document.body.classList.add(TRIEDA_OBSAH);
  const korene = []; // rastie s každým kusom (lcdMultiKoren drží to isté pole)
  // vkladam: počas úlohy vloženia kusu sa rozloženie nečíta (žiadne ukotvenie); poloha: sekcie voči oknu (IO)
  const beh = { vkladam: false, poloha: vytvorPolohu() };
  const oc = {
    ctx,
    kluc,
    korene,
    koren: lcdMultiKoren(korene), // querySelector(All) cez všetky kusy (lxModulyOziv ho prijme ako root)
    miesto,
    /** obal sekcie podľa data-lcd-sekcia (napr. "a-referencie") alebo null; pri oživení po sekciách len tá jedna */
    sekcia: (meno) => miesto.querySelector('[data-lcd-sekcia="' + meno + '"]'),
    /** hocktorá sekcia celého obsahu (napr. cieľ odkazu pri kliku), aj keď sa oživuje iná */
    najdiSekciu: (meno) => miesto.querySelector('[data-lcd-sekcia="' + meno + '"]'),
    obrazok: (meno) => OBRAZKY_OBSAH + meno,
    priZobrazeni,
    nacitajMedia,
    /** okraj „blízko okna“ (rootMargin) — napr. fotky recenzií sa sťahujú od tejto vzdialenosti */
    okrajOzivenia: OKRAJ_OZIVENIA,
    /** fn() s ručným ukotvením okna: modul ním obalí neskoršiu zmenu výšky (dáta prišli po vložení); el = sekcia */
    ukotvi: (fn, el) => ukotvene(miesto, fn, stav, beh, el),
    ked: ctx.ked,
    na: ctx.na,
    vysli: ctx.vysli,
  };
  const moduly = [skupinaA, skupinaB, skupinaC, skupinaD, MODUL_TYPU[kluc]].filter(Boolean);
  const odhalovanie = vytvorOdhalovanie();
  const ozivovanie = vytvorOzivovanie(oc, moduly, odhalovanie, stav, beh);
  ozivovanie.spolocne();
  return {
    oc,
    vloz(nove) {
      beh.vkladam = true;
      try {
        nove.forEach((k) => {
          const stlpec = k.closest && k.closest(".custom-footer > div");
          if (k.parentNode !== miesto) miesto.appendChild(k);
          if (stlpec && !stlpec.querySelector("[data-lcd-cast]")) stlpec.setAttribute("data-p1v-prazdny", "");
          korene.push(k);
        });
        // čísla a odkazy len v nových koreňoch (staršie kusy už majú svoje; dvakrát by sa pokazila pôvodná viditeľnosť)
        nove.forEach((k) => {
          const v = cisla.init({ ctx, miesto: k });
          stav.cisla = stav.cisla ? Promise.all([stav.cisla, v]) : v;
        });
        const sekcie = [];
        nove.forEach((k) => pole(k.querySelectorAll("[data-lcd-sekcia]")).forEach((s) => sekcie.push(s)));
        // výška hneď (revízia F1): pred revealom, nech zaradí aj .rv, ktoré pri tom pribudnú
        ozivovanie.vlozenie(sekcie);
        beh.poloha.sleduj(sekcie);
        odhalovanie.sekcie(sekcie);
        ozivovanie.pridaj(sekcie);
      } finally {
        beh.vkladam = false;
      }
    },
  };
}

/**
 * Kusy z CDN postupne (cesta b): každý vo vlastnej úlohe po vykreslení, v poradí kusov. Kus bez sekcií čaká, kým nepríde
 * kus so sekciami (potom idú spolu v poradí); keď žiadny sekcie nemá, nič sa neukáže (stav „nic“).
 */
async function postupne(ctx, kluc, texty, stav) {
  let obsah = null;
  const odlozene = []; // korene bez sekcií pred prvým kusom so sekciami
  for (let i = 0; i < texty.length; i++) {
    const html = await texty[i];
    if (!html) continue;
    await poVykresleni();
    if (!document.body.classList.contains("lcd-1v")) { stav.stav = "nic"; return; } // nový vzhľad sa medzitým zložil
    const k = korenZHtml(html, "p1v-" + kluc + "-" + (i + 1));
    if (!k) continue;
    stav.kusy++;
    if (!obsah && !maSekcie([k])) { odlozene.push(k); continue; }
    try {
      if (!obsah) obsah = vytvorObsah(ctx, kluc, stav);
      obsah.vloz(odlozene.splice(0).concat([k]));
    } catch (e) {
      ctx.chyby.push(MENO + ": " + ((e && e.message) || e));
      console.error("[lcd-1v] " + MENO, e);
      vratObsah();
      stav.stav = "chyba";
      return;
    }
  }
  if (obsah && odlozene.length) obsah.vloz(odlozene.splice(0)); // (len poistka — po prvom kuse so sekciami sa neodkladá)
  stav.stav = obsah ? "hotovo" : "nic";
}

/**
 * Reload / Späť na PC: obnovenie polohy bez animácie, kým sa obsah vkladá a oživuje (25. 10. 2026). Web má na html
 * scroll-behavior: smooth a Chrome obnovu polohy na takej stránke animuje; animáciu zastaví akýkoľvek posun počas nej
 * (ručné ukotvenie — na PC jediné, web tam vypína scroll anchoring, configuratorEngine.js —, posun.js) a pri pomalom
 * CPU skončila reload pri FAQ na PC o tisíce px vyššie (628 @1280: 1–3 z 5 behov; s touto úpravou 8/8 OK pod záťažou).
 * Len PC (nad 768 px ako configuratorEngine.js): na telefóne obnova s animáciou prechádzala a bez nej narazila na ešte
 * krátku stránku (598 @390 −4 000 px). Pokus vrátiť polohu zo sessionStorage po vložení obsahu bol horší (−130 až
 * −1 070 px na oboch šírkach) — zavrhnutý. Len pri reload/back_forward a len inline štýl na html; po hotovom obsahu
 * + 2,5 s (alebo po 20 s) sa vráti štýl webu. Bežný príchod na stránku sa nemení.
 * @returns {(po?: Promise) => void} uvoľnenie: hneď, alebo po splnení sľubu
 */
function obnovaBezAnimacie() {
  let nav = null;
  try { nav = performance.getEntriesByType("navigation")[0]; } catch (e) { /* starý prehliadač */ }
  const typ = nav ? nav.type : performance.navigation && performance.navigation.type === 1 ? "reload" : performance.navigation && performance.navigation.type === 2 ? "back_forward" : "";
  if (typ !== "reload" && typ !== "back_forward") return () => {};
  if (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) return () => {}; // telefón: obnova webu
  const html = document.documentElement;
  if (html.style.scrollBehavior) return () => {}; // už nastavil niekto iný — nemeniť
  html.style.scrollBehavior = "auto";
  let hotovo = false;
  const uvolni = () => { if (hotovo) return; hotovo = true; clearTimeout(poistka); if (html.style.scrollBehavior === "auto") html.style.scrollBehavior = ""; };
  const poistka = setTimeout(uvolni, 20000);
  return (po) => { if (po && typeof po.then === "function") po.then(() => setTimeout(uvolni, 2500), uvolni); else setTimeout(uvolni, 2500); };
}

/** Volá index.js (posledný modul, po konfigurátore). */
export function init(ctx) {
  const kluc = klucObsahu(ctx);
  const stav = { kluc, zdroj: null, stav: "nic", kusy: 0, cisla: null, neozivene: () => [], vyrovnane: { pocet: 0, px: 0, merania: 0 } };
  ctx.obsah = stav; // test a ladenie (window.__lcd1v.obsah)
  const pripravene = vopred;
  vopred = null;
  if (!kluc) return;
  const obnova = obnovaBezAnimacie();
  const vDom = koreneObsahu(kluc);
  if (vDom.length) {
    // a) korene už sú v DOM (Popis produktu / pätička): umiestnia sa synchrónne; chyba -> index.js zloží nový vzhľad.
    //    Sekcie sa oživujú po sekciách ako pri CDN (bod 4 hlavičky).
    stav.zdroj = "dom";
    stav.kusy = vDom.length;
    if (!maSekcie(vDom)) { obnova(); return; }
    try {
      vytvorObsah(ctx, kluc, stav).vloz(vDom);
      stav.stav = "hotovo";
    } catch (e) {
      ctx.chyby.push(MENO + ": " + ((e && e.message) || e));
      console.error("[lcd-1v] " + MENO, e);
      stav.stav = "chyba";
    }
    obnova();
    return;
  }
  // b) CDN verzie bundle (len SK; bez verzie v/<sha>/ nie je odkiaľ)
  if (!OBSAH_CDN || ctx.trh !== "sk" || !adresyKusov(kluc).length) { obnova(); return; }
  stav.zdroj = "cdn";
  stav.stav = "caka";
  // kusy stiahnuté vopred pri spustení bundla (predstiahni), inak sa začnú sťahovať teraz
  const texty = pripravene && pripravene.kluc === kluc ? pripravene.texty : adresyKusov(kluc).map(stiahniKus);
  stav.hotovo = postupne(ctx, kluc, texty, stav).catch((e) => {
    ctx.chyby.push(MENO + ": " + ((e && e.message) || e));
    try { vratObsah(); } catch (x) { /* nič */ }
    stav.stav = "chyba";
  });
  obnova(stav.hotovo);
}
