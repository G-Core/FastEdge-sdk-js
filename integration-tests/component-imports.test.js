import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Real builds (not NODE_ENV=test): needs lib/fastedge-runtime.wasm, like generates-output.test.js
const BUILD = resolve('./bin/fastedge-build.js');
const MAKE_COMPONENTS = resolve('./integration-tests/test-files/components/make-components.mjs');
const CALCULATOR = resolve('./integration-tests/test-files/components/calculator.wasm');

const APP = `import { greet } from 'acme:greet/hello';
addEventListener('fetch', (event) => event.respondWith(new Response(greet('edge'))));
`;

const build = (cwd, args) =>
  spawnSync('node', [BUILD, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'production' },
  });

describe('fastedge-build component imports', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'fastedge-component-imports-'));
    spawnSync('node', [MAKE_COMPONENTS, dir]);
    writeFileSync(join(dir, 'app.js'), APP);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('builds from a config file and writes declarations for the imports', () => {
    expect.assertions(4);
    writeFileSync(join(dir, 'package.json'), '{ "type": "module" }');
    writeFileSync(
      join(dir, 'build-config.js'),
      `export const config = {
        type: 'http',
        entryPoint: './app.js',
        wasmOutput: './dist/app.wasm',
        components: { 'acme:greet/hello': './greet.wasm' },
      };`,
    );
    const { status, stderr } = build(dir, ['--config', 'build-config.js']);
    expect({ status, stderr }).toStrictEqual({ status: 0, stderr: '' });
    expect(existsSync(join(dir, 'dist/app.wasm'))).toBe(true);
    const types = readFileSync(join(dir, 'fastedge-components.d.ts'), 'utf8');
    expect(types).toContain("declare module 'acme:greet/hello'");
    expect(types).toContain('export function greet(name: string): string;');
  }, 60_000);

  it('builds with the --component flag', () => {
    expect.assertions(2);
    const { status } = build(dir, [
      '-i',
      'app.js',
      '-o',
      'out.wasm',
      '--component',
      'acme:greet/hello=./greet.wasm',
    ]);
    expect(status).toBe(0);
    expect(existsSync(join(dir, 'out.wasm'))).toBe(true);
  }, 60_000);

  it('builds with components from two different files', () => {
    expect.assertions(2);
    writeFileSync(
      join(dir, 'two.js'),
      `${APP}import { add } from 'acme:calc/arith';\nglobalThis.add = add;\n`,
    );
    const { status, stderr } = build(dir, [
      '-i',
      'two.js',
      '-o',
      'two.wasm',
      '--component',
      'acme:greet/hello=./greet.wasm',
      '--component',
      `acme:calc/arith=${CALCULATOR}`,
    ]);
    expect({ status, stderr }).toStrictEqual({ status: 0, stderr: '' });
    expect(existsSync(join(dir, 'two.wasm'))).toBe(true);
  }, 60_000);

  it('fails when two component files export the same imported interface', () => {
    expect.assertions(3);
    writeFileSync(
      join(dir, 'wave.js'),
      `${APP}import { wave } from 'acme:greet/wave';\nglobalThis.wave = wave;\n`,
    );
    const { status, stderr } = build(dir, [
      '-i',
      'wave.js',
      '-o',
      'out.wasm',
      '--component',
      'acme:greet/hello=./greet.wasm',
      '--component',
      'acme:greet/wave=./greet-wave.wasm',
    ]);
    expect(status).toBe(1);
    expect(stderr).toMatch(
      /acme:greet\/hello is exported by more than one component: .*greet\.wasm, .*greet-wave\.wasm/u,
    );
    expect(existsSync(join(dir, 'out.wasm'))).toBe(false);
  }, 60_000);

  it('declares an interface that uses types from another in one self-contained file', () => {
    expect.assertions(4);
    writeFileSync(
      join(dir, 'shapes.js'),
      "import { origin } from 'acme:shapes/api';\nglobalThis.origin = origin;\n",
    );
    const { status } = build(dir, [
      '-i',
      'shapes.js',
      '-o',
      'shapes-out.wasm',
      '--component',
      'acme:shapes/api=./shapes.wasm',
    ]);
    expect(status).toBe(0);
    const types = readFileSync(join(dir, 'fastedge-components.d.ts'), 'utf8');
    expect(types).toContain("declare module 'acme:shapes/types'");
    expect(types).toContain("export type Point = import('acme:shapes/types').Point;");
    expect(types).not.toContain('<reference');
  }, 60_000);

  it('removes generated declarations when built without components, keeping others', () => {
    expect.assertions(4);
    const types = join(dir, 'fastedge-components.d.ts');
    writeFileSync(join(dir, 'plain.js'), "addEventListener('fetch', (e) => e.respondWith(new Response('ok')));\n");
    build(dir, ['-i', 'app.js', '-o', 'out.wasm', '--component', 'acme:greet/hello=./greet.wasm']);
    expect(existsSync(types)).toBe(true);

    expect(build(dir, ['-i', 'plain.js', '-o', 'out.wasm']).status).toBe(0);
    expect(existsSync(types)).toBe(false);

    writeFileSync(types, "declare module 'mine';\n");
    build(dir, ['-i', 'plain.js', '-o', 'out.wasm']);
    expect(readFileSync(types, 'utf8')).toBe("declare module 'mine';\n");
  }, 120_000);

  it.each([
    ['a malformed --component', 'acme:greet/hello', '--component expects <interface>=<path>'],
    ['an invalid interface name', 'acme/hello=./greet.wasm', 'Invalid component interface name'],
    ['a missing component file', 'acme:greet/hello=./nope.wasm', 'is not a readable file'],
    ['a file that is not a component', 'acme:greet/hello=./app.js', 'is not a Wasm component'],
    ['an interface no component exports', 'acme:greet/bye=./greet.wasm', 'no component exports acme:greet/bye'],
    [
      'a component importing what FastEdge does not provide',
      'acme:greet/hello=./needs-host.wasm',
      'Components import interfaces FastEdge does not provide: acme:other/thing',
    ],
  ])('fails on %s', (_, spec, message) => {
    expect.assertions(3);
    const { status, stderr } = build(dir, ['-i', 'app.js', '-o', 'out.wasm', '--component', spec]);
    expect(status).toBe(1);
    expect(stderr).toContain(message);
    expect(existsSync(join(dir, 'out.wasm'))).toBe(false);
  }, 60_000);
});
