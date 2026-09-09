const ApiKeyAuthMiddleware = require('../../../src/api/middlewares/apiKeyAuth');

describe('ApiKeyAuthMiddleware', () => {
  let mockBusinessException;
  let mockReq;
  let mockRes;
  let mockNext;
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    mockBusinessException = {
      Unauthorized: jest.fn((msg) => new Error(`Unauthorized: ${msg}`)),
    };
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  const build = () => new ApiKeyAuthMiddleware({ businessException: mockBusinessException });

  it('should authenticate a valid service key', () => {
    process.env.SERVICE_API_KEYS = 'serviceA:keyA,serviceB:keyB';
    const middleware = build();
    mockReq.headers['x-service-key'] = 'keyB';

    middleware.authenticateService(mockReq, mockRes, mockNext);

    expect(mockReq.service).toEqual({ name: 'serviceB' });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject when no key header is provided', () => {
    process.env.SERVICE_API_KEYS = 'serviceA:keyA';
    const middleware = build();

    middleware.authenticateService(mockReq, mockRes, mockNext);

    expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('Invalid service key');
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockReq.service).toBeUndefined();
  });

  it('should reject an unknown key', () => {
    process.env.SERVICE_API_KEYS = 'serviceA:keyA';
    const middleware = build();
    mockReq.headers['x-service-key'] = 'not-a-real-key';

    middleware.authenticateService(mockReq, mockRes, mockNext);

    expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('Invalid service key');
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject any key when SERVICE_API_KEYS is unset', () => {
    delete process.env.SERVICE_API_KEYS;
    const middleware = build();
    mockReq.headers['x-service-key'] = 'anything';

    middleware.authenticateService(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
