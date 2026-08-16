# jsroll — RIA (Rich Internet Application) / SPA (Single-page Application) javascript framework

Лёгкий (без внешних зависимостей) vanilla-JS фреймворк для одностраничных
приложений: маршрутизация, AJAX/REST, шаблонизатор, работа с формами и
валидацией, офлайн-хранилища (IndexedDB / Web SQL), таблицы-спредшиты,
жизненный цикл приложения, а сверх этого — биометрическая аутентификация
и векторная/растровая графика для дашбордов.

> Часть этого README и `docs/*.md` в разное время расходилась с реальным
> кодом (упоминала объекты/сигнатуры, которых в библиотеке никогда не
> было, или которые с тех пор изменились). Ниже — версия, сверенная
> непосредственно с исходниками в `src/` и подтверждённая рабочими
> примерами в `examples/`.

## Структура проекта

```
build/          готовые *.min.js + *.sha384 (SRI-хэши для <script integrity="...">)
docs/           документация по отдельным частям API (см. таблицу ниже)
examples/       рабочие HTML-примеры на каждую тему — открывайте examples/index.html
src/            исходники + build.jsroll.sh/build.extra.sh (сборочные скрипты)
composer.json   метаданные пакета (composer используется как менеджер веб-пакета, не для PHP-зависимостей)
AI_CONTEXT.md   компактный технический контекст для AI-агентов/код-ассистентов
```

## Подключение

Ядро (`jsroll.js` + `jsroll.ui.js`) собрано в один файл:

```html
<script src="build/jsroll.min.js" charset="UTF-8"></script>
```

Остальное — необязательные надстройки, каждая в своём `<script>` (и
требует, чтобы `jsroll.min.js` был подключён раньше, поскольку опираются
на `window.ui`):

```html
<script src="build/jsroll.min.js" charset="UTF-8"></script>
<script src="build/jsroll.dao.min.js" charset="UTF-8"></script>      <!-- IndexedDB / Web SQL -->
<script src="build/jsroll.ui.grid.min.js" charset="UTF-8"></script>  <!-- редактируемые таблицы -->
<script src="build/jsroll.svg.min.js" charset="UTF-8"></script>      <!-- SVG-графика -->
<script src="build/jsroll.image.min.js" charset="UTF-8"></script>    <!-- canvas-графика -->
<script src="build/jsroll.auth.min.js" charset="UTF-8"></script>     <!-- WebAuthn -->
<script src="build/jsroll.tools.min.js" charset="UTF-8"></script>    <!-- независим от остального -->
```

## Что есть в библиотеке

### Ядро (`jsroll.js` + `jsroll.ui.js`, входят в `jsroll.min.js`)

| Объект / функция | Что делает | Документация |
|---|---|---|
| `window.urn` | Маршрутизатор (History API): `urn.add(pattern, handler).chk().lsn()`, `urn.set(path)`. Не `window.router` — так называлась несуществующая версия в старой документации. | [`docs/router.md`](docs/router.md) |
| `el.ui.on(...)` / `el.ui.dg(...)` | Подписка на события (прямая/делегированная). Не `window.event` — такого объекта в библиотеке нет. | [`docs/event.md`](docs/event.md) |
| `xhr(opt)` | AJAX/REST-запросы поверх `XMLHttpRequest`, с полноценной поддержкой любых HTTP-методов (не только GET/POST — см. пример форм). | [`docs/xhr.md`](docs/xhr.md) |
| `tpl(id, data, cb?)` | Шаблонизатор (`{% %}`/`{%= %}`), источник — DOM-элемент, URL или строка. | [`docs/tmpl.md`](docs/tmpl.md) |
| `ui.el(sel)` / `ui.els(sel)` | Поиск + «оборачивание» DOM-элементов — только так у элемента появляются `.ui`/`.css`. `document.querySelector(...).ui` **не работает** (см. `docs/event.md`). | — |
| `Application` | Жизненный цикл SPA: `onready`, куки, кастомные события (`addEventListener`/`dispatchEvent`), `confirmReload`, `changeVersion`. Не создаётся автоматически — `window.app = new Application(...)`. | пример: `examples/application/` |
| `group` / `crud` | Форма как единый объект данных: `form.data` (геттер/сеттер), валидация, отправка. Работает и на части полей, не только на весь `<form>`. | пример: `examples/forms/` |
| `typeahead(el, opt)` / `maskedigits(el, pattern, cleared)` | Автокомплит и маскированный ввод (только цифры, маска любая). | пример: `examples/forms/` |
| `storage()` | `localStorage` с in-memory fallback при `QUOTA_EXCEEDED_ERR`. Вызывается как функция: `storage().setItem(...)`, не `storage.setItem(...)`. | — |
| `location.params()/decoder()/encoder()/update()` | Разбор и сборка query-строки. | — |
| `uuid()`, `datetimer()`, `QueryParam()`, экспорт в CSV/Word/Excel и др. | Набор утилит общего назначения. | — |

### Необязательные модули

