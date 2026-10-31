// Scenáre správania „Objednať“ podľa Michala 29. 10. 2026 (kniha OPC § 6.4, § 7.6): S37–S39.
//   S37 klik na „Objednať“ na prázdnej stránke -> meno; postupné dopĺňanie -> e-mail, telefón, adresa, súhlas; všetko
//       vyplnené -> práve 1× Step2Validate (a 1× kontrola so serverom, predtým žiadna požiadavka)
//   S38 neplatný telefón: hneď (Shoptet ho už označil) aj počas overenia (Shoptet ohlási chybu až po overení)
//   S39 lišta / karta „Celkom | Objednať s povinnosťou platby“: telefón — všetko vyplnené, klik v lište = 1× objednávka;
//       PC — karta nad stĺpcom súhrnu (klik = posun na meno) len keď neskryje nezaškrtnutý povinný súhlas ani vetu
//       o tovare na mieru (revízia 31. 10. 2026, N1, kniha § 10.12 (a))
// Spoločné pre každý klik: posun na PRVÉ zlé pole, červený rám (lcd-opc-chyba-pole), červený text pod poľom, kurzor
// v poli, pole aj text nad lištou dole; rám zmizne hneď po vpísaní (udalosť input, ešte pred opustením poľa).
import { ID, ZAKAZNIK, naKrok2, suhlas, objednaj, overTeloObjednavky, stavOpc, step1Xhr, over, pauza } from "./krok2-pomoc.mjs";

const TLACIDLO = { sk: "Objednať s povinnosťou platby", cz: "Objednat s povinností platby" };
// poradie na stránke (dizajn A, 29. 10.: PSČ pred Mestom ako na obálke — kontrola ide v poradí polí na stránke)
const POLIA = ["billFullName", "email", "phone", "billStreet", "billHouseNumber", "billZip", "billCity"];
const HODNOTY = (web) => {
  const z = ZAKAZNIK[web];
  return { billFullName: z.meno, email: z.email, phone: z.telefon, billStreet: z.ulica, billHouseNumber: z.cislo, billCity: z.mesto, billZip: z.psc };
};

/** Klik na „Objednať“ ako zákazník: keď je lišta dole viditeľná, v nej; inak natívne tlačidlo. */
export async function klikObjednat(s) {
  const lista = await s.ev(`document.documentElement.classList.contains("lcd-lista-on")`);
  if (lista) await s.klikni(".lcd-opc-lista__btn", { popis: "Objednať (lišta)" });
  else await s.klikni("#submit-order", { popis: "Objednať" });
  return lista ? "lišta" : "tlačidlo";
}

/** Čo zákazník po kliku vidí: fokus, rám, text pod poľom, poloha poľa a textu voči lište. */
export function stavChyby(s) {
  return s.ev(`(function () {
    var a = document.activeElement;
    var g = a && a.closest ? (a.closest(".lcd-opc-box") || a.closest(".form-group")) : null;
    var msg = g ? g.querySelector(".js-validator-msg, .lcd-opc-chyba-text") : null;
    var ciel = a && a.type === "checkbox" ? g : a;
    var r = ciel && ciel.getBoundingClientRect ? ciel.getBoundingClientRect() : null;
    var mr = msg ? msg.getBoundingClientRect() : null;
    var l = document.querySelector(".lcd-opc-lista");
    var listaOn = !!l && document.documentElement.classList.contains("lcd-lista-on") && getComputedStyle(l).display !== "none";
    var spodok = listaOn ? l.getBoundingClientRect().top : innerHeight;
    var farba = msg ? getComputedStyle(msg).color.replace(/[^0-9,]/g, "").split(",").map(Number) : [];
    var ram = a && a.matches && a.matches("input.form-control") ? getComputedStyle(a).borderTopColor.replace(/[^0-9,]/g, "").split(",").map(Number) : null;
    return {
      fokus: a ? (a.id || a.name || a.tagName) : null,
      ram: !!(g && g.classList.contains("lcd-opc-chyba-pole")),
      oznacene: document.querySelectorAll(".lcd-opc-chyba-pole").length,
      text: msg ? msg.textContent.trim() : "",
      cerveny: farba.length >= 3 && farba[0] > 140 && farba[1] < 90 && farba[2] < 90,
      ramCerveny: !ram || (ram[0] > 140 && ram[1] < 90),
      hore: r ? Math.round(r.top) : null, dole: r ? Math.round(r.bottom) : null, textDole: mr ? Math.round(mr.bottom) : null,
      spodok: Math.round(spodok), listaOn: listaOn
    };
  })()`);
}

