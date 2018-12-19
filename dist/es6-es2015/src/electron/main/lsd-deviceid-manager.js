"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_ = require("debug");
const uuid = require("uuid");
const debug = debug_("r2:testapp#electron/main/lsd-deviceid-manager");
const LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
function getDeviceIDManager(electronStoreLSD, name) {
    const deviceIDManager = {
        checkDeviceID(key) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
                const lsdStore = electronStoreLSD.get("lsd");
                if (!lsdStore || !lsdStore[entry]) {
                    return Promise.resolve(undefined);
                }
                return Promise.resolve(lsdStore[entry]);
            });
        },
        getDeviceID() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let id = uuid.v4();
                const lsdStore = electronStoreLSD.get("lsd");
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
                return Promise.resolve(id);
            });
        },
        getDeviceNAME() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                return Promise.resolve(name);
            });
        },
        recordDeviceID(key) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let id;
                try {
                    id = yield this.getDeviceID();
                }
                catch (err) {
                    debug(err);
                }
                if (id) {
                    const lsdStore = electronStoreLSD.get("lsd");
                    if (!lsdStore) {
                        debug("LSD store problem?!");
                        return Promise.reject("Cannot get LSD store?");
                    }
                    const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
                    lsdStore[entry] = id;
                    electronStoreLSD.set("lsd", lsdStore);
                }
                return Promise.resolve();
            });
        },
    };
    return deviceIDManager;
}
exports.getDeviceIDManager = getDeviceIDManager;
//# sourceMappingURL=lsd-deviceid-manager.js.map