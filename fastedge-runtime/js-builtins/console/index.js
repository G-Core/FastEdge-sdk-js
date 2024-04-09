function _writeToRuntime(send, prefix, ...args) {
  send(
    prefix +
      args
        .map((arg) => {
          if (arg === undefined) {
            return 'undefined';
          }
          if (arg === null) {
            return 'null';
          }
          if (typeof arg === 'object') {
            if (arg instanceof Error) {
              return `${arg.message} ${arg.stack}`;
            }
            if (arg instanceof Promise) {
              return '[ Promise<Pending> ]';
            }
            return JSON.stringify(arg);
          }
          return arg;
        })
        .join(', '),
  );
}

function injectFastEdgeConsoleLogging() {
  const console = {
    log: (...args) => _writeToRuntime(globalThis.fastedge.consoleLog, '[LOG] ', ...args),
    error: (...args) => _writeToRuntime(globalThis.fastedge.consoleError, '[ERROR] ', ...args),
    warn: (...args) => _writeToRuntime(globalThis.fastedge.consoleError, '[WARN] ', ...args),
    info: (...args) => _writeToRuntime(globalThis.fastedge.consoleLog, '[INFO] ', ...args),
    debug: (...args) => _writeToRuntime(globalThis.fastedge.consoleLog, '[DEBUG] ', ...args),
  };
  globalThis.console = console;
}

export { injectFastEdgeConsoleLogging, _writeToRuntime };
