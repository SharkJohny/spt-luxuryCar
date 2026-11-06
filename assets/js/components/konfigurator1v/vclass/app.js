// Konfigurátor Mercedes triedy V (SK 646): samostatná časť js/lcd-vclass.js, stiahne sa len na tejto stránke (vclass/index.js).
// Vzhľad: otázka po jednej, hotový krok sa zatvorí do riadka s fajkou a Zmeniť, vľavo živá kresba koberca.
// Košík: všetky výbery idú do natívnych selectov príplatkov (admin 415–442), ceny rátá Shoptet. Do košíka sa klikne natívne
// tlačidlo, takže rozpis v košíku aj riadok objednávky fungujú ako pri ostatných produktoch.
import { kresli } from "./kresba.js";
import { SELECTY, VELKOSTI, ROKY, VOLANT, STRED, DVERE, MIESTA, STOLCEK, ZASUVKY, VZORY, FARBY, LUX, KROKY } from "./data.js";
import { NAHLADY_FARIEB } from "../farby-nahlady-data.js";
import { CSS } from "./styl.js";

/** Názvy modelov v katalógu áut. */
const MODELY = { M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" };
const MOBIL = "(max-width: 991px)";
const FARBY_CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/farby/";
const nahlad = (slug) => (NAHLADY_FARIEB[slug] ? FARBY_CDN + slug + "-" + NAHLADY_FARIEB[slug] + "-w144.jpg" : "");
const eur = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, " ") + " €";
const cistyText = (o) => String(o.textContent || "").replace(/\s*\+\s*(?:€|Kč)?\s*[\d\s.,]+\s*(?:€|Kč)?\s*$/, "").trim();

function selectPodlaMena(meno) {
  return Array.prototype.find.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), (s) => (s.getAttribute("data-parameter-name") || "").trim() === meno) || null;
}
function moznost(sel, text) {
  return Array.prototype.find.call(sel.options, (o) => o.value && cistyText(o) === text) || null;
}

