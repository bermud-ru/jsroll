/**
 * @app jsroll.ui.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 16/04/2018
 * @status beta
 * @version 2.1.1b
 * @revision $Id: jsroll.js 2.1.1b 2018-04-16 10:10:01Z $
 */

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
            this.instance = typeof i === 'string' ? g.document.querySelector(i) : i ;
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
         * @param c
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
         * @param r regexp|substr
         * @param n newSubStr|function
         * @param f flags
         * @returns {css}
         */
        replace: function (r, n, f) {
            this.instance.className = this.instance.className.replace(r, n, f);
            return this;
        },
        /**
         * @function add - Add Cascading Style Sheets class to HTMLelement
         * @param c
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
         * @param c
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
         * @param c
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

    /**
     * Fix native mephod selection
     */
    function selection() {
        if (g.getSelection) {
            if (g.getSelection().empty) {  // Chrome
                g.getSelection().empty();
            } else if (g.getSelection().removeAllRanges) {  // Firefox
                g.getSelection().removeAllRanges();
            }
        } else if (g.document.selection) {  // IE?
            g.document.selection.empty();
        }
    }; g.selection = selection;

    /**
     * CustomEvent
     *
     *  polyfill
     */
    var CustomEvent = ('CustomEvent' in g ? g.CustomEvent : (function () {
        function CustomEvent ( event, params ) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = g.document.createEvent( 'CustomEvent' );
            evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
            return evt;
        }
        CustomEvent.prototype = g.Event.prototype;
        return CustomEvent;
    })()); g.ce = CustomEvent;

    Element.matches = Element.matches || Element.matchesSelector || Element.webkitMatchesSelector || Element.msMatchesSelector ||
        function(selector) {
            var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
            while (nodes[++i] && nodes[i] != node);
            return !!nodes[i];
        };

    /**
     * @class ui - HTML elements Extention
     * @param instance
     * @returns {*}
     */
    var ui = function(instance) {
        if (instance.hasOwnProperty('ui')) return instance;
        this._parent = null;
        this.instance = instance || g.document;
        if (instance) { this.instance.css = new css(this.instance); this.wrap(this.instance.parentElement); }
        return this;
    }; ui.prototype = {
        wrap:function(el, v){
            if (el && !el.hasOwnProperty('ui')) {
                el.ui = new ui(el); if (typeof v == 'string') g[v]=el;
            }
            return el;
        },
        el: function (s, v) {
            var el = null;
            if (typeof s === 'string') {
                if (!s.match(/^#*/)) el = g.document.getElementById(s.replace(/^#/, ''));
                else el = this.instance.querySelector(s);
            } else if (typeof s === 'object') { el = s }
            if (el) {
                if (!el.hasOwnProperty('ui')) el.ui = new ui(el);
                if (typeof v === 'string') g[v] = el;
                else if (typeof v === 'function') v.call(el, arguments);
            }
            return el;
        },
        els: function (s, fn, v) {
            var r = [];
            if (typeof s === 'string'|| s instanceof Array) {
                var c = typeof s === 'string' ? s.split(/,/) : s;
                c.forEach((function (x) {
                    r.push.apply(r, obj2array(this.instance.querySelectorAll(x.trim())||{}).map(function (e, i, a) {
                        if (!e.hasOwnProperty('ui')) e.ui = new ui(e);
                        if (typeof fn == 'function') fn.call(e, i, a);
                        return e;
                    }));
                }).bind(this));
                if (typeof fn == 'string') g[fn]=r; else if (typeof v == 'string') g[v]=r;
            }
            return r;
        },
        attr: function (a, v) {
            if (a == undefined) {
                var attrs = {}, n;
                for (var i in this.instance.attributes)
                    attrs[(n = this.instance.attributes[i].nodeName)] = this.instance.getAttribute(n);
                return attrs;
            } else if (typeof a === 'object' && typeof v === 'undefined') {
                for (var i in a) if (! /\d+/.test(i)) this.instance.setAttribute(i,a[i]);
                return this;
            } else if (typeof a === 'string' && typeof v === 'undefined') {
                var mask = a.indexOf('*') != -1 ? re('/'+a.split('*')[0]+'/i') : null;
                if (mask) {
                    var data = {};
                    obj2array(this.instance.attributes).forEach(function (e, i, a) {
                        var name = e.nodeName.toString();
                        if (mask.test(name) && (name = name.replace(mask, '')))
                            data[name] = e.value; //.e.nodeValue
                    });
                    return data;
                } else {
                    try {
                        return JSON.parse(this.instance.getAttribute(a));
                    } catch (e) {
                        return this.instance.getAttribute(a);
                    }
                }
            } else if (typeof a === 'string' && v) {
                if (! /\d+/.test(a)) {
                    if (typeof v === 'object') this.instance.setAttribute(a, JSON.stringify(v));
                    else this.instance.setAttribute(a, v);
                }
            }
            return this;
        },
        tmpl: function (str, data, cb, opt) {
            tmpl.apply( this.instance, [str, data, cb, opt] );
            return this.instance;
        },
        merge: function () {
            merge.apply(this.instance, arguments);
            return this.instance;
        },
        src: function (e) {
            if (e instanceof Event) {
                return this.wrap(e.target || e.srcElement);
            }
            return this.instance;
        },
        on: function (event, fn, opt) {
            var self = this;
            event.split(',').forEach( function(e) {
                var a = self.instance instanceof Element ? [self.instance] : self.instance;
                a.map( function (i) { i.addEventListener(e.trim(), fn, !!opt); });
            });
            return this.instance;
        },
        dg: function (s, event, fn, opt) {
            var self = this;
            self.instance.addEventListener(event, function(e) {
                var found, el = (e.target || e.srcElement);
                while (el && el.matches && el !== self && !(found = el.matches(s))) el = el.parentElement;
                if (found) { fn.call(self.wrap(el), e); return el }
                return !!found;
            }, !!opt);
            return this.instance;
        },
        /**
         * Default: [text/xml], результирующий объект будет типа XMLDocument (#document->...) !+ xmlns="http://www.w3.org/1999/xhtml"
         * [application/xml] возвращает Document, но не SVGDocument или HTMLDocument
         * [image/svg+xml] возвращает SVGDocument, который так же является экземпляром класса Document
         * [text/html] возвращает  HTMLDocument (<html><body>...</body></html>, который так же является экземпляром класса Document
         **/
        dom: function(d, mime) {
            if ( !d || typeof d !== 'string' ) return null;
            var nodes = g.dom(d, mime).childNodes;
            return nodes.length > 1 ? nodes : nodes[0];
        },
        up: function (d, mime) {
            var nodes = g.dom(d, mime).childNodes, el = this.instance === g.document ? g.ui.el('body') : this.instance;
            for (var i = 0; i < nodes.length; i++) {
                el.appendChild(nodes[i]);
            }
            return el;
        },
        rm: function (s) {
            if ( !s || typeof s !== 'string' ) return null;
            this.els(s).forEach(function (el) { el.parentNode.removeChild(el); });
            return this.instance;
        },
        get active() {
            return (this.instance instanceof Element && (this.instance === g.document.activeElement));
        },
        focus: function(s) {
            var el = null;
            if (s) { el = (typeof s == 'string' ? this.el(s): s); } else { el = this.instance; }
            if (el instanceof HTMLElement) g.setTimeout(function(e) { el.focus(); }, 0);
            return el;
        }
    }; g.ui = new ui(document);

    /**
     * @Helper copy2prn
     * Подготавливает данные звёрнутые в шаблон к печати
     *
     * @param template
     * @param data
     */
    var copy2prn = function (template, data) {
        var print_layer = g.document.createElement('iframe');
        print_layer.name = 'print_layer';
        print_layer.src = 'printer';
        print_layer.style.display = 'none';
        g.document.body.appendChild(print_layer);

        var frameDoc = (print_layer.contentWindow) ? print_layer.contentWindow : (print_layer.contentDocument.document) ? print_layer.contentDocument.document : print_layer.contentDocument;
        frameDoc.document.open();
        frameDoc.document.write(tmpl(template,data||{}));
        frameDoc.document.close();

        setTimeout(function () {
            g.frames['print_layer'].focus();
            g.frames['print_layer'].print();
            g.document.body.removeChild(print_layer);
        }, 1);
    }; g.copy2prn = copy2prn;

    /**
     * @Helper Fader
     * @param s
     * @param opt
     * @returns {boolean}
     */
    function fader(s, opt) {
        if (!s) return false;
        var res = null;

        var opt = Object.assign({display:false,timeout:300,context:null},opt),
            init = function (v) {
                if (!v.hasOwnProperty('fade')) {
                    v.faded = v.style.opacity == 0;
                    v.opt = opt;
                    v.opt.context = typeof opt.context === 'string' ? v.el(opt.context) : v;
                    Object.defineProperty(v, 'fade', {
                        get: function() { return v.faded; },
                        set: function(is) {
                            if (is) {
                                v.css.add('fade');
                                if (v.opt.display) setTimeout(function(){ v.style.display = 'none'; }, v.opt.timeout);
                                return v.faded = true;
                            } else {
                                if (v.opt.display) v.style.display = v.getAttribute('display') ? v.getAttribute('display') : 'inherit';
                                v.css.del('fade');
                                return v.faded = false;
                            }
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
                return v;
            };

        if (typeof s === 'string') { res = g.ui.els(s); res.forEach(function (v,i,a) { init(v) }); }
        else if (s instanceof HTMLElement) { res = init(s); }
        else if (typeof s === 'object') { res = s; s.forEach(function (v,i,a) { init(v); }); }
        return res
    }; g.fader = fader;

    /**
     * @Helper group
     * Позвозят работать с группой элементов, выбранных по селектору. как с элементом форма
     * @param els
     * @param opt
     */
    var group = function (els, opt) {
        this.__valid = true;
        this.opt = Object.merge({
            method: 'get',
            url: g.location.href,
            before: function (e) { g.spinner = true; },
            after: function (e) { g.spinner = false; }
        }, opt);
        this.wrongs = [];
        this.elements = typeof els === 'string' ? ui.els(els) : els;
        this.length = this.elements.length || 0;
        var self = this; this.elements.forEach(function (e,i,a) { e.group = self; });
    }; group.prototype = {
        events:{},
        on:function (event, fn, opt) {
            var self = this;
            self.events[event] = fn;
            this.elements.forEach(function (e,i,a) { e.ui.on(event, self.events[event], opt); });
        },
        set valid (res) {
            this.wrongs = [];
            if (res.message) for (var i = 0; i < this.elements.length; i++) {
                this.__valid = true;
                if (res.message.hasOwnProperty(this.elements[i].name)) {
                    this.elements[i].status = 'error';
                    this.__valid = false;
                    this.wrongs.push(this.elements[i].name);
                } else {
                    this.elements[i].status = 'none';
                }
            }
        },
        get valid () {
            this.__valid = true;
            var self = this; this.wrongs = [];
            this.elements.forEach(function (e,i,a) { var chk = input_validator(e); if (!chk) { self.wrongs.push(e.name);}  self.__valid &= chk; });
            return this.__valid ;
        },
        is_wrong:function () {
            if (arguments.length) {
                var self = this, arg = typeof arguments[0] === 'object' ? arguments[0] : Array.prototype.slice.call(arguments, 0);
                var x = true; arg.forEach(function (e,i,a) { x &= self.wrongs.indexOf(e) > -1; });
                return x;
            }
            return !!this.wrongs.length;
        },
        __MODEL__: {},
        set MODEL(d) {
            if (d && typeof d === 'object') {
                this.__MODEL__ = d;  this.wrongs = [];
                for (var i = 0; i < this.elements.length; i++) if (d.hasOwnProperty(this.elements[i].name)) {
                    this.elements[i].value = d[this.elements[i].name];
                    if (['checkbox', 'radio'].indexOf((this.elements[i].getAttribute('type') || 'text').toLowerCase()) > -1) {
                        this.elements[i].checked = parseInt(d[this.elements[i].name]) !== 0;
                    }
                }
            } else {
                this.__MODEL__ = {};
            }
        },
        get MODEL() {
            this.__MODEL__ = {};
            for (var i = 0; i < this.elements.length; i++) {
                var n = this.elements[i].value.length ? new Number(this.elements[i].value) : NaN;
                this.__MODEL__[this.elements[i].name || i] = ['checkbox', 'radio'].indexOf((this.elements[i].getAttribute('type') || 'text').toLowerCase()) < 0 ? (isNaN(n) ? this.elements[i].value : n) : (this.elements[i].checked ? (this.elements[i].value.indexOf('on') == -1 ? this.elements[i].value : 1) : (this.elements[i].value.indexOf('on') == -1 ? '' : 0));
            }
            return this.__MODEL__;
        },
        data: function() {
            var data = []; for (var i = 0; i < this.elements.length; i++) { data.push(g.InputHTMLElementSerialize(this.elements[i])); }
            return data.join('&');
        },
        send: function () {
            var args = arguments, self= this;
            if (typeof self.after == 'function') { self.opt.after(); }
            g.xhr(Object.assign({data: self.data(), done: typeof args[0] == 'function' ?
                    function(hr) {
                        self.response_header = hr;
                        var callback = args.shift();
                        var result = callback.apply(this, args);
                        return f;
                    } :
                    function(hr) {
                        self.response_header = hr;
                        var res = str2json(this.responseText) || {result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]};

                        if (res.result == 'error' ) {
                            if (typeof self.fail == 'function') self.fail.call(f, res, args);
                        } else {
                            if (typeof self.done == 'function') self.done.call(f, res, args);
                        }
                        if (typeof self.after == 'function') { self.after.call(f, res, args) }
                        return f;
                    }
            }, self.opt));
            return this;
        }
    }; g.group = group;

}( window ));

(function ( g, ui, undefined ) {
    'suspected';
    'use strict';

    if ( typeof ui === 'undefined' ) return false;

    g.config = {
        app: {container:'[role="workspace"]'},
        msg: {container:'.alert.alert-danger', tmpl:'alert-box'},
        spinner: '.locker.spinner',
        popup: {wnd:'.b-popup', container:'.b-popup .b-popup-content'}
    };

    /**
     * Helper modalDialog
     *
     * @param e {Event|undefined} HTML element Event
     * @param s {Object|String} selector
     * @returns {*}
     */
    function modalDialog (e, s) {
        var wnd = typeof s === 'object' ? s : ui.el(s);
        if (wnd) {
            if (!wnd.hasOwnProperty('modal')) {
                wnd.modal = {
                    kicker: e,
                    visible: false,
                    callback: null,
                    event: function (e) { var key = g.eventCode(e); if ((key == 27 || key == 'Escape') && wnd.css.has('show')) wnd.modal.hide(wnd.modal.callback); },
                    show: function (s, model, cb) {
                        this.callback = typeof cb === 'function' ? cb : this.callback;
                        if (s && !wnd.css.has('show')) {
                            try {tmpl(s, (model ? model : {}), wnd);} catch (e) {
                               console.error(e.message);
                               return  this.hide();
                            }
                            wnd.css.add('show');
                            g.addEventListener('keydown', wnd.modal.event);
                            this.visible = true;
                            if (this.callback) this.callback();

                        }
                        if (this.kicker instanceof HTMLElement) wnd.kicker = this.kicker
                        return this;
                    },
                    getKicker: function() {
                        return wnd.kicker;
                    },
                    hide: function (cb) {
                        g.removeEventListener('keydown', wnd.modal.event);
                        wnd.css.del('show');
                        wnd.innerHTML = '';
                        this.visible = false;
                        this.callback = cb || this.callback;
                        if (typeof this.callback  === 'function') {
                            this.callback(this);
                        }

                        if (wnd.kicker) wnd.kicker.ui.focus();
                        return this;
                    }
                };
            } else if (e instanceof HTMLElement) wnd.modal.kicker = e;
            return wnd;
        }
        console.error('modalDialog: "'+s+'" wrong dialog object or selector!');
        return null;
    }; g.modalDialog = modalDialog;

    /**
     * Application
     * @param instance
     * @returns {app}
     */
    var app = function(instance){
        this.route = router;
        //this.route.cfg({ mode: 'history'})
        this.registry = {};
        this.dim = {};
        this.instance = instance || g;
        //TODO ceteate poll events handlers
        // ui.on("keydown", function (e) { if (e.keyCode == 27 ) g.app.popup(); });
        return this;
    }; app.prototype = {
        online: function(e) {
            console.log('app::online');
            g.onbeforeunload = undefined;
        },
        offline: function(e) {
            console.warn('app::offline');
            g.onbeforeunload = function (event) {
                if (navigator.onLine) return undefined;
                var message = "Возможна потеря несохранённых данных.";
                if (typeof event === "undefined") {	event = window.Event; }
                if (event) { event.returnValue = message; }
                return message;
            }
        },
        bootstrap: function(rt) {
            this.route.set(rt).chk(rt).lsn();
            return this;
        },
        get store(){
            return str2json(storage.getItem('app'), {});
        },
        set store(u){
            var store = str2json(storage.getItem('app'), {});
            if (typeof u === 'object') storage.setItem('app', JSON.stringify( Object.merge(store, u)));
            else console.error('app::store only Object instance can store! ['+ JSON.stringify(u)+']');
        },
        widget: function (cfg, t, d, opt) {
            var self = this, root = typeof cfg.root == 'string' ? g.ui.el(cfg.root) : cfg.root;
            tmpl(t, d, function (c) {
                if (root && c && (root.innerHTML = c)) {
                    self.implement(root, cfg.event || []);
                    self.inject(cfg.root, root, cfg.code || opt && opt.code);
                }
            }, opt);

            return this;
        },
        event: function (s, map) {
            this.registry[s] = map;
            return this;
        },
        implement: function (p, s){
            var self = this;
            (s || []).forEach(function (a, i) {
                for (var b in self.registry[a]) {
                    switch  (typeof self.registry[a][b]) {
                        case 'object': p.ui.els(a, function(){ this.ui.on(self.registry[a][b][0], self.registry[a][b][1]); return this }); break;
                        case 'string': p.ui.els(a, function(){ this.ui.on(self.registry[a][0], self.registry[a][1]); return this }); return;
                        case 'function': self.registry[a][b].call(p.ui.els(a), self.dim[a] || {});
                    }
                };
            });
            return self;
        },
        variable: function (el, id) {
            if (!el) return undefined;
            if (!el.hasOwnProperty('dim')) {
                Object.defineProperty(el, 'dim', {
                    get: function () {
                        try {
                            return g.app.dim[id] || (g.app.dim[id] = Object.assign(JSON.parse(storage.getItem(id)||''), {self:el}));
                        } catch (e) { g.app.dim[id] = {}; g.app.dim[id].self = el; return g.app.dim[id]; }
                    }
                });
                g.app.dim[id] = {}; g.app.dim[id].self = el;
                el.store = function (fields) {
                    var s = {};
                    Object.keys(g.app.dim[id]).forEach(function(k){if(fields.indexOf(k) != -1) s[k] = g.app.dim[id][k];});
                    storage.setItem(id, JSON.stringify(s));
                    return this;
                };
            }
            return el;
        },
        inject: function (root, el, fn) {
            if (typeof fn === 'function') {
                fn.apply(this.variable(el, root), arguments);
            }
            return false;
        },
        elem: fader(config.msg.container)[0],
        msg: function (params) {
            var self = this;
            tmpl(config.msg.tmpl, params, self.elem);
            self.elem.fade = false; setTimeout(function(){ self.elem.fade = true; }, 3000);
            return this;
        },
        spinner_count: 0,
        spinner_element: ui.el(g.config.spinner),
        set spinner (v) {
            v ? this.spinner_count++ : this.spinner_count--;
            this.spinner_count > 0 ? this.spinner_element.style.display = 'block' : this.spinner_element.style.display = 'none';
        },
        get spinner() {
            if (this.spinner_element.style.display == 'none') return false;
            return true;
        },
        before: function (opt) {
            g.app.spinner = true;
        },
        after: function (opt) {
            if (opt && opt.hasOwnProperty('status') && parseInt(opt.status) == 408) g.app.msg({result:'warning', message:'Первышен интервал запроса!'});
            g.app.spinner = false;
        },
        list: g,
        popupEvent: function (e) { if (e.keyCode == 27 ) { if (!g.app.elem.css.has('fade')) { clearTimeout(g.app.elem.timer); g.app.elem.fade = true; } else {g.app.popup(); }} },
        popup: function (id, data, opt) {
            //TODO: refactoring code for popup!
            var self = this;
            this.wnd = this.wnd || ui.el(g.config.popup.wnd);
            if (self.wnd.fade) {
                this.container =  this.container || ui.el('[role="workspace"]');
                var  up = false, t = {
                    onTmplError:function () {
                        g.app.msg({message:'Ошибка выполнения приложения!'});
                        console.error(arguments);
                        up = true;
                    }
                };
                tmpl.apply(t, [id, data, this.variable(this.container, 'popupBox'), opt]);
                if (!up) {
                    g.addEventListener('keydown', g.app.popupEvent);
                    self.container.css.del('is-(valid|invalid|warning|spinner)');
                    self.wnd.fade = up = false;
                }
            } else {
                g.removeEventListener('keydown', self.popupEvent);
                if (typeof arguments[0] == 'function') arguments[0].apply(self, obj2array(arguments).slice(1));
                self.container.innerHTML = null;
                self.wnd.fade = true;
                if (self.list) self.list.ui.el('[role="popup-box"]', function () {
                    this.ui.focus();
                });
            }
            return this;
        },
        fader: function (s, opt) { g.fader(s, opt); return this },
        download:function(owner, url, opt) {
            var self = owner, app = this;
            return g.xhr(Object.assign({responseType: 'arraybuffer', url: url,
                before: opt && opt.before || null,
                after: opt && opt.after || null,
                done: function(e, x) {
                    var res = x.hasOwnProperty('action-status') ? str2json(decodeURIComponent(x['action-status']),{result:'ok'}) : {result:'ok'};
                    if (res.result != 'ok') {
                        if (self.disabled) setTimeout(function () { self.disabled = false; self.css.del('spinner'); }, 1500);
                        g.app.msg(res);
                        return false;
                    }

                    try {
                        var filename = g.uuid();
                        if (opt && opt.hasOwnProperty('filename')) {
                            filename = decodeURIComponent(quoter(opt['filename'],  quoter.SLASHES_QOUTAS).replace(/['"]/g, ''));
                        } else {
                            var disposition = this.getResponseHeader('Content-Disposition');
                            if (disposition && disposition.indexOf('attachment') !== -1) {
                                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                var matches = filenameRegex.exec(disposition);
                                if (matches != null && matches[1]) filename = decodeURIComponent(quoter(matches[1],  quoter.SLASHES_QOUTAS).replace(/['"]/g, ''));
                            }
                        }

                        if (self.disabled) setTimeout(function () { self.disabled = false; self.css.del('spinner'); }, 1500);
                        // if (this.getResponseHeader('Action-Status')) {
                        //      g.app.msg({message:this.getResponseHeader('Action-Status')});
                        // return
                        // }
                        return g.dwnBlob(this.response, filename, this.getResponseHeader('Content-Type'));
                    } catch (e) {
                        if (self.disabled) setTimeout(function () { self.disabled = false; self.css.del('spinner'); }, 1500);
                        g.app.msg({message: this.status + ': ' + e + ' (URL: ' + url + ')'});
                        console.error('app::download Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
                    }
                },
                fail: opt && opt.fail || function (e) {
                    if (self.disabled) setTimeout(function () { self.disabled = false; self.css.del('spinner'); }, 1500);
                    console.error('download Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
                }
            },opt));
        },
        upload:function(stream, url, opt) {
            var file = stream.files[0];
            var done = opt.done; delete opt['done'];
            var fail = opt.fail; delete opt['fail'];
            var stop = opt.stop; delete opt['stop'];
            var dir = opt.dir || null; delete opt['dir'];

            if (!file) return console.warn('File not found!');

            var slice = function (file, start, end, type) {
                var slice = file.mozSlice ? file.mozSlice : file.webkitSlice ? file.webkitSlice : file.slice ? file.slice : function () { };
                return slice.bind(file)(start, end);
            };

            var size = file.size, filename = file.name;
            var sliceSize = opt.sliceSize||1024;
            var start = opt.start||0, end;
            var data, piece, xhr;

            var loop = function () {
                end = start + sliceSize;
                data = new FormData();
                if (size - end < 0) {
                    end = size;
                    if (opt.extra) data.append('payload', typeof opt.extra === 'string' ? opt.extra : ( opt.extra ? JSON.stringify(opt.extra) : null ));
                }

                piece = slice(file, start, end);
                data.append('dir', dir);
                data.append('filename', filename);
                data.append('size', size);
                data.append('start', start);
                data.append('end', end);
                data.append('file', piece);

                if (stop.call(this, xhr)) xhr = g.xhr(Object.assign({method: 'post', rs:{'Content-type': 'multipart/form-data', 'Hash': acl.user.hash},
                    url: url,
                    data: data,
                    done: function (e, x) {
                        var res = str2json(this.responseText) || {result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]};

                        if (res.result == 'ok') {
                            if (typeof opt.progress === 'function') { opt.progress.call(res,(Math.floor(res.end/size*1000)/10)); }
                            if (res.end < size) {
                                start += sliceSize;
                                setTimeout(loop, 1);
                            } else {
                                done.call(res);
                            }
                        } else {
                            fail.call(res);
                            g.app.msg(res);
                        }
                        return
                    },
                    fail: function (e, x) {
                        if (typeof opt.fail === 'function') opt.fail.call(x,e);
                        console.error('app::upload Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
                    }
                }, opt));

            };

            if (size > 0) setTimeout(loop, 1);

            return;

        }

    }; g.app = new app(g.document);

    /**
     * Paginator List Items View
     *
     * @param args
     * @param model
     */
    g.paginator = function(args, model, limit) {
        var self=this, pg = args.paginator, lm = limit ? parseInt(limit) : 10;
        if (pg) this.ui.el('.paginator', function (e) {
            tmpl('paginator-box', {pages: Math.ceil(pg.count / lm), page: pg.page, model: model }, this);
        });
        return pg;
    };

    /**
     *
     * @param els
     * @param v
     * @returns {*}
     */
    var filter = function (els, v) {
        var elements = [], index = 0;
        if (els) {
            if (typeof v === 'object' && v.hasOwnProperty('page')) index = v['page'];
            els.forEach(function (e, i, a) {
                var fe =  ['INPUT','SELECT'].indexOf(e.tagName) > -1 ? e : e.ui.el('input,select');
                if (fe) {
                    elements.push(fe);
                    if (typeof v === 'object' && v.hasOwnProperty(fe.name)) fe.value = v[fe.name];
                    if (fe.tagName === 'INPUT') input_validator(fe);
                }
            });

            return {
                el: elements,
                index: index,
                __valid: true,
                transformer: null,
                get valid(){
                    var self = this; self.__valid = true;
                    this.el.forEach(function (e,i,a) { self.__valid &= input_validator(e) });
                    return this.__valid ;
                },
                set params(v) {
                    var params = {}, self = this; self.__valid = true;
                    if (v && typeof v === 'object') params = v; else if (typeof v === 'string') params = g.location.decoder(v);
                    if (params.hasOwnProperty('page')) this.index = parseInt(params['page']);
                    this.el.forEach(function (e,i,a) {
                        setValueInputHTMLElement(e, params.hasOwnProperty(e.name) ? params[e.name] : null);
                        self.__valid &= input_validator(e);
                    });
                },
                get params() {
                    var params = {}, self = this;
                    this.el.forEach(function (e,i,a) {
                        var v = InputHTMLElementValue(e);
                        if (v) { params[e.name] = v;  input_validator(e); }
                    });
                    return params;
                },
                diff: function (b) {
                    var a = this.params;
                    return Object.keys(a).concat(Object.keys(b)).reduce(function(map, k) {
                        if (a[k] != b[k]) map[k] = b[k];
                        return map;
                    }, {});
                },
                update:function (url) {
                    var p = this.params;
                    p['page'] = this.index||0;
                    if (typeof url === 'string') {
                        var u = g.location.decoder(url);
                        this.el.forEach(function (e) { if (u.hasOwnProperty(e.name)) u[e.name] = ''; });
                        return g.location.update(url, Object.assign(u,p));
                    } else if (typeof url === 'object') {
                        for (var i in this.el) {
                            url[this.el[i].name] = InputHTMLElementValue(this.el[i]);
                            if (url.hasOwnProperty(this.el[i].name) && !url[this.el[i].name]) delete url[this.el[i].name];
                        }
                        return Object.assign(url, p);
                    }
                    return '?' + g.location.encoder(p);
                },
                get uri() {
                    var p = this.params;
                    p['page'] = this.index||0;
                    if (typeof this.transformer === 'function') return g.location.encoder(this.transformer(p));
                    return g.location.encoder(p);
                },
                callback: function (res) {
                   var result = true, msg = Object.keys(res.message||{});
                    if (typeof res === 'undefined') return res;

                    if (msg.length) {
                        for (var i in this.el) {
                            if (msg.indexOf(this.el[i].name) >-1) {
                                switch (res.result) {
                                    case 'ok':
                                        this.el[i].status = 'success';
                                        break;
                                    case 'error':
                                        result &= false;
                                    // case 'warning':
                                    default:
                                        this.el[i].status = res.result;
                                }
                            }
                            else { result &= input_validator(this.el[i]) }
                        }
                    }
                    return result;
                }
            };
        }
        return null;
    }; g.filter = filter;

    /**
     *
     * @param route
     * @param methods
     * @param opt
     * @returns {*}
     */
    var crud = function (route, methods, opt) {
        if (!route) return undefined;

        var rt = route.match(/^\/\w+.*/i) ? '//'+location.hostname+route : route;
        var rest = function (self, method, data) {
            var raw = []; if (data && typeof data == 'object') {
                for (var i in data) { raw.push(i+'='+ encodeURIComponent(g.QueryParam(data[i],QueryParam.NULLSTR))); }
                data = raw.join('&')
            }
            return xhr(Object.assign({method: method, url: self.route, data: data}, self.opt));
        };

        var p = {
            methods: methods ? methods : ['GET','POST','PUT','DELETE'],
            route: route,
            opt: opt ? opt : this,
            rs: {},
            error: {},
            proc: null,
            before: null,
            after: null,
            process: function (data, method) { return data; },
            abort:function () { if (this.proc) this.proc.abort(); this.proc = null },
            done:function (data, method) { return this.rs[method] = data },
            fail:function (data, method) { return this.error = data }
        };

        for (var n in p.methods) {
            var u = methods[n].toUpperCase();
            p.rs[u] = {};
            p[u] = (function(u){ return function(data) { this.rs[u] = null; return this.proc = rest(this,u,data); }}).apply(p,[u]);
            // Object.defineProperty(p, u, { get: function() { return this.rs[u]; }});
        }

        if (rt) return p; else console.warn('Can\'t resolve route:' ,route);

        return {};
    }; g.crud = crud;

}( window, window.ui ));

(function ( g, ui, undefined ) {
    'use strict';
    if ( typeof ui === 'undefined' ) return false;

    var msg = {
        elem: ui.el(g.config.msg.container),
        show: function (params, close) {
            tmpl(g.config.msg.tmpl, params, this.elem);
            this.elem.css.del('fade');
            var el = this.elem;
            if (typeof close == 'undefined' || !close) el.timer = setTimeout(function(){el.css.add('fade')}, 3000);
            return this.elem;
        }
    }; g.msg = msg;

    g.spinner_count = 0;
    g.spinner_element = ui.el(g.config.spinner);
    if (g.spinner_element) Object.defineProperty(g, 'spinner', {
        __proto__: null,
        enumerable: false,
        configurable: false,
        set: function (v) {
            v ? g.spinner_count++ : g.spinner_count--;
            g.spinner_count > 0 ? g.spinner_element.style.display = 'block' : g.spinner_element.style.display = 'none';
        },
        get: function () {
            if (g.spinner_element.style.display == 'none') return false;
            return true;
        }
    });

    /**
     * setValueFromObject
     *
     * @param owner
     * @param v
     */
    var setValueFromObject = function(el, v, required, alias) {
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
        return false;

    }; g.setValueFromObject = setValueFromObject;

    /**
     * @function isvalid
     *
     * @param element
     * @returns {boolean}
     */
    var isvalid = function (element) {
        var res = true, validator = null, pattern;
        if ((element.getAttribute('required') !== null) && !element.value) res = false;
        else if ((element.getAttribute('required') === null) && !element.value) res = true;
        else if ((pattern = element.getAttribute('pattern')) === null) res = true;
        else {
            if (!element.hasOwnProperty('testPattern')) {
                element.regex = re(pattern);
                Object.defineProperty(element, 'testPattern', {
                    get: function testPattern() {
                        if (typeof this.regex === 'object') {
                            this.regex.lastIndex=0;
                            return this.regex.test(this.value.trim())
                        } else {
                            return true
                        }
                    }
                });
            }
            res = element.testPattern;
        }
        if (typeof (validator = element.getAttribute('validator') || element['validator']) === 'function') res = validator.apply(element, [res]);
        return res;
    };

    /**
     * input_validator
     *
     * @param element
     * @param tags
     * @returns {boolean}
     */
    var input_validator = function(element, tags) {
        if (element && ((tags||['INPUT','SELECT','TEXTAREA']).indexOf(element.tagName) >-1)) {
            var res = isvalid(element) && (element.hasOwnProperty('bindingElement') ? isvalid(element.bindingElement) : true);
            if (element.type != 'hidden') {
                inputer( element );
                if (res === false) {
                    element.status = 'error'
                } else if (res === null || res === undefined) {
                    element.status = 'warning'
                } else {
                    if (element.value && element.value.length) { element.status = 'success'; } else  { element.status = 'none'; }
                }
            }
            return res;
        }
        return true;
    };  g.input_validator = input_validator;

    /**
     * Set default value for FORM elements
     *
     * @param els
     * @param attr
     * @returns {*}
     */
    var set_default = function (els, attr) {
        if (!els) return null;

        return this.ui.els(els, function () {
            if (['checkbox','radio'].indexOf((this.getAttribute('type') || 'text').toLowerCase()) >-1)
                this.checked = this.ui.attr(attr||'default') || false;
            else switch (this.tagName) {
                case 'SELECT':
                    this.value = this.ui.attr(attr||'default') || 0;
                    break;
                case 'INPUT':
                case 'TEXTAREA':
                default:
                    this.value = this.ui.attr(attr||'default') || '';
            }
            this.status = 'none';
        });
    };  g.set_default = set_default;

    /**
     * inputer
     * //maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.min.css
     *
     * @param el
     * @returns {*}
     */
    var inputer = function(el) {
        if (el instanceof Element && ui.wrap(el) && !el.hasOwnProperty('status') && !el.css.has('no-status')) {
            Object.defineProperty(el, 'status', {
                set: function status(stat) {
                    this.parentElement.css.del('has-(danger|warning|success|spinner)');
                    this.css.del('is-(valid|invalid|warning|spinner)');
                    if (this.disabled) stat = 'none'; else if (stat === undefined || stat === null) stat = 'warn';
                    switch (stat) {
                        case 'error':
                            this._status = 'error';
                            this.css.add('is-invalid');
                            this.parentElement.css.add('has-danger');
                            break;
                        case 'warning': case 'warn':
                            this._status = 'warning';
                            this.css.add('is-warning');
                            this.parentElement.css.add('has-warning');
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
    }; g.inputer = inputer;

    /**
     * @function formvalidator
     * Default form validator
     * @param res
     * @returns {boolean}
     */
    g.formvalidator = function(res, pushed) {
        var m = res && res.hasOwnProperty('message') && typeof res.message === 'object' && res.message ? res.message: {};

        for (var i = 0; i < this.elements.length; i++) {
            if (!m.hasOwnProperty(this.elements[i].name) && !input_validator(this.elements[i])) {
                if (!this.elements[i].hasOwnProperty('message') || (this.elements[i].message !== false))
                    m[this.elements[i].name] = this.elements[i].message || 'Поле с неверными данными или пустым значения!';
            }
        }

        if (Object.keys(m).length) {
            if (g.spinner) g.spinner = false;
            m['caption'] = 'Неверно заполнена форма!';
            if (typeof pushed === 'undefined' || !!pushed) app.msg({message: m}); else return m;
            return false;
        }

        return true;
    };

    /**
     * @function pattern_validator
     *
     * @param element
     * @returns {*}
     */
    var pattern_validator = function (element) {
        if (!element) return console.error('pattern_validator of null object!');

        var o = typeof this === 'undefined' ? g : this, els = typeof element === 'string' ? o.ui.els(element) : (element instanceof Element ? [element] : element);

        els.forEach(function(el,i,a) {
            if (el instanceof Element && ui.wrap(el)) inputer(el).ui.on('focus', function (e) {
                if (this.tagName == 'INPUT' && this.value.length) input_validator(this); else this.status = 'none';
                return false;
            }).ui.on('input', function (e) {
                if (this.tagName == 'INPUT' && this.value.length) input_validator(this); else this.status = 'none';
                return false;
            }).ui.on('blur', function (e) {
                input_validator(this);
                return false;
            });
        });

        return;
    }; g.pattern_validator = pattern_validator;

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
                    if (this.__xhr) this.__xhr.cancel();
                    if (this.timer) { g.clearTimeout(this.timer); this.timer = null }
                }
                if (this.owner.pannel) this.owner.pannel.css.add('fade');
                return;
            },
            delayed: function () {
                var th = this, key = th.owner.__key__;
                var fn = function fn () {
                    if (th.key == key) {
                        if (th.owner.pannel) th.owner.pannel.css.add('fade');
                        th.xhr();
                    } else {
                        th.stoped();
                        if (th.key != 'null' && th.key != key) {
                            th.key = key; th.timer = g.setTimeout(fn.bind(th), th.delta);
                        }
                    }

                    return false;
                };
                th.key = key; if (!th.timer) th.stoped();
                th.timer = g.setTimeout(fn.bind(th), th.delta);

                return;
            },
            activeItem:function (key) {
                var owner = this.owner, th = this;
                if (key && th.cache[key]) { th.key = key; } else { if (owner.pannel) owner.pannel.css.add('fade'); return false; }

                th.index = -1;
                var list = th.cache[th.key] || [];
                if ( owner.pannel && list.length ) {
                    owner.pannel.ui.el('.active', function () { this.css.del('active') });
                    list.forEach(function(v,i,a) { if ((th.index < 0) && v[owner.name] && (v[owner.name].trim().toLowerCase() == owner.__key__)) th.index = i; });
                    owner.pannel.ui.el('[value="' + (th.index < 0 ? 0 : th.index) + '"]', function () { this.css.add('active') });
                } else {
                    if (owner.pannel) owner.pannel.css.add('fade');
                }

                return false;
            },
            tmpl:function(data){
                var th = this, owner = this.owner;
                th.index = data.length ? 0 : -1;

                if (owner.pannel) {
                    if (data.length) {
                        tmpl(th.opt.tmpl, {data: data, field: owner.name}, function (cnt) {
                            var n = ui.dom(cnt);
                            owner.pannel.innerHTML = n ? n.innerHTML : null;
                        });
                    }
                } else {
                    tmpl(this.opt.tmpl, {data: data, field: owner.name}, function (panel) {
                        owner.parentElement.insertAdjacentHTML('beforeend', panel);
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
                    var no_skip = !((key == 'null' && !!th.opt.skip) || (th.opt.skip > key.length));
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
                                var res = str2json(this.responseText) || {result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]};
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
                                        th.opt.error(res, this);
                                        break;
                                    case 'warn': default:
                                        __status = 'warning';
                                        th.opt.warn(res, this);
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
                        th.tmpl(data);
                        if (th.index != -1) owner.setValue(th.value);
                        if (owner.pannel) {
                            if (!th.opt.wrapper) owner.pannel.setAttribute('style','margin-top:-'+g.getComputedStyle(owner).marginBottom+';left:'+owner.offsetLeft+'px;width:'+owner.clientWidth+'px;');
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
                } else if (key == 'Enter' || key == 13) {
                    th.stoped();
                    if (owner.pannel) owner.pannel.css.add('fade');
                }
                // setTimeout(th.valueChanger.bind(th), 0);
                return false;
            },
            onFocus:function(e){
                var owner = this, th = this.typeahead, len = owner.value.length;
                if (len) owner.setSelectionRange(len, len);
                if ((!len && th.opt.getEmpty) || (len && this.status != 'success')) {
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
                            if ((th.index < 0) && (v[owner.name].trim().toLowerCase() == owner.__key__)) th.index = i;
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
                up: element.hasAttribute("dropup"), tmpl: 'typeahead-tmpl',
                error: function (res, xhr) {
                    console.error(typeof res === 'object' ? res.message : res);
                },
                warn: function (res, xhr) {
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
            element.typeahead.owner = inputer(element);
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
        var el = inputer(element);
        el.cleared = cleared == undefined ? true : !!cleared ;
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
                        var text = dg + (this.value.substr(pos, this.value.length).match(/\d+/g) || []).join('')+'_';
                        for (var i= 0; i < text.length -1; i++) {
                            pos = this.value.indexOf(text.charAt(i+1), pos);
                            if (pos > -1) this.value = this.value.substr(0, pos) + text.charAt(i) + this.value.substr(pos+1, this.value.length);
                        }
                        this.selectionStart = this.e1 = this.selectionEnd = ++this.s1;
                    }
                }

                this.dispatchEvent(new Event('change'));
                return this.selectionStart;
            };
            el.init = function (clear) {
                var text = this.value;
                var pos = 0;
                if (text) {
                    this.value = '';
                    var placeholder = this.ui.attr('placeholder');
                    for (var i in placeholder) {
                        if (text.length > i && placeholder[i] == text[i]) {
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
                        this.dispatchEvent(new Event('change'));
                        break;
                    case 13:
                    case 'Enter':
                        this.dispatchEvent(new Event('change'));
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
                        this.dispatchEvent(new Event('change'));
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