/** Text chyby Shoptetu pre pole z jeho správ na stránke (napr. „Zadajte telefónne číslo.“). */
function textShoptetu(s, kluc) {
  return s.ev(`(function () { var v = window.shoptet && shoptet.messages && shoptet.messages.validator; return (v && v[${JSON.stringify(kluc)}]) || ""; })()`);
}

/** Po kliku: posun dobehol (plynulý), potom stav. */
async function poKliku(s, ocakavane, popis) {
  await pauza(1000);
  const st = await stavChyby(s);
  over(st.fokus === ocakavane, popis + ": kurzor v " + st.fokus + " (čakal som " + ocakavane + ") " + JSON.stringify(st));
  over(st.ram && st.oznacene === 1, popis + ": rám nie je práve na jednom poli: " + JSON.stringify(st));
  over(st.text && st.cerveny && st.ramCerveny, popis + ": chýba červený text / rám pod poľom: " + JSON.stringify(st));
  over(st.hore >= 0 && st.dole <= st.spodok && st.textDole <= st.spodok, popis + ": pole alebo text je mimo obrazovky / pod lištou: " + JSON.stringify(st));
  return st;
}

/** Vpíše hodnotu do poľa s kurzorom a over, že rám zmizol hneď (input), potom opustí pole (change, blur ako s.pis). */
async function vpis(s, id, text) {
  await s.k.posli("Input.insertText", { text });
  const ram = await s.ev(`document.getElementById(${JSON.stringify(id)}).closest(".form-group").classList.contains("lcd-opc-chyba-pole")`);
  over(!ram, id + ": rám ostal aj po vpísaní (pred opustením poľa)");
  await s.ev(`(function () { var e = document.getElementById(${JSON.stringify(id)}); e.dispatchEvent(new Event("change", { bubbles: true })); e.blur(); return 1; })()`);
  await pauza(250);
}

