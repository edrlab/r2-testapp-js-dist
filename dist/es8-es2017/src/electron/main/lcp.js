"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const lcp_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/main/lcp");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const debug = debug_("r2:testapp#electron/main/lcp");
function installLcpHandler(publicationsServer) {
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, async (event, payload) => {
        try {
            await lcp_1.doTryLcpPass(publicationsServer, payload.publicationFilePath, [payload.lcpPass], payload.isSha256Hex);
            let passSha256Hex;
            if (!payload.isSha256Hex) {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(payload.lcpPass);
                passSha256Hex = checkSum.digest("hex");
            }
            const payloadRes = {
                error: undefined,
                okay: true,
                passSha256Hex,
            };
            event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, payloadRes);
        }
        catch (err) {
            debug(err);
            const payloadRes = {
                error: err,
                okay: false,
                passSha256Hex: undefined,
            };
            event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, payloadRes);
        }
    });
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map