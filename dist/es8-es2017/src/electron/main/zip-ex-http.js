"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const zip_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/zip/zip");
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
    static async loadPromise(dirPath) {
        return Promise.resolve(new ZipExplodedHTTP(dirPath));
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
    async getEntries() {
        return new Promise(async (_resolve, reject) => {
            reject("Not implemented.");
        });
    }
    async entryStreamPromise(entryPath) {
        debug(`entryStreamPromise: ${entryPath}`);
        if (!this.hasEntries() || !this.hasEntry(entryPath)) {
            return Promise.reject("no such path in zip exploded: " + entryPath);
        }
        const url = this.dirPath + "/" + entryPath;
        debug(`URL: ${url}`);
        return new Promise(async (topresolve, topreject) => {
            const failure = async (err) => {
                debug(err);
                topreject(err);
            };
            const success = async (response) => {
                Object.keys(response.headers).forEach((header) => {
                    debug(header + " => " + response.headers[header]);
                });
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    await failure("HTTP CODE " + response.statusCode);
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
                    reset: async () => {
                        return this.entryStreamPromise(entryPath);
                    },
                    stream,
                };
                topresolve(streamAndLength);
            };
            const needsStreamingResponse = true;
            if (needsStreamingResponse) {
                const promise = new Promise((resolve, reject) => {
                    request.get({
                        headers: {},
                        method: "GET",
                        uri: url,
                    })
                        .on("response", async (response) => {
                        await success(response);
                        resolve();
                    })
                        .on("error", async (err) => {
                        await failure(err);
                        reject();
                    });
                });
                try {
                    await promise;
                }
                catch (err) {
                }
            }
            else {
                let response;
                try {
                    response = await requestPromise({
                        headers: {},
                        method: "GET",
                        resolveWithFullResponse: true,
                        uri: url,
                    });
                    await success(response);
                }
                catch (err) {
                    await failure(err);
                }
            }
        });
    }
}
exports.ZipExplodedHTTP = ZipExplodedHTTP;
//# sourceMappingURL=zip-ex-http.js.map