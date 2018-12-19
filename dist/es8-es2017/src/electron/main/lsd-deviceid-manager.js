"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ = require("debug");
const uuid = require("uuid");
const debug = debug_("r2:testapp#electron/main/lsd-deviceid-manager");
const LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
function getDeviceIDManager(electronStoreLSD, name) {
    const deviceIDManager = {
        async checkDeviceID(key) {
            const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
            const lsdStore = electronStoreLSD.get("lsd");
            if (!lsdStore || !lsdStore[entry]) {
                return Promise.resolve(undefined);
            }
            return Promise.resolve(lsdStore[entry]);
        },
        async getDeviceID() {
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
        },
        async getDeviceNAME() {
            return Promise.resolve(name);
        },
        async recordDeviceID(key) {
            let id;
            try {
                id = await this.getDeviceID();
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
        },
    };
    return deviceIDManager;
}
exports.getDeviceIDManager = getDeviceIDManager;
//# sourceMappingURL=lsd-deviceid-manager.js.map