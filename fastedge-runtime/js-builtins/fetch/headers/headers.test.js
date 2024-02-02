import { Headers, injectFastEdgeHeaders, stringifyHeaders } from '.';

describe('Headers', () => {
  describe('new Headers', () => {
    it('should create an empty Headers object when no init is provided', () => {
      expect.assertions(1);
      const headers = new Headers();
      expect(headers.entries().next().done).toBeTruthy();
    });
    it('should create a Headers object with the same entries as the init Headers object', () => {
      expect.assertions(1);
      const init = new Headers();
      init.append('Content-Type', 'application/json');
      const headers = new Headers(init);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
    it('should create a Headers object with the entries provided in the init array', () => {
      expect.assertions(1);
      const headers = new Headers([['Content-Type', 'application/json']]);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
    it('should create a Headers object with the entries provided in the init object', () => {
      expect.assertions(1);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      expect(headers.get('Content-Type')).toBe('application/json');
    });
    it('should append a value to an existing header', () => {
      expect.assertions(1);
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Content-Type', 'text/plain');
      expect(headers.get('Content-Type')).toBe('application/json, text/plain');
    });
    it('should delete a header', () => {
      expect.assertions(1);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.delete('Content-Type');
      expect(headers.has('Content-Type')).toBeFalsy();
    });
    it('should return whether a header exists', () => {
      expect.assertions(1);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      expect(headers.has('Content-Type')).toBeTruthy();
    });
    it('should set a header', () => {
      expect.assertions(1);
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
    it('should iterate over entries, keys, and values', () => {
      expect.assertions(4);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      for (const [key, value] of headers.entries()) {
        expect(key).toBe('content-type');
        expect(value).toBe('application/json');
      }
      for (const key of headers.keys()) {
        expect(key).toBe('content-type');
      }
      for (const value of headers.values()) {
        expect(value).toBe('application/json');
      }
    });
    it('should call a callback for each entry', () => {
      expect.assertions(1);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const callback = jest.fn();
      for (const [key, value] of headers.entries()) {
        callback(value, key, headers);
      }
      expect(callback).toHaveBeenCalledWith('application/json', 'content-type', headers);
    });
  });
  describe('stringifyHeaders', () => {
    it('should return empty array string for empty headers', () => {
      expect.assertions(1);
      const headers = new Headers();
      const result = stringifyHeaders(headers);
      expect(result).toBe('[]');
    });

    it('should return stringified headers for single header', () => {
      expect.assertions(1);
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const result = stringifyHeaders(headers);
      expect(result).toBe('[["content-type","application/json"]]');
    });
    it('should return stringified headers for multiple headers', () => {
      expect.assertions(1);
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Authorization', 'Bearer token');
      headers.set('Content-Length', 153);
      headers.set('CustomBoolean', false);
      const result = stringifyHeaders(headers);
      expect(result).toBe(
        '[["content-type","application/json"],["authorization","Bearer token"],["content-length","153"],["customboolean","false"]]',
      );
    });
  });
  describe('injectFastEdgeHeaders', () => {
    let originalHeaders;
    beforeEach(() => {
      originalHeaders = globalThis.Response;
      globalThis.fastedge = {
        Headers: jest.fn(),
      };
    });
    afterEach(() => {
      globalThis.Headers = originalHeaders;
    });

    it('should replace global Response object', () => {
      expect.assertions(2);
      injectFastEdgeHeaders();
      expect(globalThis.Headers).not.toBe(originalHeaders);
      expect(typeof globalThis.Headers).toBe('function');
    });
  });
});
