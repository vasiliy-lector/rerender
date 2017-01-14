import Events from './Events';
import { nextTick } from './utils';
import { createInstance } from './jsx';

let rerenderTrigger;
const
    events = new Events(),
    RENDER_THROTTLE = 50,
    renderClient = function(render, store, domNode) {
        const
            nextMounted = {},
            jsx = createInstance({
                store,
                joinTextNodes: true,
                stringify: false,
                nextMounted
            }),
            vDom = render({ jsx });

        // check domNode hash
        // listen events 'rerender' and call with throttle rerendering
    },

    renderServer = function(render, store) {
        const jsx = createInstance({
            store,
            stringify: true
        });

        return render({ jsx });
    },

    scheduleUpdate = function(/* { position } */) {
        if (!rerenderTrigger) {
            rerenderTrigger = nextTick(() => {
                events.emit('rerender');
            });
        }
    };

export { renderClient, renderServer, scheduleUpdate, RENDER_THROTTLE };
