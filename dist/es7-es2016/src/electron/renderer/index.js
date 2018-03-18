"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const publication_1 = require("r2-shared-js/dist/es7-es2016/src/models/publication");
const sessions_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/common/sessions");
const querystring_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/renderer/common/querystring");
const index_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/renderer/index");
const init_globals_1 = require("r2-shared-js/dist/es7-es2016/src/init-globals");
const UrlUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/http/UrlUtils");
const electron_1 = require("electron");
const ta_json_1 = require("ta-json");
const events_1 = require("../common/events");
const store_electron_1 = require("../common/store-electron");
const index_2 = require("./riots/linklist/index_");
const index_3 = require("./riots/linklistgroup/index_");
const index_4 = require("./riots/linktree/index_");
const index_5 = require("./riots/menuselect/index_");
const SystemFonts = require("system-font-families");
const debounce = require("debounce");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const queryParams = querystring_1.getURLQueryParams();
electron_1.webFrame.registerURLSchemeAsSecure(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL);
electron_1.webFrame.registerURLSchemeAsPrivileged(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, {
    allowServiceWorkers: false,
    bypassCSP: false,
    corsEnabled: false,
    secure: true,
    supportFetchAPI: true,
});
const electronStore = new store_electron_1.StoreElectron("readium2-testapp", {
    basicLinkTitles: true,
    styling: {
        align: "left",
        colCount: "auto",
        dark: false,
        font: "DEFAULT",
        fontSize: "100%",
        invert: false,
        lineHeight: "1.5",
        night: false,
        paged: false,
        readiumcss: false,
        sepia: false,
    },
});
const electronStoreLCP = new store_electron_1.StoreElectron("readium2-testapp-lcp", {});
init_globals_1.initGlobals();
const pubServerRoot = queryParams["pubServerRoot"];
console.log(pubServerRoot);
const computeReadiumCssJsonMessage = () => {
    const on = electronStore.get("styling.readiumcss");
    if (on) {
        const align = electronStore.get("styling.align");
        const colCount = electronStore.get("styling.colCount");
        const dark = electronStore.get("styling.dark");
        const font = electronStore.get("styling.font");
        const fontSize = electronStore.get("styling.fontSize");
        const lineHeight = electronStore.get("styling.lineHeight");
        const invert = electronStore.get("styling.invert");
        const night = electronStore.get("styling.night");
        const paged = electronStore.get("styling.paged");
        const sepia = electronStore.get("styling.sepia");
        const cssJson = {
            align,
            colCount,
            dark,
            font,
            fontSize,
            invert,
            lineHeight,
            night,
            paged,
            sepia,
        };
        const jsonMsg = {
            injectCSS: "yes",
            setCSS: cssJson,
            urlRoot: pubServerRoot,
        };
        return jsonMsg;
    }
    else {
        return { injectCSS: "rollback", setCSS: "rollback" };
    }
};
index_1.setReadiumCssJsonGetter(computeReadiumCssJsonMessage);
const saveReadingLocation = (doc, loc) => {
    let obj = electronStore.get("readingLocation");
    if (!obj) {
        obj = {};
    }
    obj[pathDecoded] = {
        doc,
        loc,
    };
    electronStore.set("readingLocation", obj);
};
index_1.setReadingLocationSaver(saveReadingLocation);
let publicationJsonUrl = queryParams["pub"];
console.log(publicationJsonUrl);
const publicationJsonUrl_ = publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    sessions_1.convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;
console.log(publicationJsonUrl_);
const pathBase64 = publicationJsonUrl_.
    replace(/.*\/pub\/(.*)\/manifest.json/, "$1").
    replace("*-URL_LCP_PASS_PLACEHOLDER-*", "");
