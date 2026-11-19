/* ==========================================================================
   blueprint.js — Tasarım 2'ye özel işler
   Yalnızca sayının türetildiği yerler: meslek yılı, ölçü çizgisinin son yılı.
   Metnin tamamı content/blueprint.json + content/profile.json'dan gelir.
   ========================================================================== */
(function () {
    'use strict';

    function byId(id) { return document.getElementById(id); }
    function numeric(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : fallback;
    }

    function render() {
        var year = new Date().getFullYear();

        // "years in industry" — measured from the first job, not from the site
        var workStart = numeric(Site.t('profile.workStart'), 1995);
        var years = byId('years-in-industry');
        if (years) years.textContent = String(year - workStart);

        // the dimension line ends at the current year
        var currentYear = byId('dimension-end-year');
        if (currentYear) currentYear.textContent = String(year);
    }

    if (window.Site) {
        Site.ready.then(render);
        Site.onChange(render);
    }
}());
