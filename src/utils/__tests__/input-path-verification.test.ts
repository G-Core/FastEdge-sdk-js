import { validateFileExists, validateFilePaths } from '../input-path-verification.ts';

const mockIsFile = jest.fn();
const mockCreateOutputDirectory = jest.fn();
const mockColorLog = jest.fn();
const mockContainsSyntaxErrors = jest.fn();

jest.mock('~utils/file-system', () => ({
  isFile: (...args: any[]) => mockIsFile(...args),
  createOutputDirectory: (...args: any[]) => mockCreateOutputDirectory(...args),
}));

jest.mock('~utils/color-log', () => ({
  colorLog: (...args: any[]) => mockColorLog(...args),
}));

// Mock containsSyntaxErrors for validateFilePaths tests
jest.mock('~utils/syntax-checker', () => ({
  containsSyntaxErrors: (...args: any[]) => mockContainsSyntaxErrors(...args),
}));

describe('input-path-verification', () => {
  describe('validateFileExists', () => {
    it('should resolve true if file exists', async () => {
      expect.assertions(1);
      mockIsFile.mockReturnValue(true);
      await expect(validateFileExists('/some/file')).resolves.toBeUndefined();
    });

    it('should resolve false if file does not exist', async () => {
      expect.assertions(2);
      const mockExit = jest.fn();

      // @ts-expect-error testing mock
      jest.spyOn(process, 'exit').mockImplementation(mockExit);
      mockIsFile.mockReturnValue(false);
      await validateFileExists('/some/file');
      // eslint-disable-next-line jest/prefer-called-with
      expect(mockColorLog).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('validateFilePaths', () => {
    let mockExit: jest.Mock;
    beforeEach(() => {
      jest.clearAllMocks();
      mockExit = jest.fn();
      // @ts-expect-error testing mock
      jest.spyOn(process, 'exit').mockImplementation(mockExit);
    });

    it('should exit if input file does not exist', async () => {
      expect.assertions(2);
      mockIsFile.mockResolvedValueOnce(false);
      await validateFilePaths('input.js', 'output.wasm');
      expect(mockColorLog).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('Input "input.js" is not a file'),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit if output file does not end with .wasm', async () => {
      expect.assertions(2);
      mockIsFile.mockResolvedValueOnce(true); // Input exists
      await validateFilePaths('input.js', 'output.txt');
      expect(mockColorLog).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('Output "output.txt" must be a .wasm file path'),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should create output directory if output file does not exist', async () => {
      expect.assertions(1);
      mockIsFile.mockResolvedValueOnce(true); // Input exists
      mockIsFile.mockResolvedValueOnce(false); // Output does not exist
      mockIsFile.mockResolvedValueOnce(true); // Output exists after creation
      mockContainsSyntaxErrors.mockReturnValue(false);
      await validateFilePaths('input.js', 'output.wasm');
      expect(mockCreateOutputDirectory).toHaveBeenCalledWith('output.wasm');
    });

    it('should exit if output path does not exist after directory creation', async () => {
      expect.assertions(2);
      mockIsFile.mockResolvedValueOnce(true); // Input exists
      mockIsFile.mockResolvedValueOnce(false); // Output does not exist
      mockIsFile.mockResolvedValueOnce(false); // Output still does not exist
      await validateFilePaths('input.js', 'output.wasm');
      expect(mockColorLog).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('"output.wasm" path does not exist'),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit if input file contains syntax errors', async () => {
      expect.assertions(1);
      mockIsFile.mockResolvedValue(true); // Input and output exist
      mockContainsSyntaxErrors.mockReturnValue(true);
      await validateFilePaths('input.js', 'output.wasm');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should succeed if all checks pass', async () => {
      expect.assertions(2);
      mockIsFile.mockResolvedValue(true); // Input and output exist
      mockContainsSyntaxErrors.mockReturnValue(false);
      await expect(validateFilePaths('input.js', 'output.wasm')).resolves.toBeUndefined();
      expect(mockExit).not.toHaveBeenCalled();
    });
  });
});
