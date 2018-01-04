export interface IPropertyAnimationState {
    animating: boolean;
    duration: number;
    destVal: number;
    originVal: number;
    object: any;
    property: string;
    deltaVal: number;
    startTime: number;
    id: number;
    lastVal: number;
    nowTime: number;
}
export declare const animateProperty: (cAF: (id: number) => void, callback: ((cancelled: boolean) => void) | undefined, property: string, duration: number, object: any, destVal: number, rAF: (func: () => void) => number, transition: (t: number, b: number, c: number, d: number) => number) => IPropertyAnimationState;
