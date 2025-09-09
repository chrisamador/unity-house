import { useMemo, useRef } from "react";

import { Draft, enableMapSet, produce } from "immer";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import { createSubscription } from "../create-subscription";
import { equalityFn, EqualityKeysType } from "./equality";
import { ValidRecipeReturnType } from "./types";

enableMapSet();

export function useSlate<S>(init: S) {
  const _state = useRef(init);
  const subscription = useMemo(
    () => createSubscription<{ state: S; prev: S }>(),
    [],
  );

  function getState() {
    return _state.current;
  }

  function setState(cb: (draft: Draft<S>) => ValidRecipeReturnType<Draft<S>>) {
    const prev = _state.current;
    const state = produce(prev, cb);
    if (state !== prev) {
      _state.current = state;
      subscription.notify({ state, prev });
    }
  }

   
  function useGetState<R extends (state: S) => any>(
    selector: R,
    equalityKey: EqualityKeysType = "atomic",
  ) {
    /**
     * https://github.com/facebook/react/blob/main/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js */
    return useSyncExternalStoreWithSelector<S, ReturnType<R>>(
      subscription.subscribe,
      getState,
      getState,
      selector,
      equalityFn[equalityKey],
    );
  }

  const { subscribe } = subscription;

  return useMemo(
    () => ({
      getState,
      setState,
      useGetState,
      subscribe,
    }),
    [],
  );
}
