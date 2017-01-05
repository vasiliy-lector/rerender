# Rerender - isomorphic ES6 framework with components, store and virtual dom

Usage:
```bash
npm install rerender
```

Create component:
```javascript
// components/todoList/TodoList.js
import { Component, connect, jsx } from 'rerender';
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

        return jsx `<div className="todo-list">
            <${Items}
                todos=${todos}
                removeTodo=${removeTodo} />
            <div className="todo-list__add">
                <form onSubmit=${this.handleSubmit}>
                    <${Input}
                        name="text"
                        autocomplete="off"
                        onInput=${this.handleInput}
                        placeholder="New todo" />
                    <${Button}>${this.props.buttonText}</${Input}>
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
// actions/addTodo.js
import { createAction } from 'rerender';
import addTodoReducer from '../reducers/todos/addTodo';

const
    deps = { addTodoReducer },
    addTodo = createAction(({ payload, actions, resolve }) => {
        // some stuff can be done here with payload

        actions.addTodoReducer(payload);
        resolve();
    }, deps);

export default addTodo;
```

Create reducer:
```javascript
// reducers/todos/addTodo.js
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
// pages/Index.js
import { jsx } from 'rerender';
import Layout from '../components/layout/Layout';
import TodoList from '../components/todoList/TodoList';
import Link from '../components/link/Link';

function Index(){
    return jsx `<${Layout} title="todos">
        <${TodoList} buttonText="Add todo" />
        <p><${Link}
            href="/second/">Go second page</${Link}>
    </${Layout}>`;
}

Index.initActions = [].concat(TodoList.initActions);

export default Index;
```

Create store:
```javascript
import { Store } from 'rerender';

let store = new Store({
    state: initialState
});
```

Render on server:
```javascript
import { serverRender } from 'rerender';

let result = serverRender(jsx `<${Application} />`, { store });
```

Render on client:
```javascript
import { clientRender } from 'rerender';

let result = clientRender(jsx `<${Application} />`, document.getElementById('application'), { store });
```

Full isomorphic example [see here](https://github.com/rerender/rerender-todos).
