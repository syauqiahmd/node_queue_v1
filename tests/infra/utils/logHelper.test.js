const winston = require('winston');
const { asyncLocalStorage } = require('../../../src/infra/utils/asyncContext');

jest.mock('winston', () => {
  const mFormat = {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    errors: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    printf: jest.fn().mockReturnThis(),
  };
  // winston.format(...) returns a function that is immediately invoked in the code: winston.format(fn)()
  const formatFn = jest.fn((fn) => {
    return jest.fn();
  });
  Object.assign(formatFn, mFormat);

  const mLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
  };
  return {
    format: formatFn,
    transports: {
      DailyRotateFile: jest.fn(),
      Console: jest.fn(),
    },
    createLogger: jest.fn(() => mLogger),
  };
});

jest.mock('winston-daily-rotate-file', () => jest.fn());

jest.mock('../../../src/infra/utils/asyncContext', () => ({
  asyncLocalStorage: {
    getStore: jest.fn(),
  },
}));

describe('Logger Helper', () => {
  let loggerHelper;
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {
      get: jest.fn(),
    };
    // Re-require to trigger constructor
    jest.isolateModules(() => {
      loggerHelper = require('../../../src/infra/utils/log.helper');
    });
  });

  it('should create a logger with correct configuration', () => {
    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.transports.DailyRotateFile).toHaveBeenCalledTimes(4); // error, warn, info, debug
  });

  it('should add Console transport with JSON format in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.isolateModules(() => {
      loggerHelper = require('../../../src/infra/utils/log.helper');
    });

    expect(winston.transports.Console).toHaveBeenCalled();
    // In production, we expect Console called without arguments (using default format)
    // However, since we cleared mocks, we need to check the calls.
    // The previous test runs might have polluted the calls if not cleared properly,
    // but beforeEach clears mocks.

    // Check if the last call to Console was with no arguments or empty object
    // Wait, winston.transports.Console() call in the else block has no args.
    // Production console only echoes warnings and errors (PM2 already persists stdout).
    const consoleCalls = winston.transports.Console.mock.calls;
    const productionCall = consoleCalls[consoleCalls.length - 1];
    expect(productionCall).toEqual([{ level: 'warn' }]);

    process.env.NODE_ENV = originalEnv;
  });

  it('should log info messages', () => {
    loggerHelper.info('Info message', { meta: 'data' });
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.info).toHaveBeenCalledWith('Info message', { meta: 'data' });
  });

  it('should log error messages', () => {
    loggerHelper.error('Error message', { error: 'details' });
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.error).toHaveBeenCalledWith('Error message', { error: 'details' });
  });

  it('should log warn messages', () => {
    loggerHelper.warn('Warn message');
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.warn).toHaveBeenCalledWith('Warn message', undefined);
  });

  it('should log debug messages', () => {
    loggerHelper.debug('Debug message');
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.debug).toHaveBeenCalledWith('Debug message', undefined);
  });

  const findFormat = (name) =>
    winston.format.mock.calls.map((call) => call[0]).find((fn) => fn.toString().includes(name));

  it('should include transactionId, requestContext and userId in log info', () => {
    const transformFn = findFormat('asyncLocalStorage.getStore');
    expect(transformFn).toBeDefined();

    // Mock store
    const store = new Map();
    store.set('transactionId', 'tx-123');
    store.set('requestContext', { method: 'GET', path: '/test' });
    store.set('user', { id: 42 });
    mockStore.get.mockImplementation((key) => store.get(key));
    require('../../../src/infra/utils/asyncContext').asyncLocalStorage.getStore.mockReturnValue(
      mockStore
    );

    const info = {};
    const result = transformFn(info);

    expect(result.transactionId).toBe('tx-123');
    expect(result.requestContext).toEqual({ method: 'GET', path: '/test' });
    expect(result.userId).toBe(42);
  });

  it('should tag every entry with the service name from SERVICE_NAME', () => {
    const transformFn = findFormat('asyncLocalStorage.getStore');
    require('../../../src/infra/utils/asyncContext').asyncLocalStorage.getStore.mockReturnValue(
      null
    );
    const original = process.env.SERVICE_NAME;
    process.env.SERVICE_NAME = 'node-queue-cron';

    expect(transformFn({}).service).toBe('node-queue-cron');

    process.env.SERVICE_NAME = original;
    if (original === undefined) {
      delete process.env.SERVICE_NAME;
    }
  });

  it('should not override explicitly passed transactionId', () => {
    const transformFn = findFormat('asyncLocalStorage.getStore');
    mockStore.get.mockImplementation((key) => (key === 'transactionId' ? 'tx-store' : undefined));
    require('../../../src/infra/utils/asyncContext').asyncLocalStorage.getStore.mockReturnValue(
      mockStore
    );

    const result = transformFn({ transactionId: 'tx-explicit' });

    expect(result.transactionId).toBe('tx-explicit');
  });

  it('should serialize errors nested in meta so message and stack are kept', () => {
    const transformFn = findFormat('serializeError');
    expect(transformFn).toBeDefined();

    const error = new Error('boom');
    error.code = 'ECONNREFUSED';
    const result = transformFn({ message: 'failed', error, context: 'X' });

    expect(result.error).toEqual({
      name: 'Error',
      message: 'boom',
      code: 'ECONNREFUSED',
      stack: error.stack,
    });
    expect(result.context).toBe('X');
  });

  it('should redact personal data and credentials without touching the caller object', () => {
    const redactFn = findFormat('redact(');
    expect(redactFn).toBeDefined();

    const live = { phoneNumber: '6281234567890' };
    const result = redactFn({
      level: 'warn',
      message: 'lookup 081234567890',
      data: live,
      password: 'hunter2',
    });

    expect(result.message).toBe('lookup 0812*****890');
    expect(result.data).toEqual({ phoneNumber: '6281******890' });
    expect(result.password).toBe('[REDACTED]');
    expect(live.phoneNumber).toBe('6281234567890');
  });

  it('should only pass entries of its own level to each level file', () => {
    // First level transport created is 'error'
    const levelFilter = findFormat('info.level === level');
    const errorInfo = { level: 'error', message: 'x' };

    expect(levelFilter(errorInfo)).toBe(errorInfo);
    expect(levelFilter({ level: 'warn', message: 'x' })).toBe(false);
  });

  it('should not include transactionId and requestContext if no store', () => {
    const transformFn = findFormat('asyncLocalStorage.getStore');

    require('../../../src/infra/utils/asyncContext').asyncLocalStorage.getStore.mockReturnValue(
      null
    );

    const info = {};
    const result = transformFn(info);

    expect(result.transactionId).toBeUndefined();
    expect(result.requestContext).toBeUndefined();
  });

  it('should format console log correctly', () => {
    // Ensure NODE_ENV is not production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    jest.isolateModules(() => {
      loggerHelper = require('../../../src/infra/utils/log.helper');
    });

    const printfCall = winston.format.printf.mock.calls[0];
    expect(printfCall).toBeDefined();
    const templateFn = printfCall[0];

    // Test case 1: Basic log
    const log1 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
    });
    expect(log1).toBe('2023-01-01 info: Test message');

    // Test case 2: With transactionId
    const log2 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
      transactionId: 'tx-123',
    });
    expect(log2).toBe('2023-01-01 info: [tx-123] Test message');

    // Test case 3: With requestContext
    const log3 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
      requestContext: { method: 'GET', path: '/test' },
    });
    expect(log3).toBe('2023-01-01 info: [GET /test] Test message');

    // Test case 4: With requestContext and userId
    const log4 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
      requestContext: { method: 'GET', path: '/test' },
      userId: 'user-1',
    });
    expect(log4).toBe('2023-01-01 info: [GET /test] [User:user-1] Test message');

    // Test case 5: With stack
    const log5 = templateFn({
      timestamp: '2023-01-01',
      level: 'error',
      message: 'Error message',
      stack: 'Error stack trace',
    });
    expect(log5).toBe('2023-01-01 error: Error stack trace');

    process.env.NODE_ENV = originalEnv;
  });
});
