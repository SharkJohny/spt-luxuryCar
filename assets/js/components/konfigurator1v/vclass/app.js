// Konfigurátor Mercedes triedy V (SK 646): samostatná časť js/lcd-vclass.js, stiahne sa len na tejto stránke (vclass/index.js).
// Cesta zákazníka zhora nadol: tmavá úvodná časť s fotkami a cenou, pruh krokov, krok „Vaše auto“ so všetkými údajmi naraz
// (rovnaký vzhľad ako v konfigurátore 1V), vzor, farba, druhá vrstva, rozloženie, rohož do kufra, boxy, košík. Vedľa krokov živá kresba.
// Ceny sú len v Shoptete: základ = predné sedadlá, príplatky = 2. a 3. rad, druhá vrstva, rohož do kufra, boxy.
// Košík: všetky výbery idú do natívnych selectov príplatkov (admin 415–442), ceny rátá Shoptet. Do košíka sa klikne natívne
// tlačidlo, takže rozpis v košíku aj riadok objednávky fungujú ako pri ostatných produktoch.
import { kresli } from "./kresba.js";
import { SELECTY, VELKOSTI, ROKY, VOLANT, STRED, DVERE, MIESTA, STOLCEK, ZASUVKY, VZORY, FARBY, LUX, KROKY, FOTKY, BEZ_DRUHEJ, ROZ_PREDOK, ROZ_SET, rozSet, ROHOZ, BOXY, BOX_FARBY } from "./data.js";
import { NAHLADY_FARIEB } from "../farby-nahlady-data.js";
import { CSS } from "./styl.js";