| Модуль | Что добавляет | Документация | Пример |
|---|---|---|---|
| `jsroll.dao.js` | `IDBmodel` (IndexedDB) и `webSQLmodel` (Web SQL, **устарел и удалён из всех современных браузеров** — оставлен для legacy-кода) — офлайн-модели данных. | — | `examples/idb/`, `examples/websql/` |
| `jsroll.ui.grid.js` | `grid()`/`journal()` — редактируемые HTML-таблицы с формулами, клавиатурной навигацией, добавлением/удалением строк и столбцов. | — | `examples/grid/` |
| `jsroll.svg.js` | Создание/удаление/анимация SVG-примитивов (линии, круги, дуги, многоугольники — для графиков и диаграмм). | [`docs/svg.md`](docs/svg.md) | `examples/svg/` |
| `jsroll.image.js` | То же самое на `<canvas>`, с выводом в настоящий `<img>` (`canvas.toImage()`). | [`docs/image.md`](docs/image.md) | `examples/image/` |
| `jsroll.auth.js` | Биометрическая аутентификация (Touch ID/Face ID/Windows Hello) через WebAuthn — без паролей. | [`docs/auth.md`](docs/auth.md) | `examples/webauthn/` |
| `jsroll.tools.js` | `tool.ping(host)` — быстрая проверка доступности хоста. Единственный модуль без зависимости от `jsroll.ui.js`. | — | — |

## Примеры

Полный список рабочих примеров — `examples/index.html`. Каждый пример —
самостоятельная HTML-страница, которую можно открыть прямо в браузере.

## Установка через composer

```json
{
    "repositories": [
    {
	"url": "git@github.com:bermud-ru/jsroll.git",
	"type": "git"
    }
    ],
    "require": {
	"bermud-ru/jsroll":"*@dev"
    },

    "scripts": {
	"post-install-cmd": [
	"./vendor/bermud-ru/jsroll/post-install"
	],
	"post-update-cmd": [
	"./vendor/bermud-ru/jsroll/post-update"
	]
    }
}
```

Composer здесь используется только как удобный способ подтянуть файлы
библиотеки в веб-проект (в т.ч. не на PHP) — самой библиотеке PHP не нужен.

## Быстрый старт

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>jsroll quickstart</title>
    <script type="text/javascript" src="build/jsroll.min.js" charset="UTF-8"></script>
    <script type="text/x-template" id="welcome">
        <h3>{%= caption %}</h3>
        <p>{%= text %}</p>
    </script>
</head>
<body>
<div class="container">Container demo!</div>

<script>
    ui.el('.container').innerHTML = tpl('welcome', {
        caption: 'welcome!',
        text: 'RIA (Rich Internet Application) / SPA (Single-page Application) javascript framework'
    });
</script>
</body>
</html>
```

## Сборка

```
src/build.jsroll.sh   склеивает jsroll.js + jsroll.ui.js -> build/jsroll.min.js
src/build.extra.sh    минифицирует остальные модули по отдельности (dao/ui.grid/svg/image/auth/tools),
                       добавляет заголовок с версией и пишет build/*.min.js + src/*.min.sha384
```

Оригинальный `yuicompressor-2.4.8.jar` — устаревший, давно снятый с
поддержки инструмент, обычно недоступный в современном окружении; при его
отсутствии `build.extra.sh` минифицирует через `terser`
(`npx terser <file> --compress --mangle -o <file>.min.js`), результат
эквивалентен.

## Известные особенности (стоит знать при интеграции)

- `document.querySelector(sel).ui` — всегда `undefined`. Свойства `.ui`/`.css`
  появляются только через `ui.el(sel)`/`ui.els(sel)` (или `.ui.el(...)` на
  уже обёрнутом элементе). Подробности и последствия — `docs/event.md`.
- Внутри `xhr()`-колбэков `done`/`fail`/`after` — `this` **не** объект
  `XMLHttpRequest` (вызываются как обычные функции, без `.call(x, ...)`).
  Сам запрос — через аргумент: `ui.src(e)`/`e.target`. Подробности —
  `docs/xhr.md`.
- `group`/`xhr()`-формы умеют полноценный REST: `<form method="put">`
  (или `patch`/`delete`) реально отправляет этот HTTP-метод через
  `XMLHttpRequest`, хотя нативный HTML5 `<form>` официально понимает
  только `get`/`post`. Подробности — `examples/forms/`.
- `form.data` (геттер) собирает `name="a[b]"` во вложенный объект
  `{a:{b:...}}`; `form.data = {...}` (сеттер) так **не** делает — ключи
  должны буквально совпадать со строкой `name`. Подробности —
  `examples/forms/`.
- Чекбоксы одной группы: без атрибута `pack` — обычный массив выбранных
  значений; с `pack="1"` (именно с непустым значением, не голый `pack`) —
  битовая маска в одно число. Подробности — `examples/forms/`.
- Web SQL (`webSQL`/`webSQLmodel` в `jsroll.dao.js`) полностью удалён из
  всех современных браузеров (Chrome — с версии 124, апрель 2024; Safari —
  ещё в 2019; Firefox не поддерживал никогда) — оставлен в библиотеке
  только для чтения/поддержки legacy-кода, актуальный офлайн-аналог —
  IndexedDB (`IDB`/`IDBmodel`).
