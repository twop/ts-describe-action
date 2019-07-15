# ts-describe-action

reduce redux boilerplate and leverage typescript safety

## Installation

```
npm add ts-describe-action
```

Note: requires typescript version >= 2.8

## Motivation

```typescript
// typical redux boilerplate with typesctipt
const ADD_TODO = 'ADD_TODO';

type AddTodoAction = { type: typeof ADD_TODO; text: string };
const addTodo = (text: string): AddTodoAction => ({ type: ADD_TODO, text });

const TOGGLE_TODO = 'TOGGLE_TODO';

type ToggleTodoAction = { type: typeof TOGGLE_TODO; index: number };
const toggleTodo = (index: number): ToggleTodoAction => ({
  type: TOGGLE_TODO,
  index
});

type Todo = { text: string; completed: boolean };

function todosReducer(prev: Todo[] = [], action: Action): Todo[] {
  switch (action.type) {
    case ADD_TODO: {
      const { text } = <AddTodoAction>action;
      return [...prev, { text, completed: false }];
    }
    case TOGGLE_TODO: {
      const { index } = <ToggleTodoAction>action;
      return prev.map((todo, i) =>
        index === i ? { text: todo.text, completed: !todo.completed } : todo
      );
    }
    default:
      return state;
  }
}

// usage
dispatch(addTodo('reduce boilerplate'));
dispatch(toggleTodo(0));
```

Most of that is by design: we need to decouple intent & effect. But what if we rely on typescript to keep us honest but with less hassle?

## The same code rewritten with this library

```typescript
import { createReducer, describeAction } from 'ts-describe-action';

type Todo = { text: string; completed: boolean };

// return value is an action creator function with a couple extra properties
const addTodo = describeAction('ADD_TODO', (prev: Todo[], text: string) => [
  ...prev,
  { text, completed: false }
]);

const toggleTodo = describeAction(
  'TOGGLE_TODO',
  (prev: Todo[], index: number) =>
    prev.map((todo, i) =>
      index === i ? { text: todo.text, completed: !todo.completed } : todo
    )
);

// combines handlers into a single reducer function
const todosReducer = createReducer([addTodo, toggleTodo], [] /*initial state*/);

// usage as with normal action creators
// note that addTodo & toggleTodo are typesafe. Payload type is inferred
dispatch(addTodo('reduce boilerplate'));
dispatch(toggleTodo(0));
```

## You don't have to rewrite anything in your existing code

The library is designed for gradual adoption. So you can use individual features independently from each other.

### Using `isMine` typeguard and `handle` functions in your normal reducer

```ts
// normal action
const ADD_TODO = 'ADD_TODO';
type AddTodoAction = { type: typeof ADD_TODO; text: string };
const addTodo = (text: string): AddTodoAction => ({ type: ADD_TODO, text });

// newly declared action
const toggleTodo = describeAction(
  'TOGGLE_TODO',
  (prev: Todo[], index: number) =>
    prev.map((todo, i) =>
      index === i ? { text: todo.text, completed: !todo.completed } : todo
    )
);

// your normal reducer function
function todosReducer(state: Todo[] = [], action: Action): Todo[] {
  switch (action.type) {
    case ADD_TODO: {
      const { text } = <AddTodoAction>action;
      return [...prev, { text, completed: false }];
    }
    default: {
      if (toggleTodo.isMine(action)) {
        // here type of action.payload is number
        // note that type ('TOGGLE_TODO') is also available as toggleTodo.type
        return toggleTodo.handle(state, action.payload);
      }

      return state;
    }
  }
}
```

### Old `create` function is still there

In the prev versions of the library the result of `describeAction` was an object with a property `create` that was an action creator.

Now the result of `describeAction` is a function that itself is an action creator but has all the same properties as before. Therefore backwards compatible.

```ts
const addTodo = describeAction('ADD_TODO', (prev: Todo[], text: string) => [
  ...prev,
  { text, completed: false }
]);

const add = addTodo('check new api');
// {type: 'ADD_TODO', payload: 'check new api'}

const add2 = addTodo.create('old api is still there');
// {type: 'ADD_TODO', payload: 'old api is still there'}
```

## Supports actions with no payload

Just omit payload argument:

```typescript
const increment = describeAction('Inc', (prev: number) => prev + 1);
const decrement = describeAction('Dec', (prev: number) => prev - 1);

// Doesn't require payload argument
const inc = increment(); // {type: 'Inc', payload: undefined}

//handler
const result = increment.handle(0); // result === 1

const reducer = createReducer([increment, decrement], 0);
```

## Yet another typescript redux library?

I love redux but I hate writing boilerplate code. So I wanted an api that would have a small api surface yet would be useful regardless how you write your redux code. So my goals were:

- collocate action tag, shape of payload and the way to handle the action. So I would look at exactly one place for any action related stuff.
- do so with as little syntax as possible leveraging type inference.
- small api surface and small bundle size.
- make it useful for "brownfield" project. You can try to convert a small reducer function and go from there.
- make it decomposable. So it's a collections of small pieces that work really nicely together rather than "one big thing". So it is still useful with or without other libraries (Ex: I use [unionize](https://github.com/pelotom/unionize) to model state)

I was unable to find anything I really liked, so here you go.

## API

There are two types of action descriptions:

```typescript
// With payload
export interface ActionDesc<TType extends string, TState, TPayload> {
  // this is an action creator function
  (payload: TPayload): Action<TType, TPayload>;

  // literal type like 'ADD_TODO'
  type: TType;

  // the reducer function. Note that it takes payload not the action itself
  handle: (prev: TState, payload: TPayload) => TState;

  // this is for backward compatibility. ActionDesc used be just an object
  create: (payload: TPayload) => Action<TType, TPayload>;

  // typeguard for working with actions manually
  isMine: (action: AnyAction) => action is Action<TType, TPayload>;
}

// No payload
export interface ActionSimpleDesc<TType extends string, TState> {
  // this is an action creator function with no arguments
  (): Action<TType>;

  type: TType;
  handle: (prev: TState) => TState;
  create: () => Action<TType>;
  isMine: (action: AnyAction) => action is Action<TType>;
}
```

The API itself is just 2 functions:

```typescript
// create action description
const describeAction: Describe;

type Describe = {
  <TType extends string, TState>(
    type: TType,
    handle: (prev: TState) => TState
  ): ActionSimpleDesc<TType, TState>;

  <TType extends string, TState, TPayload>(
    type: TType,
    handle: (prev: TState, payload: TPayload) => TState
  ): ActionDesc<TType, TState, TPayload>;
};

// combine all descriptions into one reducer
export function createReducer<TState>(
  descriptions: (
    | ActionDesc<string, TState, any>
    | ActionSimpleDesc<string, TState>)[],
  initialState: TState
): Reducer<TState>;
```

## Breaking changes from 1.0 release.

- No more `describeSimple`. Use `describeAction` instead
- Requires ts > 2.8 to support conditional types

## Projects worth checking out

### ts-action (https://github.com/cartant/ts-action)

Addresses the same problem with more options.

### unionize (https://github.com/pelotom/unionize)

Amazing library to create tagged unions. As it turned out you can think of redux actions as tagged union :)

### redux-typed-action (https://www.npmjs.com/package/redux-typed-action)

Almost identical api (doesn't have typeguards?)
