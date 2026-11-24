/* ==========================================================================
   terminal.js — Tasarım 1'e özel işler
   Sadece günlük satırlarını ve manifesto paragraflarını basar.
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

    function manifestoHtml(language) {
        if (manifestoCache[language] !== undefined) return manifestoCache[language];
        var manifesto = (window.Site && Site.data.manifesto) || {};
        var paragraphs = manifesto[language];
        if (!Array.isArray(paragraphs)) return '';   // not loaded yet: do NOT cache
        var isEn = language === 'en';
        var t = isEn ? {
            tagClosed: 'CORE PRINCIPLE · RECURSIVE ACCUMULATION',
            tagOpen: 'CORE PRINCIPLE · A MODEL',
            sub: 'each step carries what came before',
            summary: 'details',
            stepMath: 'mathematical form',
            stepMeta: 'Human State',
            legendMath: 'α — memory / damping (0 &lt; α &lt; 1) · β — trace of lived experience',
            legendMeta1: '−T·ΔS — entropic cost',
            legendMeta2: 'σ·ε(x) — unpredictability (chance/luck)',
            explain: 'The pure formula models a human as an object that forgets nothing and never yields to entropy; yet a human, like everything in the universe, is subject to entropy. At the same time, a human neither stores everything the same way nor lives every moment with the same intensity.'
        } : {
            tagClosed: 'TEMEL İLKE · ÖZYİNELEMELİ BİRİKİM',
            tagOpen: 'TEMEL İLKE · BİR MODEL',
            sub: 'her adım, önceki birikimi taşır',
            summary: 'detaylar',
            stepMath: 'matematiksel hâli',
            stepMeta: 'İnsan Hâli',
            legendMath: 'α — hafıza / sönüm (0 &lt; α &lt; 1) · β — yaşanmışlıkların izi',
            legendMeta1: '−T·ΔS — entropik maliyet',
            legendMeta2: 'σ·ε(x) — öngörülemezlik (rastlantı/şans)',
            explain: 'Saf formül, insanı hiçbir şeyi unutmayan, entropiye bile yenilmeyen kusursuz bir nesne gibi modeller; oysa insan da evrendeki her şey gibi entropiye tabidir. Üstelik insan, ne her şeyi aynı şekilde saklar ne de her ânı aynı şiddette yaşar. Bu yüzden insanın mevcut hâli mutlak bir toplam değil; geçmişinden geriye kalan sönümlenmiş hafızası ile yeni deneyimlerinin derinliğinden, varoluşun kaçınılmaz entropik yıpranmasının düşülmesi ve üzerine hayatın öngörülemez rastlantılarının eklenmesiyle her an yeniden şekillenen bir kemâlat hâlidir.'
        };
        var block =
            '<div class="formula-block">' +
                '<div class="formula-tag">' +
                    '<span class="tag-closed">' + t.tagClosed + '</span>' +
                    '<span class="tag-open">' + t.tagOpen + '</span>' +
                '</div>' +
                '<div class="formula">f(x) = f(x − y) + y</div>' +
                '<div class="formula-sub">' + t.sub + '</div>' +
                '<details class="formula-details">' +
                    '<summary>' + t.summary + '</summary>' +
                    '<div class="formula-detail-body">' +
                        '<p class="formula-step">' + t.stepMeta + '</p>' +
                        '<div class="formula formula-meta">f(x) ≈ α·f(x−y) + β·y − T·ΔS + σ·ε(x)</div>' +
                        '<div class="formula-legend"><span>' + t.legendMeta1 + '</span><span>' + t.legendMeta2 + '</span></div>' +
                        '<p class="formula-explain">' + t.explain + '</p>' +
                    '</div>' +
                '</details>' +
            '</div>';
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
