function setTimeout(cb, ms) {
  // eslint-disable-next-line no-console
  console.warn('setTimeout is not yet supported in FastEdge beta');
  cb();
}

function setInterval(cb, ms) {
  // eslint-disable-next-line no-console
  console.warn('setInterval is not yet supported in FastEdge beta');
  cb();
}

function injectFastEdgeSetTimeout() {
  globalThis.setTimeout = setTimeout;
  globalThis.setInterval = setInterval;
}

export { injectFastEdgeSetTimeout, setInterval, setTimeout };
