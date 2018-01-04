"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var riot_mixin_EventTracer_1 = require("../riot_mixin_EventTracer");
exports.riotMountMyTag = function (opts) {
    var tag = riot.mount("riot-mytag", opts);
    console.log(tag);
    return tag;
};
window.riot_mytag = function (opts) {
    var _this = this;
    console.log(opts);
    console.log(this);
    var that = this;
    that.mixin(riot_mixin_EventTracer_1.riot_mixin_EventTracer);
    this.prop1 = "val1";
    this.applyClazz = false;
    this.onclickButton = function (ev) {
        console.log("CLICK button");
        ev.preventUpdate = true;
        _this.applyClazz = false;
        that.refs.testSpan.style.fontSize = "100%";
        setTimeout(function () {
            that.update();
        }, 1000);
    };
    this.onclickHeading = function (ev) {
        console.log("CLICK heading");
        _this.applyClazz = true;
        that.refs.testSpan.style.fontSize = "200%";
        ev.preventDefault();
    };
    this.on("mount", function () {
        console.log(that.root.id);
        console.log(document.getElementById("myRiotTagID"));
        console.log(that.root.querySelectorAll("button")[0]);
    });
    that.shouldUpdate = function (data, nextOpts) {
        console.log(data);
        console.log(nextOpts);
        return true;
    };
};
//# sourceMappingURL=index_.js.map