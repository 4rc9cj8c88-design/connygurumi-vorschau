/* Bestellübersicht auf warenkorb.html.
   Der einzige Umschalter zwischen Stufe 1 und Stufe 2 ist config.checkout:
   "anfrage" → Bestellung per E-Mail | "stripe" → Bezahlvorgang über die Serverfunktion.
   Beide Wege nutzen dieselbe Nutzlast aus bestellPayload(). */
(function () {
  "use strict";

  var seite = document.getElementById("kasse");
  if (!seite) return;

  var listeEl = document.getElementById("kasse-liste");
  var summenEl = document.getElementById("kasse-summen");
  var pflichtEl = document.getElementById("kasse-pflicht");
  var landEl = document.getElementById("land");
  var formular = document.getElementById("bestellformular");
  var absendenEl = document.getElementById("absenden");
  var meldungEl = document.getElementById("kasse-meldung");
  var zustimmungEl = document.getElementById("zustimmung");

  var daten = null;
  var stand = null;

  window.SHOP.laden().then(function (d) {
    daten = d;
    if (landEl) {
      (d.config.lieferlaender || ["DE"]).forEach(function (l) {
        var o = document.createElement("option");
        o.value = l;
        o.textContent = l === "DE" ? "Deutschland" : (l === "AT" ? "Österreich" : l);
        landEl.appendChild(o);
      });
      landEl.addEventListener("change", zeichne);
    }
    absendenEl.textContent = d.config.checkout === "stripe"
      ? "Zahlungspflichtig bestellen"
      : "Bestellung unverbindlich absenden";
    zeichne();
  }).catch(function (e) {
    window.SHOP.fehlerAnzeigen(listeEl, e);
  });

  document.addEventListener("warenkorb:aendern", function () { if (daten) zeichne(); });

  function zeichne() {
    stand = window.KORB.abgleichen(daten);
    var land = landEl ? landEl.value : "DE";

    /* ---------- Positionen ---------- */
    listeEl.innerHTML = "";
    if (!stand.positionen.length) {
      listeEl.innerHTML = '<div class="leer"><p>Der Warenkorb ist leer.</p>' +
        '<p style="margin-top:1rem"><a class="knopf knopf--linie" href="shop.html">Arbeiten ansehen</a></p></div>';
      summenEl.innerHTML = "";
      pflichtEl.innerHTML = "";
      formular.hidden = true;
      return;
    }
    formular.hidden = false;

    stand.positionen.forEach(function (e) {
      listeEl.appendChild(posten(e));
    });

    /* ---------- Summen ---------- */
    var bestellbar = stand.bestellbar;
    var zwischen = window.VERSAND.zwischensumme(bestellbar);
    var versand = window.VERSAND.berechne(bestellbar, land, daten.config);
    var gesamt = zwischen + versand.preisCent;

    summenEl.innerHTML = "";
    summenEl.appendChild(summe("Zwischensumme", window.PREIS.formatiere(zwischen)));
    summenEl.appendChild(summe(
      "Versand (" + versand.name + ")",
      versand.versandfrei ? "geschenkt" : window.PREIS.formatiere(versand.preisCent)
    ));
    summenEl.appendChild(summe("Gesamt", window.PREIS.formatiere(gesamt), true));

    var steuer = document.createElement("p");
    steuer.className = "karte__meta";
    steuer.style.marginTop = ".5rem";
    steuer.innerHTML = window.PREIS.hinweis(daten.config);
    summenEl.appendChild(steuer);

    /* ---------- Pflichtangaben direkt über dem Knopf ---------- */
    pflichtEl.innerHTML = "";
    var h = document.createElement("h3");
    h.textContent = "Deine Bestellung";
    pflichtEl.appendChild(h);
    var ul = document.createElement("ul");
    bestellbar.forEach(function (e) {
      var li = document.createElement("li");
      var links = document.createElement("span");
      links.textContent = e.menge + " × " + e.produkt.titel + (e.gravur ? " (Gravur: „" + e.gravur + "“)" : "");
      var rechts = document.createElement("span");
      rechts.textContent = window.PREIS.formatiere(e.produkt.preisCent * e.menge);
      li.appendChild(links); li.appendChild(rechts);
      ul.appendChild(li);
    });
    var liVersand = document.createElement("li");
    liVersand.innerHTML = "<span>Versand nach " + (land === "DE" ? "Deutschland" : "Österreich") + "</span><span>" +
      (versand.versandfrei ? "geschenkt" : window.PREIS.formatiere(versand.preisCent)) + "</span>";
    ul.appendChild(liVersand);
    var liGesamt = document.createElement("li");
    liGesamt.style.borderTop = "1px solid var(--line)";
    liGesamt.style.marginTop = ".4rem";
    liGesamt.style.paddingTop = ".5rem";
    liGesamt.style.fontWeight = "600";
    liGesamt.innerHTML = "<span>Gesamt</span><span>" + window.PREIS.formatiere(gesamt) + "</span>";
    ul.appendChild(liGesamt);
    pflichtEl.appendChild(ul);

    var lieferzeit = document.createElement("p");
    lieferzeit.className = "karte__meta";
    lieferzeit.style.marginTop = ".7rem";
    lieferzeit.textContent = "Lieferzeit " + daten.config.versand.lieferzeitTage[0] +
      "–" + daten.config.versand.lieferzeitTage[1] + " Werktage nach Zahlungseingang.";
    pflichtEl.appendChild(lieferzeit);

    /* ---------- Blockaden ---------- */
    var unmoeglich = window.VERSAND.nichtLieferbar(bestellbar, land, daten.config);
    var blockiert = stand.probleme.length > 0 || bestellbar.length === 0 || unmoeglich.length > 0;
    absendenEl.disabled = blockiert;

    meldungEl.innerHTML = "";
    if (stand.probleme.length) {
      hinweis("Bitte die markierten Positionen entfernen, dann geht es weiter.");
    } else if (unmoeglich.length) {
      hinweis("„" + unmoeglich[0].produkt.titel + "“ lässt sich nicht in dieses Land versenden. " +
        "Bitte den Artikel entfernen oder uns direkt anschreiben.");
    }
  }

  function hinweis(nachricht) {
    var el = document.createElement("p");
    el.className = "meldung meldung--fehler";
    el.textContent = nachricht;
    meldungEl.appendChild(el);
  }

  function posten(e) {
    var el = document.createElement("div");
    el.className = "posten" + (e.problem ? " posten--problem" : "");

    var bild = document.createElement("div");
    bild.className = "posten__bild";
    window.BILD.einsetzen(bild, e.produkt.bilder && e.produkt.bilder[0]);

    var rechts = document.createElement("div");
    var titel = document.createElement("a");
    titel.className = "posten__titel";
    titel.href = "produkt.html?p=" + encodeURIComponent(e.produkt.slug);
    titel.textContent = e.produkt.titel;
    rechts.appendChild(titel);

    if (e.gravur) {
      var g = document.createElement("p");
      g.className = "posten__gravur";
      g.textContent = "Gravur: „" + e.gravur + "“";
      rechts.appendChild(g);
    }
    if (e.problem) {
      var pr = document.createElement("p");
      pr.className = "posten__problem";
      pr.textContent = e.problem;
      rechts.appendChild(pr);
    }

    var zeile = document.createElement("div");
    zeile.className = "posten__zeile";

    if (!e.problem && !e.produkt.unikat) {
      var box = document.createElement("div");
      box.className = "menge";
      var minus = mengenKnopf("−", "Menge verringern", e.menge <= 1, function () {
        window.KORB.setzen(e.id, e.menge - 1, e.gravur);
      });
      var wert = document.createElement("span");
      wert.textContent = String(e.menge);
      var plus = mengenKnopf("+", "Menge erhöhen", e.menge >= e.produkt.bestand, function () {
        window.KORB.setzen(e.id, e.menge + 1, e.gravur);
      });
      box.appendChild(minus); box.appendChild(wert); box.appendChild(plus);
      zeile.appendChild(box);
    } else if (!e.problem) {
      var einzel = document.createElement("span");
      einzel.className = "karte__meta";
      einzel.textContent = "Einzelstück";
      zeile.appendChild(einzel);
    }

    var weg = document.createElement("button");
    weg.type = "button";
    weg.className = "entfernen";
    weg.textContent = "Entfernen";
    weg.addEventListener("click", function () { window.KORB.entfernen(e.id, e.gravur); });
    zeile.appendChild(weg);

    var preis = document.createElement("span");
    preis.className = "posten__preis";
    preis.textContent = window.PREIS.formatiere(e.produkt.preisCent * e.menge);
    zeile.appendChild(preis);

    rechts.appendChild(zeile);
    el.appendChild(bild);
    el.appendChild(rechts);
    return el;
  }

  function mengenKnopf(zeichen, beschriftung, gesperrt, aktion) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = zeichen;
    b.setAttribute("aria-label", beschriftung);
    b.disabled = gesperrt;
    b.addEventListener("click", aktion);
    return b;
  }

  function summe(bezeichnung, wert, gesamt) {
    var el = document.createElement("div");
    el.className = "summe" + (gesamt ? " summe--gesamt" : "");
    var a = document.createElement("span"); a.textContent = bezeichnung;
    var b = document.createElement("span"); b.textContent = wert;
    el.appendChild(a); el.appendChild(b);
    return el;
  }

  /* ---------- gemeinsame Nutzlast für beide Stufen ---------- */
  function bestellPayload() {
    var land = landEl ? landEl.value : "DE";
    var bestellbar = stand.bestellbar;
    var zwischen = window.VERSAND.zwischensumme(bestellbar);
    var versand = window.VERSAND.berechne(bestellbar, land, daten.config);
    var f = new FormData(formular);

    return {
      positionen: bestellbar.map(function (e) {
        return { id: e.id, menge: e.menge, gravur: e.gravur };
      }),
      land: land,
      kunde: {
        name: (f.get("name") || "").trim(),
        email: (f.get("email") || "").trim(),
        telefon: (f.get("telefon") || "").trim(),
        strasse: (f.get("strasse") || "").trim(),
        plz: (f.get("plz") || "").trim(),
        stadt: (f.get("stadt") || "").trim(),
        nachricht: (f.get("nachricht") || "").trim()
      },
      summen: {
        zwischensummeCent: zwischen,
        versandCent: versand.preisCent,
        versandName: versand.name,
        gesamtCent: zwischen + versand.preisCent
      }
    };
  }

  function alsText(p) {
    var zeilen = ["Bestellung", ""];
    p.positionen.forEach(function (pos) {
      var produkt = daten.nachId(pos.id);
      zeilen.push("- " + pos.menge + " x " + produkt.titel +
        (pos.gravur ? " (Gravur: " + pos.gravur + ")" : "") +
        "  " + window.PREIS.formatiere(produkt.preisCent * pos.menge));
    });
    zeilen.push("");
    zeilen.push("Zwischensumme: " + window.PREIS.formatiere(p.summen.zwischensummeCent));
    zeilen.push("Versand (" + p.summen.versandName + "): " + window.PREIS.formatiere(p.summen.versandCent));
    zeilen.push("Gesamt: " + window.PREIS.formatiere(p.summen.gesamtCent));
    zeilen.push("");
    zeilen.push("Name: " + p.kunde.name);
    zeilen.push("E-Mail: " + p.kunde.email);
    if (p.kunde.telefon) zeilen.push("Telefon: " + p.kunde.telefon);
    zeilen.push("Adresse: " + p.kunde.strasse + ", " + p.kunde.plz + " " + p.kunde.stadt + " (" + p.land + ")");
    if (p.kunde.nachricht) { zeilen.push(""); zeilen.push("Nachricht: " + p.kunde.nachricht); }
    return zeilen.join("\n");
  }

  /* ---------- Absenden ---------- */
  formular.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!formular.reportValidity()) return;
    if (zustimmungEl && !zustimmungEl.checked) {
      meldungEl.innerHTML = "";
      hinweis("Bitte die Widerrufsbelehrung und die Bedingungen bestätigen.");
      return;
    }

    var nutzlast = bestellPayload();
    if (!nutzlast.positionen.length) return;

    absendenEl.disabled = true;
    var alterText = absendenEl.textContent;
    absendenEl.textContent = "Einen Moment …";
    meldungEl.innerHTML = "";

    if (daten.config.checkout === "stripe") {
      zurBezahlung(nutzlast, alterText);
    } else {
      alsAnfrage(nutzlast, alterText);
    }
  });

  /* Stufe 1 — Bestellung landet als E-Mail bei der Werkstatt. */
  function alsAnfrage(nutzlast, alterText) {
    var felder = new URLSearchParams();
    felder.append("form-name", "bestellung");
    felder.append("name", nutzlast.kunde.name);
    felder.append("email", nutzlast.kunde.email);
    felder.append("telefon", nutzlast.kunde.telefon);
    felder.append("adresse", nutzlast.kunde.strasse + ", " + nutzlast.kunde.plz + " " + nutzlast.kunde.stadt + " (" + nutzlast.land + ")");
    felder.append("bestellung", alsText(nutzlast));

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: felder.toString()
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      window.KORB.leeren();
      location.href = "danke.html?art=anfrage";
    }).catch(function () {
      /* Solange die Seite noch nicht bei einem Formulardienst liegt:
         E-Mail-Programm mit fertigem Text öffnen, damit nichts verloren geht. */
      absendenEl.disabled = false;
      absendenEl.textContent = alterText;
      var adresse = daten.config.email && daten.config.email.indexOf("@") > -1
        ? daten.config.email : "";
      var link = "mailto:" + adresse +
        "?subject=" + encodeURIComponent("Bestellung über die Website") +
        "&body=" + encodeURIComponent(alsText(nutzlast));
      meldungEl.innerHTML = "";
      var el = document.createElement("p");
      el.className = "meldung meldung--fehler";
      el.innerHTML = "Der Versand über die Website ist noch nicht eingerichtet. " +
        '<a class="textlink" href="' + link + '">Bestellung stattdessen per E-Mail schicken</a>.';
      meldungEl.appendChild(el);
    });
  }

  /* Stufe 2 — Preise werden auf dem Server neu gerechnet, dann weiter zu Stripe. */
  function zurBezahlung(nutzlast, alterText) {
    var schluessel = sessionStorage.getItem("bestellSchluessel");
    if (!schluessel) {
      schluessel = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : String(Date.now()) + Math.round(Math.random() * 1e9);
      sessionStorage.setItem("bestellSchluessel", schluessel);
    }
    nutzlast.idempotenzSchluessel = schluessel;

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nutzlast)
    }).then(function (r) {
      return r.json().then(function (koerper) { return { ok: r.ok, koerper: koerper }; });
    }).then(function (antwort) {
      if (antwort.ok && antwort.koerper.url) {
        sessionStorage.removeItem("bestellSchluessel");
        window.location.href = antwort.koerper.url;
        return;
      }
      throw new Error(antwort.koerper && antwort.koerper.fehler ? antwort.koerper.fehler : "unbekannt");
    }).catch(function () {
      absendenEl.disabled = false;
      absendenEl.textContent = alterText;
      meldungEl.innerHTML = "";
      hinweis("Die Bezahlung ließ sich gerade nicht starten. Bitte noch einmal versuchen oder uns kurz anschreiben.");
    });
  }
})();
