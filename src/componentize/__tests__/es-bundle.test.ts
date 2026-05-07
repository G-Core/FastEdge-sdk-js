import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { esBundle } from '~componentize/es-bundle.ts';

describe('es-bundle - fastedge:: namespace resolver', () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'fastedge-es-bundle-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  const bundle = async (source: string): Promise<string> => {
    const entry = join(workDir, 'entry.js');
    await writeFile(entry, source, 'utf8');
    return esBundle(entry);
  };

  it('resolves fastedge::env to globalThis.fastedge.getEnv', async () => {
    expect.assertions(1);
    const out = await bundle(`import { getEnv } from 'fastedge::env'; export { getEnv };`);
    expect(out).toContain('globalThis.fastedge.getEnv');
  });

  it('resolves fastedge::fs to globalThis.fastedge.readFileSync', async () => {
    expect.assertions(1);
    const out = await bundle(
      `import { readFileSync } from 'fastedge::fs'; export { readFileSync };`,
    );
    expect(out).toContain('globalThis.fastedge.readFileSync');
  });

  it('resolves fastedge::secret to both getSecret and getSecretEffectiveAt', async () => {
    expect.assertions(2);
    const out = await bundle(`
      import { getSecret, getSecretEffectiveAt } from 'fastedge::secret';
      export { getSecret, getSecretEffectiveAt };
    `);
    expect(out).toContain('globalThis.fastedge.getSecret');
    expect(out).toContain('globalThis.fastedge.getSecretEffectiveAt');
  });

  it('resolves fastedge::kv to globalThis.KvStore', async () => {
    expect.assertions(2);
    const out = await bundle(`import { KvStore } from 'fastedge::kv'; export { KvStore };`);
    expect(out).toContain('globalThis.KvStore');
    expect(out).not.toContain('globalThis.fastedge.KvStore');
  });

  it('resolves fastedge::cache to globalThis.Cache', async () => {
    expect.assertions(2);
    const out = await bundle(`import { Cache } from 'fastedge::cache'; export { Cache };`);
    expect(out).toContain('globalThis.Cache');
    expect(out).not.toContain('globalThis.fastedge.Cache');
  });

  it('returns empty contents for unknown fastedge:: imports', async () => {
    expect.assertions(2);
    const out = await bundle(`import * as unknown from 'fastedge::unknown'; export { unknown };`);
    expect(out).not.toContain('globalThis.fastedge.unknown');
    expect(out).not.toContain('globalThis.unknown');
  });
});
