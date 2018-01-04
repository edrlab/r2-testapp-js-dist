"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const win = global.window;
const urlRootReadiumCSS = win.location.origin + "/readium-css/iOS/";
exports.DEBUG_VISUALS = false;
const focusCssStyles = `
*:focus {
outline-style: solid !important;
outline-width: 2px !important;
outline-color: blue !important;
outline-offset: 0px !important;
}
*.no-focus-outline:focus {
outline-style: none !important;
}
`;
const selectionCssStyles = `
::selection {
background-color: rgb(155, 179, 240) !important;
color: black !important;
}

:root.mdc-theme--dark ::selection {
background-color: rgb(100, 122, 177) !important;
color: white !important;
}
/*
.readium2-hash {
    color: black !important;
    background-color: rgb(185, 207, 255) !important;
}
:root.mdc-theme--dark .readium2-hash {
    color: white !important;
    background-color: rgb(67, 64, 125) !important;
}
*/
`;
const scrollBarCssStyles = `
::-webkit-scrollbar-button {
height: 0px !important;
width: 0px !important;
}

::-webkit-scrollbar-corner {
background: transparent !important;
}

/*::-webkit-scrollbar-track-piece {
background-color: red;
} */

::-webkit-scrollbar {
width:  14px;
height: 14px;
}

::-webkit-scrollbar-thumb {
background: #727272;
background-clip: padding-box !important;
border: 3px solid transparent !important;
border-radius: 30px;
}

::-webkit-scrollbar-thumb:hover {
background: #4d4d4d;
}

::-webkit-scrollbar-track {
box-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);
background: #dddddd;
box-sizing: content-box;
}

::-webkit-scrollbar-track:horizontal {
border-top: 1px solid silver;
}
::-webkit-scrollbar-track:vertical {
border-left: 1px solid silver;
}

:root.mdc-theme--dark ::-webkit-scrollbar-thumb {
background: #a4a4a4;
border: 3px solid #545454;
}

:root.mdc-theme--dark ::-webkit-scrollbar-thumb:hover {
background: #dedede;
}

:root.mdc-theme--dark ::-webkit-scrollbar-track {
background: #545454;
}

:root.mdc-theme--dark ::-webkit-scrollbar-track:horizontal {
border-top: 1px solid black;
}
:root.mdc-theme--dark ::-webkit-scrollbar-track:vertical {
border-left: 1px solid black;
}`;
const readPosCssStyles = `
:root[style*="readium-sepia-on"] .readium2-read-pos,
:root[style*="readium-night-on"] .readium2-read-pos,
.readium2-read-pos {
    color: red !important;
    background-color: silver !important;
}
:root[style*="readium-sepia-on"] .readium2-read-pos2,
:root[style*="readium-night-on"] .readium2-read-pos2,
.readium2-read-pos2 {
    color: blue !important;
    background-color: yellow !important;
}`;
exports.injectDefaultCSS = () => {
    appendCSSInline("electron-selection", selectionCssStyles);
    appendCSSInline("electron-focus", focusCssStyles);
    appendCSSInline("electron-scrollbars", scrollBarCssStyles);
};
exports.injectReadPosCSS = () => {
    if (!exports.DEBUG_VISUALS) {
        return;
    }
    appendCSSInline("electron-readPos", readPosCssStyles);
};
let _isVerticalWritingMode = false;
function isVerticalWritingMode() {
    return _isVerticalWritingMode;
}
exports.isVerticalWritingMode = isVerticalWritingMode;
let _isRTL = false;
function isRTL() {
    return _isRTL;
}
exports.isRTL = isRTL;
function computeVerticalRTL() {
    let dirAttr = win.document.documentElement.getAttribute("dir");
    if (dirAttr === "rtl") {
        _isRTL = true;
    }
    if (!_isRTL && win.document.body) {
        dirAttr = win.document.body.getAttribute("dir");
        if (dirAttr === "rtl") {
            _isRTL = true;
        }
    }
    const htmlStyle = window.getComputedStyle(win.document.documentElement);
    if (htmlStyle) {
        let prop = htmlStyle.getPropertyValue("writing-mode");
        if (!prop) {
            prop = htmlStyle.getPropertyValue("-epub-writing-mode");
        }
        if (prop && prop.indexOf("vertical") >= 0) {
            _isVerticalWritingMode = true;
        }
        if (prop && prop.indexOf("-rl") > 0) {
            _isRTL = true;
        }
        if (!_isRTL) {
            prop = htmlStyle.getPropertyValue("direction");
            if (prop && prop.indexOf("rtl") >= 0) {
                _isRTL = true;
            }
        }
    }
    if ((!_isVerticalWritingMode || !_isRTL) && win.document.body) {
        const bodyStyle = window.getComputedStyle(win.document.body);
        if (bodyStyle) {
            let prop;
            if (!_isVerticalWritingMode) {
                prop = bodyStyle.getPropertyValue("writing-mode");
                if (!prop) {
                    prop = bodyStyle.getPropertyValue("-epub-writing-mode");
                }
                if (prop && prop.indexOf("vertical") >= 0) {
                    _isVerticalWritingMode = true;
                }
                if (prop && prop.indexOf("-rl") > 0) {
                    _isRTL = true;
                }
            }
            if (!_isRTL) {
                prop = htmlStyle.getPropertyValue("direction");
                if (prop && prop.indexOf("rtl") >= 0) {
                    _isRTL = true;
                }
            }
        }
    }
    console.log("_isVerticalWritingMode: " + _isVerticalWritingMode);
    console.log("_isRTL: " + _isRTL);
}
win.addEventListener("load", () => {
    computeVerticalRTL();
});
const ensureHead = () => {
    const docElement = win.document.documentElement;
    if (!win.document.head) {
        const headElement = win.document.createElement("head");
        if (win.document.body) {
            docElement.insertBefore(headElement, win.document.body);
        }
        else {
            docElement.appendChild(headElement);
        }
    }
};
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, (_event, messageString) => {
    const messageJson = JSON.parse(messageString);
    exports.readiumCSS(messageJson);
});
function readiumCSSInject(messageJson) {
    if (typeof messageJson.injectCSS === "undefined") {
        return;
    }
    const docElement = win.document.documentElement;
    ensureHead();
    const remove = (typeof messageJson.injectCSS === "string" && messageJson.injectCSS.indexOf("rollback") >= 0)
        || !messageJson.injectCSS;
    if (remove) {
        docElement.removeAttribute("data-readiumcss");
        removeAllCSS();
        removeAllCSSInline();
        return;
    }
    if (!docElement.hasAttribute("data-readiumcss")) {
        docElement.setAttribute("data-readiumcss", "yes");
        let needsDefaultCSS = true;
        if (win.document.head && win.document.head.childElementCount) {
            let elem = win.document.head.firstElementChild;
            while (elem) {
                if ((elem.localName && elem.localName.toLowerCase() === "style") ||
                    (elem.getAttribute &&
                        (elem.getAttribute("rel") === "stylesheet" ||
                            elem.getAttribute("type") === "text/css" ||
                            (elem.getAttribute("src") &&
                                elem.getAttribute("src").endsWith(".css"))))) {
                    needsDefaultCSS = false;
                    break;
                }
                elem = elem.nextElementSibling;
            }
        }
        if (needsDefaultCSS && win.document.body) {
            const styleAttr = win.document.body.querySelector("*[style]");
            if (styleAttr) {
                needsDefaultCSS = false;
            }
        }
        appendCSS("before");
        if (needsDefaultCSS) {
            appendCSS("default");
        }
        appendCSS("after");
    }
}
function readiumCSSSet(messageJson) {
    if (typeof messageJson.setCSS === "undefined") {
        return;
    }
    const docElement = win.document.documentElement;
    const remove = (typeof messageJson.setCSS === "string" && messageJson.setCSS.indexOf("rollback") >= 0)
        || !messageJson.setCSS;
    if (remove) {
        docElement.style.overflow = "auto";
        const toRemove = [];
        for (let i = 0; i < docElement.style.length; i++) {
            const item = docElement.style.item(i);
            if (item.indexOf("--USER__") === 0) {
                toRemove.push(item);
            }
        }
        toRemove.forEach((item) => {
            docElement.style.removeProperty(item);
        });
        docElement.classList.remove("mdc-theme--dark");
    }
    else {
        let dark = false;
        let night = false;
        let sepia = false;
        let invert = false;
        let paged = false;
        let font;
        let fontSize;
        let lineHeight;
        let colCount;
        let align;
        if (typeof messageJson.setCSS === "object") {
            if (messageJson.setCSS.dark) {
                dark = true;
            }
            if (messageJson.setCSS.night) {
                night = true;
            }
            if (messageJson.setCSS.sepia) {
                sepia = true;
            }
            if (messageJson.setCSS.invert) {
                invert = true;
            }
            if (messageJson.setCSS.paged) {
                paged = true;
            }
            if (typeof messageJson.setCSS.font === "string") {
                font = messageJson.setCSS.font;
            }
            if (typeof messageJson.setCSS.fontSize === "string") {
                fontSize = messageJson.setCSS.fontSize;
            }
            if (typeof messageJson.setCSS.lineHeight === "string") {
                lineHeight = messageJson.setCSS.lineHeight;
            }
            if (typeof messageJson.setCSS.colCount === "string") {
                colCount = messageJson.setCSS.colCount;
            }
            if (typeof messageJson.setCSS.align === "string") {
                align = messageJson.setCSS.align;
            }
        }
        if (night) {
            docElement.classList.add("mdc-theme--dark");
        }
        else {
            docElement.classList.remove("mdc-theme--dark");
        }
        const needsAdvanced = true;
        docElement.style.setProperty("--USER__advancedSettings", needsAdvanced ? "readium-advanced-on" : "readium-advanced-off");
        docElement.style.setProperty("--USER__darkenFilter", dark ? "readium-darken-on" : "readium-darken-off");
        docElement.style.setProperty("--USER__invertFilter", invert ? "readium-invert-on" : "readium-invert-off");
        docElement.style.setProperty("--USER__appearance", sepia ? "readium-sepia-on" : (night ? "readium-night-on" : "readium-default-on"));
        docElement.style.setProperty("--USER__view", paged ? "readium-paged-on" : "readium-scroll-on");
        if (paged) {
            docElement.style.overflow = "hidden";
            docElement.classList.add("readium-paginated");
        }
        else {
            docElement.classList.remove("readium-paginated");
        }
        const needsFontOverride = typeof font !== "undefined" && font !== "DEFAULT";
        docElement.style.setProperty("--USER__fontOverride", needsFontOverride ? "readium-font-on" : "readium-font-off");
        docElement.style.setProperty("--USER__fontFamily", !needsFontOverride ? "" :
            (font === "DYS" ? "AccessibleDfa" :
                (font === "OLD" ? "var(--RS__oldStyleTf)" :
                    (font === "MODERN" ? "var(--RS__modernTf)" :
                        (font === "SANS" ? "var(--RS__sansTf)" :
                            (font === "HUMAN" ? "var(--RS__humanistTf)" :
                                (font === "MONO" ? "var(--RS__monospaceTf)" :
                                    (font ? font : "var(--RS__oldStyleTf)"))))))));
        docElement.style.setProperty("--USER__textAlign", align === "justify" ? "justify" :
            (align === "right" ? "right" :
                (align === "left" ? "left" :
                    (align === "center" ? "center" :
                        (align === "initial" ? "initial" : "inherit")))));
        docElement.style.setProperty("--USER__fontSize", fontSize ? fontSize : "100%");
        docElement.style.setProperty("--USER__lineHeight", lineHeight ? lineHeight : "2");
        docElement.style.setProperty("--USER__colCount", colCount ? colCount : "auto");
    }
}
exports.readiumCSS = (messageJson) => {
    readiumCSSInject(messageJson);
    readiumCSSSet(messageJson);
};
function appendCSSInline(id, css) {
    ensureHead();
    const styleElement = win.document.createElement("style");
    styleElement.setAttribute("id", "Readium2-" + id);
    styleElement.setAttribute("type", "text/css");
    styleElement.appendChild(document.createTextNode(css));
    win.document.head.appendChild(styleElement);
}
function appendCSS(mod) {
    ensureHead();
    const linkElement = win.document.createElement("link");
    linkElement.setAttribute("id", "ReadiumCSS-" + mod);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRootReadiumCSS + "ReadiumCSS-" + mod + ".css");
    if (mod === "before" && win.document.head.childElementCount) {
        win.document.head.insertBefore(linkElement, win.document.head.firstElementChild);
    }
    else {
        win.document.head.appendChild(linkElement);
    }
}
function removeCSS(mod) {
    const linkElement = win.document.getElementById("ReadiumCSS-" + mod);
    if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
    }
}
function removeAllCSSInline() {
}
function removeAllCSS() {
    removeCSS("before");
    removeCSS("after");
    removeCSS("base");
    removeCSS("html5patch");
    removeCSS("safeguards");
    removeCSS("default");
    removeCSS("highlights");
    removeCSS("scroll");
    removeCSS("pagination");
    removeCSS("night_mode");
    removeCSS("pagination");
    removeCSS("os_a11y");
    removeCSS("user_settings");
    removeCSS("fs_normalize");
}
//# sourceMappingURL=readium-css.js.map