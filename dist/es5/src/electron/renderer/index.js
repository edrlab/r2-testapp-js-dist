"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path = require("path");
var SystemFonts = require("system-font-families");
var debounce = require("debounce");
var publication_1 = require("r2-shared-js/dist/es5/src/models/publication");
var events_1 = require("r2-navigator-js/dist/es5/src/electron/common/events");
var querystring_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/common/querystring");
var index_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/index");
var init_globals_1 = require("r2-shared-js/dist/es5/src/init-globals");
var electron_1 = require("electron");
var ta_json_1 = require("ta-json");
var store_electron_1 = require("../common/store-electron");
var index_2 = require("./riots/linklist/index_");
var index_3 = require("./riots/linklistgroup/index_");
var index_4 = require("./riots/linktree/index_");
var index_5 = require("./riots/menuselect/index_");
var electronStore = new store_electron_1.StoreElectron("readium2-testapp", {
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
var electronStoreLCP = new store_electron_1.StoreElectron("readium2-testapp-lcp", {});
init_globals_1.initGlobals();
var computeReadiumCssJsonMessage = function () {
    var on = electronStore.get("styling.readiumcss");
    if (on) {
        var align = electronStore.get("styling.align");
        var colCount = electronStore.get("styling.colCount");
        var dark = electronStore.get("styling.dark");
        var font = electronStore.get("styling.font");
        var fontSize = electronStore.get("styling.fontSize");
        var lineHeight = electronStore.get("styling.lineHeight");
        var invert = electronStore.get("styling.invert");
        var night = electronStore.get("styling.night");
        var paged = electronStore.get("styling.paged");
        var sepia = electronStore.get("styling.sepia");
        var cssJson = {
            align: align,
            colCount: colCount,
            dark: dark,
            font: font,
            fontSize: fontSize,
            invert: invert,
            lineHeight: lineHeight,
            night: night,
            paged: paged,
            sepia: sepia,
        };
        var jsonMsg = { injectCSS: "yes", setCSS: cssJson };
        return JSON.stringify(jsonMsg, null, 0);
    }
    else {
        var jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
        return JSON.stringify(jsonMsg, null, 0);
    }
};
index_1.setReadiumCssJsonGetter(computeReadiumCssJsonMessage);
var saveReadingLocation = function (doc, loc) {
    var obj = electronStore.get("readingLocation");
    if (!obj) {
        obj = {};
    }
    obj[pathDecoded] = {
        doc: doc,
        loc: loc,
    };
    electronStore.set("readingLocation", obj);
};
index_1.setReadingLocationSaver(saveReadingLocation);
var queryParams = querystring_1.getURLQueryParams();
var publicationJsonUrl = queryParams["pub"];
var pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
var pathDecoded = window.atob(pathBase64);
var pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
var lcpHint = queryParams["lcpHint"];
electronStore.onChanged("styling.night", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.checked = newValue;
    if (newValue) {
        document.body.classList.add("mdc-theme--dark");
    }
    else {
        document.body.classList.remove("mdc-theme--dark");
    }
    readiumCssOnOff();
});
electronStore.onChanged("styling.align", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var nightSwitch = document.getElementById("justify_switch-input");
    nightSwitch.checked = (newValue === "justify");
    readiumCssOnOff();
});
electronStore.onChanged("styling.paged", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var paginateSwitch = document.getElementById("paginate_switch-input");
    paginateSwitch.checked = newValue;
    readiumCssOnOff();
});
var readiumCssOnOff = debounce(function () {
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
electronStore.onChanged("styling.readiumcss", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = newValue ? "block" : "none";
    if (newValue) {
        ensureSliderLayout();
    }
    var readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    readiumcssSwitch.checked = newValue;
    readiumCssOnOff();
    var justifySwitch = document.getElementById("justify_switch-input");
    justifySwitch.disabled = !newValue;
    var paginateSwitch = document.getElementById("paginate_switch-input");
    paginateSwitch.disabled = !newValue;
    var nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("styling.night", false);
    }
});
electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var basicSwitch = document.getElementById("nav_basic_switch-input");
    basicSwitch.checked = !newValue;
});
var snackBar;
var drawer;
window.onerror = function (err) {
    console.log("Error", err);
};
electron_1.ipcRenderer.on(events_1.R2_EVENT_TRY_LCP_PASS_RES, function (_event, okay, msg, passSha256Hex) {
    if (!okay) {
        setTimeout(function () {
            showLcpDialog(msg);
        }, 500);
        return;
    }
    var lcpStore = electronStoreLCP.get("lcp");
    if (!lcpStore) {
        var lcpObj = {};
        var pubLcpObj = lcpObj[pathDecoded] = {};
        pubLcpObj.sha = passSha256Hex;
        electronStoreLCP.set("lcp", lcpObj);
    }
    else {
        var pubLcpStore = lcpStore[pathDecoded];
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
var lcpDialog;
function showLcpDialog(message) {
    var lcpPassHint = document.getElementById("lcpPassHint");
    lcpPassHint.textContent = lcpHint;
    if (message) {
        var lcpPassMessage = document.getElementById("lcpPassMessage");
        lcpPassMessage.textContent = message;
    }
    lcpDialog.show();
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
    document.body.addEventListener("focusin", debounce(function (ev) {
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
    slider.disabled = !electronStore.get("styling.readiumcss");
    var val = electronStore.get("styling.lineHeight");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = 1.5 * 100;
    }
    electronStore.onChanged("styling.readiumcss", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("styling.lineHeight", "" + (event.detail.value / 100));
    });
    electronStore.onChanged("styling.lineHeight", function (newValue, oldValue) {
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
    slider.disabled = !electronStore.get("styling.readiumcss");
    var val = electronStore.get("styling.fontSize");
    if (val) {
        slider.value = parseInt(val.replace("%", ""), 10);
    }
    else {
        slider.value = 100;
    }
    electronStore.onChanged("styling.readiumcss", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("styling.fontSize", event.detail.value + "%");
    });
    electronStore.onChanged("styling.fontSize", function (newValue, oldValue) {
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
            id: ID_PREFIX + "MONO",
            label: "Monospace",
            style: "font-family: \"Andale Mono\", Consolas, monospace;",
        }];
    var selectedID = ID_PREFIX + electronStore.get("styling.font");
    var foundItem = options.find(function (item) {
        return item.id === selectedID;
    });
    if (!foundItem) {
        selectedID = options[0].id;
    }
    var opts = {
        disabled: !electronStore.get("styling.readiumcss"),
        label: "Font name",
        options: options,
        selected: selectedID,
    };
    var tag = index_5.riotMountMenuSelect("#fontSelect", opts)[0];
    tag.on("selectionChanged", function (val) {
        val = val.replace(ID_PREFIX, "");
        electronStore.set("styling.font", val);
    });
    electronStore.onChanged("styling.font", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(ID_PREFIX + newValue);
        readiumCssOnOff();
    });
    electronStore.onChanged("styling.readiumcss", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _sysFonts, systemFonts, err_1, arr_1, divider, newSelectedID_1, newFoundItem;
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
                        divider = {
                            id: ID_PREFIX + "_",
                            label: "_",
                        };
                        arr_1.push(divider);
                        _sysFonts.forEach(function (sysFont) {
                            var option = {
                                id: ID_PREFIX + sysFont,
                                label: sysFont,
                                style: "font-family: " + sysFont + ";",
                            };
                            arr_1.push(option);
                        });
                        newSelectedID_1 = ID_PREFIX + electronStore.get("styling.font");
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
    window.mdc.menu.MDCSimpleMenuFoundation.numbers.TRANSITION_DURATION_MS = 200;
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
    if (electronStore.get("styling.night")) {
        document.body.classList.add("mdc-theme--dark");
    }
    else {
        document.body.classList.remove("mdc-theme--dark");
    }
    var drawerElement = document.getElementById("drawer");
    drawer = new window.mdc.drawer.MDCTemporaryDrawer(drawerElement);
    drawerElement.mdcTemporaryDrawer = drawer;
    var drawerButton = document.getElementById("drawerButton");
    drawerButton.addEventListener("click", function () {
        drawer.open = true;
    });
    initFontSelector();
    initFontSizeSelector();
    initLineHeightSelector();
    var nightSwitch = document.getElementById("night_switch-input");
    nightSwitch.checked = electronStore.get("styling.night");
    nightSwitch.addEventListener("change", function (_event) {
        var checked = nightSwitch.checked;
        electronStore.set("styling.night", checked);
    });
    nightSwitch.disabled = !electronStore.get("styling.readiumcss");
    var justifySwitch = document.getElementById("justify_switch-input");
    justifySwitch.checked = electronStore.get("styling.align") === "justify";
    justifySwitch.addEventListener("change", function (_event) {
        var checked = justifySwitch.checked;
        electronStore.set("styling.align", checked ? "justify" : "initial");
    });
    justifySwitch.disabled = !electronStore.get("styling.readiumcss");
    var paginateSwitch = document.getElementById("paginate_switch-input");
    paginateSwitch.checked = electronStore.get("styling.paged");
    paginateSwitch.addEventListener("change", function (_event) {
        var checked = paginateSwitch.checked;
        electronStore.set("styling.paged", checked);
    });
    paginateSwitch.disabled = !electronStore.get("styling.readiumcss");
    var readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    readiumcssSwitch.checked = electronStore.get("styling.readiumcss");
    var stylingWrapper = document.getElementById("stylingWrapper");
    stylingWrapper.style.display = readiumcssSwitch.checked ? "block" : "none";
    if (readiumcssSwitch.checked) {
        ensureSliderLayout();
    }
    readiumcssSwitch.addEventListener("change", function (_event) {
        var checked = readiumcssSwitch.checked;
        electronStore.set("styling.readiumcss", checked);
    });
    var basicSwitch = document.getElementById("nav_basic_switch-input");
    basicSwitch.checked = !electronStore.get("basicLinkTitles");
    basicSwitch.addEventListener("change", function (_event) {
        var checked = basicSwitch.checked;
        electronStore.set("basicLinkTitles", !checked);
    });
    var snackBarElem = document.getElementById("snackbar");
    snackBar = new window.mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBarElem.mdcSnackbar = snackBar;
    snackBar.dismissesOnAction = true;
    var menuFactory = function (menuEl) {
        var menu = new window.mdc.menu.MDCSimpleMenu(menuEl);
        menuEl.mdcSimpleMenu = menu;
        return menu;
    };
    var selectElement = document.getElementById("nav-select");
    var navSelector = new window.mdc.select.MDCSelect(selectElement, undefined, menuFactory);
    selectElement.mdcSelect = navSelector;
    navSelector.listen("MDCSelect:change", function (ev) {
        var activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        var newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.selectedIndex + 1) + ")");
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
    lcpDialog.listen("MDCDialog:accept", function () {
        var lcpPass = lcpPassInput.value;
        electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass, false);
    });
    lcpDialog.listen("MDCDialog:cancel", function () {
        setTimeout(function () {
            showLcpDialog();
        }, 10);
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
            electron_1.ipcRenderer.send(events_1.R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPassSha256Hex, true);
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
        electronStore.set("styling", electronStore.getDefaults().styling);
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
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, pathDecoded, "");
    });
    var buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", function () {
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, pathDecoded);
    });
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RENEW_RES, function (_event, okay, msg) {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(okay);
    console.log(msg);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RETURN_RES, function (_event, okay, msg) {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(okay);
    console.log(msg);
});
function startNavigatorExperiment() {
    var _this = this;
    var drawerButton = document.getElementById("drawerButton");
    drawerButton.focus();
    (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var response, e_1, _publicationJSON, e_2, _publication, title, keys, h1, buttonNavLeft, buttonNavRight, opts, opts, tag_1, opts, tag_2, landmarksData, opts, tag_3, readStore, pubDocHrefToLoad, pubDocSelectorToGoto, obj;
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
                    _publication = ta_json_1.JSON.deserialize(_publicationJSON, publication_1.Publication);
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
                            links: _publicationJSON.spine,
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
                            pubDocHrefToLoad = obj.doc;
                            if (obj.loc) {
                                pubDocSelectorToGoto = obj.loc;
                            }
                        }
                    }
                    drawer.open = true;
                    setTimeout(function () {
                        drawer.open = false;
                        var preloadPath = "./preload.js";
                        var distTarget;
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
                    return [2];
            }
        });
    }); })();
}
function handleLink_(href) {
    if (drawer.open) {
        drawer.open = false;
        setTimeout(function () {
            index_1.handleLink(href, undefined, false);
        }, 200);
    }
    else {
        index_1.handleLink(href, undefined, false);
    }
}
//# sourceMappingURL=index.js.map