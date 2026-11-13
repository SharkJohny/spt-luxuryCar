#!/usr/bin/env node
// Test generátora stránok kamiónov a dodávok (tools/build-kamiony-stranky.mjs) na KÓPII vstupu mimo repa (13. 11. 2026,
// vlna 4 a 5): admin-html/kamiony/ v repe sa nemení.
//   1) kópia stranky.json bez zmeny -> všetky výstupy bajt po bajte ako v repe (generátor nič nepridá, kým stránka nie je v dátach)
//   2) základ = len 20 stránok prvej várky (PRVA_VARKA z generátora, 13. 11. 2026 noc: v repe je už aj vlna 4 a 5)
//      + vymyslené stránky (kamión Ford a IVECO, dodávka Fiat bez fotky vozidla, dodávka Mercedes-Benz s fotkou, čakajúca
//      dodávka Citroën) -> nové Popisy, podkategórie značiek Ford a IVECO, jedna kategória dodávok, dlaždica „Dodávky“
//      v prehľade, odkaz v pätičke, riadok v kategorie-znaciek.json; staré Popisy a podkategórie starých značiek bez zmeny
//   3) zlá adresa (nesedí so slugom) -> exit 1
//   node tools/test-kamion-stranky-build.mjs            (--nechaj = dočasné priečinky nezmaže a vypíše ich, na náhľad)
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(KOREN, "admin-html", "kamiony");
const GEN = join(KOREN, "tools", "build-kamiony-stranky.mjs");

let ok = 0, zle = 0;
const over = (nazov, podm, detail) => {
  if (podm) { ok++; console.log("  OK   " + nazov); }
  else { zle++; console.log("  ZLE  " + nazov + (detail ? " — " + detail : "")); }
};
const spusti = (dir, ...arg) => {
  const r = spawnSync(process.execPath, [GEN, "--priecinok", dir, ...arg], { cwd: KOREN, encoding: "utf8" });
  return { kod: r.status, vystup: String(r.stdout || "") + String(r.stderr || "") };
};
const subory = (dir) => readdirSync(dir).filter((f) => f !== "stranky.json").sort();
const citaj = (dir, f) => readFileSync(join(dir, f), "utf8");
const pocet = (t, co) => t.split(co).length - 1;

const vstup = citaj(REPO, "stranky.json");
const docasne = [];
const novy = (json) => { const d = mkdtempSync(join(tmpdir(), "lcd-kamiony-build-")); docasne.push(d); writeFileSync(join(d, "stranky.json"), json); return d; };

