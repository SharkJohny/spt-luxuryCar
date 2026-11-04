// ─────────────────────────────────────────────────────────────────────
// SEO Fáza A — Runtime injection module (loaded via main.js bundle)
//
// Tento modul je server-side replacement workaround. Originálny brief
// počítal s paste-om do Shoptet admin > Custom HTML head + FTP upload
// /llms.txt. Keďže Shoptet admin paste neprešiel, nasadzujeme čo sa
// dá priamo cez bundle (deploy automatický cez Jánov CDN).
//
// ČO TENTO MODUL ROBÍ pri page load:
//   1) Inject JSON-LD (Organization + WebSite + LocalBusiness) — fix #5
//   2) Inject hreflang trio sk-SK / cs-CZ / x-default — fix #9
//   3) Replace H1 sr-only text + reveal — fix #3
//   4) Disable Hotjar (preventive) — fix #10 partial
//   5) Anti-FOUC unblock (remove body{display:none}) — fix #7 partial
//
// ČO TENTO MODUL NEMÔŽE (admin/FTP only):
//   - #1 CZ brand značky cleanup (Shoptet admin > Katalog > Značky)
//   - #2 /kontakt → /kontakty/ 301 (Shoptet admin > Web > Presmerovania)
//   - #6 /llms.txt (FTP root upload)
//   - #7 hero WebP + srcset (Shoptet admin + template)
//
// CAVEAT: JS-injected JSON-LD je suboptimálne vs <head> server-render
// pre Google (Googlebot ho zachytí, ale spomalí indexing). Pre AI
// crawlery (GPTBot, ClaudeBot, PerplexityBot) je to OK. Ak Michal
// časom paste-ne JSON-LD do Shoptet admin Custom HTML head, treba
// tento modul skipnúť (kontrola: ak už existuje JSON-LD v head, neinject).
// ─────────────────────────────────────────────────────────────────────

import { cestyStranky } from "./seo-hreflang.js";

