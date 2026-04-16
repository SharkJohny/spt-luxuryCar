/**
 * Entry point pro truck konfigurátor.
 *
 * Bundluje se přes stejný esbuild pipeline jako hlavní `script.js`
 * (viz `package.json` → `build:truck`). Výstup je jediný soubor
 * `assets/js/truck-konfigurator/app.js` s React + ReactDOM + Configurator
 * komponentou (z `konfigurator.jsx` z repa `luxusnerohoze-dev/konfigurator`,
 * chirurgicky ořezaný o ĽAVÝ STĹPEC – jen výběrová pravá strana).
 *
 * Script se načítá na vyžádání z `productPage.js` pouze na stránce
 * `/test-truck/`; zbytek e-shopu není nijak ovlivněn.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { Configurator } from "./konfigurator.jsx";

const MOUNT_SELECTOR = "#truck-konfigurator-root";
const MOUNTED_ATTR = "data-tk-mounted";
const MAX_TRIES = 60;
const RETRY_INTERVAL_MS = 100;

function tryMount() {
  const el = document.querySelector(MOUNT_SELECTOR);
  if (!el) return false;
  if (el.getAttribute(MOUNTED_ATTR) === "1") return true;
  el.setAttribute(MOUNTED_ATTR, "1");
  createRoot(el).render(React.createElement(Configurator));
  return true;
}

(function bootTruckKonfigurator() {
  if (tryMount()) return;

  let tries = 0;
  const iv = setInterval(() => {
    if (tryMount() || ++tries > MAX_TRIES) clearInterval(iv);
  }, RETRY_INTERVAL_MS);
})();
