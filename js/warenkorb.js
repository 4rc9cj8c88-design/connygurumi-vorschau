/* Warenkorb-Zustand.
   Wichtig: gespeichert werden NUR Produkt-ID, Menge und ein eventueller Gravurtext.
   Preise, Titel und Bilder kommen bei jeder Anzeige frisch aus produkte.json —
   damit kann ein veralteter Preis strukturell nicht entstehen. */
window.KORB = (function () {
  "use strict";

  var SCHLUESSEL = "shop.warenkorb.v1";
  var HALTBAR_MS = 30 * 24 * 60 * 60 * 1000; /* 30 Tage */
  var speicherGeht = true;
  var imSpeicher = null; /* Rückfallebene, falls localStorage blockiert ist (Safari privat) */

  function lies() {
    if (imSpeicher) return imSpeicher;
    try {
      var roh = localStorage.getItem(SCHLUESSEL);
      if (!roh) return frisch();
      var daten = JSON.parse(roh);
      if (!daten || daten.schema !== 1 || !Array.isArray(daten.positionen)) return frisch();
      if (Date.now() - (daten.aktualisiert || 0) > HALTBAR_MS) return frisch();
      return daten;
    } catch (e) {
      return frisch();
    }
  }

  function schreib(daten) {
    daten.aktualisiert = Date.now();
    if (speicherGeht) {
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
      } catch (e) {
        speicherGeht = false;
        imSpeicher = daten;
      }
    } else {
      imSpeicher = daten;
    }
    document.dispatchEvent(new CustomEvent("warenkorb:aendern"));
  }

  function frisch() {
    return { schema: 1, aktualisiert: Date.now(), positionen: [] };
  }

  function finde(daten, id, gravur) {
    return daten.positionen.find(function (p) {
      return p.id === id && (p.gravur || "") === (gravur || "");
    });
  }

  /* ---------- öffentliche Befehle ---------- */

  function hinzufuegen(id, menge, gravur) {
    var daten = lies();
    var vorhanden = finde(daten, id, gravur);
    if (vorhanden) vorhanden.menge += menge || 1;
    else daten.positionen.push({ id: id, menge: menge || 1, gravur: gravur || "" });
    schreib(daten);
  }

  /* Unikate werden ersetzt statt addiert — Menge bleibt 1. */
  function setzen(id, menge, gravur) {
    var daten = lies();
    var vorhanden = finde(daten, id, gravur);
    if (vorhanden) vorhanden.menge = menge;
    else daten.positionen.push({ id: id, menge: menge, gravur: gravur || "" });
    schreib(daten);
  }

  function entfernen(id, gravur) {
    var daten = lies();
    daten.positionen = daten.positionen.filter(function (p) {
      return !(p.id === id && (p.gravur || "") === (gravur || ""));
    });
    schreib(daten);
  }

  function leeren() {
    schreib(frisch());
  }

  function anzahl() {
    return lies().positionen.reduce(function (s, p) { return s + p.menge; }, 0);
  }

  /* Verbindet den Korb mit dem aktuellen Katalog und meldet alles, was nicht stimmt.
     Gibt { positionen, probleme } zurück; jede Position hat das echte Produktobjekt. */
  function abgleichen(daten) {
    var korb = lies();
    var positionen = [];
    var probleme = [];
    var geaendert = false;

    korb.positionen.forEach(function (p) {
      var produkt = daten.nachId(p.id);

      if (!produkt) { geaendert = true; return; } /* Produkt gibt es nicht mehr */

      var eintrag = {
        id: p.id,
        gravur: p.gravur || "",
        menge: p.menge,
        produkt: produkt,
        problem: null
      };

      if (produkt.status !== "verfuegbar") {
        eintrag.problem = produkt.status === "verkauft"
          ? "Dieses Einzelstück ist inzwischen verkauft."
          : "Dieser Artikel ist derzeit nicht bestellbar.";
        probleme.push(eintrag);
      } else if (produkt.unikat && eintrag.menge > 1) {
        eintrag.menge = 1;
        geaendert = true;
      } else if (eintrag.menge > produkt.bestand) {
        eintrag.menge = Math.max(produkt.bestand, 0);
        geaendert = true;
        if (eintrag.menge === 0) {
          eintrag.problem = "Dieser Artikel ist ausverkauft.";
          probleme.push(eintrag);
        }
      }

      positionen.push(eintrag);
    });

    if (geaendert) {
      korb.positionen = positionen
        .filter(function (e) { return e.menge > 0 && !e.problem; })
        .map(function (e) { return { id: e.id, menge: e.menge, gravur: e.gravur }; });
      /* stilles Aufräumen, ohne Ereignis-Schleife auszulösen */
      try {
        korb.aktualisiert = Date.now();
        if (speicherGeht) localStorage.setItem(SCHLUESSEL, JSON.stringify(korb));
        else imSpeicher = korb;
      } catch (e) { /* egal */ }
    }

    return {
      positionen: positionen,
      probleme: probleme,
      bestellbar: positionen.filter(function (e) { return !e.problem && e.menge > 0; })
    };
  }

  /* Zwischen mehreren Tabs synchron halten */
  window.addEventListener("storage", function (e) {
    if (e.key === SCHLUESSEL) document.dispatchEvent(new CustomEvent("warenkorb:aendern"));
  });

  return {
    hinzufuegen: hinzufuegen,
    setzen: setzen,
    entfernen: entfernen,
    leeren: leeren,
    anzahl: anzahl,
    abgleichen: abgleichen,
    speicherGeht: function () { return speicherGeht; }
  };
})();
