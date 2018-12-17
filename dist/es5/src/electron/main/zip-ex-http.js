"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var stream_1 = require("stream");
var zip_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zip");
var debug_ = require("debug");
var request = require("request");
var requestPromise = require("request-promise-native");
var debug = debug_("r2:testapp#electron/main/zip-ex-manifest-json");
var ZipExplodedHTTP = (function (_super) {
    tslib_1.__extends(ZipExplodedHTTP, _super);
    function ZipExplodedHTTP(dirPath) {
        var _this = _super.call(this) || this;
        _this.dirPath = dirPath;
        debug("ZipExplodedHTTP: " + dirPath);
        return _this;
    }
    ZipExplodedHTTP.loadPromise = function (dirPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2, Promise.resolve(new ZipExplodedHTTP(dirPath))];
            });
        });
    };
    ZipExplodedHTTP.prototype.freeDestroy = function () {
        debug("freeDestroy: ZipExplodedHTTP -- " + this.dirPath);
    };
    ZipExplodedHTTP.prototype.entriesCount = function () {
        return 0;
    };
    ZipExplodedHTTP.prototype.hasEntries = function () {
        return true;
    };
    ZipExplodedHTTP.prototype.hasEntry = function (_entryPath) {
        return true;
    };
    ZipExplodedHTTP.prototype.getEntries = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2, new Promise(function (_resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            reject("Not implemented.");
                            return [2];
                        });
                    }); })];
            });
        });
    };
    ZipExplodedHTTP.prototype.entryStreamPromise = function (entryPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                debug("entryStreamPromise: " + entryPath);
                if (!this.hasEntries() || !this.hasEntry(entryPath)) {
                    return [2, Promise.reject("no such path in zip exploded: " + entryPath)];
                }
                url = this.dirPath + "/" + entryPath;
                debug("URL: " + url);
                return [2, new Promise(function (topresolve, topreject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var failure, success, needsStreamingResponse, promise, err_1, response, err_2;
                        var _this = this;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    failure = function (err) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        return tslib_1.__generator(this, function (_a) {
                                            debug(err);
                                            topreject(err);
                                            return [2];
                                        });
                                    }); };
                                    success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var length, lengthStr, stream, streamAndLength;
                                        var _this = this;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    Object.keys(response.headers).forEach(function (header) {
                                                        debug(header + " => " + response.headers[header]);
                                                    });
                                                    if (!(response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) return [3, 2];
                                                    return [4, failure("HTTP CODE " + response.statusCode)];
                                                case 1:
                                                    _a.sent();
                                                    return [2];
                                                case 2:
                                                    length = 0;
                                                    lengthStr = response.headers["content-length"];
                                                    if (lengthStr) {
                                                        length = parseInt(lengthStr, 10);
                                                    }
                                                    stream = new stream_1.PassThrough();
                                                    response.pipe(stream);
                                                    streamAndLength = {
                                                        length: length,
                                                        reset: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                                            return tslib_1.__generator(this, function (_a) {
                                                                return [2, this.entryStreamPromise(entryPath)];
                                                            });
                                                        }); },
                                                        stream: stream,
                                                    };
                                                    topresolve(streamAndLength);
                                                    return [2];
                                            }
                                        });
                                    }); };
                                    needsStreamingResponse = true;
                                    if (!needsStreamingResponse) return [3, 5];
                                    promise = new Promise(function (resolve, reject) {
                                        request.get({
                                            headers: {},
                                            method: "GET",
                                            uri: url,
                                        })
                                            .on("response", function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4, success(response)];
                                                    case 1:
                                                        _a.sent();
                                                        resolve();
                                                        return [2];
                                                }
                                            });
                                        }); })
                                            .on("error", function (err) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4, failure(err)];
                                                    case 1:
                                                        _a.sent();
                                                        reject();
                                                        return [2];
                                                }
                                            });
                                        }); });
                                    });
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4, promise];
                                case 2:
                                    _a.sent();
                                    return [3, 4];
                                case 3:
                                    err_1 = _a.sent();
                                    return [3, 4];
                                case 4: return [3, 11];
                                case 5:
                                    response = void 0;
                                    _a.label = 6;
                                case 6:
                                    _a.trys.push([6, 9, , 11]);
                                    return [4, requestPromise({
                                            headers: {},
                                            method: "GET",
                                            resolveWithFullResponse: true,
                                            uri: url,
                                        })];
                                case 7:
                                    response = _a.sent();
                                    return [4, success(response)];
                                case 8:
                                    _a.sent();
                                    return [3, 11];
                                case 9:
                                    err_2 = _a.sent();
                                    return [4, failure(err_2)];
                                case 10:
                                    _a.sent();
                                    return [3, 11];
                                case 11: return [2];
                            }
                        });
                    }); })];
            });
        });
    };
    return ZipExplodedHTTP;
}(zip_1.Zip));
exports.ZipExplodedHTTP = ZipExplodedHTTP;
//# sourceMappingURL=zip-ex-http.js.map