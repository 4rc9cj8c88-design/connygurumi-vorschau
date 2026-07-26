/* Produktdetailseite: produkt.html?p=<slug> */
(function () {
  "use strict";

  var wurzel = document.getElementById("produkt");
  if (!wurzel) return;

  var slug = new URLSearchParams(location.search).get("p");

  window.SHOP.laden().then(function (daten) {
    var p = slug ? daten.nachSlug(slug) : null;
    if (!p) { nichtGefunden(); return; }
    zeichne(p, daten);
  }).catch(function (e) {
    window.SHOP.fehlerAnzeigen(wurzel, e);
  });

  function nichtGefunden() {
    document.title = "Nicht gefunden — Connygurumi";
    wurzel.innerHTML =
      '<div class="leer"><p>Dieses Stück gibt es nicht mehr.</p>' +
      '<p style="margin-top:1rem"><a class="knopf knopf--linie" href="shop.html">Alle Arbeiten ansehen</a></p></div>';
  }

  function zeichne(p, daten) {
    document.title = p.titel + " — Connygurumi";
    var beschreibung = document.querySelector('meta[name="description"]');
    if (beschreibung) beschreibung.setAttribute("content", p.kurztext);

    wurzel.innerHTML = "";
    wurzel.className = "produkt";

    /* ---------- Galerie ---------- */
    var galerie = document.createElement("div");
    galerie.className = "produkt__galerie";

    var gross = document.createElement("div");
    gross.className = "produkt__gross zeig-bild";
    window.BILD.einsetzen(gross, p.bilder && p.bilder[0]);
    galerie.appendChild(gross);

    if (p.bilder && p.bilder.length > 1) {
      var reihe = document.createElement("div");
      reihe.className = "produkt__reihe";
      p.bilder.slice(1).forEach(function (b) {
        var zelle = document.createElement("button");
        zelle.type = "button";
        zelle.setAttribute("aria-label", "Bild groß anzeigen");
        window.BILD.einsetzen(zelle, b);
        zelle.addEventListener("click", function () { window.BILD.einsetzen(gross, b); });
        reihe.appendChild(zelle);
      });
      galerie.appendChild(reihe);
    }

    /* ---------- Angaben ---------- */
    var text = document.createElement("div");
    text.className = "zeig";

    var marke = document.createElement("p");
    marke.className = "marke";
    marke.textContent = daten.kategorieName(p.kategorie);

    var titel = document.createElement("h1");
    titel.className = "titel-mittel";
    titel.textContent = p.titel;

    var kurz = document.createElement("p");
    kurz.className = "gedaempft";
    kurz.style.marginTop = ".8rem";
    kurz.textContent = p.kurztext;

    var preis = document.createElement("p");
    preis.className = "produkt__preis";
    preis.textContent = window.PREIS.formatiere(p.preisCent);

    var steuer = document.createElement("p");
    steuer.className = "produkt__steuer";
    steuer.innerHTML = window.PREIS.hinweis(daten.config);

    text.appendChild(marke);
    text.appendChild(titel);
    text.appendChild(kurz);
    text.appendChild(preis);
    text.appendChild(steuer);

    /* ---------- Gravurfeld ---------- */
    var gravurEingabe = null;
    if (p.gravurFeld && p.gravurFeld.aktiv) {
      var feld = document.createElement("label");
      feld.className = "feld";
      var bez = document.createElement("span");
      bez.textContent = p.gravurFeld.beschriftung + " (max. " + p.gravurFeld.maxZeichen + " Zeichen)";
      gravurEingabe = document.createElement("input");
      gravurEingabe.type = "text";
      gravurEingabe.maxLength = p.gravurFeld.maxZeichen;
      gravurEingabe.placeholder = "z. B. Familie Sommer";
      var zaehler = document.createElement("span");
      zaehler.className = "feld__zaehler";
      zaehler.textContent = "0 / " + p.gravurFeld.maxZeichen;
      gravurEingabe.addEventListener("input", function () {
        zaehler.textContent = gravurEingabe.value.length + " / " + p.gravurFeld.maxZeichen;
      });
      feld.appendChild(bez);
      feld.appendChild(gravurEingabe);
      feld.appendChild(zaehler);
      text.appendChild(feld);
    }

    /* ---------- Kaufen ---------- */
    var kaufen = document.createElement("div");
    kaufen.className = "produkt__kaufen nur-mit-js";

    if (p.status === "verfuegbar" && p.bestand > 0) {
      var knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "knopf knopf--voll";
      knopf.textContent = "In den Warenkorb";
      knopf.addEventListener("click", function () {
        var gravur = gravurEingabe ? gravurEingabe.value.trim() : "";
        if (gravurEingabe && !gravur) {
          rueckmeldung(kaufen, "Bitte den Wunschtext für die Gravur eintragen.", true);
          gravurEingabe.focus();
          return;
        }
        if (p.unikat) window.KORB.setzen(p.id, 1, gravur);
        else window.KORB.hinzufuegen(p.id, 1, gravur);
        rueckmeldung(kaufen, "Im Warenkorb.", false);
      });
      kaufen.appendChild(knopf);

      var hin = document.createElement("span");
      hin.className = "karte__meta";
      hin.textContent = p.unikat ? "Einzelstück — nur einmal vorhanden" : "Noch " + p.bestand + " verfügbar";
      kaufen.appendChild(hin);
    } else {
      var anfrage = document.createElement("a");
      anfrage.className = "knopf knopf--linie";
      anfrage.href = "wunsch.html?stueck=" + encodeURIComponent(p.titel);
      anfrage.textContent = p.status === "verkauft" ? "Ähnliches anfragen" : "Anfragen";
      kaufen.appendChild(anfrage);

      var weg = document.createElement("span");
      weg.className = "karte__meta";
      weg.textContent = p.status === "verkauft" ? "Dieses Stück ist verkauft." : "Derzeit nicht bestellbar.";
      kaufen.appendChild(weg);
    }
    text.appendChild(kaufen);

    /* Ohne JavaScript: Hinweis statt totem Knopf */
    var ohneJs = document.createElement("p");
    ohneJs.className = "ohne-js hinweis";
    ohneJs.innerHTML = 'Zum Bestellen bitte JavaScript aktivieren oder direkt <a class="textlink" href="wunsch.html">eine Nachricht schreiben</a>.';
    text.appendChild(ohneJs);

    if (p.individuellGefertigt) {
      var wid = document.createElement("p");
      wid.className = "hinweis";
      wid.innerHTML = "Dieses Stück wird nach deinen Angaben angefertigt. Für individuell gefertigte Ware besteht kein Widerrufsrecht (§ 312g Abs. 2 Nr. 1 BGB). Mehr dazu in der <a class=\"textlink\" href=\"widerruf.html\">Widerrufsbelehrung</a>.";
      text.appendChild(wid);
    }

    /* ---------- Beschreibung ---------- */
    if (p.langtext && p.langtext.length) {
      var lang = document.createElement("div");
      lang.className = "lese";
      lang.style.marginTop = "2rem";
      p.langtext.forEach(function (absatz) {
        var el = document.createElement("p");
        el.textContent = absatz;
        lang.appendChild(el);
      });
      text.appendChild(lang);
    }

    /* ---------- Datenblatt ---------- */
    text.appendChild(datenblatt(p, daten));

    wurzel.appendChild(galerie);
    wurzel.appendChild(text);
    if (window.ZEIGE) window.ZEIGE(wurzel);
  }

  function datenblatt(p, daten) {
    var dl = document.createElement("dl");
    dl.className = "daten";

    zeile(dl, "Maße", masse(p));
    zeile(dl, "Material", material(p));
    zeile(dl, "Pflege", p.pflegehinweis);
    zeile(dl, "Lieferzeit", p.lieferzeit);
    zeile(dl, "Versand", versandZeile(p, daten));
    if (p.warnhinweise && p.warnhinweise.length) zeile(dl, "Hinweis", p.warnhinweise.join(" "));

    return dl;
  }

  function zeile(dl, bezeichnung, wert) {
    if (!wert) return;
    var div = document.createElement("div");
    var dt = document.createElement("dt"); dt.textContent = bezeichnung;
    var dd = document.createElement("dd"); dd.textContent = wert;
    div.appendChild(dt); div.appendChild(dd);
    dl.appendChild(div);
  }

  function masse(p) {
    var m = p.masseCm || {};
    var teile = [];
    if (m.breite) teile.push(m.breite + " cm breit");
    if (m.hoehe) teile.push(m.hoehe + " cm hoch");
    if (m.tiefe) teile.push(m.tiefe + " cm tief");
    return teile.join(", ");
  }

  function material(p) {
    if (p.material && p.material.length) {
      return p.material.map(function (m) {
        return m.anteilProzent ? m.anteilProzent + " % " + m.faser : m.faser + (m.hinweis ? " (" + m.hinweis + ")" : "");
      }).join(", ");
    }
    return p.materialtext || "";
  }

  function versandZeile(p, daten) {
    var klasse = daten.config.versand.klassen[p.versandklasse];
    if (!klasse) return "";
    var preis = klasse.DE;
    return preis === 0
      ? klasse.name
      : klasse.name + " — " + window.PREIS.formatiere(preis) + " innerhalb Deutschlands";
  }

  function rueckmeldung(behaelter, nachricht, fehler) {
    var alt = behaelter.querySelector(".meldung");
    if (alt) alt.remove();
    var el = document.createElement("p");
    el.className = "meldung " + (fehler ? "meldung--fehler" : "meldung--gut");
    el.style.flexBasis = "100%";
    el.textContent = nachricht;
    behaelter.appendChild(el);
    if (!fehler) setTimeout(function () { el.remove(); }, 3200);
  }
})();
