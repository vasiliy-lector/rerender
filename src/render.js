import Events from './Events';
import { nextTick } from './utils';
import { createInstance } from './jsx';
import { renderComponent, renderText, renderValue, createTemplate } from './renderComponent';

let rerenderTrigger;
const
    events = new Events(),
    RENDER_THROTTLE = 50,
    getJsx = function getJsx(config) {
        const jsx = createInstance();

        jsx.renderComponent = renderComponent(config, jsx);
        jsx.renderText = renderText(config, jsx);
        jsx.renderValue = renderValue;
        jsx.createTemplate = createTemplate;

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
