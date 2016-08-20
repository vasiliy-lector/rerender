# Rerender - isomorphic ES6 framework with components, store and virtual dom

Usage:
```bash
npm install rerender
```

Create component:
```javascript
import { Component, connect, html } from 'rerender';
import Input from '../input/Input';
import Button from '../button/Button';
import Items from './TodoListItems';
import getTodos from '../../actions/getTodos';
import addTodo from '../../actions/addTodo';
import removeTodo from '../../actions/removeTodo';

class TodoList extends Component {
    init() {
        this.state.newTodoValue = '';
    }

    handleSubmit(event) {
        this.props.addTodo({
            text: this.state.newTodoValue
        });

        this.setState({
            newTodoValue: ''
        });
        event.target.reset();

        event.preventDefault();
    }

    handleInput(event) {
        this.setState({
            newTodoValue: event.target.value
        });
    }

    render() {
        let { removeTodo, todos } = this.props;

        return html `<div className="todo-list">
            <instance of=${Items}
                todos=${todos}
                removeTodo=${removeTodo} />
            <div className="todo-list__add">
                <form onSubmit=${this.handleSubmit}>
                    <instance of=${Input}
                        name="text"
                        autocomplete="off"
                        onInput=${this.handleInput}
                        placeholder="New todo" />
                    <instance of=${Button}>${this.props.buttonText}</instance>
                </form>
            </div>
            Вы ввели текст: "${this.state.newTodoValue}"
            ${this.children}
        </div>`;
    }
}

TodoList.types = {
    todos: 'array',
    addTodo: 'function',
    removeTodo: 'function'
};

TodoList.required = ['todos'];
TodoList.singleton = true;

TodoList.initActions = [getTodos];

TodoList.autoBind = ['handleSubmit', 'handleInput'];

const
    get = function({
        todos: {
            list: todos
        }
    }) {
        return {
            todos
        };
    },
    actions = {
        addTodo,
        removeTodo
    },
    watch = 'todos';

export default connect({ watch, get, actions })(TodoList);
```

Create action:
```javascript
import { createAction } from 'rerender';
import addTodoReducer from '../reducers/todos/addTodo';

const
    deps = { addTodo: addTodoReducer },
    addTodo = createAction(({ payload, actions, resolve }) => {
        // some stuff can be done here with payload

        actions.addTodo(payload);
        resolve();
    }, deps);

export default addTodo;
```

Create reducer:
```javascript
import { createReducer } from 'rerender';
import { buildStateByList } from './rehydrate';

const addTodo = createReducer(({ payload, state, setState }) => {
    let {
            todos: {
                list: prevList,
                byId: prevById
            }
        } = state,
        id,
        newTodo;

    if (!payload.id) {
        let allIds = Object.keys(prevById);

        id = allIds.length > 0 ? Math.max.apply(Math, allIds) + 1 : 0,
        newTodo = Object.assign({}, payload, {
            id
        });
    } else {
        newTodo = payload;
    }

    setState({
        todos: buildStateByList(prevList.concat([newTodo]))
    });
});

export default addTodo;
```

Create page:
```javascript
import { html } from 'rerender';
import Layout from '../components/layout/Layout';
import TodoList from '../components/todoList/TodoList';
import Link from '../components/link/Link';

function Index(){
    return html `<instance of=${Layout} title="todos">
        <instance of=${TodoList} buttonText="Add todo" />
        <p><instance of=${Link}
            href="/second/">Go second page</instance>
    </instance>`;
}

Index.initActions = [].concat(TodoList.initActions);

export default Index;
```

Create store:
```javascript
import { Store } from 'rerender';

let store = new Store({
    state: initialState
})
```

Render on server:
```javascript
import { serverRender } from 'rerender';

let result = serverRender(html `<instance of=${Application} />`, { store });
```

Render on client:
```javascript
import { clientRender } from 'rerender';

let result = clientRender(html `<instance of=${Application} />`, document.getElementById('application') { store });
```

Full isomorphic example [see here](https://github.com/rerender/rerender-todos).
