import { rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const typesDir = path.join(__dirname, '../types/static-server');
  const oldFile = path.join(typesDir, 'index.d.ts');
  const newFile = path.join(typesDir, 'static-server.d.ts');
  await rename(oldFile, newFile);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`Error renaming file: ${error.message}`);
  process.exit(1);
}
