/**
 * @app jsroll.svg.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Векторная графика (SVG) для jsroll: создание и удаление примитивов
 * (линия, круг, эллипс, прямоугольник, ломаная, многоугольник, дуга,
 * путь, текст, группа), управление их атрибутами/стилем/классами и
 * плавное изменение числовых свойств во времени (для графиков).
 *
 * Оформлен в стиле jsroll.ui.js: любой созданный SVG-узел получает
 * неизменяемое свойство `.svg` (аналог `.ui`/`.css` у обычных DOM-узлов)
 * с методами attr/style/классы(add/removeClass)/animate/rm/on/off/trigger.
 * `on`/`trigger` — не только обычные DOM-события (click и т.п.), но и
 * полностью пользовательские типы событий с любыми данными (addEventListener
 * одинаково принимает любую строку) — то же самое умеет и сама канва
 * (`SvgCanvas`), что удобно для развязки "ввод данных" / "отрисовка
 * графика", см. examples/svg/index.html. Зависит от jsroll.ui.js
 * (использует window.ui для поиска контейнера по селектору) — как и
 * jsroll.dao.js/jsroll.ui.grid.js, самостоятельно не подключается.
 *
 * @author Андрей Новиков <andrey@novikov.be>
 * @status beta
 * @version 1.0.0
 */
