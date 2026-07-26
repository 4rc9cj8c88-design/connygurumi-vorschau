/* Lädt Katalog und Einstellungen genau einmal pro Seitenaufruf.
   Einzige Quelle für Produktdaten — im Warenkorb stehen nur IDs, nie Preise. */
window.SHOP = (function () {
  "use strict";

  var versprechen = null;

  function laden() {
    if (versprechen) return versprechen;

    versprechen = Promise.all([
      hole("daten/produkte.json"),
      hole("daten/shop-config.json")
    ]).then(function (teile) {
      var katalog = teile[0];
      var config = teile[1];

      var produkte = (katalog.produkte || [])
        .filter(function (p) { return p.status !== "entwurf"; })
        .sort(function (a, b) { return (a.reihenfolge || 999) - (b.reihenfolge || 999); });

      var nachId = {};
      var nachSlug = {};
      produkte.forEach(function (p) { nachId[p.id] = p; nachSlug[p.slug] = p; });

      return {
        produkte: produkte,
        config: config,
        nachId: function (id) { return nachId[id] || null; },
        nachSlug: function (slug) { return nachSlug[slug] || null; },
        kategorieName: function (id) {
          var k = (config.kategorien || []).find(function (x) { return x.id === id; });
          return k ? k.name : id;
        }
      };
    });

    return versprechen;
  }

  function hole(pfad) {
    return fetch(pfad, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(pfad + " → HTTP " + r.status);
      return r.json();
    });
  }

  /* Sichtbarer Hinweis, wenn die Seite per Doppelklick statt über einen
     kleinen Server geöffnet wurde — dann verbietet der Browser das Laden
     der JSON-Dateien und der Shop bliebe sonst wortlos leer. */
  function fehlerAnzeigen(ziel, fehler) {
    if (!ziel) return;
    var lokal = location.protocol === "file:";
    ziel.innerHTML =
      '<div class="leer"><p>' +
      (lokal
        ? "Die Produktdaten lassen sich so nicht laden. Bitte die Seite über einen lokalen Server öffnen (Datei <em>start.command</em> doppelklicken)."
        : "Die Produkte konnten gerade nicht geladen werden. Bitte die Seite neu laden.") +
      "</p></div>";
    if (window.console) console.error(fehler);
  }

  return { laden: laden, fehlerAnzeigen: fehlerAnzeigen };
})();
