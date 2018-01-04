import { IRiotOptsLinkListItem } from "../linklist/index_";
export interface IRiotOptsLinkListGroupItem {
    label: string;
    links: IRiotOptsLinkListItem[];
}
export interface IRiotOptsLinkListGroup {
    basic: boolean;
    linksgroup: IRiotOptsLinkListGroupItem[];
    url: string;
}
export interface IRiotTagLinkListGroup extends RiotTag {
    setBasic: (basic: boolean) => void;
}
export declare const riotMountLinkListGroup: (selector: string, opts: IRiotOptsLinkListGroup) => RiotTag[];
