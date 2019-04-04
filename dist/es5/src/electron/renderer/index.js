"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path = require("path");
var readium_css_settings_1 = require("r2-navigator-js/dist/es5/src/electron/common/readium-css-settings");
var sessions_1 = require("r2-navigator-js/dist/es5/src/electron/common/sessions");
var querystring_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/common/querystring");
var index_1 = require("r2-navigator-js/dist/es5/src/electron/renderer/index");
var init_globals_1 = require("r2-opds-js/dist/es5/src/opds/init-globals");
var init_globals_2 = require("r2-shared-js/dist/es5/src/init-globals");
var publication_1 = require("r2-shared-js/dist/es5/src/models/publication");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var ta_json_x_1 = require("ta-json-x");
var throttle = require("throttleit");
var events_1 = require("../common/events");
var store_electron_1 = require("../common/store-electron");
var colours_1 = require("./colours");
var drag_drop_1 = require("./drag-drop");
var index_2 = require("./riots/linklist/index_");
var index_3 = require("./riots/linklistgroup/index_");
var index_4 = require("./riots/linktree/index_");
var index_5 = require("./riots/menuselect/index_");
var SystemFonts = require("system-font-families");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var queryParams = querystring_1.getURLQueryParams();
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
var _publication;
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
index_1.setEpubReadingSystemInfo({ name: "Readium2 test app", version: "0.0.1-alpha.1" });
function isFixedLayout(publication, link) {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}
function sanitizeText(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
}
function onChangeReadingProgressionSlider() {
    var positionSelector = document.getElementById("positionSelector");
    var mdcSlider = positionSelector.mdcSlider;
    if (typeof mdcSlider.functionMode === "undefined") {
        return;
    }
    if (mdcSlider.functionMode === "fixed-layout" ||
        mdcSlider.functionMode === "reflow-scrolled") {
        if (_publication && _publication.Spine) {
            var zeroBasedIndex_1 = mdcSlider.value - 1;
            var foundLink = _publication.Spine.find(function (_link, i) {
                return zeroBasedIndex_1 === i;
            });
            if (foundLink) {
                var locator = {
                    href: foundLink.Href,
                    locations: {
                        cfi: undefined,
                        cssSelector: undefined,
                        position: undefined,
                        progression: undefined,
                    },
                };
                index_1.handleLinkLocator(locator);
            }
        }
        return;
    }
    if (mdcSlider.functionMode === "reflow-paginated") {
        var currentPos = index_1.getCurrentReadingLocation();
        if (!currentPos) {
            return;
        }
        var locator = {
            href: currentPos.locator.href,
            locations: {
                cfi: undefined,
                cssSelector: undefined,
                position: undefined,
                progression: (mdcSlider.value - 1) / mdcSlider.max,
            },
        };
        index_1.handleLinkLocator(locator);
    }
}
function updateReadingProgressionSlider(locatorExtended) {
    var locator = locatorExtended ? locatorExtended.locator : undefined;
    var positionSelector = document.getElementById("positionSelector");
    positionSelector.style.visibility = "visible";
    var positionSelectorValue = document.getElementById("positionSelectorValue");
    var mdcSlider = positionSelector.mdcSlider;
    var foundLink;
    var spineIndex = -1;
    if (_publication && locator) {
        if (_publication.Spine) {
            foundLink = _publication.Spine.find(function (link, i) {
                var ok = link.Href === locator.href;
                if (ok) {
                    spineIndex = i;
                }
                return ok;
            });
        }
        if (!foundLink && _publication.Resources) {
            foundLink = _publication.Resources.find(function (link) {
                return link.Href === locator.href;
            });
        }
    }
    var fixedLayout = (locatorExtended && locatorExtended.docInfo) ?
        locatorExtended.docInfo.isFixedLayout :
        (_publication ? isFixedLayout(_publication, foundLink) : false);
    var label = (foundLink && foundLink.Title) ? sanitizeText(foundLink.Title) : undefined;
    if (!label || !label.length) {
        label = (locator && locator.title) ? sanitizeText(locator.title) : undefined;
    }
    if (!label || !label.length) {
        label = foundLink ? foundLink.Href : undefined;
    }
    if (fixedLayout) {
        if (spineIndex >= 0 && _publication && _publication.Spine) {
            mdcSlider.functionMode = "fixed-layout";
            if (_publication.Spine.length === 1) {
                positionSelector.style.visibility = "hidden";
            }
            if (mdcSlider.min !== 1) {
                mdcSlider.min = 1;
            }
            if (mdcSlider.max !== _publication.Spine.length) {
                mdcSlider.max = _publication.Spine.length;
            }
            if (mdcSlider.step !== 1) {
                mdcSlider.step = 1;
            }
            mdcSlider.value = spineIndex + 1;
            var pagePosStr = "Page " + (spineIndex + 1) + " / " + _publication.Spine.length;
            positionSelectorValue.textContent = pagePosStr;
            return;
        }
    }
    else {
        var current = index_1.getCurrentReadingLocation();
        if (!current || !current.paginationInfo ||
            (typeof current.paginationInfo.isTwoPageSpread === "undefined") ||
            (typeof current.paginationInfo.spreadIndex === "undefined") ||
            (typeof current.paginationInfo.currentColumn === "undefined") ||
            (typeof current.paginationInfo.totalColumns === "undefined")) {
            if (spineIndex >= 0 && _publication && _publication.Spine) {
                mdcSlider.functionMode = "reflow-scrolled";
                if (_publication.Spine.length === 1) {
                    positionSelector.style.visibility = "hidden";
                }
                if (mdcSlider.min !== 1) {
                    mdcSlider.min = 1;
                }
                if (mdcSlider.max !== _publication.Spine.length) {
                    mdcSlider.max = _publication.Spine.length;
                }
                if (mdcSlider.step !== 1) {
                    mdcSlider.step = 1;
                }
                mdcSlider.value = spineIndex + 1;
                var pagePosStr = "Chapter " + (spineIndex + 1) + " / " + _publication.Spine.length;
                if (label) {
                    positionSelectorValue.innerHTML = "[<strong>" + label + "</strong>] " + pagePosStr;
                }
                else {
                    positionSelectorValue.textContent = pagePosStr;
                }
                return;
            }
        }
        else {
            mdcSlider.functionMode = "reflow-paginated";
            var totalColumns = current.paginationInfo.totalColumns;
            var totalSpreads = Math.ceil(totalColumns / 2);
            var totalSpreadsOrColumns = current.paginationInfo.isTwoPageSpread ? totalSpreads : totalColumns;
            var nColumn = current.paginationInfo.currentColumn + 1;
            var nSpread = current.paginationInfo.spreadIndex + 1;
            var nSpreadOrColumn = current.paginationInfo.isTwoPageSpread ? nSpread : nColumn;
            if (totalSpreadsOrColumns === 1) {
                positionSelector.style.visibility = "hidden";
            }
            if (mdcSlider.min !== 1) {
                mdcSlider.min = 1;
            }
            if (mdcSlider.max !== totalSpreadsOrColumns) {
                mdcSlider.max = totalSpreadsOrColumns;
            }
            if (mdcSlider.step !== 1) {
                mdcSlider.step = 1;
            }
            mdcSlider.value = nSpreadOrColumn;
            var nSpreadColumn = (current.paginationInfo.spreadIndex * 2) + 1;
            var pageStr = current.paginationInfo.isTwoPageSpread ?
                ((nSpreadColumn + 1) <= totalColumns ? "Pages " + nSpreadColumn + "-" + (nSpreadColumn + 1) + " / " + totalColumns :
                    "Page " + nSpreadColumn + " / " + totalColumns) : "Page " + nColumn + " / " + totalColumns;
            if (label) {
                positionSelectorValue.innerHTML = "[<strong>" + label + "</strong>] " + pageStr;
            }
            else {
                positionSelectorValue.textContent = pageStr;
            }
            return;
        }
    }
    mdcSlider.functionMode = undefined;
    positionSelector.style.visibility = "hidden";
    if (mdcSlider.min !== 0) {
        mdcSlider.min = 0;
    }
    if (mdcSlider.max !== 100) {
        mdcSlider.max = 100;
    }
    if (mdcSlider.step !== 1) {
        mdcSlider.step = 1;
    }
    mdcSlider.value = 0;
    positionSelectorValue.textContent = "";
}
var _bookmarks = [];
function getBookmarkMenuGroupLabel(bookmark) {
    return bookmark.title ? bookmark.title + " (" + bookmark.href + ")" : "" + bookmark.href;
}
function refreshBookmarksMenu() {
    var e_1, _a, e_2, _b;
    var bookmarksEl = document.getElementById("reader_controls_BOOKMARKS");
    var tagBookmarks = bookmarksEl._tag;
    var bookmarksListGroups = tagBookmarks.opts.linksgroup;
    for (var i = bookmarksListGroups.length - 1; i >= 0; i--) {
        bookmarksListGroups.splice(i, 1);
    }
    var sortedBookmarks;
    if (_publication) {
        sortedBookmarks = [];
        var _loop_1 = function (bookmark) {
            sortedBookmarks.push(bookmark);
            var foundLink = void 0;
            var spineIndex = -1;
            if (_publication.Spine) {
                foundLink = _publication.Spine.find(function (link, i) {
                    var ok = link.Href === bookmark.href;
                    if (ok) {
                        spineIndex = i;
                    }
                    return ok;
                });
                if (foundLink) {
                    bookmark.sortIndex = spineIndex;
                }
            }
            if (!foundLink && _publication.Resources) {
                foundLink = _publication.Resources.find(function (link) {
                    return link.Href === bookmark.href;
                });
                if (foundLink) {
                    bookmark.sortIndex = -1;
                }
                else {
                    bookmark.sortIndex = -2;
                }
            }
        };
        try {
            for (var _bookmarks_1 = tslib_1.__values(_bookmarks), _bookmarks_1_1 = _bookmarks_1.next(); !_bookmarks_1_1.done; _bookmarks_1_1 = _bookmarks_1.next()) {
                var bookmark = _bookmarks_1_1.value;
                _loop_1(bookmark);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_bookmarks_1_1 && !_bookmarks_1_1.done && (_a = _bookmarks_1.return)) _a.call(_bookmarks_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        sortedBookmarks.sort(function (l1, l2) {
            if (l1.sortIndex === -2) {
                if (l2.sortIndex === -2) {
                    return 0;
                }
                else if (l2.sortIndex === -1) {
                    return 1;
                }
                else {
                    return 1;
                }
            }
            if (l1.sortIndex === -1) {
                if (l2.sortIndex === -2) {
                    return -1;
                }
                else if (l2.sortIndex === -1) {
                    return 0;
                }
                else {
                    return 1;
                }
            }
            if (l1.sortIndex !== l2.sortIndex ||
                typeof l1.locations.progression === "undefined" ||
                typeof l2.locations.progression === "undefined") {
                return l1.sortIndex - l2.sortIndex;
            }
            return l1.locations.progression - l2.locations.progression;
        });
    }
    else {
        sortedBookmarks = _bookmarks;
    }
    var _loop_2 = function (bookmark) {
        var label = getBookmarkMenuGroupLabel(bookmark);
        var listgroup = bookmarksListGroups.find(function (lg) {
            return lg.label === label;
        });
        if (!listgroup) {
            listgroup = {
                label: label,
                links: [],
            };
            bookmarksListGroups.push(listgroup);
        }
        if (bookmark.locations.cssSelector) {
            var link = {
                href: bookmark.href + "#r2loc(" + bookmark.locations.cssSelector + ")",
                title: (typeof bookmark.locations.progression !== "undefined") ?
                    "Bookmark #" + (listgroup.links.length + 1) + " (" + Math.round(bookmark.locations.progression * 1000) / 10 + "%)" :
                    "Bookmark #" + (listgroup.links.length + 1),
            };
            listgroup.links.push(link);
        }
    };
    try {
        for (var sortedBookmarks_1 = tslib_1.__values(sortedBookmarks), sortedBookmarks_1_1 = sortedBookmarks_1.next(); !sortedBookmarks_1_1.done; sortedBookmarks_1_1 = sortedBookmarks_1.next()) {
            var bookmark = sortedBookmarks_1_1.value;
            _loop_2(bookmark);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (sortedBookmarks_1_1 && !sortedBookmarks_1_1.done && (_b = sortedBookmarks_1.return)) _b.call(sortedBookmarks_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    tagBookmarks.update();
}
function visualDebugBookmarks() {
    var e_3, _a;
    refreshBookmarksMenu();
    var current = index_1.getCurrentReadingLocation();
    if (window.READIUM2) {
        if (window.READIUM2.debugItems) {
            var cssSelector_1 = "";
            var first = true;
            try {
                for (var _bookmarks_2 = tslib_1.__values(_bookmarks), _bookmarks_2_1 = _bookmarks_2.next(); !_bookmarks_2_1.done; _bookmarks_2_1 = _bookmarks_2.next()) {
                    var bookmark = _bookmarks_2_1.value;
                    if (!current || current.locator.href !== bookmark.href) {
                        continue;
                    }
                    if (bookmark.locations.cssSelector) {
                        cssSelector_1 += first ? "" : ", ";
                        cssSelector_1 += "" + bookmark.locations.cssSelector;
                        first = false;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_bookmarks_2_1 && !_bookmarks_2_1.done && (_a = _bookmarks_2.return)) _a.call(_bookmarks_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            var cssClass_1 = "R2_DEBUG_VISUALS_BOOKMARKS";
            var cssStyles_1 = ":root[style] .R2_DEBUG_VISUALS_BOOKMARKS, :root .R2_DEBUG_VISUALS_BOOKMARKS {\n                outline-color: #b43519 !important;\n                outline-style: solid !important;\n                outline-width: 3px !important;\n                outline-offset: 0px !important;\n\n                background-color: #fee3dd !important;\n            }";
            window.READIUM2.debugItems(cssSelector_1, cssClass_1, undefined);
            if (cssSelector_1.length && window.READIUM2.DEBUG_VISUALS) {
                setTimeout(function () {
                    window.READIUM2.debugItems(cssSelector_1, cssClass_1, cssStyles_1);
                }, 100);
            }
        }
    }
}
function addCurrentVisibleBookmark() {
    var current = index_1.getCurrentReadingLocation();
    if (current && current.locator) {
        var found = _bookmarks.find(function (locator) {
            return locator.href === current.locator.href &&
                locator.locations.cssSelector === current.locator.locations.cssSelector;
        });
        if (!found) {
            _bookmarks.push(current.locator);
        }
    }
}
function removeAllBookmarks() {
    var removed = [];
    for (var i = _bookmarks.length - 1; i >= 0; i--) {
        var bookmark = _bookmarks[i];
        removed.push(bookmark);
        _bookmarks.splice(i, 1);
    }
    return removed;
}
function removeAllCurrentVisibleBookmarks() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, _reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var removed, i, bookmark, visible, err_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                removed = [];
                                i = _bookmarks.length - 1;
                                _a.label = 1;
                            case 1:
                                if (!(i >= 0)) return [3, 6];
                                bookmark = _bookmarks[i];
                                _a.label = 2;
                            case 2:
                                _a.trys.push([2, 4, , 5]);
                                return [4, index_1.isLocatorVisible(bookmark)];
                            case 3:
                                visible = _a.sent();
                                if (visible) {
                                    removed.push(bookmark);
                                    _bookmarks.splice(i, 1);
                                }
                                return [3, 5];
                            case 4:
                                err_1 = _a.sent();
                                console.log(err_1);
                                return [3, 5];
                            case 5:
                                i--;
                                return [3, 1];
                            case 6:
                                resolve(removed);
                                return [2];
                        }
                    });
                }); })];
        });
    });
}
function isAnyBookmarkVisible() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, _reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var e_4, _a, _bookmarks_3, _bookmarks_3_1, bookmark, visible, err_2, e_4_1;
                    return tslib_1.__generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 7, 8, 9]);
                                _bookmarks_3 = tslib_1.__values(_bookmarks), _bookmarks_3_1 = _bookmarks_3.next();
                                _b.label = 1;
                            case 1:
                                if (!!_bookmarks_3_1.done) return [3, 6];
                                bookmark = _bookmarks_3_1.value;
                                _b.label = 2;
                            case 2:
                                _b.trys.push([2, 4, , 5]);
                                return [4, index_1.isLocatorVisible(bookmark)];
                            case 3:
                                visible = _b.sent();
                                if (visible) {
                                    resolve(true);
                                    return [2];
                                }
                                return [3, 5];
                            case 4:
                                err_2 = _b.sent();
                                console.log(err_2);
                                return [3, 5];
                            case 5:
                                _bookmarks_3_1 = _bookmarks_3.next();
                                return [3, 1];
                            case 6: return [3, 9];
                            case 7:
                                e_4_1 = _b.sent();
                                e_4 = { error: e_4_1 };
                                return [3, 9];
                            case 8:
                                try {
                                    if (_bookmarks_3_1 && !_bookmarks_3_1.done && (_a = _bookmarks_3.return)) _a.call(_bookmarks_3);
                                }
                                finally { if (e_4) throw e_4.error; }
                                return [7];
                            case 9:
                                resolve(false);
                                return [2];
                        }
                    });
                }); })];
        });
    });
}
function refreshBookmarksState() {
    var _this = this;
    (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var buttonBookmarkTOGGLE, atLeastOneBookmarkIsVisible, err_3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    buttonBookmarkTOGGLE = document.getElementById("bookmarkTOGGLE");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, isAnyBookmarkVisible()];
                case 2:
                    atLeastOneBookmarkIsVisible = _a.sent();
                    buttonBookmarkTOGGLE.mdcButton.on = atLeastOneBookmarkIsVisible;
                    return [3, 4];
                case 3:
                    err_3 = _a.sent();
                    console.log(err_3);
                    return [3, 4];
                case 4: return [2];
            }
        });
    }); })();
}
function refreshBookmarksStore() {
    var obj = electronStore.get("bookmarks");
    if (!obj) {
        obj = {};
    }
    obj[pathDecoded] = [];
    _bookmarks.forEach(function (bookmark) {
        obj[pathDecoded].push(bookmark);
    });
    electronStore.set("bookmarks", obj);
}
function initBookmarksFromStore() {
    var obj = electronStore.get("bookmarks");
    if (!obj) {
        obj = {};
    }
    removeAllBookmarks();
    if (obj[pathDecoded]) {
        obj[pathDecoded].forEach(function (bookmark) {
            _bookmarks.push(bookmark);
        });
    }
}
electronStore.onChanged("bookmarks", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    initBookmarksFromStore();
    visualDebugBookmarks();
    refreshBookmarksState();
});
var saveReadingLocation = function (location) {
    updateReadingProgressionSlider(location);
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
    visualDebugBookmarks();
    refreshBookmarksState();
};
index_1.setReadingLocationSaver(saveReadingLocation);
var publicationJsonUrl = queryParams["pub"];
console.log(publicationJsonUrl);
var publicationJsonUrl_ = publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    sessions_1.convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;
console.log(publicationJsonUrl_);
var isHttpWebPubWithoutLCP = queryParams["isHttpWebPub"];
console.log(isHttpWebPubWithoutLCP);
var pathDecoded = "";
if (isHttpWebPubWithoutLCP) {
    pathDecoded = publicationJsonUrl;
}
else {
    var pathBase64 = publicationJsonUrl_.
        replace(/.*\/pub\/(.*)\/manifest.json.*/, "$1");
    console.log(pathBase64);
    pathDecoded = new Buffer(decodeURIComponent(pathBase64), "base64").toString("utf8");
    console.log(pathDecoded);
}
var pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
console.log(pathFileName);
var lcpHint = queryParams["lcpHint"];
electronStore.onChanged("readiumCSS.colCount", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    console.log("readiumCSS.colCount: ", oldValue, " => ", newValue);
    var radioColCountAutoEl = document.getElementById("radioColCountAuto");
    radioColCountAutoEl.checked = newValue === "auto";
    var radioColCount1El = document.getElementById("radioColCount1");
    radioColCount1El.checked = newValue === "1";
    var radioColCount2El = document.getElementById("radioColCount2");
    radioColCount2El.checked = newValue === "2";
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.night", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    if (newValue) {
        if (electronStore.get("readiumCSS.sepia")) {
            electronStore.set("readiumCSS.sepia", false);
        }
        if (electronStore.get("readiumCSS.backgroundColor")) {
            electronStore.set("readiumCSS.backgroundColor", null);
        }
        if (electronStore.get("readiumCSS.textColor")) {
            electronStore.set("readiumCSS.textColor", null);
        }
    }
    var nightSwitchEl = document.getElementById("night_switch");
    var nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.checked = newValue;
    var darkenSwitchEl = document.getElementById("darken_switch");
    var darkenSwitch = darkenSwitchEl.mdcSwitch;
    darkenSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("readiumCSS.darken", false);
    }
    var invertSwitchEl = document.getElementById("invert_switch");
    var invertSwitch = invertSwitchEl.mdcSwitch;
    invertSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("readiumCSS.invert", false);
    }
    var nightDiv = document.getElementById("night_div");
    nightDiv.style.display = newValue ? "block" : "none";
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.sepia", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    if (newValue) {
        if (electronStore.get("readiumCSS.night")) {
            electronStore.set("readiumCSS.night", false);
        }
        if (electronStore.get("readiumCSS.backgroundColor")) {
            electronStore.set("readiumCSS.backgroundColor", null);
        }
        if (electronStore.get("readiumCSS.textColor")) {
            electronStore.set("readiumCSS.textColor", null);
        }
    }
    var sepiaSwitchEl = document.getElementById("sepia_switch");
    var sepiaSwitch = sepiaSwitchEl.mdcSwitch;
    sepiaSwitch.checked = newValue;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.darken", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var darkenSwitchEl = document.getElementById("darken_switch");
    var darkenSwitch = darkenSwitchEl.mdcSwitch;
    darkenSwitch.checked = newValue;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.invert", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var invertSwitchEl = document.getElementById("invert_switch");
    var invertSwitch = invertSwitchEl.mdcSwitch;
    invertSwitch.checked = newValue;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.textAlign", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var justifySwitchEl = document.getElementById("justify_switch");
    var justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.checked = (newValue === "justify");
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.noFootnotes", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var footnotesSwitchEl = document.getElementById("footnotes_switch");
    var footnotesSwitch = footnotesSwitchEl.mdcSwitch;
    footnotesSwitch.checked = newValue ? false : true;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.reduceMotion", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var reduceMotionSwitchEl = document.getElementById("reduceMotion_switch");
    var reduceMotionSwitch = reduceMotionSwitchEl.mdcSwitch;
    reduceMotionSwitch.checked = newValue ? true : false;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.paged", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var paginateSwitchEl = document.getElementById("paginate_switch");
    var paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.checked = newValue;
    var colCountRadiosEl = document.getElementById("colCountRadios");
    if (newValue) {
        colCountRadiosEl.style.display = "block";
    }
    else {
        colCountRadiosEl.style.display = "none";
    }
    refreshReadiumCSS();
});
var refreshReadiumCSS = debounce_1.debounce(function () {
    index_1.readiumCssOnOff();
}, 500);
function ensureSliderLayout() {
    setTimeout(function () {
        document.querySelectorAll(".settingSlider").forEach(function (elem) {
            if (elem.mdcSlider) {
                elem.mdcSlider.layout();
            }
        });
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
    refreshReadiumCSS();
    var justifySwitchEl = document.getElementById("justify_switch");
    var justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.disabled = !newValue;
    var footnotesSwitchEl = document.getElementById("footnotes_switch");
    var footnotesSwitch = footnotesSwitchEl.mdcSwitch;
    footnotesSwitch.disabled = !newValue;
    var reduceMotionSwitchEl = document.getElementById("reduceMotion_switch");
    var reduceMotionSwitch = reduceMotionSwitchEl.mdcSwitch;
    reduceMotionSwitch.disabled = !newValue;
    var paginateSwitchEl = document.getElementById("paginate_switch");
    var paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.disabled = !newValue;
    var nightSwitchEl = document.getElementById("night_switch");
    var nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.disabled = !newValue;
    var sepiaSwitchEl = document.getElementById("sepia_switch");
    var sepiaSwitch = sepiaSwitchEl.mdcSwitch;
    sepiaSwitch.disabled = !newValue;
    var darkenSwitchEl = document.getElementById("darken_switch");
    var darkenSwitch = darkenSwitchEl.mdcSwitch;
    darkenSwitch.disabled = !newValue;
    var invertSwitchEl = document.getElementById("invert_switch");
    var invertSwitch = invertSwitchEl.mdcSwitch;
    invertSwitch.disabled = !newValue;
});
electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var basicSwitchEl = document.getElementById("nav_basic_switch");
    var basicSwitch = basicSwitchEl.mdcSwitch;
    basicSwitch.checked = !newValue;
});
function visualDebug(doDebug) {
    if (window.READIUM2) {
        if (window.READIUM2.debug) {
            window.READIUM2.debug(doDebug);
        }
    }
    visualDebugBookmarks();
}
electronStore.onChanged("visualDebug", function (newValue, oldValue) {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    var debugSwitchEl = document.getElementById("visual_debug_switch");
    var debugSwitch = debugSwitchEl.mdcSwitch;
    debugSwitch.checked = newValue;
    visualDebug(debugSwitch.checked);
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
    var lineHeightSelectorDefault = 150;
    var lineHeightSelectorValue = document.getElementById("lineHeightSelectorValue");
    var lineHeightSelector = document.getElementById("lineHeightSelector");
    var slider = new window.mdc.slider.MDCSlider(lineHeightSelector);
    lineHeightSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.lineHeight");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = lineHeightSelectorDefault;
    }
    lineHeightSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.lineHeight", "" + (event.detail.value / 100));
        lineHeightSelectorValue.textContent = event.detail.value + "%";
    });
    electronStore.onChanged("readiumCSS.lineHeight", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue) * 100) : lineHeightSelectorDefault);
        lineHeightSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
