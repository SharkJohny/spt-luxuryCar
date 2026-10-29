// Jednotkový test výberu recenzií (assets/js/functions/lcdRecenzie.js) — spoločná logika 1V, titulky aj generátora
// tools/hp-recenzie.mjs. Bez siete a prehliadača.
//   node tools/test-lcd-recenzie.mjs   (exit 1 = chyba)
//
// Michal 29. 10. 2026: „3 najnovšie recenzie s textom + 9 jeho vybraných“. Večer: prvá karta s 48 znakmi („Pán je ochotný
// poradit bez problémů i o víkendu.“) bola skoro prázdna -> medzi 3 najnovšie len výrazné (vyraznaRecenzia: 5★ a text
// ≥ 120 znakov, alebo fotky + text ≥ 40). Krátke ostávajú v „Zobraziť ďalšie“.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R = await import(pathToFileURL(path.join(REPO, "assets/js/functions/lcdRecenzie.js")).href);

let ok = 0, zle = 0;
function over(podmienka, popis) {
  if (podmienka) { ok++; console.log("✓ " + popis); } else { zle++; console.log("✗ " + popis); }
}

const text = (n) => ("Koberce sedia presne, kvalita super, komunikácia rýchla a ochotná. ".repeat(10)).slice(0, n).replace(/\s+$/, "x");
const FOTO = ["https://www.luxurycardesign.sk/user/documents/upload/assets/img/reviews/rg-1-1.jpg"];
let id = 200;
const rec = (o) => ({ id: "g-" + id++, author: "A" + id, rating: 5, text: text(150), photos: [], dateApprox: "2026-10-01", ...o });

// ------------------------------------------------------------------ vyraznaRecenzia: prah
over(R.MIN_TEXT === 40 && R.MIN_TEXT_NAJNOVSIE === 120 && R.NAJNOVSICH === 3, "konštanty: MIN_TEXT 40, MIN_TEXT_NAJNOVSIE 120, NAJNOVSICH 3");
over(R.vyraznaRecenzia(rec({ text: text(120) })), "120 znakov bez fotky = výrazná");
over(!R.vyraznaRecenzia(rec({ text: text(119) })), "119 znakov bez fotky = nie");
over(!R.vyraznaRecenzia(rec({ text: "Pán je ochotný poradit bez problémů i o víkendu." })), "48 znakov bez fotky (naživo 1. karta 29. 10.) = nie");
over(R.vyraznaRecenzia(rec({ text: text(40), photos: FOTO })), "fotka + 40 znakov = výrazná");
over(!R.vyraznaRecenzia(rec({ text: text(39), photos: FOTO })), "fotka + 39 znakov = nie");
over(!R.vyraznaRecenzia(rec({ text: text(60), photos: ["http://x.sk/a.jpg"] })), "fotka bez https (karta ju neukáže) + 60 znakov = nie");
over(!R.vyraznaRecenzia(rec({ rating: 4, text: text(250), photos: FOTO })), "4★ = nie (najnovšie len 5★)");
over(!R.vyraznaRecenzia(rec({ text: text(80) + " Luxury Car Design Vlastník " + text(200) })), "odpoveď majiteľa sa do dĺžky neráta (zobrazený text 80 znakov)");
over(!R.vyraznaRecenzia(null) && !R.vyraznaRecenzia(rec({ text: "" })), "null / prázdny text = nie");
// 30. 10. 2026: vylúčené id (VYLUCENE_NAJNOVSIE) nejdú na začiatok, hoci sú dlhé — ostávajú v „Zobraziť ďalšie“
over(R.VYLUCENE_NAJNOVSIE.indexOf("g-98") !== -1, "VYLUCENE_NAJNOVSIE obsahuje g-98 (…ako rit na serbel — čaká na Michala)");
over(!R.vyraznaRecenzia(rec({ id: "g-98", text: text(250), photos: FOTO })), "vylúčené id g-98 (250 znakov + fotka) = nie");
over(R.dobraRecenzia(rec({ id: "g-98", text: text(250) })), "vylúčené id ostáva dobraRecenzia (karta v „Zobraziť ďalšie“)");

