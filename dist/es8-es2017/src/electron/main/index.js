"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const url_1 = require("url");
const status_document_processing_1 = require("r2-lcp-js/dist/es8-es2017/src/lsd/status-document-processing");
const lcp_1 = require("r2-lcp-js/dist/es8-es2017/src/parser/epub/lcp");
const lcp_2 = require("r2-lcp-js/dist/es8-es2017/src/parser/epub/lcp");
const publication_download_1 = require("r2-lcp-js/dist/es8-es2017/src/publication-download");
const readium_css_settings_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/common/readium-css-settings");
const sessions_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/common/sessions");
const browser_window_tracker_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/browser-window-tracker");
const lsd_injectlcpl_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/lsd-injectlcpl");
const readium_css_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/readium-css");
const sessions_2 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/sessions");
const init_globals_1 = require("r2-opds-js/dist/es8-es2017/src/opds/init-globals");
const init_globals_2 = require("r2-shared-js/dist/es8-es2017/src/init-globals");
const publication_1 = require("r2-shared-js/dist/es8-es2017/src/models/publication");
const epub_1 = require("r2-shared-js/dist/es8-es2017/src/parser/epub");
const server_1 = require("r2-streamer-js/dist/es8-es2017/src/http/server");
const UrlUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/http/UrlUtils");
const UrlUtils_2 = require("r2-utils-js/dist/es8-es2017/src/_utils/http/UrlUtils");
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const zip_ex_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/zip/zip-ex");
const debug_ = require("debug");
const electron_1 = require("electron");
const express = require("express");
const filehound = require("filehound");
const portfinder = require("portfinder");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_x_1 = require("ta-json-x");
const events_1 = require("../common/events");
const store_electron_1 = require("../common/store-electron");
const lcp_3 = require("./lcp");
const lsd_1 = require("./lsd");
const lsd_deviceid_manager_1 = require("./lsd-deviceid-manager");
const zip_ex_http_1 = require("./zip-ex-http");
const SECURE = false;
const electronStoreLSD = new store_electron_1.StoreElectron("readium2-testapp-lsd", {});
const deviceIDManager = lsd_deviceid_manager_1.getDeviceIDManager(electronStoreLSD, "Readium2 Electron desktop app");
init_globals_1.initGlobalConverters_OPDS();
init_globals_2.initGlobalConverters_SHARED();
init_globals_2.initGlobalConverters_GENERIC();
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const lcpPluginPath = IS_DEV ?
    path.join(process.cwd(), "LCP", "lcp.node") :
    path.join(__dirname, "lcp.node");
