import { IStreamAndLength, IZip, Zip } from "r2-utils-js/dist/es7-es2016/src/_utils/zip/zip";
export declare class ZipExplodedHTTP extends Zip {
    readonly dirPath: string;
    static loadPromise(dirPath: string): Promise<IZip>;
    private constructor();
    freeDestroy(): void;
    entriesCount(): number;
    hasEntries(): boolean;
    hasEntry(_entryPath: string): boolean;
    getEntries(): Promise<string[]>;
    entryStreamPromise(entryPath: string): Promise<IStreamAndLength>;
}
