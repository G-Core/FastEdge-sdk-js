/* eslint-disable unicorn/prefer-code-point */

const createTestFileBinaryArray = (strValue = 'Hello') =>
  new Uint8Array([...strValue].map((char) => char.charCodeAt(0)));

export { createTestFileBinaryArray };
