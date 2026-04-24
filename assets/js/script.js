/**
 * DEV BOOTSTRAP — loaded by Bender at dev time (localhost:3010).
 *
 * Why this file is so short:
 *   The real application source lives in `assets/js/main.js` and its
 *   imports (including JSX files under `assets/js/truck-konfigurator/`).
 *   Browsers cannot execute `.jsx` directly, so if Bender injected the
 *   raw source graph it would explode at module-load and nothing would
 *   ever mount — including the `$("body").addClass("is-truck-konfigurator")`
 *   call that shows the truck konfigurator on `/test-truck/`.
 *
 *   Instead we ship the pre-built bundle `assets/js/luxuryCar.js` (esbuild
 *   output of `main.js`) and this bootstrap just injects it. That way:
 *     • dev loads the same compiled bundle that production uses,
 *     • the truck konfigurator mounts correctly,
 *     • CI keeps building `luxuryCar.js` from `main.js` (not from this file,
 *       which would otherwise cause a circular build input).
 *
 *   Keep `yarn build` (watch mode) running alongside Bender so edits to
 *   `main.js`, `productPage.js`, `konfigurator.jsx` et al. re-bundle into
 *   `luxuryCar.js` automatically.
 */
(() => {
  if (typeof window === "undefined") return;
  if (window.__LUXURYCAR_BOOTSTRAPPED__) return;
  window.__LUXURYCAR_BOOTSTRAPPED__ = true;

  const existing = document.querySelector(
    'script[data-luxurycar-bundle="1"]',
  );
  if (existing) return;

  const bust = Date.now();
  const s = document.createElement("script");
  s.type = "module";
  s.src = "/assets/js/luxuryCar.js?b=" + bust;
  s.dataset.luxurycarBundle = "1";
  s.onerror = (e) => {
    // eslint-disable-next-line no-console
    console.error(
      "[luxuryCar bootstrap] Failed to load /assets/js/luxuryCar.js — " +
        "did `yarn build` produce it?",
      e,
    );
  };
  (document.head || document.documentElement).appendChild(s);
})();
