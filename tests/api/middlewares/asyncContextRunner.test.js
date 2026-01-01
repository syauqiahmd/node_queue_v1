const AsyncContextRunnerMiddleware = require('../../../src/api/middlewares/asyncContextRunner');

describe('AsyncContextRunnerMiddleware', () => {
  let asyncContextRunnerMiddleware;
  let mockAsyncContext;
  let mockAsyncLocalStorage;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockAsyncLocalStorage = {
      run: jest.fn((store, callback) => callback()),
    };

    mockAsyncContext = {
      asyncLocalStorage: mockAsyncLocalStorage,
    };

    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();

    asyncContextRunnerMiddleware = new AsyncContextRunnerMiddleware({
      asyncContext: mockAsyncContext,
    });
  });

  describe('run', () => {
    it('should run next within asyncLocalStorage context', () => {
      asyncContextRunnerMiddleware.run(mockReq, mockRes, mockNext);

      expect(mockAsyncLocalStorage.run).toHaveBeenCalledWith(expect.any(Map), expect.any(Function));
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
