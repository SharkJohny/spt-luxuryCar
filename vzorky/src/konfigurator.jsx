/* konfigurator.jsx
 * Konfigurátor vzoriek — Luxury Car Design
 * Pozn.: Tento súbor je zrkadlo JSX-u, ktorý beží inline v index.html
 *        (aby konfigurátor fungoval aj cez file:// bez CORS).
 *        Pri úprave meníme konfigurator.jsx a paralelne index.html.
 */

// --- DATA -------------------------------------------------------------------

// encodeURI zabezpečí, že medzery v cestách (napr. "diamond line/") nelamú
// ani CSS url(...) ani <img src="...">. Diakritiku ponecháme ako je, browser
// zvláda UTF-8 v URL bez problému.
const IMG = (path) => "./images/web/" + path.split("/").map(encodeURIComponent).join("/");

const DIAMOND = [
  { id: "D-1",  label: "Čierna prešívaná červenou",  img: IMG("1.vrstva/diamond line/1_Luxury_car_design_luxusne_autokoberce_cierna_presivana_cervenou.jpg") },
  { id: "D-2",  label: "Čierna prešívaná modrou",    img: IMG("1.vrstva/diamond line/2_Luxury_car_design_luxusne_autokoberce_cierna_presivana_modoru.jpg") },
  { id: "D-3",  label: "Čierna prešívaná čiernou",   img: IMG("1.vrstva/diamond line/3_Luxury_car_design_luxusne_autokoberce_cierna_presivana_ciernou.jpg") },
  { id: "D-4",  label: "Čierna prešívaná béžovou",   img: IMG("1.vrstva/diamond line/4_Luxury_car_design_luxusne_autokoberce_cierna_presivana_bezovou.jpg") },
  { id: "D-5",  label: "Čierna prešívaná sivou",     img: IMG("1.vrstva/diamond line/5_Luxury_car_design_luxusne_autokoberce_cierna_presivana_sedou.jpg") },
  { id: "D-6",  label: "Čierna prešívaná bielou",    img: IMG("1.vrstva/diamond line/6_Luxury_car_design_luxusne_autokoberce_cierna_presivana_bielou.jpg") },
  { id: "D-7",  label: "Čierna prešívaná žltou",     img: IMG("1.vrstva/diamond line/7_Luxury_car_design_luxusne_autokoberc_cierna_presivana_zltou.jpg") },
  { id: "D-8",  label: "Čierna prešívaná zelenou",   img: IMG("1.vrstva/diamond line/8_Luxury_car_design_luxusne_autokoberce_cierna_presivana_zelenou.jpg") },
  { id: "D-9",  label: "Čierna prešívaná bronzovou", img: IMG("1.vrstva/diamond line/9_Luxury_car_design_luxusne_autokoberce_cierna_presivana_bronzovou.jpg") },
  { id: "D-10", label: "Béžová",                     img: IMG("1.vrstva/diamond line/10_Luxury_car_design_luxusne_autokoberce_bezova.jpg") },
  { id: "D-11", label: "Hnedá káva",                 img: IMG("1.vrstva/diamond line/11_Luxury_car_design_luxusne_autokoberce_heda_kava.jpg") },
  { id: "D-12", label: "Hnedá",                      img: IMG("1.vrstva/diamond line/12_Luxury_car_design_luxusne_autokoberce_bledo_hneda.jpg") },
  { id: "D-13", label: "Vínovo červená",             img: IMG("1.vrstva/diamond line/13_Luxury_car_design_luxusne_autokoberce_vinovo_cerevena.jpg") },
  { id: "D-14", label: "Červená",                    img: IMG("1.vrstva/diamond line/14_Luxury_car_design_luxusne_autokoberce_cervena.jpg") },
  { id: "D-15", label: "Šedá",                       img: IMG("1.vrstva/diamond line/15_Luxury_car_design_luxusne_autokoberce_seda.jpg") },
  { id: "D-16", label: "Oranžová",                   img: IMG("1.vrstva/diamond line/16_Luxury_car_design_luxusne_autokoberce_oranzova.jpg") },
  { id: "D-17", label: "Modrá",                      img: IMG("1.vrstva/diamond line/17_Luxury_car_design_luxusne_autokoberce_modra.jpg") },
  { id: "D-18", label: "Fialová",                    img: IMG("1.vrstva/diamond line/18_Luxury_car_design_luxusne_autokoberce_fialova.jpg") },
];

const STRIPE = [
  { id: "S-1", label: "Štandard 29",                 img: IMG("1.vrstva/stripe line/1_Luxury_car_design_luxusne_autokoberce_29.jpg") },
  { id: "S-2", label: "Čierna prešívaná béžovou",    img: IMG("1.vrstva/stripe line/2_Luxury_car_design_luxusne_autokoberce_cierna_presivana_bezovou.jpg") },
  { id: "S-3", label: "Čierna prešívaná čiernou",    img: IMG("1.vrstva/stripe line/3_Luxury_car_design_luxusne_autokoberce_cierna_presivana_ciernou.jpg") },
  { id: "S-4", label: "Béžová",                      img: IMG("1.vrstva/stripe line/4_Luxury_car_design_luxusne_autokoberce_bezova.jpg") },
  { id: "S-5", label: "Hnedá káva",                  img: IMG("1.vrstva/stripe line/5_Luxury_car_design_luxusne_autokoberce_hneda_kava.jpg") },
  { id: "S-6", label: "Hnedá",                       img: IMG("1.vrstva/stripe line/6_Luxury_car_design_luxusne_autokoberce_bledo_hneda.jpg") },
  { id: "S-7", label: "Vínovo červená",              img: IMG("1.vrstva/stripe line/7_Luxury_car_design_luxusne_autokoberce_vinovo_cervena.jpg") },
  { id: "S-8", label: "Červená",                     img: IMG("1.vrstva/stripe line/8_Luxury_car_design_luxusne_autokoberce_cervena.jpg") },
];

const HEXA = [
  { id: "H-1", label: "Čierna prešívaná červenou",   img: IMG("1.vrstva/hexa line/1_Luxury_car_design_luxusne_autokoberce_cierna_presivana_cervenou.jpg") },
  { id: "H-2", label: "Čierna prešívaná modrou",     img: IMG("1.vrstva/hexa line/2_Luxury_car_design_luxusne_autokoberce_cierna_presivana_modorou.jpg") },
  { id: "H-3", label: "Čierna prešívaná čiernou",    img: IMG("1.vrstva/hexa line/3_Luxury_car_design_luxusne_autokoberce_cierna_presivana_ciernou.jpg") },
];

