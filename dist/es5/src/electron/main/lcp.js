"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto = require("crypto");
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var lsd_1 = require("./lsd");
var debug = debug_("r2:electron:main:lcp");
function installLcpHandler(publicationsServer, deviceIDManager) {
    var _this = this;
    lsd_1.installLsdHandler(publicationsServer, deviceIDManager);
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, function (event, publicationFilePath, lcpPass, isSha256Hex) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var okay, err_1, passSha256Hex, checkSum;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    okay = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, tryLcpPass(publicationFilePath, lcpPass, isSha256Hex)];
                case 2:
                    okay = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    okay = false;
                    return [3, 4];
                case 4:
                    if (okay) {
                        if (isSha256Hex) {
                            passSha256Hex = lcpPass;
                        }
                        else {
                            checkSum = crypto.createHash("sha256");
                            checkSum.update(lcpPass);
                            passSha256Hex = checkSum.digest("hex");
                        }
                    }
                    event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, okay, (okay ? "Correct." : "Please try again."), passSha256Hex ? passSha256Hex : "xxx");
                    return [2];
            }
        });
    }); });
    function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var publication, lcpPassHex, checkSum, okay, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        publication = publicationsServer.cachedPublication(publicationFilePath);
                        if (!publication) {
                            return [2, false];
                        }
                        if (isSha256Hex) {
                            lcpPassHex = lcpPass;
                        }
                        else {
                            checkSum = crypto.createHash("sha256");
                            checkSum.update(lcpPass);
                            lcpPassHex = checkSum.digest("hex");
                        }
                        okay = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, publication.LCP.setUserPassphrase(lcpPassHex)];
                    case 2:
                        okay = _a.sent();
                        return [3, 4];
                    case 3:
                        err_2 = _a.sent();
                        debug(err_2);
                        okay = false;
                        return [3, 4];
                    case 4:
                        if (!okay) {
                            debug("FAIL publication.LCP.setUserPassphrase()");
                        }
                        return [2, okay];
                }
            });
        });
    }
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map