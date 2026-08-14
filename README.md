# JsRoll RIA (Rich Internet Application) / SPA (Single-page Application) javascript framework

# Документация по API

> Версия библиотеки: **2.1.2b** (см. `composer.json`, `src/jsroll.js`).
> Документация подготовлена по фактическому исходному коду в `src/*.js`.


## Содержание

1. [Обзор и подключение](#1-обзор-и-подключение)
2. [Структура проекта и сборка](#2-структура-проекта-и-сборка)
3. [jsroll.js — ядро](#3-jsrolljs--ядро)
   - 3.1 [Утилиты общего назначения](#31-утилиты-общего-назначения)
   - 3.2 [Работа со строкой запроса и URL](#32-работа-со-строкой-запроса-и-url)
   - 3.3 [Маршрутизатор `window.urn`](#33-маршрутизатор-windowurn)
   - 3.4 [`xhr()` — обёртка над XMLHttpRequest](#34-xhr--обёртка-над-xmlhttprequest)
   - 3.5 [`tpl()` — шаблонизатор](#35-tpl--шаблонизатор)
   - 3.6 [`dom()` — парсинг строки в DOM](#36-dom--парсинг-строки-в-dom)
   - 3.7 [`func()` / `js()` — динамический код](#37-func--js--динамический-код)
   - 3.8 [WebSocket-обёртка `ws`](#38-websocket-обёртка-ws)
   - 3.9 [IndexedDB: `IDB`, `IDBFilter`](#39-indexeddb-idb-idbfilter)
   - 3.10 [webSQL: `webSQL`, `dbf`](#310-websql-websql-dbf)
   - 3.11 [Экспорт/импорт данных, печать, файлы](#311-экспортимпорт-данных-печать-файлы)
   - 3.12 [Расширения встроенных объектов](#312-расширения-встроенных-объектов)
4. [jsroll.ui.js — UI-слой](#4-jsrollui js--ui-слой)
   - 4.1 [`storage()`](#41-storage)
   - 4.2 [`Application` / `window.app`](#42-application--windowapp)
   - 4.3 [`css` — работа с классами и стилями](#43-css--работа-с-классами-и-стилями)
   - 4.4 [`ui` — обёртка над DOM-элементом](#44-ui--обёртка-над-dom-элементом)
   - 4.5 [Формы: `group`, `crud`, `dataObject`](#45-формы-group-crud-dataobject)
   - 4.6 [Валидация: `isvalid`, `input_validator`, `pattern_validator`](#46-валидация-isvalid-input_validator-pattern_validator)
   - 4.7 [Готовые UI-хелперы: `tabpanel`, `paginator`, `typeahead`, `maskedigits`](#47-готовые-ui-хелперы-tabpanel-paginator-typeahead-maskedigits)
5. [jsroll.dao.js — модели данных](#5-jsrolldaojs--модели-данных)
   - 5.1 [`IDBmodel`](#51-idbmodel)
   - 5.2 [`webSQLmodel`](#52-websqlmodel)
6. [jsroll.ui.grid.js — таблицы/спредшиты](#6-jsrolluigridjs--таблицыспредшиты)
   - 6.1 [`Cursor`](#61-cursor)
   - 6.2 [`grid()` — редактируемая таблица с формулами](#62-grid--редактируемая-таблица-с-формулами)
   - 6.3 [`journal()` — раскрывающийся «журнальный» реестр](#63-journal--раскрывающийся-журнальный-реестр)
7. [jsroll.tools.js](#7-jsrolltoolsjs)
8. [Таблицы кодов](#8-таблицы-кодов)

---

## 1. Обзор и подключение

jsroll — RIA/SPA javascript-фреймворк без внешних зависимостей (vanilla JS,
без React/Vue/jQuery). Библиотека расширяет `window` набором глобальных
функций/объектов и добавляет методы к встроенным прототипам (`Object`,
`String`, `Element`). Подключается одним `<script>`:

```html
<script src="build/jsroll.min.js" charset="UTF-8"></script>
<!-- при необходимости -->
<script src="build/jsroll.dao.min.js"></script>
<script src="build/jsroll.ui.grid.min.js"></script>
<script src="build/jsroll.tools.min.js"></script>
```

`build/jsroll.min.js` — это уже склеенные `jsroll.js` + `jsroll.ui.js`
(см. `src/build.jsroll.sh`). `jsroll.dao.js`, `jsroll.ui.grid.js` и
`jsroll.tools.js` собираются в отдельные `*.min.js` и являются
**опциональными надстройками**: `jsroll.dao.js` и `jsroll.ui.grid.js`
внутри себя проверяют `if (typeof ui === 'undefined') return false;`,
то есть требуют, чтобы `jsroll.min.js` (даёт `window.ui`) был подключён
раньше них.

Минимальный пример:

```html
<script src="jsroll.min.js"></script>
<script>
    document.querySelector('#target').innerHTML =
        tpl('Привет, {%= name %}!', { name: 'мир' });
</script>
```

---

## 2. Структура проекта и сборка

```
build/          Готовые минифицированные файлы (jsroll.min.js и др.) + *.sha384 (SRI-хэши)
src/            Исходники: jsroll.js, jsroll.ui.js, jsroll.dao.js, jsroll.ui.grid.js, jsroll.tools.js
                build.jsroll.sh, build.extra.sh — сборочные shell-скрипты (yuicompressor)
docs/           router.md, xhr.md, tmpl.md, event.md — актуализированная документация
examples/       Рабочие HTML-примеры: router, xhr, tmpl, event, download
composer.json   Метаданные пакета (используется как composer-репозиторий; JS-зависимостей нет)
post-install, post-update  Composer-хуки
```

Порядок зависимостей файлов: `jsroll.js` → `jsroll.ui.js` (только эти два
входят в `jsroll.min.js`) → `jsroll.dao.js` / `jsroll.ui.grid.js` (нужен
`window.ui` из `jsroll.ui.js`) → `jsroll.tools.js` (независим, не требует
ничего, кроме `window`).

---

## 3. jsroll.js — ядро

### 3.1 Утилиты общего назначения

| Функция | Сигнатура | Описание |
|---|---|---|
| `uuid()` | `(): string` | Генерирует UUID v4-подобную строку (128 бит). |
| `crc32(str)` | `(str: string): number` | Контрольная сумма CRC32 строки. |
| `base64(s)` | `(s: string \| HTMLElement): string` | Base64 (UTF-8-safe) строки или `innerHTML` элемента. |
| `crypt(salt, text)` | `(salt: string, text: string): string` | Простое XOR-шифрование в hex. **Не криптостойкое**, для обфускации/несекретных данных. |
| `decrypt(salt, encoded)` | `(salt: string, encoded: string): string` | Обратная операция к `crypt`. |
| `re(s, flags?)` | `(s: string \| RegExp, flags?: string): RegExp` | Строит `RegExp` из строки; понимает синтаксис `/pattern/flags`. |
| `str2json(s, def?)` | `(s: string \| any, def?: any): any` | Безопасный `JSON.parse` с фолбэком `def` при ошибке. |
| `obj2array(a)` | `(a: object \| arguments): any[]` | `arguments`/array-like → обычный массив. |
| `kv2array(o, glue?)` | `(o: object, glue?: string \| function): string[]` | `{a:1,b:2}` → `['a 1','b 2']` (или через свою функцию-склейку). |
| `coalesce(...)` | `(...args: any[]): any` | Первый непустой (`!== undefined`, `!== null`, `!== ''`) аргумент. |
| `quoter(v, opt?)` | `(v: any, opt?: int): string` | Экранирование/деэкранирование кавычек в HTML-сущности и обратно (флаги `quoter.CODE_QOUTAS` и т.д.). |
| `bundler(...)` | `(...args): any[]` | Отбрасывает `undefined/null/''` из списка аргументов. |
| `data_maker(o, f)` | `(o: object, f: string[]): object` | Выбирает из `o` только перечисленные в `f` ключи (недостающие → `null`). |
| `bitfields(status, d)` | `(status: number, d: any[]): any[]` | Разбирает битовую маску `status` на массив значений `d[i]`, чей бит установлен. |
| `datetimer(dt, option?)` | `(dt: string \| Date, option?: int): string \| any[] \| null` | Форматирует дату/время; флаги `DATE`, `TIME`, `DATETIME`, `SECOND`, `RAW` (массив компонентов), `COMPARE` (только дата, `Date`). |
| `localISOString(dt?, Z?)` | `(dt?: any, Z?: string): string` | ISO-строка в **локальном** времени пользователя (с учётом смещения таймзоны). |
| `utcISOString(dt?, Z?)` | `(dt?: any, Z?: string): string` | ISO-строка в UTC. |
| `is_empty(v)` | `(v: any): boolean` | `true` для `''`, `null`, `undefined`. |
| `importFromCSV(file, cb, d?)` | `(file: HTMLInputElement, cb: (rows: string[][]) => void, d?: string): void` | Читает `<input type="file">` (CSV) и отдаёт массив строк-массивов в `cb`. |
| `exportToCSV(filename, data, d?)` | `(filename: string, data: any[] \| HTMLTableElement, d?: string): void` | Экспортирует массив/HTML-таблицу в CSV и скачивает файл. |
| `exportHTML2Word(ctx, fileName)` | `(ctx: string \| HTMLElement, fileName: string): void` | Экспорт HTML в `.doc` (через MIME `application/vnd.ms-word`). |
| `exportHTML2Excel(ctx, fileName, worksheet?)` | `(ctx: string \| HTMLElement, fileName: string, worksheet?: string): void` | Экспорт HTML-таблицы в `.xls`. |
| `copy2prn(cntx, data?)` | `(cntx: string \| HTMLElement, data?: object): void` | Печать содержимого (или результата `tpl()`) через скрытый `<iframe>`. |
| `bb(blobParts, option?)` | `(blobParts: any, option?: object): Blob` | Кросс-браузерное создание `Blob`. |
| `dwnBlob(src, filename, type)` | `(src: any, filename: string, type: string): boolean` | Скачивание Blob как файла (через `<a download>` или `msSaveBlob`). |
| `download(button, url, opt?)` | `(button: HTMLElement, url: string, opt?: object): XMLHttpRequest` | Скачивание файла по URL с блокировкой кнопки (`disabled` + класс `spinner`) на время загрузки; имя файла берётся из `Content-Disposition` или `opt.filename`. |
| `upload(stream, url, opt)` | `(stream: HTMLInputElement, url: string, opt: object): void` | Постраничная (chunked) загрузка файла на сервер через `FormData`; `opt.sliceSize`, `opt.done`, `opt.fail`, `opt.progress(percent)`. |
| `func(str, context?, args?)` | `(str: string, context?: object, args?: any[]): any` | Компилирует функцию (или выполняет выражение через `eval`) из строки; используется, например, для атрибутов `formula=` в гриде. |
| `js(src, params?)` | `(src: string, params?: object): HTMLScriptElement` | Динамически подключает `<script>` (по URL или инлайн-код). |
| `dom(str, mime?)` | `(str: string, mime?: string): Document \| null` | Парсинг строки в DOM через `DOMParser`. |

Пример:

```js
var id = uuid();                       // "3fa2...-4b1c-..."
var s  = datetimer(new Date(), datetimer.DATETIME); // "14.08.2026 15:20"
var arr = obj2array(document.querySelectorAll('li')); // Array<HTMLLIElement>
var cfg = str2json(localStorage.getItem('cfg'), {});  // объект или {}
```

`Object.merge` используется практически во всех API как «глубокое
слияние с сохранением геттеров/сеттеров» — см. [3.12](#312-расширения-встроенных-объектов).

---

### 3.2 Работа со строкой запроса и URL

Все функции — методы `window.location`.

```js
/**
 * @function window.location.decoder
 * @param search { string } — строка вида "?a=1&b=2" (по умолчанию location.search)
 * @param regex { RegExp } — своё регулярное выражение разбора (опционально)
 * @returns { Object }
 */
location.decoder('?a=1&b=hi'); // { a: 1, b: 'hi' }  (числа автораспознаются через QueryParam)

/**
 * @function window.location.encoder
 * @param params { Object }
 * @param divider { string } — по умолчанию '&'
 * @returns { string }
 */
location.encoder({a: 1, b: 'hi'}); // "a=1&b=hi"

/**
 * @function window.location.update
 * Добавляет/обновляет параметры в уже существующем URL (сохраняя hash/prefix).
 * @param search { string | Object } — url либо сразу объект параметров
 * @param params { Object }
 * @returns { string }
 */
location.search = location.update({tab: 2});
urn.set(location.pathname + location.update({tab: 2}));

/**
 * @function window.location.params
 * @param id { string } — если указан, вернуть только этот параметр (или def)
 * @param def { * }
 * @returns { Object | * }
 */
location.params();       // весь объект параметров
location.params('tab');  // значение одного параметра, либо null
```

---

### 3.3 Маршрутизатор `window.urn`

> Внутри библиотеки уже создан **единственный** экземпляр `g.urn = urn('/')`.
> Функция-конструктор `urn(root)` наружу не экспортируется — второй свой
> роутер с другим `root` создать нельзя. Раньше в `docs/router.md`
> ошибочно описывался несуществующий `window.router` — актуальное имя
> объекта — `window.urn`.

Если браузер поддерживает `history.pushState` (сейчас — всегда), `urn`
меняет адрес по-настоящему (без `#`). Слежение за сменой адреса реализовано
через `setInterval` (30 мс), а не через `popstate`.

| Метод | Сигнатура | Описание |
|---|---|---|
| `urn.add(pattern?, handler)` | `(pattern?: RegExp, handler: (pathname: string, search: string, isInitial: boolean) => void): urn` | Регистрирует маршрут. Без `pattern` — обработчик «поймай всё» (маршруты сортируются от длинного шаблона к короткому, «поймай всё» проверяется последним). Возвращает `this` — можно вызывать цепочкой. |
| `urn.rm(handler)` | `(handler: function): urn` | Снимает ранее зарегистрированный обработчик. |
| `urn.chk()` | `(): urn` | Проверяет текущий адрес против всех маршрутов вручную (обычно вызывается один раз при загрузке страницы). |
| `urn.lsn()` | `(): urn` | Запускает отслеживание изменения адреса (`setInterval`, 30 мс). |
| `urn.set(path)` | `(path: string): urn` | Программный переход (`history.pushState`), сохраняет `urn.referrer`. |
| `urn.fr()` | `(): string` | Нормализованный текущий путь: всегда с ведущим `/` (для главной — `'/'`). |

```js
urn
    .add(/^\/users\/(\d+)$/, function () {
        var id = urn.fr().match(/^\/users\/(\d+)$/)[1];
        console.log('карточка пользователя', id);
    })
    .add(/^\/users$/, function () { console.log('список пользователей'); })
    .add(/^\/$/, function () { console.log('главная'); })
    .add(function () { console.log('404:', urn.fr()); }) // "поймай всё"
    .lsn();

urn.chk(); // обработать адрес, с которым страница была открыта

document.querySelector('[data-path]').ui.on('click', function () {
    urn.set(this.getAttribute('data-path'));
});
```

**Ограничение:** т.к. `root` жёстко зашит в `'/'`, `urn.set('users/42')`
всегда переходит на **абсолютный** `/users/42` от корня домена — подходит
для приложений, целиком отдаваемых с корня, но не для SPA во вложенной
директории.

---

### 3.4 `xhr()` — обёртка над XMLHttpRequest

> Объект — **функция** с одним аргументом-конфигом, а не цепочка вида
> `xhr.request().process().result()` (так ошибочно описывал старый
> `docs/xhr.md`).

```js
/**
 * @function xhr
 * @param opt { Object }
 *   method { string }            — по умолчанию 'GET'
 *   url { string }               — по умолчанию location.pathname
 *   data { Object | string }     — для GET/DELETE уйдёт в query string, для остальных — в тело
 *   rs { Object }                — доп. HTTP-заголовки (по умолчанию Content-type: application/x-www-form-urlencoded)
 *   withCredentials { boolean }  — по умолчанию true
 *   timeout { number }           — мс, по умолчанию 10000
 *   local { boolean }            — если true и navigator.onLine=false — запрос не отправляется, сразу cancel/after
 *   responseType { string }      — 'text' | 'arraybuffer' | 'blob' | 'document'
 *   before { (e) => boolean|undefined } — false отменяет отправку
 *   done { (e) => void }         — this === XMLHttpRequest
 *   fail { (e) => void }         — this === XMLHttpRequest
 *   cancel { (e) => void }       — при offline/abort
 *   process { (e) => void }      — свой onreadystatechange (переопределяет автопроверку статуса)
 *   after { (e, status) => void }— вызывается всегда после done/fail/cancel; status — один из xhr.DONE/FAIL/CANCEL
 * @returns { XMLHttpRequest }
 */
xhr({
    method: 'get',
    url: '/api/questions',
    done: function (e) {
        var res = this.responseJSON; // безопасный JSON.parse(responseText)
        console.log(res.data);
    },
    fail: function (e) {
        console.error(this.status, HTTP_RESPONSE_CODE[this.status]);
    }
});
```

Дополнительно:
- **`x.responseJSON`** — геттер, добавляемый к каждому запросу; при ошибке
  парсинга возвращает `{result:'error', message:'<код>: <текст>'}`.
- **Константы состояний**: `xhr.UNSENT=0`, `xhr.OPENED=1`,
  `xhr.HEADERS_RECEIVED=2`, `xhr.LOADING=3`, `xhr.DONE=4`, `xhr.FAIL=5`,
  `xhr.CANCEL=6`.
- Таблица кодов ответа — глобальная `HTTP_RESPONSE_CODE` (см. [раздел 8](#8-таблицы-кодов)).

---

### 3.5 `tpl()` — шаблонизатор

```js
/**
 * @function window.tpl
 * @param id { string }        DOM id элемента с шаблоном (или "#id"), URL ресурса, либо сам текст шаблона
 * @param data { Object | function } данные для подстановки
 * @param cb { function | HTMLElement | HTMLElement[] } режим вывода результата (см. ниже)
 * @param opt { Object }       { before, after, rs, ... } — доп. настройки (before/after — хуки, rs — заголовки запроса, если id это URL)
 * @returns { string | Document | undefined } — String, если cb не указан и id не URL; XMLHttpRequest, если id — URL и cb не функция (синхронный режим); undefined, если cb — функция (результат уходит в cb)
 */
```

Синтаксис шаблона: теги `{% код %}` (выполняется как JS) и
`{%= выражение %}` (значение подставляется в вывод **без экранирования
HTML** — экранировать пользовательский ввод нужно самостоятельно).
Поддерживается и альтернативный синтаксис `<% %>` / `<%= %>`, если в
шаблоне не найдено ни одного `{% %}`.

Три источника `id`:

1. **DOM-элемент** (`id` — простой идентификатор без спецсимволов,
   опционально с `#`): содержимое `<script type="text/x-template" id="...">`
   компилируется и кэшируется в `sessionStorage`.
2. **URL** (строка похожа на путь/адрес): шаблон загружается через `xhr()`;
   если `cb` — функция, запрос асинхронный, иначе синхронный.
3. **Инлайн-строка**: любой другой текст компилируется «как есть», без кэша.

```js
// 1) DOM id, синхронно, результат — строка
document.querySelector('.box').innerHTML = tpl('welcome', {
    caption: 'Заголовок', text: 'Текст'
});

// 2) Шаблон прямо строкой
var html = tpl('Привет, {%= name %}!', { name: 'Ирина' });

// 3) Шаблон с URL, асинхронно, callback получает готовый HTML
tpl('/js/welcome.tpl', { caption: 'jsroll', text: 'SPA framework' },
    function (content) { document.querySelector('.box').innerHTML = content; });

// 4) cb = DOM-элемент — результат сразу вставляется в innerHTML этого элемента
tpl('faq-list', { items: [...] }, document.querySelector('#list'));

// 5) cb = массив DOM-элементов — шаблон применяется к каждому по очереди
//    (data может быть функцией: data(el, index, array) => объект для этого элемента)
tpl('row-tpl', function (el, i, a) { return { index: i }; }, [...rowsNodeList]);
```

Циклы/условия — обычный JS внутри `{% %}`:

```html
<script type="text/x-template" id="faq-list">
    <ul class="list-group">
    {% for (var i = 0; i < items.length; i++) { %}
        <li class="list-group-item{% if (items[i].answered) { %} list-group-item-success{% } %}">
            <strong>{%= items[i].question %}</strong>
        </li>
    {% } %}
    </ul>
</script>
```

---

### 3.6 `dom()` — парсинг строки в DOM

```js
/**
 * @function window.dom
 * @param d { string } исходная строка
 * @param mime { string } — 'text/html' | 'text/xml' | 'application/xml' | 'image/svg+xml' (по умолчанию 'text/xml')
 * @returns { Document | null }
 */
var doc = dom('<p>привет</p>', 'text/html');
```

Используется внутри `ui.dom()`/`ui.up()` (см. [4.4](#44-ui--обёртка-над-dom-элементом)).

---

### 3.7 `func()` / `js()` — динамический код

```js
/**
 * @function window.func
 * @param str { string } строка с function(...){...} либо произвольное JS-выражение
 * @param context { Object } контекст выполнения (this)
 * @param args { any[] } аргументы
 * @returns { * }
 */
var fn = func('function (a,b) { return a+b; }');
fn(2,3); // 5

/**
 * @function window.js — динамическая загрузка <script>
 * @param src { string } URL или инлайн-код
 * @param params { Object } { container, async, type, id, onload, onreadystatechange }
 * @returns { HTMLScriptElement }
 */
js('/vendor/lib.js', { async: true, onload: function () { console.log('loaded'); } });
```

---

### 3.8 WebSocket-обёртка `ws`

```js
/**
 * @class ws
 * @param url { string }
 * @param opt { Object } { protocol, binaryType, reconnect, reconnectTimeout, error, open, message, close }
 */
var socket = new ws('wss://example.com/feed', {
    reconnect: true,
    reconnectTimeout: 2000,
    open: function (e) { console.log('connected'); },
    message: function (e) { console.log('data', e.data); },
    close: function (e) { console.log('closed'); }
});
socket.up();                 // открыть соединение (создаёт native WebSocket)
socket.send({type: 'ping'}); // сериализует объект в JSON автоматически
socket.close(1000, 'bye');
socket.readyState;           // ws.CONNECTING(0) | ws.OPEN(1) | ws.CLOSING(2) | ws.CLOSED(3)
```

Коды закрытия соединения — таблица `WEBSOCKET_RESPONSE_CODE` (см. [раздел 8](#8-таблицы-кодов)).

---

### 3.9 IndexedDB: `IDB`, `IDBFilter`

```js
/**
 * @class IDB
 * @param name { string }
 * @param version { int }
 * @param opt { Object }
 */
var db = new IDB('AppDB', 1);
db.bind(IDBmodel('users', 'id', function schema(idb, tx) {
    // вызывается на onupgradeneeded — создание store
}, function launch(idb, tx) {
    // вызывается на onsuccess — БД готова
}));
db.connect();
```

| Метод/свойство `IDB.prototype` | Описание |
|---|---|
| `connect()` | Открывает соединение (`indexedDB.open`), ждёт, пока все дочерние модели зарегистрированы (`heirs`). |
| `destroy()` | Удаляет базу данных (`indexedDB.deleteDatabase`). |
| `bind(model)` | Присоединяет `IDBmodel` к базе (дочерний объект, см. `Object.createChild`). |
| `close()` | Закрывает соединение. |
| `get active` | `true`, если БД полностью инициализирована. |
| `onready(fn, args?)` | Выполняет `fn` сразу, если БД готова, либо ставит в очередь до готовности. |
| `db` / `tx` | Геттеры: нативные `IDBDatabase` / текущая `IDBTransaction`. |

Константы состояния: `IDB.READY=0`, `IDB.INITIALIZING=1`, `IDB.BUILD=2`,
`IDB.LAUNCH=4`, `IDB.PROCESS=8`.

```js
/**
 * @class IDBFilter — курсорный постраничный фильтр для IDBmodel.filter()
 * @param limit { int } — 0 = без лимита (IDBFilter.LIMITLESS)
 * @param condition { function } — своя обработка курсора (по умолчанию — просто накопление в chunk)
 * @param args { any[] }
 */
var f = new IDBFilter(50);
usersModel.filter(f, { done: function (e) { console.log(e.result); } });
f.next();   // следующая страница (offset автоматически продолжается)
f.reset();  // сброс к началу
```

`IDBFilter.only(array)` / `IDBFilter.bound(array)` — помечают массив как
диапазон для `IDBKeyRange.only`/`.bound` внутри `IDBmodel.keyRange()`.

---

### 3.10 webSQL: `webSQL`, `dbf`

Обёртка над (устаревшим, но местами ещё используемым) Web SQL API.

```js
/**
 * @constructor webSQL
 * @param opt { Object } { name, version, displayName, estimatedSize }
 */
var sql = new webSQL({ name: 'DB', version: '1.0', estimatedSize: 200000 });

sql.stmt('SELECT * FROM users WHERE id=?', [1],
    function (tx, rs) { console.log(rs.rows[0]); },
    function (tx, err) { console.error(err.message); });

sql.insert('users', { name: 'Иван', age: 30 }, function (tx, rs) { }, null);
sql.update('users', { name: 'Пётр' }, { id: 1 }, function (tx, rs) { });
sql.filter('SELECT * FROM users WHERE id = :id', { id: 1 }, function (tx, rs) { });
```

| Метод | Сигнатура | Описание |
|---|---|---|
| `stmt(query, data, done, fail, bulk?)` | — | Низкоуровневое выполнение SQL с параметрами (bulk — массив наборов данных). |
| `filter(query, params, done, fail)` | — | Подставляет именованные параметры `:name` в запрос через `filtration()` и выполняет. |
| `insert(table, params, done, fail, option?)` | — | `option`: `webSQL.DEFAULT`(0) \| `webSQL.BULK`(1) \| `webSQL.UPSERT`(2, `INSERT OR REPLACE`). |
| `update(table, params, filter, done, fail)` | — | `filter` — строка-условие, массив ключей (взятых из `params`) или объект `{ключ: значение}`. |
| `transaction(proc, fail)` | — | Обёртка `webSQLinstance.transaction()` с внутренней очередью (`turn`/`runnig`). |
| `changeVersion(cur, new, cb)` | — | Смена версии БД. |
| `get info` | — | Логирует список таблиц и их DDL в консоль. |

`dbf(webSQLinstance, opt)` — упрощённый фасад с методом `.filter(query, params, opt)`,
вызывающим `opt.done`/`opt.fail`/`opt.after`.

`QueryParam(v, opt)` — центральная функция экранирования значений для SQL/строк
(флаги `QueryParam.NATIVE`, `.QOUTED`, `.STRNULL`, `.INTQOUTED`, `.NULLSTR`, `.NULLSQL`).

---

### 3.11 Экспорт/импорт данных, печать, файлы

```js
// CSV → массив массивов строк
importFromCSV(document.querySelector('#csvFile'), function (rows) {
    console.log(rows); // [['a','b'], ['1','2'], ...]
});

// Массив/таблица → скачивание CSV
exportToCSV('report.csv', [['Имя','Возраст'], ['Иван','30']]);
exportToCSV('report.csv', document.querySelector('table'));

// HTML → .doc / .xls
exportHTML2Word(document.querySelector('#report'), 'отчёт.doc');
exportHTML2Excel(document.querySelector('#report table'), 'отчёт.xls', 'Лист1');

// Печать через скрытый iframe (можно передать шаблон tpl вместо готового HTML)
copy2prn('print-tpl', { title: 'Накладная №1' });

// Скачивание по URL с индикацией на кнопке
download(buttonEl, '/api/export.xlsx', {
    filename: 'export.xlsx',
    done: function () { console.log('готово'); }
});

// Постраничная загрузка на сервер
upload(document.querySelector('#file'), '/api/upload', {
    sliceSize: 65536,
    progress: function (percent) { console.log(percent + '%'); },
    done: function () { console.log('загружено'); },
    fail: function () { console.error('ошибка'); },
    stop: function () { return true; } // условие продолжения загрузки очередного куска
});
```

---

### 3.12 Расширения встроенных объектов

| Расширение | Описание |
|---|---|
| `Object.prototype.merge(...)` | Глубокое слияние объектов **с сохранением геттеров/сеттеров** (в отличие от `Object.assign`, копирует дескрипторы свойств через `Object.getOwnPropertyDescriptor`). Для массивов — конкатенация с заменой `undefined` на `null`. Используется практически везде вместо `Object.assign`. |
| `Object.prototype.createChild(owner, ClassOrObject?)` | Создаёт «дочерний» объект, динамически связанный с `owner` через прототипную цепочку (изменения `owner` видны потомку) и регистрирует его в `owner.heirs`. Основа связи `IDB` ↔ `IDBmodel`. |
| `String.prototype.hash()` | 32-битный хэш строки (используется, например, для кэш-ключей `tpl()` по URL). |
| `JSON.serialize(o, opt?, c?)` / `JSON.unserialize(s, opt?, c?)` | Сериализация объекта с префиксом имени класса (`"ClassName:{...}"`), опционально в base64 (`JSON.BASE64`). |
| `Element.prototype.matches` | Полифилл (для очень старых браузеров). |

---

## 4. jsroll.ui.js — UI-слой

### 4.1 `storage()`

```js
/**
 * @function window.storage
 * @param instance? — не используется как параметр вызова напрямую в билде; фабрика вызывается как storage()
 * @returns { Storage-like }
 */
var ls = storage(); // localStorage, либо in-memory fallback при QUOTA_EXCEEDED_ERR
ls.setItem('user', JSON.stringify({id:1}));
ls.getItem('user');
ls.removeItem('user');
ls.clear();
```

### 4.2 `Application` / `window.app`

`Application` — класс жизненного цикла SPA-приложения (обработка
online/offline, resize, beforeunload, версии, кастомные события). **Важно:**
в самой библиотеке `new Application()` нигде не вызывается и `window.app`
не создаётся автоматически — приложение должно само сделать
`window.app = new Application(ver)`, если хочет пользоваться этим
жизненным циклом.

```js
window.app = new Application('1.0.3');

app.onready(function () { console.log('DOM готов'); });
app.online = function () { console.log('онлайн'); };
app.offline = function () { console.log('оффлайн'); };
app.ondestroy(function () { console.log('перед закрытием/навигацией'); });

app.setCookie('theme', 'dark', 30);
app.getCookie('theme');
app.clearCookie('theme');
```

Ключевые методы/свойства:

| Член | Описание |
|---|---|
| `run(e)` | Обработчик `load`/`pageshow`; проверяет `navigator.onLine` и вызывает `online()`/`offline()`. |
| `onready(fn, args?)` | Отложенный вызов `fn` после `DOMContentLoaded`. |
| `changeVersion(fn, args?)` | Регистрирует колбэк, вызываемый при смене `app.version`. |
| `ondestroy(fn, arg?)` | Регистрирует колбэк перед выгрузкой страницы (`pagehide`/`unload`); также вызывает `navigator.sendBeacon('/logout', ...)`. |
| `serialize()` | Сохраняет в `localStorage` все свойства `Application`, начинающиеся с `$`. |
| `confirmReload` / `reload(e)` | Управление диалогом подтверждения ухода со страницы. |
| `setCookie/getCookie/clearCookie` | Cookie в base64, `SameSite=Lax`. |
| `addEventListener/removeEventListener/dispatchEvent/eventListener` | Собственная шина кастомных событий (`EventTarget`), с автоочисткой отписавшихся узлов. |

### 4.3 `css` — работа с классами и стилями

Доступен как `window.css` (глобальный, привязан к `window`) и как
`el.css` — на любом элементе, обёрнутом через `ui` (см. далее).

```js
el.css.add('active hidden');      // строка через пробел/запятую или массив
el.css.del('active');             // удалить один или несколько классов
el.css.tgl('active');             // toggle
el.css.has('active');             // ['active'] | null
el.css.style('color', 'red');     // el.style.color = 'red'
el.css.replace(/foo/, 'bar');     // замена в className
```

### 4.4 `ui` — обёртка над DOM-элементом

Любой `HTMLElement`, для которого хоть раз запросили `.ui`, получает
неизменяемые свойства `el.ui` и `el.css` (`Object.defineProperty`,
`writable:false`). Глобальный `window.ui` — обёртка над `document`.

```js
document.querySelector('#btn').ui.on('click', function (e) { ... });
```

| Метод `ui.*` | Сигнатура | Описание |
|---|---|---|
| `el(selector, fn?, args?)` | `(s: string \| Element, fn?, args?): Element \| null` | Аналог `querySelector`/`getElementById`, сразу оборачивает найденный элемент. |
| `els(selector, fn?, args?)` | `(s: string \| string[], fn?, args?): Element[]` | Аналог `querySelectorAll` (поддерживает несколько селекторов через запятую), каждый элемент оборачивается. |
| `attr(name?, value?)` | см. ниже | Универсальный геттер/сеттер атрибутов. |
| `tpl(str, data, cb?, opt?)` | — | То же, что `window.tpl()`, но результат сразу пишется в `innerHTML` текущего(-их) элемента(-ов). |
| `merge(...)` | — | Вызывает `Object.merge` на самом DOM-узле (расширение произвольными свойствами). |
| `src(e, def?)` | `(e: Event, def?): Element` | Возвращает (и оборачивает) реальный элемент-источник события (`e.target`/`e.srcElement`). |
| `de(event, opt?)` | `(event: string, opt?: object): void` | Диспатчит `CustomEvent`. |
| `on(event, fn, args?, opt?)` | `(event: string, fn: function, args?: any[], opt?: AddEventListenerOptions): Element` | Подписка. `event` может содержать несколько типов через запятую и опциональный CSS-фильтр `'селектор\|событие'`. Поддерживает синтетическое событие `'dbltap'` (двойной тап для тач-устройств). |
| `dg(selector, event, fn, args?, opt?)` | — | Делегированная подписка на контейнере: работает и для элементов, добавленных позже. |
| `off(event, fn, opt?)` | — | Отписка. |
| `matches(selector)` | `(s: string): Element[] \| false` | Проверка соответствия селектору (для массива элементов — фильтрация). |
| `dom(str, mime?)` | — | Парсит строку в DOM и оборачивает результат. |
| `up(str, mime?)` | `(str: string, mime?: string): Element` | Парсит строку и **добавляет** узлы в текущий элемент (`appendChild`). |
| `rm(selector?)` | `(s?: string): Element` | Удаляет элемент(ы) — себя, либо найденные по селектору внутри себя. |
| `focus(selector?)` | — | Устанавливает фокус (с `setTimeout(…,1)` для надёжности после рендера). |
| `set inner = value` | сеттер | `el.ui.inner = 'html'` — то же, что `innerHTML =`, но поддерживает вставку готового `HTMLElement`, и массив значений при `this.instance` — массиве элементов. |
| `get active` | геттер | `true`, если элемент — `document.activeElement`. |

```js
// attr(): 4 режима работы
el.ui.attr();                 // -> {} все атрибуты как хэш {name: value}
el.ui.attr('data-id');        // -> значение одного атрибута (авто QueryParam-типизация)
el.ui.attr('data-*');         // -> {id: ..., name: ...} все атрибуты по маске data-*
el.ui.attr({id: 1, foo: 'x'});// -> установить сразу несколько атрибутов
el.ui.attr('title', 'Текст'); // -> установить один атрибут
el.ui.attr('title', null);    // -> удалить атрибут
```

Дополнительные глобальные хелперы этого слоя:

```js
eventCode(e);                 // нормализованный код клавиши/ввода (e.key/e.keyCode/e.data)
InputHTMLElementValue(el);    // текущее значение INPUT/SELECT/TEXTAREA с учётом checkbox/radio/type="hidden"+@-выражения
selected;                     // window.selected — текст текущего выделения (getter)
emptySelection();             // сбросить выделение текста на странице
g.ce                          // CustomEvent (полифилл при необходимости)
```

---

### 4.5 Формы: `group`, `crud`, `dataObject`

`group` — обёртка над набором полей формы (или самой `<form>`), даёт
единый `data`-объект, валидацию, отслеживание изменений и отправку.

```js
/**
 * @class group
 * @param els { string | HTMLFormElement | Element[] } селектор полей, форма целиком, либо массив элементов
 * @param opt { Object } { method, url, done, fail, keyup, submit, crud, change, event }
 */
var f = new group('#user-form', {
    crud: g.group_xhr_opt,          // готовый набор XHR-колбэков "как есть"
    done: function (e) { console.log('сохранено'); },
    fail: function (e) { console.log('ошибка'); }
});

f.data;                 // -> Object с текущими значениями всех полей (учитывает name="a[b][c]")
f.data = { name: 'Иван' }; // -> проставляет значения в поля
f.valid;                // -> boolean, попутно расставляет .status = 'error'/'success' на полях
f.isChanged;            // -> true, если данные отличаются от последнего hashing()
f.reset();              // -> сброс к data-default атрибутам
f.byId('email');        // -> элемент(ы) по name или id
f.querySelector('.required'); // -> элемент(ы) по CSS-селектору среди полей группы
f.store(f.data);        // -> отправка через this.opt.crud
```

`group.prototype.data` умеет собирать вложенные структуры из `name`
вида `"user[address][city]"`, включая массивы чекбоксов (`pack`-атрибут —
битовая маска).

`crud(api, meta)` — простая CRUD-обёртка:

```js
/**
 * @class crud
 * @param api { function | Object } — xhr-функция или объект с методами post/put/get/del
 * @param meta { Object } — "пустая" модель записи (шаблон для .item())
 */
var users = new crud(xhr, { id: null, name: '' });
users.data = [...];       // задать текущий набор строк (мержится с meta)
users.item(0);            // -> строка по индексу, либо клон meta, если нет
users.post(newRow, { url: '/api/users' });
users.put(row, { url: '/api/users/1' });
users.get(null, { url: '/api/users' });
users.del(null, { url: '/api/users/1' });
```

`g.group_xhr_opt` — готовый набор `{method:'post', url:location.pathname,
before, after, done, fail, close, crud}` для передачи в `group`/`crud` «как
есть», без переопределения.

`dataObject()` — фабрика воркера для локальной (in-memory) имитации
CRUD-хранилища (`opt.method` = get/post/put/del над массивом `opt.rows`),
полезно для офлайн-заглушек/тестов UI без реального бэкенда.

---

### 4.6 Валидация: `isvalid`, `input_validator`, `pattern_validator`

```js
isvalid(inputEl);              // boolean — HTML5 validity + required + [pattern]-атрибут + свой validator
input_validator(inputEl);      // то же + визуально проставляет el.status = error/warn/success/none
pattern_validator.call(formOrEl, 'input, select, textarea'); // навешивает live-валидацию на 'input'-событие
```

`UIElementDecorator(el)` добавляет элементу геттер/сеттер `status`,
который переключает CSS-классы `is-invalid/is-warn/is-valid/is-spinner` на
самом поле и `has-danger/has-warn/has-success/has-spinner` на его
родителе (Bootstrap-совместимая разметка валидации).

Свой валидатор задаётся атрибутом `validator="функция-код"` или свойством
`element.validator = function(passed) { return ...; }`.

---

### 4.7 Готовые UI-хелперы: `tabpanel`, `paginator`, `typeahead`, `maskedigits`

```js
/**
 * @function tabpanel
 * @param tabs { Element[] }
 * @param panels { Element[] }
 * @param fn { function } — если задан, вызывается вместо возврата nav
 * @param cb { function } — вызывается для каждой вкладки при инициализации
 * @param active { function } — колбэк при переключении (index, event)
 * @returns { Object } nav — { show(index), hide(), current, tab, panel }
 */
var nav = tabpanel(tabsEls, panelsEls);
nav.show(0);

/**
 * @function paginator
 * Отрисовывает постраничную навигацию через шаблон 'paginator-box'
 * @param pg { {count:number, page:number} }
 * @param model { string } — имя модели (для data-атрибутов пагинации)
 * @param limit { number } — размер страницы, по умолчанию 10
 */
this.paginator({count: 132, page: 2}, 'users', 20);

/**
 * @function maskedigits — маска ввода по шаблону placeholder (например "__.__.____")
 * @param element { HTMLInputElement | HTMLInputElement[] }
 * @param pattern { string } — не используется напрямую, маска берётся из atr placeholder
 * @param cleared { boolean } — не оставлять символы маски ("_") при пустом значении
 */
maskedigits(document.querySelector('#phone'));
```

```html
<input id="phone" placeholder="+7 (___) ___-__-__">
```

`typeahead(element, opt)` — автокомплит для `<input>` с задержкой
(`delta`, по умолчанию 250 мс) и кэшированием ответов сервера по ключу
ввода.

---

## 5. jsroll.dao.js — модели данных

### 5.1 `IDBmodel`

Фабрика модели для одного или нескольких object store-ов IndexedDB.
Присоединяется к `IDB` через `db.bind(IDBmodel(...))`.

```js
/**
 * @function IDBmodel
 * @param tables { string | string[] } — имя(имена) store
 * @param primaryKey { string | null } — ключевое поле (включает autoIncrement)
 * @param schema { function(db, tx) } — создание store/индексов (onupgradeneeded)
 * @param launch { function(db, tx) } — вызывается когда БД готова
 * @param opt { Object } — доп. свойства/методы модели
 * @returns { Object } модель со всеми методами ниже
 */
var UserModel = IDBmodel('users', 'id',
    function schema(db) {
        if (!db.objectStoreNames.contains('users')) {
            var store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            store.createIndex('by_email', 'email', { unique: true });
        }
    },
    null
);
db.bind(UserModel);
```

| Метод | Сигнатура | Описание |
|---|---|---|
| `get(idx, opt?)` | `(idx: any \| any[], opt?): void` | Получить по ключу/массиву ключей. Результат в `opt.done({result: [...]})` или `store.oncomplete`. |
| `getAll(opt?, idx?)` | `(opt?: {index?, keyRange?, count?, done?}, idx?: any[]): void` | Получить все записи (опц. фильтр по массиву значений первичного ключа `idx`). |
| `add(data, opt?)` | `(data: object \| object[], opt?): void` | Добавить одну/несколько записей (`store.add`). |
| `put(data, opt?)` | `(data: object \| object[], opt?): void` | Вставить/обновить (`store.put`, требует `primaryKey`). |
| `del(idx, opt?)` | `(idx: any \| any[], opt?): void` | Удалить по ключу/ключам. |
| `truncate(opt?)` | — | Очистить store целиком. |
| `count(opt?)` | — | Количество записей (с учётом `opt.keyRange`). |
| `filter(mng, opt?)` | `(mng: IDBFilter, opt?): void` | Постраничный обход через курсор с `IDBFilter`. |
| `paginator(page, limit, opt?)` | `(page: number, limit: number, opt?): void` | Возвращает `{result, count, page, limit}` через `opt.done`. |
| `keyRange(args, id?)` | `(args, id?): IDBKeyRange` | Строит `IDBKeyRange.only/.bound` из массива/объекта. |
| `scope(opt, idx?)` | — | Каскадная выборка связанных записей по цепочке индексов. |
| `yie1d(opt, fn, idx?)` | — | Построчная (ленивая) обработка результата колбэком `fn` (обратите внимание — имя с опечаткой `yie1d`, не `yield`, т.к. это зарезервированное слово). |
| `bind(model)` (у `IDB`) | — | Присоединяет модель к базе. |

Все асинхронные методы принимают опциональные `opt.success` (на каждую
запись) и завершаются через `opt.done`/`store.oncomplete`. Ошибки — через
`opt.fail`/`this.fail`. Очередь операций сериализуется через геттер/сеттер
`processing` (одна IndexedDB-операция за раз на модель).

Константы стадий (для `store()`/логов): `IDBmodel.GET`, `.GETALL`, `.ADD`,
`.PUT`, `.UPSERT`, `.DEL`, `.INDEX`, `.TRUNCATE`, `.COUNT`, `.PAGINATOR`,
`.FILTER`.

```js
UserModel.add({ email: 'a@b.com', name: 'Иван' }, {
    success: function (e) { console.log('id=', e.target.result); },
    done: function (e) { console.log('добавлено', e.result); }
});
UserModel.getAll({}, function () {}); // все записи
UserModel.get(1, { done: function (e) { console.log(e.result[0]); } });
UserModel.del(1);
```

### 5.2 `webSQLmodel`

Модель поверх `webSQL` с поддержкой постраничной синхронизации с сервером.

```js
/**
 * @constructor webSQLmodel
 * @param webSQLinstance { webSQL }
 * @param opt { Object } — modelName, tableName, primaryKey, DDL, requestLimit, ...
 */
var Users = new webSQLmodel(sql, {
    modelName: 'Users', tableName: 'users', primaryKey: 'id',
    DDL: 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)'
});
Users.init();                    // выполнить DDL
Users.populate({ url: '/api/users/sync', limit: 100 }); // затянуть данные с сервера постранично (BULK|UPSERT insert)
Users.unload('SELECT * FROM users', 'SELECT COUNT(*) as count FROM users', { url: '/chunking', method: 'PUT' }); // выгрузить локальные данные на сервер порциями
```

| Метод | Описание |
|---|---|
| `init(query?, ver?)` | Выполняет `DDL` (или свой `query`), опционально меняет версию БД. |
| `populate(option)` | Постранично скачивает данные с сервера (`option.url`) и делает `BULK\|UPSERT`-вставку локально; продолжает, пока не догонит `count` с сервера или не упрётся в `requestLimit`. |
| `unload(query, countQuery, option)` | Постранично выгружает результат `query` на сервер (`option.method`, по умолчанию `PUT`). |
| `done(tx, rs)` / `fail(tx, e)` | Дефолтные обработчики (логирование), переопределяются через `opt`. |

---

## 6. jsroll.ui.grid.js — таблицы/спредшиты

### 6.1 `Cursor`

Управление кареткой/выделением внутри `contenteditable`-ячеек таблицы.

```js
var cursor = new Cursor();
cursor.at(cellEl);      // поставить курсор в начало ячейки, включить contenteditable
cursor.editable = true; // геттер/сеттер режима редактирования (класс 'active' + contentEditable)
cursor.left(el, e);     // true, если можно двигаться влево (иначе preventDefault)
cursor.right(el, e);
cursor.toEnd(el);       // курсор в конец содержимого
```

### 6.2 `grid()` — редактируемая таблица с формулами

Превращает обычную `<table>` в интерактивный «мини-Excel»: навигация
стрелками между ячейками, редактирование по двойному клику,
формулы (`formula`-атрибут ячейки, вычисляются через `func()`/`eval` с
доступом к `table.cell(row, col)`), добавление/удаление строк и столбцов.

```js
/**
 * @function grid
 * @param table { HTMLTableElement }
 * @returns { HTMLTableElement } та же таблица, дополненная методами ниже
 */
var t = grid(document.querySelector('#sheet'));
t.controlled(); // включить режим добавления/удаления строк/столбцов по dblclick на первой колонке/строке

t.cell(0, 1);            // ячейка [ряд 0, колонка 1] как DOM-элемент
t.cell(0, 1, true);      // то же, но как строковое содержимое (через QueryParam)
t.row.insert(['a','b']); // вставить строку из массива значений
t.row.add(0);            // добавить строку после индекса 0 (с кнопками управления)
t.row.del(0);
t.col.add(1);
t.col.del(1);
```

Формулы задаются атрибутом `formula` на `<td>`, внутри которого доступен
контекст `table` и функция `cell(row, col)` (регистрирует зависимость —
при изменении ячейки-источника связанная формула пересчитывается
автоматически через `depend`/`refless`):

```html
<td formula="Number(cell(0,1)) + Number(cell(0,2))"></td>
```

Управление с клавиатуры внутри `<tbody> <td>` (кроме первой колонки):
`ArrowUp/Down/Left/Right` — перемещение фокуса, `Enter` — переход на
строку ниже.

### 6.3 `journal()` — раскрывающийся «журнальный» реестр

Похож на `grid()`, но заточен под раскрывающиеся строки-заголовки
(`<tbody caption>`): двойной клик по строке-заголовку раскрывает/сворачивает
вложенные строки (загружаемые лениво через `sheet.update`).

```js
/**
 * @function journal
 * @param table { HTMLTableElement }
 * @param sheet { Object } — { update(headerRow, table, tbody), cellEvent: { focus, blur, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter } }
 * @param esli { * } — зарезервировано (не используется в текущей реализации тела функции)
 * @returns { HTMLTableElement }
 */
var t = journal(document.querySelector('#journal'), {
    update: function (headerRow, table, tbody) {
        xhr({ url: '/api/details?parent=' + headerRow.ui.attr('id'), done: function (e) {
            this.responseJSON.data.forEach(function (row, i) {
                table.row.add(headerRow.rowIndex, {}, row);
            });
        }});
    },
    cellEvent: {
        Enter: function (cell, next) { if (next) next.cells[cell.cellIndex].focus(); }
    }
});
```

`table.row.add(index, opt, tuple, s)` — вставляет строку после `index`
с настраиваемыми `row_attr`/`cell_attr`/`populate`/`events`-колбэками
(`opt`), заполняя ячейки данными из `tuple` (массив значений в порядке
колонок).

---

## 7. jsroll.tools.js

```js
/**
 * @object window.tool
 */
tool.ping('example.com'); // логирует в консоль время отклика хоста (через подгрузку 1x1 картинки), таймаут 1500мс
```

Единственный метод — `ping(host)`, полезен для быстрой диагностики
доступности хоста без CORS-проблем (не XHR, а `Image()`).

---

## 8. Таблицы кодов

### `HTTP_RESPONSE_CODE`
Стандартные HTTP-коды (100–505) плюс два внутренних:
`0` — «Request runtime error / address unreachable»,
`10` — «Application offline» (используется `xhr()` при `opt.local` и
`navigator.onLine === false`).

### `WEBSOCKET_RESPONSE_CODE`
Стандартные коды закрытия WebSocket: `1000`(normal closure) … `1015`(CERT_AUTHORITY_INVALID).

### `QueryParam` — флаги
`NATIVE=0`, `QOUTED=1`, `STRNULL=2`, `INTQOUTED=4`, `NULLSTR=8`, `NULLSQL=16`
(комбинируются побитовым ИЛИ).

### `quoter` — флаги
`CODE_QOUTAS=1`, `CODE_QOUTAS2=2`, `SLASHES_QOUTAS=4`, `SLASHES_CODE=8`, `QOUTAS_CODE=16`.

### `datetimer` — флаги
`DATE=1`, `TIME=2`, `DATETIME=3` (`DATE|TIME`), `SECOND=8`, `RAW=16`, `COMPARE=32`.

### `webSQL` — флаги insert
`BULK=1`, `UPSERT=2`, `DEFAULT=0`.

---

## Известные особенности и осторожности (важно при интеграции)

- **`window.urn`** — единственный экземпляр с `root='/'`; второй роутер с
  другим корнем создать нельзя (конструктор не экспортирован).
- **`tpl()` `{%= %}`** не экранирует HTML — экранирование пользовательских
  данных на совести вызывающего кода.
- **`Application`** не инстанцируется автоматически — без явного
  `window.app = new Application()` часть кода (например, `Initializer`,
  который по умолчанию целится в `app`) не заработает.
- В `jsroll.dao.js` встречается опечатка в имени метода — `yie1d` вместо
  `yield` (зарезервированное слово JS), это не баг, а вынужденное
  наименование.
- `crypt`/`decrypt` — простое XOR-кодирование, не криптостойкий алгоритм;
  не использовать для защиты чувствительных данных.
- `jsroll.dao.js` и `jsroll.ui.grid.js` требуют, чтобы `window.ui` (из
  `jsroll.ui.js`, часть `jsroll.min.js`) уже существовал на момент их
  подключения.
