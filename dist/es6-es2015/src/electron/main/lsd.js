"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const renew_1 = require("r2-lcp-js/dist/es6-es2015/src/lsd/renew");
const return_1 = require("r2-lcp-js/dist/es6-es2015/src/lsd/return");
const debug_ = require("debug");
const electron_1 = require("electron");
const moment = require("moment");
const events_1 = require("../common/events");
const debug = debug_("r2:electron:main:lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, (event, publicationFilePath) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, "Internal error!");
            return;
        }
        let renewResponseJson;
        try {
            renewResponseJson = yield return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, true, "Returned.");
            return;
        }
        catch (err) {
            debug(err);
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, err);
        }
    }));
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, (event, publicationFilePath, endDateStr) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, "Internal error!");
            return;
        }
        const endDate = endDateStr.length ? moment(endDateStr).toDate() : undefined;
        let renewResponseJson;
        try {
            renewResponseJson = yield renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, true, "Renewed.");
            return;
        }
        catch (err) {
            debug(err);
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, err);
        }
    }));
}
exports.installLsdHandler = installLsdHandler;
//# sourceMappingURL=lsd.js.map