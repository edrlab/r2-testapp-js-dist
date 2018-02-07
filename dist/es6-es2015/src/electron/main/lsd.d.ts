import { IDeviceIDManager } from "r2-lcp-js/dist/es6-es2015/src/lsd/deviceid-manager";
import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";
export declare function installLsdHandler(publicationsServer: Server, deviceIDManager: IDeviceIDManager): void;
