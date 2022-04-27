/**
 * @app jsroll.dao.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application) UI (User Interface)
 *
 * Классы RIA / SPA application framework UI (User Interface)
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
 * @helper IndexedDBmodel
 *
 * @param tables { string[] }
 * @param primaryKey { string | null }
 * @param schema { function } create store of model
 * @param launch { function } can return model store
 * @param opt { Object } extra for create Model
 * @return { Object }
 * @constructor
 */
var IndexedDBmodel = function (tables, primaryKey, schema, launch, opt) {

    return Object.merge({
        get name() { return this.tables[0]; },
        tables: typeof tables === 'string' ? [tables] : tables,
        primaryKey: primaryKey || null,
        schema: schema,
        launch: launch,
        get: function (id, opt) {
            var $ = this;
            var handler = Object.assign({done: $.owner.done.bind($.owner), fail: $.owner.fail.bind($.owner), close: $.owner.close.bind($.owner)}, opt);
            if (id && typeof handler.done === 'function') {
                try {
                    var tx = $.owner.db.transaction($.tables, 'readonly');
                    var store = tx.objectStore($.tables);
                    tx.onerror = tx.onabort = function (e) { return handler.fail(e, tx); };
                    // tx.oncomplete = function (event) { handler.close(event); /** after handler **/ };
                    return store.get(id).onsuccess = function (e) { return handler.done(e, store, tx); };
                } catch (e) {
                    handler.fail(e);
                }
            }
        },
        getAll: function (opt) {
            var $ = this;
            var handler = Object.assign({done: $.owner.done.bind($.owner), fail: $.owner.fail.bind($.owner), close: $.owner.close.bind($.owner)}, opt);
            try {
                var tx = $.owner.db.transaction($.tables, 'readonly');
                tx.onerror = tx.onabort = function (e) { return handler.fail(e, tx); };
                // tx.oncomplete = function (event) { handler.close(event); /** after handler **/ };
                var store = tx.objectStore($.tables);
                return store.getAll().onsuccess = function (e) { return handler.done(e, store, tx); };
            } catch (e) {
                handler.fail(e);
            }
        },
        add: function (data, opt) {
            var $ = this, row = $.data2row(data, QueryParam.STRNULL);
            var handler = Object.assign({done: $.owner.done.bind($.owner), fail: $.owner.fail.bind($.owner), close: $.owner.close.bind($.owner)}, opt);
            try {
                console.log('db', $.owner.db);
                var tx = $.owner.db.transaction($.tables, 'readwrite');
                tx.onerror = function (e) { return handler.fail(e, tx); };
                // tx.oncomplete = function (event) { handler.close(event); /** after handler **/ };
                var store = tx.objectStore($.tables[0]);
                if ($.primaryKey && row.hasOwnProperty($.primaryKey)) {
                    if (row[$.primaryKey] === null) { delete row[$.primaryKey]; }
                }
                tx.onabort = function (e) {
                    if ($.primaryKey && row.hasOwnProperty($.primaryKey))
                        console.error('row PrimaryKey[' + $.primaryKey + '] = ' + row[$.primaryKey] + ' in ' + JSON.stringify($.tables) + 'already has!');
                };
                if (typeof handler.done === 'function') store.add(row).onsuccess = function (e) { return handler.done(e, store, tx); }; else store.add(row);
            } catch (e) {
                handler.fail(e);
            }
        },
        put: function (data, opt) {
            var $ = this, row = $.data2row(data, QueryParam.STRNULL);
            var handler = Object.assign({done: $.owner.done.bind($.owner), fail: $.owner.fail.bind($.owner), close: $.owner.close.bind($.owner)}, opt);
            try {
                var tx = $.owner.db.transaction($.tables, 'readwrite');
                tx.onerror = tx.onabort = function (e) { return handler.fail(e, tx); };
                // tx.oncomplete = function (event) { handler.close(event); /** after handler **/ };
                var store = tx.objectStore($.name);
                if (!$.primaryKey || row[$.primaryKey] === null) throw 'PrimaryKey is not set!';
                if (typeof handler.done === 'function') store.put(row).onsuccess = function (e) { return handler.done(e, store, tx); }; else store.put(row);
            } catch (e) {
                handler.fail(e);
            }
        },
        del: function (idx, opt) {
            var $ = this;
            var handler = Object.assign({done: $.owner.done.bind($.owner), fail: $.owner.fail.bind($.owner), close: $.owner.close.bind($.owner)}, opt);
            try {
                var tx = $.owner.db.transaction($.tables, 'readwrite');
                tx.onerror = tx.onabort = function (e) { return handler.fail(e, tx); };
                // tx.oncomplete = function (event) { handler.close(event); /** after handler **/ };
                var store = tx.objectStore($.tables);
                // var store = tx.objectStore($.tables[0]);
                //!!! store.delete(idx) yuicompressor-2.4.8.jar =>> store['delete'](idx)
                if (typeof handler.done === 'function') store['delete'](idx).onsuccess = function (e) { return handler.done(e, store, tx); }; else store['delete'](idx);
            } catch (e) {
                handler.fail(e);
            }
        }
    }, opt);
}; g.IndexedDBmodel = IndexedDBmodel;

