/**
 * @app jsroll.image.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Растровая графика для jsroll — тот же функционал, что у jsroll.svg.js
 * (создание/удаление линий, кругов, дуг, многоугольников, текста; чтение/
 * запись свойств; плавная анимация), но через <canvas> вместо <svg>, с
 * прицелом на итоговый результат как обычный растровый <img> (см.
 * Canvas.toImage()). Оформлен в том же стиле: каждая созданная фигура
 * получает свойство `.raster` (аналог `.ui`/`.css`/`.svg`) с методами
 * attr/style/animate/rm/on/off/trigger. on/trigger — подписка на и
 * генерация полностью пользовательских типов событий с любыми данными
 * (у фигур — через свой мини-эмиттер, у самой канвы — через нативный
 * addEventListener/dispatchEvent на <canvas>), удобно для развязки "ввод
 * данных" / "отрисовка графика", см. examples/image/index.html.
 *
 * В отличие от SVG, у <canvas> нет отдельных DOM-узлов на фигуру — canvas
 * это просто пиксели. Поэтому здесь используется классическая для 2D-canvas
 * схема «retained mode поверх immediate mode»: каждая фигура — обычный JS-
 * объект в списке this.shapes у канвы, а Canvas.redraw() каждый раз очищает
 * канву и перерисовывает список заново. Это делает "удаление" фигуры
 * тривиальным (убрать из списка) и, в отличие от SVG-атрибутов (строки
 * вида "x1,y1 x2,y2 …"), позволяет одному и тому же .animate() плавно
 * анимировать вообще любое числовое свойство фигуры, включая массивы точек
 * (points у polyline/polygon) — без отдельных ручных твинов, как это
 * приходится делать для path/polygon в jsroll.svg.js.
 *
 * Зависит от jsroll.ui.js (использует window.ui для поиска контейнера по
 * селектору) — как и остальные необязательные модули jsroll.
 *
 * @author Андрей Новиков <andrey@novikov.be>
 * @status beta
 * @version 1.0.0
 */
