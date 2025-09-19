import { createAssetCache } from '../asset-cache/asset-cache.ts';

describe('asset-cache', () => {
  describe('createAssetCache', () => {
    describe('initialization', () => {
      it('should create an empty cache when no initial assets provided', () => {
        expect.assertions(2);
        const cache = createAssetCache<string>();

        expect(cache.getAssetKeys()).toStrictEqual([]);
        expect(cache.getAsset('any-key')).toBeNull();
      });

      it('should create cache with initial assets', () => {
        expect.assertions(4);
        const initialAssets = {
          asset1: 'content1',
          asset2: 'content2',
          asset3: 'content3',
        };

        const cache = createAssetCache(initialAssets);

        expect(cache.getAssetKeys()).toStrictEqual(['asset1', 'asset2', 'asset3']);
        expect(cache.getAsset('asset1')).toBe('content1');
        expect(cache.getAsset('asset2')).toBe('content2');
        expect(cache.getAsset('asset3')).toBe('content3');
      });

      it('should handle empty object as initial assets', () => {
        expect.assertions(2);
        const cache = createAssetCache({});

        expect(cache.getAssetKeys()).toStrictEqual([]);
        expect(cache.getAsset('any-key')).toBeNull();
      });

      it('should work with different asset types', () => {
        expect.assertions(2);
        interface TestAsset {
          id: number;
          name: string;
        }

        const initialAssets: Record<string, TestAsset> = {
          test1: { id: 1, name: 'Test Asset 1' },
          test2: { id: 2, name: 'Test Asset 2' },
        };

        const cache = createAssetCache<TestAsset>(initialAssets);

        expect(cache.getAsset('test1')).toStrictEqual({
          id: 1,
          name: 'Test Asset 1',
        });
        expect(cache.getAsset('test2')).toStrictEqual({
          id: 2,
          name: 'Test Asset 2',
        });
      });

      it('should create independent cache instances', () => {
        expect.assertions(4);
        const cache1 = createAssetCache<string>();
        const cache2 = createAssetCache<string>();

        cache1.loadAsset('key1', 'value1');
        cache2.loadAsset('key2', 'value2');

        expect(cache1.getAsset('key1')).toBe('value1');
        expect(cache1.getAsset('key2')).toBeNull();
        expect(cache2.getAsset('key1')).toBeNull();
        expect(cache2.getAsset('key2')).toBe('value2');
      });
    });
    describe('loadAsset', () => {
      it('should load a new asset', () => {
        expect.assertions(2);
        const cache = createAssetCache<string>();

        cache.loadAsset('test-key', 'test-content');

        expect(cache.getAsset('test-key')).toBe('test-content');
        expect(cache.getAssetKeys()).toStrictEqual(['test-key']);
      });

      it('should load multiple assets', () => {
        expect.assertions(4);
        const cache = createAssetCache<string>();

        cache.loadAsset('key1', 'content1');
        cache.loadAsset('key2', 'content2');
        cache.loadAsset('key3', 'content3');

        expect(cache.getAsset('key1')).toBe('content1');
        expect(cache.getAsset('key2')).toBe('content2');
        expect(cache.getAsset('key3')).toBe('content3');
        expect(cache.getAssetKeys()).toStrictEqual(['key1', 'key2', 'key3']);
      });

      it('should overwrite existing asset', () => {
        expect.assertions(3);
        const cache = createAssetCache<string>();

        cache.loadAsset('test-key', 'original-content');
        expect(cache.getAsset('test-key')).toBe('original-content');

        cache.loadAsset('test-key', 'updated-content');
        expect(cache.getAsset('test-key')).toBe('updated-content');
        expect(cache.getAssetKeys()).toStrictEqual(['test-key']); // Should still be only one key
      });

      it('should handle complex asset objects', () => {
        expect.assertions(13);
        interface ComplexAsset {
          metadata: {
            size: number;
            type: string;
          };
          content: Uint8Array;
          tags: string[];
        }

        const cache = createAssetCache<ComplexAsset>();
        const complexAsset: ComplexAsset = {
          metadata: { size: 1024, type: 'image/png' },
          content: new Uint8Array([
            102, 97, 107, 101, 45, 105, 109, 97, 103, 101, 45, 100, 97, 116, 97,
          ]), // "fake-image-data" as bytes
          tags: ['image', 'asset', 'test'],
        };

        cache.loadAsset('complex-asset', complexAsset);

        const retrieved = cache.getAsset('complex-asset');
        expect(retrieved).toStrictEqual(complexAsset);
        expect(retrieved).not.toBe(complexAsset);
        expect(retrieved?.content).not.toBe(complexAsset.content);
        expect(retrieved?.metadata).not.toBe(complexAsset.metadata);
        expect(retrieved?.tags).not.toBe(complexAsset.tags);

        // Verify the content is a proper Uint8Array
        expect(retrieved?.content instanceof Uint8Array).toBe(true);
        expect([...(retrieved?.content ?? [])]).toStrictEqual([
          102, 97, 107, 101, 45, 105, 109, 97, 103, 101, 45, 100, 97, 116, 97,
        ]);

        // Verify other properties
        expect(retrieved?.metadata.size).toBe(1024);
        expect(retrieved?.metadata.type).toBe('image/png');
        expect(retrieved?.tags).toStrictEqual(['image', 'asset', 'test']);

        // Test isolation - modifying retrieved should not affect original
        if (retrieved) {
          retrieved.content[0] = 99;
          retrieved.metadata.size = 2048;
          retrieved.tags.push('modified');
        }

        expect(complexAsset.content[0]).toBe(102); // Original unchanged
        expect(complexAsset.metadata.size).toBe(1024); // Original unchanged
        expect(complexAsset.tags).toStrictEqual(['image', 'asset', 'test']); // Original unchanged
      });

      it('should handle null and undefined values', () => {
        expect.assertions(3);
        const cache = createAssetCache<string | null | undefined>();
        cache.loadAsset('null-asset', null);
        // eslint-disable-next-line unicorn/no-useless-undefined
        cache.loadAsset('undefined-asset', undefined);
        expect(cache.getAsset('null-asset')).toBeNull();
        expect(cache.getAsset('undefined-asset')).toBeNull();
        expect(cache.getAssetKeys()).toStrictEqual(['null-asset', 'undefined-asset']);
      });

      it('should handle special characters in asset keys', () => {
        expect.assertions(9);
        const cache = createAssetCache<string>();

        const specialKeys = [
          'asset with spaces',
          'asset-with-dashes',
          'asset_with_underscores',
          'asset.with.dots',
          'asset/with/slashes',
          'asset@with#special$chars%',
          'αβγδε', // Unicode characters
          '🚀🎯📦', // Emojis
        ];

        // eslint-disable-next-line unicorn/no-array-for-each
        specialKeys.forEach((key, index) => {
          cache.loadAsset(key, `content-${index}`);
        });

        // eslint-disable-next-line unicorn/no-array-for-each
        specialKeys.forEach((key, index) => {
          expect(cache.getAsset(key)).toBe(`content-${index}`);
        });

        expect(cache.getAssetKeys()).toStrictEqual(specialKeys);
      });

      it('should handle very long asset keys', () => {
        expect.assertions(2);
        const cache = createAssetCache<string>();
        const longKey = 'a'.repeat(10000);

        cache.loadAsset(longKey, 'long-key-content');

        expect(cache.getAsset(longKey)).toBe('long-key-content');
        expect(cache.getAssetKeys()).toContain(longKey);
      });

      it('should handle large number of assets', () => {
        expect.assertions(4);
        const cache = createAssetCache<number>();
        const assetCount = 10000;

        // Load many assets
        for (let i = 0; i < assetCount; i++) {
          cache.loadAsset(`asset-${i}`, i);
        }

        // Verify all assets are stored
        expect(cache.getAssetKeys()).toHaveLength(assetCount);

        // Spot check some assets
        expect(cache.getAsset('asset-0')).toBe(0);
        expect(cache.getAsset('asset-5000')).toBe(5000);
        expect(cache.getAsset('asset-9999')).toBe(9999);
      });
    });

    describe('getAsset', () => {
      it('should return null for non-existent asset', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>();

        expect(cache.getAsset('non-existent')).toBeNull();
      });

      it('should return correct asset for existing key', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>({ existing: 'content' });

        expect(cache.getAsset('existing')).toBe('content');
      });

      it('should be case-sensitive for asset keys', () => {
        expect.assertions(4);
        const cache = createAssetCache<string>();

        cache.loadAsset('CamelCase', 'content1');
        cache.loadAsset('camelcase', 'content2');
        cache.loadAsset('CAMELCASE', 'content3');

        expect(cache.getAsset('CamelCase')).toBe('content1');
        expect(cache.getAsset('camelcase')).toBe('content2');
        expect(cache.getAsset('CAMELCASE')).toBe('content3');
        expect(cache.getAsset('camelCase')).toBeNull(); // Different case
      });

      it('should handle empty string as asset key', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>();

        cache.loadAsset('', 'empty-key-content');

        expect(cache.getAsset('')).toBe('empty-key-content');
      });

      it('should return a copy of the same object. ( not a reference )', () => {
        expect.assertions(4);
        const cache = createAssetCache<{ value: number }>();
        const originalObject = { value: 42 };

        cache.loadAsset('object-key', originalObject);
        const retrieved = cache.getAsset('object-key');

        expect(retrieved).toStrictEqual(originalObject); // Same content
        expect(retrieved).not.toBe(originalObject); // Different reference

        // Modifying the retrieved object should NOT affect the original
        if (retrieved) {
          retrieved.value = 100;
        }
        expect(originalObject.value).toBe(42); // Original unchanged

        // Modifying the original should NOT affect what's stored in cache
        originalObject.value = 200;
        const retrievedAgain = cache.getAsset('object-key');
        expect(retrievedAgain?.value).toBe(42); // Cache unchanged
      });

      it('should handle concurrent access', () => {
        expect.assertions(3);
        const cache = createAssetCache<string>();
        // Simulate concurrent operations
        cache.loadAsset('key1', 'value1');
        const result1 = cache.getAsset('key1');

        cache.loadAsset('key2', 'value2');
        const result2 = cache.getAsset('key2');
        // Previous result should still be valid
        expect(result1).toBe('value1');
        expect(result2).toBe('value2');
        expect(cache.getAsset('key1')).toBe('value1'); // Still accessible
      });
    });

    describe('getAssetKeys', () => {
      it('should return empty array for empty cache', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>();
        expect(cache.getAssetKeys()).toStrictEqual([]);
      });

      it('should return all asset keys', () => {
        expect.assertions(4);
        const cache = createAssetCache<string>();

        cache.loadAsset('key1', 'value1');
        cache.loadAsset('key2', 'value2');
        cache.loadAsset('key3', 'value3');

        const keys = cache.getAssetKeys();
        expect(keys).toHaveLength(3);
        expect(keys).toContain('key1');
        expect(keys).toContain('key2');
        expect(keys).toContain('key3');
      });

      it('should return keys in insertion order', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>();

        cache.loadAsset('third', 'value3');
        cache.loadAsset('first', 'value1');
        cache.loadAsset('second', 'value2');

        expect(cache.getAssetKeys()).toStrictEqual(['third', 'first', 'second']);
      });

      it('should not include duplicate keys after overwrite', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>();

        cache.loadAsset('key1', 'original');
        cache.loadAsset('key2', 'value2');
        cache.loadAsset('key1', 'updated'); // Overwrite

        expect(cache.getAssetKeys()).toStrictEqual(['key1', 'key2']);
      });

      it('should return new array each time (not reference)', () => {
        expect.assertions(3);
        const cache = createAssetCache<string>();
        cache.loadAsset('key1', 'value1');

        const keys1 = cache.getAssetKeys();
        const keys2 = cache.getAssetKeys();

        expect(keys1).toStrictEqual(keys2);
        expect(keys1).not.toBe(keys2); // Different array instances

        // Modifying one array shouldn't affect the other
        keys1.push('modified');
        expect(keys2).not.toContain('modified');
      });

      it('should reflect current state after modifications', () => {
        expect.assertions(4);
        const cache = createAssetCache<string>();

        expect(cache.getAssetKeys()).toStrictEqual([]);

        cache.loadAsset('key1', 'value1');
        expect(cache.getAssetKeys()).toStrictEqual(['key1']);

        cache.loadAsset('key2', 'value2');
        expect(cache.getAssetKeys()).toStrictEqual(['key1', 'key2']);

        cache.loadAsset('key1', 'updated'); // Overwrite
        expect(cache.getAssetKeys()).toStrictEqual(['key1', 'key2']); // Same keys, same order
      });

      it('should handle keys with special characters', () => {
        expect.assertions(1);
        const cache = createAssetCache<string>();
        const specialKeys = ['key with spaces', 'key-dash', 'key_underscore', 'key.dot'];

        // eslint-disable-next-line unicorn/no-array-for-each
        specialKeys.forEach((key) => {
          cache.loadAsset(key, 'value');
        });

        expect(cache.getAssetKeys()).toStrictEqual(specialKeys);
      });
    });
    describe('edge cases and error handling', () => {
      it('should handle rapid successive operations', () => {
        expect.assertions(1001);
        const cache = createAssetCache<number>();

        // Rapid loading and retrieval
        for (let i = 0; i < 1000; i++) {
          cache.loadAsset(`rapid-${i}`, i);
          expect(cache.getAsset(`rapid-${i}`)).toBe(i);
        }

        expect(cache.getAssetKeys()).toHaveLength(1000);
      });

      it('should handle mixed asset types correctly', () => {
        expect.assertions(5);
        type MixedAsset = string | number | boolean | object | null;
        const cache = createAssetCache<MixedAsset>();

        cache.loadAsset('string', 'text');
        cache.loadAsset('number', 42);
        cache.loadAsset('boolean', true);
        cache.loadAsset('object', { key: 'value' });
        cache.loadAsset('null', null);

        expect(cache.getAsset('string')).toBe('text');
        expect(cache.getAsset('number')).toBe(42);
        expect(cache.getAsset('boolean')).toBe(true);
        expect(cache.getAsset('object')).toStrictEqual({ key: 'value' });
        expect(cache.getAsset('null')).toBeNull();
      });

      it('should maintain cache isolation between instances', () => {
        expect.assertions(4);
        const cache1 = createAssetCache<string>();
        const cache2 = createAssetCache<string>();

        cache1.loadAsset('shared-key', 'cache1-value');
        cache2.loadAsset('shared-key', 'cache2-value');

        expect(cache1.getAsset('shared-key')).toBe('cache1-value');
        expect(cache2.getAsset('shared-key')).toBe('cache2-value');

        expect(cache1.getAssetKeys()).toStrictEqual(['shared-key']);
        expect(cache2.getAssetKeys()).toStrictEqual(['shared-key']);
      });

      it('should handle modification of initial assets object', () => {
        expect.assertions(3);
        const initialAssets = { key1: 'value1' } as Record<string, string>;
        const cache = createAssetCache(initialAssets);

        // Modify the original object
        initialAssets.key2 = 'value2';
        delete initialAssets.key1;

        // Cache should maintain its own copy
        expect(cache.getAsset('key1')).toBe('value1');
        expect(cache.getAsset('key2')).toBeNull();
        expect(cache.getAssetKeys()).toStrictEqual(['key1']);
      });

      it('should handle numeric string keys correctly', () => {
        expect.assertions(5);
        const cache = createAssetCache<string>();
        cache.loadAsset('123', 'numeric-string-key');
        cache.loadAsset('0', 'zero-key');
        cache.loadAsset('-1', 'negative-key');
        expect(cache.getAsset('123')).toBe('numeric-string-key');
        expect(cache.getAsset('0')).toBe('zero-key');
        expect(cache.getAsset('-1')).toBe('negative-key');

        expect(cache.getAssetKeys()).toStrictEqual(expect.arrayContaining(['123', '0', '-1']));
        expect(cache.getAssetKeys()).toHaveLength(3);
      });
    });

    describe('type safety', () => {
      it('should enforce correct asset type', () => {
        expect.assertions(3);
        interface TypedAsset {
          id: string;
          data: number[];
        }

        const cache = createAssetCache<TypedAsset>();
        const validAsset: TypedAsset = {
          id: 'test-id',
          data: [1, 2, 3, 4, 5],
        };

        cache.loadAsset('typed-asset', validAsset);
        const retrieved = cache.getAsset('typed-asset');

        expect(retrieved).toStrictEqual(validAsset);
        expect(retrieved?.id).toBe('test-id');
        expect(retrieved?.data).toStrictEqual([1, 2, 3, 4, 5]);
      });

      it('should work with union types', () => {
        expect.assertions(2);
        type UnionAsset = string | { type: 'object'; value: number };
        const cache = createAssetCache<UnionAsset>();

        cache.loadAsset('string-asset', 'simple string');
        cache.loadAsset('object-asset', { type: 'object', value: 42 });

        expect(cache.getAsset('string-asset')).toBe('simple string');
        expect(cache.getAsset('object-asset')).toStrictEqual({
          type: 'object',
          value: 42,
        });
      });

      it('should handle optional properties', () => {
        expect.assertions(4);
        interface OptionalAsset {
          required: string;
          optional?: number;
        }

        const cache = createAssetCache<OptionalAsset>();

        cache.loadAsset('with-optional', { required: 'test', optional: 123 });
        cache.loadAsset('without-optional', { required: 'test' });

        const withOptional = cache.getAsset('with-optional');
        const withoutOptional = cache.getAsset('without-optional');

        expect(withOptional?.required).toBe('test');
        expect(withOptional?.optional).toBe(123);
        expect(withoutOptional?.required).toBe('test');
        expect(withoutOptional?.optional).toBeUndefined();
      });
    });

    describe('memory and performance', () => {
      it('should handle large assets efficiently', () => {
        expect.assertions(3);
        const cache = createAssetCache<string>();
        const largeContent = 'x'.repeat(1000000); // 1MB string

        const startTime = Date.now();
        cache.loadAsset('large-asset', largeContent);
        const loadTime = Date.now() - startTime;

        const retrieveStartTime = Date.now();
        const retrieved = cache.getAsset('large-asset');
        const retrieveTime = Date.now() - retrieveStartTime;

        expect(retrieved).toBe(largeContent);
        expect(loadTime).toBeLessThan(100); // Should be fast
        expect(retrieveTime).toBeLessThan(10); // Should be very fast
      });

      it('should handle many small assets efficiently', () => {
        expect.assertions(3);
        const cache = createAssetCache<string>();
        const assetCount = 50000;

        const startTime = Date.now();
        for (let i = 0; i < assetCount; i++) {
          cache.loadAsset(`asset-${i}`, `content-${i}`);
        }
        const loadTime = Date.now() - startTime;

        const retrieveStartTime = Date.now();
        for (let i = 0; i < 1000; i++) {
          cache.getAsset(`asset-${i}`);
        }
        const retrieveTime = Date.now() - retrieveStartTime;

        expect(cache.getAssetKeys()).toHaveLength(assetCount);
        expect(loadTime).toBeLessThan(5000); // Should complete in reasonable time
        expect(retrieveTime).toBeLessThan(100); // Retrieval should be fast
      });
    });
  });
});
