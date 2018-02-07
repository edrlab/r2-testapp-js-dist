"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lsd_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/lsd");
const lsd_2 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/lsd");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const debug = debug_("r2:testapp#electron/main/lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, async (event, payload) => {
        let lsdJson;
        try {
            lsdJson = await lsd_2.doLsdReturn(publicationsServer, deviceIDManager, payload.publicationFilePath);
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
    });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, async (event, payload) => {
        let lsdJson;
        try {
            lsdJson = await lsd_1.doLsdRenew(publicationsServer, deviceIDManager, payload.publicationFilePath, payload.endDateStr);
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
    });
}
exports.installLsdHandler = installLsdHandler;
//# sourceMappingURL=lsd.js.map