import { styleProps } from '../constants';

const REGEXP_ATTR = /[<>"&]/;
const REGEXP_HTML = /[<>&]/;

function escapeHtmlHeavy(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const UPPER_CASE = /[A-Z]/g;

function convertStyleKey(key: string) {
    return styleProps[key] || convertStyleKeyHeavy(key);
}

function convertStyleKeyHeavy(key: string) {
    return String(key).replace(UPPER_CASE, convertUpper);
}

function convertUpper(match: string) {
    return '-' + match.toLowerCase();
}

export function escapeStyle(value: any) {
    let styleString;

    if (typeof value === 'object' && value !== null) {
        styleString = '';

        for (const prop in value) {
            styleString += `${convertStyleKey(prop)}: ${value[prop]};`;
        }
    } else {
        styleString = value;
    }

    return escapeAttr(styleString);
}

export function escapeHtml(value: any) {
    const str = String(value);

    if (str.length > 10) {
        return REGEXP_HTML.test(str) ? escapeHtmlHeavy(str) : str;
    } else {
        for (let i = 0, l = str.length; i < l; i++) {
            const char = str[i];
            if (char === '<' || char === '>' || char === '&') {
                return escapeHtmlHeavy(str);
            }
        }
    }

    return str;
}

function escapeAttrHeavy(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function escapeAttr(value: string) {
    const str = String(value);

    if (str.length > 10) {
        return REGEXP_ATTR.test(str) ? escapeAttrHeavy(str) : str;
    } else {
        for (let i = 0, l = str.length; i < l; i++) {
            const char = str[i];
            if (char === '<' || char === '>' || char === '"' || char === '&') {
                return escapeAttrHeavy(str);
            }
        }
    }

    return str;
}
