// Scenáre navyše pre dvojvrstvové 601/604/607 (typ „dvoj“). VLASTNÍK: worker dvoj (W2 / T1.2).
// Tvar a parametre: tools/test-1v/scenare-jedno.mjs. Spoločné scenáre (platne s farbou 2. vrstvy, neuplne
// auto -> farba -> farba2 -> rozloženie, kufor-*, box-* …) sú v jadre.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { otvorKartu } from "./ovladac-kroky.mjs";

/** Hlavná fotka galérie produktu (pravidlo „farba len náhľad“: výber farby ju nesmie zmeniť). */
const hlavnaFotka = (t) => t.ev(`(function () {
  var i = document.querySelector(".p-image-wrapper .p-image img") || document.querySelector(".p-image-wrapper img");
  return i ? (i.currentSrc || i.src) : null;
})()`);

/** Snímka karty kroku (len s --snimky; predvolene kroku 4 „farba2“): clip podľa polohy karty na stránke. */
async function snimkaKroku(s, a, meno, krok = "farba2") {
  if (!a.snimky) return;
  mkdirSync(a.snimky, { recursive: true });
  const sel = JSON.stringify("#product-detail-form .lcd1v-k-" + krok);
  await s.t.ev(`(function () { var e = document.querySelector(${sel}); if (e) { e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); } })()`);
  await s.t.pauza(500);
  const r = await s.t.ev(`(function () { var e = document.querySelector(${sel}); var b = e.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; })()`);
  const res = await s.k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.w + 20, height: r.h + 20, scale: 1 } });
  writeFileSync(join(a.snimky, `${s.produkt.id}-${krok}-${meno}-${s.t.sirka}.png`), Buffer.from(res.data, "base64"));
}

/**
 * Nezávislá kópia pravidla „odporúčaná Lux v tóne farby 1. vrstvy“ (Michal 10. 10. 2026): béžová 12, hnedá aj hnedá káva 11,
 * vínová aj červená 13, šedá 16, všetko ostatné (čierna s akýmkoľvek šitím, modrá, oranžová, fialová) 10. Rozhoduje farba
 * kože (text po „Farba kože :“ po „Farba šitia“ alebo lomku), nie šitie.
 */
