import { Response } from './response';

import { fetch, injectFastEdgeFetch } from '.';

globalThis.fastedge = {
  sendRequest: jest.fn((method, url, headers, body) => ({
    status: 289, // ? custom status code - in case it defaults somewhere
    headers: '[["Content-Type","application/json"]]',
    body: '{"message": "response_body"}',
  })),
};

describe('Fetch', () => {
  describe('fetch', () => {
    let originalResponse;
    beforeAll(() => {
      originalResponse = globalThis.Response;
      globalThis.Response = Response;
    });
    afterAll(() => {
      globalThis.fetch = originalResponse;
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('returns a response with valid input', async () => {
      expect.assertions(5);
      const url = 'https://example.com/api/data';
      const options = {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: JSON.stringify({ key: 'value' }),
      };
      const response = await fetch(url, options);
      expect(globalThis.fastedge.sendRequest).toHaveBeenCalledWith(
        'POST',
        url,
        { Authorization: 'Bearer token' },
        JSON.stringify({ key: 'value' }),
      );
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(289);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const data = await response.json();
      expect(data.message).toBe('response_body');
    });

    it('handles default options correctly', async () => {
      expect.assertions(1);
      const url = 'https://example.com/api/default';
      const response = await fetch(url);
      expect(globalThis.fastedge.sendRequest).toHaveBeenCalledWith('GET', url, '[]', '');
    });
  });
  describe('injectFastEdgeFetch', () => {
    let originalFetch;
    beforeEach(() => {
      originalFetch = globalThis.fetch;
      globalThis.fastedge = {
        fetch: jest.fn(),
      };
    });
    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should replace global fetch function', () => {
      expect.assertions(2);
      injectFastEdgeFetch();
      expect(globalThis.fetch).not.toBe(originalFetch);
      expect(typeof globalThis.fetch).toBe('function');
    });
  });
});
