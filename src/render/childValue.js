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
            const memo = [];

            for (let i = 0, l = value.length; i < l; i++) {
                memo.push(jsx.childValue(value[i], `${position}.${i}`));
            }

            return memo.join('');
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
        if (Array.isArray(value)) {
            const memo = [];

            for (let i = 0, l = value.length; i < l; i++) {
                const result = jsx.childValue(value[i],`${position}.${i}`);
                if (Array.isArray(result)) {
                    Array.prototype.push.apply(memo, result);
                } else {
                    memo.push(result);
                }
            }

            return memo;
        } else if (typeof value === 'object') {
            if (value.type === 'Template') {
                return value.exec(position);
            } else {
                return value;
            }
        } else if (typeof value === 'string') {
            return jsx.text(value);
        } else if (typeof value === 'function') {
            return jsx.childValue(value(), position);
        } else {
            return jsx.text('');
        }
    };
}

export default childValue;
