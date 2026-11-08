// Obsah pod konfigurátorom triedy V (admin-html/src/p1v-vclass): text a fotky sú v HTML z Popisu produktu, aby ich videli vyhľadávače,
// tento modul ich len oživí: prehliadka auta s pôdorysom, kresba podľa verzie auta, ceny zo Shoptetu a otázky pre vyhľadávače.
// Bez neho sa obsah zobrazí celý pod sebou a dá sa čítať.
import { sken } from "./sken.js";
import { kresli } from "./kresba.js";
import { data, t, jeCz } from "./trh.js";
import { NAHLADY_FARIEB } from "../farby-nahlady-data.js";

const FARBY_CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/farby/";
const PODLAHA = "#131315";
const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

/** Pôdorys s číslami: [číslo, plátno, x %, y %] = miesto na kresbe, poradie ako kapitoly v HTML. */
const BODY = [[1, 0, 27, 42], [2, 0, 73, 42], [3, 0, 50, 72], [4, 1, 50, 38], [5, 1, 50, 88]];

/** Svetlo na pôdoryse (Michal 7. 11. 2026: modul má mať pointu): [plátno, x0, y0, x1, y1] v % plátna, zvyšok kresby ustúpi. */
const ZONY = [[0, 3, 0, 49, 76], [0, 51, 0, 97, 76], [0, 29, 44, 71, 100], [1, -4, -2, 104, 69], [1, -4, 67, 104, 102]];

function nakresli(mapa, plan, sirka, sada) {
  const w = Math.max(240, Math.min(620, Math.round(sirka * DPR())));
  const far = [sada.f.koza, sada.f.sit, PODLAHA];
  kresli(mapa.querySelector(".vp-pred"), { cast: "predok", s: false, vzor: sada.vzor, bez2: true }, w, far);
  kresli(mapa.querySelector(".vp-zad"), Object.assign({ cast: "zadok", vzor: sada.vzor, slabe: null }, plan), Math.round(w * 0.745), far);
}

