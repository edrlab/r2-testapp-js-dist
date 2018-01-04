"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riot_mixin_EventTracer = {
    init: function (opts) {
        console.log(opts);
        console.log(this);
        var that = this;
        that.on("*", function (evName) {
            console.log("EVENT => " + evName);
        });
        that.on("before-mount", function () {
            console.log("EVENT before-mount");
        });
        that.on("mount", function () {
            console.log("EVENT mount");
        });
        that.on("update", function () {
            console.log("EVENT update");
        });
        that.on("updated", function () {
            console.log("EVENT updated");
        });
        that.on("before-unmount", function () {
            console.log("EVENT before-unmount");
        });
        that.on("unmount", function () {
            console.log("EVENT mount");
        });
    },
};
//# sourceMappingURL=riot_mixin_EventTracer.js.map