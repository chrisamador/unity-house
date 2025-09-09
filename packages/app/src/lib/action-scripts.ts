import { createSubscription } from "./create-subscription";

export type ActionsType = Record<
  string,
   
  (payload?: any) => Promise<any> | any
>;

type StringKeys<T> = Extract<T, string>;
type AppendResults<R> = `${StringKeys<R>}:result`;

interface OnType<A extends ActionsType> {
  <T extends keyof A, R extends Awaited<ReturnType<A[T]>>>(
    type: AppendResults<T>,
    cb: (p: R) => void,
  ): () => void;
  <T extends keyof A, P extends Parameters<A[T]>[0]>(
    type: T,
    cb: (p: P) => void,
  ): () => void;
}

export interface CreateSuperActionsReturn<A extends ActionsType> {
  handlers: {
    [K in keyof A]: A[K];
  };
  on: OnType<A>;
}

export function createActionsScripts<A extends ActionsType>(
  actionObj: A,
): CreateSuperActionsReturn<A> {
  type K = keyof A;
  // the action parameter
  type P = Parameters<A[K]>[0];

  const subscription = createSubscription<{
    type: K | AppendResults<K>;
    payload: P;
  }>();

  const keys = Object.keys(actionObj) as unknown as K[];

  const handlers = {} as CreateSuperActionsReturn<A>["handlers"];

  keys.forEach((key) => {
    // @ts-expect-error type is correct
    handlers[key] = async (payload?: P) => {
      // dispatch event
      subscription.notify({ type: key, payload });
      // process the action
      const res = await actionObj[key](payload);
      // dispatch end event
      subscription.notify({ type: `${String(key)}:result`, payload: res });
      return res;
    };
  });

  function on(name: string, cb: (payload: unknown) => void) {
    return subscription.subscribe(({ type, payload }) => {
      if (type === name) {
        cb(payload);
      }
    });
  }

  return {
    handlers,
    on,
  };
}
