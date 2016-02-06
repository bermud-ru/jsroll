# window.xhr хелпер

Хелпер работы с запросами на основе xmlHttpRequest, в рамках одного инстанса позволяет мониторить и работать с серией запросов различного типа.

**example**
```html
    xhr.request('GET', 'data.json').process(function(e) {
        console.log(this.readyState + " получено символов:" + this.responseText.length);
    }).result(function() {
        if (this.status != 200) {
            // обработать ошибку
            console.log( this.status + ': ' + this.statusText ); // пример вывода: 404: Not Found
        } else {
            // вывести результат
            console.log( JSON.parse(this.responseText) ); // responseText -- текст ответа.
        }
    });
```