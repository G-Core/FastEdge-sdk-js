import { injectFastEdgeResponse, _isValidHttpStatusCode, Response } from '.';

describe('Response', () => {
  describe('isValidHttpStatusCode', () => {
    it('should return true for valid status codes', () => {
      expect.assertions(2);
      expect(_isValidHttpStatusCode(200)).toBe(true);
      expect(_isValidHttpStatusCode('404')).toBe(true);
    });

    it('should return false for invalid status codes', () => {
      expect.assertions(3);
      expect(_isValidHttpStatusCode(99)).toBe(false);
      expect(_isValidHttpStatusCode(600)).toBe(false);
      expect(_isValidHttpStatusCode('abc')).toBe(false);
    });
  });

  describe('new Response', () => {
    it('should create a new Response object', () => {
      expect.assertions(4);
      const response = new Response('body', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
      expect(response.body).toBe('body');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.ok).toBe(true);
    });

    it('should default to a 500 status code for invalid status codes', () => {
      expect.assertions(1);
      const response = new Response('body', { status: 'abc' });
      expect(response.status).toBe(500);
    });

    it('should default to a 200 status code for response without a status code', () => {
      expect.assertions(1);
      const response = new Response('body');
      expect(response.status).toBe(200);
    });

    it('should parse JSON bodies', async () => {
      expect.assertions(1);
      const response = new Response('{"foo":"bar"}', {
        headers: { 'content-type': 'application/json' },
      });
      const result = await response.json();
      expect(result).toStrictEqual({ foo: 'bar' });
    });

    //! This is a temporary fix to return the body as a string - server does not carry through the content-type
    // it('should return "Malformed body" if unable to parse JSON bodies', async () => {
    //   expect.assertions(1);
    //   const response = new Response('"foo":"bar"', {
    //     headers: { 'content-type': 'application/json' },
    //   });
    //   const result = await response.json();
    //   expect(result).toBe('Malformed body');
    // });

    it('should return the body as a string for non-JSON bodies', async () => {
      expect.assertions(1);
      const response = new Response('body', { headers: { 'content-type': 'text/plain' } });
      const result = await response.json();
      expect(result).toBe('body');
    });

    it('should return the body as a string for text()', async () => {
      expect.assertions(1);
      const response = new Response('body');
      const result = await response.text();
      expect(result).toBe('body');
    });
  });

  describe('injectFastEdgeResponse', () => {
    let originalResponse;
    beforeEach(() => {
      originalResponse = globalThis.Response;
      globalThis.fastedge = {
        Response: jest.fn(),
      };
    });
    afterEach(() => {
      globalThis.Response = originalResponse;
    });

    it('should replace global Response object', () => {
      expect.assertions(2);
      injectFastEdgeResponse();
      expect(globalThis.Response).not.toBe(originalResponse);
      expect(typeof globalThis.Response).toBe('function');
    });
  });
});
