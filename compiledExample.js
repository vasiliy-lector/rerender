const jsx = () => {};
const Layout = {};
const Todos = {};
const ADDITIONAL_TEXT = '';
const layoutAttrs = {
    id: 'layout'
};

let additionalItems = [0, 1, 2].map(num => jsx `<p>item number ${num}</p>`);
let layout = jsx `<${Layout} theme='light' ${layoutAttrs}>
    <${Todos} enabled=${true}>
        <div className='left'>
            ${ADDITIONAL_TEXT}
            ${additionalItems}
        </div>
    </${Todos}>
</${Layout}`;

let additionalItems = [0, 1, 2].map(num => jsx.template(position => jsx.tag(
    'p',
    {},
    [
        jsx.text('item number '),
        jsx.childValue(num)
    ],
position)));
let layout = jsx.template(position => jsx.component(
    Layout,
    jsx.assign({ theme: 'light' }, layoutAttrs),
    jsx.child(position => jsx.component(
        Todos,
        { enabled: true },
        jsx.child(position => jsx.tag(
            'div',
            { className: 'left' },
            [
                jsx.childValue(ADDITIONAL_TEXT, `${position}.0.0`),
                jsx.childValue(additionalItems, `${position}.0.1`)
            ],
            `${position}.0`
        )),
        `${position}.0`
    )),
    `${position}.0`
));
