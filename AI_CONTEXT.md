# AI_CONTEXT.md — контекст для AI-агентов по проекту jsroll

Компактная справка для быстрого анализа проекта AI-агентом (code
assistant, ревьюер, генератор кода на базе фреймворка). Полная
документация по темам — в `docs/*.md`, по функциям/классам — в тексте
ниже и в комментариях самих `src/*.js`.

## Что это за проект

`jsroll` — легковесный (без зависимостей) vanilla-JS фреймворк для
RIA/SPA-приложений: роутинг, XHR/REST, шаблонизатор, формы+валидация,
офлайн-хранилища (IndexedDB/Web SQL), редактируемые таблицы, жизненный
цикл приложения, а также два добавленных в этой сессии направления —
биометрическая аутентификация (WebAuthn) и векторная/растровая графика
для дашбордов. Библиотека не использует модули (ES modules/CommonJS) —
весь код вешает глобальные переменные на `window` и патчит встроенные
прототипы (`Object`, `String`, `Element`). Стиль кода — ES5, IIFE,
`'use strict'`.

- Версия ядра: `2.1.2b`
- Лицензия: BSD-3-Clause
- Composer-имя пакета: `bermud-ru/jsroll`

## Структура репозитория

```
jsroll-master/
├── src/                     исходники (редактировать только здесь)
│   ├── jsroll.js            ядро: xhr, tpl, urn (роутер), IDB, webSQL, ws, утилиты
│   ├── jsroll.ui.js         Application, css, ui (DOM-обёртка), group/crud (формы), валидация
│   ├── jsroll.dao.js        IDBmodel, webSQLmodel — офлайн-модели данных (нужен jsroll.ui.js)
│   ├── jsroll.ui.grid.js    grid(), journal() — редактируемые HTML-таблицы (нужен jsroll.ui.js)
│   ├── jsroll.svg.js        SvgCanvas — SVG-примитивы для графиков/диаграмм (нужен jsroll.ui.js)
│   ├── jsroll.image.js      RasterCanvas — то же на <canvas>, вывод в <img> (нужен jsroll.ui.js)
│   ├── jsroll.auth.js       WebAuthn — биометрическая аутентификация (нужен jsroll.ui.js)
│   ├── jsroll.tools.js      tool.ping() — единственная утилита без зависимостей
│   ├── build.jsroll.sh      сборка jsroll.js+jsroll.ui.js -> build/jsroll.min.js
│   └── build.extra.sh       сборка остальных модулей по отдельности + заголовок + *.sha384
├── build/                   готовые *.min.js (каждый с заголовком-инфоблоком) + список в src/*.sha384
├── docs/                    router.md, xhr.md, tmpl.md, event.md, svg.md, image.md, auth.md
├── examples/                рабочие демо (см. таблицу ниже) + index.html — навигация по всем
├── composer.json            метаданные (composer — только как менеджер веб-пакета)
├── AI_CONTEXT.md            этот файл
└── README.md                обзор + инструкция по подключению/сборке
```

## Порядок и граф зависимостей подключения `<script>`

```
jsroll.js  ──┐
             ├─▶ (склеены в build/jsroll.min.js) ──▶ даёт window.ui, window.xhr, window.tpl, window.urn, ...
jsroll.ui.js─┘
                     │
                     ├─▶ jsroll.dao.js        (требует window.ui; иначе no-op: `if (typeof ui==='undefined') return false`)
                     ├─▶ jsroll.ui.grid.js    (та же проверка)
                     ├─▶ jsroll.svg.js        (та же проверка)
                     ├─▶ jsroll.image.js      (та же проверка)
                     └─▶ jsroll.auth.js       (та же проверка)

jsroll.tools.js — независим, ничего не требует, может подключаться в любом порядке
```

Правило для агента, генерирующего HTML-страницу с jsroll: `jsroll.min.js`
(или `jsroll.js`+`jsroll.ui.js` в dev-режиме) подключать **первым**, всё
остальное — после. Модули с зависимостью от `window.ui`, подключённые до
`jsroll.ui.js`, молча ничего не делают (`return false`) — без ошибки, но
и без эффекта; частая причина «тихого» бага «подключил, а не работает».