// 2. vrstva — posielame iba LUX-10 (čierna). Ostatné Lux Color farby sú len
// náhľady (orderable: false). Comfort rad bol odstránený — nemáme ho v ponuke.
// Dve položky NEW-A a NEW-B sú pridané neskôr používateľom (červeno-čierna
// a čierna melanžová textúra), fotky treba uložiť do images/web/2.vrstva/new/.
const SECOND = [
  { id: "LUX-10", group: "Lux Color", label: "Lux Color 10 — čierna", orderable: true,  img: IMG("2.vrstva/1_Luxury_car_design_luxusne_autokoberce_lux_color_10.jpg") },
  { id: "LUX-01", group: "Lux Color", label: "Lux Color 01",          orderable: false, img: IMG("2.vrstva/7_Luxury_car_design_luxusne_autokoberce_lux_color_01.jpg") },
  { id: "LUX-02", group: "Lux Color", label: "Lux Color 02",          orderable: false, img: IMG("2.vrstva/13_Luxury_car_design_luxusne_autokoberce_lux_color_02.jpg") },
  { id: "LUX-03", group: "Lux Color", label: "Lux Color 03",          orderable: false, img: IMG("2.vrstva/10Luxury_car_design_luxusne_autokoberce_lux_color_03.jpg") },
  { id: "LUX-04", group: "Lux Color", label: "Lux Color 04",          orderable: false, img: IMG("2.vrstva/6_Luxury_car_design_luxusne_autokoberce_lux_color_04.jpg") },
  { id: "LUX-05", group: "Lux Color", label: "Lux Color 05",          orderable: false, img: IMG("2.vrstva/11_Luxury_car_design_luxusne_autokoberce_lux_color_05.jpg") },
  { id: "LUX-06", group: "Lux Color", label: "Lux Color 06",          orderable: false, img: IMG("2.vrstva/9_Luxury_car_design_luxusne_autokoberce_lux_color_06.jpg") },
  { id: "LUX-07", group: "Lux Color", label: "Lux Color 07",          orderable: false, img: IMG("2.vrstva/5_Luxury_car_design_luxusne_autokoberce_lux_color_07.jpg") },
  { id: "LUX-08", group: "Lux Color", label: "Lux Color 08",          orderable: false, img: IMG("2.vrstva/8_Luxury_car_design_luxusne_autokoberce_lux_color_08.jpg") },
  { id: "LUX-09", group: "Lux Color", label: "Lux Color 09",          orderable: false, img: IMG("2.vrstva/12_Luxury_car_design_luxusne_autokoberce_lux_color_09.jpg") },
  { id: "LUX-11", group: "Lux Color", label: "Lux Color 11",          orderable: false, img: IMG("2.vrstva/3_Luxury_car_design_luxusne_autokoberce_lux_color_11.jpg") },
  { id: "LUX-12", group: "Lux Color", label: "Lux Color 12",          orderable: false, img: IMG("2.vrstva/2_Luxury_car_design_luxusne_autokoberce_lux_color_12.jpg") },
  { id: "LUX-13", group: "Lux Color", label: "Lux Color 13",          orderable: false, img: IMG("2.vrstva/4_Luxury_car_design_luxusne_autokoberce_lux_color_13.jpg") },
  // Nové vzorky Lux Color 14/15/16 — fotky treba uložiť do images/web/2.vrstva/new/
  // ako Lux_color_14.png, Lux_color_15.png, Lux_color_16.png
  { id: "LUX-14", group: "Lux Color", label: "Lux Color 14",          orderable: false, img: IMG("2.vrstva/new/Lux_color_14.png") },
  { id: "LUX-15", group: "Lux Color", label: "Lux Color 15",          orderable: false, img: IMG("2.vrstva/new/Lux_color_15.png") },
  { id: "LUX-16", group: "Lux Color", label: "Lux Color 16",          orderable: false, boost: true, img: IMG("2.vrstva/new/Lux_color_16.png") },
];

// Odporúčanie na 2. vrstvu (banner)
const RECOMMEND_RATE = 93; // % zákazníkov, ktorí si berú 2. vrstvu

const DEPOSIT_PER_SAMPLE = 5; // EUR

// --- UTILS ------------------------------------------------------------------

function findItem(id) {
  return (
    DIAMOND.find((x) => x.id === id) ||
    STRIPE.find((x) => x.id === id) ||
    HEXA.find((x) => x.id === id) ||
    SECOND.find((x) => x.id === id) ||
    null
  );
}

function isOrderable(id) {
  const it = findItem(id);
  if (!it) return false;
  if (id.startsWith("D-") || id.startsWith("S-") || id.startsWith("H-")) return true; // prvá vrstva — všetko objednávateľné
  return !!it.orderable; // druhá vrstva — iba Lux Color 10
}

function sectionTitle(id) {
  if (id.startsWith("D-")) return "Diamond Line";
  if (id.startsWith("S-")) return "Stripe Line";
  if (id.startsWith("H-")) return "Hexa Line";
  return "2. vrstva";
}

// Kratší popis pre výpis v súhrne / clipboardu. Pre LUX-10 chceme "čierna"
// namiesto "Lux Color 10 — čierna" (prefix je redundantný popri ID).
function shortLabel(id, label) {
  if (!label) return "?";
  if (id === "LUX-10") return "čierna";
  // všeobecne — odstráň prefix "Lux Color XX — " alebo "Comfort — " ak matchuje
  return label.replace(/^(Lux Color( \d+)?|Comfort) — /, "");
}

function orderSummary(ids) {
  const orderable = [...ids].filter(isOrderable);
  const count = orderable.length;
  const total = count * DEPOSIT_PER_SAMPLE;
  return { count, total, orderable };
}

// Slovenské plurály: 1 = vzorka, 2–4 = vzorky, inak vzoriek (22 = vzoriek).
// Pravidlo platí len pre jednotkové číslo (last digit) mimo rozsahu 11–14.
function pluralVzorka(n) {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return "vzorka";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "vzorky";
  return "vzoriek";
}

// --- BRAND TOKENS -----------------------------------------------------------

const GOLD = "#C5A44E";
const GOLD_DARK = "#A8893A";
const DARK = "#2E1810";
const CREAM = "#fdf8ec";
const BG = "#f9f7f2";
const BORDER = "#e0d5b8";

// --- COMPONENTS -------------------------------------------------------------

