const toTicketCreatedDTO = require('../dto/websocket/TicketCreatedDTO');
const { nowInAppTz, todayInAppTz } = require('../utils/date');

class TicketService {
  constructor({ prismaClient, businessException, broadcastService }) {
    this.prisma = prismaClient;
    this.businessException = businessException;
    this.broadcastService = broadcastService;
  }

  async generateQueueNumberAndCreateTicket({
    serviceId,
    updatedBy = null,
    latestAssigneeCounterId = null,
  }) {
    const today = todayInAppTz();

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { prefix: true },
    });

    if (!service) {
      throw this.businessException.NotFound('Service');
    }
    const prefix = service.prefix;
    const totalWaitingQueue = {
      totalRecords: 0,
    };

    const newTicket = await this.prisma.$transaction(async (tx) => {
      // get last ticket for prefix, service, and today inside transaction
      const [lastTicket, totalWaitingQueueByServiceId] = await Promise.all([
        tx.ticket.findFirst({
          where: {
            serviceId,
            queueDate: today,
          },
          orderBy: { queueNumber: 'desc' },
        }),
        tx.ticket.count({
          where: {
            serviceId,
            queueDate: today,
            isCall: false,
          },
        }),
      ]);

      totalWaitingQueue.totalRecords = totalWaitingQueueByServiceId;

      const nextQueueNumber = lastTicket ? lastTicket.queueNumber + 1 : 1;
      const timeStamp = nowInAppTz();

      return tx.ticket.create({
        data: {
          queueNumber: nextQueueNumber,
          prefix,
          queueDate: today,
          serviceId,
          createdAt: timeStamp,
          updatedAt: timeStamp,
          updatedBy, // your updatedBy value here
          latestAssigneeCounterId, // optional
        },
        include: {
          service: {
            include: {
              organization: true,
            },
          },
        },
      });
    });

    // Broadcast the new ticket event
    const rooms = [`service-${newTicket.serviceId}`];
    this.broadcastService.emit('ticket:created', toTicketCreatedDTO(newTicket), rooms);

    return { newTicket, totalWaitingQueue };
  }
}

module.exports = TicketService;
