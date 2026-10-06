// Základ adresy našich súborov na CDN.
// Každé nasadenie nahrá luxuryCar.js aj s pomocnými súbormi do vlastného priečinka
// .../assets/v/<verzia>/ a živý web sa prepne až zmenou adresy v Shoptet admine
// (Michal 6. 10. 2026). Keď je bundle načítaný z takého priečinka, pomocné skripty
// (recenzie, videá, poukážka) sa berú z tej istej verzie, nie zo spoločných súborov.
// Inak (stará adresa assets/js/luxuryCar.js?v=…) ostáva spoločný základ ako doteraz.
// document.currentScript platí len počas prvého spustenia bundla, preto sa číta hneď.
const SPOLOCNY = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/";

function zisti() {
  try {
    const s = document.currentScript && document.currentScript.src;
    const m = s && /^(https:\/\/[^?#]*\/eshopy\/luxuryCar\/assets\/v\/[^/?#]+\/)js\/luxuryCar\.js(?:[?#].*)?$/.exec(s);
    if (m) return m[1];
  } catch (e) {}
  return SPOLOCNY;
}

export const LCD_ZAKLAD = zisti();
