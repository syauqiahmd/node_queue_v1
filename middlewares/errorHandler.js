// middlewares/errorHandler.js
const { Prisma } = require('../generated/prisma');
const { errorResponse } = require('../utils/response');
const { BusinessError } = require('../utils/businessException');
const logger = require('../utils/logger');

// Default error format
let code = 'INTERNAL_SERVER_ERROR';
let message = 'Something went wrong';
let statusCode = 500;
let fields = null;

const generatePrismaErrorMessage = (err) => {
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
};

module.exports = (err, req, res, _next) => {
  if (!err) {
    _next();
  }

  logger.error('ErrorHandler:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    generatePrismaErrorMessage(err);
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    code = 'VALIDATION_ERROR';
    message = err.message.split('\n').pop().trim();
    statusCode = 400;
  }
  if (err.name === 'ValidationError') {
    // Joi or custom validation
    code = 'VALIDATION_ERROR';
    message = err.message;
    statusCode = 400;
    fields = err.details?.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
  }

  if (err instanceof BusinessError) {
    // Custom business exception
    code = err.code || 'BUSINESS_ERROR';
    message = err.message || 'Business logic error';
    statusCode = err.statusCode || 400;
    fields = err.fields || null;
  }
  return errorResponse(res, {
    message,
    code,
    statusCode,
    fields,
  });
};
