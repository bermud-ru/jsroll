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
    var xmlHttpRequest = ('onload' in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
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
    };
    g.uuid = uuid;

    /**
     * @function params
     * Возвращает массив (Хеш-таблица) параметров
     *
     * @argument { String | window.location } url строка в формате url (Uniform Resource Locator)
     *
     * @result { Array }
     */
    var params = function(search) {
        var re=/[?&]([^=#]+)=([^&#]*)/g,p={},m;
        try { while (m = re.exec((search || g.location.search)))
            if (m[1] && m[2]) p[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }catch(e){return null}
        return p;
    }
    g.location.params = params;

    /**
     * @function fadeOut
     * Функция плавного скрытия элемента - свойство opacity = 0
     *
     * @param el элемент DOM
     * @param cb callback функция
     */
    function fadeOut(el, cb){
        var st = null;
        el && (st = setInterval(function() {
            el.style.opacity = el.style.opacity && el.style.opacity > 0 ? (parseFloat(el.style.opacity) - 0.1).toFixed(1) : '1';
            if (parseFloat(el.style.opacity) <= 0){if (typeof cb === 'function' && cb.call(el)) cb.call(el);el.style.display = 'none';clearInterval(st)}
        }, typeof cb === 'number' ? cb : 25));
    }
    g.fadeOut = fadeOut;

    /**
     * @function fadeIn
     * Функция плавного отображения элемента - свойство opacity = 1
     *
     * @param el элемент DOM
     * @param cb callback функция
     */
    function fadeIn(el, cb){
        var st = null;
        el && (st = setInterval(function() {
            if (el.style.display == 'none') el.style.display = 'inherit';
            el.style.opacity = el.style.opacity && el.style.opacity < 1 ?  (parseFloat(el.style.opacity) + 0.1).toFixed(1) : '0';
            if (parseFloat(el.style.opacity) >= 1) {if (typeof cb === 'function' && cb.call(el)) cb.call(el);clearInterval(st)}
        }, typeof cb === 'number' ? cb : 25));
    }
    g.fadeIn = fadeIn;

    /**
     * @function form
     * Хелпер работы с данными формы
     *
     * @param f DOM элемент форма + f.rolling = ['post','get','put','delete' ets]
     * @param params
     * @returns {result:Object, data: String}}
     */

    function form(f, validator) {
        f.setAttribute('valid', 1);
        f.xhr = null;
        f.prepare = function(validator){
            var data = [];
            if (!validator || (typeof validator === 'function' && validator.call(f, data)))
                for (var i=0; i < f.elements.length; i++) data.push((f.elements[i].name || i) + '=' + encodeURIComponent(f.elements[i].value));
            else f.setAttribute('valid', 0);
            return data.join('&');
        };
        f.validator = validator || f.validator;
        f.release = function(p){
            var data = f.prepare(p && p.validator || f.validator);
            if (f.getAttribute('valid') != 0) {
                g.xhr.request(Object.assign({method: p && p.method || f.method, url: p && p.url || f.action, data: data}, {rs:p.rs || {}}))
                    .result(p && p.callback || function() {
                            var res = {result:'error'};
                            if ([200, 206].indexOf(this.status) < 0) res.message = this.status + ': ' + this.statusText;
                            else try {
                                res = JSON.parse(this.responseText);
                                if (res.form) for (var i =0; i < f.elements.length; i++) {
                                    if (res.form.hasOwnProperty(f.elements[i].name)) css.el(f.elements[i].parentElement).add('has-error');
                                    else css.el(f.elements[i].parentElement).del('has-error');
                                    //if (!!res.form[f.elements[i].name] || !!res.form[/\[([^\]]+)\]/.exec(f.elements[i].name)[1]]) g.css.el(f.elements[i].parentElement).add('has-error');
                                    //else g.css.el(f.elements[i].parentElement).del('has-error');
                                }
                            } catch (e) {
                                res.message = 'Cервер вернул не коректные данные';
                            }
                            f.xhr = res;
                            if (p && typeof p.fn == 'function') p.fn.call(f, res);
                            return f;
                        });
            }
            return f;
        };
        f.insert= function(data){
            for (var i =0; i < f.elements.length; i++) if (data[f.elements[i].name]) f.elements[i].value = data[f.elements[i].name];
            else { var field = /\[([^\]]+)\]/.exec(f.elements[i].name)[1];
                if (field && data[field]) f.elements[i].value = data[field];
            }
            return f;
        };
        f.setup = function(p){
            if (p) switch (true){
                case p.hasOwnProperty('form'):
                    console.log('data from data');
                    if (typeof p.form === 'object') {
                        f.insert(p.form);
                        var validator = (p && p.validator || f.validator);
                        if (typeof validator == 'function') validator.call(f, p.data);
                    } break;
                case p.hasOwnProperty('xhr'):
                    g.xhr.request({method: p.xhr.method || 'GET', url: p.xhr.url, data: p.xhr.data || null, rs: p.xhr.rs || {}})
                        .result(p.xhr.callback || function() {
                                var res = {result:'error'};
                                if ([200, 206].indexOf(this.status) < 0) {
                                    res.message = this.status + ': ' + this.statusText;
                                } else try {
                                    res = JSON.parse(this.responseText);
                                    f.insert(res.data || {});
                                    var validator = (p && p.validator || f.validator);
                                    if (typeof validator == 'function') validator.call(f, res.data);
                                } catch (e) {
                                    res.message = 'Cервер вернул не коректные данные';
                                }
                                f.xhr = res;
                                if (p && typeof p.fn == 'function') p.fn.call(f, res);
                                return f;
                            });
                    break;
                default: f.reset();
            } else f.reset();
            return f;
        };
        return f;
    }
    g.JSON.form = form;

    /**
     * @function router
     * Хелпер Маршрутизатор SPA
     *
     * @method { function () } frgm
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
            clr: function(path) { return path.toString().replace(/\/$/, '').replace(/^\//, '') },
            frgm: isHistory ?
                function(){
                    var f = this.clr(decodeURI(location.pathname + location.search)).replace(/\?(.*)$/, '');
                    return this.clr(this.root != '/' ? f.replace(this.root, '') : f);
                } :
                function(){
                    var m = window.location.href.match(/#(.*)$/);
                    return m ? this.clr(m[1]) : '';
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
                var f = fr || this.frgm();
                for(var i in this.rt) {
                    var m = f.match(this.rt[i].re);
                    if (m) { m.shift(); this.rt[i].handler.apply({}, m); return this }
                }
                return this;
            },
            lsn: function() {
                var s = this, c = s.frgm(), fn = function() { if(c !== s.frgm()) { c = s.frgm();  s.chk(c); } return s };
                clearInterval(s.itv);
                s.itv = setInterval(fn, 50);
                return s;
            },
            set: isHistory ?
                function(path) {
                    history.pushState(null, null, this.root + this.clr((path || '')));
                    return this;
                } :
                function(path) {
                    window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + (path || '');
                    return this;
                }
        }
    }
    g.router = router('/');

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
            opt.rs = Object.assign({'Content-type':'application/x-www-form-urlencoded'}, params.rs);
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
    }
    g.xhr = xhr();

    /**
     * @function tmpl
     * Хелпер для генерации контескта
     *
     * @argument { String } str (url | html)
     * @argument { JSON } data объект с даннными
     * @argument { undefined | function } cb callback функция
     *
     * @result { String }
     */
    var tmpl = function tmpl(str, data, cb, opt) {
        var compile = function(str) {
                return new Function('_e',"var p=[], print=function(){ p.push.apply(p,arguments); };with(_e){p.push('"+str
                        .replace(/[\r\t\n]/g," ").split("{%").join("\t").replace(/((^|%})[^\t]*)'/g,"$1\r")
                        .replace(/\t=(.*?)%}/g,"',$1,'").split("\t").join("');").split("%}").join("p.push('").split("\r")
                        .join("\\'")+ "');} return p.join('').replace(/<%/g,'{%').replace(/%>/g,'%}');")},
            build = function(str, id){
                var isId = typeof id !== 'undefined';

                if (isId && g.tmpl.cache[id]) { result = g.tmpl.cache[id].call(g.tmpl, data || {}); if(typeof cb == 'function') cb.call(g.tmpl, result); return result }
                var result = null, pattern = null;
                try {
                    pattern = compile(str);
                    if (isId) g.tmpl.cache[id] = pattern;
                    result = pattern.call(g.tmpl, data || {});
                    if (typeof cb == 'function') cb.call(pattern || g.tmpl, result);
                } catch(e) { console.error(e)  }
                return result;
            };
        switch (true) {
            case str.match(/^(?:https?:\/\/)?(?:(?:[\w]+\.)(?:\.?[\w]{2,})+)?([\/\w]+)(\.[\w]+)/i)? true: false: var id = str.replace(/(\.|\/|\-)/g, '');
                if (g.tmpl.cache[id]) return build(null, id);
                return g.xhr.request(Object.assign({url:str, async: (typeof cb == 'function')}, opt)).result(function(e){
                    if ([200, 206].indexOf(this.status) < 0)  console.warn(this.status + ': ' + this.statusText);
                    else build(this.responseText, id);
                });
            case !/[^\w\-\.]/.test(str) : return build( g.document.getElementById(str).innerHTML, str );
            default: return build( str );
        }
    };
    tmpl.cache = {};
    g.tmpl = tmpl;

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
    };
    g.storage = storage();

}(window));