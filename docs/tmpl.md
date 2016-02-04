# Шаблонизатор tmpl

Объект позволяет генерировать контекст на основе наборе данных (javascritp Object) и шаблона - как DOM объктом докуметнта так и использования швнешнего ресурса запрошенного

**tmpl**( id [, data [, callback]]) returns: String

**id**  
Type: String  
Параметр id принимает знаение 1) индентификатора объктата DOM HTMLElementObject.id или 2) ссылка на ресурс в формате URL (см. [wiki](https://ru.wikipedia.org/wiki/URL)), содержащий код шаблона.

**data**  
Type: Object  
Параметр data объект javascript содержит данные которы являются источником данных длоступные внутри шаблона.

**callback**  
Type: Function  
Arguments: context  
Параметр callback функция javascript определяет как tmpl воздвращает результат генерации контента при условиии корректной работы скрипта, если функция не определена то tmpl возвращает конетент как результа функции и если id в формате URL, то объект XMLHttpRequest внутри скрита работает в синхронном режиме async = false. Если функция определена то результат будет вызов callback функции и в качестве аргумента ей пеердаётся сгнерерированные контент и сли id в формате URL, то объект XMLHttpRequest внутри скрита работает в асинхронном режиме async = true.

### HTMLElementObject.id
```
    <script type="text/x-tmpl" id="welcome" charset="UTF-8">
    <h3>{%=caption%}
    <p>{%=text%}
    </script>
    ...
    <script>
    document.querySelector('.navbar .container').innerHTML = tmpl('welcome', {
    caption: 'JsRoll',
    text: '<b>RIA</b> (Rich Internet Application) / <b>SPA</b> (Single-page Application) javascript framework'
    });
    </script>
```
                    
### XMLHttpRequest async=false mode
```
    document.querySelector('.navbar .container').innerHTML = tmpl('/js/welcome.tmpl', {
    caption: 'JsRoll',
    text: '<b>RIA</b> (Rich Internet Application) / <b>SPA</b> (Single-page Application) javascript framework'
    });
```
                    
### XMLHttpRequest async=true mode
```
    tmpl('/js/welcome.tmpl',
    {
    caption: 'JsRoll',
    text: '<b>RIA</b> (Rich Internet Application) / <b>SPA</b> (Single-page Application) javascript framework'
    },
    function(content){
    document.querySelector('.navbar .container').innerHTML = content;
    });
```