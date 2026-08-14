# Обработка событий — ui.on / ui.dg

> В более ранней версии этого файла документировался объект `window.event`
> с назначаемым `.onclick`. Такого объекта в библиотеке нет и никогда не
> было. Реальный механизм — методы `.ui.on(...)` (прямая подписка) и
> `.ui.dg(...)` (делегированная подписка), доступные на любом элементе
> после того как он хотя бы раз был обёрнут библиотекой (например, через
> `document.querySelector(sel).ui`). Рабочий пример —
> `examples/event/index.html`.

## Прямая подписка — `el.ui.on(event, fn, args, opt)`

```html
<button id="btn">Нажми меня</button>
<script>
    document.querySelector('#btn').ui.on('click', function (e) {
        console.log('клик', e);
    });
</script>
```

`event` может содержать несколько типов через запятую (`'click,touchend'`) и
опциональный CSS-селектор-фильтр через `|` перед именем события
(`'a.external|click'` — сработает, только если элемент подходит под
`a.external`). `opt` — третий/четвёртый аргумент нативного
`addEventListener` (например, `{passive: true}`).

Отдельно поддерживается синтетическое событие `'dbltap'` — двойное
касание для мобильных устройств (аналог `dblclick` для touch-интерфейсов).

## Делегированная подписка — `container.ui.dg(selector, event, fn, args, opt)`

Обработчик вешается один раз на контейнер и продолжает работать для
элементов, добавленных в него уже после подписки — типичный кейс для
динамических списков:

```html
<ul id="list">
    <li>Задача 1 <button data-action="remove">×</button></li>
</ul>
<script>
    document.querySelector('#list').ui.dg('button[data-action="remove"]', 'click', function (e) {
        // внутри обработчика `this` — найденный делегированием элемент
        // (кнопка), а не сам контейнер
        this.closest('li').remove();
    });
</script>
```

Библиотека сама поднимается от `e.target` вверх по дереву в поисках
элемента, подходящего под `selector` — включая случай, когда событие
случилось на вложенном внутри кнопки элементе (иконке, `<span>` и т.п.).

## Отписка — `el.ui.off(event, fn, opt)`

```js
document.querySelector('#btn').ui.off('click', myHandler);
```

## Коды клавиш — `eventCode(e)`

Единая обёртка над `e.key` / `e.keyCode` / `e.data` (для `InputEvent`):

```js
document.querySelector('#input').ui.on('keyup', function (e) {
    console.log(eventCode(e));
});
```

Полный рабочий пример — в `examples/event/index.html`.