/** Názvy modelov v katalógu áut. */
const MODELY = { M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" };
const MOBIL = "(max-width: 991px)";
const IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";
const FARBY_CDN = IMG + "farby/";
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
  const srcset = (typ) => f.w.map((w) => IMG + "vclass/vclass-" + f.s + "-" + w + "." + typ + " " + w + "w").join(", ");
  const ine = i === 0 ? ' fetchpriority="high"' : ' loading="lazy"';
  return '<picture><source type="image/webp" srcset="' + srcset("webp") + '" sizes="' + FOTO_SIZES + '"><img src="' + IMG + "vclass/vclass-" + f.s + "-" + f.w[0] + '.jpg" srcset="' + srcset("jpg") + '" sizes="' + FOTO_SIZES + '" alt="' + f.alt + '" width="1500" height="1000" decoding="async"' + ine + "></picture>";
}

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
  const kontrola = { rok: ROKY, volant: VOLANT, stred: STRED, dvere: DVERE, miesta: MIESTA, stolcek: STOLCEK, zasuvky: ZASUVKY, farba2: LUX.map((l) => "Lux Color " + l[0]).concat(BEZ_DRUHEJ), rozlozenie: [ROZ_PREDOK].concat(VELKOSTI.map((x) => rozSet(x.v))), rohoz: ROHOZ, box1: textyBoxov, box2: textyBoxov, box3: textyBoxov, boxFarba: BOX_FARBY.map((f) => f.nm) };
  Object.keys(FARBY).forEach((v) => FARBY[v].forEach((f) => { if (!moznost(sel.farba, VZORY.find((x) => x.id === v).nm + " – " + f.nm)) throw new Error("vclass: v príplatku chýba " + f.nm); }));
  Object.keys(kontrola).forEach((k) => kontrola[k].forEach((t) => { if (!moznost(sel[k], t)) throw new Error("vclass: v príplatku " + k + " chýba " + t); }));

  const S = { velkost: "", rok: "", volant: "Vľavo", stred: "", dvere: "", miesta: "", stolcek: "", zasuvky: "", vzor: "", farba: "", vrstva: "", farba2: "", rozl: "", rohoz: "", boxy: "", box1: "", box2: "", box3: "", boxFarba: "", akt: 0, chybaju: false };
  const spat = [];
  let zruseny = false;

  // ---- ceny: všetko z možností príplatkov v Shoptete
  const prc = (k, text) => { const o = text ? moznost(sel[k], text) : null; return o ? Number(o.getAttribute("data-surcharge-final-price")) || 0 : 0; };
  const textBoxu = (v) => { const b = BOXY.find((x) => x.v === v); return b ? b.t : ""; };
  /** Cena výberu. Čo ešte nie je vybrané, sa ráta ako kompletný set: 2. a 3. rad, druhá vrstva aj rohož do kufra. */
  function cena(zmena) {
    const v = Object.assign({}, S, zmena);
    const rozl = v.rozl || "Z";
    const rohoz = v.rohoz || (rozl === "Z" ? "ano" : "nie");
    let c = zaklad + prc("rozlozenie", rozl === "Z" ? rozSet(v.velkost || "M") : ROZ_PREDOK);
    if (v.vrstva !== "nie") c += prc("farba2", "Lux Color " + LUX[0][0]);
    if (rohoz === "ano") c += prc("rohoz", ROHOZ[0]);
    [1, 2, 3].forEach((i) => { if (Number(v.boxy) >= i && v["box" + i]) c += prc("box" + i, textBoxu(v["box" + i])); });
    return c;
  }
  const komplet = (v) => cena({ velkost: v, rozl: "Z", vrstva: "ano", rohoz: "ano", boxy: "0" });

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
  hero.innerHTML = '<div class="lh-in"><div class="lh-g"><div class="lh-st" tabindex="0" aria-label="Fotky autokobercov v triede V">' + FOTKY.map((f, i) => '<figure class="lh-f">' + obrazok(f, i) + "</figure>").join("") + '</div><button type="button" class="lh-sip lh-sip-l" data-sip="-1" aria-label="Predošlá fotka"></button><button type="button" class="lh-sip lh-sip-p" data-sip="1" aria-label="Ďalšia fotka"></button></div><div class="lh-tx"><span class="lh-ei">Kompletný set na mieru</span><div class="lh-h"></div><p class="lh-p">Predné sedadlá, 2. a 3. rad aj rohož do kufra. Objednať môžete aj len predné sedadlá.</p><div class="lh-c"><small>od</small><b>' + eur(komplet("M")) + '</b></div><button type="button" class="lh-cta">Zostaviť môj set</button><div class="lh-t">' + FOTKY.map((f, i) => '<button type="button" data-foto="' + i + '" aria-label="Fotka ' + (i + 1) + '" aria-pressed="' + (i === 0) + '"><img src="' + IMG + "vclass/vclass-" + f.s + '-th.jpg" alt="" width="200" height="134" loading="lazy"></button>').join("") + "</div></div></div>";
  obal.insertBefore(hero, obal.firstChild);
  const povodne = { rodic: hlavicka && hlavicka.parentNode, za: hlavicka && hlavicka.nextSibling };
  const h1 = hlavicka && hlavicka.querySelector("h1");
  const h1Html = h1 ? h1.innerHTML : "";
  if (hlavicka) hero.querySelector(".lh-h").appendChild(hlavicka);
  if (h1) h1.innerHTML = 'Autokoberce <span>Mercedes triedy&nbsp;V</span>';
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
  nakres.innerHTML = '<div class="lv-n-h">Váš set</div><div class="lv-pl"><canvas class="lv-pred" role="img" aria-label="Predné koberce triedy V zhora"></canvas><canvas class="lv-zad" role="img" aria-label="Koberce 2. a 3. radu a kufra zhora"></canvas></div><p class="lv-pop">Kresba sa mení podľa vášho výberu, predok je hore.</p>';
  lavy.appendChild(nakres);
  const pred = nakres.querySelector(".lv-pred");
  const zad = nakres.querySelector(".lv-zad");

  const root = document.createElement("div");
  root.id = "lcd-vclass";
  root.innerHTML = '<div class="lv-kroky"></div><div class="lv-suhrn"><div class="lv-spolu"><span>Spolu</span><b class="lv-c2"></b></div><p class="lv-spr" hidden></p><button type="button" class="lv-cta"></button></div>';
  stlpec.appendChild(root);
  const kor = root.querySelector(".lv-kroky");
  const spr = root.querySelector(".lv-spr");
  const cta = root.querySelector(".lv-cta");

  // ---- výber -> Shoptet
  const farbaText = () => (S.vzor && S.farba ? VZORY.find((v) => v.id === S.vzor).nm + " – " + S.farba : "");
  const hodnoty = () => {
    const n = Number(S.boxy) || 0;
    return {
      rok: S.rok, volant: S.volant, stred: S.stred, dvere: S.dvere, miesta: S.miesta, stolcek: S.stolcek, zasuvky: S.zasuvky, farba: farbaText(),
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
        const lux = S.vrstva !== "nie" && S.farba2 ? LUX.find((l) => l[0] === S.farba2) : null;
        const far = [f ? f.koza : "#17161a", f ? f.sit : "#dcc9a2", lux ? lux[1] : "#131315"];
        const vzor = S.vzor || "diamond";
        const slabe = S.rozl === "P" ? (S.rohoz === "ano" ? "zadok" : "cele") : S.rohoz === "nie" ? "kufor" : null;
        kresli(pred, { cast: "predok", s: S.stred === STRED[1], vzor, bez2: S.vrstva === "nie" }, wP, far);
        kresli(zad, { cast: "zadok", v: S.velkost || "XL", d: S.dvere === DVERE[0] ? 1 : 2, s: S.stolcek === STOLCEK[1], z: S.zasuvky === ZASUVKY[1], vzor, slabe }, Math.round(wP * 0.745), far);
        nakres.querySelector(".lv-pop").textContent = slabe ? "Slabšie časti nie sú vo vašom výbere." : "Kresba sa mení podľa vášho výberu, predok je hore.";
      } catch (e) {
        nakres.hidden = true; // kresba nie je nutná na objednanie
        console.error("[lcd-1v] vclass kresba", e);
      }
    });
  }

  // ---- kroky
  const POLIA_AUTA = ["velkost", "rok", "miesta", "dvere", "stred", "stolcek", "zasuvky"];
  const pocetBoxov = () => Number(S.boxy) || 0;
  const hotovy = {
    auto: () => POLIA_AUTA.every((k) => !!S[k]), vzor: () => !!S.vzor, farba: () => !!S.farba,
    druha: () => S.vrstva === "nie" || (S.vrstva === "ano" && !!S.farba2),
    rozl: () => !!S.rozl, rohoz: () => !!S.rohoz,
    boxy: () => S.boxy === "0" || (pocetBoxov() > 0 && !!S.boxFarba && [1, 2, 3].slice(0, pocetBoxov()).every((i) => !!S["box" + i])),
  };
  const suhrn = {
    auto: () => "Trieda V " + S.velkost + ", " + S.rok + ", " + S.miesta + " miest",
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
  const telo = {
    auto: () => pole("volant", "Pozícia volantu", '<div class="lv-pi">' + VOLANT.map((v, i) => tl("volant", v, i ? "Vpravo — UK" : "Vľavo — EU", "lv-s1")).join("") + "</div>")
      + '<hr class="lv-hr"><div class="lv-2"><div class="lv-pole"><span class="lv-l">Značka</span><span class="lv-fix">Mercedes-Benz</span></div><div class="lv-pole"><span class="lv-l">Model</span><span class="lv-fix">Trieda V</span></div></div>'
      + '<div class="lv-pole' + chyb("rok") + '" data-pole-w="rok"><label class="lv-l" for="lv-rok">Rok výroby</label><select id="lv-rok" class="lv-sel"><option value="">Vyberte rok</option>' + ROKY.map((r) => "<option" + (r === S.rok ? " selected" : "") + ">" + r + "</option>").join("") + "</select></div>"
      + pole("velkost", "Veľkosť auta a cena kompletného setu", '<div class="lv-seg lv-seg3 lv-vel">' + VELKOSTI.map((x) => tl("velkost", x.v, "<b>" + x.v + "</b><small>" + x.p + "</small><em>" + eur(komplet(x.v)) + "</em>", "lv-s1")).join("") + "</div>")
      + pole("miesta", "Miest na sedenie", seg("miesta", MIESTA))
      + pole("dvere", "Bočné posuvné dvere", seg("dvere", DVERE, ["Jedny, vpravo", "Dvoje, na oboch stranách"]))
      + pole("stred", "Medzi prednými sedadlami", seg("stred", STRED))
      + '<div class="lv-2">' + pole("stolcek", "Stolček vzadu", seg("stolcek", STOLCEK, ["Bez", "So stolčekom"])) + pole("zasuvky", "Zásuvky pod sedadlami", seg("zasuvky", ZASUVKY, ["Bez", "So zásuvkami"])) + "</div>",
    vzor: () => '<div class="lv-g lv-g3">' + VZORY.map((v) => tl("vzor", v.id, '<img src="' + v.img + '" alt="" loading="lazy"><span>' + v.nm + "</span>", "lv-v1 lv-foto")).join("") + "</div>",
    farba: () => '<div class="lv-f">' + (FARBY[S.vzor] || []).map((f) => tl("farba", f.nm, '<img src="' + nahlad(f.slug) + '" alt="" loading="lazy"><span>' + f.nm + "</span>", "lv-sw")).join("") + "</div>",
    druha: () => '<p class="lv-i"><b>8&nbsp;z&nbsp;10</b> zákazníkov si vybralo autokoberce <b>s&nbsp;druhou vrstvou</b>.</p><ul class="lv-body"><li>zachytí vodu, sneh aj blato</li><li>jednoduchšia údržba, vyberiete ju a&nbsp;opláchnete</li></ul><div class="lv-an"><button type="button" class="lv-ano" data-k="vrstva" data-v="ano" aria-pressed="' + (S.vrstva === "ano") + '">Áno, chcem druhú vrstvu<small>' + eur(prc("farba2", "Lux Color " + LUX[0][0])) + '</small></button><button type="button" class="lv-nie" data-k="vrstva" data-v="nie" aria-pressed="' + (S.vrstva === "nie") + '">Nie, ďakujem</button></div>'
      + (S.vrstva === "ano" ? pole("farba2", "Prosím, vyberte si farbu 2. vrstvy", '<div class="lv-f">' + LUX.map((l) => tl("farba2", l[0], '<img src="' + nahlad("lux-color-" + l[0]) + '" alt="" loading="lazy"><span>Lux Color ' + l[0] + "</span>", "lv-sw")).join("") + "</div>") : ""),
    rozl: () => '<div class="lv-g lv-g2">' + tl("rozl", "P", '<img src="' + IMG + 'vclass/vclass-sofer-560.jpg" alt="" loading="lazy"><span>' + ROZ_PREDOK + "<em>" + eur(cena({ rozl: "P", rohoz: "nie", boxy: "0" })) + "</em></span>", "lv-v1 lv-foto")
      + tl("rozl", "Z", '<img src="' + IMG + 'vclass/vclass-rad2-560.jpg" alt="" loading="lazy"><span>' + ROZ_SET + "<em>" + eur(cena({ rozl: "Z", rohoz: "nie", boxy: "0" })) + "</em></span>", "lv-v1 lv-foto") + "</div>",
    rohoz: () => '<div class="lv-g lv-g2">' + tl("rohoz", "ano", '<img src="' + IMG + 'vclass/vclass-detail-560.jpg" alt="" loading="lazy"><span>' + ROHOZ[0] + "<em>" + eur(prc("rohoz", ROHOZ[0])) + "</em></span>", "lv-v1 lv-foto") + tl("rohoz", "nie", "<span>" + ROHOZ[1] + "</span>", "lv-v1 lv-bezf") + "</div>",
    boxy: () => {
      const n = pocetBoxov();
      return pole("boxy", "Počet boxov", seg("boxy", ["0", "1", "2", "3"], ["Bez boxov", "1 box", "2 boxy", "3 boxy"]))
        + [1, 2, 3].slice(0, n).map((i) => pole("box" + i, n > 1 ? "Veľkosť " + i + ". boxu" : "Veľkosť boxu", '<div class="lv-seg lv-seg4 lv-vel">' + BOXY.map((b) => tl("box" + i, b.v, "<b>" + b.v + "</b><small>" + b.r + "</small><em>" + eur(prc("box" + i, b.t)) + "</em>", "lv-s1")).join("") + "</div>")).join("")
        + (n ? pole("boxFarba", "Farba boxov", '<div class="lv-f">' + BOX_FARBY.map((f) => tl("boxFarba", f.nm, '<img src="' + IMG + f.img + '" alt="" loading="lazy"><span>' + f.nm + "</span>", "lv-sw")).join("") + "</div>") : "");
    },
  };
  const kolko = () => KROKY.filter((k) => hotovy[k.id]()).length;
  /** Pri druhej vrstve a boxoch je „Pokračujte“ až po výbere, aby sa nebilo so zeleným „Áno“. */
  const ukazDalej = (k) => !k.auto && (k.id !== "druha" || S.vrstva === "ano") && (k.id !== "boxy" || pocetBoxov() > 0);
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
    cta.textContent = h === n ? "Vložte do košíka" : "Dokončite výber";
    cta.classList.toggle("lv-hotovo", h === n);
  }
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
      if (i === S.akt) return '<div class="lv-kr lv-ot" data-id="' + k.id + '"><div class="lv-k">Krok ' + (i + 1) + " z " + KROKY.length + '</div><div class="lv-t">' + k.ti + "</div><span class=\"lv-ciara\"></span>" + (k.pod ? '<p class="lv-p">' + k.pod + "</p>" : "") + telo[k.id]() + (ukazDalej(k) ? '<button type="button" class="lv-dalej" data-dalej="1">' + krokoveTlacidlo(k) + "</button>" : "") + "</div>";
      return '<div class="lv-kr' + (ok ? " lv-ho" : "") + '"><button type="button" class="lv-r" ' + (ok ? 'data-ot="' + i + '"' : "disabled") + '><span class="lv-c-k">' + (ok ? "✓" : i + 1) + '</span><span class="lv-r-t"><b>' + k.nm + "</b><small>" + (ok ? suhrn[k.id]() : k.vy) + "</small></span>" + (ok ? '<span class="lv-z">Zmeniť</span>' : "") + "</button></div>";
    }).join("");
    umiestni();
    hlavicky();
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
    hlavicky();
  }

  // ---- udalosti
  let casovac = 0;
  function naKlik(e) {
    const b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (hero.contains(b)) {
      if (b.classList.contains("lh-cta")) { posunNa(cesta, true); return; }
      if (b.hasAttribute("data-foto")) { naFotku(+b.getAttribute("data-foto")); return; }
      if (b.hasAttribute("data-sip")) { naFotku(fotoAkt + Number(b.getAttribute("data-sip"))); return; }
      return;
    }
    if (!root.contains(b) && !cesta.contains(b)) return;
    if (b.hasAttribute("data-k")) {
      const k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
      S[k] = v;
      if (k === "vzor") { const zostava = (FARBY[v] || []).some((f) => f.nm === S.farba); if (!zostava) S.farba = ""; }
      if (k === "vrstva" && v === "nie") S.farba2 = "";
      if (k === "boxy") { [1, 2, 3].forEach((i) => { if (i > Number(v)) S["box" + i] = ""; }); if (v === "0") S.boxFarba = ""; }
      spr.hidden = true;
      sync();
      S.chybaju = false;
      if (k === "vrstva" || k === "boxy") kroky(); else oznac();
      prekresli();
      const krok = KROKY.find((x) => x.id === k);
      clearTimeout(casovac);
      if ((krok && krok.auto) || (k === "vrstva" && v === "nie") || (k === "boxy" && v === "0")) casovac = setTimeout(() => { if (!zruseny) dalej(); }, 240);
      return;
    }
    if (b.hasAttribute("data-ot")) { clearTimeout(casovac); S.akt = +b.getAttribute("data-ot"); S.chybaju = false; kroky(); posunNa(kor.querySelector(".lv-ot")); return; }
    if (b.hasAttribute("data-suhrn")) { S.akt = -1; kroky(); posunNa(root.querySelector(".lv-suhrn")); return; }
    if (b.hasAttribute("data-dalej")) {
      const k = KROKY[S.akt];
      if (k && !hotovy[k.id]()) {
        S.chybaju = true;
        kroky();
        spr.hidden = false;
        spr.textContent = k.id === "auto" ? "Prosím, doplňte označené údaje o aute." : k.id === "druha" && S.vrstva === "ano" ? "Prosím, vyberte si farbu 2. vrstvy." : "Prosím, dokončite tento krok.";
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
    if (e.target && e.target.id === "lv-rok") { S.rok = e.target.value; spr.hidden = true; sync(); oznac(); }
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
  document.addEventListener("click", naKlik);
  document.addEventListener("change", naZmenu);
  const naKosik = () => { if (!zruseny) { cta.disabled = false; hlavicky(); } };
  document.addEventListener("ShoptetCartUpdated", naKosik);
  let naResize = 0;
  const priZmene = () => { clearTimeout(naResize); naResize = setTimeout(() => { rozsir(); umiestni(); prekresli(); }, 200); };
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
    if (h1) h1.innerHTML = h1Html;
    if (hlavicka && povodne.rodic) povodne.rodic.insertBefore(hlavicka, povodne.za && povodne.za.parentNode === povodne.rodic ? povodne.za : null);
    [root, nakres, hero, cesta, styl].forEach((x) => { if (x.parentNode) x.parentNode.removeChild(x); });
    document.body.classList.remove("lcd-vclass");
  }

  rozsir();
  kroky();
  prekresli();
  window.__lcdVclass = { S, sel, zrus, cenaSpolu }; // ladenie a test
  return { zrus };
}
