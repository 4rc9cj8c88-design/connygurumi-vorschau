# Handmade by CB — Handgemachtes aus Aidlingen

Statische Website mit Warenkorb. Kein Framework, kein Build-Schritt: HTML, CSS und
JavaScript liegen so auf dem Server, wie sie hier im Ordner stehen.

## Lokal ansehen

`start.command` doppelklicken. Das startet einen kleinen Server und öffnet die Seite.
Direkt per Doppelklick auf `index.html` funktioniert es **nicht** — der Browser
verbietet dann das Laden der Produktdaten.

## Ein Produkt anlegen oder ändern

Alles steht in **`daten/produkte.json`**. Ein Block pro Produkt, Anleitung steht oben
in der Datei. Kurz:

1. Einen vorhandenen Block kopieren und einfügen (Komma dazwischen nicht vergessen).
2. `id` vergeben und nie wieder ändern, `slug` ist die Adresse in der Browserzeile.
3. `preisCent` in Cent angeben: 34,00 € sind `3400`.
4. `status` auf `verfuegbar`, `verkauft`, `reserviert`, `auf_anfrage` oder `entwurf`
   (unsichtbar) setzen. Einzelstücke bekommen `"unikat": true` und `"bestand": 1`.
5. Fotos nach `img/produkte/` legen, genau so benannt wie unter `bilder` eingetragen.
   Fehlt ein Foto, zeigt die Seite automatisch einen Platzhalter — nichts geht kaputt.

Preise, Versandkosten und Lieferländer stehen in **`daten/shop-config.json`**.

## Fotos machen

Am Fenster fotografieren, nie mit Blitz. Heller, ruhiger Untergrund (Holztisch, Leinentuch).
Pro Produkt mindestens zwei Aufnahmen: einmal das ganze Stück, einmal eine Nahaufnahme
vom Material. Immer aus ähnlichem Winkel — dann wirkt die Übersicht ruhig.
Format ungefähr 4:5 (hochkant), lange Kante etwa 1600 Pixel reicht völlig.

## Bestellungen

Der Schalter dafür ist `checkout` in `daten/shop-config.json`:

- `"anfrage"` (aktuell): Die Bestellung wird als unverbindliche Anfrage verschickt.
  Der Vertrag kommt erst mit der Bestätigungsmail zustande.
- `"stripe"`: Echter Bezahlvorgang. Setzt eine Serverfunktion unter
  `netlify/functions/checkout.js` voraus, die die Preise serverseitig aus
  `produkte.json` nachrechnet. Erst umstellen, wenn die Punkte unten erledigt sind.

## Vor dem ersten echten Verkauf

- [ ] Gewerbe angemeldet, Kleinunternehmerregelung geklärt
- [ ] E-Mail-Adresse und Telefonnummer in `shop-config.json` und im Impressum eintragen
- [ ] Hoster im Impressum und in der Datenschutzerklärung ergänzen
- [ ] AGB und Widerrufsbelehrung von einem Fachanbieter besorgen und in
      `agb.html` / `widerruf.html` einsetzen
- [ ] Verpackungsregister LUCID (Pflicht, sobald verpackte Ware versendet wird)
- [ ] Materialangaben bei Textilien vollständig (Faserzusammensetzung in Prozent)
- [ ] Herstellerangaben nach GPSR bei jedem Produkt
- [ ] Gehäkelte Figuren als Dekoration kennzeichnen — sonst gilt die
      Spielzeugrichtlinie mit CE-Kennzeichnung
- [ ] `noindex, nofollow` aus allen HTML-Dateien und `robots.txt` entfernen,
      damit die Seite bei Google auftaucht

## Aufbau

```
index.html    shop.html    produkt.html    warenkorb.html
ueber.html    wunsch.html  danke.html
impressum.html  datenschutz.html  agb.html  widerruf.html  versand.html

css/stil.css        ein Token-Block, dann die Bausteine
js/                 je Aufgabe eine Datei, kein Inline-Skript (wegen CSP)
daten/              Produkte und Einstellungen
fonts/              Newsreader + Karla, selbst gehostet
img/                Fotos
_headers            Sicherheits-Header (Netlify)
netlify.toml        Hoster-Konfiguration
```