function NumberBadge({ children, big }) {
  const size = big ? 32 : 26;
  return (
    <span style={{
      minWidth: size, height: size, borderRadius: "50%",
      background: "rgba(255,255,255,0.22)",
      color: "#fff", display: "inline-flex", alignItems: "center",
      justifyContent: "center", fontSize: big ? 14 : 12, fontWeight: 800,
      flexShrink: 0,
    }}>{children}</span>
  );
}

function AccordionHeader({ label, open, onToggle, badge, count, level = 1, controls }) {
  const isSub = level === 2;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: isSub ? "10px 14px" : "14px 18px",
        borderRadius: open ? "8px 8px 0 0" : 8,
        background: isSub
          ? (open ? `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` : "#fff")
          : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
        color: isSub ? (open ? "#fff" : DARK) : "#fff",
        cursor: "pointer",
        border: isSub ? `2px solid ${BORDER}` : "none",
        userSelect: "none",
        transition: "all 0.2s",
        width: "100%", textAlign: "left", font: "inherit",
      }}
    >
      {badge ? <NumberBadge big={!isSub}>{badge}</NumberBadge> : null}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: isSub ? 13 : 15,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}>{label}</div>
      </div>
      {typeof count === "number" && count > 0 ? (
        <span style={{
          background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
          color: "#fff", padding: "2px 10px", borderRadius: 12,
          fontSize: 12, fontWeight: 800,
          boxShadow: "0 2px 6px rgba(76,175,80,0.4)",
        }}>{count} ✓</span>
      ) : null}
      <span aria-hidden="true" style={{
        background: open
          ? "rgba(255,255,255,0.22)"
          : (typeof count === "number" && count > 0
              ? (isSub ? GOLD : "rgba(255,255,255,0.28)")
              : (isSub ? "rgba(46,24,16,0.08)" : "rgba(255,255,255,0.18)")),
        color: (isSub && !open && !(typeof count === "number" && count > 0)) ? DARK : "#fff",
        padding: "5px 12px",
        borderRadius: 14,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        {open
          ? "Zavrieť"
          : (typeof count === "number" && count > 0 ? "Zmeniť" : "+ Pridať")}
      </span>
      <span aria-hidden="true" style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.25s",
        fontSize: 14, display: "inline-block",
      }}>▼</span>
    </button>
  );
}

function AccordionBody({ open, children }) {
  return (
    <div style={{
      maxHeight: open ? 5000 : 0,
      overflow: "hidden",
      transition: "max-height 0.4s ease",
      background: "#fafafa",
      borderRadius: "0 0 8px 8px",
      border: open ? `1px solid ${BORDER}` : "none",
      borderTop: "none",
    }}>
      <div style={{ padding: open ? "16px" : 0 }}>{children}</div>
    </div>
  );
}

function Swatch({ item, selected, onClick, notOrderable, isHighlightedOrderable }) {
  const ariaLabel =
    item.label +
    (notOrderable ? " — neposiela sa, slúži iba ako vizuálny náhľad" : "") +
    (selected ? " (vybraná)" : "");
  // Highlight zelený pre orderable LUX-10 (aby bola jasne odlíšená od náhľadov)
  const borderColor = selected
    ? GOLD
    : (isHighlightedOrderable ? "#4CAF50" : "#ddd");
  const borderWidth = (selected || isHighlightedOrderable) ? 3 : 2;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      aria-disabled={notOrderable}
      title={item.label + (notOrderable ? " — neposiela sa, len náhľad" : "")}
      style={{
        width: 128, height: 128, flexShrink: 0, padding: 0,
        borderRadius: 10,
        border: `${borderWidth}px solid ${borderColor}`,
        background: "#000",
        cursor: notOrderable ? "default" : "pointer",
        boxShadow: selected
          ? "0 8px 20px rgba(197,164,78,0.5)"
          : (isHighlightedOrderable ? "0 6px 16px rgba(76,175,80,0.4)" : "0 2px 6px rgba(0,0,0,0.08)"),
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: notOrderable ? (item.boost ? 1 : 0.85) : 1,
      }}
    >
      <img
        src={item.img}
        alt=""
        loading="lazy"
        onError={(e) => {
          e.target.style.display = "none";
          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
        }}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          display: "block",
          filter: notOrderable
            ? (item.boost ? "brightness(1.08) contrast(1.08)" : "saturate(0.85)")
            : "none",
        }}
      />
      <div aria-hidden="true" style={{
        display: "none",
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #2E1810 0%, #1a1008 100%)",
        color: "#C5A44E",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: 6, fontSize: 10, fontWeight: 700, lineHeight: 1.25,
      }}>
        {item.label}
      </div>
      {selected ? (
        <span aria-hidden="true" style={{
          position: "absolute", top: 6, right: 6,
          width: 24, height: 24, borderRadius: "50%",
          background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800,
          boxShadow: "0 2px 8px rgba(76,175,80,0.5)",
        }}>✓</span>
      ) : null}
      {isHighlightedOrderable && !selected ? (
        <span aria-hidden="true" style={{
          position: "absolute", top: 0, left: 0, right: 0,
          background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
          color: "#fff", padding: "3px 6px",
          fontSize: 9, fontWeight: 800, textAlign: "center",
          letterSpacing: 0.8, display: "block",
        }}>POSIELAME</span>
      ) : null}
      {notOrderable ? (
        <span aria-hidden="true" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "rgba(46,24,16,0.88)", color: "#fff",
          padding: "3px 6px", fontSize: 9, fontWeight: 800,
          textAlign: "center", letterSpacing: 0.6,
          display: "block",
        }}>NEPOSIELA SA</span>
      ) : null}
    </button>
  );
}

function InlinePreview({ item }) {
  if (!item) return null;
  return (
    <div style={{
      marginTop: 20,
      width: "100%",
      maxWidth: 360,
      marginLeft: "auto",
      marginRight: "auto",
      aspectRatio: "1 / 1",
      borderRadius: 14,
      overflow: "hidden",
      background: "#000",
      border: `2px solid ${GOLD}`,
      boxShadow: "0 12px 36px rgba(197,164,78,0.3)",
      position: "relative",
    }}>
      <img
        src={item.img}
        alt={item.label}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
      />
      <div style={{
        position: "absolute", top: 12, left: 12,
        background: "rgba(46,24,16,0.9)", color: "#fff",
        padding: "5px 10px", borderRadius: 6,
        fontSize: 11, fontWeight: 800, letterSpacing: 1,
      }}>{item.id}</div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "14px 14px 12px",
        background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)",
        color: "#fff",
      }}>
        <div style={{ fontSize: 10.5, color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>
          {sectionTitle(item.id)}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, lineHeight: 1.25 }}>
          {item.label}
        </div>
      </div>
    </div>
  );
}

