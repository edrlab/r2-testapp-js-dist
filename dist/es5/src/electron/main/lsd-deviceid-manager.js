"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debug_ = require("debug");
var uuid = require("uuid");
var debug = debug_("r2:testapp#electron/main/lsd-deviceid-manager");
var LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
function getDeviceIDManager(electronStoreLSD, name) {
    var deviceIDManager = {
        checkDeviceID: function (key) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var entry, lsdStore;
                return tslib_1.__generator(this, function (_a) {
                    entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
                    lsdStore = electronStoreLSD.get("lsd");
                    if (!lsdStore || !lsdStore[entry]) {
                        return [2, Promise.resolve(undefined)];
                    }
                    return [2, Promise.resolve(lsdStore[entry])];
                });
            });
        },
        getDeviceID: function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var id, lsdStore;
                return tslib_1.__generator(this, function (_a) {
                    id = uuid.v4();
                    lsdStore = electronStoreLSD.get("lsd");
                    if (!lsdStore) {
                        electronStoreLSD.set("lsd", {
                            deviceID: id,
                        });
                    }
                    else {
                        if (lsdStore.deviceID) {
                            id = lsdStore.deviceID;
                        }
                        else {
                            lsdStore.deviceID = id;
                            electronStoreLSD.set("lsd", lsdStore);
                        }
                    }
                    return [2, Promise.resolve(id)];
                });
            });
        },
        getDeviceNAME: function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2, Promise.resolve(name)];
                });
            });
        },
        recordDeviceID: function (key) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var id, lsdStore, entry;
                return tslib_1.__generator(this, function (_a) {
                    id = this.getDeviceID();
                    lsdStore = electronStoreLSD.get("lsd");
                    if (!lsdStore) {
                        debug("LSD store problem?!");
                        return [2, Promise.reject("Cannot get LSD store?")];
                    }
                    entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
                    lsdStore[entry] = id;
                    electronStoreLSD.set("lsd", lsdStore);
                    return [2, Promise.resolve()];
                });
            });
        },
    };
    return deviceIDManager;
}
exports.getDeviceIDManager = getDeviceIDManager;
//# sourceMappingURL=lsd-deviceid-manager.js.map