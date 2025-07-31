const {
    removeSourceFromCreep,
    harvest,
} = require("./creep");


const hasCapacity = (structure, type) => structure.structureType == type && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const shouldHarvest = !creep.memory.shouldTransfer && creep.store.getFreeCapacity();

        if (shouldHarvest) {
            creep.memory.shouldTransfer = false;
            harvest(creep)
        }
        else {
            if (creep.memory.shouldTransfer && !creep.store[RESOURCE_ENERGY]) {
                creep.memory.shouldTransfer = false;
                return;
            }
            removeSourceFromCreep(creep);
            const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        const hasSpaceInSpawn = hasCapacity(structure, STRUCTURE_SPAWN);
                        const hasSpaceInExtention = hasCapacity(structure, STRUCTURE_EXTENSION);
                        const hasSpaseInTower = hasCapacity(structure, STRUCTURE_TOWER);
                        // const hasSpaceInContainer = structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                        const hasSpaceInContainer = hasCapacity(structure, STRUCTURE_CONTAINER);
                        return hasSpaceInSpawn || hasSpaceInExtention || hasSpaseInTower || hasSpaceInContainer;
                        // return (structure.structureType == STRUCTURE_EXTENSION ||
                        //         structure.structureType == STRUCTURE_SPAWN ||
                        //         structure.structureType == STRUCTURE_STORAGE ||
                        //         structure.structureType == STRUCTURE_TOWER) && 
                        //         structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            
            if(target) {
                creep.memory.shouldTransfer = true;
                const transferResult = creep.transfer(target, RESOURCE_ENERGY);
                if( transferResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                creep.memory.shouldTransfer = false;
            }
        }
	}
};

module.exports = roleHarvester;