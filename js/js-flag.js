/* Läuft bewusst im <head> ohne defer: setzt die .js-Klasse vor dem ersten Anzeigen,
   damit Reveals nicht kurz aufblitzen. Ohne JavaScript bleibt alles sichtbar. */
document.documentElement.classList.add("js");
