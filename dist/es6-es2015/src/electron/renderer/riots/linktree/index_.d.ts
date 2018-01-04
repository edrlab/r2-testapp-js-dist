export interface IRiotOptsLinkTreeItem {
    children: IRiotOptsLinkTreeItem[];
    href: string;
    title: string;
}
export interface IRiotOptsLinkTree {
    basic: boolean;
    links: IRiotOptsLinkTreeItem[];
    url: string;
}
export interface IRiotTagLinkTree extends RiotTag {
    setBasic: (basic: boolean) => void;
}
export declare const riotMountLinkTree: (selector: string, opts: IRiotOptsLinkTree) => RiotTag[];
