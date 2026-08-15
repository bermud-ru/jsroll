/**
 * @app jsroll.auth.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Обёртка над браузерным Web Authentication API (WebAuthn) — вход и
 * регистрация по биометрии/PIN устройства (Touch ID, Face ID, Windows
 * Hello, отпечаток пальца на Android) без паролей. Оформлена в стиле
 * остальных надстроек jsroll: класс с шиной событий как у Application
 * (addEventListener/dispatchEvent), {done,fail}-колбэки как у xhr(),
 * локальное состояние через storage().
 *
 * Зависит от jsroll.ui.js (нужен window.ui) — как jsroll.dao.js и
 * jsroll.ui.grid.js, самостоятельно не подключается.
 *
 * ====================================================================
 * ВАЖНО (безопасность, не опционально):
 * WebAuthn существует ради того, чтобы challenge для create()/get() и
 * проверка подписи ответа выполнялись на СЕРВЕРЕ — сервер обязан
 * сгенерировать случайный одноразовый challenge и затем сам
 * криптографически проверить attestation/assertion. Всё, что этот
 * модуль умеет делать локально без сервера (генерировать challenge
 * через crypto.getRandomValues, хранить credential id в localStorage,
 * определять "своего" пользователя по credential id) — исключительно
 * ради автономной демонстрации в браузере без бэкенда (см. пример
 * examples/webauthn/). В реальном приложении:
 *   - opt.challenge для register()/authenticate() должен приходить
 *     с сервера (например, через xhr()) вместо автогенерации;
 *   - результат navigator.credentials.create()/.get() должен
 *     отправляться на сервер для проверки — на клиенте эта проверка
 *     невозможна и неполна: у клиента нет закрытого ключа, но и нет
 *     доверенного способа проверить подпись без сервера.
 * ====================================================================
 *
 * @author Андрей Новиков <andrey@novikov.be>
 * @status beta
 * @version 1.0.0
 */
