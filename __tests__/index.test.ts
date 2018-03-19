import 'jest';
import { createAction, createReducer, createSimpleAction } from '../index';

describe('action/handler cases', () => {
  const Add = createAction(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );

  test('handler returns new state', () => {
    expect(Add.handler(1, 2)).toBe(3);
  });

  test('handler for simple action doesnt need payload', () => {
    const Increment = createSimpleAction('INC', (prev: number) => prev + 1);
    expect(Increment.handler(1)).toBe(2);
  });

  test('action creator put data into payload prop', () => {
    const action = Add.create(2);
    expect(action).toEqual({ type: 'ADD', payload: 2 });
  });

  test('isMine satisfies itself', () => {
    const action = Add.create(2);
    expect(Add.isMine(action)).toBeTruthy();
  });
});

describe('reducer cases', () => {
  const Add = createAction(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );

  test('createReducer puts proper initialState', () => {
    const initial = 100500;
    const reducer = createReducer([Add], initial);
    expect(reducer(undefined, { type: 'unrelated action' })).toEqual(initial);
  });

  test('createReducer takes simple and payload actions', () => {
    const Increment = createSimpleAction('INC', (prev: number) => prev + 1);
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