lcp_2.setLcpNativePluginPath(lcpPluginPath);
const debug = debug_("r2:testapp#electron/main/index");
let _publicationsServer;
let _publicationsServerPort;
let _publicationsRootUrl;
let _publicationsFilePaths;
let _publicationsUrls;
let DEFAULT_BOOK_PATH = path.join(IS_DEV ? process.cwd() : __dirname, "misc", "epubs");
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
let _lastBookPath;
function openAllDevTools() {
    for (const wc of electron_1.webContents.getAllWebContents()) {
        wc.openDevTools();
    }
}
electron_1.ipcMain.on(events_1.R2_EVENT_DEVTOOLS, (_event, _arg) => {
    openAllDevTools();
});
function isManifestJSON(urlOrPath) {
    let p = urlOrPath;
    if (UrlUtils_2.isHTTP(urlOrPath)) {
        const url = new url_1.URL(urlOrPath);
        p = url.pathname;
    }
    return /manifest\.json$/.test(p);
}
async function createElectronBrowserWindow(publicationFilePath, publicationUrl) {
    debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);
    let lcpHint;
    let publication;
    if (isManifestJSON(publicationFilePath)) {
        const failure = async (err) => {
            debug(err);
        };
        const handleLCP = (responseStr, pub) => {
            const responseJson = global.JSON.parse(responseStr);
            debug(responseJson);
            let lcpl;
            lcpl = ta_json_x_1.JSON.deserialize(responseJson, lcp_1.LCP);
            lcpl.ZipPath = "META-INF/license.lcpl";
            lcpl.JsonSource = responseStr;
            lcpl.init();
            pub.LCP = lcpl;
        };
        const successLCP = async (response, pub) => {
            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                await failure("HTTP CODE " + response.statusCode);
                return;
            }
            let responseStr;
            if (response.body) {
                debug("RES BODY");
                responseStr = response.body;
            }
            else {
                debug("RES STREAM");
                let responseData;
                try {
                    responseData = await BufferUtils_1.streamToBufferPromise(response);
                }
                catch (err) {
                    debug(err);
                    return;
                }
                responseStr = responseData.toString("utf8");
            }
            handleLCP(responseStr, pub);
        };
        const needsStreamingResponse = true;
        const handleManifestJson = async (responseStr) => {
            const manifestJson = global.JSON.parse(responseStr);
            debug(manifestJson);
            if (UrlUtils_2.isHTTP(publicationFilePath)) {
                const arrLinks = [];
                if (manifestJson.readingOrder) {
                    arrLinks.push(...manifestJson.readingOrder);
                }
                if (manifestJson.resources) {
                    arrLinks.push(...manifestJson.resources);
                }
                arrLinks.forEach((link) => {
                    if (link.properties && link.properties.encrypted &&
                        (link.properties.encrypted.algorithm === "http://www.idpf.org/2008/embedding" ||
                            link.properties.encrypted.algorithm === "http://ns.adobe.com/pdf/enc#RC")) {
                        delete link.properties.encrypted;
                        let atLeastOne = false;
                        const jsonProps = Object.keys(link.properties);
                        if (jsonProps) {
                            jsonProps.forEach((jsonProp) => {
                                if (link.properties.hasOwnProperty(jsonProp)) {
                                    atLeastOne = true;
                                    return false;
                                }
                                return true;
                            });
                        }
                        if (!atLeastOne) {
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
                return;
            }
            debug(publication);
            let p = publicationFilePath;
            if (UrlUtils_2.isHTTP(publicationFilePath)) {
                const url = new url_1.URL(publicationFilePath);
                p = url.pathname;
            }
            publication.AddToInternal("filename", path.basename(p));
            publication.AddToInternal("type", "epub");
            if (!UrlUtils_2.isHTTP(publicationFilePath)) {
                const dirPath = path.dirname(publicationFilePath);
                const zip = await zip_ex_1.ZipExploded.loadPromise(dirPath);
                publication.AddToInternal("zip", zip);
            }
            else {
                const url = new url_1.URL(publicationFilePath);
                const dirPath = path.dirname(p);
                url.pathname = dirPath;
                const zip = await zip_ex_http_1.ZipExplodedHTTP.loadPromise(url.toString());
                publication.AddToInternal("zip", zip);
            }
            const pathDecoded = publicationFilePath;
            debug("ADDED HTTP pub to server cache: " + pathDecoded + " --- " + publicationFilePath);
            const publicationUrls = _publicationsServer.addPublications([pathDecoded]);
            _publicationsServer.cachePublication(pathDecoded, publication);
            const pubCheck = _publicationsServer.cachedPublication(pathDecoded);
            if (!pubCheck) {
                debug("PUB CHECK FAIL?");
            }
            publicationUrl = `${_publicationsServer.serverUrl()}${publicationUrls[0]}`;
            debug(publicationUrl);
            if (publication.Links) {
                const licenseLink = publication.Links.find((link) => {
                    return link.Rel.indexOf("license") >= 0 &&
                        link.TypeLink === "application/vnd.readium.lcp.license.v1.0+json";
                });
                if (licenseLink && licenseLink.Href) {
                    let lcplHref = licenseLink.Href;
                    if (!UrlUtils_2.isHTTP(lcplHref)) {
                        lcplHref = publicationFilePath.replace("manifest.json", licenseLink.Href);
                    }
                    debug(lcplHref);
                    if (UrlUtils_2.isHTTP(lcplHref)) {
                        if (needsStreamingResponse) {
                            const promise = new Promise((resolve, reject) => {
                                request.get({
                                    headers: {},
                                    method: "GET",
                                    uri: lcplHref,
                                })
                                    .on("response", async (responsez) => {
                                    await successLCP(responsez, publication);
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
                                return;
                            }
                        }
                        else {
                            let responsez;
                            try {
                                responsez = await requestPromise({
                                    headers: {},
                                    method: "GET",
                                    resolveWithFullResponse: true,
                                    uri: lcplHref,
                                });
                            }
                            catch (err) {
                                await failure(err);
                                return;
                            }
                            await successLCP(responsez, publication);
                        }
                    }
                    else {
                        const responsezStr = fs.readFileSync(lcplHref, { encoding: "utf8" });
                        if (!responsezStr) {
                            await failure("Cannot read local file: " + lcplHref);
                            return;
                        }
                        handleLCP(responsezStr, publication);
                    }
                }
            }
        };
        if (UrlUtils_2.isHTTP(publicationFilePath)) {
            const success = async (response) => {
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    await failure("HTTP CODE " + response.statusCode);
                    return;
                }
                let responseStr;
                if (response.body) {
                    debug("RES BODY");
                    responseStr = response.body;
                }
                else {
                    debug("RES STREAM");
                    let responseData;
                    try {
                        responseData = await BufferUtils_1.streamToBufferPromise(response);
                    }
                    catch (err) {
                        debug(err);
                        return;
                    }
                    responseStr = responseData.toString("utf8");
                }
                await handleManifestJson(responseStr);
            };
            if (needsStreamingResponse) {
                const promise = new Promise((resolve, reject) => {
                    request.get({
                        headers: {},
                        method: "GET",
                        uri: publicationFilePath,
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
                    return;
                }
            }
            else {
                let response;
                try {
                    response = await requestPromise({
                        headers: {},
                        method: "GET",
                        resolveWithFullResponse: true,
                        uri: publicationFilePath,
                    });
                }
                catch (err) {
                    await failure(err);
                    return;
                }
                await success(response);
            }
        }
        else {
            const responseStr = fs.readFileSync(publicationFilePath, { encoding: "utf8" });
            if (!responseStr) {
                await failure("Cannot read local file: " + publicationFilePath);
                return;
            }
            await handleManifestJson(responseStr);
        }
    }
    else if (epub_1.isEPUBlication(publicationFilePath)) {
        try {
            publication = await _publicationsServer.loadOrGetCachedPublication(publicationFilePath);
        }
        catch (err) {
            debug(err);
            return;
        }
    }
    if (publication && publication.LCP) {
        debug(publication.LCP);
        try {
            await status_document_processing_1.launchStatusDocumentProcessing(publication.LCP, deviceIDManager, async (licenseUpdateJson) => {
                debug("launchStatusDocumentProcessing DONE.");
                if (licenseUpdateJson) {
                    let res;
                    try {
                        res = await lsd_injectlcpl_1.lsdLcpUpdateInject(licenseUpdateJson, publication, publicationFilePath);
                        debug("EPUB SAVED: " + res);
                    }
                    catch (err) {
                        debug(err);
                    }
                }
            });
        }
        catch (err) {
            debug(err);
        }
        if (publication.LCP.Encryption &&
            publication.LCP.Encryption.UserKey &&
            publication.LCP.Encryption.UserKey.TextHint) {
            lcpHint = publication.LCP.Encryption.UserKey.TextHint;
        }
        if (!lcpHint) {
            lcpHint = "LCP passphrase";
        }
    }
    const electronBrowserWindow = new electron_1.BrowserWindow({
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
    electronBrowserWindow.webContents.on("dom-ready", () => {
        debug("electronBrowserWindow dom-ready " + publicationFilePath + " : " + publicationUrl);
    });
    if (SECURE && UrlUtils_2.isHTTP(publicationUrl)) {
        publicationUrl = sessions_1.convertHttpUrlToCustomScheme(publicationUrl);
    }
    const urlEncoded = UrlUtils_1.encodeURIComponent_RFC3986(publicationUrl);
    let htmlPath = IS_DEV ? `${__dirname}/../renderer/index.html` : `${__dirname}/index.html`;
    htmlPath = htmlPath.replace(/\\/g, "/");
    let fullUrl = `file://${htmlPath}?pub=${urlEncoded}`;
    if (lcpHint) {
        fullUrl = fullUrl + "&lcpHint=" + UrlUtils_1.encodeURIComponent_RFC3986(lcpHint);
    }
    const urlRoot = _publicationsServer.serverUrl();
    fullUrl = fullUrl + "&pubServerRoot=" + UrlUtils_1.encodeURIComponent_RFC3986(urlRoot);
    debug(fullUrl);
    electronBrowserWindow.webContents.loadURL(fullUrl, { extraHeaders: "pragma: no-cache\n" });
}
sessions_2.initSessions();
function isFixedLayout(publication, link) {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}
const readiumCssDefaultsJson = readium_css_settings_1.readiumCSSDefaults;
const readiumCssKeys = Object.keys(readium_css_settings_1.readiumCSSDefaults);
readiumCssKeys.forEach((key) => {
    const value = readium_css_settings_1.readiumCSSDefaults[key];
    if (typeof value === "undefined") {
        readiumCssDefaultsJson[key] = null;
    }
    else {
        readiumCssDefaultsJson[key] = value;
    }
});
const electronStore = new store_electron_1.StoreElectron("readium2-testapp", {
    basicLinkTitles: true,
    readiumCSS: readiumCssDefaultsJson,
    readiumCSSEnable: false,
});
function __computeReadiumCssJsonMessage(publication, link) {
    if (isFixedLayout(publication, link)) {
        return { setCSS: undefined, isFixedLayout: true };
    }
    const pubServerRoot = _publicationsServer.serverUrl();
    const on = electronStore.get("readiumCSSEnable");
    if (on) {
        let cssJson = electronStore.get("readiumCSS");
        if (!cssJson) {
            cssJson = readium_css_settings_1.readiumCSSDefaults;
        }
        const jsonMsg = {
            setCSS: cssJson,
            urlRoot: pubServerRoot,
        };
        return jsonMsg;
    }
    else {
        return { setCSS: undefined };
    }
}
electron_1.app.on("ready", () => {
    debug("app ready");
    (async () => {
        try {
            _publicationsFilePaths = await filehound.create()
                .depth(0)
                .ignoreHiddenDirectories()
                .ignoreHiddenFiles()
                .paths(DEFAULT_BOOK_PATH)
                .ext([".epub", ".epub3", ".cbz", ".lcpl"])
                .find();
        }
        catch (err) {
            debug(err);
        }
        debug(_publicationsFilePaths);
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
        const readiumCSSPath = IS_DEV ?
            path.join(process.cwd(), "dist", "ReadiumCSS").replace(/\\/g, "/") :
            path.join(__dirname, "ReadiumCSS").replace(/\\/g, "/");
        readium_css_1.setupReadiumCSS(_publicationsServer, readiumCSSPath, __computeReadiumCssJsonMessage);
        if (IS_DEV) {
            let preloadPath = "FOLDER_PATH_TO/preload.js";
            let distTarget;
            const dirnameSlashed = __dirname.replace(/\\/g, "/");
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
            const staticOptions = {
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
        const pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);
        try {
            _publicationsServerPort = await portfinder.getPortPromise();
        }
        catch (err) {
            debug(err);
        }
        await _publicationsServer.start(_publicationsServerPort, SECURE);
        _publicationsRootUrl = _publicationsServer.serverUrl();
        debug(_publicationsRootUrl);
        _publicationsUrls = pubPaths.map((pubPath) => {
            return `${_publicationsRootUrl}${pubPath}`;
        });
        debug(_publicationsUrls);
        resetMenu();
        process.nextTick(async () => {
            const args = process.argv.slice(2);
            debug("args:");
            debug(args);
            let filePathToLoadOnLaunch;
            if (args && args.length && args[0]) {
                const argPath = args[0].trim();
                let filePath = argPath;
                debug(filePath);
                if (UrlUtils_2.isHTTP(filePath)) {
                    await openFile(filePath);
                    return;
                }
                else {
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
                }
            }
            if (filePathToLoadOnLaunch) {
                if (epub_1.isEPUBlication(filePathToLoadOnLaunch) || isManifestJSON(filePathToLoadOnLaunch)) {
                    await openFile(filePathToLoadOnLaunch);
                    return;
                }
                else if (!fs.lstatSync(filePathToLoadOnLaunch).isDirectory()) {
                    await openFileDownload(filePathToLoadOnLaunch);
                    return;
                }
            }
            const detail = "Note that this is only a developer application (" +
                "test framework) for the Readium2 NodeJS 'streamer' and Electron-based 'navigator'.";
            const message = "Use the 'Electron' menu to load publications.";
            if (process.platform === "darwin") {
                const choice = electron_1.dialog.showMessageBox({
                    buttons: ["&OK"],
                    cancelId: 0,
                    defaultId: 0,
                    detail,
                    message,
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
                const html = `<html><h2>${message}<hr>${detail}</h2></html>`;
                const electronBrowserWindow = new electron_1.BrowserWindow({
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
        });
    })();
});
function resetMenu() {
    const menuTemplate = [
        {
            label: "Readium2 Electron",
            submenu: [
                {
                    accelerator: "Command+Q",
                    click: () => { electron_1.app.quit(); },
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
                    click: () => {
                        openAllDevTools();
                    },
                    label: "Open Dev Tools",
                },
            ],
        },
    ];
    menuTemplate[1].submenu.push({
        click: async () => {
            const choice = electron_1.dialog.showOpenDialog({
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
                return;
            }
            const filePath = choice[0];
            debug(filePath);
            await openFileDownload(filePath);
        },
        label: "Load file...",
    });
    _publicationsUrls.forEach((pubManifestUrl, n) => {
        const filePath = _publicationsFilePaths[n];
        debug("MENU ITEM: " + filePath + " : " + pubManifestUrl);
        menuTemplate[1].submenu.push({
            click: async () => {
                debug(filePath);
                await openFileDownload(filePath);
            },
            label: filePath,
        });
    });
    const menu = electron_1.Menu.buildFromTemplate(menuTemplate);
    electron_1.Menu.setApplicationMenu(menu);
}
async function openFileDownload(filePath) {
    const dir = path.dirname(filePath);
    _lastBookPath = dir;
    debug(_lastBookPath);
    const ext = path.extname(filePath);
    const filename = path.basename(filePath);
    const destFileName = filename + ".epub";
    if (ext === ".lcpl") {
        let epubFilePath;
        try {
            epubFilePath = await publication_download_1.downloadEPUBFromLCPL(filePath, dir, destFileName);
        }
        catch (err) {
            process.nextTick(() => {
                const detail = (typeof err === "string") ?
                    err :
                    (err.toString ? err.toString() : "ERROR!?");
                const message = "LCP EPUB download fail!]";
                const res = electron_1.dialog.showMessageBox({
                    buttons: ["&OK"],
                    cancelId: 0,
                    defaultId: 0,
                    detail,
                    message,
                    noLink: true,
                    normalizeAccessKeys: true,
                    title: "Readium2 Electron streamer / navigator",
                    type: "info",
                });
                if (res === 0) {
                    debug("ok");
                }
            });
            return;
        }
        const result = epubFilePath;
        process.nextTick(async () => {
            const detail = result[0] + " ---- [" + result[1] + "]";
            const message = "LCP EPUB file download success [" + destFileName + "]";
            const res = electron_1.dialog.showMessageBox({
                buttons: ["&OK"],
                cancelId: 0,
                defaultId: 0,
                detail,
                message,
                noLink: true,
                normalizeAccessKeys: true,
                title: "Readium2 Electron streamer / navigator",
                type: "info",
            });
            if (res === 0) {
                debug("ok");
            }
            await openFile(result[0]);
        });
    }
    else {
        await openFile(filePath);
    }
}
async function openFile(filePath) {
    let n = _publicationsFilePaths.indexOf(filePath);
    if (n < 0) {
        if (isManifestJSON(filePath)) {
            _publicationsFilePaths.push(filePath);
            debug(_publicationsFilePaths);
            _publicationsUrls.push(decodeURIComponent(filePath));
            debug(_publicationsUrls);
            n = _publicationsFilePaths.length - 1;
        }
        else {
            const publicationPaths = _publicationsServer.addPublications([filePath]);
            debug(publicationPaths);
            _publicationsFilePaths.push(filePath);
            debug(_publicationsFilePaths);
            _publicationsUrls.push(`${_publicationsRootUrl}${publicationPaths[0]}`);
            debug(_publicationsUrls);
            n = _publicationsFilePaths.length - 1;
        }
        process.nextTick(() => {
            resetMenu();
        });
    }
    const file = _publicationsFilePaths[n];
    const pubManifestUrl = _publicationsUrls[n];
    await createElectronBrowserWindow(file, pubManifestUrl);
}
electron_1.app.on("activate", () => {
    debug("app activate");
});
electron_1.app.on("before-quit", () => {
    debug("app before quit");
});
electron_1.app.on("window-all-closed", () => {
    debug("app window-all-closed");
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("quit", () => {
    debug("app quit");
    _publicationsServer.stop();
});
//# sourceMappingURL=index.js.map