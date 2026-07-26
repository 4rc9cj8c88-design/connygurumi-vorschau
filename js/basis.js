/* Kopfzeile, Mobilmenü, Reveals, Jahreszahl — auf jeder Seite eingebunden. */
(function () {
  "use strict";

  var wenigerBewegung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Kopfzeile beim Scrollen ---------- */
  var kopf = document.querySelector(".kopf");
  if (kopf) {
    var pruefe = function () {
      kopf.classList.toggle("ist-gescrollt", window.scrollY > 24);
    };
    pruefe();
    window.addEventListener("scroll", pruefe, { passive: true });
  }

  /* ---------- Mobilmenü ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var offen = nav.classList.toggle("ist-offen");
      burger.setAttribute("aria-expanded", offen ? "true" : "false");
      document.body.style.overflow = offen ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("ist-offen")) {
        nav.classList.remove("ist-offen");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("ist-offen")) burger.click();
    });
  }

  /* ---------- Aktuelle Seite in der Navigation markieren ---------- */
  var seite = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[href]").forEach(function (a) {
    if (a.getAttribute("href") === seite) a.setAttribute("aria-current", "page");
  });

  /* ---------- Reveals ---------- */
  window.ZEIGE = function (wurzel) {
    var ziele = (wurzel || document).querySelectorAll(".zeig:not(.ist-da), .zeig-bild:not(.ist-da)");
    if (!ziele.length) return;
    if (wenigerBewegung || !("IntersectionObserver" in window)) {
      ziele.forEach(function (el) { el.classList.add("ist-da"); });
      return;
    }
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var versatz = parseInt(el.dataset.versatz || "0", 10);
        setTimeout(function () { el.classList.add("ist-da"); }, versatz);
        beobachter.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.06 });
    ziele.forEach(function (el) { beobachter.observe(el); });
  };
  window.ZEIGE(document);

  /* ---------- Jahreszahl in der Fußzeile ---------- */
  document.querySelectorAll("[data-jahr]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
