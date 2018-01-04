"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug_ = require("debug");
var uuid = require("uuid");
var store_electron_1 = require("../common/store-electron");
exports.electronStoreLSD = new store_electron_1.StoreElectron("readium2-testapp-lsd", {});
var debug = debug_("r2:electron:main:lsd");
var LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
exports.deviceIDManager = {
    checkDeviceID: function (key) {
        var entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
        var lsdStore = exports.electronStoreLSD.get("lsd");
        if (!lsdStore || !lsdStore[entry]) {
            return undefined;
        }
        return lsdStore[entry];
    },
    getDeviceID: function () {
        var id = uuid.v4();
        var lsdStore = exports.electronStoreLSD.get("lsd");
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
    getDeviceNAME: function () {
        return "Readium2 Electron desktop app";
    },
    recordDeviceID: function (key) {
        var id = this.getDeviceID();
        var lsdStore = exports.electronStoreLSD.get("lsd");
        if (!lsdStore) {
            debug("LSD store problem?!");
            return;
        }
        var entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
        lsdStore[entry] = id;
        exports.electronStoreLSD.set("lsd", lsdStore);
    },
};
//# sourceMappingURL=lsd-deviceid-manager.js.map