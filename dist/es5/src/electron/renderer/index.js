"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path = require("path");
var readium_css_settings_1 = require("r2-navigator-js/dist/es5/src/electron/common/readium-css-settings");
var sessions_1 = require("r2-navigator-js/dist/es5/src/electron/common/sessions");
var querystring_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/common/querystring");
var console_redirect_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/console-redirect");
var index_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/index");
var init_globals_1 = require("r2-opds-js/dist/es5/src/opds/init-globals");
var init_globals_2 = require("r2-shared-js/dist/es5/src/init-globals");
var publication_1 = require("r2-shared-js/dist/es5/src/models/publication");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var ta_json_x_1 = require("ta-json-x");
var events_1 = require("../common/events");
var store_electron_1 = require("../common/store-electron");
var index_2 = require("./riots/linklist/index_");
var index_3 = require("./riots/linklistgroup/index_");
var index_4 = require("./riots/linktree/index_");
var index_5 = require("./riots/menuselect/index_");
var SystemFonts = require("system-font-families");
console_redirect_1.consoleRedirect("r2:testapp#electron/renderer/index", process.stdout, process.stderr, true);
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var queryParams = querystring_1.getURLQueryParams();
electron_1.webFrame.registerURLSchemeAsSecure(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL);
electron_1.webFrame.registerURLSchemeAsPrivileged(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, {
    allowServiceWorkers: false,
    bypassCSP: false,
    corsEnabled: false,
    secure: true,
    supportFetchAPI: true,
});
var readiumCssDefaultsJson = readium_css_settings_1.readiumCSSDefaults;
var readiumCssKeys = Object.keys(readium_css_settings_1.readiumCSSDefaults);
readiumCssKeys.forEach(function (key) {
    var value = readium_css_settings_1.readiumCSSDefaults[key];
    if (typeof value === "undefined") {
        readiumCssDefaultsJson[key] = null;
    }
    else {
        readiumCssDefaultsJson[key] = value;
    }
});
var electronStore = new store_electron_1.StoreElectron("readium2-testapp", {
    basicLinkTitles: true,
    readiumCSS: readiumCssDefaultsJson,
    readiumCSSEnable: false,
});
var electronStoreLCP = new store_electron_1.StoreElectron("readium2-testapp-lcp", {});
init_globals_1.initGlobalConverters_OPDS();
init_globals_2.initGlobalConverters_SHARED();
init_globals_2.initGlobalConverters_GENERIC();
var pubServerRoot = queryParams["pubServerRoot"];
console.log(pubServerRoot);
var computeReadiumCssJsonMessage = function () {
    var on = electronStore.get("readiumCSSEnable");
    if (on) {
        var cssJson = electronStore.get("readiumCSS");
        console.log("---- readiumCSS -----");
        console.log(cssJson);
        console.log("-----");
        if (!cssJson) {
            cssJson = readium_css_settings_1.readiumCSSDefaults;
        }
        var jsonMsg = {
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
var getEpubReadingSystem = function () {
    return { name: "Readium2 test app", version: "0.0.1-alpha.1" };
};
index_1.setEpubReadingSystemJsonGetter(getEpubReadingSystem);
var saveReadingLocation = function (location) {
    var obj = electronStore.get("readingLocation");
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
var publicationJsonUrl = queryParams["pub"];
console.log(publicationJsonUrl);
var publicationJsonUrl_ = publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    sessions_1.convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;
console.log(publicationJsonUrl_);
var pathBase64 = publicationJsonUrl_.
    replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
console.log(pathBase64);
var pathDecoded = window.atob(pathBase64);
console.log(pathDecoded);
var pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
console.log(pathFileName);
var lcpHint = queryParams["lcpHint"];
electronStore.onChanged("readiumCSS.colCount", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    console.log("readiumCSS.colCount: ", oldValue, " => ", newValue);
    readiumCssOnOff();
});
electronStore.onChanged("readiumCSS.night", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var nightSwitchEl = document.getElementById("night_switch");
    var nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.checked = newValue;
    readiumCssOnOff();
});
electronStore.onChanged("readiumCSS.textAlign", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var justifySwitchEl = document.getElementById("justify_switch");
    var justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.checked = (newValue === "justify");
    readiumCssOnOff();
});
electronStore.onChanged("readiumCSS.paged", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var paginateSwitchEl = document.getElementById("paginate_switch");
    var paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.checked = newValue;
    readiumCssOnOff();
});
var readiumCssOnOff = debounce_1.debounce(function () {
    index_1.readiumCssOnOff();
}, 500);
function ensureSliderLayout() {
    setTimeout(function () {
        var fontSizeSelector = document.getElementById("fontSizeSelector");
        fontSizeSelector.mdcSlider.layout();
        var lineHeightSelector = document.getElementById("lineHeightSelector");
        lineHeightSelector.mdcSlider.layout();
    }, 100);
}
electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = newValue ? "block" : "none";
    if (newValue) {
        ensureSliderLayout();
    }
    var readiumcssSwitchEl = document.getElementById("readiumcss_switch");
    var readiumcssSwitch = readiumcssSwitchEl.mdcSwitch;
    readiumcssSwitch.checked = newValue;
    readiumCssOnOff();
    var justifySwitchEl = document.getElementById("justify_switch");
    var justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.disabled = !newValue;
    var paginateSwitchEl = document.getElementById("paginate_switch");
    var paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.disabled = !newValue;
    var nightSwitchEl = document.getElementById("night_switch");
    var nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("readiumCSS.night", false);
    }
});
electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var basicSwitchEl = document.getElementById("nav_basic_switch");
    var basicSwitch = basicSwitchEl.mdcSwitch;
    basicSwitch.checked = !newValue;
});
var snackBar;
var drawer;
window.onerror = function (err) {
    console.log("window.onerror:");
    console.log(err);
};
electron_1.ipcRenderer.on(events_1.R2_EVENT_TRY_LCP_PASS_RES, function (_event, payload) {
    if (!payload.okay && payload.error) {
        var message_1;
        if (typeof payload.error === "string") {
            message_1 = payload.error;
        }
        else {
            switch (payload.error) {
                case 0: {
                    message_1 = "NONE: " + payload.error;
                    break;
                }
                case 1: {
                    message_1 = "INCORRECT PASSPHRASE: " + payload.error;
                    break;
                }
                case 11: {
                    message_1 = "LICENSE_OUT_OF_DATE: " + payload.error;
                    break;
                }
                case 101: {
                    message_1 = "CERTIFICATE_REVOKED: " + payload.error;
                    break;
                }
                case 102: {
                    message_1 = "CERTIFICATE_SIGNATURE_INVALID: " + payload.error;
                    break;
                }
                case 111: {
                    message_1 = "LICENSE_SIGNATURE_DATE_INVALID: " + payload.error;
                    break;
                }
                case 112: {
                    message_1 = "LICENSE_SIGNATURE_INVALID: " + payload.error;
                    break;
                }
                case 121: {
                    message_1 = "CONTEXT_INVALID: " + payload.error;
                    break;
                }
                case 131: {
                    message_1 = "CONTENT_KEY_DECRYPT_ERROR: " + payload.error;
                    break;
                }
                case 141: {
                    message_1 = "USER_KEY_CHECK_INVALID: " + payload.error;
                    break;
                }
                case 151: {
                    message_1 = "CONTENT_DECRYPT_ERROR: " + payload.error;
                    break;
                }
                default: {
                    message_1 = "Unknown error?! " + payload.error;
                }
            }
        }
        setTimeout(function () {
            showLcpDialog(message_1);
        }, 500);
        return;
    }
    if (payload.passSha256Hex) {
        var lcpStore = electronStoreLCP.get("lcp");
        if (!lcpStore) {
            var lcpObj = {};
            var pubLcpObj = lcpObj[pathDecoded] = {};
            pubLcpObj.sha = payload.passSha256Hex;
            electronStoreLCP.set("lcp", lcpObj);
        }
        else {
            var pubLcpStore = lcpStore[pathDecoded];
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
var lcpDialog;
function showLcpDialog(message) {
    var lcpPassHint = document.getElementById("lcpPassHint");
    lcpPassHint.textContent = lcpHint;
    if (message) {
        var lcpPassMessage = document.getElementById("lcpPassMessage");
        lcpPassMessage.textContent = message;
    }
    lcpDialog.open();
    setTimeout(function () {
        var lcpPassInput = document.getElementById("lcpPassInput");
        lcpPassInput.focus();
        setTimeout(function () {
            lcpPassInput.classList.add("no-focus-outline");
        }, 500);
    }, 800);
}
function installKeyboardMouseFocusHandler() {
    var dateLastKeyboardEvent = new Date();
    var dateLastMouseEvent = new Date();
    document.body.addEventListener("focusin", debounce_1.debounce(function (ev) {
        var focusWasTriggeredByMouse = dateLastMouseEvent > dateLastKeyboardEvent;
        if (focusWasTriggeredByMouse) {
            if (ev.target && ev.target.classList) {
                ev.target.classList.add("no-focus-outline");
            }
        }
    }, 500));
    document.body.addEventListener("focusout", function (ev) {
        if (ev.target && ev.target.classList) {
            ev.target.classList.remove("no-focus-outline");
        }
    });
    document.body.addEventListener("mousedown", function () {
        dateLastMouseEvent = new Date();
    });
    document.body.addEventListener("keydown", function () {
        dateLastKeyboardEvent = new Date();
    });
}
var initLineHeightSelector = function () {
    var lineHeightSelector = document.getElementById("lineHeightSelector");
    var slider = new window.mdc.slider.MDCSlider(lineHeightSelector);
    lineHeightSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.lineHeight");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = 1.5 * 100;
    }
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.lineHeight", "" + (event.detail.value / 100));
    });
    electronStore.onChanged("readiumCSS.lineHeight", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = parseFloat(newValue) * 100;
        readiumCssOnOff();
    });
};
var initFontSizeSelector = function () {
    var fontSizeSelector = document.getElementById("fontSizeSelector");
    var slider = new window.mdc.slider.MDCSlider(fontSizeSelector);
    fontSizeSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.fontSize");
    if (val) {
        slider.value = parseInt(val.replace("%", ""), 10);
    }
    else {
        slider.value = 100;
    }
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.fontSize", event.detail.value + "%");
    });
    electronStore.onChanged("readiumCSS.fontSize", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = parseInt(newValue.replace("%", ""), 10);
        readiumCssOnOff();
    });
};
var initFontSelector = function () {
    var ID_PREFIX = "fontselect_";
    var options = [{
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
    var selectedID = ID_PREFIX + electronStore.get("readiumCSS.font");
    var foundItem = options.find(function (item) {
        return item.id === selectedID;
    });
    if (!foundItem) {
        selectedID = options[0].id;
    }
    var opts = {
        disabled: !electronStore.get("readiumCSSEnable"),
        label: "Font name",
        options: options,
        selected: selectedID,
    };
    var tag = index_5.riotMountMenuSelect("#fontSelect", opts)[0];
    tag.on("selectionChanged", function (index) {
        console.log("selectionChanged");
        console.log(index);
        var id = tag.getIdForIndex(index);
        console.log(id);
        if (!id) {
            return;
        }
        id = id.replace(ID_PREFIX, "");
        electronStore.set("readiumCSS.font", id);
    });
    electronStore.onChanged("readiumCSS.font", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(ID_PREFIX + newValue);
        readiumCssOnOff();
    });
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _sysFonts, systemFonts, err_1, arr_1, newSelectedID_1, newFoundItem;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _sysFonts = [];
                    systemFonts = new SystemFonts.default();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, systemFonts.getFonts()];
                case 2:
                    _sysFonts = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    console.log(err_1);
                    return [3, 4];
                case 4:
                    if (_sysFonts && _sysFonts.length) {
                        arr_1 = tag.opts.options;
                        _sysFonts.forEach(function (sysFont) {
                            var option = {
                                id: ID_PREFIX + sysFont,
                                label: sysFont,
                                style: "font-family: " + sysFont + ";",
                            };
                            arr_1.push(option);
                        });
                        newSelectedID_1 = ID_PREFIX + electronStore.get("readiumCSS.font");
                        newFoundItem = options.find(function (item) {
                            return item.id === newSelectedID_1;
                        });
                        if (!newFoundItem) {
                            newSelectedID_1 = arr_1[0].id;
                        }
                        tag.opts.selected = newSelectedID_1;
                        tag.update();
                    }
                    return [2];
            }
        });
    }); }, 100);
};
window.addEventListener("DOMContentLoaded", function () {
    window.mdc.menu.MDCMenuFoundation.numbers.TRANSITION_DURATION_MS = 200;
    window.document.addEventListener("keydown", function (ev) {
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
    setTimeout(function () {
        window.mdc.autoInit();
    }, 500);
    window.document.title = "Readium2 [ " + pathFileName + "]";
    var h1 = document.getElementById("pubTitle");
    h1.textContent = pathFileName;
    installKeyboardMouseFocusHandler();
    var drawerElement = document.getElementById("drawer");
    drawer = new window.mdc.drawer.MDCDrawer(drawerElement);
    drawerElement.mdcTemporaryDrawer = drawer;
    var drawerButton = document.getElementById("drawerButton");
    drawerButton.addEventListener("click", function () {
        drawer.open = true;
    });
    initFontSelector();
    initFontSizeSelector();
    initLineHeightSelector();
    var nightSwitchEl = document.getElementById("night_switch");
    var nightSwitch = new window.mdc.switchControl.MDCSwitch(nightSwitchEl);
    nightSwitchEl.mdcSwitch = nightSwitch;
    nightSwitch.checked = electronStore.get("readiumCSS.night");
    nightSwitchEl.addEventListener("change", function (_event) {
        var checked = nightSwitch.checked;
        electronStore.set("readiumCSS.night", checked);
    });
    nightSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var justifySwitchEl = document.getElementById("justify_switch");
    var justifySwitch = new window.mdc.switchControl.MDCSwitch(justifySwitchEl);
    justifySwitchEl.mdcSwitch = justifySwitch;
    justifySwitch.checked = electronStore.get("readiumCSS.textAlign") === "justify";
    justifySwitchEl.addEventListener("change", function (_event) {
        var checked = justifySwitch.checked;
        electronStore.set("readiumCSS.textAlign", checked ? "justify" : "initial");
    });
    justifySwitch.disabled = !electronStore.get("readiumCSSEnable");
    var paginateSwitchEl = document.getElementById("paginate_switch");
    var paginateSwitch = new window.mdc.switchControl.MDCSwitch(paginateSwitchEl);
    paginateSwitchEl.mdcSwitch = paginateSwitch;
    paginateSwitch.checked = electronStore.get("readiumCSS.paged");
    paginateSwitchEl.addEventListener("change", function (_event) {
        var checked = paginateSwitch.checked;
        electronStore.set("readiumCSS.paged", checked);
    });
    paginateSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var readiumcssSwitchEl = document.getElementById("readiumcss_switch");
    var readiumcssSwitch = new window.mdc.switchControl.MDCSwitch(readiumcssSwitchEl);
    readiumcssSwitchEl.mdcSwitch = readiumcssSwitch;
    readiumcssSwitch.checked = electronStore.get("readiumCSSEnable");
    var stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = readiumcssSwitch.checked ? "block" : "none";
    if (readiumcssSwitch.checked) {
        ensureSliderLayout();
    }
    readiumcssSwitchEl.addEventListener("change", function (_event) {
        var checked = readiumcssSwitch.checked;
        electronStore.set("readiumCSSEnable", checked);
    });
    var basicSwitchEl = document.getElementById("nav_basic_switch");
    var basicSwitch = new window.mdc.switchControl.MDCSwitch(basicSwitchEl);
    basicSwitchEl.mdcSwitch = basicSwitch;
    basicSwitch.checked = !electronStore.get("basicLinkTitles");
    basicSwitchEl.addEventListener("change", function (_event) {
        var checked = basicSwitch.checked;
        electronStore.set("basicLinkTitles", !checked);
    });
    var snackBarElem = document.getElementById("snackbar");
    snackBar = new window.mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBarElem.mdcSnackbar = snackBar;
    snackBar.dismissesOnAction = true;
    var selectElement = document.getElementById("nav-select");
    var navSelector = new window.mdc.select.MDCSelect(selectElement);
    selectElement.mdcSelect = navSelector;
    navSelector.listen("change", function (ev) {
        var activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        var newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.target.selectedIndex + 1) + ")");
        if (newActivePanel) {
            newActivePanel.classList.add("active");
            var div = document.getElementById("reader_controls_STYLES");
            if (newActivePanel === div) {
                ensureSliderLayout();
            }
        }
    });
    var diagElem = document.querySelector("#lcpDialog");
    var lcpPassInput = document.getElementById("lcpPassInput");
    lcpDialog = new window.mdc.dialog.MDCDialog(diagElem);
    diagElem.mdcDialog = lcpDialog;
    lcpDialog.listen("MDCDialog:opened", function () {
        console.log("MDCDialog:opened");
    });
    lcpDialog.listen("MDCDialog:closed", function (event) {
        console.log("MDCDialog:closed");
        if (event.detail.action === "close") {
            console.log("MDCDialog:ACTION:close");
            setTimeout(function () {
                showLcpDialog();
            }, 10);
        }
        else if (event.detail.action === "accept") {
            console.log("MDCDialog:ACTION:accept");
            var lcpPass = lcpPassInput.value;
            var payload = {
                isSha256Hex: false,
                lcpPass: lcpPass,
                publicationFilePath: pathDecoded,
            };
            electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, payload);
        }
        else {
            console.log("!! MDCDialog:ACTION:" + event.detail.action);
            setTimeout(function () {
                showLcpDialog();
            }, 10);
        }
    });
    if (lcpPassInput) {
        lcpPassInput.addEventListener("keyup", function (ev) {
            if (ev.keyCode === 13) {
                ev.preventDefault();
                var lcpDialogAcceptButton = document.getElementById("lcpDialogAcceptButton");
                lcpDialogAcceptButton.click();
            }
        });
    }
    if (lcpHint) {
        var lcpPassSha256Hex = void 0;
        var lcpStore = electronStoreLCP.get("lcp");
        if (lcpStore) {
            var pubLcpStore = lcpStore[pathDecoded];
            if (pubLcpStore && pubLcpStore.sha) {
                lcpPassSha256Hex = pubLcpStore.sha;
            }
        }
        if (lcpPassSha256Hex) {
            var payload = {
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
    var buttonClearReadingLocations = document.getElementById("buttonClearReadingLocations");
    buttonClearReadingLocations.addEventListener("click", function () {
        electronStore.set("readingLocation", {});
        drawer.open = false;
        setTimeout(function () {
            var message = "Reading locations reset.";
            var data = {
                actionHandler: function () {
                },
                actionOnBottom: false,
                actionText: "OK",
                message: message,
                multiline: false,
                timeout: 2000,
            };
            snackBar.show(data);
        }, 500);
    });
    var buttonClearSettings = document.getElementById("buttonClearSettings");
    buttonClearSettings.addEventListener("click", function () {
        electronStore.set(undefined, electronStore.getDefaults());
        drawer.open = false;
        setTimeout(function () {
            var message = "Settings reset.";
            var data = {
                actionHandler: function () {
                },
                actionOnBottom: false,
                actionText: "OK",
                message: message,
                multiline: false,
                timeout: 2000,
            };
            snackBar.show(data);
        }, 500);
    });
    var buttonClearSettingsStyle = document.getElementById("buttonClearSettingsStyle");
    buttonClearSettingsStyle.addEventListener("click", function () {
        electronStore.set("readiumCSS", electronStore.getDefaults().readiumCSS);
        drawer.open = false;
        setTimeout(function () {
            var message = "Default styles.";
            var data = {
                actionHandler: function () {
                },
                actionOnBottom: false,
                actionText: "OK",
                message: message,
                multiline: false,
                timeout: 2000,
            };
            snackBar.show(data);
        }, 500);
    });
    var buttonOpenSettings = document.getElementById("buttonOpenSettings");
    buttonOpenSettings.addEventListener("click", function () {
        if (electronStore.reveal) {
            electronStore.reveal();
        }
        if (electronStoreLCP.reveal) {
            electronStoreLCP.reveal();
        }
    });
    var buttonLSDRenew = document.getElementById("buttonLSDRenew");
    buttonLSDRenew.addEventListener("click", function () {
        var payload = {
            endDateStr: undefined,
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, payload);
    });
    var buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", function () {
        var payload = {
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, payload);
    });
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RENEW_RES, function (_event, payload) {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(payload.okay);
    console.log(payload.error);
    console.log(payload.lsdJson);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RETURN_RES, function (_event, payload) {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(payload.okay);
    console.log(payload.error);
    console.log(payload.lsdJson);
});
function startNavigatorExperiment() {
    var _this = this;
    var drawerButton = document.getElementById("drawerButton");
    drawerButton.focus();
    (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var response, e_1, _publicationJSON, e_2, _publication, title, keys, h1, buttonNavLeft, buttonNavRight, opts, opts, tag_1, opts, tag_2, landmarksData, opts, tag_3, readStore, location, obj;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, fetch(publicationJsonUrl)];
                case 1:
                    response = _a.sent();
                    return [3, 3];
                case 2:
                    e_1 = _a.sent();
                    console.log(e_1);
                    return [2];
                case 3:
                    if (!response.ok) {
                        console.log("BAD RESPONSE?!");
                    }
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4, response.json()];
                case 5:
                    _publicationJSON = _a.sent();
                    return [3, 7];
                case 6:
                    e_2 = _a.sent();
                    console.log(e_2);
                    return [3, 7];
                case 7:
                    if (!_publicationJSON) {
                        return [2];
                    }
                    _publication = ta_json_x_1.JSON.deserialize(_publicationJSON, publication_1.Publication);
                    if (_publication.Metadata && _publication.Metadata.Title) {
                        title = void 0;
                        if (typeof _publication.Metadata.Title === "string") {
                            title = _publication.Metadata.Title;
                        }
                        else {
                            keys = Object.keys(_publication.Metadata.Title);
                            if (keys && keys.length) {
                                title = _publication.Metadata.Title[keys[0]];
                            }
                        }
                        if (title) {
                            h1 = document.getElementById("pubTitle");
                            h1.textContent = title;
                        }
                    }
                    buttonNavLeft = document.getElementById("buttonNavLeft");
                    buttonNavLeft.addEventListener("click", function (_event) {
                        index_1.navLeftOrRight(true);
                    });
                    buttonNavRight = document.getElementById("buttonNavRight");
                    buttonNavRight.addEventListener("click", function (_event) {
                        index_1.navLeftOrRight(false);
                    });
                    if (_publication.Spine && _publication.Spine.length) {
                        opts = {
                            basic: true,
                            fixBasic: true,
                            handleLink: handleLink_,
                            links: (_publicationJSON.spine || _publicationJSON.readingOrder),
                            url: publicationJsonUrl,
                        };
                        index_2.riotMountLinkList("#reader_controls_SPINE", opts);
                    }
                    if (_publication.TOC && _publication.TOC.length) {
                        opts = {
                            basic: electronStore.get("basicLinkTitles"),
                            handleLink: handleLink_,
                            links: _publicationJSON.toc,
                            url: publicationJsonUrl,
                        };
                        tag_1 = index_4.riotMountLinkTree("#reader_controls_TOC", opts)[0];
                        electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
                            if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                                return;
                            }
                            tag_1.setBasic(newValue);
                        });
                    }
                    if (_publication.PageList && _publication.PageList.length) {
                        opts = {
                            basic: electronStore.get("basicLinkTitles"),
                            handleLink: handleLink_,
                            links: _publicationJSON["page-list"],
                            url: publicationJsonUrl,
                        };
                        tag_2 = index_2.riotMountLinkList("#reader_controls_PAGELIST", opts)[0];
                        electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
                            if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                                return;
                            }
                            tag_2.setBasic(newValue);
                        });
                    }
                    landmarksData = [];
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
                        opts = {
                            basic: electronStore.get("basicLinkTitles"),
                            handleLink: handleLink_,
                            linksgroup: landmarksData,
                            url: publicationJsonUrl,
                        };
                        tag_3 = index_3.riotMountLinkListGroup("#reader_controls_LANDMARKS", opts)[0];
                        electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
                            if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                                return;
                            }
                            tag_3.setBasic(newValue);
                        });
                    }
                    readStore = electronStore.get("readingLocation");
                    if (readStore) {
                        obj = readStore[pathDecoded];
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
                    setTimeout(function () {
                        drawer.open = false;
                        var preloadPath = "./preload.js";
                        var distTarget;
                        var dirnameSlashed = __dirname.replace(/\\/g, "/");
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
                        preloadPath = IS_DEV ? preloadPath : dirnameSlashed + "/preload.js";
                        preloadPath = preloadPath.replace(/\\/g, "/");
                        console.log(preloadPath);
                        var rootHtmlElementID = "publication_viewport";
                        var rootHtmlElement = document.getElementById(rootHtmlElementID);
                        if (!rootHtmlElement) {
                            console.log("!rootHtmlElement ???");
                            return;
                        }
                        rootHtmlElement.addEventListener(index_1.DOM_EVENT_HIDE_VIEWPORT, function () {
                            hideWebView();
                        });
                        rootHtmlElement.addEventListener(index_1.DOM_EVENT_SHOW_VIEWPORT, function () {
                            unhideWebView();
                        });
                        index_1.installNavigatorDOM(_publication, publicationJsonUrl, rootHtmlElementID, preloadPath, location);
                    }, 500);
                    return [2];
            }
        });
    }); })();
}
var ELEMENT_ID_HIDE_PANEL = "r2_navigator_reader_chrome_HIDE";
var _viewHideInterval;
var unhideWebView = function () {
    if (window) {
        return;
    }
    if (_viewHideInterval) {
        clearInterval(_viewHideInterval);
        _viewHideInterval = undefined;
    }
    var hidePanel = document.getElementById(ELEMENT_ID_HIDE_PANEL);
    if (!hidePanel || hidePanel.style.display === "none") {
        return;
    }
    if (hidePanel) {
        hidePanel.style.display = "none";
    }
};
var hideWebView = function () {
    if (window) {
        return;
    }
    var hidePanel = document.getElementById(ELEMENT_ID_HIDE_PANEL);
    if (hidePanel && hidePanel.style.display !== "block") {
        hidePanel.style.display = "block";
        _viewHideInterval = setInterval(function () {
            console.log("unhideWebView FORCED");
            unhideWebView();
        }, 5000);
    }
};
function handleLink_(href) {
    if (drawer.open) {
        drawer.open = false;
        setTimeout(function () {
            index_1.handleLinkUrl(href);
        }, 200);
    }
    else {
        index_1.handleLinkUrl(href);
    }
}
//# sourceMappingURL=index.js.map