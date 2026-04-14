/**
 * Entry point pro truck konfigurátor.
 *
 * Exportuje funkci `renderTruckConfigurator`, kterou `productPage.js`
 * volá po vložení mount elementu do `.p-info-wrapper` (jen na /test-truck/).
 * esbuild tenhle modul zabaluje přímo do hlavního bundlu `luxuryCar.js`
 * stejně jako jakýkoliv jiný importovaný soubor (productPage.js, header.js…).
 *
 * Konfigurátor pochází z repa `luxusnerohoze-dev/konfigurator`. Zdroj
 * `konfigurator.jsx` má chirurgicky odebraný ĽAVÝ STĹPEC – používáme jen
 * pravou výběrovou stranu; levý sloupec Shoptetu (galerie + popis) zůstává.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { Configurator } from "./konfigurator.jsx";

const MOUNTED_ATTR = "data-tk-mounted";

export function renderTruckConfigurator(element) {
  if (!element) return false;
  if (element.getAttribute(MOUNTED_ATTR) === "1") return true;
  element.setAttribute(MOUNTED_ATTR, "1");
  createRoot(element).render(React.createElement(Configurator));
  return true;
}
