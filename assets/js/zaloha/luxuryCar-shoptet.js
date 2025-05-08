// JavaScript pro Shoptet verzi stránky s autokobercemi

document.addEventListener("DOMContentLoaded", function () {
  // Inicializace TwentyTwenty slideru
  initTwentyTwenty();

  // Inicializace hotspotů na obrázcích
  initHotspots();

  // Inicializace posuvných funkcí (scrolling features)
  initScrollingFeatures();

  // Inicializace časové osy (timeline)
  initTimeline();
});

// Inicializace TwentyTwenty slideru
function initTwentyTwenty() {
  const container = document.querySelector(".twentytwenty-container");
  if (container) {
    // Kontrola, zda je knihovna načtena
    if (typeof jQuery !== "undefined" && jQuery.fn.twentytwenty) {
      $(container).twentytwenty({
        default_offset_pct: 0.5,
        orientation: "horizontal",
      });
    } else {
      console.warn("TwentyTwenty plugin není načten. Přidejte prosím jQuery a twentytwenty plugin do šablony.");
    }
  }
}

// Inicializace interaktivních bodů (hotspots)
function initHotspots() {
  const hotspots = document.querySelectorAll(".hotspot");

  hotspots.forEach((hotspot) => {
    hotspot.addEventListener("click", function () {
      const title = this.getAttribute("data-title");
      const description = this.getAttribute("data-description");

      // Vytvoření nebo aktualizace tooltip boxu
      let tooltip = document.querySelector(".hotspot-tooltip");
      if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.className = "hotspot-tooltip";
        document.body.appendChild(tooltip);
      }

      tooltip.innerHTML = `
                <div class="tooltip-content">
                    <h4>${title}</h4>
                    <p>${description}</p>
                    <button class="tooltip-close">×</button>
                </div>
            `;

      // Pozicování tooltip u hotspotu
      const rect = this.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      tooltip.style.left = rect.left + "px";
      tooltip.style.top = rect.top + scrollTop + 30 + "px";
      tooltip.style.display = "block";

      // Zavření tooltipu
      document.querySelector(".tooltip-close").addEventListener("click", function () {
        tooltip.style.display = "none";
      });
    });
  });

  // Přidání CSS pro tooltip
  if (!document.getElementById("hotspot-styles")) {
    const style = document.createElement("style");
    style.id = "hotspot-styles";
    style.textContent = `
            .hotspot-tooltip {
                position: absolute;
                z-index: 1000;
                background: white;
                border-radius: 5px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.15);
                max-width: 300px;
                display: none;
            }
            .tooltip-content {
                padding: 15px;
            }
            .tooltip-content h4 {
                margin: 0 0 10px;
                color: #ddc067;
            }
            .tooltip-content p {
                margin: 0 0 10px;
            }
            .tooltip-close {
                position: absolute;
                right: 5px;
                top: 5px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
            }
        `;
    document.head.appendChild(style);
  }
}

// Inicializace posuvných funkcí
function initScrollingFeatures() {
  const featureSlides = document.querySelectorAll(".feature-slide");
  if (featureSlides.length === 0) return;

  // Zobrazit první slide a nastavit dynamický obrázek
  const firstSlide = featureSlides[0];
  firstSlide.classList.add("active");

  const dynamicImage = document.querySelector(".dynamic-image");
  if (dynamicImage && firstSlide.getAttribute("data-image")) {
    dynamicImage.src = firstSlide.getAttribute("data-image");
  }

  // Vytvořit navigaci pro slides
  const featuresContent = document.querySelector(".features-content");
  if (featuresContent) {
    const nav = document.createElement("div");
    nav.className = "features-nav";

    let navHtml = '<div class="nav-buttons">';
    featureSlides.forEach((slide, index) => {
      navHtml += `<button class="nav-btn ${index === 0 ? "active" : ""}" data-index="${index}">${index + 1}</button>`;
    });
    navHtml += "</div>";

    nav.innerHTML = navHtml;
    featuresContent.appendChild(nav);

    // Přidat event listenery k tlačítkům
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const index = parseInt(this.getAttribute("data-index"));
        showFeatureSlide(index);
      });
    });
  }

  // Funkce pro zobrazení konkrétního slide
  function showFeatureSlide(index) {
    // Deaktivovat všechny slidy a tlačítka
    featureSlides.forEach((slide) => slide.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

    // Aktivovat vybraný slide a tlačítko
    featureSlides[index].classList.add("active");
    document.querySelector(`.nav-btn[data-index="${index}"]`).classList.add("active");

    // Aktualizovat dynamický obrázek
    if (dynamicImage && featureSlides[index].getAttribute("data-image")) {
      dynamicImage.src = featureSlides[index].getAttribute("data-image");
    }
  }

  // Přidání CSS pro navigaci
  if (!document.getElementById("features-nav-styles")) {
    const style = document.createElement("style");
    style.id = "features-nav-styles";
    style.textContent = `
            .features-nav {
                margin-top: 20px;
                text-align: center;
            }
            .nav-buttons {
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .nav-btn {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: none;
                border: 2px solid #ddc067;
                color: #ddc067;
                cursor: pointer;
                font-weight: bold;
            }
            .nav-btn.active {
                background-color: #ddc067;
                color: white;
            }
        `;
    document.head.appendChild(style);
  }
}

