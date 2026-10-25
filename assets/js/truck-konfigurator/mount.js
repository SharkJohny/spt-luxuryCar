// Montáž React konfigurátora kamiónov (SK 640 /luxusne-autokoberce-kamiony/, CZ /luxusni-autokoberce-kamiony/).
// Presunuté 1:1 z components/productPage.js (18. 10. 2026, docs/kamiony-1v-plan.md §1.2), aby ho mohol zavolať aj nový
// konfigurátor 1V ako poistku (konfigurator1v/kamion/index.js zlozit -> mountTruckConfigurator). Bez flagu ?novy= sa
// vykoná ten istý kód v tom istom poradí ako predtým (productPage.js initProduct).
// 25. 10. 2026 (zrýchlenie): React (index.jsx) je samostatná časť js/lcd-truck.js (cast.jsx, functions/lcdCasti.js) —
// ostatné stránky webu ho nesťahujú. Stránka kamiónov ho začne sťahovať hneď pri spustení bundla (predpripravTruck),
// paralelne s data.json; vykreslí sa po namontovaní ako predtým.
import { nacitajCast } from "../functions/lcdCasti.js";

/** Na produktovej stránke kamiónov (bez nového vzhľadu 1V) spustí sťahovanie React časti vopred; inde nerobí nič. */
export function predpripravTruck(bude1v) {
  try {
    if (document.getElementById("product-detail-form") && isTruckConfiguratorPage() && !bude1v()) nacitajCast("truck").catch(() => {});
  } catch (e) { /* ignore */ }
}

function renderTruckConfigurator(el) {
  nacitajCast("truck")
    .then((c) => {
      zrusChybu(el);
      // trieda skryje formulár Shoptetu v stĺpci; pridá sa až s vykreslením Reactu, aby stĺpec neposkočil dvakrát
      // (najprv prázdny, potom React: Lighthouse CLS 0,19 -> 0,40 pri meraní 25. 10. 2026)
      $("body").addClass("is-truck-konfigurator");
      c.renderTruckConfigurator(el);
    })
    .catch((e) => {
      console.error("[truck-konfig] React časť sa nenačítala", e);
      ukazChybu(el);
    });
}

/* Časť sa nestiahla ani na 3. pokus (výpadok siete): namiesto prázdneho stĺpca sa ukáže formulár Shoptetu (dá sa objednať)
   a nad ním hláška s „Načítať znova“; to isté sa skúsi samo, keď sa telefón znova pripojí. */
function ukazChybu(el) {
  const wrap = el.parentNode;
  if (!wrap || wrap.querySelector(".truck-konfigurator-chyba")) return;
  const cz = /luxurycardesign\.cz$/i.test(window.location.hostname || "");
  const box = document.createElement("div");
  box.className = "truck-konfigurator-chyba";
  box.setAttribute("role", "alert");
  box.style.cssText = "margin:0 0 16px;padding:14px 16px;border:1px solid #e8c3bd;border-radius:12px;background:#fdf4f3;color:#14110c;font:400 16px/1.5 'Source Sans 3',Arial,sans-serif";
  box.textContent = cz
    ? "Konfigurátor se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu. "
    : "Konfigurátor sa nepodarilo načítať. Skontrolujte pripojenie a skúste to znova. ";
  const tl = document.createElement("button");
  tl.type = "button";
  tl.textContent = cz ? "Načíst znovu" : "Načítať znova";
  tl.style.cssText = "display:inline-block;margin-top:8px;min-height:44px;padding:0 18px;border:0;border-radius:10px;background:#1f7d4f;color:#fff;font:700 15px/44px 'Exo 2',Arial,sans-serif;cursor:pointer";
  const znova = () => { window.removeEventListener("online", znova); renderTruckConfigurator(el); };
  tl.addEventListener("click", znova);
  window.addEventListener("online", znova);
  box.appendChild(tl);
  wrap.insertBefore(box, el);
  $("body").removeClass("is-truck-konfigurator");
}

