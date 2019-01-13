"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotMountLinkTree = function (selector, opts) {
    var tag = riot.mount(selector, opts);
    return tag;
};
window.riot_linktree = function (_opts) {
    var _this = this;
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
            var thiz = _this;
            while (!thiz.opts.handleLink && thiz.parent) {
                thiz = thiz.parent;
            }
            thiz.opts.handleLink(new URL(href, thiz.opts.url).toString());
        }
    };
};
//# sourceMappingURL=index_.js.map