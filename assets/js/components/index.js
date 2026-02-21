export function intIndex() {
  const lang = dataLayer[0].shoptet.projectId == 704436 ? "cs" : (shoptetData.language || dataLayer[0].shoptet.language);
  setTimeout(function () {
    $(".twentytwenty-container").twentytwenty({
      before_label: lang === "cs" ? "Potom" : "Po",
      after_label: lang === "cs" ? "Předtím" : "Predtým",
    });
  }, 1000);
  $("svg.icon.icon-circle-button-right-clipped").remove();
  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    video.removeAttribute("controls");
  });
  // Funkce pro přičítání čísel
  function animateCountUp(element, targetNumber, duration) {
    const $element = $(element);
    $({ count: 0 }).animate(
      { count: targetNumber },
      {
        duration: duration,
        easing: "swing",
        step: function (now) {
          $element.text(Math.floor(now));
        },
        complete: function () {
          $element.text(targetNumber); // Pro zajištění, že se zobrazí konečná hodnota
        },
      },
    );
  }
  $(document).on("click", ".accordion", function (e) {
    e.preventDefault();
    console.log("Accordion clicked!");

    // Toggle active class for styling
    $(this).toggleClass("active");

    // Find the panel - it's the next sibling after the button
    var $panel = $(this).next(".panel");
    console.log("Found panel:", $panel.length);

    if (!$panel.length) return; // nothing to toggle

    // Toggle display with direct CSS manipulation
    if ($panel.css("display") === "none") {
      $panel.css("display", "block");
    } else {
      $panel.css("display", "none");
    }
  });
  // Nastavení IntersectionObserver
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const $element = $(entry.target).find('span[style*="text-align: end"]');
        const targetNumber = parseFloat($element.text().replace(",", ""));
        console.log(targetNumber);
        if (targetNumber > 0) {
          console.log("assdsd");
          const duration = parseFloat($(entry.target).attr("count-up")) * 1000;
          animateCountUp($element, targetNumber, duration);
          observer.unobserve(entry.target); // Odstraní pozorování, aby se animace nespustila znovu
        }
      }
    });
  });

  // Inicializace pozorování pro každý prvek s atributem count-up
  $("[count-up]").each(function () {
    observer.observe(this);
  });
  setTimeout(function () {
    $("collection-list.collection-list").slick({
      dots: true,
      centerMode: false,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 2,
      autoplay: true,
      autoplaySpeed: 3000,
      arrows: true,

      responsive: [
        {
          breakpoint: 1480,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            arrows: true,
          },
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3,
          },
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });

    // $(".product-slider").slick({
    //   dots: true,
    //   centerMode: false,
    //   infinite: true,
    //   slidesToShow: 2,
    //   slidesToScroll: 1,
    //   autoplay: true,
    //   autoplaySpeed: 4000,
    //   arrows: true,
    //   responsive: [
    //     {
    //       breakpoint: 350,
    //       settings: {
    //         slidesToShow: 1,
    //         slidesToScroll: 1,
    //       },
    //     },
    //   ],
    // });
  }, 1000);

  $("section.foto-slider .image-slider").slick({
    dots: true,
    centerMode: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: true,
    responsive: [
      {
        breakpoint: 1480,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: true,
        },
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 770,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 350,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  });

  setTimeout(function () {
    $(".customers-video").slick({
      dots: true,
      centerMode: false,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 4000,
      arrows: true,
      responsive: [
        {
          breakpoint: 1480,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: true,
          },
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3,
          },
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });

    $(".google-reviews").slick({
      dots: true,
      centerMode: false,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 4000,
      arrows: true,
      responsive: [
        {
          breakpoint: 1480,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: true,
          },
        },
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 3,
          },
        },
        {
          breakpoint: 770,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 350,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });
  }, 1000);

  $("button.text-with-icon.group").on("click", function () {
    $("section#comparison").toggleClass("show-more");
    if (!$("button.text-with-icon.group.less")[0]) {
      $(".feature-chart__table-row[hidden]").removeAttr("hidden").addClass("addHidden");
      const less = $(this).attr("data-view-less");
      $(this).addClass("less");
      $(this).find("span.feature-chart__toggle-text.reversed-link").text(less);
    } else {
      const more = $(this).attr("data-view-more");
      $(".feature-chart__table-row.addHidden").attr("hidden", true).removeClass("addHidden");
      $(this).removeClass("less");
      $(this).find("span.feature-chart__toggle-text.reversed-link").text(more);
    }
  });

  $(".btn.more-pictures-button").on("click", function () {
    $(".more-pictures").toggleClass("slow");

    if (!$(".btn.more-pictures-button.less")[0]) {
      const less = $(this).attr("data-view-less");
      $(this).text(less);
      $(this).addClass("less");
    } else {
      const more = $(this).attr("data-view-more");
      $(this).text(more);
      $(this).removeClass("less");
    }
  });

  // Video functionality moved to video-play-again.js

  $(".hotspot").on("click", function () {
    $(this).parents(".layers-info-wrap").addClass("show");
    $(".tooltips").removeClass("show");
    $(this).find(".tooltips").addClass("show");
  });
  $(document).on("click", function (e) {
    // Check if clicked outside .hotspot and .tooltips
    const $target = $(e.target);
    if (!$target.closest(".hotspot").length && !$target.closest(".tooltips").length) {
      $(".tooltips").removeClass("show");
    }
  });
  // Get all review-photo elements and set their height based on width
  setTimeout(function () {
    $(".review-photo").each(function () {
      const width = $(this).width();
      $(this).height(width);
    });
  }, 1000);

  const faq = $('<div class="faq container"></div>');
  $("<div>").addClass("sec-header").text("Často kladené otázky").appendTo(faq);
  const faqContent = $('<div class="faq-content">').appendTo(faq);
  $(faqContent).load("/faq/ div[itemprop='about']", function () {
    accordion(); // Call accordion() after content is loaded
  });
  if ($(".in-index")[0]) {
    $(faq).insertBefore(".foto-slider");
  } else if ($(".type-product")[0]) {
    $(faq).appendTo(".col-xs-12.col-lg-6.p-info-wrapper");
  }

  // setTimeout(function () {
  //   accordion(); // Call accordion() after content is loaded
  // }, 2000);

  // Admin floating button for order generation
  if ($(".type-index.admin-logged").length) {
    const adminBtn = $(`
      <button class="admin-generate-orders" type="button" style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #c49b30;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        transition: all 0.3s;
      ">
        Generovat objednávky
      </button>
    `);

    $("body").append(adminBtn);

    adminBtn.on("click", function () {
      const $btn = $(this);
      const originalText = $btn.text();

      $btn.prop("disabled", true).text("Odesílání...");

      // Call API directly (CORS is now configured on backend)
      fetch("https://projectmanager-8352.rostiapp.cz/api/ingest/luxury-cars/proces_orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ start: true }),
      })
        .then(function (response) {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("HTTP " + response.status);
          }
        })
        .then(function (data) {
          $btn.text("✓ Odesláno").css("background", "#28a745");
          console.log("Success:", data);
          setTimeout(function () {
            $btn.prop("disabled", false).text(originalText).css("background", "#c49b30");
          }, 2000);
        })
        .catch(function (error) {
          $btn.text("✗ Chyba").css("background", "#dc3545");
          console.error("Error:", error);
          setTimeout(function () {
            $btn.prop("disabled", false).text(originalText).css("background", "#c49b30");
          }, 2000);
        });
    });

    // Hover effect
    adminBtn
      .on("mouseenter", function () {
        $(this).css("transform", "scale(1.05)");
      })
      .on("mouseleave", function () {
        $(this).css("transform", "scale(1)");
      });
  }
}

