const ticketService = require('../services/ticketService');
const { successResponse } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const data = await ticketService.generateQueueNumberAndCreateTicket(req.body);
    return successResponse(res, data, 'Created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
};
