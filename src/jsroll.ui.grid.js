/**
 * @app jsroll.ui.grid.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 01/04/2022
 * @status beta
 * @version 2.1.1b
 * @revision $Id: jsroll.ui.grid.js 2.1.1b 2022-04-01 10:10:01Z $
 */

(function (  g, ui, undefined ) {
    'suspected';
    'use strict';

    if ( typeof ui === 'undefined' ) return false;

    var Cursor = function () {
        this.range = g.document.createRange();
        this.selection = g.getSelection();
    }; Cursor.prototype = {
        current: null,
        at: function (el, off) {
            this.current = el;
            el.contentEditable = true;
            this.range.setStart(el, off||0);
            this.range.collapse(true);
            this.selection.removeAllRanges();
            this.selection.addRange(this.range);
        },
        left: function (el, e){
            if (this.current === el && this.selection.focusOffset > 0) {
                e.stopPropagation(); e.stopPropagation();
                return false;
            }
            return true;
        },
        right: function (el, e) {
            if (this.current === el && this.selection.focusOffset < el.innerHTML.length) {
                e.stopPropagation(); e.stopPropagation();
                return false;
            }
            return true;
        }
    };

    var cursor = new Cursor();
    var focus = function(table) {
        if (!this.cellValue) this.cellValue = function (rowIndex, cellIndex) {
            var ref = table.cell(rowIndex, cellIndex);
            if (!ref.hasOwnProperty('depend')) ref.depend = {};
            if (!this.hasOwnProperty('ref')) this.ref = {};
            this.ref[rowIndex + ':' + cellIndex] = true;
            ref.depend[this.parentNode.rowIndex + ':' + this.cellIndex] = true;
            return table.cell(rowIndex, cellIndex);
        };

        var formula = this.ui.attr('formula');
        if (formula) { this.innerHTML = '=' + formula; }
        cursor.at(this);
        this.css.add('active');
        return false;
    };
    var refless = function(table) {
        if (this.hasOwnProperty('ref')) {
            for (var x in this.ref) {
                var idx = x.split(':'), ref = table.cell(idx[0],idx[1],true);
                if (ref && ref.hasOwnProperty('depend')) delete ref.depend[this.parentNode.rowIndex+':'+this.cellIndex];
            }
            this.removeAttribute('ref');
        }
    };
    var depend = function(table) {
        if (this.hasOwnProperty('depend')) {
            var idx, ref;
            for (var x in this.depend) {
                idx = x.split(':');
                ref = table.cell(idx[0],idx[1],true);
                setTimeout(function () { calc.call(ref, table); }, 0);
            }
        }
    };
    var calc = function(table) {
        refless.call(this, table);
        var formula = this.ui.attr('formula');
        if (formula) {
            var fn = function () { return eval(formula); };
            try { this.innerHTML = fn.call(table); } catch(e) { this.innerHTML = e.message; }
        }
        depend.call(this, table);
    };

    var blur = function (table) {
        this.css.del('active');
        this.removeAttribute('contenteditable'); // this.contentEditable = false;
        var cellValue = this.innerHTML.trim().replace(/<(.|\n)*?>/g, ''); //.replace(/<\/?[^>]+(>|$)/g, '');
        if (cellValue.length && cellValue[0] === '=') {
            var formula = cellValue.substr(1);
            this.ui.attr('formula', formula);
            calc.call(this, table);
        } else {
            this.innerHTML = cellValue;
            refless.call(this, table);
            this.removeAttribute('formula');
            depend.call(this, table);
        }
        return false;
    };

    g.grid = function(table) {
        if (table.hasOwnProperty('cell')) return table;

        table.cell = function(rowIndex, cellIndex, asObject) {
            try {
                var c;
                if (cellIndex !== undefined) {
                    c = this.rows[parseInt(rowIndex)].cells[parseInt(cellIndex)];
                    if (!asObject) c = c.innerHTML;
                } else {
                    c = this.rows[parseInt(rowIndex)];
                }
            } catch (e) {
                c = undefined;
            }
            return c;
        };

        table.row = {};
        table.row.add = function(index) {
            var l = table.rows[index].cells.length;
            var i = parseInt(index)+1;
            var x = table.insertRow(i);
            x.setAttribute('class',table.rows[index].ui.attr('class'));
            ui.wrap(table.rows[i].insertCell(0)).ui.attr(table.cell(index, 0,true));
            for (var c=1; c<l; c++) {
                cellEvent(ui.wrap(table.rows[i].insertCell(c))).ui.attr(table.cell(index, c,true));
            }
        }

        table.col = {};
        table.col.add = function(index) {
            var i = parseInt(index)+1, owner;
            for (var r = 0, n = table.rows.length; r < n; r++) {
                owner = table.cell(r, index,true);
                if (owner.tagName === 'TH') {
                    var th = document.createElement("TH");
                    ui.wrap(th).ui.attr(owner);
                    table.rows[r].insertBefore(th, table.rows[r].children[i]);
                } else {
                    cellEvent(ui.wrap(table.rows[r].insertCell(i))).ui.attr(owner);
                }
            }
        }

        table.row.del = function(index) {
            var i = parseInt(index)-1;
            if (i > 0) table.deleteRow(i);
        }

        table.col.del = function(index) {
            var i = parseInt(index)-1;
            if (i > 0) for (var r = 0, n = table.rows.length; r < n; r++) table.rows[r].deleteCell(i);
        }

        var tuple = function (row, offset) {
            var d = []; for (var j=parseInt(offset), z=row.length; j<z; j++) {
                d.push(QueryParam(row[j], QueryParam.STRNULL));
            }
            return d;
        };

        Object.defineProperty(table, 'value', {
            __proto__: null,
            get: function value() {
                var dataset = [], offset = this.hasOwnProperty('rowNumber') ? 1 : 0;
                for (var i=0,v=this.rows.length; i<v; i++) dataset.push(tuple(this.rows[i].cells,offset));
                return dataset;
            }
        });

        var cellEvent = function (el) {
            el.ui.on('focus', function(e) {
                e.preventDefault(); e.stopPropagation();
                return focus.call(this, table);
            }, null,{bubbles: false, cancelable: true, composed: true});
            el.ui.on('blur', function(e) {
                e.preventDefault(); e.stopPropagation();
                return blur.call(this, table);
            }, null, {bubbles: false, cancelable: true, composed: true});
            return el;
        };
        table.ui.els('tbody tr td:not(:first-of-type)', function () {
            return cellEvent(this);
        });

        var setupControl = function (el) {
            if (el.tabIndex === '1') return false;
            el.tabIndex = '1';
            var control = '<div class="row th-control" ui="th-control">'+
                '<div class="d-inline-block w-1em align-middle"><button ui="th-control" class="btn btn-outline-danger btn-sm delete mr-2 pr-1 pl-1">-</button></div>';
            if (el.tagName === 'TH') control += '<div class="d-inline-block col"><input ui="th-control" tabindex="1" class="form-control form-control-sm" type="text" value="'+el.innerHTML+'"></div>';
            control +='<div class="d-inline-block w-1em align-middle"><button ui="th-control" class="btn btn-outline-success btn-sm delete">+</button></div></div>';
            el.innerHTML = control;
            var fn = function (e) {
                if (!e.relatedTarget || !e.relatedTarget.matches('[ui="th-control"')) {
                    el.innerHTML = this.value;
                    el.tabIndex = '-1';
                }
                return false;
            };

            var text = el.ui.el('input');
            if (text) text.ui.on('keydown',function (e) {
                if (e.ctrlKey || e.metaKey) return false;
                switch (eventCode(e)) {
                    case 'Enter': case 13:  e.preventDefault(); el.ui.focus(); break;
                }
                e.stopPropagation();
            }).ui.on('blur', fn);

            var btn = el.ui.els('button').ui.on('focus',function (e) {
                e.preventDefault();
                if (text) this.value = text.value; else this.value = '';
            }).ui.on('click',function (e) {
                e.preventDefault();
                var isAdd = this.firstChild.nodeValue === '+';
                if (text) if (isAdd) table.col.add(el.cellIndex); else table.col.del(el.cellIndex);
                else if (isAdd) table.row.add(el.parentElement.rowIndex); else table.row.del(el.parentElement.rowIndex);
            }).ui.on('blur', fn);

            if (text) text.ui.focus(); else btn[1].ui.focus();
        };

        table.controlled = function () {
            table.ui.dg('tbody tr td:first-of-type,thead tr:first-of-type th', 'dblclick,dbltap,', function (e) {
                var el = ui.src(e);
                if (['TD', 'TH'].indexOf(el.tagName) > -1) {
                    setupControl(el);
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
                return false;
            }, null, {bubbles: false, cancelable: true, composed: true});
        };

        table.ui.dg('tbody tr td:not(:first-of-type)', 'keydown', function (e) {
            if (e.ctrlKey || e.metaKey) return false;
            if (e.detail === 2) emptySelection();
            // var charTyped = String.fromCharCode(e.which);
            var key = eventCode(e);
            switch (key) {
                case 'ArrowUp': case 38:
                    var up = this.parentElement.previousElementSibling;
                    if (up) up.cells[this.cellIndex].focus(); //ui.focus(up.cells[this.cellIndex]);
                    // if ((idx = this.parentElement.rowIndex-1) >-1 )
                    //     ui.focus(table.rows[idx].cells[this.cellIndex]);
                    break;
                case 'Enter': case 13: e.preventDefault();
                    var down = this.parentElement.nextElementSibling;
                    if (down) down.cells[this.cellIndex].focus();
                    return false;
                case 'ArrowDown': case 40:
                    var down = this.parentElement.nextElementSibling;
                    if (down) down.cells[this.cellIndex].focus(); //ui.focus(down.cells[this.cellIndex]);
                    // if ((idx = this.parentElement.rowIndex+1) < table.rows.length)
                    //     ui.focus(table.rows[idx].cells[this.cellIndex]);
                    break;
                case 'ArrowLeft': case 37:
                    var prev = this.previousElementSibling;
                    if (prev && cursor.left(this, e)) prev.focus(); //ui.focus(prev);
                    // if ((idx = this.cellIndex-1) >-1 )
                    //     ui.focus(table.rows[this.parentElement.rowIndex].cells[idx]);
                    break;
                case 'ArrowRight': case 39:
                    var next = this.nextElementSibling;
                    if (next && cursor.right(this, e)) next.focus(); // ui.focus(next);
                    // if ((idx = this.cellIndex+1) < table.rows[this.parentElement.rowIndex].cells.length)
                    //     ui.focus(table.rows[this.parentElement.rowIndex].cells[idx]);
                    break;
                default:
            }
            // e.preventDefault();
            e.stopPropagation();
            return false;
        });

        return table;
    };

}( window, window.ui ));