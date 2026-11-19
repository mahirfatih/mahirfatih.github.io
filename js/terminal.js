/* ==========================================================================
   terminal.js — Tasarım 1'e özel işler
   Sadece günlük satırlarını ve manifesto paragraflarını basar.
   Dil, tema, yazı tipi ve içerik yükleme i18n.js / fonts.js'tedir.
   ========================================================================== */
(function () {
    'use strict';

    function byId(id) { return document.getElementById(id); }

    /* ---------------- render cache ----------------
       Built once per language; a language switch rebuilds, a re-render does not. */
    var logsCache = Object.create(null);
    var manifestoCache = Object.create(null);

    function escapeHtml(value) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function logsHtml(language) {
        if (logsCache[language] !== undefined) return logsCache[language];
        var terminal = (window.Site && Site.data.terminal) || {};
        var lines = terminal[language] && terminal[language].logs;
        if (!Array.isArray(lines)) return '';   // not loaded yet: do NOT cache
        var html = lines.map(function (line) { return '<div>' + escapeHtml(line) + '</div>'; }).join('');
        logsCache[language] = html;
        return html;
    }

    function manifestoHtml(language) {
        if (manifestoCache[language] !== undefined) return manifestoCache[language];
        var manifesto = (window.Site && Site.data.manifesto) || {};
        var paragraphs = manifesto[language];
        if (!Array.isArray(paragraphs)) return '';   // not loaded yet: do NOT cache
        // paragraphs already carry their own inline markup (<em>, <strong>, <a>)
        var html = paragraphs.map(function (text) { return '<p>' + text + '</p>'; }).join('');
        manifestoCache[language] = html;
        return html;
    }

    function render(language) {
        var logs = byId('system-logs');
        var body = byId('manifesto');
        if (logs) logs.innerHTML = logsHtml(language);
        if (body) body.innerHTML = manifestoHtml(language);
    }

    /* ---------------- viewport height ----------------
       dvh alone misbehaves while mobile browser chrome slides in and out,
       so the stable value is mirrored into --vh and only updated per frame. */
    (function bindViewport() {
        var lastHeight = -1;
        var frameRequest = 0;

        function apply() {
            frameRequest = 0;
            var height = window.innerHeight;
            if (height === lastHeight) return;
            lastHeight = height;
            document.documentElement.style.setProperty('--vh', height + 'px');
        }
        function queue() {
            if (!frameRequest) frameRequest = window.requestAnimationFrame(apply);
        }

        apply();
        window.addEventListener('resize', queue, { passive: true });
        window.addEventListener('orientationchange', queue, { passive: true });
    }());

    /* ---------------- boot ---------------- */
    if (window.Site) {
        Site.ready.then(function () { render(Site.lang); });
        Site.onChange(render);
    }
}());
