function childValue(config, jsx) {
    if (config.stringify) {
        return childValueStringify(config, jsx);
    } else {
        return childValueDom(config, jsx);
    }
}

function childValueStringify(config, jsx) {
    return function(value, position, enableJoin = true) {
        const type = typeof value;

        if (type === 'object') {
            if (value.type === 'Template') {
                return value.exec(position);
            } else if (Array.isArray(value)) {
                const memo = [];

                for (let i = 0, l = value.length; i < l; i++) {
                    const result = jsx.childValue(value[i],position.updateId(`${position.id}.${i}`), false);
                    if (Array.isArray(result)) {
                        for (let j = 0, l1 = result.length; j < l1; j++) {
                            memo.push(result[j]);
                        }
                    } else {
                        memo.push(result);
                    }
                }

                return enableJoin ? memo.join('') : memo;
            }
        } else if (type === 'string') {
            return jsx.text(value);
        } else if (type === 'function') {
            return jsx.childValue(value(), position);
        }

        return jsx.text('');
    };
}

function childValueDom(config, jsx) {
    return function(value, position) {
        if (Array.isArray(value)) {
            const memo = [];

            for (let i = 0, l = value.length; i < l; i++) {
                const result = jsx.childValue(value[i],position.updateId(`${position.id}.${i}`));
                if (Array.isArray(result)) {
                    for (let j = 0, l1 = result.length; j < l1; j++) {
                        memo.push(result[j]);
                    }
                } else {
                    memo.push(result);
                }
            }

            return memo;
        } else if (typeof value === 'string') {
            return jsx.text(value);
        } else if (typeof value === 'object' && value.type === 'Template') {
            return value.exec(position);
        } else if (typeof value === 'function') {
            return jsx.childValue(value(), position);
        } else {
            return jsx.text('');
        }
    };
}

export default childValue;
