"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lsd_1 = require("r2-navigator-js/dist/es6-es2015/src/electron/main/lsd");
const lsd_2 = require("r2-navigator-js/dist/es6-es2015/src/electron/main/lsd");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const debug = debug_("r2:testapp#electron/main/lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, (event, payload) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let lsdJson;
        try {
            lsdJson = yield lsd_2.doLsdReturn(publicationsServer, deviceIDManager, payload.publicationFilePath);
            const payloadRes = {
                error: undefined,
                lsdJson,
                okay: true,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
        }
        catch (err) {
            debug(err);
            const payloadRes = {
                error: err,
                lsdJson: undefined,
                okay: false,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
        }
    }));
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, (event, payload) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let lsdJson;
        try {
            lsdJson = yield lsd_1.doLsdRenew(publicationsServer, deviceIDManager, payload.publicationFilePath, payload.endDateStr);
            const payloadRes = {
                error: undefined,
                lsdJson,
                okay: true,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
        }
        catch (err) {
            debug(err);
            const payloadRes = {
                error: err,
                lsdJson: undefined,
                okay: false,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
        }
    }));
}
exports.installLsdHandler = installLsdHandler;
//# sourceMappingURL=lsd.js.map