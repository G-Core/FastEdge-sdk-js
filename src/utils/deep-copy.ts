/**
 * Creates a deep copy of an object.
 * @param obj - The object to copy.
 * @returns A deep copy of the object.
 */
const deepCopy = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }

  // Handle other typed arrays
  if (obj instanceof Uint8Array) {
    return new Uint8Array(obj) as T;
  }

  if (obj instanceof Uint16Array) {
    return new Uint16Array(obj) as T;
  }

  if (obj instanceof Uint32Array) {
    return new Uint32Array(obj) as T;
  }

  if (Array.isArray(obj)) {
    // Create a new array with deep copied elements
    const copiedArray = obj.map((item) => deepCopy(item)) as T;

    // Copy any additional properties that were added to the array
    // eslint-disable-next-line no-restricted-syntax
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip numeric indices as they're already handled by map()
        // eslint-disable-next-line unicorn/no-lonely-if
        if (Number.isNaN(Number(key))) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (copiedArray as any)[key] = deepCopy((obj as any)[key]);
        }
      }
    }

    // Copy symbol properties for arrays
    const symbolKeys = Object.getOwnPropertySymbols(obj);
    for (const sym of symbolKeys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (copiedArray as any)[sym] = deepCopy((obj as any)[sym]);
    }

    return copiedArray;
  }

  if (typeof obj === 'object') {
    const copied = {} as T;

    // Copy string/numeric keys
    // eslint-disable-next-line no-restricted-syntax
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copied[key] = deepCopy(obj[key]);
      }
    }

    // Copy symbol keys
    const symbolKeys = Object.getOwnPropertySymbols(obj);
    for (const sym of symbolKeys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (copied as any)[sym] = deepCopy((obj as any)[sym]);
    }

    return copied;
  }

  return obj;
};

export { deepCopy };
