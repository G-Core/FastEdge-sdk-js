import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareEnvironment } from '@gmrchk/cli-testing-library';

import { USAGE_TEXT } from '~src/print-info';

const helpInfo = USAGE_TEXT.split('\n')
  .filter(Boolean)
  .map((s) => s.trim());

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = readFileSync(join(__dirname, '../package.json'), {
  encoding: 'utf-8',
});
const { version } = JSON.parse(packageJson);

describe('componentize-cli', () => {
  describe('prints information to console', () => {
    it.each([
      ['NO arguments', '', 1],
      ['incorrect arguments', 'input.js', 1],
      ['the --help || -h flags', '--help', 0],
    ])('should print help and exit if %s are provided', async (_, args, exitCode) => {
      expect.assertions(2);
      const { execute, cleanup } = await prepareEnvironment();
      const { code, stdout } = await execute('node', `./componentize-cli.js ${args}`);
      expect(code).toBe(exitCode);
      expect(stdout).toStrictEqual(helpInfo);
      await cleanup();
    });
    it('should print the current js-sdk version', async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await prepareEnvironment();
      await writeFile('./package.json', packageJson);
      const { code, stdout } = await execute('node', './componentize-cli.js --version');
      expect(code).toBe(0);
      expect(stdout).toStrictEqual([`FastEdge/js-sdk: ${version}`]);
      await cleanup();
    });
  });
  describe('validates files and paths exist', () => {
    it('should error if input file does not exist', async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await prepareEnvironment();
      const { code, stderr, stdout } = await execute(
        'node',
        './componentize-cli.js input.js dist/output.wasm',
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
      const { code } = await execute('node', './componentize-cli.js input.js dist/output.wasm');
      const folderList = await ls('./');
      const distFolderExists = folderList.includes('dist');
      expect(code).toBe(0);
      expect(distFolderExists).toBe(true);
      await cleanup();
    });
    it('should exit with an error if the Javascript is not valid', async () => {
      expect.assertions(4);
      const { execute, cleanup, writeFile, ls } = await prepareEnvironment();
      await writeFile('input.js', 'function() { console.log("Hello World"); }');
      await writeFile('./lib/fastedge-runtime.wasm', 'Some binary data');
      const { code, stderr } = await execute(
        'node',
        './componentize-cli.js input.js dist/output.wasm',
      );
      expect(code).toBe(1);
      expect(stderr[1]).toContain('function() { console.log("Hello World"); }');
      expect(stderr[2]).toContain('^^^^^^^^');
      expect(stderr[3]).toContain('SyntaxError: Function statements require a function name');
      await cleanup();
    });
  });
});