// Inicializace časové osy
function initTimeline() {
  const timelineDots = document.querySelectorAll(".timeline-dot");
  if (timelineDots.length === 0) return;

  // Data pro jednotlivé kroky
  const timelineData = [
    {
      image: "/user/documents/upload/assets/image/craftman.png",
      title: "Krok 1 | Vytvoríte objednávku",
      text: 'Na úvodnej stránke zadáte údaje o svojom vozidle (značku, model a rok). Potom si vyberiete požadovaný štýl a farbu z dostupných variantov. V konfigurátore produktu nastavíte, kam všade chcete umiestniť luxusné autokoberce, a nakoniec kliknete na tlačidlo „Pridať do košíka".',
    },
    {
      image: "/user/documents/upload/assets/image/craftman2.png",
      title: "Krok 2 | Potvrdíte objednávku",
      text: "Po vložení luxusných autokobercov do košíka, vyplníte svoje kontaktné údaje, vyberieme si spôsob dopravy a zaplatíte objednávku. Po potvrdení objednávky dostanete e-mail s potvrdením objednávky.",
    },
    {
      image: "/user/documents/upload/assets/image/craftman3.png",
      title: "Krok 3 | Obdržíme objednávku",
      text: "Po potvrdení vašej objednávky dostaneme notifikáciu a začneme kontrolovať objednávku. Skontrolujeme, či je všetko správne, a potom sa objednávka dostane do výroby.",
    },
    {
      image: "/user/documents/upload/assets/image/craftman4.png",
      title: "Krok 4 | Začneme vyrábať",
      text: "Na základe vášho modelu a roku vozidla vyberieme správny tvar pre vaše autokoberce. Naše šablóny sú pravidelne aktualizované, aby sme zaistili dokonalé lícovanie s vaším vozidlom.",
    },
    {
      image: "/user/documents/upload/assets/image/craftman5.png",
      title: "Krok 5 | Vyrobíme a skontrolujeme produkt",
      text: "Skúsení pracovníci s použitím pokročilej technológie precízne vyrežú a spracujú vaše autokoberce. Každý produkt prechádza prísnou kontrolou kvality pred expedíciou, aby sme zaistili, že dostanete produkt najvyššej kvality.",
    },
    {
      image: "/user/documents/upload/assets/image/craftman6.png",
      title: "Krok 6 | Produkty vám odošleme",
      text: "Po kontrole kvality zabalíme vaše autokoberce do ochranného obalu a odošleme vám ich. Na e-mail vám pošleme informáciu o odoslaní a kód na sledovanie zásielky, aby ste vedeli, kedy ju môžete očakávať.",
    },
  ];

  // Přidat event listenery k bodům časové osy
  timelineDots.forEach((dot) => {
    dot.addEventListener("click", function () {
      const step = parseInt(this.getAttribute("data-step"));
      showTimelineStep(step);
    });
  });

  // Funkce pro zobrazení konkrétního kroku
  function showTimelineStep(step) {
    // Získat data pro tento krok
    const stepData = timelineData[step - 1];
    if (!stepData) return;

    // Aktualizovat obsah slide
    const slide = document.querySelector(".timeline-slide");
    if (slide) {
      slide.innerHTML = `
                <div class="timeline-image">
                    <img src="${stepData.image}" alt="${stepData.title}" width="700">
                </div>
                <div class="timeline-text">
                    <h2>${stepData.title}</h2>
                    <p>${stepData.text}</p>
                </div>
            `;
    }

    // Aktualizovat aktivní bod
    timelineDots.forEach((d) => d.classList.remove("active"));
    document.querySelector(`.timeline-dot[data-step="${step}"]`).classList.add("active");
  }
}
