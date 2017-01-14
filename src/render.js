import Events from './Events';
import { nextTick } from './utils';
import { createInstance } from './jsx';
import { tag, component, text, childValue, template } from './bricks';

let rerenderTrigger;
const
    events = new Events(),
    RENDER_THROTTLE = 50,
    getJsx = function getJsx(config) {
        const jsx = createInstance();

        jsx.component = component(config, jsx);
        jsx.tag = tag(config, jsx);
        jsx.text = text(config, jsx);
        jsx.childValue = childValue;
        jsx.template = template;

        return jsx;
    },
    render = function(render, store, domNode) {

        // server render
        if (!domNode) {
            const jsx = getJsx({
                store,
                stringify: true
            });

            return render({ jsx });

        // client render
        } else {
            const
                nextMounted = {},
                jsx = getJsx({
                    store,
                    joinTextNodes: true,
                    stringify: false,
                    nextMounted
                }),
                vDom = render({ jsx });

            // check domNode hash
            // listen events 'rerender' and call with throttle rerendering
        }
    },

    scheduleUpdate = function(/* { position } */) {
        if (!rerenderTrigger) {
            rerenderTrigger = nextTick(() => {
                events.emit('rerender');
            });
        }
    };

export { render, getJsx, scheduleUpdate, RENDER_THROTTLE };
