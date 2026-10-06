#!/usr/bin/env node
/* admin-html/extract-z-markup.mjs — JEDNORAZOVÝ prevod dnešného JS markupu do admin-html/src/.

   Web bez prekrývania (variant A, Michal 6. 10. 2026): obsah titulky, menu a rozcestníka
   už nekreslí JS, ale príde v HTML zo Shoptet adminu. Tento skript ho raz vytiahne z reťazcov
   v assets/js/*-markup.js a uloží do admin-html/src/<cast>.<sk|cz>.html. Od tej chvíle je
   ZDROJOM PRAVDY admin-html/src/ (upravuje sa ručne) a tento skript sa už bežne nespúšťa —
   ostáva tu len kvôli tomu, aby sa dal prevod zopakovať a skontrolovať.

   Čo robí (SK aj CZ):
   - titulka (LCDH_MARKUP): moduly z lcdHomeModuly.js (pred a po, farby, galéria, čísla kapitol)
     poskladá rovnakou funkciou ako web (lcdhModulyPostav); FAQ, #s2Thumbs a #s2Mob zapečie
     rovnako, ako ich dnes stavia lcdHome.js; odstráni header.hdr, #mega a #megaOvl (hlavička
     je natívna Shoptetova, menu ide do banneru); h1 -> h2.lcd-h1 (H1 dá Shoptet);
     atrapu konfigurátora (#tabs, #fields) nahradí slotom <div id="konfSlot"> s rezervovanou
     výškou a odkazom pre prípad bez JS; rozdelí na hp-vrch (hero + karta konfigurátora)
     a telo (zvyšné sekcie, delí až build podľa limitu — tu ide celé do hp-telo).
   - menu (LCDHDR_MARKUP): #megaOvl + nav#mega, do menu presunie prepínač SK/CZ z hlavičky.
   - rozcestník (LCDRZ_MARKUP): bez hlavičky, menu a <main>; h1 -> h2.lcd-h1; slot konfigurátora
     + záložné kotvy #Model-selecte a #sets (main.js); prázdne prvky dostanú <!-- -->
     (TinyMCE by ich inak zmazal alebo vyplnil &nbsp;).
   - každý <img>: explicitný loading (hero eager + fetchpriority=high, ostatné lazy)
     a width/height (z hlavičky súboru v assets/img/, ak chýbajú).
   Texty pre zákazníka sa NEMENIA, len sa presúvajú. Nové sú len „Vybrať auto“ / „Vybrat auto“
   (odkaz v slote, keď sa konfigurátor nenačíta) — dohodnuté v zadaní.

   Vstup sa číta z gitu (default HEAD), aby výsledok nezávisel od rozpracovaných zmien v JS:
     node admin-html/extract-z-markup.mjs                 # z HEAD, zapíše admin-html/src/
     node admin-html/extract-z-markup.mjs --rev 22d89fd   # z konkrétneho commitu
     node admin-html/extract-z-markup.mjs --rev worktree  # z pracovnej kópie
     node admin-html/extract-z-markup.mjs --out C:/tmp/x  # inam (napr. na porovnanie so src)
   Potrebuje jsdom (devDependency repa). */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const TU = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(TU, "..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const REV = arg("--rev", "HEAD");
const OUT = path.resolve(arg("--out", path.join(TU, "src")));
const require = createRequire(path.join(REPO, "package.json"));
const { JSDOM } = require("jsdom");

const CDN_IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/";

/* ---------------- vstupy ---------------- */
function citaj(rel) {
  if (REV === "worktree") return fs.readFileSync(path.join(REPO, rel), "utf8");
  return execFileSync("git", ["-C", REPO, "show", `${REV}:${rel}`], { encoding: "utf8", maxBuffer: 64 << 20 });
}
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "lcd-admin-html-"));
async function modul(meno) {
  const ciel = path.join(TMP, meno + ".mjs");
  fs.writeFileSync(ciel, citaj("assets/js/" + meno + ".js"));
  return import(pathToFileURL(ciel).href);
}
const mkHome = await modul("lcdHome-markup");
const mkHdr = await modul("lcdHdr-markup");
const mkRz = await modul("lcdRz-markup");
const moduly = await modul("lcdHomeModuly");
const lcdHomeJs = citaj("assets/js/lcdHome.js");
const lcdRzJs = citaj("assets/js/lcdRz.js");

