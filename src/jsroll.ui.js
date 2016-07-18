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

    var spa = function(instance){
        this.instance = instance || g;
        return this;
    }; spa.prototype = {
        create:function(el, v){
            if (typeof el === 'object') { var o = new spa(el); if (o && typeof v == 'string') g[v]=o; return o }
            return null;
        },
        el: function (s, v) {
            var el = null;
            if (typeof s === 'string') {
                if (!s.match(/^#*/)) el = g.document.getElementById(s.replace(/^#/, ''));
                else el = this.instance.querySelector(s);
                if (el){
                    if (!el.hasOwnProperty('spa')) { el.spa = new spa(el); el.css = new css(el); }
                    if (typeof v === 'string') g[v] = el;
                    else if (typeof v === 'function') v.call(el, arguments);
                }
            }
            return el;
        },
        els: function (s, fn, v) {
            if (typeof s === 'string') {
                var el = this.instance.querySelectorAll(s);
                if (!el) return [];
                var a = Array.prototype.slice.call(el), c = 0;
                return a.map(function (i) { if (!i.hasOwnProperty('spa')) {
                    i.spa = new spa(i); i.css = new css(i);
                    if (typeof fn == 'function') fn.call(g, i, c++);
                    if (typeof fn == 'string' || typeof v == 'string') { if (!g[v]) g[v]=[]; g[v].push(i) }
                } return i });
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
        get parent(){
            return new spa(this.instance && this.instance.parentElement)
        },
        src: function (e) {
            var el = e ? e : this.instance;
            return new spa(el.srcElement || el.target);
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
    };  g.spa = new spa(document);

    var css = function(instance){
        this.instance = instance;
        return this;
    };
    css.prototype = {
        el: function(i){
            this.instance = i; return this;
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

    var msg = {
        elem: g.spa.el(g.config.msg.container),
        show: function (params, close) {
            this.elem.innerHTML = tmpl(g.config.msg.tmpl, params);
            this.elem.style.display = 'inherit';
            if (typeof close == 'undefined' || !close) fadeOut(this.elem, 90);
        }
    }; g.msg = msg;

    var popup = {
        visible: false,
        wnd: g.spa.el(g.config.popup.wnd),
        container: g.spa.el(g.config.popup.container),
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
                this.container.spa.els('[role="popup-close"]', function (a) {
                    a.spa.on('click', function (e) { return popup.hide() })
          2      });
                if (params.event && params.event.length) params.event.map(function (a, i) { a.call(popup, i) });
                this.visible = true;
                fadeIn(this.wnd, 35);
                params.cb && params.cb.call(this);
                this.container.spa.el('[tabindex="1"]', function(){this.focus()});
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
    g.spinner_element = g.spa.el(g.config.spinner);
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

    Object.defineProperty(g, 'selected', {
        get: function selected() {
            return  g.getSelection ? g.getSelection().toString() : // Not IE, используем метод getSelection
                document.selection.createRange().text; // IE, используем объект selection
        }
    });

}( window ));