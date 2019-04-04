"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = require("fs");
var http = require("http");
var https = require("https");
var path = require("path");
var url_1 = require("url");
var status_document_processing_1 = require("r2-lcp-js/dist/es5/src/lsd/status-document-processing");
var lcp_1 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var lcp_2 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var publication_download_1 = require("r2-lcp-js/dist/es5/src/publication-download");
var readium_css_settings_1 = require("r2-navigator-js/dist/es5/src/electron/common/readium-css-settings");
var sessions_1 = require("r2-navigator-js/dist/es5/src/electron/common/sessions");
var browser_window_tracker_1 = require("r2-navigator-js/dist/es5/src/electron/main/browser-window-tracker");
var lsd_injectlcpl_1 = require("r2-navigator-js/dist/es5/src/electron/main/lsd-injectlcpl");
var readium_css_1 = require("r2-navigator-js/dist/es5/src/electron/main/readium-css");
var sessions_2 = require("r2-navigator-js/dist/es5/src/electron/main/sessions");
var init_globals_1 = require("r2-opds-js/dist/es5/src/opds/init-globals");
var init_globals_2 = require("r2-shared-js/dist/es5/src/init-globals");
var publication_1 = require("r2-shared-js/dist/es5/src/models/publication");
var epub_1 = require("r2-shared-js/dist/es5/src/parser/epub");
var server_1 = require("r2-streamer-js/dist/es5/src/http/server");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var UrlUtils_2 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var zip_ex_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zip-ex");
var zip_ex_http_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zip-ex-http");
var debug_ = require("debug");
var electron_1 = require("electron");
var express = require("express");
var portfinder = require("portfinder");
var request = require("request");
var requestPromise = require("request-promise-native");
var ta_json_x_1 = require("ta-json-x");
var uuid = require("uuid");
var events_1 = require("../common/events");
var store_electron_1 = require("../common/store-electron");
var lcp_3 = require("./lcp");
var lsd_1 = require("./lsd");
var lsd_deviceid_manager_1 = require("./lsd-deviceid-manager");
var SECURE = true;
var electronStoreLSD = new store_electron_1.StoreElectron("readium2-testapp-lsd", {});
var deviceIDManager = lsd_deviceid_manager_1.getDeviceIDManager(electronStoreLSD, "Readium2 Electron desktop app");
electron_1.ipcMain.on("R2_EVENT_LCP_LSD_OPEN_SETTINGS", function (_event, _arg) {
    if (electronStoreLSD.reveal) {
        electronStoreLSD.reveal();
    }
});
init_globals_1.initGlobalConverters_OPDS();
init_globals_2.initGlobalConverters_SHARED();
init_globals_2.initGlobalConverters_GENERIC();
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var lcpPluginPath = IS_DEV ?
    path.join(process.cwd(), "LCP", "lcp.node") :
    path.join(__dirname, "lcp.node");
