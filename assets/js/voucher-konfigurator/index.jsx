/**
 * Entry point pre konfigurátor darčekovej poukážky.
 *
 * Exportuje `isVoucherPage()` (detekcia) a `mountVoucherConfigurator()`
 * (mount), ktoré `productPage.js` volá analogicky k truck-konfigurátoru:
 * plný takeover produktovej stránky (early return v initProduct()).
 *
 * ErrorBoundary zabezpečuje, že prípadná runtime chyba v konfigurátore
 * nespôsobí bielu stránku — namiesto toho sa zobrazí fallback so správou
 * a debug info (rovnaký princíp ako truck-konfigurator/index.jsx).
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { VoucherApp } from "./konfigurator.jsx";
import { injectVoucherStyles, ROOT_ID } from "./styles.js";

const MOUNTED_ATTR = "data-vk-mounted";

class VoucherErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[voucher-konfig] ErrorBoundary caught:", error, info);
    if (typeof window !== "undefined") {
      window.__voucherKonfigError = { message: String(error), stack: error && error.stack, info };
    }
  }
  render() {
    if (this.state.error) {
      return React.createElement(
        "div",
        {
          style: {
            padding: 24,
            background: "#fff4f4",
            border: "2px solid #d32f2f",
            borderRadius: 10,
            color: "#333",
            fontFamily: "system-ui, sans-serif",
            maxWidth: 720,
            margin: "24px auto",
          },
        },
        React.createElement(
          "div",
          { style: { fontSize: 16, fontWeight: 700, color: "#d32f2f", marginBottom: 8 } },
          "Konfigurátor poukážky zlyhal pri renderovaní",
        ),
        React.createElement(
          "div",
          { style: { fontSize: 13, marginBottom: 8 } },
          "Pozrite sa do DevTools Console — podrobnosti sú tiež v ",
          React.createElement("code", null, "window.__voucherKonfigError"),
          ".",
        ),
        React.createElement(
          "pre",
          {
            style: {
              background: "#fff",
              border: "1px solid #eee",
              padding: 12,
              borderRadius: 6,
              fontSize: 11,
              color: "#666",
              overflow: "auto",
              maxHeight: 240,
              whiteSpace: "pre-wrap",
            },
          },
          String((this.state.error && this.state.error.stack) || this.state.error),
        ),
      );
    }
    return this.props.children;
  }
}

// isVoucherPage je v stranka.js (bez Reactu, aby productPage.js nevťahoval React do luxuryCar.js)
export { isVoucherPage } from "./stranka.js";

export function renderVoucherConfigurator(element) {
  if (!element) return false;
  if (element.getAttribute(MOUNTED_ATTR) === "1") return true;
  element.setAttribute(MOUNTED_ATTR, "1");
  injectVoucherStyles();
  createRoot(element).render(
    React.createElement(VoucherErrorBoundary, null, React.createElement(VoucherApp)),
  );
  return true;
}

/** Mount: vlož root element do produktovej stránky (retry na neskorý DOM). */
export function mountVoucherConfigurator() {
  document.body && document.body.classList.add("is-voucher-konfigurator");

  const tryMount = () => {
    if (document.getElementById(ROOT_ID)) return true;
    const wrapper = document.querySelector(".p-info-wrapper");
    if (!wrapper) return false;

    const el = document.createElement("div");
    el.id = ROOT_ID;
    wrapper.innerHTML = "";
    wrapper.appendChild(el);
    return renderVoucherConfigurator(el);
  };

  if (tryMount()) return;
  let tries = 0;
  const iv = setInterval(() => {
    if (tryMount() || ++tries > 40) clearInterval(iv);
  }, 100);
}