function prehliadka(sek, spat, vyberFarbu) {
  const { FARBY, VZORY } = data();
  const vp = sek.querySelector(".vp");
  const mapa = sek.querySelector(".vp-mapa");
  const kap = Array.prototype.slice.call(sek.querySelectorAll(".vp-k"));
  if (!vp || !mapa || !kap.length) return;
  mapa.innerHTML = '<div class="vp-c"><canvas class="vp-pred" role="img" aria-label="' + t("Pôdorys predných autokobercov triedy V") + '"></canvas></div><div class="vp-c vp-c2"><canvas class="vp-zad" role="img" aria-label="' + t("Pôdorys koberca 2. a 3. radu a kufra") + '"></canvas></div><span class="vp-sv" aria-hidden="true"></span>';
  const platna = mapa.querySelectorAll(".vp-c");
  const sv = mapa.querySelector(".vp-sv");
  const body = BODY.map((b, i) => {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "vp-b";
    t.textContent = String(b[0]);
    t.style.left = b[2] + "%";
    t.style.top = b[3] + "%";
    t.setAttribute("aria-label", b[0] + ": " + kap[i].querySelector("h3").textContent);
    t.addEventListener("click", () => na(i, true));
    platna[b[1]].appendChild(t);
    return t;
  });
  const nav = document.createElement("div");
  nav.className = "vp-chips";
  nav.setAttribute("role", "group");
  nav.setAttribute("aria-label", t("Miesta v aute"));
  const chips = kap.map((k, i) => {
    const t = document.createElement("button");
    t.type = "button";
    t.innerHTML = "<i>" + (i + 1) + "</i><span></span>";
    t.querySelector("span").textContent = k.querySelector("h3").textContent;
    t.addEventListener("click", () => na(i, true));
    nav.appendChild(t);
    return t;
  });
  const zoz = sek.querySelector(".vp-zoz");
  zoz.parentNode.insertBefore(nav, zoz);
  kap.forEach((k, i) => {
    const c = document.createElement("span");
    c.className = "vp-cislo";
    c.textContent = (i + 1) + " / " + kap.length;
    k.querySelector(".vp-f").appendChild(c);
  });
  const pata = document.createElement("div");
  pata.className = "vp-pata";
  pata.innerHTML = '<button type="button" class="vp-spat">' + t("Späť") + '</button><button type="button" class="vp-dalej"></button>';
  zoz.appendChild(pata);
  const spatTl = pata.querySelector(".vp-spat"), dalsia = pata.querySelector(".vp-dalej");
  spatTl.addEventListener("click", () => na((akt - 1 + kap.length) % kap.length, true));
  dalsia.addEventListener("click", () => na((akt + 1) % kap.length, true));

  // farba setu: rovnaké vzory a farby ako v konfigurátore, „Chcem takýto set“ ich prenesie do krokov
  const sada = { vzor: "diamond", f: FARBY.diamond.find((f) => (f.sk || f.nm) === "Čierna, béžové šitie") || FARBY.diamond[0] };
  const lava = document.createElement("div");
  lava.className = "vp-lava";
  vp.insertBefore(lava, mapa);
  lava.appendChild(mapa);
  const far = document.createElement("div");
  far.className = "vp-far";
  far.innerHTML = '<p class="vp-far-t">' + t("Vyskúšajte si, ako by vyzeral Váš set") + '</p><div class="vp-vz" role="group" aria-label="' + t("Vzor prešívania") + '">' + VZORY.map((v) => '<button type="button" data-vz="' + v.id + '">' + v.nm + "</button>").join("") + '</div><div class="vp-sw" role="group" aria-label="' + t("Farba autokobercov") + '"></div><p class="vp-far-n" aria-live="polite"></p><button type="button" class="vp-chcem">' + t("Chcem takýto set") + "</button>";
  vp.appendChild(far); // na PC pás pod kresbou aj fotkou, stĺpce sú rovnako vysoké (Michal 7. 11. 2026)
  const swW = far.querySelector(".vp-sw"), meno = far.querySelector(".vp-far-n");
  const miniatura = (f) => (NAHLADY_FARIEB[f.slug] ? FARBY_CDN + f.slug + "-" + NAHLADY_FARIEB[f.slug] + "-w96.jpg" : "");
  function vzorky() {
    swW.innerHTML = FARBY[sada.vzor].map((f, i) => '<button type="button" data-fa="' + i + '" aria-label="' + f.nm + '" title="' + f.nm + '" aria-pressed="' + (f.nm === sada.f.nm) + '"><img src="' + miniatura(f) + '" alt="" loading="lazy" width="44" height="44"></button>').join("");
    far.querySelectorAll("[data-vz]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-vz") === sada.vzor)));
    meno.textContent = VZORY.find((v) => v.id === sada.vzor).nm + ", " + sada.f.nm;
  }
  function naFar(e) {
    const b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b.classList.contains("vp-chcem")) { if (vyberFarbu) vyberFarbu(sada.vzor, sada.f.nm); return; }
    if (b.hasAttribute("data-vz")) {
      sada.vzor = b.getAttribute("data-vz");
      sada.f = FARBY[sada.vzor].find((f) => f.nm === sada.f.nm) || FARBY[sada.vzor][0];
    } else if (b.hasAttribute("data-fa")) sada.f = FARBY[sada.vzor][+b.getAttribute("data-fa")];
    else return;
    vzorky();
    kresba();
  }
  far.addEventListener("click", naFar);

  let akt = 0;
  function svetlo() {
    const z = ZONY[akt], c = platna[z[0]].getBoundingClientRect(), m = mapa.getBoundingClientRect();
    sv.style.left = c.left - m.left + (c.width * z[1]) / 100 + "px";
    sv.style.top = c.top - m.top + (c.height * z[2]) / 100 + "px";
    sv.style.width = (c.width * (z[3] - z[1])) / 100 + "px";
    sv.style.height = (c.height * (z[4] - z[2])) / 100 + "px";
  }
  function na(i, klik) {
    akt = i;
    kap.forEach((k, n) => { k.classList.toggle("on", n === i); });
    body.forEach((t, n) => t.setAttribute("aria-pressed", n === i ? "true" : "false"));
    chips.forEach((t, n) => { t.setAttribute("aria-pressed", n === i ? "true" : "false"); t.classList.toggle("vp-pred-h", n < i); });
    const dal = (i + 1) % kap.length;
    dalsia.textContent = dal ? t("Ďalej: {0}", kap[dal].querySelector("h3").textContent) : t("Znova od šoféra");
    spatTl.hidden = i === 0;
    svetlo();
    if (klik && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: chips[i].offsetLeft - 16, behavior: "smooth" });
  }
  vp.classList.add("vp-js");
  const plan = { v: "L", d: 2, s: false, z: false };
  function kresba() { try { nakresli(mapa, plan, mapa.clientWidth || 320, sada); svetlo(); } catch (e) { mapa.hidden = true; } }
  vzorky();
  kresba();
  na(0, false);
  let cas = 0;
  const priZmene = () => { clearTimeout(cas); cas = setTimeout(kresba, 200); };
  window.addEventListener("resize", priZmene);
  spat.push(() => { window.removeEventListener("resize", priZmene); far.removeEventListener("click", naFar); });
}

