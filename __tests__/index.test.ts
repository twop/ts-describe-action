import { createActionDesc, createReducer } from '../index';

describe('action/handler cases', () => {
  const Add = createActionDesc(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );

  test('handler returns new state', () => {
    expect(Add.handler(1, 2)).toBe(3);
  });

  test('handler can omit payload', () => {
    const Increment = createActionDesc('INC', (prev: number) => prev + 1);
    Increment.create(undefined); // NOTE you can put only undefined here.
    expect(Increment.handler(1, undefined)).toBe(2);
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
  const Add = createActionDesc(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );

  test('createReducer puts proper initialState', () => {
    const initial = 100500;
    const reducer = createReducer([Add], initial);
    expect(reducer(undefined, { type: 'unrelated action' })).toEqual(initial);
  });

  test('reducer passes payload to handler', () => {
    const reducer = createReducer([Add], 0);
    const action = { type: Add.type, payload: 123 };
    expect(reducer(undefined, action)).toEqual(123);
  });
});
