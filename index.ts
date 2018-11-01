type Action = { type: string };
type Reducer<S> = (prev: S | undefined, action: Action) => S;

type ActionShape<TType extends string, TPayload> = TPayload extends void
  ? { type: TType; payload: undefined }
  : { type: TType; payload: TPayload };

export interface ActionDesc<TType extends string, TState, TPayload> {
  type: TType;
  handle: (prev: TState, payload: TPayload) => TState;
  create: (payload: TPayload) => ActionShape<TType, TPayload>;
  isMine: (action: Action) => action is ActionShape<TType, TPayload>;
}

export interface ActionSimpleDesc<TType extends string, TState> {
  type: TType;
  handle: (prev: TState) => TState;
  create: () => ActionShape<TType, void>;
  isMine: (action: Action) => action is ActionShape<TType, void>;
}

const describeA = <TType extends string, TState, TPayload>(
  type: TType,
  handle: (prev: TState, payload: TPayload) => TState
): ActionDesc<TType, TState, TPayload> => ({
  type,
  handle,
  isMine: (action): action is ActionShape<TType, TPayload> =>
    action.type === type,
  create: (payload: TPayload) =>
    ({
      type,
      payload
    } as ActionShape<TType, TPayload>)
});

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

export const describeAction = (describeA as any) as Describe;

export function createReducer<TState>(
  descriptions: (
    | ActionDesc<string, TState, any>
    | ActionSimpleDesc<string, TState>)[],
  initialState: TState
): Reducer<TState> {
  const map: {
    [key: string]: ActionDesc<string, TState, any> | undefined;
  } = descriptions.reduce((prev, cur) => ({ ...prev, [cur.type]: cur }), {});

  return function reducer(
    prev: TState = initialState,
    action: Action & { payload?: any }
  ): TState {
    const desc = map[action.type];
    if (!desc) {
      return prev;
    }

    // TODO type check?
    return (desc.handle as any)(prev, action.payload);
  };
}
