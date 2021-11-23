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

(function ( g, undefined ) {
'suspected';
'use strict';

var IndexedDBmodel = function (db, vertion) {
    return new IndexedDBInterface({
    url: '/sync',
    name: db,
    ver: vertion,
    modelName: null,
    tablelName: null,
    primaryKey: null,
    processing: false,
    xhrCount: 0,
    requestLimit: 15000,
    landing: function (idx) { return null; },
    schema: function () { return null; },
    success: function (db) { return console.log('IndexedDBmodel '+db+' успешно стартовала'); },
    init: function () {
        var model = this;
        if (model.heirs) model.heirs.map(function (v, i, a) {
            v.xhrCount = 0;
            v.populate();
        });
    },
    get: function (id, opt) {
        var model = this;
        var handler = Object.assign({done: null, fail: null}, opt);

        if (id && typeof handler.done === 'function') {
            try {
                var tx = model.db.transaction([model.tablelName], 'readonly');
                var store = tx.objectStore(model.tablelName);
                tx.onabort = (handler.fail == null) ? model.fail : handler.fail;
                // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
                return store.get(id).onsuccess = handler.done;
            } catch (e) {
                if (handler.fail) handler.fail(e); else model.fail(e);
            }
        }
    },
    getAll: function (done) {
        var model = this;
        if (typeof done === 'function') {
            try {
                if (typeof done === 'function') {
                    var tx = model.db.transaction([model.tablelName], 'readonly');
                    tx.onabort = model.fail;
                    // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
                    var store = tx.objectStore(model.tablelName);
                    return store.getAll().onsuccess = done;
                }
            } catch (e) {
                model.fail(e);
            }
        }
    },
    add: function (data, opt) {
        var model = this, row = model.data2row(data, QueryParam.STRNULL);
        var handler = Object.assign({done: null, fail: null}, opt);
        try {
            var tx = model.db.transaction([model.tablelName], 'readwrite');
            (handler.fail == null) ? model.fail : handler.fail;
            // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
            var store = tx.objectStore(model.tablelName);

            if (model.hasOwnProperty('primaryKey') && row.hasOwnProperty(model.primaryKey)) {
                if (row[model.primaryKey] == null) {
                    delete row[model.primaryKey];
                }
            }
            tx.onabort = function (e) {
                if (model.hasOwnProperty('primaryKey') && row.hasOwnProperty(model.primaryKey))
                    throw 'PrimaryKey[' + model.primaryKey + '] can\'t use ' + model.tablelName + '::add() method, on populated dataset!';
            };
            if (typeof handler.done === 'function') store.add(row).onsuccess = handler.done; else store.add(row);
        } catch (e) {
            if (handler.fail) handler.fail(e); else model.fail(e);
        }
    },
    put: function (data, opt) {
        var model = this, row = model.data2row(data, QueryParam.STRNULL);
        var handler = Object.assign({done: null, fail: null}, opt);
        try {
            var tx = model.db.transaction([model.tablelName], 'readwrite');
            tx.onabort = (handler.fail == null) ? model.fail : handler.fail;
            // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
            var store = tx.objectStore(model.tablelName);

            if (row[model.primaryKey] === null) throw 'PrimaryKey is not set!';
            if (typeof handler.done === 'function') store.put(row).onsuccess = handler.done; else store.put(row);
        } catch (e) {
            if (handler.fail) handler.fail(e); else model.fail(e);
        }
    },
    del: function (idx, opt) {
        var model = this;
        var handler = Object.assign({done: null, fail: null}, opt);
        try {
            var tx = model.db.transaction([model.tablelName], 'readwrite');
            tx.onerror = tx.onabort = (handler.fail == null) ? model.fail : handler.fail;
            // tx.oncomplete = function (event) { model.db.close(); /** after handler **/ };
            var store = tx.objectStore(model.tablelName);
            if (typeof handler.done === 'function') store.delete(idx).onsuccess = handler.done; else store.delete(idx);
        } catch (e) {
            if (handler.fail) handler.fail(e); else model.fail(e);
        }
    },
    populate: function (idx) {
        var model = this;
        if (!model.processing && model.xhrCount < model.requestLimit) xhr({
            url: location.update(model.url, {
                model: model.tablelName,
                ver: model.version,
                idx: idx ? JSON.stringify(idx) : ''
            }),
            // rs: {'Hash': acl.user.hash}, // -------------------------------------
            before: function (e) { model.processing = true; },
            after: function (e) { model.processing = false; },
            done: function (e, hr) {
                var res = str2json(this.responseText,{result: 'error', message: this.status + ': ' + HTTP_RESPONSE_CODE[this.status]});
                if (res.result === 'ok') {
                    var count = res.data.rows ? res.data.rows.length : 0;
                    if (count) {
                        var i = 0, idx = [];
                        var next = function () {
                            if (i < count) {
                                idx.push(res.data.rows[i][model.primaryKey]);
                                model.add(res.data.rows[i++], {done: next});
                            } else {
                                model.xhrCount += count;
                                model.processing = false;
                                if (count) { return model.populate(idx); }
                            }
                        };
                        next();
                    }
                } else {
                    app.msg(res);
                }
            },
            fail: function (e) {
                var self = this;
                self.xhrCount++;
                console.error('Model[' + self.modalName + ']' + this.status + ': ' + HTTP_RESPONSE_CODE[this.status], this);
            }
        });
    }
});
}

var webDBmodel = function (db, opt) {
    if (opt && typeof opt === 'object') this.merge(opt);

    if (db && typeof db === 'object') {
        this.version = db.version;
    } else {
        try { db = 'openDatabase' in g ? openDatabase(this.name, this.version, this.displayName, this.estimatedSize) : null; }
        catch (e) { db = null; console.error(e); }
    }
    if (db !== null) this.db = new webSQL(db);
}; webDBmodel.prototype = {
    db: null,
    name: 'DB',
    version: '1.0',
    displayName: 'webSQL',
    estimatedSize: 20000,
    modelName: null,
    tableName: null,
    primaryKey: null,
    processing: false,
    requestLimit: 1500,
    DDL: null,
    done: function(tx, rs) { return console.log('webDBmodel '+this.db+' успешно стартовала') },
    fail: function(tx, e) { return console.error('webDBmodel '+e.message) },
    init: function (query, ver) {
        if (this.db === null) return console.error('DB webSQL not istalled!');
        if (typeof ver !== 'undefined' && ver != this.db.version) this.db.changeVersion(this.db.version, ver, this.changeVersion);
        this.db.stmt([query ? query : this.DDL], [], this.done, this.fail); return this;
    },
    changeVersion:function(tx) { return console.log(tx); },
    unload: function(query, count, option) {
        var model = this, opt = Object.assign({timer:0, xhrCount:0, url:'/chunking', method:'PUT', params:{}, limit : 100, page:0, count:0}, option);
        if (typeof count === 'string') model.db.filter(count, [], function (tx, rs) {
            opt.count = rs.rows ? rs.rows[0].count : 0;
            if (opt.count === 0) { return false; } else { if (typeof opt.before === 'function') opt.before(rs); }
            var payload = function (tx, rs) {
                var limit = ' LIMIT '+ opt.limit+' OFFSET ' + (opt.page * opt.limit);
                model.db.filter(query+limit, [], function(t, r) {
                    opt.length = parseInt(r && r.rows.length);
                    var wait = function() {
                        if (model.processing && !opt.timer) { opt.timer = setTimeout(function () { wait(); }, 50);  return false; }
                        clearTimeout(opt.timer);
                        xhr({ method: opt.method, url: opt.url,
                            // --------------------------------------------------
                            rs: {'Hash': acl.user.hash, 'Content-type': 'application/json'},
                            data: JSON.stringify(Object.assign({
                                ver: model.db.version,
                                pk: model.primaryKey,
                                table: model.tablelName,
                                page: opt.page,
                                rows: obj2array(r.rows)
                            }, opt.params)),
                            before: function (e) { model.processing = true; },
                            after: function (e) { model.processing = false; opt.xhrCount++; },
                            done: function (e, hr) {
                                var res = str2json(this.responseText,{result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]});
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
                url: location.update(opt.url , Object.assign({
                    ver: model.db.version,
                    limit: opt.limit,
                    page: opt.page,
                    pk: model.primaryKey,
                    model: model.tablelName
                    // ,idx: idx ? JSON.stringify(idx) : []
                }, opt.params)),
                // rs: {'Hash': acl.user.hash}, // ---------------------------------------------------
                before: function (e) { model.processing = true; return false; },
                after: function (e) { model.processing = false; opt.xhrCount++; return false; },
                done: function (e, hr) {
                    var res = str2json(this.responseText,{result: 'error', message: this.status + ': ' + HTTP_RESPONSE_CODE[this.status]});
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
// document.addEventListener("deviceready", function() {
//     db = window.openDatabase("Database", "1.0", 'Check DB instance', 200000);
// }, false);
// var election13092020 = new webDBmodel(null, {name:"DB" + (acl.user.distric_id || 0) + (acl.user.polling_station || 0), version: "1.2", displayName: "Стораж 2020:09:13", estimatedSize:200000});

}( window, window.ui ));
