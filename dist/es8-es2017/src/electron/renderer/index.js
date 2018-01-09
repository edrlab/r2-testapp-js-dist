"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const SystemFonts = require("system-font-families");
const debounce = require("debounce");
const publication_1 = require("r2-shared-js/dist/es8-es2017/src/models/publication");
const events_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/common/events");
const querystring_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/renderer/common/querystring");
const index_1 = require("r2-navigator-js/dist/es8-es2017/src/electron/renderer/index");
const init_globals_1 = require("r2-shared-js/dist/es8-es2017/src/init-globals");
const electron_1 = require("electron");
const ta_json_1 = require("ta-json");
const store_electron_1 = require("../common/store-electron");
const index_2 = require("./riots/linklist/index_");
const index_3 = require("./riots/linklistgroup/index_");
const index_4 = require("./riots/linktree/index_");
const index_5 = require("./riots/menuselect/index_");
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_TRY_LCP_PASS_RES, (_event, okay, msg, passSha256Hex) => {
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
    }, 100);
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
        electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass, false);
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
            electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPassSha256Hex, true);
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
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, pathDecoded, "");
    });
    const buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", () => {
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, pathDecoded);
    });
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RENEW_RES, (_event, okay, msg) => {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(okay);
    console.log(msg);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RETURN_RES, (_event, okay, msg) => {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(okay);
    console.log(msg);
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
            if (__dirname.indexOf("/dist/es5") > 0) {
                distTarget = "es5";
            }
            else if (__dirname.indexOf("/dist/es6-es2015") > 0) {
                distTarget = "es6-es2015";
            }
            else if (__dirname.indexOf("/dist/es7-es2016") > 0) {
                distTarget = "es7-es2016";
            }
            else if (__dirname.indexOf("/dist/es8-es2017") > 0) {
                distTarget = "es8-es2017";
            }
            if (distTarget) {
                preloadPath = path.join(process.cwd(), "node_modules/r2-navigator-js/dist/" +
                    distTarget
                    + "/src/electron/renderer/webview/preload.js");
            }
            index_1.installNavigatorDOM(_publication, publicationJsonUrl, "publication_viewport", preloadPath, pubDocHrefToLoad, pubDocSelectorToGoto);
        }, 500);
    })();
}
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