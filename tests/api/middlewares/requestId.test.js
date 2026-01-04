const RequestIdMiddleware = require('../../../src/api/middlewares/requestId');
const uuid = require('uuid');
const asyncContext = require('../../../src/infra/utils/asyncContext');

jest.mock('uuid');
jest.mock('../../../src/infra/utils/asyncContext', () => ({
  setUser: jest.fn(),
  asyncLocalStorage: {
    run: jest.fn(),
  },
}));

describe('RequestIdMiddleware', () => {
  let requestIdMiddleware;
  let mockAsyncLocalStorage;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    uuid.v4.mockReturnValue('test-uuid');

    mockAsyncLocalStorage = {
      run: jest.fn((store, callback) => callback()),
    };

    // Update the mock implementation for the test run
    asyncContext.asyncLocalStorage = mockAsyncLocalStorage;

    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    requestIdMiddleware = new RequestIdMiddleware({
      asyncContext: { asyncLocalStorage: mockAsyncLocalStorage },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestIdMiddleware', () => {
    it('should set transaction id and run in context', () => {
      requestIdMiddleware.requestIdMiddleware(mockReq, mockRes, mockNext);

      expect(uuid.v4).toHaveBeenCalled();
      expect(mockReq.transactionId).toBe('test-uuid');
      expect(mockReq.headers['x-transaction-id']).toBe('test-uuid');
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-transaction-id', 'test-uuid');

      expect(mockAsyncLocalStorage.run).toHaveBeenCalledWith(expect.any(Map), expect.any(Function));

      // Check if map contains transactionId
      const storeMap = mockAsyncLocalStorage.run.mock.calls[0][0];
      expect(storeMap.get('transactionId')).toBe('test-uuid');

      expect(mockNext).toHaveBeenCalled();
    });

    it('should patch res.json to include transactionId', () => {
      requestIdMiddleware.requestIdMiddleware(mockReq, mockRes, mockNext);

      const body = { success: true };
      mockRes.json(body);

      expect(body.transactionId).toBe('test-uuid');
    });

    it('should not patch res.json if body is not object', () => {
      requestIdMiddleware.requestIdMiddleware(mockReq, mockRes, mockNext);

      const body = 'string body';
      mockRes.json(body);

      expect(body).toBe('string body');
      // No property added to string primitive
    });

    it('should set user in async context if req.user exists', () => {
      mockReq.user = { id: 1 };
      requestIdMiddleware.requestIdMiddleware(mockReq, mockRes, mockNext);

      expect(asyncContext.setUser).toHaveBeenCalledWith({ id: 1 });
    });
  });
});
