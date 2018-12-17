"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const stream_1 = require("stream");
const zip_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/zip/zip");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const debug = debug_("r2:testapp#electron/main/zip-ex-manifest-json");
class ZipExplodedHTTP extends zip_1.Zip {
    constructor(dirPath) {
        super();
        this.dirPath = dirPath;
        debug(`ZipExplodedHTTP: ${dirPath}`);
    }
    static loadPromise(dirPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(new ZipExplodedHTTP(dirPath));
        });
    }
    freeDestroy() {
        debug("freeDestroy: ZipExplodedHTTP -- " + this.dirPath);
    }
    entriesCount() {
        return 0;
    }
    hasEntries() {
        return true;
    }
    hasEntry(_entryPath) {
        return true;
    }
    getEntries() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((_resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                reject("Not implemented.");
            }));
        });
    }
    entryStreamPromise(entryPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            debug(`entryStreamPromise: ${entryPath}`);
            if (!this.hasEntries() || !this.hasEntry(entryPath)) {
                return Promise.reject("no such path in zip exploded: " + entryPath);
            }
            const url = this.dirPath + "/" + entryPath;
            debug(`URL: ${url}`);
            return new Promise((topresolve, topreject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const failure = (err) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    debug(err);
                    topreject(err);
                });
                const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    Object.keys(response.headers).forEach((header) => {
                        debug(header + " => " + response.headers[header]);
                    });
                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                        yield failure("HTTP CODE " + response.statusCode);
                        return;
                    }
                    let length = 0;
                    const lengthStr = response.headers["content-length"];
                    if (lengthStr) {
                        length = parseInt(lengthStr, 10);
                    }
                    const stream = new stream_1.PassThrough();
                    response.pipe(stream);
                    const streamAndLength = {
                        length,
                        reset: () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                            return this.entryStreamPromise(entryPath);
                        }),
                        stream,
                    };
                    topresolve(streamAndLength);
                });
                const needsStreamingResponse = true;
                if (needsStreamingResponse) {
                    const promise = new Promise((resolve, reject) => {
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: url,
                        })
                            .on("response", (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                            yield success(response);
                            resolve();
                        }))
                            .on("error", (err) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                            yield failure(err);
                            reject();
                        }));
                    });
                    try {
                        yield promise;
                    }
                    catch (err) {
                    }
                }
                else {
                    let response;
                    try {
                        response = yield requestPromise({
                            headers: {},
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: url,
                        });
                        yield success(response);
                    }
                    catch (err) {
                        yield failure(err);
                    }
                }
            }));
        });
    }
}
exports.ZipExplodedHTTP = ZipExplodedHTTP;
//# sourceMappingURL=zip-ex-http.js.map