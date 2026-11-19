/* ==========================================================================
   blueprint.js — Tasarım 2'ye özel işler
   Yalnızca ölçü çizgisinin son yılı burada türetilir; metnin tamamı
   content/blueprint.json + content/profile.json'dan gelir.
   ========================================================================== */
(function () {
    'use strict';

    function byId(id) { return document.getElementById(id); }

    function render() {
        var year = new Date().getFullYear();
        var currentYear = byId('dimension-end-year');
        if (currentYear) currentYear.textContent = String(year);
    }

    if (window.Site) {
        Site.ready.then(render);
        Site.onChange(render);
    }
}());
