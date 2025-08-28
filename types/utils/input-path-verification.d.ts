/**
 * Validates that the given file exists.
 * @param filePath - The path to the file.
 * @throws An error if the file does not exist.
 */
declare function validateFileExists(filePath: string): Promise<void>;
/**
 * Validates the input and output file paths.
 * @param input - The path to the input file.
 * @param output - The path to the output file.
 * @throws An error if the paths are invalid.
 */
declare function validateFilePaths(input: string, output: string): Promise<void>;
export { validateFileExists, validateFilePaths };
