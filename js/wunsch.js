/* Formular für Wunschanfertigungen.
   Kommt jemand von einer verkauften Arbeit („Ähnliches anfragen“), steht das Stück gleich drin.
   Und: solange die Seite nur als Vorschau liegt, gibt es keinen Formularempfänger —
   dann bekommt man statt einer Fehlerseite einen fertigen E-Mail-Entwurf. */
(function () {
  "use strict";

  var formular = document.querySelector('form[name="wunsch"]');
  var feld = document.getElementById("stueck");

  if (feld) {
    var stueck = new URLSearchParams(location.search).get("stueck");
    if (stueck) feld.value = stueck;
  }

  if (!formular) return;

  formular.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!formular.reportValidity()) return;

    var knopf = formular.querySelector('button[type="submit"]');
    var alterText = knopf.textContent;
    knopf.disabled = true;
    knopf.textContent = "Einen Moment …";

    var f = new FormData(formular);
    var felder = new URLSearchParams();
    f.forEach(function (wert, name) { felder.append(name, wert); });

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: felder.toString()
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      location.href = "danke.html?art=wunsch";
    }).catch(function () {
      knopf.disabled = false;
      knopf.textContent = alterText;
      zeigeErsatzweg(f);
    });
  });

  function zeigeErsatzweg(f) {
    var alt = formular.querySelector(".meldung");
    if (alt) alt.remove();

    var text = [
      "Anfrage über die Website",
      "",
      "Name: " + (f.get("name") || ""),
      "E-Mail: " + (f.get("email") || ""),
      "Worum geht es: " + (f.get("stueck") || ""),
      "",
      f.get("wunsch") || ""
    ].join("\n");

    var link = "mailto:?subject=" + encodeURIComponent("Anfrage über die Website") +
      "&body=" + encodeURIComponent(text);

    var el = document.createElement("p");
    el.className = "meldung meldung--fehler";
    el.innerHTML = "Der Versand über die Website ist noch nicht eingerichtet — das ist hier " +
      'erst eine Vorschau. <a class="textlink" href="' + link + '">Anfrage stattdessen per E-Mail schicken</a>.';
    formular.appendChild(el);
  }
})();
