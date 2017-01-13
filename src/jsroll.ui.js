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
'use strict';

g.config = {
    app: {container:'[role="workspace"]'},
    msg: {container:'.alert.alert-danger', tmpl:'alert-box'},
    spinner: '.locker.spinner',
    popup: {wnd:'.b-popup', container:'.b-popup .b-popup-content'}
};

var ui = function(instance){
    this.instance = instance || g;
    return this;
}; ui.prototype = {
    create:function(el, v){
        if (typeof el === 'object') { var o = new ui(el); if (o && typeof v == 'string') g[v]=o; return o }
        return null;
    },
    el: function (s, v) {
        var el = null;
        if (typeof s === 'string') {
            if (!s.match(/^#*/)) el = g.document.getElementById(s.replace(/^#/, ''));
            else el = this.instance.querySelector(s);
        } else if (typeof s === 'object') { el = s }
        if (el) {
            if (!el.hasOwnProperty('ui')) { el.ui = new ui(el); el.css = new css(el); }
            if (typeof v === 'string') g[v] = el;
            else if (typeof v === 'function') v.call(el, arguments);
        }
        return el;
    },
    els: function (s, fn, v) {
        if (typeof s === 'string') {
            var els = this.instance.querySelectorAll(s), c = 0;
            if (!els) return []; return Array.prototype.slice.call(els).map(function (i) {
                if (!i.hasOwnProperty('ui')) { i.ui = new ui(i); i.css = new css(i); }
                if (typeof fn == 'function') fn.call(g, i, c++);
                if (typeof fn == 'string' || typeof v == 'string') { if (!g[v]) g[v]=[]; g[v].push(i) }
                return i;
            });
        } else return [];
    },
    attr: function (a, v) {
        if (a && typeof v === 'undefined') try {
            return JSON.parse(this.instance.getAttribute(a));
        } catch (e) {
            return this.instance.getAttribute(a);
        } else if (a && v)
            if (typeof v === 'object') this.instance.setAttribute(a, JSON.stringify(v));
            else this.instance.setAttribute(a, v);
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
    get parent(){
        return new ui(this.instance && this.instance.parentElement)
    },
    src: function (e) {
        var el = e ? e : this.instance;
        return new ui(el.srcElement || el.target);
    },
    css: function() {
      return g.css.el(this.instance);
    },
    on: function (evnt, fn, opt) {
        this.instance.addEventListener(evnt, fn, opt || true);
        return this.instance;
    },
    xml:function(d, mime){
        var xml, tmp;
        if ( !d || typeof d !== 'string' ) return null;
        try {
            if ( g.DOMParser ) {
                tmp = new DOMParser();
                xml = tmp.parseFromString( d, mime || 'text/xml' );
            } else {
                xml = new ActiveXObject( 'Microsoft.XMLDOM' );
                xml.async = 'false';
                xml.loadXML( d );
            }
        } catch ( e ) {
            xml = undefined;
        }
        return xml;
    }
};  g.ui = new ui(document);

var css = function(instance){
    this.instance = instance;
    return this;
};
css.prototype = {
    el: function(i){
      this.instance = typeof i === 'string' ? document.querySelector(i) : i ; return this;
    },
    style:function(k,v){
        this.instance.style[k] = v;
    },
    re: function (s, g) { return new RegExp(s, g || 'g') },
    has: function(c){
        return this.instance.className.match(this.re('(?:^|\\s)' + c + '(?!\\S)'));
    },
    add: function (c) {
        if (!this.has(c)) this.instance.className += ' ' + c;
        return this;
    },
    del: function (c) {
        this.instance.className = this.instance.className.replace(this.re('(?:^|\\s)' + c + '(?!\\S)'), '');
        return this;
    },
    tgl: function (c) {
        if (!this.has(c)) this.instance.className += ' ' + c;
        else this.instance.className = this.instance.className.replace(this.re('(?:^|\\s)' + c + '(?!\\S)'), '');
        return this;
    }
}; g.css = new css(document);

Object.defineProperty(g, 'selected', {
    get: function selected() {
        return  g.getSelection ? g.getSelection().toString() : // Not IE, используем метод getSelection
            document.selection.createRange().text; // IE, используем объект selection
    }
});
}( window ));

(function ( g, ui, undefined ) {
'use strict';
if ( typeof ui === 'undefined' ) return false;

var msg = {
    elem: ui.el(g.config.msg.container),
    show: function (params, close) {
        this.elem.innerHTML = tmpl(g.config.msg.tmpl, params);
        this.elem.style.display = 'inherit';
        if (typeof close == 'undefined' || !close) fadeOut(this.elem, 90);
    }
}; g.msg = msg;

var popup = {
    visible: false,
    wnd: ui.el(g.config.popup.wnd),
    container: ui.el(g.config.popup.container),
    init: function (params) {
        if (typeof params === 'object') {
            if (params.width) {
                this.container.style.width = params.width + 'px';
                this.container.style.marginLeft = (params.width / (-2)) + 'px';
            }
            if (params.height) {
                this.container.style.height = params.height + 'px';
                this.container.style.marginTop = (params.height / (-2)) + 'px';
            }
        }
    },
    show: function (params) {
        if (this.wnd) {
            this.wnd.style.opacity = '0';
            params.content && this.container && (this.container.innerHTML = params.content);
            if (typeof params === 'object') (params.width || params.height) && this.init(params);
            this.container.ui.els('[role="popup-close"]', function (a) {
                a.ui.on('click', function (e) { return popup.hide() })
            });
            if (params.event && params.event.length) params.event.map(function (a, i) { a.call(popup, i) });
            this.visible = true;
            fadeIn(this.wnd, 35);
            params.cb && params.cb.call(this);
            this.container.ui.el('[tabindex="1"]', function(){this.focus()});
        }
    },
    hide: function (param) {
        if (this.wnd) {
            this.visible = false;
            fadeOut(this.wnd, param || 35);
        }
    }
}; g.popup = popup;

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

g.formvalidator = function(res) {
var test = function(element){
    if (element) {
        var res = true;
        if ((element.getAttribute('required') !== null) && !element.value) res = false;
        else if ((element.getAttribute('required') === null) && !element.value) res = true;
        else if (element.getAttribute('pattern') === null) res = true;
        else { try {
            var pattern = /[?\/]([^\/]+)\/([^\/]*)/g.exec(element.getAttribute('pattern')) || [];
            var re = new RegExp(pattern[1], pattern[2]);
            res = re.test(element.value.trim());
        } catch(e) { res = false }
        }

        var el = inputer(element.hasOwnProperty('ui') ? element.ui : ui.create(element));
        if (!res) el.instance.status = 'error';
        else if (!el.instance.hasAttribute('disabled'))
            if (element.value.length) el.instance.status = 'success'; else el.instance.status = null;
        return res;
    }
    return false;
};

var result = true;
for (var i =0; i < this.elements.length; i++) result = result & test(this.elements[i]);

if (!result) {
    spinner = false;
    msg.show({message: 'неверно заполнены поля формы!'});
}
return result;
};

var typeahead = function (element, opt) {
if (element) {
    var instance = element.hasOwnProperty('ui') ? element : ui.create(element).instance;
    var th = {
        tmpl:function(data){
            var self = this.owner;
            this.index = 0; this.key = self.value.toLowerCase() || 'null';
            if (self.pannel) {
                var n = ui.xml(tmpl(this.opt.tmpl, {data:data})).firstChild;
                if (n) self.pannel.innerHTML = n.innerHTML;
            } else {
                self.ui.parent.instance.insertAdjacentHTML('beforeend', tmpl(this.opt.tmpl, {data: data}));
                self.ui.parent.css().add('dropdown');
                self.pannel = self.ui.parent.el('.dropdown-menu.list');
            }
            self.ui.parent.els('.dropdown-menu.list li', function (i) {
                i.ui.on('mousedown', function (e) {
                    self.value = this.innerHTML;
                    if (self.typeahead.opt.key) self.typeahead.opt.key.value = this.ui.attr('value');
                    return false;
                });
            });
        },
        xhr:function(){
            var self = this.owner, params = {};
            params[self.name] = self.value;
            var index = self.value ? self.value.toLowerCase() : 'null';
            if (!this.cache.hasOwnProperty(index) || index == 'null'){
                self.status = 'spinner';
                xhr.request({url: location.update(self.ui.attr('url'), params), rs: {'Hash': acl.user.hash}})
                    .result(function (d) {
                        if ([200, 206].indexOf(this.status) < 0) {
                            msg.show({error: 'ОШИБКА', message: this.status + ': ' + this.statusText});
                        } else {
                            try {
                                var res = JSON.parse(this.responseText);
                                if (res.result == 'error') {
                                    msg.show(res);
                                } else {
                                    self.typeahead.cache[index] = res.data;
                                    self.typeahead.show(res.data);
                                }
                            } catch (e) {
                                msg.show({message: 'сервер вернул не коректные данные'});
                            }
                        }
                        self.status = 'none';
                        return this;
                    });
            } else {
                self.typeahead.show(this.cache[index]);
            }
        },
        show:function(data){
            var self = this.owner;
            if (self === g.document.activeElement) if (Object.keys(data).length) {
                this.tmpl(data);
                return fadeIn(self.pannel);
            } else {
                if (self.pannel) {
                    self.pannel.innerHTML = null;
                    fadeOut(self.pannel);
                }
            }
            return false;
        },
        onKeydown:function (e) {
            var key = (e.charCode && e.charCode > 0) ? e.charCode : e.keyCode;
            var th = this.typeahead, cashe = th.cache[th.key],cnt = Object.keys(cashe || {}).length - 1,y = 0;
            switch (key) {
                case 38:
                    for (var x in cashe) {
                        if (y == th.index) {
                            this.value = cashe[x];
                            if (th.opt.key) th.opt.key.value = x;
                            this.selectionStart = this.selectionEnd = this.value.length;
                            if (th.index > 0) th.index--; else th.index = cnt;
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                        y++;
                    }
                    return false;
                case 40:
                    for (var x in cashe) {
                        if (y == th.index) {
                            this.value = cashe[x];
                            if (th.opt.key) th.opt.key.value = x;
                            this.selectionStart = this.selectionEnd = this.value.length;
                            if (th.index < cnt) th.index++; else th.index = 0;
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                        y++;
                    }
                    return false;
                case 13:
                    this.status = 'none';
                    fadeOut(this.pannel);
                    e.preventDefault();
                    return e.stopPropagation();
                default: return false;
            }
        },
        onChange: function (e) {
            var th = this.typeahead;
            if (th.opt.key) {
                th.opt.key.value = '';
                if (this.value && th.cache.hasOwnProperty(this.value.toLowerCase())) {
                    var ds = this.typeahead.cache[this.value.toLowerCase()];
                    for (var x in ds) if (ds[x].toLowerCase() === this.value.toLowerCase()) th.opt.key.value = x;
                }
                return th.opt.key.value;
            }
            return false;
        },
        onFocus:function(e){
            this.typeahead.xhr();
            return false;
        },
        onInput:function(e){
            this.typeahead.xhr();
            return false;
        },
        onBlur:function(e){
            fadeOut(this.pannel);
            return false;
        }
    };
    th.index = 0; th.key = null; th.cache = {}; th.opt = {master:[], slave:[], tmpl:'typeahead-tmpl'};
    instance.typeahead = th;
    th.opt = Object.assign(th.opt, opt);
    instance.typeahead.owner = element;
    inputer(instance.ui).on('focus',th.onFocus).ui.on('input',th.onInput)
        .ui.on('blur',th.onBlur).ui.on('keydown', th.onKeydown).ui.on('change',th.onChange);
    if (!instance.ui.attr('tabindex')) instance.ui.attr('tabindex', '0');
    return instance;
}
}; g.typeahead = typeahead;

var inputer = function(el) {
if (el && !el.instance.hasOwnProperty('status')) {
    var parent = el.parent;
    el.instance.chk = parent.el('span');
    Object.defineProperty(el.instance, 'status', {
        set: function status(stat) {
            parent.css().add('has-feedback').del('has-error').del('has-warning').del('has-success');
            if (this.chk)  this.chk.css.del( 'glyphicon-ok').del('glyphicon-warning-sign').del('glyphicon-remove').del('spinner');
            switch (stat) {
                case 'error':
                    this._status = 'error';
                    if (this.chk) this.chk.css.add('glyphicon-remove');
                    parent.css().add('has-error');
                    break;
                case 'warning':
                    this._status = 'warning';
                    if (this.chk) this.chk.css.add('glyphicon-warning-sign');
                    parent.css().add('has-warning');
                    break;
                case 'success':
                    this._status = 'success';
                    if (this.chk) this.chk.css.add('glyphicon-ok');
                    parent.css().add('has-success');
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

var maskedigits = function(elemetn, pattern) {
var el = inputer(elemetn);
if (el.instance.tagName === 'INPUT') {
    if (pattern) el.instance.maxLength = el.attr('placeholder', pattern || '').attr('placeholder').length;
    if (!el.attr('tabindex')) el.attr('tabindex', '0');
    if (el && !el.instance.hasOwnProperty('insertDigit')) {
        el.instance.insertDigit = function(dg, selected) {
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
                var pos = (text).indexOf('_');
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
        el.instance.init = function (clear) {
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
    el.instance.init(true);
    el.on('keydown', function (e) {
        if (this.ui.attr('placeholder').length && !this.value) {
            this.value = this.ui.attr('placeholder');
            this.e1 = this.selectionEnd = this.selectionStart = this.s1 = 0;
        }

        var selected = window.getSelection().toString();
        var key = (e.charCode && e.charCode > 0) ? e.charCode : e.keyCode;
        var dg = ((key >= 96 && key <= 105)) ? (key-96).toString() : String.fromCharCode(key);
        switch (key) {
            case 8:
                if (selected ) {
                    var pos = this.value.indexOf(selected);
                    this.value = this.value.substr(0,pos)+this.ui.attr('placeholder').substr(pos, selected.length)+
                        this.value.substr(pos+selected.length, this.value.length);
                    var shift = this.ui.attr('placeholder').substr(pos, selected.length).indexOf('_');
                    if (shift > 0) pos += shift;
                    this.selectionStart = this.e1 = this.selectionEnd = this.s1 = pos;
                } else {
                    this.e1 = this.s1 = --this.selectionStart;  --this.selectionEnd;
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
                    if (el.ui.attr('disabled')) index += way; else { el.focus(); break; }
                if (index <= 1 && way < 0) return e.preventDefault();
                e.stopPropagation();
                return false;
            case 37:
                this.s1 = --this.selectionStart; this.e1 = --this.selectionEnd;
                break
            case 39:
                this.s1 = ++this.selectionStart;
                break
            default:
                this.insertDigit(dg, selected);
        }
        e.preventDefault(); e.stopPropagation();
        return /d/.test(dg);
    }, false).ui.on('focus', function (e) {
        this.init(false); e.preventDefault(); e.stopPropagation();
        return false;
    }, false).ui.on('blur',function(e){
        if (this.value.match(/[\d]+/g)) this.value = this.value.replace(/\_/g, '');
        else this.value = '';
        e.preventDefault(); e.stopPropagation();
        return false;
    }, false).ui.on('paste',function(e){
        var dgs = e.clipboardData.getData('Text').match(/\d+/g) ? e.clipboardData.getData('Text').match(/\d+/g).join('') : ''
        //TODO pate afte cursor position & past selected pice
        var selected = window.getSelection().toString();
        for (var i in dgs) this.insertDigit(dgs[i], selected);
        e.preventDefault(); e.stopPropagation();
        return false;
    }, false);
}
return el;
}; g.maskedigits = maskedigits;

}( window, window.ui ));