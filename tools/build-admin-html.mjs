#!/usr/bin/env node
/* tools/build-admin-html.mjs — HTML pre Shoptet admin (bannery, popis stránky) zo zdroja v repe.

   Web bez prekrývania (variant A, 6. 10. 2026): obsah titulky, menu a rozcestníka je priamo
   v HTML zo Shoptet adminu, JS ho už nekreslí, len oživí. Zdroj pravdy je v repe:

     admin-html/src/<cast>.<sk|cz>.html   zdroj (upravuje sa ručne)
     admin-html/ciele.json                kam v admine patrí ktorá časť (banner id / stránka id)
     admin-html/dist/<cast>.<sk|cz>.html  výstup = presne to, čo sa vloží do adminu
     admin-html/dist/manifest.json        časť -> cieľ v admine, dĺžka, hash (data-lcd-v)

   Čo build robí so zdrojom:
   - zmaže komentáre s textom (poznámky pre ľudí); prázdny komentár <!-- --> nechá
     (drží prázdny prvok, aby ho TinyMCE nezmazal),
   - zhutní medzery: beh bielych znakov s koncom riadku -> jeden koniec riadku (prehliadač
     ich zobrazí rovnako; obsah <textarea>, <pre>, <script>, <style> sa nemení),
   - do koreňa (prvok s data-lcd-cast) doplní data-lcd-v = hash obsahu (bez data-lcd-v).
   Kontroly (chyba = exit 1):
   - dĺžka každej časti <= --limit (default z ciele.json, 45 000 znakov),
   - HTML je dobre vnorené (vlastný parser) a bez chýb parsera HTML (parse5 z node_modules, ak je),
   - práve jeden koreň s data-lcd-cast="<cast>" a id podľa ciele.json,
   - žiadne <script>, <h1>, <main>, inline on*= handlery, javascript: odkazy, celý dokument,
   - každý <img> má loading (eager len hero s fetchpriority="high", inak lazy) a width/height,
   - <video> má preload="none" (zdroj v data-src) a poster,
   - žiadne duplicitné id v časti ani naprieč časťami jednej stránky (ciele.json -> stranky),
   - odkazy href="#id" vedú na id, ktoré na stránke existuje,
   - TinyMCE pole (rozcestník): bez prázdnych prvkov, bez blokových prvkov v <a>, tlačidlá s textom
     (nie len SVG), bez <template>/<details>/<dialog>/<style>, jeden koreňový <div>.
   Upozornenia (nezastavia build): odkaz na druhý trh, kolízia id so Shoptet stránkou (--snimky).

   Časti zo sekcií (13. 10. 2026, obsah pod konfigurátorom 1V — docs/1v-obsah.md): časť s "zlozka" v ciele.json
   nemá jeden zdrojový súbor, ale zložku src/<zlozka>/NN-<sekcia>.<web>.html. Build spojí súbory s číslom NN
   v rozsahu "sekcie": [od, do] v poradí názvov do obalu, ktorý vyrobí sám z "obal" (id = koren, trieda,
   data-lcd-cast; "brana" -> data-lcd-brana + style="display:none"). Každý neprázdny súbor = práve jeden prvok
   na najvyššej úrovni s data-lcd-sekcia="<sekcia>"; súbor len s komentárom (stub) sa preskočí.
   "pravidla" (ciele.json -> pravidla.<meno>): predpona id, zakázané triedy (kotvy živého JS), tlačidlá
   type="button", žiadne polia formulára, odložené médiá (img lazy, video/iframe bez src a poster -> data-*).
   "naVsetkychStrankach": časť je v pätičke každej stránky -> kontrola duplicitných id aj na ostatných stránkach.
   Časť s "<web>": null sa pre ten trh nestavia.

   Použitie:
     node tools/build-admin-html.mjs              postaví dist/ + manifest.json, vypíše dĺžky
     node tools/build-admin-html.mjs --check      len kontrola; navyše overí, že dist/ sedí so src/
     node tools/build-admin-html.mjs --vystup C:/tmp/dist   dist + manifest zapíše INAM (repo sa nemení; test 1V obsahu)
     node tools/build-admin-html.mjs --limit 50000
     node tools/build-admin-html.mjs --snimky C:/Users/M/Desktop/LCD/web/zalohy-admin/2026-10-06/verejne-stranky
                                                  porovná id s verejným HTML Shoptetu (bez našich bannerov)
     node tools/build-admin-html.mjs --test       samotest kontrol na malých ukážkach
   Bez závislostí mimo Node; parse5 (je v node_modules cez jsdom) sa použije, ak je k dispozícii. */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN = path.join(REPO, "admin-html");
const argv = process.argv.slice(2);
const ma = (n) => argv.includes(n);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const WEBY = ["sk", "cz"];
/* Windows checkout (core.autocrlf) môže dať CRLF; obsah aj hash sa rátajú vždy z LF */
const lf = (s) => s.replace(/\r\n/g, "\n");
const DOMENA = { sk: "luxurycardesign.sk", cz: "luxurycardesign.cz" };

/* ================= HTML: tokenizer, parser, pomocníci ================= */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title", "pre"]);
const BLOK = new Set(["address", "article", "aside", "blockquote", "details", "dialog", "div", "dl", "dd", "dt", "fieldset",
  "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "li", "main", "nav", "ol",
  "p", "pre", "section", "table", "ul"]);
/* prvky, pred ktorými HTML parser automaticky uzavrie otvorený <p> */
const ZATVARA_P = new Set(["address", "article", "aside", "blockquote", "details", "dialog", "div", "dl", "fieldset", "figcaption",
  "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "main", "menu", "nav", "ol", "p", "pre",
  "section", "summary", "table", "ul"]);
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", middot: "·", times: "×", ndash: "–", mdash: "—",
  hellip: "…", bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", euro: "€", copy: "©", reg: "®", deg: "°", bull: "•" };
const dekoduj = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e.toLowerCase()] ?? m));
/* „biele“ = len ASCII medzery; &nbsp; je pre TinyMCE obsah */
const jeBiele = (s) => !/[^ \t\n\r\f]/.test(s);

const TAG_RE = /<!--([\s\S]*?)-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

