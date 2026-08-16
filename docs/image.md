# jsroll.image.js — растровая графика (canvas → img)

> Модуль добавлен позже основной библиотеки, зависит от `jsroll.ui.js`
> (нужен `window.ui`) — как `jsroll.dao.js`/`jsroll.ui.grid.js`. Рабочий
> пример — `examples/image/index.html`. Векторный аналог этого модуля —
> `jsroll.svg.js` (см. `docs/svg.md`); функционал тот же, реализация — на
> `<canvas>` вместо `<svg>`.

## Идея

У `<canvas>`, в отличие от `<svg>`, нет отдельного DOM-узла на каждую
фигуру — это просто пиксели. Модуль хранит фигуры как обычные JS-объекты
в списке канвы (`canvas.shapes`) и перерисовывает канву целиком при любом
изменении («retained mode» поверх immediate-mode API canvas). Каждая
фигура получает свойство `.raster`, указывающее **на саму себя**
(`shape.raster === shape`) — это сделано специально, чтобы вызовы
выглядели так же, как `el.svg.attr(...)`/`el.ui.on(...)` у остальных
частей jsroll:

```js
var canvas = new RasterCanvas('#chart', { width: 640, height: 220 });
var dot = canvas.circle({ cx: 20, cy: 100, r: 4, fill: '#0d6efd' });
dot.raster.attr('r', 6);
dot.raster.animate({ cy: 40 }, 500);
dot.raster.rm();
```

## `new RasterCanvas(target, opt)`

`target` — селектор или элемент-контейнер (либо уже готовый `<canvas>`).
`opt.width`/`opt.height` — размер канвы **в пикселях** (не CSS-размер;
CSS может менять отображаемый размер отдельно через стили `width:100%` и т.п.).

```js
var canvas = new RasterCanvas('#holder', { width: 400, height: 300 });
canvas.el;  // сам DOM-узел <canvas>
canvas.ctx; // 2D-контекст (CanvasRenderingContext2D), если нужен прямой доступ
```

## Создание фигур

```js
canvas.line({ x1, y1, x2, y2, stroke: '#000', 'stroke-width': 2 });
canvas.circle({ cx, cy, r, fill: '#0d6efd' });
canvas.ellipse({ cx, cy, rx, ry, fill: 'none', stroke: '#000' });
canvas.rect({ x, y, width, height, fill: '#eee' });
canvas.polyline({ points: [[x1,y1],[x2,y2],...], fill: 'none', stroke: '#0d6efd' });
canvas.polygon({ points: [[x1,y1],...], fill: 'rgba(13,110,253,.25)' });
canvas.arc({ cx, cy, r, startAngle, endAngle, fill: '#dc3545' }); // сектор, для диаграмм
canvas.text({ x, y, align: 'center', font: '12px sans-serif', fill: '#000' }, 'подпись');
```

Отличие от `jsroll.svg.js`: `points` — **массив пар** `[x, y]`, а не
строка (у SVG `"x1,y1 x2,y2"`). Углы `arc()` — в градусах, `0°` = «12
часов», по часовой стрелке — так же, как у `canvas.arc()` в `jsroll.svg.js`.

## `shape.raster.animate(props, duration, opt)` — умеет и массивы точек

В отличие от `jsroll.svg.js` (где `points`/`d` — строки, и для их
анимации нужен собственный твин по кадрам), здесь `.animate()` **сам**
умеет плавно интерполировать любое числовое свойство, включая массив пар
`points`:

```js
slice.raster.animate({ startAngle: 40, endAngle: 130 }, 600);      // как обычное число
dataPolygon.raster.animate({ points: newPointsArray }, 500);        // и как массив точек — тоже
```

Все одновременные `.animate()`-вызовы на одной канве используют **общий**
цикл `requestAnimationFrame`: сколько бы фигур ни анимировалось разом,
перерисовка (`canvas.redraw()`) происходит один раз за кадр, а не по разу
на фигуру.

```js
shape.raster.animate({ cx: 100 }, 400, {
    easing: imageEasing.easeInOut,  // linear (по умолчанию) | easeIn | easeOut | easeInOut
    step: function (progress) { /* 0..1 на каждом кадре */ },
    done: function () { /* по завершении */ }
});
```

## Удаление и очистка

```js
shape.raster.rm();   // убрать одну фигуру
canvas.clear();       // убрать все фигуры
```

## `canvas.toImage(imgEl?)` — снимок как настоящий `<img>`

Интерактив (создание/анимация/удаление фигур) требует именно `<canvas>` —
а вот результат можно получить как обычный растровый `<img>`:

```js
var img = canvas.toImage();                       // новый <img>, src = canvas.el.toDataURL('image/png')
canvas.toImage(document.querySelector('#preview')); // обновит уже существующий <img>

// то же самое — на скачивание PNG:
downloadLink.href = canvas.el.toDataURL('image/png');
downloadLink.download = 'chart.png';
```

## Полный пример

Те же три сценария, что у `jsroll.svg.js` (живой график, круговая
диаграмма, «паутинка»), плюс снимок в `<img>` — в `examples/image/index.html`.
