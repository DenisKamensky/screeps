var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const hostile = creep.room.find(FIND_HOSTILE_CREEPS);
               
        if (!hostile.length) {
            return;
        }
        creep.say("Protecting");
        let method = 'attack';
        const canShoot = creep.body.find(part => part.type === RANGED_ATTACK);
        if (canShoot) {
            method = 'rangedAttack';
        }
        const result = creep[method](hostile[0]);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(hostile[0]);
        }
	}
};

module.exports = roleHarvester;