function zrusChybu(el) {
  const box = el.parentNode && el.parentNode.querySelector(".truck-konfigurator-chyba");
  if (box) box.remove();
}

/* =========================================================================
 * TRUCK KONFIGURÁTOR – izolovaný embed
 * =========================================================================
 * Pro jediný testovací produkt `/test-truck/` vyměníme celou plochu detailu
 * produktu za iframe s novým konfigurátorem (standalone React app ze souboru
 * assets/truck-konfigurator/index.html). Žádná funkcionalita osobáků se tím
 * nemění – hlavní větev initProduct() se na truck stránce vůbec nespustí.
 *
 * Záměrně zatím neřešíme:
 *  - napojení na Shoptet košík / parametry produktu
 *  - předvýběr jazyka
 *  - postMessage komunikaci s rodičem
 * To doplníme v další iteraci.
 * ========================================================================= */
/**
 * Truck konfigurátor sa aktivuje na produktovej stránke, ktorej H1
 * obsahuje slovo "TRUCK" (case-insensitive). Tým pokrýva:
 *  - test produkt /luxusne-autokoberce-truck---test-konfigurator/
 *  - akýkoľvek budúci truck produkt s "TRUCK" v názve, bez nutnosti
 *    pridávať URL slug do kódu.
 *
 * Fallback: starý slug /test-truck/ (prototyp bez reálneho Shoptet
 * produktu na lokáli) detekujeme aj URL-om, lebo tam H1 nemusí byť.
 */
export function isTruckConfiguratorPage() {
  try {
    const cesta = window.location.pathname || "";
    if (/\/test-truck(\/|$)/i.test(cesta)) return true;
    // Michal 2026-09-01 premenoval produkt z "truck" na "kamiony" — H1 uz
    // slovo truck neobsahuje a konfigurator prestal nabiehat. Berieme oboje.
    if (/autokoberce-(truck|kamiony)(\/|$)/i.test(cesta)) return true;
    const h1 = document.querySelector("h1");
    const nadpis = h1 ? h1.textContent || "" : "";
    if (/\btruck\b/i.test(nadpis)) return true;
    if (/kami[oó]n/i.test(nadpis)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

export function mountTruckConfigurator() {
  // body.is-truck-konfigurator pridá renderTruckConfigurator až pri vykreslení (React je samostatná časť lcd-truck.js)

  // Verbose log pre vývoj – každá zmena stavu konfigurátora vypíše
  // rozpis ceny do konzoly. Na produkcii vypnuté (iba na localhoste).
  try {
    const host = (window.location && window.location.hostname) || "";
    if (/^localhost$|^127\.0\.0\.1$|\.local$/i.test(host)) {
      window.__TRUCK_KONFIG_VERBOSE__ = true;
      // eslint-disable-next-line no-console
      console.log(
        "%c[truck-konfig] verbose mode ON – ceny vidíš v panele i v tomto logu. " +
          "Aktuálny výpočet: window.__truckKonfig",
        "color:#C5A44E;font-weight:600",
      );
    }
  } catch (e) { /* ignore */ }

  const placeMountNode = () => {
    const $host = $(".col-xs-12.col-lg-6.p-info-wrapper").first().length
      ? $(".col-xs-12.col-lg-6.p-info-wrapper").first()
      : $(".p-info-wrapper").first();
    if (!$host.length) return null;

    $host.addClass("active");

    let mountEl = document.getElementById("truck-konfigurator-root");
    if (mountEl) return mountEl;

    const $wrap = $("<div>", { class: "truck-konfigurator-wrap" });
    mountEl = document.createElement("div");
    mountEl.id = "truck-konfigurator-root";
    $wrap.append(mountEl);
    $host.append($wrap);
    return mountEl;
  };

  const mountEl = placeMountNode();
  if (mountEl) { renderTruckConfigurator(mountEl); return; }

  let tries = 0;
  const iv = setInterval(() => {
    const el = placeMountNode();
    if (el) { clearInterval(iv); renderTruckConfigurator(el); return; }
    if (++tries > 40) clearInterval(iv);
  }, 100);
}
