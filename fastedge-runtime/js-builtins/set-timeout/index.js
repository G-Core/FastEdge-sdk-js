function setTimeout(cb, ms) {
  console.warn('setTimeout is not yet supported in FastEdge beta');
  cb();
}

function setInterval(cb, ms) {
  console.warn('setInterval is not yet supported in FastEdge beta');
  cb();
}

function injectFastEdgeSetTimeout() {
  globalThis.setTimeout = setTimeout;
  globalThis.setInterval = setInterval;
}

export { injectFastEdgeSetTimeout, setInterval, setTimeout };
