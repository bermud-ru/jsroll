/**
 * @app jsroll.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Классы RIA / SPA javascritp framework
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 26/05/2020
 * @status beta
 * @version 2.1.2b
 * @revision $Id: jsroll.js 2.1.2b 2020-05-16 10:10:01Z $
 */

(function ( g, undefined ) {
    'suspected';
    'use strict';
    var version = '2.1.2b';

    g.HTTP_RESPONSE_CODE = {
          0: 'Request runtime error / address unreachable',
         10: 'Application offline',
        100: 'Continue',
        101: 'Switching Protocol',
        102: 'Processing',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        300: 'Multiple Choice',
        301: 'Moved Permanently',
        302: 'Found',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        306: 'Switch Proxy',
        307: 'Temporary Redirect',
        308: 'Permanent Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Request Entity Too Large',
        414: 'Request-URI Too Long',
        415: 'Unsupported Media Type',
        416: 'Requested Range Not Satisfiable',
        417: 'Expectation Failed',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'HTTP Version Not Supported'
    };

    g.WEBSOCKET_RESPONSE_CODE = {
        1000: 'normal closure',
        1001: 'going away',
        1002: 'protocol error',
        1003: 'unknown data (opcode)',
        1004: 'frame too large',
        1005: 'rrmote host error',
        1006: 'remote host error',
        1007: 'utf8 expected',
        1008: 'message violates server policy',
        1015: 'CERT_AUTHORITY_INVALID'
    };

    /**
     * @class WebSocket
     *
     * WebSocket.CONNECTING: 0
     * WebSocket.OPEN: 1
     * WebSocket.CLOSING: 2
     * WebSocket.CLOSED: 3
     */
    var WebSocket = 'MozWebSocket' in g ? g.MozWebSocket : ('WebSocket' in g ? g.WebSocket : function (url, opt) { return console.warn('WebSocket not supported!'); });
    var ws = function (url, opt) {
        this.opt = Object.assign(this.opt, opt);
        this.opt.url = url;
    }; ws.prototype = {
        opt: {protocol:[], binaryType:'blob', reconnect:false, reconnectTimeout:1000, error:null, open:null, message:null, close:null},
        socket: null,
        connected: false,
        __status: ws.CONNECTING,
        get readyState() { return  this.__status = this.socket ? this.socket.readyState : ws.CONNECTING; },
        up: function(opt) {
            if (!this.connected || (typeof opt === 'object' && opt.url && opt.url !== this.opt.url)) {
                var $ = this;
                if (opt) $.opt.merge(opt);
                // if ($.socket) $.socket.close();
                $.socket = new WebSocket($.opt.url, $.opt.protocol); // protocol=["soap", "wamp"]; protocol:'websocket'
                if ($.socket) {
                    $.socket.binaryType = $.opt.binaryType; //.binaryType = "arraybuffer";
                    ['onerror', 'onopen', 'onmessage', 'onclose'].forEach(function (x) {
                        $.socket[x] = function (e) { return $[x](e) };
                    });
                }
            }
            return this.socket;
        },
        onerror: function(e) {
            this.connected = false;
            if (typeof this.opt.error === 'function') {
                this.opt.error.call(this, e)
            } else {
                console.error(e);
            }
            return this;
        },
        onmessage: function(e) {
            return (typeof this.opt.message === 'function') ? this.opt.message.call(this, e) : console.log(e);
        },
        onopen: function(e) {
            this.connected = new Date();
            return (typeof this.opt.open === 'function') ? this.opt.open.call(this, e) : console.log(e);
        },
        onclose: function(e) {
            var $ = this;
            $.connected = false;
            if (e instanceof Event) {
                if ( $.opt.reconnect ) {
                    var fn = function() { return $.readyState === ws.CONNECTING ? $.up() : setTimeout(fn, $.opt.reconnectTimeout)};
                    return setTimeout(fn, $.opt.reconnectTimeout)
                }
            } else if ($.socket) { $.socket.close() }

            return (typeof $.opt.close === 'function') ? $.opt.close.apply($, arguments) : console.warn(e);
        },
        close: function (code, reason) {
            // закрывающая сторона: socket.close([code], [reason]);
            // code – специальный WebSocket-код закрытия (не обязателен).
            // reason – строка с описанием причины закрытия (не обязательна).
            // ws.socket.close(1000, "работа закончена");
            if (this.connected && code) return this.socket.close(code, reason);
        },
        send: function(data) {
            if (this.connected) this.socket.send(typeof data === 'string' ? data : JSON.stringify(data)); else console.warn(this.url + ' not connected!');
        }
    };
    ws.CONNECTING = 0;
    ws.OPEN = 1;
    ws.CLOSING = 2;
    ws.CLOSED = 3;
    ws.RECONNECTING = 4;
    g.ws = ws;

    /**
     * @function eventCode
     * Хелпер обработки кода нажатия на устройтвах ввода типа клавиатура.
     *
     * @argument { Event } e - событие
     * @result { int | string }
     */
    g.eventCode = function (e) {
        return e instanceof InputEvent ? e.data : e instanceof Event ?
        'key' in e ? e.key : 'keyCode' in e ? e.keyCode : 'keyIdentifier' in e ? e.keyIdentifier : e.charCode : null;
    };

    if (!('indexedDB' in g)) { g.indexedDB = g.mozIndexedDB || g.webkitIndexedDB || g.msIndexedDB || g.shimIndexedDB || null; }
    if (!('IDBTransaction' in g)) { g.IDBTransaction = g.webkitIDBTransaction || g.msIDBTransaction || null; }
    if (!('IDBKeyRange' in g)) { g.IDBKeyRange = g.webkitIDBKeyRange || g.msIDBKeyRange || null; }
    /**
     * @class IDB
     *
     * @param { string } name
     * @param { int } version
     * @param { object } opt
     * @constructor
     */
    g.IDB = function(name, version, opt) {
        var $ = this;
        $.name = name;
        $.version = parseInt(version);
        $.models = {};
        $.__active__ = g.IDB.LAUNCH;
        Object.defineProperty($, 'active', {
            __proto__: null,
            get: function active() { return $.IDBinstance ? $.IDBinstance.readyState === 'done' && $.__active__ === g.IDB.READY : false; }
        });
        if (typeof opt === 'object') $.merge(opt);
        return $;
    }; g.IDB.prototype = {
        IDBOpenDBRequest: null,
        set db(event) { this.IDBOpenDBRequest = event instanceof Event ? ui.src(event) : event;},
        get db() { return this.IDBOpenDBRequest ? this.IDBOpenDBRequest.result : null; },
        get tx() { return this.IDBOpenDBRequest ? this.IDBOpenDBRequest.transaction : null; },
        connect: function () {
            var $ = this, max = 0, wait = function () {
                clearTimeout(wait.processs);
                if (!$.heirs && max++ < 30) return wait.processs = setTimeout(wait, 20);
                var IDBinstance = g.indexedDB.open($.name, $.version, function (e) { return $.buildSchemas(e); });
                // Create schema
                IDBinstance.onupgradeneeded = function (e) { return $.buildSchemas(e); };
                // on reload, IDBinstance up!
                IDBinstance.onsuccess = function (e) { return $.launchSchemas(e); };
                IDBinstance.onblocked = function (e) { return $.blocked(e); };
                // on Error
                IDBinstance.onerror = function (e) { return $.fail(e); };
                return $.IDBinstance = IDBinstance;
            };
            return wait();
        },
        destroy: function (event) {
            var $ = this;
            $.IDBinstance = null; // Дропнули всё
            $.populate = true; // Пересоздали хранилище
            var IDBinstance = $.IDBinstance = g.indexedDB.deleteDatabase($.name, $.version);
            IDBinstance.onsuccess = function (e) { return $.launchSchemas(e); }
            IDBinstance.onerror = function (e) { return $.fail(e); }
            IDBinstance.onblocked = function (e) { return $.blocked(e); }
            IDBinstance.onupgradeneeded = function (e) { return $.buildSchemas(e); }
        },
        buildSchemas: function (db) {
            this.__active__ |= g.IDB.BUILD;
            var $ = this; $.db = db; obj2array(this.heirs).map(function (v, i, a) {
                if (typeof v.schema === 'function') { v.schema($.db, $.tx); } else {
                    if (!$.db.objectStoreNames.contains(v.name)) {
                        if (v.primaryKey) $.db.createObjectStore(v.name,{keyPath:v.primaryKey, autoIncrement: !!v.autoIncrement});
                        else $.db.createObjectStore(v.name);
                    }
                }
            });
            this.__active__ ^= g.IDB.BUILD;
            return $;
        },
        launchSchemas: function (db) {
            var $ = this; $.db = db; obj2array(this.heirs).map(function (v, i, a) {
                $.models[v.tables.join('-')] = v;
                if (typeof v.launch === 'function') v.launch($.db, $.tx);
            });
            $.__active__ ^= g.IDB.LAUNCH;
            $.__pool__.forEach(function (v) { v.fn.apply($, v.args) }); $.__pool__ = [];
            return $;
        },
        __pool__: [],
        onready: function (fn, arg) {
            if ( g.IDB.READY !== this.__active__ ) {
                 return this.__pool__.push({fn: fn, arg: arg || []});
            }
            return fn.apply(this, arg||[]);
        },
        store: function (k, status, opt, row) {
            var store, $ = this, tx = k ? $.owner.db.transaction($.tables, k) : $.owner.db.transaction($.tables);
            tx.onerror = function (e) { return opt && typeof opt.cancel === 'function' ? opt.fail.call($, e, status, store) : $.fail(e, status, store); };
            tx.onabort = function (e) {
                if ($.primaryKey && row && row.hasOwnProperty($.primaryKey))
                    console.error('PrimaryKey[' + $.primaryKey + '] = ' + row[$.primaryKey] + ' in ' + JSON.stringify($.tables) + ' already has!');
                else return opt && typeof opt.fail === 'function' ? opt.fail.call($, e, status, store) : (opt.hasOwnProperty('fail') ? opt.fail : $.fail(e, status, store));
            };
            store = tx.objectStore(!k || k === 'readwrite' ? $.name : $.tables);
            if (typeof opt === 'object' && opt.index) {
                if (store.indexNames.contains(opt.index)) {
                    store = store.index(opt.index);
                } else { console.warn('IDB.'+JSON.stringify($.tables)+' index ['+opt.index+'] not exist!') }
            }
            store.oncomplete = function (event) { return opt && typeof opt.done === 'function' ?
                opt.done.call($, event, status, tx) : (opt && opt.hasOwnProperty('done') ? opt.done : $.done(event, status, tx));
            }
            return store;
        },
        close: function () { var $ = this; try { $.db.close(); } catch (e) { $.fail(e); } return $; },
        blocked:function (event) { console.warn(event); return this; },
        done: function (event, status, store) { console.table( event instanceof Event ? event.target.result : event.result); return store; },
        cancel: function (event, status, store) { console.warn(event); return store; },
        fail: function (event, status, store) { return console.error('Fail database '+this.name+' ver '+this.version +' :'+ (event instanceof Event ? event.target.error : JSON.stringify(event))) },
        status: function (methodID, status) { return parseInt(methodID) * (status === undefined || !!status ? 1 : -1); },
        data2row: function (data, flag) {
            if (data && typeof data === 'object') {
                var p = function (o) {
                    var res = {};
                    for (var i in o) { res[i] = QueryParam(o[i],typeof flag === 'undefined' ? QueryParam.STRNULL : flag); }
                    return res;
                };
                if (data instanceof Array) { return data.map(function (v) { return p(v); }); }
                return p(data);
            }
            return data;
        },
        bind: function (model) {
            return Object.createChild(this, model);
        }
    };
    g.IDB.READY = 0; g.IDB.INITIALIZING = 1; g.IDB.BUILD = 2; g.IDB.LAUNCH = 4; g.IDB.PROCCESS = 8;

    /**
     * @class IDBFilter
     *
     * @param limit { int }
     * @param condition { function }
     * @param args { arguments }
     * @constructor
     */
    g.IDBFilter = function (limit,condition ,args) {
        this.limit = parseInt(limit);
        if (isNaN(this.limit)) console.log('IDBFilter limit not define!');
        this.args = args || [];
        if (typeof condition === 'function') this.fn = condition;
    }; g.IDBFilter.prototype = {
        offset: 0, limit: 0, advanced: true, count: 0, fn: null, page: [], chunk: [], run: false,
        populated: function(cursor) { return cursor && (this.limit === 0 || this.chunk.length < this.limit) },
        condition: function (cursor) { this.offset++; if (!this.fn) this.chunk.push(cursor.value); else this.fn.apply(this, [cursor].merge(this.args)) },
        next: function () { this.run = true; if (arguments.length) this.args = obj2array(arguments); this.chunk=[]; this.page.push(this.offset); this.advanced = false; return this },
        reset: function () { this.run = true; if (arguments.length) this.args = obj2array(arguments); this.chunk=[]; this.page=[]; this.advanced = true; this.offset = 0; return this },
    };
    g.IDBFilter.LIMITLESS = 0;
    g.IDBFilter.only = function (a) { if (a instanceof Array) a.__proto__.method = 'only'; return a };
    g.IDBFilter.bound = function (a) { if (a instanceof Array) a.__proto__.method = 'bound'; return a };

    /**
     * Constant            Code    Situation
     * UNKNOWN_ERR          0        The transaction failed for reasons unrelated to the database itown and not covered by any other error code.
     * DATABASE_ERR         1        The statement failed for database reasons not covered by any other error code.
     * VERSION_ERR          2        The operation failed because the actual database version was not what it should be. For example, a statement found that the actual database version no longer matched the expected version of the Database or DatabaseSync object, or the Database.changeVersion() or DatabaseSync.changeVersion() methods were passed a version that doesn't match the actual database version.
     * TOO_LARGE_ERR        3        The statement failed because the data returned from the database was too large. The SQL "LIMIT" modifier might be useful to reduce the size of the result set.
     * QUOTA_ERR            4        The statement failed because there was not enough remaining storage space, or the storage quota was reached and the user declined to give more space to the database.
     * SYNTAX_ERR           5        The statement failed because of a syntax error, or the number of arguments did not match the number of ? placeholders in the statement, or the statement tried to use a statement that is not allowed, such as BEGIN, COMMIT, or ROLLBACK, or the statement tried to use a verb that could modify the database but the transaction was read-only.
     * CONSTRAINT_ERR       6        An INSERT, UPDATE, or REPLACE statement failed due to a constraint failure. For example, because a row was being inserted and the value given for the primary key column duplicated the value of an existing row.
     * TIMEOUT_ERR          7        A lock for the transaction could not be obtained in a reasonable time.
     */

    /**
     *  Database openDatabase(in DOMString name, in DOMString version, in DOMString displayName, in unsigned long estimatedSize, in optional DatabaseCallback creationCallback);
     *
     * database_name - Имя базы данных;
     * database_version - Версия базы данных. Может быть изменена  функцией changeVersion;
     * database_displayname - Отображаемое имя базы;
     * database_size - Размер базы данных в байтах.
     * creationCallback - при создании функциия
     */

    /**
     * @QueryParam
     * Helper for webSQl
     * @param { * } v
     * @param { int } o
     * @returns { string|any }
     * @constructor
     */
    var QueryParam = function (v, o) {
        var opt = typeof o === 'undefined' ? QueryParam.NATIVE : Number(o);
        if (v instanceof HTMLElement) v = v.innerHTML;
        if (typeof v === 'undefined' || v === null) {
            return !(opt & QueryParam.NULLSTR) && opt & QueryParam.QOUTED | QueryParam.STRNULL ? (opt & QueryParam.NULLSQL ? 'NULL' : null) : '';
        } else if (typeof v === 'object') {
            return opt & QueryParam.QOUTED ? "'" + JSON.stringify(v) + "'" : String(JSON.stringify(v));
        } else if (typeof v === 'string' && v === '') {
            return (opt & QueryParam.NULLSTR) ? '' : ((opt & QueryParam.STRNULL) ? (opt & QueryParam.NULLSQL ? 'NULL' : null) : '');
        }
        return /\d+/.test(v) && String(Number(v)) === String(v) ? (opt & QueryParam.INTQOUTED ? String(v) : Number(v)) : (opt & QueryParam.QOUTED ? "'" + v + "'" : String(v));
    };  QueryParam.NATIVE = 0; QueryParam.QOUTED = 1; QueryParam.STRNULL = 2; QueryParam.INTQOUTED = 4; QueryParam.NULLSTR = 8; QueryParam.NULLSQL = 16;
    g.QueryParam = QueryParam;

    /**
     * Helper for webSQl
     * @param v
     * @param i
     * @param a
     * @returns {string|any}
     */
    var paramsNative = function (v, i, a) { return QueryParam(v, QueryParam.STRNULL | QueryParam.INTQOUTED); };

    /**
     * Helper for webSQl
     * @param v
     * @param i
     * @param a
     * @returns {string}
     */
    var paramStatment = function (v, i, a) { return v + ' = ?'; };

    /**
     * @webSQL wrapper for native webSQL object
     *
     * @param opt { Object } {name:"DB", version: "1.0", displayName: "Create "+datetimer(new Date()), estimatedSize:200000}
     * @return webSQLinstance { webSQL }
     */
    var webSQL = function ( opt) {
        var $ = this;
        if ('openDatabase' in g) {
            this.webSQLinstance = openDatabase(opt.name, opt.version||'1.0', opt.displayName||"DB instace dreated at "+(new Date()), opt.estimatedSize||200000);
            $.stmt("SELECT * FROM sqlite_master WHERE type='table' AND name NOT LIKE '__Webkit%';",[],
                function(tx, rs) {
                    var table, tablesNumber = rs.rows.length;
                    for (var i = 0; i < tablesNumber; i++) {
                        table = rs.rows.item(i);
                        if ( table.type === 'table') {
                            tx.executeSql('SELECT name, sql FROM sqlite_master WHERE name = ?', [table.name], function(t,r){
                                $.tables[r.rows[0].name] = {type:'table', DDL:r.rows[0].sql};
                            });
                        } else {
                            $.tables[table.name] = {type: table.type};
                        }
                    }
                }
            );
        } else {
            this.webSQLinstance = null; throw "webSQL object not exist!";
        }
        if (opt && typeof opt === 'object') $.merge(opt);
    };
    webSQL.prototype = {
        opt: QueryParam.STRNULL | QueryParam.INTQOUTED,
        changeVersion: function(currentVer, newVer, callback){
            try {
                return this.webSQLinstance.changeVersion(currentVer, newVer, callback);
            } catch (e) {
                this.fail(null, e);
            }
            return false;
        },
        tables: {},
        get info() {
            return this.stmt("SELECT * FROM sqlite_master WHERE type='table' AND name NOT LIKE '__Webkit%';",[],
                function(tx, rs) {
                    var table, tablesNumber = rs.rows.length;
                    console.log('webSQL DB info:');
                    for (var i = 0; i < tablesNumber; i++) {
                        table = rs.rows.item(i);
                        if ( table.type === 'table') {
                            tx.executeSql('SELECT name, sql FROM sqlite_master WHERE name = ?', [table.name], function(t,r){
                                console.info('- table: ' + r.rows[0].name + ', DDL: ' + r.rows[0].sql);
                            });
                        } else {
                            console.info('- type: ' + table.type +', name: ' + table.name);
                        }
                    }
                }
            );
        },
        get version() {
            return this.webSQLinstance.version;
        },
        turn: false,
        runnig: false,
        proc: function (tx, callback) {
            this.runnig = tx;
            if (typeof callback === 'function') return callback.call(this, tx);
            return tx;
        },
        fail: function (tx, error, callback, sql, index, query) {
            if (typeof callback === 'function') callback.call(this, tx, error, sql, index, query);
            else console.error('webSQL query ['+sql+'] error(' + error.code + '): ' + error.message);
            return this.runnig = false;
        },
        done: function (tx, result, callback, sql, index, query) {
            if (typeof callback === 'function') callback.call(this, tx, result, sql, index, query);
            else { console.warn('webSQL query ['+sql+'] resultSet: '); console.table(result); }
            return this.runnig = false;
        },
        cancel: function (tx) { /*tx.executeSql('ABORT', [], null, function () {return true; }); */}, //TODO:
        transaction: function (proc, fail) {
            var $ = this;
            //  $.webSQLinstance.readTransaction(function (tx) {
            var wait = function() {
                if (!$.turn || !$.runnig) {
                    if (wait.timer) clearTimeout(wait.timer);
                    return $.webSQLinstance.transaction(
                        function (tx) { return $.proc(tx, proc);},
                        function (error) { return $.fail($.running, error, fail); }
                    );
                } else { return wait.timer = setTimeout(wait, 50); }
            }
            wait();
        },
        executeSql: function(tx, query, data, done, fail) {
            var $ = this, multiQuery = typeof query !== 'string' ;
            try {
                return (multiQuery ? query : [query]).forEach( function(sql, i, a) {
                    return tx.executeSql( sql, (multiQuery ? data[i] : data),
                        function(tx, result) {
                            return $.done(tx, result, done, sql, i, a);
                        },
                        function(tx, error) {
                            return $.fail(tx, error, fail, sql, i, a);
                        });
                });
            } catch(e) {
                return $.fail(tx, e, fail);
            }
        },
        /**
         * webSQL:stmt
         *
         * @param query { String }
         * @param data { Array }
         * @param done { function }
         * @param fail { function }
         * @param bulk { webSQL.BULK | webSQL.UPSERT | webSQL.DEFAULT }
         */
        stmt: function (query, data, done, fail, bulk) {
            var $ = this, d = typeof data === 'undefined' ? [] : (!!bulk ? data : [data]);
            return $.transaction(
                function (tx) {
                    var i = 0, count = d.length, ResultSet = [];
                    var next = function (tx, rs) {
                        if (i < count) {
                            if (typeof rs !== 'undefined' ) ResultSet[i] = rs;
                            $.executeSql(tx, query, d[i++], next, fail)
                        } else {
                            return typeof done === 'function' ? done.call($, tx, count > 1 ? ResultSet : rs) : null;
                        }
                    };
                    return next(tx);
                },
                fail
            );
        },
        grinder: function (o, fields, no_uppend) {
            var res = {}, $ = this; // res = Object.create(null);
            if (fields instanceof Array && typeof o === 'object') fields.forEach(function (v) {
                if (o.hasOwnProperty(v) || !!no_uppend) res[v] = o.hasOwnProperty(v) ? QueryParam(o[v], $.opt) : null;
            });
            return res;
        },
        filtration: function(query, params) {
            var $ = this, m = false;
            if (/:([^\s$%\),]*)/m.test(query)) {
                if (!Object.keys(params).length) throw 'webSQL::filter params not exist!';
                while (m = /:([^\s$%\),]*)/gm.exec(query)) {
                    if (params.hasOwnProperty(m[1])) {
                        query = query.replace(m[0], QueryParam(params[m[1]], $.opt));
                    } else {
                        throw 'webSQL::filter param (' + m[1] + ') not exist!';
                    }
                }
             }
            return query;
        },
        /**
         * webSQL:filter
         *
         * @param query { String }
         * @param params { Array }
         * @param done { function }
         * @param fail { function }
         * @return {*|void}
         */
        filter: function (query, params, done, fail) {
            return this.stmt(this.filtration(query, params), [], done, fail);
        },
        /**
         * webSQL:insert
         *
         * @param table { String }
         * @param params  { Array }
         * @param done { function }
         * @param fail { function }
         * @param option { Object }
         * @return {*|void}
         */
        insert: function (table, params, done, fail, option) {
            var opt = typeof option === 'undefined' ? webSQL.DEFAULT : Number(option);
            // FOR UPSERT!!!
            // set option webSQL.UPSERT and
            // CREATE UNIQUE INDEX idx_something ON table (..., ...)
            // INSERT OR IGNORE INTO
            var fields = opt & webSQL.BULK ? Object.keys(params[0]) : Object.keys(params);
            var values = opt & webSQL.BULK ? params.map(function (v, i, a) {
                return Object.values(v).map(paramsNative);
            }) : Object.values(params).map(paramsNative);
            var query = (opt & webSQL.UPSERT ? 'INSERT OR REPLACE INTO ' : 'INSERT INTO ') + table + ' (' + (fields.join(',')) + ') VALUES (' + (Array(fields.length).fill('?').join(',')) + ');';

            return this.stmt(query, values, done, fail, opt & webSQL.BULK);
        },
        /**
         *
         * @param table { String }
         * @param params { Array }
         * @param filter
         * @param done { function }
         * @param fail { function }
         * @return {*|void}
         */
        update: function (table, params, filter, done, fail) {
            var keys = [], where = [], $ = this;
            if (typeof filter === 'string') {
                filter = this.filtration(filter, params);
            } else if (typeof filter === 'object') {
                if (filter instanceof Array) {
                    filter.forEach(function (v, i, a) {
                        keys.push(v);
                        where.push(QueryParam(params[v], $.opt));
                        delete params[v];
                    });
                } else {
                    keys = Object.keys(filter);
                    where = Object.values(filter).map(paramsNative);
                }
            }

            var fields = Object.keys(params);
            var values = Object.values(params).map(paramsNative);
            var query = 'UPDATE ' + table + ' SET ' + (fields.map(paramStatment).join(','));

            if (keys.length) {
                query += ' WHERE ' + (keys.map(paramStatment).join(' AND '));
            } else if (typeof filter === 'string') {
                query += ' WHERE ' + filter;
            }

            return this.stmt(query, values.concat(where), done, fail);
        }
    }; webSQL.BULK = 1; webSQL.UPSERT = 2; webSQL.DEFAULT = 0;
    g.webSQL = webSQL;

    /**
     * @function dbf
     * webSQL wraper for common Interface
     *
     * @param { webSQL } webSQLinstance
     * @param { Object } opt
     * @returns {{cancel: (function(): boolean), filter: (function(*=, *=, *=): instansce), fail: fail, opt: {}, done: done, db: *}|void}
     */
    var dbf = function (webSQLinstance, opt) {
        if (!db) return console.warn('webSQL ' + opt.naeme + ' not exit!');
        return {
            opt: {},
            webSQLinstance: webSQLinstance,
            cancel: function () { return false; },
            done: function(tx, rs) {
                if (typeof this.opt.done === 'function') this.opt.done.call(this, tx, rs);
                if (typeof this.opt.after === 'function') return this.opt.after.call(this,tx, rs);
            },
            fail: function(tx, er) {
                if (typeof this.opt.fail === 'function') this.opt.fail.call(this, tx, er);
                if (typeof this.opt.after === 'function') return this.opt.after.call(this,tx, er);
            },
            filter: function(query, params, opt) {
                if (typeof opt === 'object') this.opt.merge(opt);
                if (typeof opt.before === 'function') opt.before.call(this);
                this.webSQLinstance.filter(query, params, this.done.bind(this), this.fail.bind(this));
                return this;
            }
        }
    }; g.dbf = dbf;

    g.URL = g.URL || g.webkitURL;
    g.requestFileSystem = g.requestFileSystem || g.webkitRequestFileSystem;

    var is_url = /^(?:https?:\/\/)?(?:(?:[\w]+\.)(?:\.?[\w]{2,})+)?([\/\w]+)(\.[\w]+)|^(?:\/[\w]+){1,}/i;

    g.is_empty = function (v) { return  v === '' || v === null || v === undefined || false; };

    /**
     * @function re
     * Создание регулярного выражения из строки
     *
     * @argument { String } s - регулярное выражение
     * @result { RegExp }
     */
    var re = function (s, flags) {
        if (typeof s === 'object') return s;

        try {
            var p = /[?\/](.+)(\/([igum]*$))/.exec(s) || [];
            return new RegExp(p[1]||s,p[3] || flags || '');
        } catch(e) {
            console.error('jsroll::re('+s+')',e);
            return undefined;
        }
    }; g.re = re;

    /**
     * @function str2json
     * Создание JSON объекта из стоки
     *
     * @argument { String } s - строка JSON
     * @returns {*}
     */
    var str2json = function (s, def) {
        if (typeof s === 'object') return s;
        try { var o = (typeof s === 'string' ? JSON.parse(s) : s||(typeof def === 'undefined' ? null : def)); } catch (e) { o = typeof def === 'undefined' ? s : def};
        return o;
    };
    g.str2json = str2json;

    /**
     * @function obj2array
     *
     * @param { Object } a
     * @returns { Array }
     */
    var obj2array = function (a) { return (a && typeof a === 'object') ? Array.prototype.slice.call(a) : []; }; g.obj2array = obj2array;

    /**
     * function kv2array
     *
     * @param { Object } o
     * @param { string | function } glue
     * @returns { Array }
     */
    g.kv2array = function (o, glue) {
        return o && typeof o === 'object' ? Object.keys(o).map(function (v,i,a) {
            return typeof glue === 'function' ? glue(v, o[v]) : (v + ( glue ? glue : ' ' ) + o[v]);
        }) : [];
    };

    /**
     * @function coalesce
     * Return first not empty in the function arguments
     *
     * @returns { variant | null }
     */
    g.coalesce = function() {
        for (var i in arguments) { if (typeof arguments[i] !== 'undefined' && arguments[i] !== null && arguments[i] !== '') return arguments[i] };
        return undefined;
    };

    /**
     * @function quoter
     * Заменяет одинарные и двойные кавычки на Html коды и возрващает строку
     *
     * @param { * }  v
     * @param { int } opt
     * @returns { string }
     */
    var quoter = function(v, opt) {
        var s = typeof v === 'string' ? v : ( v ? JSON.stringify(v) : null );
        if (s) {
            opt = typeof opt === 'undefined' ? quoter.CODE_QOUTAS : opt;
            if (opt & quoter.SLASHES_QOUTAS) s = s.replace(/\\"/g, '"').replace(/\\'/g, "'");
            if (opt & quoter.SLASHES_CODE) s = s.replace(/\\"/g, '&quot;');
            if (opt & quoter.CODE_QOUTAS) s = s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            if (opt & quoter.CODE_QOUTAS2) s = s.replace(/"/g, '&#39;').replace(/'/g, '&quot;');
            if (opt & quoter.QOUTAS_CODE) s = s.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            return s;
        }
        return '';
    }; g.quoter = quoter;
    g.quoter.CODE_QOUTAS = 1;
    g.quoter.CODE_QOUTAS2 = 2;
    g.quoter.SLASHES_QOUTAS = 4;
    g.quoter.SLASHES_CODE = 8;
    g.quoter.QOUTAS_CODE = 16;

    /**
     * @function bundler
     * Возращает массив не empty элементо массива
     *
     * @returns { *[] }
     */
    g.bundler = function() {
        return obj2array(arguments).filter(function (v) { return (typeof v !== 'undefined' && v !== null && v !== ''); });
    };

    /**
     * Достаём необходимые поля из объекта
     *
     * @param o { Object }
     * @param f { string[] }
     * @returns Object
     */
    g.data_maker = function (o, f) {
        if (f instanceof Array) {
            var r = {}; f.forEach(function (v) { r[v] = o.hasOwnProperty(v) ? o[v] : null; })
            return r;
        }
        return o;
    };

    /**
     * @function bitfields
     *
     * @param { int } status
     * @param { Array } d
     * @returns { Array }
     */
    g.bitfields = function (status, d) {
        var res = [], st = parseInt(status);
        if (!st || typeof d !== 'object' || d === null) return res;
        for (var i = 0; i < d.length; i++) { if (st & Math.pow(2,i)) res.push(d[i]); }
        return res;
    };

    /**
     * @function uuid
     * Генерация Universally Unique Identifier 16-байтный (128-битный) номер
     *
     * @result { String }
     */
    g.uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16);
        });
    };

    /**
     * @function crc32
     * Cyclic redundancy check, CRC32
     *
     * @param { string } str
     * @returns { number }
     */
    g.crc32 = function(str) {
        var makeCRCHelper = g.makeCRCHelper || (g.makeCRCHelper = function(){
            var c;
            var makeCRCHelper = [];
            for(var n =0; n < 256; n++){
                c = n;
                for(var k =0; k < 8; k++){
                    c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                }
                makeCRCHelper[n] = c;
            }
            return makeCRCHelper;
        });

        var crc = 0 ^ (-1);

        for (var i = 0; i < str.length; i++ ) {
            crc = (crc >>> 8) ^ makeCRCHelper[(crc ^ str.charCodeAt(i)) & 0xFF];
        }

        return (crc ^ (-1)) >>> 0;
    };

    /**
     * @function base64
     * @param s { string | HTMLElement }
     * @return {string}
     */
    g.base64 = function(s) { return g.btoa(unescape(encodeURIComponent(s instanceof HTMLElement ? s.innerHTML : s))); };

    /**
     * @function base64_encode Encodes data with MIME base64
     * original by: Tyler Akins (http://rumkin.com)
     * improved by: Bayron Guevara
     *
     * @param data {string}
     * @return {string}
     */
    // g.base64_encode = function( data ) {
    //     var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    //     var o1, o2, o3, h1, h2, h3, h4, bits, i=0, enc='';
    //
    //     do { // pack three octets into four hexets
    //         o1 = data.charCodeAt(i++);
    //         o2 = data.charCodeAt(i++);
    //         o3 = data.charCodeAt(i++);
    //
    //         bits = o1<<16 | o2<<8 | o3;
    //
    //         h1 = bits>>18 & 0x3f;
    //         h2 = bits>>12 & 0x3f;
    //         h3 = bits>>6 & 0x3f;
    //         h4 = bits & 0x3f;
    //
    //         // use hexets to index into b64, and append result to encoded string
    //         enc += b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    //     } while (i < data.length);
    //
    //     switch( data.length % 3 ){
    //         case 1:
    //             enc = enc.slice(0, -2) + '==';
    //             break;
    //         case 2:
    //             enc = enc.slice(0, -1) + '=';
    //             break;
    //     }
    //
    //     return enc;
    // };

    JSON.serialize = function (o, opt, c) {
        if (o) {
            var cls, s;
            if( typeof o === 'string') {
                s = g[o]; cls = o + ':';
            } else {
                s = o;
                if (c) {
                    cls = typeof c === 'string' ? c + ':' : (c.constructor.name !== 'Object' ? c.constructor.name + ':' : '');
                } else {
                    cls = s.constructor.name !== 'Object' ? o.constructor.name + ':' : '';
                }
            }
            var src = cls + JSON.stringify(s).replace(/(^"|"$)/g, '');
            return parseInt(opt) && JSON.BASE64 ? base64(src) : src;
        }
        return null;
    };
    JSON.OBJECT = 1;
    JSON.BASE64 = 2;

    JSON.unserialize = function (s, opt, c) {
        var src = parseInt(opt) && JSON.BASE64 ? atob(s)  : s;
        var pair = src.match(/^(([a-zA-Z0-9_]+?):)*(.*)$/);
        var o = str2json(pair[3], null);
        if (!c) c = pair[2];
        if (o && c) return typeof c === 'string' ? Object(typeof g[c] === 'function' ? new g[c] : g[c], o) : c.merge(o);
        return o;
    }

    /**
     * mb_case_title
     *
     * @param s {string}
     * @returns {string|null}
     */
    g.mb_case_title = function(s) {
        return s.length ? s.replace(/(?:^\s*|\s+)(\S?)/g, function(a, b){ return a.slice(0, -1) + b.toUpperCase(); }) : null;
    };

    /**
     * @function datetimer
     *
     * @param dt { string | Date }
     * @param option { int }
     * @returns {array|string|null}
     */
    g.datetimer = function(dt, option){
        var opt = typeof option === 'undefined' ? datetimer.DATETIME: Number(option);
        if (!dt) return null;
        var d;
        if (typeof dt === 'string') {
            if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dt)) {
                d = new Date(dt.split('.').reverse().join('-'));
            } else { d = new Date(dt.replace(/\s/, 'T')) }
        } else { d = dt }
        if (opt & datetimer.COMPARE) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (opt & datetimer.RAW) return [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
        var day = ('0' + d.getDate()).slice(-2);
        var month = ('0' + (d.getMonth()+1)).slice(-2);
        var year = d.getFullYear();
        var date = opt & datetimer.DATE ? day + '.' + month+ "." + year : '';
        var hours = ('0' + d.getHours()).slice(-2)
        var minutes = ('0' + d.getMinutes()).slice(-2);
        var time = opt & datetimer.TIME ? hours + ":" + minutes : '';
        var sec = ('0' + d.getSeconds()).slice(-2);
        var second = opt & datetimer.SECOND ? '.' + sec : '';
        return bundler(date, time).join(' ') + second;
    };  datetimer.DATE = 1; datetimer.TIME = 2; datetimer.DATETIME = 3; datetimer.SECOND = 8;
    datetimer.RAW = 16; datetimer.COMPARE = 32;

    /**
     * @function localISOString
     *
     * @param dt {String}
     * @param Z {String}
     * @returns {string}
     */
    g.localISOString = function (dt, Z) {
        var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        return (new Date(Date.now(dt) - tzoffset)).toISOString().slice(0, -1) + (Z||'Z'); // + 'Z';
    };

    /**
     * @function utcISOString
     *
     * @param dt { String }
     * @param Z { String }
     * @returns { String }
     */
    g.utcISOString = function (dt, Z) {
        return (new Date(dt || Date.now())).toISOString().slice(0, -1) + (Z||'Z'); // + 'Z';
    };

    /**
     * @function import from CSV
     *
     * @param file { HTMLFormElement } type file
     * @param cb { function } callback function
     * @param d { string } divider
     *
     * UI Example:
     * <label class="btn btn-outline-secondary"><i class="fa fa-folder-open-o"></i>
     * <input type="file" id="CSVfile" name="CSVfile" accept="text/csv,.csv" hidden>
     * </label>
     */
    g.importFromCSV = function (file, cb, d) {
        // var tuple = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        var divider = re('/'+(d ? d : importFromCSV.DIVIDER)+'(?=(?:(?:[^"]*"){2})*[^"]*$)/');
        function parseFile2Array(csv) {
            var dataSet = [];
            csv.split(importFromCSV.LF).forEach(function(line) {
                if (line.trim()) {
                    var tuple = [];
                    line.split(divider).forEach(function(cell) { tuple.push(quoter(cell.replace(/^\"(.+)\"$/,"$1"), quoter.CODE_QOUTAS)); });
                    dataSet.push(tuple);
                }
            });
            return dataSet;
        }

        file.ui.on('change', function (e) {
            var reader = new FileReader();
            reader.onload = function (e) {
                return cb.call(this.file, parseFile2Array(g.ui.src(e).result)); //this is where the csv array will be
            };
            obj2array(file.files).forEach(function (f) { reader.file = f; reader.readAsText(f); });
        });
    };
    g.importFromCSV.EOL = /\n/; // End of line
    g.importFromCSV.CR = /\r/; // Carriage Return
    g.importFromCSV.LF = /\r?\n|\r/; // \n Unices incl. Linux; \r\n on WinDOS
    g.importFromCSV.DIVIDER = ',';

    /**
     * @function exportToCSV
     *
     * @param { String } filename
     * @param { Array | HTMLElement } data
     * @param { string } d
     */
    g.exportToCSV = function(filename, data, d) {
        var divider = d ? d : importFromCSV.DIVIDER;
        var src = re('/("|'+divider+'|\n)/', 'g');
        var offset = data.hasOwnProperty('rowNumber') ? 1 : 0;
        var processRow = function (row) {
            var finalVal = '';
            for (var j=offset, z=row.length; j<z; j++) {
                var innerValue = row[j] ? QueryParam(row[j], QueryParam.INTQOUTED) : '';
                if (row[j] instanceof Date) innerValue = row[j].toLocaleString();
                var result = innerValue.replace(/"/g, '""');
                if (result.search(src) >= 0) result = '"' + result + '"';
                if (j-offset) finalVal += divider;
                finalVal += result;
            }
            return finalVal + '\n';
        };

        var csvFile = '';
        if (data instanceof Array) {
            for (var i=0,l=data.length; i<l; i++) csvFile += processRow(data[i]);
        } else {
            for (var x=0,y=data.rows.length; x<y; x++) {
                csvFile += processRow(data.rows[x].cells);
            }
        }
        g.dwnBlob(csvFile, filename,'text/csv;base64;');
    };

    /**
     * @function exportHTML2Word
     *
     * @param { string | HTMLElement } ctx
     * @param { string } fileName
     */
    g.exportHTML2Word = function (ctx, fileName) {
        var header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><title>" +(fileName||'document.doc')+ "</title></head><body>";
        var footer = "</body></html>";
        var source = header+(ctx instanceof HTMLElement ? ctx.innerHTML : ctx)+footer;
        // var source = 'data:application/vnd.ms-word;charset=utf-8,' + base64(source);
        g.dwnBlob(source, (fileName||'document.doc'),'application/vnd.ms-word;base64;');
    };

    /**
     * @function exportHTML2Excel
     * @param ctx { string | HTMLElement }
     * @param fileName { string }
     * @param worksheet { string }
     */
    g.exportHTML2Excel = function(ctx, fileName, worksheet) {
        var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
            'xmlns="http://www.w3.org/TR/REC-html40"><head>' +
            '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
            '</head><body><table>{table}</table></body></html>';
        var c = { worksheet : worksheet || 'Worksheet', table : ctx instanceof HTMLElement ? ctx.innerHTML: ctx};
        var f = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }); }
        // var source = 'data:application/vnd.ms-excel;base64,' + base64(f(template, c));
        g.dwnBlob(f(template, c), (fileName||'export.xls'),'application/vnd.ms-excel;base64;');
    }

    /**
     * @Helper copy2prn
     * Подготавливает данные звёрнутые в шаблон к печати
     *
     * @param { String | HTMLElement } cntx - tpl script name | DOM element
     * @param { Object } data - for tpl
     */
    g.copy2prn = function ( cntx, data) {
        var print_layer = g.document.createElement('iframe');
        print_layer.name = 'print_layer';
        print_layer.src = 'printer';
        print_layer.style.display = 'none';
        g.document.body.appendChild(print_layer);

        var prn = cntx instanceof HTMLElement ? cntx.innerHTML : tpl(cntx,data||{});
        var frameDoc = (print_layer.contentWindow) ? print_layer.contentWindow : (print_layer.contentDocument.document) ? print_layer.contentDocument.document : print_layer.contentDocument;
        frameDoc.document.open();
        frameDoc.document.write(prn);
        frameDoc.document.close(); // necessary for IE >= 10

        setTimeout(function () {
            g.frames['print_layer'].focus();// necessary for IE >= 10*/
            g.frames['print_layer'].print();
            g.frames['print_layer'].close();
            g.document.body.removeChild(print_layer);
        }, 1);
    };

    /**
     * @function crypt
     *
     * @param { String } salt
     * @param { String } text
     */
    g.crypt = function (salt, text){
        var textToChars = function(text) { return text.split('').map(function (c) { return c.charCodeAt(0);})};
        var applySaltToChar = function (code) { return textToChars(salt).reduce(function (a, b){ return a ^ b; }, code);};
        var byteHex = function(n) { return ('00' + Number(n).toString(16)).substr(-3); };
        return text.split('').map(textToChars).map(applySaltToChar).map(byteHex).join('');
    };

    /**
     * @function decrypt
     *
     * @param { String } salt
     * @param { String } encoded
     */
    g.decrypt = function (salt, encoded) {
        var textToChars = function(text){ return text.split('').map(function (c) { return c.charCodeAt(0); }); };
        var applySaltToChar = function (code){ return textToChars(salt).reduce(function (a, b) { return a ^ b; }, code); };
        return encoded.match(/.{1,3}/g).map(function (hex){ return parseInt(hex, 16); })
            .map(applySaltToChar).map(function(charCode){ return String.fromCharCode(charCode)}).join('');
    };

    /**
     * Object extension
     * @function merge (...)
     *
     * Метод Object.assign() копирует из исходных объектов в целевой объект только перечисляемые и собственные
     * свойства. Он использует внутренний метод [[Get]] на исходных объектах и внутренний метод [[Set]] на целевом
     * объекте, так что он также вызывает геттеры и сеттеры. Именно поэтому он присваивает свойства вместо простого
     * копирования или определения новых свойств. Это поведение может сделать метод непригодным для вливания новых
     * свойств в прототип, если вливаемые исходные объекты содержат геттеры. Вместо него для копирования в прототипы
     * определений свойств, включая признак их перечисляемости, следует использовать методы
     * Object.getOwnPropertyDescriptor() и Object.defineProperty().
     * @returns {any | {}}
     */
    Object.defineProperty(Object.prototype, 'merge', {
        value: function() {
            var o = (typeof this === 'object' ? this : (typeof this === 'function' ? new this : {}));
            if (!arguments.length) return o;

            if (o instanceof Array) {
                obj2array(arguments).forEach( function(v, k, a) {
                    if (v instanceof Array) {
                        if (v.length) for(var i=0, l=v.length; i<l; i++) o.push(v[i] ? v[i] : null);
                    } else {
                        if (v) o.push(v)
                    }
                });
                return o;
            }

            if (typeof this === 'function' && o && o.__proto__.__proto__) o.__proto__.constructor = this;

            obj2array(arguments).forEach( function(v, k, a) {
                var x = (typeof v === 'object' ? v : (typeof v === 'function' ? new v : undefined));
                if (x) {
                    if (typeof v === 'function' && o.__proto__) o.__proto__.constructor = v;
                    //TODO: https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Operators/Object_initializer
                    // Object.create(x.prototype)
                    if (!o.__proto__) { o.prototype = Object.create(x.__proto__); }
                    else if (o.__proto__ && Object.getPrototypeOf(x) !== Object.prototype) {
                        o.merge(x.__proto__);
                        o.__proto__.constructor = x.__proto__.constructor;
                    }
                    Object.defineProperties(o, Object.getOwnPropertyNames(x).reduce(function (d, key) {
                        if (o.hasOwnProperty(key) && Object.getOwnPropertyDescriptor(o, key)['set']) {
                            o[key] = x[key];
                            d[key] = Object.getOwnPropertyDescriptor(o, key);
                        } else {
                            d[key] = Object.getOwnPropertyDescriptor(x, key);
                        }
                        return d;
                    }, {}));
                }
            });
            return o;
        },
        enumerable: false
    });

    /**
     * Object extension
     * @function createChild (...)
     *
     * @argument { Object } родитель
     * @argument { Object | Function (Class) | undefined } свойства и методы для объявления объекта
     * Диинамическое связывание объектов родитель - потомок, изменение раодителя изменяет наследуемы свойства потомков
     */
    Object.defineProperty(Object.prototype, 'createChild', {
        value: function() {
            if (!arguments.length || typeof arguments[0] !== 'object') return null;
            var $ = (typeof this === 'object' ? this : (typeof this === 'function' ? new this : {}));
            var owner = arguments[0];
            switch (typeof arguments[1]) {
                case 'function':
                    var fn = arguments[1];
                    $ = new fn;
                    if ($.__proto__) {
                        $.__proto__ = Object.merge($.__proto__, owner);
                        $.__proto__.constructor = fn;
                    } else  {
                        $.prototype = Object.merge(fn.prototype, owner);
                    }
                    break;
                case 'object':
                    $ = Object.merge(arguments[1]);
                case 'undefined':
                default:
                    if ($.__proto__) $.__proto__ = owner; else $.prototype = owner;
            }
            $['owner'] = owner;
            if (owner.hasOwnProperty('heirs')) {
                if (owner.heirs instanceof Array) {
                    owner.heirs.push($);
                } else {
                    owner.heirs[$.hasOwnProperty('childIndex') ? $.childIndex : Object.keys(owner.heirs).length] = $
                }
            } else {
                if ($.hasOwnProperty('childIndex')) {
                    owner.heirs = {}; owner.heirs[$.childIndex] = $;
                } else {
                    owner.heirs = []; owner.heirs.push($)
                }
            }
            return $;
        },
        enumerable: false
    });

    /**
     * String extension
     * hash of string
     * @returns { int } 32bit integer
     */
    Object.defineProperty(String.prototype, 'hash', {
        value: function() {
            var hash = 0, chr;
            for (var i = 0; i < this.length; i++) {
                chr = this.charCodeAt(i); hash = ((hash << 5) - hash) + chr; hash |= 0;
            }
            return hash;
        }
    });

    /**
     * @function bb (BlobBuilder)
     * Генерация Blob объекта
     *
     * @param { Object } blobParts содержимое файла
     * @param { Object } option параметры формирвания контейнера Blob mime-type etc
     * @returns {*}
     */
    g.bb = function(blobParts, option) {
    	var opt = Object.assign({type:'application/x-www-form-urlencoded'}, option);
        var BlobBuilder = ('MozBlobBuilder' in g ? g.MozBlobBuilder : ('WebKitBlobBuilder' in g ? g.WebKitBlobBuilder : g.BlobBuilder));
        if (BlobBuilder) {
        	var bb = new BlobBuilder();
			bb.append(blobParts);
		 	return bb.getBlob(opt.type);
		}
        return new Blob([blobParts], opt);
    };

    /**
     * @function dwnBlob
     *
     * @param { blobParts } src
     * @param { String } filename
     * @param { String } type
     * @returns {boolean}
     */
    g.dwnBlob = function (src, filename, type) {
        var blob = g.bb(src, type);

        if (typeof g.navigator.msSaveBlob !== 'undefined') {
            // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for
            // which they were created. These URLs will no longer resolve as the data backing the
            // URL has been freed."
            g.navigator.msSaveBlob(blob, filename);
        } else {
            var downloadUrl = g.URL.createObjectURL(blob);
            if (filename) {
                // use HTML5 a[download] attribute to specify filename
                var a = g.document.createElement('a');
                // safari doesn't support this yet
                if (typeof a.download === 'undefined') {
                    //g.location = downloadUrl;
                    g.open(downloadUrl);
                } else {
                    a.href = downloadUrl;
                    a.download = filename;
                    g.document.body.appendChild(a);
                    a.click();
                    setTimeout(function () { g.document.body.removeChild(a); }, 100); // cleanup
                }
            } else {
                //g.location = downloadUrl;
                g.open(downloadUrl, '_self');
            }
            setTimeout(function () { g.URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
        }
        return false;
    };

    /**
     * @function download
     *
     * @param { Element } button
     * @param { String } url
     * @param { Object } opt
     * @returns { XMLHttpRequest }
     */
    g.download = function(button, url, opt) {
        return xhr(Object.assign({responseType: 'arraybuffer', url: url,
            done: function(e, x) {
                var res = x.hasOwnProperty('action-status') ? str2json(decodeURIComponent(x['action-status']),{result:'ok'}) : {result:'ok'};
                if (res.result !== 'ok') {
                    if (button.disabled) setTimeout(function () { button.disabled = false; button.css.del('spinner'); }, 1500);
                    console.log(url+' donwload - OK');
                    return false;
                }

                try {
                    var filename = uuid();
                    if (opt && opt.hasOwnProperty('filename')) {
                        filename = decodeURIComponent(quoter(opt['filename'], quoter.SLASHES_QOUTAS).replace(/['"]/g, ''));
                    } else {
                        var disposition = this.getResponseHeader('Content-Disposition');
                        if (disposition && disposition.indexOf('attachment') !== -1) {
                            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                            var matches = filenameRegex.exec(disposition);
                            if (matches != null && matches[1]) filename = decodeURIComponent(quoter(matches[1],
                                quoter.SLASHES_QOUTAS).replace(/['"]/g, ''));
                        }
                    }

                    if (button.disabled) setTimeout(function () { button.disabled = false; button.css.del('spinner'); }, 1500);
                    return g.dwnBlob(this.response, filename, this.getResponseHeader('Content-Type'));
                } catch (e) {
                    if (button.disabled) setTimeout(function () { button.disabled = false; button.css.del('spinner'); }, 1500);
                    console.error('download Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
                }
            },
            fail: opt && opt.fail || function (e) {
                if (button.disabled) setTimeout(function () { button.disabled = false; button.css.del('spinner'); }, 1500);
                console.error('download Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
            }
        },opt));
    };

    /**
     * @function upload
     *
     * @param stream
     * @param url
     * @param opt
     */
    g.upload = function(stream, url, opt) {
        var file = stream.files[0];
        var done = opt.done; delete opt['done'];
        var fail = opt.fail; delete opt['fail'];
        var stop = opt.stop; delete opt['stop'];
        var dir = opt.dir || null; delete opt['dir'];

        if (!file) return console.warn('File not found!');

        var slice = function (file, start, end, type) {
            var slice = file.mozSlice ? file.mozSlice : file.webkitSlice ? file.webkitSlice : file.slice ? file.slice : function () { };
            return slice.bind(file)(start, end);
        };

        var size = file.size, filename = file.name;
        var sliceSize = opt.sliceSize||1024;
        var start = opt.start||0, end;
        var data, piece, xhr;

        var loop = function () {
            end = start + sliceSize;
            data = new FormData();
            if (size - end < 0) {
                end = size;
                if (opt.extra) data.append('payload', typeof opt.extra === 'string' ? opt.extra : ( opt.extra ? JSON.stringify(opt.extra) : null ));
            }

            piece = slice(file, start, end);
            data.append('dir', dir);
            data.append('filename', filename);
            data.append('size', size);
            data.append('start', start);
            data.append('end', end);
            data.append('file', piece);

            if (stop.call(this, xhr)) xhr = g.xhr(Object.assign({method: 'post', rs:{'Content-type': 'multipart/form-data', 'Hash': acl.user.hash},
                url: url,
                data: data,
                done: function (e, x) {
                    var res = str2json(this.responseText,{result: 'error', message: this.status + ': ' + HTTP_RESPONSE_CODE[this.status]});

                    if (res.result === 'ok') {
                        if (typeof opt.progress === 'function') { opt.progress.call(res,(Math.floor(res.end/size*1000)/10)); }
                        if (res.end < size) {
                            start += sliceSize;
                            setTimeout(loop, 1);
                        } else {
                            done.call(res);
                        }
                    } else {
                        fail.call(res);
                        // g.app.msg(res);
                    }
                    return false;
                },
                fail: function (e, x) {
                    if (typeof opt.fail === 'function') opt.fail.call(x,e);
                    console.error('::upload Error ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
                }
            }, opt));
        };
        if (size > 0) setTimeout(loop, 1);
    };

    /**
     * @function decoder
     * Возвращает объект (Хеш-таблица) параметров
     *
     * @param { String | window.location } search строка в формате url (Uniform Resource Locator)
     * @param { Regex } regex регулярное выражение, по умолчанию /[?&]([^=#]+)=([^&#]*)/
     *
     * @result { Object }
     */
    g.location.decoder = function(search, regex) {
        var re = regex || /[?&]([^=#]+)=([^&#]*)/g, p={}, m; // {}
        try {
            while (m = re.exec((search || g.location.search))) {
                if (m[1] && m[2]) p[decodeURIComponent(m[1])] = QueryParam(decodeURIComponent(m[2]), QueryParam.STRNULL);
            }
        } catch(e) { return null }
        return p;
    };

    /**
     * @function encoder
     * Возвращает строку вида ключ=значение разделёных &
     *
     * @param params { Object }  Хеш-таблица параметров
     * @param divider { string }
     *
     * @result { String }
     */
    g.location.encoder = function(params, divider) {
        if (params && typeof params === 'object')
            return String(Object.keys(params).map(function(e,i,a) {
            return encodeURIComponent(e) + '=' + encodeURIComponent(QueryParam(params[e], QueryParam.NULLSTR))
        }).join(divider || '&'));
        return params;
    };

    /**
     * @function update
     * Возвращает Url c обновёнными (если были) или добавленными параметрами
     *
     * @param { String | window.location } search строка в формате url (Uniform Resource Locator)
     * @param params {  object }  параметры в формате ключ-значения
     *
     * @result { String }
     */
    g.location.update = function(search, params) {
        var u = [], h = [], url = g.location.search, kv = params || {};
        if (typeof search === 'string' ) url = search; else kv = search;
        var p = g.location.decoder(url);
        for (var i in kv) { p[decodeURIComponent(i)] = QueryParam(decodeURIComponent(kv[i]), QueryParam.STRNULL); }
        var res = []; for (var a in p) { res.push(a + '=' + QueryParam(p[a],QueryParam.NULLSTR)); }
        if (res.length) {
            var prefix = url+'?', sufix = '';
            if (url.indexOf('?') > -1) { h = url.split('?'); if (h.length > 1) prefix = h[0] + '?'; }
            if (url.indexOf('#') > -1) { u = url.split('#'); if (u.length > 1) sufix = '#'+u[1]; }
            return prefix + res.join('&') + sufix;
        }
        return url;
    };

    /**
     * @function browser URL params
     *
     * @Example: location.search = location.update({tab:tabIndex});
     * location.protocol + '//' + location.host + location.pathname
     * @Example: urn.set(location.pathname + location.update({tab:tabIndex})).lsn();
     *
     * @param id { string }
     * @param def { * }
     * @returns {{}|*|null}
     */
    g.location.params = function (id, def) {
        if (typeof id === 'string') return g.location.decoder()[id] || def || null;
        return g.location.decoder();
    };

    /**
     * @function urn
     * URN - Unifrorm Resource Name (унифицированное имя ресурса)
     *
     * @method { function () } fr
     * @method { function ( Regex, function ) } add
     * @method { function ( Regex | function ) } rm
     * @method { function ( String ) } chk
     * @method { function () } lsn
     * @method { function ( String ) } set
     *
     * @result { Object }
     */
    function urn(r){
        var isHistory = !!(history.pushState) ? 1 : 0;
        var root = r;
        return {
            root:root, rt:[], itv:0, base:isHistory ? location.pathname+location.search:'',
            referrer:root,
            handled: {hendler:null, hash:(location.pathname+location.search).hash()},
            clr: function(path) { return path.toString().replace(/\/$/, '').replace(/^\//, ''); },
            fr: isHistory ?
                function(){
                    return this.root + this.clr(decodeURI(location.pathname + location.search)).replace(/\?(.*)$/, '');
                }:
                function(){
                    var m = location.href.match(/#(.*)$/); return this.root + (m ? this.clr(m[1]) : '');
                },
            add: function(re, handler) {
                if (typeof re === 'function') { handler = re; re = ''; }
                this.rt.push({ re: re, handler: handler});
                this.rt = this.rt.sort(function(a, b) {
                    if (a.re.toString().length < b.re.toString().length) return 1;
                    if (a.re.toString().length > b.re.toString().length) return -1;
                    return 0;
                });
                return this;
            },
            rm: function(handler) {
                for(var i in this.rt) if (this.rt[i].handler === handler) { this.rt.splice(i, 1); break; }
                return this;
            },
            chk: function() {
                for(var i in this.rt) if (this.fr().match(this.rt[i].re)) {
                    this.handled = {handler: this.rt[i].handler, hash:(location.pathname+location.search).hash()};
                    if (this.rt[i].handler) {
                        this.rt[i].handler(location.pathname, location.search, true);
                    } else {
                        console.warn('Handler not exist ['+this.fr()+']')
                    }
                    return this;
                }
                return this;
            },
            lsn: function() {
                var s = this, c = s.fr(), fn = function() { if(c !== s.fr()) { c = s.fr(); s.chk(c); } return s; };
                clearInterval(s.itv); s.itv = setInterval(fn, 30);
                return s;
            },
            set: isHistory ?
                function(path) {
                    this.referrer = location.pathname+location.search;
                    history.pushState(null, null, this.root + this.clr(path || ''));
                    return this;
                }:
                function(path) {
                    this.referrer = location.pathname+location.search;
                    location.href = location.href.replace(/#(.*)$/, '') + '#' + (path || '');
                    return this;
                }
        }
    }; g.urn = urn('/');

    /**
     * @function func
     * - Создание фкнкции из строки
     * - Создание фкнкции из строки, передача параметров в функцию и получение результата
     * - или выполнение кода из строки в контексте
     *
     * @param str { string } Текстовая строка содержащая определение функцц или содержащий JS код
     * @param context { Object } Контекст в котором будет выполнен код
     * @param args { [] }Аргументы функци
     * @returns {*}
     */
    g.func = function (str, context, args) {
        if (typeof str !== 'string') return console.error("func src is't a string type!\n", str);
        try {
            var s = str.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/|\/\/[^\r\n]*/igm,'');
            switch ( true ) {
                case /^\s*function.*[}|;]*$/im.test(s) :
                    var fn = new Function(args||[], 'var f='+s+'; return f.apply(this, arguments)');
                    return context ? fn.bind(context) : fn;
                default:
                    return function(){ return eval(quoter(s, quoter.QOUTAS_CODE));}.apply(context||g, args||[]);
            }
        } catch( e ) {
            return console.error('func ', e.message + "\n", s );
        }
    };

    /**
     * @function js
     * Динамическая загрузка javascript
     *
     * @param src { string }  источник
     * @param params { Object } container, async, type, onload, onreadystatechange  параметры созадваемого скрипта
     *
     * 1. var head = g.document.getElementsByTagName("head");
     *    head[0].appendChild(s); // записываем в <head></head>
     * 2. g.document.body.appendChild(s); // записываем в <body></body>
     */
    g.js = function(src, params) {
        if (!src) return null;

        var opt = Object.assign({async:false, type:'text/javascript', container:g.document.body}, params);
        var s = g.document.createElement('script');
        s.type = opt.type;
        s.async = opt.async; // дождаться заргрузки или нет
        if (opt.hasOwnProperty('id')) s.id = opt.id;
        if (src.match(is_url)) { s.src = src; } else { s.text = src; }
        if (typeof opt.onload === 'function') s.onload = onload;
        if (typeof opt.onreadystatechange === 'function') s.onreadystatechange = onreadystatechange;

        if (typeof opt.container.appendChild === 'function') opt.container.appendChild(s);
        else console.error('jsRoll::js() Не существущий контейнер', opt.container);
        return s;
    };

    var xmlHttpRequest = ('XMLHttpRequest' in g ? g.XMLHttpRequest : ('ActiveXObject' in g ? g.ActiveXObject('Microsoft.XMLHTTP') : g.XDomainRequest));

    /**
     * @function xhr
     * Хелпер запросов на основе xmlHttpRequest
     *
     * @argument { String } url (Uniform Resource Locator) путь до шаблона
     * @argument { Boolean } async режим XMLHttpRequest
     * @event { XMLHttpRequest } onload
     * @event { XMLHttpRequest } ontimeout
     * @event { XMLHttpRequest } onreadystatechange
     * @function { XMLHttpRequest } done
     * @function { XMLHttpRequest } fail
     * @function { XMLHttpRequest } process
     * @function { XMLHttpRequest } break
     * @function { XMLHttpRequest } abort
     *
     * @result { Object }
     */
    g.xhr = function(params) {
        if (!navigator.onLine && params && !!params.local) {
            if (typeof params.cancel === 'function') params.cancel({srcElement:this, status:10});
            if (typeof params.after === 'function') params.after({srcElement:this, status:10}, g.xhr.CANCEL);
            return null;
        }
        var x = new xmlHttpRequest();
        Object.defineProperty(x, 'responseJSON', {
            __proto__: null,
            get: function responseJSON() {
                return str2json(this.responseText,{result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[parseInt(this.status)]});
            }
        });

        if (params && params.hasOwnProperty('responseType')) x.responseType = params['responseType'];
        // x.responseType = 'arraybuffer'; // 'text', 'arraybuffer', 'blob' или 'document' (по умолчанию 'text').
        // x.response - После выполнения удачного запроса свойство response будет содержать запрошенные данные в формате
        // DOMString, ArrayBuffer, Blob или Document в соответствии с responseType.
        // g.location.pathname; g.location.href;
        var d = {srcElement:x, withCredentials:true, async:true, username:null, password:null, method:'GET', url:g.location.pathname, timeout:10000, cache:false};
        var opt = Object.assign(d, params);
        var rs = Object.assign({'Xhr-Version': version,'Content-type':'application/x-www-form-urlencoded'}, (params || {}).rs);
        if (rs['Content-type'] === false || rs['Content-type'].toLowerCase() === 'multipart/form-data') delete rs['Content-type'];

        var cancel = function(e) {
            x.abort();
            g.removeEventListener('offline', cancel);
            if ((typeof opt.cancel === 'function')) opt.cancel(e);
            if (typeof opt.after === 'function') opt.after(e, g.xhr.CANCEL);
        };
        var fail = function(e) {
            x.abort();
            g.removeEventListener('offline', cancel);
            if (typeof opt.fail === 'function') opt.fail(e);
            if (typeof opt.after === 'function') opt.after(e, g.xhr.FAIL);
        };
        var done = function(e) {
            g.removeEventListener('offline', cancel);
            if (typeof opt.done === 'function') opt.done(e);
            if (typeof opt.after === 'function') opt.after(e, g.xhr.DONE);
        };

        try {
            if (typeof opt.data === 'object') opt.data = g.location.encoder(opt.data);
            if ( (['GET','DELETE'].indexOf(opt.method) >-1 ) && opt.data) {
                opt.url += (opt.url.indexOf('?') >-1 ? '&':'?') + opt.data;
                opt.data = null
            }

            if ( (typeof opt.before === 'function') ? [undefined,true].indexOf(opt.before()) >-1 : true ) {
                x.open(opt.method.toUpperCase(), opt.url, opt.async, opt.username, opt.password);
                x.withCredentials = opt.withCredentials;
                if (x.withCredentials) x.setRequestHeader('cookies', document.cookie);
                for (var m in rs) x.setRequestHeader(m, rs[m]);
                g.addEventListener('offline', cancel);
                x.timeout = opt.timeout; x.ontimeout = cancel; x.onerror = fail; x.onload = done;
                x.onreadystatechange = (typeof opt.process === 'function') ? opt.process :
                    function(e) { return (x.readyState === g.xhr.DONE && x.status >= 400) ? fail(e) : false };
                x.send(opt.data);
            } else {
                cancel({srcElement:x, status:400});
            }
        } catch (e) {
            fail(e);
        }
        return x;
    };
    g.xhr.UNSENT = 0; // исходное состояние
    g.xhr.OPENED = 1; // вызван метод open
    g.xhr.HEADERS_RECEIVED = 2; // получены заголовки ответа
    g.xhr.LOADING = 3; // ответ в процессе передачи (данные частично получены)
    g.xhr.DONE = 4; // запрос завершён
    g.xhr.FAIL = 5; // запрос завершён аварийно
    g.xhr.CANCEL = 6; // запрос отменён

    /**
     * @function tpl
     * Хелпер для генерации контескта
     *
     * @param { string } str (url | DOM id) xtemplate
     * @param { object | function } data объект с даннными или функуия возравщающая объкт с данными
     * @param { closure | Element } cb callback функция, Element контейнер для кода из шаблона
     * @param { object } opt дополнительые методы и своийства
     *
     * @result { String }
     */
    g.tpl = function tpl( str, data, cb, opt ) {
        var ctx = this, args = arguments; var arg = args[1] || [], pig = {before: null, after:null};
        var fn, $ = {
            src: null, context: ctx, attr: null, caching: false, str: str, data: arg, cb: cb, processing: false, timer: null,
            wait: function(after, args, index) {
                var $ = this, tpl = index && $.tpl instanceof Array ? $.tpl[index] : $.tpl;
                if ($.processing) { $.timer = setTimeout(function () { $.wait(after, args, index); }, 5); return $ }
                else if (typeof after == 'function') { after.apply(tpl, args); }
                else if (after && (typeof (fn = func(after, tpl, args)) === 'function')) { fn.apply($.tpl, args) }
                return $;
            },
            response_header: null,
            __tpl__: undefined,
            get tpl() {
                if (this.__tpl__) this.__tpl__.owner = $;
                return this.__tpl__;
            },
            set tpl(v) {
                this.__tpl__ = v;
            },
            onTplError: function (type, id, str, args, e ) {
                var msg = e && typeof е === 'object' ? e.message : String(e);
                return console.error('tpl type=['+type+']', [id, str], args,  msg + "\n");
            }
        };

        var compile = function( str ) {
                var f = '$'+uuid().replace(/-/g,'');
                var source = str.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/|\/\/[^\r\n]*|\<![\-\-\s\w\>\/]*\>/igm,'').replace(/\>\s+\</g,'><').trim(),tag = ['{%','%}'];
                if (!source.match(/{%(.*?)%}/g) && source.match(/<%(.*?)%>/g)) tag = ['<%','%>'];
                // source = source.replace(/"(?=[^<%]*%>)/g,'&quot;').replace(/'(?=[^<%]*%>)/g,'&#39;');
                return source.length ? new Function(f,"var p=[], print=function(){ p.push.apply(p,arguments); }; with("+f+"){p.push('"+
                source.replace(/[\r\t\n]/g," ").split(tag[0]).join("\t").replace(re("/((^|"+tag[1]+")[^\t]*)'/g"),"$1\r").replace(re("/\t=(.*?)"+tag[1]+"/g"),"',$1,'")
                .split("\t").join("');").split(tag[1]).join("p.push('").split("\r").join("\\'")+"');} return p.join('');") : undefined;
            },
            build = function( str, id, cache ) {
                var isId = typeof id !== 'undefined', pattern = null, dom = null;
                try {
                    if (pig.before && (typeof (fn = func(pig.before, $)) === 'function')) {
                        fn.apply($, args);
                    }
                    if (opt && typeof opt.before === 'object') {
                        arg.merge(opt.before);
                    } else if (opt && typeof opt.before === 'function') {
                        opt.before($, args);
                    }

                    if ( cache ) {
                        pattern = func(cache);
                    } else {
                        pattern = compile(str);
                        if (isId && $.caching) g.sessionStorage.setItem(id, pattern.toString());
                    }

                    if (!pattern) { return $.onTplError('tpl-pattern', id, str, args, 'пустой шаблон'); }

                    var a, awaiting = function () {
                        if ($.processing) { $.timer = setTimeout(awaiting, 50); return; }

                        if ( !(cb instanceof Array) ) {
                            a = typeof arg === 'function' ? arg.apply($, args) : arg;
                            if (data !== false) $.html = pattern.call($, a);
                        }

                        var after = opt && typeof opt.after == 'function' ? opt.after : null;

                        if (typeof cb === 'function') { $.tpl = cb.call(dom = ui.dom($.html,'html/dom'), $); }
                        else if (cb instanceof HTMLElement && ($.tpl = cb)) {
                            $.tpl.innerHTML = $.html;
                        } else if ( cb instanceof Array ) {
                            $.tpl = cb;
                            $.tpl.forEach(function (v,i,t) {
                                a = typeof arg === 'function' ? arg.call($, v,i,t) : arg;
                                if (data !== false) v.innerHTML = pattern.call($, a);
                                if (pig.after && (typeof (fn = func(pig.after, v)) === 'function')) {
                                    $.wait(fn, a, i);
                                } else if (after) { $.wait(after, a, i); }
                            });
                            return $.tpl;
                        }

                        if (pig.after && (typeof (fn = func(pig.after, $.tpl, a)) === 'function')) {
                            $.wait(fn, a);
                        } else if (after) { $.wait(after, a); }
                        return dom || $.html;
                    };
                    return awaiting();
                } catch( e ) {
                    return $.onTplError('tpl-build', id, str, args, e);
                }
            };

        try {
            var cache;
            switch ( true ) {
                case str.match(is_url):
                    var id = 'uri' + str.hash();
                    $.caching = true;
                    if (cache = g.sessionStorage.getItem(id)) { return build(null, id, cache); }
                    // if (t = g.sessionStorage.getItem(id)) { return build(decodeURIComponent(t), id); }
                    var o = opt || {}; o.rs = Object.assign(opt.rs||{}, {'Content-type':'text/x-template'});
                    return $.src = g.xhr(Object.assign({ owner: $, url: str, async: (typeof cb === 'function'),
                        done: function(e) { return build(ui.src(e).responseText, id); },
                        fail: function(e) { return $.onTplError('tpl-xhr', id, str, args, e); }
                        }, o));
                case !/[^#*\w\-\.]/.test(str):
                    $.caching = true;
                    $.src = g.document.getElementById(str.replace(/^#/,''));
                    pig.before = $.src && $.src.getAttribute('before');
                    pig.after = $.src && $.src.getAttribute('after');
                    if (cache = g.sessionStorage.getItem(str)) { return build(null, str, cache); }
                    if (!$.src) { return $.onTplError('tpl #'+str+' not exist!'); }
                    return build( $.src.innerHTML, str );
                default:
                    return build( str );
            }
        } catch ( e ) { return $.onTplError('tpl', id, str, args, e) }
    };

    /**
     * @function dom
     * Создаёт объект DOM из string
     * application/xml возвращает Document, но не SVGDocument или HTMLDocument
     * image/svg+xml возвращает SVGDocument, который так же является экземпляром класса Document
     * text/xml, результирующий объект будет типа XMLDocument (#document->...) !+ xmlns="http://www.w3.org/1999/xhtml"
     * text/html возвращает  HTMLDocument (<html><body>...</body></html>, который так же является экземпляром класса Document
     *
     * @result { DOM | null }
     */
    var dom = function () {
        var p;
        try {
            if ( 'DOMParser' in g ) {
                p = new DOMParser();
                return function(d, mime) {
                    try {
                        return p.parseFromString( d, mime || 'text/xml' );
                    } catch (e) {
                        return null;
                    }
                };
            } else if ( 'ActiveXObject' in g ) {
                p = new ActiveXObject( 'Microsoft.XMLDOM' );
                p.async = 'false';
                return function(d, mime) {
                    try {
                        p.instance.loadXML(d);
                        return p;
                    } catch (e) {
                        return null;
                    }
                };
            }
            return null;
        } catch ( e ) {
            return undefined;
        }
    }; g.dom = dom();

}(window));