// ------------------------------------------------------------------ najnovsie / zoradRecenzie: poradie
{
  const kratkaNova = rec({ author: "Krátka", text: text(48), dateApprox: "2026-10-20" });
  const dlhaStarsia = rec({ author: "Dlhá", text: text(185), dateApprox: "2026-09-29" });
  const fotoStarsia = rec({ author: "Foto", text: text(60), photos: FOTO, dateApprox: "2026-09-29" });
  const dlhaNovsiaId = rec({ author: "Dlhá2", text: text(249), dateApprox: "2026-09-29" });
  const stara = rec({ author: "Stará", text: text(300), dateApprox: "2025-01-01" });
  const vybrana = rec({ author: "Vybraná", text: text(45), dateApprox: "2024-01-01" });
  const zoz = [stara, kratkaNova, dlhaStarsia, fotoStarsia, dlhaNovsiaId, vybrana];
  const n = R.najnovsie(zoz, 3).map((r) => r.author);
  over(n.join("|") === "Foto|Dlhá2|Dlhá", `najnovšie 3 výrazné, pri rovnakom dátume fotky, potom vyššie id (${n.join(", ")})`);
  const z = R.zoradRecenzie(zoz, ["Vybraná", "Krátka", "Neexistuje"]).map((r) => r.author);
  over(z.slice(0, 3).join("|") === "Foto|Dlhá2|Dlhá", "zoradRecenzie: prvé 3 = najnovšie výrazné");
  over(z[3] === "Vybraná" && z[4] === "Krátka", `zoradRecenzie: potom Michalov výber v jeho poradí (aj krátky ≥ 40 znakov) (${z.join(", ")})`);
  over(z.indexOf("Krátka") > 2 && z.length === new Set(z).size && z.length === zoz.length, "krátka najnovšia nie je na začiatku, ale ostáva v páse; bez duplicít, nikto nechýba");
  const relat = rec({ author: "Relatívna", text: text(130), dateApprox: undefined, relativeDate: "Pred 1 týždňami" });
  const r2 = R.najnovsie([dlhaStarsia, relat], 1, "2026-10-29T14:00:00Z").map((r) => r.author);
  over(r2[0] === "Relatívna", "bez dateApprox sa čas ráta z „Pred N týždňami“ k fetchedAt");
}

// ------------------------------------------------------------------ skutočné dáta (assets/js/reviews-data.js) + výber z 1V 598
{
  const raw = fs.readFileSync(path.join(REPO, "assets/js/reviews-data.js"), "utf8");
  const m = raw.slice(raw.indexOf("window.LCD_REVIEWS")).match(/window\.LCD_REVIEWS\s*=\s*([\s\S]*?);\s*$/);
  const d = JSON.parse(m[1]);
  const vyber = R.menaVyberu(/data-p1v-vyber="([^"]*)"/.exec(fs.readFileSync(path.join(REPO, "admin-html/src/p1v-598/10-a-recenzie.sk.html"), "utf8"))[1]);
  const karty = R.zoradRecenzie(d.reviews, vyber, { fetchedAt: d.place.fetchedAt });
  const prve3 = karty.slice(0, 3);
  over(prve3.every(R.vyraznaRecenzia), "skutočné dáta: prvé 3 karty sú výrazné (" + prve3.map((r) => `${r.author} ${R.textRecenzie(r.text).length}${R.fotkyKarty(r).length ? "+foto" : ""}`).join(", ") + ")");
  // žiadna výrazná recenzia novšia než tretia karta nesmie chýbať (inak by to neboli „najnovšie“)
  const t3 = R.casRecenzie(prve3[2], d.place.fetchedAt);
  const vynechane = d.reviews.filter((r) => R.vyraznaRecenzia(r) && prve3.indexOf(r) === -1 && R.casRecenzie(r, d.place.fetchedAt) > t3);
  over(!vynechane.length, "skutočné dáta: medzi prvými 3 nechýba novšia výrazná recenzia" + (vynechane.length ? " (" + vynechane.map((r) => r.author).join(", ") + ")" : ""));
  const dvanast = karty.slice(0, 12);
  const zVyberu = dvanast.slice(3).map((r) => r.author);
  const ocakavanyVyber = vyber.filter((meno) => R.dobraRecenzia(d.reviews.find((r) => r.author === meno)) && !prve3.some((r) => r.author === meno)).slice(0, 9);
  over(zVyberu.join("|") === ocakavanyVyber.join("|"), "skutočné dáta: karty 4–12 = Michalov výber v jeho poradí (" + zVyberu.join(", ") + ")");
  over(dvanast.length === 12 && new Set(dvanast.map((r) => r.id)).size === 12, "skutočné dáta: 12 kariet bez duplicít");
  const kratke = d.reviews.filter((r) => R.dobraRecenzia(r) && !R.vyraznaRecenzia(r) && vyber.indexOf(r.author) === -1);
  over(kratke.every((r) => karty.indexOf(r) >= 12), `skutočné dáta: krátke recenzie mimo výberu (${kratke.length}) sú až v „Zobraziť ďalšie“, nie medzi 12`);
  over(karty.length === d.reviews.filter((r) => Number(r.rating) >= 4 && String(r.text || "").trim()).length, `skutočné dáta: „Zobraziť ďalšie“ ukáže všetky s textom (${karty.length})`);
  const vyl = R.VYLUCENE_NAJNOVSIE.map((id) => d.reviews.find((r) => r.id === id)).filter(Boolean);
  over(vyl.length === R.VYLUCENE_NAJNOVSIE.length && vyl.every((r) => karty.indexOf(r) >= 12),
    "skutočné dáta: vylúčené (" + vyl.map((r) => r.author + " " + r.id).join(", ") + ") nie sú medzi 12, ale sú v „Zobraziť ďalšie“");
  console.log("  prvé 3: " + prve3.map((r) => `${r.author} (${r.id}, ${r.dateApprox}, ${R.textRecenzie(r.text).length} zn., fotky ${R.fotkyKarty(r).length})`).join("; "));
}

console.log(`\n${ok} ok, ${zle} zle`);
process.exit(zle ? 1 : 0);
