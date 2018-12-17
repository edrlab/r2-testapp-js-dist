"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const readium_css_settings_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/common/readium-css-settings");
const sessions_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/common/sessions");
const querystring_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/renderer/common/querystring");
const console_redirect_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/renderer/console-redirect");
const index_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/renderer/index");
const init_globals_1 = require("r2-opds-js/dist/es8-es2017/src/opds/init-globals");
const init_globals_2 = require("r2-shared-js/dist/es8-es2017/src/init-globals");
const publication_1 = require("r2-shared-js/dist/es8-es2017/src/models/publication");
const debounce_1 = require("debounce");
const electron_1 = require("electron");
const ta_json_x_1 = require("ta-json-x");
const events_1 = require("../common/events");
const store_electron_1 = require("../common/store-electron");
const index_2 = require("./riots/linklist/index_");
const index_3 = require("./riots/linklistgroup/index_");
const index_4 = require("./riots/linktree/index_");
const index_5 = require("./riots/menuselect/index_");
const SystemFonts = require("system-font-families");
console_redirect_1.consoleRedirect("r2:testapp#electron/renderer/index", process.stdout, process.stderr, true);
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
const readiumCssDefaultsJson = readium_css_settings_1.readiumCSSDefaults;
const readiumCssKeys = Object.keys(readium_css_settings_1.readiumCSSDefaults);
readiumCssKeys.forEach((key) => {
    const value = readium_css_settings_1.readiumCSSDefaults[key];
    if (typeof value === "undefined") {
        readiumCssDefaultsJson[key] = null;
    }
    else {
        readiumCssDefaultsJson[key] = value;
    }
});
const electronStore = new store_electron_1.StoreElectron("readium2-testapp", {
    basicLinkTitles: true,
    readiumCSS: readiumCssDefaultsJson,
    readiumCSSEnable: false,
});
const electronStoreLCP = new store_electron_1.StoreElectron("readium2-testapp-lcp", {});
init_globals_1.initGlobalConverters_OPDS();
init_globals_2.initGlobalConverters_SHARED();
init_globals_2.initGlobalConverters_GENERIC();
const pubServerRoot = queryParams["pubServerRoot"];
console.log(pubServerRoot);
const computeReadiumCssJsonMessage = () => {
    const on = electronStore.get("readiumCSSEnable");
    if (on) {
        let cssJson = electronStore.get("readiumCSS");
        console.log("---- readiumCSS -----");
        console.log(cssJson);
        console.log("-----");
        if (!cssJson) {
            cssJson = readium_css_settings_1.readiumCSSDefaults;
        }
        const jsonMsg = {
            setCSS: cssJson,
            urlRoot: pubServerRoot,
        };
        return jsonMsg;
    }
    else {
        return { setCSS: undefined };
    }
};
index_1.setReadiumCssJsonGetter(computeReadiumCssJsonMessage);
const getEpubReadingSystem = () => {
    return { name: "Readium2 test app", version: "0.0.1-alpha.1" };
};
index_1.setEpubReadingSystemJsonGetter(getEpubReadingSystem);
const saveReadingLocation = (location) => {
    let obj = electronStore.get("readingLocation");
    if (!obj) {
        obj = {};
    }
    obj[pathDecoded] = {
        doc: location.locator.href,
        loc: undefined,
        locCfi: location.locator.locations.cfi,
        locCssSelector: location.locator.locations.cssSelector,
        locPosition: location.locator.locations.position,
        locProgression: location.locator.locations.progression,
    };
    electronStore.set("readingLocation", obj);
};
index_1.setReadingLocationSaver(saveReadingLocation);
const publicationJsonUrl = queryParams["pub"];
console.log(publicationJsonUrl);
const publicationJsonUrl_ = publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    sessions_1.convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;
console.log(publicationJsonUrl_);
const pathBase64 = publicationJsonUrl_.
    replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
