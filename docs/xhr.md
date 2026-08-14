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
    done: function (e) { /* this === XMLHttpRequest */ },
    fail: function (e) { /* тоже this === XMLHttpRequest */ },
    after: function (e, status) { /* вызывается после done/fail/cancel в любом случае */ }
});
```

Внутри `done`/`fail`/`after` **`this`** — сам объект `XMLHttpRequest`, а не
что-то обёрнутое: `this.status`, `this.responseText` и т.д. доступны
напрямую.

## `x.responseJSON`

Библиотека добавляет к каждому запросу геттер `responseJSON`, безопасно
парсящий `responseText` как JSON и подставляющий понятное сообщение об
ошибке в `{result:'error', message:...}`, если разбор не удался:

```js
xhr({
    url: '/api/questions',
    done: function (e) {
        var res = this.responseJSON; // не JSON.parse(this.responseText) вручную
        console.log(res.data);
    }
});
```

## Коды HTTP-ответов

Таблица `HTTP_RESPONSE_CODE`, встроенная в `jsroll.js`, пригодится в
`fail`:

```js
fail: function (e) {
    console.error('HTTP ' + this.status + ': ' + HTTP_RESPONSE_CODE[this.status]);
}
```

## Пример

```html
<button id="load">Загрузить</button>
<script>
    document.querySelector('#load').ui.on('click', function () {
        xhr({
            method: 'get',
            url: 'sample.json',
            done: function (e) {
                console.log(this.responseJSON.data);
            },
            fail: function (e) {
                console.error(this.status);
            }
        });
    });
</script>
```

Полный рабочий пример (успешный запрос, обработка ошибки, `before`/`after`)
— в `examples/xhr/index.html`.
