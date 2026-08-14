# AI_CONTEXT.md — контекст для AI-агентов по проекту jsroll

Этот файл — компактная справка для быстрого анализа проекта AI-агентом
(code assistant, ревьюер, генератор кода на базе фреймворка). Полная
документация с примерами — в `jsroll-documentation.md` рядом с этим файлом.

## Что это за проект

`jsroll` — легковесный (без зависимостей) vanilla-JS фреймворк для
RIA/SPA-приложений (роутинг, XHR, шаблонизатор, работа с формами, offline
DAO поверх IndexedDB/WebSQL, UI-таблицы-спредшиты). Библиотека не
использует модули (ES modules / CommonJS) — весь код вешает глобальные
переменные на `window` и патчит встроенные прототипы (`Object`, `String`,
`Element`). Стиль кода — ES5, IIFE, `'use strict'`.

- Версия: `2.1.2b`
- Лицензия: BSD-3-Clause
- Composer-имя пакета: `bermud-ru/jsroll`
- Автор: Андрей Новиков

## Структура репозитория

```
jsroll-master/
├── src/                     исходники (редактировать только здесь)
│   ├── jsroll.js            ядро: xhr, tpl, urn (роутер), IDB, webSQL, ws, утилиты
│   ├── jsroll.ui.js         Application, css, ui (DOM-обёртка), group/crud (формы), валидация
│   ├── jsroll.dao.js        IDBmodel, webSQLmodel — офлайн-модели данных (нужен jsroll.ui.js)
│   ├── jsroll.ui.grid.js    grid(), journal() — редактируемые HTML-таблицы (нужен jsroll.ui.js)
│   ├── jsroll.tools.js      tool.ping() — единственная утилита, не имеет зависимостей
│   ├── build.jsroll.sh      сборка jsroll.js+jsroll.ui.js -> build/jsroll.min.js (yuicompressor)
│   └── build.extra.sh       сборка dao/ui.grid/tools по отдельности
├── build/                   готовые *.min.js + *.sha384 (SRI-хэши для <script integrity="...">)
├── docs/                    router.md, xhr.md, tmpl.md, event.md — актуальные, проверены по коду
├── examples/                рабочие демо: router, xhr, tmpl, event, download (+ index.html — навигация)
├── composer.json            метаданные (composer используется только как менеджер веб-пакета, не как JS-зависимости)
├── post-install / post-update  composer-хуки
└── README.md                краткий обзор + composer-сниппет
```

## Порядок и граф зависимостей подключения `<script>`

```
jsroll.js  ──┐
             ├─▶ (склеены в build/jsroll.min.js) ──▶ даёт window.ui, window.xhr, window.tpl, window.urn, ...
jsroll.ui.js─┘
                     │
                     ├─▶ jsroll.dao.js       (требует window.ui; иначе no-op: `if (typeof ui==='undefined') return false`)
                     └─▶ jsroll.ui.grid.js   (требует window.ui; та же проверка)

jsroll.tools.js — независим, ничего не требует, может подключаться в любом порядке
```

Практическое правило для агента, генерирующего HTML-страницу с jsroll:
подключать `jsroll.min.js` (или `jsroll.js`+`jsroll.ui.js` в dev-режиме)
**первым**, всё остальное — после.

## Карта глобальных символов (публичный API)

