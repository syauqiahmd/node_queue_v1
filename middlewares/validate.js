// middlewares/validate.js
const { errorResponse } = require('../utils/response');

module.exports = (schema, type = 'body') => {
  const allowedTypes = ['body', 'query', 'params'];
  return (req, res, next) => {
    if (!allowedTypes.includes(type)) {
      return errorResponse(res, {
        message: 'Invalid validation type',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    // Prevent prototype pollution and object injection
    let dataToValidate;
    switch (type) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      default:
        dataToValidate = {};
    }

    const { error } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: false,
    });

    let errorMessage = 'Validation failed';

    if (error) {
      const err = error && error.details && error.details[0];
      const { message, type } = err || {};

      switch (type) {
        case 'object.unknown':
        case 'any.required':
        case 'string.empty':
        case 'string.max':
        case 'any.unknown':
          errorMessage = message;
          break;
        case 'string.guid':
          errorMessage = 'id must be a valid value';
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

    next();
  };
};
