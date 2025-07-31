const {
    removeSourceFromCreep,
    harvest,
} = require("./creep");

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.memory.building && !creep.store[RESOURCE_ENERGY]) {
			removeSourceFromCreep(creep);
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && !creep.store.getFreeCapacity()) {
	        creep.memory.building = true;
			removeSourceFromCreep(creep);
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
			const currentTarget = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
			if (!currentTarget) {
				return;
			}

			if(creep.build(currentTarget) == ERR_NOT_IN_RANGE) {
				creep.moveTo(currentTarget, {visualizePathStyle: {stroke: '#ffffff'}});
			}
	    }
	    else {
			harvest(creep);
	    }
	}
};

module.exports = roleBuilder;