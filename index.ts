import { Action, Reducer } from 'redux';

export type PayloadAction<TType extends string, TPayload> = {
  type: TType;
  payload: TPayload;
};

export type SimpleAction<TType extends string> = { type: TType };

export type Handler<TState, TPayload> = (
  prev: TState,
  payload: TPayload
) => TState;

export type SimpleHandler<TState> = (prev: TState) => TState;

const enum ActionType {
  SIMPLE = 0,
  WITH_PAYLOAD = 1
}

export interface ActionDesc<TType extends string, TState, TPayload = void> {
  tag: ActionType.WITH_PAYLOAD;
  type: TType;
  handler: Handler<TState, TPayload>;
  create: (payload: TPayload) => Action<TType>;
  isMine: (action: Action) => action is PayloadAction<TType, TPayload>;
}

export interface SimpleActionDesc<TType extends string, TState> {
  tag: ActionType.SIMPLE;
  type: TType;
  handler: SimpleHandler<TState>;
  create: () => Action<TType>;
  isMine: (action: Action) => action is SimpleAction<TType>;
}

export function createAction<TType extends string, TState, TPayload>(
  type: TType,
  handler: (prev: TState, payload: TPayload) => TState
): ActionDesc<TType, TState, TPayload> {
  return {
    tag: ActionType.WITH_PAYLOAD,
    type,
    handler,
    isMine: (action): action is PayloadAction<TType, TPayload> =>
      action.type === type,
    create: payload => ({ type, payload })
  };
}

export function createSimpleAction<TType extends string, TState>(
  type: TType,
  handler: (prev: TState) => TState
): SimpleActionDesc<TType, TState> {
  const action = { type };
  return {
    tag: ActionType.SIMPLE,
    type,
    handler,
    isMine: (action): action is SimpleAction<TType> => action.type === type,
    create: () => action
  };
}

type AnyType = any;

type AnyActionDesc<TState> =
  | ActionDesc<string, TState, AnyType>
  | SimpleActionDesc<string, TState>;

export function createReducer<TState>(
  actions: AnyActionDesc<TState>[],
  initialState: TState
): Reducer<TState, Action<string>> {
  const descriptions: {
    [key: string]: AnyActionDesc<TState> | undefined;
  } = actions.reduce((prev, cur) => ({ ...prev, [cur.type]: cur }), {});

  return function reducer(
    prev: TState = initialState,
    action: Action<string> & { payload?: AnyType }
  ): TState {
    const desc = descriptions[action.type];
    if (!desc) {
      return prev;
    }

    return desc.tag === ActionType.SIMPLE
      ? desc.handler(prev)
      : desc.handler(prev, action.payload);
  };
}
