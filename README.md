# Javascript RIA (Rich Internet Application) / (SPA) Single-page Application framework

composer.json
```
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
======

```
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Javascript RIA (Rich Internet Application) / (SPA) Single-page Application framework</title>
    <script type="text/javascript"
            src="https://github.com/bermud-ru/jsroll/blob/master/build/jsroll.min.js" charset="UTF-8"></script>
    <style>
        .im-centered { margin: auto; max-width:32em;}
    </style>
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
       document.querySelector('#main').innerHTML = tmpl('welcome', {
           caption: 'welcome!',
           text: 'Javascript RIA (Rich Internet Application) / (SPA) Single-page Application framework'
        });
</script>

</body>
</html>
```