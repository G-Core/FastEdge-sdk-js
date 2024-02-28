import { injectFastEdgeConsoleLogging } from './console';
import { injectFastEdgeEventEmitter } from './fastedge-events';
import {
  injectFastEdgeFetch,
  injectFastEdgeHeaders,
  injectFastEdgeResponse,
  stringifyHeaders,
} from './fetch';
import { injectFastEdgeSetTimeout } from './set-timeout';

(function gCoreNamespace() {
  //* Order here is important!
  injectFastEdgeConsoleLogging();
  injectFastEdgeSetTimeout();
  injectFastEdgeEventEmitter();
  injectFastEdgeHeaders();
  injectFastEdgeResponse();
  injectFastEdgeFetch();
})();

function createFastEdgeEvent(type, incomingRequest) {
  const request = {
    method: incomingRequest.method,
    url: incomingRequest.url,
    headers: new Headers(incomingRequest.headers),
    ...(incomingRequest.body && { body: incomingRequest.body }),
  };
  return {
    type,
    request,
  };
}

async function process(request) {
  /**
   * TODO: preview_adapter_3  - This request object is being parsed within C++
   * This will need to parse the method / uri / headers / body into a request object here
   */

  try {
    const { dispatchFetchEvent } = globalThis;
    const { sendResponse } = fastedge;
    // Make sure we remove all the cbingings from the global scope
    const response = await dispatchFetchEvent(createFastEdgeEvent('fetch', request));
    sendResponse(response.status, stringifyHeaders(response.headers), response.body);
  } catch (error) {
    console.error(`process -> error:`, error);
  }
}

globalThis.process = process;
