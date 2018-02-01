"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ = require("debug");
const uuid = require("uuid");
const store_electron_1 = require("../common/store-electron");
exports.electronStoreLSD = new store_electron_1.StoreElectron("readium2-testapp-lsd", {});
const debug = debug_("r2:electron:main:lsd");
const LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
exports.deviceIDManager = {
    checkDeviceID(key) {
        const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
        const lsdStore = exports.electronStoreLSD.get("lsd");
        if (!lsdStore || !lsdStore[entry]) {
            return undefined;
        }
        return lsdStore[entry];
    },
    getDeviceID() {
        let id = uuid.v4();
        const lsdStore = exports.electronStoreLSD.get("lsd");
        if (!lsdStore) {
            exports.electronStoreLSD.set("lsd", {
                deviceID: id,
            });
        }
        else {
            if (lsdStore.deviceID) {
                id = lsdStore.deviceID;
            }
            else {
                lsdStore.deviceID = id;
                exports.electronStoreLSD.set("lsd", lsdStore);
            }
        }
        return id;
    },
    getDeviceNAME() {
        return "Readium2 Electron desktop app";
    },
    recordDeviceID(key) {
        const id = this.getDeviceID();
        const lsdStore = exports.electronStoreLSD.get("lsd");
        if (!lsdStore) {
            debug("LSD store problem?!");
            return;
        }
        const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
        lsdStore[entry] = id;
        exports.electronStoreLSD.set("lsd", lsdStore);
    },
};
//# sourceMappingURL=lsd-deviceid-manager.js.map