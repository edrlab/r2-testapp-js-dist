"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riot_mixin_RecursivePropertySetter = {
    init(_opts) {
    },
    setPropertyRecursively(name, val, childTagName) {
        this[name] = val;
        const that = this;
        const children = that.tags[childTagName];
        if (!children) {
            return;
        }
        if (children instanceof Array) {
            children.forEach((child) => {
                child.setPropertyRecursively(name, val, childTagName);
            });
        }
        else {
            children
                .setPropertyRecursively(name, val, childTagName);
        }
    },
};
//# sourceMappingURL=riot_mixin_RecursivePropertySetter.js.map