class StateMachine {
    constructor(states, currentState) {
        this.states = states;
        this.currentState = currentState;
    }

    dispatch(methodName, ...payload) {
        try {
            const method = this.states[this.currentState][methodName];
            return method.apply(this, payload);
        } catch (err) {
            console.log(err)
            return;
        }

    }

    changeState(newState) {
        this.currentState = newState;
    }
}

module.exports = StateMachine;