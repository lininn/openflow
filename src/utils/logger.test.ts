import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger, logger } from './logger.js';

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('suppresses debug output unless debug is enabled', () => {
    const normalLogger = createLogger({ debug: false });
    const debugLogger = createLogger({ debug: true });

    normalLogger.debug('hidden');
    debugLogger.debug('visible');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]?.join(' ')).toContain('visible');
  });

  it('emits structured json output when json mode is enabled', () => {
    const jsonLogger = createLogger({ json: true, debug: true });

    jsonLogger.info('hello');
    jsonLogger.error('bad');

    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0]))).toEqual({ level: 'info', message: 'hello' });
    expect(JSON.parse(String(errorSpy.mock.calls[0]?.[0]))).toEqual({ level: 'error', message: 'bad' });
  });

  it('default logger exposes debug and configuration methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.configure).toBe('function');
  });
});
