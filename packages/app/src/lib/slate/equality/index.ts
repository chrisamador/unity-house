import { deepEqualityFn } from "./deep";
import { shallowEqualityFn } from "./shallow";

type EqualityFnType = <S>(a: S, b: S) => boolean;

export const equalityFn = {
  deep: deepEqualityFn as EqualityFnType,
  shallow: shallowEqualityFn as EqualityFnType,
  atomic(a, b) {
    return a === b;
  },
  status(a, b) {
    if (!a || !b) return false;
    // @ts-expect-error status is being checked
    if (!a.status || !b.status) return false;
    // @ts-expect-error status is being checked
    return a.status === b.status;
  },
  /**
   * string[] */
  stringArray(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    return a.join() === b.join();
  },
  /**
   * string[][] */
  stringArrayArray(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return false;
    }
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      const aInnerArray = a[i];
      const bInnerArray = b[i];
      if (!Array.isArray(aInnerArray) || !Array.isArray(bInnerArray)) {
        return false;
      }

      if (aInnerArray.join() !== bInnerArray.join()) {
        return false;
      }
    }
    return true;
  },
} as const satisfies { [id: string]: EqualityFnType };

export type EqualityKeysType = keyof typeof equalityFn;
