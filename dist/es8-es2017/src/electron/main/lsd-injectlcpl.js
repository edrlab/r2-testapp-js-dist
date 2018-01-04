"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lcp_1 = require("r2-lcp-js/dist/es8-es2017/src/parser/epub/lcp");
const zipInjector_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/zip/zipInjector");
const debug_ = require("debug");
const ta_json_1 = require("ta-json");
const debug = debug_("r2:electron:main:lsd");
async function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    const lcplJson = global.JSON.parse(lcplStr);
    debug(lcplJson);
    const zipEntryPath = "META-INF/license.lcpl";
    let lcpl;
    try {
        lcpl = ta_json_1.JSON.deserialize(lcplJson, lcp_1.LCP);
    }
    catch (erorz) {
        return Promise.reject(erorz);
    }
    lcpl.ZipPath = zipEntryPath;
    lcpl.JsonSource = lcplStr;
    lcpl.init();
    publication.LCP = lcpl;
    return new Promise(async (resolve, reject) => {
        const newPublicationPath = publicationPath + ".new";
        zipInjector_1.injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, (err) => {
            reject(err);
        }, () => {
            debug("EPUB license.lcpl injected.");
            setTimeout(() => {
                fs.unlinkSync(publicationPath);
                setTimeout(() => {
                    fs.renameSync(newPublicationPath, publicationPath);
                    resolve(publicationPath);
                }, 500);
            }, 500);
        });
    });
}
exports.lsdLcpUpdateInject = lsdLcpUpdateInject;
//# sourceMappingURL=lsd-injectlcpl.js.map