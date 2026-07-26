/* Zeichnet Produktraster. Steuerung über Attribute im HTML:
   data-liste="alle" | "hervorgehoben"   data-limit="4"   data-filter (Filterleiste anzeigen) */
(function () {
  "use strict";

  var behaelter = document.querySelector("[data-liste]");
  if (!behaelter) return;

  var filterLeiste = document.querySelector("[data-filterleiste]");
  var aktuell = "alle";

  window.SHOP.laden().then(function (daten) {
    if (filterLeiste) filterBauen(daten);
    zeichne(daten);

    /* Kategorie aus der Adresse übernehmen: shop.html?k=gravur */
    var k = new URLSearchParams(location.search).get("k");
    if (k && filterLeiste) {
      var treffer = filterLeiste.querySelector('[data-kategorie="' + CSS.escape(k) + '"]');
      if (treffer) treffer.click();
    }
  }).catch(function (e) {
    window.SHOP.fehlerAnzeigen(behaelter, e);
  });

  function filterBauen(daten) {
    var eintraege = [{ id: "alle", name: "Alles" }].concat(daten.config.kategorien || []);
    eintraege.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = k.name;
      b.dataset.kategorie = k.id;
      b.setAttribute("aria-pressed", k.id === aktuell ? "true" : "false");
      b.addEventListener("click", function () {
        aktuell = k.id;
        filterLeiste.querySelectorAll("button").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        zeichne(daten);
      });
      filterLeiste.appendChild(b);
    });
  }

  function zeichne(daten) {
    var liste = daten.produkte.slice();

    if (behaelter.dataset.liste === "hervorgehoben") {
      var top = liste.filter(function (p) { return p.hervorgehoben; });
      liste = top.length ? top : liste;
    }
    if (aktuell !== "alle") {
      liste = liste.filter(function (p) { return p.kategorie === aktuell; });
    }
    /* Verkauftes ans Ende, es bleibt aber sichtbar (zeigt, was möglich ist) */
    liste.sort(function (a, b) {
      var av = a.status === "verkauft" ? 1 : 0;
      var bv = b.status === "verkauft" ? 1 : 0;
      return av - bv;
    });

    var limit = parseInt(behaelter.dataset.limit || "0", 10);
    if (limit > 0) liste = liste.slice(0, limit);

    behaelter.innerHTML = "";
    if (!liste.length) {
      behaelter.innerHTML = '<div class="leer"><p>In dieser Kategorie ist gerade nichts fertig. Schau bald wieder vorbei.</p></div>';
      return;
    }

    liste.forEach(function (p, i) {
      behaelter.appendChild(karte(p, daten, i));
    });
    if (window.ZEIGE) window.ZEIGE(behaelter);
  }

  function karte(p, daten, index) {
    var el = document.createElement("article");
    var formen = ["", " karte--hoch", " karte--quer"];
    el.className = "karte zeig" + formen[index % 3] + (p.status === "verkauft" ? " karte--verkauft" : "");
    el.dataset.versatz = String((index % 3) * 60);

    var bild = document.createElement("div");
    bild.className = "karte__bild zeig-bild";
    window.BILD.einsetzen(bild, p.bilder && p.bilder[0]);

    if (p.status === "verfuegbar") {
      var tag = document.createElement("span");
      tag.className = "anhaenger";
      tag.textContent = window.PREIS.formatiere(p.preisCent);
      bild.appendChild(tag);
    }

    var text = document.createElement("div");
    text.className = "karte__text";

    var titel = document.createElement("h3");
    titel.className = "karte__titel";
    titel.textContent = p.titel;

    var kurz = document.createElement("p");
    kurz.className = "karte__kurz";
    kurz.textContent = p.kurztext;

    var fuss = document.createElement("div");
    fuss.className = "karte__fuss";
    var meta = document.createElement("span");
    meta.className = "karte__meta";
    meta.textContent = p.status === "verkauft"
      ? "Ähnliches auf Anfrage"
      : (p.unikat ? "Einzelstück" : daten.kategorieName(p.kategorie));
    fuss.appendChild(meta);

    text.appendChild(titel);
    text.appendChild(kurz);
    text.appendChild(fuss);

    var link = document.createElement("a");
    link.className = "karte__link";
    link.href = "produkt.html?p=" + encodeURIComponent(p.slug);
    link.setAttribute("aria-label", p.titel + " ansehen");

    el.appendChild(link);
    el.appendChild(bild);
    el.appendChild(text);
    return el;
  }
})();
