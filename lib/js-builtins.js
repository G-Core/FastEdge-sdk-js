// fastedge-runtime/js-builtins/console/index.js
function _writeToRuntime(send, prefix, ...args) {
  send(
    prefix + args.map((arg) => {
      if (arg === void 0) {
        return "undefined";
      }
      if (arg === null) {
        return "null";
      }
      if (typeof arg === "object") {
        if (arg instanceof Error) {
          return `${arg.message} ${arg.stack}`;
        }
        if (arg instanceof Promise) {
          return "[ Promise<Pending> ]";
        }
        return JSON.stringify(arg);
      }
      return arg;
    }).join(", ")
  );
}
function injectFastEdgeConsoleLogging() {
  const console2 = {
    log: (...args) => _writeToRuntime(globalThis.fastedge.consoleLog, "[LOG] ", ...args),
    error: (...args) => _writeToRuntime(globalThis.fastedge.consoleError, "[ERROR] ", ...args),
    warn: (...args) => _writeToRuntime(globalThis.fastedge.consoleError, "[WARN] ", ...args),
    info: (...args) => _writeToRuntime(globalThis.fastedge.consoleLog, "[INFO] ", ...args),
    debug: (...args) => _writeToRuntime(globalThis.fastedge.consoleLog, "[DEBUG] ", ...args)
  };
  globalThis.console = console2;
}

