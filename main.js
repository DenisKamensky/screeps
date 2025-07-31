const getStrategy = require("./roomStrategies");
const {detectControllerLevel, detectDangerLevel} = require("./utils");


module.exports.loop = function () {
    Object.values(Game.rooms).forEach(room => {
       const controllerLvL = detectControllerLevel(room);
       const dangerLvL = detectDangerLevel(room);
       const strategy = getStrategy(controllerLvL, dangerLvL);
       if (!strategy) {
        return;
       }
       strategy.dispatch('run', room)
    })
}