# Обработчик событий eventhandler

Обработчик событий обеспечивает обработку событий элементов управления RIA/SPA приложения, позволяет изменяеть функционал обработки события любых DOM объектов документа.

**example**
```html
<div>
    <button>1</button>
    <button>2</button>
    <a href="#1">#1</a>
    <a href="#2">#2</a>
    <a href="/test">go to test utl</a>
    <span>[X] close</span>
</div>
<script>
    eventhandler.onclick = function(e) {
        console.log(e.srcElement);
        return true;
    }
</script>
```