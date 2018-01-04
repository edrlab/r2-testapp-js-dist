"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
function startServiceWorkerExperiment(publicationJsonUrl) {
    var _this = this;
    var webview2 = document.createElement("webview");
    webview2.setAttribute("id", "webview2");
    webview2.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview2.setAttribute("preload", "./sw/preload_service-worker.js");
    var readerChrome = document.getElementById("reader_chrome");
    if (readerChrome) {
        readerChrome.appendChild(webview2);
    }
    webview2.addEventListener("dom-ready", function () {
        webview2.openDevTools();
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2];
            });
        }); }, 2000);
    });
    var swBootUrl = publicationJsonUrl + "/../";
    console.log(swBootUrl);
    webview2.setAttribute("src", swBootUrl);
}
exports.startServiceWorkerExperiment = startServiceWorkerExperiment;
//# sourceMappingURL=index_service-worker.js.map