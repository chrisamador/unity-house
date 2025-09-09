import { UseSlateStoreType } from "../../lib/slate/types";
import { AsyncStateType } from "../../lib/types/async-state";

export type LoadedStateType = {};
export type BaseContextStateType = AsyncStateType<LoadedStateType>;

export type BaseContextType = {
  state: UseSlateStoreType<BaseContextStateType>;
};
