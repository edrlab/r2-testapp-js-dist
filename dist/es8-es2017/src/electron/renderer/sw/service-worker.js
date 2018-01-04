"use strict";
console.log("SERVICE WORKER");
self.addEventListener("install", async (_event) => {
    console.log("service-worker.js INSTALL");
    await self.skipWaiting();
});
self.addEventListener("activate", (event) => {
    console.log("service-worker.js ACTIVE");
    event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
    console.log("service-worker.js FETCH");
    console.log(event.request.url);
    event.request.headers.forEach((arg0, arg1) => {
        console.log(arg0 + " => " + arg1);
    });
    const req = event.request.clone();
    const fetchPromise = fetch(req);
    event.respondWith(fetchPromise);
});
//# sourceMappingURL=service-worker.js.map