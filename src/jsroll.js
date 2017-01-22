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
     * @function params
     * Возвращает массив (Хеш-таблица) параметров
     *
     * @argument { String | window.location } url строка в формате url (Uniform Resource Locator)
     *
     * @result { Array }
     */
    var params = function(search) {
        var re=/[?&]([^=#]+)=([^&#]*)/g, p={}, m;
        try { while (m = re.exec((search || g.location.search)))
            if (m[1] && m[2]) p[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        } catch(e) { return null }
        return p;
    }; g.location.params = params;

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
        var p = g.location.params(url);
        if (url.indexOf('#') > -1) h = url.split('#'); if (url.indexOf('?') > -1) u = url.split('?');
        for (var i in kv) p[decodeURIComponent(i)] = decodeURIComponent(kv[i]);
        var res = []; for (var a in p) res.push(a+'='+p[a]);
        if (res.length) if (!u.length && !h.length) return url + '?'+res.join('&');
            else if (u.length && !h.length) return u[0] + '?'+res.join('&');
            else if (u.length && h.length) return u[0] + '?'+res.join('&') + h[1];
            else if (!u.length && h.length) return h[0] + '?'+res.join('&') + h[1];
        return url;
    }; g.location.update = update;

    g.fadeRule = [0.0,  0.301, 0.477, 0.602, 0.699, 0.778, 0.845, 0.903, 0.954, 1.0]; // Math.log([1..10])/ Math.log(10);
    /**
     * @function fadeOut
     * Функция плавного скрытия элемента - свойство opacity = 0
     *
     * @param el элемент DOM
     * @param cb callback функция
     */
    function fadeOut(el, cb){
        var st = null, d = 8,
        fn = function fn (d, cb) {
            this.style.opacity = g.fadeRule[d];
            if (d-- <= 0){if (typeof cb === 'function') cb.call(this);this.style.display = 'none';clearTimeout(st)}
            else st = setTimeout(fn.bind(this, d, cb),typeof cb === 'number' ? cb : 25);
        };
        if (el) {
            el.style.display = 'inherit'; el.style.opacity = 1;
            st = setTimeout(fn.bind(el, d, cb), typeof cb === 'number' ? cb : 25);
        }
    }; g.fadeOut = fadeOut;

    /**
     * @function fadeIn
     * Функция плавного отображения элемента - свойство opacity = 1
     *
     * @param el элемент DOM
     * @param cb callback функция
     */
    function fadeIn(el, cb){
        var st = null, d = 1,
        fn = function fn (d, cb) {
            this.style.opacity = g.fadeRule[d];
            if (d++ >= 9){if (typeof cb === 'function') cb.call(this);clearTimeout(st)}
            else st = setTimeout(fn.bind(this, d, cb),typeof cb === 'number' ? cb : 25);
        };
        if (el) {
            el.style.display = 'inherit'; el.style.opacity = 0;
            st = setTimeout(fn.bind(el, d, cb), typeof cb === 'number' ? cb : 25);
        }
    }; g.fadeIn = fadeIn;

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
            root:root, rt:[], itv:0, base:isHistory ? window.location.pathname+window.location.search:'',
            referrer:root,
            clr: function(path) { return path.toString().replace(/\/$/, '').replace(/^\//, ''); },
            fr: isHistory ?
                function(){
                    return this.root + this.clr(decodeURI(location.pathname + location.search)).replace(/\?(.*)$/, '');
                }:
                function(){
                    var m = window.location.href.match(/#(.*)$/);
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
                    this.referrer = window.location.pathname+window.location.search;
                    history.pushState(null, null, this.root + this.clr(path || ''));
                    return this;
                }:
                function(path) {
                    this.referrer = window.location.pathname+window.location.search;
                    window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + (path || '');
                    return this;
                }
        }
    }; g.router = router('/');

    /**
     * @class chain
     * Хелпер Обработчик цепочки асинхронных объектов
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
    function xhr(){
        var x = new xmlHttpRequest();
        if (!x) return null;
        if (!x.hasOwnProperty('ref')) x.ref = {};
        x.request=function(params){
            var opt = Object.assign({method:'GET'}, params);
            opt.rs = Object.assign({'Xhr-Version': version,'Content-type':'application/x-www-form-urlencoded'}, params.rs);
            var id = opt.method + '_' + (opt.url ? opt.url.replace(/(\.|:|\/|\-)/g,'_') : g.uuid());
            //TODO: check double request for resurce
            //TODO: multithreading request and compile by chain algoritрm
            //if (x.ref.hasOwnProperty(id) && !!x.ref[id].isLoad) return x.ref[id];
            var item = new xhr(); item.isLoad = false;
            if ((['GET','DELETE'].indexOf(opt.method.toUpperCase()) >= 0) && opt.data){ opt.url = (opt.url || g.location)+'?'+opt.data; opt.data = null }
            item.open(opt.method, opt.url || g.location, opt.async || true, opt.username || undefined, opt.password || undefined);
            if (opt.rs) for(var m in opt.rs) item.setRequestHeader(m.trim(), opt.rs[m].trim());
            item.send(opt.data || null);
            item.id = id;
            opt.result && (item.result = x.result(opt.result));
            opt.process && (item.process = x.process(opt.process));
            return x.ref[id] = item;
        };
        //TODO: xmlHttpRequest.abort()
        x.result=function(fn){
            x.onload = function(e){
                this.isLoad = true;
                if (typeof fn === 'function') return fn.call(this, e);
            };
            return this;
        };
        x.process = function(fn){
            x.onreadystatechange = function(e){
                if (typeof fn === 'function') return fn.call(this, e);
            };
            return this;
        };
        return x;
    }; g.xhr = xhr();

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
        f.method = f.method || 'GET';
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
            var data = f.prepare(f.validator);
            if (f.getAttribute('valid') != 0) {
               g.xhr.request(Object.assign({method: f.method, url: f.action, data: data}, f.opt))
                    .result(callback || function(arg) {
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
                            return f;
                        });
            }
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
                    if (pig && (after = pig.getAttribute('after'))) (function(){return eval(after)}).apply(context, g.arguments);
                    if (opt && typeof opt.after == 'function') opt.after.apply(context, g.arguments);
                } catch( e ) {
                    console.error('#', id || str, 'Error:', e );
                    return undefined;
                }
                return result;
            };

        switch ( true ) {
            case str.match(/^(?:https?:\/\/)?(?:(?:[\w]+\.)(?:\.?[\w]{2,})+)?([\/\w]+)(\.[\w]+)/i)? true: false: var id = str.replace(/(\.|\/|\-)/g, '');
                if (g.tmpl.cache[id]) return build(null, id);
                return g.xhr.request(Object.assign({url:str, async: (typeof cb == 'function')}, opt)).result(function(e){
                    if ([200, 206].indexOf(this.status) < 0) console.warn(this.status + ': ' + this.statusText);
                    else build(this.responseText, id);
                });
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

}(window));