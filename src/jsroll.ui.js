/**
 * @app jsroll.ui.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
 * @author Андрей Новиков <andrey@novikov.be>
 * @status beta
 * @version 1.1.3b
 * @revision $Id: jsroll.ui.js 1.1.3b 2017-07-26 18:40:01Z $
 */

(function ( g, undefined ) {
    'suspected';
    'use strict';

    g.config = {
        app: {container:'[role="workspace"]'},
        msg: {container:'.alert.alert-danger', tmpl:'alert-box'},
        spinner: '.locker.spinner',
        popup: {wnd:'.b-popup', container:'.b-popup .b-popup-content'}
    };

    /**
     *  class css - Helper for Cascading Style Sheets properties of HTMLelements
     *
     * @param instance
     * @returns {css}
     */
    var css = function(instance){
        this.instance = this.el(instance).instance;
        return this;
    }; css.prototype = {
        /**
         * css.el setup instance of HTMLelements
         *
         * @param i
         * @returns {css}
         */
        el: function(i) {
            this.instance = typeof i === 'string' ? g.document.querySelector(i) : i ;
            return this;
        },
        /**
         * css.style - setup value of Cascading Style Sheets properties of HTMLelement
         *
         * @param k
         * @param v
         * @returns {css}
         */
        style:function(k,v) {
            this.instance.style[k] = v;
            return this;
        },
        /**
         * css.has return TRUE | FALSE is exist Cascading Style Sheets class in HTMLelement
         *
         * @param c
         * @returns {Array|{index: number, input: string}}
         */
        has: function(c){
            return this.instance.className.match(re('(?:^|\\s)' + c + '(?!\\S)'));
        },
        /**
         * css.add - Add Cascading Style Sheets class to HTMLelement
         * @param c
         * @returns {css}
         */
        add: function (c) {
            if (this.instance && !this.has(c)) this.instance.className += ' ' + c;
            return this;
        },
        /**
         * css.del - Delete Cascading Style Sheets class from HTMLelement
         *
         * @param c
         * @returns {css}
         */
        del: function (c) {
            if (this.instance) this.instance.className = this.instance.className.replace(re('(?:^|\\s)' + c + '(?!\\S)'), '');
            return this;
        },
        /**
         * css.tgl - Toggle Cascading Style Sheets class of HTMLelement
         *
         * @param c
         * @returns {css}
         */
        tgl: function (c) {
            if (this.instance) {
                if (!this.has(c)) this.instance.className += ' ' + c;
                else  this.instance.className = this.instance.className.replace(re('(?:^|\\s)' + c + '(?!\\S)'), '');
            }
            return this;
        }
    }; g.css = new css(g);

    /**
     * class ui - HTML elements Extention
     *
     * @param instance
     * @returns {*}
     */
    var ui = function(instance) {
        if (instance.hasOwnProperty('ui')) return instance;
        this._parent = null;
        this.instance = instance || g;
        if (instance) { this.instance.css = new css(this.instance); this.wrap(this.instance.parentElement); }
        return this;
    }; ui.prototype = {
        /**
         * ui.wrap
         *
         * @param el
         * @param v
         * @returns {*}
         */
        wrap:function(el, v){
            if (el && typeof el === 'object' && !el.hasOwnProperty('ui')) {
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
            if (typeof s === 'string') {
                var r = []; // ui.wrap([]);
                s.split(',').map((function (x) {
                    r.push.apply(r,Array.prototype.slice.call(this.instance.querySelectorAll(x)||{}).map(function (e, i, a) {
                        if (!e.hasOwnProperty('ui')) e.ui = new ui(e); // e.ui = r.ui; e.ui.instance = e;
                        if (typeof fn == 'function') fn.call(e, i, a);
                        return e;
                    }));
                }).bind(this));
                if (typeof fn == 'string') g[fn]=r; else if (typeof v == 'string') g[v]=r;
                return r;
            } else return [];
        },
        attr: function (a, v) {
            if (a == undefined) {
                var attrs = {}, n;
                for (var i in this.instance.attributes)
                    attrs[(n = this.instance.attributes[i].nodeName)] = this.instance.getAttribute(n);
                return attrs;
            } else if (typeof a === 'object' && typeof v === 'undefined') {
                for (var i in a) this.instance.setAttribute(i,a[i]);
                return this;
            } else if (typeof a === 'string' && typeof v === 'undefined') {
                var mask = a.indexOf('*') != -1 ? re(a.split('*')[0], 'i') : null;
                if (mask) {
                    var data = {}
                    Array.prototype.slice.call(this.instance.attributes).map(function (e, i, a) {
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
                if (typeof v === 'object') this.instance.setAttribute(a, JSON.stringify(v));
                else this.instance.setAttribute(a, v);
            }
            return this;
        },
        merge: function () {
            var i = 1, t = arguments[0] || {};
            if (this.instance.hasOwnProperty('ui')) { t = this.instance; i = 0; }
            var keys = Object.keys(t);
            Array.prototype.slice.call(arguments, i).map( function(v, k, a) {
                Object.defineProperties(t, Object.keys(v).reduce( function (d, key) {
                    if (keys.indexOf(key) == -1 && keys.indexOf('__'+key) > -1) t['__'+key] = v[key];
                    else d[key] = Object.getOwnPropertyDescriptor(v, key);
                    return d;
                }, {}));
            });
            return t;
        },
        src: function (e) {
            var el = e ? e : this.instance;
            return new ui(el.srcElement || el.target);
        },
        on: function (event, fn, opt) {
            var self = this;
            event.split(',').map( function(e) { self.instance.addEventListener(e, fn, !!opt)} );
            return this.instance;
        },
        dom: function(d, mime) {
            if ( !d || typeof d !== 'string' ) return null;
            var nodes = g.dom(d, mime).childNodes;
            return nodes.length > 1 ? nodes : nodes[0];
        },
        get active() {
            return this.instance === g.document.activeElement;
        },
        focus: function(s) {
            var el;
            if (s) el = (typeof s == 'string' ? this.el(s) : s); else el = this.instance;
            if (el) g.setTimeout(function() { el.focus(); return false }, 0);
            return el;
        }
    }; g.ui = new ui(document);

    /**
     * TODO: Fix not work in FF
     */
    Object.defineProperty(g, 'selected', {
        get: function selected() {
            return  g.getSelection ? g.getSelection().toString() : g.document.selection.createRange().text;
            // return  g.getSelection ? g.getSelection().toString() : // Not IE, используем метод getSelection
            //     g.document.selection.createRange().text; // IE, используем объект selection
        }
    });

    /**
     * Fix
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

    g.fadeRule = [0.0,  0.301, 0.477, 0.602, 0.699, 0.778, 0.845, 0.903, 0.954, 1.0]; // Math.log([1..10])/ Math.log(10);
        // g.fadeRule.reverse();
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
                if (d-- <= 0){ this.style.display = 'none'; clearTimeout(st); if (typeof cb === 'function') return cb.call(this); }
                else return st = setTimeout(fn.bind(this, d, cb),typeof cb === 'number' ? cb : 25);
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
    function fadeIn(el, cb) {
        var st = null, d = 1,
            fn = function fn (d, cb) {
                this.style.opacity = g.fadeRule[d];
                if (d++ >= 9){ clearTimeout(st); if (typeof cb === 'function') return cb.call(this); }
                else return st = setTimeout(fn.bind(this, d, cb),typeof cb === 'number' ? cb : 25);
            };
        if (el) {
            el.style.display = 'inherit'; el.style.opacity = 0;
            return st = setTimeout(fn.bind(el, d, cb), typeof cb === 'number' ? cb : 25);
        }
    }; g.fadeIn = fadeIn;
}( window ));

(function ( g, ui, undefined ) {
    'suspected';
    'use strict';

    if ( typeof ui === 'undefined' ) return false;

    var group = function (master, opt) {
        if (master && typeof master === 'object' && typeof (opt||{}).slave === 'object') {
            var opt = Object.assign({slave:[], event:null, eh:null}, opt);
            g.ui.wrap(master).slave = opt.slave;
            if (opt.eh) master.slave.map(function (e, i, a) { e.ui.on(opt.event, opt.eh) });
            master.ui.on(opt.event, function (event) {
                var type = event.type;
                this.slave.map(function (e, i, a) { e.dispatchEvent(new Event(type)) });
            });
            return master;
        }
        return undefined;
    }; g.group = group;

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
        bootstrap: function(rt) {
            this.route.set(rt).chk(rt).lsn();
            return this;
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
            (s || []).map(function (a, i) {
                for (var b in self.registry[a]) {
                    switch  (typeof self.registry[a][b]) {
                        case 'object': p.ui.els(a, function(){ this.ui.on(self.registry[a][b][0], self.registry[a][b][1]);}); break;
                        case 'string': p.ui.els(a, function(){ this.ui.on(self.registry[a][0], self.registry[a][1]);}); return;
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
                            return g.app.dim[id] || (g.app.dim[id] = Object.assign(JSON.parse(storage.getItem(id)||''),{self:el}));
                        } catch (e) { g.app.dim[id] = {}; g.app.dim[id].self = el; return g.app.dim[id]; }
                    }
                });
                g.app.dim[id] = {}; g.app.dim[id].self = el;
                el.store = function (fields) {
                    var s = {};
                    Object.keys(g.app.dim[id]).map(function(k){if(fields.indexOf(k) != -1) s[k] = g.app.dim[id][k];});
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
        elem: ui.el(g.config.msg.container),
        msg: {
            show: function (params, close) {
                tmpl(g.config.msg.tmpl, params, g.app.elem);
                fadeIn(g.app.elem, 0);
                if (typeof close == 'undefined' || !close) fadeOut(g.app.elem, 90);
                return g.app.elem;
            }
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
        before: function () {
            g.app.spinner = true;
        },
        after: function () {
            g.app.spinner = false;
        },
        list: g,
        popupEvent: function (e) { if (e.keyCode == 27 ) g.app.popup(); },
        popup: function (id, data, opt) { //TODO: refactoring code for popup!
            this.wnd = this.wnd || ui.el(g.config.popup.wnd);
            if (arguments.length && !this.wnd.visible) {
                this.container =  this.container || ui.el(g.config.popup.container);
                g.addEventListener('keydown', g.app.popupEvent);
                tmpl(id, data, this.variable(this.container, 'popupBox'), opt);
                this.container.css.del('has-error').del('has-info').del('has-warning').del('has-success');
                fadeIn(this.wnd, 35);
                this.wnd.visible = true;
            } else {
                g.removeEventListener('keydown', g.app.popupEvent);
                if (this.wnd.visible) fadeOut(this.wnd, 35);
                this.wnd.visible = false;
                if (this.list) this.list.ui.focus('[role="popup-box"]');
            }
            return this;
        },

        fader: function (el, v, context) {
            var app = this, self = v ? ui.el(el, v) : ui.el(el);
            if (self && !self.hasOwnProperty('fade')) {
                self.sleep = 35;
                self.faded = false;
                self.fade_context = context ? self.ui.el(context) : self;
                self.fade = function (id, data, opt) {
                    if (arguments.length && !self.faded) {
                        tmpl(id, data, app.variable(self.fade_context, id), opt);
                        fadeIn(self, this.sleep);
                        return self.faded = true;
                    } else if (!arguments.length && self.faded) {
                        fadeOut(self, this.sleep);
                        return self.faded = false;
                    }
                    return self;
                }
            }
            return self;
        },

        download:function(url, opt){
            return g.xhr(Object.assign({responseType: 'arraybuffer', url: url, done: function(e, x) {
                if ([200, 206].indexOf(this.status) < 0) {
                    app.msg.show({message: this.status + ': ' + this.statusText + ' (URL: ' + url + ')'});
                } else {
                    try {
                        var filename = g.uuid();
                        if (opt && opt.hasOwnProperty('filename')) {
                            filename = opt['filename'];
                        } else {
                            var disposition = this.getResponseHeader('Content-Disposition');
                            if (disposition && disposition.indexOf('attachment') !== -1) {
                                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                var matches = filenameRegex.exec(disposition);
                                if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
                            }
                        }
                        var type = this.getResponseHeader('Content-Type');
                        var blob = g.bb(this.response, {type: type});

                        if (typeof g.navigator.msSaveBlob !== 'undefined') {
                            // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                            g.navigator.msSaveBlob(blob, filename);
                        } else {
                            var downloadUrl = g.URL.createObjectURL(blob);

                            if (filename) {
                                // use HTML5 a[download] attribute to specify filename
                                var a = document.createElement('a');
                                // safari doesn't support this yet
                                if (typeof a.download === 'undefined') {
                                    //g.location = downloadUrl;
                                    g.open(downloadUrl);
                                } else {
                                    a.href = downloadUrl;
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(function () { document.body.removeChild(a); }, 100); // cleanup
                                }
                            } else {
                                //g.location = downloadUrl;
                                g.open(downloadUrl);
                            }

                            setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
                        }
                    } catch (e) {
                        console.error('сервер вернул не коректные данные', e);
                    }
                }
            }},opt));
        }

    }; g.app = new app(g.document);

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
            els.map(function (e, i, a) {
                e.ui.el('input', function (e) {
                    elements.push(this);
                    if (typeof v === 'object' && v.hasOwnProperty(this.name)) this.value = v[this.name];
                    input_validator(this);
                }) || e.ui.el('select', function (e) {
                    elements.push(this);
                    if (typeof v === 'object' && v.hasOwnProperty(this.name)) this.value = v[this.name];
                });
            });

            return {
                el: elements,
                index: index,
                __valid: true,
                get valid(){
                    var self = this; self.__valid = true;
                    this.el.map(function (e,i,a) { self.__valid &= input_validator(e) });
                    return this.__valid ;
                },
                set params(v) {
                    var params = {}, self = this; self.__valid = true;
                    if (typeof v === 'object') params = v; else if (typeof v === 'string') params = location.decoder(v);
                    if (params.hasOwnProperty('page')) this.index = params['page'];
                    this.el.map(function (e,i,a) {
                        if (params.hasOwnProperty(e.name)) e.value = params[e.name];
                        else e.value = '';
                        self.__valid &= input_validator(e);
                    });
                },
                get params() {
                    var params = {}, self = this;
                    this.el.map(function (e,i,a) {
                        if (e.value) switch (e.tagName) {
                            case 'INPUT': params[e.name] = e.value; input_validator(e);
                                break;
                            case 'SELECT': if (e.value != 0) params[e.name] = e.value;
                                break;
                            }
                    });
                    return params;
                },
                diff: function (b) {
                    var a = this.params;
                    return Object.keys(a).concat(Object.keys(b)).reduce(function(map, k) {
                        if (a[k] !== b[k]) map[k] = b[k];
                        return map;
                    }, {});
                },
                get uri() {
                    var p = this.params;
                    p['page'] = this.index;
                    return location.encoder(p);
                },
                callback: function (res) {
                   var result = true, er = Object.keys(res.error||{}), wr = Object.keys(res.warning||{}), fl = Object.keys(res.filter||{});
                    if (typeof res === 'undefined') return res;

                    if (er.length || wr.length || fl.length) {
                        for (var i in this.el) {
                            if (er.length && this.el[i].name.indexOf(er) >-1) { this.el[i].status='error'; result &= false }
                            else if (wr.length && this.el[i].name.indexOf(wr) >-1) { this.el[i].status='warning'; result &= false }
                            else if (fl.length && this.el[i].name.indexOf(fl) >-1) { result &= input_validator(this.el[i]) }
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

        var rt =  route.match(/^\/\w+.*/i) ? '//'+location.hostname+route : route;
        var rest = function (self, method, data) {
            var raw = []; if (typeof data == 'object') {for (var i in data) raw.push(i+'='+data[i]); data = raw.join('&') }
            return xhr(Object.assign({method: method, url: self.route, data: data}, self.opt));
        };

        var p = {
            methods: methods ? methods : ['GET','POST','PUT','DELETE'],
            route: route,
            opt: opt,
            rs: {},
            error: {},
            proc: null,
            before: null,
            after: null,
            abort:function () {
                if (this.proc) this.proc.abort(); this.proc = null;
            },
            done:function (data,  method) {
                return this.rs[method] = data;
            },
            fail:function (data,  method) {
                return this.error = data;
            }
        }; for (var n in methods) {
            var l = methods[n].toLowerCase(), u = l.toUpperCase();
            p.rs[u] = null;
            p[l] = (function(u){ return function(data) { this.rs[u] = null; return this.proc = rest(this,u,data); }}).apply(p,[u]);
            Object.defineProperty(p, u, { get: function() { return this.rs[u]; }});
        }

        if (rt) return p;
        else console.warn('Can\'t resolve route:' ,route);
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
            fadeIn(this.elem, 0);
            var el = this.elem;
            if (typeof close == 'undefined' || !close) el.timer = setTimeout(function(){fadeOut(el, 125)}, 3000);
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
    var setValueFromObject = function(owner, v) {
        if (owner && owner.tagName) {
            if (typeof v === 'object' && v.hasOwnProperty(owner.name)) {
                owner.value = v[owner.name];
            } else {
                owner.value = null;
            }
            return true;
        }
        return false;
    }; g.setValueFromObject = setValueFromObject;

    /**
     * input_validator
     *
     * @param element
     * @returns {boolean}
     */
    var input_validator = function(element, tags) {
        if (element && (tags ? (tags.indexOf(element.tagName) >-1) : (element.tagName === 'INPUT'))) {
            var res = true, validator = null, pattern;
            if (!element.hasOwnProperty('validator') && (validator = element.getAttribute('validator')) !== null) {
                element.validator = func(validator);
            }
            if ((element.getAttribute('required') !== null) && !element.value) res = false;
            else if ((element.getAttribute('required') === null) && !element.value) res = true;
            else if ((pattern = element.getAttribute('pattern')) === null) res = true;
            else {
                // try {
                //     var pattern = /[?\/](.+)(\/([igum]*$))/.exec(element.getAttribute('pattern')) || [];
                //     var re = new RegExp(pattern[1],pattern[3]||'g');
                //     res = re.test(element.value.trim());
                // } catch(e) { res = false }
                if (!element.hasOwnProperty('testPattern')) {
                    try {
                        var p = /[?\/](.+)(\/([igum]*$))/.exec(pattern) || [];
                        element.regex = new RegExp(p[1]||pattern,p[3]||'');
                        Object.defineProperty(element, 'testPattern', {
                            get: function testPattern() { this.regex.lastIndex=0; return this.regex.test(this.value.trim()) }
                        });
                    } catch(e) { element['testPattern'] = false; console.error(element,pattern,e) }
                }
                res = element.testPattern;
            }
            if (res && element.hasOwnProperty('validator')) res = element.validator.call(element, res);
            var el = element.type != 'hidden' ? element : (typeof element.statusInstance === 'object' ? element.statusInstance : false);
            if (el) {
                inputer(ui.wrap(el));
                if (!res) {
                    el.status = 'error'
                } else {
                    if (!el.disabled) {
                        if (el.value.length) { el.status = 'success' } else { el.status = 'none' }
                    } else {
                        el.status = 'none'
                    }
                }
            }
            return res;
        }
        return true;
    };  g.input_validator = input_validator;

    /**
     * inputer
     *
     * @param el
     * @returns {*}
     */
    var inputer = function(el) {
        if (el && !el.hasOwnProperty('status')) {
            el.chk = el.parentElement.ui.el('span.form-control-feedback');
            Object.defineProperty(el, 'status', {
                set: function status(stat) {
                    this.parentElement.css.add('has-feedback').del('has-error').del('has-warning').del('has-success');
                    if (this.chk) this.chk.css.del('glyphicon-ok').del('glyphicon-warning-sign').del('glyphicon-remove').del('spinner');
                    switch (stat) {
                        case 'error':
                            this._status = 'error';
                            if (this.chk) this.chk.css.add('glyphicon-remove');
                            this.parentElement.css.add('has-error');
                            break;
                        case 'warning':
                            this._status = 'warning';
                            if (this.chk) this.chk.css.add('glyphicon glyphicon-flash');
                            this.parentElement.css.add('has-warning');
                            break;
                        case 'success':
                            this._status = 'success';
                            if (this.chk) this.chk.css.add('glyphicon-ok');
                            this.parentElement.css.add('has-success');
                            break;
                        case 'spinner':
                            this._status = 'spinner';
                            if (this.chk) this.chk.css.add('spinner');
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
    
    g.formvalidator = function(res) {
        var result = [];
        for (var i =0; i < this.elements.length; i++) if (!input_validator(this.elements[i],['INPUT','TEXTAREA'])) result.push(this.elements[i].name+': '+(this.elements[i].value||'поле с неверными данными или нет значения!'));

        if (result.length) {
            if (g.spinner) g.spinner = false;
            result.unshift('<b>ФОРМА: неверно заполнены поля формы!</b>');
            msg.show({message: result});
            return false;
        }

        return true;
    };

    /**
     * pattern_validator
     *
     * @param element
     * @param opt
     */
    var pattern_validator = function (element, opt) {
        if (element && element.tagName) {
            inputer(element).ui.on('focus', function (e) {
                if ( typeof this.status === 'undefined' ) input_validator(this);
                return false;
            }).ui.on('input', function(e){
                input_validator(this);
                return false;
            }).ui.on('blur', function(e){
                input_validator(this);
                return false;
            });
        }
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
            index: 0,
            key: null,
            cache: null,
            value: null,
            opt: {},
            delta: 330,
            timer: null,
            request: null,
            delayed: function () {
                if (!this.timer) {
                    var fn = function fn () {
                            this.xhr();
                            clearTimeout(this.timer); this.timer = null;
                            if (this.request && this.request != 'null' && this.request != this.owner.value ) {
                                this.request = this.owner.value;
                                this.timer = g.setTimeout(fn.bind(this), this.delta);
                            }
                        };
                    this.timer = g.setTimeout(fn.bind(this), this.delta);
                }
            },
            activeItem:function () {
                var owner = this.owner, ch = this.cache[this.key] || {}, v = {};
                if ( owner.pannel && Object.keys(ch).length ) {
                    owner.pannel.ui.el('.active', function () { this.css.del('active') });
                    var values = Object.keys(ch).map(function(k){return ch[k]});
                    var idx = values.indexOf(owner.value);
                    if (idx != -1) {
                        owner.pannel.ui.el('[value="' + idx + '"]', function () { this.css.add('active') });
                        v = Object.keys(ch)[idx];
                    }
                }
                owner.setValue(v);
            },
            tmpl:function(data){
                var owner = this.owner;
                this.index = -1; this.key = owner.value.toLowerCase() || 'null';
                if (owner.pannel) {
                    var n = ui.dom(tmpl(this.opt.tmpl, {data:data, field: owner.name}));
                    if (n) owner.pannel.innerHTML = n.innerHTML;
                } else {
                    owner.parentElement.insertAdjacentHTML('beforeend', tmpl(this.opt.tmpl, {data: data, field: owner.name}));
                    owner.parentElement.css.add('dropdown');
                    owner.pannel = owner.parentElement.ui.el('.dropdown-menu.list');
                }
                this.activeItem();
                owner.parentElement.ui.els('.dropdown-menu.list li', function () {
                    this.ui.on('mousedown', function (e) {
                        owner.value = this.innerHTML;
                        var ch = owner.typeahead.cache[owner.typeahead.key];
                        owner.setValue(ch[parseInt(this.ui.attr('value'))]);
                        return false;
                    });
                });
            },
            xhr:function(){
                if (this.opt.skip > this.owner.value.trim().length || !input_validator(this.owner)) return this.owner.typeahead.show([]);;
                var owner = this.owner, params = {};
                params[owner.name] = owner.value;
                var index = owner.value ? owner.value.toLowerCase() : 'null';
                if ((this.cache === null || !this.cache.hasOwnProperty(index) || index == 'null') && owner.ui.attr('url')) {
                    owner.status = 'spinner';
                    xhr({url: location.update(owner.ui.attr('url'), params),
                        rs: this.opt.rs,
                        before: null,after: null,
                        done: function (e) {
                            if ([200, 206].indexOf(this.status) < 0) {
                                msg.show({message: this.status + ': ' + this.statusText});
                            } else {
                                try {
                                    var res = JSON.parse(this.responseText);
                                    if (res.result == 'error') {
                                        owner.status = 'error';
                                    } else {
                                        var ds = (res.data||[]).map(function(e,i,a) {
                                            try { return JSON.parse(e);} catch (er) { return e; }
                                        });
                                        if (owner.typeahead.cache === null) owner.typeahead.cache = {};
                                        owner.typeahead.cache[index] = ds;
                                        owner.typeahead.show(ds);
                                        owner.typeahead.activeItem();
                                    }
                                } catch (e) {
                                    console.error(e,'сервер вернул не коректные данные');
                                }
                            }
                            if (!owner.value) owner.status = 'none';
                            return this;
                        },
                        fail: function (e) { console.error('typeahead',e); }
                    });
                } else {
                    owner.typeahead.show(this.cache[index]);
                }
            },
            show:function(data){
                var owner = this.owner;
                if (owner.ui.active) {
                    if (Object.keys(data||{}).length) {
                        this.tmpl(data);
                        fadeIn(owner.pannel)
                    } else {
                        if (owner.pannel && owner.pannel.style.display != 'none') {
                            fadeOut(owner.pannel);
                        }
                    }
                }
                return false;
            },
            onKeydown:function (e) {
                var key = (e.charCode && e.charCode > 0) ? e.charCode : e.keyCode;
                if (this.typeahead.cache !== null) {
                    var th = this.typeahead, x, ch = th.cache[th.key], v = {};
                    if (ch && typeof ch === 'object') {
                        switch (key) {
                            case 38:
                                if (th.index > 0) th.index--; else th.index = Object.keys(ch).length - 1;
                                break;
                            case 40:
                                if (th.index < Object.keys(ch).length - 1) th.index++; else th.index = 0;
                                break;
                            case 13:
                                if (th.timer) clearTimeout(th.timer);
                                if (this.pannel && this.pannel.style.display != 'none') fadeOut(this.pannel);
                            default:
                                return false;
                        }
                        v = ch[(x = Object.keys(ch)[th.index])];
                        this.value = typeof v === 'object' ? v[this.name] : v;
                        this.selectionStart = this.selectionEnd = this.value.length;
                        if (this.pannel) {
                            this.pannel.ui.el('.active', function () {
                                this.css.del('active')
                            });
                            this.pannel.ui.el('[value="' + x + '"]', function () {
                                this.css.add('active')
                            });
                        }
                    } else {
                        if (key != 9) {
                            v = {}
                        }
                    }
                    this.setValue(v);
                }
                //e.stopPropagation();
                return false;
            },
            onChange: function (e) {
                var idx, th = this.typeahead, v = {};
                if ((idx = this.value.toLowerCase()) && (th.cache||{}).hasOwnProperty(idx)) {
                    for (var k in th.cache[idx]) if (th.cache[idx][k][this.name] === idx) v = th.cache[idx][k];
                }
                this.setValue(v);
                return false;
            },
            onFocus:function(e){
                if ( this.value.length ) this.setSelectionRange(this.value.length, this.value.length);
                if ( typeof this.status === 'undefined' ) input_validator(this);
                if ( !this.value.length || (this.value.length && ['none','success'].indexOf(this.status) == -1) ) this.typeahead.delayed();
                return false;
            },
            onInput:function(e){
                this.typeahead.delayed();
                input_validator(this);
                return false;
            },
            onBlur:function(e){
                if ( this.pannel && this.pannel.style.display != 'none' ) fadeOut(this.pannel);
                var v = {};
                if (this.typeahead.cache !== null) {
                    var self = this, th = this.typeahead, ch = th.cache[th.key];
                    if ( th.timer ) { clearTimeout(th.timer); th.timer = null; }
                    if ( ch && typeof ch === 'object' ) Object.keys(ch).map(function(k){ if ( ch[k][self.name] == self.value ) { v = ch[k] }});
                }
                this.setValue(v);
                input_validator(this);
                return false;
            }
        };

        if (!element.typeahead) {
            element.typeahead = th;
            element.typeahead.opt = Object.assign({skip: 0, tmpl: 'typeahead-tmpl', rs:{}}, opt);
            element.setValue = function (v) {
                this.typeahead.value = typeof v === 'object' ? v : {};
                if (element.typeahead.opt.hasOwnProperty('fn') && typeof element.typeahead.opt.fn === 'function') {
                    if (this.typeahead.cache !== null) element.typeahead.opt.fn.call(element, this.typeahead.value);
                    else element.typeahead.opt.fn.call(element, undefined);
                }
            };
            element.typeahead.owner = inputer(element);
            element.ui.on('focus', th.onFocus).ui.on('input', th.onInput).ui.on('blur', th.onBlur).ui.on('keydown', th.onKeydown).ui.on('change', th.onChange);
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
                    this.value = this.ui.attr('placeholder');
                    pos = this.value.indexOf('_');
                    for (var i in text) if (/[\d_]/.test(text[i])) {
                        this.value = this.value.replace('_', text[i]);
                        pos = this.value.indexOf('_');
                    }
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
            if (this.ui.attr('placeholder').length && !this.value) {
                this.value = this.ui.attr('placeholder');
                this.e1 = this.selectionEnd = this.selectionStart = this.s1 = 0;
            } else {
                this.s1 = this.selectionStart; this.e1 = this.selectionEnd;
            }

            //var key = (e.charCode && e.charCode > 0) ? e.charCode : e.keyCode;
            var key =  e.charCode || e.keyCode || 0;
            if ([13,27,82].indexOf(key) != -1) return true;
            var dg = ((key >= 96 && key <= 105)) ? (key-96).toString() : String.fromCharCode(key);
            //TODO: fix for FF
            //var selected = this.value.substr(this.selectionStart,this.selectionEnd);

            switch (key) {
                case 8:
                    if (selected) {
                        var pos = this.value.indexOf(selected);
                        this.value = this.value.substr(0,pos)+this.ui.attr('placeholder').substr(pos, selected.length)+
                            this.value.substr(pos+selected.length, this.value.length);
                        var shift = this.ui.attr('placeholder').substr(pos, selected.length).indexOf('_');
                        if (shift > 0) pos += shift;
                        this.selectionStart = this.e1 = this.selectionEnd = this.s1 = pos;
                    } else {
                        this.e1 = this.s1 = --this.selectionStart; --this.selectionEnd;
                        while ((this.s1 >= 0) && !/\d/.test(this.value.charAt(this.s1))) { this.s1 = --this.selectionStart; --this.selectionEnd;}
                        if (this.s1 >= 0 && /\d/.test(this.value.charAt(this.s1))) this.value = this.value.substr(0, this.s1) + '_' + this.value.substr((this.s1+1), this.value.length);
                        else this.s1 = this.e1 + 1;
                        this.selectionStart = this.selectionEnd = this.s1;
                    }
                    this.dispatchEvent(new Event('change'));
                    break;
                case 9:
                    var el = null; var way = e.shiftKey ? -1 : 1;
                    var index = parseInt(this.ui.attr('tabindex')) + way;
                    if (index > 0) while (el = ui.el('[tabindex="'+index+'"]'))
                        if (el.ui.attr('disabled')) { index += way } else { el.ui.focus(); break; }
                    if (index <= 1 && way < 0) return e.preventDefault();
                    e.stopPropagation();
                    return false;
                case 37:
                    this.s1 = --this.selectionStart; this.e1 = --this.selectionEnd;
                    break;
                case 39:
                    this.s1 = ++this.selectionStart;
                    break;
                case 46:
                    var sl = this.value.slice(this.selectionStart),
                        tt, ts = this.ui.attr('placeholder').slice(this.selectionStart);
                    if (selected) {
                        tt = (this.value.substr(this.selectionStart+selected.length, this.value.length).match(/\d+/g)||[]).join('');
                        this.e1 = this.s1;
                    } else {
                        tt = (this.value.slice(this.selectionStart).match(/\d+/g)||[]).join('').slice(1);
                    }
                    for (var i in tt) ts = ts.replace('_', tt[i]);
                    this.value = this.value.replace(sl, ts);
                    this.selectionStart = this.s1 ; this.selectionEnd = this.e1;
                    break;
                default: this.insertDigit(dg, selected);
            }
            e.preventDefault(); e.stopPropagation();
            return /d/.test(dg);
        }).ui.on('focus', function (e) {
            this.init(false);
            return false;
        }).ui.on('blur',function(e) {
            if (this.value.match(/[\d]+/g)) this.value = !this.cleared ? this.value : this.value.replace(/\_/g, '');
            else this.value = '';
            input_validator(this);
            return false;
        }).ui.on('paste',function(e) {
            var dgs = e.clipboardData.getData('Text').match(/\d+/g) ? e.clipboardData.getData('Text').match(/\d+/g).join('') : '';
            //TODO pate afte cursor position & past selected pice
            for (var i in dgs) this.insertDigit(dgs[i], selected);
            return false;
        });
    }
    return el;
    }; g.maskedigits = maskedigits;

}( window, window.ui ));