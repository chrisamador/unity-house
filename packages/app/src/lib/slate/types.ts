import { useSlate } from "./index";

export type ValidRecipeReturnType<S> =
  | S
  | void
  | undefined
  | (S extends undefined ? void : never);

export type UseSlateStoreType<S> = ReturnType<typeof useSlate<S>>;
