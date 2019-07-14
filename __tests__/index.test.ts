import 'jest';
import { createReducer, describeAction } from '../src/index';

describe('action/handler cases', () => {
  const Add = describeAction(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );

  test('handler returns new state', () => {
    expect(Add.handle(1, 2)).toBe(3);
  });

  test(`handler for simple action doesn't need payload`, () => {
    const Increment = describeAction('INC', (prev: number) => prev + 1);
    expect(Increment.handle(1)).toBe(2);
  });

  test('action creator puts data into payload prop', () => {
    const action = Add.create(2);
    expect(action).toEqual({ type: 'ADD', payload: 2 });
  });

  test('isMine satisfies itself', () => {
    const action = Add.create(2);

    expect(Add.isMine(action)).toBeTruthy();
  });

  test('simple actions are not reused', () => {
    const Inc = describeAction('INC', (prev: number) => prev + 1);
    expect(Inc.create() === Inc.create()).toBe(false);
    expect(Inc.create()).toEqual(Inc.create());
  });
});

describe('reducer cases', () => {
  const Add = describeAction(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );

  test('createReducer puts proper initialState', () => {
    const initial = 100500;
    const reducer = createReducer([Add], initial);
    expect(reducer(undefined, { type: 'unrelated action' })).toEqual(initial);
  });

  test('createReducer takes simple and payload actions', () => {
    const Increment = describeAction('INC', (prev: number) => prev + 1);
    const reducer = createReducer([Add, Increment], 0);
    expect(reducer(undefined, Increment.create())).toEqual(1);
    expect(reducer(undefined, Add.create(5))).toEqual(5);
  });

  test('reducer passes payload to handler', () => {
    const reducer = createReducer([Add], 0);
    const action = { type: Add.type, payload: 123 };
    expect(reducer(undefined, action)).toEqual(123);
  });
});

describe('sum type for payload works ex: A | B', () => {
  const Add = describeAction(
    'add some',
    (prev: number, trueOrNum: true | number) =>
      prev + (trueOrNum === true ? 1 : trueOrNum)
  );

  const Inc = describeAction('inc by 1', (prev: number) => prev + 1);

  test('can invoke action creator with no ts error', () => {
    const initial = 0;
    const reducer = createReducer([Add], initial);
    expect(reducer(undefined, Add.create(true))).toEqual(1);
    expect(reducer(undefined, Add.create(2))).toEqual(2);
  });

  test('Can combine simple actions or with payload in one reducer ', () => {
    const initial = 0;
    const reducer = createReducer([Add, Inc], initial);
    expect(reducer(undefined, Inc.create())).toEqual(1);
  });
});
