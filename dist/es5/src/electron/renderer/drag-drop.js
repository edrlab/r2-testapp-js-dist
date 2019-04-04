"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var electron_1 = require("electron");
var events_1 = require("../common/events");
function setupDragDrop() {
    window.document.addEventListener("dragover", function (ev) {
        ev.preventDefault();
        return false;
    }, false);
    window.document.addEventListener("drop", function (ev) {
        var e_1, _a, e_2, _b;
        ev.preventDefault();
        if (!ev.dataTransfer) {
            return;
        }
        var urlOrPath;
        if (ev.dataTransfer.items) {
            try {
                for (var _c = tslib_1.__values(ev.dataTransfer.items), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var item = _d.value;
                    if (item.kind === "file") {
                        var file = item.getAsFile();
                        if (file) {
                            console.log(file.name);
                            console.log(file.path);
                            urlOrPath = file.path;
                            break;
                        }
                    }
                    else if (item.kind === "string") {
                        if (item.type === "text/plain") {
                            var data = ev.dataTransfer.getData(item.type);
                            console.log(data);
                            urlOrPath = data;
                        }
                        else {
                            console.log(item.type);
                            console.log(ev.dataTransfer.getData(item.type));
                        }
                    }
                    else {
                        console.log(item.kind);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        else if (ev.dataTransfer.files) {
            try {
                for (var _e = tslib_1.__values(ev.dataTransfer.files), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var file = _f.value;
                    console.log(file.name);
                    console.log(file.path);
                    urlOrPath = file.path;
                    break;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        if (urlOrPath) {
            var payload = {
                urlOrPath: urlOrPath,
            };
            electron_1.ipcRenderer.send(events_1.R2_EVENT_OPEN_URL_OR_PATH, payload);
        }
    }, false);
}
exports.setupDragDrop = setupDragDrop;
//# sourceMappingURL=drag-drop.js.map