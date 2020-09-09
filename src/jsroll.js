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
          0: 'Request runtime error',
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

    /**
     * @function eventCode
     * Хелпер обработки кода нажатия на устройтвах ввода типа клавиатура.
     *
     * @argument Event e - событие
     * @result { Integer | String }
     */
    var eventCode = function (e) {
            if (g.InputEvent && (e instanceof InputEvent)) {
                return e.data;
            } else if (e instanceof Event) switch (true) {
                case e.key !== undefined:
                    return e.key;
                case e.keyIdentifier !== undefined:
                    return e.keyIdentifier;
                case e.keyCode !== undefined:
                    return e.keyCode;
                default:
                    return e.charCode;
            };
            return null;
        }; g.eventCode = eventCode;

    var xmlHttpRequest = ('XMLHttpRequest' in g ? g.XMLHttpRequest : ('ActiveXObject' in g ? g.ActiveXObject('Microsoft.XMLHTTP') : g.XDomainRequest));

    if (!('indexedDB' in g)) {
        g.indexedDB = g.mozIndexedDB || g.webkitIndexedDB || g.msIndexedDB || g.shimIndexedDB || null;
    }

    if (!('IDBTransaction' in g)) {
        g.IDBTransaction = g.webkitIDBTransaction || g.msIDBTransaction || null;
    }

    if (!('IDBKeyRange' in g)) {
        g.IDBKeyRange = g.webkitIDBKeyRange || g.msIDBKeyRange|| null;
    }

    /**
     * IndexedDBInterface
     * @param Object opt
     * @constructor
     */
    g.IndexedDBInterface = function(opt) {
        var self = this;

        try {
            Object.defineProperty(self, 'active', {
                __proto__: null,
                get: function active() {
                    return self.instance ? self.instance.readyState == 'done' : false;
                }
            });

            if (typeof opt === 'object') self.merge(opt);

            self.instance = g.indexedDB.open(self.name, self.version);

            // Create schema
            self.instance.onupgradeneeded = function(e) {
                return self.build(e.target.result);
            };
            // on reload, instance up!
            self.instance.onsuccess = function(e) {
                self.db = e.target.result;
                return self.success(self.db);
            };
            self.instance.onblocked = function (e) {
                return self.blocked(e);
            };
            // on Error
            self.instance.onerror = function (e) {
                return self.fail(e);
            }
        } catch (e) {
            self.fail(e);
        }
    }; g.IndexedDBInterface.prototype = {
        db: null,
        name: null,
        version: 1,
        schema: null,
        destroy: function () {
            var self = this;
            self.instance = null; // Дропнули всё
            self.populate = true; // Пересоздали хранилище
            var instance = g.indexedDB.deleteDatabase(self.name, self.version);
            instance.onsuccess = self.success;
            instance.onerror = self.fail;
            instance.onblocked = self.blocked;
        },
        success: function (e) {
            console.log(this.name+' database ver '+this.version+' successfully');
            return this;
        },
        fail: function (e) {
            console.error('Fail '+this.name+' database ver '+this.version, e.message);
            return this;
        },
        blocked:function (e) {
            console.warn('Couldn\'t operate '+self.name+'database ver '+this.version+' due to the operation being blocked');
            return this;
        },
        upgrade: function (e) {
            console.log(this.name+' DDLs database ver '+this.version+' successfully inits!');
            return this;
        },
        data2row: function (data, flag) {
            if (data && typeof data === 'object') {
                var p = function (o) {
                    var res = {}; for (var i in o) {
                        res[i] = QueryParam(o[i], typeof flag === 'undefined' ? QueryParam.STRNULL : flag);
                    }
                    return res;
                };
                if (data instanceof Array) { return data.map(function (v) { return p(v); }); }
                return p(data);
            }
            return data;
        },
        build: function (db) {
            var self = this;
            self.db = db || self.db;
            try {
                if (self.db.objectStoreNames.contains(self.name)) {
                    self.db.deleteObjectStore(self.name); // Удалили хранилище
                }
                self.db.createObjectStore(self.name);
                // Пересоздаём все дочерние сторажы
                if (self.heirs) self.heirs.map(function (v, i, a) { v.schema(db); });
                self.upgrade();
                return true;
            } catch (e) {
                self.fail(e);
                return false;
            }
        },
        close: function (db) {
            var self = this;
            self.db = db || self.db;
            try { self.db.close(); } catch (e) { self.fail(e); }
            return self;
        }
    };

    /**
     * Constant            Code    Situation
     * UNKNOWN_ERR          0        The transaction failed for reasons unrelated to the database itself and not covered by any other error code.
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
     * @param any v
     * @param Integer o
     * @returns {string|any}
     * @constructor
     */
    var QueryParam = function (v, o) {
        var opt = typeof o === 'undefined' ? QueryParam.NATIVE : Number(o);
        if (typeof v === 'undefined' || v === null) {
            return !(opt & QueryParam.NULLSTR) && opt & QueryParam.QOUTED |  QueryParam.STRNULL ? (opt & QueryParam.NULLSQL ? 'NULL' : null) : '';
        } else if (typeof v === 'object') {
            return opt & QueryParam.QOUTED ? "'" + JSON.stringify(v) + "'" : String(JSON.stringify(v));
        } else if (typeof v === 'string' && v === '') {
            return (opt & QueryParam.NULLSTR) ? '' : ((opt & QueryParam.STRNULL) ? (opt & QueryParam.NULLSQL ? 'NULL' : null) : '');
        }
        return /\d+/.test(v) && Number(v) == String(v) ? (opt & QueryParam.INTQOUTED ? String(v) : Number(v)) : (opt & QueryParam.QOUTED ? "'" + v + "'" : String(v));
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
     * @webSQL
     *
     * @param db
     * @param opt
     */
    var webSQL = function (db, opt) {
        if (typeof db !== 'object') throw "webSQL object not exist!";
        var self = this;
        if (typeof opt === 'object') self.merge(opt);
        this.db = db;
    };
    webSQL.prototype = {
        opt: QueryParam.STRNULL | QueryParam.INTQOUTED,
        changeVersion: function(currentVer, newVer, callback){
            try {
                return this.db.changeVersion(currentVer, newVer, callback);
            } catch (e) {
                this.fail(null, e);
            }
            return false;
        },
        get info() {
            return this.stmt("SELECT * FROM sqlite_master WHERE type='table' AND name NOT LIKE '__Webkit%';",[],
                function(tx, rs) {
                    var table, tablesNumber = rs.rows.length;
                    console.log('webSQL DB info:');
                    for (var i = 0; i < tablesNumber; i++) {
                        table = rs.rows.item(i);
                        if ( table.type == 'table') {
                            tx.executeSql( 'SELECT name, sql FROM sqlite_master WHERE name = ?', [table.name], function(t,r){
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
            return this.db.version;
        },
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
            else console.warn('webSQL query ['+sql+'] resultSet: ', result);
            return this.runnig = false;
        },
        cancel: function (tx) { /*tx.executeSql('ABORT', [], null, function () {return true; }); */}, //TODO:
        transaction: function (proc, fail) {
            var self = this;
            //  self.db.readTransaction(function (tx) {
            return self.db.transaction(
                function (tx) {
                    return self.proc(tx, proc);
                },
                function (error) {
                    return self.fail(self.running, error, fail);
                });
        },
        executeSql: function(tx, query, data, done, fail) {
            var self = this, multiQuery = typeof query !== 'string' ;
            try {
                return (multiQuery ? query : [query]).forEach( function(sql, i, a) {
                    return tx.executeSql( sql, (multiQuery ? data[i] : data),
                        function(tx, result) {
                            return self.done(tx, result, done, sql, i, a);
                        },
                        function(tx, error) {
                            return self.fail(tx, error, fail, sql, i, a);
                        });
                });
            } catch(e) {
                return self.fail(tx, e, fail);
            }
        },
        stmt: function (query, data, done, fail, bulk) {
            var self = this, d = typeof data === 'undefined' ? [] : (!!bulk ? data : [data]);
            return this.transaction(
                function (tx) {
                    var i = 0, count = d.length, ResultSet = [];
                    var next = function (tx, rs) {
                        if (i < count) {
                            if (typeof rs !== 'undefined' ) ResultSet[i] = rs;
                            self.executeSql(tx, query,  d[i++], next, fail)
                        } else {
                            return done.call(self, tx, count > 1 ? ResultSet : rs);
                        }
                    };
                    return next(tx);
                },
                fail
            );
        },
        grinder: function (o, fields, no_uppend) {
            var res = {}, self = this;
            if (fields instanceof Array && typeof o === 'object') fields.forEach(function (v) {
                if (o.hasOwnProperty(v) || !!no_uppend) res[v] = o.hasOwnProperty(v) ? QueryParam(o[v], self.opt) : null;
            });
            return res;
        },
        filtration: function(query, params) {
            var self = this, m = false;
            if (/:([^\s$%\),]*)/m.test(query)) {
                if (!Object.keys(params).length) throw 'webSQL::filter params not exist!';
                while (m = /:([^\s$%\),]*)/gm.exec(query)) {
                    if (params.hasOwnProperty(m[1])) {
                        query = query.replace(m[0], QueryParam(params[m[1]], self.opt));
                    } else {
                        throw 'webSQL::filter param (' + m[1] + ') not exist!';
                    }
                }
             }
            return query;
        },
        filter: function (query, params, done, fail) {
            return this.stmt(this.filtration(query, params), [], done, fail);
        },
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
        update: function (table, params, filter, done, fail) {
            var keys = [], where = [], self = this;
            if (typeof filter === 'string') {
                filter = this.filtration(filter, params);
            } else if (typeof filter === 'object') {
                if (filter instanceof Array) {
                    filter.forEach(function (v, i, a) {
                        keys.push(v);
                        where.push(QueryParam(params[v], self.opt));
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
     * @param webSQL db
     * @param Object opt
     * @returns {{cancel: (function(): boolean), filter: (function(*=, *=, *=): instansce), fail: fail, opt: {}, done: done, db: *}|void}
     */
    var dbf = function (db, opt) {
        if (!db) return console.warn('webSQL ' + opt.naeme + ' not exit!');
        return {
            opt: {},
            db: db,
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
                this.db.filter(query, params, this.done.bind(this), this.fail.bind(this));
                return this;
            }
        }
    }; g.dbf = dbf;

    g.URL = g.URL || g.webkitURL;
    g.requestFileSystem = g.requestFileSystem || g.webkitRequestFileSystem;

    var is_url = /^(?:https?:\/\/)?(?:(?:[\w]+\.)(?:\.?[\w]{2,})+)?([\/\w]+)(\.[\w]+)|^(?:\/[\w]+){1,}/i;

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
    var str2json = function (s, def) { try { var o = (typeof s === 'string' ? JSON.parse(s) : s||(typeof def === 'undefined' ? null : def)); } catch (e) { o = typeof def === 'undefined' ? null : def; }; return o; }; g.str2json = str2json;

    /**
     * @function obj2array
     * 
     * @param a
     * @returns {Array}
     */
    var obj2array = function (a) { return (a && typeof a === 'object') ? Array.prototype.slice.call(a) : []; }; g.obj2array = obj2array;

    /**
     * function kv2array
     *
     * @param Object o
     * @param String glue
     * @returns { Array }
     */
    var kv2array = function (o, glue) {
        return o && typeof o === 'object' ? Object.keys(o).map(function (v,i,a) {
            return v + ( glue ? glue : ' ' ) + o[v];
        }) : [];
    }; g.kv2array = kv2array;

    /**
     * @function coalesce
     * Return first not empty in the function arguments
     *
     * @returns {variant | null}
     */
    var coalesce = function() {
        for (var i in arguments) { if (typeof arguments[i] !== 'undefined' && arguments[i] !== null && arguments[i] !== '') return arguments[i] };
        return undefined;
    }; g.coalesce = coalesce;

    /**
     * @function quoter
     * Заменяет одинарные и двойные кавычки на Html коды и возрващает строку
     *
     * @param any v
     * @param Integer opt
     * @returns {string}
     */
    var quoter = function(v, opt) {
        var s = typeof v === 'string' ? v : ( v ? JSON.stringify(v) : null );
        if (s) {
            opt = typeof opt === 'undefined' ? quoter.CODE_QOUTAS : opt;
            if (opt & quoter.SLASHES_QOUTAS) s =  s.replace(/\\"/g, '"').replace(/\\'/g, "'");
            if (opt & quoter.CODE_QOUTAS) s =  s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return s;
        }
        return '';
    }; g.quoter = quoter;
    g.quoter.CODE_QOUTAS = 1;
    g.quoter.SLASHES_QOUTAS = 2;

    /**
     * @function bundler
     * Возращает массив не empty элементо массива
     *
     * @returns {*[]}
     */
    var bundler = function() {
        return obj2array(arguments).filter(function (v) { return (typeof v !== 'undefined' && v !== null && v !== ''); });
    }; g.bundler = bundler;

    /**
     * @function bitfields
     *
     * @param Array status
     * @param Integer d
     * @returns {Array}
     */
    var bitfields = function (status, d) {
        var res = [], st = parseInt(status);
        if (!st || typeof d !== 'object' || d === null) return res;
        for (var i=0; i < d.length; i++) { if (st & Math.pow(2,i)) res.push(d[i]); }
        return res;
    }; g.bitfields = bitfields;

    /**
     * @function uuid
     * Генерация Universally Unique Identifier 16-байтный (128-битный) номер
     *
     * @result { String }
     */
    var uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16);
        });
    }; g.uuid = uuid;

    /**
     * @function crc32
     * Cyclic redundancy check, CRC32
     *
     * @param string str
     * @returns {number}
     */
    var crc32 = function(str) {
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
    }; g.crc32 = crc32;

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
            if (!arguments.length) return null;

            var o = (typeof this === 'object' ? this : (typeof this === 'function' ? new this : null));
            if (typeof this === 'function' && o && o.__proto__.__proto__) o.__proto__.constructor = this;

            obj2array(arguments).forEach( function(v, k, a) {
                if (o === null) {
                    o = (typeof v === 'object' ? v : (typeof v === 'function' ? new v : null));
                    if (o && typeof v === 'function' && o.__proto__) o.__proto__.constructor = v;
                    return o;
                }
                var x = (typeof v === 'object' ? v : (typeof v === 'function' ? new v : null));
                if (x) {
                    if (typeof v === 'function' && x.__proto__) x.__proto__.constructor = v;
                    //TODO: https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Operators/Object_initializer
                    if (Object.getPrototypeOf(x) !== Object.prototype) Object.merge(o.__proto__, x.__proto__);
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
     * @function __parent__ (...)
     * @argument { Object } родитель
     * @argument { Object | Function (Class) | undefined } свойства и методы для объявления объекта
     * Диинамическое связывание объектов родитель - потомок, изменение раодителя изменяет наследуемы свойства потомков
     */
    Object.defineProperty(Object.prototype, '__parent__', {
        value: function() {
            if (!arguments.length || typeof arguments[0] !== 'object') return null;
            var self = (typeof this === 'object' ? this : (typeof this === 'function' ? new this : {}));
            var owner = arguments[0];
            switch (typeof arguments[1]) {
                case 'function':
                    var fn = arguments[1];
                    self = new fn;
                    if (self.__proto__) {
                        self.__proto__ = Object.merge(self.__proto__, owner);
                        self.__proto__.constructor = fn;
                    } else  {
                        self.prototype = Object.merge(fn.prototype, owner);
                    }
                    break;
                case 'object':
                    self = Object.merge(arguments[1]);
                case 'undefined':
                default:
                    if (self.__proto__) self.__proto__ = owner; else self.prototype = owner;
            }
            self['owner'] = owner;
            if (owner.hasOwnProperty('heirs')) {
                if (owner.heirs instanceof Array) {
                    owner.heirs.push(self);
                } else {
                    owner.heirs[self.hasOwnProperty('childIndex') ? self.childIndex : Object.keys(owner.heirs).length] = self
                }
            } else {
                if (self.hasOwnProperty('childIndex')) {
                    owner.heirs = {}; owner.heirs[self.childIndex] = self;
                } else {
                    owner.heirs = []; owner.heirs.push(self)
                }
            }

            return self;
        },
        enumerable: false
    });

    /**
     * String extension
     * hash of string
     * @returns { integer } 32bit integer
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
     * @param Object blobParts содержимое файла
     * @param Object option параметры формирвания контейнера Blob mime-type etc
     * @returns {*}
     */
    var bb = function(blobParts, option) {
    	var opt = Object.assign({type:'application/x-www-form-urlencoded'}, option);
        var BlobBuilder = ('MozBlobBuilder' in g ? g.MozBlobBuilder : ('WebKitBlobBuilder' in g ? g.WebKitBlobBuilder : g.BlobBuilder));
        if (BlobBuilder) {
        	var bb = new BlobBuilder();
			bb.append(blobParts);
		 	return bb.getBlob(opt.type);
		}
        return new Blob([blobParts], opt);
    }; g.bb = bb;

    /**
     * @function dwnBlob
     *
     * @param { blobParts } src
     * @param { String } filename
     * @param { String } type
     * @returns {boolean}
     */
    var dwnBlob = function (src, filename, type) {
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
    }; g.dwnBlob = dwnBlob;
    
    /**
     * @function func
     * - Создание фкнкции из строки
     * - Создание фкнкции из строки, передача параметров в функцию и получение результата
     * - или выполнение кода из строки в контексте
     *
     * @param str Текстовая строка содержащая определение функцц или содержащий JS код
     * @param self Контекст в котором будет выполнен код
     * @param args Аргументы функци
     * @returns {*}
     */
    var func = function (str, self, args) {
        if (typeof str !== 'string') return console.error("func src is't a string type!\n", str);
        try {
            var s = str.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/|\/\/[^\r\n]*/igm,'');
            switch ( true ) {
                case /^\s*function.*[}|;]*$/igm.test(s) :
                    var _e = '_e'+uuid().replace(/-/g,'');
                    var fn = new Function('var '+_e+'='+s+'; return ' + _e + '.apply(this, arguments)');
                    // if (typeof args !== 'undefined')  {
                    //     return fn.call(self || this || g, args);
                    // } else {
                    return fn;
                    // }
                    // var fn = new Function('return ' + s + '.apply(this, arguments)');
                    // if (typeof self !== 'undefined' && this != g)  {
                    //     return typeof fn === 'function' ? fn.call(self || this || g, args) : undefined;
                    // } else {
                    //     return fn;
                    // }
                    // return new Function('return ' + s + '.apply(this, arguments)');
                default:
                    // var fn = function (self, args) { try { return eval(s); } catch (e) {
                    //     return console.error( 'jsRoll.func(', str, self, args, ')', e.message + "\n" );
                    // } };
                    // return function (self, args) { return fn.call(self||g, args||arguments||[]); };
                    return function () { return eval(s); };
            }
        } catch( e ) {
            return console.error( 'func ', e.message + "\n", str );
        }
    }; g.func = func;

    /**
     * @function decoder
     * Возвращает объект (Хеш-таблица) параметров
     *
     * @argument { String | window.location } url строка в формате url (Uniform Resource Locator)
     * @argument RegExp регулярное выражение, по умолчанию /[?&]([^=#]+)=([^&#]*)/
     *
     * @result { Object }
     */
    var decoder = function(search, re) {
        var re=re || /[?&]([^=#]+)=([^&#]*)/g, p={}, m;
        try {
            while (m = re.exec((search || g.location.search))) {
                if (m[1] && m[2]) p[decodeURIComponent(m[1])] = QueryParam(decodeURIComponent(m[2]), QueryParam.STRNULL);
            }
        } catch(e) { return null }
        return p;
    }; g.location.decoder = decoder;

    /**
     * @function encoder
     * Возвращает строку вида ключ=значение разделёных &
     *
     * @argument { Object } Хеш-таблица параметров
     *
     * @result { String }
     */
    var encoder = function(params, divider) {
        if (params && typeof params === 'object')
            return String(Object.keys(params).map(function(e,i,a) {
            return encodeURIComponent(e) + '=' + encodeURIComponent(QueryParam(params[e], QueryParam.NULLSTR))
        }).join(divider || '&'));
        return params;
    }; g.location.encoder = encoder;

    /**
     * @function update
     * Возвращает Url c обновёнными (если были) или добавленными параметрами
     *
     * @argument { String | window.location } url строка в формате url (Uniform Resource Locator)
     * @argument { JSON object } параметры в формате ключ-значения
     *
     * @result { String }
     */
    var update = function(search, params) {
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
    }; g.location.update = update;

    /**
     * @function router
     * Хелпер Маршрутизатор SPA
     *
     * @method { function () } fr
     * @method { function ( Regex, Callback ) } add
     * @method { function ( Regex | Callback ) } rm
     * @method { function ( String ) } chk
     * @method { function () } lsn
     * @method { function ( String ) } set
     *
     * @result { Object }
     */
    function router(r){
        var isHistory = !!(history.pushState) ? 1 : 0;
        var root = r;
        return {
            root:root, rt:[], itv:0, base:isHistory ? g.location.pathname+g.location.search:'',
            referrer:root,
            clr: function(path) { return path.toString().replace(/\/$/, '').replace(/^\//, ''); },
            fr: isHistory ?
                function(){
                    return this.root + this.clr(decodeURI(g.location.pathname + g.location.search)).replace(/\?(.*)$/, '');
                }:
                function(){
                    var m = g.location.href.match(/#(.*)$/);
                    return this.root + (m ? this.clr(m[1]) : '');
                },
            add: function(re, handler) {
                if (typeof re == 'function') { handler = re; re = ''; }
                this.rt.push({ re: re, handler: handler});
                this.rt = this.rt.sort(function(a, b) {
                    if (a.re.toString().length < b.re.toString().length) return 1;
                    if (a.re.toString().length > b.re.toString().length) return -1;
                    return 0;
                });
                return this;
            },
            rm: function(param) {
                for(var i in this.rt) {
                    if(this.rt[i].handler === param || this.rt[i].re.toString() === param.toString()) {
                        this.rt.splice(i, 1);
                        return this;
                    }
                }
                return this;
            },
            chk: function(fr) {
                var f = fr || this.fr(), m = false;
                for(var i in this.rt) if (m = f.match(this.rt[i].re)) { this.rt[i].handler.call(m || {}, f); return this; }
                return this;
            },
            lsn: function() {
                var s = this, c = s.fr(), fn = function() { if(c !== s.fr()) { c = s.fr(); s.chk(c); } return s; };
                clearInterval(s.itv); s.itv = setInterval(fn, 50);
                return s;
            },
            set: isHistory ?
                function(path) {
                    this.referrer = g.location.pathname+g.location.search;
                    history.pushState(null, null, this.root + this.clr(path || ''));
                    return this;
                }:
                function(path) {
                    this.referrer = g.location.pathname+g.location.search;
                    window.location.href = g.location.href.replace(/#(.*)$/, '') + '#' + (path || '');
                    return this;
                }
        }
    }; g.router = router('/');

    /**
     * @function js
     * Динамическая загрузка javascript
     *
     * @argument { text | url } src источник
     * @argument { Object {container, async, type, onload, onreadystatechange} } opt параметры созадваемого скрипта
     *
     * 1. var head = g.document.getElementsByTagName("head");
     *    head[0].appendChild(s); // записываем в <head></head>
     * 2. g.document.body.appendChild(s); // записываем в <body></body>
     */
    function js(src, opt) {
        if (!src) return null;

        var opt = Object.assign({async:false, type:'text/javascript', container:g.document.body}, opt);
        var s = g.document.createElement('script');
        s.type = opt.type;
        s.async = opt.async; // дождаться заргрузки или нет
        if (opt.hasOwnProperty('id')) s.id = opt.id;
        if (src.match(is_url)) { s.src = src; } else { s.text = src; }
        if (typeof opt.onload === 'funciton') s.onload = onload;
        if (typeof opt.onreadystatechange === 'funciton') s.onreadystatechange = onreadystatechange;

        if (typeof opt.container.appendChild === 'function') opt.container.appendChild(s);
        else console.error('jsRoll::js() Не существущий контейнер', opt.container);
        return s;
    }; g.js = js;

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
    function xhr(params){
        var x = new xmlHttpRequest();
        if (!x) return null;

        x.fail = function(fn) {
            if (typeof fn === 'function') return fn.call(x, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
            return x;
        };

        x.done = function(fn) {
            if (typeof fn === 'function') return fn.call(x, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
            return x;
        };

        x.cancel = function(fn) {
            if (typeof fn === 'function') return fn.call(x, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
            return x;
        };

        x.process = function(opt) {
            g.addEventListener('offline', x.onerror);
            var proc = opt.process;
            x.onreadystatechange = function(e) {
                if (typeof proc === 'function') {
                    return proc.call(x, e, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
                } else if (x.readyState == 4 && x.status >= 400) {
                    g.removeEventListener('offline', x.onerror);
                    x.fail.call(x, e, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
                    if (typeof x.after == 'function') x.after.call(x, {status:parseInt(x.status)});
                }
                return x;
            };

            x.timeout = opt.timeout;
            x.ontimeout = function (e) {
                x.halt({status:408});
                return x;
            };
            return x;
        };

        x.halt = function(opt) {
            x.abort();
            g.removeEventListener('offline', x.onerror);
            x.cancel.call(x, opt, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
            if (typeof x.after == 'function') x.after.call(x, opt);
            return x;
        };

        x.onerror = function (e) {
            x.fail.call(x, e, {status:10});
            x.halt({status:500});
            return false;
        };

        x.onload = function(e) {
            x.done.call(x, e, location.decoder(x.getAllResponseHeaders(), /([^:\s+\r\n]+):\s+([^\r\n]*)/gm));
            if (typeof x.after == 'function') x.after.call(x, {status:parseInt(x.status)});
            g.removeEventListener('offline', x.onerror);
            return x;
        };

        if (params && params.hasOwnProperty('responseType')) x.responseType = params['responseType'];
        // x.responseType = 'arraybuffer'; // 'text', 'arraybuffer', 'blob' или 'document' (по умолчанию 'text').
        // x.response - После выполнения удачного запроса свойство response будет содержать запрошенные данные в формате
        // DOMString, ArrayBuffer, Blob или Document в соответствии с responseType.
        var opt = Object.assign({method:'GET',timeout:10000,cache:false}, params);
        x.method = opt.method.toUpperCase();
        var rs = Object.assign({'Xhr-Version': version,'Content-type':'application/x-www-form-urlencoded'}, (params||{}).rs);
        if (rs['Content-type'] === false || rs['Content-type'].toLowerCase() == 'multipart/form-data') delete rs['Content-type'];

        try {
            for (var i in opt) if (typeof opt[i] == 'function') x[i]=opt[i];
            if ((['GET', 'DELETE'].indexOf(x.method) >= 0) && opt.data) {
                var u = opt.url || g.location;
                opt.url = u + (u.indexOf('?') !=-1 ? '&':'?') + opt.data;
                opt.data = null;
            }
            if (typeof x.before == 'function') x.before.call(x, opt, x);

            x.open(x.method, opt.url || g.location, opt.async || true, opt.username, opt.password);
            for (var m in rs) x.setRequestHeader(m, rs[m]);
            x.response_header = null;
            x.process(opt).send(opt.data);
        } catch (e) {
            x.fail.call(x, e, {status:0});
            x.halt({status:0});
            return x;
        }

        return x;
    };  g.xhr = xhr;

    /**
     * @function InputHTMLElementSerialize
     * Сериализация элемента
     *
     * @param el
     * @returns {*}
     */
    var InputHTMLElementSerialize = function (el) {
        if (el instanceof HTMLElement)
            return el.name + '=' + (['checkbox','radio'].indexOf((el.getAttribute('type') || 'text').toLowerCase()) < 0 ? encodeURIComponent(QueryParam(el.value, QueryParam.NULLSTR)) : (el.checked ? (el.value.indexOf('on') == -1 ? el.value : 1) : (el.value.indexOf('on') == -1 ? '' : 0)));
        return null;
    }; g.InputHTMLElementSerialize = InputHTMLElementSerialize;

    /**
     * @function InputHTMLElementValue
     * Хэлпер получения HTML элемента
     *
     * @param el
     * @param def
     * @returns {*}
     */
    var InputHTMLElementValue = function(el) {
        var n = null;
        if (el instanceof HTMLElement) {
            switch ((el.getAttribute('type') || 'text').toLowerCase()) {
                case 'checkbox': case'radio':
                    n = el.checked ? ((el.value.indexOf('on') == -1 ? n : 1)) :
                        (el.value.indexOf('on') == -1 ? (typeof def !== 'undefined' ? def: null) : 0);
                    break;
                case 'number':
                    n = QueryParam(el.value, QueryParam.NULLSTR);
                    break;
                // case 'date': case 'time': case 'datetime-local': case 'month': case 'week':
                // case 'color': case 'range': case 'search':
                // case 'email': case 'tel': case 'url'
                //
                // case 'text': case 'textarea': case 'hidden':
                default:
                    n = String(encodeURIComponent(e.value));
            }
        }
        return n;
    }; g.InputHTMLElementValue = InputHTMLElementValue;

    /**
     * @function setValueInputHTMLElement
     *
     * @param el
     * @param value
     */
    var setValueInputHTMLElement = function(el, value) {
        switch ( (el.getAttribute('type') || 'text').toLowerCase() ) {
            case 'checkbox': case 'radio':
                el.checked = el.value === 'on' ? !!value : String(el.value) == String(value);
                break;
            case 'number':
                el.value = QueryParam(decodeURIComponent(value), QueryParam.NULLSTR);
                break;
            case 'text': case 'textarea': case 'hidden':
                el.value = String(decodeURIComponent(value));
                break;
            case 'date': case 'time': case 'datetime-local': case 'month': case 'week':
            case 'color': case 'range': case 'search':
            case 'email': case 'tel': case 'url':
            default: el.value = String(value);
        }
    }; g.setValueInputHTMLElement = setValueInputHTMLElement;


    /**
     * @property form
     * Хелпер работы с данными формы
     *
     * @param f DOM элемент форма + f.rolling = ['post','get','put','delete' ets]
     * @param params
     * @returns {result:Object, data: String}}
     */
    Object.defineProperty(JSON, 'form', {
        value: function(f) {
            if (f && !f.hasOwnProperty('MODEL')) {
                Object.defineProperty(f, 'MODEL', {
                    set: function MODEL(d) {
                        f.reset();
                        if (typeof d === 'object') {
                            var is_array, field, index, el, value, type;
                            for (var i = 0; i < f.elements.length; i++) {
                                field = null; index = null; el = f.elements[i];
                                type = (el.getAttribute('type') || 'text').toLowerCase();
                                if (type === 'button') { continue; }
                                if ( is_array = /\[.*\]$/.test(el.name) ) {
                                    field = el.name.replace(/\[.*\]$/,'');
                                    if ( !d.hasOwnProperty(field) ) { continue; }
                                    else { value = d[field]; }
                                    if ( index = /\[([^\]]+)\]/.exec(this.elements[i].name) ) {
                                        index = String(index[1]);
                                        if ( !d[field].hasOwnProperty(index) ) { continue; }
                                        else { value = d[field][index]; }
                                    }
                                } else {
                                    field = el.name || String(i);
                                    if ( !d.hasOwnProperty(field) ) { continue; }
                                    else { value = d[field]; }
                                }

                                switch ( type ) {
                                    case 'hidden':
                                    case 'text':
                                    case 'textarea':
                                        el.value = String(encodeURIComponent(value));
                                        break;
                                    case 'checkbox': case 'radio':
                                        if (is_array) {
                                            el.checked = el.value === 'on' ? !!value : str2json(value, []).indexOf(el.value) !== -1;
                                        } else {
                                            el.checked = el.value === 'on' ? !!value : String(el.value) == String(value);
                                        }
                                        break;
                                    case 'number':
                                        el.value = QueryParam(encodeURIComponent(value), QueryParam.NULLSTR);
                                        break;
                                    case 'color':
                                    case 'date':
                                    case 'datetime-local':
                                    case 'email':
                                    case 'month':
                                    case 'range':
                                    case 'search':
                                    case 'tel':
                                    case 'time':
                                    case 'url':
                                    case 'week':
                                    default: el.value = String(value);
                                }
                            }
                        }
                    },
                    get: function MODEL() {
                        f.__MODEL__ = {}; var el, type;
                        for (var i=0; i < f.elements.length; i++) {
                            el = f.elements[i];
                            type = (el.getAttribute('type') || 'text').toLowerCase();
                            if (type === 'button') { continue; }
                            var field = el.name && /\[.*\]$/.test(el.name) ? el.name.replace(/\[.*\]$/,'') : (el.name || String(i));
                            var n = InputHTMLElementValue(el);
                            if ((typeof f.__MODEL__[field] === 'undefined') || (f.__MODEL__[field] === null)) {
                                f.__MODEL__[field] = n;
                            } else if (typeof f.__MODEL__[field] !== 'undefined' && n !== null) {
                                if (typeof f.__MODEL__[field] !== 'object') f.__MODEL__[field] = [f.__MODEL__[field]];
                                f.__MODEL__[field].push(n);
                            }
                        }

                        return f.__MODEL__;
                    }
                });

                f.is_valid = function() {
                    if (!f.validator || (typeof f.validator === 'function' && f.validator.call(f))) {
                        f.setAttribute('valid', 1);
                        return true;
                    }
                    f.setAttribute('valid', 0);
                    return false;
                };

                f.prepare = function(validator) {
                    var data = [];
                    if (!validator || (typeof validator === 'function' && validator.call(f, data))) {
                        for (var i = 0; i < f.elements.length; i++) { data.push(InputHTMLElementSerialize(f.elements[i])); }
                    } else {
                        f.setAttribute('valid', 0);
                    }
                    return data.join('&');
                };

                f.fail = typeof f.fail == 'function' ? f.fail : function (res) {
                    f.setAttribute('valid', 0);
                    var a = res.form||res.message;
                    if (a) for (var i = 0; i < this.elements.length; i++) {
                        if (a.hasOwnProperty(this.elements[i].name)) { this.elements[i].status = 'error'; }
                        else { this.elements[i].status = 'none'; }
                    }
                    return f;
                };

                f.send = function() {
                    var data = f.prepare(f.validator), before = true, args = arguments;
                    if (f.getAttribute('valid') != 0) {
                        if (typeof f.before === 'function') before = f.before();
                        if (before === undefined || !!before) {
                            var done = typeof args[0] == 'function' ? function(e, hr) {
                                    f.response_header = hr||{};
                                    var callback = args.shift();
                                    callback.apply(this, args);
                                    return f;
                                } :
                                function(e, hr) {
                                    f.response_header = hr||{};
                                    f.response = str2json(this.responseText) || {result:'error', message:  this.status + ': ' + HTTP_RESPONSE_CODE[this.status]};

                                    if (f.response.result == 'error' ) {
                                        if (typeof f.fail == 'function') f.fail.call(f, f.response, hr, args);
                                    } else {
                                        if (typeof f.done == 'function') f.done.call(f, f.response, hr, args);
                                    }
                                    return f;
                                };
                            var after = (typeof f.after === 'function') ? f.after.bind(f) : undefined;
                            f.response = {result: undefined};
                            g.xhr(Object.assign({method: f.rest, url: f.action, data: data, done: done, after: after, fail: function (e, hr) {
                                    console.error('JSON.form['+f.name+']: ' + this.status + ': '+ HTTP_RESPONSE_CODE[this.status], this);
                                }}, f.opt));
                        }
                    } else f.setAttribute('valid',1);
                    return f;
                };
            }
            f.setAttribute('valid', 1);
            f.rest = f.getAttribute('rest') || f.method;
            f.validator = f.validator || null;
            f.opt = f.opt || {};

            return f;
        },
        enumerable: false
    });

    /**
     * @function tmpl
     * Хелпер для генерации контескта
     *
     * @argument { String } str (url | html)
     * @argument { JSON } data объект с даннными
     * @argument { undefined | function } cb callback функция
     * @argument { undefined | object } дополнительые методы и своийства
     *
     * @result { String }
     */
    var tmpl = function tmpl( str, data, cb, opt ) {
        var args = arguments; args[1] = args[1] || {};
        var fn, self =  {
            cached: false,
            str: str,
            data: data,
            cb: cb,
            opt: opt,
            processing: false,
            timer: null,
            wait: function(after, args) {
                var item = this, self = this;
                if (item.processing) { item.timer = setTimeout(function () { item.wait(after, args); }, 50); return self; }
                else if (typeof after == 'function') { after.apply(item.tmplContext, args); }
                else if (after && (typeof (fn = func(after, item.tmplContext, args)) === 'function')) { fn.apply(item.tmplContext, args); }
                return self;
            },
            response_header: null,
            __tmplContext: undefined,
            get tmplContext() {
                if (this.__tmplContext) this.__tmplContext.owner = self;
                return this.__tmplContext;
            },
            set tmplContext(v) {
                this.__tmplContext = v;
            },
            onTmplError: function (type, id, str, args, e ) {
                var msg = e && typeof е === 'object' ? e.message : String(e);
                return console.error('tmpl type=['+type+']', [id, str], args,  msg + "\n");
            }
        };

        var compile = function( str ) {
            var _e = '_e'+uuid().replace(/-/g,''), source = str.replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/|\/\/[^\r\n]*|\<![\-\-\s\w\>\/]*\>/igm,'').replace(/\>\s+\</g,'><').trim(),tag = ['{%','%}'];
            if (!source.match(/{%(.*?)%}/g) && source.match(/<%(.*?)%>/g)) tag = ['<%','%>'];
            // source = source.replace(/"(?=[^<%]*%>)/g,'&quot;').replace(/'(?=[^<%]*%>)/g,'&#39;');
            return source.length ? new Function(_e,"var p=[], print=function(){ p.push.apply(p,arguments); }; with("+_e+"){p.push('"+
                   source.replace(/[\r\t\n]/g," ").split(tag[0]).join("\t").replace(re("/((^|"+tag[1]+")[^\t]*)'/g"),"$1\r").replace(re("/\t=(.*?)"+tag[1]+"/g"),"',$1,'")
                   .split("\t").join("');").split(tag[1]).join("p.push('").split("\r").join("\\'")+"');} return p.join('');") : undefined;
            },
            build = function( str, id ) {
                var isId = typeof id !== 'undefined', data = {}, pattern = null;
                var result = null, after, before, a, pig = g.document.getElementById(id);

                try {
                    if (pig) {
                        var nn = undefined;
                        Array.prototype.slice.call(pig.attributes).forEach(function (i) {
                            if ( i && /^tmpl-*/i.test(i.nodeName.toString()) && (nn=i.nodeName.toString().replace(/^tmpl-/i, '')) )
                                try {
                                    data[nn] = JSON.parse(i.value); //JSON.parse(i.nodeValue);
                                } catch (e) {
                                    data[nn] = i.value;
                                }
                        });
                        if ((a = pig.getAttribute('arguments'))) try {
                            data = Object.merge(JSON.parse(a) || {}, data);
                        } catch (e) {
                            return self.onTmplError('tmpl-arguments', id, str, args,a);
                        }

                        // args[1] = Object.merge(args[1], data);
                        args[1].merge(data);
                        // if (before = pig.getAttribute('before')) func(before, self, args);
                        if (pig.getAttribute('before') && (typeof (fn = func(pig.getAttribute('before'), self, args)) === 'function')) { fn.apply(self, args); }
                    } else {
                        if (opt && typeof opt.before == 'object') {
                            // args[1] = Object.assign(args[1], opt.before);
                            args[1].merge(opt.before);
                        } else if (opt && typeof opt.before == 'function') {
                            opt.before.call(self, args);
                        }
                    }

                    if (isId && g.tmpl.cache.hasOwnProperty(id)) {
                        pattern = g.tmpl.cache[id];
                    } else {
                        pattern = compile(str);
                        if (isId) { g.tmpl.cache[id] = pattern; if (self.cached) g.localStorage.setItem(id, encodeURIComponent(str)); }
                    }

                    if (!pattern) { return self.onTmplError('tmpl-pattern', id, str, args, 'пустой шаблон'); }

                    var awaiting = function (self) {
                        if (self.processing) { self.timer = setTimeout(function () { awaiting(self); }, 50); return; }

                        result = pattern.call(self, args[1]);

                        if (typeof cb == 'function') { self.tmplContext = cb.call(self, result) || g.tmpl; }
                        else if (self.tmplContext instanceof HTMLElement || cb instanceof HTMLElement && (self.tmplContext = cb)) { self.tmplContext.innerHTML = result; }

                        if (self.tmplContext && pig && (after = pig.getAttribute('after'))) { self.wait(after, args); }
                        else if (opt && typeof opt.after == 'function') self.wait(opt.after, args);
                        return result;
                    };
                    return awaiting(self);
                } catch( e ) {
                    return self.onTmplError('tmpl-build', id, str, args, e);
                }
                return result;
            };

        try {
            var t;
            switch ( true ) {
                case str.match(is_url) ? true : false:
                    var id = 'uri' + str.hash();
                    if (g.tmpl.cache.hasOwnProperty(id)) { return build(null, id); }
                    var opt = opt || {}; opt.rs = Object.assign(opt.rs||{}, {'Content-type':'text/x-template'});
                    self.cached = opt.hasOwnProperty('cached') ? !!opt.cached : false;
                    if (self.cached && (t = g.localStorage.getItem(id))) { return build(decodeURIComponent(t), id); }
                    return g.xhr(Object.assign({ url: str, async: (typeof cb === 'function'),
                        done: function(e, hr) { self.response_header = hr; return build(this.responseText, id); },
                        fail: function(e, hr) { return self.onTmplError('tmpl-xhr', id, str, args, e); }
                        }, opt));
                case !/[^#*\w\-\.]/.test(str) ? true : false:
                    if (g.tmpl.cache.hasOwnProperty(str)) { return build(null, str); }
                    var tmp = g.document.getElementById(str.replace(/^#/,''));
                    if (!tmp) { return self.onTmplError('tmpl-byId '+str+' not exist!'); }
                    self.cached = !!tmp.getAttribute('cached');
                    if (self.cached && (t = g.localStorage.getItem(str))) { return build(decodeURIComponent(t), str); }
                    return build( tmp.innerHTML, str );
                default:
                    return build( str );
            }
        } catch ( e ) { return self.onTmplError('tmpl', id, str, args, e) }
    }; tmpl.cache = {}; g.tmpl = tmpl;

    /**
     * @function storage
     * Хелпер для работы window.localStorage
     * Fix for "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
     *
     * @argument { undefined | Object } s инстанс
     *
     * @result { Object }
     */
    var storage = function(s) {
        try {
            var s = s || g.localStorage;
            s.setItem('test', '1');
            s.removeItem('test');
        } catch (e) {
            return {
                p: [],
                setItem:function(key, value){
                    this.p.push(key);
                    this[key] = value;
                },
                getItem:function(key){
                    if (this.hasOwnProperty(key)) return this[key];
                    return null;
                },
                removeItem: function(key){
                    if (this.hasOwnProperty(key)){
                        delete this.p[key];
                        delete this[key];
                    }
                },
                clear:function(){
                    this.p.forEach(function(item){delete this[item];});
                    this.p = [];
                }
            };
        }
        return s;
    }; g.storage = storage();

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