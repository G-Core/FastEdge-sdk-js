// world root:component/root
export type * as WasiCliEnvironment026 from './interfaces/wasi-cli-environment.js'; // import wasi:cli/environment@0.2.6
export type * as WasiCliExit026 from './interfaces/wasi-cli-exit.js'; // import wasi:cli/exit@0.2.6
export type * as WasiCliStderr026 from './interfaces/wasi-cli-stderr.js'; // import wasi:cli/stderr@0.2.6
export type * as WasiCliStdin026 from './interfaces/wasi-cli-stdin.js'; // import wasi:cli/stdin@0.2.6
export type * as WasiCliStdout026 from './interfaces/wasi-cli-stdout.js'; // import wasi:cli/stdout@0.2.6
export type * as WasiCliTerminalInput026 from './interfaces/wasi-cli-terminal-input.js'; // import wasi:cli/terminal-input@0.2.6
export type * as WasiCliTerminalOutput026 from './interfaces/wasi-cli-terminal-output.js'; // import wasi:cli/terminal-output@0.2.6
export type * as WasiCliTerminalStderr026 from './interfaces/wasi-cli-terminal-stderr.js'; // import wasi:cli/terminal-stderr@0.2.6
export type * as WasiCliTerminalStdin026 from './interfaces/wasi-cli-terminal-stdin.js'; // import wasi:cli/terminal-stdin@0.2.6
export type * as WasiCliTerminalStdout026 from './interfaces/wasi-cli-terminal-stdout.js'; // import wasi:cli/terminal-stdout@0.2.6
export type * as WasiIoError026 from './interfaces/wasi-io-error.js'; // import wasi:io/error@0.2.6
export type * as WasiIoPoll026 from './interfaces/wasi-io-poll.js'; // import wasi:io/poll@0.2.6
export type * as WasiIoStreams026 from './interfaces/wasi-io-streams.js'; // import wasi:io/streams@0.2.6
export type * as WasiRandomInsecureSeed026 from './interfaces/wasi-random-insecure-seed.js'; // import wasi:random/insecure-seed@0.2.6
export function plug(socket: Uint8Array, plugs: Array<Uint8Array>): Uint8Array;
export function importWorld(components: Array<Uint8Array>, interfaces: Array<string>): string;
export function imports(component: Uint8Array): Array<string>;
export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