var initPageMarginSelector = function () {
    var pageMarginsSelectorDefault = 100;
    var pageMarginsSelectorValue = document.getElementById("pageMarginsSelectorValue");
    var pageMarginsSelector = document.getElementById("pageMarginsSelector");
    var slider = new window.mdc.slider.MDCSlider(pageMarginsSelector);
    pageMarginsSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.pageMargins");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = pageMarginsSelectorDefault;
    }
    pageMarginsSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.pageMargins", "" + (event.detail.value / 100));
        pageMarginsSelectorValue.textContent = event.detail.value + "%";
    });
    electronStore.onChanged("readiumCSS.pageMargins", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue) * 100) : pageMarginsSelectorDefault);
        pageMarginsSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
var initTypeScaleSelector = function () {
    var typeScaleSelectorDefault = 120;
    var typeScaleSelectorValue = document.getElementById("typeScaleSelectorValue");
    var typeScaleSelector = document.getElementById("typeScaleSelector");
    var slider = new window.mdc.slider.MDCSlider(typeScaleSelector);
    typeScaleSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.typeScale");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = typeScaleSelectorDefault;
    }
    typeScaleSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.typeScale", "" + (event.detail.value / 100));
        typeScaleSelectorValue.textContent = event.detail.value + "%";
    });
    electronStore.onChanged("readiumCSS.typeScale", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue) * 100) : typeScaleSelectorDefault);
        typeScaleSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
