// Scenáre z revízie prototypu (29. 10. 2026, nálezy R1–R7 + rýchla platba): S21–S27. Každý stráži jednu vlastnosť
// „objednávka = to, čo zákazník vidí“ (kniha OPC § 5 Riziká, § 6.5, § 6.9, § 6.10 bod 4) alebo fail-closed správanie.
// Spoločná kontrola zhody súhrnu a platby v session pri Step2Validate je v krok2-pomoc.mjs objednaj().
// Údaje zákazníka sú vymyslené, odoslanie ide len do podvrhu (tools/test-opc/podvrh.mjs).
import {
  KOSIK, KROK1, KROK2, ID, celkomZFixture, stavOpc, cakajOpc, naKrok2, zvolPlatbu, vyplnUdaje, suhlas, objednaj,
  overTeloObjednavky, step1Xhr, over, pauza, OPC,
} from "./krok2-pomoc.mjs";

/** Text pri tlačidle „Objednať“ (čakanie, hláška po zrušenom odoslaní), prázdne = skrytý. */
const cakamText = (s) => s.ev(`(function () { var e = document.querySelector(".lcd-opc-cakam"); return e && !e.hidden ? e.textContent.replace(/\\s+/g, " ").trim() : ""; })()`);

export const SCENARE = {
  S21: {
    popis: "Dobierka a do 300 ms späť na prevod: súhrn, lišta aj zbalený súhrn ukazujú prevod a jeho sumu, ďalší prepočet sedí (R1)",
    async fn(J) {
      const s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      const pred = await stavOpc(s);
      s.p.reset();
      await s.ev(`(function () {
        document.querySelector('#lcd-opc label[for="billingId-${id.dobierka}"]').click();
        setTimeout(function () { document.querySelector('#lcd-opc label[for="billingId-${id.prevod}"]').click(); }, 100);
        return 1;
      })()`);
      await pauza(1500);
      const st = await stavOpc(s);
      const ocak = celkomZFixture(s.web, id.prevod);
      over(st.stav === "krok2-potvrdene" && st.platbaUI === id.prevod && s.p.stav.platba !== id.dobierka, "stav po návrate: " + JSON.stringify(st));
      over(st.celkom === ocak, "Celkom k úhrade po návrate " + st.celkom + " ≠ " + ocak);
      over(st.platbaSuhrn === pred.platbaSuhrn, "súhrn po návrate ukazuje „" + st.platbaSuhrn + "“, pred zmenou „" + pred.platbaSuhrn + "“");
      if (s.mobil) over(st.lista === ocak && st.zbalene === ocak, "lišta / zbalený súhrn po návrate: " + st.lista + " / " + st.zbalene);
      over(!st.prepocet && st.aria !== "true", "po návrate ostalo prepočítavanie / zablokované tlačidlo: " + JSON.stringify(st));
      over(step1Xhr(s).length === 0, "návrat v rámci debounce poslal Step1Validate: " + JSON.stringify(step1Xhr(s).map((x) => x.telo)));
      // ďalšia zmena ráta zo súhrnu, ktorý je naozaj na stránke (lokálny prepočet hneď po kliku)
      await zvolPlatbu(s, id.dobierka);
      const hned = await stavOpc(s);
      const ocakDob = celkomZFixture(s.web, id.dobierka);
      over(hned.celkom === ocakDob, "lokálny prepočet dobierky po návrate " + hned.celkom + " ≠ " + ocakDob);
      const st2 = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st2.stav === "krok2-potvrdene" && st2.celkom === ocakDob, "dobierka po návrate: " + JSON.stringify(st2));
      await vyplnUdaje(s);
      await suhlas(s);
      const z2 = await objednaj(s);
      over(z2[0].platba === id.dobierka, "objednávka s platbou " + z2[0].platba);
      return { step2: true, info: "návrat bez požiadavky: " + st.platbaSuhrn + " " + st.celkom + ", potom dobierka " + st2.celkom + " -> objednávka s dobierkou" };
    },
  },
  S22: {
    popis: "Zmena a návrat počas letu Step1Validate, potvrdenie súhrnu zlyhá: objednávka neodíde s inou platbou, po overení odíde s tou zo súhrnu (R2)",
    async fn(J) {
      const s = await J.novaStranka({ scenar: { step1: "pomaly" } });
      const id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.suhrn = "500"; // step2CustomerAjax aj fetch kroku 2 odteraz zlyhajú
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      await pauza(600); // debounce 300 ms -> Step1Validate(dobierka) letí, server odpovie po 1,5 s
      await zvolPlatbu(s, id.prevod);
      await pauza(4500);
      const st = await stavOpc(s);
      await objednaj(s, { n: 0, ms: 2000 });
      over(s.p.zaznam.step2.length === 0, "objednávka odišla bez overenej platby (session " + s.p.stav.platba + ", súhrn „" + st.platbaSuhrn + "“, stav " + st.stav + ")");
      const h = await cakamText(s);
      over(/neodišla|neodešla/.test(h), "pri tlačidle chýba hláška, že objednávka neodišla: " + JSON.stringify(h));
      // server znova odpovedá: klik overí platbu (neodošle), ďalší klik odošle to, čo súhrn ukazuje
      s.p.scenar.suhrn = null;
      await objednaj(s, { n: 0, ms: 2500 });
      over(s.p.zaznam.step2.length === 0, "overenie platby po kliku samo odoslalo objednávku");
      const st2 = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st2.stav === "krok2-potvrdene", "po obnove servera sa platba neoverila: " + JSON.stringify(st2));
      const z2 = await objednaj(s);
      overTeloObjednavky(s, z2[0]);
      return { step2: true, info: "Step1Validate " + step1Xhr(s).map((x) => x.pole.billingId).join(" -> ") + ", pri neoverenej platbe nič neodišlo, potom objednávka s " + z2[0].platba };
    },
  },
  S23: {
    popis: "Klik Objednať počas zmeny platby, ktorá zlyhá, alebo keď zákazník medzitým zvolí inú: objednávka sa sama neodošle (R7)",
    async fn(J) {
      const web = J.web, id = ID[web];
      // a) zmena na dobierku zlyhá (500 aj automatický pokus)
      let s = await J.novaStranka({ scenar: { step1: (n, o) => (o.billingId === id.dobierka ? "500" : "ok") } });
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      await s.klikni("#submit-order", { popis: "Objednať počas zmeny" });
      await pauza(3500);
      let st = await stavOpc(s);
      const h = await cakamText(s);
      over(s.p.zaznam.step2.length === 0, "objednávka odišla sama po zlyhanej zmene platby (session " + s.p.stav.platba + ")");
      over(st.stav === "krok2-chyba" && st.platbaUI === id.prevod, "po zlyhanej zmene: " + JSON.stringify(st));
      over(/neodišla|neodešla/.test(h), "pri tlačidle chýba hláška, že objednávka neodišla: " + JSON.stringify(h));
      let z = await objednaj(s);
      over(z[0].platba === id.prevod, "objednávka s platbou " + z[0].platba);
      // b) počas čakania zvolí kartu -> odklad sa zruší, odošle až ďalší klik
      s = await J.novaStranka({ scenar: { step1: "pomaly" } });
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      await s.klikni("#submit-order", { popis: "Objednať počas zmeny" });
      await pauza(200);
      await zvolPlatbu(s, id.karta);
      await pauza(5000);
      over(s.p.zaznam.step2.length === 0, "objednávka odišla bez ďalšieho kliku po zmene platby počas čakania (s " + (s.p.zaznam.step2[0] || {}).platba + ")");
      st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.karta, "karta sa nepotvrdila: " + JSON.stringify(st));
      z = await objednaj(s);
      over(z[0].platba === id.karta, "objednávka s platbou " + z[0].platba);
      return { step2: true, info: "zlyhaná dobierka: neodišlo, hláška „" + h.slice(0, 50) + "…“; zmena počas čakania: neodišlo, ďalší klik s kartou" };
    },
  },
  S24: {
    len: "sk",
    popis: "Kamión bez truckOrderSummary (iná karta / iné zariadenie): rozpis v súhrne (DOM, z neho je aj zbalený súhrn) ostane ako bez OPC, aj počas a po zmene platby (R3); v krátkej rekapitulácii dizajnu A je skrytý",
    async fn(J) {
      const riadky = `Array.prototype.map.call(document.querySelectorAll("#summary-box .cart-items .cart-item"), function (e) {
        return e.innerText.split("\\n").map(function (x) { return x.trim(); }).filter(Boolean); })`;
      // rozpis v DOM súhrnu tak, ako by ho vykreslila stránka bez OPC: dizajn A ho v rekapitulácii len skrýva (CSS pod
      // html.lcd-opc), cart.js ho musí nechať celý — preto čítanie na chvíľu bez triedy lcd-opc (synchrónne, bez prekreslenia)
      // Od zobáčika (S42, 29. 10. 2026) je rozpis v karte detailu pod položkou (presunutý, predvolene [hidden]): na čítanie
      // sa karta na chvíľu odkryje a zobáčik sa nepočíta (nie je rozpis cart.js); karta je od náhľadu 5 (30. 10. 2026) len rozpis
      const riadkyDom = `(function () { var H = document.documentElement; H.classList.remove("lcd-opc");
        var skryte = [], dalsie = [];
        document.querySelectorAll("#summary-box .lcd-opc-detail[hidden]").forEach(function (d) { d.hidden = false; skryte.push(d); });
        document.querySelectorAll("#summary-box .lcd-opc-zob").forEach(function (e) {
          dalsie.push([e, e.style.display]); e.style.display = "none"; });
        try { return ${riadky}; } finally {
          H.classList.add("lcd-opc"); skryte.forEach(function (d) { d.hidden = true; }); dalsie.forEach(function (x) { x[0].style.display = x[1]; }); } })()`;
      // vozidlo zo sessionStorage (konfigurátor kamiónov 1V ho zapíše aj bez truckOrderSummary — napr. dva kamióny v košíku):
      // riadok „Vozidlo: …“ (ul.model, natívne v kroku 2 .id--17 .model 12 px !important) — N3
      const VOZIDLO = "Volvo FH 4 (2013+)";
      const skript = "try { sessionStorage.setItem('truckVehicle', " + JSON.stringify(VOZIDLO) + "); } catch (e) {}";
      const a = await J.novaStranka({ kosik: "kamion", scenar: { zaciatok: "krok2" }, skript, bezOpc: true });
      await a.chod(KROK2, { popis: "krok 2 bez OPC" });
      const bez = await a.ev(riadky);
      // vzhľad riadkov rozpisu bez OPC (ako v košíku: tmavé písmo Exo 2 zdedené z a.main-link) — vzor pre rozbalený detail
      const VZHLAD = `(function (sel) { var e = document.querySelector(sel); if (!e) return null; var c = getComputedStyle(e);
        return { farba: c.color, rodina: c.fontFamily.split(",")[0].trim() }; })`;
      const vzor = await a.ev(VZHLAD + `("#summary-box .info-wrap .setup li")`);
      await a.zavri();
      over(vzor && vzor.farba === "rgb(20, 17, 12)", "bez OPC: riadok rozpisu kamióna nie je tmavý ako v košíku: " + JSON.stringify(vzor));
      over(bez.length === 1 && bez[0].length > 5, "bez OPC chýba rozpis kamióna: " + JSON.stringify(bez));
      over(bez[0].some((x) => x.includes(VOZIDLO)), "bez OPC chýba riadok vozidla zo sessionStorage: " + JSON.stringify(bez[0].slice(0, 4)));
      const s = await J.novaStranka({ kosik: "kamion", scenar: { zaciatok: "krok2" }, skript });
      await s.chod(KROK2 + OPC, { popis: "krok 2 s OPC" });
      const st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      over(st.stav === "krok2-potvrdene", "sekcia sa nepostavila: " + st.stav);
      await s.odmietniCookies(); // podvrh súhlas s cookies neuchová -> lišta je na kroku 2 znova (ako v naKrok2)
      // K1-3 (revízia 30. 10. 2026): na pomalom zariadení / pri data.json z keše dobehne náš rozpis skôr, než checkout-3g
      // Shoptetu vloží do #summary-box #shipping-billing-summary (setActiveShippingAndPayments). Pozorovateľ súhrnu vtedy
      // nesmie spustiť rozpis cart.js druhýkrát — nad už spracovaným kamiónom ho vymaže (0 riadkov natrvalo). Deterministicky:
      // ten istý prvok sa vloží znova na to isté miesto (záznam mutácie ako pri vložení Shoptetom), nie čakanie na náhodu.
      const vlozene = await s.ev(`(function () { var b = document.getElementById("summary-box"), p = b && b.querySelector(":scope > .order-summary-item.price");
        if (!p) return "bez .order-summary-item.price";
        var x = b.querySelector(":scope > .order-recapitulation") || document.createElement("div");
        if (!x.parentNode) x.className = "order-recapitulation";
        b.insertBefore(x, p); return x.id || x.className; })()`);
      await pauza(150);
      const s1 = await s.ev(riadkyDom);
      const vidno = await s.ev(riadky);
      // názov, „1 ks“, cena a zbalený zobáčik „Zobraziť detail“ (S42) — rozpis je v zbalenej karte
      const bezZobacika = vidno.length === 1 ? vidno[0].filter((x) => x !== "Zobraziť detail") : [];
      over(vidno.length === 1 && bezZobacika.length <= 3 && vidno[0].includes("Zobraziť detail"), "v krátkej rekapitulácii je rozpísaný kamión: " + JSON.stringify(vidno));
      await zvolPlatbu(s, ID.sk.dobierka);
      await pauza(100);
      const s2 = await s.ev(riadkyDom);
      const st2 = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      await pauza(300);
      const s3 = await s.ev(riadkyDom);
      for (const [kedy, x] of [["po načítaní a vložení súhrnu dopravy Shoptetom (" + vlozene + ")", s1], ["počas zmeny platby", s2], ["po zmene platby", s3]]) {
        over(x.length === 1 && x[0].length === bez[0].length, "rozpis kamióna " + kedy + ": " + (x[0] || []).length + " riadkov, bez OPC " + bez[0].length + " — " + JSON.stringify((x[0] || []).slice(0, 3)));
      }
      over(st2.stav === "krok2-potvrdene", "dobierka pri kamióne: " + st2.stav);
      // rozbalený detail = rekapitulácia z košíka bez prestylovania (náhľad 5): písmo podľa mierky LCD aj pri rozpise bez súhrnu
      // kamióna (.info-wrap; natívne v kroku 2 .id--17 .model 12 px, v košíku .removeable .info-wrap 15 px)
      await s.klikni("#summary-box .lcd-opc-zob", { popis: "zobáčik kamióna" });
      await pauza(250);
      const male = await s.ev(`(function () { var d = document.querySelector("#summary-box .lcd-opc-detail"); if (!d || d.hidden) return ["detail sa nerozbalil"];
        return Array.prototype.filter.call(d.querySelectorAll("*"), function (e) { return e.getBoundingClientRect().height > 0 && Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); }); })
          .filter(function (e) { return parseFloat(getComputedStyle(e).fontSize) < 14; })
          .map(function (e) { return e.tagName.toLowerCase() + " " + getComputedStyle(e).fontSize + " „" + e.textContent.replace(/\\s+/g, " ").trim().slice(0, 30) + "“"; }); })()`);
      over(!male.length, "rozpis kamióna bez súhrnu v rozbalenom detaile má písmo pod 14 px: " + male.join("; "));
      // R1-3 (revízia 30. 10. 2026): v detaile rovnaká farba a písmo ako v košíku / pokladni (span presunutý z a.main-link
      // by inak zdedil sivú a Source Sans 3 zo súhrnu)
      const vDetaile = await s.ev(VZHLAD + `("#summary-box .lcd-opc-detail .info-wrap .setup li")`);
      over(vDetaile && vDetaile.farba === vzor.farba && vDetaile.rodina === vzor.rodina,
        "rozpis kamióna bez súhrnu v rozbalenom detaile nevyzerá ako v košíku (farba, písmo): detail " + JSON.stringify(vDetaile) + ", bez OPC " + JSON.stringify(vzor));
      // zbalený súhrn (telefón): rozpis kópie normálnym písmom 14 px ako v súhrne, nie tučne 15 px po názve (revízia vzhľadu) —
      // KAŽDÝ riadok vrátane „Vozidlo: …“ (N3: .id--17 .model 12 px !important prebíjal zdedených 14 px)
      const kopia = await s.ev(`Array.prototype.map.call(document.querySelectorAll("#lcd-opc-zbalene .lcd-opc-kopia-priplatky li"), function (e) {
        var c = getComputedStyle(e); return { pismo: c.fontWeight + " " + c.fontSize, text: e.textContent.replace(/\\s+/g, " ").trim() }; })`);
      const pismo = kopia.length ? kopia[0].pismo : null;
      const vDetaileLi = await s.ev(`document.querySelectorAll("#summary-box .lcd-opc-detail .info-wrap li").length`);
      over(kopia.length > 5 && kopia.length === vDetaileLi, "rozpis kamióna v zbalenom súhrne má " + kopia.length + " riadkov, v detaile " + vDetaileLi);
      over(kopia.some((x) => x.text.includes(VOZIDLO)), "v zbalenom súhrne chýba riadok vozidla: " + JSON.stringify(kopia.slice(0, 3)));
      const zlePismo = kopia.filter((x) => x.pismo !== "400 14px");
      over(!zlePismo.length, "rozpis kamióna v zbalenom súhrne nemá všade 400 14px: " + JSON.stringify(zlePismo));
      return { info: "rozpis kamióna " + bez[0].length + " riadkov bez OPC aj s OPC v DOM (načítanie, zmena, po zmene), v rekapitulácii " + vidno[0].length + " riadky, v zbalenom súhrne " + pismo };
    },
  },
  S25: {
    popis: "GET krok 1 na pozadí visí (zaseknutá sieť): košík po limite ide na klasický krok 1, krok 2 prejde do záchrany (R5, R6)",
    async fn(J) {
      let s = await J.novaStranka({ scenar: { krok1: "visi" } });
      await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC" });
      await s.odmietniCookies();
      s.p.reset();
      const t0 = Date.now();
      await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
      await s.cakajNaStranku(KROK1, "in-krok-1", { ms: 12000 });
      const ms = Date.now() - t0;
      over(s.p.zaznam.step1.length === 0, "z košíka odišiel Step1Validate: " + JSON.stringify(s.p.zaznam.step1.map((x) => x.telo)));
      await s.zavri();
      s = await J.novaStranka({ scenar: { zaciatok: "krok2", krok1: "visi" } });
      const t1 = Date.now();
      await s.chod(KROK2 + OPC, { popis: "krok 2 s kódom OPC" });
      const st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 s visiacim krokom 1");
      const ms2 = Date.now() - t1;
      over(st.stav === "krok2-zachrana", "krok 2: stav " + st.stav);
      over(await s.viditelne("a.lcd-opc-zmenit"), "záchrana bez odkazu „Zmeniť dopravu alebo platbu“");
      over(!(await s.ev(`!!document.querySelector(".lcd-opc-nacitavam")`)), "ostalo „Načítavam dopravu a platbu…“");
      return { info: "košík -> klasický krok 1 za " + ms + " ms | krok 2 -> záchrana za " + ms2 + " ms" };
    },
  },
  S26: {
    popis: "Dvojklik na Objednať = 1× Step2Validate; zámok po úspešnej validácii nezahodí klik potichu a po neúspešnej (telefón) pustí ďalší (R4)",
    async fn(J) {
      // a) dvojklik
      let s = await J.novaStranka();
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      const b = await s.klikni("#submit-order", { popis: "Objednať" });
      await pauza(60);
      try { if (s.mobil) await s.k.tuk(b.x, b.y); else await s.k.klik(b.x, b.y); } catch (e) { /* stránka už odchádza */ }
      await pauza(2500);
      over(s.p.zaznam.step2.length === 1, "dvojklik: Step2Validate " + s.p.zaznam.step2.length + "×");
      await s.zavri();
      // b) validácia prešla, formulár čakal na overenie telefónu, potom validácia neprešla -> ďalší klik odošle
      s = await J.novaStranka();
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await s.ev(`(function () { var f = document.getElementById("order-form");
        f.dispatchEvent(new CustomEvent("ShoptetSuccessfulValidation", { bubbles: true }));
        f.dispatchEvent(new CustomEvent("ShoptetFailedValidation", { bubbles: true })); return 1; })()`);
      await pauza(200);
      const z = await objednaj(s, { ms: 4000 });
      overTeloObjednavky(s, z[0]);
      await s.zavri();
      // c) validácia prešla a formulár neodišiel (iný doplnok ho zadržal): klik do 5 s neodošle, ale nie potichu
      s = await J.novaStranka();
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await s.ev(`(function () { document.getElementById("order-form").dispatchEvent(new CustomEvent("ShoptetSuccessfulValidation", { bubbles: true })); return 1; })()`);
      await pauza(200);
      await objednaj(s, { n: 0, ms: 600 });
      const h = await cakamText(s);
      over(s.p.zaznam.step2.length === 0, "klik v zámku odoslal objednávku");
      over(h.length > 0, "klik v zámku zahodený potichu (bez hlášky)");
      return { step2: true, info: "dvojklik 1× Step2Validate; po neúspešnej validácii klik prešiel; v zámku hláška „" + h + "“" };
    },
  },
  S27: {
    len: "sk",
    popis: "Session má rýchlu platbu cez banku (112, banka sa vyberá len na kroku 1): Pokračovať ide na klasický krok 1 bez Step1Validate",
    async fn(J) {
      const s = await J.novaStranka({ scenar: { platba: "112" } });
      await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC" });
      await s.cakaj(`window.__lcdOpc && /^kosik-(pripraveny|bez-krok1)$/.test(window.__lcdOpc.stav)`, { ms: 10000, popis: "modul OPC na košíku" });
      await s.odmietniCookies();
      s.p.reset();
      await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
      await s.cakajNaStranku(KROK1, "in-krok-1");
      const x = s.p.zaznam.step1.filter((y) => y.xhr);
      over(x.length === 0, "Step1Validate s rýchlou platbou bez banky: " + JSON.stringify(x.map((y) => y.telo)));
      over(await s.ev(`(document.querySelector('input[name="billingId"]:checked') || {}).value === "112"`), "na kroku 1 nie je zvolená rýchla platba");
      return { info: "112 v session -> klasický krok 1 (výber banky), bez Step1Validate" };
    },
  },
};
