"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../index");
exports.riotMountLinkList = function (selector, opts) {
    var tag = riot.mount(selector, opts);
    return tag;
};
window.riot_linklist = function (_opts) {
    var that = this;
    that.setBasic = function (basic) {
        this.opts.basic = basic;
        this.update();
    };
    this.onclick = function (ev) {
        ev.preventUpdate = true;
        ev.preventDefault();
        var href = ev.currentTarget.getAttribute("href");
        if (href) {
            index_1.handleLink(href, undefined, false);
        }
    };
};
//# sourceMappingURL=index_.js.map