/* texty, ktoré dnes JS píše natvrdo po slovensky (aj na .cz) -> data-* v HTML, nech ich JS berie odtiaľ.
   SK sa berie z JS, CZ je preklad toho istého (dnes sa na .cz zobrazuje slovenčina = chyba). */
function zJs(js, re, popis) {
  const m = js.match(re);
  if (!m) throw new Error("nenašiel som v JS: " + popis);
  return m.slice(1);
}
const [MAT_ZLOZIT_SK] = zJs(lcdHomeJs, /matToggle\.textContent = o>0\.5 \? '([^']+)' : '[^']+'/, "text Zložiť materiál");
const [RZ_H_SK] = zJs(lcdRzJs, /if \(h1\) h1\.textContent = "([^"]+)";/, "nadpis rozcestníka bez auta");
const [RZ_KROK_SK] = zJs(lcdRzJs, /if \(orn\) orn\.textContent = "([^"]+)";/, "krok rozcestníka bez auta");
const JS_TEXTY = {
  sk: { matZlozit: MAT_ZLOZIT_SK, rzNadpis: RZ_H_SK, rzKrok: RZ_KROK_SK },
  cz: { matZlozit: "Složit materiál", rzNadpis: "Vyberte si koberce pro své vozidlo", rzKrok: "Krok 1 ze 2" },
};

/* FAQ je dnes v lcdHome.js ako pole [otázka, odpoveď] (var Q_SK / var Q_CZ) */
function faqZJs(meno) {
  const m = lcdHomeJs.match(new RegExp("var " + meno + "\\s*=\\s*(\\[[\\s\\S]*?\\n\\s*\\]);"));
  if (!m) throw new Error("lcdHome.js: nenašiel som " + meno);
  const pole = new Function("return " + m[1])();
  if (!Array.isArray(pole) || !pole.length || pole.some((q) => q.length !== 2)) throw new Error(meno + ": zlý tvar");
  return pole;
}
const FAQ = { sk: faqZJs("Q_SK"), cz: faqZJs("Q_CZ") };

