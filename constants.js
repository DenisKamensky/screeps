const {CreepUnit} = require("./creep");

const createPrefix = (prefix, postfix) => prefix + postfix;

const basePrefix = 1751833285583; // prefix for enum


const createLevel = (postfix) => createPrefix(basePrefix, postfix);

const DANGER_LEVEL = {
    ATTACKED: createLevel(3),
    UNSAFED: createLevel(2),
    SAFED: createLevel(1),
}

// add PlannedCounstructions


module.exports = {
    DANGER_LEVEL,
};

