import { createActionDesc, createReducer } from '../index';

test('handler returns new state', () => {
  const add = createActionDesc(
    'ADD',
    (prev: number, addition: number) => prev + addition
  );
  expect(add.handler(1, 2)).toBe(3);
});

test('handler can omit payload', () => {
  const inc = createActionDesc('INC', (prev: number) => prev + 1);
  inc.create(undefined);
  expect(inc.handler(1, undefined)).toBe(2);
});

test('action creator put data into payload prop', () => {
  const add = createActionDesc('add', (prev: number, n: number) => prev + n);
  const action = add.create(2);
  expect(action).toEqual({ type: 'add', payload: 2 });
});

test('isMine satisfies itself', () => {
  const add = createActionDesc('add', (prev: number, n: number) => prev + n);
  const action = add.create(2);
  expect(add.isMine(action)).toBeTruthy();
});

test('createReducer puts proper initialState', () => {
  const add = createActionDesc('add', (prev: number, n: number) => prev + n);
  const reducer = createReducer([add], 1);
  expect(add.isMine(action)).toBeTruthy();
});
