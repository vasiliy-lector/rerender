import { TEMPLATE, VCOMPONENT } from '../constants';

function shallowEqualProps(props1, props2) {
    if (props1 === props2) {
        return true;
    } else if (props1 === null || props2 === null) {
        return false;
    } else if (Object.keys(props1).length !== Object.keys(props2).length) {
        return false;
    }

    for (let name in props1) {
        if (!isEqualValues(props1[name], props2[name])) {
            return false;
        }
    }

    return true;
}

function isEqualValues(value1, value2) {
    if (value1 === value2) {
        return true;
    }

    if (typeof value1 !== 'object' || value1 === null || value2 === null) {
        return false;
    }

    if (isEqualFragments(value1, value2) || (value1.type === TEMPLATE && value1.isEqual(value2))) {
        return true;
    }

    return false;
}

function isEqualFragments(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0, l = arr1.length; i < l; i++) {
        if (!isEqualValues(arr1[i], arr2[i])) {
            return false;
        }
    }

    return true;
}

function shallowEqualArray(array1, array2) {
    if (array1 === array2) {
        return true;
    }

    if (array1.length !== array2.length) {
        return false;
    }

    for (let i = 0, l = array1.length; i < l; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
}

function groupByIdNodes(node, memo) {
    // TODO: take id from context
    memo[node.context.getId()] = node;

    if (node.childNodes) {
        for (let i = 0, l = node.childNodes.length; i < l; i++) {
            groupByIdNodes(node.childNodes[i], memo);
        }
    }

    return memo;
}

function groupByIdComponents(component, memo) {
    if (component.type === VCOMPONENT) {
        memo[component.id] = component;
    }

    if (component.childs) {
        for (let i = 0, l = component.childs.length; i < l; i++) {
            groupByIdComponents(component.childs[i], memo);
        }
    }

    return memo;
}

export {
    calcHash,
    escapeAttr,
    escapeHtml,
    escapeStyle,
    groupByIdNodes,
    groupByIdComponents,
    shallowEqualProps,
    shallowEqualArray
};
