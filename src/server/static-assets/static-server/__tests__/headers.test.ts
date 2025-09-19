import {
  buildHeadersSubset,
  checkIfModifiedSince,
  checkIfNoneMatch,
  getIfModifiedSinceHeader,
  getIfNoneMatchHeader,
} from '../headers.ts';

import type { StaticAsset } from '~static-assets/asset-loader/inline-asset/inline-asset.ts';

const createMockAsset = (lastModifiedTime: number): StaticAsset =>
  ({
    getMetadata: jest.fn().mockReturnValue({
      fileInfo: {
        lastModifiedTime,
      },
    }),
  } as any);

describe('headers utilities', () => {
  describe('getIfNoneMatchHeader', () => {
    it('should parse If-None-Match header correctly', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('"tag1", "tag2", "tag3"'),
        },
      } as any;

      const result = getIfNoneMatchHeader(mockRequest);
      expect(result).toStrictEqual(['"tag1"', '"tag2"', '"tag3"']);
    });

    it('should handle empty If-None-Match header', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(''),
        },
      } as any;

      const result = getIfNoneMatchHeader(mockRequest);
      expect(result).toStrictEqual([]);
    });

    it('should handle missing If-None-Match header', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const result = getIfNoneMatchHeader(mockRequest);
      expect(result).toStrictEqual([]);
    });

    it('should handle single ETag value', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('"single-tag"'),
        },
      } as any;

      const result = getIfNoneMatchHeader(mockRequest);
      expect(result).toStrictEqual(['"single-tag"']);
    });

    it('should handle ETags with spaces and trim them', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('"tag1" , "tag2" , "tag3"'),
        },
      } as any;

      const result = getIfNoneMatchHeader(mockRequest);
      expect(result).toStrictEqual(['"tag1"', '"tag2"', '"tag3"']);
    });

    it('should filter out empty values', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('"tag1",, "tag2", '),
        },
      } as any;

      const result = getIfNoneMatchHeader(mockRequest);
      expect(result).toStrictEqual(['"tag1"', '"tag2"']);
    });
  });

  describe('checkIfNoneMatch', () => {
    it('should return false when header contains wildcard', () => {
      expect.assertions(1);
      const result = checkIfNoneMatch('"test-etag"', ['*']);
      expect(result).toBe(false);
    });

    it('should return false when etag matches one in the list', () => {
      expect.assertions(1);
      const result = checkIfNoneMatch('"test-etag"', [
        '"other-etag"',
        '"test-etag"',
        '"another-etag"',
      ]);
      expect(result).toBe(false);
    });

    it('should return true when etag does not match any in the list', () => {
      expect.assertions(1);
      const result = checkIfNoneMatch('"test-etag"', ['"other-etag"', '"another-etag"']);
      expect(result).toBe(true);
    });

    it('should handle empty header array', () => {
      expect.assertions(1);
      const result = checkIfNoneMatch('"test-etag"', []);
      expect(result).toBe(true);
    });

    it('should handle wildcard in list with other tags', () => {
      expect.assertions(1);
      const result = checkIfNoneMatch('"test-etag"', ['"other-etag"', '*', '"another-etag"']);
      expect(result).toBe(false);
    });

    it('should be case sensitive for etag matching', () => {
      expect.assertions(1);
      const result = checkIfNoneMatch('"Test-Etag"', ['"test-etag"']);
      expect(result).toBe(true);
    });
  });

  describe('getIfModifiedSinceHeader', () => {
    it('should parse valid If-Modified-Since header', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Wed, 21 Oct 2015 07:28:00 GMT'),
        },
      } as any;

      const result = getIfModifiedSinceHeader(mockRequest);
      // Wed, 21 Oct 2015 07:28:00 GMT = 1445412480 seconds
      expect(result).toBe(1445412480);
    });

    it('should return null for invalid date format', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('invalid-date'),
        },
      } as any;

      const result = getIfModifiedSinceHeader(mockRequest);
      expect(result).toBeNull();
    });

    it('should return null for empty header', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(''),
        },
      } as any;

      const result = getIfModifiedSinceHeader(mockRequest);
      expect(result).toBeNull();
    });

    it('should return null for missing header', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const result = getIfModifiedSinceHeader(mockRequest);
      expect(result).toBeNull();
    });

    it('should handle ISO date format', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('2015-10-21T07:28:00.000Z'),
        },
      } as any;

      const result = getIfModifiedSinceHeader(mockRequest);
      expect(result).toBe(1445412480);
    });

    it('should floor milliseconds to seconds', () => {
      expect.assertions(1);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('2015-10-21T07:28:00.999Z'),
        },
      } as any;

      const result = getIfModifiedSinceHeader(mockRequest);
      expect(result).toBe(1445412480); // Should floor, not round
    });
  });

  describe('checkIfModifiedSince', () => {
    it('should return false when asset was modified before the given time', () => {
      expect.assertions(1);
      const asset = createMockAsset(1000);
      const ifModifiedSince = 2000;

      const result = checkIfModifiedSince(asset, ifModifiedSince);
      expect(result).toBe(false);
    });

    it('should return false when asset was modified at exactly the given time', () => {
      expect.assertions(1);
      const asset = createMockAsset(1500);
      const ifModifiedSince = 1500;

      const result = checkIfModifiedSince(asset, ifModifiedSince);
      expect(result).toBe(false);
    });

    it('should return true when asset was modified after the given time', () => {
      expect.assertions(1);
      const asset = createMockAsset(3000);
      const ifModifiedSince = 2000;

      const result = checkIfModifiedSince(asset, ifModifiedSince);
      expect(result).toBe(true);
    });

    it('should handle edge case with zero timestamps', () => {
      expect.assertions(1);
      const asset = createMockAsset(0);
      const ifModifiedSince = 0;

      const result = checkIfModifiedSince(asset, ifModifiedSince);
      expect(result).toBe(false);
    });

    it('should handle negative timestamps', () => {
      expect.assertions(1);
      const asset = createMockAsset(-1000);
      const ifModifiedSince = -2000;

      const result = checkIfModifiedSince(asset, ifModifiedSince);
      expect(result).toBe(true);
    });
  });

  describe('buildHeadersSubset', () => {
    it('should build subset with existing keys', () => {
      expect.assertions(1);
      const responseHeaders = {
        'content-type': 'text/html',
        'cache-control': 'max-age=3600',
        etag: '"12345"',
        'x-custom': 'custom-value',
      };
      const keys = ['content-type', 'etag'];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({
        'content-type': 'text/html',
        etag: '"12345"',
      });
    });

    it('should ignore non-existing keys', () => {
      expect.assertions(1);
      const responseHeaders = {
        'content-type': 'text/html',
        'cache-control': 'max-age=3600',
      };
      const keys = ['content-type', 'non-existing', 'etag'];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({
        'content-type': 'text/html',
      });
    });

    it('should return empty object when no keys match', () => {
      expect.assertions(1);
      const responseHeaders = {
        'content-type': 'text/html',
        'cache-control': 'max-age=3600',
      };
      const keys = ['non-existing', 'also-non-existing'];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({});
    });

    it('should return empty object with empty keys array', () => {
      expect.assertions(1);
      const responseHeaders = {
        'content-type': 'text/html',
        'cache-control': 'max-age=3600',
      };
      const keys: string[] = [];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({});
    });

    it('should handle empty response headers', () => {
      expect.assertions(1);
      const responseHeaders = {};
      const keys = ['content-type', 'etag'];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({});
    });

    it('should be case sensitive for header names', () => {
      expect.assertions(1);
      const responseHeaders = {
        'Content-Type': 'text/html',
        'content-type': 'application/json',
      };
      const keys = ['content-type'];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({
        'content-type': 'application/json',
      });
    });

    it('should handle duplicate keys in input array', () => {
      expect.assertions(1);
      const responseHeaders = {
        'content-type': 'text/html',
        etag: '"12345"',
      };
      const keys = ['content-type', 'content-type', 'etag'];

      const result = buildHeadersSubset(responseHeaders, keys);
      expect(result).toStrictEqual({
        'content-type': 'text/html',
        etag: '"12345"',
      });
    });
  });
});