## Карта глобальных символов (публичный API)

### Ядро (`jsroll.js`)
| Символ | Тип | Назначение |
|---|---|---|
| `xhr(opt)` | function | HTTP/REST-запросы (обёртка XMLHttpRequest); реально шлёт ЛЮБОЙ метод (PUT/PATCH/DELETE), не только GET/POST |
| `tpl(id, data, cb?)` | function | шаблонизатор (JS-теги `{% %}` / `{%= %}`) |
| `urn` | singleton object | роутер (History API), единственный инстанс с `root='/'` |
| `dom()`, `func()`, `js()` | function | строка→DOM, строка→функция, динамическая загрузка `<script>` |
| `ws` | class | обёртка над `WebSocket` (авто-реконнект) |
| `IDB`, `IDBFilter` | class | IndexedDB: подключение к базе, курсорный постраничный фильтр |
| `webSQL`, `dbf`, `QueryParam()` | class/function | Web SQL (устарел, см. предупреждение ниже) |
| `HTTP_RESPONSE_CODE`, `WEBSOCKET_RESPONSE_CODE` | object | таблицы кодов |
| `uuid()`, `crc32()`, `base64()`, `datetimer()`, `str2json()` и др. | function | утилиты общего назначения |
| `importFromCSV()`, `exportToCSV()`, `exportHTML2Word()`, `exportHTML2Excel()` | function | экспорт/импорт |
| `bb()`, `dwnBlob()`, `download()`, `upload()` | function | Blob/файлы |
| `location.decoder/encoder/update/params` | function (patched) | query string |
| `Object.prototype.merge`, `Object.prototype.createChild`, `String.prototype.hash` | proto-ext | расширения встроенных типов |

### UI-слой (`jsroll.ui.js`)
| Символ | Тип | Назначение |
|---|---|---|
| `storage()` | function | localStorage с in-memory fallback |
| `Application` | class | жизненный цикл SPA (**не инстанцируется автоматически** — нужно `window.app = new Application()`) |
| `ui` (`window.ui`, `el.ui`), `css` (`window.css`, `el.css`) | class | DOM-обёртка: `.on/.dg/.off/.el/.els/.attr/.tpl/.dom/.up/.rm/.focus` и классы/стили |
| `group`, `crud`, `dataObject()` | class/function | форма как единый объект данных (`form.data`), CRUD-фасад |
| `isvalid()`, `input_validator()`, `pattern_validator()` | function | валидация форм |
| `tabpanel()`, `paginator()`, `typeahead()`, `maskedigits()` | function | готовые UI-виджеты (вкладки, пагинация, автокомплит, маска ввода) |

### DAO (`jsroll.dao.js`, опционально)
| Символ | Тип | Назначение |
|---|---|---|
| `IDBmodel(tables, primaryKey, schema, launch?, opt?)` | factory | офлайн-модель поверх одного/нескольких IndexedDB store |
| `webSQLmodel` | class | модель поверх `webSQL`: DDL (`init()`) + постраничная синхронизация с сервером (`populate()`/`unload()`) |

### Grid (`jsroll.ui.grid.js`, опционально)
| Символ | Тип | Назначение |
|---|---|---|
| `Cursor` | class | управление кареткой в `contenteditable`-ячейках |
| `grid(table)` | function | превращает `<table>` в редактируемый спредшит с формулами |
| `journal(table, sheet)` | function | «журнальная» таблица с раскрывающимися заголовками строк |

