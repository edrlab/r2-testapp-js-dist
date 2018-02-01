"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ElectronStore = require("electron-store");
class StoreElectron {
    constructor(name, defaults) {
        this.defaults = defaults;
        this._electronStore = new ElectronStore({
            defaults,
            name,
        });
        this._electronStore.events.setMaxListeners(0);
    }
    getDefaults() {
        return this.defaults;
    }
    get(key) {
        return this._electronStore.get(key);
    }
    set(key, value) {
        if (key) {
            this._electronStore.set(key, value);
        }
        else {
            this._electronStore.set(value);
        }
    }
    onChanged(key, callback) {
        this._electronStore.onDidChange(key, callback);
    }
    reveal() {
        this._electronStore.openInEditor();
    }
}
exports.StoreElectron = StoreElectron;
//# sourceMappingURL=store-electron.js.map