function accordion() {
  if (!$(".acordeoncsss")[0]) {
    $("body").addClass("acordeoncsss").append(` <style type='text/css'>
    .accordion {
    background-color: white;
       color: #444;
    cursor: pointer;
    padding: 18px;
    width: 100%;
    text-align: left;
    border: none;
    outline: none;
    transition: 0.4s;
    border-bottom: 2px solid gold;
    font-size: 18px;
    }
    .accordion.active, .accordion:hover {
      
    background-color: white;

      color: #c49b30;
      box-shadow: 0 4px 24px rgba(196,155,48,0.10);
    }
    .accordion:after {
      content: "+";
      font-size: 22px;
      color: #c49b30;
      float: right;
      margin-left: 10px;
      font-weight: 800;
      transition: transform 0.3s;
    }
    .accordion.active:after {
      content: "-";
      transform: rotate(180deg);
    }
    .panel {
      padding: 10px 24px 18px 24px;
   color: black;
    font-size: 15px;
      
      border-radius: 0 0 12px 12px;
      margin-bottom: 12px;
      display: none;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      transition: background 0.3s, color 0.3s;
    }

    .panel[style*="display: block"] {
      animation: fadeInPanel 0.3s;
    }
    @keyframes fadeInPanel {
      from { opacity: 0; transform: translateY(-10px);} 
      to { opacity: 1; transform: translateY(0);} 
    }

    /* New styles for product page limitation */
    .faq .accordion-hidden { display: none !important; }
    .faq .faq-show-more { text-align: center; margin-top: 8px; }
    .faq .faq-show-more button { background: transparent; border: 1px solid #c49b30; color: #c49b30; padding: 8px 14px; border-radius: 8px; cursor: pointer; }

    </style> `);
  }

  let evenOdd = 0;

  // Procházej pouze .faq elementy
  $(".faq").each(function () {
    try {
      let html = $(this).html();
      if (!html || html.indexOf("[accordion") === -1) return;

      // Replace all accordion blocks in this element
      html = html.replace(/\[accordion([\s\S]*?)\]/g, function (match, inner) {
        let parts = inner.split("*||*");
        if (parts.length < 3) return match; // leave unchanged if malformed

        let button = parts[1].trim();
        let content = parts.slice(2).join("*||*").trim();
        content = content.replace(/\]$/, "");

        evenOdd += 1;
        let buttonClass = evenOdd % 2 === 0 ? "accordion" : "accordion even";

        // Create a complete accordion block that will be properly structured
        return `</p><div class="accordion-wrapper"><button class="${buttonClass}">${button}</button><div class="panel">${content}</div></div><p>`;
      });

      $(this).html(html);

      // If we're on a product page, hide all accordions beyond the first 4
      if ($(".type-product").length) {
        const $accordions = $(this).find(".accordion-wrapper");
        if ($accordions.length > 4) {
          $accordions.each(function (i) {
            if (i >= 4) {
              $(this).addClass("accordion-hidden");
            }
          });

          // Add show more button if not present
          if (!$(this).find(".faq-show-more").length) {
            const showMore = $(`<div class="faq-show-more"><button type="button">${lang === "sk" ? "Zobraziť viac" : "Zobrazit více"}</button></div>`);
            $(this).append(showMore);

            showMore.on("click", "button", function () {
              const hidden = $(this).closest(".faq").find(".accordion-hidden");
              if (hidden.length) {
                hidden.removeClass("accordion-hidden");
                $(this).text(lang === "sk" ? "Zobraziť menej" : "Zobrazit méně");
              } else {
                const $accordions2 = $(this).closest(".faq").find(".accordion-wrapper");
                $accordions2.each(function (i) {
                  if (i >= 4) $(this).addClass("accordion-hidden");
                });
                $(this).text(lang === "sk" ? "Zobraziť viac" : "Zobrazit více");
                // Ensure first hidden ones get closed
                $(this).closest(".faq").find(".panel").css("display", "none");
                $(this).closest(".faq").find(".accordion").removeClass("active");
              }
            });
          }
        }
      }
    } catch (e) {
      // ignore elements we can't read/modify
    }
  });

  // Clean up empty paragraphs and fix structure only inside .faq
  $(".faq p").each(function () {
    if ($(this).html().trim() === "" || $(this).html().trim() === '<meta charset="utf-8">') {
      $(this).remove();
    }
  });

  // Click handler moved out to global intIndex scope to prevent duplicate bindings
}
