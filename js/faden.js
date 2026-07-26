/* „Der Faden" — der Signature-Moment.
   Eine durchgehende Linie läuft am linken Rand durch die ganze Seite, legt an jeder
   mit data-faden markierten Überschrift eine Schlaufe und endet unten im Knoten.
   Sie wird beim Scrollen gezeichnet. Bei reduzierter Bewegung steht sie sofort ganz da. */
(function () {
  "use strict";

  var wenigerBewegung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var svg = null;
  var pfad = null;
  var knoten = null;
  var laenge = 0;
  var startY = 0;
  var endY = 0;
  var laeuft = false;
  var letzteHoehe = 0;
  var letzteBreite = 0;

  bauen();
  window.addEventListener("resize", verzoegertNeu, { passive: true });
  window.addEventListener("load", verzoegertNeu);
  if (!wenigerBewegung) window.addEventListener("scroll", anfordern, { passive: true });

  /* Wenn Bilder nachladen, ändert sich die Seitenhöhe — Faden neu vermessen. */
  if ("ResizeObserver" in window) {
    var beobachter = new ResizeObserver(verzoegertNeu);
    beobachter.observe(document.body);
  }

  function bauen() {
    var anker = Array.prototype.slice.call(document.querySelectorAll("[data-faden]"));
    if (!anker.length) return;

    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "faden");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      pfad = document.createElementNS("http://www.w3.org/2000/svg", "path");
      knoten = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      knoten.setAttribute("class", "faden__knoten");
      knoten.setAttribute("r", "3");
      svg.appendChild(pfad);
      svg.appendChild(knoten);
      document.body.appendChild(svg);
    }

    var seitenhoehe = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight
    );
    var breite = window.innerWidth;

    /* Nichts tun, wenn sich nichts geändert hat — sonst könnte der
       ResizeObserver sich selbst immer wieder auslösen. */
    if (seitenhoehe === letzteHoehe && breite === letzteBreite) return;
    letzteHoehe = seitenhoehe;
    letzteBreite = breite;

    var schmal = breite < 720;

    /* Der Faden läuft im freien Rand links neben dem Inhalt. Wo der beginnt,
       wird gemessen statt geraten — sonst schneidet die Linie bei breiten
       Fenstern in die erste Karte. */
    var bahn = document.querySelector(".bahn");
    var inhaltLinks = 60;
    if (bahn) {
      inhaltLinks = bahn.getBoundingClientRect().left +
        parseFloat(getComputedStyle(bahn).paddingLeft || 0);
    }
    var rechts = Math.max(schmal ? 18 : 34, inhaltLinks - (schmal ? 10 : 26));
    var links = Math.max(schmal ? 6 : 10, rechts - (schmal ? 14 : 74));
    var schlaufe = schmal ? 5 : Math.min(11, (rechts - links) / 5);

    svg.setAttribute("width", breite);
    svg.setAttribute("height", seitenhoehe);
    svg.setAttribute("viewBox", "0 0 " + breite + " " + seitenhoehe);
    svg.style.height = seitenhoehe + "px";

    /* Anker-Positionen einsammeln */
    var punkte = anker.map(function (el) {
      var r = el.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2;
    }).filter(function (y) {
      return y > 0 && y < seitenhoehe;
    }).sort(function (a, b) { return a - b; });

    if (!punkte.length) return;

    startY = Math.max(punkte[0] - 260, 40);
    endY = Math.min(punkte[punkte.length - 1] + 300, seitenhoehe - 40);

    var d = [];
    var x = links;
    var y = startY;
    d.push("M " + x + " " + y);

    punkte.forEach(function (ziel, i) {
      var zielX = i % 2 === 0 ? rechts : links;
      var mitte = (y + ziel) / 2;
      /* weich zur Schlaufe hinschwingen */
      d.push("C " + x + " " + mitte + ", " + zielX + " " + mitte + ", " + zielX + " " + (ziel - schlaufe));
      /* die Schlaufe selbst: ein fast geschlossener Kreis */
      d.push("a " + schlaufe + " " + schlaufe + " 0 1 " + (i % 2 === 0 ? 1 : 0) + " 0.6 0.4");
      x = zielX;
      y = ziel;
    });

    /* Auslauf zum Knoten */
    var letzterX = x === links ? rechts : links;
    var mitte2 = (y + endY) / 2;
    d.push("C " + x + " " + mitte2 + ", " + letzterX + " " + mitte2 + ", " + letzterX + " " + endY);

    pfad.setAttribute("d", d.join(" "));
    knoten.setAttribute("cx", letzterX);
    knoten.setAttribute("cy", endY);

    laenge = pfad.getTotalLength();
    pfad.style.strokeDasharray = laenge;

    if (wenigerBewegung) {
      pfad.style.strokeDashoffset = 0;
      knoten.style.opacity = "";
    } else {
      zeichne();
    }
  }

  function anfordern() {
    if (laeuft) return;
    laeuft = true;
    requestAnimationFrame(function () { laeuft = false; zeichne(); });
  }

  function zeichne() {
    if (!pfad || !laenge) return;
    var spanne = endY - startY;
    if (spanne <= 0) return;
    var spitze = window.scrollY + window.innerHeight * 0.86;
    var anteil = Math.min(Math.max((spitze - startY) / spanne, 0), 1);
    pfad.style.strokeDashoffset = String(laenge * (1 - anteil));
    knoten.style.opacity = anteil > 0.985 ? "" : "0";
  }

  var zeitgeber = null;
  function verzoegertNeu() {
    clearTimeout(zeitgeber);
    zeitgeber = setTimeout(bauen, 180);
  }
})();
