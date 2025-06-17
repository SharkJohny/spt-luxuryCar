export function intIndex() {
  setTimeout(function () {
    $(".twentytwenty-container").twentytwenty({
      before_label: "Potom",
      after_label: "Předtím",
    });
  }, 1000);
  $("svg.icon.icon-circle-button-right-clipped").remove();

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
          slidesToShow: 2,
          slidesToScroll: 2,

          autoplay: false,
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
}
