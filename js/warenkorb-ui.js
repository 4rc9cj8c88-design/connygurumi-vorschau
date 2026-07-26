/* Zähler in der Kopfzeile und die Warenkorb-Schublade.
   Die Schublade wird hier gebaut, damit sie nicht in jeder HTML-Datei doppelt steht. */
(function () {
  "use strict";

  var knopf = document.getElementById("warenkorb-oeffnen");
  var zahl = document.getElementById("warenkorb-anzahl");
  if (!knopf || !zahl) return;

  var schublade = null;
  var liste = null;
  var fuss = null;

  bauen();
  zaehlerAktualisieren();
  document.addEventListener("warenkorb:aendern", function () {
    zaehlerAktualisieren();
    if (schublade && schublade.open) inhaltZeichnen();
  });

  knopf.addEventListener("click", function () {
    inhaltZeichnen();
    if (typeof schublade.showModal === "function") schublade.showModal();
    else location.href = "warenkorb.html";
  });

  function bauen() {
    schublade = document.createElement("dialog");
    schublade.className = "schublade";
    schublade.setAttribute("aria-label", "Warenkorb");

    var rahmen = document.createElement("div");
    rahmen.className = "schublade__rahmen";

    var kopf = document.createElement("div");
    kopf.className = "schublade__kopf";
    var titel = document.createElement("h2");
    titel.textContent = "Warenkorb";
    var zu = document.createElement("button");
    zu.type = "button";
    zu.className = "schliessen";
    zu.setAttribute("aria-label", "Warenkorb schließen");
    zu.textContent = "✕";
    zu.addEventListener("click", function () { schublade.close(); });
    kopf.appendChild(titel);
    kopf.appendChild(zu);

    liste = document.createElement("div");
    liste.className = "schublade__liste";

    fuss = document.createElement("div");
    fuss.className = "schublade__fuss";

    rahmen.appendChild(kopf);
    rahmen.appendChild(liste);
    rahmen.appendChild(fuss);
    schublade.appendChild(rahmen);
    document.body.appendChild(schublade);

    /* Klick auf den abgedunkelten Bereich schließt */
    schublade.addEventListener("click", function (e) {
      if (e.target === schublade) schublade.close();
    });
  }

  function zaehlerAktualisieren() {
    var n = window.KORB.anzahl();
    zahl.textContent = String(n);
    zahl.hidden = n === 0;
  }

  function inhaltZeichnen() {
    window.SHOP.laden().then(function (daten) {
      var stand = window.KORB.abgleichen(daten);
      liste.innerHTML = "";
      fuss.innerHTML = "";

      if (!stand.positionen.length) {
        liste.innerHTML =
          '<div class="leer"><p>Noch nichts ausgewählt.</p></div>';
        var weiter = knopfEl("Arbeiten ansehen", "knopf knopf--linie");
        weiter.addEventListener("click", function () { location.href = "shop.html"; });
        fuss.appendChild(weiter);
        return;
      }

      stand.positionen.forEach(function (eintrag) {
        liste.appendChild(postenEl(eintrag));
      });

      var summe = window.VERSAND.zwischensumme(stand.bestellbar);
      fuss.appendChild(summeEl("Zwischensumme", window.PREIS.formatiere(summe)));

      var info = document.createElement("p");
      info.className = "karte__meta";
      info.style.marginTop = ".4rem";
      info.innerHTML = daten.config.kleinunternehmer
        ? window.BILD.text(daten.config.steuerhinweis) + " Versandkosten im nächsten Schritt."
        : "inkl. MwSt. Versandkosten im nächsten Schritt.";
      fuss.appendChild(info);

      var zurKasse = knopfEl("Zur Bestellübersicht", "knopf knopf--voll");
      zurKasse.style.width = "100%";
      zurKasse.style.marginTop = "1rem";
      zurKasse.disabled = stand.bestellbar.length === 0;
      zurKasse.addEventListener("click", function () { location.href = "warenkorb.html"; });
      fuss.appendChild(zurKasse);
    });
  }

  function postenEl(eintrag) {
    var p = eintrag.produkt;
    var el = document.createElement("div");
    el.className = "posten" + (eintrag.problem ? " posten--problem" : "");

    var bild = document.createElement("div");
    bild.className = "posten__bild";
    window.BILD.einsetzen(bild, p.bilder && p.bilder[0]);

    var rechts = document.createElement("div");

    var titel = document.createElement("a");
    titel.className = "posten__titel";
    titel.href = "produkt.html?p=" + encodeURIComponent(p.slug);
    titel.textContent = p.titel;
    rechts.appendChild(titel);

    if (eintrag.gravur) {
      var gr = document.createElement("p");
      gr.className = "posten__gravur";
      gr.textContent = "Gravur: „" + eintrag.gravur + "“";
      rechts.appendChild(gr);
    }

    if (eintrag.problem) {
      var pr = document.createElement("p");
      pr.className = "posten__problem";
      pr.textContent = eintrag.problem;
      rechts.appendChild(pr);
    }

    var zeile = document.createElement("div");
    zeile.className = "posten__zeile";

    if (eintrag.problem) {
      var weg = document.createElement("button");
      weg.type = "button";
      weg.className = "entfernen";
      weg.textContent = "Entfernen";
      weg.addEventListener("click", function () { window.KORB.entfernen(eintrag.id, eintrag.gravur); });
      zeile.appendChild(weg);
    } else if (p.unikat) {
      var einzel = document.createElement("span");
      einzel.className = "karte__meta";
      einzel.textContent = "Einzelstück";
      zeile.appendChild(einzel);
      zeile.appendChild(entfernenEl(eintrag));
    } else {
      zeile.appendChild(mengeEl(eintrag));
      zeile.appendChild(entfernenEl(eintrag));
    }

    rechts.appendChild(zeile);

    var preis = document.createElement("div");
    preis.className = "posten__zeile";
    var pv = document.createElement("span");
    pv.className = "posten__preis";
    pv.textContent = window.PREIS.formatiere(p.preisCent * eintrag.menge);
    preis.appendChild(pv);
    rechts.appendChild(preis);

    el.appendChild(bild);
    el.appendChild(rechts);
    return el;
  }

  function mengeEl(eintrag) {
    var box = document.createElement("div");
    box.className = "menge";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Menge verringern");
    minus.disabled = eintrag.menge <= 1;
    minus.addEventListener("click", function () {
      window.KORB.setzen(eintrag.id, eintrag.menge - 1, eintrag.gravur);
    });

    var wert = document.createElement("span");
    wert.textContent = String(eintrag.menge);

    var plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Menge erhöhen");
    plus.disabled = eintrag.menge >= eintrag.produkt.bestand;
    plus.addEventListener("click", function () {
      window.KORB.setzen(eintrag.id, eintrag.menge + 1, eintrag.gravur);
    });

    box.appendChild(minus);
    box.appendChild(wert);
    box.appendChild(plus);
    return box;
  }

  function entfernenEl(eintrag) {
    var weg = document.createElement("button");
    weg.type = "button";
    weg.className = "entfernen";
    weg.textContent = "Entfernen";
    weg.addEventListener("click", function () { window.KORB.entfernen(eintrag.id, eintrag.gravur); });
    return weg;
  }

  function summeEl(bezeichnung, wert) {
    var el = document.createElement("div");
    el.className = "summe";
    var a = document.createElement("span"); a.textContent = bezeichnung;
    var b = document.createElement("span"); b.textContent = wert;
    el.appendChild(a); el.appendChild(b);
    return el;
  }

  function knopfEl(beschriftung, klasse) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = beschriftung;
    return b;
  }
})();
