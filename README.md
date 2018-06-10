# ts-describe-action

reduce redux boilerplate and leverage typescript safety

## Installation

```
npm add ts-describe-action
```

Note: requires typescript version >= 2.7

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
const AddTodo = describeAction('ADD_TODO', (prev: Todo[], text: string) =>
  prev.concat([{ text, completed: false }])
);

function todosReducer(state: Todo[] = [], action: Action): Todo[] {
  if (AddTodo.isMine(action)) {
    // isMine is a typeguard. So we have access to payload: string
    return AddTodo.handle(state, action.payload);
  }
  return state;
}

//later
const add = AddTodo.create('reduce boilerplate');
// typeof add = {type: 'ADD_TODO'; payload: string}
```

isMine() & handle() is a convenient way to write a reducer. But what if we automate that too?

```typescript
const ToggleTodo = describeAction(
  'TOGGLE_TODO',
  (prev: Todo[], index: number) =>
    prev.map(
      (todo, i) =>
        index === i ? { text: todo.text, completed: !todo.completed } : todo
    )
);

const todosReducer = createReducer([AddTodo, ToggleTodo], [] /*initial state*/);
```

## All combined

```typescript
const AddTodo = describeAction('ADD_TODO', (prev: Todo[], text: string) =>
  prev.concat([{ text, completed: false }])
);

const ToggleTodo = describeAction(
  'TOGGLE_TODO',
  (prev: Todo[], index: number) =>
    prev.map(
      (todo, i) =>
        index === i ? { text: todo.text, completed: !todo.completed } : todo
    )
);

const todosReducer = createReducer([AddTodo, ToggleTodo], [] /*initial state*/);
```

Also you can omit payload:

```typescript
const Increment = describeAction('Inc', (prev: number) => prev + 1);
const Decrement = describeAction('Dec', (prev: number) => prev - 1);

// Doesn't require payload argument
const increment = Increment.create(); // {type: 'Inc', payload: undefined}

//handler
const result = Increment.handle(0); // result === 1

const reducer = createReducer([Increment, Decrement], 0);
```

## Yet another typescript redux library?

I love redux but I hate writing boilerplate code. So I thought through api that would have a small api surface yet would useful regardless how you write your redux code. So my goals were:

- collocate action tag, shape of payload, the way to handle the action. So I would look at exactly one place for any action related stuff.
- do so with as little syntax as possible leveraging type inference.
- small api surface and small bundle size.
- make it decomposable. So it's a collections of small pieces that work really nice together rather than "one big thing". So it is still useful with or without other libraries (Ex: I use [unionize](https://github.com/pelotom/unionize) to model state)

I was unable to find anything I really like so here you go.

## API

Action descriptions types can be essentially split into two interfaces (thanks to typescript 2.7 conditional types):

```typescript
// With payload
interface ActionDesc<TType extends string, TState, TPayload> {
  type: TType;
  handle: (prev: TState, payload: TPayload) => TState;
  create: (payload: TPayload) => { type: TType; payload: TPayload };
  isMine: (action: Action) => action is { type: TType; payload: TPayload };
}

//No payload
interface ActionDesc<TType extends string, TState> {
  type: TType;
  handle: (prev: TState) => TState;
  create: () => { type: TType };
  isMine: (action: Action) => action is { type: TType };
}
```

It is just 2 functions:

```typescript
// create action description
const describeAction: Describe;

type Describe = {
  // no payload `overload`
  <TType extends string, TState>(
    type: TType,
    handle: (prev: TState) => TState
  ): ActionDesc<TType, TState, void>;

  // with payload
  <TType extends string, TState, TPayload>(
    type: TType,
    handle: (prev: TState, payload: TPayload) => TState
  ): ActionDesc<TType, TState, TPayload>;
};

// combine all descriptions into one reducer
function createReducer<TState>(
  descriptions: ActionDesc<string, TState, any>[],
  initialState: TState
): Reducer<TState, Action<string>>;
```

## Breaking changes from 1.0 release.

- No more `describeSimple`. Use `describeAction` instead
- Requires ts > 2.7 to support conditional types

## Projects worth checking out

### ts-action (https://github.com/cartant/ts-action)

Addresses the same problem with more options.

### unionize (https://github.com/pelotom/unionize)

Amazing library to create tagged unions. As it turned out you can think of redux actions as tagged union :)

### redux-typed-action (https://www.npmjs.com/package/redux-typed-action)

Almost identical api (doesn't have typeguards?)