### Ядро (`jsroll.js`)
| Символ | Тип | Назначение |
|---|---|---|
| `xhr(opt)` | function | HTTP-запросы (обёртка XMLHttpRequest) |
| `tpl(id, data, cb?, opt?)` | function | шаблонизатор (JS-теги `{% %}` / `{%= %}`) |
| `urn` | singleton object | роутер (History API), единственный инстанс с `root='/'` |
| `dom(str, mime?)` | function | строка → `Document` |
| `func(str, ctx?, args?)` | function | код-строка → функция/результат |
| `js(src, params?)` | function | динамическая загрузка `<script>` |
| `ws` | class | обёртка над `WebSocket` (авто-реконнект) |
| `IDB` | class | подключение к IndexedDB |
| `IDBFilter` | class | курсорный постраничный фильтр для `IDBmodel.filter()` |
| `webSQL` | class | обёртка над Web SQL |
| `dbf(instance, opt)` | function | упрощённый фасад над `webSQL` |
| `QueryParam(v, opt)` | function | типизация/экранирование значения (SQL/строки) |
| `HTTP_RESPONSE_CODE` | object | таблица HTTP-кодов |
| `WEBSOCKET_RESPONSE_CODE` | object | таблица кодов закрытия WS |
| `uuid()`, `crc32()`, `base64()`, `crypt()/decrypt()` | function | утилиты |
| `re()`, `str2json()`, `obj2array()`, `kv2array()`, `coalesce()`, `quoter()`, `bundler()`, `data_maker()`, `bitfields()` | function | утилиты общего назначения |
| `datetimer()`, `localISOString()`, `utcISOString()` | function | форматирование даты/времени |
| `importFromCSV()`, `exportToCSV()`, `exportHTML2Word()`, `exportHTML2Excel()`, `copy2prn()` | function | экспорт/импорт/печать |
| `bb()`, `dwnBlob()`, `download()`, `upload()` | function | Blob/файлы |
| `location.decoder/encoder/update/params` | function (patched) | работа с query string |
| `Object.prototype.merge`, `Object.prototype.createChild`, `String.prototype.hash` | proto-ext | расширения встроенных типов |

### UI-слой (`jsroll.ui.js`)
| Символ | Тип | Назначение |
|---|---|---|
| `storage()` | function | localStorage с in-memory fallback |
| `Application` | class | жизненный цикл SPA (**не инстанцируется автоматически** — нужно `window.app = new Application()`) |
| `css` (`window.css`, `el.css`) | class | классы/инлайн-стили элемента |
| `ui` (`window.ui`, `el.ui`) | class | обёртка над DOM: `.on/.dg/.off/.el/.els/.attr/.tpl/.dom/.up/.rm/.focus/.src/.de/.merge/.matches` |
| `eventCode(e)` | function | нормализация кода клавиши |
| `group` | class | форма как единый объект данных + валидация + отправка |
| `crud` | class | простой CRUD-фасад над `xhr`/своим API |
| `dataObject()` | function | in-memory имитация CRUD (для тестов/офлайн-заглушек) |
| `group_xhr_opt` | object | готовый набор xhr-колбэков для `group`/`crud` |
| `isvalid()`, `input_validator()`, `pattern_validator()`, `UIElementDecorator()` | function | валидация форм |
| `tabpanel()`, `paginator()`, `typeahead()`, `maskedigits()` | function | готовые UI-виджеты |

### DAO (`jsroll.dao.js`, опционально)
| Символ | Тип | Назначение |
|---|---|---|
| `IDBmodel(tables, primaryKey, schema, launch, opt?)` | factory | офлайн-модель поверх одного/нескольких IndexedDB store |
| `webSQLmodel` | class | модель поверх `webSQL` с постраничной синхронизацией с сервером (`populate`/`unload`) |

### Grid (`jsroll.ui.grid.js`, опционально)
| Символ | Тип | Назначение |
|---|---|---|
| `Cursor` | class | управление кареткой в `contenteditable`-ячейках |
| `grid(table)` | function | превращает `<table>` в редактируемый спредшит с формулами |
| `journal(table, sheet)` | function | «журнальная» таблица с раскрывающимися заголовками строк |

### Tools (`jsroll.tools.js`, опционально)
| Символ | Тип | Назначение |
|---|---|---|
| `tool.ping(host)` | method | пинг хоста через `Image()`, без XHR/CORS |

## Соглашения и паттерны кода, важные для генерации/ревью

1. **Единый DOM-враппер.** Любой элемент, к которому обратились через
   `.ui` или `.css` в первый раз, получает эти свойства навсегда
   (`Object.defineProperty(..., {writable:false})`). Не пытаться
   переопределить `el.ui`/`el.css` вручную.
2. **`Object.merge` вместо `Object.assign`** почти везде, где нужно
   слияние с сохранением геттеров/сеттеров (например, `IDBmodel`,
   `Application`, `group.opt`). При генерации кода в стиле jsroll
   предпочитать `Object.merge`.