//
// var IndexedDBmodel = function (db, vertion) {
//     return new IndexedDBInterface({
//     url: '/sync',
//     name: db,
//     ver: vertion,
//     modelName: null,
//     tablelName: null,
//     primaryKey: null,
//     processing: false,
//     xhrCount: 0,
//     requestLimit: 15000,
//     landing: function (idx) { return null; },
//     schema: function () { return null; },
//     success: function (db) { return console.log('IndexedDBmodel '+db+' успешно стартовала'); },
//     init: function () {
//         var model = this;
//         if (model.heirs) model.heirs.map(function (v, i, a) {
//             v.xhrCount = 0;
//             v.populate();
//         });
//     },
//     get: function (id, opt) {
//         var model = this;
//         var handler = Object.assign({done: null, fail: null}, opt);
//
//         if (id && typeof handler.done === 'function') {
//             try {
//                 var tx = model.db.transaction([model.tablelName], 'readonly');
//                 var store = tx.objectStore(model.tablelName);
//                 tx.onabort = (handler.fail == null) ? model.fail : handler.fail;
//                 // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
//                 return store.get(id).onsuccess = handler.done;
//             } catch (e) {
//                 if (handler.fail) handler.fail(e); else model.fail(e);
//             }
//         }
//     },
//     getAll: function (done) {
//         var model = this;
//         if (typeof done === 'function') {
//             try {
//                 if (typeof done === 'function') {
//                     var tx = model.db.transaction([model.tablelName], 'readonly');
//                     tx.onabort = model.fail;
//                     // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
//                     var store = tx.objectStore(model.tablelName);
//                     return store.getAll().onsuccess = done;
//                 }
//             } catch (e) {
//                 model.fail(e);
//             }
//         }
//     },
//     add: function (data, opt) {
//         var model = this, row = model.data2row(data, QueryParam.STRNULL);
//         var handler = Object.assign({done: null, fail: null}, opt);
//         try {
//             var tx = model.db.transaction([model.tablelName], 'readwrite');
//             (handler.fail == null) ? model.fail : handler.fail;
//             // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
//             var store = tx.objectStore(model.tablelName);
//
//             if (model.hasOwnProperty('primaryKey') && row.hasOwnProperty(model.primaryKey)) {
//                 if (row[model.primaryKey] == null) {
//                     delete row[model.primaryKey];
//                 }
//             }
//             tx.onabort = function (e) {
//                 if (model.hasOwnProperty('primaryKey') && row.hasOwnProperty(model.primaryKey))
//                     throw 'PrimaryKey[' + model.primaryKey + '] can\'t use ' + model.tablelName + '::add() method, on populated dataset!';
//             };
//             if (typeof handler.done === 'function') store.add(row).onsuccess = handler.done; else store.add(row);
//         } catch (e) {
//             if (handler.fail) handler.fail(e); else model.fail(e);
//         }
//     },
//     put: function (data, opt) {
//         var model = this, row = model.data2row(data, QueryParam.STRNULL);
//         var handler = Object.assign({done: null, fail: null}, opt);
//         try {
//             var tx = model.db.transaction([model.tablelName], 'readwrite');
//             tx.onabort = (handler.fail == null) ? model.fail : handler.fail;
//             // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
//             var store = tx.objectStore(model.tablelName);
//
//             if (row[model.primaryKey] === null) throw 'PrimaryKey is not set!';
//             if (typeof handler.done === 'function') store.put(row).onsuccess = handler.done; else store.put(row);
//         } catch (e) {
//             if (handler.fail) handler.fail(e); else model.fail(e);
//         }
//     },
//     del: function (idx, opt) {
//         var model = this;
//         var handler = Object.assign({done: null, fail: null}, opt);
//         try {
//             var tx = model.db.transaction([model.tablelName], 'readwrite');
//             tx.onerror = tx.onabort = (handler.fail == null) ? model.fail : handler.fail;
//             // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
//             var store = tx.objectStore(model.tablelName);
//             if (typeof handler.done === 'function') store.delete(idx).onsuccess = handler.done; else store.delete(idx);
//         } catch (e) {
//             if (handler.fail) handler.fail(e); else model.fail(e);
//         }
//     },
//     populate: function (idx) {
//         var model = this;
//         if (!model.processing && model.xhrCount < model.requestLimit) xhr({
//             url: location.update(model.url, {
//                 model: model.tablelName,
//                 ver: model.version,
//                 idx: idx ? JSON.stringify(idx) : ''
//             }),
//             // rs: {'Hash': acl.user.hash}, // -------------------------------------
//             before: function (e) { model.processing = true; },
//             after: function (e) { model.processing = false; },
//             done: function (e, hr) {
//                 var res = str2json(this.responseText,{result: 'error', message: this.status + ': ' + HTTP_RESPONSE_CODE[this.status]});
//                 if (res.result === 'ok') {
//                     var count = res.data.rows ? res.data.rows.length : 0;
//                     if (count) {
//                         var i = 0, idx = [];
//                         var next = function () {
//                             if (i < count) {
//                                 idx.push(res.data.rows[i][model.primaryKey]);
//                                 model.add(res.data.rows[i++], {done: next});
//                             } else {
//                                 model.xhrCount += count;
//                                 model.processing = false;
//                                 if (count) { return model.populate(idx); }
//                             }
//                         };
//                         next();
//                     }
//                 } else {
//                     app.msg(res);
//                 }
//             },
//             fail: function (e) {
//                 var $ = this;
//                 $.xhrCount++;
//                 console.error('Model[' + $.modalName + ']' + this.status + ': ' + HTTP_RESPONSE_CODE[this.status], this);
//             }
//         });
//     },
//     sync: function () {
//         var model = this;
//
//         var tableName = tab1.tableName;
//         var tx = model.db.transaction([tableName], 'readonly');
//         var sFamilies = tx.objectStore(tableName);
//         sFamilies.getAll().onsuccess = function(event)
//         {
//             console.log(event.target.result);
//             var data = obj2array(event.target.result);
//             if (data.length) {
//                 if (navigator.onLine && !model.__xhr2 && tableName) { xhr({method:'PUT',url: '/sync',
//                     data: JSON.stringify({table:'families',rows:data}),
//                     rs: {'Hash': acl.user.hash,'ver': model.ver||'0.1','Content-type': 'application/json'},
//                     before: function (e) { model.__xhr2 = this; },
//                     after: function (e) { model.__xhr2 = null; },
//                     done: function (e, hr) {
//                         try {
//                             var res = JSON.parse(this.responseText);
//                             var idx = JSON.parse(res.idx);
//                         } catch (e) {
//                             res = {result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]};
//                         }
//
//                         if (res.result ==  'ok') {
//                             app.msg({result:'success', message: 'Синхронизация статусов семей успешно завершена, синронизировано: ' + idx.length});
//                             console.log(idx);
//                             if (idx.length) {
//                                 // TODO: set: synced=1, transmitted=1
//                                 g.setTimeout(function() {}, 100);
//                             }
//                         } else {
//                             if (res.result == 'error') {
//                                 app.msg(res);
//                             }
//                         }
//                         //return
//                     },
//                     fail: function (e) { console.error('sync Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this); }
//                 }); }
//             } else {}
//         };
//
//         var tableName = tab3.tableName;
//         var tx = model.db.transaction([tableName], 'readonly');
//         var sQuestionnaire = tx.objectStore(tableName);
//         sQuestionnaire.getAll().onsuccess = function(event)
//         {
//             console.log(event.target.result);
//             var data = obj2array(event.target.result);
//             if (data.length) {
//                 if (navigator.onLine && !model.__xhr && tableName) { xhr({method:'PUT',url: '/sync',
//                     data: JSON.stringify({table:'questionnaires',rows:data}),
//                     rs: {'Hash': acl.user.hash,'ver': model.ver||'0.1','Content-type': 'application/json'},
//                     before: function (e) { model.__xhr = this; },
//                     after: function (e) { model.__xhr = null; },
//                     done: function (e, hr) {
//                         try {
//                             var res = JSON.parse(this.responseText);
//                             var idx = JSON.parse(res.idx); // "idx":[1]
//                             //console.log(idx);
//                         } catch (e) {
//                             res = {result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]};
//                         }
//
//                         if (res.result ==  'ok') {
//                             app.msg({result:'success', message: 'Синхронизация анкет успешно завершена, синронизировано: ' + idx.length});
//                             console.log(idx);
//                             if (idx.length) {
//                                 // TODO: set: synced=1, transmitted=1
//                                 g.setTimeout(function() {}, 100);
//                             }
//                         } else {
//                             if (res.result == 'error') {
//                                 app.msg(res);
//                                 //console.error(res.row);
//                             }
//                         }
//                         //return
//                     },
//                     fail: function (e) { console.error('sync Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this); }
//                 }); }
//             } else {
//                 /* TODO:
//                                     if (model.table == 'families') {
//                                         console.log('transfer families...');
//                                         g.setTimeout(function() { g.families.synchronizer.put(); return false }, 100);
//                                     } else {
//                                         if (model.table == 'questionnaires') {
//                                             console.log('transfer questionnaires...');
//                                             g.setTimeout(function() { g.questionnaires.synchronizer.put(); return false }, 100);
//                                         }
//                                     }
//                 */
//             }
//         };
//     },
//     unload: function(query, count, option) {
//
//     }
// });
// }
// g.IndexedDBmodel = IndexedDBmodel;

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

