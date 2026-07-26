/* Preisdarstellung und Bild-Platzhalter — überall dieselbe Formatierung. */
window.PREIS = (function () {
  "use strict";

  var formatierer = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

  function formatiere(cent) {
    return formatierer.format((cent || 0) / 100);
  }

  /* Steuer- und Versandhinweis kommt aus der Konfiguration — ein Ort, alle Seiten. */
  function hinweis(config) {
    var steuer = config.kleinunternehmer
      ? config.steuerhinweis
      : "inkl. gesetzlicher MwSt.";
    return steuer + ' zzgl. <a class="textlink" href="versand.html">Versandkosten</a>.';
  }

  return { formatiere: formatiere, hinweis: hinweis };
})();

/* Bild oder Platzhalter — die Seite sieht nie kaputt aus, auch ohne Fotos. */
window.BILD = (function () {
  "use strict";

  var symbol =
    '<svg class="slot__symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.2" aria-hidden="true">' +
    '<path d="M3 17c3-6 6-9 9-9s6 3 9 9"/><circle cx="12" cy="8" r="1.4"/></svg>';

  function platzhalter(datei) {
    return (
      '<div class="slot">' + symbol +
      '<span class="slot__wort">Foto folgt</span>' +
      (datei ? '<span class="slot__datei">' + text(datei) + "</span>" : "") +
      "</div>"
    );
  }

  /* Baut das <img>, prüft aber vorher, ob die Datei überhaupt existiert.
     Fehlt sie, bleibt der Platzhalter stehen. */
  function einsetzen(behaelter, bild) {
    if (!behaelter) return;
    var datei = bild && bild.src;
    behaelter.innerHTML = platzhalter(datei);
    if (!datei) return;

    var probe = new Image();
    probe.onload = function () {
      var el = document.createElement("img");
      el.src = datei;
      el.alt = (bild && bild.alt) || "";
      el.loading = "lazy";
      el.decoding = "async";
      behaelter.innerHTML = "";
      behaelter.appendChild(el);
    };
    probe.src = datei;
  }

  function text(wert) {
    return String(wert == null ? "" : wert)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  return { platzhalter: platzhalter, einsetzen: einsetzen, text: text };
})();
