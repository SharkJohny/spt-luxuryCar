// One page checkout (kniha OPC § 6.5): čistá funkcia HTML kroku 1 Shoptetu (/objednavka/krok-1/) -> model dopravy a platby.
// Bez zápisu do stránky, bez siete. Fail-closed: keď formulár Step1Validate, zvolená doprava alebo platba chýba,
// vráti { ok: false, dovod } a volajúci ide dnešným tokom (odkaz na krok 1).
//
//   krok1Model(html)            -> { ok: true, akcia, pole, jazyk, doprava[], platby[], zvolenaDoprava, zvolenaPlatba, hlaska,
//                                    pisPodmienky (text Shoptet Pay pod bankou, rýchla platba cez banku) }
//   krok1Model(html, { doc })   -> to isté nad hotovým dokumentom (testy v jsdom)
// Každá doprava a platba nesie aj html (outerHTML .radio-wrapper zo Shoptetu): sekcia na kroku 2 kreslí klon označenia
// Shoptetu (input -> label -> .shipping-billing-name), aby fungovalo CSS (kniha § 6.5 bod 2).

/** Číslo z data-*-price-wv („5“, „4.0650“) alebo null. */
function cena(el, atribut) {
  if (!el) return null;
  const v = el.getAttribute(atribut);
  if (v === null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function text(el) {
  return el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "";
}

/** Pole formulára tak, ako by ho poslal prehliadač: hidden/text + zaškrtnuté rádiá a checkboxy, bez disabled. */
function poleFormulara(form) {
  const pole = [];
  form.querySelectorAll("input[name], select[name], textarea[name]").forEach(function (e) {
    if (e.disabled) return;
    const typ = String(e.type || "").toLowerCase();
    if ((typ === "radio" || typ === "checkbox") && !e.checked) return;
    if (typ === "submit" || typ === "button" || typ === "file") return;
    pole.push([e.name, e.value == null ? "" : String(e.value)]);
  });
  return pole;
}

function labelPre(doc, input) {
  return input.id ? doc.querySelector('label[for="' + input.id + '"]') : null;
}

/** Spoločné údaje rádia: logo, text ceny (ako ho píše Shoptet, „€3“ / „ZADARMO“), označenie na klon. */
function spolocne(w, l) {
  const img = l && l.querySelector(".payment-logo img");
  return {
    logo: (img && img.getAttribute("src")) || "",
    cenaText: text(l && l.querySelector(".payment-shipping-price")),
    html: w ? w.outerHTML : "",
  };
}

/** Výdajné miesto (Packeta, Z-BOX, …): v1 sa nerieši, doprava s ním pošle zákazníka na klasický krok 1 (kniha § 6.6). */
function jeVydajneMiesto(wrapper, input) {
  // 🟡 heuristika: Shoptet pri doprave s výberom miesta pridáva tlačidlo/odkaz výberu a externý kód dopravcu
  if (input.getAttribute("data-external")) return true;
  return !!(wrapper && wrapper.querySelector('[class*="pickup"], [data-pickup-point], [class*="zasilkovna"], [class*="packeta"]'));
}

/**
 * Podmienky rýchlej platby cez banku (Shoptet Pay „pis“): text Shoptetu pod zvolenou bankou na kroku 1 (šablóna
 * #template__pisPayment, .bankInformation__description: „Prijímate a súhlasíte so zmluvnými podmienkami a zásadami ochrany
 * osobných údajov partnerských poskytovateľov.“ s 2 odkazmi Salt Edge). OPC ho ukáže pri banke na kroku 2 — prevzatý, nie
 * vymyslený. Len text a odkazy http(s) -> [{ text }, { text, href }] | null (šablóna chýba / prázdna).
 */
function pisPodmienky(doc) {
  try {
    const t = doc.getElementById("template__pisPayment");
    const koren = t && (t.content || t);
    const opis = koren && koren.querySelector(".bankInformation__description");
    if (!opis) return null;
    const casti = [];
    const prejdi = function (uzol) {
      Array.prototype.forEach.call(uzol.childNodes, function (n) {
        if (n.nodeType === 3) { if (n.textContent) casti.push({ text: n.textContent }); return; }
        if (n.nodeType !== 1) return;
        const href = n.tagName === "A" ? String(n.getAttribute("href") || "") : "";
        if (/^https?:\/\//i.test(href)) casti.push({ text: n.textContent, href: href });
        else prejdi(n);
      });
    };
    prejdi(opis);
    const spolu = casti.map(function (c) { return c.text; }).join("").replace(/\s+/g, " ").trim();
    if (!spolu) return null;
    // biele znaky ako v texte stránky (zalomenia riadkov šablóny -> medzera), okraje preč
    casti.forEach(function (c) { c.text = c.text.replace(/\s+/g, " "); });
    casti[0].text = casti[0].text.replace(/^\s+/, "");
    casti[casti.length - 1].text = casti[casti.length - 1].text.replace(/\s+$/, "");
    return casti.filter(function (c) { return c.text; });
  } catch (e) {
    return null;
  }
}

export function krok1Model(html, moznosti) {
  try {
    const doc = (moznosti && moznosti.doc) || new DOMParser().parseFromString(String(html || ""), "text/html");
    const form = Array.prototype.find.call(doc.querySelectorAll("form"), function (f) {
      return /\/action\/orderingProcess\/Step1Validate\/?$/i.test(f.getAttribute("action") || "");
    });
    if (!form) return { ok: false, dovod: "formular" };
    const doprava = Array.prototype.map.call(form.querySelectorAll('input[type="radio"][name="shippingId"]'), function (i) {
      const w = i.closest(".radio-wrapper");
      const l = labelPre(doc, i);
      return Object.assign({
        id: String(i.value),
        nazov: text(l && l.querySelector(".shipping-billing-name")),
        cena: cena(l && l.querySelector("[data-shipping-price-wv]"), "data-shipping-price-wv"),
        relacie: String(i.getAttribute("data-relations") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean),
        kod: i.getAttribute("data-code") || "",
        checked: !!i.checked,
        vydajneMiesto: jeVydajneMiesto(w, i),
      }, spolocne(w, l));
    });
    const platby = Array.prototype.map.call(form.querySelectorAll('input[type="radio"][name="billingId"]'), function (i) {
      const w = i.closest(".radio-wrapper");
      const l = labelPre(doc, i);
      return Object.assign({
        id: String(i.value),
        nazov: text(l && l.querySelector(".shipping-billing-name")),
        popis: text(l && l.querySelector(".sublabel-description, .sublabel")),
        cena: cena(l && l.querySelector("[data-billing-price-wv]"), "data-billing-price-wv"),
        typ: i.getAttribute("data-payment-type") || "",
        podmetoda: (w && w.getAttribute("data-submethod")) || "",
        checked: !!i.checked,
      }, spolocne(w, l));
    });
    const zd = doprava.find(function (d) { return d.checked; });
    const zp = platby.find(function (p) { return p.checked; });
    if (!doprava.length || !platby.length) return { ok: false, dovod: "volby" };
    if (!zd || !zp) return { ok: false, dovod: "zvolene" };
    const jazykEl = form.querySelector('input[name="language"]');
    const hlaskaEl = form.querySelector("em.not-possible-info");
    return {
      ok: true,
      akcia: form.getAttribute("action"),
      pole: poleFormulara(form),
      jazyk: jazykEl ? String(jazykEl.value) : "",
      doprava: doprava,
      platby: platby,
      zvolenaDoprava: zd.id,
      zvolenaPlatba: zp.id,
      hlaska: text(hlaskaEl),
      pisPodmienky: pisPodmienky(doc),
    };
  } catch (e) {
    return { ok: false, dovod: "vynimka" };
  }
}
