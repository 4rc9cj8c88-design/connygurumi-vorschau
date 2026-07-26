/* Der Text auf der Danke-Seite hängt davon ab, was gerade abgeschickt wurde. */
(function () {
  "use strict";

  var ziel = document.getElementById("danke-text");
  if (!ziel) return;

  var art = new URLSearchParams(location.search).get("art");

  if (art === "anfrage") {
    ziel.innerHTML =
      "<p>Deine Bestellung ist angekommen. Ich prüfe, ob alles noch da ist, und schicke dir " +
      "eine Bestätigung mit allen Angaben und den Zahlungsdaten. Erst danach ist die Bestellung verbindlich.</p>" +
      "<p>Falls in der Zwischenzeit noch etwas fehlt oder du etwas ändern möchtest, antworte einfach auf diese Nachricht.</p>";
    /* Sicherheitshalber: der Warenkorb wurde beim Absenden schon geleert. */
    if (window.KORB) window.KORB.leeren();
  } else if (art === "bezahlt") {
    ziel.innerHTML =
      "<p>Die Zahlung ist eingegangen — die Bestätigung liegt in deinem Postfach.</p>" +
      "<p>Ich packe alles sorgfältig ein und schicke es auf den Weg. Sobald das Paket unterwegs ist, bekommst du Bescheid.</p>";
    if (window.KORB) window.KORB.leeren();
  }
})();
