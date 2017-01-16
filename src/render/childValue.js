// FIXME optimize everything here
function childValue(config, jsx) {
    if (config.stringify) {
        return childValueStringify(config, jsx);
    } else {
        return childValueDom(config, jsx);
    }
}

function childValueStringify(config, jsx) {
    return function(value, position) {
        if (Array.isArray(value)) {
            for (var i = 0, l = value.length, expanded = []; i < l; i++) {
                expanded.push(jsx.childValue(value[i], `${position}.${i}`));
            }

            return expanded.join('');
        } else if (typeof value === 'function') {
            return jsx.childValue(value(), position);
        } else if (typeof value === 'object' && value.type === 'Template') {
            return value.exec(position);
        } else if(!value) {
            return jsx.text('');
        } else {
            return value;
        }
    };
}

function childValueDom(config, jsx) {
    return function(value, position) {
        if (typeof value === 'object') {
            if (value.type === 'Template') {
                return value.exec(position);
            } else {
                return value;
            }
        } else if (typeof value === 'string') {
            return jsx.text(value);
        } else if (typeof value === 'function') {
            return jsx.childValue(value(), position);
        } else if (Array.isArray(value)) {
            for (var i = 0, l = value.length, expanded = []; i < l; i++) {
                if (typeof value[i] === 'object' && value[i].type === 'Template') {
                    expanded.push(value[i].exec(`${position}.${i}`));
                }
            }

            return expanded;
        } else if (!value) {
            return jsx.text('');
        } else {
            return value;
        }
    };
}

export default childValue;
