"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const riot_mixin_EventTracer_1 = require("../riot_mixin_EventTracer");
exports.riotMountMyTag = (opts) => {
    const tag = riot.mount("riot-mytag", opts);
    console.log(tag);
    return tag;
};
window.riot_mytag = function (opts) {
    console.log(opts);
    console.log(this);
    const that = this;
    that.mixin(riot_mixin_EventTracer_1.riot_mixin_EventTracer);
    this.prop1 = "val1";
    this.applyClazz = false;
    this.onclickButton = (ev) => {
        console.log("CLICK button");
        ev.preventUpdate = true;
        this.applyClazz = false;
        that.refs.testSpan.style.fontSize = "100%";
        setTimeout(() => {
            that.update();
        }, 1000);
    };
    this.onclickHeading = (ev) => {
        console.log("CLICK heading");
        this.applyClazz = true;
        that.refs.testSpan.style.fontSize = "200%";
        ev.preventDefault();
    };
    this.on("mount", () => {
        console.log(that.root.id);
        console.log(document.getElementById("myRiotTagID"));
        console.log(that.root.querySelectorAll("button")[0]);
    });
    that.shouldUpdate = (data, nextOpts) => {
        console.log(data);
        console.log(nextOpts);
        return true;
    };
};
//# sourceMappingURL=index_.js.map