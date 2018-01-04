"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var renew_1 = require("r2-lcp-js/dist/es5/src/lsd/renew");
var return_1 = require("r2-lcp-js/dist/es5/src/lsd/return");
var debug_ = require("debug");
var electron_1 = require("electron");
var moment = require("moment");
var events_1 = require("../common/events");
var debug = debug_("r2:electron:main:lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    var _this = this;
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, function (event, publicationFilePath) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var publication, renewResponseJson, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
                        event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, "Internal error!");
                        return [2];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager)];
                case 2:
                    renewResponseJson = _a.sent();
                    publication.LCP.LSDJson = renewResponseJson;
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, true, "Returned.");
                    return [2];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, err_1);
                    return [3, 4];
                case 4: return [2];
            }
        });
    }); });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, function (event, publicationFilePath, endDateStr) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var publication, endDate, renewResponseJson, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
                        event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, "Internal error!");
                        return [2];
                    }
                    endDate = endDateStr.length ? moment(endDateStr).toDate() : undefined;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager)];
                case 2:
                    renewResponseJson = _a.sent();
                    publication.LCP.LSDJson = renewResponseJson;
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, true, "Renewed.");
                    return [2];
                case 3:
                    err_2 = _a.sent();
                    debug(err_2);
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, err_2);
                    return [3, 4];
                case 4: return [2];
            }
        });
    }); });
}
exports.installLsdHandler = installLsdHandler;
//# sourceMappingURL=lsd.js.map