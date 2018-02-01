"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotMountLinkListGroup = (selector, opts) => {
    const tag = riot.mount(selector, opts);
    return tag;
};
window.riot_linklistgroup = function (_opts) {
    const that = this;
    that.setBasic = function (basic) {
        this.opts.basic = basic;
        this.update();
    };
};
//# sourceMappingURL=index_.js.map