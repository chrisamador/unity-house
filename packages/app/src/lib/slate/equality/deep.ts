function isObject<T>(obj: T) {
  return obj !== null && typeof obj === "object";
}

export function deepEqualityFn<T>(obj1: T, obj2: T) {
  if (obj1 === obj2) {
    return true;
  }

  if (!isObject(obj1) || !isObject(obj2)) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    // @ts-expect-error This a valid check
    if (!keys2.includes(key) || !deepEqualityFn(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
