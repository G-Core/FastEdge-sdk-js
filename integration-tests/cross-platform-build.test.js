/**
 * Cross-platform build guarantees (Linux / macOS / Windows).
 *
 * These assertions are deliberately platform-neutral: they check observable
 * build behaviour rather than shell syntax, so the same file is meaningful on
 * all three runners.
 *
 * What this pins down:
 *  - `fastedge-build` produces a real wasm component on every platform
 *  - output paths containing spaces work (they did not when the CLI shelled out
 *    with unquoted interpolated paths)
 *  - path-shaped arguments reach the child process as single literal argv
 *    entries and are never re-parsed as shell syntax
 *
 * Requires a built `lib/` (runtime wasm) and `bin/`. See
 * .github/workflows/cross-platform-tests.yaml.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI = join(process.cwd(), 'bin', 'fastedge-build.js');
const RUNTIME_WASM = join(process.cwd(), 'lib', 'fastedge-runtime.wasm');

const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d]); // "\0asm"

// A directory name with a space, to catch unquoted-path regressions.
const SPACED_DIR = 'dir with space';

let workDir;

const runBuild = (args) =>
  spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'production' },
  });

const isWasmComponent = (path) =>
  existsSync(path) && readFileSync(path).subarray(0, 4).equals(WASM_MAGIC);

beforeAll(() => {
  // Fail loudly rather than silently skipping - a green run with no runtime
  // present would make this whole suite meaningless.
  if (!existsSync(RUNTIME_WASM)) {
    throw new Error(`Missing ${RUNTIME_WASM}. Build lib/ before running this suite.`);
  }

  workDir = join(tmpdir(), `fastedge-xplat-${process.pid}`);
  mkdirSync(join(workDir, SPACED_DIR), { recursive: true });
  writeFileSync(
    join(workDir, 'app.js'),
    'addEventListener("fetch", (event) => event.respondWith(new Response("ok")));\n',
  );
  writeFileSync(
    join(workDir, 'app.ts'),
    'addEventListener("fetch", (event: FetchEvent) => event.respondWith(new Response("ok")));\n',
  );
});

afterAll(() => {
  if (workDir) rmSync(workDir, { recursive: true, force: true });
});

describe(`fastedge-build on ${process.platform}`, () => {
  it('should build a JS entrypoint into a wasm component', () => {
    expect.assertions(2);
    const output = join(workDir, 'out.wasm');

    const result = runBuild([join(workDir, 'app.js'), output]);

    expect(result.status).toBe(0);
    expect(isWasmComponent(output)).toBe(true);
  });

  it('should build to an output path containing spaces', () => {
    expect.assertions(2);
    const output = join(workDir, SPACED_DIR, 'out.wasm');

    const result = runBuild([join(workDir, 'app.js'), output]);

    expect(result.status).toBe(0);
    expect(isWasmComponent(output)).toBe(true);
  });

  it('should build when the entrypoint path contains spaces', () => {
    expect.assertions(2);
    const input = join(workDir, SPACED_DIR, 'app.js');
    const output = join(workDir, 'spaced-input.wasm');
    writeFileSync(input, 'addEventListener("fetch", (e) => e.respondWith(new Response("ok")));\n');

    const result = runBuild([input, output]);

    expect(result.status).toBe(0);
    expect(isWasmComponent(output)).toBe(true);
  });

  it('should pass the tsconfig path to tsc as a single literal argument', () => {
    expect.assertions(2);
    // A path that a shell would split into extra commands. tsc must report it
    // back verbatim as one missing path, proving no re-parsing occurred.
    const oddPath = `no-such-tsconfig; echo split`;

    // Must be a TS entrypoint - the tsconfig path is only consulted for those.
    const result = runBuild([
      '-i',
      join(workDir, 'app.ts'),
      '-o',
      join(workDir, 'tsconfig-arg.wasm'),
      '-t',
      oddPath,
    ]);
    const combined = `${result.stdout ?? ''}${result.stderr ?? ''}`;

    expect(result.status).not.toBe(0);
    expect(combined).toContain(oddPath);
  });

  it('should not execute shell metacharacters embedded in the output path', () => {
    expect.assertions(1);
    const sentinel = join(workDir, 'sentinel.txt');

    // The payload has to satisfy two constraints at once to be a real test:
    //   1. end in `.wasm`, or validateFilePaths() rejects it before the spawn
    //      and the assertion passes vacuously
    //   2. use metacharacters the *host* shell actually honours - cmd.exe does
    //      not understand `$(...)`, and /bin/sh does not treat `&` the same way
    // `copy nul` / `touch` avoid quotes, which are illegal in Windows paths.
    // Every path stays inside workDir: post-fix these are treated as literal
    // filenames, and anything created must land in the sandbox, not the repo.
    const out = join(workDir, 'out.wasm');
    const tail = join(workDir, 'tail.wasm');
    const payloads =
      process.platform === 'win32'
        ? [`${out} & copy nul ${sentinel} & ${tail}`, `${out} | copy nul ${sentinel} | ${tail}`]
        : [
            `${join(workDir, '$(touch ' + sentinel + ')')}.wasm`,
            `${out}; touch ${sentinel}; ${tail}`,
            `${out} && touch ${sentinel} && ${tail}`,
          ];

    for (const payload of payloads) {
      runBuild([join(workDir, 'app.js'), payload]);
    }

    expect(existsSync(sentinel)).toBe(false);
  });
});
