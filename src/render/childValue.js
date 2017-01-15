function childValue(config, jsx) {
    return function(value, position) {
        if (Array.isArray(value)) {
            for (var i = 0, l = value.length, expanded = []; i < l; i++) {
                expanded.push(childValue(value[i], `${position}.${i}`));
            }

            return config.stringify ? expanded.join('') : expanded;
        } else if (typeof value === 'string') {
            return jsx.text(value);
        } else if (typeof value === 'function') {
            return value.type === 'Template'
                ? value.exec(position)
                : childValue(value(), position);
        } else {
            return jsx.text(!value ? '' : value + '');
        }
    };
}

export default childValue;
