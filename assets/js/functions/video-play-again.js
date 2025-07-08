/**
 * Video Play Again - Optimalizovaná verze
 * - Přehrávání/pauzování videa kliknutím
 * - Tlačítko "Přehrát znovu" na konci videa
 * - Zabránění přehrávání více videí současně
 * - Nově: podpora pro .wrapper > video na homepage
 */
export function initVideoPlayAgain() {
  console.log("initVideoPlayAgain called");

  // Odstraníme existující handlery - rozšířený selektor
  jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .customers-video video, .slick-slide video").off(
    "click.videoControl touchend.videoControl ended.videoControl play.videoControl pause.videoControl"
  );

  // Funkce pro zastavení všech ostatních videí
  function pauseOtherVideos(currentVideo) {
    jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .customers-video video, .slick-slide video").each(
      function () {
        if (this !== currentVideo && !this.paused) {
          this.pause();
        }
      }
    );
  }

  // Funkce pro inicializaci jednoho videa
  function initSingleVideo($video) {
    const $container = $video.parent();
    const videoEl = $video[0];

    const videoSrc = $video.find("source").attr("src") || "no source";
    const containerClasses = $container.attr("class") || "no classes";
    const videoClasses = $video.attr("class") || "no classes";
    const isInSlider = $video.closest(".slick-slide").length > 0;

    console.log("Processing video:", videoSrc, containerClasses, videoClasses, "isInSlider:", isInSlider);

    // Pokud je video ve wrapperu, povol vždy (homepage a customer-video)
    if ($container.hasClass("wrapper")) {
      $video.show();
      console.log("Wrapper video found:", $video.attr("class"), "in container:", $container.attr("class"));
    } else {
      // Správná podmínka pro desctop/mobile videa
      const isMobile = window.innerWidth < 768;
      if ((isMobile && $video.hasClass("desctop")) || (!isMobile && $video.hasClass("mobile"))) {
        $video.css("display", "none");
        return; // Přeskočíme zpracování tohoto videa
      } else {
        $video.show(); // Zajistíme, že správné video je viditelné
      }
    }

    // Najdeme nebo vytvoříme play/pause tlačítko
    let $playPauseBtn = $container.find(".playpause");
    if ($playPauseBtn.length === 0) {
      $playPauseBtn = jQuery('<div class="playpause"></div>');
      $container.append($playPauseBtn);
      console.log("Created new playpause button");
    } else {
      console.log("Found existing playpause button");
    }

    // Funkce pro aktualizaci stavu tlačítka podle stavu videa
    function updateButtonState() {
      if (videoEl.ended) {
        $video.removeClass("active");
        $playPauseBtn.html("<span>Přehrát znovu</span>").css({ display: "flex", opacity: 1 }).show();
      } else if (videoEl.paused) {
        $video.removeClass("active");
        $playPauseBtn.text("").css({ display: "flex", opacity: 1 }).show();
      } else {
        $video.addClass("active");
        $playPauseBtn.text("").fadeOut(200);
      }
    }

    // Kliknutí na video - přehrát/zastavit (včetně touch events pro mobil)
    $video.on("click.videoControl touchend.videoControl", function (e) {
      e.stopPropagation();
      e.preventDefault();

      // Debug log pro mobil
      const isMobile = window.innerWidth < 768;
      const videoClass = $video.attr("class") || "no classes";
      const paused = videoEl.paused;

      console.log("Video clicked/touched:", "isMobile:", isMobile, "videoClass:", videoClass, "paused:", paused);

      if (videoEl.paused) {
        pauseOtherVideos(videoEl);
        videoEl.play().catch((error) => console.error("Video play failed:", error));
      } else {
        videoEl.pause();
      }
    });

    // Kliknutí na tlačítko play/pause
    $playPauseBtn.on("click.videoControl", function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (videoEl.ended) {
        pauseOtherVideos(videoEl);
        videoEl.currentTime = 0;
        videoEl.play();
      } else if (videoEl.paused) {
        pauseOtherVideos(videoEl);
        videoEl.play();
      } else {
        videoEl.pause();
      }
      return false;
    });

    // Události videa
    $video.on("play.videoControl", function () {
      pauseOtherVideos(videoEl);
      updateButtonState();
    });
    $video.on("pause.videoControl ended.videoControl", updateButtonState);
    // Nastavení počátečního stavu
    updateButtonState();

    // Označíme video jako inicializované
    $video.data("video-initialized", true);
  }

  // Aplikujeme nové handlery na všechna videa - rozšířený selektor
  jQuery("video.desctop, video.mobile, .wrapper > video, .customer-video .wrapper > video, .customers-video video, .slick-slide video").each(
    function () {
      const $video = jQuery(this);
      initSingleVideo($video);
    }
  );

  // Event delegation pro dynamicky přidaná videa (slick slider a obecně)
  jQuery(document).on("click.videoControl touchend.videoControl", ".customers-video video, .slick-slide video, .customer-video video", function (e) {
    const $video = jQuery(this);
    const videoEl = $video[0];

    e.stopPropagation();
    e.preventDefault();

    const src = $video.find("source").attr("src") || "no source";
    const paused = videoEl.paused;

    console.log("Video clicked via delegation:", "src:", src, "paused:", paused);

    if (videoEl.paused) {
      pauseOtherVideos(videoEl);
      videoEl.play().catch((error) => console.error("Video play failed:", error));
    } else {
      videoEl.pause();
    }
  });

  // Obecný event delegation pro všechna videa (fallback)
  jQuery(document).on("click.videoControl touchend.videoControl", "video", function (e) {
    const $video = jQuery(this);
    const videoEl = $video[0];

    // Pokud video již má handlery, přeskočíme
    if ($video.data("video-initialized")) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    const src = $video.find("source").attr("src") || "no source";
    const paused = videoEl.paused;

    console.log("General video clicked via delegation:", "src:", src, "paused:", paused);

    if (videoEl.paused) {
      pauseOtherVideos(videoEl);
      videoEl.play().catch((error) => console.error("Video play failed:", error));
    } else {
      videoEl.pause();
    }
  });

  // Pro slick slider - reinicializujeme po každé změně slidu
  jQuery(document).on("afterChange", ".slick-initialized", function (event, slick, currentSlide) {
    console.log("Slick slide changed, reinitializing videos");
    setTimeout(() => {
      jQuery(".slick-active video").each(function () {
        const $video = jQuery(this);
        if (!$video.data("video-initialized")) {
          initSingleVideo($video);
          $video.data("video-initialized", true);
        }
      });
    }, 100);
  });
}