// node_modules/@jspm/core/nodelibs/browser/chunk-4bd36a8f.js
var e;
var t;
var n = "object" == typeof Reflect ? Reflect : null;
var r = n && "function" == typeof n.apply ? n.apply : function(e2, t2, n2) {
  return Function.prototype.apply.call(e2, t2, n2);
};
t = n && "function" == typeof n.ownKeys ? n.ownKeys : Object.getOwnPropertySymbols ? function(e2) {
  return Object.getOwnPropertyNames(e2).concat(Object.getOwnPropertySymbols(e2));
} : function(e2) {
  return Object.getOwnPropertyNames(e2);
};
var i = Number.isNaN || function(e2) {
  return e2 != e2;
};
function o() {
  o.init.call(this);
}
e = o, o.EventEmitter = o, o.prototype._events = void 0, o.prototype._eventsCount = 0, o.prototype._maxListeners = void 0;
var s = 10;
function u(e2) {
  if ("function" != typeof e2)
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e2);
}
function f(e2) {
  return void 0 === e2._maxListeners ? o.defaultMaxListeners : e2._maxListeners;
}
function v(e2, t2, n2, r2) {
  var i2, o2, s2, v2;
  if (u(n2), void 0 === (o2 = e2._events) ? (o2 = e2._events = /* @__PURE__ */ Object.create(null), e2._eventsCount = 0) : (void 0 !== o2.newListener && (e2.emit("newListener", t2, n2.listener ? n2.listener : n2), o2 = e2._events), s2 = o2[t2]), void 0 === s2)
    s2 = o2[t2] = n2, ++e2._eventsCount;
  else if ("function" == typeof s2 ? s2 = o2[t2] = r2 ? [n2, s2] : [s2, n2] : r2 ? s2.unshift(n2) : s2.push(n2), (i2 = f(e2)) > 0 && s2.length > i2 && !s2.warned) {
    s2.warned = true;
    var a2 = new Error("Possible EventEmitter memory leak detected. " + s2.length + " " + String(t2) + " listeners added. Use emitter.setMaxListeners() to increase limit");
    a2.name = "MaxListenersExceededWarning", a2.emitter = e2, a2.type = t2, a2.count = s2.length, v2 = a2, console && console.warn && console.warn(v2);
  }
  return e2;
}
function a() {
  if (!this.fired)
    return this.target.removeListener(this.type, this.wrapFn), this.fired = true, 0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function l(e2, t2, n2) {
  var r2 = { fired: false, wrapFn: void 0, target: e2, type: t2, listener: n2 }, i2 = a.bind(r2);
  return i2.listener = n2, r2.wrapFn = i2, i2;
}
function h(e2, t2, n2) {
  var r2 = e2._events;
  if (void 0 === r2)
    return [];
  var i2 = r2[t2];
  return void 0 === i2 ? [] : "function" == typeof i2 ? n2 ? [i2.listener || i2] : [i2] : n2 ? function(e3) {
    for (var t3 = new Array(e3.length), n3 = 0; n3 < t3.length; ++n3)
      t3[n3] = e3[n3].listener || e3[n3];
    return t3;
  }(i2) : c(i2, i2.length);
}
function p(e2) {
  var t2 = this._events;
  if (void 0 !== t2) {
    var n2 = t2[e2];
    if ("function" == typeof n2)
      return 1;
    if (void 0 !== n2)
      return n2.length;
  }
  return 0;
}
function c(e2, t2) {
  for (var n2 = new Array(t2), r2 = 0; r2 < t2; ++r2)
    n2[r2] = e2[r2];
  return n2;
}
Object.defineProperty(o, "defaultMaxListeners", { enumerable: true, get: function() {
  return s;
}, set: function(e2) {
  if ("number" != typeof e2 || e2 < 0 || i(e2))
    throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + e2 + ".");
  s = e2;
} }), o.init = function() {
  void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
}, o.prototype.setMaxListeners = function(e2) {
  if ("number" != typeof e2 || e2 < 0 || i(e2))
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e2 + ".");
  return this._maxListeners = e2, this;
}, o.prototype.getMaxListeners = function() {
  return f(this);
}, o.prototype.emit = function(e2) {
  for (var t2 = [], n2 = 1; n2 < arguments.length; n2++)
    t2.push(arguments[n2]);
  var i2 = "error" === e2, o2 = this._events;
  if (void 0 !== o2)
    i2 = i2 && void 0 === o2.error;
  else if (!i2)
    return false;
  if (i2) {
    var s2;
    if (t2.length > 0 && (s2 = t2[0]), s2 instanceof Error)
      throw s2;
    var u2 = new Error("Unhandled error." + (s2 ? " (" + s2.message + ")" : ""));
    throw u2.context = s2, u2;
  }
  var f2 = o2[e2];
  if (void 0 === f2)
    return false;
  if ("function" == typeof f2)
    r(f2, this, t2);
  else {
    var v2 = f2.length, a2 = c(f2, v2);
    for (n2 = 0; n2 < v2; ++n2)
      r(a2[n2], this, t2);
  }
  return true;
}, o.prototype.addListener = function(e2, t2) {
  return v(this, e2, t2, false);
}, o.prototype.on = o.prototype.addListener, o.prototype.prependListener = function(e2, t2) {
  return v(this, e2, t2, true);
}, o.prototype.once = function(e2, t2) {
  return u(t2), this.on(e2, l(this, e2, t2)), this;
}, o.prototype.prependOnceListener = function(e2, t2) {
  return u(t2), this.prependListener(e2, l(this, e2, t2)), this;
}, o.prototype.removeListener = function(e2, t2) {
  var n2, r2, i2, o2, s2;
  if (u(t2), void 0 === (r2 = this._events))
    return this;
  if (void 0 === (n2 = r2[e2]))
    return this;
  if (n2 === t2 || n2.listener === t2)
    0 == --this._eventsCount ? this._events = /* @__PURE__ */ Object.create(null) : (delete r2[e2], r2.removeListener && this.emit("removeListener", e2, n2.listener || t2));
  else if ("function" != typeof n2) {
    for (i2 = -1, o2 = n2.length - 1; o2 >= 0; o2--)
      if (n2[o2] === t2 || n2[o2].listener === t2) {
        s2 = n2[o2].listener, i2 = o2;
        break;
      }
    if (i2 < 0)
      return this;
    0 === i2 ? n2.shift() : !function(e3, t3) {
      for (; t3 + 1 < e3.length; t3++)
        e3[t3] = e3[t3 + 1];
      e3.pop();
    }(n2, i2), 1 === n2.length && (r2[e2] = n2[0]), void 0 !== r2.removeListener && this.emit("removeListener", e2, s2 || t2);
  }
  return this;
}, o.prototype.off = o.prototype.removeListener, o.prototype.removeAllListeners = function(e2) {
  var t2, n2, r2;
  if (void 0 === (n2 = this._events))
    return this;
  if (void 0 === n2.removeListener)
    return 0 === arguments.length ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : void 0 !== n2[e2] && (0 == --this._eventsCount ? this._events = /* @__PURE__ */ Object.create(null) : delete n2[e2]), this;
  if (0 === arguments.length) {
    var i2, o2 = Object.keys(n2);
    for (r2 = 0; r2 < o2.length; ++r2)
      "removeListener" !== (i2 = o2[r2]) && this.removeAllListeners(i2);
    return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
  }
  if ("function" == typeof (t2 = n2[e2]))
    this.removeListener(e2, t2);
  else if (void 0 !== t2)
    for (r2 = t2.length - 1; r2 >= 0; r2--)
      this.removeListener(e2, t2[r2]);
  return this;
}, o.prototype.listeners = function(e2) {
  return h(this, e2, true);
}, o.prototype.rawListeners = function(e2) {
  return h(this, e2, false);
}, o.listenerCount = function(e2, t2) {
  return "function" == typeof e2.listenerCount ? e2.listenerCount(t2) : p.call(e2, t2);
}, o.prototype.listenerCount = p, o.prototype.eventNames = function() {
  return this._eventsCount > 0 ? t(this._events) : [];
};
var y = e;
y.EventEmitter;
y.defaultMaxListeners;
y.init;
y.listenerCount;
y.EventEmitter;
y.defaultMaxListeners;
y.init;
y.listenerCount;

