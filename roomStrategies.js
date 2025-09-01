const {DANGER_LEVEL} = require("./constants");
const {getAvailableCreepConfig, CreepUnit, isWarrior} = require("./creep");
const roleBuilder = require("./role.builder");
const roleHarvester = require("./role.harvester");
const roleUpgrader = require("./role.upgrader");
const roleWarrior = require("./role.warrior");
const StateMachine = require("./stateMachine");
const {
    isRoomPopulated,
    getCreepsByRoomName,
    clearMemoryFromDeadCreeps,
    getAvailableSpawnByRoom,
    calcMaxPopulation,
    getRoomTowers,
    findColsestStructureToRepair,
    getContainersInRoom,
} = require("./utils");

const strategies = {
    0: {
        [DANGER_LEVEL.SAFED]: {
            init: {
                run: function(room) {
                    clearMemoryFromDeadCreeps(room);
                    const creeps = getCreepsByRoomName(room);
                    if (creeps) {
                        let role = roleUpgrader;
                        if (room.controller.ticksToDowngrade < 1500) {
                            creeps.forEach(creep => {
                                role.run(creep)
                            })
                            return;
                        }
                        const hasConstractionSites = room.find(FIND_CONSTRUCTION_SITES).length;
                        if (room.energyAvailable < room.energyCapacityAvailable) {
                            role = roleHarvester;
                        } else if (hasConstractionSites) {
                            role = roleBuilder;
                        }
                        creeps.forEach(creep => {
                            role.run(creep)
                        })
                    }
                    if (!isRoomPopulated(room)) {
                        const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                        if (creepConfig) {
                            this.dispatch('createCreep', room, creepConfig);
                            return;
                        }
                    }
                },
                createCreep: function (room, config) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {
                        memory: {
                            warType: CreepUnit.CREEP_WAR_TYPES.PEACEFUL,
                        }
                    });
                },
            }
        },
        // [DANGER_LEVEL.ATTACKED]: 'atack'
    },
    2: {
        [DANGER_LEVEL.SAFED]: {
            init: {
                run: function(room) {
                    clearMemoryFromDeadCreeps(room);
                    const creeps = getCreepsByRoomName(room);
                    if ((creeps || []).length) {
                        let role = roleUpgrader;
                        const controllerTicks = room.memory.minimalConrollerTicks || 3100;
                        if (room.controller.ticksToDowngrade < controllerTicks) {
                            room.memory.minimalConrollerTicks = 3500;
                            creeps.forEach(creep => {
                                if (isWarrior(creep)) {
                                    return
                                }
                                role.run(creep)
                            })
                            return;
                        } else {
                           room.memory.minimalConrollerTicks = 3100; 
                        }
                        const hasConstractionSites = room.find(FIND_CONSTRUCTION_SITES).length;
                        const notFullContainer = getContainersInRoom(room).find(container => container.store.getFreeCapacity(RESOURCE_ENERGY));
                        // const damegedConstruction = findColsestStructureToRepair(creeps[0], room);
                        // if (damegedConstruction) {
                        //     creeps[0].repair(damegedConstruction);
                        // }
                        if (room.energyAvailable < room.energyCapacityAvailable || notFullContainer) {
                            role = roleHarvester;
                        } else if (hasConstractionSites) {
                            role = roleBuilder;
                        }
                        creeps.forEach(creep => {
                            if(isWarrior(creep)) {
                                return;
                            }
                            role.run(creep)
                        })
                    }
                    if (isRoomPopulated(room)) {
                        return;
                    }
                    const peaceful = creeps.filter(creep => !isWarrior(creep));
                    const MAX_PEACEFULL_PERCENT = 80;
                    const maxPopulation = calcMaxPopulation(room);
                    const currentPeacefullPercent = (peaceful.length / maxPopulation) * 100;
                    if (currentPeacefullPercent > MAX_PEACEFULL_PERCENT) {
                        return
                    } 
                    const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                    if (creepConfig) {
                        this.dispatch('createCreep', room, creepConfig, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                        return;
                    }
                },
                createCreep: function (room, config) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {
                        memory: {
                            warType: CreepUnit.CREEP_WAR_TYPES.PEACEFUL,
                        }
                    });
                },
            }
        },
        [DANGER_LEVEL.UNSAFED]: {
            init: {
                run: function(room) {
                    
                    clearMemoryFromDeadCreeps(room);
                    if (!isRoomPopulated(room)) {
                        const creeps = getCreepsByRoomName(room);
                        let hasPeaceful = false;
                        let hasWarrior = false;
                        for(let creepIdx = 0; creepIdx < creeps.length; creepIdx++) {
                            if (hasPeaceful && hasWarrior) {
                                break;
                            }
                            let currCreep = creeps[creepIdx];
                            const isWarriorCreep = isWarrior(currCreep);
                            if (isWarriorCreep && !hasWarrior) {
                                hasWarrior = true;
                            }

                            if (!isWarriorCreep && !hasPeaceful) {
                                hasPeaceful = true;
                            }
                        }
                        
                        if (!hasPeaceful) {
                            const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                            if (creepConfig) {
                                this.dispatch('createCreep', room, creepConfig, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                                return;
                            }
                        }
                        creeps.forEach(creep => {
                            if(isWarrior(creep)) {
                                return;
                            }
                            roleHarvester.run(creep)
                        })
                        const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.WARRIOR);
                        if (creepConfig) {
                            this.dispatch('createCreep', room, creepConfig, CreepUnit.CREEP_WAR_TYPES.WARRIOR);
                            return;
                        }
                    }
                },
                createCreep: function (room, config, warType) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {memory: {warType}});
                },
            }
       },

        [DANGER_LEVEL.ATTACKED]: {
            init: {
                run: function(room) {
                    clearMemoryFromDeadCreeps(room);
                    const creeps = getCreepsByRoomName(room);
                    const warriors = [];
                    const peaceful = [];
                    creeps.forEach(creep => {
                        const arrToPush = isWarrior(creep) ? warriors : peaceful;
                        arrToPush.push(creep);
                    });
                    if (warriors.length) {
                        warriors.forEach(warrior => roleWarrior.run(warrior));
                    }
                    
                   
                    if (peaceful.length) {
                        let role = roleUpgrader;
                        const controllerTicks = room.memory.minimalConrollerTicks || 3100;
                        if (room.controller.ticksToDowngrade < controllerTicks) {
                            room.memory.minimalConrollerTicks = 3500;
                            creeps.forEach(creep => {
                                if (isWarrior(creep)) {
                                    return
                                }
                                role.run(creep);
                            })
                        } else {
                            if (room.memory.minimalConrollerTicks > 3100) {
                                room.memory.minimalConrollerTicks = 3100;
                            }

                        }

                        if (room.controller.ticksToDowngrade < 3100) {

                        } else {
                            const hasConstractionSites = room.find(FIND_CONSTRUCTION_SITES).length;
                            if (room.energyAvailable < room.energyCapacityAvailable) {
                                role = roleHarvester;
                            } else if (hasConstractionSites) {
                                role = roleBuilder;
                            }
                            peaceful.forEach(creep => {
                                role.run(creep)
                            })
                        }
                    }

                    if(isRoomPopulated(room)) {
                        return;
                    }
                    const MAX_PEACEFULL_PERCENT = 60;
                    const maxPopulation = calcMaxPopulation(room);
                    const currentPeacefullPercent = (peaceful.length / maxPopulation) * 100;
                    const warType = currentPeacefullPercent < MAX_PEACEFULL_PERCENT ? CreepUnit.CREEP_WAR_TYPES.PEACEFUL : CreepUnit.CREEP_WAR_TYPES.WARRIOR;
                    const creepConfig = getAvailableCreepConfig(room.energyAvailable, warType);
                    if (creepConfig) {
                        this.dispatch('createCreep', room, creepConfig, warType);
                        return;
                    }

                },
                createCreep: function (room, config, warType) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {memory: {warType}});
                },
            }
        }
    },
    3: {
        [DANGER_LEVEL.SAFED]: {
            init: {
                run: function(room) {
                    clearMemoryFromDeadCreeps(room);
                    const creeps = getCreepsByRoomName(room);
                    const towers = getRoomTowers(room);
                    if ((creeps || []).length) {
                        let role = roleUpgrader;
                        const controllerTicks = room.memory.minimalConrollerTicks || 3100;
                        if (room.controller.ticksToDowngrade < controllerTicks) {
                            room.memory.minimalConrollerTicks = 3500;
                            creeps.forEach(creep => {
                                if (isWarrior(creep)) {
                                    return
                                }
                                role.run(creep)
                            })
                            return;
                        } else {
                           room.memory.minimalConrollerTicks = 3100; 
                        }
                        const hasConstractionSites = room.find(FIND_CONSTRUCTION_SITES).length;
                        const currTower = towers[0];

                        const isTowerFull = currTower ? currTower.energy >= currTower.energyCapacity : true;
                        const notFullContainer = getContainersInRoom(room).find(container => container.store.getFreeCapacity(RESOURCE_ENERGY));
                     
                        if ((room.energyAvailable < room.energyCapacityAvailable) || !isTowerFull || notFullContainer) {
                            role = roleHarvester;
                        } else if (hasConstractionSites) {
                            role = roleBuilder;
                        }
                        creeps.forEach(creep => {
                            if(isWarrior(creep)) {
                                return;
                            }
                            role.run(creep)
                        })
                    }

                    //@TODO: cache and optimise
                    if (towers.length) {
                        const damegedConstruction = findColsestStructureToRepair(towers[0], room);
                        if (damegedConstruction) {
                            towers[0].repair(damegedConstruction);
                        }
                    }

                    if (isRoomPopulated(room)) {
                        return;
                    }
                    const peaceful = creeps.filter(creep => !isWarrior(creep));
                    const MAX_PEACEFULL_PERCENT = 80;
                    // change population
                    const maxPopulation = calcMaxPopulation(room, 2);
                    const currentPeacefullPercent = (peaceful.length / maxPopulation) * 100;
                    if (currentPeacefullPercent > MAX_PEACEFULL_PERCENT) {
                        return
                    } 
                    const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                    if (creepConfig) {
                        this.dispatch('createCreep', room, creepConfig, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                        return;
                    }
                },
                createCreep: function (room, config) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {
                        memory: {
                            warType: CreepUnit.CREEP_WAR_TYPES.PEACEFUL,
                        }
                    });
                },
            }
        },
        [DANGER_LEVEL.UNSAFED]: {
            init: {
                run: function(room) {
                    
                    clearMemoryFromDeadCreeps(room);
                    if (!isRoomPopulated(room)) {
                        const creeps = getCreepsByRoomName(room);
                        let hasPeaceful = false;
                        let hasWarrior = false;
                        for(let creepIdx = 0; creepIdx < creeps.length; creepIdx++) {
                            if (hasPeaceful && hasWarrior) {
                                break;
                            }
                            let currCreep = creeps[creepIdx];
                            const isWarriorCreep = isWarrior(currCreep);
                            if (isWarriorCreep && !hasWarrior) {
                                hasWarrior = true;
                            }

                            if (!isWarriorCreep && !hasPeaceful) {
                                hasPeaceful = true;
                            }
                        }
                        
                        if (!hasPeaceful) {
                            const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                            if (creepConfig) {
                                this.dispatch('createCreep', room, creepConfig, CreepUnit.CREEP_WAR_TYPES.PEACEFUL);
                                return;
                            }
                        }
                        creeps.forEach(creep => {
                            if(isWarrior(creep)) {
                                return;
                            }
                            roleHarvester.run(creep)
                        })
                        const creepConfig = getAvailableCreepConfig(room.energyAvailable, CreepUnit.CREEP_WAR_TYPES.WARRIOR);
                        if (creepConfig) {
                            this.dispatch('createCreep', room, creepConfig, CreepUnit.CREEP_WAR_TYPES.WARRIOR);
                            return;
                        }
                    }
                },
                createCreep: function (room, config, warType) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {memory: {warType}});
                },
            }
       },

        [DANGER_LEVEL.ATTACKED]: {
            init: {
                run: function(room) {
                    clearMemoryFromDeadCreeps(room);
                    const creeps = getCreepsByRoomName(room);
                    const towers = getRoomTowers(room);
                    //@TODO: createTowerModule;
                    towers.forEach(tower => {
                        const hostile = room.find(FIND_HOSTILE_CREEPS);
                        
                        if (!hostile.length) {
                            return;
                        }
                        tower.attack(hostile[0]);
                    })
                    const warriors = [];
                    const peaceful = [];
                    creeps.forEach(creep => {
                        const arrToPush = isWarrior(creep) ? warriors : peaceful;
                        arrToPush.push(creep);
                    });
                    if (warriors.length) {
                        warriors.forEach(warrior => roleWarrior.run(warrior));
                    }
                    
                    if (peaceful.length) {
                        let role = roleUpgrader;
                        const controllerTicks = room.memory.minimalConrollerTicks || 3100;
                        if (room.controller.ticksToDowngrade < controllerTicks) {
                            room.memory.minimalConrollerTicks = 3500;
                            creeps.forEach(creep => {
                                if (isWarrior(creep)) {
                                    return
                                }
                                role.run(creep);
                            })
                        } else {
                            if (room.memory.minimalConrollerTicks > 3100) {
                                room.memory.minimalConrollerTicks = 3100;
                            }

                        }

                        if (room.controller.ticksToDowngrade < 3100) {

                        } else {
                            const hasConstractionSites = room.find(FIND_CONSTRUCTION_SITES).length;
                            const currTower = towers[0];
                            const isTowerFull = currTower ? currTower.energy >= currTower.energyCapacity : true;
                            if (room.energyAvailable < room.energyCapacityAvailable || !isTowerFull) {
                                role = roleHarvester;
                            } else if (hasConstractionSites) {
                                role = roleBuilder;
                            }
                            peaceful.forEach(creep => {
                                role.run(creep)
                            })
                        }
                    }

                    if(isRoomPopulated(room)) {
                        return;
                    }
                    const MAX_PEACEFULL_PERCENT = 60;
                    const maxPopulation = calcMaxPopulation(room);
                    const currentPeacefullPercent = (peaceful.length / maxPopulation) * 100;
                    const warType = currentPeacefullPercent < MAX_PEACEFULL_PERCENT ? CreepUnit.CREEP_WAR_TYPES.PEACEFUL : CreepUnit.CREEP_WAR_TYPES.WARRIOR;
                    const creepConfig = getAvailableCreepConfig(room.energyAvailable, warType);
                    if (creepConfig) {
                        this.dispatch('createCreep', room, creepConfig, warType);
                        return;
                    }

                },
                createCreep: function (room, config, warType) {
                    const spawn = getAvailableSpawnByRoom(room);
                    spawn.spawnCreep(config, Date.now(), {memory: {warType}});
                },
            }
        }
    },
}

const getStrategy = (controllerLvL, dangerLvL) => {
    let curControllerLvL = controllerLvL;
    let strategyByController = strategies[controllerLvL]; 
    while(!strategyByController) {
        if (curControllerLvL < 0) {
            return;
        }
        --curControllerLvL;
        strategyByController = strategies[curControllerLvL];
    }
  
    if (!strategyByController) {
        return;
    }

    let curDangerLvL = dangerLvL;
    let resultStrategy;
    while(curDangerLvL >= DANGER_LEVEL.SAFED) {
        resultStrategy = strategyByController[curDangerLvL];
        if (resultStrategy) {
            break;
        }
        --curDangerLvL;
    }
    if (!resultStrategy) {
        return;
    }
    const stateMachine = new StateMachine(resultStrategy, 'init');
    return stateMachine;
};

module.exports = getStrategy;