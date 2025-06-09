// middlewares/validate.js
const { errorResponse } = require('../utils/response');

const getValueToValidate = (req, type) => {
  switch (type) {
    case 'body':
      return req.body;
    case 'query':
      return req.query;
    case 'params':
      return req.params;
    default:
      return {};
  }
};

const generateJoiErrorMessage = (err = {}) => {
  let errorMessage = 'Validation failed';

  const { message, type } = err || {};
  switch (type) {
    case 'object.unknown':
    case 'any.required':
    case 'string.empty':
    case 'string.max':
    case 'any.unknown':
    case 'any.only':
      errorMessage = message;
      break;
    case 'string.guid':
      errorMessage = 'id must be a valid value';
      break;
    default:
      errorMessage = 'Validation failed';
      break;
  }

  return errorMessage;
};

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
    const dataToValidate = getValueToValidate(req, type);

    const { error } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: false,
    });

    let errorMessage = 'Validation failed';

    if (error) {
      const err = error && error.details && error.details[0];
      errorMessage = generateJoiErrorMessage(err);
      return errorResponse(res, {
        message: errorMessage,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    next();
  };
};
