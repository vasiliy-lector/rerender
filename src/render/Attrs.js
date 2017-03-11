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
            this.events.push([name.toLowerCase(), value]);
        } else if (SPECIAL[name]) {
            this.special[name] = value;
        } else {
            this.common.push([name, value]);
        }
    },

    type: 'Attrs'
};

function groupDiff(attrs, nextAttrs, setAttrs, removeAttrs) {
    const prevObj = {};

    for (let i = 0, l = attrs.length; i < l; i++) {
        prevObj[attrs[i][0]] = attrs[i][1];
    }

    for (let i = 0, l = nextAttrs.length; i < l; i++) {
        const name = nextAttrs[i][0];
        const prevAttrValue = prevObj[name];

        if (prevAttrValue !== undefined) {
            if (prevAttrValue !== nextAttrs[i][1]) {
                setAttrs.push(nextAttrs[i]);
            }
            delete prevObj[name];
        } else {
            setAttrs.push(nextAttrs[i]);
        }
    }

    const toRemove = Object.keys(prevObj);

    for (let i = 0, l = toRemove.length; i < l; i++) {
        removeAttrs.push(toRemove[i]);
    }
}

function diffAttrs(attrs, nextAttrs) {
    const setAttrs = [];
    const removeAttrs = [];

    groupDiff(attrs.common, nextAttrs.common, setAttrs, removeAttrs);
    groupDiff(attrs.events, nextAttrs.events, setAttrs, removeAttrs);

    return [setAttrs, removeAttrs];
}

export default Attrs;
export { diffAttrs };
