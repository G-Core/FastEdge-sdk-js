/**
 * TypeScript version compatibility.
 *
 * The TypeScript used to check a consumer's entrypoint is whichever version
 * *they* installed, and the majors differ in ways that break naive handling:
 *
 *  - TS 7 ships an "exports" map that does not expose `./bin/tsc`, so
 *    resolving that subpath directly throws (works on TS 5).
 *  - TS 7 removed `moduleResolution: node` (node10) entirely; TS 5 still
 *    accepts it. `--ignoreDeprecations` cannot suppress a removed option.
 *
 * These tests install real TypeScript versions, so they are slow and need
 * network access. They assert observable CLI behaviour per major rather than
 * implementation details.
 */
import { spawnSync } from 'node:child_process';

import { prepareEnvironment } from '@gmrchk/cli-testing-library';

// One representative per packaging/behaviour regime, not every release:
//   5.0.4      - oldest supported (bundler resolution introduced here); several
//                options are deprecated-but-suppressible via "5.0"
//   5.9.3      - last 5.x
//   6.0.0-beta - only ever a prerelease, but installable: demands
//                --ignoreDeprecations "6.0" and rejects "5.0" with TS5107
//   7.0.2      - "exports" map hides ./bin/tsc; node10 removed outright
const TS_VERSIONS = ['5.0.4', '5.9.3', '6.0.0-beta', '7.0.2'];

const VALID_TS = 'export const greet = (name: string): string => `hello ${name}`;\n';
const INVALID_TS =
  'interface Test { hasTypes: boolean; } function test(data: Test) { console.log(data.unknown); }\n';
// Valid ESM the runtime supports, but rejected with TS1343 unless --module is
// esnext: the value TS infers from --target esnext alone is es2015.
const IMPORT_META_TS = 'export const where = import.meta.url;\n';

const INSTALL_AND_BUILD_TIMEOUT = 180_000;
const NPM_INSTALL_TIMEOUT = 120_000;

const majorOf = (version) => Number(version.split('.')[0]);

describe.each(TS_VERSIONS)('with typescript@%s', (version) => {
  /**
   * Sandbox with this exact TypeScript version installed.
   *
   * `spawnSync('npm', ...)` is POSIX-only: on Windows `npm` resolves to the
   * `npm.cmd` shim, which Node refuses to spawn without `shell: true` since
   * the fix for CVE-2024-27980. That is fine here because this suite only runs
   * under `test:integration`, which is Linux-only (build-libs.yaml); the
   * Windows/macOS matrix runs `test:cross-platform`, which targets only
   * cross-platform-build.test.js. Adding this file to that matrix would mean
   * launching npm through its Node entrypoint (`npm-cli.js`) under
   * `process.execPath` rather than reaching for a shell. The two pre-existing
   * installs in fastedge-build.test.js have the same constraint.
   *
   * The timeout is on the child deliberately: spawnSync blocks Jest's event
   * loop, so Jest's own test timeout cannot interrupt a stalled install and a
   * registry problem would hang the job instead of failing it.
   */
  const setup = async () => {
    const env = await prepareEnvironment();
    const install = spawnSync(
      'npm',
      ['install', `typescript@${version}`, '--no-audit', '--no-fund'],
      {
        cwd: env.path,
        encoding: 'utf-8',
        timeout: NPM_INSTALL_TIMEOUT,
      },
    );
    if (install.error ?? install.status !== 0) {
      throw new Error(
        `npm install typescript@${version} failed: ${install.error?.message ?? install.stderr}`,
      );
    }
    // NODE_ENV=test short-circuits componentize, so the runtime need only exist.
    await env.writeFile('./lib/fastedge-runtime.wasm', 'Some binary data');
    return env;
  };

  it(
    'should type-check and build a valid TypeScript entrypoint',
    async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await setup();
      await writeFile('input.ts', VALID_TS);

      const { code, stdout } = await execute(
        'node',
        './bin/fastedge-build.js input.ts dist/output.wasm',
      );

      expect(code).toBe(0);
      expect(stdout[0]).toContain('Build success!!');
      await cleanup();
    },
    INSTALL_AND_BUILD_TIMEOUT,
  );

  it(
    'should accept an entrypoint using import.meta',
    async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await setup();
      await writeFile('input.ts', IMPORT_META_TS);

      const { code, stdout } = await execute(
        'node',
        './bin/fastedge-build.js input.ts dist/output.wasm',
      );

      expect(code).toBe(0);
      expect(stdout.join('\n')).not.toContain('TS1343');
      await cleanup();
    },
    INSTALL_AND_BUILD_TIMEOUT,
  );

  it(
    'should reject a TypeScript entrypoint with a type error',
    async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await setup();
      await writeFile('input.ts', INVALID_TS);

      const { code, stderr } = await execute(
        'node',
        './bin/fastedge-build.js input.ts dist/output.wasm',
      );

      expect(code).toBe(1);
      expect(stderr[0]).toContain('SyntaxError: Typescript code');
      await cleanup();
    },
    INSTALL_AND_BUILD_TIMEOUT,
  );

  it(
    'should surface a consumer tsconfig using the removed node10 resolution',
    async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await setup();
      await writeFile('input.ts', VALID_TS);
      await writeFile(
        'tsconfig.json',
        JSON.stringify({
          compilerOptions: { moduleResolution: 'node', target: 'esnext', noEmit: true },
          files: ['input.ts'],
        }),
      );

      const { code, stdout } = await execute(
        'node',
        './bin/fastedge-build.js -i input.ts -o dist/output.wasm -t tsconfig.json',
      );

      if (majorOf(version) >= 7) {
        // node10 was removed, and no flag can suppress it - the consumer has
        // to change their own tsconfig. Assert we report it rather than
        // silently mis-compiling.
        expect(code).toBe(1);
        expect(stdout.join('\n')).toContain('TS5108');
      } else {
        // Still accepted on TS 5.x, and must not need --ignoreDeprecations.
        expect(code).toBe(0);
        expect(stdout.join('\n')).not.toContain('TS5107');
      }
      await cleanup();
    },
    INSTALL_AND_BUILD_TIMEOUT,
  );

  it(
    'should still accept a consumer tsconfig using a suppressible deprecated option',
    async () => {
      expect.assertions(1);
      const { execute, cleanup, writeFile } = await setup();
      await writeFile('input.ts', VALID_TS);
      // Deprecated in TS 5.0 but still functional there, and only silenced by
      // --ignoreDeprecations. Guards against dropping that flag for project
      // builds, which would break configs that work today.
      await writeFile(
        'tsconfig.json',
        JSON.stringify({
          compilerOptions: { keyofStringsOnly: true, target: 'esnext', noEmit: true },
          files: ['input.ts'],
        }),
      );

      const { code } = await execute(
        'node',
        './bin/fastedge-build.js -i input.ts -o dist/output.wasm -t tsconfig.json',
      );

      // Suppressible on 5.0.x; genuinely removed from 5.5 onwards, where no
      // flag helps and failing is the correct outcome.
      expect(code).toBe(version.startsWith('5.0.') ? 0 : 1);
      await cleanup();
    },
    INSTALL_AND_BUILD_TIMEOUT,
  );
});
