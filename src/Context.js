function Context({
    isDomNode,
    parentId,
    index,
    parentPosition,
    domIndex,
    parent,
    parentNode,
    key,
    uniqid,
    relativeParentId,
    relativePosition,
    inheritableKey,
    inheritableUniqid
}) {
    this.isDomNode = isDomNode;
    this.parentId = parentId;
    this.index = index;
    this.parentPosition = parentPosition;
    this.domIndex = domIndex;
    this.parent = parent;
    this.parentNode = parentNode;
    const id = uniqid || `${this.parentId}.${key || index}`;

    if (isDomNode) {
        this.position = `${parentPosition || ''}.childNodes[${domIndex}]`;
        if (inheritableUniqid) {
            this.relativeParentId = id;
            this.relativePosition = '';
        } else {
            this.relativeParentId = relativeParentId;
            this.relativePosition = `${relativePosition}.childNodes[${domIndex}]`;
        }
    } else {
        this.inheritableKey = key || inheritableKey;
        this.inheritableUniqid = uniqid || inheritableUniqid;
        this.relativeParentId = relativeParentId;
        this.relativePosition = relativePosition;
    }

    this.id = id;
}

Context.prototype = {
    addIdLevel(component) {
        return this.clone({
            isDomNode: false,
            parentId: this.id,
            index: 0,
            parent: component || this.parent
        });
    },

    addDomLevel(node) {
        return this.clone({
            isDomNode: false,
            parentId: this.id,
            index: 0,
            parentPosition: this.getPosition(),
            domIndex: 0,
            parent: node,
            parentNode: node
        });
    },

    incrementComponent(key, uniqid) {
        return this.clone({
            isDomNode: false,
            index: (key || uniqid) ? this.index : this.index++,
            key,
            uniqid
        });
    },

    incrementDom(key, uniqid) {
        return this.clone({
            isDomNode: true,
            index: (key || uniqid) ? this.index : this.index++,
            domIndex: this.domIndex++,
            key,
            uniqid
        });
    },

    clone(changes) {
        return new Context(Object.keys(this).reduce((memo, key) => {
            if (changes[key] !== undefined) {
                memo[key] = changes[key];
            } else {
                memo[key] = this[key];
            }

            return memo;
        }, {}));
    },

    getId() {
        return this.id;
    },

    getPosition() {
        return this.position;
    },

    getPositionFn() {
        return new Function('rootNode', `return rootNode${this.position}`);
    },

    getDomId() {
        return;
    },

    getParent() {
        return this.parent;
    },

    getParentNode() {
        return this.parentNode;
    }
};

export default Context;
