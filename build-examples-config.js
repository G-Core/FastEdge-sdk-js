// todo: import { componentize } from '@fastedge/sdk-js';

import { componentize } from './componentize.js';

await componentize('./docs/examples/basic.js', './dist/basic.wasm');
await componentize('./docs/examples/downstream-fetch.js', './dist/downstream-fetch.wasm');
await componentize(
  './docs/examples/downstream-modify-response.js',
  './dist/downstream-modify-response.wasm',
);
