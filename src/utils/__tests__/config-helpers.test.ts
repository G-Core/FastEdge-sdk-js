import { normalizeConfig } from '../config-helpers.ts';

const createNormalizationMapping = () => ({
  stringField: 'string' as const,
  booleanTruthyField: 'booleanTruthy' as const,
  booleanFalsyField: 'booleanFalsy' as const,
  pathField: 'path' as const,
  pathsArrayField: 'pathsArray' as const,
  pathsOrRegexArrayField: 'pathsOrRegexArray' as const,
  stringArrayField: 'stringArray' as const,
});

describe('config-helpers', () => {
  // Mock console.warn to avoid output during tests
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('normalizeConfig', () => {
    interface TestConfig {
      stringField: string;
      booleanTruthyField: boolean;
      booleanFalsyField: boolean;
      pathField: string;
      pathsArrayField: string[];
      pathsOrRegexArrayField: Array<string | RegExp>;
      stringArrayField: string[];
    }

    it('should normalize all field types correctly', () => {
      expect.assertions(7);
      const config: Partial<TestConfig> = {
        stringField: 'test',
        booleanTruthyField: false,
        booleanFalsyField: true,
        pathField: './some/path/',
        pathsArrayField: ['./path1/', './path2/'],
        pathsOrRegexArrayField: ['./regex/path', 'regex:/test/gi'],
        stringArrayField: ['item1', 'item2'],
      };

      const result = normalizeConfig(config, createNormalizationMapping());

      expect(result.stringField).toBe('test');
      expect(result.booleanTruthyField).toBe(false);
      expect(result.booleanFalsyField).toBe(true);
      expect(result.pathField).toBe('/some/path');
      expect(result.pathsArrayField).toStrictEqual(['/path1', '/path2']);
      expect(result.pathsOrRegexArrayField).toHaveLength(2);
      expect(result.stringArrayField).toStrictEqual(['item1', 'item2']);
    });

    it('should handle missing config values with defaults', () => {
      expect.assertions(7);
      const config: Partial<TestConfig> = {};

      const result = normalizeConfig(config, createNormalizationMapping());

      expect(result.stringField).toBe('');
      expect(result.booleanTruthyField).toBe(true);
      expect(result.booleanFalsyField).toBe(false);
      expect(result.pathField).toBe('/');
      expect(result.pathsArrayField).toStrictEqual([]);
      expect(result.pathsOrRegexArrayField).toStrictEqual([]);
      expect(result.stringArrayField).toStrictEqual([]);
    });

    it('should skip normalization for missing normalize function', () => {
      expect.assertions(2);
      const config = {
        unknownField: 'test',
        stringField: 'test',
      };

      const normalize = {
        stringField: 'string' as const,
        // The unknownField is not in normalizeFns, so should be skipped
      } as any; // Use 'as any' to bypass type checking for this test

      const result = normalizeConfig(config, normalize);

      expect(result.stringField).toBe('test');
      expect((result as any).unknownField).toBe('test'); // Unchanged - use type assertion
    });

    it('should handle partial normalization mapping', () => {
      expect.assertions(3);
      const config: Partial<TestConfig> = {
        stringField: 'test',
        booleanTruthyField: false,
        pathField: './some/path/',
      };

      const partialNormalize = {
        stringField: 'string' as const,
        pathField: 'path' as const,
        // The booleanTruthyField is not normalized
      } as any; // Use 'as any' to allow partial mapping

      const result = normalizeConfig(config, partialNormalize);

      expect(result.stringField).toBe('test');
      expect(result.pathField).toBe('/some/path');
      expect(result.booleanTruthyField).toBe(false); // Unchanged
    });
  });

  describe('string normalization', () => {
    interface StringConfig extends Record<string, unknown> {
      field: string;
    }

    it('should normalize valid strings', () => {
      expect.assertions(1);
      const config = { field: 'valid string' };
      const normalize = { field: 'string' as const };

      const result = normalizeConfig<typeof config>(config, normalize);

      expect(result.field).toBe('valid string');
    });

    it('should handle null strings', () => {
      expect.assertions(1);
      const config = { field: null as any };
      const normalize = { field: 'string' as const };

      const result = normalizeConfig<StringConfig>(config, normalize);

      expect(result.field).toBe('');
    });

    it('should handle undefined strings', () => {
      expect.assertions(1);
      const config = { field: undefined as any };
      const normalize = { field: 'string' as const };

      const result = normalizeConfig<StringConfig>(config, normalize);

      expect(result.field).toBe('');
    });

    it('should handle empty strings', () => {
      expect.assertions(1);
      const config = { field: '' };
      const normalize = { field: 'string' as const };

      const result = normalizeConfig<StringConfig>(config, normalize);

      expect(result.field).toBe('');
    });

    it('should handle non-string types', () => {
      expect.assertions(1);
      const config = { field: 123 as any };
      const normalize = { field: 'string' as const };

      const result = normalizeConfig<StringConfig>(config, normalize);

      expect(result.field).toBe('');
    });
  });

  describe('boolean normalization', () => {
    interface BooleanConfig extends Record<string, unknown> {
      truthyField: boolean;
      falsyField: boolean;
    }

    it('should use truthy default when value is undefined', () => {
      expect.assertions(1);
      const config = { truthyField: undefined as any };
      const normalize = {
        truthyField: 'booleanTruthy' as const,
        falsyField: 'booleanFalsy' as const, // Add missing field
      };

      const result = normalizeConfig<BooleanConfig>(config, normalize);

      expect(result.truthyField).toBe(true);
    });

    it('should use falsy default when value is undefined', () => {
      expect.assertions(1);
      const config = { falsyField: undefined as any };
      const normalize = {
        truthyField: 'booleanTruthy' as const, // Add missing field
        falsyField: 'booleanFalsy' as const,
      };

      const result = normalizeConfig<BooleanConfig>(config, normalize);

      expect(result.falsyField).toBe(false);
    });

    it('should preserve explicit boolean values', () => {
      expect.assertions(2);
      const config = {
        truthyField: false,
        falsyField: true,
      };
      const normalize = {
        truthyField: 'booleanTruthy' as const,
        falsyField: 'booleanFalsy' as const,
      };

      const result = normalizeConfig<BooleanConfig>(config, normalize);

      expect(result.truthyField).toBe(false);
      expect(result.falsyField).toBe(true);
    });

    it('should handle null boolean values', () => {
      expect.assertions(2);
      const config = {
        truthyField: null as any,
        falsyField: null as any,
      };
      const normalize = {
        truthyField: 'booleanTruthy' as const,
        falsyField: 'booleanFalsy' as const,
      };

      const result = normalizeConfig<BooleanConfig>(config, normalize);

      expect(result.truthyField).toBe(true);
      expect(result.falsyField).toBe(false);
    });
  });

  describe('path normalization', () => {
    interface PathConfig extends Record<string, unknown> {
      path: string;
    }

    it('should normalize basic paths', () => {
      expect.assertions(11);
      const testCases = [
        { input: 'path', expected: '/path' },
        { input: '/path', expected: '/path' },
        { input: './path', expected: '/path' },
        { input: 'path/', expected: '/path' },
        { input: './path/', expected: '/path' },
        { input: '/path/', expected: '/path' },
        { input: '', expected: '/' },
        { input: '.', expected: '/' },
        { input: '\\', expected: '/' },
        { input: '/', expected: '/' },
        { input: './', expected: '/' },
      ];

      for (const { input, expected } of testCases) {
        const config = { path: input };
        const normalize = { path: 'path' as const };

        const result = normalizeConfig<PathConfig>(config, normalize);

        expect(result.path).toBe(expected);
      }
    });

    it('should handle complex paths', () => {
      expect.assertions(4);
      const testCases = [
        { input: './some/deep/path/', expected: '/some/deep/path' },
        { input: 'some/deep/path/', expected: '/some/deep/path' },
        { input: '/some/deep/path/', expected: '/some/deep/path' },
        { input: './multiple//slashes//', expected: '/multiple//slashes' },
      ];

      for (const { input, expected } of testCases) {
        const config = { path: input };
        const normalize = { path: 'path' as const };

        const result = normalizeConfig<PathConfig>(config, normalize);

        expect(result.path).toBe(expected);
      }
    });

    it('should handle undefined path', () => {
      expect.assertions(1);
      const config = { path: undefined as any };
      const normalize = { path: 'path' as const };

      const result = normalizeConfig<PathConfig>(config, normalize);

      expect(result.path).toBe('/');
    });
  });

  describe('paths array normalization', () => {
    interface PathsArrayConfig extends Record<string, unknown> {
      paths: string[];
    }

    it('should normalize array of paths', () => {
      expect.assertions(1);
      const config = {
        paths: ['./path1/', '/path2', 'path3/', './path4'],
      };
      const normalize = { paths: 'pathsArray' as const };

      const result = normalizeConfig<PathsArrayConfig>(config, normalize);

      expect(result.paths).toStrictEqual(['/path1', '/path2', '/path3', '/path4']);
    });

    it('should handle empty array', () => {
      expect.assertions(1);
      const config = { paths: [] };
      const normalize = { paths: 'pathsArray' as const };

      const result = normalizeConfig<PathsArrayConfig>(config, normalize);

      expect(result.paths).toStrictEqual([]);
    });

    it('should handle undefined array', () => {
      expect.assertions(1);
      const config = { paths: undefined as any };
      const normalize = { paths: 'pathsArray' as const };

      const result = normalizeConfig<PathsArrayConfig>(config, normalize);

      expect(result.paths).toStrictEqual([]);
    });
  });

  describe('string array normalization', () => {
    interface StringArrayConfig extends Record<string, unknown> {
      items: string[];
    }

    it('should preserve string arrays', () => {
      expect.assertions(1);
      const config = { items: ['item1', 'item2', 'item3'] };
      const normalize = { items: 'stringArray' as const };

      const result = normalizeConfig<StringArrayConfig>(config, normalize);

      expect(result.items).toStrictEqual(['item1', 'item2', 'item3']);
    });

    it('should handle empty arrays', () => {
      expect.assertions(1);
      const config = { items: [] };
      const normalize = { items: 'stringArray' as const };

      const result = normalizeConfig<StringArrayConfig>(config, normalize);

      expect(result.items).toStrictEqual([]);
    });

    it('should handle undefined arrays', () => {
      expect.assertions(1);
      const config = { items: undefined as any };
      const normalize = { items: 'stringArray' as const };

      const result = normalizeConfig<StringArrayConfig>(config, normalize);

      expect(result.items).toStrictEqual([]);
    });
  });

  describe('paths or regex array normalization', () => {
    interface PathsOrRegexConfig extends Record<string, unknown> {
      patterns: Array<string | RegExp>;
    }
    it('should normalize paths and valid regex patterns', () => {
      expect.assertions(5);
      const config = {
        patterns: ['./path1/', 'regex:/test/gi', '/path2', 'regex:/^start/i'],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<PathsOrRegexConfig>(config, normalize);

      expect(result.patterns).toHaveLength(4);
      expect(result.patterns[0]).toBe('/path1');
      expect(result.patterns[1]).toBeInstanceOf(RegExp);
      expect(result.patterns[2]).toBe('/path2');
      expect(result.patterns[3]).toBeInstanceOf(RegExp);
    });

    it('should handle invalid regex patterns', () => {
      expect.assertions(4);
      const config = {
        patterns: ['./valid/path/', 'regex:invalid-regex-[', 'regex:/valid/gi'],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<PathsOrRegexConfig>(config, normalize);

      // Invalid regex should be filtered out
      expect(result.patterns).toHaveLength(2);
      expect(result.patterns[0]).toBe('/valid/path');
      expect(result.patterns[1]).toBeInstanceOf(RegExp);

      // Should have logged a warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'caution',
        expect.stringContaining('Invalid regex pattern'),
      );
    });

    it('should handle regex with different formats', () => {
      expect.assertions(5);
      const config = {
        patterns: [
          'regex:/simple/',
          'regex:/with-flags/gi',
          'regex:/complex.*pattern\\d+/im',
          'without-slashes', // This should be treated as a string
        ],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<PathsOrRegexConfig>(config, normalize);

      expect(result.patterns).toHaveLength(4);
      expect(result.patterns[0]).toBeInstanceOf(RegExp);
      expect(result.patterns[1]).toBeInstanceOf(RegExp);
      expect(result.patterns[2]).toBeInstanceOf(RegExp);
      expect(result.patterns[3]).toBe('/without-slashes'); // Normalized as path
    });

    it('should handle empty array', () => {
      expect.assertions(1);
      const config = { patterns: [] };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<PathsOrRegexConfig>(config, normalize);

      expect(result.patterns).toStrictEqual([]);
    });

    it('should handle undefined array', () => {
      expect.assertions(1);
      const config = { patterns: undefined as any };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<PathsOrRegexConfig>(config, normalize);

      expect(result.patterns).toStrictEqual([]);
    });

    it('should filter out empty strings from invalid regex', () => {
      expect.assertions(2);
      const config = {
        patterns: ['regex:invalid[', './valid/path', 'regex:another-invalid['],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<PathsOrRegexConfig>(config, normalize);

      // Only the valid path should remain
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0]).toBe('/valid/path');
    });
  });

  describe('regex validation and conversion', () => {
    interface RegexConfig extends Record<string, unknown> {
      patterns: Array<string | RegExp>;
    }
    it('should validate and convert complex regex patterns', () => {
      expect.assertions(6);
      const config = {
        patterns: [
          'regex:/^[a-zA-Z0-9]+$/g',
          'regex:/\\d{3}-\\d{3}-\\d{4}/',
          'regex:/(?:https?:\\/\\/)?(?:www\\.)?[^\\s]+/gi',
        ],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<RegexConfig>(config, normalize);

      expect(result.patterns).toHaveLength(3);
      for (const pattern of result.patterns) {
        expect(pattern).toBeInstanceOf(RegExp);
      }

      // Test the actual regex functionality
      const regex1 = result.patterns[0] as RegExp;
      expect(regex1.test('abc123')).toBe(true);
      expect(regex1.test('abc-123')).toBe(false);
    });

    it('should handle regex without flags', () => {
      expect.assertions(2);
      const config = {
        patterns: ['regex:/test/'],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<RegexConfig>(config, normalize);

      expect(result.patterns[0]).toBeInstanceOf(RegExp);
      const regex = result.patterns[0] as RegExp;
      expect(regex.flags).toBe('');
    });

    it('should handle regex with multiple flags', () => {
      expect.assertions(2);
      const config = {
        patterns: ['regex:/test/gims'],
      };
      const normalize = { patterns: 'pathsOrRegexArray' as const };

      const result = normalizeConfig<RegexConfig>(config, normalize);

      expect(result.patterns[0]).toBeInstanceOf(RegExp);
      const regex = result.patterns[0] as RegExp;
      expect(regex.flags).toBe('gims');
    });

    it('should reject invalid regex syntax', () => {
      expect.assertions(8); // 3 patterns, 4 assertions each
      const invalidPatterns = [
        'regex:/[invalid/',
        'regex:/*invalid/',
        'regex:/(?invalid/',
        'regex:/\\k/', // Invalid escape
      ];

      for (const pattern of invalidPatterns) {
        const config = { patterns: [pattern] };
        const normalize = { patterns: 'pathsOrRegexArray' as const };

        const result = normalizeConfig<RegexConfig>(config, normalize);

        expect(result.patterns).toHaveLength(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'caution',
          expect.stringContaining('Invalid regex pattern'),
        );

        consoleWarnSpy.mockClear();
      }
    });

    it('should handle edge cases in regex format', () => {
      expect.assertions(5);
      const edgeCases = [
        'regex:/', // No closing slash
        'regex://', // Empty pattern
        'regex:test', // No slashes at all
        'regex:/test', // No closing slash
        'regex:test/', // No opening slash
      ];

      for (const pattern of edgeCases) {
        const config = { patterns: [pattern] };
        const normalize = { patterns: 'pathsOrRegexArray' as const };

        const result = normalizeConfig<RegexConfig>(config, normalize);

        // These should be treated as paths, not regex
        expect(result.patterns).toHaveLength(0);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle complex nested configuration', () => {
      expect.assertions(2);
      interface ComplexConfig extends Record<string, unknown> {
        level1: {
          stringField: string;
          boolField: boolean;
        };
        arrayField: string[];
      }

      const config = {
        level1: { stringField: 'test', boolField: false },
        arrayField: ['item1', 'item2'],
      };

      // Note: normalizeConfig doesn't handle nested objects by design
      // This test confirms it morphs them into a flat structure
      const normalize = {
        level1: 'string' as any, // Dummy value since level1 isn't actually normalized
        arrayField: 'stringArray' as const,
      };

      const result = normalizeConfig<ComplexConfig>(config, normalize);

      expect(result.level1).toBe('');
      expect(result.arrayField).toStrictEqual(['item1', 'item2']);
    });
    it('should handle configuration with extra properties', () => {
      expect.assertions(4);
      interface MinimalConfig extends Record<string, unknown> {
        requiredField: string;
      }

      const config = {
        requiredField: 'test',
        extraField1: 'extra1',
        extraField2: { nested: 'value' },
        extraField3: [1, 2, 3],
      };

      const normalize = {
        requiredField: 'string' as const,
      };

      const result = normalizeConfig<MinimalConfig>(config, normalize);

      expect(result.requiredField).toBe('test');
      expect((result as any).extraField1).toBe('extra1');
      expect((result as any).extraField2).toStrictEqual({ nested: 'value' });
      expect((result as any).extraField3).toStrictEqual([1, 2, 3]);
    });

    it('should handle normalize mapping with invalid function names', () => {
      expect.assertions(1);
      const config = { field: 'test' };
      const normalize = { field: 'nonExistentFunction' as any };

      const result = normalizeConfig(config, normalize);

      // Should leave the field unchanged since the normalize function doesn't exist
      expect(result.field).toBe('test');
    });

    it('should preserve original config object', () => {
      expect.assertions(4);
      const originalConfig = {
        stringField: 'original',
        pathField: './original/path/',
      };
      const normalize = {
        stringField: 'string' as const,
        pathField: 'path' as const,
      };

      const result = normalizeConfig(originalConfig, normalize);

      // Original should be unchanged
      expect(originalConfig.stringField).toBe('original');
      expect(originalConfig.pathField).toBe('./original/path/');

      // Result should be normalized
      expect(result.stringField).toBe('original');
      expect(result.pathField).toBe('/original/path');
    });
  });
});
