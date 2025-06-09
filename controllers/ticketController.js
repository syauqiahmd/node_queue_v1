const ticketService = require('../services/ticketService');
const { successResponse } = require('../utils/response');
const broadcastService = require('../services/broadcastService');

const create = async (req, res, next) => {
  try {
    const data = await ticketService.generateQueueNumberAndCreateTicket(req.body);
    broadcastService.createTicketEvent({ serviceId: req.body.serviceId, data });
    return successResponse(res, data, 'Created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
};
