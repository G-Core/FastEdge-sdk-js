import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareEnvironment } from '@gmrchk/cli-testing-library';

import { USAGE_TEXT } from '~fastedge-assets/print-info';

const helpInfo = USAGE_TEXT.split('\n')
  .filter(Boolean)
  .map((s) => s.trim());

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = readFileSync(join(__dirname, '../package.json'), {
  encoding: 'utf-8',
});
const { version } = JSON.parse(packageJson);

describe('fastedge-assets', () => {
  describe('prints information to console', () => {
    it.each([
      ['NO arguments', '', 1],
      ['incorrect arguments - only input', '-i ./public', 1],
      ['incorrect arguments - only output', '-o ./static-asset-manifest.js', 1],
      [
        'incorrect arguments - too many inputs',
        './public ./static-asset-manifest.js something.js',
        1,
      ],
      [
        'incorrect arguments - fileInputs && config flag',
        '-c ./public ./static-asset-manifest.js',
        1,
      ],
      ['the --help || -h flags', '--help', 0],
    ])('should print help and exit if %s are provided', async (_, args, exitCode) => {
      expect.assertions(2);
      const { execute, cleanup } = await prepareEnvironment();
      const { code, stdout } = await execute('node', `./bin/fastedge-assets.js ${args}`);
      expect(code).toBe(exitCode);
      expect(stdout).toStrictEqual(helpInfo);
      await cleanup();
    });
    it('should print the current js-sdk version', async () => {
      expect.assertions(2);
      const { execute, cleanup, writeFile } = await prepareEnvironment();
      await writeFile('./package.json', packageJson);
      const { code, stdout } = await execute('node', './bin/fastedge-assets.js --version');
      expect(code).toBe(0);
      expect(stdout).toStrictEqual([`@gcoredev/fastedge-sdk-js: ${version}`]);
      await cleanup();
    });
  });

  describe('validates files and paths exist', () => {
    it('should error if input folder does not exist', async () => {
      expect.assertions(2);
      const { execute, cleanup } = await prepareEnvironment();
      const { code, stderr } = await execute(
        'node',
        './bin/fastedge-assets.js /public ./static-asset-manifest.js',
      );
      expect(code).toBe(1);
      expect(stderr[0]).toContain('Error: Input "/public" is not a directory');
      await cleanup();
    });
    it('should create the output file within the correct directory structure', async () => {
      expect.assertions(3);
      const { execute, cleanup, writeFile, ls } = await prepareEnvironment();
      await writeFile('public/input.js', 'function Hello() { console.log("Hello World"); }');
      await writeFile('public/README.md', 'Some text data');
      const { code } = await execute(
        'node',
        './bin/fastedge-assets.js public build/static-asset-manifest.js',
      );
      const folderList = await ls('./');
      const distFolderExists = folderList.includes('build');
      const buildFolderList = await ls('./build');
      const assetManifestExists = buildFolderList.includes('static-asset-manifest.js');
      expect(code).toBe(0);
      expect(distFolderExists).toBe(true);
      expect(assetManifestExists).toBe(true);
      await cleanup();
    });
  });

  describe('uses build-config file to create build', () => {
    it('should error if conifg file does not exist', async () => {
      expect.assertions(2);
      const { execute, cleanup } = await prepareEnvironment();
      const { code, stderr } = await execute(
        'node',
        './bin/fastedge-assets.js -c build/static-asset-config.js',
      );
      expect(code).toBe(1);
      expect(stderr[0]).toContain(
        'Error: Config file not found at build/static-asset-config.js. Skipping file.',
      );
      await cleanup();
    });
    it('should use asset-config to determine inputs and outputs', async () => {
      expect.assertions(2);
      const { execute, cleanup, ls, writeFile } = await prepareEnvironment();
      await writeFile('./public/input.js', 'function Hello() { console.log("Hello World"); }');
      await writeFile('./public/README.md', 'Some text data');
      await writeFile(
        './build/static-asset-config.js',
        'export const config = { "publicDir": "./public", "assetManifestPath": "dist/static-assets-manifest.js" };',
      );
      await writeFile('./package.json', '{ "type": "module" }');
      const { code } = await execute(
        'node',
        './bin/fastedge-assets.js -c build/static-asset-config.js',
      );

      const distFolderList = await ls('./dist');
      expect(code).toBe(0);
      expect(distFolderList).toContain('static-assets-manifest.js');
      await cleanup();
    });
  });
});
