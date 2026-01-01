const LoggerContextMiddleware = require('../../../src/api/middlewares/loggerContext');

describe('LoggerContextMiddleware', () => {
  let loggerContextMiddleware;
  let mockAsyncContext;
  let mockAsyncLocalStorage;
  let mockStore;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockStore = {
      set: jest.fn(),
    };

    mockAsyncLocalStorage = {
      getStore: jest.fn().mockReturnValue(mockStore),
    };

    mockAsyncContext = {
      asyncLocalStorage: mockAsyncLocalStorage,
    };

    mockReq = {
      originalUrl: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'jest',
      },
    };
    mockRes = {};
    mockNext = jest.fn();

    loggerContextMiddleware = new LoggerContextMiddleware({
      asyncContext: mockAsyncContext,
    });
  });

  describe('loggerContext', () => {
    it('should set request context in store if store exists', () => {
      loggerContextMiddleware.loggerContext(mockReq, mockRes, mockNext);

      expect(mockAsyncLocalStorage.getStore).toHaveBeenCalled();
      expect(mockStore.set).toHaveBeenCalledWith('requestContext', {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'jest',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should proceed if store does not exist', () => {
      mockAsyncLocalStorage.getStore.mockReturnValue(null);
      loggerContextMiddleware.loggerContext(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockStore.set).not.toHaveBeenCalled();
    });
  });
});
