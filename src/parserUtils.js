const stringIds = {};
let lastStringId = 0;

function getCacheId(stringsId, position) {
    return stringsId | (position[0] << 13) | position[1];
}

function getStringsId(strings) {
    const key = (strings.length << 18) | strings[0].length,
        stringsWithKey = stringIds[key] || (stringIds[key] = []);
    let i = stringsWithKey.length,
        stringId;

    while(i) {
        let item = stringsWithKey[--i],
            array = item[0],
            j = array.length;

        while (j) {
            if (array[--j] !== strings[j]) {
                break;
            }
        }

        if (j === 0) {
            stringId = item[1];
            break;
        }
    }

    if (!stringId) {
        stringId = (++lastStringId) << 21;
        stringsWithKey.push([strings, stringId]);
    }

    return stringId;
}

export {
    getCacheId,
    getStringsId
};
