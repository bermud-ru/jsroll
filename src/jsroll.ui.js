/**
 * @app jsroll.ui.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 16/04/2018
 * @status beta
 * @version 2.1.1b
 * @revision $Id: jsroll.ui.js 2.1.1b 2018-04-16 10:10:01Z $
 */

var Application = function (app) {
    var self = this;
    if (window.addEventListener) {
        window.addEventListener('online', function (e) { return self.online(e); }, false);
        window.addEventListener('offline', function (e) { return self.offline(e); }, false);
        document.addEventListener('DOMContentLoaded', function(event) { return self.__ready__ = true; }, false);
        window.addEventListener('popstate', function(event) {
            var hash = (location.pathname+location.search).hash();
            if (hash !== urn.handled.hash) {
                urn.handled.hash = hash;
                if (typeof urn.handled.handler === 'function') urn.handled.handler.call(self, location.pathname, location.search, false);
            }
            return false;
            // var r = confirm("You pressed a Back button! Are you sure?!");
            // if (r === true) {
            //     // Call Back button programmatically as per user confirmation.
            //     history.back();
            //     // Uncomment below line to redirect to the previous page instead.
            //     // window.location = document.referrer // Note: IE11 is not supporting this.
            // } else {
            //     // Stay on the current page.
            //     history.pushState(null, null, window.location.pathname+window.location.search);
            // }
            // history.pushState(null, null, window.location.pathname+window.location.search);
        }, false);
        this.events = {};
        // var target = document.createTextNode(null);
        var target = new EventTarget();
        // Pass EventTarget interface calls to DOM EventTarget object
        this.addEventListener = target.addEventListener.bind(target);
        this.removeEventListener = target.removeEventListener.bind(target);
        this.dispatchEvent = function (e) {
            if (this.events.hasOwnProperty(e.type)) {
                var self = this;
                this.events[e.type].forEach(function (o, i) {
                   if (o.parentNode) o.dispatchEvent(e); else self.events[e.type].splice(i,1);
                });
            } else {
                target.dispatchEvent(e);
            }
        }
        this.eventListener = function (el,event,fn,opt) {
            var self = this, a = el instanceof Array ? el : [el];
            if (this.events.hasOwnProperty(event)) {
                a.forEach(function (o) {
                    if ((self.events[event].indexOf(o)) === -1) { self.events[event].push(o); }
                })
            } else {
                this.events[event] = a;
            }
            a.forEach(function (o){ o.addEventListener(event,fn,opt) });
        }
    } else {
        document.body.ononline = function (e) { return self.online(e);  };
        document.body.onoffline = function (e) { return self.offline(e); };
        document.onreadystatechange = function (e) {
            if (document.readyState === "complete") { return self.ready(e); }
        }
        // window.onhashchange = function() {
        //     console.log(window.location.pathname+  window.location.search);
        // }
    }
    self.merge(str2json(storage.getItem('Application')));
    // if (app && typeof app === 'object') this.merge(app);
}; Application.prototype = {
    __version_pool__: [],
    $version: null,
    get version() { return this.$version },
    set version(s) {
        if (this.$version !== s) {
            var self = this, wait = function() {
                if (self.__ready__) {
                    if (wait.timer) clearTimeout(wait.timer);
                    self.__version_pool__.forEach(function (v) { v.fn.apply(app, v.args) });
                    self.$version = s
                } else {
                    return wait.timer = setTimeout( wait, 50);
                }
            }
            return wait();
        }
    },
    __ready__: false,
    notsupport:null, //'/notsupport.html',
    url: null,
    socket: null,
    run: function () {
        if (typeof window.ui === 'undefined') return this.notsupport ? window.location.href = this.notsupport : alert('Application not supported!');
        if (navigator.onLine) {
            this.online();
            // if (this.url) { try { this.socket = window.ws(this.url); } catch (e) { console.error(e); } }
        } else {
            this.offline();
        }
    },
    online: function (e) { return console.log('app online ' + datetimer(new Date())); },
    offline: function (e) { return console.warn('app offline ' + datetimer(new Date())); },
    /**
     *
     * @param fn { closure }
     * @param args { arguments }
     * @return {*|number}
     */
    changeVersion: function (fn, args) { return this.__version_pool__.push({fn:fn, args:args||[]}) },
    /**
     *
     * @param fn { closure }
     * @param args { arguments }
     * @return {*|number}
     */
    onready: function (fn, args) {
        var self = this, wait = function(after, args) {
            if (self.__ready__) {
                if (wait.timer) clearTimeout(wait.timer);
                return fn.apply(self, args||[]);
            } else {
                return wait.timer = setTimeout(function () { wait(fn, args); }, 50);
            }
        }
        return wait(fn, args);
    },
    /**
     *
     * @param e { Event }
     * @return {boolean}
     */
    resize: function (e) { return false; },
    serialize: function (e) {
        var props = {}, self = this;
        Object.getOwnPropertyNames(self).forEach( function (i ) {
            if (i.startsWith('$')) { props[i] = self[i]; }
        });
        if (Object.keys(props).length === 0) {
            storage.removeItem('Application');
        } else {
            storage.setItem('Application', JSON.stringify(props));
        }
    },
    confirmReload: false,
    reload: function (e) {
        if (e || (e = window.event)) {
            //e.cancelBubble is supported by IE - this will kill the bubbling process.
            e.cancelBubble = true;
            e.returnValue = this.confirmReload; //This is displayed on the dialog
            //e.stopPropagation works in Firefox.
            if (e.stopPropagation) {  e.stopPropagation();  e.preventDefault(); }
            return  false;
        }
        return this.confirmReload;
    },
    destroy: function (e) {
        this.serialize();
        if (!navigator.sendBeacon || !navigator.onLine) return;
        var url = "/logout";
        // // Create the data to send
        var data = "state=" + event.type + "&location=" + location.href;
        // // Send the beacon
        var status = navigator.sendBeacon(url, data);
        // // Log the data and result
        console.log("; data = ", data, "; status = ", status);
    },
    setCookie: function (name,value,days,path) {
        if (typeof name !== 'string') return ;
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path="+(path||'/');
    },
    getCookie: function (name) {
        if (typeof name !== 'string') return ;
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    clearCookie: function (name) {
        if (typeof name === 'string') document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
};

if (window.app === undefined ) {
    window.app = new Application();
    window.onload = function (event) { return app.run(event); }
    window.onunload = function (event) { return app.destroy(event); };
    window.onresize = function (event) { return app.resize(event); };
    window.onbeforeunload = function (event) { if (app.confirmReload) return  app.reload(event); };
    // document.addEventListener('deviceready', function() {
    //     // Heavy cordova sorces redy to work (espesial for
    //     // app.webDB = window.openDatabase("Database", "1.0", 'Check DB instance', 200000);
    // }, false);
}

(function ( g, undefined ) {
    'suspected';
    'use strict';

    /**
     * @class css - Helper for Cascading Style Sheets properties of HTMLelements
     * @param instance
     * @returns {css}
     */
    var css = function(instance){
        this.instance = this.el(instance).instance;
        return this;
    }; css.prototype = {
        /**
         * @function el setup instance of HTMLelements
         * @param i
         * @returns {css}
         */
        el: function(i) {
            this.instance = typeof i === 'string' ? g.document.querySelector(i) : i;
            return this;
        },
        /**
         * @function  style - setup value of Cascading Style Sheets properties of HTMLelement
         * @param k
         * @param v
         * @returns {css}
         */
        style:function(k,v) {
            this.instance.style[k] = v;
            return this;
        },
        /**
         * @function has return [" <clssname>", ...] | null is exist Cascading Style Sheets class in HTMLelement
         * @param c {string|array}
         * @returns {Array|{index: number, input: string}}
         */
        has: function(c){
            var cls = this.instance.className;
            if (typeof c !== 'string' && cls) return null;

            var result = []; c .split(' +').forEach(function (e, i, a) {
                if (cls.match(re('/(?:^|\\s)' + e + '(?!\\S)/'))) result.push(e);
            });
            return result.length ? result : null;
        },
        /**
         * @function replace Repalace mephod Cascading Style Sheets class name
         * @param r {regexp|substr}
         * @param n {newSubStr|function}
         * @param f flags
         * @returns {css}
         */
        replace: function (r, n, f) {
            this.instance.className = this.instance.className.replace(r, n, f);
            return this;
        },
        /**
         * @function add - Add Cascading Style Sheets class to HTMLelement
         * @param c {string|array}
         * @returns {css}
         */
        add: function (c) {
            var a = (typeof c === 'string') ? c.split(/(\s+|,)/): c, self = this;
            a.forEach(function (v,i,a) {
                if (self.instance && !self.has(v)) self.instance.className += ' ' + v;
            });
            return this;
        },
        /**
         * @function del - Delete Cascading Style Sheets class from HTMLelement
         * @param c {string|array}
         * @returns {css}
         */
        del: function (c) {
            var h = this.instance;
            if (typeof c === 'string' || c instanceof Array) {
                var a = typeof c === 'string' ? c.split(/(\s+|,)/) : c;
                a.forEach(function (v, i, a) {
                    h.className = h.className.replace(re('/(?:^|\\s)' + v + '(?!\\S)/'), '').replace(/\s+/, ' ').trim();
                });
            } else if (typeof c === 'object') {
                h.className = h.className.replace(c, '').replace(/\s+/, ' ').trim();
            }
            return this;
        },
        /**
         * @function tgl - Toggle Cascading Style Sheets class of HTMLelement
         * @param c {string|array}
         * @returns {css}
         */
        tgl: function (c) {
            if (this.instance) {
                if (!this.has(c)) this.instance.className += ' ' + c;
                else this.instance.className = this.instance.className.replace(re('/(?:^|\\s)' + c + '(?!\\S)/'), '').trim();
            }
            return this;
        }
    }; g.css = new css(g);

    /**
     * TODO: Fix selected (not work in FF)
     */
    Object.defineProperty(g, 'selected', {
        get: function selected() {
            return g.getSelection ? g.getSelection().toString() : g.document.selection.createRange().text;
            // return  g.getSelection ? g.getSelection().toString() : // Not IE, используем метод getSelection
            //     g.document.selection.createRange().text; // IE, используем объект selection
        }
    });
    g.emptySelection = function (){
        if (g.getSelection) {
            if (g.getSelection().empty) {  // Chrome
                g.getSelection().empty();
            } else if (g.getSelection().removeAllRanges) {  // Firefox
                g.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            g.selection.empty();
        }
    }

    /**
     * CustomEvent
     *
     * @param event { eventinterface }
     * @param params { object }
     * -- capture:  Boolean указывает, что события этого типа будут отправлены зарегистрированному обработчику listener
     * перед отправкой на EventTarget, расположенный ниже в дереве DOM.
     * -- once: Boolean указывает, что обработчик должен быть вызван не более одного раза после добавления. Если true,
     * обработчик автоматически удаляется при вызове.
     * -- passive:  Boolean указывает, что обработчик никогда не вызовет preventDefault(). Если всё же вызов будет
     * произведён, браузер должен игнорировать его и генерировать консольное предупреждение.
     *  polyfill
     */
    var CustomEvent = ('CustomEvent' in g ? g.CustomEvent : (function () {
        function CustomEvent ( event, params ) {
            var opt = Object.assign({ bubbles: false, cancelable: false, detail: undefined }, params);
            var event = g.document.createEvent( 'CustomEvent' );
            event.initCustomEvent( event, opt.bubbles, opt.cancelable, opt.detail );
            return event;
        }
        CustomEvent.prototype = g.Event.prototype;
        return CustomEvent;
    })()); g.ce = CustomEvent;

    Element.matches = Element.matches || Element.matchesSelector || Element.webkitMatchesSelector || Element.msMatchesSelector ||
        function(selector) {
            var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
            while (nodes[++i] && nodes[i] !== node);
            return !!nodes[i];
    };

    /**
     * @class ui - HTML elements Extention
     * @param instance
     * @returns {*}
     */
    var ui = function(instance) {
        if (instance.hasOwnProperty('ui')) return instance;
        this.instance = instance || g;
        if (instance) {
            if (this.instance instanceof Array) this.instance.__proto__.css = new css(this.instance);
            else this.instance.css = new css(this.instance);
            if (this.instance.parentElement) this.wrap(this.instance.parentElement);
        }
        return this;
    }; ui.prototype = {
        wrap:function(el, v){
            if (el && !el.hasOwnProperty('ui')) {
                if (el instanceof Array) el.__proto__.ui = new ui(el); else el.ui = new ui(el);
                if (typeof v == 'string') g[v]=el;
            }
            return el;
        },
        /**
         *
         * @param s { string }
         * @param fn { closure }
         * @param args { arguments }
         * @return { null|HTMLElement }
         */
        el: function (s, fn, args) {
            var el = null;
            if (typeof s === 'string') {
                if (!s.match(/^#*/)) el = g.document.getElementById(s.replace(/^#/, ''));
                else el = this.instance.querySelector(s);
            } else if ( s instanceof HTMLElement) { el = s }
            if (el) {  this.wrap(el); if (typeof fn === 'function') fn.apply(el, args || []); }
            return el;
        },
        /**
         *
         * @param s { string }
         * @param fn { closure }
         * @param args { arguments }
         * @return { null|HTMLElement }
         */
        els: function (s, fn, args) {
            var r = [], self = this;
            if (typeof s === 'string'|| s instanceof Array) {
                var c = typeof s === 'string' ? s.split(/\s*,\s*/) : s;
                c.forEach((function (x) {
                    r.push.apply(r, obj2array(self.instance.querySelectorAll(x), []).map(function (e, i, a) {
                        if ( e instanceof HTMLElement ) self.wrap(e);
                        if (typeof fn == 'function') fn.apply(e,args?args.push(i).push(a):[i,a]);
                        return e;
                    }));
                }).bind(self));
            }
            return self.wrap(r);
        },
        attr: function (a, v) {
            if (a === undefined) {
                var attrs = {}, n;
                for (var i in this.instance.attributes)
                    attrs[(n = this.instance.attributes[i].nodeName)] = QueryParam(this.instance.getAttribute(n),QueryParam.STRNULL);
                return attrs;
            } else if (typeof a === 'object' && typeof v === 'undefined') {
                for (var i in a) if (! /\d+/.test(i)) this.instance.setAttribute(i,a[i]);
                return this;
            } else if (typeof a === 'string' && typeof v === 'undefined') {
                var mask = a.indexOf('*') !== -1 ? re('/'+a.split('*')[0]+'/i') : null;
                if (mask) {
                    var data = {};
                    obj2array(this.instance.attributes).forEach(function (e, i, a) {
                        var name = e.nodeName.toString();
                        if (mask.test(name) && (name = name.replace(mask, '')))
                            data[name] = str2json(e.value, QueryParam(e.value,QueryParam.STRNULL));
                    });
                    return data;
                } else {
                    return str2json(this.instance.getAttribute(a), QueryParam(this.instance.getAttribute(a),QueryParam.STRNULL));
                }
            } else if (typeof a === 'string') {
                if (v === null) this.instance.removeAttribute(a);
                else if (typeof v === 'object') this.instance.setAttribute(a, JSON.stringify(v));
                else this.instance.setAttribute(a, v);
            }
            return this;
        },
        tpl: function (str, data, cb, opt) {
            var a = this.instance instanceof Array ? this.instance : [this.instance];
            a.forEach( function (v, i, a) {
                v.ui.inner = tpl(str, data, cb, opt);
            });
            return this.instance;
        },
        merge: function () {
            var args = arguments, a = this.instance instanceof Array ? this.instance : [this.instance];
            a.forEach( function (i) { merge.apply(i, args); });
            return this.instance;
        },
        src: function (e, def) {
            var el = e ? (e.target || e.srcElement || e) : def;
            if (el instanceof HTMLElement) return this.wrap(el);
            return el;
        },
        de: function (event, opt){
            this.instance.dispatchEvent(new CustomEvent(event, opt||{}));
        },
        /**
         * Обработчик события
         *
         * @param event { string }
         * @param fn { closure }
         * @param args { IArguments }
         * @param opt {false|Object}
         * -- capture:  Boolean указывает, что события этого типа будут отправлены зарегистрированному обработчику listener
         * перед отправкой на EventTarget, расположенный ниже в дереве DOM.
         * -- once: Boolean указывает, что обработчик должен быть вызван не более одного раза после добавления. Если true,
         * обработчик автоматически удаляется при вызове.
         * -- passive:  Boolean указывает, что обработчик никогда не вызовет preventDefault(). Если всё же вызов будет
         * произведён, браузер должен игнорировать его и генерировать консольное предупреждение.
         * @return {*|Window}
         */
        on: function (event, fn, args, opt) {
            var a = this.instance instanceof Array ? this.instance : [this.instance];
            event.split(/\s*,\s*/).forEach( function(e) {
                var tags = e.split(':'), event = tags.pop();
                a.forEach(function (i) {
                    if (!tags.length || tags.indexOf(i.tagName) >-1)
                        i.addEventListener(event, function (e) {return fn.apply(i,args?args.unshift(e):[e])}, opt ? opt : false);
                });
            });
            return this.instance;
        },
        off: function (event, fn, opt) {
            var a = this.instance instanceof Array ? this.instance : [this.instance];
            event.split(/\s*,\s*/).forEach( function(e) {
                var tags = e.split(':'), event = tags.pop();
                a.forEach( function (i) {
                    if (!tags.length || tags.indexOf(i.tagName) >-1) i.removeEventListener(event, fn, opt ? opt : false);
                });
            });
            return this.instance;
        },
        matches: function (s) {
            var el = this.instance;
            return typeof s === 'string' ? s.split(/\s*,\s*/).some( function(e) { return el.matches(e); }) : false;
        },
        /**
         * Делигировать событие
         *
         * @param s { string }
         * @param event { string }
         * @param fn { closure }
         * @param args { IArguments }
         * @param opt {false|Object}
         * @return {*|Window}
         */
        dg: function (s, event, fn, args, opt) {
            var a = this.instance instanceof Array ? this.instance : [this.instance];
            event.split(/\s*,\s*/).forEach( function(e) {
                var tags = e.split(':'), event = tags.pop();
                a.forEach( function (i) { i.addEventListener(event, function(e) {
                    var self = this, found = false, el = g.ui.src(e);
                    // while (el && el.matches && el !== this && !(found = el.ui.matches(s))) el = el.parentElement;
                    while (el && el !== self && !(found = el.ui.matches(s))) el = el.parentElement;
                    if (found && (!tags.length || tags.indexOf(el.tagName) >-1)) { return fn.apply(el,args?args.unshift(e):[e]); }
                    return found;
                }, opt ? opt : false); });
            });
            return this.instance;
        },
        /**
         *
         * @param d { string }
         * @param mime { string }
         * Default: [text/xml], результирующий объект будет типа XMLDocument (#document->...) !+ xmlns="http://www.w3.org/1999/xhtml"
         * [application/xml] возвращает Document, но не SVGDocument или HTMLDocument
         * [image/svg+xml] возвращает SVGDocument, который так же является экземпляром класса Document
         * [text/html] возвращает  HTMLDocument (<html><body>...</body></html>, который так же является экземпляром класса Document
         * [html/dom] Возвращает DOM структуру связанных елементов (exampl: conteiner.appendChild(DOM))
         **/
        dom: function(d, mime) {
            if ( !d || typeof d !== 'string' ) return null;
            var nodes = mime === 'html/dom' ? g.ui.wrap(dom(d, 'text/html')).ui.el('body') : dom(d, mime);
            return g.ui.wrap(nodes.childNodes.length > 1 ? nodes.childNodes : nodes.childNodes[0]);
        },
        set inner(s) {
            var a = this.instance instanceof Array ? this.instance : [this.instance];
            a.forEach( function (el, i) {
                var cntx = s instanceof Array ? (s[i] || s[0]) : s;
                if (cntx instanceof HTMLElement) el.appendChild(cntx); else el.innerHTML = cntx;
            });
        },
        up: function (d, mime) {
            var nodes = dom(d, mime).childNodes, el = this.instance === g.document ? ui.el('body') : this.instance;
            for (var i = 0, l = nodes.length; i < l; i++) { el.appendChild(nodes[i]); }
            return el;
        },
        rm: function (s) {
            if ( typeof s === 'string' ) {
                this.els(s).forEach(function (el) { el.parentNode.removeChild(el); });
            } else {
                var a = this.instance instanceof Array ? this.instance : [this.instance];
                a.forEach( function (el) { el.remove(); });
            }
            return this.instance;
        },
        get active() {
            return (this.instance instanceof Element && (this.instance === g.document.activeElement));
        },
        focus: function(s) {
            var el = this.instance;
            if (s) { el = (typeof s === 'string' ? this.el(s): s); }
            setTimeout(function(e) { return el.focus(); }, 0);
            return el;
        }
    }; g.ui = new ui(document);

    /**
     * @function InputHTMLElementValue
     * Хэлпер получения HTML элемента
     *
     * @param { Element } el
     * @param { * } def - Default value
     * @returns { * }
     */
    var InputHTMLElementValue = function(el, def) {
        var v = null;
        if (el instanceof Element) {
            switch ((el.getAttribute('type') || 'text').toLowerCase()) {
                case 'checkbox': case'radio':
                    var on = el.value.indexOf('on') >-1;
                    v = el.checked ? ( on ? 1 : el.value) : (on ? 0 : '');
                    break;
                default:
                    v = el.value || def;
            }
        }
        return QueryParam(v, QueryParam.NULLSTR);
    };

    /**
     * @function getElementsValues
     *
     * pack - Element Attribute 2^0 + 2^1 + 2^2 ... 2^n values of array name bits AND in single value
     * @param { Element [] } elements
     * @param { int } opt
     * @returns { Object }
     */
    var getElementsValues = function(elements, opt) {
        var empty = QueryParam(null, opt || QueryParam.NULLSTR), data = {}, next = function(keys, d, f, el) {
            if ( d === undefined ) d = [];
            if (!keys || !keys.length) {
                var g = ['checkbox','radio'].indexOf((el.getAttribute('type') || 'text').toLowerCase()) >-1;
                if (f) {
                    if ( d[f] === undefined || (g && d[f] === empty) ) {
                        d[f] = InputHTMLElementValue(el);
                    } else if ( !g || el.checked ) {
                        if (!!el.getAttribute('pack') && String(Number(el.value)) === String(el.value)) {
                            d[f] = Number(d[f]) | Number(el.value);
                        } else {
                            if ( !(d[f] instanceof Array) ) d[f] = [d[f]];
                            d[f].push(InputHTMLElementValue(el));
                        }
                    }
                }
                if (d[f] === undefined && g && !el.checked) d[f] = empty;
                return d;
            }

            var key = keys.shift().replace(/^\[+|\]+$/g, '');
            if (f) {
                if ( d[f] === undefined ) d[f] = key ? {} : [];
                return next(keys, d[f], key, el);
            }

            return next(keys, d, key, el);
        };

        if (elements.length) obj2array(elements).map(function(v) {
            var field = null;
            if ((v.getAttribute('type') || 'text') !== 'button' && (field = v.name.match(/^\w+/g))) {
                if (!data.hasOwnProperty(field)) data[field[0]] = undefined;
                return next(v.name.match(/(\[\w+\]?)/g), data, field[0], v);
            } return undefined;
        });
        return data;
    };

    /**
     * @function setValueInputHTMLElement
     *
     * @param { Element } el
     * @param { * } value
     */
    var setValueInputHTMLElement = function(el, value) {
        switch ( (el.getAttribute('type') || 'text').toLowerCase() ) {
            case 'checkbox': case 'radio':
                if (!!el.getAttribute('pack') && String(Number(el.value)) === String(el.value)) {
                    el.checked = (Number(value) & Number(el.value)) === Number(el.value);
                } else {
                    el.checked = el.value === 'on' ? !!value : ((value instanceof Array) ? value.indexOf(QueryParam(el.value)) >-1 : String(el.value) === String(value));
                }
                break;
            case 'number':
                el.value = Number(value);
                break;
            case 'text': case 'textarea': case 'hidden': case 'password':
            case 'date': case 'time': case 'datetime-local': case 'month': case 'week':
            case 'color': case 'range': case 'search':
            case 'email': case 'tel': case 'url':
            default:
                if (!(el.value = QueryParam(value, QueryParam.NULLSTR)) && el.tagName === 'SELECT') {
                    el.selectedIndex = 0;
                }
        }
    };

    /**
     * @function functionsetInputHTMLElementFromObject
     *
     * @param { HTMLFormElement }  el
     * @param { Object } v - объете данных
     * @param { Boolean } required - обязательное поле
     * @param { string } alias альтернативное имя поля в объете данных
     * @returns { string ['none', 'success', 'warn', 'error'] }
     */
    var setInputHTMLElementFromObject = function(el, v, required, alias) {
        if (el && el.tagName) {
            el.value = null;
            if (!(this instanceof HTMLElement)) el.required = !!required;
            if (typeof v === 'object' && v && v.hasOwnProperty(alias || el.name)) {
                el.value = v[alias || el.name];
            } else {
                el.value = typeof v === 'undefined' ? null : v;
            }
            var status = el.required ? input_validator(el) : !!el.value;
            if (this instanceof HTMLElement){
                if (!!required && !status) {
                    this.status = 'error';
                } else if (this.value) {
                    this.status = 'success';
                }
            }
            return status;
        }
        return 'none';
    };

    /**
     * @function crud - Create Read Update Delete interface
     *
     * @param meta { Object }
     * @param api { Object } provide interface GET,DEL,POST,PUT
     */
    var crud = function (meta, api) {
        this.index = null;
        this.meta = meta;
        this.api = api ;
        return this;
    };
    crud.prototype = Array.prototype;
    crud.prototype.__data__ = [];
    crud.prototype.item = function (idx) {
        return this.__data__[idx] || this.meta;
    };
    Object.defineProperty(crud.prototype, 'data', {
        set: function (data) {
            var self = this;
            if (data instanceof Array) {
                self.__data__ = data.map(function (v) {return Object.merge(self.meta, v)});
                self.index = 0;
            } else { self.__data__ = []; }
        },
        get: function() { return this.__data__; },
        enumerable: true, configurable: true
    });
    ['post','put','get','del'].map(function (v) {
        crud.prototype[v] = function (data, opt) {
        var o = Object.merge(opt,{data:data_maker(data||this.meta,opt.fields)});
        o['method'] = {'post':'POST','put':'PUT','get':'GET','del':'DELETE'}[v];
        return typeof this.api === 'function' ? this.api(o) : this.api[v](o);
    }});
    g.crud = crud;

    /**
     * dataObject
     *
     * @returns {function(*=): function(*=): boolean}
     */
    var dataObject = function() {
        return function (o) {
            var index = is_empty(o.index) || parseInt(o.index);
            var pk = o.primaryKey ? o.primaryKey : null;
            var rows = o.crud;
            var fn, worker = function (row) {
                switch (opt.method.toLowerCase()) {
                    case 'del': rows.splice(index,1); break;
                    case 'post': if (pk) row[pk] = Math.max.apply(Math, rows.map(function(r) { return r[pk]; })) + 1;
                        rows.push(row); break;
                    case 'put': rows[index].merge(row); break;
                    case 'get': default:
                }
                if (typeof opt.done === 'function') opt.done(index !== null ? rows[index] : rows);
                return worker.done = true;
            }
            var opt = Object.assign({ srcElement: worker, method: 'get', index: index, rows: rows, timeout: 1000}, o);

            worker.timeout = function () {
                var res = ((Date.now() - worker.start) < opt.timeout);
                if (!res) {
                    clearTimeout(worker.instance);
                    if (typeof opt.cansel === 'function') opt.cansel(); else console.warn('Worker timeout');
                }
                return res;
            };

            worker.start = Date.now();
            worker.done = false;

            if ( (typeof opt.before === 'function') ? [undefined,true].indexOf(opt.before()) >-1 : true ) {
                (fn = function () {
                    if (worker.timeout()) worker.instance = setTimeout(function () {
                        worker(o.data);
                        if (!worker.done) return fn();
                        if (typeof opt.after == 'function') opt.after();
                        return false;
                    }, 0);
                })();
            }
            return worker;
        };
    }; g.dataObject = dataObject;

    /**
     * XHR Interface for common query
     *
     * @type {{fail: (function(*, *): void), method: string, before: (function(*): boolean), after: (function(*, *): boolean), api: (function(*=): (null|XMLHttpRequest)), done: (function(*=): boolean), url: string}}
     */
    g.group_xhr_opt = {
        method: 'post',
        url: location.pathname, //location.href,
        before: function (e) { return true; },
        after: function (e) { this.hXHR = null; return false; },
        done: function(e) {
            var res = g.ui.src(e).responseJSON;
            if ( res.result === 'error' ) { console.warn(res.message); } else { console.log('stored success!'); }
            return false;
        },
        fail: function (e) { return console.error(g.ui.src(e).responseJSON.message); },
        cansel: function (e) { if (this.hXHR) this.hXHR.halt(e); },
        hXHR: null,
        crud: function (params) { return this.hXHR = xhr(params); }
    };

    /**
     * @Helper group
     * Позвозят работать с группой элементов, выбранных по селектору. как с элементом форма
     * @param { HTMLForm | Element [] } els
     * @param { Object } opt
     */
    var group = function (els, opt) {
        var self = this, native = true;
        self.opt = Object.merge({event: null, srcElement:this, method:null, done:null, fail: null, keyup: null, submit: null, crud:null}, opt);
        self.__elements = typeof els === 'string' ? ui.els(els) : els;
        self.form = {};

        if ( self.__elements instanceof HTMLFormElement ) {
            self.form = self.__elements; native = false;
            Object.defineProperty(self.opt, 'method', {
                enumerable: true,
                configurable: true,
                get: function method () {
                    return self.form.getAttribute('method') || 'get'
                }
            });
            self.opt.url = self.form.getAttribute('action') || self.opt.url;
            self.form.addEventListener('submit',self.onsubmit.bind(self), true);
            self.__elements = g.ui.wrap(obj2array(self.form.elements).map(function (el) { return g.ui.wrap(el);}));
        }

        self.__elements.forEach(function (v){ v.group = self; if (native) self.form[v.name] = v; });
        if ( self.opt.submit ) {
            var submit = self.opt.submit instanceof Array ? self.opt.submit : [self.opt.submit];
            submit.forEach(function (v){ if (v instanceof HTMLElement) v.ui.on('click', self.onsubmit.bind(self)); });
        }

        self.hashing();
        if (self.opt.change) {
            var fieldset;
            if (fieldset = self.querySelector('fieldset')) fieldset.ui.on('change', self.opt.change.bind(self));
            else self.elements.ui.on('change', self.opt.change.bind(self));
        }
    }; group.prototype = {
        form: null,
        __elements: [],
        get elements() { return this.__elements; },
        get length() { return this.elements.length; },
        getElementById: function (n) {
            if (typeof n === 'undefined') return this.elements;
            var r = []; for(var i = 0, l = this.length; i < l; i++) {
                if (this.elements[i].getAttribute('name') === n || this.elements[i].getAttribute('id') === n) {
                    r.push(this.elements[i]);
                }
            }
            return r.length === 0 ? null : (r.length === 1 ? r[0] : g.ui.wrap(r));
        },
        querySelector: function (s) {
            if (typeof s === 'undefined') return this.elements;
            var r = []; for(var i = 0, l = this.length; i < l; i++) {
                if (this.elements[i].matches(s)) { r.push(this.elements[i]); }
            }
            return r.length === 0 ? null : (r.length === 1 ? r[0] : g.ui.wrap(r));
        },
        onsubmit: function(e) {
            e.stopPropagation();
            this.opt.event = e;
            if (e instanceof MouseEvent || e instanceof KeyboardEvent && (eventCode(e) === 13 || eventCode(e) === 'Enter')) {
                this.store(this.data);
            }
            return false;
        },
        __changed: null,
        hashing: function(s) { this.__changed = JSON.stringify(s ? s : this.data).hash(); },
        get isChanged() { return this.__changed !== JSON.stringify(this.data).hash(); },
        __valid: [],
        set valid (res) {
            this.__valid = [];
            if (res && typeof res.message === 'object') {
                for (var i = 0, l = this.elements.length; i < l; i++) {
                    if (res.message[this.elements[i].name]) {
                        this.elements[i].status = res.result || 'error';
                        this.__valid.push(this.elements[i]);
                    } else {
                        this.elements[i].status = 'none';
                    }
                }
            }
        },
        get valid () {
            this.__valid = []; var self = this;
            this.elements.forEach(function (e,i,a) { if (!input_validator(e)) self.__valid.push(e); });
            return !this.__valid.length ;
        },
        reset: function (attr) {
            if (this.form) this.form.reset();
            this.forEach(this.__elements, function (el) {
                if (['checkbox','radio'].indexOf((el.getAttribute('type') || 'text').toLowerCase()) >-1)
                    el.checked = el.ui.attr(attr||'default') || false;
                else switch (el.tagName) {
                    case 'SELECT':
                        setValueInputHTMLElement(this,el.ui.attr(attr||'default') || 0);
                        break;
                    case 'INPUT':
                    case 'TEXTAREA':
                    default:
                        setValueInputHTMLElement(this, el.ui.attr(attr||'default') || '');
                }
                el.status = 'none';
            });
            return this;
        },
        set data(d) {
            if (d && typeof d === 'object') {
                for (var i = 0, l = this.elements.length; i < l; i++) {
                    setValueInputHTMLElement(this.elements[i],(d.hasOwnProperty(this.elements[i].name)) ? d[this.elements[i].name] : null);
                }
            }
        },
        get data() { return getElementsValues(this.elements); },
        store: function (data) {
            try {
                if (this.opt.crud) {
                    if (data && this.opt.fields) data = data_maker(data, this.opt.fields);
                    if (typeof this.opt.crud === 'function') { this.opt.crud(Object.assign( this.opt, {data: data})); }
                    else { this.opt.crud[this.opt.method.toLocaleLowerCase()](this.opt, data) }
                    return this;
                }
            } catch (e) {
                if (typeof this.opt.fail === 'function') this.opt.fail(e);
            }
            if (typeof this.opt.after === 'function') this.opt.after.call(this);
            return this;
        }
    }; g.group = group;

    /**
     * @function isvalid
     *
     * @param { Element } element
     * @returns {boolean}
     */
    g.isvalid = function (element) {
        var res = true, validator = null, pattern;
        if (element.validity.typeMismatch) res = false;
        else if ((element.getAttribute('required') !== null) && !element.value) res = false;
        else if ((element.getAttribute('required') === null) && !element.value) res = true;
        else if ((pattern = element.getAttribute('pattern')) === null) res = true;
        else {
            if (!element.hasOwnProperty('checkPattern')) {
                element.regex = re(pattern);
                Object.defineProperty(element, 'checkPattern', {
                    get: function checkPattern() {
                        if (typeof this.regex === 'object') {
                            this.regex.lastIndex=0;
                            return this.regex.test(this.value.trim())
                        } else {
                            return true
                        }
                    }
                });
            }
            res = element.checkPattern;
        }
        if (typeof (validator = element.getAttribute('validator') || element['validator']) === 'function')
        {
            res = validator.apply(element, [res]);
        } else if (element.hasAttribute('validator')) {
            validator = func(element.getAttribute('validator'));
            res = validator.apply(element, [res]);
        }
        return res;
    };

    /**
     * UIElementDecorator
     * bind STATUS property InputHTMLElement
     *
     * @param { Element } el
     * @returns {*}
     */
    g.UIElementDecorator = function(el) {
        if (el instanceof Element && !el.hasOwnProperty('status') && !el.css.has('no-status') && g.ui.wrap(el)) {
            Object.defineProperty(el, 'status', {
                set: function status(stat) {
                    this.parentElement.css.del('has-(danger|warn|success|spinner)');
                    this.css.del('is-(valid|invalid|warn|spinner)');
                    if (this.disabled) stat = 'none'; else if (stat === undefined || stat === null) stat = 'warn';
                    switch (stat) {
                        case 'error':
                            this._status = 'error';
                            this.css.add('is-invalid');
                            this.parentElement.css.add('has-danger');
                            break;
                        case 'warn':
                            this._status = 'warn';
                            this.css.add('is-warn');
                            this.parentElement.css.add('has-warn');
                            break;
                        case 'success': case 'ok':
                            this._status = 'success';
                            this.css.add('is-valid');
                            this.parentElement.css.add('has-success');
                            break;
                        case 'spinner':
                            this._status = 'spinner';
                            this.css.add('is-spinner');
                            this.parentElement.css.add('has-spinner');
                            break;
                        case 'none':
                        default:
                            this._status = 'none';
                    }
                },
                get: function status() {
                    return this._status;
                }
            });
        }
        return el;
    };

    /**
     * input_validator
     *
     * @param { Element } element
     * @param { string } tags
     * @returns { boolean }
     */
    g.input_validator = function(element, tags) {
        if (element && ((tags||['INPUT','SELECT','TEXTAREA']).indexOf(element.tagName) >-1)) {
            var res = isvalid(element) && (element.hasOwnProperty('couple') ? isvalid(element.couple) : true);
            if (element.type !== 'hidden') {
                UIElementDecorator( element );
                if (res === false) {
                    element.status = 'error'
                } else if (res === null || res === undefined) {
                    element.status = 'warn'
                } else {
                    if (element.value && element.value.length) { element.status = 'success'; } else  { element.status = 'none'; }
                }
            }
            return res;
        }
        return true;
    };

    /**
     * @function pattern_validator
     *
     * @param element { Element }
     * @returns {*}
     */
    g.pattern_validator = function (element) {
        if (!element) return console.error('can\'t pattern_validator on null!');

        var o = this,  els = typeof element === 'string' ? o.ui.els(element) : (element instanceof Array ? element:[element]);
        return els.forEach(function(el,i,a) {
            if (el instanceof Element) UIElementDecorator(el).ui.on('input', function (e) {
                return ( ['INPUT','TEXTAREA'].indexOf(this.tagName) >-1 && this.value.length) ? input_validator(this) : this.status = 'none';
            });
            //     .ui.on('focus', function (e) {
            //     return ( ['INPUT','TEXTAREA'].indexOf(this.tagName) >-1 && this.value.length) ? input_validator(this) : this.status = 'none';
            // }).ui.on('blur', function (e) {
            //     return input_validator(this);
            // });
        });
    };

}( window ));

(function ( g, ui, undefined ) {
    'suspected';
    'use strict';

    if ( typeof ui === 'undefined' ) return false;

    /**
     * Paginator List Items View
     *
     * @param { int } pg
     * @param { string } model
     * @param { int } limit
     * @returns {*}
     */
    g.paginator = function(pg, model, limit) {
        var lm = limit ? parseInt(limit) : 10;
        if (pg) this.ui.el('.paginator', function (e) {
            tpl('paginator-box', {pages: Math.ceil(pg.count / lm), page: pg.page, model: model }, this);
        });
    };

    /**
     * typeahead
     *
     * @param element
     * @param opt
     * @returns {*}
     */
    var typeahead = function (element, opt) {
    if (element && element.tagName === 'INPUT') {
        var th = {
            owner: null,
            index: 0,
            key: null,
            cache: {},
            // value: null,
            opt: {},
            delta: 250,
            timer: null,
            __xhr: null,
            get value (){
                return this.cache.hasOwnProperty(this.key) && this.cache[this.key][this.index] ? this.cache[this.key][this.index] : null;
            },
            stoped: function (opt) {
                if ( this.timer !== null ) {
                    if (this.__xhr) this.__xhr.halt();
                    if (this.timer) { clearTimeout(this.timer); this.timer = null }
                }
                if (this.owner.pannel) this.owner.pannel.css.add('fade');
                return;
            },
            delayed: function () {
                var th = this, key = th.owner.__key__;
                var fn = function fn () {
                    if (th.key === key) {
                        if (th.owner.pannel) th.owner.pannel.css.add('fade');
                        th.xhr();
                    } else {
                        th.stoped();
                        if (th.key !== 'null' && th.key !== key) {
                            th.key = key; th.timer = setTimeout(fn.bind(th), th.delta);
                        }
                    }

                    return false;
                };
                th.key = key; if (!th.timer) th.stoped();
                th.timer = setTimeout(fn.bind(th), th.delta);

                return;
            },
            activeItem:function (key) {
                var owner = this.owner, th = this;
                if (key && th.cache[key]) { th.key = key; } else { if (owner.pannel) owner.pannel.css.add('fade'); return false; }

                th.index = -1;
                var list = th.cache[th.key] || [];
                if ( owner.pannel && list.length ) {
                    owner.pannel.ui.el('.active', function () { this.css.del('active') });
                    list.forEach(function(v,i,a) { if ((th.index < 0) && v[owner.name] && (v[owner.name].trim().toLowerCase() === owner.__key__)) th.index = i; });
                    owner.pannel.ui.el('[value="' + (th.index < 0 ? 0 : th.index) + '"]', function () { this.css.add('active') });
                } else {
                    if (owner.pannel) owner.pannel.css.add('fade');
                }

                return false;
            },
            tpl:function(data){
                var th = this, owner = this.owner;
                th.index = data.length ? 0 : -1;

                if (owner.pannel) {
                    if (data.length) {
                        owner.pannel.ui.tpl(th.opt.tpl, {data: data, field: owner.name}, function (cnt) {
                            // var n = ui.dom(cnt);
                            // owner.pannel.innerHTML = n ? n.innerHTML : null;
                            owner.pannel.innerHTML = this.innerHTML;
                        });
                    }
                } else {
                    tpl(this.opt.tpl, {data: data, field: owner.name}, function (panel) {
                        owner.parentElement.insertAdjacentHTML('beforeend', panel.html);
                        owner.parentElement.css.add(th.opt.up ? 'dropup' : 'dropdown');
                        owner.pannel = owner.parentElement.ui.el('.dropdown-menu.list');
                        owner.pannel.ui.dg('li', 'mousedown', function (e) {
                            owner.value = this.innerHTML;
                            owner.setValue(th.cache[th.key][th.index = parseInt(this.value)]);
                            owner.ui.focus();
                        });
                    });
                }
                th.activeItem(th.key = owner.__key__);
                return false;
            },
            xhr:function(){
                var th = this, owner = this.owner, key = owner.__key__, is_correct = th.opt.ignore ? true : isvalid(owner);

                if ((!is_correct && key !== 'null') || (!th.opt.getEmpty && key === 'null')) { return this; }

                var stored = th.cache.hasOwnProperty(key);
                if (stored) {
                    th.activeItem(key);
                    th.show(th.cache[key]);
                    if (th.index >-1) {
                        owner.__value = undefined;
                        th.valueChanger(th.value);
                    }
                } else {
                    var len = stored ? th.cache[key].length : 0;
                    var no_skip = !((key === 'null' && !!th.opt.skip) || (th.opt.skip > key.length));
                    var no_eq = (key !== owner.__value.trim().toLowerCase());
                    if (is_correct && no_skip && no_eq && !len) {
                        var __status = owner.status, params = {};
                        if (th.opt.alias) params[th.opt.alias] = owner.value; else params[owner.name] = owner.value;
                        owner.status = 'spinner';
                        th.__xhr = th.opt.dbf ?
                            th.opt.dbf.filter(th.opt.query, params, {
                                before: function () { owner.status = 'spinner'; },
                                after: function () { owner.status = __status; },
                                done: function (tx, rs) {
                                    th.cache[key] = g.obj2array(rs.rows).map(function (v) {
                                        if (th.opt.alias) {
                                            v[owner.name] = v[th.opt.alias]; delete v[th.opt.alias]; return v;
                                        } else {
                                            return v;
                                        }
                                    });
                                    th.activeItem(key);
                                    th.show(th.cache[key]);
                                    return false;
                                },
                                fail: function (tx,er) { owner.status = 'error'; th.opt.error(er.message, this); return false }
                            }) : xhr({url: location.update(owner.ui.attr('url'), params),
                            rs: th.opt.rs,
                            before: function () { owner.status = 'spinner'; },
                            after: function () { owner.status = __status; },
                            done: function (e) {
                                var res = ui.src(e).responseJSON;
                                switch (res.result) {
                                    case 'ok': case 'success':
                                        th.cache[key] = (res.data||[]).map(function (v) {
                                            if (th.opt.alias) {
                                                v[owner.name] = v[th.opt.alias]; delete v[th.opt.alias]; return v;
                                            } else {
                                                return v;
                                            }
                                        });
                                        th.activeItem(key);
                                        th.show(th.cache[key]);
                                        break;
                                    case 'error':
                                        __status = 'error';
                                        th.opt.error(res);
                                        break;
                                    case 'warn': default:
                                        __status = 'warn';
                                        th.opt.warn(res);
                                }
                                return this;
                            },
                            fail: function (e) { owner.status = 'error'; th.opt.error(e, this); }
                        });
                    }
                }
                return this;
            },
            show:function(data){
                var owner = this.owner, th = this;
                if (owner.ui.active ) {
                    if (data && data.length) {
                        th.tpl(data);
                        if (th.index !== -1) owner.setValue(th.value);
                        if (owner.pannel) {
                            // if (!th.opt.wrapper) owner.pannel.setAttribute('style','margin-top:-'+g.getComputedStyle(owner).marginBottom+';left:'+owner.offsetLeft+'px;width:'+owner.clientWidth+'px;');
                            owner.pannel.css.del('fade');
                        }
                    } else if (owner.pannel ) {
                        owner.pannel.css.add('fade');
                    }
                }

                return false;
            },
            onKeydown:function (e) {
                var owner = this, key = g.eventCode(e), th = this.typeahead, list = th.cache[th.key] || [];
                if (list.length && owner.pannel) {
                    switch (key) {
                        case 'ArrowUp': case 38:
                            if (th.index < 0) th.index = 0;
                            if (owner.pannel) owner.pannel.css.del('fade');
                            if (th.index > 0) th.index--; else th.index = list.length - 1;
                            break;
                        case 'ArrowDown': case 40:
                            if (th.index < 0) th.index = 0;
                            if (owner.pannel) owner.pannel.css.del('fade');
                            if (th.index < list.length - 1) th.index++; else th.index = 0;
                            break;
                        case 'Enter': case 13:
                            th.stoped();
                            owner.setValue(th.index > -1 ? th.value : th.cache[th.key][0]);
                            if (owner.value.length) owner.setSelectionRange(owner.value.length, owner.value.length);
                            return false;
                        case 'Escape': case 27:
                            th.stoped();
                            return false;
                        default:
                            if (owner.pannel) owner.pannel.css.add('fade');
                            setTimeout(th.valueChanger.bind(th), 0);
                            return false;
                    }
                    owner.pannel.ui.el('.active', function (){ this.css.del('active'); });
                    owner.pannel.ui.el('[value="' + th.index + '"]', function (){  this.css.add('active'); });
                    owner.setValue(th.value);
                    if (owner.value.length) owner.setSelectionRange(owner.value.length, owner.value.length);
                    return false;
                } else if (key === 'Enter' || key === 13) {
                    th.stoped();
                    if (owner.pannel) owner.pannel.css.add('fade');
                }
                // setTimeout(th.valueChanger.bind(th), 0);
                return false;
            },
            onFocus:function(e){
                var owner = this, th = this.typeahead, len = owner.value.length;
                if (len) owner.setSelectionRange(len, len);
                if ((!len && th.opt.getEmpty) || (len && this.status !== 'success')) {
                    th.delayed();
                    th.activeItem(th.key = owner.__key__);
                }
                return false;
            },
            onInput:function(e){
                var owner = this, th = this.typeahead;
                th.delayed();
                th.key = owner.__key__;
                th.valueChanger();
                return false;
            },
            onBlur:function(e){
                var owner = this, th = this.typeahead;
                th.stoped();
                input_validator(owner);
                return false;
            },
            valueChanger: function (item) {
                var th = this, owner = this.owner, __status = this.owner.status, key = 'null';
                if (!item) {
                    if (owner.__key__ !== 'null') {
                        th.index = -1;
                        var list = th.cache[th.key = owner.__key__] || [];
                        list.forEach(function (v, i, a) {
                            if ((th.index < 0) && (v[owner.name].trim().toLowerCase() === owner.__key__)) th.index = i;
                        });
                        if (th.index > -1) { item = th.value; key = th.value[owner.name].trim().toLowerCase()||'null'; } else if (owner.__value === owner.value) return;
                    } else {
                        item = null;
                    }
                } else {
                    if (item[owner.name]) key = item[owner.name].trim().toLowerCase() || 'null';
                    else if (Object.keys(item).length === 0) item = null;
                }

                if ( owner.__key__ === 'null' || owner.__value !== owner.value || owner.__key__ !== key) {
                    if (typeof th.opt.fn === 'function') owner.status = th.opt.fn.call(owner, item);
                    else { if (th.validate) input_validator(owner); else owner.status = __status; }
                    if (item && item[owner.name])  owner.__value = owner.value = item[owner.name];
                    owner.dispatchEvent(new g.ce('change', {detail:item}));
                }
            }
        };

        if (typeof element.typeahead === 'undefined') {
            if (!ui.wrap(element)) { console.error('Not have attrib url', element); return }
            element.typeahead = th;
            Object.defineProperty(element, '__key__', {
                get: function() {
                    var str = this.value.trim().toLowerCase();
                    return str.length ? str : 'null';
                },
                enumerable: false
            });

            element.__value = element.value;
            element.typeahead.opt = merge({alias:null, getEmpty:true, query: null, dbf: null,
                fn: null, wrapper:false, skip: 0, ignore: false, rs:{},
                up: element.hasAttribute("dropup"), tpl: 'typeahead-tpl',
                error: function (res) {
                    console.error(typeof res === 'object' ? res.message : res);
                },
                warn: function (res) {
                    console.warn(typeof res === 'object' ? res.message : res);
                }
            }, opt);
            element.setValue = function (v) {
                var th = this.typeahead, owner = this,
                    isSet = v && v.hasOwnProperty(this.name),
                    eq = this.value === this.__value ? this.value.trim().length : 0;
                if (eq && isSet && owner.__key__ === v[owner.name].trim().toLowerCase()) { if (typeof th.opt.fn === 'function') owner.status = th.opt.fn.call(owner, v); }
                else { th.valueChanger(isSet ? v : ((th.index > -1) ? th.value : null)); }
                return false;
            };
            element.typeahead.owner = UIElementDecorator(element);
            element.ui.on('focus', th.onFocus).ui.on('input', th.onInput).ui.on('blur', th.onBlur).ui.on('keydown', th.onKeydown).ui.on('search', th.onInput);
            if (!element.ui.attr('tabindex')) element.ui.attr('tabindex', '0');
        }
        return element;
    }
    }; g.typeahead = typeahead;

    /**
     *
     * @param element
     * @param pattern
     * @param cleared
     * @returns {*}
     */
    var maskedigits = function(element, pattern, cleared) {
    if (element.tagName === 'INPUT') {
        var el = UIElementDecorator(element);
        el.cleared = cleared === undefined ? true : !!cleared ;
        if (pattern) el.maxLength = el.ui.attr('placeholder', pattern || '').attr('placeholder').length;
        if (!el.ui.attr('tabindex')) el.ui.attr('tabindex', '0');
        if (el && !el.hasOwnProperty('insertDigit')) {
            el.insertDigit = function(dg, selected) {
                if (selected) {
                    var pos = this.value.indexOf(selected);
                    var digitOffset = /\d/.test(dg) ? 1 : 0;
                    var shift = this.ui.attr('placeholder').substr(pos, selected.length).indexOf('_');
                    if (shift > 0) pos += shift;
                    this.value = this.value.substr(0,pos)+(/\d/.test(dg)?dg:'')+this.ui.attr('placeholder').substr(pos+digitOffset,
                            selected.length-digitOffset)+this.value.substr(pos+selected.length, this.value.length);
                    this.selectionStart = this.e1 = this.selectionEnd = this.s1 = pos +1;
                } else if (/\d/.test(dg) && (this.value || this.ui.attr('placeholder')).indexOf('_') > -1) {
                    var text = this.value || this.ui.attr('placeholder');
                    var pos = text.indexOf('_');
                    var next = text.match(/\d/) ? (text.indexOf(text.match(/\d/))) : -1;
                    if (pos <= this.selectionStart || next < 0 || next > pos) {
                        this.value = (this.value || this.ui.attr('placeholder')).replace('_', dg);
                        pos = (this.value || this.ui.attr('placeholder')).indexOf('_');
                        this.e1 = this.selectionEnd = this.selectionStart = this.s1 =  pos > -1 ? pos : this.value.length;
                    } else if (pos > this.selectionStart) {
                        this.s1 = pos = this.selectionStart;
                        text = dg + (this.value.substr(pos, this.value.length).match(/\d+/g) || []).join('')+'_';
                        for (var i= 0, l = text.length - 1; i < l; i++) {
                            pos = this.value.indexOf(text.charAt(i+1), pos);
                            if (pos > -1) this.value = this.value.substr(0, pos) + text.charAt(i) + this.value.substr(pos+1, this.value.length);
                        }
                        this.selectionStart = this.e1 = this.selectionEnd = ++this.s1;
                    }
                }

                this.dispatchEvent(new Event('change',{bubbles: true, cancelable: true, composed: true}));
                return this.selectionStart;
            };
            el.init = function (clear) {
                var text = this.value;
                var pos = 0;
                if (text) {
                    this.value = '';
                    var placeholder = this.ui.attr('placeholder');
                    for (var i in placeholder) {
                        if (text.length > i && placeholder[i] === text[i]) {
                            this.value += text[i]; pos++;
                        } else if (/_/.test(placeholder[i])) {
                            this.value += (pos < text.length) ? text[pos++] : '_';
                        }
                    }
                    pos = this.value.indexOf('_');
                } else {
                    if (!clear) this.value = this.ui.attr('placeholder');
                    pos = this.ui.attr('placeholder').indexOf('_');
                }
                if (clear) this.value = this.value.replace(/\_/g, '');
                return this.e1 = this.selectionEnd = this.selectionStart = this.s1 = (pos > -1 ? pos : this.value.length);
            };
        };

        el.init(true);
        el.ui.on('keydown', function (e) {
            if (e.ctrlKey || e.metaKey) { return false; }

            var key = eventCode(e);
            var dg = ((key >= 96 && key <= 105)) ? (key-96).toString() : key;

            if (/\d/.test(dg)) {
                this.insertDigit(dg, selected);
            } else {
                if (this.ui.attr('placeholder').length && !this.value) {
                    this.value = this.ui.attr('placeholder');
                    this.e1 = this.selectionEnd = this.selectionStart = this.s1 = 0;
                } else {
                    this.s1 = this.selectionStart; this.e1 = this.selectionEnd;
                }
                switch (key) {
                    case 8:
                    case 'Backspace':
                        if (selected) {
                            var pos = this.value.indexOf(selected);
                            this.value = this.value.substr(0, pos) + this.ui.attr('placeholder').substr(pos, selected.length) +
                                this.value.substr(pos + selected.length, this.value.length);
                            var shift = this.ui.attr('placeholder').substr(pos, selected.length).indexOf('_');
                            if (shift > 0) pos += shift;
                            this.selectionStart = this.e1 = this.selectionEnd = this.s1 = pos;
                        } else {
                            this.e1 = this.s1 = --this.selectionStart;
                            --this.selectionEnd;
                            while ((this.s1 >= 0) && !/\d/.test(this.value.charAt(this.s1))) {
                                this.s1 = --this.selectionStart;
                                --this.selectionEnd;
                            }
                            if (this.s1 >= 0 && /\d/.test(this.value.charAt(this.s1))) this.value = this.value.substr(0, this.s1) + '_' + this.value.substr((this.s1 + 1), this.value.length);
                            else this.s1 = this.e1 + 1;
                            this.selectionStart = this.selectionEnd = this.s1;
                        }
                        this.dispatchEvent(new Event('change',{bubbles: true, cancelable: true, composed: true}));
                        break;
                    case 13:
                    case 'Enter':
                        this.dispatchEvent(new Event('change',{bubbles: true, cancelable: true, composed: true}));
                        return false;
                    case 27:
                    case 'Escape':
                        this.dispatchEvent(new Event('blur'));
                        return false;
                    case 9:
                    case 'Tab':
                        var el = null;
                        var way = e.shiftKey ? -1 : 1;
                        var index = parseInt(this.ui.attr('tabindex')) + way;
                        if (index > 0) while (el = ui.el('[tabindex="' + index + '"]'))
                            if (el.ui.attr('disabled')) {
                                index += way
                            } else {
                                el.ui.focus();
                                break;
                            }
                        if (index <= 1 && way < 0) return e.preventDefault();
                        break;
                    case 37:
                    case 'ArrowLeft':
                        if (this.selectionStart > 0) {
                            this.s1 = --this.selectionStart;
                            this.e1 = --this.selectionEnd;
                        }
                        break;
                    case 39:
                    case 'ArrowRight':
                        this.s1 = ++this.selectionStart;
                        break;
                    case 46:
                    case 'Delete':
                        var sl = this.value.slice(this.selectionStart),
                            tt, ts = this.ui.attr('placeholder').slice(this.selectionStart);
                        if (selected) {
                            tt = (this.value.substr(this.selectionStart + selected.length, this.value.length).match(/\d+/g) || []).join('');
                            this.e1 = this.s1;
                        } else {
                            tt = (this.value.slice(this.selectionStart).match(/\d+/g) || []).join('').slice(1);
                        }
                        for (var i in tt) ts = ts.replace('_', tt[i]);
                        this.value = this.value.replace(sl, ts);
                        this.selectionStart = this.s1;
                        this.selectionEnd = this.e1;
                        this.dispatchEvent(new Event('change',{bubbles: true, cancelable: true, composed: true}));
                        break;
                    default:
                }
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        }).ui.on('focus', function (e) {
            this.init(false);
            return false;
        }).ui.on('blur',function(e) {
            if (this.value.match(/[\d]+/g)) this.value = !this.cleared ? this.value : this.value.replace(/\_/g, '');
            else this.value = '';
            input_validator(this);
            return false;
        }).ui.on('copy', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (g.clipboardData && g.clipboardData.setData) {
                g.clipboardData.setData('Text', selected);
            } else {
                var clipboardData = (e.originalEvent || e).clipboardData;
                if (clipboardData && clipboardData.getData) {
                    clipboardData.setData('text/plain', selected);
                }
            }
            return false;
        }).ui.on('paste',function(e) {
            e.stopPropagation();
            e.preventDefault();
            var buff = '';
            if (g.clipboardData && g.clipboardData.getData) { // IE
                buff = g.clipboardData.getData('Text');
            } else {
                var clipboardData = (e.originalEvent || e).clipboardData;
                if (clipboardData && clipboardData.getData) {
                    buff = clipboardData.getData('text/plain');
                }
            }
            if (buff) {
                var dgs = buff.match(/\d+/g) ? buff.match(/\d+/g).join('') : '';
                for (var i in dgs) this.insertDigit(dgs[i], selected);
            }
            return false;
        });
        return el;
    } else if (element instanceof Array) {
        for (var i in element) g.maskedigits(element[i], pattern, cleared);
        return element;
    }
    console.error('plugin maskedigits wrong parent element!');
    return undefined;
    }; g.maskedigits = maskedigits;

}( window, window.ui ));