(function seoRuntime() {
  "use strict";

  // ─────────────────────────────────────────────────
  // Domain / language detection
  // ─────────────────────────────────────────────────
  const host = location.hostname.replace(/^www\./, "");
  const isSk = host === "luxurycardesign.sk";
  const isCz = host === "luxurycardesign.cz";
  if (!isSk && !isCz) return; // Skip on staging / preview

  const lang = isSk ? "sk-SK" : "cs-CZ";
  const otherLang = isSk ? "cs-CZ" : "sk-SK";
  const otherHost = isSk ? "luxurycardesign.cz" : "luxurycardesign.sk";
  const baseSk = "https://www.luxurycardesign.sk";
  const baseCz = "https://www.luxurycardesign.cz";
  const isHomepage =
    location.pathname === "/" || location.pathname === "/index.php";

  // ─────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────
  const head = document.head || document.getElementsByTagName("head")[0];

  function injectJsonLd(id, payload) {
    if (document.getElementById(id)) return; // Already injected
    if (
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some(
        (s) => {
          try {
            return JSON.parse(s.textContent)["@type"] === payload["@type"];
          } catch {
            return false;
          }
        }
      )
    )
      return; // Server-rendered version exists — don't double-inject

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(payload);
    head.appendChild(script);
  }

  function injectLink(rel, attrs) {
    const exists = Array.from(
      document.querySelectorAll(`link[rel="${rel}"]`)
    ).some((l) =>
      Object.entries(attrs).every(([k, v]) => l.getAttribute(k) === v)
    );
    if (exists) return;
    const link = document.createElement("link");
    link.rel = rel;
    Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v));
    head.appendChild(link);
  }

  // ─────────────────────────────────────────────────
  // Fix #5 — JSON-LD (Organization + WebSite + LocalBusiness)
  // ─────────────────────────────────────────────────
  const orgCommon = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Luxury Car Design",
    legalName: "Luxury Car Design, s.r.o.",
    foundingDate: "2023-10-10",
    telephone: "+421903660720",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Školský dvor 12/10",
      addressLocality: "Žilina-Bytčica",
      postalCode: "010 09",
      addressCountry: "SK",
    },
    vatID: "SK2122088243",
    sameAs: [
      "https://www.facebook.com/luxurycardes",
      "https://www.instagram.com/luxury_car_design_official",
      "https://www.tiktok.com/@luxurycardesign",
      "https://www.youtube.com/@Luxury_Car_Design",
    ],
  };

  if (isSk) {
    injectJsonLd("seo-jsonld-organization", {
      ...orgCommon,
      url: baseSk,
      logo: {
        "@type": "ImageObject",
        url: "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/logos/logo-web-png-v2.png",
        width: 300,
        height: 60,
      },
      description:
        "Luxusné autokoberce na mieru pre viac ako 1 000 modelov áut, k nim rohož a box do kufra.",
      email: "info@luxurycardesign.sk",
      sameAs: [...orgCommon.sameAs, baseCz],
    });

    injectJsonLd("seo-jsonld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Luxury Car Design",
      url: baseSk,
      description:
        "Luxusné autokoberce na mieru pre všetky modely vozidiel — DragonSkin Diamond Line, Stripe Line, Hexa Line.",
      inLanguage: "sk-SK",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseSk}/vyhladavanie/?string={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    });

    if (isHomepage) {
      injectJsonLd("seo-jsonld-localbusiness", {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Luxury Car Design",
        image:
          "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/front_images/ogImage/hp.jpg",
        url: baseSk,
        telephone: "+421903660720",
        email: "info@luxurycardesign.sk",
        address: orgCommon.address,
        priceRange: "€€€",
        currenciesAccepted: "EUR",
        paymentAccepted: "Credit Card, Bank Transfer",
        areaServed: { "@type": "Country", name: "Slovakia" },
        sameAs: [
          "https://www.facebook.com/luxurycardes",
          "https://www.instagram.com/luxury_car_design_official",
        ],
      });
    }
  } else {
    // CZ
    injectJsonLd("seo-jsonld-organization", {
      ...orgCommon,
      url: baseCz,
      logo: {
        "@type": "ImageObject",
        url: "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/logos/logo-web-png-v2.png",
        width: 300,
        height: 60,
      },
      description:
        "Luxusní autokoberce na míru pro více než 1 000 modelů aut, k nim koberec a box do kufru.",
      email: "info@luxurycardesign.cz",
      areaServed: [
        { "@type": "Country", name: "Czech Republic" },
        { "@type": "Country", name: "Slovakia" },
      ],
      sameAs: [...orgCommon.sameAs, baseSk],
    });

    injectJsonLd("seo-jsonld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Luxury Car Design",
      url: baseCz,
      description:
        "Luxusní autokoberce na míru pro všechny modely vozidel — DragonSkin Diamond Line, Stripe Line, Hexa Line.",
      inLanguage: "cs-CZ",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseCz}/vyhledavani/?string={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    });

    if (isHomepage) {
      injectJsonLd("seo-jsonld-localbusiness", {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Luxury Car Design",
        image:
          "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/front_images/ogImage/hp.jpg",
        url: baseCz,
        telephone: "+421903660720",
        email: "info@luxurycardesign.cz",
        address: orgCommon.address,
        priceRange: "Kč Kč Kč",
        currenciesAccepted: "CZK",
        paymentAccepted: "Credit Card, Bank Transfer",
        areaServed: [
          { "@type": "Country", name: "Czech Republic" },
          { "@type": "Country", name: "Slovakia" },
        ],
      });
    }
  }

  // ─────────────────────────────────────────────────
  // Fix #9 — hreflang trio
  // Páry adries SK ↔ CZ sú v seo-hreflang.js; stránka bez protějšku odkazy
  // nedostane (odkaz na neexistujúcu adresu Google celý pár zahodí).
  // ─────────────────────────────────────────────────
  const cesty = cestyStranky(location.pathname, isSk);
  if (cesty) {
    injectLink("alternate", { hreflang: "sk-SK", href: baseSk + cesty.sk });
    injectLink("alternate", { hreflang: "cs-CZ", href: baseCz + cesty.cz });
    injectLink("alternate", { hreflang: "x-default", href: baseSk + cesty.sk });
  }

  // ─────────────────────────────────────────────────
  // Fix #3 — H1 text replace (sr-only zachované)
  // Pôvodný H1 "Vitajte v našom obchode" / "Vítejte v našem obchodě" je
  // generic + nezaujímavý pre Google. Replace na value-prop text.
  // ⚠️ Pôvodne sme robili reveal cez .lcd-hero-h1 ale výsledok bol
  // biely pruh nad hero obrázkom (na PC bez textu, na mobile zlatý
  // text) ktorý vizuálne ruší. Preto necháme sr-only — Google číta
  // value-prop, používateľ neuvidí žiadny biely pruh.
  // ─────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    if (!isHomepage) return; // Iba homepage

    const h1List = document.querySelectorAll("h1");
    const newText = isSk
      ? "Luxusné autokoberce DragonSkin — na mieru pre vaše auto"
      : "Luxusní autokoberce DragonSkin — na míru pro vaše auto";

    h1List.forEach((h1) => {
      const t = h1.textContent.trim();
      // Replace iba ak ide o generic Shoptet placeholder
      if (
        /Vitajte v našom obchode/i.test(t) ||
        /Vítejte v našem obchodě/i.test(t)
      ) {
        h1.textContent = newText;
        // sr-only ZACHOVANÉ — žiadny biely pruh nad hero
        // Google + screen readers čítajú value-prop H1 normálne
      }
    });
  });

  // ─────────────────────────────────────────────────
  // Fix #10 (partial) — Hotjar disable preventive
  // Plné odstránenie musí byť v Shoptet admin > Marketing & SEO >
  // Externé skripty. Tu len no-op-neme window.hj aby sa neodposluchávali
  // eventy (latency saving).
  // ─────────────────────────────────────────────────
  try {
    if (!window.hj) {
      window.hj = function () {};
      window.hj.q = window.hj.q || [];
    }
  } catch (e) {
    /* noop */
  }

  // ─────────────────────────────────────────────────
  // Fix #7 (partial) — Anti-FOUC unblock
  // Niektoré template snippety mali <style>body{display:none}</style>
  // ako anti-FOUC hack — blokuje first paint. Force display ak je tam.
  // ─────────────────────────────────────────────────
  try {
    if (
      document.body &&
      getComputedStyle(document.body).display === "none"
    ) {
      document.body.style.display = "";
    }
  } catch (e) {
    /* noop */
  }
})();
