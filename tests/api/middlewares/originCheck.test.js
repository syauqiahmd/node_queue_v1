const OriginCheckMiddleware = require('../../../src/api/middlewares/originCheck');

describe('OriginCheckMiddleware', () => {
  let mockBusinessException;
  let mockReq;
  let mockRes;
  let mockNext;
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CORS_ORIGIN: 'https://app.example.com' };
    mockBusinessException = {
      Forbidden: jest.fn((msg) => new Error(`Forbidden: ${msg}`)),
    };
    mockReq = { method: 'POST', headers: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  const build = () => new OriginCheckMiddleware({ businessException: mockBusinessException });

  it('should allow a whitelisted origin', () => {
    mockReq.headers.origin = 'https://app.example.com';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should allow a matching referer when origin header is absent', () => {
    mockReq.headers.referer = 'https://app.example.com/create-ticket';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should allow localhost in development', () => {
    process.env.NODE_ENV = 'development';
    mockReq.headers.origin = 'http://localhost:5173';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject localhost outside development', () => {
    process.env.NODE_ENV = 'production';
    mockReq.headers.origin = 'http://localhost:5173';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject a non-whitelisted origin', () => {
    mockReq.headers.origin = 'https://evil.example.com';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockBusinessException.Forbidden).toHaveBeenCalledWith('Request origin not allowed');
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject when no origin or referer is present', () => {
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should ignore an unparsable referer', () => {
    mockReq.headers.referer = 'not-a-valid-url';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should skip the check entirely for GET requests', () => {
    mockReq.method = 'GET';
    build().enforceForWrites(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
