"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const SystemFonts = require("system-font-families");
const debounce = require("debounce");
const URI = require("urijs");
const publication_1 = require("r2-shared-js/dist/es6-es2015/src/models/publication");
const init_globals_1 = require("r2-shared-js/dist/es6-es2015/src/init-globals");
const UrlUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const electron_1 = require("electron");
const electron_2 = require("electron");
const ta_json_1 = require("ta-json");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const store_electron_1 = require("../common/store-electron");
const querystring_1 = require("./common/querystring");
const index_1 = require("./riots/linklist/index_");
const index_2 = require("./riots/linklistgroup/index_");
const index_3 = require("./riots/linktree/index_");
const index_4 = require("./riots/menuselect/index_");
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
const queryParams = querystring_1.getURLQueryParams();
const publicationJsonUrl = queryParams["pub"];
const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
const pathDecoded = window.atob(pathBase64);
const pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
const lcpHint = queryParams["lcpHint"];
electronStore.onChanged("styling.night", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.checked = newValue;
    if (newValue) {
        document.body.classList.add("mdc-theme--dark");
    }
    else {
        document.body.classList.remove("mdc-theme--dark");
    }
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
        const jsonMsg = { injectCSS: "yes", setCSS: cssJson };
        return JSON.stringify(jsonMsg, null, 0);
    }
    else {
        const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
        return JSON.stringify(jsonMsg, null, 0);
    }
};
const readiumCssOnOff = debounce(() => {
    const str = computeReadiumCssJsonMessage();
    _webview1.send(events_1.R2_EVENT_READIUMCSS, str);
    _webview2.send(events_1.R2_EVENT_READIUMCSS, str);
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
const unhideWebView = (forced) => {
    if (_viewHideInterval) {
        clearInterval(_viewHideInterval);
        _viewHideInterval = undefined;
    }
    const hidePanel = document.getElementById("reader_chrome_HIDE");
    if (hidePanel.style.display === "none") {
        return;
    }
    if (forced) {
        console.log("unhideWebView FORCED");
    }
    if (hidePanel) {
        hidePanel.style.display = "none";
    }
};
electron_2.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, href) => {
    console.log("R2_EVENT_LINK");
    console.log(href);
    handleLink(href, undefined, false);
});
electron_2.ipcRenderer.on(events_1.R2_EVENT_TRY_LCP_PASS_RES, (_event, okay, msg, passSha256Hex) => {
    if (!okay) {
        setTimeout(() => {
            showLcpDialog(msg);
        }, 500);
        return;
    }
    const lcpStore = electronStoreLCP.get("lcp");
    if (!lcpStore) {
        const lcpObj = {};
        const pubLcpObj = lcpObj[pathDecoded] = {};
        pubLcpObj.sha = passSha256Hex;
        electronStoreLCP.set("lcp", lcpObj);
    }
    else {
        const pubLcpStore = lcpStore[pathDecoded];
        if (pubLcpStore) {
            pubLcpStore.sha = passSha256Hex;
        }
        else {
            lcpStore[pathDecoded] = {
                sha: passSha256Hex,
            };
        }
        electronStoreLCP.set("lcp", lcpStore);
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
    const tag = index_4.riotMountMenuSelect("#fontSelect", opts)[0];
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
    window.mdc.menu.MDCSimpleMenuFoundation.numbers.TRANSITION_DURATION_MS = 200;
    window.document.addEventListener("keydown", (ev) => {
        if (drawer.open) {
            return;
        }
        if (ev.target.mdcSlider) {
            return;
        }
        if (ev.keyCode === 37) {
            navLeftOrRight(true);
        }
        else if (ev.keyCode === 39) {
            navLeftOrRight(false);
        }
    });
    setTimeout(() => {
        window.mdc.autoInit();
    }, 500);
    window.document.title = "Readium2 [ " + pathFileName + "]";
    const h1 = document.getElementById("pubTitle");
    h1.textContent = pathFileName;
    installKeyboardMouseFocusHandler();
    if (electronStore.get("styling.night")) {
        document.body.classList.add("mdc-theme--dark");
    }
    else {
        document.body.classList.remove("mdc-theme--dark");
    }
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
        const menu = new window.mdc.menu.MDCSimpleMenu(menuEl);
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
        electron_2.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass, false);
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
            electron_2.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPassSha256Hex, true);
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
        electron_2.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, pathDecoded, "");
    });
    const buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", () => {
        electron_2.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, pathDecoded);
    });
});
electron_2.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RENEW_RES, (_event, okay, msg) => {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(okay);
    console.log(msg);
});
electron_2.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RETURN_RES, (_event, okay, msg) => {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(okay);
    console.log(msg);
});
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
let _webview1;
let _webview2;
function createWebView() {
    const wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    wv.setAttribute("httpreferrer", publicationJsonUrl);
    wv.setAttribute("preload", "./webview/preload.js");
    wv.setAttribute("disableguestresize", "");
    setTimeout(() => {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", () => {
        wv.clearHistory();
    });
    wv.addEventListener("ipc-message", (event) => {
        const webview = event.currentTarget;
        const activeWebView = getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_LINK) {
            handleLink(event.args[0], undefined, false);
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_READY) {
            unhideWebView(false);
        }
        else if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
            const cssSelector = event.args[0];
            if (webview.READIUM2_LINK) {
                saveReadingLocation(webview.READIUM2_LINK.Href, cssSelector);
            }
        }
        else if (event.channel === events_1.R2_EVENT_PAGE_TURN_RES) {
            if (!_publication) {
                return;
            }
            const messageString = event.args[0];
            const messageJson = JSON.parse(messageString);
            const goPREVIOUS = messageJson.go === "PREVIOUS";
            if (!webview.READIUM2_LINK) {
                console.log("WEBVIEW READIUM2_LINK ??!!");
                return;
            }
            let nextOrPreviousSpineItem;
            for (let i = 0; i < _publication.Spine.length; i++) {
                if (_publication.Spine[i] === webview.READIUM2_LINK) {
                    if (goPREVIOUS && (i - 1) >= 0) {
                        nextOrPreviousSpineItem = _publication.Spine[i - 1];
                    }
                    else if (!goPREVIOUS && (i + 1) < _publication.Spine.length) {
                        nextOrPreviousSpineItem = _publication.Spine[i + 1];
                    }
                    break;
                }
            }
            if (!nextOrPreviousSpineItem) {
                return;
            }
            const linkHref = publicationJsonUrl + "/../" + nextOrPreviousSpineItem.Href;
            handleLink(linkHref, goPREVIOUS, false);
        }
        else {
            console.log("webview1 ipc-message");
            console.log(event.channel);
        }
    });
    return wv;
}
const adjustResize = (webview) => {
    const width = webview.clientWidth;
    const height = webview.clientHeight;
    const wc = webview.getWebContents();
    if (wc && width && height) {
        wc.setSize({
            normal: {
                height,
                width,
            },
        });
    }
};
const onResizeDebounced = debounce(() => {
    adjustResize(_webview1);
    adjustResize(_webview2);
    setTimeout(() => {
        unhideWebView(false);
    }, 1000);
}, 200);
window.addEventListener("resize", () => {
    const hidePanel = document.getElementById("reader_chrome_HIDE");
    if (hidePanel.style.display !== "block") {
        hidePanel.style.display = "block";
        _viewHideInterval = setInterval(() => {
            unhideWebView(true);
        }, 5000);
    }
    onResizeDebounced();
});
function handleLink(href, previous, useGoto) {
    const prefix = publicationJsonUrl.replace("manifest.json", "");
    if (href.startsWith(prefix)) {
        if (drawer.open) {
            drawer.open = false;
            setTimeout(() => {
                loadLink(href, previous, useGoto);
            }, 200);
        }
        else {
            loadLink(href, previous, useGoto);
        }
    }
    else {
        electron_1.shell.openExternal(href);
    }
}
exports.handleLink = handleLink;
let _viewHideInterval;
function loadLink(hrefFull, previous, useGoto) {
    if (!_publication) {
        return;
    }
    const rcssJsonstr = computeReadiumCssJsonMessage();
    const rcssJsonstrBase64 = window.btoa(rcssJsonstr);
    const linkUri = new URI(hrefFull);
    linkUri.search((data) => {
        if (typeof previous === "undefined") {
            data.readiumprevious = undefined;
        }
        else {
            data.readiumprevious = previous ? "true" : "false";
        }
        if (!useGoto) {
            data.readiumgoto = undefined;
        }
        data.readiumcss = rcssJsonstrBase64;
    });
    if (useGoto) {
        linkUri.hash("").normalizeHash();
    }
    const pubUri = new URI(publicationJsonUrl);
    const pathPrefix = pubUri.path().replace("manifest.json", "");
    const linkPath = decodeURIComponent(linkUri.normalizePath().path().replace(pathPrefix, ""));
    let pubLink = _publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    });
    if (!pubLink) {
        pubLink = _publication.Resources.find((spineLink) => {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        console.log("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return;
    }
    const activeWebView = getActiveWebView();
    const wv1AlreadyLoaded = _webview1.READIUM2_LINK === pubLink;
    const wv2AlreadyLoaded = _webview2.READIUM2_LINK === pubLink;
    if (wv1AlreadyLoaded || wv2AlreadyLoaded) {
        const msgJson = {
            goto: useGoto ? linkUri.search("readiumgoto") : undefined,
            hash: useGoto ? undefined : linkUri.fragment(),
            previous,
        };
        const msgStr = JSON.stringify(msgJson);
        console.log("ALREADY LOADED: " + pubLink.Href);
        console.log(msgStr);
        const webviewToReuse = wv1AlreadyLoaded ? _webview1 : _webview2;
        if (webviewToReuse !== activeWebView) {
            console.log("INTO VIEW ...");
            const slidingView = document.getElementById("sliding_viewport");
            let animate = true;
            if (msgJson.goto || msgJson.hash) {
                console.log("DISABLE ANIM");
                animate = false;
            }
            else if (previous) {
                if (!slidingView.classList.contains("shiftedLeft")) {
                    console.log("DISABLE ANIM");
                    animate = false;
                }
            }
            if (animate) {
                if (!slidingView.classList.contains("animated")) {
                    slidingView.classList.add("animated");
                }
            }
            else {
                if (slidingView.classList.contains("animated")) {
                    slidingView.classList.remove("animated");
                }
            }
            if (slidingView.classList.contains("shiftedLeft")) {
                slidingView.classList.remove("shiftedLeft");
            }
            else {
                slidingView.classList.add("shiftedLeft");
            }
        }
        webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, msgStr);
        return;
    }
    const hidePanel = document.getElementById("reader_chrome_HIDE");
    hidePanel.style.display = "block";
    _viewHideInterval = setInterval(() => {
        unhideWebView(true);
    }, 5000);
    const uriStr = linkUri.toString();
    console.log("####### >>> ---");
    console.log(activeWebView.readiumwebviewid);
    console.log(pubLink.Href);
    console.log(linkUri.hash());
    console.log(linkUri.search(true)["readiumgoto"]);
    console.log(linkUri.search(true)["readiumprevious"]);
    console.log("####### >>> ---");
    activeWebView.READIUM2_LINK = pubLink;
    activeWebView.setAttribute("src", uriStr);
    const enableOffScreenRenderPreload = false;
    if (enableOffScreenRenderPreload) {
        setTimeout(() => {
            if (!_publication || !pubLink) {
                return;
            }
            const otherWebview = activeWebView === _webview2 ? _webview1 : _webview2;
            const index = _publication.Spine.indexOf(pubLink);
            if (index >= 0 &&
                previous && (index - 1) >= 0 ||
                !previous && (index + 1) < _publication.Spine.length) {
                const nextPubLink = _publication.Spine[previous ? (index - 1) : (index + 1)];
                if (otherWebview.READIUM2_LINK !== nextPubLink) {
                    const linkUriNext = new URI(publicationJsonUrl + "/../" + nextPubLink.Href);
                    linkUriNext.normalizePath();
                    linkUriNext.search((data) => {
                        data.readiumcss = rcssJsonstrBase64;
                    });
                    const uriStrNext = linkUriNext.toString();
                    console.log("####### ======");
                    console.log(otherWebview.readiumwebviewid);
                    console.log(nextPubLink.Href);
                    console.log(linkUriNext.hash());
                    console.log(linkUriNext.search(true)["readiumgoto"]);
                    console.log(linkUriNext.search(true)["readiumprevious"]);
                    console.log("####### ======");
                    otherWebview.READIUM2_LINK = nextPubLink;
                    otherWebview.setAttribute("src", uriStrNext);
                }
            }
        }, 300);
    }
}
const getActiveWebView = () => {
    let activeWebView;
    const slidingViewport = document.getElementById("sliding_viewport");
    if (slidingViewport.classList.contains("shiftedLeft")) {
        if (_webview1.classList.contains("posRight")) {
            activeWebView = _webview1;
        }
        else {
            activeWebView = _webview2;
        }
    }
    else {
        if (_webview2.classList.contains("posRight")) {
            activeWebView = _webview1;
        }
        else {
            activeWebView = _webview2;
        }
    }
    return activeWebView;
};
let _publication;
let _publicationJSON;
function startNavigatorExperiment() {
    const drawerButton = document.getElementById("drawerButton");
    drawerButton.focus();
    _webview1 = createWebView();
    _webview1.readiumwebviewid = 1;
    _webview1.setAttribute("id", "webview1");
    _webview1.setAttribute("class", "full");
    _webview2 = createWebView();
    _webview2.readiumwebviewid = 2;
    _webview2.setAttribute("id", "webview2");
    _webview2.setAttribute("class", "full");
    const slidingViewport = document.getElementById("sliding_viewport");
    slidingViewport.appendChild(_webview1);
    slidingViewport.appendChild(_webview2);
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
        try {
            _publicationJSON = yield response.json();
        }
        catch (e) {
            console.log(e);
        }
        if (!_publicationJSON) {
            return;
        }
        _publication = ta_json_1.JSON.deserialize(_publicationJSON, publication_1.Publication);
        const isRTL = _publication.Metadata &&
            _publication.Metadata.Direction &&
            _publication.Metadata.Direction.toLowerCase() === "rtl";
        if (isRTL) {
            _webview1.classList.add("posRight");
        }
        else {
            _webview2.classList.add("posRight");
        }
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
            navLeftOrRight(true);
        });
        const buttonNavRight = document.getElementById("buttonNavRight");
        buttonNavRight.addEventListener("click", (_event) => {
            navLeftOrRight(false);
        });
        if (_publication.Spine && _publication.Spine.length) {
            const opts = {
                basic: true,
                fixBasic: true,
                links: _publicationJSON.spine,
                url: publicationJsonUrl,
            };
            index_1.riotMountLinkList("#reader_controls_SPINE", opts);
        }
        if (_publication.TOC && _publication.TOC.length) {
            const opts = {
                basic: electronStore.get("basicLinkTitles"),
                links: _publicationJSON.toc,
                url: publicationJsonUrl,
            };
            const tag = index_3.riotMountLinkTree("#reader_controls_TOC", opts)[0];
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
                links: _publicationJSON["page-list"],
                url: publicationJsonUrl,
            };
            const tag = index_1.riotMountLinkList("#reader_controls_PAGELIST", opts)[0];
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
                linksgroup: landmarksData,
                url: publicationJsonUrl,
            };
            const tag = index_2.riotMountLinkListGroup("#reader_controls_LANDMARKS", opts)[0];
            electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }
        const readStore = electronStore.get("readingLocation");
        let linkToLoad;
        let linkToLoadGoto;
        if (readStore) {
            const obj = readStore[pathDecoded];
            if (obj && obj.doc) {
                if (_publication.Spine && _publication.Spine.length) {
                    linkToLoad = _publication.Spine.find((spineLink) => {
                        return spineLink.Href === obj.doc;
                    });
                    if (linkToLoad && obj.loc) {
                        linkToLoadGoto = obj.loc;
                    }
                }
                if (!linkToLoad &&
                    _publication.Resources && _publication.Resources.length) {
                    linkToLoad = _publication.Resources.find((resLink) => {
                        return resLink.Href === obj.doc;
                    });
                    if (linkToLoad && obj.loc) {
                        linkToLoadGoto = obj.loc;
                    }
                }
            }
        }
        if (!linkToLoad) {
            if (_publication.Spine && _publication.Spine.length) {
                const firstLinear = _publication.Spine[0];
                if (firstLinear) {
                    linkToLoad = firstLinear;
                }
            }
        }
        setTimeout(() => {
            drawer.open = true;
            if (linkToLoad) {
                const hrefToLoad = publicationJsonUrl + "/../" + linkToLoad.Href +
                    (linkToLoadGoto ? ("?readiumgoto=" + UrlUtils_1.encodeURIComponent_RFC3986(linkToLoadGoto)) : "");
                handleLink(hrefToLoad, undefined, true);
            }
        }, 100);
    }))();
}
function navLeftOrRight(left) {
    if (!_publication) {
        return;
    }
    const activeWebView = getActiveWebView();
    const isRTL = _publication.Metadata &&
        _publication.Metadata.Direction &&
        _publication.Metadata.Direction.toLowerCase() === "rtl";
    const goPREVIOUS = left ? !isRTL : isRTL;
    const messageJson = {
        direction: isRTL ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    const messageStr = JSON.stringify(messageJson);
    activeWebView.send(events_1.R2_EVENT_PAGE_TURN, messageStr);
}
//# sourceMappingURL=index.js.map