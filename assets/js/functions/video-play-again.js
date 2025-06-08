/**
 * Video Play Again - Optimalizovaná verze
 * - Přehrávání/pauzování videa kliknutím
 * - Tlačítko "Přehrát znovu" na konci videa
 * - Zabránění přehrávání více videí současně
 */
export function initVideoPlayAgain() {
  // Odstraníme existující handlery
  jQuery("video.desctop, video.mobile").off("click.videoControl ended.videoControl play.videoControl pause.videoControl");

  // Funkce pro zastavení všech ostatních videí
  function pauseOtherVideos(currentVideo) {
    jQuery("video.desctop, video.mobile").each(function () {
      if (this !== currentVideo && !this.paused) {
        this.pause();
      }
    });
  }

  // Aplikujeme nové handlery na všechna videa
  jQuery("video.desctop, video.mobile").each(function () {
    const $video = jQuery(this);
    const $container = $video.parent();
    const videoEl = $video[0];

    // Zobrazujeme jen to video, které má být viditelné (podle viewportu)
    const isMobile = window.innerWidth < 768;
    if ((isMobile && $video.hasClass("desctop")) || (!isMobile && $video.hasClass("mobile"))) {
      $video.css("display", "none");
      return; // Přeskočíme zpracování tohoto videa
    }

    // Najdeme nebo vytvoříme play/pause tlačítko
    let $playPauseBtn = $container.find(".playpause");
    if ($playPauseBtn.length === 0) {
      $playPauseBtn = jQuery('<div class="playpause"></div>');
      $container.after($playPauseBtn);
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

    // Kliknutí na video - přehrát/zastavit
    $video.on("click.videoControl", function (e) {
      e.stopPropagation();
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
        // Pokud video skončilo, přehraj znovu
        pauseOtherVideos(videoEl);
        videoEl.currentTime = 0;
        videoEl.play();
      } else if (videoEl.paused) {
        // Pokud je zastavené, přehraj ho
        pauseOtherVideos(videoEl);
        videoEl.play();
      } else {
        // Pokud běží, zastav ho
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
  });
}
