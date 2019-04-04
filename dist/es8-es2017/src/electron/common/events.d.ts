export declare const R2_EVENT_DEVTOOLS = "R2_EVENT_DEVTOOLS";
export declare const R2_EVENT_OPEN_URL_OR_PATH = "R2_EVENT_OPEN_URL_OR_PATH";
export interface IEventPayload_R2_EVENT_OPEN_URL_OR_PATH {
    urlOrPath: string;
}
export declare const R2_EVENT_LCP_LSD_RETURN = "R2_EVENT_LCP_LSD_RETURN";
export interface IEventPayload_R2_EVENT_LCP_LSD_RETURN {
    publicationFilePath: string;
}
export declare const R2_EVENT_LCP_LSD_RETURN_RES = "R2_EVENT_LCP_LSD_RETURN_RES";
export interface IEventPayload_R2_EVENT_LCP_LSD_RETURN_RES {
    okay: boolean;
    error: string | undefined;
    lsdJson: any | undefined;
}
export declare const R2_EVENT_LCP_LSD_RENEW = "R2_EVENT_LCP_LSD_RENEW";
export interface IEventPayload_R2_EVENT_LCP_LSD_RENEW {
    publicationFilePath: string;
    endDateStr: string | undefined;
}
export declare const R2_EVENT_LCP_LSD_RENEW_RES = "R2_EVENT_LCP_LSD_RENEW_RES";
export interface IEventPayload_R2_EVENT_LCP_LSD_RENEW_RES {
    okay: boolean;
    error: string | undefined;
    lsdJson: any | undefined;
}
export declare const R2_EVENT_TRY_LCP_PASS = "R2_EVENT_TRY_LCP_PASS";
export interface IEventPayload_R2_EVENT_TRY_LCP_PASS {
    publicationFilePath: string;
    lcpPass: string;
    isSha256Hex: boolean;
}
export declare const R2_EVENT_TRY_LCP_PASS_RES = "R2_EVENT_TRY_LCP_PASS_RES";
export interface IEventPayload_R2_EVENT_TRY_LCP_PASS_RES {
    okay: boolean;
    error: string | number | undefined;
    passSha256Hex: string | undefined;
}
