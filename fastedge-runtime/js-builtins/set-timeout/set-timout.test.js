import { injectFastEdgeSetTimeout, setInterval, setTimeout } from './index';

describe('set-timeouts', () => {
  describe('setTimeout', () => {
    let consoleWarn;

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it('should warn about setTimeout not being supported', () => {
      expect.assertions(2);
      const cb = jest.fn();
      setTimeout(cb, 1000);
      expect(consoleWarn).toHaveBeenCalledWith('setTimeout is not yet supported in FastEdge beta');
      expect(cb).toHaveBeenCalledWith();
    });
  });

  describe('setInterval', () => {
    let consoleWarn;

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it('should warn about setInterval not being supported', () => {
      expect.assertions(2);
      const cb = jest.fn();
      setInterval(cb, 1000);
      expect(consoleWarn).toHaveBeenCalledWith('setInterval is not yet supported in FastEdge beta');
      expect(cb).toHaveBeenCalledWith();
    });
  });

  describe('injectFastEdgeSetTimeout', () => {
    it('should replace global setTimeout and setInterval', () => {
      expect.assertions(2);
      injectFastEdgeSetTimeout();
      expect(globalThis.setTimeout).toBe(setTimeout);
      expect(globalThis.setInterval).toBe(setInterval);
    });
  });
});