2b. Стандартный паттерн опций: функция принимает `opt`-объект с
   колбэками `before/done/fail/after`, где `after` вызывается **всегда**
   (успех/ошибка/отмена) — как в `xhr()`, `group_xhr_opt`, `dataObject()`.
3. **Роутинг** — единственный `window.urn`, `root` жёстко `'/'`.
   Нельзя создать второй роутер с другим корнем (конструктор `urn(root)`
   не экспортирован). Для приложения, размещённого не в корне домена,
   `urn` неудобен — учитывать это при подсказках/код-ревью.
4. **`tpl()` не экранирует `{%= %}`.** При генерации шаблонов,
   принимающих пользовательский ввод, агент должен либо сам
   HTML-экранировать данные перед передачей в `tpl()`, либо явно
   предупредить пользователя об XSS-риске.
5. **`Application` не создаётся фреймворком сама.** Если сгенерированный
   код опирается на `window.app` (`Initializer`, `app.onready`, куки-хелперы
   и т.п.), нужно явно создать `window.app = new Application(version)` в
   точке входа приложения.
6. **`jsroll.dao.js`/`jsroll.ui.grid.js` — silent no-op без `jsroll.ui.js`.**
   Оба файла завершаются рано (`return false`) без ошибки, если
   `window.ui` ещё не определён — типичная причина «тихого» бага
   «функция вроде подключена, а ничего не происходит».
7. **Именование `yie1d`** в `jsroll.dao.js` (`IDBmodel.yie1d`) — не
   опечатка для исправления, а вынужденная замена зарезервированного
   слова `yield`. Не переименовывать при рефакторинге без понимания
   обратной совместимости.
8. **Нет модульной системы.** При добавлении нового кода в проект — тот
   же стиль: `(function (g, ui, undefined) { 'use strict'; ... }(window,
   window.ui));`, экспорт через `g.<name> = ...`.
9. **Сборка.** Изменения вносятся только в `src/*.js`; `build/*.min.js`
   генерируются скриптами `src/build.jsroll.sh` / `src/build.extra.sh`
   (используют `yuicompressor-2.4.8.jar`, которого нет в архиве — сборка
   локально потребует отдельной установки этого jar). При правках не
   редактировать `build/*.min.js` напрямую — это сгенерированные файлы,
   идентичность с `src/*.js` подтверждается `*.sha384`.
10. **Криптография.** `crypt()/decrypt()` — учебное/обфускационное
    XOR-кодирование, не пригодно для защиты данных — не предлагать его
    как решение для паролей/токенов.

## Быстрые ответы на типичные вопросы агента

- **«Как сделать AJAX-запрос?»** → `xhr({method, url, data, done, fail})`,
  см. `docs/xhr.md`, раздел 3.4 полной документации.
- **«Как подключить шаблон?»** → `tpl(id|url|string, data, cb?)`,
  `docs/tmpl.md`, раздел 3.5.
- **«Как навесить обработчик клика?»** → `el.ui.on('click', fn)` или
  делегированно `container.ui.dg('.selector', 'click', fn)`,
  `docs/event.md`, раздел 4.4.
- **«Как сделать маршрутизацию?»** → `urn.add(regex, handler).lsn()`,
  `urn.chk()` на старте, `docs/router.md`, раздел 3.3.
- **«Как работать офлайн с данными?»** → `IDB` + `IDBmodel` (IndexedDB)
  или `webSQL` + `webSQLmodel` (устаревающий Web SQL), раздел 5.
- **«Как собрать форму в объект и отправить?»** → `new group(selector,
  {crud: group_xhr_opt})`, `.data`, `.valid`, `.store()`, раздел 4.5.
- **«Как сделать редактируемую таблицу/мини-Excel?»** → `grid(tableEl)`,
  раздел 6.2.

## Ограничения этого контекста

- Файл описывает **API поверхность** и структуру, не воспроизводит
  реализацию — для правок логики нужно читать конкретный `src/*.js`.
- Старые файлы в `docs/*.md`, если они снова разойдутся с кодом после
  дальнейших правок, не должны считаться источником истины — сверяться
  с исходниками в `src/`.
