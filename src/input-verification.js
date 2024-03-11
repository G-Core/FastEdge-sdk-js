import { spawnSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

function containsSyntaxErrors(jsInput) {
  const nodeProcess = spawnSync(`"${process.execPath}"`, ['--check', jsInput], {
    stdio: [null, null, null],
    shell: true,
    encoding: 'utf-8',
  });
  if (nodeProcess.status === 0) {
    return false;
  }
  // eslint-disable-next-line no-console
  console.error(
    `${
      nodeProcess.stderr.split('\nSyntaxError: Invalid or unexpected token\n')[0]
    }\nSyntaxError: Invalid or unexpected token\n`,
  );
  return true;
}

async function isFile(path, allowNonexistent = false) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return allowNonexistent;
    }
    throw error;
  }
}

async function createOutputDirectory(path) {
  try {
    await mkdir(dirname(path), {
      recursive: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: Failed to create the "output" (${path}) directory`, error.message);
    process.exit(1);
  }
}

async function validateFilePaths(input, output, wasmEngine = './lib/fastedge-runtime.wasm') {
  if (!(await isFile(input))) {
    // eslint-disable-next-line no-console
    console.error(`Error: Input "${input}" is not a file`);
    process.exit(1);
  }
  if (output.slice(-5) !== '.wasm') {
    // eslint-disable-next-line no-console
    console.error(`Error: Output ${output} must be a .wasm file path`);
    process.exit(1);
  }
  if (!(await isFile(output))) {
    createOutputDirectory(output);
    if (!(await isFile(output, /* AllowNonexistent */ true))) {
      // eslint-disable-next-line no-console
      console.error(`Error: "${output}" path does not exist`);
      process.exit(1);
    }
  }
  if (!(await isFile(wasmEngine))) {
    // eslint-disable-next-line no-console
    console.error(`Error: "${wasmEngine}" is not a file`);
    process.exit(1);
  }

  if (containsSyntaxErrors(input)) {
    // eslint-disable-next-line no-console
    console.error(`Error: "${input}" contains JS Errors`);
    process.exit(1);
  }
}

export { containsSyntaxErrors, validateFilePaths };
