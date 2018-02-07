"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto = require("crypto");
var lcp_1 = require("r2-navigator-js/dist/es5/src/electron/main/lcp");
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var debug = debug_("r2:testapp#electron/main/lcp");
function installLcpHandler(publicationsServer) {
    var _this = this;
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, function (event, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var passSha256Hex, checkSum, payloadRes, err_1, payloadRes;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, lcp_1.doTryLcpPass(publicationsServer, payload.publicationFilePath, [payload.lcpPass], payload.isSha256Hex)];
                case 1:
                    _a.sent();
                    passSha256Hex = void 0;
                    if (!payload.isSha256Hex) {
                        checkSum = crypto.createHash("sha256");
                        checkSum.update(payload.lcpPass);
                        passSha256Hex = checkSum.digest("hex");
                    }
                    payloadRes = {
                        error: undefined,
                        okay: true,
                        passSha256Hex: passSha256Hex,
                    };
                    event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, payloadRes);
                    return [3, 3];
                case 2:
                    err_1 = _a.sent();
                    debug(err_1);
                    payloadRes = {
                        error: err_1,
                        okay: false,
                        passSha256Hex: undefined,
                    };
                    event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, payloadRes);
                    return [3, 3];
                case 3: return [2];
            }
        });
    }); });
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map