(function (g, ui, undefined) {
    'use strict';
    if (typeof ui === 'undefined') return false;

    var NS = 'http://www.w3.org/2000/svg';

    /**
     * @class SvgElement — обёртка одного SVG-узла (свойство el.svg)
     */
    var SvgElement = function (el) { this.instance = el; };
    SvgElement.prototype = {
        /**
         * SvgElement:attr — универсальный геттер/сеттер SVG-атрибутов
         * (аналог ui.attr(), но через setAttribute — у SVG-геометрии
         * вроде cx/cy/r/points нет простых JS-свойств для присваивания).
         * @param a { string|Object= } имя атрибута, объект {имя:значение}, либо не задан — вернуть все
         * @param v { string|number= }
         * @returns { string|Object|SvgElement }
         */
        attr: function (a, v) {
            var el = this.instance, i, atts;
            if (a === undefined) {
                var res = {}; atts = el.attributes;
                for (i = 0; i < atts.length; i++) res[atts[i].nodeName] = QueryParam(atts[i].nodeValue);
                return res;
            }
            if (typeof a === 'object') {
                for (var k in a) { if (a[k] === null || a[k] === undefined) el.removeAttribute(k); else el.setAttribute(k, a[k]); }
                return this;
            }
            if (v === undefined) { var raw = el.getAttribute(a); return raw === null ? null : QueryParam(raw); }
            if (v === null) el.removeAttribute(a); else el.setAttribute(a, v);
            return this;
        },

        /** SvgElement:style — как el.style[k]=v (transform/opacity/cursor и т.п.) */
        style: function (k, v) { this.instance.style[k] = v; return this; },

        // classList работает одинаково для HTML и SVG узлов (в отличие от el.className,
        // который у SVG — не строка, а SVGAnimatedString; поэтому здесь classList,
        // а не переиспользование обычного css-хелпера jsroll.ui.js).
        addClass: function (c) { this.instance.classList.add.apply(this.instance.classList, String(c).split(/\s+/)); return this; },
        removeClass: function (c) { this.instance.classList.remove.apply(this.instance.classList, String(c).split(/\s+/)); return this; },
        hasClass: function (c) { return this.instance.classList.contains(c); },
        toggleClass: function (c) { this.instance.classList.toggle(c); return this; },

        /** SvgElement:on/off — подписка/отписка от событий узла: и обычных
         * DOM-событий (click/mouseover/...), и полностью пользовательских
         * типов (addEventListener одинаково принимает любую строку) —
         * см. SvgElement:trigger ниже, чтобы такие события генерировать. */
        on: function (event, fn, opt) { this.instance.addEventListener(event, fn, opt || false); return this; },
        off: function (event, fn, opt) { this.instance.removeEventListener(event, fn, opt || false); return this; },

        /**
         * SvgElement:trigger — сгенерировать (диспатчить) на узле
         * пользовательское событие произвольного типа с любыми данными.
         * Событие всплывает (bubbles:true), поэтому его может поймать и
         * .svg.on(...) на родительской группе/канве, и .ui.dg(...) на
         * обычном DOM-контейнере снаружи.
         * @param type { string } имя события, например 'point:added'
         * @param detail { *= } любые данные, доступны в обработчике как e.detail
         */
        trigger: function (type, detail) {
            this.instance.dispatchEvent(new CustomEvent(type, { detail: detail, bubbles: true }));
            return this;
        },

        /** SvgElement:append — добавить готовый узел внутрь (группы и т.п.) */
        append: function (child) { this.instance.appendChild(child.instance || child); return wrap(child.instance || child); },

        /** SvgElement:rm — удалить узел из DOM */
        rm: function () { if (this.instance.parentNode) this.instance.parentNode.removeChild(this.instance); return this; },

        /**
         * SvgElement:animate — плавное изменение числовых атрибутов во
         * времени через requestAnimationFrame (собственный твин, а не
         * SMIL <animate>/CSS-переходы — ради предсказуемого одинакового
         * поведения во всех браузерах на любых SVG-атрибутах).
         * @param props { Object } { имяАтрибута: конечноеЧисло, ... }
         * @param duration { number } мс, по умолчанию 400
         * @param opt { Object } { easing: fn(t), done: fn(), step: fn(progress) }
         * @returns { function } stop() — досрочно прервать анимацию
         */
        animate: function (props, duration, opt) {
            opt = opt || {}; duration = duration || 400;
            var el = this.instance, self = this, from = {}, start = null, stopped = false;
            var ease = opt.easing || g.svgEasing.linear;
            for (var k in props) from[k] = parseFloat(el.getAttribute(k)) || 0;
            function frame(ts) {
                if (stopped) return;
                if (!start) start = ts;
                var p = Math.min(1, (ts - start) / duration), e = ease(p);
                for (var k in props) el.setAttribute(k, from[k] + (props[k] - from[k]) * e);
                if (typeof opt.step === 'function') opt.step.call(self, p);
                if (p < 1) g.requestAnimationFrame(frame); else if (typeof opt.done === 'function') opt.done.call(self);
            }
            g.requestAnimationFrame(frame);
            return function stop() { stopped = true; };
        }
    };

    function wrap(el) {
        if (el && !el.hasOwnProperty('svg')) Object.defineProperty(el, 'svg', { value: new SvgElement(el), writable: false, configurable: false });
        return el;
    }

    /** Общий хелпер скачивания текстового содержимого файлом (не g.dwnBlob() —
     * у той функции есть известный баг: аргумент mime-типа фактически
     * игнорируется из-за Object.assign(target, строка) в g.bb(), см. AI_CONTEXT.md). */
    function downloadBlob(content, filename, type) {
        var blob = new g.Blob([content], { type: type });
        var url = g.URL.createObjectURL(blob);
        var a = g.document.createElement('a');
        a.href = url; a.download = filename;
        g.document.body.appendChild(a); a.click();
        g.document.body.removeChild(a);
        setTimeout(function () { g.URL.revokeObjectURL(url); }, 1000);
    }

    /** @function window.svgEasing — готовые функции плавности для SvgElement.animate() */
    g.svgEasing = {
        linear: function (t) { return t; },
        easeIn: function (t) { return t * t; },
        easeOut: function (t) { return 1 - Math.pow(1 - t, 2); },
        easeInOut: function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    };

    /**
     * @function window.svgEl — низкоуровневая фабрика одного SVG-узла
     * @param tag { string } 'line'|'circle'|'rect'|'ellipse'|'polyline'|'polygon'|'path'|'text'|'g'|...
     * @param attrs { Object= } атрибуты сразу при создании
     * @param parent { Element|SvgElement= } куда сразу добавить (необязательно)
     * @returns { Element } DOM-узел с обёрткой .svg
     */
    g.svgEl = function (tag, attrs, parent) {
        var el = wrap(g.document.createElementNS(NS, tag));
        if (attrs) el.svg.attr(attrs);
        if (parent) (parent.instance || parent).appendChild(el);
        return el;
    };

    /**
     * @class Canvas — контейнер <svg> + методы создания фигур
     * @param target { string|Element } селектор/элемент-контейнер, либо уже готовый <svg>
     * @param opt { Object= } атрибуты корневого <svg> (viewBox, width, height, ...)
     */
    var Canvas = function (target, opt) {
        var host = typeof target === 'string' ? ui.el(target) : target;
        var isSvg = host && host.tagName && host.tagName.toLowerCase() === 'svg';
        var el = isSvg ? host : g.svgEl('svg');
        if (!isSvg && host) host.appendChild(el);
        wrap(el);
        el.svg.attr(Object.merge({ width: '100%', height: '100%' }, opt || {}));
        this.el = el;
    };

    Canvas.prototype = {
        /** Canvas:create — универсальное создание любого тега внутри канвы */
        create: function (tag, attrs) { return g.svgEl(tag, attrs, this.el); },

        line: function (attrs) { return this.create('line', attrs); },
        circle: function (attrs) { return this.create('circle', attrs); },
        ellipse: function (attrs) { return this.create('ellipse', attrs); },
        rect: function (attrs) { return this.create('rect', attrs); },
        polyline: function (attrs) { return this.create('polyline', attrs); },
        polygon: function (attrs) { return this.create('polygon', attrs); },
        path: function (attrs) { return this.create('path', attrs); },
        group: function (attrs) { return this.create('g', attrs); },

        /** Canvas:text — текстовый узел (content задаётся отдельным аргументом, не атрибутом) */
        text: function (attrs, content) { var t = this.create('text', attrs); t.textContent = content || ''; return t; },

        /**
         * Canvas:arc — сектор/дуга окружности как <path> — основа для круговых диаграмм.
         * @param attrs { Object } { cx, cy, r, startAngle, endAngle, ...остальные атрибуты path (fill/stroke/...) }
         *   Угол в градусах, 0° — «12 часов» (вверх), по часовой стрелке.
         * @returns { Element }
         */
        arc: function (attrs) {
            var cx = attrs.cx, cy = attrs.cy, r = attrs.r, a0 = attrs.startAngle, a1 = attrs.endAngle;
            function pt(a) { var rad = (a - 90) * Math.PI / 180; return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }; }
            var p0 = pt(a0), p1 = pt(a1), large = (a1 - a0) % 360 > 180 ? 1 : 0;
            var d = 'M' + cx + ',' + cy + ' L' + p0.x + ',' + p0.y + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + p1.x + ',' + p1.y + ' Z';
            var rest = Object.merge({}, attrs);
            delete rest.cx; delete rest.cy; delete rest.r; delete rest.startAngle; delete rest.endAngle;
            rest.d = d;
            return this.path(rest);
        },

        /** Canvas:clear — удалить всё содержимое канвы */
        clear: function () { while (this.el.firstChild) this.el.removeChild(this.el.firstChild); return this; },

        /** Canvas:rm — удалить конкретный узел, созданный этой канвой */
        rm: function (el) { (el.svg || wrap(el).svg).rm(); return this; },

        /** Canvas:toSVG — сериализовать текущее содержимое канвы в строку SVG */
        toSVG: function () { return new g.XMLSerializer().serializeToString(this.el); },

        /**
         * Canvas:download — сохранить канву в файл .svg.
         * @param filename { string= } по умолчанию 'chart.svg'
         */
        download: function (filename) {
            downloadBlob(this.toSVG(), filename || 'chart.svg', 'image/svg+xml');
            return this;
        },

        /**
         * Canvas:downloadJSON — сохранить в файл .json произвольные данные
         * (например, точки графика, а не саму картинку) — пара к download(),
         * чтобы данные можно было потом загрузить обратно и перестроить
         * график (см. пример: examples/svg/index.html, раздел 4).
         * @param data { * } любые JSON-сериализуемые данные
         * @param filename { string= } по умолчанию 'data.json'
         */
        downloadJSON: function (data, filename) {
            downloadBlob(JSON.stringify(data, null, 2), filename || 'data.json', 'application/json');
            return this;
        },

        /**
         * Canvas:on/off/trigger — подписка на пользовательские события
         * прямо на канве (корневой <svg> — обычный DOM-узел, поэтому
         * работает штатный addEventListener/dispatchEvent). Удобно, чтобы
         * развязать код, добавляющий данные (например, обработчик формы
         * ввода), и код, который их рисует — первый просто генерирует
         * событие с произвольным именем и данными, второй на него
         * подписан и ничего не знает об источнике данных.
         *
         * canvas.on('point:added', function (e) { addPoint(e.detail); });
         * ...
         * canvas.trigger('point:added', { label: 'Янв', value: 42 });
         */
        on: function (type, fn, opt) { this.el.addEventListener(type, fn, opt || false); return this; },
        off: function (type, fn, opt) { this.el.removeEventListener(type, fn, opt || false); return this; },
        trigger: function (type, detail) { this.el.dispatchEvent(new CustomEvent(type, { detail: detail, bubbles: true })); return this; }
    };

    g.SvgCanvas = Canvas;

}(window, window.ui));
