import { Component } from './Component';

export function componentInit(instance: Component<any, any>) {
    if (typeof instance.init === 'function') {
        instance.init();
    }
}

export function componentBeforeRender(instance: Component<any, any>) {
    if (!instance.componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
    }
}

export function componentDestroy(instance: Component<any, any>) {
    if (typeof instance.componentWillDestroy !== 'undefined') {
        instance.componentWillDestroy();
    }
}

export function componentUpdate(instance: Component<any, any>) {
    if (typeof instance.componentDidUpdate !== 'undefined') {
        instance.componentDidUpdate();
    }
}

export function componentMount(instance: Component<any, any>) {
    instance.componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
}

export function componentSetProps(instance: Component<any, any>, props: any, additional: any) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance.settingProps = true;
        instance.componentWillReceiveProps(props, additional);
        instance.settingProps = false;
    }

    instance.props = props;
}

export function componentUnmount(instance: Component<any, any>) {
    instance.componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
}
