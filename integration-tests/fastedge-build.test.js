import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareEnvironment } from '@gmrchk/cli-testing-library';

import { USAGE_TEXT } from '~fastedge-build/print-info';

const helpInfo = USAGE_TEXT.split('\n')
  .filter(Boolean)
  .map((s) => s.trim());

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = readFileSync(join(__dirname, '../package.json'), {
  encoding: 'utf-8',
});
const { version } = JSON.parse(packageJson);

describe('fastedge-build', () => {
  describe('prints information to console', () => {
    it.each([
      ['NO arguments', '', 1],
      ['incorrect arguments - only input', '-i input.js', 1],
      ['incorrect arguments - only output', '-o output.wasm', 1],
      ['incorrect arguments - too many inputs', 'input.js output.wasm something.js', 1],
      ['incorrect arguments - fileInputs && config flag', '-c input.js output.wasm', 1],
      ['the --help || -h flags', '--help', 0],
    ])('should print help and exit if %s are provided', async (_, args, exitCode) => {
      expect.assertions(2);
      const { execute, cleanup } = await prepareEnvironment();
      const { code, stdout } = await execute('node', `./bin/fastedge-build.js ${args}`);
      expect(code).toBe(exitCode);
      expect(stdout).toStrictEqual(helpInfo);
      await cleanup();
    });
    it('should print the current js-sdk version', async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await prepareEnvironment();
      await writeFile('./package.json', packageJson);
      const { code, stdout } = await execute('node', './bin/fastedge-build.js --version');
      expect(code).toBe(0);
      expect(stdout).toStrictEqual([`@gcoredev/fastedge-sdk-js: ${version}`]);
      await cleanup();
    });
  });
  describe('validates files and paths exist', () => {
    it('should error if input file does not exist', async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await prepareEnvironment();
      const { code, stderr, stdout } = await execute(
        'node',
        './bin/fastedge-build.js input.js dist/output.wasm',
      );
      expect(code).toBe(1);
      expect(stderr[0]).toContain('Error: Input "input.js" is not a file');
      await cleanup();
    });
    it('should create the output path in the directory structure', async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile, ls } = await prepareEnvironment();
      await writeFile('input.js', 'function Hello() { console.log("Hello World"); }');
      await writeFile('./lib/fastedge-runtime.wasm', 'Some binary data');
      const { code } = await execute('node', './bin/fastedge-build.js input.js dist/output.wasm');
      const folderList = await ls('./');
      const distFolderExists = folderList.includes('dist');
      expect(code).toBe(0);
      expect(distFolderExists).toBe(true);
      await cleanup();
    });
    it('should exit with an error if the Javascript is not valid', async () => {
      expect.assertions(5);
      const { execute, cleanup, writeFile, ls } = await prepareEnvironment();
      await writeFile('input.js', 'function() { console.log("Hello World"); }');
      await writeFile('./lib/fastedge-runtime.wasm', 'Some binary data');
      const { code, stderr, stdout } = await execute(
        'node',
        './bin/fastedge-build.js input.js dist/output.wasm',
      );
      expect(code).toBe(1);
      expect(stdout[1]).toContain('function() { console.log("Hello World"); }');
      expect(stdout[2]).toContain('^^^^^^^^');
      expect(stdout[3]).toContain('SyntaxError: Function statements require a function name');
      expect(stderr[1]).toContain('Error: "input.js" contains JS Errors');
      await cleanup();
    });
  });
  describe('uses build-config file to create build', () => {
    it('should error if conifg file does not exist', async () => {
      expect.assertions(2);
      const { execute, cleanup } = await prepareEnvironment();
      const { code, stderr } = await execute('node', './bin/fastedge-build.js -c');
      expect(code).toBe(0);
      expect(stderr[0]).toContain(
        'Error: Config file not found at {{base}}/.fastedge/build-config.js. Skipping build.',
      );
      await cleanup();
    });
    it('should use build-config to determine inputs and outputs', async () => {
      expect.assertions(2);
      const { execute, cleanup, ls, writeFile } = await prepareEnvironment();
      await writeFile('./input.js', 'function Hello() { console.log("Hello World"); }');
      await writeFile(
        './.fastedge/build-config.js',
        'export const config = { "type": "http", "input": "input.js", "output": "./dist/fastedge.wasm" };',
      );
      await writeFile('./package.json', '{ "type": "module" }');
      const { code } = await execute('node', './bin/fastedge-build.js -c');
      const folderList = await ls('./');
      const distFolderExists = folderList.includes('dist');
      expect(code).toBe(0);
      expect(distFolderExists).toBe(true);
      await cleanup();
    });
  });
});
