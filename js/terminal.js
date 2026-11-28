/* ==========================================================================
   terminal.js — Tasarım 1'e özel işler
   Günlük satırlarını, manifestoyu ve formül bloğunu basar.
   Formülün metni content/formula.json'dan gelir; burada yalnızca markup var.
   Dil, tema, yazı tipi ve içerik yükleme i18n.js / fonts.js'tedir.
   ========================================================================== */
(function () {
    'use strict';

    function byId(id) { return document.getElementById(id); }

    /* ---------------- render cache ----------------
       Built once per language and month; a language switch or a month rollover
       rebuilds, a plain re-render does not. */
    var logsCache = Object.create(null);
    var manifestoCache = Object.create(null);

    function escapeHtml(value) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // 'YYYY-MM' for the site's timezone, so every visitor sees the same month
    // even if their local clock is still on the previous/next one.
    function currentMonth() {
        try {
            var parts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit'
            }).formatToParts(new Date());
            var year = '', month = '';
            parts.forEach(function (part) {
                if (part.type === 'year') year = part.value;
                if (part.type === 'month') month = part.value;
            });
            if (year && month) return year + '-' + month;
        } catch (e) { /* very old browser: use the local fallback below */ }
        var now = new Date();
        return String(now.getFullYear()) + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    }

    function logTokens(language, month) {
        var profileRoot = window.Site && Site.data.profile;
        var profile = (profileRoot && (profileRoot[language] || profileRoot.tr)) || {};
        var year = Number(month.slice(0, 4));
        return {
            NOW: month,
            WORK_YEARS: String(year - (profile.workStart || 1995)),
            CODE_YEARS: String(year - (profile.codeStart || 1998))
        };
    }

    function logsHtml(language) {
        var month = currentMonth();
        var cacheKey = language + ':' + month;   // month includes the year: rollovers rebuild
        if (logsCache[cacheKey] !== undefined) return logsCache[cacheKey];
        var terminal = (window.Site && Site.data.terminal) || {};
        var lines = terminal[language] && terminal[language].logs;
        if (!Array.isArray(lines)) return '';   // not loaded yet: do NOT cache
        var tokens = logTokens(language, month);
        var html = lines.map(function (line) {
            var filled = line.replace(/\{(NOW|WORK_YEARS|CODE_YEARS)\}/g, function (_, key) {
                return tokens[key];
            });
            return '<div>' + escapeHtml(filled) + '</div>';
        }).join('');
        logsCache[cacheKey] = html;
        return html;
    }

    function formulaHtml(language) {
        var root = window.Site && Site.data.formula;
        if (!root) return '';
        var t = root[language] || root.tr || root.en;
        if (!t || !t.simple) return '';

        var legend = t.legend || {};
        var rows = [legend.entropy, legend.chance].filter(Boolean).map(function (line) {
            return '<span>' + escapeHtml(line) + '</span>';
        }).join('');

        return '<div class="formula-block">' +
            '<div class="formula-tag">' +
                '<span class="tag-closed">' + escapeHtml(t.tagClosed || '') + '</span>' +
                '<span class="tag-open">' + escapeHtml(t.tagOpen || '') + '</span>' +
            '</div>' +
            '<div class="formula">' + escapeHtml(t.simple) + '</div>' +
            '<div class="formula-sub">' + escapeHtml(t.sub || '') + '</div>' +
            '<details class="formula-details">' +
                '<summary>' + escapeHtml(t.summary || '') + '</summary>' +
                '<div class="formula-detail-body">' +
                    '<p class="formula-step">' + escapeHtml(t.step || '') + '</p>' +
                    '<div class="formula formula-meta">' + escapeHtml(t.extended || '') + '</div>' +
                    '<div class="formula-legend">' + rows + '</div>' +
                    '<p class="formula-explain">' + escapeHtml(t.explain || '') + '</p>' +
                '</div>' +
            '</details>' +
        '</div>';
    }

    function manifestoHtml(language) {
        if (manifestoCache[language] !== undefined) return manifestoCache[language];
        var manifesto = (window.Site && Site.data.manifesto) || {};
        var paragraphs = manifesto[language];
        if (!Array.isArray(paragraphs)) return '';   // not loaded yet: do NOT cache
        var block = formulaHtml(language);
        // paragraphs already carry their own inline markup (<em>, <strong>, <a>)
        // Insert the core-principle formula block after the second paragraph.
        var html = paragraphs.map(function (text, i) {
            var p = '<p>' + text + '</p>';
            if (i === 1) p += block;
            return p;
        }).join('');
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
