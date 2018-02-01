import { IStore } from "r2-navigator-js/dist/es8-es2017/src/electron/common/store";
export declare class StoreElectron implements IStore {
    readonly defaults: any;
    private _electronStore;
    constructor(name: string, defaults: any);
    getDefaults(): any;
    get(key: string): any;
    set(key: string | undefined, value: any): void;
    onChanged(key: string, callback: (newValue: any, oldValue: any) => void): void;
    reveal(): void;
}
