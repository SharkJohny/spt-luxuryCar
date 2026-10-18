// Register produktov nového konfigurátora 1V (T0.1, 14. 10. 2026). JADRO — mení len vydanie (plan.md §2.1, §2.6).
// Kontrakt: docs/1v-kontrakt.md §1 (brána) a §4 (ctx.produkt, ctx.texty, ctx.obrazokVzoru).
//
//   PRODUKTY_1V  projectId -> productId -> { typ, vzor, url, obsah }   (všetkých 13 SK produktov + vzorkovník 637)
//   ZAPNUTE_TYPY: typy vydané pre ?novy=1. ?novy=vyvoj zapne celý register (vývoj, test --vyvoj, náhľad).
//   TYPY         typ -> { kroky (poradie kariet = číslovanie „Krok N z M“), moduly (poradie init v index.js), obal }
//
// Typ pridáva vždy vydanie (T1.1, T2.1, T3.1, T4.1, T5.1). Test (tools/test-konfigurator-1v.mjs) číta register aj
// zapnuté typy z tohto súboru regulárnym výrazom. Nemeniť: tvar riadku registra (číslo produktu, dvojbodka,
// { typ: "…" na začiatku záznamu) a jednoriadkový zoznam zapnutých typov (export const … = ["jedno", …]);
// v komentároch nepísať meno zoznamu so znakom = a zátvorkou.
// Pri importe sa nič nespúšťa (len konštanty) — flag vypnutý = nulová zmena.
import * as jedno from "./typy/jedno.js";
import * as dvoj from "./typy/dvoj.js";
import * as kuforClassic from "./typy/kufor-classic.js";
import * as kuforPremium from "./typy/kufor-premium.js";
import * as boxy from "./typy/boxy.js";
import * as vzorky from "./typy/vzorky.js";
import * as kamion from "./typy/kamion.js";

/** SK = 562035. CZ (581408) zatiaľ nie: ID produktov sa medzi obchodmi líšia, nikdy ich nezamieňať. url = cesta na webe. */
export const PRODUKTY_1V = {
  562035: {
    598: { typ: "jedno", vzor: "diamond", url: "/luxusne-autokoberce-dragonskin-diamond-line/", obsah: "598" },
    613: { typ: "jedno", vzor: "stripe", url: "/luxusne-autokoberce-dragonskin-stripe-line/", obsah: "598" },
    610: { typ: "jedno", vzor: "hexa", url: "/luxusne-autokoberce-dragonskin-hexa-line/", obsah: "598" },
    601: { typ: "dvoj", vzor: "diamond", url: "/luxusne-autokoberce-dragonskin-elite-diamond-line/", obsah: "dvoj" },
    607: { typ: "dvoj", vzor: "stripe", url: "/luxusne-autokoberce-dragonskin-elite-stripe-line/", obsah: "dvoj" },
    604: { typ: "dvoj", vzor: "hexa", url: "/luxusne-autokoberce-dragonskin-elite-hexa-line/", obsah: "dvoj" },
    619: { typ: "kufor-classic", vzor: "diamond", url: "/luxusny-koberced-do-kufra-dragonskin-klasik/", obsah: "classic" },
    625: { typ: "kufor-classic", vzor: "stripe", url: "/luxusny-koberced-do-kufra-dragonskin-klasik-stripe/", obsah: "classic" },
    622: { typ: "kufor-classic", vzor: "hexa", url: "/luxusny-koberced-do-kufra-dragonskin-klasik-hexa/", obsah: "classic" },
    628: { typ: "kufor-premium", vzor: "diamond", url: "/luxusny-koberced-do-kufra-dragonskin-premium/", obsah: "premium" },
    634: { typ: "kufor-premium", vzor: "stripe", url: "/luxusny-koberced-do-kufra-dragonskin-premium-stripe/", obsah: "premium" },
    631: { typ: "kufor-premium", vzor: "hexa", url: "/luxusny-koberced-do-kufra-dragonskin-premium-hexa/", obsah: "premium" },
    616: { typ: "boxy", vzor: null, url: "/luxusny-boxi-do-kufra/", obsah: "boxy" },
    // vzorkovník: konfigurátor T5.1 + obsah T5.1b (návrh vzorkovnik.html)
    637: { typ: "vzorky", vzor: null, url: "/vzorkovnik-dragonskin---objednavka-vzoriek/", obsah: "vzorky" },
    // kamióny a dodávky: vlastný konfigurátor kamion/ namiesto Reactu (docs/kamiony-1v-plan.md); do vydania len ?novy=vyvoj
    640: { typ: "kamion", vzor: null, url: "/luxusne-autokoberce-kamiony/", obsah: "kamiony" },
  },
};