// node_modules/@jspm/core/nodelibs/browser/events.js
y.once = function(emitter, event) {
  return new Promise((resolve, reject) => {
    function eventListener(...args) {
      if (errorListener !== void 0) {
        emitter.removeListener("error", errorListener);
      }
      resolve(args);
    }
    let errorListener;
    if (event !== "error") {
      errorListener = (err) => {
        emitter.removeListener(name, eventListener);
        reject(err);
      };
      emitter.once("error", errorListener);
    }
    emitter.once(event, eventListener);
  });
};
y.on = function(emitter, event) {
  const unconsumedEventValues = [];
  const unconsumedPromises = [];
  let error = null;
  let finished = false;
  const iterator = {
    async next() {
      const value = unconsumedEventValues.shift();
      if (value) {
        return createIterResult(value, false);
      }
      if (error) {
        const p2 = Promise.reject(error);
        error = null;
        return p2;
      }
      if (finished) {
        return createIterResult(void 0, true);
      }
      return new Promise((resolve, reject) => unconsumedPromises.push({ resolve, reject }));
    },
    async return() {
      emitter.removeListener(event, eventHandler);
      emitter.removeListener("error", errorHandler);
      finished = true;
      for (const promise of unconsumedPromises) {
        promise.resolve(createIterResult(void 0, true));
      }
      return createIterResult(void 0, true);
    },
    throw(err) {
      error = err;
      emitter.removeListener(event, eventHandler);
      emitter.removeListener("error", errorHandler);
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
  emitter.on(event, eventHandler);
  emitter.on("error", errorHandler);
  return iterator;
  function eventHandler(...args) {
    const promise = unconsumedPromises.shift();
    if (promise) {
      promise.resolve(createIterResult(args, false));
    } else {
      unconsumedEventValues.push(args);
    }
  }
  function errorHandler(err) {
    finished = true;
    const toError = unconsumedPromises.shift();
    if (toError) {
      toError.reject(err);
    } else {
      error = err;
    }
    iterator.return();
  }
};
var {
  EventEmitter,
  defaultMaxListeners,
  init,
  listenerCount,
  on,
  once
} = y;

// fastedge-runtime/js-builtins/fastedge-events/index.js
var FastEdgeEventEmitter = class extends y {
  constructor() {
    super();
  }
  addEventListener(type, listener) {
    if (type !== "fetch") {
      throw new Error(
        `addEventListener only supports the event 'fetch' right now, but got event '${type}'`
      );
    }
    super.on(type, listener);
  }
  dispatchFetchEvent(event, sendReponse) {
    const fetchEvent = { ...event };
    return new Promise((resolve, reject) => {
      fetchEvent.respondWith = (requestHandler) => {
        try {
          if (requestHandler instanceof Promise) {
            return requestHandler.then(fetchEvent.respondWith);
          }
          if (requestHandler instanceof Response) {
            return resolve(requestHandler);
          }
          throw new Error(
            "Promise rejected but never handled: FetchEvent#respondWith must be called with a Response object or a Promise resolving to a Response object as the first argument"
          );
        } catch (error) {
          reject(error);
        }
      };
      if (!super.emit("fetch", fetchEvent)) {
        reject(new Error("Unable to dispatch fetch event"));
      }
    });
  }
};
function injectFastEdgeEventEmitter() {
  const fastEdgeEmitter = new FastEdgeEventEmitter();
  globalThis.addEventListener = fastEdgeEmitter.addEventListener.bind(fastEdgeEmitter);
  globalThis.dispatchFetchEvent = fastEdgeEmitter.dispatchFetchEvent.bind(fastEdgeEmitter);
}

// fastedge-runtime/js-builtins/fetch/response/index.js
function _isValidHttpStatusCode(statusCode) {
  const numericStatusCode = Number(statusCode);
  return !Number.isNaN(numericStatusCode) && numericStatusCode >= 100 && numericStatusCode <= 599;
}
var Response2 = class {
  constructor(body, options = {}) {
    this.body = typeof body === "string" ? body : null;
    const status = options.status ?? 200;
    this.status = _isValidHttpStatusCode(status) ? Number(status) : 500;
    this.headers = new Headers(options.headers);
    this.ok = this.status >= 200 && this.status < 300;
    Object.defineProperty(this, "body", { writable: false });
    Object.defineProperty(this, "status", { writable: false });
    Object.defineProperty(this, "headers", { writable: false });
    Object.defineProperty(this, "ok", { writable: false });
  }
  async json() {
    if (this.headers.get("content-type") === "application/json") {
      try {
        return JSON.parse(this.body);
      } catch {
        return "Malformed body";
      }
    }
    return this.body;
  }
  async text() {
    return this.body;
  }
};
function injectFastEdgeResponse() {
  globalThis.Response = Response2;
}

// fastedge-runtime/js-builtins/fetch/headers/index.js
var Headers2 = class {
  constructor(init2) {
    this.map = /* @__PURE__ */ new Map();
    if (init2 instanceof Headers2) {
      for (const [key, value] of init2.entries()) {
        this.append(key, value);
      }
    } else if (Array.isArray(init2)) {
      for (const [key, value] of init2) {
        this.append(key, value);
      }
    } else if (typeof init2 === "object") {
      for (const [key, value] of Object.entries(init2)) {
        if (Object.prototype.hasOwnProperty.call(init2, key)) {
          this.append(key, value);
        }
      }
    }
  }
  append(providedName, value) {
    const name2 = providedName.toLowerCase();
    if (this.map.has(name2)) {
      this.map.set(name2, `${this.map.get(name2)}, ${value}`);
    } else {
      this.map.set(name2, value);
    }
  }
  delete(name2) {
    this.map.delete(name2.toLowerCase());
  }
  get(name2) {
    return this.map.get(name2.toLowerCase()) || null;
  }
  has(name2) {
    return this.map.has(name2.toLowerCase());
  }
  set(name2, value) {
    this.map.set(name2.toLowerCase(), value);
  }
  entries() {
    return this.map.entries();
  }
  keys() {
    return this.map.keys();
  }
  values() {
    return this.map.values();
  }
  forEach(callback, thisArg) {
    for (const [key, value] of this.map) {
      callback.call(thisArg, value, key, this);
    }
  }
};
function stringifyHeaders(headers) {
  let result = "";
  for (const [key, value] of headers.entries()) {
    result = `${result}${result.length > 0 ? "," : ""}["${key}","${value}"]`;
  }
  return `[${result}]`;
}
function injectFastEdgeHeaders() {
  globalThis.Headers = Headers2;
}

// fastedge-runtime/js-builtins/fetch/index.js
function fetch(url, options = {}) {
  return new Promise((resolve) => {
    const method = options.method ?? "GET";
    const headers = options.headers ?? "[]";
    const body = options.body ?? "";
    const fastedgeRes = globalThis.fastedge.sendRequest(method, url.toString(), headers, body);
    const headersArr = JSON.parse(fastedgeRes.headers ?? "[]");
    const headersObj = Object.fromEntries(headersArr);
    const downstreamResponse = new Response2(fastedgeRes.body, {
      status: fastedgeRes.status,
      headers: headersObj
    });
    resolve(downstreamResponse);
  });
}
function injectFastEdgeFetch() {
  globalThis.fetch = fetch;
}

// fastedge-runtime/js-builtins/set-timeout/index.js
function setTimeout(cb, ms) {
  console.warn("setTimeout is not yet supported in FastEdge beta");
  cb();
}
function setInterval(cb, ms) {
  console.warn("setInterval is not yet supported in FastEdge beta");
  cb();
}
function injectFastEdgeSetTimeout() {
  globalThis.setTimeout = setTimeout;
  globalThis.setInterval = setInterval;
}

// fastedge-runtime/js-builtins/index.js
(function gCoreNamespace() {
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
    ...incomingRequest.body && { body: incomingRequest.body }
  };
  return {
    type,
    request
  };
}
async function process(request) {
  try {
    const { dispatchFetchEvent } = globalThis;
    const { sendResponse } = fastedge;
    const response = await dispatchFetchEvent(createFastEdgeEvent("fetch", request));
    sendResponse(response.status, stringifyHeaders(response.headers), response.body);
  } catch (error) {
    console.error(`process -> error:`, error);
  }
}
globalThis.process = process;
