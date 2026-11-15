/* Entry language gate — mirrors the Kiwi Editor customer page: on a true first
 * visit (no #lang= link and no saved language) the visitor picks a language
 * before entering. Returning visitors and shared #lang= links go straight in.
 * The pick reuses the header language buttons, so every module re-renders. */
(function () {
  var LANGS = ["en", "zh", "tw", "ja"];
  function hasHashLang() {
    return /lang=(zh|tw|ja|en)/.test(location.hash || "");
  }
  function hasSavedLang() {
    try {
      return LANGS.indexOf(localStorage.getItem("talisman-lang")) !== -1;
    } catch (e) {
      return false;
    }
  }
  function init() {
    var gate = document.getElementById("langGate");
    if (!gate) return;
    if (hasHashLang() || hasSavedLang()) return;
    gate.classList.add("open");
    document.body.style.overflow = "hidden";
    gate.querySelectorAll("[data-gate-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var l = btn.getAttribute("data-gate-lang");
        var headerBtn = document.querySelector('.lang-btn[data-lang="' + l + '"]');
        if (headerBtn) headerBtn.click();
        else if (window.I18N) window.I18N.setLang(l);
        gate.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
