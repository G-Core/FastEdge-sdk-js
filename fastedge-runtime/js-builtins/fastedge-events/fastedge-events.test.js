import { FastEdgeEventEmitter, injectFastEdgeEventEmitter } from '.';

globalThis.fastedge = {
  sendReponse: jest.fn((status, headers, body) => true),
};

describe('FastEdgeEventEmitter', () => {
  let fastEdgeEmitter;
  let responseHandler;

  describe('addEventListener', () => {
    it('should throw an error when addEventListener is called with an unsupported event', () => {
      expect.assertions(1);
      fastEdgeEmitter = new FastEdgeEventEmitter();
      expect(() => fastEdgeEmitter.addEventListener('unsupportedEvent', () => {})).toThrow(
        "addEventListener only supports the event 'fetch' right now, but got event 'unsupportedEvent'",
      );
    });
  });

  describe('dispatchFetchEvent', () => {
    beforeEach(() => {
      fastEdgeEmitter = new FastEdgeEventEmitter();
    });

    it('should throw an error when respondWith is called with a non-Response', async () => {
      expect.assertions(1);
      const fetchEvent = {};
      responseHandler = (e) => 'Function without a Response or Promise';
      fastEdgeEmitter.addEventListener('fetch', (e) => {
        e.respondWith(responseHandler(e));
      });
      let errMsg = 'did not throw an error';
      try {
        await fastEdgeEmitter.dispatchFetchEvent(fetchEvent);
      } catch (error) {
        errMsg = error.message;
      }
      expect(errMsg).toBe(
        'Promise rejected but never handled: FetchEvent#respondWith must be called with a Response object or a Promise resolving to a Response object as the first argument',
      );
    });

    it('should throw an error when respondWith is called with a Promise that does not resolve to a Response', async () => {
      expect.assertions(1);
      const fetchEvent = {};
      responseHandler = (e) =>
        new Promise((resolve) => {
          resolve('Promise resolves to a string');
        });
      fastEdgeEmitter.addEventListener('fetch', (e) => {
        e.respondWith(responseHandler(e));
      });
      let errMsg = 'did not throw an error';
      try {
        await fastEdgeEmitter.dispatchFetchEvent(fetchEvent);
      } catch (error) {
        errMsg = error.message;
      }
      expect(errMsg).toBe(
        'Promise rejected but never handled: FetchEvent#respondWith must be called with a Response object or a Promise resolving to a Response object as the first argument',
      );
    });

    it('should succeed when respondWith is called with a Response', async () => {
      expect.assertions(1);
      const fetchEvent = {};
      responseHandler = (e) => new Response('Hello');
      fastEdgeEmitter.addEventListener('fetch', (e) => {
        e.respondWith(responseHandler(e));
      });
      let errMsg = 'did not throw an error';
      try {
        await fastEdgeEmitter.dispatchFetchEvent(fetchEvent);
      } catch (error) {
        errMsg = error.message;
      }
      expect(errMsg).toBe('did not throw an error');
    });

    it('should succeed when respondWith is called with a Promise that resolves to a Response', async () => {
      expect.assertions(1);
      const fetchEvent = {};
      responseHandler = (e) =>
        new Promise((resolve) => {
          resolve(new Response('Hello'));
        });
      fastEdgeEmitter.addEventListener('fetch', (e) => {
        e.respondWith(responseHandler(e));
      });
      let errMsg = 'did not throw an error';
      try {
        await fastEdgeEmitter.dispatchFetchEvent(fetchEvent);
      } catch (error) {
        errMsg = error.message;
      }
      expect(errMsg).toBe('did not throw an error');
    });
  });

  describe('injectFastEdgeEventEmitter', () => {
    it('should inject addEventListener method into globalThis', () => {
      expect.assertions(1);
      injectFastEdgeEventEmitter();
      expect(typeof globalThis.addEventListener).toBe('function');
    });
    it('should return dispatchFetchEvent method', () => {
      expect.assertions(1);
      injectFastEdgeEventEmitter();
      expect(typeof globalThis.dispatchFetchEvent).toBe('function');
    });
  });
});
