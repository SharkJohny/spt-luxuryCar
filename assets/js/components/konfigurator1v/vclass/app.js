// Konfigurátor Mercedes triedy V (SK 646): samostatná časť js/lcd-vclass.js, stiahne sa len na tejto stránke (vclass/index.js).
// Cesta zákazníka zhora nadol: tmavá úvodná časť s fotkami a cenou, pruh krokov, krok „Vaše auto“ so všetkými údajmi naraz
// (rovnaký vzhľad ako v konfigurátore 1V), rozloženie, vzor, farba, druhá vrstva, rohož do kufra, boxy, košík. Vedľa krokov živá kresba.
// Ceny sú len v Shoptete: základ = jednovrstvové autokoberce k predným sedadlám, príplatky = 2. a 3. rad, druhá vrstva, rohož, boxy.
// Košík: všetky výbery idú do natívnych selectov príplatkov (admin 415–442), ceny rátá Shoptet. Do košíka sa klikne natívne
// tlačidlo, takže rozpis v košíku aj riadok objednávky fungujú ako pri ostatných produktoch.
import { kresli } from "./kresba.js";
import { SELECTY, VELKOSTI, ROKY, VOLANT, STRED, DVERE, SEDADLA, SEDADLA_TEXTY, sedadlaText, STOLCEK, ZASUVKY, VZORY, FARBY, LUX, KROKY, FOTKY, FOTO_SIRKY, BEZ_DRUHEJ, ROZ_PREDOK, ROZ_SET, rozSet, ROHOZ, BOXY, BOX_FARBY } from "./data.js";
import { NAHLADY_FARIEB } from "../farby-nahlady-data.js";
import { CSS } from "./styl.js";
import { htmlDruha, ozivVideo, otvorOkno, zrusOkno } from "./druha.js";
import { ozivObsah } from "./obsah.js";

/** Názvy modelov v katalógu áut. */
const MODELY = { M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" };
const MOBIL = "(max-width: 991px)";
const IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";
const FARBY_CDN = IMG + "farby/";
const OBS = IMG + "obsah/";
const TELEFON = "+421 903 660 720";
const KLUC_ULOZENIA = "lcdVclass";
const nahlad = (slug) => (NAHLADY_FARIEB[slug] ? FARBY_CDN + slug + "-" + NAHLADY_FARIEB[slug] + "-w144.jpg" : "");
const eur = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, " ") + " €";
const cistyText = (o) => String(o.textContent || "").replace(/\s*\+\s*(?:€|Kč)?\s*[\d\s.,]+\s*(?:€|Kč)?\s*$/, "").trim();
const FOTO_SIZES = "(max-width: 991px) 100vw, 62vw";

function selectPodlaMena(meno) {
  return Array.prototype.find.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), (s) => (s.getAttribute("data-parameter-name") || "").trim() === meno) || null;
}
function moznost(sel, text) {
  return Array.prototype.find.call(sel.options, (o) => o.value && cistyText(o) === text) || null;
}
function obrazok(f, i) {
  const srcset = FOTO_SIRKY.map((w) => OBS + f.s + "-w" + w + ".webp " + w + "w").join(", ");
  const ine = i === 0 ? ' fetchpriority="high"' : ' loading="lazy"';
  return '<picture><source type="image/webp" srcset="' + srcset + '" sizes="' + FOTO_SIZES + '"><img src="' + OBS + f.s + '.jpg" alt="' + f.alt + '" width="1500" height="1000" decoding="async"' + ine + "></picture>";
}
/** Fotka na karte voľby: text je v tlačidle, preto prázdny alt. */
const fotoKarta = (s) => '<picture><source type="image/webp" srcset="' + OBS + s + '-w480.webp"><img src="' + OBS + s + '.jpg" alt="" loading="lazy" width="1500" height="1000"></picture>';

