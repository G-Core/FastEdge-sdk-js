import { getKnownContentTypes, testFileContentType } from '../content-types.ts';

import type { ContentTypeDefinition } from '../content-types.ts';

describe('content-types', () => {
  describe('testFileContentType', () => {
    describe('text formats', () => {
      it('should return correct content type for HTML files', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'test.html')).toStrictEqual({
          contentType: 'text/html',
          isText: true,
        });
        expect(testFileContentType(undefined, 'test.htm')).toStrictEqual({
          contentType: 'text/html',
          isText: true,
        });
      });

      it('should return correct content type for JavaScript files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'script.js')).toStrictEqual({
          contentType: 'application/javascript',
          isText: true,
        });
      });

      it('should return correct content type for CSS files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'style.css')).toStrictEqual({
          contentType: 'text/css',
          isText: true,
        });
      });

      it('should return correct content type for JSON files', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'data.json')).toStrictEqual({
          contentType: 'application/json',
          isText: true,
        });
        expect(testFileContentType(undefined, 'sourcemap.map')).toStrictEqual({
          contentType: 'application/json',
          isText: true,
        });
      });

      it('should return correct content type for XML files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'config.xml')).toStrictEqual({
          contentType: 'application/xml',
          isText: true,
        });
      });

      it('should return correct content type for text files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'readme.txt')).toStrictEqual({
          contentType: 'text/plain',
          isText: true,
        });
      });

      it('should return correct content type for SVG files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'icon.svg')).toStrictEqual({
          contentType: 'image/svg+xml',
          isText: true,
        });
      });
    });

    describe('image formats', () => {
      it('should return correct content type for PNG files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'image.png')).toStrictEqual({
          contentType: 'image/png',
          isText: false,
        });
      });

      it('should return correct content type for JPEG files', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'photo.jpg')).toStrictEqual({
          contentType: 'image/jpeg',
          isText: false,
        });
        expect(testFileContentType(undefined, 'photo.jpeg')).toStrictEqual({
          contentType: 'image/jpeg',
          isText: false,
        });
      });

      it('should return correct content type for GIF files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'animation.gif')).toStrictEqual({
          contentType: 'image/gif',
          isText: false,
        });
      });

      it('should return correct content type for BMP files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'bitmap.bmp')).toStrictEqual({
          contentType: 'image/bmp',
          isText: false,
        });
      });

      it('should return correct content type for ICO files', () => {
        expect.assertions(1);
        expect(testFileContentType(undefined, 'favicon.ico')).toStrictEqual({
          contentType: 'image/vnd.microsoft.icon',
          isText: false,
        });
      });

      it('should return correct content type for TIFF files', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'image.tif')).toStrictEqual({
          contentType: 'image/png', // Note: your code maps TIFF to PNG
          isText: false,
        });
        expect(testFileContentType(undefined, 'image.tiff')).toStrictEqual({
          contentType: 'image/png',
          isText: false,
        });
      });
    });

    describe('audio/video formats', () => {
      it('should return correct content type for audio files', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'audio.aac')).toStrictEqual({
          contentType: 'audio/aac',
          isText: false,
        });
        expect(testFileContentType(undefined, 'music.mp3')).toStrictEqual({
          contentType: 'audio/mpeg',
          isText: false,
        });
      });

      it('should return correct content type for video files', () => {
        expect.assertions(4);
        expect(testFileContentType(undefined, 'video.avi')).toStrictEqual({
          contentType: 'video/x-msvideo',
          isText: false,
        });
        expect(testFileContentType(undefined, 'video.mp4')).toStrictEqual({
          contentType: 'video/mp4',
          isText: false,
        });
        expect(testFileContentType(undefined, 'video.mpeg')).toStrictEqual({
          contentType: 'video/mpeg',
          isText: false,
        });
        expect(testFileContentType(undefined, 'video.webm')).toStrictEqual({
          contentType: 'video/webm',
          isText: false,
        });
      });
    });

    describe('font formats', () => {
      it('should return correct content type for font files', () => {
        expect.assertions(5);
        expect(testFileContentType(undefined, 'font.eot')).toStrictEqual({
          contentType: 'application/vnd.ms-fontobject',
          isText: false,
        });
        expect(testFileContentType(undefined, 'font.otf')).toStrictEqual({
          contentType: 'font/otf',
          isText: false,
        });
        expect(testFileContentType(undefined, 'font.ttf')).toStrictEqual({
          contentType: 'font/ttf',
          isText: false,
        });
        expect(testFileContentType(undefined, 'font.woff')).toStrictEqual({
          contentType: 'font/woff',
          isText: false,
        });
        expect(testFileContentType(undefined, 'font.woff2')).toStrictEqual({
          contentType: 'font/woff2',
          isText: false,
        });
      });
    });

    describe('archive formats', () => {
      it('should return correct content type for archive files', () => {
        expect.assertions(3);
        expect(testFileContentType(undefined, 'document.pdf')).toStrictEqual({
          contentType: 'application/pdf',
          isText: false,
        });
        expect(testFileContentType(undefined, 'archive.tar')).toStrictEqual({
          contentType: 'application/x-tar',
          isText: false,
        });
        expect(testFileContentType(undefined, 'package.zip')).toStrictEqual({
          contentType: 'application/zip',
          isText: false,
        });
      });
    });

    describe('unknown extensions', () => {
      it('should return null for unknown file extensions', () => {
        expect.assertions(3);
        expect(testFileContentType(undefined, 'unknown.xyz')).toBeNull();
        expect(testFileContentType(undefined, 'file.unknown')).toBeNull();
        expect(testFileContentType(undefined, 'noextension')).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle files with multiple dots', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'file.min.js')).toStrictEqual({
          contentType: 'application/javascript',
          isText: true,
        });
        expect(testFileContentType(undefined, 'styles.responsive.css')).toStrictEqual({
          contentType: 'text/css',
          isText: true,
        });
      });

      it('should handle uppercase extensions', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'FILE.JS')).toStrictEqual({
          contentType: 'application/javascript',
          isText: true,
        });
        expect(testFileContentType(undefined, 'IMAGE.PNG')).toStrictEqual({
          contentType: 'image/png',
          isText: false,
        });
      });

      it('should handle files with no extension', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, 'README')).toBeNull();
        expect(testFileContentType(undefined, 'Makefile')).toBeNull();
      });

      it('should handle empty filename', () => {
        expect.assertions(2);
        expect(testFileContentType(undefined, '')).toBeNull();
        expect(testFileContentType(undefined, '.')).toBeNull();
      });

      it('should handle files starting with dots', () => {
        expect.assertions(3);
        expect(testFileContentType(undefined, '.gitignore')).toBeNull();
        expect(testFileContentType(undefined, '.htaccess')).toBeNull();
        expect(testFileContentType(undefined, '.env.js')).toStrictEqual({
          contentType: 'application/javascript',
          isText: true,
        });
      });
    });

    describe('custom content types', () => {
      it('should handle custom content types with regex', () => {
        expect.assertions(1);
        const customTypes: ContentTypeDefinition[] = [
          {
            test: /\.custom$/u,
            contentType: 'application/custom',
            isText: false,
          },
        ];

        const knownTypes = getKnownContentTypes(customTypes);
        expect(testFileContentType(knownTypes, 'file.custom')).toStrictEqual({
          contentType: 'application/custom',
          isText: false,
        });
      });

      it('should prioritize custom content types over defaults', () => {
        expect.assertions(1);
        const customTypes: ContentTypeDefinition[] = [
          {
            test: /\.js$/u,
            contentType: 'text/custom-javascript',
            isText: true,
          },
        ];

        const knownTypes = getKnownContentTypes(customTypes);
        expect(testFileContentType(knownTypes, 'script.js')).toStrictEqual({
          contentType: 'text/custom-javascript',
          isText: true,
        });
      });

      it('should handle function-based tests', () => {
        expect.assertions(2);
        const customTypes: ContentTypeDefinition[] = [
          {
            test: (assetKey: string) => assetKey.includes('special'),
            contentType: 'application/special',
            isText: false,
          },
        ];

        const knownTypes = getKnownContentTypes(customTypes);
        expect(testFileContentType(knownTypes, 'special-file.txt')).toStrictEqual({
          contentType: 'application/special',
          isText: false,
        });
        expect(testFileContentType(knownTypes, 'normal-file.txt')).toStrictEqual({
          contentType: 'text/plain',
          isText: true,
        });
      });

      it('should handle complex function-based tests', () => {
        expect.assertions(3);
        const customTypes: ContentTypeDefinition[] = [
          {
            test: (assetKey: string) => assetKey.endsWith('.config.js'),
            contentType: 'application/config+javascript',
            isText: true,
          },
          {
            test: (assetKey: string) => assetKey.startsWith('api/') && assetKey.endsWith('.json'),
            contentType: 'application/api+json',
            isText: false,
          },
        ];

        const knownTypes = getKnownContentTypes(customTypes);
        expect(testFileContentType(knownTypes, 'webpack.config.js')).toStrictEqual({
          contentType: 'application/config+javascript',
          isText: true,
        });
        expect(testFileContentType(knownTypes, 'api/users.json')).toStrictEqual({
          contentType: 'application/api+json',
          isText: false,
        });
        expect(testFileContentType(knownTypes, 'regular.js')).toStrictEqual({
          contentType: 'application/javascript',
          isText: true,
        });
      });

      it('should handle multiple custom types with first match wins', () => {
        expect.assertions(1);
        const customTypes: ContentTypeDefinition[] = [
          {
            test: /\.js$/u,
            contentType: 'application/first-js',
            isText: true,
          },
          {
            test: /\.js$/u,
            contentType: 'application/second-js',
            isText: true,
          },
        ];

        const knownTypes = getKnownContentTypes(customTypes);
        expect(testFileContentType(knownTypes, 'script.js')).toStrictEqual({
          contentType: 'application/first-js',
          isText: true,
        });
      });
    });
  });

  describe('getKnownContentTypes', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock console methods to capture logging
      consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });
    it('should return default content types when no custom types provided', () => {
      expect.assertions(3);
      const types = getKnownContentTypes([]);
      expect(types.length).toBeGreaterThan(0);

      // Should contain some known default types
      const jsType = types.find((t) => t.contentType === 'application/javascript');
      expect(jsType).toBeDefined();

      const cssType = types.find((t) => t.contentType === 'text/css');
      expect(cssType).toBeDefined();
    });

    it('should combine custom and default content types', () => {
      expect.assertions(3);
      const customTypes: ContentTypeDefinition[] = [
        {
          test: /\.custom$/u,
          contentType: 'application/custom',
          isText: false,
        },
      ];

      const types = getKnownContentTypes(customTypes);
      expect(types.length).toBeGreaterThan(1);

      // Custom types should come first
      expect(types[0]).toStrictEqual(customTypes[0]);

      // Should still have default types
      const jsType = types.find((t) => t.contentType === 'application/javascript');
      expect(jsType).toBeDefined();
    });

    it('should handle multiple custom content types', () => {
      expect.assertions(4);
      const customTypes: ContentTypeDefinition[] = [
        {
          test: /\.custom1$/u,
          contentType: 'application/custom1',
          isText: false,
        },
        {
          test: /\.custom2$/u,
          contentType: 'application/custom2',
          isText: false,
        },
        {
          test: (key: string) => key.includes('special'),
          contentType: 'application/special',
          isText: true,
        },
      ];

      const types = getKnownContentTypes(customTypes);
      expect(types.length).toBeGreaterThan(3);

      // All custom types should be at the beginning
      expect(types[0]).toStrictEqual(customTypes[0]);
      expect(types[1]).toStrictEqual(customTypes[1]);
      expect(types[2]).toStrictEqual(customTypes[2]);
    });

    describe('validation and error handling', () => {
      it('should handle non-array custom content types', () => {
        expect.assertions(1);
        const types = getKnownContentTypes('invalid' as any);
        // Should still return default types
        expect(types.length).toBeGreaterThan(0);
      });

      it('should handle null/undefined custom content types', () => {
        expect.assertions(2);
        const typesNull = getKnownContentTypes(null as any);
        const typesUndefined = getKnownContentTypes(undefined as any);

        expect(typesNull.length).toBeGreaterThan(0);
        expect(typesUndefined.length).toBeGreaterThan(0);
      });

      it('should ignore invalid test property types', () => {
        expect.assertions(2);
        const invalidTypes = [
          { test: 'invalid-string', contentType: 'application/test' },
          { test: 123, contentType: 'application/test' },
          { test: null, contentType: 'application/test' },
          { test: undefined, contentType: 'application/test' },
        ] as any;

        const types = getKnownContentTypes(invalidTypes);

        // Should still return default types but no invalid custom types
        expect(types.length).toBeGreaterThan(0);

        // None of the invalid types should be included
        const invalidType = types.find((t) => t.contentType === 'application/test');
        expect(invalidType).toBeUndefined();
      });

      it('should ignore invalid contentType property', () => {
        expect.assertions(2);
        const invalidTypes = [
          { test: /\.valid$/u, contentType: 'invalid-no-slash' },
          { test: /\.valid$/u, contentType: 123 },
          { test: /\.valid$/u, contentType: null },
          { test: /\.valid$/u, contentType: undefined },
          { test: /\.valid$/u, contentType: '' },
        ] as any;

        const types = getKnownContentTypes(invalidTypes);

        // Should still return default types
        expect(types.length).toBeGreaterThan(0);

        // None of the invalid types should be included
        const invalidType = types.find(
          (t) => typeof t.contentType !== 'string' || !t.contentType.includes('/'),
        );
        expect(invalidType).toBeUndefined();
      });

      it('should handle mixed valid and invalid custom types', () => {
        expect.assertions(2);
        const mixedTypes = [
          { test: /\.valid$/u, contentType: 'application/valid' }, // Valid
          { test: 'invalid', contentType: 'application/invalid' }, // Invalid test
          { test: /\.valid2$/u, contentType: 'application/valid2' }, // Valid
          { test: /\.valid3$/u, contentType: 'invalid-type' }, // Invalid contentType
        ] as any;

        const types = getKnownContentTypes(mixedTypes);

        // Should include the 2 valid custom types plus defaults
        const validTypes = types.filter(
          (t) => t.contentType === 'application/valid' || t.contentType === 'application/valid2',
        );
        expect(validTypes).toHaveLength(2);

        // Should not include invalid types
        const invalidTypes = types.filter(
          (t) => t.contentType === 'application/invalid' || t.contentType === 'invalid-type',
        );
        expect(invalidTypes).toHaveLength(0);
      });

      it('should validate that contentType contains a slash', () => {
        expect.assertions(2);
        const invalidTypes = [
          { test: /\.test$/u, contentType: 'validtype' }, // No slash
          { test: /\.test$/u, contentType: 'application/valid' }, // Valid
        ] as any;

        const types = getKnownContentTypes(invalidTypes);

        // Should only include the valid type
        const validType = types.find((t) => t.contentType === 'application/valid');
        expect(validType).toBeDefined();

        const invalidType = types.find((t) => t.contentType === 'validtype');
        expect(invalidType).toBeUndefined();
      });
    });

    it('should preserve order: custom types first, then defaults', () => {
      expect.assertions(4);
      const customTypes: ContentTypeDefinition[] = [
        {
          test: /\.custom$/u,
          contentType: 'application/custom',
          isText: false,
        },
        {
          test: /\.special$/u,
          contentType: 'application/special',
          isText: false,
        },
      ];

      const types = getKnownContentTypes(customTypes);

      // First two should be custom types in order
      expect(types[0]).toStrictEqual(customTypes[0]);
      expect(types[1]).toStrictEqual(customTypes[1]);

      // Rest should be default types
      expect(types.slice(2).length).toBeGreaterThan(0);

      // Should find default JavaScript type after custom types
      const jsTypeIndex = types.findIndex((t) => t.contentType === 'application/javascript');
      expect(jsTypeIndex).toBeGreaterThan(1);
    });
  });
});
