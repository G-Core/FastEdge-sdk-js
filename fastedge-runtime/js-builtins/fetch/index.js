import { Response } from './response';

function fetch(url, options = {}) {
  return new Promise((resolve) => {
    const method = options.method ?? 'GET';
    const headers = options.headers ?? '[]';
    const body = options.body ?? '';
    const fastedgeRes = globalThis.fastedge.sendRequest(method, url.toString(), headers, body);
    // Create a response object from the fastedge response
    const headersArr = JSON.parse(fastedgeRes.headers ?? '[]');
    const headersObj = Object.fromEntries(headersArr);
    const downstreamResponse = new Response(fastedgeRes.body, {
      status: fastedgeRes.status,
      headers: headersObj,
    });
    resolve(downstreamResponse);
  });
}

function injectFastEdgeFetch() {
  globalThis.fetch = fetch;
}

export { injectFastEdgeFetch, fetch };
export { injectFastEdgeHeaders, stringifyHeaders } from './headers';
export { injectFastEdgeResponse } from './response';
