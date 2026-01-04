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

  it('should include transactionId and requestContext in log info', () => {
    // Find the call to winston.format that passes a function
    const transformCall = winston.format.mock.calls.find(call => typeof call[0] === 'function');
    expect(transformCall).toBeDefined();
    const transformFn = transformCall[0];

    // Mock store
    const store = new Map();
    store.set('transactionId', 'tx-123');
    store.set('requestContext', { method: 'GET', path: '/test' });
    mockStore.get.mockImplementation((key) => store.get(key));
    require('../../../src/infra/utils/asyncContext').asyncLocalStorage.getStore.mockReturnValue(mockStore);

    const info = {};
    const result = transformFn(info);

    expect(result.transactionId).toBe('tx-123');
    expect(result.requestContext).toEqual({ method: 'GET', path: '/test' });
  });

  it('should not include transactionId and requestContext if no store', () => {
    const transformCall = winston.format.mock.calls.find(call => typeof call[0] === 'function');
    const transformFn = transformCall[0];

    require('../../../src/infra/utils/asyncContext').asyncLocalStorage.getStore.mockReturnValue(null);

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
      message: 'Test message'
    });
    expect(log1).toBe('2023-01-01 info: Test message');

    // Test case 2: With transactionId
    const log2 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
      transactionId: 'tx-123'
    });
    expect(log2).toBe('2023-01-01 info: [tx-123] Test message');

    // Test case 3: With requestContext
    const log3 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
      requestContext: { method: 'GET', path: '/test' }
    });
    expect(log3).toBe('2023-01-01 info: [GET /test] Test message');

    // Test case 4: With requestContext and userId
    const log4 = templateFn({
      timestamp: '2023-01-01',
      level: 'info',
      message: 'Test message',
      requestContext: { method: 'GET', path: '/test', userId: 'user-1' }
    });
    expect(log4).toBe('2023-01-01 info: [GET /test] [User:user-1] Test message');

    // Test case 5: With stack
    const log5 = templateFn({
      timestamp: '2023-01-01',
      level: 'error',
      message: 'Error message',
      stack: 'Error stack trace'
    });
    expect(log5).toBe('2023-01-01 error: Error stack trace');

    process.env.NODE_ENV = originalEnv;
  });

  it('should not add Console transport in production environment', () => {
    jest.clearAllMocks(); // Clear calls from beforeEach
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    let loggerHelperProd;
    jest.isolateModules(() => {
      loggerHelperProd = require('../../../src/infra/utils/log.helper');
    });

    expect(loggerHelperProd.logger.add).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});
