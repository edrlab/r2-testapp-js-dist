"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const readium_css_settings_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/common/readium-css-settings");
const sessions_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/common/sessions");
const querystring_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/renderer/common/querystring");
const index_1 = require("r2-navigator-js/dist/es7-es2016/src/electron/renderer/index");
const init_globals_1 = require("r2-opds-js/dist/es7-es2016/src/opds/init-globals");
const init_globals_2 = require("r2-shared-js/dist/es7-es2016/src/init-globals");
const publication_1 = require("r2-shared-js/dist/es7-es2016/src/models/publication");
const debounce_1 = require("debounce");
const electron_1 = require("electron");
const ta_json_x_1 = require("ta-json-x");
const throttle = require("throttleit");
const events_1 = require("../common/events");
const store_electron_1 = require("../common/store-electron");
const colours_1 = require("./colours");
const drag_drop_1 = require("./drag-drop");
const index_2 = require("./riots/linklist/index_");
const index_3 = require("./riots/linklistgroup/index_");
const index_4 = require("./riots/linktree/index_");
const index_5 = require("./riots/menuselect/index_");
const SystemFonts = require("system-font-families");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const queryParams = querystring_1.getURLQueryParams();
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
let _publication;
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
    const positionSelector = document.getElementById("positionSelector");
    const mdcSlider = positionSelector.mdcSlider;
    if (typeof mdcSlider.functionMode === "undefined") {
        return;
    }
    if (mdcSlider.functionMode === "fixed-layout" ||
        mdcSlider.functionMode === "reflow-scrolled") {
        if (_publication && _publication.Spine) {
            const zeroBasedIndex = mdcSlider.value - 1;
            const foundLink = _publication.Spine.find((_link, i) => {
                return zeroBasedIndex === i;
            });
            if (foundLink) {
                const locator = {
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
        const currentPos = index_1.getCurrentReadingLocation();
        if (!currentPos) {
            return;
        }
        const locator = {
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
    const locator = locatorExtended ? locatorExtended.locator : undefined;
    const positionSelector = document.getElementById("positionSelector");
    positionSelector.style.visibility = "visible";
    const positionSelectorValue = document.getElementById("positionSelectorValue");
    const mdcSlider = positionSelector.mdcSlider;
    let foundLink;
    let spineIndex = -1;
    if (_publication && locator) {
        if (_publication.Spine) {
            foundLink = _publication.Spine.find((link, i) => {
                const ok = link.Href === locator.href;
                if (ok) {
                    spineIndex = i;
                }
                return ok;
            });
        }
        if (!foundLink && _publication.Resources) {
            foundLink = _publication.Resources.find((link) => {
                return link.Href === locator.href;
            });
        }
    }
    const fixedLayout = (locatorExtended && locatorExtended.docInfo) ?
        locatorExtended.docInfo.isFixedLayout :
        (_publication ? isFixedLayout(_publication, foundLink) : false);
    let label = (foundLink && foundLink.Title) ? sanitizeText(foundLink.Title) : undefined;
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
            const pagePosStr = `Page ${spineIndex + 1} / ${_publication.Spine.length}`;
            positionSelectorValue.textContent = pagePosStr;
            return;
        }
    }
    else {
        const current = index_1.getCurrentReadingLocation();
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
                const pagePosStr = `Chapter ${spineIndex + 1} / ${_publication.Spine.length}`;
                if (label) {
                    positionSelectorValue.innerHTML = `[<strong>${label}</strong>] ` + pagePosStr;
                }
                else {
                    positionSelectorValue.textContent = pagePosStr;
                }
                return;
            }
        }
        else {
            mdcSlider.functionMode = "reflow-paginated";
            const totalColumns = current.paginationInfo.totalColumns;
            const totalSpreads = Math.ceil(totalColumns / 2);
            const totalSpreadsOrColumns = current.paginationInfo.isTwoPageSpread ? totalSpreads : totalColumns;
            const nColumn = current.paginationInfo.currentColumn + 1;
            const nSpread = current.paginationInfo.spreadIndex + 1;
            const nSpreadOrColumn = current.paginationInfo.isTwoPageSpread ? nSpread : nColumn;
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
            const nSpreadColumn = (current.paginationInfo.spreadIndex * 2) + 1;
            const pageStr = current.paginationInfo.isTwoPageSpread ?
                ((nSpreadColumn + 1) <= totalColumns ? `Pages ${nSpreadColumn}-${nSpreadColumn + 1} / ${totalColumns}` :
                    `Page ${nSpreadColumn} / ${totalColumns}`) : `Page ${nColumn} / ${totalColumns}`;
            if (label) {
                positionSelectorValue.innerHTML = `[<strong>${label}</strong>] ` + pageStr;
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
const _bookmarks = [];
function getBookmarkMenuGroupLabel(bookmark) {
    return bookmark.title ? `${bookmark.title} (${bookmark.href})` : `${bookmark.href}`;
}
function refreshBookmarksMenu() {
    const bookmarksEl = document.getElementById("reader_controls_BOOKMARKS");
    const tagBookmarks = bookmarksEl._tag;
    const bookmarksListGroups = tagBookmarks.opts.linksgroup;
    for (let i = bookmarksListGroups.length - 1; i >= 0; i--) {
        bookmarksListGroups.splice(i, 1);
    }
    let sortedBookmarks;
    if (_publication) {
        sortedBookmarks = [];
        for (const bookmark of _bookmarks) {
            sortedBookmarks.push(bookmark);
            let foundLink;
            let spineIndex = -1;
            if (_publication.Spine) {
                foundLink = _publication.Spine.find((link, i) => {
                    const ok = link.Href === bookmark.href;
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
                foundLink = _publication.Resources.find((link) => {
                    return link.Href === bookmark.href;
                });
                if (foundLink) {
                    bookmark.sortIndex = -1;
                }
                else {
                    bookmark.sortIndex = -2;
                }
            }
        }
        sortedBookmarks.sort((l1, l2) => {
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
    for (const bookmark of sortedBookmarks) {
        const label = getBookmarkMenuGroupLabel(bookmark);
        let listgroup = bookmarksListGroups.find((lg) => {
            return lg.label === label;
        });
        if (!listgroup) {
            listgroup = {
                label,
                links: [],
            };
            bookmarksListGroups.push(listgroup);
        }
        if (bookmark.locations.cssSelector) {
            const link = {
                href: bookmark.href + "#r2loc(" + bookmark.locations.cssSelector + ")",
                title: (typeof bookmark.locations.progression !== "undefined") ?
                    `Bookmark #${listgroup.links.length + 1} (${Math.round(bookmark.locations.progression * 1000) / 10}%)` :
                    `Bookmark #${listgroup.links.length + 1}`,
            };
            listgroup.links.push(link);
        }
    }
    tagBookmarks.update();
}
function visualDebugBookmarks() {
    refreshBookmarksMenu();
    const current = index_1.getCurrentReadingLocation();
    if (window.READIUM2) {
        if (window.READIUM2.debugItems) {
            let cssSelector = "";
            let first = true;
            for (const bookmark of _bookmarks) {
                if (!current || current.locator.href !== bookmark.href) {
                    continue;
                }
                if (bookmark.locations.cssSelector) {
                    cssSelector += first ? "" : ", ";
                    cssSelector += `${bookmark.locations.cssSelector}`;
                    first = false;
                }
            }
            const cssClass = "R2_DEBUG_VISUALS_BOOKMARKS";
            const cssStyles = `:root[style] .R2_DEBUG_VISUALS_BOOKMARKS, :root .R2_DEBUG_VISUALS_BOOKMARKS {
                outline-color: #b43519 !important;
                outline-style: solid !important;
                outline-width: 3px !important;
                outline-offset: 0px !important;

                background-color: #fee3dd !important;
            }`;
            window.READIUM2.debugItems(cssSelector, cssClass, undefined);
            if (cssSelector.length && window.READIUM2.DEBUG_VISUALS) {
                setTimeout(() => {
                    window.READIUM2.debugItems(cssSelector, cssClass, cssStyles);
                }, 100);
            }
        }
    }
}
function addCurrentVisibleBookmark() {
    const current = index_1.getCurrentReadingLocation();
    if (current && current.locator) {
        const found = _bookmarks.find((locator) => {
            return locator.href === current.locator.href &&
                locator.locations.cssSelector === current.locator.locations.cssSelector;
        });
        if (!found) {
            _bookmarks.push(current.locator);
        }
    }
}
function removeAllBookmarks() {
    const removed = [];
    for (let i = _bookmarks.length - 1; i >= 0; i--) {
        const bookmark = _bookmarks[i];
        removed.push(bookmark);
        _bookmarks.splice(i, 1);
    }
    return removed;
}
function removeAllCurrentVisibleBookmarks() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, _reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const removed = [];
            for (let i = _bookmarks.length - 1; i >= 0; i--) {
                const bookmark = _bookmarks[i];
                try {
                    const visible = yield index_1.isLocatorVisible(bookmark);
                    if (visible) {
                        removed.push(bookmark);
                        _bookmarks.splice(i, 1);
                    }
                }
                catch (err) {
                    console.log(err);
                }
            }
            resolve(removed);
        }));
    });
}
function isAnyBookmarkVisible() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, _reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const bookmark of _bookmarks) {
                try {
                    const visible = yield index_1.isLocatorVisible(bookmark);
                    if (visible) {
                        resolve(true);
                        return;
                    }
                }
                catch (err) {
                    console.log(err);
                }
            }
            resolve(false);
        }));
    });
}
function refreshBookmarksState() {
    (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const buttonBookmarkTOGGLE = document.getElementById("bookmarkTOGGLE");
        try {
            const atLeastOneBookmarkIsVisible = yield isAnyBookmarkVisible();
            buttonBookmarkTOGGLE.mdcButton.on = atLeastOneBookmarkIsVisible;
        }
        catch (err) {
            console.log(err);
        }
    }))();
}
function refreshBookmarksStore() {
    let obj = electronStore.get("bookmarks");
    if (!obj) {
        obj = {};
    }
    obj[pathDecoded] = [];
    _bookmarks.forEach((bookmark) => {
        obj[pathDecoded].push(bookmark);
    });
    electronStore.set("bookmarks", obj);
}
function initBookmarksFromStore() {
    let obj = electronStore.get("bookmarks");
    if (!obj) {
        obj = {};
    }
    removeAllBookmarks();
    if (obj[pathDecoded]) {
        obj[pathDecoded].forEach((bookmark) => {
            _bookmarks.push(bookmark);
        });
    }
}
electronStore.onChanged("bookmarks", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    initBookmarksFromStore();
    visualDebugBookmarks();
    refreshBookmarksState();
});
const saveReadingLocation = (location) => {
    updateReadingProgressionSlider(location);
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
    visualDebugBookmarks();
    refreshBookmarksState();
};
index_1.setReadingLocationSaver(saveReadingLocation);
const publicationJsonUrl = queryParams["pub"];
console.log(publicationJsonUrl);
const publicationJsonUrl_ = publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    sessions_1.convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;
console.log(publicationJsonUrl_);
const isHttpWebPubWithoutLCP = queryParams["isHttpWebPub"];
console.log(isHttpWebPubWithoutLCP);
let pathDecoded = "";
if (isHttpWebPubWithoutLCP) {
    pathDecoded = publicationJsonUrl;
}
else {
    const pathBase64 = publicationJsonUrl_.
        replace(/.*\/pub\/(.*)\/manifest.json.*/, "$1");
    console.log(pathBase64);
    pathDecoded = new Buffer(decodeURIComponent(pathBase64), "base64").toString("utf8");
    console.log(pathDecoded);
}
const pathFileName = pathDecoded.substr(pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1, pathDecoded.length - 1);
console.log(pathFileName);
const lcpHint = queryParams["lcpHint"];
electronStore.onChanged("readiumCSS.colCount", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    console.log("readiumCSS.colCount: ", oldValue, " => ", newValue);
    const radioColCountAutoEl = document.getElementById("radioColCountAuto");
    radioColCountAutoEl.checked = newValue === "auto";
    const radioColCount1El = document.getElementById("radioColCount1");
    radioColCount1El.checked = newValue === "1";
    const radioColCount2El = document.getElementById("radioColCount2");
    radioColCount2El.checked = newValue === "2";
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.night", (newValue, oldValue) => {
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
    const nightSwitchEl = document.getElementById("night_switch");
    const nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.checked = newValue;
    const darkenSwitchEl = document.getElementById("darken_switch");
    const darkenSwitch = darkenSwitchEl.mdcSwitch;
    darkenSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("readiumCSS.darken", false);
    }
    const invertSwitchEl = document.getElementById("invert_switch");
    const invertSwitch = invertSwitchEl.mdcSwitch;
    invertSwitch.disabled = !newValue;
    if (!newValue) {
        electronStore.set("readiumCSS.invert", false);
    }
    const nightDiv = document.getElementById("night_div");
    nightDiv.style.display = newValue ? "block" : "none";
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.sepia", (newValue, oldValue) => {
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
    const sepiaSwitchEl = document.getElementById("sepia_switch");
    const sepiaSwitch = sepiaSwitchEl.mdcSwitch;
    sepiaSwitch.checked = newValue;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.darken", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const darkenSwitchEl = document.getElementById("darken_switch");
    const darkenSwitch = darkenSwitchEl.mdcSwitch;
    darkenSwitch.checked = newValue;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.invert", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const invertSwitchEl = document.getElementById("invert_switch");
    const invertSwitch = invertSwitchEl.mdcSwitch;
    invertSwitch.checked = newValue;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.textAlign", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const justifySwitchEl = document.getElementById("justify_switch");
    const justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.checked = (newValue === "justify");
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.noFootnotes", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const footnotesSwitchEl = document.getElementById("footnotes_switch");
    const footnotesSwitch = footnotesSwitchEl.mdcSwitch;
    footnotesSwitch.checked = newValue ? false : true;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.reduceMotion", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const reduceMotionSwitchEl = document.getElementById("reduceMotion_switch");
    const reduceMotionSwitch = reduceMotionSwitchEl.mdcSwitch;
    reduceMotionSwitch.checked = newValue ? true : false;
    refreshReadiumCSS();
});
electronStore.onChanged("readiumCSS.paged", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const paginateSwitchEl = document.getElementById("paginate_switch");
    const paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.checked = newValue;
    const colCountRadiosEl = document.getElementById("colCountRadios");
    if (newValue) {
        colCountRadiosEl.style.display = "block";
    }
    else {
        colCountRadiosEl.style.display = "none";
    }
    refreshReadiumCSS();
});
const refreshReadiumCSS = debounce_1.debounce(() => {
    index_1.readiumCssOnOff();
}, 500);
function ensureSliderLayout() {
    setTimeout(() => {
        document.querySelectorAll(".settingSlider").forEach((elem) => {
            if (elem.mdcSlider) {
                elem.mdcSlider.layout();
            }
        });
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
    refreshReadiumCSS();
    const justifySwitchEl = document.getElementById("justify_switch");
    const justifySwitch = justifySwitchEl.mdcSwitch;
    justifySwitch.disabled = !newValue;
    const footnotesSwitchEl = document.getElementById("footnotes_switch");
    const footnotesSwitch = footnotesSwitchEl.mdcSwitch;
    footnotesSwitch.disabled = !newValue;
    const reduceMotionSwitchEl = document.getElementById("reduceMotion_switch");
    const reduceMotionSwitch = reduceMotionSwitchEl.mdcSwitch;
    reduceMotionSwitch.disabled = !newValue;
    const paginateSwitchEl = document.getElementById("paginate_switch");
    const paginateSwitch = paginateSwitchEl.mdcSwitch;
    paginateSwitch.disabled = !newValue;
    const nightSwitchEl = document.getElementById("night_switch");
    const nightSwitch = nightSwitchEl.mdcSwitch;
    nightSwitch.disabled = !newValue;
    const sepiaSwitchEl = document.getElementById("sepia_switch");
    const sepiaSwitch = sepiaSwitchEl.mdcSwitch;
    sepiaSwitch.disabled = !newValue;
    const darkenSwitchEl = document.getElementById("darken_switch");
    const darkenSwitch = darkenSwitchEl.mdcSwitch;
    darkenSwitch.disabled = !newValue;
    const invertSwitchEl = document.getElementById("invert_switch");
    const invertSwitch = invertSwitchEl.mdcSwitch;
    invertSwitch.disabled = !newValue;
});
electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const basicSwitchEl = document.getElementById("nav_basic_switch");
    const basicSwitch = basicSwitchEl.mdcSwitch;
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
electronStore.onChanged("visualDebug", (newValue, oldValue) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const debugSwitchEl = document.getElementById("visual_debug_switch");
    const debugSwitch = debugSwitchEl.mdcSwitch;
    debugSwitch.checked = newValue;
    visualDebug(debugSwitch.checked);
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
    const lineHeightSelectorDefault = 150;
    const lineHeightSelectorValue = document.getElementById("lineHeightSelectorValue");
    const lineHeightSelector = document.getElementById("lineHeightSelector");
    const slider = new window.mdc.slider.MDCSlider(lineHeightSelector);
    lineHeightSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.lineHeight");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = lineHeightSelectorDefault;
    }
    lineHeightSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.lineHeight", "" + (event.detail.value / 100));
        lineHeightSelectorValue.textContent = event.detail.value + "%";
    });
    electronStore.onChanged("readiumCSS.lineHeight", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue) * 100) : lineHeightSelectorDefault);
        lineHeightSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