/** Typy vydané pre ?novy=1 (zákaznícky skúšobný odkaz). Pridáva len vydanie. Integrácia 14. 10. 2026: všetkých 13 SK produktov + vzorkovník. */
export const ZAPNUTE_TYPY = ["jedno", "dvoj", "kufor-classic", "kufor-premium", "boxy", "vzorky", "kamion"];

/**
 * kroky  – mená kariet v poradí, v akom ich zákazník vidí a číslujú sa („Krok N z M“, postup). Posledný krok má
 *          „Pokračujte k súhrnu“ (kroky.js ho zachytí — živé tlačidlo posledného kroku by vkladalo do košíka).
 *          Box 616: návrh boxy.html má farba → počet → veľkosť; v živom DOM je počet prvý (poradie mení CSS typu).
 * moduly – moduly index.js v poradí init (meno = MENO modulu); modul, ktorý v builde nie je (napr. obsah pred
 *          zlúčením), sa preskočí.
 *          „poznamka“ (poznamka.js) = pole „Poznámka k objednávke“ podľa návrhov; vzorkovník ho nemá (návrh ho nemá).
 *          „druha-vrstva“ (druha-vrstva.js, len jedno) = ponuka druhej vrstvy po kroku Farba: karta BEZ čísla (nie je
 *          v kroky, počty krokov sa nemenia); „Áno“ prenesie výber na dvojvrstvový produkt toho istého vzoru.
 *          „prenos“ (prenos.js, jedno aj dvoj) = zápis preneseného výberu na cieli a návrat výberu po tlačidle Späť.
 *          „komplet-ponuka“ (komplet-ponuka.js, rohože do kufra a box) = ponuka setu s autokobercami pod sedadlá: karta BEZ
 *          čísla (nie je v kroky) — rohož medzi Autom a Farbou, box za Veľkosťou (len 1–2 boxy); „Áno“ prenesie výber na
 *          jednovrstvové (prenos.js zapisVyber -> prijímač „prenos“ na jedno).
 * obal   – prvok vo formulári, bez ktorého sa nový vzhľad nezapne (živý konfigurátor sa nepostavil); null = len formulár.
 */
export const TYPY = {
  jedno: { kroky: ["vzor", "auto", "farba", "rozlozenie", "kufor", "boxy"], moduly: ["kroky", "rozlozenie", "kufor-boxy", "druha-vrstva", "cena", "poznamka", "prenos", "obsah"], obal: ".content-wrap" },
  dvoj: { kroky: ["vzor", "auto", "farba", "farba2", "rozlozenie", "kufor", "boxy"], moduly: ["kroky", "farba2", "rozlozenie", "kufor-boxy", "cena", "poznamka", "prenos", "obsah"], obal: ".content-wrap" },
  "kufor-classic": { kroky: ["vzor", "auto", "farba"], moduly: ["kroky", "kufor-produkt", "komplet-ponuka", "cena", "poznamka", "obsah"], obal: ".content-wrap" },
  "kufor-premium": { kroky: ["vzor", "auto", "farba"], moduly: ["kroky", "kufor-produkt", "komplet-ponuka", "cena", "poznamka", "obsah"], obal: ".content-wrap" },
  boxy: { kroky: ["farba", "pocet", "velkost"], moduly: ["kroky", "boxy-produkt", "komplet-ponuka", "cena", "poznamka", "obsah"], obal: ".content-wrap" },
  vzorky: { kroky: [], moduly: ["vzorky-produkt"], obal: null },
  // kamion: celé UI stavia modul kamion/ (6 krokov vo vlastnom koreni); živé kroky 1V na 640 nie sú (React sa nemontuje)
  kamion: { kroky: [], moduly: ["kamion"], obal: null },
};

