"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotMountMenuSelect = function (selector, opts) {
    var tag = riot.mount(selector, opts);
    return tag;
};
window.riot_menuselect = function (_opts) {
    var that = this;
    that.getIndexForId = function (id) {
        var index = -1;
        var found = this.opts.options.find(function (option) {
            if (option.label !== "_") {
                index++;
            }
            return option.id === id;
        });
        return found ? index : undefined;
    };
    that.getIndexForLabel = function (label) {
        var index = -1;
        var found = this.opts.options.find(function (option) {
            if (option.label !== "_") {
                index++;
            }
            return option.label === label;
        });
        return found ? index : undefined;
    };
    that.getLabelForId = function (id) {
        var found = this.opts.options.find(function (option) {
            return option.id === id;
        });
        return found ? found.label : undefined;
    };
    that.getIdForLabel = function (label) {
        var found = this.opts.options.find(function (option) {
            return option.label === label;
        });
        return found ? found.id : undefined;
    };
    that.getIdForIndex = function (index) {
        var found = this.opts.options.find(function (_option, i) {
            return index === i;
        });
        return found ? found.id : undefined;
    };
    that.getLabelForIndex = function (index) {
        var found = this.opts.options.find(function (_option, i) {
            return index === i;
        });
        return found ? found.label : undefined;
    };
    that.setSelectedItem = function (item) {
        var index = that.getIndexForId(item);
        if (typeof index === "undefined" || index < 0) {
            index = 0;
            item = this.opts.options[0].id;
        }
        this.opts.selected = item;
        that.root.mdcSelect.selectedIndex = index;
        this.update();
    };
    that.setDisabled = function (disabled) {
        this.opts.disabled = disabled;
        that.root.mdcSelect.disabled = disabled;
    };
    that.on("mount", function () {
        console.log("that.root:");
        console.log(that.root);
        var mdcSelector = new window.mdc.select.MDCSelect(that.root);
        that.root.mdcSelect = mdcSelector;
        mdcSelector.disabled = that.opts.disabled;
        mdcSelector.listen("change", function (ev) {
            that.trigger("selectionChanged", ev.target.selectedIndex);
        });
    });
};
//# sourceMappingURL=index_.js.map