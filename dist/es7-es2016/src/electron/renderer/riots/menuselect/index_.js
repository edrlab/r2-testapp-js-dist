"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotMountMenuSelect = (selector, opts) => {
    const tag = riot.mount(selector, opts);
    return tag;
};
window.riot_menuselect = function (_opts) {
    const that = this;
    that.getIndexForId = function (id) {
        let index = -1;
        const found = this.opts.options.find((option) => {
            if (option.label !== "_") {
                index++;
            }
            return option.id === id;
        });
        return found ? index : undefined;
    };
    that.getIndexForLabel = function (label) {
        let index = -1;
        const found = this.opts.options.find((option) => {
            if (option.label !== "_") {
                index++;
            }
            return option.label === label;
        });
        return found ? index : undefined;
    };
    that.getLabelForId = function (id) {
        const found = this.opts.options.find((option) => {
            return option.id === id;
        });
        return found ? found.label : undefined;
    };
    that.getIdForLabel = function (label) {
        const found = this.opts.options.find((option) => {
            return option.label === label;
        });
        return found ? found.id : undefined;
    };
    that.getIdForIndex = function (index) {
        const found = this.opts.options.find((_option, i) => {
            return index === i;
        });
        return found ? found.id : undefined;
    };
    that.getLabelForIndex = function (index) {
        const found = this.opts.options.find((_option, i) => {
            return index === i;
        });
        return found ? found.label : undefined;
    };
    that.setSelectedItem = function (item) {
        let index = that.getIndexForId(item);
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
    that.on("mount", () => {
        console.log("that.root:");
        console.log(that.root);
        const mdcSelector = new window.mdc.select.MDCSelect(that.root);
        that.root.mdcSelect = mdcSelector;
        mdcSelector.disabled = that.opts.disabled;
        mdcSelector.listen("change", (ev) => {
            that.trigger("selectionChanged", ev.target.selectedIndex);
        });
    });
};
//# sourceMappingURL=index_.js.map