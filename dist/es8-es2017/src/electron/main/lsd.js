"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lsd_1 = require("r2-lcp-js/dist/es8-es2017/src/parser/epub/lsd");
const lsd_2 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/lsd");
const lsd_3 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/lsd");
const debug_ = require("debug");
const electron_1 = require("electron");
const ta_json_x_1 = require("ta-json-x");
const events_1 = require("../common/events");
const debug = debug_("r2:testapp#electron/main/lsd");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function installLsdHandler(publicationsServer, deviceIDManager) {
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, async (event, payload) => {
        let lsdJSON;
        try {
            lsdJSON = await lsd_3.doLsdReturn(publicationsServer, deviceIDManager, payload.publicationFilePath);
            let lsd;
            try {
                lsd = ta_json_x_1.JSON.deserialize(lsdJSON, lsd_1.LSD);
                if (IS_DEV) {
                    debug(lsd);
                }
            }
            catch (err) {
                debug(err);
            }
            const payloadRes = {
                error: undefined,
                lsd,
                okay: true,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
        }
        catch (err) {
            debug(err);
            const payloadRes = {
                error: err,
                lsd: undefined,
                okay: false,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
        }
    });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, async (event, payload) => {
        let lsdJSON;
        try {
            lsdJSON = await lsd_2.doLsdRenew(publicationsServer, deviceIDManager, payload.publicationFilePath, payload.endDateStr);
            let lsd;
            try {
                lsd = ta_json_x_1.JSON.deserialize(lsdJSON, lsd_1.LSD);
                if (IS_DEV) {
                    debug(lsd);
                }
            }
            catch (err) {
                debug(err);
            }
            const payloadRes = {
                error: undefined,
                lsd,
                okay: true,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
        }
        catch (err) {
            debug(err);
            const payloadRes = {
                error: err,
                lsd: undefined,
                okay: false,
            };
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
        }
    });
}
exports.installLsdHandler = installLsdHandler;
//# sourceMappingURL=lsd.js.map