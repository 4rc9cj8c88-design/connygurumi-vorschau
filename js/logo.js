/* Logo-Bild statt Schriftzug.
   Sobald img/logo.svg (bevorzugt) oder img/logo.png existiert, ersetzt es die Wortmarke.
   Fehlt beides, bleibt der gesetzte Schriftzug stehen — die Seite sieht nie leer aus. */
(function () {
  "use strict";

  var marken = document.querySelectorAll(".wortmarke");
  if (!marken.length) return;

  probiere(["img/logo.svg", "img/logo.png"], 0);

  function probiere(dateien, i) {
    if (i >= dateien.length) return;
    var probe = new Image();
    probe.onload = function () { einsetzen(dateien[i]); };
    probe.onerror = function () { probiere(dateien, i + 1); };
    probe.src = dateien[i];
  }

  function einsetzen(datei) {
    marken.forEach(function (el) {
      var bild = document.createElement("img");
      bild.src = datei;
      bild.alt = "Handmade by CB";
      bild.decoding = "async";
      el.innerHTML = "";
      el.appendChild(bild);
      el.classList.add("wortmarke--bild");
    });
  }
})();