console.log(pathBase64);
const pathDecoded = window.atob(pathBase64);
console.log(pathDecoded);
const pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
console.log(pathFileName);
const lcpHint = queryParams["lcpHint"];
electronStore.onChanged("readiumCSS.colCount", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    console.log("readiumCSS.colCount: ", oldValue, " => ", newValue);
    readiumCssOnOff();
});
electronStore.onChanged("readiumCSS.night", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const nightSwitchEl = document.getElementById("night_switch");
    const nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.checked = newValue;
    readiumCssOnOff();
});
electronStore.onChanged("readiumCSS.textAlign", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const justifySwitchEl = document.getElementById("justify_switch");
    const justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.checked = (newValue === "justify");
    readiumCssOnOff();
});
electronStore.onChanged("readiumCSS.paged", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const paginateSwitchEl = document.getElementById("paginate_switch");
    const paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.checked = newValue;
    readiumCssOnOff();
});
const readiumCssOnOff = debounce_1.debounce(() => {
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
electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = newValue ? "block" : "none";
    if (newValue) {
        ensureSliderLayout();
    }
    const readiumcssSwitchEl = document.getElementById("readiumcss_switch");
    const readiumcssSwitch = readiumcssSwitchEl.mdcSwitch;
    readiumcssSwitch.checked = newValue;
    readiumCssOnOff();
    const justifySwitchEl = document.getElementById("justify_switch");
    const justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.disabled = !newValue;
    const paginateSwitchEl = document.getElementById("paginate_switch");
    const paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.disabled = !newValue;
    const nightSwitchEl = document.getElementById("night_switch");
    const nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("readiumCSS.night", false);
    }
});
electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const basicSwitchEl = document.getElementById("nav_basic_switch");
    const basicSwitch = basicSwitchEl.mdcSwitch;
    basicSwitch.checked = !newValue;
});
let snackBar;
let drawer;
window.onerror = (err) => {
    console.log("window.onerror:");
    console.log(err);
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
    lcpDialog.open();
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
    document.body.addEventListener("focusin", debounce_1.debounce((ev) => {
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
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.lineHeight");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = 1.5 * 100;
    }
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.lineHeight", "" + (event.detail.value / 100));
    });
    electronStore.onChanged("readiumCSS.lineHeight", (newValue, oldValue) => {
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
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.fontSize");
    if (val) {
        slider.value = parseInt(val.replace("%", ""), 10);
    }
    else {
        slider.value = 100;
    }
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.fontSize", event.detail.value + "%");
    });
    electronStore.onChanged("readiumCSS.fontSize", (newValue, oldValue) => {
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
    let selectedID = ID_PREFIX + electronStore.get("readiumCSS.font");
    const foundItem = options.find((item) => {
        return item.id === selectedID;
    });
    if (!foundItem) {
        selectedID = options[0].id;
    }
    const opts = {
        disabled: !electronStore.get("readiumCSSEnable"),
        label: "Font name",
        options,
        selected: selectedID,
    };
    const tag = index_5.riotMountMenuSelect("#fontSelect", opts)[0];
    tag.on("selectionChanged", (index) => {
        console.log("selectionChanged");
        console.log(index);
        let id = tag.getIdForIndex(index);
        console.log(id);
        if (!id) {
            return;
        }
        id = id.replace(ID_PREFIX, "");
        electronStore.set("readiumCSS.font", id);
    });
    electronStore.onChanged("readiumCSS.font", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(ID_PREFIX + newValue);
        readiumCssOnOff();
    });
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    setTimeout(async () => {
        let _sysFonts = [];
        const systemFonts = new SystemFonts.default();
        try {
            _sysFonts = await systemFonts.getFonts();
        }
        catch (err) {
            console.log(err);
        }
        if (_sysFonts && _sysFonts.length) {
            const arr = tag.opts.options;
            _sysFonts.forEach((sysFont) => {
                const option = {
                    id: ID_PREFIX + sysFont,
                    label: sysFont,
                    style: "font-family: " + sysFont + ";",
                };
                arr.push(option);
            });
            let newSelectedID = ID_PREFIX + electronStore.get("readiumCSS.font");
            const newFoundItem = options.find((item) => {
                return item.id === newSelectedID;
            });
            if (!newFoundItem) {
                newSelectedID = arr[0].id;
            }
            tag.opts.selected = newSelectedID;
            tag.update();
        }
    }, 100);
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
    drawer = new window.mdc.drawer.MDCDrawer(drawerElement);
    drawerElement.mdcTemporaryDrawer = drawer;
    const drawerButton = document.getElementById("drawerButton");
    drawerButton.addEventListener("click", () => {
        drawer.open = true;
    });
    initFontSelector();
    initFontSizeSelector();
    initLineHeightSelector();
    const nightSwitchEl = document.getElementById("night_switch");
    const nightSwitch = new window.mdc.switchControl.MDCSwitch(nightSwitchEl);
    nightSwitchEl.mdcSwitch = nightSwitch;
    nightSwitch.checked = electronStore.get("readiumCSS.night");
    nightSwitchEl.addEventListener("change", (_event) => {
        const checked = nightSwitch.checked;
        electronStore.set("readiumCSS.night", checked);
    });
    nightSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const justifySwitchEl = document.getElementById("justify_switch");
    const justifySwitch = new window.mdc.switchControl.MDCSwitch(justifySwitchEl);
    justifySwitchEl.mdcSwitch = justifySwitch;
    justifySwitch.checked = electronStore.get("readiumCSS.textAlign") === "justify";
    justifySwitchEl.addEventListener("change", (_event) => {
        const checked = justifySwitch.checked;
        electronStore.set("readiumCSS.textAlign", checked ? "justify" : "initial");
    });
    justifySwitch.disabled = !electronStore.get("readiumCSSEnable");
    const paginateSwitchEl = document.getElementById("paginate_switch");
    const paginateSwitch = new window.mdc.switchControl.MDCSwitch(paginateSwitchEl);
    paginateSwitchEl.mdcSwitch = paginateSwitch;
    paginateSwitch.checked = electronStore.get("readiumCSS.paged");
    paginateSwitchEl.addEventListener("change", (_event) => {
        const checked = paginateSwitch.checked;
        electronStore.set("readiumCSS.paged", checked);
    });
    paginateSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const readiumcssSwitchEl = document.getElementById("readiumcss_switch");
    const readiumcssSwitch = new window.mdc.switchControl.MDCSwitch(readiumcssSwitchEl);
    readiumcssSwitchEl.mdcSwitch = readiumcssSwitch;
    readiumcssSwitch.checked = electronStore.get("readiumCSSEnable");
    const stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = readiumcssSwitch.checked ? "block" : "none";
    if (readiumcssSwitch.checked) {
        ensureSliderLayout();
    }
    readiumcssSwitchEl.addEventListener("change", (_event) => {
        const checked = readiumcssSwitch.checked;
        electronStore.set("readiumCSSEnable", checked);
    });
    const basicSwitchEl = document.getElementById("nav_basic_switch");
    const basicSwitch = new window.mdc.switchControl.MDCSwitch(basicSwitchEl);
    basicSwitchEl.mdcSwitch = basicSwitch;
    basicSwitch.checked = !electronStore.get("basicLinkTitles");
    basicSwitchEl.addEventListener("change", (_event) => {
        const checked = basicSwitch.checked;
        electronStore.set("basicLinkTitles", !checked);
    });
    const snackBarElem = document.getElementById("snackbar");
    snackBar = new window.mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBarElem.mdcSnackbar = snackBar;
    snackBar.dismissesOnAction = true;
    const selectElement = document.getElementById("nav-select");
    const navSelector = new window.mdc.select.MDCSelect(selectElement);
    selectElement.mdcSelect = navSelector;
    navSelector.listen("change", (ev) => {
        const activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        const newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.target.selectedIndex + 1) + ")");
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
    lcpDialog.listen("MDCDialog:opened", () => {
        console.log("MDCDialog:opened");
    });
    lcpDialog.listen("MDCDialog:closed", (event) => {
        console.log("MDCDialog:closed");
        if (event.detail.action === "close") {
            console.log("MDCDialog:ACTION:close");
            setTimeout(() => {
                showLcpDialog();
            }, 10);
        }
        else if (event.detail.action === "accept") {
            console.log("MDCDialog:ACTION:accept");
            const lcpPass = lcpPassInput.value;
            const payload = {
                isSha256Hex: false,
                lcpPass,
                publicationFilePath: pathDecoded,
            };
            electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, payload);
        }
        else {
            console.log("!! MDCDialog:ACTION:" + event.detail.action);
            setTimeout(() => {
                showLcpDialog();
            }, 10);
        }
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
        electronStore.set("readiumCSS", electronStore.getDefaults().readiumCSS);
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
    (async () => {
        let response;
        try {
            response = await fetch(publicationJsonUrl);
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
            _publicationJSON = await response.json();
        }
        catch (e) {
            console.log(e);
        }
        if (!_publicationJSON) {
            return;
        }
        const _publication = ta_json_x_1.JSON.deserialize(_publicationJSON, publication_1.Publication);
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
                links: (_publicationJSON.spine || _publicationJSON.readingOrder),
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
        let location;
        if (readStore) {
            const obj = readStore[pathDecoded];
            if (obj && obj.doc) {
                if (obj.loc) {
                    location = { href: obj.doc, locations: { cfi: undefined, cssSelector: obj.loc } };
                }
                else if (obj.locCssSelector) {
                    location = { href: obj.doc, locations: { cfi: undefined, cssSelector: obj.locCssSelector } };
                }
                if (obj.locCfi) {
                    if (!location) {
                        location = { href: obj.doc, locations: { cfi: obj.locCfi, cssSelector: "body" } };
                    }
                    else {
                        location.locations.cfi = obj.locCfi;
                    }
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
            index_1.installNavigatorDOM(_publication, publicationJsonUrl, rootHtmlElementID, preloadPath, location);
        }, 500);
    })();
}
const ELEMENT_ID_HIDE_PANEL = "r2_navigator_reader_chrome_HIDE";
let _viewHideInterval;
const unhideWebView = () => {
    if (window) {
        return;
    }
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
    if (window) {
        return;
    }
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
            index_1.handleLinkUrl(href);
        }, 200);
    }
    else {
        index_1.handleLinkUrl(href);
    }
}
//# sourceMappingURL=index.js.map