try {
  // ---------------------------------------------------------------- 1) bez nových stránok
  console.log("1) Kópia stranky.json bez zmeny");
  const d1 = novy(vstup);
  const r1 = spusti(d1);
  over("build skončí 0", r1.kod === 0, r1.vystup.slice(-400));
  const repoSubory = subory(REPO), s1 = subory(d1);
  over("tie isté súbory ako v repe (" + repoSubory.length + ")", s1.join() === repoSubory.join(), "navyše: " + s1.filter((f) => !repoSubory.includes(f)).join() + " | chýba: " + repoSubory.filter((f) => !s1.includes(f)).join());
  const ine1 = repoSubory.filter((f) => existsSync(join(d1, f)) && citaj(d1, f) !== citaj(REPO, f));
  over("všetky výstupy bajt po bajte ako v repe", ine1.length === 0, ine1.join());
  // kategória dodávok a podkategórie Ford / IVECO vzniknú práve vtedy, keď je v dátach hotová stránka (13. 11. 2026 noc: vlna 4 a 5)
  const d1data = JSON.parse(vstup).stranky, hot = Object.values(d1data).filter((x) => !x.sk.caka);
  const maDod = hot.some((x) => x.sk.url.startsWith("/autokoberce-do-dodavky-")), maFord = hot.some((x) => x.sk.znacka === "Ford"), maIveco = hot.some((x) => x.sk.znacka === "IVECO");
  over("kategória dodávok / Ford / IVECO len pri hotovej stránke (" + [maDod, maFord, maIveco].join("/") + ")",
    s1.some((f) => /^kategoria-autokoberce-do-dodavky\./.test(f)) === maDod && s1.some((f) => /-ford\./.test(f)) === maFord && s1.some((f) => /-iveco\./.test(f)) === maIveco);
  const c1 = spusti(d1, "--check");
  over("--check na kópii skončí 0", c1.kod === 0, c1.vystup.slice(-400));

  // ---------------------------------------------------------------- 2) vymyslené stránky
  console.log("2) Vymyslené stránky: Ford, IVECO, dve dodávky a čakajúca dodávka");
  // základ: len 20 stránok prvej várky (zoznam PRVA_VARKA z generátora), výstupy základu = porovnávací stav
  const PRVA = (readFileSync(GEN, "utf8").match(/const PRVA_VARKA = \[([^\]]+)\]/) || [, ""])[1].match(/"[a-z0-9-]+"/g).map((x) => x.slice(1, -1));
  over("generátor má PRVA_VARKA s 20 stránkami", PRVA.length === 20, PRVA.join());
  const data = JSON.parse(vstup);
  for (const k of Object.keys(data.stranky)) if (!PRVA.includes(k)) delete data.stranky[k];
  const d0 = novy(JSON.stringify(data, null, 2) + "\n");
  const r0 = spusti(d0);
  over("základ (prvá várka) build skončí 0", r0.kod === 0, r0.vystup.slice(-400));
  const zakladSubory = subory(d0);
  const vzor = data.stranky["scania-r"], tahac = data.stranky["mercedes-actros"].sk.tahac;
  const stranka = (slug, typ, znacka, model, od, po, o = {}) => {
    const z = {};
    for (const j of ["sk", "cz"]) {
      const v = JSON.parse(JSON.stringify(vzor[j]));
      const roky = []; for (let rok = od; rok < po; rok++) roky.push(rok);
      Object.assign(v, {
        nazov: "Autokoberce do " + (typ === "dodavky" ? "dodávky " : j === "sk" ? "kamiónu " : "kamionu ") + model,
        url: "/autokoberce-do-" + typ + "-" + slug + "/",
        popisNadpis: model + (j === "sk" ? " s našimi autokobercami" : " s našimi autokoberci"),
        popisUvod: (j === "sk" ? "Skúšobný úvod. Sedia do ročníkov " + roky.join(", ") + " aj " + po + "." : "Zkušební úvod. Pasují do ročníků " + roky.join(", ") + " i " + po + "."),
        model, roky: { od, do: po }, znacka, tahac: o.tahac || null, caka: o.caka || null,
      });
      if (o.caka) v.fotky = [];
      z[j] = v;
    }
    data.stranky[slug] = z;
  };
  stranka("ford-f-max", "kamionu", "Ford", "Ford F-MAX", 2018, 2026);
  stranka("iveco-stralis-hi-way", "kamionu", "IVECO", "IVECO Stralis Hi-Way", 2011, 2019, { tahac });
  stranka("fiat-ducato", "dodavky", "Fiat", "Fiat Ducato", 2006, 2026);
  stranka("mercedes-sprinter", "dodavky", "Mercedes-Benz", "Mercedes-Benz Sprinter", 2018, 2026, { tahac });
  for (const j of ["sk", "cz"]) data.stranky["mercedes-sprinter"][j].fotkyMeno = "autokoberce-do-kamionu-mercedes-sprinter"; // fotky pod iným menom
  stranka("citroen-jumper", "dodavky", "Citroën", "Citroën Jumper", 2014, 2026, { caka: "čaká na fotky" });
  const d2 = novy(JSON.stringify(data, null, 2) + "\n");
  const r2 = spusti(d2);
  over("build skončí 0 (obrázky vymyslených galérií len v informácii)", r2.kod === 0, r2.vystup.slice(-600));
  over("build vypíše čakajúce stránky a dodávky; Ford a IVECO majú logo v repe (13. 11. 2026)", /čakajú[^\n]*citroen-jumper/.test(r2.vystup) && !/značky bez loga/.test(r2.vystup) && /dodávky: 2 hotových/.test(r2.vystup), r2.vystup.slice(0, 700));
  const s2 = subory(d2);
  const cakane = [];
  for (const j of ["sk", "cz"]) cakane.push("ford-f-max." + j + ".html", "iveco-stralis-hi-way." + j + ".html", "fiat-ducato." + j + ".html", "mercedes-sprinter." + j + ".html",
    "kategoria-autokoberce-do-kamionu-ford." + j + ".html", "kategoria-autokoberce-do-kamionu-iveco." + j + ".html", "kategoria-autokoberce-do-dodavky." + j + ".html");
  const nove = s2.filter((f) => !zakladSubory.includes(f));
  over("nové súbory = 4 Popisy, 2 značky a kategória dodávok × SK a CZ (" + cakane.length + ")", nove.join() === cakane.slice().sort().join(), nove.join());
  over("čakajúca dodávka nemá Popis", !s2.some((f) => /^citroen-jumper\./.test(f)));
  const zmenene = zakladSubory.filter((f) => citaj(d2, f) !== citaj(d0, f));
  const smuZmenit = ["kategoria-autokoberce-do-kamionu.cz.html", "kategoria-autokoberce-do-kamionu.sk.html", "kategorie-znaciek.json", "manifest.json", "paticka-kamiony.cz.html", "paticka-kamiony.sk.html"];
  over("zo starých súborov sa zmenil len prehľad, pätička, kategorie-znaciek.json a manifest", zmenene.join() === smuZmenit.join(), zmenene.join());

  for (const j of ["sk", "cz"]) {
    const J = j.toUpperCase() + " ";
    const prehlad = citaj(d2, "kategoria-autokoberce-do-kamionu." + j + ".html"), stary = citaj(d0, "kategoria-autokoberce-do-kamionu." + j + ".html");
    over(J + "prehľad: dlaždice Ford, IVECO a Dodávky pribudli, staré značky ostali", ["ford", "iveco"].every((z) => prehlad.includes('href="/autokoberce-do-kamionu-' + z + '/"')) && prehlad.includes('href="/autokoberce-do-dodavky/"') &&
      (stary.match(/<li><a class="lcd-pa__znacka" href="[^"]+"/g) || []).every((x) => prehlad.includes(x)) && pocet(prehlad, '<a class="lcd-pa__znacka" ') === pocet(stary, '<a class="lcd-pa__znacka" ') + 3);
    // mriežka značiek: každá dlaždica = obrázok loga alebo obrys v .lcd-pa__znacka-ik, potom <b>
    const dl = prehlad.match(/<li><a class="lcd-pa__znacka"[\s\S]*?<\/li>/g) || [];
    over(J + "prehľad: každá dlaždica má logo alebo obrys a názov (mriežka sa nerozbije)", dl.length > 0 && dl.every((x) => /^<li><a class="lcd-pa__znacka" href="\/[a-z0-9-]+\/">(<img src="[^"]+\.svg" alt="" width="46" height="46" loading="lazy" decoding="async">|<span class="lcd-pa__znacka-ik"><svg [\s\S]*?<\/svg><\/span>)<b>[^<]+<\/b><\/a><\/li>$/.test(x)), dl.filter((x) => !/<b>/.test(x)).join());
    over(J + "prehľad: štýl obrysu len pod body.in-autokoberce-do-kamionu", /body\.in-autokoberce-do-kamionu \.lcd-pa--kamiony \.lcd-pa__znacka-ik\{/.test(prehlad) && !/lcd-pa__znacka-ik/.test(stary));

    const dod = citaj(d2, "kategoria-autokoberce-do-dodavky." + j + ".html");
    const dlazdice = dod.match(/<li><a class="lcd-pa__auto"[\s\S]*?<\/a><\/li>/g) || [];
    over(J + "dodávky: 2 dlaždice (Fiat, Mercedes-Benz), čakajúca Citroën nie", dlazdice.length === 2 && dod.includes('href="/autokoberce-do-dodavky-fiat-ducato/"') && dod.includes('href="/autokoberce-do-dodavky-mercedes-sprinter/"') && !/citroen/.test(dod), String(dlazdice.length));
    over(J + "dodávky: žiadny odkaz na stránku kamióna", !/href="\/autokoberce-do-kamionu-[a-z0-9-]+\/"/.test(dod));
    // dlaždica bez fotky vozidla: obrys v tom istom rámiku .lcd-pa__foto, zvyšok dlaždice rovnaký
    const tvar = /^<li><a class="lcd-pa__auto" href="\/[a-z0-9-]+\/"><span class="lcd-pa__foto">(<picture>[\s\S]*?<\/picture>|<svg [\s\S]*?<\/svg>)<\/span><b>[^<]+<\/b><span>\d{4}–\d{4}<\/span><i>[^<]+<\/i><\/a><\/li>$/;
    over(J + "dodávky: obe dlaždice majú rovnakú stavbu (s fotkou aj bez)", dlazdice.every((x) => tvar.test(x)) && dlazdice.filter((x) => /<picture>/.test(x)).length === 1 && dlazdice.filter((x) => /<span class="lcd-pa__foto"><svg /.test(x)).length === 1);
    over(J + "dodávky: „Iný model?“, späť na prehľad, jeden <style> pod body.in-autokoberce-do-dodavky", dod.includes('<li><a class="lcd-pa__iny" href="') && dod.includes('<a class="lcd-pa__spat" href="/autokoberce-do-kamionu/">') && pocet(dod, "<style>") === 1 && /^<style>\nbody\.in-autokoberce-do-dodavky\{/.test(dod));

    const ford = citaj(d2, "kategoria-autokoberce-do-kamionu-ford." + j + ".html");
    over(J + "Ford: 1 dlaždica bez fotky (obrys ťahača), H1 s logom", pocet(ford, '<a class="lcd-pa__auto" ') === 1 && /<span class="lcd-pa__foto"><svg /.test(ford) && /h1\.category-title::before/.test(ford) && /znacky\/ford\.svg/.test(ford) && ford.includes('href="/autokoberce-do-kamionu-ford-f-max/"'));
    const mb = citaj(d2, "kategoria-autokoberce-do-kamionu-mercedes-benz." + j + ".html");
    over(J + "Mercedes-Benz (kamióny): bez Sprintera, bajt po bajte ako v základe", !/sprinter/i.test(mb) && mb === citaj(d0, "kategoria-autokoberce-do-kamionu-mercedes-benz." + j + ".html"));

    const fiat = citaj(d2, "fiat-ducato." + j + ".html");
    over(J + "Popis dodávky: fotky z <cdn>fiat-ducato/autokoberce-do-dodavky-fiat-ducato-galeria-NN", /kamion-stranky\/fiat-ducato\/autokoberce-do-dodavky-fiat-ducato-galeria-01\.jpg"/.test(fiat) && !/autokoberce-do-kamionu-fiat-ducato/.test(fiat) && fiat.includes('data-p1v-lb-sada="kamiony-fiat-ducato"'));
    const spr = citaj(d2, "mercedes-sprinter." + j + ".html");
    over(J + "Popis s poľom fotkyMeno: fotky z <cdn>mercedes-sprinter/autokoberce-do-kamionu-mercedes-sprinter-galeria-NN", /kamion-stranky\/mercedes-sprinter\/autokoberce-do-kamionu-mercedes-sprinter-galeria-01-m\.jpg"/.test(spr) && !/autokoberce-do-dodavky-mercedes-sprinter-galeria/.test(spr));
    const fmax = citaj(d2, "ford-f-max." + j + ".html");
    over(J + "Popis kamióna novej značky: fotky z <cdn>ford-f-max/autokoberce-do-kamionu-ford-f-max-galeria-NN", /kamion-stranky\/ford-f-max\/autokoberce-do-kamionu-ford-f-max-galeria-01\.jpg"/.test(fmax));
    const pata = citaj(d2, "paticka-kamiony." + j + ".html");
    over(J + "pätička: Ford, IVECO a Dodávky pred „Nájsť môj kamión“", /autokoberce-do-kamionu-ford\/[\s\S]*autokoberce-do-kamionu-iveco\/[\s\S]*autokoberce-do-kamionu-volvo\/[\s\S]*href="\/autokoberce-do-dodavky\/"[\s\S]*lcd-kam-zoznam__hladaj/.test(pata));
  }
  const kz = JSON.parse(citaj(d2, "kategorie-znaciek.json")), kzRepo = JSON.parse(citaj(d0, "kategorie-znaciek.json"));
  for (const j of ["sk", "cz"]) {
    over(j.toUpperCase() + " kategorie-znaciek.json: staré značky bez zmeny, pribudli Ford, IVECO a dodávky",
      kzRepo[j].every((x) => JSON.stringify(kz[j].find((y) => y.url === x.url)) === JSON.stringify(x)) && kz[j].length === kzRepo[j].length + 3 &&
      ["/autokoberce-do-kamionu-ford/", "/autokoberce-do-kamionu-iveco/"].every((u) => kz[j].some((y) => y.url === u && !("typ" in y))) &&
      kz[j].filter((y) => y.typ === "dodavky").length === 1 && kz[j][kz[j].length - 1].url === "/autokoberce-do-dodavky/" && kz[j][kz[j].length - 1].indexName === "autokoberce-do-dodavky" &&
      /Fiat Ducato \(2006–2026\), Mercedes-Benz Sprinter \(2018–2026\)/.test(kz[j][kz[j].length - 1].metaTagDescription) && existsSync(join(d2, kz[j][kz[j].length - 1].popis)), JSON.stringify(kz[j].slice(-1)));
  }

  // ---------------------------------------------------------------- 3) chyby vstupu
  console.log("3) Chyby vstupu");
  const zla = JSON.parse(JSON.stringify(data));
  zla.stranky["fiat-ducato"].cz.url = "/autokoberce-do-dodavky-fiat/";
  const r3 = spusti(novy(JSON.stringify(zla, null, 2) + "\n"));
  over("adresa nesedí so slugom -> exit 1 s hláškou", r3.kod === 1 && /fiat-ducato: adresa nesedí so slugom/.test(r3.vystup), r3.vystup.slice(-300));
  const zlaZnacka = JSON.parse(JSON.stringify(data));
  for (const j of ["sk", "cz"]) zlaZnacka.stranky["ford-f-max"][j].znacka = "Tatra";
  const r4 = spusti(novy(JSON.stringify(zlaZnacka, null, 2) + "\n"));
  over("kamión značky mimo zoznamu -> exit 1 s hláškou", r4.kod === 1 && /značka kamiónu mimo zoznamu ZNACKY: Tatra/.test(r4.vystup), r4.vystup.slice(-300));
  const zleMeno = JSON.parse(JSON.stringify(data));
  zleMeno.stranky["mercedes-sprinter"].cz.fotkyMeno = "Iné meno";
  const r6 = spusti(novy(JSON.stringify(zleMeno, null, 2) + "\n"));
  over("fotkyMeno s medzerou alebo SK ≠ CZ -> exit 1", r6.kod === 1 && /mercedes-sprinter: fotkyMeno/.test(r6.vystup), r6.vystup.slice(-300));
  const malo = JSON.parse(vstup);
  delete malo.stranky["scania-r"];
  const r5 = spusti(novy(JSON.stringify(malo, null, 2) + "\n"));
  over("chýba stránka prvej várky -> exit 1", r5.kod === 1 && /chýba stránka prvej várky: scania-r/.test(r5.vystup), r5.vystup.slice(-300));
  // 13. 11. 2026 noc: stará stránka nesmie čakať (je naživo) — aj keď je v JSON všetkých 32 stránok
  const caka = JSON.parse(vstup);
  for (const j of ["sk", "cz"]) { caka.stranky["volvo-fh4"][j].caka = "skúška"; caka.stranky["volvo-fh4"][j].fotky = []; }
  const r7 = spusti(novy(JSON.stringify(caka, null, 2) + "\n"));
  over("stránka prvej várky s „caka“ -> exit 1", r7.kod === 1 && /stránka prvej várky čaká[^\n]*volvo-fh4/.test(r7.vystup), r7.vystup.slice(-300));

  // ---------------------------------------------------------------- 4) repo bez zmeny
  console.log("4) Repo");
  const rc = spawnSync(process.execPath, [GEN, "--check"], { cwd: KOREN, encoding: "utf8" });
  over("--check v repe skončí 0 (admin-html/kamiony/ sedí so stranky.json)", rc.status === 0, String(rc.stdout || "").slice(-400));
  over("test repo nezmenil (stranky.json ako na začiatku)", citaj(REPO, "stranky.json") === vstup);
} finally {
  if (process.argv.includes("--nechaj")) console.log("dočasné priečinky (zmaž ručne):\n" + docasne.join("\n"));
  else for (const d of docasne) { try { rmSync(d, { recursive: true, force: true }); } catch (e) { /* nič */ } }
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
