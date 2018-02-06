import { IStore } from "./store";
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
