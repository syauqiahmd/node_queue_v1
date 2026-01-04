const ValidateMiddleware = require('../../../src/api/middlewares/validate');
const Joi = require('joi');

describe('ValidateMiddleware', () => {
  let validateMiddleware;
  let mockBusinessException;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockBusinessException = {
      BadRequest: jest.fn((msg) => new Error(msg)),
    };

    mockReq = {
      body: {},
      query: {},
      params: {},
    };

    mockRes = {};
    mockNext = jest.fn();

    validateMiddleware = new ValidateMiddleware({
      businessException: mockBusinessException,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getValueToValidate', () => {
    it('should return body when type is body', () => {
      mockReq.body = { foo: 'bar' };
      const result = validateMiddleware.getValueToValidate(mockReq, 'body');
      expect(result).toEqual(mockReq.body);
    });

    it('should return query when type is query', () => {
      mockReq.query = { foo: 'bar' };
      const result = validateMiddleware.getValueToValidate(mockReq, 'query');
      expect(result).toEqual(mockReq.query);
    });

    it('should return params when type is params', () => {
      mockReq.params = { foo: 'bar' };
      const result = validateMiddleware.getValueToValidate(mockReq, 'params');
      expect(result).toEqual(mockReq.params);
    });

    it('should return empty object for unknown type', () => {
      const result = validateMiddleware.getValueToValidate(mockReq, 'unknown');
      expect(result).toEqual({});
    });
  });

  describe('generateJoiErrorMessage', () => {
    it('should return default message if err is undefined', () => {
      const msg = validateMiddleware.generateJoiErrorMessage();
      expect(msg).toBe('Validation failed');
    });

    it('should return default message if err is null', () => {
      const msg = validateMiddleware.generateJoiErrorMessage(null);
      expect(msg).toBe('Validation failed');
    });

    it('should return specific message for known types', () => {
      const knownTypes = [
        'object.unknown',
        'any.required',
        'string.empty',
        'string.max',
        'any.unknown',
        'any.only',
        'number.min',
      ];

      knownTypes.forEach((type) => {
        const err = { type, message: 'Specific error message' };
        const msg = validateMiddleware.generateJoiErrorMessage(err);
        expect(msg).toBe('Specific error message');
      });
    });

    it('should return id must be a valid value for string.guid', () => {
      const err = { type: 'string.guid' };
      const msg = validateMiddleware.generateJoiErrorMessage(err);
      expect(msg).toBe('id must be a valid value');
    });

    it('should return default message for unknown type', () => {
      const err = { type: 'unknown.type' };
      const msg = validateMiddleware.generateJoiErrorMessage(err);
      expect(msg).toBe('Validation failed');
    });
  });

  describe('validate', () => {
    it('should throw BadRequest for invalid validation type', () => {
      const schema = Joi.object();
      const middleware = validateMiddleware.validate(schema, 'invalid');

      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow();
      expect(mockBusinessException.BadRequest).toHaveBeenCalledWith('Invalid validation type');
    });

    it('should validate successfully', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockReq.body = { name: 'test' };
      const middleware = validateMiddleware.validate(schema, 'body');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate successfully using default type (body)', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockReq.body = { name: 'test' };
      const middleware = validateMiddleware.validate(schema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw BadRequest on validation error', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockReq.body = {};
      const middleware = validateMiddleware.validate(schema, 'body');

      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow();
      expect(mockBusinessException.BadRequest).toHaveBeenCalled();
    });
  });
});
