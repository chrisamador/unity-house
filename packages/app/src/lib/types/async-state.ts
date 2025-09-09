export type AsyncLoadedStateType<P> = {
  status: "loaded";
} & P;

type AsyncErrorStateType<E> = {
  status: "error";
  message: string;
} & E;

export type AsyncStateType<P, E = {}> =
  | { status: "idle" }
  | { status: "loading" }
  | AsyncErrorStateType<E>
  | AsyncLoadedStateType<P>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractLoadedStateType<T extends AsyncStateType<any>> = T extends {
  status: "loaded";
}
  ? T
  : never;
