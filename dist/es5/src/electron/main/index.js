"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = require("fs");
var path = require("path");
var status_document_processing_1 = require("r2-lcp-js/dist/es5/src/lsd/status-document-processing");
var lcp_1 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var publication_download_1 = require("r2-lcp-js/dist/es5/src/publication-download");
var init_globals_1 = require("r2-shared-js/dist/es5/src/init-globals");
var server_1 = require("r2-streamer-js/dist/es5/src/http/server");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var debug_ = require("debug");
var electron_1 = require("electron");
var filehound = require("filehound");
var portfinder = require("portfinder");
var events_1 = require("../common/events");
var browser_window_tracker_1 = require("./browser-window-tracker");
var lcp_2 = require("./lcp");
var lsd_deviceid_manager_1 = require("./lsd-deviceid-manager");
var lsd_injectlcpl_1 = require("./lsd-injectlcpl");
var readium_css_1 = require("./readium-css");
var sessions_1 = require("./sessions");
init_globals_1.initGlobals();
var lcpPluginPath = path.join(process.cwd(), "LCP", "lcp.node");
lcp_1.setLcpNativePluginPath(lcpPluginPath);
var debug = debug_("r2:electron:main");
var _publicationsServer;
var _publicationsServerPort;
var _publicationsRootUrl;
var _publicationsFilePaths;
var _publicationsUrls;
var DEFAULT_BOOK_PATH = fs.realpathSync(path.resolve("./misc/epubs/"));
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
        var _this = this;
        var publication, err_1, lcpHint, err_2, electronBrowserWindow, urlEncoded, fullUrl;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, _publicationsServer.loadOrGetCachedPublication(publicationFilePath)];
                case 2:
                    publication = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    return [2];
                case 4:
                    if (!(publication && publication.LCP)) return [3, 9];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4, status_document_processing_1.launchStatusDocumentProcessing(publication.LCP, lsd_deviceid_manager_1.deviceIDManager, function (licenseUpdateJson) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var res, err_3;
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
                                        err_3 = _a.sent();
                                        debug(err_3);
                                        return [3, 4];
                                    case 4: return [2];
                                }
                            });
                        }); })];
                case 6:
                    _a.sent();
                    return [3, 8];
                case 7:
                    err_2 = _a.sent();
                    debug(err_2);
                    return [3, 8];
                case 8:
                    if (publication.LCP.Encryption &&
                        publication.LCP.Encryption.UserKey &&
                        publication.LCP.Encryption.UserKey.TextHint) {
                        lcpHint = publication.LCP.Encryption.UserKey.TextHint;
                    }
                    if (!lcpHint) {
                        lcpHint = "LCP passphrase";
                    }
                    _a.label = 9;
                case 9:
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
                    urlEncoded = UrlUtils_1.encodeURIComponent_RFC3986(publicationUrl);
                    fullUrl = "file://" + __dirname + "/../renderer/index.html?pub=" + urlEncoded;
                    if (lcpHint) {
                        fullUrl = fullUrl + "&lcpHint=" + UrlUtils_1.encodeURIComponent_RFC3986(lcpHint);
                    }
                    debug(fullUrl);
                    electronBrowserWindow.webContents.loadURL(fullUrl, { extraHeaders: "pragma: no-cache\n" });
                    return [2];
            }
        });
    });
}
sessions_1.initSessions();
electron_1.app.on("ready", function () {
    debug("app ready");
    (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var err_4, pubPaths, err_5;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, filehound.create()
                            .paths(DEFAULT_BOOK_PATH)
                            .ext([".epub", ".epub3", ".cbz", ".lcpl"])
                            .find()];
                case 1:
                    _publicationsFilePaths = _a.sent();
                    return [3, 3];
                case 2:
                    err_4 = _a.sent();
                    debug(err_4);
                    return [3, 3];
                case 3:
                    debug(_publicationsFilePaths);
                    _publicationsServer = new server_1.Server({
                        disableDecryption: false,
                        disableReaders: false,
                    });
                    lcp_2.installLcpHandler(_publicationsServer, lsd_deviceid_manager_1.deviceIDManager);
                    readium_css_1.setupReadiumCSS(_publicationsServer, path.join(process.cwd(), "dist/ReadiumCSS"));
                    pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4, portfinder.getPortPromise()];
                case 5:
                    _publicationsServerPort = _a.sent();
                    return [3, 7];
                case 6:
                    err_5 = _a.sent();
                    debug(err_5);
                    return [3, 7];
                case 7:
                    _publicationsRootUrl = _publicationsServer.start(_publicationsServerPort);
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
                                    console.log("args:");
                                    console.log(args);
                                    if (args && args.length && args[0]) {
                                        argPath = args[0].trim();
                                        filePath = argPath;
                                        console.log(filePath);
                                        if (!fs.existsSync(filePath)) {
                                            filePath = path.join(__dirname, argPath);
                                            console.log(filePath);
                                            if (!fs.existsSync(filePath)) {
                                                filePath = path.join(process.cwd(), argPath);
                                                console.log(filePath);
                                                if (!fs.existsSync(filePath)) {
                                                    console.log("FILEPATH DOES NOT EXIST: " + filePath);
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
                                            console.log(filePath);
                                            filePathToLoadOnLaunch = filePath;
                                        }
                                    }
                                    if (!filePathToLoadOnLaunch) return [3, 2];
                                    return [4, openFileDownload(filePathToLoadOnLaunch)];
                                case 1:
                                    _a.sent();
                                    return [2];
                                case 2:
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
        var _this = this;
        var dir, ext, filename, destFileName, epubFilePath, err_6, result_1;
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
                    err_6 = _a.sent();
                    process.nextTick(function () {
                        var detail = (typeof err_6 === "string") ?
                            err_6 :
                            (err_6.toString ? err_6.toString() : "ERROR!?");
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
                        publicationPaths = _publicationsServer.addPublications([filePath]);
                        debug(publicationPaths);
                        _publicationsFilePaths.push(filePath);
                        debug(_publicationsFilePaths);
                        _publicationsUrls.push("" + _publicationsRootUrl + publicationPaths[0]);
                        debug(_publicationsUrls);
                        n = _publicationsFilePaths.length - 1;
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