var sqlObject = function() {
    return function (o) {
        var index = is_empty(o.index) || parseInt(o.index);
        var pk = o.primaryKey ? o.primaryKey : null;
        var rows = o.crud;
        var fn, worker = function (row) {
            switch (opt.method.toLowerCase()) {
                case 'del': rows.splice(index,1); break;
                case 'post': if (pk) row[pk] = Math.max.apply(Math, rows.map(function(r) { return r[pk]; })) + 1;
                    rows.push(row); break;
                case 'put': rows[index].merge(row); break;
                case 'get': default:
            }
            if (typeof opt.done === 'function') opt.done(index !== null ? rows[index] : rows);
            return worker.done = true;
        }
        var opt = Object.assign({ srcElement: worker, method: 'get', index: index, rows: rows, timeout: 1000}, o);

        worker.timeout = function () {
            var res = ((Date.now() - worker.start) < opt.timeout);
            if (!res) {
                clearTimeout(worker.instance);
                if (typeof opt.cansel === 'function') opt.cansel(); else console.warn('Worker timeout');
            }
            return res;
        };

        worker.start = Date.now();
        worker.done = false;

        if ( (typeof opt.before === 'function') ? [undefined,true].indexOf(opt.before()) >-1 : true ) {
            (fn = function () {
                if (worker.timeout()) worker.instance = setTimeout(function () {
                    worker(o.data);
                    if (!worker.done) return fn();
                    if (typeof opt.after == 'function') opt.after();
                    return false;
                }, 0);
            })();
        }
        return worker;
    };
}; g.sqlObject = sqlObject;

}( window, window.ui ));
