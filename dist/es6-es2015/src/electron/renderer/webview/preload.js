"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debounce = require("debounce");
const ResizeSensor = require("resize-sensor/ResizeSensor");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const animateProperty_1 = require("../common/animateProperty");
const cssselector_1 = require("../common/cssselector");
const easings_1 = require("../common/easings");
const querystring_1 = require("../common/querystring");
const readium_css_1 = require("./readium-css");
const win = global.window;
let queryParams = win.location.search ? querystring_1.getURLQueryParams(win.location.search) : undefined;
let _hashElement;
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, (_event, messageString) => {
    const messageJson = JSON.parse(messageString);
    if (!queryParams) {
        queryParams = {};
    }
    if (messageJson.previous) {
        queryParams["readiumprevious"] = "true";
    }
    else {
        if (typeof queryParams["readiumprevious"] !== "undefined") {
            delete queryParams["readiumprevious"];
        }
    }
    if (messageJson.goto) {
        queryParams["readiumgoto"] = "true";
    }
    else {
        if (typeof queryParams["readiumgoto"] !== "undefined") {
            delete queryParams["readiumgoto"];
        }
    }
    if (messageJson.hash) {
        _hashElement = win.document.getElementById(messageJson.hash);
    }
    else {
        _hashElement = null;
    }
    _readyEventSent = false;
    _locationHashOverride = undefined;
    scrollToHashRaw(false);
});
let _lastAnimState;
electron_1.ipcRenderer.on(events_1.R2_EVENT_PAGE_TURN, (_event, messageString) => {
    if (!win.document.body) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, messageString);
        return;
    }
    const isPaged = win.document.documentElement.classList.contains("readium-paginated");
    const maxHeightShift = isPaged ?
        ((readium_css_1.isVerticalWritingMode() ?
            (win.document.body.scrollHeight - win.document.documentElement.offsetHeight) :
            (win.document.body.scrollWidth - win.document.documentElement.offsetWidth))) :
        ((readium_css_1.isVerticalWritingMode() ?
            (win.document.body.scrollWidth - win.document.documentElement.clientWidth) :
            (win.document.body.scrollHeight - win.document.documentElement.clientHeight)));
    const messageJson = JSON.parse(messageString);
    const goPREVIOUS = messageJson.go === "PREVIOUS";
    if (!goPREVIOUS) {
        if (isPaged) {
            if (Math.abs(win.document.body.scrollLeft) < maxHeightShift) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = win.document.body.scrollLeft +
                    (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.offsetWidth;
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, "scrollLeft", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) < maxHeightShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) < maxHeightShift)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft +
                        (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop +
                        win.document.documentElement.clientHeight);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            if (Math.abs(win.document.body.scrollLeft) > 0) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = win.document.body.scrollLeft -
                    (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.offsetWidth;
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, "scrollLeft", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) > 0)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft -
                        (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop -
                        win.document.documentElement.clientHeight);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, messageString);
});
const checkReadyPass = () => {
    if (_readyPassDone) {
        return;
    }
    _readyPassDone = true;
    if (readium_css_1.DEBUG_VISUALS) {
        if (_hashElement) {
            _hashElement.classList.add("readium2-read-pos");
        }
    }
    win.addEventListener("resize", () => {
        scrollToHashRaw(false);
    });
    setTimeout(() => {
        scrollToHashRaw(true);
        win.addEventListener("scroll", (_ev) => {
            if (_ignoreScrollEvent) {
                _ignoreScrollEvent = false;
                return;
            }
            const x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
            processXY(x, 0);
        });
    }, 800);
    const useResizeSensor = true;
    if (useResizeSensor && win.document.body) {
        setTimeout(() => {
            window.requestAnimationFrame((_timestamp) => {
                new ResizeSensor(win.document.body, () => {
                    console.log("ResizeSensor");
                    scrollToHash();
                });
            });
        }, 2000);
    }
    if (win.document.body) {
        win.document.body.addEventListener("click", (ev) => {
            const x = ev.clientX;
            const y = ev.clientY;
            processXY(x, y);
        });
    }
};
const notifyReady = () => {
    if (_readyEventSent) {
        return;
    }
    _readyEventSent = true;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_WEBVIEW_READY, win.location.href);
};
function scrollIntoView(element) {
    if (!win.document.body) {
        return;
    }
    let colIndex = (element.offsetTop + (readium_css_1.isRTL() ? -20 : +20)) / win.document.body.scrollHeight;
    colIndex = Math.ceil(colIndex);
    const isTwoPage = win.document.documentElement.offsetWidth > win.document.body.offsetWidth;
    const spreadIndex = isTwoPage ? Math.ceil(colIndex / 2) : colIndex;
    const left = ((spreadIndex - 1) * win.document.documentElement.offsetWidth);
    win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * left;
}
const scrollToHashRaw = (firstCall) => {
    const isPaged = win.document.documentElement.classList.contains("readium-paginated");
    if (_locationHashOverride) {
        if (_locationHashOverride === win.document.body) {
            console.log("body...");
            return;
        }
        notifyReady();
        notifyReadingLocation();
        _ignoreScrollEvent = true;
        if (isPaged) {
            scrollIntoView(_locationHashOverride);
        }
        else {
            _locationHashOverride.scrollIntoView({
                behavior: "instant",
                block: "start",
                inline: "start",
            });
        }
        return;
    }
    else if (_hashElement) {
        console.log("_hashElement");
        _locationHashOverride = _hashElement;
        notifyReady();
        notifyReadingLocation();
        if (!firstCall) {
            _ignoreScrollEvent = true;
            if (isPaged) {
                scrollIntoView(_hashElement);
            }
            else {
                _hashElement.scrollIntoView({
                    behavior: "instant",
                    block: "start",
                    inline: "start",
                });
            }
        }
        return;
    }
    else {
        if (win.document.body) {
            if (queryParams) {
                const previous = queryParams["readiumprevious"];
                const isPreviousNavDirection = previous === "true";
                if (isPreviousNavDirection) {
                    console.log("readiumprevious");
                    const maxHeightShift = isPaged ?
                        ((readium_css_1.isVerticalWritingMode() ?
                            (win.document.body.scrollHeight - win.document.documentElement.offsetHeight) :
                            (win.document.body.scrollWidth - win.document.documentElement.offsetWidth))) :
                        ((readium_css_1.isVerticalWritingMode() ?
                            (win.document.body.scrollWidth - win.document.documentElement.clientWidth) :
                            (win.document.body.scrollHeight - win.document.documentElement.clientHeight)));
                    _ignoreScrollEvent = true;
                    if (isPaged) {
                        if (readium_css_1.isVerticalWritingMode()) {
                            win.document.body.scrollLeft = 0;
                            win.document.body.scrollTop = maxHeightShift;
                        }
                        else {
                            win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxHeightShift;
                            win.document.body.scrollTop = 0;
                        }
                    }
                    else {
                        if (readium_css_1.isVerticalWritingMode()) {
                            win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxHeightShift;
                            win.document.body.scrollTop = 0;
                        }
                        else {
                            win.document.body.scrollLeft = 0;
                            win.document.body.scrollTop = maxHeightShift;
                        }
                    }
                    _locationHashOverride = undefined;
                    _locationHashOverrideCSSselector = undefined;
                    processXYRaw(0, (isPaged ?
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.offsetWidth :
                            win.document.documentElement.offsetHeight) :
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.clientWidth :
                            win.document.documentElement.clientHeight))
                        - 1);
                    console.log("BOTTOM (previous):");
                    console.log(_locationHashOverride);
                    notifyReady();
                    notifyReadingLocation();
                    return;
                }
                let gotoCssSelector = queryParams["readiumgoto"];
                if (gotoCssSelector) {
                    gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");
                    let selected = null;
                    try {
                        selected = document.querySelector(gotoCssSelector);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    if (selected) {
                        _locationHashOverride = selected;
                        _locationHashOverrideCSSselector = gotoCssSelector;
                        notifyReady();
                        notifyReadingLocation();
                        _ignoreScrollEvent = true;
                        if (isPaged) {
                            scrollIntoView(selected);
                        }
                        else {
                            selected.scrollIntoView({
                                behavior: "instant",
                                block: "start",
                                inline: "start",
                            });
                        }
                        return;
                    }
                }
            }
            console.log("_locationHashOverride = win.document.body");
            _locationHashOverride = win.document.body;
            _locationHashOverrideCSSselector = undefined;
            _ignoreScrollEvent = true;
            win.document.body.scrollLeft = 0;
            win.document.body.scrollTop = 0;
        }
    }
    notifyReady();
    notifyReadingLocation();
};
const scrollToHash = debounce(() => {
    scrollToHashRaw(false);
}, 500);
let _ignoreScrollEvent = false;
let _locationHashOverride;
let _locationHashOverrideCSSselector;
let _readyPassDone = false;
let _readyEventSent = false;
const resetInitialState = () => {
    _locationHashOverride = undefined;
    _readyPassDone = false;
    _readyEventSent = false;
};
win.addEventListener("load", () => {
    checkReadyPass();
});
win.addEventListener("DOMContentLoaded", () => {
    if (win.location.hash && win.location.hash.length > 1) {
        _hashElement = win.document.getElementById(win.location.hash.substr(1));
    }
    resetInitialState();
    readium_css_1.injectDefaultCSS();
    if (readium_css_1.DEBUG_VISUALS) {
        readium_css_1.injectReadPosCSS();
    }
    win.document.body.addEventListener("focusin", (ev) => {
        const isPaged = win.document.documentElement.classList.contains("readium-paginated");
        if (isPaged) {
            setTimeout(() => {
                _locationHashOverride = ev.target;
                scrollIntoView(ev.target);
            }, 30);
        }
    });
    win.document.addEventListener("click", (e) => {
        const href = e.target.href;
        if (!href) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, href);
        return false;
    }, true);
    try {
        if (queryParams) {
            const base64 = queryParams["readiumcss"];
            if (base64) {
                const str = window.atob(base64);
                const messageJson = JSON.parse(str);
                readium_css_1.readiumCSS(messageJson);
            }
        }
    }
    catch (err) {
        console.log(err);
    }
});
const processXYRaw = (x, y) => {
    let element;
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
        const node = range.startContainer;
        if (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                element = node;
            }
            else if (node.nodeType === Node.TEXT_NODE) {
                if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                    element = node.parentNode;
                }
            }
        }
    }
    if (readium_css_1.DEBUG_VISUALS) {
        const existings = document.querySelectorAll(".readium2-read-pos, .readium2-read-pos2");
        existings.forEach((existing) => {
            existing.classList.remove("readium2-read-pos");
            existing.classList.remove("readium2-read-pos2");
        });
    }
    if (element) {
        _locationHashOverride = element;
        notifyReadingLocation();
        if (readium_css_1.DEBUG_VISUALS) {
            element.classList.add("readium2-read-pos2");
        }
    }
};
const processXY = debounce((x, y) => {
    processXYRaw(x, y);
}, 300);
const notifyReadingLocation = () => {
    if (!_locationHashOverride) {
        return;
    }
    if (readium_css_1.DEBUG_VISUALS) {
        _locationHashOverride.classList.add("readium2-read-pos");
    }
    _locationHashOverrideCSSselector = cssselector_1.fullQualifiedSelector(_locationHashOverride, false);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, _locationHashOverrideCSSselector);
};
//# sourceMappingURL=preload.js.map