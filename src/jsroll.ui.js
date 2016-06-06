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
        msg: {container:'.alert.alert-danger', tmpl:'handlebars-alert'},
        spinner: '.locker.spinner',
        popup: {wnd:'.b-popup', container:'.b-popup .b-popup-content'}
    };

    var spa = function(instance){
        this.instance = instance || g;
        return this;
    }; spa.prototype = {
        el: function (s) {
            var el = null;
            if (typeof s === 'string') {
                if (!s.match(/^#*/)) el = g.document.getElementById(s.replace(/^#/, ''))
                else el = this.instance.querySelector(s);
                if (el && !el.hasOwnProperty('spa')) { el.spa = new spa(el); el.css = new css(el); }
            }
            return el;
        },
        els: function (s, fn) {
            if (typeof s === 'string') {
                var el = this.instance.querySelectorAll(s);
                if (!el) return [];
                var a = Array.prototype.slice.call(el);
                return a.map(function (i) { if (!i.hasOwnProperty('spa')) {
                    i.spa = new spa(i);i.css = new css(i);
                    if (typeof fn == 'function') fn.apply(i, a);
                } return i });
            } else return [];
        },
        json: function (a) {
            if (a) try {
                return JSON.parse(this.instance.getAttribute(a))
            } catch (e) {
                return this.instance.getAttribute(a)
            }
            return {};
        },
        src: function (e) {
            var el = e ? e : this.instance;
            return el.srcElement || el.target;
        },
        on: function (evnt, fn, opt) {
            this.instance.addEventListener(evnt, fn, opt || true);
            return this.instance;
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
        re: function (s, g) { return new RegExp(s, g || 'g') },
        add: function (c) {
            if (!this.instance.className.match(this.re('(?:^|\\s)' + c + '(?!\\S)'))) this.instance.className += ' ' + c;
            return this;
        },
        del: function (c) {
            this.instance.className = this.instance.className.replace(this.re('(?:^|\\s)' + c + '(?!\\S)'), '');
            return this;
        },
        tgl: function (c) {
            if (!this.instance.className.match(this.re('(?:^|\\s)' + c + '(?!\\S)'))) this.instance.className += ' ' + c;
            else this.instance.className = this.instance.className.replace(this.re('(?:^|\\s)' + c + '(?!\\S)'), '');
            return this;
        }
    }; g.css = new css(document);

    var msg = {
        elem: g.spa.el(g.config.msg.container),
        show: function (params, close) {
            this.elem.innerHTML = tmpl(g.config.msg.tmpl, params);
            this.elem.style.display = 'inherit';
            if (typeof close == 'undefined' || !close) fadeOut(this.elem, 105);
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
                g.spa.els('[role="popup-close"]', function (a) {
                    this.spa.on('click', function (e) { return popup.hide() })
                });
                if (params.event && params.event.length) params.event.map(function (a, i) { a.call(popup, i) });
                this.visible = true;
                fadeIn(this.wnd, 35);
                params.cb && params.cb.call(this);
            }
        },
        hide: function (t) {
            if (this.wnd) {
                this.visible = false;
                fadeOut(this.wnd, t || 35);
            }
        }
    }; g.popup = popup;

    var spinner = {
        element: g.spa.el(g.config.spinner),
        set run(v) {
            v ? this.element.style.display = 'block' : this.element.style.display = 'none';
        },
        get run() {
            if (this.element.style.display == 'none') return false; else
                return true;
        }
    }; g.spinner = spinner;

}( window ));