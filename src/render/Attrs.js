const SPECIAL = {
    key: true,
    ref: true,
    uniqid: true
};

function Attrs() {
    this.common = [];
    this.events = [];
    this.special = {};
}

Attrs.prototype = {
    set(name, value) {
        if (name.substr(0, 2) === 'on') {
            this.events.push([name, value]);
        } else if (SPECIAL[name]) {
            this.special[name] = value;
        } else {
            this.common.push([name, value]);
        }
    },

    type: 'Attrs'
};

export default Attrs;
