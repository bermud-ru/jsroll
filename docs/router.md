# Маршрутизатор window.router

Объект маршрутизатор обеспечивает базовый функционал RIA/SPA добавить удалить обработчик маршрута, фукнция установить маршрут, проверить маршрут на совпадени и тд. По-умолчанию используется HTML5 History API и есть возможность режима location.hash.

**example**
```html
<div role="application">
    <h1>Test</h1>
    <a onclick="javascript:router.set(router.base)">base</a>
    <a onclick="javascript:router.set()">root</a>
    <a onclick="javascript:router.set('/about/')">about</a>
    <a onclick="javascript:router.set('/app/22')">/app/22</a>
    <a onclick="javascript:router.set('/app/22/edit/3')">/app/22/edit/3</a>

</div>
<script>
    router.add(/about/, function() {
                console.log('about');
            })
            .add(/app\/(.*)\/edit\/(.*)/, function() {
                console.log('!app-edit', arguments);
            })
            .add(/app\/(.*)/, function() {
                console.log('!app', arguments);
            })
            .add(function() {
                console.log('default');
            })
            .chk('/app1/22')
            .lsn();
    ;
    router.set('/app/router.html?t=2');
</script>
```