var initLetterSpacingSelector = function () {
    var letterSpacingSelectorDefault = 0;
    var letterSpacingSelectorValue = document.getElementById("letterSpacingSelectorValue");
    var letterSpacingSelector = document.getElementById("letterSpacingSelector");
    var slider = new window.mdc.slider.MDCSlider(letterSpacingSelector);
    letterSpacingSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.letterSpacing");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = letterSpacingSelectorDefault;
    }
    letterSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.letterSpacing", (event.detail.value / 100) + "rem");
        letterSpacingSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.letterSpacing", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : letterSpacingSelectorDefault);
        letterSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
var initWordSpacingSelector = function () {
    var wordSpacingSelectorDefault = 0;
    var wordSpacingSelectorValue = document.getElementById("wordSpacingSelectorValue");
    var wordSpacingSelector = document.getElementById("wordSpacingSelector");
    var slider = new window.mdc.slider.MDCSlider(wordSpacingSelector);
    wordSpacingSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.wordSpacing");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = wordSpacingSelectorDefault;
    }
    wordSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.wordSpacing", (event.detail.value / 100) + "rem");
        wordSpacingSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.wordSpacing", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : wordSpacingSelectorDefault);
        wordSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
var initParaSpacingSelector = function () {
    var paraSpacingSelectorDefault = 0;
    var paraSpacingSelectorValue = document.getElementById("paraSpacingSelectorValue");
    var paraSpacingSelector = document.getElementById("paraSpacingSelector");
    var slider = new window.mdc.slider.MDCSlider(paraSpacingSelector);
    paraSpacingSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.paraSpacing");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = paraSpacingSelectorDefault;
    }
    paraSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.paraSpacing", (event.detail.value / 100) + "rem");
        paraSpacingSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.paraSpacing", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : paraSpacingSelectorDefault);
        paraSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
