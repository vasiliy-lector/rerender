import { Events } from './Events';
import { shallowClone } from './utils';
import { Path } from './types';

export class Store<State> extends Events {
    private prevState: Partial<State>;
    private state: State;

    constructor() {
        super();
        this.getState = this.getState.bind(this);
        this.setState = this.setState.bind(this);
    }

    public getState(): State;
    public getState(path: Path): any;
    public getState(path?: Path) {
        if (path) {
            let result: any = this.state;

            for (let i = 0, l = path.length; result !== undefined && i < l; i++) {
                result = typeof result === 'object' ? result[path[i]] : undefined;
            }

            return result;
        } else {
            return this.state;
        }
    }

    public setState(value: State): void;
    public setState(value: any, path: Path): void;
    public setState(value: State | any, path?: Path): void {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this.prevState) {
                    this.prevState = this.state;
                    this.state = shallowClone(this.prevState);
                }

                let stateParent: any = this.getState();
                let prevStateParent: any = this.prevState;
                const last = path.length - 1;

                for (let i = 0, l = last; i < l; i++) {
                    if (prevStateParent && typeof prevStateParent[path[i]] === 'object') {
                        if (stateParent[path[i]] === prevStateParent[path[i]]) {
                            stateParent[path[i]] = shallowClone(prevStateParent[path[i]]);
                        }
                        prevStateParent = prevStateParent[path[i]] || undefined;
                    } else {
                        stateParent[path[i]] = typeof path[i + 1] === 'number' ? [] : {};
                    }

                    stateParent = stateParent[path[i]];
                }

                stateParent[path[last]] = value;
                this.emit('change');
            }
        } else if (value !== this.state) {
            this.state = value;
            this.emit('change');
        }
    }

    public getStateSnapshot(): State;
    public getStateSnapshot(path: Path): any;
    public getStateSnapshot(path?: Path) {
        if (this.prevState) {
            delete this.prevState;
        }

        return path ? this.getState(path) : this.getState();
    }
}
