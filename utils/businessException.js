// errors/BusinessError.js
class BusinessError extends Error {
  constructor({
    code = 'INTERNAL_SERVER_ERROR',
    message = 'Something went wrong',
    statusCode = 500,
    fields = null,
  }) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  BusinessError,
  NotFound: (item = 'data') =>
    new BusinessError({ code: 'NOT_FOUND', message: `${item} not found`, statusCode: 404 }),

  Unauthorized: (message = 'Unauthorized') =>
    new BusinessError({ code: 'UNAUTHORIZED', message, statusCode: 401 }),

  ExpiredSession: () =>
    new BusinessError({
      code: 'UNAUTHORIZED',
      message: 'Session expired or invalid',
      statusCode: 401,
    }),

  unCalledQueue: () =>
    new BusinessError({ code: 'UNAUTHORIZED', message: 'Queue not yet called', statusCode: 401 }),
};