### SVG-графика (`jsroll.svg.js`, опционально) — см. `docs/svg.md`
| Символ | Тип | Назначение |
|---|---|---|
| `new SvgCanvas(target, opt)` | class | контейнер `<svg>` + методы создания фигур |
| `canvas.line/circle/ellipse/rect/polyline/polygon/path/text/group(attrs)` | method | создание SVG-примитива |
| `canvas.arc({cx,cy,r,startAngle,endAngle})` | method | сектор окружности как `<path>` — для круговых диаграмм |
| `el.svg.attr/style/animate/rm/addClass/removeClass/on/off/trigger` | property | управление созданным узлом (аналог `.ui`/`.css`); `on/off/trigger` — подписка/генерация пользовательских событий, всплывают до канвы |
| `canvas.on/off/trigger` | method | то же самое на уровне всей канвы — удобно для развязки «источник данных» / «отрисовка» |
| `svgEasing.linear/easeIn/easeOut/easeInOut` | object | функции плавности для `.animate()` |

### Растровая графика (`jsroll.image.js`, опционально) — см. `docs/image.md`
| Символ | Тип | Назначение |
|---|---|---|
| `new RasterCanvas(target, opt)` | class | контейнер `<canvas>` + методы создания фигур (тот же набор, что у `SvgCanvas`) |
| `canvas.toImage(imgEl?)` | method | снимок канвы как настоящий `<img>` |
| `shape.raster.attr/style/animate/rm/on/off/trigger` | property | управление фигурой (`shape.raster === shape`); `.animate()` умеет и массивы точек, не только числа; `on/off/trigger` — свой мини-эмиттер (не DOM, без всплытия) |
| `canvas.on/off/trigger` | method | пользовательские события на уровне канвы — настоящие нативные (canvas.el — реальный `<canvas>`) |
| `imageEasing.linear/easeIn/easeOut/easeInOut` | object | функции плавности |

### Биометрия (`jsroll.auth.js`, опционально) — см. `docs/auth.md`
| Символ | Тип | Назначение |
|---|---|---|
| `new WebAuthn(opt)` | class | обёртка над WebAuthn: `register()`, `authenticate()`, локальный реестр устройства, шина событий как у `Application` |
| `bufferToBase64url()`, `base64urlToBuffer()` | function | конвертация `ArrayBuffer` ⇄ строка (для пересылки credential на сервер) |

### Tools (`jsroll.tools.js`, опционально)
| Символ | Тип | Назначение |
|---|---|---|
| `tool.ping(host)` | method | пинг хоста через `Image()`, без XHR/CORS |

## Примеры (`examples/`)

| Папка | Демонстрирует |
|---|---|
| `router/`, `xhr/`, `tmpl/`, `event/`, `download/` | базовые темы из `docs/*.md` |
| `application/` | `Application`: вход/выход через кастомные события, куки-сессия, вкладки синхронные с URL (`urn`), dropdown-меню, `changeVersion`, `confirmReload` |
| `forms/` | `group`/`crud`/`pattern_validator`/`typeahead`/`maskedigits`: заполнение/чтение JSON, вложенные и `pack`-чекбоксы, REST-методы форм, `group()` на части полей |
| `grid/` | `jsroll.ui.grid.js`: формулы, клавиатурная навигация, добавление/удаление строк и столбцов, экспорт CSV/Excel |
| `richeditor/` | WYSIWYG на `contenteditable`+`execCommand`, экспорт в `.txt`/Word (`exportHTML2Word`) |
| `idb/` | `IDB`/`IDBmodel`: инициализация, схема, заполнение, все таблицы, фильтр по индексу |
| `websql/` | то же на `webSQL`/`webSQLmodel` (устаревший API, см. предупреждение ниже) |
| `webauthn/` | `jsroll.auth.js`: регистрация/вход по биометрии, discoverable credentials, локальный реестр |
| `svg/`, `image/` | `jsroll.svg.js`/`jsroll.image.js`: живой график, круговая диаграмма, «паутинка» (radar chart) |

## Соглашения и паттерны кода, важные для генерации/ревью

1. **Единый DOM-враппер.** `.ui`/`.css` появляются на элементе только
   через `ui.wrap()`, вызываемый неявно `ui.el(sel)`/`ui.els(sel)` (или
   `.ui.el(...)` на уже обёрнутом элементе). **`document.querySelector(sel).ui`
   всегда `undefined`** — это не гипотетический краевой случай, а реальный
   баг, который несколько раз ловился именно в этом проекте (в исходных
   `docs/event.md`/`docs/xhr.md` и примерах `examples/event/`, `examples/xhr/`
   до правки). При генерации/ревью кода на jsroll — всегда `ui.el(...)`,
   никогда «голый» `document.querySelector(...).ui`.
