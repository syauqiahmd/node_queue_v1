class PrivateController {
  constructor({ responseFormatter }) {
    this.responseFormatter = responseFormatter;
  }

  ping = async (req, res, next) => {
    try {
      this.responseFormatter.successResponse(res, { service: req.service.name }, 'pong');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = PrivateController;
