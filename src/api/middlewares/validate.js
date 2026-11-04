class ValidateMiddleware {
  constructor({ businessException }) {
    this.businessException = businessException;
  }

  getValueToValidate(req, type) {
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
  }

  generateJoiErrorMessage(err = {}) {
    let errorMessage = 'Validation failed';

    const { message, type } = err || {};
    switch (type) {
      case 'object.unknown':
      case 'any.required':
      case 'string.empty':
      case 'string.max':
      case 'any.unknown':
      case 'any.only':
      case 'number.min':
        errorMessage = message;
        break;
      case 'string.guid':
        errorMessage = 'id must be a valid value';
        break;
      case 'any.custom':
        // Custom rules (e.g. report date ranges) put their human message in the context.
        errorMessage = err.context?.message || errorMessage;
        break;
      default:
        errorMessage = 'Validation failed';
        break;
    }

    return errorMessage;
  }

  validate(schema, type = 'body') {
    const allowedTypes = ['body', 'query', 'params'];
    return (req, res, next) => {
      if (!allowedTypes.includes(type)) {
        throw this.businessException.BadRequest('Invalid validation type');
      }
      // Prevent prototype pollution and object injection
      const dataToValidate = this.getValueToValidate(req, type);

      const { error } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: false,
      });

      if (error) {
        const err = error && error.details && error.details[0];
        const errorMessage = this.generateJoiErrorMessage(err);
        throw this.businessException.BadRequest(errorMessage);
      }

      next();
    };
  }
}

module.exports = ValidateMiddleware;
