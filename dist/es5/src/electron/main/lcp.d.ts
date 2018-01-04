import { IDeviceIDManager } from "r2-lcp-js/dist/es5/src/lsd/deviceid-manager";
import { Server } from "r2-streamer-js/dist/es5/src/http/server";
export declare function installLcpHandler(publicationsServer: Server, deviceIDManager: IDeviceIDManager): void;