/* ---------------- rozmery obrázkov z hlavičky súboru (JPEG/PNG/WebP), bez závislostí ---------------- */
function rozmeryBuf(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { i += m === 0xff ? 1 : 2; continue; }
      const dlz = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + dlz;
    }
  }
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const typ = b.toString("ascii", 12, 16);
    if (typ === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (typ === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (typ === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  }
  return null;
}
const rozmeryCache = new Map();
function rozmery(url) {
  if (!url || !url.startsWith(CDN_IMG)) return null;
  const rel = "assets/img/" + url.slice(CDN_IMG.length).split(/[?#]/)[0];
  if (!rozmeryCache.has(rel)) {
    let r = null;
    try { r = rozmeryBuf(fs.readFileSync(path.join(REPO, rel))); } catch {}
    rozmeryCache.set(rel, r);
  }
  return rozmeryCache.get(rel);
}

/* každý <img>: loading (hero eager + fetchpriority=high, ostatné lazy) a width/height */
function upravObrazky(root, hero, zaznam) {
  root.querySelectorAll("img").forEach((im) => {
    if (im === hero) {
      im.setAttribute("loading", "eager");
      im.setAttribute("fetchpriority", "high");
    } else if (!im.hasAttribute("loading") || im.getAttribute("loading") !== "lazy") {
      im.setAttribute("loading", "lazy");
    }
    if (!im.hasAttribute("width") || !im.hasAttribute("height")) {
      const r = rozmery(im.getAttribute("src") || im.getAttribute("data-src"));
      if (!r) { zaznam.push("BEZ ROZMEROV: " + (im.getAttribute("src") || im.getAttribute("data-src"))); return; }
      im.setAttribute("width", String(r.w));
      im.setAttribute("height", String(r.h));
      zaznam.push(`${r.w}x${r.h} ${(im.getAttribute("src") || im.getAttribute("data-src")).split("/").slice(-2).join("/")}`);
    }
  });
}

/* h1 -> h2.lcd-h1[data-lcd-h1] (rovnaký obsah aj atribúty); H1 stránky dáva Shoptet */
function h1NaH2(d, h1) {
  if (!h1) return null;
  const h2 = d.createElement("h2");
  for (const a of h1.attributes) h2.setAttribute(a.name, a.value);
  h2.classList.add("lcd-h1");
  h2.setAttribute("data-lcd-h1", ""); /* lcdRz.js hľadá "h1, [data-lcd-h1]" */
  while (h1.firstChild) h2.appendChild(h1.firstChild);
  h1.replaceWith(h2);
  return h2;
}

/* min-height slotu = výška živého konfigurátora (merané 6. 10. 2026 na živom webe):
   titulka 503 px pod 761 px šírky (1 stĺpec), 231 px od 761 px (PC, v jednom riadku),
   rozcestník 427 / 148 px. Zlom 761 px = @media(min-width:761px) v luxuryCar.css (.lcdh-konf-slot).
   max/min/calc vyrobí „schod“ bez @media, takže to funguje priamo v style="" (aj v TinyMCE poli). */
const slotStyl = (mob, pc) => `min-height:max(${pc}px,min(${mob}px,(761px - 100vw)*1000))`;

/* prázdny prvok (bez textu, prvkov aj komentára) by TinyMCE zmazal alebo vyplnil &nbsp; ->
   dostane <!-- --> (TinyMCE ho nechá, prehliadač nič nevykreslí) */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const NECHAJ_PRAZDNE = new Set(["textarea", "video", "audio", "iframe", "script", "style", "canvas", "svg"]);
function vyplnPrazdne(root, d) {
  let n = 0;
  root.querySelectorAll("*").forEach((el) => {
    const meno = el.localName;
    if (VOID.has(meno) || NECHAJ_PRAZDNE.has(meno) || el.closest("svg")) return;
    const obsah = [...el.childNodes].some((c) => c.nodeType === 1 || c.nodeType === 8 || (c.nodeType === 3 && c.data.trim()));
    if (!obsah) { el.textContent = ""; el.appendChild(d.createComment(" ")); n++; }
  });
  return n;
}

/* odstráni prvok aj s medzerami pred ním (nech v src neostanú prázdne riadky) */
function odstran(el) {
  const pred = el.previousSibling;
  if (pred && pred.nodeType === 3 && !pred.data.trim()) pred.remove();
  el.remove();
}

/* uzly hlavného obsahu aj s komentármi pred sekciami (oddeľovače pre ľudí; build ich zmaže) */
function deti(el) {
  return [...el.childNodes].filter((c) => c.nodeType === 1 || (c.nodeType === 8 && c.data.trim()));
}
const serial = (uzly) => uzly.map((c) => (c.nodeType === 8 ? `<!--${c.data}-->` : c.outerHTML)).join("\n");

function novyDom() {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  /* lcdHomeModuly.zHTML() volá document.createElement("template") */
  globalThis.document = dom.window.document;
  return dom.window.document;
}

/* ================= TITULKA ================= */
function titulka(cz) {
  const web = cz ? "cz" : "sk";
  const d = novyDom();
  const wrap = d.createElement("div");
  wrap.innerHTML = cz ? mkHome.LCDH_MARKUP_CZ : mkHome.LCDH_MARKUP;
  const root = wrap.querySelector("#lcd-home");
  if (!root) throw new Error("LCDH_MARKUP: chýba #lcd-home");

  /* 1) moduly presne ako web (lcdHome.js boot -> lcdhModulyPostav pred vložením do stránky) */
  moduly.lcdhModulyPostav(root, cz);

  /* 2) hlavička a menu preč (natívna Shoptet hlavička, menu v banneri 172/108) */
  root.querySelectorAll(":scope > header.hdr, :scope > #megaOvl, :scope > #mega").forEach((e) => e.remove());

  /* 3) FAQ — rovnaký DOM, aký stavia lcdHome.js (details > summary > .i/.t/.p + div.a) */
  const faq = root.querySelector("#faq");
  if (!faq) throw new Error("chýba #faq");
  FAQ[web].forEach((q, i) => {
    const det = d.createElement("details");
    det.innerHTML = '<summary><span class="i">' + String(i + 1).padStart(2, "0") +
      '</span><span class="t"></span><span class="p">+</span></summary><div class="a"></div>';
    det.querySelector(".t").textContent = q[0];
    det.querySelector(".a").textContent = q[1];
    faq.appendChild(d.createTextNode("\n"));
    faq.appendChild(det);
  });
  faq.appendChild(d.createTextNode("\n"));

  /* 4) #s2Thumbs a #s2Mob — ako lcdHome.js („01-05: jeden krok naraz“) */
  const stage2 = root.querySelector("#stage2");
  const s2imgs = [...root.querySelectorAll(".s2-media img")];
  const s2texts = [...root.querySelectorAll(".s2-t")];
  const s2th = root.querySelector("#s2Thumbs");
  if (!stage2 || !s2imgs.length || !s2th) throw new Error("chýba #stage2 / .s2-media img / #s2Thumbs");
  s2imgs.forEach((img, i) => {
    const b = d.createElement("button");
    b.type = "button"; b.dataset.i = String(i);
    b.setAttribute("aria-label", "Krok " + (i + 1));
    const im = d.createElement("img");
    im.setAttribute("src", img.getAttribute("src")); im.setAttribute("alt", ""); im.setAttribute("loading", "lazy");
    if (img.hasAttribute("width")) im.setAttribute("width", img.getAttribute("width"));
    if (img.hasAttribute("height")) im.setAttribute("height", img.getAttribute("height"));
    const no = d.createElement("b"); no.textContent = String(i + 1).padStart(2, "0");
    b.appendChild(im); b.appendChild(no);
    s2th.appendChild(d.createTextNode("\n"));
    s2th.appendChild(b);
  });
  s2th.appendChild(d.createTextNode("\n"));
  const mob = root.querySelector("#s2Mob");
  if (!mob) throw new Error("chýba #s2Mob");
  const head = stage2.querySelector(".pinhead");
  if (head) mob.appendChild(head.cloneNode(true));
  const track = d.createElement("div"); track.className = "s2m-track";
  s2imgs.forEach((img, i) => {
    const card = d.createElement("article"); card.className = "s2m-card";
    const ph = d.createElement("div"); ph.className = "s2m-ph";
    const im = img.cloneNode(true); im.removeAttribute("class"); im.removeAttribute("data-i");
    im.setAttribute("loading", "lazy");
    const no = d.createElement("span"); no.className = "s2m-no"; no.textContent = String(i + 1).padStart(2, "0");
    ph.appendChild(im); ph.appendChild(no);
    const body = d.createElement("div"); body.className = "s2m-body";
    body.innerHTML = s2texts[i].innerHTML;
    card.appendChild(ph); card.appendChild(body);
    track.appendChild(d.createTextNode("\n")); track.appendChild(card);
  });
  track.appendChild(d.createTextNode("\n"));
  mob.appendChild(track);
  const dots = d.createElement("div"); dots.className = "s2m-dots";
  s2imgs.forEach((_, i) => {
    const b = d.createElement("button"); b.type = "button"; b.textContent = String(i + 1);
    const h = s2texts[i].querySelector("h3");
    b.setAttribute("aria-label", h ? h.textContent : String(i + 1));
    dots.appendChild(b);
  });
  mob.appendChild(dots);

  /* 4b) tlačidlo materiálu: text pre oba stavy v data-* (lcdHome.js ho písal natvrdo po slovensky) */
  const mat = root.querySelector("#matToggle");
  if (mat) {
    mat.setAttribute("data-rozlozit", mat.textContent.trim());
    mat.setAttribute("data-zlozit", JS_TEXTY[web].matZlozit);
  }

  /* 5) hero: h1 -> h2.lcd-h1, obrázok je LCP */
  const hero = root.querySelector("header.hero");
  h1NaH2(d, hero && hero.querySelector("h1"));
  const heroImg = root.querySelector("#heroBg img");
  if (!heroImg) throw new Error("chýba #heroBg img");

  /* 6) karta konfigurátora: atrapa (#tabs, #fields) -> slot; „Vybrať auto“ pre prípad bez JS */
  const karta = root.querySelector("#konfCard");
  if (!karta) throw new Error("chýba #konfCard");
  karta.querySelectorAll(":scope > #tabs, :scope > #fields").forEach(odstran);
  const slot = d.createElement("div");
  slot.id = "konfSlot";
  slot.className = "lcdh-konf-slot";
  slot.setAttribute("style", slotStyl(503, 231));
  slot.innerHTML = '<a class="btn konf-bezjs" href="/rozcestnik/">' + (cz ? "Vybrat auto" : "Vybrať auto") + "</a>";
  const pozn = karta.querySelector(".konf-note");
  karta.insertBefore(slot, pozn || null);
  karta.insertBefore(d.createTextNode("\n    "), slot);
  if (pozn) karta.insertBefore(d.createTextNode("\n    "), pozn);

  /* 7) obrázky */
  const zaznam = [];
  upravObrazky(root, heroImg, zaznam);

  /* 8) rozdelenie na bannery: kus 1 (Stred, #lcd-home) MUSÍ začínať hero + kartou konfigurátora,
        zvyšok ide za ním v poradí stránky; posledný kus má aj lightbox videí. Delí sa len na
        hraniciach sekcií (rozdelTitulku), každý kus <= LIMIT. */
  const main = root.querySelector(":scope > main");
  if (!main) throw new Error("chýba main");
  const uzly = deti(main);
  const iKonf = uzly.findIndex((c) => c.nodeType === 1 && c.id === "konf");
  if (iKonf < 0) throw new Error("chýba section#konf");
  const lb = root.querySelector(":scope > #lb");
  if (lb) uzly.push(d.createComment(" ================= LIGHTBOX VIDEA ================= "), lb);
  const ostatne = [...root.children].filter((e) => e !== main && e !== lb);
  if (ostatne.length) throw new Error("neznáme prvky v #lcd-home: " + ostatne.map((e) => e.outerHTML.slice(0, 60)).join(" | "));
  return { uzly, iKonf, zaznam };
}

/* bannery titulky: kus 1 = #lcd-home (hp-vrch, Stred), kus 2.. = #lcd-home-N (hp-telo-N-1, Zápätie) */
const KORENE = [
  ["lcd-home", "hp-vrch"], ["lcd-home-2", "hp-telo-1"], ["lcd-home-3", "hp-telo-2"],
];
const obal = (i, obsah) => `<div id="${KORENE[i][0]}" class="lcd-root" data-lcd-cast="${KORENE[i][1]}">\n${obsah}\n</div>\n`;

/* rozdelí uzly titulky na najmenší počet kusov (max. 3 = počet koreňov, ktoré pozná CSS/JS)
   na hraniciach sekcií; pri danom počte vyberie rezy s čo najmenším najväčším kusom.
   Prvý kus musí obsahovať aspoň hero + kartu konfigurátora. Dĺžka = po zhutnení ako v builde. */
const zhutnenaDlzka = (html) => html.replace(/<!--(?!\s*-->)[\s\S]*?-->/g, "").replace(/[ \t\r\n\f]*\n[ \t\r\n\f]*/g, "\n").length;
function rozdelTitulku(uzly, iKonf, limit) {
  const bloky = [];
  let cak = []; /* komentár ide spolu s nasledujúcou sekciou */
  for (const c of uzly) { cak.push(c); if (c.nodeType === 1) { bloky.push(cak); cak = []; } }
  if (cak.length && bloky.length) bloky[bloky.length - 1].push(...cak);
  const minPrvy = bloky.findIndex((b) => b.some((c) => c.nodeType === 1 && c.id === "konf")) + 1;
  const dl = bloky.map((b) => zhutnenaDlzka(serial(b)) + 1);
  const rezia = obal(1, "").length + 24; /* obal + data-lcd-v="…" */
  const sucet = (a, b) => dl.slice(a, b).reduce((x, y) => x + y, 0);
  const rezy = (od, zostava) => {
    if (zostava === 1) { const v = sucet(od, bloky.length); return [[v], [bloky.length], v]; }
    let best = null;
    for (let k = Math.max(od + 1, od === 0 ? minPrvy : 0); k <= bloky.length - zostava + 1; k++) {
      const [vel, hr] = rezy(k, zostava - 1);
      const m = Math.max(sucet(od, k), ...vel);
      if (!best || m < best[2]) best = [[sucet(od, k), ...vel], [k, ...hr], m];
    }
    return best || [[Infinity], [bloky.length], Infinity];
  };
  for (let pocet = 1; pocet <= KORENE.length; pocet++) {
    const [, hranice, max] = rezy(0, pocet);
    if (max + rezia <= limit) {
      const kusy = []; let od = 0;
      for (const k of hranice) { kusy.push(bloky.slice(od, k).flat()); od = k; }
      return kusy;
    }
  }
  throw new Error(`titulka sa nezmestí do ${KORENE.length} bannerov po ${limit} znakov`);
}

/* ================= MENU ================= */
function menu(cz) {
  const d = novyDom();
  const wrap = d.createElement("div");
  wrap.innerHTML = cz ? mkHdr.LCDHDR_MARKUP_CZ : mkHdr.LCDHDR_MARKUP;
  const ovl = wrap.querySelector(":scope > #megaOvl");
  const nav = wrap.querySelector(":scope > nav#mega");
  const lang = wrap.querySelector("header.hdr a.lang");
  if (!ovl || !nav || !lang) throw new Error("LCDHDR_MARKUP: chýba #megaOvl / #mega / a.lang");
  nav.setAttribute("data-lcd-cast", "mega");
  /* prepínač SK/CZ: natívna hlavička ho nemá -> ide do menu, hneď za zatváracie × */
  lang.classList.add("m-lang");
  const x = nav.querySelector(":scope > #megaX");
  nav.insertBefore(lang, x ? x.nextSibling : nav.firstChild);
  nav.insertBefore(d.createTextNode("\n  "), lang);
  const zaznam = [];
  upravObrazky(nav, null, zaznam);
  return { mega: `${ovl.outerHTML}\n${nav.outerHTML}\n`, _zaznam: zaznam };
}

/* ================= ROZCESTNÍK ================= */
function rozcestnik(cz) {
  const d = novyDom();
  const wrap = d.createElement("div");
  wrap.innerHTML = cz ? mkRz.LCDRZ_MARKUP_CZ : mkRz.LCDRZ_MARKUP;
  const root = wrap.querySelector("#lcd-rz");
  if (!root) throw new Error("LCDRZ_MARKUP: chýba #lcd-rz");
  root.querySelectorAll(":scope > header.hdr, :scope > #megaOvl, :scope > #mega").forEach((e) => e.remove());

  /* nadpis: h1 -> h2.lcd-h1; auto sa dopĺňa do em.rz-auto (lcdRz.js píše len textContent) */
  const h2 = h1NaH2(d, root.querySelector("h1"));
  const em = h2 && h2.querySelector("em");
  if (em) em.classList.add("rz-auto");
  /* stav „auto nepoznáme“ (lcdRz.js lcdrzHlavicka): texty do data-bez-auta, nech ich JS neberie natvrdo */
  const jtx = JS_TEXTY[cz ? "cz" : "sk"];
  if (h2) h2.setAttribute("data-bez-auta", jtx.rzNadpis);
  const ornSpan = root.querySelector(".orn span");
  if (ornSpan) ornSpan.setAttribute("data-bez-auta", jtx.rzKrok);

  /* karta „Iné vozidlo?“: atrapa -> slot; v slote záložné kotvy main.js (#Model-selecte = PC, #sets = mobil),
     aby konfigurátor skončil v karte aj so starým main.js. <div>, nie <section> — section#sets má v
     luxuryCar.css starý flex layout. */
  const karta = root.querySelector("#konfCard");
  if (!karta) throw new Error("rozcestník: chýba #konfCard");
  karta.querySelectorAll(":scope > #tabs, :scope > #fields").forEach(odstran);
  const slot = d.createElement("div");
  slot.id = "konfSlot";
  slot.className = "lcdrz-konf-slot";
  slot.setAttribute("style", slotStyl(427, 148));
  slot.innerHTML = '<div id="Model-selecte" class="rz-kotva"><!-- --></div><div id="sets" class="rz-kotva"><!-- --></div>';
  const pozn = karta.querySelector(".konf-note");
  karta.insertBefore(slot, pozn || null);
  karta.insertBefore(d.createTextNode("\n    "), slot);
  if (pozn) karta.insertBefore(d.createTextNode("\n    "), pozn);

  const heroImg = root.querySelector("section.rz .bg img");
  if (!heroImg) throw new Error("rozcestník: chýba section.rz .bg img");
  const zaznam = [];
  upravObrazky(root, heroImg, zaznam);

  /* <main> preč (TinyMCE ho obalí do <p>, Shoptet má na stránke vlastný main) */
  const main = root.querySelector(":scope > main");
  if (main) {
    while (main.firstChild) root.insertBefore(main.firstChild, main);
    main.remove();
  }
  const prazdne = vyplnPrazdne(root, d);
  zaznam.push(`TinyMCE: ${prazdne}× prázdny prvok -> <!-- -->`);
  root.setAttribute("class", "lcd-root");
  root.setAttribute("data-lcd-cast", "rz");
  /* prázdne textové uzly na začiatku/konci koreňa preč */
  return { rz: root.outerHTML.replace(/^(<div[^>]*>)\s+/, "$1\n").replace(/\s+<\/div>$/, "\n</div>") + "\n", _zaznam: zaznam };
}

/* ================= zápis ================= */
const LIMIT = Number(arg("--limit", 45000));
fs.mkdirSync(OUT, { recursive: true });
/* staré výstupy tohto skriptu preč (počet kusov titulky sa môže zmeniť) */
for (const f of fs.readdirSync(OUT)) if (/^(hp-vrch|hp-telo-\d+|mega|rz)\.(sk|cz)\.html$/.test(f)) fs.rmSync(path.join(OUT, f));
const zapisane = [];
const zapis = (meno, html) => {
  const s = "<!-- admin-html/src/" + meno + " = zdroj pravdy pre Shoptet admin (pozri admin-html/README.md).\n" +
    "     Komentáre s textom zmaže build. Prázdny komentár (len medzera) je zámerný: drží prázdny prvok pre TinyMCE. -->\n" + html;
  fs.writeFileSync(path.join(OUT, meno), s.replace(/\r\n/g, "\n"));
  zapisane.push(`${meno}  ${zhutnenaDlzka(html)} zn. (po zhutnení)`);
};
for (const cz of [false, true]) {
  const web = cz ? "cz" : "sk";
  const t = titulka(cz);
  const kusy = rozdelTitulku(t.uzly, t.iKonf, LIMIT);
  kusy.forEach((k, i) => zapis(`${KORENE[i][1]}.${web}.html`, obal(i, serial(k))));
  const m = menu(cz);
  zapis(`mega.${web}.html`, m.mega);
  const r = rozcestnik(cz);
  zapis(`rz.${web}.html`, r.rz);
  console.log(`== ${web.toUpperCase()}  titulka v ${kusy.length} banneroch`);
  for (const z of [...t.zaznam, ...m._zaznam, ...r._zaznam]) console.log("   " + z);
}
console.log(`zdroj: ${REV === "worktree" ? "pracovná kópia" : "git " + REV} -> ${OUT}`);
for (const z of zapisane) console.log("   " + z);
fs.rmSync(TMP, { recursive: true, force: true });
