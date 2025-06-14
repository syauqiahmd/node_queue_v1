const ticketService = require('../services/ticketService');
const { successResponse } = require('../utils/response');
const broadcastService = require('../services/broadcastService');

const create = async (req, res, next) => {
  try {
    const data = await ticketService.generateQueueNumberAndCreateTicket(req.body);
    const { newTicket, totalWaitingQueue } = data;
    const responseData = {
      id: newTicket.id,
      queueNumber: `${newTicket.prefix}-${String(newTicket.queueNumber).padStart(3, '0')}`,
      serviceId: newTicket.service.id,
      serviceName: newTicket.service.name,
      organizationId: newTicket.service.organization.id,
      organizationName: newTicket.service.organization.name,
      organizationFullName: newTicket.service.organization.fullName,
      createdAt: newTicket.createdAt,
      totalWaitingQueue: totalWaitingQueue.totalRecords,
    };
    broadcastService.createTicketEvent({ serviceId: req.body.serviceId, data });
    return successResponse(res, responseData, 'Created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
};
