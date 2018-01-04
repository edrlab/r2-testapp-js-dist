"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animateProperty = (cAF, callback, property, duration, object, destVal, rAF, transition) => {
    const state = {
        animating: false,
        deltaVal: destVal - object[property],
        destVal,
        duration,
        id: 0,
        lastVal: 0,
        nowTime: 0,
        object,
        originVal: object[property],
        property,
        startTime: Date.now(),
    };
    const animate = () => {
        state.animating = true;
        state.nowTime = Date.now();
        const newVal = Math.floor(transition(state.nowTime - state.startTime, state.originVal, state.deltaVal, state.duration));
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