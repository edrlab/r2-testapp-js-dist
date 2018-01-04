"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riot_mixin_EventTracer = {
    init(opts) {
        console.log(opts);
        console.log(this);
        const that = this;
        that.on("*", (evName) => {
            console.log("EVENT => " + evName);
        });
        that.on("before-mount", () => {
            console.log("EVENT before-mount");
        });
        that.on("mount", () => {
            console.log("EVENT mount");
        });
        that.on("update", () => {
            console.log("EVENT update");
        });
        that.on("updated", () => {
            console.log("EVENT updated");
        });
        that.on("before-unmount", () => {
            console.log("EVENT before-unmount");
        });
        that.on("unmount", () => {
            console.log("EVENT mount");
        });
    },
};
//# sourceMappingURL=riot_mixin_EventTracer.js.map