function SkipTile({ active, onToggle, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 128 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        title={label || "Nechcem žiadnu z tejto kategórie"}
        style={{
          width: 128, height: 128, padding: 0,
          borderRadius: 10,
          border: active ? "3px solid #2E7D32" : "2px dashed #bbb",
          background: active
            ? "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)"
            : "#fafafa",
          color: active ? "#fff" : "#666",
          cursor: "pointer",
          fontSize: 38, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: active ? "0 8px 20px rgba(76,175,80,0.4)" : "0 2px 6px rgba(0,0,0,0.06)",
          transition: "all 0.2s",
        }}
      >
        {active ? "✓" : "⊘"}
      </button>
      <div style={{
        fontSize: 11, lineHeight: 1.3, fontWeight: 700,
        color: active ? "#2E7D32" : DARK, textAlign: "center", minHeight: 30,
      }}>
        {active ? "Nechcem ✓" : "Nechcem"}
      </div>
    </div>
  );
}

function ContinueButton({ label, onClick }) {
  if (!onClick) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
          color: "#fff",
          border: "none",
          padding: "14px 36px",
          borderRadius: 30,
          fontSize: 14, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: 1.5,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(76,175,80,0.45)",
          transition: "all 0.2s",
        }}
      >
        {label || "Pokračovať"} →
      </button>
    </div>
  );
}

function SwatchGrid({ items, selected, toggle, previewOnly, lockedBadge, highlightOrderable, lastClicked, onContinue, continueLabel, skipSection, skipActive, onToggleSkip, skipLabel }) {
  const previewItem = lastClicked
    ? items.find((x) => x.id === lastClicked)
    : null;
  return (
    <div>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "flex-start",
      }}>
        {skipSection ? (
          <SkipTile
            active={!!skipActive}
            onToggle={() => onToggleSkip && onToggleSkip(skipSection)}
            label={skipLabel}
          />
        ) : null}
        {items.map((it) => {
          const isLocked = lockedBadge && !it.orderable;
          const onClick = isLocked
            ? () => previewOnly && previewOnly(it.id)
            : () => toggle(it.id);
          return (
            <div key={it.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 128 }}>
              <Swatch
                item={it}
                selected={selected.has(it.id)}
                onClick={onClick}
                notOrderable={isLocked}
                isHighlightedOrderable={highlightOrderable && it.orderable}
              />
              <div style={{
                fontSize: 11, lineHeight: 1.3, fontWeight: 600,
                color: DARK, textAlign: "center", minHeight: 30,
              }}>{it.label.replace(/^(Comfort|Lux Color) — /, "")}</div>
            </div>
          );
        })}
      </div>
      <InlinePreview item={previewItem} />
      <ContinueButton label={continueLabel} onClick={onContinue} />
    </div>
  );
}

// Helper len pre produktové fotky
const IMG_PATH = (name) => "./images/product/" + encodeURIComponent(name);

const PRODUCT_PHOTOS = [
  { src: IMG_PATH("opt_SNY03228.jpg"),   alt: "Vzorky Dragonskin farieb na Diamond Line" },
  { src: IMG_PATH("opt_prloha_c_2.jpg"), alt: "Stripe Line — detail vzoriek a logo LCD" },
  { src: IMG_PATH("opt_SNY03230.jpg"),   alt: "Diamond Line — ďalšie farebné varianty" },
];

function ProductPhotos() {
  const [idx, setIdx] = React.useState(0);
  const photo = PRODUCT_PHOTOS[idx];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Hlavná fotka */}
      <div style={{
        position: "relative",
        borderRadius: 12, overflow: "hidden",
        background: "#000",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 12px 36px rgba(46,24,16,0.22)",
        aspectRatio: "3 / 2",
      }}>
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            display: "block",
          }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "14px 16px",
          background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
          color: "#fff",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: GOLD, fontWeight: 800, textTransform: "uppercase" }}>
            Dragonskin vzorky
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
            Prémiový materiál na vlastný dotyk
          </div>
        </div>
      </div>

      {/* Thumbnaily v riadku — klik prepne hlavnú fotku */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${PRODUCT_PHOTOS.length}, 1fr)`,
        gap: 10,
      }}>
        {PRODUCT_PHOTOS.map((p, i) => {
          const active = i === idx;
          return (
            <button
              key={p.src}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={"Zobraziť fotku " + (i + 1)}
              aria-pressed={active}
              style={{
                padding: 0, cursor: "pointer",
                borderRadius: 10,
                border: active ? `3px solid ${GOLD}` : `2px solid #ddd`,
                background: "#000",
                overflow: "hidden",
                aspectRatio: "1 / 1",
                boxShadow: active ? "0 6px 16px rgba(197,164,78,0.4)" : "0 2px 6px rgba(0,0,0,0.08)",
                transition: "all 0.2s",
              }}
            >
              <img src={p.src} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Pôvodný Preview komponent sme nahradili ProductPhotos (vľavo) + InlinePreview
   (v subakordeóne). Ponechávame len pre spätnú kompatibilitu, ak by bol volaný. */
function Preview({ item }) {
  if (!item) return null;
  return (
    <div style={{
      width: "100%", maxWidth: 460, position: "relative",
      borderRadius: 12, overflow: "hidden",
      background: "#fff",
      border: `1px solid ${BORDER}`,
      boxShadow: "0 10px 30px rgba(46,24,16,0.12)",
    }}>
      <div style={{
        aspectRatio: "1 / 1",
        background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <img
          src={item.img}
          alt={item.label}
          style={{
            width: "100%", height: "100%",
            objectFit: "contain",
            objectPosition: "center center",
            display: "block",
          }}
        />
      </div>
      <div style={{
        position: "absolute", top: 12, left: 12,
        background: "rgba(46,24,16,0.85)", color: "#fff",
        padding: "6px 12px", borderRadius: 6,
        fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
      }}>{item.id}</div>
      <div style={{
        padding: "14px 18px", borderTop: `1px solid ${BORDER}`,
        background: CREAM,
      }}>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          {sectionTitle(item.id)}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginTop: 2 }}>
          {item.label}
        </div>
      </div>
    </div>
  );
}

