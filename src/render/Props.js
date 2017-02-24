const SPECIAL = {
    key: true,
    ref: true,
    uniqid: true
};

function Props() {
    this.common = {};
    this.special = {};
}

Props.prototype = {
    set(name, value) {
        if (SPECIAL[name]) {
            this.special[name] = value;
        } else {
            this.common[name] = value;
        }
    },

    type: 'Props'
};

function PropsWrapper() {
    this.common = {};
    this.special = {};
}

PropsWrapper.prototype = {
    set(name, value) {
        this.common[name] = value;
    }
};

export default Props;
export { PropsWrapper };
