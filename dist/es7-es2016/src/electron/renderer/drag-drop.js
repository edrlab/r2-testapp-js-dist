"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("../common/events");
function setupDragDrop() {
    window.document.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        return false;
    }, false);
    window.document.addEventListener("drop", (ev) => {
        ev.preventDefault();
        if (!ev.dataTransfer) {
            return;
        }
        let urlOrPath;
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
                }
                else if (item.kind === "string") {
                    if (item.type === "text/plain") {
                        const data = ev.dataTransfer.getData(item.type);
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
        else if (ev.dataTransfer.files) {
            for (const file of ev.dataTransfer.files) {
                console.log(file.name);
                console.log(file.path);
                urlOrPath = file.path;
                break;
            }
        }
        if (urlOrPath) {
            const payload = {
                urlOrPath,
            };
            electron_1.ipcRenderer.send(events_1.R2_EVENT_OPEN_URL_OR_PATH, payload);
        }
    }, false);
}
exports.setupDragDrop = setupDragDrop;
//# sourceMappingURL=drag-drop.js.map