function SecondLayerBanner({ selected, toggle, onPreview }) {
  const item = SECOND[0]; // LUX-10 (jediná položka 2. vrstvy na objednanie)
  const isSelected = selected.has(item.id);
  return (
    <div style={{
      position: "relative",
      marginBottom: 18,
      padding: 24,
      borderRadius: 16,
      background: isSelected
        ? "linear-gradient(135deg, #1b5e20 0%, #2e7d32 45%, #388e3c 100%)"
        : "linear-gradient(135deg, #14532d 0%, #166534 45%, #14532d 100%)",
      border: `3px solid ${isSelected ? "#81c784" : GOLD}`,
      color: "#fff",
      overflow: "hidden",
      boxShadow: "0 12px 36px rgba(20,83,45,0.4)",
      transition: "all 0.3s",
    }}>
      {/* dekoratívny accent vpravo hore */}
      <div aria-hidden="true" style={{
        position: "absolute", top: -40, right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(197,164,78,0.22) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Eyebrow — hviezdičky + label */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
      }}>
        <span aria-hidden="true" style={{ color: GOLD, fontSize: 14, letterSpacing: 2 }}>
          ★★★★★
        </span>
        <span style={{
          fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase",
          color: isSelected ? "#c8e6c9" : GOLD, fontWeight: 800,
        }}>
          {isSelected ? "✓ Pridané k objednávke" : "Top odporúčanie"}
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Horný riadok: thumbnail + "93 % ... berie aj 2. vrstvu" */}
        <div style={{
          display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap",
        }}>
          {/* Thumbnail LUX-10 */}
          <button
            type="button"
            onClick={() => onPreview && onPreview(item.id)}
            aria-label={"Zobraziť " + item.label + " v náhľade"}
            style={{
              width: 130, height: 130, borderRadius: 12, padding: 0,
              background: "#000",
              flexShrink: 0,
              border: `4px solid ${GOLD}`,
              boxShadow: "0 8px 24px rgba(197,164,78,0.4)",
              cursor: "pointer",
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s",
            }}
          >
            <img src={item.img} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
            />
          </button>

          {/* 93 % + headline v jednom riadku */}
          <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "nowrap" }}>
            <div style={{
              fontSize: 60, lineHeight: 1, fontWeight: 900,
              color: GOLD,
              textShadow: "0 2px 10px rgba(197,164,78,0.3)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}>
              {RECOMMEND_RATE}&nbsp;%
            </div>
            <div style={{
              fontSize: 15, fontWeight: 700, lineHeight: 1.3,
              color: "#fff", opacity: 0.95,
            }}>
              zákazníkov si k 1. vrstve berie aj vzorku 2. vrstvy
            </div>
          </div>
        </div>

        {/* Popis na plnú šírku — čistá typografická hierarchia */}
        <div style={{ marginTop: 18 }}>
          <div style={{
            fontSize: 15, fontWeight: 800, color: GOLD,
            letterSpacing: 0.3,
          }}>
            Lux Color 10 — čierna
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 18, paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.15)",
        display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          {isSelected ? "Pridané ✓ Klikni znova na odobratie" : "Pridať Lux Color 10 do objednávky"}
        </span>
        <button
          type="button"
          onClick={() => toggle(item.id)}
          aria-pressed={isSelected}
          style={{
            background: isSelected
              ? "#fff"
              : "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
            color: isSelected ? "#1b5e20" : "#fff",
            border: "none",
            padding: "14px 28px",
            borderRadius: 30,
            fontSize: 14, fontWeight: 900,
            textTransform: "uppercase", letterSpacing: 1.5,
            cursor: "pointer",
            boxShadow: isSelected
              ? "0 4px 14px rgba(0,0,0,0.25)"
              : "0 8px 24px rgba(76,175,80,0.55)",
            transition: "all 0.2s",
          }}
        >
          {isSelected ? "✓ Pridané — odobrať" : "+ Pridať k objednávke"}
        </button>
      </div>
    </div>
  );
}

function Summary({ selected, onCopy, copied }) {
  const { count, total, orderable } = orderSummary(selected);
  const notOrderableSelected = [...selected].filter((id) => !isOrderable(id));
  return (
    <div style={{
      marginTop: 20, padding: 20, borderRadius: 12,
      background: `linear-gradient(135deg, ${DARK} 0%, #1a1008 100%)`,
      color: "#fff",
      boxShadow: "0 10px 30px rgba(46,24,16,0.25)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
            Tvoja objednávka vzoriek
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
            {count} {pluralVzorka(count)}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            {count === 0
              ? "Zatiaľ nemáš vybratú žiadnu vzorku. Klikaj na vzorky v akordeónoch vpravo."
              : "Vratná záloha " + DEPOSIT_PER_SAMPLE + " € za každú vzorku. Keď nám vzorky vrátiš, zálohu ti pošleme späť."}
          </div>
        </div>
        <div style={{ textAlign: "right", flex: "0 0 auto" }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
            Vratná záloha spolu
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: GOLD, lineHeight: 1 }}>
            {total} €
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.65, marginTop: 4, letterSpacing: 0.5 }}>
            + poštovné + poplatok za platbu
          </div>
        </div>
      </div>

      {count > 0 ? (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Vybrané vzorky:
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
            {orderable.map((id) => {
              const it = findItem(id);
              return (
                <li key={id}>
                  {sectionTitle(id)}: {shortLabel(id, it && it.label)}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <button
          onClick={onCopy}
          disabled={count === 0}
          style={{
            background: count === 0
              ? "#555"
              : "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
            color: "#fff", border: "none",
            padding: "16px 32px", borderRadius: 30,
            fontSize: 15, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase",
            cursor: count === 0 ? "not-allowed" : "pointer",
            boxShadow: count > 0 ? "0 10px 28px rgba(76,175,80,0.55)" : "none",
            transition: "all 0.2s",
          }}
        >
          {copied ? "✓ Skopírované" : "🛒 Pridať do košíka"}
        </button>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", left: "50%", bottom: 30,
      transform: "translateX(-50%)",
      background: DARK, color: "#fff",
      padding: "12px 22px", borderRadius: 10,
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      zIndex: 999, animation: "lcd-toast-in 0.3s ease",
    }}>{msg}</div>
  );
}

// --- MAIN -------------------------------------------------------------------

// --- POPISNÉ SEKCIE POD KONFIGURÁTOROM --------------------------------------

function SectionHeading({ eyebrow, title, compact }) {
  return (
    <div style={{ textAlign: "center", marginBottom: compact ? 20 : 30 }}>
      <div style={{
        fontSize: 13, letterSpacing: 2.5, textTransform: "uppercase",
        color: GOLD_DARK, fontWeight: 800,
      }}>{eyebrow}</div>
      <div style={{
        fontSize: compact ? 24 : 33, fontWeight: 900, color: DARK,
        marginTop: 6, lineHeight: 1.22,
      }}>{title}</div>
    </div>
  );
}

function SampleScopeNotice({ compact }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      background: CREAM, border: `1px solid ${BORDER}`,
      borderRadius: 10, padding: compact ? "12px 15px" : "14px 20px",
      marginBottom: compact ? 26 : 40,
      fontSize: compact ? 13.5 : 15, color: DARK, lineHeight: 1.5,
    }}>
      <span aria-hidden="true" style={{ fontSize: 19, flexShrink: 0, lineHeight: 1.3 }}>ℹ️</span>
      <span>Vzorky sú určené pre autokoberce do <strong>osobných automobilov</strong>. Na nákladné vozidlá a kamióny vzorky objednať nie je možné.</span>
    </div>
  );
}

