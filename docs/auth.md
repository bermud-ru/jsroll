# jsroll.auth.js — биометрическая аутентификация (WebAuthn)

> Модуль добавлен позже основной библиотеки, зависит от `jsroll.ui.js`
> (нужен `window.ui`) — как `jsroll.dao.js`/`jsroll.ui.grid.js`. Рабочий
> пример — `examples/webauthn/index.html`.

## Идея

Обёртка над браузерным Web Authentication API — вход и регистрация по
биометрии/PIN устройства (Touch ID, Face ID, Windows Hello, отпечаток
пальца на Android) без паролей. Оформлена в стиле остальных надстроек
jsroll: класс с шиной событий как у `Application` (`addEventListener`/
`dispatchEvent`), `{done, fail}`-колбэки как у `xhr()`, локальное
состояние — через `storage()`.

```js
var webauthn = new WebAuthn({ rpName: 'Моё приложение' }); // rpId — см. предупреждение ниже

webauthn.addEventListener('webauthn.register', function (e) {
    console.log('зарегистрирован:', e.detail.userId);
});

webauthn.register({ id: 'andrey', name: 'andrey', displayName: 'Андрей' }, {
    done: function (info) { /* info.id — credential id, сохранён локально */ },
    fail: function (err) { /* пользователь отменил / ошибка */ }
});

webauthn.authenticate({
    userId: 'andrey', // не указан — браузер сам предложит выбрать из сохранённых на устройстве ключей
    done: function (r) { console.log('вход как', r.userId); },
    fail: function (err) { console.error(err.message); }
});
```

## ⚠ Безопасность — не опционально

WebAuthn существует ради того, чтобы `challenge` для
`register()`/`authenticate()` и проверка подписи ответа выполнялись на
**сервере**. Модуль умеет работать полностью локально (генерирует
`challenge` через `crypto.getRandomValues`, определяет «своего»
пользователя по совпадению `credential id` в `localStorage` этого же
браузера) — но это только ради автономной демонстрации без бэкенда (см.
пример). В реальном приложении:

- `opt.challenge` в `register()`/`authenticate()` — получайте с сервера
  (например, через `xhr()`), а не полагайтесь на автогенерацию;
- результат колбэка `done` (объект `credential`/`assertion`) целиком
  отправляйте на сервер для криптографической проверки — на клиенте она
  невозможна и неполна;
- `user.id` в проде — непрозрачный случайный идентификатор с сервера, а
  не имя пользователя напрямую (в примере оно открытое — только ради
  простоты демонстрации).

## ⚠ «The requested RPID did not match the origin or related origins»

Именно поэтому `rpId` по умолчанию **не задан** (`null`) — см. `docs/auth.md`
исходник и комментарий в `jsroll.auth.js`. Если задать `rpId` явно (например,
`location.hostname`) и открыть страницу не как обычную вкладку браузера на
её собственном адресе — через встроенный предпросмотр, прокси или iframe,
которые подменяют/скрывают реальный адрес — браузер откажет именно с этой
ошибкой, потому что видимый адрес не совпадает с тем, что WebAuthn считает
настоящим доменом страницы. Решение — не задавать `rpId` (тогда браузер сам
корректно подставит текущий эффективный домен) и/или открыть страницу в
отдельной вкладке браузера напрямую, а не через встроенный просмотрщик.

## `new WebAuthn(opt)`

```js
var webauthn = new WebAuthn({
    rpName: 'Моё приложение',       // по умолчанию document.title || location.hostname
    rpId: null,                        // домен, к которому привязывается ключ — не задан -> браузер сам подставит текущий эффективный домен
    userVerification: 'required',     // требовать именно биометрию/PIN, а не просто "ключ подключён"
    authenticatorAttachment: 'platform', // встроенный сенсор устройства, не внешний USB-ключ
    attestation: 'none',
    timeout: 60000,
    storageKey: 'jsroll.webauthn.',   // префикс ключей в localStorage
    storage: null                      // свой storage()-совместимый объект вместо localStorage
});
```

## Поддержка и наличие сенсора

```js
webauthn.supported;                 // boolean — поддерживает ли браузер WebAuthn вообще
webauthn.platformAvailable(function (available) {
    // есть ли НА УСТРОЙСТВЕ пригодный биометрический/PIN-сенсор
});
```

## `register(user, opt)` / `authenticate(opt)`

```js
webauthn.register(
    { id: 'andrey', name: 'andrey', displayName: 'Андрей' },
    { challenge: bytesFromServer, done: function (info, credential) {}, fail: function (err) {} }
);

webauthn.authenticate({
    userId: 'andrey',                 // опустить — предложит любой сохранённый на устройстве ключ
    challenge: bytesFromServer,
    done: function (result, assertion) { /* result.userId, result.credentialId */ },
    fail: function (err) {}
});
```

## Локальный реестр устройства

```js
webauthn.users();                    // string[] — все userId, зарегистрированные на этом устройстве
webauthn.credentials(userId);        // массив { id, name, displayName, created } для пользователя
webauthn.hasCredential(userId);      // boolean
webauthn.forget(userId, credentialId?); // забыть один ключ (если указан) либо все ключи пользователя
```

## События

Общая шина, как у `Application` (`addEventListener`/`removeEventListener`/`dispatchEvent`):

| Событие | `e.detail` |
|---|---|
| `webauthn.register` | `{ userId, credential }` |
| `webauthn.authenticate` | `{ userId, credentialId }` |
| `webauthn.forget` | `{ userId, credentialId }` |
| `webauthn.error` | `{ action, userId, error }` |

## Вспомогательные функции

`bufferToBase64url(buffer)` / `base64urlToBuffer(base64url)` — конвертация
между `ArrayBuffer` (в таком виде WebAuthn отдаёт `credential.rawId` и
т.п.) и строкой base64url, пригодной для `localStorage`/JSON/`xhr()`.
Пригодятся, если пересылаете `credential`/`assertion` на сервер вручную.

## Полный пример

Регистрация, вход по конкретному пользователю, вход «любым сохранённым
ключом» (discoverable credentials), список пользователей устройства с
кнопкой «Забыть» — в `examples/webauthn/index.html`.
