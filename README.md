# Javascript RIA (Rich Internet Application) / (SPA) Single-page Application framework

example
======

```
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
 
    <script type="text/javascript"
            src="https://github.com/bermud-ru/jsroll/blob/master/build/jsroll.min.js" charset="UTF-8"></script>
    <style>
        .im-centered { margin: auto; max-width:32em;}
    </style>
</head>
<body>
<div class="container">
    <div class="im-centered">
    <div class="row">
        <div class="page-selection"></div>
    </div>
   </div>
    <div class="jumbotron">Page #1</div>
    <div class="im-centered">
    <div class="row">
        <div class="page-selection"></div>
    </div>
    </div>
<script>
    $('.page-selection').bootstrapPaginator({
        page: 1,
        count: 50,
        ruler: 10,
        reload: function(page){
            $('.jumbotron').html('Page #'+page);
        }
    });
</script>
</div>
</body>
</html>
```