(function (g, ui, undefined) {
    'use strict';
    if (typeof ui === 'undefined') return false;

    /**
     * ArrayBuffer/Uint8Array -> base64url. WebAuthn отдаёт бинарные
     * ArrayBuffer'ы (credential id, raw id и т.п.), а localStorage/JSON/xhr
     * работают только со строками — отсюда конвертация в обе стороны.
     */
    var bufferToBase64url = function (buffer) {
        var bytes = new Uint8Array(buffer), str = '';
        for (var i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
        return g.btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    /**
     * base64url -> ArrayBuffer (обратная операция, нужна для
     * allowCredentials/excludeCredentials — WebAuthn ждёт там снова
     * ArrayBuffer, а не строку из хранилища).
     */
    var base64urlToBuffer = function (base64url) {
        var pad = base64url.length % 4 ? 4 - (base64url.length % 4) : 0;
        var base64 = (base64url + new Array(pad + 1).join('=')).replace(/-/g, '+').replace(/_/g, '/');
        var str = g.atob(base64), bytes = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
        return bytes.buffer;
    };

    /**
     * Случайные байты для challenge. ⚠ Только для демо без сервера —
     * см. предупреждение о безопасности в шапке файла.
     */
    var randomBuffer = function (len) {
        var bytes = new Uint8Array(len || 32);
        (g.crypto || g.msCrypto).getRandomValues(bytes);
        return bytes;
    };

    /**
     * @class WebAuthn
     * @param opt { Object } { rpName, rpId, userVerification, authenticatorAttachment,
     *                         attestation, timeout, storageKey, storage }
     */
    var WebAuthn = function (opt) {
        var $ = this;
        if (opt && typeof opt === 'object') $.merge(opt);
        $.ls = $.storage || storage();

        var target = new EventTarget();
        $.addEventListener = target.addEventListener.bind(target);
        $.removeEventListener = target.removeEventListener.bind(target);
        $.dispatchEvent = target.dispatchEvent.bind(target);
    };

    WebAuthn.prototype = {
        rpName: g.document.title || g.location.hostname,
        rpId: g.location.hostname,
        userVerification: 'required',        // именно биометрия/PIN, а не просто "ключ подключён"
        authenticatorAttachment: 'platform',  // встроенный сенсор устройства, а не внешний USB-ключ
        attestation: 'none',
        timeout: 60000,
        storageKey: 'jsroll.webauthn.',
        storage: null,                        // свой storage()-совместимый объект вместо localStorage, если нужно

        /**
         * @property supported { boolean } — поддерживает ли браузер WebAuthn вообще.
         * Не путать с наличием именно биометрического сенсора — см. platformAvailable().
         */
        get supported() { return !!(g.PublicKeyCredential && g.navigator && g.navigator.credentials); },

        /**
         * WebAuthn:platformAvailable — есть ли на устройстве пригодный
         * биометрический/PIN-сенсор (Touch ID, Windows Hello и т.п.).
         * @param cb { function(boolean) } — необязательный колбэк (кроме Promise)
         * @returns { Promise<boolean> }
         */
        platformAvailable: function (cb) {
            var res = (!this.supported || !g.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)
                ? g.Promise.resolve(false)
                : g.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (typeof cb === 'function') res.then(cb);
            return res;
        },

        // ---- локальный реестр: какие пользователи/credential-ы зарегистрированы на ЭТОМ устройстве ----
        // ⚠ str2json(s, def) подставляет def только при ОШИБКЕ парсинга; для
        // отсутствующего ключа getItem() вернёт null, а JSON.parse(null) без
        // ошибки даёт null (не def!) — поэтому здесь дополнительный `|| []`.
        users: function () { return str2json(this.ls.getItem(this.storageKey + 'index'), []) || []; },
        credentials: function (userId) { return str2json(this.ls.getItem(this.storageKey + 'user.' + userId), []) || []; },
        hasCredential: function (userId) { return !!this.credentials(userId).length; },

        /**
         * WebAuthn:forget — забыть один или все credential-ы пользователя на этом устройстве
         * (сам ключ в аутентификаторе пользователя это не удаляет — только локальную привязку).
         * @param userId { string }
         * @param credentialId { string=} — если не указан, удаляются все credential-ы пользователя
         */
        forget: function (userId, credentialId) {
            var list = this.credentials(userId);
            if (credentialId) list = list.filter(function (c) { return c.id !== credentialId; });
            else list = [];
            if (list.length) this.ls.setItem(this.storageKey + 'user.' + userId, JSON.stringify(list));
            else {
                this.ls.removeItem(this.storageKey + 'user.' + userId);
                this.ls.setItem(this.storageKey + 'index', JSON.stringify(this.users().filter(function (u) { return u !== userId; })));
            }
            this.dispatchEvent(new ce('webauthn.forget', { detail: { userId: userId, credentialId: credentialId || null } }));
        },

        _remember: function (userId, credentialInfo) {
            var list = this.credentials(userId);
            list.push(credentialInfo);
            this.ls.setItem(this.storageKey + 'user.' + userId, JSON.stringify(list));
            var idx = this.users();
            if (idx.indexOf(userId) === -1) { idx.push(userId); this.ls.setItem(this.storageKey + 'index', JSON.stringify(idx)); }
        },

        _findUserByCredential: function (credentialId) {
            var users = this.users();
            for (var i = 0; i < users.length; i++) {
                var creds = this.credentials(users[i]);
                for (var j = 0; j < creds.length; j++) if (creds[j].id === credentialId) return users[i];
            }
            return null;
        },

        _bail: function (opt, message) {
            var err = new Error(message);
            this.dispatchEvent(new ce('webauthn.error', { detail: { error: err } }));
            if (typeof opt.fail === 'function') opt.fail.call(this, err);
            return false;
        },

        /**
         * WebAuthn:register — создать и привязать к пользователю биометрический ключ устройства.
         * @param user { Object } { id: string, name: string, displayName?: string }
         * @param opt { Object } { challenge?: Uint8Array, excludeExisting?: boolean, done?, fail? }
         */
        register: function (user, opt) {
            var $ = this;
            opt = opt || {};
            if (!$.supported) return $._bail(opt, 'WebAuthn не поддерживается этим браузером.');
            if (!user || !user.id) return $._bail(opt, 'register(): не задан user.id.');

            var exclude = opt.excludeExisting === false ? [] : $.credentials(user.id).map(function (c) {
                return { id: base64urlToBuffer(c.id), type: 'public-key' };
            });

            g.navigator.credentials.create({
                publicKey: {
                    rp: { id: $.rpId, name: $.rpName },
                    user: {
                        id: new TextEncoder().encode(String(user.id)),
                        name: user.name || String(user.id),
                        displayName: user.displayName || user.name || String(user.id)
                    },
                    challenge: opt.challenge || randomBuffer(32), // ⚠ DEMO — в проде challenge с сервера, см. шапку файла
                    pubKeyCredParams: [ { type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 } ],
                    authenticatorSelection: {
                        authenticatorAttachment: $.authenticatorAttachment,
                        userVerification: $.userVerification,
                        residentKey: 'preferred'
                    },
                    excludeCredentials: exclude,
                    attestation: $.attestation,
                    timeout: $.timeout
                }
            }).then(function (credential) {
                var info = {
                    id: bufferToBase64url(credential.rawId),
                    name: user.name || null,
                    displayName: user.displayName || null,
                    created: utcISOString()
                };
                $._remember(user.id, info);
                $.dispatchEvent(new ce('webauthn.register', { detail: { userId: user.id, credential: info } }));
                if (typeof opt.done === 'function') opt.done.call($, info, credential);
            }).catch(function (err) {
                $.dispatchEvent(new ce('webauthn.error', { detail: { action: 'register', userId: user.id, error: err } }));
                if (typeof opt.fail === 'function') opt.fail.call($, err);
            });
        },

        /**
         * WebAuthn:authenticate — подтвердить личность биометрией устройства.
         * @param opt { Object } { userId?: string, challenge?: Uint8Array, done?, fail? }
         *   userId не указан -> браузер сам предложит выбрать из ранее сохранённых на устройстве
         *   ключей (discoverable credentials); указан -> предлагаются только его ключи.
         */
        authenticate: function (opt) {
            var $ = this;
            opt = opt || {};
            if (!$.supported) return $._bail(opt, 'WebAuthn не поддерживается этим браузером.');

            var allow = opt.userId ? $.credentials(opt.userId).map(function (c) {
                return { id: base64urlToBuffer(c.id), type: 'public-key' };
            }) : [];
            if (opt.userId && !allow.length) return $._bail(opt, 'Для пользователя "' + opt.userId + '" на этом устройстве нет сохранённых ключей.');

            g.navigator.credentials.get({
                publicKey: {
                    rpId: $.rpId,
                    challenge: opt.challenge || randomBuffer(32), // ⚠ DEMO — в проде challenge с сервера
                    allowCredentials: allow,
                    userVerification: $.userVerification,
                    timeout: $.timeout
                }
            }).then(function (assertion) {
                var id = bufferToBase64url(assertion.rawId);
                var userId = opt.userId || $._findUserByCredential(id);
                $.dispatchEvent(new ce('webauthn.authenticate', { detail: { userId: userId, credentialId: id } }));
                if (typeof opt.done === 'function') opt.done.call($, { userId: userId, credentialId: id }, assertion);
            }).catch(function (err) {
                $.dispatchEvent(new ce('webauthn.error', { detail: { action: 'authenticate', userId: opt.userId || null, error: err } }));
                if (typeof opt.fail === 'function') opt.fail.call($, err);
            });
        }
    };

    g.WebAuthn = WebAuthn;
    g.bufferToBase64url = bufferToBase64url; // пригодится приложению, чтобы переслать credential на сервер
    g.base64urlToBuffer = base64urlToBuffer;

}(window, window.ui));
