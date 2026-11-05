const toTicketCreatedDTO = require('../dto/websocket/TicketCreatedDTO');
const { nowInAppTz, todayInAppTz } = require('../utils/date');
const { logTicketEvent } = require('../utils/ticketEvents');

class TicketService {
  constructor({ prismaClient, businessException, broadcastService, logger }) {
    this.prisma = prismaClient;
    this.businessException = businessException;
    this.broadcastService = broadcastService;
    this.logger = logger;
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
    logTicketEvent(this.logger, 'created', newTicket, {
      waitingCount: totalWaitingQueue.totalRecords,
    });

    return { newTicket, totalWaitingQueue };
  }

  async countPeopleAhead(ticket, sameQueue) {
    if (ticket.isPriority) {
      // Priority tickets are dequeued oldest-first among themselves (see
      // queueService.callNextQueue), so only earlier priority tickets are ahead.
      return this.prisma.ticket.count({
        where: { ...sameQueue, isPriority: true, createdAt: { lt: ticket.createdAt } },
      });
    }
    // callNextQueue always drains every waiting priority ticket before serving
    // a non-priority one, so ALL waiting priority tickets count as "ahead" of a
    // non-priority ticket, regardless of creation order.
    const [priorityAhead, normalAhead] = await Promise.all([
      this.prisma.ticket.count({ where: { ...sameQueue, isPriority: true } }),
      this.prisma.ticket.count({
        where: { ...sameQueue, isPriority: false, createdAt: { lt: ticket.createdAt } },
      }),
    ]);
    return priorityAhead + normalAhead;
  }

  async getQueuePosition(ticketId) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      throw this.businessException.NotFound('Ticket');
    }

    let status = 'waiting';
    if (ticket.isCall) {
      status = 'calling';
    }
    // Resolved wins over calling.
    if (ticket.isResolved) {
      status = 'resolved';
    }

    let peopleAhead = null;
    let queueRank = null;

    if (status === 'waiting') {
      // Same service/day, still-waiting tickets other than this one.
      const sameQueue = {
        serviceId: ticket.serviceId,
        queueDate: ticket.queueDate,
        isCall: false,
        id: { not: ticket.id },
      };

      peopleAhead = await this.countPeopleAhead(ticket, sameQueue);

      // 1-indexed spot in line: 0 people ahead means you're #1 (next up).
      queueRank = peopleAhead + 1;
    }

    const totalWaiting = await this.prisma.ticket.count({
      where: { serviceId: ticket.serviceId, queueDate: ticket.queueDate, isCall: false },
    });

    return {
      ticketId: ticket.id,
      serviceId: ticket.serviceId,
      // Display format matches the one used when the ticket is created (e.g. "A-005").
      queueNumber: `${ticket.prefix}-${String(ticket.queueNumber).padStart(3, '0')}`,
      status,
      peopleAhead,
      queueRank,
      totalWaiting,
    };
  }
}

module.exports = TicketService;
