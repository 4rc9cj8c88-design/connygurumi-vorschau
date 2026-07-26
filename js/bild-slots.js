/* Feste Bildflächen im HTML: <div data-bild="img/…jpg" data-alt="…"></div>
   Ist die Datei da, wird sie eingesetzt. Fehlt sie, bleibt der Platzhalter stehen. */
(function () {
  "use strict";
  document.querySelectorAll("[data-bild]").forEach(function (el) {
    window.BILD.einsetzen(el, { src: el.dataset.bild, alt: el.dataset.alt || "" });
  });
})();
