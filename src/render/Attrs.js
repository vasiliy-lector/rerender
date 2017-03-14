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

function groupDiff(attrs, nextAttrs) {
    const prevObj = {};
    let setAttrs = [];
    let removeAttrs = [];

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

    if (setAttrs.length === 0) {
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
