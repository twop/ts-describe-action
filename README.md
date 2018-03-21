# redux-typed-actions

reduce redux boilerplate and leverage typescript safety

## Installation

```
npm add redux-typed-actions
```

## Motivation

```typescript
// typical redux boilerplate with typesctipt
const ADD_TODO = 'ADD_TODO';

type AddTodoAction = { type: typeof ADD_TODO; text: string };
type Todo = { text: string; completed: boolean };

function todosReducer(state: Todo[] = [], action: Action): Todo[] {
  switch (action.type) {
    case ADD_TODO: {
      const { text } = <AddTodoAction>action;
      return state.concat([{ text, completed: false }]);
    }
    default:
      return state;
  }
}

// later
const addTodo: AddTodoAction = { type: ADD_TODO, text: 'reduce boilerplate' };
dispatch(addTodo);
```

Most of that is by design: we need to decouple intent & effect. But what if we rely on typescript to keep us honest but with less hassle?

## Here what this library does

```typescript
const AddTodo = createAction('ADD_TODO', (prev: Todo[], text: string) =>
  prev.concat([{ text, completed: false }])
);

const add = AddTodo.create('reduce boilerplate');
// typeof AddTodo.create = (payload:string) => {type: 'ADD_TODO'; payload: string}

function todosReducer(state: Todo[] = [], action: Action): Todo[] {
  if (AddTodo.isMine(action)) {
    // isMine is a typeguard. So we have access to payload: string
    return AddTodo.handle(state, action.payload);
  }
  return state;
}
```

isMine() & handle() is a convinient way to write a reducer. But what if we automate that too?

```typescript
const ToggleTodo = createAction('TOGGLE_TODO', (prev: Todo[], index: number) =>
  prev.map(
    (todo, i) =>
      index === i ? { text: todo.text, completed: !todo.completed } : todo
  )
);

const todosReducer = createReducer([AddTodo, ToggleTodo], [] /*initial state*/);
```

## All combined

```typescript
export const AddTodo = createAction('ADD_TODO', (prev: Todo[], text: string) =>
  prev.concat([{ text, completed: false }])
);

export const ToggleTodo = createAction(
  'TOGGLE_TODO',
  (prev: Todo[], index: number) =>
    prev.map(
      (todo, i) =>
        index === i ? { text: todo.text, completed: !todo.completed } : todo
    )
);

export const todosReducer = createReducer(
  [AddTodo, ToggleTodo],
  [] /*initial state*/
);
```

Also for actions with no payload there is a simplified version:

```typescript
const Increment = createSimpleAction('Inc', (prev: number) => prev + 1);
const Decrement = createSimpleAction('Dec', (prev: number) => prev - 1);

// action creator. NOTE the object is reused. Increment.create() === Increment.create()
const increment = Increment.create(); // {type: 'Inc'}

//handler
const result = Increment.handle(0); // result === 1

const reducer = createReducer([Increment, Decrement], 0);
```

## API

Action descriptions types:

```typescript
// NOTE that handle accepts the actual payload not the action.
interface ActionDesc<TType extends string, TState, TPayload> {
  type: TType;
  handle: (prev: TState, payload: TPayload) => TState;
  create: (payload: TPayload) => { type: TType; payload: TPayload };
  isMine: (action: Action) => action is { type: TType; payload: TPayload };
}

// for actions with no payload
interface SimpleActionDesc<TType extends string, TState> {
  type: TType;
  handle: (prev: TState) => TState;
  create: () => { type: TType };
  isMine: (action: Action) => action is { type: TType };
}
```

It is just 3 functions:

```typescript
// create action desc with payload. TType, TPayload, TState are all infered.
function createAction<TType extends string, TState, TPayload>(
  type: TType,
  handle: (prev: TState, payload: TPayload) => TState
): ActionDesc<TType, TState, TPayload>;

// simplified version. Used for actions with no payload.
function createSimpleAction<TType extends string, TState>(
  type: TType,
  handle: (prev: TState) => TState
): SimpleActionDesc<TType, TState>;

// Note that actions can be a mix of SimpleActionDesc & ActionDesc
// They just have to share the state type.
function createReducer<TState>(
  actions: AnyActionDesc<TState>[],
  initialState: TState
): Reducer<TState, Action<string>>;
```