var initParaIndentSelector = function () {
    var paraIndentSelectorDefault = 200;
    var paraIndentSelectorValue = document.getElementById("paraIndentSelectorValue");
    var paraIndentSelector = document.getElementById("paraIndentSelector");
    var slider = new window.mdc.slider.MDCSlider(paraIndentSelector);
    paraIndentSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.paraIndent");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = paraIndentSelectorDefault;
    }
    paraIndentSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        electronStore.set("readiumCSS.paraIndent", (event.detail.value / 100) + "rem");
        paraIndentSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.paraIndent", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : paraIndentSelectorDefault);
        paraIndentSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
var initFontSizeSelector = function () {
    var fontSizeSelectorDefault = 100;
    var fontSizeSelectorValue = document.getElementById("fontSizeSelectorValue");
    var fontSizeSelector = document.getElementById("fontSizeSelector");
    var slider = new window.mdc.slider.MDCSlider(fontSizeSelector);
    fontSizeSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    var val = electronStore.get("readiumCSS.fontSize");
    if (val) {
        slider.value = parseInt(val.replace("%", ""), 10);
    }
    else {
        slider.value = fontSizeSelectorDefault;
    }
    fontSizeSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", function (event) {
        var percent = event.detail.value + "%";
        electronStore.set("readiumCSS.fontSize", percent);
        fontSizeSelectorValue.textContent = percent;
    });
    electronStore.onChanged("readiumCSS.fontSize", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseInt(newValue.replace("%", ""), 10)) : fontSizeSelectorDefault);
        fontSizeSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
