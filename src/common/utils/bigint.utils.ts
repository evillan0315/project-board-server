/**
 * Recursively serializes BigInt values in an object or array to strings.
 * This is necessary because JSON.stringify cannot handle BigInts natively.
 *
 * @param data The object or array to serialize.
 * @returns The serialized object or array with BigInts converted to strings.
 */
export function serializeBigInt(data: any): any {
  if (typeof data === 'bigint') {
    return data.toString();
  }
  if (Array.isArray(data)) {
    return data.map(serializeBigInt);
  }
  if (typeof data === 'object' && data !== null) {
    // Handle Date objects specifically to avoid recursive serialization of their internal structure
    if (data instanceof Date) {
      return data.toISOString();
    }
    const newObject: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObject[key] = serializeBigInt(data[key]);
      }
    }
    return newObject;
  }
  return data;
}
