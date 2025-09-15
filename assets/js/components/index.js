export function intIndex() {
  setTimeout(function () {
    $(".twentytwenty-container").twentytwenty({
      before_label: "Potom",
      after_label: "Předtím",
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
      }
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
  $(faq).load("/faq/ div[itemprop='about']", function () {
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

  // The rest of the function remains the same for CSS and click handler
  // The rest of the function for basic-description etc. remains unchanged
  $(".basic-description").each(function () {
    let perex = $(this).html().includes("*||*");
    if (perex) {
      let text = $(this).html();
      let string = text.split("[*");
      let before = text.split("[*")[0];
      $(string).each(function () {
        let functionname = this.split("*||*")[0];
        let wrapText = this.split("*||*")[1];
        let content = this.split("*||*")[2];
        // $(this).replaceWith("<div class=" + className + ">" + wrapText + "</div>");
        console.log(functionname);
        $(".basic-description").html(before);
        if (functionname == "tables ") {
          if ($(".desktop")[0]) {
            $(
              `<li class="shp-tab " >
                <a href="#` +
                wrapText.replaceAll(" ", "_") +
                `" class="shp-tab-link" role="tab" data-toggle="tab">` +
                wrapText +
                `</a>
            </li>`
            ).appendTo(".shp-tabs.p-detail-tabs.visible-links");

            $(
              `<div id="` +
                wrapText.replaceAll(" ", "_") +
                `" class="tab-pane fade " role="tabpanel">
        <div class="description-inner-Plus">

            ` +
                content.split("*]")[0] +
                `

        </div>
    </div>`
            ).appendTo("#tab-content");
          }
          if ($(".mobile")[0]) {
            let wrap = $("<div/>").addClass("shp-accordion").appendTo("#accordion-content");
            $("<a/>").addClass("shp-accordion-link").attr("href", wrapText.replaceAll(" ", "_")).text(wrapText).appendTo(wrap);
            let contentWrap = $("<div/>").addClass("shp-accordion-content").appendTo(wrap);
            $("<div/>").attr("id", wrapText.replaceAll(" ", "_")).html(content.split("*]")[0]).appendTo(contentWrap);
          }
        }
      });
    }
  });
}
