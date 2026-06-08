#!/usr/bin/env node
// Builds integration-tests/test-application/test-app.ts into a WASM binary.
// Requires the SDK to be built first: pnpm run build:js
import { execSync } from 'child_process';

const INPUT = './integration-tests/test-application/test-app.ts';
const OUTPUT = './integration-tests/test-application/dist/test-app.wasm';

const output = execSync(`./bin/fastedge-build.js --input ${INPUT} --output ${OUTPUT}`, {
  encoding: 'utf8',
});

process.stdout.write(output);
