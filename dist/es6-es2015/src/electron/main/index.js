"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const url_1 = require("url");
const status_document_processing_1 = require("r2-lcp-js/dist/es6-es2015/src/lsd/status-document-processing");
const lcp_1 = require("r2-lcp-js/dist/es6-es2015/src/parser/epub/lcp");
const lcp_2 = require("r2-lcp-js/dist/es6-es2015/src/parser/epub/lcp");
const publication_download_1 = require("r2-lcp-js/dist/es6-es2015/src/publication-download");
const readium_css_settings_1 = require("r2-navigator-js/dist/es6-es2015/src/electron/common/readium-css-settings");
const sessions_1 = require("r2-navigator-js/dist/es6-es2015/src/electron/common/sessions");
const browser_window_tracker_1 = require("r2-navigator-js/dist/es6-es2015/src/electron/main/browser-window-tracker");
const lsd_injectlcpl_1 = require("r2-navigator-js/dist/es6-es2015/src/electron/main/lsd-injectlcpl");
const readium_css_1 = require("r2-navigator-js/dist/es6-es2015/src/electron/main/readium-css");
const sessions_2 = require("r2-navigator-js/dist/es6-es2015/src/electron/main/sessions");
const init_globals_1 = require("r2-opds-js/dist/es6-es2015/src/opds/init-globals");
const init_globals_2 = require("r2-shared-js/dist/es6-es2015/src/init-globals");
const publication_1 = require("r2-shared-js/dist/es6-es2015/src/models/publication");
const epub_1 = require("r2-shared-js/dist/es6-es2015/src/parser/epub");
const server_1 = require("r2-streamer-js/dist/es6-es2015/src/http/server");
const UrlUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const UrlUtils_2 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const BufferUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/stream/BufferUtils");
const zip_ex_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/zip/zip-ex");
const zip_ex_http_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/zip/zip-ex-http");
const debug_ = require("debug");
const electron_1 = require("electron");
const express = require("express");
const portfinder = require("portfinder");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_x_1 = require("ta-json-x");
const uuid = require("uuid");
const events_1 = require("../common/events");
const store_electron_1 = require("../common/store-electron");
const lcp_3 = require("./lcp");
const lsd_1 = require("./lsd");
const lsd_deviceid_manager_1 = require("./lsd-deviceid-manager");
const SECURE = true;
const electronStoreLSD = new store_electron_1.StoreElectron("readium2-testapp-lsd", {});
const deviceIDManager = lsd_deviceid_manager_1.getDeviceIDManager(electronStoreLSD, "Readium2 Electron desktop app");
electron_1.ipcMain.on("R2_EVENT_LCP_LSD_OPEN_SETTINGS", (_event, _arg) => {
    if (electronStoreLSD.reveal) {
        electronStoreLSD.reveal();
    }
});
init_globals_1.initGlobalConverters_OPDS();
init_globals_2.initGlobalConverters_SHARED();
init_globals_2.initGlobalConverters_GENERIC();
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const lcpPluginPath = IS_DEV ?
    path.join(process.cwd(), "LCP", "lcp.node") :
    path.join(__dirname, "lcp.node");
