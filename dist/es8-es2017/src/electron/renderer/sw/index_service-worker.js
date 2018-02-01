"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function startServiceWorkerExperiment(publicationJsonUrl) {
    const webview2 = document.createElement("webview");
    webview2.setAttribute("id", "webview2");
    webview2.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview2.setAttribute("preload", "./sw/preload_service-worker.js");
    const readerChrome = document.getElementById("reader_chrome");
    if (readerChrome) {
        readerChrome.appendChild(webview2);
    }
    webview2.addEventListener("dom-ready", () => {
        webview2.openDevTools();
        setTimeout(async () => {
        }, 2000);
    });
    const swBootUrl = publicationJsonUrl + "/../";
    console.log(swBootUrl);
    webview2.setAttribute("src", swBootUrl);
}
exports.startServiceWorkerExperiment = startServiceWorkerExperiment;
//# sourceMappingURL=index_service-worker.js.map