export const SCENARE = {
  S37: {
    popis: "Klik „Objednať“ na prázdnej stránke -> meno; dopĺňanie -> e-mail, telefón, ulica, číslo, PSČ, mesto, súhlas (vždy 1 pole, rám, text, kurzor, nad lištou); potom 1× Step2Validate",
    async fn(J) {
      const s = await J.novaStranka();
      await naKrok2(s);
      const h = HODNOTY(s.web);
      s.p.reset();
      const cesta = [];
      for (const id of POLIA) {
        const ako = await klikObjednat(s);
        const st = await poKliku(s, id, "klik " + (cesta.length + 1));
        if (id === "phone") {
          const t = await textShoptetu(s, "phoneRequired");
          over(st.text === t, "telefón: text „" + st.text + "“ ≠ text Shoptetu „" + t + "“");
        }
        over(s.p.zaznam.step2.length === 0 && step1Xhr(s).length === 0, "pri neúplnom formulári išla požiadavka na server (Step1Validate " + step1Xhr(s).length + "×, Step2Validate " + s.p.zaznam.step2.length + "×)");
        cesta.push(id + "(" + ako + ")");
        await vpis(s, id, h[id]);
      }
      // súhlas s podmienkami
      await klikObjednat(s);
      const st = await poKliku(s, (await s.ev(`document.querySelector('#order-form input[name="consents[]"]').id`)), "súhlas");
      const t = await textShoptetu(s, "consentsRequired");
      over(st.text === t, "súhlas: text „" + st.text + "“ ≠ „" + t + "“");
      cesta.push("súhlas");
      await suhlas(s);
      await pauza(200);
      over(!(await s.ev(`document.querySelector(".lcd-opc-chyba-pole") !== null`)), "po zaškrtnutí súhlasu ostal rám");
      over(s.p.zaznam.step2.length === 0 && step1Xhr(s).length === 0, "pred posledným klikom išla požiadavka na server");
      // všetko vyplnené: kontrola so serverom (resync) 1× a objednávka natívne práve 1×
      await klikObjednat(s);
      const z = await objednaj(s, { klik: false, ms: 8000 });
      await pauza(800);
      overTeloObjednavky(s, z[0]);
      over(s.p.zaznam.step2.length === 1 && step1Xhr(s).length === 1, "Step2Validate " + s.p.zaznam.step2.length + "×, Step1Validate " + step1Xhr(s).length + "× (čakal som 1× a 1×)");
      return { step2: true, info: cesta.join(" → ") + " → 1× Step2Validate" };
    },
  },
  S38: {
    popis: "Neplatný telefón: označený Shoptetom -> klik posunie na telefón s jeho textom, nič neodíde; opravený -> 1× Step2Validate. Počas overenia: chyba po overení -> posun na telefón",
    async fn(J) {
      const casti = [];
      // a) Shoptet telefón už overil a označil ako neplatný
      let s = await J.novaStranka();
      await naKrok2(s);
      const h = HODNOTY(s.web);
      for (const id of POLIA) await s.pis("#" + id, h[id]);
      await suhlas(s);
      s.p.scenar.telefon = "neplatny";
      await s.pis("#phone", h.phone.replace(/0$/, "9"));
      await s.cakaj(`document.getElementById("phone").classList.contains("js-error-field")`, { ms: 5000, popis: "Shoptet označil neplatný telefón" });
      s.p.reset();
      await s.ev(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }), 1`);
      await pauza(400);
      await klikObjednat(s);
      const st = await poKliku(s, "phone", "neplatný telefón");
      const t = await textShoptetu(s, "phoneRequired");
      over(st.text && st.text !== t, "neplatný telefón: čakal som text Shoptetu o neplatnom čísle, je „" + st.text + "“");
      over(s.p.zaznam.step2.length === 0 && step1Xhr(s).length === 0, "s neplatným telefónom išla požiadavka na server");
      s.p.scenar.telefon = "";
      await s.pis("#phone", h.phone);
      await s.cakaj(`!document.getElementById("phone").classList.contains("js-error-field") && !document.querySelector(".lcd-opc-chyba-pole")`, { ms: 5000, popis: "rám preč po oprave telefónu" });
      await klikObjednat(s);
      const z = await objednaj(s, { klik: false, ms: 8000 });
      overTeloObjednavky(s, z[0]);
      casti.push("neplatný: „" + st.text.slice(0, 40) + "…“, opravený -> 1× Step2Validate");
      await s.zavri();
      // b) klik počas overenia (1,5 s), číslo neplatné: Shoptet ohlási chybu až po overení -> posun na telefón
      s = await J.novaStranka();
      await naKrok2(s);
      for (const id of POLIA) await s.pis("#" + id, h[id]);
      await suhlas(s);
      s.p.scenar.telefon = "pomaly-neplatny";
      await s.pis("#phone", h.phone.replace(/0$/, "8"));
      s.p.reset();
      await s.ev(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }), 1`);
      await pauza(150);
      await klikObjednat(s);
      await s.cakaj(`document.activeElement && document.activeElement.id === "phone" && !!document.querySelector(".lcd-opc-chyba-pole #phone")`, { ms: 8000, popis: "posun na telefón po overení" });
      await poKliku(s, "phone", "telefón po overení");
      over(s.p.zaznam.step2.length === 0, "s neplatným telefónom odišla objednávka");
      casti.push("počas overenia: po chybe Shoptetu posun na telefón, nič neodišlo");
      return { step2: true, info: casti.join(" | ") };
    },
  },
  S39: {
    popis: "Lišta „Celkom | Objednať s povinnosťou platby“: telefón — vyplnené, klik v lište = 1× objednávka; PC — karta nad súhrnom len keď neskryje nezaškrtnutý povinný súhlas ani vetu o tovare na mieru (vzorkovník 1366×657: karta, klik = posun na meno; 1280×520: až po zaškrtnutí súhlasu; set: nie, kým je veta pod kartou)",
    async fn(J) {
      if (J.sirka >= 992) {
        // revízia 31. 10. 2026 (N1, kniha § 10.12 (a)): karta „Celkom | Objednať“ na PC svieti len vtedy, keď neskryje
        // (nezakryje ani nenechá pod sebou mimo okna) nezaškrtnutý povinný súhlas ani vetu o tovare na mieru (VOP 6.13)
        const KARTA = `(function () {
          // karta je zarovnaná s kartou súhrnu (#checkoutSidebar > .cart-content, krok2.js zarovnajListu; dizajn A, S41)
          var l = document.querySelector(".lcd-opc-lista"), sb = document.getElementById("checkoutSidebar"), b = document.getElementById("submit-order");
          var p = sb.querySelector(":scope > .cart-content") || sb;
          var si = sb.querySelector(".consents input[type=checkbox][required]"), sl = si && si.nextElementSibling, pv = sb.querySelector(".lcd-opc-pravne");
          var lr = l.getBoundingClientRect(), pr = p.getBoundingClientRect(), br = b.getBoundingClientRect();
          return { on: document.documentElement.classList.contains("lcd-lista-on"), vid: getComputedStyle(l).display !== "none" && lr.height > 0,
            tlacidloVidno: br.top < innerHeight - 72, x: Math.round(lr.left), w: Math.round(lr.width), px: Math.round(pr.left), pw: Math.round(pr.width),
            dole: Math.round(lr.bottom), vh: innerHeight, text: l.textContent.replace(/[ \\n\\t]+/g, " ").trim(),
            suhlas: sl ? [Math.round(sl.getBoundingClientRect().top), Math.round(sl.getBoundingClientRect().bottom), si.checked] : null,
            veta: pv ? [Math.round(pv.getBoundingClientRect().top), Math.round(pv.getBoundingClientRect().bottom)] : null };
        })()`;
        const ZASKRTNI = (ano) => `(function () { var i = document.querySelector("#checkoutSidebar .consents input[type=checkbox][required]"); if (i.checked !== ${ano}) i.click(); return i.checked; })()`;
        const navrch = async (s) => { await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`); await pauza(600); return s.ev(KARTA); };
        const casti = [];
        // 1) vzorkovník 1366×657: súhlas nad kartou, veta o tovare na mieru nie je -> karta nad stĺpcom súhrnu, klik = meno
        const s = await J.novaStranka({ sirka: 1366, vyska: 657 });
        await naKrok2(s);
        const k = await navrch(s);
        over(!k.tlacidloVidno, "PC vzorkovník 1366×657: „Objednať“ je nad prahom karty (scenár by kartu neoveril): " + JSON.stringify(k));
        over(k.on && k.vid && Math.abs(k.x - k.px) <= 2 && Math.abs(k.w - k.pw) <= 2 && k.dole <= k.vh, "PC: karta „Objednať“ nie je nad stĺpcom súhrnu: " + JSON.stringify(k));
        over(k.suhlas && k.suhlas[1] <= k.vh - 76 && !k.veta, "PC vzorkovník: povinný súhlas nie je nad kartou alebo je tu veta o tovare na mieru: " + JSON.stringify(k));
        over(k.text.indexOf(TLACIDLO[s.web]) > 0, "PC: karta bez textu tlačidla: " + k.text);
        s.p.reset();
        await s.klikni(".lcd-opc-lista__btn", { popis: "Objednať (karta PC)" });
        await poKliku(s, "billFullName", "PC karta");
        over(s.p.zaznam.step2.length === 0 && step1Xhr(s).length === 0, "PC: karta na prázdnej stránke poslala požiadavku");
        await s.ev(`document.getElementById("submit-order").scrollIntoView({ block: "center", behavior: "instant" }), 1`);
        await pauza(500);
        over(!(await s.ev(`document.documentElement.classList.contains("lcd-lista-on")`)), "PC: karta ostala, keď je tlačidlo v paneli vidno");
        casti.push("vzorkovník 1366×657: karta x" + k.x + " š" + k.w + " = panel, súhlas " + k.suhlas[0] + "–" + k.suhlas[1] + " nad ňou, klik -> meno, pri tlačidle zmizne");
        await s.zavri();
        // 2) vzorkovník 1280×520: nezaškrtnutý povinný súhlas by bol pod kartou -> karta nesvieti; po zaškrtnutí svieti,
        //    po odškrtnutí zhasne
        const n = await J.novaStranka({ sirka: 1280, vyska: 520 });
        await naKrok2(n);
        const n0 = await navrch(n);
        over(!n0.tlacidloVidno && n0.suhlas && n0.suhlas[1] > n0.vh - 76, "PC vzorkovník 1280×520: súhlas nie je pod prahom karty (scenár by nič neoveril): " + JSON.stringify(n0));
        over(!n0.on, "PC 1280×520: karta svieti a skryje nezaškrtnutý povinný súhlas: " + JSON.stringify(n0));
        over(await n.ev(ZASKRTNI(true)), "súhlas sa nedal zaškrtnúť");
        const n1 = await navrch(n);
        over(n1.on && n1.vid && Math.abs(n1.x - n1.px) <= 2, "PC 1280×520: po zaškrtnutí súhlasu karta nesvieti: " + JSON.stringify(n1));
        over(!(await n.ev(ZASKRTNI(false))), "súhlas sa nedal odškrtnúť");
        const n2 = await navrch(n);
        over(!n2.on, "PC 1280×520: po odškrtnutí súhlasu karta ostala nad ním: " + JSON.stringify(n2));
        casti.push("vzorkovník 1280×520: súhlas " + n0.suhlas[0] + "–" + n0.suhlas[1] + " -> bez karty, zaškrtnutý -> karta, odškrtnutý -> bez karty");
        await n.zavri();
        // 3) SK set 1366×657 (veta o tovare na mieru pod prahom karty): bez karty aj po zaškrtnutí súhlasu
        if (J.web === "sk") {
          const t = await J.novaStranka({ kosik: "set", sirka: 1366, vyska: 657 });
          await naKrok2(t, { query: "&lcddoplnok=0" });
          const t0 = await navrch(t);
          over(!t0.tlacidloVidno && t0.veta && t0.veta[1] > t0.vh - 76, "PC set 1366×657: veta o tovare na mieru nie je pod prahom karty (scenár by nič neoveril): " + JSON.stringify(t0));
          over(!t0.on, "PC set 1366×657: karta svieti a skryje vetu o tovare na mieru / súhlas: " + JSON.stringify(t0));
          over(await t.ev(ZASKRTNI(true)), "súhlas sa nedal zaškrtnúť");
          const t1 = await navrch(t);
          over(!t1.on, "PC set 1366×657: po zaškrtnutí súhlasu karta skryje vetu o tovare na mieru: " + JSON.stringify(t1));
          casti.push("set 1366×657: veta " + t0.veta[0] + "–" + t0.veta[1] + " -> bez karty aj so zaškrtnutým súhlasom");
          await t.zavri();
        }
        return { info: "PC " + casti.join("; ") };
      }
      // telefón: všetko vyplnené, navrchu stránky klik v lište -> kontrola so serverom 1× a objednávka práve 1×
      const s = await J.novaStranka();
      await naKrok2(s);
      const h = HODNOTY(s.web);
      for (const id of POLIA) await s.pis("#" + id, h[id]);
      await suhlas(s);
      await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
      await pauza(500);
      over(await s.ev(`document.documentElement.classList.contains("lcd-lista-on")`), "navrchu stránky nie je lišta");
      s.p.reset();
      await s.klikni(".lcd-opc-lista__btn", { popis: "Objednať (lišta, všetko vyplnené)" });
      const z = await objednaj(s, { klik: false, ms: 8000 });
      await pauza(800);
      overTeloObjednavky(s, z[0]);
      over(s.p.zaznam.step2.length === 1 && step1Xhr(s).length === 1, "lišta: Step2Validate " + s.p.zaznam.step2.length + "×, Step1Validate " + step1Xhr(s).length + "×");
      over(z[0].platba === ID[s.web].prevod, "objednávka s platbou " + z[0].platba);
      return { step2: true, info: "lišta: všetko vyplnené -> 1× kontrola, 1× Step2Validate s prevodom" };
    },
  },
};
