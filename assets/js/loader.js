(function () {
  var base = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/js/";
  var versionUrl = base + "version.json";

  fetch(versionUrl, { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var s = document.createElement("script");
      s.type = "module";
      s.src = base + "luxuryCar.js?v=" + data.v;
      document.head.appendChild(s);
    })
    .catch(function () {
      var s = document.createElement("script");
      s.type = "module";
      s.src = base + "luxuryCar.js";
      document.head.appendChild(s);
    });
})();
