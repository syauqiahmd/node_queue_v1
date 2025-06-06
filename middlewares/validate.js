// middlewares/validate.js
const { errorResponse } = require('../utils/response');

module.exports = (schema, type = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[type], {
      abortEarly: false,
      stripUnknown: false,
    });

    let errorMessage = 'Validation failed';

    if (error) {
      const err = error && error.details && error.details[0]
      const { message, type } = err || {};

      switch (type) {
        case 'object.unknown':
        case 'any.required':
        case 'string.empty':
        case 'string.max':
          errorMessage = message;
          break;
        default:
          break;
      }
      return errorResponse(res, {
        message: errorMessage,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    req[type] = value;
    next();
  };
};
