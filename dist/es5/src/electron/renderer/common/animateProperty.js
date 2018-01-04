"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animateProperty = function (cAF, callback, property, duration, object, destVal, rAF, transition) {
    var state = {
        animating: false,
        deltaVal: destVal - object[property],
        destVal: destVal,
        duration: duration,
        id: 0,
        lastVal: 0,
        nowTime: 0,
        object: object,
        originVal: object[property],
        property: property,
        startTime: Date.now(),
    };
    var animate = function () {
        state.animating = true;
        state.nowTime = Date.now();
        var newVal = Math.floor(transition(state.nowTime - state.startTime, state.originVal, state.deltaVal, state.duration));
        if (!state.lastVal || state.object[state.property] !== state.destVal) {
            state.object[state.property] = newVal;
            state.lastVal = newVal;
        }
        else {
            state.animating = false;
            state.object = {};
            if (callback) {
                callback(true);
            }
            cAF(state.id);
            return;
        }
        if (state.nowTime > (state.startTime + state.duration)) {
            state.animating = false;
            state.object[state.property] = state.destVal;
            state.object = {};
            if (callback) {
                callback(false);
            }
            cAF(state.id);
            return;
        }
        state.id = rAF(animate);
    };
    state.id = rAF(animate);
    return state;
};
//# sourceMappingURL=animateProperty.js.map