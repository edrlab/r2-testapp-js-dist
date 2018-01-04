"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("../common/events");
let _electronBrowserWindows;
function trackBrowserWindow(win) {
    if (!_electronBrowserWindows) {
        _electronBrowserWindows = [];
    }
    _electronBrowserWindows.push(win);
    win.on("closed", () => {
        const i = _electronBrowserWindows.indexOf(win);
        if (i < 0) {
            return;
        }
        _electronBrowserWindows.splice(i, 1);
    });
}
exports.trackBrowserWindow = trackBrowserWindow;
electron_1.app.on("web-contents-created", (_evt, wc) => {
    if (!wc.hostWebContents) {
        return;
    }
    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (wc.hostWebContents.id === win.webContents.id) {
            console.log("WEBVIEW web-contents-created");
            wc.on("will-navigate", (event, url) => {
                console.log("webview.getWebContents().on('will-navigate'");
                console.log(url);
                const wcUrl = event.sender.getURL();
                console.log(wcUrl);
                event.preventDefault();
                win.webContents.send(events_1.R2_EVENT_LINK, url);
            });
        }
    });
});
//# sourceMappingURL=browser-window-tracker.js.map