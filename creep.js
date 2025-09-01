class CreepUnit {
    constructor() {}
}

CreepUnit.CREEP_WAR_TYPES = {
    PEACEFUL: 1,
    WARRIOR: 2,
}

const isWarrior = creep => creep.memory.warType === CreepUnit.CREEP_WAR_TYPES.WARRIOR;
const getAvailableCreepConfig = (availableEnergy, warType) => {
    // @TODO: add greedy algorithm
    /*
        MOVE: 50 energy units.
        CARRY: 50 energy units.
        WORK: 100 energy units.
        ATTACK: 80 energy units.
        RANGED_ATTACK: 150 energy units.
        HEAL: 200 energy units.
        TOUGH: 20 energy units. 
        
    */
    if (warType === CreepUnit.CREEP_WAR_TYPES.PEACEFUL) {
        if (availableEnergy >= 1200) {
            return [
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                WORK,
                WORK,
                WORK,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
            ];
        }
        if (availableEnergy >= 700) {
            return [MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
        }
        if (availableEnergy >= 500) {
            return [MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY];
        }
        if (availableEnergy >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        if (availableEnergy < 200) {
            return;
        }

        return [WORK, CARRY, MOVE];
    }
    else {
        if (availableEnergy > 440) {
            return [RANGED_ATTACK, MOVE, TOUGH, MOVE, RANGED_ATTACK];
        }
        if (availableEnergy > 250) {
            return [RANGED_ATTACK, MOVE, TOUGH]; // 210
        }

        else {
            return;
        }
        // return [ATTACK, ATTACK, MOVE, TOUGH, MOVE, RANGED_ATTACK]; // 
    }
}

const MAX_CREEPS_ON_SOURCE = 3;
const findAvailableSource = (sources, creep) => {
    if (sources.length < 2) {
        return sources[0];
    }
    if (creep.memory.takenSource) {
        return sources.find(source => source.id === creep.memory.takenSource)
    }
    const sortedSorces = _.sortBy(sources, s => creep.pos.getRangeTo(s));
    const source = sortedSorces.find(source => {
        if (!creep.room.memory.takenSources) {
            creep.room.memory.takenSources = {};
        }
        const takenSource = creep.room.memory.takenSources[source.id]
        
        if (Object.keys(takenSource || {}).length > MAX_CREEPS_ON_SOURCE) {
            return false;
        }
        if (!takenSource) {
            creep.room.memory.takenSources[source.id]= {};
        }
        creep.room.memory.takenSources[source.id][creep.name] = 1;
        creep.memory.takenSource = source.id;
        return source;
    });
    return source;
}

const removeSourceFromCreep = (creep) => {
    const sourceId = creep.memory.takenSource;
    if (!sourceId) {
        return;
    }
    delete creep.room.memory.takenSources[sourceId][creep.name];
    delete creep.memory.takenSource;
}

const saveStoreForCreep = (creep, target) => {
    creep.memory.store = target.id;
}
const removeStoreFromCreep = (creep) => {
    // delete creep.memory.store;
};

const getStoreFromCreep = (creep) => {
    const storeId = creep.memory.store;
    const structure = Game.getObjectById(storeId);
    if (!structure) {
        return
    }
    return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        ? structure
        : undefined;
}

const harvest = (creep) => {
    const sources = creep.room.find(FIND_SOURCES);
    const source = findAvailableSource(sources, creep);
    if (!source) {
        return;
    }
    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffffff'}});
    }
}

module.exports = {
    CreepUnit,
    getAvailableCreepConfig,
    findAvailableSource,
    removeSourceFromCreep,
    harvest,
    isWarrior,
    getStoreFromCreep,
    saveStoreForCreep,
};