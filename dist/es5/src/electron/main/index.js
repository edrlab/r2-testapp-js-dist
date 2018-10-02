"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = require("fs");
var path = require("path");
var publication_1 = require("r2-shared-js/dist/es5/src/models/publication");
var status_document_processing_1 = require("r2-lcp-js/dist/es5/src/lsd/status-document-processing");
var lcp_1 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var lcp_2 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var publication_download_1 = require("r2-lcp-js/dist/es5/src/publication-download");
var sessions_1 = require("r2-navigator-js/dist/es5/src/electron/common/sessions");
var browser_window_tracker_1 = require("r2-navigator-js/dist/es5/src/electron/main/browser-window-tracker");
var lsd_injectlcpl_1 = require("r2-navigator-js/dist/es5/src/electron/main/lsd-injectlcpl");
var readium_css_1 = require("r2-navigator-js/dist/es5/src/electron/main/readium-css");
var sessions_2 = require("r2-navigator-js/dist/es5/src/electron/main/sessions");
var init_globals_1 = require("r2-opds-js/dist/es5/src/opds/init-globals");
var init_globals_2 = require("r2-shared-js/dist/es5/src/init-globals");
var server_1 = require("r2-streamer-js/dist/es5/src/http/server");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var debug_ = require("debug");
var electron_1 = require("electron");
var express = require("express");
var filehound = require("filehound");
var portfinder = require("portfinder");
var request = require("request");
var requestPromise = require("request-promise-native");
var ta_json_x_1 = require("ta-json-x");
var events_1 = require("../common/events");
var store_electron_1 = require("../common/store-electron");
var lcp_3 = require("./lcp");
var lsd_1 = require("./lsd");
var lsd_deviceid_manager_1 = require("./lsd-deviceid-manager");
var electronStoreLSD = new store_electron_1.StoreElectron("readium2-testapp-lsd", {});
var deviceIDManager = lsd_deviceid_manager_1.getDeviceIDManager(electronStoreLSD, "Readium2 Electron desktop app");
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
var DEFAULT_BOOK_PATH = path.join(IS_DEV ? process.cwd() : __dirname, "misc", "epubs");
debug(DEFAULT_BOOK_PATH);
if (fs.existsSync(DEFAULT_BOOK_PATH)) {
    debug("DEFAULT_BOOK_PATH => exists");
    DEFAULT_BOOK_PATH = fs.realpathSync(path.resolve(DEFAULT_BOOK_PATH));
    debug(DEFAULT_BOOK_PATH);
}
else {
    debug("DEFAULT_BOOK_PATH => missing");
    DEFAULT_BOOK_PATH = ".";
}
var _lastBookPath;
function openAllDevTools() {
    for (var _i = 0, _a = electron_1.webContents.getAllWebContents(); _i < _a.length; _i++) {
        var wc = _a[_i];
        wc.openDevTools();
    }
}
electron_1.ipcMain.on(events_1.R2_EVENT_DEVTOOLS, function (_event, _arg) {
    openAllDevTools();
});
function createElectronBrowserWindow(publicationFilePath, publicationUrl) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var lcpHint, publication, failure_1, successLCP_1, success_1, needsStreamingResponse_1, promise, err_1, response, err_2, err_3, err_4, electronBrowserWindow, urlEncoded, htmlPath, fullUrl, urlRoot;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);
                    if (!(publicationFilePath.indexOf("http") === 0 &&
                        publicationFilePath.endsWith(".json"))) return [3, 13];
                    failure_1 = function (err) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            debug(err);
                            return [2];
                        });
                    }); };
                    successLCP_1 = function (response, pub) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var responseStr, responseData, err_5, responseJson, lcpl;
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
                                    err_5 = _a.sent();
                                    debug(err_5);
                                    return [2];
                                case 7:
                                    responseStr = responseData.toString("utf8");
                                    _a.label = 8;
                                case 8:
                                    responseJson = global.JSON.parse(responseStr);
                                    debug(responseJson);
                                    lcpl = ta_json_x_1.JSON.deserialize(responseJson, lcp_2.LCP);
                                    lcpl.ZipPath = "META-INF/license.lcpl";
                                    lcpl.JsonSource = responseStr;
                                    lcpl.init();
                                    pub.LCP = lcpl;
                                    publicationUrl = publicationUrl.replace("/pub/", "/pub/" + _publicationsServer.lcpBeginToken +
                                        "URL_LCP_PASS_PLACEHOLDER" + _publicationsServer.lcpEndToken);
                                    debug(publicationUrl);
                                    return [2];
                            }
                        });
                    }); };
                    success_1 = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var responseStr, responseData, err_6, responseJson, pathBase64, pathDecoded, pubCheck, licenseLink, lcplHref_1, promise, err_7, responsez, err_8;
                        var _this = this;
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
                                    err_6 = _a.sent();
                                    debug(err_6);
                                    return [2];
                                case 7:
                                    responseStr = responseData.toString("utf8");
                                    _a.label = 8;
                                case 8:
                                    responseJson = global.JSON.parse(responseStr);
                                    debug(responseJson);
                                    try {
                                        publication = ta_json_x_1.JSON.deserialize(responseJson, publication_1.Publication);
                                    }
                                    catch (erorz) {
                                        debug(erorz);
                                        return [2];
                                    }
                                    debug(publication);
                                    pathBase64 = decodeURIComponent(publicationFilePath.replace(/.*\/pub\/(.*)\/manifest.json/, "$1"));
                                    debug(pathBase64);
                                    pathDecoded = new Buffer(pathBase64, "base64").toString("utf8");
                                    debug(pathDecoded);
                                    debug("ADDED HTTP pub to server cache: " + pathDecoded + " --- " + publicationFilePath);
                                    _publicationsServer.cachePublication(pathDecoded, publication);
                                    pubCheck = _publicationsServer.cachedPublication(pathDecoded);
                                    if (!pubCheck) {
                                        debug("PUB CHECK FAIL?");
                                    }
                                    if (!publication.Links) return [3, 20];
                                    licenseLink = publication.Links.find(function (link) {
                                        return link.Rel.indexOf("license") >= 0 &&
                                            link.TypeLink === "application/vnd.readium.lcp.license.v1.0+json";
                                    });
                                    if (!(licenseLink && licenseLink.Href)) return [3, 20];
                                    lcplHref_1 = publicationFilePath.replace("manifest.json", licenseLink.Href);
                                    debug(lcplHref_1);
                                    if (!needsStreamingResponse_1) return [3, 13];
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
                                    _a.label = 9;
                                case 9:
                                    _a.trys.push([9, 11, , 12]);
                                    return [4, promise];
                                case 10:
                                    _a.sent();
                                    return [3, 12];
                                case 11:
                                    err_7 = _a.sent();
                                    return [2];
                                case 12: return [3, 20];
                                case 13:
                                    responsez = void 0;
                                    _a.label = 14;
                                case 14:
                                    _a.trys.push([14, 16, , 18]);
                                    return [4, requestPromise({
                                            headers: {},
                                            method: "GET",
                                            resolveWithFullResponse: true,
                                            uri: lcplHref_1,
                                        })];
                                case 15:
                                    responsez = _a.sent();
                                    return [3, 18];
                                case 16:
                                    err_8 = _a.sent();
                                    return [4, failure_1(err_8)];
                                case 17:
                                    _a.sent();
                                    return [2];
                                case 18: return [4, successLCP_1(responsez, publication)];
                                case 19:
                                    _a.sent();
                                    _a.label = 20;
                                case 20: return [2];
                            }
                        });
                    }); };
                    needsStreamingResponse_1 = true;
                    if (!needsStreamingResponse_1) return [3, 5];
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
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, promise];
                case 2:
                    _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    return [2];
                case 4: return [3, 12];
                case 5:
                    response = void 0;
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 10]);
                    return [4, requestPromise({
                            headers: {},
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: publicationFilePath,
                        })];
                case 7:
                    response = _a.sent();
                    return [3, 10];
                case 8:
                    err_2 = _a.sent();
                    return [4, failure_1(err_2)];
                case 9:
                    _a.sent();
                    return [2];
                case 10: return [4, success_1(response)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12: return [3, 17];
                case 13:
                    if (!(publicationFilePath.indexOf("http") !== 0 ||
                        publicationFilePath.endsWith(".epub"))) return [3, 17];
                    _a.label = 14;
                case 14:
                    _a.trys.push([14, 16, , 17]);
                    return [4, _publicationsServer.loadOrGetCachedPublication(publicationFilePath)];
                case 15:
                    publication = _a.sent();
                    return [3, 17];
                case 16:
                    err_3 = _a.sent();
                    debug(err_3);
                    return [2];
                case 17:
                    if (!(publication && publication.LCP)) return [3, 22];
                    debug(publication.LCP);
                    _a.label = 18;
                case 18:
                    _a.trys.push([18, 20, , 21]);
                    return [4, status_document_processing_1.launchStatusDocumentProcessing(publication.LCP, deviceIDManager, function (licenseUpdateJson) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var res, err_9;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        debug("launchStatusDocumentProcessing DONE.");
                                        if (!licenseUpdateJson) return [3, 4];
                                        res = void 0;
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4, lsd_injectlcpl_1.lsdLcpUpdateInject(licenseUpdateJson, publication, publicationFilePath)];
                                    case 2:
                                        res = _a.sent();
                                        debug("EPUB SAVED: " + res);
                                        return [3, 4];
                                    case 3:
                                        err_9 = _a.sent();
                                        debug(err_9);
                                        return [3, 4];
                                    case 4: return [2];
                                }
                            });
                        }); })];
                case 19:
                    _a.sent();
                    return [3, 21];
                case 20:
                    err_4 = _a.sent();
                    debug(err_4);
                    return [3, 21];
                case 21:
                    if (publication.LCP.Encryption &&
                        publication.LCP.Encryption.UserKey &&
                        publication.LCP.Encryption.UserKey.TextHint) {
                        lcpHint = publication.LCP.Encryption.UserKey.TextHint;
                    }
                    if (!lcpHint) {
                        lcpHint = "LCP passphrase";
                    }
                    _a.label = 22;
                case 22:
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
                    if (publicationFilePath.indexOf("http") !== 0) {
                        publicationUrl = sessions_1.convertHttpUrlToCustomScheme(publicationUrl);
                    }
                    urlEncoded = UrlUtils_1.encodeURIComponent_RFC3986(publicationUrl);
                    htmlPath = IS_DEV ? __dirname + "/../renderer/index.html" : __dirname + "/index.html";
                    htmlPath = htmlPath.replace(/\\/g, "/");
                    fullUrl = "file://" + htmlPath + "?pub=" + urlEncoded;
                    if (lcpHint) {
                        fullUrl = fullUrl + "&lcpHint=" + UrlUtils_1.encodeURIComponent_RFC3986(lcpHint);
                    }
                    urlRoot = _publicationsServer.serverUrl();
                    fullUrl = fullUrl + "&pubServerRoot=" + UrlUtils_1.encodeURIComponent_RFC3986(urlRoot);
                    debug(fullUrl);
                    electronBrowserWindow.webContents.loadURL(fullUrl, { extraHeaders: "pragma: no-cache\n" });
                    return [2];
            }
        });
    });
}
sessions_2.initSessions();
electron_1.app.on("ready", function () {
    debug("app ready");
    (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var err_10, readiumCSSPath, preloadPath, distTarget, dirnameSlashed, staticOptions, pubPaths, err_11;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, filehound.create()
                            .depth(0)
                            .ignoreHiddenDirectories()
                            .ignoreHiddenFiles()
                            .paths(DEFAULT_BOOK_PATH)
                            .ext([".epub", ".epub3", ".cbz", ".lcpl"])
                            .find()];
                case 1:
                    _publicationsFilePaths = _a.sent();
                    return [3, 3];
                case 2:
                    err_10 = _a.sent();
                    debug(err_10);
                    return [3, 3];
                case 3:
                    debug(_publicationsFilePaths);
                    _publicationsServer = new server_1.Server({
                        disableDecryption: false,
                        disableOPDS: true,
                        disableReaders: true,
                        disableRemotePubUrl: true,
                    });
                    sessions_2.secureSessions(_publicationsServer);
                    lcp_3.installLcpHandler(_publicationsServer);
                    lsd_1.installLsdHandler(_publicationsServer, deviceIDManager);
                    readiumCSSPath = IS_DEV ?
                        path.join(process.cwd(), "dist", "ReadiumCSS").replace(/\\/g, "/") :
                        path.join(__dirname, "ReadiumCSS").replace(/\\/g, "/");
                    readium_css_1.setupReadiumCSS(_publicationsServer, readiumCSSPath);
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
                    pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4, portfinder.getPortPromise()];
                case 5:
                    _publicationsServerPort = _a.sent();
                    return [3, 7];
                case 6:
                    err_11 = _a.sent();
                    debug(err_11);
                    return [3, 7];
                case 7: return [4, _publicationsServer.start(_publicationsServerPort, true)];
                case 8:
                    _a.sent();
                    _publicationsRootUrl = _publicationsServer.serverUrl();
                    debug(_publicationsRootUrl);
                    _publicationsUrls = pubPaths.map(function (pubPath) {
                        return "" + _publicationsRootUrl + pubPath;
                    });
                    debug(_publicationsUrls);
                    resetMenu();
                    process.nextTick(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var args, filePathToLoadOnLaunch, argPath, filePath, detail, message, choice, html, electronBrowserWindow;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    args = process.argv.slice(2);
                                    debug("args:");
                                    debug(args);
                                    if (!(args && args.length && args[0])) return [3, 3];
                                    argPath = args[0].trim();
                                    filePath = argPath;
                                    debug(filePath);
                                    if (!(filePath.indexOf("http") === 0)) return [3, 2];
                                    return [4, openFile(filePath)];
                                case 1:
                                    _a.sent();
                                    return [2];
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
                                    _a.label = 3;
                                case 3:
                                    if (!(filePathToLoadOnLaunch && !fs.lstatSync(filePathToLoadOnLaunch).isDirectory())) return [3, 5];
                                    return [4, openFileDownload(filePathToLoadOnLaunch)];
                                case 4:
                                    _a.sent();
                                    return [2];
                                case 5:
                                    detail = "Note that this is only a developer application (" +
                                        "test framework) for the Readium2 NodeJS 'streamer' and Electron-based 'navigator'.";
                                    message = "Use the 'Electron' menu to load publications.";
                                    if (process.platform === "darwin") {
                                        choice = electron_1.dialog.showMessageBox({
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
                                        if (choice === 0) {
                                            debug("ok");
                                        }
                                    }
                                    else {
                                        html = "<html><h2>" + message + "<hr>" + detail + "</h2></html>";
                                        electronBrowserWindow = new electron_1.BrowserWindow({
                                            height: 300,
                                            webPreferences: {
                                                allowRunningInsecureContent: false,
                                                contextIsolation: false,
                                                devTools: false,
                                                nodeIntegration: false,
                                                nodeIntegrationInWorker: false,
                                                sandbox: false,
                                                webSecurity: true,
                                                webviewTag: false,
                                            },
                                            width: 400,
                                        });
                                        electronBrowserWindow.webContents.loadURL("data:text/html," + html);
                                    }
                                    return [2];
                            }
                        });
                    }); });
                    return [2];
            }
        });
    }); })();
});
function resetMenu() {
    var _this = this;
    var menuTemplate = [
        {
            label: "Readium2 Electron",
            submenu: [
                {
                    accelerator: "Command+Q",
                    click: function () { electron_1.app.quit(); },
                    label: "Quit",
                },
            ],
        },
        {
            label: "Open",
            submenu: [],
        },
        {
            label: "Tools",
            submenu: [
                {
                    accelerator: "Command+B",
                    click: function () {
                        openAllDevTools();
                    },
                    label: "Open Dev Tools",
                },
            ],
        },
    ];
    menuTemplate[1].submenu.push({
        click: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var choice, filePath;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        choice = electron_1.dialog.showOpenDialog({
                            defaultPath: _lastBookPath || DEFAULT_BOOK_PATH,
                            filters: [
                                { name: "EPUB publication", extensions: ["epub", "epub3"] },
                                { name: "LCP license", extensions: ["lcpl"] },
                                { name: "Comic book", extensions: ["cbz"] },
                            ],
                            message: "Choose a file",
                            properties: ["openFile"],
                            title: "Load a publication",
                        });
                        if (!choice || !choice.length) {
                            return [2];
                        }
                        filePath = choice[0];
                        debug(filePath);
                        return [4, openFileDownload(filePath)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); },
        label: "Load file...",
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
    electron_1.Menu.setApplicationMenu(menu);
}
function openFileDownload(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var dir, ext, filename, destFileName, epubFilePath, err_12, result_1;
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
                    err_12 = _a.sent();
                    process.nextTick(function () {
                        var detail = (typeof err_12 === "string") ?
                            err_12 :
                            (err_12.toString ? err_12.toString() : "ERROR!?");
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
                    if (n < 0) {
                        if (filePath.indexOf("http") === 0 &&
                            filePath.endsWith(".json")) {
                            _publicationsFilePaths.push(filePath);
                            debug(_publicationsFilePaths);
                            _publicationsUrls.push(decodeURIComponent(filePath));
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
                            resetMenu();
                        });
                    }
                    file = _publicationsFilePaths[n];
                    pubManifestUrl = _publicationsUrls[n];
                    return [4, createElectronBrowserWindow(file, pubManifestUrl)];
                case 1:
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
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("quit", function () {
    debug("app quit");
    _publicationsServer.stop();
});
//# sourceMappingURL=index.js.map