export function spusti(ctx) {
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
  const kontrola = { rok: ROKY, volant: VOLANT, stred: STRED, dvere: DVERE, sedadla: SEDADLA_TEXTY, stolcek: STOLCEK, zasuvky: ZASUVKY, farba2: LUX.map((l) => "Lux Color " + l[0]).concat(BEZ_DRUHEJ), rozlozenie: [ROZ_PREDOK].concat(VELKOSTI.map((x) => rozSet(x.v))), rohoz: ROHOZ, box1: textyBoxov, box2: textyBoxov, box3: textyBoxov, boxFarba: BOX_FARBY.map((f) => f.nm) };
  Object.keys(FARBY).forEach((v) => FARBY[v].forEach((f) => { if (!moznost(sel.farba, VZORY.find((x) => x.id === v).nm + " – " + f.nm)) throw new Error("vclass: v príplatku chýba " + f.nm); }));
  Object.keys(kontrola).forEach((k) => kontrola[k].forEach((t) => { if (!moznost(sel[k], t)) throw new Error("vclass: v príplatku " + k + " chýba " + t); }));

  const S = { velkost: "", rok: "", volant: "Vľavo", stred: "", dvere: "", rad2: "", rad3: "", stolcek: "", zasuvky: "", vzor: "", farba: "", vrstva: "", farba2: "", rozl: "", rohoz: "", boxy: "", box1: "", box2: "", box3: "", boxFarba: "", akt: 0, chybaju: false };
  const spat = [];
  let zruseny = false;
  // návrat z košíka alebo obnovenie stránky: rozrobený výber ostáva, zákazník nezačína odznova
  try {
    const o = JSON.parse(sessionStorage.getItem(KLUC_ULOZENIA) || "null");
    if (o) Object.keys(S).forEach((k) => { if (k !== "chybaju" && typeof o[k] === typeof S[k]) S[k] = o[k]; });
    if (S.vzor && !(FARBY[S.vzor] || []).some((f) => f.nm === S.farba)) S.farba = "";
  } catch (e) { /* súkromný režim: začína sa odznova */ }
  const uloz = () => { try { sessionStorage.setItem(KLUC_ULOZENIA, JSON.stringify(S)); } catch (e) { /* nič */ } };

  // ---- ceny: všetko z možností príplatkov v Shoptete
  const prc = (k, text) => { const o = text ? moznost(sel[k], text) : null; return o ? Number(o.getAttribute("data-surcharge-final-price")) || 0 : 0; };
  const textBoxu = (v) => { const b = BOXY.find((x) => x.v === v); return b ? b.t : ""; };
  /** Cena výberu: začína na jednovrstvových autokobercoch k predným sedadlám, príplatky len za to, čo si zákazník vybral. */
  function cena(zmena) {
    const v = Object.assign({}, S, zmena);
    let c = zaklad;
    if (v.rozl === "Z") c += prc("rozlozenie", rozSet(v.velkost || "M"));
    if (v.vrstva === "ano") c += prc("farba2", "Lux Color " + (v.farba2 || LUX[0][0]));
    if (v.rohoz === "ano") c += prc("rohoz", ROHOZ[0]);
    [1, 2, 3].forEach((i) => { if (Number(v.boxy) >= i && v["box" + i]) c += prc("box" + i, textBoxu(v["box" + i])); });
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
  if (popis && /nie je dostupn/i.test(popis.textContent)) { popis.style.display = "none"; spat.push(() => { popis.style.display = ""; }); }

  // ---- úvodná časť s fotkami
  const hero = document.createElement("div"); // nie <section>: staré štýly webu mu vnucujú okraje
  hero.id = "lcd-vclass-hero";
  hero.setAttribute("role", "region");
  hero.setAttribute("aria-label", "Mercedes triedy V");
  hero.innerHTML = '<div class="lh-in"><div class="lh-g"><div class="lh-st" tabindex="0" aria-label="Fotky autokobercov v triede V">' + FOTKY.map((f, i) => '<figure class="lh-f">' + obrazok(f, i) + "</figure>").join("") + '</div><button type="button" class="lh-sip lh-sip-l" data-sip="-1" aria-label="Predošlá fotka"></button><button type="button" class="lh-sip lh-sip-p" data-sip="1" aria-label="Ďalšia fotka"></button></div><div class="lh-tx"><span class="lh-ei">Trieda V, W447 od roku 2014</span><div class="lh-h"></div><p class="lh-p">Prešívané autokoberce na mieru pre dĺžky M, L a XL, od pedálov až po kufor.</p><div class="lh-c"><small>od</small><b>' + eur(zaklad) + '</b><span>jednovrstvové autokoberce k predným sedadlám</span></div><p class="lh-p2">2. a 3. rad, druhú vrstvu, rohož do kufra aj boxy si pridáte v ďalších krokoch.</p><button type="button" class="lh-cta">Zostaviť môj set</button><div class="lh-t">' + FOTKY.map((f, i) => '<button type="button" data-foto="' + i + '" aria-label="Fotka ' + (i + 1) + '" aria-pressed="' + (i === 0) + '"><img src="' + OBS + f.s + '-w480.webp" alt="" width="200" height="134" loading="lazy"></button>').join("") + "</div></div></div>";
  obal.insertBefore(hero, obal.firstChild);
  const povodne = { rodic: hlavicka && hlavicka.parentNode, za: hlavicka && hlavicka.nextSibling };
  const h1 = hlavicka && hlavicka.querySelector("h1");
  const h1Html = h1 ? h1.innerHTML : "";
  if (hlavicka) hero.querySelector(".lh-h").appendChild(hlavicka);
  if (h1) h1.innerHTML = 'Autokoberce <span>Mercedes V&nbsp;Class</span>';
  const stage = hero.querySelector(".lh-st");
  const palce = Array.prototype.slice.call(hero.querySelectorAll("[data-foto]"));
  let fotoAkt = 0;
  function nastavPalec(i) {
    fotoAkt = i;
    palce.forEach((b, k) => b.setAttribute("aria-pressed", k === i ? "true" : "false"));
  }
  function naFotku(i) {
    const n = (i + FOTKY.length) % FOTKY.length;
    stage.scrollTo({ left: stage.clientWidth * n, behavior: "smooth" });
    nastavPalec(n);
  }
  let fotoCas = 0;
  const naPosunFotiek = () => { clearTimeout(fotoCas); fotoCas = setTimeout(() => { nastavPalec(Math.round(stage.scrollLeft / Math.max(1, stage.clientWidth))); }, 90); };
  stage.addEventListener("scroll", naPosunFotiek, { passive: true });

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
  nakres.innerHTML = '<div class="lv-n-h">Váš set</div><div class="lv-pl"><canvas class="lv-pred" role="img" aria-label="Predné koberce triedy V zhora"></canvas><canvas class="lv-zad" role="img" aria-label="Koberce 2. a 3. radu a kufra zhora"></canvas></div><p class="lv-pop">Kresba sa mení podľa Vášho výberu, predok je hore.</p>';
  lavy.appendChild(nakres);
  const pred = nakres.querySelector(".lv-pred");
  const zad = nakres.querySelector(".lv-zad");

  const root = document.createElement("div");
  root.id = "lcd-vclass";
  root.innerHTML = '<div class="lv-kroky"></div><div class="lv-suhrn"><ul class="lv-rozpis" hidden></ul><div class="lv-spolu"><span>Spolu</span><b class="lv-c2"></b></div><p class="lv-spr" hidden></p><button type="button" class="lv-cta"></button><p class="lv-dod">Šije sa až po objednávke, preto dodanie trvá 21–29 dní.</p></div>';
  stlpec.appendChild(root);
  const kor = root.querySelector(".lv-kroky");
  const spr = root.querySelector(".lv-spr");
  const cta = root.querySelector(".lv-cta");
  const rozpis = root.querySelector(".lv-rozpis");

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
      farba2: S.vrstva === "nie" ? BEZ_DRUHEJ : S.vrstva === "ano" && S.farba2 ? "Lux Color " + S.farba2 : "",
      rozlozenie: S.rozl === "P" ? ROZ_PREDOK : S.rozl === "Z" && S.velkost ? rozSet(S.velkost) : "",
      rohoz: S.rohoz === "ano" ? ROHOZ[0] : S.rohoz === "nie" ? ROHOZ[1] : "",
      box1: n >= 1 ? textBoxu(S.box1) : "", box2: n >= 2 ? textBoxu(S.box2) : "", box3: n >= 3 ? textBoxu(S.box3) : "",
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
  function prekresli() {
    cancelAnimationFrame(plan);
    plan = requestAnimationFrame(() => {
      if (zruseny) return;
      try {
        const sirka = Math.max(280, pred.parentNode.clientWidth || 320);
        const wP = Math.min(760, Math.round(sirka * DPR));
        const f = S.vzor && S.farba ? FARBY[S.vzor].find((x) => x.nm === S.farba) : null;
        const lux = S.vrstva === "ano" && S.farba2 ? LUX.find((l) => l[0] === S.farba2) : null;
        const far = [f ? f.koza : "#17161a", f ? f.sit : "#dcc9a2", lux ? lux[1] : "#131315"];
        const vzor = S.vzor || "diamond";
        // cena a kresba hovoria to isté: výrazné je len to, čo je vo výbere
        const slabe = S.rozl === "Z" ? (S.rohoz === "ano" ? null : "kufor") : S.rohoz === "ano" ? "zadok" : "cele";
        kresli(pred, { cast: "predok", s: S.stred === STRED[1], vzor, bez2: S.vrstva !== "ano" }, wP, far);
        kresli(zad, { cast: "zadok", v: S.velkost || "XL", d: S.dvere === DVERE[0] ? 1 : 2, s: S.stolcek === STOLCEK[1], z: S.zasuvky === ZASUVKY[1], vzor, slabe }, Math.round(wP * 0.745), far);
        nakres.querySelector(".lv-pop").textContent = slabe ? "Bledšie časti ste si zatiaľ nevybrali." : "Kresba sa mení podľa Vášho výberu, predok je hore.";
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
    druha: () => S.vrstva === "nie" || (S.vrstva === "ano" && !!S.farba2),
    rozl: () => !!S.rozl, rohoz: () => !!S.rohoz,
    boxy: () => S.boxy === "0" || (pocetBoxov() > 0 && !!S.boxFarba && [1, 2, 3].slice(0, pocetBoxov()).every((i) => !!S["box" + i])),
  };
  const suhrn = {
    auto: () => "Trieda V " + S.velkost + ", " + S.rok + ", sedadlá " + S.rad2 + " a " + S.rad3,
    vzor: () => { const v = VZORY.find((x) => x.id === S.vzor); return v ? v.nm : ""; },
    farba: () => S.farba,
    druha: () => (S.vrstva === "nie" ? BEZ_DRUHEJ : "Lux Color " + S.farba2),
    rozl: () => (S.rozl === "P" ? ROZ_PREDOK : ROZ_SET),
    rohoz: () => (S.rohoz === "ano" ? ROHOZ[0] : ROHOZ[1]),
    boxy: () => (S.boxy === "0" ? "Bez boxov" : pocetBoxov() + (pocetBoxov() === 1 ? " box" : " boxy") + ": " + [1, 2, 3].slice(0, pocetBoxov()).map((i) => S["box" + i]).join(", ")),
  };
  const tl = (k, v, vnutro, tr) => '<button type="button" class="' + (tr || "lv-v1") + '" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (String(S[k]) === String(v)) + '">' + vnutro + "</button>";
  /** Prepínač ako „Miest na sedenie“ v konfigurátore 1V; popisy môžu byť kratšie než hodnota v Shoptete. */
  const seg = (k, A, popisy) => '<div class="lv-seg lv-seg' + A.length + '" data-pole="' + k + '">' + A.map((a, i) => tl(k, a, popisy ? popisy[i] : a, "lv-s1")).join("") + "</div>";
  const chyb = (k) => (S.chybaju && !S[k] ? " lv-chyba" : "");
  const pole = (k, n, vnutro) => '<div class="lv-pole' + chyb(k) + '" data-pole-w="' + k + '"><span class="lv-l">' + n + "</span>" + vnutro + "</div>";
  /** Rozbaľovacie menu ako v konfigurátore 1V: zlatý rám a šípka, prázdne pole je výrazné, aby sa nedalo prehliadnuť. */
  const menu = (k, n, ph, A) => '<div class="lv-pole' + chyb(k) + '" data-pole-w="' + k + '"><label class="lv-l" for="lv-' + k + '">' + n + '</label><select id="lv-' + k + '" class="lv-sel' + (S[k] ? "" : " lv-pr") + '"><option value="">' + ph + "</option>" + A.map((x) => '<option value="' + x[0] + '"' + (x[0] === S[k] ? " selected" : "") + ">" + x[1] + "</option>").join("") + "</select></div>";
  const vetaVelkosti = () => { const x = VELKOSTI.find((y) => y.v === S.velkost); return x ? x.p : "Dĺžka auta: M asi 4,9 m, L asi 5,1 m, XL asi 5,4 m."; };
  const zvolenaFarba = () => (S.vzor ? (FARBY[S.vzor] || []).find((f) => f.nm === S.farba) : null);
  const cenaDruhej = () => prc("farba2", "Lux Color " + LUX[0][0]);
  const telo = {
    auto: () => pole("volant", "Pozícia volantu", '<div class="lv-pi">' + VOLANT.map((v, i) => tl("volant", v, i ? "Vpravo — UK" : "Vľavo — EU", "lv-s1")).join("") + "</div>")
      + '<hr class="lv-hr"><div class="lv-2 lv-2st"><div class="lv-pole"><span class="lv-l">Značka</span><span class="lv-fix">Mercedes-Benz</span></div><div class="lv-pole"><span class="lv-l">Model</span><span class="lv-fix">Trieda V</span></div></div>'
      + '<div class="lv-2 lv-2st lv-2m">' + menu("rok", "Rok výroby", "Vyberte rok", ROKY.map((r) => [r, r])) + menu("velkost", "Veľkosť auta", "Vyberte veľkosť", VELKOSTI.map((x) => [x.v, x.t])) + "</div>"
      + '<p class="lv-veta" id="lv-veta">' + vetaVelkosti() + "</p>"
      + '<div class="lv-2 lv-2st">' + pole("rad2", "Sedadlá v 2. rade", seg("rad2", SEDADLA)) + pole("rad3", "Sedadlá v 3. rade", seg("rad3", SEDADLA)) + "</div>"
      + pole("dvere", "Bočné posuvné dvere", seg("dvere", DVERE, ["Jedny, vpravo", "Dvoje, na oboch stranách"]))
      + pole("stred", "Medzi prednými sedadlami", seg("stred", STRED))
      + '<div class="lv-2 lv-2st">' + pole("stolcek", "Stolček vzadu", seg("stolcek", STOLCEK, ["Bez", "So stolčekom"])) + pole("zasuvky", "Zásuvky pod sedadlami", seg("zasuvky", ZASUVKY, ["Bez", "So zásuvkami"])) + "</div>"
      + '<p class="lv-veta">Zásuvky sú v podlahe, zapájajú sa do nich sedadlá 2. a 3. radu. Neviete si rady? Zavolajte nám na <a href="tel:' + TELEFON.replace(/\s/g, "") + '">' + TELEFON + "</a>.</p>",
    rozl: () => '<div class="lv-g lv-g2">' + tl("rozl", "P", fotoKarta("autokoberce-mercedes-v-class-sofer") + "<span>" + ROZ_PREDOK + "<em>v cene</em></span>", "lv-v1 lv-foto")
      + tl("rozl", "Z", fotoKarta("autokoberce-mercedes-v-class-interier") + "<span>" + ROZ_SET.replace("2. a 3. rad", "2.&nbsp;a&nbsp;3.&nbsp;rad") + "<em>+ " + eur(prc("rozlozenie", rozSet(S.velkost || "M"))) + "</em></span>", "lv-v1 lv-foto") + "</div>",
    vzor: () => '<div class="lv-g lv-g3">' + VZORY.map((v) => tl("vzor", v.id, '<img src="' + v.img + '" alt="" loading="lazy"><span>' + v.nm + "</span>", "lv-v1 lv-foto")).join("") + "</div>",
    farba: () => '<div class="lv-f">' + (FARBY[S.vzor] || []).map((f) => tl("farba", f.nm, '<img src="' + nahlad(f.slug) + '" alt="" loading="lazy"><span>' + f.nm + "</span>", "lv-sw")).join("") + "</div>",
    druha: () => {
      if (S.vrstva !== "ano") return htmlDruha("+ " + eur(cenaDruhej()), S.vrstva === "nie");
      const f = zvolenaFarba(), odp = f ? f.lux : LUX[0][0];
      const poradie = [odp].concat(LUX.map((l) => l[0]).filter((n) => n !== odp));
      return '<div class="lv-dv"><span><b>Druhá vrstva k predným sedadlám</b> + ' + eur(cenaDruhej()) + '</span><button type="button" data-k="vrstva" data-v="nie">Nie, ďakujem</button></div>'
        + pole("farba2", "Prosím, vyberte si farbu 2. vrstvy", '<div class="lv-f">' + poradie.map((n) => tl("farba2", n, (n === odp ? '<i class="lv-odp">Odporúčame</i>' : "") + '<img src="' + nahlad("lux-color-" + n) + '" alt="" loading="lazy"><span>Lux Color ' + n + "</span>", n === odp ? "lv-sw lv-sw-odp" : "lv-sw")).join("") + "</div>");
    },
    rohoz: () => '<div class="lv-g lv-g2">' + tl("rohoz", "ano", fotoKarta("koberec-do-kufra-mercedes-v-class") + "<span>" + ROHOZ[0] + "<em>+ " + eur(prc("rohoz", ROHOZ[0])) + "</em></span>", "lv-v1 lv-foto") + tl("rohoz", "nie", "<span>" + ROHOZ[1] + "</span>", "lv-v1 lv-bezf") + "</div>",
    boxy: () => {
      const n = pocetBoxov();
      return pole("boxy", "Počet boxov", seg("boxy", ["0", "1", "2", "3"], ["Bez boxov", "1 box", "2 boxy", "3 boxy"]))
        + [1, 2, 3].slice(0, n).map((i) => pole("box" + i, n > 1 ? "Veľkosť " + i + ". boxu" : "Veľkosť boxu", '<div class="lv-seg lv-seg4 lv-vel">' + BOXY.map((b) => tl("box" + i, b.v, "<b>" + b.v + "</b><small>" + b.r + "</small><em>+ " + eur(prc("box" + i, b.t)) + "</em>", "lv-s1")).join("") + "</div>")).join("")
        + (n ? pole("boxFarba", "Farba boxov", '<div class="lv-f">' + BOX_FARBY.map((f) => tl("boxFarba", f.nm, '<img src="' + IMG + f.img + '" alt="" loading="lazy"><span>' + f.nm + "</span>", "lv-sw")).join("") + "</div>") : "");
    },
  };
  const kolko = () => KROKY.filter((k) => hotovy[k.id]()).length;
  /** Pri druhej vrstve a boxoch je „Pokračujte“ až po výbere, aby sa nebilo so zeleným „Áno“. */
  const ukazDalej = (k) => !k.auto && (k.id !== "druha" || S.vrstva === "ano") && (k.id !== "boxy" || pocetBoxov() > 0);
  let zrusVideo = null;
  function krokoveTlacidlo(k) {
    return k.id === "boxy" ? "Pokračujte k súhrnu" : "Pokračujte ďalej";
  }
  function hlavicky() {
    const n = KROKY.length, h = kolko();
    cesta.innerHTML = '<ol class="lv-c-ol">' + KROKY.map((k, i) => {
      const ok = hotovy[k.id](), teraz = i === S.akt;
      const trieda = teraz ? "lv-teraz" : ok ? "lv-hot" : "";
      return '<li class="' + trieda + '"><button type="button" ' + (ok || teraz ? 'data-ot="' + i + '"' : "disabled") + '><i>' + (ok && !teraz ? "✓" : i + 1) + "</i><span>" + k.kr + "</span></button></li>";
    }).join("") + '<li class="' + (h === n ? "lv-teraz" : "") + '"><button type="button" ' + (h === n ? 'data-suhrn="1"' : "disabled") + "><i>" + (n + 1) + "</i><span>Košík</span></button></li></ol>";
    root.querySelector(".lv-c2").textContent = eur(cenaSpolu());
    if (!cta.disabled) cta.textContent = h === n ? "Vložte do košíka" : "Dokončite výber";
    cta.classList.toggle("lv-hotovo", h === n);
    const r = riadkyRozpisu();
    rozpis.hidden = r.length < 2;
    rozpis.innerHTML = r.map((x) => "<li><span>" + x[0] + "</span><b>" + x[1] + "</b></li>").join("");
    lista.querySelector(".lcd1v-lista__suma").textContent = eur(cenaSpolu());
    lista.querySelector(".lcd1v-lista__popis").textContent = h === n ? "Výber je hotový" : S.akt >= 0 ? "Krok " + (S.akt + 1) + " z " + n : "";
    // pri otázke s vlastnými tlačidlami (Áno a Nie, karty s výberom) lišta nekonkuruje zeleným tlačidlom
    const kos = lista.querySelector(".lcd1v-lista__kos");
    kos.textContent = h === n ? "Vložte do košíka" : "Pokračujte ďalej";
    const sTlacidlom = h === n || (KROKY[S.akt] && ukazDalej(KROKY[S.akt]));
    kos.hidden = !sTlacidlom;
    lista.classList.toggle("lv-bez", !sTlacidlom);
  }
  /** Rozpis ceny pod krokmi: zákazník vidí, za čo platí. */
  function riadkyRozpisu() {
    const r = [["Predné sedadlá", eur(zaklad)]];
    if (S.rozl === "Z") r.push(["2. a 3. rad", "+ " + eur(prc("rozlozenie", rozSet(S.velkost || "M")))]);
    if (S.vrstva === "ano") r.push(["Druhá vrstva", "+ " + eur(cenaDruhej())]);
    if (S.rohoz === "ano") r.push(["Rohož do kufra", "+ " + eur(prc("rohoz", ROHOZ[0]))]);
    [1, 2, 3].slice(0, pocetBoxov()).forEach((i) => { if (S["box" + i]) r.push(["Box " + S["box" + i], "+ " + eur(prc("box" + i, textBoxu(S["box" + i])))]); });
    return r;
  }
  const spravaKroku = (k) => (k.id === "auto" ? "Prosím, doplňte označené údaje o aute." : k.id === "druha" ? (S.vrstva === "ano" ? "Prosím, vyberte si farbu 2. vrstvy." : "Prosím, vyberte si Áno alebo Nie.") : k.id === "boxy" ? "Prosím, dokončite výber boxov." : "Prosím, vyberte si jednu z možností.");
  /** Telefón: kresba hneď pod otvoreným krokom, zákazník vidí zmenu bez posúvania. PC: ľavý stĺpec. */
  function umiestni() {
    if (!(window.matchMedia && window.matchMedia(MOBIL).matches)) { if (nakres.parentNode !== lavy) lavy.appendChild(nakres); return; }
    const ot = kor.querySelector(".lv-ot");
    if (ot) ot.parentNode.insertBefore(nakres, ot.nextSibling);
    else root.insertBefore(nakres, root.querySelector(".lv-suhrn"));
  }
  function kroky() {
    if (kor.contains(nakres)) lavy.appendChild(nakres); // innerHTML nižšie by kresbu zmazal
    kor.innerHTML = KROKY.map((k, i) => {
      const ok = hotovy[k.id]() && i !== S.akt;
      if (i === S.akt) return '<div class="lv-kr lv-ot" data-id="' + k.id + '"><div class="lv-k">Krok ' + (i + 1) + " z " + KROKY.length + '</div><div class="lv-t">' + k.ti + "</div><span class=\"lv-ciara\"></span>" + (k.pod ? '<p class="lv-p">' + k.pod + "</p>" : "") + telo[k.id]() + (S.chybaju ? '<p class="lv-spr">' + spravaKroku(k) + "</p>" : "") + (ukazDalej(k) ? '<button type="button" class="lv-dalej" data-dalej="1">' + krokoveTlacidlo(k) + "</button>" : "") + "</div>";
      return '<div class="lv-kr' + (ok ? " lv-ho" : "") + '"><button type="button" class="lv-r" ' + (ok ? 'data-ot="' + i + '"' : "disabled") + '><span class="lv-c-k">' + (ok ? "✓" : i + 1) + '</span><span class="lv-r-t"><b>' + k.nm + "</b><small>" + (ok ? suhrn[k.id]() : k.vy) + "</small></span>" + (ok ? '<span class="lv-z">Zmeniť</span>' : "") + "</button></div>";
    }).join("");
    umiestni();
    hlavicky();
    if (zrusVideo) zrusVideo();
    zrusVideo = KROKY[S.akt] && KROKY[S.akt].id === "druha" ? ozivVideo(kor) : null;
  }
  function posunNa(prvok, vzdy) {
    if (!prvok || !prvok.getBoundingClientRect) return;
    const r = prvok.getBoundingClientRect();
    const hl = 96;
    if (vzdy || r.top < hl || r.top > window.innerHeight * 0.7) window.scrollTo({ top: window.pageYOffset + r.top - hl, behavior: "smooth" });
  }
  function dalej() {
    const d = KROKY.findIndex((k) => !hotovy[k.id]());
    S.akt = d >= 0 ? d : -1;
    S.chybaju = false;
    kroky();
    posunNa(d >= 0 ? kor.querySelector(".lv-ot") : root.querySelector(".lv-suhrn"));
  }
  function oznac() {
    kor.querySelectorAll("button[data-k]").forEach((b) => b.setAttribute("aria-pressed", String(S[b.getAttribute("data-k")]) === b.getAttribute("data-v") ? "true" : "false"));
    kor.querySelectorAll("[data-pole-w]").forEach((p) => { if (S[p.getAttribute("data-pole-w")]) p.classList.remove("lv-chyba"); });
    if (!kor.querySelector(".lv-chyba")) { const m = kor.querySelector(".lv-ot .lv-spr"); if (m) m.parentNode.removeChild(m); }
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
    if (k === "vrstva" || k === "boxy") kroky(); else oznac();
    prekresli();
    uloz();
    const krok = KROKY.find((x) => x.id === k);
    clearTimeout(casovac);
    if ((krok && krok.auto) || (k === "vrstva" && v === "nie") || (k === "boxy" && v === "0")) casovac = setTimeout(() => { if (!zruseny) dalej(); }, 240);
  }
  /** Lišta na telefóne robí to isté ako „Pokračujte ďalej“: nedokončený krok ukáže, čo ešte chýba. */
  function poKroku() {
    const k = KROKY[S.akt];
    if (k && hotovy[k.id]()) { spr.hidden = true; dalej(); return; }
    if (!k) { const d = KROKY.findIndex((x) => !hotovy[x.id]()); if (d < 0) { doKosika(); return; } S.akt = d; }
    S.chybaju = true;
    kroky();
    posunNa(kor.querySelector(".lv-chyba") || kor.querySelector(".lv-ot"), true);
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
      if (b.hasAttribute("data-foto")) { naFotku(+b.getAttribute("data-foto")); return; }
      if (b.hasAttribute("data-sip")) { naFotku(fotoAkt + Number(b.getAttribute("data-sip"))); return; }
      return;
    }
    if (!root.contains(b) && !cesta.contains(b)) return;
    if (b.hasAttribute("data-okno")) { otvorOkno(b, () => nastav("vrstva", "ano")); return; }
    if (b.hasAttribute("data-k")) { nastav(b.getAttribute("data-k"), b.getAttribute("data-v")); return; }
    if (b.hasAttribute("data-ot")) { clearTimeout(casovac); S.akt = +b.getAttribute("data-ot"); S.chybaju = false; kroky(); posunNa(kor.querySelector(".lv-ot")); return; }
    if (b.hasAttribute("data-suhrn")) { S.akt = -1; kroky(); posunNa(root.querySelector(".lv-suhrn")); return; }
    if (b.hasAttribute("data-dalej")) {
      const k = KROKY[S.akt];
      if (k && !hotovy[k.id]()) {
        S.chybaju = true;
        kroky();
        posunNa(kor.querySelector(".lv-chyba") || kor.querySelector(".lv-ot"));
        return;
      }
      spr.hidden = true;
      dalej();
      return;
    }
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
      spr.hidden = false; spr.textContent = "Ešte chýba: " + KROKY[ch].nm + ".";
      posunNa(kor.querySelector(".lv-chyba") || kor.querySelector(".lv-ot"));
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
    cta.textContent = "Vkladám do košíka…";
    tlacidlo.click();
    clearTimeout(casovac);
    casovac = setTimeout(() => { if (!zruseny) { cta.disabled = false; hlavicky(); } }, 3000);
  }
  // lišta sa ukáže, keď je zákazník pri krokoch; bublina chatu sa zdvihne nad ňu (rovnaké triedy ako cena.js)
  let listaOn = false, naListu = 0;
  function obnovListu() {
    naListu = 0;
    if (zruseny) return;
    const on = !!mobil.matches && cesta.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (on !== listaOn) {
      listaOn = on;
      lista.classList.toggle("on", on);
      document.body.classList.toggle("lcd1v-lista-on", on);
    }
    const f = document.querySelector('iframe[title="Luxia chat"]');
    const c = f && f.getBoundingClientRect();
    document.body.classList.toggle("lcd1v-bublina", !!(c && c.height > 0 && c.height <= 130));
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
    clearTimeout(fotoCas);
    cancelAnimationFrame(plan);
    spat.forEach((f) => { try { f(); } catch (e) { /* nič */ } });
    document.removeEventListener("click", naKlik);
    document.removeEventListener("change", naZmenu);
    document.removeEventListener("ShoptetCartUpdated", naKosik);
    window.removeEventListener("resize", priZmene);
    window.removeEventListener("scroll", planLista);
    if (zrusVideo) zrusVideo();
    zrusOkno();
    if (zrusObsah) zrusObsah();
    document.body.classList.remove("lcd1v-lista-on", "lcd1v-bublina");
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
  const zrusObsah = ozivObsah({ prc, zaklad, eur });
  window.__lcdVclass = { S, sel, zrus, cenaSpolu }; // ladenie a test
  return { zrus };
}
