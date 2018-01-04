"use strict";
var _this = this;
console.log("SERVICE WORKER");
self.addEventListener("install", function (_event) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("service-worker.js INSTALL");
                return [4, self.skipWaiting()];
            case 1:
                _a.sent();
                return [2];
        }
    });
}); });
self.addEventListener("activate", function (event) {
    console.log("service-worker.js ACTIVE");
    event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (event) {
    console.log("service-worker.js FETCH");
    console.log(event.request.url);
    event.request.headers.forEach(function (arg0, arg1) {
        console.log(arg0 + " => " + arg1);
    });
    var req = event.request.clone();
    var fetchPromise = fetch(req);
    event.respondWith(fetchPromise);
});
//# sourceMappingURL=service-worker.js.map