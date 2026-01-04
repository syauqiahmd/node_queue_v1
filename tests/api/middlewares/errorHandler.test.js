const ErrorHandlerMiddleware = require('../../../src/api/middlewares/errorHandler');
const { BusinessError } = require('../../../src/infra/utils/businessException');
const { Prisma } = require('../../../src/infra/db/generated/prisma/client');

describe('ErrorHandlerMiddleware', () => {
  let errorHandlerMiddleware;
  let mockLogger;
  let mockResponseFormatter;
  let mockPrismaClient;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
    };

    mockResponseFormatter = {
      errorResponse: jest.fn(),
    };

    mockPrismaClient = {
      Prisma,
    };

    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();

    errorHandlerMiddleware = new ErrorHandlerMiddleware({
      logger: mockLogger,
      responseFormatter: mockResponseFormatter,
      prismaClient: mockPrismaClient,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle BusinessError', () => {
      const err = new BusinessError({
        message: 'Custom error',
        code: 'CUSTOM_CODE',
        statusCode: 418,
      });
      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith('ErrorHandler:', err);
      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Custom error',
        code: 'CUSTOM_CODE',
        statusCode: 418,
        fields: null,
      });
    });

    it('should handle PrismaClientKnownRequestError P2002 (Duplicate)', () => {
      const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
      err.code = 'P2002';
      err.meta = { target: ['email'] };
      err.clientVersion = '1.0';

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Duplicate value for unique field: email',
        code: 'CONFLICT',
        statusCode: 409,
        fields: null,
      });
    });

    it('should handle PrismaClientKnownRequestError P2025 (Not Found)', () => {
      const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
      err.code = 'P2025';
      err.clientVersion = '1.0';

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Record not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        fields: null,
      });
    });

    it('should handle PrismaClientKnownRequestError Default', () => {
      const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
      err.code = 'P9999';
      err.meta = { message: 'Some meta message' };
      err.clientVersion = '1.0';

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Some meta message',
        code: 'BAD_REQUEST',
        statusCode: 400,
        fields: null,
      });
    });

    it('should handle PrismaClientKnownRequestError Default without meta message', () => {
      const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
      err.code = 'P9999';
      err.meta = {};
      err.message = 'Fallback message';
      err.clientVersion = '1.0';

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Fallback message',
        code: 'BAD_REQUEST',
        statusCode: 400,
        fields: null,
      });
    });

    it('should handle PrismaClientKnownRequestError Default with no message (final fallback)', () => {
      const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
      err.code = 'P9999';
      err.meta = {};
      err.message = ''; // Empty string to trigger fallback
      err.clientVersion = '1.0';

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Bad request',
        code: 'BAD_REQUEST',
        statusCode: 400,
        fields: null,
      });
    });

    it('should handle BusinessError defaults', () => {
      const err = new BusinessError({});
      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Something went wrong',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        fields: null,
      });
    });

    it('should handle BusinessError with missing properties (fallback coverage)', () => {
      const err = new BusinessError({});
      // Force properties to be undefined to test middleware fallbacks
      err.code = undefined;
      err.message = undefined;
      err.statusCode = undefined;

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Business logic error',
        code: 'BUSINESS_ERROR',
        statusCode: 400,
        fields: null,
      });
    });

    it('should call next if no error', () => {
      errorHandlerMiddleware.errorHandler(null, mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle PrismaClientValidationError', () => {
      // Mock PrismaClientValidationError to behave as expected for instanceof check
      const OriginalPrismaClientValidationError = Prisma.PrismaClientValidationError;

      // We create a mock class that extends Error to pass instanceof check if possible,
      // or we just skip this test if we can't instantiate it.
      // But we can monkey-patch the prototype if needed.

      // Actually, let's just create a dummy class and assign it to Prisma.PrismaClientValidationError for the test.
      // But Prisma is imported from a module. We need to mock the module or the property on the mockPrismaClient if the middleware used it from there.
      // But middleware imports Prisma directly from the module.

      // Let's rely on Object.setPrototypeOf or similar if we can't construct it.
      // The error said: "new t (src/infra/db/generated/prisma/runtime/library.js:24:2331)" failed.

      // Let's skip the constructor issue by creating an object and setting its prototype.
      const err = Object.create(Prisma.PrismaClientValidationError.prototype);
      err.message = 'Validation failed\nInvalid value';

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Invalid value',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        fields: null,
      });
    });

    it('should handle Joi/ValidationError', () => {
      const err = new Error('Joi validation error');
      err.name = 'ValidationError';
      err.details = [{ path: ['field'], message: 'Field invalid' }];

      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Joi validation error',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        fields: [{ field: 'field', message: 'Field invalid' }],
      });
    });

    it('should handle generic Error', () => {
      const err = new Error('Generic error');
      errorHandlerMiddleware.errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockResponseFormatter.errorResponse).toHaveBeenCalledWith(mockRes, {
        message: 'Something went wrong',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        fields: null,
      });
    });
  });
});