2. **`Object.merge` вместо `Object.assign`** почти везде, где нужно
   слияние с сохранением геттеров/сеттеров.
3. **Стандартный паттерн опций**: `{before, done, fail, after}`-колбэки
   (`xhr()`, `group_xhr_opt`, `dataObject()`), где `after` вызывается
   **всегда** (успех/ошибка/отмена).
4. **⚠ Внутри `xhr()`-колбэков `this` — НЕ `XMLHttpRequest`.**
   `opt.done(e)`/`opt.fail(e)`/`opt.after(e, status)` вызываются как
   обычные функции (`opt.done(e)`, без `.call(x, e)`) — `this` внутри них
   — `window` (нестрогий режим) или `undefined` (strict). Сам запрос —
   через `ui.src(e)`/`e.target`: `ui.src(e).responseJSON`, `ui.src(e).status`.
   Ранее это было задокументировано неверно (см. фикс в `docs/xhr.md`) и
   реально ломало код, написанный по старой документации.
5. **Роутинг** — единственный `window.urn`, `root` жёстко `'/'`; второй
   роутер с другим корнем создать нельзя.
6. **`tpl()` `{%= %}` не экранирует HTML** — экранирование пользовательских
   данных на совести вызывающего кода.
7. **`Application` не создаётся фреймворком сама** — нужен явный
   `window.app = new Application(version)`.
8. **Делегирование `.ui.dg()` не сработает, если целевой элемент уже
   останавливает всплытие** (`e.stopPropagation()`) в своём собственном
   обработчике того же события — так устроены `focusin`/`focusout` на
   ячейках `grid()` (`jsroll.ui.grid.js`). В таких случаях обработчик
   вешают напрямую на каждый нужный элемент, не на общий контейнер.
9. **`form.data` асимметричен.** Геттер собирает `name="a[b]"` во
   вложенный объект `{a:{b:...}}`; сеттер (`form.data = {...}`) такой
   сборки не делает — ключи объекта должны буквально совпадать со строкой
   `name`, то есть `{'a[b]': ...}`, а не `{a:{b:...}}`.
10. **Чекбоксы одной группы (`name` совпадает у нескольких `<input
    type="checkbox">`)**: без атрибута `pack` — обычный массив выбранных
    значений; с `pack="1"` (непустое значение! голый `pack` без `="..."`
    даёт `getAttribute('pack')===''`, что ложно) — битовая маска в одно
    число (`value` каждого чекбокса — степень двойки).
11. **`str2json(s, def)` возвращает `def` только при ОШИБКЕ парсинга.**
    Для отсутствующего в `localStorage` ключа `getItem()` вернёт `null`, а
    `JSON.parse(null)` парсится БЕЗ ошибки в `null` (не `def`!). Проверено
    на практике (ловилось и в `Application`, и в собственном
    `jsroll.auth.js` при разработке) — если нужен гарантированный дефолт,
    добавляйте `str2json(s, def) || def`.
12. **IndexedDB, читающие операции модели (`get/getAll/count/filter/paginator`)**:
    внутри `IDB.prototype.store()` для `readonly`-доступа объект хранилища
    открывается как `tx.objectStore($.tables)` — передаётся МАССИВ имён
    таблиц модели, а не строка. Для одно-табличных моделей (обычный
    случай) в реальном браузере это работает благодаря неявному
    `Array→String` приведению аргумента (WebIDL `ToString`), но для модели
    на нескольких таблицах (`IDBmodel(['a','b'], …)`) чтение сломается —
    строка получится `"a,b"`, чего ни одно хранилище не называется.
