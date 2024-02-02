import EventEmitter from 'node:events';

class FastEdgeEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
  addEventListener(type, listener) {
    if (type !== 'fetch') {
      throw new Error(
        `addEventListener only supports the event 'fetch' right now, but got event '${type}'`,
      );
    }
    super.on(type, listener);
  }
  dispatchFetchEvent(event, sendReponse) {
    const fetchEvent = { ...event };
    return new Promise((resolve, reject) => {
      fetchEvent.respondWith = (requestHandler) => {
        try {
          // Does requestHandler return a promise of type Response?
          if (requestHandler instanceof Promise) {
            return requestHandler.then(fetchEvent.respondWith);
          }
          if (requestHandler instanceof Response) {
            return resolve(requestHandler);
          }
          throw new Error(
            'Promise rejected but never handled: FetchEvent#respondWith must be called with a Response object or a Promise resolving to a Response object as the first argument',
          );
        } catch (error) {
          reject(error);
        }
      };
      if (!super.emit('fetch', fetchEvent)) {
        reject(new Error('Unable to dispatch fetch event'));
      }
    });
  }
}

function injectFastEdgeEventEmitter() {
  const fastEdgeEmitter = new FastEdgeEventEmitter();
  globalThis.addEventListener = fastEdgeEmitter.addEventListener.bind(fastEdgeEmitter);
  globalThis.dispatchFetchEvent = fastEdgeEmitter.dispatchFetchEvent.bind(fastEdgeEmitter);
}

export { FastEdgeEventEmitter, injectFastEdgeEventEmitter };
