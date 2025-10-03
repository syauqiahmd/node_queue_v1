const { BusinessError } = require('../../infra/utils/businessException');
const { Prisma } = require('../../infra/db/generated/prisma/client');

class ErrorHandlerMiddleware {
  constructor({ logger, responseFormatter, prismaClient }) { // Inject prismaClient
    this.logger = logger;
    this.responseFormatter = responseFormatter;
    this.prisma = prismaClient; // Assign prismaClient to this.prisma
  }

  generatePrismaErrorMessage(err) {
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Something went wrong';
    let statusCode = 500;

    switch (err.code) {
      case 'P2002': // Unique constraint failed
        code = 'CONFLICT';
        message = `Duplicate value for unique field: ${err.meta?.target?.join(', ')}`;
        statusCode = 409;
        break;

      case 'P2025': // Record to delete does not exist
      case 'P2023': // Record to update does not exist
      case 'P2003': // Foreign key constraint failed
        code = 'NOT_FOUND';
        message = 'Record not found';
        statusCode = 404;
        break;

      default:
        code = 'BAD_REQUEST';
        message = err.meta.message || err.message || 'Bad request';
        statusCode = 400;
        break;
    }
    return { code, message, statusCode };
  }

  errorHandler = (err, req, res, _next) => {
    console.log('🚀 ---------------------------------------🚀');
    console.log('🚀 ~ ErrorHandlerMiddleware ~ err:', err);
    console.log('🚀 ---------------------------------------🚀');
    if (!err) {
      _next();
    }

    this.logger.error('ErrorHandler:', { err });

    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Something went wrong';
    let statusCode = 500;
    let fields = null;

    // Prisma known errors
    // Use this.prisma.Prisma instead of Prisma directly
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      ({ code, message, statusCode } = this.generatePrismaErrorMessage(err));
    }
    else if (err instanceof Prisma.PrismaClientValidationError) {
      code = 'VALIDATION_ERROR';
      message = err.message.split('\n').pop().trim();
      statusCode = 400;
    }
    else if (err.name === 'ValidationError') {
      // Joi or custom validation
      code = 'VALIDATION_ERROR';
      message = err.message;
      statusCode = 400;
      fields = err.details?.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
    }
    else if (err instanceof BusinessError) {
      // Custom business exception
      code = err.code || 'BUSINESS_ERROR';
      message = err.message || 'Business logic error';
      statusCode = err.statusCode || 400;
      fields = err.fields || null;
    }

    return this.responseFormatter.errorResponse(res, {
      message,
      code,
      statusCode,
      fields,
    });
  };
}

module.exports = ErrorHandlerMiddleware;