lcp_1.setLcpNativePluginPath(lcpPluginPath);
var debug = debug_("r2:testapp#electron/main/index");
var _publicationsServer;
var _publicationsServerPort;
var _publicationsRootUrl;
var _publicationsFilePaths;
var _publicationsUrls;
var _lastBookPath;
function openAllDevTools() {
    var e_1, _a;
    try {
        for (var _b = tslib_1.__values(electron_1.webContents.getAllWebContents()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var wc = _c.value;
            wc.openDevTools({ mode: "detach" });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function openTopLevelDevTools() {
    var bw = electron_1.BrowserWindow.getFocusedWindow();
    if (bw) {
        bw.webContents.openDevTools({ mode: "detach" });
    }
    else {
        var arr = electron_1.BrowserWindow.getAllWindows();
        arr.forEach(function (bww) {
            bww.webContents.openDevTools({ mode: "detach" });
        });
    }
}
electron_1.ipcMain.on(events_1.R2_EVENT_DEVTOOLS, function (_event, _arg) {
    openAllDevTools();
});
function isManifestJSON(urlOrPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var p, url_2, promise, ok, err_1, isMan;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    p = urlOrPath;
                    if (!UrlUtils_1.isHTTP(urlOrPath)) return [3, 4];
                    url_2 = new url_1.URL(urlOrPath);
                    p = url_2.pathname;
                    promise = new Promise(function (resolve, reject) {
                        var isHTTPS = urlOrPath.startsWith("https://");
                        var options = {
                            host: url_2.host,
                            method: "HEAD",
                            path: urlOrPath.substr(urlOrPath.indexOf(url_2.pathname)),
                        };
                        debug(options);
                        (isHTTPS ? https : http).request(options, function (response) {
                            debug(response.statusCode);
                            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                                reject("STATUS: " + response.statusCode);
                                return;
                            }
                            debug(response.headers);
                            debug(response.headers["content-type"]);
                            var okay = response.headers["content-type"] &&
                                (response.headers["content-type"].indexOf("application/webpub+json") >= 0 ||
                                    response.headers["content-type"].indexOf("application/audiobook+json") >= 0 ||
                                    response.headers["content-type"].indexOf("application/json") >= 0);
                            resolve(okay);
                        }).on("error", function (err) {
                            reject(err);
                        }).end();
                    });
                    ok = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, promise];
                case 2:
                    ok = _a.sent();
                    debug("########### IS MANIFEST (HTTP): " + ok);
                    return [2, ok];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    return [3, 4];
                case 4:
                    isMan = /.*manifest\.json[\?]?.*/.test(p);
                    debug("########### IS MANIFEST: " + isMan);
                    return [2, isMan];
            }
        });
    });
}
function tryLSD(publication, publicationFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var err_2;
                    var _this = this;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4, status_document_processing_1.launchStatusDocumentProcessing(publication.LCP, deviceIDManager, function (licenseUpdateJson) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var res, err_3, err_4;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    debug("launchStatusDocumentProcessing DONE.");
                                                    if (!licenseUpdateJson) return [3, 9];
                                                    res = void 0;
                                                    _a.label = 1;
                                                case 1:
                                                    _a.trys.push([1, 7, , 8]);
                                                    return [4, lsd_injectlcpl_1.lsdLcpUpdateInject(licenseUpdateJson, publication, publicationFilePath)];
                                                case 2:
                                                    res = _a.sent();
                                                    debug("EPUB LCP INJECTED: " + res);
                                                    _a.label = 3;
                                                case 3:
                                                    _a.trys.push([3, 5, , 6]);
                                                    return [4, tryLSD(publication, publicationFilePath)];
                                                case 4:
                                                    _a.sent();
                                                    resolve(true);
                                                    return [3, 6];
                                                case 5:
                                                    err_3 = _a.sent();
                                                    debug(err_3);
                                                    reject(err_3);
                                                    return [3, 6];
                                                case 6: return [3, 8];
                                                case 7:
                                                    err_4 = _a.sent();
                                                    debug(err_4);
                                                    reject(err_4);
                                                    return [3, 8];
                                                case 8: return [3, 10];
                                                case 9:
                                                    resolve(true);
                                                    _a.label = 10;
                                                case 10: return [2];
                                            }
                                        });
                                    }); })];
                            case 1:
                                _a.sent();
                                return [3, 3];
                            case 2:
                                err_2 = _a.sent();
                                debug(err_2);
                                reject(err_2);
                                return [3, 3];
                            case 3: return [2];
                        }
                    });
                }); })];
        });
    });
}
function createElectronBrowserWindow(publicationFilePath, publicationUrl) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var lcpHint, publication, isWebPub, isHttpWebPub, isHttpWebPubWithoutLCP, failure_1, handleLCP_1, successLCP_1, needsStreamingResponse_1, handleManifestJson_1, success_1, promise, err_5, response, err_6, responseStr, err_7, err_8, electronBrowserWindow, urlEncoded, htmlPath, fullUrl, urlRoot;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);
                    return [4, isManifestJSON(publicationFilePath)];
                case 1:
                    isWebPub = _a.sent();
                    isHttpWebPub = isWebPub && UrlUtils_1.isHTTP(publicationFilePath);
                    isHttpWebPubWithoutLCP = isHttpWebPub;
                    if (!isWebPub) return [3, 19];
                    failure_1 = function (err) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            debug(err);
                            return [2];
                        });
                    }); };
                    handleLCP_1 = function (responseStr, pub) {
                        var responseJson = global.JSON.parse(responseStr);
                        debug(responseJson);
                        var lcpl;
                        lcpl = ta_json_x_1.JSON.deserialize(responseJson, lcp_2.LCP);
                        lcpl.ZipPath = "META-INF/license.lcpl";
                        lcpl.JsonSource = responseStr;
                        lcpl.init();
                        pub.LCP = lcpl;
                    };
                    successLCP_1 = function (response, pub) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var responseStr, responseData, err_9;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) return [3, 2];
                                    return [4, failure_1("HTTP CODE " + response.statusCode)];
                                case 1:
                                    _a.sent();
                                    return [2];
                                case 2:
                                    if (!response.body) return [3, 3];
                                    debug("RES BODY");
                                    responseStr = response.body;
                                    return [3, 8];
                                case 3:
                                    debug("RES STREAM");
                                    responseData = void 0;
                                    _a.label = 4;
                                case 4:
                                    _a.trys.push([4, 6, , 7]);
                                    return [4, BufferUtils_1.streamToBufferPromise(response)];
                                case 5:
                                    responseData = _a.sent();
                                    return [3, 7];
                                case 6:
                                    err_9 = _a.sent();
                                    debug(err_9);
                                    return [2];
                                case 7:
                                    responseStr = responseData.toString("utf8");
                                    _a.label = 8;
                                case 8:
                                    handleLCP_1(responseStr, pub);
                                    return [2];
                            }
                        });
                    }); };
                    needsStreamingResponse_1 = true;
                    handleManifestJson_1 = function (responseStr) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var manifestJson, arrLinks, licenseLink, p, url, dirPath, zip, url, dirPath, zip, pathDecoded, publicationUrls, pubCheck, lcplHref_1, promise, err_10, responsez, err_11, responsezStr;
                        var _this = this;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    manifestJson = global.JSON.parse(responseStr);
                                    debug(manifestJson);
                                    if (UrlUtils_1.isHTTP(publicationFilePath)) {
                                        arrLinks = [];
                                        if (manifestJson.readingOrder) {
                                            arrLinks.push.apply(arrLinks, tslib_1.__spread(manifestJson.readingOrder));
                                        }
                                        if (manifestJson.resources) {
                                            arrLinks.push.apply(arrLinks, tslib_1.__spread(manifestJson.resources));
                                        }
                                        arrLinks.forEach(function (link) {
                                            if (link.properties && link.properties.encrypted &&
                                                (link.properties.encrypted.algorithm === "http://www.idpf.org/2008/embedding" ||
                                                    link.properties.encrypted.algorithm === "http://ns.adobe.com/pdf/enc#RC")) {
                                                delete link.properties.encrypted;
                                                var atLeastOne_1 = false;
                                                var jsonProps = Object.keys(link.properties);
                                                if (jsonProps) {
                                                    jsonProps.forEach(function (jsonProp) {
                                                        if (link.properties.hasOwnProperty(jsonProp)) {
                                                            atLeastOne_1 = true;
                                                            return false;
                                                        }
                                                        return true;
                                                    });
                                                }
                                                if (!atLeastOne_1) {
                                                    delete link.properties;
                                                }
                                            }
                                        });
                                    }
                                    try {
                                        publication = ta_json_x_1.JSON.deserialize(manifestJson, publication_1.Publication);
                                    }
                                    catch (erorz) {
                                        debug(erorz);
                                        return [2];
                                    }
                                    debug(publication);
                                    licenseLink = publication.Links ? publication.Links.find(function (link) {
                                        return link.Rel.indexOf("license") >= 0 &&
                                            link.TypeLink === "application/vnd.readium.lcp.license.v1.0+json";
                                    }) : undefined;
                                    isHttpWebPubWithoutLCP = isHttpWebPub && !licenseLink;
                                    p = publicationFilePath;
                                    if (UrlUtils_1.isHTTP(publicationFilePath)) {
                                        url = new url_1.URL(publicationFilePath);
                                        p = url.pathname;
                                    }
                                    publication.AddToInternal("filename", path.basename(p));
                                    publication.AddToInternal("type", "epub");
                                    if (!!isHttpWebPubWithoutLCP) return [3, 4];
                                    if (!!UrlUtils_1.isHTTP(publicationFilePath)) return [3, 2];
                                    dirPath = path.dirname(publicationFilePath);
                                    return [4, zip_ex_1.ZipExploded.loadPromise(dirPath)];
                                case 1:
                                    zip = _a.sent();
                                    publication.AddToInternal("zip", zip);
                                    return [3, 4];
                                case 2:
                                    url = new url_1.URL(publicationFilePath);
                                    dirPath = path.dirname(p);
                                    url.pathname = dirPath + "/";
                                    return [4, zip_ex_http_1.ZipExplodedHTTP.loadPromise(url.toString())];
                                case 3:
                                    zip = _a.sent();
                                    publication.AddToInternal("zip", zip);
                                    _a.label = 4;
                                case 4:
                                    pathDecoded = publicationFilePath;
                                    debug("ADDED HTTP pub to server cache: " + pathDecoded + " --- " + publicationFilePath);
                                    publicationUrls = _publicationsServer.addPublications([pathDecoded]);
                                    _publicationsServer.cachePublication(pathDecoded, publication);
                                    pubCheck = _publicationsServer.cachedPublication(pathDecoded);
                                    if (!pubCheck) {
                                        debug("PUB CHECK FAIL?");
                                    }
                                    if (!isHttpWebPubWithoutLCP) {
                                        publicationUrl = "" + _publicationsServer.serverUrl() + publicationUrls[0];
                                    }
                                    debug(publicationUrl);
                                    if (!(licenseLink && licenseLink.Href)) return [3, 20];
                                    lcplHref_1 = licenseLink.Href;
                                    if (!UrlUtils_1.isHTTP(lcplHref_1)) {
                                        if (UrlUtils_1.isHTTP(publicationFilePath)) {
                                            lcplHref_1 = new url_1.URL(lcplHref_1, publicationFilePath).toString();
                                        }
                                        else {
                                            lcplHref_1 = publicationFilePath.replace("manifest.json", licenseLink.Href);
                                        }
                                    }
                                    debug(lcplHref_1);
                                    if (!UrlUtils_1.isHTTP(lcplHref_1)) return [3, 17];
                                    if (!needsStreamingResponse_1) return [3, 9];
                                    promise = new Promise(function (resolve, reject) {
                                        request.get({
                                            headers: {},
                                            method: "GET",
                                            uri: lcplHref_1,
                                        })
                                            .on("response", function (responsez) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4, successLCP_1(responsez, publication)];
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
                                                    case 0: return [4, failure_1(err)];
                                                    case 1:
                                                        _a.sent();
                                                        reject();
                                                        return [2];
                                                }
                                            });
                                        }); });
                                    });
                                    _a.label = 5;
                                case 5:
                                    _a.trys.push([5, 7, , 8]);
                                    return [4, promise];
                                case 6:
                                    _a.sent();
                                    return [3, 8];
                                case 7:
                                    err_10 = _a.sent();
                                    return [2];
                                case 8: return [3, 16];
                                case 9:
                                    responsez = void 0;
                                    _a.label = 10;
                                case 10:
                                    _a.trys.push([10, 12, , 14]);
                                    return [4, requestPromise({
                                            headers: {},
                                            method: "GET",
                                            resolveWithFullResponse: true,
                                            uri: lcplHref_1,
                                        })];
                                case 11:
                                    responsez = _a.sent();
                                    return [3, 14];
                                case 12:
                                    err_11 = _a.sent();
                                    return [4, failure_1(err_11)];
                                case 13:
                                    _a.sent();
                                    return [2];
                                case 14: return [4, successLCP_1(responsez, publication)];
                                case 15:
                                    _a.sent();
                                    _a.label = 16;
                                case 16: return [3, 20];
                                case 17:
                                    responsezStr = fs.readFileSync(lcplHref_1, { encoding: "utf8" });
                                    if (!!responsezStr) return [3, 19];
                                    return [4, failure_1("Cannot read local file: " + lcplHref_1)];
                                case 18:
                                    _a.sent();
                                    return [2];
                                case 19:
                                    handleLCP_1(responsezStr, publication);
                                    _a.label = 20;
                                case 20: return [2];
                            }
                        });
                    }); };
                    if (!UrlUtils_1.isHTTP(publicationFilePath)) return [3, 14];
                    success_1 = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var responseStr, responseData, err_12;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) return [3, 2];
                                    return [4, failure_1("HTTP CODE " + response.statusCode)];
                                case 1:
                                    _a.sent();
                                    return [2];
                                case 2:
                                    if (!response.body) return [3, 3];
                                    debug("RES BODY");
                                    responseStr = response.body;
                                    return [3, 8];
                                case 3:
                                    debug("RES STREAM");
                                    responseData = void 0;
                                    _a.label = 4;
                                case 4:
                                    _a.trys.push([4, 6, , 7]);
                                    return [4, BufferUtils_1.streamToBufferPromise(response)];
                                case 5:
                                    responseData = _a.sent();
                                    return [3, 7];
                                case 6:
                                    err_12 = _a.sent();
                                    debug(err_12);
                                    return [2];
                                case 7:
                                    responseStr = responseData.toString("utf8");
                                    _a.label = 8;
                                case 8: return [4, handleManifestJson_1(responseStr)];
                                case 9:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); };
                    if (!needsStreamingResponse_1) return [3, 6];
                    promise = new Promise(function (resolve, reject) {
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: publicationFilePath,
                        })
                            .on("response", function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, success_1(response)];
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
                                    case 0: return [4, failure_1(err)];
                                    case 1:
                                        _a.sent();
                                        reject();
                                        return [2];
                                }
                            });
                        }); });
                    });
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4, promise];
                case 3:
                    _a.sent();
                    return [3, 5];
                case 4:
                    err_5 = _a.sent();
                    return [2];
                case 5: return [3, 13];
                case 6:
                    response = void 0;
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 9, , 11]);
                    return [4, requestPromise({
                            headers: {},
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: publicationFilePath,
                        })];
                case 8:
                    response = _a.sent();
                    return [3, 11];
                case 9:
                    err_6 = _a.sent();
                    return [4, failure_1(err_6)];
                case 10:
                    _a.sent();
                    return [2];
                case 11: return [4, success_1(response)];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13: return [3, 18];
                case 14:
                    responseStr = fs.readFileSync(publicationFilePath, { encoding: "utf8" });
                    if (!!responseStr) return [3, 16];
                    return [4, failure_1("Cannot read local file: " + publicationFilePath)];
                case 15:
                    _a.sent();
                    return [2];
                case 16: return [4, handleManifestJson_1(responseStr)];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18: return [3, 23];
                case 19:
                    if (!epub_1.isEPUBlication(publicationFilePath)) return [3, 23];
                    _a.label = 20;
                case 20:
                    _a.trys.push([20, 22, , 23]);
                    return [4, _publicationsServer.loadOrGetCachedPublication(publicationFilePath)];
                case 21:
                    publication = _a.sent();
                    return [3, 23];
                case 22:
                    err_7 = _a.sent();
                    debug(err_7);
                    return [2];
                case 23:
                    if (!(publication && publication.LCP)) return [3, 28];
                    debug(publication.LCP);
                    _a.label = 24;
                case 24:
                    _a.trys.push([24, 26, , 27]);
                    return [4, tryLSD(publication, publicationFilePath)];
                case 25:
                    _a.sent();
                    return [3, 27];
                case 26:
                    err_8 = _a.sent();
                    debug(err_8);
                    return [3, 27];
                case 27:
                    if (publication.LCP.Encryption &&
                        publication.LCP.Encryption.UserKey &&
                        publication.LCP.Encryption.UserKey.TextHint) {
                        lcpHint = publication.LCP.Encryption.UserKey.TextHint;
                    }
                    if (!lcpHint) {
                        lcpHint = "LCP passphrase";
                    }
                    _a.label = 28;
                case 28:
                    electronBrowserWindow = new electron_1.BrowserWindow({
                        height: 600,
                        webPreferences: {
                            allowRunningInsecureContent: false,
                            contextIsolation: false,
                            devTools: true,
                            nodeIntegration: true,
                            nodeIntegrationInWorker: false,
                            sandbox: false,
                            webSecurity: true,
                            webviewTag: true,
                        },
                        width: 800,
                    });
                    browser_window_tracker_1.trackBrowserWindow(electronBrowserWindow);
                    electronBrowserWindow.webContents.on("dom-ready", function () {
                        debug("electronBrowserWindow dom-ready " + publicationFilePath + " : " + publicationUrl);
                    });
                    if (!isHttpWebPubWithoutLCP && SECURE && UrlUtils_1.isHTTP(publicationUrl)) {
                        publicationUrl = sessions_1.convertHttpUrlToCustomScheme(publicationUrl);
                    }
                    urlEncoded = UrlUtils_2.encodeURIComponent_RFC3986(publicationUrl);
                    htmlPath = IS_DEV ? __dirname + "/../renderer/index.html" : __dirname + "/index.html";
                    htmlPath = htmlPath.replace(/\\/g, "/");
                    fullUrl = "file://" + htmlPath + "?pub=" + urlEncoded;
                    if (lcpHint) {
                        fullUrl = fullUrl + "&lcpHint=" + UrlUtils_2.encodeURIComponent_RFC3986(lcpHint);
                    }
                    urlRoot = _publicationsServer.serverUrl();
                    fullUrl = fullUrl + "&pubServerRoot=" + UrlUtils_2.encodeURIComponent_RFC3986(urlRoot);
                    if (isHttpWebPubWithoutLCP) {
                        fullUrl = fullUrl + "&isHttpWebPubWithoutLCP=1";
                    }
                    debug(fullUrl);
                    electronBrowserWindow.webContents.loadURL(fullUrl, { extraHeaders: "pragma: no-cache\n" });
                    return [2];
            }
        });
    });
}
sessions_2.initSessions();
var readiumCssDefaultsJson = Object.assign({}, readium_css_settings_1.readiumCSSDefaults);
var readiumCssKeys = Object.keys(readium_css_settings_1.readiumCSSDefaults);
readiumCssKeys.forEach(function (key) {
    var value = readium_css_settings_1.readiumCSSDefaults[key];
    if (typeof value === "undefined") {
        readiumCssDefaultsJson[key] = null;
    }
    else {
        readiumCssDefaultsJson[key] = value;
    }
});
var electronStore = new store_electron_1.StoreElectron("readium2-testapp", {
    basicLinkTitles: true,
    readiumCSS: readiumCssDefaultsJson,
    readiumCSSEnable: false,
});
function __computeReadiumCssJsonMessage(_publication, _link) {
    var on = electronStore.get("readiumCSSEnable");
    if (on) {
        var cssJson = electronStore.get("readiumCSS");
        if (!cssJson) {
            cssJson = readium_css_settings_1.readiumCSSDefaults;
        }
        var jsonMsg = {
            setCSS: cssJson,
        };
        return jsonMsg;
    }
    else {
        return { setCSS: undefined };
    }
}
var _electronBrowserWindowFileOrUrlDialog;
function loadFileOrUrlDialog(initval) {
    if (_electronBrowserWindowFileOrUrlDialog) {
        _electronBrowserWindowFileOrUrlDialog.show();
        debug("_electronBrowserWindowFileOrUrlDialog.show()");
        return;
    }
    var dialogid = uuid.v4().replace(/-/g, "_");
    var html = "\n<html>\n<head>\n<script type=\"text/javascript\">\n\nconst { ipcRenderer } = require('electron');\n\nipcRenderer.on(\"filePath\", (ev, filePath) => {\n\n    const dataEl = document.getElementById('data');\n    dataEl.value = filePath;\n});\n\nconst cancel = () => {\nconst payload = {\nurlOrPath: undefined,\n};\nipcRenderer.send(\"" + (events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid) + "\", payload);\n};\nconst submit = () => {\nconst dataEl = document.getElementById('data');\nconst payload = {\nurlOrPath: dataEl.value,\n};\nipcRenderer.send(\"" + (events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid) + "\", payload);\n};\n\nwindow.addEventListener(\"DOMContentLoaded\", () => {\n\ndocument.getElementById('filechoose').addEventListener('click', () => {\n    const payload = {\n        urlOrPath: undefined,\n        fileChooser: true,\n    };\n    ipcRenderer.send(\"" + (events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid) + "\", payload);\n});\n\ndocument.getElementById('ok').addEventListener('click', () => submit());\ndocument.getElementById('cancel').addEventListener('click', () => cancel());\n\nconst dataEl = document.getElementById('data');\n\ndataEl.addEventListener('keyup', e => {\ne.which = e.which || e.keyCode;\nif (e.which === 13) {\n    submit();\n}\nif (e.which === 27) {\n    cancel();\n}\n});\n\ndataEl.focus();\ndataEl.select();\n\nconst drag = (ev) => {\nev.preventDefault();\nreturn false;\n};\nconst drop = (ev) => {\nev.preventDefault();\n\nif (!ev.dataTransfer) {\n    return;\n}\n\nlet urlOrPath = undefined;\nif (ev.dataTransfer.items) {\n    for (const item of ev.dataTransfer.items) {\n        if (item.kind === \"file\") {\n            const file = item.getAsFile();\n            if (file) {\n                console.log(file.name);\n                console.log(file.path);\n                urlOrPath = file.path;\n                break;\n            }\n        } else if (item.kind === \"string\") {\n            if (item.type === \"text/plain\") { /* text/uri-list text/html */\n                const data = ev.dataTransfer.getData(item.type);\n                console.log(data);\n                urlOrPath = data;\n            } else {\n                console.log(item.type);\n                console.log(ev.dataTransfer.getData(item.type));\n            }\n        } else {\n            console.log(item.kind);\n        }\n    }\n} else if (ev.dataTransfer.files) {\n    for (const file of ev.dataTransfer.files) {\n        console.log(file.name);\n        console.log(file.path);\n        urlOrPath = file.path;\n        break;\n    }\n}\n\nif (urlOrPath) {\n    const payload = {\n        urlOrPath\n    };\n    ipcRenderer.send(\"" + (events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid) + "\", payload);\n}\n\n};\n\nwindow.document.addEventListener(\"dragover\", drag, false);\nwindow.document.addEventListener(\"drop\", drag, false);\n\nconst dropEl = document.getElementById('drop');\n\ndropEl.addEventListener(\"dragover\", drag, false);\ndropEl.addEventListener(\"drop\", drop, false);\n});\n\n</script>\n<style>\nbody {\nfont-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\nline-height: 1.5em;\ncolor: #333;\nbackground-color: #fff;\n}\n\n#container {\n/* align-items: center;\njustify-content: center; */\ndisplay: block;\noverflow: hidden;\n}\n\n#form {\nwidth: 100%;\n}\n\n#label {\nmax-width: 100%;\nmax-height: 100%;\nmargin-bottom: .8em;\npadding: 0 .5em;\n/* white-space: nowrap; */\n/* overflow: hidden; */\n/* text-overflow: ellipsis; */\n}\n\n#data {\nborder-radius: 2px;\nbackground: #fff;\nwidth: 400px;\npadding: .4em .5em;\nborder: 1px solid black;\nmin-height: 2em;\nmargin: 0 0 1.2em;\n}\n\n#data-container {\ntext-align: center;\n}\n\n#buttons {\ntext-align: right;\npadding: 0 .5em 0 0;\n}\n\n#filechoose,\n#buttons > button {\nborder-radius: 2px;\nborder: 0;\nmargin: 0 0 0 .5em;\nfont-size: .8em;\nline-height: 1em;\npadding: .6em 1em;\ncursor: pointer;\n}\n\n#filechoose {\n    margin-right: 8px;\n}\n#filechoose, input {\n    display: inline-block;\n}\n\n/*\n#ok {\nbackground-color: #3879D9;\ncolor: white;\n}\n\n#cancel {\nbackground-color: #DDD;\ncolor: black;\n}\n*/\n\n*:focus {\noutline-style: solid !important;\noutline-width: 2px !important;\noutline-color: blue !important;\noutline-offset: 2px !important;\n}\n\n#drop {\ndisplay: block;\nmargin-top: 1em;\nwidth: 99%;\nheight: 100px;\ncolor: black;\nbackground-color: #eeffee;\nborder: 1px dashed #333333;\nborder-radius: 8px;\nvertical-align: middle;\ntext-align: center;\n\ndisplay: flex;\njustify-content: center;\nflex-direction: column;\n}\n</style>\n</head>\n<body>\n<div id=\"container\">\n<div id=\"form\">\n<div id=\"label\">Enter URL or filepath:</div>\n<div id=\"data-container\">\n<button id=\"filechoose\">Choose...</button>\n<input id=\"data\" value=\"" + initval + "\"/>\n</div>\n<div id=\"buttons\">\n<button id=\"cancel\">Cancel</button>\n<button id=\"ok\">OK</button>\n</div>\n</div>\n<div id=\"drop\">\nfile drag-and-drop\n</div>\n</div>\n</body>\n</html>\n    ";
    _electronBrowserWindowFileOrUrlDialog = new electron_1.BrowserWindow({
        alwaysOnTop: true,
        height: 300,
        modal: false,
        resizable: false,
        skipTaskbar: false,
        title: "Readium2 Electron/NodeJS test app",
        useContentSize: false,
        webPreferences: {
            allowRunningInsecureContent: false,
            contextIsolation: false,
            devTools: true,
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            sandbox: false,
            webSecurity: true,
            webviewTag: false,
        },
        width: 600,
    });
    resetMenu(undefined);
    function dialogResult(_event, payload) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (payload.urlOrPath) {
                    process.nextTick(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, loadFileOrUrl(payload.urlOrPath)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); });
                    setTimeout(function () {
                        if (_electronBrowserWindowFileOrUrlDialog) {
                            _electronBrowserWindowFileOrUrlDialog.close();
                        }
                    }, 200);
                }
                else if (payload.fileChooser) {
                    process.nextTick(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var choice, filePath;
                        return tslib_1.__generator(this, function (_a) {
                            choice = electron_1.dialog.showOpenDialog({
                                defaultPath: _lastBookPath,
                                filters: [
                                    { name: "EPUB publication", extensions: ["epub", "epub3"] },
                                    { name: "LCP license", extensions: ["lcpl"] },
                                    { name: "Comic book", extensions: ["cbz"] },
                                ],
                                message: "Choose a file",
                                properties: ["openFile"],
                                title: "Open from filesystem",
                            });
                            if (!choice || !choice.length) {
                                return [2];
                            }
                            filePath = choice[0];
                            debug(filePath);
                            if (_electronBrowserWindowFileOrUrlDialog) {
                                _electronBrowserWindowFileOrUrlDialog.webContents.send("filePath", filePath);
                            }
                            return [2];
                        });
                    }); });
                }
                else {
                    if (_electronBrowserWindowFileOrUrlDialog) {
                        _electronBrowserWindowFileOrUrlDialog.close();
                    }
                }
                return [2];
            });
        });
    }
    electron_1.ipcMain.on(events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid, dialogResult);
    _electronBrowserWindowFileOrUrlDialog.on("closed", function (_ev) {
        electron_1.ipcMain.removeListener(events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid, dialogResult);
        _electronBrowserWindowFileOrUrlDialog = undefined;
    });
    _electronBrowserWindowFileOrUrlDialog.webContents.loadURL("data:text/html," + html);
}
electron_1.ipcMain.on(events_1.R2_EVENT_OPEN_URL_OR_PATH, function (_event, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, loadFileOrUrl(payload.urlOrPath)];
            case 1:
                _a.sent();
                return [2];
        }
    });
}); });
function loadFileOrUrl(argPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var filePathToLoadOnLaunch, filePath, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    filePath = argPath;
                    debug(filePath);
                    if (!UrlUtils_1.isHTTP(filePath)) return [3, 2];
                    return [4, openFile(filePath)];
                case 1:
                    _b.sent();
                    return [2, true];
                case 2:
                    if (!fs.existsSync(filePath)) {
                        filePath = path.join(__dirname, argPath);
                        debug(filePath);
                        if (!fs.existsSync(filePath)) {
                            filePath = path.join(process.cwd(), argPath);
                            debug(filePath);
                            if (!fs.existsSync(filePath)) {
                                debug("FILEPATH DOES NOT EXIST: " + filePath);
                            }
                            else {
                                filePathToLoadOnLaunch = filePath;
                            }
                        }
                        else {
                            filePathToLoadOnLaunch = filePath;
                        }
                    }
                    else {
                        filePath = fs.realpathSync(filePath);
                        debug(filePath);
                        filePathToLoadOnLaunch = filePath;
                    }
                    _b.label = 3;
                case 3:
                    if (!filePathToLoadOnLaunch) return [3, 9];
                    _a = epub_1.isEPUBlication(filePathToLoadOnLaunch);
                    if (_a) return [3, 5];
                    return [4, isManifestJSON(filePathToLoadOnLaunch)];
                case 4:
                    _a = (_b.sent());
                    _b.label = 5;
                case 5:
                    if (!_a) return [3, 7];
                    return [4, openFile(filePathToLoadOnLaunch)];
                case 6:
                    _b.sent();
                    return [2, true];
                case 7:
                    if (!!fs.lstatSync(filePathToLoadOnLaunch).isDirectory()) return [3, 9];
                    return [4, openFileDownload(filePathToLoadOnLaunch)];
                case 8:
                    _b.sent();
                    return [2, true];
                case 9: return [2, false];
            }
        });
    });
}
electron_1.app.on("ready", function () {
    debug("app ready");
    (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var readiumCSSPath, preloadPath, distTarget, dirnameSlashed, staticOptions, err_13, pubPaths;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _publicationsFilePaths = [];
                    _publicationsUrls = [];
                    _publicationsServer = new server_1.Server({
                        disableDecryption: false,
                        disableOPDS: true,
                        disableReaders: true,
                        disableRemotePubUrl: true,
                    });
                    if (SECURE) {
                        sessions_2.secureSessions(_publicationsServer);
                    }
                    lcp_3.installLcpHandler(_publicationsServer);
                    lsd_1.installLsdHandler(_publicationsServer, deviceIDManager);
                    readiumCSSPath = IS_DEV ?
                        path.join(process.cwd(), "dist", "ReadiumCSS").replace(/\\/g, "/") :
                        path.join(__dirname, "ReadiumCSS").replace(/\\/g, "/");
                    readium_css_1.setupReadiumCSS(_publicationsServer, readiumCSSPath, __computeReadiumCssJsonMessage);
                    if (IS_DEV) {
                        preloadPath = "FOLDER_PATH_TO/preload.js";
                        distTarget = void 0;
                        dirnameSlashed = __dirname.replace(/\\/g, "/");
                        if (dirnameSlashed.indexOf("/dist/es5") > 0) {
                            distTarget = "es5";
                        }
                        else if (dirnameSlashed.indexOf("/dist/es6-es2015") > 0) {
                            distTarget = "es6-es2015";
                        }
                        else if (dirnameSlashed.indexOf("/dist/es7-es2016") > 0) {
                            distTarget = "es7-es2016";
                        }
                        else if (dirnameSlashed.indexOf("/dist/es8-es2017") > 0) {
                            distTarget = "es8-es2017";
                        }
                        if (distTarget) {
                            preloadPath = path.join(process.cwd(), "node_modules/r2-navigator-js/dist/" +
                                distTarget);
                        }
                        preloadPath = preloadPath.replace(/\\/g, "/");
                        console.log(preloadPath);
                        staticOptions = {
                            dotfiles: "ignore",
                            etag: true,
                            fallthrough: false,
                            immutable: true,
                            index: false,
                            maxAge: "1d",
                            redirect: false,
                        };
                        _publicationsServer.expressUse(preloadPath, express.static(preloadPath, staticOptions));
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, portfinder.getPortPromise()];
                case 2:
                    _publicationsServerPort = _a.sent();
                    return [3, 4];
                case 3:
                    err_13 = _a.sent();
                    debug(err_13);
                    return [3, 4];
                case 4: return [4, _publicationsServer.start(_publicationsServerPort, SECURE)];
                case 5:
                    _a.sent();
                    _publicationsRootUrl = _publicationsServer.serverUrl();
                    debug(_publicationsRootUrl);
                    if (_publicationsFilePaths && _publicationsFilePaths.length) {
                        pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);
                        _publicationsUrls = pubPaths.map(function (pubPath) {
                            return "" + _publicationsRootUrl + pubPath;
                        });
                        debug(_publicationsUrls);
                    }
                    resetMenu(undefined);
                    process.nextTick(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var args, argPath;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    args = process.argv.slice(2);
                                    debug("args:");
                                    debug(args);
                                    if (!(args && args.length && args[0])) return [3, 2];
                                    argPath = args[0].trim();
                                    return [4, loadFileOrUrl(argPath)];
                                case 1:
                                    if (_a.sent()) {
                                        return [2];
                                    }
                                    _a.label = 2;
                                case 2:
                                    loadFileOrUrlDialog("");
                                    return [2];
                            }
                        });
                    }); });
                    return [2];
            }
        });
    }); })();
});
function resetMenu(browserWindow) {
    var _this = this;
    var menuTemplate = [
        {
            label: "Readium2 Electron",
            submenu: [
                { label: "About...", selector: "orderFrontStandardAboutPanel:" },
                { type: "separator" },
                {
                    accelerator: "Command+Q",
                    click: function () { electron_1.app.quit(); },
                    label: "Quit",
                },
            ],
        },
        {
            label: "File",
            submenu: [],
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
            ],
        },
        {
            role: "window",
            submenu: [
                {
                    role: "togglefullscreen",
                },
                {
                    role: "minimize",
                },
                {
                    role: "close",
                },
            ],
        },
        {
            label: "Tools",
            submenu: [
                {
                    accelerator: "CmdOrCtrl+R",
                    click: function (_item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.reload();
                        }
                    },
                    label: "Reload",
                },
                {
                    accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
                    click: function (_item, _focusedWindow) {
                        openAllDevTools();
                    },
                    label: "Dev Tools (all)",
                },
                {
                    accelerator: process.platform === "darwin" ? "Shift+Alt+Command+I" : "Alt+Ctrl+Shift+I",
                    click: function (_item, _focusedWindow) {
                        openTopLevelDevTools();
                    },
                    label: "Dev Tools (top only)",
                },
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    click: function (_item, _focusedWindow) {
                        electron_1.shell.openExternal("https://github.com/readium/r2-testapp-js/");
                    },
                    label: "Website...",
                },
            ],
        },
    ];
    menuTemplate[1].submenu.push({
        accelerator: "CmdOrCtrl+O",
        click: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                loadFileOrUrlDialog("");
                return [2];
            });
        }); },
        label: "Open...",
    });
    menuTemplate[1].submenu.push({
        type: "separator",
    });
    _publicationsUrls.forEach(function (pubManifestUrl, n) {
        var filePath = _publicationsFilePaths[n];
        debug("MENU ITEM: " + filePath + " : " + pubManifestUrl);
        menuTemplate[1].submenu.push({
            click: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            debug(filePath);
                            return [4, openFileDownload(filePath)];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            }); },
            label: filePath,
        });
    });
    var menu = electron_1.Menu.buildFromTemplate(menuTemplate);
    if (browserWindow) {
        browserWindow.setMenu(menu);
    }
    else {
        electron_1.Menu.setApplicationMenu(menu);
    }
}
function openFileDownload(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var dir, ext, filename, destFileName, epubFilePath, err_14, result_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dir = path.dirname(filePath);
                    _lastBookPath = dir;
                    debug(_lastBookPath);
                    ext = path.extname(filePath);
                    filename = path.basename(filePath);
                    destFileName = filename + ".epub";
                    if (!(ext === ".lcpl")) return [3, 5];
                    epubFilePath = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, publication_download_1.downloadEPUBFromLCPL(filePath, dir, destFileName)];
                case 2:
                    epubFilePath = _a.sent();
                    return [3, 4];
                case 3:
                    err_14 = _a.sent();
                    process.nextTick(function () {
                        var detail = (typeof err_14 === "string") ?
                            err_14 :
                            (err_14.toString ? err_14.toString() : "ERROR!?");
                        var message = "LCP EPUB download fail!]";
                        var res = electron_1.dialog.showMessageBox({
                            buttons: ["&OK"],
                            cancelId: 0,
                            defaultId: 0,
                            detail: detail,
                            message: message,
                            noLink: true,
                            normalizeAccessKeys: true,
                            title: "Readium2 Electron streamer / navigator",
                            type: "info",
                        });
                        if (res === 0) {
                            debug("ok");
                        }
                    });
                    return [2];
                case 4:
                    result_1 = epubFilePath;
                    process.nextTick(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var detail, message, res;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    detail = result_1[0] + " ---- [" + result_1[1] + "]";
                                    message = "LCP EPUB file download success [" + destFileName + "]";
                                    res = electron_1.dialog.showMessageBox({
                                        buttons: ["&OK"],
                                        cancelId: 0,
                                        defaultId: 0,
                                        detail: detail,
                                        message: message,
                                        noLink: true,
                                        normalizeAccessKeys: true,
                                        title: "Readium2 Electron streamer / navigator",
                                        type: "info",
                                    });
                                    if (res === 0) {
                                        debug("ok");
                                    }
                                    return [4, openFile(result_1[0])];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); });
                    return [3, 7];
                case 5: return [4, openFile(filePath)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2];
            }
        });
    });
}
function openFile(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var n, publicationPaths, file, pubManifestUrl;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    n = _publicationsFilePaths.indexOf(filePath);
                    if (!(n < 0)) return [3, 2];
                    return [4, isManifestJSON(filePath)];
                case 1:
                    if (_a.sent()) {
                        _publicationsFilePaths.push(filePath);
                        debug(_publicationsFilePaths);
                        _publicationsUrls.push(filePath);
                        debug(_publicationsUrls);
                        n = _publicationsFilePaths.length - 1;
                    }
                    else {
                        publicationPaths = _publicationsServer.addPublications([filePath]);
                        debug(publicationPaths);
                        _publicationsFilePaths.push(filePath);
                        debug(_publicationsFilePaths);
                        _publicationsUrls.push("" + _publicationsRootUrl + publicationPaths[0]);
                        debug(_publicationsUrls);
                        n = _publicationsFilePaths.length - 1;
                    }
                    process.nextTick(function () {
                        resetMenu(undefined);
                    });
                    _a.label = 2;
                case 2:
                    file = _publicationsFilePaths[n];
                    pubManifestUrl = _publicationsUrls[n];
                    return [4, createElectronBrowserWindow(file, pubManifestUrl)];
                case 3:
                    _a.sent();
                    return [2];
            }
        });
    });
}
electron_1.app.on("activate", function () {
    debug("app activate");
});
electron_1.app.on("before-quit", function () {
    debug("app before quit");
});
electron_1.app.on("window-all-closed", function () {
    debug("app window-all-closed");
    setTimeout(function () {
        electron_1.dialog.showMessageBox({
            buttons: ["yes", "no"],
            cancelId: 1,
            checkboxChecked: undefined,
            checkboxLabel: undefined,
            defaultId: 0,
            detail: undefined,
            icon: undefined,
            message: "Do you want to exit this application?",
            noLink: true,
            normalizeAccessKeys: false,
            title: "Readium2 test app, exit?",
            type: "question",
        }, function (response, _checkboxChecked) {
            if (response === 0) {
                electron_1.app.quit();
            }
            else {
                loadFileOrUrlDialog("");
            }
        });
    }, 300);
});
electron_1.app.on("quit", function () {
    debug("app quit");
    _publicationsServer.stop();
});
//# sourceMappingURL=index.js.map