export function spusti(ctx) {
  const form = document.getElementById("product-detail-form");
  const tlacidlo = form && form.querySelector(".add-to-cart button.add-to-cart-button");
  const stlpec = document.querySelector(".p-info-wrapper");
  const lavy = document.querySelector(".p-image-wrapper");
  const hlavicka = document.querySelector(".p-detail-inner-header");
  const cenaMeta = document.querySelector('meta[itemprop="price"]');
  const zaklad = cenaMeta ? parseFloat(cenaMeta.getAttribute("content")) : 0;
  const sel = {};
  Object.keys(SELECTY).forEach((k) => { sel[k] = selectPodlaMena(SELECTY[k]); });
  const chyba = Object.keys(sel).filter((k) => !sel[k]);
  if (!form || !tlacidlo || !stlpec || !lavy || !(zaklad > 0) || chyba.length) throw new Error("vclass: na stránke chýba " + (chyba.join(", ") || "formulár, tlačidlo alebo cena"));
  // hodnoty v kóde musia byť v admine; chýbajúca hodnota = návrat na natívny formulár, nie tichý zlý výber
  const kontrola = { velkost: VELKOSTI.map((x) => x.v), rok: ROKY, volant: VOLANT, stred: STRED, dvere: DVERE, miesta: MIESTA, stolcek: STOLCEK, zasuvky: ZASUVKY, farba2: LUX.map((l) => "Lux Color " + l[0]) };
  Object.keys(FARBY).forEach((v) => FARBY[v].forEach((f) => { if (!moznost(sel.farba, VZORY.find((x) => x.id === v).nm + " – " + f.nm)) throw new Error("vclass: v príplatku chýba " + f.nm); }));
  Object.keys(kontrola).forEach((k) => kontrola[k].forEach((t) => { if (!moznost(sel[k], t)) throw new Error("vclass: v príplatku " + k + " chýba " + t); }));

  const S = { velkost: "", rok: "", volant: "Vľavo", stred: "", dvere: "", miesta: "", stolcek: "", zasuvky: "", vzor: "", farba: "", farba2: "", akt: 0 };
  const spat = [];
  let zruseny = false;

  const styl = document.createElement("style");
  styl.id = "lcd-vclass-css";
  styl.textContent = CSS;
  document.head.appendChild(styl);
  document.body.classList.add("lcd-vclass");
  stlpec.classList.add("active");
  // prázdny Popis: Shoptet píše „Popis produktu nie je dostupný“, s vyplneným Popisom sa nič neskrýva
  const popis = document.querySelector("#description .basic-description");
  if (popis && /nie je dostupn/i.test(popis.textContent)) { popis.style.display = "none"; spat.push(() => { popis.style.display = ""; }); }

  const nakres = document.createElement("div");
  nakres.id = "lcd-vclass-nakres";
  nakres.innerHTML = '<div class="lv-pl"><canvas class="lv-pred" role="img" aria-label="Predné koberce triedy V zhora"></canvas><canvas class="lv-zad" role="img" aria-label="Koberce 2. a 3. radu a kufra zhora"></canvas></div><p class="lv-pop">Kresba sa mení podľa vášho výberu, predok je hore.</p>';
  lavy.appendChild(nakres);
  const pred = nakres.querySelector(".lv-pred");
  const zad = nakres.querySelector(".lv-zad");

  const root = document.createElement("div");
  root.id = "lcd-vclass";
  root.innerHTML = '<div class="lv-hl"></div><div class="lv-cena"><div><small>Kompletný set</small><b class="lv-c"></b></div><div class="lv-v">Predok, 2. a 3. rad aj kufor. Rohož do kufra je v cene.</div></div><div class="lv-po"><span class="lv-po1"></span><span class="lv-po2"></span></div><div class="lv-ps"></div><div class="lv-kroky"></div><div class="lv-suhrn"><div class="lv-spolu"><span>Spolu</span><b class="lv-c2"></b></div><p class="lv-spr" hidden></p><button type="button" class="lv-cta"></button></div>';
  stlpec.appendChild(root);
  const povodne = { rodic: hlavicka && hlavicka.parentNode, za: hlavicka && hlavicka.nextSibling };
  if (hlavicka) root.querySelector(".lv-hl").appendChild(hlavicka);
  const kor = root.querySelector(".lv-kroky");
  const spr = root.querySelector(".lv-spr");
  const cta = root.querySelector(".lv-cta");

  // ---- výber -> Shoptet
  const farbaText = () => (S.vzor && S.farba ? VZORY.find((v) => v.id === S.vzor).nm + " – " + S.farba : "");
  const hodnoty = () => ({ velkost: S.velkost, rok: S.rok, volant: S.volant, stred: S.stred, dvere: S.dvere, miesta: S.miesta, stolcek: S.stolcek, zasuvky: S.zasuvky, farba: farbaText(), farba2: S.farba2 ? "Lux Color " + S.farba2 : "" });
  function sync() {
    const h = hodnoty();
    Object.keys(sel).forEach((k) => {
      const o = h[k] ? moznost(sel[k], h[k]) : null;
      const v = o ? o.value : "";
      if (sel[k].value !== v) { sel[k].value = v; sel[k].dispatchEvent(new Event("change", { bubbles: true })); }
    });
  }
  const priplatok = () => { const o = S.velkost ? moznost(sel.velkost, S.velkost) : null; return o ? Number(o.getAttribute("data-surcharge-final-price")) || 0 : 0; };
  const cenaSpolu = () => zaklad + priplatok();

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
        const lux = S.farba2 ? LUX.find((l) => l[0] === S.farba2) : null;
        const far = [f ? f.koza : "#17161a", f ? f.sit : "#dcc9a2", lux ? lux[1] : "#131315"];
        const vzor = S.vzor || "diamond";
        kresli(pred, { cast: "predok", s: S.stred === STRED[1], vzor }, wP, far);
        kresli(zad, { cast: "zadok", v: S.velkost || "XL", d: S.dvere === DVERE[0] ? 1 : 2, s: S.stolcek === STOLCEK[1], z: S.zasuvky === ZASUVKY[1], vzor }, Math.round(wP * 0.745), far);
      } catch (e) {
        nakres.hidden = true; // kresba nie je nutná na objednanie
        console.error("[lcd-1v] vclass kresba", e);
      }
    });
  }

  // ---- kroky
  const hotovy = {
    velkost: () => !!S.velkost, auto: () => !!S.rok, stred: () => !!S.stred, dvere: () => !!S.dvere, miesta: () => !!S.miesta, stolcek: () => !!S.stolcek,
    zasuvky: () => !!S.zasuvky, vzor: () => !!S.vzor, farba: () => !!S.farba, farba2: () => !!S.farba2,
  };
  const suhrn = {
    velkost: () => S.velkost, auto: () => S.rok + ", volant " + S.volant.toLowerCase(), stred: () => S.stred, dvere: () => S.dvere, miesta: () => S.miesta + " miest", stolcek: () => S.stolcek, zasuvky: () => S.zasuvky,
    vzor: () => { const v = VZORY.find((x) => x.id === S.vzor); return v ? v.nm : ""; }, farba: () => S.farba, farba2: () => "Lux Color " + S.farba2,
  };
  const tl = (k, v, vnutro, tr) => '<button type="button" class="' + (tr || "lv-v1") + '" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (String(S[k]) === String(v)) + '">' + vnutro + "</button>";
  const volby = (k, A) => '<div class="lv-g lv-g' + A.length + '">' + A.map((a) => tl(k, a, "<span>" + a + "</span>")).join("") + "</div>";
  const telo = {
    velkost: () => '<div class="lv-g lv-g3">' + VELKOSTI.map((x) => { const o = moznost(sel.velkost, x.v); return tl("velkost", x.v, "<b>" + x.v + "</b><span>" + x.p + "</span><em>" + eur(zaklad + (Number(o.getAttribute("data-surcharge-final-price")) || 0)) + "</em>"); }).join("") + "</div>",
    auto: () => '<label class="lv-l" for="lv-rok">Rok výroby</label><select id="lv-rok" class="lv-sel"><option value="">Vyberte rok</option>' + ROKY.map((r) => "<option" + (r === S.rok ? " selected" : "") + ">" + r + "</option>").join("") + '</select><span class="lv-l">Pozícia volantu</span>' + volby("volant", VOLANT),
    stred: () => volby("stred", STRED),
    dvere: () => volby("dvere", DVERE),
    miesta: () => '<div class="lv-g lv-g4">' + MIESTA.map((m) => tl("miesta", m, "<b>" + m + "</b>")).join("") + "</div>",
    stolcek: () => volby("stolcek", STOLCEK),
    zasuvky: () => volby("zasuvky", ZASUVKY),
    vzor: () => '<div class="lv-g lv-g3">' + VZORY.map((v) => tl("vzor", v.id, '<img src="' + v.img + '" alt="" loading="lazy"><span>' + v.nm + "</span>", "lv-v1 lv-foto")).join("") + "</div>",
    farba: () => '<div class="lv-f">' + (FARBY[S.vzor] || []).map((f) => tl("farba", f.nm, '<img src="' + nahlad(f.slug) + '" alt="" loading="lazy"><span>' + f.nm + "</span>", "lv-sw")).join("") + "</div>",
    farba2: () => '<div class="lv-f">' + LUX.map((l) => tl("farba2", l[0], '<img src="' + nahlad("lux-color-" + l[0]) + '" alt="" loading="lazy"><span>Lux Color ' + l[0] + "</span>", "lv-sw")).join("") + "</div>",
  };
  const kolko = () => KROKY.filter((k) => hotovy[k.id]()).length;
  function hlavicky() {
    const n = KROKY.length, h = kolko();
    root.querySelector(".lv-po1").textContent = "Váš set v " + n + " krokoch";
    root.querySelector(".lv-po2").textContent = "Hotovo " + h + " z " + n;
    root.querySelector(".lv-ps").innerHTML = KROKY.map((k) => '<i class="' + (hotovy[k.id]() ? "h" : "") + '"></i>').join("");
    root.querySelector(".lv-c").innerHTML = (S.velkost ? "" : "<small>od</small> ") + eur(cenaSpolu());
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
      if (i === S.akt) return '<div class="lv-kr lv-ot" data-id="' + k.id + '"><div class="lv-k">Krok ' + (i + 1) + " z " + KROKY.length + '</div><div class="lv-t">' + k.ti + "</div>" + (k.pod ? '<p class="lv-p">' + k.pod + "</p>" : "") + telo[k.id]() + (k.auto ? "" : '<button type="button" class="lv-dalej" data-dalej="1">Pokračovať</button>') + "</div>";
      return '<div class="lv-kr' + (ok ? " lv-ho" : "") + '"><button type="button" class="lv-r" ' + (ok ? 'data-ot="' + i + '"' : "disabled") + '><span class="lv-c-k">' + (ok ? "✓" : i + 1) + "</span><span class=\"lv-r-t\"><b>" + k.nm + "</b><small>" + (ok ? suhrn[k.id]() : k.vy) + "</small></span>" + (ok ? '<span class="lv-z">Zmeniť</span>' : "") + "</button></div>";
    }).join("");
    umiestni();
    hlavicky();
  }
  function posunNa(prvok) {
    if (!prvok || !prvok.getBoundingClientRect) return;
    const r = prvok.getBoundingClientRect();
    const hl = 96;
    if (r.top < hl || r.top > window.innerHeight * 0.7) window.scrollTo({ top: window.pageYOffset + r.top - hl, behavior: "smooth" });
  }
  function dalej() {
    const d = KROKY.findIndex((k) => !hotovy[k.id]());
    S.akt = d >= 0 ? d : -1;
    kroky();
    posunNa(d >= 0 ? kor.querySelector(".lv-ot") : root.querySelector(".lv-suhrn"));
  }
  function oznac() {
    kor.querySelectorAll("button[data-k]").forEach((b) => b.setAttribute("aria-pressed", String(S[b.getAttribute("data-k")]) === b.getAttribute("data-v") ? "true" : "false"));
    hlavicky();
  }

  // ---- udalosti
  let casovac = 0;
  function naKlik(e) {
    const b = e.target.closest && e.target.closest("button");
    if (!b || !root.contains(b)) return;
    if (b.hasAttribute("data-k")) {
      const k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
      S[k] = v;
      if (k === "vzor") { const zostava = (FARBY[v] || []).some((f) => f.nm === S.farba); if (!zostava) S.farba = ""; }
      spr.hidden = true;
      sync();
      oznac();
      prekresli();
      const krok = KROKY.find((x) => x.id === (k === "volant" ? "auto" : k));
      clearTimeout(casovac);
      if (krok && krok.auto) casovac = setTimeout(() => { if (!zruseny) dalej(); }, 240);
      return;
    }
    if (b.hasAttribute("data-ot")) { clearTimeout(casovac); S.akt = +b.getAttribute("data-ot"); kroky(); return; }
    if (b.hasAttribute("data-dalej")) {
      const k = KROKY[S.akt];
      if (k && !hotovy[k.id]()) { spr.hidden = false; spr.textContent = "Prosím, dokončite tento krok."; posunNa(kor.querySelector(".lv-ot")); return; }
      dalej();
      return;
    }
    if (b === cta) doKosika();
  }
  function naZmenu(e) {
    if (e.target && e.target.id === "lv-rok") { S.rok = e.target.value; spr.hidden = true; sync(); hlavicky(); }
  }
  function doKosika() {
    const ch = KROKY.findIndex((k) => !hotovy[k.id]());
    if (ch >= 0) {
      S.akt = ch; kroky();
      spr.hidden = false; spr.textContent = "Ešte chýba: " + KROKY[ch].nm + ".";
      posunNa(kor.querySelector(".lv-ot"));
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
  const priZmene = () => { clearTimeout(naResize); naResize = setTimeout(() => { umiestni(); prekresli(); }, 200); };
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
    if (hlavicka && povodne.rodic) povodne.rodic.insertBefore(hlavicka, povodne.za && povodne.za.parentNode === povodne.rodic ? povodne.za : null);
    [root, nakres, styl].forEach((x) => { if (x.parentNode) x.parentNode.removeChild(x); });
    document.body.classList.remove("lcd-vclass");
  }

  kroky();
  prekresli();
  window.__lcdVclass = { S, sel, zrus, cenaSpolu }; // ladenie a test
  return { zrus };
}
