import { spawnSync } from 'node:child_process';

import { createOutputDirectory, isFile, npxPackagePath } from 'src/utils/file-system';
import { colorLog } from 'src/utils/prompts';

function containsSyntaxErrors(jsInput) {
  const nodeProcess = spawnSync(`"${process.execPath}"`, ['--check', jsInput], {
    stdio: [null, null, null],
    shell: true,
    encoding: 'utf-8',
  });
  if (nodeProcess.status === 0) {
    return false;
  }
  colorLog(
    undefined,
    `${nodeProcess.stderr.split('\nSyntaxError: Invalid or unexpected token\n')[0]}\n`,
  );
  colorLog('magenta', `SyntaxError: Invalid or unexpected token`);
  return true;
}

async function validateFilePaths(
  input,
  output,
  wasmEngine = npxPackagePath('./lib/fastedge-runtime.wasm'),
) {
  if (!(await isFile(input))) {
    colorLog('red', `Error: Input "${input}" is not a file`);
    process.exit(1);
  }
  if (output.slice(-5) !== '.wasm') {
    colorLog('red', `Error: Output ${output} must be a .wasm file path`);
    process.exit(1);
  }
  if (!(await isFile(output))) {
    createOutputDirectory(output);
    if (!(await isFile(output, /* AllowNonexistent */ true))) {
      colorLog('red', `Error: "${output}" path does not exist`);
      process.exit(1);
    }
  }
  if (!(await isFile(wasmEngine))) {
    colorLog('red', `Error: "${wasmEngine}" is not a file`);
    process.exit(1);
  }

  if (containsSyntaxErrors(input)) {
    colorLog('red', `Error: "${input}" contains JS Errors`);
    process.exit(1);
  }
}

export { containsSyntaxErrors, validateFilePaths };
