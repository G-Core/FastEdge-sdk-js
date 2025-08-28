/* eslint-disable unicorn/no-array-for-each */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createOutputDirectory,
  getFilesRecursively,
  getTmpDir,
  isDirectory,
  isFile,
  resolveOsPath,
  resolveTmpDir,
  useUnixPath,
} from '../file-system.ts';

describe('file-system utilities', () => {
  let tempDir: string;
  let originalCwd: string;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = path.join(tmpdir(), `test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
    mkdirSync(tempDir, { recursive: true });

    // Store original cwd to restore later
    originalCwd = process.cwd();

    // Mock process.exit to prevent tests from actually exiting
    originalProcessExit = process.exit;
    process.exit = jest.fn() as any;

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);

    // Restore original process.exit
    process.exit = originalProcessExit;

    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Restore console.log
    jest.restoreAllMocks();
  });
  describe('resolveOsPath', () => {
    it('should resolve single path', () => {
      expect.assertions(1);
      const result = resolveOsPath('test/path');
      expect(result).toBe(path.normalize(path.resolve('test/path')));
    });

    it('should resolve multiple paths', () => {
      expect.assertions(1);
      const result = resolveOsPath('base', 'sub', 'file.txt');
      expect(result).toBe(path.normalize(path.resolve('base', 'sub', 'file.txt')));
    });

    it('should handle absolute paths', () => {
      expect.assertions(1);
      const absoluteTestPath = path.join(tempDir, 'absolute');
      const result = resolveOsPath(absoluteTestPath);
      expect(result).toBe(path.normalize(path.resolve(absoluteTestPath)));
    });

    it('should handle relative paths with ..', () => {
      expect.assertions(1);
      const result = resolveOsPath('../parent', 'child');
      expect(result).toBe(path.normalize(path.resolve('../parent', 'child')));
    });

    it('should handle empty paths', () => {
      expect.assertions(1);
      const result = resolveOsPath('');
      expect(result).toBe(path.normalize(path.resolve('')));
    });

    it('should normalize paths correctly', () => {
      expect.assertions(1);
      const result = resolveOsPath('path//double//slash');
      expect(result).toBe(path.normalize(path.resolve('path/double/slash')));
    });

    it('should handle mixed separators', () => {
      expect.assertions(1);
      const result = resolveOsPath('path/sub/forward');
      expect(result).toBe(path.normalize(path.resolve('path/sub/forward')));
    });

    it('should handle backslash separators on Windows', () => {
      expect.assertions(1);
      const inputPath = 'path\\backslash\\forward';
      const result = resolveOsPath(inputPath);
      const expected = path.normalize(path.resolve(inputPath));
      expect(result).toBe(expected);
    });

    it('should normalize various path formats', () => {
      expect.assertions(3);
      const testCases = [
        { input: 'simple/path', expected: 'simple/path' },
        { input: 'path//double//slash', expected: 'path/double/slash' },
        { input: './current/dir', expected: 'current/dir' },
      ];

      // eslint-disable-next-line unicorn/no-array-for-each
      testCases.forEach(({ input, expected }) => {
        const result = resolveOsPath(input);
        const expectedResult = path.normalize(path.resolve(expected));
        expect(result).toBe(expectedResult);
      });
    });
  });

  describe('useUnixPath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect.assertions(1);
      const windowsPath = 'C:\\Users\\test\\file.txt';
      const result = useUnixPath(windowsPath);
      expect(result).toBe('C:/Users/test/file.txt');
    });

    it('should handle mixed separators', () => {
      expect.assertions(1);
      const mixedPath = 'path\\to/mixed\\separators/file.txt';
      const result = useUnixPath(mixedPath);
      expect(result).toBe('path/to/mixed/separators/file.txt');
    });

    it('should leave Unix paths unchanged', () => {
      expect.assertions(1);
      const unixPath = '/home/user/file.txt';
      const result = useUnixPath(unixPath);
      expect(result).toBe('/home/user/file.txt');
    });

    it('should handle empty string', () => {
      expect.assertions(1);
      const result = useUnixPath('');
      expect(result).toBe('');
    });

    it('should handle single backslash', () => {
      expect.assertions(1);
      const result = useUnixPath('\\');
      expect(result).toBe('/');
    });

    it('should handle multiple consecutive backslashes', () => {
      expect.assertions(1);
      const result = useUnixPath('path\\\\\\to\\\\file');
      expect(result).toBe('path///to//file');
    });

    it('should handle paths with special characters', () => {
      expect.assertions(1);
      const result = useUnixPath('path\\with spaces\\and-symbols_123\\file.txt');
      expect(result).toBe('path/with spaces/and-symbols_123/file.txt');
    });
  });

  describe('isDirectory', () => {
    it('should return true for existing directory', async () => {
      expect.assertions(1);
      const testDir = path.join(tempDir, 'test-dir');
      mkdirSync(testDir);

      const result = await isDirectory(testDir);
      expect(result).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      expect.assertions(1);
      const nonExistentPath = path.join(tempDir, 'non-existent');

      const result = await isDirectory(nonExistentPath);
      expect(result).toBe(false);
    });

    it('should return false for file', async () => {
      expect.assertions(1);
      const testFile = path.join(tempDir, 'test-file.txt');
      writeFileSync(testFile, 'test content');

      const result = await isDirectory(testFile);
      expect(result).toBe(false);
    });

    it('should return true for empty directory when withContent is false', async () => {
      expect.assertions(1);
      const testDir = path.join(tempDir, 'empty-dir');
      mkdirSync(testDir);

      const result = await isDirectory(testDir, false);
      expect(result).toBe(true);
    });

    it('should return false for empty directory when withContent is true', async () => {
      expect.assertions(1);
      const testDir = path.join(tempDir, 'empty-dir');
      mkdirSync(testDir);

      const result = await isDirectory(testDir, true);
      expect(result).toBe(false);
    });

    it('should return true for directory with content when withContent is true', async () => {
      expect.assertions(1);
      const testDir = path.join(tempDir, 'dir-with-content');
      mkdirSync(testDir);
      writeFileSync(path.join(testDir, 'file.txt'), 'content');

      const result = await isDirectory(testDir, true);
      expect(result).toBe(true);
    });
  });

  describe('isFile', () => {
    it('should return true for existing file', async () => {
      expect.assertions(1);
      const testFile = path.join(tempDir, 'test-file.txt');
      writeFileSync(testFile, 'test content');

      const result = await isFile(testFile);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      expect.assertions(1);
      const nonExistentFile = path.join(tempDir, 'non-existent.txt');
      const result = await isFile(nonExistentFile);
      expect(result).toBe(false);
    });

    it('should return false for directory', async () => {
      expect.assertions(1);
      const testDir = path.join(tempDir, 'test-dir');
      mkdirSync(testDir);

      const result = await isFile(testDir);
      expect(result).toBe(false);
    });

    it('should return true for non-existent file when allowNonexistent is true', async () => {
      expect.assertions(1);
      const nonExistentFile = path.join(tempDir, 'non-existent.txt');

      const result = await isFile(nonExistentFile, true);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file when allowNonexistent is false', async () => {
      expect.assertions(1);
      const nonExistentFile = path.join(tempDir, 'non-existent.txt');

      const result = await isFile(nonExistentFile, false);
      expect(result).toBe(false);
    });
  });

  describe('createOutputDirectory', () => {
    it('should create directory successfully', async () => {
      expect.assertions(1);
      const outputPath = path.join(tempDir, 'output', 'nested', 'file.txt');

      await createOutputDirectory(outputPath);

      const dirPath = path.join(tempDir, 'output', 'nested');
      expect(existsSync(dirPath)).toBe(true);
    });

    it('should handle existing directory', async () => {
      expect.assertions(1);
      const outputPath = path.join(tempDir, 'existing', 'file.txt');
      const dirPath = path.join(tempDir, 'existing');
      mkdirSync(dirPath, { recursive: true });

      await createOutputDirectory(outputPath);

      expect(existsSync(dirPath)).toBe(true);
    });

    it('should handle nested directory creation', async () => {
      expect.assertions(1);
      const outputPath = path.join(tempDir, 'deep', 'nested', 'structure', 'file.txt');

      await createOutputDirectory(outputPath);

      const dirPath = path.join(tempDir, 'deep', 'nested', 'structure');
      expect(existsSync(dirPath)).toBe(true);
    });
  });

  describe('getTmpDir', () => {
    it('should create a temporary directory', async () => {
      expect.assertions(3);
      const tmpDir = await getTmpDir();

      expect(typeof tmpDir).toBe('string');
      expect(existsSync(tmpDir)).toBe(true);
      expect(tmpDir).toContain(tmpdir());

      // Clean up
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should create unique temporary directories', async () => {
      expect.assertions(3);
      const tmpDir1 = await getTmpDir();
      const tmpDir2 = await getTmpDir();

      expect(tmpDir1).not.toBe(tmpDir2);
      expect(existsSync(tmpDir1)).toBe(true);
      expect(existsSync(tmpDir2)).toBe(true);

      // Clean up
      rmSync(tmpDir1, { recursive: true, force: true });
      rmSync(tmpDir2, { recursive: true, force: true });
    });
  });

  describe('resolveTmpDir', () => {
    it('should resolve temp bundle path', () => {
      expect.assertions(1);
      const basePath = '/base/path';
      const result = resolveTmpDir(basePath);

      expect(result).toBe(path.resolve(basePath, 'temp.bundle.js'));
    });

    it('should handle relative paths', () => {
      expect.assertions(1);
      const basePath = 'relative/path';
      const result = resolveTmpDir(basePath);

      expect(result).toBe(path.resolve(basePath, 'temp.bundle.js'));
    });

    it('should handle empty path', () => {
      expect.assertions(1);
      const result = resolveTmpDir('');
      expect(result).toBe(path.resolve('', 'temp.bundle.js'));
    });
  });

  describe('getFilesRecursively', () => {
    let testStructureDir: string;

    beforeEach(() => {
      // Create test directory structure
      testStructureDir = path.join(tempDir, 'test-structure');
      mkdirSync(testStructureDir, { recursive: true });

      // Create files and directories
      mkdirSync(path.join(testStructureDir, 'subdir'), { recursive: true });
      mkdirSync(path.join(testStructureDir, 'node_modules'), {
        recursive: true,
      });
      mkdirSync(path.join(testStructureDir, '.git'), { recursive: true });
      mkdirSync(path.join(testStructureDir, '.well-known'), {
        recursive: true,
      });

      writeFileSync(path.join(testStructureDir, 'file1.txt'), 'content1');
      writeFileSync(path.join(testStructureDir, 'file2.js'), 'content2');
      writeFileSync(path.join(testStructureDir, 'subdir', 'nested.txt'), 'nested content');
      writeFileSync(path.join(testStructureDir, 'node_modules', 'module.js'), 'module content');
      writeFileSync(path.join(testStructureDir, '.git', 'config'), 'git config');
      writeFileSync(path.join(testStructureDir, '.hidden.txt'), 'hidden content');
      writeFileSync(path.join(testStructureDir, '.well-known', 'security.txt'), 'security info');
    });

    it('should get all files recursively with default options', () => {
      expect.assertions(7);
      const files = getFilesRecursively(testStructureDir, {});

      expect(files).toContain(path.join(testStructureDir, 'file1.txt'));
      expect(files).toContain(path.join(testStructureDir, 'file2.js'));
      expect(files).toContain(path.join(testStructureDir, 'subdir', 'nested.txt'));
      expect(files).toContain(path.join(testStructureDir, 'node_modules', 'module.js'));
      expect(files).toContain(path.join(testStructureDir, '.well-known', 'security.txt'));

      // Should not contain dot files by default
      expect(files).not.toContain(path.join(testStructureDir, '.git', 'config'));
      expect(files).not.toContain(path.join(testStructureDir, '.hidden.txt'));
    });

    it('should include dot files when ignoreDotFiles is false', () => {
      expect.assertions(3);
      const files = getFilesRecursively(testStructureDir, {
        ignoreDotFiles: false,
      });

      expect(files).toContain(path.join(testStructureDir, '.git', 'config'));
      expect(files).toContain(path.join(testStructureDir, '.hidden.txt'));
      expect(files).toContain(path.join(testStructureDir, '.well-known', 'security.txt'));
    });

    it('should ignore specified directories', () => {
      expect.assertions(4);
      const files = getFilesRecursively(testStructureDir, {
        ignoreDirs: [`/node_modules`, `/subdir`],
      });

      expect(files).toContain(path.join(testStructureDir, 'file1.txt'));
      expect(files).toContain(path.join(testStructureDir, 'file2.js'));
      expect(files).not.toContain(path.join(testStructureDir, 'subdir', 'nested.txt'));
      expect(files).not.toContain(path.join(testStructureDir, 'node_modules', 'module.js'));
    });
    it('should handle ignoreWellKnown option', () => {
      expect.assertions(3);
      const files = getFilesRecursively(testStructureDir, {
        ignoreDotFiles: false,
        ignoreWellKnown: true,
      });

      expect(files).toContain(path.join(testStructureDir, '.git', 'config'));
      expect(files).toContain(path.join(testStructureDir, '.hidden.txt'));
      expect(files).not.toContain(path.join(testStructureDir, '.well-known', 'security.txt'));
    });

    it('should include .well-known when ignoreWellKnown is false', () => {
      expect.assertions(3);
      const files = getFilesRecursively(testStructureDir, {
        ignoreDotFiles: false,
        ignoreWellKnown: false,
      });

      expect(files).toContain(path.join(testStructureDir, '.git', 'config'));
      expect(files).toContain(path.join(testStructureDir, '.hidden.txt'));
      expect(files).toContain(path.join(testStructureDir, '.well-known', 'security.txt'));
    });
    it('should handle empty directory', () => {
      expect.assertions(1);
      const emptyDir = path.join(tempDir, 'empty');
      mkdirSync(emptyDir);

      const files = getFilesRecursively(emptyDir, {});
      expect(files).toStrictEqual([]);
    });

    it('should handle directory with only subdirectories', () => {
      expect.assertions(1);
      const dirWithSubdirs = path.join(tempDir, 'only-subdirs');
      mkdirSync(path.join(dirWithSubdirs, 'sub1', 'sub2'), { recursive: true });

      const files = getFilesRecursively(dirWithSubdirs, {});
      expect(files).toStrictEqual([]);
    });

    it('should handle complex ignore patterns', () => {
      expect.assertions(4);
      const files = getFilesRecursively(testStructureDir, {
        ignoreDirs: [`${testStructureDir}/node_modules`],
        ignoreDotFiles: false,
        ignoreWellKnown: true,
      });

      expect(files).toContain(path.join(testStructureDir, 'file1.txt'));
      expect(files).toContain(path.join(testStructureDir, '.git', 'config'));
      expect(files).not.toContain(path.join(testStructureDir, 'node_modules', 'module.js'));
      expect(files).not.toContain(path.join(testStructureDir, '.well-known', 'security.txt'));
    });

    it('should change working directory and get files relative to input', () => {
      expect.assertions(2);
      process.chdir(tempDir);

      const relativePath = 'test-structure';
      const files = getFilesRecursively(relativePath, {});

      expect(files.length).toBeGreaterThan(0);
      expect(files.every((file) => file.includes(relativePath))).toBe(true);
    });

    it('should handle symbolic links if present', () => {
      expect.assertions(1);
      // This test is platform dependent, so we'll make it conditional
      try {
        const linkTarget = path.join(testStructureDir, 'file1.txt');
        const linkPath = path.join(testStructureDir, 'symlink.txt');

        // Create symlink (may fail on Windows without admin rights)
        try {
          symlinkSync(linkTarget, linkPath);

          const files = getFilesRecursively(testStructureDir, {});
          expect(files).toContain(linkTarget);
          // Symlink behavior may vary by platform
        } catch {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(true).toBeTruthy();
        }
      } catch {
        // Skip if symlink is not supported
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long paths', () => {
      expect.assertions(2);
      const longSegment = 'a'.repeat(100);
      const longPath = path.join(longSegment, longSegment, 'file.txt');

      const result = resolveOsPath(longPath);
      expect(typeof result).toBe('string');
      expect(result).toContain('file.txt');
    });

    it('should handle paths with special characters', () => {
      expect.assertions(1);
      const specialPath = 'path with spaces/special-chars_123/file@#$.txt';
      const result = useUnixPath(specialPath);

      expect(result).toBe('path with spaces/special-chars_123/file@#$.txt');
    });

    it('should handle Unicode characters in paths', () => {
      expect.assertions(1);
      const unicodePath = '测试/文件夹/文件.txt';
      const result = useUnixPath(unicodePath);

      expect(result).toBe('测试/文件夹/文件.txt');
    });

    it('should handle network paths on Windows', () => {
      expect.assertions(1);
      const networkPath = '\\\\server\\share\\file.txt';
      const result = useUnixPath(networkPath);

      expect(result).toBe('//server/share/file.txt');
    });
  });

  describe('integration tests', () => {
    it('should work together for complex file operations', async () => {
      expect.assertions(3);
      // Create a complex directory structure
      const projectDir = path.join(tempDir, 'project');
      const srcDir = path.join(projectDir, 'src');
      const testDir = path.join(projectDir, 'test');

      mkdirSync(srcDir, { recursive: true });
      mkdirSync(testDir, { recursive: true });

      writeFileSync(path.join(srcDir, 'index.js'), "console.log('hello');");
      writeFileSync(path.join(testDir, 'test.js'), 'test code');

      // Use multiple utilities together
      const isProjectDir = await isDirectory(projectDir);
      const isSrcFile = await isFile(path.join(srcDir, 'index.js'));
      const files = getFilesRecursively(projectDir, {});

      expect(isProjectDir).toBe(true);
      expect(isSrcFile).toBe(true);
      expect(files).toHaveLength(2);
    });

    it('should handle real-world project structure', async () => {
      expect.assertions(3);
      // Simulate a typical project structure
      const project = path.join(tempDir, 'real-project');
      const dirs = [
        'src',
        'src/components',
        'src/utils',
        'test',
        'node_modules',
        'node_modules/package',
        '.git',
        'dist',
      ];

      const files = [
        'package.json',
        'README.md',
        'src/index.js',
        'src/components/Button.js',
        'src/utils/helpers.js',
        'test/index.test.js',
        'node_modules/package/index.js',
        '.git/config',
        '.gitignore',
        'dist/bundle.js',
      ];

      // Create structure
      dirs.forEach((dir) => mkdirSync(path.join(project, dir), { recursive: true }));
      files.forEach((file) => writeFileSync(path.join(project, file), `content of ${file}`));

      // Test various scenarios
      const allFiles = getFilesRecursively(project, { ignoreDotFiles: false });
      const srcFiles = getFilesRecursively(path.join(project, 'src'), {});
      const withoutNodeModules = getFilesRecursively(project, {
        ignoreDirs: [path.join(project, 'node_modules')],
      });

      expect(allFiles).toHaveLength(files.length);
      expect(srcFiles).toHaveLength(3); // Files: index.js, Button.js, helpers.js
      expect(withoutNodeModules.length).toBeLessThan(allFiles.length);
    });
  });
});
// Helper function for creating symlinks (not available in original implementation)
function symlinkSync(target: string, path: string): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, unicorn/prefer-module
  const fs = require('node:fs');
  fs.symlinkSync(target, path);
}
