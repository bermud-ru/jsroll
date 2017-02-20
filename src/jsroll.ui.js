/**
 * @app jsroll.ui.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
 * @author Андрей Новиков <andrey@novikov.be>
 * @status beta
 * @version 0.1.0
 * @revision $Id: jsroll.ui.js 0004 2016-05-30 9:00:01Z $
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

    var css = function(instance){
        this.instance = instance;
        return this;
    }; css.prototype = {
        el: function(i) {
            this.instance = typeof i === 'string' ? document.querySelector(i) : i ; return this;
        },
        style:function(k,v) {
            this.instance.style[k] = v;
            return this;
        },
        has: function(c){
            return this.instance.className.match(re('(?:^|\\s)' + c + '(?!\\S)'));
        },
        add: function (c) {
            if (this.instance && !this.has(c)) this.instance.className += ' ' + c;
            return this;
        },
        del: function (c) {
            if (this.instance) this.instance.className = this.instance.className.replace(re('(?:^|\\s)' + c + '(?!\\S)'), '');
            return this;
        },
        tgl: function (c) {
            if (this.instance) {
                if (!this.has(c)) this.instance.className += ' ' + c;
                else  this.instance.className = this.instance.className.replace(re('(?:^|\\s)' + c + '(?!\\S)'), '');
            }
            return this;
        }
    }; g.css = new css(g);

    var ui = function(instance) {
        if (instance.hasOwnProperty('ui')) return instance;
        this._parent = null;
        this.instance = instance || g;
        if (instance) { this.instance.css = new css(this.instance); this.wrap(this.instance.parentElement); }
        return this;
    }; ui.prototype = {
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
                var r = [];
                s.split(',').map((function (x) {
                    r.push.apply(r,Array.prototype.slice.call(this.instance.querySelectorAll(x)||{}).map(function (e, i, a) {
                        if (!e.hasOwnProperty('ui')) e.ui = new ui(e);
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
                            data[name] = e.nodeValue
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
            Array.prototype.slice.call(arguments, i).forEach( function(v, k, a) {
                Object.defineProperties(t, Object.keys(v).reduce( function (d, key) {
                    d[key] = Object.getOwnPropertyDescriptor(v, key);
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
            this.instance.addEventListener(event, fn, !!opt);
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
            if (s) el = (typeof s == 'string' ? document.querySelector(s) : s); else el = this.instance;
            if (el) g.setTimeout(function() { el.focus(); return false }, 0);
            return el;
        }
    }; g.ui = new ui(document);

    Object.defineProperty(g, 'selected', {
        get: function selected() {
            return  g.getSelection ? g.getSelection().toString() : // Not IE, используем метод getSelection
                document.selection.createRange().text; // IE, используем объект selection
        }
    });

    function selecting() {
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    }; g.selecting = selecting;

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
        ui.on("keydown", function (e) { if (e.keyCode == 27 ) g.app.popup(); });
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
            if (el && !el.hasOwnProperty('dim')) {
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

        popup: function (id, data, opt) {
            this.wnd = this.wnd || ui.el(g.config.popup.wnd);
            if (arguments.length && !this.wnd.visible) {
                this.container = this.container || ui.el(g.config.popup.container);
                tmpl(id, data, this.variable(this.container, id), opt);
                fadeIn(this.wnd, 35);
                this.wnd.visible = true;
            } else {
                if (this.wnd.visible) fadeOut(this.wnd, 35);
                this.wnd.visible = false;
            }
            return this.container;
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
                        fadeIn(self, this.sleep); self.faded = true;
                    } else if (!arguments.length && self.faded) {
                        fadeOut(self, this.sleep); self.faded = false;
                    }
                    return self;
                };
            }
            return self;
        }

    }; g.app = new app(g.document);

    var filter = function (els, v) {
        var elements = [], index = 0;
        if (els) {
            if (typeof v === 'object' && v.hasOwnProperty('page')) index = v['page'];
            els.map(function (e, i, a) {
                e.ui.el('input', function (e) {
                    elements.push(this);
                    if (typeof v === 'object' && v.hasOwnProperty(this.name)) this.value = v[this.name];
                    input_validator(this);
                });
            });

            return {
                el: elements,
                index: index,
                get valid(){
                    var valid = true;
                    this.el.map(function (e,i,a) { valid = valid & input_validator(e) });
                    return valid;
                },
                set params(v) {
                    var params = {};
                    if (typeof v === 'object') params = v; else if (typeof v === 'string') params = location.decoder(v);
                    this.valid = true;
                    if (params.hasOwnProperty('page')) this.index = params['page'];
                    this.el.map(function (e,i,a) {
                        if (params.hasOwnProperty(e.name)) e.value = params[e.name];
                        else e.value = '';
                        input_validator(e);
                    });
                },
                get params() {
                    var params = {}, self = this;
                    this.el.map(function (e,i,a) {
                        if (e.value) params[e.name] = e.value;
                        input_validator(e);
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
                }
            };
        }
        return null;
    }; g.filter = filter;

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
            if (typeof close == 'undefined' || !close) fadeOut(this.elem, 90);
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

    var input_validator = function(element){
        if (element) {
            var res = true;
            if ((element.getAttribute('required') !== null) && !element.value) res = false;
            else if ((element.getAttribute('required') === null) && !element.value) res = true;
            else if (element.getAttribute('pattern') === null) res = true;
            else {
                try {
                    var pattern = /[?\/]([^\/]+)\/([^\/]*)/g.exec(element.getAttribute('pattern')) || [];
                    var re = new RegExp(pattern[1], pattern[2]);
                    res = re.test(element.value.trim());
                } catch(e) { res = false }
            }

            var el = inputer(ui.wrap(element));
            if (!res) el.status = 'error';
            else if (!el.hasAttribute('disabled'))
                if (element.value.length) el.status = 'success'; else el.status = 'none';
            return res;
        }
        return false;
    };  g.input_validator = input_validator;

    var inputer = function(el) {
        if (el && !el.hasOwnProperty('status')) {
            el.chk = el.parentElement.ui.el('span');
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
                            if (this.chk) this.chk.css.add('glyphicon-warning-sign');
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
        var result = true;
        for (var i =0; i < this.elements.length; i++) result = result & input_validator(this.elements[i]);

        if (!result) {
            if (spinner) spinner = false;
            msg.show({message: 'неверно заполнены поля формы!'});
        }
    return result;
    };

    var typeahead = function (element, opt) {
    if (element && element.tagName === 'INPUT') {
        var th = {
            delta: 700,
            timer: null,
            request: null,
            delayed: function () {
                input_validator(this.owner);
                if (!this.timer) {
                    var fn = function fn () {
                            this.xhr();
                            this.timer = null
                            if (this.request && this.request != 'null' && this.request != this.owner.value ) {
                                this.request = this.owner.value;
                                this.timer = g.setTimeout(fn.bind(this), this.delta);
                            }
                        };
                    this.timer = g.setTimeout(fn.bind(this), this.delta);
                }
            },
            activeItem:function () {
                var owner = this.owner, cache = this.cache[this.key] || {};
                if (owner.pannel) {
                    owner.pannel.ui.el('.active', function () {
                        this.css.del('active')
                    });
                    var values = Object.keys(cache).map(function(k){return cache[k]});
                    var idx = values.indexOf(owner.value);
                    if (idx != -1) {
                        owner.pannel.ui.el('[value="' + (Object.keys(cache)[idx]) + '"]', function () {
                            this.css.add('active');
                        });
                    }
                }
            },
            tmpl:function(data){
                var owner = this.owner;
                this.index = 0; this.key = owner.value.toLowerCase() || 'null';
                if (owner.pannel) {
                    var n = ui.dom(tmpl(this.opt.tmpl, {data:data}));
                    if (n) owner.pannel.innerHTML = n.innerHTML;
                } else {
                    owner.parentElement.insertAdjacentHTML('beforeend', tmpl(this.opt.tmpl, {data: data}));
                    owner.parentElement.css.add('dropdown');
                    owner.pannel = owner.parentElement.ui.el('.dropdown-menu.list');
                }
                this.activeItem();
                owner.parentElement.ui.els('.dropdown-menu.list li', function () {
                    this.ui.on('mousedown', function (e) {
                        owner.value = this.innerHTML;
                        if (owner.typeahead.opt.key) owner.typeahead.opt.key.value = this.ui.attr('value');
                        input_validator(owner);
                        return false;
                    });
                });
            },
            xhr:function(){
                var owner = this.owner, params = {};
                params[owner.name] = owner.value;
                var index = owner.value ? owner.value.toLowerCase() : 'null';
                if ((!this.cache.hasOwnProperty(index) || index == 'null') && owner.ui.attr('url')) {
                    owner.status = 'spinner';
                    xhr({url: location.update(owner.ui.attr('url'), params),
                        rs: {'Hash': acl.user.hash},
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
                                        owner.typeahead.cache[index] = res.data;
                                        owner.typeahead.show(res.data);
                                        input_validator(owner);
                                        owner.typeahead.activeItem();
                                    }
                                } catch (e) {
                                    msg.show({message: 'сервер вернул не коректные данные'});
                                    console.log({message: 'сервер вернул не коректные данные'});
                                }
                            }
                            if (!owner.value) owner.status = 'none';
                            return this;
                        },
                        fail: function (e) { console.error('typeahead',e); }
                    });
                } else {
                    owner.typeahead.show(this.cache[index]);
                    input_validator(owner);
                }
            },
            show:function(data){
                var owner = this.owner;
                if (owner.ui.active) {
                    if (Object.keys(data||{}).length) {
                        this.tmpl(data);
                        fadeIn(owner.pannel)
                    } else {
                        if (owner.pannel) {
                            //owner.pannel.innerHTML = null;
                            fadeOut(owner.pannel);
                        }
                    }
                }
                return false;
            },
            onKeydown:function (e) {
                var key = (e.charCode && e.charCode > 0) ? e.charCode : e.keyCode;
                var th = this.typeahead, x = 0;

                switch (key) {
                    case 38:
                        if (th.index > 0) th.index--; else th.index = Object.keys(th.cache[th.key]||{}).length - 1;
                        break;
                    case 40:
                        if (th.index < Object.keys(th.cache[th.key]||{}).length - 1) th.index++; else th.index = 0;
                        break;
                    case 13:
                        input_validator(this);
                        fadeOut(this.pannel);
                    default: return false;
                }

                this.value = th.cache[th.key][(x=Object.keys(th.cache[th.key])[th.index])];
                if (input_validator(this) && th.opt.key) th.opt.key.value = x;
                this.selectionStart = this.selectionEnd = this.value.length;
                if (this.pannel) {
                    this.pannel.ui.el('.active',function (){this.css.del('active')});
                    this.pannel.ui.el('[value="'+x+'"]',function (){this.css.add('active')});
                }
                return false;
            },
            onChange: function (e) {
                var th = this.typeahead;
                if (th.opt.key) {
                    th.opt.key.value = '';
                    var idx;
                    if ((idx = this.value.toLowerCase()) && th.cache.hasOwnProperty(idx)) {
                        var ds = this.typeahead.cache[idx];
                        for (var x in ds) if (ds[x] === idx) th.opt.key.value = x;
                    }
                    return th.opt.key.value;
                }
                return false;
            },
            onFocus:function(e){
                this.typeahead.delayed();
                return false;
            },
            onInput:function(e){
                this.typeahead.delayed();
                return false;
            },
            onBlur:function(e){
                fadeOut(this.pannel);
                return false;
            }
        };

        //TODO: relise master & slave data
        th.index = 0; th.key = null; th.cache = {}; th.opt = {master:[], slave:[], tmpl:'typeahead-tmpl'};
        element.typeahead = th;
        th.opt = Object.assign(th.opt, opt);
        element.typeahead.owner = inputer(element);
        element.ui.on('focus',th.onFocus).ui.on('input',th.onInput).ui.on('blur',th.onBlur).ui.on('keydown', th.onKeydown)
            .ui.on('change',th.onChange);
        if (!element.ui.attr('tabindex')) element.ui.attr('tabindex', '0');
        return element;
    }
    }; g.typeahead = typeahead;

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
                return this.selectionStart;
            };
            el.init = function (clear) {
                var text = this.value;
                var pos = 0;
                if (text) {
                    this.value = this.ui.attr('placeholder');
                    pos = this.value.indexOf('_');
                    for (var i in text) if (/\d/.test(text[i])) {
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

            var key = (e.charCode && e.charCode > 0) ? e.charCode : e.keyCode;
            if ([13,27,82].indexOf(key) != -1) return true;
            var dg = ((key >= 96 && key <= 105)) ? (key-96).toString() : String.fromCharCode(key);

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
                    break;
                case 9:
                    var el = false; var way = e.shiftKey ? -1 : 1;
                    var index = parseInt(this.ui.attr('tabindex'));
                    if (index > 0) while (el = ui.el('[tabindex="'+index+'"]'))
                        if (el.ui.attr('disabled')) index += way; else { el.ui.focus(); break; }
                    if (index <= 1 && way < 0) return e.preventDefault();
                    e.stopPropagation();
                    return false;
                case 37:
                    this.s1 = --this.selectionStart; this.e1 = --this.selectionEnd;
                    break
                case 39:
                    this.s1 = ++this.selectionStart;
                    break
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
                    break
                default: this.insertDigit(dg, selected);
            }
            e.preventDefault(); e.stopPropagation();
            return /d/.test(dg);
        }).ui.on('focus', function (e) {
            this.init(false); e.preventDefault(); e.stopPropagation();
            return false;
        }).ui.on('blur',function(e){
            if (this.value.match(/[\d]+/g)) this.value = !this.cleared ? this.value : this.value.replace(/\_/g, '');
            else this.value = '';
            e.preventDefault(); e.stopPropagation();
            return false;
        }).ui.on('paste',function(e){
            var dgs = e.clipboardData.getData('Text').match(/\d+/g) ? e.clipboardData.getData('Text').match(/\d+/g).join('') : ''
            //TODO pate afte cursor position & past selected pice
            for (var i in dgs) this.insertDigit(dgs[i], selected);
            e.preventDefault(); e.stopPropagation();
            return false;
        });
    }
    return el;
    }; g.maskedigits = maskedigits;

}( window, window.ui ));