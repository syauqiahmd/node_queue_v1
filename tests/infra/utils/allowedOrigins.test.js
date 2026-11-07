const {
  isAllowedOrigin,
  isLocalOrigin,
  corsOriginCallback,
} = require('../../../src/infra/utils/allowedOrigins');

describe('allowedOrigins', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://app.example.com, https://admin.example.com',
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('allows origins listed in CORS_ORIGIN (trimmed)', () => {
    expect(isAllowedOrigin('https://app.example.com')).toBe(true);
    expect(isAllowedOrigin('https://admin.example.com')).toBe(true);
  });

  it('rejects unknown and missing origins', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
    expect(isAllowedOrigin('')).toBe(false);
  });

  it('rejects localhost in production', () => {
    expect(isAllowedOrigin('http://localhost:5173')).toBe(false);
    expect(isAllowedOrigin('http://127.0.0.1:8000')).toBe(false);
  });

  it('allows localhost on any port in development', () => {
    process.env.NODE_ENV = 'development';
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
    expect(isAllowedOrigin('https://localhost')).toBe(true);
  });

  it('does not treat look-alike hosts as local', () => {
    expect(isLocalOrigin('http://localhost.evil.com')).toBe(false);
    expect(isLocalOrigin('http://127.0.0.1.evil.com')).toBe(false);
    process.env.NODE_ENV = 'development';
    expect(isAllowedOrigin('http://localhost.evil.com')).toBe(false);
  });

  describe('corsOriginCallback', () => {
    it('lets requests without an Origin header through', () => {
      const callback = jest.fn();
      corsOriginCallback(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('allows a configured origin', () => {
      const callback = jest.fn();
      corsOriginCallback('https://app.example.com', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('blocks other origins with an error', () => {
      const callback = jest.fn();
      corsOriginCallback('http://localhost:5173', callback);
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
