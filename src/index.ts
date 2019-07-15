export type Action<Type extends string, Payload = undefined> = {
  type: Type;
  payload: Payload;
};

type AnyAction = { type: string };
type Reducer<S> = (prev: S | undefined, action: AnyAction) => S;

export interface ActionDesc<TType extends string, TState, TPayload> {
  type: TType;
  (payload: TPayload): Action<TType, TPayload>;
  handle: (prev: TState, payload: TPayload) => TState;
  create: (payload: TPayload) => Action<TType, TPayload>;
  isMine: (action: AnyAction) => action is Action<TType, TPayload>;
}

export interface ActionSimpleDesc<TType extends string, TState> {
  type: TType;
  (): Action<TType>;
  handle: (prev: TState) => TState;
  create: () => Action<TType>;
  isMine: (action: AnyAction) => action is Action<TType>;
}

export const describeAction: Describe = (
  type: string,
  handle: (state: unknown, payload: unknown) => unknown
) => {
  let create: Function;
  switch (handle.length) {
    case 1: {
      const action = Object.freeze({ type, payload: undefined });
      create = () => action;
      break;
    }
    default:
      create = (payload: unknown) => ({ type, payload });
  }

  return Object.assign(create, {
    create,
    type,
    handle,
    isMine: (a: AnyAction) => a.type === type
  }) as any;
};

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

export function createReducer<TState>(
  descriptions: (
    | ActionDesc<string, TState, any>
    | ActionSimpleDesc<string, TState>)[],
  initialState: TState
): Reducer<TState> {
  const map: {
    [key: string]: ((prev: TState, payload: unknown) => TState) | undefined;
  } = {};

  for (const desc of descriptions) map[desc.type] = desc.handle;

  return function reducer(
    prev: TState | undefined,
    action: AnyAction & { payload?: any }
  ): TState {
    prev = prev || initialState;
    const handle = map[action.type];
    if (!handle) {
      return prev;
    }

    return handle.length === 1
      ? (handle as any)(prev)
      : handle(prev, action.payload);
  };
}
