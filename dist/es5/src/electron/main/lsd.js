"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lsd_1 = require("r2-navigator-js/dist/es5/src/electron/main/lsd");
var lsd_2 = require("r2-navigator-js/dist/es5/src/electron/main/lsd");
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var debug = debug_("r2:testapp#electron/main/lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    var _this = this;
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, function (event, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var lsdJson, payloadRes, err_1, payloadRes;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, lsd_2.doLsdReturn(publicationsServer, deviceIDManager, payload.publicationFilePath)];
                case 1:
                    lsdJson = _a.sent();
                    payloadRes = {
                        error: undefined,
                        lsdJson: lsdJson,
                        okay: true,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
                    return [3, 3];
                case 2:
                    err_1 = _a.sent();
                    debug(err_1);
                    payloadRes = {
                        error: err_1,
                        lsdJson: undefined,
                        okay: false,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
                    return [3, 3];
                case 3: return [2];
            }
        });
    }); });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, function (event, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var lsdJson, payloadRes, err_2, payloadRes;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, lsd_1.doLsdRenew(publicationsServer, deviceIDManager, payload.publicationFilePath, payload.endDateStr)];
                case 1:
                    lsdJson = _a.sent();
                    payloadRes = {
                        error: undefined,
                        lsdJson: lsdJson,
                        okay: true,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
                    return [3, 3];
                case 2:
                    err_2 = _a.sent();
                    debug(err_2);
                    payloadRes = {
                        error: err_2,
                        lsdJson: undefined,
                        okay: false,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
                    return [3, 3];
                case 3: return [2];
            }
        });
    }); });
}
exports.installLsdHandler = installLsdHandler;
//# sourceMappingURL=lsd.js.map