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
  // winston.format(...) returns a function that is immediately invoked
  const formatFn = jest.fn(() => jest.fn());
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
});
