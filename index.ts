type Action = { type: string };
type Reducer<S> = (prev: S | undefined, action: Action) => S;

type ActionShape<TType extends string, TPayload> = TPayload extends void
  ? { type: TType; payload: undefined }
  : { type: TType; payload: TPayload };

type Handler<TState, TPayload> = TPayload extends void
  ? { (prev: TState): TState }
  : { (prev: TState, payload: TPayload): TState };

type Creator<TType extends string, TPayload> = TPayload extends void
  ? (payload?: undefined) => ActionShape<TType, void>
  : (payload: TPayload) => ActionShape<TType, TPayload>;

export interface ActionDesc<TType extends string, TState, TPayload> {
  //tag: 'with payload';
  type: TType;
  handle: Handler<TState, TPayload>;
  create: Creator<TType, TPayload>;
  isMine: (action: Action) => action is ActionShape<TType, TPayload>;
}

function describeA<TType extends string, TState, TPayload>(
  type: TType,
  handle: Handler<TState, TPayload>
): ActionDesc<TType, TState, TPayload> {
  // TODO type check?
  const create: any = (payload: TPayload) => ({
    type,
    payload
  });

  return {
    type,
    handle,
    isMine: (action): action is ActionShape<TType, TPayload> =>
      action.type === type,
    create
  };
}

type Describe = {
  <TType extends string, TState>(
    type: TType,
    handle: (prev: TState) => TState
  ): ActionDesc<TType, TState, void>;

  <TType extends string, TState, TPayload>(
    type: TType,
    handle: (prev: TState, payload: TPayload) => TState
  ): ActionDesc<TType, TState, TPayload>;
};

export const describeAction = (describeA as any) as Describe;

export function createReducer<TState>(
  descriptions: ActionDesc<string, TState, any>[],
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
