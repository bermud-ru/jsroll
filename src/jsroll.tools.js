/**
 * @app jsroll.tools.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 16/04/2020
 * @status beta
 * @version 2.1.1b
 * @revision $Id: jsroll.tools.js 2.1.1b 2020-04-16 10:10:01Z $
 */

var tool = function () {
}; tool.prototype = {
    ping: function (host) {
        var img = new Image();
        img.ping_checked = false;
        img.onload = function () {
            if (!img.ping_checked) console.log(host + ' is alive in', (new Date().getTime()) - img.start, 'ms');
            img.ping_checked = true
        };
        img.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
            if (!img.ping_checked) console.log(host + ' is alive in', (new Date().getTime()) - img.start, 'ms');
            img.ping_checked = true
        };

        img.start = new Date().getTime();
        img.src = "//" + host;

        if (!img.ping_checked) this.timer = setTimeout(function () {
            if (!img.ping_checked) console.log(host + ' unreachable in', (new Date().getTime()) - img.start, 'ms');
            img.ping_checked = true
        }, 1500);
        return '';
    }
};
window.tool = new tool();