function _isValidHttpStatusCode(statusCode) {
  const numericStatusCode = Number(statusCode);
  return !Number.isNaN(numericStatusCode) && numericStatusCode >= 100 && numericStatusCode <= 599;
}
class Response {
  constructor(body, options = {}) {
    this.body = typeof body === 'string' ? body : null;
    const status = options.status ?? 200;
    this.status = _isValidHttpStatusCode(status) ? Number(status) : 500;
    this.headers = new Headers(options.headers);
    this.ok = this.status >= 200 && this.status < 300;
    Object.defineProperty(this, 'body', { writable: false });
    Object.defineProperty(this, 'status', { writable: false });
    Object.defineProperty(this, 'headers', { writable: false });
    Object.defineProperty(this, 'ok', { writable: false });
  }

  async json() {
    // if (this.headers.get('content-type') === 'application/json') {
    try {
      return JSON.parse(this.body);
    } catch {
      /* Do nothing - just return Malformed body */
    }
    //! This is a temporary fix to return the body as a string - server does not carry through the content-type
    // * FIX THE TESTS TOO..
    // ? https://github.com/G-Core/FastEdge/issues/186
    // return 'Malformed body';
    // }
    return this.body;
  }

  async text() {
    return this.body;
  }
}

function injectFastEdgeResponse() {
  globalThis.Response = Response;
}

export { injectFastEdgeResponse, _isValidHttpStatusCode, Response };