const LCD_FEATURES = [
  { n: "01", t: "Navrhnuté s dokonalou presnosťou", d: "Vnútorné rozmery každého vozidla skenujeme 3D laserovým skenerom. Zachytíme každý detail a vytvoríme presné šablóny pre tvoje auto — viac ako 200 minút skenovania na vozidlo." },
  { n: "02", t: "Šité na mieru tvojho auta", d: "Autokoberce šijeme na objednávku, špeciálne pre každé auto zvlášť. Presné sadnutie a krytie podlahových aj bočných plôch až do 95 % — najvyšší štandard na trhu." },
  { n: "03", t: "Dvojité uchytenie pre maximálnu stabilitu", d: "Každá rohož má na spodnej strane našité suché zipsy. V balení sú aj klipy na sekundárne uchytenie pod plastové časti — žiadny pohyb počas jazdy." },
];

function FeatureSection({ compact }) {
  return (
    <div style={{ marginBottom: compact ? 38 : 58 }}>
      <SectionHeading eyebrow="Prečo Dragonskin" title="Vyrobené tak, aby vydržali" compact={compact} />
      <div style={{
        display: "grid",
        gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)",
        gap: 14,
      }}>
        {LCD_FEATURES.map((f) => (
          <div key={f.n} style={{
            background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: compact ? "18px" : "22px",
            boxShadow: "0 4px 14px rgba(46,24,16,0.06)",
          }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: GOLD, fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1 }}>{f.n}</div>
            <div style={{
              fontSize: compact ? 15.5 : 16.5, fontWeight: 800, color: DARK,
              margin: "9px 0 8px", textTransform: "uppercase", letterSpacing: 0.4,
            }}>{f.t}</div>
            <div style={{ fontSize: 15, color: "#5b4a3d", lineHeight: 1.6 }}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LCD_LAYERS = [
  { icon: "🛡️", t: "Kvalitná eko-koža", d: "Prémiová odolná umelá koža s príjemným povrchom. Pohodlná, ľahko sa čistí, na dotyk pôsobí luxusne." },
  { icon: "🪶", t: "Vysokohustotná pena", d: "Dokonalá mäkkosť, ktorá zvyšuje pohodlie. Zároveň slúži ako ochranná bariéra." },
  { icon: "🌬️", t: "Priedušná netkaná vrstva", d: "Ultra tenká vrstva netkaného materiálu — opora pre vrchné vrstvy, drží vlákna stabilné aj po rokoch." },
  { icon: "🌱", t: "Ekologický materiál XPE", d: "Vrstva z prepojeného polyetylénu. Udržiava tvar, izoluje zvuk a je šetrná k prostrediu." },
  { icon: "🔒", t: "Protišmyková vrstva", d: "Nylonová sieťovina s protišmykovými vlastnosťami — koberec sa neposúva, zvyšuje bezpečnosť a stabilitu." },
];

function MaterialLayers({ compact }) {
  return (
    <div style={{
      marginBottom: compact ? 38 : 58,
      background: `linear-gradient(135deg, ${DARK} 0%, #1a1008 100%)`,
      borderRadius: 16, padding: compact ? "28px 18px" : "40px 32px",
      color: "#fff",
    }}>
      <div style={{ textAlign: "center", marginBottom: compact ? 22 : 30 }}>
        <div style={{ fontSize: 13, letterSpacing: 2.5, textTransform: "uppercase", color: GOLD, fontWeight: 800 }}>Zloženie materiálu</div>
        <div style={{ fontSize: compact ? 24 : 33, fontWeight: 900, marginTop: 6 }}>5 vrstiev maximálnej odolnosti</div>
        <div style={{ fontSize: 15, opacity: 0.85, marginTop: 12, maxWidth: 680, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Päť vrstiev spojených lepením pod vysokým tlakom a teplotou, následne prešitých. Pohodlie, tlmenie hluku, tepelná izolácia, ochrana pred vlhkosťou a vynikajúca priľnavosť.
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(185px, 1fr))",
        gap: 12,
      }}>
        {LCD_LAYERS.map((l, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(197,164,78,0.28)",
            borderRadius: 10, padding: "18px 16px",
          }}>
            <div style={{ fontSize: 24 }} aria-hidden="true">{l.icon}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: GOLD, margin: "9px 0 7px", textTransform: "uppercase", letterSpacing: 0.4 }}>{l.t}</div>
            <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.55 }}>{l.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BasicVsElite({ compact }) {
  return (
    <div style={{ marginBottom: compact ? 38 : 58 }}>
      <SectionHeading eyebrow="Dve úrovne Dragonskin" title="Basic a Elite — v čom je rozdiel" compact={compact} />
      <div style={{
        display: "grid",
        gridTemplateColumns: compact ? "1fr" : "repeat(2, 1fr)",
        gap: 16, alignItems: "stretch",
      }}>
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 14, padding: compact ? "22px 20px" : "28px 26px",
          boxShadow: "0 4px 14px rgba(46,24,16,0.06)",
        }}>
          <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: GOLD_DARK, fontWeight: 800 }}>1 vrstva</div>
          <div style={{ fontSize: compact ? 21 : 26, fontWeight: 900, color: DARK, marginTop: 5 }}>Dragonskin Basic</div>
          <div style={{ fontSize: 15, color: "#5b4a3d", lineHeight: 1.6, marginTop: 11 }}>
            Jednovrstvový luxusný autokoberec — 5-vrstvová kompozícia Dragonskin (eko-koža, pena, netkaná vrstva, XPE, protišmyk). Presné sadnutie a spoľahlivá ochrana podlahy vozidla.
          </div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${DARK} 0%, #1a1008 100%)`,
          border: `2px solid ${GOLD}`,
          borderRadius: 14, padding: compact ? "22px 20px" : "28px 26px",
          color: "#fff", boxShadow: "0 10px 28px rgba(46,24,16,0.22)",
        }}>
          <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: GOLD, fontWeight: 800 }}>2 vrstvy</div>
          <div style={{ fontSize: compact ? 21 : 26, fontWeight: 900, marginTop: 5 }}>Dragonskin Elite</div>
          <div style={{ fontSize: 15, opacity: 0.92, lineHeight: 1.6, marginTop: 11 }}>
            Dvojvrstvový variant — k vrstve Basic pridáva druhú vrstvu Lux. <strong style={{ color: GOLD }}>Vrstva Lux je 100 % vodotesná</strong> — maximálna ochrana proti vode, snehu a nečistotám, ideálna na zimu aj celoročné používanie.
          </div>
        </div>
      </div>
    </div>
  );
}

