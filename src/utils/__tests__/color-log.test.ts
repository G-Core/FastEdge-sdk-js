/* eslint-disable jest/no-conditional-expect */
import { colorLog } from '../color-log.ts';

describe('color-log', () => {
  let consoleInfoSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('error logging', () => {
    it('should use console.error for error color', () => {
      expect.assertions(2);
      colorLog('error', 'Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '\u001B[31m', // Red color
        'Test error message',
        '\u001B[0m', // Reset color
      );
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments with error color', () => {
      expect.assertions(1);
      colorLog('error', 'Error:', 'Something went wrong', { code: 500 });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '\u001B[31m',
        'Error:',
        'Something went wrong',
        { code: 500 },
        '\u001B[0m',
      );
    });

    it('should handle no arguments with error color', () => {
      expect.assertions(1);
      colorLog('error');

      expect(consoleErrorSpy).toHaveBeenCalledWith('\u001B[31m', '\u001B[0m');
    });
  });

  describe('info logging', () => {
    it('should use console.info for success color', () => {
      expect.assertions(2);
      colorLog('success', 'Operation completed successfully');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[32m', // Green color
        'Operation completed successfully',
        '\u001B[0m',
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should use console.info for warning color', () => {
      expect.assertions(1);
      colorLog('warning', 'This is a warning');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[33m', // Yellow color
        'This is a warning',
        '\u001B[0m',
      );
    });

    it('should use console.info for info color', () => {
      expect.assertions(1);
      colorLog('info', 'Information message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[34m', // Blue color
        'Information message',
        '\u001B[0m',
      );
    });

    it('should use console.info for caution color', () => {
      expect.assertions(1);
      colorLog('caution', 'Proceed with caution');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[35m', // Magenta color
        'Proceed with caution',
        '\u001B[0m',
      );
    });

    it('should use console.info for standard color', () => {
      expect.assertions(1);
      colorLog('standard', 'Standard message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[0m', // No color
        'Standard message',
        '\u001B[0m',
      );
    });
  });

  describe('argument handling', () => {
    it('should handle multiple string arguments', () => {
      expect.assertions(1);
      colorLog('info', 'First', 'Second', 'Third');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[34m',
        'First',
        'Second',
        'Third',
        '\u001B[0m',
      );
    });

    it('should handle mixed argument types', () => {
      expect.assertions(1);
      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      const num = 42;
      const bool = true;

      colorLog('success', 'Mixed types:', obj, arr, num, bool);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[32m',
        'Mixed types:',
        obj,
        arr,
        num,
        bool,
        '\u001B[0m',
      );
    });

    it('should handle null and undefined arguments', () => {
      expect.assertions(1);
      colorLog('warning', null, undefined, 'test');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[33m',
        null,
        undefined,
        'test',
        '\u001B[0m',
      );
    });

    it('should handle empty string arguments', () => {
      expect.assertions(1);
      colorLog('info', '', 'non-empty', '');

      expect(consoleInfoSpy).toHaveBeenCalledWith('\u001B[34m', '', 'non-empty', '', '\u001B[0m');
    });

    it('should handle no arguments', () => {
      expect.assertions(1);
      colorLog('info');

      expect(consoleInfoSpy).toHaveBeenCalledWith('\u001B[34m', '\u001B[0m');
    });

    it('should handle complex objects', () => {
      expect.assertions(1);
      const complexObj = {
        nested: { deep: { value: 'test' } },
        array: [{ id: 1 }, { id: 2 }],
        fn: () => 'function',
        date: new Date('2023-01-01'),
      };

      colorLog('caution', 'Complex object:', complexObj);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[35m',
        'Complex object:',
        complexObj,
        '\u001B[0m',
      );
    });
  });

  describe('color codes', () => {
    it('should use correct ANSI color codes for each log type', () => {
      expect.assertions(6);
      const expectedColors = {
        error: '\u001B[31m', // Red
        success: '\u001B[32m', // Green
        warning: '\u001B[33m', // Yellow
        info: '\u001B[34m', // Blue
        caution: '\u001B[35m', // Magenta
        standard: '\u001B[0m', // No color
      };

      for (const [logType, expectedColor] of Object.entries(expectedColors)) {
        jest.clearAllMocks();

        colorLog(logType as any, 'test');

        if (logType === 'error') {
          expect(consoleErrorSpy).toHaveBeenCalledWith(expectedColor, 'test', '\u001B[0m');
        } else {
          expect(consoleInfoSpy).toHaveBeenCalledWith(expectedColor, 'test', '\u001B[0m');
        }
      }
    });

    it('should always end with reset color code', () => {
      expect.assertions(6);
      const logTypes = ['error', 'success', 'warning', 'info', 'caution', 'standard'];

      for (const logType of logTypes) {
        jest.clearAllMocks();
        colorLog(logType as any, 'test');

        if (logType === 'error') {
          const lastCall = consoleErrorSpy.mock.calls[0];
          expect(lastCall.at(-1)).toBe('\u001B[0m');
        } else {
          const lastCall = consoleInfoSpy.mock.calls[0];
          expect(lastCall.at(-1)).toBe('\u001B[0m');
        }
      }
    });
  });

  describe('console method selection', () => {
    it('should only use console.error for error logs', () => {
      expect.assertions(2);
      colorLog('error', 'Error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should use console.info for all non-error logs', () => {
      expect.assertions(2);
      const nonErrorTypes = ['success', 'warning', 'info', 'caution', 'standard'];

      for (const [index, logType] of nonErrorTypes.entries()) {
        colorLog(logType as any, `Message ${index}`);
      }

      expect(consoleInfoSpy).toHaveBeenCalledTimes(5);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', () => {
      expect.assertions(1);
      const longMessage = 'a'.repeat(10000);

      colorLog('info', longMessage);

      expect(consoleInfoSpy).toHaveBeenCalledWith('\u001B[34m', longMessage, '\u001B[0m');
    });

    it('should handle special characters in messages', () => {
      expect.assertions(1);
      const specialMessage = 'Special chars: ñáéíóú 中文 🚀 \n\t\r';

      colorLog('success', specialMessage);

      expect(consoleInfoSpy).toHaveBeenCalledWith('\u001B[32m', specialMessage, '\u001B[0m');
    });

    it('should handle circular reference objects gracefully', () => {
      expect.assertions(2);
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // This should not throw an error
      expect(() => {
        colorLog('warning', 'Circular object:', circularObj);
      }).not.toThrow();

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[33m',
        'Circular object:',
        circularObj,
        '\u001B[0m',
      );
    });

    it('should handle function arguments', () => {
      expect.assertions(1);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const testFunction = () => 'test';

      colorLog('info', 'Function:', testFunction);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[34m',
        'Function:',
        testFunction,
        '\u001B[0m',
      );
    });

    it('should handle Symbol arguments', () => {
      expect.assertions(1);
      const testSymbol = Symbol('test');

      colorLog('caution', 'Symbol:', testSymbol);

      expect(consoleInfoSpy).toHaveBeenCalledWith('\u001B[35m', 'Symbol:', testSymbol, '\u001B[0m');
    });

    it('should handle BigInt arguments', () => {
      expect.assertions(1);
      const bigIntValue = BigInt(123456789012345678901234567890n);

      colorLog('success', 'BigInt:', bigIntValue);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '\u001B[32m',
        'BigInt:',
        bigIntValue,
        '\u001B[0m',
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid successive calls', () => {
      expect.assertions(1);
      for (let i = 0; i < 100; i++) {
        colorLog('info', `Message ${i}`);
      }

      expect(consoleInfoSpy).toHaveBeenCalledTimes(100);
    });

    it('should handle mixed error and info calls', () => {
      expect.assertions(2);
      colorLog('error', 'Error 1');
      colorLog('success', 'Success 1');
      colorLog('error', 'Error 2');
      colorLog('warning', 'Warning 1');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
    });

    it('should maintain proper argument order with many arguments', () => {
      expect.assertions(1);
      const args = Array.from({ length: 10 }, (_, i) => `arg${i}`);

      colorLog('info', ...args);

      expect(consoleInfoSpy).toHaveBeenCalledWith('\u001B[34m', ...args, '\u001B[0m');
    });
  });

  describe('type safety', () => {
    it('should handle all valid LogColor types', () => {
      expect.assertions(6);
      const validColors = ['error', 'success', 'warning', 'info', 'caution', 'standard'] as const;

      for (const color of validColors) {
        jest.clearAllMocks();

        // This should not cause TypeScript errors
        colorLog(color, `Testing ${color}`);

        if (color === 'error') {
          // eslint-disable-next-line jest/prefer-called-with
          expect(consoleErrorSpy).toHaveBeenCalled();
        } else {
          // eslint-disable-next-line jest/prefer-called-with
          expect(consoleInfoSpy).toHaveBeenCalled();
        }
      }
    });
  });
});
