// Detekcia stránky darčekovej poukážky bez Reactu (zrýchlenie 25. 10. 2026): productPage.js potrebuje len isVoucherPage();
// starý React konfigurátor poukážky (index.jsx) sa od 4. 10. 2026 nemontuje (nahradil ho lcdPoukazka.js), takže
// do luxuryCar.js už nepatrí. index.jsx túto funkciu len preberá (test-voucher-mount.mjs).

/**
 * Stránka poukazu? Detekcia podľa slugu (/darcekova-poukazka/) alebo H1
 * textu ("poukáž"/"poukaz"). Slug over/uprav podľa reálnej Shoptet stránky
 * (viď plán — stránka sa vytvára spolu s XML importom mincí).
 */
export function isVoucherPage() {
  try {
    if (/darcekova-poukaz/i.test(window.location.pathname)) return true;
    const h1 = document.querySelector("h1");
    const t = (h1 && h1.textContent) || "";
    return /darčekov[aá]\s+pouk[aá]ž|darcekova\s+poukaz/i.test(t);
  } catch (e) {
    return false;
  }
}
