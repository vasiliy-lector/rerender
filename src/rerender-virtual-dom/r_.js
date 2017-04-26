import createTemplateServer from './createTemplateServer';
import createTemplateClient from './createTemplateClient';

let isServer = false;

function r_() {
    return isServer ? createTemplateServer.apply(null, arguments) : createTemplateClient.apply(null, arguments);
}

r_.setServer = function setServer(value) {
    isServer = value;
};

export default r_;
