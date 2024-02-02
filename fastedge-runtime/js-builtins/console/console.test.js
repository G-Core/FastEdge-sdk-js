import { injectFastEdgeConsoleLogging, _writeToRuntime } from '.';

describe('console', () => {
  describe('writeToRuntime', () => {
    let send;

    beforeEach(() => {
      send = jest.fn();
    });

    it.each([
      ['undefined', undefined, 'undefined'],
      ['null', null, 'null'],
      ['objects', { foo: 'bar' }, '{"foo":"bar"}'],
      ['promises', new Promise((r) => {}), '[ Promise<Pending> ]'],
      ['primitive types', 'some_string', 'some_string'],
      ['primitive types', false, 'false'],
      ['primitive types', 2056, '2056'],
    ])('should handle %s', (_, arg, result) => {
      expect.assertions(1);
      _writeToRuntime(send, '[LOG] ', arg);
      expect(send).toHaveBeenCalledWith(`[LOG] ${result}`);
    });

    it('should handle errors', () => {
      expect.assertions(1);
      _writeToRuntime(send, '[LOG] ', new Error('test_error'));
      expect(send).toHaveBeenCalledWith(
        expect.stringContaining('[LOG] test_error Error: test_error\n    at Object.<anonymous>'),
      );
    });

    it.each([
      ['test1', [undefined, true, 'test_string'], 'undefined, true, test_string'],
      ['test2', [{ foo: 'bar' }, ['chicken', 'noodle']], '{"foo":"bar"}, ["chicken","noodle"]'],
      ['test3', ['some_other', new Promise((r) => {})], 'some_other, [ Promise<Pending> ]'],
      ['test4', [2056, false, true, 9087.78], '2056, false, true, 9087.78'],
    ])('should handle multiple arguments: %s', (_, args, result) => {
      expect.assertions(1);
      _writeToRuntime(send, '[DEBUG] ', ...args);
      expect(send).toHaveBeenCalledWith(`[DEBUG] ${result}`);
    });
  });

  describe('injectFastEdgeConsoleLogging', () => {
    let originalConsole;

    beforeEach(() => {
      originalConsole = globalThis.console;
      globalThis.fastedge = {
        consoleLog: jest.fn(),
        consoleError: jest.fn(),
      };
    });

    afterEach(() => {
      globalThis.console = originalConsole;
    });

    it('should replace global console object', () => {
      expect.assertions(1);
      injectFastEdgeConsoleLogging();
      expect(globalThis.console).not.toBe(originalConsole);
    });

    it('should call fastedge.consoleLog on console.log', () => {
      expect.assertions(1);
      injectFastEdgeConsoleLogging();
      console.log('test');
      expect(globalThis.fastedge.consoleLog).toHaveBeenCalledWith('[LOG] test');
    });

    it('should call fastedge.consoleError on console.error', () => {
      expect.assertions(1);
      injectFastEdgeConsoleLogging();
      console.error('test');
      expect(globalThis.fastedge.consoleError).toHaveBeenCalledWith('[ERROR] test');
    });
  });
});
