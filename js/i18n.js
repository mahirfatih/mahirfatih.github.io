/* ==========================================================================
   i18n.js — ortak çekirdek
   Sorumlulukları: dil · tema · içerik dosyalarının yüklenmesi · metin basımı.
   Bu dosya tasarım bilmez; terminal.js ve blueprint.js yalnızca kendi işini yapar.
   ========================================================================== */
(function () {
    'use strict';

    var html = document.documentElement;

    var store = {
        get: function (key) {
            try { return localStorage.getItem(key); } catch (err) { return null; }
        },
        set: function (key, value) {
            try { localStorage.setItem(key, value); } catch (err) { /* private mode */ }
        }
    };

    /* ---------------- language ---------------- */
    var storedLang = store.get('lang');
    var lang = (storedLang === 'tr' || storedLang === 'en')
        ? storedLang
        : (html.getAttribute('data-lang') === 'en' ? 'en' : 'tr');

    /* ---------------- theme ---------------- */
    var storedTheme = store.get('theme');
    var prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var theme = (storedTheme === 'dark' || storedTheme === 'light')
        ? storedTheme
        : (prefersDark ? 'dark' : 'light');

    function applyTheme(value) {
        html.setAttribute('data-theme', value);
        var button = document.getElementById('theme-btn');
        if (button) button.setAttribute('aria-pressed', String(value === 'dark'));
    }

    function setTheme(value, persist) {
        theme = value === 'dark' ? 'dark' : 'light';
        applyTheme(theme);
        if (persist !== false) store.set('theme', theme);
    }

    function toggleTheme() {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }

    /* ---------------- content ---------------- */
    var sections = (document.body.getAttribute('data-sections') || '')
        .split(',')
        .map(function (name) { return name.trim(); })
        .filter(Boolean);

    var data = Object.create(null);
    var failure = null;
    var listeners = [];

    function lookup(path) {
        if (!path) return '';
        var parts = path.split('.');
        var root = data[parts[0]];
        if (!root) return '';
        var order = lang === 'tr' ? ['tr', 'en'] : ['en', 'tr'];
        for (var i = 0; i < order.length; i++) {
            var node = root[order[i]];
            for (var j = 1; j < parts.length && node != null; j++) node = node[parts[j]];
            if (node != null && typeof node !== 'object') return node;
        }
        return '';
    }

    function t(path, fallback) {
        var value = lookup(path);
        return value === '' ? (fallback == null ? '' : fallback) : value;
    }

    function paint() {
        var i, node, key, value;

        var textNodes = document.querySelectorAll('[data-i18n]');
        for (i = 0; i < textNodes.length; i++) {
            node = textNodes[i];
            value = lookup(node.getAttribute('data-i18n'));
            if (value !== '') node.textContent = value;
        }

        var htmlNodes = document.querySelectorAll('[data-i18n-html]');
        for (i = 0; i < htmlNodes.length; i++) {
            node = htmlNodes[i];
            value = lookup(node.getAttribute('data-i18n-html'));
            if (value !== '') node.innerHTML = value;
        }

        var ariaNodes = document.querySelectorAll('[data-i18n-aria]');
        for (i = 0; i < ariaNodes.length; i++) {
            node = ariaNodes[i];
            value = lookup(node.getAttribute('data-i18n-aria'));
            if (value !== '') node.setAttribute('aria-label', value);
        }

        // language buttons reflect the active language
        var langButtons = document.querySelectorAll('[data-lang-btn]');
        for (i = 0; i < langButtons.length; i++) {
            node = langButtons[i];
            key = node.getAttribute('data-lang-btn');
            node.setAttribute('aria-pressed', String(key === lang));
            node.classList.toggle('active', key === lang);
        }
    }

    function notify() {
        for (var i = 0; i < listeners.length; i++) listeners[i](lang, data);
    }

    function onChange(handler) {
        listeners.push(handler);
        if (typeof handler === 'function') handler(lang, data);
    }

    function setLang(next) {
        if (next !== 'tr' && next !== 'en' || next === lang) return;
        lang = next;
        html.setAttribute('data-lang', lang);
        html.setAttribute('lang', lang);
        store.set('lang', lang);
        paint();
        notify();
    }

    function loadSection(name) {
        return fetch('/content/' + encodeURIComponent(name) + '.json', { cache: 'no-cache' })
            .then(function (response) {
                if (!response.ok) throw new Error(name + ' → HTTP ' + response.status);
                return response.json();
            })
            .then(function (json) { data[name] = json; });
    }

    /* ---------------- wire the static controls ---------------- */
    function bindControls() {
        var langButtons = document.querySelectorAll('[data-lang-btn]');
        for (var i = 0; i < langButtons.length; i++) {
            (function (button) {
                button.addEventListener('click', function () {
                    setLang(button.getAttribute('data-lang-btn'));
                });
            })(langButtons[i]);
        }

        var themeButton = document.getElementById('theme-btn');
        if (themeButton) themeButton.addEventListener('click', toggleTheme);
    }

    /* ---------------- failure notice ---------------- */
    function showFailure(err) {
        failure = err;
        var main = document.getElementById('main');
        if (!main) return;
        var note = document.createElement('div');
        note.className = 'content-error';
        note.setAttribute('role', 'alert');
        note.textContent = 'İçerik yüklenemedi (' + err.message + '). '
            + 'Sayfayı yenileyin ya da bağlantıınızı kontrol edin. '
            + 'Content could not be loaded. Please refresh.';
        main.insertBefore(note, main.firstChild);
    }

    /* ---------------- boot ---------------- */
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    applyTheme(theme);
    bindControls();

    var ready = Promise.all(sections.map(loadSection))
        .catch(function (err) { showFailure(err); })
        .then(function () {
            paint();
            notify();
        });

    window.Site = {
        ready: ready,
        t: t,
        data: data,
        get lang() { return lang; },
        setLang: setLang,
        theme: function () { return theme; },
        setTheme: setTheme,
        toggleTheme: toggleTheme,
        onChange: onChange,
        failure: function () { return failure; }
    };
}());
