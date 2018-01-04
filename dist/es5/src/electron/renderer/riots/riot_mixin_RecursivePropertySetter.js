"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riot_mixin_RecursivePropertySetter = {
    init: function (_opts) {
    },
    setPropertyRecursively: function (name, val, childTagName) {
        this[name] = val;
        var that = this;
        var children = that.tags[childTagName];
        if (!children) {
            return;
        }
        if (children instanceof Array) {
            children.forEach(function (child) {
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