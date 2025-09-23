/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-var-requires */
import crypto from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createFileInfo } from '../file-info.ts';

describe('createFileInfo', () => {
  let tempDir: string;
  let testFile: string;
  let publicDir: string;

  beforeEach(() => {
    tempDir = path.join(
      tmpdir(),
      `file-info-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tempDir, { recursive: true });
    publicDir = '/public';
    testFile = path.join(tempDir, 'test.txt');
    writeFileSync(testFile, 'hello world');
  });

  afterEach(() => {
    try {
      unlinkSync(testFile);
    } catch {}
    try {
      // Remove tempDir if empty
      if (existsSync(tempDir)) {
        // Remove all files first
        const { readdirSync, rmdirSync } = require('node:fs');
        for (const f of readdirSync(tempDir)) {
          unlinkSync(path.join(tempDir, f));
        }
        rmdirSync(tempDir);
      }
    } catch {}
  });

  it('should return correct file info for a valid file', () => {
    expect.assertions(1);
    const assetKey = 'assets/test.txt';
    const info = createFileInfo(assetKey, publicDir, testFile);

    // Calculate expected hash
    const expectedHash = crypto.createHash('sha256').update('hello world').digest('hex');
    const expectedSize = Buffer.from('hello world').length;
    const expectedAssetPath = `.${path.join(publicDir, assetKey)}`;
    const expectedLastModified = Math.floor(
      require('node:fs').statSync(testFile).mtime.getTime() / 1000,
    );

    expect(info).toStrictEqual({
      size: expectedSize,
      hash: expectedHash,
      lastModifiedTime: expectedLastModified,
      assetPath: expectedAssetPath,
    });
  });

  it('should handle empty files', () => {
    expect.assertions(2);
    const emptyFile = path.join(tempDir, 'empty.txt');
    writeFileSync(emptyFile, '');
    const assetKey = 'assets/empty.txt';
    const info = createFileInfo(assetKey, publicDir, emptyFile);

    const expectedHash = crypto.createHash('sha256').update('').digest('hex');
    expect(info.size).toBe(0);
    expect(info.hash).toBe(expectedHash);

    unlinkSync(emptyFile);
  });

  it('should handle files with unicode content', () => {
    expect.assertions(1);
    const unicodeFile = path.join(tempDir, 'unicode.txt');
    writeFileSync(unicodeFile, '你好，世界🌍');
    const assetKey = 'assets/unicode.txt';
    const info = createFileInfo(assetKey, publicDir, unicodeFile);

    const expectedHash = crypto.createHash('sha256').update('你好，世界🌍').digest('hex');
    expect(info.hash).toBe(expectedHash);

    unlinkSync(unicodeFile);
  });

  it('should handle files with special characters', () => {
    expect.assertions(1);
    const specialFile = path.join(tempDir, 'special!@#.txt');
    writeFileSync(specialFile, '!@#$%^&*()_+');
    const assetKey = 'assets/special!@#.txt';
    const info = createFileInfo(assetKey, publicDir, specialFile);

    const expectedHash = crypto.createHash('sha256').update('!@#$%^&*()_+').digest('hex');
    expect(info.hash).toBe(expectedHash);

    unlinkSync(specialFile);
  });

  it('should throw if file does not exist', () => {
    expect.assertions(1);
    const missingFile = path.join(tempDir, 'missing.txt');
    const assetKey = 'assets/missing.txt';
    expect(() => createFileInfo(assetKey, publicDir, missingFile)).toThrow(
      'ENOENT: no such file or directory',
    );
  });

  it('should generate assetPath with correct format', () => {
    expect.assertions(1);
    const assetKey = 'folder/file.txt';
    const info = createFileInfo(assetKey, publicDir, testFile);
    expect(info.assetPath).toBe(`.${path.join(publicDir, assetKey)}`);
  });

  it('should handle publicDir with trailing slash', () => {
    expect.assertions(1);
    const assetKey = 'file.txt';
    const info = createFileInfo(assetKey, '/public/', testFile);
    expect(info.assetPath).toBe(`.${path.join('/public/', assetKey)}`);
  });

  it('should handle assetKey with leading slash', () => {
    expect.assertions(1);
    const assetKey = '/file.txt';
    const info = createFileInfo(assetKey, publicDir, testFile);
    expect(info.assetPath).toBe(`.${path.join(publicDir, assetKey)}`);
  });

  it('should handle assetKey with nested directories', () => {
    expect.assertions(1);
    const assetKey = 'nested/dir/file.txt';
    const info = createFileInfo(assetKey, publicDir, testFile);
    expect(info.assetPath).toBe(`.${path.join(publicDir, assetKey)}`);
  });

  it('should handle large files', () => {
    expect.assertions(2);
    const largeFile = path.join(tempDir, 'large.txt');
    const largeContent = 'a'.repeat(1024 * 1024); // 1MB
    writeFileSync(largeFile, largeContent);
    const assetKey = 'assets/large.txt';
    const info = createFileInfo(assetKey, publicDir, largeFile);

    expect(info.size).toBe(1024 * 1024);
    const expectedHash = crypto.createHash('sha256').update(largeContent).digest('hex');
    expect(info.hash).toBe(expectedHash);

    unlinkSync(largeFile);
  });

  it('should handle files with binary content', () => {
    expect.assertions(2);
    const binaryFile = path.join(tempDir, 'binary.dat');
    const buffer = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    writeFileSync(binaryFile, buffer);
    const assetKey = 'assets/binary.dat';
    const info = createFileInfo(assetKey, publicDir, binaryFile);

    expect(info.size).toBe(buffer.length);
    const expectedHash = crypto.createHash('sha256').update(buffer).digest('hex');
    expect(info.hash).toBe(expectedHash);

    unlinkSync(binaryFile);
  });

  it('should handle assetKey and publicDir with special characters', () => {
    expect.assertions(1);
    const assetKey = 'spécial/文件.txt';
    const info = createFileInfo(assetKey, '/püblic', testFile);
    expect(info.assetPath).toBe(`.${path.join('/püblic', assetKey)}`);
  });

  it('should handle assetKey and publicDir with spaces', () => {
    expect.assertions(1);
    const assetKey = 'folder with spaces/file with spaces.txt';
    const info = createFileInfo(assetKey, '/public dir', testFile);
    expect(info.assetPath).toBe(`.${path.join('/public dir', assetKey)}`);
  });
});
