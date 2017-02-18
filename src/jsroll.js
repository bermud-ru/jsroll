/**
 * @app jsroll.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Классы RIA / SPA javascritp framework
 * @author Андрей Новиков <andrey@novikov.be>
 * @status beta
 * @version 0.1.0
 * @revision $Id: jsroll.js 0004 2016-05-30 9:00:01Z $
 */

(function ( g, undefined ) {
    'suspected';
    'use strict';
    var version = '1.0.1b';
    var xmlHttpRequest = ('onload' in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;

    /**
     * @function re
     * Создание регулярного выражения из строки
     *
     * @argument { String } s - регулярное выражение
     * @argument { String } f - flags
     *      g — глобальный поиск (обрабатываются все совпадения с шаблоном поиска);
     *      i — не различать строчные и заглавные буквы;
     *      m — многострочный поиск.
     *
     * @result { RegExp }
     */
    var re = function (s, f) { return new RegExp(s, f || 'g') }; g.re = re;

    /**
     * @function uuid
     * Генерация Universally Unique Identifier 16-байтный (128-битный) номер
     *
     * @result { String }
     */
    var uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16);
        });
    }; g.uuid = uuid;

    /**
     * @function decoder
     * Возвращает объект (Хеш-таблица) параметров
     *
     * @argument { String | window.location } url строка в формате url (Uniform Resource Locator)
     *
     * @result { Object }
     */
    var decoder = function(search) {
        var re=/[?&]([^=#]+)=([^&#]*)/g, p={}, m;
        try { while (m = re.exec((search || g.location.search)))
            if (m[1] && m[2]) p[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        } catch(e) { return null }
        return p;
    }; g.location.decoder = decoder;

    /**
     * @function encoder
     * Возвращает строку вида ключ=значение разделёных &
     *
     * @argument { Object } Хеш-таблица параметров
     *
     * @result { String }
     */
    var encoder = function(params, divider) {
        if (typeof params === 'object') return Object.keys(params).map(function(e,i,a) {
            return encodeURIComponent(e) + '=' + encodeURIComponent(params[e])
        }).join(divider || '&');
        return undefined;
    }; g.location.encoder = encoder;

    /**
     * @function update
     * Возвращает Url c обновёнными (если были) или добавленными параметрами
     *
     * @argument { String | window.location } url строка в формате url (Uniform Resource Locator)
     * @argument { JSON object } параметры в формате ключ-значения
     *
     * @result { String }
     */
    var update = function(search, params) {
        var u = [], h = [], url = g.location.search, kv = params || {};
        if (typeof search === 'string' ) url = search; else kv = search;
        var p = g.location.decoder(url);
        if (url.indexOf('#') > -1) h = url.split('#'); if (url.indexOf('?') > -1) u = url.split('?');
        for (var i in kv) p[decodeURIComponent(i)] = decodeURIComponent(kv[i]);
        var res = []; for (var a in p) res.push(a+'='+p[a]);
        if (res.length) return ((!u.length && !h.length) ? url : (u.length?u[0]:h[0])) + '?' + res.join('&') + (h.length ? h[1] : '');
        return url;
    }; g.location.update = update;

    /**
     * @function timer
     * Кратное выполнение функции с заданным интервалом времени
     *
     * @argument { Number } t итервал в милисекунах до вызова функции f
     * @argument { Number } c количество вызовов функции f
     * @argument { Function } f функция
     * @argument { undefined | Function } done функуиф вызвается по завершению всх циклов или сигнала exit
     */
    function timer(t, c, f, done) {
        if (t && c && typeof f === 'function') {
            var fn = function fn (c, f, done) {
                    var r = f.call(this, c);
                    if (!c || (r !== undefined && !r)) {
                        clearTimeout(thread);
                        if (typeof done === 'function') return done.call(this, r);
                        return null;
                    } else {
                        return thread = g.setTimeout(fn.bind(this, --c, f, done), t);
                    }
                },
                thread = g.setTimeout(fn.bind(this, c, f, done), t);
            return thread;
        }
        return undefined;
    }; g.timer = timer;

    /**
     * @function router
     * Хелпер Маршрутизатор SPA
     *
     * @method { function () } fr
     * @method { function ( Regex, Callback ) } add
     * @method { function ( Regex | Callback ) } rm
     * @method { function ( String ) } chk
     * @method { function () } lsn
     * @method { function ( String ) } set
     *
     * @result { Object }
     */
    function router(r){
        var isHistory = !!(history.pushState) ? 1 : 0;
        var root = r;
        return {
            root:root, rt:[], itv:0, base:isHistory ? g.location.pathname+g.location.search:'',
            referrer:root,
            clr: function(path) { return path.toString().replace(/\/$/, '').replace(/^\//, ''); },
            fr: isHistory ?
                function(){
                    return this.root + this.clr(decodeURI(g.location.pathname + g.location.search)).replace(/\?(.*)$/, '');
                }:
                function(){
                    var m = g.location.href.match(/#(.*)$/);
                    return this.root + (m ? this.clr(m[1]) : '');
                },
            add: function(re, handler) {
                if (typeof re == 'function') { handler = re; re = ''; }
                this.rt.push({ re: re, handler: handler});
                this.rt = this.rt.sort(function(a, b) {
                    if (a.re.toString().length < b.re.toString().length) return 1;
                    if (a.re.toString().length > b.re.toString().length) return -1;
                    return 0;
                });
                return this;
            },
            rm: function(param) {
                for(var i in this.rt) {
                    if(this.rt[i].handler === param || this.rt[i].re.toString() === param.toString()) {
                        this.rt.splice(i, 1);
                        return this;
                    }
                }
                return this;
            },
            chk: function(fr) {
                var f = fr || this.fr(), m = false;
                for(var i in this.rt) if (m = f.match(this.rt[i].re)) { this.rt[i].handler.call(m || {}, f); return this; }
                return this;
            },
            lsn: function() {
                var s = this, c = s.fr(), fn = function() { if(c !== s.fr()) { c = s.fr(); s.chk(c); } return s; };
                clearInterval(s.itv); s.itv = setInterval(fn, 50);
                return s;
            },
            set: isHistory ?
                function(path) {
                    this.referrer = g.location.pathname+g.location.search;
                    history.pushState(null, null, this.root + this.clr(path || ''));
                    return this;
                }:
                function(path) {
                    this.referrer = g.location.pathname+g.location.search;
                    window.location.href = g.location.href.replace(/#(.*)$/, '') + '#' + (path || '');
                    return this;
                }
        }
    }; g.router = router('/');

    /**
     * @class chain
     * Хелпер Обработчик цепочки асинхронных объектов поддерживающих интерфейс done, fail
     *
     * @function done
     * @function fail
     */
    function chain(){
        var c = {
            tuple: [], cache: [],
            donned:function(fn){ return false },
            failed:function(fn){ return false },
            pool:function (fn, arg) {
                this.chain.cache.push(this);
                if (this.chain.tuple.length == this.chain.cache.length) this.chain.donned.apply(this.chain, this.chain.cache);
            },
            done: function(fn){ this.donned = fn },
            fail: function(fn){ this.failed = fn }
        };
        c.tuple = Array.prototype.slice.call(arguments).map(function(fn){
            fn.onload =  function(){ c.pool.apply(fn, arguments) };
            fn.chain = c; return fn;
        });
        return c;
    }
    g.chain = chain;

    /**
     * @function xhr
     * Хелпер запросов на основе xmlHttpRequest
     *
     * @argument { String } url (Uniform Resource Locator) путь до шаблона
     * @argument { String } id идентификатор шаблона
     * @argument { Boolean } async режим XMLHttpRequest
     * @event { XMLHttpRequest.onload & XMLHttpRequest.process }
     *
     * @result { Object }
     */
    function xhr(params){
        var x = new xmlHttpRequest();
        if (!x) return null;

        //TODO: xmlHttpRequest.abort()

        x.fail = function(fn) {
            if (typeof fn === 'function') return fn.call(this, x);
            if (typeof x.after == 'function') x.after.call(this);
            return this;
        };

        x.done = function(fn) {
            if (typeof fn === 'function') return fn.call(this);
            return this;
        };

        x.process = function(fn){
            x.onreadystatechange = function(e) {
                if (typeof fn === 'function') return fn.call(this, e);
            };
            return this;
        };

        x.onload = function(e) {
            x.done.call(this, e);
            if (typeof x.after == 'function') x.after.call(this, e);
            return x;
        };

        var opt = Object.assign({method:'GET'}, params);
        var rs = Object.assign({'Xhr-Version': version,'Content-type':'application/x-www-form-urlencoded'}, params.rs);
        var id = opt.method + '_' + (opt.url ? opt.url.replace(/(\.|:|\/|\-)/g,'_') : g.uuid());

        try {
            for (var i in opt) if (typeof opt[i] == 'function') x[i]=opt[i];
            if ((['GET', 'DELETE'].indexOf(opt.method.toUpperCase()) >= 0) && opt.data) {
                var u = opt.url || g.location;
                opt.url = u  + (u.indexOf('?') !=-1 ? '&':'?') + opt.data;
                opt.data = null;
            }
            if (typeof x.before == 'function') x.before.call(x, opt);
            x.method = opt.method;
            x.open(opt.method, opt.url || g.location, opt.async || true, opt.username, opt.password);
            for (var m in rs) x.setRequestHeader(m.trim(), rs[m].trim());
            x.send(opt.data || null);
            x.id = id;
        } catch (e) {
            x.abort(); x.fail.call(x, e);
        }
        return g.xhr.ref[id] = x;
    }; xhr.ref = {}; g.xhr = xhr;

    /**
     * @function form
     * Хелпер работы с данными формы
     *
     * @param f DOM элемент форма + f.rolling = ['post','get','put','delete' ets]
     * @param params
     * @returns {result:Object, data: String}}
     */

    function form(f) {
        f.setAttribute('valid', 1);
        f.response = null;
        f.rest = f.getAttribute('rest') || f.method;
        f.validator = f.validator || null;
        f.opt = f.opt || {};
        f.done = f.done || null;

        f.prepare = function(validator) {
            var data = [];
            if (!validator || (typeof validator === 'function' && validator.call(f, data)))
                for (var i=0; i < f.elements.length; i++) data.push((f.elements[i].name || i) + '=' + (['checkbox','radio'].indexOf((f.elements[i].getAttribute('type') || 'text').toLowerCase()) < 0 ? encodeURIComponent(f.elements[i].value):(f.elements[i].checked ? 1 : 0)));
            else f.setAttribute('valid', 0);
            return data.join('&');
        };

        f.update = function(data) {
            for (var i =0; i < f.elements.length; i++) if (data[f.elements[i].name]) f.elements[i].value = data[f.elements[i].name];
            else { var field = /\[([^\]]+)\]/.exec(f.elements[i].name)[1];
                if (field && data[field]) f.elements[i].value = data[field];
            }
            return f;
        };

        f.fail = typeof f.fail == 'function' ? f.fail : function (res) {
            if (res.form) for (var i =0; i < this.elements.length; i++) {
                if (res.form.hasOwnProperty(this.elements[i].name)) g.css.el(this.elements[i].parentElement).add('has-error');
                else g.css.el(this.elements[i].parentElement).del('has-error');
                //if (!!res.form[f.elements[i].name] || !!res.form[/\[([^\]]+)\]/.exec(f.elements[i].name)[1]]) g.css.el(f.elements[i].parentElement).add('has-error');
                //else g.css.el(f.elements[i].parentElement).del('has-error');
                return true;
            }
            return false;
        };

        f.send = function(callback) {
            var data = f.prepare(f.validator), before = true;
            if (f.getAttribute('valid') != 0) {
                if (typeof f.before == 'function') before = f.before.call(this);
                if (before == undefined || !!before) g.xhr(Object.assign({method: f.rest, url: f.action, data: data, done: typeof callback == 'function' ?
                    function() {
                        var result = callback.apply(this, arguments);
                        if (typeof f.after == 'function') return f.after.call(this, result);
                        return f;
                    } :
                    function() {
                        var res = {result:'error'};
                        f.response = this.responseText;
                        if ([200, 206].indexOf(this.status) < 0)
                           res.message = this.status + ': ' + this.statusText;
                        else try {
                           res = JSON.parse(this.responseText);
                        } catch (e) {
                           res.message = 'Cервер вернул не коректные данные';
                        }

                        if (res.result == 'error' ) {
                           if (typeof f.fail == 'function') f.fail.call(f, res);
                        } else if (res.result == 'ok') {
                           if (typeof f.done == 'function') f.done.call(f, res);
                        }
                        if (typeof f.after == 'function') f.after.call(f, res, res.result == 'ok');
                        return f;
                    }
                }, f.opt));
            } else f.setAttribute('valid',1);
            return f;
        };

        return f;
    }; g.JSON.form = form;

    /**
     * @function tmpl
     * Хелпер для генерации контескта
     *
     * @argument { String } str (url | html)
     * @argument { JSON } data объект с даннными
     * @argument { undefined | function } cb callback функция
     * @argument { undefined | object } дополнительые методы и своийства
     *
     * @result { String }
     */
    var tmpl = function tmpl( str, data, cb, opt ) {
        g.arguments = arguments;
        var compile = function( str ) {
            var source = str.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/igm, '').replace(/\>\s+\</g,'><').trim();
            return source.length ? new Function('_e',"var p=[], print=function(){ p.push.apply(p,arguments); };with(_e){p.push('"+
                    source.replace(/[\r\t\n]/g," ").split("{%").join("\t").replace(/((^|%})[^\t]*)'/g,"$1\r")
                    .replace(/\t=(.*?)%}/g,"',$1,'").split("\t").join("');").split("%}").join("p.push('").split("\r")
                    .join("\\'")+ "');} return p.join('').replace(/<%/g,'{%').replace(/%>/g,'%}');") : undefined;
            },
            build = function( str, id ) {
                var isId = typeof id !== 'undefined', pattern = null;
                var result = null, after = undefined, before = undefined, args = undefined;
                var pig = g.document.getElementById(id);
                var data = {};
                var context;

                try {
                    if (pig) {
                        if (before = pig.getAttribute('before')) eval.call(g.arguments, before);
                        var nn = undefined;
                        Array.prototype.slice.call(pig.attributes).map(function (i) {
                            if ( i && /^tmpl-*/i.test(i.nodeName.toString()) && (nn=i.nodeName.toString().replace(/^tmpl-/i, '')) )
                                try {
                                    data[nn] = JSON.parse(i.nodeValue);
                                } catch (e) {
                                    data[nn] = i.nodeValue;
                                }
                        });
                        if (args = pig.getAttribute('arguments')) data = Object.assign(JSON.parse(args) || {}, data, g.arguments[1]);
                    }

                    if (opt && typeof opt.before == 'object') {
                        data = Object.assign(data, opt.before);
                    } else if (opt && typeof opt.before == 'function') {
                        opt.before.call(this, data);
                    }

                    data = Object.assign(data, g.arguments[1] || {});

                    if (isId && g.tmpl.cache[id]) {
                        pattern = g.tmpl.cache[id];
                    } else {
                        pattern = compile(str);
                        if (isId) g.tmpl.cache[id] = pattern;
                    }
                    result = pattern.call(g.tmpl, data);

                    if (typeof cb == 'function') context = cb.call(pattern || g.tmpl, result) || g.tmpl;
                    else if (typeof cb == 'object' && (context = cb)) context.innerHTML = result;

                    if (context && pig && (after = pig.getAttribute('after'))) (function(){return eval(after)}).apply(context, g.arguments);
                    if (opt && typeof opt.after == 'function') opt.after.apply(context, g.arguments);
                } catch( e ) {
                    console.error('#', id || str, 'Error:', e );
                    return undefined;
                }
                return result;
            };

        switch ( true ) {
            case str.match(/^(?:https?:\/\/)?(?:(?:[\w]+\.)(?:\.?[\w]{2,})+)?([\/\w]+)(\.[\w]+)/i) ? true: false: var id = str.replace(/(\.|\/|\-)/g, '');
                if (g.tmpl.cache[id]) return build(null, id);
                return g.xhr(Object.assign({url:str, async: (typeof cb == 'function'), done:function(e) {
                    if ([200, 206].indexOf(this.status) < 0) console.warn(this.status + ': ' + this.statusText);
                    else build(this.responseText, id);
                }}, opt));
            case !/[^\w\-\.]/.test(str) : return build( g.document.getElementById( str ).innerHTML, str );
            default: return build( str );
        }
    }; tmpl.cache = {}; g.tmpl = tmpl;

    /**
     * @function storage
     * Хелпер для работы window.localStorage
     * Fix for "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
     *
     * @argument { undefined | Object } s инстанс
     *
     * @result { Object }
     */
    var storage = function(s) {
        var s = s || g.localStorage;
        try {
            s.setItem('test', '1');
            s.removeItem('test');
        } catch (e) {
            return {
                p: [],
                setItem:function(key, value){
                    this.p.push(key);
                    this[key] = value;
                },
                getItem:function(key){
                    if (this.hasOwnProperty(key)) return this[key];
                    return null;
                },
                removeItem: function(key){
                    if (this.hasOwnProperty(key)){
                        delete this.p[key];
                        delete this[key];
                    }
                },
                clear:function(){
                    this.p.map(function(item){delete this[item];});
                    this.p = [];
                }
            };
        }
        return s;
    }; g.storage = storage();

    /**
     * @function dom
     * Создаёт объект DOM из string
     *
     * @result { DOM | null }
     */
    var dom = function () {
        var p;
        try {
            if ( g.DOMParser ) {
                p = new DOMParser();
                return function(d, mime) {
                    try {
                        return p.parseFromString( d, mime || 'text/xml' );
                    } catch (e) {
                        return null;
                    }
                };
            } else {
                p = new ActiveXObject( 'Microsoft.XMLDOM' );
                p.async = 'false';
                return function(d, mime) {
                    try {
                        p.instance.loadXML(d);
                        return p;
                    } catch (e) {
                        return null;
                    }
                };
            }
        } catch ( e ) {
            return undefined;
        }

    }; g.dom = dom();

}(window));