function ocakavanaLux(text) {
  const t = String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
  const m = /koze\s*:?\s*(.*)$/.exec(t);
  const koza = (m ? m[1] : t).split(/farba\s+sitia|\//)[0].trim();
  if (/bezov/.test(koza)) return 12;
  if (/hned|kava/.test(koza)) return 11;
  if (/vin|cerven/.test(koza)) return 13;
  if (/sed|siv/.test(koza)) return 16;
  return 10;
}

const POPISY = { 10: "čierna", 11: "tmavohnedá", 12: "béžová", 13: "vínovo červená", 16: "sivá", 14: "čierno-červená melírovaná", 15: "čierno-sivá melírovaná" };
const SKUPINA_A = [10, 11, 12, 13, 16, 14, 15];
const SKUPINA_B = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const SCENARE = {
  /**
   * Zmena farby 2. vrstvy po celom výbere: priceId = variant „71-<lux>-78-<farba>“ (oba variantné selecty),
   * POST nesie novú Lux, cena = Shoptet. (plan §6: 2V priceId závisí od dvoch variantov)
   */
  "farba2-prepni": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy });
      const z = await j.zaklad(s, ovl, { farba2: 0 });
      const pred = await s.t.ev(`(document.querySelector('#product-detail-form input[name="priceId"]') || {}).value || ""`);
      const f2 = await ovl.farba2.vyberFarbu2(s.t, { index: 3 });
      j.over(f2 && f2 !== z.farba2, "farba 2. vrstvy sa nezmenila: " + z.farba2 + " -> " + f2);
      await ovl.cena.pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ...z.ocak, farba2: f2 });
      j.over(post.pole.priceId !== pred, "priceId sa po zmene farby 2. vrstvy nezmenilo (" + pred + ")");
      const c = await j.overCenu(s, ovl, cena);
      return { info: `Lux ${z.farba2} -> ${f2}: priceId ${pred} -> ${post.pole.priceId}, cena ${c.videne}`, post: post.body, spolu: cena.spolu };
    },
  },

  /**
   * Vzhľad kroku 4 (len nový vzhľad): 16 vzoriek Lux v 2 skupinách (7 jednofarebných a melírovaných, 9 s pruhmi), nič
   * predvolené, zhrnutie „16 farieb na výber“, štítok „Odporúčame“ na jednofarebnej Lux v tóne 1. vrstvy, vysvetlenie „i“,
   * po výbere náhľad „Lux Color NN — popis“ a zhrnutie „Lux Color NN“, hlavná fotka sa nezmení, žiadny Comfort, bez farby
   * 2. vrstvy červený rám s textom „Vyberte, prosím, farbu druhej vrstvy.“, POST 0.
   */
  "farba2-vzhlad": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.farba2 !== "novy") return { preskoc: "vzhľad kroku 4 existuje len v novom vzhľade (--novy / --vyvoj)" };
      const t = s.t, f2 = ovl.farba2, over = j.over;
      await j.otvor(s, a.url, { novy: true });
      await ovl.kroky.vyberAuto(t, j.AUTO);
      const farbaV = await ovl.kroky.vyberFarbu(t, { index: 2 }); // 3. voľba: čierna s čiernym šitím (607: v tóne kože podľa textu)
      const fText = await t.ev(`(function (v) { var m = window.__lcd1v.moznosti("farba").find(function (x) { return x.hodnota === v; }); return m ? m.text : ""; })(${JSON.stringify(farbaV)})`);
      const ocakOdp = ocakavanaLux(fText);
      const foto0 = await hlavnaFotka(t);
      await f2.otvor(t);
      await t.pauza(500);
      let st = await f2.stav(t);
      over(st, "karta kroku 4 (.lcd1v-k-farba2) neexistuje");
      // 16 vzoriek, nič predvolené, len Lux
      over(st.vzorky.length === 16, "viditeľných vzoriek " + st.vzorky.length + " ≠ 16");
      over(!st.vzorky.some((x) => x.aktivna), "pred výberom je predvolená vzorka Lux " + (st.vzorky.find((x) => x.aktivna) || {}).lux);
      over((await t.ev(`window.__lcd1v.precitaj("farba2")`)) === "", "pred výberom je vo formulári farba 2. vrstvy " + (await t.ev(`window.__lcd1v.precitaj("farba2")`)));
      over(!/comfort/i.test(st.text) && !st.vzorky.some((x) => /comfort/i.test(x.label + x.text)), "v kroku 4 sa spomína Comfort");
      over(st.vzorky.every((x) => /^Lux Color \d\d$/.test(x.text)), "vzorka mimo Lux Color NN: " + JSON.stringify(st.vzorky.map((x) => x.text)));
      // poradie: 2 skupiny (7 + 9), v návrhu (zhora nadol, zľava doprava)
      const poradie = st.vzorky.map((x) => x.lux);
      over(JSON.stringify(poradie.slice(0, 7)) === JSON.stringify(SKUPINA_A), "1. skupina (jednofarebné a melírované) " + poradie.slice(0, 7).join(",") + " ≠ " + SKUPINA_A.join(","));
      over(JSON.stringify(poradie.slice(7)) === JSON.stringify(SKUPINA_B), "2. skupina (s pruhmi) " + poradie.slice(7).join(",") + " ≠ " + SKUPINA_B.join(","));
      // všetky vzorky v mriežke rovnako veľké a vidno ich celé
      over(st.vzorky.every((x) => Math.abs(x.w - st.vzorky[0].w) <= 1 && x.w >= 40), "vzorky nie sú rovnako veľké / sú príliš malé: " + st.vzorky.map((x) => x.w).join(","));
      // texty: zhrnutie, podnadpis, vysvetlenie
      over(st.zhrnutie === "16 farieb na výber" && st.vyber === "16 farieb na výber", `zhrnutie v hlavičke „${st.zhrnutie}“ / data-lcd1v-vyber „${st.vyber}“ ≠ „16 farieb na výber“`);
      over(st.podnadpis.startsWith("Druhá vrstva vyzerá najlepšie v tóne prvej prešívanej vrstvy — k čiernej Lux Color 10, k béžovej 12, k hnedej 11."), "podnadpis: " + st.podnadpis);
      over(st.info && st.info.viditelne && st.info.expanded === "false" && st.vysvetlenie && !st.vysvetlenie.viditelne, "„i“ má byť viditeľné a vysvetlenie zavreté: " + JSON.stringify({ i: st.info, v: st.vysvetlenie && st.vysvetlenie.viditelne }));
      over(st.nahlad === null, "náhľad je viditeľný pred výberom farby");
      // Odporúčame: jednofarebná Lux v tóne 1. vrstvy, len jedna vzorka
      over(st.odporucame && st.odporucame.stitok === "Odporúčame", "štítok Odporúčame nie je viditeľný: " + JSON.stringify(st.odporucame));
      const odp = st.vzorky.filter((x) => x.odporucana);
      over(odp.length === 1 && odp[0].lux === ocakOdp, `odporúčaná vzorka ${odp.map((x) => x.lux).join(",") || "žiadna"} ≠ ${ocakOdp} (farba 1. vrstvy „${fText}“)`);
      over(SKUPINA_A.slice(0, 5).includes(odp[0].lux), "odporúčaná Lux " + odp[0].lux + " nie je jednofarebná 10/11/12/13/16");
      over(st.odporucame.text === `Lux Color ${odp[0].lux} — ${POPISY[odp[0].lux]}`, "text odporúčania „" + st.odporucame.text + "“");
      over(/odporúčame/i.test(odp[0].label), "aria-label odporúčanej vzorky nehovorí „odporúčame“: " + odp[0].label);
      await snimkaKroku(s, a, "pred-vyberom");
      // vysvetlenie „i“
      await f2.prepniVysvetlenie(t);
      st = await f2.stav(t);
      over(st.vysvetlenie.viditelne && st.info.expanded === "true" && /Zachytí vodu, sneh aj blato/.test(st.vysvetlenie.text) && /Farba druhej vrstvy cenu nemení\./.test(st.vysvetlenie.text), "vysvetlenie po kliku na „i“: " + JSON.stringify(st.vysvetlenie));
      await snimkaKroku(s, a, "vysvetlenie");
      await f2.prepniVysvetlenie(t);
      st = await f2.stav(t);
      over(!st.vysvetlenie.viditelne && st.info.expanded === "false", "vysvetlenie sa druhým klikom nezavrelo");
      // výber: 4. vzorka v živom poradí (Lux 13), náhľad, zhrnutie, hlavná fotka sa nemení
      const v = await f2.vyberFarbu2(t, { index: 3 });
      st = await f2.stav(t);
      const zv = st.vzorky.filter((x) => x.aktivna);
      over(zv.length === 1 && zv[0].value === v && zv[0].lux === 13, "zvolená vzorka " + JSON.stringify(zv) + " (value vo formulári " + v + ", očakávaná Lux 13)");
      over(st.nahlad && st.nahlad.nazov === "Lux Color 13 — vínovo červená" && /lux-color-13/.test(st.nahlad.src), "náhľad: " + JSON.stringify(st.nahlad));
      over(st.zhrnutie === "Lux Color 13", "zhrnutie po výbere „" + st.zhrnutie + "“ ≠ „Lux Color 13“");
      over(st.vzorky.filter((x) => x.odporucana).length === 1 && st.vzorky.find((x) => x.odporucana).lux === ocakOdp, "po výbere sa odporúčanie zmenilo");
      over((await hlavnaFotka(t)) === foto0, "výber farby 2. vrstvy zmenil hlavnú fotku produktu: " + foto0 + " -> " + (await hlavnaFotka(t)));
      await snimkaKroku(s, a, "po-vybere");
      over(s.posty.length === 0, "výber farby odoslal POST do košíka: " + (s.posty[0] && s.posty[0].body));
      return { info: `16 vzoriek (7 + 9), nič predvolené, Odporúčame Lux ${ocakOdp} k „${fText.replace(/\s+/g, " ")}“, výber Lux 13: náhľad „${st.nahlad.nazov}“, zhrnutie „${st.zhrnutie}“, hlavná fotka sa nezmenila` };
    },
  },

  /** Bez farby 2. vrstvy: červený rám karty 4 s textom „Vyberte, prosím, farbu druhej vrstvy.“ (len nový vzhľad), POST 0. */
  "farba2-chyba": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.farba2 !== "novy") return { preskoc: "chybový text kroku 4 existuje len v novom vzhľade (--novy / --vyvoj)" };
      const t = s.t, over = j.over;
      await j.otvor(s, a.url, { novy: true });
      await ovl.kroky.vyberAuto(t, j.AUTO);
      await ovl.kroky.vyberFarbu(t, { index: 2 });
      await ovl.cena.pridajDoKosika(t);
      const c = await ovl.kroky.cervenyKrok(t);
      over(c === "farba2", "bez farby 2. vrstvy má byť červený rám na kroku farba2, je na: " + c);
      await t.pauza(500);
      const st = await ovl.farba2.stav(t);
      over(st.chyba && st.chybaTx === "Vyberte, prosím, farbu druhej vrstvy.", "chybový text kroku 4: " + JSON.stringify({ chyba: st.chyba, tx: st.chybaTx }));
      await snimkaKroku(s, a, "chyba");
      over(s.posty.length === 0, "bez farby 2. vrstvy odišiel POST: " + (s.posty[0] && s.posty[0].body));
      // po výbere farby 2. vrstvy rám aj text zmiznú (kontrola nesmie zostať „viseť“)
      await ovl.farba2.vyberFarbu2(t, { index: 0 });
      await t.pauza(400);
      const po = await ovl.farba2.stav(t);
      over(!po.chyba && po.chybaTx === null, "po výbere farby 2. vrstvy ostal červený rám: " + JSON.stringify({ chyba: po.chyba, tx: po.chybaTx }));
      return { info: "bez farby 2. vrstvy: červený rám + „Vyberte, prosím, farbu druhej vrstvy.“, po výbere zmizne, POST 0" };
    },
  },

  /**
   * Texty a obrázky typu „dvoj“ (typy/dvoj.js) podľa návrhu dvojvrstvove.html: hlavičky kariet 1, 3, 4 (názov, otázka,
   * podnadpis, chyba), „Krok N z 7“, „Váš set v 7 krokoch“, štítok „Dvojvrstvové“, fotky vzorov dvoj-vzor-*.jpg, vysvetlenie
   * kroku „Rohož do kufra“ (Classic / Premium), v novom texte nič zakázané (rovnakú cenu, na milimeter, vyrábame, Comfort,
   * fixačné body, záruka, DragonSkin / Elite / Basic, počet vrstiev materiálu). Živý H1 sa nekontroluje (ostáva v DOM).
   */
  "dvoj-texty": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.kroky !== "novy") return { preskoc: "texty kariet sú len v novom vzhľade (--novy / --vyvoj)" };
      const t = s.t, over = j.over;
      await j.otvor(s, a.url, { novy: true });
      const r = await t.ev(`(function () {
        var f = document.getElementById("product-detail-form");
        function txt(e, sel) { var x = e && e.querySelector(sel); return x ? x.textContent.replace(/\\s+/g, " ").trim() : null; }
        var kroky = {};
        Array.prototype.forEach.call(f.querySelectorAll(".lcd1v-krok"), function (k) {
          var m = /lcd1v-k-([a-z0-9]+)/.exec(k.className);
          if (!m) return;
          var pod = k.querySelector(":scope > .lcd1v-pod");
          var info = pod && pod.querySelector("button");
          kroky[m[1]] = { ey: txt(k, ".lcd1v-ey"), nm: txt(k, ".lcd1v-nm"), ti: txt(k, ".lcd1v-ti"), vy: txt(k, ".lcd1v-vy"),
            pod: pod ? Array.prototype.filter.call(pod.childNodes, function (n) { return n !== info; }).map(function (n) { return n.textContent; }).join("").replace(/\\s+/g, " ").trim() : null,
            chyba: txt(k, ":scope > .lcd1v-chyba-tx") };
        });
        var vzory = {};
        Array.prototype.forEach.call(f.querySelectorAll(".lcd1v-k-vzor .patterns-wrap > [class*='lcd1v-vzor-']"), function (a) {
          var m = /lcd1v-vzor-(diamond|stripe|hexa)/.exec(a.className);
          vzory[m[1]] = getComputedStyle(a, "::before").backgroundImage;
        });
        var kontroluj = Array.prototype.map.call(document.querySelectorAll("#product-detail-form [class*='lcd1v-'], #product-detail-form [class*='rz-']"), function (e) {
          return e.closest("h1") ? "" : Array.prototype.map.call(e.childNodes, function (n) { return n.nodeType === 3 ? n.nodeValue : ""; }).join(" ");
        }).join(" ").replace(/\\s+/g, " ");
        var h1 = document.querySelector("h1");
        var kuf = f.querySelector(".lcd1v-kb__vysv");
        return { kroky: kroky, vzory: vzory, typ: txt(document, ".lcd1v-typ"), postup: txt(f, ".lcd1v-postup-t") || txt(document, ".lcd1v-postup-t"), h1: h1 ? h1.innerText.replace(/\\s+/g, " ").trim() : "", kufVysv: kuf ? kuf.textContent.replace(/\\s+/g, " ").trim() : null, text: kontroluj,
          pocetFarieb: window.__lcd1v.moznosti("farba").length };
      })()`);
      const K = r.kroky;
      over(Object.keys(K).join(",") === "vzor,auto,farba,farba2,rozlozenie,kufor,boxy", "karty krokov: " + Object.keys(K).join(","));
      const pocetF = r.pocetFarieb;
      const farbyNaVyber = (n) => n + (n === 1 ? " farba" : n >= 2 && n <= 4 ? " farby" : " farieb") + " na výber";
      over(K.vzor.nm === "Vzor prešívania" && K.vzor.ti === "Prosím, vyberte vzor prešívania" && K.vzor.ey === "Krok 1 z 7", "krok 1: " + JSON.stringify(K.vzor));
      over(K.vzor.pod === "Vzor je na prvej prešívanej vrstve — vidno ho po bokoch aj okolo druhej vrstvy.", "krok 1 podnadpis: „" + K.vzor.pod + "“ (veta o rovnakej cene sa nepíše)");
      over(K.farba.nm === "Farba 1. vrstvy" && K.farba.ti === "Prosím, vyberte farbu prvej prešívanej vrstvy" && K.farba.ey === "Krok 3 z 7", "krok 3: " + JSON.stringify(K.farba));
      over(K.farba.pod === "Prvá vrstva je prešívaný koberec. Po výbere uvidíte materiál zblízka." && K.farba.chyba === "Vyberte, prosím, farbu prvej prešívanej vrstvy.", "krok 3 texty: " + JSON.stringify(K.farba));
      over(K.farba.vy === farbyNaVyber(pocetF) && pocetF > 0, `krok 3 zhrnutie „${K.farba.vy}“ ≠ „${farbyNaVyber(pocetF)}“ (farieb ${pocetF})`);
      over(K.farba2.nm === "Farba 2. vrstvy" && K.farba2.ti === "Prosím, vyberte farbu druhej vrstvy" && K.farba2.ey === "Krok 4 z 7" && K.farba2.chyba === "Vyberte, prosím, farbu druhej vrstvy.", "krok 4: " + JSON.stringify(K.farba2));
      over(K.rozlozenie.ey === "Krok 5 z 7" && K.kufor.ey === "Krok 6 z 7" && K.boxy.ey === "Krok 7 z 7", "číslovanie krokov 5–7: " + [K.rozlozenie.ey, K.kufor.ey, K.boxy.ey].join(" | "));
      over(r.postup === "Váš set v 7 krokoch", "postup: " + r.postup);
      over(r.typ === "Dvojvrstvové", "štítok nad názvom: " + r.typ);
      const o = { diamond: "dvoj-vzor-diamond.jpg", stripe: "dvoj-vzor-stripe.jpg", hexa: "dvoj-vzor-hexa.jpg" };
      Object.keys(o).forEach((k) => over(r.vzory[k] && r.vzory[k].includes("/assets/img/1v/" + o[k]), "fotka vzoru " + k + ": " + r.vzory[k]));
      over(r.kufVysv && /Classic chráni dno batožinového priestoru\./.test(r.kufVysv) && /Premium kryje dno, boky kufra aj chrbty zadných sedadiel/.test(r.kufVysv), "vysvetlenie kroku Rohož do kufra: " + r.kufVysv);
      // živý H1 sa nemení (SEO, kontrakt §2.3) — ak ukazuje názov materiálu, len upozornenie pre integrátora (nie zlyhanie)
      if (/dragonskin|elite|basic/i.test(r.h1)) s.upozornenia.push("živý H1 ostáva v DOM aj vizuálne: „" + r.h1 + "“ (typ dvoj: názov materiálu v nadpise; rovnako 598 „Basic“ — rozhodnutie o H1 patrí do jadra)");
      over(r.text.length > 800, "kontrola zakázaných výrazov: prečítaný text nového vzhľadu je podozrivo krátky (" + r.text.length + " znakov)");
      const zakazane = /rovnak[úu] cenu|na milimeter|vyr[áa]bame|comfort|fixa[čc]n|z[áa]ruk|dragonskin|\belite\b|\bbasic\b|\b(5|päť)\s*vrstiev|päťvrstv|5-vrstv/i.exec(r.text);
      over(!zakazane, "v novom texte je zakázaný výraz „" + (zakazane && zakazane[0]) + "“");
      if (a.snimky) {
        await otvorKartu(t, "vzor");
        await snimkaKroku(s, a, "otvoreny", "vzor");
      }
      return { info: `karty 1/3/4 ${[K.vzor.ey, K.farba.ey, K.farba2.ey].join(", ")}, postup „${r.postup}“, štítok „${r.typ}“, fotky vzorov dvoj-vzor-*, vysvetlenie Classic/Premium, farby 1. vrstvy „${K.farba.vy}“, zakázané výrazy nenájdené` };
    },
  },

  /**
   * Odporúčanie sa riadi farbou 1. vrstvy: pre farby kože béžová / hnedá (káva) / vínová (červená) / šedá / čierna a ďalšie
   * vyskúša zvolenú farbu, otvorí krok 4 a skontroluje, že „Odporúčame“ má presne jednu jednofarebnú Lux (10/11/12/13/16)
   * v tóne kože a že sa nič nepredvolilo (Hexa 604 má len 3 čierne farby -> vždy Lux 10).
   */
  "farba2-odporucanie": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.farba2 !== "novy") return { preskoc: "štítok Odporúčame existuje len v novom vzhľade (--novy / --vyvoj)" };
      const t = s.t, over = j.over;
      await j.otvor(s, a.url, { novy: true });
      await ovl.kroky.vyberAuto(t, j.AUTO);
      // farby 1. vrstvy v živom poradí dlaždíc: { index, value, text, ocak }
      const farby = (await t.ev(`(function () {
        var m = window.__lcd1v.moznosti("farba");
        return Array.prototype.map.call(document.querySelectorAll("#product-detail-form .lcd1v-k-farba > .options-wrap > .option-button"), function (b, i) {
          var o = m.find(function (x) { return x.hodnota === b.getAttribute("data-value"); });
          return { index: i, value: b.getAttribute("data-value"), text: o ? o.text : "" };
        });
      })()`)).map((f) => ({ ...f, ocak: ocakavanaLux(f.text) }));
      over(farby.length >= 3, "farieb 1. vrstvy " + farby.length);
      // po jednej farbe pre každú očakávanú Lux, ktorú produkt má (aspoň 10), najviac 5 farieb
      const vyber = [];
      for (const lux of [12, 11, 13, 16, 10]) { const f = farby.find((x) => x.ocak === lux); if (f) vyber.push(f); }
      over(vyber.some((f) => f.ocak === 10), "produkt nemá farbu 1. vrstvy s odporúčaním Lux 10");
      const info = [];
      for (const f of vyber) {
        await ovl.kroky.vyberFarbu(t, { index: f.index });
        await ovl.farba2.otvor(t);
        await t.pauza(300);
        const st = await ovl.farba2.stav(t);
        const odp = st.vzorky.filter((x) => x.odporucana);
        over(odp.length === 1 && odp[0].lux === f.ocak, `farba 1. vrstvy „${f.text.replace(/\s+/g, " ")}“: odporúčaná Lux ${odp.map((x) => x.lux).join(",") || "žiadna"} ≠ ${f.ocak}`);
        over(st.odporucame && st.odporucame.text === `Lux Color ${f.ocak} — ${POPISY[f.ocak]}`, "štítok: " + JSON.stringify(st.odporucame));
        over(!st.vzorky.some((x) => x.aktivna) && !(await t.ev(`window.__lcd1v.precitaj("farba2")`)), "po zmene farby 1. vrstvy sa predvolila farba 2. vrstvy");
        info.push(`${f.text.replace(/^.*kože\s*:?\s*/i, "").replace(/\s+/g, " ").trim()} -> Lux ${f.ocak}`);
      }
      return { info: info.join("; ") };
    },
  },
};
