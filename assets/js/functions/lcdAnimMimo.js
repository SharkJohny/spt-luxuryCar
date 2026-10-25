// Nekonečné CSS animácie mimo obrazovky pozastaviť (zrýchlenie 25. 10. 2026).
// Lesk tlačidiel a štítkov (lcdh-sheen), šípky (lcdh-pfScroll) a pás galérie (lxPas) bežia nekonečne aj mimo okna; každý
// snímok tak žiada prepočet štýlov a vykreslenie. Meranie (titulka aj 1V produkt, telefón, CPU 4×, 6 s bez pohybu):
// hlavné vlákno 2,0 s s animáciami vs 0,3–0,4 s bez nich. Tu sa animácia, ktorej prvok je ďaleko od okna, pozastaví cez
// Web Animations API (CSS sa nemení, vzhľad v okne ostáva) a pri priblížení znova spustí. Konečné animácie (nástupy) nie.
const OKRAJ = "300px 0px";

export function initAnimMimo() {
  if (typeof IntersectionObserver === "undefined" || typeof document.getAnimations !== "function") return;
  const mapa = new Map(); // prvok -> Set(Animation)
  const vidno = new WeakMap();
  const io = new IntersectionObserver((zaznamy) => {
    zaznamy.forEach((z) => {
      vidno.set(z.target, z.isIntersecting);
      nastav(z.target);
    });
  }, { rootMargin: OKRAJ });

  function nastav(prvok) {
    const set = mapa.get(prvok);
    if (!set || !vidno.has(prvok)) return;
    const ukaz = vidno.get(prvok);
    set.forEach((a) => {
      try {
        if (ukaz && a.playState === "paused") a.play();
        else if (!ukaz && a.playState === "running") a.pause();
      } catch (e) { /* animácia medzitým zrušená */ }
    });
  }

  function skenuj() {
    mapa.forEach((set, prvok) => {
      if (!prvok.isConnected) { io.unobserve(prvok); mapa.delete(prvok); }
    });
    let animacie;
    try { animacie = document.getAnimations(); } catch (e) { return; }
    animacie.forEach((a) => {
      const ef = a.effect;
      const prvok = ef && ef.target;
      if (!prvok || !ef.getTiming || ef.getTiming().iterations !== Infinity) return;
      let set = mapa.get(prvok);
      if (!set) { set = new Set(); mapa.set(prvok, set); io.observe(prvok); }
      if (!set.has(a)) { set.add(a); nastav(prvok); }
    });
  }

  // animácie pribúdajú s obsahom (titulka, obsah 1V, recenzie, prekreslenie konfigurátora) -> sken pri štarte, po load
  // a potom každých 5 s, kým je karta viditeľná (getAnimations ~30 položiek, lacné)
  skenuj();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(skenuj, 0));
  addEventListener("load", skenuj);
  setInterval(() => { if (!document.hidden) skenuj(); }, 5000);
}
