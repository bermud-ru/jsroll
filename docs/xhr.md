# window.xhr — обёртка над XMLHttpRequest

> В более ранней версии этого файла документировался цепочечный вызов
> `xhr.request(...).process(...).result(...)`. Такого API в библиотеке нет
> и никогда не было. `window.xhr` — это **функция**, принимающая один
> объект настроек. Рабочий пример — `examples/xhr/index.html`.

## Сигнатура

```js
xhr({
    method: 'get',           // по умолчанию 'GET'
    url: '/api/questions',   // по умолчанию текущий location.pathname
    data: {...},             // объект — будет сериализован; для GET/DELETE уйдёт в query string
    rs: {'Content-type': 'application/json'},  // дополнительные заголовки запроса
    withCredentials: true,   // по умолчанию true
    timeout: 10000,          // мс
    before: function (e) { return true; },  // false — отменить отправку
    done: function (e) { /* см. раздел "this внутри done/fail/after" ниже */ },
    fail: function (e) { /* аналогично */ },
    after: function (e, status) { /* вызывается после done/fail/cancel в любом случае */ }
});
```

## ⚠ `this` внутри `done`/`fail`/`after` — НЕ `XMLHttpRequest`

В более ранней версии этого файла утверждалось, что `this` внутри
`done`/`fail`/`after` — сам объект `XMLHttpRequest`. **Это неверно** —
проверено эмпирически (см. `examples/forms/index.html`, где эта ошибка
сначала попала в пример именно из-за этого неточного описания, и была
найдена только тестированием). В исходнике (`jsroll.js`) финальный вызов
выглядит так:

```js
var done = function (e) {
    ...
    if (typeof opt.done === 'function') opt.done(e); // обычный вызов, БЕЗ .call(x, e)
    ...
};
```

`opt.done(e)`/`opt.fail(e)`/`opt.after(e, status)` вызываются как обычные
функции, а не через `opt.done.call(x, e)` — поэтому `this` внутри них
**не** привязан к XHR-инстансу: это `window` (в нестрогом режиме, то есть
почти всегда для обычных инлайновых `<script>`) или `undefined` (если ваш
код в `'use strict'`). Верный способ получить доступ к самому запросу —
через аргумент `e` (это событие `load`/`error`, у которого `e.target` —
XHR), как это сделано по всему исходному проекту (`common.app.js`,
`users.js` и др.):

```js
xhr({
    url: '/api/questions',
    done: function (e) {
        var res = ui.src(e).responseJSON; // НЕ this.responseJSON — this здесь не XHR
        console.log(res.data);
    },
    fail: function (e) {
        console.error(ui.src(e).status);
    }
});
```

`ui.src(e)` — штатный способ извлечь `e.target` в jsroll (см.
`docs/event.md`); то же самое можно получить и без него, напрямую через
`e.target`.

## `x.responseJSON`

Библиотека добавляет к каждому запросу геттер `responseJSON`, безопасно
парсящий `responseText` как JSON и подставляющий понятное сообщение об
ошибке в `{result:'error', message:...}`, если разбор не удался:

```js
xhr({
    url: '/api/questions',
    done: function (e) {
        var res = ui.src(e).responseJSON; // не JSON.parse(...responseText) вручную
        console.log(res.data);
    }
});
```

## Коды HTTP-ответов

Таблица `HTTP_RESPONSE_CODE`, встроенная в `jsroll.js`, пригодится в
`fail`:

```js
fail: function (e) {
    var x = ui.src(e);
    console.error('HTTP ' + x.status + ': ' + HTTP_RESPONSE_CODE[x.status]);
}
```

## Пример

```html
<button id="load">Загрузить</button>
<script>
    ui.el('#load').ui.on('click', function () {
        xhr({
            method: 'get',
            url: 'sample.json',
            done: function (e) {
                console.log(ui.src(e).responseJSON.data);
            },
            fail: function (e) {
                console.error(ui.src(e).status);
            }
        });
    });
</script>
```

Полный рабочий пример (успешный запрос, обработка ошибки, `before`/`after`)
— в `examples/xhr/index.html`. Живая демонстрация того же нюанса с `this`
(и того, как формы jsroll умеют отправлять запросы РЕАЛЬНЫМИ REST-методами,
а не только GET/POST) — в `examples/forms/index.html`.

