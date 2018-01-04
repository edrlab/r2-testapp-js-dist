"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const lsd_1 = require("./lsd");
const debug = debug_("r2:electron:main:lcp");
function installLcpHandler(publicationsServer, deviceIDManager) {
    lsd_1.installLsdHandler(publicationsServer, deviceIDManager);
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, async (event, publicationFilePath, lcpPass, isSha256Hex) => {
        let okay = false;
        try {
            okay = await tryLcpPass(publicationFilePath, lcpPass, isSha256Hex);
        }
        catch (err) {
            debug(err);
            okay = false;
        }
        let passSha256Hex;
        if (okay) {
            if (isSha256Hex) {
                passSha256Hex = lcpPass;
            }
            else {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(lcpPass);
                passSha256Hex = checkSum.digest("hex");
            }
        }
        event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, okay, (okay ? "Correct." : "Please try again."), passSha256Hex ? passSha256Hex : "xxx");
    });
    async function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication) {
            return false;
        }
        let lcpPassHex;
        if (isSha256Hex) {
            lcpPassHex = lcpPass;
        }
        else {
            const checkSum = crypto.createHash("sha256");
            checkSum.update(lcpPass);
            lcpPassHex = checkSum.digest("hex");
        }
        let okay = false;
        try {
            okay = await publication.LCP.setUserPassphrase(lcpPassHex);
        }
        catch (err) {
            debug(err);
            okay = false;
        }
        if (!okay) {
            debug("FAIL publication.LCP.setUserPassphrase()");
        }
        return okay;
    }
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map