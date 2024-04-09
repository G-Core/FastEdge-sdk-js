class Headers {
  constructor(init) {
    this.map = new Map();

    if (init instanceof Headers) {
      for (const [key, value] of init.entries()) {
        this.append(key, value);
      }
    } else if (Array.isArray(init)) {
      for (const [key, value] of init) {
        this.append(key, value);
      }
    } else if (typeof init === 'object') {
      for (const [key, value] of Object.entries(init)) {
        if (Object.prototype.hasOwnProperty.call(init, key)) {
          this.append(key, value);
        }
      }
    }
  }

  append(providedName, value) {
    const name = providedName.toLowerCase();
    if (this.map.has(name)) {
      this.map.set(name, `${this.map.get(name)}, ${value}`);
    } else {
      this.map.set(name, value);
    }
  }

  delete(name) {
    this.map.delete(name.toLowerCase());
  }

  get(name) {
    return this.map.get(name.toLowerCase()) || null;
  }

  has(name) {
    return this.map.has(name.toLowerCase());
  }

  set(name, value) {
    this.map.set(name.toLowerCase(), value);
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
}

function stringifyHeaders(headers) {
  let result = '';
  for (const [key, value] of headers.entries()) {
    result = `${result}${result.length > 0 ? ',' : ''}["${key}","${value}"]`;
  }
  return `[${result}]`;
}

function injectFastEdgeHeaders() {
  globalThis.Headers = Headers;
}

export { injectFastEdgeHeaders, Headers, stringifyHeaders };
