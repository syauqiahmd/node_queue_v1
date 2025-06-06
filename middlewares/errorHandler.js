// middlewares/errorHandler.js
const { Prisma } = require('../generated/prisma');
const { errorResponse } = require('../utils/response');

module.exports = (err, req, res, next) => {
  console.error(err);

  // Default error format
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong';
  let statusCode = 500;
  let fields = null;

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        code = 'CONFLICT';
        message = `Duplicate value for unique field: ${err.meta?.target?.join(', ')}`;
        statusCode = 409;
        fields = err.meta?.target;
        break;

      case 'P2025': // Record not found
        code = 'NOT_FOUND';
        message = 'Record not found';
        statusCode = 404;
        break;

      case 'P2023': // Record not found
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

  } else if (err instanceof Prisma.PrismaClientValidationError) {
    code = 'VALIDATION_ERROR';
    message = err.message.split('\n').pop().trim();
    statusCode = 400;

  } else if (err.name === 'ValidationError') {
    // Joi or custom validation
    code = 'VALIDATION_ERROR';
    message = err.message;
    statusCode = 400;
    fields = err.details?.map(d => ({
      field: d.path.join('.'),
      message: d.message,
    }));
  }

  return errorResponse(res, {
    message,
    code,
    statusCode,
    fields,
  });
};
