export function shallowEqualityFn<T>(
  objA: T,
  objB: T,
  config?: {
    /**
     * @todo refactor this fn to by default check for objects
     *
     * The reason we have the follow sentence below
     * "If the values are objects we don't want to compare them deeply"
     * is because in some situations we want to dynamic create an object
     * and we don't want to have it checked. But we shouldn't allow for that.
     * If using equalityFn: "shallow" that means all shallow values will be checked
     * and if they match the entire object is equal. Not checking for values
     * that are objects break that. If a dev wants to create dynamic objects
     * they shouldn't be using equalityFn: "shallow" on the containing object.
     * They should create the dynamic object as the object being checked.
     * */
    allowObjectCheck?: boolean;
  },
): boolean {
  if (Object.is(objA, objB)) {
    // console.info("Object.is(objA, objB) is true");
    return true;
  }
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    // console.info("2 is false");

    return false;
  }

  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;

    for (const [key, value] of objA) {
      if (!Object.is(value, objB.get(key))) {
        // console.info("3 is false");

        return false;
      }
    }
    // console.info("4 is true");

    return true;
  }

  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) {
      // console.info("5 is false");

      return false;
    }

    for (const value of objA) {
      if (!objB.has(value)) {
        // console.info("6 is false");

        return false;
      }
    }
    // console.info("7 is true");

    return true;
  }

  if (Array.isArray(objA) && Array.isArray(objB)) {
    if (objA.length !== objB.length) {
      // console.info("8 is false");

      return false;
    }
    for (let i = 0; i < objA.length; i++) {
      if (!Object.is(objA[i], objB[i])) {
        // console.info("9 is false");

        return false;
      }
    }
    // console.info("10 is true");

    return true;
  }

  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) {
    // console.info("11 is false");

    return false;
  }
  for (let i = 0; i < keysA.length; i++) {
    const hasProp = Object.prototype.hasOwnProperty.call(
      objB,
      keysA[i] as string,
    );
    const objAValue = objA[keysA[i] as keyof T];
    const objBValue = objB[keysA[i] as keyof T];

    const hasSameValue = Object.is(objAValue, objBValue);

    // If the values are objects we don't want to compare them deeply
    const areObjects =
      // We don't consider null as an object
      objAValue !== null &&
      objBValue !== null &&
      typeof objAValue === "object" &&
      typeof objBValue === "object";

    if (
      !hasProp ||
      (!hasSameValue && !areObjects) ||
      (config?.allowObjectCheck && !hasSameValue)
    ) {
      // console.info("12 is false", {
      //   hasProp,
      //   hasSameValue,
      //   areObjects,
      //   objAValue,
      //   objBValue,
      // });

      return false;
    }
  }
  // console.info("13 is true");

  return true;
}
