// Obsah pod konfigurátorom triedy V (admin-html/src/p1v-vclass): text a fotky sú v HTML z Popisu produktu, aby ich videli vyhľadávače,
// tento modul ich len oživí: prehliadka auta s pôdorysom, kresba podľa verzie auta, ceny zo Shoptetu a otázky pre vyhľadávače.
// Bez neho sa obsah zobrazí celý pod sebou a dá sa čítať.
import { kresli } from "./kresba.js";
import { VELKOSTI, LUX, ROHOZ, BOXY, rozSet } from "./data.js";

const FARBY = ["#17161a", "#dcc9a2", "#131315"];
const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

/** Pôdorys s číslami: [číslo, plátno, x %, y %] = miesto na kresbe, poradie ako kapitoly v HTML. */
const BODY = [[1, 0, 27, 42], [2, 0, 73, 42], [3, 0, 50, 72], [4, 1, 50, 38], [5, 1, 50, 88]];

function nakresli(mapa, plan, sirka) {
  const w = Math.max(240, Math.min(620, Math.round(sirka * DPR())));
  kresli(mapa.querySelector(".vp-pred"), { cast: "predok", s: false, vzor: "diamond", bez2: true }, w, FARBY);
  kresli(mapa.querySelector(".vp-zad"), Object.assign({ cast: "zadok", vzor: "diamond", slabe: null }, plan), Math.round(w * 0.745), FARBY);
}

function prehliadka(sek, spat) {
  const vp = sek.querySelector(".vp");
  const mapa = sek.querySelector(".vp-mapa");
  const kap = Array.prototype.slice.call(sek.querySelectorAll(".vp-k"));
  if (!vp || !mapa || !kap.length) return;
  mapa.innerHTML = '<div class="vp-c"><canvas class="vp-pred" role="img" aria-label="Pôdorys predných autokobercov triedy V"></canvas></div><div class="vp-c vp-c2"><canvas class="vp-zad" role="img" aria-label="Pôdorys koberca 2. a 3. radu a kufra"></canvas></div>';
  const platna = mapa.querySelectorAll(".vp-c");
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
  nav.setAttribute("aria-label", "Miesta v aute");
  const chips = kap.map((k, i) => {
    const t = document.createElement("button");
    t.type = "button";
    t.textContent = k.querySelector("h3").textContent;
    t.addEventListener("click", () => na(i, true));
    nav.appendChild(t);
    return t;
  });
  const zoz = sek.querySelector(".vp-zoz");
  zoz.parentNode.insertBefore(nav, zoz);
  const dalsia = document.createElement("button");
  dalsia.type = "button";
  dalsia.className = "vp-dalej";
  dalsia.addEventListener("click", () => na((akt + 1) % kap.length, true));
  zoz.appendChild(dalsia);
  let akt = 0;
  function na(i, klik) {
    akt = i;
    kap.forEach((k, n) => { k.classList.toggle("on", n === i); });
    body.forEach((t, n) => t.setAttribute("aria-pressed", n === i ? "true" : "false"));
    chips.forEach((t, n) => t.setAttribute("aria-pressed", n === i ? "true" : "false"));
    dalsia.textContent = "Ďalej: " + kap[(i + 1) % kap.length].querySelector("h3").textContent;
    if (klik && chips[i].scrollIntoView && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: chips[i].offsetLeft - 16, behavior: "smooth" });
  }
  vp.classList.add("vp-js");
  const plan = { v: "L", d: 2, s: false, z: false };
  const kresba = () => { try { nakresli(mapa, plan, mapa.clientWidth || 320); } catch (e) { mapa.hidden = true; } };
  na(0, false);
  kresba();
  let cas = 0;
  const priZmene = () => { clearTimeout(cas); cas = setTimeout(kresba, 200); };
  window.addEventListener("resize", priZmene);
  spat.push(() => window.removeEventListener("resize", priZmene));
}

function verzie(sek, spat) {
  const miesto = sek.querySelector(".vv-kresba");
  if (!miesto) return;
  const st = { v: "L", s: false, z: false, d: 2 };
  const P = [
    ["v", "Dĺžka", VELKOSTI.map((x) => [x.v, x.v])],
    ["d", "Bočné dvere", [[1, "Jedny"], [2, "Dvoje"]]],
    ["s", "Stolček", [[false, "Bez"], [true, "So stolčekom"]]],
    ["z", "Zásuvky", [[false, "Bez"], [true, "So zásuvkami"]]],
  ];
  miesto.innerHTML = '<canvas role="img" aria-label="Pôdorys koberca 2. a 3. radu a kufra podľa zvolenej verzie"></canvas><div class="vv-pole">' + P.map((p) => '<div class="vv-r"><span>' + p[1] + "</span><div>" + p[2].map((x) => '<button type="button" data-k="' + p[0] + '" data-v="' + x[0] + '" aria-pressed="' + (st[p[0]] === x[0]) + '">' + x[1] + "</button>").join("") + "</div></div>").join("") + "</div>";
  const pl = miesto.querySelector("canvas");
  const kresba = () => {
    try { kresli(pl, { cast: "zadok", vzor: "diamond", slabe: null, v: st.v, d: st.d, s: st.s, z: st.z }, Math.min(520, Math.round((miesto.clientWidth || 300) * 0.62 * DPR())), FARBY); } catch (e) { pl.hidden = true; }
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

export function ozivObsah({ prc, zaklad, eur }) {
  const spat = [];
  const hotovo = {};
  const rad = (v) => prc("rozlozenie", rozSet(v));
  const druha = prc("farba2", "Lux Color " + LUX[0][0]);
  const rohoz = prc("rohoz", ROHOZ[0]);
  const CENY = { zaklad, "rad-od": rad("M"), druha, rohoz, "box-od": prc("box1", BOXY[0].t) };
  VELKOSTI.forEach((x) => { CENY["komplet-" + x.v] = zaklad + rad(x.v) + druha + rohoz; });
  const sekcia = (m) => document.querySelector('[data-lcd-sekcia="' + m + '"]');
  function skus() {
    const p = sekcia("vclass-prehliadka"), v = sekcia("vclass-verzie"), f = sekcia("d-faq");
    if (p && !hotovo.p) { hotovo.p = 1; prehliadka(p, spat); }
    if (v && !hotovo.v) { hotovo.v = 1; verzie(v, spat); }
    if (f && !hotovo.f) { hotovo.f = 1; faqData(f, spat); }
    document.querySelectorAll("[data-lv-cena]").forEach((e) => {
      const c = CENY[e.getAttribute("data-lv-cena")];
      if (c > 0 && !e.textContent) e.textContent = eur(c);
    });
    if (hotovo.p && hotovo.v && hotovo.f && mo) { mo.disconnect(); mo = null; }
  }
  let mo = typeof MutationObserver === "function" ? new MutationObserver(skus) : null;
  if (mo) mo.observe(document.body, { childList: true, subtree: true });
  skus();
  return () => { if (mo) mo.disconnect(); spat.forEach((f) => { try { f(); } catch (e) { /* nič */ } }); };
}
