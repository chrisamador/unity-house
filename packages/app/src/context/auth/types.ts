import { Doc } from "@unity-house/api/convex/_generated/dataModel";
import { UseSlateStoreType } from "../../lib/slate/types";
import { AsyncStateType } from "../../lib/types/async-state";
import { createAuthActions } from "./actions";


export type LoadedAuthStateType = {
  accessToken: string;
  user: Doc<'users'>;
  sealedSession?: string;
};
export type AuthStateType = AsyncStateType<LoadedAuthStateType>;

export type AuthType = {
  state: UseSlateStoreType<AuthStateType>;
  actions: ReturnType<typeof createAuthActions>;
};


