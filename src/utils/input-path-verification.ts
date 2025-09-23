import { colorLog } from '~utils/color-log.ts';
import { createOutputDirectory, isFile } from '~utils/file-system.ts';
import { containsSyntaxErrors } from '~utils/syntax-checker.ts';

/**
 * Validates that the given file exists.
 * @param filePath - The path to the file.
 * @throws An error if the file does not exist.
 */
async function validateFileExists(filePath: string): Promise<void> {
  if (!(await isFile(filePath))) {
    colorLog('error', `Error: "${filePath}" is not a file`);
    process.exit(1);
  }
}

/**
 * Validates the input and output file paths.
 * @param input - The path to the input file.
 * @param output - The path to the output file.
 * @param tsConfigPath - The path to the TypeScript configuration file (optional).
 * @throws An error if the paths are invalid.
 */
async function validateFilePaths(
  input: string,
  output: string,
  tsConfigPath?: string,
): Promise<void> {
  if (!(await isFile(input))) {
    colorLog('error', `Error: Input "${input}" is not a file`);
    process.exit(1);
  }

  if (!output.endsWith('.wasm')) {
    colorLog('error', `Error: Output "${output}" must be a .wasm file path`);
    process.exit(1);
  }

  if (!(await isFile(output))) {
    await createOutputDirectory(output);

    if (!(await isFile(output, /* AllowNonexistent */ true))) {
      colorLog('error', `Error: "${output}" path does not exist`);
      process.exit(1);
    }
  }

  if (containsSyntaxErrors(input, tsConfigPath)) {
    process.exit(1);
  }
}

export { validateFileExists, validateFilePaths };