const initPageMarginSelector = () => {
    const pageMarginsSelectorDefault = 100;
    const pageMarginsSelectorValue = document.getElementById("pageMarginsSelectorValue");
    const pageMarginsSelector = document.getElementById("pageMarginsSelector");
    const slider = new window.mdc.slider.MDCSlider(pageMarginsSelector);
    pageMarginsSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.pageMargins");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = pageMarginsSelectorDefault;
    }
    pageMarginsSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.pageMargins", "" + (event.detail.value / 100));
        pageMarginsSelectorValue.textContent = event.detail.value + "%";
    });
    electronStore.onChanged("readiumCSS.pageMargins", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue) * 100) : pageMarginsSelectorDefault);
        pageMarginsSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
const initTypeScaleSelector = () => {
    const typeScaleSelectorDefault = 120;
    const typeScaleSelectorValue = document.getElementById("typeScaleSelectorValue");
    const typeScaleSelector = document.getElementById("typeScaleSelector");
    const slider = new window.mdc.slider.MDCSlider(typeScaleSelector);
    typeScaleSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.typeScale");
    if (val) {
        slider.value = parseFloat(val) * 100;
    }
    else {
        slider.value = typeScaleSelectorDefault;
    }
    typeScaleSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.typeScale", "" + (event.detail.value / 100));
        typeScaleSelectorValue.textContent = event.detail.value + "%";
    });
    electronStore.onChanged("readiumCSS.typeScale", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue) * 100) : typeScaleSelectorDefault);
        typeScaleSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
