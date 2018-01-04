"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
exports.riotMountLinkTree = (selector, opts) => {
    const tag = riot.mount(selector, opts);
    return tag;
};
window.riot_linktree = function (_opts) {
    const that = this;
    that.setBasic = function (basic) {
        this.opts.basic = basic;
        this.update();
    };
    this.onclick = (ev) => {
        ev.preventUpdate = true;
        ev.preventDefault();
        const href = ev.currentTarget.getAttribute("href");
        if (href) {
            index_1.handleLink(href, undefined, false);
        }
    };
};
//# sourceMappingURL=index_.js.map