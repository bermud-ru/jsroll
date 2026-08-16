# jsroll.svg.js — векторная графика (SVG)

> Модуль добавлен позже основной библиотеки (не входит в `jsroll.min.js`,
> подключается отдельным `<script>`). Зависит от `jsroll.ui.js` (нужен
> `window.ui`) — как `jsroll.dao.js`/`jsroll.ui.grid.js`, самостоятельно
> не подключается, если `ui` ещё нет. Рабочий пример — `examples/svg/index.html`.

## Идея

Любой созданный через модуль SVG-узел получает неизменяемое свойство
`.svg` — прямой аналог того, как обычные DOM-узлы получают `.ui`/`.css`
после `ui.wrap()`. `.svg` даёт `attr()`/`style()`/классы/`animate()`/`rm()`.

```js
var chart = new SvgCanvas('#chart', { viewBox: '0 0 640 220' });
var dot = chart.circle({ cx: 20, cy: 100, r: 4, fill: '#0d6efd' });
dot.svg.attr('r', 6);                 // изменить радиус
dot.svg.animate({ cy: 40 }, 500);     // плавно переместить по вертикали
dot.svg.rm();                          // удалить с канвы
```

## `new SvgCanvas(target, opt)`

`target` — селектор или уже существующий DOM-элемент. Если это готовый
`<svg>` — используется как есть; иначе внутрь `target` создаётся новый
`<svg>`. `opt` — атрибуты корневого `<svg>` (`viewBox`, `width`, `height`, ...).

```js
var canvas = new SvgCanvas('#holder', { viewBox: '0 0 400 300' });
canvas.el; // сам DOM-узел <svg>
```

## Создание фигур

```js
canvas.line({ x1, y1, x2, y2, stroke: '#000', 'stroke-width': 2 });
canvas.circle({ cx, cy, r, fill: '#0d6efd' });
canvas.ellipse({ cx, cy, rx, ry, fill: 'none', stroke: '#000' });
canvas.rect({ x, y, width, height, fill: '#eee' });
canvas.polyline({ points: 'x1,y1 x2,y2 ...', fill: 'none', stroke: '#0d6efd' });
canvas.polygon({ points: '...', fill: 'rgba(13,110,253,.25)' });
canvas.path({ d: 'M0,0 L10,10', stroke: '#000' });
canvas.text({ x, y, 'text-anchor': 'middle' }, 'подпись');
canvas.group({ class: 'layer-1' });
```

`attrs` — обычный JS-объект: ключи — SVG-атрибуты как есть (можно с
дефисом, `'stroke-width'`), значения — числа/строки.

## `canvas.arc({cx, cy, r, startAngle, endAngle, ...})`

Сектор окружности как `<path>` — основа для круговых диаграмм. Углы в
градусах, `0°` — «12 часов» (вверх), отсчёт по часовой стрелке.

```js
var start = 0;
data.forEach(function (d) {
    var end = start + d.value / total * 360;
    canvas.arc({ cx: 110, cy: 110, r: 90, startAngle: start, endAngle: end, fill: d.color });
    start = end;
});
```

## `el.svg.animate(props, duration, opt)`

Плавный твин **числовых** атрибутов через `requestAnimationFrame` (не
SMIL `<animate>` и не CSS-переходы — ради одинакового поведения во всех
браузерах на любых атрибутах).

```js
dot.svg.animate({ cx: 200, cy: 80 }, 600, {
    easing: svgEasing.easeInOut,   // linear (по умолчанию) | easeIn | easeOut | easeInOut
    step: function (progress) { /* 0..1 на каждом кадре */ },
    done: function () { /* по завершении */ }
});
```

### ⚠ `points`/`d` — строки, `.animate()` их напрямую не тянет

`points` у `polyline`/`polygon` и `d` у `path` — строковые атрибуты
(`"x1,y1 x2,y2 ..."`), а не отдельные числа, поэтому встроенный
`.animate()` не умеет их плавно интерполировать. Для анимации круговой
диаграммы (угол сектора) или «паутинки» (точки многоугольника) нужен свой
небольшой твин по кадрам поверх тех же примитивов — готовые примеры
(`tweenArc()`, `tweenPoints()`) есть в `examples/svg/index.html`. Если
нужна анимация именно таких составных свойств «из коробки» — см.
`jsroll.image.js` (растровый аналог этого модуля): там `.raster.animate()`
умеет интерполировать и массивы точек тоже, см. `docs/image.md`.

## Удаление и очистка

```js
shape.svg.rm();     // убрать один узел
canvas.clear();      // убрать всё содержимое канвы
```

## Классы у SVG-элементов — не `el.className`

У SVG-узлов `className` — не строка, а `SVGAnimatedString`, поэтому
обычный `css`-хелпер `jsroll.ui.js` (работающий со строками) для них не
подходит. `el.svg` даёт свои методы через `classList` (одинаково работают
и для HTML, и для SVG):

```js
shape.svg.addClass('active');
shape.svg.removeClass('active');
shape.svg.hasClass('active');   // true/false
shape.svg.toggleClass('active');
```

## Полный пример

Три готовых сценария (живой график, круговая диаграмма, «паутинка»
radar-chart) — в `examples/svg/index.html`.
