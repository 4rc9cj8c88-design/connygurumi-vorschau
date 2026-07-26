/* Baut die Versandkosten-Tabelle aus daten/shop-config.json.
   So stehen die Preise nur an einer Stelle und können nie auseinanderlaufen. */
(function () {
  "use strict";

  var ziel = document.getElementById("versandtabelle");
  if (!ziel) return;

  window.SHOP.laden().then(function (daten) {
    var v = daten.config.versand;
    var laender = daten.config.lieferlaender || ["DE"];
    var namen = { DE: "Deutschland", AT: "Österreich" };

    var dl = document.createElement("dl");
    dl.className = "daten";

    Object.keys(v.klassen).forEach(function (schluessel) {
      var k = v.klassen[schluessel];
      var werte = laender.map(function (l) {
        if (k[l] == null) return namen[l] + ": auf Anfrage";
        return namen[l] + ": " + (k[l] === 0 ? "kostenlos" : window.PREIS.formatiere(k[l]));
      });
      var zeile = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = k.name;
      var dd = document.createElement("dd"); dd.textContent = werte.join(" · ");
      zeile.appendChild(dt); zeile.appendChild(dd);
      dl.appendChild(zeile);
    });

    ziel.appendChild(dl);

    if (v.versandfreiAbCent) {
      var frei = document.createElement("p");
      frei.innerHTML = "Ab einem Bestellwert von <strong>" +
        window.PREIS.formatiere(v.versandfreiAbCent) + "</strong> übernehme ich den Versand.";
      ziel.appendChild(frei);
    }
  }).catch(function (e) {
    window.SHOP.fehlerAnzeigen(ziel, e);
  });
})();
