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

    // FF fix to force <br> line break in Firefox ContentEditable
    if (g.document.queryCommandSupported('insertBrOnReturn'))
        g.document.execCommand('insertBrOnReturn', false, '');

    g.Cursor = function () {
        this.range = g.document.createRange();
        this.selection = g.getSelection();
    }; g.Cursor.prototype = {
        current: null,
        at: function (el) {
            this.current = el;
            this.editable = true;
            return this.offset(el,0);
        },
        get editable() { return !!this.current.contentEditable },
        set editable(v) {
            if (this.current instanceof HTMLElement) if (v) {
                this.current.css.add('active');
                this.current.contentEditable = true;
            } else {
                this.current.removeAttribute('contenteditable');
                this.current.css.del('active');
            }
        },
        offset: function (el, off) {
            this.range.setStart(el, off||0);
            this.range.collapse(true);
            this.selection.removeAllRanges();
            this.selection.addRange(this.range);
            return el;
        },
        toEnd: function (el) {
            var range,selection;
            range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },
        left: function (el, e){
            if (this.current === el && this.selection.focusOffset > 0) {
                e.stopPropagation(); e.stopPropagation();
                return false;
            }
            return true;
        },
        right: function (el, e) {
            if (this.current === el && this.selection.focusOffset < el.innerHTML.replace(/(<([^>]+)>)/g, '').trim().length) {
                e.stopPropagation(); e.stopPropagation();
                return false;
            }
            return true;
        }
    };

    var cursor = new g.Cursor();
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

    var focus = function(table, fn) {
        this.css.add('active');
        if (typeof fn === 'function') return fn.call(this, table); else
        if (typeof fn === 'object' && fn.hasOwnProperty('focus')) return fn.focus(this, table);
        cursor.at(this);
        return false;
    };

    var blur = function (table, fn) {
        this.css.del('active');
        this.removeAttribute('contenteditable'); // this.contentEditable = false;
        if (typeof fn === 'function') return fn.call(this, table); else
        if (typeof fn === 'object' && fn.hasOwnProperty('blur')) return fn.blur(this, table);
        return false;
    };

    var tuple = function (row, offset) {
        var d = []; for (var j=parseInt(offset), z=row.length; j<z; j++) {
            d.push(QueryParam(row[j], QueryParam.STRNULL));
        }
        return d;
    };

    var tuple2array = function (tuple, fields) {
        return fields.map(function (v,i,a) { return tuple.hasOwnProperty(v) ? tuple[v]: null });
    }

    var calkedCell = {
        focus: function (table) {
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
        },
        blur: function (table) {
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
        }
    };

    g.grid = function(table) {
        if (table.hasOwnProperty('cell')) return table;

        table.cell = function(rowIndex, cellIndex, asContent) {
            try {
                var c;
                if (cellIndex !== undefined) {
                    c = this.rows[parseInt(rowIndex)].cells[parseInt(cellIndex)];
                    if (!!asContent) c = QueryParam(c.innerHTML);
                } else {
                    c = this.rows[parseInt(rowIndex)];
                }
            } catch (e) {
                c = undefined;
            }
            return c;
        };

        table.cell.ELEMENT = undefined;
        table.cell.CONTENT = 1;
        table.cell.OBJECT = 2;

        table.row = {};
        table.row.insert = function (a) {
            var i = table.rows.length - 1;
            var x = table.insertRow(i);
            var l = a.length;
            for (var c=0; c<l; c++) { x.insertCell(c).innerHTML = a[c]; }
            return x;
        }

        table.row.add = function(index) {
            var l = table.rows[index].cells.length;
            var i = parseInt(index)+1;
            var x = table.insertRow(i);
            x.setAttribute('class',table.rows[index].ui.attr('class'));
            ui.wrap(table.rows[i].insertCell(0)).ui.attr(table.cell(index, 0,true));
            for (var c=1; c<l; c++) {
                cellEvent(ui.wrap(table.rows[i].insertCell(c))).ui.attr(table.cell(index, c,true));
            }
            return x;
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
            if (table.rows.length > 2) table.deleteRow(parseInt(index));
        }

        table.col.del = function(index) {
            var i = parseInt(index);
            if (table.rows[0].cells.length > 2) for (var r = 0, n = table.rows.length; r < n; r++) table.rows[r].deleteCell(i);
        }

        Object.defineProperty(table, 'value', {
            __proto__: null,
            get: function value() {
                var dataset = [], offset = this.hasOwnProperty('rowNumber') ? 1 : 0;
                for (var i=0,v=this.rows.length; i<v; i++) dataset.push(tuple(this.rows[i].cells,offset));
                return dataset;
            }
        });

        var cellEvent = function (el) {
            el.ui.on('focusin', function(e) {
                e.preventDefault(); e.stopPropagation();
                return focus.call(this, table, calkedCell.focus);
            }, null,{bubbles: true, cancelable: true, composed: true});
            el.ui.on('focusout', function(e) {
                e.preventDefault(); e.stopPropagation();
                return blur.call(this, table, calkedCell.blur);
            }, null, {bubbles: true, cancelable: true, composed: true});
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

    g.journal = function (table, sheet, esli) {
        if (table.hasOwnProperty('cell')) return table;

        var body = table.ui.el('tbody');
        table.ui.dg('tbody[busy="no"]>[caption]','dblclick,dbltap',function (e) {
            e.stopPropagation(); e.preventDefault();
            if (e.ctrlKey || e.metaKey || body.ui.attr('busy') === 'yes') return false;
            if (e.detail === 2) emptySelection();
            body.ui.attr('busy','yes');
            var $ = this; if (!$.hasOwnProperty('populated')) $.populated = [];
            if ($.ui.attr('caption') === 'off') {
                $.ui.attr('caption','on');
                if ($.populated.length) {
                    $.populated.forEach(function (v) { v.css.del('hide') }); body.ui.attr('busy','no')
                } else {
                    sheet.update($, table, body);
                }
            } else {
                $.ui.attr('caption','off');
                setTimeout(function() { fadeOut2.call($, body) }, 1)
            }
        }, null, {bubbles: false, cancelable: true, composed: true});

        table.row = {};
        table.row.add = function(index, opt, tuple, s) {
            var o = Object.assign({
                populate: true,
                row_attr: true,
                cell_attr: true,
                cell_max: false,
                events: function (cell) {
                    return cellEvent(cell);
                },
                cells: function (i, table, tuple, opt) {
                    var $ = this, cell;
                    var l = $.cell_max ? $.cell_max : table.rows[i].cells.length;
                    for (var c=0; c < l; c++) {
                        cell = $.insertCell(c);
                        // if (typeof o.events === 'function') o.events(ui.wrap(cell));
                        if (typeof o.cell_attr === 'function') o.cell_attr(cell, table, table.rows[i].cells[c], tuple, opt);
                        else if (o.cell_attr) ui.wrap(cell).ui.attr(table.rows[i].cells[c]);
                        if (typeof o.populate === 'function') o.populate(cell, tuple, c);
                        else if (o.populate && tuple instanceof Array) cell.innerHTML = QueryParam(tuple[c]);
                    }
                }
            }, opt);

            var i = parseInt(index);
            var $ = table.insertRow( i + 1);
            if (typeof o.row_attr === 'function') o.row_attr($, table, table.rows[i], tuple, s);
            else if (o.row_attr) ui.wrap($).ui.attr(table.rows[i]);
            o.cells.call($, i, table, tuple, s);
            return $;
        }

        table.cell = function(rowIndex, cellIndex, asContent) {
            try { var c;
                if (cellIndex !== undefined) {
                    c = this.rows[parseInt(rowIndex)].cells[parseInt(cellIndex)];
                    if (!!asContent) c = QueryParam(c.innerHTML);
                } else { c = this.rows[parseInt(rowIndex)]; }
            } catch (e) { c = undefined; }
            return c;
        };
        table.cell.ELEMENT = undefined;
        table.cell.CONTENT = 1;
        table.cell.OBJECT = 2;

        var cellEvent = function (el) {
            el.ui.on('focusin', function(e) {
                e.preventDefault(); e.stopPropagation();
                return focus.call(this, cursor, sheet.cellEvent);
            }, null,{bubbles: false, cancelable: true, composed: true});
            el.ui.on('focusout', function(e) {
                e.preventDefault(); e.stopPropagation();
                return blur.call(this, cursor, sheet.cellEvent);
            }, null, {bubbles: false, cancelable: true, composed: true});
            return el;
        };

        table.ui.els('tbody tr td:not(:first-of-type)', function () {
            return cellEvent(this);
        });

        table.ui.dg('tbody tr td:not(:first-of-type)', 'keydown', function (e) {
            if (e.ctrlKey || e.metaKey) return false;
            if (e.detail === 2) emptySelection();
            var key = eventCode(e);
            switch (key) {
                case 'ArrowUp': case 38:
                    var up = this.parentElement.previousElementSibling;
                    if (sheet.cellEvent && sheet.cellEvent.hasOwnProperty('ArrowUp')) return sheet.cellEvent.ArrowUp(this, up);
                    else if (up) up.cells[this.cellIndex].focus()
                    break;
                case 'Enter': case 13: e.preventDefault();
                    var Enter = this.parentElement.nextElementSibling;
                    if (sheet.cellEvent && sheet.cellEvent.hasOwnProperty('Enter')) return sheet.cellEvent.Enter(this, Enter);
                    else if (Enter) Enter.cells[this.cellIndex].focus()
                    return false;
                case 'ArrowDown': case 40:
                    var down = this.parentElement.nextElementSibling;
                    if (sheet.cellEvent && sheet.cellEvent.hasOwnProperty('ArrowDown')) return sheet.cellEvent.ArrowDown(this, down);
                    else if (down) down.cells[this.cellIndex].focus()
                    break;
                case 'ArrowLeft': case 37:
                    var prev = this.previousElementSibling;
                    if (sheet.cellEvent && sheet.cellEvent.hasOwnProperty('ArrowLeft')) return sheet.cellEvent.ArrowLeft(this, prev);
                    else if (prev && cursor.left(this, e)) prev.focus()
                    break;
                case 'ArrowRight': case 39:
                    var next = this.nextElementSibling;
                    if (sheet.cellEvent && sheet.cellEvent.hasOwnProperty('ArrowRight')) return sheet.cellEvent.ArrowRight(this, next);
                    else if (next && cursor.right(this, e)) next.focus()
                    break;
                default:
                    if (key.length === 1 && !(key >= 0 && key <= 9) || key === ' ') e.preventDefault();
            }
            // e.preventDefault();
            e.stopPropagation();
            return false;
        });

        return table;
    };

}( window, window.ui ));