(function (g, ui, undefined) {
    'use strict';
    if (typeof ui === 'undefined') return false;

    /** @function window.imageEasing — функции плавности для RasterShape.animate() */
    g.imageEasing = {
        linear: function (t) { return t; },
        easeIn: function (t) { return t * t; },
        easeOut: function (t) { return 1 - Math.pow(1 - t, 2); },
        easeInOut: function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    };

    /**
     * Линейная интерполяция значения свойства между двумя кадрами.
     * Понимает как простое число (cx, r, startAngle, …), так и массив
     * пар координат (points у polyline/polygon) — рекурсивно.
     */
    function lerp(a, b, e) {
        if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * e;
        if (a instanceof Array && b instanceof Array) return a.map(function (v, i) { return lerp(v, b[i], e); });
        return e < 1 ? a : b; // не число/массив (например, цвет строкой) — переключаем в конце анимации
    }

    /**
     * Небольшой миксин пользовательских событий для объектов без
     * собственного DOM-узла (RasterShape — обычный JS-объект, не элемент
     * canvas, поэтому нативный addEventListener/dispatchEvent ему не
     * доступен). API — те же on/off/trigger, что и у SvgElement/SvgCanvas
     * в jsroll.svg.js, чтобы оба модуля учились одинаково.
     */
    function withEvents(obj) {
        var handlers = {};
        obj.on = function (type, fn) {
            (handlers[type] || (handlers[type] = [])).push(fn);
            return obj;
        };
        obj.off = function (type, fn) {
            if (!handlers[type]) return obj;
            handlers[type] = fn ? handlers[type].filter(function (h) { return h !== fn; }) : [];
            return obj;
        };
        /** trigger(type, detail) — сгенерировать пользовательское событие; detail доступен в обработчике как e.detail */
        obj.trigger = function (type, detail) {
            (handlers[type] || []).slice().forEach(function (fn) { fn.call(obj, { type: type, detail: detail, target: obj }); });
            return obj;
        };
        return obj;
    }

    /**
     * @class RasterShape — одна фигура на канве (line/circle/ellipse/rect/
     * polyline/polygon/arc/text). Свойства читаются/пишутся через .attr(),
     * либо напрямую через объект, который возвращает .attr() без аргументов.
     */
    var RasterShape = function (canvas, type, attrs) {
        this.canvas = canvas;
        this.type = type;
        this.props = Object.merge({ fill: null, stroke: '#000', 'stroke-width': 1, opacity: 1, visible: true }, attrs || {});
        this.raster = this; // shape.raster.attr(...) работает так же, как el.svg.attr(...) у jsroll.svg.js
        withEvents(this);   // shape.on('my:event', fn) / shape.trigger('my:event', data)
    };
    RasterShape.prototype = {
        /**
         * RasterShape:attr — универсальный геттер/сеттер свойств фигуры.
         * @param a { string|Object= } имя свойства, {имя:значение}, либо не задан — вернуть все
         * @param v { *= }
         */
        attr: function (a, v) {
            if (a === undefined) return Object.merge({}, this.props);
            if (typeof a === 'object') { Object.merge(this.props, a); this.canvas.redraw(); return this; }
            if (v === undefined) return this.props[a];
            this.props[a] = v; this.canvas.redraw(); return this;
        },
        /** RasterShape:style — синоним attr(k,v) для однородности с .ui/.css/.svg */
        style: function (k, v) { return this.attr(k, v); },

        /** RasterShape:rm — убрать фигуру из канвы (и перерисовать) */
        rm: function () { this.canvas.remove(this); return this; },

        /**
         * RasterShape:animate — плавное изменение любых числовых свойств
         * (включая массивы точек) через общий цикл requestAnimationFrame
         * канвы — сколько бы фигур ни анимировалось одновременно, канва
         * перерисовывается один раз за кадр, а не по разу на фигуру.
         * @param props { Object } { имяСвойства: конечноеЗначение, ... }
         * @param duration { number } мс, по умолчанию 400
         * @param opt { Object } { easing, done, step }
         * @returns { function } stop() — досрочно прервать анимацию
         */
        animate: function (props, duration, opt) {
            opt = opt || {};
            var tween = {
                shape: this, props: props, duration: duration || 400,
                easing: opt.easing || g.imageEasing.linear,
                stepCb: opt.step, doneCb: opt.done,
                from: null, start: null, done: false
            };
            var from = {}; for (var k in props) from[k] = this.props[k];
            tween.from = from;
            this.canvas._tweens.push(tween);
            this.canvas._loop();
            return function stop() { tween.done = true; };
        }
    };

    /** Отрисовка одной фигуры в 2D-контекст. */
    function drawShape(ctx, s) {
        var p = s.props;
        if (p.visible === false) return;
        ctx.save();
        ctx.globalAlpha = p.opacity == null ? 1 : p.opacity;
        ctx.fillStyle = p.fill || 'transparent';
        ctx.strokeStyle = p.stroke || 'transparent';
        ctx.lineWidth = p['stroke-width'] || 1;
        if (p.dash) ctx.setLineDash(p.dash);

        if (s.type === 'text') {
            ctx.font = p.font || '12px sans-serif';
            ctx.textAlign = p.align || 'left';
            ctx.textBaseline = p.baseline || 'alphabetic';
            if (p.fill && p.fill !== 'none') ctx.fillText(p.text || '', p.x, p.y);
            if (p.stroke && p.stroke !== 'none' && p['stroke-width']) ctx.strokeText(p.text || '', p.x, p.y);
            ctx.restore();
            return;
        }

        ctx.beginPath();
        switch (s.type) {
            case 'line': ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); break;
            case 'circle': ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); break;
            case 'ellipse': ctx.ellipse(p.cx, p.cy, p.rx, p.ry, p.rotation || 0, 0, Math.PI * 2); break;
            case 'rect': ctx.rect(p.x, p.y, p.width, p.height); break;
            case 'polyline':
            case 'polygon':
                (p.points || []).forEach(function (pt, i) { i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]); });
                if (s.type === 'polygon') ctx.closePath();
                break;
            case 'arc': // сектор окружности — как Canvas.arc() в jsroll.svg.js, но растром; углы в градусах, 0° = «12 часов»
                var a0 = (p.startAngle - 90) * Math.PI / 180, a1 = (p.endAngle - 90) * Math.PI / 180;
                ctx.moveTo(p.cx, p.cy); ctx.arc(p.cx, p.cy, p.r, a0, a1); ctx.closePath();
                break;
        }
        if (p.fill && p.fill !== 'none') ctx.fill();
        if (p.stroke && p.stroke !== 'none') ctx.stroke();
        ctx.restore();
    }

    /**
     * @class RasterCanvas — контейнер <canvas> + методы создания фигур.
     * @param target { string|Element } селектор/элемент-контейнер, либо уже готовый <canvas>
     * @param opt { Object= } { width, height } — размер канвы в пикселях (не CSS!)
     */
    var RasterCanvas = function (target, opt) {
        var host = typeof target === 'string' ? ui.el(target) : target;
        var isCanvas = host && host.tagName && host.tagName.toLowerCase() === 'canvas';
        var el = isCanvas ? host : g.document.createElement('canvas');
        if (!isCanvas && host) host.appendChild(el);
        opt = opt || {};
        el.width = opt.width || el.clientWidth || 640;
        el.height = opt.height || el.clientHeight || 320;
        this.el = el;
        this.ctx = el.getContext('2d');
        this.shapes = [];
        this._tweens = [];
        this._looping = false;
    };

    RasterCanvas.prototype = {
        /** RasterCanvas:create — универсальное создание фигуры любого типа */
        create: function (type, attrs) { var s = new RasterShape(this, type, attrs); this.shapes.push(s); this.redraw(); return s; },

        line: function (attrs) { return this.create('line', attrs); },
        circle: function (attrs) { return this.create('circle', attrs); },
        ellipse: function (attrs) { return this.create('ellipse', attrs); },
        rect: function (attrs) { return this.create('rect', attrs); },
        polyline: function (attrs) { return this.create('polyline', attrs); },
        polygon: function (attrs) { return this.create('polygon', attrs); },
        arc: function (attrs) { return this.create('arc', attrs); },
        text: function (attrs, content) { attrs = Object.merge({}, attrs || {}); attrs.text = content || ''; return this.create('text', attrs); },

        /** RasterCanvas:remove — убрать конкретную фигуру (обычно вызывается через shape.raster.rm()) */
        remove: function (shape) { var i = this.shapes.indexOf(shape); if (i > -1) this.shapes.splice(i, 1); this.redraw(); return this; },

        /** RasterCanvas:clear — убрать все фигуры */
        clear: function () { this.shapes = []; this.redraw(); return this; },

        /** RasterCanvas:redraw — очистить канву и перерисовать все фигуры заново */
        redraw: function () {
            var ctx = this.ctx, el = this.el, shapes = this.shapes;
            ctx.clearRect(0, 0, el.width, el.height);
            for (var i = 0; i < shapes.length; i++) drawShape(ctx, shapes[i]);
        },

        /**
         * RasterCanvas:toImage — снимок текущего рисунка как настоящий
         * растровый <img> (создаёт новый элемент, либо обновляет переданный).
         * @param imgEl { HTMLImageElement= }
         * @returns { HTMLImageElement }
         */
        toImage: function (imgEl) {
            var img = imgEl || g.document.createElement('img');
            img.src = this.el.toDataURL('image/png');
            return img;
        },

        /**
         * RasterCanvas:on/off/trigger — подписка на пользовательские
         * события прямо на канве. this.el — настоящий <canvas> (DOM-узел),
         * поэтому здесь, в отличие от RasterShape, работает штатный
         * addEventListener/dispatchEvent, а не миксин withEvents. Удобно,
         * чтобы развязать код, добавляющий данные (например, обработчик
         * формы ввода), и код, который их рисует:
         *
         * canvas.on('point:added', function (e) { addBar(e.detail); });
         * ...
         * canvas.trigger('point:added', { label: 'Янв', value: 42 });
         */
        on: function (type, fn, opt) { this.el.addEventListener(type, fn, opt || false); return this; },
        off: function (type, fn, opt) { this.el.removeEventListener(type, fn, opt || false); return this; },
        trigger: function (type, detail) { this.el.dispatchEvent(new CustomEvent(type, { detail: detail, bubbles: true })); return this; },

        /** Общий цикл requestAnimationFrame для всех активных .animate() — один redraw() на кадр. */
        _loop: function () {
            var self = this;
            if (self._looping) return;
            self._looping = true;
            function step(ts) {
                var active = false;
                self._tweens.forEach(function (t) {
                    if (t.done) return;
                    active = true;
                    if (!t.start) t.start = ts;
                    var p = Math.min(1, (ts - t.start) / t.duration), e = t.easing(p);
                    for (var k in t.props) t.shape.props[k] = lerp(t.from[k], t.props[k], e);
                    if (typeof t.stepCb === 'function') t.stepCb.call(t.shape, p);
                    if (p >= 1) { t.done = true; if (typeof t.doneCb === 'function') t.doneCb.call(t.shape); }
                });
                self._tweens = self._tweens.filter(function (t) { return !t.done; });
                self.redraw();
                if (active || self._tweens.length) g.requestAnimationFrame(step); else self._looping = false;
            }
            g.requestAnimationFrame(step);
        }
    };

    g.RasterCanvas = RasterCanvas;

}(window, window.ui));
