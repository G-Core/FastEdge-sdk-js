// eslint-disable-next-line import/extensions
import { componentize } from './componentize.js';

await componentize('./docs/examples/basic.js', './dist/basic.wasm');
await componentize('./docs/examples/downstream-fetch.js', './dist/downstream-fetch.wasm');
await componentize(
  './docs/examples/downstream-modify-response.js',
  './dist/downstream-modify-response.wasm',
);
await componentize('./docs/examples/headers.js', './dist/headers.wasm');
