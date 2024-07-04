import { spawnSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

const INPUT_PATH = './integration-tests/test-files/index.js';
const OUTPUT_PATH = './integration-tests/test-files/output.wasm';

const removeOutputWasm = () => {
  try {
    unlinkSync(OUTPUT_PATH);
  } catch {
    /* Do nothing - file does not exist */
  }
};

describe('Confirm it creates an output file', () => {
  beforeAll(removeOutputWasm);
  afterAll(removeOutputWasm);
  it('should confirm that output.wasm does not already exist', async () => {
    expect.assertions(1);
    const outputExists = existsSync(OUTPUT_PATH);
    expect(outputExists).toBeFalsy();
  });
  it('should confirm that output.wasm gets created', async () => {
    expect.assertions(1);
    spawnSync('node', ['./bin/fastedge-build.js', INPUT_PATH, OUTPUT_PATH], {
      env: { ...process.env, NODE_ENV: 'production' },
    });
    const outputExists = existsSync(OUTPUT_PATH);
    expect(outputExists).toBeTruthy();
  });
});