console.log(pathBase64);
const pathDecoded = window.atob(pathBase64);
console.log(pathDecoded);
const pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
console.log(pathFileName);
const lcpHint = queryParams["lcpHint"];
electronStore.onChanged("styling.night", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.checked = newValue;
    readiumCssOnOff();
});
electronStore.onChanged("styling.align", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const nightSwitch = document.getElementById("justify_switch-input");
    nightSwitch.checked = (newValue === "justify");
    readiumCssOnOff();
});
electronStore.onChanged("styling.paged", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const paginateSwitch = document.getElementById("paginate_switch-input");
    paginateSwitch.checked = newValue;
    readiumCssOnOff();
});
const readiumCssOnOff = debounce(() => {
    index_1.readiumCssOnOff();
}, 500);
function ensureSliderLayout() {
    setTimeout(() => {
        const fontSizeSelector = document.getElementById("fontSizeSelector");
        fontSizeSelector.mdcSlider.layout();
        const lineHeightSelector = document.getElementById("lineHeightSelector");
        lineHeightSelector.mdcSlider.layout();
    }, 100);
}
electronStore.onChanged("styling.readiumcss", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = newValue ? "block" : "none";
    if (newValue) {
        ensureSliderLayout();
    }
    const readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    readiumcssSwitch.checked = newValue;
    readiumCssOnOff();
    const justifySwitch = document.getElementById("justify_switch-input");
    justifySwitch.disabled = !newValue;
    const paginateSwitch = document.getElementById("paginate_switch-input");
    paginateSwitch.disabled = !newValue;
    const nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("styling.night", false);
    }
});
electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const basicSwitch = document.getElementById("nav_basic_switch-input");
    basicSwitch.checked = !newValue;
});
let snackBar;
let drawer;
window.onerror = (err) => {
    console.log("Error", err);
};
electron_1.ipcRenderer.on(events_1.R2_EVENT_TRY_LCP_PASS_RES, (_event, payload) => {
    if (!payload.okay && payload.error) {
        let message;
        if (typeof payload.error === "string") {
            message = payload.error;
        }
        else {
            switch (payload.error) {
                case 0: {
                    message = "NONE: " + payload.error;
                    break;
                }
                case 1: {
                    message = "INCORRECT PASSPHRASE: " + payload.error;
                    break;
                }
                case 11: {
                    message = "LICENSE_OUT_OF_DATE: " + payload.error;
                    break;
                }
                case 101: {
                    message = "CERTIFICATE_REVOKED: " + payload.error;
                    break;
                }
                case 102: {
                    message = "CERTIFICATE_SIGNATURE_INVALID: " + payload.error;
                    break;
                }
                case 111: {
                    message = "LICENSE_SIGNATURE_DATE_INVALID: " + payload.error;
                    break;
                }
                case 112: {
                    message = "LICENSE_SIGNATURE_INVALID: " + payload.error;
                    break;
                }
                case 121: {
                    message = "CONTEXT_INVALID: " + payload.error;
                    break;
                }
                case 131: {
                    message = "CONTENT_KEY_DECRYPT_ERROR: " + payload.error;
                    break;
                }
                case 141: {
                    message = "USER_KEY_CHECK_INVALID: " + payload.error;
                    break;
                }
                case 151: {
                    message = "CONTENT_DECRYPT_ERROR: " + payload.error;
                    break;
                }
                default: {
                    message = "Unknown error?! " + payload.error;
                }
            }
        }
        setTimeout(() => {
            showLcpDialog(message);
        }, 500);
        return;
    }
    if (payload.passSha256Hex) {
        const lcpStore = electronStoreLCP.get("lcp");
        if (!lcpStore) {
            const lcpObj = {};
            const pubLcpObj = lcpObj[pathDecoded] = {};
            pubLcpObj.sha = payload.passSha256Hex;
            electronStoreLCP.set("lcp", lcpObj);
        }
        else {
            const pubLcpStore = lcpStore[pathDecoded];
            if (pubLcpStore) {
                pubLcpStore.sha = payload.passSha256Hex;
            }
            else {
                lcpStore[pathDecoded] = {
                    sha: payload.passSha256Hex,
                };
            }
            electronStoreLCP.set("lcp", lcpStore);
        }
        if (publicationJsonUrl.indexOf("URL_LCP_PASS_PLACEHOLDER") > 0) {
            let pazz = Buffer.from(payload.passSha256Hex).toString("base64");
            pazz = UrlUtils_1.encodeURIComponent_RFC3986(pazz);
            publicationJsonUrl = publicationJsonUrl.replace("URL_LCP_PASS_PLACEHOLDER", pazz);
            console.log(publicationJsonUrl);
        }
    }
    startNavigatorExperiment();
});
let lcpDialog;
function showLcpDialog(message) {
    const lcpPassHint = document.getElementById("lcpPassHint");
    lcpPassHint.textContent = lcpHint;
    if (message) {
        const lcpPassMessage = document.getElementById("lcpPassMessage");
        lcpPassMessage.textContent = message;
    }
    lcpDialog.show();
    setTimeout(() => {
        const lcpPassInput = document.getElementById("lcpPassInput");
        lcpPassInput.focus();
        setTimeout(() => {
            lcpPassInput.classList.add("no-focus-outline");
        }, 500);
    }, 800);
}
function installKeyboardMouseFocusHandler() {
    let dateLastKeyboardEvent = new Date();
    let dateLastMouseEvent = new Date();
    document.body.addEventListener("focusin", debounce((ev) => {
        const focusWasTriggeredByMouse = dateLastMouseEvent > dateLastKeyboardEvent;
        if (focusWasTriggeredByMouse) {
            if (ev.target && ev.target.classList) {
                ev.target.classList.add("no-focus-outline");
            }
        }
    }, 500));
    document.body.addEventListener("focusout", (ev) => {
        if (ev.target && ev.target.classList) {
            ev.target.classList.remove("no-focus-outline");
        }
    });
    document.body.addEventListener("mousedown", () => {
        dateLastMouseEvent = new Date();
    });
    document.body.addEventListener("keydown", () => {
        dateLastKeyboardEvent = new Date();
    });
}
const initLineHeightSelector = () => {
    const lineHeightSelector = document.getElementById("lineHeightSelector");
    const slider = new window.mdc.slider.MDCSlider(lineHeightSelector);
    lineHeightSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("styling.readiumcss");
    const val = electronStore.get("styling.lineHeight");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = 1.5 * 100;
    }
    electronStore.onChanged("styling.readiumcss", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("styling.lineHeight", "" + (event.detail.value / 100));
    });
    electronStore.onChanged("styling.lineHeight", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = parseFloat(newValue) * 100;
        readiumCssOnOff();
    });
};
const initFontSizeSelector = () => {
    const fontSizeSelector = document.getElementById("fontSizeSelector");
    const slider = new window.mdc.slider.MDCSlider(fontSizeSelector);
    fontSizeSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("styling.readiumcss");
    const val = electronStore.get("styling.fontSize");
    if (val) {
        slider.value = parseInt(val.replace("%", ""), 10);
    }
    else {
        slider.value = 100;
    }
    electronStore.onChanged("styling.readiumcss", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("styling.fontSize", event.detail.value + "%");
    });
    electronStore.onChanged("styling.fontSize", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = parseInt(newValue.replace("%", ""), 10);
        readiumCssOnOff();
    });
};
const initFontSelector = () => {
    const ID_PREFIX = "fontselect_";
    const options = [{
            id: ID_PREFIX + "DEFAULT",
            label: "Default font",
        }, {
            id: ID_PREFIX + "OLD",
            label: "Old Style",
            style: "font-family: \"Iowan Old Style\", \"Sitka Text\", Palatino, \"Book Antiqua\", serif;",
        }, {
            id: ID_PREFIX + "MODERN",
            label: "Modern",
            style: "font-family: Athelas, Constantia, Georgia, serif;",
        }, {
            id: ID_PREFIX + "SANS",
            label: "Sans",
            style: "font-family: -apple-system, system-ui, BlinkMacSystemFont," +
                " \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;",
        }, {
            id: ID_PREFIX + "HUMAN",
            label: "Humanist",
            style: "font-family: Seravek, Calibri, Roboto, Arial, sans-serif;",
        }, {
            id: ID_PREFIX + "DYS",
            label: "Readable (dys)",
            style: "font-family: AccessibleDfa;",
        }, {
            id: ID_PREFIX + "DUO",
            label: "Duospace",
            style: "font-family: \"IA Writer Duospace\", Consolas, monospace;",
        }, {
            id: ID_PREFIX + "MONO",
            label: "Monospace",
            style: "font-family: \"Andale Mono\", Consolas, monospace;",
        }];
    let selectedID = ID_PREFIX + electronStore.get("styling.font");
    const foundItem = options.find((item) => {
        return item.id === selectedID;
    });
    if (!foundItem) {
        selectedID = options[0].id;
    }
    const opts = {
        disabled: !electronStore.get("styling.readiumcss"),
        label: "Font name",
        options,
        selected: selectedID,
    };
    const tag = index_5.riotMountMenuSelect("#fontSelect", opts)[0];
    tag.on("selectionChanged", (val) => {
        val = val.replace(ID_PREFIX, "");
        electronStore.set("styling.font", val);
    });
    electronStore.onChanged("styling.font", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(ID_PREFIX + newValue);
        readiumCssOnOff();
    });
    electronStore.onChanged("styling.readiumcss", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let _sysFonts = [];
        const systemFonts = new SystemFonts.default();
        try {
            _sysFonts = yield systemFonts.getFonts();
        }
        catch (err) {
            console.log(err);
        }
        if (_sysFonts && _sysFonts.length) {
            const arr = tag.opts.options;
            const divider = {
                id: ID_PREFIX + "_",
                label: "_",
            };
            arr.push(divider);
            _sysFonts.forEach((sysFont) => {
                const option = {
                    id: ID_PREFIX + sysFont,
                    label: sysFont,
                    style: "font-family: " + sysFont + ";",
                };
                arr.push(option);
            });
            let newSelectedID = ID_PREFIX + electronStore.get("styling.font");
            const newFoundItem = options.find((item) => {
                return item.id === newSelectedID;
            });
            if (!newFoundItem) {
                newSelectedID = arr[0].id;
            }
            tag.opts.selected = newSelectedID;
            tag.update();
        }
    }), 100);
};
window.addEventListener("DOMContentLoaded", () => {
    window.mdc.menu.MDCMenuFoundation.numbers.TRANSITION_DURATION_MS = 200;
    window.document.addEventListener("keydown", (ev) => {
        if (drawer.open) {
            return;
        }
        if (ev.target.mdcSlider) {
            return;
        }
        if (ev.keyCode === 37) {
            index_1.navLeftOrRight(true);
        }
        else if (ev.keyCode === 39) {
            index_1.navLeftOrRight(false);
        }
    });
    setTimeout(() => {
        window.mdc.autoInit();
    }, 500);
    window.document.title = "Readium2 [ " + pathFileName + "]";
    const h1 = document.getElementById("pubTitle");
    h1.textContent = pathFileName;
    installKeyboardMouseFocusHandler();
    const drawerElement = document.getElementById("drawer");
    drawer = new window.mdc.drawer.MDCTemporaryDrawer(drawerElement);
    drawerElement.mdcTemporaryDrawer = drawer;
    const drawerButton = document.getElementById("drawerButton");
    drawerButton.addEventListener("click", () => {
        drawer.open = true;
    });
    initFontSelector();
    initFontSizeSelector();
    initLineHeightSelector();
    const nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.checked = electronStore.get("styling.night");
    nightSwitch.addEventListener("change", (_event) => {
        const checked = nightSwitch.checked;
        electronStore.set("styling.night", checked);
    });
    nightSwitch.disabled = !electronStore.get("styling.readiumcss");
    const justifySwitch = document.getElementById("justify_switch-input");
    justifySwitch.checked = electronStore.get("styling.align") === "justify";
    justifySwitch.addEventListener("change", (_event) => {
        const checked = justifySwitch.checked;
        electronStore.set("styling.align", checked ? "justify" : "initial");
    });
    justifySwitch.disabled = !electronStore.get("styling.readiumcss");
    const paginateSwitch = document.getElementById("paginate_switch-input");
    paginateSwitch.checked = electronStore.get("styling.paged");
    paginateSwitch.addEventListener("change", (_event) => {
        const checked = paginateSwitch.checked;
        electronStore.set("styling.paged", checked);
    });
    paginateSwitch.disabled = !electronStore.get("styling.readiumcss");
    const readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    readiumcssSwitch.checked = electronStore.get("styling.readiumcss");
    const stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = readiumcssSwitch.checked ? "block" : "none";
    if (readiumcssSwitch.checked) {
        ensureSliderLayout();
    }
    readiumcssSwitch.addEventListener("change", (_event) => {
        const checked = readiumcssSwitch.checked;
        electronStore.set("styling.readiumcss", checked);
    });
    const basicSwitch = document.getElementById("nav_basic_switch-input");
    basicSwitch.checked = !electronStore.get("basicLinkTitles");
    basicSwitch.addEventListener("change", (_event) => {
        const checked = basicSwitch.checked;
        electronStore.set("basicLinkTitles", !checked);
    });
    const snackBarElem = document.getElementById("snackbar");
    snackBar = new window.mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBarElem.mdcSnackbar = snackBar;
    snackBar.dismissesOnAction = true;
    const menuFactory = (menuEl) => {
        const menu = new window.mdc.menu.MDCMenu(menuEl);
        menuEl.mdcSimpleMenu = menu;
        return menu;
    };
    const selectElement = document.getElementById("nav-select");
    const navSelector = new window.mdc.select.MDCSelect(selectElement, undefined, menuFactory);
    selectElement.mdcSelect = navSelector;
    navSelector.listen("MDCSelect:change", (ev) => {
        const activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        const newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.selectedIndex + 1) + ")");
        if (newActivePanel) {
            newActivePanel.classList.add("active");
            const div = document.getElementById("reader_controls_STYLES");
            if (newActivePanel === div) {
                ensureSliderLayout();
            }
        }
    });
    const diagElem = document.querySelector("#lcpDialog");
    const lcpPassInput = document.getElementById("lcpPassInput");
    lcpDialog = new window.mdc.dialog.MDCDialog(diagElem);
    diagElem.mdcDialog = lcpDialog;
    lcpDialog.listen("MDCDialog:accept", () => {
        const lcpPass = lcpPassInput.value;
        const payload = {
            isSha256Hex: false,
            lcpPass,
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, payload);
    });
    lcpDialog.listen("MDCDialog:cancel", () => {
        setTimeout(() => {
            showLcpDialog();
        }, 10);
    });
    if (lcpPassInput) {
        lcpPassInput.addEventListener("keyup", (ev) => {
            if (ev.keyCode === 13) {
                ev.preventDefault();
                const lcpDialogAcceptButton = document.getElementById("lcpDialogAcceptButton");
                lcpDialogAcceptButton.click();
            }
        });
    }
    if (lcpHint) {
        let lcpPassSha256Hex;
        const lcpStore = electronStoreLCP.get("lcp");
        if (lcpStore) {
            const pubLcpStore = lcpStore[pathDecoded];
            if (pubLcpStore && pubLcpStore.sha) {
                lcpPassSha256Hex = pubLcpStore.sha;
            }
        }
        if (lcpPassSha256Hex) {
            const payload = {
                isSha256Hex: true,
                lcpPass: lcpPassSha256Hex,
                publicationFilePath: pathDecoded,
            };
            electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, payload);
        }
        else {
            showLcpDialog();
        }
    }
    else {
        startNavigatorExperiment();
    }
    const buttonClearReadingLocations = document.getElementById("buttonClearReadingLocations");
    buttonClearReadingLocations.addEventListener("click", () => {
        electronStore.set("readingLocation", {});
        drawer.open = false;
        setTimeout(() => {
            const message = "Reading locations reset.";
            const data = {
                actionHandler: () => {
                },
                actionOnBottom: false,
                actionText: "OK",
                message,
                multiline: false,
                timeout: 2000,
            };
            snackBar.show(data);
        }, 500);
    });
    const buttonClearSettings = document.getElementById("buttonClearSettings");
    buttonClearSettings.addEventListener("click", () => {
        electronStore.set(undefined, electronStore.getDefaults());
        drawer.open = false;
        setTimeout(() => {
            const message = "Settings reset.";
            const data = {
                actionHandler: () => {
                },
                actionOnBottom: false,
                actionText: "OK",
                message,
                multiline: false,
                timeout: 2000,
            };
            snackBar.show(data);
        }, 500);
    });
    const buttonClearSettingsStyle = document.getElementById("buttonClearSettingsStyle");
    buttonClearSettingsStyle.addEventListener("click", () => {
        electronStore.set("styling", electronStore.getDefaults().styling);
        drawer.open = false;
        setTimeout(() => {
            const message = "Default styles.";
            const data = {
                actionHandler: () => {
                },
                actionOnBottom: false,
                actionText: "OK",
                message,
                multiline: false,
                timeout: 2000,
            };
            snackBar.show(data);
        }, 500);
    });
    const buttonOpenSettings = document.getElementById("buttonOpenSettings");
    buttonOpenSettings.addEventListener("click", () => {
        if (electronStore.reveal) {
            electronStore.reveal();
        }
        if (electronStoreLCP.reveal) {
            electronStoreLCP.reveal();
        }
    });
    const buttonLSDRenew = document.getElementById("buttonLSDRenew");
    buttonLSDRenew.addEventListener("click", () => {
        const payload = {
            endDateStr: undefined,
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, payload);
    });
    const buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", () => {
        const payload = {
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, payload);
    });
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RENEW_RES, (_event, payload) => {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(payload.okay);
    console.log(payload.error);
    console.log(payload.lsdJson);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RETURN_RES, (_event, payload) => {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(payload.okay);
    console.log(payload.error);
    console.log(payload.lsdJson);
});
function startNavigatorExperiment() {
    const drawerButton = document.getElementById("drawerButton");
    drawerButton.focus();
    (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let response;
        try {
            response = yield fetch(publicationJsonUrl);
        }
        catch (e) {
            console.log(e);
            return;
        }
        if (!response.ok) {
            console.log("BAD RESPONSE?!");
        }
        let _publicationJSON;
        try {
            _publicationJSON = yield response.json();
        }
        catch (e) {
            console.log(e);
        }
        if (!_publicationJSON) {
            return;
        }
        const _publication = ta_json_1.JSON.deserialize(_publicationJSON, publication_1.Publication);
        if (_publication.Metadata && _publication.Metadata.Title) {
            let title;
            if (typeof _publication.Metadata.Title === "string") {
                title = _publication.Metadata.Title;
            }
            else {
                const keys = Object.keys(_publication.Metadata.Title);
                if (keys && keys.length) {
                    title = _publication.Metadata.Title[keys[0]];
                }
            }
            if (title) {
                const h1 = document.getElementById("pubTitle");
                h1.textContent = title;
            }
        }
        const buttonNavLeft = document.getElementById("buttonNavLeft");
        buttonNavLeft.addEventListener("click", (_event) => {
            index_1.navLeftOrRight(true);
        });
        const buttonNavRight = document.getElementById("buttonNavRight");
        buttonNavRight.addEventListener("click", (_event) => {
            index_1.navLeftOrRight(false);
        });
        if (_publication.Spine && _publication.Spine.length) {
            const opts = {
                basic: true,
                fixBasic: true,
                handleLink: handleLink_,
                links: _publicationJSON.spine,
                url: publicationJsonUrl,
            };
            index_2.riotMountLinkList("#reader_controls_SPINE", opts);
        }
        if (_publication.TOC && _publication.TOC.length) {
            const opts = {
                basic: electronStore.get("basicLinkTitles"),
                handleLink: handleLink_,
                links: _publicationJSON.toc,
                url: publicationJsonUrl,
            };
            const tag = index_4.riotMountLinkTree("#reader_controls_TOC", opts)[0];
            electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }
        if (_publication.PageList && _publication.PageList.length) {
            const opts = {
                basic: electronStore.get("basicLinkTitles"),
                handleLink: handleLink_,
                links: _publicationJSON["page-list"],
                url: publicationJsonUrl,
            };
            const tag = index_2.riotMountLinkList("#reader_controls_PAGELIST", opts)[0];
            electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }
        const landmarksData = [];
        if (_publication.Landmarks && _publication.Landmarks.length) {
            landmarksData.push({
                label: "Main",
                links: _publicationJSON.landmarks,
            });
        }
        if (_publication.LOT && _publication.LOT.length) {
            landmarksData.push({
                label: "Tables",
                links: _publicationJSON.lot,
            });
        }
        if (_publication.LOI && _publication.LOI.length) {
            landmarksData.push({
                label: "Illustrations",
                links: _publicationJSON.loi,
            });
        }
        if (_publication.LOV && _publication.LOV.length) {
            landmarksData.push({
                label: "Video",
                links: _publicationJSON.lov,
            });
        }
        if (_publication.LOA && _publication.LOA.length) {
            landmarksData.push({
                label: "Audio",
                links: _publicationJSON.loa,
            });
        }
        if (landmarksData.length) {
            const opts = {
                basic: electronStore.get("basicLinkTitles"),
                handleLink: handleLink_,
                linksgroup: landmarksData,
                url: publicationJsonUrl,
            };
            const tag = index_3.riotMountLinkListGroup("#reader_controls_LANDMARKS", opts)[0];
            electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }
        const readStore = electronStore.get("readingLocation");
        let pubDocHrefToLoad;
        let pubDocSelectorToGoto;
        if (readStore) {
            const obj = readStore[pathDecoded];
            if (obj && obj.doc) {
                pubDocHrefToLoad = obj.doc;
                if (obj.loc) {
                    pubDocSelectorToGoto = obj.loc;
                }
            }
        }
        drawer.open = true;
        setTimeout(() => {
            drawer.open = false;
            let preloadPath = "./preload.js";
            let distTarget;
            const dirnameSlashed = __dirname.replace(/\\/g, "/");
            if (dirnameSlashed.indexOf("/dist/es5") > 0) {
                distTarget = "es5";
            }
            else if (dirnameSlashed.indexOf("/dist/es6-es2015") > 0) {
                distTarget = "es6-es2015";
            }
            else if (dirnameSlashed.indexOf("/dist/es7-es2016") > 0) {
                distTarget = "es7-es2016";
            }
            else if (dirnameSlashed.indexOf("/dist/es8-es2017") > 0) {
                distTarget = "es8-es2017";
            }
            if (distTarget) {
                preloadPath = path.join(process.cwd(), "node_modules/r2-navigator-js/dist/" +
                    distTarget
                    + "/src/electron/renderer/webview/preload.js");
            }
            preloadPath = IS_DEV ? preloadPath : `${dirnameSlashed}/preload.js`;
            preloadPath = preloadPath.replace(/\\/g, "/");
            console.log(preloadPath);
            const rootHtmlElementID = "publication_viewport";
            const rootHtmlElement = document.getElementById(rootHtmlElementID);
            if (!rootHtmlElement) {
                console.log("!rootHtmlElement ???");
                return;
            }
            rootHtmlElement.addEventListener(index_1.DOM_EVENT_HIDE_VIEWPORT, () => {
                hideWebView();
            });
            rootHtmlElement.addEventListener(index_1.DOM_EVENT_SHOW_VIEWPORT, () => {
                unhideWebView();
            });
            index_1.installNavigatorDOM(_publication, publicationJsonUrl, rootHtmlElementID, preloadPath, pubDocHrefToLoad, pubDocSelectorToGoto);
        }, 500);
    }))();
}
const ELEMENT_ID_HIDE_PANEL = "r2_navigator_reader_chrome_HIDE";
let _viewHideInterval;
const unhideWebView = () => {
    if (_viewHideInterval) {
        clearInterval(_viewHideInterval);
        _viewHideInterval = undefined;
    }
    const hidePanel = document.getElementById(ELEMENT_ID_HIDE_PANEL);
    if (!hidePanel || hidePanel.style.display === "none") {
        return;
    }
    if (hidePanel) {
        hidePanel.style.display = "none";
    }
};
const hideWebView = () => {
    const hidePanel = document.getElementById(ELEMENT_ID_HIDE_PANEL);
    if (hidePanel && hidePanel.style.display !== "block") {
        hidePanel.style.display = "block";
        _viewHideInterval = setInterval(() => {
            console.log("unhideWebView FORCED");
            unhideWebView();
        }, 5000);
    }
};
function handleLink_(href) {
    if (drawer.open) {
        drawer.open = false;
        setTimeout(() => {
            index_1.handleLink(href, undefined, false);
        }, 200);
    }
    else {
        index_1.handleLink(href, undefined, false);
    }
}
//# sourceMappingURL=index.js.map