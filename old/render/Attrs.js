const SPECIAL = {
    key: true,
    ref: true,
    uniqid: true
};

function Attrs() {
    this.common = {};
    this.events = {};
    this.special = {};
}

Attrs.prototype = {
    set(name, value) {
        if (name.substr(0, 2) === 'on') {
            this.events[name.toLowerCase()] = value;
        } else if (SPECIAL[name]) {
            this.special[name] = value;
        } else {
            this.common[name] = value;
        }
    },

    type: 'Attrs'
};

function groupDiff(attrs, nextAttrs) {
    let setAttrs = {};
    let removeAttrs = [];

    for (let name in nextAttrs) {
        const nextValue = nextAttrs[name];
        if (attrs[name] !== nextValue) {
            setAttrs[name] = nextValue;
        }
    }

    for (let name in attrs) {
        if (nextAttrs[name] === undefined) {
            removeAttrs.push(name);
        }
    }

    if (Object.keys(setAttrs).length === 0) {
        setAttrs = null;
    }

    if (removeAttrs.length === 0) {
        removeAttrs = null;
    }

    return setAttrs || removeAttrs ? [setAttrs, removeAttrs] : null;
}

function diffAttrs(attrs, nextAttrs) {
    const common = groupDiff(attrs.common, nextAttrs.common) || null;
    const events = groupDiff(attrs.events, nextAttrs.events) || null;

    return common || events ? {
        common,
        events
    } : null;
}

export default Attrs;
export { diffAttrs };
