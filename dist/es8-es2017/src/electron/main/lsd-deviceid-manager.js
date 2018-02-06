"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ = require("debug");
const uuid = require("uuid");
const debug = debug_("r2:testapp#electron/main/lsd-deviceid-manager");
const LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
function getDeviceIDManager(electronStoreLSD, name) {
    const deviceIDManager = {
        checkDeviceID(key) {
            const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
            const lsdStore = electronStoreLSD.get("lsd");
            if (!lsdStore || !lsdStore[entry]) {
                return undefined;
            }
            return lsdStore[entry];
        },
        getDeviceID() {
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
            return id;
        },
        getDeviceNAME() {
            return name;
        },
        recordDeviceID(key) {
            const id = this.getDeviceID();
            const lsdStore = electronStoreLSD.get("lsd");
            if (!lsdStore) {
                debug("LSD store problem?!");
                return;
            }
            const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
            lsdStore[entry] = id;
            electronStoreLSD.set("lsd", lsdStore);
        },
    };
    return deviceIDManager;
}
exports.getDeviceIDManager = getDeviceIDManager;
//# sourceMappingURL=lsd-deviceid-manager.js.map