function verzie(sek, spat) {
  const { VELKOSTI } = data();
  const miesto = sek.querySelector(".vv-kresba");
  if (!miesto) return;
  const st = { v: "L", s: false, z: false, d: 2 };
  const P = [
    ["v", t("Dĺžka"), VELKOSTI.map((x) => [x.v, x.v])],
    ["d", t("Bočné dvere"), [[1, t("Jedny")], [2, t("Dvoje")]]],
    ["s", t("Stolček"), [[false, t("Bez")], [true, t("So stolčekom")]]],
    ["z", t("Zásuvky"), [[false, t("Bez")], [true, t("So zásuvkami")]]],
  ];
  miesto.innerHTML = '<canvas role="img" aria-label="' + t("Pôdorys koberca 2. a 3. radu a kufra podľa zvolenej verzie") + '"></canvas><div class="vv-pole">' + P.map((p) => '<div class="vv-r"><span>' + p[1] + "</span><div>" + p[2].map((x) => '<button type="button" data-k="' + p[0] + '" data-v="' + x[0] + '" aria-pressed="' + (st[p[0]] === x[0]) + '">' + x[1] + "</button>").join("") + "</div></div>").join("") + "</div>";
  const pl = miesto.querySelector("canvas");
  const kresba = () => {
    try { kresli(pl, { cast: "zadok", vzor: "diamond", slabe: null, v: st.v, d: st.d, s: st.s, z: st.z }, Math.min(520, Math.round((miesto.clientWidth || 300) * 0.62 * DPR())), ["#17161a", "#dcc9a2", PODLAHA]); } catch (e) { pl.hidden = true; }
  };
  miesto.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button[data-k]");
    if (!b) return;
    const k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
    st[k] = k === "v" ? v : k === "d" ? Number(v) : v === "true";
    miesto.querySelectorAll('button[data-k="' + k + '"]').forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    kresba();
  });
  kresba();
  let cas = 0;
  const priZmene = () => { clearTimeout(cas); cas = setTimeout(kresba, 200); };
  window.addEventListener("resize", priZmene);
  spat.push(() => window.removeEventListener("resize", priZmene));
}

/** Otázky a odpovede aj pre vyhľadávače a AI, text je z HTML sekcie, aby sa nerozišli. */
function faqData(sek, spat) {
  const o = Array.prototype.map.call(sek.querySelectorAll(".p1v-faq-o"), (x) => ({
    "@type": "Question",
    name: x.querySelector(".t").textContent.trim(),
    acceptedAnswer: { "@type": "Answer", text: x.querySelector(".a").textContent.trim() },
  }));
  if (!o.length) return;
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.id = "lcd-vclass-faq-data";
  s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: o });
  document.head.appendChild(s);
  spat.push(() => { if (s.parentNode) s.parentNode.removeChild(s); });
}

