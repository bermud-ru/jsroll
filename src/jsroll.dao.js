/**
 * @app jsroll.dao.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface) Data Access Object
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 16/04/2020
 * @status beta
 * @version 2.1.1b
 * @revision $Id: jsroll.dao.js 2.1.1b 2020-04-16 10:10:01Z $
 */

(function ( g, ui, undefined ) {
'suspected';
'use strict';

/**
 * @helper IDBmodel
 * @doc https://w3c.github.io/IndexedDB
 *
 * @param tables { string[] }
 * @param primaryKey { string | null }
 * @param schema { function } create store of model
 * @param launch { function } can return model store
 * @param opt { Object } extra for create Model
 * @return { Object }
 * @constructor
 */
var IDBmodel = function (tables, primaryKey, schema, launch, opt) {
    return Object.merge({
        __processing__:[],
        get processing() {
            var fn = this.__processing__.length ? this.__processing__.shift() : false;
            return fn ? fn.call(this) : false;
        },
        set processing(fn) {
            this.__processing__.push(fn);
            if (this.__processing__.length === 1) return this.processing;
        },
        get name() { return this.tables[0]; },
        tables: typeof tables === 'string' ? [tables] : tables,
        autoIncrement: !!primaryKey,
        primaryKey: primaryKey || null,
        schema: schema,
        launch: launch,
        clear: function (opt) {
            var $ = this, store = $.store('readwrite', $.status(IDBmodel.TRUNCATE), opt);
            if (opt && typeof opt.success === 'function') return store.clear().onsuccess = function (e) { return status = opt.success.call($, e, store); };
            else return store.clear().onsuccess = opt.complete;
        },
        count: function(cb, opt) {
            var $ = this, store = $.store('readonly', $.status(IDBmodel.COUNT), opt);
            if (typeof cb === 'function') store.count().onsuccess = function (e) { return cb.call($, e, $.status(IDBmodel.COUNT), store); };
            else store.count().onsuccess = store.oncomplete;
        },
        filter: function (mng, opt) {
            var $ = this;
            var nexted = true, fn = function () {
                var store = $.store('readonly', $.status(IDBmodel.FILTER), opt);
                store.openCursor().onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (mng.populated(cursor)) {
                        if (!mng.advanced) { mng.advanced = true; if (mng.offset > 0) cursor.advance(mng.offset) }
                        else { mng.condition(cursor.value); cursor['continue']() }
                    } else {
                        store.oncomplete({result:mng.chunk, offset:mng.offset, limit:mng.limit});
                        if (nexted) { nexted = false; return $.processing }
                    }
                };
            }
            $.processing = fn;
        },
        paginator: function (page, limit, opt){
            var $ = this, result = [], p = parseInt(page), l = parseInt(limit), advanced = p === 0;
            var nexted = true, fn = function () {
                var store = $.store('readonly', $.status(IDBmodel.PAGINATOR), opt);
                store.count().onsuccess = function (e) {
                    var count = e.target.result;
                    if (count > 0) store.openCursor().onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (cursor && result.length < l) {
                            if(!advanced) { advanced = true; cursor.advance(p*l) }
                            //!!! cursor.continue() yuicompressor-2.4.8.jar =>> cursor['continue']()
                            else { result.push(cursor.value); cursor['continue']() }
                        } else { return store.oncomplete({result:result, count:count, page:p, limit:l}) }
                    }; else {
                        store.oncomplete({result:[], count:0, page:p, limit:l});
                        if (nexted) { nexted = false; return $.processing }
                    }
                }
            }
            $.processing = fn;
        },
        createIndex: function (name, keyPath, options) {
            var $ = this, store = $.store('readwrite', $.status(IDBmodel.NEWINDEX));
            store.createIndex(name, keyPath, options).onsuccess = store.oncomplete;
        },
        index: function (opt) {
            var $ = this, store = $.store('readonly', $.status(IDBmodel.INDEX), opt);
            var index = store.index(arguments.shift());
            index.get(arguments).onsuccess = store.oncomplete;
        },
        get: function (idx, opt) {
            var $ = this, result = [], isArray = idx instanceof Array;
            var nexted = true, fn = function () {
                if (!isArray) idx = [idx];
                try {
                    var store = $.store('readonly', $.status(IDBmodel.DEL), opt);
                    var i=0, l = idx.length, loop = function () {
                        store.get(idx[i++]).onsuccess = function (event) {
                            result.push(event.target.result);
                            if (opt && typeof opt.success === 'function') opt.success.call($, event, $.status(IDBmodel.GET), store, i, rows);
                            if (i < l) { return loop(); }
                            store.oncomplete({result:result});
                            if (nexted) { nexted = false; return $.processing; }
                        }
                    }
                    return loop();
                } catch (e) {
                    if (opt && typeof opt.fail === 'function') opt.fail.call($, e); else $.fail(e);
                    if (nexted) { nexted = false; return $.processing; }
                }
            }
            $.processing = fn;
        },
        getAll: function (opt) {
            var $ = this, nexted = true, fn = function () {
                var store = $.store('readonly', $.status(IDBmodel.GETALL), opt);
                store.getAll().onsuccess = function (event) {
                    if (opt && typeof opt.success === 'function') opt.success.call($, event, $.status(IDBmodel.GETALL), store);
                    else store.oncomplete({result:event.target.result});
                    if (nexted) { nexted = false; return $.processing; }
                }
            }
            $.processing = fn;
        },
        add: function (data, opt) {
            var $ = this, idx = [], rows = data instanceof Array ? data : [data];
            var nexted = true, fn = function () {
                try {
                    var i=0, l=rows.length, store=$.store('readwrite', $.status(IDBmodel.ADD), opt);
                    var row, loop = function () {
                        row = $.data2row(rows[i++], QueryParam.STRNULL);
                        if (row.hasOwnProperty($.primaryKey) && (row[$.primaryKey] === null || row[$.primaryKey] === '')) {
                            delete row[$.primaryKey];
                        }
                        store.add(row).onsuccess = function (event) {
                            idx.push(event.target.result);
                            if (opt && typeof opt.success === 'function') opt.success.call($, event, $.status(IDBmodel.ADD), store, i, rows);
                            if (i < l) return loop();
                            store.oncomplete({result:idx, rows:rows});
                            if (nexted) { nexted = false; return $.processing; }
                        }
                    }
                    return loop();
                } catch (e) {
                    if (opt && typeof opt.fail === 'function') opt.fail.call($, e); else $.fail(e);
                    if (nexted) { nexted = false; return $.processing; }
                }
            }
            $.processing = fn;
        },
        put: function (data, opt) {
            var $ = this, idx = [], rows = data instanceof Array ? data : [data];
            var nexted = true, fn = function () {
                try {
                    var i=0, l=rows.length, store=$.store('readwrite', $.status(IDBmodel.PUT), opt);
                    var row, loop = function () {
                        row = $.data2row(rows[i++], QueryParam.STRNULL);
                        if (!$.primaryKey || row[$.primaryKey] === null || row[$.primaryKey] === '') throw 'PrimaryKey is not set!';
                        store.put(row).onsuccess = function (event) {
                            idx.push(event.target.result);
                            if (opt && typeof opt.success === 'function') opt.success.call($, event, $.status(IDBmodel.PUT), store, i, rows);
                            if (i < l) return loop();
                            store.oncomplete({result:idx, rows:rows});
                            if (nexted) { nexted = false; return $.processing; }
                        }
                    }
                    return loop();
                } catch (e) {
                    if (opt && typeof opt.fail === 'function') opt.fail.call($, e); else $.fail(e);
                    if (nexted) { nexted = false; return $.processing; }
                }
            }
            $.processing = fn;
        },
        del: function (idx, opt) {
            var $ = this, isArray = idx instanceof Array;
            var nexted = true, fn = function () {
                if (!isArray) idx = [idx];
                try {
                    var store = $.store('readwrite', $.status(IDBmodel.DEL), opt);
                    var i=0, l = idx.length, loop = function () {
                        //!!! store.delete(idx) yuicompressor-2.4.8.jar =>> store['delete'](idx)
                        store['delete'](idx[i++]).onsuccess = function (event) {
                            if (opt && typeof opt.success === 'function') opt.success.call($, event, $.status(IDBmodel.DEL), store, i, rows);
                            if (i < l) return loop();
                            store.oncomplete({result:idx});
                            if (nexted) { nexted = false; return $.processing; }
                        }
                    }
                    return loop();
                } catch (e) {
                    if (opt && typeof opt.fail === 'function') opt.fail.call($, e); else $.fail(e);
                    if (nexted) { nexted = false; return $.processing; }
                }
            }
            $.processing = fn;
        }
    }, opt);
};  IDBmodel.GET = 1; IDBmodel.GETALL = 2; IDBmodel.ADD = 3; IDBmodel.PUT = 3;
    IDBmodel.UPSERT = 4; IDBmodel.DEL = 5; IDBmodel.INDEX = 6; IDBmodel.TRUNCATE = 7;
    IDBmodel.COUNT = 8; IDBmodel.NEWINDEX = 9; IDBmodel.PAGINATOR = 10; IDBmodel.FILTER = 11;

