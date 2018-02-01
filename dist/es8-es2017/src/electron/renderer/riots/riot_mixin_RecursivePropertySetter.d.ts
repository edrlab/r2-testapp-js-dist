export interface RiotMixinWithRecursivePropertySetter extends RiotMixin {
    setPropertyRecursively(name: string, val: any, childTagName: string): void;
}
export declare const riot_mixin_RecursivePropertySetter: RiotMixinWithRecursivePropertySetter;
