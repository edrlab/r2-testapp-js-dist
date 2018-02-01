"use strict";
console.log("PRELOAD SERVICE WORKER");
console.log(global.navigator.serviceWorker.controller);
const pathItems = global.window.location.pathname.split("/");
const scope = "/pub/" + pathItems[2] + "/";
console.log(scope);
const swURL = global.window.location.origin + "/sw.js";
console.log(swURL);
global.navigator.serviceWorker.register(swURL, {
    scope,
}).then((swReg) => {
    console.log("service-worker.js REG");
    console.log(swReg);
    console.log(swReg.installing);
    console.log(swReg.waiting);
    console.log(swReg.active);
}).catch((err) => {
    console.log("service-worker.js ERROR");
    console.log(err);
});
global.navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("controllerchange");
});
//# sourceMappingURL=preload_service-worker.js.map