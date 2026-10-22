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
 *  - the build loads no native module except wizer, via FASTEDGE_WIZER_PATH, so
 *    it works from a node_modules installed by another OS
 *  - component imports: declarations are generated and type-checked, and the
 *    composed app runs under @gcoredev/fastedge-test and calls into the component
 *
 * Requires a built `lib/` (runtime wasm) and `bin/`. See
 * .github/workflows/cross-platform-tests.yaml.
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { createRunner } from '@gcoredev/fastedge-test';
import { runHttpRequest } from '@gcoredev/fastedge-test/test';

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

// Native modules blocked: see integration-tests/test-files/no-native/.
const NO_NATIVE_PRELOAD = pathToFileURL(
  join(process.cwd(), 'integration-tests', 'test-files', 'no-native', 'register.mjs'),
).href;

// This platform's wizer binary, resolved the way the SDK would without the override.
const resolveWizerBinary = () =>
  spawnSync(
    process.execPath,
    ['-e', 'import("@bytecodealliance/wizer").then((m) => process.stdout.write(m.default))'],
    { encoding: 'utf-8' },
  ).stdout;

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

  it('should build with no native modules loadable except FASTEDGE_WIZER_PATH', () => {
    expect.assertions(3);
    const wizer = resolveWizerBinary();
    const output = join(workDir, 'no-native.wasm');

    expect(existsSync(wizer)).toBe(true);

    const result = spawnSync(
      process.execPath,
      ['--import', NO_NATIVE_PRELOAD, CLI, join(workDir, 'app.js'), output],
      {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'production', FASTEDGE_WIZER_PATH: wizer },
      },
    );

    expect(result.status).toBe(0);
    expect(isWasmComponent(output)).toBe(true);
  });

  describe('component imports (calculator.wasm), from paths containing spaces', () => {
    const componentsDir = join(process.cwd(), 'integration-tests', 'test-files', 'components');
    let dir;

    // All interfaces come from the one file
    const buildApp = (entry, output) =>
      spawnSync(
        process.execPath,
        [
          '--import',
          NO_NATIVE_PRELOAD,
          CLI,
          '-i',
          entry,
          '-o',
          output,
          '--component',
          'acme:calc/arith=calculator.wasm',
          '--component',
          'acme:calc/format=calculator.wasm',
          '--component',
          'acme:calc/memory=calculator.wasm',
        ],
        {
          cwd: dir,
          encoding: 'utf-8',
          env: {
            ...process.env,
            NODE_ENV: 'production',
            FASTEDGE_WIZER_PATH: resolveWizerBinary(),
            // The splice flow passes temp-dir paths to the engine as one string
            TMPDIR: dir,
            TEMP: dir,
            TMP: dir,
          },
        },
      );

    beforeAll(() => {
      dir = join(workDir, SPACED_DIR, 'calc app');
      // Left over by an interrupted run, the junctions below would already exist
      rmSync(dir, { recursive: true, force: true });
      // A consumer's layout: tsc and the SDK's types resolve from the app's node_modules
      mkdirSync(join(dir, 'node_modules', '@gcoredev'), { recursive: true });
      symlinkSync(
        process.cwd(),
        join(dir, 'node_modules', '@gcoredev', 'fastedge-sdk-js'),
        'junction',
      );
      symlinkSync(
        realpathSync(join(process.cwd(), 'node_modules', 'typescript')),
        join(dir, 'node_modules', 'typescript'),
        'junction',
      );
      copyFileSync(join(componentsDir, 'calculator.wasm'), join(dir, 'calculator.wasm'));
      copyFileSync(join(componentsDir, 'calculator-app.ts'), join(dir, 'app.ts'));
      writeFileSync(
        join(dir, 'bad-app.ts'),
        "import { add } from 'acme:calc/arith';\nexport const n: number = add('1', 2);\n",
      );
    });

    it('should write declarations for all interfaces', () => {
      expect.assertions(7);

      const result = buildApp('app.ts', 'app.wasm');

      expect(result.status).toBe(0);
      expect(isWasmComponent(join(dir, 'app.wasm'))).toBe(true);
      const types = readFileSync(join(dir, 'fastedge-components.d.ts'), 'utf8');
      expect(types).toContain('export function divide(a: number, b: number): number;');
      expect(types).toContain('export function sum(values: Float64Array): number;');
      expect(types).toContain('export function describe(e: Expr, value: number): string;');
      expect(types).toContain('export class Accumulator implements Disposable {');
      expect(types).toContain('static merge(a: Accumulator, b: Accumulator): Accumulator;');
    }, 120_000);

    it('should reject a call that does not match the component types', () => {
      expect.assertions(2);

      const result = buildApp('bad-app.ts', 'bad-app.wasm');

      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('TS2345');
    }, 120_000);

    it('should run the composed app and call into the component', async () => {
      expect.assertions(6);
      const runner = await createRunner(join(dir, 'app.wasm'));
      const get = async (path) => {
        const { status, body } = await runHttpRequest(runner, { path });
        return [status, body];
      };

      try {
        await expect(get('/add?a=2&b=40')).resolves.toStrictEqual([200, '42']);
        await expect(get('/add?a=2147483647&b=1')).resolves.toStrictEqual([200, '-2147483648']);
        await expect(get('/divide?a=6&b=4')).resolves.toStrictEqual([200, '6 / 4 = 1.5']);
        await expect(get('/divide?a=1&b=0')).resolves.toStrictEqual([400, 'division by zero']);
        await expect(get('/sum?v=1.5&v=2.5&v=3')).resolves.toStrictEqual([200, '7']);
        // Resource: constructor, method, borrowed handles in, owned handle out
        await expect(get('/accumulate?v=1&v=2&v=3')).resolves.toStrictEqual([200, '6 16']);
      } finally {
        await runner.cleanup();
      }
    }, 120_000);
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
