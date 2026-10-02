const { registerProcessHandlers } = require('../../../src/infra/lifecycle/processHandlers');

describe('registerProcessHandlers', () => {
  let handlers;
  let mockLogger;

  beforeEach(() => {
    jest.useFakeTimers();
    handlers = new Map();
    jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      handlers.set(event, handler);
      return process;
    });
    jest.spyOn(process, 'exit').mockImplementation(() => {});
    mockLogger = { info: jest.fn(), error: jest.fn() };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('logs uncaught exceptions and exits with code 1 after flushing', () => {
    registerProcessHandlers({ logger: mockLogger, name: 'api' });
    const error = new Error('crash');

    handlers.get('uncaughtException')(error);

    expect(mockLogger.error).toHaveBeenCalledWith('Uncaught exception', {
      context: 'Process:api',
      error,
    });
    expect(process.exit).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('logs unhandled rejections, wrapping non-Error reasons', () => {
    registerProcessHandlers({ logger: mockLogger, name: 'api' });

    handlers.get('unhandledRejection')('plain string');

    const [, meta] = mockLogger.error.mock.calls[0];
    expect(meta.error).toBeInstanceOf(Error);
    expect(meta.error.message).toBe('plain string');
    jest.runAllTimers();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('does not register signal handlers without onShutdown', () => {
    registerProcessHandlers({ logger: mockLogger, name: 'websocket' });

    expect(handlers.get('SIGTERM')).toBeUndefined();
    expect(handlers.get('SIGINT')).toBeUndefined();
  });

  it('runs onShutdown once on SIGTERM and exits with code 0', async () => {
    const onShutdown = jest.fn().mockResolvedValue();
    registerProcessHandlers({ logger: mockLogger, name: 'api', onShutdown });

    await handlers.get('SIGTERM')();
    await handlers.get('SIGINT')();

    expect(onShutdown).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('exits with code 1 when onShutdown fails', async () => {
    const error = new Error('disconnect failed');
    registerProcessHandlers({
      logger: mockLogger,
      name: 'api',
      onShutdown: jest.fn().mockRejectedValue(error),
    });

    await handlers.get('SIGTERM')();

    expect(mockLogger.error).toHaveBeenCalledWith('Error during shutdown', {
      context: 'Process:api',
      error,
    });
    jest.runAllTimers();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
