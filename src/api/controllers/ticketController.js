class TicketController {
  constructor({ ticketService, broadcastService }) {
    this.ticketService = ticketService;
    this.broadcastService = broadcastService;
  }

  async create(req, res, next) {
    try {
      const data = await this.ticketService.generateQueueNumberAndCreateTicket(req.body);
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
      this.broadcastService.emit('new-ticket', responseData, [req.body.serviceId]);
      return res.status(201).json({ success: true, data: responseData, message: 'Created' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TicketController;
