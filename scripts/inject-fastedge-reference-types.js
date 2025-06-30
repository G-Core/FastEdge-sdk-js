import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const typesDir = path.join(__dirname, '../types');
  const files = await readdir(typesDir, { withFileTypes: true });

  const typeFileReferences = files
    .filter((file) => file.isFile() && file.name.endsWith('.d.ts') && file.name !== 'index.d.ts')
    .map((file) => `/// <reference path="${file.name}" />`);

  const indexFilePath = path.join(typesDir, 'index.d.ts');
  const indexFileContent = await readFile(indexFilePath, 'utf8');

  await writeFile(indexFilePath, `${typeFileReferences.join('\n')}\n\n${indexFileContent}`, 'utf8');
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`\u001B[31m Error injecting type references: ${error.message} \u001B[0m`);
  process.exit(1);
}
