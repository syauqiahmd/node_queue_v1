class ResponseFormatter {
  constructor({ logger }) {
    this.logger = logger;
  }

  successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
    const response = {
      success: true,
      message,
    };

    if (typeof data === 'object' && data !== null && 'totalRecord' in data) {
      response.totalRecord = data.totalRecord;
      response.data = data.data !== undefined ? data.data : data;
    } else {
      response.data = data;
    }
    this.logger.info(`response: ${JSON.stringify(response)}`, {
      context: '[SUCCESS]',
      statusCode,
    });
    return res.status(statusCode).json(response);
  };

  errorResponse = (
    res,
    {
      message = 'Something went wrong',
      code = 'INTERNAL_SERVER_ERROR',
      statusCode = 500,
      fields = null,
    } = {}
  ) => {
    const errorBody = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (fields) {
      errorBody.error.fields = fields;
    }
    this.logger.error(`response: ${JSON.stringify(errorBody)}`, {
      context: '[ERROR]',
      statusCode,
      errorCode: code,
      errorMessage: message,
    });
    return res.status(statusCode).json(errorBody);
  };
}

module.exports = ResponseFormatter;
