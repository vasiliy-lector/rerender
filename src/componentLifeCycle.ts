import { Component } from './Component';

export function componentInit<C extends Component<any, any>>(instance: C) {
    if (typeof instance.init === 'function') {
        instance.init();
    }
}

export function componentBeforeRender<C extends Component<any, any>>(instance: C) {
    if (!instance.componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
    }
}

export function componentDestroy<C extends Component<any, any>>(instance: C) {
    if (typeof instance.componentWillDestroy !== 'undefined') {
        instance.componentWillDestroy();
    }
}

export function componentUpdate<C extends Component<any, any>>(instance: C) {
    if (typeof instance.componentDidUpdate !== 'undefined') {
        instance.componentDidUpdate();
    }
}

export function componentMount<C extends Component<any, any>>(instance: C) {
    instance.componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
}

export function componentSetProps<C extends Component<any, any>>(instance: C, props: any, additional: any) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance.settingProps = true;
        instance.componentWillReceiveProps(props, additional);
        instance.settingProps = false;
    }

    instance.props = props;
}

export function componentUnmount<C extends Component<any, any>>(instance: C) {
    instance.componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
}