g.IDBmodel = IDBmodel;

// var db = new IDB('test1',1)
// db.bind(IDBmodel('table1','id'))
// db.connect()
// db.models.table1.add({id:1, name:'Boris'})
// db.models.table1.getAll()
// db.models.table1.put({id:1, name:'Ass'})
// db.models.table1.get(1)
// db.models.table1.del(1)
// db.models.table1.getAll()


// // In onupgradeneeded
// var store = db.createObjectStore('mystore');
// store.createIndex('myindex', ['prop1','prop2'], {unique:false});
//
// // In your query section
// var transaction = db.transaction('mystore','readonly');
// var store = transaction.objectStore('mystore');
// var index = store.index('myindex');
// // Select only those records where prop1=value1 and prop2=value2
// var request = index.openCursor(IDBKeyRange.only([value1, value2]));
// // Select the first matching record
// var request = index.get(IDBKeyRange.only([value1, value2]));

/**
 * webSQLmodel
 *
 * @param webSQLinstance { webSQL }
 * @param opt { Object }
 */
var webSQLmodel = function ( webSQLinstance, opt) {
    if (opt && typeof opt === 'object') this.merge(opt);
    if (webSQLinstance !== null) this.webSQLinstance = webSQLinstance;
    else throw "webSQL object not exist!";
}; webSQLmodel.prototype = {
    webSQLinstance: null,
    modelName: null,
    tableName: null,
    primaryKey: null,
    processing: false,
    requestLimit: 1500,
    DDL: null,
    done: function(tx, rs) { return console.log('webSQLmodel '+this.webSQLinstance+' успешно стартовала') },
    fail: function(tx, e) { return console.error('webSQLmodel '+e.message) },
    init: function (query, ver) {
        if (this.webSQLinstance === null) return console.error('DB webSQL not istalled!');
        if (typeof ver !== 'undefined' && ver !== this.webSQLinstance.version) this.webSQLinstance.changeVersion(this.webSQLinstance.version, ver, this.changeVersion);
        this.webSQLinstance.stmt([query ? query : this.DDL], [], this.done, this.fail); return this;
    },
    changeVersion:function(tx) { return console.log(tx); },
    unload: function(query, count, option) {
        var model = this, opt = Object.assign({timer:0, xhrCount:0, url:'/chunking', method:'PUT', params:{}, limit : 100, page:0, count:0}, option);
        if (typeof count === 'string') model.webSQLinstance.filter(count, [], function (tx, rs) {
            opt.count = rs.rows ? rs.rows[0].count : 0;
            if (opt.count === 0) { return false; } else { if (typeof opt.before === 'function') opt.before(rs); }
            var payload = function (tx, rs) {
                var limit = ' LIMIT '+ opt.limit+' OFFSET ' + (opt.page * opt.limit);
                model.webSQLinstance.filter(query+limit, [], function(t, r) {
                    opt.length = parseInt(r && r.rows.length);
                    var wait = function() {
                        if (model.processing && !opt.timer) { opt.timer = setTimeout(function () { wait(); }, 50);  return false; }
                        clearTimeout(opt.timer);
                        xhr({ method: opt.method, url: opt.url,
                            rs: {
                                'Content-type': 'application/json',
                                ver: model.webSQLinstance.version,
                                pk: model.primaryKey,
                                model: model.tablelName,
                                limit: opt.limit,
                                page: opt.page,
                            },
                            data: JSON.stringify(Object.assign({ rows: obj2array(r.rows)}, opt.params)),
                            before: function (e) { model.processing = true; },
                            after: function (e) { model.processing = false; opt.xhrCount++; },
                            done: function (e, hr) {
                                var res = ui.src(e).responseJSON;
                                if (res.result === 'ok') {
                                    if ( opt.length + (opt.page++ * opt.limit) < opt.count ) {
                                        if (typeof opt.progress === 'function') opt.progress(model, Object.assign(opt, {rows:res.data ? res.data.rows:[]}));
                                        return payload(t,r);
                                    } else { if (typeof opt.after === 'function') opt.after(model, Object.assign(opt, {rows:res.data ? res.data.rows:[]}));}
                                } else {
                                    if (typeof opt.after === 'function') opt.after(model, opt);
                                    console.error(res.message);
                                }
                            },
                            fail: function (e) {
                                if (typeof opt.after === 'function') opt.after(model, e);
                                console.error('Model[' + model.modalName + ']' + this.status + ': ' + HTTP_RESPONSE_CODE[this.status], this);
                            }
                        });
                        return false;
                    };
                    if (opt.xhrCount < model.requestLimit || opt.length > 0) { wait(); } else { if (typeof opt.after === 'function') opt.after(); }
                }, function(t,e){ console.error(e.message);});
            }; if (typeof query === 'string') payload(tx, rs);
        }, function (tx, er) { console.error(er.message); });
    },
    populate: function (option) {
        var model = this, opt = Object.assign({timer:0, xhrCount:0, url:'/chunking', params:{}, limit : 100, page:0, count:0}, option);
        var wait = function(idx) {
            if (model.processing) { opt.timer = setTimeout(function () { wait(); }, 50);  return false; }
            clearTimeout(opt.timer);
            xhr({
                url: location.update(opt.url , opt.params),
                // Object.assign({
                //     // ver: model.webSQLinstance.version,
                //     // limit: opt.limit,
                //     // page: opt.page,
                //     // pk: model.primaryKey,
                //     // model: model.tablelName
                //     // ,idx: idx ? JSON.stringify(idx) : []
                // }, opt.params)),
                rs: { //'Content-type': 'application/json',
                    ver: model.webSQLinstance.version,
                    pk: model.primaryKey,
                    model: model.tablelName,
                    limit: opt.limit,
                    page: opt.page,
                },
                before: function (e) { model.processing = true; return false; },
                after: function (e) { model.processing = false; opt.xhrCount++; return false; },
                done: function (e, hr) {
                    var res = ui.src(e).responseJSON;
                    if (res.result === 'ok') {
                        opt.length = res.data && res.data.rows ? res.data.rows.length : 0;
                        opt.page = res.paginator.page + 1;
                        opt.limit = res.paginator.limit || opt.limit;
                        opt.count = res.paginator.count || opt.length;
                        var idx = []; //res.data.rows.map(function (v) { return v[model.primaryKey]; });
                        if (opt.length > 0) model.add(res.data.rows, {done: function (tx, rs) {
                                if ( opt.length + (res.paginator.page * opt.limit) < opt.count ) {
                                    if (typeof opt.progress === 'function') opt.progress(model, res);
                                    return proc(idx);
                                } else { if (typeof opt.after === 'function') opt.after(model, res); }
                            }}, webSQL.BULK | webSQL.UPSERT);
                    } else {
                        if (typeof opt.after === 'function') opt.after(model, res);
                        console.error(res.message);
                    }
                    return false;
                },
                fail: function (e) {
                    if (typeof opt.after === 'function') opt.after(model, e);
                    console.error('Model[' + model.modalName + ']' + this.status + ': ' + HTTP_RESPONSE_CODE[this.status], this);
                }
            });
            return false;
        }, proc = function(idx) {
            if (opt.xhrCount < model.requestLimit) { wait(idx); } else { if (typeof opt.after === 'function') opt.after(); }
            return false;
        };
        if (typeof opt.before === 'function') opt.before();
        return proc();
    }
};
g.webSQLmodel = webSQLmodel;
// var db = new webSQLmodel(new webSQL({name:"DB", version: "1.0", displayName: "DB instace dreated at "+datetimer(new Date()), estimatedSize:200000}));
}( window, window.ui ));