/** Vodorovný pás so šípkami: galéria a videá (Michal 7. 11. 2026: oveľa viac fotiek a tlačidlá na posúvanie). */
function pas(w, spat) {
  if (!w || w.getAttribute("data-lv-pas")) return;
  w.setAttribute("data-lv-pas", "1");
  const o = document.createElement("div");
  o.className = "vl-pas";
  w.parentNode.insertBefore(o, w);
  o.appendChild(w);
  const tl = [-1, 1].map((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "vl-sip " + (s < 0 ? "vl-sip-l" : "vl-sip-p");
    b.setAttribute("aria-label", s < 0 ? t("Predošlé") : t("Ďalšie"));
    b.addEventListener("click", () => w.scrollBy({ left: s * w.clientWidth * 0.85, behavior: "smooth" }));
    o.appendChild(b);
    return b;
  });
  const stav = () => { tl[0].disabled = w.scrollLeft < 8; tl[1].disabled = w.scrollLeft > w.scrollWidth - w.clientWidth - 8; };
  w.addEventListener("scroll", stav, { passive: true });
  window.addEventListener("resize", stav);
  stav();
  spat.push(() => { window.removeEventListener("resize", stav); });
}

/** Galéria: odkaz na plnú fotku sa berie z obrázka, aby sa všetky fotky zmestili do Popisu produktu. */
function galeria(sek, spat) {
  sek.querySelectorAll(".vg-f").forEach((f) => {
    const i = f.querySelector("img");
    if (!i) return;
    // tlačidlo nie je v Popise, šetrí to znaky (limit 45 000), bez skriptu je fotka aj tak vidno
    let b = f.querySelector("button");
    if (!b) {
      b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", t("Zväčšiť fotku"));
      i.parentNode.insertBefore(b, i);
      b.appendChild(i);
    }
    b.setAttribute("data-p1v-lb-foto", i.getAttribute("src"));
    b.setAttribute("data-p1v-lb-sada", "vclass-galeria");
    b.setAttribute("data-p1v-lb-popis", i.getAttribute("alt") || "");
  });
  pas(sek.querySelector(".vg"), spat);
}

/** Otázka pred objednávkou: rovnaký formulár Shoptetu ako na titulke (lcdHome.js), meno a správa sú nepovinné, telefón a auto idú do správy. */
function kontakt(sek) {
  const m = sek.querySelector(".vt-form");
  if (!m) return;
  // súhlas a stránka ochrany údajov ako formulár na titulke daného webu (admin-html/src/hp-telo-2.<sk|cz>.html): SK 25, CZ 40
  const cz = jeCz();
  m.innerHTML = '<form class="vt-f" action="/action/MailForm/SendEmail/" method="post" novalidate><input type="hidden" name="formId" value="1"><input type="hidden" name="consents[]" value="' + (cz ? "40" : "25") + '">'
    + '<label class="vt-p"><span>' + t("Meno a priezvisko") + " <small>" + t("nepovinné") + '</small></span><input type="text" name="fullName" autocomplete="name"></label>'
    + '<label class="vt-p"><span>E-mail</span><input type="email" name="email" autocomplete="email" required><em>' + t("Skontrolujte e-mail") + "</em></label>"
    + '<label class="vt-p"><span>' + t("Telefónne číslo") + '</span><input type="tel" class="vt-tel" autocomplete="tel" placeholder="+421 900 000 000" required><em>' + t("Doplňte telefónne číslo") + "</em></label>"
    + '<label class="vt-p vt-s"><span>' + t("Vaša otázka") + " <small>" + t("nepovinné") + '</small></span><textarea name="message" rows="4" placeholder="' + t("Napíšte, s čím Vám môžeme pomôcť, napríklad verzia auta, farba alebo termín.") + '"></textarea></label>'
    + '<span class="vt-hp" aria-hidden="true"><label>Surname<input type="text" name="surname" value="" autocomplete="off" tabindex="-1"></label></span>'
    + '<div class="vt-a"><button type="submit">' + t("Odošlite správu") + "</button><p>" + t("Vložením správy súhlasíte s") + ' <a href="' + (cz ? "/podminky-ochrany-osobnich-udaju/" : "/podmienky-ochrany-osobnych-udajov/") + '">' + t("podmienkami ochrany osobných údajov") + '</a>.</p></div><p class="vt-st" role="status" hidden></p></form>';
  const f = m.querySelector("form"), stav = f.querySelector(".vt-st"), tel = f.querySelector(".vt-tel"), sprava = f.querySelector("textarea");
  f.addEventListener("submit", (e) => {
    f.classList.add("overene");
    if (!f.checkValidity()) { e.preventDefault(); const p = f.querySelector(":invalid"); if (p) p.focus(); return; }
    if (!sprava.getAttribute("data-zlozene")) {
      const mail = f.querySelector('input[name="email"]').value.trim();
      sprava.value = (sprava.value.trim() || t("Prosím, kontaktujte ma.")) + "\n\n" + t("Telefón") + ": " + tel.value.trim() + "\nE-mail: " + mail + "\nAuto: Mercedes V Class";
      sprava.setAttribute("data-zlozene", "1");
    }
    const meno = f.querySelector('input[name="fullName"]');
    if (!window.fetch || !window.FormData) { if (!meno.value.trim()) meno.value = tel.value.trim(); return; }
    e.preventDefault();
    const tl = f.querySelector('button[type="submit"]'), povodny = tl.textContent;
    tl.disabled = true;
    tl.textContent = t("Odosielam…");
    const data = new FormData(f);
    if (!meno.value.trim()) data.set("fullName", tel.value.trim());
    fetch(f.action, { method: "POST", body: data, credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        f.reset();
        sprava.removeAttribute("data-zlozene");
        f.classList.remove("overene");
        stav.textContent = t("Ďakujeme, správa odišla. Ozveme sa Vám spravidla do hodiny.");
        stav.hidden = false;
      })
      .catch(() => { if (!meno.value.trim()) meno.value = tel.value.trim(); f.submit(); })
      .then(() => { tl.disabled = false; tl.textContent = povodny; });
  });
}

