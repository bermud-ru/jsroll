# JsRoll RIA (Rich Internet Application) / SPA (Single-page Application) javascript framework

СТРУКТУРА ПРОЕКТА
-----------------
```
build/          оптимизированный код библиотеки
docs/           документация
examples/       примеры
src/            исходные коды библиотеки
```
ТРЕБОВАИНИЯ И ЗАВИСИМОСТИ
-------------------------


Обекты и свойства JsRoll
------------------------
### uuid()
Функция возрващает 16-байтный (128-битный) идентификатор (см. [wiki](https://ru.wikipedia.org/wiki/UUID))

### storage(instance)
Proxy-объект реализующий интерфейс (.setItem, .getItem, removeItem, .clear) работы с локальных хранилищем (default instance = window.localStorage) и позволяющий обойти QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota на мобильных устройствах.
```html
    <script>
    storage.setItem('user', JSON.stringify(params));
    </script>
```
                    
### params([search])
Функция возрващает Object (Хеш-таблица) параметров в строке запроса (location.search, часть адреса после символа ?, включая символ ?) если не определен аргумент search или разбирает данные из переменной search.

### [router](docs/router.md)
Объект маршрутизатор обеспечивает базовый функционал RIA/SPA добавить удалить обработчик маршрута, фукнция установить маршрут, проверить маршрут на совпадени и тд. По-умолчанию используется HTML5 History API и есть возможность режима location.hash.

### [eventhandler](docs/eventhandler.md)
Обработчик событий обеспечивает обработку событий элементов управления RIA/SPA приложения, позволяет изменяеть функционал обработки события любых DOM объектов документа.

### [xhr](docs/xhr.md)
Хелпер работы с запросами на основе xmlHttpRequest, в рамках одного инстанса позволяет мониторить и работать с серией запросов различного типа.

### [tmpl](docs/tmpl.md)
Объект позволяет генерировать контекст на основе наборе данных (javascritp Object) и шаблона - как DOM объктом докуметнта так и использования швнешнего ресурса запрошенного


composer.json
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

example
=======

```html
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Javascript RIA (Rich Internet Application) / (SPA) Single-page Application framework</title>
    <script type="text/javascript"
            src="https://github.com/bermud-ru/jsroll/blob/master/build/jsroll.min.js" charset="UTF-8"></script>
    <script type="text/x-tmpl" id="welcome">
        <h3>{%=caption%}</h3>
        <p>{%=text%}</p>
    </script>
</head>
<body>
<div class="container">
Container demo!
</div>

<script>
       document.querySelector('.container').innerHTML = tmpl('welcome', {
           caption: 'welcome!',
           text: 'Javascript RIA (Rich Internet Application) / (SPA) Single-page Application framework'
        });
</script>

</body>
</html>
```