13. **`webSQL.prototype.opt` по умолчанию без `QueryParam.QOUTED`** —
    именованные параметры в `sql.filter(query, {name: 'строка'}, ...)`
    подставляются БЕЗ кавычек (`WHERE x = строка`, не `WHERE x = 'строка'`)
    и ломают SQL для строковых значений. Нужно один раз выставить
    `sqlInstance.opt |= QueryParam.QOUTED;` после создания `webSQL`.
14. **`webSQLmodel.init(query, ver)` не принимает callback завершения** —
    только `query`/`ver`. Чтобы узнать о завершении DDL, переопределяйте
    `model.done`/`model.fail` (методы прототипа) на конкретном экземпляре
    ДО вызова `init()`.
15. **Web SQL полностью удалён из всех современных браузеров** (Chrome —
    с версии 124/апрель 2024, Safari — ещё в 2019, Firefox никогда не
    поддерживал) — `webSQL`/`webSQLmodel` в `jsroll.dao.js` оставлены
    только для чтения/поддержки legacy-кода; для новых проектов —
    `IDB`/`IDBmodel`.
16. **Именование `yie1d`** в `jsroll.dao.js` (`IDBmodel.yie1d`) — не
    опечатка для исправления, а вынужденная замена зарезервированного
    слова `yield`.
17. **`crypt`/`decrypt`** — простое XOR-кодирование, не криптостойкий
    алгоритм; не использовать для защиты чувствительных данных.
18. **Нет модульной системы.** Новый код — тот же стиль: `(function (g,
    ui, undefined) { 'use strict'; if (typeof ui === 'undefined') return
    false; ... }(window, window.ui));`, экспорт через `g.<name> = ...`.

## Быстрые ответы на типичные вопросы агента

- **«Как сделать AJAX/REST-запрос?»** → `xhr({method, url, data, done, fail})`
  — метод может быть любым (`'put'`, `'delete'`, ...), не только GET/POST;
  внутри `done`/`fail` доступ к запросу — через `ui.src(e)`, не `this`.
  `docs/xhr.md`.
- **«Как подключить шаблон?»** → `tpl(id|url|string, data, cb?)`. `docs/tmpl.md`.
- **«Как навесить обработчик клика?»** → `ui.el(sel).ui.on('click', fn)`
  (не `document.querySelector(sel).ui...`). `docs/event.md`.
- **«Как сделать маршрутизацию?»** → `urn.add(regex, handler).chk().lsn()`. `docs/router.md`.
- **«Как работать офлайн с данными?»** → `IDB`+`IDBmodel` (актуально) или
  `webSQL`+`webSQLmodel` (устарел, для legacy). `examples/idb/`, `examples/websql/`.
- **«Как собрать форму в объект и отправить, в т.ч. методом PUT/PATCH?»**
  → `new group(formEl, {crud: group_xhr_opt})`, `.data`, `.valid`,
  `<form method="put">` — реально отправится как PUT. `examples/forms/`.
- **«Как сделать редактируемую таблицу/мини-Excel?»** → `grid(tableEl)`. `examples/grid/`.
- **«Как нарисовать график/диаграмму?»** → `jsroll.svg.js` (вектор) или
  `jsroll.image.js` (растр, плюс возможность получить `<img>`). `docs/svg.md`, `docs/image.md`.
- **«Как сделать вход по отпечатку пальца/Face ID?»** → `jsroll.auth.js`,
  `new WebAuthn(opt)`, `.register()`/`.authenticate()`. `docs/auth.md`.

## Ограничения этого контекста

- Файл описывает API-поверхность и структуру, не воспроизводит
  реализацию — для правок логики нужно читать конкретный `src/*.js`.
- Пункты 1–17 в разделе «Соглашения» — не гипотезы, а вещи, пойманные
  эмпирически (через тестирование в jsdom + моки недостающих браузерных
  API — IndexedDB через `fake-indexeddb`, Web SQL через npm-пакет
  `websql`, WebAuthn через ручные моки `navigator.credentials`) при
  разработке модулей и примеров в этом репозитории. Если код при
  дальнейших правках разойдётся с этими пунктами — доверяйте исходникам
  в `src/`, а не этому файлу или `docs/*.md`.
