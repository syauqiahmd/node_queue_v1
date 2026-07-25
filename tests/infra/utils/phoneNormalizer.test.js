const PhoneNormalizer = require('../../../src/infra/utils/phoneNormalizer');

describe('PhoneNormalizer', () => {
  let phoneNormalizer;
  let mockBusinessException;

  beforeEach(() => {
    mockBusinessException = {
      BadRequest: jest.fn((msg) => new Error(msg)),
    };

    phoneNormalizer = new PhoneNormalizer({ businessException: mockBusinessException });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should normalize a +62-prefixed number to 62xxx', () => {
    expect(phoneNormalizer.normalize('+6281234567890')).toBe('6281234567890');
  });

  it('should normalize a 62-prefixed number to 62xxx', () => {
    expect(phoneNormalizer.normalize('6281234567890')).toBe('6281234567890');
  });

  it('should normalize a 0-prefixed number to 62xxx', () => {
    expect(phoneNormalizer.normalize('081234567890')).toBe('6281234567890');
  });

  it('should strip spaces and dashes before normalizing', () => {
    expect(phoneNormalizer.normalize('0812-3456-7890')).toBe('6281234567890');
  });

  it('should throw BadRequest for a non-mobile prefix (not starting with 8)', () => {
    expect(() => phoneNormalizer.normalize('0212345678')).toThrow();
    expect(mockBusinessException.BadRequest).toHaveBeenCalledWith('Invalid phone number format');
  });

  it('should throw BadRequest for an unparseable string', () => {
    expect(() => phoneNormalizer.normalize('not-a-phone')).toThrow();
    expect(mockBusinessException.BadRequest).toHaveBeenCalledWith('Invalid phone number format');
  });

  it('should throw BadRequest for empty/undefined input', () => {
    expect(() => phoneNormalizer.normalize(undefined)).toThrow();
    expect(mockBusinessException.BadRequest).toHaveBeenCalledWith('Invalid phone number format');
  });
});