lcp_1.setLcpNativePluginPath(lcpPluginPath);
const debug = debug_("r2:testapp#electron/main/index");
let _publicationsServer;
let _publicationsServerPort;
let _publicationsRootUrl;
let _publicationsFilePaths;
let _publicationsUrls;
let _lastBookPath;
function openAllDevTools() {
    for (const wc of electron_1.webContents.getAllWebContents()) {
        wc.openDevTools({ mode: "detach" });
    }
}
function openTopLevelDevTools() {
    const bw = electron_1.BrowserWindow.getFocusedWindow();
    if (bw) {
        bw.webContents.openDevTools({ mode: "detach" });
    }
    else {
        const arr = electron_1.BrowserWindow.getAllWindows();
        arr.forEach((bww) => {
            bww.webContents.openDevTools({ mode: "detach" });
        });
    }
}
electron_1.ipcMain.on(events_1.R2_EVENT_DEVTOOLS, (_event, _arg) => {
    openAllDevTools();
});
function isManifestJSON(urlOrPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let p = urlOrPath;
        if (UrlUtils_1.isHTTP(urlOrPath)) {
            const url = new url_1.URL(urlOrPath);
            p = url.pathname;
            const promise = new Promise((resolve, reject) => {
                const isHTTPS = urlOrPath.startsWith("https://");
                const options = {
                    host: url.host,
                    method: "HEAD",
                    path: urlOrPath.substr(urlOrPath.indexOf(url.pathname)),
                };
                debug(options);
                (isHTTPS ? https : http).request(options, (response) => {
                    debug(response.statusCode);
                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                        reject("STATUS: " + response.statusCode);
                        return;
                    }
                    debug(response.headers);
                    debug(response.headers["content-type"]);
                    const okay = response.headers["content-type"] &&
                        (response.headers["content-type"].indexOf("application/webpub+json") >= 0 ||
                            response.headers["content-type"].indexOf("application/audiobook+json") >= 0 ||
                            response.headers["content-type"].indexOf("application/json") >= 0);
                    resolve(okay);
                }).on("error", (err) => {
                    reject(err);
                }).end();
            });
            let ok;
            try {
                ok = yield promise;
                debug("########### IS MANIFEST (HTTP): " + ok);
                return ok;
            }
            catch (err) {
                debug(err);
            }
        }
        const isMan = /.*manifest\.json[\?]?.*/.test(p);
        debug("########### IS MANIFEST: " + isMan);
        return isMan;
    });
}
function tryLSD(publication, publicationFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield status_document_processing_1.launchStatusDocumentProcessing(publication.LCP, deviceIDManager, (licenseUpdateJson) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    debug("launchStatusDocumentProcessing DONE.");
                    if (licenseUpdateJson) {
                        let res;
                        try {
                            res = yield lsd_injectlcpl_1.lsdLcpUpdateInject(licenseUpdateJson, publication, publicationFilePath);
                            debug("EPUB LCP INJECTED: " + res);
                            try {
                                yield tryLSD(publication, publicationFilePath);
                                resolve(true);
                            }
                            catch (err) {
                                debug(err);
                                reject(err);
                            }
                        }
                        catch (err) {
                            debug(err);
                            reject(err);
                        }
                    }
                    else {
                        resolve(true);
                    }
                }));
            }
            catch (err) {
                debug(err);
                reject(err);
            }
        }));
    });
}
function createElectronBrowserWindow(publicationFilePath, publicationUrl) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);
        let lcpHint;
        let publication;
        const isWebPub = yield isManifestJSON(publicationFilePath);
        const isHttpWebPub = isWebPub && UrlUtils_1.isHTTP(publicationFilePath);
        let isHttpWebPubWithoutLCP = isHttpWebPub;
        if (isWebPub) {
            const failure = (err) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                debug(err);
            });
            const handleLCP = (responseStr, pub) => {
                const responseJson = global.JSON.parse(responseStr);
                debug(responseJson);
                let lcpl;
                lcpl = ta_json_x_1.JSON.deserialize(responseJson, lcp_2.LCP);
                lcpl.ZipPath = "META-INF/license.lcpl";
                lcpl.JsonSource = responseStr;
                lcpl.init();
                pub.LCP = lcpl;
            };
            const successLCP = (response, pub) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    yield failure("HTTP CODE " + response.statusCode);
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
                        responseData = yield BufferUtils_1.streamToBufferPromise(response);
                    }
                    catch (err) {
                        debug(err);
                        return;
                    }
                    responseStr = responseData.toString("utf8");
                }
                handleLCP(responseStr, pub);
            });
            const needsStreamingResponse = true;
            const handleManifestJson = (responseStr) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const manifestJson = global.JSON.parse(responseStr);
                debug(manifestJson);
                if (UrlUtils_1.isHTTP(publicationFilePath)) {
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
                const licenseLink = publication.Links ? publication.Links.find((link) => {
                    return link.Rel.indexOf("license") >= 0 &&
                        link.TypeLink === "application/vnd.readium.lcp.license.v1.0+json";
                }) : undefined;
                isHttpWebPubWithoutLCP = isHttpWebPub && !licenseLink;
                let p = publicationFilePath;
                if (UrlUtils_1.isHTTP(publicationFilePath)) {
                    const url = new url_1.URL(publicationFilePath);
                    p = url.pathname;
                }
                publication.AddToInternal("filename", path.basename(p));
                publication.AddToInternal("type", "epub");
                if (!isHttpWebPubWithoutLCP) {
                    if (!UrlUtils_1.isHTTP(publicationFilePath)) {
                        const dirPath = path.dirname(publicationFilePath);
                        const zip = yield zip_ex_1.ZipExploded.loadPromise(dirPath);
                        publication.AddToInternal("zip", zip);
                    }
                    else {
                        const url = new url_1.URL(publicationFilePath);
                        const dirPath = path.dirname(p);
                        url.pathname = dirPath + "/";
                        const zip = yield zip_ex_http_1.ZipExplodedHTTP.loadPromise(url.toString());
                        publication.AddToInternal("zip", zip);
                    }
                }
                const pathDecoded = publicationFilePath;
                debug("ADDED HTTP pub to server cache: " + pathDecoded + " --- " + publicationFilePath);
                const publicationUrls = _publicationsServer.addPublications([pathDecoded]);
                _publicationsServer.cachePublication(pathDecoded, publication);
                const pubCheck = _publicationsServer.cachedPublication(pathDecoded);
                if (!pubCheck) {
                    debug("PUB CHECK FAIL?");
                }
                if (!isHttpWebPubWithoutLCP) {
                    publicationUrl = `${_publicationsServer.serverUrl()}${publicationUrls[0]}`;
                }
                debug(publicationUrl);
                if (licenseLink && licenseLink.Href) {
                    let lcplHref = licenseLink.Href;
                    if (!UrlUtils_1.isHTTP(lcplHref)) {
                        if (UrlUtils_1.isHTTP(publicationFilePath)) {
                            lcplHref = new url_1.URL(lcplHref, publicationFilePath).toString();
                        }
                        else {
                            lcplHref = publicationFilePath.replace("manifest.json", licenseLink.Href);
                        }
                    }
                    debug(lcplHref);
                    if (UrlUtils_1.isHTTP(lcplHref)) {
                        if (needsStreamingResponse) {
                            const promise = new Promise((resolve, reject) => {
                                request.get({
                                    headers: {},
                                    method: "GET",
                                    uri: lcplHref,
                                })
                                    .on("response", (responsez) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                    yield successLCP(responsez, publication);
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
                                return;
                            }
                        }
                        else {
                            let responsez;
                            try {
                                responsez = yield requestPromise({
                                    headers: {},
                                    method: "GET",
                                    resolveWithFullResponse: true,
                                    uri: lcplHref,
                                });
                            }
                            catch (err) {
                                yield failure(err);
                                return;
                            }
                            yield successLCP(responsez, publication);
                        }
                    }
                    else {
                        const responsezStr = fs.readFileSync(lcplHref, { encoding: "utf8" });
                        if (!responsezStr) {
                            yield failure("Cannot read local file: " + lcplHref);
                            return;
                        }
                        handleLCP(responsezStr, publication);
                    }
                }
            });
            if (UrlUtils_1.isHTTP(publicationFilePath)) {
                const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                        yield failure("HTTP CODE " + response.statusCode);
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
                            responseData = yield BufferUtils_1.streamToBufferPromise(response);
                        }
                        catch (err) {
                            debug(err);
                            return;
                        }
                        responseStr = responseData.toString("utf8");
                    }
                    yield handleManifestJson(responseStr);
                });
                if (needsStreamingResponse) {
                    const promise = new Promise((resolve, reject) => {
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: publicationFilePath,
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
                        return;
                    }
                }
                else {
                    let response;
                    try {
                        response = yield requestPromise({
                            headers: {},
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: publicationFilePath,
                        });
                    }
                    catch (err) {
                        yield failure(err);
                        return;
                    }
                    yield success(response);
                }
            }
            else {
                const responseStr = fs.readFileSync(publicationFilePath, { encoding: "utf8" });
                if (!responseStr) {
                    yield failure("Cannot read local file: " + publicationFilePath);
                    return;
                }
                yield handleManifestJson(responseStr);
            }
        }
        else if (epub_1.isEPUBlication(publicationFilePath)) {
            try {
                publication = yield _publicationsServer.loadOrGetCachedPublication(publicationFilePath);
            }
            catch (err) {
                debug(err);
                return;
            }
        }
        if (publication && publication.LCP) {
            debug(publication.LCP);
            try {
                yield tryLSD(publication, publicationFilePath);
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
        if (!isHttpWebPubWithoutLCP && SECURE && UrlUtils_1.isHTTP(publicationUrl)) {
            publicationUrl = sessions_1.convertHttpUrlToCustomScheme(publicationUrl);
        }
        const urlEncoded = UrlUtils_2.encodeURIComponent_RFC3986(publicationUrl);
        let htmlPath = IS_DEV ? `${__dirname}/../renderer/index.html` : `${__dirname}/index.html`;
        htmlPath = htmlPath.replace(/\\/g, "/");
        let fullUrl = `file://${htmlPath}?pub=${urlEncoded}`;
        if (lcpHint) {
            fullUrl = fullUrl + "&lcpHint=" + UrlUtils_2.encodeURIComponent_RFC3986(lcpHint);
        }
        const urlRoot = _publicationsServer.serverUrl();
        fullUrl = fullUrl + "&pubServerRoot=" + UrlUtils_2.encodeURIComponent_RFC3986(urlRoot);
        if (isHttpWebPubWithoutLCP) {
            fullUrl = fullUrl + "&isHttpWebPubWithoutLCP=1";
        }
        debug(fullUrl);
        electronBrowserWindow.webContents.loadURL(fullUrl, { extraHeaders: "pragma: no-cache\n" });
    });
}
sessions_2.initSessions();
const readiumCssDefaultsJson = Object.assign({}, readium_css_settings_1.readiumCSSDefaults);
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
function __computeReadiumCssJsonMessage(_publication, _link) {
    const on = electronStore.get("readiumCSSEnable");
    if (on) {
        let cssJson = electronStore.get("readiumCSS");
        if (!cssJson) {
            cssJson = readium_css_settings_1.readiumCSSDefaults;
        }
        const jsonMsg = {
            setCSS: cssJson,
        };
        return jsonMsg;
    }
    else {
        return { setCSS: undefined };
    }
}
let _electronBrowserWindowFileOrUrlDialog;
function loadFileOrUrlDialog(initval) {
    if (_electronBrowserWindowFileOrUrlDialog) {
        _electronBrowserWindowFileOrUrlDialog.show();
        debug("_electronBrowserWindowFileOrUrlDialog.show()");
        return;
    }
    const dialogid = uuid.v4().replace(/-/g, "_");
    const html = `
<html>
<head>
<script type="text/javascript">

const { ipcRenderer } = require('electron');

ipcRenderer.on("filePath", (ev, filePath) => {

    const dataEl = document.getElementById('data');
    dataEl.value = filePath;
});

const cancel = () => {
const payload = {
urlOrPath: undefined,
};
ipcRenderer.send("${events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid}", payload);
};
const submit = () => {
const dataEl = document.getElementById('data');
const payload = {
urlOrPath: dataEl.value,
};
ipcRenderer.send("${events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid}", payload);
};

window.addEventListener("DOMContentLoaded", () => {

document.getElementById('filechoose').addEventListener('click', () => {
    const payload = {
        urlOrPath: undefined,
        fileChooser: true,
    };
    ipcRenderer.send("${events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid}", payload);
});

document.getElementById('ok').addEventListener('click', () => submit());
document.getElementById('cancel').addEventListener('click', () => cancel());

const dataEl = document.getElementById('data');

dataEl.addEventListener('keyup', e => {
e.which = e.which || e.keyCode;
if (e.which === 13) {
    submit();
}
if (e.which === 27) {
    cancel();
}
});

dataEl.focus();
dataEl.select();

const drag = (ev) => {
ev.preventDefault();
return false;
};
const drop = (ev) => {
ev.preventDefault();

if (!ev.dataTransfer) {
    return;
}

let urlOrPath = undefined;
if (ev.dataTransfer.items) {
    for (const item of ev.dataTransfer.items) {
        if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
                console.log(file.name);
                console.log(file.path);
                urlOrPath = file.path;
                break;
            }
        } else if (item.kind === "string") {
            if (item.type === "text/plain") { /* text/uri-list text/html */
                const data = ev.dataTransfer.getData(item.type);
                console.log(data);
                urlOrPath = data;
            } else {
                console.log(item.type);
                console.log(ev.dataTransfer.getData(item.type));
            }
        } else {
            console.log(item.kind);
        }
    }
} else if (ev.dataTransfer.files) {
    for (const file of ev.dataTransfer.files) {
        console.log(file.name);
        console.log(file.path);
        urlOrPath = file.path;
        break;
    }
}

if (urlOrPath) {
    const payload = {
        urlOrPath
    };
    ipcRenderer.send("${events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid}", payload);
}

};

window.document.addEventListener("dragover", drag, false);
window.document.addEventListener("drop", drag, false);

const dropEl = document.getElementById('drop');

dropEl.addEventListener("dragover", drag, false);
dropEl.addEventListener("drop", drop, false);
});

</script>
<style>
body {
font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
line-height: 1.5em;
color: #333;
background-color: #fff;
}

#container {
/* align-items: center;
justify-content: center; */
display: block;
overflow: hidden;
}

#form {
width: 100%;
}

#label {
max-width: 100%;
max-height: 100%;
margin-bottom: .8em;
padding: 0 .5em;
/* white-space: nowrap; */
/* overflow: hidden; */
/* text-overflow: ellipsis; */
}

#data {
border-radius: 2px;
background: #fff;
width: 400px;
padding: .4em .5em;
border: 1px solid black;
min-height: 2em;
margin: 0 0 1.2em;
}

#data-container {
text-align: center;
}

#buttons {
text-align: right;
padding: 0 .5em 0 0;
}

#filechoose,
#buttons > button {
border-radius: 2px;
border: 0;
margin: 0 0 0 .5em;
font-size: .8em;
line-height: 1em;
padding: .6em 1em;
cursor: pointer;
}

#filechoose {
    margin-right: 8px;
}
#filechoose, input {
    display: inline-block;
}

/*
#ok {
background-color: #3879D9;
color: white;
}

#cancel {
background-color: #DDD;
color: black;
}
*/

*:focus {
outline-style: solid !important;
outline-width: 2px !important;
outline-color: blue !important;
outline-offset: 2px !important;
}

#drop {
display: block;
margin-top: 1em;
width: 99%;
height: 100px;
color: black;
background-color: #eeffee;
border: 1px dashed #333333;
border-radius: 8px;
vertical-align: middle;
text-align: center;

display: flex;
justify-content: center;
flex-direction: column;
}
</style>
</head>
<body>
<div id="container">
<div id="form">
<div id="label">Enter URL or filepath:</div>
<div id="data-container">
<button id="filechoose">Choose...</button>
<input id="data" value="${initval}"/>
</div>
<div id="buttons">
<button id="cancel">Cancel</button>
<button id="ok">OK</button>
</div>
</div>
<div id="drop">
file drag-and-drop
</div>
</div>
</body>
</html>
    `;
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (payload.urlOrPath) {
                process.nextTick(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield loadFileOrUrl(payload.urlOrPath);
                }));
                setTimeout(() => {
                    if (_electronBrowserWindowFileOrUrlDialog) {
                        _electronBrowserWindowFileOrUrlDialog.close();
                    }
                }, 200);
            }
            else if (payload.fileChooser) {
                process.nextTick(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const choice = electron_1.dialog.showOpenDialog({
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
                        return;
                    }
                    const filePath = choice[0];
                    debug(filePath);
                    if (_electronBrowserWindowFileOrUrlDialog) {
                        _electronBrowserWindowFileOrUrlDialog.webContents.send("filePath", filePath);
                    }
                }));
            }
            else {
                if (_electronBrowserWindowFileOrUrlDialog) {
                    _electronBrowserWindowFileOrUrlDialog.close();
                }
            }
        });
    }
    electron_1.ipcMain.on(events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid, dialogResult);
    _electronBrowserWindowFileOrUrlDialog.on("closed", (_ev) => {
        electron_1.ipcMain.removeListener(events_1.R2_EVENT_OPEN_URL_OR_PATH + dialogid, dialogResult);
        _electronBrowserWindowFileOrUrlDialog = undefined;
    });
    _electronBrowserWindowFileOrUrlDialog.webContents.loadURL("data:text/html," + html);
}
electron_1.ipcMain.on(events_1.R2_EVENT_OPEN_URL_OR_PATH, (_event, payload) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    yield loadFileOrUrl(payload.urlOrPath);
}));
function loadFileOrUrl(argPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let filePathToLoadOnLaunch;
        let filePath = argPath;
        debug(filePath);
        if (UrlUtils_1.isHTTP(filePath)) {
            yield openFile(filePath);
            return true;
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
        if (filePathToLoadOnLaunch) {
            if (epub_1.isEPUBlication(filePathToLoadOnLaunch) || (yield isManifestJSON(filePathToLoadOnLaunch))) {
                yield openFile(filePathToLoadOnLaunch);
                return true;
            }
            else if (!fs.lstatSync(filePathToLoadOnLaunch).isDirectory()) {
                yield openFileDownload(filePathToLoadOnLaunch);
                return true;
            }
        }
        return false;
    });
}
electron_1.app.on("ready", () => {
    debug("app ready");
    (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        try {
            _publicationsServerPort = yield portfinder.getPortPromise();
        }
        catch (err) {
            debug(err);
        }
        yield _publicationsServer.start(_publicationsServerPort, SECURE);
        _publicationsRootUrl = _publicationsServer.serverUrl();
        debug(_publicationsRootUrl);
        if (_publicationsFilePaths && _publicationsFilePaths.length) {
            const pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);
            _publicationsUrls = pubPaths.map((pubPath) => {
                return `${_publicationsRootUrl}${pubPath}`;
            });
            debug(_publicationsUrls);
        }
        resetMenu(undefined);
        process.nextTick(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const args = process.argv.slice(2);
            debug("args:");
            debug(args);
            if (args && args.length && args[0]) {
                const argPath = args[0].trim();
                if (yield loadFileOrUrl(argPath)) {
                    return;
                }
            }
            loadFileOrUrlDialog("");
        }));
    }))();
});
function resetMenu(browserWindow) {
    const menuTemplate = [
        {
            label: "Readium2 Electron",
            submenu: [
                { label: "About...", selector: "orderFrontStandardAboutPanel:" },
                { type: "separator" },
                {
                    accelerator: "Command+Q",
                    click: () => { electron_1.app.quit(); },
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
                    click: (_item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.reload();
                        }
                    },
                    label: "Reload",
                },
                {
                    accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
                    click: (_item, _focusedWindow) => {
                        openAllDevTools();
                    },
                    label: "Dev Tools (all)",
                },
                {
                    accelerator: process.platform === "darwin" ? "Shift+Alt+Command+I" : "Alt+Ctrl+Shift+I",
                    click: (_item, _focusedWindow) => {
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
                    click: (_item, _focusedWindow) => {
                        electron_1.shell.openExternal("https://github.com/readium/r2-testapp-js/");
                    },
                    label: "Website...",
                },
            ],
        },
    ];
    menuTemplate[1].submenu.push({
        accelerator: "CmdOrCtrl+O",
        click: () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            loadFileOrUrlDialog("");
        }),
        label: "Open...",
    });
    menuTemplate[1].submenu.push({
        type: "separator",
    });
    _publicationsUrls.forEach((pubManifestUrl, n) => {
        const filePath = _publicationsFilePaths[n];
        debug("MENU ITEM: " + filePath + " : " + pubManifestUrl);
        menuTemplate[1].submenu.push({
            click: () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                debug(filePath);
                yield openFileDownload(filePath);
            }),
            label: filePath,
        });
    });
    const menu = electron_1.Menu.buildFromTemplate(menuTemplate);
    if (browserWindow) {
        browserWindow.setMenu(menu);
    }
    else {
        electron_1.Menu.setApplicationMenu(menu);
    }
}
function openFileDownload(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const dir = path.dirname(filePath);
        _lastBookPath = dir;
        debug(_lastBookPath);
        const ext = path.extname(filePath);
        const filename = path.basename(filePath);
        const destFileName = filename + ".epub";
        if (ext === ".lcpl") {
            let epubFilePath;
            try {
                epubFilePath = yield publication_download_1.downloadEPUBFromLCPL(filePath, dir, destFileName);
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
            process.nextTick(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                yield openFile(result[0]);
            }));
        }
        else {
            yield openFile(filePath);
        }
    });
}
function openFile(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let n = _publicationsFilePaths.indexOf(filePath);
        if (n < 0) {
            if (yield isManifestJSON(filePath)) {
                _publicationsFilePaths.push(filePath);
                debug(_publicationsFilePaths);
                _publicationsUrls.push(filePath);
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
                resetMenu(undefined);
            });
        }
        const file = _publicationsFilePaths[n];
        const pubManifestUrl = _publicationsUrls[n];
        yield createElectronBrowserWindow(file, pubManifestUrl);
    });
}
electron_1.app.on("activate", () => {
    debug("app activate");
});
electron_1.app.on("before-quit", () => {
    debug("app before quit");
});
electron_1.app.on("window-all-closed", () => {
    debug("app window-all-closed");
    setTimeout(() => {
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
        }, (response, _checkboxChecked) => {
            if (response === 0) {
                electron_1.app.quit();
            }
            else {
                loadFileOrUrlDialog("");
            }
        });
    }, 300);
});
electron_1.app.on("quit", () => {
    debug("app quit");
    _publicationsServer.stop();
});
//# sourceMappingURL=index.js.map