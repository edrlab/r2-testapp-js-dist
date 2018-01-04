"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ElectronStore = require("electron-store");
var StoreElectron = (function () {
    function StoreElectron(name, defaults) {
        this.defaults = defaults;
        this._electronStore = new ElectronStore({
            defaults: defaults,
            name: name,
        });
        this._electronStore.events.setMaxListeners(0);
    }
    StoreElectron.prototype.getDefaults = function () {
        return this.defaults;
    };
    StoreElectron.prototype.get = function (key) {
        return this._electronStore.get(key);
    };
    StoreElectron.prototype.set = function (key, value) {
        if (key) {
            this._electronStore.set(key, value);
        }
        else {
            this._electronStore.set(value);
        }
    };
    StoreElectron.prototype.onChanged = function (key, callback) {
        this._electronStore.onDidChange(key, callback);
    };
    StoreElectron.prototype.reveal = function () {
        this._electronStore.openInEditor();
    };
    return StoreElectron;
}());
exports.StoreElectron = StoreElectron;
//# sourceMappingURL=store-electron.js.map