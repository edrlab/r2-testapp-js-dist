export interface IStore {
    getDefaults(): any;
    get(key: string): any;
    set(key: string | undefined, value: any): void;
    onChanged(key: string, callback: (newValue: any, oldValue: any) => void): void;
}
