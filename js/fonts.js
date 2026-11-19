/* ==========================================================================
   fonts.js — ortak yazı tipi alt sistemi
   18 yazı tipi, tek liste, tek localStorage anahtarı. Her iki tasarım de
   aynı listeyi döner. Varsayılan sayfaya göre farklıdır (data-font).
   ========================================================================== */
(function () {
    'use strict';

    var html = document.documentElement;

    var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

    // id, LABEL and the CSS stack must stay in sync with css/base.css
    var FONTS = [
        { id: 'jetbrains',  label: 'JetBrains',      stack: '"JetBrains Mono", ' + MONO },
        { id: 'sfmono',     label: 'SF Mono',         stack: '"SFMono Liga", ' + MONO },
        { id: 'cascadia',   label: 'Cascadia',        stack: '"Cascadia Code", ' + MONO },
        { id: 'firacode',   label: 'Fira Code',       stack: '"Fira Code", ' + MONO },
        { id: 'hack',       label: 'Hack',            stack: '"Hack", ' + MONO },
        { id: 'victor',     label: 'Victor Mono',     stack: '"Victor Mono", ' + MONO },
        { id: 'plex',       label: 'Plex Mono',       stack: '"IBM Plex Mono", ' + MONO },
        { id: 'inconsolata',label: 'Inconsolata',     stack: '"Inconsolata", ' + MONO },
        { id: 'maple',      label: 'Maple Mono',      stack: '"Maple Mono", ' + MONO },
        { id: 'geist',      label: 'Geist Mono',      stack: '"Geist Mono", ' + MONO },
        { id: 'departure',  label: 'Departure Mono',  stack: '"Departure Mono", ' + MONO },
        { id: 'monaspace',  label: 'Monaspace',       stack: '"Monaspace Argon", ' + MONO },
        { id: 'commit',     label: 'Commit Mono',     stack: '"Commit Mono", ' + MONO },
        { id: 'sourcecode', label: 'Source Code',     stack: '"Source Code Pro", ' + MONO },
        { id: 'martian',    label: 'Martian Mono',    stack: '"Martian Mono", ' + MONO },
        { id: 'space',      label: 'Space Mono',      stack: '"Space Mono", ' + MONO },
        { id: 'plexsans',   label: 'Plex Sans',       stack: '"IBM Plex Sans", system-ui, -apple-system, sans-serif' },
        { id: 'plexcond',   label: 'Plex Sans Cond',  stack: '"IBM Plex Sans Condensed", "Arial Narrow", system-ui, sans-serif' }
    ];

    var BY_ID = Object.create(null);
    FONTS.forEach(function (font) { BY_ID[font.id] = font; });

    var store = {
        get: function (key) { try { return localStorage.getItem(key); } catch (err) { return null; } },
        set: function (key, value) { try { localStorage.setItem(key, value); } catch (err) {} }
    };

    /* ---------------- loading ---------------- */
    var loadCache = Object.create(null);

    function ensureFontLoaded(id) {
        if (loadCache[id]) return loadCache[id];
        var font = BY_ID[id];
        if (!font || !document.fonts) {
            loadCache[id] = Promise.resolve();
            return loadCache[id];
        }
        var quoted = '"' + font.stack.split('"')[1] + '"';
        // one weight is enough to prove the face is usable: the page only ever
        // renders a single line of UI text per face.
        var promise = Promise.all([
            document.fonts.load('400 16px ' + quoted, 'Aa1'),
            document.fonts.load('700 16px ' + quoted, 'Aa1')
        ]).catch(function () { /* never reject: a missing face is not fatal */ });
        loadCache[id] = promise;
        return promise;
    }

    function nextFontId(currentId) {
        var index = -1;
        for (var i = 0; i < FONTS.length; i++) {
            if (FONTS[i].id === currentId) { index = i; break; }
        }
        return FONTS[(index + 1) % FONTS.length].id;
    }

    /* ---------------- state ---------------- */
    var activeId = 'jetbrains';

    function updateButton() {
        var button = document.getElementById('font-btn');
        if (!button) return;
        var font = BY_ID[activeId] || FONTS[0];
        button.textContent = '[ ' + font.label + ' ]';
        button.setAttribute('aria-label', Site.t('ui.fontToggle') + ' [ ' + font.label + ' ]');
    }

    function applyFont(id, persist) {
        if (!BY_ID[id]) return;
        activeId = id;
        html.setAttribute('data-font', id);
        updateButton();
        if (persist) store.set('font', id);
        ensureFontLoaded(id);   // make sure the selected face is usable
        // the NEXT face is never warmed eagerly: it downloads only on
        // hover/focus of the button (see bind), never on idle.
    }

    function cycleFont() { applyFont(nextFontId(activeId), true); }

    function bind() {
        var button = document.getElementById('font-btn');
        if (button) {
            button.addEventListener('click', cycleFont);
            // the next face downloads only when the visitor shows intent,
            // never on idle: that used to cost ~144 KB per visit for nothing.
            ['mouseenter', 'focus'].forEach(function (eventName) {
                button.addEventListener(eventName, function () {
                    ensureFontLoaded(nextFontId(activeId));
                }, { passive: true });
            });
            if (document.activeElement === button) ensureFontLoaded(nextFontId(activeId));
        }
        // the aria-label is composed with UI copy, so re-render it on language change
        if (window.Site && typeof Site.onChange === 'function') {
            Site.onChange(function () { updateButton(); });
        }
        applyFont(store.get('font') || html.getAttribute('data-font') || 'jetbrains', false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    window.Fonts = { list: FONTS, get current() { return activeId; }, cycle: cycleFont, apply: applyFont };
}());
