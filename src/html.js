const cache = {
    '<div className="block"></div>': function() {
        return {
            tag: 'div',
            attrs: {
                className: 'block'
            },
            children: []
        };
    },
    '<div className="block" id=${}></div>': function (args) {
        return {
            tag: 'div',
            attrs: {
                className: 'block',
                id: args[1]
            },
            children: []
        };
    },
    '<div className="block" id=${} ${}><p ${}>${}</p></div>': function(args) {
        var json = {
            tag: 'div',
            attrs: {
                className: 'block',
                id: args[1]
            },
            children: [
                {
                    tag: 'p',
                    attrs: null,
                    children: [ null ]
                }
            ]
        };
        var attrs = json.attrs;
        var keys = Object.keys(args[2]);
        for (var i = 0, l = keys.length; i < l; i++) {
            attrs[keys[i]] = args[2][keys[i]];
        }
        json.children[0].attrs = args[3];
        json.children[0].children[0] = args[4];

        return json;
    }
};

function getCacheId(templates) {
    let id = '';
    const l = templates.length - 1;

    for (let i = 0; i < l; i++) {
        id += templates[i] + '${__value__}';
    }

    return (id + templates[l]).trim();
}

function getJson(cacheId, args) {
    return cache[cacheId](args);
}

function createCache(cacheId) {
    let json = '',
        setter = '',
        currentParent,
        inside = false,
        notFinish = true;

    const
        regExpOutside = /<|$/im,
        regExpInside = /^|\s+|=|"|>|$/im;

    while (notFinish) {
        if (inside) {
            
        } else {
            
        }
    }

    cache[cacheId] = new Function('args', fn);
}

function html(templates) {
    const cacheId = getCacheId(templates);

    if (typeof cache[cacheId] === 'undefined') {
        createCache(cacheId);
    }

    return getJson(cacheId, arguments);
}

export { html as default };
