'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (!global._babelPolyfill) {
    require("babel-polyfill");
}

var _ = require('lodash');
var Dynalite = require('dynalite');
var chokidar = require('graceful-chokidar');
var AWS = require('aws-sdk');

var DEFAULT_PORT = 4567;
var DEFAULT_REGION = 'localhost';
var DEFAULT_DIR = undefined;

var PORT_OPTIONS = {
    shortcut: 'p',
    usage: 'the port number that dynalite will listen on (default ' + DEFAULT_PORT + ')',
    required: false
};

var DIR_OPTIONS = {
    shortcut: 'd',
    usage: 'the directory dynalite will store its db file (default In-Memory)',
    required: false
};

var ServerlessDynalite = function () {
    function ServerlessDynalite(serverless, options) {
        _classCallCheck(this, ServerlessDynalite);

        this.serverless = serverless;
        this.service = serverless.service;

        this.log = serverless.cli.log.bind(serverless.cli);
        this.config = this.service.custom && this.service.custom.dynalite || {};
        this.options = options;

        this.commands = {
            dynalite: {
                commands: {
                    start: {
                        usage: 'start a persistent dynalite server',
                        lifecycleEvents: ['startHandler'],
                        options: {
                            port: PORT_OPTIONS,
                            dir: DIR_OPTIONS
                        }
                    },
                    watch: {
                        usage: 'start persistent dynalite server and watch for table definition changes',
                        lifecycleEvents: ['watchHandler'],
                        options: {
                            port: PORT_OPTIONS,
                            dir: DIR_OPTIONS
                        }
                    }
                }
            }
        };

        this.hooks = {
            "dynalite:start:startHandler": this.startHandler.bind(this),
            "dynalite:watch:watchHandler": this.watchHandler.bind(this),
            "before:offline:start:init": this.watchHandler.bind(this),
            "before:offline:start:end": this.endHandler.bind(this)
        };
    }

    _createClass(ServerlessDynalite, [{
        key: 'watchHandler',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                var _this = this;

                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this.startHandler();

                            case 2:

                                this.watcher = chokidar.watch('./serverless.yml', { persistent: true, interval: 1000 }).on('change', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                                    return regeneratorRuntime.wrap(function _callee$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    _this.log('serverless.yml changed, updating...');
                                                    _context.next = 3;
                                                    return _this.reloadService();

                                                case 3:
                                                    _this.updateTables();

                                                case 4:
                                                case 'end':
                                                    return _context.stop();
                                            }
                                        }
                                    }, _callee, _this);
                                })));

                                this.log('Listening for table additions / deletions.');

                            case 4:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function watchHandler() {
                return _ref.apply(this, arguments);
            }

            return watchHandler;
        }()
    }, {
        key: 'startHandler',
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                var _this2 = this;

                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                this.dynalite = Dynalite({ createTableMs: 0, path: this.dir });
                                _context3.next = 3;
                                return new Promise(function (res, rej) {
                                    return _this2.dynalite.listen(_this2.port, function (err) {
                                        return err ? rej(err) : res();
                                    });
                                });

                            case 3:

                                this.log('Dynalite listening on http://localhost:' + this.port);
                                return _context3.abrupt('return', this.updateTables());

                            case 5:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function startHandler() {
                return _ref3.apply(this, arguments);
            }

            return startHandler;
        }()
    }, {
        key: 'endHandler',
        value: function endHandler() {
            if (this.watcher) {
                this.watcher.close();
            }

            if (this.dynalite) {
                this.dynalite.close();
            }
        }
    }, {
        key: 'reloadService',
        value: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                var options;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                options = this.serverless.processedInput.options;
                                _context4.next = 3;
                                return this.service.load(options);

                            case 3:
                                _context4.next = 5;
                                return this.serverless.variables.populateService(options);

                            case 5:
                                _context4.next = 7;
                                return this.service.setFunctionNames(options);

                            case 7:
                                _context4.next = 9;
                                return this.service.mergeResourceArrays();

                            case 9:
                                _context4.next = 11;
                                return this.service.validate();

                            case 11:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function reloadService() {
                return _ref4.apply(this, arguments);
            }

            return reloadService;
        }()
    }, {
        key: 'updateTables',
        value: function () {
            var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
                var _this3 = this;

                var requiredTables, currentTables, missingTables;
                return regeneratorRuntime.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                requiredTables = _.map(_.filter(_.values(_.get(this.service, ['resources', 'Resources'], {})), { 'Type': 'AWS::DynamoDB::Table' }), 'Properties');

                                this.log('Tables in config: ' + JSON.stringify(_.map(requiredTables, 'TableName')));

                                _context7.next = 4;
                                return this.dynamodb.raw.listTables({}).promise();

                            case 4:
                                currentTables = _context7.sent;

                                this.log('Current Tables: ' + JSON.stringify(currentTables.TableNames));

                                missingTables = _.reject(requiredTables, function (_ref6) {
                                    var TableName = _ref6.TableName;
                                    return _.includes(currentTables.TableNames, TableName);
                                });

                                this.log('Missing Tables: ' + JSON.stringify(_.map(missingTables, 'TableName')));

                                _.forEach(missingTables, function () {
                                    var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(table) {
                                        return regeneratorRuntime.wrap(function _callee5$(_context5) {
                                            while (1) {
                                                switch (_context5.prev = _context5.next) {
                                                    case 0:
                                                        _this3.log('Creating table ' + table.TableName + '...');
                                                        _context5.next = 3;
                                                        return _this3.dynamodb.raw.createTable(table).promise();

                                                    case 3:
                                                    case 'end':
                                                        return _context5.stop();
                                                }
                                            }
                                        }, _callee5, _this3);
                                    }));

                                    return function (_x) {
                                        return _ref7.apply(this, arguments);
                                    };
                                }());

                                setTimeout(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
                                    var finalTables;
                                    return regeneratorRuntime.wrap(function _callee6$(_context6) {
                                        while (1) {
                                            switch (_context6.prev = _context6.next) {
                                                case 0:
                                                    _context6.next = 2;
                                                    return _this3.dynamodb.raw.listTables({}).promise();

                                                case 2:
                                                    finalTables = _context6.sent;

                                                    _this3.log('Current Tables: ' + JSON.stringify(finalTables.TableNames));

                                                case 4:
                                                case 'end':
                                                    return _context6.stop();
                                            }
                                        }
                                    }, _callee6, _this3);
                                })), 1000);

                            case 10:
                            case 'end':
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function updateTables() {
                return _ref5.apply(this, arguments);
            }

            return updateTables;
        }()
    }, {
        key: 'port',
        get: function get() {
            return _.get(this, ['config', 'start', 'port'], DEFAULT_PORT);
        }
    }, {
        key: 'dir',
        get: function get() {
            return _.get(this, ['config', 'start', 'dir'], DEFAULT_DIR);
        }
    }, {
        key: 'region',
        get: function get() {
            return _.get(this, ['config', 'start', 'region'], DEFAULT_REGION);
        }
    }, {
        key: 'dynamodb',
        get: function get() {

            if (this._dynamodb) {
                return this._dynamodb;
            }

            var dynamoOptions = {
                endpoint: 'http://localhost:' + this.port,
                region: this.region
            };

            this._dynamodb = {
                raw: new AWS.DynamoDB(dynamoOptions),
                doc: new AWS.DynamoDB.DocumentClient(dynamoOptions)
            };

            return this._dynamodb;
        }
    }]);

    return ServerlessDynalite;
}();

module.exports = ServerlessDynalite;