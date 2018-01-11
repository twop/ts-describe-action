import { Action, Reducer } from 'redux';

export type TypedAction<TType extends string, TPayload> = {
  type: TType;
  payload: TPayload;
};

export type Handler<TState, TPayload> = (
  prev: TState,
  payload: TPayload
) => TState;

export interface ActionDesc<TType extends string, TState, TPayload> {
  type: TType;
  handler: Handler<TState, TPayload>;
  create: (payload: TPayload) => Action<TType>;
  isMine: (action: Action) => action is TypedAction<TType, TPayload>;
}

export function createActionDesc<TType extends string, TState, TPayload = void>(
  type: TType,
  handler: (prev: TState, payload: TPayload) => TState
): ActionDesc<TType, TState, TPayload> {
  return {
    type,
    handler,
    isMine: (action): action is TypedAction<TType, TPayload> =>
      action.type === type,
    create: payload => ({ type, payload })
  };
}

type AnySimpleType = any;

export function createReducer<TState>(
  actions: ActionDesc<string, TState, AnySimpleType>[],
  initialState: TState
): Reducer<TState, Action<string>> {
  const allHandlers: {
    [key: string]: Handler<TState, AnySimpleType> | undefined;
  } = actions.reduce((prev, cur) => ({ ...prev, [cur.type]: cur.handler }), {});

  return function reducer(
    prev: TState = initialState,
    action: Action<string> & { payload?: AnySimpleType }
  ): TState {
    const handler = allHandlers[action.type];
    const { payload = {} } = action;
    return handler ? handler(prev, payload) : prev;
  };
}