const initLetterSpacingSelector = () => {
    const letterSpacingSelectorDefault = 0;
    const letterSpacingSelectorValue = document.getElementById("letterSpacingSelectorValue");
    const letterSpacingSelector = document.getElementById("letterSpacingSelector");
    const slider = new window.mdc.slider.MDCSlider(letterSpacingSelector);
    letterSpacingSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.letterSpacing");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = letterSpacingSelectorDefault;
    }
    letterSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.letterSpacing", (event.detail.value / 100) + "rem");
        letterSpacingSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.letterSpacing", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : letterSpacingSelectorDefault);
        letterSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
const initWordSpacingSelector = () => {
    const wordSpacingSelectorDefault = 0;
    const wordSpacingSelectorValue = document.getElementById("wordSpacingSelectorValue");
    const wordSpacingSelector = document.getElementById("wordSpacingSelector");
    const slider = new window.mdc.slider.MDCSlider(wordSpacingSelector);
    wordSpacingSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.wordSpacing");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = wordSpacingSelectorDefault;
    }
    wordSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.wordSpacing", (event.detail.value / 100) + "rem");
        wordSpacingSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.wordSpacing", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : wordSpacingSelectorDefault);
        wordSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
const initParaSpacingSelector = () => {
    const paraSpacingSelectorDefault = 0;
    const paraSpacingSelectorValue = document.getElementById("paraSpacingSelectorValue");
    const paraSpacingSelector = document.getElementById("paraSpacingSelector");
    const slider = new window.mdc.slider.MDCSlider(paraSpacingSelector);
    paraSpacingSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.paraSpacing");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = paraSpacingSelectorDefault;
    }
    paraSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.paraSpacing", (event.detail.value / 100) + "rem");
        paraSpacingSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.paraSpacing", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : paraSpacingSelectorDefault);
        paraSpacingSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