function parsujAtributy(s) {
  const attrs = new Map(), dupl = [];
  const re = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(s))) {
    const n = m[1].toLowerCase();
    if (attrs.has(n)) dupl.push(n);
    else attrs.set(n, dekoduj(m[2] ?? m[3] ?? m[4] ?? ""));
  }
  return { attrs, dupl };
}

/* Prísny parser pre náš vlastný markup: každý nevoid prvok musí byť explicitne uzavretý
   (jsdom/ručný zápis to spĺňa), <x/> len v SVG. Vráti strom + zoznam chýb. */
function parsuj(html) {
  const koren = { typ: "root", meno: "#root", deti: [], attrs: new Map() };
  const chyby = [];
  const zasobnik = [koren];
  const top = () => zasobnik[zasobnik.length - 1];
  const riadkyDo = (i) => { let n = 1; for (let k = html.indexOf("\n"); k >= 0 && k < i; k = html.indexOf("\n", k + 1)) n++; return n; };
  let posl = 0, m;
  const re = new RegExp(TAG_RE.source, "g");
  const text = (od, po) => { if (po > od) top().deti.push({ typ: "text", data: dekoduj(html.slice(od, po)), rodic: top() }); };
  while ((m = re.exec(html))) {
    text(posl, m.index);
    posl = re.lastIndex;
    if (m[0].startsWith("<!--")) { top().deti.push({ typ: "comment", data: m[1], rodic: top() }); continue; }
    const [, , zatv, menoRaw, attrsRaw] = m;
    const meno = menoRaw.toLowerCase();
    if (zatv) {
      if (top().meno === meno) { zasobnik.pop(); continue; }
      const i = zasobnik.map((x) => x.meno).lastIndexOf(meno);
      chyby.push(`r. ${riadkyDo(m.index)}: </${meno}> nesedí, otvorený je <${top().meno}>` + (i > 0 ? "" : " (a <" + meno + "> nie je otvorený vôbec)"));
      if (i > 0) zasobnik.length = i;
      continue;
    }
    const { attrs, dupl } = parsujAtributy(attrsRaw);
    const el = { typ: "el", meno, attrs, deti: [], rodic: top(), riadok: riadkyDo(m.index), vSvg: Boolean(top().vSvg || meno === "svg"), start: m.index };
    for (const a of dupl) chyby.push(`r. ${el.riadok}: <${meno}> má dvakrát atribút ${a} (prehliadač použije len prvý)`);
    top().deti.push(el);
    if (VOID.has(meno)) continue;
    if (/\/\s*$/.test(attrsRaw)) {
      if (el.vSvg) continue;
      chyby.push(`r. ${el.riadok}: <${meno} /> mimo SVG sa v HTML neuzavrie`);
    }
    if (RAW.has(meno)) {
      const k = html.toLowerCase().indexOf("</" + meno, re.lastIndex);
      const koniec = k < 0 ? html.length : k;
      el.deti.push({ typ: "text", data: html.slice(re.lastIndex, koniec), raw: true, rodic: el });
      if (k < 0) { chyby.push(`r. ${el.riadok}: <${meno}> nie je uzavretý`); posl = re.lastIndex = html.length; break; }
      posl = re.lastIndex = html.indexOf(">", k) + 1;
      continue;
    }
    zasobnik.push(el);
  }
  text(posl, html.length);
  if (zasobnik.length > 1) chyby.push("neuzavreté prvky: " + zasobnik.slice(1).map((e) => `<${e.meno}> (r. ${e.riadok})`).join(", "));
  return { koren, chyby };
}

function* prvky(uzol) {
  for (const c of uzol.deti) if (c.typ === "el") { yield c; yield* prvky(c); }
}
function textPrvku(el) {
  if (el.typ === "text") return el.data;
  if (el.typ !== "el" || el.meno === "script" || el.meno === "style") return "";
  return el.deti.map(textPrvku).join("");
}
const trieda = (el) => (el.attrs.get("class") || "").split(/\s+/).filter(Boolean);
const popisPrvku = (el) => `<${el.meno}${el.attrs.get("id") ? "#" + el.attrs.get("id") : ""}${trieda(el).length ? "." + trieda(el).slice(0, 2).join(".") : ""}> r. ${el.riadok}`;

/* ================= zhutnenie + verzia ================= */
/* komentáre s textom preč (prázdny <!-- --> ostáva), beh bielych znakov s koncom riadku -> "\n";
   obsah RAW prvkov (textarea, pre, script, style, title) bez zmeny */
function zhutni(html) {
  let out = "", posl = 0, m, cakajuci = "";
  const re = new RegExp(TAG_RE.source, "g");
  const txt = (s) => s.replace(/[ \t\r\n\f]*\n[ \t\r\n\f]*/g, "\n");
  while ((m = re.exec(html))) {
    /* text pred zmazaným komentárom sa spojí s textom za ním (aby z "\n<!-- x -->\n" bol jeden "\n") */
    cakajuci += html.slice(posl, m.index);
    posl = re.lastIndex;
    if (m[0].startsWith("<!--") && !jeBiele(m[1])) continue;
    out += txt(cakajuci);
    cakajuci = "";
    if (m[0].startsWith("<!--")) { out += "<!-- -->"; continue; }
    out += m[0].replace(/\r\n/g, "\n");
    const meno = m[3].toLowerCase();
    if (!m[2] && RAW.has(meno) && !/\/\s*$/.test(m[4])) {
      const k = html.toLowerCase().indexOf("</" + meno, re.lastIndex);
      if (k < 0) continue;
      out += html.slice(re.lastIndex, k);
      posl = re.lastIndex = k;
    }
  }
  out += txt(cakajuci + html.slice(posl));
  return out.trim();
}
const bezVerzie = (html) => html.replace(/\sdata-lcd-v="[^"]*"/g, "");
const hashObsahu = (html) => crypto.createHash("sha256").update(bezVerzie(html).trim(), "utf8").digest("hex").slice(0, 10);
function vlozVerziu(html, cast, hash) {
  const cisty = bezVerzie(html);
  const re = new RegExp(`(<[a-zA-Z][\\w-]*\\b[^>]*?\\sdata-lcd-cast="${cast}")`);
  if (!re.test(cisty)) return null;
  return cisty.replace(re, `$1 data-lcd-v="${hash}"`);
}

