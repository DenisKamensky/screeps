const {DANGER_LEVEL} = require("./constants");
const {isWarrior} = require("./creep");

const getRoomByCreep = (creep) => creep.room;

const getControllerByRoom = (room) => room.controller;
const getControllerByCreep = (creep) => getControllerByRoom(getRoomByCreep(creep));
const getSpawnsByRoom = room => 
        Object.values(Game.spawns).filter(spawn => spawn.room.name === room.name);

const getStructuresByRoom = (room, filter) => room.find(FIND_STRUCTURES, {filter});
const getTowersInRoom = room => getStructuresByRoom(room, (structure) => structure.structureType == STRUCTURE_TOWER);
const getContainersInRoom = room => getStructuresByRoom(room, (structure) => structure.structureType == STRUCTURE_CONTAINER);
//@TODO: return IDLE spawns
const getAvailableSpawnByRoom = room => {
    const spawns = getSpawnsByRoom(room);
    return spawns[0] || undefined;
}

const getCreepsByRoomName = room => {
    const {creeps} = Game;
    if (!Object.values(creeps).length) {
        return [];
    }
    return Object.values(creeps).filter(creep => creep.room.name === room.name);
}

const getCreep = () => {
   let {creeps} = Game;
    try {
        return Object.values(creeps)[0];
    } catch (err) {
        return;
    }
}

const detectControllerLevel = (room) => room.controller.level;

const calcMaxPopulation = (room, customMultiplier) => {
    const MAX_LIMIT_PER_LEVEL = 4;
    const controller = getControllerByRoom(room);
    const multiplier = customMultiplier || MAX_LIMIT_PER_LEVEL;
    const MAX_PER_ROOM = 10;
    // @TODO implement this
    const result = (controller.level || 1) * multiplier;

    return result > MAX_PER_ROOM ? MAX_PER_ROOM : result;
}

const isRoomPopulated = room => {
    const maxPopulation = calcMaxPopulation(room);
    const currentPopulation = getCreepsByRoomName(room);
    return currentPopulation.length >= maxPopulation;
}

// Game.time
// get towers from cache or find newest;
const getRoomTowers = room => {
    const towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_TOWER
        }
    });
    return towers;
}

const findColsestStructureToRepair = (tower, room) => {
    const timeToWait = 1000;
    const scheduledTime = room.memory.towerSchdule || Game.time;
    if ((scheduledTime - Game.time) > 0) {
        return [];
    }
    const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax
    });
    if (!closestDamagedStructure) {
        room.memory.towerSchdule = Game.time + timeToWait;
    }
    return closestDamagedStructure;
} 

const detectDangerLevel = (room) => {
    const creeps = getCreepsByRoomName(room)
    const spotter = creeps[0];

    if (!spotter) {
        return DANGER_LEVEL.SAFED;
    }

    //@TODO fix count
    const hasWarrior = creeps.filter(isWarrior);
    const hasTower = getTowersInRoom(room).length;
    if (!hasTower && !hasWarrior.length) {
        return DANGER_LEVEL.UNSAFED;
    }

    const hasEnemy = spotter.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (hasEnemy) {
        return DANGER_LEVEL.ATTACKED;
    }
    return DANGER_LEVEL.SAFED;
}

const clearMemoryFromDeadCreeps = (room) => {
    if (!room.memory.takenSources) {
        return;
    }
    Object.entries(room.memory.takenSources).forEach(([sourceName, source]) => {
        Object.keys(source).forEach(creepId => {
            const isCreepAlive = Game.creeps[creepId];
            if (isCreepAlive) {
                return;
            } 
            delete room.memory.takenSources[sourceName][creepId];
        })
    })
}

module.exports = {
    detectControllerLevel,
    detectDangerLevel,
    getCreepsByRoomName,
    calcMaxPopulation,
    isRoomPopulated,
    clearMemoryFromDeadCreeps,
    getAvailableSpawnByRoom,
    getRoomTowers,
    findColsestStructureToRepair,
    getContainersInRoom,
}