var initTextColorSelector = function () {
    initColorSelector("textColor", "Text colour");
};
var initBackgroundColorSelector = function () {
    initColorSelector("backgroundColor", "Background colour");
};
var initColorSelector = function (who, label) {
    var e_5, _a;
    var ID_PREFIX = who + "Select_";
    var options = [];
    options.push({
        id: ID_PREFIX,
        label: "default",
    });
    Object.keys(colours_1.HTML_COLORS).forEach(function (colorName) {
        var colorCode = colours_1.HTML_COLORS[colorName];
        options.push({
            id: ID_PREFIX + colorName,
            label: colorName,
            style: "border: 10px solid " + colorCode + ";",
        });
    });
    var currentColorCode = electronStore.get("readiumCSS." + who);
    var foundColorName;
    var colorNames = Object.keys(colours_1.HTML_COLORS);
    try {
        for (var colorNames_1 = tslib_1.__values(colorNames), colorNames_1_1 = colorNames_1.next(); !colorNames_1_1.done; colorNames_1_1 = colorNames_1.next()) {
            var colorName = colorNames_1_1.value;
            var colorCode = colours_1.HTML_COLORS[colorName];
            if (currentColorCode === colorCode) {
                foundColorName = colorName;
                break;
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (colorNames_1_1 && !colorNames_1_1.done && (_a = colorNames_1.return)) _a.call(colorNames_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    var selectedID = ID_PREFIX;
    if (foundColorName) {
        selectedID = ID_PREFIX + foundColorName;
    }
    var foundItem = options.find(function (item) {
        return item.id === selectedID;
    });
    if (!foundItem) {
        selectedID = options[0].id;
    }
    var opts = {
        disabled: !electronStore.get("readiumCSSEnable"),
        label: label,
        options: options,
        selected: selectedID,
    };
    var tag = index_5.riotMountMenuSelect("#" + who + "Select", opts)[0];
    tag.on("selectionChanged", function (index) {
        if (!index) {
            electronStore.set("readiumCSS." + who, null);
            return;
        }
        var id = tag.getIdForIndex(index);
        if (!id) {
            return;
        }
        var colorName = id.replace(ID_PREFIX, "");
        var colorCode = colours_1.HTML_COLORS[colorName] || undefined;
        electronStore.set("readiumCSS." + who, colorCode);
    });
    function updateLabelColor(colorCode) {
        if (tag.root) {
            var labelText = tag.root.querySelector(".mdc-select__selected-text");
            if (labelText) {
                labelText.style.border = colorCode ? "6px solid " + colorCode : "none";
            }
        }
    }
    electronStore.onChanged("readiumCSS." + who, function (newValue, oldValue) {
        var e_6, _a;
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        if (newValue) {
            if (electronStore.get("readiumCSS.night")) {
                electronStore.set("readiumCSS.night", false);
            }
            if (electronStore.get("readiumCSS.sepia")) {
                electronStore.set("readiumCSS.sepia", false);
            }
        }
        updateLabelColor(newValue);
        var foundColor;
        if (newValue) {
            var colNames = Object.keys(colours_1.HTML_COLORS);
            try {
                for (var colNames_1 = tslib_1.__values(colNames), colNames_1_1 = colNames_1.next(); !colNames_1_1.done; colNames_1_1 = colNames_1.next()) {
                    var colName = colNames_1_1.value;
                    var colCode = colours_1.HTML_COLORS[colName];
                    if (newValue === colCode) {
                        foundColor = colName;
                        break;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (colNames_1_1 && !colNames_1_1.done && (_a = colNames_1.return)) _a.call(colNames_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        if (foundColor) {
            tag.setSelectedItem(ID_PREFIX + foundColor);
        }
        else {
            tag.setSelectedItem(ID_PREFIX);
        }
        refreshReadiumCSS();
    });
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    updateLabelColor(electronStore.get("readiumCSS." + who));
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
        var id = tag.getIdForIndex(index);
        if (!id) {
            return;
        }
        id = id.replace(ID_PREFIX, "");
        electronStore.set("readiumCSS.font", id);
    });
    function updateLabelFont(newValue) {
        if (tag.root) {
            var label = tag.root.querySelector(".mdc-select__selected-text");
            if (label) {
                var fontFamily = newValue;
                if (fontFamily === "DEFAULT") {
                    fontFamily = undefined;
                }
                else if (fontFamily === "DUO") {
                }
                else if (fontFamily === "DYS") {
                }
                else if (fontFamily === "OLD") {
                }
                else if (fontFamily === "MODERN") {
                }
                else if (fontFamily === "SANS") {
                }
                else if (fontFamily === "HUMAN") {
                }
                else if (fontFamily === "MONO") {
                }
                else if (fontFamily === "JA") {
                }
                else if (fontFamily === "JA-SANS") {
                }
                else if (fontFamily === "JA-V") {
                }
                else if (fontFamily === "JA_V_SANS") {
                }
                else {
                    label.style.fontFamily = fontFamily;
                    return;
                }
                if (!fontFamily) {
                    label.removeAttribute("style");
                }
                else {
                    var idToFind_1 = ID_PREFIX + newValue;
                    var optionFound = options.find(function (item) {
                        return item.id === idToFind_1;
                    });
                    if (!optionFound || !optionFound.style) {
                        label.removeAttribute("style");
                        return;
                    }
                    label.setAttribute("style", optionFound.style);
                }
            }
        }
    }
    electronStore.onChanged("readiumCSS.font", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(ID_PREFIX + newValue);
        updateLabelFont(newValue);
        refreshReadiumCSS();
    });
    electronStore.onChanged("readiumCSSEnable", function (newValue, oldValue) {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _sysFonts, systemFonts, err_4, arr_1, divider, newSelectedID_1, newFoundItem;
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
                    err_4 = _a.sent();
                    console.log(err_4);
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
                            if (sysFont.startsWith(".")) {
                                return;
                            }
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
                    updateLabelFont(electronStore.get("readiumCSS.font"));
                    return [2];
            }
        });
    }); }, 100);
};
window.addEventListener("DOMContentLoaded", function () {
    drag_drop_1.setupDragDrop();
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
    initTextColorSelector();
    initBackgroundColorSelector();
    initFontSelector();
    initFontSizeSelector();
    initLineHeightSelector();
    initTypeScaleSelector();
    initPageMarginSelector();
    initWordSpacingSelector();
    initParaSpacingSelector();
    initParaIndentSelector();
    initLetterSpacingSelector();
    var nightSwitchEl = document.getElementById("night_switch");
    var nightSwitch = new window.mdc.switchControl.MDCSwitch(nightSwitchEl);
    nightSwitchEl.mdcSwitch = nightSwitch;
    nightSwitch.checked = electronStore.get("readiumCSS.night");
    var nightDiv = document.getElementById("night_div");
    nightDiv.style.display = nightSwitch.checked ? "block" : "none";
    nightSwitchEl.addEventListener("change", function (_event) {
        var checked = nightSwitch.checked;
        electronStore.set("readiumCSS.night", checked);
    });
    nightSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var sepiaSwitchEl = document.getElementById("sepia_switch");
    var sepiaSwitch = new window.mdc.switchControl.MDCSwitch(sepiaSwitchEl);
    sepiaSwitchEl.mdcSwitch = sepiaSwitch;
    sepiaSwitch.checked = electronStore.get("readiumCSS.sepia");
    sepiaSwitchEl.addEventListener("change", function (_event) {
        var checked = sepiaSwitch.checked;
        electronStore.set("readiumCSS.sepia", checked);
    });
    sepiaSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var invertSwitchEl = document.getElementById("invert_switch");
    var invertSwitch = new window.mdc.switchControl.MDCSwitch(invertSwitchEl);
    invertSwitchEl.mdcSwitch = invertSwitch;
    invertSwitch.checked = electronStore.get("readiumCSS.invert");
    invertSwitchEl.addEventListener("change", function (_event) {
        var checked = invertSwitch.checked;
        electronStore.set("readiumCSS.invert", checked);
    });
    invertSwitch.disabled = !nightSwitch.checked || !electronStore.get("readiumCSSEnable");
    var darkenSwitchEl = document.getElementById("darken_switch");
    var darkenSwitch = new window.mdc.switchControl.MDCSwitch(darkenSwitchEl);
    darkenSwitchEl.mdcSwitch = darkenSwitch;
    darkenSwitch.checked = electronStore.get("readiumCSS.darken");
    darkenSwitchEl.addEventListener("change", function (_event) {
        var checked = darkenSwitch.checked;
        electronStore.set("readiumCSS.darken", checked);
    });
    darkenSwitch.disabled = !nightSwitch.checked || !electronStore.get("readiumCSSEnable");
    var justifySwitchEl = document.getElementById("justify_switch");
    var justifySwitch = new window.mdc.switchControl.MDCSwitch(justifySwitchEl);
    justifySwitchEl.mdcSwitch = justifySwitch;
    justifySwitch.checked = electronStore.get("readiumCSS.textAlign") === "justify";
    justifySwitchEl.addEventListener("change", function (_event) {
        var checked = justifySwitch.checked;
        electronStore.set("readiumCSS.textAlign", checked ? "justify" : "initial");
    });
    justifySwitch.disabled = !electronStore.get("readiumCSSEnable");
    var footnotesSwitchEl = document.getElementById("footnotes_switch");
    var footnotesSwitch = new window.mdc.switchControl.MDCSwitch(footnotesSwitchEl);
    footnotesSwitchEl.mdcSwitch = footnotesSwitch;
    footnotesSwitch.checked = electronStore.get("readiumCSS.noFootnotes") ? false : true;
    footnotesSwitchEl.addEventListener("change", function (_event) {
        var checked = footnotesSwitch.checked;
        electronStore.set("readiumCSS.noFootnotes", checked ? false : true);
    });
    footnotesSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var reduceMotionSwitchEl = document.getElementById("reduceMotion_switch");
    var reduceMotionSwitch = new window.mdc.switchControl.MDCSwitch(reduceMotionSwitchEl);
    reduceMotionSwitchEl.mdcSwitch = reduceMotionSwitch;
    reduceMotionSwitch.checked = electronStore.get("readiumCSS.reduceMotion") ? true : false;
    reduceMotionSwitchEl.addEventListener("change", function (_event) {
        var checked = reduceMotionSwitch.checked;
        electronStore.set("readiumCSS.reduceMotion", checked ? true : false);
    });
    reduceMotionSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var paginateSwitchEl = document.getElementById("paginate_switch");
    var paginateSwitch = new window.mdc.switchControl.MDCSwitch(paginateSwitchEl);
    paginateSwitchEl.mdcSwitch = paginateSwitch;
    paginateSwitch.checked = electronStore.get("readiumCSS.paged");
    paginateSwitchEl.addEventListener("change", function (_event) {
        var checked = paginateSwitch.checked;
        electronStore.set("readiumCSS.paged", checked);
        var colCountRadiosEl = document.getElementById("colCountRadios");
        if (checked) {
            colCountRadiosEl.style.display = "block";
        }
        else {
            colCountRadiosEl.style.display = "none";
        }
    });
    paginateSwitch.disabled = !electronStore.get("readiumCSSEnable");
    var colCountRadiosElem = document.getElementById("colCountRadios");
    if (paginateSwitch.checked) {
        colCountRadiosElem.style.display = "block";
    }
    else {
        colCountRadiosElem.style.display = "none";
    }
    var radioColCountAutoEl = document.getElementById("radioColCountAuto");
    radioColCountAutoEl.checked = electronStore.get("readiumCSS.colCount") === "auto";
    radioColCountAutoEl.addEventListener("change", function () {
        if (radioColCountAutoEl.checked) {
            electronStore.set("readiumCSS.colCount", "auto");
        }
    });
    var radioColCount1El = document.getElementById("radioColCount1");
    radioColCount1El.checked = electronStore.get("readiumCSS.colCount") === "1";
    radioColCount1El.addEventListener("change", function () {
        if (radioColCount1El.checked) {
            electronStore.set("readiumCSS.colCount", "1");
        }
    });
    var radioColCount2El = document.getElementById("radioColCount2");
    radioColCount2El.checked = electronStore.get("readiumCSS.colCount") === "2";
    radioColCount2El.addEventListener("change", function () {
        if (radioColCount2El.checked) {
            electronStore.set("readiumCSS.colCount", "2");
        }
    });
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
        setTimeout(function () {
            snackBar.labelText = "Link URLs now " + (checked ? "shown" : "hidden") + ".";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    var debugSwitchEl = document.getElementById("visual_debug_switch");
    var debugSwitch = new window.mdc.switchControl.MDCSwitch(debugSwitchEl);
    debugSwitchEl.mdcSwitch = debugSwitch;
    debugSwitch.checked = electronStore.get("visualDebug");
    debugSwitchEl.addEventListener("change", function (_event) {
        var checked = debugSwitch.checked;
        electronStore.set("visualDebug", checked);
        setTimeout(function () {
            snackBar.labelText = "Visual debugging now " + (checked ? "enabled" : "disabled") + ".";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    var snackBarElem = document.getElementById("snackbar");
    snackBar = new window.mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBarElem.mdcSnackbar = snackBar;
    var selectElement = document.getElementById("nav-select");
    var navSelector = new window.mdc.select.MDCSelect(selectElement);
    selectElement.mdcSelect = navSelector;
    navSelector.listen("MDCSelect:change", function (ev) {
        var activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        var newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.index + 1) + ")");
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
    var positionSelector = document.getElementById("positionSelector");
    var slider = new window.mdc.slider.MDCSlider(positionSelector);
    positionSelector.mdcSlider = slider;
    slider.listen("MDCSlider:change", function (_event) {
        onChangeReadingProgressionSlider();
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
        electronStore.set("bookmarks", {});
        drawer.open = false;
        setTimeout(function () {
            snackBar.labelText = "Reading locations / bookmarks reset.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    var buttonClearSettings = document.getElementById("buttonClearSettings");
    buttonClearSettings.addEventListener("click", function () {
        electronStore.set(undefined, electronStore.getDefaults());
        drawer.open = false;
        setTimeout(function () {
            snackBar.labelText = "Settings reset.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    var buttonClearSettingsStyle = document.getElementById("buttonClearSettingsStyle");
    buttonClearSettingsStyle.addEventListener("click", function () {
        electronStore.set("readiumCSS", electronStore.getDefaults().readiumCSS);
    });
    var buttonOpenSettings = document.getElementById("buttonOpenSettings");
    buttonOpenSettings.addEventListener("click", function () {
        if (electronStore.reveal) {
            electronStore.reveal();
        }
    });
    var buttonOpenLcpSettings = document.getElementById("buttonOpenLcpSettings");
    buttonOpenLcpSettings.addEventListener("click", function () {
        if (electronStoreLCP.reveal) {
            electronStoreLCP.reveal();
        }
        electron_1.ipcRenderer.send("R2_EVENT_LCP_LSD_OPEN_SETTINGS");
    });
    var buttonLSDRenew = document.getElementById("buttonLSDRenew");
    buttonLSDRenew.addEventListener("click", function () {
        var payload = {
            endDateStr: undefined,
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, payload);
        drawer.open = false;
        setTimeout(function () {
            snackBar.labelText = "LCP LSD renew message sent.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    var buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", function () {
        var payload = {
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, payload);
        drawer.open = false;
        setTimeout(function () {
            snackBar.labelText = "LCP LSD return message sent.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    document.querySelectorAll("#tabsPanels .mdc-switch__native-control").forEach(function (elem) {
        elem.addEventListener("focusin", function (ev) {
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-fg-scale", "1.7");
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-fg-size", "28px");
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-left", "10px");
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-top", "10px");
            ev.target.parentElement.parentElement.parentElement.parentElement.classList.add("keyboardfocus");
        });
        elem.addEventListener("focusout", function (ev) {
            ev.target.parentElement.parentNode.parentNode.parentNode.classList.remove("keyboardfocus");
        });
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
        function refreshTtsUiState() {
            if (_ttsState === index_1.TTSStateEnum.PAUSED) {
                buttonttsPLAYPAUSE.mdcButton.on = false;
                buttonttsPLAYPAUSE.style.display = "inline-block";
                buttonttsSTOP.style.display = "inline-block";
                buttonttsPREVIOUS.style.display = "inline-block";
                buttonttsNEXT.style.display = "inline-block";
            }
            else if (_ttsState === index_1.TTSStateEnum.STOPPED) {
                buttonttsPLAYPAUSE.mdcButton.on = false;
                buttonttsPLAYPAUSE.style.display = "inline-block";
                buttonttsSTOP.style.display = "none";
                buttonttsPREVIOUS.style.display = "none";
                buttonttsNEXT.style.display = "none";
            }
            else if (_ttsState === index_1.TTSStateEnum.PLAYING) {
                buttonttsPLAYPAUSE.mdcButton.on = true;
                buttonttsPLAYPAUSE.style.display = "inline-block";
                buttonttsSTOP.style.display = "inline-block";
                buttonttsPREVIOUS.style.display = "inline-block";
                buttonttsNEXT.style.display = "inline-block";
            }
            else {
                buttonttsPLAYPAUSE.mdcButton.on = false;
                buttonttsPLAYPAUSE.style.display = "none";
                buttonttsSTOP.style.display = "none";
                buttonttsPREVIOUS.style.display = "none";
                buttonttsNEXT.style.display = "none";
            }
        }
        function ttsEnableToggle() {
            if (_ttsEnabled) {
                index_1.ttsClickEnable(false);
                _ttsEnabled = false;
                _ttsState = undefined;
                refreshTtsUiState();
                index_1.ttsStop();
            }
            else {
                index_1.ttsClickEnable(true);
                _ttsEnabled = true;
                _ttsState = index_1.TTSStateEnum.STOPPED;
                refreshTtsUiState();
                index_1.ttsStop();
            }
        }
        var response, e_7, _publicationJSON, e_8, title, keys, h1, buttonBookmarkTOGGLE, mdcButtonBookmarkTOGGLE, buttonttsPLAYPAUSE, mdcButtonttsPLAYPAUSE, buttonttsSTOP, buttonttsNEXT, buttonttsPREVIOUS, buttonttsTOGGLE, mdcButtonttsTOGGLE, _ttsState, _ttsEnabled, buttonNavLeft, buttonNavRight, onWheel, FAKE_URL, optsBookmarks, tagBookmarks, opts, opts, tag_1, opts, tag_2, landmarksData, opts, tag_3, readStore, location, obj;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, fetch(publicationJsonUrl_)];
                case 1:
                    response = _a.sent();
                    return [3, 3];
                case 2:
                    e_7 = _a.sent();
                    console.log(e_7);
                    console.log(publicationJsonUrl_);
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
                    e_8 = _a.sent();
                    console.log(e_8);
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
                            h1.setAttribute("title", title);
                        }
                    }
                    initBookmarksFromStore();
                    buttonBookmarkTOGGLE = document.getElementById("bookmarkTOGGLE");
                    buttonBookmarkTOGGLE.addEventListener("MDCIconButtonToggle:change", function (_event) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var removed, err_5;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!event.detail.isOn) return [3, 1];
                                    addCurrentVisibleBookmark();
                                    return [3, 4];
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4, removeAllCurrentVisibleBookmarks()];
                                case 2:
                                    removed = _a.sent();
                                    console.log("removed bookmarks:");
                                    removed.forEach(function (bookmark) {
                                        console.log(JSON.stringify(bookmark, null, 4));
                                    });
                                    return [3, 4];
                                case 3:
                                    err_5 = _a.sent();
                                    console.log(err_5);
                                    return [3, 4];
                                case 4:
                                    visualDebugBookmarks();
                                    refreshBookmarksStore();
                                    return [2];
                            }
                        });
                    }); });
                    mdcButtonBookmarkTOGGLE = new window.mdc.iconButton.MDCIconButtonToggle(buttonBookmarkTOGGLE);
                    buttonBookmarkTOGGLE.mdcButton = mdcButtonBookmarkTOGGLE;
                    buttonttsPLAYPAUSE = document.getElementById("ttsPLAYPAUSE");
                    buttonttsPLAYPAUSE.addEventListener("MDCIconButtonToggle:change", function (event) {
                        if (event.detail.isOn) {
                            if (_ttsState === index_1.TTSStateEnum.PAUSED) {
                                index_1.ttsResume();
                            }
                            else {
                                index_1.ttsPlay();
                            }
                        }
                        else {
                            index_1.ttsPause();
                        }
                    });
                    mdcButtonttsPLAYPAUSE = new window.mdc.iconButton.MDCIconButtonToggle(buttonttsPLAYPAUSE);
                    buttonttsPLAYPAUSE.mdcButton = mdcButtonttsPLAYPAUSE;
                    buttonttsSTOP = document.getElementById("ttsSTOP");
                    buttonttsSTOP.addEventListener("click", function (_event) {
                        index_1.ttsStop();
                    });
                    buttonttsNEXT = document.getElementById("ttsNEXT");
                    buttonttsNEXT.addEventListener("click", function (_event) {
                        index_1.ttsNext();
                    });
                    buttonttsPREVIOUS = document.getElementById("ttsPREVIOUS");
                    buttonttsPREVIOUS.addEventListener("click", function (_event) {
                        index_1.ttsPrevious();
                    });
                    buttonttsTOGGLE = document.getElementById("ttsTOGGLE");
                    buttonttsTOGGLE.addEventListener("MDCIconButtonToggle:change", function (_event) {
                        ttsEnableToggle();
                    });
                    mdcButtonttsTOGGLE = new window.mdc.iconButton.MDCIconButtonToggle(buttonttsTOGGLE);
                    buttonttsTOGGLE.mdcButton = mdcButtonttsTOGGLE;
                    refreshTtsUiState();
                    index_1.ttsListen(function (ttsState) {
                        if (!_ttsEnabled) {
                            return;
                        }
                        _ttsState = ttsState;
                        refreshTtsUiState();
                    });
                    _ttsEnabled = false;
                    buttonNavLeft = document.getElementById("buttonNavLeft");
                    buttonNavLeft.addEventListener("click", function (_event) {
                        index_1.navLeftOrRight(true);
                    });
                    buttonNavRight = document.getElementById("buttonNavRight");
                    buttonNavRight.addEventListener("click", function (_event) {
                        index_1.navLeftOrRight(false);
                    });
                    onWheel = throttle(function (ev) {
                        console.log("wheel: " + ev.deltaX + " - " + ev.deltaY);
                        if (ev.deltaY < 0 || ev.deltaX < 0) {
                            index_1.navLeftOrRight(true);
                        }
                        else if (ev.deltaY > 0 || ev.deltaX > 0) {
                            index_1.navLeftOrRight(false);
                        }
                    }, 300);
                    buttonNavLeft.addEventListener("wheel", onWheel);
                    buttonNavRight.addEventListener("wheel", onWheel);
                    FAKE_URL = "https://dummy.me/";
                    optsBookmarks = {
                        basic: electronStore.get("basicLinkTitles"),
                        handleLink: function (href) {
                            href = href.substr(FAKE_URL.length);
                            var fragToken = "#r2loc(";
                            var i = href.indexOf(fragToken);
                            if (i > 0) {
                                var j = i + fragToken.length;
                                var cssSelector = href.substr(j, href.length - j - 1);
                                href = href.substr(0, i);
                                var locator = {
                                    href: href,
                                    locations: {
                                        cssSelector: cssSelector,
                                    },
                                };
                                handleLinkLocator_(locator);
                            }
                        },
                        linksgroup: [],
                        url: FAKE_URL,
                    };
                    tagBookmarks = index_3.riotMountLinkListGroup("#reader_controls_BOOKMARKS", optsBookmarks)[0];
                    electronStore.onChanged("basicLinkTitles", function (newValue, oldValue) {
                        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                            return;
                        }
                        tagBookmarks.setBasic(newValue);
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
                        var foundLink;
                        if (_publication && location) {
                            if (_publication.Spine) {
                                foundLink = _publication.Spine.find(function (link) {
                                    return typeof location !== "undefined" &&
                                        link.Href === location.href;
                                });
                            }
                            if (!foundLink && _publication.Resources) {
                                foundLink = _publication.Resources.find(function (link) {
                                    return typeof location !== "undefined" &&
                                        link.Href === location.href;
                                });
                            }
                        }
                        var locatorExtended = location ? {
                            docInfo: {
                                isFixedLayout: isFixedLayout(_publication, foundLink),
                                isRightToLeft: false,
                                isVerticalWritingMode: false,
                            },
                            locator: location,
                            paginationInfo: undefined,
                            selectionInfo: undefined,
                        } : undefined;
                        updateReadingProgressionSlider(locatorExtended);
                        index_1.installNavigatorDOM(_publication, publicationJsonUrl, rootHtmlElementID, preloadPath, location);
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
            index_1.handleLinkUrl(href);
        }, 200);
    }
    else {
        index_1.handleLinkUrl(href);
    }
}
function handleLinkLocator_(locator) {
    if (drawer.open) {
        drawer.open = false;
        setTimeout(function () {
            index_1.handleLinkLocator(locator);
        }, 200);
    }
    else {
        index_1.handleLinkLocator(locator);
    }
}
//# sourceMappingURL=index.js.map