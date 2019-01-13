"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            let thiz = this;
            while (!thiz.opts.handleLink && thiz.parent) {
                thiz = thiz.parent;
            }
            thiz.opts.handleLink(new URL(href, thiz.opts.url).toString());
        }
    };
};
//# sourceMappingURL=index_.js.map