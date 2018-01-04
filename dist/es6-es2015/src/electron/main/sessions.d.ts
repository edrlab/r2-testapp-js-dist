export declare function initSessions(): void;
export declare function clearSession(sess: Electron.Session, str: string, callbackCache: (() => void) | undefined, callbackStorageData: (() => void) | undefined): void;
export declare function getWebViewSession(): Electron.Session;
export declare function clearWebviewSession(callbackCache: (() => void) | undefined, callbackStorageData: (() => void) | undefined): void;
export declare function clearDefaultSession(callbackCache: (() => void) | undefined, callbackStorageData: (() => void) | undefined): void;
export declare function clearSessions(callbackCache: (() => void) | undefined, callbackStorageData: (() => void) | undefined): void;
