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
    //! Need to clean this up after we get correct headers..
    let body = await response.json();
    let isBodyJson = false;
    try {
      // ? at present it is just cleaning the whitespace / special chars
      JSON.parse(response.body);
      isBodyJson = true;
      body = JSON.stringify(body);
    } catch {
      /* Body is text - do nothing */
    }

    const modifiedHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (key === 'content-type' && isBodyJson) {
        modifiedHeaders[key] = 'application/json';
        continue;
      }
      if (key === 'date' || key === 'content-length') continue;
      modifiedHeaders[key] = value;
    }

    const modifiedResponse = new Response(body, {
      status: response.status,
      headers: modifiedHeaders,
    });

    sendResponse(
      modifiedResponse.status,
      stringifyHeaders(modifiedResponse.headers),
      modifiedResponse.body,
    );
  } catch (error) {
    console.error(`TCL: process -> error:`, error);
  }
}

globalThis.process = process;
