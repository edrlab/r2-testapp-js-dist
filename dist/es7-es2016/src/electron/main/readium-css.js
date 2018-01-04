"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
function setupReadiumCSS(server, folderPath) {
    const staticOptions = {
        dotfiles: "ignore",
        etag: true,
        fallthrough: false,
        immutable: true,
        index: false,
        maxAge: "1d",
        redirect: false,
    };
    server.expressUse("/readium-css", express.static(folderPath, staticOptions));
}
exports.setupReadiumCSS = setupReadiumCSS;
//# sourceMappingURL=readium-css.js.map