const initParaIndentSelector = () => {
    const paraIndentSelectorDefault = 200;
    const paraIndentSelectorValue = document.getElementById("paraIndentSelectorValue");
    const paraIndentSelector = document.getElementById("paraIndentSelector");
    const slider = new window.mdc.slider.MDCSlider(paraIndentSelector);
    paraIndentSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.paraIndent");
    if (val) {
        slider.value = parseFloat(val.replace("rem", "")) * 100;
    }
    else {
        slider.value = paraIndentSelectorDefault;
    }
    paraIndentSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        electronStore.set("readiumCSS.paraIndent", (event.detail.value / 100) + "rem");
        paraIndentSelectorValue.textContent = (event.detail.value / 100).toFixed(2) + "rem";
    });
    electronStore.onChanged("readiumCSS.paraIndent", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseFloat(newValue.replace("rem", "")) * 100) : paraIndentSelectorDefault);
        paraIndentSelectorValue.textContent = (slider.value / 100).toFixed(2) + "rem";
        refreshReadiumCSS();
    });
};
const initFontSizeSelector = () => {
    const fontSizeSelectorDefault = 100;
    const fontSizeSelectorValue = document.getElementById("fontSizeSelectorValue");
    const fontSizeSelector = document.getElementById("fontSizeSelector");
    const slider = new window.mdc.slider.MDCSlider(fontSizeSelector);
    fontSizeSelector.mdcSlider = slider;
    slider.disabled = !electronStore.get("readiumCSSEnable");
    const val = electronStore.get("readiumCSS.fontSize");
    if (val) {
        slider.value = parseInt(val.replace("%", ""), 10);
    }
    else {
        slider.value = fontSizeSelectorDefault;
    }
    fontSizeSelectorValue.textContent = slider.value + "%";
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.disabled = !newValue;
    });
    slider.listen("MDCSlider:change", (event) => {
        const percent = event.detail.value + "%";
        electronStore.set("readiumCSS.fontSize", percent);
        fontSizeSelectorValue.textContent = percent;
    });
    electronStore.onChanged("readiumCSS.fontSize", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        slider.value = (newValue ? (parseInt(newValue.replace("%", ""), 10)) : fontSizeSelectorDefault);
        fontSizeSelectorValue.textContent = slider.value + "%";
        refreshReadiumCSS();
    });
};
const initTextColorSelector = () => {
    initColorSelector("textColor", "Text colour");
};
const initBackgroundColorSelector = () => {
    initColorSelector("backgroundColor", "Background colour");
};
const initColorSelector = (who, label) => {
    const ID_PREFIX = who + "Select_";
    const options = [];
    options.push({
        id: ID_PREFIX,
        label: "default",
    });
    Object.keys(colours_1.HTML_COLORS).forEach((colorName) => {
        const colorCode = colours_1.HTML_COLORS[colorName];
        options.push({
            id: ID_PREFIX + colorName,
            label: colorName,
            style: `border: 10px solid ${colorCode};`,
        });
    });
    const currentColorCode = electronStore.get("readiumCSS." + who);
    let foundColorName;
    const colorNames = Object.keys(colours_1.HTML_COLORS);
    for (const colorName of colorNames) {
        const colorCode = colours_1.HTML_COLORS[colorName];
        if (currentColorCode === colorCode) {
            foundColorName = colorName;
            break;
        }
    }
    let selectedID = ID_PREFIX;
    if (foundColorName) {
        selectedID = ID_PREFIX + foundColorName;
    }
    const foundItem = options.find((item) => {
        return item.id === selectedID;
    });
    if (!foundItem) {
        selectedID = options[0].id;
    }
    const opts = {
        disabled: !electronStore.get("readiumCSSEnable"),
        label,
        options,
        selected: selectedID,
    };
    const tag = index_5.riotMountMenuSelect("#" + who + "Select", opts)[0];
    tag.on("selectionChanged", (index) => {
        if (!index) {
            electronStore.set("readiumCSS." + who, null);
            return;
        }
        const id = tag.getIdForIndex(index);
        if (!id) {
            return;
        }
        const colorName = id.replace(ID_PREFIX, "");
        const colorCode = colours_1.HTML_COLORS[colorName] || undefined;
        electronStore.set("readiumCSS." + who, colorCode);
    });
    function updateLabelColor(colorCode) {
        if (tag.root) {
            const labelText = tag.root.querySelector(".mdc-select__selected-text");
            if (labelText) {
                labelText.style.border = colorCode ? `6px solid ${colorCode}` : "none";
            }
        }
    }
    electronStore.onChanged("readiumCSS." + who, (newValue, oldValue) => {
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
        let foundColor;
        if (newValue) {
            const colNames = Object.keys(colours_1.HTML_COLORS);
            for (const colName of colNames) {
                const colCode = colours_1.HTML_COLORS[colName];
                if (newValue === colCode) {
                    foundColor = colName;
                    break;
                }
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
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
    updateLabelColor(electronStore.get("readiumCSS." + who));
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
        let id = tag.getIdForIndex(index);
        if (!id) {
            return;
        }
        id = id.replace(ID_PREFIX, "");
        electronStore.set("readiumCSS.font", id);
    });
    function updateLabelFont(newValue) {
        if (tag.root) {
            const label = tag.root.querySelector(".mdc-select__selected-text");
            if (label) {
                let fontFamily = newValue;
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
                    const idToFind = ID_PREFIX + newValue;
                    const optionFound = options.find((item) => {
                        return item.id === idToFind;
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
    electronStore.onChanged("readiumCSS.font", (newValue, oldValue) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(ID_PREFIX + newValue);
        updateLabelFont(newValue);
        refreshReadiumCSS();
    });
    electronStore.onChanged("readiumCSSEnable", (newValue, oldValue) => {
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
                if (sysFont.startsWith(".")) {
                    return;
                }
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
        updateLabelFont(electronStore.get("readiumCSS.font"));
    }), 100);
};
window.addEventListener("DOMContentLoaded", () => {
    drag_drop_1.setupDragDrop();
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
    const nightSwitchEl = document.getElementById("night_switch");
    const nightSwitch = new window.mdc.switchControl.MDCSwitch(nightSwitchEl);
    nightSwitchEl.mdcSwitch = nightSwitch;
    nightSwitch.checked = electronStore.get("readiumCSS.night");
    const nightDiv = document.getElementById("night_div");
    nightDiv.style.display = nightSwitch.checked ? "block" : "none";
    nightSwitchEl.addEventListener("change", (_event) => {
        const checked = nightSwitch.checked;
        electronStore.set("readiumCSS.night", checked);
    });
    nightSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const sepiaSwitchEl = document.getElementById("sepia_switch");
    const sepiaSwitch = new window.mdc.switchControl.MDCSwitch(sepiaSwitchEl);
    sepiaSwitchEl.mdcSwitch = sepiaSwitch;
    sepiaSwitch.checked = electronStore.get("readiumCSS.sepia");
    sepiaSwitchEl.addEventListener("change", (_event) => {
        const checked = sepiaSwitch.checked;
        electronStore.set("readiumCSS.sepia", checked);
    });
    sepiaSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const invertSwitchEl = document.getElementById("invert_switch");
    const invertSwitch = new window.mdc.switchControl.MDCSwitch(invertSwitchEl);
    invertSwitchEl.mdcSwitch = invertSwitch;
    invertSwitch.checked = electronStore.get("readiumCSS.invert");
    invertSwitchEl.addEventListener("change", (_event) => {
        const checked = invertSwitch.checked;
        electronStore.set("readiumCSS.invert", checked);
    });
    invertSwitch.disabled = !nightSwitch.checked || !electronStore.get("readiumCSSEnable");
    const darkenSwitchEl = document.getElementById("darken_switch");
    const darkenSwitch = new window.mdc.switchControl.MDCSwitch(darkenSwitchEl);
    darkenSwitchEl.mdcSwitch = darkenSwitch;
    darkenSwitch.checked = electronStore.get("readiumCSS.darken");
    darkenSwitchEl.addEventListener("change", (_event) => {
        const checked = darkenSwitch.checked;
        electronStore.set("readiumCSS.darken", checked);
    });
    darkenSwitch.disabled = !nightSwitch.checked || !electronStore.get("readiumCSSEnable");
    const justifySwitchEl = document.getElementById("justify_switch");
    const justifySwitch = new window.mdc.switchControl.MDCSwitch(justifySwitchEl);
    justifySwitchEl.mdcSwitch = justifySwitch;
    justifySwitch.checked = electronStore.get("readiumCSS.textAlign") === "justify";
    justifySwitchEl.addEventListener("change", (_event) => {
        const checked = justifySwitch.checked;
        electronStore.set("readiumCSS.textAlign", checked ? "justify" : "initial");
    });
    justifySwitch.disabled = !electronStore.get("readiumCSSEnable");
    const footnotesSwitchEl = document.getElementById("footnotes_switch");
    const footnotesSwitch = new window.mdc.switchControl.MDCSwitch(footnotesSwitchEl);
    footnotesSwitchEl.mdcSwitch = footnotesSwitch;
    footnotesSwitch.checked = electronStore.get("readiumCSS.noFootnotes") ? false : true;
    footnotesSwitchEl.addEventListener("change", (_event) => {
        const checked = footnotesSwitch.checked;
        electronStore.set("readiumCSS.noFootnotes", checked ? false : true);
    });
    footnotesSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const reduceMotionSwitchEl = document.getElementById("reduceMotion_switch");
    const reduceMotionSwitch = new window.mdc.switchControl.MDCSwitch(reduceMotionSwitchEl);
    reduceMotionSwitchEl.mdcSwitch = reduceMotionSwitch;
    reduceMotionSwitch.checked = electronStore.get("readiumCSS.reduceMotion") ? true : false;
    reduceMotionSwitchEl.addEventListener("change", (_event) => {
        const checked = reduceMotionSwitch.checked;
        electronStore.set("readiumCSS.reduceMotion", checked ? true : false);
    });
    reduceMotionSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const paginateSwitchEl = document.getElementById("paginate_switch");
    const paginateSwitch = new window.mdc.switchControl.MDCSwitch(paginateSwitchEl);
    paginateSwitchEl.mdcSwitch = paginateSwitch;
    paginateSwitch.checked = electronStore.get("readiumCSS.paged");
    paginateSwitchEl.addEventListener("change", (_event) => {
        const checked = paginateSwitch.checked;
        electronStore.set("readiumCSS.paged", checked);
        const colCountRadiosEl = document.getElementById("colCountRadios");
        if (checked) {
            colCountRadiosEl.style.display = "block";
        }
        else {
            colCountRadiosEl.style.display = "none";
        }
    });
    paginateSwitch.disabled = !electronStore.get("readiumCSSEnable");
    const colCountRadiosElem = document.getElementById("colCountRadios");
    if (paginateSwitch.checked) {
        colCountRadiosElem.style.display = "block";
    }
    else {
        colCountRadiosElem.style.display = "none";
    }
    const radioColCountAutoEl = document.getElementById("radioColCountAuto");
    radioColCountAutoEl.checked = electronStore.get("readiumCSS.colCount") === "auto";
    radioColCountAutoEl.addEventListener("change", () => {
        if (radioColCountAutoEl.checked) {
            electronStore.set("readiumCSS.colCount", "auto");
        }
    });
    const radioColCount1El = document.getElementById("radioColCount1");
    radioColCount1El.checked = electronStore.get("readiumCSS.colCount") === "1";
    radioColCount1El.addEventListener("change", () => {
        if (radioColCount1El.checked) {
            electronStore.set("readiumCSS.colCount", "1");
        }
    });
    const radioColCount2El = document.getElementById("radioColCount2");
    radioColCount2El.checked = electronStore.get("readiumCSS.colCount") === "2";
    radioColCount2El.addEventListener("change", () => {
        if (radioColCount2El.checked) {
            electronStore.set("readiumCSS.colCount", "2");
        }
    });
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
        setTimeout(() => {
            snackBar.labelText = `Link URLs now ${checked ? "shown" : "hidden"}.`;
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    const debugSwitchEl = document.getElementById("visual_debug_switch");
    const debugSwitch = new window.mdc.switchControl.MDCSwitch(debugSwitchEl);
    debugSwitchEl.mdcSwitch = debugSwitch;
    debugSwitch.checked = electronStore.get("visualDebug");
    debugSwitchEl.addEventListener("change", (_event) => {
        const checked = debugSwitch.checked;
        electronStore.set("visualDebug", checked);
        setTimeout(() => {
            snackBar.labelText = `Visual debugging now ${checked ? "enabled" : "disabled"}.`;
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    const snackBarElem = document.getElementById("snackbar");
    snackBar = new window.mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBarElem.mdcSnackbar = snackBar;
    const selectElement = document.getElementById("nav-select");
    const navSelector = new window.mdc.select.MDCSelect(selectElement);
    selectElement.mdcSelect = navSelector;
    navSelector.listen("MDCSelect:change", (ev) => {
        const activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        const newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.index + 1) + ")");
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
    const positionSelector = document.getElementById("positionSelector");
    const slider = new window.mdc.slider.MDCSlider(positionSelector);
    positionSelector.mdcSlider = slider;
    slider.listen("MDCSlider:change", (_event) => {
        onChangeReadingProgressionSlider();
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
        electronStore.set("bookmarks", {});
        drawer.open = false;
        setTimeout(() => {
            snackBar.labelText = "Reading locations / bookmarks reset.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    const buttonClearSettings = document.getElementById("buttonClearSettings");
    buttonClearSettings.addEventListener("click", () => {
        electronStore.set(undefined, electronStore.getDefaults());
        drawer.open = false;
        setTimeout(() => {
            snackBar.labelText = "Settings reset.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    const buttonClearSettingsStyle = document.getElementById("buttonClearSettingsStyle");
    buttonClearSettingsStyle.addEventListener("click", () => {
        electronStore.set("readiumCSS", electronStore.getDefaults().readiumCSS);
    });
    const buttonOpenSettings = document.getElementById("buttonOpenSettings");
    buttonOpenSettings.addEventListener("click", () => {
        if (electronStore.reveal) {
            electronStore.reveal();
        }
    });
    const buttonOpenLcpSettings = document.getElementById("buttonOpenLcpSettings");
    buttonOpenLcpSettings.addEventListener("click", () => {
        if (electronStoreLCP.reveal) {
            electronStoreLCP.reveal();
        }
        electron_1.ipcRenderer.send("R2_EVENT_LCP_LSD_OPEN_SETTINGS");
    });
    const buttonLSDRenew = document.getElementById("buttonLSDRenew");
    buttonLSDRenew.addEventListener("click", () => {
        const payload = {
            endDateStr: undefined,
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RENEW, payload);
        drawer.open = false;
        setTimeout(() => {
            snackBar.labelText = "LCP LSD renew message sent.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    const buttonLSDReturn = document.getElementById("buttonLSDReturn");
    buttonLSDReturn.addEventListener("click", () => {
        const payload = {
            publicationFilePath: pathDecoded,
        };
        electron_1.ipcRenderer.send(events_1.R2_EVENT_LCP_LSD_RETURN, payload);
        drawer.open = false;
        setTimeout(() => {
            snackBar.labelText = "LCP LSD return message sent.";
            snackBar.actionButtonText = "OK";
            snackBar.open();
        }, 500);
    });
    document.querySelectorAll("#tabsPanels .mdc-switch__native-control").forEach((elem) => {
        elem.addEventListener("focusin", (ev) => {
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-fg-scale", "1.7");
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-fg-size", "28px");
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-left", "10px");
            ev.target.parentElement.parentElement.style.setProperty("--mdc-ripple-top", "10px");
            ev.target.parentElement.parentElement.parentElement.parentElement.classList.add("keyboardfocus");
        });
        elem.addEventListener("focusout", (ev) => {
            ev.target.parentElement.parentNode.parentNode.parentNode.classList.remove("keyboardfocus");
        });
    });
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RENEW_RES, (_event, payload) => {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(payload.okay);
    console.log(payload.error);
    console.log(payload.lsd);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LCP_LSD_RETURN_RES, (_event, payload) => {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(payload.okay);
    console.log(payload.error);
    console.log(payload.lsd);
});
function startNavigatorExperiment() {
    const drawerButton = document.getElementById("drawerButton");
    drawerButton.focus();
    (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let response;
        try {
            response = yield fetch(publicationJsonUrl_);
        }
        catch (e) {
            console.log(e);
            console.log(publicationJsonUrl_);
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
        _publication = ta_json_x_1.JSON.deserialize(_publicationJSON, publication_1.Publication);
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
                h1.setAttribute("title", title);
            }
        }
        initBookmarksFromStore();
        const buttonBookmarkTOGGLE = document.getElementById("bookmarkTOGGLE");
        buttonBookmarkTOGGLE.addEventListener("MDCIconButtonToggle:change", (_event) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (event.detail.isOn) {
                addCurrentVisibleBookmark();
            }
            else {
                try {
                    const removed = yield removeAllCurrentVisibleBookmarks();
                    console.log("removed bookmarks:");
                    removed.forEach((bookmark) => {
                        console.log(JSON.stringify(bookmark, null, 4));
                    });
                }
                catch (err) {
                    console.log(err);
                }
            }
            visualDebugBookmarks();
            refreshBookmarksStore();
        }));
        const mdcButtonBookmarkTOGGLE = new window.mdc.iconButton.MDCIconButtonToggle(buttonBookmarkTOGGLE);
        buttonBookmarkTOGGLE.mdcButton = mdcButtonBookmarkTOGGLE;
        const buttonttsPLAYPAUSE = document.getElementById("ttsPLAYPAUSE");
        buttonttsPLAYPAUSE.addEventListener("MDCIconButtonToggle:change", (event) => {
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
        const mdcButtonttsPLAYPAUSE = new window.mdc.iconButton.MDCIconButtonToggle(buttonttsPLAYPAUSE);
        buttonttsPLAYPAUSE.mdcButton = mdcButtonttsPLAYPAUSE;
        const buttonttsSTOP = document.getElementById("ttsSTOP");
        buttonttsSTOP.addEventListener("click", (_event) => {
            index_1.ttsStop();
        });
        const buttonttsNEXT = document.getElementById("ttsNEXT");
        buttonttsNEXT.addEventListener("click", (_event) => {
            index_1.ttsNext();
        });
        const buttonttsPREVIOUS = document.getElementById("ttsPREVIOUS");
        buttonttsPREVIOUS.addEventListener("click", (_event) => {
            index_1.ttsPrevious();
        });
        const buttonttsTOGGLE = document.getElementById("ttsTOGGLE");
        buttonttsTOGGLE.addEventListener("MDCIconButtonToggle:change", (_event) => {
            ttsEnableToggle();
        });
        const mdcButtonttsTOGGLE = new window.mdc.iconButton.MDCIconButtonToggle(buttonttsTOGGLE);
        buttonttsTOGGLE.mdcButton = mdcButtonttsTOGGLE;
        let _ttsState;
        refreshTtsUiState();
        index_1.ttsListen((ttsState) => {
            if (!_ttsEnabled) {
                return;
            }
            _ttsState = ttsState;
            refreshTtsUiState();
        });
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
        let _ttsEnabled = false;
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
        const buttonNavLeft = document.getElementById("buttonNavLeft");
        buttonNavLeft.addEventListener("click", (_event) => {
            index_1.navLeftOrRight(true);
        });
        const buttonNavRight = document.getElementById("buttonNavRight");
        buttonNavRight.addEventListener("click", (_event) => {
            index_1.navLeftOrRight(false);
        });
        const onWheel = throttle((ev) => {
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
        const FAKE_URL = "https://dummy.me/";
        const optsBookmarks = {
            basic: electronStore.get("basicLinkTitles"),
            handleLink: (href) => {
                href = href.substr(FAKE_URL.length);
                const fragToken = "#r2loc(";
                const i = href.indexOf(fragToken);
                if (i > 0) {
                    const j = i + fragToken.length;
                    const cssSelector = href.substr(j, href.length - j - 1);
                    href = href.substr(0, i);
                    const locator = {
                        href,
                        locations: {
                            cssSelector,
                        },
                    };
                    handleLinkLocator_(locator);
                }
            },
            linksgroup: [],
            url: FAKE_URL,
        };
        const tagBookmarks = index_3.riotMountLinkListGroup("#reader_controls_BOOKMARKS", optsBookmarks)[0];
        electronStore.onChanged("basicLinkTitles", (newValue, oldValue) => {
            if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                return;
            }
            tagBookmarks.setBasic(newValue);
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
            let foundLink;
            if (_publication && location) {
                if (_publication.Spine) {
                    foundLink = _publication.Spine.find((link) => {
                        return typeof location !== "undefined" &&
                            link.Href === location.href;
                    });
                }
                if (!foundLink && _publication.Resources) {
                    foundLink = _publication.Resources.find((link) => {
                        return typeof location !== "undefined" &&
                            link.Href === location.href;
                    });
                }
            }
            const locatorExtended = location ? {
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
    }))();
}
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
function handleLinkLocator_(locator) {
    if (drawer.open) {
        drawer.open = false;
        setTimeout(() => {
            index_1.handleLinkLocator(locator);
        }, 200);
    }
    else {
        index_1.handleLinkLocator(locator);
    }
}
//# sourceMappingURL=index.js.map