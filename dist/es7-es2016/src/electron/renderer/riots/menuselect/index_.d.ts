export interface IRiotOptsMenuSelectItem {
    id: string;
    label: string;
    style?: string;
}
export interface IRiotOptsMenuSelect {
    options: IRiotOptsMenuSelectItem[];
    label: string;
    selected: string;
    disabled: boolean;
}
export interface IRiotTagMenuSelect extends RiotTag {
    setDisabled: (disabled: boolean) => void;
    setSelectedItem: (item: string) => void;
    getIndexForId: (id: string) => number | undefined;
    getIndexForLabel: (label: string) => number | undefined;
    getIdForLabel: (label: string) => string | undefined;
    getLabelForId: (id: string) => string | undefined;
}
export declare const riotMountMenuSelect: (selector: string, opts: IRiotOptsMenuSelect) => RiotTag[];
