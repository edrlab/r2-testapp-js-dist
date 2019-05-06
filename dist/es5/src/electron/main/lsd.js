"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lsd_1 = require("r2-lcp-js/dist/es5/src/parser/epub/lsd");
var lsd_2 = require("r2-navigator-js/dist/es5/src/electron/main/lsd");
var lsd_3 = require("r2-navigator-js/dist/es5/src/electron/main/lsd");
var debug_ = require("debug");
var electron_1 = require("electron");
var ta_json_x_1 = require("ta-json-x");
var events_1 = require("../common/events");
var debug = debug_("r2:testapp#electron/main/lsd");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function installLsdHandler(publicationsServer, deviceIDManager) {
    var _this = this;
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, function (event, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var lsdJSON, lsd, payloadRes, err_1, payloadRes;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, lsd_3.doLsdReturn(publicationsServer, deviceIDManager, payload.publicationFilePath)];
                case 1:
                    lsdJSON = _a.sent();
                    lsd = void 0;
                    try {
                        lsd = ta_json_x_1.JSON.deserialize(lsdJSON, lsd_1.LSD);
                        if (IS_DEV) {
                            debug(lsd);
                        }
                    }
                    catch (err) {
                        debug(err);
                    }
                    payloadRes = {
                        error: undefined,
                        lsd: lsd,
                        okay: true,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
                    return [3, 3];
                case 2:
                    err_1 = _a.sent();
                    debug(err_1);
                    payloadRes = {
                        error: err_1,
                        lsd: undefined,
                        okay: false,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, payloadRes);
                    return [3, 3];
                case 3: return [2];
            }
        });
    }); });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, function (event, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var lsdJSON, lsd, payloadRes, err_2, payloadRes;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, lsd_2.doLsdRenew(publicationsServer, deviceIDManager, payload.publicationFilePath, payload.endDateStr)];
                case 1:
                    lsdJSON = _a.sent();
                    lsd = void 0;
                    try {
                        lsd = ta_json_x_1.JSON.deserialize(lsdJSON, lsd_1.LSD);
                        if (IS_DEV) {
                            debug(lsd);
                        }
                    }
                    catch (err) {
                        debug(err);
                    }
                    payloadRes = {
                        error: undefined,
                        lsd: lsd,
                        okay: true,
                    };
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, payloadRes);
                    return [3, 3];
                case 2:
                    err_2 = _a.sent();
                    debug(err_2);
                    payloadRes = {
                        error: err_2,
                        lsd: undefined,
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