const LCD_STATS = [
  { big: "95 %", t: "Krytie podlahy", d: "Najvyššie krytie na trhu. Chráni hodnotu tvojho auta pri predaji." },
  { big: "100 %", t: "Vodotesná vrstva Lux", d: "Vrchná vrstva Lux z radu Elite je 100 % vodotesná — úplná ochrana pred rozliatím." },
  { big: "1 000+", t: "Modelov áut", d: "Pripravené šablóny pre väčšinu vozidiel — koberce na mieru tvojho." },
];

function StatsRow({ compact }) {
  return (
    <div style={{
      marginBottom: compact ? 38 : 58,
      display: "grid",
      gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)",
      gap: 14,
    }}>
      {LCD_STATS.map((s, i) => (
        <div key={i} style={{
          background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: compact ? "22px 18px" : "28px 22px",
          textAlign: "center", boxShadow: "0 4px 14px rgba(46,24,16,0.06)",
        }}>
          <div style={{ fontSize: compact ? 36 : 48, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{s.big}</div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: DARK, marginTop: 9, textTransform: "uppercase", letterSpacing: 1 }}>{s.t}</div>
          <div style={{ fontSize: 14, color: "#5b4a3d", marginTop: 7, lineHeight: 1.55 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

const LCD_TRUST = [
  { big: "2 roky", t: "Záruka" },
  { big: "25 – 35 dní", t: "Dodanie" },
  { big: "< 1 hodina", t: "Odozva supportu" },
  { big: "až 95 %", t: "Krytie podlahy" },
];

function WhyTrustUs({ compact }) {
  return (
    <div>
      <SectionHeading eyebrow="Originál Dragonskin" title="Prečo nám zákazníci dôverujú" compact={compact} />
      <div style={{
        display: "grid",
        gridTemplateColumns: compact ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 12, marginBottom: 24,
      }}>
        {LCD_TRUST.map((c, i) => (
          <div key={i} style={{
            background: CREAM, border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: compact ? "18px 12px" : "22px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: compact ? 18 : 23, fontWeight: 900, color: DARK }}>{c.big}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: GOLD_DARK, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.7 }}>{c.t}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <a href="https://www.luxurycardesign.sk/luxusne-autokoberce/" target="_blank" rel="noopener noreferrer" style={{
          display: "inline-block",
          background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
          color: "#fff", textDecoration: "none",
          padding: compact ? "14px 26px" : "16px 40px",
          borderRadius: 30, fontSize: compact ? 14 : 16, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: 1.2,
          boxShadow: "0 8px 24px rgba(197,164,78,0.4)",
        }}>Pozrieť celú ponuku autokobercov →</a>
      </div>
    </div>
  );
}

function InfoSections({ compact }) {
  return (
    <div style={{
      maxWidth: 1400, margin: "0 auto",
      padding: compact ? "4px 16px 130px" : "12px 28px 64px",
    }}>
      <SampleScopeNotice compact={compact} />
      <MaterialLayers compact={compact} />
      <BasicVsElite compact={compact} />
      <StatsRow compact={compact} />
      <FeatureSection compact={compact} />
      <WhyTrustUs compact={compact} />
    </div>
  );
}

function Configurator() {
  const [selected, setSelected] = React.useState(new Set());
  const [lastClicked, setLastClicked] = React.useState(null); // id for preview
  const [openSection, setOpenSection] = React.useState("diamond"); // "diamond" | "stripe" | "hexa" | "layer2" | null
  const [skipped, setSkipped] = React.useState(new Set());
  const [copied, setCopied] = React.useState(false);
  const [toast, setToast] = React.useState("");

  // Mapovanie section → ID prefix(y) selected, ktoré sa pri skipe vyčistia
  const sectionPrefixes = {
    diamond: ["D-"],
    stripe: ["S-"],
    hexa: ["H-"],
    layer2: ["LUX-"],
  };

  const toggleSkip = (section) => {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
    // Ak skipujeme, vyčisti vybrané vzorky tej sekcie
    if (!skipped.has(section)) {
      const prefixes = sectionPrefixes[section] || [];
      setSelected((prevSel) => {
        const nextSel = new Set(prevSel);
        for (const id of [...nextSel]) {
          if (prefixes.some((p) => id.startsWith(p))) nextSel.delete(id);
        }
        return nextSel;
      });
    }
  };

  const sectionFromId = (id) => {
    if (id.startsWith("D-")) return "diamond";
    if (id.startsWith("S-")) return "stripe";
    if (id.startsWith("H-")) return "hexa";
    if (id.startsWith("LUX-")) return "layer2";
    return null;
  };
  const summaryRef = React.useRef(null);

  const jumpTo = (section) => setOpenSection(section);
  const jumpToSummary = () => {
    setOpenSection(null); // zavri 4. akordeón
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 450); // počkaj na dokončenie collapse animácie (max-height 0.4s)
  };

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastClicked(id);
    // Ak user klikol na vzorku, automaticky zruš "Nechcem žiadnu" pre danú sekciu
    const section = sectionFromId(id);
    if (section) {
      setSkipped((prev) => {
        if (!prev.has(section)) return prev;
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
    }
  };

  // Náhľadový klik — len ukáže detail vo veľkom, nepridá do objednávky
  const previewOnly = (id) => setLastClicked(id);

  const handleCopy = async () => {
    const { orderable } = orderSummary(selected);
    if (orderable.length === 0) return;
    const lines = orderable.map((id) => {
      const it = findItem(id);
      return `• ${sectionTitle(id)}: ${shortLabel(id, it && it.label)}`;
    });
    const text = [
      "Objednávka vzoriek — Luxury Car Design",
      "Dátum: " + new Date().toLocaleString("sk-SK"),
      "",
      "Počet vzoriek: " + orderable.length,
      "Vratná záloha: " + (orderable.length * DEPOSIT_PER_SAMPLE) + " € (" + DEPOSIT_PER_SAMPLE + " € / vzorka)",
      "",
      "Vybrané vzorky:",
      ...lines,
      "",
      "Pravidlá zálohy a vrátenia:",
      "- Vratná záloha 5 € / vzorka — vraciame ju po obdržaní vzoriek späť na účet.",
      "- Vzorky je možné vrátiť do 14 dní od doručenia.",
      "- Poštovné za vrátenie na našu adresu si hradí zákazník sám.",
      "- Adresa a formulár: https://www.luxurycardesign.sk/odstupenie-od-zmluvy/",
      "- Nevracia sa poštovné pri objednávke vzoriek ani poplatok za spôsob platby.",
      "- Na vzorky neplatia zľavy, kupóny ani doprava zdarma.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setToast("Skopírované do schránky — pošli to na objednavky@luxurycardesign.sk alebo vlož do formulára.");
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setToast(""), 4500);
    } catch (e) {
      setToast("Kopírovanie zlyhalo. Označ text nižšie a skopíruj ho ručne (Ctrl+C).");
      setTimeout(() => setToast(""), 4000);
    }
  };

  const previewItem = lastClicked ? findItem(lastClicked) : null;
  const { count } = orderSummary(selected);

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      {/* BODY */}
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "24px 28px 60px",
        display: "grid",
        gridTemplateColumns: "minmax(320px, 1fr) minmax(520px, 1.4fr)",
        gap: 30,
        alignItems: "start",
      }}>
        {/* LEFT — PREVIEW */}
        <div style={{
          position: "sticky", top: 20,
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <ProductPhotos />
        </div>

        {/* RIGHT — ACCORDIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* AKORDEÓN 1 — Diamond Line */}
          <div>
            <AccordionHeader
              level={1} badge="1"
              label="Diamond Line"
              open={openSection === "diamond"}
              onToggle={() => setOpenSection(openSection === "diamond" ? null : "diamond")}
              count={[...selected].filter((id) => id.startsWith("D-")).length}
            />
            <AccordionBody open={openSection === "diamond"}>
              <SwatchGrid
                items={DIAMOND} selected={selected} toggle={toggle} lastClicked={lastClicked}
                skipSection="diamond" skipActive={skipped.has("diamond")} onToggleSkip={toggleSkip}
                skipLabel="Nechcem Diamond Line"
                onContinue={() => jumpTo("stripe")}
                continueLabel="Pokračovať na Stripe Line"
              />
            </AccordionBody>
          </div>

          {/* AKORDEÓN 2 — Stripe Line */}
          <div>
            <AccordionHeader
              level={1} badge="2"
              label="Stripe Line"
              open={openSection === "stripe"}
              onToggle={() => setOpenSection(openSection === "stripe" ? null : "stripe")}
              count={[...selected].filter((id) => id.startsWith("S-")).length}
            />
            <AccordionBody open={openSection === "stripe"}>
              <SwatchGrid
                items={STRIPE} selected={selected} toggle={toggle} lastClicked={lastClicked}
                skipSection="stripe" skipActive={skipped.has("stripe")} onToggleSkip={toggleSkip}
                skipLabel="Nechcem Stripe Line"
                onContinue={() => jumpTo("hexa")}
                continueLabel="Pokračovať na Hexa Line"
              />
            </AccordionBody>
          </div>

          {/* AKORDEÓN 3 — Hexa Line */}
          <div>
            <AccordionHeader
              level={1} badge="3"
              label="Hexa Line"
              open={openSection === "hexa"}
              onToggle={() => setOpenSection(openSection === "hexa" ? null : "hexa")}
              count={[...selected].filter((id) => id.startsWith("H-")).length}
            />
            <AccordionBody open={openSection === "hexa"}>
              <SwatchGrid
                items={HEXA} selected={selected} toggle={toggle} lastClicked={lastClicked}
                skipSection="hexa" skipActive={skipped.has("hexa")} onToggleSkip={toggleSkip}
                skipLabel="Nechcem Hexa Line"
                onContinue={() => jumpTo("layer2")}
                continueLabel="Pokračovať na 2. vrstvu"
              />
            </AccordionBody>
          </div>

          {/* AKORDEÓN 4 — 2. vrstva (banner + všetky náhľady) */}
          <div>
            <AccordionHeader
              level={1} badge="4"
              label="Vzorka 2. vrstvy"
              open={openSection === "layer2"}
              onToggle={() => setOpenSection(openSection === "layer2" ? null : "layer2")}
              count={[...selected].filter((id) => id.startsWith("LUX-")).length}
            />
            <AccordionBody open={openSection === "layer2"}>
              {/* Galéria — LUX-10 zvýraznená zelenou, ostatné disabled */}
              <SwatchGrid
                items={SECOND}
                selected={selected} toggle={toggle} previewOnly={previewOnly}
                lockedBadge={true} highlightOrderable={true}
                lastClicked={lastClicked}
                skipSection="layer2" skipActive={skipped.has("layer2")} onToggleSkip={toggleSkip}
                skipLabel="Nechcem 2. vrstvu"
                onContinue={jumpToSummary}
                continueLabel="Pokračovať na súhrn objednávky"
              />
            </AccordionBody>
          </div>

          {/* SÚHRN */}
          <div ref={summaryRef}>
            <Summary selected={selected} onCopy={handleCopy} copied={copied} />
          </div>
        </div>
      </div>

      <InfoSections />
      <Toast msg={toast} />
    </div>
  );
}

// --- EXPOSE FOR TESTS & MOUNT ----------------------------------------------

window.__LCD_API__ = {
  DIAMOND, STRIPE, HEXA, SECOND,
  findItem, isOrderable, orderSummary, sectionTitle, pluralVzorka,
  DEPOSIT_PER_SAMPLE,
};

// Mount sa preskočí, ak test harness nastaví window.__LCD_SKIP_MOUNT__ = true
if (!window.__LCD_SKIP_MOUNT__) {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(Configurator));
}
