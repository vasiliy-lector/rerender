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
    this.parentId = parentId;
    this.index = index;
    this.parentPosition = parentPosition;
    this.domIndex = domIndex;
    this.parent = parent;
    this.parentNode = parentNode;
    const id = uniqid || `${this.parentId}.${key || (isDomNode ? index : 'c' + index)}`;

    if (isDomNode) {
        this.position = `${parentPosition || ''}.childNodes[${domIndex}]`;
        if (uniqid || key || inheritableUniqid || inheritableKey) {
            this.relativeParentId = id;
            this.relativePosition = '';
            this.domId = key || inheritableKey
                ? `${parentId}.childNodes[${domIndex}]`
                : `${relativeParentId}${relativePosition}`;
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
        return new Context({
            parentId: this.id,
            index: 0,
            parent: component || this.parent,

            // no rewrite
            parentPosition: this.parentPosition,
            domIndex: this.domIndex,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid
        });
    },

    addDomLevel(node) {
        return new Context({
            parentId: this.id,
            index: 0,
            parentPosition: this.position,
            domIndex: 0,
            parent: node,
            parentNode: node,

            // no rewrite
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid
        });
    },

    incrementComponent(key, uniqid) {
        return new Context({
            index: (key || uniqid) ? this.index : this.index++,
            key,
            uniqid,

            // no rewrite
            parentId: this.parentId,
            parentPosition: this.parentPosition,
            domIndex: this.domIndex,
            parent: this.parent,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid
        });
    },

    incrementDom(key, uniqid) {
        return new Context({
            index: (key || uniqid) ? this.index : this.index++,
            domIndex: this.domIndex++,
            key,
            uniqid,

            // no rewrite
            parentId: this.parentId,
            parentPosition: this.parentPosition,
            parent: this.parent,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid
        });
    },

    getId() {
        return this.id;
    },

    getPositionFn() {
        return new Function('rootNode', `return rootNode${this.position}`);
    },

    getDomId() {
        return this.domId;
    },

    getParent() {
        return this.parent;
    },

    getParentNode() {
        return this.parentNode;
    }
};

export default Context;