/* ================= časti zo sekcií (src/<zlozka>/NN-<sekcia>.<web>.html) ================= */
const RE_SEKCIA = /^(\d\d)-([a-z0-9]+(?:-[a-z0-9]+)*)\.(sk|cz)\.html$/;
const vRozsahu = (def, cislo) => { const [od, po] = def.sekcie || ["00", "99"]; return cislo >= od && cislo <= po; };

/* súbory sekcií jednej časti v poradí názvov; null = zložka chýba */
function nacitajSekcie(src, def, web) {
  const dir = path.join(src, def.zlozka);
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir).sort().map((f) => [f, f.match(RE_SEKCIA)]).filter(([, m]) => m && m[3] === web && vRozsahu(def, m[1]))
    .map(([f, m]) => ({ subor: f, cislo: m[1], sekcia: m[2], zdroj: lf(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

/* kontrola jednej sekcie: prázdna (len komentáre/biele) alebo práve 1 prvok s data-lcd-sekcia="<sekcia>" */
function skontrolujSekciu(s) {
  const chyby = [];
  s.html = zhutni(s.zdroj);
  const { koren, chyby: cp } = parsuj(s.html);
  for (const x of cp) chyby.push(x);
  const top = koren.deti.filter((d) => d.typ === "el");
  const text = koren.deti.filter((d) => d.typ === "text" && !jeBiele(d.data));
  s.prazdna = !top.length && !text.length;
  if (s.prazdna) return chyby;
  if (text.length) chyby.push(`text mimo prvku na najvyššej úrovni: "${text[0].data.trim().slice(0, 40)}"`);
  if (top.length !== 1) chyby.push(`čakám práve 1 prvok na najvyššej úrovni (obal sekcie), je ich ${top.length}`);
  else if (top[0].attrs.get("data-lcd-sekcia") !== s.sekcia) chyby.push(`prvok na najvyššej úrovni nemá data-lcd-sekcia="${s.sekcia}" (má "${top[0].attrs.get("data-lcd-sekcia") || ""}")`);
  return chyby;
}

/* obal časti: vyrobí ho build (workeri ho nemenia); prázdny obsah drží <!-- --> (TinyMCE prázdny prvok zmaže) */
function obalCasti(cast, def, vnutro) {
  const o = def.obal || {};
  const a = [`id="${def.koren}"`];
  if (o.trieda) a.push(`class="${o.trieda}"`);
  a.push(`data-lcd-cast="${cast}"`);
  if (o.brana) a.push(`data-lcd-brana="${o.brana}"`, 'style="display:none"');
  return `<div ${a.join(" ")}>\n${vnutro || "<!-- -->"}\n</div>`;
}

/* pravidlá obsahu, ktorý je na stránke skrytý (brána) a v teste aj v pätičke každej stránky */
function skontrolujPravidla(koren, P, chyby, pozor) {
  for (const el of prvky(koren)) {
    const kde = popisPrvku(el);
    const id = el.attrs.get("id");
    if (id && P.idPredpona && !id.startsWith(P.idPredpona)) chyby.push(`${kde}: id="${id}" bez predpony „${P.idPredpona}“ (obsah je v teste v pätičke každej stránky — titulka má #galeria, #farby…)`);
    for (const t of trieda(el)) if ((P.zakazaneTriedy || []).includes(t)) chyby.push(`${kde}: trieda „${t}“ — na ňu kotví živý JS (ciele.json pravidla.zakazaneTriedy)`);
    if (["form", "input", "select", "textarea"].includes(el.meno)) chyby.push(`${kde}: <${el.meno}> — pole formulára nepatrí do obsahu (košík, POST)`);
    if (el.attrs.has("name") && !el.vSvg) chyby.push(`${kde}: atribút name (išiel by do formulára / kotvy)`);
    if (el.meno === "button" && el.attrs.get("type") !== "button") chyby.push(`${kde}: <button> bez type="button"`);
    if (P.media !== "odlozene") continue;
    if (el.meno === "img" && el.attrs.get("loading") !== "lazy") chyby.push(`${kde}: <img> musí mať loading="lazy" (skrytý blok nesmie nič sťahovať)`);
    if (el.meno === "video") {
      if (el.attrs.has("src")) chyby.push(`${kde}: <video src> — zdroj patrí do data-src (JS ho nastaví až pri zobrazení)`);
      if (el.attrs.has("poster")) chyby.push(`${kde}: <video poster> sa stiahne aj v skrytom bloku — daj data-poster`);
      const zdroj = el.attrs.has("data-src") || el.deti.some((d) => d.typ === "el" && d.meno === "source" && d.attrs.has("data-src"));
      if (!zdroj) chyby.push(`${kde}: <video> bez data-src (ani <source data-src>)`);
      if (!el.attrs.has("data-poster")) pozor.push(`${kde}: <video> bez data-poster (iPhone ukáže čierny rám)`);
    }
    if (el.meno === "source" && el.rodic && el.rodic.meno === "video" && el.attrs.has("src")) chyby.push(`${kde}: <source src> vo <video> — daj data-src`);
    if (el.meno === "iframe" && el.attrs.has("src")) chyby.push(`${kde}: <iframe src> — daj data-src`);
    if (/url\s*\(/i.test(el.attrs.get("style") || "")) pozor.push(`${kde}: url() v style — obrázok patrí do CSS alebo <img loading="lazy">`);
  }
}

/* ================= kontroly jednej časti ================= */
function skontrolujCast(c) {
  const { html, cast, web, def } = c;
  const chyby = [], pozor = [];
  const { koren, chyby: chybyParsera } = parsuj(html);
  chyby.push(...chybyParsera);

  /* koreň */
  const korene = [...prvky(koren)].filter((e) => e.attrs.has("data-lcd-cast"));
  if (korene.length !== 1) chyby.push(`čakám práve 1 prvok s data-lcd-cast, je ich ${korene.length}`);
  const k = korene[0];
  if (k) {
    if (k.attrs.get("data-lcd-cast") !== cast) chyby.push(`data-lcd-cast="${k.attrs.get("data-lcd-cast")}", čakám "${cast}"`);
    if (k.rodic !== koren) chyby.push("koreň s data-lcd-cast musí byť na najvyššej úrovni");
    if (def.koren && k.attrs.get("id") !== def.koren) chyby.push(`koreň má id="${k.attrs.get("id")}", čakám "${def.koren}"`);
    if (/^lcd-/.test(def.koren || "") && !trieda(k).includes("lcd-root")) chyby.push('koreň nemá triedu "lcd-root"');
    if (!/^lcd-/.test(def.koren || "") && trieda(k).includes("lcd-root")) chyby.push('trieda "lcd-root" len pre korene lcd-* (CSS LCD-KORENE by zmenil obaly Shoptetu okolo)');
    if (def.obal && def.obal.brana) {
      if (k.attrs.get("data-lcd-brana") !== def.obal.brana) chyby.push(`koreň nemá data-lcd-brana="${def.obal.brana}"`);
      if (!/^\s*display\s*:\s*none\s*;?\s*$/i.test(k.attrs.get("style") || "")) chyby.push('koreň za bránou musí mať style="display:none" (bez flagu neviditeľný)');
    }
  }
  if (c.pravidla) skontrolujPravidla(koren, c.pravidla, chyby, pozor);
  for (const t of koren.deti) {
    if (t.typ === "text" && !jeBiele(t.data)) chyby.push(`text mimo prvkov na najvyššej úrovni: "${t.data.trim().slice(0, 40)}"`);
  }

  /* zakázané časti */
  if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(html)) chyby.push("celý dokument (doctype/html/head/body) namiesto fragmentu");
  if (/#DEBUG_TIMESTAMP#/.test(html)) chyby.push("#DEBUG_TIMESTAMP# patrí len do HTML kódov");
  const ids = [];
  let pocetImg = 0;
  for (const el of prvky(koren)) {
    const kde = popisPrvku(el);
    if (el.meno === "script") chyby.push(`${kde}: <script> nepatrí do adminu (kód je v luxuryCar.js)`);
    if (el.meno === "h1") chyby.push(`${kde}: <h1> — H1 stránky dáva Shoptet`);
    if (el.meno === "main") chyby.push(`${kde}: <main> — Shoptet už má na stránke vlastný`);
    for (const [a, v] of el.attrs) {
      if (/^on[a-z]+$/.test(a)) chyby.push(`${kde}: inline handler ${a}= (správanie patrí do luxuryCar.js)`);
      if (/^\s*javascript:/i.test(v)) chyby.push(`${kde}: ${a}="javascript:…"`);
    }
    if (el.attrs.has("id")) ids.push([el.attrs.get("id"), kde]);
    /* vnorenia, ktoré prehliadač „opraví“ (parse5 ich ako chybu nehlási): blok v <p>, a v a, button v button, form vo form */
    for (let r = el.rodic; r && r.typ === "el"; r = r.rodic) {
      if (r.meno === "p" && ZATVARA_P.has(el.meno)) { chyby.push(`${kde}: <${el.meno}> v <p> — prehliadač <p> pred ním uzavrie`); break; }
      if (r.meno === el.meno && ["a", "button", "form", "label"].includes(el.meno)) { chyby.push(`${kde}: <${el.meno}> vnorený v <${el.meno}>`); break; }
    }

    if (el.meno === "img") {
      pocetImg++;
      const ld = el.attrs.get("loading"), fp = el.attrs.get("fetchpriority");
      if (ld !== "lazy" && ld !== "eager") chyby.push(`${kde}: <img> bez loading="lazy|eager" (Shoptet unveil() by mu dal eager)`);
      if (ld === "eager" && fp !== "high") chyby.push(`${kde}: loading="eager" len pre hero s fetchpriority="high"`);
      if (fp === "high" && ld !== "eager") chyby.push(`${kde}: fetchpriority="high" bez loading="eager"`);
      for (const r of ["width", "height"]) if (!/^[1-9]\d*$/.test(el.attrs.get(r) || "")) chyby.push(`${kde}: <img> bez platného ${r}`);
      if (!el.attrs.get("src") && !el.attrs.get("data-src")) chyby.push(`${kde}: <img> bez src aj data-src`);
      if (!el.attrs.has("alt")) pozor.push(`${kde}: <img> bez alt`);
    }
    if (el.meno === "video") {
      if (el.attrs.get("preload") !== "none") chyby.push(`${kde}: <video> bez preload="none"`);
      if (el.attrs.has("src")) pozor.push(`${kde}: <video src> sa stiahne hneď — patrí do data-src (JS ho nastaví pri zobrazení)`);
      if (!el.attrs.has("poster") && !el.attrs.has("data-poster")) pozor.push(`${kde}: <video> bez poster (iPhone ukáže čierny rám)`);
    }
    /* odkaz na druhý trh (okrem prepínača jazyka) */
    const href = el.attrs.get("href") || "";
    const cudzia = DOMENA[web === "sk" ? "cz" : "sk"];
    if (href.includes(cudzia) && !trieda(el).includes("lang")) pozor.push(`${kde}: odkaz na druhý trh ${href}`);
  }
  c.pocetImg = pocetImg;

  const videne = new Map();
  for (const [id, kde] of ids) {
    if (videne.has(id)) chyby.push(`duplicitné id="${id}": ${videne.get(id)} a ${kde}`);
    else videne.set(id, kde);
  }
  c.ids = videne;
  c.kotvy = [...prvky(koren)].filter((e) => e.meno === "a" && /^#[A-Za-z][\w:.-]*$/.test(e.attrs.get("href") || ""))
    .map((e) => [e.attrs.get("href").slice(1), popisPrvku(e)]);
  const fp = [...prvky(koren)].filter((e) => e.attrs.get("fetchpriority") === "high");
  c.fetchHigh = fp.length;

  /* TinyMCE (popis stránky): markup musí prežiť uloženie v admine */
  if (def.tinymce) {
    const top = koren.deti.filter((t) => t.typ === "el");
    if (top.length !== 1 || top[0].meno !== "div") chyby.push("TinyMCE: na najvyššej úrovni musí byť práve jeden <div> (koreň)");
    const NECHAJ = new Set(["textarea", "video", "audio", "iframe", "canvas", "svg", "script", "style", "img"]);
    for (const el of prvky(koren)) {
      const kde = popisPrvku(el);
      if (["template", "details", "dialog", "style", "h1", "main"].includes(el.meno)) chyby.push(`TinyMCE: ${kde}: <${el.meno}> TinyMCE obalí do <p> alebo zmaže`);
      if (el.vSvg && el.meno !== "svg") continue;
      if (!VOID.has(el.meno) && !NECHAJ.has(el.meno)) {
        const obsah = el.deti.some((d) => d.typ === "el" || d.typ === "comment" || (d.typ === "text" && !jeBiele(d.data)));
        if (!obsah) chyby.push(`TinyMCE: ${kde}: prázdny prvok TinyMCE zmaže alebo vyplní &nbsp; — daj doň <!-- -->`);
      }
      if (el.meno === "a") {
        for (const v of prvky(el)) if (BLOK.has(v.meno)) { chyby.push(`TinyMCE: ${kde}: blokový <${v.meno}> v <a> — TinyMCE odkaz rozbije, použi <span>`); break; }
      }
      if (el.meno === "button") {
        const t = el.deti.map((d) => (d.typ === "el" && d.meno === "svg" ? "" : textPrvku(d))).join("");
        if (jeBiele(t)) chyby.push(`TinyMCE: ${kde}: tlačidlo bez textu (len SVG/obrázok) — pridaj <span class="sr-only">…</span>`);
      }
    }
  }
  return { chyby, pozor };
}

/* ================= verejné HTML Shoptetu (voliteľne): id, ktoré tam už sú ================= */
function vyrezBannery(html, idBannerov) {
  let out = html;
  for (const id of idBannerov) {
    const zac = out.indexOf(`<span data-ec-promo-id="${id}">`);
    if (zac < 0) continue;
    const re = /<span\b|<\/span>/g;
    re.lastIndex = zac + 5;
    let hlbka = 1, m;
    while ((m = re.exec(out))) { hlbka += m[0] === "</span>" ? -1 : 1; if (!hlbka) break; }
    if (m) out = out.slice(0, zac) + out.slice(re.lastIndex);
  }
  return out;
}
function idZoSnimky(subor, idBannerov) {
  let html = fs.readFileSync(subor, "utf8");
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  html = vyrezBannery(html, idBannerov);
  return new Set([...html.matchAll(/<[a-zA-Z][^>]*?\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
}

/* ================= parse5 (voliteľne): chyby, ktoré by prehliadač „opravil“ ================= */
let parse5 = null;
try { parse5 = await import("parse5"); } catch { parse5 = null; }
function chybyParse5(html) {
  if (!parse5) return [];
  const chyby = [];
  parse5.parseFragment(html, {
    sourceCodeLocationInfo: true,
    onParseError: (e) => chyby.push(`${e.code} (r. ${e.startLine}:${e.startCol})`),
  });
  return chyby;
}

/* ================= samotest ================= */
function samotest() {
  const def = { koren: "lcd-x", tinymce: false };
  const obal = (s, extra = "") => `<div id="lcd-x" class="lcd-root" data-lcd-cast="x"${extra}>${s}</div>`;
  const pripady = [
    ["ok", obal('<p>a</p><img src="/a.jpg" alt="" width="1" height="1" loading="lazy">'), def, null],
    ["img bez loading", obal('<img src="/a.jpg" alt="" width="1" height="1">'), def, "bez loading"],
    ["img bez width", obal('<img src="/a.jpg" alt="" height="1" loading="lazy">'), def, "bez platného width"],
    ["eager bez fetchpriority", obal('<img src="/a.jpg" alt="" width="1" height="1" loading="eager">'), def, "len pre hero"],
    ["hero ok", obal('<img src="/a.jpg" alt="" width="1" height="1" loading="eager" fetchpriority="high">'), def, null],
    ["h1", obal("<h1>x</h1>"), def, "<h1>"],
    ["main", obal("<main>x</main>"), def, "<main>"],
    ["script", obal("<script>var a=1<\/script>"), def, "<script>"],
    ["onclick", obal('<button onclick="x()">a</button>'), def, "inline handler"],
    ["duplicitné id", obal('<i id="a">1</i><b id="a">2</b>'), def, "duplicitné id"],
    ["2× atribút", obal('<section style="a:1" style="b:2">x</section>'), def, "dvakrát atribút"],
    ["neuzavretý", obal("<div><span>x</div>"), def, "nesedí"],
    ["div/ mimo svg", obal("<div/>"), def, "mimo SVG"],
    ["svg self-closing ok", obal('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>'), def, null],
    ["zlý koreň", '<div id="ine" class="lcd-root" data-lcd-cast="x">a</div>', def, 'čakám "lcd-x"'],
    ["bez koreňa", "<div>a</div>", def, "práve 1 prvok"],
    ["video", obal('<video src="/a.mp4"></video>'), def, 'preload="none"'],
    ["textarea zostane", obal('<textarea>  a\n\n  b</textarea>'), def, null],
    ["tinymce prázdny span", obal('<span class="x"></span><p>a</p>'), { ...def, tinymce: true }, "prázdny prvok"],
    ["tinymce span s komentárom", obal('<span class="x"><!-- --></span><p>a</p>'), { ...def, tinymce: true }, null],
    ["tinymce div v a", obal('<a href="/x"><div>a</div></a>'), { ...def, tinymce: true }, "blokový <div> v <a>"],
    ["tinymce tlačidlo len svg", obal('<button type="button"><svg viewBox="0 0 1 1"><path d="M0 0"/></svg></button>'), { ...def, tinymce: true }, "tlačidlo bez textu"],
    ["tinymce details", obal("<details><summary>a</summary>b</details>"), { ...def, tinymce: true }, "<details>"],
    ["div v p", obal("<p>a<div>b</div></p>"), def, "v <p>"],
    ["a v a", obal('<a href="/x">a<a href="/y">b</a></a>'), def, "vnorený v <a>"],
    ["kotva bez cieľa je kontrola stránky (v časti OK)", obal('<a href="#nic">a</a>'), def, null],
  ];
  /* časti zo sekcií + pravidlá obsahu za bránou (obsah 1V) */
  const P = { idPredpona: "p-", zakazaneTriedy: ["lcd-reviews-widget"], media: "odlozene" };
  const defB = { koren: "p-x", obal: { trieda: "o", brana: "1v" } };
  const obalB = (s) => obalCasti("x", defB, s);
  pripady.push(
    ["brána ok", obalB('<section data-lcd-sekcia="a" id="p-a"><img src="/a.jpg" alt="" width="1" height="1" loading="lazy"></section>'), defB, null, P],
    ["brána prázdna (len <!-- -->)", obalB(""), { ...defB, tinymce: true }, null, P],
    ["brána bez display:none", obalB("<p>a</p>").replace(' style="display:none"', ""), defB, "display:none", P],
    ["id bez predpony", obalB('<p id="galeria">a</p>'), defB, "bez predpony", P],
    ["zakázaná trieda", obalB('<div class="lcd-reviews-widget">a</div>'), defB, "kotví živý JS", P],
    ["button bez type", obalB("<button>a</button>"), defB, 'bez type="button"', P],
    ["pole formulára", obalB('<input type="text">'), defB, "pole formulára", P],
    ["img eager za bránou", obalB('<img src="/a.jpg" alt="" width="1" height="1" loading="eager" fetchpriority="high">'), defB, 'loading="lazy"', P],
    ["video poster za bránou", obalB('<video preload="none" data-src="/a.mp4" poster="/a.jpg"></video>'), defB, "data-poster", P],
    ["video src za bránou", obalB('<video preload="none" src="/a.mp4" data-poster="/a.jpg"></video>'), defB, "data-src", P],
    ["video ok za bránou", obalB('<video preload="none" data-src="/a.mp4" data-poster="/a.jpg"></video>'), defB, null, P],
    ["lcd-root mimo lcd-*", '<div id="p-x" class="lcd-root" data-lcd-cast="x">a</div>', { koren: "p-x" }, "lcd-root", null],
  );
  for (const [meno, s, cakam] of [
    ["sekcia prázdna", { zdroj: "<!-- stub -->\n", sekcia: "a-x" }, null],
    ["sekcia ok", { zdroj: '<section data-lcd-sekcia="a-x"><p>a</p></section>', sekcia: "a-x" }, null],
    ["sekcia 2 prvky", { zdroj: '<section data-lcd-sekcia="a-x">a</section><div>b</div>', sekcia: "a-x" }, "práve 1 prvok"],
    ["sekcia zlé meno", { zdroj: '<section data-lcd-sekcia="b">a</section>', sekcia: "a-x" }, 'data-lcd-sekcia="a-x"'],
  ]) pripady.push(["sekcia: " + meno, s, "sekcia", cakam, null]);
  let zle = 0;
  for (const [meno, html, d, cakam, pravidla] of pripady) {
    if (d === "sekcia") {
      const ch = skontrolujSekciu(html);
      const ok = cakam ? ch.some((x) => x.includes(cakam)) : ch.length === 0;
      if (!ok) { zle++; console.log(`ZLE  ${meno}: čakal som ${cakam ? `chybu „${cakam}“` : "bez chýb"}, dostal som: ${ch.join(" | ") || "nič"}`); }
      else console.log(`ok   ${meno}`);
      continue;
    }
    const c = { html: zhutni(html), cast: "x", web: "sk", def: d, pravidla };
    const { chyby } = skontrolujCast(c);
    const ok = cakam ? chyby.some((x) => x.includes(cakam)) : chyby.length === 0;
    if (!ok) { zle++; console.log(`ZLE  ${meno}: čakal som ${cakam ? `chybu „${cakam}“` : "bez chýb"}, dostal som: ${chyby.join(" | ") || "nič"}`); }
    else console.log(`ok   ${meno}`);
  }
  /* zhutnenie */
  const z = zhutni('<div>\n   <p>a  b</p>\n\n  <!-- poznámka -->\n  <i><!-- --></i><textarea>\n  x\n</textarea>\n</div>');
  const zCakam = "<div>\n<p>a  b</p>\n<i><!-- --></i><textarea>\n  x\n</textarea>\n</div>";
  if (z !== zCakam) { zle++; console.log("ZLE  zhutnenie:", JSON.stringify(z)); } else console.log("ok   zhutnenie");
  const h1 = hashObsahu('<div data-lcd-cast="x" data-lcd-v="abc">a</div>'), h2 = hashObsahu('<div data-lcd-cast="x">a</div>');
  if (h1 !== h2) { zle++; console.log("ZLE  hash nesmie závisieť od data-lcd-v"); } else console.log("ok   hash bez data-lcd-v");
  const v = vlozVerziu('<nav id="m" data-lcd-cast="mega" class="a">x</nav>', "mega", "1234567890");
  if (v !== '<nav id="m" data-lcd-cast="mega" data-lcd-v="1234567890" class="a">x</nav>') { zle++; console.log("ZLE  vlozVerziu:", v); } else console.log("ok   vlozVerziu");
  console.log(zle ? `samotest: ${zle} zlyhaní` : "samotest: všetko OK");
  process.exit(zle ? 1 : 0);
}

/* ================= hlavný beh ================= */
if (ma("--test")) samotest();

const CHECK = ma("--check");
const CIELE = JSON.parse(fs.readFileSync(path.join(ADMIN, "ciele.json"), "utf8"));
const LIMIT = Number(arg("--limit", CIELE.limit || 45000));
const SRC = path.join(ADMIN, "src");
const VYSTUP = arg("--vystup", null);
const DIST = VYSTUP ? path.resolve(VYSTUP) : path.join(ADMIN, "dist");
const SNIMKY = arg("--snimky", null);
const fmt = (n) => n.toLocaleString("sk-SK").replace(/\u00a0/g, " ");

const globalne = [];
const casti = [];
/* zložky sekcií -> časti, ktoré z nich berú */
const zlozky = new Map();
for (const [cast, def] of Object.entries(CIELE.casti)) {
  if (!def.zlozka) continue;
  if (!zlozky.has(def.zlozka)) zlozky.set(def.zlozka, []);
  zlozky.get(def.zlozka).push([cast, def]);
}
/* neznáme súbory v src */
for (const f of fs.existsSync(SRC) ? fs.readdirSync(SRC) : []) {
  if (fs.statSync(path.join(SRC, f)).isDirectory()) {
    if (!zlozky.has(f)) { globalne.push(`src/${f}/: neznáma zložka (žiadna časť v ciele.json ju nemá ako "zlozka")`); continue; }
    const videne = new Map();
    for (const g of fs.readdirSync(path.join(SRC, f)).sort()) {
      const m = g.match(RE_SEKCIA);
      if (!m) { globalne.push(`src/${f}/${g}: zlý názov (čakám NN-sekcia.sk.html, malé písmená, pomlčky)`); continue; }
      if (!zlozky.get(f).some(([, d]) => d[m[3]] && vRozsahu(d, m[1]))) globalne.push(`src/${f}/${g}: číslo ${m[1]} nepatrí do žiadnej časti (ciele.json -> sekcie)`);
      const kluc = m[2] + "." + m[3];
      if (videne.has(kluc)) globalne.push(`src/${f}/${g}: sekcia „${m[2]}“ je aj v ${videne.get(kluc)}`);
      else videne.set(kluc, g);
    }
    continue;
  }
  const m = f.match(/^(.+)\.(sk|cz)\.html$/);
  if (!m || !CIELE.casti[m[1]] || CIELE.casti[m[1]].zlozka) globalne.push(`src/${f}: neznáma časť (nie je v admin-html/ciele.json)`);
}
for (const [cast, def] of Object.entries(CIELE.casti)) {
  for (const web of WEBY) {
    if (def[web] === null) continue; // časť len pre druhý trh
    let zdroj, sekcie = null;
    const chybySekcii = [];
    if (def.zlozka) {
      sekcie = nacitajSekcie(SRC, def, web);
      if (sekcie === null) { globalne.push(`chýba zložka src/${def.zlozka}/ (časť ${cast})`); continue; }
      for (const s of sekcie) for (const x of skontrolujSekciu(s)) chybySekcii.push(`src/${def.zlozka}/${s.subor}: ${x}`);
      zdroj = obalCasti(cast, def, sekcie.filter((s) => !s.prazdna).map((s) => s.html).join("\n"));
    } else {
      const subor = path.join(SRC, `${cast}.${web}.html`);
      if (!fs.existsSync(subor)) { globalne.push(`chýba src/${cast}.${web}.html`); continue; }
      zdroj = lf(fs.readFileSync(subor, "utf8"));
    }
    const obsah = zhutni(zdroj);
    const hash = hashObsahu(obsah);
    const html = vlozVerziu(obsah, cast, hash);
    const pravidla = def.pravidla ? (CIELE.pravidla || {})[def.pravidla] : null;
    if (def.pravidla && !pravidla) globalne.push(`${cast}: pravidlá „${def.pravidla}“ nie sú v ciele.json -> pravidla`);
    const c = { cast, web, def, ciel: def[web], hash, html: html ?? obsah, pravidla, sekcie };
    const v = skontrolujCast(c);
    v.chyby.unshift(...chybySekcii);
    if (html === null) v.chyby.unshift(`chýba koreň s data-lcd-cast="${cast}"`);
    for (const e of chybyParse5(c.html)) v.chyby.push("parser HTML: " + e);
    c.znaky = c.html.length;
    c.bajty = Buffer.byteLength(c.html, "utf8");
    if (c.znaky > LIMIT) v.chyby.unshift(`dĺžka ${fmt(c.znaky)} znakov > limit ${fmt(LIMIT)}` + (sekcie ? " — posuň hranicu sekcií (ciele.json -> sekcie) alebo skráť obsah" : ""));
    c.chyby = v.chyby; c.pozor = v.pozor;
    casti.push(c);
  }
}

/* stránky: id naprieč časťami, kotvy, Shoptet snímka */
for (const [stranka, sd] of Object.entries(CIELE.stranky || {})) {
  for (const web of WEBY) {
    /* časť v pätičke každej stránky (naVsetkychStrankach) sa ráta do kolízií id všade; kotvy sa kontrolujú len tam, kde je v zozname */
    const naStranke = casti.filter((c) => c.web === web && (sd.casti.includes(c.cast) || c.def.naVsetkychStrankach));
    const vsetky = new Map();
    for (const id of sd.idStranky || []) vsetky.set(id, [null, "šablóna Shoptetu"]);
    for (const c of naStranke) {
      for (const [id, kde] of c.ids || []) {
        const ina = vsetky.get(id);
        if (ina && ina[0] !== c) c.chyby.push(`id="${id}" je aj v ${ina[0] ? ina[0].cast + "." + web : "šablóne Shoptetu"} — na stránke „${stranka}“ by bolo 2×`);
        else vsetky.set(id, [c, kde]);
      }
    }
    for (const c of naStranke) {
      if (!sd.casti.includes(c.cast)) continue;
      for (const [id, kde] of c.kotvy || []) if (!vsetky.has(id)) c.chyby.push(`${kde}: href="#${id}" — na stránke „${stranka}“ také id nie je`);
    }
    const hero = naStranke.reduce((s, c) => s + (c.fetchHigh || 0), 0);
    if (hero > 1) globalne.push(`stránka „${stranka}“ (${web}): ${hero}× fetchpriority="high" (má byť len hero)`);
    const snimka = sd.snimka && sd.snimka[web];
    if (SNIMKY && snimka && fs.existsSync(path.join(SNIMKY, snimka))) {
      const nase = Object.values(CIELE.casti).map((d) => d[web]).filter((d) => d && d.typ === "banner" && d.id).map((d) => d.id);
      const shoptet = idZoSnimky(path.join(SNIMKY, snimka), nase);
      const ign = new Set(sd.ignorujIdZoSnimky || []);
      for (const c of naStranke) {
        for (const [id, kde] of c.ids || []) if (shoptet.has(id) && !ign.has(id)) c.pozor.push(`${kde}: id="${id}" už má Shoptet na stránke „${stranka}“ (${snimka})`);
      }
    }
  }
}

/* manifest (deterministický: bez času) */
const manifest = {
  _pozn: "Generuje tools/build-admin-html.mjs z admin-html/src + admin-html/ciele.json. Needitovať ručne. " +
    "Obsah dist/<subor> sa vkladá do adminu celý (banner: Text banneru; stránka: Popis cez runner, nie ručne v TinyMCE). " +
    "hash = data-lcd-v v koreni = sha256 obsahu bez data-lcd-v (prvých 10 znakov).",
  limit: LIMIT,
  casti: casti.map((c) => ({
    cast: c.cast, web: c.web, subor: `${c.cast}.${c.web}.html`,
    zdroj: c.sekcie ? `src/${c.def.zlozka}/${(c.def.sekcie || ["00", "99"]).join("…")}-*.${c.web}.html` : `src/${c.cast}.${c.web}.html`,
    koren: "#" + c.def.koren, ciel: c.ciel, znaky: c.znaky, bajty: c.bajty, hash: c.hash, obrazky: c.pocetImg,
    ...(c.sekcie ? { sekcie: c.sekcie.map((s) => ({ subor: s.subor, sekcia: s.sekcia, znaky: s.prazdna ? 0 : s.html.length })) } : {}),
  })),
  stranky: Object.fromEntries(Object.entries(CIELE.stranky || {}).map(([k, v]) => [k, v.casti])),
};
const manifestText = JSON.stringify(manifest, null, 2) + "\n";

if (CHECK) {
  /* dist musí sedieť so src (inak sa do adminu vloží niečo iné, než je v repe) */
  for (const c of casti) {
    const f = path.join(DIST, `${c.cast}.${c.web}.html`);
    const stary = fs.existsSync(f) ? lf(fs.readFileSync(f, "utf8")) : null;
    if (stary === null) c.chyby.push(`dist/${c.cast}.${c.web}.html chýba — spusti node tools/build-admin-html.mjs`);
    else if (stary !== c.html) c.chyby.push(`dist/${c.cast}.${c.web}.html nesedí so src — spusti node tools/build-admin-html.mjs`);
  }
  const mf = path.join(DIST, "manifest.json");
  if (!fs.existsSync(mf) || lf(fs.readFileSync(mf, "utf8")) !== manifestText) globalne.push("dist/manifest.json nesedí so src — spusti node tools/build-admin-html.mjs");
  for (const f of fs.existsSync(DIST) ? fs.readdirSync(DIST) : []) {
    if (/\.(sk|cz)\.html$/.test(f) && !casti.some((c) => f === `${c.cast}.${c.web}.html`)) globalne.push(`dist/${f} nemá zdroj v src — zmaž ho (alebo spusti build)`);
  }
} else {
  fs.mkdirSync(DIST, { recursive: true });
  for (const f of fs.readdirSync(DIST)) if (/\.(sk|cz)\.html$/.test(f) && !casti.some((c) => f === `${c.cast}.${c.web}.html`)) fs.rmSync(path.join(DIST, f));
  for (const c of casti) fs.writeFileSync(path.join(DIST, `${c.cast}.${c.web}.html`), c.html);
  fs.writeFileSync(path.join(DIST, "manifest.json"), manifestText);
}

/* výpis */
const popisCiela = (t) => !t ? "?" : t.typ === "banner"
  ? `banner ${t.id ?? "NOVÝ"} „${t.nazov}“${t.kod ? " (" + t.kod + ")" : ""}`
  : t.typ === "produkt" ? `produkt ${t.id} — ${t.pole}` : `stránka ${t.id} — ${t.pole}`;
console.log(`build-admin-html${CHECK ? " --check" : ""}: limit ${fmt(LIMIT)} znakov, parser HTML: ${parse5 ? "parse5" : "len vlastný (parse5 nenájdený)"}${SNIMKY ? ", snímky Shoptetu: " + SNIMKY : ""}`);
for (const c of casti) {
  const stav = c.chyby.length ? "CHYBA" : c.pozor.length ? "POZOR" : "OK   ";
  console.log(`${stav} ${(c.cast + "." + c.web).padEnd(13)} ${fmt(c.znaky).padStart(7)} zn. ${fmt(c.bajty).padStart(7)} B  rezerva ${fmt(LIMIT - c.znaky).padStart(7)}  img ${String(c.pocetImg).padStart(3)}  v=${c.hash}  -> ${popisCiela(c.ciel)}`);
  for (const s of c.sekcie || []) console.log(`        · ${s.subor.padEnd(28)} ${s.prazdna ? "  prázdna (stub)" : fmt(s.html.length).padStart(7) + " zn."}`);
  for (const x of c.chyby) console.log("        ✗ " + x);
  for (const x of c.pozor) console.log("        ! " + x);
}
/* časti jednej skupiny (napr. p1v-598 = kus 1 + kus 2): súčet pre cieľ po spustení (jedno pole) */
const skupiny = new Map();
for (const c of casti) if (c.def.skupina) { const k = c.def.skupina + "." + c.web; skupiny.set(k, (skupiny.get(k) || 0) + c.znaky); }
for (const [k, n] of skupiny) {
  const def = casti.find((c) => c.def.skupina + "." + c.web === k).def;
  const lim = def.limitSpolu || LIMIT;
  console.log(`${n > lim ? "POZOR" : "info "} ${k.padEnd(13)} ${fmt(n).padStart(7)} zn. spolu  rezerva ${fmt(lim - n).padStart(7)}  -> ${def.popisSpolu || "súčet častí skupiny"}`);
}
for (const x of globalne) console.log("CHYBA " + x);
const pocetChyb = casti.reduce((s, c) => s + c.chyby.length, 0) + globalne.length;
console.log(pocetChyb ? `\n${pocetChyb} chýb — oprav admin-html/src a spusti znova.` : CHECK ? "\nOK: src je v poriadku a dist je aktuálny." : `\nOK: ${VYSTUP ? DIST : "dist/"} (${casti.length} súborov) + manifest.json zapísané.`);
process.exitCode = pocetChyb ? 1 : 0;
