import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  composeComponents,
  findCustomSection,
  importWorld,
  loadComponents,
  restoreEngineBindings,
  spliceImports,
} from '~componentize/components.ts';

import { importVendored } from '~utils/import-vendored.ts';

jest.mock('~utils/import-vendored', () => ({ importVendored: jest.fn() }));

const tools = { plug: jest.fn(), importWorld: jest.fn(), imports: jest.fn() };
const splicer = { spliceBindings: jest.fn() };

const componentError = (payload: string): Error =>
  Object.assign(new Error('[object Object]'), { payload });

// Minimal module: header, then custom sections given as [name, payload bytes].
const wasmWithCustomSections = (...sections: Array<[string, number[]]>): Uint8Array => {
  const bytes = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];
  for (const [name, payload] of sections) {
    const nameBytes = [...Buffer.from(name)];
    const body = [nameBytes.length, ...nameBytes, ...payload];
    bytes.push(0, body.length, ...body);
  }
  return new Uint8Array(bytes);
};

describe('components', () => {
  let workDir: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    workDir = await mkdtemp(join(tmpdir(), 'fastedge-components-'));
    (importVendored as jest.Mock).mockImplementation(async (p: string) =>
      p.includes('splicer') ? { splicer } : tools,
    );
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  describe('loadComponents', () => {
    it.each(['Acme:x/y', 'acme/x', 'acme:x', 'acme:x/y/z', ''])(
      'rejects the interface name "%s"',
      async (name) => {
        expect.assertions(1);
        await expect(loadComponents({ [name]: './c.wasm' })).rejects.toThrow(
          'Invalid component interface name',
        );
      },
    );

    it('rejects a missing file', async () => {
      expect.assertions(1);
      await expect(loadComponents({ 'acme:x/y': join(workDir, 'nope.wasm') })).rejects.toThrow(
        'is not a readable file',
      );
    });

    it('rejects a file that is not a component', async () => {
      expect.assertions(1);
      const file = join(workDir, 'c.wasm');
      await writeFile(file, 'not wasm');
      tools.imports.mockImplementation(() => {
        throw componentError('bad magic');
      });
      await expect(loadComponents({ 'acme:x/y': file })).rejects.toThrow(
        `"${file}" is not a Wasm component`,
      );
    });

    it('reads each file once, however many interfaces it satisfies', async () => {
      expect.assertions(2);
      const file = join(workDir, 'c.wasm');
      await writeFile(file, 'component');
      tools.imports.mockReturnValue([]);
      const loaded = await loadComponents({
        'acme:x/y': file,
        'acme:x/z@1.0.0': file,
      });
      expect(loaded.interfaces).toStrictEqual(['acme:x/y', 'acme:x/z@1.0.0']);
      expect(loaded.binaries).toHaveLength(1);
    });
  });

  describe('importWorld', () => {
    it('surfaces the component-tools error message', async () => {
      expect.assertions(1);
      tools.importWorld.mockImplementation(() => {
        throw componentError('no component exports acme:x/y');
      });
      await expect(
        importWorld({ interfaces: ['acme:x/y'], binaries: [new Uint8Array()] }),
      ).rejects.toThrow('no component exports acme:x/y');
    });
  });

  describe('composeComponents', () => {
    const loaded = { interfaces: ['acme:x/y'], binaries: [new Uint8Array([1])] };

    it('returns the composed component when every import is provided by FastEdge', async () => {
      expect.assertions(2);
      tools.plug.mockReturnValue(new Uint8Array([9]));
      tools.imports.mockReturnValue([
        'gcore:fastedge/dictionary',
        'wasi:http/types@0.2.3',
        'wasi:cli/environment@0.2.0',
      ]);
      const out = await composeComponents(new Uint8Array([0]), loaded);
      expect(tools.plug).toHaveBeenCalledWith(new Uint8Array([0]), loaded.binaries);
      expect(out).toStrictEqual(new Uint8Array([9]));
    });

    it('rejects imports the FastEdge host does not provide', async () => {
      expect.assertions(1);
      tools.plug.mockReturnValue(new Uint8Array([9]));
      tools.imports.mockReturnValue([
        'wasi:http/types@0.2.3',
        'acme:other/thing',
        'wasi:http/types@0.3.0',
        'log',
      ]);
      await expect(composeComponents(new Uint8Array([0]), loaded)).rejects.toThrow(
        'Components import interfaces FastEdge does not provide: acme:other/thing, wasi:http/types@0.3.0, log',
      );
    });
  });

  describe('spliceImports', () => {
    it('writes the spliced engine, bindings and source, and builds the wizer env', async () => {
      expect.assertions(5);
      const engine = join(workDir, 'engine.wasm');
      await writeFile(engine, 'engine');
      splicer.spliceBindings.mockReturnValue({
        wasm: new Uint8Array([1, 2]),
        jsBindings: '/* bindings */',
        exports: [],
        imports: [
          ['regexped:urlguard/sets', 'scan-url', 3],
          ['acme:x/y', 'ping', 0],
        ],
      });

      const result = await spliceImports(engine, 'world app {}', 'app();', workDir);

      expect(splicer.spliceBindings).toHaveBeenCalledWith(
        new Uint8Array(Buffer.from('engine')),
        ['stdio', 'clocks', 'random', 'http', 'fetch-event'],
        'world app {}',
        undefined,
        'app',
        false,
      );
      expect(result.env).toStrictEqual({
        DEBUG: '',
        SOURCE_NAME: 'source.js',
        EXPORT_CNT: '0',
        FEATURE_CLOCKS: '1',
        IMPORT_CNT: '2',
        IMPORT0_NAME: 'scan-url',
        IMPORT0_ARGCNT: '3',
        IMPORT1_NAME: 'ping',
        IMPORT1_ARGCNT: '0',
      });
      expect(result.input).toBe(
        `--initializer-script-path "${workDir}/initializer.js" --strip-path-prefix "${workDir}/" "${workDir}/source.js"`,
      );
      await expect(readFile(join(workDir, 'source.js'), 'utf8')).resolves.toBe('app();');
      // Bindings plus the Wizer-time typed-array warm-up
      await expect(readFile(join(workDir, 'initializer.js'), 'utf8')).resolves.toMatch(
        /^\/\* bindings \*\/[\s\S]*new DataView\(ab\)/u,
      );
    });
  });

  describe('findCustomSection', () => {
    it('returns the whole section, header included', () => {
      expect.assertions(1);
      const wasm = wasmWithCustomSections(['other', [1]], ['component-type:bindings', [7, 8]]);
      const name = [...Buffer.from('component-type:bindings')];
      expect([...findCustomSection(wasm, 'component-type:bindings')!]).toStrictEqual([
        0,
        1 + name.length + 2,
        name.length,
        ...name,
        7,
        8,
      ]);
    });

    it('returns undefined when the section is absent', () => {
      expect.assertions(1);
      expect(findCustomSection(wasmWithCustomSections(['other', [1]]), 'missing')).toBeUndefined();
    });
  });

  describe('restoreEngineBindings', () => {
    it("appends the engine's component-type:bindings section to the module", async () => {
      expect.assertions(1);
      const engine = join(workDir, 'engine.wasm');
      const section = wasmWithCustomSections(['component-type:bindings', [5]]);
      await writeFile(engine, section);
      const module = new Uint8Array([1, 2, 3]);
      const out = await restoreEngineBindings(engine, module);
      expect([...out]).toStrictEqual([1, 2, 3, ...section.subarray(8)]);
    });

    it('throws if the engine has no bindings section', async () => {
      expect.assertions(1);
      const engine = join(workDir, 'engine.wasm');
      await writeFile(engine, wasmWithCustomSections());
      await expect(restoreEngineBindings(engine, new Uint8Array())).rejects.toThrow(
        'has no component-type:bindings section',
      );
    });
  });
});