export function ozivObsah({ prc, zaklad, eur, vyberFarbu }) {
  const { VELKOSTI, LUX, ROHOZ, BOXY, rozSet } = data();
  const spat = [];
  const hotovo = {};
  const rad = (v) => prc("rozlozenie", rozSet(v));
  const druha = prc("farba2", "Lux Color " + LUX[0][0]);
  const rohoz = prc("rohoz", ROHOZ[0]);
  const CENY = { zaklad, "rad-od": rad("M"), druha, rohoz, "box-od": prc("box1", BOXY[0].t) };
  VELKOSTI.forEach((x) => { CENY["komplet-" + x.v] = zaklad + rad(x.v) + druha + rohoz; });
  const sekcia = (m) => document.querySelector('[data-lcd-sekcia="' + m + '"]');
  function skus() {
    const p = sekcia("vclass-prehliadka"), v = sekcia("vclass-verzie"), f = sekcia("d-faq"), k = sekcia("vclass-sken"), g = sekcia("vclass-galeria"), y = sekcia("vclass-videa"), t = sekcia("vclass-kontakt");
    if (p && !hotovo.p) { hotovo.p = 1; prehliadka(p, spat, vyberFarbu); }
    if (v && !hotovo.v) { hotovo.v = 1; verzie(v, spat); }
    if (f && !hotovo.f) { hotovo.f = 1; faqData(f, spat); }
    if (k && !hotovo.k) { hotovo.k = 1; sken(k, spat); pas(k.querySelector(".vy"), spat); }
    if (g && !hotovo.g) { hotovo.g = 1; galeria(g, spat); }
    if (y && !hotovo.y) { hotovo.y = 1; pas(y.querySelector(".vy"), spat); }
    if (t && !hotovo.t) { hotovo.t = 1; kontakt(t); }
    document.querySelectorAll("[data-lv-cena]").forEach((e) => {
      const c = CENY[e.getAttribute("data-lv-cena")];
      if (c > 0 && !e.textContent) e.textContent = eur(c);
    });
    if (hotovo.p && hotovo.v && hotovo.f && hotovo.k && hotovo.g && hotovo.y && hotovo.t && mo) { mo.disconnect(); mo = null; }
  }
  let mo = typeof MutationObserver === "function" ? new MutationObserver(skus) : null;
  if (mo) mo.observe(document.body, { childList: true, subtree: true });
  skus();
  return () => { if (mo) mo.disconnect(); spat.forEach((f) => { try { f(); } catch (e) { /* nič */ } }); };
}
