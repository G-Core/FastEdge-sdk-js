import { createTestFileBinaryArray } from '../__fixtures__/index.ts';
import { createEmbeddedStoreEntry } from '../embedded-store-entry/embedded-store-entry.ts';

const createTestData = () => {
  const testString = 'Hello, World! This is test data.';
  const array = createTestFileBinaryArray(testString);
  const contentEncoding = 'utf-8';
  const hash = 'test-hash-123';
  const size = array.length;
  return { testString, array, contentEncoding, hash, size };
};

describe('embedded-store-entry', () => {
  describe('createEmbeddedStoreEntry', () => {
    describe('initialization', () => {
      it('should create embedded store entry with all parameters', () => {
        expect.assertions(7);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        expect(entry).toBeDefined();
        expect(typeof entry.body).toBe('function');
        expect(typeof entry.bodyUsed).toBe('function');
        expect(typeof entry.arrayBuffer).toBe('function');
        expect(typeof entry.contentEncoding).toBe('function');
        expect(typeof entry.hash).toBe('function');
        expect(typeof entry.size).toBe('function');
      });

      it('should handle null content encoding', () => {
        expect.assertions(1);
        const { array, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, null, hash, size);

        expect(entry.contentEncoding()).toBeNull();
      });

      it('should handle empty array', () => {
        expect.assertions(2);
        const emptyArray = new Uint8Array(0);

        const entry = createEmbeddedStoreEntry(emptyArray, 'utf-8', 'empty-hash', 0);

        expect(entry.size()).toBe(0);
        expect(entry.body()).toBeDefined();
      });

      it('should handle large arrays', () => {
        expect.assertions(2);
        const largeArray = new Uint8Array(1000000); // 1MB
        largeArray.fill(65); // Fill with 'A'

        const entry = createEmbeddedStoreEntry(
          largeArray,
          'binary',
          'large-hash',
          largeArray.length,
        );

        expect(entry.size()).toBe(1000000);
        expect(entry.hash()).toBe('large-hash');
      });
    });

    describe('metadata accessors', () => {
      it('should return correct content encoding', () => {
        expect.assertions(1);
        const { array, hash, size } = createTestData();
        const contentEncoding = 'gzip';

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        expect(entry.contentEncoding()).toBe('gzip');
      });

      it('should return correct hash', () => {
        expect.assertions(1);
        const { array, contentEncoding, size } = createTestData();
        const hash = 'sha256-abcdef123456';

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        expect(entry.hash()).toBe('sha256-abcdef123456');
      });

      it('should return correct size', () => {
        expect.assertions(1);
        const { array, contentEncoding, hash } = createTestData();
        const size = 12345;

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        expect(entry.size()).toBe(12345);
      });

      it('should handle special characters in hash', () => {
        expect.assertions(1);
        const { array, contentEncoding, size } = createTestData();
        const specialHash = 'hash-with-special-chars!@#$%^&*()';

        const entry = createEmbeddedStoreEntry(array, contentEncoding, specialHash, size);

        expect(entry.hash()).toBe('hash-with-special-chars!@#$%^&*()');
      });
    });
    describe('body method', () => {
      it('should return a ReadableStream', () => {
        expect.assertions(2);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body();

        expect(body).toBeInstanceOf(ReadableStream);
        expect(body).not.toBeNull();
      });

      it('should return the same stream instance on multiple calls', () => {
        expect.assertions(1);
        const { array, contentEncoding, hash, size } = createTestData();
        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body1 = entry.body();
        const body2 = entry.body();
        expect(body1).toBe(body2);
      });
      it('should return stream with correct methods', () => {
        expect.assertions(6);
        const { array, contentEncoding, hash, size } = createTestData();
        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body();
        expect(body).toHaveProperty('getReader');
        expect(body).toHaveProperty('isLocked');
        expect(body).toHaveProperty('isDisturbed');
        expect(typeof body!.getReader).toBe('function');
        expect(typeof (body as any).isLocked).toBe('function');
        expect(typeof (body as any).isDisturbed).toBe('function');
      });
    });

    describe('bodyUsed method', () => {
      it('should return false initially', () => {
        expect.assertions(1);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        expect(entry.bodyUsed()).toBe(false);
      });

      it('should return true after arrayBuffer is called', async () => {
        expect.assertions(2);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        expect(entry.bodyUsed()).toBe(false);
        await entry.arrayBuffer();
        expect(entry.bodyUsed()).toBe(true);
      });

      it('should remain true after multiple arrayBuffer calls', async () => {
        expect.assertions(2);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        await entry.arrayBuffer();
        expect(entry.bodyUsed()).toBe(true);

        try {
          await entry.arrayBuffer();
        } catch {
          // Expected to throw
        }

        expect(entry.bodyUsed()).toBe(true);
      });
    });

    describe('arrayBuffer method', () => {
      it('should return the original data as ArrayBuffer', async () => {
        expect.assertions(3);
        const { testString, array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const result = await entry.arrayBuffer();

        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(array.length);

        const decoded = new TextDecoder().decode(result);
        expect(decoded).toBe(testString);
      });

      it('should handle empty arrays', async () => {
        expect.assertions(2);
        const emptyArray = new Uint8Array(0);

        const entry = createEmbeddedStoreEntry(emptyArray, 'utf-8', 'empty-hash', 0);
        const result = await entry.arrayBuffer();

        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(0);
      });

      it('should handle binary data correctly', async () => {
        expect.assertions(2);
        const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);

        const entry = createEmbeddedStoreEntry(
          binaryData,
          'binary',
          'binary-hash',
          binaryData.length,
        );
        const result = await entry.arrayBuffer();

        expect(result.byteLength).toBe(6);
        const resultArray = new Uint8Array(result);
        expect(resultArray).toStrictEqual(binaryData);
      });

      it('should handle large data efficiently', async () => {
        expect.assertions(3);
        const largeData = new Uint8Array(100000);
        for (let i = 0; i < largeData.length; i++) {
          largeData[i] = i % 256;
        }

        const entry = createEmbeddedStoreEntry(largeData, 'binary', 'large-hash', largeData.length);

        const startTime = Date.now();
        const result = await entry.arrayBuffer();
        const endTime = Date.now();

        expect(result.byteLength).toBe(100000);
        expect(endTime - startTime).toBeLessThan(1000); // Should be fast

        const resultArray = new Uint8Array(result);
        expect(resultArray).toStrictEqual(largeData);
      });

      it('should throw error when body already consumed', async () => {
        expect.assertions(1);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        await entry.arrayBuffer(); // First call should work

        await expect(entry.arrayBuffer()).rejects.toThrow('Body has already been consumed');
      });

      it('should throw error when stream is locked', async () => {
        expect.assertions(1);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body();

        // Lock the stream
        const reader = body!.getReader();

        await expect(entry.arrayBuffer()).rejects.toThrow(
          "The ReadableStream body is already locked and can't be consumed",
        );

        reader.releaseLock();
      });

      it('should throw error when stream is disturbed', async () => {
        expect.assertions(1);
        const { array, contentEncoding, hash, size } = createTestData();
        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body() as any;
        // Read from the stream to disturb it
        const reader = body.getReader();
        await reader.read();
        reader.releaseLock();
        await expect(entry.arrayBuffer()).rejects.toThrow(
          'Body object should not be disturbed or locked',
        );
      });
    });

    describe('stream functionality', () => {
      it('should create readable stream with correct data', async () => {
        expect.assertions(3);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body();
        const reader = body!.getReader();

        const { done, value } = await reader.read();
        expect(done).toBe(false);
        expect(value).toStrictEqual(array);

        const { done: done2 } = await reader.read();
        expect(done2).toBe(true);

        reader.releaseLock();
      });

      it('should handle stream locking correctly', () => {
        expect.assertions(3);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body() as any;

        expect(body.isLocked()).toBe(false);

        const reader = body.getReader();
        expect(body.isLocked()).toBe(true);

        reader.releaseLock();
        expect(body.isLocked()).toBe(false);
      });

      it('should track disturbed state correctly', async () => {
        expect.assertions(3);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body() as any;

        expect(body.isDisturbed()).toBe(false);

        const reader = body.getReader();
        expect(body.isDisturbed()).toBe(false);

        // Read until done
        await reader.read(); // Read data
        await reader.read(); // Read done

        expect(body.isDisturbed()).toBe(true);

        reader.releaseLock();
      });

      it('should track disturbed state on cancel', async () => {
        expect.assertions(2);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body() as any;
        const reader = body.getReader();

        expect(body.isDisturbed()).toBe(false);

        await reader.cancel('Test cancel');
        expect(body.isDisturbed()).toBe(true);
      });

      it('should handle multiple readers correctly', () => {
        expect.assertions(4);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body() as any;

        const reader1 = body.getReader();
        expect(body.isLocked()).toBe(true);

        // Trying to get another reader should throw
        expect(() => body.getReader()).toThrow('Invalid state: ReadableStream is locked');

        reader1.releaseLock();
        expect(body.isLocked()).toBe(false);

        // Now we can get another reader
        const reader2 = body.getReader();
        expect(body.isLocked()).toBe(true);

        reader2.releaseLock();
      });
    });

    describe('edge cases and error handling', () => {
      it('should handle very large arrays', async () => {
        expect.assertions(1001);
        const size = 5 * 1024 * 1024; // 5MB
        const largeArray = new Uint8Array(size);

        // Fill with pattern
        for (let i = 0; i < size; i++) {
          largeArray[i] = i % 256;
        }

        const entry = createEmbeddedStoreEntry(largeArray, 'binary', 'large-hash', size);
        const result = await entry.arrayBuffer();

        expect(result.byteLength).toBe(size);

        // Verify pattern
        const resultArray = new Uint8Array(result);
        for (let i = 0; i < Math.min(1000, size); i++) {
          expect(resultArray[i]).toBe(i % 256);
        }
      });

      it('should handle concurrent arrayBuffer calls', async () => {
        expect.assertions(2);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);

        // Start two concurrent calls
        const promise1 = entry.arrayBuffer();
        const promise2 = entry.arrayBuffer();

        // First should succeed
        await expect(promise1).resolves.toBeDefined();

        // Second should fail
        await expect(promise2).rejects.toThrow('Body has already been consumed');
      });

      it('should handle reader operations after arrayBuffer consumption', async () => {
        expect.assertions(2);
        const { array, contentEncoding, hash, size } = createTestData();
        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        await entry.arrayBuffer();
        expect(entry.bodyUsed()).toBe(true);
        // Stream should still be accessible but disturbed
        const body = entry.body() as any;
        expect(body.isDisturbed()).toBe(true);
      });

      it('should handle special Unicode data', async () => {
        expect.assertions(1);
        const unicodeString = 'Hello 🌍! Testing unicode: αβγδε ñáéíóú 中文';
        const array = new TextEncoder().encode(unicodeString);

        const entry = createEmbeddedStoreEntry(array, 'utf-8', 'unicode-hash', array.length);
        const result = await entry.arrayBuffer();

        const decoded = new TextDecoder().decode(result);
        expect(decoded).toBe(unicodeString);
      });

      it('should handle zero-size data', async () => {
        expect.assertions(4);
        const emptyArray = new Uint8Array(0);

        const entry = createEmbeddedStoreEntry(emptyArray, 'utf-8', 'empty', 0);

        expect(entry.size()).toBe(0);
        expect(entry.bodyUsed()).toBe(false);

        const result = await entry.arrayBuffer();
        expect(result.byteLength).toBe(0);
        expect(entry.bodyUsed()).toBe(true);
      });

      it('should maintain isolation between multiple entries', async () => {
        expect.assertions(5);
        const data1 = new TextEncoder().encode('Data 1');
        const data2 = new TextEncoder().encode('Data 2');

        const entry1 = createEmbeddedStoreEntry(data1, 'utf-8', 'hash1', data1.length);
        const entry2 = createEmbeddedStoreEntry(data2, 'utf-8', 'hash2', data2.length);

        const result1 = await entry1.arrayBuffer();
        expect(entry1.bodyUsed()).toBe(true);
        expect(entry2.bodyUsed()).toBe(false);

        const result2 = await entry2.arrayBuffer();
        expect(entry2.bodyUsed()).toBe(true);

        expect(new TextDecoder().decode(result1)).toBe('Data 1');
        expect(new TextDecoder().decode(result2)).toBe('Data 2');
      });

      it('should handle stream reader errors gracefully', async () => {
        expect.assertions(1);
        const { array, contentEncoding, hash, size } = createTestData();

        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body();
        const reader = body!.getReader();

        // Read once
        await reader.read();

        // Cancel with error
        await reader.cancel(new Error('Test error'));

        // Stream should be disturbed
        expect((body as any).isDisturbed()).toBe(true);
      });

      it('should handle malformed content encoding', () => {
        expect.assertions(1);
        const { array, hash, size } = createTestData();
        const malformedEncoding = 'not-a-real-encoding-123!@#';

        const entry = createEmbeddedStoreEntry(array, malformedEncoding, hash, size);

        // Should not throw, just return the encoding as-is
        expect(entry.contentEncoding()).toBe(malformedEncoding);
      });
    });

    describe('memory management', () => {
      it('should properly release resources after consumption', async () => {
        expect.assertions(4);
        const { array, contentEncoding, hash, size } = createTestData();
        const entry = createEmbeddedStoreEntry(array, contentEncoding, hash, size);
        const body = entry.body() as any;
        expect(body.isLocked()).toBe(false);
        expect(body.isDisturbed()).toBe(false);
        await entry.arrayBuffer();
        expect(entry.bodyUsed()).toBe(true);
        expect(body.isDisturbed()).toBe(true);
      });

      it('should handle rapid successive operations', async () => {
        expect.assertions(100);
        const testData = [];

        // Create multiple entries rapidly
        for (let i = 0; i < 100; i++) {
          const data = new TextEncoder().encode(`Test data ${i}`);
          const entry = createEmbeddedStoreEntry(data, 'utf-8', `hash-${i}`, data.length);
          testData.push({ entry, expected: `Test data ${i}` });
        }

        // Consume all rapidly
        const results = await Promise.all(
          testData.map(async ({ entry, expected }) => {
            const buffer = await entry.arrayBuffer();
            const decoded = new TextDecoder().decode(buffer);
            return { decoded, expected };
          }),
        );

        // Verify all results
        for (const { decoded, expected } of results) {
          expect(decoded).toBe(expected);
        }
      });
    });
  });
});
