"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug_ = require("debug");
var uuid = require("uuid");
var debug = debug_("r2:testapp#electron/main/lsd-deviceid-manager");
var LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";
function getDeviceIDManager(electronStoreLSD, name) {
    var deviceIDManager = {
        checkDeviceID: function (key) {
            var entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
            var lsdStore = electronStoreLSD.get("lsd");
            if (!lsdStore || !lsdStore[entry]) {
                return undefined;
            }
            return lsdStore[entry];
        },
        getDeviceID: function () {
            var id = uuid.v4();
            var lsdStore = electronStoreLSD.get("lsd");
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
        getDeviceNAME: function () {
            return name;
        },
        recordDeviceID: function (key) {
            var id = this.getDeviceID();
            var lsdStore = electronStoreLSD.get("lsd");
            if (!lsdStore) {
                debug("LSD store problem?!");
                return;
            }
            var entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
            lsdStore[entry] = id;
            electronStoreLSD.set("lsd", lsdStore);
        },
    };
    return deviceIDManager;
}
exports.getDeviceIDManager = getDeviceIDManager;
//# sourceMappingURL=lsd-deviceid-manager.js.map