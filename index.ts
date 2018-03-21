export type Action = { type: string };
export type Reducer<S> = (prev: S | undefined, action: Action) => S;

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

export interface ActionDesc<TType extends string, TState, TPayload> {
  tag: 'with payload';
  type: TType;
  handle: Handler<TState, TPayload>;
  create: (payload: TPayload) => PayloadAction<TType, TPayload>;
  isMine: (action: Action) => action is PayloadAction<TType, TPayload>;
}

export interface SimpleActionDesc<TType extends string, TState> {
  tag: 'simple';
  type: TType;
  handle: SimpleHandler<TState>;
  create: () => SimpleAction<TType>;
  isMine: (action: Action) => action is SimpleAction<TType>;
}

export function createAction<TType extends string, TState, TPayload>(
  type: TType,
  handle: (prev: TState, payload: TPayload) => TState
): ActionDesc<TType, TState, TPayload> {
  return {
    tag: 'with payload',
    type,
    handle,
    isMine: (action): action is PayloadAction<TType, TPayload> =>
      action.type === type,
    create: payload => ({ type, payload })
  };
}

export function createSimpleAction<TType extends string, TState>(
  type: TType,
  handle: (prev: TState) => TState
): SimpleActionDesc<TType, TState> {
  const action = { type };
  return {
    tag: 'simple',
    type,
    handle,
    isMine: (action): action is SimpleAction<TType> => action.type === type,
    create: () => action
  };
}

export type AnyActionDesc<TState> =
  | ActionDesc<string, TState, any>
  | SimpleActionDesc<string, TState>;

export function createReducer<TState>(
  actions: AnyActionDesc<TState>[],
  initialState: TState
): Reducer<TState> {
  const descriptions: {
    [key: string]: AnyActionDesc<TState> | undefined;
  } = actions.reduce((prev, cur) => ({ ...prev, [cur.type]: cur }), {});

  return function reducer(
    prev: TState = initialState,
    action: Action & { payload?: any }
  ): TState {
    const desc = descriptions[action.type];
    if (!desc) {
      return prev;
    }

    return desc.tag === 'simple'
      ? desc.handle(prev)
      : desc.handle(prev, action.payload);
  };
}
