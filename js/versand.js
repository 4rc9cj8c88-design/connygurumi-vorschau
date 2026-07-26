/* Versandkosten. Reine Funktion ohne Zugriff auf die Seite —
   die spätere Stripe-Funktion auf dem Server rechnet mit exakt derselben Logik. */
window.VERSAND = (function () {
  "use strict";

  /* positionen: [{ produkt, menge }] */
  function berechne(positionen, land, config) {
    var v = config.versand;
    var leer = { name: "—", preisCent: 0, versandfrei: false };
    if (!positionen.length) return leer;

    var zwischensumme = positionen.reduce(function (s, p) {
      return s + preisVon(p.produkt) * p.menge;
    }, 0);

    /* Ein Paket, die teuerste Klasse im Korb bestimmt den Preis. */
    var beste = null;
    positionen.forEach(function (p) {
      var klasse = v.klassen[p.produkt.versandklasse];
      if (!klasse) return;
      var preis = klasse[land];
      if (preis == null) return;
      if (!beste || preis > beste.preisCent) beste = { name: klasse.name, preisCent: preis };
    });

    if (!beste) return { name: "Auf Anfrage", preisCent: 0, versandfrei: false, unklar: true };

    if (v.versandfreiAbCent && zwischensumme >= v.versandfreiAbCent) {
      return { name: beste.name, preisCent: 0, versandfrei: true };
    }
    return { name: beste.name, preisCent: beste.preisCent, versandfrei: false };
  }

  /* Nicht lieferbare Klassen je Land finden (z. B. Sperrgut nach Österreich). */
  function nichtLieferbar(positionen, land, config) {
    return positionen.filter(function (p) {
      var klasse = config.versand.klassen[p.produkt.versandklasse];
      return !klasse || klasse[land] == null;
    });
  }

  function preisVon(produkt) {
    return produkt.preisCent || 0;
  }

  function zwischensumme(positionen) {
    return positionen.reduce(function (s, p) { return s + preisVon(p.produkt) * p.menge; }, 0);
  }

  return { berechne: berechne, nichtLieferbar: nichtLieferbar, zwischensumme: zwischensumme };
})();
