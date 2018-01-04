export interface IRiotOptsLinkListItem {
    href: string;
    title: string;
}
export interface IRiotOptsLinkList {
    basic: boolean;
    fixBasic?: boolean;
    handleLink: (href: string) => void;
    links: IRiotOptsLinkListItem[];
    url: string;
}
export interface IRiotTagLinkList extends RiotTag {
    setBasic: (basic: boolean) => void;
}
export declare const riotMountLinkList: (selector: string, opts: IRiotOptsLinkList) => RiotTag[];