/** Texty a obrázky typu (typy/<typ>.js). Základ = jedno (dnešné texty 598); typ prepíše, čo potrebuje. */
const TYPY_ZDROJ = { jedno: jedno.TYP, dvoj: dvoj.TYP, "kufor-classic": kuforClassic.TYP, "kufor-premium": kuforPremium.TYP, boxy: boxy.TYP, vzorky: vzorky.TYP, kamion: kamion.TYP };

const jeObjekt = (x) => !!x && typeof x === "object" && !Array.isArray(x);

/** Hlboké zlúčenie: b prepíše a (objekty sa zlúčia, ostatné hodnoty nahradia; null = „nemať“). Nič nemení na vstupe. */
export function zluc(a, b) {
  if (!jeObjekt(a)) return b === undefined ? a : b;
  if (!jeObjekt(b)) return b === undefined ? Object.assign({}, a) : b;
  const out = {};
  Object.keys(a).forEach((k) => { out[k] = a[k]; });
  Object.keys(b).forEach((k) => { out[k] = jeObjekt(a[k]) && jeObjekt(b[k]) ? zluc(a[k], b[k]) : b[k] === undefined ? a[k] : b[k]; });
  return out;
}

/** Záznam registra { id, typ, vzor, url, obsah } alebo null. */
export function zaznam(projectId, productId) {
  const p = PRODUKTY_1V[String(projectId)];
  const z = p && p[String(Number(productId))];
  return z ? Object.assign({ id: Number(productId) }, z) : null;
}

/**
 * Produkt pre ctx: { id, typ, vzor, url, obsah, kroky, moduly, obal, texty, obrazky } alebo null (nie je v registri).
 * texty a obrazky = zlúčené jedno + typ (typy/<typ>.js), kroky/moduly/obal z TYPY.
 */
export function produkt1v(kontext) {
  const z = kontext ? zaznam(kontext.projectId, kontext.productId) : null;
  const t = z && TYPY[z.typ];
  if (!t) return null;
  const zdroj = TYPY_ZDROJ[z.typ] || {};
  return Object.assign(z, {
    kroky: t.kroky.slice(),
    moduly: t.moduly.slice(),
    obal: t.obal,
    texty: zluc(jedno.TYP.texty || {}, zdroj.texty || {}),
    obrazky: zluc(jedno.TYP.obrazky || {}, zdroj.obrazky || {}),
  });
}

/** Je typ vydaný pre ?novy=1? */
export function jeZapnutyTyp(typ) {
  return ZAPNUTE_TYPY.indexOf(typ) > -1;
}

/**
 * Produkt daného typu v tom istom vzore (odkazy data-p1v-odkaz, ceny sesterských stránok ceny-ine.js):
 * najdiProdukt(562035, "kufor-classic", "hexa") -> { id: 622, typ, vzor, url, obsah } | null. Typ boxy nemá vzor;
 * bez vzoru (stránka boxu) = Diamond.
 */
export function najdiProdukt(projectId, typ, vzor) {
  const p = PRODUKTY_1V[String(projectId)];
  if (!p) return null;
  const v = vzor || "diamond";
  const ids = Object.keys(p);
  const id = ids.find((i) => p[i].typ === typ && (p[i].vzor === v || p[i].vzor == null)) || null;
  return id ? Object.assign({ id: Number(id) }, p[id]) : null;
}

/** { projectId: [productId zapnutých typov] } — ZOZNAM_1V pre spätnú kompatibilitu (index.js). */
export function zoznamZapnutych() {
  const out = {};
  Object.keys(PRODUKTY_1V).forEach((proj) => {
    out[proj] = Object.keys(PRODUKTY_1V[proj]).filter((id) => jeZapnutyTyp(PRODUKTY_1V[proj][id].typ)).map(Number);
  });
  return out;
}
