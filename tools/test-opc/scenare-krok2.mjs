// Scenáre jednostránkovej pokladne na kroku 2 (kniha OPC § 7.6): S1, S3–S7, S11, S13–S16, S18, S19.
// Každý scenár dostane J (tools/test-opc.mjs), vráti { info, step2 } alebo hodí Zlyhanie. step2: true = scenár čaká
// zachytený Step2Validate (podvrh ho zachytí a odpovie fiktívnou stránkou, do Shoptetu neodíde nič).
import {
  KOSIK, KROK1, KROK2, ID, celkomZFixture, stavOpc, cakajOpc, naKrok2, zvolPlatbu, vyplnUdaje, suhlas, objednaj,
  overTeloObjednavky, poleTela, step1Xhr, over, pauza, OPC,
} from "./krok2-pomoc.mjs";

const TLACIDLO = { sk: "Objednať s povinnosťou platby", cz: "Objednat s povinností platby" };

export const SCENARE = {
  S1: {
    popis: "Vzorkovník, predvolené voľby, vymyslené údaje, Objednať -> 1 natívny Step2Validate, pred ním Step1Validate z košíka",
    async fn(J) {
      const s = await J.novaStranka();
      const id = ID[s.web];
      await s.chod(KOSIK + OPC, { popis: "košík" });
      await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "kosik-pripraveny"`, { popis: "modul OPC na košíku" });
      await s.odmietniCookies();
      s.p.reset();
      await s.klikni("#continue-order-button", { popis: "Pokračovať" });
      await s.cakajNaStranku(KROK2, "in-krok-2");
      const st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await s.odmietniCookies(); // podvrh súhlas s cookies neukladá -> lišta je na kroku 2 znova
      over(st.stav === "krok2-potvrdene", "sekcia Doprava a platba sa nezobrazila: " + JSON.stringify(st));
      over(st.dopravaUI === id.doprava && st.platbaUI === id.prevod, "predvolené voľby v sekcii " + st.dopravaUI + "/" + st.platbaUI);
      const z1 = s.p.zaznam.step1.slice();
      over(z1.length === 1 && z1[0].xhr && z1[0].pole.shippingId === id.doprava && z1[0].pole.billingId === id.prevod, "pred objednávkou nebol 1 Step1Validate " + id.doprava + "/" + id.prevod + ": " + JSON.stringify(z1.map((x) => x.telo)));
      await vyplnUdaje(s);
      await suhlas(s);
      const pred = s.p.zaznam.step1.length;
      const z2 = await objednaj(s);
      await s.cakaj(`document.body && document.body.classList.contains("lcd-opc-test-objednavka")`, { popis: "stránka po objednávke (TEST)" });
      over(z2.length === 1, "Step2Validate " + z2.length + "×");
      overTeloObjednavky(s, z2[0]);
      over(z2[0].platba === id.prevod, "session pri objednávke má platbu " + z2[0].platba);
      // pri odoslaní práve 1 Step1Validate navyše: resync so zobrazenou voľbou (živý dôkaz T5b), potom Step2Validate
      const resync = s.p.zaznam.step1.slice(pred);
      over(resync.length === 1 && resync[0].xhr && resync[0].pole.billingId === id.prevod && resync[0].cas < z2[0].cas, "pri odoslaní nie je 1 resync Step1Validate s prevodom: " + JSON.stringify(resync.map((x) => x.telo)));
      over(st.udalosti.includes("lcd_opc_zobrazenie"), "dataLayer bez lcd_opc_zobrazenie");
      return { step2: true, info: "Step1Validate " + z1[0].telo + " -> krok 2 -> 1× Step2Validate (" + z2[0].pole.length + " polí, platba v session " + z2[0].platba + ")" };
    },
  },
  S3: {
    popis: "Zmena na dobierku: „+ záloha“ a poučenie viditeľné, Step1Validate s dobierkou, súhrn a celkom zo servera",
    async fn(J) {
      const s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      const hned = await stavOpc(s);
      over(hned.stav === "krok2-meni-sa" || hned.stav === "krok2-potvrdene", "po kliku stav " + hned.stav);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene", "dobierka sa nepotvrdila: " + JSON.stringify(st));
      const x = step1Xhr(s);
      over(x.length === 1 && x[0].pole.billingId === id.dobierka && x[0].pole.shippingId === id.doprava && x[0].pole.language === s.W.jazyk, "Step1Validate: " + JSON.stringify(x.map((y) => y.telo)));
      const ocak = celkomZFixture(s.web, id.dobierka);
      over(st.celkom === ocak, "Celkom k úhrade " + st.celkom + " ≠ " + ocak);
      over(/Dobier|Dobír/.test(st.platbaSuhrn || ""), "súhrn ukazuje platbu " + st.platbaSuhrn);
      over(!st.prepocet && st.aria !== "true", "po potvrdení ostalo prepočítavanie / zablokované tlačidlo: " + JSON.stringify(st));
      const vid = await s.ev(`(function () {
        var l = document.querySelector('#lcd-opc input[value="${id.dobierka}"] + label');
        var v = function (sel) { var e = l && l.querySelector(sel); if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
        return { zaloha: v(".lcd-dob-pozn"), info: v(".lcd-opc-zaloha-info"), infoText: (l.querySelector(".lcd-opc-zaloha-info") || {}).textContent || "" };
      })()`);
      over(vid.zaloha, "„+ záloha“ nie je viditeľná pri zvolenej dobierke");
      over(vid.info, "poučenie o zálohe nie je viditeľné");
      // potvrdenie zo servera = GET kroku 1 na pozadí (živý dôkaz 29. 10.), nie step2CustomerAjax ani GET kroku 2 (459 kB)
      const naPozadi = (c) => s.p.zaznam.www.filter((z) => z.metoda === "GET" && z.cesta === c && z.typ !== "Document").length;
      over(s.p.zaznam.ajax.length === 0, "náš kód poslal step2CustomerAjax " + s.p.zaznam.ajax.length + "×");
      over(naPozadi(KROK1) === 1 && naPozadi(KROK2) === 0, "potvrdenie: GET krok 1 " + naPozadi(KROK1) + "×, GET krok 2 " + naPozadi(KROK2) + "× (čakal som 1 a 0)");
      if (s.mobil) over(st.lista === ocak && st.zbalene === ocak, "lišta / zbalený súhrn nesedia so súhrnom: " + st.lista + " / " + st.zbalene);
      over(st.udalosti.includes("lcd_opc_zmena_platby"), "dataLayer bez lcd_opc_zmena_platby");
      return { info: "Step1Validate " + x[0].telo + ", súhrn " + st.platbaSuhrn + ", celkom " + st.celkom + " (potvrdenie: GET krok 1 1×)" };
    },
  },
  S4: {
    popis: "Karta a späť na prevod (rýchle kliky v debounce): 2 požiadavky, tlačidlo zablokované až do potvrdenia",
    async fn(J) {
      const s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      s.p.reset();
      await zvolPlatbu(s, id.karta);
      const pocas = await stavOpc(s);
      over(pocas.aria === "true", "počas zmeny nie je „Objednať“ aria-disabled: " + JSON.stringify(pocas));
      let st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.karta, "karta sa nepotvrdila: " + JSON.stringify(st));
      over(st.aria !== "true", "po potvrdení ostalo tlačidlo zablokované");
      // Google Pay a hneď prevod (oba kliky v 300 ms): pošle sa len posledná voľba
      await s.ev(`(function () { document.querySelector('#lcd-opc label[for="billingId-${id.gpay}"]').click(); document.querySelector('#lcd-opc label[for="billingId-${id.prevod}"]').click(); })()`);
      st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      await pauza(500);
      st = await stavOpc(s);
      const x = step1Xhr(s).map((y) => y.pole.billingId);
      over(JSON.stringify(x) === JSON.stringify([id.karta, id.prevod]), "Step1Validate platby " + JSON.stringify(x) + " (čakal som karta, prevod)");
      over(st.stav === "krok2-potvrdene" && st.platbaUI === id.prevod && st.potvrdene.platba === id.prevod, "konečný stav: " + JSON.stringify(st));
      over(st.celkom === celkomZFixture(s.web, id.prevod), "celkom " + st.celkom);
      return { info: "Step1Validate " + x.join(" -> ") + ", tlačidlo zablokované len počas zmeny" };
    },
  },
  S5: {
    popis: "Step1Validate vráti 500: voľba sa vráti, hláška s odkazom na krok 1, objednať sa dá s pôvodnou platbou",
    async fn(J) {
      const web = J.web;
      const s = await J.novaStranka({ scenar: { step1: (n, o) => (o.billingId === ID[web].dobierka ? "500" : "ok") } });
      const id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-chyba", "po 500 stav " + st.stav);
      over(st.platbaUI === id.prevod && st.potvrdene.platba === id.prevod, "voľba sa nevrátila na prevod: " + JSON.stringify(st));
      over(st.hlaska && st.hlaskaOdkaz === KROK1, "hláška s odkazom na krok 1 chýba: " + JSON.stringify([st.hlaska, st.hlaskaOdkaz]));
      over(st.aria !== "true", "po chybe ostalo „Objednať“ zablokované");
      const x = step1Xhr(s);
      over(x.length >= 1 && x.length <= 2, "Step1Validate " + x.length + "× (1 + najviac 1 pokus)");
      over(st.celkom === celkomZFixture(s.web, id.prevod), "súhrn po chybe " + st.celkom);
      over(st.udalosti.includes("lcd_opc_chyba"), "dataLayer bez lcd_opc_chyba");
      const z2 = await objednaj(s);
      overTeloObjednavky(s, z2[0]);
      over(z2[0].platba === id.prevod, "objednávka s platbou " + z2[0].platba);
      return { step2: true, info: "500 × " + x.length + " -> " + st.hlaska.slice(0, 60) + "… -> objednávka s prevodom" };
    },
  },
  S6: {
    popis: "Klik Objednať počas zmeny platby (pomalý server): odoslanie počká na potvrdenie, potom 1× Step2Validate",
    async fn(J) {
      const s = await J.novaStranka({ scenar: { step1: "pomaly" } });
      const id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      await s.klikni("#submit-order", { popis: "Objednať (počas zmeny)" });
      const cakam = await s.ev(`(function () { var e = document.querySelector(".lcd-opc-cakam"); return e && !e.hidden ? e.textContent : ""; })()`);
      over(s.p.zaznam.step2.length === 0, "objednávka odišla pred potvrdením platby");
      over(/Čak|Ček/.test(cakam), "chýba „Čakám na potvrdenie platby…“: " + JSON.stringify(cakam));
      const z2 = await objednaj(s, { klik: false, ms: 10000 });
      await pauza(800);
      over(s.p.zaznam.step2.length === 1, "Step2Validate " + s.p.zaznam.step2.length + "×");
      const x = step1Xhr(s); // zmena na dobierku + resync pred odoslaním (zobrazená dobierka)
      over(x.length === 2 && x.every((y) => y.pole.billingId === id.dobierka) && x[1].odpovedCas && z2[0].cas >= x[1].odpovedCas, "Step1Validate " + JSON.stringify(x.map((y) => y.pole.billingId)) + " / Step2Validate predbehol potvrdenie platby");
      over(z2[0].platba === id.dobierka, "objednávka s platbou " + z2[0].platba + " (čakal som dobierku)");
      overTeloObjednavky(s, z2[0]);
      return { step2: true, info: "odoslanie čakalo " + (z2[0].cas - x[0].cas) + " ms, potom 1× Step2Validate s dobierkou" };
    },
  },
  S7: {
    popis: "GET krok 1 na kroku 2 zlyhá (500) alebo má zmenené HTML -> záchrana: dnešný krok 2 + odkaz na krok 1",
    async fn(J) {
      const casti = [];
      for (const [nazov, krok1] of [["krok 1 500", "500"], ["zmenené HTML kroku 1", "zmenene"]]) {
        const s = await J.novaStranka({ scenar: { zaciatok: "krok2", krok1 } });
        await s.chod(KROK2 + OPC, { popis: "krok 2 s kódom OPC (" + nazov + ")" });
        const st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
        over(st.stav === "krok2-zachrana", nazov + ": stav " + st.stav);
        const d = await s.ev(`(function () {
          var a = document.querySelector('a.lcd-opc-zmenit[href="${KROK1}"]');
          var r = a && a.getBoundingClientRect();
          return { sekcia: !!document.getElementById("lcd-opc"), odkaz: !!(r && r.width > 0), text: a ? a.textContent.trim() : "",
            kroky: document.querySelectorAll("ol.cart-header li.step:not([hidden])").length, spat: (document.querySelector(".next-step-back") || {}).getAttribute ? document.querySelector(".next-step-back").getAttribute("href") : null,
            tlacidlo: !!document.getElementById("submit-order") };
        })()`);
        over(!d.sekcia && d.odkaz && d.tlacidlo, nazov + ": záchrana nevyzerá ako dnešný krok 2: " + JSON.stringify(d));
        over(d.kroky === 3 && d.spat === KROK1, nazov + ": záchrana zmenila lištu krokov alebo Späť: " + JSON.stringify(d));
        over(st.udalosti.includes("lcd_opc_zachrana"), nazov + ": dataLayer bez lcd_opc_zachrana");
        casti.push(nazov + " -> „" + d.text + "“");
        await s.zavri();
      }
      return { info: casti.join(" | ") };
    },
  },
  S11: {
    popis: "Bez čísla domu: chyba Shoptetu pri poli, žiadny Step2Validate; po doplnení 1× Step2Validate",
    async fn(J) {
      const s = await J.novaStranka();
      await naKrok2(s);
      await vyplnUdaje(s, { bezCisla: true });
      await suhlas(s);
      s.p.reset();
      await objednaj(s, { n: 0, ms: 1500 });
      over(s.p.zaznam.step2.length === 0, "Step2Validate odišiel bez čísla domu");
      const chyba = await s.ev(`(function () {
        var e = document.getElementById("billHouseNumber"), g = e && e.closest(".form-group");
        return !!g && (/error|invalid/.test(g.className) || !!g.querySelector(".msg-error, .error-message, [class*=error]") || /error|invalid/.test(e.className));
      })()`);
      over(chyba, "pri čísle domu nie je chyba Shoptetu");
      await s.pis("#billHouseNumber", "1");
      const z2 = await objednaj(s);
      overTeloObjednavky(s, z2[0]);
      return { step2: true, info: "bez čísla domu nič neodišlo, po doplnení 1× Step2Validate" };
    },
  },
  S13: {
    popis: "Telefón: bez vodorovného posunu, lišta „Celkom | Objednať s povinnosťou platby“ na prázdnej stránke posunie na meno (nič neodíde), skryje sa pri tlačidle, Luxia neprekrýva; PC: dva stĺpce",
    async fn(J) {
      const s = await J.novaStranka();
      await naKrok2(s);
      const sirka = await s.ev(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
      over(sirka.sw <= sirka.iw + 1, "vodorovný posun: scrollWidth " + sirka.sw + " > " + sirka.iw);
      if (s.sirka >= 992) {
        const pc = await s.ev(`(function () {
          var v = function (sel) { var e = document.querySelector(sel); if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; };
          var l = document.getElementById("checkoutContent").getBoundingClientRect(), p = document.getElementById("checkoutSidebar").getBoundingClientRect();
          var o = document.getElementById("lcd-opc").getBoundingClientRect();
          return { lista: v(".lcd-opc-lista"), zbalene: v("#lcd-opc-zbalene"), stlpce: p.left >= l.right - 2, sekciaVlavo: o.left >= l.left - 1 && o.right <= l.right + 1 };
        })()`);
        over(!pc.lista && !pc.zbalene, "na PC je lišta alebo zbalený súhrn: " + JSON.stringify(pc));
        over(pc.stlpce && pc.sekciaVlavo, "na PC nie sú dva stĺpce so sekciou vľavo: " + JSON.stringify(pc));
        return { info: "PC: dva stĺpce, sekcia vľavo, bez lišty a zbaleného súhrnu" };
      }
      // zbalený súhrn navrchu
      const zb = await s.ev(`(function () { var d = document.getElementById("lcd-opc-zbalene"); var r = d && d.getBoundingClientRect(); return d ? { vid: r.width > 0 && r.height > 0, text: d.querySelector("summary").textContent.replace(/\\s+/g, " ").trim(), otvorene: d.open } : null; })()`);
      over(zb && zb.vid && !zb.otvorene, "zbalený súhrn chýba / je otvorený: " + JSON.stringify(zb));
      await s.klikni("#lcd-opc-zbalene summary", { popis: "zbalený súhrn" });
      const zb2 = await s.ev(`(function () { var d = document.getElementById("lcd-opc-zbalene"); return { otvorene: d.open, polozky: d.querySelectorAll(".lcd-opc-zbalene__polozky .cart-item").length }; })()`);
      over(zb2.otvorene && zb2.polozky >= 1, "zbalený súhrn sa nerozbalil s položkami: " + JSON.stringify(zb2));
      // lišta: navrchu viditeľná so sumou a zákonným textom tlačidla; klik na prázdnej stránke = klik na „Objednať“:
      // posun na meno (kontrola polí, Michal 29. 10.), nič neodíde ani sa neoveruje so serverom
      await s.ev(`window.scrollTo(0, 0)`);
      await pauza(400);
      over(await s.ev(`document.documentElement.classList.contains("lcd-lista-on")`) && (await s.viditelne(".lcd-opc-lista")), "lišta nie je viditeľná navrchu");
      const listaText = await s.ev(`document.querySelector(".lcd-opc-lista").textContent.replace(/\\s+/g, " ").trim()`);
      const celkom = (await stavOpc(s)).celkom;
      over(listaText.indexOf(TLACIDLO[s.web]) > 0 && listaText.indexOf(celkom) >= 0, "lišta bez sumy alebo textu tlačidla: „" + listaText + "“ (suma " + celkom + ")");
      s.p.reset();
      const url = await s.cesta();
      await s.klikni(".lcd-opc-lista__btn", { popis: "Objednať (lišta)" });
      await pauza(1200);
      over(s.p.zaznam.step2.length === 0 && step1Xhr(s).length === 0 && (await s.cesta()) === url, "lišta na prázdnej stránke odoslala / overovala objednávku alebo zmenila stránku");
      const poz = await s.ev(`(function () {
        var e = document.getElementById("billFullName"), r = e.getBoundingClientRect(), l = document.querySelector(".lcd-opc-lista").getBoundingClientRect();
        var listaOn = document.documentElement.classList.contains("lcd-lista-on");
        return { fokus: document.activeElement === e, ram: e.closest(".form-group").classList.contains("lcd-opc-chyba-pole"), top: Math.round(r.top), bottom: Math.round(r.bottom), spodok: listaOn ? Math.round(l.top) : innerHeight };
      })()`);
      over(poz.fokus && poz.ram && poz.top >= 0 && poz.bottom <= poz.spodok, "lišta neposunula na meno (alebo ho prekrýva): " + JSON.stringify(poz));
      // pri tlačidle Objednať sa lišta skryje
      await s.ev(`document.getElementById("submit-order").scrollIntoView({ block: "center", behavior: "instant" })`);
      await pauza(500);
      over(!(await s.ev(`document.documentElement.classList.contains("lcd-lista-on")`)), "lišta ostala pri tlačidle „Objednať“");
      // Luxia: bublina (76 × 76 vpravo dole) by prekryla „Objednať“ -> ustúpi
      await s.ev(`(function () {
        var f = document.createElement("iframe"); f.title = "Luxia chat";
        f.style.cssText = "position:fixed;right:12px;bottom:12px;width:76px;height:76px;border:0;z-index:99;background:#c49b31";
        document.body.appendChild(f);
        var b = document.getElementById("submit-order"); var r = b.getBoundingClientRect();
        window.scrollBy(0, r.bottom - (innerHeight - 30));
      })()`);
      await pauza(1600);
      const lux = await s.ev(`(function () {
        var f = document.querySelector('iframe[title="Luxia chat"]'), b = document.getElementById("submit-order");
        var x = f.getBoundingClientRect(), y = b.getBoundingClientRect();
        var prekryva = x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top;
        return { prekryva: prekryva, skryta: getComputedStyle(f).visibility === "hidden" };
      })()`);
      over(!lux.prekryva || lux.skryta, "bublina Luxie prekrýva „Objednať“: " + JSON.stringify(lux));
      return { info: "bez posunu; zbalený súhrn „" + zb.text + "“; lišta „" + listaText + "“ posúva, skryje sa pri tlačidle; Luxia " + (lux.prekryva ? "ustúpila" : "mimo tlačidla") };
    },
  },
  S14: {
    popis: "Apple Pay: bez ApplePaySession sa nezobrazí, s podvrhnutým canMakePayments() = true áno a dá sa zvoliť",
    async fn(J) {
      let s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      const bez = await s.ev(`!!document.querySelector('#lcd-opc input[value="${id.apple}"]')`);
      over(!bez, "Apple Pay je v sekcii bez ApplePaySession");
      await s.zavri();
      s = await J.novaStranka({ applePay: true });
      await naKrok2(s);
      over(await s.viditelne(`#lcd-opc label[for="billingId-${id.apple}"]`), "Apple Pay nie je viditeľná s canMakePayments() = true");
      s.p.reset();
      await zvolPlatbu(s, id.apple);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.apple && /Apple Pay/.test(st.platbaSuhrn), "Apple Pay sa nepotvrdila: " + JSON.stringify(st));
      return { info: "bez ApplePaySession skrytá, s ňou zvolená a potvrdená (" + st.platbaSuhrn + ")" };
    },
  },
  S15: {
    popis: "CSRF zapnuté (shoptet.csrf.enabled = true): __csrf__ v každom našom XHR",
    async fn(J) {
      const s = await J.novaStranka({ scenar: { csrf: true } });
      const id = ID[s.web];
      await s.chod(KOSIK + OPC, { popis: "košík" });
      await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "kosik-pripraveny"`, { popis: "modul OPC na košíku" });
      over(await s.ev(`shoptet.csrf.enabled === true && shoptet.csrf.token === "TEST-CSRF"`), "podvrh nezapol CSRF");
      await s.odmietniCookies();
      await s.klikni("#continue-order-button", { popis: "Pokračovať" });
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await s.odmietniCookies(); // podvrh súhlas s cookies neuchová -> lišta je na kroku 2 znova (ako v naKrok2)
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene", "dobierka s CSRF: " + st.stav);
      const x = step1Xhr(s);
      over(x.length === 2 && x.every((y) => y.pole.__csrf__ === "TEST-CSRF"), "Step1Validate bez __csrf__: " + JSON.stringify(x.map((y) => y.telo)));
      // potvrdenie ide cez GET kroku 1 (bez tela, CSRF netreba); step2CustomerAjax náš kód neposiela
      over(s.p.zaznam.ajax.length === 0, "náš kód poslal step2CustomerAjax: " + JSON.stringify(s.p.zaznam.ajax));
      return { info: x.length + "× Step1Validate, všetky s __csrf__ (potvrdenie GET krok 1, bez step2CustomerAjax)" };
    },
  },
  S16: {
    popis: "Rádiá s form=\"lcd-opc-nic\": v tele Step2Validate nie sú, skupina funguje (vždy 1 zvolená)",
    async fn(J) {
      const s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      const f = await s.ev(`(function () {
        var r = Array.prototype.slice.call(document.querySelectorAll("#lcd-opc input[type=radio]"));
        var nic = document.getElementById("lcd-opc-nic"), of = document.getElementById("order-form");
        return { pocet: r.length, vsetky: r.every(function (i) { return i.getAttribute("form") === "lcd-opc-nic" && i.form === nic; }),
          mimo: !!nic && !of.contains(nic), vOrderForm: Array.prototype.some.call(of.elements, function (e) { return /^(shippingId|billingId)$/.test(e.name); }) };
      })()`);
      over(f.pocet >= 3 && f.vsetky && f.mimo && !f.vOrderForm, "rádiá nie sú v pomocnom formulári: " + JSON.stringify(f));
      await zvolPlatbu(s, id.karta);
      await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      const zvolene = await s.ev(`document.querySelectorAll('input[name="billingId"]:checked').length`);
      over(zvolene === 1 && st.platbaUI === id.dobierka, "v skupine platieb " + zvolene + " zvolených");
      await vyplnUdaje(s);
      await suhlas(s);
      const z2 = await objednaj(s);
      const m = overTeloObjednavky(s, z2[0]);
      over(z2[0].platba === id.dobierka, "session pri objednávke " + z2[0].platba);
      return { step2: true, info: f.pocet + " rádií mimo #order-form, telo bez shippingId/billingId (" + m.size + " polí), platba zo session " + z2[0].platba };
    },
  },
  S18: {
    popis: "Celá stránka: žiadne „s DPH / bez DPH“, text tlačidla bez zmeny, súhlas a ostatné nepredzaškrtnuté, písmo ≥ 14/16 px",
    async fn(J) {
      const s = await J.novaStranka();
      await naKrok2(s);
      const d = await s.ev(`(function () {
        var t = document.body.innerText;
        var b = document.getElementById("submit-order");
        var zaskrtnute = Array.prototype.filter.call(document.querySelectorAll('#order-form input[type=checkbox]'), function (c) { return c.checked; }).map(function (c) { return c.name || c.id; });
        var male = [];
        document.querySelectorAll("#lcd-opc *, .lcd-opc-lista *, #lcd-opc-zbalene *, .lcd-opc-pravne, .lcd-opc-upravit").forEach(function (e) {
          var txt = Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
          if (!txt) return;
          var r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return;
          var fs = parseFloat(getComputedStyle(e).fontSize);
          var nazov = e.matches(".shipping-billing-name, .lcd-opc-termin, h2");
          if (fs < 14 || (nazov && fs < 16)) male.push((e.className || e.tagName) + " " + fs + "px „" + e.textContent.trim().slice(0, 30) + "“");
        });
        // riadok-odkaz (rýchla platba): text „Banku máte vybranú“ len pri zvolenej, inak „Banku vyberiete…“
        var odkazy = Array.prototype.map.call(document.querySelectorAll("#lcd-opc .lcd-opc-odkaz"), function (w) {
          var vid = function (sel) { return Array.prototype.some.call(w.querySelectorAll(sel), function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); };
          return { aktivny: w.classList.contains("active"), ano: vid(".lcd-opc-odkaz__ano"), nie: vid(".lcd-opc-odkaz__nie") };
        }).filter(function (o) { return o.aktivny ? (!o.ano || o.nie) : (o.ano || !o.nie); });
        return { pravne: !!document.querySelector(".lcd-opc-pravne"), odkazy: odkazy, dph: (t.match(/\\b(s|bez|vrátane|vrátane)\\s+DPH\\b/gi) || []), tlacidlo: b.textContent.replace(/\\s+/g, " ").trim(), zaskrtnute: zaskrtnute, male: male,
          suhlasPovinny: document.querySelector('input[name="consents[]"]').required };
      })()`);
      over(!d.dph.length, "na stránke je " + d.dph.join(", "));
      over(!d.pravne, "pri vzorkovníku (nie je na mieru) je riadok o nemožnosti odstúpiť");
      over(d.tlacidlo === TLACIDLO[s.web], "text tlačidla „" + d.tlacidlo + "“");
      over(!d.zaskrtnute.length, "predzaškrtnuté: " + d.zaskrtnute.join(", "));
      over(d.suhlasPovinny, "súhlas s podmienkami nie je povinný");
      over(!d.odkazy.length, "riadok-odkaz ukazuje zlý text (zvolené / nezvolené): " + JSON.stringify(d.odkazy));
      over(!d.male.length, "malé písmo: " + d.male.slice(0, 6).join("; "));
      return { info: "bez DPH textov, „" + d.tlacidlo + "“, nič predzaškrtnuté, písmo OK" };
    },
  },
  S19: {
    popis: "Prebieha výmena doplnku (iná karta): „Objednať“ zadržané, po dokončení odomknuté a odložené odoslanie prejde",
    async fn(J) {
      const s = await J.novaStranka();
      await naKrok2(s, {
        pred: (k) => k.ev(`localStorage.setItem("lcdDoplnokVymena", JSON.stringify({ id: "test-vymena", t: Date.now(), hb: Date.now(), faza: "start", trh: "${J.web}" }))`),
      });
      // tep výmeny z „inej karty“ (zápis do localStorage každú sekundu)
      await s.ev(`window.__tep = setInterval(function () { try { var z = JSON.parse(localStorage.getItem("lcdDoplnokVymena")); if (z) { z.hb = Date.now(); localStorage.setItem("lcdDoplnokVymena", JSON.stringify(z)); } } catch (e) {} }, 1000), 1`);
      await vyplnUdaje(s);
      await suhlas(s);
      let st = await stavOpc(s);
      over(st.aria === "true", "počas výmeny nie je „Objednať“ zablokované: " + JSON.stringify(st));
      s.p.reset();
      await s.klikni("#submit-order", { popis: "Objednať (počas výmeny)" });
      await pauza(1500);
      const cakam = await s.ev(`(function () { var e = document.querySelector(".lcd-opc-cakam"); return e && !e.hidden ? e.textContent : ""; })()`);
      over(s.p.zaznam.step2.length === 0, "objednávka odišla počas výmeny doplnku");
      over(/úpravy košíka|úpravy košíku/.test(cakam), "chýba hláška o úprave košíka: " + JSON.stringify(cakam));
      const t0 = Date.now();
      await s.ev(`clearInterval(window.__tep), localStorage.removeItem("lcdDoplnokVymena"), 1`);
      const z2 = await objednaj(s, { klik: false, ms: 6000 });
      st = await stavOpc(s);
      over(z2.length === 1 && z2[0].cas >= t0, "po dokončení výmeny neodišlo odložené odoslanie");
      overTeloObjednavky(s, z2[0]);
      return { step2: true, info: "zablokované počas výmeny („" + cakam.trim() + "“), po nej odoslané za " + (z2[0].cas - t0) + " ms" };
    },
  },
};
